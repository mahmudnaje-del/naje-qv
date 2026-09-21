import React from 'react';
import { formatHistoryTime, type HistoryItem } from '../../lib/najePromptEngine';

interface HistoryStripProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export function HistoryStrip({ items, onSelect }: HistoryStripProps) {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[10px] font-black text-naje-muted">آخر البرومبتات</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-bold text-naje-ink dark:border-zinc-700 dark:bg-zinc-950"
            title={item.title}
          >
            <span className="max-w-[140px] truncate">{item.title}</span>
            <span className="text-[10px] font-medium text-naje-muted">
              {formatHistoryTime(item.at)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default HistoryStrip;
