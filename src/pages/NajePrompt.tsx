import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareText, Plus } from 'lucide-react';
import { toast } from '../toastStore';
import { askNaje } from '../lib/askNaje';
import { cn } from '../lib/utils';
import NajeThinking from '../components/NajeThinking';
import StudioBootSplash from '../components/StudioBootSplash';
import PromptComposer from '../components/najePrompt/PromptComposer';
import PromptBubble from '../components/najePrompt/PromptBubble';
import ClarificationCard from '../components/najePrompt/ClarificationCard';
import ReadyCard from '../components/najePrompt/ReadyCard';
import HistoryStrip from '../components/najePrompt/HistoryStrip';
import EmptyPromptState from '../components/najePrompt/EmptyPromptState';
import {
  MODE_ASK_LIMIT,
  MODE_OPTIONS,
  MODEL_OPTIONS,
  buildAskPrompt,
  historyToReady,
  humanError,
  loadHistory,
  parseEngineResponse,
  resolveModel,
  saveHistoryItem,
  storeHandoff,
  uid,
  type HistoryItem,
  type ModelChoice,
  type PromptMode,
  type QaTurn,
  type ReadyResult,
} from '../lib/najePromptEngine';

type ChatItem =
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'clarification'; question: { id: string; q: string; options: string[] }; why?: string; answered?: string }
  | { id: string; kind: 'ready'; payload: ReadyResult }
  | { id: string; kind: 'error'; text: string };

type ClarifyItem = Extract<ChatItem, { kind: 'clarification' }>;
type ReadyItem = Extract<ChatItem, { kind: 'ready' }>;

function isOpenClarification(item: ChatItem): item is ClarifyItem {
  return item.kind === 'clarification' && !item.answered;
}

