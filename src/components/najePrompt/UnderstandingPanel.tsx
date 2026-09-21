import React, { useEffect, useState } from 'react';
import type { PromptFields, Understanding } from '../../lib/najePromptEngine';
import { cn } from '../../lib/utils';

const FIELD_ROWS: Array<{ key: keyof PromptFields; label: string }> = [
  { key: 'duration', label: 'المدة' },
  { key: 'ratio', label: 'النسبة' },
  { key: 'mood', label: 'المزاج' },
  { key: 'platform', label: 'المنصة' },
];

interface UnderstandingPanelProps {
  understanding: Understanding;
  fields?: PromptFields;
  editable?: boolean;
  busy?: boolean;
  defaultOpen?: boolean;
  onUpdatePrompt?: (next: Understanding) => void;
}

export function UnderstandingPanel({
  understanding,
  fields,
  editable,
  busy,
  defaultOpen = true,
  onUpdatePrompt,
}: UnderstandingPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState({
    goal: understanding.goal || '',
    audience: understanding.audience || '',
    format: understanding.format || '',
  });

  useEffect(() => {
    setDraft({
      goal: understanding.goal || '',
      audience: understanding.audience || '',
      format: understanding.format || '',
    });
  }, [understanding.goal, understanding.audience, understanding.format]);

  const extras = (fields ? FIELD_ROWS : [])
    .map((row) => ({ label: row.label, value: String(fields?.[row.key] || '').trim() }))
    .filter((row) => row.value);
  const constraints = (understanding.constraints || []).map((c) => c.trim()).filter(Boolean);

  const dirty =
    draft.goal.trim() !== (understanding.goal || '').trim() ||
    draft.audience.trim() !== (understanding.audience || '').trim() ||
    draft.format.trim() !== (understanding.format || '').trim();

  const hasBody =
    Boolean(draft.goal.trim() || draft.audience.trim() || draft.format.trim()) ||
    extras.length > 0 ||
    constraints.length > 0 ||
    Boolean(editable);

  if (!hasBody && !editable) return null;

  const submit = () => {
    if (!onUpdatePrompt || busy || !dirty) return;
    onUpdatePrompt({
      ...understanding,
      goal: draft.goal.trim(),
      audience: draft.audience.trim(),
      format: draft.format.trim(),
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex min-h-8 items-center rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide transition',
          open
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
            : 'text-naje-muted hover:text-naje-ink',
        )}
      >
        أظهر ما فهمه ناجي
      </button>

      {open && (
        <div className="space-y-2">
          {editable ? (
            <div className="space-y-2">
              {([
                { key: 'goal', label: 'الهدف' },
                { key: 'audience', label: 'الجمهور' },
                { key: 'format', label: 'الصيغة' },
              ] as const).map((row) => (
                <label key={row.key} className="block">
                  <span className="mb-1 block text-[10px] font-black text-naje-muted">{row.label}</span>
                  <input
                    value={draft[row.key]}
                    disabled={busy}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [row.key]: e.target.value }))}
                    className="min-h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-[12px] text-naje-ink focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
              ))}
              <button
                type="button"
                disabled={busy || !dirty}
                onClick={submit}
                className="min-h-11 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                حدّث البرومبت
              </button>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {draft.goal.trim() ? (
                <li className="flex gap-2 text-[12px] leading-relaxed text-naje-ink">
                  <span className="shrink-0 font-black text-naje-muted">الهدف</span>
                  <span>{draft.goal}</span>
                </li>
              ) : null}
              {draft.audience.trim() ? (
                <li className="flex gap-2 text-[12px] leading-relaxed text-naje-ink">
                  <span className="shrink-0 font-black text-naje-muted">الجمهور</span>
                  <span>{draft.audience}</span>
                </li>
              ) : null}
              {draft.format.trim() ? (
                <li className="flex gap-2 text-[12px] leading-relaxed text-naje-ink">
                  <span className="shrink-0 font-black text-naje-muted">الصيغة</span>
                  <span>{draft.format}</span>
                </li>
              ) : null}
            </ul>
          )}

          {(extras.length > 0 || constraints.length > 0) && (
            <ul className="space-y-1.5">
              {extras.map((row) => (
                <li key={row.label} className="flex gap-2 text-[12px] leading-relaxed text-naje-ink">
                  <span className="shrink-0 font-black text-naje-muted">{row.label}</span>
                  <span>{row.value}</span>
                </li>
              ))}
              {constraints.map((item) => (
                <li key={item} className="text-[12px] leading-relaxed text-naje-muted">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default UnderstandingPanel;
