import React, { useState } from 'react';
import { Copy, ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from '../../toastStore';
import { followUpChips, type BestFor } from '../../lib/najePromptEngine';
import { cn } from '../../lib/utils';
import { useI18n } from '../../i18n';
import { bestForKey, followLabelKeys } from './promptLabels';

interface ResultCardProps {
  title: string;
  text: string;
  bestFor: BestFor;
  busy?: boolean;
  streaming?: boolean;
  onFollowUp?: (instruction: string, displayLabel?: string) => void;
}

export function ResultCard({ title, text, bestFor, busy, streaming, onFollowUp }: ResultCardProps) {
  const { t, isRtl } = useI18n();
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const ltr = bestFor === 'code' || bestFor === 'ui';
  const chips = onFollowUp ? followUpChips(bestFor) : [];
  const labels = followLabelKeys(bestFor);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t('prompt.toast.copiedResult'));
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error(t('prompt.toast.copyFail'));
    }
  };

  return (
    <div
      className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-start text-[10px] font-black tracking-wide text-indigo-600 dark:text-indigo-300">
            {t('prompt.result.output', { label: t(bestForKey(bestFor)) })}
            {streaming ? ` — ${t('prompt.result.writing')}` : ''}
          </p>
          <h3 className="mt-1 text-start text-sm font-black text-naje-ink" dir="auto">{title}</h3>
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          disabled={!text.trim()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-black text-naje-ink disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? t('prompt.result.copied') : t('prompt.result.copy')}
        </button>
      </div>
      <pre
        dir={ltr ? 'ltr' : 'auto'}
        className={cn(
          'max-h-96 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-zinc-950 p-4 text-[12.5px] leading-relaxed text-zinc-100',
          ltr ? 'text-left font-mono' : 'text-start',
        )}
      >
        {text || (streaming ? '…' : '')}
      </pre>

      {onFollowUp && !streaming && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip, index) => (
            <button
              key={labels[index] || chip.label}
              type="button"
              disabled={busy}
              onClick={() => onFollowUp(chip.text, t(labels[index] || ''))}
              className="min-h-11 rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-bold text-naje-muted transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 dark:border-zinc-700"
            >
              {t(labels[index] || chip.label)}
            </button>
          ))}
        </div>
      )}

      {!streaming && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-naje-muted">{t('prompt.result.usefulQ')}</span>
          <button
            type="button"
            onClick={() => setVote('up')}
            aria-label={t('prompt.result.useful')}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full border',
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
            aria-label={t('prompt.result.notUseful')}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full border',
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
