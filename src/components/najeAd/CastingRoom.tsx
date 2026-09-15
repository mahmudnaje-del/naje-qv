import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Users, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { AVATAR_REGISTRY, NajiAvatar } from '../../data/avatars/avatarRegistry';
import { getRegionLabelAr } from '../../data/avatars/avatarRegionLabels';
import { CircularCardCarousel } from './CircularCardCarousel';

export interface CastingRoomProps {
  selectedAvatarId: string | null;
  onSelectAvatar: (avatarId: string) => void;
}

const AGE_GROUP_LABELS: Record<string, string> = {
  all: 'جميع الفئات العمرية',
  child: 'أطفال',
  teen: 'يافعين',
  young_adult: 'شباب 20-25',
  adult_26_35: 'بالغين 26-35',
  adult_36_45: 'بالغين 36-45',
  adult_46_55: 'بالغين 46-55',
  senior_56_65: 'كبار 56-65',
  senior_66_plus: 'كبار السن 66+'
};

export const CastingRoom: React.FC<CastingRoomProps> = ({
  selectedAvatarId,
  onSelectAvatar
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [centerIndex, setCenterIndex] = useState(0);

  // Convert registry to array
  const allAvatars = useMemo(() => Object.values(AVATAR_REGISTRY), []);

  // Extract unique regions for filtering
  const regions = useMemo(() => {
    const set = new Set<string>();
    allAvatars.forEach(av => {
      const main = av.visualRegion.split('—')[0].trim();
      set.add(main);
    });
    return Array.from(set);
  }, [allAvatars]);

  // Filtered avatars
  const filteredAvatars = useMemo(() => {
    return allAvatars.filter(av => {
      const matchesSearch = 
        !searchTerm.trim() ||
        av.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        av.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        av.visualRegion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        av.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
        av.skin.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAge = selectedAgeGroup === 'all' || av.ageGroup === selectedAgeGroup;
      const matchesRegion = selectedRegion === 'all' || av.visualRegion.startsWith(selectedRegion);

      return matchesSearch && matchesAge && matchesRegion;
    });
  }, [allAvatars, searchTerm, selectedAgeGroup, selectedRegion]);

  // If selected avatar exists in filtered list on initial mount or when changed, center on it
  useEffect(() => {
    if (selectedAvatarId && filteredAvatars.length > 0) {
      const foundIdx = filteredAvatars.findIndex(a => a.id === selectedAvatarId);
      if (foundIdx !== -1) {
        setCenterIndex(foundIdx);
      }
    } else {
      setCenterIndex(0);
    }
  }, [selectedAvatarId, searchTerm, selectedAgeGroup, selectedRegion, filteredAvatars.length]);

  const handleSelect = (avatar: NajiAvatar) => {
    onSelectAvatar(avatar.id);
  };

  const currentCenterAvatar = filteredAvatars[centerIndex % (filteredAvatars.length || 1)] || null;

  return (
    <div className="flex flex-col h-full space-y-4 text-right" dir="rtl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d0f14]/90 border border-gray-800/80 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>غرفة اختيار الشخصيات (Casting Room)</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {filteredAvatars.length} / 150 شخصية
              </span>
            </h2>
            <p className="text-xs text-gray-400">تصفح دائري بأسلوب iOS التراكمي مع السحب والاختيار الفوري</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCenterIndex(0);
            }}
            placeholder="بحث بالاسم، المنطقة، المهنة، الملامح..."
            className="w-full bg-[#121622] border border-gray-700/80 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setCenterIndex(0); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d0f14]/60 border border-gray-800/60 rounded-2xl p-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>فلترة:</span>
          </span>

          {/* Region filter */}
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setCenterIndex(0);
            }}
            className="bg-[#141824] border border-gray-700/80 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">جميع المناطق الجغرافية</option>
            {regions.map(r => (
              <option key={r} value={r}>{getRegionLabelAr(r)}</option>
            ))}
          </select>

          {/* Age group filter */}
          <select
            value={selectedAgeGroup}
            onChange={(e) => {
              setSelectedAgeGroup(e.target.value);
              setCenterIndex(0);
            }}
            className="bg-[#141824] border border-gray-700/80 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {Object.entries(AGE_GROUP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Carousel manual navigation controls */}
        {filteredAvatars.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCenterIndex(prev => ((prev - 1) % filteredAvatars.length + filteredAvatars.length) % filteredAvatars.length)}
              className="p-1.5 rounded-lg bg-[#141824] border border-gray-700 hover:bg-[#1e2333] text-gray-300 cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
            <span className="text-xs font-mono text-indigo-400 px-2 font-bold">
              {(centerIndex % filteredAvatars.length) + 1} / {filteredAvatars.length}
            </span>
            <button
              type="button"
              onClick={() => setCenterIndex(prev => (prev + 1) % filteredAvatars.length)}
              className="p-1.5 rounded-lg bg-[#141824] border border-gray-700 hover:bg-[#1e2333] text-gray-300 cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Carousel Area */}
      {filteredAvatars.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#0d0f14]/80 border border-gray-800 rounded-2xl text-center">
          <Users className="w-12 h-12 text-gray-600 mb-3" />
          <h4 className="text-sm font-bold text-white">لا توجد شخصيات مطابقة للبحث</h4>
          <p className="text-xs text-gray-400 mt-1">جرب تغيير شروط البحث أو الفلاتر</p>
          <button
            type="button"
            onClick={() => { setSearchTerm(''); setSelectedRegion('all'); setSelectedAgeGroup('all'); setCenterIndex(0); }}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <div className="relative bg-[#0d0f14]/90 border border-gray-800/80 rounded-3xl p-4 md:p-6 overflow-visible shadow-2xl">
            {/* Gesture Hint Badge */}
            <div className="flex items-center justify-between pb-2 text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>اسحب يميناً ويساراً للتنقل الدائري اللانهائي • انقر على أي بطاقة لاختيارها فوراً</span>
              </span>
              {currentCenterAvatar && (
                <span className="font-mono text-indigo-300 font-bold">
                  {currentCenterAvatar.name} ({currentCenterAvatar.id})
                </span>
              )}
            </div>

            {/* Circular Carousel */}
            <CircularCardCarousel<NajiAvatar>
              items={filteredAvatars}
              getKey={(av) => av.id}
              isSelected={(av) => av.id === selectedAvatarId}
              onSelect={handleSelect}
              centerIndex={centerIndex}
              onCenterIndexChange={setCenterIndex}
              renderCard={(av, isCenter) => {
                const isSelected = av.id === selectedAvatarId;
                return isCenter ? (
                  /* Center Detailed Card */
                  <div
                    className={`w-[85vw] max-w-64 sm:w-72 p-4 rounded-2xl border transition-all text-right flex flex-col justify-between shadow-2xl ${
                      isSelected
                        ? 'bg-gradient-to-b from-indigo-950/95 to-[#0d101a] border-indigo-500 shadow-indigo-500/30'
                        : 'bg-[#121622]/95 border-gray-700/80 hover:border-gray-500'
                    }`}
                    dir="rtl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/50 text-gray-300 border border-gray-800">
                          {av.id}
                        </span>
                        {isSelected ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500 text-white flex items-center gap-1 shadow-md shadow-indigo-500/40">
                            <Check className="w-3 h-3" /> المختار للبث
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {av.age} سنة
                          </span>
                        )}
                      </div>

                      {/* Large Gradient Avatar Portrait */}
                      <div
                        className="w-full h-28 rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-inner mb-3"
                        style={{
                          background: `linear-gradient(135deg, ${av.placeholderGradient[0]}, ${av.placeholderGradient[1]})`
                        }}
                      >
                        <div className="w-14 h-14 rounded-full bg-black/25 backdrop-blur-xs flex items-center justify-center font-black text-white text-xl border border-white/30 shadow-lg">
                          {av.name.slice(0, 2)}
                        </div>
                        <span className="text-xs text-white font-bold mt-1.5 shadow-sm">
                          {av.name}
                        </span>
                      </div>

                      {/* Detailed Meta */}
                      <div className="space-y-1 text-xs">
                        <h4 className="font-black text-white text-sm">{av.name}</h4>
                        <p className="text-indigo-300 font-medium text-[11px]">{av.profession}</p>
                        <p className="text-gray-400 text-[10px] line-clamp-1">
                          {getRegionLabelAr(av.visualRegion.split('—')[0].trim())}
                          {av.visualRegion.includes('—') ? ' — ' + av.visualRegion.split('—')[1].trim() : ''}
                        </p>
                      </div>

                      <div className="mt-2.5 p-2 rounded-xl bg-[#0a0d14] border border-gray-800 text-[10px] text-gray-300 space-y-0.5">
                        <p className="truncate"><span className="text-gray-500">الملامح:</span> {av.skin}</p>
                        <p className="truncate"><span className="text-gray-500">الملابس:</span> {av.clothing}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-800 flex items-center justify-between text-xs">
                      <span className="text-gray-400 text-[10px]">{av.expression}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(av);
                        }}
                        className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition shadow flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>اختيار</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Side Stacked Card (Compact & Sleek) */
                  <div
                    className={`w-48 sm:w-52 p-3 rounded-2xl border transition-all text-right flex flex-col justify-between shadow-xl ${
                      isSelected
                        ? 'bg-gradient-to-b from-indigo-950/90 to-[#0e111a] border-indigo-500'
                        : 'bg-[#11141c]/90 border-gray-800/90 hover:border-gray-600'
                    }`}
                    dir="rtl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-mono text-gray-400">{av.id}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                        )}
                      </div>

                      <div
                        className="w-full h-20 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner mb-2"
                        style={{
                          background: `linear-gradient(135deg, ${av.placeholderGradient[0]}, ${av.placeholderGradient[1]})`
                        }}
                      >
                        <span className="font-black text-white text-base">
                          {av.name.slice(0, 2)}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-xs truncate">{av.name}</h4>
                      <p className="text-[10px] text-indigo-300 truncate">{av.profession}</p>
                    </div>

                    <div className="mt-2 text-[10px] text-gray-400 font-medium text-left">
                      {av.age} سنة
                    </div>
                  </div>
                );
              }}
            />
          </div>

          {/* Bottom Confirmation Bar */}
          {selectedAvatarId && (
            <div className="flex items-center justify-between p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-gray-200">
                  الشخصية المختارة حالياً:{' '}
                  <strong className="text-white">
                    {AVATAR_REGISTRY[selectedAvatarId]?.name || selectedAvatarId}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
