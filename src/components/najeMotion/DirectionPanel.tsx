import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  BACKDROPS,
  CAMERAS,
  INTENSITIES,
  LIGHTS,
  LOGO_BEHAVIORS,
  LOGO_FINISHES,
  LOGO_POSITIONS,
  MOTIONS,
  OUTRO_CTAS,
  TEXT_ANIMS,
  type IdentSlot,
  type MotionDraft,
} from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';
import { Chip, ChipRow, StudioCard, StudioInput } from './StudioUi';

export function DirectionPanel({
  draft,
  slot,
  onChange,
}: {
  draft: MotionDraft;
  slot: IdentSlot;
  onChange: (patch: Partial<MotionDraft>) => void;
}) {
  const { t, opt } = useMotionI18n();
  const [open, setOpen] = useState(false);

  const body = (
    <div className="space-y-3">
      <ChipRow title={t('motion.dir.motion')}>
        {MOTIONS.map((x) => (
          <Chip key={x.id} active={draft.motion === x.id} onClick={() => onChange({ motion: x.id })}>
            {opt('motion', x.id)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title={t('motion.dir.intensity')}>
        {INTENSITIES.map((x) => (
          <Chip key={x.id} active={draft.intensity === x.id} onClick={() => onChange({ intensity: x.id })}>
            {opt('intensity', x.id)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title={t('motion.dir.camera')}>
        {CAMERAS.map((x) => (
          <Chip key={x.id} active={draft.camera === x.id} onClick={() => onChange({ camera: x.id })}>
            {opt('camera', x.id)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title={t('motion.dir.light')}>
        {LIGHTS.map((x) => (
          <Chip key={x.id} active={draft.lighting === x.id} onClick={() => onChange({ lighting: x.id })}>
            {opt('light', x.id)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title={t('motion.dir.bg')} hint={t('motion.honesty.alpha')}>
        {BACKDROPS.map((x) => (
          <Chip key={x.id} active={draft.bgStyle === x.id} onClick={() => onChange({ bgStyle: x.id })}>
            {opt('backdrop', x.id)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title={t('motion.dir.pos')}>
        {LOGO_POSITIONS.map((x) => (
          <Chip key={x.id} active={draft.logoPosition === x.id} onClick={() => onChange({ logoPosition: x.id })}>
            {opt('pos', x.id)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title={t('motion.dir.finish')}>
        {LOGO_FINISHES.map((x) => (
          <Chip key={x.id} active={draft.logoFinish === x.id} onClick={() => onChange({ logoFinish: x.id })}>
            {opt('finish', x.id)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title={t('motion.dir.logo')}>
        {LOGO_BEHAVIORS.map((x) => (
          <Chip key={x.id} active={draft.logoBehavior === x.id} onClick={() => onChange({ logoBehavior: x.id })}>
            {opt('logo', x.id)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title={t('motion.dir.type')}>
        {TEXT_ANIMS.map((x) => (
          <Chip key={x.id} active={draft.textAnim === x.id} onClick={() => onChange({ textAnim: x.id })}>
            {opt('text', x.id)}
          </Chip>
        ))}
      </ChipRow>
      {slot === 'outro' && (
        <>
          <ChipRow title={t('motion.dir.cta')}>
            {OUTRO_CTAS.map((x) => (
              <Chip key={x.id} active={draft.outroCta === x.id} onClick={() => onChange({ outroCta: x.id })}>
                {opt('cta', x.id)}
              </Chip>
            ))}
          </ChipRow>
          {draft.outroCta === 'custom' && (
            <StudioInput
              value={draft.customCta}
              onChange={(customCta) => onChange({ customCta })}
              placeholder={t('motion.dir.ctaPh')}
            />
          )}
        </>
      )}
      <p className="rounded-xl border border-[#8ec8ff]/12 bg-black/25 px-3 py-2 text-[10px] leading-relaxed text-[#93a0b5]">
        {t('motion.dir.rulesLead')}{' '}
        {draft.brandRules.trim()
          ? t('motion.dir.rulesOn', { rules: draft.brandRules.trim().slice(0, 90) })
          : t('motion.dir.rulesEmpty')}
      </p>
    </div>
  );

  return (
    <>
      <div className="lg:hidden">
        <StudioCard>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex min-h-[44px] w-full items-center justify-between gap-2 text-start"
          >
            <div>
              <h2 className="text-sm font-black text-[#e7eef8]">{t('motion.dir.title')}</h2>
              <p className="mt-0.5 text-[11px] text-[#93a0b5]">{t('motion.dir.short')}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-[#93a0b5] transition ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && <div className="mt-3">{body}</div>}
        </StudioCard>
      </div>
      <div className="hidden lg:block">
        <StudioCard title={t('motion.dir.title')} hint={t('motion.dir.hint')}>
          {body}
        </StudioCard>
      </div>
    </>
  );
}
