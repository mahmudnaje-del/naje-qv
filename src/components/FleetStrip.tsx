import type { DispatchDecision } from '../lib/agentFleet';

export function FleetStrip({ decision }: { decision: DispatchDecision }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold">
      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-700 dark:text-violet-300">
        {decision.tier} · {decision.modelId}
      </span>
      {decision.specialists.map((s) => (
        <span key={s.id} className="rounded-full bg-black/5 px-2 py-0.5 text-gray-600 dark:bg-white/10 dark:text-gray-300">
          {s.titleAr}
        </span>
      ))}
      {decision.video.requestedSec ? (
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-800 dark:text-amber-200">
          {decision.video.noteAr}
        </span>
      ) : null}
    </div>
  );
}
