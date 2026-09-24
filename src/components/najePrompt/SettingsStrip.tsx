import React from 'react';
import { cn } from '../../lib/utils';
import {
  MODEL_OPTIONS,
  type ModelChoice,
  type PromptSettings,
} from '../../lib/najePromptEngine';
import { useI18n } from '../../i18n';
import { modelHintKey, modelLabelKey } from './promptLabels';

interface SettingsStripProps {
  settings: PromptSettings;
  onChange: (next: PromptSettings) => void;
}

const TOGGLES: Array<{ key: keyof PromptSettings; label: string; hint: string }> = [
  { key: 'showUnderstanding', label: 'prompt.settings.showUnderstanding', hint: 'prompt.settings.showUnderstandingHint' },
  { key: 'askBeforeExpensive', label: 'prompt.settings.askBefore', hint: 'prompt.settings.askBeforeHint' },
  { key: 'expertMode', label: 'prompt.settings.expert', hint: 'prompt.settings.expertHint' },
];

export function SettingsStrip({ settings, onChange }: SettingsStripProps) {
  const { t, isRtl } = useI18n();
  const patch = (partial: Partial<PromptSettings>) => {
    onChange({ ...settings, ...partial });
  };

  return (
    <div className="mt-3 space-y-2" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center gap-1.5">
        {MODEL_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            title={t(modelHintKey(opt.id))}
            onClick={() => {
              const id = opt.id as ModelChoice;
              patch({
                defaultModel: id,
                autoRouting: id === 'auto',
              });
            }}
            className={cn(
              'min-h-11 rounded-full px-3 py-1 text-[11px] font-black transition',
              settings.defaultModel === opt.id
                ? 'bg-indigo-600 text-white'
                : 'border border-zinc-200 text-naje-muted hover:text-naje-ink dark:border-zinc-700',
            )}
          >
            {t(modelLabelKey(opt.id))}
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
              title={t(row.hint)}
              onClick={() => patch({ [row.key]: !on } as Partial<PromptSettings>)}
              className={cn(
                'min-h-11 rounded-full px-3 py-1 text-[11px] font-black transition',
                on
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'border border-zinc-200 text-naje-muted hover:text-naje-ink dark:border-zinc-700',
              )}
            >
              {t(row.label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SettingsStrip;
