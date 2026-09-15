import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, AlertCircle, Volume2, Image as ImageIcon, Video as VideoIcon, FileText, Layout, Mic, Film, Brain } from 'lucide-react';
import { parseAndCategorizeError, parseAndCategorizeErrorSync, FormattedError } from '../utils/errorFormatter';

interface NajeProgressLineProps {
  jobId?: string;
  jobType?: string;
  simulate?: boolean;
  isCompleted?: boolean;
  onFinished?: () => void;
  fallbackLabel?: string;
}

export default function NajeProgressLine({
  jobId,
  jobType,
  simulate = false,
  isCompleted = false,
  onFinished,
  fallbackLabel
}: NajeProgressLineProps) {
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState(fallbackLabel || 'جاري المعالجة والتوليد بلمسة ناجي الذكية...');
  const [status, setStatus] = useState<'generating' | 'completed' | 'failed'>('generating');
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCat, setErrorCat] = useState<FormattedError | null>(null);
  const [detectedType, setDetectedType] = useState<string>(jobType || 'text');

  useEffect(() => {
    if (jobType) {
      setDetectedType(jobType);
    }
  }, [jobType]);

  useEffect(() => {
    if (status === 'failed' && errorMsg) {
      let cancelled = false;
      setErrorCat(parseAndCategorizeErrorSync(errorMsg));
      parseAndCategorizeError(errorMsg).then(result => {
        if (!cancelled) setErrorCat(result);
      });
      return () => { cancelled = true; };
    } else {
      setErrorCat(null);
    }
  }, [status, errorMsg]);
  
  // Ref to hold current state to prevent stale closures
  const stateRef = useRef({ progress, status });
  stateRef.current = { progress, status };

  // 1. Real-time Firestore Subscription (if jobId is provided and not simulated)
  useEffect(() => {
    if (!jobId || simulate) return;

    const unsub = onSnapshot(doc(db, 'generation_jobs', jobId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.type) {
          setDetectedType(data.type);
        }
        if (data.status === 'failed') {
          setStatus('failed');
          setErrorMsg(data.error || 'حدث خطأ غير متوقع أثناء معالجة الطلب.');
          setLabel(data.stepLabel || 'فشلت معالجة الطلب.');
        } else {
          const rawProg = typeof data.progress === 'number' ? data.progress : 15;
          setProgress(prev => Math.max(prev, rawProg));
          if (data.stepLabel) {
            setLabel(data.stepLabel);
          }
          if (data.status === 'completed' || rawProg >= 100) {
            setProgress(100);
            setStatus('completed');
            if (onFinished) {
              setTimeout(onFinished, 1000);
            }
          }
        }
      }
    }, (error) => {
      console.error("Progress Line Firestore sub failed:", error);
    });

    return () => unsub();
  }, [jobId, simulate, onFinished]);

  // 2. Honest "warm-up" only: nudge the bar to a small floor while we wait for the FIRST
  //    real Firestore stage. After real stages arrive, they own the value. We never fabricate
  //    a fake percentage toward completion; between real stages the bar renders indeterminate
  //    (see the moving-shimmer overlay in the render / FIX 7c).
  useEffect(() => {
    if (isCompleted || status === 'completed' || status === 'failed') return;
    let animationFrameId: number;
    const startTime = Date.now();

    const warmUp = () => {
      const elapsed = Date.now() - startTime;
      // Ease only up to a 15% floor over ~2s, purely so the bar isn't visually empty at start.
      const floor = Math.min(15, Math.round(15 * (1 - Math.exp(-elapsed / 1000))));
      setProgress(prev => Math.max(prev, floor));
      if (stateRef.current.status !== 'completed' && stateRef.current.status !== 'failed') {
        animationFrameId = requestAnimationFrame(warmUp);
      }
    };
    animationFrameId = requestAnimationFrame(warmUp);
    return () => cancelAnimationFrame(animationFrameId);
  }, [simulate, isCompleted, status]);

  // 3. React to Parent completion trigger
  useEffect(() => {
    if (isCompleted) {
      setProgress(100);
      setStatus('completed');
      setLabel('اكتمل التوليد والمعالجة بنجاح!');
      if (onFinished) {
        setTimeout(onFinished, 1000);
      }
    }
  }, [isCompleted, onFinished]);

  // Get Job Meta styling and info
  const getJobMeta = () => {
    switch (detectedType) {
      case 'voice':
        return {
          title: 'نموذج التوليد الصوتي الذكي (Naje Voice)',
          icon: Volume2,
          badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400',
          gradient: 'from-cyan-500 via-sky-500 to-indigo-600',
          defaultLabel: 'جاري تحويل النص وصياغة النبرات الصوتية الطبيعية...'
        };
      case 'image':
      case 'design':
        return {
          title: 'نموذج توليد الصور والرسوم (Naje Imagen)',
          icon: ImageIcon,
          badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
          gradient: 'from-amber-500 via-orange-500 to-rose-500',
          defaultLabel: 'جاري رسم وتوليد البكسلات عالية الدقة...'
        };
      case 'video':
        return {
          title: 'نموذج إخراج وتحريك الفيديو (Naje Video)',
          icon: Film,
          badgeBg: 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400',
          gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
          defaultLabel: 'جاري معالجة الكادرات وتحريك إطارات الفيديو...'
        };
      case 'document':
        return {
          title: 'محرك بناء وصياغة المستندات المتقدم',
          icon: FileText,
          badgeBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
          gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
          defaultLabel: 'جاري التخطيط وصياغة محتوى المستند...'
        };
      case 'ui':
        return {
          title: 'مطور الواجهات والأكواد التفاعلية',
          icon: Layout,
          badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          gradient: 'from-emerald-500 via-teal-500 to-sky-500',
          defaultLabel: 'جاري بناء أثر الواجهة وتصميم العناصر...'
        };
      default:
        return {
          title: 'نموذج التفكير والمعالجة الذكية',
          icon: Brain,
          badgeBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
          gradient: 'from-indigo-500 via-purple-500 to-pink-500',
          defaultLabel: 'جاري التفكير وصياغة الرد المناسب...'
        };
    }
  };

  const meta = getJobMeta();
  const IconComponent = meta.icon;

  return (
    <div className="w-full max-w-lg mx-auto my-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800/80 shadow-xl shadow-black/10 dark:shadow-black/40 backdrop-blur-md relative overflow-hidden">
      {/* Background radial soft light */}
      <div className="absolute -inset-10 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* Model Category Badge */}
      <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-800/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${meta.badgeBg}`}>
            <IconComponent className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-gray-900 dark:text-gray-200">
            {meta.title}
          </span>
        </div>
        <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/50">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Top Details */}
      <div className="flex items-center justify-between mb-2 relative z-10 text-right">
        <div className="flex items-center gap-2">
          {status === 'generating' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </motion.div>
          )}
          {status === 'completed' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )}
          {status === 'failed' && (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          )}
          <span className={`text-xs font-bold ${
            status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : status === 'failed' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'
          }`}>
            {status === 'completed' ? 'اكتمل التوليد بنجاح!' : status === 'failed' ? 'فشلت المعالجة' : 'جاري الاتصال والتوليد المباشر...'}
          </span>
        </div>
      </div>

      {/* Main Track and Glowing Progress Bar */}
      <div className="w-full h-3 bg-gray-100 dark:bg-gray-900/90 rounded-full overflow-hidden relative border border-gray-200 dark:border-gray-800">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={
            status === 'completed' 
              ? { duration: 0.5, ease: 'easeOut' } 
              : { duration: 0.3, ease: 'linear' }
          }
          className={`h-full rounded-full bg-gradient-to-r ${
            status === 'failed'
              ? 'from-rose-500 to-red-600'
              : meta.gradient
          } relative`}
        >
          {/* Indeterminate shimmer overlay */}
          {status !== 'completed' && (
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
              <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[najeShimmer_1.4s_linear_infinite]" />
            </span>
          )}
        </motion.div>
      </div>

      {/* Subtitle / Step label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={label}
          initial={{ y: 4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -4, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`text-xs mt-2.5 line-clamp-2 font-medium text-right leading-relaxed ${
            status === 'failed' ? 'text-rose-600 dark:text-rose-400 font-semibold' : status === 'completed' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          {label || meta.defaultLabel}
        </motion.p>
      </AnimatePresence>

      {/* Error message detail block */}
      {status === 'failed' && errorMsg && errorCat && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-700 dark:text-rose-300 text-right leading-relaxed flex flex-col gap-1"
        >
          <span className="font-bold text-xs">{errorCat.emoji} {errorCat.title}</span>
          <span>{errorCat.intro}</span>
        </motion.div>
      )}
    </div>
  );
}

