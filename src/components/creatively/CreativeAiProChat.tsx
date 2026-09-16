import React, { useState, useRef, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { auth } from '../../firebase';
import { InteractiveLoadingPlaceholder } from "./InteractiveLoadingPlaceholder";
import NajeSpinner from '../NajeSpinner';
import { 
  Send, 
  Image as ImageIcon, 
  Video, 
  Sparkles, 
  Bot, 
  User, 
  Check, 
  X, 
  Paperclip, 
  Camera, 
  FileText, 
  Brain, 
  Globe, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit2, 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  HelpCircle, 
  Settings, 
  History, 
  PanelLeftClose, 
  PanelLeft, 
  Info,
  ChevronDown, CheckCircle2,
  Download,
  Upload,
  Play,
  RefreshCw,
  Zap
, KeyRound,
  ArrowUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { formatProfessionalError } from '../../utils/errorFormatter';
import NajeErrorCard from '../NajeErrorCard';
import { useAppStore } from '../../store';
import { waitForGenerationJob } from '../../lib/waitForGenerationJob';
import { fetchWithRetry } from '../../lib/fetchWithRetry';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  thought?: string;
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
  generatedImageUrl?: string;
  generatedVideoUrl?: string;
  videoStatus?: 'processing' | 'ready' | 'failed';
  conceptOptions?: any[];
  attachedImagePreview?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  proMode: 'standard' | 'thinking' | 'search' | 'image' | 'video' | 'study';
  createdAt: string;
}

interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  createdAt: string;
}

const AVAILABLE_MODES = [
  {
    id: 'standard',
    nameAr: 'المساعد الافتراضي',
    nameEn: 'Virtual Assistant',
    descAr: 'سريع وذكي جداً، يجيب على أي تفصيلة داخل وخارج الموقع.',
    descEn: 'Fast & smart virtual assistant for quick, comprehensive answers.',
    icon: Bot,
    colorClass: 'text-amber-400',
    activeBorder: 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10',
    badge: null,
  },
  {
    id: 'thinking',
    nameAr: 'نمط التفكير العميق',
    nameEn: 'Deep Thinking',
    descAr: 'تفكير فائق لحل أعقد المسائل الرياضية والبرمجية منطقياً.',
    descEn: 'Supercharged model reasoning for mathematics, code, and complex analytics.',
    icon: Brain,
    colorClass: 'text-purple-400',
    activeBorder: 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10',
    badge: 'o1-like',
  },
  {
    id: 'search',
    nameAr: 'البحث المباشر بالويب',
    nameEn: 'Web Search',
    descAr: 'يتصفح الإنترنت مباشرة لتزويدك بوقائع حية وأحدث المستجدات.',
    descEn: 'Integrates live internet browsing to answer queries with real-time facts.',
    icon: Globe,
    colorClass: 'text-emerald-400',
    activeBorder: 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10',
    badge: 'Live',
  },
  {
    id: 'image',
    nameAr: 'مصمم الصور الفنية',
    nameEn: 'Image Designer',
    descAr: 'يصيغ وينشئ صوراً فنية فائقة الخيال بتفاصيل سينمائية.',
    descEn: 'Expands simple text into cinematic, high-detail prompts and generates premium images.',
    icon: ImageIcon,
    colorClass: 'text-pink-400',
    activeBorder: 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/10',
    badge: '4K',
  },
  {
    id: 'video',
    nameAr: 'صانع ومخرج الفيديو AI',
    nameEn: 'AI Video Creator',
    descAr: 'يحول أفكارك لنصوص سينمائية غنية ويبدأ في معالجة وتوليد المشهد كفيديو بجودة هوليوود.',
    descEn: 'Converts simple requests into detailed cinematic scenes and produces up to 10-second HD clips.',
    icon: Video,
    colorClass: 'text-rose-400',
    activeBorder: 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/10',
    badge: 'HD 10s',
  },
  {
    id: 'study',
    nameAr: 'ذاكر وتعلم وتلخيص',
    nameEn: 'Study & Learn',
    descAr: 'يبسط المفاهيم الصعبة، يساعد على الحفظ، ويلخص المقالات.',
    descEn: 'Simplifies complex definitions, structures study plans, and breaks down knowledge easily.',
    icon: BookOpen,
    colorClass: 'text-sky-400',
    activeBorder: 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10',
    badge: 'Study',
  }
];

interface CreativeAiProChatProps {
  setActivationCode?: (code: string) => void;
  codeStatus?: any;
  hasBalance?: boolean;
  activationCode?: string;
  lang?: 'ar' | 'en';
  onUsePoint?: () => void;
  onClose?: () => void;
  autoNewChatTrigger?: number;
}

