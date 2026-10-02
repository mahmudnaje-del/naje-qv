import React, { useMemo, useState } from 'react';
import { ChevronDown, Copy, Check, Terminal, Sparkles } from 'lucide-react';
import {
  composeMotionPrompt,
  type IdentSlot,
  type MotionBeat,
  type MotionDraft,
} from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';
import { localizedPlan } from './planCopy';
import { StudioCard } from './StudioUi';
import { toast } from '../../toastStore';

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
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(() => composeMotionPrompt(draft, slot), [draft, slot]);
  const lines = localizedPlan(t, slot, draft.duration, { motion, logo, cta });

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

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success('تم نسخ أوامر الإخراج إلى الحافظة');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <StudioCard
      title={t('motion.understood.title')}
      hint={t('motion.understood.hint')}
      icon={<Terminal className="w-4 h-4 text-[#8ec8ff]" />}
      action={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#8ec8ff]/25 bg-black/40 px-3 py-1.5 text-xs font-bold text-[#8ec8ff] active:scale-95 transition"
        >
          <span>{open ? t('motion.understood.collapse') : t('motion.understood.advanced')}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
        </button>
      }
    >
      <div className="rounded-xl bg-black/40 p-3 border border-[#8ec8ff]/15">
        <p className="text-xs sm:text-sm font-black leading-relaxed text-[#e7eef8]">
          {summaryParts.join(' · ')}
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#93a0b5]">
          {t('motion.understood.why', {
            motion,
            slot: t(`motion.piece.${slot}`),
            duration: formatNumber(draft.duration),
            intensity: t(`motion.opt.intensity.${draft.intensity}`),
            light: t(`motion.opt.light.${draft.lighting}`),
            hold: draft.duration === 5 ? t('motion.understood.holdSting') : t('motion.understood.holdFull'),
          })}
        </p>
      </div>

      {open && (
        <div className="mt-3.5 space-y-3 pt-3 border-t border-[#8ec8ff]/10">
          <ol className="space-y-2">
            {beats.map((b, i) => (
              <li
                key={`${b.from}-${i}`}
                className="flex items-start gap-2.5 rounded-xl bg-black/25 p-2.5 text-xs leading-relaxed text-[#93a0b5]"
              >
                <span
                  className="shrink-0 font-mono text-[#8ec8ff] font-bold bg-[#8ec8ff]/10 px-1.5 py-0.5 rounded"
                  dir="ltr"
                >
                  {b.from.toFixed(1)}–{b.to.toFixed(1)}s
                </span>
                <div>
                  <span className="font-black text-[#e7eef8]">{lines[i]?.title}:</span>{' '}
                  <span>{lines[i]?.body}</span>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDirector((v) => !v)}
              className="flex-1 min-h-[44px] items-center justify-center rounded-xl border border-[#8ec8ff]/30 bg-[#8ec8ff]/10 px-3 text-xs font-bold text-[#8ec8ff] active:scale-95 transition"
            >
              {director ? t('motion.understood.hide') : t('motion.understood.show')}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#8ec8ff]/30 bg-black/40 px-3.5 text-xs font-bold text-[#e7eef8] hover:text-[#8ec8ff] active:scale-95 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>
          </div>

          {director && (
            <pre
              dir="ltr"
              className="max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-[#8ec8ff]/15 bg-black/70 p-3.5 text-start font-mono text-[10px] sm:text-xs leading-relaxed text-[#e7eef8]/80 select-all"
            >
              {prompt}
            </pre>
          )}
        </div>
      )}
    </StudioCard>
  );
}
