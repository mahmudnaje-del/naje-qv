import { VIDEO_STYLE_TEMPLATES } from "../data/videoStyleTemplates";
import NajeSelect from '../components/NajeSelect';
import NajeModelTierSelector from '../components/NajeModelTierSelector';
import NajeLogo from '../components/NajeLogo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ChatSession, ChatMessage } from '../types';
import { 
  Send, Image as ImageIcon, Film, Star, FileText, 
  ArrowUp, Paperclip, X, Sliders, Menu, PanelRight, ChevronDown, Sparkles, AlertCircle, ArrowLeft, Mic, Zap,
  ThumbsUp, ThumbsDown, Target, Building2, ShoppingBag, BarChart2, UserCheck, Layout, Smartphone as SmartphoneIcon,
  Square, Code2, Eye, MessageSquare, Check, Copy, ArrowDown, Wand2, Download, CornerDownLeft, Mic2, Volume2, Play, Pause, Users, User, Globe, ExternalLink
} from 'lucide-react';
import NajeSpinner from '../components/NajeSpinner';
import { VOICES, NAJE_VOICES } from '../lib/voiceCatalog';
import { useAppStore } from '../store';
import { exportSingleImagePDF, exportChatPDF } from '../utils/pdfExport';
import { formatProfessionalError } from '../utils/errorFormatter';
import { cn } from '../lib/utils';
import NajePreviewRenderer from '../components/NajePreviewRenderer';
import NajeFlowStepper from '../components/NajeFlowStepper';
import NajeProgressLine from '../components/NajeProgressLine';
import NajeErrorCard from '../components/NajeErrorCard';
import NajeUiPreview from '../components/NajeUiPreview';
import NajeCodePane from '../components/NajeCodePane';
import NajeReasoningIndicator, { NajeThinkingGeneric, NajePlanningIndicator } from '../components/NajeReasoningIndicator';
import { useSmoothReveal } from '../hooks/useSmoothReveal';
import { CodeBlock } from '../components/CodeBlock';
import { saveDoc, getDoc as getLocalDoc } from '../lib/idb';
import { uploadBase64ToStorage, uploadWithRetry } from '../lib/mediaStorage';
import { downloadBase64File } from '../utils/fileDownloader';
import { VoiceSettingsPanel, parseDualScriptLines, buildVoiceChatPayload } from "../components/chat/VoiceChatPanel";
import { VideoSettingsPanel, buildVideoChatPayload } from "../components/chat/VideoChatPanel";
import { ImageSettingsPanel, buildImageChatPayload } from "../components/chat/ImageChatPanel";
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '../toastStore';
import ImageZoomModal from '../components/ImageZoomModal';
import NajeThinking from '../components/NajeThinking';
import NajeImageInpainter from '../components/NajeImageInpainter';
import NajeVersionHistoryDrawer from '../components/NajeVersionHistoryDrawer';
import { Paintbrush, History as HistoryIcon } from 'lucide-react';
import { fetchWithRetry } from '../lib/fetchWithRetry';

import MessageBubble from '../components/chat/MessageBubble';

import UiChatPanel from '../components/chat/UiChatPanel';
import TextChatPanel from '../components/chat/TextChatPanel';
import { getTemplateThumbnail } from '../data/templateThumbnails';
import { usePricingConfig } from '../hooks/usePricingConfig';
import najeChartBars from '../assets/icons/naje-chart-bars.svg';
import najeFilmstrip from '../assets/icons/naje-filmstrip.svg';
import najeDocument from '../assets/icons/naje-document.svg';
import najePencilWrite from '../assets/icons/naje-pencil-write.svg';

const stripUndefined = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    );
  }
  return obj;
};

import LocalMediaRenderer, { detectBase64MimeType } from '../components/LocalMediaRenderer';


import GroundingReportViewer from '../components/GroundingReportViewer';

