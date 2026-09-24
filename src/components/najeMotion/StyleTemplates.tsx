import React, { useMemo, useState } from 'react';
import { STYLE_CATEGORIES, STYLE_TEMPLATES, type StyleCategory } from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';
import { Chip, StudioCard, StudioInput } from './StudioUi';

export function StyleTemplates({
  styleId,
  onSelect,
}: {
  styleId: string;
  onSelect: (id: string) => void;
}) {
  const { t, opt } = useMotionI18n();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<StyleCategory | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STYLE_TEMPLATES.filter((tpl) => {
      if (cat !== 'all' && tpl.category !== cat) return false;
      if (!q) return true;
      const bag = `${t(`motion.opt.style.${tpl.id}`)} ${t(`motion.opt.style.${tpl.id}.hint`)} ${tpl.name} ${tpl.nameEn} ${tpl.hint} ${opt('intensity', tpl.motionLevel)}`.toLowerCase();
      return bag.includes(q);
    });
  }, [query, cat, t, opt]);

  return (
    <StudioCard title={t('motion.style.title')} hint={t('motion.style.hint')}>
      <div className="mb-3">
        <StudioInput value={query} onChange={setQuery} placeholder={t('motion.style.search')} />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {STYLE_CATEGORIES.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {opt('cat', c.id)}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {filtered.map((tpl) => {
          const on = styleId === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl.id)}
              className={`min-h-[44px] rounded-2xl border p-2.5 text-start transition ${
                on ? 'border-[#8ec8ff] bg-[#8ec8ff]/10' : 'border-[#8ec8ff]/12 bg-black/25 hover:border-[#8ec8ff]/35'
              }`}
            >
              <span
                className="mb-2 block h-9 rounded-xl"
                style={{ background: `linear-gradient(135deg, ${tpl.gradient[0]}, ${tpl.gradient[1]})` }}
              />
              <div className="text-xs font-black text-[#e7eef8]">{t(`motion.opt.style.${tpl.id}`)}</div>
              <div className="mt-0.5 text-[10px] leading-relaxed text-[#93a0b5]">{t(`motion.opt.style.${tpl.id}.hint`)}</div>
              <div className="mt-1.5 text-[9px] font-bold tracking-wide text-[#8ec8ff]">{opt('intensity', tpl.motionLevel)}</div>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="mt-2 text-center text-[11px] text-[#93a0b5]">{t('motion.style.empty')}</p>}
    </StudioCard>
  );
}
