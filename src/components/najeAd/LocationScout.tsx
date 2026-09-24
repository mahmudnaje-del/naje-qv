import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Filter, Upload, Check } from 'lucide-react';
import { LOCATION_REGISTRY, NajiLocation } from '../../data/locations/locationRegistry';
import { getCategoryLabelAr } from '../../data/locations/locationCategoryLabels';
import { CircularCardCarousel } from './CircularCardCarousel';
import { LocationPhoto } from './LocationPhoto';
import { useI18n } from '../../i18n';

const CATEGORY_KEYS: Record<string, string> = {
  Residential: 'adui.cat.residential',
  'Corporate & Business': 'adui.cat.corporate',
  'Retail & Shopping': 'adui.cat.retail',
  'Food & Hospitality': 'adui.cat.food',
  'Urban & City': 'adui.cat.urban',
  Education: 'adui.cat.education',
  Healthcare: 'adui.cat.healthcare',
  'Fitness & Sports': 'adui.cat.fitness',
  'Beauty & Fashion': 'adui.cat.beauty',
  'Technology & AI': 'adui.cat.tech',
  'Travel & Hotels': 'adui.cat.travel',
  'Nature & Outdoors': 'adui.cat.nature',
  'Automotive & Transportation': 'adui.cat.auto',
  'Studio & Creative Production': 'adui.cat.studio',
  'Community & Family': 'adui.cat.community',
  'Additional Global Commercial': 'adui.cat.global',
};

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
  const { t } = useI18n();
  const categoryLabel = (c: string) => (CATEGORY_KEYS[c] ? t(CATEGORY_KEYS[c]) : getCategoryLabelAr(c));
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
    <div className="space-y-2.5 text-start">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white sm:text-base">{t('adui.place')}</h2>
          <p className="text-[10px] text-white/45 sm:text-[11px]">{t('adui.placeHint')}</p>
        </div>
        <span
          className="shrink-0 rounded-lg border border-white/10 px-2 py-1 font-mono text-[11px] font-bold text-[var(--naje-accent)]"
          dir="ltr"
          style={{ unicodeBidi: 'bidi-override' }}
        >
          {centerIndex + 1} / {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCenterIndex(0);
            }}
            placeholder={t('adui.searchPlace')}
            className="w-full rounded-xl border border-white/10 bg-black/35 py-2 ps-9 pe-3 text-xs text-white placeholder:text-white/30 focus:border-[var(--naje-accent)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 shrink-0 text-[var(--naje-accent)]" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCenterIndex(0);
            }}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#141824] px-2.5 py-1.5 text-[11px] text-white"
          >
            <option value="all">{t('adui.allCategories')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative overflow-visible rounded-2xl border border-white/8 bg-[#0c0e14] px-1 py-3 sm:rounded-3xl sm:px-2 sm:py-4">
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
          handLabel={t('adui.swipePlaces')}
          frameClassName="h-[300px] sm:h-[340px]"
          renderCard={(c, isCenter) => {
            const shell = `flex h-[268px] w-[40vw] max-w-[10.75rem] flex-col overflow-hidden rounded-2xl border p-1.5 sm:h-[300px] sm:max-w-[12.5rem]`;
            if (c.type === 'upload') {
              return (
                <div className={`${shell} ${isCenter ? 'border-[var(--naje-accent)] bg-[#10201c]' : 'border-white/10 bg-[#12141c]'}`}>
                  <div className="mb-1.5 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-black/25 py-1">
                    <span className="h-1 w-6 rounded-full bg-[var(--naje-accent)]/80" />
                    <span className="text-[10px] font-black text-[var(--naje-accent)]">{t('adui.attachSwipe')}</span>
                    <span className="h-1 w-6 rounded-full bg-[var(--naje-accent)]/80" />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileRef.current?.click();
                    }}
                    className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--naje-accent)]/50 bg-black/30"
                  >
                    {customPreview ? (
                      <img src={customPreview} alt={t('adui.placeAlt')} className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <Upload className="mb-1 h-7 w-7 text-[var(--naje-accent)]" />
                        <span className="text-[11px] font-bold text-white/70">{t('adui.uploadPlace')}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            }
            const loc = c.location;
            const selected = loc.id === selectedLocationId;
            return (
              <div className={`${shell} ${isCenter ? 'bg-[#121622]' : 'bg-[#11141c]'} ${selected ? 'border-[var(--naje-accent)]' : 'border-white/10'}`}>
                <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl">
                  <LocationPhoto id={loc.id} name={loc.name} gradient={loc.placeholderGradient} className="h-full w-full" />
                  {selected && (
                    <span className="absolute top-2 start-2 inline-flex items-center gap-1 rounded-full bg-[var(--naje-accent)] px-2 py-0.5 text-[9px] font-black text-[var(--naje-on-accent)]">
                      <Check className="h-3 w-3" /> {t('adui.approved')}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 shrink-0 text-start">
                  <p className="truncate text-[13px] font-black leading-tight text-white">{loc.name}</p>
                  <p className={`truncate text-[10px] leading-tight ${isCenter ? 'text-[#93c5fd]' : 'text-transparent'}`}>
                    {categoryLabel(loc.category)}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLocation(loc.id);
                    }}
                    className="mt-1.5 w-full shrink-0 rounded-xl bg-[var(--naje-accent)] py-2 text-[12px] font-black leading-none text-[var(--naje-on-accent)]"
                  >
                    {t('adui.choose')}
                  </button>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
