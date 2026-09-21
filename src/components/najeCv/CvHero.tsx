import React from 'react';
import { FileText, MessageCircle, Sparkles, Upload } from 'lucide-react';
import {
  applyMarketDefaults,
  applyPersonaDefaults,
  CvData,
  CvLang,
  CvMarket,
  CvPersona,
  MARKETS,
  PERSONAS,
} from '../../lib/cvStudio';
import { chipOff, chipOn, goldBtn, ghostGoldBtn, inputCls } from './cvUi';

export function CvHero({
  onCreate,
  onInterview,
  onImport,
  onDemo,
}: {
  onCreate: () => void;
  onInterview: () => void;
  onImport: () => void;
  onDemo: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-1 py-6 sm:py-10">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c4a35a]/35 bg-[#c4a35a]/10 px-3 py-1 text-[10px] font-black tracking-[0.16em] text-[#e8c36a]">
        <FileText className="h-3.5 w-3.5" /> CV BY NAJE
      </div>
      <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">ابنِ سيرة ذاتية تتحدث عنك</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
        أدخل معلوماتك كما هي. ناجي يحوّلها إلى ملف مهني للإنسان وATS.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <button type="button" onClick={onCreate} className={`${goldBtn} h-auto flex-col items-start gap-1 px-4 py-4 text-right`}>
          <span className="text-sm font-black">إنشاء سيرتي</span>
          <span className="text-[10px] font-bold text-[#1a140c]/70">ابدأ من اسمك ومسمّاك — بلا خطوات طويلة</span>
        </button>
        <button type="button" onClick={onInterview} className={`${ghostGoldBtn} h-auto flex-col items-start gap-1 px-4 py-4 text-right`}>
          <span className="inline-flex items-center gap-1.5 text-sm font-black">
            <MessageCircle className="h-4 w-4" /> تحدث مع ناجي
          </span>
          <span className="text-[10px] font-bold text-white/45">سؤال واحد في كل مرة. لا شيء يُكتب حتى تؤكد.</span>
        </button>
        <button type="button" onClick={onImport} className={`${ghostGoldBtn} h-auto flex-col items-start gap-1 px-4 py-4 text-right`}>
          <span className="inline-flex items-center gap-1.5 text-sm font-black">
            <Upload className="h-4 w-4" /> استيراد ملف
          </span>
          <span className="text-[10px] font-bold text-white/45">Word أو نص. PDF: الصق المحتوى — لا نفكّكه زوراً.</span>
        </button>
        <button type="button" onClick={onDemo} className={`${ghostGoldBtn} h-auto flex-col items-start gap-1 px-4 py-4 text-right`}>
          <span className="inline-flex items-center gap-1.5 text-sm font-black">
            <Sparkles className="h-4 w-4" /> استكشف بمثال
          </span>
          <span className="text-[10px] font-bold text-white/45">بيانات تجريبية واضحة — ليست سيرتك</span>
        </button>
      </div>
    </div>
  );
}

export function CvOnboard({
  cv,
  onApply,
  onBack,
  onEnter,
}: {
  cv: CvData;
  onApply: (fn: (c: CvData) => CvData) => void;
  onBack: () => void;
  onEnter: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-1 py-4 sm:py-8">
      <button type="button" onClick={onBack} className="mb-4 text-[11px] font-black text-white/45">
        عودة
      </button>
      <h2 className="text-2xl font-black text-white">من أنت، وأين تقدّم؟</h2>
      <p className="mt-1.5 text-[12px] leading-relaxed text-white/50">شاشة واحدة. غيّر هذا لاحقاً من البناء.</p>

      <p className="mt-6 mb-2 text-[11px] font-black text-[#e8c36a]">الشخصية المهنية</p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onApply((c) => applyPersonaDefaults(c, p.id as CvPersona))}
            className={`rounded-xl border px-2 py-2 text-right ${cv.persona === p.id ? chipOn : chipOff}`}
          >
            <span className="block text-[11px] font-black">{p.ar}</span>
            <span className="mt-0.5 block text-[9px] text-white/40">{p.hint}</span>
          </button>
        ))}
      </div>

      <p className="mt-6 mb-2 text-[11px] font-black text-[#e8c36a]">سوق التقديم</p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {MARKETS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onApply((c) => applyMarketDefaults(c, m.id as CvMarket))}
            className={`rounded-xl border px-2 py-2 text-right ${cv.market === m.id ? chipOn : chipOff}`}
          >
            <span className="block text-[11px] font-black">{m.ar}</span>
            <span className="mt-0.5 block text-[9px] text-white/40">{m.hint}</span>
          </button>
        ))}
      </div>

      <p className="mt-6 mb-2 text-[11px] font-black text-[#e8c36a]">لغة السيرة</p>
      <div className="flex gap-1.5">
        {(['ar', 'en'] as CvLang[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onApply((c) => ({ ...c, lang: l }))}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-black ${cv.lang === l ? 'bg-[#c4a35a] text-[#1a140c]' : 'border border-white/10 text-white/60'}`}
          >
            {l === 'ar' ? 'العربية' : 'English'}
          </button>
        ))}
      </div>

      <p className="mt-6 mb-2 text-[11px] font-black text-[#e8c36a]">الدور المستهدف (اختياري)</p>
      <input
        className={inputCls}
        value={cv.targetRole}
        onChange={(e) => onApply((c) => ({ ...c, targetRole: e.target.value }))}
        placeholder="مثال: أخصائي استقطاب مواهب"
      />

      <button type="button" onClick={onEnter} className={`${goldBtn} mt-6 w-full py-3 text-sm`}>
        ادخل إلى البناء
      </button>
    </div>
  );
}
