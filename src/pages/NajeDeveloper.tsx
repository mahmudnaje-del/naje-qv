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
import StudioHeader from '../components/StudioHeader';
import FeaturePaywallModal from '../components/FeaturePaywallModal';
import { hasFeatureAccess } from '../lib/featureAccess';
import { readNajeSse } from '../lib/sseRead';
import { useI18n } from '../i18n';
import SmokeChatWrapper from '../components/chat/SmokeChatWrapper';
import NajeModelTierSelector, { ModelTier } from '../components/NajeModelTierSelector';
import { useLivePlaceholder, DEVELOPER_PHRASES } from '../hooks/useLivePlaceholder';

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
  const { isRtl, t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatId = searchParams.get('chatId');

  const [showPaywall, setShowPaywall] = useState(false);
  const [tab, setTab] = useState<Tab>('code');
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [modelTier, setModelTier] = useState<ModelTier>('lite');
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
  const dynamicPlaceholder = useLivePlaceholder(DEVELOPER_PHRASES);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [chatSessionTitle, setChatSessionTitle] = useState(() => t('tools.developer.sessionTitle'));

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
          // Check if user has an existing developer chat session first
          let existingChatId: string | null = null;
          try {
            const q = query(
              collection(db, 'chats'),
              where('ownerId', '==', user.uid),
              where('type', '==', 'najeDeveloper')
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              const sorted = snap.docs.sort((a, b) => (b.data().createdAt || 0) - (a.data().createdAt || 0));
              existingChatId = sorted[0].id;
            }
          } catch (e) {
            console.warn('Error querying existing developer chats:', e);
          }

          if (existingChatId && active) {
            setSearchParams({ chatId: existingChatId }, { replace: true });
            return;
          }

          // If no existing chat, start a fresh new chat session
          const newRef = doc(collection(db, 'chats'));
          await setDoc(newRef, {
            ownerId: user.uid,
            type: 'najeDeveloper',
            title: t('tools.developer.sessionTitle'),
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

  // Listen to messages for current chatId with unindexed fallback
  useEffect(() => {
    if (!chatId || !user) {
      setMessages([]);
      return;
    }

    let unsubFallback: (() => void) | null = null;

    const processDocs = (snapshot: any) => {
      const msgs: ChatMsg[] = snapshot.docs.map((docSnap: any) => {
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
      msgs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setMessages(msgs);
    };

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      processDocs(snapshot);
    }, (err) => {
      console.warn('Primary messages query notice, trying unindexed fallback:', err?.message || err);
      const fallbackQ = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId)
      );
      unsubFallback = onSnapshot(fallbackQ, (fallbackSnap) => {
        processDocs(fallbackSnap);
      }, (fErr) => {
        console.error('Fallback messages query failed:', fErr);
      });
    });

    return () => {
      unsubscribe();
      if (unsubFallback) unsubFallback();
    };
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
        title: t('tools.developer.newSpace'),
        createdAt: Date.now()
      });
      setSearchParams({ chatId: newRef.id });
      setTree([]);
      setFocusFile(null);
      setFocusPath('');
      setWorkspaceId('');
      localStorage.removeItem(LS_WS);
      setTab('code');
      toast.success(t('tools.developer.newSpaceOk'));
    } catch {
      toast.error(t('tools.developer.newSpaceFail'));
    }
  };

  const handleZip = async (file: File) => {
    if (gated()) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error(t('tools.developer.tooBig'));
      return;
    }
    setUnpacking(true);
    setUnpackHint(t('tools.developer.reading'));
    try {
      const zipBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error(t('tools.developer.readFail')));
        reader.readAsDataURL(file);
      });
      setUnpackHint(t('tools.developer.unpacking'));
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/developer/unpack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ zipBase64, fileName: file.name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('tools.developer.unpackFail'));
      
      setWorkspaceId(data.workspaceId);
      localStorage.setItem(LS_WS, data.workspaceId);
      setTree(data.tree || []);
      setFileName(file.name);
      setUnpackStats({ skipped: data.skipped || 0, truncatedFiles: data.truncatedFiles || 0 });

      // Update Firestore chat doc with the new workspace & title
      if (chatId) {
        const updatedTitle = file.name ? t('tools.developer.titlePrefix', { name: file.name.replace(/\.zip$/i, '') }) : t('tools.developer.sessionTitle');
        setChatSessionTitle(updatedTitle);
        await updateDoc(doc(db, 'chats', chatId), {
          workspaceId: data.workspaceId,
          title: updatedTitle,
          updatedAt: Date.now()
        }).catch(() => {});
      }

      const extra = [
        data.skipped ? t('tools.developer.skippedExtra', { count: data.skipped }) : '',
        data.truncatedFiles ? t('tools.developer.truncatedExtra', { count: data.truncatedFiles }) : ''
      ].filter(Boolean).join(' · ');

      const welcomeContent = t('tools.developer.unpacked', {
        count: data.fileCount,
        extra: extra ? ` ${extra}.` : ''
      });

      if (chatId && user) {
        await addDoc(collection(db, 'messages'), {
          chatId,
          ownerId: user.uid,
          role: 'assistant',
          content: welcomeContent,
          createdAt: Date.now()
        }).catch(() => {});
      }

      setUnpackHint(t('tools.developer.unpackDone'));
      toast.success(t('tools.developer.unpackOk'));
      setTimeout(() => setTab('code'), 400);
    } catch (e: any) {
      toast.error(e.message || t('tools.developer.unpackFail'));
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
      toast.error(e.message || t('tools.developer.openFail'));
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
      if (!res.ok) throw new Error(t('tools.developer.exportFail'));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace(/\.zip$/i, '') + '-naje.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('tools.developer.exportArchiveFail'));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remainingSlots = 4 - attachedImages.length;
    if (remainingSlots <= 0) {
      toast.error(t('tools.developer.maxImages'));
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
      toast.error(t('tools.developer.needZip'));
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
          modelTier,
          history: messages.map(m => ({ role: m.role, content: m.content })).slice(-10)
        })
      });

      if (res.status === 402) {
        setShowPaywall(true);
        throw new Error(t('tools.developer.needPlan'));
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t('tools.developer.replyFail'));
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
      const errorMsg = e.message || t('tools.developer.processError');
      setMessages(prev => prev.map(m => m.id === tempAsstId ? { ...m, content: m.content || errorMsg } : m));
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-naje-canvas overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      <FeaturePaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="najeDeveloper" />

      <StudioHeader
        showNotifications={false}
        showBalance={false}
        title={chatSessionTitle || 'Naje Developer'}
        badge={t('studio.codeSpace')}
        subtitle={tree.length > 0 ? t('tools.developer.subtitleArchive', { name: fileName, count: tree.length }) : t('tools.developer.subtitleEmpty')}
        icon={Code2}
        iconColorClass="text-sky-600 dark:text-sky-400"
        iconBgClass="bg-sky-500/10 border-sky-500/20"
        badgeClass="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
        theme="canvas"
        actions={
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200/80 dark:border-gray-800">
            <button
              onClick={() => setTab('code')}
              className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                tab === 'code' 
                  ? 'bg-white dark:bg-gray-800 text-sky-600 dark:text-sky-400 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
              title={t('studio.codeTab')}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('studio.codeTab')}</span>
            </button>

            <button
              onClick={() => setTab('chat')}
              className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                tab === 'chat' 
                  ? 'bg-white dark:bg-gray-800 text-sky-600 dark:text-sky-400 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
              title={t('studio.chatTab')}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('studio.chatTab')}</span>
            </button>
          </div>
        }
      />

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
              {tree.length > 0 ? t('tools.developer.replaceZip') : t('tools.developer.uploadZip')}
            </button>

            {unpacking && (
              <p className="text-[11px] text-sky-500 font-bold mb-3 text-center">{unpackHint}</p>
            )}

            {tree.length > 0 && (
              <button 
                onClick={exportZip} 
                className="w-full h-9 rounded-xl border border-gray-200 dark:border-gray-800 text-[11px] font-bold flex items-center justify-center gap-1.5 mb-3 hover:bg-white dark:hover:bg-gray-900 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-500" /> {t('tools.developer.exportZip')}
              </button>
            )}

            <div className="flex items-center justify-between text-[11px] font-extrabold text-gray-500 mb-2 px-1">
              <span className="flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-sky-500" /> {t('tools.developer.fileTree')}
              </span>
              <span>{t('tools.developer.fileCount', { count: tree.length })}</span>
            </div>

            {unpackStats && (unpackStats.skipped > 0 || unpackStats.truncatedFiles > 0) && (
              <p className="text-[10px] text-amber-600 font-bold mb-2 px-1">
                {unpackStats.skipped ? t('tools.developer.skippedStat', { count: unpackStats.skipped }) : ''}
                {unpackStats.skipped && unpackStats.truncatedFiles ? ' · ' : ''}
                {unpackStats.truncatedFiles ? t('tools.developer.truncatedStat', { count: unpackStats.truncatedFiles }) : ''}
              </p>
            )}

            <div className="flex-1 overflow-y-auto space-y-0.5">
              {tree.length === 0 ? (
                <div className="text-center py-10 px-2 text-gray-400 text-xs">
                  {t('tools.developer.noFiles')}
                </div>
              ) : (
                tree.map(f => (
                  <button
                    key={f.path}
                    onClick={() => openFile(f.path)}
                    className={`w-full text-start px-2.5 py-1.5 rounded-lg text-[11px] truncate flex items-center gap-1.5 transition cursor-pointer ${
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
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white">{t('tools.developer.uploadTitle')}</h2>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  {t('tools.developer.uploadDesc')}
                </p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 h-10 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> {t('tools.developer.chooseZip')}
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
                <p className="text-sm font-extrabold text-gray-900 dark:text-white">{t('tools.developer.chatTitle')}</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t('tools.developer.chatDesc')}
                </p>
                {tree.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    <button 
                      onClick={() => send(t('tools.developer.auditPrompt'), 'audit')} 
                      disabled={sending} 
                      className="h-8 px-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-xs font-extrabold flex items-center gap-1.5 border border-sky-200/50 hover:bg-sky-100 transition cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" /> {t('tools.developer.auditFull')}
                    </button>
                    <button 
                      onClick={() => send(t('tools.developer.briefPrompt'), 'brief')} 
                      disabled={sending} 
                      className="h-8 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-extrabold flex items-center gap-1.5 border border-amber-200/50 hover:bg-amber-100 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> {t('tools.developer.briefFull')}
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
                            alt={t('tools.developer.attachmentAlt')}
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
                          {t('tools.developer.cost', { points: Number(m.usage.charged || 0).toFixed(2) })}
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
                  onClick={() => send(t('tools.developer.auditShortPrompt'), 'audit')} 
                  disabled={sending} 
                  className="h-7 px-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[11px] font-extrabold flex items-center gap-1 border border-sky-200/40 hover:bg-sky-100 transition cursor-pointer"
                >
                  <Search className="w-3 h-3" /> {t('tools.developer.auditShort')}
                </button>
                <button 
                  onClick={() => send(t('tools.developer.briefShortPrompt'), 'brief')} 
                  disabled={sending} 
                  className="h-7 px-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] font-extrabold flex items-center gap-1 border border-amber-200/40 hover:bg-amber-100 transition cursor-pointer"
                >
                  <FileText className="w-3 h-3" /> {t('tools.developer.briefShort')}
                </button>
                {focusPath && (
                  <span className="text-[10px] text-gray-500 font-mono truncate mr-auto dir-ltr">
                    {t('tools.developer.focusFile', { path: focusPath })}
                  </span>
                )}
              </div>
            )}

            {/* Image Preview Strip */}
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800">
                {attachedImages.map((img, idx) => (
                  <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0 shadow-xs">
                    <img src={img} alt={t('tools.developer.attachmentAlt')} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer"
                      title={t('tools.developer.removeImage')}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <span className="text-[11px] text-gray-400 mr-2">
                  {t('tools.developer.imagesAttached', { count: attachedImages.length })}
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

            <SmokeChatWrapper className="w-full" chatType="najeDeveloper">
            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm p-1.5 space-y-1">
              {/* Badges placed on their own row - fitted naturally on a single line with smooth scroll */}
              <div className="flex items-center justify-between gap-1 sm:gap-2 px-1.5 pt-0.5 empty:hidden relative z-30 max-w-full overflow-x-auto scrollbar-none pb-0.5">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap shrink-0">
                  <NajeModelTierSelector
                    value={modelTier}
                    onChange={setModelTier}
                    disabled={sending}
                    className="shrink-0"
                  />
                </div>
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="flex items-end gap-2"
              >
              <button 
                type="button" 
                onClick={() => imageInputRef.current?.click()}
                disabled={sending || tree.length === 0 || attachedImages.length >= 4} 
                className="h-11 w-11 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-xs"
                title={t('tools.developer.attachImage')}
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder={dynamicPlaceholder || (tree.length === 0 ? t('tools.developer.placeholderEmpty') : t('tools.developer.placeholderReady'))}
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
                title={t('tools.agent.send')}
              >
                {sending ? <NajeSpinner className="w-4 h-4" /> : <ArrowUp className="w-5 h-5 stroke-[2.5]" />}
              </button>
            </form>
            </div>
            </SmokeChatWrapper>
          </div>
        </div>
      )}
    </div>
  );
}
