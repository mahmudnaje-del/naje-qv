import React from 'react';
import { CvData } from '../../lib/cvStudio';
import {
  BodySections,
  ContactLine,
  CvPhoto,
  GulfMetaRow,
  Ltr,
  Paper,
  copyOf,
  hasLangs,
  hasSkills,
  personalRows,
  skillItems,
} from './CvPaperStyles';

function NameLine({ cv, className }: { cv: CvData; className?: string }) {
  return (
    <h1 className={className} data-cv-scan={cv.fullName.trim().length >= 3 ? 'name-ok' : 'name-empty'}>
      {cv.fullName || (cv.lang === 'ar' ? 'اسمك الثلاثي' : 'Your full name')}
    </h1>
  );
}

function Headline({ cv, className }: { cv: CvData; className?: string }) {
  if (!cv.headline) return null;
  return (
    <p className={className} data-cv-scan="headline-ok">
      {cv.headline}
    </p>
  );
}

/** Photo locked to the physical right of the sheet; inner copy follows cv.lang. */
function PhotoRightHeader({
  cv,
  photo,
  children,
  className,
  style,
}: {
  cv: CvData;
  photo: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <header className={`flex items-start gap-4 ${className || ''}`} style={{ direction: 'ltr', ...style }}>
      <div className="min-w-0 flex-1" style={{ direction: cv.lang === 'ar' ? 'rtl' : 'ltr' }}>
        {children}
      </div>
      {photo}
    </header>
  );
}

/** ATS / Naje Core — single column, black on white, no chrome, no photo frame. */
function NajeSheet({ cv, sheetId }: { cv: CvData; sheetId?: string }) {
  return (
    <Paper cv={cv} sheetId={sheetId} padding="44px 52px 48px">
      <header className="border-b-[2px] border-black pb-2.5">
        <NameLine cv={cv} className="text-[20px] font-black leading-tight tracking-tight text-black" />
        <Headline cv={cv} className="mt-0.5 text-[11px] font-semibold text-slate-800" />
        <div className="mt-1.5">
          <ContactLine cv={cv} className="text-[8.5px] leading-snug text-slate-700" />
        </div>
      </header>
      <BodySections cv={cv} tone="naje" />
    </Paper>
  );
}

/** Gulf — photo on the physical right, gold hairline, nationality/visa/notice. */
function GulfSheet({ cv, sheetId }: { cv: CvData; sheetId?: string }) {
  return (
    <Paper cv={cv} sheetId={sheetId} padding="38px 44px 44px">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: 'var(--cv-accent, #c4a35a)' }} />
      <PhotoRightHeader cv={cv} photo={<CvPhoto cv={cv} shape="circle" size={92} />} className="border-b pb-3" style={{ borderColor: 'var(--cv-accent, #c4a35a)' }}>
        <NameLine cv={cv} className="text-[22px] font-black leading-tight text-[#1a140c]" />
        <Headline cv={cv} className="mt-0.5 text-[12px] font-bold [color:var(--cv-accent-ink,#8a6a28)]" />
        <div className="mt-1.5">
          <ContactLine cv={cv} className="text-[8.5px] leading-snug text-slate-600" />
        </div>
        <GulfMetaRow cv={cv} />
      </PhotoRightHeader>
      <BodySections cv={cv} tone="gulf" />
    </Paper>
  );
}

