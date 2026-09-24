import React, { useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, Sparkles, Trash2 } from 'lucide-react';
import { CvPhotoStyle, PHOTO_STYLES } from '../../lib/cvStudio';
import { useI18n } from '../../i18n';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** 4:5 professional crop around a focal point (0–1 in source space). */
export async function cropToHeadshot(dataUrl: string, focusX = 0.5, focusY = 0.32): Promise<string> {
  const img = await loadImage(dataUrl);
  const w = 720;
  const h = 900;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  const dstRatio = w / h;
  let sw: number;
  let sh: number;
  if (img.width / img.height > dstRatio) {
    sh = img.height;
    sw = sh * dstRatio;
  } else {
    sw = img.width;
    sh = sw / dstRatio;
  }
  const sx = clamp(img.width * focusX - sw / 2, 0, Math.max(0, img.width - sw));
  const sy = clamp(img.height * focusY - sh / 2, 0, Math.max(0, img.height - sh));
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Local studio grade: contrast + warm lift. Same pixels, no beauty API, no identity swap.
 * Composition is preserved (no recrop).
 */
export async function enhanceHeadshot(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const maxSide = 900;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;

  const sample = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return [d[i], d[i + 1], d[i + 2]] as const;
  };
  const corners = [sample(8, 8), sample(w - 9, 8), sample(8, h - 9), sample(w - 9, h - 9)];
  const avg = corners.reduce(
    (a, c) => [a[0] + c[0] / 4, a[1] + c[1] / 4, a[2] + c[2] / 4] as const,
    [0, 0, 0] as const
  );
  const uniform = corners.every(
    (c) => Math.abs(c[0] - avg[0]) < 38 && Math.abs(c[1] - avg[1]) < 38 && Math.abs(c[2] - avg[2]) < 38
  );

  let min = 255;
  let max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const y = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
    if (y < min) min = y;
    if (y > max) max = y;
  }
  const span = Math.max(1, max - min);

  for (let i = 0; i < d.length; i += 4) {
    const x = (i / 4) % w;
    const y = Math.floor(i / 4 / w);
    let r = ((d[i] - min) / span) * 255;
    let g = ((d[i + 1] - min) / span) * 255;
    let b = ((d[i + 2] - min) / span) * 255;
    r = Math.min(255, r * 1.06 + 8);
    g = Math.min(255, g * 1.02 + 4);
    b = Math.min(255, b * 0.96);
    if (uniform) {
      const dist = Math.min(x, w - x, y, h - y);
      if (dist < 70) {
        const t = 1 - dist / 70;
        const bg = [236, 230, 220];
        r = r * (1 - t * 0.92) + bg[0] * t * 0.92;
        g = g * (1 - t * 0.92) + bg[1] * t * 0.92;
        b = b * (1 - t * 0.92) + bg[2] * t * 0.92;
      }
    }
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.92);
}

/** Color-grade only. Same face, same crop — no identity swap. */
export async function gradePhotoStyle(dataUrl: string, style: CvPhotoStyle): Promise<string> {
  if (style === 'natural') return dataUrl;
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, img.width, img.height);
  const d = image.data;
  const grades: Record<Exclude<CvPhotoStyle, 'natural'>, { contrast: number; sat: number; warmth: number; lift: number; vignette: number }> = {
    corporate: { contrast: 1.12, sat: 0.9, warmth: -10, lift: 2, vignette: 0.22 },
    executive: { contrast: 1.18, sat: 0.84, warmth: 4, lift: -6, vignette: 0.32 },
    creative: { contrast: 1.08, sat: 1.16, warmth: 14, lift: 6, vignette: 0.14 },
    minimal: { contrast: 0.94, sat: 0.52, warmth: 2, lift: 18, vignette: 0.08 },
  };
  const g = grades[style];
  const w = img.width;
  const h = img.height;
  for (let i = 0; i < d.length; i += 4) {
    const x = (i / 4) % w;
    const y = Math.floor(i / 4 / w);
    let r = (d[i] - 128) * g.contrast + 128 + g.lift + g.warmth;
    let gr = (d[i + 1] - 128) * g.contrast + 128 + g.lift;
    let b = (d[i + 2] - 128) * g.contrast + 128 + g.lift - g.warmth * 0.55;
    const luma = r * 0.3 + gr * 0.59 + b * 0.11;
    r = luma + (r - luma) * g.sat;
    gr = luma + (gr - luma) * g.sat;
    b = luma + (b - luma) * g.sat;
    const dx = x / w - 0.5;
    const dy = y / h - 0.5;
    const v = 1 - g.vignette * (dx * dx + dy * dy) * 2.8;
    d[i] = Math.max(0, Math.min(255, r * v));
    d[i + 1] = Math.max(0, Math.min(255, gr * v));
    d[i + 2] = Math.max(0, Math.min(255, b * v));
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.92);
}

