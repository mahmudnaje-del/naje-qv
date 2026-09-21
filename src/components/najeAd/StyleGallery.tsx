import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { AD_STYLES, AdStyle } from '../../data/adStyles';
import { CircularCardCarousel } from './CircularCardCarousel';

export function StyleGallery({
  selectedStyleId,
  onSelectStyle,
}: {
  selectedStyleId: string | null;
  onSelectStyle: (styleId: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [centerIndex, setCenterIndex] = useState(0);
  const filtered = useMemo(
    () => AD_STYLES.filter((t) => t.name.includes(searchTerm) || t.desc.includes(searchTerm)),
    [searchTerm]
  );
  const current = AD_STYLES.find((s) => s.id === selectedStyleId);

  return (
    <div className="space-y-2.5 text-right" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white sm:text-base">أسلوب الإعلان</h2>
          <p className="truncate text-[10px] text-white/45 sm:text-[11px]">
            الحالي: <span className="font-bold text-[var(--naje-accent-2)]">{current?.name || 'اختر أسلوباً إعلانياً'}</span>
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
        <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث عن أسلوب إعلان..."
          className="w-full rounded-xl border border-white/10 bg-black/35 py-2 pr-9 pl-3 text-xs text-white placeholder:text-white/30 focus:border-[var(--naje-accent-2)] focus:outline-none"
        />
      </div>

      <div className="relative overflow-visible rounded-2xl border border-white/8 bg-[#0c0e14] px-1 py-3 sm:rounded-3xl sm:px-2 sm:py-4">
        <CircularCardCarousel<AdStyle>
          items={filtered}
          getKey={(t) => t.id}
          isSelected={(t) => t.id === selectedStyleId}
          onSelect={(t) => onSelectStyle(t.id)}
          centerIndex={centerIndex}
          onCenterIndexChange={setCenterIndex}
          frameClassName="h-[292px] sm:h-[332px]"
          renderCard={(t) => (
            <div
              className={`flex h-[260px] w-[40vw] max-w-[10.75rem] flex-col overflow-hidden rounded-2xl border sm:h-[292px] sm:max-w-[12.5rem] ${
                t.id === selectedStyleId ? 'border-[var(--naje-accent)]' : 'border-white/10'
              }`}
            >
              <div
                className="relative min-h-0 flex-1 overflow-hidden"
                style={{ background: `linear-gradient(145deg, ${t.gradient[0]}, ${t.gradient[1]})` }}
              >
                <img
                  src={t.image}
                  alt={t.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className="absolute right-2 bottom-2 text-sm font-black text-white drop-shadow">{t.name}</span>
              </div>
              <div className="shrink-0 bg-[#12141c] p-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStyle(t.id);
                  }}
                  className="w-full rounded-xl bg-[var(--naje-accent)] py-2 text-[12px] font-black leading-none text-[var(--naje-on-accent)]"
                >
                  اعتماد الأسلوب
                </button>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
