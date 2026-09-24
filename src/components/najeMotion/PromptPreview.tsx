import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  composeMotionPrompt,
  type IdentSlot,
  type MotionBeat,
  type MotionDraft,
} from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';
import { localizedPlan } from './planCopy';
import { StudioCard } from './StudioUi';

export function PromptPreview({
  draft,
  slot,
  beats,
  motion,
  logo,
  cta,
}: {
  draft: MotionDraft;
  slot: IdentSlot;
  beats: MotionBeat[];
  motion: string;
  logo: string;
  cta: string;
}) {
  const { t, formatNumber } = useMotionI18n();
  const [open, setOpen] = useState(false);
  const [director, setDirector] = useState(false);
  const prompt = useMemo(() => composeMotionPrompt(draft, slot), [draft, slot]);
  const lines = localizedPlan(t, slot, durationOf(draft), { motion, logo, cta });

  const brand = draft.brandName.trim() || t('motion.understood.unnamed');
  const summaryParts = [
    brand,
    t(`motion.piece.${slot}`),
    `${formatNumber(draft.duration)}${t('motion.format.unit')}`,
    t(`motion.opt.style.${draft.styleId}`),
    t(`motion.opt.motion.${draft.motion}`),
    draft.aspect,
  ];
  if (draft.projectType) summaryParts.push(t(`motion.opt.project.${draft.projectType}`));
  if (draft.sound !== 'none') summaryParts.push(t(`motion.opt.sound.${draft.sound}`));
  if (draft.brandLock) summaryParts.push(t('motion.understood.lock'));

  return (
    <StudioCard
      title={t('motion.understood.title')}
      hint={t('motion.understood.hint')}
      action={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#8ec8ff]/20 px-3 text-[11px] font-bold text-[#93a0b5]"
        >
          {open ? t('motion.understood.collapse') : t('motion.understood.advanced')}
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
        </button>
      }
    >
      <p className="text-[13px] font-bold leading-relaxed text-[#e7eef8]">{summaryParts.join(' · ')}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-[#93a0b5]">
        {t('motion.understood.why', {
          motion,
          slot: t(`motion.piece.${slot}`),
          duration: formatNumber(draft.duration),
          intensity: t(`motion.opt.intensity.${draft.intensity}`),
          light: t(`motion.opt.light.${draft.lighting}`),
          hold: draft.duration === 5 ? t('motion.understood.holdSting') : t('motion.understood.holdFull'),
        })}
      </p>
      {open && (
        <div className="mt-3 space-y-3">
          <ol className="space-y-1.5">
            {beats.map((b, i) => (
              <li key={`${b.from}-${i}`} className="flex gap-2 text-[11px] leading-relaxed text-[#93a0b5]">
                <span className="shrink-0 font-mono text-[#8ec8ff]" dir="ltr">
                  {b.from.toFixed(1)}–{b.to.toFixed(1)}
                </span>
                <span>
                  <span className="font-black text-[#e7eef8]">{lines[i]?.title}.</span> {lines[i]?.body}
                </span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => setDirector((v) => !v)}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#8ec8ff]/35 bg-[#8ec8ff]/10 px-3 text-[11px] font-black text-[#8ec8ff]"
          >
            {director ? t('motion.understood.hide') : t('motion.understood.show')}
          </button>
          {director && (
            <pre
              dir="ltr"
              className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-[#8ec8ff]/12 bg-black/50 p-3 text-start font-mono text-[10px] leading-relaxed text-[#e7eef8]/80"
            >
              {prompt}
            </pre>
          )}
        </div>
      )}
    </StudioCard>
  );
}

function durationOf(draft: MotionDraft) {
  return draft.duration;
}
