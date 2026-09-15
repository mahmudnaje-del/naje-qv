import React, { useState, useEffect } from 'react';
import NajeThinking from './NajeThinking';
import { motion, AnimatePresence } from 'motion/react';
import najeLoaderSignature from '../assets/icons/naje-loader-signature.svg';
import najeCheckmark from '../assets/icons/naje-checkmark.svg';
import najePersonaCritic from '../assets/icons/naje-persona-critic.svg';
import najePersonaPhotographer from '../assets/icons/naje-persona-photographer.svg';
import najePersonaProducer from '../assets/icons/naje-persona-producer.svg';
import najePersonaWriter from '../assets/icons/naje-persona-writer.svg';
import najePersonaProgrammer from '../assets/icons/naje-persona-programmer.svg';
import najePersonaSoundEngineer from '../assets/icons/naje-persona-sound-engineer.svg';
import najePersonaCommander from '../assets/icons/naje-persona-commander.svg';

interface NajeReasoningIndicatorProps {
  chatType?: 'ui' | 'text' | 'image' | 'video';
  aspectRatio?: string;
  hasStartedContent?: boolean;
  rawHtml?: string;
}

const PERSONA_CONFIG: Record<string, { icon: string; name: string; title: string }> = {
  ui: { icon: najePersonaProgrammer, name: 'المبرمج', title: 'هندسة الكود وبناء الواجهة التفاعلية' },
  text: { icon: najePersonaWriter, name: 'الكاتب والناقد', title: 'صياغة المحتوى وتدقيق الأفكار' },
  image: { icon: najePersonaPhotographer, name: 'المصوّر', title: 'الإخراج البصري والتوليد بدقة سينمائية' },
  video: { icon: najePersonaProducer, name: 'المنتج', title: 'الإخراج والتسلسل الزمني للمشاهد' },
  voice: { icon: najePersonaSoundEngineer, name: 'مهندس الصوت', title: 'معالجة الصوتيات وتوزيع الحوار' }
};

const REASONING_STEPS: Record<string, string[]> = {
  ui: [
    'أستوعب متطلّباتك وأحدّد وظيفة الواجهة بدقّة…',
    'أختار نظام الألوان والتنسيق المناسب لهويتك…',
    'أهندس البنية والتخطيط بعناية…',
    'أكتب المحتوى والعناصر التفاعلية…',
    'أضيف الحركات والتفاعل بسلاسة احترافية…',
    'أدقّق التجاوب والجودة على مختلف الأجهزة…'
  ],
  text: [
    'أستوعب طلبك وأحدّد الهدف بدقّة…',
    'أستحضر المعرفة والسياق ذا الصلة…',
    'أرتّب الأفكار وأبني بنيةً منطقية متماسكة…',
    'أصوغ المحتوى بلغةٍ واضحة واحترافية…',
    'أراجع الدقّة والتنسيق قبل العرض…'
  ],
  image: [
    'أحلّل وصفك وأفهم رؤيتك الإبداعية…',
    'أصوغ توجيهاً بصرياً احترافياً بأدقّ التفاصيل…',
    'أوازن الألوان والإضاءة والتكوين…',
    'أضبط الأبعاد والجودة المطلوبة…',
    'أصقل التفاصيل لأعلى مستوى إتقان…'
  ],
  video: [
    'أحلّل المشهد وأبني رؤيةً سينمائية…',
    'أكتب سيناريو دقيقاً لكل لحظة…',
    'أحدّد حركة الكاميرا والإيقاع والإضاءة…',
    'أجهّز المحرّك وأضمن ثبات الأسلوب…',
    'أصقل الإطارات والجودة النهائية…'
  ]
};

export function detectStageIndex(html: string): number {
  if (!html || html.length < 50) return 0;
  if (!html.includes('<style')) return 0;
  if (html.includes('<style') && !html.includes('</style>')) return 1;
  if (html.includes('</style>') && !html.includes('<body')) return 2;
  if (html.includes('<body') && !html.includes('</body>')) return 3;
  if (html.includes('</body>') && !html.includes('</html>')) return 4;
  return 5;
}

export function NajeThinkingGeneric() {
  return (
    <div className="flex items-center justify-center p-2">
      <NajeThinking size={32} />
    </div>
  );
}

