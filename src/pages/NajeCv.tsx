import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  ChevronDown,
  Download,
  FileText,
  GraduationCap,
  Languages,
  MessageCircle,
  Plus,
  Sparkles,
  Target,
  Upload,
  User,
} from 'lucide-react';
import { toast } from '../toastStore';
import { useAppStore } from '../store';
import { useSmartDownloadStore } from '../stores/smartDownloadStore';
import StudioBootSplash from '../components/StudioBootSplash';
import NajeThinking from '../components/NajeThinking';
import { PhotoBooth } from '../components/najeCv/PhotoBooth';
import { CvPreview } from '../components/najeCv/CvPreview';
import { CvHero, CvOnboard } from '../components/najeCv/CvHero';
import { CvInterview } from '../components/najeCv/CvInterview';
import { CvImport } from '../components/najeCv/CvImport';
import { CvJobMatch } from '../components/najeCv/CvJobMatch';
import { CvCoachPanel } from '../components/najeCv/CvCoachPanel';
import { CareerBreakHint, CourseEditor, EducationEditor, ExperienceEditor } from '../components/najeCv/CvEditors';
import { CvStudioRail } from '../components/najeCv/CvStudioRail';
import { CvSkillsStudio } from '../components/najeCv/CvSkillsStudio';
import { CvScanOverlay } from '../components/najeCv/CvScanOverlay';
import { Box, Field, ghostGoldBtn, goldBtn, inputCls } from '../components/najeCv/cvUi';
import { exportCvDocx, exportCvPdf, fileBase } from '../lib/cvExport';
import { askNaje } from '../lib/askNaje';
import { useI18n } from '../i18n';
import {
  ACCENT_PRESETS,
  appendSkill,
  applyAtsMode,
  applyMarketDefaults,
  applyPersonaDefaults,
  careerGaps,
  completeness,
  CV_STORAGE_KEY,
  CvData,
  cvFactsForPrompt,
  demoCv,
  emptyAchievement,
  emptyCertificate,
  emptyCourse,
  emptyCustomSection,
  emptyCv,
  emptyEducation,
  emptyExperience,
  emptyLanguage,
  emptyProject,
  emptyPublication,
  emptySkill,
  GENDER_OPTS,
  hydrateCv,
  isDemoCv,
  LANG_LEVELS,
  MARITAL_OPTS,
  MARKETS,
  mergeCvPatch,
  NAJE_CV_TRUTH,
  PERSONAS,
  scoreCv,
  summaryPolishInstruction,
  SUMMARY_LENGTHS,
  SUMMARY_STYLES,
  TEMPLATES,
  TIP_JUMP,
  usesPaperAccent,
} from '../lib/cvStudio';

type Tab = 'build' | 'preview' | 'coach';
type Gate = 'hero' | 'onboard' | 'studio';

function initialGate(cv: CvData): Gate {
  if (cv.wizardDone || cv.fullName.trim()) return 'studio';
  return 'hero';
}

