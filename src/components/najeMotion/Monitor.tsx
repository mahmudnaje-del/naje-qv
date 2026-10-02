import React, { useState } from 'react';
import {
  Download,
  Film,
  RefreshCw,
  Play,
  RotateCcw,
  Maximize2,
  X,
  Sparkles,
  Share2,
  Check,
  Eye,
  Sliders,
  Volume2,
} from 'lucide-react';
import {
  DIRECTOR_STEPS,
  VARIATIONS,
  motionFilename,
  type IdentSlot,
  type MotionAspect,
  type MotionDuration,
  type MotionKind,
  type MotionPlatform,
} from '../../lib/motionStudio';
import NajeThinking from '../NajeThinking';
import { useMotionI18n } from './i18n';
import { Chip, StudioCard } from './StudioUi';
import { toast } from '../../toastStore';

export interface SlotResult {
  jobId: string | null;
  videoUrl?: string;
}

export interface MotionVersion {
  slot: IdentSlot;
  url: string;
  at: number;
}

function visibleSlots(kind: MotionKind): IdentSlot[] {
  if (kind === 'both') return ['intro', 'outro'];
  if (kind === 'logo') return ['logo'];
  return [kind];
}

function stepIndex(progress: number) {
  let i = 0;
  DIRECTOR_STEPS.forEach((s, idx) => {
    if (progress >= s.at) i = idx;
  });
  return i;
}

async function downloadNamed(url: string, filename: string) {
  try {
    toast.success('جارٍ بدء التحميل...');
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch');
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  } catch {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.click();
  }
}

function SafeGuides({ aspect }: { aspect: MotionAspect }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute inset-[10%] rounded-sm border border-dashed border-[#8ec8ff]/60">
        <span className="absolute -top-3 start-1 text-[8px] font-mono text-[#8ec8ff] bg-black/70 px-1 rounded">
          منطقة الأمان (Safe Area)
        </span>
      </div>
      {aspect === '1:1' && (
        <div className="absolute left-1/2 top-1/2 aspect-square w-[75%] -translate-x-1/2 -translate-y-1/2 border border-dashed border-[#ffb020]/70" />
      )}
      {aspect === '4:5' && (
        <div className="absolute left-1/2 top-1/2 aspect-[4/5] h-[85%] -translate-x-1/2 -translate-y-1/2 border border-dashed border-[#ffb020]/70" />
      )}
    </div>
  );
}

function FrameStage({
  aspect,
  children,
  className = '',
}: {
  aspect: MotionAspect;
  children: React.ReactNode;
  className?: string;
}) {
  const isWide = aspect === '16:9';
  const isSquare = aspect === '1:1';
  const isFourFive = aspect === '4:5';

  return (
    <div
      className={`mx-auto transition-all ${
        isWide
          ? 'w-full max-w-full'
          : isSquare
            ? 'w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[360px]'
            : isFourFive
              ? 'w-full max-w-[260px] xs:max-w-[300px] sm:max-w-[340px]'
              : 'w-full max-w-[260px] xs:max-w-[300px] sm:max-w-[330px]'
      } ${className}`}
    >
      <div className="rounded-2xl sm:rounded-[26px] p-1.5 sm:p-2 bg-gradient-to-b from-[#1b2333] to-[#0c1018] shadow-2xl border border-[#8ec8ff]/30">
        <div
          className="relative overflow-hidden rounded-xl sm:rounded-[18px] bg-black shadow-inner"
          style={{
            aspectRatio: isWide ? '16 / 9' : isSquare ? '1 / 1' : isFourFive ? '4 / 5' : '9 / 16',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function YouTubeChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden bg-[#0f0f0f] border border-white/10">
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/60 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-3.5 rounded-[2px] bg-[#ff0000] inline-block" />
          <span className="text-[10px] font-black text-white">YouTube Shorts / Video</span>
        </div>
        <span className="text-[9px] text-neutral-400">معاينة البث</span>
      </div>
      {children}
      <div className="h-1 bg-neutral-800">
        <div className="h-full w-2/5 bg-[#ff0000]" />
      </div>
    </div>
  );
}

function TikTokChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-black border border-white/10">
      {children}
      <div className="pointer-events-none absolute inset-y-12 end-2 flex flex-col items-center justify-end gap-3 text-white/90 z-20" dir="ltr">
        <div className="flex flex-col items-center">
          <span className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-xs">❤️</span>
          <span className="text-[8px] font-bold">128K</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-xs">💬</span>
          <span className="text-[8px] font-bold">1.4K</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-xs">↗️</span>
          <span className="text-[8px] font-bold">مشاركة</span>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-start z-20">
        <div className="h-2 w-28 rounded bg-white/40 mb-1" />
        <div className="h-1.5 w-20 rounded bg-white/25" />
      </div>
    </div>
  );
}

function InstagramChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl bg-black border border-white/10">
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/60 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" />
          <span className="text-[10px] font-black text-white">Reels</span>
        </div>
        <span className="text-[9px] text-neutral-400">معاينة إنستغرام</span>
      </div>
      {children}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/80 text-[10px] text-white/80">
        <span className="flex items-center gap-3">
          <span>❤️ 45.2K</span>
          <span>💬 890</span>
          <span>✈️</span>
        </span>
        <span>🔖</span>
      </div>
    </div>
  );
}

