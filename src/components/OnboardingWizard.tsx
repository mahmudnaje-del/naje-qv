import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Image as ImageIcon, Film, FileText, ArrowLeft, ArrowRight, Check, Play, Zap, ShieldCheck, Layers, Rocket } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAppStore } from '../store';
import { useI18n } from '../i18n';
import { toast } from '../toastStore';

export default function OnboardingWizard() {
  const { user, setUser } = useAppStore();
  const { t, isRtl } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [loading, setLoading] = useState(false);

  // If user already completed onboarding, or if there's no user, don't show
  if (!user || user.hasCompletedOnboarding) {
    return null;
  }

  const handleComplete = async () => {
    if (loading || !user) return;
    try {
      setLoading(true);

      // Persist to Firestore first
      await updateDoc(doc(db, 'users', user.uid), {
        hasCompletedOnboarding: true
      });

      // Optimistically update local state after successful persistence
      setUser({ ...user, hasCompletedOnboarding: true });
      try {
        localStorage.setItem('naje_onboarding_done_' + user.uid, 'true');
      } catch (_) {}

      toast.success(t('onboarding.completedToast') || 'تم إنهاء جولة التعريف بنجاح!');
    } catch (err) {
      console.error('Error completing onboarding:', err);
      toast.error('تعذّر حفظ الجولة سحابياً، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const steps = [
    {
      title: t('onboarding.step1Title'),
      subtitle: t('onboarding.welcomeSubtitle'),
      icon: <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500" />,
      accentColor: 'indigo',
      content: (
        <div className="space-y-3 text-start">
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {t('onboarding.step1Desc')}
          </p>
          <div className="p-3 sm:p-4 bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl mt-0.5 shrink-0">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-gray-900 dark:text-white">
                {t('onboarding.step1CardTitle')}
              </h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                {t('onboarding.step1CardDesc')}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.step2Title'),
      subtitle: t('onboarding.step2Desc'),
      icon: <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-pink-500" />,
      accentColor: 'pink',
      content: (
        <div className="grid grid-cols-1 gap-2.5 text-start">
          <div className="p-2.5 sm:p-3 border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 rounded-xl flex items-start gap-2.5">
            <div className="p-2 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-lg mt-0.5 shrink-0"><FileText className="w-4 h-4" /></div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                {t('onboarding.step2Item1Title')}
              </h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-tight">
                {t('onboarding.step2Item1Desc')}
              </p>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 rounded-xl flex items-start gap-2.5">
            <div className="p-2 bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-lg mt-0.5 shrink-0"><ImageIcon className="w-4 h-4" /></div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                {t('onboarding.step2Item2Title')}
              </h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-tight">
                {t('onboarding.step2Item2Desc')}
              </p>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 rounded-xl flex items-start gap-2.5">
            <div className="p-2 bg-pink-500/15 text-pink-600 dark:text-pink-400 rounded-lg mt-0.5 shrink-0"><Film className="w-4 h-4" /></div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                {t('onboarding.step2Item3Title')}
              </h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-tight">
                {t('onboarding.step2Item3Desc')}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.step3Title'),
      subtitle: t('onboarding.step3Desc'),
      icon: <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />,
      accentColor: 'emerald',
      content: (
        <div className="space-y-3 text-start">
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {t('onboarding.step3Desc')}
          </p>
          <div className="p-3 sm:p-4 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 rounded-2xl space-y-1.5">
            <h4 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('onboarding.step3CardTitle')}</span>
            </h4>
            <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('onboarding.step3CardDesc')}
            </p>
          </div>
        </div>
      )
    }
  ];

  const step = steps[currentStep];
  const NextArrow = isRtl ? ArrowLeft : ArrowRight;
  const PrevArrow = isRtl ? ArrowRight : ArrowLeft;

  // Motion variants for smooth slide animation
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? (isRtl ? -50 : 50) : (isRtl ? 50 : -50),
      opacity: 0,
      scale: 0.96
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 28 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.25 }
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? (isRtl ? -50 : 50) : (isRtl ? 50 : -50),
      opacity: 0,
      scale: 0.96,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 28 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] my-auto"
      >
        {/* Top Progress bar */}
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 flex relative overflow-hidden">
          {steps.map((_, idx) => (
            <div key={idx} className="h-full flex-1 relative bg-gray-200 dark:bg-gray-800">
              {idx <= currentStep && (
                <motion.div
                  layoutId={`step-bar-${idx}`}
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full"
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Animated Content Body */}
        <div className="p-5 sm:p-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center text-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex flex-col items-center"
            >
              <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 shadow-inner">
                {step.icon}
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white mb-1.5 text-center leading-snug">
                {step.title}
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm text-center leading-relaxed">
                {step.subtitle}
              </p>

              <div className="w-full text-start">
                {step.content}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between gap-2 shrink-0">
          {/* Main Action Button */}
          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black rounded-xl transition shadow-lg shadow-indigo-500/25 cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? t('termsModal.acceptingBtn') : t('onboarding.finishBtn')}</span>
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-black rounded-xl transition shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <span>{t('onboarding.nextBtn')}</span>
              <NextArrow className="w-4 h-4" />
            </button>
          )}

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentStep ? 1 : -1);
                  setCurrentStep(idx);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep ? 'bg-indigo-600 w-5 sm:w-6' : 'bg-gray-300 dark:bg-gray-700 w-2 hover:bg-gray-400'
                }`}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Secondary Action / Skip */}
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition text-xs font-extrabold cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <PrevArrow className="w-4 h-4" />
              <span>{t('onboarding.prevBtn')}</span>
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
