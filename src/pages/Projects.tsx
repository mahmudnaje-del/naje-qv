import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy, deleteDoc, updateDoc, doc, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppStore } from '../store';
import { Project, ChatSession, ProjectClassification, getClassificationLabel } from '../types';
import ProjectMemoryManager from '../components/ProjectMemoryManager';
import NajeSpinner from '../components/NajeSpinner';
import najeEmptyProject from '../assets/icons/naje-empty-project.svg';
import najeEmptyChat from '../assets/icons/naje-empty-chat.svg';
import najeBrandMemory from '../assets/icons/naje-brand-memory.svg';
import najeExportZip from '../assets/icons/naje-export-zip.svg';
import najeDocument from '../assets/icons/naje-document.svg';
import { 
  Plus, Folder, ArrowLeft, Download, FileText, 
  Sparkles, Image as ImageIcon, Film, Star, ExternalLink, Calendar, Compass, X, AlertCircle, Trash2, Pencil
, ChevronDown, Layout, Mic2, MessageSquare } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { exportProjectPDF } from '../utils/pdfExport';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '../toastStore';
import { getDoc as getLocalDoc } from '../lib/idb';

function ProjectMediaThumb({ m }: { m: any }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    if (!m.mediaUrl) {
      setError(true);
      setLoading(false);
      return;
    }

    if (m.mediaUrl.startsWith('data:') || m.mediaUrl.startsWith('http://') || m.mediaUrl.startsWith('https://')) {
      setSrc(m.mediaUrl);
      setLoading(false);
      return;
    }

    if (m.mediaUrl.startsWith('local:')) {
      const localId = m.mediaUrl.split('local:')[1];
      getLocalDoc(localId)
        .then(doc => {
          if (!active) return;
          if (doc) {
            const defaultMime = m.mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
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

    const defaultMime = m.mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
    setSrc(`data:${defaultMime};base64,${m.mediaUrl}`);
    setLoading(false);

    return () => {
      active = false;
    };
  }, [m.mediaUrl, m.mediaType]);

  return (
    <div className="bg-gray-50 dark:bg-gray-950/20 border border-gray-500 dark:border-gray-900 rounded-xl overflow-hidden flex flex-col">
      <div className="aspect-square bg-gray-50 dark:bg-gray-950 relative overflow-hidden flex items-center justify-center">
        {loading ? (
          <div className="text-gray-400 text-xs animate-pulse p-2 text-center">جاري التحميل...</div>
        ) : error || !src ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs text-center p-2 bg-gray-100 dark:bg-gray-900/50">
            <AlertCircle className="w-5 h-5 mb-1 text-amber-500/80" />
            <span>المعاينة غير متاحة على هذا الجهاز</span>
          </div>
        ) : m.mediaType === 'video' ? (
          <video 
            src={src} 
            controls
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <img 
            src={src} 
            alt="Visual creation" 
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        )}
      </div>
    </div>
  );
}

export default function Projects() {
  const { user, setUserGalleriesOpen, activeProjectId, setActiveProjectId, setNewChatModalOpen } = useAppStore();
  const navigate = useNavigate();
  const [enteringStudio, setEnteringStudio] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [allMediaMessages, setAllMediaMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals / Forms
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newOwnerDisplayName, setNewOwnerDisplayName] = useState('');
  const [newClassification, setNewClassification] = useState<ProjectClassification>('individual');
  const [newClassificationOther, setNewClassificationOther] = useState('');
  const [newProjectType, setNewProjectType] = useState<Project['entityType']>('فرد');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showMemoryManager, setShowMemoryManager] = useState(false);
  
  // Transition Confirmation Modal
  const [confirmProject, setConfirmProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  
  // Exports
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportingPDFId, setExportingPDFId] = useState<string | null>(null);

  // Load projects and chats real-time
  useEffect(() => {
    if (!user) return;

    const qProjs = query(collection(db, 'projects'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubProjs = onSnapshot(qProjs, (snap) => {
      setProjects(snap.docs.map(d => ({ ...d.data(), id: d.id } as Project)));
      setLoading(false);
    }, (error) => {
      console.warn('Projects listen error:', error);
      setLoading(false);
    });

    const qChats = query(collection(db, 'chats'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubChats = onSnapshot(qChats, (snap) => {
      setChats(snap.docs.map(d => ({ ...d.data(), id: d.id } as ChatSession)));
    }, (error) => {
      console.warn('Chats listen error:', error);
    });

    return () => {
      unsubProjs();
      unsubChats();
    };
  }, [user]);

  // Load recent generated media across user chats
  useEffect(() => {
    if (!user || projects.length === 0) {
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
    }, (error) => {
      console.warn('Media messages listen error:', error);
    });

    return unsub;
  }, [projects, chats, user]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectName.trim()) return;
    
    try {
      setIsCreatingProject(true);

      // Map classification back to entityType for backwards compatibility
      let entityTypeMapped: Project['entityType'] = 'فرد';
      if (newClassification === 'business') entityTypeMapped = 'شركة';
      else if (newClassification === 'government') entityTypeMapped = 'جهة حكومية';
      else if (newClassification === 'nonprofit') entityTypeMapped = 'مؤسسة غير ربحية';

      const docRef = await addDoc(collection(db, 'projects'), {
        ownerId: user.uid,
        name: newProjectName.trim(),
        ownerDisplayName: (newOwnerDisplayName.trim() || user.displayName || 'المستخدم'),
        classification: newClassification,
        classificationOther: newClassification === 'other' ? newClassificationOther.trim() : '',
        entityType: entityTypeMapped,
        createdAt: Date.now()
      });
      
      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewOwnerDisplayName('');
      setNewClassification('individual');
      setNewClassificationOther('');
      
      // Auto transition to newly created project
      setActiveProjectId(docRef.id);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء إنشاء المشروع.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleExportProject = async (proj: Project) => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }
    try {
      setExportingId(proj.id);
      const zip = new JSZip();
      const projectFolder = zip.folder(proj.name.replace(/\//g, '-'))!;
      
      projectFolder.file('brand_profile.json', JSON.stringify({
        name: proj.name,
        entityType: proj.entityType,
        createdAt: proj.createdAt,
      }, null, 2));

      const chatsQ = query(collection(db, 'chats'), where('projectId', '==', proj.id), where('ownerId', '==', user.uid));
      const chatsSnap = await getDocs(chatsQ);
      
      for (const chatDoc of chatsSnap.docs) {
        const chatData = chatDoc.data() as ChatSession;
        const msgQ = query(collection(db, 'messages'), where('chatId', '==', chatDoc.id), where('ownerId', '==', user.uid));
        const msgSnap = await getDocs(msgQ);
        
        const chatFolder = projectFolder.folder(chatData.title.replace(/\//g, '-') || 'محادثة')!;
        
        let textContent = '';
        msgSnap.docs.forEach(mDoc => {
          const m = mDoc.data();
          textContent += `[${m.role === 'user' ? 'المستخدم' : 'Naje AI'}] ${new Date(m.createdAt).toLocaleString()}\n`;
          textContent += `${m.content}\n\n`;
          if (m.mediaUrl) {
            textContent += `(مرفق/وسائط: ${m.mediaUrl})\n\n`;
          }
        });
        chatFolder.file('transcript.txt', textContent);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${proj.name.replace(/\s+/g, '_')}_export.zip`);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تصدير المشروع');
    } finally {
      setExportingId(null);
    }
  };

  const handleExportProjectPDF = async (proj: Project) => {
    try {
      setExportingPDFId(proj.id);
      
      const chatsQ = query(collection(db, 'chats'), where('projectId', '==', proj.id), where('ownerId', '==', user?.uid));
      const chatsSnap = await getDocs(chatsQ);
      
      const chatsWithMessages: any[] = [];
      
      for (const chatDoc of chatsSnap.docs) {
        const chatData = chatDoc.data() as ChatSession;
        const msgQ = query(collection(db, 'messages'), where('chatId', '==', chatDoc.id), where('ownerId', '==', user?.uid));
        const msgSnap = await getDocs(msgQ);
        const messages = msgSnap.docs.map(m => ({ ...m.data(), id: m.id }));
        
        chatsWithMessages.push({
          chat: { ...chatData, id: chatDoc.id },
          messages
        });
      }
      
      await exportProjectPDF(proj.name, proj.entityType || 'فرد', chatsWithMessages);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تصدير المشروع بصيغة PDF');
    } finally {
      setExportingPDFId(null);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      await updateDoc(doc(db, 'chats', chatId), { title: newTitle });
    } catch (err) {
      console.error("Error renaming chat:", err);
      toast.error("حدث خطأ أثناء تعديل اسم الدردشة.");
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteDoc(doc(db, 'chats', chatId));
    } catch (err) {
      console.error("Error deleting chat:", err);
      toast.error("حدث خطأ أثناء حذف الدردشة.");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      
      // Clear active filter if the deleted project was the active one
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
      }

      // Delete associated chats
      const chatsQ = query(collection(db, 'chats'), where('projectId', '==', projectId), where('ownerId', '==', user?.uid));
      const chatsSnap = await getDocs(chatsQ);
      for (const chatDoc of chatsSnap.docs) {
        await deleteDoc(chatDoc.ref);
        
        // Delete messages
        const msgsQ = query(collection(db, 'messages'), where('chatId', '==', chatDoc.id), where('ownerId', '==', user?.uid));
        const msgsSnap = await getDocs(msgsQ);
        for (const msgDoc of msgsSnap.docs) {
          await deleteDoc(msgDoc.ref);
        }
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  useEffect(() => {
    if (!loading && activeProjectId && projects.length >= 0 && !projects.find(p => p.id === activeProjectId)) {
      setActiveProjectId(null);
    }
  }, [loading, activeProjectId, projects, setActiveProjectId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAF9FC] dark:bg-[#0d0f12]">
        <div className="flex flex-col items-center gap-3">
          <NajeSpinner className="w-8 h-8" />
          <span className="text-gray-800 dark:text-gray-400 text-sm font-medium">جاري تحميل استوديو ناجي...</span>
        </div>
      </div>
    );
  }



  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeProjectChats = chats.filter(c => c.projectId === activeProjectId);
  const latestCreations = allMediaMessages.slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 pb-32 sm:pb-8 max-w-[760px] mx-auto w-full font-sans scrollbar-thin">
      
      <AnimatePresence>
        {(!activeProjectId || !activeProject) ? (
          /* ========================================================
             GLOBAL VIEW: Show list of all projects & welcome stats
             ======================================================== */
          <motion.div 
            key="global-projects"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            {/* Welcome Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 border border-purple-500/20 dark:border-purple-500/10 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 shadow-xl shadow-purple-500/5">
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-[11px] font-semibold text-indigo-300">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    <span>استوديو ناجي المتكامل للذكاء الاصطناعي</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-3 leading-normal">
                    أهلاً بك، {user?.displayName || 'مبدع ناجي'}
                  </h1>
                  <p className="text-indigo-200/90 text-xs mt-2 leading-relaxed">
                    مرحباً بك في الاستوديو الإبداعي. انشئ دردشة جديدة لتبدأ العمل التوليدي فوراً، أو اختر مساحة عمل من الأسفل.
                  </p>
                </div>

                <button 
                  onClick={() => setNewChatModalOpen(true)} 
                  className="self-start bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer text-xs border border-transparent hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4" />
                  <span>بدء مساحة إبداعية</span>
                </button>
              </div>
            </div>

            {/* Quick Creation Shortcuts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button
                onClick={() => setNewChatModalOpen(true)}
                className="p-3.5 bg-white dark:bg-[#11141c] hover:bg-purple-50/50 dark:hover:bg-[#181d2a] border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col items-center text-center gap-2 transition cursor-pointer group shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-800"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">دردشة نصية</span>
              </button>

              <button
                onClick={() => setNewChatModalOpen(true)}
                className="p-3.5 bg-white dark:bg-[#11141c] hover:bg-emerald-50/50 dark:hover:bg-[#12221b] border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl flex flex-col items-center text-center gap-2 transition cursor-pointer group shadow-sm hover:shadow-md hover:border-emerald-400"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                  <Mic2 className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>الدردشة الصوتية</span>
                </span>
              </button>

              <button
                onClick={() => setNewChatModalOpen(true)}
                className="p-3.5 bg-white dark:bg-[#11141c] hover:bg-pink-50/50 dark:hover:bg-[#22131e] border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col items-center text-center gap-2 transition cursor-pointer group shadow-sm hover:shadow-md hover:border-pink-300 dark:hover:border-pink-800"
              >
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">توليد صور</span>
              </button>

              <button
                onClick={() => setNewChatModalOpen(true)}
                className="p-3.5 bg-white dark:bg-[#11141c] hover:bg-sky-50/50 dark:hover:bg-[#111f2c] border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col items-center text-center gap-2 transition cursor-pointer group shadow-sm hover:shadow-md hover:border-sky-300 dark:hover:border-sky-800"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Film className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">توليد فيديو</span>
              </button>

              <button
                onClick={() => setNewChatModalOpen(true)}
                className="p-3.5 bg-white dark:bg-[#11141c] hover:bg-amber-50/50 dark:hover:bg-[#251d12] border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col items-center text-center gap-2 transition cursor-pointer group shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 col-span-2 sm:col-span-1"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layout className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">تصميم واجهات</span>
              </button>
            </div>

            {/* Quick stats panel */}
            <div className="grid grid-cols-3 gap-4">
              <div className="naje-glass-card p-4 flex flex-col justify-between">
                <span className="text-[10px] text-indigo-950/70 dark:text-purple-300 font-bold">مساحات العمل</span>
                <span className="text-xl font-extrabold text-indigo-950 dark:text-white mt-2">{projects.length}</span>
              </div>
              <div className="naje-glass-card p-4 flex flex-col justify-between">
                <span className="text-[10px] text-indigo-950/70 dark:text-purple-300 font-bold">جلسات التصميم</span>
                <span className="text-xl font-extrabold text-indigo-950 dark:text-white mt-2">{chats.length}</span>
              </div>
              <div className="naje-glass-card p-4 flex flex-col justify-between">
                <span className="text-[10px] text-indigo-950/70 dark:text-purple-300 font-bold">ملفات الوسائط</span>
                <span className="text-xl font-extrabold text-indigo-950 dark:text-white mt-2">{allMediaMessages.length}</span>
              </div>
            </div>

            {/* List of projects */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-400 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>مساحات العمل المتاحة ({projects.length})</span>
                </h2>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-16 px-6 naje-glass-card-lg shadow-xl relative overflow-hidden group flex flex-col items-center justify-center">
                  <img src={najeEmptyProject} alt="لا توجد مساحات عمل" className="w-52 h-40 mx-auto mb-4 object-contain" />
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2 relative z-10">استعد لتأسيس مساحة عملك الأولى</h3>
                  <p className="text-xs text-gray-800 dark:text-gray-400 max-w-sm mx-auto leading-relaxed mb-6 relative z-10">
                    مساحات العمل تساعدك في تنظيم دردشاتك، ملفاتك، ومخرجاتك الإبداعية. دعنا نطلق بيئة الإنتاج الخاصة بك بلمسة ناجي الذكية.
                  </p>

                  <button
                    onClick={() => setShowNewProjectModal(true)}
                    className="relative z-10 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition shadow-lg shadow-indigo-500/15 cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إنشاء أول مساحة عمل</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map(proj => {
                    const projChats = chats.filter(c => c.projectId === proj.id);
                    
                    // Count media types in this project
                    const projChatIds = projChats.map(c => c.id);
                    const hasText = projChats.some(c => c.type === 'text');
                    const hasUi = projChats.some(c => c.type === 'ui');
                    const hasImage = projChats.some(c => c.type === 'image');
                    const hasVideo = projChats.some(c => c.type === 'video');

                    return (
                      <div 
                        key={proj.id}
                        onClick={() => setConfirmProject(proj)}
                        className="naje-glass-card hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/12 duration-300 transition-all p-5 group cursor-pointer flex flex-col justify-between gap-4 shadow-md shadow-purple-500/[0.04]"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="w-9 h-9 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                              <Folder className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-lg border border-purple-100 dark:border-purple-500/10 font-bold">{proj.entityType}</span>
                          </div>

                          <h3 className="font-extrabold text-sm text-indigo-950 dark:text-white mt-3 group-hover:text-purple-600 dark:text-purple-400 transition-colors truncate">{proj.name}</h3>
                          <p className="text-[11px] text-indigo-950/60 dark:text-purple-300/70 mt-1 font-semibold">{projChats.length} دردشة مسجلة</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-purple-100 dark:border-purple-500/10 pt-3">
                          {/* Mini transparent status chips */}
                          <div className="flex gap-1">
                            {hasText && <span className="p-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md text-[9px] font-bold" title="تحتوي على نصوص"><FileText className="w-3 h-3 inline" /></span>}
                            {hasUi && <span className="p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-[9px] font-bold" title="تحتوي على واجهات"><Layout className="w-3 h-3 inline" /></span>}
                            {hasImage && <span className="p-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md text-[9px] font-bold" title="تحتوي على صور"><ImageIcon className="w-3 h-3 inline" /></span>}
                            {hasVideo && <span className="p-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-md text-[9px] font-bold" title="تحتوي على فيديوهات"><Film className="w-3 h-3 inline" /></span>}
                          </div>

                          <button 
                            onClick={(e) => { e.stopPropagation(); setProjectToDelete(proj.id); }}
                            className="p-1.5 text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition cursor-pointer"
                            title="حذف المشروع"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Creatively AI Entry Card */}
              <div 
                onClick={() => { if (enteringStudio) return; setEnteringStudio(true); setTimeout(() => navigate('/creative-studio'), 350); }}
                className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 border border-purple-500/30 hover:border-purple-400/60 shadow-xl shadow-purple-500/10 transition-all duration-300 cursor-pointer group hover:scale-[1.01] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>لدينا Creatively AI</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-amber-300 transition-colors">
                    هل أنت مصمم أو شركة تبحث عن هوية؟
                  </h3>
                  <p className="text-xs text-purple-200/80 mt-1">
                    صمم شعارك، هويتك البصرية، أو إعلان الفيديو الخاص بك في ثوانٍ معدودة بكفاءة عالية.
                  </p>
                </div>
                <div className="relative z-10 shrink-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 group-hover:shadow-lg group-hover:shadow-amber-500/25 transition-all">
                  <span>{enteringStudio ? 'جاري الفتح...' : 'تجربة المصمم الذكي'}</span>
                  {enteringStudio
                    ? <NajeSpinner className="w-4 h-4" />
                    : <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />}
                </div>
              </div>
            </div>

            {/* Latest Creations Row */}
            {latestCreations.length > 0 && (
              <div className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-gray-800 dark:text-gray-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>آخر الإنتاجات البصرية عبر مساحاتك</span>
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {latestCreations.map((m, idx) => (
                    <ProjectMediaThumb key={m.id || idx} m={m} />
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        ) : (
          /* ========================================================
             PROJECT VIEW: Focused Dashboard for Selected Active Project
             ======================================================== */
          <motion.div 
            key="focused-project"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Back to all projects link */}
            <button 
              onClick={() => setActiveProjectId(null)}
              className="flex items-center gap-1.5 text-xs text-indigo-950 dark:text-purple-300 hover:text-indigo-600 dark:hover:text-purple-400 transition cursor-pointer font-bold animate-pulse"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>العودة إلى كافة مساحات العمل</span>
            </button>

            {/* Active Project Dashboard Banner */}
            <div className="naje-glass-card p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/10">
                  <Folder className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-extrabold text-indigo-950 dark:text-white">{activeProject?.name}</h1>
                    <span className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-lg border border-purple-100 dark:border-purple-500/10 font-bold">{activeProject?.entityType}</span>
                  </div>
                  <p className="text-[11px] text-indigo-950/70 dark:text-purple-300/80 mt-1 font-semibold">تصفح دردشات المشروع الحالية أو أنشئ مساحة نقاش إضافية.</p>
                </div>
              </div>

              {/* PDF, Memory and ZIP Exports specific to this project */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMemoryManager(!showMemoryManager)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                    showMemoryManager 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                  }`}
                  title="إدارة ذاكرة المشروع الحية"
                >
                  <img src={najeBrandMemory} alt="" className="w-3.5 h-3.5 object-contain" />
                  <span>ذاكرة المشروع</span>
                </button>
                <button 
                  onClick={() => handleExportProjectPDF(activeProject!)} 
                  disabled={exportingPDFId === activeProject?.id}
                  className="p-2.5 text-purple-600 dark:text-purple-400 hover:text-indigo-950 dark:hover:text-white bg-purple-50/50 dark:bg-gray-900 border border-purple-200/50 dark:border-gray-800 rounded-xl transition hover:bg-purple-100/50 disabled:opacity-50 cursor-pointer" 
                  title="تصدير كـ PDF"
                >
                  {exportingPDFId === activeProject?.id ? <NajeSpinner className="w-4 h-4" /> : <img src={najeDocument} alt="" className="w-4 h-4 object-contain" />}
                </button>
                <button 
                  onClick={() => handleExportProject(activeProject!)} 
                  disabled={exportingId === activeProject?.id}
                  className="p-2.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-950 dark:hover:text-white bg-purple-50/50 dark:bg-gray-900 border border-purple-200/50 dark:border-gray-800 rounded-xl transition hover:bg-purple-100/50 disabled:opacity-50 cursor-pointer" 
                  title="تصدير ZIP"
                >
                  {exportingId === activeProject?.id ? <NajeSpinner className="w-4 h-4" /> : <img src={najeExportZip} alt="" className="w-4 h-4 object-contain" />}
                </button>
              </div>
            </div>

            {/* Living Memory Manager Section */}
            {activeProject && showMemoryManager && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <ProjectMemoryManager project={activeProject} onClose={() => setShowMemoryManager(false)} />
              </motion.div>
            )}

            {/* Quick action: Create new Chat in this Project */}
            <div className="bg-gradient-to-r from-purple-100/60 via-indigo-50/70 to-pink-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-purple-200/40 dark:border-indigo-500/10 p-5 rounded-3xl shadow-sm shadow-purple-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-indigo-950 dark:text-white text-xs">هل ترغب بإنشاء محادثة جديدة لهذا المشروع؟</h3>
                <p className="text-[10px] text-indigo-950/70 dark:text-purple-300 mt-1 font-semibold">ابدأ صياغة صور، فيديوهات، أو نصوص فوراً.</p>
              </div>
              <button 
                onClick={() => setNewChatModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/20 cursor-pointer active:scale-95"
              >
                + إنشاء دردشة جديدة بالمشروع
              </button>
            </div>

            {/* Chats of this project */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-gray-800 dark:text-gray-400 ">محادثات المشروع النشطة ({activeProjectChats.length})</h2>

              {activeProjectChats.length === 0 ? (
                <div className="text-center py-14 bg-white dark:bg-gray-950 border border-purple-200 dark:border-gray-900 rounded-2xl shadow-md flex flex-col items-center justify-center p-6">
                  <img src={najeEmptyChat} alt="لا توجد محادثات" className="w-44 h-32 mx-auto mb-2 object-contain" />
                  <p className="text-xs text-gray-800 dark:text-gray-400 ">لا توجد دردشات مسجلة داخل هذا المشروع حتى الآن.</p>
                  <button 
                    onClick={() => setNewChatModalOpen(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-gray-900 dark:hover:text-white font-bold mt-2 cursor-pointer"
                  >
                    أنشئ دردشتك الأولى الآن &larr;
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeProjectChats.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-4 naje-glass-card hover:-translate-y-0.5 duration-300 transition-all group shadow-md shadow-purple-500/[0.02] hover:shadow-lg hover:shadow-purple-500/10"
                    >
                      <Link to={`/chat/${c.id}`} className="flex-1 flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/5 dark:bg-gray-900/80 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          {c.type === 'ui' ? <Layout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : c.type === 'image' ? <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" /> : c.type === 'video' ? <Film className="w-4 h-4 text-pink-600 dark:text-pink-400" /> : <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-indigo-950 dark:text-white group-hover:text-purple-600 dark:text-purple-400 transition-colors">{c.title}</h4>
                          <span className="text-[10px] text-indigo-950/60 dark:text-purple-300/80 mt-1 block font-semibold">
                            {c.type === 'ui' ? 'توليد واجهات تفاعلية' : c.type === 'text' ? 'دردشة عادية وتحليل نصوص' : c.type === 'image' ? 'توليد صور فنية' : 'توليد فيديو سينمائي'}
                          </span>
                        </div>
                      </Link>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-900 dark:text-gray-300 font-sans">{new Date(c.createdAt).toLocaleDateString('ar-EG')}</span>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const newTitle = prompt('أدخل الاسم الجديد للدردشة:', c.title);
                              if (newTitle && newTitle.trim() !== '') {
                                handleRenameChat(c.id, newTitle.trim());
                              }
                            }}
                            className="p-1.5 text-gray-800 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition cursor-pointer"
                            title="تعديل الاسم"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); setChatToDelete(c.id); }}
                            className="p-1.5 text-gray-800 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                            title="حذف الدردشة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <Link to={`/chat/${c.id}`} className="mr-2">
                          <ArrowLeft className="w-4 h-4 text-gray-900 dark:text-gray-300 group-hover:text-indigo-600 dark:text-indigo-400 group-hover:-translate-x-1 transition-all duration-200 rtl:rotate-180" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
         MODAL 1: New Project Creation Overlay
         ======================================================== */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowNewProjectModal(false)} />
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleCreateProject} 
            className="relative naje-glass-card-lg p-6 w-full max-w-md shadow-2xl flex flex-col gap-5"
          >
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">مساحة عمل إبداعية مخصصة</h2>
              <p className="text-xs text-gray-800 dark:text-gray-400 ">نظم مشاريعك وأعمالك التوليدية في حيز مستقل.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-800 dark:text-gray-400">اسم مساحة العمل / المشروع *</label>
                <input 
                  autoFocus 
                  required 
                  value={newProjectName} 
                  onChange={e => setNewProjectName(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-500 dark:border-gray-900 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition text-gray-900 dark:text-white text-xs" 
                  placeholder="مثال: هوية رمضان البصرية، متجر الأناقة..." 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-800 dark:text-gray-400">اسم مالك المشروع / الهوية</label>
                <input 
                  value={newOwnerDisplayName} 
                  onChange={e => setNewOwnerDisplayName(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-500 dark:border-gray-900 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition text-gray-900 dark:text-white text-xs" 
                  placeholder={user?.displayName || 'اسمك أو اسم صاحب العلامة التجارية'} 
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-800 dark:text-gray-400">تصنيف جهة المشروع *</label>
                <div className="relative">
                  <div 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-500 dark:border-gray-900 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition text-gray-900 dark:text-white text-xs cursor-pointer flex items-center justify-between"
                  >
                    <span>
                      {newClassification === 'individual' && 'فرد (أسلوب مرن وودود)'}
                      {newClassification === 'business' && 'شركة / جهة تجارية (أسلوب احترافي تسويقي)'}
                      {newClassification === 'government' && 'جهة حكومية (أسلوب رسمي وحيادي)'}
                      {newClassification === 'nonprofit' && 'منظمة غير ربحية (أسلوب دافئ وإنساني)'}
                      {newClassification === 'education' && 'مؤسسة تعليمية (أسلوب تعليمي ومنظم)'}
                      {newClassification === 'other' && 'أخرى (مخصص)'}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                  
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-gray-50 dark:bg-gray-950 border border-gray-500 dark:border-gray-900 rounded-xl overflow-hidden z-50 shadow-xl"
                      >
                        {[
                          { val: 'individual', label: 'فرد (أسلوب مرن وودود)' },
                          { val: 'business', label: 'شركة / جهة تجارية (أسلوب احترافي تسويقي)' },
                          { val: 'government', label: 'جهة حكومية (أسلوب رسمي وحيادي)' },
                          { val: 'nonprofit', label: 'منظمة غير ربحية (أسلوب دافئ وإنساني)' },
                          { val: 'education', label: 'مؤسسة تعليمية (أسلوب تعليمي ومنظم)' },
                          { val: 'other', label: 'أخرى (مخصص)' },
                        ].map(opt => (
                          <div 
                            key={opt.val}
                            onClick={() => { setNewClassification(opt.val as any); setDropdownOpen(false); }}
                            className="px-4 py-3 text-xs text-gray-900 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                          >
                            {opt.label}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {newClassification === 'other' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-800 dark:text-gray-400">حدد التصنيف الخاص</label>
                  <input 
                    required 
                    value={newClassificationOther} 
                    onChange={e => setNewClassificationOther(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-500 dark:border-gray-900 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition text-gray-900 dark:text-white text-xs" 
                    placeholder="أدخل اسم الجهة أو التصنيف الخاص..." 
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-500 dark:border-gray-900 mt-1">
              <button type="button" onClick={() => setShowNewProjectModal(false)} className="px-4 py-2 text-xs text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition font-bold">إلغاء</button>
              <button 
                type="submit" 
                disabled={isCreatingProject}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {isCreatingProject ? <NajeSpinner className="w-3.5 h-3.5" /> : 'إنشاء وتأسيس'}
              </button>
            </div>
          </motion.form>
        </div>
      )}

      {/* ========================================================
         MODAL 3: Delete Project Dialog
         ======================================================== */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm" onClick={() => setProjectToDelete(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative naje-glass-card p-6 w-full max-w-sm shadow-2xl flex flex-col gap-5 text-right"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="pt-1">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">حذف مساحة العمل</h3>
                <p className="text-[11px] text-gray-800 dark:text-gray-400 mt-2 leading-relaxed">
                  هل أنت متأكد من حذف هذا المشروع نهائياً؟ جميع دردشاتك وملفاته ستُحذف ولا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-gray-500 dark:border-gray-900/60 mt-1">
              <button 
                onClick={() => setProjectToDelete(null)} 
                className="px-4 py-2 text-xs text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button 
                onClick={() => {
                  handleDeleteProject(projectToDelete);
                  setProjectToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md cursor-pointer hover:scale-[1.01]"
              >
                نعم، احذف نهائياً
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================
         MODAL 4: Delete Chat Dialog
         ======================================================== */}
      {chatToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm" onClick={() => setChatToDelete(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative naje-glass-card p-6 w-full max-w-sm shadow-2xl flex flex-col gap-5 text-right"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="pt-1">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">حذف الدردشة</h3>
                <p className="text-[11px] text-gray-800 dark:text-gray-400 mt-2 leading-relaxed">
                  هل أنت متأكد من حذف هذه الدردشة نهائياً؟
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-gray-500 dark:border-gray-900/60 mt-1">
              <button 
                onClick={() => setChatToDelete(null)} 
                className="px-4 py-2 text-xs text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button 
                onClick={() => {
                  handleDeleteChat(chatToDelete);
                  setChatToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md cursor-pointer hover:scale-[1.01]"
              >
                نعم، احذف
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================
         MODAL 2: Transitions/Transfers Confirmation Dialog (RTL)
         ======================================================== */}
      {confirmProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm" onClick={() => setConfirmProject(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative naje-glass-card p-6 w-full max-w-sm shadow-2xl flex flex-col gap-5 text-right"
          >
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">هل أنت متأكد من الانتقال إلى مشروع {confirmProject.name}؟</h3>
              <p className="text-[11px] text-gray-800 dark:text-gray-400 /55 leading-relaxed mt-1">
                جميع دردشاتك الحالية ستبقى محفوظة
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-gray-500 dark:border-gray-900/60 mt-1">
              <button 
                onClick={() => setConfirmProject(null)} 
                className="px-4 py-2 text-xs text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition font-bold"
              >
                إلغاء
              </button>
              <button 
                onClick={() => {
                  setActiveProjectId(confirmProject.id);
                  setConfirmProject(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md cursor-pointer hover:scale-[1.01]"
              >
                نعم، الانتقال
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Empty bottom space for small screens */}
      <div className="w-full h-24 sm:h-0 shrink-0 pointer-events-none" aria-hidden="true" />
    </div>
  );
}