export function Monitor({
  busy,
  stepLabel,
  progress,
  generatingSlot,
  results,
  activeSlot,
  kind,
  aspect,
  platform,
  duration,
  brandName,
  hasLogo,
  logo,
  primary,
  bgColor,
  tagline,
  versions,
  focusUrl,
  compareUrl,
  compareOn,
  onFocus,
  onComparePick,
  onToggleCompare,
  onRegenerate,
  onVariation,
}: {
  busy: boolean;
  stepLabel: string;
  progress: number;
  generatingSlot: IdentSlot | null;
  results: Partial<Record<IdentSlot, SlotResult>>;
  activeSlot: IdentSlot;
  kind: MotionKind;
  aspect: MotionAspect;
  platform: MotionPlatform;
  duration: MotionDuration;
  brandName: string;
  hasLogo: boolean;
  logo: string | null;
  primary: string;
  bgColor: string;
  tagline: string;
  versions: MotionVersion[];
  focusUrl: string | null;
  compareUrl: string | null;
  compareOn: boolean;
  onFocus: (url: string) => void;
  onComparePick: (url: string) => void;
  onToggleCompare: () => void;
  onRegenerate: () => void;
  onVariation: (id: string) => void;
}) {
  const { t, opt, formatNumber, formatDate } = useMotionI18n();
  const slots = visibleSlots(kind);
  const hasAny = slots.some((s) => results[s]?.videoUrl) || versions.length > 0;
  const [chrome, setChrome] = useState<'off' | 'youtube' | 'tiktok' | 'instagram'>('off');
  const [safeOverride, setSafeOverride] = useState<boolean | null>(null);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simKey, setSimKey] = useState(0);

  const safeArea = safeOverride ?? (aspect === '1:1' || aspect === '4:5');
  const primaryUrl =
    focusUrl || results[activeSlot]?.videoUrl || versions[0]?.url || slots.map((s) => results[s]?.videoUrl).find(Boolean) || '';
  const compareWith = compareOn && compareUrl && primaryUrl && compareUrl !== primaryUrl ? compareUrl : '';
  const slotFor = (url: string): IdentSlot => versions.find((v) => v.url === url)?.slot || activeSlot;

  const triggerSimulation = () => {
    setSimulating(true);
    setSimKey((k) => k + 1);
    toast.success('تشغيل محاكاة الحركة التجريبية للشعار');
    setTimeout(() => setSimulating(false), 5000);
  };

  const wrapVideo = (video: React.ReactNode) => {
    if (chrome === 'off') return video;
    if (chrome === 'instagram') return <InstagramChrome>{video}</InstagramChrome>;
    if (chrome === 'tiktok') return <TikTokChrome>{video}</TikTokChrome>;
    return <YouTubeChrome>{video}</YouTubeChrome>;
  };

  const renderClip = (url: string, mark: string) => {
    const slot = slotFor(url);
    const filename = motionFilename(brandName, slot, duration, aspect);

    return (
      <div className="overflow-hidden rounded-2xl border border-[#8ec8ff]/25 bg-black/60 shadow-xl">
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/70 border-b border-[#8ec8ff]/15 text-xs font-black text-[#e7eef8]">
          <span className="inline-flex items-center gap-2">
            <Film className="h-4 w-4 text-[#8ec8ff]" />
            <span>{mark}</span>
            <span className="text-[#93a0b5] font-normal">· {t(`motion.piece.${slot}`)}</span>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFullscreenUrl(url)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-[#93a0b5] hover:text-white transition"
              title="تكبير ملء الشاشة"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void downloadNamed(url, filename)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#8ec8ff]/20 border border-[#8ec8ff]/40 px-3 py-1 text-xs font-black text-[#8ec8ff] hover:bg-[#8ec8ff]/30 active:scale-95 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>تحميل MP4</span>
            </button>
          </div>
        </div>

        <div className="p-2 sm:p-3">
          {wrapVideo(
            <FrameStage aspect={aspect}>
              <video
                src={url}
                controls
                playsInline
                autoPlay
                className="absolute inset-0 h-full w-full bg-black object-contain"
              />
              {safeArea && <SafeGuides aspect={aspect} />}
            </FrameStage>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <StudioCard
        frame
        title="المسرح السينمائي والمونيتور"
        hint="معاينة تفاعلية حية للشعار وحركة الهوية وشاشة العرض النهائية."
        icon={<Film className="w-4 h-4 text-[#8ec8ff]" />}
        action={
          busy ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-black text-[#ffb020] bg-[#ffb020]/15 border border-[#ffb020]/40 px-3 py-1 rounded-full shadow-xs">
              <span className="motion-tally inline-block h-2 w-2 rounded-full bg-[#ffb020] animate-pulse" />
              {formatNumber(Math.max(0, progress))}%
            </span>
          ) : undefined
        }
      >
        {/* Busy Progress Bar */}
        {busy && (
          <div className="mb-3.5 h-2 overflow-hidden rounded-full bg-[#8ec8ff]/15">
            <div
              className="h-full bg-gradient-to-r from-[#8ec8ff] to-[#60a5fa] transition-[width] duration-300 rounded-full"
              style={{ width: `${Math.max(8, progress)}%` }}
            />
          </div>
        )}

        {/* Busy Status Banner */}
        {busy && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[#ffb020]/35 bg-[#ffb020]/10 p-3">
            <NajeThinking size={26} />
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#ffb020]">
                {stepLabel || 'ناجي يقوم بإخراج المشهد…'}
              </div>
              <div className="text-[10px] text-[#ffb020]/80 mt-0.5">
                توليد حركة الكاميرا، معالجة الجزيئات، ومطابقة الهوية البصرية
              </div>
            </div>
          </div>
        )}

        {/* Rendering Stage when Busy and No Previous URL */}
        {busy && !primaryUrl && (
          <FrameStage aspect={aspect}>
            <div
              className="absolute inset-0"
              style={{ background: `radial-gradient(120% 80% at 50% 28%, ${primary}55, ${bgColor} 64%)` }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-4 text-center">
              <NajeThinking size={54} />
              <span className="text-sm font-bold text-[#ffb020]">
                {stepLabel || 'جاري المعالجة السينمائية…'}
              </span>
              {generatingSlot && (
                <span className="text-[11px] text-[#e7eef8]/85 font-mono">
                  {t(`motion.piece.${generatingSlot}`)} · {duration}s · {aspect}
                </span>
              )}
              <span className="text-[10px] text-[#e7eef8]/70">
                {t(`motion.step.${stepIndex(progress)}`)}
              </span>
            </div>
            {safeArea && <SafeGuides aspect={aspect} />}
          </FrameStage>
        )}

        {/* Live Interactive Canvas Simulator (When idle & no video yet) */}
        {!primaryUrl && !busy && (
          <div className="space-y-3">
            <FrameStage aspect={aspect}>
              <div
                key={simKey}
                className="absolute inset-0 transition-colors duration-700 overflow-hidden"
                style={{
                  background: `radial-gradient(130% 90% at 50% 25%, ${primary}88, ${bgColor} 70%)`,
                }}
              >
                {/* Simulated Ambient Particle & Light Beams */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0,transparent_70%)] animate-pulse" />

                {/* Simulated Sweep Bar when simulating */}
                {simulating && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                )}

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center z-10">
                  {logo ? (
                    <div className={simulating ? 'scale-110 transition-transform duration-700' : 'transition-transform hover:scale-105'}>
                      <img
                        src={logo}
                        alt=""
                        className="max-h-16 sm:max-h-20 max-w-[55%] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white/70">
                      <Sparkles className="w-6 h-6 text-[#ffb020]" />
                    </div>
                  )}

                  <p
                    className="text-base sm:text-lg font-black leading-tight drop-shadow-md tracking-tight"
                    style={{ color: '#ffffff' }}
                  >
                    {brandName.trim() || 'علامتك التجارية'}
                  </p>

                  {tagline.trim() ? (
                    <p className="text-xs leading-snug text-white/80 font-medium max-w-[85%]">
                      {tagline}
                    </p>
                  ) : null}

                  {simulating && (
                    <div className="mt-1 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-[#ffb020] animate-bounce" />
                      <span className="text-[10px] text-[#ffb020] font-bold">محاكاة المؤثرات الصوتية والحركية</span>
                    </div>
                  )}

                  <div className="mt-1 flex items-center justify-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ffb020] animate-ping" />
                    <span className="text-[10px] text-white/70 font-mono">
                      جاهز للإخراج السينمائي · {duration}s · {aspect}
                    </span>
                  </div>
                </div>

                {safeArea && <SafeGuides aspect={aspect} />}
              </div>
            </FrameStage>

            {/* Simulation Trigger Button */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={triggerSimulation}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#8ec8ff]/40 bg-[#8ec8ff]/15 px-4 py-2 text-xs font-black text-[#8ec8ff] hover:bg-[#8ec8ff]/25 active:scale-95 transition shadow-xs"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>تشغيل محاكاة حركة الهوية الآن</span>
              </button>
            </div>
          </div>
        )}

        {/* Versions Gallery */}
        {versions.length > 0 && (
          <div className="mb-3.5 space-y-2 pt-2 border-t border-[#8ec8ff]/10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-[#e7eef8]">{t('motion.version.title')}</p>
              <Chip active={compareOn} onClick={onToggleCompare}>
                {t('motion.version.compare')}
              </Chip>
            </div>
            <p className="text-[10px] text-[#93a0b5]">{t('motion.version.note')}</p>

            <div className="flex flex-wrap gap-1.5">
              {versions.map((v) => (
                <Chip
                  key={`${v.at}-${v.url}`}
                  active={primaryUrl === v.url}
                  onClick={() => onFocus(v.url)}
                >
                  {t(`motion.piece.${v.slot}`)} · {formatDate(v.at, { hour: '2-digit', minute: '2-digit' })}
                </Chip>
              ))}
            </div>

            {compareOn && (
              <div className="pt-2">
                <p className="text-[10px] font-bold text-[#ffb020] mb-1">اختر الفيديو الثاني للمقارنة:</p>
                <div className="flex flex-wrap gap-1.5">
                  {versions.map((v) => (
                    <Chip
                      key={`b-${v.at}-${v.url}`}
                      active={compareUrl === v.url}
                      onClick={() => onComparePick(v.url)}
                    >
                      {t('motion.version.b')} · {t(`motion.piece.${v.slot}`)}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Video Clips Container */}
        <div className={compareWith ? 'grid gap-3 sm:grid-cols-2' : 'space-y-3'}>
          {primaryUrl && renderClip(primaryUrl, compareWith ? t('motion.version.a') : t('motion.version.now'))}
          {compareWith && renderClip(compareWith, t('motion.version.b'))}
        </div>

        {/* Production Controls & Social Frame Simulation */}
        {!busy && hasAny && (
          <div className="mt-4 space-y-3 pt-3 border-t border-[#8ec8ff]/10">
            <div className="space-y-1.5">
              <p className="text-xs font-black text-[#e7eef8]">معاينة شكل الفيديو على منصات العرض:</p>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  active={chrome === 'youtube'}
                  onClick={() => setChrome((c) => (c === 'youtube' ? 'off' : 'youtube'))}
                >
                  YouTube
                </Chip>
                <Chip
                  active={chrome === 'tiktok'}
                  onClick={() => setChrome((c) => (c === 'tiktok' ? 'off' : 'tiktok'))}
                >
                  TikTok
                </Chip>
                <Chip
                  active={chrome === 'instagram'}
                  onClick={() => setChrome((c) => (c === 'instagram' ? 'off' : 'instagram'))}
                >
                  Instagram Reels
                </Chip>
                <Chip active={safeArea} onClick={() => setSafeOverride(!safeArea)}>
                  {t('motion.monitor.safe')}
                </Chip>
              </div>
            </div>

            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#8ec8ff]/40 bg-[#8ec8ff]/15 py-3 text-xs font-black text-[#8ec8ff] hover:bg-[#8ec8ff]/25 active:scale-98 transition shadow-xs"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{t('motion.monitor.regen')}</span>
            </button>

            {/* Quick Variations */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-[#93a0b5]">{t('motion.monitor.another')}:</p>
              <div className="flex flex-wrap gap-1.5">
                {VARIATIONS.map((v) => (
                  <Chip key={v.id} onClick={() => onVariation(v.id)}>
                    {opt('var', v.id)}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}
      </StudioCard>

      {/* Fullscreen Video Modal */}
      {fullscreenUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-6">
          <div className="relative w-full max-w-4xl flex flex-col items-center">
            <button
              type="button"
              onClick={() => setFullscreenUrl(null)}
              className="absolute -top-12 end-0 p-2 text-white hover:text-[#8ec8ff] transition"
            >
              <X className="w-6 h-6" />
            </button>
            <video
              src={fullscreenUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[85vh] w-full rounded-2xl bg-black object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
