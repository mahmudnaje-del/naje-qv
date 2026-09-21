import React from 'react';
import NajeThinking from '../NajeThinking';
import { IDEA_CHIPS } from '../../lib/najePromptEngine';

interface EmptyPromptStateProps {
  onPick: (chip: string) => void;
}

export function EmptyPromptState({ onPick }: EmptyPromptStateProps) {
  return (
    <div className="flex min-h-[52vh] flex-1 flex-col items-center justify-center px-3 py-10">
      <NajeThinking size={56} />
      <p className="mt-5 text-sm font-bold text-naje-muted">احكيلي شو بدك تعمل...</p>
      <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
        {IDEA_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onPick(chip)}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-bold text-naje-ink transition hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmptyPromptState;
