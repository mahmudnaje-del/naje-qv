import React from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import NajeThinking from '../NajeThinking';
import { useI18n } from '../../i18n';
import {
  CAREER_BREAKS,
  careerBreakSelected,
  careerBreakValue,
  CvCourse,
  CvData,
  CvEducation,
  CvExperience,
  CvPersona,
  DEGREE_LABELS,
  DegreeLevel,
  EMPLOYMENT_TYPES,
  gpaAdvice,
  matchEmployment,
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
  const { t, formatNumber } = useI18n();
  const typeId = matchEmployment(item.employmentType)?.id || '';
  const freelance = typeId === 'freelance' || persona === 'freelancer';
  return (
    <div className="space-y-2 rounded-xl border border-white/10 p-2.5">
      <div className="flex items-center justify-between text-[10px] font-black text-[#e8c36a]">
        <span>{t('cv.exp.n', { n: formatNumber(index + 1) })}</span>
        <button type="button" onClick={onRemove} className="min-h-[44px] min-w-[44px] text-white/35" aria-label={t('cv.field.delete')}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {EMPLOYMENT_TYPES.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onChange({ ...item, employmentType: row.id })}
            className={`min-h-[44px] rounded-lg border px-2 py-1 text-[10px] font-black ${typeId === row.id ? chipOn : chipOff}`}
          >
            {t(`cv.job.${row.id}`)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className={inputCls} placeholder={t('cv.exp.titlePh')} value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
        <input
          className={inputCls}
          placeholder={freelance ? t('cv.exp.clientPh') : t('cv.exp.companyPh')}
          value={item.company}
          onChange={(e) => onChange({ ...item, company: e.target.value })}
        />
        <input className={inputCls} placeholder={t('cv.exp.cityPh')} value={item.city} onChange={(e) => onChange({ ...item, city: e.target.value })} />
        <label className="flex min-h-[44px] items-center gap-2 text-[11px] text-white/60">
          <input type="checkbox" checked={item.current} onChange={(e) => onChange({ ...item, current: e.target.checked })} />
          {t('cv.exp.current')}
        </label>
        <input className={inputCls} placeholder={t('cv.exp.fromPh')} value={item.start} onChange={(e) => onChange({ ...item, start: e.target.value })} />
        <input className={inputCls} placeholder={t('cv.exp.toPh')} value={item.end} onChange={(e) => onChange({ ...item, end: e.target.value })} disabled={item.current} />
      </div>
      <textarea
        rows={3}
        className={inputCls}
        placeholder={t('cv.exp.bulletsPh')}
        value={item.bullets}
        onChange={(e) => onChange({ ...item, bullets: e.target.value })}
      />
      <button type="button" onClick={onPolish} disabled={busy} className="inline-flex min-h-[44px] items-center gap-1 text-[10px] font-black text-[#e8c36a]">
        {busy ? <NajeThinking size={14} /> : <Sparkles className="h-3 w-3" />} {t('cv.exp.polish')}
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
  const { t } = useI18n();
  if (!gaps.length) return null;
  return (
    <div className="rounded-xl border border-amber-400/25 bg-amber-500/8 p-2.5">
      <p className="text-[11px] font-black text-amber-100">{t('cv.break.ask')}</p>
      <p className="mt-0.5 text-[10px] leading-relaxed text-white/50">
        {t('cv.break.between', { after: gaps[0].after, before: gaps[0].before })}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {CAREER_BREAKS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(careerBreakValue(c, cv.lang))}
            className={`min-h-[44px] rounded-lg border px-2 py-1 text-[10px] font-black ${careerBreakSelected(cv.careerBreak, c) ? chipOn : chipOff}`}
          >
            {t(`cv.break.${c.id}`)}
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
  const { t } = useI18n();
  const advice = item.gpa.trim() ? gpaAdvice(item.gpa, item.gpaScale) : null;
  return (
    <div className="space-y-2 rounded-xl border border-white/10 p-2.5">
      <div className="flex justify-end">
        <button type="button" onClick={onRemove} className="min-h-[44px] min-w-[44px] text-white/35" aria-label={t('cv.field.delete')}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select className={inputCls} value={item.degreeLevel} onChange={(e) => onChange({ ...item, degreeLevel: e.target.value as DegreeLevel })}>
          {(Object.keys(DEGREE_LABELS) as DegreeLevel[]).map((k) => (
            <option key={k} value={k}>
              {t(`cv.degree.${k}`)}
            </option>
          ))}
        </select>
        <input className={inputCls} placeholder={t('cv.edu.fieldPh')} value={item.field} onChange={(e) => onChange({ ...item, field: e.target.value })} />
        <input className={`${inputCls} col-span-2`} placeholder={t('cv.edu.schoolPh')} value={item.school} onChange={(e) => onChange({ ...item, school: e.target.value })} />
        <input className={inputCls} placeholder={t('cv.edu.yearPh')} value={item.year} onChange={(e) => onChange({ ...item, year: e.target.value })} />
        <div className="flex gap-1">
          <input className={inputCls} placeholder={t('cv.edu.gpaPh')} value={item.gpa} onChange={(e) => onChange({ ...item, gpa: e.target.value })} />
          <select className={inputCls} value={item.gpaScale} onChange={(e) => onChange({ ...item, gpaScale: e.target.value as '4' | '5' | '100' })}>
            <option value="5">{t('cv.edu.scale5')}</option>
            <option value="4">{t('cv.edu.scale4')}</option>
            <option value="100">{t('cv.edu.scale100')}</option>
          </select>
        </div>
        {advice ? (
          <p className={`col-span-2 text-[10px] leading-relaxed ${advice.suggestHide ? 'text-amber-200' : 'text-white/45'}`}>
            {t(`cv.gpa.${advice.code}`, advice.code === 'low' || advice.code === 'strong' ? { n: advice.n, scale: advice.scale } : undefined)}
          </p>
        ) : null}
        <label className="col-span-2 flex min-h-[44px] items-center gap-2 text-[11px] text-white/60">
          <input type="checkbox" checked={item.showGpa !== false} onChange={(e) => onChange({ ...item, showGpa: e.target.checked })} />
          {t('cv.edu.showGpa')}
        </label>
        <input className={`${inputCls} col-span-2`} placeholder={t('cv.edu.honorsPh')} value={item.honors} onChange={(e) => onChange({ ...item, honors: e.target.value })} />
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
  const { t } = useI18n();
  return (
    <div className="space-y-2 rounded-xl border border-white/10 p-2.5">
      <div className="flex justify-end">
        <button type="button" onClick={onRemove} className="min-h-[44px] min-w-[44px] text-white/35" aria-label={t('cv.field.delete')}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <input className={inputCls} placeholder={t('cv.course.namePh')} value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputCls} placeholder={t('cv.course.issuerPh')} value={item.issuer} onChange={(e) => onChange({ ...item, issuer: e.target.value })} />
        <input className={inputCls} placeholder={t('cv.course.yearPh')} value={item.year} onChange={(e) => onChange({ ...item, year: e.target.value })} />
        <input className={inputCls} placeholder={t('cv.course.hoursPh')} value={item.hours} onChange={(e) => onChange({ ...item, hours: e.target.value })} />
        <select className={inputCls} value={item.accredited} onChange={(e) => onChange({ ...item, accredited: e.target.value as CvCourse['accredited'] })}>
          <option value="">{t('cv.course.accreditAsk')}</option>
          <option value="yes">{t('cv.accredit.yes')}</option>
          <option value="no">{t('cv.accredit.no')}</option>
          <option value="internal">{t('cv.accredit.internal')}</option>
        </select>
        <input className={`${inputCls} col-span-2`} placeholder={t('cv.course.providerPh')} value={item.providerType || ''} onChange={(e) => onChange({ ...item, providerType: e.target.value })} />
      </div>
      <textarea rows={2} className={inputCls} placeholder={t('cv.course.gainedPh')} value={item.gained} onChange={(e) => onChange({ ...item, gained: e.target.value })} />
      <button type="button" onClick={onAdvice} disabled={busy || !item.name.trim()} className="inline-flex min-h-[44px] items-center gap-1 text-[10px] font-black text-[#e8c36a]">
        {busy ? <NajeThinking size={14} /> : <Sparkles className="h-3 w-3" />} {t('cv.course.why')}
      </button>
      {hint && <p className="rounded-lg bg-black/30 p-2 text-[10px] leading-relaxed text-white/55">{hint}</p>}
    </div>
  );
}
