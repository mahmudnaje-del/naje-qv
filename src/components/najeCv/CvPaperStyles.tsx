import React from 'react';
import {
  ACCREDIT_LABELS,
  CvData,
  CvTemplate,
  DEGREE_LABELS,
  LANG_LEVELS,
  bulletsOf,
  employmentLabel,
  isGenericSummaryLine,
  paperAccentVars,
  rangeLabel,
} from '../../lib/cvStudio';

export const A4_W = 794;
export const A4_H = 1123;
export const CV_FONT = '"Cairo", "Segoe UI", Tahoma, sans-serif';

export type Tone = CvTemplate;

export function Ltr({ children, className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span dir="ltr" className={className} style={{ unicodeBidi: 'isolate' }} {...rest}>
      {children}
    </span>
  );
}

export function copyOf(cv: CvData) {
  const ar = cv.lang === 'ar';
  const jadarat = cv.template === 'jadarat';
  return {
    ar,
    t: {
      summary: ar ? 'الملخص المهني' : 'Professional Summary',
      experience: jadarat ? (ar ? 'الخبرات العملية' : 'Work Experience') : ar ? 'الخبرات العملية' : 'Work Experience',
      education: jadarat ? (ar ? 'المؤهلات' : 'Qualifications') : ar ? 'التعليم' : 'Education',
      skills: ar ? 'المهارات' : 'Skills',
      courses: ar ? 'الدورات التدريبية' : 'Training',
      certs: ar ? 'الشهادات المهنية' : 'Certifications',
      langs: ar ? 'اللغات' : 'Languages',
      projects: ar ? 'المشاريع' : 'Projects',
      personal: jadarat ? (ar ? 'البيانات الشخصية' : 'Personal Data') : ar ? 'بيانات شخصية' : 'Personal',
      volunteer: ar ? 'التطوع' : 'Volunteer',
      military: ar ? 'الخدمة الوطنية' : 'National Service',
      refs: ar ? 'المراجع' : 'References',
      publications: ar ? 'الأبحاث والمنشورات' : 'Publications',
      achievements: ar ? 'الإنجازات' : 'Achievements',
      nationality: ar ? 'الجنسية' : 'Nationality',
      visa: ar ? 'الإقامة' : 'Visa / Status',
      notice: ar ? 'الإشعار' : 'Notice',
      gpa: ar ? 'المعدل' : 'GPA',
      cvTitle: ar ? 'السيرة الذاتية' : 'Curriculum Vitae',
    },
  };
}

export function eduFirst(cv: CvData) {
  return (
    cv.template === 'academic' ||
    cv.persona === 'student' ||
    cv.persona === 'graduate' ||
    cv.persona === 'no_experience'
  );
}

export function hasExp(cv: CvData) {
  return cv.experiences.some((e) => e.title.trim() || e.company.trim());
}
export function hasEdu(cv: CvData) {
  return cv.education.some((e) => e.school.trim() || e.field.trim());
}
export function hasCourses(cv: CvData) {
  return cv.courses.some((c) => c.name.trim());
}
export function hasCerts(cv: CvData) {
  return cv.certificates.some((c) => c.name.trim());
}
export function hasLangs(cv: CvData) {
  return cv.languages.some((l) => l.name.trim());
}
export function hasProjects(cv: CvData) {
  return cv.projects.some((p) => p.name.trim());
}
export function hasPubs(cv: CvData) {
  return cv.publications.some((p) => p.title.trim());
}
export function hasAch(cv: CvData) {
  return cv.achievements.some((a) => a.title.trim());
}
export function hasCustom(cv: CvData) {
  return cv.customSections.some((s) => s.title.trim() || s.body.trim());
}
export function hasSkills(cv: CvData) {
  return cv.skills.trim().length > 0;
}

