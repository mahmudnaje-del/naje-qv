import React from 'react';
import type { TrailItem } from '../../lib/najePromptEngine';
import { useI18n } from '../../i18n';

interface RefinementTrailProps {
  steps: TrailItem[];
}

export function RefinementTrail({ steps }: RefinementTrailProps) {
  const { isRtl } = useI18n();
  if (steps.length < 2) return null;
  return (
    <div
      className="mt-3 flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] font-bold text-naje-muted"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {index > 0 && <span className="shrink-0 opacity-40">{isRtl ? '←' : '→'}</span>}
          <span
            className={
              index === steps.length - 1
                ? 'shrink-0 rounded-full bg-zinc-900/90 px-2 py-0.5 text-white dark:bg-white dark:text-zinc-900'
                : 'shrink-0'
            }
          >
            {step.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

export default RefinementTrail;
