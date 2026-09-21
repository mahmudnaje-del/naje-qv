import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  Download,
  FileText,
  GraduationCap,
  Languages,
  Plus,
  Sparkles,
  Target,
  Trash2,
  User,
} from 'lucide-react';
import { auth } from '../firebase';
import { toast } from '../toastStore';
import { useSmartDownloadStore } from '../stores/smartDownloadStore';
import StudioBootSplash from '../components/StudioBootSplash';
import NajeThinking from '../components/NajeThinking';
import { PhotoBooth } from '../components/najeCv/PhotoBooth';
import { CvPreview } from '../components/najeCv/CvPreview';
import { exportCvDocx, exportCvPdf, fileBase } from '../lib/cvExport';
import {
  ACCREDIT_LABELS,
  CV_STORAGE_KEY,
  CvCourse,
  CvData,
  CvEducation,
  CvExperience,
  DEGREE_LABELS,
  DegreeLevel,
  GENDER_OPTS,
  LANG_LEVELS,
  MARITAL_OPTS,
  MARKETS,
  TEMPLATES,
  applyMarketDefaults,
  emptyCertificate,
  emptyCourse,
  emptyCv,
  emptyEducation,
  emptyExperience,
  emptyLanguage,
  emptyProject,
  scoreCv,
} from '../lib/cvStudio';

type Tab = 'build' | 'preview' | 'coach';

async function askNaje(prompt: string): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('يلزم تسجيل الدخول');
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type: 'text', prompt, history: [] }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(raw.slice(0, 160) || 'تعذر التواصل مع ناجي');
  if (raw.includes('data:')) {
    let acc = '';
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const payload = t.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const j = JSON.parse(payload);
        if (typeof j.replaceContent === 'string') acc = j.replaceContent;
        else if (typeof j.text === 'string') acc += j.text;
      } catch {
        acc += payload;
      }
    }
    if (acc.trim()) return acc.trim();
  }
  try {
    const j = JSON.parse(raw);
    return String(j.text || j.content || raw);
  } catch {
    return raw;
  }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-right">
      <span className="mb-1 block text-[11px] font-black text-[#f3ead8]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] leading-relaxed text-white/40">{hint}</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#c4a35a] focus:outline-none';

