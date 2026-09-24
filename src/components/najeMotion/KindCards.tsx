import React from 'react';
import { Clapperboard, Film, Layers, Mic, Scan, Tv } from 'lucide-react';
import {
  HERO_PRESETS,
  KIND_OPTIONS,
  type HeroPresetId,
  type MotionKind,
} from '../../lib/motionStudio';

const ICONS: Record<MotionKind, React.ReactNode> = {
  intro: <Clapperboard className="h-4 w-4" />,
  outro: <Film className="h-4 w-4" />,
  both: <Layers className="h-4 w-4" />,
  logo: <Scan className="h-4 w-4" />,
};

const PRESET_ICONS: Record<HeroPresetId, React.ReactNode> = {
  podcast: <Mic className="h-4 w-4" />,
  channel: <Tv className="h-4 w-4" />,
};

export function KindCards({
  value,
  onChange,
  variant = 'editor',
  preset,
}: {
  value?: MotionKind;
  onChange: (kind: MotionKind, preset?: HeroPresetId) => void;
  variant?: 'hero' | 'editor';
  preset?: string;
}) {
  const hero = variant === 'hero';
  return (
    <div className={`grid grid-cols-2 gap-2 ${hero ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
      {KIND_OPTIONS.map((k) => {
        const on = value === k.id;
        const badge =
          (preset === 'podcast' && k.id === 'intro') || (preset === 'channel' && k.id === 'both')
            ? preset === 'podcast'
              ? 'بودكاست'
              : 'حزمة قناة'
            : null;
        return (
          <button
            key={k.id}
            type="button"
            onClick={() => onChange(k.id)}
            className={`min-h-[44px] rounded-2xl border p-3 text-right transition ${hero ? 'sm:p-5' : 'sm:p-3.5'} ${
              on
                ? 'border-[#d4a574] bg-[#d4a574]/12 text-white shadow-[0_10px_28px_-16px_rgba(212,165,116,0.55)]'
                : 'border-white/10 bg-black/25 text-white/70 hover:border-white/20 hover:text-white'
            }`}
          >
            <span className="mb-2 flex items-center justify-between gap-2">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border ${
                  on ? 'border-[#d4a574]/50 bg-[#d4a574]/15 text-[#e8b86d]' : 'border-white/10 text-white/50'
                }`}
              >
                {ICONS[k.id]}
              </span>
              {badge && (
                <span className="rounded-full border border-[#d4a574]/40 bg-[#d4a574]/12 px-2 py-0.5 text-[9px] font-black text-[#e8b86d]">
                  {badge}
                </span>
              )}
            </span>
            <div className={`font-black ${hero ? 'text-base' : 'text-sm'}`}>{k.ar}</div>
            {hero && (
              <div className="mt-0.5 text-[10px] font-bold tracking-wide text-[#e8b86d]/80">{k.en}</div>
            )}
            <div className="mt-0.5 text-[10px] leading-relaxed text-white/45">{k.hint}</div>
          </button>
        );
      })}
      {hero &&
        HERO_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.kind, p.id)}
            className="min-h-[44px] rounded-2xl border border-dashed border-[#d4a574]/45 bg-[#d4a574]/8 p-3 text-right transition hover:border-[#d4a574] hover:bg-[#d4a574]/12 sm:p-5"
          >
            <span className="mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#d4a574]/50 bg-[#d4a574]/15 text-[#e8b86d]">
                {PRESET_ICONS[p.id]}
              </span>
              <span className="rounded-full border border-[#d4a574]/40 bg-[#d4a574]/12 px-2 py-0.5 text-[9px] font-black text-[#e8b86d]">
                إعداد جاهز
              </span>
            </span>
            <div className="text-base font-black text-white">{p.ar}</div>
            <div className="mt-0.5 text-[10px] font-bold tracking-wide text-[#e8b86d]/80">{p.en}</div>
            <div className="mt-0.5 text-[10px] leading-relaxed text-white/45">{p.hint}</div>
          </button>
        ))}
    </div>
  );
}
