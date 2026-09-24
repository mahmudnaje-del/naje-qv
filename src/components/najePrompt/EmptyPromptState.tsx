import React from 'react';
import NajeThinking from '../NajeThinking';
import { useI18n } from '../../i18n';
import { EXAMPLE_KEYS } from './promptLabels';

interface EmptyPromptStateProps {
  onPick: (chip: string) => void;
}

const STEPS = ['prompt.empty.step1', 'prompt.empty.step2', 'prompt.empty.step3'] as const;

export function EmptyPromptState({ onPick }: EmptyPromptStateProps) {
  const { t, isRtl, formatNumber } = useI18n();

  return (
    <div
      className="flex min-h-[58vh] flex-1 flex-col items-center justify-center px-4 py-12"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <NajeThinking size={72} />
      <h2 className="mt-6 max-w-md text-center text-lg font-black leading-snug text-naje-ink sm:text-xl">
        {t('prompt.empty.title')}
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm font-bold leading-relaxed text-naje-muted">
        {t('prompt.empty.subtitle')}
      </p>
      <ol className="mt-5 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-3">
        {STEPS.map((key, index) => (
          <li
            key={key}
            className="flex min-h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-start text-[12px] font-bold text-naje-ink dark:border-zinc-700 dark:bg-zinc-900"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[11px] font-black text-indigo-600 dark:text-indigo-300">
              {formatNumber(index + 1)}
            </span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-center text-[11px] font-medium text-naje-muted">
        {t('prompt.empty.note')}
      </p>
      <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
        {EXAMPLE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick(t(key))}
            className="min-h-11 rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-[12px] font-bold text-naje-ink shadow-sm transition hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmptyPromptState;
