import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import {
  AUDIENCES,
  COLOR_PALETTES,
  INDUSTRIES,
  LANGUAGES,
  isHex,
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
    const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type);
    if (!ok) {
      toast.error('الشعار: PNG أو JPG أو WEBP');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('حجم الشعار أكبر من 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange({ logo: String(reader.result || '') });
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
                <span className="text-[11px] font-bold text-white/60">أرفق الشعار PNG / JPG / WEBP</span>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
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
                className="rounded-xl border border-[#d4a574]/40 bg-[#d4a574]/10 px-3 py-1.5 text-[11px] font-bold text-[#e8b86d] disabled:opacity-50"
              >
                {sampling ? 'يقرأ اللوحة…' : 'اعتبار الألوان من الشعار'}
              </button>
              <button
                type="button"
                onClick={() => onChange({ logo: null })}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-[11px] font-bold text-white/60"
              >
                <X className="h-3 w-3" /> إزالة
              </button>
            </div>
          )}
          <p className="mt-1.5 text-[10px] text-white/35">الاستخراج يقرأ أربع زوايا اللوحة ومركزها عبر canvas — ليس تخميناً.</p>
        </div>

        <div>
          <FieldLabel>الألوان</FieldLabel>
          <div className="mb-2 flex gap-2">
            <ColorField label="أساسي" value={draft.primary} onChange={(primary) => onChange({ primary })} />
            <ColorField label="ثانوي" value={draft.secondary} onChange={(secondary) => onChange({ secondary })} />
            <ColorField label="خلفية" value={draft.bgColor} onChange={(bgColor) => onChange({ bgColor })} />
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {COLOR_PALETTES.map((p) => {
              const on = draft.primary === p.primary && draft.secondary === p.secondary && draft.bgColor === p.bgColor;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ primary: p.primary, secondary: p.secondary, bgColor: p.bgColor })}
                  className={`rounded-xl border p-1.5 ${on ? 'border-[#d4a574]' : 'border-white/10'}`}
                  title={p.ar}
                >
                  <span className="flex h-7 overflow-hidden rounded-lg">
                    <span className="flex-1" style={{ background: p.primary }} />
                    <span className="flex-1" style={{ background: p.secondary }} />
                    <span className="flex-1" style={{ background: p.bgColor }} />
                  </span>
                  <span className="mt-1 block text-center text-[9px] font-bold text-white/50">{p.ar}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </StudioCard>
  );
}
