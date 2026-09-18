import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, MessageSquare, Link2, FileText, Image as ImageIcon, Send, Trash2, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '../store';
import { auth } from '../firebase';
import { toast } from '../toastStore';
import NajeSpinner from '../components/NajeSpinner';
import NajeThinking from '../components/NajeThinking';
import FeaturePaywallModal from '../components/FeaturePaywallModal';
import { hasFeatureAccess } from '../lib/featureAccess';
import { readNajeSse } from '../lib/sseRead';

type Tab = 'chat' | 'sources';
type SourceItem = { id: string; type: string; title: string; url?: string; excerpt?: string };
type ChatMsg = { id: string; role: 'user' | 'assistant'; content: string; usage?: any; searchSources?: Array<{ title: string; url: string }> };

const LS_WS = 'naje-source-workspace';

export default function NajeSource() {
  const { user, updateBalance } = useAppStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [tab, setTab] = useState<Tab>('sources');
  const [workspaceId, setWorkspaceId] = useState<string>(() => localStorage.getItem(LS_WS) || '');
  const [items, setItems] = useState<SourceItem[]>([]);
  const [allowWeb, setAllowWeb] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteUrl, setPasteUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasFeatureAccess(user, 'najeSource')) setShowPaywall(true);
  }, [user]);

  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/source/workspace/${workspaceId}`, { headers: { Authorization: `Bearer ${token}` } });
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
      if (res.status === 402) { setShowPaywall(true); throw new Error('الميزة تحتاج باقة الشرارة'); }
      if (!res.ok) throw new Error(data.error || 'تعذّر إضافة المصدر');
      setWorkspaceId(data.workspaceId);
      localStorage.setItem(LS_WS, data.workspaceId);
      setItems(prev => [data.item, ...prev.filter(i => i.id !== data.item.id)]);
      toast.success('تمت إضافة المصدر');
    } catch (e: any) {
      toast.error(e.message);
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
    } catch {
      toast.error('تعذّر الحذف');
    }
  };

  const send = async () => {
    if (gated()) return;
    const prompt = input.trim();
    if (!prompt || sending) return;
    if (!workspaceId || items.length === 0) {
      toast.error('أضف مصدراً واحداً على الأقل.');
      setTab('sources');
      return;
    }
    const asstId = `a_${Date.now()}`;
    setMessages(prev => [...prev, { id: `u_${Date.now()}`, role: 'user', content: prompt }, { id: asstId, role: 'assistant', content: '' }]);
    setInput('');
    setSending(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/source/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          workspaceId,
          prompt,
          allowWeb,
          history: messages.map(m => ({ role: m.role, content: m.content })).slice(-10)
        })
      });
      if (res.status === 402) { setShowPaywall(true); throw new Error('الميزة مقفلة'); }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'تعذّر الرد');
      }
      await readNajeSse(res, (chunk) => {
        if (chunk.text) setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: m.content + chunk.text } : m));
        if (chunk.searchSources) setMessages(prev => prev.map(m => m.id === asstId ? { ...m, searchSources: chunk.searchSources } : m));
        if (chunk.usage) setMessages(prev => prev.map(m => m.id === asstId ? { ...m, usage: chunk.usage } : m));
        if (typeof chunk.newBalance === 'number') updateBalance(chunk.newBalance);
      });
    } catch (e: any) {
      setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: m.content || e.message } : m));
    } finally {
      setSending(false);
    }
  };

  const onFile = async (file: File, asImage: boolean) => {
    if (file.size > 500_000) {
      toast.error('الملف أكبر من 500KB.');
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
      const text = await file.text();
      await addSource({ type: 'text', title: file.name, content: text });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#FAF9FC] dark:bg-[#0d0f12] overflow-hidden" dir="rtl">
      <FeaturePaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="najeSource" />

      <div className="h-14 px-4 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
          <button onClick={() => setTab('chat')} className={`h-9 px-4 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${tab === 'chat' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm' : 'text-gray-500'}`}>
            <MessageSquare className="w-4 h-4" /> الدردشة
          </button>
          <button onClick={() => setTab('sources')} className={`h-9 px-4 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${tab === 'sources' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm' : 'text-gray-500'}`}>
            <BookOpen className="w-4 h-4" /> المصادر
          </button>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-sm font-extrabold text-gray-900 dark:text-white">ناجي من مصادرك</div>
          <div className="text-[10px] text-gray-500">ما في المصدر ما ينقال · باقة الشرارة</div>
        </div>
      </div>

      {tab === 'sources' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <form className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 space-y-2" onSubmit={(e) => { e.preventDefault(); if (pasteUrl.trim()) { addSource({ type: 'url', url: pasteUrl.trim(), title: pasteUrl.trim() }); setPasteUrl(''); } }}>
              <div className="text-xs font-extrabold flex items-center gap-1.5"><Link2 className="w-4 h-4 text-emerald-500" /> رابط</div>
              <input value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)} placeholder="https://..." className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 text-sm" dir="ltr" />
              <button disabled={adding} className="h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-extrabold">{adding ? '...' : 'إضافة الرابط'}</button>
            </form>
            <form className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 space-y-2" onSubmit={(e) => { e.preventDefault(); if (pasteText.trim()) { addSource({ type: 'text', title: 'نص ملصق', content: pasteText }); setPasteText(''); } }}>
              <div className="text-xs font-extrabold flex items-center gap-1.5"><FileText className="w-4 h-4 text-emerald-500" /> نص</div>
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={3} placeholder="الصق المادة هنا..." className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm" />
              <button disabled={adding} className="h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-extrabold">حفظ النص</button>
            </form>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".txt,.md,.csv,.json,.html" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f, false); e.target.value = ''; }} />
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f, true); e.target.value = ''; }} />
            <button onClick={() => fileRef.current?.click()} className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> ملف نصي</button>
            <button onClick={() => imgRef.current?.click()} className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> صورة</button>
          </div>
          <div className="space-y-2">
            {items.length === 0 && <p className="text-xs text-gray-500 text-center py-8">لا مصادر بعد. أضف رابطاً أو نصاً أو صورة — النموذج ما بيخترع خارجها.</p>}
            {items.map(it => (
              <div key={it.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-extrabold truncate">{it.title}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{it.type}{it.url ? ` · ${it.url}` : ''}</div>
                  {it.excerpt && <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{it.excerpt}</p>}
                </div>
                <button onClick={() => removeItem(it.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="max-w-lg mx-auto text-center mt-12 space-y-2">
                <BookOpen className="w-10 h-10 mx-auto text-emerald-400" />
                <p className="text-sm font-extrabold">اسأل فقط مما في المصادر</p>
                <p className="text-xs text-gray-500">إذا ما لقى الجواب: «لم أجد في المصادر.» البحث برا المصادر مقفل تلقائياً.</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`max-w-3xl ${m.role === 'user' ? 'mr-auto bg-emerald-600 text-white rounded-2xl px-4 py-2.5 text-sm' : 'ml-auto w-full'}`}>
                {m.role === 'user' ? m.content : (
                  <div className="prose dark:prose-invert prose-sm max-w-none text-gray-800 dark:text-gray-200">
                    {m.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown> : (sending ? <NajeThinking size={28} /> : null)}
                    {m.searchSources && m.searchSources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.searchSources.map(s => (
                          <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">{s.title}</a>
                        ))}
                      </div>
                    )}
                    {m.usage && <div className="mt-2 text-[10px] font-bold text-amber-600">التكلفة: {Number(m.usage.charged || 0).toFixed(2)} نقطة</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 space-y-2">
            <label className="flex items-center justify-between gap-3 text-[11px] font-bold text-gray-600 dark:text-gray-300 px-1">
              <span>السماح بالبحث خارج المصادر</span>
              <button
                type="button"
                onClick={() => setAllowWeb(v => !v)}
                className={`relative w-11 h-6 rounded-full transition ${allowWeb ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                aria-pressed={allowWeb}
              >
                <span className={`absolute top-0.5 ${allowWeb ? 'left-0.5' : 'right-0.5'} w-5 h-5 rounded-full bg-white shadow`} />
              </button>
            </label>
            <p className="text-[10px] text-gray-400 px-1">{allowWeb ? 'إذا ما لقى في المصادر، يبحث بالإنترنت ويبدأ: لم أجد في المصادر، وبحثت في الإنترنت والنتيجة…' : 'مقفل. الرد الوحيد خارج المصادر: لم أجد في المصادر.'}</p>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="اسأل من المصادر فقط..."
                className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button type="submit" disabled={sending || !input.trim()} className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40">
                {sending ? <NajeSpinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
