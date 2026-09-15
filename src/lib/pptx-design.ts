import { isArabic } from './naje-engine';

// PPTXGENJS HARD RULES — violating any of these corrupts the file or silently drops output.
// 1. Hex colors: no "#", no 8-digit alpha hex. "D4AF37" is valid. "#D4AF37" and "D4AF3780" corrupt the file.
//    For translucency use `transparency: 0-100` on fills/images, `opacity: 0.0-1.0` on shadows. Each is
//    silently ignored on the other.
// 2. pptxgenjs MUTATES option objects in place (converts to EMU on first use). NEVER share one options
//    object across two add* calls. Build a fresh object literal every time. This is why every helper
//    below returns a new object instead of a module-level constant.
// 3. Shadow `offset` must be >= 0. A negative offset corrupts the file. To cast a shadow upward use
//    `angle: 270` with a positive offset.
// 4. `letterSpacing` is silently ignored. The real option is `charSpacing`.
// 5. `rectRadius` only works on 'roundRect', never on 'rect'.
// 6. Gradient fills are NOT supported. Fake depth with a solid shape at low `transparency`, never a gradient.
// 7. Text boxes have built-in internal padding. Set `margin: 0` whenever text must align with a shape,
//    line, or icon at the same x.
// 8. Bulleted lists: `bullet: true` on each item, never a literal "•" (renders a double bullet).
//    Set `breakLine: true` on every array item EXCEPT the last. Space them with `paraSpaceAfter`,
//    NOT `lineSpacing` (which produces huge gaps).
// 9. Speaker notes go in `slide.addNotes("...")` only — never in a text box on the slide.
// 10. On a stacked bar/column chart, `dataLabelPosition` must be 'ctr', 'inEnd' or 'inBase'.
//     'outEnd' corrupts the file. On clustered/non-stacked charts 'outEnd' is fine.
// 11. A combo series using secondaryValAxis/secondaryCatAxis requires BOTH `valAxes` and `catAxes`
//     on the chart options, two entries each. Supplying only valAxes makes PowerPoint discard the chart
//     and report the file as corrupt.

export interface DeckPalette {
  bg: string; bgAlt: string; card: string; card2: string;
  accent: string; accent2: string; text: string; muted: string; faint: string;
}

export const DARK_LUXE: DeckPalette = {
  bg: "0E0F13", bgAlt: "141620", card: "1B1D28", card2: "232634",
  accent: "D4AF37", accent2: "8B5CF6",
  text: "F4F4F7", muted: "9EA0B0", faint: "6B6D7C",
};

export const LIGHT_EDITORIAL: DeckPalette = {
  bg: "FFFFFF", bgAlt: "F5F6F8", card: "F0F1F4", card2: "E6E8ED",
  accent: "1F3A93", accent2: "C2410C",
  text: "12141A", muted: "555A66", faint: "8A8F9C",
};

export function textOpts(str: string, base: any) {
  const rtl = isArabic(str);
  return { ...base, rtlMode: rtl, align: base.align ?? (rtl ? 'right' : 'left') };
}

export function pixelMotif(slide: any, x: number, y: number, cols: number, rows: number,
                           size: number, gap: number, color: string, transparency: number) {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if ((i * 7 + j * 3) % 4 === 0) continue;             // deterministic sparse pattern, not random
      slide.addShape("rect", {
        x: x + i * (size + gap), y: y + j * (size + gap), w: size, h: size,
        fill: { color, transparency: transparency + ((i + j) % 3) * 12 },
        line: { type: "none" },
      });                                                   // fresh object literal every iteration — see rule 2
    }
  }
}

export function card(slide: any, o: {x:number;y:number;w:number;h:number;fill:string;r?:number}) {
  slide.addShape("roundRect", {
    x: o.x, y: o.y, w: o.w, h: o.h, rectRadius: o.r ?? 0.12,
    fill: { color: o.fill }, line: { type: "none" },
  });
}

export function badge(slide: any, x: number, y: number, d: number,
                      label: string, fill: string, txtColor: string, transparency = 0) {
  slide.addShape("ellipse", { x, y, w: d, h: d, fill: { color: fill, transparency }, line: { type: "none" } });
  if (label) {
    slide.addText(label, textOpts(label, {
      x, y, w: d, h: d, align: "center", valign: "middle",
      fontSize: 14, bold: true, color: txtColor, margin: 0,     // margin: 0 — see rule 7
    }));
  }
}

export function cardHeight(bodyText: string, cardW: number, fontSize: number): number {
  const charsPerLine = Math.floor((cardW - 0.6) * 96 / (fontSize * 0.52));
  const lines = Math.max(1, Math.ceil(bodyText.length / charsPerLine));
  return 1.10 + lines * (fontSize * 1.32 / 72);   // header block + body lines
}

export function fitFontSize(text: string, w: number, h: number,
                            desired: number, min: number): number {
  const isAr = isArabic(text);
  const ratio = isAr ? 0.52 * 1.15 : 0.52;
  
  for (let fs = desired; fs >= min; fs -= 0.5) {
    const charsPerLine = Math.floor(w * 96 / (fs * ratio));   
    const lines = Math.ceil(text.length / Math.max(1, charsPerLine));
    if (lines * (fs * 1.32 / 72) <= h - 0.08) return fs;      // 0.08" bottom safety
  }
  return min;
}

export function assertFits(text: string, w: number, h: number, desired: number, min: number): { text: string, fs: number } {
  const fs = fitFontSize(text, w, h, desired, min);
  const isAr = isArabic(text);
  const ratio = isAr ? 0.52 * 1.15 : 0.52;
  const charsPerLine = Math.floor(w * 96 / (fs * ratio));
  const maxLines = Math.floor((h - 0.08) / (fs * 1.32 / 72));
  const maxChars = maxLines * charsPerLine;

  if (fs === min && text.length > maxChars) {
     // truncate to maxChars at word boundary
     let truncated = text.slice(0, maxChars);
     const lastSpace = truncated.lastIndexOf(' ');
     if (lastSpace > 0) truncated = truncated.slice(0, lastSpace);
     return { text: truncated + '…', fs };
  }
  return { text, fs };
}

// Coordinate constants
export const COORDS = {
  WIDTH: 13.333,
  HEIGHT: 7.5,
  MARGIN: 0.6,
  USABLE_W: 12.133,
  USABLE_H: 6.3,
  TITLE_Y: 0.75,
  TITLE_H: 0.75,
  BODY_START: 1.85,
  EYEBROW_Y: 0.42,
  EYEBROW_H: 0.3,
  COLS: {
    C2_W: 5.92,
    C2_X: [0.60, 6.81],
    C3_W: 3.84,
    C3_X: [0.60, 4.74, 8.89],
    C4_W: 2.83,
    C4_X: [0.60, 3.73, 6.85, 9.98],
    C5_W: 2.23,
    C5_X: [0.60, 3.08, 5.56, 8.05, 10.53],
    FULL: 12.13,
    FULL_X: 0.60
  }
};
