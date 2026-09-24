import React from 'react';
import type { HeroPresetId, MotionKind } from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';
import { KindCards } from './KindCards';
import { RegFrame } from './StudioUi';

export function HeroLaunch({
  onChoose,
}: {
  onChoose: (kind: MotionKind, preset?: HeroPresetId) => void;
}) {
  const { t } = useMotionI18n();
  return (
    <RegFrame bars className="overflow-hidden rounded-2xl bg-[#10151f] p-5 sm:rounded-[28px] sm:p-8">
      <div className="mb-4 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#8ec8ff]/25 bg-[#8ec8ff]/10 px-3 py-1 text-[10px] font-black tracking-[0.16em] text-[#e7eef8]">
        <span className="motion-tally inline-block h-2 w-2 rounded-full" aria-hidden />
        <span className="text-[#ffb020]">REC</span>
        NAJE MOTION
      </div>
      <h1 className="max-w-xl text-2xl font-black leading-snug tracking-tight text-[#e7eef8] sm:text-4xl">
        {t('motion.hero.title')}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#93a0b5] sm:text-base">{t('motion.hero.subtitle')}</p>
      <div className="mt-6">
        <KindCards variant="hero" onChange={onChoose} />
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-[#93a0b5]">{t('motion.hero.presetNote')}</p>
    </RegFrame>
  );
}