export function skillItems(cv: CvData) {
  return cv.skills
    .split(/[,،\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function sectionOrder(cv: CvData): string[] {
  if (cv.template === 'academic') {
    return [
      'summary',
      'education',
      'publications',
      'experience',
      'projects',
      'achievements',
      'skills',
      'courses',
      'certs',
      'langs',
      'volunteer',
      'military',
      'custom',
      'refs',
    ];
  }
  if (cv.persona === 'freelancer') {
    return [
      'summary',
      'personal',
      'experience',
      'projects',
      'skills',
      'education',
      'certs',
      'courses',
      'langs',
      'achievements',
      'publications',
      'volunteer',
      'military',
      'custom',
      'refs',
    ];
  }
  if (cv.persona === 'manager') {
    return [
      'summary',
      'personal',
      'experience',
      'achievements',
      'skills',
      'education',
      'certs',
      'courses',
      'projects',
      'langs',
      'publications',
      'volunteer',
      'military',
      'custom',
      'refs',
    ];
  }
  if (eduFirst(cv)) {
    return [
      'summary',
      'personal',
      'education',
      'projects',
      'experience',
      'skills',
      'courses',
      'certs',
      'langs',
      'achievements',
      'publications',
      'volunteer',
      'military',
      'custom',
      'refs',
    ];
  }
  return [
    'summary',
    'personal',
    'experience',
    'education',
    'skills',
    'courses',
    'certs',
    'langs',
    'projects',
    'achievements',
    'publications',
    'volunteer',
    'military',
    'custom',
    'refs',
  ];
}

export function CvPhoto({
  cv,
  shape,
  size,
  height,
}: {
  cv: CvData;
  shape: 'circle' | 'square' | 'plain';
  size: number;
  height?: number;
}) {
  if (!cv.showPhoto || !cv.photo) return null;
  const h = height ?? size;
  const radius = shape === 'circle' ? '50%' : shape === 'square' ? '0px' : '0px';
  const border =
    shape === 'circle' ? '2px solid var(--cv-accent, #c4a35a)' : shape === 'square' ? '1px solid #1b2838' : '1px solid #d4d4d8';
  return (
    <img
      src={cv.photo}
      alt=""
      width={size}
      height={h}
      style={{
        width: size,
        height: h,
        objectFit: 'cover',
        objectPosition: 'center 18%',
        borderRadius: radius,
        border,
        flexShrink: 0,
        display: 'block',
        backgroundColor: '#e7e5e4',
      }}
    />
  );
}

export function ContactLine({
  cv,
  className,
  sep = '  ·  ',
}: {
  cv: CvData;
  className?: string;
  sep?: string;
}) {
  const loc = [cv.city, cv.country].filter(Boolean).join(cv.lang === 'ar' ? '، ' : ', ');
  const parts: React.ReactNode[] = [];
  if (loc) parts.push(<span key="loc">{loc}</span>);
  if (cv.phone) parts.push(<Ltr key="ph">{cv.phone}</Ltr>);
  if (cv.email) parts.push(<Ltr key="em">{cv.email}</Ltr>);
  if (cv.linkedin) parts.push(<Ltr key="li">{cv.linkedin}</Ltr>);
  if (cv.portfolio) parts.push(<Ltr key="pf">{cv.portfolio}</Ltr>);
  if (cv.github) parts.push(<Ltr key="gh">{cv.github}</Ltr>);
  if (!parts.length) return null;
  return (
    <p className={className || 'text-[8.5px] leading-snug text-slate-600'} style={{ overflowWrap: 'anywhere' }}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 ? sep : null}
          {p}
        </React.Fragment>
      ))}
    </p>
  );
}

export function Section({
  title,
  tone,
  ar,
  children,
}: {
  title: string;
  tone: Tone;
  ar: boolean;
  children: React.ReactNode;
}) {
  if (children == null || children === false) return null;
  const upper = !ar && (tone === 'naje' || tone === 'gold' || tone === 'academic' || tone === 'modern');
  const mt = tone === 'gold' ? 'mt-5' : tone === 'academic' ? 'mt-4' : 'mt-3';
  const heads: Record<Tone, string> = {
    naje: `mb-1.5 border-b-[1.5px] border-black pb-[3px] text-[9.5px] font-black tracking-[0.16em] text-black ${
      upper ? 'uppercase' : ''
    }`,
    gulf: 'mb-1.5 border-b pb-[3px] text-[9.5px] font-black tracking-[0.1em] text-[#1a140c] [border-color:var(--cv-accent,#c4a35a)]',
    jadarat: 'mb-1.5 bg-[#e8eef4] px-2 py-[5px] text-[10.5px] font-bold text-[#1a2a3a]',
    gold: `mb-0 text-[8.5px] font-black tracking-[0.22em] [color:var(--cv-accent-ink,#8a6a28)] ${upper ? 'uppercase' : ''}`,
    modern: `mb-1.5 border-b pb-[3px] text-[9.5px] font-black tracking-[0.14em] [border-color:color-mix(in_srgb,var(--cv-accent,#c4a35a)_45%,transparent)] [color:var(--cv-accent-ink,#6e5420)] ${
      upper ? 'uppercase' : ''
    }`,
    academic: `mb-1.5 border-b border-slate-800 pb-[3px] text-[10px] font-bold tracking-[0.12em] text-slate-900 ${
      upper ? 'uppercase' : ''
    }`,
  };
  return (
    <section className={mt}>
      <h3 className={heads[tone]}>{title}</h3>
      {tone === 'gold' && <div className="mb-2.5 mt-1 h-px w-11" style={{ backgroundColor: 'var(--cv-accent, #c4a35a)' }} />}
      {children}
    </section>
  );
}

