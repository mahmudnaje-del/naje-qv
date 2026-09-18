import React, { useEffect, useRef, useState } from 'react';
import { Code2, MessageSquare, Upload, FileCode, FolderTree, Send, Download, Search, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '../store';
import { auth } from '../firebase';
import { toast } from '../toastStore';
import NajeSpinner from '../components/NajeSpinner';
import NajeThinking from '../components/NajeThinking';
import NajeCodePane from '../components/NajeCodePane';
import FeaturePaywallModal from '../components/FeaturePaywallModal';
import { hasFeatureAccess } from '../lib/featureAccess';
import { readNajeSse } from '../lib/sseRead';

type Tab = 'code' | 'chat';
type TreeFile = { path: string; language: string; bytes: number; truncated?: boolean };
type ChatMsg = { id: string; role: 'user' | 'assistant'; content: string; usage?: any };

const LS_WS = 'naje-developer-workspace';

export default function NajeDeveloper() {
  const { user, updateBalance } = useAppStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [tab, setTab] = useState<Tab>('code');
  const [workspaceId, setWorkspaceId] = useState<string>(() => localStorage.getItem(LS_WS) || '');
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
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasFeatureAccess(user, 'najeDeveloper')) setShowPaywall(true);
  }, [user]);

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
      const extra = [
        data.skipped ? `تم تخطي ${data.skipped} (صور/بناء/وثائق غير كود)` : '',
        data.truncatedFiles ? `${data.truncatedFiles} ملف قُصّ لطوله` : ''
      ].filter(Boolean).join(' · ');
      setMessages([{
        id: 'sys',
        role: 'assistant',
        content: `تم فك الأرشيف (**${data.fileCount}** ملف).${extra ? ` ${extra}.` : ''} توجه للدردشة مع ناجي — اضغط «افحص المشروع» لتقرير رؤوس الأقلام.`
      }]);
      setUnpackHint('تم. توجه للدردشة مع ناجي.');
      toast.success('تم فك الأرشيف. توجه للدردشة مع ناجي.');
      setTimeout(() => setTab('chat'), 600);
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

  const send = async (text: string, intent: 'chat' | 'audit' | 'brief' = 'chat') => {
    if (gated()) return;
    const prompt = text.trim();
    if (!prompt || sending) return;
    if (!workspaceId) {
      toast.error('ارفع أرشيف الموقع أولاً من تبويب الكود.');
      setTab('code');
      return;
    }
    const userMsg: ChatMsg = { id: `u_${Date.now()}`, role: 'user', content: prompt };
    const asstId = `a_${Date.now()}`;
    setMessages(prev => [...prev, userMsg, { id: asstId, role: 'assistant', content: '' }]);
    setInput('');
    setSending(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/developer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          workspaceId,
          prompt,
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
          setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: m.content + chunk.text } : m));
        }
        if (chunk.usage) {
          setMessages(prev => prev.map(m => m.id === asstId ? { ...m, usage: chunk.usage } : m));
        }
        if (typeof chunk.newBalance === 'number') updateBalance(chunk.newBalance);
        if (chunk.applied?.length && focusPath && chunk.applied.includes(focusPath)) {
          openFile(focusPath);
        }
      });
    } catch (e: any) {
      setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: m.content || e.message } : m));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#FAF9FC] dark:bg-[#0d0f12] overflow-hidden" dir="rtl">
      <FeaturePaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="najeDeveloper" />

      <div className="h-14 px-4 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
          <button
            onClick={() => setTab('code')}
            className={`h-9 px-4 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${tab === 'code' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
          >
            <Code2 className="w-4 h-4" /> الكود
          </button>
          <button
            onClick={() => setTab('chat')}
            className={`h-9 px-4 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${tab === 'chat' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
          >
            <MessageSquare className="w-4 h-4" /> الدردشة
          </button>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-sm font-extrabold text-gray-900 dark:text-white">ناجي المطور</div>
          <div className="text-[10px] text-gray-500">فحص أرشيف الموقع · باقة المُبتكر</div>
        </div>
      </div>

      {tab === 'code' ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[260px_1fr]">
          <aside className="border-l border-gray-200 dark:border-gray-800 overflow-y-auto p-3 bg-white/50 dark:bg-black/20">
            <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleZip(f);
              e.target.value = '';
            }} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={unpacking}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 mb-3"
            >
              {unpacking ? <NajeSpinner className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              رفع ZIP للموقع
            </button>
            {unpacking && <p className="text-[11px] text-indigo-500 font-bold mb-3">{unpackHint}</p>}
            {tree.length > 0 && (
              <button onClick={exportZip} className="w-full h-9 rounded-xl border border-gray-200 dark:border-gray-800 text-[11px] font-bold flex items-center justify-center gap-1.5 mb-3 hover:bg-white dark:hover:bg-gray-900">
                <Download className="w-3.5 h-3.5" /> تصدير ZIP المحدّث
              </button>
            )}
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-500 mb-2">
              <FolderTree className="w-3.5 h-3.5" /> {tree.length} ملف
            </div>
            {unpackStats && (unpackStats.skipped > 0 || unpackStats.truncatedFiles > 0) && (
              <p className="text-[10px] text-amber-600 font-bold mb-2">
                {unpackStats.skipped ? `تخطي ${unpackStats.skipped}` : ''}
                {unpackStats.skipped && unpackStats.truncatedFiles ? ' · ' : ''}
                {unpackStats.truncatedFiles ? `قصّ ${unpackStats.truncatedFiles}` : ''}
              </p>
            )}
            <div className="space-y-0.5">
              {tree.map(f => (
                <button
                  key={f.path}
                  onClick={() => openFile(f.path)}
                  className={`w-full text-right px-2 py-1.5 rounded-lg text-[11px] truncate flex items-center gap-1.5 ${focusPath === f.path ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900'}`}
                  title={f.path}
                >
                  <FileCode className="w-3 h-3 shrink-0" />
                  <span className="truncate font-mono dir-ltr">{f.path}</span>
                </button>
              ))}
            </div>
          </aside>
          <div className="min-h-0 overflow-hidden p-3">
            {unpacking ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <NajeThinking size={56} />
                <p className="text-sm font-extrabold">{unpackHint}</p>
              </div>
            ) : loadingFile ? (
              <div className="h-full flex items-center justify-center"><NajeSpinner className="w-8 h-8" /></div>
            ) : focusFile ? (
              <NajeCodePane code={focusFile.content} language={focusFile.language} fileName={focusFile.path} title={focusFile.path} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-2">
                <Upload className="w-10 h-10 text-indigo-400" />
                <h2 className="text-base font-extrabold">ارفع ملف الموقع المضغوط</h2>
                <p className="text-xs text-gray-500 max-w-sm">ZIP للموقع (HTML/JS/CSS). بعد الفك يظهر شجرة الملفات، وبعدها توجه للدردشة لفحص كل قسم. ناجي يقدر يعدّل الملفات المحفوظة ويصدّر ZIP — بدون تشغيل الموقع هنا.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="max-w-lg mx-auto text-center mt-12 space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto text-indigo-400" />
                <p className="text-sm font-extrabold">دردشة ناجي المطور</p>
                <p className="text-xs text-gray-500">افحص الأقسام، اسأل عن خطأ، أو اطلب تعديلاً على ملف. التكلفة بالنقاط حسب التوكن.</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`max-w-3xl ${m.role === 'user' ? 'mr-auto bg-indigo-600 text-white rounded-2xl px-4 py-2.5 text-sm' : 'ml-auto w-full'}`}>
                {m.role === 'user' ? m.content : (
                  <div className="prose dark:prose-invert prose-sm max-w-none text-gray-800 dark:text-gray-200">
                    {m.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown> : (sending ? <NajeThinking size={28} /> : null)}
                    {m.usage && (
                      <div className="mt-2 text-[10px] font-bold text-amber-600">التكلفة: {Number(m.usage.charged || 0).toFixed(2)} نقطة</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80">
            <div className="flex gap-2 mb-2">
              <button onClick={() => send('افحص كل أقسام المشروع وأعطني تقرير رؤوس أقلام.', 'audit')} disabled={sending} className="h-8 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 text-[11px] font-extrabold flex items-center gap-1">
                <Search className="w-3.5 h-3.5" /> افحص المشروع
              </button>
              <button onClick={() => send('اكتب بريف توجيه تفصيلي للوكيل الذي أطور معه الكود.', 'brief')} disabled={sending} className="h-8 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 text-[11px] font-extrabold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> اكتب البريف
              </button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="اسأل عن الكود أو اطلب تعديلاً..."
                className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
                    e.preventDefault();
                    send(input);
                  }
                }}
              />
              <button type="submit" disabled={sending || !input.trim()} className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center disabled:opacity-40">
                {sending ? <NajeSpinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
