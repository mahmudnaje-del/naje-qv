import React, { useState } from 'react';
import { Download, Film, RefreshCw } from 'lucide-react';
import {
  DIRECTOR_STEPS,
  VARIATIONS,
  directorStepForProgress,
  motionFilename,
  slotLabelAr,
  type IdentSlot,
  type MotionAspect,
  type MotionDuration,
  type MotionKind,
  type MotionPlatform,
} from '../../lib/motionStudio';
import NajeThinking from '../NajeThinking';
import { Chip, StudioCard } from './StudioUi';

export interface SlotResult {
  jobId: string | null;
  videoUrl?: string;
}

function visibleSlots(kind: MotionKind): IdentSlot[] {
  if (kind === 'both') return ['intro', 'outro'];
  if (kind === 'logo') return ['logo'];
  return [kind];
}

function isVertical(aspect: MotionAspect, platform: MotionPlatform) {
  return aspect === '9:16' || aspect === '1:1' || aspect === '4:5' || platform === 'tiktok' || platform === 'instagram';
}

async function downloadNamed(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch');
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  } catch {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.click();
  }
}

function SafeGuides({ aspect }: { aspect: MotionAspect }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-[8%] rounded-sm border border-dashed border-[#e8b86d]/55" />
      {aspect === '1:1' && (
        <div className="absolute left-1/2 top-1/2 aspect-square w-full -translate-x-1/2 -translate-y-1/2 border border-dashed border-white/45" />
      )}
      {aspect === '4:5' && (
        <div className="absolute left-1/2 top-1/2 h-[70%] w-full -translate-x-1/2 -translate-y-1/2 border border-dashed border-white/45" />
      )}
    </div>
  );
}

function YouTubeChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#f1f1f1] p-1.5">
      <div className="mb-1 flex items-center gap-2 px-1.5 py-1">
        <span className="h-2.5 w-3.5 rounded-[2px] bg-[#ff0000]" />
        <span className="text-[9px] font-black text-neutral-700">YouTube</span>
        <span className="h-4 flex-1 rounded-full bg-white text-[8px] leading-4 text-neutral-400" />
      </div>
      {children}
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-300">
        <div className="h-full w-1/3 bg-[#ff0000]" />
      </div>
    </div>
  );
}

function TikTokChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      {children}
      <div className="pointer-events-none absolute inset-y-16 right-2 flex flex-col items-center justify-end gap-4 text-white/80" dir="ltr">
        <span className="h-8 w-8 rounded-full bg-white/15" />
        <span className="h-8 w-8 rounded-full bg-white/15" />
        <span className="h-8 w-8 rounded-full bg-white/15" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="h-2 w-24 rounded bg-white/30" />
        <div className="mt-1.5 h-2 w-16 rounded bg-white/20" />
      </div>
    </div>
  );
}

function InstagramChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#fafafa]">
      <div className="flex items-center gap-2 border-b border-black/10 px-2 py-1.5">
        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" />
        <span className="text-[9px] font-black text-neutral-800">Instagram</span>
      </div>
      {children}
      <div className="flex items-center justify-between px-3 py-1.5 text-[8px] text-neutral-500">
        <span>♡   💬   ➤</span>
        <span>⋯</span>
      </div>
    </div>
  );
}

