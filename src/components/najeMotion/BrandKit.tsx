import React, { useRef, useState } from 'react';
import { Lock, Unlock, Upload, X } from 'lucide-react';
import {
  COLOR_PALETTES,
  INDUSTRIES,
  LANGUAGES,
  NAME_SCRIPTS,
  PLATFORMS,
  autoBrandPatch,
  generatePaletteFromPrimary,
  isHex,
  rasterizeLogo,
  sampleLogoPalette,
  type MotionDraft,
} from '../../lib/motionStudio';
import { toast } from '../../toastStore';
import { useMotionI18n } from './i18n';
import { Chip, ChipRow, FieldLabel, StudioCard, StudioInput, fieldClass } from './StudioUi';

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  React.useEffect(() => setText(value), [value]);
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-[10px] font-black text-[#93a0b5]">{label}</p>
      <div className="flex items-center gap-1.5 rounded-xl border border-[#8ec8ff]/15 bg-black/40 px-2 py-1.5">
        <input
          type="color"
          value={isHex(value) ? value : '#8ec8ff'}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded-md border-0 bg-transparent p-0"
          aria-label={label}
        />
        <input
          dir="ltr"
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            if (isHex(v)) onChange(v);
          }}
          onBlur={() => {
            if (isHex(text)) onChange(text);
            else setText(value);
          }}
          className="w-full bg-transparent font-mono text-[11px] text-[#e7eef8]/80 outline-none"
        />
      </div>
    </div>
  );
}

