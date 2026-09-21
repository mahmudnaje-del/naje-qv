import React from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import NajeThinking from '../NajeThinking';
import {
  ACCREDIT_LABELS,
  CAREER_BREAK_CHIPS,
  CvCourse,
  CvData,
  CvEducation,
  CvExperience,
  CvPersona,
  DEGREE_LABELS,
  DegreeLevel,
  EMPLOYMENT_TYPES,
} from '../../lib/cvStudio';
import { chipOff, chipOn, inputCls } from './cvUi';

export function ExperienceEditor({
  item,
  onChange,
  onRemove,
  onPolish,
  busy,
  index,
  persona,
}: {
  item: CvExperience;
  onChange: (e: CvExperience) => void;
  onRemove: () => void;
  onPolish: () => void;
  busy: boolean;
  index: number;
  persona?: CvPersona;
}) {
  const freelance = item.employmentType === 'مستقل' || persona === 'freelancer';
  return (
    <div className="space-y-2 rounded-xl border border-white/10 p-2.5">
      <div className="flex items-center justify-between text-[10px] font-black text-[#e8c36a]">
        <span>خبرة {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-white/35">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {EMPLOYMENT_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange({ ...item, employmentType: t.ar })}
            className={`rounded-lg border px-2 py-1 text-[10px] font-black ${item.employmentType === t.ar ? chipOn : chipOff}`}
          >
            {t.ar}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className={inputCls} placeholder="المسمّى" value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
        <input
          className={inputCls}
          placeholder={freelance ? 'عميل / مستقل' : 'الجهة'}
          value={item.company}
          onChange={(e) => onChange({ ...item, company: e.target.value })}
        />
        <input className={inputCls} placeholder="المدينة" value={item.city} onChange={(e) => onChange({ ...item, city: e.target.value })} />
        <label className="flex items-center gap-2 text-[11px] text-white/60">
          <input type="checkbox" checked={item.current} onChange={(e) => onChange({ ...item, current: e.target.checked })} />
          ما زلت هنا
        </label>
        <input className={inputCls} placeholder="من (2022-03)" value={item.start} onChange={(e) => onChange({ ...item, start: e.target.value })} />
        <input className={inputCls} placeholder="إلى" value={item.end} onChange={(e) => onChange({ ...item, end: e.target.value })} disabled={item.current} />
      </div>
      <textarea
        rows={3}
        className={inputCls}
        placeholder={'كل سطر نقطة.\nمثال: أدرت فريق 6 وأغلقت جرد نهاية الشهر بدقة 96٪'}
        value={item.bullets}
        onChange={(e) => onChange({ ...item, bullets: e.target.value })}
      />
      <button type="button" onClick={onPolish} disabled={busy} className="inline-flex items-center gap-1 text-[10px] font-black text-[#e8c36a]">
        {busy ? <NajeThinking size={14} /> : <Sparkles className="h-3 w-3" />} ناجي يصوغ النقاط
      </button>
    </div>
  );
}

export function CareerBreakHint({
  cv,
  gaps,
  onPick,
}: {
  cv: CvData;
  gaps: { months: number; after: string; before: string }[];
  onPick: (value: string) => void;
}) {
  if (!gaps.length) return null;
  return (
    <div className="rounded-xl border border-amber-400/25 bg-amber-500/8 p-2.5">
      <p className="text-[11px] font-black text-amber-100">هل تريد تفسير هذه الفترة؟</p>
      <p className="mt-0.5 text-[10px] leading-relaxed text-white/50">
        فجوة أكثر من 12 شهراً بين {gaps[0].after} و{gaps[0].before}. ليست مشكلة مفترضة — اختر إن رغبت.
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {CAREER_BREAK_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            className={`rounded-lg border px-2 py-1 text-[10px] font-black ${cv.careerBreak === c ? chipOn : chipOff}`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EducationEditor({
  item,
  onChange,
  onRemove,
}: {
  item: CvEducation;
  onChange: (e: CvEducation) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-white/10 p-2.5">
      <div className="flex justify-end">
        <button type="button" onClick={onRemove} className="text-white/35">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select className={inputCls} value={item.degreeLevel} onChange={(e) => onChange({ ...item, degreeLevel: e.target.value as DegreeLevel })}>
          {(Object.keys(DEGREE_LABELS) as DegreeLevel[]).map((k) => (
            <option key={k} value={k}>
              {DEGREE_LABELS[k].ar}
            </option>
          ))}
        </select>
        <input className={inputCls} placeholder="التخصص" value={item.field} onChange={(e) => onChange({ ...item, field: e.target.value })} />
        <input className={`${inputCls} col-span-2`} placeholder="الجامعة / المعهد" value={item.school} onChange={(e) => onChange({ ...item, school: e.target.value })} />
        <input className={inputCls} placeholder="سنة التخرج" value={item.year} onChange={(e) => onChange({ ...item, year: e.target.value })} />
        <div className="flex gap-1">
          <input className={inputCls} placeholder="المعدل" value={item.gpa} onChange={(e) => onChange({ ...item, gpa: e.target.value })} />
          <select className={inputCls} value={item.gpaScale} onChange={(e) => onChange({ ...item, gpaScale: e.target.value as '4' | '5' | '100' })}>
            <option value="5">من 5</option>
            <option value="4">من 4</option>
            <option value="100">من 100</option>
          </select>
        </div>
        {item.gpa.trim() ? (
          <p className="col-span-2 text-[10px] leading-relaxed text-white/45">
            أظهر المعدل إن كان يدعم ملفك لهذه الوظيفة؛ أخفه إن كان ضعيفاً نسبةً لسوقك.
          </p>
        ) : null}
        <label className="col-span-2 flex items-center gap-2 text-[11px] text-white/60">
          <input type="checkbox" checked={item.showGpa !== false} onChange={(e) => onChange({ ...item, showGpa: e.target.checked })} />
          إظهار المعدل على السيرة
        </label>
        <input className={`${inputCls} col-span-2`} placeholder="مرتبة شرف / ملاحظة" value={item.honors} onChange={(e) => onChange({ ...item, honors: e.target.value })} />
      </div>
    </div>
  );
}

export function CourseEditor({
  item,
  onChange,
  onRemove,
  onAdvice,
  busy,
  hint,
}: {
  item: CvCourse;
  onChange: (e: CvCourse) => void;
  onRemove: () => void;
  onAdvice: () => void;
  busy: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-white/10 p-2.5">
      <div className="flex justify-end">
        <button type="button" onClick={onRemove} className="text-white/35">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <input className={inputCls} placeholder="اسم الدورة" value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputCls} placeholder="الجهة المانحة" value={item.issuer} onChange={(e) => onChange({ ...item, issuer: e.target.value })} />
        <input className={inputCls} placeholder="السنة" value={item.year} onChange={(e) => onChange({ ...item, year: e.target.value })} />
        <input className={inputCls} placeholder="عدد الساعات" value={item.hours} onChange={(e) => onChange({ ...item, hours: e.target.value })} />
        <select className={inputCls} value={item.accredited} onChange={(e) => onChange({ ...item, accredited: e.target.value as CvCourse['accredited'] })}>
          <option value="">الاعتماد؟</option>
          <option value="yes">{ACCREDIT_LABELS.yes.ar}</option>
          <option value="no">{ACCREDIT_LABELS.no.ar}</option>
          <option value="internal">{ACCREDIT_LABELS.internal.ar}</option>
        </select>
        <input className={`${inputCls} col-span-2`} placeholder="نوع الجهة (جامعة، منصة، داخلي…)" value={item.providerType || ''} onChange={(e) => onChange({ ...item, providerType: e.target.value })} />
      </div>
      <textarea rows={2} className={inputCls} placeholder="ماذا استفدت؟ مهارة أصبحت تستخدمها في العمل..." value={item.gained} onChange={(e) => onChange({ ...item, gained: e.target.value })} />
      <button type="button" onClick={onAdvice} disabled={busy || !item.name.trim()} className="inline-flex items-center gap-1 text-[10px] font-black text-[#e8c36a]">
        {busy ? <NajeThinking size={14} /> : <Sparkles className="h-3 w-3" />} ما فائدة هذه الدورة؟
      </button>
      {hint && <p className="rounded-lg bg-black/30 p-2 text-[10px] leading-relaxed text-white/55">{hint}</p>}
    </div>
  );
}
