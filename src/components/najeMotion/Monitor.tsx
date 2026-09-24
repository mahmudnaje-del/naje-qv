import React, { useState } from 'react';
import { Download, Film, RefreshCw } from 'lucide-react';
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
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-[8%] rounded-sm border border-dashed border-[#8ec8ff]/55" />
      {aspect === '1:1' && (
        <div className="absolute left-1/2 top-1/2 aspect-square w-[70%] -translate-x-1/2 -translate-y-1/2 border border-dashed border-[#e7eef8]/70" />
      )}
      {aspect === '4:5' && (
        <div className="absolute left-1/2 top-1/2 aspect-[4/5] h-[84%] -translate-x-1/2 -translate-y-1/2 border border-dashed border-[#e7eef8]/70" />
      )}
    </div>
  );
}

/** 1:1 and 4:5 are delivered inside a 9:16 file. The stage shows that real frame. */
function FrameStage({ aspect, children }: { aspect: MotionAspect; children: React.ReactNode }) {
  const wide = aspect === '16:9';
  return (
    <div className={wide ? 'w-full' : 'mx-auto w-full max-w-[270px]'}>
      <div className="motion-bezel rounded-[22px] p-[7px]">
        <div
          className="relative overflow-hidden rounded-[16px] bg-black"
          style={{ aspectRatio: wide ? '16 / 9' : '9 / 16' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function YouTubeChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#f1f1f1] p-1.5">
      <div className="mb-1 flex items-center gap-2 px-1.5 py-1">
        <span className="h-2.5 w-3.5 rounded-[2px] bg-[#ff0000]" />
        <span className="text-[9px] font-black text-neutral-700">YouTube</span>
        <span className="h-4 flex-1 rounded-full bg-white text-[8px] leading-4 text-neutral-400" />
      </div>
      {children}
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-300">
        <div className="h-full w-1/3 bg-[#ff0000]" />
      </div>
    </div>
  );
}

function TikTokChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      {children}
      <div className="pointer-events-none absolute inset-y-16 end-2 flex flex-col items-center justify-end gap-4 text-white/80" dir="ltr">
        <span className="h-8 w-8 rounded-full bg-white/15" />
        <span className="h-8 w-8 rounded-full bg-white/15" />
        <span className="h-8 w-8 rounded-full bg-white/15" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="h-2 w-24 rounded bg-white/30" />
        <div className="mt-1.5 h-2 w-16 rounded bg-white/20" />
      </div>
    </div>
  );
}

function InstagramChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#fafafa]">
      <div className="flex items-center gap-2 border-b border-black/10 px-2 py-1.5">
        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" />
        <span className="text-[9px] font-black text-neutral-800">Instagram</span>
      </div>
      {children}
      <div className="flex items-center justify-between px-3 py-1.5 text-[8px] text-neutral-500">
        <span>♡   💬   ➤</span>
        <span>⋯</span>
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
  const safeArea = safeOverride ?? (aspect === '1:1' || aspect === '4:5');
  const primaryUrl =
    focusUrl || results[activeSlot]?.videoUrl || versions[0]?.url || slots.map((s) => results[s]?.videoUrl).find(Boolean) || '';
  const compareWith = compareOn && compareUrl && primaryUrl && compareUrl !== primaryUrl ? compareUrl : '';
  const slotFor = (url: string): IdentSlot => versions.find((v) => v.url === url)?.slot || activeSlot;

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
      <div className="overflow-hidden rounded-2xl border border-[#8ec8ff]/12 bg-black/40">
        <div className="flex items-center justify-between px-3 py-2 text-[11px] font-black text-[#e7eef8]">
          <span className="inline-flex items-center gap-1.5">
            <Film className="h-3.5 w-3.5 text-[#8ec8ff]" />
            {mark} · {t(`motion.piece.${slot}`)}
          </span>
          <button
            type="button"
            onClick={() => void downloadNamed(url, filename)}
            className="inline-flex min-h-[44px] items-center gap-1 text-[#8ec8ff]"
          >
            <Download className="h-3.5 w-3.5" /> {t('motion.monitor.download')}
          </button>
        </div>
        {wrapVideo(
          <FrameStage aspect={aspect}>
            <video src={url} controls playsInline className="absolute inset-0 h-full w-full bg-black object-contain" />
            {safeArea && <SafeGuides aspect={aspect} />}
          </FrameStage>
        )}
      </div>
    );
  };

  return (
    <StudioCard
      frame
      title={t('motion.monitor.title')}
      hint={t('motion.monitor.hint')}
      action={
        busy ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#ffb020]">
            <span className="motion-tally inline-block h-1.5 w-1.5 rounded-full" />
            {formatNumber(Math.max(0, progress))}%
          </span>
        ) : undefined
      }
    >
      {busy && (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#8ec8ff]/10">
          <div className="h-full bg-[#8ec8ff] transition-[width]" style={{ width: `${Math.max(8, progress)}%` }} />
        </div>
      )}

      {busy && hasAny && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#ffb020]/30 bg-[#ffb020]/10 px-3 py-2">
          <NajeThinking size={22} />
          <span className="text-xs font-bold text-[#ffb020]">{stepLabel || t('motion.monitor.building')}</span>
        </div>
      )}

      {busy && !primaryUrl && (
        <FrameStage aspect={aspect}>
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(120% 80% at 50% 28%, ${primary}55, ${bgColor} 64%)` }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <NajeThinking size={48} />
            <span className="text-xs font-bold text-[#ffb020]">{stepLabel || t('motion.monitor.rendering')}</span>
            {generatingSlot ? <span className="text-[10px] text-[#e7eef8]/75">{t(`motion.piece.${generatingSlot}`)}</span> : null}
            <span className="text-[10px] text-[#e7eef8]/80">{t(`motion.step.${stepIndex(progress)}`)}</span>
          </div>
          {safeArea && <SafeGuides aspect={aspect} />}
        </FrameStage>
      )}

      {busy && !primaryUrl && (
        <ol className="mx-auto mt-3 w-full max-w-xs space-y-1 text-start">
          {DIRECTOR_STEPS.map((s, i) => (
            <li key={s.at} className={`text-[10px] ${progress >= s.at ? 'font-bold text-[#ffb020]' : 'text-[#93a0b5]/50'}`}>
              {progress >= s.at ? '✓ ' : '· '}
              {t(`motion.step.${i}`)}
            </li>
          ))}
        </ol>
      )}

      {!primaryUrl && !busy && (
        <FrameStage aspect={aspect}>
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(120% 90% at 50% 22%, ${primary}73, ${bgColor} 68%)` }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center">
            {logo ? <img src={logo} alt="" className="max-h-16 max-w-[48%] object-contain drop-shadow-lg" /> : null}
            <p className="text-base font-black leading-tight text-white drop-shadow">
              {brandName.trim() || t('motion.understood.unnamed')}
            </p>
            {tagline.trim() ? <p className="text-[11px] leading-snug text-white/75">{tagline}</p> : null}
            <p className="mt-1 max-w-[15rem] text-[10px] leading-relaxed text-white/70">{t('motion.stage.empty')}</p>
          </div>
          {safeArea && <SafeGuides aspect={aspect} />}
        </FrameStage>
      )}

      {versions.length > 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-[11px] font-black text-[#e7eef8]">{t('motion.version.title')}</p>
          <p className="text-[10px] leading-relaxed text-[#93a0b5]">{t('motion.version.note')}</p>
          <div className="flex flex-wrap gap-1.5">
            {versions.map((v) => (
              <Chip key={`${v.at}-${v.url}`} active={primaryUrl === v.url} onClick={() => onFocus(v.url)}>
                {t(`motion.piece.${v.slot}`)} · {formatDate(v.at, { hour: '2-digit', minute: '2-digit' })}
              </Chip>
            ))}
          </div>
          <Chip active={compareOn} onClick={onToggleCompare}>
            {t('motion.version.compare')}
          </Chip>
          {compareOn && (
            <div className="flex flex-wrap gap-1.5">
              {versions.map((v) => (
                <Chip key={`b-${v.at}-${v.url}`} active={compareUrl === v.url} onClick={() => onComparePick(v.url)}>
                  {t('motion.version.b')} · {t(`motion.piece.${v.slot}`)}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={compareWith ? 'grid gap-2 sm:grid-cols-2' : 'space-y-3'}>
        {primaryUrl && renderClip(primaryUrl, compareWith ? t('motion.version.a') : t('motion.version.now'))}
        {compareWith && renderClip(compareWith, t('motion.version.b'))}
      </div>

      {!busy && hasAny && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Chip active={chrome === 'youtube'} onClick={() => setChrome((c) => (c === 'youtube' ? 'off' : 'youtube'))}>
              YouTube
            </Chip>
            <Chip active={chrome === 'tiktok'} onClick={() => setChrome((c) => (c === 'tiktok' ? 'off' : 'tiktok'))}>
              TikTok
            </Chip>
            <Chip active={chrome === 'instagram'} onClick={() => setChrome((c) => (c === 'instagram' ? 'off' : 'instagram'))}>
              Instagram
            </Chip>
            <Chip active={safeArea} onClick={() => setSafeOverride(!safeArea)}>
              {t('motion.monitor.safe')}
            </Chip>
          </div>
          {(chrome !== 'off' || safeArea) && (
            <p className="text-[10px] leading-relaxed text-[#93a0b5]">
              {chrome !== 'off' ? t('motion.monitor.chromeOnly') : ''}
              {chrome !== 'off' && safeArea ? ' ' : ''}
              {safeArea ? t('motion.monitor.safeOnly') : ''}
            </p>
          )}
          {(aspect === '1:1' || aspect === '4:5') && (
            <p className="text-[10px] leading-relaxed text-[#93a0b5]">
              {aspect === '1:1' ? t('motion.format.square') : t('motion.format.fourFive')}
            </p>
          )}
          {hasLogo && (
            <p className="rounded-xl border border-[#ffb020]/30 bg-[#ffb020]/10 px-3 py-2 text-[11px] leading-relaxed text-[#ffb020]">
              {t('motion.monitor.fidelity')}
            </p>
          )}
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-[#8ec8ff]/40 bg-[#8ec8ff]/10 py-2.5 text-[12px] font-black text-[#8ec8ff]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> {t('motion.monitor.regen')}
          </button>
          <p className="text-[10px] font-black text-[#93a0b5]">{t('motion.monitor.another')}</p>
          <div className="flex flex-wrap gap-1.5">
            {VARIATIONS.map((v) => (
              <Chip key={v.id} onClick={() => onVariation(v.id)}>
                {opt('var', v.id)}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </StudioCard>
  );
}
