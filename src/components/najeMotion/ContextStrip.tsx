import React from 'react';
import { Sparkles, SlidersHorizontal, Volume2, Users, Layout } from 'lucide-react';
import {
  AUDIENCES,
  BRAND_VOICES,
  OUTRO_LAYOUTS,
  PROJECT_TYPES,
  SOUND_OPTIONS,
  type IdentSlot,
  type MotionDraft,
} from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';
import { Chip, ChipRow, FieldLabel, StudioCard, StudioInput } from './StudioUi';

export function ContextStrip({
  draft,
  slot,
  onChange,
}: {
  draft: MotionDraft;
  slot: IdentSlot;
  onChange: (patch: Partial<MotionDraft>) => void;
}) {
  const { t, opt } = useMotionI18n();

  return (
    <StudioCard
      title={t('motion.ctx.title')}
      hint={t('motion.ctx.hint')}
      icon={<SlidersHorizontal className="w-4 h-4 text-[#8ec8ff]" />}
    >
      <div className="space-y-4">
        {/* Project Type */}
        <ChipRow title={t('motion.ctx.project')} scroll>
          {PROJECT_TYPES.map((x) => (
            <Chip
              key={x.id}
              active={draft.projectType === x.id}
              onClick={() => onChange({ projectType: draft.projectType === x.id ? '' : x.id })}
            >
              {opt('project', x.id)}
            </Chip>
          ))}
        </ChipRow>

        {/* Target Audience */}
        <ChipRow title={t('motion.ctx.audience')} scroll>
          {AUDIENCES.map((x) => (
            <Chip key={x.id} active={draft.audience === x.id} onClick={() => onChange({ audience: x.id })}>
              {opt('audience', x.id)}
            </Chip>
          ))}
        </ChipRow>

        {/* Brand Voice / Tone */}
        <ChipRow title={t('motion.ctx.voice')} scroll>
          {BRAND_VOICES.map((x) => (
            <Chip key={x.id} active={draft.brandVoice === x.id} onClick={() => onChange({ brandVoice: x.id })}>
              {opt('voice', x.id)}
            </Chip>
          ))}
        </ChipRow>

        {/* Sound Ambience & Mood */}
        <ChipRow title={t('motion.ctx.sound')} hint={t('motion.honesty.sound')} scroll>
          {SOUND_OPTIONS.map((x) => (
            <Chip key={x.id} active={draft.sound === x.id} onClick={() => onChange({ sound: x.id })}>
              {opt('sound', x.id)}
            </Chip>
          ))}
        </ChipRow>

        {/* Social Handles / Links */}
        <div>
          <FieldLabel>{t('motion.ctx.socials')}</FieldLabel>
          <StudioInput
            value={draft.socials}
            onChange={(socials) => onChange({ socials })}
            placeholder={t('motion.ctx.socialsPh')}
          />
          <p className="mt-1 text-[10px] leading-relaxed text-[#93a0b5]">{t('motion.ctx.socialsNote')}</p>
        </div>

        {/* Outro Layouts if applicable */}
        {(slot === 'outro' || draft.kind === 'outro' || draft.kind === 'both') && (
          <ChipRow title={t('motion.ctx.layout')} scroll>
            {OUTRO_LAYOUTS.map((x) => (
              <Chip key={x.id} active={draft.outroLayout === x.id} onClick={() => onChange({ outroLayout: x.id })}>
                {opt('layout', x.id)}
              </Chip>
            ))}
          </ChipRow>
        )}
      </div>
    </StudioCard>
  );
}
