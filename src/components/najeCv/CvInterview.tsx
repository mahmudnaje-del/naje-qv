import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import NajeThinking from '../NajeThinking';
import { useI18n } from '../../i18n';
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

type Msg =
  | { id: string; role: 'naje'; text: string }
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'confirm'; text: string; patch: Record<string, unknown> };

function nid() {
  return Math.random().toString(36).slice(2, 9);
}

function uiLanguageName(locale: string) {
  if (locale === 'ar') return 'Arabic';
  if (locale === 'es') return 'Spanish';
  if (locale === 'fr') return 'French';
  if (locale === 'de') return 'German';
  if (locale === 'pt') return 'Portuguese';
  return 'English';
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
  const { t, isRtl, locale } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([{ id: 'q0', role: 'naje', text: t('cv.interview.firstQ') }]);
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
      const uiName = uiLanguageName(locale);
      const prompt = `${NAJE_CV_TRUTH}

You are in a short interview to build a CV. Ask one question at a time about work, study, or skills.
Write the question and the confirm sentence in ${uiName}. Keep extracted field values in the user's own words.
After each answer return JSON only, in one of these shapes:
{"mode":"ask","q":"one question only"}
{"mode":"extract","patch":{...},"confirm":"one sentence in ${uiName} of what the user actually said"}

${CV_PATCH_SCHEMA}

Put in patch only what the user said explicitly. Do not invent numbers, employers, GPA, or certificates.
Facts confirmed so far:
${cvFactsForPrompt(liveCv.current)}

${last ? 'This is the last turn: return extract with what you know — do not ask a new question.' : `Turn ${nextTurn} of ${MAX_TURNS}. If the basics are in (name, title, contact or experience/education) you may extract, otherwise ask.`}
${extra}

Latest user answer:
${userText}`;

      const raw = await askNaje(prompt, { history, model: 'core' });
      const json = parseModelJson(raw);
      if (json && json.mode === 'extract' && json.patch && typeof json.patch === 'object') {
        const confirm = String(json.confirm || t('cv.interview.defaultConfirm'));
        setMessages((m) => [...m, { id: nid(), role: 'confirm', text: confirm, patch: json.patch }]);
      } else if (json && json.mode === 'ask' && json.q) {
        setMessages((m) => [...m, { id: nid(), role: 'naje', text: String(json.q) }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            id: nid(),
            role: 'naje',
            text: last ? t('cv.interview.failExtract') : t('cv.interview.more'),
          },
        ]);
      }
      setTurns(nextTurn);
    } catch (e: any) {
      setError(t('cv.interview.err'));
      void e;
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
    setMessages((m) => m.filter((x) => x.id !== msg.id).concat({ id: nid(), role: 'naje', text: t('cv.interview.added') }));
  };

  const reject = (msg: Extract<Msg, { role: 'confirm' }>) => {
    setMessages((m) => m.filter((x) => x.id !== msg.id).concat({ id: nid(), role: 'naje', text: t('cv.interview.notAdded') }));
  };

  const startEdit = (msg: Extract<Msg, { role: 'confirm' }>) => {
    setEditingId(msg.id);
    setEditBuf(msg.text);
  };

  const submitEdit = async (msg: Extract<Msg, { role: 'confirm' }>) => {
    const text = editBuf.trim();
    setEditingId(null);
    setMessages((m) => m.filter((x) => x.id !== msg.id).concat({ id: nid(), role: 'user', text: t('cv.interview.correction', { text }) }));
    await runTurn(
      `Correction to the previous summary: ${text}`,
      'Return a corrected extract from the user words only, or ask one clarifying question.'
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[#c4a35a]/25 bg-[#0b1220] sm:h-[min(720px,90dvh)] sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.14em] text-[#e8c36a]">{t('cv.interview.kicker')}</p>
            <p className="text-sm font-black text-white">{t('cv.interview.title')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40">
              {Math.min(turns, MAX_TURNS)}/{MAX_TURNS}
            </span>
            <button type="button" onClick={onClose} className="min-h-[44px] min-w-[44px] rounded-lg p-1.5 text-white/50 hover:text-white" aria-label={t('cv.interview.close')}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <p className="border-b border-white/5 px-4 py-2 text-[10px] leading-relaxed text-white/40">{t('cv.interview.promise')}</p>
        <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
          {messages.map((m) => {
            if (m.role === 'user') {
              return (
                <div key={m.id} className="ms-8 max-w-[85%] self-end rounded-2xl rounded-ee-md bg-[#c4a35a]/15 px-3 py-2 text-[13px] text-[#f3ead8]">
                  {m.text}
                </div>
              );
            }
            if (m.role === 'naje') {
              return (
                <div key={m.id} className="me-8 max-w-[85%] self-start rounded-2xl rounded-es-md border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white">
                  {m.text}
                </div>
              );
            }
            const lines = patchPreviewLines(m.patch);
            return (
              <div key={m.id} className="rounded-2xl border border-[#c4a35a]/35 bg-[#c4a35a]/10 p-3">
                <p className="text-[10px] font-black text-[#e8c36a]">{t('cv.interview.confirmKicker')}</p>
                {editingId === m.id ? (
                  <textarea className={`${inputCls} mt-2`} rows={3} value={editBuf} onChange={(e) => setEditBuf(e.target.value)} />
                ) : (
                  <p className="mt-1 text-[13px] leading-relaxed text-white">{m.text}</p>
                )}
                {lines.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-[11px] text-white/65">
                    {lines.map((l) => (
                      <li key={`${l.key}-${l.value}`}>
                        {t(l.key)}: {l.value}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {editingId === m.id ? (
                    <button type="button" className={goldBtn} disabled={busy} onClick={() => submitEdit(m)}>
                      {t('cv.interview.sendEdit')}
                    </button>
                  ) : (
                    <>
                      <button type="button" className={goldBtn} onClick={() => confirm(m)}>
                        {t('cv.interview.confirm')}
                      </button>
                      <button type="button" className={ghostGoldBtn} onClick={() => startEdit(m)}>
                        {t('cv.interview.edit')}
                      </button>
                      <button type="button" className="min-h-[44px] text-[11px] font-black text-white/45" onClick={() => reject(m)}>
                        {t('cv.interview.reject')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {busy && (
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              <NajeThinking size={22} /> {t('cv.interview.reading')}
            </div>
          )}
          {error && <p className="text-[11px] text-rose-300">{error}</p>}
          {done && <p className="text-[11px] text-white/45">{t('cv.interview.done')}</p>}
        </div>
        <div className="border-t border-white/10 p-3">
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={input}
              disabled={busy || Boolean(pending) || turns >= MAX_TURNS}
              placeholder={pending ? t('cv.interview.phPending') : t('cv.interview.ph')}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button type="button" className={goldBtn} disabled={busy || !input.trim() || Boolean(pending)} onClick={() => void send()}>
              {t('cv.interview.send')}
            </button>
          </div>
          <button type="button" onClick={onClose} className="mt-2 min-h-[44px] w-full text-center text-[11px] font-black text-white/45">
            {t('cv.interview.enough')}
          </button>
        </div>
      </div>
    </div>
  );
}
