import React from 'react';
import type { MotionBeat, MotionDuration } from '../../lib/motionStudio';
import { StudioCard } from './StudioUi';

export function MotionPlanView({
  beats,
  duration,
}: {
  beats: MotionBeat[];
  duration: MotionDuration;
}) {
  const total = duration;
  return (
    <StudioCard
      title="خطة الحركة"
      hint={
        duration === 5
          ? 'ثلاث ضربات على ساعة الخمس ثوانٍ. الثواني 5–10 ثبات شعار داخل نافذة المحرك.'
          : 'ثلاث ضربات على عشر ثوانٍ. تُخبز في التوجيه قبل الإنتاج.'
      }
    >
      <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-white/8" dir="ltr">
        {beats.map((b, i) => (
          <div
            key={`${b.from}-${b.to}`}
            className="h-full"
            style={{
              flex: Math.max(0.4, b.to - b.from),
              background: i === 0 ? '#d4a574' : i === 1 ? '#e8b86d' : 'rgba(212,165,116,0.45)',
            }}
          />
        ))}
      </div>
      <div className="mb-3 flex justify-between font-mono text-[9px] text-white/35" dir="ltr">
        <span>0.0s</span>
        <span>{total.toFixed(1)}s</span>
      </div>
      <ol className="space-y-2">
        {beats.map((b) => (
          <li
            key={`${b.from}-${b.title}`}
            className="flex items-start gap-3 rounded-xl border border-white/8 bg-black/30 px-3 py-2"
          >
            <span className="shrink-0 font-mono text-[10px] font-black text-[#e8b86d]" dir="ltr">
              {b.from.toFixed(1)}–{b.to.toFixed(1)}
            </span>
            <span>
              <span className="block text-[12px] font-black text-white">{b.title}</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-white/50">{b.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </StudioCard>
  );
}
