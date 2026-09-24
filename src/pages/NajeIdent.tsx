import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Clapperboard, Sparkles, Wand2 } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAppStore } from '../store';
import { auth, db } from '../firebase';
import { hasFeatureAccess } from '../lib/featureAccess';
import { estimateOmniPoints } from '../lib/omniAd';
import {
  apiAspect,
  applyHandoff,
  applyHeroPreset,
  applyTemplate,
  applyVariation,
  composeMotionPrompt,
  computeMotionPlan,
  directorStepForProgress,
  loadDraft,
  readPromptHandoff,
  resolveSlot,
  saveDraft,
  stripDataUrl,
  surpriseDirection,
  type HeroPresetId,
  type IdentSlot,
  type MotionDraft,
  type MotionKind,
} from '../lib/motionStudio';
import FeaturePaywallModal from '../components/FeaturePaywallModal';
import NajeThinking from '../components/NajeThinking';
import StudioBootSplash from '../components/StudioBootSplash';
import { BestPracticeHints } from '../components/najeMotion/BestPracticeHints';
import { BrandKit } from '../components/najeMotion/BrandKit';
import { DirectionPanel } from '../components/najeMotion/DirectionPanel';
import { FormatBar } from '../components/najeMotion/FormatBar';
import { HeroLaunch } from '../components/najeMotion/HeroLaunch';
import { KindCards } from '../components/najeMotion/KindCards';
import { Monitor, type SlotResult } from '../components/najeMotion/Monitor';
import { MotionPlanView } from '../components/najeMotion/MotionPlanView';
import { PromptPreview } from '../components/najeMotion/PromptPreview';
import { StyleTemplates } from '../components/najeMotion/StyleTemplates';
import { Chip, FieldLabel, StudioCard } from '../components/najeMotion/StudioUi';
import { usePricingConfig } from '../hooks/usePricingConfig';
import { useI18n } from '../i18n';
import { toast } from '../toastStore';

