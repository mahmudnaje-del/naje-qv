import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Check, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import najeWarning from '../assets/icons/naje-warning.svg';
import najeShieldCheck from '../assets/icons/naje-shield-check.svg';
import najeQuotaLimit from '../assets/icons/naje-quota-limit.svg';
import najeWalletCoins from '../assets/icons/naje-wallet-coins.svg';
import najeFolder from '../assets/icons/naje-folder.svg';
import najeDocument from '../assets/icons/naje-document.svg';
import najeGlobe from '../assets/icons/naje-globe.svg';
import najeGear from '../assets/icons/naje-gear.svg';
import najeToolkit from '../assets/icons/naje-toolkit.svg';
import najeLightbulb from '../assets/icons/naje-lightbulb.svg';
import najeMagnifier from '../assets/icons/naje-magnifier.svg';
import najeCheckmark from '../assets/icons/naje-checkmark.svg';

const ERROR_ICON_MAP: Record<string, string> = {
  warning: najeWarning,
  shield: najeShieldCheck,
  quota: najeQuotaLimit,
  wallet: najeWalletCoins,
  folder: najeFolder,
  document: najeDocument,
  globe: najeGlobe,
  gear: najeGear,
};

interface NajeErrorCardProps {
  jsonContent: string;
  onClose?: () => void;
}

export default function NajeErrorCard({ jsonContent, onClose }: NajeErrorCardProps) {
  const { user } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parse the JSON content
  let data = {
    title: 'حدث خطأ غير متوقع',
    emoji: 'warning',
    icon: 'warning',
    intro: 'نعتذر منك، واجه النظام صعوبة فنية أثناء تنفيذ طلبك.',
    explanation: 'لم نتمكن من تحديد تفاصيل الخطأ بدقة، يرجى المحاولة لاحقاً.',
    solutions: ['تحديث الصفحة وإعادة المحاولة.', 'التأكد من اتصال الإنترنت الخاص بك.'],
    errorStr: ''
  };

  try {
    const jsonStr = jsonContent.replace('__NAJE_ERROR_JSON__:', '');
    const parsed = JSON.parse(jsonStr);
    data = { ...data, ...parsed };
  } catch (e) {
    console.error('Failed to parse error JSON payload:', e);
    // Fallback if parsing fails but string is raw
    data.errorStr = jsonContent;
  }

  const headerIconSrc = ERROR_ICON_MAP[data.icon || data.emoji] || najeWarning;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.errorStr || jsonContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Build WhatsApp Support URL with formatted message
  const rawPhoneNumber = '+970567929170'; // +970 567 929 170
  const cleanPhone = '970567929170';
  const whatsappMsg = `مرحباً فريق دعم ناجي\nأواجه خطأ فني أثناء استخدام التطبيق:\n\n*عنوان الخطأ:* ${data.title}\n*البيان:* ${data.intro}\n*التشخيص:* ${data.explanation}\n*اسم المستخدم:* ${user?.displayName || 'غير معروف'}\n*البريد الإلكتروني:* ${user?.email || 'غير معروف'}\n\nيرجى المساعدة في حل المشكلة.`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="w-full bg-gradient-to-b from-red-950/15 to-red-950/5 border border-red-500/15 rounded-2xl p-5 text-right leading-relaxed shadow-lg shadow-red-950/10 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-red-500/10 pb-3 flex-row-reverse justify-between">
        <div className="flex items-center gap-2 flex-row-reverse">
          <img src={headerIconSrc} alt="" className="w-5 h-5 object-contain" />
          <h4 className="font-bold text-sm text-red-600 dark:text-red-400 font-sans tracking-tight">
            {data.title}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition cursor-pointer"
              title="إغلاق بطاقة الصيانة"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="p-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Official Statement */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-red-500/80 uppercase tracking-wider block">
          ● تفاصيل الحالة:
        </span>
        <p className="text-sm text-gray-900 dark:text-gray-200 leading-relaxed font-sans">
          {data.intro}
        </p>
      </div>

      {/* Technical Diagnosis */}
      <div className="space-y-1.5 bg-red-950/10 border border-red-500/5 rounded-xl p-3">
        <span className="text-[11px] font-bold text-red-600 dark:text-red-400/80 uppercase tracking-wider flex items-center gap-1.5 justify-end">
          <span>السبب المتوقع:</span>
          <img src={najeToolkit} alt="" className="w-3.5 h-3.5 object-contain" />
        </span>
        <p className="text-xs text-gray-800 dark:text-gray-400 leading-relaxed font-sans">
          {data.explanation}
        </p>
      </div>

      {/* Proposed Solutions */}
      {data.solutions && data.solutions.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400/80 uppercase tracking-wider flex items-center gap-1.5 justify-end">
            <span>خطوات الحل المقترحة والمباشرة:</span>
            <img src={najeLightbulb} alt="" className="w-3.5 h-3.5 object-contain" />
          </span>
          <ul className="space-y-1.5 mr-1">
            {data.solutions.map((sol, index) => (
              <li key={index} className="text-xs text-gray-900 dark:text-gray-300 flex items-start gap-2 flex-row-reverse">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0 mt-0.5">◀</span>
                <span className="font-sans leading-relaxed text-right">{sol}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* WhatsApp Support Button for regular users */}
      {!user?.isAdmin && (
        <div className="border-t border-red-500/10 pt-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95 text-center"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>التواصل مع دعم ناجي على واتس آب للإبلاغ عن خطأ فني</span>
            <span className="text-[11px] font-mono dir-ltr opacity-90">({rawPhoneNumber})</span>
          </a>
        </div>
      )}

      {/* Developer Log block - Admin Only */}
      {user?.isAdmin && data.errorStr && (
        <div className="border-t border-red-500/10 pt-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer flex-row-reverse"
          >
            <div className="flex items-center gap-1.5 flex-row-reverse">
              <img src={najeMagnifier} alt="" className="w-3.5 h-3.5 object-contain" />
              <span>عرض تفاصيل الخطأ الفنية للدعم ومطوري النظام (خاص بالمطورين)</span>
            </div>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="relative bg-white dark:bg-black/60 border border-gray-600 dark:border-gray-800 rounded-xl p-3 font-mono text-[10px] text-gray-800 dark:text-gray-400 text-left max-h-48 overflow-y-auto leading-normal whitespace-pre-wrap select-text" dir="ltr">
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white dark:bg-gray-900/80 border border-gray-600 dark:border-gray-800 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer z-10"
                    title="نسخ تفاصيل الخطأ"
                  >
                    {copied ? <img src={najeCheckmark} alt="" className="w-3 h-3 object-contain" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <pre className="pr-8">{data.errorStr}</pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
