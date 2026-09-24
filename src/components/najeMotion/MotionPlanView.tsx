import React from 'react';
import type { IdentSlot, MotionBeat, MotionDuration } from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';
import { localizedPlan } from './planCopy';
import { StudioCard } from './StudioUi';

export function MotionPlanView({
  beats,
  duration,
  slot,
  motion,
  logo,
  cta,
}: {
  beats: MotionBeat[];
  duration: MotionDuration;
  slot: IdentSlot;
  motion: string;
  logo: string;
  cta: string;
}) {
  const { t, formatNumber } = useMotionI18n();
  const lines = localizedPlan(t, slot, duration, { motion, logo, cta });
  return (
    <StudioCard
      title={t('motion.plan.title')}
      hint={
        duration === 5
          ? t('motion.plan.hintSting', { full: formatNumber(10), sting: formatNumber(5) })
          : t('motion.plan.hintFull', { full: formatNumber(10) })
      }
    >
      <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-[#8ec8ff]/10" dir="ltr">
        {beats.map((b, i) => (
          <div
            key={`${b.from}-${b.to}`}
            className="h-full"
            style={{
              flex: Math.max(0.4, b.to - b.from),
              background: i === 2 ? 'rgba(255,176,32,0.85)' : i === 1 ? '#8ec8ff' : 'rgba(142,200,255,0.45)',
            }}
          />
        ))}
      </div>
      <div className="mb-3 flex justify-between font-mono text-[9px] text-[#93a0b5]" dir="ltr">
        <span>0.0s</span>
        <span>{duration === 5 ? '5.0s' : '10.0s'}</span>
      </div>
      <ol className="space-y-2">
        {beats.map((b, i) => (
          <li key={`${b.from}-${i}`} className="flex items-start gap-3 rounded-xl border border-[#8ec8ff]/12 bg-black/30 px-3 py-2">
            <span className="shrink-0 font-mono text-[10px] font-black text-[#8ec8ff]" dir="ltr">
              {b.from.toFixed(1)}–{b.to.toFixed(1)}
            </span>
            <span>
              <span className="block text-[12px] font-black text-[#e7eef8]">{lines[i]?.title}</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-[#93a0b5]">{lines[i]?.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </StudioCard>
  );
}
