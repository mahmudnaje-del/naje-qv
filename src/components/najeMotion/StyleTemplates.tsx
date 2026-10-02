import React, { useMemo, useState } from 'react';
import { Sparkles, Search, Check, Wand2 } from 'lucide-react';
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
    <StudioCard
      title={t('motion.style.title')}
      hint={t('motion.style.hint')}
      icon={<Wand2 className="w-4 h-4 text-[#8ec8ff]" />}
    >
      {/* Search Bar */}
      <div className="mb-3.5">
        <div className="relative">
          <StudioInput
            value={query}
            onChange={setQuery}
            placeholder={t('motion.style.search')}
            className="ps-9"
          />
          <Search className="w-4 h-4 text-[#93a0b5] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-[#93a0b5] hover:text-white"
            >
              مسح
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap touch-pan-x">
        <Chip active={cat === 'all'} onClick={() => setCat('all')}>
          الكل ({STYLE_TEMPLATES.length})
        </Chip>
        {STYLE_CATEGORIES.map((c) => {
          const count = STYLE_TEMPLATES.filter((s) => s.category === c.id).length;
          return (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              {opt('cat', c.id)} ({count})
            </Chip>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {filtered.map((tpl) => {
          const on = styleId === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl.id)}
              className={`min-h-[110px] rounded-2xl border p-2.5 sm:p-3 text-start transition-all active:scale-[0.98] select-none flex flex-col justify-between relative overflow-hidden group ${
                on
                  ? 'border-[#8ec8ff] bg-gradient-to-b from-[#8ec8ff]/20 to-[#8ec8ff]/5 shadow-[0_8px_20px_-8px_rgba(142,200,255,0.4)] ring-1 ring-[#8ec8ff]/40'
                  : 'border-[#8ec8ff]/15 bg-black/40 hover:border-[#8ec8ff]/35 hover:bg-black/60'
              }`}
            >
              {/* Dynamic Gradient Swatch Bar with Shimmer */}
              <div
                className="relative mb-2 h-10 w-full overflow-hidden rounded-xl shadow-inner"
                style={{
                  background: `linear-gradient(135deg, ${tpl.gradient[0]}, ${tpl.gradient[1]})`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {on && (
                  <div className="absolute end-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[#8ec8ff] backdrop-blur-xs">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs sm:text-sm font-black text-[#e7eef8] tracking-tight truncate">
                  {t(`motion.opt.style.${tpl.id}`)}
                </div>
                <div className="mt-0.5 text-[10px] leading-relaxed text-[#93a0b5] line-clamp-2">
                  {t(`motion.opt.style.${tpl.id}.hint`)}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-[#8ec8ff]">
                <span>{opt('intensity', tpl.motionLevel)}</span>
                <span className="text-[#93a0b5]/60 text-[8px] uppercase">{tpl.category}</span>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-6 text-center text-xs text-[#93a0b5]">
          <p>{t('motion.style.empty')}</p>
        </div>
      )}
    </StudioCard>
  );
}
