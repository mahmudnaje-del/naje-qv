import React, { useState } from 'react';
import { InteractiveLoadingPlaceholder } from './InteractiveLoadingPlaceholder';
import { getEpisodes } from './LoadingEpisodes';

export function EpisodesViewer() {
  const [pwd, setPwd] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [epIndex, setEpIndex] = useState<number | undefined>(undefined);

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white" dir="rtl">
        <h1 className="text-3xl font-bold mb-6 text-indigo-400">وصول الحلقات</h1>
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center gap-4">
          <input 
            type="password" 
            value={pwd} 
            onChange={e => setPwd(e.target.value)} 
            className="p-3 w-64 rounded-xl bg-black border border-slate-700 text-center text-lg focus:outline-none focus:border-indigo-500"
            placeholder="كلمة السر..."
          />
          <button 
            onClick={() => {
              if (pwd === 'Maysarh$2007') {
                setUnlocked(true);
                setEpIndex(0);
              } else {
                alert('كلمة سر خاطئة');
              }
            }}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl font-bold transition-all shadow-lg"
          >
            دخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex flex-col items-center gap-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      <div className="w-full max-w-4xl flex items-center justify-between mb-2 border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-200">Creative AI - مراجعة الحلقات</h2>
        
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
          <button 
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${lang === 'ar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setLang('ar')}
          >
            عربي
          </button>
          <button 
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${lang === 'en' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setLang('en')}
          >
            English
          </button>
        </div>
      </div>
      
      <div className="w-full max-w-4xl flex flex-col items-center gap-12">
          
          <div className="w-full bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-slate-400 mb-4 font-medium text-sm text-center">اختر الحلقة لمعاينتها</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {Array.from({ length: getEpisodes().length }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setEpIndex(i)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm
                    ${epIndex === i 
                      ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.4)]' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                  الحلقة {i + 1}
                </button>
              ))}
            </div>
          </div>
          
          <div className="scale-100 sm:scale-125 transform origin-top pb-20">
            <InteractiveLoadingPlaceholder key={`${epIndex}-${lang}`} lang={lang} forceEpIndex={epIndex} />
          </div>
      </div>
    </div>
  );
}
