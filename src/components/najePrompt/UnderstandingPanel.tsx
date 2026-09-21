import React from 'react';
import type { PromptFields, Understanding } from '../../lib/najePromptEngine';

const ROWS: Array<{ key: keyof Understanding; label: string }> = [
  { key: 'goal', label: 'الهدف' },
  { key: 'audience', label: 'الجمهور' },
  { key: 'format', label: 'الصيغة' },
];

const FIELD_ROWS: Array<{ key: keyof PromptFields; label: string }> = [
  { key: 'duration', label: 'المدة' },
  { key: 'ratio', label: 'النسبة' },
  { key: 'mood', label: 'المزاج' },
  { key: 'platform', label: 'المنصة' },
];

interface UnderstandingPanelProps {
  understanding: Understanding;
  fields?: PromptFields;
}

export function UnderstandingPanel({ understanding, fields }: UnderstandingPanelProps) {
  const bullets = ROWS
    .map((row) => ({ label: row.label, value: String(understanding[row.key] || '').trim() }))
    .filter((row) => row.value);
  const extras = (fields ? FIELD_ROWS : [])
    .map((row) => ({ label: row.label, value: String(fields?.[row.key] || '').trim() }))
    .filter((row) => row.value);
  const constraints = (understanding.constraints || []).map((c) => c.trim()).filter(Boolean);

  if (!bullets.length && !extras.length && !constraints.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black tracking-wide text-emerald-700 dark:text-emerald-400">
        فهمت عليك
      </p>
      <ul className="space-y-1.5">
        {bullets.map((row) => (
          <li key={row.label} className="flex gap-2 text-[12px] leading-relaxed text-naje-ink">
            <span className="shrink-0 font-black text-naje-muted">{row.label}</span>
            <span>{row.value}</span>
          </li>
        ))}
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
    </div>
  );
}

export default UnderstandingPanel;
