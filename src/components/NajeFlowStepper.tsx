import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Check, AlertCircle, Sparkles } from 'lucide-react';
import { parseAndCategorizeError, parseAndCategorizeErrorSync, FormattedError } from '../utils/errorFormatter';

interface NajeFlowStepperProps {
  jobId: string;
  onComplete?: () => void;
}

interface TimelineStep {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending' | 'failed';
}

export default function NajeFlowStepper({ jobId, onComplete }: NajeFlowStepperProps) {
  const [jobData, setJobData] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [errorCat, setErrorCat] = useState<FormattedError | null>(null);

  useEffect(() => {
    if (jobData?.status === 'failed' && jobData.error) {
      let cancelled = false;
      setErrorCat(parseAndCategorizeErrorSync(jobData.error));
      parseAndCategorizeError(jobData.error, { chatType: jobData.docType }).then(result => {
        if (!cancelled) setErrorCat(result);
      });
      return () => { cancelled = true; };
    } else {
      setErrorCat(null);
    }
  }, [jobData?.status, jobData?.error, jobData?.docType]);

  useEffect(() => {
    if (!jobId) return;
    const unsub = onSnapshot(doc(db, 'generation_jobs', jobId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setJobData(data);
        if (data.status === 'completed' && onComplete) {
          onComplete();
        }
      }
    }, (error) => {
      console.warn('Job stepper listen error:', error);
    });
    return () => unsub();
  }, [jobId, onComplete]);

  // Until the job document arrives, show a clean "preparing" placeholder instead
  // of a half-empty stepper (this was the flashing "ghost" screen).
  if (!jobData) {
    return (
      <div className="w-full max-w-[520px] bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-5 flex items-center gap-3">
        <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          جارٍ تجهيز مساحة العمل وبدء التخطيط...
        </span>
      </div>
    );
  }

  // Compute steps dynamically
  const getSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [];
    const isFailed = jobData?.status === 'failed';

    // Step 1: Planning
    let planStatus: TimelineStep['status'] = 'pending';
    if (isFailed) {
      planStatus = 'failed';
    } else if (jobData?.status && jobData.status !== 'starting') {
      planStatus = 'completed';
    } else if (jobData?.status === 'starting') {
      planStatus = 'active';
    }
    steps.push({
      id: 'planning',
      label: 'التخطيط وصياغة الفهرس المبدئي',
      status: planStatus
    });

    // Step 2: Dynamic Sections
    // No fake placeholder sections — show only real sections once they arrive.
    const sectionsList = jobData?.sections || [];

    sectionsList.forEach((sec: any, index: number) => {
      let secStatus: TimelineStep['status'] = 'pending';
      
      if (isFailed) {
        secStatus = 'failed';
      } else if (jobData?.status === 'completed' || jobData?.status === 'assembling') {
        secStatus = 'completed';
      } else if (jobData?.status === 'writing_section') {
        const activeIdx = jobData?.currentStepIndex || 1;
        if (activeIdx > index + 1) {
          secStatus = 'completed';
        } else if (activeIdx === index + 1) {
          secStatus = 'active';
        } else {
          secStatus = 'pending';
        }
      } else if (jobData?.status === 'toc_generated') {
        if (index === 0) {
          secStatus = 'active';
        } else {
          secStatus = 'pending';
        }
      } else if (jobData?.status && jobData.status !== 'starting') {
        secStatus = 'completed';
      }

      steps.push({
        id: `section-${index}`,
        label: `صياغة وتحرير: ${sec.title}`,
        status: secStatus
      });
    });

    // Step 3: Assembling
    let assembleStatus: TimelineStep['status'] = 'pending';
    if (isFailed) {
      assembleStatus = 'failed';
    } else if (jobData?.status === 'completed') {
      assembleStatus = 'completed';
    } else if (jobData?.status === 'assembling') {
      assembleStatus = 'active';
    }
    const docTypeLabel = (jobData?.docType === 'pdf_slides' ? 'شرائح PDF' : jobData?.docType === 'pdf_doc' ? 'مستند PDF' : jobData?.docType || 'pdf').toUpperCase();
    steps.push({
      id: 'assembling',
      label: `دمج العناصر والتحويل للصيغة النهائية (${docTypeLabel})`,
      status: assembleStatus
    });

    // Step 4: Ready/Completed
    let finalizeStatus: TimelineStep['status'] = 'pending';
    if (isFailed) {
      finalizeStatus = 'failed';
    } else if (jobData?.status === 'completed') {
      finalizeStatus = 'active'; // highlighted when done
    }
    steps.push({
      id: 'completed',
      label: 'المستند جاهز للتحميل والتحليق!',
      status: finalizeStatus
    });

    return steps;
  };

  const steps = getSteps();
  const currentStepLabel = jobData?.stepLabel || 'جاري صياغة المستند بذكاء ناجي الإبداعي...';
  const progressPercent = jobData?.status === 'completed' ? 100 : Math.round(((jobData?.currentStepIndex || 0) / (jobData?.totalSteps || 4)) * 100);

  return (
    <div className="w-full max-w-xl mx-auto my-4 bg-gray-50 dark:bg-gray-900 border border-gray-500 dark:border-gray-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-sm">
      {/* Header / Clickable Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-right hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">
              {jobData?.status === 'completed' ? 'اكتمل إعداد المستند!' : 'جاري التنفيذ بذكاء Naje AI...'}
            </span>
            <span className="text-xs text-gray-800 dark:text-gray-400 mt-0.5 line-clamp-1 font-mono">
              {currentStepLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {jobData?.status !== 'completed' && jobData?.status !== 'failed' && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              {progressPercent}%
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-800 dark:text-gray-400 " />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-800 dark:text-gray-400 " />
          )}
        </div>
      </button>

      {/* Progress Line */}
      <div className="w-full h-[2px] bg-white dark:bg-gray-900">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#D4AF37]"
        />
      </div>

      {/* Expanded Stepper Body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-gray-500 dark:border-gray-900 bg-gray-50 dark:bg-gray-950/80"
          >
            <div className="relative px-6 py-5 flex flex-col gap-5">
              {/* Branded progress rail — replaces NajeWorm */}
              <div className="absolute right-[10px] top-7 bottom-4 w-[3px] pointer-events-none z-0">
                <div className="absolute inset-0 rounded-full bg-gray-200 dark:bg-gray-800" />
                <motion.div
                  className="absolute top-0 left-0 w-full rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, #EBC85A 0%, #D4AF37 55%, #8B5CF6 100%)',
                    boxShadow: '0 0 10px rgba(212,175,55,0.45)'
                  }}
                  animate={{ height: `${progressPercent}%` }}
                  transition={{ type: 'spring', stiffness: 38, damping: 18 }}
                />
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-[4px]"
                  style={{
                    background: 'linear-gradient(145deg,#EBC85A,#D4AF37)',
                    boxShadow: '0 0 8px rgba(212,175,55,0.7)'
                  }}
                  animate={{ top: `${progressPercent}%` }}
                  transition={{ type: 'spring', stiffness: 38, damping: 18 }}
                />
              </div>

              {steps.map((step, idx) => {
                return (
                  <div key={step.id} className="relative flex gap-4 text-right">
                    {/* Step Indicator */}
                    <div className="relative z-10 flex items-center justify-center">
                      {step.status === 'completed' && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: [0.8, 1.15, 1], opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-[#EBC85A] to-[#D4AF37] flex items-center justify-center text-gray-950 font-bold shadow-md shadow-[#D4AF37]/20"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </motion.div>
                      )}

                      {step.status === 'active' && (
                        <div className="w-6 h-6 relative flex items-center justify-center">
                          <motion.span
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 rounded-full bg-[#8B5CF6]/30"
                          />
                          <span className="w-3 h-3 rounded-full bg-[#D4AF37] z-10 shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                        </div>
                      )}

                      {step.status === 'pending' && (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-500 dark:border-gray-700" />
                        </div>
                      )}

                      {step.status === 'failed' && (
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Step Text */}
                    <div className="flex-1 pt-0.5">
                      <span
                        className={`text-sm font-medium transition-colors duration-300 ${
                          step.status === 'completed'
                            ? 'text-gray-900 dark:text-gray-200'
                            : step.status === 'active'
                            ? 'text-[#D4AF37] font-semibold'
                            : step.status === 'failed'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-800 dark:text-gray-400 '
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {jobData?.status === 'failed' && errorCat && (
                <div className="mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs text-right flex flex-col gap-1">
                  <span className="font-bold">{errorCat.emoji} {errorCat.title}</span>
                  <span>{errorCat.intro}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
