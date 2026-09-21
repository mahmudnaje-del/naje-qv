import React, { useRef, useState } from 'react';
import { Check, ImagePlus, Sparkles, Trash2 } from 'lucide-react';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Studio headshot: contrast, warm grade, cream backdrop if corners are uniform. */
export async function enhanceHeadshot(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const w = 720;
  const h = 900;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  const srcRatio = img.width / img.height;
  const dstRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (srcRatio > dstRatio) {
    sw = img.height * dstRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / dstRatio;
    sy = (img.height - sh) / 6;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
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

export function PhotoBooth({
  photo,
  enhanced,
  onChange,
}: {
  photo: string | null;
  enhanced: boolean;
  onChange: (photo: string | null, enhanced: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ''), false);
    reader.readAsDataURL(file);
  };

  const enhance = async () => {
    if (!photo) return;
    setBusy(true);
    try {
      const next = await enhanceHeadshot(photo);
      onChange(next, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#c4a35a]/40 bg-black/30"
      >
        {photo ? (
          <img src={photo} alt="صورة السيرة" className="h-full w-full object-cover object-top" />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#c4a35a]">
            <ImagePlus className="h-6 w-6" />
            <span className="text-[9px] font-black">أرفق</span>
          </span>
        )}
      </button>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-[11px] font-black text-[#f3ead8]">صورة مهنية</p>
        <p className="text-[10px] leading-relaxed text-white/45">
          رأس وأكتاف، خلفية سادة، لباس رسمي. السيلفي والصورة المنزلية تُرمى أسرع من السيرة نفسها.
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={!photo || busy}
            onClick={enhance}
            className="inline-flex items-center gap-1 rounded-lg bg-[#c4a35a] px-2.5 py-1 text-[10px] font-black text-[#1a140c] disabled:opacity-40"
          >
            <Sparkles className="h-3 w-3" />
            {busy ? 'يُحسّن…' : enhanced ? 'حُسّنت' : 'تحسين الاستوديو'}
          </button>
          {enhanced && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
              <Check className="h-3 w-3" /> جاهزة
            </span>
          )}
          {photo && (
            <button type="button" onClick={() => onChange(null, false)} className="inline-flex items-center gap-1 text-[10px] text-white/40">
              <Trash2 className="h-3 w-3" /> حذف
            </button>
          )}
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
