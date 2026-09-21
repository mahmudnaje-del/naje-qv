import React from 'react';
import {
  ACCREDIT_LABELS,
  CvData,
  DEGREE_LABELS,
  LANG_LEVELS,
  bulletsOf,
  rangeLabel,
} from '../../lib/cvStudio';

function Section({ title, children, gold = false }: { title: string; children: React.ReactNode; gold?: boolean }) {
  if (!children) return null;
  return (
    <section className="mt-3">
      <h3
        className={`mb-1.5 border-b pb-0.5 text-[9.5px] font-black tracking-[0.14em] ${
          gold ? 'border-[#c4a35a]/50 text-[#8a6a28]' : 'border-slate-300 text-slate-700'
        }`}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function useCopy(cv: CvData) {
  const ar = cv.lang === 'ar';
  return {
    ar,
    t: {
      summary: ar ? 'الملخص المهني' : 'Professional Summary',
      experience: ar ? 'الخبرات العملية' : 'Work Experience',
      education: ar ? 'التعليم' : 'Education',
      skills: ar ? 'المهارات' : 'Skills',
      courses: ar ? 'الدورات التدريبية' : 'Training',
      certs: ar ? 'الشهادات المهنية' : 'Certifications',
      langs: ar ? 'اللغات' : 'Languages',
      projects: ar ? 'المشاريع' : 'Projects',
      personal: ar ? 'بيانات شخصية' : 'Personal',
      volunteer: ar ? 'التطوع' : 'Volunteer',
      military: ar ? 'الخدمة الوطنية' : 'National Service',
      refs: ar ? 'المراجع' : 'References',
    },
  };
}

function ContactLine({ cv }: { cv: CvData }) {
  const bits = [cv.city && cv.country ? `${cv.city}، ${cv.country}` : cv.city || cv.country, cv.phone, cv.email, cv.linkedin, cv.portfolio].filter(
    Boolean
  );
  return <p className="text-[8.5px] leading-relaxed text-slate-600">{bits.join('  ·  ')}</p>;
}

function ExperienceBlock({ cv }: { cv: CvData }) {
  const { ar } = useCopy(cv);
  return (
    <>
      {cv.experiences
        .filter((e) => e.title || e.company)
        .map((e) => (
          <div key={e.id} className="mb-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[10.5px] font-black text-slate-900">
                {e.title}
                {e.company ? <span className="font-semibold text-slate-600"> — {e.company}</span> : null}
              </p>
              <span className="shrink-0 text-[8px] text-slate-500">{rangeLabel(e.start, e.end, e.current, cv.lang)}</span>
            </div>
            {e.city && <p className="text-[8px] text-slate-500">{e.city}</p>}
            <ul className="mt-0.5 list-disc pr-3.5 text-[9px] leading-snug text-slate-700">
              {bulletsOf(e.bullets).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      {cv.experiences.every((e) => !e.title && !e.company) && (
        <p className="text-[9px] text-slate-400">{ar ? 'أضف خبرة أو مشروعاً تطبيقياً.' : 'Add a role or applied project.'}</p>
      )}
    </>
  );
}

function EducationBlock({ cv }: { cv: CvData }) {
  return (
    <>
      {cv.education
        .filter((e) => e.school || e.field)
        .map((e) => (
          <div key={e.id} className="mb-1.5">
            <p className="text-[10px] font-black text-slate-900">
              {DEGREE_LABELS[e.degreeLevel][cv.lang]} {e.field && `· ${e.field}`}
            </p>
            <p className="text-[9px] text-slate-600">
              {e.school}
              {e.year ? ` · ${e.year}` : ''}
              {e.gpa ? ` · ${cv.lang === 'ar' ? 'المعدل' : 'GPA'} ${e.gpa}/${e.gpaScale}` : ''}
              {e.honors ? ` · ${e.honors}` : ''}
            </p>
          </div>
        ))}
    </>
  );
}

function CoursesBlock({ cv }: { cv: CvData }) {
  return (
    <>
      {cv.courses
        .filter((c) => c.name)
        .map((c) => (
          <div key={c.id} className="mb-1.5">
            <p className="text-[10px] font-black text-slate-900">{c.name}</p>
            <p className="text-[8.5px] text-slate-600">
              {[c.issuer, c.year, c.hours && `${c.hours} ${cv.lang === 'ar' ? 'ساعة' : 'hrs'}`, c.accredited && ACCREDIT_LABELS[c.accredited][cv.lang]]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {c.gained && <p className="text-[8.5px] text-slate-700">{c.gained}</p>}
          </div>
        ))}
    </>
  );
}

function CertsBlock({ cv }: { cv: CvData }) {
  return (
    <>
      {cv.certificates
        .filter((c) => c.name)
        .map((c) => (
          <p key={c.id} className="mb-1 text-[9px] text-slate-800">
            <span className="font-black">{c.name}</span>
            {c.issuer ? ` — ${c.issuer}` : ''}
            {c.year ? ` · ${c.year}` : ''}
            {c.idNumber ? ` · ID ${c.idNumber}` : ''}
            {c.expires ? ` · ${cv.lang === 'ar' ? 'تنتهي' : 'exp.'} ${c.expires}` : ''}
          </p>
        ))}
    </>
  );
}

function PersonalBits({ cv }: { cv: CvData }) {
  const { t } = useCopy(cv);
  const rows = [
    cv.nationality && [cv.lang === 'ar' ? 'الجنسية' : 'Nationality', cv.nationality],
    cv.visa && [cv.lang === 'ar' ? 'الإقامة' : 'Visa', cv.visa],
    cv.notice && [cv.lang === 'ar' ? 'الإشعار' : 'Notice', cv.notice],
    cv.dob && [cv.lang === 'ar' ? 'الميلاد' : 'DOB', cv.dob],
    cv.age && [cv.lang === 'ar' ? 'العمر' : 'Age', cv.age],
    cv.gender && [cv.lang === 'ar' ? 'الجنس' : 'Gender', cv.gender === 'male' ? (cv.lang === 'ar' ? 'ذكر' : 'Male') : cv.lang === 'ar' ? 'أنثى' : 'Female'],
    cv.marital && [cv.lang === 'ar' ? 'الحالة' : 'Status', cv.marital === 'married' ? (cv.lang === 'ar' ? 'متزوج' : 'Married') : cv.lang === 'ar' ? 'أعزب' : 'Single'],
    cv.license && [cv.lang === 'ar' ? 'الرخصة' : 'Licence', cv.license],
    cv.availability && [cv.lang === 'ar' ? 'التوفر' : 'Availability', cv.availability],
  ].filter(Boolean) as [string, string][];
  if (!rows.length) return null;
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[8.5px] text-slate-700">
      {rows.map(([k, v]) => (
        <p key={k}>
          <span className="font-bold text-slate-500">{k}: </span>
          {v}
        </p>
      ))}
    </div>
  );
}

function SkillsLine({ cv }: { cv: CvData }) {
  const items = cv.skills
    .split(/[,،\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!items.length) return null;
  return <p className="text-[9px] leading-relaxed text-slate-800">{items.join('  ·  ')}</p>;
}

function LangsLine({ cv }: { cv: CvData }) {
  const items = cv.languages
    .filter((l) => l.name)
    .map((l) => `${l.name} (${LANG_LEVELS.find((x) => x.id === l.level)?.[cv.lang] || l.level})`);
  if (!items.length) return null;
  return <p className="text-[9px] text-slate-800">{items.join('  ·  ')}</p>;
}

function Paper({
  cv,
  children,
  className,
  sheetId = 'naje-cv-sheet',
}: {
  cv: CvData;
  children: React.ReactNode;
  className?: string;
  sheetId?: string;
}) {
  return (
    <article
      id={sheetId}
      dir={cv.lang === 'ar' ? 'rtl' : 'ltr'}
      className={`relative overflow-hidden bg-white text-slate-900 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)] ${className || ''}`}
      style={{ width: 794, minHeight: 1123, padding: '42px 48px 48px', fontFamily: '"Cairo", "Segoe UI", Tahoma, sans-serif' }}
    >
      {children}
    </article>
  );
}

function HeaderClassic({ cv, gold = false }: { cv: CvData; gold?: boolean }) {
  const photoOn = cv.showPhoto && cv.photo;
  return (
    <header className={`flex items-start gap-4 ${gold ? 'border-b-2 border-[#c4a35a] pb-3' : 'border-b border-slate-200 pb-3'}`}>
      {photoOn && <img src={cv.photo!} alt="" className="h-[92px] w-[74px] shrink-0 rounded-md object-cover object-top ring-1 ring-black/10" />}
      <div className="min-w-0 flex-1">
        <h1 className={`text-[22px] font-black leading-tight ${gold ? 'text-[#1a140c]' : 'text-slate-900'}`}>
          {cv.fullName || (cv.lang === 'ar' ? 'اسمك الثلاثي' : 'Your full name')}
        </h1>
        <p className={`mt-0.5 text-[12px] font-bold ${gold ? 'text-[#8a6a28]' : 'text-slate-600'}`}>
          {cv.headline || (cv.lang === 'ar' ? 'المسمّى الذي تريد أن يراك فيه الـHR' : 'Target title')}
        </p>
        <div className="mt-1.5">
          <ContactLine cv={cv} />
        </div>
      </div>
    </header>
  );
}

function BodyCommon({ cv, gold = false }: { cv: CvData; gold?: boolean }) {
  const { t } = useCopy(cv);
  const eduFirst = cv.template === 'academic';
  const exp = (
    <Section title={t.experience} gold={gold}>
      <ExperienceBlock cv={cv} />
    </Section>
  );
  const edu = cv.education.some((e) => e.school || e.field) ? (
    <Section title={t.education} gold={gold}>
      <EducationBlock cv={cv} />
    </Section>
  ) : null;
  return (
    <>
      {cv.summary.trim() && (
        <Section title={t.summary} gold={gold}>
          <p className="text-[10px] leading-relaxed text-slate-800">{cv.summary}</p>
        </Section>
      )}
      {cv.showPersonal && (
        <Section title={t.personal} gold={gold}>
          <PersonalBits cv={cv} />
        </Section>
      )}
      {eduFirst ? edu : exp}
      {eduFirst ? exp : edu}
      {cv.skills.trim() && (
        <Section title={t.skills} gold={gold}>
          <SkillsLine cv={cv} />
        </Section>
      )}
      {cv.courses.some((c) => c.name) && (
        <Section title={t.courses} gold={gold}>
          <CoursesBlock cv={cv} />
        </Section>
      )}
      {cv.certificates.some((c) => c.name) && (
        <Section title={t.certs} gold={gold}>
          <CertsBlock cv={cv} />
        </Section>
      )}
      {cv.languages.some((l) => l.name) && (
        <Section title={t.langs} gold={gold}>
          <LangsLine cv={cv} />
        </Section>
      )}
      {cv.projects.some((p) => p.name) && (
        <Section title={t.projects} gold={gold}>
          {cv.projects
            .filter((p) => p.name)
            .map((p) => (
              <p key={p.id} className="mb-1 text-[9px] text-slate-800">
                <span className="font-black">{p.name}</span>
                {p.role ? ` — ${p.role}` : ''}
                {p.year ? ` · ${p.year}` : ''}
                {p.detail ? ` · ${p.detail}` : ''}
              </p>
            ))}
        </Section>
      )}
      {cv.volunteer.trim() && (
        <Section title={t.volunteer} gold={gold}>
          <p className="text-[9px] text-slate-800">{cv.volunteer}</p>
        </Section>
      )}
      {cv.military.trim() && (
        <Section title={t.military} gold={gold}>
          <p className="text-[9px] text-slate-800">{cv.military}</p>
        </Section>
      )}
      {cv.references.trim() && (
        <Section title={t.refs} gold={gold}>
          <p className="text-[9px] text-slate-800">{cv.references}</p>
        </Section>
      )}
    </>
  );
}

function ModernSheet({ cv, sheetId }: { cv: CvData; sheetId?: string }) {
  const { t } = useCopy(cv);
  return (
    <Paper cv={cv} className="!p-0" sheetId={sheetId}>
      <div className="flex min-h-[1123px]">
        <aside className="w-[220px] shrink-0 bg-[#0f1c2e] px-5 py-8 text-[#f3ead8]">
          {cv.showPhoto && cv.photo && <img src={cv.photo} alt="" className="mb-4 h-28 w-full rounded-xl object-cover object-top" />}
          <h1 className="text-[18px] font-black leading-tight">{cv.fullName || '—'}</h1>
          <p className="mt-1 text-[10px] font-bold text-[#c4a35a]">{cv.headline}</p>
          <div className="mt-4 space-y-1 text-[8px] leading-relaxed text-white/70">
            {cv.phone && <p>{cv.phone}</p>}
            {cv.email && <p className="break-all">{cv.email}</p>}
            {(cv.city || cv.country) && <p>{[cv.city, cv.country].filter(Boolean).join('، ')}</p>}
            {cv.linkedin && <p className="break-all">{cv.linkedin}</p>}
          </div>
          {cv.showPersonal && (
            <div className="mt-5">
              <p className="mb-1 text-[8px] font-black tracking-widest text-[#c4a35a]">{t.personal}</p>
              <div className="space-y-0.5 text-[8px] text-white/75">
                {cv.nationality && <p>{cv.nationality}</p>}
                {cv.visa && <p>{cv.visa}</p>}
                {cv.notice && <p>{cv.notice}</p>}
              </div>
            </div>
          )}
          {cv.skills.trim() && (
            <div className="mt-5">
              <p className="mb-1 text-[8px] font-black tracking-widest text-[#c4a35a]">{t.skills}</p>
              <div className="flex flex-col gap-0.5 text-[8px] text-white/80">
                {cv.skills
                  .split(/[,،\n]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((s) => (
                    <span key={s}>• {s}</span>
                  ))}
              </div>
            </div>
          )}
          {cv.languages.some((l) => l.name) && (
            <div className="mt-5">
              <p className="mb-1 text-[8px] font-black tracking-widest text-[#c4a35a]">{t.langs}</p>
              <p className="text-[8px] leading-relaxed text-white/80">
                {cv.languages
                  .filter((l) => l.name)
                  .map((l) => l.name)
                  .join('  ·  ')}
              </p>
            </div>
          )}
        </aside>
        <div className="min-w-0 flex-1 px-7 py-8">
          <BodyCommon cv={cv} gold />
        </div>
      </div>
    </Paper>
  );
}

export function CvPreview({ cv, sheetId }: { cv: CvData; sheetId?: string }) {
  if (cv.template === 'modern') return <ModernSheet cv={cv} sheetId={sheetId} />;
  const gold = cv.template === 'gold' || cv.template === 'gulf';
  return (
    <Paper cv={cv} className={cv.template === 'gold' ? 'bg-[#fbf7ef]' : ''} sheetId={sheetId}>
      {cv.template === 'jadarat' && <p className="mb-2 text-[8px] font-bold tracking-[0.2em] text-slate-400">CV · جدارات · نص حقيقي</p>}
      <HeaderClassic cv={cv} gold={gold} />
      <BodyCommon cv={cv} gold={gold} />
    </Paper>
  );
}

export default CvPreview;
