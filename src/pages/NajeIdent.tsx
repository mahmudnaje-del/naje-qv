import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Clapperboard, Sparkles, Wand2 } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAppStore } from '../store';
import { auth, db } from '../firebase';
import { hasFeatureAccess } from '../lib/featureAccess';
import { estimateOmniPoints } from '../lib/omniAd';
import {
  DIRECTOR_STEPS,
  apiAspect,
  applyHandoff,
  applyHeroPreset,
  applyTemplate,
  applyVariation,
  composeMotionPrompt,
  computeMotionPlan,
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
import { ContextStrip } from '../components/najeMotion/ContextStrip';
import { DirectionPanel } from '../components/najeMotion/DirectionPanel';
import { FormatBar } from '../components/najeMotion/FormatBar';
import { HeroLaunch } from '../components/najeMotion/HeroLaunch';
import { KindCards } from '../components/najeMotion/KindCards';
import { Monitor, type MotionVersion, type SlotResult } from '../components/najeMotion/Monitor';
import { MotionPlanView } from '../components/najeMotion/MotionPlanView';
import { PromptPreview } from '../components/najeMotion/PromptPreview';
import { StyleTemplates } from '../components/najeMotion/StyleTemplates';
import { Chip, FieldLabel, RegFrame, StudioCard, fieldClass } from '../components/najeMotion/StudioUi';
import { useMotionI18n } from '../components/najeMotion/i18n';
import { usePricingConfig } from '../hooks/usePricingConfig';
import { toast } from '../toastStore';

function stepIndex(progress: number) {
  let i = 0;
  DIRECTOR_STEPS.forEach((s, idx) => {
    if (progress >= s.at) i = idx;
  });
  return i;
}

export default function NajeIdent() {
  const { user, updateBalance } = useAppStore();
  const { t, isRtl, formatNumber } = useMotionI18n();
  const { najeAd } = usePricingConfig();
  const pointsRate = typeof najeAd?.pointsRatePerSecond === 'number' ? najeAd.pointsRatePerSecond : 2.5;
  const resMul = najeAd?.resolutionMultiplier;

  const [draft, setDraft] = useState<MotionDraft>(() => loadDraft());
  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<any>(null);
  const [generatingSlot, setGeneratingSlot] = useState<IdentSlot | null>(null);
  const [results, setResults] = useState<Partial<Record<IdentSlot, SlotResult>>>({});
  const [versions, setVersions] = useState<MotionVersion[]>([]);
  const [focusUrl, setFocusUrl] = useState<string | null>(null);
  const [compareUrl, setCompareUrl] = useState<string | null>(null);
  const [compareOn, setCompareOn] = useState(false);
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
  const clock = { full: formatNumber(10), sting: formatNumber(5) };
  const motionLabel = t(`motion.opt.motion.${draft.motion}`);
  const logoLabel = t(`motion.opt.logo.${draft.logoBehavior}`);
  const ctaLabel =
    draft.outroCta === 'custom' && draft.customCta.trim()
      ? draft.customCta.trim()
      : t(`motion.opt.cta.${draft.outroCta}`);

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
    const timer = window.setTimeout(() => saveDraft(draft), 280);
    return () => window.clearTimeout(timer);
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
      if (data.status === 'failed') setError(data.error || t('motion.error.failed'));
      const url = data.videoUrl || data.mediaUrl;
      const doneSlot = generatingSlotRef.current;
      if (data.status === 'completed' && url && doneSlot) {
        setResults((prev) => ({ ...prev, [doneSlot]: { jobId, videoUrl: url } }));
        setVersions((prev) => {
          const next = [{ slot: doneSlot, url, at: Date.now() }, ...prev.filter((v) => v.url !== url)];
          return next.slice(0, 8);
        });
        setFocusUrl(url);
        if (kindRef.current === 'both' && doneSlot === 'intro') {
          toast.success(t('motion.page.introNext'));
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
      toast.error(t('motion.page.needName'));
      return;
    }
    if (!hasFeatureAccess(user, 'najeAd')) {
      setPaywall(true);
      return;
    }
    if (najeAd?.enabled === false) {
      toast.error(t('motion.error.unavailable'));
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
      toast.error(t('motion.error.signIn'));
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
    toast.success(t('motion.page.surpriseToast'));
  };

  const stepLabel =
    job?.status === 'queued'
      ? t('motion.page.queue', { position: String(job?.queuePosition ?? '…') })
      : job?.stepLabel || (busy ? t(`motion.step.${stepIndex(job?.progress || 0)}`) : '');

  const generateLabel = () => {
    if (busy) return stepLabel || t('motion.page.producing');
    const piece = t(`motion.piece.${slot}`);
    const duration = formatNumber(draft.duration);
    if (draft.kind === 'both' && slot === 'intro' && !results.intro?.videoUrl) {
      return t('motion.page.produceFirst', { duration });
    }
    if (draft.kind === 'both' && slot === 'outro' && results.intro?.videoUrl && !results.outro?.videoUrl) {
      return t('motion.page.produceOutro', { duration });
    }
    return t('motion.page.producePiece', { piece, duration });
  };

  const hasResults = Object.values(results).some((r) => r?.videoUrl);
  const showHero = !studioEntered && !hasResults;
  const presetBadge = draft.projectType === 'podcast' || draft.projectType === 'channel' ? draft.projectType : '';

  const resetProject = () => {
    setResults({});
    setVersions([]);
    setFocusUrl(null);
    setCompareUrl(null);
    setCompareOn(false);
    setStudioEntered(false);
  };

  return (
    <div
      className={`naje-motion-studio relative h-full overflow-y-auto bg-[#07090f] px-3 pt-4 text-[#e7eef8] sm:px-6 ${
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
              <div className="rounded-2xl border border-[#8ec8ff]/18 bg-black/30 px-3 py-1.5 text-end sm:px-4 sm:py-2">
                <div className="text-[10px] text-[#93a0b5]">{t('motion.page.balance')}</div>
                <div className="font-mono text-base font-black text-[#ffb020] sm:text-lg">
                  {formatNumber(user?.balance ?? 0)} {t('common.pointsShort')}
                </div>
              </div>
            </div>
            <HeroLaunch onChoose={enterStudio} />
          </>
        ) : (
          <>
            <RegFrame className="rounded-2xl bg-[#10151f] p-4 sm:rounded-[28px] sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {!hasResults && (
                    <button
                      type="button"
                      onClick={() => setStudioEntered(false)}
                      className="mb-2 inline-flex min-h-[44px] items-center text-[11px] font-black text-[#93a0b5] hover:text-[#8ec8ff]"
                    >
                      {t('motion.page.back')}
                    </button>
                  )}
                  <div className="mb-1.5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#8ec8ff]/25 bg-[#8ec8ff]/10 px-2.5 py-0.5 text-[10px] font-black tracking-[0.14em] text-[#e7eef8]">
                    <span className="motion-tally inline-block h-2 w-2 rounded-full" aria-hidden />
                    <Clapperboard className="h-3.5 w-3.5 text-[#8ec8ff]" />
                    <span className="text-[#ffb020]">REC</span>
                    NAJE MOTION
                  </div>
                  <h1 className="text-xl font-black leading-snug tracking-tight text-[#e7eef8] sm:text-2xl">
                    {t('motion.page.title')}
                  </h1>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#93a0b5]">{t('motion.page.subtitle')}</p>
                  <p className="mt-1.5 text-[11px] font-bold text-[#8ec8ff]">{t('motion.page.tagline')}</p>
                </div>
                <div className="rounded-2xl border border-[#8ec8ff]/18 bg-black/30 px-3 py-1.5 text-end sm:px-4 sm:py-2">
                  <div className="text-[10px] text-[#93a0b5]">{t('motion.page.balance')}</div>
                  <div className="font-mono text-base font-black text-[#ffb020] sm:text-lg">
                    {formatNumber(user?.balance ?? 0)} {t('common.pointsShort')}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <KindCards value={draft.kind} onChange={selectKind} preset={presetBadge} />
              </div>
              {draft.kind === 'both' && (
                <div className="mt-3 rounded-2xl border border-[#8ec8ff]/12 bg-black/25 p-3">
                  <p className="mb-2 text-[10px] leading-relaxed text-[#93a0b5]">{t('motion.page.bothDesc')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Chip active={draft.activePiece === 'intro'} onClick={() => patch({ activePiece: 'intro' })} className="w-full justify-center py-2.5">
                      {t('motion.page.produceIntro')}
                      {results.intro?.videoUrl ? ` — ${t('motion.page.ready')}` : ''}
                    </Chip>
                    <Chip active={draft.activePiece === 'outro'} onClick={() => patch({ activePiece: 'outro' })} className="w-full justify-center py-2.5">
                      {t('motion.page.produceOutroBtn')}
                      {results.outro?.videoUrl ? ` — ${t('motion.page.ready')}` : ''}
                    </Chip>
                  </div>
                  {results.intro?.videoUrl && !results.outro?.videoUrl && draft.activePiece === 'intro' && (
                    <p className="mt-2 text-[10px] font-bold text-[#ffb020]">{t('motion.page.introNext')}</p>
                  )}
                </div>
              )}
            </RegFrame>

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                <p className="inline-flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {error}
                    <span className="mt-1 block text-[10px] text-rose-100/70">{t('motion.page.saved')}</span>
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
                    {t('common.retry')}
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
                <ContextStrip draft={draft} slot={slot} onChange={patch} />
                <BrandKit draft={draft} onChange={patch} />
                <StyleTemplates styleId={draft.styleId} onSelect={(id) => setDraft((prev) => applyTemplate(prev, id))} />
                <DirectionPanel draft={draft} slot={slot} onChange={patch} />
                <button
                  type="button"
                  disabled={busy}
                  onClick={runSurprise}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-[#8ec8ff]/35 bg-[#8ec8ff]/8 py-2.5 text-[12px] font-black text-[#8ec8ff] disabled:opacity-50"
                >
                  <Wand2 className="h-4 w-4" /> {t('motion.page.surprise')}
                </button>
                <BestPracticeHints draft={draft} slot={slot} />
                <StudioCard title={t('motion.page.visionTitle')} hint={t('motion.page.visionHint')}>
                  <FieldLabel>{t('motion.page.visionLabel')}</FieldLabel>
                  <textarea
                    rows={4}
                    value={draft.vision}
                    maxLength={1200}
                    onChange={(e) => patch({ vision: e.target.value })}
                    placeholder={t('motion.page.visionPh')}
                    className={fieldClass}
                  />
                </StudioCard>
              </div>

              <div className="space-y-4 lg:sticky lg:top-3">
                <MotionPlanView beats={beats} duration={draft.duration} slot={slot} motion={motionLabel} logo={logoLabel} cta={ctaLabel} />
                <PromptPreview draft={draft} slot={slot} beats={beats} motion={motionLabel} logo={logoLabel} cta={ctaLabel} />

                <div className="hidden space-y-2 lg:block">
                  <p className="text-center text-[11px] text-[#93a0b5]">
                    <span className="font-black text-[#ffb020]">
                      {formatNumber(points)} {t('common.pointsShort')}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#93a0b5]">{t('motion.page.engineNote', clock)}</span>
                  </p>
                  <button
                    type="button"
                    disabled={busy || najeAd?.enabled === false}
                    onClick={() => void generate()}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-[#8ec8ff] py-3.5 text-sm font-black text-[#071018] shadow-[0_12px_40px_-12px_rgba(142,200,255,0.55)] disabled:opacity-50"
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
                  versions={versions}
                  focusUrl={focusUrl}
                  compareUrl={compareUrl}
                  compareOn={compareOn}
                  onFocus={setFocusUrl}
                  onComparePick={setCompareUrl}
                  onToggleCompare={() => setCompareOn((v) => !v)}
                  onRegenerate={() => void generate()}
                  onVariation={runVariation}
                />
                {hasResults && !busy && (
                  <div className="rounded-2xl border border-[#8ec8ff]/30 bg-[#8ec8ff]/10 p-4">
                    <p className="text-sm font-black text-[#e7eef8]">{t('motion.page.readyTitle')}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#93a0b5]">{t('motion.page.readyBody')}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={resetProject}
                        className="min-h-[44px] rounded-xl border border-[#8ec8ff]/20 px-3 text-[11px] font-black text-[#e7eef8]"
                      >
                        {t('motion.page.newProject')}
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
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#8ec8ff]/20 bg-[#07090f]/95 p-3 backdrop-blur lg:hidden">
          <p className="text-center text-[10px] text-[#93a0b5]">
            {t('motion.page.costLine')}{' '}
            <span className="font-black text-[#ffb020]">
              {formatNumber(points)} {t('common.pointsShort')}
            </span>
          </p>
          <p className="mb-2 text-center text-[10px] leading-relaxed text-[#93a0b5]">{t('motion.page.engineNote', clock)}</p>
          <button
            type="button"
            disabled={busy || najeAd?.enabled === false}
            onClick={() => void generate()}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-[#8ec8ff] py-3.5 text-sm font-black text-[#071018] disabled:opacity-50"
          >
            {busy ? <NajeThinking size={22} /> : <Sparkles className="h-4 w-4" />}
            {busy ? generateLabel() : `${generateLabel()} · ${formatNumber(points)} ${t('common.pointsShort')}`}
          </button>
        </div>
      )}
    </div>
  );
}
