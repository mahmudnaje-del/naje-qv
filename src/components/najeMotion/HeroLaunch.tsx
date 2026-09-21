import React from 'react';
import { Clapperboard } from 'lucide-react';
import type { HeroPresetId, MotionKind } from '../../lib/motionStudio';
import { KindCards } from './KindCards';

export function HeroLaunch({
  onChoose,
}: {
  onChoose: (kind: MotionKind, preset?: HeroPresetId) => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/8 bg-[radial-gradient(1100px_circle_at_100%_-8%,rgba(212,165,116,0.32),transparent_44%),radial-gradient(700px_circle_at_-10%_120%,rgba(196,92,74,0.14),transparent_48%),linear-gradient(180deg,#1a140e,#0b0c10_62%)] p-5 shadow-2xl sm:rounded-[32px] sm:p-8">
      <div className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full bg-[#d4a574]/10 blur-3xl" />
      <div className="mb-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#d4a574]/30 bg-[#d4a574]/10 px-3 py-1 text-[10px] font-black tracking-[0.16em] text-[#e8b86d]">
        <Clapperboard className="h-3.5 w-3.5" /> NAJE MOTION
      </div>
      <h1 className="max-w-xl text-2xl font-black leading-snug tracking-tight text-white sm:text-4xl">
        اصنع مقدمتك وخاتمتك بأسلوبك
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
        حوّل شعارك وهويتك إلى مقدمة أو خاتمة فيديو احترافية خلال دقائق.
      </p>
      <p className="mt-2 text-[12px] font-bold text-[#e8b86d]">اصنع حضورك قبل أن يبدأ المحتوى.</p>
      <div className="mt-6">
        <KindCards variant="hero" onChange={onChoose} />
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-white/40">
        البودكاست وحزمة القناة إعدادات جاهزة فوق الأنواع الأربعة — ليست مسارات محرّك جديدة.
      </p>
    </section>
  );
}