/** Jadarat — government form, standard Arabic section names, no decoration. */
function JadaratSheet({ cv, sheetId }: { cv: CvData; sheetId?: string }) {
  const { t, ar } = copyOf(cv);
  const ltrKeys = new Set(['Email', 'البريد', 'Mobile', 'الجوال', 'LinkedIn', 'DOB', 'الميلاد']);
  const rows = (
    [
      [ar ? 'الاسم' : 'Name', cv.fullName],
      [ar ? 'المسمّى' : 'Title', cv.headline],
      [ar ? 'الجوال' : 'Mobile', cv.phone],
      [ar ? 'البريد' : 'Email', cv.email],
      [ar ? 'المدينة' : 'City', [cv.city, cv.country].filter(Boolean).join(ar ? '، ' : ', ')],
      cv.linkedin && [ar ? 'LinkedIn' : 'LinkedIn', cv.linkedin],
      ...(cv.showPersonal ? personalRows(cv) : []),
    ] as ([string, string] | false | '')[]
  ).filter((r): r is [string, string] => Boolean(r && r[1]));

  return (
    <Paper cv={cv} sheetId={sheetId} padding="40px 46px 46px">
      <p className="mb-2 text-center text-[10px] font-bold tracking-[0.18em] text-slate-500">{t.cvTitle}</p>
      <NameLine cv={cv} className="text-center text-[18px] font-black leading-tight text-slate-900" />
      <Headline cv={cv} className="mt-0.5 text-center text-[11px] font-semibold text-slate-700" />

      <section className="mt-4">
        <h3 className="mb-1.5 bg-[#e8eef4] px-2 py-[5px] text-[10.5px] font-bold text-[#1a2a3a]">{t.personal}</h3>
        <div className="grid grid-cols-2 gap-x-4">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-2 border-b border-slate-200 py-[5px] text-[9px]">
              <span className="shrink-0 font-bold text-slate-500">{k}</span>
              <span className="min-w-0 text-slate-800" style={{ overflowWrap: 'anywhere' }}>
                {ltrKeys.has(k) ? <Ltr>{v}</Ltr> : v}
              </span>
            </div>
          ))}
        </div>
      </section>

      <BodySections cv={cv} tone="jadarat" hide={['personal']} />
    </Paper>
  );
}

/** Executive gold — air, thin gold rules, large name, optional circle photo. */
function GoldSheet({ cv, sheetId }: { cv: CvData; sheetId?: string }) {
  return (
    <Paper cv={cv} sheetId={sheetId} padding="56px 58px 52px">
      <PhotoRightHeader cv={cv} photo={<CvPhoto cv={cv} shape="circle" size={80} />}>
        <NameLine cv={cv} className="text-[28px] font-black leading-[1.15] tracking-tight text-[#1a140c]" />
        <div className="mt-2.5 flex items-center gap-2">
          <span className="h-px w-10" style={{ backgroundColor: 'var(--cv-accent, #c4a35a)' }} />
          <span className="h-px flex-1" style={{ backgroundColor: 'color-mix(in srgb, var(--cv-accent, #c4a35a) 35%, transparent)' }} />
        </div>
        <Headline cv={cv} className="mt-2 text-[12px] font-bold tracking-[0.08em] [color:var(--cv-accent-ink,#8a6a28)]" />
        <div className="mt-2">
          <ContactLine cv={cv} className="text-[8.5px] leading-relaxed text-slate-500" />
        </div>
      </PhotoRightHeader>
      <BodySections cv={cv} tone="gold" />
    </Paper>
  );
}

