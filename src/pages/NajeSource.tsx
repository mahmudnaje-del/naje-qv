import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BookOpen, MessageSquare, Link2, FileText, Image as ImageIcon, 
  ArrowUp, Send, Trash2, PanelRight, Sparkles, RefreshCw, CheckCircle2, X 
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
import StudioHeader from '../components/StudioHeader';
import FeaturePaywallModal from '../components/FeaturePaywallModal';
import { hasFeatureAccess } from '../lib/featureAccess';
import { readNajeSse } from '../lib/sseRead';

type Tab = 'sources' | 'chat';
type SourceItem = { id: string; type: string; title: string; url?: string; excerpt?: string };
type ChatMsg = { 
  id: string; 
  role: 'user' | 'assistant'; 
  content: string; 
  images?: string[]; 
  usage?: any; 
  searchSources?: Array<{ title: string; url: string }>;
  createdAt?: number;
};

const LS_WS = 'naje-source-workspace';

export default function NajeSource() {
  const { user, sidebarOpen, setSidebarOpen, updateBalance, setNewChatModalOpen } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatId = searchParams.get('chatId');

  const [showPaywall, setShowPaywall] = useState(false);
  const [tab, setTab] = useState<Tab>('sources');
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [items, setItems] = useState<SourceItem[]>([]);
  const [allowWeb, setAllowWeb] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteUrl, setPasteUrl] = useState('');
  const [chatSessionTitle, setChatSessionTitle] = useState('مساحة ناجي من مصادرك');

  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const chatImageRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea up to 5 lines (~130px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 130)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (!hasFeatureAccess(user, 'najeSource')) setShowPaywall(true);
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
              setItems([]);
              localStorage.removeItem(LS_WS);
            }
          }
        } else {
          // If no chatId, ALWAYS start a fresh new chat session like all other chats
          const newRef = doc(collection(db, 'chats'));
          await setDoc(newRef, {
            ownerId: user.uid,
            type: 'najeSource',
            title: 'مساحة ناجي من مصادرك',
            createdAt: Date.now()
          });
          if (!active) return;
          setWorkspaceId('');
          setItems([]);
          setMessages([]);
          localStorage.removeItem(LS_WS);
          setSearchParams({ chatId: newRef.id }, { replace: true });
        }
      } catch (err) {
        console.warn('Error syncing source chat session:', err);
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
          searchSources: d.searchSources,
          createdAt: d.createdAt
        };
      });
      setMessages(msgs);
    }, (err) => {
      console.warn('Error listening to source messages:', err);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  // Load Workspace items from server
  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/source/workspace/${workspaceId}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (!res.ok) {
          localStorage.removeItem(LS_WS);
          setWorkspaceId('');
          return;
        }
        const data = await res.json();
        setItems(data.items || []);
      } catch { /* empty */ }
    })();
  }, [workspaceId]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const gated = () => {
    if (!hasFeatureAccess(user, 'najeSource')) {
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
        type: 'najeSource',
        title: 'مساحة مصادر جديدة',
        createdAt: Date.now()
      });
      setSearchParams({ chatId: newRef.id });
      setItems([]);
      setWorkspaceId('');
      localStorage.removeItem(LS_WS);
      setTab('sources');
      toast.success('تم إنشاء مساحة مصادر جديدة.');
    } catch {
      toast.error('تعذّر إنشاء مساحة جديدة.');
    }
  };

  const addSource = async (payload: any) => {
    if (gated()) return;
    setAdding(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/source/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workspaceId, ...payload })
      });
      const data = await res.json();
      if (res.status === 402) { 
        setShowPaywall(true); 
        throw new Error('الميزة تحتاج باقة الشرارة'); 
      }
      if (!res.ok) throw new Error(data.error || 'تعذّر إضافة المصدر');

      setWorkspaceId(data.workspaceId);
      localStorage.setItem(LS_WS, data.workspaceId);
      setItems(prev => [data.item, ...prev.filter(i => i.id !== data.item.id)]);

      // Update Firestore chat doc
      if (chatId) {
        const titleCandidate = data.item.title ? `مصادر: ${data.item.title.slice(0, 24)}` : 'مساحة ناجي من مصادرك';
        setChatSessionTitle(titleCandidate);
        await updateDoc(doc(db, 'chats', chatId), {
          workspaceId: data.workspaceId,
          title: titleCandidate,
          updatedAt: Date.now()
        }).catch(() => {});
      }

      toast.success('تمت إضافة المصدر بنجاح');
    } catch (e: any) {
      toast.error(e.message || 'تعذّر إضافة المصدر');
    } finally {
      setAdding(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!workspaceId) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/source/item', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workspaceId, itemId })
      });
      setItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('تم حذف المصدر.');
    } catch {
      toast.error('تعذّر الحذف');
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const fileNameLower = file.name.toLowerCase();
      const isDoc = fileNameLower.endsWith('.pdf') || fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc') || file.type.includes('pdf') || file.type.includes('word');
      if (isDoc) {
        await onFile(file, false);
      } else {
        const remainingSlots = 4 - attachedImages.length;
        if (remainingSlots <= 0) {
          toast.error('الحد الأقصى 4 صور مرفقة دفعة واحدة');
          break;
        }
        const reader = new FileReader();
        reader.onload = () => {
          setAttachedImages(prev => [...prev, String(reader.result)].slice(0, 4));
        };
        reader.readAsDataURL(file);
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const send = async () => {
    if (gated()) return;
    const prompt = input.trim();
    const currentImages = [...attachedImages];
    if ((!prompt && currentImages.length === 0) || sending) return;
    if (!workspaceId || items.length === 0) {
      toast.error('أضف مصدراً واحداً على الأقل من تبويب المصادر.');
      setTab('sources');
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
        console.warn('Error saving user message:', err);
      }
    }

    const asstId = `a_${Date.now()}`;
    let accumulatedText = '';
    let streamUsage: any = null;
    let streamSources: any = null;

    // Optimistic user & assistant message
    setMessages(prev => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user', content: prompt, images: currentImages },
      { id: asstId, role: 'assistant', content: '' }
    ]);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/source/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          workspaceId,
          prompt,
          images: currentImages,
          allowWeb,
          history: messages.map(m => ({ role: m.role, content: m.content })).slice(-10)
        })
      });

      if (res.status === 402) { 
        setShowPaywall(true); 
        throw new Error('الميزة مقفلة'); 
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'تعذّر الرد');
      }

      await readNajeSse(res, (chunk) => {
        if (chunk.text) {
          accumulatedText += chunk.text;
          setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: accumulatedText } : m));
        }
        if (chunk.searchSources) {
          streamSources = chunk.searchSources;
          setMessages(prev => prev.map(m => m.id === asstId ? { ...m, searchSources: chunk.searchSources } : m));
        }
        if (chunk.usage) {
          streamUsage = chunk.usage;
          setMessages(prev => prev.map(m => m.id === asstId ? { ...m, usage: chunk.usage } : m));
        }
        if (typeof chunk.newBalance === 'number') updateBalance(chunk.newBalance);
      });

      // 2. Persist assistant reply to Firestore
      if (chatId && user && accumulatedText.trim()) {
        await addDoc(collection(db, 'messages'), {
          chatId,
          ownerId: user.uid,
          role: 'assistant',
          content: accumulatedText,
          searchSources: streamSources,
          usage: streamUsage,
          createdAt: Date.now()
        }).catch(() => {});
      }

    } catch (e: any) {
      const errorMsg = e.message || 'حدث خطأ أثناء الرد.';
      setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: m.content || errorMsg } : m));
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const onFile = async (file: File, asImage: boolean) => {
    if (file.size > 15 * 1024 * 1024) {
      toast.error('حجم الملف يتجاوز الحد المسموح (15MB).');
      return;
    }
    if (asImage) {
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      await addSource({ type: 'image', title: file.name, mimeType: file.type, data, caption: file.name });
    } else {
      const fileNameLower = file.name.toLowerCase();
      const isDocOrPdf = fileNameLower.endsWith('.pdf') || fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc') || file.type.includes('pdf') || file.type.includes('word');
      
      if (isDocOrPdf) {
        toast.info(`جاري استخراج وقراءة المستند (${file.name})...`);
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = reject;
          r.readAsDataURL(file);
        });
        await addSource({
          type: fileNameLower.endsWith('.pdf') ? 'pdf' : 'doc',
          title: file.name,
          fileBase64,
          mimeType: file.type,
          fileName: file.name
        });
      } else {
        const text = await file.text();
        await addSource({ type: 'text', title: file.name, content: text });
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-naje-canvas overflow-hidden" dir="rtl">
      <FeaturePaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="najeSource" />

      <StudioHeader
        title={chatSessionTitle || 'Naje Source'}
        badge="مصادر موثقة"
        subtitle={items.length > 0 ? `${items.length} مصدر نشط · استجابة صارمة وموثقة` : 'ما في المصدر ما ينقال · بحث حازم وموثق'}
        icon={BookOpen}
        iconColorClass="text-emerald-600 dark:text-emerald-400"
        iconBgClass="bg-emerald-500/10 border-emerald-500/20"
        badgeClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        theme="canvas"
        actions={
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200/80 dark:border-gray-800">
            <button
              onClick={() => setTab('sources')}
              className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                tab === 'sources' 
                  ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
              title="المصادر المعتمدة"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">المصادر</span>
            </button>

            <button
              onClick={() => setTab('chat')}
              className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                tab === 'chat' 
                  ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
              title="الدردشة والمناقشة"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الدردشة</span>
            </button>
          </div>
        }
      />

      {/* ========================================================= */}
      {/* Body: Tab 1 (Sources) vs Tab 2 (Chat)                     */}
      {/* ========================================================= */}
      {tab === 'sources' ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              أضف المستندات، الروابط، النصوص، أو الصور المرجعية. ناجي سيعتمد عليها حصرًا للإجابة، ولن يتكهن بمعلومات خارج مصادرك إلا إذا أذنت له بذلك صراحة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form 
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-xs space-y-3" 
              onSubmit={(e) => { 
                e.preventDefault(); 
                if (pasteUrl.trim()) { 
                  addSource({ type: 'url', url: pasteUrl.trim(), title: pasteUrl.trim() }); 
                  setPasteUrl(''); 
                } 
              }}
            >
              <div className="text-xs font-extrabold flex items-center gap-1.5 text-gray-900 dark:text-white">
                <Link2 className="w-4 h-4 text-emerald-500" /> إضافة رابط مرجعي
              </div>
              <input 
                value={pasteUrl} 
                onChange={(e) => setPasteUrl(e.target.value)} 
                placeholder="https://example.com/article" 
                className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" 
                dir="ltr" 
              />
              <button 
                disabled={adding || !pasteUrl.trim()} 
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold disabled:opacity-50 transition cursor-pointer"
              >
                {adding ? 'جاري الاستيراد...' : 'إضافة الرابط'}
              </button>
            </form>

            <form 
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-xs space-y-3" 
              onSubmit={(e) => { 
                e.preventDefault(); 
                if (pasteText.trim()) { 
                  addSource({ type: 'text', title: 'نص مضاف', content: pasteText }); 
                  setPasteText(''); 
                } 
              }}
            >
              <div className="text-xs font-extrabold flex items-center gap-1.5 text-gray-900 dark:text-white">
                <FileText className="w-4 h-4 text-emerald-500" /> لصق مادة نصية مباشرة
              </div>
              <textarea 
                value={pasteText} 
                onChange={(e) => setPasteText(e.target.value)} 
                rows={3} 
                placeholder="الصق أي مقال، محضر اجتماع، وثيقة أو نصوص هنا..." 
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none" 
              />
              <button 
                disabled={adding || !pasteText.trim()} 
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold disabled:opacity-50 transition cursor-pointer"
              >
                {adding ? 'جاري الحفظ...' : 'حفظ النص كمصدر'}
              </button>
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input 
              ref={fileRef} 
              type="file" 
              accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.html,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
              className="hidden" 
              onChange={(e) => { 
                const f = e.target.files?.[0]; 
                if (f) onFile(f, false); 
                e.target.value = ''; 
              }} 
            />
            <input 
              ref={imgRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => { 
                const f = e.target.files?.[0]; 
                if (f) onFile(f, true); 
                e.target.value = ''; 
              }} 
            />

            <button 
              onClick={() => fileRef.current?.click()} 
              disabled={adding}
              className="h-9 px-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>رفع مستند (Word, PDF, نصوص)</span>
            </button>

            <button 
              onClick={() => imgRef.current?.click()} 
              className="h-9 px-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span>رفع صورة أو وثيقة مصورة</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <span>المصادر المعتمدة حالياً</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-600 font-sans font-bold px-1.5 py-0.5 rounded">
                  {items.length}
                </span>
              </h3>
              {items.length > 0 && (
                <button
                  onClick={() => setTab('chat')}
                  className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
                >
                  الانتقال للدردشة والمناقشة ←
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                <BookOpen className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">لا توجد مصادر مضافة بعد.</p>
                <p className="text-[11px] text-gray-400 mt-1">أضف رابطاً أو نصاً أو ملفاً أعلاه لتبدأ البحث الصارم.</p>
              </div>
            ) : (
              items.map(it => (
                <div 
                  key={it.id} 
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3.5 flex items-start justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                      {it.title}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {it.type}{it.url ? ` · ${it.url}` : ''}
                    </div>
                    {it.excerpt && (
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {it.excerpt}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => removeItem(it.id)} 
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                    title="حذف المصدر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col bg-white/40 dark:bg-black/10">
          <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="max-w-md mx-auto text-center mt-12 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <BookOpen className="w-7 h-7" />
                </div>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white">اسأل حصراً مما في المصادر</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  إذا لم يجد ناجي إجابة مباشرة من مصادرك، سيرد بحزم: «لم أجد في المصادر.» ولا مجال للتخمين أو المعلومات غير المؤكدة.
                </p>
                {items.length === 0 && (
                  <div className="pt-2">
                    <button
                      onClick={() => setTab('sources')}
                      className="h-8 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition cursor-pointer"
                    >
                      أضف مصادر أولاً
                    </button>
                  </div>
                )}
              </div>
            )}

            {messages.map(m => (
              <div key={m.id} className={`max-w-3xl ${m.role === 'user' ? 'mr-auto bg-emerald-600 text-white rounded-2xl px-4 py-2.5 text-sm shadow-xs' : 'ml-auto w-full'}`}>
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
                      
                      {m.searchSources && m.searchSources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1.5">
                          {m.searchSources.map(s => (
                            <a 
                              key={s.url} 
                              href={s.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold"
                            >
                              {s.title}
                            </a>
                          ))}
                        </div>
                      )}

                      {m.usage && (
                        <div className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          التكلفة: {Number(m.usage.charged || 0).toFixed(2)} نقطة
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-gray-600 dark:text-gray-300 px-1">
              <span className="flex items-center gap-1.5">
                <span>السماح بالبحث خارج المصادر (الويب)</span>
              </span>
              <button
                type="button"
                onClick={() => setAllowWeb(v => !v)}
                className={`relative w-10 h-5 rounded-full transition cursor-pointer ${allowWeb ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                aria-pressed={allowWeb}
              >
                <span className={`absolute top-0.5 ${allowWeb ? 'left-0.5' : 'right-0.5'} w-4 h-4 rounded-full bg-white shadow-xs transition-all`} />
              </button>
            </div>

            <p className="text-[10px] text-gray-400 px-1">
              {allowWeb 
                ? 'مفعل: إذا لم يجد في مصادرك، يبحث بالإنترنت ويبدأ رده ببيان أنه استعان بالويب.' 
                : 'مقفل: الرد الصارم فقط مما هو موثق في مصادرك. إذا لم يجد، سيقول: لم أجد في المصادر.'}
            </p>

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

            {/* Hidden image/file input */}
            <input
              ref={chatImageRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />

            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
              <button 
                type="button" 
                onClick={() => chatImageRef.current?.click()}
                disabled={sending || items.length === 0 || attachedImages.length >= 4} 
                className="h-11 w-11 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-xs"
                title="إرفاق صورة أو مستند (Word / PDF)"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder={items.length === 0 ? "أضف مصادر أولاً من تبويب المصادر..." : "اسأل استناداً إلى مصادرك فقط (Enter لسطر جديد)..."}
                disabled={sending || items.length === 0}
                className="flex-1 min-h-[44px] max-h-[130px] overflow-y-auto resize-none rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 transition-colors leading-relaxed"
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    send();
                  }
                  // Normal Enter inserts newline naturally
                }}
              />

              <button 
                type="submit" 
                disabled={sending || (!input.trim() && attachedImages.length === 0) || items.length === 0} 
                className="h-11 w-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white flex items-center justify-center disabled:opacity-40 shadow-sm shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer shrink-0"
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
