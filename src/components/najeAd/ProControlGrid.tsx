import React from 'react';
import { Check } from 'lucide-react';
import {
  AUDIO_MODES,
  CAMERA_MOTIONS,
  COLOR_GRADES,
  CTA_MODES,
  HOOK_STYLES,
  LIGHTING_LOOKS,
  MARKETING_GOALS,
  MUSIC_ENERGY,
  NAJE_VIDEO_PRO_LABEL,
  OMNI_DURATIONS,
  OMNI_RESOLUTIONS,
  OmniDuration,
  OmniResolution,
  PACE_OPTIONS,
  PRODUCT_PLACEMENTS,
  VOICE_CASTS,
  estimateOmniPoints,
} from '../../lib/omniAd';
import { DIALECT_OPTIONS, LANGUAGE_OPTIONS, PLATFORM_OPTIONS } from '../../lib/adDnaEngine';

const LANG_SHORT: Record<string, string> = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  tr: 'Türkçe',
  de: 'Deutsch',
};

const PLATFORM_SHORT: Record<string, string> = {
  general: 'عام',
  tiktok: 'TikTok',
  instagram_reels: 'Reels',
  youtube: 'يوتيوب',
  youtube_shorts: 'Shorts',
  snapchat: 'Snapchat',
  tv_commercial: 'تلفزيون',
};

