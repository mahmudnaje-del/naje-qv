import React from 'react';
import type { HistoryItem } from '../../lib/najePromptEngine';
import { useI18n } from '../../i18n';

interface HistoryStripProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export function HistoryStrip({ items, onSelect }: HistoryStripProps) {
  const { t, isRtl, formatNumber, formatDate } = useI18n();
  if (!items.length) return null;

  const when = (at: number) => {
    const delta = Date.now() - at;
    if (delta < 45_000) return t('prompt.history.now');
    if (delta < 3_600_000) {
      return t('prompt.history.minutes', {
        n: formatNumber(Math.max(1, Math.floor(delta / 60_000))),
      });
    }
    if (delta < 86_400_000) {
      return t('prompt.history.hours', {
        n: formatNumber(Math.max(1, Math.floor(delta / 3_600_000))),
      });
    }
    return formatDate(at, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mt-3" dir={isRtl ? 'rtl' : 'ltr'}>
      <p className="mb-1.5 text-start text-[10px] font-black text-naje-muted">{t('prompt.history.title')}</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-bold text-naje-ink dark:border-zinc-700 dark:bg-zinc-950"
            title={item.title}
          >
            <span className="max-w-[140px] truncate">{item.title}</span>
            <span className="text-[10px] font-medium text-naje-muted">
              {when(item.at)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default HistoryStrip;
