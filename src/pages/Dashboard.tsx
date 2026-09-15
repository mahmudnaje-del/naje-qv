import NajeSelect from '../components/NajeSelect';
import NajeLogo from '../components/NajeLogo';
import NajeThinking from '../components/NajeThinking';
import NajeSpinner from '../components/NajeSpinner';
import { useState, useEffect, Suspense } from 'react';
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
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] w-full p-6 bg-[#FAF9FC] dark:bg-[#0d0f12]">
      <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-3xl bg-white/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800/80 backdrop-blur-xl shadow-2xl shadow-purple-500/5 max-w-sm w-full text-center">
        <NajeThinking size={56} />
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <span className="text-sm font-extrabold text-gray-900 dark:text-white">جاري تحضير الصفحة...</span>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">استوديو ناجي يفكّر ويبني لك الواجهة</span>
        </div>
      </div>
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
  Pencil, Trash2, Bot, Coins
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '../toastStore';
import NotificationDropdown from '../components/NotificationDropdown';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import BalanceTopDropdown from '../components/BalanceTopDropdown';

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

    if (mediaUrl.startsWith('data:') || mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
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
            setError(true);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) {
            setError(true);
            setLoading(false);
          }
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
        toast.error('تعذر استخراج الملف من التخزين المحلي على هذا الجهاز.');
        return;
      }
    } else if (!realUrl.startsWith('data:') && !realUrl.startsWith('http')) {
      realUrl = `data:${defaultMime};base64,${realUrl}`;
    }
    downloadBase64File(realUrl, filename, defaultMime, { prompt });
  } catch (err) {
    console.error('Download resolution error:', err);
    toast.error('حدث خطأ أثناء تحميل الوسائط.');
  }
}