function bulletClass(tone: Tone) {
  return tone === 'gold' ? 'text-[9.5px] leading-relaxed text-slate-700' : 'text-[9px] leading-snug text-slate-700';
}

export function ExperienceBlock({ cv, tone }: { cv: CvData; tone: Tone }) {
  const items = cv.experiences.filter((e) => e.title.trim() || e.company.trim());
  if (!items.length) return null;
  const ats = tone === 'naje' || tone === 'jadarat';
  return (
    <>
      {items.map((e) => (
        <div key={e.id} className={tone === 'gold' ? 'mb-3' : 'mb-2'}>
          <div className="flex items-baseline justify-between gap-2">
            <p className={`font-black text-slate-900 ${tone === 'gold' ? 'text-[11.5px]' : 'text-[10.5px]'}`}>
              {e.title}
              {e.company ? <span className="font-semibold text-slate-600"> — {e.company}</span> : null}
              {e.employmentType ? <span className="font-normal text-slate-500"> · {employmentLabel(e.employmentType, cv.lang)}</span> : null}
            </p>
            <Ltr
              className="shrink-0 text-[8px] text-slate-500"
              data-cv-scan={e.start ? 'date-ok' : 'date-missing'}
            >
              {rangeLabel(e.start, e.end, e.current, cv.lang)}
            </Ltr>
          </div>
          {e.city ? <p className="text-[8px] text-slate-500">{e.city}</p> : null}
          <div className="mt-0.5 space-y-0.5">
            {bulletsOf(e.bullets).map((b, i) =>
              ats ? (
                <p key={i} className={bulletClass(tone)}>
                  - {b}
                </p>
              ) : (
                <p key={i} className={`flex gap-1.5 ${bulletClass(tone)}`}>
                  <span className="mt-[5px] h-[3.5px] w-[3.5px] shrink-0 rounded-full bg-slate-700" />
                  <span>{b}</span>
                </p>
              )
            )}
          </div>
        </div>
      ))}
    </>
  );
}

