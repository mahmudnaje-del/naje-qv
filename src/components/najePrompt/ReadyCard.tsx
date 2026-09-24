import React, { useState } from 'react';
import { Copy, Clapperboard, Film, Palette, FileText, Play, Undo2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  BEST_FOR_LABEL,
  HANDOFF_CREDIT_NOTICE,
  REFINE_CHIPS,
  STUDIO_ACTIONS,
  isExecutableBestFor,
  isPaidStudioHandoff,
  type ReadyResult,
  type Understanding,
} from '../../lib/najePromptEngine';
import UnderstandingPanel from './UnderstandingPanel';

const STUDIO_ICON = {
  ad: Clapperboard,
  ident: Film,
  creative: Palette,
  cv: FileText,
} as const;

interface ReadyCardProps {
  data: ReadyResult;
  busy?: boolean;
  showRefine?: boolean;
  canUndo?: boolean;
  showUnderstanding?: boolean;
  expert?: boolean;
  askBeforeExpensive?: boolean;
  balance?: number | null;
  onCopy: () => void;
  onHandoff: (path: string) => void;
  onRefine: (instruction: string) => void;
  onExecute?: () => void;
  onUndo?: () => void;
  onUpdateUnderstanding?: (next: Understanding) => void;
  onUnderstandingFeedback?: (vote: 'up' | 'down') => void;
}

export function ReadyCard({
  data,
  busy,
  showRefine = true,
  canUndo,
  showUnderstanding = true,
  expert,
  askBeforeExpensive,
  balance,
  onCopy,
  onHandoff,
  onRefine,
  onExecute,
  onUndo,
  onUpdateUnderstanding,
  onUnderstandingFeedback,
}: ReadyCardProps) {
  const canExecute = isExecutableBestFor(data.bestFor) && Boolean(onExecute);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const requestHandoff = (path: string, studioId: string) => {
    if (askBeforeExpensive && isPaidStudioHandoff(studioId)) {
      setPendingPath(path);
      return;
    }
    onHandoff(path);
  };

  return (
    <div className="space-y-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-black leading-snug text-naje-ink">{data.title}</h2>
          <p className="mt-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
            الأنسب: {BEST_FOR_LABEL[data.bestFor] || data.bestFor}
          </p>
        </div>
      </div>

      {(showUnderstanding || expert) && (
        <UnderstandingPanel
          understanding={data.understanding}
          fields={data.fields}
          editable={showRefine}
          expert={expert}
          busy={busy}
          defaultOpen
          onUpdatePrompt={onUpdateUnderstanding}
          onFeedback={onUnderstandingFeedback}
        />
      )}

      <pre
        dir="auto"
        className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-zinc-950 p-4 text-[12.5px] leading-relaxed text-zinc-100"
      >
        {data.prompt}
      </pre>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={onCopy}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-black text-naje-ink dark:border-zinc-700 dark:bg-zinc-950"
        >
          <Copy className="h-3.5 w-3.5" />
          نسخ
        </button>
        {canExecute && (
          <button
            type="button"
            disabled={busy}
            onClick={onExecute}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-[11px] font-black text-white dark:bg-white dark:text-zinc-900"
          >
            <Play className="h-3.5 w-3.5" />
            نفّذ هنا
          </button>
        )}
        {canUndo && onUndo && (
          <button
            type="button"
            disabled={busy}
            onClick={onUndo}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-black text-naje-ink dark:border-zinc-700 dark:bg-zinc-950"
          >
            <Undo2 className="h-3.5 w-3.5" />
            النسخة قبل التعديل
          </button>
        )}
        {STUDIO_ACTIONS.map((action) => {
          const Icon = STUDIO_ICON[action.id];
          const recommended = action.matches.includes(data.bestFor);
          return (
            <button
              key={action.id}
              type="button"
              disabled={busy}
              onClick={() => requestHandoff(action.path, action.id)}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black transition',
                recommended
                  ? 'bg-indigo-600 text-white'
                  : 'border border-zinc-200 bg-white text-naje-ink dark:border-zinc-700 dark:bg-zinc-950',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label}
            </button>
          );
        })}
      </div>

      {pendingPath && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-[12px] font-bold leading-relaxed text-naje-ink">{HANDOFF_CREDIT_NOTICE}</p>
          {typeof balance === 'number' && (
            <p className="mt-1 text-[11px] font-bold text-naje-muted">
              رصيدك الحالي: {balance} نقطة — الخصم يتم داخل الاستوديو عند التوليد.
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const path = pendingPath;
                setPendingPath(null);
                if (path) onHandoff(path);
              }}
              className="min-h-10 rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white"
            >
              متابعة إلى الاستوديو
            </button>
            <button
              type="button"
              onClick={() => setPendingPath(null)}
              className="min-h-10 rounded-xl border border-zinc-200 px-3 py-1.5 text-[11px] font-black text-naje-ink dark:border-zinc-700"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {showRefine && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {REFINE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              disabled={busy}
              onClick={() => onRefine(chip.text)}
              className="min-h-8 rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-bold text-naje-muted transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 dark:border-zinc-700"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReadyCard;
