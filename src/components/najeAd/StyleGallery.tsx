import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { AD_STYLES, AdStyle } from '../../data/adStyles';
import { CircularCardCarousel } from './CircularCardCarousel';
import { useI18n } from '../../i18n';

export function StyleGallery({
  selectedStyleId,
  onSelectStyle,
}: {
  selectedStyleId: string | null;
  onSelectStyle: (styleId: string) => void;
}) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [centerIndex, setCenterIndex] = useState(0);
  const styleName = (style: AdStyle) => t(`adui.style.${style.id}`);
  const styleDesc = (style: AdStyle) => t(`adui.styledesc.${style.id}`);
  const filtered = useMemo(
    () => AD_STYLES.filter((style) => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return styleName(style).toLowerCase().includes(q)
        || styleDesc(style).toLowerCase().includes(q)
        || style.name.toLowerCase().includes(q)
        || style.desc.toLowerCase().includes(q);
    }),
    [searchTerm, t]
  );
  const current = AD_STYLES.find((s) => s.id === selectedStyleId);

  return (
    <div className="space-y-2.5 text-start">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white sm:text-base">{t('adui.styleTitle')}</h2>
          <p className="truncate text-[10px] text-white/45 sm:text-[11px]">
            {t('adui.styleCurrent')} <span className="font-bold text-[var(--naje-accent-2)]">{current ? styleName(current) : t('adui.stylePick')}</span>
          </p>
        </div>
        <span
          className="shrink-0 rounded-lg border border-white/10 px-2 py-1 font-mono text-[11px] font-bold text-[var(--naje-accent-2)]"
          dir="ltr"
          style={{ unicodeBidi: 'bidi-override' }}
        >
          {filtered.length ? `${centerIndex + 1} / ${filtered.length}` : '0'}
        </span>
      </div>
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('adui.searchStyle')}
          className="w-full rounded-xl border border-white/10 bg-black/35 py-2 ps-9 pe-3 text-xs text-white placeholder:text-white/30 focus:border-[var(--naje-accent-2)] focus:outline-none"
        />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#0c0e14] px-1 py-3 sm:rounded-3xl sm:px-2 sm:py-4">
        <CircularCardCarousel<AdStyle>
          items={filtered}
          getKey={(style) => style.id}
          isSelected={(style) => style.id === selectedStyleId}
          onSelect={(style) => onSelectStyle(style.id)}
          centerIndex={centerIndex}
          onCenterIndexChange={setCenterIndex}
          frameClassName="h-[292px] sm:h-[332px]"
          renderCard={(style) => (
            <div
              className={`flex h-[260px] w-[38vw] max-w-[10rem] flex-col overflow-hidden rounded-2xl border sm:h-[292px] sm:max-w-[11.5rem] ${
                style.id === selectedStyleId ? 'border-[var(--naje-accent)]' : 'border-white/10'
              }`}
            >
              <div
                className="relative min-h-0 flex-1 overflow-hidden"
                style={{ background: `linear-gradient(145deg, ${style.gradient[0]}, ${style.gradient[1]})` }}
              >
                <img
                  src={style.image}
                  alt={styleName(style)}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className="absolute start-2 bottom-2 text-sm font-black text-white drop-shadow">{styleName(style)}</span>
              </div>
              <div className="shrink-0 bg-[#12141c] p-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStyle(style.id);
                  }}
                  className="w-full rounded-xl bg-[var(--naje-accent)] py-2 text-[12px] font-black leading-none text-[var(--naje-on-accent)]"
                >
                  {t('adui.adoptStyle')}
                </button>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
