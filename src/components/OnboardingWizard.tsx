import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Sparkles, ArrowLeft, ArrowRight, Rocket,
  Bot, Wand2, Palette, Clapperboard, Film, FileBadge, Code2, BookOpen,
} from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAppStore } from '../store';
import { useI18n } from '../i18n';
import { toast } from '../toastStore';
import LanguageSelector from './LanguageSelector';

const STUDIO_CHIPS = [
  { id: 'agent', icon: Bot },
  { id: 'prompt', icon: Wand2 },
  { id: 'creative', icon: Palette },
  { id: 'ad', icon: Clapperboard },
  { id: 'motion', icon: Film },
  { id: 'cv', icon: FileBadge },
  { id: 'dev', icon: Code2 },
  { id: 'source', icon: BookOpen },
] as const;

export default function OnboardingWizard() {
  const { user, setUser } = useAppStore();
  const { t, isRtl } = useI18n();
  const reduce = useReducedMotion();
  const stepKey = user ? `naje_onboarding_step_${user.uid}` : '';
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const n = Number(sessionStorage.getItem(stepKey));
      return n === 1 || n === 2 ? n : 0;
    } catch {
      return 0;
    }
  });
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stepKey) return;
    try { sessionStorage.setItem(stepKey, String(currentStep)); } catch {}
  }, [currentStep, stepKey]);

  if (!user || user.hasCompletedOnboarding) return null;

  const handleComplete = async () => {
    if (loading || !user) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), { hasCompletedOnboarding: true });
      setUser({ ...user, hasCompletedOnboarding: true });
      try { localStorage.setItem('naje_onboarding_done_' + user.uid, 'true'); } catch {}
      try { sessionStorage.removeItem(stepKey); } catch {}
      toast.success(t('onboarding.completedToast'));
    } catch (err) {
      console.error('Error completing onboarding:', err);
      toast.error(t('chatui.onboardingSaveFail'));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: t('welcome.title'),
      subtitle: t('welcome.lead'),
      body: (
        <div className="space-y-4 text-start">
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{t('welcome.tagline')}</p>
          <LanguageSelector variant="card" />
        </div>
      ),
    },
    {
      title: t('onboarding.step2Title'),
      subtitle: t('onboarding.step2Desc'),
      body: (
        <div className="grid grid-cols-1 gap-2 text-start max-h-[42vh] overflow-y-auto pr-1">
          {STUDIO_CHIPS.map(({ id, icon: Icon }) => (
            <div key={id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-200">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white">{t(`welcome.card.${id}.name`)}</h4>
                <p className="text-[11px] text-white/60 leading-relaxed mt-0.5">{t(`welcome.card.${id}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: t('onboarding.step1CardTitle'),
      subtitle: t('welcome.tagline'),
      body: (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-start">
          <p className="text-xs text-white/75 leading-relaxed">{t('onboarding.step1CardDesc')}</p>
        </div>
      ),
    },
  ];

  const step = steps[currentStep];
  const NextArrow = isRtl ? ArrowLeft : ArrowRight;
  const PrevArrow = isRtl ? ArrowRight : ArrowLeft;
  const offset = isRtl ? -1 : 1;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d14] text-white shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="pointer-events-none absolute -top-24 -start-10 h-56 w-56 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="h-1.5 w-full bg-white/10 flex">
          {steps.map((_, idx) => (
            <div key={idx} className="h-full flex-1">
              {idx <= currentStep && (
                <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-400" />
              )}
            </div>
          ))}
        </div>
        <div className="relative p-5 sm:p-7 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              initial={reduce ? false : { opacity: 0, x: direction * 28 * offset }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -28 * offset }}
              transition={{ duration: 0.28 }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 border border-white/10">
                <Sparkles className="w-6 h-6 text-indigo-300" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black leading-tight">{step.title}</h2>
              <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed">{step.subtitle}</p>
              <div className="mt-5">{step.body}</div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="relative p-4 sm:p-5 border-t border-white/10 flex items-center justify-between gap-2">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={() => { setDirection(-1); setCurrentStep((p) => p - 1); }}
              className="px-3 py-2 text-xs font-bold text-white/70 hover:text-white flex items-center gap-1"
            >
              <PrevArrow className="w-4 h-4" />
              {t('onboarding.prevBtn')}
            </button>
          ) : (
            <div className="px-3 py-2" />
          )}
          <button
            type="button"
            onClick={() => currentStep < steps.length - 1
              ? (setDirection(1), setCurrentStep((p) => p + 1))
              : handleComplete()}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-white text-gray-950 text-xs font-black flex items-center gap-2 disabled:opacity-50"
          >
            {currentStep === steps.length - 1 ? (
              <>
                {loading ? t('termsModal.acceptingBtn') : t('onboarding.finishBtn')}
                <Rocket className="w-4 h-4" />
              </>
            ) : (
              <>
                {t('onboarding.nextBtn')}
                <NextArrow className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
