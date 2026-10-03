import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Redo2,
  Sparkles,
  Target,
  Undo2,
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
import { CvPaperStage } from '../components/najeCv/CvPaperStage';
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
  tipDestination,
  usesPaperAccent,
} from '../lib/cvStudio';

type Tab = 'build' | 'preview' | 'coach';
type Gate = 'hero' | 'onboard' | 'studio';

function initialGate(cv: CvData): Gate {
  if (cv.wizardDone || cv.fullName.trim()) return 'studio';
  return 'hero';
}

export default function NajeCv() {
  const { isRtl, t, formatNumber } = useI18n();
  const [cv, setCvState] = useState<CvData>(() => {
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
      Boolean(cv.military.trim() || cv.volunteer.trim() || cv.coverLetter.trim() || (cv.linkedinAbout || '').trim() || (cv.shortBio || '').trim())
  );
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [courseHints, setCourseHints] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('cv-sec-identity');
  const [scanMode, setScanMode] = useState(false);
  const [templateQuery, setTemplateQuery] = useState('');
  const pastRef = useRef<string[]>([]);
  const futureRef = useRef<string[]>([]);
  const historyLock = useRef(false);
  const cvRef = useRef(cv);
  cvRef.current = cv;
  const [hist, setHist] = useState({ undo: 0, redo: 0 });

  const setCv = (updater: React.SetStateAction<CvData>) => {
    const prev = cvRef.current;
    const next = typeof updater === 'function' ? (updater as (c: CvData) => CvData)(prev) : updater;
    if (!historyLock.current) {
      const before = JSON.stringify(prev);
      const after = JSON.stringify(next);
      if (before !== after) {
        pastRef.current.push(before);
        if (pastRef.current.length > 20) pastRef.current.shift();
        futureRef.current = [];
        setHist({ undo: pastRef.current.length, redo: 0 });
      }
    }
    cvRef.current = next;
    setCvState(next);
  };

  const undoCv = () => {
    const snap = pastRef.current.pop();
    if (!snap) return;
    futureRef.current.push(JSON.stringify(cvRef.current));
    if (futureRef.current.length > 20) futureRef.current.shift();
    historyLock.current = true;
    const next = hydrateCv(JSON.parse(snap));
    cvRef.current = next;
    setCvState(next);
    historyLock.current = false;
    setHist({ undo: pastRef.current.length, redo: futureRef.current.length });
  };

  const redoCv = () => {
    const snap = futureRef.current.pop();
    if (!snap) return;
    pastRef.current.push(JSON.stringify(cvRef.current));
    if (pastRef.current.length > 20) pastRef.current.shift();
    historyLock.current = true;
    const next = hydrateCv(JSON.parse(snap));
    cvRef.current = next;
    setCvState(next);
    historyLock.current = false;
    setHist({ undo: pastRef.current.length, redo: futureRef.current.length });
  };

  const docLangLine =
    cv.lang === 'en'
      ? 'OUTPUT LANGUAGE: English only. Ignore any earlier instruction to answer in Arabic. Return only the requested text. Never invent employers, metrics, GPA, or certificates.'
      : 'لغة المخرجات: العربية فقط. أرجع النص المطلوب فقط. لا تخترع جهات عمل أو أرقاماً أو معدلات أو شهادات.';

  const cleanAi = (raw: string) => raw.replace(/^["«]|["»]$/g, '').trim();

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
      toast.info(t('cv.toast.handoff'));
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
  const templateShown = useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    const pool = cv.atsMode ? TEMPLATES.filter((row) => row.id === 'naje' || row.id === 'jadarat') : TEMPLATES;
    if (!q) return pool;
    return pool.filter((row) => {
      const name = t(`cv.template.${row.id}`).toLowerCase();
      const hint = t(`cv.template.${row.id}Hint`).toLowerCase();
      return name.includes(q) || hint.includes(q) || row.id.includes(q);
    });
  }, [cv.atsMode, templateQuery, t]);

  const enterStudio = (next?: Partial<CvData> | ((c: CvData) => CvData)) => {
    setCv((p) => {
      const mid = typeof next === 'function' ? next(p) : { ...p, ...next };
      return { ...mid, wizardDone: true };
    });
    setGate('studio');
  };

  const polish = async (kind: 'summary' | 'exp' | 'headline' | 'cover' | 'course' | 'linkedin' | 'bio', id?: string) => {
    setAiBusy(kind + (id || ''));
    try {
      const facts = cvFactsForPrompt(cv);
      if (kind === 'summary') {
        const raw = await askNaje(
          `${NAJE_CV_TRUTH}\n${summaryPolishInstruction(cv)}\n${facts}\nالملخص الحالي:\n${cv.summary || 'لا يوجد'}\n${docLangLine}`
        );
        const summary = cleanAi(raw);
        if (!summary) throw new Error('empty');
        patch({ summary });
        toast.success(t('cv.toast.summary'));
      } else if (kind === 'headline') {
        const raw = await askNaje(
          `${NAJE_CV_TRUTH}\nحسّن المسمّى الوظيفي ليكون تصنيف مهني واضح في 3–7 كلمات. لا ترفع الرتبة إن لم تُذكر. أرجع المسمّى فقط.\nالحالي: ${cv.headline || 'لا يوجد'}\n${facts}\n${docLangLine}`
        );
        const headline = cleanAi(raw).split('\n')[0].slice(0, 80);
        if (!headline) throw new Error('empty');
        patch({ headline });
        toast.success(t('cv.toast.headline'));
      } else if (kind === 'cover') {
        const raw = await askNaje(
          `${NAJE_CV_TRUTH}\nاكتب خطاب تغطية مهني قصير (120–180 كلمة) من الحقائق التالية فقط. لا تخترع أرقاماً أو جهات أو معدلات أو شهادات. أرجع النص فقط.\n${facts}\nإعلان الوظيفة:\n${cv.jobPosting || 'غير مرفق'}\nخطاب حالي:\n${cv.coverLetter || 'لا يوجد'}\n${docLangLine}`
        );
        const coverLetter = cleanAi(raw);
        if (!coverLetter) throw new Error('empty');
        patch({ coverLetter });
        setExtraOpen(true);
        toast.success(t('cv.toast.cover'));
      } else if (kind === 'linkedin') {
        const raw = await askNaje(
          `${NAJE_CV_TRUTH}\nWrite a LinkedIn About section in the first person, 80–140 words, using ONLY the facts below. Do not invent employers, metrics, GPA, or certificates. Return only the text.\n${facts}\nCurrent draft:\n${cv.linkedinAbout || 'none'}\n${docLangLine}`
        );
        const linkedinAbout = cleanAi(raw);
        if (!linkedinAbout) throw new Error('empty');
        patch({ linkedinAbout });
        setExtraOpen(true);
        toast.success(t('cv.toast.linkedin'));
      } else if (kind === 'bio') {
        const raw = await askNaje(
          `${NAJE_CV_TRUTH}\nWrite a short professional bio in two sentences, under 60 words, using ONLY the facts below. Do not invent employers, metrics, GPA, or certificates. Return only the text.\n${facts}\nCurrent draft:\n${cv.shortBio || 'none'}\n${docLangLine}`
        );
        const shortBio = cleanAi(raw);
        if (!shortBio) throw new Error('empty');
        patch({ shortBio });
        setExtraOpen(true);
        toast.success(t('cv.toast.bio'));
      } else if (kind === 'course' && id) {
        const course = cv.courses.find((c) => c.id === id);
        if (!course) return;
        const raw = await askNaje(
          `${NAJE_CV_TRUTH}\nأجب بجملتين فقط: ما فائدة وضع هذه الدورة في السيرة لهذه الوظيفة؟ نصيحة موضع لا ادّعاء. لا تخترع اعتماداً أو مهارة.\nالدورة: ${course.name}\nالجهة: ${course.issuer}\nالمكتسب المكتوب: ${course.gained || 'غير مذكور'}\nالوظيفة المستهدفة: ${cv.targetRole || cv.headline}\nأرجع الجملتين فقط.\n${docLangLine}`
        );
        const hint = raw.trim();
        if (!hint) throw new Error('empty');
        setCourseHints((h) => ({ ...h, [id]: hint }));
      } else if (kind === 'exp' && id) {
        const exp = cv.experiences.find((e) => e.id === id);
        if (!exp) return;
        const raw = await askNaje(
          `${NAJE_CV_TRUTH}\nحوّل مهام هذه الوظيفة إلى 3–5 نقاط سيرة: فعل قوي + ماذا. إن لم يوجد رقم في النص لا تخترع رقماً. سطر لكل نقطة. بدون مقدمات.\nالمسمّى: ${exp.title}\nالجهة: ${exp.company}\nالنص:\n${exp.bullets || exp.title}\n${docLangLine}`
        );
        const bullets = raw.trim();
        if (!bullets) throw new Error('empty');
        setCv((p) => ({
          ...p,
          experiences: p.experiences.map((e) => (e.id === id ? { ...e, bullets } : e)),
        }));
        toast.success(t('cv.toast.bullets'));
      }
    } catch (e: any) {
      toast.error(e?.message === 'empty' ? t('cv.toast.fail') : e?.message || t('cv.toast.fail'));
    } finally {
      setAiBusy(null);
    }
  };

  const doExport = async (kind: 'pdf' | 'docx') => {
    if (!cv.fullName.trim()) {
      toast.error(t('cv.toast.needName'));
      return;
    }
    setExporting(kind);
    try {
      const base = fileBase(cv);
      if (kind === 'pdf') {
        const sheet = document.getElementById('naje-cv-sheet');
        if (!sheet) throw new Error('preview');
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
      toast.error(e?.message === 'preview' ? t('cv.toast.preview') : e?.message || t('cv.toast.exportFail'));
    } finally {
      setExporting(null);
    }
  };

  const jump = (tipId: string) => {
    const dest = tipDestination(tipId);
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
      toast.error(t('cv.toast.login'));
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
        toast.info(t('cv.toast.photo'));
      }
    }
    enterStudio(next);
    toast.success(t('cv.toast.profile'));
  };

  const mergeIncoming = (incoming: Record<string, unknown>) => {
    setCv((p) => mergeCvPatch({ ...p, wizardDone: true }, incoming));
    setGate('studio');
    setExtraOpen(true);
    toast.success(t('cv.toast.merged'));
  };

  const resetDraft = () => {
    historyLock.current = true;
    pastRef.current = [];
    futureRef.current = [];
    setHist({ undo: 0, redo: 0 });
    setCv(emptyCv());
    historyLock.current = false;
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
    <div className="naje-cv-studio relative h-full overflow-y-auto bg-[#0b1220] px-2.5 pb-10 pt-2 text-[#f3ead8] sm:px-6" dir={isRtl ? 'rtl' : 'ltr'}>
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
          <header className="relative z-10 overflow-hidden rounded-2xl border border-[#c4a35a]/40 bg-[#101826]/95 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(232,195,106,0.35)]">
            <div className="flex">
              <div className="cv-spine shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 p-3 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[0.22em] text-[#e8c36a]">{t('cv.brand')}</p>
                <h1 className="mt-1 text-xl font-black leading-snug text-white sm:text-2xl">{t('cv.studio.title')}</h1>
                <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-white/50 sm:text-xs hidden sm:block">{t('cv.studio.lead')}</p>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <div className="rounded-2xl border border-[#c4a35a]/40 bg-black/40 px-4 py-2 text-center">
                  <div className="text-[10px] tracking-[0.14em] text-[#e8c36a]/80">{t('cv.studio.scan')}</div>
                  <div className={`font-mono text-2xl font-black ${scoreColor}`}>{formatNumber(score)}</div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <button type="button" onClick={undoCv} disabled={!hist.undo} className={ghostGoldBtn} aria-label={t('cv.studio.undo')}>
                    <Undo2 className="h-3.5 w-3.5" />
                    {t('cv.studio.undo')}
                  </button>
                  <button type="button" onClick={redoCv} disabled={!hist.redo} className={ghostGoldBtn} aria-label={t('cv.studio.redo')}>
                    <Redo2 className="h-3.5 w-3.5" />
                    {t('cv.studio.redo')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCv((p) => applyAtsMode(p, true))}
                    className={cv.atsMode ? goldBtn : ghostGoldBtn}
                  >
                    {t('cv.studio.modeAts')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCv((p) => applyAtsMode(p, false))}
                    className={!cv.atsMode ? goldBtn : ghostGoldBtn}
                  >
                    {t('cv.studio.modeVisual')}
                  </button>
                  <button type="button" onClick={() => setInterviewOpen(true)} className={ghostGoldBtn}>
                    <MessageCircle className="h-3.5 w-3.5" /> {t('cv.studio.talk')}
                  </button>
                  <button type="button" onClick={() => setImportOpen(true)} className={ghostGoldBtn}>
                    <Upload className="h-3.5 w-3.5" /> {t('cv.studio.import')}
                  </button>
                  <button type="button" onClick={() => doExport('pdf')} disabled={!!exporting} className={goldBtn}>
                    {exporting === 'pdf' ? <NajeThinking size={16} /> : <Download className="h-3.5 w-3.5" />}
                    {t('cv.studio.pdf')}
                  </button>
                  <button type="button" onClick={() => doExport('docx')} disabled={!!exporting} className={ghostGoldBtn}>
                    {exporting === 'docx' ? <NajeThinking size={16} /> : <FileText className="h-3.5 w-3.5" />}
                    {t('cv.studio.word')}
                  </button>
                </div>
              </div>
            </div>
            <div className={`mt-3 flex gap-1 overflow-x-auto pb-0.5 ${tab === 'preview' ? 'hidden' : ''}`}>
              {ticks.map((tick) => (
                <button
                  key={tick.id}
                  type="button"
                  onClick={() =>
                    jumpAnchor(
                      tick.id === 'name' || tick.id === 'title' || tick.id === 'summary'
                        ? 'cv-sec-identity'
                        : tick.id === 'contact'
                          ? 'cv-sec-contact'
                          : tick.id === 'exp'
                            ? 'cv-sec-experience'
                            : tick.id === 'edu'
                              ? 'cv-sec-education'
                              : tick.id === 'skills'
                                ? 'cv-sec-skills'
                                : tick.id === 'certs'
                                  ? 'cv-sec-certs'
                                  : tick.id === 'courses'
                                    ? 'cv-sec-courses'
                                    : tick.id === 'projects'
                                      ? 'cv-sec-projects'
                                      : 'cv-sec-identity'
                    )
                  }
                  className={`min-h-[44px] shrink-0 rounded-full border px-2.5 text-[9px] font-black ${
                    tick.ok ? 'border-emerald-400/30 text-emerald-200' : tick.optional ? 'border-white/10 text-white/35' : 'border-rose-400/25 text-rose-200'
                  }`}
                >
                  {t(`cv.tick.${tick.id}`)}
                </button>
              ))}
            </div>
              </div>
            </div>
          </header>

          {demo && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2">
              <p className="text-[11px] font-black text-amber-100">{t('cv.studio.demoBanner')}</p>
              <button type="button" onClick={resetDraft} className="min-h-[44px] text-[11px] font-black text-[#e8c36a]">
                {t('cv.studio.useMine')}
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
                className={`min-h-[44px] rounded-xl py-2 text-[11px] font-black ${tab === id ? 'bg-[#c4a35a] text-[#1a140c]' : 'text-white/60'} ${
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
                className={`min-h-[44px] flex-1 rounded-xl py-2 text-[12px] font-black ${tab === id ? 'bg-[#c4a35a] text-[#1a140c]' : 'text-white/60'}`}
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
                title={t('cv.sec.identity')}
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
                    <Field label={t('cv.field.name')} hint={t('cv.field.nameHint')}>
                      <input className={inputCls} value={cv.fullName} onChange={(e) => patch({ fullName: e.target.value })} placeholder={t('cv.field.namePh')} />
                    </Field>
                    <Field label={t('cv.field.headline')} hint={t('cv.field.headlineHint')}>
                      <input className={inputCls} value={cv.headline} onChange={(e) => patch({ headline: e.target.value })} placeholder={t('cv.field.headlinePh')} />
                    </Field>
                  </div>
                  <button type="button" disabled={!!aiBusy} onClick={() => polish('headline')} className={ghostGoldBtn}>
                    {aiBusy === 'headline' ? <NajeThinking size={16} /> : <Sparkles className="h-3.5 w-3.5" />}
                    {t('cv.field.improveHeadline')}
                  </button>
                  <Field label={t('cv.field.summary')} hint={t('cv.field.summaryHint')}>
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {SUMMARY_STYLES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => patch({ summaryStyle: s.id })}
                          className={`min-h-[44px] rounded-lg border px-2 py-0.5 text-[9px] font-black ${
                            cv.summaryStyle === s.id ? 'border-[#c4a35a] bg-[#c4a35a]/15 text-white' : 'border-white/10 text-white/55'
                          }`}
                        >
                          {t(`cv.style.${s.id}`)}
                        </button>
                      ))}
                    </div>
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {SUMMARY_LENGTHS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => patch({ summaryLength: s.id })}
                          className={`min-h-[44px] rounded-lg border px-2 py-0.5 text-[9px] font-black ${
                            cv.summaryLength === s.id ? 'border-[#c4a35a] bg-[#c4a35a]/15 text-white' : 'border-white/10 text-white/55'
                          }`}
                        >
                          {t(`cv.length.${s.id}`)}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={cv.summaryLength === 'detailed' ? 5 : 3}
                      className={inputCls}
                      value={cv.summary}
                      onChange={(e) => patch({ summary: e.target.value })}
                      placeholder={t('cv.field.summaryPh')}
                    />
                  </Field>
                  <button type="button" disabled={!!aiBusy} onClick={() => polish('summary')} className={ghostGoldBtn}>
                    {aiBusy === 'summary' ? <NajeThinking size={16} /> : <Sparkles className="h-3.5 w-3.5" />}
                    {t('cv.field.polishSummary')}
                  </button>
                </div>
              </Box>

              <Box
                id="cv-sec-contact"
                icon={<User className="h-4 w-4 text-[#c4a35a]" />}
                title={t('cv.sec.contact')}
                collapsed={fold('cv-sec-contact')}
                active={activeSection === 'cv-sec-contact'}
                onToggle={() => jumpAnchor('cv-sec-contact')}
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Field label={t('cv.field.email')}>
                    <input className={inputCls} value={cv.email} onChange={(e) => patch({ email: e.target.value })} placeholder="name@email.com" dir="ltr" />
                  </Field>
                  <Field label={t('cv.field.phone')}>
                    <input className={inputCls} value={cv.phone} onChange={(e) => patch({ phone: e.target.value })} placeholder="+970..." dir="ltr" />
                  </Field>
                  <Field label={t('cv.field.city')}>
                    <input className={inputCls} value={cv.city} onChange={(e) => patch({ city: e.target.value })} />
                  </Field>
                  <Field label={t('cv.field.country')}>
                    <input className={inputCls} value={cv.country} onChange={(e) => patch({ country: e.target.value })} />
                  </Field>
                  <Field label={t('cv.field.linkedin')}>
                    <input className={inputCls} value={cv.linkedin} onChange={(e) => patch({ linkedin: e.target.value })} dir="ltr" />
                  </Field>
                  <Field label={t('cv.field.portfolio')}>
                    <input className={inputCls} value={cv.portfolio} onChange={(e) => patch({ portfolio: e.target.value })} dir="ltr" />
                  </Field>
                  <Field label={t('cv.field.github')}>
                    <input className={inputCls} value={cv.github || ''} onChange={(e) => patch({ github: e.target.value })} dir="ltr" />
                  </Field>
                  <Field label={t('cv.field.targetRole')}>
                    <input className={inputCls} value={cv.targetRole} onChange={(e) => patch({ targetRole: e.target.value })} />
                  </Field>
                </div>
              </Box>

              <Box
                id="cv-sec-market"
                icon={<Target className="h-4 w-4 text-[#c4a35a]" />}
                title={t('cv.sec.market')}
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
                      className={`min-h-[44px] rounded-xl border px-2 py-2 text-start ${cv.market === m.id ? 'border-[#c4a35a] bg-[#c4a35a]/15' : 'border-white/10 bg-black/25'}`}
                    >
                      <span className="block text-[11px] font-black text-white">{t(`cv.market.${m.id}`)}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-white/40">{t(`cv.market.${cv.market}Hint`)}</p>
                <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCv((c) => applyPersonaDefaults(c, p.id))}
                      className={`min-h-[44px] rounded-lg border px-2 py-1.5 text-[10px] font-black ${cv.persona === p.id ? 'border-[#c4a35a] bg-[#c4a35a]/15 text-white' : 'border-white/10 text-white/55'}`}
                    >
                      {t(`cv.persona.${p.id}`)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-1.5">
                  {(['ar', 'en'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => patch({ lang: l })}
                      className={`min-h-[44px] rounded-lg px-3 py-1.5 text-[11px] font-black ${cv.lang === l ? 'bg-[#c4a35a] text-[#1a140c]' : 'border border-white/10 text-white/60'}`}
                    >
                      {t(l === 'ar' ? 'cv.doc.ar' : 'cv.doc.en')}
                    </button>
                  ))}
                </div>
              </Box>

              <Box
                id="cv-sec-personal"
                icon={<User className="h-4 w-4 text-[#c4a35a]" />}
                title={t('cv.sec.personal')}
                hint={t('cv.sec.personalHint')}
                collapsed={fold('cv-sec-market')}
                active={activeSection === 'cv-sec-market'}
                onToggle={() => jumpAnchor('cv-sec-market')}
                action={
                  <button type="button" onClick={() => patch({ showPersonal: !cv.showPersonal })} className="text-[10px] font-black text-[#e8c36a]">
                    {cv.showPersonal ? t('cv.sec.hidePersonal') : t('cv.sec.showPersonal')}
                  </button>
                }
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Field label={t('cv.field.age')} hint={t('cv.field.ageHint')}>
                    <input className={inputCls} value={cv.age} onChange={(e) => patch({ age: e.target.value })} placeholder="28" />
                  </Field>
                  <Field label={t('cv.field.dob')}>
                    <input className={inputCls} value={cv.dob} onChange={(e) => patch({ dob: e.target.value })} placeholder="1998-04-12" />
                  </Field>
                  <Field label={t('cv.field.gender')} hint={t('cv.field.genderHint')}>
                    <select className={inputCls} value={cv.gender} onChange={(e) => patch({ gender: e.target.value })}>
                      {GENDER_OPTS.map((o) => (
                        <option key={o.id || 'omit'} value={o.id}>
                          {t(o.id ? `cv.gender.${o.id}` : 'cv.gender.omit')}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('cv.field.marital')}>
                    <select className={inputCls} value={cv.marital} onChange={(e) => patch({ marital: e.target.value })}>
                      {MARITAL_OPTS.map((o) => (
                        <option key={o.id || 'omit'} value={o.id}>
                          {t(o.id ? `cv.marital.${o.id}` : 'cv.marital.omit')}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('cv.field.nationality')}>
                    <input className={inputCls} value={cv.nationality} onChange={(e) => patch({ nationality: e.target.value })} />
                  </Field>
                  <Field label={t('cv.field.visa')} hint={t('cv.field.visaHint')}>
                    <input className={inputCls} value={cv.visa} onChange={(e) => patch({ visa: e.target.value })} placeholder={t('cv.field.visaPh')} />
                  </Field>
                  <Field label={t('cv.field.notice')}>
                    <input className={inputCls} value={cv.notice} onChange={(e) => patch({ notice: e.target.value })} placeholder={t('cv.field.noticePh')} />
                  </Field>
                  <Field label={t('cv.field.license')}>
                    <input className={inputCls} value={cv.license} onChange={(e) => patch({ license: e.target.value })} />
                  </Field>
                  <Field label={t('cv.field.availability')}>
                    <input className={inputCls} value={cv.availability} onChange={(e) => patch({ availability: e.target.value })} placeholder={t('cv.field.availabilityPh')} />
                  </Field>
                </div>
              </Box>

              <Box
                id="cv-sec-experience"
                icon={<Briefcase className="h-4 w-4 text-[#c4a35a]" />}
                title={t('cv.sec.experience')}
                hint={t('cv.sec.experienceHint')}
                collapsed={fold('cv-sec-experience')}
                active={activeSection === 'cv-sec-experience'}
                onToggle={() => jumpAnchor('cv-sec-experience')}
                action={
                  <button type="button" onClick={() => patch({ experiences: [...cv.experiences, emptyExperience()] })} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#c4a35a]/40 px-2 py-1 text-[10px] font-black text-[#e8c36a]">
                    <Plus className="h-3 w-3" /> {t('cv.sec.addExp')}
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
                title={t('cv.sec.education')}
                hint={t('cv.sec.educationHint')}
                collapsed={fold('cv-sec-education')}
                active={activeSection === 'cv-sec-education'}
                onToggle={() => jumpAnchor('cv-sec-education')}
                action={
                  <button type="button" onClick={() => patch({ education: [...cv.education, emptyEducation()] })} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#c4a35a]/40 px-2 py-1 text-[10px] font-black text-[#e8c36a]">
                    <Plus className="h-3 w-3" /> {t('cv.sec.addEdu')}
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
                title={t('cv.sec.skills')}
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
                title={t('cv.sec.languages')}
                collapsed={fold('cv-sec-languages')}
                active={activeSection === 'cv-sec-languages'}
                onToggle={() => jumpAnchor('cv-sec-languages')}
                action={
                  <button type="button" onClick={() => patch({ languages: [...cv.languages, emptyLanguage()] })} className="text-[10px] font-black text-[#e8c36a]">
                    {t('cv.sec.addLang')}
                  </button>
                }
              >
                <div className="space-y-2">
                  {cv.languages.map((l) => (
                    <div key={l.id} className="flex gap-2">
                      <input className={inputCls} placeholder={t('cv.field.langPh')} value={l.name} onChange={(e) => setCv((p) => ({ ...p, languages: p.languages.map((x) => (x.id === l.id ? { ...x, name: e.target.value } : x)) }))} />
                      <select className={inputCls} value={l.level} onChange={(e) => setCv((p) => ({ ...p, languages: p.languages.map((x) => (x.id === l.id ? { ...x, level: e.target.value } : x)) }))}>
                        {LANG_LEVELS.map((o) => (
                          <option key={o.id} value={o.id}>
                            {t(`cv.cefr.${o.id}`)}
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
                title={t('cv.sec.projects')}
                collapsed={fold('cv-sec-projects')}
                active={activeSection === 'cv-sec-projects'}
                onToggle={() => jumpAnchor('cv-sec-projects')}
                action={
                  <button type="button" onClick={() => patch({ projects: [...cv.projects, emptyProject()] })} className="text-[10px] font-black text-[#e8c36a]">
                    {t('cv.sec.addProject')}
                  </button>
                }
              >
                  {cv.projects.length === 0 && <p className="text-[11px] text-white/35">{t('cv.sec.projectsEmpty')}</p>}
                  {cv.projects.map((p) => (
                    <div key={p.id} className="mb-2 grid grid-cols-2 gap-2">
                      <input className={inputCls} placeholder={t('cv.field.projectName')} value={p.name} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)) }))} />
                      <input className={inputCls} placeholder={t('cv.field.role')} value={p.role} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, role: e.target.value } : x)) }))} />
                      <input className={inputCls} placeholder={t('cv.field.year')} value={p.year} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, year: e.target.value } : x)) }))} />
                      <input className={inputCls} placeholder={t('cv.field.link')} value={p.link || ''} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, link: e.target.value } : x)) }))} dir="ltr" />
                      <input className={`${inputCls} col-span-2`} placeholder={t('cv.field.did')} value={p.detail} onChange={(e) => setCv((c) => ({ ...c, projects: c.projects.map((x) => (x.id === p.id ? { ...x, detail: e.target.value } : x)) }))} />
                      <button type="button" onClick={() => setCv((c) => ({ ...c, projects: c.projects.filter((x) => x.id !== p.id) }))} className="col-span-2 min-h-[44px] text-start text-[10px] text-rose-300">
                        {t('cv.field.delete')}
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
                className={`flex min-h-[44px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-[12px] font-black text-[#e8c36a] ${
                  activeSection === 'cv-sec-extra' ? 'border-[#c4a35a]/45 bg-white/[0.05]' : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                {t('cv.sec.extra')}
                <ChevronDown className={`h-4 w-4 transition ${extraOpen ? 'rotate-180' : ''}`} />
              </button>

              {extraOpen && (
                <div className="space-y-3">
                  <Box
                    id="cv-sec-courses"
                    icon={<Award className="h-4 w-4 text-[#c4a35a]" />}
                    title={t('cv.sec.courses')}
                    hint={t('cv.sec.coursesHint')}
                    action={
                      <button type="button" onClick={() => patch({ courses: [...cv.courses, emptyCourse()] })} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#c4a35a]/40 px-2 py-1 text-[10px] font-black text-[#e8c36a]">
                        <Plus className="h-3 w-3" /> {t('cv.sec.addCourse')}
                      </button>
                    }
                  >
                    {cv.courses.length === 0 && <p className="text-[11px] text-white/35">{t('cv.sec.coursesEmpty')}</p>}
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
                    title={t('cv.sec.certs')}
                    action={
                      <button type="button" onClick={() => patch({ certificates: [...cv.certificates, emptyCertificate()] })} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#c4a35a]/40 px-2 py-1 text-[10px] font-black text-[#e8c36a]">
                        <Plus className="h-3 w-3" /> {t('cv.sec.addCert')}
                      </button>
                    }
                  >
                    <div className="space-y-2">
                      {cv.certificates.map((c) => (
                        <div key={c.id} className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 p-2">
                          <input className={inputCls} placeholder={t('cv.field.certName')} value={c.name} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)) }))} />
                          <input className={inputCls} placeholder={t('cv.field.issuer')} value={c.issuer} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, issuer: e.target.value } : x)) }))} />
                          <input className={inputCls} placeholder={t('cv.field.year')} value={c.year} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, year: e.target.value } : x)) }))} />
                          <input className={inputCls} placeholder={t('cv.field.certId')} value={c.idNumber} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, idNumber: e.target.value } : x)) }))} />
                          <input className={inputCls} placeholder={t('cv.field.expires')} value={c.expires} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, expires: e.target.value } : x)) }))} />
                          <input className={inputCls} placeholder={t('cv.field.status')} value={c.status || ''} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, status: e.target.value } : x)) }))} />
                          <input className={`${inputCls} col-span-2`} placeholder={t('cv.field.verifyUrl')} value={c.url || ''} onChange={(e) => setCv((p) => ({ ...p, certificates: p.certificates.map((x) => (x.id === c.id ? { ...x, url: e.target.value } : x)) }))} dir="ltr" />
                          <button type="button" onClick={() => setCv((p) => ({ ...p, certificates: p.certificates.filter((x) => x.id !== c.id) }))} className="col-span-2 min-h-[44px] text-start text-[10px] text-rose-300">
                            {t('cv.field.delete')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </Box>

                  <Box
                    icon={<Award className="h-4 w-4 text-[#c4a35a]" />}
                    title={t('cv.sec.achievements')}
                    action={
                      <button type="button" onClick={() => patch({ achievements: [...cv.achievements, emptyAchievement()] })} className="min-h-[44px] text-[10px] font-black text-[#e8c36a]">
                        {t('cv.sec.addAchievement')}
                      </button>
                    }
                  >
                    {cv.achievements.map((a) => (
                      <div key={a.id} className="mb-2 grid grid-cols-2 gap-2">
                        <input className={inputCls} placeholder={t('cv.field.title')} value={a.title} onChange={(e) => setCv((c) => ({ ...c, achievements: c.achievements.map((x) => (x.id === a.id ? { ...x, title: e.target.value } : x)) }))} />
                        <input className={inputCls} placeholder={t('cv.field.org')} value={a.org} onChange={(e) => setCv((c) => ({ ...c, achievements: c.achievements.map((x) => (x.id === a.id ? { ...x, org: e.target.value } : x)) }))} />
                        <input className={inputCls} placeholder={t('cv.field.year')} value={a.year} onChange={(e) => setCv((c) => ({ ...c, achievements: c.achievements.map((x) => (x.id === a.id ? { ...x, year: e.target.value } : x)) }))} />
                        <input className={inputCls} placeholder={t('cv.field.detail')} value={a.detail} onChange={(e) => setCv((c) => ({ ...c, achievements: c.achievements.map((x) => (x.id === a.id ? { ...x, detail: e.target.value } : x)) }))} />
                        <button type="button" onClick={() => setCv((c) => ({ ...c, achievements: c.achievements.filter((x) => x.id !== a.id) }))} className="col-span-2 min-h-[44px] text-start text-[10px] text-rose-300">
                          {t('cv.field.delete')}
                        </button>
                      </div>
                    ))}
                  </Box>

                  <Box
                    icon={<FileText className="h-4 w-4 text-[#c4a35a]" />}
                    title={t('cv.sec.publications')}
                    action={
                      <button type="button" onClick={() => patch({ publications: [...cv.publications, emptyPublication()] })} className="min-h-[44px] text-[10px] font-black text-[#e8c36a]">
                        {t('cv.sec.addPublication')}
                      </button>
                    }
                  >
                    {cv.publications.map((pub) => (
                      <div key={pub.id} className="mb-2 grid grid-cols-2 gap-2">
                        <input className={`${inputCls} col-span-2`} placeholder={t('cv.field.title')} value={pub.title} onChange={(e) => setCv((c) => ({ ...c, publications: c.publications.map((x) => (x.id === pub.id ? { ...x, title: e.target.value } : x)) }))} />
                        <input className={inputCls} placeholder={t('cv.field.venue')} value={pub.venue} onChange={(e) => setCv((c) => ({ ...c, publications: c.publications.map((x) => (x.id === pub.id ? { ...x, venue: e.target.value } : x)) }))} />
                        <input className={inputCls} placeholder={t('cv.field.year')} value={pub.year} onChange={(e) => setCv((c) => ({ ...c, publications: c.publications.map((x) => (x.id === pub.id ? { ...x, year: e.target.value } : x)) }))} />
                        <input className={`${inputCls} col-span-2`} placeholder="DOI" value={pub.doi} onChange={(e) => setCv((c) => ({ ...c, publications: c.publications.map((x) => (x.id === pub.id ? { ...x, doi: e.target.value } : x)) }))} dir="ltr" />
                        <button type="button" onClick={() => setCv((c) => ({ ...c, publications: c.publications.filter((x) => x.id !== pub.id) }))} className="col-span-2 min-h-[44px] text-start text-[10px] text-rose-300">
                          {t('cv.field.delete')}
                        </button>
                      </div>
                    ))}
                  </Box>

                  <Box
                    icon={<FileText className="h-4 w-4 text-[#c4a35a]" />}
                    title={t('cv.sec.custom')}
                    action={
                      <button type="button" onClick={() => patch({ customSections: [...cv.customSections, emptyCustomSection()] })} className="min-h-[44px] text-[10px] font-black text-[#e8c36a]">
                        {t('cv.sec.addSection')}
                      </button>
                    }
                  >
                    {cv.customSections.map((s) => (
                      <div key={s.id} className="mb-2 space-y-2">
                        <input className={inputCls} placeholder={t('cv.field.sectionTitle')} value={s.title} onChange={(e) => setCv((c) => ({ ...c, customSections: c.customSections.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)) }))} />
                        <textarea rows={2} className={inputCls} placeholder={t('cv.field.content')} value={s.body} onChange={(e) => setCv((c) => ({ ...c, customSections: c.customSections.map((x) => (x.id === s.id ? { ...x, body: e.target.value } : x)) }))} />
                        <button type="button" onClick={() => setCv((c) => ({ ...c, customSections: c.customSections.filter((x) => x.id !== s.id) }))} className="min-h-[44px] text-[10px] text-rose-300">
                          {t('cv.field.delete')}
                        </button>
                      </div>
                    ))}
                  </Box>

                  <Box icon={<FileText className="h-4 w-4 text-[#c4a35a]" />} title={t('cv.sec.boxes')}>
                    <div className="space-y-2">
                      <Field label={t('cv.field.military')}>
                        <input className={inputCls} value={cv.military} onChange={(e) => patch({ military: e.target.value })} />
                      </Field>
                      <Field label={t('cv.field.volunteer')}>
                        <textarea rows={2} className={inputCls} value={cv.volunteer} onChange={(e) => patch({ volunteer: e.target.value })} />
                      </Field>
                      <Field label={t('cv.field.references')} hint={t('cv.field.referencesHint')}>
                        <input className={inputCls} value={cv.references} onChange={(e) => patch({ references: e.target.value })} placeholder={t('cv.field.referencesPh')} />
                      </Field>
                    </div>
                  </Box>

                  <Box
                    id="cv-sec-cover"
                    icon={<FileText className="h-4 w-4 text-[#c4a35a]" />}
                    title={t('cv.pack.title')}
                    hint={t('cv.pack.hint')}
                  >
                    <div className="space-y-3">
                      <Field label={t('cv.pack.cover')}>
                        <textarea rows={6} className={inputCls} value={cv.coverLetter} onChange={(e) => patch({ coverLetter: e.target.value })} placeholder={t('cv.field.coverPh')} />
                      </Field>
                      <button type="button" disabled={!!aiBusy} onClick={() => polish('cover')} className={ghostGoldBtn}>
                        {aiBusy === 'cover' ? <NajeThinking size={16} /> : <Sparkles className="h-3.5 w-3.5" />}
                        {t('cv.pack.genCover')}
                      </button>
                      <Field label={t('cv.pack.linkedin')}>
                        <textarea rows={5} className={inputCls} value={cv.linkedinAbout || ''} onChange={(e) => patch({ linkedinAbout: e.target.value })} placeholder={t('cv.pack.linkedinPh')} />
                      </Field>
                      <button type="button" disabled={!!aiBusy} onClick={() => polish('linkedin')} className={ghostGoldBtn}>
                        {aiBusy === 'linkedin' ? <NajeThinking size={16} /> : <Sparkles className="h-3.5 w-3.5" />}
                        {t('cv.pack.genLinkedin')}
                      </button>
                      <Field label={t('cv.pack.bio')}>
                        <textarea rows={3} className={inputCls} value={cv.shortBio || ''} onChange={(e) => patch({ shortBio: e.target.value })} placeholder={t('cv.pack.bioPh')} />
                      </Field>
                      <button type="button" disabled={!!aiBusy} onClick={() => polish('bio')} className={ghostGoldBtn}>
                        {aiBusy === 'bio' ? <NajeThinking size={16} /> : <Sparkles className="h-3.5 w-3.5" />}
                        {t('cv.pack.genBio')}
                      </button>
                    </div>
                  </Box>
                </div>
              )}
              </div>

              <Box
                id="cv-sec-template"
                icon={<Sparkles className="h-4 w-4 text-[#c4a35a]" />}
                title={t('cv.sec.design')}
                hint={cv.atsMode ? t('cv.studio.atsOn') : t('cv.studio.visualOn')}
                collapsed={fold('cv-sec-template')}
                active={activeSection === 'cv-sec-template'}
                onToggle={() => jumpAnchor('cv-sec-template')}
              >
                <div className="mb-3 flex gap-1.5">
                  <button type="button" onClick={() => setCv((p) => applyAtsMode(p, true))} className={cv.atsMode ? goldBtn : ghostGoldBtn}>
                    {t('cv.studio.modeAts')}
                  </button>
                  <button type="button" onClick={() => setCv((p) => applyAtsMode(p, false))} className={!cv.atsMode ? goldBtn : ghostGoldBtn}>
                    {t('cv.studio.modeVisual')}
                  </button>
                </div>
                <p className="mb-3 text-[10px] leading-relaxed text-white/45">
                  {cv.atsMode ? t('cv.studio.atsNote') : t('cv.studio.visualNote')}
                </p>
                <input
                  className={`${inputCls} mb-3`}
                  value={templateQuery}
                  onChange={(e) => setTemplateQuery(e.target.value)}
                  placeholder={t('cv.field.templateSearchPh')}
                  aria-label={t('cv.field.templateSearch')}
                />
                {templateShown.length === 0 && <p className="mb-2 text-[11px] text-white/40">{t('cv.field.noTemplates')}</p>}
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {templateShown.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() =>
                        patch({
                          template: row.id,
                          showPhoto: row.id === 'naje' || row.id === 'jadarat' ? false : cv.showPhoto,
                          atsMode: row.ats ? cv.atsMode : false,
                        })
                      }
                      className={`min-h-[44px] rounded-xl border p-2 text-start ${cv.template === row.id ? 'border-[#c4a35a] bg-[#c4a35a]/15' : 'border-white/10'}`}
                    >
                      <span className="block text-[11px] font-black text-white">{t(`cv.template.${row.id}`)}</span>
                      <span className="mt-0.5 block text-[9px] text-white/40">{t(`cv.template.${row.id}Hint`)}</span>
                    </button>
                  ))}
                </div>
                {usesPaperAccent(cv.template) && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[11px] font-black text-[#e8c36a]">{t('cv.studio.accent')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ACCENT_PRESETS.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => patch({ accentColor: a.hex })}
                          className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-black ${
                            (cv.accentColor || '#c4a35a') === a.hex ? 'border-[#c4a35a] text-white' : 'border-white/10 text-white/60'
                          }`}
                        >
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: a.hex }} />
                          {t(`cv.accent.${a.id}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Box>

              <button type="button" onClick={resetDraft} className="w-full text-center text-[10px] font-black text-white/30">
                {t('cv.studio.newStart')}
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
                      toast.info(t('cv.toast.skill', { name: k }));
                    }}
                  />
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 xl:col-span-2">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-black text-white">{t('cv.pack.cover')}</h3>
                      <button type="button" disabled={!!aiBusy} onClick={() => polish('cover')} className={ghostGoldBtn}>
                        {aiBusy === 'cover' ? <NajeThinking size={16} /> : <Sparkles className="h-3.5 w-3.5" />}
                        {t('cv.pack.genCover')}
                      </button>
                    </div>
                    <textarea rows={5} className={inputCls} value={cv.coverLetter} onChange={(e) => patch({ coverLetter: e.target.value })} placeholder={t('cv.field.coverCoachPh')} />
                  </div>
                </div>
              )}

              {(tab === 'preview' || tab === 'build') && (
                <CvScanOverlay cv={cv} active={scanMode} onToggle={() => setScanMode((s) => !s)}>
                  <CvPaperStage>
                    <CvPreview cv={cv} sheetId="naje-cv-preview" />
                  </CvPaperStage>
                </CvScanOverlay>
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