/** Modern sidebar — beautiful for humans; contact duplicated in the main column. */
function ModernSheet({ cv, sheetId }: { cv: CvData; sheetId?: string }) {
  const { t } = copyOf(cv);
  const skills = skillItems(cv);
  const langs = cv.languages.filter((l) => l.name.trim());
  const sidePersonal = personalRows(cv).slice(0, 6);

  return (
    <Paper cv={cv} sheetId={sheetId} padding="0">
      <div className="flex min-h-[1123px]">
        <aside
          className="w-[228px] shrink-0 self-stretch px-5 py-8"
          style={{ backgroundColor: '#0c1929', color: '#f3ead8' }}
        >
          {cv.showPhoto && cv.photo ? (
            <img
              src={cv.photo}
              alt=""
              style={{
                width: '100%',
                height: 188,
                objectFit: 'cover',
                objectPosition: 'center 18%',
                borderRadius: 0,
                border: '1px solid #1b2838',
                display: 'block',
                marginBottom: 16,
                backgroundColor: '#1b2838',
              }}
            />
          ) : null}
          <h1 className="text-[17px] font-black leading-tight text-[#f3ead8]" data-cv-scan={cv.fullName.trim().length >= 3 ? 'name-ok' : 'name-empty'}>
            {cv.fullName || '—'}
          </h1>
          {cv.headline ? (
            <p className="mt-1 text-[10px] font-bold" style={{ color: 'var(--cv-accent, #c4a35a)' }} data-cv-scan="headline-ok">
              {cv.headline}
            </p>
          ) : null}

          <div className="mt-5 space-y-1 text-[8px] leading-relaxed text-white/70" style={{ overflowWrap: 'anywhere' }}>
            {cv.phone ? (
              <p>
                <Ltr>{cv.phone}</Ltr>
              </p>
            ) : null}
            {cv.email ? (
              <p>
                <Ltr>{cv.email}</Ltr>
              </p>
            ) : null}
            {(cv.city || cv.country) && <p>{[cv.city, cv.country].filter(Boolean).join(cv.lang === 'ar' ? '، ' : ', ')}</p>}
            {cv.linkedin ? (
              <p>
                <Ltr>{cv.linkedin}</Ltr>
              </p>
            ) : null}
            {cv.portfolio ? (
              <p>
                <Ltr>{cv.portfolio}</Ltr>
              </p>
            ) : null}
          </div>

          {cv.showPersonal && sidePersonal.length > 0 ? (
            <div className="mt-5">
              <p className="mb-1.5 text-[8px] font-black tracking-[0.16em]" style={{ color: 'var(--cv-accent, #c4a35a)' }}>
                {t.personal}
              </p>
              <div className="space-y-1 text-[8px] text-white/75">
                {sidePersonal.map(([k, v]) => (
                  <p key={k}>
                    <span className="text-white/45">{k} · </span>
                    {v}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {hasSkills(cv) ? (
            <div className="mt-5">
              <p className="mb-1.5 text-[8px] font-black tracking-[0.16em]" style={{ color: 'var(--cv-accent, #c4a35a)' }}>
                {t.skills}
              </p>
              <div className="flex flex-col gap-1 text-[8px] leading-snug text-white/80">
                {skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>
          ) : null}

          {hasLangs(cv) ? (
            <div className="mt-5">
              <p className="mb-1.5 text-[8px] font-black tracking-[0.16em]" style={{ color: 'var(--cv-accent, #c4a35a)' }}>
                {t.langs}
              </p>
              <p className="text-[8px] leading-relaxed text-white/80">{langs.map((l) => l.name).join('  ·  ')}</p>
            </div>
          ) : null}
        </aside>

        <div className="min-w-0 flex-1 px-7 py-8">
          <ContactLine cv={cv} className="mb-3 text-[8px] leading-snug text-slate-500" />
          <BodySections cv={cv} tone="modern" hide={['skills', 'langs', 'personal']} />
        </div>
      </div>
    </Paper>
  );
}

/** Academic — education, GPA, publications first; scholarly. */
function AcademicSheet({ cv, sheetId }: { cv: CvData; sheetId?: string }) {
  const { t, ar } = copyOf(cv);
  const extras = cv.showPersonal ? personalRows(cv) : [];
  return (
    <Paper cv={cv} sheetId={sheetId} padding="48px 56px 50px">
      <header className="mb-1 border-b border-slate-800 pb-3 text-center">
        <p className="mb-1.5 text-[8px] font-bold tracking-[0.22em] text-slate-500">{t.cvTitle}</p>
        <NameLine cv={cv} className="text-[22px] font-black leading-tight text-slate-900" />
        <Headline cv={cv} className="mt-1 text-[11px] font-medium text-slate-600" />
        <div className="mx-auto mt-2 max-w-[520px]">
          <ContactLine cv={cv} className="text-[8.5px] leading-snug text-slate-600" />
        </div>
        {cv.showPhoto && cv.photo ? (
          <div className="mt-3 flex justify-center">
            <CvPhoto cv={cv} shape="plain" size={64} height={80} />
          </div>
        ) : null}
      </header>
      <BodySections cv={cv} tone="academic" hide={['personal']} />
      {extras.length ? (
        <section className="mt-4">
          <h3
            className={`mb-1.5 border-b border-slate-800 pb-[3px] text-[10px] font-bold tracking-[0.12em] text-slate-900 ${
              ar ? '' : 'uppercase'
            }`}
          >
            {t.personal}
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[8.5px] text-slate-700">
            {extras.map(([k, v]) => (
              <p key={k}>
                <span className="font-bold text-slate-500">{k}: </span>
                {v}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </Paper>
  );
}

export function CvPreview({ cv, sheetId }: { cv: CvData; sheetId?: string }) {
  switch (cv.template) {
    case 'gulf':
      return <GulfSheet cv={cv} sheetId={sheetId} />;
    case 'jadarat':
      return <JadaratSheet cv={cv} sheetId={sheetId} />;
    case 'gold':
      return <GoldSheet cv={cv} sheetId={sheetId} />;
    case 'modern':
      return <ModernSheet cv={cv} sheetId={sheetId} />;
    case 'academic':
      return <AcademicSheet cv={cv} sheetId={sheetId} />;
    default:
      return <NajeSheet cv={cv} sheetId={sheetId} />;
  }
}

export default CvPreview;