export default function NajePrompt() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<PromptMode>('smart');
  const [modelChoice, setModelChoice] = useState<ModelChoice>('auto');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [routeReason, setRouteReason] = useState<string | null>(null);
  const [originalIdea, setOriginalIdea] = useState('');
  const [qa, setQa] = useState<QaTurn[]>([]);
  const [askedCount, setAskedCount] = useState(0);
  const [lastReady, setLastReady] = useState<ReadyResult | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const turnSeq = useRef(0);
  const live = useRef({
    messages,
    busy,
    mode,
    modelChoice,
    originalIdea,
    qa,
    askedCount,
    lastReady,
    routeReason,
  });
  live.current = {
    messages,
    busy,
    mode,
    modelChoice,
    originalIdea,
    qa,
    askedCount,
    lastReady,
    routeReason,
  };

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const resetConversation = useCallback(() => {
    turnSeq.current += 1;
    live.current.busy = false;
    setMessages([]);
    setDraft('');
    setBusy(false);
    setRouteReason(null);
    setOriginalIdea('');
    setQa([]);
    setAskedCount(0);
    setLastReady(null);
  }, []);

  const copyPrompt = useCallback(async (payload: ReadyResult) => {
    try {
      await navigator.clipboard.writeText(payload.prompt);
      storeHandoff({ prompt: payload.prompt, bestFor: payload.bestFor, title: payload.title });
      toast.success('تم نسخ البرومبت');
    } catch {
      toast.error('ما قدرت أنسخ. حدّد النص وانسخه يدوياً.');
    }
  }, []);

  const handoff = useCallback((path: string, payload: ReadyResult) => {
    storeHandoff({ prompt: payload.prompt, bestFor: payload.bestFor, title: payload.title });
    navigate(path);
  }, [navigate]);

  const restoreHistory = useCallback((item: HistoryItem) => {
    turnSeq.current += 1;
    live.current.busy = false;
    setBusy(false);
    const ready = historyToReady(item);
    setMessages([{ id: uid('r'), kind: 'ready', payload: ready }]);
    setOriginalIdea(item.title);
    setQa([]);
    setAskedCount(0);
    setLastReady(ready);
    setRouteReason(null);
    setDraft('');
  }, []);

  const runTurn = useCallback(async (text: string, source: 'composer' | 'clarify' | 'refine') => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const snap = live.current;
    if (snap.busy) return;

    const pending = [...snap.messages].reverse().find(isOpenClarification);
    const asClarify = source === 'clarify' || (source === 'composer' && pending);
    const nextQa = asClarify && pending
      ? [...snap.qa, { q: pending.question.q, a: trimmed }]
      : snap.qa;
    const seedIdea = snap.originalIdea || (source === 'refine' ? snap.lastReady?.title || trimmed : trimmed);
    const isRefine = source === 'refine' || (Boolean(snap.lastReady) && !asClarify && Boolean(snap.originalIdea));
    const maxAsk = MODE_ASK_LIMIT[snap.mode];
    const forceReady = isRefine || snap.askedCount >= maxAsk;

    live.current.busy = true;
    setBusy(true);
    const myTurn = ++turnSeq.current;
    setMessages((prev) => {
      const withUser: ChatItem[] = [...prev, { id: uid('u'), kind: 'user', text: trimmed }];
      if (asClarify && pending) {
        return withUser.map((item) =>
          item.kind === 'clarification' && item.id === pending.id
            ? { ...item, answered: trimmed }
            : item,
        );
      }
      return withUser;
    });
    if (!snap.originalIdea) setOriginalIdea(seedIdea);
    if (asClarify) setQa(nextQa);
    if (source === 'composer') setDraft('');

    const { model, reason } = resolveModel(snap.modelChoice, seedIdea);
    if (reason && !snap.routeReason) setRouteReason(reason);

    const invoke = async (readyNow: boolean) => {
      const prompt = buildAskPrompt({
        mode: snap.mode,
        askedCount: snap.askedCount,
        isRefine,
        forceReady: readyNow || forceReady,
        originalIdea: seedIdea,
        qa: nextQa,
        lastReady: snap.lastReady,
        userMessage: trimmed,
      });
      const raw = await askNaje(prompt, { model });
      return parseEngineResponse(raw);
    };

    try {
      let result = await invoke(false);
      if (myTurn !== turnSeq.current) return;
      if (result?.mode === 'ask' && forceReady) {
        result = await invoke(true);
        if (myTurn !== turnSeq.current) return;
      }

      if (result?.mode === 'ask') {
        if (forceReady || snap.askedCount >= maxAsk) {
          throw new Error('تعذّر إغلاق البرومبت. جرّب تعيد صياغة الفكرة.');
        }
        setAskedCount(snap.askedCount + 1);
        setMessages((prev) => [
          ...prev,
          {
            id: uid('q'),
            kind: 'clarification',
            question: result.question,
            why: result.why,
          },
        ]);
        return;
      }

      if (result?.mode === 'ready') {
        setLastReady(result);
        setHistory(saveHistoryItem({
          title: result.title,
          prompt: result.prompt,
          bestFor: result.bestFor,
        }));
        setMessages((prev) => [...prev, { id: uid('r'), kind: 'ready', payload: result }]);
        return;
      }

      throw new Error('تعذّر فهم الفكرة بهالشكل. جرّب تعيد صياغتها بجملة أو جملتين.');
    } catch (err) {
      if (myTurn !== turnSeq.current) return;
      const message = humanError(err);
      setMessages((prev) => [...prev, { id: uid('e'), kind: 'error', text: message }]);
      toast.error(message);
    } finally {
      if (myTurn === turnSeq.current) {
        live.current.busy = false;
        setBusy(false);
      }
    }
  }, []);

  const sendDraft = useCallback(() => {
    const text = draft.trim();
    if (!text) {
      toast.error('احكي فكرتك أولاً');
      return;
    }
    void runTurn(text, 'composer');
  }, [draft, runTurn]);

  const pickChip = useCallback((chip: string) => {
    setDraft(chip);
    requestAnimationFrame(() => {
      const area = composerRef.current?.querySelector('textarea');
      area?.focus();
    });
  }, []);

  const lastReadyMsg = useMemo(
    () => [...messages].reverse().find((m): m is ReadyItem => m.kind === 'ready'),
    [messages],
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-naje-canvas" dir="rtl">
      <StudioBootSplash />

      <header className="shrink-0 px-3 pt-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-indigo-500/15 bg-gradient-to-bl from-indigo-600/10 via-transparent to-transparent px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-black text-indigo-600 dark:text-indigo-300">
                <MessageSquareText className="h-3.5 w-3.5" />
                ناجي برومبت
              </div>
              <h1 className="text-xl font-black leading-snug text-naje-ink">احكي فكرتك — ناجي يفهمها</h1>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={resetConversation}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-black text-naje-muted dark:border-zinc-700"
              >
                <Plus className="h-3 w-3" />
                جديد
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setModelChoice(opt.id)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-black transition',
                    modelChoice === opt.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-naje-muted hover:text-naje-ink',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-full border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  title={opt.hint}
                  onClick={() => setMode(opt.id)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-black transition',
                    mode === opt.id
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'text-naje-muted hover:text-naje-ink',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {routeReason && messages.length > 0 && (
            <p className="mt-2 text-[10px] font-bold text-naje-muted">{routeReason}</p>
          )}

          <HistoryStrip items={history} onSelect={restoreHistory} />
        </div>
      </header>

      <div className="flex min-h-0 w-full flex-1 flex-col px-3 sm:px-6">
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
          {messages.length === 0 && !busy ? (
            <EmptyPromptState onPick={pickChip} />
          ) : (
            <div className="space-y-3">
              {messages.map((item, index) => {
                if (item.kind === 'user') return <PromptBubble key={item.id} text={item.text} />;
                if (item.kind === 'clarification') {
                  const isLast = index === messages.length - 1;
                  return (
                    <ClarificationCard
                      key={item.id}
                      question={item.question}
                      why={item.why}
                      answered={item.answered}
                      active={isLast && !item.answered && !busy}
                      disabled={busy}
                      onSubmit={(answer) => void runTurn(answer, 'clarify')}
                    />
                  );
                }
                if (item.kind === 'ready') {
                  return (
                    <ReadyCard
                      key={item.id}
                      data={item.payload}
                      busy={busy}
                      showRefine={lastReadyMsg?.id === item.id}
                      onCopy={() => void copyPrompt(item.payload)}
                      onHandoff={(path) => handoff(path, item.payload)}
                      onRefine={(instruction) => void runTurn(instruction, 'refine')}
                    />
                  );
                }
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-3xl border border-rose-500/20 bg-rose-500/5 px-4 py-3"
                  >
                    <NajeThinking size={28} />
                    <p className="pt-1 text-sm font-bold leading-relaxed text-rose-700 dark:text-rose-300">
                      {item.text}
                    </p>
                  </div>
                );
              })}

              {busy && (
                <div className="flex items-center gap-3 py-2">
                  <NajeThinking size={36} />
                  <span className="text-xs font-bold text-naje-muted">ناجي يقرأ الفكرة…</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
          </div>

          <div ref={composerRef} className="shrink-0 pb-4 pb-safe">
            <PromptComposer
              value={draft}
              onChange={setDraft}
              onSend={sendDraft}
              disabled={busy}
              placeholder={lastReadyMsg ? 'عدّل البرومبت أو اطلب شي جديد…' : 'احكيلي شو بدك تعمل...'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
