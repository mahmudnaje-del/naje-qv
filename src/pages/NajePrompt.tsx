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
import ConstraintsPinBar from '../components/najePrompt/ConstraintsPinBar';
import RefinementTrail from '../components/najePrompt/RefinementTrail';
import ResultCard from '../components/najePrompt/ResultCard';
import { useI18n } from '../i18n';
import {
  MODE_ASK_LIMIT,
  MODE_OPTIONS,
  MODEL_OPTIONS,
  READY_STACK_CAP,
  applyPinnedToUnderstanding,
  buildAskPrompt,
  extractConstraintHints,
  historyToReady,
  humanError,
  isExecutableBestFor,
  loadHistory,
  mergeUnique,
  parseEngineResponse,
  refineTrailLabel,
  resolveModel,
  saveHistoryItem,
  storeHandoff,
  toAskNajeFiles,
  uid,
  withAttachmentContext,
  type BestFor,
  type HistoryItem,
  type ImageIntent,
  type ModelChoice,
  type PromptAttachment,
  type PromptMode,
  type QaTurn,
  type ReadyResult,
  type TrailItem,
  type Understanding,
} from '../lib/najePromptEngine';

type ChatItem =
  | { id: string; kind: 'user'; text: string; files?: PromptAttachment[]; imageIntent?: ImageIntent }
  | { id: string; kind: 'clarification'; question: { id: string; q: string; options: string[] }; why?: string; answered?: string }
  | { id: string; kind: 'ready'; payload: ReadyResult; version: number }
  | { id: string; kind: 'result'; text: string; bestFor: BestFor; title: string }
  | { id: string; kind: 'error'; text: string };

type ClarifyItem = Extract<ChatItem, { kind: 'clarification' }>;
type ReadyItem = Extract<ChatItem, { kind: 'ready' }>;

function isOpenClarification(item: ChatItem): item is ClarifyItem {
  return item.kind === 'clarification' && !item.answered;
}

