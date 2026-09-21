import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Clapperboard, Sparkles } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAppStore } from '../store';
import { auth, db } from '../firebase';
import { hasFeatureAccess } from '../lib/featureAccess';
import { estimateOmniPoints } from '../lib/omniAd';
import {
  apiAspect,
  applyHandoff,
  applyTemplate,
  applyVariation,
  composeMotionPrompt,
  computeMotionPlan,
  loadDraft,
  readPromptHandoff,
  resolveSlot,
  saveDraft,
  stripDataUrl,
  type IdentSlot,
  type MotionDraft,
  type MotionKind,
} from '../lib/motionStudio';
import FeaturePaywallModal from '../components/FeaturePaywallModal';
import NajeThinking from '../components/NajeThinking';
import StudioBootSplash from '../components/StudioBootSplash';
import { BrandKit } from '../components/najeMotion/BrandKit';
import { DirectionPanel } from '../components/najeMotion/DirectionPanel';
import { FormatBar } from '../components/najeMotion/FormatBar';
import { KindCards } from '../components/najeMotion/KindCards';
import { Monitor, type SlotResult } from '../components/najeMotion/Monitor';
import { MotionPlanView } from '../components/najeMotion/MotionPlanView';
import { StyleTemplates } from '../components/najeMotion/StyleTemplates';
import { Chip, FieldLabel, StudioCard } from '../components/najeMotion/StudioUi';
import { usePricingConfig } from '../hooks/usePricingConfig';
import { toast } from '../toastStore';

