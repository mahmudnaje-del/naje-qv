import React, { useState, useRef, useEffect, useMemo } from 'react';
import { auth } from '../../firebase';
import { InteractiveLoadingPlaceholder } from './InteractiveLoadingPlaceholder';
import NajeSpinner from '../NajeSpinner';

import { get, set, del } from 'idb-keyval';
import { 
  SendHorizontal, 
  Sparkles, 
  Download, 
  Lock, 
  Menu, 
  Plus, 
  Image as ImageIconSVG, 
  MessageSquare, 
  X, 
  Trash2, 
  Settings, 
  KeyRound, 
  HelpCircle, 
  Smartphone, 
  CheckCircle, 
  Info, 
  RotateCcw,
  BookOpen,
  Share2,
  Film,
  Zap,
  ChevronDown,
  CheckCircle2,
  Paperclip,
  FileText,
  Camera,
  ArrowUp,
  AlertTriangle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { getAllDesigns, saveDesign } from '../../lib/creativelyDesigns';
import { formatProfessionalError } from '../../utils/errorFormatter';
import NajeErrorCard from '../NajeErrorCard';
import { useAppStore } from '../../store';

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage not accessible:", e);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage not accessible:", e);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage not accessible:", e);
    }
  }
};


interface ChatDesignerProps {
  activationCode?: string;
  setActivationCode?: (code: string) => void;
  isCodeValid?: boolean;
  hasBalance?: boolean;
  isCheckingCode?: boolean;
  codeStatus?: any;
  lang?: 'ar' | 'en';
  onDesignGenerated?: () => void;
  onGoHome?: () => void;
  onPaywallTrigger?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  videoOperationName?: string;
  videoUrl?: string;
  attachedImagePreview?: string;
}

interface InlineVideoMessageProps {
  operationName: string;
  initialVideoUrl?: string;
  lang: 'ar' | 'en';
  onFinished: (videoUrl: string) => void;
}

