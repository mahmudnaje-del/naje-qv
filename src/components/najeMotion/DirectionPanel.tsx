import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  BACKDROPS,
  CAMERAS,
  INTENSITIES,
  LIGHTS,
  LOGO_BEHAVIORS,
  MOTIONS,
  OUTRO_CTAS,
  SOUND_HONESTY,
  SOUND_OPTIONS,
  TEXT_ANIMS,
  type IdentSlot,
  type MotionDraft,
} from '../../lib/motionStudio';
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
  const [open, setOpen] = useState(false);

  const body = (
    <div className="space-y-3">
      <ChipRow title="الحركة">
        {MOTIONS.map((x) => (
          <Chip key={x.id} active={draft.motion === x.id} onClick={() => onChange({ motion: x.id })}>
            {x.ar}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title="الشدة">
        {INTENSITIES.map((x) => (
          <Chip key={x.id} active={draft.intensity === x.id} onClick={() => onChange({ intensity: x.id })}>
            {x.ar}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title="الصوت" hint={SOUND_HONESTY}>
        {SOUND_OPTIONS.map((x) => (
          <Chip key={x.id} active={draft.sound === x.id} onClick={() => onChange({ sound: x.id })}>
            {x.ar}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title="الكاميرا">
        {CAMERAS.map((x) => (
          <Chip key={x.id} active={draft.camera === x.id} onClick={() => onChange({ camera: x.id })}>
            {x.ar}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title="الإضاءة">
        {LIGHTS.map((x) => (
          <Chip key={x.id} active={draft.lighting === x.id} onClick={() => onChange({ lighting: x.id })}>
            {x.ar}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title="الخلفية">
        {BACKDROPS.map((x) => (
          <Chip key={x.id} active={draft.bgStyle === x.id} onClick={() => onChange({ bgStyle: x.id })}>
            {x.ar}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title="سلوك الشعار">
        {LOGO_BEHAVIORS.map((x) => (
          <Chip key={x.id} active={draft.logoBehavior === x.id} onClick={() => onChange({ logoBehavior: x.id })}>
            {x.ar}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow title="حركة النص">
        {TEXT_ANIMS.map((x) => (
          <Chip key={x.id} active={draft.textAnim === x.id} onClick={() => onChange({ textAnim: x.id })}>
            {x.ar}
          </Chip>
        ))}
      </ChipRow>
      {slot === 'outro' && (
        <>
          <ChipRow title="دعوة الأوترو">
            {OUTRO_CTAS.map((x) => (
              <Chip key={x.id} active={draft.outroCta === x.id} onClick={() => onChange({ outroCta: x.id })}>
                {x.ar}
              </Chip>
            ))}
          </ChipRow>
          {draft.outroCta === 'custom' && (
            <StudioInput
              value={draft.customCta}
              onChange={(customCta) => onChange({ customCta })}
              placeholder="نص الدعوة كما يجب أن يُكتب"
            />
          )}
        </>
      )}
      <p className="rounded-xl border border-white/8 bg-black/25 px-3 py-2 text-[10px] leading-relaxed text-white/40">
        قواعد العلامة تُكتب في بطاقة الهوية وتُخبز في توجيه المخرج.
        {draft.brandRules.trim() ? ` مفعّل: ${draft.brandRules.trim().slice(0, 90)}` : ' أضف مثلاً: لا نيون.'}
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
            className="flex min-h-[44px] w-full items-center justify-between gap-2 text-right"
          >
            <div>
              <h2 className="text-sm font-black text-white">إخراج</h2>
              <p className="mt-0.5 text-[11px] text-white/45">حركة، كاميرا، ضوء، سلوك الشعار</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-white/50 transition ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && <div className="mt-3">{body}</div>}
        </StudioCard>
      </div>
      <div className="hidden lg:block">
        <StudioCard title="إخراج" hint="مفردات توجيه تُخبز في البرومبت. ليست محرّك رسوم.">
          {body}
        </StudioCard>
      </div>
    </>
  );
}
