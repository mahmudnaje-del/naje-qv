import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  composeMotionPrompt,
  designExplanation,
  najeUnderstood,
  type IdentSlot,
  type MotionBeat,
  type MotionDraft,
} from '../../lib/motionStudio';
import { StudioCard } from './StudioUi';

export function PromptPreview({
  draft,
  slot,
  beats,
}: {
  draft: MotionDraft;
  slot: IdentSlot;
  beats: MotionBeat[];
}) {
  const [open, setOpen] = useState(false);
  const [director, setDirector] = useState(false);
  const summary = najeUnderstood(draft, slot);
  const prompt = useMemo(() => composeMotionPrompt(draft, slot), [draft, slot]);

  return (
    <StudioCard
      title="ناجي فهم"
      hint="ملخص قصير للهوية والمدة والأسلوب. ليست مفاتيح الخادم."
      action={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-white/10 px-3 text-[11px] font-bold text-white/60"
        >
          {open ? 'طيّ' : 'متقدم'}
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
        </button>
      }
    >
      <p className="text-[13px] font-bold leading-relaxed text-white">{summary}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-white/50">{designExplanation(draft, slot)}</p>
      {open && (
        <div className="mt-3 space-y-3">
          <ol className="space-y-1.5">
            {beats.map((b) => (
              <li key={`${b.from}-${b.title}`} className="flex gap-2 text-[11px] leading-relaxed text-white/60">
                <span className="shrink-0 font-mono text-[#e8b86d]" dir="ltr">
                  {b.from.toFixed(1)}–{b.to.toFixed(1)}
                </span>
                <span>
                  <span className="font-black text-white/80">{b.title}.</span> {b.body}
                </span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => setDirector((v) => !v)}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#d4a574]/35 bg-[#d4a574]/8 px-3 text-[11px] font-black text-[#e8b86d]"
          >
            {director ? 'إخفاء توجيه المخرج' : 'عرض توجيه المخرج'}
          </button>
          {director && (
            <pre
              dir="ltr"
              className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-white/8 bg-black/50 p-3 text-left font-mono text-[10px] leading-relaxed text-white/70"
            >
              {prompt}
            </pre>
          )}
        </div>
      )}
    </StudioCard>
  );
}
