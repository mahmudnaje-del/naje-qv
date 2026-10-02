import React from 'react';
import { Layers, Clock } from 'lucide-react';
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
      icon={<Layers className="w-4 h-4 text-[#8ec8ff]" />}
    >
      {/* Visual Multi-Segment Timeline Bar */}
      <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-black/60 border border-[#8ec8ff]/20 p-0.5" dir="ltr">
        {beats.map((b, i) => (
          <div
            key={`${b.from}-${b.to}`}
            className="h-full rounded-full transition-all duration-300"
            style={{
              flex: Math.max(0.4, b.to - b.from),
              background:
                i === 0
                  ? 'linear-gradient(90deg, #38bdf8, #818cf8)'
                  : i === 1
                    ? 'linear-gradient(90deg, #818cf8, #c084fc)'
                    : 'linear-gradient(90deg, #ffb020, #f59e0b)',
            }}
          />
        ))}
      </div>

      <div className="mb-3.5 flex justify-between font-mono text-[10px] text-[#93a0b5]" dir="ltr">
        <span>0.0s (البداية)</span>
        <span>{duration === 5 ? '5.0s (الختام)' : '10.0s (الختام)'}</span>
      </div>

      {/* Beats List */}
      <ol className="space-y-2">
        {beats.map((b, i) => (
          <li
            key={`${b.from}-${i}`}
            className="flex items-start gap-3 rounded-xl sm:rounded-2xl border border-[#8ec8ff]/12 bg-black/35 p-3 text-start transition-colors hover:border-[#8ec8ff]/25"
          >
            <span
              className="inline-flex min-h-[28px] items-center justify-center shrink-0 rounded-lg bg-[#8ec8ff]/15 border border-[#8ec8ff]/30 px-2 py-0.5 font-mono text-[11px] font-black text-[#8ec8ff]"
              dir="ltr"
            >
              {b.from.toFixed(1)}–{b.to.toFixed(1)}s
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-xs sm:text-sm font-black text-[#e7eef8] tracking-tight">
                {lines[i]?.title}
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-[#93a0b5]">
                {lines[i]?.body}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </StudioCard>
  );
}
