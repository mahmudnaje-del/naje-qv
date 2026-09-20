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
    <div className="space-y-3 text-right" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-black text-white">أسلوب الإعلان</h2>
          <p className="text-[11px] text-white/45">
            الحالي: <span className="font-bold text-[#e8b86d]">{current?.name || 'اختر أسلوباً إعلانياً'}</span>
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن أسلوب إعلان..."
            className="w-full rounded-xl border border-white/10 bg-black/35 py-2 pr-10 pl-3 text-xs text-white placeholder:text-white/30 focus:border-[#e8b86d] focus:outline-none"
          />
        </div>
      </div>

      <CircularCardCarousel<AdStyle>
        items={filtered}
        getKey={(t) => t.id}
        isSelected={(t) => t.id === selectedStyleId}
        onSelect={(t) => onSelectStyle(t.id)}
        centerIndex={centerIndex}
        onCenterIndexChange={setCenterIndex}
        frameClassName="h-[380px] sm:h-[400px]"
        renderCard={(t, isCenter) => (
          <div
            className={`overflow-hidden rounded-2xl border ${isCenter ? 'w-[78vw] max-w-64' : 'w-40'} ${
              t.id === selectedStyleId ? 'border-[#d4a574]' : 'border-white/10'
            }`}
          >
            <div className="flex aspect-[5/3] items-end p-3" style={{ background: `linear-gradient(145deg, ${t.gradient[0]}, ${t.gradient[1]})` }}>
              <span className="text-sm font-black text-white drop-shadow">{t.name}</span>
            </div>
            {isCenter && (
              <div className="bg-[#12141c] p-3">
                <p className="text-[11px] leading-relaxed text-white/55">{t.desc}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStyle(t.id);
                  }}
                  className="mt-2 w-full rounded-xl py-1.5 text-[11px] font-black text-black"
                  style={{ background: t.accent }}
                >
                  اعتماد الأسلوب
                </button>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
}