function InlineVideoMessage({ operationName, initialVideoUrl, lang, onFinished }: InlineVideoMessageProps) {
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl || '');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (videoUrl) return;

    let pollTimeout: any;
    let simulatedProgressInterval: any;
    let cancelled = false;

    const POLL_START_MS = 5000;
    const POLL_MAX_MS = 30000;
    const POLL_BACKOFF_FACTOR = 1.5;
    const MAX_TOTAL_WAIT_MS = 10 * 60 * 1000; // 10 minutes

    const startedAt = Date.now();

    setProgress(0);
    simulatedProgressInterval = setInterval(() => {
      setProgress(prev => (prev < 95 ? prev + (95 - prev) * 0.05 : prev));
    }, 2000);

    const poll = async (currentDelay: number) => {
      if (cancelled) return;

      if (Date.now() - startedAt > MAX_TOTAL_WAIT_MS) {
        clearInterval(simulatedProgressInterval);
        setHasError(true);
        return;
      }

      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/creatively/video-status', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ operationName })
        });
        if (!res.ok) {
          throw new Error(`HTTP Error ${res.status}`);
        }
        const statusResult = await res.json();

        if (statusResult.progress) {
          setProgress(statusResult.progress);
        }

        if (statusResult.error && !statusResult.done) {
          console.error("Polling error", statusResult.error);
          clearInterval(simulatedProgressInterval);
          setHasError(true);
          return;
        }

        if (statusResult.done) {
          clearInterval(simulatedProgressInterval);
          setProgress(100);

          try {
            const dlRes = await fetch(`/api/creatively/video-download?operationName=${encodeURIComponent(operationName)}`, {
              headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              }
            });
            if (dlRes.ok) {
              const blob = await dlRes.blob();
              const blobUrl = URL.createObjectURL(blob);
              setVideoUrl(blobUrl);
              onFinished(blobUrl);
            } else {
              setHasError(true);
            }
          } catch (err) {
            console.error("Error fetching video blob:", err);
            setHasError(true);
          }
          return;
        }

        const nextDelay = Math.min(currentDelay * POLL_BACKOFF_FACTOR, POLL_MAX_MS);
        pollTimeout = setTimeout(() => poll(nextDelay), nextDelay);
      } catch (e) {
        console.error("Error polling video status", e);
        const nextDelay = Math.min(currentDelay * POLL_BACKOFF_FACTOR, POLL_MAX_MS);
        pollTimeout = setTimeout(() => poll(nextDelay), nextDelay);
      }
    };

    pollTimeout = setTimeout(() => poll(POLL_START_MS), POLL_START_MS);

    return () => {
      cancelled = true;
      if (pollTimeout) clearTimeout(pollTimeout);
      if (simulatedProgressInterval) clearInterval(simulatedProgressInterval);
    };
  }, [operationName, videoUrl, onFinished]);

  if (hasError) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex flex-col items-center justify-center gap-2 max-w-sm">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-semibold">{lang === 'ar' ? 'فشل توليد الفيديو أو نفذ الرصيد' : 'Video generation failed or quota exceeded.'}</span>
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className="mt-4 space-y-3 max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
          <CheckCircle className="w-4 h-4" />
          <span>{lang === 'ar' ? 'تم تجهيز الفيديو بنجاح!' : 'Video successfully generated!'}</span>
        </div>
        <div className="relative group rounded-xl overflow-hidden border border-white/10 shadow-xl bg-black/50 aspect-video">
          <video 
            src={videoUrl} 
            controls 
            className="w-full h-full object-cover"
            playsInline
          />
        </div>
        <div className="flex flex-col gap-2">
          <a 
            href={videoUrl} 
            download={`creative-ai-video-${operationName}.mp4`}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {lang === 'ar' ? 'تحميل الفيديو' : 'Download Video'}
          </a>
          <span className="text-[10px] text-slate-400 leading-relaxed block text-center">
            {lang === 'ar' 
              ? 'إذا واجهتك مشكلة في التحميل، اضغط مطولاً على الفيديو ثم اختر تحميل.' 
              : 'If you encounter an issue downloading, long-press the video and select download.'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-5 bg-white/5 border border-white/10 rounded-2xl max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-3 text-purple-400">
        <NajeSpinner className="w-5 h-5" />
        <span className="text-sm font-bold">
          {lang === 'ar' ? 'جاري تصوير وإنتاج الفيديو...' : 'Producing and generating video...'}
        </span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">
        {lang === 'ar' 
          ? 'يستغرق توليد الفيديو بضع دقائق. شكراً لصبرك!' 
          : 'Generating video takes a few minutes. Thanks for your patience!'}
      </p>
      
      <div className="space-y-1.5">
        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/5">
          <div 
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
          <span>{lang === 'ar' ? 'التقدم' : 'Progress'}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export function ChatDesigner({ 
  activationCode = 'naje_authenticated', 
  setActivationCode = () => {}, 
  isCodeValid = true, 
  hasBalance = true,
  isCheckingCode = false,
  codeStatus = null,
  lang = 'ar',
  onDesignGenerated,
  onGoHome,
  onPaywallTrigger
}: ChatDesignerProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'library' | 'settings'>('chat');
  const [localDesigns, setLocalDesigns] = useState<any[]>([]);
  const [clearConfirm, setClearConfirm] = useState(false);
  
  const [input, setInput] = useState('');
  const [useCreativePro, setUseCreativePro] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Lightbox & Edit States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [lastUploadedBase64, setLastUploadedBase64] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageOnlyInputRef = useRef<HTMLInputElement>(null);
  const cameraInputFallbackRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setShowAttachmentMenu(false);
      if ((file?.type || '').startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file?.name || '')) {
        const url = URL.createObjectURL(file);
        setSelectedFilePreview(url);
        const reader = new FileReader();
        reader.onload = (ev) => {
          setLastUploadedBase64(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setSelectedFilePreview(null);
        setLastUploadedBase64(null);
      }
    }
  };
  const [editPromptText, setEditPromptText] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const handleCopyLink = async (text: string) => {
    const promotionalText = lang === 'ar' 
      ? ` شاهد هذا التصميم المذهل الذي تم إنشاؤه بواسطة Creative AI! \n\n الرابط:\n${text}\n\nصمم هويتك البصرية وفيديوهاتك السينمائية الآن بلمسة من الذكاء الاصطناعي!`
      : ` Check out this stunning design created by Creative AI! \n\n Link:\n${text}\n\nCreate your brand identity and cinematic videos now with the power of AI!`;
    const textToCopy = text.startsWith('http') ? promotionalText : text;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2000);
      } else {
        // Fallback for iframe environments or restricted permissions
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopiedSuccess(true);
            setTimeout(() => setCopiedSuccess(false), 2000);
          }
        } catch (err) {
          console.error('Fallback copy command failed', err);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  // Load local designs from IndexedDB (persisted in browser across whole app)
  const fetchLocalDesigns = async () => {
    try {
      const designs = await getAllDesigns();
      if (designs && Array.isArray(designs)) {
        setLocalDesigns(designs);
      }
    } catch (e) {
      console.error('Failed to load local designs', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'library') {
      fetchLocalDesigns();
    }
  }, [activeTab]);

  // Load from local storage on mount
    useEffect(() => {
    async function loadData() {
      try {
        const saved = (await get(`koun_chat_sessions_${activationCode}`)) || (await get('koun_chat_sessions'));
        let loadedSessions = [];
        if (saved) {
          try {
            loadedSessions = JSON.parse(saved);
          } catch(e) {}
        }
        
        if (Array.isArray(loadedSessions) && loadedSessions.length > 0) {
          setSessions(loadedSessions);
          if (loadedSessions[0].messages.length > 1) {
            setTimeout(() => createNewSession(), 0);
          } else {
            setCurrentSessionId(loadedSessions[0].id);
          }
        } else {
          createNewSession();
        }
      } catch (e) {
        console.error("IDB load error", e);
        createNewSession();
      } finally {
        setIsStorageLoaded(true);
      }
    }
    loadData();
  }, [activationCode, lang]);

  // Save to local storage whenever sessions change
    useEffect(() => {
    if (sessions.length > 0 && activationCode && isStorageLoaded) {
      set(`koun_chat_sessions_${activationCode}`, JSON.stringify(sessions));
      set('koun_chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions, activationCode, isStorageLoaded]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString() + "-" + Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7),
      title: lang === 'ar' ? 'محادثة جديدة' : 'New Chat',
      messages: [
        {
          role: 'assistant',
          content: lang === 'ar' 
            ? 'مرحباً بك في **Creative AI** \n\nأنا مساعدك الذكي لتصميم الجرافيك. يمكنني مساعدتك في تحويل أفكارك إلى تصاميم احترافية بضغطة زر. إليك نظرة سريعة على ميزاتي:\n\n*   ** توليد الصور الذكية:** تصميم صور عالية الدقة لتناسب جميع احتياجاتك.\n*   ** واجهة سهلة:** يمكنك تعديل وتخصيص الأفكار بمجرد الدردشة معي.\n*   ** أبعاد متعددة:** دعم لأبعاد 1:1 للصور القياسية.\n\nأنا جاهز دائماً. ماذا تود أن نصمم اليوم؟' 
            : 'Welcome to **Creative AI** \n\nI am your intelligent graphic design assistant. I can help you turn your ideas into professional designs with a click. Here is a quick look at my features:\n\n*   ** Smart Image Generation:** High-resolution image design tailored to your needs.\n*   ** Easy Interface:** Modify and customize ideas just by chatting with me.\n*   ** Multiple Dimensions:** Support for standard 1:1 dimensions.\n\nI am always ready. What would you like to design today?'
        }
      ],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setActiveTab('chat');
    setIsSidebarOpen(false);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== id);
      if (newSessions.length === 0) {
        const newSession: ChatSession = {
          id: Date.now().toString() + "-" + Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7),
          title: lang === 'ar' ? 'محادثة جديدة' : 'New Chat',
          messages: [
            {
              role: 'assistant',
              content: lang === 'ar' 
                ? 'مرحباً! أنا المساعد الذكي الخاص بك من Creative AI. كيف يمكنني مساعدتك في تصميماتك اليوم؟' 
                : 'Hello! I am your Creative AI assistant. How can I help you design today?'
            }
          ],
          updatedAt: Date.now()
        };
        setCurrentSessionId(newSession.id);
        return [newSession];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(newSessions[0].id);
      }
      return newSessions;
    });
  };

  const handleClearAllHistory = () => {
    del(`koun_chat_sessions_${activationCode}`);
    del('koun_chat_sessions');
    createNewSession();
    setClearConfirm(false);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Union of images generated inside the active chat + the browser persisted gallery
  const mergedImages = useMemo(() => {
    const chatImages = sessions.flatMap(s => s.messages.filter(m => m.imageUrl).map(m => m.imageUrl as string));
    
    // Map IndexedDB designs securely (either as blobs or strings)
    const dbImages = localDesigns.map(design => {
      if (typeof design === 'string') return design;
      if (design instanceof Blob) {
        try {
          return URL.createObjectURL(design);
        } catch (e) {
          return '';
        }
      }
      return '';
    }).filter(url => url !== '');

    // Eliminate duplicates cleanly
    return Array.from(new Set([...chatImages, ...dbImages]));
  }, [sessions, localDesigns]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const addMessage = (sessionId: string, msg: Message) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const newMessages = [...s.messages, msg];
        let title = s.title;
        if (s.messages.length === 1 && msg.role === 'user') {
          title = msg.content.length > 30 ? msg.content.substring(0, 30) + '...' : msg.content;
        }
        return { ...s, messages: newMessages, title, updatedAt: Date.now() };
      }
      return s;
    }));
  };

  const handleSubmit = async (e?: React.FormEvent, manualInput?: string) => {
    if (e) e.preventDefault();
    const rawInput = manualInput !== undefined ? manualInput : input;
    if (!rawInput.trim() || !isCodeValid || isLoading || !currentSessionId) return;

    let userMsg = rawInput.trim();
    if (selectedFile) {
      userMsg += `\n\n[File Attached: ${selectedFile.name}]`;
    }
    if (manualInput === undefined) {
      setSelectedFile(null);
      setSelectedFilePreview(null);
      setLastUploadedBase64(null);

      setInput('');
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    addMessage(currentSessionId, { role: 'user', content: userMsg, attachedImagePreview: selectedFilePreview || undefined });
    setIsLoading(true);
    setIsGeneratingMedia(false);

    const sessionIdForRequest = currentSessionId;

    if (onPaywallTrigger) {
      // If parent supplied a paywall trigger check and user fails it, trigger paywall
      // We will let the parent pass this or handle it
    }

    if (!hasBalance) {
      setTimeout(() => {
        addMessage(sessionIdForRequest, { 
          role: 'assistant', 
          content: lang === 'ar' 
            ? ' عذراً، لقد استنفذت كامل الرصيد المتاح لهذا الكود. يرجى تجديد الاشتراك أو شحن الكود لمواصلة توليد التصاميم والردود الذكية.' 
            : ' Sorry, you have exhausted your available credit for this activation code. Please renew your subscription or recharge the code to continue generating smart designs and replies.'
        });
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const activeSession = sessions.find(s => s.id === sessionIdForRequest);
      const sessionMessages = activeSession?.messages || [];
      const currentMessages = [...sessionMessages, { role: 'user' as const, content: userMsg }];
      const _tok = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/chat-designer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_tok}` },
        body: JSON.stringify({ 
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
          activationCode,
          lang,
          useCreativePro,
          baseImage: lastUploadedBase64 || undefined,
          chatId: sessionIdForRequest,
          projectId: useAppStore.getState().activeProjectId || undefined
        })
      });

      if (!res.ok) {
        if (res.status === 402 && onPaywallTrigger) {
          onPaywallTrigger();
          return;
        }
        throw new Error(`Connection error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let hasAssistantReply = false;
      let lastStreamError = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const chunk = JSON.parse(line);
                if (chunk?.type === 'status') {
                  if (chunk.status === 'generating') {
                    setIsGeneratingMedia(true);
                  }
                } else if (chunk?.type === 'result') {
                  const data = chunk.data;
                  if (data.error) {
                    lastStreamError = data.error;
                    const formatted = await formatProfessionalError(new Error(data.error), { chatType: 'image' });
                    addMessage(sessionIdForRequest, { role: 'assistant', content: formatted });
                    hasAssistantReply = true;
                  } else if (data.imageUrl) {
                    try {
                      await saveDesign(data.imageUrl);
                    } catch (e) {
                      console.error("Failed to auto-save generated design to personal library:", e);
                    }
                    addMessage(sessionIdForRequest, { role: 'assistant', content: data.reply, imageUrl: data.imageUrl });
                    hasAssistantReply = true;
                    onDesignGenerated?.();
                    fetchLocalDesigns();
                  } else if (data.videoOperationName) {
                    addMessage(sessionIdForRequest, { 
                      role: 'assistant', 
                      content: data.reply, 
                      videoOperationName: data.videoOperationName 
                    });
                    hasAssistantReply = true;
                    onDesignGenerated?.();
                  } else {
                    if (data.reply) hasAssistantReply = true;
                    addMessage(sessionIdForRequest, { role: 'assistant', content: data.reply });
                  }
                }
              } catch(e) {}
            }
          }
        }
      }

      if (!hasAssistantReply) {
        if (lastStreamError) {
          throw new Error(lastStreamError);
        }
        throw new Error('تعذّر قراءة رد النموذج.');
      }
    } catch (err: any) {
      console.error(err);
      const formatted = await formatProfessionalError(err, { chatType: 'image' });
      addMessage(sessionIdForRequest, { role: 'assistant', content: formatted });
    } finally {
      setIsLoading(false);
      setIsGeneratingMedia(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (window.innerWidth >= 768) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  // Safe Quota Calculations
  const quotaPercentage = useMemo(() => {
    if (!codeStatus || codeStatus.error) return 0;
    const limit = codeStatus.limit || 100;
    const usage = codeStatus.usage || 0;
    const rem = Math.max(0, limit - usage);
    return Math.round((rem / limit) * 100);
  }, [codeStatus]);

  if (!isStorageLoaded) return <div className="min-h-screen bg-black flex items-center justify-center text-white">جاري التحميل...</div>;

  return (
    <div 
      className="w-full flex-1 bg-black/90 md:bg-slate-950/80 border-t md:border border-white/5 md:border-white/10 md:backdrop-blur-2xl rounded-t-[2.5rem] md:rounded-3xl overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-2xl flex flex-col md:flex-row md:h-[750px] md:max-h-[85vh] transition-all duration-300" 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      id="chat-designer-root"
    >
      {/* Code validation overlay if not valid */}
      {!isCodeValid && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 md:p-8 text-center bg-black/60 backdrop-blur-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 pointer-events-none"></div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-md bg-slate-950 border border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col items-center"
          >
            {onGoHome && (
              <button 
                onClick={onGoHome}
                className="absolute top-4 ltr:right-4 rtl:left-4 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors"
                title={lang === 'ar' ? 'الرئيسية' : 'Home'}
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-5 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
            
            <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2">
              {lang === 'ar' ? 'أدخل كود التفعيل' : 'Enter Activation Code'}
            </h3>
            
            <p className="text-slate-400 mb-6 max-w-sm text-xs md:text-sm leading-relaxed font-medium">
              {lang === 'ar' 
                ? 'يجب إدخال كود التفعيل بشكل صحيح لفتح النظام وبدء إنشاء التصاميم الذكية.'
                : 'You must enter a valid activation code to unlock the system and begin generating smart designs.'}
            </p>

            <div className="w-full flex flex-col gap-3">
              <div className="relative">
                <input 
                  type="text" 
                  value={activationCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setActivationCode(val);
                    safeLocalStorage.setItem('koun_activation_code', val);
                  }}
                  maxLength={32}
                  placeholder={lang === 'ar' ? 'أدخل كود التفعيل هنا...' : 'Enter code here...'}
                  className="w-full bg-black/60 border-2 border-purple-500/20 focus:border-purple-500/60 rounded-xl px-4 py-3.5 text-center text-white placeholder-slate-500 focus:outline-none focus:bg-black/80 transition-all font-mono text-base tracking-widest uppercase shadow-inner"
                />
                {isCheckingCode && (
                  <div className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2">
                    <NajeSpinner className="w-5 h-5" />
                  </div>
                )}
              </div>

              <a 
                href="https://wa.me/970567929170" 
                target="_blank" 
                rel="noreferrer" 
                className="w-full px-6 py-3.5 rounded-xl bg-green-600/15 hover:bg-green-600/25 border border-green-500/30 text-green-400 font-medium transition-colors text-center text-sm flex items-center justify-center gap-2"
              >
                {lang === 'ar' ? 'للحصول على كود' : 'To get a code'} <span className="underline font-bold text-white">{lang === 'ar' ? 'اضغط هنا' : 'click here'}</span>
              </a>

              {codeStatus && (
                <div className={`mt-1 px-4 py-3 rounded-xl text-xs font-bold w-full text-center border shadow-lg ${
                  codeStatus.error 
                    ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                    : codeStatus.usage >= codeStatus.limit 
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                      : 'bg-green-500/10 text-green-400 border-green-500/30'
                }`}>
                  {codeStatus.error 
                    ? (lang === 'ar' ? 'الكود غير صحيح' : 'Invalid code')
                    : codeStatus.usage >= codeStatus.limit 
                      ? (lang === 'ar' ? 'استنفدت رصيدك' : 'Code limit reached')
                      : (lang === 'ar' ? 'تم التحقق بنجاح!' : 'Verified successfully!')}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      
      <div className={`flex-1 flex flex-col md:flex-row w-full h-full relative ${!isCodeValid ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
      
          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
                onClick={() => setIsSidebarOpen(false)} 
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <div className={`fixed inset-y-0 ${lang === 'ar' ? 'right-0' : 'left-0'} z-50 w-72 md:w-80 bg-[#0a0a0af8] md:bg-slate-900/95 border-${lang === 'ar' ? 'l' : 'r'} border-white/5 transform transition-transform duration-300 ease-in-out md:relative md:transform-none flex flex-col ${isSidebarOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')} shadow-2xl md:shadow-none`}>
            {/* Sidebar Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-[14px] text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-semibold text-white tracking-wide text-base">Creative AI</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Actions */}
            <div className="p-4 flex flex-col gap-2 border-b border-white/5">
              <button 
                onClick={createNewSession} 
                className="w-full py-3 px-4 rounded-[20px] bg-white/[0.05] hover:bg-white/[0.08] text-white font-medium flex items-center justify-center gap-3 transition-all text-sm border border-white/5"
              >
                <Plus className="w-4 h-4" />
                {lang === 'ar' ? 'محادثة جديدة' : 'New Chat'}
              </button>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button 
                  onClick={() => {
                    setActiveTab('library');
                    setIsSidebarOpen(false);
                  }} 
                  className={`py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors ${activeTab === 'library' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-300 hover:bg-white/5 border border-transparent'}`}
                >
                  <ImageIconSVG className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'مكتبتي' : 'Library'}
                </button>

                <button 
                  onClick={() => {
                    setActiveTab('settings');
                    setIsSidebarOpen(false);
                  }} 
                  className={`py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors ${activeTab === 'settings' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-300 hover:bg-white/5 border border-transparent'}`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'الإعدادات' : 'Settings'}
                </button>
              </div>

              {onGoHome && (
                <button 
                  onClick={() => {
                    onGoHome();
                    setIsSidebarOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white border border-white/5 font-semibold text-xs flex items-center justify-center gap-2 transition-all mt-1"
                >
                  <RotateCcw className="w-4 h-4 text-purple-400" />
                  {lang === 'ar' ? 'الرئيسية' : 'Main Screen'}
                </button>
              )}
            </div>

            {/* Chat History list */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 opacity-60" />
                {lang === 'ar' ? 'المحادثات السابقة' : 'Previous Chats'}
              </h3>
              <div className="flex flex-col gap-1">
                {sessions.map((session, idx) => (
                  <button 
                    key={`${session.id}-${idx}`}
                    onClick={() => {
                      setCurrentSessionId(session.id);
                      setActiveTab('chat');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-start px-3.5 py-3 rounded-xl flex items-center gap-3 transition-all group border ${currentSessionId === session.id && activeTab === 'chat' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20 font-bold' : 'text-slate-300 hover:bg-white/5 border-transparent'}`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${currentSessionId === session.id && activeTab === 'chat' ? 'text-purple-400' : 'opacity-50'}`} />
                    <span className="truncate text-xs flex-1 font-medium">{session.title}</span>
                    <Trash2 
                      className="w-3.5 h-3.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity" 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Quota feedback inside Sidebar bottom */}
            {codeStatus && (
              <div className="p-4 border-t border-white/5 bg-black/20">
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="w-full text-start px-3.5 py-2.5 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <div className="relative shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-purple-400/80 uppercase tracking-wider block">
                      {lang === 'ar' ? 'رصيد التصاميم المتبقي' : 'Quota Remaining'}
                    </span>
                    <span className="text-xs font-bold text-slate-100 block">
                      {lang === 'ar' 
                        ? `${codeStatus.limit - codeStatus.usage} من أصل ${codeStatus.limit}` 
                        : `${codeStatus.limit - codeStatus.usage} left of ${codeStatus.limit}`}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-black/20 to-slate-900/20 relative h-full">
            
            {/* Mobile / Unified Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/5 bg-transparent md:bg-slate-900/80 backdrop-blur-md md:backdrop-blur-none sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-300 hover:text-white bg-white/5 rounded-xl border border-white/5">
                  <Menu className="w-5 h-5" />
                </button>
                
                <h2 className="text-base md:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  {activeTab === 'library' && (
                    <>
                      <ImageIconSVG className="w-4 h-4 text-purple-400" />
                      <span>{lang === 'ar' ? 'مكتبتي الخاصة' : 'My Personal Library'}</span>
                    </>
                  )}
                  {activeTab === 'settings' && (
                    <>
                      <Settings className="w-4 h-4 text-purple-400" />
                      <span>{lang === 'ar' ? 'إعدادات النظام' : 'System Settings'}</span>
                    </>
                  )}
                  {activeTab === 'chat' && (
                    <>
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <span className="truncate max-w-[150px] sm:max-w-[250px]">
                        {currentSession?.title}
                      </span>
                    </>
                  )}
                </h2>
              </div>

              {/* Top Quick Actions */}
              <div className="flex items-center gap-2">
                {onGoHome && (
                  <button 
                    onClick={onGoHome}
                    className="p-2 md:px-4 md:py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
                    title={lang === 'ar' ? 'الرجوع للرئيسية' : 'Back to Home'}
                  >
                    <ChevronDown className="w-4 h-4 md:rotate-90 rtl:md:-rotate-90" />
                    <span className="hidden md:inline">{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
                  </button>
                )}
                {activeTab === 'chat' && currentSessionId && (
                  <button 
                    onClick={() => {
                      if (isDeleteConfirming) {
                        deleteSession(currentSessionId);
                        setIsDeleteConfirming(false);
                      } else {
                        setIsDeleteConfirming(true);
                        setTimeout(() => setIsDeleteConfirming(false), 4000);
                      }
                    }}
                    className={`p-2 rounded-xl border transition-all text-sm flex items-center gap-1.5 ${
                      isDeleteConfirming 
                        ? 'border-red-500 bg-red-600 text-white animate-pulse' 
                        : 'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300'
                    }`}
                    title={
                      isDeleteConfirming 
                        ? (lang === 'ar' ? 'انقر مجدداً للتأكيد النهائي!' : 'Click again to confirm delete!') 
                        : (lang === 'ar' ? 'حذف هذه المحادثة' : 'Delete this chat')
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs font-semibold">
                      {isDeleteConfirming 
                        ? (lang === 'ar' ? 'تأكيد الحذف الكلي؟' : 'Confirm Delete?') 
                        : (lang === 'ar' ? 'حذف المحادثة' : 'Delete Chat')}
                    </span>
                  </button>
                )}

                <button 
                  onClick={() => setActiveTab(activeTab === 'chat' ? 'settings' : 'chat')}
                  className={`p-2 rounded-xl border text-slate-300 hover:text-white transition-all text-sm flex items-center gap-1.5 ${activeTab === 'settings' ? 'bg-purple-500/20 border-purple-500/30' : 'bg-white/5 border-white/10'}`}
                  title={lang === 'ar' ? 'الإعدادات والكود' : 'Settings & Code'}
                >
                  <Settings className="w-4 h-4 animate-hover-spin" />
                  <span className="hidden sm:inline text-xs font-semibold">
                    {lang === 'ar' ? 'الكود' : 'Code'}
                  </span>
                </button>
              </div>
            </div>

            {/* Content Area with smooth motion animations */}
            <div className="flex-1 min-h-0 relative">
              <AnimatePresence mode="wait">
                
                {/* 1. MY LIBRARY VIEW */}
                {activeTab === 'library' && (
                  <motion.div 
                    key="library"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 overflow-y-auto p-4 md:p-8 custom-scrollbar"
                  >
                    <div className="max-w-4xl mx-auto w-full">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
                        <div>
                          <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-3">
                            {lang === 'ar' ? 'مكتبة التصاميم المحلية' : 'Local Design Library'}
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">
                            {lang === 'ar' 
                              ? 'كل التصاميم التي تم ابتكارها وتخزينها محلياً في ذاكرة متصفحك بشكل آمن.' 
                              : 'All designs generated and secured within your browser database.'}
                          </p>
                        </div>
                        <button 
                          onClick={fetchLocalDesigns}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold rounded-lg text-slate-300 hover:text-white transition-colors self-start flex items-center gap-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {lang === 'ar' ? 'تحديث المعرض' : 'Refresh Library'}
                        </button>
                      </div>

                      {mergedImages.length === 0 ? (
                        <div className="text-center text-slate-400 py-16 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIconSVG className="w-8 h-8 opacity-45 text-purple-400" />
                          </div>
                          <p className="text-base font-semibold">{lang === 'ar' ? 'المكتبة فارغة حالياً' : 'Your library is empty'}</p>
                          <p className="text-xs mt-2 text-slate-500 max-w-sm mx-auto leading-relaxed">
                            {lang === 'ar' ? 'ابدأ محادثة واطلب تصميماً أو قم بإنشاء شعار ليتم حفظه وتجميعه تلقائياً هنا.' : 'Start a design discussion or generate a logo to save elements dynamically.'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {mergedImages.map((url, idx) => (
                            <motion.div 
                              key={idx} 
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
                              className="relative group rounded-2xl overflow-hidden border border-white/10 aspect-square shadow-lg bg-black/50"
                            >
                              <img src={url} alt="Design" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                <div className="flex justify-end gap-2">
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    download={`design-${idx}.png`}
                                    className="p-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white transition-colors shadow-lg transform hover:scale-110"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 2. SYSTEM SETTINGS VIEW */}
                {activeTab === 'settings' && (
                  <motion.div 
                    key="settings"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 overflow-y-auto p-4 md:p-8 custom-scrollbar"
                  >
                    <div className="max-w-2xl mx-auto w-full space-y-6">
                      
                      {/* Section Title */}
                      <div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-3">
                          <Settings className="w-6 h-6 text-purple-400" />
                          {lang === 'ar' ? 'إعدادات كود التفعيل والحساب' : 'Activation Code & Settings'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          {lang === 'ar' ? 'إدارة وتعديل كود التفعيل الخاص بك ومتابعة الحصص المتبقية.' : 'Manage active validation credentials and trace user remaining quotas.'}
                        </p>
                      </div>

                      {/* Code status and update card */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-purple-400" />
                          {lang === 'ar' ? 'كود التفعيل الحالي' : 'Active Credentials'}
                        </h3>
                        
                        <div className="flex flex-col md:flex-row gap-3">
                          <input 
                            type="text"
                            value={activationCode}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setActivationCode(val);
                              safeLocalStorage.setItem('koun_activation_code', val);
                            }}
                            maxLength={32}
                            placeholder={lang === 'ar' ? 'أدخل كود التفعيل...' : 'Enter activation code...'}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center md:text-start text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono text-sm tracking-wider uppercase"
                          />
                          {isCheckingCode && (
                            <div className="flex items-center justify-center px-2">
                              <NajeSpinner className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        {codeStatus && (
                          <div className={`p-4 rounded-xl text-xs md:text-sm font-bold border flex items-center gap-3 ${
                            codeStatus.error 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                              : codeStatus.usage >= codeStatus.limit 
                                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                                : 'bg-green-500/10 text-green-400 border-green-500/20'
                          }`}>
                            {codeStatus.error ? (
                              <>
                                <Info className="w-4 h-4 shrink-0" />
                                <span>{lang === 'ar' ? 'كود تفعيل غير صحيح. يرجى مراجعته.' : 'Invalid activation code.'}</span>
                              </>
                            ) : codeStatus.usage >= codeStatus.limit ? (
                              <>
                                <Info className="w-4 h-4 shrink-0" />
                                <span>{lang === 'ar' ? 'عذراً، لقد استنفذت رصيد الكود بالكامل.' : 'Quota reached. No designs left.'}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                <span>
                                  {lang === 'ar' 
                                    ? `الكود صالح ومفعل. الرصيد المتبقي: ${codeStatus.limit - codeStatus.usage} تصاميم.` 
                                    : `Code active. ${codeStatus.limit - codeStatus.usage} designs left.`}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quota Progress visualization */}
                      {codeStatus && !codeStatus.error && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl">
                          {/* Radial progress circle */}
                          <div className="relative w-24 h-24 shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="48" cy="48" r="40" className="stroke-white/5" strokeWidth="8" fill="transparent" />
                              <circle 
                                cx="48" 
                                cy="48" 
                                r="40" 
                                className="stroke-purple-500 transition-all duration-1000" 
                                strokeWidth="8" 
                                fill="transparent" 
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (251.2 * quotaPercentage) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-lg font-extrabold text-white">{quotaPercentage}%</span>
                              <span className="text-[9px] uppercase tracking-widest text-slate-400">{lang === 'ar' ? 'متاح' : 'Available'}</span>
                            </div>
                          </div>

                          <div className="flex-1 space-y-2 text-center md:text-start">
                            <h4 className="text-sm font-bold text-slate-200">
                              {lang === 'ar' ? 'تحليل رصيد الاستخدام المتاح' : 'Quota Metrics'}
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {lang === 'ar' 
                                ? `تم توليد وإنشاء ${codeStatus.usage} تصميم من إجمالي باقة ${codeStatus.limit} تصاميم. يمكنك استهلاك رصيدك المتبقي بأي وقت.` 
                                : `Used ${codeStatus.usage} of your ${codeStatus.limit} allotted designs. Keep working smoothly.`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Help & Support WhatsApp Action */}
                      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-green-400 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4" />
                            {lang === 'ar' ? 'تجديد الاشتراك أو طلب مساعدة؟' : 'Need more quota or assistance?'}
                          </h4>
                          <p className="text-xs text-slate-300">
                            {lang === 'ar' ? 'اضغط هنا للتواصل مباشرة مع الدعم الفني وتجديد الكود.' : 'Click to easily reach out via WhatsApp for active support.'}
                          </p>
                        </div>
                        <a 
                          href="https://wa.me/970567929170" 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg text-center whitespace-nowrap self-start md:self-auto"
                        >
                          {lang === 'ar' ? 'تواصل معنا على واتساب' : 'Contact us on WhatsApp'}
                        </a>
                      </div>

                      {/* Utility / Privacy Control */}
                      <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 md:p-6 space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            {lang === 'ar' ? 'تنظيف الذاكرة والمخلفات' : 'Privacy Control & Database reset'}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {lang === 'ar' 
                              ? 'سيقوم هذا الإجراء بحذف كل سجلات ومحادثات الدردشة المخزنة في متصفحك بشكل كامل ونهائي. لن تتأثر التصاميم المحفوظة بملفاتك.' 
                              : 'This will completely erase your local chat message history in this browser. Your designs are unaffected.'}
                          </p>
                        </div>
                        
                        {!clearConfirm ? (
                          <button 
                            onClick={() => setClearConfirm(true)}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold rounded-lg transition-colors"
                          >
                            {lang === 'ar' ? 'مسح سجل المحادثات بالكامل' : 'Erase All Chat Histories'}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={handleClearAllHistory}
                              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              {lang === 'ar' ? 'نعم، امسح الآن' : 'Yes, Delete Permanent'}
                            </button>
                            <button 
                              onClick={() => setClearConfirm(false)}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                            >
                              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 3. CORE ACTIVE CHAT VIEW */}
                {activeTab === 'chat' && (
                  <motion.div 
                    key="chat"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 flex flex-col h-full"
                  >
                    
                    {/* Chat Scroll Container */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 custom-scrollbar">
                      {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`} style={{ animationDelay: `${idx * 55}ms` }}>
                          <div className={`max-w-[90%] md:max-w-[80%] p-4 sm:p-5 ${
                            msg.role === 'user' 
                              ? `bg-white/[0.08] border border-white/5 text-white shadow-sm rounded-3xl ltr:rounded-tr-lg rtl:rounded-tl-lg font-light` 
                              : `bg-transparent text-slate-200 rounded-2xl font-light`
                          }`}>
                            {msg.role === 'assistant' && (
                              <div className="flex items-center gap-2 mb-2 text-purple-400 opacity-80">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Creative AI</span>
                              </div>
                            )}
                            {msg.attachedImagePreview && (
                              <div className="mb-3 rounded-xl overflow-hidden border border-white/10 shadow-sm max-w-xs">
                                <img src={msg.attachedImagePreview} alt="Attached" className="w-full h-auto max-h-48 object-cover" />
                              </div>
                            )}
                            {msg.content?.startsWith('__NAJE_ERROR_JSON__:') ? (
                              <div className="w-full mt-2">
                                <NajeErrorCard jsonContent={msg.content} />
                              </div>
                            ) : (
                              <div className="prose-custom max-w-none break-words leading-relaxed select-text overflow-hidden [word-break:break-word] whitespace-pre-wrap">
                                <ReactMarkdown>{msg.attachedImagePreview ? msg.content.replace(/\n\n\[File Attached: .*?\]/, '') : msg.content}</ReactMarkdown>
                              </div>
                            )}
                            
                            {msg.imageUrl && (
                              <div 
                                onClick={() => {
                                  setSelectedImage(msg.imageUrl || '');
                                  setEditPromptText('');
                                  setCopiedSuccess(false);
                                }}
                                className="mt-4 relative group rounded-xl overflow-hidden border border-white/10 shadow-xl bg-black/50 aspect-square max-w-sm cursor-pointer"
                              >
                                 <img src={msg.imageUrl} alt="Generated Design" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                                   <div className="p-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-all transform hover:scale-110 shadow-xl">
                                     <Sparkles className="w-5 h-5" />
                                   </div>
                                 </div>
                              </div>
                            )}

                            {msg.videoOperationName && (
                              <InlineVideoMessage 
                                operationName={msg.videoOperationName}
                                initialVideoUrl={msg.videoUrl}
                                lang={lang}
                                onFinished={(url) => {
                                  msg.videoUrl = url;
                                  setSessions(prev => prev.map(s => {
                                    if (s.id === currentSessionId) {
                                      return { ...s, messages: [...s.messages] };
                                    }
                                    return s;
                                  }));
                                }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && (() => {
                        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
                        const isDesign = isGeneratingMedia;
                        
                        return (
                          <div className="flex justify-start">
                            <div className={isDesign ? "mt-2" : "bg-white/5 border border-white/10 rounded-2xl ltr:rounded-tl-none rtl:rounded-tr-none p-4 flex items-center gap-3.5 text-purple-400 backdrop-blur-md shadow-md"}>
                              {isDesign ? (
                                
<InteractiveLoadingPlaceholder lang={lang} userPrompt={lastUserMsg} />
                              ) : (
                                <div className="flex gap-1.5 items-center justify-center shrink-0 px-1 h-4">
                                   <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                   <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                   <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      <div ref={messagesEndRef} className="h-2" />
                    </div>

                    {/* Chat Text Input Section */}
                    <div className="p-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent pt-6 shrink-0">
                      <div className="max-w-4xl mx-auto w-full">
                        <form onSubmit={handleSubmit} className="relative flex flex-col w-full relative">
                          <div className="flex items-center justify-between mb-2 px-1 relative z-20">
                             <div className="relative">
                               <button 
                                  type="button"
                                  onClick={() => setShowModelMenu(!showModelMenu)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all shadow-sm backdrop-blur-md"
                               >
                                  {useCreativePro ? (
                                    <><Zap className="w-3 h-3 text-purple-400" /> Creative Imagen Pro</>
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
                                           <div className={`p-1.5 rounded-lg ${useCreativePro ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-slate-400'}`}>
                                             <Zap className="w-4 h-4" />
                                           </div>
                                           <div className="text-start">
                                             <div className={`text-sm font-bold flex items-center gap-1.5 ${useCreativePro ? 'text-white' : 'text-slate-300'}`}>
                                                Creative Imagen Pro <span className="bg-purple-500 text-white text-[8px] px-1 py-0.5 rounded font-black uppercase">Pro</span>
                                             </div>
                                             <div className="text-[10px] text-slate-500">{lang === 'ar' ? 'جودة فائقة وواقعية سينمائية' : 'Ultra quality & cinematic'}</div>
                                           </div>
                                         </div>
                                         {useCreativePro && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                                      </button>
                                   </motion.div>
                                 )}
                               </AnimatePresence>
                             </div>
                             
                             <span className="text-[10px] text-slate-500 px-2">
                                {useCreativePro ? (lang === 'ar' ? '1.5 نقطة / تصميم' : '1.5 pts / design') : (lang === 'ar' ? '1 نقطة / تصميم' : '1 pt / design')}
                             </span>
                          </div>

                          <div className="relative flex flex-col w-full z-10">
                            
                            {/* FILE INPUT FALLBACKS */}
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleFileSelect} 
                              className="hidden" 
                              accept="*/*"
                            />
                            <input 
                              type="file" 
                              ref={imageOnlyInputRef} 
                              onChange={handleFileSelect} 
                              className="hidden" 
                              accept="image/*"
                            />
                            <input 
                              type="file" 
                              ref={cameraInputFallbackRef} 
                              onChange={handleFileSelect} 
                              className="hidden" 
                              accept="image/*" 
                              capture="environment"
                            />

                            <AnimatePresence>
                              {selectedFile && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10, height: 0 }}
                                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                                  exit={{ opacity: 0, scale: 0.9, height: 0 }}
                                  className="mb-2 ml-2"
                                >
                                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 pr-8 border border-white/20 flex items-center gap-2 inline-flex relative">
                                    {selectedFilePreview ? (
                                      <img src={selectedFilePreview} alt="Preview" className="w-8 h-8 object-cover rounded-md" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-md bg-black/50 flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-purple-400" />
                                      </div>
                                    )}
                                    <div className="flex flex-col">
                                      <span className="text-xs font-medium text-white truncate max-w-[120px]">{selectedFile.name}</span>
                                      <span className="text-[9px] text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedFile(null);
                                        setSelectedFilePreview(null);
                                        setLastUploadedBase64(null);
                                      }}
                                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 bg-black/50 hover:bg-red-500/80 text-white rounded-full transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="relative flex items-end w-full">
                              <button
                                type="button"
                                onClick={() => imageOnlyInputRef.current?.click()}
                                className="absolute ltr:left-2.5 rtl:right-2.5 bottom-2.5 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                              >
                                <Paperclip className="w-5 h-5" />
                              </button>
                            <textarea
                              ref={textareaRef}
                              value={input}
                              onChange={handleInput}
                              onKeyDown={handleKeyDown}
                              disabled={isLoading}
                              rows={1}
                              placeholder={lang === 'ar' ? 'اكتب فكرتك للتصميم...' : 'Describe your design idea...'}
                              className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 focus:border-white/10 focus:bg-white/[0.08] rounded-[24px] py-3.5 ltr:pl-12 ltr:pr-14 rtl:pr-12 rtl:pl-14 text-white placeholder-slate-500 focus:outline-none transition-all disabled:opacity-50 resize-none shadow-sm backdrop-blur-3xl text-sm md:text-base custom-scrollbar max-h-[120px] font-light"
                              style={{ minHeight: '50px' }}
                            />
                            <button
  type="submit"
  disabled={(!input.trim() && !selectedFile) || isLoading}
  className="absolute ltr:right-2.5 rtl:left-2.5 bottom-1.5 p-2.5 bg-white text-black hover:bg-slate-200 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0 shadow-md active:scale-95 group"
>
  <ArrowUp className="w-5 h-5 transition-transform duration-300" strokeWidth={3} />
</button>
                          </div>
                          </div>
                        </form>
                        <div className="text-center mt-2">
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                            {lang === 'ar' ? 'الذكاء الاصطناعي يمكن أن يرتكب أخطاء فنية.' : 'AI models may produce technical inaccuracies.'}
                          </span>
                        </div>
                      </div>
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>
        

      {/* Lightbox / Image Theater Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10 select-none overflow-y-auto"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="relative w-full max-w-5xl bg-slate-900/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-50 p-2.5 bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white rounded-full border border-white/10 transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Side: Image Display */}
              <div className="flex-1 bg-black/40 flex items-center justify-center p-4 min-h-[300px] md:min-h-0 relative group">
                <img 
                  src={selectedImage} 
                  alt="High Resolution Design" 
                  className="max-w-full max-h-[50vh] md:max-h-[75vh] object-contain rounded-2xl shadow-2xl select-text"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Right Side: Operations Panel */}
              <div className="w-full md:w-[360px] border-t md:border-t-0 md:border-l border-white/5 p-6 md:p-8 flex flex-col justify-between bg-slate-950/40 backdrop-blur-md overflow-y-auto">
                <div className="space-y-6">
                  {/* Title & Metadata */}
                  <div className="space-y-2 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'خيارات التصميم الذكي' : 'Design Masterpiece'}</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white leading-snug font-sans">
                      {lang === 'ar' ? 'تحرير وتنزيل تصميمك' : 'Edit & Export Design'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'ar' ? 'اختر الإجراء المناسب لتصميمك المولد بالذكاء الاصطناعي.' : 'Perform action on your high-quality AI-crafted asset.'}
                    </p>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <a 
                      href={selectedImage} 
                      download="creative-ai-design.png"
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white transition-all text-center group cursor-pointer"
                    >
                      <div className="p-2.5 bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-400 rounded-xl transition-all">
                        <Download className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold">{lang === 'ar' ? 'تنزيل الصورة' : 'Download'}</span>
                    </a>

                    <button 
                      onClick={() => {
                        handleCopyLink(selectedImage || '');
                      }}
                      className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white transition-all text-center group"
                    >
                      <div className="p-2.5 bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all">
                        {copiedSuccess ? <CheckCircle className="w-5 h-5 text-emerald-400 animate-pulse" /> : <Share2 className="w-5 h-5" />}
                      </div>
                      <span className="text-xs font-bold">
                        {copiedSuccess ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'مشاركة الرابط' : 'Copy Link')}
                      </span>
                    </button>
                  </div>

                  {/* Smart Edit Section */}
                  <div className="space-y-3 pt-4 border-t border-white/5 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <label className="text-xs font-bold text-slate-300 block">
                      {lang === 'ar' ? 'طلب تعديل ذكي على الصورة' : 'Request Smart Modification'}
                    </label>
                    <textarea 
                      value={editPromptText}
                      onChange={(e) => setEditPromptText(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: غير الخلفية للون أسود، أو أضف لمعان ذهبي...' : 'E.g., change background to dark gold, add glow...'}
                      className="w-full bg-black/40 border border-white/10 hover:border-purple-500/30 focus:border-purple-500 rounded-xl p-3.5 text-white placeholder-slate-500 focus:outline-none transition-all resize-none text-xs leading-relaxed"
                      rows={3}
                    />
                    <button 
                      onClick={() => {
                        if (!editPromptText.trim() || isLoading) return;
                        setSelectedImage(null);
                        setActiveTab('chat');
                        handleSubmit(undefined, editPromptText);
                      }}
                      disabled={!editPromptText.trim() || isLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-purple-600/50 disabled:to-indigo-600/50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/10 disabled:pointer-events-none"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {lang === 'ar' ? 'إرسال طلب التعديل للذكاء الاصطناعي' : 'Send Modification Request'}
                    </button>
                  </div>
                </div>

                <div className="pt-6 text-center text-[10px] text-slate-500 font-medium font-mono">
                  Creative AI
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
          </div>
</div>
  );
}
