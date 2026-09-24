import React, { useState } from 'react';
import { Copy, ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from '../../toastStore';
import { BEST_FOR_LABEL, followUpChips, type BestFor } from '../../lib/najePromptEngine';
import { cn } from '../../lib/utils';

interface ResultCardProps {
  title: string;
  text: string;
  bestFor: BestFor;
  busy?: boolean;
  streaming?: boolean;
  onFollowUp?: (instruction: string) => void;
}

export function ResultCard({ title, text, bestFor, busy, streaming, onFollowUp }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const ltr = bestFor === 'code' || bestFor === 'ui';
  const chips = onFollowUp ? followUpChips(bestFor) : [];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('تم نسخ الناتج');
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('ما قدرت أنسخ. حدّد النص وانسخه يدوياً.');
    }
  };

  return (
    <div className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black tracking-wide text-indigo-600 dark:text-indigo-300">
            ناتج {BEST_FOR_LABEL[bestFor] || bestFor}
            {streaming ? ' — يكتب…' : ''}
          </p>
          <h3 className="mt-1 text-sm font-black text-naje-ink">{title}</h3>
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          disabled={!text.trim()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-black text-naje-ink disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? 'تم' : 'نسخ'}
        </button>
      </div>
      <pre
        dir={ltr ? 'ltr' : 'auto'}
        className={cn(
          'max-h-96 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-zinc-950 p-4 text-[12.5px] leading-relaxed text-zinc-100',
          ltr && 'text-left font-mono',
        )}
      >
        {text || (streaming ? '…' : '')}
      </pre>

      {onFollowUp && !streaming && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              disabled={busy}
              onClick={() => onFollowUp(chip.text)}
              className="min-h-8 rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-bold text-naje-muted transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 dark:border-zinc-700"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {!streaming && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-naje-muted">مفيد؟</span>
          <button
            type="button"
            onClick={() => setVote('up')}
            aria-label="مفيد"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border',
              vote === 'up'
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700'
                : 'border-zinc-200 text-naje-muted dark:border-zinc-700',
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setVote('down')}
            aria-label="غير مفيد"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border',
              vote === 'down'
                ? 'border-rose-500 bg-rose-500/15 text-rose-700'
                : 'border-zinc-200 text-naje-muted dark:border-zinc-700',
            )}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ResultCard;
