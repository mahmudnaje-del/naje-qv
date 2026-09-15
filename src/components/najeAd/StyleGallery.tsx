import React, { useState, useMemo } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { VIDEO_STYLE_TEMPLATES, VideoStyleTemplate } from '../../data/videoStyleTemplates';
import { CircularCardCarousel } from './CircularCardCarousel';

export interface StyleGalleryProps {
  selectedStyleId: string | null;
  onSelectStyle: (styleId: string | null) => void;
}

export const StyleGallery: React.FC<StyleGalleryProps> = ({
  selectedStyleId,
  onSelectStyle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [centerIndex, setCenterIndex] = useState(0);

  const filteredTemplates = useMemo(() => {
    return VIDEO_STYLE_TEMPLATES.filter(t => {
      const matchSearch = t.name.includes(searchTerm) || t.desc.includes(searchTerm);
      return matchSearch;
    });
  }, [searchTerm]);

  const renderCard = (template: VideoStyleTemplate, isCenter: boolean) => (
    <div className="w-[85vw] max-w-64 sm:w-72 flex flex-col h-full bg-[#1c1f26] rounded-2xl overflow-hidden border border-gray-800">
      <div className="relative w-full aspect-[4/3] bg-gray-900 shrink-0">
        <img 
          src={template.image} 
          alt={template.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1f26] via-transparent to-transparent opacity-80" />
      </div>
      
      <div className="p-4 flex-1 flex flex-col items-center justify-start text-center">
        <h4 className="font-bold text-white text-[15px] mb-1.5">{template.name}</h4>
        {isCenter && (
          <p className="text-[12px] text-gray-400 leading-relaxed font-medium line-clamp-3">
            {template.desc}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full text-right" dir="rtl">
      <div className="p-6 border-b border-gray-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">معرض الأساليب الإخراجية</h3>
            <p className="text-xs text-gray-400 mt-1">اختر الأسلوب الفني أو القالب البصري للإعلان</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
              <span>الأسلوب الحالي:</span>
              <span className="font-bold text-white">
                {selectedStyleId
                  ? VIDEO_STYLE_TEMPLATES.find(t => t.id === selectedStyleId)?.name
                  : 'واقعي (افتراضي)'}
              </span>
            </div>
            <button
              type="button"
            onClick={() => onSelectStyle(null)}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition flex justify-center items-center gap-2 ${
              selectedStyleId === null 
                ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                : 'bg-[#1c1f26] border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            تخطي واستخدام أسلوب واقعي
          </button>
          </div>
          
          <div className="relative w-full sm:w-[220px]">
            <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث عن أسلوب فني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1c1f26] border border-gray-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition placeholder:text-gray-600"
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        {filteredTemplates.length > 0 ? (
          <CircularCardCarousel<VideoStyleTemplate>
            items={filteredTemplates}
            getKey={(t) => t.id}
            isSelected={(t) => t.id === selectedStyleId}
            onSelect={(t) => onSelectStyle(t.id)}
            renderCard={renderCard}
            centerIndex={centerIndex}
            onCenterIndexChange={setCenterIndex}
          />
        ) : (
          <div className="py-12 text-center text-gray-500 text-sm">
            لا توجد قوالب مطابقة للبحث
          </div>
        )}
      </div>
    </div>
  );
};