const DIALECT_SHORT: Record<string, string> = {
  standard_modern: 'فصحى معاصرة',
  gulf_saudi: 'خليجية',
  gulf_emirati: 'إماراتية',
  levantine_syrian_lebanese: 'شامية',
  egyptian: 'مصرية',
  maghrebi_moroccan: 'مغاربية',
  iraqi: 'عراقية',
  us_standard: 'American',
  uk_rp: 'British',
  global_neutral: 'International',
  fr_standard: 'Français',
  es_castilian: 'Español',
  tr_istanbul: 'Türkçe',
  de_standard: 'Deutsch',
};

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
          ? 'border-[#d4a574] bg-[#d4a574]/15 text-[#f4efe6] shadow-[0_0_18px_rgba(212,165,116,0.22)]'
          : 'border-white/10 bg-black/35 text-white/65 hover:border-white/25 hover:text-white'
      }`}
    >
      {active && <Check className="h-3 w-3 text-[#e8b86d]" />}
      {children}
    </button>
  );
}

function Box({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
      <div className="mb-2.5">
        <h4 className="text-xs font-black text-white">{title}</h4>
        {hint && <p className="mt-0.5 text-[10px] text-white/40">{hint}</p>}
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">{children}</div>
    </section>
  );
}

export function ProControlGrid(props: {
  duration: OmniDuration;
  onDuration: (v: OmniDuration) => void;
  resolution: OmniResolution;
  onResolution: (v: OmniResolution) => void;
  aspectRatio: '16:9' | '9:16';
  onAspect: (v: '16:9' | '9:16') => void;
  platform: string;
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
  pointsRate: number;
  resolutionMultiplier?: Partial<Record<OmniResolution, number>>;
}) {
  const points = estimateOmniPoints({
    durationSec: props.duration,
    resolution: props.resolution,
    pointsRatePerSecond: props.pointsRate,
    resolutionMultiplier: props.resolutionMultiplier,
  });
  const dialects = DIALECT_OPTIONS[props.language] || [];

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:gap-3 lg:grid-cols-2" dir="rtl">
      <Box title="المدة" hint="التوليد 10 ثوانٍ ثم تمديد المشهد بزيادات 10 ثوانٍ">
        {OMNI_DURATIONS.map((d) => (
          <Chip key={d} active={props.duration === d} onClick={() => props.onDuration(d)}>
            {d} ث
          </Chip>
        ))}
      </Box>

      <Box title="الجودة" hint="360p للتجربة السريعة — 1080p و4K للتسليم">
        {OMNI_RESOLUTIONS.map((r) => (
          <Chip key={r.id} active={props.resolution === r.id} onClick={() => props.onResolution(r.id)}>
            {r.name}
          </Chip>
        ))}
      </Box>

      <Box title="الأبعاد والمنصة">
        <Chip active={props.aspectRatio === '9:16'} onClick={() => props.onAspect('9:16')}>
          9:16
        </Chip>
        <Chip active={props.aspectRatio === '16:9'} onClick={() => props.onAspect('16:9')}>
          16:9
        </Chip>
        {PLATFORM_OPTIONS.map((p) => (
          <Chip
            key={p.id}
            active={props.platform === p.id}
            onClick={() => {
              props.onPlatform(p.id);
              props.onAspect(p.defaultRatio as '16:9' | '9:16');
            }}
          >
            {PLATFORM_SHORT[p.id] || p.label}
          </Chip>
        ))}
      </Box>

      <Box title="هوك الثلاث ثوانٍ الأولى">
        {HOOK_STYLES.map((h) => (
          <Chip key={h.id} active={props.hookStyle === h.id} onClick={() => props.onHookStyle(h.id)}>
            {h.label}
          </Chip>
        ))}
      </Box>

      <Box title="حركة الكاميرا">
        {CAMERA_MOTIONS.map((c) => (
          <Chip key={c.id} active={props.cameraMotion === c.id} onClick={() => props.onCamera(c.id)}>
            {c.label}
          </Chip>
        ))}
      </Box>

      <Box title="الإضاءة">
        {LIGHTING_LOOKS.map((l) => (
          <Chip key={l.id} active={props.lighting === l.id} onClick={() => props.onLighting(l.id)}>
            {l.label}
          </Chip>
        ))}
      </Box>

      <Box title="الإيقاع">
        {PACE_OPTIONS.map((p) => (
          <Chip key={p.id} active={props.pace === p.id} onClick={() => props.onPace(p.id)}>
            {p.label}
          </Chip>
        ))}
      </Box>

      <Box title="التدرج اللوني">
        {COLOR_GRADES.map((g) => (
          <Chip key={g.id} active={props.colorGrade === g.id} onClick={() => props.onColorGrade(g.id)}>
            {g.label}
          </Chip>
        ))}
      </Box>

      <Box title="ظهور المنتج">
        {PRODUCT_PLACEMENTS.map((p) => (
          <Chip key={p.id} active={props.productPlacement === p.id} onClick={() => props.onProductPlacement(p.id)}>
            {p.label}
          </Chip>
        ))}
      </Box>

      <Box title="هدف الإعلان">
        {MARKETING_GOALS.map((g) => (
          <Chip key={g.id} active={props.marketingGoal === g.id} onClick={() => props.onGoal(g.id)}>
            {g.label}
          </Chip>
        ))}
      </Box>

      <Box title="الصوت">
        {AUDIO_MODES.map((a) => (
          <Chip key={a.id} active={props.audioMode === a.id} onClick={() => props.onAudio(a.id)}>
            {a.label}
          </Chip>
        ))}
      </Box>

      <Box title="المعلق والموسيقى">
        {VOICE_CASTS.map((v) => (
          <Chip key={v.id} active={props.voiceCast === v.id} onClick={() => props.onVoiceCast(v.id)}>
            {v.label}
          </Chip>
        ))}
        {MUSIC_ENERGY.map((m) => (
          <Chip key={m.id} active={props.musicEnergy === m.id} onClick={() => props.onMusicEnergy(m.id)}>
            {m.label}
          </Chip>
        ))}
      </Box>

      <Box title="الإغلاق / CTA">
        {CTA_MODES.map((c) => (
          <Chip key={c.id} active={props.cta === c.id} onClick={() => props.onCta(c.id)}>
            {c.label}
          </Chip>
        ))}
      </Box>

      <div className="space-y-2.5">
        <Box title="لغة الحوار">
          {LANGUAGE_OPTIONS.map((l) => (
            <Chip key={l.id} active={props.language === l.id} onClick={() => props.onLanguage(l.id)}>
              {LANG_SHORT[l.id] || l.label}
            </Chip>
          ))}
        </Box>
        {dialects.length > 0 && (
          <Box title="اللهجة" hint="تظهر بعد اختيار اللغة">
            {dialects.map((d) => (
              <Chip key={d.id} active={props.dialect === d.id} onClick={() => props.onDialect(d.id)}>
                {DIALECT_SHORT[d.id] || d.label}
              </Chip>
            ))}
          </Box>
        )}
      </div>

      <div className="rounded-2xl border border-[#d4a574]/30 bg-[#d4a574]/10 p-3 sm:p-4 lg:col-span-2">
        <div className="flex flex-wrap items-end justify-between gap-2 text-right">
          <div>
            <p className="text-[10px] font-bold text-[#e8b86d]">التكلفة التقديرية</p>
            <p className="text-2xl font-black text-white">
              {points} <span className="text-sm font-medium text-white/50">نقطة</span>
            </p>
          </div>
          <p className="max-w-sm text-[10px] leading-relaxed text-white/45">
            {props.duration}ث · {props.resolution} · {NAJE_VIDEO_PRO_LABEL}
            {props.duration > 10 ? ` · ${Math.ceil((props.duration - 10) / 10)} تمديد مشهد` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
