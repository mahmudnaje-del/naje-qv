import React from 'react';
import { Download, Film, RefreshCw } from 'lucide-react';
import { VARIATIONS, type IdentSlot, type MotionKind } from '../../lib/motionStudio';
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

export function Monitor({
  busy,
  stepLabel,
  progress,
  generatingSlot,
  results,
  activeSlot,
  kind,
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
  onRegenerate: () => void;
  onVariation: (id: string) => void;
}) {
  const slots = visibleSlots(kind);
  const hasAny = slots.some((s) => results[s]?.videoUrl);
  const currentUrl = results[activeSlot]?.videoUrl;

  if (!busy && !hasAny) return null;

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
          <span className="text-xs font-bold text-[#e8b86d]">{stepLabel || 'ناجي يبني الهوية…'}</span>
          {generatingSlot && (
            <span className="text-[10px] text-white/40">
              {generatingSlot === 'outro' ? 'أوترو' : generatingSlot === 'logo' ? 'تحريك الشعار' : 'انترو'}
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {slots
          .filter((s) => results[s]?.videoUrl)
          .map((s) => (
            <div key={s} className="overflow-hidden rounded-2xl border border-white/8 bg-black/40">
              <div className="flex items-center justify-between px-3 py-2 text-[11px] font-black text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <Film className="h-3.5 w-3.5 text-[#e8b86d]" />
                  {s === 'outro' ? 'أوترو' : s === 'logo' ? 'تحريك الشعار' : 'انترو'}
                </span>
                <a
                  href={results[s]!.videoUrl}
                  download={`naje-motion-${s}.mp4`}
                  className="inline-flex items-center gap-1 text-[#e8b86d]"
                >
                  <Download className="h-3.5 w-3.5" /> تحميل
                </a>
              </div>
              <video src={results[s]!.videoUrl} controls playsInline className="w-full bg-black" />
            </div>
          ))}
      </div>

      {!busy && hasAny && (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#d4a574]/40 bg-[#d4a574]/10 py-2.5 text-[12px] font-black text-[#e8b86d]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> ولّد نسخة أخرى
          </button>
          <p className="text-[10px] font-black text-white/45">اتجاه آخر</p>
          <div className="flex flex-wrap gap-1.5">
            {VARIATIONS.map((v) => (
              <Chip key={v.id} onClick={() => onVariation(v.id)}>
                {v.ar}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </StudioCard>
  );
}