export default function NajeCv() {
  const { isRtl, t } = useI18n();
  const [cv, setCv] = useState<CvData>(() => {
    try {
      const raw = localStorage.getItem(CV_STORAGE_KEY);
      if (raw) return hydrateCv(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    return emptyCv();
  });
  const [gate, setGate] = useState<Gate>(() => initialGate(cv));
  const [tab, setTab] = useState<Tab>('build');
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(
    () =>
      cv.courses.some((c) => c.name.trim()) ||
      cv.certificates.some((c) => c.name.trim()) ||
      cv.publications.some((p) => p.title.trim()) ||
      cv.customSections.some((s) => s.title.trim()) ||
      cv.achievements.some((a) => a.title.trim()) ||
      Boolean(cv.military.trim() || cv.volunteer.trim() || cv.coverLetter.trim())
  );
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [courseHints, setCourseHints] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('cv-sec-identity');
  const [scanMode, setScanMode] = useState(false);

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

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('naje-prompt-handoff');
      if (!raw) return;
      const j = JSON.parse(raw);
      if (String(j?.bestFor || '').toLowerCase() !== 'cv') return;
      const title = typeof j?.title === 'string' ? j.title.trim() : '';
      sessionStorage.removeItem('naje-prompt-handoff');
      if (!title) return;
      setCv((p) => {
        if (p.targetRole.trim() && p.headline.trim()) return p;
        return {
          ...p,
          targetRole: p.targetRole.trim() || title.slice(0, 80),
          headline: p.headline.trim() || title.slice(0, 80),
          wizardDone: true,
        };
      });
      setGate('studio');
      toast.info('فُهمت الوظيفة المستهدفة من ناجي برومبت — أكمل السيرة هنا. لا نلصق برومبت الإنتاج داخل الملف.');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (gate !== 'studio' || tab !== 'build') return;
    const ids = [
      'cv-sec-identity',
      'cv-sec-contact',
      'cv-sec-market',
      'cv-sec-experience',
      'cv-sec-education',
      'cv-sec-skills',
      'cv-sec-languages',
      'cv-sec-projects',
      'cv-sec-extra',
      'cv-sec-template',
    ];
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis?.target.id) {
          const id = vis.target.id === 'cv-sec-personal' ? 'cv-sec-market' : vis.target.id;
          setActiveSection(id);
          if (id === 'cv-sec-extra') setExtraOpen(true);
        }
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: [0.12, 0.35] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    const personal = document.getElementById('cv-sec-personal');
    if (personal) obs.observe(personal);
    return () => obs.disconnect();
  }, [gate, tab, extraOpen]);

  const patch = (partial: Partial<CvData>) => setCv((p) => ({ ...p, ...partial }));
  const { score } = useMemo(() => scoreCv(cv), [cv]);
  const ticks = useMemo(() => completeness(cv), [cv]);
  const demo = isDemoCv(cv);
  const scoreColor = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-[#e8c36a]' : 'text-rose-300';
  const showPhotoBooth =
    !cv.atsMode &&
    (cv.market === 'gulf' || cv.market === 'creative' || cv.template === 'gulf' || cv.template === 'gold' || cv.template === 'modern');
  const gaps = useMemo(() => careerGaps(cv), [cv]);
  const fold = (id: string) => activeSection !== id;

  const enterStudio = (next?: Partial<CvData> | ((c: CvData) => CvData)) => {
    setCv((p) => {
      const mid = typeof next === 'function' ? next(p) : { ...p, ...next };
      return { ...mid, wizardDone: true };
    });
    setGate('studio');
  };

  const polish = async (kind: 'summary' | 'exp' | 'headline' | 'cover' | 'course', id?: string) => {
    setAiBusy(kind + (id || ''));
    try {
      if (kind === 'summary') {
        const raw = await askNaje(
          `${NAJE_CV_TRUTH}\n${summaryPolishInstruction(cv)}\n${cvFactsForPrompt(cv)}\nالملخص الحالي:\n${cv.summary || 'لا يوجد'}`
        );
        patch({ summary: raw.replace(/^["«]|["»]$/g, '').trim() });
        toast.success('ناجي صاغ الملخص');
      } else if (kind === 'headline') {
        const raw = await askNaje(
          `${NAJE_CV_TRUTH}\nحسّن المسمّى الوظيفي ليكون تصنيف مهني واضح في 3–7 كلمات. لا ترفع الرتبة إن لم تُذكر. أرجع المسمّى فقط.\nالحالي: ${cv.headline || 'لا يوجد'}\n${cvFactsForPrompt(cv)}`
        );
        patch({ headline: raw.replace(/^["«]|["»]$/g, '').trim().split('\n')[0].slice(0, 80) });
        toast.success('ناجي حسّن المسمّى');
      } else if (kind === 'cover') {
        const raw = await askNaje(
          `${NAJE_CV_TRUTH}\nاكتب خطاب تغطية عربي مهني قصير (120–180 كلمة) من الحقائق التالية فقط. لا تخترع أرقاماً أو جهات. أرجع النص فقط.\n${cvFactsForPrompt(cv)}\nإعلان الوظيفة:\n${cv.jobPosting || 'غير مرفق'}\nخطاب حالي:\n${cv.coverLetter || 'لا يوجد'}`
        );
        patch({ coverLetter: raw.replace(/^["«]|["»]$/g, '').trim() });
        setExtraOpen(true);
        toast.success('خطاب جاهز للمراجعة');
      } else if (kind === 'course' && id) {
        const course = cv.courses.find((c) => c.id === id);
        if (!course) return;
        const raw = await askNaje(
          `${NAJE_CV_TRUTH}\nأجب بجملتين فقط: ما فائدة وضع هذه الدورة في السيرة لهذه الوظيفة؟ نصيحة موضع لا ادّعاء. لا تخترع اعتماداً أو مهارة.\nالدورة: ${course.name}\nالجهة: ${course.issuer}\nالمكتسب المكتوب: ${course.gained || 'غير مذكور'}\nالوظيفة المستهدفة: ${cv.targetRole || cv.headline}\nأرجع الجملتين فقط.`
        );
        setCourseHints((h) => ({ ...h, [id]: raw.trim() }));
      } else if (kind === 'exp' && id) {
        const exp = cv.experiences.find((e) => e.id === id);
        if (!exp) return;
        const raw = await askNaje(
          `${NAJE_CV_TRUTH}\nحوّل مهام هذه الوظيفة إلى 3–5 نقاط سيرة عربية: فعل قوي + ماذا. إن لم يوجد رقم في النص لا تخترع رقماً. سطر لكل نقطة. بدون مقدمات.\nالمسمّى: ${exp.title}\nالجهة: ${exp.company}\nالنص:\n${exp.bullets || exp.title}`
        );
        setCv((p) => ({
          ...p,
          experiences: p.experiences.map((e) => (e.id === id ? { ...e, bullets: raw.trim() } : e)),
        }));
        toast.success('ناجي صاغ النقاط');
      }
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

  const jump = (tipId: string) => {
    const dest = TIP_JUMP[tipId] || { tab: 'build' as const, anchor: 'cv-sec-identity' };
    if (dest.tab === 'coach' || dest.anchor === 'cv-sec-courses' || dest.anchor === 'cv-sec-certs') {
      if (dest.anchor === 'cv-sec-courses' || dest.anchor === 'cv-sec-certs') setExtraOpen(true);
    }
    setTab(dest.tab);
    if (dest.tab === 'build') setActiveSection(dest.anchor);
    window.setTimeout(() => {
      document.getElementById(dest.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const jumpAnchor = (anchor: string) => {
    if (anchor === 'cv-sec-courses' || anchor === 'cv-sec-certs' || anchor === 'cv-sec-extra' || anchor === 'cv-sec-cover') setExtraOpen(true);
    setActiveSection(anchor);
    setTab('build');
    window.setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const probeImage = (url: string) =>
    new Promise<boolean>((resolve) => {
      const img = new Image();
      const done = (ok: boolean) => {
        img.onload = null;
        img.onerror = null;
        resolve(ok);
      };
      img.onload = () => done(true);
      img.onerror = () => done(false);
      img.src = url;
      window.setTimeout(() => done(false), 4000);
    });

  const importFromProfile = async () => {
    const user = useAppStore.getState().user;
    if (!user) {
      toast.error('سجّل الدخول لاستخدام ملفك في ناجي');
      return;
    }
    const next: Partial<CvData> = {};
    if (user.displayName?.trim()) next.fullName = user.displayName.trim();
    if (user.email?.trim()) next.email = user.email.trim();
    const url = user.photoURL?.trim();
    if (url?.startsWith('data:')) {
      next.photo = url;
      next.showPhoto = true;
    } else if (url && /^https?:\/\//i.test(url)) {
      const ok = await probeImage(url);
      if (ok) {
        next.photo = url;
        next.showPhoto = true;
      } else {
        toast.info('تعذر تحميل صورة الملف — أكمل الباقي من الاستوديو');
      }
    }
    enterStudio(next);
    toast.success('مُلئت الحقول من ملفك — راجع وعدّل في الاستوديو. لا شيء نهائي قبل مراجعتك.');
  };

  const mergeIncoming = (incoming: Record<string, unknown>) => {
    setCv((p) => mergeCvPatch({ ...p, wizardDone: true }, incoming));
    setGate('studio');
    setExtraOpen(true);
    toast.success('أُضيف بعد تأكيدك');
  };

  const resetDraft = () => {
    setCv(emptyCv());
    setGate('hero');
    setTab('build');
    setDismissed([]);
    setCourseHints({});
    setExtraOpen(false);
    try {
      localStorage.removeItem(CV_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="naje-cv-studio relative h-full overflow-x-hidden overflow-y-auto bg-[#0b1220] px-2.5 pb-10 pt-2 text-[#f3ead8] sm:px-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <StudioBootSplash dark />

      {gate !== 'studio' && (
        <div className="mx-auto max-w-7xl">
          {gate === 'hero' && (
            <CvHero
              onCreate={() => setGate('onboard')}
              onInterview={() => setInterviewOpen(true)}
              onImport={() => setImportOpen(true)}
              onUseProfile={importFromProfile}
              onDemo={() => {
                setCv(demoCv());
                setGate('studio');
              }}
            />
          )}
          {gate === 'onboard' && (
            <CvOnboard
              cv={cv}
              onApply={(fn) => setCv(fn)}
              onBack={() => setGate('hero')}
              onEnter={() => enterStudio()}
            />
          )}
        </div>
      )}

      {gate === 'studio' && (
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
                <div className="flex flex-wrap justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCv((p) => applyAtsMode(p, true))}
                    className={cv.atsMode ? goldBtn : ghostGoldBtn}
                  >
                    ATS
                  </button>
                  <button
                    type="button"
                    onClick={() => setCv((p) => applyAtsMode(p, false))}
                    className={!cv.atsMode ? goldBtn : ghostGoldBtn}
                  >
                    بصري
                  </button>
                  <button type="button" onClick={() => setInterviewOpen(true)} className={ghostGoldBtn}>
                    <MessageCircle className="h-3.5 w-3.5" /> ناجي
                  </button>
                  <button type="button" onClick={() => setImportOpen(true)} className={ghostGoldBtn}>
                    <Upload className="h-3.5 w-3.5" /> استيراد
                  </button>
                  <button type="button" onClick={() => doExport('pdf')} disabled={!!exporting} className={goldBtn}>
                    {exporting === 'pdf' ? <NajeThinking size={16} /> : <Download className="h-3.5 w-3.5" />}
                    PDF
                  </button>
                  <button type="button" onClick={() => doExport('docx')} disabled={!!exporting} className={ghostGoldBtn}>
                    {exporting === 'docx' ? <NajeThinking size={16} /> : <FileText className="h-3.5 w-3.5" />}
                    Word
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-1 overflow-x-auto pb-0.5">
              {ticks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    jumpAnchor(
                      t.id === 'name' || t.id === 'title' || t.id === 'summary'
                        ? 'cv-sec-identity'
                        : t.id === 'contact'
                          ? 'cv-sec-contact'
                          : t.id === 'exp'
                            ? 'cv-sec-experience'
                            : t.id === 'edu'
                              ? 'cv-sec-education'
                              : t.id === 'skills'
                                ? 'cv-sec-skills'
                                : t.id === 'certs'
                                  ? 'cv-sec-certs'
                                  : t.id === 'courses'
                                    ? 'cv-sec-courses'
                                    : 'cv-sec-identity'
                    )
                  }
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black ${
                    t.ok ? 'border-emerald-400/30 text-emerald-200' : t.optional ? 'border-white/10 text-white/35' : 'border-rose-400/25 text-rose-200'
                  }`}
                >
                  {t.ar}
                </button>
              ))}
            </div>
          </header>

          {demo && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2">
              <p className="text-[11px] font-black text-amber-100">بيانات تجريبية — ليست سيرتك</p>
              <button type="button" onClick={resetDraft} className="text-[11px] font-black text-[#e8c36a]">
                ابدأ بسيرتي
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-black/30 p-1 sm:hidden">
            {(
              [
                ['build', t('studio.buildTab')],
                ['preview', t('studio.previewTab')],
                ['coach', t('studio.coachTab')],
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
          <div className="hidden gap-1 rounded-2xl border border-white/10 bg-black/30 p-1 sm:flex">
            {(
              [
                ['build', t('studio.buildTab')],
                ['preview', t('studio.previewTab')],
                ['coach', t('studio.coachTab')],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 rounded-xl py-2 text-[12px] font-black ${tab === id ? 'bg-[#c4a35a] text-[#1a140c]' : 'text-white/60'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={`grid grid-cols-1 gap-3 ${tab === 'build' ? 'lg:grid-cols-[148px_minmax(0,1fr)_420px]' : ''}`}>
            {tab === 'build' && <CvStudioRail cv={cv} activeId={activeSection} onJump={jumpAnchor} />}
            <div className={`space-y-3 ${tab !== 'build' ? 'hidden' : ''}`}>
              <Box
                id="cv-sec-identity"
                icon={<User className="h-4 w-4 text-[#c4a35a]" />}
                title="الهوية — أول سطرين"
                collapsed={fold('cv-sec-identity')}
                active={activeSection === 'cv-sec-identity'}
                onToggle={() => jumpAnchor('cv-sec-identity')}
              >
                <div className="space-y-3">
                  {showPhotoBooth && (
                    <PhotoBooth
                      photo={cv.photo}
                      enhanced={cv.photoEnhanced}
                      photoStyle={cv.photoStyle}
                      onStyleChange={(photoStyle) => patch({ photoStyle })}
                      onChange={(photo, photoEnhanced) => patch({ photo, photoEnhanced, showPhoto: Boolean(photo) })}
                    />
                  )}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Field label="الاسم الكامل" hint="كما في الهوية. هذا أول ما يثبّت العين.">
                      <input className={inputCls} value={cv.fullName} onChange={(e) => patch({ fullName: e.target.value })} placeholder="مثال: ميسرة ناجي" />
                    </Field>
                    <Field label="المسمّى الذي تريد أن تُصنَّف تحته" hint="لا تكتب «باحث عن عمل». اكتب الدور.">
                      <input className={inputCls} value={cv.headline} onChange={(e) => patch({ headline: e.target.value })} placeholder="مثال: أخصائي موارد بشرية" />
                    </Field>
                  </div>
                  <button type="button" disabled={!!aiBusy} onClick={() => polish('headline')} className={ghostGoldBtn}>
                    {aiBusy === 'headline' ? <NajeThinking size={16} /> : <Sparkles className="h-3.5 w-3.5" />}
                    حسّن المسمّى
                  </button>
                  <Field label="ملخص مهني — يوقف المسح" hint="رقم واحد إن وُجد فعلاً. بلا «شغوف / محترف / ديناميكي».">
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {SUMMARY_STYLES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => patch({ summaryStyle: s.id })}
                          className={`rounded-lg border px-2 py-0.5 text-[9px] font-black ${
                            cv.summaryStyle === s.id ? 'border-[#c4a35a] bg-[#c4a35a]/15 text-white' : 'border-white/10 text-white/55'
                          }`}
                        >
                          {s.ar}
                        </button>
                      ))}
                    </div>
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {SUMMARY_LENGTHS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => patch({ summaryLength: s.id })}
                          className={`rounded-lg border px-2 py-0.5 text-[9px] font-black ${
                            cv.summaryLength === s.id ? 'border-[#c4a35a] bg-[#c4a35a]/15 text-white' : 'border-white/10 text-white/55'
                          }`}
                        >
                          {s.ar}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={cv.summaryLength === 'detailed' ? 5 : 3}
                      className={inputCls}
                      value={cv.summary}
                      onChange={(e) => patch({ summary: e.target.value })}
                      placeholder="مثال: محاسب تكاليف بخبرة 6 سنوات، خفّض هدر المواد 14٪..."
                    />
                  </Field>
                  <button type="button" disabled={!!aiBusy} onClick={() => polish('summary')} className={ghostGoldBtn}>
                    {aiBusy === 'summary' ? <NajeThinking size={16} /> : <Sparkles className="h-3.5 w-3.5" />}
                    ناجي يصوغ الملخص
                  </button>
                </div>
              </Box>

              <Box
                id="cv-sec-contact"
                icon={<User className="h-4 w-4 text-[#c4a35a]" />}
                title="التواصل"
                collapsed={fold('cv-sec-contact')}
                active={activeSection === 'cv-sec-contact'}
                onToggle={() => jumpAnchor('cv-sec-contact')}
              >
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
                  <Field label="GitHub">
                    <input className={inputCls} value={cv.github || ''} onChange={(e) => patch({ github: e.target.value })} dir="ltr" />
                  </Field>
                  <Field label="الوظيفة المستهدفة">
                    <input className={inputCls} value={cv.targetRole} onChange={(e) => patch({ targetRole: e.target.value })} />
                  </Field>
                </div>
              </Box>

              <Box
                id="cv-sec-market"
                icon={<Target className="h-4 w-4 text-[#c4a35a]" />}
                title="سوق التقديم والشخصية"
                collapsed={fold('cv-sec-market')}
                active={activeSection === 'cv-sec-market'}
                onToggle={() => jumpAnchor('cv-sec-market')}
              >
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
                <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCv((c) => applyPersonaDefaults(c, p.id))}
                      className={`rounded-lg border px-2 py-1.5 text-[10px] font-black ${cv.persona === p.id ? 'border-[#c4a35a] bg-[#c4a35a]/15 text-white' : 'border-white/10 text-white/55'}`}
                    >
                      {p.ar}
                    </button>
                  ))}
                </div>
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

              <Box
                id="cv-sec-personal"
                icon={<User className="h-4 w-4 text-[#c4a35a]" />}
                title="بيانات السوق المحلي"
                hint="في الخليج تُطلب. في الشركات العالمية وجدارات احذف العمر والصورة والحالة الاجتماعية."
                collapsed={fold('cv-sec-market')}
                active={activeSection === 'cv-sec-market'}
                onToggle={() => jumpAnchor('cv-sec-market')}
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
                        <option key={o.id} value={o.id}>
                          {o.ar}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="الحالة الاجتماعية">
                    <select className={inputCls} value={cv.marital} onChange={(e) => patch({ marital: e.target.value })}>
                      {MARITAL_OPTS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.ar}
                        </option>
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
                  <Field label="التوفر">
                    <input className={inputCls} value={cv.availability} onChange={(e) => patch({ availability: e.target.value })} placeholder="فوري / بعد شهر" />
                  </Field>
                </div>
              </Box>

              <Box
                id="cv-sec-experience"
                icon={<Briefcase className="h-4 w-4 text-[#c4a35a]" />}
                title="الخبرات — الأحدث أولاً"
                hint="كل نقطة: فعل + ماذا فعلت + رقم إن وُجد فعلاً."
                collapsed={fold('cv-sec-experience')}
                active={activeSection === 'cv-sec-experience'}
                onToggle={() => jumpAnchor('cv-sec-experience')}
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
                      persona={cv.persona}
                      onChange={(next) => setCv((p) => ({ ...p, experiences: p.experiences.map((x) => (x.id === e.id ? next : x)) }))}
                      onRemove={() => setCv((p) => ({ ...p, experiences: p.experiences.filter((x) => x.id !== e.id) }))}
                      onPolish={() => polish('exp', e.id)}
                      index={idx}
                    />
                  ))}
                  <CareerBreakHint cv={cv} gaps={gaps} onPick={(careerBreak) => patch({ careerBreak })} />
                </div>
              </Box>

              <Box
                id="cv-sec-education"
                icon={<GraduationCap className="h-4 w-4 text-[#c4a35a]" />}
                title="الشهادات الأكاديمية"
                hint="المستوى الجامعي، التخصص، الجهة، سنة التخرج، المعدل."
                collapsed={fold('cv-sec-education')}
                active={activeSection === 'cv-sec-education'}
                onToggle={() => jumpAnchor('cv-sec-education')}
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
                id="cv-sec-skills"
                icon={<Sparkles className="h-4 w-4 text-[#c4a35a]" />}
                title="المهارات"
                collapsed={fold('cv-sec-skills')}
                active={activeSection === 'cv-sec-skills'}
                onToggle={() => jumpAnchor('cv-sec-skills')}
              >
                <CvSkillsStudio
                  skills={cv.skills}
                  skillsList={cv.skillsList}
                  onChange={({ skills, skillsList }) => patch({ skills, skillsList })}
                />
              </Box>

              <Box
                id="cv-sec-languages"
                icon={<Languages className="h-4 w-4 text-[#c4a35a]" />}
                title="اللغات"
                collapsed={fold('cv-sec-languages')}
                active={activeSection === 'cv-sec-languages'}
                onToggle={() => jumpAnchor('cv-sec-languages')}
                action={
                  <button type="button" onClick={() => patch({ languages: [...cv.languages, emptyLanguage()] })} className="text-[10px] font-black text-[#e8c36a]">
                    + لغة
                  </button>
                }
              >
                <div className="space-y-2">
                  {cv.languages.map((l) => (
                    <div key={l.id} className="flex gap-2">
                      <input className={inputCls} placeholder="اللغة" value={l.name} onChange={(e) => setCv((p) => ({ ...p, languages: p.languages.map((x) => (x.id === l.id ? { ...x, name: e.target.value } : x)) }))} />
                      <select className={inputCls} value={l.level} onChange={(e) => setCv((p) => ({ ...p, languages: p.languages.map((x) => (x.id === l.id ? { ...x, level: e.target.value } : x)) }))}>
                        {LANG_LEVELS.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.ar}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </Box>

              <Box
                id="cv-sec-projects"
                icon={<Briefcase className="h-4 w-4 text-[#c4a35a]" />}
                title="مشاريع"
                collapsed={fold('cv-sec-projects')}
                active={activeSection === 'cv-sec-projects'}
                onToggle={() => jumpAnchor('cv-sec-projects')}
                action={
                  <button type="button" onClick={() => patch({ projects: [...cv.projects, emptyProject()] })} className="text-[10px] font-black text-[#e8c36a]">
                    + مشروع
                  </button>
                }
              >
                  {cv.projects.length === 0 && <p className="text-[11px] text-white/35">للطالب والخرّيج: مشروع واحد بوصف مشكلة ودورك يكفي أكثر من وظيفة فارغة.</p>}
                  {cv.projects.map((p) => (
                    <div key={p.id} className="mb-2 grid grid-cols-2 gap-2">
                      <input className={inputCls} placeholder="اسم المشروع" value={p.name} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)) }))} />
                      <input className={inputCls} placeholder="دورك" value={p.role} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, role: e.target.value } : x)) }))} />
                      <input className={inputCls} placeholder="السنة" value={p.year} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, year: e.target.value } : x)) }))} />
                      <input className={inputCls} placeholder="رابط" value={p.link || ''} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, link: e.target.value } : x)) }))} dir="ltr" />
                      <input className={`${inputCls} col-span-2`} placeholder="ماذا أنجزت" value={p.detail} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, detail: e.target.value } : x)) }))} />
                      <button type="button" onClick={() => setCv((c) => ({ ...c, projects: c.projects.filter((x) => x.id !== p.id) }))} className="col-span-2 text-[10px] text-rose-300">
                        حذف
                      </button>
                    </div>
                  ))}
                </Box>

              <div className={fold('cv-sec-extra') ? 'hidden lg:block' : ''} id="cv-sec-extra">
              <button
                type="button"
                onClick={() => {
                  setExtraOpen((v) => !v);
                  setActiveSection('cv-sec-extra');
                }}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-[12px] font-black text-[#e8c36a] ${
                  activeSection === 'cv-sec-extra' ? 'border-[#c4a35a]/45 bg-white/[0.05]' : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                أقسام إضافية
                <ChevronDown className={`h-4 w-4 transition ${extraOpen ? 'rotate-180' : ''}`} />
              </button>

              {extraOpen && (
                <div className="space-y-3">
                  <Box
                    id="cv-sec-courses"
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
                          hint={courseHints[c.id]}
                          busy={aiBusy === 'course' + c.id}
                          onAdvice={() => polish('course', c.id)}
                          onChange={(next) => setCv((p) => ({ ...p, courses: p.courses.map((x) => (x.id === c.id ? next : x)) }))}
                          onRemove={() => setCv((p) => ({ ...p, courses: p.courses.filter((x) => x.id !== c.id) }))}
                        />
                      ))}
                    </div>
                  </Box>

                  <Box
                    id="cv-sec-certs"
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
                          <input className={inputCls} placeholder="تاريخ الانتهاء" value={c.expires} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, expires: e.target.value } : x)) }))} />
                          <input className={inputCls} placeholder="الحالة" value={c.status || ''} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, status: e.target.value } : x)) }))} />
                          <input className={`${inputCls} col-span-2`} placeholder="رابط التحقق" value={c.url || ''} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, url: e.target.value } : x)) }))} dir="ltr" />
                          <button type="button" onClick={() => setCv((p) => ({ ...p, certificates: p.certificates.filter((x) => x.id !== c.id) }))} className="col-span-2 text-[10px] text-rose-300">
                            حذف
                          </button>
                        </div>
                      ))}
                    </div>
                  </Box>

                  <Box
                    icon={<Award className="h-4 w-4 text-[#c4a35a]" />}
                    title="إنجازات"
                    action={
                      <button type="button" onClick={() => patch({ achievements: [...cv.achievements, emptyAchievement()] })} className="text-[10px] font-black text-[#e8c36a]">
                        + إنجاز
                      </button>
                    }
                  >
                    {cv.achievements.map((a) => (
                      <div key={a.id} className="mb-2 grid grid-cols-2 gap-2">
                        <input className={inputCls} placeholder="العنوان" value={a.title} onChange={(e) => setCv((c) => ({ ...c, achievements: c.achievements.map((x) => (x.id === a.id ? { ...x, title: e.target.value } : x)) }))} />
                        <input className={inputCls} placeholder="الجهة" value={a.org} onChange={(e) => setCv((c) => ({ ...c, achievements: c.achievements.map((x) => (x.id === a.id ? { ...x, org: e.target.value } : x)) }))} />
                        <input className={inputCls} placeholder="السنة" value={a.year} onChange={(e) => setCv((c) => ({ ...c, achievements: c.achievements.map((x) => (x.id === a.id ? { ...x, year: e.target.value } : x)) }))} />
                        <input className={inputCls} placeholder="التفصيل" value={a.detail} onChange={(e) => setCv((c) => ({ ...c, achievements: c.achievements.map((x) => (x.id === a.id ? { ...x, detail: e.target.value } : x)) }))} />
                        <button type="button" onClick={() => setCv((c) => ({ ...c, achievements: c.achievements.filter((x) => x.id !== a.id) }))} className="col-span-2 text-[10px] text-rose-300">
                          حذف
                        </button>
                      </div>
                    ))}
                  </Box>

                  <Box
                    icon={<FileText className="h-4 w-4 text-[#c4a35a]" />}
                    title="إصدارات / أبحاث"
                    action={
                      <button type="button" onClick={() => patch({ publications: [...cv.publications, emptyPublication()] })} className="text-[10px] font-black text-[#e8c36a]">
                        + إصدار
                      </button>
                    }
                  >
                    {cv.publications.map((p) => (
                      <div key={p.id} className="mb-2 grid grid-cols-2 gap-2">
                        <input className={`${inputCls} col-span-2`} placeholder="العنوان" value={p.title} onChange={(e) => setCv((c) => ({ ...c, publications: c.publications.map((x) => (x.id === p.id ? { ...x, title: e.target.value } : x)) }))} />
                        <input className={inputCls} placeholder="الجهة / المجلة" value={p.venue} onChange={(e) => setCv((c) => ({ ...c, publications: c.publications.map((x) => (x.id === p.id ? { ...x, venue: e.target.value } : x)) }))} />
                        <input className={inputCls} placeholder="السنة" value={p.year} onChange={(e) => setCv((c) => ({ ...c, publications: c.publications.map((x) => (x.id === p.id ? { ...x, year: e.target.value } : x)) }))} />
                        <input className={`${inputCls} col-span-2`} placeholder="DOI" value={p.doi} onChange={(e) => setCv((c) => ({ ...c, publications: c.publications.map((x) => (x.id === p.id ? { ...x, doi: e.target.value } : x)) }))} dir="ltr" />
                        <button type="button" onClick={() => setCv((c) => ({ ...c, publications: c.publications.filter((x) => x.id !== p.id) }))} className="col-span-2 text-[10px] text-rose-300">
                          حذف
                        </button>
                      </div>
                    ))}
                  </Box>

                  <Box
                    icon={<FileText className="h-4 w-4 text-[#c4a35a]" />}
                    title="قسم مخصص"
                    action={
                      <button type="button" onClick={() => patch({ customSections: [...cv.customSections, emptyCustomSection()] })} className="text-[10px] font-black text-[#e8c36a]">
                        + قسم
                      </button>
                    }
                  >
                    {cv.customSections.map((s) => (
                      <div key={s.id} className="mb-2 space-y-2">
                        <input className={inputCls} placeholder="عنوان القسم" value={s.title} onChange={(e) => setCv((c) => ({ ...c, customSections: c.customSections.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)) }))} />
                        <textarea rows={2} className={inputCls} placeholder="المحتوى" value={s.body} onChange={(e) => setCv((c) => ({ ...c, customSections: c.customSections.map((x) => (x.id === s.id ? { ...x, body: e.target.value } : x)) }))} />
                        <button type="button" onClick={() => setCv((c) => ({ ...c, customSections: c.customSections.filter((x) => x.id !== s.id) }))} className="text-[10px] text-rose-300">
                          حذف
                        </button>
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
                    </div>
                  </Box>

                  <Box
                    id="cv-sec-cover"
                    icon={<FileText className="h-4 w-4 text-[#c4a35a]" />}
                    title="خطاب التغطية"
                    hint="اختياري. يُصاغ من حقائق سيرتك وإعلان الوظيفة فقط. حرّره قبل الإرسال."
                    action={
                      <button type="button" disabled={!!aiBusy} onClick={() => polish('cover')} className={ghostGoldBtn}>
                        {aiBusy === 'cover' ? <NajeThinking size={16} /> : <Sparkles className="h-3.5 w-3.5" />}
                        صياغة خطاب
                      </button>
                    }
                  >
                    <textarea rows={6} className={inputCls} value={cv.coverLetter} onChange={(e) => patch({ coverLetter: e.target.value })} placeholder="سيظهر هنا خطاب يمكنك تعديله. لن يُرسل تلقائياً." />
                  </Box>
                </div>
              )}
              </div>

              <Box
                id="cv-sec-template"
                icon={<Sparkles className="h-4 w-4 text-[#c4a35a]" />}
                title="تصميم الورقة"
                hint={cv.atsMode ? 'وضع ATS يقدّم البنية المقروءة على الزخرفة.' : 'وضع بصري يسمح بالخليج والذهبي والحديث والصورة.'}
                collapsed={fold('cv-sec-template')}
                active={activeSection === 'cv-sec-template'}
                onToggle={() => jumpAnchor('cv-sec-template')}
              >
                <div className="mb-3 flex gap-1.5">
                  <button type="button" onClick={() => setCv((p) => applyAtsMode(p, true))} className={cv.atsMode ? goldBtn : ghostGoldBtn}>
                    وضع ATS
                  </button>
                  <button type="button" onClick={() => setCv((p) => applyAtsMode(p, false))} className={!cv.atsMode ? goldBtn : ghostGoldBtn}>
                    وضع بصري
                  </button>
                </div>
                <p className="mb-3 text-[10px] leading-relaxed text-white/45">
                  {cv.atsMode
                    ? 'وضع ATS يقدّم البنية المقروءة على الزخرفة. الصورة والبيانات الشخصية تُخفى، والقالب نواة ناجي أو جدارات.'
                    : 'الوضع البصري يسمح بقوالب الخليج والذهبي والحديث وبالصورة — للتسليم أمام إنسان.'}
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {(cv.atsMode ? TEMPLATES.filter((t) => t.id === 'naje' || t.id === 'jadarat') : TEMPLATES).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        patch({
                          template: t.id,
                          showPhoto: t.id === 'naje' || t.id === 'jadarat' ? false : cv.showPhoto,
                          atsMode: t.ats ? cv.atsMode : false,
                        })
                      }
                      className={`rounded-xl border p-2 text-right ${cv.template === t.id ? 'border-[#c4a35a] bg-[#c4a35a]/15' : 'border-white/10'}`}
                    >
                      <span className="block text-[11px] font-black text-white">{t.ar}</span>
                      <span className="mt-0.5 block text-[9px] text-white/40">{t.hint}</span>
                    </button>
                  ))}
                </div>
                {usesPaperAccent(cv.template) && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[11px] font-black text-[#e8c36a]">لون الخط الرفيع</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ACCENT_PRESETS.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => patch({ accentColor: a.hex })}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-black ${
                            (cv.accentColor || '#c4a35a') === a.hex ? 'border-[#c4a35a] text-white' : 'border-white/10 text-white/60'
                          }`}
                        >
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: a.hex }} />
                          {a.ar}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Box>

              <button type="button" onClick={resetDraft} className="w-full text-center text-[10px] font-black text-white/30">
                بداية جديدة
              </button>
            </div>

            <div className={`space-y-3 ${tab === 'build' ? 'hidden lg:block' : ''} ${tab === 'preview' || tab === 'coach' ? 'block' : ''}`}>
              {tab === 'coach' && (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <CvCoachPanel
                    cv={cv}
                    dismissed={dismissed}
                    onDismiss={(id) => setDismissed((d) => [...d, id])}
                    onImprove={jump}
                    scanMode={scanMode}
                    onToggleScan={() => {
                      setScanMode((s) => !s);
                      setTab('preview');
                    }}
                    onCareerBreak={(careerBreak) => patch({ careerBreak })}
                  />
                  <CvJobMatch
                    cv={cv}
                    onPosting={(jobPosting) => patch({ jobPosting })}
                    onAddSkill={(k) => {
                      const skills = appendSkill(cv.skills, k);
                      const list = cv.skillsList || [];
                      const skillsList = list.some((s) => s.name.trim().toLowerCase() === k.toLowerCase())
                        ? list
                        : [...list, { ...emptySkill(), name: k, level: 'intermediate' as const }];
                      patch({ skills, skillsList });
                      toast.info(`أُضيفت «${k}» إلى المهارات — احذفها إن لم تكن لديك`);
                    }}
                  />
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 xl:col-span-2">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-black text-white">خطاب التغطية</h3>
                      <button type="button" disabled={!!aiBusy} onClick={() => polish('cover')} className={ghostGoldBtn}>
                        {aiBusy === 'cover' ? <NajeThinking size={16} /> : <Sparkles className="h-3.5 w-3.5" />}
                        صياغة خطاب
                      </button>
                    </div>
                    <textarea rows={5} className={inputCls} value={cv.coverLetter} onChange={(e) => patch({ coverLetter: e.target.value })} placeholder="اختياري — من حقائق السيرة والإعلان فقط." />
                  </div>
                </div>
              )}

              {(tab === 'preview' || tab === 'build') && (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#070b14] p-2">
                  <CvScanOverlay cv={cv} active={scanMode} onToggle={() => setScanMode((s) => !s)}>
                    <div className="mx-auto overflow-x-auto overflow-y-hidden" style={{ maxWidth: 794 }}>
                      <div
                        style={{
                          width: 794,
                          transform: tab === 'preview' ? 'scale(1)' : 'scale(0.46)',
                          transformOrigin: 'top center',
                          marginBottom: tab === 'preview' ? 0 : -(1123 * 0.54),
                          marginInline: 'auto',
                        }}
                      >
                        <CvPreview cv={cv} sheetId="naje-cv-preview" />
                      </div>
                    </div>
                  </CvScanOverlay>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed -left-[2400px] top-0" aria-hidden>
        <CvPreview cv={cv} sheetId="naje-cv-sheet" />
      </div>

      <CvInterview open={interviewOpen} cv={cv} onClose={() => setInterviewOpen(false)} onConfirmPatch={mergeIncoming} />
      <CvImport open={importOpen} onClose={() => setImportOpen(false)} onConfirm={mergeIncoming} />
    </div>
  );
}