export function BrandKit({
  draft,
  onChange,
}: {
  draft: MotionDraft;
  onChange: (patch: Partial<MotionDraft>) => void;
}) {
  const { t, opt } = useMotionI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [sampling, setSampling] = useState(false);

  const pickLogo = (file?: File) => {
    if (!file) return;
    const ok = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type);
    if (!ok) {
      toast.error(t('motion.toast.logoType'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error(t('motion.toast.logoSize'));
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = String(reader.result || '');
      if (!raw) return;
      if (file.type === 'image/svg+xml') {
        try {
          const png = await rasterizeLogo(raw);
          onChange({ logo: png });
          toast.success(t('motion.toast.svgOk'));
        } catch {
          toast.error(t('motion.toast.svgFail'));
        }
        return;
      }
      onChange({ logo: raw });
    };
    reader.readAsDataURL(file);
  };

  const extract = async () => {
    if (!draft.logo) {
      toast.error(t('motion.toast.needLogo'));
      return;
    }
    setSampling(true);
    try {
      const colors = await sampleLogoPalette(draft.logo);
      onChange(colors);
      toast.success(t('motion.toast.colorsOk'));
    } catch {
      toast.error(t('motion.toast.colorsFail'));
    } finally {
      setSampling(false);
    }
  };

  return (
    <StudioCard title={t('motion.brand.title')} hint={t('motion.brand.hint')}>
      <div className="space-y-3">
        <div>
          <FieldLabel>{t('motion.brand.name')}</FieldLabel>
          <StudioInput value={draft.brandName} onChange={(brandName) => onChange({ brandName })} placeholder={t('motion.brand.namePh')} />
        </div>
        <div>
          <FieldLabel>{t('motion.brand.tagline')}</FieldLabel>
          <StudioInput value={draft.tagline} onChange={(tagline) => onChange({ tagline })} placeholder={t('motion.brand.taglinePh')} />
        </div>
        <div>
          <FieldLabel>{t('motion.brand.desc')}</FieldLabel>
          <textarea
            rows={2}
            value={draft.description}
            maxLength={400}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder={t('motion.brand.descPh')}
            className={fieldClass}
          />
        </div>
        <div>
          <FieldLabel>{t('motion.brand.site')}</FieldLabel>
          <input
            dir="ltr"
            value={draft.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="example.com"
            className="w-full rounded-2xl border border-[#8ec8ff]/15 bg-black/40 px-3 py-2.5 text-start text-sm text-[#e7eef8] placeholder:text-[#93a0b5]/70 focus:border-[#8ec8ff] focus:outline-none"
          />
          <p className="mt-1 text-[10px] text-[#93a0b5]">{t('motion.brand.siteNote')}</p>
        </div>

        <ChipRow title={t('motion.brand.platform')} scroll>
          {PLATFORMS.map((x) => (
            <Chip
              key={x.id}
              active={draft.platform === x.id}
              onClick={() => onChange({ platform: draft.platform === x.id ? '' : x.id })}
            >
              {opt('platform', x.id)}
            </Chip>
          ))}
        </ChipRow>

        <ChipRow title={t('motion.brand.industry')} scroll>
          {INDUSTRIES.map((x) => (
            <Chip key={x.id} active={draft.industry === x.id} onClick={() => onChange({ industry: x.id })}>
              {opt('industry', x.id)}
            </Chip>
          ))}
        </ChipRow>

        <ChipRow title={t('motion.brand.language')}>
          {LANGUAGES.map((x) => (
            <Chip key={x.id} active={draft.language === x.id} onClick={() => onChange({ language: x.id })}>
              {opt('language', x.id)}
            </Chip>
          ))}
        </ChipRow>

        <ChipRow title={t('motion.brand.script')}>
          {NAME_SCRIPTS.map((x) => (
            <Chip key={x.id} active={draft.nameScript === x.id} onClick={() => onChange({ nameScript: x.id })}>
              {opt('script', x.id)}
            </Chip>
          ))}
        </ChipRow>

        <div>
          <FieldLabel>{t('motion.brand.logo')}</FieldLabel>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[44px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#8ec8ff]/40 bg-black/30 py-5"
          >
            {draft.logo ? (
              <img src={draft.logo} alt={t('motion.brand.logoAlt')} className="h-16 max-w-[70%] object-contain" />
            ) : (
              <>
                <Upload className="mb-1 h-5 w-5 text-[#8ec8ff]" />
                <span className="text-[11px] font-bold text-[#93a0b5]">{t('motion.brand.logoDrop')}</span>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              pickLogo(e.target.files?.[0]);
              e.currentTarget.value = '';
            }}
          />
          {draft.logo && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={extract}
                disabled={sampling}
                className="min-h-[44px] rounded-xl border border-[#8ec8ff]/40 bg-[#8ec8ff]/10 px-3 py-1.5 text-[11px] font-bold text-[#8ec8ff] disabled:opacity-50"
              >
                {sampling ? t('motion.brand.extracting') : t('motion.brand.extract')}
              </button>
              <button
                type="button"
                onClick={() => onChange({ logo: null })}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#8ec8ff]/15 px-3 py-1.5 text-[11px] font-bold text-[#93a0b5]"
              >
                <X className="h-3 w-3" /> {t('motion.brand.remove')}
              </button>
            </div>
          )}
          <p className="mt-1.5 text-[10px] text-[#93a0b5]">{t('motion.brand.extractNote')}</p>
        </div>

        <div>
          <FieldLabel>{t('motion.brand.colors')}</FieldLabel>
          <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <ColorField label={t('motion.brand.primary')} value={draft.primary} onChange={(primary) => onChange({ primary })} />
            <ColorField label={t('motion.brand.secondary')} value={draft.secondary} onChange={(secondary) => onChange({ secondary })} />
            <ColorField label={t('motion.brand.accent')} value={draft.accent} onChange={(accent) => onChange({ accent })} />
            <ColorField label={t('motion.brand.bg')} value={draft.bgColor} onChange={(bgColor) => onChange({ bgColor })} />
            <ColorField label={t('motion.brand.text')} value={draft.textColor} onChange={(textColor) => onChange({ textColor })} />
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {COLOR_PALETTES.map((p) => {
              const on =
                draft.primary === p.primary &&
                draft.secondary === p.secondary &&
                draft.accent === p.accent &&
                draft.bgColor === p.bgColor &&
                draft.textColor === p.textColor;
              const name = opt('palette', p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      primary: p.primary,
                      secondary: p.secondary,
                      accent: p.accent,
                      bgColor: p.bgColor,
                      textColor: p.textColor,
                    })
                  }
                  className={`min-h-[44px] rounded-xl border p-1.5 ${on ? 'border-[#8ec8ff]' : 'border-[#8ec8ff]/15'}`}
                  title={name}
                >
                  <span className="flex h-7 overflow-hidden rounded-lg">
                    <span className="flex-1" style={{ background: p.primary }} />
                    <span className="flex-1" style={{ background: p.secondary }} />
                    <span className="flex-1" style={{ background: p.accent }} />
                    <span className="flex-1" style={{ background: p.bgColor }} />
                    <span className="flex-1" style={{ background: p.textColor }} />
                  </span>
                  <span className="mt-1 block text-center text-[9px] font-bold text-[#93a0b5]">{name}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange(generatePaletteFromPrimary(draft.primary))}
              className="min-h-[44px] rounded-xl border border-[#8ec8ff]/20 px-3 py-1.5 text-[11px] font-bold text-[#e7eef8]"
            >
              {t('motion.brand.fromPrimary')}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(autoBrandPatch(draft));
                toast.success(t('motion.toast.autoOk'));
              }}
              className="min-h-[44px] rounded-xl border border-[#8ec8ff]/40 bg-[#8ec8ff]/10 px-3 py-1.5 text-[11px] font-bold text-[#8ec8ff]"
            >
              {t('motion.brand.auto')}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-[#93a0b5]">{t('motion.brand.paletteNote')}</p>
        </div>

        <div>
          <FieldLabel>{t('motion.brand.rules')}</FieldLabel>
          <textarea
            rows={3}
            value={draft.brandRules}
            maxLength={800}
            onChange={(e) => onChange({ brandRules: e.target.value })}
            placeholder={t('motion.brand.rulesPh')}
            className={fieldClass}
          />
        </div>

        <button
          type="button"
          onClick={() => onChange({ brandLock: !draft.brandLock })}
          className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-start ${
            draft.brandLock ? 'border-[#8ec8ff]/50 bg-[#8ec8ff]/10 text-[#8ec8ff]' : 'border-[#8ec8ff]/15 bg-black/30 text-[#93a0b5]'
          }`}
        >
          <span>
            <span className="block text-[12px] font-black">{t('motion.brand.lockTitle')}</span>
            <span className="mt-0.5 block text-[10px] text-[#93a0b5]">{t('motion.brand.lockHint')}</span>
          </span>
          {draft.brandLock ? <Lock className="h-4 w-4 shrink-0" /> : <Unlock className="h-4 w-4 shrink-0" />}
        </button>
      </div>
    </StudioCard>
  );
}
