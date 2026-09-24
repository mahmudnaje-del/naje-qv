import React, { useEffect, useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import type { PromptFields, Understanding } from '../../lib/najePromptEngine';
import { splitAssumptions } from '../../lib/najePromptEngine';
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
  expert?: boolean;
  busy?: boolean;
  defaultOpen?: boolean;
  showToggle?: boolean;
  onUpdatePrompt?: (next: Understanding) => void;
  onFeedback?: (vote: 'up' | 'down') => void;
}

export function UnderstandingPanel({
  understanding,
  fields,
  editable,
  expert,
  busy,
  defaultOpen = true,
  showToggle = true,
  onUpdatePrompt,
  onFeedback,
}: UnderstandingPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [draft, setDraft] = useState({
    goal: understanding.goal || '',
    audience: understanding.audience || '',
    format: understanding.format || '',
    context: understanding.context || '',
    output: understanding.output || '',
    constraints: (understanding.constraints || []).join('\n'),
    references: (understanding.references || []).join('\n'),
  });

  useEffect(() => {
    setDraft({
      goal: understanding.goal || '',
      audience: understanding.audience || '',
      format: understanding.format || '',
      context: understanding.context || '',
      output: understanding.output || '',
      constraints: (understanding.constraints || []).join('\n'),
      references: (understanding.references || []).join('\n'),
    });
    setVote(null);
  }, [
    understanding.goal,
    understanding.audience,
    understanding.format,
    understanding.context,
    understanding.output,
    understanding.constraints,
    understanding.references,
  ]);

  const extras = (fields ? FIELD_ROWS : [])
    .map((row) => ({ label: row.label, value: String(fields?.[row.key] || '').trim() }))
    .filter((row) => row.value);
  const { facts, assumptions } = splitAssumptions(understanding.constraints || []);

  const listFromText = (raw: string) =>
    raw
      .split(/\n|؛|;/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);

  const dirty =
    draft.goal.trim() !== (understanding.goal || '').trim() ||
    draft.audience.trim() !== (understanding.audience || '').trim() ||
    draft.format.trim() !== (understanding.format || '').trim() ||
    draft.context.trim() !== (understanding.context || '').trim() ||
    draft.output.trim() !== (understanding.output || '').trim() ||
    listFromText(draft.constraints).join('|') !== (understanding.constraints || []).join('|') ||
    listFromText(draft.references).join('|') !== (understanding.references || []).join('|');

  const hasBody =
    Boolean(draft.goal.trim() || draft.audience.trim() || draft.format.trim() || draft.context.trim() || draft.output.trim()) ||
    extras.length > 0 ||
    facts.length > 0 ||
    assumptions.length > 0 ||
    Boolean(editable);

  if (!hasBody && !editable) return null;

  const submit = () => {
    if (!onUpdatePrompt || busy || !dirty) return;
    onUpdatePrompt({
      ...understanding,
      goal: draft.goal.trim(),
      audience: draft.audience.trim(),
      format: draft.format.trim(),
      context: draft.context.trim(),
      output: draft.output.trim(),
      constraints: listFromText(draft.constraints),
      references: listFromText(draft.references),
    });
  };

  const voteNow = (next: 'up' | 'down') => {
    if (busy) return;
    setVote(next);
    onFeedback?.(next);
  };

  const compactRows: Array<{ label: string; value: string }> = [
    { label: 'الهدف', value: draft.goal },
    { label: 'الجمهور', value: draft.audience },
    { label: 'الصيغة', value: draft.format },
    { label: 'السياق', value: draft.context },
    { label: 'المخرج', value: draft.output },
  ].filter((row) => row.value.trim());

  return (
    <div className="space-y-2">
      {showToggle && (
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
          {open ? 'إخفاء ما فهمه ناجي' : 'أظهر ما فهمه ناجي'}
        </button>
      )}

      {open && (
        <div className="space-y-2">
          {editable ? (
            <div className="space-y-2">
              {([
                { key: 'goal', label: 'الهدف' },
                { key: 'audience', label: 'الجمهور' },
                { key: 'format', label: 'الصيغة' },
                ...(expert
                  ? ([
                      { key: 'context', label: 'السياق' },
                      { key: 'output', label: 'المخرج' },
                    ] as const)
                  : []),
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
              {expert && (
                <>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black text-naje-muted">القيود والمتطلبات</span>
                    <textarea
                      value={draft.constraints}
                      disabled={busy}
                      rows={3}
                      onChange={(e) => setDraft((prev) => ({ ...prev, constraints: e.target.value }))}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-[12px] text-naje-ink focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black text-naje-muted">مراجع</span>
                    <textarea
                      value={draft.references}
                      disabled={busy}
                      rows={2}
                      onChange={(e) => setDraft((prev) => ({ ...prev, references: e.target.value }))}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-[12px] text-naje-ink focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  </label>
                </>
              )}
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
              {compactRows.map((row) => (
                <li key={row.label} className="flex gap-2 text-[12px] leading-relaxed text-naje-ink">
                  <span className="shrink-0 font-black text-naje-muted">{row.label}</span>
                  <span>{row.value}</span>
                </li>
              ))}
            </ul>
          )}

          {(extras.length > 0 || facts.length > 0 || assumptions.length > 0) && (
            <ul className="space-y-1.5">
              {extras.map((row) => (
                <li key={row.label} className="flex gap-2 text-[12px] leading-relaxed text-naje-ink">
                  <span className="shrink-0 font-black text-naje-muted">{row.label}</span>
                  <span>{row.value}</span>
                </li>
              ))}
              {facts.map((item) => (
                <li key={item} className="text-[12px] leading-relaxed text-naje-muted">
                  {item}
                </li>
              ))}
              {assumptions.map((item) => (
                <li key={item} className="text-[12px] leading-relaxed text-amber-700 dark:text-amber-400">
                  {item}
                </li>
              ))}
            </ul>
          )}

          {onFeedback && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-black text-naje-muted">الفهم صحيح؟</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => voteNow('up')}
                aria-label="نعم"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border',
                  vote === 'up'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700'
                    : 'border-zinc-200 text-naje-muted dark:border-zinc-700',
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => voteNow('down')}
                aria-label="لا"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border',
                  vote === 'down'
                    ? 'border-rose-500 bg-rose-500/15 text-rose-700'
                    : 'border-zinc-200 text-naje-muted dark:border-zinc-700',
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UnderstandingPanel;