export default function NajePrompt() {
  const navigate = useNavigate();
  const { isRtl, t } = useI18n();
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
  const [attachments, setAttachments] = useState<PromptAttachment[]>([]);
  const [imageIntent, setImageIntent] = useState<ImageIntent>('inspire');
  const [sessionFiles, setSessionFiles] = useState<PromptAttachment[]>([]);
  const [pinnedAvoid, setPinnedAvoid] = useState<string[]>([]);
  const [pinnedMust, setPinnedMust] = useState<string[]>([]);
  const [readyStack, setReadyStack] = useState<ReadyResult[]>([]);
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const [busyHint, setBusyHint] = useState('ناجي يقرأ الفكرة…');

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
    attachments,
    imageIntent,
    sessionFiles,
    pinnedAvoid,
    pinnedMust,
    readyStack,
    trail,
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
    attachments,
    imageIntent,
    sessionFiles,
    pinnedAvoid,
    pinnedMust,
    readyStack,
    trail,
  };

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const pinConstraints = useCallback((avoid: string[], must: string[]) => {
    const nextAvoid = mergeUnique(live.current.pinnedAvoid, avoid);
    const nextMust = mergeUnique(live.current.pinnedMust, must);
    live.current.pinnedAvoid = nextAvoid;
    live.current.pinnedMust = nextMust;
    setPinnedAvoid(nextAvoid);
    setPinnedMust(nextMust);
    return { avoid: nextAvoid, must: nextMust };
  }, []);

  const pushTrail = useCallback((item: TrailItem) => {
    const next = [...live.current.trail, item].slice(-10);
    live.current.trail = next;
    setTrail(next);
  }, []);

  const resetConversation = useCallback(() => {
    turnSeq.current += 1;
    live.current.busy = false;
    live.current.sessionFiles = [];
    live.current.pinnedAvoid = [];
    live.current.pinnedMust = [];
    live.current.readyStack = [];
    live.current.trail = [];
    live.current.lastReady = null;
    setMessages([]);
    setDraft('');
    setBusy(false);
    setRouteReason(null);
    setOriginalIdea('');
    setQa([]);
    setAskedCount(0);
    setLastReady(null);
    setAttachments([]);
    setImageIntent('inspire');
    setSessionFiles([]);
    setPinnedAvoid([]);
    setPinnedMust([]);
    setReadyStack([]);
    setTrail([]);
    setBusyHint('ناجي يقرأ الفكرة…');
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
    const ready = historyToReady(item);
    live.current.lastReady = ready;
    live.current.readyStack = [ready];
    live.current.trail = [
      { id: uid('t'), kind: 'idea', label: 'الفكرة' },
      { id: uid('t'), kind: 'ready', label: 'جاهز v1' },
    ];
    live.current.sessionFiles = [];
    live.current.pinnedAvoid = [];
    live.current.pinnedMust = [];
    setBusy(false);
    setMessages([{ id: uid('r'), kind: 'ready', payload: ready, version: 1 }]);
    setOriginalIdea(item.title);
    setQa([]);
    setAskedCount(0);
    setLastReady(ready);
    setRouteReason(null);
    setDraft('');
    setAttachments([]);
    setImageIntent('inspire');
    setSessionFiles([]);
    setPinnedAvoid([]);
    setPinnedMust([]);
    setReadyStack([ready]);
    setTrail(live.current.trail);
  }, []);

  const removePinned = useCallback((kind: 'avoid' | 'must', value: string) => {
    const nextAvoid = kind === 'avoid' ? live.current.pinnedAvoid.filter((v) => v !== value) : live.current.pinnedAvoid;
    const nextMust = kind === 'must' ? live.current.pinnedMust.filter((v) => v !== value) : live.current.pinnedMust;
    live.current.pinnedAvoid = nextAvoid;
    live.current.pinnedMust = nextMust;
    setPinnedAvoid(nextAvoid);
    setPinnedMust(nextMust);
    const current = live.current.lastReady;
    if (!current) return;
    const patched: ReadyResult = {
      ...current,
      understanding: {
        ...current.understanding,
        avoid: nextAvoid,
        must: nextMust,
      },
    };
    live.current.lastReady = patched;
    setLastReady(patched);
    setReadyStack((stack) => {
      if (!stack.length) return stack;
      const next = [...stack];
      next[next.length - 1] = patched;
      live.current.readyStack = next;
      return next;
    });
    setMessages((prev) => {
      const idx = [...prev].map((m, i) => ({ m, i })).reverse().find((row) => row.m.kind === 'ready')?.i;
      if (idx == null) return prev;
      const copy = [...prev];
      const item = copy[idx];
      if (item.kind !== 'ready') return prev;
      copy[idx] = { ...item, payload: patched };
      return copy;
    });
  }, []);

  const undoReady = useCallback(() => {
    const stack = live.current.readyStack;
    if (stack.length < 2) return;
    const nextStack = stack.slice(0, -1);
    const prev = nextStack[nextStack.length - 1];
    live.current.readyStack = nextStack;
    live.current.lastReady = prev;
    setReadyStack(nextStack);
    setLastReady(prev);
    setMessages((prevMsgs) => {
      const idx = [...prevMsgs].map((m, i) => ({ m, i })).reverse().find((row) => row.m.kind === 'ready')?.i;
      if (idx == null) return prevMsgs;
      const copy = [...prevMsgs];
      const item = copy[idx];
      if (item.kind !== 'ready') return prevMsgs;
      copy[idx] = { ...item, payload: prev, version: nextStack.length };
      return copy;
    });
    setTrail((steps) => {
      const copy = [...steps];
      while (copy.length) {
        const last = copy.pop();
        if (last?.kind === 'ready') break;
      }
      if (copy.length && copy[copy.length - 1].kind === 'refine') copy.pop();
      live.current.trail = copy;
      return copy;
    });
  }, []);

  const runTurn = useCallback(async (
    text: string,
    source: 'composer' | 'clarify' | 'refine',
    extras?: { files?: PromptAttachment[]; imageIntent?: ImageIntent },
  ) => {
    const trimmed = text.trim();
    const incomingFiles = extras?.files || [];
    if (!trimmed && incomingFiles.length === 0) return;
    const snap = live.current;
    if (snap.busy) return;

    const pending = [...snap.messages].reverse().find(isOpenClarification);
    const asClarify = source === 'clarify' || (source === 'composer' && pending);
    const nextQa = asClarify && pending
      ? [...snap.qa, { q: pending.question.q, a: trimmed || 'مرفق' }]
      : snap.qa;
    const seedIdea = snap.originalIdea
      || (source === 'refine' ? snap.lastReady?.title || trimmed : trimmed)
      || (incomingFiles.length ? 'فكرة مرفقة' : 'فكرة');
    const isRefine = source === 'refine' || (Boolean(snap.lastReady) && !asClarify && Boolean(snap.originalIdea));
    const maxAsk = MODE_ASK_LIMIT[snap.mode];
    const forceReady = isRefine || snap.askedCount >= maxAsk;
    const turnIntent = extras?.imageIntent || snap.imageIntent;
    const mergedFiles = [...snap.sessionFiles];
    for (const file of incomingFiles) {
      if (!mergedFiles.some((row) => row.id === file.id)) mergedFiles.push(file);
    }
    const sessionKeep = mergedFiles.slice(-3);
    const extracted = source === 'refine'
      ? { avoid: [] as string[], must: [] as string[] }
      : extractConstraintHints(trimmed);
    const pinned = pinConstraints(extracted.avoid, extracted.must);
    const userMessage = withAttachmentContext(trimmed, sessionKeep, turnIntent);

    live.current.busy = true;
    live.current.sessionFiles = sessionKeep;
    setBusyHint('ناجي يقرأ الفكرة…');
    setBusy(true);
    setSessionFiles(sessionKeep);
    const myTurn = ++turnSeq.current;

    if (source === 'composer' && !snap.trail.length) {
      pushTrail({ id: uid('t'), kind: 'idea', label: 'الفكرة' });
    }
    if (source === 'refine') {
      pushTrail({ id: uid('t'), kind: 'refine', label: refineTrailLabel(trimmed) });
    }

    setMessages((prev) => {
      const withUser: ChatItem[] = [
        ...prev,
        {
          id: uid('u'),
          kind: 'user',
          text: trimmed,
          files: incomingFiles.length ? incomingFiles : undefined,
          imageIntent: incomingFiles.some((f) => f.kind === 'image') ? turnIntent : undefined,
        },
      ];
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
    if (source === 'composer') {
      setDraft('');
      setAttachments([]);
      setImageIntent('inspire');
    }

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
        lastReady: live.current.lastReady || snap.lastReady,
        userMessage,
        attachments: sessionKeep,
        imageIntent: turnIntent,
        pinnedAvoid: pinned.avoid,
        pinnedMust: pinned.must,
      });
      const raw = await askNaje(prompt, {
        model,
        files: toAskNajeFiles(sessionKeep),
      });
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
        pushTrail({
          id: uid('t'),
          kind: 'ask',
          label: snap.askedCount === 0 ? 'سؤال' : `سؤال ${snap.askedCount + 1}`,
        });
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
        const fromResult = extractConstraintHints(result.understanding.constraints.join('\n'));
        const nextPinned = pinConstraints(
          mergeUnique(result.understanding.avoid, fromResult.avoid),
          mergeUnique(result.understanding.must, fromResult.must),
        );
        const ready: ReadyResult = {
          ...result,
          understanding: applyPinnedToUnderstanding(result.understanding, nextPinned.avoid, nextPinned.must),
        };
        const stack = [...live.current.readyStack, ready].slice(-READY_STACK_CAP);
        live.current.lastReady = ready;
        live.current.readyStack = stack;
        setLastReady(ready);
        setReadyStack(stack);
        setHistory(saveHistoryItem({
          title: ready.title,
          prompt: ready.prompt,
          bestFor: ready.bestFor,
        }));
        pushTrail({
          id: uid('t'),
          kind: 'ready',
          label: stack.length === 1 ? 'جاهز v1' : `v${stack.length}`,
        });
        setMessages((prev) => [...prev, { id: uid('r'), kind: 'ready', payload: ready, version: stack.length }]);
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
  }, [pinConstraints, pushTrail]);

  const sendDraft = useCallback(() => {
    const text = draft.trim();
    if (!text && attachments.length === 0) {
      toast.error('احكي فكرتك أولاً');
      return;
    }
    void runTurn(text, 'composer', { files: attachments, imageIntent });
  }, [draft, attachments, imageIntent, runTurn]);

  const pickChip = useCallback((chip: string) => {
    setDraft(chip);
    requestAnimationFrame(() => {
      const area = composerRef.current?.querySelector('textarea');
      area?.focus();
    });
  }, []);

  const executeReady = useCallback(async (payload: ReadyResult) => {
    const snap = live.current;
    if (snap.busy) return;
    if (!isExecutableBestFor(payload.bestFor)) return;
    live.current.busy = true;
    setBusyHint('ناجي ينفّذ البرومبت…');
    setBusy(true);
    const myTurn = ++turnSeq.current;
    const { model } = resolveModel(snap.modelChoice, payload.prompt);
    try {
      const raw = await askNaje(payload.prompt, { model });
      if (myTurn !== turnSeq.current) return;
      const text = String(raw || '').trim();
      if (!text) throw new Error('ما رجع ناتج. جرّب مرة ثانية.');
      setMessages((prev) => [
        ...prev,
        {
          id: uid('out'),
          kind: 'result',
          text,
          bestFor: payload.bestFor,
          title: payload.title,
        },
      ]);
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

  const updateUnderstanding = useCallback((next: Understanding) => {
    const current = live.current.lastReady;
    if (!current) return;
    const patched: ReadyResult = { ...current, understanding: next };
    live.current.lastReady = patched;
    setLastReady(patched);
    const instruction = [
      'حدّث البرومبت بناءً على الفهم المعدّل مع الحفاظ على النية والقيود.',
      `الهدف: ${next.goal || '—'}`,
      `الجمهور: ${next.audience || '—'}`,
      `الصيغة: ${next.format || '—'}`,
    ].join('\n');
    void runTurn(instruction, 'refine');
  }, [runTurn]);

  const lastReadyMsg = useMemo(
    () => [...messages].reverse().find((m): m is ReadyItem => m.kind === 'ready'),
    [messages],
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-naje-canvas" dir={isRtl ? 'rtl' : 'ltr'}>
      <StudioBootSplash />

      <header className="shrink-0 px-3 pt-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-indigo-500/15 bg-gradient-to-bl from-indigo-600/10 via-transparent to-transparent px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-black text-indigo-600 dark:text-indigo-300">
                <MessageSquareText className="h-3.5 w-3.5" />
                {t('studio.promptStudio')}
              </div>
              <h1 className="text-xl font-black leading-snug text-naje-ink">احكي فكرتك — ناجي يفهمها</h1>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={resetConversation}
                className="inline-flex min-h-11 items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-black text-naje-muted dark:border-zinc-700"
              >
                <Plus className="h-3 w-3" />
                {t('studio.newSession')}
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
                    'min-h-8 rounded-full px-2.5 py-1 text-[11px] font-black transition',
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
                    'min-h-8 rounded-full px-2.5 py-1 text-[11px] font-black transition',
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
          <RefinementTrail steps={trail} />
        </div>
      </header>

      <div className="flex min-h-0 w-full flex-1 flex-col px-3 sm:px-6">
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
          {messages.length === 0 && !busy ? (
            <EmptyPromptState onPick={pickChip} />
          ) : (
            <div className="space-y-3">
              {(pinnedAvoid.length > 0 || pinnedMust.length > 0) && (
                <ConstraintsPinBar
                  avoid={pinnedAvoid}
                  must={pinnedMust}
                  onRemove={removePinned}
                />
              )}
              {messages.map((item, index) => {
                if (item.kind === 'user') {
                  return (
                    <PromptBubble
                      key={item.id}
                      text={item.text}
                      files={item.files}
                      imageIntent={item.imageIntent}
                    />
                  );
                }
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
                  const isLatest = lastReadyMsg?.id === item.id;
                  return (
                    <ReadyCard
                      key={item.id}
                      data={item.payload}
                      busy={busy}
                      showRefine={isLatest}
                      canUndo={isLatest && readyStack.length > 1}
                      onCopy={() => void copyPrompt(item.payload)}
                      onHandoff={(path) => handoff(path, item.payload)}
                      onRefine={(instruction) => void runTurn(instruction, 'refine')}
                      onExecute={isLatest ? () => void executeReady(item.payload) : undefined}
                      onUndo={isLatest ? undoReady : undefined}
                      onUpdateUnderstanding={isLatest ? updateUnderstanding : undefined}
                    />
                  );
                }
                if (item.kind === 'result') {
                  return (
                    <ResultCard
                      key={item.id}
                      title={item.title}
                      text={item.text}
                      bestFor={item.bestFor}
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
                  <span className="text-xs font-bold text-naje-muted">{busyHint}</span>
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
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              imageIntent={imageIntent}
              onImageIntentChange={setImageIntent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
