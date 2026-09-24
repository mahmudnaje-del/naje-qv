import React, { useRef, useState } from 'react';
import { Lock, Unlock, Upload, X } from 'lucide-react';
import {
  AUDIENCES,
  BRAND_VOICES,
  COLOR_PALETTES,
  INDUSTRIES,
  LANGUAGES,
  NAME_SCRIPTS,
  PLATFORMS,
  PROJECT_TYPES,
  autoBrandPatch,
  generatePaletteFromPrimary,
  isHex,
  rasterizeLogo,
  sampleLogoPalette,
  type MotionDraft,
} from '../../lib/motionStudio';
import { toast } from '../../toastStore';
import { Chip, ChipRow, FieldLabel, StudioCard, StudioInput } from './StudioUi';

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
      <p className="mb-1 text-[10px] font-black text-white/50">{label}</p>
      <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-2 py-1.5">
        <input
          type="color"
          value={isHex(value) ? value : '#d4a574'}
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
          className="w-full bg-transparent font-mono text-[11px] text-white/80 outline-none"
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [sampling, setSampling] = useState(false);

  const pickLogo = (file?: File) => {
    if (!file) return;
    const ok = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type);
    if (!ok) {
      toast.error('الشعار: PNG أو JPG أو WEBP أو SVG');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('حجم الشعار أكبر من 8MB');
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
          toast.success('حُوّل SVG إلى PNG قبل الإرسال — المحرك يستقبل صورة نقطية');
        } catch {
          toast.error('تعذر تحويل SVG — جرّب PNG');
        }
        return;
      }
      onChange({ logo: raw });
    };
    reader.readAsDataURL(file);
  };

  const extract = async () => {
    if (!draft.logo) {
      toast.error('أرفق الشعار أولاً');
      return;
    }
    setSampling(true);
    try {
      const colors = await sampleLogoPalette(draft.logo);
      onChange(colors);
      toast.success('أُخذت الألوان من زوايا الشعار ومركزه');
    } catch {
      toast.error('تعذر قراءة ألوان الشعار');
    } finally {
      setSampling(false);
    }
  };

  return (
    <StudioCard title="العلامة" hint="الاسم إلزامي. الشعار والألوان تُقفَل في التوجيه.">
      <div className="space-y-3">
        <div>
          <FieldLabel>اسم العلامة</FieldLabel>
          <StudioInput
            value={draft.brandName}
            onChange={(v) => onChange({ brandName: v })}
            placeholder="مثال: قناة أفق، بودكاست الليل"
          />
        </div>
        <div>
          <FieldLabel>الشعار النصي</FieldLabel>
          <StudioInput
            value={draft.tagline}
            onChange={(v) => onChange({ tagline: v })}
            placeholder="اختياري"
          />
        </div>
        <div>
          <FieldLabel>وصف العلامة</FieldLabel>
          <textarea
            rows={2}
            value={draft.description}
            maxLength={400}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="اختياري — للنبرة فقط، لا يُكتب فقرة على الشاشة"
            className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
          />
        </div>
        <div>
          <FieldLabel>الموقع</FieldLabel>
          <input
            dir="ltr"
            value={draft.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="example.com"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-left text-sm text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
          />
          <p className="mt-1 text-[10px] text-white/35">يظهر على الشاشة فقط إن وُجد، ويُكتب كما هو حرفياً.</p>
        </div>
        <div>
          <FieldLabel>حسابات التواصل</FieldLabel>
          <StudioInput
            value={draft.socials}
            onChange={(v) => onChange({ socials: v })}
            placeholder="اختياري: @channel · instagram.com/brand"
          />
          <p className="mt-1 text-[10px] text-white/35">
            لا تُرسم أيقونات لمنصات لم تُذكر. اتركه فارغاً إن لم ترد حسابات على الشاشة.
          </p>
        </div>

        <ChipRow title="المنصة">
          {PLATFORMS.map((x) => (
            <Chip
              key={x.id}
              active={draft.platform === x.id}
              onClick={() => onChange({ platform: draft.platform === x.id ? '' : x.id })}
            >
              {x.ar}
            </Chip>
          ))}
        </ChipRow>

        <ChipRow title="نوع المشروع">
          {PROJECT_TYPES.map((x) => (
            <Chip
              key={x.id}
              active={draft.projectType === x.id}
              onClick={() => onChange({ projectType: draft.projectType === x.id ? '' : x.id })}
            >
              {x.ar}
            </Chip>
          ))}
        </ChipRow>

        <ChipRow title="المجال">
          {INDUSTRIES.map((x) => (
            <Chip key={x.id} active={draft.industry === x.id} onClick={() => onChange({ industry: x.id })}>
              {x.ar}
            </Chip>
          ))}
        </ChipRow>

        <ChipRow title="لمن">
          {AUDIENCES.map((x) => (
            <Chip key={x.id} active={draft.audience === x.id} onClick={() => onChange({ audience: x.id })}>
              {x.ar}
            </Chip>
          ))}
        </ChipRow>

        <ChipRow title="لغة النص على الشاشة">
          {LANGUAGES.map((x) => (
            <Chip key={x.id} active={draft.language === x.id} onClick={() => onChange({ language: x.id })}>
              {x.ar}
            </Chip>
          ))}
        </ChipRow>

        <ChipRow title="كتابة الاسم">
          {NAME_SCRIPTS.map((x) => (
            <Chip key={x.id} active={draft.nameScript === x.id} onClick={() => onChange({ nameScript: x.id })}>
              {x.ar}
            </Chip>
          ))}
        </ChipRow>

        <ChipRow title="صوت العلامة">
          {BRAND_VOICES.map((x) => (
            <Chip key={x.id} active={draft.brandVoice === x.id} onClick={() => onChange({ brandVoice: x.id })}>
              {x.ar}
            </Chip>
          ))}
        </ChipRow>

        <div>
          <FieldLabel>الشعار</FieldLabel>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#d4a574]/40 bg-black/30 py-5"
          >
            {draft.logo ? (
              <img src={draft.logo} alt="شعار العلامة" className="h-16 max-w-[70%] object-contain" />
            ) : (
              <>
                <Upload className="mb-1 h-5 w-5 text-[#e8b86d]" />
                <span className="text-[11px] font-bold text-white/60">أرفق الشعار PNG / JPG / WEBP / SVG</span>
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
                className="min-h-[44px] rounded-xl border border-[#d4a574]/40 bg-[#d4a574]/10 px-3 py-1.5 text-[11px] font-bold text-[#e8b86d] disabled:opacity-50"
              >
                {sampling ? 'يقرأ اللوحة…' : 'استخراج من الشعار'}
              </button>
              <button
                type="button"
                onClick={() => onChange({ logo: null })}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-[11px] font-bold text-white/60"
              >
                <X className="h-3 w-3" /> إزالة
              </button>
            </div>
          )}
          <p className="mt-1.5 text-[10px] text-white/35">الاستخراج يقرأ أربع زوايا اللوحة ومركزها عبر canvas — ليس تخميناً.</p>
        </div>

        <div>
          <FieldLabel>الألوان</FieldLabel>
          <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <ColorField label="أساسي" value={draft.primary} onChange={(primary) => onChange({ primary })} />
            <ColorField label="ثانوي" value={draft.secondary} onChange={(secondary) => onChange({ secondary })} />
            <ColorField label="تمييز" value={draft.accent} onChange={(accent) => onChange({ accent })} />
            <ColorField label="خلفية" value={draft.bgColor} onChange={(bgColor) => onChange({ bgColor })} />
            <ColorField label="نص" value={draft.textColor} onChange={(textColor) => onChange({ textColor })} />
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {COLOR_PALETTES.map((p) => {
              const on =
                draft.primary === p.primary &&
                draft.secondary === p.secondary &&
                draft.accent === p.accent &&
                draft.bgColor === p.bgColor &&
                draft.textColor === p.textColor;
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
                  className={`min-h-[44px] rounded-xl border p-1.5 ${on ? 'border-[#d4a574]' : 'border-white/10'}`}
                  title={p.ar}
                >
                  <span className="flex h-7 overflow-hidden rounded-lg">
                    <span className="flex-1" style={{ background: p.primary }} />
                    <span className="flex-1" style={{ background: p.secondary }} />
                    <span className="flex-1" style={{ background: p.accent }} />
                    <span className="flex-1" style={{ background: p.bgColor }} />
                    <span className="flex-1" style={{ background: p.textColor }} />
                  </span>
                  <span className="mt-1 block text-center text-[9px] font-bold text-white/50">{p.ar}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange(generatePaletteFromPrimary(draft.primary))}
              className="min-h-[44px] rounded-xl border border-white/10 px-3 py-1.5 text-[11px] font-bold text-white/70"
            >
              ولّد لوحة من الأساسي
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(autoBrandPatch(draft));
                toast.success('اقتُرح أسلوب وحركة وصوت من المجال — راجع قبل الإنتاج');
              }}
              className="min-h-[44px] rounded-xl border border-[#d4a574]/40 bg-[#d4a574]/10 px-3 py-1.5 text-[11px] font-bold text-[#e8b86d]"
            >
              اقترح الهوية تلقائياً
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-white/35">
            توليد اللوحة حساب HSL من اللون الأساسي. الاقتراح التلقائي يملأ الأسلوب والحركة من المجال — ليس نموذجاً بصرياً.
          </p>
        </div>

        <div>
          <FieldLabel>قواعد العلامة</FieldLabel>
          <textarea
            rows={3}
            value={draft.brandRules}
            maxLength={800}
            onChange={(e) => onChange({ brandRules: e.target.value })}
            placeholder="مثال: لا نيون، لا حروف مفككة، لا شعار ثلاثي الأبعاد"
            className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => onChange({ brandLock: !draft.brandLock })}
          className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-right ${
            draft.brandLock
              ? 'border-[#d4a574]/50 bg-[#d4a574]/10 text-[#e8b86d]'
              : 'border-white/10 bg-black/30 text-white/60'
          }`}
        >
          <span>
            <span className="block text-[12px] font-black">عند إعادة التوليد تبقى الهوية مقفولة</span>
            <span className="mt-0.5 block text-[10px] text-white/45">
              الشعار والألوان والاسم والمدة والإطار لا تُصفَّر مع النسخ.
            </span>
          </span>
          {draft.brandLock ? <Lock className="h-4 w-4 shrink-0" /> : <Unlock className="h-4 w-4 shrink-0" />}
        </button>
      </div>
    </StudioCard>
  );
}
