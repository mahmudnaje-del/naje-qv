import React, { useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PromptComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function PromptComposer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'احكيلي شو بدك تعمل...',
}: PromptComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [value]);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          dir="rtl"
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="فكرتك"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!disabled && value.trim()) onSend();
            }
          }}
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-naje-ink placeholder:text-zinc-400 focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          disabled={disabled || !value.trim()}
          onClick={onSend}
          aria-label="إرسال"
          className={cn(
            'mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white transition',
            'hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}

export default PromptComposer;
