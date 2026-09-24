import React from 'react';
import { draftPracticeHints, type IdentSlot, type MotionDraft } from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';
import { StudioCard } from './StudioUi';

export function BestPracticeHints({ draft, slot }: { draft: MotionDraft; slot: IdentSlot }) {
  const { t } = useMotionI18n();
  const hints = draftPracticeHints(draft, slot);
  if (!hints.length) return null;
  return (
    <StudioCard title={t('motion.hint.title')} hint={t('motion.hint.note')}>
      <ul className="space-y-1.5">
        {hints.map((h) => (
          <li
            key={h.id}
            className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
              h.level === 'warn'
                ? 'border border-[#ffb020]/35 bg-[#ffb020]/10 text-[#ffb020]'
                : 'border border-[#8ec8ff]/12 bg-black/25 text-[#93a0b5]'
            }`}
          >
            {t(`motion.hint.${h.id}`)}
          </li>
        ))}
      </ul>
    </StudioCard>
  );
}