export default function NajeIdent() {
  const { user, updateBalance } = useAppStore();
  const { t, isRtl, formatNumber } = useI18n();
  const { najeAd } = usePricingConfig();
  const pointsRate = typeof najeAd?.pointsRatePerSecond === 'number' ? najeAd.pointsRatePerSecond : 2.5;
  const resMul = najeAd?.resolutionMultiplier;

  const [draft, setDraft] = useState<MotionDraft>(() => loadDraft());
  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<any>(null);
  const [generatingSlot, setGeneratingSlot] = useState<IdentSlot | null>(null);
  const [results, setResults] = useState<Partial<Record<IdentSlot, SlotResult>>>({});
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studioEntered, setStudioEntered] = useState(() => Boolean(loadDraft().brandName.trim()));
  const generatingSlotRef = useRef<IdentSlot | null>(null);
  const kindRef = useRef(draft.kind);

  const slot = resolveSlot(draft.kind, draft.activePiece);
  const beats = useMemo(() => computeMotionPlan(draft, slot), [draft, slot]);
  const points = estimateOmniPoints({
    durationSec: 10,
    resolution: draft.resolution,
    pointsRatePerSecond: pointsRate,
    resolutionMultiplier: resMul,
  });

  const patch = useCallback((partial: Partial<MotionDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    const handoff = readPromptHandoff();
    if (handoff) {
      setDraft((prev) => applyHandoff(prev, handoff));
      setStudioEntered(true);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => saveDraft(draft), 280);
    return () => window.clearTimeout(t);
  }, [draft]);

  useEffect(() => {
    generatingSlotRef.current = generatingSlot;
  }, [generatingSlot]);

  useEffect(() => {
    kindRef.current = draft.kind;
  }, [draft.kind]);

  useEffect(() => {
    if (!jobId) return;
    const unsub = onSnapshot(doc(db, 'generation_jobs', jobId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setJob(data);
      if (['completed', 'failed'].includes(data.status)) setBusy(false);
      if (data.status === 'failed') setError(data.error || t('common.operationFailed'));
      const url = data.videoUrl || data.mediaUrl;
      const doneSlot = generatingSlotRef.current;
      if (data.status === 'completed' && url && doneSlot) {
        setResults((prev) => ({ ...prev, [doneSlot]: { jobId, videoUrl: url } }));
        if (kindRef.current === 'both' && doneSlot === 'intro') {
          toast.success(t('najeIdent.introReadyNext'));
        }
      }
    });
    return () => unsub();
  }, [jobId, t]);

  const selectKind = (kind: MotionKind, preset?: HeroPresetId) => {
    if (preset) {
      setDraft((prev) => applyHeroPreset(prev, preset));
      return;
    }
    patch({
      kind,
      activePiece: kind === 'outro' ? 'outro' : 'intro',
    });
  };

  const enterStudio = (kind: MotionKind, preset?: HeroPresetId) => {
    setDraft((prev) => applyHeroPreset(prev, preset || kind));
    setStudioEntered(true);
  };

  const generate = async (nextDraft?: MotionDraft) => {
    const d = nextDraft || draft;
    const currentSlot = resolveSlot(d.kind, d.activePiece);
    if (!d.brandName.trim()) {
      toast.error(t('najeIdent.visionLabel') ? t('najeIdent.subtitle') : 'Brand name required');
      return;
    }
    if (!hasFeatureAccess(user, 'najeAd')) {
      setPaywall(true);
      return;
    }
    if (najeAd?.enabled === false) {
      toast.error(t('common.serviceUnavailable'));
      return;
    }
    setError(null);
    setBusy(true);
    setGeneratingSlot(currentSlot);
    generatingSlotRef.current = currentSlot;
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      setBusy(false);
      setGeneratingSlot(null);
      toast.error(t('auth.signInPrompt'));
      return;
    }
    const prompt = composeMotionPrompt(d, currentSlot);
    try {
      const res = await fetch('/api/naje-ad/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          prompt,
          duration: 10,
          aspectRatio: apiAspect(d.aspect),
          resolution: d.resolution,
          model: 'omni-1.1',
          productName: d.brandName.trim(),
          productImageBase64: stripDataUrl(d.logo),
        }),
      });
      const data = await res.json();
      if (res.status === 402 || data?.error === 'feature_locked') {
        setPaywall(true);
        setBusy(false);
        setGeneratingSlot(null);
        if (data?.error && data.error !== 'feature_locked') setError(data.error);
        return;
      }
      if (!res.ok) throw new Error(data.error || t('common.error'));
      if (typeof data.newBalance === 'number') updateBalance(data.newBalance);
      if (data.jobId) {
        setJobId(data.jobId);
        setResults((prev) => ({ ...prev, [currentSlot]: { jobId: data.jobId, videoUrl: prev[currentSlot]?.videoUrl } }));
      } else {
        setBusy(false);
        setGeneratingSlot(null);
      }
    } catch (e: any) {
      setBusy(false);
      setGeneratingSlot(null);
      setError(e.message || t('common.error'));
    }
  };

  const runVariation = (id: string) => {
    const next = applyVariation(draft, id);
    setDraft(next);
    void generate(next);
  };

  const runSurprise = () => {
    const next = surpriseDirection(draft);
    setDraft(next);
    toast.success('اتجاه جديد مع بقاء الهوية مقفولة إن كانت مفعّلة');
  };

  const stepLabel =
    job?.status === 'queued'
      ? t('najeIdent.queueStatus', { position: String(job?.queuePosition || '…') })
      : job?.stepLabel || (busy ? directorStepForProgress(job?.progress || 0) : '');

  const generateLabel = () => {
    if (busy) return stepLabel || t('najeIdent.producingIdent');
    const piece =
      slot === 'outro' ? t('najeIdent.outroPiece') : slot === 'logo' ? t('najeIdent.logoPiece') : t('najeIdent.introPiece');
    if (draft.kind === 'both' && slot === 'intro' && !results.intro?.videoUrl) {
      return t('najeIdent.produceFirst', { duration: String(draft.duration) });
    }
    if (draft.kind === 'both' && slot === 'outro' && results.intro?.videoUrl && !results.outro?.videoUrl) {
      return t('najeIdent.produceOutroDuration', { duration: String(draft.duration) });
    }
    return t('najeIdent.producePieceDuration', { piece, duration: String(draft.duration) });
  };

  const hasResults = Object.values(results).some((r) => r?.videoUrl);
  const showHero = !studioEntered && !hasResults;
  const presetBadge =
    draft.projectType === 'podcast' || draft.projectType === 'channel' ? draft.projectType : '';

  return (
    <div
      className={`naje-ad-studio relative h-full overflow-y-auto bg-[#0b0c10] px-3 pt-4 text-[#f4efe6] sm:px-6 ${
        showHero ? 'pb-8' : 'pb-28 lg:pb-8'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <StudioBootSplash dark />
      <FeaturePaywallModal isOpen={paywall} onClose={() => setPaywall(false)} feature="najeAd" />

      <div className="mx-auto max-w-6xl space-y-4">
        {showHero ? (
          <>
            <div className="flex justify-end">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-1.5 text-end sm:px-4 sm:py-2">
                <div className="text-[10px] text-white/40">{t('najeIdent.yourBalance')}</div>
                <div className="font-mono text-base font-black text-[#e8b86d] sm:text-lg">
                  {formatNumber(user?.balance ?? 0)} {t('common.pointsShort') || 'نقطة'}
                </div>
              </div>
            </div>
            <HeroLaunch onChoose={enterStudio} />
          </>
        ) : (
          <>
            <header className="rounded-2xl border border-white/8 bg-[radial-gradient(1200px_circle_at_100%_-20%,rgba(212,165,116,0.22),transparent_45%),linear-gradient(180deg,#16120e,#0b0c10)] p-4 shadow-2xl sm:rounded-[28px] sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {!hasResults && (
                    <button
                      type="button"
                      onClick={() => setStudioEntered(false)}
                      className="mb-2 inline-flex min-h-[44px] items-center text-[11px] font-black text-white/45 hover:text-[#e8b86d]"
                    >
                      {t('najeIdent.backToStart')}
                    </button>
                  )}
                  <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-[#d4a574]/30 bg-[#d4a574]/10 px-2.5 py-0.5 text-[10px] font-black tracking-[0.14em] text-[#e8b86d]">
                    <Clapperboard className="h-3.5 w-3.5" /> NAJE MOTION
                  </div>
                  <h1 className="text-xl font-black leading-snug tracking-tight text-white sm:text-2xl">
                    {t('najeIdent.title')}
                  </h1>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/50">
                    {t('najeIdent.subtitle')}
                  </p>
                  <p className="mt-1.5 text-[11px] font-bold text-[#e8b86d]">{t('najeIdent.tagline')}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-1.5 text-end sm:px-4 sm:py-2">
                  <div className="text-[10px] text-white/40">{t('najeIdent.yourBalance')}</div>
                  <div className="font-mono text-base font-black text-[#e8b86d] sm:text-lg">
                    {formatNumber(user?.balance ?? 0)} {t('common.pointsShort') || 'نقطة'}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <KindCards value={draft.kind} onChange={selectKind} preset={presetBadge} />
              </div>
              {draft.kind === 'both' && (
                <div className="mt-3 rounded-2xl border border-white/8 bg-black/25 p-3">
                  <p className="mb-2 text-[10px] leading-relaxed text-white/45">
                    {t('najeIdent.bothPieceDesc')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Chip
                      active={draft.activePiece === 'intro'}
                      onClick={() => patch({ activePiece: 'intro' })}
                      className="w-full justify-center py-2.5"
                    >
                      {t('najeIdent.produceIntro')}{results.intro?.videoUrl ? ` — ${t('najeIdent.ready')}` : ''}
                    </Chip>
                    <Chip
                      active={draft.activePiece === 'outro'}
                      onClick={() => patch({ activePiece: 'outro' })}
                      className="w-full justify-center py-2.5"
                    >
                      {t('najeIdent.produceOutro')}{results.outro?.videoUrl ? ` — ${t('najeIdent.ready')}` : ''}
                    </Chip>
                  </div>
                  {results.intro?.videoUrl && !results.outro?.videoUrl && draft.activePiece === 'intro' && (
                    <p className="mt-2 text-[10px] font-bold text-[#e8b86d]">{t('najeIdent.introReadyNext')}</p>
                  )}
                </div>
              )}
            </header>

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                <p className="inline-flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {error}
                    <span className="mt-1 block text-[10px] text-rose-100/70">
                      المسودة محفوظة محلياً. لم يُفقد المشروع.
                    </span>
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      void generate();
                    }}
                    className="min-h-[44px] rounded-xl border border-rose-300/40 px-3 font-black"
                  >
                    إعادة المحاولة
                  </button>
                  <button type="button" onClick={() => setError(null)} className="min-h-[44px] font-bold text-rose-100/80">
                    {t('common.close')}
                  </button>
                </div>
              </div>
            )}

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="space-y-4">
                <FormatBar
                  duration={draft.duration}
                  aspect={draft.aspect}
                  resolution={draft.resolution}
                  onDuration={(duration) => patch({ duration })}
                  onAspect={(aspect) => patch({ aspect })}
                  onResolution={(resolution) => patch({ resolution })}
                />
                <BrandKit draft={draft} onChange={patch} />
                <StyleTemplates styleId={draft.styleId} onSelect={(id) => setDraft((prev) => applyTemplate(prev, id))} />
                <DirectionPanel draft={draft} slot={slot} onChange={patch} />
                <button
                  type="button"
                  disabled={busy}
                  onClick={runSurprise}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-[#d4a574]/35 bg-[#d4a574]/8 py-2.5 text-[12px] font-black text-[#e8b86d] disabled:opacity-50"
                >
                  <Wand2 className="h-4 w-4" /> فاجئني باتجاه آخر
                </button>
                <BestPracticeHints draft={draft} slot={slot} />
                <StudioCard title={t('najeIdent.visionTitle')} hint={t('najeIdent.visionHint')}>
                  <FieldLabel>{t('najeIdent.visionLabel')}</FieldLabel>
                  <textarea
                    rows={4}
                    value={draft.vision}
                    maxLength={1200}
                    onChange={(e) => patch({ vision: e.target.value })}
                    placeholder={t('najeIdent.visionPlaceholder')}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
                  />
                </StudioCard>
              </div>

              <div className="space-y-4 lg:sticky lg:top-3">
                <MotionPlanView beats={beats} duration={draft.duration} />
                <PromptPreview draft={draft} slot={slot} beats={beats} />

                <div className="hidden space-y-2 lg:block">
                  <p className="text-center text-[11px] text-white/45">
                    <span className="font-black text-[#e8b86d]">{formatNumber(points)} {t('common.pointsShort')}</span>
                    <span className="mt-0.5 block text-[10px] text-white/35">
                      المحرك يولّد دائماً 10 ثوانٍ — الخمس ثوانٍ وخزة داخل النافذة.
                    </span>
                  </p>
                  <button
                    type="button"
                    disabled={busy || najeAd?.enabled === false}
                    onClick={() => void generate()}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#d4a574] via-[#e8b86d] to-[color-mix(in_srgb,#e8b86d_70%,white)] py-3.5 text-sm font-black text-[#1a140c] shadow-[0_12px_40px_-12px_rgba(212,165,116,0.45)] disabled:opacity-50"
                  >
                    {busy ? <NajeThinking size={22} /> : <Sparkles className="h-4 w-4" />}
                    {busy ? generateLabel() : `${generateLabel()} · ${formatNumber(points)} ${t('common.pointsShort')}`}
                  </button>
                </div>

                <Monitor
                  busy={busy}
                  stepLabel={stepLabel}
                  progress={job?.progress || 0}
                  generatingSlot={generatingSlot}
                  results={results}
                  activeSlot={slot}
                  kind={draft.kind}
                  aspect={draft.aspect}
                  platform={draft.platform}
                  duration={draft.duration}
                  brandName={draft.brandName}
                  hasLogo={Boolean(draft.logo)}
                  onRegenerate={() => void generate()}
                  onVariation={runVariation}
                />
                {hasResults && !busy && (
                  <div className="rounded-2xl border border-[#d4a574]/35 bg-[#d4a574]/10 p-4">
                    <p className="text-sm font-black text-white">هويتك الحركية جاهزة.</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/55">
                      حمّل الملف من المونيتور، أو عدّل ثم ولّد نسخة. المسودة تبقى.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setResults({});
                          setStudioEntered(false);
                        }}
                        className="min-h-[44px] rounded-xl border border-white/15 px-3 text-[11px] font-black text-white/70"
                      >
                        مشروع جديد
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {!showHero && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b0c10]/95 p-3 backdrop-blur lg:hidden">
          <p className="mb-2 text-center text-[10px] text-white/45">
            التكلفة التقديرية: <span className="font-black text-[#e8b86d]">{points} نقطة</span>
          </p>
          <button
            type="button"
            disabled={busy || najeAd?.enabled === false}
            onClick={() => void generate()}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#d4a574] via-[#e8b86d] to-[color-mix(in_srgb,#e8b86d_70%,white)] py-3.5 text-sm font-black text-[#1a140c] disabled:opacity-50"
          >
            {busy ? <NajeThinking size={22} /> : <Sparkles className="h-4 w-4" />}
            {busy ? generateLabel() : `${generateLabel()} · ${formatNumber(points)} ${t('common.pointsShort')}`}
          </button>
        </div>
      )}
    </div>
  );
}
