import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Building,
  Compass
} from 'lucide-react';
import { LOCATION_REGISTRY, NajiLocation } from '../../data/locations/locationRegistry';
import { getCategoryLabelAr } from '../../data/locations/locationCategoryLabels';
import { CircularCardCarousel } from './CircularCardCarousel';

export interface LocationScoutProps {
  selectedLocationId: string | null;
  onSelectLocation: (locationId: string) => void;
}

export const LocationScout: React.FC<LocationScoutProps> = ({
  selectedLocationId,
  onSelectLocation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [centerIndex, setCenterIndex] = useState(0);

  const allLocations = useMemo(() => Object.values(LOCATION_REGISTRY), []);

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    allLocations.forEach(loc => {
      if (loc.category) set.add(loc.category.trim());
    });
    return Array.from(set);
  }, [allLocations]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return allLocations.filter(loc => {
      const matchesSearch =
        !searchTerm.trim() ||
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'all' || loc.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [allLocations, searchTerm, selectedCategory]);

  // Center on selected location if present
  useEffect(() => {
    if (selectedLocationId && filteredLocations.length > 0) {
      const foundIdx = filteredLocations.findIndex(l => l.id === selectedLocationId);
      if (foundIdx !== -1) {
        setCenterIndex(foundIdx);
      }
    } else {
      setCenterIndex(0);
    }
  }, [selectedLocationId, searchTerm, selectedCategory, filteredLocations.length]);

  const handleSelect = (location: NajiLocation) => {
    onSelectLocation(location.id);
  };

  const currentCenterLocation = filteredLocations[centerIndex % (filteredLocations.length || 1)] || null;

  return (
    <div className="flex flex-col h-full space-y-4 text-right" dir="rtl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d0f14]/90 border border-gray-800/80 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>مستكشف مواقع التصوير (Location Scout)</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                {filteredLocations.length} / 150 موقع
              </span>
            </h2>
            <p className="text-xs text-gray-400">تصفح دائري بأسلوب iOS التراكمي لبيئات ومواقع التصوير السينمائية</p>
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
            placeholder="بحث بالموقع، الفئة، الوصف المعماري..."
            className="w-full bg-[#121622] border border-gray-700/80 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
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

      {/* Categories Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d0f14]/60 border border-gray-800/60 rounded-2xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <span>الفئة:</span>
          </span>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCenterIndex(0);
            }}
            className="bg-[#141824] border border-gray-700/80 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 max-w-xs cursor-pointer"
          >
            <option value="all">جميع الفئات الـ 15</option>
            {categories.map(c => (
              <option key={c} value={c}>{getCategoryLabelAr(c)}</option>
            ))}
          </select>
        </div>

        {/* Carousel manual navigation controls */}
        {filteredLocations.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCenterIndex(prev => ((prev - 1) % filteredLocations.length + filteredLocations.length) % filteredLocations.length)}
              className="p-1.5 rounded-lg bg-[#141824] border border-gray-700 hover:bg-[#1e2333] text-gray-300 cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
            <span className="text-xs font-mono text-purple-400 px-2 font-bold">
              {(centerIndex % filteredLocations.length) + 1} / {filteredLocations.length}
            </span>
            <button
              type="button"
              onClick={() => setCenterIndex(prev => (prev + 1) % filteredLocations.length)}
              className="p-1.5 rounded-lg bg-[#141824] border border-gray-700 hover:bg-[#1e2333] text-gray-300 cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Carousel Area */}
      {filteredLocations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#0d0f14]/80 border border-gray-800 rounded-2xl text-center">
          <Compass className="w-12 h-12 text-gray-600 mb-3" />
          <h4 className="text-sm font-bold text-white">لا توجد مواقع مطابقة للبحث</h4>
          <p className="text-xs text-gray-400 mt-1">جرب تغيير شروط البحث أو الفلاتر</p>
          <button
            type="button"
            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setCenterIndex(0); }}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>اسحب يميناً ويساراً للتنقل الدائري اللانهائي • انقر على أي بطاقة لاختيارها فوراً</span>
              </span>
              {currentCenterLocation && (
                <span className="font-mono text-purple-300 font-bold">
                  {currentCenterLocation.name} ({currentCenterLocation.id})
                </span>
              )}
            </div>

            {/* Circular Carousel */}
            <CircularCardCarousel<NajiLocation>
              items={filteredLocations}
              getKey={(loc) => loc.id}
              isSelected={(loc) => loc.id === selectedLocationId}
              onSelect={handleSelect}
              centerIndex={centerIndex}
              onCenterIndexChange={setCenterIndex}
              renderCard={(loc, isCenter) => {
                const isSelected = loc.id === selectedLocationId;
                return isCenter ? (
                  /* Center Detailed Card */
                  <div
                    className={`w-[85vw] max-w-64 sm:w-72 p-4 rounded-2xl border transition-all text-right flex flex-col justify-between shadow-2xl ${
                      isSelected
                        ? 'bg-gradient-to-b from-purple-950/95 to-[#0d101a] border-purple-500 shadow-purple-500/30'
                        : 'bg-[#121622]/95 border-gray-700/80 hover:border-gray-500'
                    }`}
                    dir="rtl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/50 text-gray-300 border border-gray-800">
                          {loc.id}
                        </span>
                        {isSelected ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500 text-white flex items-center gap-1 shadow-md shadow-purple-500/40">
                            <Check className="w-3 h-3" /> الموقع المعتمد
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {getCategoryLabelAr(loc.category)}
                          </span>
                        )}
                      </div>

                      {/* Large Gradient Card Box */}
                      <div
                        className="w-full h-28 rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-inner mb-3"
                        style={{
                          background: `linear-gradient(135deg, ${loc.placeholderGradient[0]}, ${loc.placeholderGradient[1]})`
                        }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-black/30 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-lg">
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs text-white font-bold mt-1.5 shadow-sm">
                          {getCategoryLabelAr(loc.category)}
                        </span>
                      </div>

                      {/* Detailed Meta */}
                      <div className="space-y-1 text-xs">
                        <h4 className="font-black text-white text-sm">{loc.name}</h4>
                        <p className="text-purple-300 font-medium text-[11px]">{getCategoryLabelAr(loc.category)}</p>
                        <p className="text-gray-400 text-[10px] line-clamp-2 leading-relaxed">{loc.description}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-800 flex items-center justify-between text-xs">
                      <span className="text-gray-400 text-[9px]">
                        {loc.negativeSpaceFriendly ? 'مساحة نصية مريحة' : 'تكوين ممتلئ'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(loc);
                        }}
                        className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition shadow flex items-center gap-1 cursor-pointer"
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
                        ? 'bg-gradient-to-b from-purple-950/90 to-[#0e111a] border-purple-500'
                        : 'bg-[#11141c]/90 border-gray-800/90 hover:border-gray-600'
                    }`}
                    dir="rtl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-mono text-gray-400">{loc.id}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                        )}
                      </div>

                      <div
                        className="w-full h-20 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner mb-2"
                        style={{
                          background: `linear-gradient(135deg, ${loc.placeholderGradient[0]}, ${loc.placeholderGradient[1]})`
                        }}
                      >
                        <Building className="w-5 h-5 text-white/90" />
                      </div>

                      <h4 className="font-bold text-white text-xs truncate">{loc.name}</h4>
                      <p className="text-[10px] text-purple-300 truncate">{getCategoryLabelAr(loc.category)}</p>
                    </div>

                    <div className="mt-2 text-[10px] text-gray-400 font-medium text-left">
                      {loc.negativeSpaceFriendly ? 'مساحة نص' : 'تكوين حي'}
                    </div>
                  </div>
                );
              }}
            />
          </div>

          {/* Bottom Confirmation Bar */}
          {selectedLocationId && (
            <div className="flex items-center justify-between p-3.5 bg-purple-950/40 border border-purple-500/30 rounded-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="text-gray-200">
                  موقع التصوير المعتمد حالياً:{' '}
                  <strong className="text-white">
                    {LOCATION_REGISTRY[selectedLocationId]?.name || selectedLocationId}
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
