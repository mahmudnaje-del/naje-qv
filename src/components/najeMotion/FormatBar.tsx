import React from 'react';
import { Monitor, Smartphone, Square, Sliders, Film, Clock, Sparkles } from 'lucide-react';
import type { MotionAspect, MotionDuration, MotionRes } from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';
import { Chip, ChipRow, StudioCard } from './StudioUi';

interface AspectOption {
  id: MotionAspect;
  key: string;
  icon: React.ReactNode;
  subtitle: string;
}

const ASPECTS: AspectOption[] = [
  {
    id: '16:9',
    key: 'wide',
    icon: <Monitor className="w-4 h-4 shrink-0" />,
    subtitle: 'يوتيوب وشاشات',
  },
  {
    id: '9:16',
    key: 'tall',
    icon: <Smartphone className="w-4 h-4 shrink-0" />,
    subtitle: 'ريلز وشورتس وتيك توك',
  },
  {
    id: '1:1',
    key: 'square',
    icon: <Square className="w-4 h-4 shrink-0" />,
    subtitle: 'خلاصات إنستغرام',
  },
  {
    id: '4:5',
    key: 'fourFive',
    icon: <div className="w-3.5 h-4.5 border border-current rounded-[2px]" />,
    subtitle: 'بوست عمودي',
  },
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
    <StudioCard
      title={t('motion.format.title')}
      hint={t('motion.format.hint', clock)}
      icon={<Sliders className="w-4 h-4 text-[#8ec8ff]" />}
    >
      <div className="space-y-4">
        {/* Aspect Ratio Cards with Visual Wireframes */}
        <div>
          <p className="mb-2 text-xs font-black text-[#e7eef8] tracking-tight">{t('motion.format.frame')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ASPECTS.map((a) => {
              const on = aspect === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onAspect(a.id)}
                  className={`min-h-[58px] rounded-xl sm:rounded-2xl border p-2.5 text-start transition-all active:scale-95 flex flex-col justify-between select-none ${
                    on
                      ? 'border-[#8ec8ff] bg-[#8ec8ff]/20 text-[#e7eef8] ring-1 ring-[#8ec8ff]/40 shadow-xs'
                      : 'border-[#8ec8ff]/15 bg-black/40 text-[#93a0b5] hover:border-[#8ec8ff]/35 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className={on ? 'text-[#8ec8ff]' : 'text-[#93a0b5]'}>{a.icon}</span>
                    <span className="font-mono text-xs font-black">{a.id}</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{t(`motion.aspect.${a.key}`)}</div>
                    <div className="text-[9px] text-[#93a0b5]/80 truncate">{a.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {aspect === '1:1' && <p className="mt-1 text-[10px] leading-relaxed text-[#93a0b5]">{t('motion.format.square')}</p>}
          {aspect === '4:5' && <p className="mt-1 text-[10px] leading-relaxed text-[#93a0b5]">{t('motion.format.fourFive')}</p>}
        </div>

        {/* Duration & Resolution Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#8ec8ff]/10">
          {/* Duration Selector */}
          <div>
            <p className="mb-2 text-xs font-black text-[#e7eef8] tracking-tight flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ffb020]" />
              <span>{t('motion.format.duration')}</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([5, 10] as const).map((d) => {
                const on = duration === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onDuration(d)}
                    className={`min-h-[46px] rounded-xl border px-3 py-2 text-center transition-all active:scale-95 ${
                      on
                        ? 'border-[#ffb020] bg-[#ffb020]/20 text-[#ffb020] ring-1 ring-[#ffb020]/40 font-black'
                        : 'border-[#8ec8ff]/15 bg-black/40 text-[#93a0b5] font-bold hover:border-[#8ec8ff]/30'
                    }`}
                  >
                    <div className="text-xs">
                      {formatNumber(d)} {t('motion.format.unit')}
                    </div>
                    <div className="text-[9px] text-[#93a0b5]">
                      {d === 5 ? 'خاطف ستينغ (نصف التكلفة)' : 'شارة وهوية كاملة'}
                    </div>
                  </button>
                );
              })}
            </div>
            {duration === 5 && (
              <p className="mt-1.5 rounded-xl border border-[#ffb020]/30 bg-[#ffb020]/10 px-2.5 py-1.5 text-[10px] leading-relaxed text-[#ffb020]">
                {t('motion.format.sting', clock)}
              </p>
            )}
          </div>

          {/* Resolution Selector */}
          <div>
            <p className="mb-2 text-xs font-black text-[#e7eef8] tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#8ec8ff]" />
              <span>{t('motion.format.res')}</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onResolution('720p')}
                className={`min-h-[46px] rounded-xl border px-3 py-2 text-center transition-all active:scale-95 ${
                  resolution === '720p'
                    ? 'border-[#8ec8ff] bg-[#8ec8ff]/20 text-[#8ec8ff] ring-1 ring-[#8ec8ff]/40 font-black'
                    : 'border-[#8ec8ff]/15 bg-black/40 text-[#93a0b5] font-bold hover:border-[#8ec8ff]/30'
                }`}
              >
                <div className="text-xs">720p HD</div>
                <div className="text-[9px] text-[#93a0b5]">سريع واقتصادي</div>
              </button>
              <button
                type="button"
                onClick={() => onResolution('1080p')}
                className={`min-h-[46px] rounded-xl border px-3 py-2 text-center transition-all active:scale-95 ${
                  resolution === '1080p'
                    ? 'border-[#8ec8ff] bg-[#8ec8ff]/20 text-[#8ec8ff] ring-1 ring-[#8ec8ff]/40 font-black'
                    : 'border-[#8ec8ff]/15 bg-black/40 text-[#93a0b5] font-bold hover:border-[#8ec8ff]/30'
                }`}
              >
                <div className="text-xs">1080p FHD</div>
                <div className="text-[9px] text-[#93a0b5]">فائق الدقة للإنتاج</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </StudioCard>
  );
}