export function CreativeAiProChat({ activationCode = 'naje_authenticated', setActivationCode = () => {}, codeStatus, hasBalance = true, lang = 'ar', onUsePoint, onClose, autoNewChatTrigger }: CreativeAiProChatProps) {
  // Chat sessions state
  const getInitialNewSession = () => {
    const newId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    return {
      id: newId,
      title: lang === 'ar' ? 'محادثة ذكية جديدة' : 'New Intelligent Chat',
      messages: [
        {
          id: 'init',
          role: 'model' as const as 'user' | 'model',
          text: lang === 'ar' 
            ? 'مرحباً بك في **Creative AI Pro** \n\nأنا مستشارك الفني ومساعدك الذكي المتقدم. هنا، نحول الأفكار إلى واقع بصري متكامل بأعلى جودة. إليك نظرة سريعة على ما يمكننا إنجازه معاً:\n\n*   ** إنتاج الفيديو السينمائي:** تصميم فيديوهات احترافية بأبعاد متعددة (16:9، 9:16) بواسطة محرك creative video المتقدم، وبطول يصل إلى 10 ثوانٍ.\n**تكلفة الفيديوهات:**\n(4 ثوانٍ = 2 نقطة، 5 ثوانٍ = 2.5 نقطة، 6 ثوانٍ = 3 نقاط، 8 ثوانٍ = 4 نقاط، 10 ثوانٍ = 5 نقاط).\n*   ** التصميم والصور الذكية:** توليد صور دقيقة وواقعية باستخدام أحدث محركات الذكاء الاصطناعي، بأبعاد تناسب جميع المنصات الاجتماعية والمطبوعات.\n*   ** بناء الهويات البصرية:** تصميم شعارات متكاملة، وبناء حزمة هوية العلامة التجارية (Brand Kit) من الصفر.\n*   ** محرك Creative Imagen Pro:** مخصص للتصاميم المعقدة التي تحتوي على نصوص دقيقة (تايبوجرافي) وتفاصيل إعلانية دقيقة.\n\nأنا هنا لأجيب على أي استفسار حول تكلفة التصاميم، أفضل المحركات لاحتياجك، أو البدء فوراً في إبداع مشروعك. ماذا يدور في ذهنك اليوم؟' 
            : 'Welcome to **Creative AI Pro** \n\nI am your advanced AI assistant and creative consultant. Here, we turn ideas into stunning visual realities. Here is a quick look at what we can achieve together:\n\n*   ** Cinematic Video Production:** Professional videos in dimensions (16:9, 9:16) using the advanced creative video engine, up to 10 seconds per clip.\n**Video Costs:**\n(4s = 2 pts, 5s = 2.5 pts, 6s = 3 pts, 8s = 4 pts, 10s = 5 pts).\n*   ** Smart Design & Imagery:** Highly detailed and realistic image generation using the latest AI engines, perfectly sized for any platform.\n*   ** Brand Identity Creation:** Full logo design and comprehensive Brand Kit generation from scratch.\n*   ** Creative Imagen Pro Engine:** Specialized for complex designs featuring precise typography and advertising details.\n\nI am here to answer any questions about design costs, the best engines for your needs, or to start creating right away. What is on your mind today?'
        }
      ],
      proMode: 'standard' as const,
      createdAt: new Date().toISOString()
    };
  };

  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  const [input, setInput] = useState('');
  const [useCreativePro, setUseCreativePro] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFilePreviews, setSelectedFilePreviews] = useState<string[]>([]);
  const [lastUploadedBase64Images, setLastUploadedBase64Images] = useState<string[]>([]);
  
  // UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [isModeMatrixOpen, setIsModeMatrixOpen] = useState(false);
  const [isSidebarModesOpen, setIsSidebarModesOpen] = useState(false);
  const [userName, setUserName] = useState<string>(localStorage.getItem('creative_pro_user_name') || '');
  const [userNameError, setUserNameError] = useState<string | null>(null);
  const [userNameSuccess, setUserNameSuccess] = useState<boolean>(false);

  // Gallery and notifications state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [modeNotification, setModeNotification] = useState<string | null>(null);
  const [selectedImageModal, setSelectedImageModal] = useState<{url: string, prompt?: string, msgId?: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageOnlyInputRef = useRef<HTMLInputElement>(null);
  const cameraInputFallbackRef = useRef<HTMLInputElement>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active session helper
  const activeSession = sessions.find(s => s.id === currentSessionId) || sessions[0] || {
    id: 'session-default',
    title: 'New Chat',
    messages: [],
    proMode: 'standard'
  };

  const proMode = activeSession.proMode || 'standard';

  
  useEffect(() => {
    async function loadData() {
      try {
        const savedSessions = await get('creative_pro_sessions');
        let parsedSessions = [];
        if (savedSessions) {
          try {
            parsedSessions = JSON.parse(savedSessions);
          } catch (e) {}
        }
        if (!parsedSessions.length || parsedSessions[0].messages.length > 1) {
          parsedSessions = [getInitialNewSession(), ...parsedSessions];
        }
        setSessions(parsedSessions);

        const savedCurrentId = await get('creative_pro_current_id');
        if (savedCurrentId) {
          setCurrentSessionId(savedCurrentId);
        } else {
          setCurrentSessionId(parsedSessions[0].id);
        }

        const savedGallery = await get('creative_pro_gallery_v2');
        if (savedGallery) {
          try {
            setGallery(JSON.parse(savedGallery));
          } catch (e) {}
        }
      } catch (e) {
        console.error("IDB load error", e);
      } finally {
        setIsStorageLoaded(true);
      }
    }
    loadData();
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isStorageLoaded) set('creative_pro_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (isStorageLoaded) set('creative_pro_current_id', currentSessionId);
  }, [currentSessionId]);

  useEffect(() => {
    if (isStorageLoaded) set('creative_pro_gallery_v2', JSON.stringify(gallery));
  }, [gallery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession.messages, isLoading]);

  // Handle active proMode change
  const setProModeForActiveSession = (mode: 'standard' | 'thinking' | 'search' | 'image' | 'video' | 'study') => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, proMode: mode };
      }
      return s;
    }));

    // Show temporary beautiful notification
    const matchedMode = AVAILABLE_MODES.find(m => m.id === mode);
    if (matchedMode) {
      const msg = lang === 'ar' 
        ? `تم تفعيل: ${matchedMode.nameAr} بنجاح` 
        : `Activated: ${matchedMode.nameEn} successfully`;
      setModeNotification(msg);
      setTimeout(() => setModeNotification(null), 3000);
    }

    // Automatically close popup/matrix
    setIsModeMatrixOpen(false);
    
    // Close mobile sidebar
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Add new session
  const handleNewSession = () => {
    const newId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newSess: ChatSession = {
      id: newId,
      title: lang === 'ar' ? `محادثة ذكية ${sessions.length + 1}` : `Intelligent Chat ${sessions.length + 1}`,
      messages: [
        {
          id: 'init',
          role: 'model' as const,
          text: lang === 'ar' 
            ? 'أهلاً بك في جلسة **Creative AI Pro** الجديدة\nكيف يمكنني مساعدتك في الإبداع اليوم؟ يمكنك تفعيل ميزات التفكير العميق أو البحث أو التوليد الفني من الأسفل.' 
            : 'Welcome to your new **Creative AI Pro** session\nHow can I help you create today? You can activate deep thinking, search, or artistic generation from below.'
        }
      ],
      proMode: 'standard' as const,
      createdAt: new Date().toISOString()
    };

    setSessions(prev => [newSess, ...prev]);
    setCurrentSessionId(newId);
    setShowAttachmentMenu(false);
  };

  const lastNewChatTriggerRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (isStorageLoaded && autoNewChatTrigger && autoNewChatTrigger !== lastNewChatTriggerRef.current) {
      lastNewChatTriggerRef.current = autoNewChatTrigger;
      handleNewSession();
    }
  }, [autoNewChatTrigger, isStorageLoaded]);

  // Delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      // Don't delete last session, just reset it
      setSessions([
        {
          id: 'session-default',
          title: lang === 'ar' ? 'محادثة ذكية جديدة' : 'New Intelligent Chat',
          messages: [
            {
              id: 'init',
              role: 'model' as const as 'user' | 'model',
              text: lang === 'ar' 
                ? 'أهلاً بك في **Creative AI Pro**\nأنا مساعدك الذكي المتقدم، مدعوم بأحدث وأقوى نماذج Gemini المتعددة. بفضل اشتراكك، سأقوم بضمان خلو طلباتك من أي أخطاء إملائية أو لغوية قبل تحويلها إلى تصميم أو فيديو بأعلى جودة ممكنة. كيف يمكنني إبهارك اليوم؟' 
                : 'Welcome to **Creative AI Pro**\nI am your advanced AI assistant, powered by the latest and most powerful multimodal Gemini models. Thanks to your Pro subscription, I will ensure your requests are perfectly translated and free of errors before generating the highest quality images or videos. How can I amaze you today?'
            }
          ],
          proMode: 'standard' as const,
          createdAt: new Date().toISOString()
        }
      ]);
      setCurrentSessionId('session-default');
      return;
    }

    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id) {
      setCurrentSessionId(filtered[0].id);
    }
  };

  // Start editing session title
  const startEditingSession = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitleInput(title);
  };

  // Save session title
  const saveSessionTitle = (id: string) => {
    if (editTitleInput.trim()) {
      setSessions(prev => prev.map(s => {
        if (s.id === id) {
          return { ...s, title: editTitleInput.trim() };
        }
        return s;
      }));
    }
    setEditingSessionId(null);
  };

  // Camera capture controls
  const startCamera = async () => {
    setShowAttachmentMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera API not accessible, falling back to file capture:", err);
      cameraInputFallbackRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setLastUploadedBase64Images(prev => [...prev, dataUrl]);
        setSelectedFilePreviews(prev => [...prev, dataUrl]);
        
        // Create file from dataUri
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `camera_capture_${Date.now()}.png`, { type: 'image/png' });
            setSelectedFiles(prev => [...prev, file]);
          });
      }
    }
    stopCamera();
  };

  const handleSend = async (customText?: string, customMode?: string) => {
    const textToSend = customText !== undefined ? customText : input;
    if ((!textToSend.trim() && selectedFiles.length === 0) || !activationCode || activationCode.length < 8) return;
    
    let textToDisplay = textToSend;
    if (selectedFiles.length > 0) {
      textToDisplay += `\n\n[مرفق: ${selectedFiles.length} ملفات]`;
    }
    setSelectedImageModal(null);

    const newMessageId = `msg-${Date.now()}`;
    const aiMessageId = `msg-${Date.now() + 1}`;
    const newUserMessage: Message = { id: newMessageId, role: 'user', text: textToDisplay };

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: [...s.messages, newUserMessage], updatedAt: new Date().toISOString() };
      }
      return s;
    }));
    setInput('');
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.style.height = 'auto';
    setIsLoading(true);

    try {
      // Naje convention: JSON body with base64 data-URLs (no multipart / multer).
      const mediaDataUrls: string[] = await Promise.all(
        selectedFiles.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(file);
            })
        )
      );

      const currentSession = sessions.find((s) => s.id === currentSessionId);
      const historyPayload =
        currentSession && currentSession.messages.length > 0
          ? currentSession.messages.slice(-6)
          : [];

      const _tok = await auth.currentUser?.getIdToken();
      const res = await fetchWithRetry('/api/creative-pro-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_tok}` },
        body: JSON.stringify({
          message: textToSend,
          activationCode,
          proMode: customMode || proMode,
          lang,
          history: historyPayload,
          media: mediaDataUrls,
        }),
      });

      let data: any = {};
      try {
        const text = await res.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = { error: text.slice(0, 100) };
          }
        }
      } catch (parseErr: any) {
        data = { error: parseErr?.message || 'Failed to read response' };
      }

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const aiMessage: Message = { 
               id: aiMessageId,
               role: "model",
               text: data.text || data.error || (lang === "ar" ? "حدث خطأ" : "An error occurred"),
               thought: data.thought || undefined,
               isGeneratingImage: data.functionCall?.name === "generate_image",
               isGeneratingVideo: data.functionCall?.name === "generate_video",
          };
          return { 
            ...s, 
            messages: [...s.messages, aiMessage],
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      }));

      if (data.functionCall) {
        if (data.functionCall.name === "generate_image") {
           handleGenerateMedia(
             data.functionCall.args.prompt, 
             "image", 
             aiMessageId, 
             data.functionCall.args.aspectRatio,
             undefined,
             undefined,
             data.functionCall.args.is_concept_selection ? data.functionCall.args.prompt : undefined
           );
        } else if (data.functionCall.name === "generate_video") {
           handleGenerateMedia(
             data.functionCall.args.prompt, 
             "video", 
             aiMessageId, 
             data.functionCall.args.aspectRatio || "16:9",
             undefined,
             undefined,
             undefined,
             data.functionCall.args.durationSeconds
           );
        }
      }
    } catch (err: any) {
      console.error(err);
      const formatted = await formatProfessionalError(err, { chatType: 'image' });
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: s.messages.map(m => m.id === aiMessageId ? { ...m, text: formatted } : m)
          };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
      setSelectedFiles([]);
      setSelectedFilePreviews([]);
      setLastUploadedBase64Images([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      newFiles.forEach(file => {
        setSelectedFiles(prev => [...prev, file]);
        
        if ((file?.type || '').startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file?.name || '')) {
          const url = URL.createObjectURL(file);
          setSelectedFilePreviews(prev => [...prev, url]);
          
          const reader = new FileReader();
          reader.onload = (ev) => {
            setLastUploadedBase64Images(prev => [...prev, ev.target?.result as string]);
          };
          reader.readAsDataURL(file);
        } else {
          setSelectedFilePreviews(prev => [...prev, '']);
          setLastUploadedBase64Images(prev => [...prev, '']);
        }
      });
      setShowAttachmentMenu(false);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setSelectedFilePreviews(prev => prev.filter((_, i) => i !== index));
    setLastUploadedBase64Images(prev => prev.filter((_, i) => i !== index));
  };

  const attachImageForEdit = async (url: string, originalPrompt: string, isRedesign: boolean = false) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'edited_image.png', { type: 'image/png' });
      setSelectedFiles(prev => [...prev, file]);
      setSelectedFilePreviews(prev => [...prev, url]);
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLastUploadedBase64Images(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
      
      if (isRedesign) {
        setInput(lang === 'ar' ? `[إعادة التصميم]: أعد تصميم هذه الصورة بناءً على الفكرة الأصلية:\n${originalPrompt}` : `[Redesign]: Redesign this image based on original idea:\n${originalPrompt}`);
      } else {
        setInput(lang === 'ar' ? `[تعديل الصورة]: أضف أو عدل على الصورة:\n` : `[Edit Image]: Edit or add to the image:\n`);
      }
      setSelectedImageModal(null);
    } catch (err) {
      console.error('Failed to attach image for edit', err);
    }
  };

  const handleGenerateMedia = async (prompt: string, type: 'image' | 'video', messageId: string, aspectRatio: string = '16:9', style?: string, negativePrompt?: string, selectedConceptPrompt?: string, durationSeconds?: number) => {
    try {
      const body: any = {
        activationCode,
        prompt: prompt,
        mode: type === 'video' ? 'video_ad' : 'social_media',
        resultType: type,
        dimension: aspectRatio === '1:1' ? '1:1' : aspectRatio,
        complexity: 'high',
        baseImage: lastUploadedBase64Images[0] || undefined,
        productImages: lastUploadedBase64Images.length > 1 ? lastUploadedBase64Images : undefined,
        useCreativePro,
        isCreativeAiProUI: true,
        selectedConceptPrompt: selectedConceptPrompt,
      };

      if (type === 'video') {
         body.videoDuration = durationSeconds ? `${durationSeconds}s` : "5s";
      }

      const token = await auth.currentUser?.getIdToken();
      body.chatId = currentSessionId;
      body.projectId = useAppStore.getState().activeProjectId || undefined;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetchWithRetry('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      let data: any = {};
      try {
        const text = await res.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = { error: text.slice(0, 100) };
          }
        }
      } catch (err: any) {
        data = { error: err.message };
      }

      if (data.jobId || data.status === 'queued') {
        const jobId = data.jobId;
        const jobResult = await waitForGenerationJob({
          jobId,
          isVideo: type === 'video',
          onProgress: (progress, stepLabel) => {
            setSessions(prev => prev.map(s => {
              if (s.id === currentSessionId) {
                return {
                  ...s,
                  messages: s.messages.map(m => m.id === messageId ? {
                    ...m,
                    text: stepLabel || (type === 'video' ? `جاري معالجة الفيديو (${progress}%)...` : `جاري التوليد (${progress}%)...`)
                  } : m)
                };
              }
              return s;
            }));
          }
        });

        data = {
          ...data,
          ...jobResult,
          imageUrl: jobResult.result || jobResult.imageUrl || jobResult.url || data.imageUrl,
          videoUrl: jobResult.result || jobResult.videoUrl || jobResult.url || data.videoUrl,
          enhancedPrompt: jobResult.enhancedPrompt || data.enhancedPrompt
        };
      }
      
      if (data.type === "concepts") {
        setSessions(prev => prev.map(s => s.id === currentSessionId ? {
          ...s,
          messages: s.messages.map(m => m.id === messageId ? { ...m, isGeneratingImage: false, conceptOptions: data.concepts } : m)
        } : s));
        return;
      }

      if (data.needsClarification && data.message) {
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => m.id === messageId ? { ...m, isGeneratingImage: false, isGeneratingVideo: false, text: data.message } : m)
            };
          }
          return s;
        }));
        return;
      }

      if (!res.ok || data.error) {
        const errorContent = await formatProfessionalError(new Error(data.error || 'Failed to generate media'), { chatType: 'image' });
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => m.id === messageId ? { ...m, isGeneratingImage: false, isGeneratingVideo: false, text: errorContent } : m)
            };
          }
          return s;
        }));
        return;
      }

      if (type === 'image') {
        if (onUsePoint) onUsePoint();
        const imageUrl = data.imageUrl || data.url || (data.designs && data.designs[0]);
        if (imageUrl) {
          const newItem: GalleryItem = {
            id: `gallery-${Date.now()}`,
            type: 'image',
            url: imageUrl,
            prompt: prompt,
            createdAt: new Date().toISOString()
          };
          setGallery(prev => [newItem, ...prev]);
        }
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => m.id === messageId ? { 
                ...m, 
                isGeneratingImage: false, 
                generatedImageUrl: imageUrl
              } : m)
            };
          }
          return s;
        }));
      } else {
        if (onUsePoint) onUsePoint();
        if (data.operationName) {
           setSessions(prev => prev.map(s => {
             if (s.id === currentSessionId) {
               return {
                 ...s,
                 messages: s.messages.map(m => m.id === messageId ? {
                   ...m,
                   isGeneratingVideo: true,
                   videoStatus: 'processing',
                   text: lang === 'ar' ? 'الفيديو قيد المعالجة (قد يستغرق بضع دقائق)...' : 'Video is processing (might take a few minutes)...'
                 } : m)
               };
             }
             return s;
           }));
           
           const POLL_START_MS = 5000;
           const POLL_MAX_MS = 30000;
           const POLL_BACKOFF_FACTOR = 1.5;
           const MAX_TOTAL_WAIT_MS = 10 * 60 * 1000; // 10 minutes
           const startedAt = Date.now();

           const pollVideo = async (currentDelay: number) => {
             if (Date.now() - startedAt > MAX_TOTAL_WAIT_MS) {
               setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                 ...s,
                 messages: s.messages.map(m => m.id === messageId ? {
                   ...m,
                   isGeneratingVideo: false,
                   videoStatus: 'failed',
                   text: lang === 'ar' ? 'استغرق توليد الفيديو وقتاً أطول من المتوقع. يرجى المحاولة مجدداً.' : 'Video generation timed out. Please try again.'
                 } : m)
               } : s));
               return;
             }

             try {
               const token = await auth.currentUser?.getIdToken();
               const statusRes = await fetch('/api/creatively/video-status', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify({ operationName: data.operationName, activationCode })
               });
               let statusData;
               try {
                 statusData = await statusRes.json();
               } catch (e) {
                 setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === messageId ? { ...m, videoStatus: 'failed', text: 'تعذر الحصول على حالة الفيديو' } : m) } : s));
                 return;
               }
               if (statusData.done || statusData.state === 'SUCCEEDED' || statusData.state === 'COMPLETED') {
                  let finalVideoUrl = '';
                  try {
                    const dlRes = await fetch(`/api/creatively/video-download?operationName=${encodeURIComponent(data.operationName)}`, {
                      headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      }
                    });
                    if (dlRes.ok) {
                      const blob = await dlRes.blob();
                      finalVideoUrl = URL.createObjectURL(blob);
                    }
                  } catch (dlErr) {
                    console.error("Failed to load video blob:", dlErr);
                  }

                  if (!finalVideoUrl) {
                    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === messageId ? { ...m, videoStatus: 'failed', text: 'تعذر تحميل الفيديو' } : m) } : s));
                    return;
                  }

                  setSessions(prev => prev.map(s => {
                    if (s.id === currentSessionId) {
                      return {
                        ...s,
                        messages: s.messages.map(m => m.id === messageId ? {
                          ...m,
                          isGeneratingVideo: false,
                          videoStatus: 'ready',
                          generatedVideoUrl: (() => {
                            if (finalVideoUrl) {
                              setTimeout(() => {
                                setGallery(prev => {
                                  if (prev.some(item => item?.url === finalVideoUrl)) return prev;
                                  const newItem: GalleryItem = {
                                    id: `gallery-${Date.now()}`,
                                    type: 'video',
                                    url: finalVideoUrl,
                                    prompt: prompt || 'AI Video Clip',
                                    createdAt: new Date().toISOString()
                                  };
                                  return [newItem, ...prev];
                                });
                              }, 100);
                            }
                            return finalVideoUrl;
                          })(),
                          text: lang === 'ar' ? 'تم إنشاء الفيديو بنجاح!' : 'Video generated successfully!'
                        } : m)
                      };
                    }
                    return s;
                  }));
               } else if (statusData.state === 'FAILED' || statusData.error || !statusRes.ok) {
                  setSessions(prev => prev.map(s => {
                    if (s.id === currentSessionId) {
                      return {
                        ...s,
                        messages: s.messages.map(m => m.id === messageId ? {
                          ...m,
                          isGeneratingVideo: false,
                          videoStatus: 'failed',
                          text: statusData.error || (lang === 'ar' ? 'فشل إنشاء الفيديو.' : 'Failed to generate video.')
                        } : m)
                      };
                    }
                    return s;
                  }));
               } else {
                  const nextDelay = Math.min(currentDelay * POLL_BACKOFF_FACTOR, POLL_MAX_MS);
                  setTimeout(() => pollVideo(nextDelay), nextDelay);
               }
             } catch(err) {
               console.error("Error polling video status", err);
               const nextDelay = Math.min(currentDelay * POLL_BACKOFF_FACTOR, POLL_MAX_MS);
               setTimeout(() => pollVideo(nextDelay), nextDelay);
             }
           };
           setTimeout(() => pollVideo(POLL_START_MS), POLL_START_MS);
        } else if (data.videoUrl || data.url) {
           setSessions(prev => prev.map(s => {
             if (s.id === currentSessionId) {
               return {
                 ...s,
                 messages: s.messages.map(m => m.id === messageId ? {
                    ...m,
                    isGeneratingVideo: false,
                    videoStatus: 'ready',
                    generatedVideoUrl: (() => {
                      const finalVideoUrl = data.videoUrl || data.url;
                      if (finalVideoUrl) {
                        setTimeout(() => {
                          setGallery(prev => {
                            if (prev.some(item => item?.url === finalVideoUrl)) return prev;
                            const newItem: GalleryItem = {
                              id: `gallery-${Date.now()}`,
                              type: 'video',
                              url: finalVideoUrl,
                              prompt: prompt || 'AI Video Clip',
                              createdAt: new Date().toISOString()
                            };
                            return [newItem, ...prev];
                          });
                        }, 100);
                      }
                      return finalVideoUrl;
                    })()
                 } : m)
               };
             }
             return s;
           }));
        }
      }

    } catch (err: any) {
      console.error(err);
      const formatted = await formatProfessionalError(err, { chatType: type === 'video' ? 'video' : 'image' }).catch(() => err.message || 'Generation failed');
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: s.messages.map(m => m.id === messageId ? { ...m, isGeneratingImage: false, isGeneratingVideo: false, text: formatted } : m)
          };
        }
        return s;
      }));
    } finally {
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: s.messages.map(m => m.id === messageId ? { ...m, isGeneratingImage: false, isGeneratingVideo: false } : m)
          };
        }
        return s;
      }));
    }
  };

  const toggleThought = (msgId: string) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  if (!isStorageLoaded) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex h-full bg-[#030303] font-sans text-white overflow-hidden relative">
      {/* High-end Cosmic Animated Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
         {/* Deep radial core */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e1b4b_0%,_#030303_60%)] opacity-80" />
         
         {/* Animated floating orbs */}
         <motion.div 
           className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[100px] rounded-full"
           animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
         />
         <motion.div 
           className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-600/10 blur-[120px] rounded-full"
           animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
           transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
         />
         
         {/* Matrix/Grid lines overlay */}
         <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
         
         {/* Subtle scanline effect */}
         <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30" />
      </div>
      
      {/* SIDEBAR: Chat Sessions Drawer/Library */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Mobile Backdrop overlay */}
            <motion.div 
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-xs z-20 cursor-pointer"
            />
            
            <motion.div 
              key="sidebar-drawer"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full border-l border-r border-white/5 bg-[#0a0a0af8] md:bg-black/60 md:backdrop-blur-2xl flex flex-col z-30 absolute md:relative top-0 bottom-0 rtl:right-0 rtl:left-auto ltr:left-0 ltr:right-auto md:right-auto md:left-auto shrink-0 overflow-hidden shadow-2xl shadow-black/80"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <span className="font-semibold text-white tracking-wide text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {lang === 'ar' ? 'مكتبة برو' : 'PRO LIBRARY'}
              </span>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-amber-500 transition-colors"
                title={lang === 'ar' ? 'إغلاق القائمة' : 'Close Sidebar'}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <button 
                onClick={handleNewSession}
                className="w-full py-3 px-4 rounded-[20px] bg-white/[0.05] hover:bg-white/[0.08] border border-white/5 flex items-center justify-center gap-2 text-sm font-medium text-white transition-all"
              >
                <Plus className="w-4 h-4" />
                {lang === 'ar' ? 'دردشة ذكية جديدة' : 'New Intelligent Chat'}
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              <div className="px-3 py-1.5 flex justify-between items-center text-[10px] uppercase tracking-widest text-amber-500/60 font-semibold">
                <span>{lang === 'ar' ? 'المحادثات السابقة' : 'PREVIOUS CONVERSATIONS'}</span>
                {sessions.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف جميع المحادثات؟' : 'Are you sure you want to delete all chats?')) {
                        const defaultSession = {
                          id: 'session-default',
                          title: lang === 'ar' ? 'محادثة ذكية جديدة' : 'New Intelligent Chat',
                          messages: [
                            {
                              id: 'init',
                              role: 'model' as const,
                              text: lang === 'ar'
                                 ? 'مرحباً بك في **Creative AI Pro** \n\nأنا مستشارك الفني ومساعدك الذكي المتقدم. هنا، نحول الأفكار إلى واقع بصري متكامل بأعلى جودة. إليك نظرة سريعة على ما يمكننا إنجازه معاً:\n\n*   ** إنتاج الفيديو السينمائي:** تصميم فيديوهات احترافية بأبعاد متعددة (16:9، 9:16) بواسطة محرك creative video المتقدم، وبطول يصل إلى 10 ثوانٍ.\n**تكلفة الفيديوهات:**\n(4 ثوانٍ = 2 نقطة، 5 ثوانٍ = 2.5 نقطة، 6 ثوانٍ = 3 نقاط، 8 ثوانٍ = 4 نقاط، 10 ثوانٍ = 5 نقاط).\n*   ** التصميم والصور الذكية:** توليد صور دقيقة وواقعية باستخدام أحدث محركات الذكاء الاصطناعي، بأبعاد تناسب جميع المنصات الاجتماعية والمطبوعات.\n*   ** بناء الهويات البصرية:** تصميم شعارات متكاملة، وبناء حزمة هوية العلامة التجارية (Brand Kit) من الصفر.\n*   ** محرك Creative Imagen Pro:** مخصص للتصاميم المعقدة التي تحتوي على نصوص دقيقة (تايبوجرافي) وتفاصيل إعلانية دقيقة.\n\nأنا هنا لأجيب على أي استفسار حول تكلفة التصاميم، أفضل المحركات لاحتياجك، أو البدء فوراً في إبداع مشروعك. ماذا يدور في ذهنك اليوم؟'
                                 : 'Welcome to **Creative AI Pro** \n\nI am your advanced AI assistant and creative consultant. Here, we turn ideas into stunning visual realities. Here is a quick look at what we can achieve together:\n\n*   ** Cinematic Video Production:** Professional videos in dimensions (16:9, 9:16) using the advanced creative video engine, up to 10 seconds per clip.\n**Video Costs:**\n(4s = 2 pts, 5s = 2.5 pts, 6s = 3 pts, 8s = 4 pts, 10s = 5 pts).\n*   ** Smart Design & Imagery:** Highly detailed and realistic image generation using the latest AI engines, perfectly sized for any platform.\n*   ** Brand Identity Creation:** Full logo design and comprehensive Brand Kit generation from scratch.\n*   ** Creative Imagen Pro Engine:** Specialized for complex designs featuring precise typography and advertising details.\n\nI am here to answer any questions about design costs, the best engines for your needs, or to start creating right away. What is on your mind today?'
                            }
                          ],
                          proMode: 'standard' as const,
                          createdAt: new Date().toISOString()
                        };
                        setSessions([defaultSession]);
                        setCurrentSessionId('session-default');
                      }
                    }}
                    className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                    title={lang === 'ar' ? 'حذف جميع المحادثات' : 'Clear All Chats'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              {sessions.map((sess, idx) => {
                const isActive = sess.id === currentSessionId;
                const isEditing = editingSessionId === sess.id;
                
                return (
                  <div
                    key={`${sess.id}-${idx}`}
                    onClick={() => {
                      if (!isEditing) {
                        setCurrentSessionId(sess.id);
                        setShowAttachmentMenu(false);
                      }
                    }}
                    className={`group w-full rounded-xl p-3 flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300' 
                        : 'hover:bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {sess.proMode === 'thinking' && <Brain className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />}
                      {sess.proMode === 'search' && <Globe className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {sess.proMode === 'image' && <ImageIcon className="w-4 h-4 text-pink-400 shrink-0" />}
                      {sess.proMode === 'study' && <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />}
                      {sess.proMode === 'standard' && <Bot className="w-4 h-4 text-amber-400/80 shrink-0" />}

                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitleInput}
                          onChange={(e) => setEditTitleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveSessionTitle(sess.id);
                            if (e.key === 'Escape') setEditingSessionId(null);
                          }}
                          autoFocus
                          className="w-full bg-black/40 border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-xs font-medium truncate flex-1 leading-normal">
                          {sess.title}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {isEditing ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveSessionTitle(sess.id);
                          }}
                          className="p-1 hover:bg-white/10 rounded text-emerald-400"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => startEditingSession(sess.id, sess.title, e)}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                          title={lang === 'ar' ? 'تعديل الاسم' : 'Rename'}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-red-400"
                        title={lang === 'ar' ? 'حذف المحادثة' : 'Delete'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* User Profile Widget */}
            <div className="p-3 border-t border-white/5 bg-black/30 flex items-center gap-3" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-[1.5px] shrink-0">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-black text-amber-400">
                  AK
                </div>
              </div>
              <div className="flex-1 text-right min-w-0">
                <div className="text-xs font-black text-white truncate">
                  {lang === 'ar' ? 'أحمد خالد' : 'Ahmad Khaled'}
                </div>
                <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1 justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse animate-duration-1000" />
                  <span>{lang === 'ar' ? 'اشتراك Pro' : 'Pro Active'}</span>
                </div>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-white/5 bg-black/40 text-center flex flex-col gap-2">
               <div className="text-xs font-bold text-white mb-1 flex items-center justify-center gap-2">
                 <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"></span>
                 {userName || (lang === 'ar' ? 'مستخدم جديد' : 'New User')}
               </div>
               <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                 <Info className="w-3 h-3 text-amber-500/50" />
                 <span>Creative AI Pro</span>
               </div>
               
               {/* Backup Export/Import & Settings Actions */}
               <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                 <button 
                   onClick={() => setIsSettingsOpen(true)}
                   className="flex items-center gap-1 text-[10px] text-sky-400/80 hover:text-sky-300 bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/5 transition-all"
                   title={lang === 'ar' ? 'الإعدادات وتفاصيل الأوضاع' : 'Settings & Modes Info'}
                 >
                   <Settings className="w-3 h-3" />
                   <span>{lang === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                 </button>

                 <button 
                   onClick={() => {
                     const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions));
                     const downloadAnchor = document.createElement('a');
                     downloadAnchor.setAttribute("href", dataStr);
                     downloadAnchor.setAttribute("download", `creative_ai_chats_${Date.now()}.json`);
                     document.body.appendChild(downloadAnchor);
                     downloadAnchor.click();
                     downloadAnchor.remove();
                   }}
                   className="flex items-center gap-1 text-[10px] text-amber-400/80 hover:text-amber-300 bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/5 transition-all"
                   title={lang === 'ar' ? 'تصدير نسخة احتياطية' : 'Export Chats Backup'}
                 >
                   <Download className="w-3 h-3" />
                   <span>{lang === 'ar' ? 'تصدير' : 'Backup'}</span>
                 </button>
                 
                 <button 
                   onClick={() => fileImportRef.current?.click()}
                   className="flex items-center gap-1 text-[10px] text-emerald-400/80 hover:text-emerald-300 bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/5 transition-all"
                   title={lang === 'ar' ? 'استيراد نسخة احتياطية' : 'Import Chats Backup'}
                 >
                   <Upload className="w-3 h-3" />
                   <span>{lang === 'ar' ? 'استيراد' : 'Restore'}</span>
                 </button>
                 
                 <input 
                   type="file" 
                   ref={fileImportRef} 
                   onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const reader = new FileReader();
                       reader.onload = (evt) => {
                         try {
                           const parsed = JSON.parse(evt.target?.result as string);
                           if (Array.isArray(parsed) && parsed.length > 0) {
                             setSessions(parsed);
                             if (parsed[0]?.id) {
                               setCurrentSessionId(parsed[0].id);
                             }
                             alert(lang === 'ar' ? 'تم استعادة المحادثات بنجاح!' : 'Chats restored successfully!');
                           }
                         } catch (err) {
                           alert(lang === 'ar' ? 'فشل استيراد الملف. تأكد من صحة التنسيق.' : 'Failed to import backup file.');
                         }
                       };
                       reader.readAsText(file);
                     }
                   }}
                   className="hidden" 
                   accept=".json"
                 />
               </div>
            </div>
          </motion.div>
         </>
        )}
      </AnimatePresence>

      {/* MAIN CONVERSATION CONTAINER */}
      <div className="flex-1 h-full flex flex-col relative z-10 overflow-hidden">
        
        {/* Header bar */}
        <div 
          className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-transparent relative z-10"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-amber-400 transition-colors"
                title={lang === 'ar' ? 'فتح المحادثات' : 'Open Sidebar'}
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center p-[2.5px] shadow-lg shadow-amber-500/10">
               <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center">
                 <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
               </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-md sm:text-lg font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  Creative AI Pro
                </h1>
                <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] rounded-md font-bold uppercase tracking-wider">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {lang === 'ar' ? 'مساعدك الذكي للتصميم والتحليل الاحترافي' : 'Your smart assistant for pro design & analysis'}
              </p>
            </div>
          </div>

          {/* Quick Info Mode Tag & Close button */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsGalleryOpen(true)}
              className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-lg active:scale-95"
              title={lang === 'ar' ? 'المكتبة الشخصية' : 'Creations Library'}
            >
              <History className="w-4 h-4" />
              <span className="hidden xs:inline">{lang === 'ar' ? 'مكتبتي الفنية' : 'My Library'}</span>
              {gallery.length > 0 && (
                <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {gallery.length}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-slate-400">
                {lang === 'ar' ? 'المحرك النشط:' : 'Active Engine:'}
              </span>
              <span className="text-amber-300 font-semibold font-mono">
                Creative AI Core
              </span>
            </div>

            {onClose && (
              <button 
                onClick={onClose}
                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-lg"
                title={lang === 'ar' ? 'خروج' : 'Exit Pro'}
              >
                <X className="w-4 h-4" />
                <span className="hidden xs:inline">{lang === 'ar' ? 'خروج' : 'Exit'}</span>
              </button>
            )}
          </div>
        </div>

        {/* CHAT CONTENT */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 w-full relative" 
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="max-w-4xl mx-auto space-y-6 pb-4">
            <AnimatePresence>
                {/* ACTIVE MESSAGE HISTORY VIEW */}
                {activeSession.messages.length === 1 && activeSession.messages[0].id === 'init' ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-3xl mx-auto py-12 md:py-20 px-4 flex flex-col items-center justify-center text-center space-y-8 select-none"
                >
                  <div className="space-y-4 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/20 blur-[60px] rounded-full pointer-events-none" />
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-amber-100 via-white to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                      {lang === 'ar' ? 'ماذا نُبدع اليوم؟' : 'What shall we create today?'}
                    </h2>
                    <p className="text-slate-400 text-sm md:text-base font-medium max-w-md mx-auto drop-shadow-md">
                      {lang === 'ar' ? 'ابدأ الدردشة الآن بكتابة ما تفكر فيه بالأسفل...' : 'Start chatting now by describing what you want below...'}
                    </p>
                  </div>

                  </motion.div>
              ) : (
                activeSession.messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const hasThought = msg.thought && msg.thought.trim().length > 0;
                const isThoughtExpanded = expandedThoughts[msg.id] ?? false;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    key={`${msg.id}-${idx}`}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[90%] md:max-w-[80%] rounded-[2rem] flex flex-col relative overflow-hidden shadow-2xl backdrop-blur-xl ${
                      isUser 
                        ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-white ltr:rounded-br-sm rtl:rounded-bl-sm font-light shadow-[0_10px_40px_rgba(0,0,0,0.4)]' 
                        : 'bg-gradient-to-b from-slate-900/90 to-black/95 border border-slate-700/60 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ltr:rounded-bl-sm rtl:rounded-br-sm'
                    }`}>
                      
                      {/* Message Inner Content */}
                      <div className="p-4 md:p-5">
                        {isUser && msg.attachedImagePreview && (
                          <div className="mb-3 rounded-xl overflow-hidden border border-white/10 shadow-sm max-w-sm">
                            <img src={msg.attachedImagePreview} alt="Attached" className="w-full h-auto max-h-64 object-cover" />
                          </div>
                        )}
                        {/* Header for model */}
                        {!isUser && (
                          <div className="flex items-center justify-between mb-3 text-amber-400 border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2">
                              <Bot className="w-4 h-4" />
                              <span className="text-xs font-black uppercase tracking-widest text-amber-300">
                                {lang === 'ar' ? 'مساعد PRO الذكي' : 'INTELLIGENT PRO'}
                              </span>
                            </div>
                            {proMode !== 'standard' && (
                              <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full capitalize">
                                {proMode === 'thinking' && (lang === 'ar' ? 'التفكير العميق' : 'Thinking')}
                                {proMode === 'search' && (lang === 'ar' ? 'البحث الذكي' : 'Search')}
                                {proMode === 'image' && (lang === 'ar' ? 'المصمم الفني' : 'Designer')}
                                {proMode === 'study' && (lang === 'ar' ? 'المذاكرة والمعرفة' : 'Study Assist')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Expandable/Collapse Thinking process accordion block */}
                        {!isUser && hasThought && (
                          <div className="mb-4 bg-purple-500/5 rounded-xl border border-purple-500/10 overflow-hidden">
                            <button
                              onClick={() => toggleThought(msg.id)}
                              className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-purple-400 hover:bg-purple-500/10 transition-colors text-right"
                            >
                              <div className="flex items-center gap-1.5">
                                <Brain className="w-4 h-4 animate-pulse" />
                                <span>
                                  {lang === 'ar' ? 'عملية التفكير والتحليل المنطقي المتكاملة' : 'Detailed Logic & Thinking Process'}
                                </span>
                              </div>
                              {isThoughtExpanded ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            </button>
                            <AnimatePresence>
                              {isThoughtExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="px-4 pb-3 pt-1 border-t border-purple-500/10 text-[11px] leading-relaxed text-slate-400 font-mono whitespace-pre-wrap select-text"
                                >
                                  {msg.thought}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Main Response Markdown Text or Error Card */}
                        {msg.text?.startsWith('__NAJE_ERROR_JSON__:') ? (
                          <div className="w-full mt-2">
                            <NajeErrorCard jsonContent={msg.text} />
                          </div>
                        ) : (
                          <div className="prose-custom max-w-none break-words leading-relaxed select-text overflow-hidden [word-break:break-word] whitespace-pre-wrap">
                            <ReactMarkdown>{msg.attachedImagePreview ? msg.text.replace(/\n\n\[File Attached: .*?\]/, '') : msg.text}</ReactMarkdown>
                          </div>
                        )}

                        {/* Generation States Indicators */}
                        {msg.isGeneratingImage && (
                          <div className="mt-6 mb-2 flex justify-center items-center w-full relative">
                             <div className="absolute inset-0 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
                             
<InteractiveLoadingPlaceholder lang={lang} userPrompt={idx > 0 ? activeSession.messages[idx-1].text : undefined} />
                          </div>
                        )}

                        {msg.isGeneratingVideo && msg.videoStatus === 'processing' && (
                          <div className="mt-4 flex items-center gap-3 text-fuchsia-400/80 bg-fuchsia-500/5 p-3.5 rounded-xl border border-fuchsia-500/20">
                            <NajeSpinner className="w-4 h-4" />
                            <span className="text-xs font-semibold">{lang === 'ar' ? 'جاري إعداد وصياغة الفيديو السينمائي...' : 'Drafting cinematic scene...'}</span>
                          </div>
                        )}

                        {/* Generated image presentation */}
                        {!msg.generatedImageUrl && msg.conceptOptions && msg.conceptOptions.length > 0 && (

                        <div className="mt-4 grid grid-cols-1 gap-3 px-2">
                          {msg.conceptOptions.map((concept: any, cIdx: number) => (
                            <div key={cIdx} className="bg-slate-800/80 border border-slate-600 rounded-xl p-4 flex flex-col cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => { setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, messages: s.messages.map(m => m.id === msg.id ? { ...m, isGeneratingImage: true } : m) } : s)); handleGenerateMedia(concept.imagePromptDraft, "image", msg.id, "1:1", undefined, undefined, concept.imagePromptDraft); }}>
                               <h5 className="font-bold text-md text-amber-300 mb-1">{concept.philosophyName}</h5>
                               <div className="flex gap-2 mb-2">
                                 <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">{concept.artMovementUsed}</span>
                                 <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">{concept.synthesisPrincipleUsed}</span>
                               </div>
                               <p className="text-xs text-slate-400 mb-2">{concept.whyItWorks}</p>
                               <button className="text-xs bg-amber-500/20 text-amber-300 py-1 rounded w-full border border-amber-500/30 hover:bg-amber-500/40">توليد هذا التصميم</button>
                            </div>
                          ))}
                        </div>
                      )}

                        {msg.generatedImageUrl && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-4 overflow-hidden rounded-xl border border-white/10 shadow-2xl relative group cursor-pointer"
                            onClick={() => setSelectedImageModal({ url: msg.generatedImageUrl!, msgId: msg.id, prompt: msg.text })}
                          >
                            <img src={msg.generatedImageUrl} alt="Generated" className="w-full h-auto object-cover max-h-[400px]" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="px-6 py-3 bg-white/20 backdrop-blur-md rounded-xl text-white font-semibold transition-all transform hover:scale-105 shadow-lg">
                                {lang === 'ar' ? 'عرض الخيارات' : 'View Options'}
                              </span>
                            </div>
                          </motion.div>
                        )}

                        {/* Generated video presentation */}
                        {msg.generatedVideoUrl && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-4 overflow-hidden rounded-xl border border-fuchsia-500/30 shadow-2xl shadow-fuchsia-500/20 relative group"
                          >
                            <video 
                              src={msg.generatedVideoUrl} 
                              controls 
                              autoPlay 
                              loop 
                              className="w-full h-auto max-h-[400px]"
                            />
                            {/* Hover overlay for Video */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity z-10">
                              <a href={msg.generatedVideoUrl} download={`creative-ai-pro-video-${Date.now()}.mp4`} className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-xl text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center">
                                <Download className="w-4 h-4" />
                              </a>
                              <button onClick={() => {
                                setInput(lang === 'ar' ? 'أريد تعديل هذا الفيديو. الرجاء الالتزام الصارم بتعليماتي وعدم تغيير التفاصيل الأخرى: ' : 'I want to edit this video. Please strictly follow my instructions and do not change other details: ');
                              }} className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-xl text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              }))}

            {/* Model is thinking loading skeleton */}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                 <div className="bg-white/5 border border-white/10 rounded-2xl ltr:rounded-bl-none rtl:rounded-br-none p-4 max-w-[80%] flex items-center gap-3">
                   {proMode === 'image' || proMode === 'video' ? (
                     <>
                       <NajeSpinner className="w-5 h-5" />
                       <span className="text-xs font-bold text-amber-400 leading-relaxed">
                         {lang === 'ar' 
                           ? 'قد يستغرق إنشاء التصميم من دقيقة إلى ثلاث دقائق نبدع لك في كل بكسل' 
                           : 'Design generation may take 1 to 3 minutes, crafting every pixel for you...'}
                       </span>
                     </>
                   ) : (
                     <div className="flex gap-1.5 items-center justify-center px-1 h-4">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                     </div>
                   )}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* FLOATING CAMERA CAPTURE WINDOW */}
        <AnimatePresence>
          {showCamera && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#0c0c0c] border border-amber-500/30 rounded-3xl overflow-hidden max-w-md w-full relative shadow-2xl text-center"
              >
                <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <span className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-400" />
                    {lang === 'ar' ? 'التقاط فوري بالكاميرا' : 'Instant Camera Stream'}
                  </span>
                  <button onClick={stopCamera} className="p-1 rounded-full bg-white/5 hover:bg-white/10">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                <div className="p-5 flex items-center justify-center gap-4 bg-black/60">
                  <button 
                    onClick={capturePhoto}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm rounded-full shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-transform"
                  >
                    {lang === 'ar' ? 'التقاط الصورة' : 'Capture Photo'}
                  </button>
                  <button 
                    onClick={stopCamera}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* INPUT PANEL & BOTTOM FLOAT ACTIONS */}
        <div 
          className="p-4 bg-[#0a0a0a]/80 backdrop-blur-2xl border-t border-white/10 relative z-10" 
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="max-w-4xl mx-auto relative">

            {/* FLOATING ATTACHMENT MENU DRAWER */}
            <AnimatePresence>
              {showAttachmentMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="absolute bottom-full mb-3 right-0 left-0 max-w-md mx-auto bg-[#0d0d0d]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl z-40"
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <span className="text-xs font-black text-amber-400 tracking-wider uppercase">
                      {lang === 'ar' ? 'إرفاق محتوى أو وسائط مخصصة' : 'ATTACH PRO CONTENT'}
                    </span>
                    <button 
                      onClick={() => setShowAttachmentMenu(false)}
                      className="p-1 rounded-full hover:bg-white/10"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>

                  {/* Three major rounded options circles */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {/* Circle 1: Photos */}
                    <button
                      onClick={() => {
                        imageOnlyInputRef.current?.click();
                      }}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/5 hover:bg-amber-500/20 border border-white/10 group-hover:border-amber-500/40 flex items-center justify-center text-white group-hover:text-amber-400 transition-all shadow-lg active:scale-95">
                        <ImageIcon className="w-7 h-7" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                        {lang === 'ar' ? 'الصور' : 'Photos'}
                      </span>
                    </button>

                    {/* Circle 2: Camera */}
                    <button
                      onClick={startCamera}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/5 hover:bg-amber-500/20 border border-white/10 group-hover:border-amber-500/40 flex items-center justify-center text-white group-hover:text-amber-400 transition-all shadow-lg active:scale-95">
                        <Camera className="w-7 h-7" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                        {lang === 'ar' ? 'الكاميرا' : 'Camera'}
                      </span>
                    </button>

                    {/* Circle 3: Files */}
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/5 hover:bg-amber-500/20 border border-white/10 group-hover:border-amber-500/40 flex items-center justify-center text-white group-hover:text-amber-400 transition-all shadow-lg active:scale-95">
                        <Paperclip className="w-7 h-7" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                        {lang === 'ar' ? 'الملفات' : 'Files'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* FILE INPUT FALLBACKS */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept="*/*" multiple
            />
            <input 
              type="file" 
              ref={imageOnlyInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept="image/*" multiple
            />
            <input 
              type="file" 
              ref={cameraInputFallbackRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
            />
            
            {/* Attachment preview banner */}
            <AnimatePresence>
                        {selectedFiles.length > 0 && (
              <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="mb-3 flex flex-wrap gap-3 z-10 relative"
              >
                {selectedFiles.map((f, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 pr-9 border border-white/20 flex items-center gap-3 relative">
                    {selectedFilePreviews[i] ? (
                      <img src={selectedFilePreviews[i]} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-500" />
                      </div>
                    )}
                    <div className="text-xs max-w-[120px] truncate text-slate-300" dir="ltr">{f.name}</div>
                    <button 
                      onClick={() => removeSelectedFile(i)}
                      className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500/80 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-2 px-1 relative z-20">
               <div className="relative">
                 <button 
                    type="button"
                    onClick={() => setShowModelMenu(!showModelMenu)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all shadow-sm backdrop-blur-md"
                 >
                    {useCreativePro ? (
                      <><Zap className="w-3 h-3 text-amber-400" /> Creative Imagen Pro</>
                    ) : (
                      <><Sparkles className="w-3 h-3 text-amber-400" /> Creative Imagen</>
                    )}
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} />
                 </button>
                 
                 <AnimatePresence>
                   {showModelMenu && (
                     <motion.div 
                       initial={{ opacity: 0, y: 5 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: 5 }}
                       className={`absolute bottom-[calc(100%+8px)] ${lang === 'ar' ? 'right-0' : 'left-0'} z-50 w-64 bg-[#111] border border-white/10 rounded-2xl p-1.5 shadow-2xl overflow-hidden`}
                     >
                        <button 
                          type="button"
                          onClick={() => { setUseCreativePro(false); setShowModelMenu(false); }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${!useCreativePro ? 'bg-white/10' : 'hover:bg-white/5'}`}
                        >
                           <div className="flex items-center gap-2.5">
                             <div className={`p-1.5 rounded-lg ${!useCreativePro ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400'}`}>
                               <Sparkles className="w-4 h-4" />
                             </div>
                             <div className="text-start">
                               <div className={`text-sm font-bold ${!useCreativePro ? 'text-white' : 'text-slate-300'}`}>Creative Imagen</div>
                               <div className="text-[10px] text-slate-500">{lang === 'ar' ? 'النموذج الافتراضي السريع' : 'Fast default model'}</div>
                             </div>
                           </div>
                           {!useCreativePro && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => { setUseCreativePro(true); setShowModelMenu(false); }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mt-1 ${useCreativePro ? 'bg-white/10' : 'hover:bg-white/5'}`}
                        >
                           <div className="flex items-center gap-2.5">
                             <div className={`p-1.5 rounded-lg ${useCreativePro ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400'}`}>
                               <Zap className="w-4 h-4" />
                             </div>
                             <div className="text-start">
                               <div className={`text-sm font-bold flex items-center gap-1.5 ${useCreativePro ? 'text-white' : 'text-slate-300'}`}>
                                  Creative Imagen Pro <span className="bg-amber-500 text-white text-[8px] px-1 py-0.5 rounded font-black uppercase">Pro</span>
                               </div>
                               <div className="text-[10px] text-slate-500">{lang === 'ar' ? 'جودة فائقة وواقعية سينمائية' : 'Ultra quality & cinematic'}</div>
                             </div>
                           </div>
                           {useCreativePro && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                        </button>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
               
               <span className="text-[10px] text-slate-500 px-2">
                  {useCreativePro ? (lang === 'ar' ? '1.6 نقطة / تصميم' : '1.6 pts / design') : (lang === 'ar' ? '1.1 نقطة / تصميم' : '1.1 pts / design')}
               </span>
            </div>

            <div className="relative bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl focus-within:border-amber-500/50 focus-within:bg-black/80 transition-all flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] z-10 group">
              {/* Animated glowing border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-fuchsia-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  proMode === 'thinking' 
                    ? (lang === 'ar' ? 'اكتب مسألتك أو سؤالك المعقد ليتفكر فيه النموذج عميقاً...' : 'Ask your complex problem to let Pro analyze deeply...')
                    : proMode === 'search'
                    ? (lang === 'ar' ? 'اسأل عما تريد وسيتصفح المساعد الويب لك...' : 'Ask anything, and we will search the web...')
                    : proMode === 'image'
                    ? (lang === 'ar' ? 'صف ملامح الصورة التي تتخيلها وتود تصميمها...' : 'Describe the traits of the image you want designed...')
                    : proMode === 'study'
                    ? (lang === 'ar' ? 'اطلب شرحاً، تلخيصاً، أو خطة مذاكرة تفاعلية لدرسك...' : 'Ask for interactive explanation, summary, or study plan...')
                    : (lang === 'ar' ? 'صف خيالك هنا أو أرفق صورة/فيديو...' : 'Describe your imagination or attach a media file...')
                }
                className="w-full bg-transparent py-4 px-5 text-white placeholder-slate-500 focus:outline-none resize-none min-h-[56px] max-h-[120px] transition-all text-sm leading-relaxed custom-scrollbar"
                rows={1}
                disabled={isLoading || !activationCode || activationCode.length < 8}
              />
              
              <div className="flex items-center justify-between p-2.5 bg-black/40 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAttachmentMenu(prev => !prev)}
                    disabled={isLoading || !activationCode || activationCode.length < 8}
                    className={`p-3 rounded-full text-amber-500 transition-all active:scale-95 disabled:opacity-50 ${
                      showAttachmentMenu 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                        : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                    }`}
                    title={lang === 'ar' ? 'إرفاق محتوى / وسائط مخصصة' : 'Attach File / Media'}
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || (!input.trim() && selectedFiles.length === 0) || !activationCode || activationCode.length < 8}
                  className="w-12 h-12 bg-amber-500 hover:bg-amber-400 text-black rounded-full transition-all disabled:opacity-35 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95 group shrink-0"
                >
                  {isLoading ? <NajeSpinner className="w-5 h-5" /> : <ArrowUp className="w-5 h-5 transition-transform duration-300" strokeWidth={3} />}
                </button>
              </div>
            </div>

          </div>
          {/* Activation Required warning */}
          {(!activationCode || activationCode.length < 8) && (
            <p className="text-red-400 text-xs text-center mt-2 font-semibold">
              {lang === 'ar' ? 'يرجى تفعيل حسابك أولاً باستخدام كود صحيح لاستخدام ميزات Pro.' : 'Please activate your account with a valid code to use Pro features.'}
            </p>
          )}

          {/* Pro Badges Footer */}
          <div className="flex items-center justify-center gap-4 mt-3.5 text-[10px] text-slate-500">
             <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500/50"/> {lang === 'ar' ? 'التصحيح النحوي الفوري' : 'AI Grammar Correction'}</span>
             <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5 text-amber-500/50"/> {lang === 'ar' ? 'صور فائقة الدقة 4K' : 'Ultra HD Images'}</span>
             <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-amber-500/50"/> {lang === 'ar' ? 'مقاطع فيديو سينمائية' : 'Pro Videos'}</span>
          </div>
         </div>
       </div>

       {/* Floating Toast Notification for Mode Activations */}
       <AnimatePresence>
         {modeNotification && (
           <motion.div
             initial={{ opacity: 0, y: -20, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: -20, scale: 0.9 }}
             className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0d0d0d] border border-amber-500/30 text-amber-300 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-2xl shadow-amber-500/10 flex items-center gap-2"
           >
             <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
             <span>{modeNotification}</span>
           </motion.div>
         )}
       </AnimatePresence>

       {/* Image Modal */}
       <AnimatePresence>
         {selectedImageModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedImageModal(null)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="relative bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
             >
               <div className="flex justify-between items-center p-4 border-b border-white/5 bg-black/20">
                 <h3 className="font-bold text-white">
                   {lang === 'ar' ? 'خيارات التصميم' : 'Design Options'}
                 </h3>
                 <button onClick={() => setSelectedImageModal(null)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="flex-1 overflow-auto p-4 flex justify-center items-center bg-black/50">
                 <img src={selectedImageModal.url} className="max-w-full max-h-full object-contain rounded-xl shadow-lg" alt="Selected Design" />
               </div>

               <div className="p-4 border-t border-white/5 bg-black/20 flex flex-wrap gap-3 justify-center items-center">
                 <a 
                   href={selectedImageModal.url} 
                   download={`creative-ai-pro-${Date.now()}.jpg`}
                   className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-black font-bold transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95"
                 >
                   <Download className="w-4 h-4" />
                   {lang === 'ar' ? 'تنزيل وحفظ' : 'Download'}
                 </a>
                 <button
                   onClick={() => {
                     attachImageForEdit(selectedImageModal.url, selectedImageModal.prompt || '', false);
                   }}
                   className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all active:scale-95 border border-white/10"
                 >
                   <Edit2 className="w-4 h-4" />
                   {lang === 'ar' ? 'تعديل التصميم' : 'Edit Design'}
                 </button>
                 <button
                   onClick={() => {
                     attachImageForEdit(selectedImageModal.url, selectedImageModal.prompt || '', true);
                   }}
                   className="flex items-center gap-2 px-5 py-2.5 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 rounded-xl font-bold transition-all active:scale-95 border border-fuchsia-500/30"
                 >
                   <RefreshCw className="w-4 h-4" />
                   {lang === 'ar' ? 'إعادة تصميم' : 'Redesign'}
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Settings & Mode Details Modal */}
       <AnimatePresence>
         {isSettingsOpen && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-[#0e0e0e] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
               dir={lang === 'ar' ? 'rtl' : 'ltr'}
             >
               {/* Modal Header */}
               <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40">
                 <div className="flex items-center gap-2">
                   <Settings className="w-5 h-5 text-amber-400" />
                   <h2 className="text-md sm:text-lg font-black text-white">
                     {lang === 'ar' ? 'الإعدادات وتفاصيل الأوضاع' : 'Settings & Mode Details'}
                   </h2>
                 </div>
                 <button 
                   onClick={() => setIsSettingsOpen(false)}
                   className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>

               {/* Settings Content */}
               <div className="p-6 overflow-y-auto flex-1 space-y-6 text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                 <div className="space-y-6">
                   {/* User Profile Settings */}
                   <div className="bg-black/20 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                          <span className="text-xl"></span>
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm sm:text-base">{lang === 'ar' ? 'الملف الشخصي' : 'User Profile'}</h4>
                          <p className="text-xs text-slate-400">{lang === 'ar' ? 'أدخل اسمك ليقوم النموذج بمعرفته' : 'Enter your name so the model recognizes you'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">{lang === 'ar' ? 'الاسم الشخصي' : 'Your Name'}</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={userName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setUserName(val);
                              setUserNameSuccess(false);
                              
                              const lowerVal = val.toLowerCase();
                              const forbidden = ['admin', 'system', 'root', 'fake', 'test', 'مسيء', 'كلب', 'حمار', 'غبي', 'fuck', 'shit', 'bitch'];
                              if (forbidden.some(w => lowerVal.includes(w))) {
                                  setUserNameError(lang === 'ar' ? 'عذراً، هذا الاسم غير مسموح به (اسم مسيء أو مستعار).' : 'Sorry, this name is not allowed (offensive or reserved fake name).');
                              } else if (val.length > 0 && val.length < 2) {
                                  setUserNameError(lang === 'ar' ? 'الاسم قصير جداً' : 'Name is too short');
                              } else {
                                  setUserNameError(null);
                              }
                            }}
                            placeholder={lang === 'ar' ? 'أدخل اسمك هنا...' : 'Enter your name here...'}
                            className={`flex-1 bg-black/40 border ${userNameError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500/50'} rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:bg-black/60 transition-all text-sm`}
                          />
                          <button 
                            onClick={() => {
                              if (!userNameError && userName.length >= 2) {
                                localStorage.setItem('creative_pro_user_name', userName);
                                setUserNameSuccess(true);
                                setTimeout(() => setUserNameSuccess(false), 3000);
                              }
                            }}
                            disabled={!!userNameError || userName.length < 2}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold transition-colors text-sm"
                          >
                            {lang === 'ar' ? 'حفظ' : 'Save'}
                          </button>
                        </div>
                        {userNameError && (
                          <p className="text-xs text-red-400 mt-1">{userNameError}</p>
                        )}
                        {userNameSuccess && (
                          <p className="text-xs text-green-400 mt-1">{lang === 'ar' ? 'تم حفظ الاسم بنجاح وسيتعرف عليك النموذج الآن!' : 'Name saved successfully! The model will recognize you now.'}</p>
                        )}
                      </div>
                   </div>

                   {/* Activation Code & Usage Stats */}
                   <div className="bg-black/20 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
                          <KeyRound className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm sm:text-base">{lang === 'ar' ? 'معلومات الاشتراك' : 'Subscription Details'}</h4>
                          <p className="text-xs text-slate-400">{lang === 'ar' ? 'قم بتحديث الكود الخاص بك وتتبع استهلاكك' : 'Update your code and track usage'}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-2">{lang === 'ar' ? 'كود التفعيل' : 'Activation Code'}</label>
                          <input 
                            type="text" 
                            value={activationCode}
                            onChange={(e) => {
                              if (setActivationCode) {
                                setActivationCode(e.target.value.toUpperCase());
                              }
                            }}
                            placeholder={lang === 'ar' ? 'أدخل كود التفعيل...' : 'Enter activation code...'}
                            className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:bg-black/60 transition-all font-mono tracking-widest text-sm uppercase"
                          />
                        </div>

                        {codeStatus && (
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-slate-400">{lang === 'ar' ? 'الرصيد المتاح' : 'Available Balance'}</span>
                              <span className={`text-sm font-bold ${hasBalance ? 'text-green-400' : 'text-red-400'}`}>
                                {Math.max(0, codeStatus.limit - codeStatus.usage)} {lang === 'ar' ? 'تصميم' : 'designs'}
                              </span>
                            </div>
                            <div className="w-full bg-black/50 rounded-full h-2 mb-2 overflow-hidden border border-white/5">
                              <div 
                                className={`h-2 rounded-full ${!hasBalance ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`} 
                                style={{ width: `${Math.min(100, (codeStatus.usage / codeStatus.limit) * 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                              <span>{lang === 'ar' ? 'الاستهلاك:' : 'Usage:'} {codeStatus.usage}</span>
                              <span>{lang === 'ar' ? 'الحد الكلي:' : 'Limit:'} {codeStatus.limit}</span>
                            </div>
                          </div>
                        )}
                        {!codeStatus && activationCode && (
                          <div className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-center">
                            {lang === 'ar' ? 'جاري التحقق من الكود...' : 'Checking code status...'}
                          </div>
                        )}
                      </div>
                   </div>

                   <h3 className="text-sm font-bold text-amber-400 border-b border-white/10 pb-2">
                     {lang === 'ar' ? 'إعدادات وضع الذكاء الاصطناعي (Creative AI Pro)' : 'AI Mode Settings (Creative AI Pro)'}
                   </h3>
                   <div className="grid gap-4">
                     {AVAILABLE_MODES.map(mode => {
                       const isSelected = activeSession?.proMode === mode.id;
                       return (
                       <div 
                         key={mode.id} 
                         onClick={() => {
                           setProModeForActiveSession(mode.id as any);
                           setIsSettingsOpen(false);
                         }}
                         className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                           isSelected 
                             ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5' 
                             : 'bg-white/5 border-white/5 hover:border-amber-500/20'
                         }`}
                       >
                         <div className="flex items-center gap-3 mb-2">
                           <div className={`p-2 rounded-lg ${mode.colorClass} ${isSelected ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                             <mode.icon className="w-5 h-5" />
                           </div>
                           <div>
                             <h4 className={`font-bold text-sm ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                               {lang === 'ar' ? mode.nameAr : mode.nameEn}
                             </h4>
                             {mode.badge && (
                               <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">
                                 {mode.badge}
                               </span>
                             )}
                           </div>
                         </div>
                         <p className="text-xs text-slate-400 leading-relaxed">
                           {lang === 'ar' ? mode.descAr : mode.descEn}
                         </p>
                       </div>
                     )})}
                   </div>
                 </div>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Personal Creations Gallery Modal */}
       <AnimatePresence>
         {isGalleryOpen && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-[#0e0e0e] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
               dir={lang === 'ar' ? 'rtl' : 'ltr'}
             >
               {/* Modal Header */}
               <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40">
                 <div className="flex items-center gap-2">
                   <History className="w-5 h-5 text-amber-400" />
                   <h2 className="text-md sm:text-lg font-black text-white">
                     {lang === 'ar' ? 'مكتبتي الفنية الشخصية للوسائط' : 'My Personal Media Library'}
                   </h2>
                   <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                     {gallery.length} {lang === 'ar' ? 'عنصر' : 'items'}
                   </span>
                 </div>
                 <button 
                   onClick={() => setIsGalleryOpen(false)}
                   className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>

               {/* Gallery Content */}
               <div className="p-6 overflow-y-auto flex-1 space-y-6">
                 {gallery.length === 0 ? (
                   <div className="text-center py-12 space-y-3">
                     <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                       <Sparkles className="w-6 h-6" />
                     </div>
                     <p className="text-sm text-slate-400 font-bold">
                       {lang === 'ar' ? 'لا توجد وسائط تم إنشاؤها بعد.' : 'No media generated yet.'}
                     </p>
                     <p className="text-xs text-slate-500 max-w-xs mx-auto">
                       {lang === 'ar' 
                         ? 'استخدم أوضاع "مصمم الصور" أو "صانع الفيديو" لتوليد إبداعاتك وحفظها تلقائياً هنا!' 
                         : 'Use "Image Designer" or "AI Video Creator" to automatically save your creations here!'}
                     </p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     {gallery.map((item) => (
                       <div 
                         key={item?.id} 
                         className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all flex flex-col group relative"
                       >
                         {/* Visual Preview */}
                         <div className="aspect-video bg-black flex items-center justify-center relative overflow-hidden">
                           {item?.type === 'image' ? (
                             <img 
                               src={item?.url} 
                               alt={item?.prompt} 
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                               referrerPolicy="no-referrer"
                             />
                           ) : (
                             <div className="w-full h-full relative">
                               <video 
                                 src={item?.url} 
                                 className="w-full h-full object-cover"
                                 controls
                               />
                               <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-rose-400 flex items-center gap-1">
                                 <Play className="w-2.5 h-2.5 fill-current" />
                                 <span>VIDEO</span>
                               </div>
                             </div>
                           )}

                           {/* Absolute download button overlay */}
                           <a 
                             href={item?.url} 
                             target="_blank"
                             download={`creative_ai_${item?.id}.${item?.type === 'image' ? 'png' : 'mp4'}`}
                             className="absolute bottom-2 right-2 p-2 bg-black/70 backdrop-blur-md rounded-xl text-amber-400 hover:text-white hover:bg-amber-500 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                             title={lang === 'ar' ? 'تنزيل وحفظ' : 'Download File'}
                           >
                             <Download className="w-4 h-4" />
                           </a>
                         </div>

                         {/* Prompt Details */}
                         <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                           <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2" title={item?.prompt}>
                             {item?.prompt}
                           </p>
                           
                           <div className="flex items-center justify-between pt-2 border-t border-white/5">
                             <span className="text-[10px] text-slate-500 font-mono">
                               {new Date(item?.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                             </span>
                             <button 
                               onClick={() => {
                                 if (confirm(lang === 'ar' ? 'هل تود حذف هذا التصميم من مكتبتك؟' : 'Delete this item?')) {
                                   setGallery(prev => prev.filter(g => g.id !== item?.id));
                                 }
                               }}
                               className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded-lg transition-all"
                               title={lang === 'ar' ? 'حذف' : 'Delete'}
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               {/* Modal Footer */}
               <div className="p-4 border-t border-white/5 bg-black/40 text-center text-xs text-slate-500">
                 {lang === 'ar' 
                   ? 'تم تخزين هذه الملفات محلياً في ذاكرة متصفحك الشخصي الآمنة لخصوصية تامة .' 
                   : 'All creations are saved locally in your browser storage for maximum privacy .'}
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
     </div>
   );
 }
