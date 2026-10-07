import NajeSelect from '../components/NajeSelect';
import NajeLogo from '../components/NajeLogo';
import NajeThinking from '../components/NajeThinking';
import NajeSpinner from '../components/NajeSpinner';
import { useState, useEffect, useRef, Suspense } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import TermsConsentModal from '../components/TermsConsentModal';
import najeEmptyGallery from '../assets/icons/naje-empty-gallery.svg';
import najeEmptyVideo from '../assets/icons/naje-empty-video.svg';
import najeEmptyChat from '../assets/icons/naje-empty-chat.svg';
import najeToolkit from '../assets/icons/naje-toolkit.svg';
import najeWalletCoins from '../assets/icons/naje-wallet-coins.svg';

function NajePageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] w-full p-6 bg-naje-canvas">
      <NajeThinking size={56} />
    </div>
  );
}
import { auth, db } from '../firebase';
import { downloadBase64File } from '../utils/fileDownloader';
import { getDoc as getLocalDoc } from '../lib/idb';
import { 
  LogOut, User, Folder, Star, Info, Menu, PanelRight, X, Plus, Sparkles,
  ChevronDown, ChevronRight, ChevronLeft, MessageSquare, Image as ImageIcon, Film, Layout, Mic2,
  FileText, Shield, Download, ExternalLink, Calendar, Compass, Layers, AlertCircle,
  Pencil, Trash2, Bot, Code2, BookOpen, Clapperboard, Palette, MoreVertical, Pin, PinOff
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '../toastStore';
import NotificationDropdown from '../components/NotificationDropdown';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import BalanceTopDropdown from '../components/BalanceTopDropdown';
import { useI18n, translate } from '../i18n';
import { rememberMedia, useOnline } from '../lib/offline';
import { OmniverseCommandBar } from '../components/OmniverseCommandBar';
import { useVisualViewportShell } from '../hooks/useVisualViewportShell';
import { getChatTypeConfig } from '../lib/chatTypeConfig';
import { NajeAdIcon, NajeIdentIcon, NajeCvIcon, CreativeStudioIcon } from '../components/icons/SuiteIcons';

function tr(key: string, params?: Record<string, string | number>) {
  return translate(key, params, useAppStore.getState().language || 'ar');
}

function useResolvedMediaSrc(mediaUrl: string | undefined, defaultMime = 'image/jpeg') {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    if (!mediaUrl) {
      setSrc(null);
      setLoading(false);
      setError(true);
      return;
    }

    if (mediaUrl.startsWith('data:') || mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://') || mediaUrl.startsWith('/')) {
      setSrc(mediaUrl);
      setLoading(false);
      return;
    }

    if (mediaUrl.startsWith('local:')) {
      const localId = mediaUrl.split('local:')[1];
      getLocalDoc(localId)
        .then(doc => {
          if (!active) return;
          if (doc) {
            setSrc(doc.startsWith('data:') || doc.startsWith('http') ? doc : `data:${defaultMime};base64,${doc}`);
            setLoading(false);
          } else {
            // Check server cache for cross-device access (e.g. mobile)
            fetch(`/api/media-blob/${encodeURIComponent(localId)}`).then(res => {
              if (!active) return;
              if (res.ok) {
                setSrc(`/api/media-blob/${encodeURIComponent(localId)}`);
                setLoading(false);
              } else {
                setError(true);
                setLoading(false);
              }
            }).catch(() => {
              if (active) {
                setError(true);
                setLoading(false);
              }
            });
          }
        })
        .catch(() => {
          if (!active) return;
          fetch(`/api/media-blob/${encodeURIComponent(localId)}`).then(res => {
            if (!active) return;
            if (res.ok) {
              setSrc(`/api/media-blob/${encodeURIComponent(localId)}`);
              setLoading(false);
            } else {
              setError(true);
              setLoading(false);
            }
          }).catch(() => {
            if (active) {
              setError(true);
              setLoading(false);
            }
          });
        });
      return;
    }

    setSrc(`data:${defaultMime};base64,${mediaUrl}`);
    setLoading(false);

    return () => {
      active = false;
    };
  }, [mediaUrl, defaultMime]);

  return { src, loading, error };
}

async function handleDownloadMedia(mediaUrl: string, filename: string, defaultMime: string, prompt?: string) {
  if (!mediaUrl) return;
  try {
    let realUrl = mediaUrl;
    if (realUrl.startsWith('local:')) {
      const localId = realUrl.split('local:')[1];
      const localDoc = await getLocalDoc(localId);
      if (localDoc) {
        realUrl = (localDoc.startsWith('data:') || localDoc.startsWith('http'))
          ? localDoc
          : `data:${defaultMime};base64,${localDoc}`;
      } else {
        // Attempt fallback to server blob for cross-device downloads
        realUrl = `/api/media-blob/${encodeURIComponent(localId)}`;
      }
    } else if (!realUrl.startsWith('data:') && !realUrl.startsWith('http') && !realUrl.startsWith('/')) {
      realUrl = `data:${defaultMime};base64,${realUrl}`;
    }
    downloadBase64File(realUrl, filename, defaultMime, { prompt });
  } catch (err) {
    console.error('Download resolution error:', err);
    toast.error(tr('shell.mediaDownloadError'));
  }
}