export function sanitizeUrl(url: string): string {
  if (!url) return '#';
  let cleaned = String(url).trim();
  cleaned = cleaned.replace(/^[\(\[\<"']+|[\)\]\>\"'\.]+$|\.$/g, '');
  cleaned = cleaned.replace(/^(https?:\/\/)+https?:\/\//i, 'https://');
  if (!/^https?:\/\//i.test(cleaned) && !cleaned.startsWith('/') && !cleaned.startsWith('#')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned;
}

export function cleanMarkdownLinks(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, (_match, title, url) => {
    let cleanUrl = url.replace(/[\.\)]+$/, '');
    cleanUrl = cleanUrl.replace(/^(https?:\/\/)+https?:\/\//i, 'https://');
    return `[${title.trim()}](${cleanUrl})`;
  });
  cleaned = cleaned.replace(/(https?:\/\/[^\s<>\(\)]+)([\.\,\)]*)(\s|$)/g, (_match, url, punctuation, space) => {
    let cleanUrl = url.replace(/[\.\,]+$/, '');
    return `${cleanUrl}${punctuation}${space}`;
  });
  return cleaned;
}

function SearchSourcesViewer({ sources }: { sources?: Array<{ title: string; url: string }> }) {
  if (!sources || !Array.isArray(sources) || sources.length === 0) return null;
  return (
    <div className="mt-2.5 p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 rounded-xl flex flex-col gap-1.5 text-xs">
      <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
        <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>المصادر المباشرة والروابط المستخرجة عبر Google Search:</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-0.5">
        {sources.map((src, idx) => {
          const cleanUrl = sanitizeUrl(src.url);
          return (
            <a
              key={idx}
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (cleanUrl.startsWith('http')) {
                  window.open(cleanUrl, '_blank', 'noopener,noreferrer');
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800/80 text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-[11px] transition-all cursor-pointer shadow-2xs group/src"
            >
              <span className="truncate max-w-[200px]">{src.title || cleanUrl}</span>
              <ExternalLink className="w-3 h-3 text-indigo-500 opacity-70 group-hover/src:opacity-100 shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function AssistantTextMessage({ content, isStreaming, searchSources }: { content: string; isStreaming?: boolean; searchSources?: Array<{ title: string; url: string }> }) {
  const processedContent = cleanMarkdownLinks(content);
  const revealedText = useSmoothReveal(processedContent, !!isStreaming);
  const [copied, setCopied] = useState(false);

  return (
    <div className="group/msg relative">
      <div className="prose dark:prose-invert prose-p:leading-relaxed max-w-none text-gray-900 dark:text-gray-200 text-base leading-relaxed relative">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            a(props) {
              const { href, children } = props as any;
              const cleanHref = href ? sanitizeUrl(href) : '#';
              return (
                <a
                  href={cleanHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded-md text-xs sm:text-sm font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer no-underline group/link"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (cleanHref && cleanHref.startsWith('http')) {
                      window.open(cleanHref, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  <span className="truncate max-w-[240px]">{children}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover/link:opacity-100 shrink-0 transition-opacity" />
                </a>
              );
            },
            code(props) {
              const { children, className, node, ...rest } = props as any;
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');
              const isInline = !match && !codeString.includes('\n');

              if (isInline) {
                return (
                  <code className="bg-gray-150 dark:bg-gray-800 px-1.5 py-0.5 rounded-md text-sm font-mono text-indigo-600 dark:text-indigo-400 font-semibold" {...rest}>
                    {children}
                  </code>
                );
              }

              return (
                <CodeBlock 
                  language={match ? match[1] : 'code'} 
                  value={codeString} 
                />
              );
            }
          }}
        >
          {revealedText}
        </ReactMarkdown>

        {/* Smooth gliding thinking indicator behind streaming text */}
        {isStreaming && (
          <motion.span 
            initial={{ opacity: 0, scale: 0.8, x: 4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="inline-flex items-center align-middle mx-1.5 my-1"
          >
            <NajeThinking size={20} className="inline-block align-middle drop-shadow-[0_0_6px_rgba(139,92,246,0.45)]" />
          </motion.span>
        )}
      </div>

      <SearchSourcesViewer sources={searchSources} />

      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(content);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className={cn(
          "transition-all duration-200 absolute -top-2.5 left-0 text-[11px] px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 cursor-pointer z-10 shadow-xs active:scale-95",
          copied
            ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700/80 text-emerald-600 dark:text-emerald-400 opacity-100"
            : "bg-white/95 dark:bg-slate-800/95 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 opacity-0 group-hover/msg:opacity-100"
        )}
        title="نسخ النص"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">تم النسخ</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>نسخ</span>
          </>
        )}
      </button>
    </div>
  );
}

const UI_STARTER_TEMPLATES = [
  { title: 'صفحة هبوط (Landing Page)', desc: 'واجهة تعريفية جذابة مع قسم مميزات وخطة أسعار وزر اتخاذ إجراء', prompt: 'صمّم صفحة هبوط حديثة لمصمم واجهات مستخدم مع قسم البورتفوليو وخطة الأسعار وزر دعوة لاتخاذ إجراء (CTA) متناسق.' },
  { title: 'لوحة تحكم (Dashboard)', desc: 'شاشة تحليلات مبيعات مع بطاقات إحصائية وجدول طلبات ورسم بياني', prompt: 'لوحة تحكم تحليلات لموجز المبيعات اليومية مع بطاقات إحصائيات سريعة، جدول آخر الطلبات، ورسم بياني تفاعلي بسيطة بالـ SVG.' },
  { title: 'متجر إلكتروني (Storefront)', desc: 'عرض منتجات متناسق مع فلترة وشريط بحث وسلة تسوق جانبية', prompt: 'واجهة متجر إلكتروني لمنتجات تجميل وعناية بالبشرة، مع شبكة المنتجات، شريط البحث، وفلترة الفئات، وسلة تسوق جانبية.' },
  { title: 'بروفايل شركة (Company Profile)', desc: 'صفحة تعريف بشركة تقنية مع قائمة الخدمات وأرقام الإنجازات', prompt: 'صفحة تعريف بشركة تقنية تقدم خدمات السحاب والذكاء الاصطناعي مع شريط خدمات، فريق العمل، وإحصائيات الإنجازات.' },
  { title: 'معرض أعمال (Portfolio)', desc: 'بورتفوليو لمطور/مصمم مع معارض المشاريع ونموذج تواصل', prompt: 'موقع بورتفوليو شخصي لمطور ويب مع نبذة عني، معرض الأعمال، والمهارات الرئيسية، ونموذج تواصل تفاعلي.' },
  { title: 'واجهة تطبيق جوال (App Screen)', desc: 'شاشة تطبيق إدارة مهام بإنتاجية عالية وتنقل سفلي', prompt: 'شاشة تطبيق جوال لإدارة المهام والإنتاجية اليومية مع المهام الحالية، أشرطة التقدم، وتبويبات تنقل بالأسفل.' }
];

const BUILD_VERBS = /ابن|اعمل|أنشئ|صمم|ولّد|حدث|عدّل|غيّر|زيد|احذف/;
const PLAN_SIGNALS = /شو رأيك|فكرة|اقتراح|كيف أبدأ|ما هي الأفضل|أيهما أفضل|ساعدني أفكر/;

export function parseUiMessage(content: string | undefined): { chatText: string; html: string; hasHtml: boolean } {
  if (!content) return { chatText: '', html: '', hasHtml: false };
  let text = content.trim();

  // Check for fenced html code block
  const fenceMatch = text.match(/```html?\s*([\s\S]*?)(?:```|$)/i);
  if (fenceMatch) {
    const htmlPart = fenceMatch[1].trim();
    const fenceIndex = text.indexOf('```');
    const chatText = text.slice(0, fenceIndex).trim();
    return { chatText, html: htmlPart, hasHtml: htmlPart.length > 0 };
  }

  // Check for <!DOCTYPE html ... or <html ...
  const htmlStartMatch = text.match(/(<!DOCTYPE\s+html[\s\S]*|<html[\s\S]*)/i);
  if (htmlStartMatch && htmlStartMatch.index !== undefined) {
    const chatText = text.slice(0, htmlStartMatch.index).trim();
    let htmlPart = htmlStartMatch[1].trim();
    const endMatch = htmlPart.match(/([\s\S]*?<\/html>)/i);
    if (endMatch) {
      htmlPart = endMatch[1].trim();
    }
    return { chatText, html: htmlPart, hasHtml: htmlPart.length > 0 };
  }

  return { chatText: text, html: '', hasHtml: false };
}

function isUiDocument(content: string | undefined): boolean {
  if (!content) return false;
  return parseUiMessage(content).hasHtml;
}

const MODEL_TIER_INFO: Record<'lite'|'core'|'max', { label: string; hint: string }> = {
  lite: { label: 'Naje Lite', hint: 'الأسرع والأخفّ — تفكير منخفض ومباشر' },
  core: { label: 'Naje Core', hint: 'المتوازن — تفكير متوسط وذكاء متقدم' },
  max:  { label: 'Naje Max',  hint: 'الأعمق — تفكير عالٍ واستنتاج قوي' },
};

function getMismatchSuggestion(mode: 'plan' | 'build', text: string): 'plan' | 'build' | null {
  if (!text || text.trim().length < 3) return null;
  if (mode === 'build' && PLAN_SIGNALS.test(text) && !BUILD_VERBS.test(text)) {
    return 'plan';
  }
  if (mode === 'plan' && BUILD_VERBS.test(text)) {
    return 'build';
  }
  return null;
}

export default function Chat() {
  const pricing = usePricingConfig();
  const [uiMode, setUiMode] = useState<'build' | 'plan'>('build');
  const [uiModelTier, setUiModelTier] = useState<'lite' | 'core' | 'max'>('core');
  const [enableSearchGrounding, setEnableSearchGrounding] = useState<boolean>(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Voice Studio State
  const [voiceMode, setVoiceMode] = useState<'single' | 'dual'>('single');
  const [voiceTier, setVoiceTier] = useState<'core' | 'pro'>('core');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [speaker1Voice, setSpeaker1Voice] = useState<string>('Puck');
  const [speaker2Voice, setSpeaker2Voice] = useState<string>('Kore');
  const [speaker1Name, setSpeaker1Name] = useState<string>('أحمد');
  const [speaker2Name, setSpeaker2Name] = useState<string>('سارة');
  const [deliveryStyle, setDeliveryStyle] = useState<string>('default');
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(true);
  const [playingVoiceSample, setPlayingVoiceSample] = useState<string | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  const playVoicePreview = (voiceId: string) => {
    // Stop any speech synthesis if running
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }

    if (playingVoiceSample === voiceId) {
      if (voiceAudioRef.current) {
        try {
          voiceAudioRef.current.pause();
          voiceAudioRef.current.currentTime = 0;
        } catch (_) {}
        voiceAudioRef.current = null;
      }
      setPlayingVoiceSample(null);
      return;
    }

    if (voiceAudioRef.current) {
      try {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.currentTime = 0;
      } catch (_) {}
      voiceAudioRef.current = null;
    }

    const matchedVoice = NAJE_VOICES.find(v => v.id.toLowerCase() === voiceId.toLowerCase());
    const voiceName = matchedVoice ? matchedVoice.id : voiceId;
    const samplePath = `/api/voice-sample?voice=${encodeURIComponent(voiceName)}`;

    setPlayingVoiceSample(voiceId);

    const fallbackToSpeechSynthesis = () => {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const label = matchedVoice ? matchedVoice.labelAr : voiceId;
          const utterance = new SpeechSynthesisUtterance(`مرحباً بك، أنا صوت ${label} في منصة ناجي للذكاء الاصطناعي.`);
          utterance.lang = 'ar-SA';
          utterance.rate = 0.95;
          utterance.onend = () => setPlayingVoiceSample(null);
          utterance.onerror = () => setPlayingVoiceSample(null);
          window.speechSynthesis.speak(utterance);
          return;
        } catch (_) {}
      }
      setPlayingVoiceSample(null);
    };

    const audio = new Audio(samplePath);
    voiceAudioRef.current = audio;

    audio.onended = () => {
      setPlayingVoiceSample(null);
    };

    audio.onerror = () => {
      fallbackToSpeechSynthesis();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        if (err?.name !== 'AbortError') {
          fallbackToSpeechSynthesis();
        } else {
          setPlayingVoiceSample(null);
        }
      });
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    if (modelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [modelDropdownOpen]);

  const [favorites, setFavorites] = useState<string[]>([]);
  const handleFavorite = (id: string) => { setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]) };

  // ===== Feedback system (Naje) =====
  const feedbackReasonsDown = ['المحتوى مسيء أو غير آمن', 'معلومات غير صحيحة', 'لا يتّبع التعليمات', 'مشكلة في التخصيص', 'اللغة غير صحيحة', 'غير ذلك'];
  const feedbackReasonsUp = ['معلومات صحيحة', 'سهل الفهم', 'غني بالمعلومات', 'إبداعي / مثير للاهتمام', 'غير ذلك'];
  const [feedbackTarget, setFeedbackTarget] = useState<{ msgId: string; signal: 'up' | 'down' } | null>(null);
  const [feedbackReasons, setFeedbackReasons] = useState<string[]>([]);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [votedMessages, setVotedMessages] = useState<Record<string, 'up' | 'down'>>({});

  const openFeedback = (msgId: string, signal: 'up' | 'down') => {
    setFeedbackReasons([]);
    setFeedbackNote('');
    setFeedbackTarget({ msgId, signal });
  };
  const toggleFeedbackReason = (r: string) => {
    setFeedbackReasons(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };
  const submitFeedback = async () => {
    if (!feedbackTarget || !user) return;
    setFeedbackSubmitting(true);
    try {
      const targetMsg = messages.find(m => m.id === feedbackTarget.msgId);
      const decisionKey = `${chat?.type || 'text'}_${(chat?.type === 'video' ? selectedVideoTemplate : chat?.type === 'image' ? (imagePreset || imageModel) : chat?.type === 'document' ? docType : textModelTier) || 'default'}`;

      await setDoc(doc(collection(db, 'feedback_signals')), {
        ownerId: user.uid,
        chatId,
        messageId: feedbackTarget.msgId,
        chatType: chat?.type || 'text',
        decision_matrix_key: decisionKey,
        signal: feedbackTarget.signal,
        reasons: feedbackReasons,
        note: feedbackNote.trim(),
        templateId: chat?.type === 'video' ? (selectedVideoTemplate || null) : null,
        isEdit: !!(targetMsg as any)?.isEdit,
        modelUsed: chat?.type === 'image' ? imageModel : chat?.type === 'video' ? videoModel : textModelTier,
        createdAt: Date.now()
      });
      setVotedMessages(prev => ({ ...prev, [feedbackTarget.msgId]: feedbackTarget.signal }));
      toast.success('شكراً لملاحظتك! رح تساعدنا نطوّر ناجي');
      setFeedbackTarget(null);
    } catch (e) {
      console.error('feedback error', e);
      toast.error('تعذّر إرسال الملاحظة، حاول مرة ثانية.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };
  const getCalculatedCost = (overrideDocType?: string, overridePagesCount?: number, overrideSlidesCount?: number) => {
    if (!chat) return 0;
    let cost = 0;
    const activeDocType = overrideDocType !== undefined ? overrideDocType : docType;
    if (chat.type === 'image') {
      const base = imageModel === 'lite' 
        ? (pricing.image?.liteBase ?? 0.5) 
        : (imageModel === 'nova' ? (pricing.image?.proBase ?? 1.5) : (pricing.image?.base ?? 1.0));
      cost = editingMessageId ? (pricing.image?.edit ?? (base * 0.5)) : base;
      const qMult = (imageModel === 'lite' || imageQuality === 'standard') ? 1.0 : (pricing.image?.qualityMultiplier?.hd ?? 1.5);
      cost = cost * qMult;
      if (files && Array.isArray(files)) {
        const imgCount = files.filter(f => f.mimeType && f.mimeType.startsWith('image/')).length;
        cost += Math.min(imgCount, 3) * (pricing.image?.imageAddon ?? 0.1);
      }
    } else if (chat.type === 'video') {
      const isVeo = videoModel === 'veo';
      const durSec = parseFloat(videoDuration) || (isVeo ? 4 : 5);
      cost = durSec * (pricing.video?.perSecond ?? 0.5);
      if (editingMessageId) {
        cost = cost * (pricing.video?.editMultiplier ?? 0.7); // discount
      }
      const resMult = videoResolution === '1080p' ? (pricing.video?.resolutionMultiplier?.['1080p'] ?? 1.6) : 1.0;
      cost = cost * resMult;
      if (files && Array.isArray(files)) {
        const imgCount = files.filter(f => f.mimeType && f.mimeType.startsWith('image/')).length;
        cost += Math.min(imgCount, 3) * (pricing.video?.imageAddon ?? pricing.image?.imageAddon ?? 0.1);
      }
    } else if (chat.type === 'voice') {
      const words = (input || '').trim().split(/\s+/).filter(Boolean).length;
      const wordsPerMin = pricing.voice?.estimatedWordsPerMinute || 140;
      const estimatedSecs = Math.max(3, Math.ceil((words / wordsPerMin) * 60));
      cost = Math.max(pricing.voice?.minCost ?? 0.10, parseFloat((estimatedSecs * (pricing.voice?.costPerAudioSecond ?? 0.02)).toFixed(2)));
    } else if (chat.type === 'text') {
      if (activeDocType !== 'none') {
        if (activeDocType === 'pptx' || activeDocType === 'pdf_slides') {
          cost = (overrideSlidesCount !== undefined ? overrideSlidesCount : slidesCount) * (pricing.document?.pdf_per_slide ?? 0.20);
        } else {
          cost = (overridePagesCount !== undefined ? overridePagesCount : pagesCount) * (paperSize === 'a5' ? (pricing.document?.a5PerPage ?? 0.10) : (pricing.document?.a4PerPage ?? 0.15));
        }
      } else {
        cost = 0;
      }
    }
    return parseFloat(cost.toFixed(2));
  };

  const getAuthModalCost = () => {
    let cost = 0;
    if (chosenAuthDocType === 'pptx' || chosenAuthDocType === 'pdf_slides') {
      cost = slidesCount * (pricing.document?.pdf_per_slide ?? 0.20);
    } else {
      cost = pagesCount * (paperSize === 'a5' ? (pricing.document?.a5PerPage ?? 0.10) : (pricing.document?.a4PerPage ?? 0.15));
    }
    return parseFloat(cost.toFixed(2));
  };









  const handleFileChange = (e: any) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = event.target?.result as string;
        const base64Data = raw.includes(',') ? raw.split(',')[1] : raw;
        setFiles(prev => [...prev, { name: file.name, data: base64Data, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
  };
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  const videoTemplates: any[] = VIDEO_STYLE_TEMPLATES;


  const IDENTITY_LOCK = `
IDENTITY LOCK (CRITICAL): Preserve the subject's exact facial structure, key facial features, skin tone, facial hair, eye color, and natural expression from the reference image. The output face MUST be instantly recognizable as the same person. Do NOT alter facial proportions, age, gender, or core identity traits.
`.trim();

  const QUALITY_ANCHOR = `
QUALITY ANCHOR: Masterpiece, ultra-detailed, professional quality, perfectly composed, 8k resolution, award-winning aesthetics, crisp focus, clean rendering, premium art direction.
`.trim();

  const NEGATIVE_DIRECTIVES = `
NEGATIVE DIRECTIVES: avoid low quality, blurry, deformed, extra limbs, bad anatomy, distorted face, identity shift, low resolution, artifacts, noise, oversaturated, unrealistic hands, duplicate features, bad proportions.
`.trim();

  const imageTemplates: any[] = [
    {
      id: 'plushie',
      name: 'دمية محشوة كيوت',
      desc: 'تحويل الشخصية إلى دمية محشوة من القماش الناعم بخياطة يدوية وتفاصيل لطيفة.',
      image: '/templates/plushie_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: A handcrafted plushie stuffed toy version of the person. Material & Texture: Soft felt fabric, visible embroidery seams, plush cotton filling, button-like glossy eyes. Environment & Lighting: Cozy, warm indoor studio setting with soft diffused lighting and gentle rim glow. Camera & Style: Macro portrait photography, shallow depth of field, tilt-shift effect, charming and adorable aesthetic.'
    },
    {
      id: 'bronze_sculpture',
      name: 'تمثال برونزي كلاسيكي',
      desc: 'تمثال منحوت من البرونز المنقوش ببريق مذهبي خفيف ولمسات فنية كلاسيكية.',
      image: '/templates/bronze_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: A majestic bronze bust sculpture of the person. Material & Texture: Aged patina bronze, metallic sheen, carved chisel details, subtle verdigris accents, weathered metal texture. Environment & Lighting: Museum exhibition display, single dramatic directional spotlight, deep rich shadows, ambient museum glow. Camera & Style: Cinematic close-up portrait, high contrast chiaroscuro, classical museum art aesthetic.'
    },
    {
      id: 'watercolor_dream',
      name: 'لوحة مائية حالمة',
      desc: 'لوحة فنية بألوان مائية انسيابية، ضربات فرشاة ناعمة وتدرجات صبغية ساحرة.',
      image: '/templates/watercolor_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: Expressive watercolor portrait of the person. Material & Texture: Textured cold-press watercolor paper, pigment bleeds, soft brush strokes, delicate paint splatters, translucent color washes. Environment & Lighting: Soft ambient sunlight, pastel color gradients blending smoothly into white paper margins. Camera & Style: Artistic watercolor illustration, expressive and poetic composition, fine-art gallery feel.'
    },
    {
      id: 'pro_headshot',
      name: 'بورتريه استوديو احترافي',
      desc: 'صورة استوديو بروفايل عالية الدقة بإضاءة سينمائية وخلفية ناعمة.',
      image: '/templates/headshot_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: Professional corporate headshot of the person. Environment & Lighting: Modern studio setup, softbox key light, subtle hair rim light, neutral blurred office backdrop (bokeh). Camera & Lens: 85mm portrait lens, f/1.8 aperture, sharp focus on eyes, ultra-clean commercial look. Mood: Confident, approachable, polished, high-end LinkedIn profile aesthetic.'
    },
    {
      id: '90s_retro',
      name: 'تسعينات ريترو',
      desc: 'طابع التسعينيات الكلاسيكي بحبيبات فيلم 35mm وألوان دافئة ونوستالجيا عريقة.',
      image: '/templates/90sstyle_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: Authentic 90s portrait of the person wearing vintage 1990s fashion. Material & Style: Analog 35mm film grain, slight chromatic aberration, nostalgic warm color grading, flash photography look. Environment & Lighting: Retro indoor setting or urban street, natural direct camera flash, nostalgic mood. Mood: Cool 90s aesthetic, nostalgic vibe, timeless vintage snapshot.'
    },
    {
      id: 'florist_shop',
      name: 'متجر الورود الساحر',
      desc: 'شخصية وسط بستان زهور ملونة وإضاءة شمسية دافئة داخل مشتل ورد.',
      image: '/templates/florist_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: The person surrounded by lush, vibrant floral arrangements inside a cozy florist shop. Environment & Lighting: Sunlight filtering through glass windows, golden hour warmth, abundant bouquets, green foliage, scattered flower petals. Camera & Lens: 50mm f/1.4 lens, natural golden bokeh, vibrant color palette. Mood: Serene, romantic, enchanting, botanical aesthetic.'
    },
    {
      id: 'zoo_keeper',
      name: 'حارس المحمية والحيوانات',
      desc: 'مغامرة احترافية بين الطبيعة والحيوانات الأليفة في محمية طبيعية.',
      image: '/templates/ROW_keeper_modal.webp',
      requiresPhoto: true,
      prompt: 'Subject: Wildlife sanctuary keeper version of the person interacting gently with friendly exotic animals. Environment & Lighting: Lush safari reserve, sun-dappled foliage, golden morning sunlight, earthy natural tones. Composition & Style: National Geographic photography style, environmental portrait, authentic outdoor adventure aesthetic, heartwarming moment.'
    },
    {
      id: 'popup_book',
      name: 'كتاب القصص المجسم (Pop-up)',
      desc: 'عالم مجسم ثلاثي الأبعاد مقصوص من الورق الملون كصفحات الكتب التفاعلية.',
      image: '/templates/popup_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: A pop-up storybook scene featuring a cutout paper version of the person. Material & Texture: Layered cardstock paper, visible paper folds, clean cut edges, subtle drop shadows between layers. Environment & Lighting: Open storybook on a wooden desk, warm cozy reading lamp glow. Style: Playful 3D papercraft illustration, whimsical narrative book aesthetic.'
    },
    {
      id: 'hollywood_glam',
      name: 'هوليوود السينمائي',
      desc: 'إطلالة نجوم هوليوود على السجادة الحمراء بملابس سهرة فاخرة وإضاءة مبهرة.',
      image: '/templates/hollywood_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: Glamorous Hollywood movie star version of the person in luxury evening attire. Environment & Lighting: Red carpet premiere, dramatic camera flashes, cinematic spotlights, elegant dark backdrop with golden bokeh. Camera & Style: High-fashion magazine cover shot, crisp glamor lighting, elegant pose, luxury celebrity aesthetic.'
    },
    {
      id: 'park_bench',
      name: 'جلسة الحديقة الخريفية',
      desc: 'لحظة استرخاء هادئة على مقعد خشبي في حديقة بين أوراق الخريف المتساقطة.',
      image: '/templates/bench_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: The person sitting relaxed on a classic wooden park bench in autumn. Environment & Lighting: Crisp autumn park, golden maple leaves falling gently, soft diffused sunlight, warm amber and burgundy tones. Camera & Style: Environmental lifestyle photography, candid natural posture, tranquil cinematic mood.'
    },
    {
      id: 'polymer_clay',
      name: 'صلصال البوليمر الملون',
      desc: 'مجسم صلصال طين يدوياً بأسلوب الكلايموشن اللطيف ولمسات البصمات الواقعية.',
      image: '/templates/polymerclay_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: A claymation polymer clay figure of the person. Material & Texture: Smooth hand-sculpted clay, subtle finger-press textures, vibrant matte clay colors, cute proportions. Environment & Lighting: Miniature studio backdrop, soft directional desk lamp lighting. Style: Stop-motion animation puppet feel, handcrafted artistic charm.'
    },
    {
      id: 'monstera_green',
      name: 'عالم النباتات والاسترخاء',
      desc: 'أجواء استوائية هادئة بين أوراق المونستيرا والنباتات الخضراء المتسلقة.',
      image: '/templates/monstera_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: Relaxed portrait of the person framed by large lush Monstera deliciosa leaves and tropical houseplants. Environment & Lighting: Sunlit bohemian living room, soft natural window light, deep leafy greens, warm wood accents. Style: Modern interior lifestyle photography, fresh botanical aesthetic, soothing atmosphere.'
    },
    {
      id: 'yogi_zen',
      name: 'جلسة اليوجا والتأمل',
      desc: 'لحظة سلام داخلي وتأمل في بيئة طبيعية هادئة مع إشراقة الصباح.',
      image: '/templates/yogi_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: The person in a serene yoga meditation pose. Environment & Lighting: Minimalist zen studio or peaceful natural overlook at sunrise, gentle mist, soft golden morning light. Style: Wellness and mindfulness lifestyle photography, clean balanced composition, calm spiritual aesthetic.'
    },
    {
      id: 'mahogany_library',
      name: 'المكتبة الماهوجنية الفاخرة',
      desc: 'أجواء دراسية فاخرة داخل مكتبة خشبية عريقة مع كتب جلدية وإضاءة دافئة.',
      image: '/templates/mahogany_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: The person in a grand vintage mahogany library surrounded by floor-to-ceiling bookshelves. Environment & Lighting: Rich dark wood paneling, antique leather-bound books, warm brass reading lamps, dust motes dancing in sunbeams. Style: Dark academia aesthetic, scholarly, sophisticated, timeless atmosphere.'
    },
    {
      id: 'claw_machine',
      name: 'داخل آلة الألعاب (Claw Machine)',
      desc: 'فكرة إبداعية كأن الشخصية لعبة مميزة داخل صندوق ألعاب الكرين المضيء.',
      image: '/templates/clawgame_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: The person creatively depicted inside a brightly illuminated arcade claw crane machine surrounded by colorful plushies. Environment & Lighting: Arcade room, vibrant neon lights reflecting on glass panels, metallic claw overhead. Style: Creative conceptual portrait, vibrant arcade aesthetic, playful neon lighting.'
    },
    {
      id: 'chibi_keychain',
      name: 'ميدالية تشيبي الاكريليك',
      desc: 'شخصية تشيبي يابانية ظريفة على شكل ميدالية مفاتيح أكريليك شفافة ومضيئة.',
      image: '/templates/chibikeychain_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: A cute Japanese chibi anime charm version of the person as a clear acrylic keychain accessory. Material & Texture: Glossy transparent acrylic acrylic edge, metal ring attachment, crisp anime linework. Environment & Lighting: Clean pastel flat-lay background, soft product studio lighting. Style: Kawaii merchandise aesthetic, adorable anime artwork.'
    },
    {
      id: 'sky_diver',
      name: 'القفز المظلي الحماسي',
      desc: 'لقطة أكشن حماسية في الهواء بين السحاب أثناء القفز المظلي.',
      image: '/templates/skydiver_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: Thrilling skydiving action shot of the person in professional jumpsuit and goggles mid-freefall. Environment & Lighting: Open sky, fluffy white clouds beneath, bright high-altitude sunlight, dramatic horizon angle. Style: GoPro extreme sports photography, dynamic wide-angle motion, high energy adrenaline feel.'
    },
    {
      id: 'plushie_world',
      name: 'عالم الدمى الكرتوني',
      desc: 'بيئة خيالية كرتونية كاملة مصنوعة من القماش المحشو والوسائد اللطيفة.',
      image: '/templates/ROW_plushie_modal.webp',
      requiresPhoto: true,
      prompt: 'Subject: The person immersed in a magical whimsical fantasy world built entirely of plush toys, soft pillows, and fabric landscapes. Environment & Lighting: Pastel sky, clouds made of cotton wool, soft diffuse dreamlike lighting. Style: Children storybook illustration, cozy fantasy aesthetic, playful fabric world.'
    },
    {
      id: 'chibi_characters',
      name: 'شخصيات التشيبي الملونة',
      desc: 'رسم تشيبي ملون ومشرق بشخصية كرتونية لطيفة وملامح تعبيرية مرحة.',
      image: '/templates/characters_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: A full-body colorful chibi character illustration of the person. Style & Art: Big expressive eyes, cute simplified proportions, clean vector linework, vibrant cel-shaded color palette. Backdrop: Minimalist pastel pattern with subtle floating decorative elements. Vibe: Fun, cheerful, modern anime character design.'
    },
    {
      id: 'hand_drawn_sketch',
      name: 'رسم يدويا سكتش فني',
      desc: 'سكتش فني مرسوم يدويًا بأقلام الرصاص والفحم مع تفاصيل تظليل احترافية.',
      image: '/templates/handdrawn_l_2x.webp',
      requiresPhoto: true,
      prompt: 'Subject: Hand-drawn pencil and charcoal sketch portrait of the person. Material & Texture: Textured off-white sketchbook paper, graphite cross-hatching, smudged charcoal shading, visible pencil sketch lines. Style: Fine-art portrait drawing, traditional artist sketchbook aesthetic, classic expressive illustration.'
    },
    { id: 'minimalist_logo', name: 'شعار مينيمال نظيف', desc: 'تصميم شعار بسيط بخطوط نظيفة ومساحة سلبية أنيقة يناسب أي علامة.', image: '/templates/minimalist_logo.webp', prompt: 'Subject: A clean minimalist vector logo mark. Material & Texture: Flat solid color, crisp geometric lines, no gradients. Style: Modern minimal branding, generous negative space, timeless simple iconography.' },
    { id: 'luxury_packaging', name: 'تغليف منتج فاخر', desc: 'عرض علبة منتج راقية بخامات فاخرة وإضاءة استوديو احترافية.', image: '/templates/luxury_packaging.webp', prompt: 'Subject: A premium product box mockup. Material & Texture: Matte or soft-gloss finish, subtle gold foil accents, refined cardstock texture. Lighting: Soft studio product lighting, elegant shadow falloff. Style: High-end luxury packaging presentation.' },
    { id: 'neon_sign', name: 'لافتة نيون متوهجة', desc: 'حروف نيون مضيئة بألوان زاهية على خلفية داكنة توحي بأجواء ليلية.', image: '/templates/neon_sign.webp', prompt: 'Subject: Glowing neon tube sign typography. Lighting: Vivid saturated neon glow, dark moody background, soft light bleed. Style: Retro neon signage art, vibrant nightlife aesthetic.' },
    { id: 'botanical_illustration', name: 'رسم نباتي علمي دقيق', desc: 'توضيح نباتي مفصل بدقة علمية وألوان طبيعية هادئة.', image: '/templates/botanical_illustration.webp', prompt: 'Subject: A detailed scientific botanical illustration of a plant. Material & Texture: Fine linework, delicate watercolor washes. Style: Vintage naturalist field-guide illustration, precise organic detail.' },
    { id: 'abstract_gradient', name: 'فن التدرج اللوني المجرد', desc: 'أشكال عضوية ناعمة بتدرجات ألوان حديثة وانسيابية بصرية.', image: '/templates/abstract_gradient.webp', prompt: 'Subject: Abstract flowing gradient shapes. Material & Texture: Smooth soft-focus color blending, no hard edges. Style: Modern abstract digital art, calming contemporary aesthetic.' },
    { id: 'embroidery_patch', name: 'رقعة تطريز قماشية', desc: 'تصميم مطرز بخيوط ملونة بارزة بأسلوب رقع القماش الكلاسيكية.', image: '/templates/embroidery_patch.webp', prompt: 'Subject: An embroidered fabric patch design. Material & Texture: Raised thread stitching, visible fabric weave, felt backing edge. Style: Classic varsity patch craftsmanship.' },
    { id: 'marble_texture', name: 'رخام فاخر بعروق ذهبية', desc: 'سطح رخامي أنيق بعروق ذهبية لامعة يوحي بالفخامة والرقي.', image: '/templates/marble_texture.webp', prompt: 'Subject: A luxurious marble surface with gold veining. Material & Texture: Polished stone sheen, intricate natural veining detail. Style: Opulent premium surface texture art.' },
    { id: 'graffiti_street_art', name: 'فن الغرافيتي الحضري', desc: 'رسم جداري صاخب بألوان جريئة يعكس روح الشارع والتمرد الفني.', image: '/templates/graffiti_street_art.webp', prompt: 'Subject: Bold urban graffiti wall art lettering. Material & Texture: Rough concrete wall backdrop, spray paint drip texture. Style: Vibrant rebellious street art energy.' },
    { id: 'isometric_icon', name: 'أيقونة ثلاثية الأبعاد متساوية', desc: 'أيقونة نظيفة بزاوية هندسية موحدة وألوان مسطحة عصرية.', image: '/templates/isometric_icon.webp', prompt: 'Subject: A single clean isometric icon object. Material & Texture: Flat color blocks, subtle soft shadow. Style: Modern app-icon isometric design clarity.' },
    { id: 'vintage_poster', name: 'ملصق سفر كلاسيكي', desc: 'تصميم إعلاني قديم الطراز بألوان دافئة وطباعة نصية جذابة.', image: '/templates/vintage_poster.webp', prompt: 'Subject: A vintage travel advertisement poster. Material & Texture: Aged paper grain, warm muted color palette, classic serif typography space. Style: Mid-century travel poster nostalgia.' },
    { id: 'stained_glass_portrait', name: 'بورتريه بأسلوب الزجاج الملون', desc: 'وجه مقسم لقطع زجاجية ملونة بحدود سوداء وإضاءة متوهجة.', image: '/templates/stained_glass_portrait.webp', prompt: 'Subject: A portrait rendered as stained glass segments. Material & Texture: Bold black leading lines, vivid backlit glass color. Style: Ornate cathedral-window portrait artistry.' },
    { id: 'low_poly_art', name: 'فن المضلعات الهندسية', desc: 'شكل مبني من مثلثات هندسية حادة بألوان متدرجة عصرية.', image: '/templates/low_poly_art.webp', prompt: 'Subject: A low-poly geometric faceted subject. Material & Texture: Sharp triangular facets, flat gradient shading. Style: Clean modern low-poly digital art.' },
    { id: 'double_exposure', name: 'ازدواج الصورة الفني', desc: 'دمج فني بين ملامح الشخص وعناصر طبيعية بتأثير شفاف ساحر.', image: '/templates/double_exposure.webp', requiresPhoto: true, prompt: 'Subject: A double-exposure blend of the uploaded person\'s silhouette with a natural landscape or forest texture. Material & Texture: Translucent layered blending, soft edge transitions. Style: Artistic double-exposure portrait photography.' },
    { id: 'cyberpunk_avatar', name: 'أفاتار سايبربانك مضيء', desc: 'صورة شخصية بلمسة مستقبلية نيون وتفاصيل تقنية عالية.', image: '/templates/cyberpunk_avatar.webp', requiresPhoto: true, prompt: 'Subject: The uploaded person restyled as a cyberpunk character. Material & Texture: Neon rim lighting, subtle tech-implant detail accents. Style: Vivid futuristic cyberpunk avatar portrait.' },
    { id: 'watercolor_botanical', name: 'زهور بألوان مائية ناعمة', desc: 'تكوين زهري رقيق بألوان مائية شفافة ولمسة فنية هادئة.', image: '/templates/watercolor_botanical.webp', prompt: 'Subject: A soft watercolor floral arrangement. Material & Texture: Translucent bleeding pigment, delicate paper grain. Style: Gentle romantic botanical watercolor art.' },
    { id: 'metallic_chrome', name: 'كروم سائل معدني لامع', desc: 'شكل انسيابي بانعكاسات معدنية لامعة توحي بالحداثة والفخامة.', image: '/templates/metallic_chrome.webp', prompt: 'Subject: A liquid chrome metallic 3D form. Material & Texture: Mirror-polished reflective surface, fluid molten shape. Style: Sleek futuristic 3D render.' },
    { id: 'clay_sculpture', name: 'منحوتة صلصال يدوية', desc: 'شخصية مجسمة بملمس صلصال طبيعي وألوان دافئة يدوية الصنع.', image: '/templates/clay_sculpture.webp', prompt: 'Subject: A handcrafted clay/plasticine sculpted character. Material & Texture: Visible fingerprint texture, matte clay surface. Style: Warm tactile stop-motion-style sculpture.' },
    { id: 'ink_wash_painting', name: 'رسم بالحبر الصيني التقليدي', desc: 'لوحة أحادية اللون بضربات حبر انسيابية وأسلوب فني تأملي هادئ.', image: '/templates/ink_wash_painting.webp', prompt: 'Subject: A traditional ink wash painting scene. Material & Texture: Flowing monochrome brush strokes, soft bleeding ink gradients. Style: Serene meditative East Asian ink art.' },
    { id: 'sticker_pack', name: 'ملصق فينيل مقطوع', desc: 'رسمة كرتونية مبهجة بحدود بيضاء سميكة بأسلوب الملصقات الرقمية.', image: '/templates/sticker_pack.webp', prompt: 'Subject: A fun die-cut vinyl sticker illustration. Material & Texture: Thick white border outline, glossy flat coloring. Style: Playful modern digital sticker art.' },
    { id: 'luxury_jewelry', name: 'تصوير مجوهرات فاخر', desc: 'قطعة مجوهرات لامعة بإضاءة استوديو دقيقة تُبرز كل تفصيلة.', image: '/templates/luxury_jewelry.webp', prompt: 'Subject: A fine jewelry piece product shot. Material & Texture: Sparkling faceted gemstone detail, polished precious metal. Lighting: Precise studio jewelry lighting. Style: High-end luxury jewelry photography.' },
    { id: 'architectural_blueprint', name: 'مخطط معماري هندسي', desc: 'رسم تقني أزرق بخطوط بيضاء دقيقة يوحي بالتصميم الهندسي.', image: '/templates/architectural_blueprint.webp', prompt: 'Subject: A technical architectural blueprint drawing. Material & Texture: Fine white linework on deep blue background, precise measurement annotations. Style: Classic engineering blueprint illustration.' },
    { id: 'tarot_card_art', name: 'بطاقة تاروت غامضة', desc: 'تصميم رمزي غامض بإطار زخرفي وألوان ليلية عميقة.', image: '/templates/tarot_card_art.webp', prompt: 'Subject: A mystical tarot card illustration. Material & Texture: Ornate decorative border, rich deep jewel-tone colors. Style: Enigmatic symbolic mystical art.' },
    { id: 'sports_action', name: 'لقطة رياضية حماسية', desc: 'حركة ديناميكية متجمدة بإضاءة قوية توحي بالطاقة والتنافس.', image: '/templates/sports_action.webp', prompt: 'Subject: A dynamic frozen-motion sports action shot. Lighting: High-contrast dramatic stadium lighting. Style: Energetic professional sports photography.' },
    { id: 'bakery_pastry', name: 'حلويات مخبز فنية', desc: 'قطع حلويات شهية بإضاءة دافئة وتفاصيل نسيج مغرية.', image: '/templates/bakery_pastry.webp', prompt: 'Subject: Artisan bakery pastries close-up. Material & Texture: Flaky golden crust detail, glistening glaze highlights. Style: Warm appetizing food photography.' },
    { id: 'mosaic_art', name: 'فسيفساء بيزنطية كلاسيكية', desc: 'قطع فسيفساء صغيرة ملونة تشكل نمطاً كلاسيكياً معقداً.', image: '/templates/mosaic_art.webp', prompt: 'Subject: A Byzantine-style mosaic tile composition. Material & Texture: Small colored glass/stone tesserae, intricate tiled pattern. Style: Ancient ornate mosaic artistry.' },
    { id: 'galaxy_space_art', name: 'فن المجرة الكونية', desc: 'سديم كوني بألوان أرجوانية وزرقاء عميقة ونجوم متلألئة.', image: '/templates/galaxy_space_art.webp', prompt: 'Subject: A cosmic galaxy nebula scene. Material & Texture: Deep violet and blue swirling gas clouds, sparkling star field. Style: Majestic cosmic space art.' },
    { id: 'wooden_carving', name: 'نحت خشبي يدوي', desc: 'تفاصيل منحوتة بعمق على سطح خشبي طبيعي بأسلوب حرفي أصيل.', image: '/templates/wooden_carving.webp', prompt: 'Subject: A hand-carved wood relief sculpture. Material & Texture: Deep chiseled grain detail, natural warm wood tone. Style: Authentic traditional woodcraft artistry.' },
    { id: 'crystal_gem', name: 'بلورة كريستالية متعددة الأوجه', desc: 'شكل بلوري شفاف بانكسارات ضوئية ساحرة وألوان متلألئة.', image: '/templates/crystal_gem.webp', prompt: 'Subject: A faceted crystal gemstone render. Material & Texture: Translucent refractive facets, prismatic light dispersion. Style: Elegant sparkling 3D crystal art.' },
    { id: 'children_book_illustration', name: 'رسوم كتاب أطفال دافئة', desc: 'شخصيات ودودة بألوان مبهجة وأسلوب رسم بسيط ومحبب للأطفال.', image: '/templates/children_book_illustration.webp', prompt: 'Subject: A whimsical children\'s book character illustration. Material & Texture: Soft rounded shapes, warm cheerful colors. Style: Gentle friendly storybook art.' },
    { id: 'corporate_infographic', name: 'إنفوجرافيك مؤسسي احترافي', desc: 'عرض بيانات نظيف بأيقونات بسيطة وألوان مؤسسية متناسقة.', image: '/templates/corporate_infographic.webp', prompt: 'Subject: A clean corporate data infographic layout. Material & Texture: Flat vector icons, structured grid composition. Style: Professional modern business infographic design.' }
  ];

  const infographicTemplates: any[] = [
    {
      id: 'infographic_stats_grid',
      name: 'شبكة مؤشرات وإحصائيات رئيسية',
      desc: 'إبراز 3 إلى 6 أرقام ونسب محورية مع شارات التغير والتقييم بوضوح فائق.',
      image: 'infographic_stats_grid',
      prompt: 'صمم إنفوجرافيك شبكة إحصائيات احترافي لأهم مؤشرات الأداء والنمو.'
    },
    {
      id: 'infographic_comparison',
      name: 'مقارنة شاملة وجدولية',
      desc: 'مقارنة دقيقة بين خيارين أو حلين مع بطاقات إيجابيات وسلبيات وأشرطة أداء ملونة.',
      image: 'infographic_comparison',
      prompt: 'صمم إنفوجرافيك مقارنة تفصيلية متكاملة بين الخيارات المتاحة مع المؤشرات الإيجابية والسلبية.'
    },
    {
      id: 'infographic_timeline',
      name: 'خط زمني ومسار تاريخي',
      desc: 'تسلسل أحداث ومراحل زمنية مع نقاط وصل ملونة وعناوين مراحل واضحة.',
      image: 'infographic_timeline',
      prompt: 'صمم إنفوجرافيك خط زمني وخارطة طريق تعرض المراحل والمحطات الرئيسية.'
    },
    {
      id: 'infographic_process_steps',
      name: 'خطوات إجرائية متسلسلة',
      desc: 'شرح سير عمل أو خطوات إجرائية رقمية مرتبة مع أيقونات وشروحات مقتضبة.',
      image: 'infographic_process_steps',
      prompt: 'صمم إنفوجرافيك خطوات إجرائية وعملية متسلسلة من البداية حتى التسليم.'
    },
    {
      id: 'infographic_market_share',
      name: 'توزيع الحصص والنسب',
      desc: 'رسم بياني متقدم لتوزيع الحصص السوقية والميزانيات مع دليل بيانات أنيق.',
      image: 'infographic_market_share',
      prompt: 'صمم إنفوجرافيك توزيع الحصص السوقية والنسب مع الرسم البياني والدليل.'
    },
    {
      id: 'infographic_before_after',
      name: 'مقارنة قبل وبعد التحول',
      desc: 'عرض مرئي لنتائج التحول وفروقات الأداء والتكلفة والسرعة قبل وبعد تطبيق الحل.',
      image: 'infographic_before_after',
      prompt: 'صمم إنفوجرافيك مقارنة قبل وبعد لتوضيح فرق الكفاءة والأثر والنتائج.'
    },
    {
      id: 'infographic_mixed_hybrid',
      name: 'دمج ذكي شامل (Mixed Hybrid)',
      desc: 'ترك ناجي يدمج بين مؤشرات الأرقام، المقارنات، والتوزيع النسبي في بوستر واحد متكامل.',
      image: 'infographic_mixed_hybrid',
      prompt: 'صمم إنفوجرافيك دمج ذكي شامل يجمع بين أبرز الأرقام والمقارنات والتوزيع النسبي في لوحة واحدة متكاملة.'
    }
  ];

  const resolvedVideoTemplates = useMemo(() => {
    return videoTemplates.map(t => ({
      ...t,
      image: getTemplateThumbnail(t.image),
    }));
  }, []);

  const resolvedImageTemplates = useMemo(() => {
    return imageTemplates.map(t => ({
      ...t,
      image: getTemplateThumbnail(t.image),
    }));
  }, []);

  const resolvedInfographicTemplates = useMemo(() => {
    return infographicTemplates.map(t => ({
      ...t,
      image: getTemplateThumbnail(t.image),
    }));
  }, []);

  const textFeatures: any[] = [
    { id: '1', title: 'صياغة وتحرير النصوص', icon: 'pen', desc: 'اكتب مقالات، رسائل بريد، وتقارير احترافية.', prompt: 'قم بكتابة مقال احترافي عن الذكاء الاصطناعي في 300 كلمة' },
    { id: '2', title: 'تلخيص واستخراج الأفكار', icon: 'chart', desc: 'لخص المستندات والنصوص الطويلة بذكاء.', prompt: 'لخص أهم 5 قواعد في الإدارة الناجحة' },
    { id: '3', title: 'توليد أفكار إبداعية', icon: 'lightbulb', desc: 'احصل على أفكار لمشاريعك ومحتواك.', prompt: 'أعطني 5 أفكار إبداعية لمشروع تقني جديد' },
    { id: '4', title: 'برمجة وتطوير', icon: 'code', desc: 'مساعدتك في كتابة وتحليل الأكواد.', prompt: 'اكتب كود بلغة بايثون لإنشاء آلة حاسبة بسيطة' }
  ];

  const imageFeatures: any[] = [
    { id: '1', title: 'تصميم فني وإبداعي', icon: 'palette', desc: 'حول خيالك إلى لوحات فنية احترافية.', prompt: 'صمم لوحة فنية لمدينة مستقبلية بأسلوب السايبربانك' },
    { id: '2', title: 'تصميم شخصيات', icon: 'game', desc: 'ابتكر شخصيات مميزة للألعاب أو القصص.', prompt: 'صمم شخصية بطل خارق بأسلوب الرسوم المتحركة 3D' },
    { id: '3', title: 'هوية بصرية وشعارات', icon: 'spark', desc: 'صمم شعارات مبهرة لشركتك.', prompt: 'صمم شعار لشركة تقنية حديثة بألوان متدرجة' },
    { id: '4', title: 'تصميم واقعي', icon: 'camera', desc: 'صور واقعية فائقة الدقة 4K.', prompt: 'صورة فوتوغرافية احترافية 4k لسيارة رياضية في الشارع' }
  ];

  const setChatSessions = (fn: any) => {};
  const sessionId = 'temp-session';
  const isDoc = false;
  const activeDocType = 'none';
  const autoGenerateDocType = false;

  const executeSubmission = async (
    promptOverride?: string, 
    docTypeOverride?: string, 
    pagesCountOverride?: number, 
    slidesCountOverride?: number,
    interceptedFilesOverride?: { name: string, data: string, mimeType: string }[],
    textRiskAcknowledged?: boolean,
    imageModelOverride?: string
  ) => {
    if (systemStatus?.isMaintenance) {
      setMaintenanceDismissed(false);
      if (!user?.isAdmin) {
        toast.error('تم إيقاف الخدمات مؤقتاً للتطوير والإصلاح، شكراً لكم.');
        return;
      }
    }

    if (loading) {
      toast.error('الرجاء الانتظار حتى يكتمل طلبك الحالي قبل إرسال طلب جديد.');
      return;
    }

    // Browsers only allow this from a user gesture, so we ask on the first send.
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const rawUserText = (promptOverride || input) || '';
    let appliedTemplateName: string | null = null;
    let finalPrompt = promptOverride || input;

    if (chat?.type === 'video' && selectedVideoTemplate) {
      const matchedTemplate = videoTemplates.find(t => t.id === selectedVideoTemplate);
      if (matchedTemplate) {
        appliedTemplateName = matchedTemplate.name;
        finalPrompt = `${matchedTemplate.prompt} Subject: ${finalPrompt}`;
      }
    }
    if (chat?.type === 'image' && selectedImageTemplate) {
      const matchedTemplate = imageTemplates.find(t => t.id === selectedImageTemplate);
      if (matchedTemplate) {
        if (matchedTemplate.requiresPhoto && files.length === 0) {
          toast.error('هذا القالب يحتاج ترفق صورتك أولاً');
          return;
        }
        appliedTemplateName = matchedTemplate.name;

        const parts = [matchedTemplate.prompt];

        if (matchedTemplate.requiresPhoto || files.length > 0) {
          parts.push(IDENTITY_LOCK);
        }

        parts.push(QUALITY_ANCHOR);

        if (rawUserText && rawUserText.trim()) {
          parts.push(`Additional User Details: ${rawUserText.trim()}`);
        }

        parts.push(NEGATIVE_DIRECTIVES);

        finalPrompt = parts.join('\n\n');
      }
    }
    const finalDocType = docTypeOverride || docType;
    if ((!finalPrompt.trim() && files.length === 0) || !chat || !user) return;

    // A real document request (pptx/docx/pdf) must hit the server's document
    // pipeline via type:'document' and be read as a JSON response — NOT as the
    // text SSE stream — otherwise the file is never actually built.
    const isDocRequest = chat.type === 'text' && !!finalDocType && finalDocType !== 'none';
    const requestType = isDocRequest ? 'document' : (chat?.type || 'text');

    // First recharge check for restricted advanced engines
    const userHasRecharged = !!(user?.isAdmin || user?.hasRecharged);
    if (!userHasRecharged) {
      if (chat?.type === 'video') {
        toast.error('خدمة إنشاء الفيديو (العادية و Pro) متاحة فقط بعد أول عملية شحن رصيد ناجحة. يرجى شحن رصيدك لتفعيل محرك الفيديو');
        return;
      }
      const activeImageModel = imageModelOverride || imageModel;
      if (chat?.type === 'image' && (activeImageModel === 'nova' || activeImageModel === 'pro')) {
        toast.error('نموذج توليد الصور الاحترافي (Naje Imagen Pro) متاح فقط بعد أول عملية شحن رصيد ناجحة. يمكنك التبديل للنموذج العادي أو شحن رصيدك');
        return;
      }
      if (chat?.type === 'text' && textModelTier === 'max') {
        toast.error('نموذج Naje Max للدردشة النصية متاح فقط بعد أول عملية شحن رصيد ناجحة. يمكنك اختيار Naje Core/Lite أو شحن رصيدك لتفعيل Max');
        return;
      }
      if (chat?.type === 'ui' && uiModelTier === 'max') {
        toast.error('نموذج Naje Max لإنشاء وتوليد الواجهات متاح فقط بعد أول عملية شحن رصيد ناجحة. يمكنك اختيار Naje Core/Lite أو شحن رصيدك لتفعيل Max');
        return;
      }
    }

    let cost = getCalculatedCost(finalDocType, pagesCountOverride, slidesCountOverride);
    if (user.balance < cost) {
      toast.error(`رصيدك غير كافٍ. تحتاج ${cost} نقاط.`);
      return;
    }

    submitInFlightRef.current = true;
    setLoading(true);
    setInput('');
    const currentFiles = interceptedFilesOverride || [...files];
    setFiles([]);
    setInterceptedPrompt(null);
    setPendingDocConfirm(null);
    setDocType('none');
    setSelectedVideoTemplate(null);
    setSelectedImageTemplate(null);

    // Resolve Image Edit Source
    let isImageEdit = false;
    let sourceMediaUrl: string | null = null;
    const activeSourceMsgId = editingMessageId || inpaintMsgId || (selectedCoord ? selectedCoord.msgId : null);
    if (activeSourceMsgId && (chat?.type === 'image' || chat?.type === 'video')) {
      const targetMsg = messages.find(m => m.id === activeSourceMsgId);
      if (targetMsg && targetMsg.mediaUrl) {
        isImageEdit = true;
        sourceMediaUrl = targetMsg.mediaUrl;
        let b64 = targetMsg.mediaUrl;
        if (b64.startsWith('local:')) {
          const localId = b64.split('local:')[1];
          try {
            const fetched = await getLocalDoc(localId);
            if (fetched) b64 = fetched;
          } catch(e) { console.error('Failed to get local doc for edit:', e); }
        }
        if (b64) {
          const cleanB64 = b64.startsWith('data:') ? b64.split(',')[1] : b64;
          currentFiles.unshift({
            name: 'source_image.png',
            data: cleanB64,
            mimeType: 'image/png'
          });
        }
      }
    }

    // Reset edit states now that source image is captured
    setEditingMessageId(null);
    setInpaintMsgId(null);
    setSelectedCoord(null);

    const userMsgRef = doc(collection(db, 'messages'));
    const tempMsgId = userMsgRef.id;
    const tempUserMsg = {
      id: tempMsgId,
      ownerId: user?.uid,
      chatId,
      role: 'user',
      content: rawUserText || (appliedTemplateName ? `أسلوب: ${appliedTemplateName}` : ''),
      templateName: appliedTemplateName || null,
      fullPrompt: finalPrompt,
      files: currentFiles,
      isEdit: isImageEdit,
      sourceMediaUrl: sourceMediaUrl || null,
      createdAt: Date.now()
    };
    setMessages(prev => [...prev, tempUserMsg as any]);

    // Strip large base64 payload data before persisting to Firestore message document
    const dbFiles = currentFiles.map(f => {
      const { data, ...rest } = f;
      return rest;
    });
    let dbSourceMediaUrl = sourceMediaUrl;
    if (dbSourceMediaUrl && (dbSourceMediaUrl.startsWith('data:') || dbSourceMediaUrl.length > 500000)) {
      dbSourceMediaUrl = 'local:source_media';
    }

    const dbUserMsg = {
      ...tempUserMsg,
      files: dbFiles,
      sourceMediaUrl: dbSourceMediaUrl
    };

    setDoc(userMsgRef, stripUndefined(dbUserMsg)).catch(e => console.error("Failed to save user msg:", e));

    if (chat.type === 'ui') {
      setActiveUiTab('chat');
    }

    const currentJobId = doc(collection(db, 'generation_jobs')).id;
    setActiveJobId(currentJobId);
    setActiveJobType(isDocRequest ? 'document' : (chat.type === 'video' ? 'video' : (chat.type === 'image' ? 'image' : (chat.type === 'voice' ? 'voice' : 'text'))));
    setIsJobCompleted(false);

    const shouldSimulate = false;
    setSimulateProgress(false);

    let assistantContent = '';

    try {
      const token = await auth.currentUser?.getIdToken();

      let previousHtmlForUi = '';
      let isUiEditMode = false;
      if (chat.type === 'ui') {
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === 'assistant' && messages[i].content) {
            const parsed = parseUiMessage(messages[i].content);
            if (parsed.hasHtml) {
              previousHtmlForUi = parsed.html;
              isUiEditMode = true;
              break;
            }
          }
        }
      }

      abortControllerRef.current = new AbortController();

      const res = await fetchWithRetry('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          chatId,
          projectId: project?.id || undefined,
          history: messages.map(m => ({ role: m.role, content: m.content, files: m.files })),
          prompt: finalPrompt,
          type: requestType,
          model: chat.type === 'ui' ? uiModelTier : (chat.type === 'text' ? textModelTier : undefined),
          config: (chat.type === 'video' || chat.type === 'image') ? undefined : { aspectRatio, quality: imageQuality },
          files: currentFiles,
          ...(chat.type === 'video' ? buildVideoChatPayload({ videoModel, aspectRatio, videoResolution, videoDuration }) : {}),
          ...(chat.type === 'image' ? buildImageChatPayload({ imageModel: imageModelOverride || imageModel, aspectRatio, imageQuality }) : {}),
          docType: finalDocType,
          docSize: docSize,
          paperSize: paperSize,
          pagesCount: pagesCountOverride !== undefined ? pagesCountOverride : pagesCount,
          slidesCount: slidesCountOverride !== undefined ? slidesCountOverride : slidesCount,
          projectData: project,
          isEdit: chat.type === 'ui' ? isUiEditMode : isImageEdit,
          previousHtml: chat.type === 'ui' ? previousHtmlForUi : undefined,
          selectedElement: chat.type === 'ui' ? (selectedUiElement || undefined) : undefined,
          styleHint: chat.type === 'ui' ? (selectedStyleHint || undefined) : undefined,
          ...(chat.type === 'voice' ? buildVoiceChatPayload({ voiceMode, voiceTier, selectedVoice, speaker1Voice, speaker2Voice, speaker1Name, speaker2Name, deliveryStyle }) : {}),
          mode: chat.type === 'ui' ? uiMode : undefined,
          jobId: currentJobId,
          textRiskAcknowledged: textRiskAcknowledged === true,
          maskData: maskData || undefined,
          enableSearchGrounding: enableSearchGrounding === true
        })
      });
      setSelectedUiElement(null);
      setMaskData(null);

      if (!res.ok) {
        let errText = await res.text();
        try { const errJson = JSON.parse(errText); errText = errJson.error || errText; } catch(e) {}
        throw new Error(errText || 'فشل التوليد');
      }

      let data: any = {};
      assistantContent = '';
      let triggerDocGeneration: string | null = null;
      let triggerPrompt = '';
      let triggerEstimatedCount = 5;

      if ((chat.type === 'text' || chat.type === 'ui') && !isDocRequest) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let isFirstChunk = true;
        let msgIdToUpdate = '';

        while (reader && !done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunkValue = decoder.decode(value, { stream: true });
            const lines = chunkValue.split('\n\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '');
                if (dataStr === '[DONE]') { done = true; break; }
                let parsedChunk: any = null;
                try {
                  parsedChunk = JSON.parse(dataStr);
                } catch (e: any) {
                  console.error('Failed to parse stream chunk', dataStr, e);
                  continue;
                }

                if (parsedChunk?.error) {
                  throw new Error(parsedChunk.error);
                }

                if (parsedChunk.replaceContent) {
                  assistantContent = parsedChunk.replaceContent;
                  if (msgIdToUpdate) {
                    updateDoc(doc(db, 'messages', msgIdToUpdate), { content: assistantContent })
                      .catch(e => console.error('Failed to update message:', e));
                  }
                } else if (parsedChunk.text) {
                  assistantContent += parsedChunk.text;
                  if (isFirstChunk) {
                    const docRef = doc(collection(db, 'messages'));
                    msgIdToUpdate = docRef.id;
                    isFirstChunk = false;
                    setDoc(docRef, stripUndefined({
                      ownerId: user?.uid, chatId, role: 'assistant', content: assistantContent, createdAt: Date.now()
                    })).catch(e => console.error('Failed to save message to db:', e));
                  } else if (msgIdToUpdate) {
                    updateDoc(doc(db, 'messages', msgIdToUpdate), { content: assistantContent })
                      .catch(e => console.error('Failed to update message:', e));
                  }
                }
                if (parsedChunk.searchSources && Array.isArray(parsedChunk.searchSources) && parsedChunk.searchSources.length > 0) {
                  if (msgIdToUpdate) {
                    updateDoc(doc(db, 'messages', msgIdToUpdate), { searchSources: parsedChunk.searchSources })
                      .catch(e => console.error('Failed to update searchSources:', e));
                  }
                }
                if (parsedChunk.triggerDocGeneration) {
                  triggerDocGeneration = parsedChunk.triggerDocGeneration;
                  triggerPrompt = parsedChunk.triggerPrompt || finalPrompt;
                  triggerEstimatedCount = parsedChunk.estimatedCount || 5;
                }
                if (parsedChunk.newBalance !== undefined) {
                  updateBalance(parsedChunk.newBalance);
                }
              }
            }
          }
        }

        if (!assistantContent.trim()) {
          throw new Error('تعذّر قراءة رد النموذج.');
        }

        if (chat?.type === 'ui' && assistantContent && user?.uid && chatId) {
          try {
            const q = query(
              collection(db, 'edit_history'),
              where('docId', '==', chatId),
              where('ownerId', '==', user.uid)
            );
            const snap = await getDocs(q);
            const nextVersion = snap.size + 1;
            await addDoc(collection(db, 'edit_history'), {
              docId: chatId,
              ownerId: user.uid,
              version: nextVersion,
              changeSummary: finalPrompt.slice(0, 100),
              content: assistantContent,
              timestamp: serverTimestamp()
            });
          } catch (e) {
            console.error('Failed to record edit_history for UI:', e);
          }
        }
      } else {
        const text = await res.text();
        try { 
          data = JSON.parse(text); 
          if (data.triggerDocGeneration) {
            triggerDocGeneration = data.triggerDocGeneration;
            triggerPrompt = data.triggerPrompt || finalPrompt;
            triggerEstimatedCount = data.estimatedCount || 5;
          }
        } catch (e) { 
          throw new Error(text && text.length < 200 ? text : 'حدث خطأ غير متوقع أثناء معالجة الاستجابة.'); 
        }

        // Text-risk gate: offer Pro model suggestion card
        if (data.action === 'model_upgrade_suggestion') {
          setTextRiskPrompt({
            originalPrompt: finalPrompt,
            message: data.message,
            wordCount: data.textRisk?.wordCount || 0,
            extractedText: data.textRisk?.extractedText || '',
            script: data.textRisk?.script || 'arabic'
          });
          return;
        }

        // Conversational reply from the image/video chat gate:
        // show it as a normal assistant message. No media, no points deducted.
        if (data.action === 'chat' && data.chatReply) {
          const chatRef = doc(collection(db, 'messages'));
          setDoc(chatRef, stripUndefined({
            ownerId: user?.uid,
            chatId,
            role: 'assistant',
            content: data.chatReply,
            createdAt: Date.now()
          })).catch(e => console.error(e));
          return; // stop here — the finally block resets the loading state
        }

        // Clarification request from silent critic (needsClarification):
        // show it as a normal assistant message. No media, no points deducted.
        if (data.needsClarification && data.message) {
          const chatRef = doc(collection(db, 'messages'));
          setDoc(chatRef, stripUndefined({
            ownerId: user?.uid,
            chatId,
            role: 'assistant',
            content: data.message,
            createdAt: Date.now()
          })).catch(e => console.error(e));
          return; // stop here — the finally block resets the loading state
        }

        // Decoupled async job tracking via Firestore generation_jobs onSnapshot
        if (data.jobId || data.status === 'queued') {
          const jobIdToTrack = data.jobId || currentJobId;
          await new Promise<void>((resolve, reject) => {
            let settled = false;
            let unsubJob: (() => void) | null = null;
            let notExistTimer: any = null;
            let timeoutTimer: any = null;

            const cleanup = () => {
              if (notExistTimer) {
                clearTimeout(notExistTimer);
                notExistTimer = null;
              }
              if (timeoutTimer) {
                clearTimeout(timeoutTimer);
                timeoutTimer = null;
              }
              if (unsubJob) {
                unsubJob();
                unsubJob = null;
              }
            };

            const safeResolve = () => {
              if (settled) return;
              settled = true;
              cleanup();
              resolve();
            };

            const safeReject = (err: Error) => {
              if (settled) return;
              settled = true;
              cleanup();
              reject(err);
            };

            // If snap does not exist for 15s => reject
            notExistTimer = setTimeout(() => {
              safeReject(new Error('تعذّر تتبع مهمة التوليد.'));
            }, 15000);

            // If status stays queued|starting|generating longer than 180s (image/voice/document) or 360s (video) => reject
            const maxDurationMs = (chat?.type === 'video' || requestType === 'video') ? 360000 : 180000;
            timeoutTimer = setTimeout(() => {
              safeReject(new Error('انتهت مهلة التوليد. إذا تم خصم نقاط بالخطأ ستُعاد تلقائياً.'));
            }, maxDurationMs);

            unsubJob = onSnapshot(doc(db, 'generation_jobs', jobIdToTrack), (snap) => {
              if (!snap.exists()) return;

              // snap exists, clear the 15s missing-doc timer
              if (notExistTimer) {
                clearTimeout(notExistTimer);
                notExistTimer = null;
              }

              const jobData: any = snap.data();
              if (jobData.action === 'model_upgrade_suggestion') {
                setTextRiskPrompt({
                  originalPrompt: finalPrompt,
                  message: jobData.message,
                  wordCount: jobData.textRisk?.wordCount || 0,
                  extractedText: jobData.textRisk?.extractedText || '',
                  script: jobData.textRisk?.script || 'arabic'
                });
                safeResolve();
                return;
              }
              if (jobData.status === 'completed') {
                if (jobData.consumedBalance !== undefined) {
                  updateBalance(Math.max(0, (user?.balance || 0) - jobData.consumedBalance));
                } else if (jobData.newBalance !== undefined) {
                  updateBalance(jobData.newBalance);
                }
                if (jobData.result) {
                  const localId = jobIdToTrack || `media_${Date.now()}`;
                  saveDoc(localId, jobData.result).catch(console.error);
                }
                setIsJobCompleted(true);
                safeResolve();
                return;
              }
              if (jobData.status === 'failed') {
                safeReject(new Error(jobData.error || 'تعذّر إكمال التوليد. لم يتم خصم أي نقاط.'));
                return;
              }
            }, (err) => {
              console.error('generation_jobs snapshot error:', err);
              safeReject(err instanceof Error ? err : new Error(String(err)));
            });
          });
          return;
        }

        assistantContent = 'تم التوليد بنجاح.';
      }

      if (shouldSimulate) {
        setIsJobCompleted(true);
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      if (data.newBalance !== undefined) {
        updateBalance(data.newBalance);
      }

      let mediaUrl = (chat.type === 'image' || chat.type === 'video' || chat.type === 'voice') ? data.result : null;
      const rawResultMedia = mediaUrl;
      if (mediaUrl) {
        const localId = `media_${Date.now()}`;
        saveDoc(localId, mediaUrl).catch(console.error);
        if (data.permanentMediaUrl && (data.permanentMediaUrl.startsWith('http://') || data.permanentMediaUrl.startsWith('https://'))) {
          mediaUrl = data.permanentMediaUrl;
        } else {
          mediaUrl = 'local:' + localId;
        }
      }

      let documentData = null;
      if (finalDocType && finalDocType !== 'none' && data.result) {
        assistantContent = `تم إنشاء مستند ${finalDocType.toUpperCase()} بنجاح.`;
        const localDocId = currentJobId || Date.now().toString();
        saveDoc(localDocId, data.result).catch(e => console.error(e));
        documentData = {
            id: localDocId,
            url: data.permanentMediaUrl || null,
            mimeType: data.mimeType,
            extension: data.extension,
            filename: `NajeAI_Document.${data.extension}`,
            slides: data.slides,
            groundingReport: data.groundingReport
        };
      }

      if (chat.type !== 'text' || mediaUrl || documentData) {
        const msgData: any = {
          ownerId: user?.uid,
          chatId,
          role: 'assistant',
          content: assistantContent,
          createdAt: Date.now()
        };
        if (mediaUrl) msgData.mediaUrl = mediaUrl;
        if (documentData) msgData.documentData = documentData;
        if (data.interactionId) msgData.interactionId = data.interactionId;
        if (chat.type === 'video') msgData.mediaType = 'video';
        else if (chat.type === 'image') msgData.mediaType = 'image';
        else if (chat.type === 'voice') msgData.mediaType = 'audio';

        const mRef = doc(collection(db, 'messages'));
        setDoc(mRef, stripUndefined(msgData)).catch(e => console.error(e));

        // If server-side upload was not returned, perform background retry upload
        if (!data.permanentMediaUrl && rawResultMedia && user?.uid && (chat.type === 'image' || chat.type === 'video' || chat.type === 'voice')) {
          const cloudPath = `generated_media/${user.uid}/media_${Date.now()}`;
          uploadWithRetry(cloudPath, rawResultMedia, chat.type, mRef);
        }
      }

      if (triggerDocGeneration && !isDocRequest) {
        setTimeout(() => {
           setPendingDocConfirm({ docType: triggerDocGeneration!, prompt: triggerPrompt, estimatedCount: triggerEstimatedCount });
        }, 500);
      }
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError' || err?.message?.includes('aborted');
      if (isAbort && abortControllerRef.current?.signal.aborted) {
        console.log('[Chat] Request was canceled/aborted by user cancel control');
        return;
      }
      console.error(err);
      const formattedErrorContent = isAbort
        ? 'انقطع الاتصال أثناء التوليد. أعد المحاولة.'
        : await formatProfessionalError(err, { chatType: chat?.type });
      const eRef = doc(collection(db, 'messages'));
      setDoc(eRef, stripUndefined({
        ownerId: user?.uid, chatId, role: 'assistant', content: formattedErrorContent, createdAt: Date.now()
      })).catch(e => console.error(e));
    } finally {
      submitInFlightRef.current = false;
      setLoading(false);
      setActiveJobId(null);
      setActiveJobType(null);
      setIsJobCompleted(false);
      setSimulateProgress(false);
      if (chat?.type === 'ui' && uiMode !== 'plan' && isUiDocument(assistantContent)) {
        setActiveUiTab('preview');
      }
    }
  };

  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user, updateBalance, systemStatus, maintenanceDismissed, setMaintenanceDismissed } = useAppStore();
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [project, setProject] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const isListeningRef = useRef(false);
  const baseInputRef = useRef('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    droppedFiles.forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = event.target?.result as string;
        const base64Data = raw.includes(',') ? raw.split(',')[1] : raw;
        setFiles(prev => [...prev, { name: file.name, data: base64Data, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'ar-SA';

      rec.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      rec.onend = () => {
        if (isListeningRef.current) {
          try {
            rec.start();
          } catch (e) {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      rec.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        if (fullTranscript) {
          const base = baseInputRef.current;
          setInput(base ? (base.trim() + ' ' + fullTranscript.trim()) : fullTranscript.trim());
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      toast.error('ميزة الإملاء الصوتي غير مدعومة في متصفحك الحالي.');
      return;
    }
    if (isListening) {
      isListeningRef.current = false;
      recognition.stop();
      setIsListening(false);
    } else {
      baseInputRef.current = input;
      isListeningRef.current = true;
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const [files, setFiles] = useState<{name: string, data: string, mimeType: string}[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Real-time generation job tracking
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJobType, setActiveJobType] = useState<'document' | 'video' | 'image' | 'voice' | 'text' | null>(null);
  const [simulateProgress, setSimulateProgress] = useState(false);
  const [isJobCompleted, setIsJobCompleted] = useState(false);
  
  // Settings
  const [imageModel, setImageModel] = useState('spectra');
  const [imageQuality, setImageQuality] = useState<'standard' | 'hd'>('standard');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [videoModel, setVideoModel] = useState('veo');
  const [videoResolution, setVideoResolution] = useState<'720p' | '1080p'>('720p');
  const [textModelTier, setTextModelTier] = useState<'lite' | 'core' | 'max'>('core');
  const [videoDuration, setVideoDuration] = useState('4');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [selectedCoord, setSelectedCoord] = useState<{msgId: string, x: number, y: number} | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [imageInstructions, setImageInstructions] = useState('');
  const [imagePreset, setImagePreset] = useState('custom');
  const [selectedVideoTemplate, setSelectedVideoTemplate] = useState<string | null>(null);
  const [selectedImageTemplate, setSelectedImageTemplate] = useState<string | null>(null);
  const [inpaintImageUrl, setInpaintImageUrl] = useState<string | null>(null);
  const [inpaintMsgId, setInpaintMsgId] = useState<string | null>(null);
  const [maskData, setMaskData] = useState<string | null>(null);
  const [selectedUiElement, setSelectedUiElement] = useState<{ desc: string; html: string } | null>(null);
  const [selectedStyleHint, setSelectedStyleHint] = useState<'modern' | 'dark_luxury' | 'minimal' | 'playful' | 'corporate' | ''>('');
  const [activeHistoryDocId, setActiveHistoryDocId] = useState<string | null>(null);
  const [activeHistoryContent, setActiveHistoryContent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeUiTab, setActiveUiTab] = useState<'chat' | 'preview' | 'code'>('chat');
  const abortControllerRef = useRef<AbortController | null>(null);
  const submitInFlightRef = useRef(false);

  const latestUiMsg = React.useMemo(() => {
    if (uiMode === 'plan') return null; // Plan mode never treats any message as a build result, even transiently
    return messages.slice().reverse().find(m => m.role === 'assistant' && m.content && parseUiMessage(m.content).hasHtml);
  }, [messages, uiMode]);

  const latestUiHtml = React.useMemo(() => {
    if (!latestUiMsg?.content) return '';
    return parseUiMessage(latestUiMsg.content).html;
  }, [latestUiMsg]);
  const latestUiCodeLines = React.useMemo(() => {
    return latestUiHtml ? latestUiHtml.split('\n').length : 0;
  }, [latestUiHtml]);

  // Settings Panels Toggles (Bottom Inline Pop-ups)
  const [showDocSettings, setShowDocSettings] = useState(false);
  const [showImageSettings, setShowImageSettings] = useState(false);
  const [showVideoSettings, setShowVideoSettings] = useState(false);

  const [exportingChatPDF, setExportingChatPDF] = useState(false);
  const [exportingMsgPDFId, setExportingMsgPDFId] = useState<string | null>(null);

  const [docType, setDocType] = useState('none');
  const [docSize, setDocSize] = useState('small');
  const [fileError, setFileError] = useState<string | null>(null);

  // Dynamic document and pricing configurations
  const [paperSize, setPaperSize] = useState<'a4' | 'a5'>('a4');
  const [pagesCount, setPagesCount] = useState<number>(5);
  const [slidesCount, setSlidesCount] = useState<number>(5);

  // File creation authorization states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [interceptedPrompt, setInterceptedPrompt] = useState<string | null>(null);
  const [chosenAuthDocType, setChosenAuthDocType] = useState<string>('pdf_slides');
  const [pendingDocConfirm, setPendingDocConfirm] = useState<{ docType: string, prompt: string, estimatedCount: number } | null>(null);
  const [textRiskPrompt, setTextRiskPrompt] = useState<{ 
    originalPrompt: string; 
    message: string; 
    wordCount: number; 
    extractedText?: string; 
    script?: string 
  } | null>(null);
  const [showFullTextRisk, setShowFullTextRisk] = useState(false);

  // Auto-resize textarea to fit text dynamically without clipping
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 44), 120)}px`;
    }
  }, [input, docType, chat?.type]);


  useEffect(() => {
    if (!chatId || !user?.uid) return;

    const unsubChat = onSnapshot(doc(db, 'chats', chatId), (docSnap) => {
      if (docSnap.exists()) {
        const chatData = { id: docSnap.id, ...docSnap.data() } as ChatSession;
        setChat(chatData);

        if (chatData.projectId) {
          getDoc(doc(db, 'projects', chatData.projectId)).then(pDoc => {
            if (pDoc.exists()) setProject({ id: pDoc.id, ...pDoc.data() });
          }).catch(err => console.warn('getDoc project error:', err));
        }
      }
    }, (error) => {
      console.warn('onSnapshot chat error:', error);
    });

    let unsubFallback: (() => void) | null = null;

    const setupFallbackListener = () => {
      console.warn('[Messages onSnapshot] Falling back to unindexed single-field query');
      const fallbackQ = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        where('ownerId', '==', user.uid)
      );
      unsubFallback = onSnapshot(
        fallbackQ,
        (snapshot) => {
          const msgs = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
          if (msgs.length > 100) {
            msgs.splice(0, msgs.length - 100);
          }
          setMessages(msgs);
        },
        (fallbackErr) => {
          console.error('[Messages onSnapshot] Fallback query failed:', fallbackErr);
          toast.error('تعذّر تحميل الرسائل، جاري إعادة المحاولة...');
        }
      );
    };

    const q = query(collection(db, 'messages'), where('chatId', '==', chatId), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'), limit(100));
    const unsubMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
      setMessages(msgs);
    }, (error) => {
      console.error('[Messages onSnapshot] Primary query failed:', error?.code, error?.message);
      toast.error('جاري جلب الرسائل من النسخة الاحتياطية...');
      setupFallbackListener();
    });

    return () => {
      unsubChat();
      unsubMessages();
      if (unsubFallback) unsubFallback();
    };
  }, [chatId, user?.uid]);

  // Resume tracking any active generation job for this chat if page is reloaded or returned to
  useEffect(() => {
    if (!chatId || !user?.uid) return;
    const recentTime = Date.now() - 10 * 60 * 1000;
    const qJobs = query(
      collection(db, 'generation_jobs'),
      where('chatId', '==', chatId),
      where('ownerId', '==', user.uid),
      where('createdAt', '>=', recentTime)
    );
    const unsubJobs = onSnapshot(qJobs, (snapshot) => {
      const activeDoc = snapshot.docs.find(d => {
        const status = d.data().status;
        return status === 'queued' || status === 'starting' || status === 'generating';
      });
      if (activeDoc) {
        const jobData = activeDoc.data();
        setActiveJobId(activeDoc.id);
        setActiveJobType(jobData.type || (chat?.type as any) || 'image');
        setLoading(true);
      } else {
        if (submitInFlightRef.current) return; // submission owns spinner
        setLoading(false);
        setActiveJobId(null);
        setActiveJobType(null);
        setIsJobCompleted(false);

        // If there was an active job and it just transitioned to completed or failed
        const completedDocs = snapshot.docs.filter(d => d.data().status === 'completed');
        completedDocs.forEach(d => {
          const jobData = d.data();
          if (jobData.result) {
            const localId = d.id || `media_${Date.now()}`;
            saveDoc(localId, jobData.result).catch(console.error);
          }
        });
      }
    }, (err) => console.warn('Active jobs listener notice:', err));

    return () => unsubJobs();
  }, [chatId, user?.uid, chat?.type]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleExportChatToPDF = async () => {
    if (!chat || messages.length === 0) return;
    try {
      setExportingChatPDF(true);
      await exportChatPDF(chat.title, messages, project?.name);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تصدير المحادثة كـ PDF');
    } finally {
      setExportingChatPDF(false);
    }
  };

  const handleDownloadPNG = async (msg: ChatMessage) => {
    if (!msg.mediaUrl) return;
    try {
      setExportingMsgPDFId(msg.id); // Reusing the same loading state for simplicity
      let realUrl = msg.mediaUrl;
      if (realUrl.startsWith('local:')) {
        const localDoc = await getLocalDoc(realUrl.split('local:')[1]);
        if (localDoc) realUrl = localDoc;
      }

      // Pick the correct extension + MIME by media type (voice was downloading as .png).
      const isAudio = msg.mediaType === 'audio' || chat?.type === 'voice';
      const isVideo = msg.mediaType === 'video' || chat?.type === 'video';
      const ext = isAudio ? 'wav' : isVideo ? 'mp4' : 'png';
      const mime = isAudio ? 'audio/wav' : isVideo ? 'video/mp4' : 'image/png';
      const label = isAudio ? 'Audio' : isVideo ? 'Video' : 'Image';

      downloadBase64File(realUrl, `NajeAI_${label}_${Date.now()}.${ext}`, mime, { prompt: msg.content });
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحميل الملف');
    } finally {
      setExportingMsgPDFId(null);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) {
      toast.error('الرجاء الانتظار حتى يكتمل طلبك الحالي قبل إرسال طلب جديد.');
      return;
    }
    if ((!input.trim() && files.length === 0) || !chat || !user) return;
    
    // Auto detect if user is requesting files and they haven't manually chosen document mode
    /* Removing strict keyword based interception as requested by user to make it smarter */

    await executeSubmission(input, docType);
  };

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] w-full p-8 text-center">
        <NajeThinking size={48} className="mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">جاري إعداد المساحة...</p>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-[100dvh] bg-[#FAF9FC] dark:bg-[#0d0f12] relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#0f1115]/90 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-indigo-500 rounded-3xl m-4"
          >
            <div className="p-6 bg-indigo-500/10 rounded-full mb-4 text-indigo-400 animate-bounce">
              <Paperclip className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">أفلت الملفات هنا للتحميل المباشر</h3>
            <p className="text-sm text-gray-400">يدعم الصور والمستندات والملفات المدعومة</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redesigned Slim Responsive Single-Row Header */}
      <header className="px-3 sm:px-4 h-12 sm:h-14 min-h-[48px] sm:min-h-[56px] naje-glass-card-lg rounded-none border-t-0 border-r-0 border-l-0 flex items-center justify-between sticky top-0 z-10 w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          
          {/* Sidebar toggle button (replaces back button as requested) */}
          <button 
            onClick={() => useAppStore.getState().setSidebarOpen(!useAppStore.getState().sidebarOpen)}
            className="p-1.5 text-gray-800 dark:text-purple-100 dark:hover:text-white hover:text-gray-900 transition rounded-xl hover:bg-white dark:hover:bg-gray-900/60 flex items-center justify-center cursor-pointer active:scale-95"
            title="توسيع/طي القائمة"
          >
            <PanelRight className="w-4 h-4" />
          </button>

          <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            {chat.type === 'ui' ? <Layout size={16} className="text-emerald-600 dark:text-emerald-400" /> : chat.type === 'voice' ? <Mic2 size={16} className="text-emerald-500" /> : chat.type === 'image' ? <ImageIcon size={16}/> : chat.type === 'video' ? <Film size={16}/> : <span className="text-xs font-bold text-gray-500">دردشة</span>}
          </div>
          
          <div className="min-w-0">
            <h2 className="font-extrabold text-gray-900 dark:text-white text-xs truncate leading-tight">{chat.title}</h2>
            <p className="text-[10px] text-gray-800 dark:text-gray-400 truncate">
              {chat.type === 'voice' ? 'استوديو التسجيلات الصوتية (Naje Voice)' : chat.type === 'ui' ? 'مُنشئ واجهات النواة الناتجة' : chat.type === 'text' ? 'دردشة عادية وتحليل نصوص' : `توليد ${chat.type === 'image' ? 'صور (نقاط)' : 'فيديو سينمائي (نقاط)'}`}
            </p>
          </div>
        </div>

        {chat.type === 'ui' ? (
          <div className="flex items-center gap-2">
            <div className="bg-slate-200/70 dark:bg-slate-900/90 p-1 rounded-xl flex items-center gap-1 border border-slate-300/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveUiTab('chat')}
              className={cn(
                "relative px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95",
                activeUiTab === 'chat' ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              {activeUiTab === 'chat' && (
                <motion.div layoutId="activeTabHighlight" className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm" transition={{ type: "spring", bounce: 0.15, duration: 0.3 }} />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden min-[420px]:inline">المحادثة</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveUiTab('preview')}
              className={cn(
                "relative px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95",
                activeUiTab === 'preview' ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              {activeUiTab === 'preview' && (
                <motion.div layoutId="activeTabHighlight" className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm" transition={{ type: "spring", bounce: 0.15, duration: 0.3 }} />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden min-[420px]:inline">المعاينة</span>
                {loading && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveUiTab('code')}
              className={cn(
                "relative px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95",
                activeUiTab === 'code' ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              {activeUiTab === 'code' && (
                <motion.div layoutId="activeTabHighlight" className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm" transition={{ type: "spring", bounce: 0.15, duration: 0.3 }} />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                <span className="hidden min-[420px]:inline">الكود</span>
                {latestUiCodeLines > 0 && (
                  <span className="text-[10px] text-gray-400 font-mono">({latestUiCodeLines})</span>
                )}
              </span>
            </button>
          </div>
        </div>
        ) : (
          messages.length > 0 && (
            <button
              onClick={handleExportChatToPDF}
              disabled={exportingChatPDF}
              className="hidden sm:flex items-center gap-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 hover:text-gray-900 dark:hover:text-white border border-indigo-400 dark:border-indigo-500/10 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              {exportingChatPDF ? (
                <NajeSpinner className="w-3 h-3" />
              ) : (
                <FileText className="w-3 h-3" />
              )}
              <span>تصدير PDF</span>
            </button>
          )
        )}
      </header>

      {/* Messages / Panel Container */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-0 w-full relative">
        {chat?.type === 'ui' ? (
          <UiChatPanel
            messages={messages}
            loading={loading}
            activeUiTab={activeUiTab}
            setActiveUiTab={setActiveUiTab}
            UI_STARTER_TEMPLATES={UI_STARTER_TEMPLATES}
            setInput={setInput}
            executeSubmission={executeSubmission}
            latestUiHtml={latestUiHtml}
            latestUiMsg={latestUiMsg || undefined}
            messagesEndRef={messagesEndRef}
            handleSend={handleSend}
            uiMode={uiMode}
            setUiMode={setUiMode}
            uiModelTier={uiModelTier}
            setUiModelTier={setUiModelTier}
            modelDropdownRef={modelDropdownRef}
            modelDropdownOpen={modelDropdownOpen}
            setModelDropdownOpen={setModelDropdownOpen}
            MODEL_TIER_INFO={MODEL_TIER_INFO}
            getMismatchSuggestion={getMismatchSuggestion}
            input={input}
            selectedUiElement={selectedUiElement}
            setSelectedUiElement={setSelectedUiElement}
            textareaRef={textareaRef}
            files={files}
            abortControllerRef={abortControllerRef}
            setLoading={setLoading}
            aspectRatio={aspectRatio}
            imageQuality={imageQuality}
            videoResolution={videoResolution}
            project={project}
            setMessages={setMessages}
            user={user}
            chatId={chatId}
            setActiveHistoryDocId={setActiveHistoryDocId}
            setActiveHistoryContent={setActiveHistoryContent}
          />
        ) : (
          <TextChatPanel
            messages={messages}
            chat={chat}
            loading={loading}
            setActiveUiTab={setActiveUiTab}
            editingMessageId={editingMessageId}
            setEditingMessageId={setEditingMessageId}
            editInstruction={editInstruction}
            setEditInstruction={setEditInstruction}
            executeSubmission={executeSubmission}
            selectedCoord={selectedCoord}
            setSelectedCoord={setSelectedCoord}
            setInpaintImageUrl={setInpaintImageUrl}
            setInpaintMsgId={setInpaintMsgId}
            handleDownloadPNG={handleDownloadPNG}
            exportingMsgPDFId={exportingMsgPDFId}
            setActiveHistoryDocId={setActiveHistoryDocId}
            setActiveHistoryContent={setActiveHistoryContent}
            handleFavorite={handleFavorite}
            favorites={favorites}
            openFeedback={openFeedback}
            votedMessages={votedMessages}
            getLocalDoc={getLocalDoc}
            downloadBase64File={downloadBase64File}
            activeJobType={activeJobType}
            activeJobId={activeJobId}
            isJobCompleted={isJobCompleted}
            latestUiHtml={latestUiHtml}
            uiMode={uiMode}
            pendingDocConfirm={pendingDocConfirm}
            setPendingDocConfirm={setPendingDocConfirm}
            paperSize={paperSize}
            setDocType={setDocType}
            setSlidesCount={setSlidesCount}
            setPagesCount={setPagesCount}
            messagesEndRef={messagesEndRef}
            handleSend={handleSend}
            selectedVideoTemplate={selectedVideoTemplate}
            videoTemplates={resolvedVideoTemplates}
            setSelectedVideoTemplate={setSelectedVideoTemplate}
            selectedImageTemplate={selectedImageTemplate}
            imageTemplates={resolvedImageTemplates}
            setSelectedImageTemplate={setSelectedImageTemplate}
            imageInstructions={imageInstructions}
            setImageInstructions={setImageInstructions}
            showDocSettings={showDocSettings}
            setShowDocSettings={setShowDocSettings}
            docType={docType}
            slidesCount={slidesCount}
            pagesCount={pagesCount}
            setPaperSize={setPaperSize}
            getCalculatedCost={getCalculatedCost}
            showImageSettings={showImageSettings}
            setShowImageSettings={setShowImageSettings}
            imageModel={imageModel}
            setImageModel={setImageModel}
            imageQuality={imageQuality}
            setImageQuality={setImageQuality}
            imagePreset={imagePreset}
            setImagePreset={setImagePreset}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            files={files}
            showVideoSettings={showVideoSettings}
            setShowVideoSettings={setShowVideoSettings}
            videoModel={videoModel}
            setVideoModel={setVideoModel}
            videoResolution={videoResolution}
            setVideoResolution={setVideoResolution}
            videoDuration={videoDuration}
            setVideoDuration={setVideoDuration}
            showVoiceSettings={showVoiceSettings}
            setShowVoiceSettings={setShowVoiceSettings}
            voiceMode={voiceMode}
            setVoiceMode={setVoiceMode}
            voiceTier={voiceTier}
            setVoiceTier={setVoiceTier}
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            speaker1Name={speaker1Name}
            setSpeaker1Name={setSpeaker1Name}
            speaker1Voice={speaker1Voice}
            setSpeaker1Voice={setSpeaker1Voice}
            speaker2Name={speaker2Name}
            setSpeaker2Name={setSpeaker2Name}
            speaker2Voice={speaker2Voice}
            setSpeaker2Voice={setSpeaker2Voice}
            deliveryStyle={deliveryStyle}
            setDeliveryStyle={setDeliveryStyle}
            playingVoiceSample={playingVoiceSample}
            playVoicePreview={playVoicePreview}
            input={input}
            fileError={fileError}
            setFileError={setFileError}
            removeFile={removeFile}
            textModelTier={textModelTier}
            setTextModelTier={setTextModelTier}
            uiModelTier={uiModelTier}
            setUiModelTier={setUiModelTier}
            VOICES={VOICES}
            handleFileChange={handleFileChange}
            isListening={isListening}
            toggleListening={toggleListening}
            enableSearchGrounding={enableSearchGrounding}
            setEnableSearchGrounding={setEnableSearchGrounding}
            textareaRef={textareaRef}
            setIsJobCompleted={setIsJobCompleted}
            setInput={setInput}
            setLoading={setLoading}
          />
        )}
      </div>

      {/* ========================================================
         INTERCEPTED FILE GENERATION AUTHORIZATION MODAL
         ======================================================== */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-white dark:bg-black/75 backdrop-blur-md" 
              onClick={() => { setShowAuthModal(false); setInterceptedPrompt(null); }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-[#0d0f12] border border-gray-200 dark:border-gray-900 rounded-2xl p-6 w-full max-w-[480px] shadow-2xl flex flex-col gap-5 text-right z-10"
              dir="rtl"
            >
              <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-900 pb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">تفويض وتفعيل توليد الملفات</h3>
                  <p className="text-[11px] text-gray-800 dark:text-gray-400 mt-0.5">لقد لاحظنا أنك تطلب إنشاء ملف أو مستند في رسالتك.</p>
                </div>
              </div>

              <div className="text-xs text-gray-800 dark:text-gray-400 leading-relaxed bg-indigo-950/10 border border-indigo-900/10 p-3 rounded-xl">
                <span>الرسالة المكتوبة:</span>
                <p className="text-gray-900 dark:text-white font-medium mt-1 italic font-sans truncate">"{interceptedPrompt}"</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-800 dark:text-gray-400 ">تحديد نوع الملف المراد توليده:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'pptx', label: 'PowerPoint', icon: najeChartBars },
                      { id: 'pdf_slides', label: 'شرائح PDF', icon: najeFilmstrip },
                      { id: 'pdf_doc', label: 'مستند PDF', icon: najeDocument },
                      { id: 'docx', label: 'Word', icon: najePencilWrite }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setChosenAuthDocType(opt.id)}
                        className={cn(
                          "py-3 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer",
                          chosenAuthDocType === opt.id
                            ? "bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                            : "bg-gray-50 dark:bg-gray-950/40 border-gray-200 dark:border-gray-900 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900"
                        )}
                      >
                        <img src={opt.icon} alt="" className="w-5 h-5 object-contain" />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-config depending on chosen type */}
                {(chosenAuthDocType === 'pptx' || chosenAuthDocType === 'pdf_slides') ? (
                  <div className="flex flex-col gap-1.5 mt-3">
                    <span className="text-xs text-gray-800 dark:text-gray-400 ">عدد الشرائح المطلوبة (0.2 نقطة/شريحة):</span>
                    <div className="flex flex-wrap gap-2">
                      {[3, 5, 7, 10, 15, 20].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSlidesCount(num)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer",
                            slidesCount === num
                              ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-600 dark:text-indigo-400"
                              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          )}
                        >
                          {num} شرائح
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 mt-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-gray-800 dark:text-gray-400 ">مقاس الصفحة:</span>
                      <div className="flex gap-2">
                        {['a4', 'a5'].map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setPaperSize(size as 'a4' | 'a5')}
                            className={cn(
                              "flex-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer uppercase",
                              paperSize === size
                                ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-600 dark:text-indigo-400"
                                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            )}
                          >
                            {size} ({size === 'a4' ? '0.15' : '0.1'} نقطة/صفحة)
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-gray-800 dark:text-gray-400 ">عدد الصفحات:</span>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 5, 7, 10, 15, 20].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setPagesCount(num)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer",
                              pagesCount === num
                                ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-600 dark:text-indigo-400"
                                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            )}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Total points card */}
              <div className="bg-indigo-600/[0.03] border border-indigo-500/15 rounded-xl p-3 flex justify-between items-center text-xs">
                <span className="text-gray-800 dark:text-gray-400 font-semibold">التكلفة الإجمالية المطلوبة:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">{getAuthModalCost()} نقاط</span>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const textToSend = interceptedPrompt || input;
                    if (!textToSend || !textToSend.trim()) {
                      toast.error('الرجاء كتابة نص طلبك أولاً.');
                      return;
                    }
                    setDocType(chosenAuthDocType);
                    setShowAuthModal(false);
                    toast.success('تم تفعيل محرك توليد الملفات! جاري إنشاء المستند...');
                    await executeSubmission(textToSend, chosenAuthDocType);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/10 cursor-pointer text-center active:scale-95"
                >
                  نعم، تفعيل محرك الملفات وتوليد المستند
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setDocType('none');
                      setShowAuthModal(false);
                      await executeSubmission(interceptedPrompt || input, 'none');
                    }}
                    className="w-1/2 py-2.5 bg-gray-50 dark:hover:bg-gray-950 hover:bg-white dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-900 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-bold transition cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                  >
                    استمرار كدردشة نصية فقط
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthModal(false);
                      setInterceptedPrompt(null);
                    }}
                    className="w-1/2 py-2.5 bg-white dark:hover:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-400 rounded-xl text-xs font-bold transition cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                  >
                    تراجع وإلغاء الأمر
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Feedback bottom-sheet (Naje identity) */}
        {feedbackTarget && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setFeedbackTarget(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              dir="rtl"
              className="relative w-full max-w-lg bg-white dark:bg-[#0c0d10] border-t border-x border-gray-200 dark:border-gray-800 rounded-t-3xl p-6 pb-8 shadow-2xl"
            >
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-5" />
              <div className="flex items-center gap-2 mb-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${feedbackTarget.signal === 'up' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-red-500/10 text-red-500'}`}>
                  {feedbackTarget.signal === 'up' ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">ليش اخترت هالتقييم؟</h3>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {(feedbackTarget.signal === 'up' ? feedbackReasonsUp : feedbackReasonsDown).map(r => (
                  <button
                    key={r}
                    onClick={() => toggleFeedbackReason(r)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer border ${feedbackReasons.includes(r) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-indigo-400'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                value={feedbackNote}
                onChange={e => setFeedbackNote(e.target.value)}
                placeholder="تقديم ملاحظات إضافية (اختياري)"
                rows={3}
                className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition resize-none mb-4"
              />

              <p className="text-[11px] text-gray-500 leading-relaxed mb-5">
                تُستخدم ملاحظتك لتحسين جودة ناجي. لا نخزّن أي محتوى حساس، ويمكنك تجاهل هذا في أي وقت.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={submitFeedback}
                  disabled={feedbackSubmitting}
                  className="flex-1 py-3 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:opacity-90 text-white rounded-2xl text-sm font-bold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {feedbackSubmitting ? <NajeSpinner className="w-4 h-4" /> : 'إرسال'}
                </button>
                <button
                  onClick={() => setFeedbackTarget(null)}
                  className="px-5 py-3 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Smart Text-Risk Gate Confirmation Modal */}
        {textRiskPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md max-h-[88vh] sm:max-h-[85vh] overflow-y-auto scrollbar-thin bg-white dark:bg-[#12141a] border border-gray-200 dark:border-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/10 flex items-center justify-center text-lg sm:text-xl shrink-0">
                  
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">تنبيه جودة النص في الصورة</h3>
                  <span className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-medium">نظام الفحص والتوليد الذكي</span>
                </div>
              </div>

              {textRiskPrompt.extractedText && (
                <div className="p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-xl sm:rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
                    <span>النص المطلوب كتابته داخل الصورة:</span>
                    <span className="px-2 py-0.5 bg-amber-200/60 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 rounded-md font-bold text-[10px] sm:text-[11px]">
                      {textRiskPrompt.wordCount === 1 ? 'كلمة واحدة' : textRiskPrompt.wordCount === 2 ? 'كلمتان' : (textRiskPrompt.wordCount >= 3 && textRiskPrompt.wordCount <= 10) ? `${textRiskPrompt.wordCount} كلمات` : `${textRiskPrompt.wordCount} كلمة`}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-gray-900/80 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-center dir-rtl">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white break-words leading-relaxed">
                      "{(!showFullTextRisk && textRiskPrompt.extractedText.length > 80)
                        ? textRiskPrompt.extractedText.slice(0, 80) + '...'
                        : textRiskPrompt.extractedText}"
                    </p>
                    {textRiskPrompt.extractedText.length > 80 && (
                      <button
                        type="button"
                        onClick={() => setShowFullTextRisk(!showFullTextRisk)}
                        className="mt-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline cursor-pointer inline-flex items-center gap-1"
                      >
                        {showFullTextRisk ? 'عرض أقل' : 'عرض المزيد'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {textRiskPrompt.message}
              </p>

              <div className="p-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl sm:rounded-2xl text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <span>تنبيه</span>
                <span>ننصح بالترقية إلى <strong className="font-bold text-indigo-600 dark:text-indigo-400">Naje Imagen Pro</strong> لمعالجة اتصال الحروف والنصوص بدقة متناهية.</span>
              </div>

              <div className="pt-1 sm:pt-2 space-y-2">
                <button
                  onClick={() => {
                    const p = textRiskPrompt.originalPrompt;
                    setTextRiskPrompt(null);
                    setShowFullTextRisk(false);
                    setImageModel('nova');
                    executeSubmission(p, undefined, undefined, undefined, undefined, true, 'nova');
                  }}
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:opacity-90 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  الترقية إلى Naje Imagen Pro والمتابعة
                </button>
                <button
                  onClick={() => {
                    const p = textRiskPrompt.originalPrompt;
                    setTextRiskPrompt(null);
                    setShowFullTextRisk(false);
                    executeSubmission(p, undefined, undefined, undefined, undefined, true);
                  }}
                  className="w-full py-2 sm:py-2.5 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl sm:rounded-2xl text-xs font-semibold transition cursor-pointer"
                >
                  المتابعة بالنموذج العادي الحالي
                </button>
                <button
                  onClick={() => {
                    setTextRiskPrompt(null);
                    setShowFullTextRisk(false);
                  }}
                  className="w-full py-1.5 sm:py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-medium transition cursor-pointer"
                >
                  إلغاء الأمر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inpaint Brush Modal */}
      {inpaintImageUrl && (
        <NajeImageInpainter
          imageUrl={inpaintImageUrl}
          onApplyMask={(maskDataUrl) => {
            setInpaintImageUrl(null);
            if (inpaintMsgId) {
              setEditingMessageId(inpaintMsgId);
            }
            const maskBase64 = maskDataUrl.includes(',') ? maskDataUrl.split(',')[1] : maskDataUrl;
            setMaskData(maskBase64); // Dedicated top-level mask channel (never push to files)
            setEditInstruction('');
            toast.success('تم تحديد القناع بالفرشاة! اكتب تفاصيل التعديل واضغط تطبيق.');
          }}
          onClose={() => setInpaintImageUrl(null)}
        />
      )}

      {/* Edit History & Version Control Drawer */}
      {activeHistoryDocId && (
        <NajeVersionHistoryDrawer
          docId={activeHistoryDocId}
          currentContent={activeHistoryContent || ''}
          onRestoreVersion={(restoredContent, versionNumber) => {
            toast.success(`تم استرجاع الإصدار v${versionNumber} بنجاح!`);
          }}
          onClose={() => setActiveHistoryDocId(null)}
        />
      )}
    </div>
  );
}
