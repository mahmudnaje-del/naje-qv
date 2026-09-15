import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Image as ImageIcon, FileText, Film } from 'lucide-react';
import NajeThinking from './NajeThinking';

type JobType = 'image' | 'video' | 'voice' | 'document';

const META: Record<JobType, { title: string; icon: any; gradient: string; think: string[] }> = {
  image: {
    title: 'محرّك الصور الإبداعي',
    icon: ImageIcon,
    gradient: 'from-violet-500 via-fuchsia-500 to-amber-400',
    think: [
      'أقرأ طلبك بعناية وأفهم نيّتك الإبداعية بدقّة…',
      'أستحضر أفضل ممارسات التصميم والإخراج البصري…',
      'أصوغ توجيهاً احترافياً بالإنجليزية بأعلى درجات الدقّة…',
      'أوازن الألوان والإضاءة والتكوين كما يفعل مصمّم محترف…',
      'أثبّت أي نص عربي بين علامتَي تنصيص لضمان وضوحه التام…',
      'أراجع كل تفصيل بدقّة قبل بدء التوليد…',
    ],
  },
  video: {
    title: 'محرّك الفيديو السينمائي',
    icon: Film,
    gradient: 'from-violet-600 via-purple-500 to-amber-400',
    think: [
      'أحلّل طلبك وأبني رؤية سينمائية متكاملة…',
      'أكتب سيناريو دقيقاً يصف كل ثانية للنموذج…',
      'أحدّد حركة الكاميرا والإيقاع والإضاءة باحتراف…',
      'أضمن ثبات الأسلوب البصري عبر المشهد بأكمله…',
      'أمنع الهلوسة وأثبّت النص العربي بين علامتَي تنصيص…',
      'أدقّق الرؤية كاملةً قبل تشغيل محرّك الفيديو…',
    ],
  },
  voice: {
    title: 'محرّك الصوت الطبيعي',
    icon: Volume2,
    gradient: 'from-cyan-500 via-sky-500 to-violet-500',
    think: [
      'أفهم النص والنبرة والشخصية المطلوبة…',
      'أضبط الإيقاع والوقفات الطبيعية بعناية…',
      'أراعي النبر والمشاعر لأداءٍ حيٍّ ومقنع…',
      'أجهّز صوتاً واضحاً واحترافياً بجودة عالية…',
    ],
  },
  document: {
    title: 'محرّك بناء المستندات',
    icon: FileText,
    gradient: 'from-indigo-500 via-blue-500 to-cyan-400',
    think: [
      'أستوعب طلبك وأحدّد نوع المستند والهدف منه…',
      'أخطّط بنيةً متماسكة بأقسام منطقية مدروسة…',
      'أصوغ المحتوى الحقيقي بأعلى جودة ومصداقية…',
      'أنسّق العناصر والهوية البصرية باحتراف…',
      'أراجع الدقّة والتناسق قبل الإخراج النهائي…',
    ],
  },
};

export default function NajeSmartLoader({
  jobId, jobType, userPrompt = '', isCompleted = false,
}: { jobId: string | null; jobType: JobType; userPrompt?: string; isCompleted?: boolean }) {
  const meta = META[jobType] || META.image;
  const [phase, setPhase] = useState<'thinking' | 'generating' | 'completed'>('thinking');
  const [progress, setProgress] = useState(0);
  const [serverLabel, setServerLabel] = useState('');
  const [thinkIdx, setThinkIdx] = useState(0);

  useEffect(() => {
    if (phase !== 'thinking') return;
    const id = setInterval(() => setThinkIdx(i => (i + 1) % meta.think.length), 2200);
    return () => clearInterval(id);
  }, [phase, meta.think.length]);

  useEffect(() => {
    if (!jobId) return;
    const unsub = onSnapshot(doc(db, 'generation_jobs', jobId), (snap) => {
      if (!snap.exists()) return;
      const d: any = snap.data();
      if (d.stepLabel) setServerLabel(d.stepLabel);
      if (d.status === 'completed' || (typeof d.progress === 'number' && d.progress >= 100)) {
        setPhase('completed'); setProgress(100); return;
      }
      if (d.status === 'generating' || (typeof d.progress === 'number' && d.progress > 12)) {
        setPhase('generating');
        setProgress(p => Math.max(p, typeof d.progress === 'number' ? d.progress : p));
      }
    }, () => {});
    return () => unsub();
  }, [jobId]);

  useEffect(() => { if (isCompleted) { setPhase('completed'); setProgress(100); } }, [isCompleted]);

  const Icon = meta.icon;
  const hint = userPrompt ? (userPrompt.length > 72 ? userPrompt.slice(0, 72) + '…' : userPrompt) : '';

  return (
    phase === 'thinking' ? (
      // Prompt-writing phase: ONLY the pulsing-N mark + the rotating dialogue. No graphical card yet.
      <div dir="rtl" className="flex items-center gap-3 my-1 select-none">
        <NajeThinking size={30} className="drop-shadow-[0_0_8px_rgba(139,92,246,0.35)]" />
        <AnimatePresence mode="wait">
          <motion.span key={'t' + thinkIdx}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.35 }}
            className="text-[13px] text-gray-500 dark:text-gray-400">
            {meta.think[thinkIdx]}
          </motion.span>
        </AnimatePresence>
      </div>
    ) : (
    <div dir="rtl" className="w-full max-w-xl rounded-3xl p-[1.5px] bg-gradient-to-br from-violet-500/40 via-transparent to-amber-400/40">
      <div className="relative overflow-hidden rounded-[calc(1.5rem-1.5px)] bg-white/70 dark:bg-[#0f1115]/85 backdrop-blur-xl px-5 py-4 shadow-[0_10px_44px_-14px_rgba(124,58,237,0.4)]">
        <div className="pointer-events-none absolute inset-0 text-violet-500 opacity-[0.05] dark:opacity-[0.09]"
             style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '11px 11px' }} />
        <div className="relative flex items-center gap-3">
          <div className={`shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white shadow-lg`}>
            <Icon size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-800 dark:text-gray-100 truncate">{meta.title}</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={'g' + serverLabel + phase}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400 truncate">
                {phase === 'completed' ? 'اكتمل بنجاح'
                  : (serverLabel || 'جاري التوليد بلمسة ناجي الذكية…')}
              </motion.div>
            </AnimatePresence>
          </div>
          {phase === 'generating' && (
            <div className="text-[12px] font-bold tabular-nums text-gray-700 dark:text-gray-200">{Math.round(progress)}%</div>
          )}
        </div>
        {hint && (
          <div className="relative mt-2 text-[11px] text-gray-400 dark:text-gray-500 truncate">
            <span className="opacity-70">طلبك:</span> {hint}
          </div>
        )}
        <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-gray-200/70 dark:bg-white/10">
          {phase === 'generating' ? (
            <motion.div className={`h-full rounded-full bg-gradient-to-r ${meta.gradient}`}
              animate={{ width: `${Math.max(6, progress)}%` }} transition={{ ease: 'easeOut', duration: 0.6 }} />
          ) : (
            <motion.div className={`absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r ${meta.gradient} opacity-80`}
              animate={{ x: ['-45%', '265%'] }} transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }} />
          )}
          {phase === 'generating' && progress < 100 && (
            <motion.span className="absolute inset-y-0 w-1/4 bg-white/40"
              animate={{ x: ['0%', '420%'] }} transition={{ repeat: Infinity, duration: 1.3, ease: 'linear' }} />
          )}
        </div>
      </div>
    </div>
    )
  );
}
