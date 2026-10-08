import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Filter, Upload, Check } from 'lucide-react';
import { AVATAR_REGISTRY, NajiAvatar, interleaveDiverseAvatars } from '../../data/avatars/avatarRegistry';
import { getRegionLabelAr } from '../../data/avatars/avatarRegionLabels';
import { CircularCardCarousel } from './CircularCardCarousel';
import { AvatarPhoto } from './AvatarPhoto';
import { useI18n } from '../../i18n';

const REGION_KEYS: Record<string, string> = {
  'MENA / West Asia': 'adui.region.mena',
  'Sub-Saharan Africa': 'adui.region.africa',
  'South Asia': 'adui.region.southasia',
  'East / Southeast Asia': 'adui.region.eastasia',
  Europe: 'adui.region.europe',
  'North America': 'adui.region.northamerica',
  'Latin America / Caribbean': 'adui.region.latam',
  'Oceania / Global Mix': 'adui.region.oceania',
};

type Card = { type: 'upload'; id: '__upload__' } | { type: 'avatar'; id: string; avatar: NajiAvatar };

export function CastingRoom({
  selectedAvatarId,
  customPreview,
  onSelectAvatar,
  onCustomFile,
  showHint,
  onUserSwipe,
}: {
  selectedAvatarId: string | null;
  customPreview: string | null;
  onSelectAvatar: (id: string | null) => void;
  onCustomFile: (dataUrl: string) => void;
  showHint: boolean;
  onUserSwipe: () => void;
}) {
  const { t } = useI18n();
  const ageLabels: Record<string, string> = {
    all: t('adui.ageAll'),
    child: t('adui.ageChild'),
    teen: t('adui.ageTeen'),
    young_adult: t('adui.ageYoung'),
    adult_26_35: '26-35',
    adult_36_45: '36-45',
    adult_46_55: '46-55',
    senior_56_65: '56-65',
    senior_66_plus: '66+',
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [centerIndex, setCenterIndex] = useState(0);

  const allAvatars = useMemo(() => interleaveDiverseAvatars(Object.values(AVATAR_REGISTRY)), []);
  const regions = useMemo(() => {
    const set = new Set<string>();
    allAvatars.forEach((av) => set.add(av.visualRegion.split('—')[0].trim()));
    return Array.from(set);
  }, [allAvatars]);

  const filteredAvatars = useMemo(
    () =>
      interleaveDiverseAvatars(
        allAvatars.filter((av) => {
          const q = searchTerm.trim().toLowerCase();
          const matchesSearch =
            !q ||
            av.name.toLowerCase().includes(q) ||
            av.profession.toLowerCase().includes(q) ||
            av.visualRegion.toLowerCase().includes(q);
          const matchesAge = selectedAgeGroup === 'all' || av.ageGroup === selectedAgeGroup;
          const matchesRegion = selectedRegion === 'all' || av.visualRegion.startsWith(selectedRegion);
          return matchesSearch && matchesAge && matchesRegion;
        })
      ),
    [allAvatars, searchTerm, selectedAgeGroup, selectedRegion]
  );

  const items: Card[] = useMemo(
    () => [{ type: 'upload', id: '__upload__' }, ...filteredAvatars.map((avatar) => ({ type: 'avatar' as const, id: avatar.id, avatar }))],
    [filteredAvatars]
  );

  useEffect(() => {
    if (!selectedAvatarId) return;
    const found = items.findIndex((c) => c.type === 'avatar' && c.id === selectedAvatarId);
    if (found !== -1) setCenterIndex(found);
  }, [selectedAvatarId]);

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
          <h2 className="text-sm font-black text-white sm:text-base">{t('adui.character')}</h2>
          <p className="text-[10px] text-white/45 sm:text-[11px]">{t('adui.characterHint')}</p>
        </div>
        <span
          className="shrink-0 rounded-lg border border-white/10 px-2 py-1 font-mono text-[11px] font-bold text-[var(--naje-accent-2)]"
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
            placeholder={t('adui.searchTalent')}
            className="w-full rounded-xl border border-white/10 bg-black/35 py-2 ps-9 pe-3 text-xs text-white placeholder:text-white/30 focus:border-[var(--naje-accent)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <Filter className="h-3.5 w-3.5 shrink-0 text-[var(--naje-accent)]" />
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setCenterIndex(0);
            }}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#141824] px-2.5 py-1.5 text-[11px] text-white"
          >
            <option value="all">{t('adui.allRegions')}</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {REGION_KEYS[r] ? t(REGION_KEYS[r]) : getRegionLabelAr(r)}
              </option>
            ))}
          </select>
          <select
            value={selectedAgeGroup}
            onChange={(e) => {
              setSelectedAgeGroup(e.target.value);
              setCenterIndex(0);
            }}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#141824] px-2.5 py-1.5 text-[11px] text-white"
          >
            {Object.entries(ageLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#0c0e14] px-1 py-3 sm:rounded-3xl sm:px-2 sm:py-4">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
        <CircularCardCarousel<Card>
          items={items}
          getKey={(c) => c.id}
          isSelected={(c) => (c.type === 'upload' ? Boolean(customPreview) && !selectedAvatarId : c.id === selectedAvatarId)}
          onSelect={(c) => {
            if (c.type === 'avatar') onSelectAvatar(c.id);
          }}
          centerIndex={centerIndex}
          onCenterIndexChange={setCenterIndex}
          onUserSwipe={onUserSwipe}
          showHand={false}
          handLabel={t('adui.swipeLibrary')}
          frameClassName="h-[318px] sm:h-[358px]"
          renderCard={(c, isCenter) => {
            const shell = `flex h-[286px] w-[38vw] max-w-[10rem] flex-col overflow-hidden rounded-2xl border p-1.5 sm:h-[318px] sm:max-w-[11.5rem]`;
            if (c.type === 'upload') {
              return (
                <div className={`${shell} ${isCenter ? 'border-[var(--naje-accent)] bg-[#1a140f]' : 'border-white/10 bg-[#12141c]'}`}>
                  <div className="mb-1.5 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-black/25 py-1">
                    <span className="h-1 w-6 rounded-full bg-[var(--naje-accent)]/80" />
                    <span className="text-[10px] font-black text-[var(--naje-accent-2)]">{t('adui.attachSwipe')}</span>
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
                      <img src={customPreview} alt={t('adui.attachedAlt')} className="h-full w-full object-cover object-top" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center px-2.5 py-2 gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--naje-accent)]/15 flex items-center justify-center text-[var(--naje-accent-2)] shadow-sm">
                          <Upload className="h-5 w-5" />
                        </div>
                        <span className="text-[11.5px] font-black text-white leading-snug">
                          أرفع شخصيتك او مرر لمشاهده شخصيات ناجي
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            const av = c.avatar;
            const selected = av.id === selectedAvatarId;
            return (
              <div className={`${shell} ${isCenter ? 'bg-[#121622]' : 'bg-[#11141c]'} ${selected ? 'border-[var(--naje-accent)]' : 'border-white/10'}`}>
                <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl">
                  <AvatarPhoto id={av.id} name={av.name} gradient={av.placeholderGradient} className="h-full w-full" />
                  {selected && (
                    <span className="absolute top-2 start-2 inline-flex items-center gap-1 rounded-full bg-[var(--naje-accent)] px-2 py-0.5 text-[9px] font-black text-[var(--naje-on-accent)]">
                      <Check className="h-3 w-3" /> {t('adui.selected')}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 shrink-0 text-start">
                  <p className="truncate text-[13px] font-black leading-tight text-white">{av.name}</p>
                  <p className={`truncate text-[10px] leading-tight ${isCenter ? 'text-[#7dd3c7]' : 'text-transparent'}`}>
                    {av.profession}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAvatar(av.id);
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