export function Monitor({
  busy,
  stepLabel,
  progress,
  generatingSlot,
  results,
  activeSlot,
  kind,
  aspect,
  platform,
  duration,
  brandName,
  hasLogo,
  onRegenerate,
  onVariation,
}: {
  busy: boolean;
  stepLabel: string;
  progress: number;
  generatingSlot: IdentSlot | null;
  results: Partial<Record<IdentSlot, SlotResult>>;
  activeSlot: IdentSlot;
  kind: MotionKind;
  aspect: MotionAspect;
  platform: MotionPlatform;
  duration: MotionDuration;
  brandName: string;
  hasLogo: boolean;
  onRegenerate: () => void;
  onVariation: (id: string) => void;
}) {
  const slots = visibleSlots(kind);
  const hasAny = slots.some((s) => results[s]?.videoUrl);
  const currentUrl = results[activeSlot]?.videoUrl;
  const [chrome, setChrome] = useState<'off' | 'youtube' | 'tiktok' | 'instagram'>('off');
  const [safeArea, setSafeArea] = useState(false);
  const vertical = isVertical(aspect, platform);

  if (!busy && !hasAny) return null;

  const wrapVideo = (video: React.ReactNode) => {
    const inner = (
      <div className="relative bg-black">
        {video}
        {safeArea && <SafeGuides aspect={aspect} />}
      </div>
    );
    if (chrome === 'off') return inner;
    if (chrome === 'instagram') return <InstagramChrome>{inner}</InstagramChrome>;
    if (chrome === 'tiktok' || (chrome === 'youtube' && vertical)) {
      return chrome === 'tiktok' ? <TikTokChrome>{inner}</TikTokChrome> : <YouTubeChrome>{inner}</YouTubeChrome>;
    }
    if (chrome === 'youtube') return <YouTubeChrome>{inner}</YouTubeChrome>;
    return vertical ? <TikTokChrome>{inner}</TikTokChrome> : <YouTubeChrome>{inner}</YouTubeChrome>;
  };

  return (
    <StudioCard
      title="المونيتور"
      hint="النتيجة تبقى. الهوية لا تُصفَّر عند نسخة أخرى."
      action={
        busy ? (
          <span className="font-mono text-[11px] text-[#e8b86d]">{Math.max(0, progress)}%</span>
        ) : undefined
      }
    >
      {busy && (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-l from-[#d4a574] to-[#e8b86d] transition-[width]"
            style={{ width: `${Math.max(8, progress)}%` }}
          />
        </div>
      )}

      {busy && hasAny && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#d4a574]/25 bg-[#d4a574]/8 px-3 py-2">
          <NajeThinking size={22} />
          <span className="text-xs font-bold text-[#e8b86d]">{stepLabel || 'ناجي يبني الهوية…'}</span>
        </div>
      )}

      {busy && !currentUrl && (
        <div className="flex flex-col items-center gap-2 py-8">
          <NajeThinking size={56} />
          <span className="text-xs font-bold text-[#e8b86d]">
            {stepLabel || 'ناجي يُخرج تسلسل الحركة…'}
          </span>
          <span className="text-[10px] text-white/45">{directorStepForProgress(progress)}</span>
          {generatingSlot && (
            <span className="text-[10px] text-white/40">{slotLabelAr(generatingSlot)}</span>
          )}
          <ol className="mt-2 w-full max-w-xs space-y-1 text-right">
            {DIRECTOR_STEPS.map((s) => (
              <li
                key={s.at}
                className={`text-[10px] ${progress >= s.at ? 'font-bold text-[#e8b86d]' : 'text-white/30'}`}
              >
                {progress >= s.at ? '✓ ' : '· '}
                {s.ar}
              </li>
            ))}
          </ol>
          <p className="mt-1 max-w-xs text-center text-[9px] text-white/30">
            مراحل إخراج مفاهيمية فوق تقدّم المهمة الحقيقي من الخادم.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {slots
          .filter((s) => results[s]?.videoUrl)
          .map((s) => {
            const filename = motionFilename(brandName, s, duration, aspect);
            return (
              <div key={s} className="overflow-hidden rounded-2xl border border-white/8 bg-black/40">
                <div className="flex items-center justify-between px-3 py-2 text-[11px] font-black text-white/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Film className="h-3.5 w-3.5 text-[#e8b86d]" />
                    {slotLabelAr(s)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void downloadNamed(results[s]!.videoUrl!, filename)}
                    className="inline-flex min-h-[44px] items-center gap-1 text-[#e8b86d]"
                  >
                    <Download className="h-3.5 w-3.5" /> تحميل
                  </button>
                </div>
                {wrapVideo(
                  <video
                    src={results[s]!.videoUrl}
                    controls
                    playsInline
                    className="max-h-[70vh] w-full bg-black"
                  />
                )}
              </div>
            );
          })}
      </div>

      {!busy && hasAny && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Chip active={chrome === 'youtube'} onClick={() => setChrome((c) => (c === 'youtube' ? 'off' : 'youtube'))}>
              يوتيوب
            </Chip>
            <Chip active={chrome === 'tiktok'} onClick={() => setChrome((c) => (c === 'tiktok' ? 'off' : 'tiktok'))}>
              تيك توك
            </Chip>
            <Chip active={chrome === 'instagram'} onClick={() => setChrome((c) => (c === 'instagram' ? 'off' : 'instagram'))}>
              إنستغرام
            </Chip>
            <Chip active={safeArea} onClick={() => setSafeArea((v) => !v)}>
              الهوامش الآمنة
            </Chip>
          </div>
          {(chrome !== 'off' || safeArea) && (
            <p className="text-[10px] leading-relaxed text-white/40">
              {chrome !== 'off' ? 'إطار المنصة للمعاينة فقط — لا يُصدَّر مع الملف. ' : ''}
              {safeArea ? 'إرشاد للمونتاج — لا يُحرق في الملف.' : ''}
            </p>
          )}

          {hasLogo && (
            <p className="rounded-xl border border-[#d4a574]/25 bg-[#d4a574]/8 px-3 py-2 text-[11px] leading-relaxed text-[#e8b86d]">
              المحرك قد لا يحفظ الشعار بكسل مثالي. إن تشوّه: أعد التوليد بهوية مقفولة أو استخدم ثبات أبسط.
            </p>
          )}

          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-[#d4a574]/40 bg-[#d4a574]/10 py-2.5 text-[12px] font-black text-[#e8b86d]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> ولّد نسخة أخرى
          </button>
          <p className="text-[10px] font-black text-white/45">اتجاه آخر</p>
          <div className="flex flex-wrap gap-1.5">
            {VARIATIONS.map((v) => (
              <Chip key={v.id} onClick={() => onVariation(v.id)}>
                {v.en} · {v.ar}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </StudioCard>
  );
}
