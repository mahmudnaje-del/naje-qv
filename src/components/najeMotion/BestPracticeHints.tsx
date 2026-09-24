import React from 'react';
import { draftPracticeHints, type IdentSlot, type MotionDraft } from '../../lib/motionStudio';
import { StudioCard } from './StudioUi';

export function BestPracticeHints({ draft, slot }: { draft: MotionDraft; slot: IdentSlot }) {
  const hints = draftPracticeHints(draft, slot);
  if (!hints.length) return null;
  return (
    <StudioCard title="تنبيهات من المسودة" hint="من الحقول فقط — ليست تحليلاً بعد الفيديو.">
      <ul className="space-y-1.5">
        {hints.map((h) => (
          <li
            key={h.id}
            className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
              h.level === 'warn'
                ? 'border border-[#d4a574]/30 bg-[#d4a574]/10 text-[#e8b86d]'
                : 'border border-white/8 bg-black/25 text-white/55'
            }`}
          >
            {h.ar}
          </li>
        ))}
      </ul>
    </StudioCard>
  );
}