export function EducationBlock({ cv, tone }: { cv: CvData; tone: Tone }) {
  const items = cv.education.filter((e) => e.school.trim() || e.field.trim());
  if (!items.length) return null;
  const prominent = tone === 'academic';
  return (
    <>
      {items.map((e) => {
        const gpaOn = Boolean(e.gpa) && e.showGpa !== false;
        return (
          <div key={e.id} className={prominent ? 'mb-2.5' : 'mb-1.5'}>
            <p className={`font-black text-slate-900 ${prominent ? 'text-[11px]' : 'text-[10px]'}`}>
              {DEGREE_LABELS[e.degreeLevel][cv.lang]}
              {e.field ? ` · ${e.field}` : ''}
            </p>
            <p className="text-[9px] text-slate-600">
              {e.school}
              {e.year ? (
                <>
                  {' · '}
                  <Ltr>{e.year}</Ltr>
                </>
              ) : null}
              {e.honors ? ` · ${e.honors}` : ''}
            </p>
            {gpaOn ? (
              <p className={`text-slate-800 ${prominent ? 'text-[9.5px] font-bold' : 'text-[8.5px]'}`}>
                {cv.lang === 'ar' ? 'المعدل' : 'GPA'} {e.gpa}/{e.gpaScale}
              </p>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

export function CoursesBlock({ cv }: { cv: CvData }) {
  const items = cv.courses.filter((c) => c.name.trim());
  if (!items.length) return null;
  return (
    <>
      {items.map((c) => (
        <div key={c.id} className="mb-1.5">
          <p className="text-[10px] font-black text-slate-900">{c.name}</p>
          <p className="text-[8.5px] text-slate-600">
            {[
              c.issuer,
              c.year,
              c.hours && `${c.hours} ${cv.lang === 'ar' ? 'ساعة' : 'hrs'}`,
              c.accredited && ACCREDIT_LABELS[c.accredited as keyof typeof ACCREDIT_LABELS]?.[cv.lang],
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {c.gained ? <p className="text-[8.5px] text-slate-700">{c.gained}</p> : null}
        </div>
      ))}
    </>
  );
}

export function CertsBlock({ cv }: { cv: CvData }) {
  const items = cv.certificates.filter((c) => c.name.trim());
  if (!items.length) return null;
  return (
    <>
      {items.map((c) => (
        <p key={c.id} className="mb-1 text-[9px] text-slate-800">
          <span className="font-black">{c.name}</span>
          {c.issuer ? ` — ${c.issuer}` : ''}
          {c.year ? (
            <>
              {' · '}
              <Ltr>{c.year}</Ltr>
            </>
          ) : null}
          {c.idNumber ? (
            <>
              {' · ID '}
              <Ltr>{c.idNumber}</Ltr>
            </>
          ) : null}
          {c.expires ? (
            <>
              {` · ${cv.lang === 'ar' ? 'تنتهي' : 'exp.'} `}
              <Ltr>{c.expires}</Ltr>
            </>
          ) : null}
        </p>
      ))}
    </>
  );
}

export function ProjectsBlock({ cv }: { cv: CvData }) {
  const items = cv.projects.filter((p) => p.name.trim());
  if (!items.length) return null;
  return (
    <>
      {items.map((p) => (
        <p key={p.id} className="mb-1 text-[9px] text-slate-800">
          <span className="font-black">{p.name}</span>
          {p.role ? ` — ${p.role}` : ''}
          {p.year ? (
            <>
              {' · '}
              <Ltr>{p.year}</Ltr>
            </>
          ) : null}
          {p.detail ? ` · ${p.detail}` : ''}
        </p>
      ))}
    </>
  );
}

export function PublicationsBlock({ cv }: { cv: CvData }) {
  const items = cv.publications.filter((p) => p.title.trim());
  if (!items.length) return null;
  return (
    <>
      {items.map((p, i) => (
        <p key={p.id} className="mb-1 text-[9px] leading-snug text-slate-800">
          {items.length > 1 ? `${i + 1}. ` : null}
          <span className="font-black">{p.title}</span>
          {p.venue ? `. ${p.venue}` : ''}
          {p.year ? (
            <>
              {', '}
              <Ltr>{p.year}</Ltr>
            </>
          ) : null}
          {p.doi ? (
            <>
              {'. DOI '}
              <Ltr>{p.doi}</Ltr>
            </>
          ) : null}
        </p>
      ))}
    </>
  );
}

export function AchievementsBlock({ cv }: { cv: CvData }) {
  const items = cv.achievements.filter((a) => a.title.trim());
  if (!items.length) return null;
  return (
    <>
      {items.map((a) => (
        <p key={a.id} className="mb-1 text-[9px] text-slate-800">
          <span className="font-black">{a.title}</span>
          {a.org ? ` — ${a.org}` : ''}
          {a.year ? (
            <>
              {' · '}
              <Ltr>{a.year}</Ltr>
            </>
          ) : null}
          {a.detail ? ` · ${a.detail}` : ''}
        </p>
      ))}
    </>
  );
}

export function CustomBlocks({ cv, tone }: { cv: CvData; tone: Tone }) {
  const items = cv.customSections.filter((s) => s.title.trim() || s.body.trim());
  if (!items.length) return null;
  const { ar } = copyOf(cv);
  return (
    <>
      {items.map((s) => (
        <Section key={s.id} title={s.title || (ar ? 'قسم إضافي' : 'Additional')} tone={tone} ar={ar}>
          <p className="whitespace-pre-wrap text-[9px] leading-snug text-slate-800">{s.body}</p>
        </Section>
      ))}
    </>
  );
}

export type PersonalRow = [string, string];

export function personalRows(cv: CvData, opts?: { skipGulfTrio?: boolean }): PersonalRow[] {
  const { ar } = copyOf(cv);
  const skip = opts?.skipGulfTrio;
  const rows: PersonalRow[] = [];
  const add = (on: string | boolean | undefined, k: string, v: string) => {
    if (on && v) rows.push([k, v]);
  };
  if (!skip) {
    add(cv.nationality, ar ? 'الجنسية' : 'Nationality', cv.nationality);
    add(cv.visa, ar ? 'الإقامة' : 'Visa', cv.visa);
    add(cv.notice, ar ? 'الإشعار' : 'Notice', cv.notice);
  }
  add(cv.dob, ar ? 'الميلاد' : 'DOB', cv.dob);
  add(cv.age, ar ? 'العمر' : 'Age', cv.age);
  add(
    cv.gender,
    ar ? 'الجنس' : 'Gender',
    cv.gender === 'male' ? (ar ? 'ذكر' : 'Male') : ar ? 'أنثى' : 'Female'
  );
  add(
    cv.marital,
    ar ? 'الحالة' : 'Status',
    cv.marital === 'married' ? (ar ? 'متزوج' : 'Married') : ar ? 'أعزب' : 'Single'
  );
  add(cv.license, ar ? 'الرخصة' : 'Licence', cv.license);
  add(cv.availability, ar ? 'التوفر' : 'Availability', cv.availability);
  return rows;
}

export function PersonalBits({ cv, skipGulfTrio }: { cv: CvData; skipGulfTrio?: boolean }) {
  const rows = personalRows(cv, { skipGulfTrio });
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

export function SkillsLine({ cv }: { cv: CvData }) {
  const items = skillItems(cv);
  if (!items.length) return null;
  return <p className="text-[9px] leading-relaxed text-slate-800">{items.join('  ·  ')}</p>;
}

export function LangsLine({ cv }: { cv: CvData }) {
  const items = cv.languages
    .filter((l) => l.name.trim())
    .map((l) => `${l.name} (${LANG_LEVELS.find((x) => x.id === l.level)?.[cv.lang] || l.level})`);
  if (!items.length) return null;
  return <p className="text-[9px] text-slate-800">{items.join('  ·  ')}</p>;
}

export function GulfMetaRow({ cv }: { cv: CvData }) {
  const { t } = copyOf(cv);
  const cells = [
    cv.nationality && [t.nationality, cv.nationality],
    cv.visa && [t.visa, cv.visa],
    cv.notice && [t.notice, cv.notice],
  ].filter(Boolean) as [string, string][];
  if (!cells.length) return null;
  return (
    <div
      className="mt-3 grid gap-2 border-t pt-2"
      style={{
        gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
        borderColor: 'color-mix(in srgb, var(--cv-accent, #c4a35a) 80%, transparent)',
      }}
    >
      {cells.map(([k, v]) => (
        <div key={k}>
          <p className="text-[7.5px] font-black tracking-[0.14em]" style={{ color: 'var(--cv-accent-ink, #8a6a28)' }}>
            {k}
          </p>
          <p className="text-[9px] font-bold text-slate-800">{v}</p>
        </div>
      ))}
    </div>
  );
}

export function BodySections({
  cv,
  tone,
  hide = [],
}: {
  cv: CvData;
  tone: Tone;
  hide?: string[];
}) {
  const { t, ar } = copyOf(cv);
  const skip = new Set(hide);
  const gulfTrio = tone === 'gulf';
  const nodes: Record<string, React.ReactNode> = {};

  if (cv.summary.trim() && !skip.has('summary')) {
    const first =
      cv.summary
        .trim()
        .split(/\n/)
        .map((s) => s.trim())
        .find(Boolean) || '';
    const summaryScan = !first ? 'summary-empty' : isGenericSummaryLine(first) ? 'summary-generic' : 'summary-ok';
    nodes.summary = (
      <Section key="summary" title={t.summary} tone={tone} ar={ar}>
        <p
          data-cv-scan={summaryScan}
          className={tone === 'gold' ? 'text-[10.5px] leading-relaxed text-slate-800' : 'text-[10px] leading-snug text-slate-800'}
        >
          {cv.summary}
        </p>
      </Section>
    );
  }
  if (cv.showPersonal && !skip.has('personal')) {
    const bits = <PersonalBits cv={cv} skipGulfTrio={gulfTrio} />;
    if (bits) {
      nodes.personal = (
        <Section key="personal" title={t.personal} tone={tone} ar={ar}>
          {bits}
        </Section>
      );
    }
  }
  if (hasExp(cv) && !skip.has('experience')) {
    nodes.experience = (
      <Section key="experience" title={t.experience} tone={tone} ar={ar}>
        <ExperienceBlock cv={cv} tone={tone} />
      </Section>
    );
  }
  if (hasEdu(cv) && !skip.has('education')) {
    nodes.education = (
      <Section key="education" title={t.education} tone={tone} ar={ar}>
        <EducationBlock cv={cv} tone={tone} />
      </Section>
    );
  }
  if (hasSkills(cv) && !skip.has('skills')) {
    nodes.skills = (
      <Section key="skills" title={t.skills} tone={tone} ar={ar}>
        <SkillsLine cv={cv} />
      </Section>
    );
  }
  if (hasCourses(cv) && !skip.has('courses')) {
    nodes.courses = (
      <Section key="courses" title={t.courses} tone={tone} ar={ar}>
        <CoursesBlock cv={cv} />
      </Section>
    );
  }
  if (hasCerts(cv) && !skip.has('certs')) {
    nodes.certs = (
      <Section key="certs" title={t.certs} tone={tone} ar={ar}>
        <CertsBlock cv={cv} />
      </Section>
    );
  }
  if (hasLangs(cv) && !skip.has('langs')) {
    nodes.langs = (
      <Section key="langs" title={t.langs} tone={tone} ar={ar}>
        <LangsLine cv={cv} />
      </Section>
    );
  }
  if (hasProjects(cv) && !skip.has('projects')) {
    nodes.projects = (
      <Section key="projects" title={t.projects} tone={tone} ar={ar}>
        <ProjectsBlock cv={cv} />
      </Section>
    );
  }
  if (hasAch(cv) && !skip.has('achievements')) {
    nodes.achievements = (
      <Section key="achievements" title={t.achievements} tone={tone} ar={ar}>
        <AchievementsBlock cv={cv} />
      </Section>
    );
  }
  if (hasPubs(cv) && !skip.has('publications')) {
    nodes.publications = (
      <Section key="publications" title={t.publications} tone={tone} ar={ar}>
        <PublicationsBlock cv={cv} />
      </Section>
    );
  }
  if (cv.volunteer.trim() && !skip.has('volunteer')) {
    nodes.volunteer = (
      <Section key="volunteer" title={t.volunteer} tone={tone} ar={ar}>
        <p className="text-[9px] leading-snug text-slate-800">{cv.volunteer}</p>
      </Section>
    );
  }
  if (cv.military.trim() && !skip.has('military')) {
    nodes.military = (
      <Section key="military" title={t.military} tone={tone} ar={ar}>
        <p className="text-[9px] leading-snug text-slate-800">{cv.military}</p>
      </Section>
    );
  }
  if (hasCustom(cv) && !skip.has('custom')) {
    nodes.custom = <CustomBlocks key="custom" cv={cv} tone={tone} />;
  }
  if (cv.references.trim() && !skip.has('refs')) {
    nodes.refs = (
      <Section key="refs" title={t.refs} tone={tone} ar={ar}>
        <p className="text-[9px] leading-snug text-slate-800">{cv.references}</p>
      </Section>
    );
  }

  return (
    <>
      {sectionOrder(cv).map((k) => (
        <React.Fragment key={k}>{nodes[k]}</React.Fragment>
      ))}
    </>
  );
}

export function Paper({
  cv,
  children,
  className,
  sheetId = 'naje-cv-sheet',
  padding,
}: {
  cv: CvData;
  children: React.ReactNode;
  className?: string;
  sheetId?: string;
  padding?: string;
}) {
  const { accent, ink } = paperAccentVars(cv);
  return (
    <article
      id={sheetId}
      dir={cv.lang === 'ar' ? 'rtl' : 'ltr'}
      className={`relative bg-white text-slate-900 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)] ${className || ''}`}
      style={
        {
          width: A4_W,
          minHeight: A4_H,
          padding: padding ?? '42px 48px 48px',
          fontFamily: CV_FONT,
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          overflow: 'hidden',
          color: '#0f172a',
          ['--cv-accent']: accent,
          ['--cv-accent-ink']: ink,
        } as React.CSSProperties
      }
    >
      {children}
    </article>
  );
}
