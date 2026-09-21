import React from 'react';
import { Clapperboard, Film, Layers, Scan } from 'lucide-react';
import { KIND_OPTIONS, type MotionKind } from '../../lib/motionStudio';

const ICONS: Record<MotionKind, React.ReactNode> = {
  intro: <Clapperboard className="h-4 w-4" />,
  outro: <Film className="h-4 w-4" />,
  both: <Layers className="h-4 w-4" />,
  logo: <Scan className="h-4 w-4" />,
};

export function KindCards({
  value,
  onChange,
}: {
  value: MotionKind;
  onChange: (kind: MotionKind) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {KIND_OPTIONS.map((k) => {
        const on = value === k.id;
        return (
          <button
            key={k.id}
            type="button"
            onClick={() => onChange(k.id)}
            className={`rounded-2xl border p-3 text-right transition sm:p-3.5 ${
              on
                ? 'border-[#d4a574] bg-[#d4a574]/12 text-white shadow-[0_10px_28px_-16px_rgba(212,165,116,0.55)]'
                : 'border-white/10 bg-black/25 text-white/70 hover:border-white/20 hover:text-white'
            }`}
          >
            <span
              className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl border ${
                on ? 'border-[#d4a574]/50 bg-[#d4a574]/15 text-[#e8b86d]' : 'border-white/10 text-white/50'
              }`}
            >
              {ICONS[k.id]}
            </span>
            <div className="text-sm font-black">{k.ar}</div>
            <div className="mt-0.5 text-[10px] leading-relaxed text-white/45">{k.hint}</div>
          </button>
        );
      })}
    </div>
  );
}
