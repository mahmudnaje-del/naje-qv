import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Download, Maximize } from 'lucide-react';
import { cn } from '../lib/utils';
import { NajeSlide } from '../lib/naje-engine';

interface Props {
  slides: NajeSlide[];
}

export default function NajePreviewRenderer({ slides }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Base width is 1280
        const newScale = entry.contentRect.width / 1280;
        setScale(newScale);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  
  const isRtl = (text: string) => /[\u0600-\u06FF]/.test(text);
  const rtl = isRtl(currentSlide.slideTitle || '');

  // Hex helpers
  const hex = (c: string) => c.startsWith('#') ? c : `#${c}`;

  const bg = hex("0E0F13");
  const titleColor = hex("F4F4F7");
  const textColor = hex("9EA0B0");
  const accentColor = hex("D4AF37");

  const nextSlide = () => setCurrentIndex(p => Math.min(slides.length - 1, p + 1));
  const prevSlide = () => setCurrentIndex(p => Math.max(0, p - 1));

  // A 16:9 container that scales content perfectly
  // Using a fixed aspect ratio container with absolute positioning mapped to 100% width/height
  return (
    <div className={cn("flex flex-col gap-2 w-full", isFullscreen && "fixed inset-0 z-50 bg-white dark:bg-black/90 p-4 justify-center items-center")}>
      {/* Top Bar */}
      <div className="flex justify-between items-center px-2 w-full max-w-5xl mx-auto">
         <span className="text-gray-800 dark:text-gray-400 text-xs font-bold font-mono">
           SLIDE {currentIndex + 1} OF {slides.length}
         </span>
         <div className="flex gap-2">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 cursor-pointer">
               <Maximize className="w-4 h-4" />
            </button>
         </div>
      </div>

      {/* Slide Canvas (16:9) */}
      <div className={cn(
        "relative w-full max-w-5xl mx-auto overflow-hidden rounded-lg shadow-2xl border border-gray-600 dark:border-gray-800 transition-all",
        "aspect-video flex flex-col"
      )} style={{ backgroundColor: bg, direction: rtl ? 'rtl' : 'ltr', fontFamily: rtl ? "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" : "Inter, sans-serif" }}>
         
         {/* Top Accent Line */}
         <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: accentColor }} />

         {/* Content Renderer */}
         {currentSlide.layoutTemplate === 'full_background_image' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center p-16 text-center">
             <div className="absolute inset-0 bg-white dark:bg-black/60 z-0" />
             <div className="z-10 flex flex-col items-center gap-4">
               <h1 className="text-5xl md:text-6xl font-extrabold" style={{ color: titleColor }}>{currentSlide.slideTitle}</h1>
               {currentSlide.slideSubtitle && <h2 className="text-3xl md:text-4xl" style={{ color: accentColor }}>{currentSlide.slideSubtitle}</h2>}
               {currentSlide.content.text && <p className="text-xl md:text-2xl max-w-3xl" style={{ color: textColor }}>{currentSlide.content.text}</p>}
             </div>
           </div>
         )}

         {currentSlide.layoutTemplate === 'title_slide' && (
           <div className="flex flex-col items-center justify-center h-full p-16 text-center gap-8">
             <h1 className="text-5xl md:text-7xl font-extrabold" style={{ color: titleColor }}>{currentSlide.slideTitle}</h1>
             {currentSlide.slideSubtitle && <h2 className="text-3xl md:text-4xl font-semibold" style={{ color: accentColor }}>{currentSlide.slideSubtitle}</h2>}
             {currentSlide.content.text && <p className="text-xl md:text-2xl max-w-3xl mt-4" style={{ color: textColor }}>{currentSlide.content.text}</p>}
           </div>
         )}

         {currentSlide.layoutTemplate === 'showcase' && (
           <div className="flex flex-col h-full p-16">
             <h1 className="text-5xl font-extrabold" style={{ color: titleColor }}>{currentSlide.slideTitle}</h1>
             <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-8xl md:text-[140px] font-black tracking-tighter" style={{ color: accentColor }}>{currentSlide.content.stats?.value}</div>
                <div className="text-4xl md:text-5xl font-bold mt-2" style={{ color: titleColor }}>{currentSlide.content.stats?.label || currentSlide.slideSubtitle}</div>
                {currentSlide.content.text && <p className="text-2xl mt-6 text-center max-w-2xl" style={{ color: textColor }}>{currentSlide.content.text}</p>}
             </div>
           </div>
         )}

         {currentSlide.layoutTemplate === 'comparison_bars' && (
           <div className="flex flex-col h-full p-16">
             <h1 className="text-5xl font-extrabold" style={{ color: titleColor }}>{currentSlide.slideTitle}</h1>
             {currentSlide.slideSubtitle && <h2 className="text-2xl mt-2" style={{ color: accentColor }}>{currentSlide.slideSubtitle}</h2>}
             
             <div className="flex-1 flex flex-col justify-center gap-8 mt-12 max-w-4xl">
               {currentSlide.content.comparisons?.map((comp, i) => (
                 <div key={i} className="flex items-center gap-4">
                   <div className="w-1/3 text-2xl font-bold" style={{ color: titleColor }}>{comp.label}</div>
                   <div className="flex-1 bg-white dark:bg-black/20 h-4 rounded-full overflow-hidden relative">
                     <div className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-1000" style={{ width: `${(comp.value / comp.max) * 100}%`, backgroundColor: accentColor, right: rtl ? 0 : 'auto', left: rtl ? 'auto' : 0 }} />
                   </div>
                   <div className="w-16 text-2xl font-bold text-center" style={{ color: titleColor }}>{comp.value}</div>
                 </div>
               ))}
             </div>
           </div>
         )}

         {(currentSlide.layoutTemplate === 'split_image_left' || currentSlide.layoutTemplate === 'split_image_right') && (
           <div className={cn("flex h-full", currentSlide.layoutTemplate === 'split_image_left' ? (rtl ? 'flex-row' : 'flex-row-reverse') : (rtl ? 'flex-row-reverse' : 'flex-row'))}>
             <div className="flex-1 p-16 flex flex-col justify-center">
               <h1 className="text-5xl font-extrabold" style={{ color: titleColor }}>{currentSlide.slideTitle}</h1>
               {currentSlide.slideSubtitle && <h2 className="text-2xl mt-2" style={{ color: accentColor }}>{currentSlide.slideSubtitle}</h2>}
               {currentSlide.content.text && <p className="text-xl mt-6 leading-relaxed" style={{ color: textColor }}>{currentSlide.content.text}</p>}
               {currentSlide.content.bulletPoints && (
                 <ul className="mt-6 space-y-3">
                   {currentSlide.content.bulletPoints.map((b, i) => (
                     <li key={i} className="flex items-start gap-3 text-xl" style={{ color: textColor }}>
                       <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                       <span>{b}</span>
                     </li>
                   ))}
                 </ul>
               )}
             </div>
             <div className="flex-1 bg-white dark:bg-black/10 m-6 rounded-2xl overflow-hidden flex items-center justify-center border border-white/5 relative">
                {/* Simulated Image Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent z-10" />
                <div className="text-center p-10 z-20">
                   <span className="text-gray-900 dark:text-white/50 text-sm font-mono border border-white/20 px-3 py-1 rounded-full uppercase tracking-wider">Generated Image Area</span>
                   <p className="text-gray-900 dark:text-white/80 mt-4 text-xl max-w-sm italic">"{currentSlide.content.aiImagePrompt || currentSlide.slideTitle}"</p>
                </div>
             </div>
           </div>
         )}

         {currentSlide.layoutTemplate === 'three_cards' && (
           <div className="flex flex-col h-full p-16">
             <h1 className="text-5xl font-extrabold text-center" style={{ color: titleColor }}>{currentSlide.slideTitle}</h1>
             {currentSlide.slideSubtitle && <h2 className="text-2xl mt-2 text-center" style={{ color: accentColor }}>{currentSlide.slideSubtitle}</h2>}
             
             <div className="flex-1 flex flex-row gap-8 mt-14 items-center justify-center">
               {currentSlide.content.cards?.slice(0, 3).map((card, i) => (
                 <div key={i} className="flex-1 bg-white dark:bg-black/10 border border-white/5 p-10 rounded-2xl h-full max-h-72 flex flex-col items-center text-center">
                   <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: accentColor + '20', color: accentColor }}>
                      <span className="text-sm font-bold text-amber-500">جاري المعالجة</span>
                   </div>
                   <h3 className="text-3xl font-bold mb-3" style={{ color: titleColor }}>{card.title}</h3>
                   <p className="text-base" style={{ color: textColor }}>{card.text}</p>
                 </div>
               ))}
             </div>
           </div>
         )}
         
         {currentSlide.layoutTemplate === 'two_columns' && (
           <div className="flex flex-col h-full p-16">
             <h1 className="text-5xl font-extrabold mb-14" style={{ color: titleColor }}>{currentSlide.slideTitle}</h1>
             
             <div className="flex-1 flex flex-row gap-12">
               {currentSlide.content.cards?.slice(0, 2).map((card, i) => (
                 <div key={i} className="flex-1 bg-white dark:bg-black/10 border border-white/5 p-10 rounded-2xl flex flex-col">
                   <h3 className="text-4xl font-bold mb-4" style={{ color: titleColor }}>{card.title}</h3>
                   <p className="text-xl leading-relaxed flex-1" style={{ color: textColor }}>{card.text}</p>
                 </div>
               ))}
             </div>
           </div>
         )}

         {currentSlide.layoutTemplate === 'icon_list' && (
           <div className="flex flex-col h-full p-16">
             <h1 className="text-5xl font-extrabold" style={{ color: titleColor }}>{currentSlide.slideTitle}</h1>
             {currentSlide.slideSubtitle && <h2 className="text-2xl mt-2 mb-12" style={{ color: accentColor }}>{currentSlide.slideSubtitle}</h2>}
             
             <div className="flex-1 grid grid-cols-2 gap-x-12 gap-y-8 mt-4 content-center">
               {currentSlide.content.cards?.slice(0, 4).map((card, i) => (
                 <div key={i} className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentColor + '20', color: accentColor }}>
                      <span className="text-sm font-bold text-emerald-500">مكتمل</span>
                   </div>
                   <p className="text-2xl font-medium" style={{ color: textColor }}>{card.title || card.text}</p>
                 </div>
               ))}
             </div>
           </div>
         )}

         {(currentSlide.layoutTemplate === 'bullet_list' || !['full_background_image','title_slide','showcase','comparison_bars','split_image_left','split_image_right','three_cards','two_columns','icon_list'].includes(currentSlide.layoutTemplate)) && (
           <div className="flex flex-col h-full p-16">
             <h1 className="text-5xl font-extrabold" style={{ color: titleColor }}>{currentSlide.slideTitle}</h1>
             {currentSlide.slideSubtitle && <h2 className="text-2xl mt-2" style={{ color: accentColor }}>{currentSlide.slideSubtitle}</h2>}
             
             <div className="mt-12 flex-1">
               {currentSlide.content.text && <p className="text-3xl mb-12 leading-relaxed" style={{ color: textColor }}>{currentSlide.content.text}</p>}
               {currentSlide.content.bulletPoints && (
                 <ul className="space-y-4">
                   {currentSlide.content.bulletPoints.map((b, i) => (
                     <li key={i} className="flex items-start gap-4 text-3xl" style={{ color: textColor }}>
                       <span className="mt-2.5 w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                       <span className="leading-snug">{b}</span>
                     </li>
                   ))}
                 </ul>
               )}
             </div>
           </div>
         )}

      </div>

      {/* Navigation & Controls */}
      <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-900 border border-gray-600 dark:border-gray-800 rounded-xl max-w-5xl mx-auto w-full">
         <button onClick={prevSlide} disabled={currentIndex === 0} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer transition">
            <ChevronLeft className="w-5 h-5" />
         </button>
         
         <div className="flex-1 text-center text-sm font-medium text-gray-800 dark:text-gray-400 ">
           {currentSlide.layoutTemplate.replace(/_/g, ' ').toUpperCase()}
         </div>

         <button onClick={nextSlide} disabled={currentIndex === slides.length - 1} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer transition">
            <ChevronRight className="w-5 h-5" />
         </button>
      </div>
      
      {/* Speaker Notes */}
      {currentSlide.speakerNotes && (
        <div className="max-w-5xl mx-auto w-full p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mt-2">
           <h4 className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-2">Speaker Notes</h4>
           <p className="text-sm text-gray-900 dark:text-gray-300 leading-relaxed font-serif">{currentSlide.speakerNotes}</p>
        </div>
      )}
    </div>
  );
}
