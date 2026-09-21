import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from '../../toastStore';
import { BEST_FOR_LABEL, type BestFor } from '../../lib/najePromptEngine';
import { cn } from '../../lib/utils';

interface ResultCardProps {
  title: string;
  text: string;
  bestFor: BestFor;
}

export function ResultCard({ title, text, bestFor }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const ltr = bestFor === 'code' || bestFor === 'ui';

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
          </p>
          <h3 className="mt-1 text-sm font-black text-naje-ink">{title}</h3>
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-black text-naje-ink dark:border-zinc-700 dark:bg-zinc-900"
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
        {text}
      </pre>
    </div>
  );
}

export default ResultCard;