function getStudioInfo(studio?: string) {
  if (studio === 'naje_ident') return { name: 'نايس موشن', link: '/naje-ident', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  if (studio === 'naje_ad') return { name: 'إعلانات Naje Ad', link: '/naje-ad', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
  if (studio === 'creativelyAI' || studio === 'creative_pro' || studio === 'chat_designer') return { name: 'استوديو الإبداع', link: '/creative-studio', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
  if (studio?.startsWith('chat_')) return { name: 'استوديو الدردشة', link: null, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
  return { name: 'استوديوهات نايس', link: null, color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
}

function GalleryImageThumb({ m, idx, onClose, onZoom }: { m: any; idx: number; onClose: () => void; onZoom?: (url: string) => void }) {
  const { t } = useI18n();
  const { src, loading, error } = useResolvedMediaSrc(m.mediaUrl, 'image/jpeg');
  const [downloading, setDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const studioInfo = getStudioInfo(m.studio);

  const onDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    await handleDownloadMedia(m.mediaUrl, `NajeAI_Image_${idx + 1}.jpg`, 'image/jpeg', m.content);
    setDownloading(false);
  };

  const targetLink = m.chatId ? `/chat/${m.chatId}` : studioInfo.link;

  return (
    <div className="group bg-white dark:bg-[#11141c] border border-purple-200/80 dark:border-white/10 dark:hover:border-purple-500/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-purple-500/10 transition-all flex flex-col">
      <div 
        onClick={() => src && onZoom?.(src)} 
        className="aspect-square bg-gray-50 dark:bg-gray-950 relative overflow-hidden flex items-center justify-center cursor-zoom-in"
      >
        <span className={cn("absolute top-2.5 start-2.5 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-xs", studioInfo.color)}>
          {studioInfo.name}
        </span>
        {loading ? (
          <div className="text-gray-400 text-xs animate-pulse p-2 text-center">{t('common.loading')}</div>
        ) : error || imgError || !src ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs text-center p-3 bg-gray-100 dark:bg-gray-900/50">
            <AlertCircle className="w-6 h-6 mb-1 text-amber-500/80" />
            <span>{t('nav.previewNotAvailable')}</span>
          </div>
        ) : (
          <img 
            src={src} 
            alt="Generated Design" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <p className="text-xs text-gray-800 dark:text-gray-300 line-clamp-2 leading-relaxed">{m.content || m.prompt || t('shell.aiImageFallback')}</p>
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800/60 pt-3">
          {targetLink ? (
            <Link 
              to={targetLink} 
              onClick={onClose}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold flex items-center gap-1 transition"
            >
              <span>{m.chatId ? t('shell.viewChat') : studioInfo.name}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          ) : (
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{studioInfo.name}</span>
          )}
          <button 
            onClick={onDownload}
            disabled={downloading}
            className="text-[11px] text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50 transition"
          >
            {downloading ? <NajeSpinner className="w-3 h-3" /> : <Download className="w-3 h-3 text-indigo-500" />}
            <span>{t('common.download')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function GalleryVideoThumb({ m, idx, onClose }: { m: any; idx: number; onClose: () => void }) {
  const { t } = useI18n();
  const { src, loading, error } = useResolvedMediaSrc(m.mediaUrl, 'video/mp4');
  const [downloading, setDownloading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const studioInfo = getStudioInfo(m.studio);

  const onDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    await handleDownloadMedia(m.mediaUrl, `NajeAI_Video_${idx + 1}.mp4`, 'video/mp4', m.content);
    setDownloading(false);
  };

  const targetLink = m.chatId ? `/chat/${m.chatId}` : studioInfo.link;

  return (
    <div className="group bg-white dark:bg-[#11141c] border border-purple-200/80 dark:border-white/10 dark:hover:border-pink-500/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-pink-500/10 transition-all flex flex-col">
      <div className="aspect-video bg-gray-50 dark:bg-gray-950 relative overflow-hidden flex items-center justify-center">
        <span className={cn("absolute top-2.5 start-2.5 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-xs pointer-events-none", studioInfo.color)}>
          {studioInfo.name}
        </span>
        {loading ? (
          <div className="text-gray-400 text-xs animate-pulse p-2 text-center">{t('common.loading')}</div>
        ) : error || videoError || !src ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs text-center p-3 bg-gray-100 dark:bg-gray-900/50">
            <AlertCircle className="w-6 h-6 mb-1 text-amber-500/80" />
            <span>{t('nav.previewNotAvailable')}</span>
          </div>
        ) : (
          <video 
            src={src} 
            controls
            playsInline
            className="w-full h-full object-cover"
            onError={() => setVideoError(true)}
          />
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <p className="text-xs text-gray-800 dark:text-gray-300 line-clamp-2 leading-relaxed">{m.content || m.prompt || t('shell.aiVideoFallback')}</p>
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800/60 pt-3">
          {targetLink ? (
            <Link 
              to={targetLink} 
              onClick={onClose}
              className="text-[11px] text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-bold flex items-center gap-1 transition"
            >
              <span>{m.chatId ? t('shell.viewChat') : studioInfo.name}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          ) : (
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{studioInfo.name}</span>
          )}
          <button 
            onClick={onDownload}
            disabled={downloading}
            className="text-[11px] text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-white flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50 transition"
          >
            {downloading ? <NajeSpinner className="w-3 h-3" /> : <Download className="w-3 h-3 text-pink-500" />}
            <span>{t('common.download')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { 
    user, sidebarOpen, setSidebarOpen, userGalleriesOpen, setUserGalleriesOpen, 
    activeProjectId, setActiveProjectId, newChatModalOpen, setNewChatModalOpen,
    systemStatus, maintenanceDismissed, setMaintenanceDismissed
  } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRtl } = useI18n();
  const online = useOnline();
  const shellRef = useRef<HTMLDivElement>(null);
  useVisualViewportShell(shellRef);

  const [projects, setProjects] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [allMediaMessages, setAllMediaMessages] = useState<any[]>([]);
  const [selectedProjectForNewChat, setSelectedProjectForNewChat] = useState<string>('none');
  const [creatingChatType, setCreatingChatType] = useState<string | null>(null);

  // Rename & Delete Chat States
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [renameChatTitle, setRenameChatTitle] = useState<string>('');
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);
  const [isRenamingChat, setIsRenamingChat] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  // 3-dots chat menu state
  const [chatMenuOpenId, setChatMenuOpenId] = useState<string | null>(null);

  // Assign/Move Chat to Project State
  const [assignProjectChat, setAssignProjectChat] = useState<any | null>(null);
  const [assignProjectSelectedId, setAssignProjectSelectedId] = useState<string>('none');
  const [isAssigningProject, setIsAssigningProject] = useState(false);

  // Click outside to close 3-dots chat menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (chatMenuOpenId) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-chat-menu]')) {
          setChatMenuOpenId(null);
        }
      }
    };
    if (chatMenuOpenId) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [chatMenuOpenId]);

  const handleTogglePinChat = async (chat: any) => {
    try {
      const willPin = !chat.isPinned;
      await updateDoc(doc(db, 'chats', chat.id), { isPinned: willPin });
      setChatMenuOpenId(null);
      toast.success(
        willPin 
          ? (t('shell.chatPinnedSuccess') || 'تم تثبيت المحادثة في الأعلى')
          : (t('shell.chatUnpinnedSuccess') || 'تم إلغاء تثبيت المحادثة')
      );
    } catch (err) {
      console.error("Error toggling pin status:", err);
      toast.error(t('shell.pinError') || 'فشل تحديث حالة التثبيت');
    }
  };

  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignProjectChat) return;
    try {
      setIsAssigningProject(true);
      const newProjectId = assignProjectSelectedId === 'none' ? '' : assignProjectSelectedId;
      await updateDoc(doc(db, 'chats', assignProjectChat.id), { projectId: newProjectId });
      toast.success(
        newProjectId 
          ? (t('shell.chatAssignedSuccess') || 'تم نقل الدردشة إلى المشروع بنجاح')
          : (t('shell.chatRemovedFromProject') || 'تمت إزالة الدردشة من المشروع')
      );
      setAssignProjectChat(null);
    } catch (err) {
      console.error("Error assigning chat to project:", err);
      toast.error(t('shell.assignProjectError') || 'حدث خطأ أثناء نقل المحادثة');
    } finally {
      setIsAssigningProject(false);
    }
  };

  const handleRenameChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameChatId || !renameChatTitle.trim()) return;
    try {
      setIsRenamingChat(true);
      await updateDoc(doc(db, 'chats', renameChatId), { title: renameChatTitle.trim() });
      setRenameChatId(null);
      setRenameChatTitle('');
    } catch (err) {
      console.error("Error renaming chat:", err);
      toast.error(tr("shell.renameError"));
    } finally {
      setIsRenamingChat(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!deleteChatId) return;
    try {
      setIsDeletingChat(true);
      await deleteDoc(doc(db, 'chats', deleteChatId));
      if (location.pathname === `/chat/${deleteChatId}`) {
        navigate('/');
      }
      setDeleteChatId(null);
    } catch (err) {
      console.error("Error deleting chat:", err);
      toast.error(tr("shell.deleteChatError"));
    } finally {
      setIsDeletingChat(false);
    }
  };

  // Real-time listeners
  useEffect(() => {
    if (!user) return;

    let unsubFallbackChats: (() => void) | null = null;

    // Subscribe to projects
    const qProjects = query(collection(db, 'projects'), where('ownerId', '==', user.uid));
    const unsubProjects = onSnapshot(qProjects, (snap) => {
      const projs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      setProjects(projs);
    }, (err) => console.error("Projects listen failed:", err));

    // Subscribe to chats with composite-index fallback and dual ownerId/userId merge
    let unsubChatsOwner: (() => void) | null = null;
    let unsubChatsUser: (() => void) | null = null;
    let ownerChats: any[] = [];
    let userChats: any[] = [];

    const syncUnifiedChats = () => {
      const map = new Map<string, any>();
      for (const c of [...ownerChats, ...userChats]) {
        if (c.id) map.set(c.id, c);
      }
      const allChats = Array.from(map.values()).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      setChats(allChats);
    };

    const qChats = query(collection(db, 'chats'), where('ownerId', '==', user.uid));
    unsubChatsOwner = onSnapshot(qChats, (snap) => {
      ownerChats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncUnifiedChats();
    }, (err) => console.warn("Chats owner listen notice:", err?.message));

    const qChatsUser = query(collection(db, 'chats'), where('userId', '==', user.uid));
    unsubChatsUser = onSnapshot(qChatsUser, (snap) => {
      userChats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncUnifiedChats();
    }, (err) => console.warn("Chats user listen notice:", err?.message));

    return () => {
      unsubProjects();
      if (unsubChatsOwner) unsubChatsOwner();
      if (unsubChatsUser) unsubChatsUser();
    };
  }, [user]);

  // Real-time media messages and generated_media across ALL studios for the library galleries
  useEffect(() => {
    if (!user) {
      setAllMediaMessages([]);
      return;
    }

    let unsubGenMedia: (() => void) | null = null;
    let unsubMsgs: (() => void) | null = null;
    let unsubDesigns: (() => void) | null = null;
    let genMediaDocs: any[] = [];
    let msgDocs: any[] = [];
    let designDocs: any[] = [];

    const mergeAndSetMedia = () => {
      const combined = [...genMediaDocs, ...designDocs, ...msgDocs];
      const seenUrls = new Set<string>();
      const deduped: any[] = [];
      for (const item of combined) {
        const url = item.mediaUrl || item.url;
        if (!url) continue;
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          deduped.push({
            ...item,
            mediaUrl: url
          });
        }
      }
      deduped.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAllMediaMessages(deduped);
      rememberMedia(deduped.map((m: any) => m.mediaType === 'video' ? null : m.mediaUrl));
    };

    // 1. Listen to generated_media collection across all studios
    const qGen = query(collection(db, 'generated_media'), where('ownerId', '==', user.uid));
    unsubGenMedia = onSnapshot(qGen, (snap) => {
      genMediaDocs = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          mediaType: data.type || data.mediaType || 'image',
          content: data.prompt || data.title || '',
          createdAt: data.createdAt || 0
        };
      });
      mergeAndSetMedia();
    }, (err) => console.warn("generated_media listen notice:", err));

    // 2. Listen to creatively_designs collection
    const qDesigns = query(collection(db, 'creatively_designs'), where('ownerId', '==', user.uid));
    unsubDesigns = onSnapshot(qDesigns, (snap) => {
      designDocs = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          mediaType: data.type === 'video' ? 'video' : 'image',
          mediaUrl: data.url,
          content: data.prompt || data.conceptTitle || '',
          studio: 'creativelyAI',
          createdAt: data.createdAt ? new Date(data.createdAt).getTime() : 0
        };
      });
      mergeAndSetMedia();
    }, (err) => console.warn("creatively_designs listen notice:", err));

    // 3. Listen to messages with media across all chats
    const qMsg = query(collection(db, 'messages'), where('ownerId', '==', user.uid));
    unsubMsgs = onSnapshot(qMsg, (snap) => {
      msgDocs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((m: any) => m.mediaUrl);
      mergeAndSetMedia();
    }, (err) => console.warn("Messages listen notice:", err));

    return () => {
      if (unsubGenMedia) unsubGenMedia();
      if (unsubDesigns) unsubDesigns();
      if (unsubMsgs) unsubMsgs();
    };
  }, [user]);

  // Body Scroll Lock implementation for better overlay experiences without layout shift
  useEffect(() => {
    const isLocked = sidebarOpen || newChatModalOpen || userGalleriesOpen !== 'none';
    if (isLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, newChatModalOpen, userGalleriesOpen]);

  const handleCreateNewChat = async (type: 'text' | 'image' | 'video' | 'ui' | 'voice' | 'design' | 'najeDeveloper' | 'najeSource' | 'agent') => {
    setCreatingChatType(type);
    const projId = activeProjectId || (selectedProjectForNewChat !== 'none' ? selectedProjectForNewChat : '');

    // 1. Generate the ID locally — instant, no network
    const newChatRef = doc(collection(db, 'chats'));
    const chatId = newChatRef.id;

    const chatData = {
      ownerId: user?.uid,
      userId: user?.uid,
      projectId: projId,
      type,
      title: type === 'ui' ? tr('shell.chatTitleUi')
           : type === 'design' ? tr('shell.chatTitleDesign')
           : type === 'text' ? tr('shell.chatTitleText')
           : type === 'image' ? tr('shell.chatTitleImage')
           : type === 'video' ? tr('shell.chatTitleVideo')
           : type === 'najeDeveloper' ? tr('shell.chatTitleDeveloper')
           : type === 'najeSource' ? tr('shell.chatTitleSource')
           : type === 'agent' ? tr('shell.chatTitleAgent')
           : tr('shell.chatTitleVoice'),
      createdAt: Date.now()
    };

    // 2. Close modal and navigate with slight micro-transition to make the visual load effect crisp
    setTimeout(() => {
      setNewChatModalOpen(false);
      setSidebarOpen(false);
      setCreatingChatType(null);
      if (type === 'najeDeveloper') {
        navigate(`/naje-developer?chatId=${chatId}`);
      } else if (type === 'najeSource') {
        navigate(`/naje-source?chatId=${chatId}`);
      } else if (type === 'agent') {
        navigate(`/naje-agent-core?chatId=${chatId}`);
      } else {
        navigate(`/chat/${chatId}`);
      }
    }, 120);

    // 3. Write in the background; the chat page already has the ID
    setDoc(newChatRef, chatData).catch(err => {
      console.error("Error creating chat:", err);
      toast.error(tr("shell.spaceCreateError"));
    });
  };

  const isVideoItem = (m: any) => {
    const t = String(m.mediaType || m.type || '').toLowerCase();
    if (t === 'video' || t === 'video_ad') return true;
    const url = String(m.mediaUrl || m.url || '').toLowerCase();
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('/video-download') || url.includes('type=video');
  };

  const isAudioItem = (m: any) => {
    const t = String(m.mediaType || m.type || '').toLowerCase();
    return t === 'audio' || t === 'voice';
  };

  const imagesList = allMediaMessages.filter(m => !isVideoItem(m) && !isAudioItem(m) && Boolean(m.mediaUrl || m.url));
  const videosList = allMediaMessages.filter(m => isVideoItem(m) && Boolean(m.mediaUrl || m.url));

  // Deduplicate chats to eliminate any potential duplication or triplication
  const uniqueChatsMap = new Map();
  chats.forEach(c => {
    if (c.id && !uniqueChatsMap.has(c.id)) {
      uniqueChatsMap.set(c.id, c);
    }
  });
  const uniqueChats = Array.from(uniqueChatsMap.values());

  // Filter chats by active project if configured
  const filteredChats = activeProjectId 
    ? uniqueChats.filter((c: any) => c.projectId === activeProjectId)
    : uniqueChats;

  // Sort: Pinned chats first, then newest createdAt
  const sortedChats = [...filteredChats].sort((a: any, b: any) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  const recentChats = sortedChats.slice(0, 15);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-transparent text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar Header with Collapse Button */}
      <div className="flex items-center justify-between p-4 pb-2 border-b border-slate-200/80 dark:border-slate-900/60">
        <Link to="/" onClick={() => { setActiveProjectId(null); setUserGalleriesOpen('none'); }} className="flex items-center gap-2 group px-1">
          <NajeLogo size="sm" className="group-hover:scale-105 transition-all" />
          <span className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{t('nav.brandTitle')}</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-xl text-gray-800 dark:text-purple-100 dark:hover:text-white hover:text-gray-900 hover:bg-white dark:hover:bg-gray-900 transition flex items-center justify-center cursor-pointer active:scale-95"
          title={t('nav.collapseSidebar')}
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        
        {/* Group 1: Account Card */}
        <div>
          <Link 
            to="/settings" 
            onClick={() => setSidebarOpen(false)}
            className="w-full h-11 md:h-12 px-3 bg-white dark:bg-[#11141c] hover:bg-purple-50/30 dark:hover:bg-[#151924] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-extrabold text-[10px] text-white border border-black/10 dark:border-white/10">
                  {user?.displayName ? user.displayName.substring(0, 1).toUpperCase() : 'N'}
                </div>
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#11141c] ${online ? 'bg-green-500' : 'bg-amber-400'}`} title={online ? undefined : t('surface.offline.badge')}></span>
              </div>
              <div className="flex flex-col min-w-0 text-start leading-tight">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate leading-tight">
                  {user?.displayName || t('shell.creatorFallback')}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5 leading-tight">
                  <span>{user?.email}</span>
                  <span>•</span>
                  <span className="text-purple-600 dark:text-purple-400 font-extrabold font-sans bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-900/40 leading-none inline-flex items-center gap-1">
                    <img src={najeWalletCoins} alt="credit" className="w-3 h-3 object-contain shrink-0" />
                    <span>{Number((user?.balance || 0).toFixed(2))} {t('common.pointsShort')}</span>
                  </span>
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition flex-shrink-0 rtl:rotate-180" />
          </Link>
        </div>

        {/* Group 2: New Chat Button */}
        <div>
          <button 
            onClick={() => setNewChatModalOpen(true)}
            className="w-full h-11 md:h-10 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>{t('nav.newChatSpace')}</span>
          </button>
        </div>

        {/* Group 3: Projects */}
        <div className="space-y-1">
          <Link 
            to="/" 
            onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('none'); setActiveProjectId(null); }}
            className={cn(
              "w-full h-11 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all border border-transparent",
              location.pathname === '/' && activeProjectId === null && userGalleriesOpen === 'none'
                ? "bg-white dark:bg-purple-950/45 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold" 
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Folder className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{t('nav.home')}</span>
            </div>
            {projects.length > 0 && (
              <span className="text-[10px] bg-[#f2f0f5] dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-sans font-bold px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-500/20">
                {projects.length}
              </span>
            )}
          </Link>

          <Link 
            to="/creative-studio" 
            onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('none'); }}
            className={cn(
              "w-full h-11 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all border border-transparent",
              location.pathname.includes('creative')
                ? "bg-white dark:bg-purple-950/45 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold" 
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <CreativeStudioIcon className="w-8 h-8 shrink-0" size={32} />
              <span>{t('nav.creativeStudio')}</span>
            </div>
          </Link>

          <Link 
            to="/naje-ad" 
            onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('none'); }}
            className={cn(
              "w-full h-11 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all border border-transparent",
              location.pathname.includes('naje-ad')
                ? "bg-white dark:bg-purple-950/45 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold" 
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <NajeAdIcon className="w-8 h-8 shrink-0" size={32} />
              <span>{t('nav.najeAd')}</span>
            </div>
          </Link>

          <Link
            to="/naje-ident"
            onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('none'); }}
            className={cn(
              "w-full h-11 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all border border-transparent",
              location.pathname.includes('naje-ident')
                ? "bg-white dark:bg-purple-950/45 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <NajeIdentIcon className="w-8 h-8 shrink-0" size={32} />
              <span>{t('nav.najeMotion')}</span>
            </div>
          </Link>

          <Link
            to="/naje-cv"
            onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('none'); }}
            className={cn(
              "w-full h-11 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all border border-transparent",
              location.pathname.includes('naje-cv')
                ? "bg-white dark:bg-purple-950/45 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <NajeCvIcon className="w-8 h-8 shrink-0" size={32} />
              <span>{t('nav.najeCv')}</span>
            </div>
          </Link>
        </div>

        {/* Group 4: Library */}
        <div className="space-y-1">
          <h3 className="text-[10px] font-extrabold text-slate-850 dark:text-purple-300 uppercase px-3 tracking-wider text-start border-b border-slate-100 dark:border-slate-900/40 pb-1 mb-1">{t('nav.library')}</h3>
          <button 
            onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('images'); }}
            className={cn(
              "w-full h-11 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all border border-transparent text-start cursor-pointer",
              userGalleriesOpen === 'images'
                ? "bg-white dark:bg-purple-950/45 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold" 
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{t('nav.images')}</span>
            </div>
            {imagesList.length > 0 && (
              <span className="text-[10px] bg-[#f2f0f5] dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-sans border border-slate-200 dark:border-slate-800">{imagesList.length}</span>
            )}
          </button>

          <button 
            onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('videos'); }}
            className={cn(
              "w-full h-11 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all border border-transparent text-start cursor-pointer",
              userGalleriesOpen === 'videos'
                ? "bg-white dark:bg-purple-950/45 text-purple-955 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold" 
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Film className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
              <span>{t('nav.videos')}</span>
            </div>
            {videosList.length > 0 && (
              <span className="text-[10px] bg-[#f2f0f5] dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-sans border border-slate-200 dark:border-slate-800">{videosList.length}</span>
            )}
          </button>
        </div>

        {/* Group 5: Favorites */}
        <div>
          <Link 
            to="/favorites" 
            onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('none'); }}
            className={cn(
              "w-full h-11 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all border border-transparent",
              location.pathname === '/favorites' 
                ? "bg-white dark:bg-purple-950/45 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold" 
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{t('nav.favorites')}</span>
            </div>
          </Link>
        </div>

        {/* Group 6: Recent Chats */}
        <div className="space-y-1">
          <h3 className="text-[10px] font-extrabold text-slate-850 dark:text-purple-300 uppercase px-3 tracking-wider text-start border-b border-slate-100 dark:border-slate-900/40 pb-1 mb-1">{t('nav.recentChats')}</h3>
          
          {activeProjectId && (
            <div className="mx-1 my-1.5 p-2 bg-purple-500/5 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-1.5 min-w-0">
                <Folder className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 truncate">
                  {t('nav.filteredProject', { name: projects.find(p => p.id === activeProjectId)?.name || t('shell.projectFallback') })}
                </span>
              </div>
              <button 
                onClick={() => setActiveProjectId(null)}
                className="p-1 text-purple-600 dark:text-purple-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition cursor-pointer"
                title={t('nav.clearFilter')}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {recentChats.length === 0 ? (
            <div className="text-center py-6 px-3 flex flex-col items-center justify-center">
              <img src={najeEmptyChat} alt="" className="w-20 h-16 object-contain opacity-70 mb-1" />
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('nav.noRecentChats')}</div>
            </div>
          ) : (
            <div className="space-y-1">
              {recentChats.map(c => {
                const projName = c.projectId && projects.find(p => p.id === c.projectId)?.name;
                const targetUrl = c.type === 'najeDeveloper'
                  ? `/naje-developer?chatId=${c.id}`
                  : c.type === 'najeSource'
                  ? `/naje-source?chatId=${c.id}`
                  : c.type === 'agent'
                  ? `/naje-agent-core?chatId=${c.id}`
                  : `/chat/${c.id}`;
                const isActive = location.pathname === `/chat/${c.id}` ||
                  (c.type === 'najeDeveloper' && location.pathname.includes('naje-developer') && location.search.includes(c.id)) ||
                  (c.type === 'najeSource' && location.pathname.includes('naje-source') && location.search.includes(c.id)) ||
                  (c.type === 'agent' && (location.pathname.includes('naje-agent') || location.pathname.includes('agent')) && location.search.includes(c.id));
                return (
                  <div 
                    key={c.id} 
                    className={cn(
                      "relative group w-full",
                      chatMenuOpenId === c.id ? "z-50" : "z-0"
                    )} 
                    data-chat-menu
                  >
                    <Link 
                      to={targetUrl}
                      onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('none'); }}
                      className={cn(
                        "w-full h-11 md:h-10 flex items-center justify-between rtl:pl-9 rtl:pr-3 ltr:pr-9 ltr:pl-3 rounded-xl text-xs font-bold transition-all border border-transparent truncate",
                        isActive 
                          ? "bg-white dark:bg-purple-950/45 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold" 
                          : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
                      )}
                    >
                      {(() => {
                        const meta = getChatTypeConfig(c.type);
                        const IconComponent = meta.icon;
                        return (
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div 
                              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs"
                              style={{
                                backgroundColor: meta.bgTint,
                                color: meta.color,
                                borderColor: meta.borderTint
                              }}
                            >
                              <IconComponent className="w-3.5 h-3.5" style={{ color: meta.color }} />
                            </div>
                            <div className="flex flex-col min-w-0 text-start">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {c.isPinned && (
                                  <span title={t('shell.pinnedChat') || 'مثبتة'}>
                                    <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                                  </span>
                                )}
                                <span className="truncate leading-tight text-slate-900 dark:text-white font-extrabold">{c.title}</span>
                              </div>
                              {projName && (
                                <div className="flex items-center gap-1 mt-0.5 min-w-0">
                                  <span className="text-[9px] text-purple-750 dark:text-purple-300 font-extrabold truncate opacity-90">
                                    {projName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </Link>

                    {/* 3 Vertical Dots Menu Button */}
                    <div className="absolute rtl:left-1.5 ltr:right-1.5 top-1/2 -translate-y-1/2 z-30">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setChatMenuOpenId(chatMenuOpenId === c.id ? null : c.id);
                        }}
                        className={cn(
                          "p-1.5 rounded-lg transition cursor-pointer",
                          chatMenuOpenId === c.id
                            ? "bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 opacity-100 shadow-sm"
                            : chatMenuOpenId !== null
                            ? "opacity-0 pointer-events-none"
                            : "text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 opacity-80 hover:opacity-100"
                        )}
                        title={t('common.options') || 'خيارات الدردشة'}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Backdrop for click outside */}
                      {chatMenuOpenId === c.id && (
                        <div 
                          className="fixed inset-0 z-40 bg-transparent" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setChatMenuOpenId(null);
                          }} 
                        />
                      )}

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {chatMenuOpenId === c.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.12 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute rtl:left-0 ltr:right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#11141c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 text-start"
                          >
                            {/* 1. تثبيت الدردشة / إلغاء التثبيت */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleTogglePinChat(c);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition text-start cursor-pointer"
                            >
                              <Pin className={cn("w-3.5 h-3.5 shrink-0", c.isPinned ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
                              <span>{c.isPinned ? t('shell.unpinChat') : t('shell.pinChat')}</span>
                            </button>

                            {/* 2. تعديل أسم الدردشة */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setRenameChatId(c.id);
                                setRenameChatTitle(c.title);
                                setChatMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition text-start cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{t('shell.renameChat')}</span>
                            </button>

                            {/* 3. إضافة الدردشة إلى مشروع / نقل الدردشة من المشروع إلى مشروع آخر */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setAssignProjectChat(c);
                                setAssignProjectSelectedId(c.projectId || 'none');
                                setChatMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition text-start cursor-pointer"
                            >
                              <Folder className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              <span className="truncate">
                                {c.projectId 
                                  ? t('shell.moveChatProject') 
                                  : t('shell.addChatToProject')}
                              </span>
                            </button>

                            <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                            {/* 4. حذف الدردشة */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeleteChatId(c.id);
                                setChatMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition text-start cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              <span>{t('shell.deleteChat')}</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Group 7: Settings (Unified Settings Access) */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0c0e14] mt-auto flex flex-col gap-1.5 shadow-md">
        <Link 
          to="/store"
          onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('none'); }}
          className={cn(
            "w-full h-10 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-extrabold transition cursor-pointer border border-transparent",
            location.pathname === '/store' || location.pathname === '/stor'
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/40 shadow-md shadow-amber-500/10 font-black"
              : "text-amber-700 dark:text-amber-400/90 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          )}
        >
          <div className="flex items-center gap-2.5">
            <img src={najeWalletCoins} alt="store" className="w-4 h-4 object-contain shrink-0" />
            <span>{t('nav.store')}</span>
          </div>
          <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/25">
            {t('nav.storeBadge')}
          </span>
        </Link>
        {user?.isAdmin && (
          <Link 
            to="/naje-admin-ai" 
            onClick={() => setSidebarOpen(false)}
            className="w-full h-10 md:h-9 flex items-center gap-2.5 px-3 rounded-xl text-xs font-black text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-900 dark:hover:text-white transition border border-purple-300 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 shadow-sm"
          >
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>{t('nav.adminPanel')}</span>
          </Link>
        )}
        <Link 
          to="/settings" 
          onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('none'); }}
          className={cn(
            "w-full h-10 md:h-9 flex items-center gap-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer border border-transparent",
            location.pathname === '/settings'
              ? "bg-white dark:bg-purple-950/45 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold"
              : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
          )}
        >
          <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>{t('nav.settings')}</span>
        </Link>
      </div>

    </div>
  );

  return (
    <div ref={shellRef} className="h-screen h-[100dvh] bg-naje-canvas text-naje-ink flex overflow-hidden">
      <TermsConsentModal />
      <OmniverseCommandBar onCreateChat={handleCreateNewChat} />
      {/* 1. Sidebar - Desktop (Right-hand persistent in RTL) */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 288 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className="naje-glass-card-lg rounded-none border-t-0 border-b-0 border-r-0 border-l border-slate-300 dark:border-white/10 hidden md:flex flex-col flex-shrink-0 relative z-20 shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden"
      >
        <div className="w-72 h-full flex flex-col flex-shrink-0">
          {sidebarContent}
        </div>
      </motion.aside>

      {/* 2. Slideout Drawer Sidebar - Mobile (Right-hand slide-out in RTL) */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-start">
            {/* Dark Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-white dark:bg-black"
            />
            {/* Drawer Body */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-80 h-full naje-glass-card-lg rounded-none border-t-0 border-b-0 border-l-0 border-r border-slate-300 dark:border-slate-900 shadow-2xl flex flex-col z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Main Stage Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Email Verification Banner */}
        <EmailVerificationBanner />

        {/* System Maintenance Alert Banner */}
        {systemStatus?.isMaintenance && !maintenanceDismissed && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs font-bold flex items-center justify-between gap-3 z-40 shrink-0">
            <div className="flex items-center gap-2">
              <img src={najeToolkit} alt="" className="w-4 h-4 object-contain" />
              <span>{systemStatus.intro || t('shell.maintenanceFallback')}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {user?.isAdmin ? (
                <span className="bg-amber-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-extrabold shadow-sm">
                  {t('shell.adminBypass')}
                </span>
              ) : (
                <span className="bg-rose-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-extrabold shadow-sm">
                  {t('shell.systemPaused')}
                </span>
              )}
              <button 
                onClick={() => setMaintenanceDismissed(true)}
                className="p-1 hover:bg-amber-500/20 rounded-lg text-amber-900 dark:text-amber-200 transition cursor-pointer"
                title={t('shell.closeAlert')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {/* Gallery Overlays for Images & Videos */}
        <AnimatePresence>
          {userGalleriesOpen !== 'none' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="absolute inset-0 bg-naje-canvas z-40 overflow-y-auto p-6 flex flex-col font-sans"
            >
              <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-900 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    {userGalleriesOpen === 'images' ? (
                      <>
                        <ImageIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('nav.galleryOverlayImagesTitle')}</h2>
                          <p className="text-xs text-gray-800 dark:text-gray-400 mt-1">{t('nav.galleryOverlayImagesDesc')}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Film className="w-7 h-7 text-pink-600 dark:text-pink-400" />
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('nav.galleryOverlayVideosTitle')}</h2>
                          <p className="text-xs text-gray-800 dark:text-gray-400 mt-1">{t('nav.galleryOverlayVideosDesc')}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <button 
                    onClick={() => setUserGalleriesOpen('none')}
                    className="flex items-center gap-1.5 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                  >
                    <X className="w-4 h-4" />
                    <span>{t('nav.closeGallery')}</span>
                  </button>
                </div>

                {/* Grid */}
                <div className="flex-1">
                  {userGalleriesOpen === 'images' ? (
                    imagesList.length === 0 ? (
                      <div className="text-center py-16 bg-white dark:bg-gray-950 rounded-3xl border border-purple-200 dark:border-gray-900 shadow-md flex flex-col items-center justify-center p-6">
                        <img src={najeEmptyGallery} alt={t('shell.noImagesYet')} className="w-44 h-36 mx-auto mb-3 object-contain" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('shell.noImagesYet')}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('shell.noImagesHint')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {imagesList.map((m, idx) => (
                          <GalleryImageThumb 
                            key={m.id || idx} 
                            m={m} 
                            idx={idx} 
                            onClose={() => setUserGalleriesOpen('none')} 
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    videosList.length === 0 ? (
                      <div className="text-center py-16 bg-white dark:bg-gray-950 rounded-3xl border border-purple-200 dark:border-gray-900 shadow-md flex flex-col items-center justify-center p-6">
                        <img src={najeEmptyVideo} alt={t('shell.noVideosYet')} className="w-44 h-36 mx-auto mb-3 object-contain" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('shell.noVideosYet')}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('shell.noVideosHint')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {videosList.map((m, idx) => (
                          <GalleryVideoThumb 
                            key={m.id || idx} 
                            m={m} 
                            idx={idx} 
                            onClose={() => setUserGalleriesOpen('none')} 
                          />
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Top Header / Dedicated Studio Headers */}
        {!location.pathname.includes('/chat') && 
         !location.pathname.includes('naje-developer') && 
         !location.pathname.includes('naje-source') && 
         !location.pathname.includes('naje-agent') && (() => {
          const p = location.pathname;
          let studio = null;
          if (p.includes('naje-ad')) {
            studio = {
              title: t('studio.adStudio'),
              icon: NajeAdIcon,
              imageMark: true,
              iconBg: 'bg-gradient-to-br from-[#d4a574]/25 to-[#d4a574]/10 border-[#d4a574]/40 text-[#e8b86d] shadow-[0_0_15px_rgba(212,165,116,0.25)]',
              headerBg: 'bg-[#090a0e] border-b border-[#d4a574]/25 shadow-[0_4px_30px_rgba(0,0,0,0.7)] backdrop-blur-xl',
              btnBorder: 'text-[#e8b86d] border-[#d4a574]/25',
              actionClass: 'bg-[#d4a574] hover:bg-[#e8b86d] text-[#1a140c] shadow-[0_8px_18px_-8px_rgba(212,165,116,0.55)]',
              isCreative: true,
            };
          } else if (p.includes('naje-ident')) {
            studio = {
              title: t('shell.projects.motionStudio'),
              icon: NajeIdentIcon,
              imageMark: true,
              iconBg: 'bg-gradient-to-br from-[#8ec8ff]/25 to-[#8ec8ff]/10 border-[#8ec8ff]/40 text-[#8ec8ff] shadow-[0_0_15px_rgba(142,200,255,0.25)]',
              headerBg: 'bg-[#06080e] border-b border-[#8ec8ff]/25 shadow-[0_4px_30px_rgba(0,0,0,0.7)] backdrop-blur-xl',
              btnBorder: 'text-[#8ec8ff] border-[#8ec8ff]/25',
              actionClass: 'bg-[#8ec8ff] hover:bg-[#c5e4ff] text-[#071018] shadow-[0_8px_18px_-8px_rgba(142,200,255,0.55)]',
              isCreative: true,
            };
          } else if (p.includes('naje-cv')) {
            studio = {
              title: t('shell.projects.cvTitle'),
              icon: NajeCvIcon,
              imageMark: true,
              iconBg: 'bg-gradient-to-br from-[#c4a35a]/25 to-[#c4a35a]/10 border-[#c4a35a]/40 text-[#e8c36a] shadow-[0_0_15px_rgba(196,163,90,0.25)]',
              headerBg: 'bg-[#090e18] border-b border-[#c4a35a]/25 shadow-[0_4px_30px_rgba(0,0,0,0.7)] backdrop-blur-xl',
              btnBorder: 'text-[#e8c36a] border-[#c4a35a]/25',
              actionClass: 'bg-[#c4a35a] hover:bg-[#e8c36a] text-[#1a140c] shadow-[0_8px_18px_-8px_rgba(196,163,90,0.55)]',
              isCreative: true,
            };
          } else if (p.includes('/creative') || p.includes('creative-studio')) {
            studio = {
              title: t('shell.projects.creativeTitle'),
              icon: CreativeStudioIcon,
              imageMark: true,
              iconBg: 'bg-gradient-to-br from-amber-500/25 to-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
              headerBg: 'bg-[#030303] border-b border-amber-500/25 shadow-[0_4px_30px_rgba(0,0,0,0.7)] backdrop-blur-xl',
              btnBorder: 'text-amber-400 border-amber-500/25',
              actionClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/15',
              isCreative: true,
            };
          } else if (p.includes('naje-prompt')) {
            studio = {
              title: t('nav.promptStudio') || 'استوديو هندسة الأوامر',
              icon: Sparkles,
              iconBg: 'bg-gradient-to-br from-purple-500/25 to-purple-500/10 border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]',
              headerBg: 'bg-[#0b0c16] border-b border-purple-500/25 shadow-[0_4px_30px_rgba(0,0,0,0.7)] backdrop-blur-xl',
              btnBorder: 'text-purple-400 border-purple-500/25',
              actionClass: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/15',
              isCreative: false,
            };
          }

          const StudioIcon = studio?.icon;

          return (
            <header className={`flex items-center justify-between gap-3 sm:gap-6 px-2.5 sm:px-5 py-1.5 sm:py-2 flex-shrink-0 z-30 h-13 sm:h-14 ${studio ? studio.headerBg : 'naje-glass-card-lg rounded-none border-t-0 border-r-0 border-l-0'}`}>
              {studio && StudioIcon ? (
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
                  <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition flex items-center justify-center cursor-pointer shrink-0 hover:text-white hover:bg-white/10 border ${studio.btnBorder}`}
                    title={sidebarOpen ? t('nav.collapseSidebar') : t('nav.expandSidebar')}
                  >
                    <PanelRight className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    {('imageMark' in studio && studio.imageMark) ? (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shrink-0">
                        <StudioIcon className="w-full h-full" size={36} />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${studio.iconBg}`}>
                        <StudioIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                      </div>
                    )}
                    <span className="font-black text-xs sm:text-base text-white whitespace-nowrap tracking-tight">
                      {studio.title}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
                  <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition flex items-center justify-center cursor-pointer shrink-0 text-gray-800 dark:text-purple-100 dark:hover:text-white hover:text-gray-900 hover:bg-white dark:hover:bg-gray-900"
                    title={sidebarOpen ? t('nav.collapseSidebar') : t('nav.expandSidebar')}
                  >
                    <PanelRight className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </button>
                  <Link to="/" onClick={() => { setActiveProjectId(null); setUserGalleriesOpen('none'); }} className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
                    <span className="sm:hidden shrink-0"><NajeLogo size="sm" className="group-hover:scale-105 transition-all" /></span>
                    <span className="hidden sm:inline-flex shrink-0"><NajeLogo size="md" className="group-hover:scale-105 transition-all" /></span>
                    <span className="font-black text-xs sm:text-sm whitespace-nowrap shrink-0 transition-colors text-gray-900 dark:text-white group-hover:text-indigo-600 dark:text-indigo-400">{t('nav.brandTitle')}</span>
                  </Link>
                </div>
              )}

              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                <NotificationDropdown />
                <BalanceTopDropdown isCreativeMode={studio ? studio.isCreative : false} />

                <button 
                  onClick={() => setNewChatModalOpen(true)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition cursor-pointer flex items-center justify-center shadow-md active:scale-[0.96] shrink-0 ${studio ? studio.actionClass : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/15'}`}
                  title={t('nav.newChatSpace')}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </header>
          );
        })()}
        
        {/* Actual Routed Page Outlet with Instant NajeThinking Loading Fallback */}
        <div className="flex-1 relative z-0 flex flex-col overflow-hidden">
          <Suspense fallback={<NajePageLoader />}>
            <AnimatePresence>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0.98 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.98 }}
                transition={{ duration: 0.08 }}
                className="flex-1 flex flex-col min-h-0 w-full overflow-hidden"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>

      {/* ========================================================
         GLOBAL NEW CHAT SELECTION MODAL: Three Options (Text/Image/Video)
         ======================================================== */}
      <AnimatePresence>
        {newChatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm" onClick={() => setNewChatModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative naje-glass-card-lg border-t sm:border shadow-2xl flex flex-col gap-5 text-start z-10 w-full sm:max-w-[560px] max-h-[92vh] overflow-y-auto p-5 sm:p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-900">
                <button 
                  onClick={() => setNewChatModalOpen(false)}
                  className="p-1.5 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-start">
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white">{t('chat.newChatModalTitle')}</h2>
                  <p className="text-[10px] text-gray-800 dark:text-gray-400 mt-1">{t('chat.newChatModalDesc')}</p>
                </div>
              </div>

              {/* Selection Cards (Responsive: 1 column vertical stack on mobile, 2x2 grid on desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. دردشة نصية */}
                <button 
                  onClick={() => handleCreateNewChat('text')}
                  disabled={creatingChatType !== null}
                  className={`w-full sm:h-[140px] min-h-[72px] h-auto px-4 py-3 sm:p-5 bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-purple-500/30 hover:bg-purple-600/[0.02] rounded-xl flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-3 sm:gap-4 transition cursor-pointer group active:scale-[0.98] ${creatingChatType === 'text' ? 'ring-2 ring-purple-500 bg-purple-500/10 opacity-90' : ''}`}
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 min-w-0 sm:w-full">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {creatingChatType === 'text' ? <NajeSpinner className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col text-start sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:text-purple-400 transition-colors">
                        {creatingChatType === 'text' ? t('chat.preparingSpace') : t('chat.textChatTitle')}
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">{t('chat.textChatDesc')}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 group-hover:text-gray-500 dark:text-gray-400 transition sm:hidden flex-shrink-0" />
                </button>

                {/* 2. دردشة صور */}
                <button 
                  onClick={() => handleCreateNewChat('image')}
                  disabled={creatingChatType !== null}
                  className={`w-full sm:h-[140px] min-h-[72px] h-auto px-4 py-3 sm:p-5 bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-pink-500/30 hover:bg-pink-600/[0.02] rounded-xl flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-3 sm:gap-4 transition cursor-pointer group active:scale-[0.98] ${creatingChatType === 'image' ? 'ring-2 ring-pink-500 bg-pink-500/10 opacity-90' : ''}`}
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 min-w-0 sm:w-full">
                    <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {creatingChatType === 'image' ? <NajeSpinner className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col text-start sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-pink-600 dark:text-pink-400 transition-colors">
                        {creatingChatType === 'image' ? t('chat.preparingSpace') : t('shell.imageChatTitle')}
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">{t('shell.imageChatDesc')}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 group-hover:text-gray-500 dark:text-gray-400 transition sm:hidden flex-shrink-0" />
                </button>

                {/* 3. دردشة فيديوهات */}
                <button 
                  onClick={() => handleCreateNewChat('video')}
                  disabled={creatingChatType !== null}
                  className={`w-full sm:h-[140px] min-h-[72px] h-auto px-4 py-3 sm:p-5 bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-sky-500/30 hover:bg-sky-600/[0.02] rounded-xl flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-3 sm:gap-4 transition cursor-pointer group active:scale-[0.98] ${creatingChatType === 'video' ? 'ring-2 ring-sky-500 bg-sky-500/10 opacity-90' : ''}`}
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 min-w-0 sm:w-full">
                    <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {creatingChatType === 'video' ? <NajeSpinner className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col text-start sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-sky-400 transition-colors">
                        {creatingChatType === 'video' ? t('shell.preparingStudio') : t('shell.videoChatTitle')}
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">{t('shell.videoChatDesc')}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 group-hover:text-gray-500 dark:text-gray-400 transition sm:hidden flex-shrink-0" />
                </button>

                {/* 4. تصميم واجهات (UI) */}
                <button 
                  onClick={() => handleCreateNewChat('ui')}
                  disabled={creatingChatType !== null}
                  className={`w-full sm:h-[140px] min-h-[72px] h-auto px-4 py-3 sm:p-5 bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-amber-500/30 hover:bg-amber-600/[0.02] rounded-xl flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-3 sm:gap-4 transition cursor-pointer group active:scale-[0.98] ${creatingChatType === 'ui' ? 'ring-2 ring-amber-500 bg-amber-500/10 opacity-90' : ''}`}
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 min-w-0 sm:w-full">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {creatingChatType === 'ui' ? <NajeSpinner className="w-5 h-5" /> : <Layout className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col text-start sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">
                        {creatingChatType === 'ui' ? t('chat.preparingSpace') : t('shell.uiChatTitle')}
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">{t('shell.uiChatDesc')}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 group-hover:text-gray-500 dark:text-gray-400 transition sm:hidden flex-shrink-0" />
                </button>

                {/* 5. استوديو الصوت والبودكاست (Voice Studio) */}
                <button 
                  onClick={() => handleCreateNewChat('voice')}
                  disabled={creatingChatType !== null}
                  className={`w-full sm:h-[140px] min-h-[72px] h-auto px-4 py-3 sm:p-5 bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/30 hover:bg-emerald-600/[0.02] rounded-xl flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-3 sm:gap-4 transition cursor-pointer group active:scale-[0.98] ${creatingChatType === 'voice' ? 'ring-2 ring-emerald-500 bg-emerald-500/10 opacity-90' : ''}`}
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 min-w-0 sm:w-full">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {creatingChatType === 'voice' ? <NajeSpinner className="w-5 h-5" /> : <Mic2 className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col text-start sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                        {creatingChatType === 'voice' ? t('shell.preparingStudio') : t('shell.voiceStudioTitle')}
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">{t('shell.voiceStudioDesc')}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 group-hover:text-gray-500 dark:text-gray-400 transition sm:hidden flex-shrink-0" />
                </button>

                {/* 6. ناجي المطور */}
                <button 
                  onClick={() => handleCreateNewChat('najeDeveloper')}
                  disabled={creatingChatType !== null}
                  className={`w-full sm:h-[140px] min-h-[72px] h-auto px-4 py-3 sm:p-5 bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-sky-500/30 hover:bg-sky-600/[0.02] rounded-xl flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-3 sm:gap-4 transition cursor-pointer group active:scale-[0.98] ${creatingChatType === 'najeDeveloper' ? 'ring-2 ring-sky-500 bg-sky-500/10 opacity-90' : ''}`}
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 min-w-0 sm:w-full">
                    <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {creatingChatType === 'najeDeveloper' ? <NajeSpinner className="w-5 h-5" /> : <Code2 className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col text-start sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-sky-500 transition-colors">
                        {creatingChatType === 'najeDeveloper' ? t('shell.preparingDeveloper') : t('nav.najeDeveloper')}
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">{t('shell.developerDesc')}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 group-hover:text-gray-500 dark:text-gray-400 transition sm:hidden flex-shrink-0" />
                </button>

                {/* 7. ناجي من مصادرك */}
                <button 
                  onClick={() => handleCreateNewChat('najeSource')}
                  disabled={creatingChatType !== null}
                  className={`w-full sm:h-[140px] min-h-[72px] h-auto px-4 py-3 sm:p-5 bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/30 hover:bg-emerald-600/[0.02] rounded-xl flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-3 sm:gap-4 transition cursor-pointer group sm:col-span-2 active:scale-[0.98] ${creatingChatType === 'najeSource' ? 'ring-2 ring-emerald-500 bg-emerald-500/10 opacity-90' : ''}`}
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 min-w-0 sm:w-full">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {creatingChatType === 'najeSource' ? <NajeSpinner className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col text-start sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                        {creatingChatType === 'najeSource' ? t('shell.preparingSource') : t('nav.najeSource')}
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">{t('shell.sourceDesc')}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 group-hover:text-gray-500 dark:text-gray-400 transition sm:hidden flex-shrink-0" />
                </button>

                {/* 8. وكيل ناجي */}
                <button 
                  onClick={() => handleCreateNewChat('agent')}
                  disabled={creatingChatType !== null}
                  className={`w-full sm:h-[140px] min-h-[72px] h-auto px-4 py-3 sm:p-5 bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border border-purple-500/30 dark:border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-600/[0.04] rounded-xl flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-3 sm:gap-4 transition cursor-pointer group sm:col-span-2 active:scale-[0.98] ${creatingChatType === 'agent' ? 'ring-2 ring-purple-500 bg-purple-500/10 opacity-90' : ''}`}
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 min-w-0 sm:w-full">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {creatingChatType === 'agent' ? <NajeSpinner className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col text-start sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">
                        {creatingChatType === 'agent' ? t('shell.preparingAgent') : t('shell.agentTitle')}
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">{t('shell.agentDesc')}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 group-hover:text-gray-500 dark:text-gray-400 transition sm:hidden flex-shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => { setNewChatModalOpen(false); navigate('/naje-prompt'); }}
                  className="w-full sm:h-[140px] min-h-[72px] h-auto px-4 py-3 sm:p-5 bg-gray-50 dark:bg-gray-900 border border-violet-500/20 hover:border-violet-500/40 rounded-xl flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-3 sm:gap-4 transition cursor-pointer group"
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 min-w-0 sm:w-full">
                    <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-start sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{t('nav.najePrompt')}</span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">{t('shell.promptDesc')}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 sm:hidden flex-shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => { setNewChatModalOpen(false); navigate('/naje-ident'); }}
                  className="w-full sm:h-[140px] min-h-[72px] h-auto px-4 py-3 sm:p-5 bg-gray-50 dark:bg-gray-900 border border-amber-500/20 hover:border-amber-500/40 rounded-xl flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-3 sm:gap-4 transition cursor-pointer group"
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 min-w-0 sm:w-full">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <NajeIdentIcon className="w-10 h-10" size={40} />
                    </div>
                    <div className="flex flex-col text-start sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{t('nav.najeMotion')}</span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">{t('shell.motionDesc')}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 sm:hidden flex-shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => { setNewChatModalOpen(false); navigate('/naje-cv'); }}
                  className="w-full sm:h-[140px] min-h-[72px] h-auto px-4 py-3 sm:p-5 bg-gray-50 dark:bg-gray-900 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-3 sm:gap-4 transition cursor-pointer group sm:col-span-2"
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 min-w-0 sm:w-full">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <NajeCvIcon className="w-10 h-10" size={40} />
                    </div>
                    <div className="flex flex-col text-start sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{t('nav.najeCv')}</span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">{t('shell.cvDesc')}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 sm:hidden flex-shrink-0" />
                </button>
              </div>

              {/* Project association dropdown if not currently viewing/scoping a project */}
              {!activeProjectId ? (
                <div className="border-t border-gray-200 dark:border-gray-900/60 pt-4 mt-1 flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-800 dark:text-gray-400 font-bold">{t('shell.addToProject')}</label>
                  <NajeSelect
                    value={selectedProjectForNewChat}
                    onChange={(val) => setSelectedProjectForNewChat(val)}
                    options={[
                      { value: 'none', label: t('shell.noProject') },
                      ...projects.map(p => ({ value: p.id, label: p.name }))
                    ]}
                    className="w-full text-gray-900 dark:text-gray-300"
                  />
                </div>
              ) : (
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/5 border border-indigo-400 dark:border-indigo-500/10 rounded-xl p-2.5 text-center flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{t('shell.attachProject', { name: projects.find(p => p.id === activeProjectId)?.name || '' })}</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
         CUSTOM RENAME CHAT MODAL
         ======================================================== */}
      <AnimatePresence>
        {renameChatId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm" onClick={() => setRenameChatId(null)} />
            <motion.form 
              onSubmit={handleRenameChat}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-[#0d0f12] border border-gray-200 dark:border-gray-900 rounded-2xl p-6 w-full max-w-[400px] shadow-2xl flex flex-col gap-4 text-start z-10"
            >
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">{t('chat.renameChat')}</h3>
                <p className="text-[10px] text-gray-800 dark:text-gray-400 mt-1">{t('shell.renameChatDesc')}</p>
              </div>
              <input 
                type="text"
                required
                value={renameChatTitle}
                onChange={e => setRenameChatTitle(e.target.value)}
                placeholder={t('shell.renamePlaceholder')}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-900 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-200 outline-none focus:border-indigo-500 transition"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setRenameChatId(null)}
                  className="px-4 py-2 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-300 rounded-xl text-xs font-bold transition cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={isRenamingChat}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  {isRenamingChat && <NajeSpinner className="w-3.5 h-3.5" />}
                  <span>{t('shell.saveEdit')}</span>
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
         CUSTOM DELETE CHAT CONFIRMATION MODAL
         ======================================================== */}
      <AnimatePresence>
        {deleteChatId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm" onClick={() => setDeleteChatId(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-[#0d0f12] border border-gray-200 dark:border-gray-900 rounded-2xl p-6 w-full max-w-[400px] shadow-2xl flex flex-col gap-4 text-start z-10"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-1">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">{t('shell.deleteChatTitle')}</h3>
                <p className="text-xs text-gray-800 dark:text-gray-400 mt-2 leading-relaxed">
                  {t('shell.deleteChatDesc')}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setDeleteChatId(null)}
                  className="w-1/2 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-300 rounded-xl text-xs font-bold transition cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                >
                  {t('shell.goBackClose')}
                </button>
                <button 
                  type="button"
                  onClick={handleDeleteChat}
                  disabled={isDeletingChat}
                  className="w-1/2 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  {isDeletingChat && <NajeSpinner className="w-3.5 h-3.5" />}
                  <span>{t('shell.confirmDeleteSpace')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
         ASSIGN / MOVE CHAT TO PROJECT MODAL
         ======================================================== */}
      <AnimatePresence>
        {assignProjectChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm" onClick={() => setAssignProjectChat(null)} />
            <motion.form 
              onSubmit={handleAssignProject}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-[#0d0f12] border border-gray-200 dark:border-gray-900 rounded-2xl p-6 w-full max-w-[420px] shadow-2xl flex flex-col gap-4 text-start z-10"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    {assignProjectChat.projectId 
                      ? t('shell.moveChatProjectTitle')
                      : t('shell.addChatProjectTitle')}
                  </h3>
                  <p className="text-xs text-gray-800 dark:text-gray-400 mt-1 leading-relaxed">
                    {t('shell.assignProjectModalDesc')}
                  </p>
                </div>
              </div>

              {/* Chat details card */}
              <div className="p-3 bg-gray-50 dark:bg-gray-950/80 border border-gray-200 dark:border-gray-900 rounded-xl text-xs">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold block mb-1">{t('chat.title') || 'اسم المحادثة'}</span>
                <span className="font-extrabold text-gray-900 dark:text-white truncate block">{assignProjectChat.title}</span>
                {assignProjectChat.projectId && (
                  <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-gray-800 text-[11px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5" />
                    <span>{projects.find(p => p.id === assignProjectChat.projectId)?.name || t('shell.projectFallback')}</span>
                  </div>
                )}
              </div>

              {/* Project selector dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300">
                  {t('shell.selectDestinationProject')}
                </label>
                <NajeSelect
                  value={assignProjectSelectedId}
                  onChange={(val) => setAssignProjectSelectedId(val)}
                  options={[
                    { value: 'none', label: t('shell.noProjectOption') },
                    ...projects.map(p => ({ value: p.id, label: p.name }))
                  ]}
                  className="w-full text-gray-900 dark:text-gray-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setAssignProjectChat(null)}
                  className="px-4 py-2 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-300 rounded-xl text-xs font-bold transition cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={isAssigningProject}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
                >
                  {isAssigningProject && <NajeSpinner className="w-3.5 h-3.5" />}
                  <span>{t('common.save') || 'حفظ التغييرات'}</span>
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
