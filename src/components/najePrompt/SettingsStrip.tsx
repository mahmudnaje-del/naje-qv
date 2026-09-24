import React from 'react';
import { cn } from '../../lib/utils';
import {
  MODEL_OPTIONS,
  type ModelChoice,
  type PromptSettings,
} from '../../lib/najePromptEngine';

interface SettingsStripProps {
  settings: PromptSettings;
  onChange: (next: PromptSettings) => void;
}

const TOGGLES: Array<{ key: keyof PromptSettings; label: string; hint: string }> = [
  { key: 'showUnderstanding', label: 'أظهر الفهم', hint: 'عرض ما فهمه ناجي' },
  { key: 'askBeforeExpensive', label: 'أكد قبل الاستوديو', hint: 'تأكيد قبل الإرسال لأد/انترو/سيرة/تصميم' },
  { key: 'expertMode', label: 'تحرير متقدم', hint: 'هدف/سياق/قيود/مخرج قابل للتعديل' },
];

export function SettingsStrip({ settings, onChange }: SettingsStripProps) {
  const patch = (partial: Partial<PromptSettings>) => {
    onChange({ ...settings, ...partial });
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {MODEL_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            title={opt.hint}
            onClick={() => {
              const id = opt.id as ModelChoice;
              patch({
                defaultModel: id,
                autoRouting: id === 'auto',
              });
            }}
            className={cn(
              'min-h-8 rounded-full px-2.5 py-1 text-[10px] font-black transition',
              settings.defaultModel === opt.id
                ? 'bg-indigo-600 text-white'
                : 'border border-zinc-200 text-naje-muted hover:text-naje-ink dark:border-zinc-700',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TOGGLES.map((row) => {
          const on = Boolean(settings[row.key]);
          return (
            <button
              key={row.key}
              type="button"
              title={row.hint}
              onClick={() => patch({ [row.key]: !on } as Partial<PromptSettings>)}
              className={cn(
                'min-h-8 rounded-full px-2.5 py-1 text-[10px] font-black transition',
                on
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'border border-zinc-200 text-naje-muted hover:text-naje-ink dark:border-zinc-700',
              )}
            >
              {row.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SettingsStrip;