function GalleryImageThumb({ m, idx, onClose }: { m: any; idx: number; onClose: () => void }) {
  const { src, loading, error } = useResolvedMediaSrc(m.mediaUrl, 'image/jpeg');
  const [downloading, setDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const onDownload = async () => {
    setDownloading(true);
    await handleDownloadMedia(m.mediaUrl, `NajeAI_Image_${idx + 1}.jpg`, 'image/jpeg', m.content);
    setDownloading(false);
  };

  return (
    <div className="group bg-white dark:bg-[#11141c] border border-purple-200/80 dark:hover:border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-purple-300 transition-all flex flex-col">
      <div className="aspect-square bg-gray-50 dark:bg-gray-950 relative overflow-hidden flex items-center justify-center">
        {loading ? (
          <div className="text-gray-400 text-xs animate-pulse p-2 text-center">جاري التحميل...</div>
        ) : error || imgError || !src ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs text-center p-3 bg-gray-100 dark:bg-gray-900/50">
            <AlertCircle className="w-6 h-6 mb-1 text-amber-500/80" />
            <span>المعاينة غير متاحة على هذا الجهاز</span>
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
        <p className="text-xs text-gray-800 dark:text-gray-400 line-clamp-2" dir="rtl">{m.content || "تصميم مولد بواسطة الذكاء الاصطناعي"}</p>
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-900/50 pt-3">
          <Link 
            to={`/chat/${m.chatId}`} 
            onClick={onClose}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>عرض المحادثة</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button 
            onClick={onDownload}
            disabled={downloading}
            className="text-[11px] text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 font-medium cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3 h-3" />
            <span>تحميل</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function GalleryVideoThumb({ m, idx, onClose }: { m: any; idx: number; onClose: () => void }) {
  const { src, loading, error } = useResolvedMediaSrc(m.mediaUrl, 'video/mp4');
  const [downloading, setDownloading] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const onDownload = async () => {
    setDownloading(true);
    await handleDownloadMedia(m.mediaUrl, `NajeAI_Video_${idx + 1}.mp4`, 'video/mp4', m.content);
    setDownloading(false);
  };

  return (
    <div className="group bg-white dark:bg-[#11141c] border border-purple-200/80 dark:hover:border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-pink-500/30 transition-all flex flex-col">
      <div className="aspect-video bg-gray-50 dark:bg-gray-950 relative overflow-hidden flex items-center justify-center">
        {loading ? (
          <div className="text-gray-400 text-xs animate-pulse p-2 text-center">جاري التحميل...</div>
        ) : error || videoError || !src ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs text-center p-3 bg-gray-100 dark:bg-gray-900/50">
            <AlertCircle className="w-6 h-6 mb-1 text-amber-500/80" />
            <span>المعاينة غير متاحة على هذا الجهاز</span>
          </div>
        ) : (
          <video 
            src={src} 
            controls
            className="w-full h-full object-cover"
            onError={() => setVideoError(true)}
          />
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <p className="text-xs text-gray-800 dark:text-gray-400 line-clamp-2" dir="rtl">{m.content || "فيديو مولد بواسطة الذكاء الاصطناعي"}</p>
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-900/50 pt-3">
          <Link 
            to={`/chat/${m.chatId}`} 
            onClick={onClose}
            className="text-[11px] text-pink-600 dark:text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1"
          >
            <span>عرض المحادثة</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button 
            onClick={onDownload}
            disabled={downloading}
            className="text-[11px] text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 font-medium cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3 h-3" />
            <span>تحميل</span>
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
      toast.error("حدث خطأ أثناء تعديل الاسم.");
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
      toast.error("حدث خطأ أثناء حذف المحادثة.");
    } finally {
      setIsDeletingChat(false);
    }
  };

  // Real-time listeners
  useEffect(() => {
    if (!user) return;

    // Subscribe to projects
    const qProjects = query(collection(db, 'projects'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubProjects = onSnapshot(qProjects, (snap) => {
      const projs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProjects(projs);
    }, (err) => console.error("Projects listen failed:", err));

    // Subscribe to chats
    const qChats = query(collection(db, 'chats'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubChats = onSnapshot(qChats, (snap) => {
      const allChats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChats(allChats);
    }, (err) => console.error("Chats listen failed:", err));

    return () => {
      unsubProjects();
      unsubChats();
    };
  }, [user]);

  // Real-time messages with media ONLY when user gallery is open
  useEffect(() => {
    if (userGalleriesOpen === 'none' || projects.length === 0 || !user) {
      setAllMediaMessages([]);
      return;
    }
    const projectIds = projects.map(p => p.id);
    const userChats = chats.filter(c => projectIds.includes(c.projectId));
    const userChatIds = userChats.map(c => c.id);

    if (userChatIds.length === 0) {
      setAllMediaMessages([]);
      return;
    }

    const qMsg = query(collection(db, 'messages'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(qMsg, (snap) => {
      const msgs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((m: any) => m.mediaUrl && userChatIds.includes(m.chatId));
      setAllMediaMessages(msgs);
    }, (err) => console.error("Messages listen failed:", err));

    return unsub;
  }, [projects, chats, userGalleriesOpen, user]);

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

  const handleCreateNewChat = async (type: 'text' | 'image' | 'video' | 'ui' | 'voice' | 'design') => {
    setCreatingChatType(type);
    const projId = activeProjectId || (selectedProjectForNewChat !== 'none' ? selectedProjectForNewChat : '');

    // 1. Generate the ID locally — instant, no network
    const newChatRef = doc(collection(db, 'chats'));
    const chatId = newChatRef.id;

    const chatData = {
      ownerId: user?.uid,
      projectId: projId,
      type,
      title: type === 'ui' ? 'مساحة تصميم واجهات جديدة'
           : type === 'design' ? 'مساحة التصميم الإبداعي والهوية'
           : type === 'text' ? 'مساحة تحليل نصوص جديدة'
           : type === 'image' ? 'مساحة صور جديدة'
           : type === 'video' ? 'مساحة فيديو جديدة'
           : 'مساحة تسجيلات صوتية جديدة',
      createdAt: Date.now()
    };

    // 2. Close modal and navigate with slight micro-transition to make the visual load effect crisp
    setTimeout(() => {
      setNewChatModalOpen(false);
      setSidebarOpen(false);
      setCreatingChatType(null);
      navigate(`/chat/${chatId}`);
    }, 120);

    // 3. Write in the background; the chat page already has the ID
    setDoc(newChatRef, chatData).catch(err => {
      console.error("Error creating chat:", err);
      toast.error("حدث خطأ أثناء إنشاء المساحة.");
    });
  };

  const imagesList = allMediaMessages.filter(m => m.mediaType === 'image' || (m.mediaUrl && !m.mediaType));
  const videosList = allMediaMessages.filter(m => m.mediaType === 'video');

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
  const recentChats = filteredChats.slice(0, 10);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-transparent text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar Header with Collapse Button */}
      <div className="flex items-center justify-between p-4 pb-2 border-b border-slate-200/80 dark:border-slate-900/60">
        <Link to="/" onClick={() => { setActiveProjectId(null); setUserGalleriesOpen('none'); }} className="flex items-center gap-2 group px-1">
          <NajeLogo size="sm" className="group-hover:scale-105 transition-all" />
          <span className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">استوديو ناجي</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-xl text-gray-800 dark:text-purple-100 dark:hover:text-white hover:text-gray-900 hover:bg-white dark:hover:bg-gray-900 transition flex items-center justify-center cursor-pointer active:scale-95"
          title="طي القائمة الجانبية"
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
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-[#11141c]"></span>
              </div>
              <div className="flex flex-col min-w-0 text-right leading-tight">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate leading-tight">
                  {user?.displayName || 'مبدع ناجي'}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5 leading-tight">
                  <span>{user?.email}</span>
                  <span>•</span>
                  <span className="text-purple-600 dark:text-purple-400 font-extrabold font-sans bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-900/40 leading-none">{Number((user?.balance || 0).toFixed(2))} ن</span>
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
            <span>مساحة دردشة جديدة</span>
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
              <span>استديو ناجي</span>
            </div>
            {projects.length > 0 && (
              <span className="text-[10px] bg-[#f2f0f5] dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-sans font-bold px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-500/20">
                {projects.length}
              </span>
            )}
          </Link>

          <Link 
            to="/naje-agent-core" 
            onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('none'); }}
            className={cn(
              "w-full h-11 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all border border-transparent",
              location.pathname.includes('naje-agent') || location.pathname.includes('al-nassaj') || location.pathname.includes('weaver') || location.pathname.includes('agent')
                ? "bg-white dark:bg-purple-950/45 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold" 
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-indigo-500" />
              <span dir="ltr">Naje Agent Core</span>
            </div>
            <span className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded border border-indigo-500/20">
              برو
            </span>
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
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>استوديو التصميم الإبداعي</span>
            </div>
            <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/20">
              جديد
            </span>
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
              <Film className="w-4 h-4 text-indigo-500" />
              <span>محرك الفيديو (NAJI Ad)</span>
            </div>
            <span className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded border border-indigo-500/20">
              Multi-Shot
            </span>
          </Link>

          <button 
            onClick={() => handleCreateNewChat('voice')}
            className={cn(
              "w-full h-11 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all border border-transparent cursor-pointer text-right",
              "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Mic2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>الدردشة الصوتية</span>
            </div>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/20 font-sans">
              صوت
            </span>
          </button>
        </div>

        {/* Group 4: Library */}
        <div className="space-y-1">
          <h3 className="text-[10px] font-extrabold text-slate-850 dark:text-purple-300 uppercase px-3 tracking-wider text-right border-b border-slate-100 dark:border-slate-900/40 pb-1 mb-1">المكتبة</h3>
          <button 
            onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('images'); }}
            className={cn(
              "w-full h-11 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all border border-transparent text-right cursor-pointer",
              userGalleriesOpen === 'images'
                ? "bg-white dark:bg-purple-950/45 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold" 
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>الصور</span>
            </div>
            {imagesList.length > 0 && (
              <span className="text-[10px] bg-[#f2f0f5] dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-sans border border-slate-200 dark:border-slate-800">{imagesList.length}</span>
            )}
          </button>

          <button 
            onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('videos'); }}
            className={cn(
              "w-full h-11 md:h-9 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all border border-transparent text-right cursor-pointer",
              userGalleriesOpen === 'videos'
                ? "bg-white dark:bg-purple-950/45 text-purple-955 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold" 
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Film className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
              <span>الفيديوهات</span>
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
              <span>المفضلة</span>
            </div>
          </Link>
        </div>

        {/* Group 6: Recent Chats */}
        <div className="space-y-1">
          <h3 className="text-[10px] font-extrabold text-slate-850 dark:text-purple-300 uppercase px-3 tracking-wider text-right border-b border-slate-100 dark:border-slate-900/40 pb-1 mb-1">الدردشات الأخيرة</h3>
          
          {activeProjectId && (
            <div className="mx-1 my-1.5 p-2 bg-purple-500/5 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-1.5 min-w-0">
                <Folder className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 truncate">
                  مصفى: {projects.find(p => p.id === activeProjectId)?.name || 'المشروع'}
                </span>
              </div>
              <button 
                onClick={() => setActiveProjectId(null)}
                className="p-1 text-purple-600 dark:text-purple-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition cursor-pointer"
                title="إلغاء التصفية"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {recentChats.length === 0 ? (
            <div className="text-center py-6 px-3 flex flex-col items-center justify-center">
              <img src={najeEmptyChat} alt="" className="w-20 h-16 object-contain opacity-70 mb-1" />
              <div className="text-[11px] text-slate-500 dark:text-slate-400">لا توجد محادثات مسبقة.</div>
            </div>
          ) : (
            <div className="space-y-1">
              {recentChats.map(c => {
                const projName = c.projectId && projects.find(p => p.id === c.projectId)?.name;
                const isActive = location.pathname === `/chat/${c.id}`;
                return (
                  <div key={c.id} className="relative group w-full">
                    <Link 
                      to={`/chat/${c.id}`}
                      onClick={() => { setSidebarOpen(false); setUserGalleriesOpen('none'); }}
                      className={cn(
                        "w-full h-11 md:h-10 flex items-center justify-between pl-14 pr-3 rounded-xl text-xs font-bold transition-all border border-transparent truncate",
                        isActive 
                          ? "bg-white dark:bg-purple-950/45 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-500/10 font-extrabold" 
                          : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {c.type === 'image' ? (
                          <ImageIcon className="w-3.5 h-3.5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                        ) : c.type === 'design' ? (
                          <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                        ) : c.type === 'video' ? (
                          <Film className="w-3.5 h-3.5 flex-shrink-0 text-pink-600 dark:text-pink-400" />
                        ) : c.type === 'ui' ? (
                          <Layout className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                        ) : c.type === 'voice' ? (
                          <Mic2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                        )}
                        <div className="flex flex-col min-w-0 text-right">
                          <span className="truncate leading-tight text-slate-900 dark:text-white font-extrabold">{c.title}</span>
                          {projName && (
                            <span className="text-[9px] text-purple-750 dark:text-purple-300 font-extrabold truncate mt-0.5 opacity-90">
                              {projName} · Qelva Ai
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity p-1 bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 shadow-md rounded-lg">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setRenameChatId(c.id);
                          setRenameChatTitle(c.title);
                        }}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                        title="تعديل الاسم"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteChatId(c.id);
                        }}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                        title="حذف المحادثة"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
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
            <Coins className="w-4 h-4 text-amber-500" />
            <span>شراء الرصيد</span>
          </div>
          <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/25">
            المتجر
          </span>
        </Link>
        {user?.isAdmin && (
          <Link 
            to="/naje-admin-ai" 
            onClick={() => setSidebarOpen(false)}
            className="w-full h-10 md:h-9 flex items-center gap-2.5 px-3 rounded-xl text-xs font-black text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-900 dark:hover:text-white transition border border-purple-300 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 shadow-sm"
          >
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>لوحة الإدارة</span>
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
          <span>الإعدادات</span>
        </Link>
      </div>

    </div>
  );

  return (
    <div className="h-screen h-[100dvh] bg-[#FAF9FC] dark:bg-[#0d0f12] text-gray-800 dark:text-gray-100 flex overflow-hidden">
      <TermsConsentModal />
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

      {/* Floating Desktop Sidebar Handle */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            onClick={() => setSidebarOpen(true)}
            className="hidden md:flex fixed top-1/2 right-0 -translate-y-1/2 z-40 bg-white dark:bg-gray-900 border border-r-0 border-gray-200 dark:border-gray-800 py-5 px-2 rounded-l-2xl shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-800 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer group"
            title="إظهار القائمة الجانبية"
          >
            <PanelRight className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </motion.button>
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
              <span>{systemStatus.intro || "تم إيقاف الخدمات مؤقتاً من أجل التطوير والإصلاح، شكراً لكم."}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {user?.isAdmin ? (
                <span className="bg-amber-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-extrabold shadow-sm">
                  وضع المسؤول (أدمن): يمكنك الوصول للاختبار
                </span>
              ) : (
                <span className="bg-rose-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-extrabold shadow-sm">
                  النظام متوقف حالياً
                </span>
              )}
              <button 
                onClick={() => setMaintenanceDismissed(true)}
                className="p-1 hover:bg-amber-500/20 rounded-lg text-amber-900 dark:text-amber-200 transition cursor-pointer"
                title="إغلاق التنبيه"
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
              className="absolute inset-0 bg-[#eae8f4] dark:bg-[#08090b] z-40 overflow-y-auto p-6 flex flex-col font-sans"
            >
              <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-900 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    {userGalleriesOpen === 'images' ? (
                      <>
                        <ImageIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">معرض الصور المولدة</h2>
                          <p className="text-xs text-gray-800 dark:text-gray-400 mt-1">تصفح وحمل جميع التصاميم والصور الإبداعية التي قمت بصياغتها.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Film className="w-7 h-7 text-pink-600 dark:text-pink-400" />
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">معرض الفيديوهات المولدة</h2>
                          <p className="text-xs text-gray-800 dark:text-gray-400 mt-1">شاهد وحمل مقاطع الفيديو السينمائية التي صنعتها ناجي الذكية.</p>
                        </div>
                      </>
                    )}
                  </div>
                  <button 
                    onClick={() => setUserGalleriesOpen('none')}
                    className="flex items-center gap-1.5 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                  >
                    <X className="w-4 h-4" />
                    <span>إغلاق المعرض</span>
                  </button>
                </div>

                {/* Grid */}
                <div className="flex-1">
                  {userGalleriesOpen === 'images' ? (
                    imagesList.length === 0 ? (
                      <div className="text-center py-16 bg-white dark:bg-gray-950 rounded-3xl border border-purple-200 dark:border-gray-900 shadow-md flex flex-col items-center justify-center p-6">
                        <img src={najeEmptyGallery} alt="لا توجد صور مولدة بعد" className="w-44 h-36 mx-auto mb-3 object-contain" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">لا توجد صور مولدة بعد</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ابدأ محادثة توليد صور لتبدع تصميمك الأول.</p>
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
                        <img src={najeEmptyVideo} alt="لا توجد فيديوهات مولدة بعد" className="w-44 h-36 mx-auto mb-3 object-contain" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">لا توجد فيديوهات مولدة بعد</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ابدأ محادثة معالجة فيديو لتجرب قوة الإخراج السينمائي لـ Naje.</p>
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

        {/* Global Top Header (visible on all screens when NOT in a Chat view) */}
        {!location.pathname.includes('/chat') && (
          <header className={`flex items-center justify-between p-4 flex-shrink-0 z-30 h-auto pt-8 sm:pt-5 ${location.pathname.includes('/creative') ? 'bg-[#030303]' : 'naje-glass-card-lg rounded-none border-t-0 border-r-0 border-l-0'}`}>
            <div className="flex items-center gap-3">
              {/* Hamburger Menu (Mobile only) */}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-1.5 rounded-xl transition flex items-center justify-center cursor-pointer ${location.pathname.includes('/creative') ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-gray-800 dark:text-purple-100 dark:hover:text-white hover:text-gray-900 hover:bg-white dark:hover:bg-gray-900'}`}
                title="توسيع/طي القائمة"
              >
                <PanelRight className="w-5 h-5" />
              </button>
              
              {/* Brand Logo & Name */}
              <Link to="/" onClick={() => { setActiveProjectId(null); setUserGalleriesOpen('none'); }} className="flex items-center gap-2 group">
                <NajeLogo size="md" className="group-hover:scale-105 transition-all" />
                <span className={`font-extrabold text-sm transition-colors ${location.pathname.includes('/creative') ? 'text-white group-hover:text-amber-400' : 'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:text-indigo-400'}`}>استوديو ناجي</span>
              </Link>
            </div>
            
            {/* User Name + Balance + New Chat Button */}
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <BalanceTopDropdown isCreativeMode={location.pathname.includes('/creative')} />

              {/* Top Bar "+ دردشة جديدة" Button */}
              <button 
                onClick={() => setNewChatModalOpen(true)}
                className={`p-2 text-white rounded-xl transition cursor-pointer flex items-center justify-center shadow-lg active:scale-[0.98] ${location.pathname.includes('/creative') ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/15' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/15'}`}
                title="دردشة جديدة"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </header>
        )}
        
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
              className="relative naje-glass-card-lg border-t sm:border shadow-2xl flex flex-col gap-5 text-right z-10 w-full sm:max-w-[480px] p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-900">
                <button 
                  onClick={() => setNewChatModalOpen(false)}
                  className="p-1.5 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-right">
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white">بدء مساحة إبداعية جديدة</h2>
                  <p className="text-[10px] text-gray-800 dark:text-gray-400 mt-1">اختر نوع الإنتاج الذي تفضله للبدء.</p>
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
                    <div className="flex flex-col text-right sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:text-purple-400 transition-colors">
                        {creatingChatType === 'text' ? 'جاري تحضير المساحة...' : 'دردشة نصية'}
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">اكتب، اسأل، أو حلّل مستنداً</span>
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
                    <div className="flex flex-col text-right sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-pink-600 dark:text-pink-400 transition-colors">
                        {creatingChatType === 'image' ? 'جاري تحضير المساحة...' : 'دردشة إنشاء صور'}
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">صمّم صورة أو شعاراً بدقة عالية</span>
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
                    <div className="flex flex-col text-right sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-sky-400 transition-colors">
                        {creatingChatType === 'video' ? 'جاري تحضير الاستوديو...' : 'دردشة إنشاء فيديوهات'}
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">حوّل فكرتك إلى فيديو سينمائي</span>
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
                    <div className="flex flex-col text-right sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">
                        {creatingChatType === 'ui' ? 'جاري تحضير المساحة...' : 'تصميم واجهات'}
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">صمّم واجهة موقع أو تطبيق — وشوفها تتبنى أمامك</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 group-hover:text-gray-500 dark:text-gray-400 transition sm:hidden flex-shrink-0" />
                </button>

                {/* 6. استوديو الصوت والبودكاست (Voice Studio) */}
                <button 
                  onClick={() => handleCreateNewChat('voice')}
                  disabled={creatingChatType !== null}
                  className={`w-full sm:h-[140px] min-h-[72px] h-auto px-4 py-3 sm:p-5 bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/30 hover:bg-emerald-600/[0.02] rounded-xl flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-3 sm:gap-4 transition cursor-pointer group sm:col-span-2 active:scale-[0.98] ${creatingChatType === 'voice' ? 'ring-2 ring-emerald-500 bg-emerald-500/10 opacity-90' : ''}`}
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 min-w-0 sm:w-full">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {creatingChatType === 'voice' ? <NajeSpinner className="w-5 h-5" /> : <Mic2 className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col text-right sm:text-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors flex items-center gap-1.5 justify-start sm:justify-center">
                        <span>{creatingChatType === 'voice' ? 'جاري تحضير الاستوديو...' : 'استوديو الصوتيات'}</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20 font-sans">جديد</span>
                      </span>
                      <span className="text-[10px] text-gray-800 dark:text-gray-400 mt-0.5">حوّل نصوصك لتسجيلات صوتية احترافية — بصوت واحد أو حوار بين صوتين</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 group-hover:text-gray-500 dark:text-gray-400 transition sm:hidden flex-shrink-0" />
                </button>
              </div>

              {/* Project association dropdown if not currently viewing/scoping a project */}
              {!activeProjectId ? (
                <div className="border-t border-gray-200 dark:border-gray-900/60 pt-4 mt-1 flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-800 dark:text-gray-400 font-bold">إضافة إلى مشروع (اختياري)</label>
                  <NajeSelect
                    value={selectedProjectForNewChat}
                    onChange={(val) => setSelectedProjectForNewChat(val)}
                    options={[
                      { value: 'none', label: 'بدون مشروع (غير تصنيفي)' },
                      ...projects.map(p => ({ value: p.id, label: p.name }))
                    ]}
                    className="w-full text-gray-900 dark:text-gray-300"
                  />
                </div>
              ) : (
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/5 border border-indigo-400 dark:border-indigo-500/10 rounded-xl p-2.5 text-center flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>سيتم إرفاقها بالمشروع: "{projects.find(p => p.id === activeProjectId)?.name}" تلقائياً</span>
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
              className="relative bg-white dark:bg-[#0d0f12] border border-gray-200 dark:border-gray-900 rounded-2xl p-6 w-full max-w-[400px] shadow-2xl flex flex-col gap-4 text-right z-10"
            >
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">تعديل اسم المحادثة</h3>
                <p className="text-[10px] text-gray-800 dark:text-gray-400 mt-1">أدخل الاسم الجديد لهذه المساحة الإبداعية.</p>
              </div>
              <input 
                type="text"
                required
                value={renameChatTitle}
                onChange={e => setRenameChatTitle(e.target.value)}
                placeholder="اسم المحادثة الجديد..."
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-900 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-200 outline-none focus:border-indigo-500 transition"
                dir="rtl"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setRenameChatId(null)}
                  className="px-4 py-2 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-300 rounded-xl text-xs font-bold transition cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  disabled={isRenamingChat}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  {isRenamingChat && <NajeSpinner className="w-3.5 h-3.5" />}
                  <span>حفظ التعديل</span>
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
              className="relative bg-white dark:bg-[#0d0f12] border border-gray-200 dark:border-gray-900 rounded-2xl p-6 w-full max-w-[400px] shadow-2xl flex flex-col gap-4 text-right z-10"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-1">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">حذف المحادثة نهائياً؟</h3>
                <p className="text-xs text-gray-800 dark:text-gray-400 mt-2 leading-relaxed">
                  هل أنت متأكد من رغبتك في حذف هذه المحادثة؟ ستفقد جميع الرسائل والملفات المولدة داخلها ولا يمكن استعادتها أبداً.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setDeleteChatId(null)}
                  className="w-1/2 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-300 rounded-xl text-xs font-bold transition cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                >
                  تراجع وإغلاق
                </button>
                <button 
                  type="button"
                  onClick={handleDeleteChat}
                  disabled={isDeletingChat}
                  className="w-1/2 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  {isDeletingChat && <NajeSpinner className="w-3.5 h-3.5" />}
                  <span>نعم، احذف المساحة</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
