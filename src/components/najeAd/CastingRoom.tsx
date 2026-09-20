import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Check, Upload } from 'lucide-react';
import { AVATAR_REGISTRY, NajiAvatar, interleaveDiverseAvatars } from '../../data/avatars/avatarRegistry';
import { getRegionLabelAr } from '../../data/avatars/avatarRegionLabels';
import { CircularCardCarousel } from './CircularCardCarousel';
import { AvatarPhoto } from './AvatarPhoto';
import { SwipeHintHand } from './SwipeHintHand';

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
    if (selectedAvatarId) {
      const found = items.findIndex((c) => c.type === 'avatar' && c.id === selectedAvatarId);
      if (found !== -1) setCenterIndex(found);
    }
  }, [selectedAvatarId, items]);

  const pickFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCustomFile(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 text-right" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-black text-white">الشخصية</h2>
          <p className="text-[11px] text-white/45">أول بطاقة لإرفاق وجهك — اسحب لمكتبة ناجي</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCenterIndex(0);
            }}
            placeholder="ابحث بالاسم أو المهنة..."
            className="w-full rounded-xl border border-white/10 bg-black/35 py-2 pr-10 pl-3 text-xs text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[#d4a574]" />
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setCenterIndex(0);
            }}
            className="rounded-xl border border-white/10 bg-[#141824] px-3 py-1.5 text-[11px] text-white"
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
            className="rounded-xl border border-white/10 bg-[#141824] px-3 py-1.5 text-[11px] text-white"
          >
            {Object.entries(AGE_GROUP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-white/60">
          <button type="button" onClick={() => setCenterIndex((i) => (i - 1 + items.length) % items.length)} className="rounded-lg border border-white/10 p-1.5">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="font-mono text-[#e8b86d]">
            {centerIndex + 1}/{items.length}
          </span>
          <button type="button" onClick={() => setCenterIndex((i) => (i + 1) % items.length)} className="rounded-lg border border-white/10 p-1.5">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative overflow-visible rounded-3xl border border-white/8 bg-[#0c0e14] p-3">
        {showHint && centerIndex === 0 && <SwipeHintHand label="اسحب لمشاهدة شخصيات ناجي" />}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
        <CircularCardCarousel<Card>
          items={items}
          getKey={(c) => c.id}
          isSelected={(c) => (c.type === 'upload' ? Boolean(customPreview) && !selectedAvatarId : c.id === selectedAvatarId)}
          onSelect={(c) => {
            if (c.type === 'upload') fileRef.current?.click();
            else onSelectAvatar(c.id);
          }}
          centerIndex={centerIndex}
          onCenterIndexChange={setCenterIndex}
          onUserSwipe={onUserSwipe}
          renderCard={(c, isCenter) => {
            if (c.type === 'upload') {
              return (
                <div className={`w-[78vw] max-w-[15rem] rounded-2xl border p-3 ${isCenter ? 'border-[#d4a574] bg-[#1a140f]' : 'border-white/10 bg-[#12141c]'} `}>
                  <div className="mb-2 text-[10px] font-black text-[#e8b86d]">إرفاق شخصية</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileRef.current?.click();
                    }}
                    className="relative flex aspect-[3/4] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#d4a574]/50 bg-black/30"
                  >
                    {customPreview ? (
                      <img src={customPreview} alt="مرفق" className="h-full w-full object-cover object-top" />
                    ) : (
                      <>
                        <Upload className="mb-2 h-8 w-8 text-[#e8b86d]" />
                        <span className="px-3 text-center text-[11px] font-bold text-white/70">ارفق صورتك أو ممثلك</span>
                      </>
                    )}
                  </button>
                </div>
              );
            }
            const av = c.avatar;
            const selected = av.id === selectedAvatarId;
            return (
              <div className={`rounded-2xl border p-2.5 ${isCenter ? 'w-[78vw] max-w-[15rem] bg-[#121622]' : 'w-36 bg-[#11141c]'} ${selected ? 'border-[#d4a574]' : 'border-white/10'}`}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                  <AvatarPhoto id={av.id} name={av.name} gradient={av.placeholderGradient} className="h-full w-full" />
                  {selected && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-[#d4a574] px-2 py-0.5 text-[9px] font-black text-black">
                      <Check className="h-3 w-3" /> مختارة
                    </span>
                  )}
                </div>
                {isCenter && (
                  <div className="mt-2 text-right">
                    <p className="text-sm font-black text-white">{av.name}</p>
                    <p className="text-[11px] text-[#7dd3c7]">{av.profession}</p>
                    <p className="text-[10px] text-white/40">{getRegionLabelAr(av.visualRegion.split('—')[0].trim())}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAvatar(av.id);
                      }}
                      className="mt-2 w-full rounded-xl bg-[#d4a574] py-1.5 text-[11px] font-black text-black"
                    >
                      اختيار
                    </button>
                  </div>
                )}
                {!isCenter && <p className="mt-1 truncate text-[11px] font-bold text-white">{av.name}</p>}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
