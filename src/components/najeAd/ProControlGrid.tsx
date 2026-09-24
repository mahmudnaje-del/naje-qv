import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import {
  AUDIO_MODES,
  BEAT_INTERVALS,
  BeatInterval,
  BeatSlot,
  CAMERA_MOTIONS,
  COLOR_GRADES,
  CTA_MODES,
  HOOK_STYLES,
  LIGHTING_LOOKS,
  MARKETING_GOALS,
  MUSIC_ENERGY,
  OMNI_DURATIONS,
  OMNI_RESOLUTIONS,
  OmniDuration,
  OmniResolution,
  PACE_OPTIONS,
  PRODUCT_PLACEMENTS,
  VOICE_CASTS,
} from '../../lib/omniAd';
import { DIALECT_OPTIONS, LANGUAGE_OPTIONS } from '../../lib/adDnaEngine';
import { useI18n } from '../../i18n';

type ExtraChip = { id: string; label: string };

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition sm:px-3 sm:py-2 ${
        active
          ? 'border-[var(--naje-accent)] bg-[var(--naje-accent)]/15 text-[#f4efe6] shadow-[0_0_18px_rgba(212,165,116,0.22)]'
          : 'border-white/10 bg-black/35 text-white/65 hover:border-white/25 hover:text-white'
      }`}
    >
      {active && <Check className="h-3 w-3 text-[var(--naje-accent-2)]" />}
      {children}
    </button>
  );
}

function Box({
  title,
  hint,
  onAdd,
  children,
  className,
}: {
  title: string;
  hint?: string;
  onAdd?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4 ${className || ''}`}>
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div>
          <h4 className="text-xs font-black text-white">{title}</h4>
          {hint && <p className="mt-0.5 text-[10px] text-white/40">{hint}</p>}
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[var(--naje-accent)]/40 bg-[var(--naje-accent)]/10 px-2 py-1 text-[10px] font-black text-[var(--naje-accent-2)]"
          >
            <Plus className="h-3 w-3" /> {t('adui.add')}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">{children}</div>
    </section>
  );
}

function toggle(current: string, next: string, set: (v: string) => void) {
  set(current === next ? '' : next);
}

