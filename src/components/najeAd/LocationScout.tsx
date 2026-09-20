import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Filter, Upload, Check } from 'lucide-react';
import { LOCATION_REGISTRY, NajiLocation } from '../../data/locations/locationRegistry';
import { getCategoryLabelAr } from '../../data/locations/locationCategoryLabels';
import { CircularCardCarousel } from './CircularCardCarousel';
import { LocationPhoto } from './LocationPhoto';

type Card = { type: 'upload'; id: '__upload__' } | { type: 'location'; id: string; location: NajiLocation };

export function LocationScout({
  selectedLocationId,
  customPreview,
  onSelectLocation,
  onCustomFile,
  showHint,
  onUserSwipe,
}: {
  selectedLocationId: string | null;
  customPreview: string | null;
  onSelectLocation: (id: string | null) => void;
  onCustomFile: (dataUrl: string) => void;
  showHint: boolean;
  onUserSwipe: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [centerIndex, setCenterIndex] = useState(0);
  const allLocations = useMemo(() => Object.values(LOCATION_REGISTRY), []);
  const categories = useMemo(() => Array.from(new Set(allLocations.map((l) => l.category.trim()))), [allLocations]);

  const filtered = useMemo(
    () =>
      allLocations.filter((loc) => {
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch = !q || loc.name.toLowerCase().includes(q) || loc.description.toLowerCase().includes(q);
        const matchesCat = selectedCategory === 'all' || loc.category === selectedCategory;
        return matchesSearch && matchesCat;
      }),
    [allLocations, searchTerm, selectedCategory]
  );

  const items: Card[] = useMemo(
    () => [{ type: 'upload', id: '__upload__' }, ...filtered.map((location) => ({ type: 'location' as const, id: location.id, location }))],
    [filtered]
  );

  useEffect(() => {
    if (!selectedLocationId) return;
    const found = items.findIndex((c) => c.type === 'location' && c.id === selectedLocationId);
    if (found !== -1) setCenterIndex(found);
  }, [selectedLocationId]);

  const pickFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCustomFile(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2.5 text-right" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white sm:text-base">المكان</h2>
          <p className="text-[10px] text-white/45 sm:text-[11px]">أرفق موقعك أو اسحب مواقع تصوير ناجي</p>
        </div>
        <span className="shrink-0 rounded-lg border border-white/10 px-2 py-1 font-mono text-[11px] font-bold text-[#7dd3c7]">
          {centerIndex + 1}/{items.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCenterIndex(0);
            }}
            placeholder="ابحث عن موقع..."
            className="w-full rounded-xl border border-white/10 bg-black/35 py-2 pr-9 pl-3 text-xs text-white placeholder:text-white/30 focus:border-[#7dd3c7] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 shrink-0 text-[#7dd3c7]" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCenterIndex(0);
            }}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#141824] px-2.5 py-1.5 text-[11px] text-white"
          >
            <option value="all">كل الفئات</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {getCategoryLabelAr(c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative overflow-visible rounded-2xl border border-white/8 bg-[#0c0e14] px-5 py-3 sm:rounded-3xl sm:px-8 sm:py-4">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
        <CircularCardCarousel<Card>
          items={items}
          getKey={(c) => c.id}
          isSelected={(c) => (c.type === 'upload' ? Boolean(customPreview) && !selectedLocationId : c.id === selectedLocationId)}
          onSelect={(c) => {
            if (c.type === 'location') onSelectLocation(c.id);
          }}
          centerIndex={centerIndex}
          onCenterIndexChange={setCenterIndex}
          onUserSwipe={onUserSwipe}
          showHand={showHint && centerIndex === 0}
          handLabel="اسحب لمواقع ناجي"
          frameClassName="h-[280px] sm:h-[360px]"
          renderCard={(c, isCenter) => {
            if (c.type === 'upload') {
              return (
                <div className={`w-[64vw] max-w-[16rem] rounded-2xl border p-2.5 ${isCenter ? 'border-[#7dd3c7] bg-[#10201c]' : 'border-white/10 bg-[#12141c]'}`}>
                  <div className="mb-2 flex items-center justify-center gap-2 rounded-xl bg-black/25 py-1">
                    <span className="h-1 w-6 rounded-full bg-[#7dd3c7]/80" />
                    <span className="text-[10px] font-black text-[#7dd3c7]">إرفاق · اسحب</span>
                    <span className="h-1 w-6 rounded-full bg-[#7dd3c7]/80" />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileRef.current?.click();
                    }}
                    className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#7dd3c7]/50 bg-black/30"
                  >
                    {customPreview ? (
                      <img src={customPreview} alt="مكان" className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <Upload className="mb-1 h-7 w-7 text-[#7dd3c7]" />
                        <span className="text-[11px] font-bold text-white/70">ارفق صورة الموقع</span>
                      </>
                    )}
                  </div>
                </div>
              );
            }
            const loc = c.location;
            const selected = loc.id === selectedLocationId;
            return (
              <div className={`w-[64vw] max-w-[16rem] rounded-2xl border p-2 ${isCenter ? 'bg-[#121622]' : 'bg-[#11141c]'} ${selected ? 'border-[#7dd3c7]' : 'border-white/10'}`}>
                <div className="relative aspect-video overflow-hidden rounded-xl">
                  <LocationPhoto id={loc.id} name={loc.name} gradient={loc.placeholderGradient} className="h-full w-full" />
                  {selected && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-[#7dd3c7] px-2 py-0.5 text-[9px] font-black text-black">
                      <Check className="h-3 w-3" /> معتمد
                    </span>
                  )}
                </div>
                {isCenter && (
                  <div className="mt-2 text-right">
                    <p className="text-sm font-black text-white">{loc.name}</p>
                    <p className="text-[11px] text-[#93c5fd]">{getCategoryLabelAr(loc.category)}</p>
                    <p className="line-clamp-2 text-[10px] text-white/40">{loc.description}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLocation(loc.id);
                      }}
                      className="mt-2 w-full rounded-xl bg-[#7dd3c7] py-1.5 text-[11px] font-black text-black"
                    >
                      اختيار
                    </button>
                  </div>
                )}
                {!isCenter && <p className="mt-1 truncate text-[11px] font-bold text-white">{loc.name}</p>}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
