import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Clapperboard, Film, Layers, Palette, Sparkles, Wand2, Sliders, ShieldCheck, Zap, ArrowLeft, RefreshCw } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { recordGeneratedMedia } from '../lib/studioMediaSync';
import { pushAppNotification } from '../lib/notifications';
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
import NajeCreditIcon from '../components/NajeCreditIcon';
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
import { NajeIdentIcon } from '../components/icons/SuiteIcons';

type MobileSectionTab = 'brand' | 'style' | 'format' | 'plan';

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
  const { najeIdent, najeAd } = usePricingConfig();
  const pointsRate = typeof najeIdent?.pointsRatePerSecond === 'number'
    ? najeIdent.pointsRatePerSecond
    : (typeof najeAd?.pointsRatePerSecond === 'number' ? najeAd.pointsRatePerSecond : 2.5);
  const resMul = najeIdent?.resolutionMultiplier || najeAd?.resolutionMultiplier;

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
  const [mobileTab, setMobileTab] = useState<MobileSectionTab>('brand');
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
      if (data.status === 'failed') {
        const errMsg = data.error || t('motion.error.failed');
        setError(errMsg);
        if (auth.currentUser?.uid) {
          pushAppNotification({
            title: 'تنبيه استوديو الحركة',
            message: errMsg,
            type: 'alert',
            studio: 'naje_ident',
            ownerId: auth.currentUser.uid,
            userId: auth.currentUser.uid,
          }).catch(() => null);
        }
      }
      const url = data.videoUrl || data.mediaUrl;
      const doneSlot = generatingSlotRef.current;
      if (data.status === 'completed' && url && doneSlot) {
        setResults((prev) => ({ ...prev, [doneSlot]: { jobId, videoUrl: url } }));
        setVersions((prev) => {
          const next = [{ slot: doneSlot, url, at: Date.now() }, ...prev.filter((v) => v.url !== url)];
          return next.slice(0, 8);
        });
        setFocusUrl(url);
        recordGeneratedMedia({
          type: 'video',
          mediaUrl: url,
          title: `Naje Ident (${doneSlot.toUpperCase()})`,
          prompt: data.prompt || draft.brandName || `Naje Motion ${doneSlot}`,
          studio: 'naje_ident',
          metadata: { slot: doneSlot, jobId }
        }).catch((e) => console.warn('Failed to record motion video to gallery:', e));
        if (auth.currentUser?.uid) {
          pushAppNotification({
            title: 'تم إنجاز فيديو المقدمة/الخاتمة بنجاح',
            message: `تم تجهيز مشهد الحركة (${doneSlot === 'intro' ? 'المقدمة' : 'الخاتمة'}) بدقة سينمائية وهو جاهز للعرض.`,
            type: 'feature',
            studio: 'naje_ident',
            url,
            ownerId: auth.currentUser.uid,
            userId: auth.currentUser.uid,
          }).catch(() => null);
        }
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
      toast.error(t('surface.ident.needBrand'));
      setMobileTab('brand');
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
    toast.success(t('surface.ident.styleReady'));
  };

  const stepLabel =
    job?.status === 'queued'
      ? t('motion.page.queue', { position: String(job?.queuePosition ?? '…') })
      : job?.stepLabel || (busy ? t(`motion.step.${stepIndex(job?.progress || 0)}`) : '');

  const generateLabel = () => {
    if (busy) return stepLabel || t('surface.ident.producing');
    const piece = t(`motion.piece.${slot}`);
    const duration = formatNumber(draft.duration);
    if (draft.kind === 'both' && slot === 'intro' && !results.intro?.videoUrl) {
      return t('surface.ident.introDur', { duration });
    }
    if (draft.kind === 'both' && slot === 'outro' && results.intro?.videoUrl && !results.outro?.videoUrl) {
      return t('surface.ident.outroDur', { duration });
    }
    return t('surface.ident.pieceDur', { piece, duration });
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
      className={`naje-motion-studio relative min-h-full overflow-y-auto bg-[#07090f] px-3.5 pt-3.5 text-[#e7eef8] sm:px-6 sm:pt-6 ${
        showHero ? 'pb-8' : 'pb-36 lg:pb-12'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <StudioBootSplash dark />
      <FeaturePaywallModal isOpen={paywall} onClose={() => setPaywall(false)} feature="najeAd" />

      <div className="mx-auto max-w-6xl space-y-4">
        {showHero ? (
          <>
            <div className="flex justify-end">
              <div className="rounded-2xl border border-[#8ec8ff]/20 bg-black/50 px-3.5 py-2 text-end flex items-center gap-2.5 shadow-md backdrop-blur-md">
                <NajeCreditIcon className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-[10px] text-[#93a0b5]">{t('motion.page.balance')}</div>
                  <div className="font-mono text-sm sm:text-base font-black text-[#ffb020]">
                    {formatNumber(user?.balance ?? 0)} {t('common.pointsShort')}
                  </div>
                </div>
              </div>
            </div>
            <HeroLaunch onChoose={enterStudio} />
          </>
        ) : (
          <>
            {/* Top Studio Control Header */}
            <RegFrame className="rounded-2xl sm:rounded-[28px] bg-gradient-to-b from-[#111726] to-[#0a0e17] p-3.5 sm:p-5 shadow-xl shadow-black/50 border border-[#8ec8ff]/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {!hasResults && (
                      <button
                        type="button"
                        onClick={() => setStudioEntered(false)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-[#8ec8ff]/20 text-xs font-black text-[#93a0b5] hover:text-[#8ec8ff] active:scale-95 transition"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                        <span>{t('surface.ident.backHome')}</span>
                      </button>
                    )}
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#8ec8ff]/30 bg-[#8ec8ff]/10 px-3 py-1 text-[11px] font-black tracking-wider text-[#e7eef8]">
                      <NajeIdentIcon size={28} className="h-7 w-7 shrink-0" />
                      <span className="motion-tally inline-block h-2 w-2 rounded-full bg-[#ffb020] animate-pulse" aria-hidden />
                      <span className="text-[#ffb020]">NAJE IDENT</span>
                      <span className="text-[#93a0b5] text-[10px]">· {t('surface.ident.studioTag')}</span>
                    </div>
                  </div>
                  <h1 className="text-base sm:text-2xl font-black leading-snug tracking-tight text-[#e7eef8]">
                    {t('motion.page.title')}
                  </h1>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#93a0b5] line-clamp-2 sm:line-clamp-none">
                    {t('motion.page.subtitle')}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#8ec8ff]/20 bg-black/50 px-3.5 py-2 text-end flex items-center gap-2.5 shadow-xs shrink-0">
                  <NajeCreditIcon className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-[10px] text-[#93a0b5]">{t('motion.page.balance')}</div>
                    <div className="font-mono text-sm sm:text-base font-black text-[#ffb020]">
                      {formatNumber(user?.balance ?? 0)} {t('common.pointsShort')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Kind Cards (Intro / Outro / Both / Logo) */}
              <div className="mt-4">
                <KindCards value={draft.kind} onChange={selectKind} preset={presetBadge} />
              </div>

              {/* Both Mode: Intro & Outro Tabs */}
              {draft.kind === 'both' && (
                <div className="mt-3.5 rounded-2xl border border-[#8ec8ff]/15 bg-black/30 p-3">
                  <p className="mb-2 text-[11px] leading-relaxed text-[#93a0b5]">
                    {t('surface.ident.bundleNote')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Chip
                      active={draft.activePiece === 'intro'}
                      onClick={() => patch({ activePiece: 'intro' })}
                      className="w-full justify-center py-2.5 text-xs font-black"
                    >
                      {t('surface.ident.intro')}
                      {results.intro?.videoUrl ? ` — ✓ ${t('surface.ident.ready')}` : ''}
                    </Chip>
                    <Chip
                      active={draft.activePiece === 'outro'}
                      onClick={() => patch({ activePiece: 'outro' })}
                      className="w-full justify-center py-2.5 text-xs font-black"
                    >
                      {t('surface.ident.outro')}
                      {results.outro?.videoUrl ? ` — ✓ ${t('surface.ident.ready')}` : ''}
                    </Chip>
                  </div>
                  {results.intro?.videoUrl && !results.outro?.videoUrl && draft.activePiece === 'intro' && (
                    <p className="mt-2 text-[11px] font-bold text-[#ffb020]">
                      {t('surface.ident.goOutro')}
                    </p>
                  )}
                </div>
              )}
            </RegFrame>

            {/* Error Notification Banner */}
            {error && (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 text-xs text-rose-200">
                <p className="inline-flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span>
                    <strong className="block text-sm font-bold text-white mb-0.5">{t('surface.ident.productionWarn')}</strong>
                    {error}
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      void generate();
                    }}
                    className="min-h-[42px] rounded-xl bg-rose-500/30 border border-rose-400/50 px-4 text-xs font-black text-white hover:bg-rose-500/40 active:scale-95 transition"
                  >
                    {t('surface.ident.retry')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="min-h-[42px] px-3 text-xs font-bold text-rose-200/80 hover:text-white"
                  >
                    {t('surface.ident.close')}
                  </button>
                </div>
              </div>
            )}

            {/* Mobile View: PERMANENT LIVE STAGE MOUNTED AT TOP */}
            <div className="lg:hidden space-y-3">
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
                logo={draft.logo}
                primary={draft.primary}
                bgColor={draft.bgColor}
                tagline={draft.tagline}
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

              {/* Ready Project Card if finished */}
              {hasResults && !busy && (
                <div className="rounded-2xl border border-[#8ec8ff]/30 bg-[#8ec8ff]/10 p-3.5">
                  <p className="text-sm font-black text-[#e7eef8]">{t('surface.ident.doneTitle')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#93a0b5]">
                    {t('surface.ident.doneBody')}
                  </p>
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={resetProject}
                      className="min-h-[40px] rounded-xl border border-[#8ec8ff]/30 bg-black/40 px-3.5 text-xs font-black text-[#e7eef8] active:scale-95 transition"
                    >
                      {t('surface.ident.newProject')}
                    </button>
                  </div>
                </div>
              )}

              {/* Segmented Control Bar for Mobile Configuration */}
              <div className="sticky top-0 z-30 -mx-3.5 px-3.5 py-2.5 bg-[#07090f]/95 backdrop-blur-md border-y border-[#8ec8ff]/20">
                <div className="grid grid-cols-4 gap-1 p-1 bg-black/60 rounded-2xl border border-[#8ec8ff]/20">
                  <button
                    type="button"
                    onClick={() => setMobileTab('brand')}
                    className={`min-h-[42px] rounded-xl px-1 py-1.5 text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                      mobileTab === 'brand'
                        ? 'bg-[#8ec8ff]/25 text-[#8ec8ff] shadow-sm border border-[#8ec8ff]/40'
                        : 'text-[#93a0b5] hover:text-[#e7eef8]'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] truncate">{t('surface.ident.stepBrand')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileTab('style')}
                    className={`min-h-[42px] rounded-xl px-1 py-1.5 text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                      mobileTab === 'style'
                        ? 'bg-[#8ec8ff]/25 text-[#8ec8ff] shadow-sm border border-[#8ec8ff]/40'
                        : 'text-[#93a0b5] hover:text-[#e7eef8]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] truncate">{t('surface.ident.stepStyle')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileTab('format')}
                    className={`min-h-[42px] rounded-xl px-1 py-1.5 text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                      mobileTab === 'format'
                        ? 'bg-[#8ec8ff]/25 text-[#8ec8ff] shadow-sm border border-[#8ec8ff]/40'
                        : 'text-[#93a0b5] hover:text-[#e7eef8]'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] truncate">{t('surface.ident.stepFormat')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileTab('plan')}
                    className={`min-h-[42px] rounded-xl px-1 py-1.5 text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                      mobileTab === 'plan'
                        ? 'bg-[#8ec8ff]/25 text-[#8ec8ff] shadow-sm border border-[#8ec8ff]/40'
                        : 'text-[#93a0b5] hover:text-[#e7eef8]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] truncate">{t('surface.ident.stepTimeline')}</span>
                  </button>
                </div>
              </div>

              {/* Mobile Active Tab Contents */}
              <div className="space-y-4">
                {mobileTab === 'brand' && (
                  <div className="space-y-4">
                    <BrandKit draft={draft} onChange={patch} />
                    <ContextStrip draft={draft} slot={slot} onChange={patch} />
                  </div>
                )}

                {mobileTab === 'style' && (
                  <div className="space-y-4">
                    <StyleTemplates styleId={draft.styleId} onSelect={(id) => setDraft((prev) => applyTemplate(prev, id))} />
                    <DirectionPanel draft={draft} slot={slot} onChange={patch} />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={runSurprise}
                      className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#8ec8ff]/35 bg-[#8ec8ff]/10 py-3 text-xs font-black text-[#8ec8ff] active:scale-[0.98] disabled:opacity-50 transition"
                    >
                      <Wand2 className="h-4 w-4 text-[#ffb020]" />
                      <span>{t('motion.page.surprise')}</span>
                    </button>
                  </div>
                )}

                {mobileTab === 'format' && (
                  <div className="space-y-4">
                    <FormatBar
                      duration={draft.duration}
                      aspect={draft.aspect}
                      resolution={draft.resolution}
                      onDuration={(duration) => patch({ duration })}
                      onAspect={(aspect) => patch({ aspect })}
                      onResolution={(resolution) => patch({ resolution })}
                    />
                  </div>
                )}

                {mobileTab === 'plan' && (
                  <div className="space-y-4">
                    <BestPracticeHints draft={draft} slot={slot} />
                    <StudioCard title={t('surface.ident.directorTitle')} hint={t('surface.ident.directorHint')}>
                      <FieldLabel>{t('surface.ident.directorLabel')}</FieldLabel>
                      <textarea
                        rows={3}
                        value={draft.vision}
                        maxLength={1200}
                        onChange={(e) => patch({ vision: e.target.value })}
                        placeholder={t('surface.ident.directorPlaceholder')}
                        className={fieldClass}
                      />
                    </StudioCard>
                    <MotionPlanView beats={beats} duration={draft.duration} slot={slot} motion={motionLabel} logo={logoLabel} cta={ctaLabel} />
                    <PromptPreview draft={draft} slot={slot} beats={beats} motion={motionLabel} logo={logoLabel} cta={ctaLabel} />
                  </div>
                )}
              </div>
            </div>

            {/* Desktop View: TWO-COLUMN SIDE-BY-SIDE LAYOUT */}
            <div className="hidden lg:grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              {/* Left Column: Directives, Brand, Style, Formats */}
              <div className="space-y-4">
                <BrandKit draft={draft} onChange={patch} />
                <ContextStrip draft={draft} slot={slot} onChange={patch} />
                <StyleTemplates styleId={draft.styleId} onSelect={(id) => setDraft((prev) => applyTemplate(prev, id))} />
                <DirectionPanel draft={draft} slot={slot} onChange={patch} />
                <button
                  type="button"
                  disabled={busy}
                  onClick={runSurprise}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#8ec8ff]/35 bg-[#8ec8ff]/10 py-3 text-xs font-black text-[#8ec8ff] active:scale-[0.98] disabled:opacity-50 transition"
                >
                  <Wand2 className="h-4 w-4 text-[#ffb020]" />
                  <span>{t('motion.page.surprise')}</span>
                </button>
                <StudioCard title={t('surface.ident.directorTitle')} hint={t('surface.ident.directorHint')}>
                  <FieldLabel>{t('surface.ident.directorLabel')}</FieldLabel>
                  <textarea
                    rows={3}
                    value={draft.vision}
                    maxLength={1200}
                    onChange={(e) => patch({ vision: e.target.value })}
                    placeholder={t('surface.ident.directorPlaceholderShort')}
                    className={fieldClass}
                  />
                </StudioCard>
              </div>

              {/* Right Column: Sticky Monitor Stage, FormatBar, Plan & Produce */}
              <div className="space-y-4 lg:sticky lg:top-3">
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
                  logo={draft.logo}
                  primary={draft.primary}
                  bgColor={draft.bgColor}
                  tagline={draft.tagline}
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

                <FormatBar
                  duration={draft.duration}
                  aspect={draft.aspect}
                  resolution={draft.resolution}
                  onDuration={(duration) => patch({ duration })}
                  onAspect={(aspect) => patch({ aspect })}
                  onResolution={(resolution) => patch({ resolution })}
                />

                {/* Desktop Produce Action Box */}
                <div className="space-y-2">
                  <p className="text-center text-[11px] text-[#93a0b5]">
                    <span className="font-black text-[#ffb020] inline-flex items-center gap-1">
                      <NajeCreditIcon className="w-4 h-4 shrink-0" />
                      <span>{formatNumber(points)} {t('common.pointsShort')}</span>
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#93a0b5]">
                      {t('surface.ident.hires')}
                    </span>
                  </p>
                  <button
                    type="button"
                    disabled={busy || najeAd?.enabled === false}
                    onClick={() => void generate()}
                    className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8ec8ff] via-[#6db4ff] to-[#4da6ff] py-3.5 text-sm font-black text-[#071018] shadow-[0_12px_40px_-10px_rgba(142,200,255,0.6)] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {busy ? <NajeThinking size={22} /> : <Sparkles className="h-4 w-4" />}
                    <span>{busy ? generateLabel() : `${generateLabel()} · ${formatNumber(points)} ${t('common.pointsShort')}`}</span>
                  </button>
                </div>

                {hasResults && !busy && (
                  <div className="rounded-2xl border border-[#8ec8ff]/30 bg-[#8ec8ff]/10 p-4">
                    <p className="text-sm font-black text-[#e7eef8]">{t('surface.ident.doneTitle')}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#93a0b5]">
                      {t('surface.ident.doneBody')}
                    </p>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={resetProject}
                        className="min-h-[42px] rounded-xl border border-[#8ec8ff]/30 bg-black/40 px-3.5 text-xs font-black text-[#e7eef8] hover:bg-[#8ec8ff]/20 active:scale-95 transition"
                      >
                        {t('surface.ident.newProject')}
                      </button>
                    </div>
                  </div>
                )}

                <MotionPlanView beats={beats} duration={draft.duration} slot={slot} motion={motionLabel} logo={logoLabel} cta={ctaLabel} />
                <PromptPreview draft={draft} slot={slot} beats={beats} motion={motionLabel} logo={logoLabel} cta={ctaLabel} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Action Bar on Mobile */}
      {!showHero && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#8ec8ff]/25 bg-[#07090f]/95 p-3 pb-[max(14px,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <div className="flex flex-col text-start min-w-0">
              <span className="text-[11px] text-[#93a0b5] flex items-center gap-1">
                <span>{t('surface.ident.cost')}</span>
                <span className="font-mono font-black text-[#ffb020]">
                  {formatNumber(points)} {t('common.pointsShort')}
                </span>
              </span>
              <span className="text-[10px] text-[#8ec8ff] font-mono truncate">
                {clock.full}s · {draft.resolution} · {draft.aspect}
              </span>
            </div>
            <button
              type="button"
              disabled={busy || najeAd?.enabled === false}
              onClick={() => void generate()}
              className="flex-1 min-h-[48px] rounded-2xl bg-gradient-to-r from-[#8ec8ff] to-[#60a5fa] px-4 py-2.5 text-xs font-black text-[#071018] shadow-lg shadow-[#8ec8ff]/30 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {busy ? <NajeThinking size={20} /> : <Sparkles className="h-4 w-4 shrink-0" />}
              <span className="truncate">{generateLabel()}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
