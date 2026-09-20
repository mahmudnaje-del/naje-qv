import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Code2, MessageSquare, Upload, FileCode, FolderTree, ArrowUp, Send, 
  Download, Search, FileText, PanelRight, RefreshCw, Sparkles,
  Image as ImageIcon, X 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  addDoc, query, where, orderBy, onSnapshot, limit 
} from 'firebase/firestore';
import { useAppStore } from '../store';
import { auth, db } from '../firebase';
import { toast } from '../toastStore';
import NajeSpinner from '../components/NajeSpinner';
import NajeThinking from '../components/NajeThinking';
import NajeCodePane from '../components/NajeCodePane';
import FeaturePaywallModal from '../components/FeaturePaywallModal';
import { hasFeatureAccess } from '../lib/featureAccess';
import { readNajeSse } from '../lib/sseRead';

type Tab = 'code' | 'chat';
type TreeFile = { path: string; language: string; bytes: number; truncated?: boolean };
type ChatMsg = { 
  id: string; 
  role: 'user' | 'assistant'; 
  content: string; 
  images?: string[]; 
  usage?: any; 
  createdAt?: number 
};

const LS_WS = 'naje-developer-workspace';

export default function NajeDeveloper() {
  const { user, sidebarOpen, setSidebarOpen, updateBalance, setNewChatModalOpen } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatId = searchParams.get('chatId');

  const [showPaywall, setShowPaywall] = useState(false);
  const [tab, setTab] = useState<Tab>('code');
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [tree, setTree] = useState<TreeFile[]>([]);
  const [unpackStats, setUnpackStats] = useState<{ skipped: number; truncatedFiles: number } | null>(null);
  const [fileName, setFileName] = useState('project.zip');
  const [unpacking, setUnpacking] = useState(false);
  const [unpackHint, setUnpackHint] = useState('');
  const [focusPath, setFocusPath] = useState('');
  const [focusFile, setFocusFile] = useState<{ path: string; content: string; language: string } | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [chatSessionTitle, setChatSessionTitle] = useState('مساحة ناجي المطور');

  const fileRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow textarea up to 5 lines (~130px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 130)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (!hasFeatureAccess(user, 'najeDeveloper')) setShowPaywall(true);
  }, [user]);

  // Sync Chat Session with Firestore
  useEffect(() => {
    if (!user) return;
    let active = true;

    const syncSession = async () => {
      try {
        if (chatId) {
          const chatDocSnap = await getDoc(doc(db, 'chats', chatId));
          if (chatDocSnap.exists() && active) {
            const data = chatDocSnap.data();
            if (data.title) setChatSessionTitle(data.title);
            if (data.workspaceId) {
              setWorkspaceId(data.workspaceId);
              localStorage.setItem(LS_WS, data.workspaceId);
            } else {
              setWorkspaceId('');
              setTree([]);
              setFocusFile(null);
              setFocusPath('');
              localStorage.removeItem(LS_WS);
            }
          }
        } else {
          // If no chatId, ALWAYS start a fresh new chat session like all other chats
          const newRef = doc(collection(db, 'chats'));
          await setDoc(newRef, {
            ownerId: user.uid,
            type: 'najeDeveloper',
            title: 'مساحة ناجي المطور',
            createdAt: Date.now()
          });
          if (!active) return;
          setWorkspaceId('');
          setTree([]);
          setFocusFile(null);
          setFocusPath('');
          setMessages([]);
          localStorage.removeItem(LS_WS);
          setSearchParams({ chatId: newRef.id }, { replace: true });
        }
      } catch (err) {
        console.warn('Error syncing developer chat session:', err);
      }
    };

    syncSession();
    return () => { active = false; };
  }, [user, chatId]);

  // Listen to messages for current chatId
  useEffect(() => {
    if (!chatId || !user) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMsg[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          role: d.role,
          content: d.content || '',
          images: d.images || [],
          usage: d.usage,
          createdAt: d.createdAt
        };
      });
      setMessages(msgs);
    }, (err) => {
      console.warn('Error listening to messages:', err);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  // Load Workspace tree & metadata
  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/developer/workspace/${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          localStorage.removeItem(LS_WS);
          setWorkspaceId('');
          return;
        }
        const data = await res.json();
        setTree(data.tree || []);
        setFileName(data.fileName || 'project.zip');
      } catch { /* empty */ }
    })();
  }, [workspaceId]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const gated = () => {
    if (!hasFeatureAccess(user, 'najeDeveloper')) {
      setShowPaywall(true);
      return true;
    }
    return false;
  };

  const handleCreateFreshSession = async () => {
    if (!user) return;
    try {
      const newRef = doc(collection(db, 'chats'));
      await setDoc(newRef, {
        ownerId: user.uid,
        type: 'najeDeveloper',
        title: 'مساحة مطور جديدة',
        createdAt: Date.now()
      });
      setSearchParams({ chatId: newRef.id });
      setTree([]);
      setFocusFile(null);
      setFocusPath('');
      setWorkspaceId('');
      localStorage.removeItem(LS_WS);
      setTab('code');
      toast.success('تم إنشاء مساحة مطور جديدة.');
    } catch {
      toast.error('تعذّر إنشاء مساحة جديدة.');
    }
  };

  const handleZip = async (file: File) => {
    if (gated()) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('الأرشيف أكبر من 8MB. احذف node_modules وdist ثم أعد الضغط.');
      return;
    }
    setUnpacking(true);
    setUnpackHint('جاري قراءة الأرشيف...');
    try {
      const zipBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('تعذّر قراءة الملف'));
        reader.readAsDataURL(file);
      });
      setUnpackHint('جاري فك الملفات — الكود أولاً ثم الوثائق...');
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/developer/unpack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ zipBase64, fileName: file.name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذّر فك الأرشيف');
      
      setWorkspaceId(data.workspaceId);
      localStorage.setItem(LS_WS, data.workspaceId);
      setTree(data.tree || []);
      setFileName(file.name);
      setUnpackStats({ skipped: data.skipped || 0, truncatedFiles: data.truncatedFiles || 0 });

      // Update Firestore chat doc with the new workspace & title
      if (chatId) {
        const updatedTitle = file.name ? `مطور: ${file.name.replace(/\.zip$/i, '')}` : 'مساحة ناجي المطور';
        setChatSessionTitle(updatedTitle);
        await updateDoc(doc(db, 'chats', chatId), {
          workspaceId: data.workspaceId,
          title: updatedTitle,
          updatedAt: Date.now()
        }).catch(() => {});
      }

      const extra = [
        data.skipped ? `تم تخطي ${data.skipped} (صور/بناء/وثائق غير كود)` : '',
        data.truncatedFiles ? `${data.truncatedFiles} ملف قُصّ لطوله` : ''
      ].filter(Boolean).join(' · ');

      // Add system message to Firestore chat
      const welcomeContent = `تم فك الأرشيف بنجاح (**${data.fileCount}** ملف).${extra ? ` ${extra}.` : ''} يمكنك فحص الكود من تبويب «الكود»، أو التوجه للدردشة مع ناجي والضغط على «افحص المشروع» لتقرير شامل ورؤوس أقلام.`;

      if (chatId && user) {
        await addDoc(collection(db, 'messages'), {
          chatId,
          ownerId: user.uid,
          role: 'assistant',
          content: welcomeContent,
          createdAt: Date.now()
        }).catch(() => {});
      }

      setUnpackHint('تم الفك بنجاح. جاهز للعمل.');
      toast.success('تم فك الأرشيف بنجاح');
      setTimeout(() => setTab('code'), 400);
    } catch (e: any) {
      toast.error(e.message || 'تعذّر فك الأرشيف');
    } finally {
      setUnpacking(false);
    }
  };

  const openFile = async (path: string) => {
    if (!workspaceId) return;
    setFocusPath(path);
    setLoadingFile(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/developer/file?workspaceId=${encodeURIComponent(workspaceId)}&path=${encodeURIComponent(path)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFocusFile(data.file);
    } catch (e: any) {
      toast.error(e.message || 'تعذّر فتح الملف');
    } finally {
      setLoadingFile(false);
    }
  };

  const exportZip = async () => {
    if (!workspaceId) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/developer/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workspaceId })
      });
      if (!res.ok) throw new Error('تعذّر التصدير');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace(/\.zip$/i, '') + '-naje.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('تعذّر تصدير الأرشيف');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remainingSlots = 4 - attachedImages.length;
    if (remainingSlots <= 0) {
      toast.error('الحد الأقصى 4 صور مرفقة دفعة واحدة');
      return;
    }
    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const readers = selectedFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(newImages => {
      setAttachedImages(prev => [...prev, ...newImages].slice(0, 4));
    });
    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const send = async (text: string, intent: 'chat' | 'audit' | 'brief' = 'chat') => {
    if (gated()) return;
    const prompt = text.trim();
    const currentImages = [...attachedImages];
    if ((!prompt && currentImages.length === 0) || sending) return;
    if (!workspaceId) {
      toast.error('ارفع أرشيف الموقع أولاً من تبويب الكود.');
      setTab('code');
      return;
    }

    setSending(true);
    setInput('');
    setAttachedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // 1. Save user message to Firestore
    if (chatId && user) {
      try {
        await addDoc(collection(db, 'messages'), {
          chatId,
          ownerId: user.uid,
          role: 'user',
          content: prompt,
          images: currentImages,
          createdAt: Date.now()
        });
      } catch (err) {
        console.warn('Error writing user message:', err);
      }
    }

    const tempAsstId = `a_${Date.now()}`;
    let accumulatedText = '';
    let streamUsage: any = null;

    // Optimistic user + assistant message if needed
    setMessages(prev => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user', content: prompt, images: currentImages },
      { id: tempAsstId, role: 'assistant', content: '' }
    ]);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/developer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          workspaceId,
          prompt,
          images: currentImages,
          intent,
          focusPath,
          history: messages.map(m => ({ role: m.role, content: m.content })).slice(-10)
        })
      });

      if (res.status === 402) {
        setShowPaywall(true);
        throw new Error('الميزة تحتاج باقة المُبتكر');
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'تعذّر الرد');
      }

      await readNajeSse(res, (chunk) => {
        if (chunk.text) {
          accumulatedText += chunk.text;
          setMessages(prev => prev.map(m => m.id === tempAsstId ? { ...m, content: accumulatedText } : m));
        }
        if (chunk.usage) {
          streamUsage = chunk.usage;
          setMessages(prev => prev.map(m => m.id === tempAsstId ? { ...m, usage: chunk.usage } : m));
        }
        if (typeof chunk.newBalance === 'number') updateBalance(chunk.newBalance);
        if (chunk.applied?.length && focusPath && chunk.applied.includes(focusPath)) {
          openFile(focusPath);
        }
      });

      // 2. Persist assistant reply to Firestore
      if (chatId && user && accumulatedText.trim()) {
        await addDoc(collection(db, 'messages'), {
          chatId,
          ownerId: user.uid,
          role: 'assistant',
          content: accumulatedText,
          usage: streamUsage,
          createdAt: Date.now()
        }).catch(() => {});
      }

    } catch (e: any) {
      const errorMsg = e.message || 'حدث خطأ أثناء معالجة الطلب.';
      setMessages(prev => prev.map(m => m.id === tempAsstId ? { ...m, content: m.content || errorMsg } : m));
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-naje-canvas overflow-hidden" dir="rtl">
      <FeaturePaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="najeDeveloper" />

      {/* ========================================================= */}
      {/* Complete High-Craft Unified Header                         */}
      {/* ========================================================= */}
      <header className="h-14 px-3 sm:px-4 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        
        {/* Right side: Sidebar toggle, Icon, Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 sm:p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            title={sidebarOpen ? "طي القائمة" : "فتح القائمة"}
          >
            <PanelRight className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
            <Code2 className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate">
                {chatSessionTitle || 'ناجي المطور'}
              </h1>
              <span className="hidden sm:inline-flex text-[9px] bg-sky-500/10 text-sky-600 dark:text-sky-400 font-extrabold px-1.5 py-0.5 rounded border border-sky-500/20 font-sans">
                باقة المُبتكر · $10
              </span>
            </div>
            <p className="text-[10px] text-gray-500 truncate hidden md:block">
              {tree.length > 0 ? `الأرشيف: ${fileName} (${tree.length} ملف)` : 'فحص وتعديل أرشيف الموقع والبرمجيات'}
            </p>
          </div>
        </div>

        {/* Left side: Tab Switcher (icons only on the far left) */}
        <div className="flex items-center gap-2">

          {/* Segmented Tabs: Icons only, positioned on far left */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200/80 dark:border-gray-800">
            <button
              onClick={() => setTab('code')}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition cursor-pointer relative ${
                tab === 'code' 
                  ? 'bg-white dark:bg-gray-800 text-sky-600 dark:text-sky-400 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
              title="الكود والملفات"
            >
              <Code2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTab('chat')}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition cursor-pointer relative ${
                tab === 'chat' 
                  ? 'bg-white dark:bg-gray-800 text-sky-600 dark:text-sky-400 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
              title="الدردشة والمناقشة"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* Body: Tab 1 (Code & Files) vs Tab 2 (Chat)                */}
      {/* ========================================================= */}
      {tab === 'code' ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[270px_1fr]">
          <aside className="border-l border-gray-200 dark:border-gray-800 overflow-y-auto p-3 bg-white/60 dark:bg-gray-950/40 flex flex-col">
            <input 
              ref={fileRef} 
              type="file" 
              accept=".zip" 
              className="hidden" 
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleZip(f);
                e.target.value = '';
              }} 
            />
            
            <button
              onClick={() => fileRef.current?.click()}
              disabled={unpacking}
              className="w-full h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 mb-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {unpacking ? <NajeSpinner className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {tree.length > 0 ? 'استبدال ZIP الموقع' : 'رفع ZIP للموقع'}
            </button>

            {unpacking && (
              <p className="text-[11px] text-sky-500 font-bold mb-3 text-center">{unpackHint}</p>
            )}

            {tree.length > 0 && (
              <button 
                onClick={exportZip} 
                className="w-full h-9 rounded-xl border border-gray-200 dark:border-gray-800 text-[11px] font-bold flex items-center justify-center gap-1.5 mb-3 hover:bg-white dark:hover:bg-gray-900 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-500" /> تصدير ZIP المحدّث
              </button>
            )}

            <div className="flex items-center justify-between text-[11px] font-extrabold text-gray-500 mb-2 px-1">
              <span className="flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-sky-500" /> شجرة الملفات
              </span>
              <span>{tree.length} ملف</span>
            </div>

            {unpackStats && (unpackStats.skipped > 0 || unpackStats.truncatedFiles > 0) && (
              <p className="text-[10px] text-amber-600 font-bold mb-2 px-1">
                {unpackStats.skipped ? `تخطي ${unpackStats.skipped}` : ''}
                {unpackStats.skipped && unpackStats.truncatedFiles ? ' · ' : ''}
                {unpackStats.truncatedFiles ? `قصّ ${unpackStats.truncatedFiles}` : ''}
              </p>
            )}

            <div className="flex-1 overflow-y-auto space-y-0.5">
              {tree.length === 0 ? (
                <div className="text-center py-10 px-2 text-gray-400 text-xs">
                  لا توجد ملفات بعد. ارفع ملف ZIP للموقع لتبدأ الفحص.
                </div>
              ) : (
                tree.map(f => (
                  <button
                    key={f.path}
                    onClick={() => openFile(f.path)}
                    className={`w-full text-right px-2.5 py-1.5 rounded-lg text-[11px] truncate flex items-center gap-1.5 transition cursor-pointer ${
                      focusPath === f.path 
                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold border border-sky-200/60 dark:border-sky-800/60' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900'
                    }`}
                    title={f.path}
                  >
                    <FileCode className="w-3.5 h-3.5 shrink-0 text-sky-500/70" />
                    <span className="truncate font-mono dir-ltr">{f.path}</span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <div className="min-h-0 overflow-hidden p-3 bg-white/30 dark:bg-black/20">
            {unpacking ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <NajeThinking size={56} />
                <p className="text-sm font-extrabold">{unpackHint}</p>
              </div>
            ) : loadingFile ? (
              <div className="h-full flex items-center justify-center">
                <NajeSpinner className="w-8 h-8 text-sky-500" />
              </div>
            ) : focusFile ? (
              <NajeCodePane 
                code={focusFile.content} 
                language={focusFile.language} 
                fileName={focusFile.path} 
                title={focusFile.path} 
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
                  <Upload className="w-8 h-8" />
                </div>
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white">ارفع ملف الموقع المضغوط (ZIP)</h2>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  ارفع أرشيف موقعك (HTML/JS/CSS/React). سيقوم ناجي بفك الملفات، استعراض الشجرة البرمجية، وفحص أقسام المشروع وتقديم تقارير دقيقة وحلول فورية.
                </p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 h-10 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> اختر ملف ZIP
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col bg-white/40 dark:bg-black/10">
          <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="max-w-md mx-auto text-center mt-12 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mx-auto border border-sky-500/20">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white">دردشة وفحص ناجي المطور</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  افحص أي قسم في كود الموقع، اسأل عن الأخطاء البرمجية، أو اطلب تعديلاً شاملاً للملفات وحفظها.
                </p>
                {tree.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    <button 
                      onClick={() => send('افحص كل أقسام المشروع وأعطني تقرير رؤوس أقلام مع مواضع التحسين.', 'audit')} 
                      disabled={sending} 
                      className="h-8 px-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-xs font-extrabold flex items-center gap-1.5 border border-sky-200/50 hover:bg-sky-100 transition cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" /> فحص شامل للمشروع
                    </button>
                    <button 
                      onClick={() => send('اكتب بريف توجيه تفصيلي دقيق للمطور أو الوكيل لإكمال المشروع.', 'brief')} 
                      disabled={sending} 
                      className="h-8 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-extrabold flex items-center gap-1.5 border border-amber-200/50 hover:bg-amber-100 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> كتابة بريف التوجيه
                    </button>
                  </div>
                )}
              </div>
            )}

            {messages.map(m => (
              <div key={m.id} className={`max-w-3xl ${m.role === 'user' ? 'mr-auto bg-sky-600 text-white rounded-2xl px-4 py-2.5 text-sm shadow-xs' : 'ml-auto w-full'}`}>
                {m.role === 'user' ? (
                  <div>
                    {m.images && m.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {m.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="مرفق"
                            className="max-h-48 max-w-[240px] rounded-xl border border-white/20 object-cover shadow-sm cursor-pointer hover:opacity-95"
                            onClick={() => window.open(img, '_blank')}
                          />
                        ))}
                      </div>
                    )}
                    {m.content && <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900/90 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4 shadow-xs">
                    <div className="prose dark:prose-invert prose-sm max-w-none text-gray-800 dark:text-gray-200">
                      {m.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      ) : (
                        sending ? <NajeThinking size={28} /> : null
                      )}
                      {m.usage && (
                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          التكلفة: {Number(m.usage.charged || 0).toFixed(2)} نقطة
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md">
            {tree.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={() => send('افحص كل أقسام المشروع وأعطني تقرير رؤوس أقلام.', 'audit')} 
                  disabled={sending} 
                  className="h-7 px-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[11px] font-extrabold flex items-center gap-1 border border-sky-200/40 hover:bg-sky-100 transition cursor-pointer"
                >
                  <Search className="w-3 h-3" /> فحص المشروع
                </button>
                <button 
                  onClick={() => send('اكتب بريف توجيه تفصيلي للمطور.', 'brief')} 
                  disabled={sending} 
                  className="h-7 px-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] font-extrabold flex items-center gap-1 border border-amber-200/40 hover:bg-amber-100 transition cursor-pointer"
                >
                  <FileText className="w-3 h-3" /> بريف توجيه
                </button>
                {focusPath && (
                  <span className="text-[10px] text-gray-500 font-mono truncate mr-auto dir-ltr">
                    الملف المحدد: {focusPath}
                  </span>
                )}
              </div>
            )}

            {/* Image Preview Strip */}
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800">
                {attachedImages.map((img, idx) => (
                  <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0 shadow-xs">
                    <img src={img} alt="مرفق" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer"
                      title="حذف الصورة"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <span className="text-[11px] text-gray-400 mr-2">
                  {attachedImages.length} من 4 صور مرفقة
                </span>
              </div>
            )}

            {/* Hidden image file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />

            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-end gap-2"
            >
              <button 
                type="button" 
                onClick={() => imageInputRef.current?.click()}
                disabled={sending || tree.length === 0 || attachedImages.length >= 4} 
                className="h-11 w-11 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-xs"
                title="إرفاق صورة"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder={tree.length === 0 ? "ارفع ملف ZIP أولاً من تبويب الكود..." : "اسأل عن الكود أو اطلب تعديلاً (Enter لسطر جديد)..."}
                disabled={sending || tree.length === 0}
                className="flex-1 min-h-[44px] max-h-[130px] overflow-y-auto resize-none rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-50 transition-colors leading-relaxed"
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    send(input);
                  }
                  // Normal Enter inserts newline naturally
                }}
              />

              <button 
                type="submit" 
                disabled={sending || (!input.trim() && attachedImages.length === 0) || tree.length === 0} 
                className="h-11 w-11 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white flex items-center justify-center disabled:opacity-40 shadow-sm shadow-sky-600/25 active:scale-95 transition-all cursor-pointer shrink-0"
                title="إرسال"
              >
                {sending ? <NajeSpinner className="w-4 h-4" /> : <ArrowUp className="w-5 h-5 stroke-[2.5]" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
