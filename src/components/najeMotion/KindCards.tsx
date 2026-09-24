import React from 'react';
import { Clapperboard, Film, Layers, Mic, Scan, Tv } from 'lucide-react';
import { HERO_PRESETS, KIND_OPTIONS, type HeroPresetId, type MotionKind } from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';

const ICONS: Record<MotionKind, React.ReactNode> = {
  intro: <Clapperboard className="h-4 w-4" />,
  outro: <Film className="h-4 w-4" />,
  both: <Layers className="h-4 w-4" />,
  logo: <Scan className="h-4 w-4" />,
};

const PRESET_ICONS: Record<HeroPresetId, React.ReactNode> = {
  podcast: <Mic className="h-4 w-4" />,
  channel: <Tv className="h-4 w-4" />,
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
    <div className={`grid grid-cols-2 gap-2 ${hero ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
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
            className={`min-h-[44px] rounded-2xl border p-3 text-start transition ${hero ? 'sm:p-5' : 'sm:p-3.5'} ${
              on
                ? 'border-[#8ec8ff] bg-[#8ec8ff]/12 text-[#e7eef8] shadow-[0_10px_28px_-16px_rgba(142,200,255,0.55)]'
                : 'border-[#8ec8ff]/15 bg-black/25 text-[#93a0b5] hover:border-[#8ec8ff]/35 hover:text-[#e7eef8]'
            }`}
          >
            <span className="mb-2 flex items-center justify-between gap-2">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border ${
                  on ? 'border-[#8ec8ff]/50 bg-[#8ec8ff]/15 text-[#8ec8ff]' : 'border-[#8ec8ff]/15 text-[#93a0b5]'
                }`}
              >
                {ICONS[k.id]}
              </span>
              {badge && (
                <span className="rounded-full border border-[#ffb020]/40 bg-[#ffb020]/12 px-2 py-0.5 text-[9px] font-black text-[#ffb020]">
                  {badge}
                </span>
              )}
            </span>
            <div className={`font-black text-[#e7eef8] ${hero ? 'text-base' : 'text-sm'}`}>{t(`motion.kind.${k.id}`)}</div>
            <div className="mt-0.5 text-[10px] leading-relaxed text-[#93a0b5]">{t(`motion.kind.${k.id}Hint`)}</div>
          </button>
        );
      })}
      {hero &&
        HERO_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.kind, p.id)}
            className="min-h-[44px] rounded-2xl border border-dashed border-[#8ec8ff]/45 bg-[#8ec8ff]/8 p-3 text-start transition hover:border-[#8ec8ff] hover:bg-[#8ec8ff]/12 sm:p-5"
          >
            <span className="mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#8ec8ff]/50 bg-[#8ec8ff]/15 text-[#8ec8ff]">
                {PRESET_ICONS[p.id]}
              </span>
              <span className="rounded-full border border-[#ffb020]/40 bg-[#ffb020]/12 px-2 py-0.5 text-[9px] font-black text-[#ffb020]">
                {t('motion.hero.readyBadge')}
              </span>
            </span>
            <div className="text-base font-black text-[#e7eef8]">{t(`motion.preset.${p.id}`)}</div>
            <div className="mt-0.5 text-[10px] leading-relaxed text-[#93a0b5]">{t(`motion.preset.${p.id}Hint`)}</div>
          </button>
        ))}
    </div>
  );
}