export function NajePlanningIndicator({ hasStarted }: { hasStarted?: boolean }) {
  return (
    <div className="flex items-center justify-center p-2">
      <NajeThinking size={24} />
    </div>
  );
}

export default function NajeReasoningIndicator({
  chatType = 'text',
  aspectRatio = '16:9',
  hasStartedContent = false,
  rawHtml = ''
}: NajeReasoningIndicatorProps) {
  const steps = REASONING_STEPS[chatType] || REASONING_STEPS.text;
  const persona = PERSONA_CONFIG[chatType] || PERSONA_CONFIG.text;
  const [timerStep, setTimerStep] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (chatType === 'ui') return; // UI uses stream milestone detection
    const timer = setInterval(() => {
      setTimerStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [steps.length, chatType]);

  const currentStep = chatType === 'ui' ? detectStageIndex(rawHtml) : timerStep;
  const isMedia = chatType === 'image' || chatType === 'video';

  const [mediaProgress, setMediaProgress] = useState(5);
  useEffect(() => {
    if (!isMedia) return;
    setMediaProgress(5);
    const interval = setInterval(() => {
      setMediaProgress(prev => {
        if (prev >= 95) return prev;
        const step = prev < 40 ? 6 : prev < 75 ? 3 : 1;
        return prev + step;
      });
    }, 350);
    return () => clearInterval(interval);
  }, [isMedia]);

  // If text/UI generation has started producing content, dismiss this indicator (the inline SVG will stream along with the text)
  if (hasStartedContent && !isMedia) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 my-2 text-right" dir="rtl">
      {/* Pure SVG Thinking Effect Button — tapping it reveals the reasoning steps screen */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          title="ناجي يفكّر... انقر لعرض مراحل التفكير"
          aria-label="تأثير التفكير ناجي حرف N النابض"
          className="p-1.5 rounded-2xl bg-indigo-500/5 hover:bg-indigo-500/10 active:scale-95 transition-all cursor-pointer focus:outline-none select-none inline-flex items-center group border border-indigo-500/15"
        >
          <NajeThinking size={28} className="shrink-0" />
        </button>
      </div>

      {/* Staged Reasoning Box — only when tapped, and automatically disappears when writing starts */}
      <AnimatePresence>
        {expanded && !hasStartedContent && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm max-w-sm"
          >
            {/* Persona Avatar */}
            <div className="shrink-0 pt-0.5">
              <img src={persona.icon} alt={persona.name} className="w-6 h-6 object-contain" />
            </div>

            {/* Steps List */}
            <div className="flex-1 space-y-2">
              <div className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-800 pb-1 mb-1">
                {persona.title}
              </div>
              {steps.map((stepText, idx) => {
                const isDone = idx < currentStep;
                const isActive = idx === currentStep;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.08 }}
                    className="flex items-center gap-2 text-xs"
                  >
                    {/* Step Icon */}
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      {isDone ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <img src={najeCheckmark} alt="" className="w-3.5 h-3.5 object-contain" />
                        </motion.div>
                      ) : isActive ? (
                        <img src={najeLoaderSignature} alt="" className="w-3.5 h-3.5" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                      )}
                    </div>

                    {/* Step Label */}
                    <span
                      className={`transition-colors duration-200 ${
                        isActive
                          ? 'text-gray-900 dark:text-gray-100 font-semibold'
                          : isDone
                          ? 'text-gray-700 dark:text-gray-300 font-medium'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      {stepText}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shimmer Skeleton for Image/Video Wait */}
      {isMedia && (
        <div
          className={`w-full max-w-md rounded-2xl overflow-hidden bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-800 ${
            aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video'
          }`}
        >
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-gray-400 dark:text-gray-600">
            <img src={najeLoaderSignature} alt="" className="w-8 h-8" />
            <div className="flex flex-col items-center gap-1.5 w-52">
              <div className="flex items-center justify-between w-full text-xs font-bold text-gray-800 dark:text-gray-200">
                <span>جاري معالجة المعاينة...</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{mediaProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-300/80 dark:bg-gray-800/80 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 transition-all duration-300 ease-out rounded-full shadow-sm"
                  style={{ width: `${mediaProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
