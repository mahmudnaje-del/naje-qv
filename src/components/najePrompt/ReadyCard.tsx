import React from 'react';
import { Copy, Clapperboard, Film, Palette, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  BEST_FOR_LABEL,
  REFINE_CHIPS,
  STUDIO_ACTIONS,
  type ReadyResult,
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
  onCopy: () => void;
  onHandoff: (path: string) => void;
  onRefine: (instruction: string) => void;
}

export function ReadyCard({ data, busy, showRefine = true, onCopy, onHandoff, onRefine }: ReadyCardProps) {
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

      <UnderstandingPanel understanding={data.understanding} fields={data.fields} />

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
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-black text-naje-ink dark:border-zinc-700 dark:bg-zinc-950"
        >
          <Copy className="h-3.5 w-3.5" />
          نسخ
        </button>
        {STUDIO_ACTIONS.map((action) => {
          const Icon = STUDIO_ICON[action.id];
          const recommended = action.matches.includes(data.bestFor);
          return (
            <button
              key={action.id}
              type="button"
              disabled={busy}
              onClick={() => onHandoff(action.path)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black transition',
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

      {showRefine && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {REFINE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              disabled={busy}
              onClick={() => onRefine(chip.text)}
              className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-bold text-naje-muted transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 dark:border-zinc-700"
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
