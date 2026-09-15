import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { 
  FileText, AlertCircle, X, ImageIcon, Film, Mic2, Sparkles, Sliders, Paperclip, Mic, Globe, ArrowUp, ChevronDown, Zap,
  BarChart3, LayoutGrid, CheckCircle2, TrendingUp, Compass
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import { InteractiveLoadingPlaceholder } from '../InteractiveLoadingPlaceholder';
import { BrandKitFormModal } from '../BrandKitFormModal';
import { INFOGRAPHIC_THUMBNAILS } from '../../data/templateThumbnails';
import NajeFlowStepper from '../NajeFlowStepper';
import NajeProgressLine from '../NajeProgressLine';
import NajeReasoningIndicator, { NajeThinkingGeneric, NajePlanningIndicator } from '../NajeReasoningIndicator';
import NajeThinking from '../NajeThinking';
import NajeSmartLoader from '../NajeSmartLoader';
import NajeSelect from '../NajeSelect';
import NajeModelTierSelector, { NajeImageModelSelector, NajeVideoModelSelector } from '../NajeModelTierSelector';
import NajeErrorCard from '../NajeErrorCard';
import { useAppStore } from '../../store';
import { usePricingConfig } from '../../hooks/usePricingConfig';
import { ImageSettingsPanel } from './ImageChatPanel';
import { VideoSettingsPanel } from './VideoChatPanel';
import { VoiceSettingsPanel } from './VoiceChatPanel';
import { Message, Chat } from '../../types';
import najePersonaDesignerData from '../../assets/icons/naje-persona-designer-data.svg';
import najeDocument from '../../assets/icons/naje-document.svg';
import najeChartBars from '../../assets/icons/naje-chart-bars.svg';
import najeMagnifier from '../../assets/icons/naje-magnifier.svg';
import najePencilWrite from '../../assets/icons/naje-pencil-write.svg';
import najeChatTyping from '../../assets/icons/naje-chat-typing.svg';
import najeFilmstrip from '../../assets/icons/naje-filmstrip.svg';
import najeSpark from '../../assets/icons/naje-spark.svg';
import najeRulerSpec from '../../assets/icons/naje-ruler-spec.svg';
import najeTemplateGallery from '../../assets/icons/naje-template-gallery.svg';

function NajeEditTransmission({ imageSrc, getLocalDoc }: { imageSrc: string; getLocalDoc?: (id: string) => Promise<string | null> }) {
  const [b64Src, setB64Src] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!imageSrc) return;
    if (imageSrc.startsWith('local:')) {
      const id = imageSrc.split('local:')[1];
      if (getLocalDoc) {
        getLocalDoc(id).then(doc => {
          if (doc) setB64Src(doc.startsWith('data:') ? doc : `data:image/png;base64,${doc}`);
        }).catch(console.error);
      }
    } else if (imageSrc.startsWith('data:')) {
      setB64Src(imageSrc);
    } else {
      setB64Src(`data:image/png;base64,${imageSrc}`);
    }
  }, [imageSrc, getLocalDoc]);

  return (
    <div className="flex items-center justify-center gap-3 p-3 my-2 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 backdrop-blur-md shadow-lg">
      {b64Src && (
        <motion.img
          src={b64Src}
          className="w-11 h-11 rounded-xl object-cover border-2 border-indigo-400/60 shadow-md flex-shrink-0"
          initial={{ scale: 0.9, opacity: 0.8 }}
          animate={{ scale: [0.9, 1.06, 0.94, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-400"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.4, 0.8] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <span className="font-semibold text-indigo-100">جاري إرسال الصورة الأصلية والتعليمات للنموذج...</span>
    </div>
  );
}

interface TextChatPanelProps {
  messages: Message[];
  chat: Chat;
  loading: boolean;
  setActiveUiTab: (tab: 'chat' | 'preview' | 'code') => void;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  editInstruction: string;
  setEditInstruction: (val: string) => void;
  executeSubmission: (...args: any[]) => void;
  selectedCoord: { msgId: string; x: number; y: number } | null;
  setSelectedCoord: (coord: { msgId: string; x: number; y: number } | null) => void;
  setInpaintImageUrl: (url: string | null) => void;
  setInpaintMsgId: (id: string | null) => void;
  handleDownloadPNG: (msg: any) => void;
  exportingMsgPDFId: string | null;
  setActiveHistoryDocId: (id: string | null) => void;
  setActiveHistoryContent: (content: string | null) => void;
  handleFavorite: (msgId: string) => void;
  favorites: string[];
  openFeedback: (msgId: string, rating: 'up' | 'down') => void;
  votedMessages: Record<string, 'up' | 'down'>;
  getLocalDoc: (id: string) => Promise<string | null>;
  downloadBase64File: (b64: string, filename: string, mime: string) => void;
  activeJobType: string | null;
  activeJobId: string | null;
  isJobCompleted: boolean;
  latestUiHtml: string;
  uiMode: 'plan' | 'build';
  pendingDocConfirm: any;
  setPendingDocConfirm: (val: any) => void;
  paperSize: 'a4' | 'a5';
  setDocType: (val: string) => void;
  setSlidesCount: (val: number) => void;
  setPagesCount: (val: number) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSend: (e: React.FormEvent) => void;
  selectedVideoTemplate: string | null;
  videoTemplates: any[];
  setSelectedVideoTemplate: (id: string | null) => void;
  selectedImageTemplate: string | null;
  imageTemplates: any[];
  setSelectedImageTemplate: (id: string | null) => void;
  imageInstructions: string;
  setImageInstructions: (val: string) => void;
  showDocSettings: boolean;
  setShowDocSettings: (val: boolean) => void;
  docType: string;
  slidesCount: number;
  pagesCount: number;
  setPaperSize: (val: 'a4' | 'a5') => void;
  getCalculatedCost: () => number;
  showImageSettings: boolean;
  setShowImageSettings: (val: boolean) => void;
  imageModel: string;
  setImageModel: (val: string) => void;
  imageQuality: string;
  setImageQuality: (val: any) => void;
  imagePreset: string;
  setImagePreset: (val: string) => void;
  aspectRatio: string;
  setAspectRatio: (val: string) => void;
  files: any[];
  showVideoSettings: boolean;
  setShowVideoSettings: (val: boolean) => void;
  videoModel: string;
  setVideoModel: (val: string) => void;
  videoResolution: string;
  setVideoResolution: (val: any) => void;
  videoDuration: string | number;
  setVideoDuration: (val: any) => void;
  showVoiceSettings: boolean;
  setShowVoiceSettings: (val: boolean) => void;
  voiceMode: 'single' | 'dual' | 'multi';
  setVoiceMode: (val: any) => void;
  voiceTier?: 'core' | 'pro';
  setVoiceTier?: (val: 'core' | 'pro') => void;
  selectedVoice: string;
  setSelectedVoice: (val: string) => void;
  speaker1Name: string;
  setSpeaker1Name: (val: string) => void;
  speaker1Voice: string;
  setSpeaker1Voice: (val: string) => void;
  speaker2Name: string;
  setSpeaker2Name: (val: string) => void;
  speaker2Voice: string;
  setSpeaker2Voice: (val: string) => void;
  deliveryStyle: string;
  setDeliveryStyle: (val: string) => void;
  playingVoiceSample: string | null;
  playVoicePreview: (id: string) => void;
  input: string;
  fileError: string | null;
  setFileError: (val: string | null) => void;
  removeFile: (idx: number) => void;
  textModelTier: 'lite' | 'core' | 'max';
  setTextModelTier: (val: 'lite' | 'core' | 'max') => void;
  uiModelTier: 'lite' | 'core' | 'max';
  setUiModelTier: (val: 'lite' | 'core' | 'max') => void;
  VOICES: any[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isListening: boolean;
  toggleListening: () => void;
  enableSearchGrounding: boolean;
  setEnableSearchGrounding: React.Dispatch<React.SetStateAction<boolean>>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setIsJobCompleted: (val: boolean) => void;
  setInput: (val: string) => void;
  setLoading: (val: boolean) => void;
}

export default function TextChatPanel({
  messages,
  chat,
  loading,
  setActiveUiTab,
  editingMessageId,
  setEditingMessageId,
  editInstruction,
  setEditInstruction,
  executeSubmission,
  selectedCoord,
  setSelectedCoord,
  setInpaintImageUrl,
  setInpaintMsgId,
  handleDownloadPNG,
  exportingMsgPDFId,
  setActiveHistoryDocId,
  setActiveHistoryContent,
  handleFavorite,
  favorites,
  openFeedback,
  votedMessages,
  getLocalDoc,
  downloadBase64File,
  activeJobType,
  activeJobId,
  isJobCompleted,
  latestUiHtml,
  uiMode,
  pendingDocConfirm,
  setPendingDocConfirm,
  paperSize,
  setDocType,
  setSlidesCount,
  setPagesCount,
  messagesEndRef,
  handleSend,
  selectedVideoTemplate,
  videoTemplates,
  setSelectedVideoTemplate,
  selectedImageTemplate,
  imageTemplates,
  setSelectedImageTemplate,
  imageInstructions,
  setImageInstructions,
  showDocSettings,
  setShowDocSettings,
  docType,
  slidesCount,
  pagesCount,
  setPaperSize,
  getCalculatedCost,
  showImageSettings,
  setShowImageSettings,
  imageModel,
  setImageModel,
  imageQuality,
  setImageQuality,
  imagePreset,
  setImagePreset,
  aspectRatio,
  setAspectRatio,
  files,
  showVideoSettings,
  setShowVideoSettings,
  videoModel,
  setVideoModel,
  videoResolution,
  setVideoResolution,
  videoDuration,
  setVideoDuration,
  showVoiceSettings,
  setShowVoiceSettings,
  voiceMode,
  setVoiceMode,
  voiceTier = 'core',
  setVoiceTier,
  selectedVoice,
  setSelectedVoice,
  speaker1Name,
  setSpeaker1Name,
  speaker1Voice,
  setSpeaker1Voice,
  speaker2Name,
  setSpeaker2Name,
  speaker2Voice,
  setSpeaker2Voice,
  deliveryStyle,
  setDeliveryStyle,
  playingVoiceSample,
  playVoicePreview,
  input,
  fileError,
  setFileError,
  removeFile,
  textModelTier,
  setTextModelTier,
  uiModelTier,
  setUiModelTier,
  VOICES,
  handleFileChange,
  isListening,
  toggleListening,
  enableSearchGrounding,
  setEnableSearchGrounding,
  textareaRef,
  setIsJobCompleted,
  setInput,
  setLoading
}: TextChatPanelProps) {
  const { user, systemStatus, maintenanceDismissed, setMaintenanceDismissed } = useAppStore();
  const pricing = usePricingConfig();
  const [isBrandKitModalOpen, setIsBrandKitModalOpen] = useState(false);
  const [showInfographicModal, setShowInfographicModal] = useState(false);
  const [dismissedInfographicChip, setDismissedInfographicChip] = useState(false);

  const textFeatures = [
    { id: '1', icon: najeDocument, title: 'توليد مستندات وشرائح باذخة', desc: 'صياغة ملفات Word، PDF، وسلايدات برزنتيشن منسقة وجاهزة بالكامل.', prompt: 'اكتب لي تقرير شامل عن الذكاء الاصطناعي التوليدي في 5 صفحات' },
    { id: '2', icon: najePersonaDesignerData, title: 'إنفوجرافيك مرئي احترافي — «المصمم»', desc: 'تصميم إنفوجرافيك عالي الدقة لإبراز الإحصائيات والمقارنات والخطط.', prompt: 'صمم إنفوجرافيك شبكة إحصائيات احترافي لأهم مؤشرات الأداء والنمو' },
    { id: '3', icon: najeMagnifier, title: 'بحث مباشر في Google Grounding', desc: 'الوصول للنتائج الحية والمصادر الحديثة عبر محرك بحث جوجل المباشر.', prompt: 'أحدث المستجدات في العالم اليوم مع المصادر' },
    { id: '4', icon: najePencilWrite, title: 'صياغة المراسلات والخطابات الرسمية', desc: 'كتابة المقالات والخطابات والبريد الإلكتروني بأسلوب احترافي رفيع.', prompt: 'صغ خطاب رسمي بطلب دعم مشروع تقني موجه لمدير الشركة' }
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full overflow-hidden relative">
      {/* Scrollable Messages Region */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 md:p-6 pb-12 sm:pb-6 w-full">
        <div className="max-w-[800px] mx-auto space-y-6 w-full">
          
          {/* Maintenance Mode Card */}
          {systemStatus?.isMaintenance && !maintenanceDismissed && (
            <div className="w-full mb-4">
              <NajeErrorCard
                onClose={() => setMaintenanceDismissed(true)}
                jsonContent={`__NAJE_ERROR_JSON__:${JSON.stringify({
                  emoji: "",
                  title: systemStatus.title || "إيقاف الخدمات مؤقتاً للتطوير والإصلاح",
                  intro: systemStatus.intro || "تم إيقاف الخدمات من أجل التطوير والإصلاح، شكراً لكم.",
                  explanation: systemStatus.explanation || "يقوم فريق المطورين حالياً بإجراء تحديثات هامة وتحسينات أمنية وشاملة للبنية التحتية لضمان تقديم أداء أفضل وأسرع لكافة المستخدمين. سينتهي العمل وتعود كافة الخدمات فور اكتمال التحديثات.",
                  solutions: Array.isArray(systemStatus.solutions) && systemStatus.solutions.length > 0 
                    ? systemStatus.solutions 
                    : ["يرجى الانتظار والعودة لاحقاً.", "تابع الإشعارات الرسمية لمعرفة فور عودة الخدمة للعمل."]
                })}`}
              />
            </div>
          )}

          {/* Welcome Screen Header */}
          {messages.length === 0 && (
            <div className="w-full flex flex-col items-center justify-center text-center py-6 sm:py-8 relative overflow-hidden">
              {/* Ambient Background Glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Pulsing AI Cosmic Composition */}
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-2xl animate-pulse scale-110" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 border border-white/10">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 rounded-xl border-2 border-white dark:border-[#0c0d10] flex items-center justify-center text-white shadow-md">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              <h3 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                مرحباً {user?.displayName?.split(" ")[0] || ""}، كيف يمكنني مساعدتك اليوم؟
              </h3>
              <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-400 max-w-md mx-auto leading-relaxed opacity-80">
                {chat?.type === 'text' 
                  ? 'مساعدك الشخصي الذكي لصياغة وتحليل النصوص وتوليد التقارير والمستندات منسقة بالكامل.' 
                  : chat?.type === 'voice'
                  ? 'استوديو التسجيلات الصوتية الاحترافي لتوليد المحادثات والتعليق الصوتي.'
                  : `استعد لابتكار أرقى ${chat?.type === 'image' ? 'التصاميم والصور الإبداعية' : 'مقاطع الفيديو الفنية السينمائية'} بدقة بكسلية متناهية.`}
              </p>
            </div>
          )}

          {/* Video Templates Selection Grid */}
          {chat?.type === 'video' && messages.length === 0 && (
            <div className="mb-6 w-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-800 dark:text-gray-300 text-xs sm:text-sm font-bold flex items-center gap-1.5">
                  <img src={najeTemplateGallery} alt="" className="w-4 h-4 object-contain" />
                  <span>اختر أسلوب فني للمقطع ({videoTemplates.length} نمط):</span>
                </h3>
                {selectedVideoTemplate && (
                  <button
                    type="button"
                    onClick={() => setSelectedVideoTemplate(null)}
                    className="text-[11px] sm:text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer bg-rose-500/10 px-2 py-1 rounded-lg"
                  >
                    <X className="w-3 h-3" /> إلغاء المحدد
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5">
                {videoTemplates.map(tmpl => {
                  const isSelected = selectedVideoTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedVideoTemplate(isSelected ? null : tmpl.id);
                      }}
                      className={`group relative rounded-2xl overflow-hidden text-right transition-all duration-200 border cursor-pointer flex flex-col ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                          : 'border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 bg-white dark:bg-gray-900'
                      }`}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={tmpl.image}
                          alt={tmpl.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            img.parentElement?.classList.add('bg-gray-300', 'dark:bg-gray-700');
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        {isSelected && (
                          <div className="absolute top-2 left-2 bg-indigo-600 text-white rounded-full p-1 shadow-md">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 left-2 text-white font-bold text-xs sm:text-sm line-clamp-1 drop-shadow-md">
                          {tmpl.name}
                        </span>
                      </div>
                      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
                        <p className="text-[11px] sm:text-xs text-gray-700 dark:text-gray-400 leading-snug line-clamp-2">
                          {tmpl.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {chat?.type === 'image' && messages.length === 0 && (
            <div className="mb-6 w-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-800 dark:text-gray-300 text-xs sm:text-sm font-bold flex items-center gap-1.5">
                  <img src={najeTemplateGallery} alt="" className="w-4 h-4 object-contain" />
                  <span>اختر أسلوباً للتصميم ({imageTemplates.length} نمط):</span>
                </h3>
                {selectedImageTemplate && (
                  <button
                    type="button"
                    onClick={() => setSelectedImageTemplate(null)}
                    className="text-[11px] sm:text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer bg-rose-500/10 px-2 py-1 rounded-lg"
                  >
                    <X className="w-3 h-3" /> إلغاء المحدد
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5">
                {imageTemplates.map(tmpl => {
                  const isSelected = selectedImageTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedImageTemplate(isSelected ? null : tmpl.id);
                      }}
                      className={`group relative rounded-2xl overflow-hidden text-right transition-all duration-200 border cursor-pointer flex flex-col ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                          : 'border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 bg-white dark:bg-gray-900'
                      }`}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={tmpl.image}
                          alt={tmpl.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            img.parentElement?.classList.add('bg-gray-300', 'dark:bg-gray-700');
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        {isSelected && (
                          <div className="absolute top-2 left-2 bg-indigo-600 text-white rounded-full p-1 shadow-md">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 left-2 text-white font-bold text-xs sm:text-sm line-clamp-1 drop-shadow-md">
                          {tmpl.name}
                        </span>
                      </div>
                      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
                        <p className="text-[11px] sm:text-xs text-gray-700 dark:text-gray-400 leading-snug line-clamp-2">
                          {tmpl.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Text Features Quick Suggestions */}
          {chat.type === 'text' && messages.length === 0 && (
            <div className="mb-6 text-right w-full">
              <h3 className="text-gray-800 dark:text-gray-400 text-sm font-semibold mb-3 pr-1">الميزات والإمكانات المتاحة:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {textFeatures.map(feat => (
                  <button
                    key={feat.id}
                    onClick={() => {
                      setInput(feat.prompt);
                      executeSubmission(feat.prompt);
                    }}
                    className="p-3.5 sm:p-4 rounded-2xl text-right transition border bg-[#f2f0f5] dark:bg-gray-900/80 dark:hover:bg-gray-800 border-purple-200/60 dark:border-gray-800 hover:border-purple-300 hover:bg-purple-100/10 flex flex-col gap-1 cursor-pointer group w-full shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/50 flex items-center justify-center shrink-0">
                        <img src={feat.icon} alt="" className="w-4 h-4 object-contain" />
                      </div>
                      <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{feat.title}</span>
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-400 leading-relaxed mt-1">{feat.desc}</div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400/80 font-semibold mt-2 border-t border-gray-200/60 dark:border-gray-800/40 pt-1.5 flex items-center gap-1">
                      <span>تجربة سريعة:</span>
                      <span className="text-gray-800 dark:text-gray-400 font-normal truncate">"{feat.prompt}"</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
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
          />
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="py-2 flex flex-col gap-1 w-full max-w-xl">
              {/* DOCUMENT (after user permission) -> premium smart screen tied to the prompt */}
              {activeJobType === 'document' && activeJobId ? (
                <NajeSmartLoader jobId={activeJobId} jobType="document" userPrompt={messages[messages.length - 1]?.content} isCompleted={isJobCompleted} />

              /* IMAGE / VIDEO / VOICE -> Naje thinking, then premium tracking to 100% */
              ) : (activeJobType === 'image' || activeJobType === 'video' || activeJobType === 'voice') && activeJobId ? (
                <>
                  {messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (messages[messages.length - 1] as any)?.sourceMediaUrl && (
                    <NajeEditTransmission imageSrc={(messages[messages.length - 1] as any).sourceMediaUrl} getLocalDoc={getLocalDoc} />
                  )}
                  <NajeSmartLoader jobId={activeJobId} jobType={activeJobType as any} userPrompt={messages[messages.length - 1]?.content} isCompleted={isJobCompleted} />
                </>

              /* UI PLAN / normal reply -> Naje thinking (text streams behind it) */
              ) : (chat?.type as string) === 'ui' && uiMode === 'plan' ? (
                <NajePlanningIndicator hasStarted={!!latestUiHtml} />

              /* UI BUILD -> thinking, then reasoning-with-live-content */
              ) : (chat?.type as string) === 'ui' && uiMode === 'build' ? (
                !latestUiHtml ? (
                  <NajeThinkingGeneric />
                ) : (
                  <NajeReasoningIndicator chatType="ui" rawHtml={latestUiHtml} hasStartedContent={!!latestUiHtml} />
                )

              /* PLAIN TEXT reply -> Naje thinking + smooth streaming text (NEVER the tracking screen) */
              ) : (
                <NajeReasoningIndicator 
                  chatType={(chat?.type === 'ui' ? 'ui' : (chat?.type === 'image' || chat?.type === 'design') ? 'image' : chat?.type === 'video' ? 'video' : 'text')} 
                  hasStartedContent={messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !!messages[messages.length - 1]?.content}
                />
              )}
            </div>
          </div>
        )}

        {pendingDocConfirm && (
          <div className="flex justify-start">
            <div className="p-5 sm:p-6 naje-glass-card-lg w-full max-w-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-3 left-3">
                <NajeThinking size={22} className="animate-pulse" />
              </div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">
                    طلب إنشاء مستند إبداعي تلقائي
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    هل ترغب في تحويل هذه المحادثة إلى مستند <span className="font-bold text-indigo-600 dark:text-indigo-400">{pendingDocConfirm.docType.toUpperCase()}</span>؟ يتطلب هذا الإجراء خصم نقاط من رصيدك.
                  </p>
                  <div className="naje-glass-card p-3.5 mb-5">
                    <div className="flex justify-between items-center text-sm mb-1.5">
                      <span className="text-gray-500 dark:text-gray-400">نوع المستند:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {pendingDocConfirm.docType === 'pptx' ? 'عرض تقديمي (PowerPoint)' : pendingDocConfirm.docType === 'docx' ? 'مستند Word' : pendingDocConfirm.docType === 'pdf_slides' ? 'شرائح PDF' : 'مستند PDF'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">التكلفة المتوقعة:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {(pendingDocConfirm.docType === 'pptx' || pendingDocConfirm.docType === 'pdf_slides') 
                          ? parseFloat((pendingDocConfirm.estimatedCount * 0.20).toFixed(2)) 
                          : parseFloat((pendingDocConfirm.estimatedCount * (paperSize === 'a5' ? 0.10 : 0.15)).toFixed(2))
                        } نقاط ({pendingDocConfirm.estimatedCount} {(pendingDocConfirm.docType === 'pptx' || pendingDocConfirm.docType === 'pdf_slides') ? 'شريحة' : 'صفحة'} مقترحة)
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        const { docType, prompt, estimatedCount } = pendingDocConfirm;
                        setPendingDocConfirm(null);
                        setDocType(docType);
                        if (docType === 'pptx' || docType === 'pdf_slides') {
                          setSlidesCount(estimatedCount);
                          setTimeout(() => {
                            executeSubmission(prompt, docType, undefined, estimatedCount);
                          }, 100);
                        } else {
                          setPagesCount(estimatedCount);
                          setTimeout(() => {
                            executeSubmission(prompt, docType, estimatedCount, undefined);
                          }, 100);
                        }
                      }}
                      type="button"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/10 active:scale-95 transition cursor-pointer"
                    >
                      توليد المستند ({(pendingDocConfirm.docType === 'pptx' || pendingDocConfirm.docType === 'pdf_slides') 
                        ? parseFloat((pendingDocConfirm.estimatedCount * 0.20).toFixed(2)) 
                        : parseFloat((pendingDocConfirm.estimatedCount * (paperSize === 'a5' ? 0.10 : 0.15)).toFixed(2))
                      } نقاط)
                    </button>
                    <button
                      onClick={() => {
                        setPendingDocConfirm(null);
                      }}
                      type="button"
                      className="px-4 py-2.5 bg-gray-100 dark:hover:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold active:scale-95 transition cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Docked Bottom Input Box */}
      {chat.type !== 'ui' && (
        <div className="shrink-0 w-full bg-[#FAF9FC]/95 dark:bg-[#0d0f12]/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800/80 p-2 sm:p-3 md:p-4 z-30 pb-6 sm:pb-3 md:pb-4 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSend} className="w-full max-w-4xl mx-auto flex flex-col gap-2.5 relative transition-all duration-200">
            
            {/* Info Packet Card placed directly above the send button/input box */}
            {chat.type === 'video' && selectedVideoTemplate && (
              <div className="naje-glass-card p-3 sm:p-3.5 rounded-2xl border-indigo-500/40 bg-indigo-500/10 dark:bg-indigo-500/10 relative overflow-hidden flex items-center gap-3 shadow-md animate-in fade-in duration-200">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 border border-indigo-500/40 shadow">
                  <img
                    src={videoTemplates.find(t => t.id === selectedVideoTemplate)?.image}
                    alt="style preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] sm:text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold flex-shrink-0 shadow-sm">
                      تم تثبيت الأسلوب
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                      {videoTemplates.find(t => t.id === selectedVideoTemplate)?.name}
                    </h4>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 line-clamp-1">
                    {videoTemplates.find(t => t.id === selectedVideoTemplate)?.desc}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    اكتب موضوع المقطع فقط وسنطبق الأسلوب تلقائياً.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVideoTemplate(null)}
                  className="p-1.5 sm:p-2 rounded-xl text-gray-800 dark:text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition flex-shrink-0 cursor-pointer"
                  title="إلغاء الأسلوب"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}

            {chat.type === 'image' && selectedImageTemplate && (
              <div className="naje-glass-card p-3 sm:p-3.5 rounded-2xl border-indigo-500/40 bg-indigo-500/10 dark:bg-indigo-500/10 relative overflow-hidden flex items-center gap-3 shadow-md animate-in fade-in duration-200">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 border border-indigo-500/40 shadow">
                  <img
                    src={imageTemplates.find(t => t.id === selectedImageTemplate)?.image}
                    alt="style preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] sm:text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold flex-shrink-0 shadow-sm">
                      تم تثبيت الأسلوب
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                      {imageTemplates.find(t => t.id === selectedImageTemplate)?.name}
                    </h4>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 line-clamp-1">
                    {imageTemplates.find(t => t.id === selectedImageTemplate)?.desc}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    أرفق صورتك أو وصفك وسنطبق الأسلوب تلقائياً.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImageTemplate(null)}
                  className="p-1.5 sm:p-2 rounded-xl text-gray-800 dark:text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition flex-shrink-0 cursor-pointer"
                  title="إلغاء الأسلوب"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Custom Image Instructions Input Field (Only in Image generation) */}
            {chat.type === 'image' && (
              <input
                value={imageInstructions}
                onChange={e => setImageInstructions(e.target.value)}
                placeholder="تعليمات مخصصة (مثال: شعار بدون خلفية، التركيز على ألوان دافئة، نمط ثلاثي الأبعاد...)"
                className="w-full bg-white dark:bg-gray-900/45 border border-gray-200 dark:border-gray-800/60 rounded-2xl px-4 py-2 text-xs text-gray-900 dark:text-gray-300 focus:border-indigo-500/50 outline-none transition"
                disabled={loading}
              />
            )}

            {/* Unified Controller Card with integrated Drop-up Panels */}
            <div className="naje-glass-card-lg flex flex-col focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl">
              
              {/* A. Document Settings Inline Drop-up Panel */}
              <AnimatePresence>
                {chat.type === 'text' && showDocSettings && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-transparent border-b border-gray-200/40 dark:border-white/10 p-4 flex flex-col gap-4 text-sm"
                  >
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-900/60 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                        <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>توليد وتأسيس مستند متكامل</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowDocSettings(false)}
                        className="p-1 rounded-lg text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className={cn("grid grid-cols-1 gap-4", docType === 'none' ? "sm:grid-cols-1" : (docType === 'pptx' || docType === 'pdf_slides') ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
                      <div className="flex flex-col gap-2 col-span-full">
                        <span className="text-xs text-gray-800 dark:text-gray-400 font-bold">نوع الملف المطلوب:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {[
                            { id: 'none', label: 'بدون مستند', desc: 'دردشة فقط', icon: najeChatTyping },
                            { id: 'pptx', label: 'عرض PowerPoint', desc: 'موصى به للتعديل أو المشاركة', icon: najeChartBars, isPptx: true },
                            { id: 'pdf_slides', label: 'شرائح PDF', desc: 'مضمون 100% (تضمين الخطوط)', icon: najeFilmstrip },
                            { id: 'pdf_doc', label: 'مستند PDF', desc: 'للتقارير والعروض المكتوبة', icon: najeDocument },
                            { id: 'docx', label: 'Word', desc: 'قابل للتعديل', icon: najePencilWrite }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setDocType(opt.id)}
                              className={cn(
                                "p-2 rounded-xl border transition flex flex-col items-center justify-center text-center gap-1 cursor-pointer",
                                docType === opt.id
                                  ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20"
                                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/80"
                              )}
                            >
                              <img src={opt.icon} alt="" className="w-5 h-5 mb-1 object-contain" />
                              <span className="text-xs font-bold">{opt.label}</span>
                              <span className="text-[9px] opacity-70">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {docType !== 'none' && (docType === 'pptx' || docType === 'pdf_slides') && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-gray-800 dark:text-gray-400 ">عدد الشرائح المطلوبة</span>
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
                      )}

                      {(docType === 'pdf_doc' || docType === 'docx') && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-gray-800 dark:text-gray-400 ">مقاس الصفحة</span>
                            <NajeSelect
                               value={paperSize}
                               onChange={(val) => setPaperSize(val as 'a4' | 'a5')}
                               options={[
                                 { value: 'a4', label: `A4 (${pricing.document?.a4PerPage ?? 0.15} نقطة/صفحة)` },
                                 { value: 'a5', label: `A5 (${pricing.document?.a5PerPage ?? 0.10} نقطة/صفحة)` }
                               ]}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-gray-800 dark:text-gray-400 ">عدد الصفحات التقريبي</span>
                            <NajeSelect
                               value={pagesCount.toString()}
                               onChange={(val) => setPagesCount(parseInt(val))}
                               options={[3, 5, 7, 10, 15, 20].map(cnt => {
                                 const rate = paperSize === 'a5' ? (pricing.document?.a5PerPage ?? 0.10) : (pricing.document?.a4PerPage ?? 0.15);
                                 const total = parseFloat((cnt * rate).toFixed(2));
                                 return {
                                   value: cnt.toString(),
                                   label: `${cnt} ${cnt <= 10 ? 'صفحات' : 'صفحة'} (${total} نقطة)`
                                 };
                               })}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 bg-indigo-50 dark:bg-indigo-500/10 p-2 sm:p-2.5 rounded-xl border border-indigo-400 dark:border-indigo-500/20 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="leading-tight">التكلفة: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{getCalculatedCost()}</strong> نقطة (تُخصم عند الإرسال)</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setShowDocSettings(false)}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex-shrink-0"
                      >
                        تأكيد
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ImageSettingsPanel 
                chat={chat}
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
                getCalculatedCost={getCalculatedCost}
                files={files}
              />

              {/* C. Video Settings Inline Drop-up Panel */}
              <AnimatePresence>
                <VideoSettingsPanel 
                  chat={chat}
                  showVideoSettings={showVideoSettings}
                  setShowVideoSettings={setShowVideoSettings}
                  videoModel={videoModel}
                  setVideoModel={setVideoModel}
                  videoResolution={videoResolution}
                  setVideoResolution={setVideoResolution}
                  videoDuration={videoDuration}
                  setVideoDuration={setVideoDuration}
                  aspectRatio={aspectRatio}
                  setAspectRatio={setAspectRatio}
                  getCalculatedCost={getCalculatedCost}
                  files={files}
                />
              </AnimatePresence>

              {/* Voice Studio Settings Inline Drop-up Panel */}
              <AnimatePresence>
                <VoiceSettingsPanel 
                  chat={chat}
                  loading={loading}
                  showVoiceSettings={showVoiceSettings}
                  voiceMode={voiceMode} setVoiceMode={setVoiceMode}
                  voiceTier={voiceTier} setVoiceTier={setVoiceTier}
                  selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice}
                  speaker1Name={speaker1Name} setSpeaker1Name={setSpeaker1Name}
                  speaker1Voice={speaker1Voice} setSpeaker1Voice={setSpeaker1Voice}
                  speaker2Name={speaker2Name} setSpeaker2Name={setSpeaker2Name}
                  speaker2Voice={speaker2Voice} setSpeaker2Voice={setSpeaker2Voice}
                  deliveryStyle={deliveryStyle} setDeliveryStyle={setDeliveryStyle}
                  playingVoiceSample={playingVoiceSample} playVoicePreview={playVoicePreview}
                  input={input}
                />
              </AnimatePresence>

              {/* D. Custom Error notification inside Card */}
              <AnimatePresence>
                {fileError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex items-center justify-between text-xs text-red-600 dark:text-red-400 font-bold tracking-wide"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span>{fileError}</span>
                    </div>
                    <button type="button" onClick={() => setFileError(null)} className="hover:text-gray-900 dark:hover:text-white transition p-1 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* E. Image Previews for files currently being uploaded inside Card */}
              {files.length > 0 && (
                 <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-950/40 border-b border-gray-200 dark:border-gray-900/85">
                    {files.map((file, idx) => (
                       <div key={idx} className="relative group bg-white dark:bg-gray-900/80 rounded-xl p-2 pl-8 flex items-center gap-2 text-xs border border-gray-200 dark:border-gray-800">
                          {file.mimeType.startsWith('image/') ? (
                             <img src={`data:${file.mimeType};base64,${file.data}`} alt="preview" className="w-8 h-8 object-cover rounded-lg" />
                          ) : (
                             <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          )}
                          <span className="truncate max-w-[150px] text-gray-900 dark:text-gray-300 font-medium" dir="ltr">{file.name}</span>
                          <button type="button" onClick={() => removeFile(idx)} className="absolute left-1.5 top-1.5 text-gray-800 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-950 rounded-full p-0.5 opacity-100 group-hover:opacity-100 transition cursor-pointer">
                             <X className="w-3 h-3" />
                          </button>
                       </div>
                    ))}
                 </div>
              )}

              {/* Badges placed on their own row - horizontal single line on mobile with overflow visible */}
              <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-1.5 px-2 sm:px-3 pt-2 empty:hidden overflow-visible relative z-30 max-w-full">
                <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0 overflow-visible">
                  {/* Text Model Tier Selector */}
                  {chat.type === 'text' && (
                    <NajeModelTierSelector
                      value={textModelTier}
                      onChange={setTextModelTier}
                      disabled={loading}
                      className="shrink-0"
                    />
                  )}

                  {/* UI Model Tier Selector */}
                  {(chat as any)?.type === 'ui' && (
                    <NajeModelTierSelector
                      value={uiModelTier}
                      onChange={setUiModelTier}
                      disabled={loading}
                      className="shrink-0"
                    />
                  )}

                  {/* Document Badge */}
                  {chat.type === 'text' && docType !== 'none' && (
                     <div 
                        className="inline-flex items-center gap-1 sm:gap-1.5 bg-indigo-500/15 border border-indigo-500/25 hover:bg-indigo-500/25 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                        onClick={() => { setShowDocSettings(!showDocSettings); setShowImageSettings(false); setShowVideoSettings(false); }}
                     >
                        <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>مستند: {docType === 'pdf_slides' ? 'شرائح PDF' : docType === 'pdf_doc' ? 'مستند PDF' : docType === 'docx' ? 'Word' : 'PowerPoint'} ({(docType === 'pptx' || docType === 'pdf_slides') ? `${slidesCount} شرائح` : `${pagesCount} صفحات (${paperSize.toUpperCase()})`})</span>
                        <ChevronDown className="w-3 h-3 opacity-70 mr-0.5 shrink-0" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); setDocType('none'); }} className="hover:text-gray-900 dark:hover:text-white hover:bg-indigo-900/50 rounded-full p-0.5 transition-colors mr-0.5 shrink-0">
                           <X className="w-3 h-3" />
                        </button>
                     </div>
                  )}

                  {/* Image Model Selector & Settings */}
                  {chat.type === 'image' && (
                    <>
                      <NajeImageModelSelector
                        value={imageModel}
                        onChange={(val) => {
                          setImageModel(val);
                          if (val === 'lite') setImageQuality('standard');
                        }}
                        disabled={loading}
                        className="shrink-0"
                      />
                      <button 
                        type="button"
                        onClick={() => { setShowImageSettings(!showImageSettings); setShowDocSettings(false); setShowVideoSettings(false); }}
                        className={cn(
                          "inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0",
                          showImageSettings 
                            ? "bg-indigo-600 text-white shadow-indigo-500/20" 
                            : "bg-gray-100/90 dark:bg-gray-800/90 hover:bg-gray-200/90 dark:hover:bg-gray-700/90 border border-gray-300/70 dark:border-gray-700/80 text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <ImageIcon className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                        <span>{imagePreset !== 'custom' ? (imagePreset === 'fb_cover' ? 'غلاف FB' : imagePreset === 'fb_post' ? 'منشور FB' : imagePreset === 'ig_square' ? '1:1 IG' : imagePreset === 'ig_portrait' ? '4:5 IG' : imagePreset === 'ig_story' ? '9:16 IG' : 'يوتيوب') : aspectRatio} • {imageQuality.toUpperCase()}</span>
                        <ChevronDown className={cn("w-3 h-3 opacity-70 mr-0.5 shrink-0 transition-transform", showImageSettings && "rotate-180")} />
                      </button>
                    </>
                  )}

                  {/* Video Model Selector & Settings */}
                  {chat.type === 'video' && (
                    <>
                      <NajeVideoModelSelector
                        value={videoModel}
                        onChange={(val) => {
                          setVideoModel(val);
                          setVideoDuration(val === 'veo' ? '4' : '5');
                        }}
                        disabled={loading}
                        className="shrink-0"
                      />
                      <button 
                        type="button"
                        onClick={() => { setShowVideoSettings(!showVideoSettings); setShowDocSettings(false); setShowImageSettings(false); setShowVoiceSettings(false); }}
                        className={cn(
                          "inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0",
                          showVideoSettings 
                            ? "bg-pink-600 text-white shadow-pink-500/20" 
                            : "bg-gray-100/90 dark:bg-gray-800/90 hover:bg-gray-200/90 dark:hover:bg-gray-700/90 border border-gray-300/70 dark:border-gray-700/80 text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <Film className="w-3.5 h-3.5 shrink-0 text-pink-500" />
                        <span>{(aspectRatio === '9:16' ? '9:16' : '16:9')} • {videoResolution} • {videoDuration} ث</span>
                        <ChevronDown className={cn("w-3 h-3 opacity-70 mr-0.5 shrink-0 transition-transform", showVideoSettings && "rotate-180")} />
                      </button>
                    </>
                  )}

                  {/* Voice Studio Model Badge */}
                  {chat.type === 'voice' && (
                     <div 
                        className="inline-flex items-center gap-1 sm:gap-1.5 bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm cursor-pointer transition-colors whitespace-nowrap shrink-0"
                        onClick={() => { setShowVoiceSettings(!showVoiceSettings); setShowDocSettings(false); setShowImageSettings(false); setShowVideoSettings(false); }}
                     >
                        <Mic2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Naje Voice {voiceTier === 'pro' ? 'Pro' : 'Core'} ({voiceMode === 'single' ? VOICES.find(v => v.id === selectedVoice)?.name : `${speaker1Name || 'المتحدث 1'} & ${speaker2Name || 'المتحدث 2'}`})</span>
                        <ChevronDown className="w-3 h-3 opacity-70 mr-0.5 shrink-0" />
                     </div>
                  )}
                </div>

                {/* Cost Indicator Badge placed above the send button */}
                {getCalculatedCost() > 0 && (
                  <div className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/15 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-bold tracking-tight shadow-sm ms-auto whitespace-nowrap shrink-0">
                    <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span>تكلفة الطلب: {getCalculatedCost()} نقاط</span>
                  </div>
                )}
              </div>

              {/* Infographic Smart Suggestion Chip for Comparisons & Stats */}
              {chat.type === 'text' && !dismissedInfographicChip && input.trim().length > 3 && (
                /(?:مقارنة|إحصائيات|احصائيات|نسبة|أرقام|بيانات|مخطط|إنفوجرافيك|انفوجرافيك|جدول|ترتيب|معدل|توزيع|vs|versus|growth|stats|infographic)/i.test(input)
              ) && (
                <div className="mx-2 sm:mx-3 mb-1.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={najePersonaDesignerData} alt="" className="w-5 h-5 object-contain shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                      تريد تحويل هذه البيانات إلى <strong>إنفوجرافيك مرئي احترافي</strong> عبر المصمم؟
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (!input.startsWith('صمم إنفوجرافيك')) {
                          setInput(`صمم إنفوجرافيك احترافي يوضح: ${input}`);
                        }
                        setDismissedInfographicChip(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1"
                    >
                      <img src={najeSpark} alt="" className="w-3 h-3 object-contain" />
                      <span>تصميم إنفوجرافيك ذكي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInfographicModal(true);
                        setDismissedInfographicChip(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-[11px] transition cursor-pointer whitespace-nowrap border border-gray-300 dark:border-gray-700 flex items-center gap-1"
                    >
                      <img src={najeRulerSpec} alt="" className="w-3 h-3 object-contain" />
                      <span>تصفح الهياكل والقوالب</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDismissedInfographicChip(true)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      title="إغلاق الاقتراح"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* F. Primary Message Input Bar with Integrated Controls */}
              <div className="relative flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-transparent">
                
                {/* Left Controls inside Input Box - Grouped closely */}
                <div className="flex items-center gap-0.5 sm:gap-1 pr-0.5 sm:pr-1 flex-shrink-0">
                  
                  {/* Brand Kit Studio Button */}
                  {(chat.type === 'design' || chat.type === 'image') && (
                    <button 
                      type="button" 
                      onClick={() => setIsBrandKitModalOpen(true)} 
                      className="p-1.5 sm:p-2 rounded-xl transition flex items-center justify-center cursor-pointer bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                      title="نموذج تصميم الهوية والشعار (Brand Kit Studio)"
                    >
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}

                  {/* Document Icon in Text Chat */}
                  {chat.type === 'text' && (
                    <>
                      <button 
                        type="button" 
                        onClick={() => { setShowDocSettings(!showDocSettings); setShowImageSettings(false); setShowVideoSettings(false); }} 
                        className={cn(
                          "p-1.5 sm:p-2 rounded-xl transition flex items-center justify-center cursor-pointer",
                          showDocSettings || docType !== 'none'
                            ? 'bg-indigo-600/10 border border-indigo-400 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                            : 'text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:bg-gray-800/60'
                        )}
                        title="توليد مستند (PDF / Word / PPTX)"
                      >
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setShowInfographicModal(true)} 
                        className="p-1.5 sm:p-2 rounded-xl transition flex items-center justify-center cursor-pointer text-gray-800 dark:text-gray-400 hover:text-amber-500 hover:bg-amber-500/10"
                        title="استوديو الإنفوجرافيك — «المصمم» (عرض مرئي للبيانات والمقارنات)"
                      >
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                      </button>
                    </>
                  )}

                  {/* Sliders Icon in Image Chat */}
                  {chat.type === 'image' && (
                    <button 
                      type="button" 
                      onClick={() => { setShowImageSettings(!showImageSettings); setShowDocSettings(false); setShowVideoSettings(false); }} 
                      className={cn(
                        "p-1.5 sm:p-2 rounded-xl transition flex items-center justify-center cursor-pointer",
                        showImageSettings
                          ? 'bg-indigo-600/10 border border-indigo-400 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:bg-gray-800/60'
                      )}
                      title="إعدادات الصورة"
                    >
                      <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}

                  {/* Sliders Icon in Video Chat */}
                  {chat.type === 'video' && (
                    <button 
                      type="button" 
                      onClick={() => { setShowVideoSettings(!showVideoSettings); setShowDocSettings(false); setShowImageSettings(false); setShowVoiceSettings(false); }} 
                      className={cn(
                        "p-1.5 sm:p-2 rounded-xl transition flex items-center justify-center cursor-pointer",
                        showVideoSettings
                          ? 'bg-indigo-600/10 border border-indigo-400 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:bg-gray-800/60'
                      )}
                      title="إعدادات الفيديو"
                    >
                      <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}

                  {/* Sliders Icon in Voice Chat */}
                  {chat.type === 'voice' && (
                    <button 
                      type="button" 
                      onClick={() => { setShowVoiceSettings(!showVoiceSettings); setShowDocSettings(false); setShowImageSettings(false); setShowVideoSettings(false); }} 
                      className={cn(
                        "p-1.5 sm:p-2 rounded-xl transition flex items-center justify-center cursor-pointer",
                        showVoiceSettings
                          ? 'bg-emerald-600/10 border border-emerald-400 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                          : 'text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:bg-gray-800/60'
                      )}
                      title="إعدادات استوديو الصوت"
                    >
                      <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}

                  {/* Paperclip button */}
                  {chat.type !== 'voice' && (
                    <label className="cursor-pointer p-1.5 sm:p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60 transition flex items-center justify-center">
                       <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                       <input 
                         type="file" 
                         multiple 
                         className="hidden" 
                         onChange={handleFileChange} 
                         accept={chat.type === 'text' ? "image/*,.pdf,.doc,.docx,.txt" : "image/*"} 
                       />
                    </label>
                  )}

                  {/* Microphone button for Voice-to-Text / Voice Input */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={cn(
                      "p-1.5 sm:p-2 rounded-xl transition flex items-center justify-center cursor-pointer",
                      isListening 
                        ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/20" 
                        : "text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-gray-800/60"
                    )}
                    title={isListening ? "جاري الاستماع... اضغط للإيقاف" : "إملاء صوتي (الدردشة الصوتية)"}
                  >
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Google Search Grounding Toggle Button */}
                  {chat.type !== 'voice' && (
                    <button
                      type="button"
                      onClick={() => setEnableSearchGrounding(prev => !prev)}
                      className={cn(
                        "p-1.5 sm:p-2 rounded-xl transition flex items-center justify-center cursor-pointer gap-1.5 text-xs font-bold",
                        enableSearchGrounding 
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30" 
                          : "text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-gray-800/60"
                      )}
                      title={enableSearchGrounding ? "البحث المباشر مفعل (Google Search Grounding)" : "تفعيل البحث المباشر في جوجل (Google Search)"}
                    >
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span className="hidden sm:inline text-[11px]">{enableSearchGrounding ? 'بحث مباشر' : 'بحث'}</span>
                    </button>
                  )}
                </div>
                
                {/* Central Text Area with dynamic height */}
                <div className="flex-1 flex items-center min-w-0">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleSend(e);
                      } else if (e.key === 'Enter') {
                        e.stopPropagation();
                      }
                    }}
                    placeholder={
                      docType !== 'none'
                        ? ""
                        : chat.type === 'voice'
                          ? (voiceMode === 'single'
                              ? "اكتب النص الذي تريد تحويله إلى تسجيل صوتي احترافي..."
                              : `اكتب سكريبت الحوار بالسطور متناوبة، مثال:\n${speaker1Name || 'أحمد'}: أهلاً بك في استوديو الصوت...\n${speaker2Name || 'سارة'}: مرحباً، يسعدني التواجد اليوم...`)
                          : chat.type === 'text' 
                            ? "اكتب رسالتك هنا..." 
                            : `صف خيالك لـ Naje AI لتوليد ${chat.type === 'image' ? 'الصورة' : 'الفيديو'}...`
                    }
                    className="w-full bg-transparent border-none py-1.5 sm:py-2.5 text-gray-900 dark:text-white outline-none resize-none min-h-[36px] sm:min-h-[44px] max-h-[80px] sm:max-h-[120px] overflow-y-auto leading-normal px-1 sm:px-2 text-xs sm:text-sm focus:ring-0 transition-[height] duration-150 ease-out scrollbar-none my-auto"
                    rows={1}
                  />
                </div>
                
                {/* Right Controls Area with Send button */}
                <div className="pl-1 flex items-center flex-shrink-0">
                  {loading ? (
                    <button 
                      type="button" 
                      onClick={() => {
                        setLoading(false);
                        setIsJobCompleted(true);
                      }}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-gray-900 border border-purple-200/40 dark:border-gray-800 text-black dark:text-white rounded-xl transition shadow-md cursor-pointer relative active:scale-95"
                      title="إيقاف التوليد"
                    >
                      {/* Spinning Arc */}
                      <div className="absolute inset-1.5 rounded-full border-2 border-transparent border-t-black dark:border-t-white animate-spin" />
                      {/* Stop Square */}
                      <div className="w-2.5 h-2.5 bg-black dark:bg-white rounded-[2px]" />
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      disabled={!input.trim() && files.length === 0} 
                      className={cn(
                        "w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition shadow-md border cursor-pointer active:scale-95",
                        (!input.trim() && files.length === 0)
                          ? "bg-black dark:bg-black text-gray-700 dark:text-gray-800 border-transparent cursor-not-allowed"
                          : "bg-white dark:bg-white text-black dark:text-black border-purple-200/50 dark:border-gray-800 shadow-md"
                      )}
                    >
                      <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      <BrandKitFormModal
        isOpen={isBrandKitModalOpen}
        onClose={() => setIsBrandKitModalOpen(false)}
        onSubmit={(compiledPrompt) => {
          setInput(compiledPrompt);
          executeSubmission(compiledPrompt, docType);
        }}
      />

      {/* Infographic Starter Templates Modal */}
      {showInfographicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <img src={najePersonaDesignerData} alt="المصمم" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">استوديو الإنفوجرافيك — «المصمم»</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">اختر قالباً أو هيكلاً بصرياً للبدء فوراً — يلتزم ناجي بالتناغم اللوني والدمج الإبداعي تلقائياً</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowInfographicModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    id: 'infographic_mixed_hybrid',
                    name: 'دمج ذكي شامل (Mixed Hybrid)',
                    desc: 'ترك ناجي يدمج بين مؤشرات الأرقام، المقارنات، والتوزيع النسبي في بوستر واحد متكامل.',
                    preview: INFOGRAPHIC_THUMBNAILS.infographic_mixed_hybrid,
                    samplePrompt: 'صمم إنفوجرافيك دمج ذكي شامل يجمع بين أبرز الأرقام والمقارنات والتوزيع النسبي في لوحة واحدة متكاملة.'
                  },
                  {
                    id: 'infographic_stats_grid',
                    name: 'شبكة مؤشرات وإحصائيات',
                    desc: 'إبراز 3 إلى 6 أرقام ونسب مع مؤشرات التغير والتقييم بوضوح.',
                    preview: INFOGRAPHIC_THUMBNAILS.infographic_stats_grid,
                    samplePrompt: 'صمم إنفوجرافيك شبكة إحصائيات يعرض نمو المبيعات بنسبة 94% وعدد المستخدمين 3.8M وزمن الاستجابة 15ms'
                  },
                  {
                    id: 'infographic_comparison',
                    name: 'مقارنة شاملة وجدولية',
                    desc: 'مقارنة دقيقة بين خيارات متعددة مع أشرطة التقدم وبطاقات الإيجابيات.',
                    preview: INFOGRAPHIC_THUMBNAILS.infographic_comparison,
                    samplePrompt: 'صمم إنفوجرافيك مقارنة شاملة بين الخطة الأساسية والخطة الاحترافية مع مقارنة الميزات والأسعار'
                  },
                  {
                    id: 'infographic_timeline',
                    name: 'خط زمني وخارطة طريق',
                    desc: 'تسلسل مراحل ومحطات زمنية مع مسار رسومي متصل ونقاط ملونة.',
                    preview: INFOGRAPHIC_THUMBNAILS.infographic_timeline,
                    samplePrompt: 'صمم إنفوجرافيك خط زمني لمراحل إطلاق المشروع من التأسيس والتجهيز حتى الإطلاق والتوسع'
                  },
                  {
                    id: 'infographic_process_steps',
                    name: 'خطوات إجرائية متسلسلة',
                    desc: 'توضيح سير العمل أو الخطوات الإجرائية بترتيب منطقي وأيقونات مميزة.',
                    preview: INFOGRAPHIC_THUMBNAILS.infographic_process_steps,
                    samplePrompt: 'صمم إنفوجرافيك خطوات العمل المتسلسلة لعملية الشراء والتوصيل وخدمة ما بعد البيع'
                  },
                  {
                    id: 'infographic_market_share',
                    name: 'توزيع الحصص والنسب',
                    desc: 'مخطط دائري وحصص سوقية واضحة مع دليل تصنيفات ملون.',
                    preview: INFOGRAPHIC_THUMBNAILS.infographic_market_share,
                    samplePrompt: 'صمم إنفوجرافيك توزيع الحصص السوقية لقطاع التجارة الإلكترونية لعام 2025 مع دليل النسب'
                  },
                  {
                    id: 'infographic_before_after',
                    name: 'مقارنة قبل وبعد التحول',
                    desc: 'مقارنة مباشرة جنباً إلى جنب توضح فرق الكفاءة والأثر والنتائج.',
                    preview: INFOGRAPHIC_THUMBNAILS.infographic_before_after,
                    samplePrompt: 'صمم إنفوجرافيك مقارنة قبل وبعد لتوضيح توفير الوقت من 48 ساعة إلى 3 دقائق ومضاعفة الإنتاجية'
                  }
                ].map(tpl => (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      setInput(tpl.samplePrompt);
                      setShowInfographicModal(false);
                      textareaRef.current?.focus();
                    }}
                    className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40 p-3 flex flex-col justify-between hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 border border-gray-200/60 dark:border-gray-800 bg-gray-900 flex items-center justify-center">
                      <img src={tpl.preview} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1 group-hover:text-amber-500 transition-colors">{tpl.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{tpl.desc}</p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-200/50 dark:border-gray-800/60 flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <span>استخدام القالب فوراً</span>
                      <span>←</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
