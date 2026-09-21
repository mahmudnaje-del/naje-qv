import React, { useMemo, useState } from 'react';
import { STYLE_CATEGORIES, STYLE_TEMPLATES } from '../../lib/motionStudio';
import { Chip, StudioCard, StudioInput } from './StudioUi';

export function StyleTemplates({
  styleId,
  onSelect,
}: {
  styleId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<(typeof STYLE_CATEGORIES)[number]['id']>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STYLE_TEMPLATES.filter((t) => {
      if (cat !== 'all' && t.category !== cat) return false;
      if (!q) return true;
      return `${t.name} ${t.nameEn} ${t.hint} ${t.motionLevelAr}`.toLowerCase().includes(q);
    });
  }, [query, cat]);

  return (
    <StudioCard title="أسلوب الهوية" hint="اختيار البطاقة يملأ الحركة والإضاءة والكاميرا. يمكنك تعديلها بعد ذلك.">
      <div className="mb-3">
        <StudioInput value={query} onChange={setQuery} placeholder="ابحث: سينمائي، تعليمي، بودكاست…" />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {STYLE_CATEGORIES.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.ar}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {filtered.map((t) => {
          const on = styleId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={`min-h-[44px] rounded-2xl border p-2.5 text-right transition ${
                on ? 'border-[#d4a574] bg-[#d4a574]/10' : 'border-white/10 bg-black/25 hover:border-white/20'
              }`}
            >
              <span
                className="mb-2 block h-9 rounded-xl"
                style={{ background: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})` }}
              />
              <div className="text-xs font-black text-white">{t.name}</div>
              <div className="mt-0.5 text-[10px] leading-relaxed text-white/45">{t.hint}</div>
              <div className="mt-1.5 text-[9px] font-bold tracking-wide text-[#e8b86d]">{t.motionLevelAr}</div>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="mt-2 text-center text-[11px] text-white/40">لا أسلوب يطابق البحث.</p>
      )}
    </StudioCard>
  );
}
