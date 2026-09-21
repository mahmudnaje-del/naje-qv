import React from 'react';
import { STYLE_TEMPLATES } from '../../lib/motionStudio';
import { StudioCard } from './StudioUi';

export function StyleTemplates({
  styleId,
  onSelect,
}: {
  styleId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <StudioCard title="أسلوب الهوية" hint="اختيار البطاقة يملأ الحركة والإضاءة والكاميرا. يمكنك تعديلها بعد ذلك.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {STYLE_TEMPLATES.map((t) => {
          const on = styleId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={`rounded-2xl border p-2.5 text-right transition ${
                on ? 'border-[#d4a574] bg-[#d4a574]/10' : 'border-white/10 bg-black/25 hover:border-white/20'
              }`}
            >
              <span
                className="mb-2 block h-9 rounded-xl"
                style={{ background: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})` }}
              />
              <div className="text-xs font-black text-white">{t.name}</div>
              <div className="mt-0.5 text-[10px] leading-relaxed text-white/45">{t.hint}</div>
              <div className="mt-1.5 text-[9px] font-bold tracking-wide text-[#e8b86d]">{t.motionLevelAr}</div>
            </button>
          );
        })}
      </div>
    </StudioCard>
  );
}
