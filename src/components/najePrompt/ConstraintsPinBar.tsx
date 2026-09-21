import React from 'react';
import { X } from 'lucide-react';

interface ConstraintsPinBarProps {
  avoid: string[];
  must: string[];
  onRemove: (kind: 'avoid' | 'must', value: string) => void;
}

export function ConstraintsPinBar({ avoid, must, onRemove }: ConstraintsPinBarProps) {
  if (!avoid.length && !must.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {must.map((item) => (
        <button
          key={`must-${item}`}
          type="button"
          onClick={() => onRemove('must', item)}
          className="inline-flex min-h-8 items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-naje-ink"
          title="إزالة القيد"
        >
          <span className="text-emerald-700 dark:text-emerald-400">لازم</span>
          <span>{item}</span>
          <X className="h-3 w-3 text-naje-muted" />
        </button>
      ))}
      {avoid.map((item) => (
        <button
          key={`avoid-${item}`}
          type="button"
          onClick={() => onRemove('avoid', item)}
          className="inline-flex min-h-8 items-center gap-1 rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-naje-ink"
          title="إزالة القيد"
        >
          <span className="text-rose-700 dark:text-rose-400">بدون</span>
          <span>{item}</span>
          <X className="h-3 w-3 text-naje-muted" />
        </button>
      ))}
    </div>
  );
}

export default ConstraintsPinBar;
