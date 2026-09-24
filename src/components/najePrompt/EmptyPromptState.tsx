import React from 'react';
import NajeThinking from '../NajeThinking';
import { IDEA_CHIPS } from '../../lib/najePromptEngine';

interface EmptyPromptStateProps {
  onPick: (chip: string) => void;
}

export function EmptyPromptState({ onPick }: EmptyPromptStateProps) {
  return (
    <div className="flex min-h-[58vh] flex-1 flex-col items-center justify-center px-4 py-12">
      <NajeThinking size={72} />
      <h2 className="mt-6 text-center text-lg font-black leading-snug text-naje-ink sm:text-xl">
        احكي فكرتك… ناجي يفهمها
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm font-bold leading-relaxed text-naje-muted">
        لا تحتاج أن تعرف كيف تكتب Prompt. فقط احكِ لناجي ماذا تريد — حتى باللهجة وبدون ترتيب.
      </p>
      <p className="mt-1.5 text-center text-[11px] font-medium text-naje-muted">
        ناجي يسأل فقط إذا نقص شيء يغيّر الناتج
      </p>
      <div className="mt-7 flex max-w-md flex-wrap justify-center gap-2">
        {IDEA_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onPick(chip)}
            className="min-h-11 rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-[12px] font-bold text-naje-ink shadow-sm transition hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmptyPromptState;
