import React from 'react';
import { completeness, CvData, STUDIO_SECTIONS } from '../../lib/cvStudio';

export function CvStudioRail({
  cv,
  activeId,
  onJump,
}: {
  cv: CvData;
  activeId: string;
  onJump: (id: string) => void;
}) {
  const ticks = completeness(cv);
  const langOk = cv.languages.some((l) => l.name.trim());
  const projOk = cv.projects.some((p) => p.name.trim());

  const okFor = (id: string, tick?: string) => {
    if (id === 'cv-sec-languages') return langOk;
    if (id === 'cv-sec-projects') return projOk;
    if (id === 'cv-sec-market' || id === 'cv-sec-template') return true;
    if (id === 'cv-sec-identity') return ticks.filter((t) => t.id === 'name' || t.id === 'title').every((t) => t.ok);
    if (!tick) return false;
    return Boolean(ticks.find((t) => t.id === tick)?.ok);
  };

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-1 lg:sticky lg:top-28 lg:flex-col lg:overflow-visible lg:pb-0"
      aria-label="أقسام الاستوديو"
    >
      {STUDIO_SECTIONS.map((s) => {
        const active = activeId === s.id;
        const ok = okFor(s.id, s.tick);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(s.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-black transition lg:w-full lg:justify-start ${
              active
                ? 'border-[#c4a35a] bg-[#c4a35a] text-[#1a140c]'
                : 'border-white/10 bg-black/30 text-white/65 hover:border-[#c4a35a]/35 hover:text-white'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                active ? 'bg-[#1a140c]' : ok ? 'bg-emerald-400' : 'bg-white/25'
              }`}
            />
            {s.ar}
          </button>
        );
      })}
    </nav>
  );
}
