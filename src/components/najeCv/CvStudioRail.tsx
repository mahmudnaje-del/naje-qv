import React from 'react';
import { useI18n } from '../../i18n';
import { CvData, sectionRailStatus } from '../../lib/cvStudio';

export function CvStudioRail({
  cv,
  activeId,
  onJump,
}: {
  cv: CvData;
  activeId: string;
  onJump: (id: string) => void;
}) {
  const { t } = useI18n();
  const rows = sectionRailStatus(cv);

  return (
    <div className="flex gap-2 lg:sticky lg:top-28">
      <div className="cv-spine hidden shrink-0 lg:block" aria-hidden />
      <nav
        className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
        aria-label={t('cv.rail.aria')}
      >
        {rows.map((s) => {
          const active = activeId === s.id;
          const ok = s.status === 'done';
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onJump(s.id)}
              className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-start text-[10px] font-black transition lg:w-full lg:justify-between ${
                active
                  ? 'border-[#c4a35a]/70 bg-[#c4a35a]/15 text-[#f3ead8]'
                  : 'border-transparent bg-transparent text-white/55 hover:border-[#c4a35a]/25 hover:text-white'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    ok ? 'bg-emerald-400' : s.status === 'missing' ? 'bg-rose-300' : 'bg-[#c4a35a]/50'
                  }`}
                />
                {t(`cv.rail.${s.id}`)}
              </span>
              {!active && <span className="text-[9px] font-bold text-white/40">{t(`cv.rail.${s.status}`)}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