export default function NajeIdent() {
  const { user, updateBalance } = useAppStore();
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
    if (handoff) setDraft((prev) => applyHandoff(prev, handoff));
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
      if (data.status === 'failed') setError(data.error || 'فشل الإنتاج');
      const url = data.videoUrl || data.mediaUrl;
      const doneSlot = generatingSlotRef.current;
      if (data.status === 'completed' && url && doneSlot) {
        setResults((prev) => ({ ...prev, [doneSlot]: { jobId, videoUrl: url } }));
        if (kindRef.current === 'both' && doneSlot === 'intro') {
          toast.success('الانترو جاهز. انتقل إلى الأوترو عندما تريد.');
        }
      }
    });
    return () => unsub();
  }, [jobId]);

  const selectKind = (kind: MotionKind) => {
    patch({
      kind,
      activePiece: kind === 'outro' ? 'outro' : 'intro',
    });
  };

  const generate = async (nextDraft?: MotionDraft) => {
    const d = nextDraft || draft;
    const currentSlot = resolveSlot(d.kind, d.activePiece);
    if (!d.brandName.trim()) {
      toast.error('اكتب اسم العلامة');
      return;
    }
    if (!hasFeatureAccess(user, 'najeAd')) {
      setPaywall(true);
      return;
    }
    if (najeAd?.enabled === false) {
      toast.error('خدمة الإنتاج متوقفة مؤقتاً');
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
      toast.error('يرجى تسجيل الدخول');
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
      if (!res.ok) throw new Error(data.error || 'فشل الطلب');
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
      setError(e.message || 'حدث خطأ');
    }
  };

  const runVariation = (id: string) => {
    const next = applyVariation(draft, id);
    setDraft(next);
    void generate(next);
  };

  const stepLabel =
    job?.status === 'queued'
      ? `في الانتظار (المركز ${job?.queuePosition || '…'})`
      : job?.stepLabel || (busy ? 'جاري صناعة الهوية…' : '');

  const generateLabel = () => {
    if (busy) return stepLabel || 'جاري صناعة الهوية…';
    const piece =
      slot === 'outro' ? 'الأوترو' : slot === 'logo' ? 'تحريك الشعار' : 'الانترو';
    if (draft.kind === 'both' && slot === 'intro' && !results.intro?.videoUrl) {
      return `إنتاج الانترو أولاً — ${draft.duration}ث`;
    }
    if (draft.kind === 'both' && slot === 'outro' && results.intro?.videoUrl && !results.outro?.videoUrl) {
      return `إنتاج الأوترو — ${draft.duration}ث`;
    }
    return `إنتاج ${piece} — ${draft.duration}ث`;
  };

  return (
    <div className="naje-ad-studio relative h-full overflow-y-auto bg-[#0b0c10] px-3 pb-28 pt-4 text-[#f4efe6] sm:px-6 lg:pb-8" dir="rtl">
      <StudioBootSplash dark />
      <FeaturePaywallModal isOpen={paywall} onClose={() => setPaywall(false)} feature="najeAd" />

      <div className="mx-auto max-w-6xl space-y-4">
        <header className="rounded-2xl border border-white/8 bg-[radial-gradient(1200px_circle_at_100%_-20%,rgba(212,165,116,0.22),transparent_45%),linear-gradient(180deg,#16120e,#0b0c10)] p-4 shadow-2xl sm:rounded-[28px] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-[#d4a574]/30 bg-[#d4a574]/10 px-2.5 py-0.5 text-[10px] font-black tracking-[0.14em] text-[#e8b86d]">
                <Clapperboard className="h-3.5 w-3.5" /> NAJE MOTION
              </div>
              <h1 className="text-xl font-black leading-snug tracking-tight text-white sm:text-2xl">
                اصنع مقدمتك وخاتمتك بأسلوبك
              </h1>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/50">
                حوّل شعارك وهويتك إلى مقدمة أو خاتمة فيديو خلال دقائق.
              </p>
              <p className="mt-1.5 text-[11px] font-bold text-[#e8b86d]">اصنع حضورك قبل أن يبدأ المحتوى.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-1.5 text-right sm:px-4 sm:py-2">
              <div className="text-[10px] text-white/40">رصيدك</div>
              <div className="font-mono text-base font-black text-[#e8b86d] sm:text-lg">
                {(user?.balance ?? 0).toLocaleString()} نقطة
              </div>
            </div>
          </div>
          <div className="mt-4">
            <KindCards value={draft.kind} onChange={selectKind} />
          </div>
          {draft.kind === 'both' && (
            <div className="mt-3 rounded-2xl border border-white/8 bg-black/25 p-3">
              <p className="mb-2 text-[10px] leading-relaxed text-white/45">
                الاثنان بالتتابع: نُخرج الانترو أولاً، ثم الأوترو كعملية ثانية. تبقى النتيجتان.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Chip
                  active={draft.activePiece === 'intro'}
                  onClick={() => patch({ activePiece: 'intro' })}
                  className="w-full justify-center py-2.5"
                >
                  إخراج الانترو{results.intro?.videoUrl ? ' — جاهز' : ''}
                </Chip>
                <Chip
                  active={draft.activePiece === 'outro'}
                  onClick={() => patch({ activePiece: 'outro' })}
                  className="w-full justify-center py-2.5"
                >
                  إخراج الأوترو{results.outro?.videoUrl ? ' — جاهز' : ''}
                </Chip>
              </div>
              {results.intro?.videoUrl && !results.outro?.videoUrl && draft.activePiece === 'intro' && (
                <p className="mt-2 text-[10px] font-bold text-[#e8b86d]">الانترو جاهز. انتقل إلى الأوترو للعملية الثانية.</p>
              )}
            </div>
          )}
        </header>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </span>
            <button type="button" onClick={() => setError(null)} className="font-bold">
              إغلاق
            </button>
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
            <StudioCard title="صف رؤيتك" hint="اختياري. يُلحق بتوجيه المخرج كما هو.">
              <FieldLabel>الرؤية</FieldLabel>
              <textarea
                rows={4}
                value={draft.vision}
                maxLength={1200}
                onChange={(e) => patch({ vision: e.target.value })}
                placeholder="مثال: كشف بطيء من الظلام، الشعار يتمدد بضوء نحاسي ثم يثبت في الوسط…"
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
              />
            </StudioCard>
          </div>

          <div className="space-y-4 lg:sticky lg:top-3">
            <MotionPlanView beats={beats} duration={draft.duration} />

            <button
              type="button"
              disabled={busy || najeAd?.enabled === false}
              onClick={() => void generate()}
              className="hidden w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#d4a574] via-[#e8b86d] to-[color-mix(in_srgb,#e8b86d_70%,white)] py-3.5 text-sm font-black text-[#1a140c] shadow-[0_12px_40px_-12px_rgba(212,165,116,0.45)] disabled:opacity-50 lg:flex"
            >
              {busy ? <NajeThinking size={22} /> : <Sparkles className="h-4 w-4" />}
              {busy ? generateLabel() : `${generateLabel()} · ${points} نقطة`}
            </button>

            <Monitor
              busy={busy}
              stepLabel={stepLabel}
              progress={job?.progress || 0}
              generatingSlot={generatingSlot}
              results={results}
              activeSlot={slot}
              kind={draft.kind}
              onRegenerate={() => void generate()}
              onVariation={runVariation}
            />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b0c10]/95 p-3 backdrop-blur lg:hidden">
        <button
          type="button"
          disabled={busy || najeAd?.enabled === false}
          onClick={() => void generate()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#d4a574] via-[#e8b86d] to-[color-mix(in_srgb,#e8b86d_70%,white)] py-3.5 text-sm font-black text-[#1a140c] disabled:opacity-50"
        >
          {busy ? <NajeThinking size={22} /> : <Sparkles className="h-4 w-4" />}
          {busy ? generateLabel() : `${generateLabel()} · ${points} نقطة`}
        </button>
      </div>
    </div>
  );
}