function Box({
  icon,
  title,
  hint,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="inline-flex items-center gap-2 text-sm font-black text-white">
            {icon}
            {title}
          </h3>
          {hint && <p className="mt-1 text-[10px] leading-relaxed text-white/40">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function NajeCv() {
  const [cv, setCv] = useState<CvData>(() => {
    try {
      const raw = localStorage.getItem(CV_STORAGE_KEY);
      if (raw) return { ...emptyCv(), ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return emptyCv();
  });
  const [tab, setTab] = useState<Tab>('build');
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(cv));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [cv]);

  const patch = (partial: Partial<CvData>) => setCv((p) => ({ ...p, ...partial }));
  const { score, tips } = useMemo(() => scoreCv(cv), [cv]);

  const polish = async (kind: 'summary' | 'exp', id?: string) => {
    setAiBusy(kind + (id || ''));
    try {
      if (kind === 'summary') {
        const raw = await askNaje(
          `أنت محرر سير ذاتية للخليج والعربية. أعد صياغة الملخص التالي في 3 أسطر عربية قوية: مسمّى واضح + رقم واحد على الأقل + بدون كليشيهات (محترف، شغوف، ديناميكي). أرجع النص فقط.\nالاسم: ${cv.fullName}\nالمسمّى: ${cv.headline}\nالوظيفة المستهدفة: ${cv.targetRole}\nالملخص الحالي:\n${cv.summary || 'لا يوجد'}`
        );
        patch({ summary: raw.replace(/^["«]|["»]$/g, '').trim() });
      } else if (id) {
        const exp = cv.experiences.find((e) => e.id === id);
        if (!exp) return;
        const raw = await askNaje(
          `حوّل مهام هذه الوظيفة إلى 3–5 نقاط سيرة عربية: فعل قوي + ماذا + رقم إن وُجد. سطر لكل نقطة. بدون مقدمات.\nالمسمّى: ${exp.title}\nالجهة: ${exp.company}\nالنص:\n${exp.bullets || exp.title}`
        );
        setCv((p) => ({
          ...p,
          experiences: p.experiences.map((e) => (e.id === id ? { ...e, bullets: raw.trim() } : e)),
        }));
      }
      toast.success('ناجي صاغ النص');
    } catch (e: any) {
      toast.error(e?.message || 'تعذر الصياغة');
    } finally {
      setAiBusy(null);
    }
  };

  const doExport = async (kind: 'pdf' | 'docx') => {
    if (!cv.fullName.trim()) {
      toast.error('اكتب اسمك أولاً — هذا أول سطر يراه الـHR');
      return;
    }
    setExporting(kind);
    try {
      const base = fileBase(cv);
      if (kind === 'pdf') {
        const sheet = document.getElementById('naje-cv-sheet');
        if (!sheet) throw new Error('المعاينة غير جاهزة');
        const blob = await exportCvPdf(sheet as HTMLElement, cv);
        useSmartDownloadStore.getState().triggerDownload({
          data: blob,
          mimeType: 'application/pdf',
          ext: 'pdf',
          title: base,
          suggestedName: base,
          skipModal: true,
        });
      } else {
        const blob = await exportCvDocx(cv);
        useSmartDownloadStore.getState().triggerDownload({
          data: blob,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ext: 'docx',
          title: base,
          suggestedName: base,
          skipModal: true,
        });
      }
    } catch (e: any) {
      toast.error(e?.message || 'فشل التصدير');
    } finally {
      setExporting(null);
    }
  };

  const scoreColor = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-[#e8c36a]' : 'text-rose-300';
  const showPhotoBooth =
    cv.market === 'gulf' || cv.market === 'creative' || cv.template === 'gulf' || cv.template === 'gold' || cv.template === 'modern';

  return (
    <div className="naje-cv-studio relative h-full overflow-y-auto bg-[#0b1220] px-2.5 pb-10 pt-2 text-[#f3ead8] sm:px-6" dir="rtl">
      <StudioBootSplash dark />
      <div className="mx-auto max-w-7xl space-y-3">
        <header className="sticky top-0 z-20 rounded-2xl border border-[#c4a35a]/20 bg-[radial-gradient(900px_circle_at_100%_-30%,rgba(196,163,90,0.18),transparent_50%),linear-gradient(180deg,#121a2b,#0b1220)] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-[#c4a35a]/35 bg-[#c4a35a]/10 px-2.5 py-0.5 text-[10px] font-black tracking-[0.16em] text-[#e8c36a]">
                <FileText className="h-3.5 w-3.5" /> CV BY NAJE
              </div>
              <h1 className="text-xl font-black leading-snug text-white sm:text-2xl">سيرتك الذاتية بواسطة ناجي</h1>
              <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-white/50 sm:text-xs">
                الـHR يعطيك 6 ثوانٍ. 80٪ منها تذهب للاسم والمسمّى والتواريخ والتعليم. نبني أول سطرين كي لا تُرمى السيرة قبل أن تُقرأ.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-center">
                <div className="text-[10px] text-white/40">جاهزية المسح</div>
                <div className={`font-mono text-2xl font-black ${scoreColor}`}>{score}</div>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => doExport('pdf')}
                  disabled={!!exporting}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#c4a35a] px-3 py-2 text-[11px] font-black text-[#1a140c]"
                >
                  {exporting === 'pdf' ? <NajeThinking size={16} /> : <Download className="h-3.5 w-3.5" />}
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => doExport('docx')}
                  disabled={!!exporting}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#c4a35a]/40 px-3 py-2 text-[11px] font-black text-[#e8c36a]"
                >
                  {exporting === 'docx' ? <NajeThinking size={16} /> : <FileText className="h-3.5 w-3.5" />}
                  Word
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-black/30 p-1 sm:hidden">
          {(
            [
              ['build', 'البناء'],
              ['preview', 'المعاينة'],
              ['coach', 'مدرب HR'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-xl py-2 text-[11px] font-black ${tab === id ? 'bg-[#c4a35a] text-[#1a140c]' : 'text-white/60'} ${
                id === 'coach' ? 'col-span-2' : ''
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className={`space-y-3 ${tab !== 'build' ? 'hidden lg:block' : ''}`}>
            <Box icon={<Target className="h-4 w-4 text-[#c4a35a]" />} title="سوق التقديم" hint="سيرة واحدة لا تصلح لكل الأسواق. الخليج يريد صورة وجنسية. ATS العالمي يرميهما. جدارات يريد نصاً حقيقياً.">
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {MARKETS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCv((p) => applyMarketDefaults(p, m.id))}
                    className={`rounded-xl border px-2 py-2 text-right ${cv.market === m.id ? 'border-[#c4a35a] bg-[#c4a35a]/15' : 'border-white/10 bg-black/25'}`}
                  >
                    <span className="block text-[11px] font-black text-white">{m.ar}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-white/40">{MARKETS.find((m) => m.id === cv.market)?.hint}</p>
              <div className="mt-3 flex gap-1.5">
                {(['ar', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => patch({ lang: l })}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-black ${cv.lang === l ? 'bg-[#c4a35a] text-[#1a140c]' : 'border border-white/10 text-white/60'}`}
                  >
                    {l === 'ar' ? 'العربية' : 'English'}
                  </button>
                ))}
              </div>
            </Box>

            <Box icon={<Sparkles className="h-4 w-4 text-[#c4a35a]" />} title="قالب التصميم" hint="للآلة: نواة أو جدارات. للإنسان في الخليج: الخليج أو الذهبي.">
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => patch({ template: t.id, showPhoto: t.id === 'naje' || t.id === 'jadarat' ? false : cv.showPhoto })}
                    className={`rounded-xl border p-2 text-right ${cv.template === t.id ? 'border-[#c4a35a] bg-[#c4a35a]/15' : 'border-white/10'}`}
                  >
                    <span className="block text-[11px] font-black text-white">{t.ar}</span>
                    <span className="mt-0.5 block text-[9px] text-white/40">{t.hint}</span>
                  </button>
                ))}
              </div>
            </Box>

            <Box icon={<User className="h-4 w-4 text-[#c4a35a]" />} title="الهوية — أول سطرين">
              <div className="space-y-3">
                {showPhotoBooth && (
                  <PhotoBooth photo={cv.photo} enhanced={cv.photoEnhanced} onChange={(photo, photoEnhanced) => patch({ photo, photoEnhanced, showPhoto: Boolean(photo) })} />
                )}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Field label="الاسم الكامل" hint="كما في الهوية. هذا أول ما يثبّت العين.">
                    <input className={inputCls} value={cv.fullName} onChange={(e) => patch({ fullName: e.target.value })} placeholder="مثال: ميسرة ناجي" />
                  </Field>
                  <Field label="المسمّى الذي تريد أن تُصنَّف تحته" hint="لا تكتب «باحث عن عمل». اكتب الدور.">
                    <input className={inputCls} value={cv.headline} onChange={(e) => patch({ headline: e.target.value })} placeholder="مثال: أخصائي موارد بشرية" />
                  </Field>
                </div>
                <Field label="ملخص مهني — 3 أسطر توقف المسح" hint="رقم واحد على الأقل. بلا «شغوف / محترف / ديناميكي».">
                  <textarea rows={3} className={inputCls} value={cv.summary} onChange={(e) => patch({ summary: e.target.value })} placeholder="مثال: محاسب تكاليف بخبرة 6 سنوات، خفّض هدر المواد 14٪..." />
                </Field>
                <button type="button" disabled={!!aiBusy} onClick={() => polish('summary')} className="inline-flex items-center gap-1 rounded-xl border border-[#c4a35a]/40 px-3 py-1.5 text-[11px] font-black text-[#e8c36a]">
                  {aiBusy === 'summary' ? <NajeThinking size={16} /> : <Sparkles className="h-3.5 w-3.5" />}
                  ناجي يصوغ الملخص
                </button>
              </div>
            </Box>

            <Box icon={<User className="h-4 w-4 text-[#c4a35a]" />} title="التواصل">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Field label="البريد">
                  <input className={inputCls} value={cv.email} onChange={(e) => patch({ email: e.target.value })} placeholder="name@email.com" dir="ltr" />
                </Field>
                <Field label="الهاتف مع مفتاح الدولة">
                  <input className={inputCls} value={cv.phone} onChange={(e) => patch({ phone: e.target.value })} placeholder="+970..." dir="ltr" />
                </Field>
                <Field label="المدينة">
                  <input className={inputCls} value={cv.city} onChange={(e) => patch({ city: e.target.value })} />
                </Field>
                <Field label="الدولة">
                  <input className={inputCls} value={cv.country} onChange={(e) => patch({ country: e.target.value })} />
                </Field>
                <Field label="LinkedIn">
                  <input className={inputCls} value={cv.linkedin} onChange={(e) => patch({ linkedin: e.target.value })} dir="ltr" />
                </Field>
                <Field label="معرض أعمال / موقع">
                  <input className={inputCls} value={cv.portfolio} onChange={(e) => patch({ portfolio: e.target.value })} dir="ltr" />
                </Field>
              </div>
            </Box>

            <Box
              icon={<User className="h-4 w-4 text-[#c4a35a]" />}
              title="بيانات السوق المحلي"
              hint="في الخليج تُطلب. في الشركات العالمية وجدارات احذف العمر والصورة والحالة الاجتماعية."
              action={
                <button type="button" onClick={() => patch({ showPersonal: !cv.showPersonal })} className="text-[10px] font-black text-[#e8c36a]">
                  {cv.showPersonal ? 'إخفاء من السيرة' : 'إظهار في السيرة'}
                </button>
              }
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Field label="العمر" hint="اختياري. كثير من المسؤلين يتجاوزونه إن وُجد المسمّى.">
                  <input className={inputCls} value={cv.age} onChange={(e) => patch({ age: e.target.value })} placeholder="28" />
                </Field>
                <Field label="تاريخ الميلاد">
                  <input className={inputCls} value={cv.dob} onChange={(e) => patch({ dob: e.target.value })} placeholder="1998-04-12" />
                </Field>
                <Field label="الجنس" hint="غالباً يكفي الاسم.">
                  <select className={inputCls} value={cv.gender} onChange={(e) => patch({ gender: e.target.value })}>
                    {GENDER_OPTS.map((o) => (
                      <option key={o.id} value={o.id}>{o.ar}</option>
                    ))}
                  </select>
                </Field>
                <Field label="الحالة الاجتماعية">
                  <select className={inputCls} value={cv.marital} onChange={(e) => patch({ marital: e.target.value })}>
                    {MARITAL_OPTS.map((o) => (
                      <option key={o.id} value={o.id}>{o.ar}</option>
                    ))}
                  </select>
                </Field>
                <Field label="الجنسية">
                  <input className={inputCls} value={cv.nationality} onChange={(e) => patch({ nationality: e.target.value })} />
                </Field>
                <Field label="حالة الإقامة / التأشيرة" hint="سارية وقابلة للتحويل؟ زيارة؟ خارج الدولة؟">
                  <input className={inputCls} value={cv.visa} onChange={(e) => patch({ visa: e.target.value })} placeholder="إقامة عمل قابلة للتحويل" />
                </Field>
                <Field label="فترة الإشعار">
                  <input className={inputCls} value={cv.notice} onChange={(e) => patch({ notice: e.target.value })} placeholder="فوري / 30 يوماً" />
                </Field>
                <Field label="رخصة القيادة">
                  <input className={inputCls} value={cv.license} onChange={(e) => patch({ license: e.target.value })} />
                </Field>
              </div>
            </Box>

            <Box
              icon={<Briefcase className="h-4 w-4 text-[#c4a35a]" />}
              title="الخبرات — الأحدث أولاً"
              hint="كل نقطة: فعل + ماذا فعلت + رقم."
              action={
                <button type="button" onClick={() => patch({ experiences: [...cv.experiences, emptyExperience()] })} className="inline-flex items-center gap-1 rounded-xl border border-[#c4a35a]/40 px-2 py-1 text-[10px] font-black text-[#e8c36a]">
                  <Plus className="h-3 w-3" /> إضافة خبرة
                </button>
              }
            >
              <div className="space-y-3">
                {cv.experiences.map((e, idx) => (
                  <ExperienceEditor
                    key={e.id}
                    item={e}
                    busy={aiBusy === 'exp' + e.id}
                    onChange={(next) => setCv((p) => ({ ...p, experiences: p.experiences.map((x) => (x.id === e.id ? next : x)) }))}
                    onRemove={() => setCv((p) => ({ ...p, experiences: p.experiences.filter((x) => x.id !== e.id) }))}
                    onPolish={() => polish('exp', e.id)}
                    index={idx}
                  />
                ))}
              </div>
            </Box>

            <Box
              icon={<GraduationCap className="h-4 w-4 text-[#c4a35a]" />}
              title="الشهادات الأكاديمية"
              hint="المستوى الجامعي، التخصص، الجهة، سنة التخرج، المعدل."
              action={
                <button type="button" onClick={() => patch({ education: [...cv.education, emptyEducation()] })} className="inline-flex items-center gap-1 rounded-xl border border-[#c4a35a]/40 px-2 py-1 text-[10px] font-black text-[#e8c36a]">
                  <Plus className="h-3 w-3" /> إضافة مؤهل
                </button>
              }
            >
              <div className="space-y-3">
                {cv.education.map((e) => (
                  <EducationEditor
                    key={e.id}
                    item={e}
                    onChange={(next) => setCv((p) => ({ ...p, education: p.education.map((x) => (x.id === e.id ? next : x)) }))}
                    onRemove={() => setCv((p) => ({ ...p, education: p.education.filter((x) => x.id !== e.id) }))}
                  />
                ))}
              </div>
            </Box>

            <Box
              icon={<Award className="h-4 w-4 text-[#c4a35a]" />}
              title="الدورات التدريبية"
              hint="هل معتمدة؟ من الجهة؟ ماذا صرت تُتقن بعدها؟"
              action={
                <button type="button" onClick={() => patch({ courses: [...cv.courses, emptyCourse()] })} className="inline-flex items-center gap-1 rounded-xl border border-[#c4a35a]/40 px-2 py-1 text-[10px] font-black text-[#e8c36a]">
                  <Plus className="h-3 w-3" /> إضافة دورة
                </button>
              }
            >
              {cv.courses.length === 0 && <p className="text-[11px] text-white/35">لا دورات بعد — أضف ما يخدم الوظيفة المستهدفة فقط.</p>}
              <div className="space-y-3">
                {cv.courses.map((c) => (
                  <CourseEditor
                    key={c.id}
                    item={c}
                    onChange={(next) => setCv((p) => ({ ...p, courses: p.courses.map((x) => (x.id === c.id ? next : x)) }))}
                    onRemove={() => setCv((p) => ({ ...p, courses: p.courses.filter((x) => x.id !== c.id) }))}
                  />
                ))}
              </div>
            </Box>

            <Box
              icon={<Award className="h-4 w-4 text-[#c4a35a]" />}
              title="شهادات مهنية / رخص"
              action={
                <button type="button" onClick={() => patch({ certificates: [...cv.certificates, emptyCertificate()] })} className="inline-flex items-center gap-1 rounded-xl border border-[#c4a35a]/40 px-2 py-1 text-[10px] font-black text-[#e8c36a]">
                  <Plus className="h-3 w-3" /> إضافة شهادة
                </button>
              }
            >
              <div className="space-y-2">
                {cv.certificates.map((c) => (
                  <div key={c.id} className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 p-2">
                    <input className={inputCls} placeholder="اسم الشهادة" value={c.name} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)) }))} />
                    <input className={inputCls} placeholder="الجهة المانحة" value={c.issuer} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, issuer: e.target.value } : x)) }))} />
                    <input className={inputCls} placeholder="السنة" value={c.year} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, year: e.target.value } : x)) }))} />
                    <input className={inputCls} placeholder="رقم الشهادة" value={c.idNumber} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, idNumber: e.target.value } : x)) }))} />
                    <input className={`${inputCls} col-span-2`} placeholder="تاريخ الانتهاء إن وُجد" value={c.expires} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, expires: e.target.value } : x)) }))} />
                    <button type="button" onClick={() => setCv((p) => ({ ...p, certificates: p.certificates.filter((x) => x.id !== c.id) }))} className="col-span-2 text-[10px] text-rose-300">حذف</button>
                  </div>
                ))}
              </div>
            </Box>

            <Box icon={<Sparkles className="h-4 w-4 text-[#c4a35a]" />} title="المهارات">
              <Field label="مهارات مفصولة بفاصلة" hint="انقل كلمات الإعلان بصدق.">
                <textarea rows={2} className={inputCls} value={cv.skills} onChange={(e) => patch({ skills: e.target.value })} placeholder="Excel، SAP، تفاوض..." />
              </Field>
            </Box>

            <Box
              icon={<Languages className="h-4 w-4 text-[#c4a35a]" />}
              title="اللغات"
              action={
                <button type="button" onClick={() => patch({ languages: [...cv.languages, emptyLanguage()] })} className="text-[10px] font-black text-[#e8c36a]">+ لغة</button>
              }
            >
              <div className="space-y-2">
                {cv.languages.map((l) => (
                  <div key={l.id} className="flex gap-2">
                    <input className={inputCls} placeholder="اللغة" value={l.name} onChange={(e) => setCv((p) => ({ ...p, languages: p.languages.map((x) => (x.id === l.id ? { ...x, name: e.target.value } : x)) }))} />
                    <select className={inputCls} value={l.level} onChange={(e) => setCv((p) => ({ ...p, languages: p.languages.map((x) => (x.id === l.id ? { ...x, level: e.target.value } : x)) }))}>
                      {LANG_LEVELS.map((o) => (
                        <option key={o.id} value={o.id}>{o.ar}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </Box>

            <Box
              icon={<Briefcase className="h-4 w-4 text-[#c4a35a]" />}
              title="مشاريع"
              action={
                <button type="button" onClick={() => patch({ projects: [...cv.projects, emptyProject()] })} className="text-[10px] font-black text-[#e8c36a]">+ مشروع</button>
              }
            >
              {cv.projects.map((p) => (
                <div key={p.id} className="mb-2 grid grid-cols-2 gap-2">
                  <input className={inputCls} placeholder="اسم المشروع" value={p.name} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)) }))} />
                  <input className={inputCls} placeholder="دورك" value={p.role} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, role: e.target.value } : x)) }))} />
                  <input className={inputCls} placeholder="السنة" value={p.year} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, year: e.target.value } : x)) }))} />
                  <input className={inputCls} placeholder="ماذا أنجزت" value={p.detail} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, detail: e.target.value } : x)) }))} />
                </div>
              ))}
            </Box>

            <Box icon={<FileText className="h-4 w-4 text-[#c4a35a]" />} title="صناديق إضافية">
              <div className="space-y-2">
                <Field label="الخدمة الوطنية / العسكرية">
                  <input className={inputCls} value={cv.military} onChange={(e) => patch({ military: e.target.value })} />
                </Field>
                <Field label="التطوع">
                  <textarea rows={2} className={inputCls} value={cv.volunteer} onChange={(e) => patch({ volunteer: e.target.value })} />
                </Field>
                <Field label="المراجع" hint="«متوفرة عند الطلب» تكفي ما لم يُطلب غير ذلك.">
                  <input className={inputCls} value={cv.references} onChange={(e) => patch({ references: e.target.value })} placeholder="متوفرة عند الطلب" />
                </Field>
                <Field label="الوظيفة المستهدفة">
                  <input className={inputCls} value={cv.targetRole} onChange={(e) => patch({ targetRole: e.target.value })} />
                </Field>
                <Field label="الصق إعلان الوظيفة" hint="ناجي يقيس تطابق كلماتك مع ما يطلبه الـHR. لا يخترع خبرة.">
                  <textarea rows={4} className={inputCls} value={cv.jobPosting} onChange={(e) => patch({ jobPosting: e.target.value })} placeholder="الصق نص الإعلان هنا…" />
                </Field>
              </div>
            </Box>
          </div>

          <div className={`space-y-3 ${tab === 'build' ? 'hidden lg:block' : ''}`}>
            <div className={`${tab === 'coach' ? 'block' : 'hidden lg:block'} rounded-2xl border border-[#c4a35a]/25 bg-[#c4a35a]/8 p-3`}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-black text-white">مدرب الـHR</h3>
                <span className={`font-mono text-lg font-black ${scoreColor}`}>{score}/100</span>
              </div>
              <p className="mb-2 text-[10px] leading-relaxed text-white/45">
                ما يرمي السيرة من أول سطرين: مسمّى غائب، لا رقم، عنوان وظيفي مموّه، صورة سيلفي، أو قالب عمودين يكسّر ATS.
              </p>
              <ul className="space-y-2">
                {tips.map((tip) => (
                  <li
                    key={tip.id}
                    className={`rounded-xl border p-2.5 ${
                      tip.level === 'stop'
                        ? 'border-rose-400/30 bg-rose-500/10'
                        : tip.level === 'ok'
                        ? 'border-emerald-400/30 bg-emerald-500/10'
                        : 'border-amber-400/25 bg-amber-500/10'
                    }`}
                  >
                    <p className="text-[11px] font-black text-white">{tip.title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-white/65">{tip.body}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${tab === 'preview' || tab === 'build' ? 'block' : 'hidden lg:block'} overflow-hidden rounded-2xl border border-white/10 bg-[#070b14] p-2`}>
              <p className="mb-2 px-1 text-[10px] font-black tracking-wide text-white/40">معاينة A4 — كما سيُصدَّر</p>
              <div className="mx-auto overflow-hidden" style={{ maxWidth: 794 }}>
                <div
                  style={{
                    width: 794,
                    transform: 'scale(0.46)',
                    transformOrigin: 'top center',
                    marginBottom: -(1123 * 0.54),
                  }}
                >
                  <CvPreview cv={cv} sheetId="naje-cv-preview" />
                </div>
              </div>
            </div>
            <div className="pointer-events-none fixed -left-[2400px] top-0" aria-hidden>
              <CvPreview cv={cv} sheetId="naje-cv-sheet" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExperienceEditor({
  item,
  onChange,
  onRemove,
  onPolish,
  busy,
  index,
}: {
  item: CvExperience;
  onChange: (e: CvExperience) => void;
  onRemove: () => void;
  onPolish: () => void;
  busy: boolean;
  index: number;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-white/10 p-2.5">
      <div className="flex items-center justify-between text-[10px] font-black text-[#e8c36a]">
        <span>خبرة {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-white/35">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className={inputCls} placeholder="المسمّى" value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
        <input className={inputCls} placeholder="الجهة" value={item.company} onChange={(e) => onChange({ ...item, company: e.target.value })} />
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

function EducationEditor({
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
            <option key={k} value={k}>{DEGREE_LABELS[k].ar}</option>
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
        <input className={`${inputCls} col-span-2`} placeholder="مرتبة شرف / ملاحظة" value={item.honors} onChange={(e) => onChange({ ...item, honors: e.target.value })} />
      </div>
    </div>
  );
}

function CourseEditor({
  item,
  onChange,
  onRemove,
}: {
  item: CvCourse;
  onChange: (e: CvCourse) => void;
  onRemove: () => void;
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
      </div>
      <textarea rows={2} className={inputCls} placeholder="ماذا استفدت؟ مهارة أصبحت تستخدمها في العمل..." value={item.gained} onChange={(e) => onChange({ ...item, gained: e.target.value })} />
    </div>
  );
}
