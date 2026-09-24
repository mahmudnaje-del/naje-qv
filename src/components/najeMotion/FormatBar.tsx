import React from 'react';
import type { MotionAspect, MotionDuration, MotionRes } from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';
import { Chip, ChipRow, StudioCard } from './StudioUi';

const ASPECTS: { id: MotionAspect; key: string }[] = [
  { id: '16:9', key: 'wide' },
  { id: '9:16', key: 'tall' },
  { id: '1:1', key: 'square' },
  { id: '4:5', key: 'fourFive' },
];

export function FormatBar({
  duration,
  aspect,
  resolution,
  onDuration,
  onAspect,
  onResolution,
}: {
  duration: MotionDuration;
  aspect: MotionAspect;
  resolution: MotionRes;
  onDuration: (v: MotionDuration) => void;
  onAspect: (v: MotionAspect) => void;
  onResolution: (v: MotionRes) => void;
}) {
  const { t, formatNumber } = useMotionI18n();
  const clock = { full: formatNumber(10), sting: formatNumber(5) };
  return (
    <StudioCard title={t('motion.format.title')} hint={t('motion.format.hint', clock)}>
      <div className="space-y-3">
        <ChipRow title={t('motion.format.duration')}>
          {([5, 10] as const).map((d) => (
            <Chip key={d} active={duration === d} onClick={() => onDuration(d)}>
              {formatNumber(d)}
              {t('motion.format.unit')}
            </Chip>
          ))}
        </ChipRow>
        {duration === 5 && (
          <p className="rounded-xl border border-[#ffb020]/30 bg-[#ffb020]/10 px-3 py-2 text-[10px] leading-relaxed text-[#ffb020]">
            {t('motion.format.sting', clock)}
          </p>
        )}
        <ChipRow title={t('motion.format.frame')}>
          {ASPECTS.map((a) => (
            <Chip key={a.id} active={aspect === a.id} onClick={() => onAspect(a.id)}>
              {t(`motion.aspect.${a.key}`)}
            </Chip>
          ))}
        </ChipRow>
        {aspect === '1:1' && <p className="text-[10px] leading-relaxed text-[#93a0b5]">{t('motion.format.square')}</p>}
        {aspect === '4:5' && <p className="text-[10px] leading-relaxed text-[#93a0b5]">{t('motion.format.fourFive')}</p>}
        <ChipRow title={t('motion.format.res')}>
          <Chip active={resolution === '720p'} onClick={() => onResolution('720p')}>
            720p
          </Chip>
          <Chip active={resolution === '1080p'} onClick={() => onResolution('1080p')}>
            1080p
          </Chip>
        </ChipRow>
      </div>
    </StudioCard>
  );
}
