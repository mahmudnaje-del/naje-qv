import React, { useRef, useState } from 'react';
import { Lock, Unlock, Upload, X, Sparkles, RefreshCw, Palette, Type, Globe, Check, Eye } from 'lucide-react';
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

function CompactColorSwatch({
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
    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border border-[#8ec8ff]/15">
      <div className="flex items-center gap-2 min-w-0">
        <label
          className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/20 shadow-xs transition-transform active:scale-95"
          style={{ backgroundColor: isHex(value) ? value : '#8ec8ff' }}
        >
          <input
            type="color"
            value={isHex(value) ? value : '#8ec8ff'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>
        <span className="text-[11px] font-bold text-[#93a0b5] truncate">{label}</span>
      </div>
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
        className="w-18 bg-black/50 border border-white/10 rounded-md px-1.5 py-0.5 text-center font-mono text-[11px] text-[#e7eef8] outline-none uppercase"
      />
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
  const [previewBg, setPreviewBg] = useState<'checker' | 'dark' | 'light'>('checker');

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
    <StudioCard
      title={t('motion.brand.title')}
      hint="أدخل بيانات علامتك التجارية لاكتمال الشارة البصرية وتناغم الحركة."
      icon={<Palette className="w-4 h-4 text-[#8ec8ff]" />}
    >
      <div className="space-y-4">
        {/* Brand Name & Tagline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel required>{t('motion.brand.name')}</FieldLabel>
            <StudioInput
              value={draft.brandName}
              onChange={(brandName) => onChange({ brandName })}
              placeholder="مثال: أكاديمية الإبداع / Naje Media"
            />
          </div>
          <div>
            <FieldLabel>{t('motion.brand.tagline')}</FieldLabel>
            <StudioInput
              value={draft.tagline}
              onChange={(tagline) => onChange({ tagline })}
              placeholder="مثال: بوابتك نحو المستقبل الرقمي"
            />
          </div>
        </div>

        {/* Logo Upload Box with Transparency Checkerboard */}
        <div className="rounded-2xl border border-[#8ec8ff]/20 bg-black/30 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black text-[#e7eef8] flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#8ec8ff]" />
              <span>{t('motion.brand.logo')}</span>
            </span>
            {draft.logo && (
              <div className="flex items-center gap-1 text-[10px] bg-black/60 p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewBg('checker')}
                  className={`px-2 py-0.5 rounded transition ${previewBg === 'checker' ? 'bg-[#8ec8ff]/25 text-[#8ec8ff] font-bold' : 'text-[#93a0b5]'}`}
                >
                  شفاف
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('dark')}
                  className={`px-2 py-0.5 rounded transition ${previewBg === 'dark' ? 'bg-black text-white font-bold' : 'text-[#93a0b5]'}`}
                >
                  داكن
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('light')}
                  className={`px-2 py-0.5 rounded transition ${previewBg === 'light' ? 'bg-white text-black font-bold' : 'text-[#93a0b5]'}`}
                >
                  فاتح
                </button>
              </div>
            )}
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className={`relative flex min-h-[90px] sm:min-h-[110px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#8ec8ff]/35 transition-all hover:border-[#8ec8ff] p-3 text-center select-none active:scale-[0.99] ${
              previewBg === 'checker'
                ? 'bg-[linear-gradient(45deg,#121824_25%,transparent_25%),linear-gradient(-45deg,#121824_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#121824_75%),linear-gradient(-45deg,transparent_75%,#121824_75%)] bg-[size:14px_14px] bg-black/40'
                : previewBg === 'light'
                  ? 'bg-slate-100 text-slate-900'
                  : 'bg-black/90'
            }`}
          >
            {draft.logo ? (
              <div className="flex flex-col items-center gap-1.5">
                <img
                  src={draft.logo}
                  alt={t('motion.brand.logoAlt')}
                  className="max-h-16 sm:max-h-20 max-w-[70%] object-contain drop-shadow-md"
                />
                <span className="text-[10px] text-[#8ec8ff] font-bold">
                  انقر لتغيير الشعار
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-5 w-5 text-[#8ec8ff]" />
                <span className="text-xs font-bold text-[#e7eef8]">
                  {t('motion.brand.logoDrop')}
                </span>
                <span className="text-[10px] text-[#93a0b5]">
                  PNG شفاف أو SVG للحصول على أفضل دقة حركية
                </span>
              </div>
            )}
          </div>

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
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={extract}
                disabled={sampling}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#8ec8ff]/40 bg-[#8ec8ff]/15 px-3 py-1.5 text-xs font-bold text-[#8ec8ff] hover:bg-[#8ec8ff]/25 active:scale-95 transition disabled:opacity-50"
              >
                {sampling ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-[#ffb020]" />
                )}
                <span>{sampling ? t('motion.brand.extracting') : 'استخراج الألوان الذكي من الشعار'}</span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ logo: null })}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 active:scale-95 transition"
              >
                <X className="h-3.5 w-3.5" />
                <span>إزالة الشعار</span>
              </button>
            </div>
          )}
        </div>

        {/* Color Palette Selection - Curated Cards Gallery */}
        <div className="rounded-2xl border border-[#8ec8ff]/20 bg-black/30 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-black text-[#e7eef8] flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#8ec8ff]" />
              <span>لوحات ألوان الهوية السينمائية</span>
            </span>
            <div
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-bold border border-white/10"
              style={{ backgroundColor: draft.bgColor, color: draft.textColor }}
            >
              <Eye className="w-3 h-3" />
              <span>معاينة التباين</span>
            </div>
          </div>

          <p className="text-[11px] text-[#93a0b5] mb-2.5">
            اختر لوحة جاهزة متناسقة سينمائياً أو خصص الألوان يدوياً:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                  className={`min-h-[48px] rounded-xl border p-2 text-start transition-all active:scale-[0.98] select-none flex flex-col justify-between ${
                    on
                      ? 'border-[#8ec8ff] bg-[#8ec8ff]/20 ring-1 ring-[#8ec8ff]/50 shadow-sm'
                      : 'border-[#8ec8ff]/15 bg-black/40 hover:border-[#8ec8ff]/35'
                  }`}
                >
                  <div className="flex h-4.5 overflow-hidden rounded-md border border-white/10 shadow-xs mb-1.5">
                    <span className="flex-1" style={{ background: p.primary }} />
                    <span className="flex-1" style={{ background: p.secondary }} />
                    <span className="flex-1" style={{ background: p.accent }} />
                    <span className="flex-1" style={{ background: p.bgColor }} />
                    <span className="flex-1" style={{ background: p.textColor }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#e7eef8]">
                    <span className="truncate">{name}</span>
                    {on && <Check className="w-3.5 h-3.5 text-[#8ec8ff] shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Color Swatches in 2 columns */}
          <div className="mt-3.5 pt-3 border-t border-[#8ec8ff]/10">
            <p className="text-[11px] font-bold text-[#93a0b5] mb-2">تخصيص درجات الألوان الدقيقة:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <CompactColorSwatch label="الأساسي" value={draft.primary} onChange={(primary) => onChange({ primary })} />
              <CompactColorSwatch label="الثانوي" value={draft.secondary} onChange={(secondary) => onChange({ secondary })} />
              <CompactColorSwatch label="التمييز اللامع" value={draft.accent} onChange={(accent) => onChange({ accent })} />
              <CompactColorSwatch label="لون الخلفية" value={draft.bgColor} onChange={(bgColor) => onChange({ bgColor })} />
              <CompactColorSwatch label="لون النصوص" value={draft.textColor} onChange={(textColor) => onChange({ textColor })} />
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange(generatePaletteFromPrimary(draft.primary))}
                className="min-h-[40px] rounded-xl border border-[#8ec8ff]/25 bg-black/40 px-3 py-1.5 text-xs font-bold text-[#e7eef8] hover:bg-[#8ec8ff]/15 active:scale-95 transition"
              >
                توليد درجات متناسقة من اللون الأساسي
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(autoBrandPatch(draft));
                  toast.success('تم ضبط الهوية والألوان بذكاء');
                }}
                className="min-h-[40px] rounded-xl border border-[#8ec8ff]/40 bg-[#8ec8ff]/15 px-3 py-1.5 text-xs font-bold text-[#8ec8ff] hover:bg-[#8ec8ff]/25 active:scale-95 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#ffb020]" />
                <span>اقتراح ذكي متكامل</span>
              </button>
            </div>
          </div>
        </div>

        {/* Website & Platform */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>{t('motion.brand.site')}</FieldLabel>
            <div className="relative">
              <input
                dir="ltr"
                value={draft.website}
                onChange={(e) => onChange({ website: e.target.value })}
                placeholder="yoursite.com"
                className="w-full min-h-[44px] rounded-xl sm:rounded-2xl border border-[#8ec8ff]/18 bg-black/40 ps-9 pe-3 py-2.5 text-start text-base sm:text-sm text-[#e7eef8] placeholder:text-[#93a0b5]/50 focus:border-[#8ec8ff] focus:outline-none"
              />
              <Globe className="w-4 h-4 text-[#93a0b5] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <FieldLabel>{t('motion.brand.platform')}</FieldLabel>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
              {PLATFORMS.map((x) => (
                <Chip
                  key={x.id}
                  active={draft.platform === x.id}
                  onClick={() => onChange({ platform: draft.platform === x.id ? '' : x.id })}
                >
                  {opt('platform', x.id)}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {/* Language & Script */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>

        {/* Brand Lock Button */}
        <button
          type="button"
          onClick={() => onChange({ brandLock: !draft.brandLock })}
          className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-start transition-all active:scale-[0.99] ${
            draft.brandLock
              ? 'border-[#8ec8ff]/50 bg-[#8ec8ff]/15 text-[#8ec8ff]'
              : 'border-[#8ec8ff]/15 bg-black/35 text-[#93a0b5] hover:border-[#8ec8ff]/30'
          }`}
        >
          <div>
            <span className="block text-xs sm:text-sm font-black">قفل عناصر الهوية البصرية</span>
            <span className="mt-0.5 block text-[10px] sm:text-[11px] text-[#93a0b5]">
              الحفاظ على الشعار، الألوان، واسم العلامة ثابتاً عند إعادة التوليد
            </span>
          </div>
          {draft.brandLock ? (
            <Lock className="h-5 w-5 shrink-0 text-[#8ec8ff]" />
          ) : (
            <Unlock className="h-5 w-5 shrink-0 text-[#93a0b5]" />
          )}
        </button>
      </div>
    </StudioCard>
  );
}
