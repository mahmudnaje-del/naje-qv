import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import NajeThinking from '../NajeThinking';
import { askNaje, parseModelJson } from '../../lib/askNaje';
import {
  CV_PATCH_SCHEMA,
  CvData,
  cvFactsForPrompt,
  NAJE_CV_TRUTH,
  patchPreviewLines,
} from '../../lib/cvStudio';
import { goldBtn, ghostGoldBtn, inputCls } from './cvUi';

const MAX_TURNS = 8;

const FIRST_Q = 'ما اسمك الثلاثي، وما المسمّى الذي تريد أن تُصنَّف تحته؟';

type Msg =
  | { id: string; role: 'naje'; text: string }
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'confirm'; text: string; patch: Record<string, unknown> };

function nid() {
  return Math.random().toString(36).slice(2, 9);
}

export function CvInterview({
  open,
  cv,
  onClose,
  onConfirmPatch,
}: {
  open: boolean;
  cv: CvData;
  onClose: () => void;
  onConfirmPatch: (patch: Record<string, unknown>) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([{ id: 'q0', role: 'naje', text: FIRST_Q }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState(0);
  const [editBuf, setEditBuf] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const liveCv = useRef(cv);
  liveCv.current = cv;

  const pending = messages.find((m) => m.role === 'confirm');
  const done = turns >= MAX_TURNS && !pending;

  useEffect(() => {
    if (!open) return;
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, busy]);

  const history = useMemo(
    () =>
      messages
        .filter((m) => m.role === 'naje' || m.role === 'user')
        .map((m) => ({ role: m.role === 'naje' ? 'assistant' : 'user', content: m.text })),
    [messages]
  );

  const runTurn = async (userText: string, extra = '') => {
    setBusy(true);
    setError(null);
    try {
      const nextTurn = turns + 1;
      const last = nextTurn >= MAX_TURNS;
      const prompt = `${NAJE_CV_TRUTH}

أنت في مقابلة قصيرة لبناء سيرة. اسأل سؤالاً واحداً في كل مرة عن العمل أو الدراسة أو المهارات.
بعد كل إجابة أرجع JSON فقط بأحد الشكلين:
{"mode":"ask","q":"سؤال واحد فقط"}
{"mode":"extract","patch":{...},"confirm":"ملخص جملة بالعربية لما فهمته من كلام المستخدم فقط"}

${CV_PATCH_SCHEMA}

لا تُدرج في patch إلا ما قاله المستخدم صراحة. لا تخترع أرقاماً أو جهات.
المعلومات المؤكدة حتى الآن:
${cvFactsForPrompt(liveCv.current)}

${last ? 'هذه الجولة الأخيرة: أرجع extract بما عرفته حتى الآن — لا تسأل سؤالاً جديداً.' : `الجولة ${nextTurn} من ${MAX_TURNS}. إن اكتملت البيانات الأساسية (اسم، مسمّى، تواصل أو خبرة/تعليم) يمكنك extract، وإلا اسأل.`}
${extra}

آخر إجابة من المستخدم:
${userText}`;

      const raw = await askNaje(prompt, { history, model: 'core' });
      const json = parseModelJson(raw);
      if (json && json.mode === 'extract' && json.patch && typeof json.patch === 'object') {
        const confirm = String(json.confirm || 'هذا ما فهمته. هل نضيفه إلى السيرة؟');
        setMessages((m) => [...m, { id: nid(), role: 'confirm', text: confirm, patch: json.patch }]);
      } else if (json && json.mode === 'ask' && json.q) {
        setMessages((m) => [...m, { id: nid(), role: 'naje', text: String(json.q) }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            id: nid(),
            role: 'naje',
            text: last
              ? 'لم أستطع استخراج بيانات جديدة بأمان. راجع ما كتبته أو أكّد «اكتفيت».'
              : 'تمام. حدّثني أكثر: أين تعمل أو تدرس الآن، وما الذي تتقنه فعلاً؟',
          },
        ]);
      }
      setTurns(nextTurn);
    } catch (e: any) {
      setError(e?.message || 'تعذر التواصل مع ناجي');
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy || pending) return;
    setInput('');
    setMessages((m) => [...m, { id: nid(), role: 'user', text }]);
    await runTurn(text);
  };

  const confirm = (msg: Extract<Msg, { role: 'confirm' }>) => {
    onConfirmPatch(msg.patch);
    setMessages((m) =>
      m
        .filter((x) => x.id !== msg.id)
        .concat({ id: nid(), role: 'naje', text: 'أُضيف بعد تأكيدك. ماذا بعد؟' })
    );
  };

  const reject = (msg: Extract<Msg, { role: 'confirm' }>) => {
    setMessages((m) =>
      m.filter((x) => x.id !== msg.id).concat({ id: nid(), role: 'naje', text: 'لم أضف شيئاً. صحّح لي أو ننتقل لسؤال آخر.' })
    );
  };

  const startEdit = (msg: Extract<Msg, { role: 'confirm' }>) => {
    setEditingId(msg.id);
    setEditBuf(msg.text);
  };

  const submitEdit = async (msg: Extract<Msg, { role: 'confirm' }>) => {
    const text = editBuf.trim();
    setEditingId(null);
    setMessages((m) => m.filter((x) => x.id !== msg.id).concat({ id: nid(), role: 'user', text: `تصحيح: ${text}` }));
    await runTurn(`تصحيح للملخص السابق: ${text}`, 'أرجع extract مصححاً من كلام المستخدم فقط، أو اسأل توضيحاً واحداً.');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" dir="rtl">
      <div className="flex h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[#c4a35a]/25 bg-[#0b1220] sm:h-[min(720px,90dvh)] sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.14em] text-[#e8c36a]">مقابلة ناجي</p>
            <p className="text-sm font-black text-white">سؤال واحد في كل مرة</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40">
              {Math.min(turns, MAX_TURNS)}/{MAX_TURNS}
            </span>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/50 hover:text-white" aria-label="إغلاق">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <p className="border-b border-white/5 px-4 py-2 text-[10px] leading-relaxed text-white/40">
          لا شيء يُكتب في سيرتك حتى تضغط تأكيد. ناجي لا يخترع وظائف أو أرقاماً أو شهادات.
        </p>
        <div ref={scroller} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {messages.map((m) => {
            if (m.role === 'user') {
              return (
                <div key={m.id} className="mr-8 rounded-2xl rounded-tl-md bg-[#c4a35a]/15 px-3 py-2 text-[13px] text-[#f3ead8]">
                  {m.text}
                </div>
              );
            }
            if (m.role === 'naje') {
              return (
                <div key={m.id} className="ml-8 rounded-2xl rounded-tr-md border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white">
                  {m.text}
                </div>
              );
            }
            const lines = patchPreviewLines(m.patch);
            return (
              <div key={m.id} className="rounded-2xl border border-[#c4a35a]/35 bg-[#c4a35a]/10 p-3">
                <p className="text-[10px] font-black text-[#e8c36a]">تأكيد قبل الإضافة</p>
                {editingId === m.id ? (
                  <textarea className={`${inputCls} mt-2`} rows={3} value={editBuf} onChange={(e) => setEditBuf(e.target.value)} />
                ) : (
                  <p className="mt-1 text-[13px] leading-relaxed text-white">{m.text}</p>
                )}
                {lines.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-[11px] text-white/65">
                    {lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {editingId === m.id ? (
                    <button type="button" className={goldBtn} disabled={busy} onClick={() => submitEdit(m)}>
                      إرسال التعديل
                    </button>
                  ) : (
                    <>
                      <button type="button" className={goldBtn} onClick={() => confirm(m)}>
                        تأكيد
                      </button>
                      <button type="button" className={ghostGoldBtn} onClick={() => startEdit(m)}>
                        تعديل
                      </button>
                      <button type="button" className="text-[11px] font-black text-white/45" onClick={() => reject(m)}>
                        رفض
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {busy && (
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              <NajeThinking size={22} /> ناجي يقرأ إجابتك…
            </div>
          )}
          {error && <p className="text-[11px] text-rose-300">{error}</p>}
          {done && <p className="text-[11px] text-white/45">اكتملت الجولات. راجع التأكيدات أو اضغط اكتفيت.</p>}
        </div>
        <div className="border-t border-white/10 p-3">
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={input}
              disabled={busy || Boolean(pending) || turns >= MAX_TURNS}
              placeholder={pending ? 'أكّد أو عدّل البطاقة أولاً' : 'اكتب إجابتك كما هي…'}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button type="button" className={goldBtn} disabled={busy || !input.trim() || Boolean(pending)} onClick={() => void send()}>
              إرسال
            </button>
          </div>
          <button type="button" onClick={onClose} className="mt-2 w-full text-center text-[11px] font-black text-white/45">
            اكتفيت
          </button>
        </div>
      </div>
    </div>
  );
}