export function ProControlGrid(props: {
  duration: OmniDuration;
  onDuration: (v: OmniDuration) => void;
  resolution: OmniResolution;
  onResolution: (v: OmniResolution) => void;
  aspectRatio: '16:9' | '9:16';
  onAspect: (v: '16:9' | '9:16') => void;
  onPlatform: (v: string) => void;
  cameraMotion: string;
  onCamera: (v: string) => void;
  lighting: string;
  onLighting: (v: string) => void;
  marketingGoal: string;
  onGoal: (v: string) => void;
  audioMode: string;
  onAudio: (v: string) => void;
  language: string;
  onLanguage: (v: string) => void;
  dialect: string;
  onDialect: (v: string) => void;
  pace: string;
  onPace: (v: string) => void;
  colorGrade: string;
  onColorGrade: (v: string) => void;
  productPlacement: string;
  onProductPlacement: (v: string) => void;
  cta: string;
  onCta: (v: string) => void;
  voiceCast: string;
  onVoiceCast: (v: string) => void;
  musicEnergy: string;
  onMusicEnergy: (v: string) => void;
  hookStyle: string;
  onHookStyle: (v: string) => void;
  beatInterval: BeatInterval | null;
  onBeatInterval: (v: BeatInterval | null) => void;
  beatSlots: BeatSlot[];
  onBeatSlots: (slots: BeatSlot[]) => void;
  pointsRate: number;
  resolutionMultiplier?: Partial<Record<OmniResolution, number>>;
}) {
  const { t } = useI18n();
  const dialects = DIALECT_OPTIONS[props.language] || [];
  const [extras, setExtras] = useState<Record<string, ExtraChip[]>>({});
  const [addBox, setAddBox] = useState<{ key: string; title: string; apply: (id: string) => void } | null>(null);
  const [addLabel, setAddLabel] = useState('');
  const [addPrompt, setAddPrompt] = useState('');

  const openAdd = (key: string, title: string, apply: (id: string) => void) => {
    setAddLabel('');
    setAddPrompt('');
    setAddBox({ key, title, apply });
  };

  const saveAdd = () => {
    if (!addBox) return;
    const label = addLabel.trim();
    if (!label) return;
    const prompt = addPrompt.trim() || label;
    const id = `custom:${label}|${prompt}`;
    setExtras((p) => ({ ...p, [addBox.key]: [...(p[addBox.key] || []).slice(0, 7), { id, label }] }));
    addBox.apply(id);
    setAddBox(null);
  };

  const extraChips = (key: string, current: string, apply: (v: string) => void) =>
    (extras[key] || []).map((c) => (
      <Chip key={c.id} active={current === c.id} onClick={() => toggle(current, c.id, apply)}>
        {c.label}
      </Chip>
    ));

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:gap-3 lg:grid-cols-2">
      <Box title={t('adui.quality')}>
        {OMNI_RESOLUTIONS.map((r) => (
          <Chip key={r.id} active={props.resolution === r.id} onClick={() => props.onResolution(r.id)}>
            {r.name}
          </Chip>
        ))}
      </Box>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4 lg:col-span-2">
        <h4 className="mb-2 text-xs font-black text-white">{t('adui.aspect')}</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              props.onAspect('9:16');
              props.onPlatform('tiktok');
            }}
            className={`rounded-2xl border p-3 text-start transition ${
              props.aspectRatio === '9:16'
                ? 'border-[var(--naje-accent)] bg-[var(--naje-accent)]/15 shadow-[0_0_18px_rgba(212,165,116,0.18)]'
                : 'border-white/10 bg-black/30 hover:border-white/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-black text-white">{t('adui.portrait')}</span>
              <span className="font-mono text-[11px] font-bold text-[var(--naje-accent-2)]">9:16</span>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/50">{t('adui.portraitPlatforms')}</p>
          </button>
          <button
            type="button"
            onClick={() => {
              props.onAspect('16:9');
              props.onPlatform('youtube');
            }}
            className={`rounded-2xl border p-3 text-start transition ${
              props.aspectRatio === '16:9'
                ? 'border-[var(--naje-accent)] bg-[var(--naje-accent)]/15 shadow-[0_0_18px_rgba(212,165,116,0.18)]'
                : 'border-white/10 bg-black/30 hover:border-white/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-black text-white">{t('adui.landscape')}</span>
              <span className="font-mono text-[11px] font-bold text-[var(--naje-accent-2)]">16:9</span>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/50">{t('adui.landscapePlatforms')}</p>
          </button>
        </div>
      </section>

      <Box title={t('adui.hookTitle')} onAdd={() => openAdd('hook', t('adui.hookTitle'), props.onHookStyle)}>
        {HOOK_STYLES.map((h) => (
          <Chip key={h.id} active={props.hookStyle === h.id} onClick={() => toggle(props.hookStyle, h.id, props.onHookStyle)}>
            {t(`adui.hook.${h.id}`)}
          </Chip>
        ))}
        {extraChips('hook', props.hookStyle, props.onHookStyle)}
      </Box>

      <Box title={t('adui.camera')} onAdd={() => openAdd('camera', t('adui.camera'), props.onCamera)}>
        {CAMERA_MOTIONS.map((c) => (
          <Chip key={c.id} active={props.cameraMotion === c.id} onClick={() => toggle(props.cameraMotion, c.id, props.onCamera)}>
            {t(`adui.cam.${c.id}`)}
          </Chip>
        ))}
        {extraChips('camera', props.cameraMotion, props.onCamera)}
      </Box>

      <Box title={t('adui.lighting')} onAdd={() => openAdd('lighting', t('adui.lighting'), props.onLighting)}>
        {LIGHTING_LOOKS.map((l) => (
          <Chip key={l.id} active={props.lighting === l.id} onClick={() => toggle(props.lighting, l.id, props.onLighting)}>
            {t(`adui.light.${l.id}`)}
          </Chip>
        ))}
        {extraChips('lighting', props.lighting, props.onLighting)}
      </Box>

      <Box title={t('adui.pace')} onAdd={() => openAdd('pace', t('adui.pace'), props.onPace)}>
        {PACE_OPTIONS.map((p) => (
          <Chip key={p.id} active={props.pace === p.id} onClick={() => toggle(props.pace, p.id, props.onPace)}>
            {t(`adui.pace.${p.id}`)}
          </Chip>
        ))}
        {extraChips('pace', props.pace, props.onPace)}
      </Box>

      <Box title={t('adui.grade')} onAdd={() => openAdd('grade', t('adui.grade'), props.onColorGrade)}>
        {COLOR_GRADES.map((g) => (
          <Chip key={g.id} active={props.colorGrade === g.id} onClick={() => toggle(props.colorGrade, g.id, props.onColorGrade)}>
            {t(`adui.grade.${g.id}`)}
          </Chip>
        ))}
        {extraChips('grade', props.colorGrade, props.onColorGrade)}
      </Box>

      <Box title={t('adui.placement')} onAdd={() => openAdd('place', t('adui.placement'), props.onProductPlacement)}>
        {PRODUCT_PLACEMENTS.map((p) => (
          <Chip key={p.id} active={props.productPlacement === p.id} onClick={() => toggle(props.productPlacement, p.id, props.onProductPlacement)}>
            {t(`adui.placeopt.${p.id}`)}
          </Chip>
        ))}
        {extraChips('place', props.productPlacement, props.onProductPlacement)}
      </Box>

      <Box title={t('adui.goal')} onAdd={() => openAdd('goal', t('adui.goal'), props.onGoal)}>
        {MARKETING_GOALS.map((g) => (
          <Chip key={g.id} active={props.marketingGoal === g.id} onClick={() => toggle(props.marketingGoal, g.id, props.onGoal)}>
            {t(`adui.goal.${g.id}`)}
          </Chip>
        ))}
        {extraChips('goal', props.marketingGoal, props.onGoal)}
      </Box>

      <Box title={t('adui.audio')} onAdd={() => openAdd('audio', t('adui.audio'), props.onAudio)}>
        {AUDIO_MODES.map((a) => (
          <Chip key={a.id} active={props.audioMode === a.id} onClick={() => toggle(props.audioMode, a.id, props.onAudio)}>
            {t(`adui.audio.${a.id}`)}
          </Chip>
        ))}
        {extraChips('audio', props.audioMode, props.onAudio)}
      </Box>

      <Box title={t('adui.voiceMusic')} onAdd={() => openAdd('voice', t('adui.voiceMusic'), props.onVoiceCast)}>
        {VOICE_CASTS.map((v) => (
          <Chip key={v.id} active={props.voiceCast === v.id} onClick={() => toggle(props.voiceCast, v.id, props.onVoiceCast)}>
            {t(`adui.voice.${v.id}`)}
          </Chip>
        ))}
        {MUSIC_ENERGY.map((m) => (
          <Chip key={m.id} active={props.musicEnergy === m.id} onClick={() => toggle(props.musicEnergy, m.id, props.onMusicEnergy)}>
            {t(`adui.music.${m.id}`)}
          </Chip>
        ))}
        {extraChips('voice', props.voiceCast, props.onVoiceCast)}
      </Box>

      <Box title={t('adui.cta')} onAdd={() => openAdd('cta', t('adui.cta'), props.onCta)}>
        {CTA_MODES.map((c) => (
          <Chip key={c.id} active={props.cta === c.id} onClick={() => toggle(props.cta, c.id, props.onCta)}>
            {t(`adui.cta.${c.id}`)}
          </Chip>
        ))}
        {extraChips('cta', props.cta, props.onCta)}
      </Box>

      <div className="space-y-2.5">
        <Box title={t('adui.dialogueLang')} onAdd={() => openAdd('language', t('adui.dialogueLang'), props.onLanguage)}>
          {LANGUAGE_OPTIONS.map((l) => (
            <Chip
              key={l.id}
              active={props.language === l.id}
              onClick={() => {
                if (props.language === l.id) {
                  props.onLanguage('');
                } else {
                  props.onLanguage(l.id);
                }
              }}
            >
              {t(`adui.lang.${l.id}`)}
            </Chip>
          ))}
          {extraChips('language', props.language, props.onLanguage)}
        </Box>
        {props.language ? (
          <Box title={t('adui.dialect')} hint={t('adui.dialectHint')} onAdd={() => openAdd('dialect', t('adui.dialect'), props.onDialect)}>
            {dialects.map((d) => (
              <Chip key={d.id} active={props.dialect === d.id} onClick={() => toggle(props.dialect, d.id, props.onDialect)}>
                {t(`adui.dia.${d.id}`)}
              </Chip>
            ))}
            {extraChips('dialect', props.dialect, props.onDialect)}
          </Box>
        ) : null}
      </div>

      <Box title={t('adui.duration')}>
        {OMNI_DURATIONS.map((d) => (
          <Chip key={d} active={props.duration === d} onClick={() => props.onDuration(d)}>
            {t('adui.secUnit', { n: d })}
          </Chip>
        ))}
      </Box>

      <Box title={t('adui.modelGuide')} className="lg:col-span-2">
        {BEAT_INTERVALS.map((iv) => (
          <Chip
            key={iv}
            active={props.beatInterval === iv}
            onClick={() => props.onBeatInterval(props.beatInterval === iv ? null : iv)}
          >
            {t(`adui.beat.${iv}`)}
          </Chip>
        ))}
      </Box>

      {props.beatInterval && props.beatSlots.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:col-span-2">
          {props.beatSlots.map((slot, idx) => (
            <label key={`${slot.from}-${slot.to}-${idx}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-start">
              <span className="mb-1.5 block text-[11px] font-black text-[var(--naje-accent-2)]">
                {t('adui.beatRange', { from: slot.from, to: slot.to })}
              </span>
              <textarea
                rows={2}
                value={slot.text}
                onChange={(e) => {
                  const next = props.beatSlots.map((s, i) => (i === idx ? { ...s, text: e.target.value.slice(0, 400) } : s));
                  props.onBeatSlots(next);
                }}
                placeholder={t('adui.beatPlaceholder')}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/40 p-2.5 text-[12px] text-white placeholder:text-white/30 focus:border-[var(--naje-accent)] focus:outline-none"
              />
            </label>
          ))}
        </div>
      )}

      {addBox && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#12141c] p-4 shadow-2xl sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-white">{t('adui.addTo', { title: addBox.title })}</h3>
              <button type="button" onClick={() => setAddBox(null)} className="rounded-full p-1.5 text-white/50 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mb-2 block text-[11px] font-bold text-white/70">{t('adui.visibleName')}</label>
            <input
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value.slice(0, 48))}
              placeholder={t('adui.visiblePlaceholder')}
              className="mb-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[var(--naje-accent)] focus:outline-none"
            />
            <label className="mb-2 block text-[11px] font-bold text-white/70">{t('adui.modelWillDo')}</label>
            <textarea
              rows={3}
              value={addPrompt}
              onChange={(e) => setAddPrompt(e.target.value.slice(0, 240))}
              placeholder={t('adui.modelWillDoPlaceholder')}
              className="mb-4 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--naje-accent)] focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveAdd}
                disabled={!addLabel.trim()}
                className="flex-1 rounded-xl bg-[var(--naje-accent)] py-2.5 text-sm font-black text-black disabled:opacity-40"
              >
                {t('common.save')}
              </button>
              <button type="button" onClick={() => setAddBox(null)} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white/70">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