function dimWarning(w: number, h: number): 'square' | 'wide' | 'low' | null {
  const ratio = w / Math.max(1, h);
  const min = Math.min(w, h);
  if (min < 280 && ratio > 0.82 && ratio < 1.22) return 'square';
  if (ratio > 1.75) return 'wide';
  if (min < 220) return 'low';
  return null;
}

export function PhotoBooth({
  photo,
  enhanced,
  onChange,
  photoStyle = 'natural',
  onStyleChange,
}: {
  photo: string | null;
  enhanced: boolean;
  onChange: (photo: string | null, enhanced: boolean) => void;
  photoStyle?: CvPhotoStyle;
  onStyleChange?: (style: CvPhotoStyle) => void;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const sourceRef = useRef<string | null>(photo);
  const lastOutRef = useRef<string | null>(photo);
  const preStyleRef = useRef<string | null>(photo);
  const [source, setSource] = useState<string | null>(photo);
  const [busy, setBusy] = useState<'crop' | 'enhance' | null>(null);
  const [focus, setFocus] = useState({ x: 0.5, y: 0.32 });
  const [warn, setWarn] = useState<'square' | 'wide' | 'low' | null>(null);

  useEffect(() => {
    if (!photo) {
      sourceRef.current = null;
      lastOutRef.current = null;
      preStyleRef.current = null;
      setSource(null);
      setFocus({ x: 0.5, y: 0.32 });
      return;
    }
    if (photo !== lastOutRef.current) {
      sourceRef.current = photo;
      lastOutRef.current = photo;
      if (!preStyleRef.current) preStyleRef.current = photo;
      setSource(photo);
    }
  }, [photo]);

  useEffect(() => {
    if (!source) {
      setWarn(null);
      return;
    }
    let cancelled = false;
    loadImage(source)
      .then((img) => {
        if (!cancelled) setWarn(dimWarning(img.width, img.height));
      })
      .catch(() => {
        if (!cancelled) setWarn(null);
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  const applyCrop = async (src: string, fx: number, fy: number, isEnhanced: boolean) => {
    const next = await cropToHeadshot(src, fx, fy);
    preStyleRef.current = next;
    lastOutRef.current = next;
    onChange(next, isEnhanced);
  };

  const pick = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      sourceRef.current = dataUrl;
      setSource(dataUrl);
      const fx = 0.5;
      const fy = 0.32;
      setFocus({ x: fx, y: fy });
      setBusy('crop');
      try {
        await applyCrop(dataUrl, fx, fy, false);
      } catch {
        lastOutRef.current = dataUrl;
        onChange(dataUrl, false);
      } finally {
        setBusy(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const onThumbClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!photo) {
      inputRef.current?.click();
      return;
    }
    const src = sourceRef.current || photo;
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const fy = clamp((e.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    setFocus({ x: fx, y: fy });
    setBusy('crop');
    try {
      await applyCrop(src, fx, fy, enhanced);
    } catch {
      /* remote photos may taint canvas — keep displayed photo */
    } finally {
      setBusy(null);
    }
  };

  const applyStyle = async (style: CvPhotoStyle) => {
    const src = preStyleRef.current || sourceRef.current || photo;
    onStyleChange?.(style);
    if (!src || !enhanced) return;
    if (style === 'natural') {
      lastOutRef.current = src;
      onChange(src, true);
      return;
    }
    setBusy('enhance');
    try {
      const graded = await gradePhotoStyle(src, style);
      lastOutRef.current = graded;
      onChange(graded, true);
    } catch {
      /* keep current pixels if canvas is tainted */
    } finally {
      setBusy(null);
    }
  };

  const enhance = async () => {
    const src = sourceRef.current || photo;
    if (!src) return;
    setBusy('enhance');
    try {
      const graded = await enhanceHeadshot(src);
      sourceRef.current = graded;
      preStyleRef.current = graded;
      setSource(graded);
      let next = await cropToHeadshot(graded, focus.x, focus.y);
      preStyleRef.current = next;
      if (photoStyle && photoStyle !== 'natural') {
        next = await gradePhotoStyle(next, photoStyle);
      }
      lastOutRef.current = next;
      onChange(next, true);
    } catch {
      /* CORS / tainted canvas — do not invent a processed photo */
    } finally {
      setBusy(null);
    }
  };

  const preview = source || photo;

  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 space-y-1">
        <button
          type="button"
          onClick={onThumbClick}
          className={`relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#c4a35a]/40 bg-black/30 ${
            photo ? 'cursor-crosshair' : ''
          }`}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt={t('cv.photo.alt')}
                className="h-full w-full object-cover"
                style={{ objectPosition: `${focus.x * 100}% ${focus.y * 100}%` }}
              />
              <span
                className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#c4a35a] bg-white/25"
                style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }}
              />
            </>
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#c4a35a]">
              <ImagePlus className="h-6 w-6" />
              <span className="text-[9px] font-black">{t('cv.photo.attach')}</span>
            </span>
          )}
        </button>
        {photo ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="block w-full text-center text-[9px] font-bold text-white/40 hover:text-[#e8c36a]"
          >
            {t('cv.photo.change')}
          </button>
        ) : null}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-[11px] font-black text-[#f3ead8]">{t('cv.photo.title')}</p>
        <p className="text-[10px] leading-relaxed text-white/45">
          {t('cv.photo.hint')}
          {photo ? ` ${t('cv.photo.hintCrop')}` : ''}
        </p>
        {warn ? <p className="text-[10px] leading-relaxed text-amber-300/90">{t(`cv.photo.${warn}`)}</p> : null}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={!photo || !!busy}
            onClick={enhance}
            className="inline-flex items-center gap-1 rounded-lg bg-[#c4a35a] px-2.5 py-1 text-[10px] font-black text-[#1a140c] disabled:opacity-40"
          >
            <Sparkles className="h-3 w-3" />
            {busy === 'enhance' ? t('cv.photo.enhancing') : enhanced ? t('cv.photo.enhanced') : t('cv.photo.enhance')}
          </button>
          {enhanced && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
              <Check className="h-3 w-3" /> {t('cv.photo.ready')}
            </span>
          )}
          {photo && (
            <button
              type="button"
              onClick={() => {
                sourceRef.current = null;
                lastOutRef.current = null;
                preStyleRef.current = null;
                setSource(null);
                setWarn(null);
                onStyleChange?.('natural');
                onChange(null, false);
              }}
              className="inline-flex items-center gap-1 text-[10px] text-white/40"
            >
              <Trash2 className="h-3 w-3" /> {t('cv.photo.remove')}
            </button>
          )}
        </div>
        {enhanced && photo ? (
          <div className="space-y-1">
            <p className="text-[9px] leading-relaxed text-white/45">{t('cv.photo.light')}</p>
            <div className="flex flex-wrap gap-1">
              {PHOTO_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={!!busy}
                  onClick={() => applyStyle(s.id)}
                  className={`rounded-lg border px-2 py-0.5 text-[9px] font-black ${
                    photoStyle === s.id
                      ? 'border-[#c4a35a] bg-[#c4a35a]/20 text-white'
                      : 'border-white/10 text-white/55'
                  }`}
                >
                  {t(`cv.photoStyle.${s.id}`)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <p className="text-[9px] text-white/30">{t('cv.photo.local')}</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
