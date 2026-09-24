import React from 'react';
import { CvData, RAIL_STATUS_AR, sectionRailStatus } from '../../lib/cvStudio';

export function CvStudioRail({
  cv,
  activeId,
  onJump,
}: {
  cv: CvData;
  activeId: string;
  onJump: (id: string) => void;
}) {
  const rows = sectionRailStatus(cv);

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-1 lg:sticky lg:top-28 lg:flex-col lg:overflow-visible lg:pb-0"
      aria-label="أقسام الاستوديو"
    >
      {rows.map((s) => {
        const active = activeId === s.id;
        const ok = s.status === 'done';
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(s.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-black transition lg:w-full lg:justify-between ${
              active
                ? 'border-[#c4a35a] bg-[#c4a35a] text-[#1a140c]'
                : 'border-white/10 bg-black/30 text-white/65 hover:border-[#c4a35a]/35 hover:text-white'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? 'bg-[#1a140c]' : ok ? 'bg-emerald-400' : s.status === 'missing' ? 'bg-rose-300' : 'bg-white/25'
                }`}
              />
              {s.ar}
            </span>
            {!active && <span className="text-[9px] font-bold opacity-70">{RAIL_STATUS_AR[s.status]}</span>}
          </button>
        );
      })}
    </nav>
  );
}