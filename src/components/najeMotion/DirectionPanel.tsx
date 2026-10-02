import React, { useState } from 'react';
import { Camera, Sparkles, Video, SunMedium, Type, Layers, Check } from 'lucide-react';
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
  const [activeGroup, setActiveGroup] = useState<'motion' | 'visuals' | 'typography'>('motion');

  return (
    <StudioCard
      title="إخراج المشهد والحركة"
      hint="تحكم احترافي في زوايا التصوير، سرعة وانسياب الحركة، وإضاءة المشهد."
      icon={<Camera className="w-4 h-4 text-[#8ec8ff]" />}
    >
      {/* Sub-Category Switcher for Ergonomic Navigation */}
      <div className="mb-4 flex p-1 bg-black/50 rounded-2xl border border-[#8ec8ff]/20 gap-1">
        <button
          type="button"
          onClick={() => setActiveGroup('motion')}
          className={`flex-1 min-h-[42px] rounded-xl px-2.5 py-1.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
            activeGroup === 'motion'
              ? 'bg-[#8ec8ff]/25 text-[#8ec8ff] shadow-sm border border-[#8ec8ff]/40'
              : 'text-[#93a0b5] hover:text-[#e7eef8]'
          }`}
        >
          <Video className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">الحركة والكاميرا</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup('visuals')}
          className={`flex-1 min-h-[42px] rounded-xl px-2.5 py-1.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
            activeGroup === 'visuals'
              ? 'bg-[#8ec8ff]/25 text-[#8ec8ff] shadow-sm border border-[#8ec8ff]/40'
              : 'text-[#93a0b5] hover:text-[#e7eef8]'
          }`}
        >
          <SunMedium className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">الإضاءة والأجواء</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup('typography')}
          className={`flex-1 min-h-[42px] rounded-xl px-2.5 py-1.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
            activeGroup === 'typography'
              ? 'bg-[#8ec8ff]/25 text-[#8ec8ff] shadow-sm border border-[#8ec8ff]/40'
              : 'text-[#93a0b5] hover:text-[#e7eef8]'
          }`}
        >
          <Type className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">الشعار والنصوص</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Section 1: Motion Dynamics & Camera */}
        {activeGroup === 'motion' && (
          <div className="space-y-4">
            {/* Motion Intensity - Prominent Segmented Bar */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-[#e7eef8]">شدة وحيوية الحركة:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INTENSITIES.map((x) => {
                  const on = draft.intensity === x.id;
                  return (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => onChange({ intensity: x.id })}
                      className={`min-h-[44px] rounded-xl border px-3 py-2 text-center text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        on
                          ? 'border-[#8ec8ff] bg-[#8ec8ff]/20 text-[#8ec8ff] ring-1 ring-[#8ec8ff]/40 shadow-xs'
                          : 'border-[#8ec8ff]/15 bg-black/40 text-[#93a0b5] hover:border-[#8ec8ff]/30'
                      }`}
                    >
                      <span>{opt('intensity', x.id)}</span>
                      {on && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Motion Style Chips */}
            <ChipRow title="أسلوب ظهور وانبثاق الشعار" scroll>
              {MOTIONS.map((x) => (
                <Chip key={x.id} active={draft.motion === x.id} onClick={() => onChange({ motion: x.id })}>
                  {opt('motion', x.id)}
                </Chip>
              ))}
            </ChipRow>

            {/* Camera Shot */}
            <ChipRow title="حركة وتأطير الكاميرا" scroll>
              {CAMERAS.map((x) => (
                <Chip key={x.id} active={draft.camera === x.id} onClick={() => onChange({ camera: x.id })}>
                  {opt('camera', x.id)}
                </Chip>
              ))}
            </ChipRow>
          </div>
        )}

        {/* Section 2: Lighting & Atmosphere */}
        {activeGroup === 'visuals' && (
          <div className="space-y-4">
            <ChipRow title="نمط الإضاءة والظلال" scroll>
              {LIGHTS.map((x) => (
                <Chip key={x.id} active={draft.lighting === x.id} onClick={() => onChange({ lighting: x.id })}>
                  {opt('light', x.id)}
                </Chip>
              ))}
            </ChipRow>

            <ChipRow title="بيئة وخلفية المشهد" scroll>
              {BACKDROPS.map((x) => (
                <Chip key={x.id} active={draft.bgStyle === x.id} onClick={() => onChange({ bgStyle: x.id })}>
                  {opt('backdrop', x.id)}
                </Chip>
              ))}
            </ChipRow>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#8ec8ff]/10">
              <ChipRow title="موضع استقرار الشعار">
                {LOGO_POSITIONS.map((x) => (
                  <Chip key={x.id} active={draft.logoPosition === x.id} onClick={() => onChange({ logoPosition: x.id })}>
                    {opt('pos', x.id)}
                  </Chip>
                ))}
              </ChipRow>

              <ChipRow title="المؤثر النهائي للشعار">
                {LOGO_FINISHES.map((x) => (
                  <Chip key={x.id} active={draft.logoFinish === x.id} onClick={() => onChange({ logoFinish: x.id })}>
                    {opt('finish', x.id)}
                  </Chip>
                ))}
              </ChipRow>
            </div>
          </div>
        )}

        {/* Section 3: Typography & Call To Action */}
        {activeGroup === 'typography' && (
          <div className="space-y-4">
            <ChipRow title="طريقة تفاعل الشعار">
              {LOGO_BEHAVIORS.map((x) => (
                <Chip key={x.id} active={draft.logoBehavior === x.id} onClick={() => onChange({ logoBehavior: x.id })}>
                  {opt('logo', x.id)}
                </Chip>
              ))}
            </ChipRow>

            <ChipRow title="حركة الشعار اللفظي والنصوص">
              {TEXT_ANIMS.map((x) => (
                <Chip key={x.id} active={draft.textAnim === x.id} onClick={() => onChange({ textAnim: x.id })}>
                  {opt('text', x.id)}
                </Chip>
              ))}
            </ChipRow>

            {slot === 'outro' && (
              <div className="space-y-3 pt-3 border-t border-[#8ec8ff]/10">
                <ChipRow title="دعوة اتخاذ الإجراء (CTA)" scroll>
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
                    placeholder="اكتب نص الدعوة الختامية (مثال: حمل التطبيق الآن)"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Active Rules Badge */}
        {draft.brandRules.trim() && (
          <div className="rounded-xl border border-[#8ec8ff]/20 bg-black/30 p-2.5 text-xs text-[#93a0b5] flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#ffb020] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#e7eef8]">إرشادات الهوية النشطة:</span>{' '}
              <span>{draft.brandRules.trim()}</span>
            </div>
          </div>
        )}
      </div>
    </StudioCard>
  );
}
