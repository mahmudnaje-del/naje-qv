import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Filter, Upload, Check } from 'lucide-react';
import { AVATAR_REGISTRY, NajiAvatar, interleaveDiverseAvatars } from '../../data/avatars/avatarRegistry';
import { getRegionLabelAr } from '../../data/avatars/avatarRegionLabels';
import { CircularCardCarousel } from './CircularCardCarousel';
import { AvatarPhoto } from './AvatarPhoto';

type Card = { type: 'upload'; id: '__upload__' } | { type: 'avatar'; id: string; avatar: NajiAvatar };

const AGE_GROUP_LABELS: Record<string, string> = {
  all: 'كل الأعمار',
  child: 'أطفال',
  teen: 'يافعين',
  young_adult: 'شباب 20-25',
  adult_26_35: '26-35',
  adult_36_45: '36-45',
  adult_46_55: '46-55',
  senior_56_65: '56-65',
  senior_66_plus: '66+',
};

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
    <div className="space-y-2.5 text-right" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white sm:text-base">الشخصية</h2>
          <p className="text-[10px] text-white/45 sm:text-[11px]">أرفق وجهك أو اسحب مكتبة ناجي</p>
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
          <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCenterIndex(0);
            }}
            placeholder="ابحث بالاسم أو المهنة..."
            className="w-full rounded-xl border border-white/10 bg-black/35 py-2 pr-9 pl-3 text-xs text-white placeholder:text-white/30 focus:border-[var(--naje-accent)] focus:outline-none"
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
            <option value="all">كل المناطق</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {getRegionLabelAr(r)}
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
            {Object.entries(AGE_GROUP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
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
          isSelected={(c) => (c.type === 'upload' ? Boolean(customPreview) && !selectedAvatarId : c.id === selectedAvatarId)}
          onSelect={(c) => {
            if (c.type === 'avatar') onSelectAvatar(c.id);
          }}
          centerIndex={centerIndex}
          onCenterIndexChange={setCenterIndex}
          onUserSwipe={onUserSwipe}
          showHand={showHint && centerIndex === 0}
          handLabel="اسحب لمكتبة ناجي"
          frameClassName="h-[318px] sm:h-[358px]"
          renderCard={(c, isCenter) => {
            const shell = `flex h-[286px] w-[40vw] max-w-[10.75rem] flex-col overflow-hidden rounded-2xl border p-1.5 sm:h-[318px] sm:max-w-[12.5rem]`;
            if (c.type === 'upload') {
              return (
                <div className={`${shell} ${isCenter ? 'border-[var(--naje-accent)] bg-[#1a140f]' : 'border-white/10 bg-[#12141c]'}`}>
                  <div className="mb-1.5 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-black/25 py-1">
                    <span className="h-1 w-6 rounded-full bg-[var(--naje-accent)]/80" />
                    <span className="text-[10px] font-black text-[var(--naje-accent-2)]">إرفاق · اسحب</span>
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
                      <img src={customPreview} alt="مرفق" className="h-full w-full object-cover object-top" />
                    ) : (
                      <>
                        <Upload className="mb-2 h-8 w-8 text-[var(--naje-accent-2)]" />
                        <span className="px-3 text-center text-[11px] font-bold text-white/70">ارفق صورتك أو ممثلك</span>
                      </>
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
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-[var(--naje-accent)] px-2 py-0.5 text-[9px] font-black text-[var(--naje-on-accent)]">
                      <Check className="h-3 w-3" /> مختارة
                    </span>
                  )}
                </div>
                <div className="mt-1.5 shrink-0 text-right">
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
                    اختيار
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
