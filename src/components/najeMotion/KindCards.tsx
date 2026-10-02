import React from 'react';
import { Clapperboard, Film, Layers, Mic, Scan, ShoppingBag, Smartphone, Tv } from 'lucide-react';
import { HERO_PRESETS, KIND_OPTIONS, type HeroPresetId, type MotionKind } from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';

const ICONS: Record<MotionKind, React.ReactNode> = {
  intro: <Clapperboard className="h-4 w-4 sm:h-5 sm:w-5" />,
  outro: <Film className="h-4 w-4 sm:h-5 sm:w-5" />,
  both: <Layers className="h-4 w-4 sm:h-5 sm:w-5" />,
  logo: <Scan className="h-4 w-4 sm:h-5 sm:w-5" />,
};

const PRESET_ICONS: Record<HeroPresetId, React.ReactNode> = {
  podcast: <Mic className="h-4 w-4 sm:h-5 sm:w-5" />,
  channel: <Tv className="h-4 w-4 sm:h-5 sm:w-5" />,
};

export function KindCards({
  value,
  onChange,
  variant = 'editor',
  preset,
}: {
  value?: MotionKind;
  onChange: (kind: MotionKind, preset?: HeroPresetId) => void;
  variant?: 'hero' | 'editor';
  preset?: string;
}) {
  const { t } = useMotionI18n();
  const hero = variant === 'hero';

  return (
    <div
      className={
        hero
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'
          : 'grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3'
      }
    >
      {KIND_OPTIONS.map((k) => {
        const on = value === k.id;
        const badge =
          preset === 'podcast' && k.id === 'intro'
            ? t('motion.preset.podcastBadge')
            : preset === 'channel' && k.id === 'both'
              ? t('motion.preset.channelBadge')
              : null;

        return (
          <button
            key={k.id}
            type="button"
            onClick={() => onChange(k.id)}
            className={`min-h-[64px] sm:min-h-[72px] rounded-2xl border p-3 sm:p-4 text-start transition-all active:scale-[0.98] touch-manipulation select-none relative overflow-hidden flex flex-col justify-between ${
              hero ? 'p-4 sm:p-5' : ''
            } ${
              on
                ? 'border-[#8ec8ff] bg-gradient-to-br from-[#8ec8ff]/20 via-[#8ec8ff]/10 to-transparent text-[#e7eef8] shadow-[0_8px_24px_-8px_rgba(142,200,255,0.4)] ring-1 ring-[#8ec8ff]/40'
                : 'border-[#8ec8ff]/15 bg-black/35 text-[#93a0b5] hover:border-[#8ec8ff]/35 hover:bg-black/55 hover:text-[#e7eef8]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2 w-full">
              <span
                className={`inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border transition-colors ${
                  on
                    ? 'border-[#8ec8ff]/60 bg-[#8ec8ff]/25 text-[#8ec8ff] shadow-sm'
                    : 'border-[#8ec8ff]/15 bg-black/40 text-[#93a0b5]'
                }`}
              >
                {ICONS[k.id]}
              </span>
              {badge && (
                <span className="rounded-full border border-[#ffb020]/50 bg-[#ffb020]/15 px-2 py-0.5 text-[9px] font-black text-[#ffb020] shrink-0">
                  {badge}
                </span>
              )}
              {on && (
                <span className="w-2 h-2 rounded-full bg-[#8ec8ff] shadow-[0_0_8px_#8ec8ff] shrink-0" />
              )}
            </div>

            <div>
              <div className={`font-black text-[#e7eef8] tracking-tight ${hero ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
                {t(`motion.kind.${k.id}`)}
              </div>
              <div className="mt-0.5 text-[10px] sm:text-[11px] leading-relaxed text-[#93a0b5] line-clamp-2">
                {t(`motion.kind.${k.id}Hint`)}
              </div>
            </div>
          </button>
        );
      })}

      {hero &&
        HERO_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.kind, p.id)}
            className="min-h-[64px] sm:min-h-[72px] rounded-2xl border border-dashed border-[#8ec8ff]/40 bg-gradient-to-br from-[#8ec8ff]/10 via-[#8ec8ff]/5 to-transparent p-4 sm:p-5 text-start transition-all hover:border-[#8ec8ff] hover:bg-[#8ec8ff]/15 active:scale-[0.98] select-none flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-2 w-full">
              <span className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[#8ec8ff]/50 bg-[#8ec8ff]/20 text-[#8ec8ff]">
                {PRESET_ICONS[p.id]}
              </span>
              <span className="rounded-full border border-[#ffb020]/45 bg-[#ffb020]/15 px-2 py-0.5 text-[9px] font-black text-[#ffb020]">
                {t('motion.hero.readyBadge')}
              </span>
            </div>
            <div>
              <div className="text-sm sm:text-base font-black text-[#e7eef8] tracking-tight">
                {t(`motion.preset.${p.id}`)}
              </div>
              <div className="mt-0.5 text-[10px] sm:text-[11px] leading-relaxed text-[#93a0b5] line-clamp-2">
                {t(`motion.preset.${p.id}Hint`)}
              </div>
            </div>
          </button>
        ))}
    </div>
  );
}
