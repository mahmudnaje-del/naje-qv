import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AskQuestion } from '../../lib/najePromptEngine';
import { useI18n } from '../../i18n';

interface ClarificationCardProps {
  question: AskQuestion;
  why?: string;
  active?: boolean;
  answered?: string;
  disabled?: boolean;
  onSubmit: (answer: string) => void;
}

export function ClarificationCard({
  question,
  why,
  active = true,
  answered,
  disabled,
  onSubmit,
}: ClarificationCardProps) {
  const { t, isRtl } = useI18n();
  const [draft, setDraft] = useState('');
  const locked = !active || disabled || Boolean(answered);

  const submit = (value: string) => {
    const text = value.trim();
    if (!text || locked) return;
    onSubmit(text);
  };

  return (
    <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <p className="text-start text-[10px] font-black tracking-wide text-indigo-600 dark:text-indigo-300">
        {t('prompt.clarify.kicker')}
      </p>
      <p className="mt-1.5 text-start text-sm font-black leading-relaxed text-naje-ink" dir="auto">{question.q}</p>
      {why ? (
        <p className="mt-1.5 text-start text-[11px] leading-relaxed text-naje-muted" dir="auto">{why}</p>
      ) : null}

      {!locked && question.options.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {question.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => submit(opt)}
              className="min-h-11 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-start text-[11px] font-bold text-naje-ink transition hover:border-indigo-500 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-indigo-950/40"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {!locked && (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={draft}
            dir={isRtl ? 'rtl' : 'ltr'}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit(draft);
              }
            }}
            placeholder={t('prompt.clarify.placeholder')}
            className="min-h-11 flex-1 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-start text-sm text-naje-ink placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={() => submit(draft)}
            aria-label={t('prompt.clarify.send')}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
          </button>
        </div>
      )}
    </div>
  );
}

export default ClarificationCard;
