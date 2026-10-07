import React from 'react';

export type DeckThemeInput = {
  background?: string;
  title?: string;
  text?: string;
  accent?: string;
};

type SlideCard = { title?: string; text?: string; iconKeyword?: string };
type SlideBar = { label?: string; value?: number; max?: number };

export type DeckSlide = {
  layoutTemplate?: string;
  eyebrow?: string;
  slideTitle?: string;
  slideSubtitle?: string;
  speakerNotes?: string;
  content?: {
    text?: string;
    bulletPoints?: unknown[];
    aiImagePrompt?: string;
    cards?: SlideCard[];
    stats?: { value?: string; label?: string };
    comparisons?: SlideBar[];
  };
  colors?: DeckThemeInput;
  theme?: DeckThemeInput;
};

const FONT = '"Segoe UI", Tahoma, "Noto Naskh Arabic", "Noto Sans Arabic", Arial, sans-serif';

function normalizeHex(input: unknown, fallback: string): string {
  const raw = String(input || '').trim();
  const hex = raw.startsWith('#') ? raw : raw ? `#${raw}` : '';
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toUpperCase();
  }
  return fallback;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function mixWhite(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => {
    const c = (n >> shift) & 255;
    return Math.round(c + (255 - c) * amount);
  };
  return `#${[ch(16), ch(8), ch(0)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function resolveDeckTheme(theme?: DeckThemeInput | null) {
  let accent = normalizeHex(theme?.accent, '#4F46E5');
  if (luminance(accent) > 0.78) accent = '#4F46E5';
  return {
    canvas: '#FFFFFF',
    ink: '#0F172A',
    muted: '#334155',
    faint: '#64748B',
    line: '#E2E8F0',
    card: '#F8FAFC',
    accent,
    soft: mixWhite(accent, 0.9),
    softer: mixWhite(accent, 0.82),
    good: '#047857',
    goodSoft: '#ECFDF5',
    goodLine: '#A7F3D0',
  };
}

function isRtl(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function asList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? '').trim()).filter(Boolean).slice(0, max);
}

function cardsOf(slide: DeckSlide): SlideCard[] {
  const cards = Array.isArray(slide.content?.cards) ? slide.content!.cards! : [];
  return cards
    .map((card) => ({
      title: String(card?.title || '').trim(),
      text: String(card?.text || '').trim(),
      iconKeyword: String(card?.iconKeyword || '').trim(),
    }))
    .filter((card) => card.title || card.text)
    .slice(0, 4);
}

function barsOf(slide: DeckSlide): { label: string; value: number; max: number }[] {
  const rows = Array.isArray(slide.content?.comparisons) ? slide.content!.comparisons! : [];
  return rows
    .map((row) => ({
      label: String(row?.label || '').trim(),
      value: Number(row?.value) || 0,
      max: Number(row?.max) || 100,
    }))
    .filter((row) => row.label)
    .slice(0, 5);
}

function Mark({ label, color }: { label: string; color: string }) {
  const letter = (label || 'N').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 1).toUpperCase() || 'N';
  return (
    <div style={{ width: 40, height: 40, borderRadius: 20, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
      {letter}
    </div>
  );
}

function Footer({ theme, note, index, total }: { theme: ReturnType<typeof resolveDeckTheme>; note?: string; index: number; total: number }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 52, borderTop: `1px solid ${theme.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 64px', fontSize: 15, color: theme.faint, background: '#fff' }}>
      <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 900 }}>{note || 'NAJE'}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{index + 1} / {total}</span>
    </div>
  );
}

export default function DeckSlideStage({
  slide,
  theme,
  index = 0,
  total = 1,
  deckTitle,
}: {
  slide: DeckSlide;
  theme?: DeckThemeInput | null;
  index?: number;
  total?: number;
  deckTitle?: string;
}) {
  const palette = resolveDeckTheme(theme || slide.colors || slide.theme);
  const title = String(slide.slideTitle || slide.content?.text || `شريحة ${index + 1}`);
  const subtitle = String(slide.slideSubtitle || '').trim();
  const eyebrow = String(slide.eyebrow || '').trim();
  const text = String(slide.content?.text || '').trim();
  const bullets = asList(slide.content?.bulletPoints, 6);
  const cards = cardsOf(slide);
  const bars = barsOf(slide);
  const stats = slide.content?.stats;
  const prompt = String(slide.content?.aiImagePrompt || '').trim();
  const rtl = isRtl([title, subtitle, text, ...bullets, ...cards.map((c) => c.title)].join(' '));
  const layoutIn = String(slide.layoutTemplate || 'bullet_list');
  let layout = layoutIn;
  if ((layout === 'three_cards' || layout === 'two_columns' || layout === 'icon_list') && cards.length < 2) {
    layout = bullets.length ? 'bullet_list' : bars.length ? 'comparison_bars' : 'bullet_list';
  }
  if (layout === 'comparison_bars' && !bars.length) layout = bullets.length ? 'bullet_list' : 'title_slide';
  if (layout === 'showcase' && !stats?.value && !text) layout = 'title_slide';

  const shell: React.CSSProperties = {
    width: 1280,
    height: 720,
    background: palette.canvas,
    color: palette.ink,
    fontFamily: FONT,
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    direction: rtl ? 'rtl' : 'ltr',
  };

  if (layout === 'full_background_image' || layout === 'title_slide') {
    const dark = layout === 'full_background_image';
    return (
      <div style={{ ...shell, background: dark ? '#0F172A' : '#FFFFFF', color: dark ? '#F8FAFC' : palette.ink }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: palette.accent }} />
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 96px 90px', boxSizing: 'border-box' }}>
          {eyebrow ? <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: rtl ? 0 : 3, color: palette.accent, marginBottom: 18 }}>{eyebrow}</div> : null}
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.12, maxWidth: 1000 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 28, fontWeight: 650, color: dark ? '#C4B5FD' : palette.accent, marginTop: 18, maxWidth: 880 }}>{subtitle}</div> : null}
          {text ? <div style={{ fontSize: 22, lineHeight: 1.5, color: dark ? '#CBD5E1' : palette.muted, marginTop: 22, maxWidth: 860 }}>{text}</div> : null}
        </div>
        <Footer theme={palette} note={deckTitle} index={index} total={total} />
      </div>
    );
  }

  const body = (() => {
    if (layout === 'showcase') {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 120, fontWeight: 800, color: palette.accent, lineHeight: 1 }}>{stats?.value || '—'}</div>
          <div style={{ fontSize: 32, fontWeight: 750, marginTop: 8 }}>{stats?.label || subtitle}</div>
          {text ? <div style={{ fontSize: 22, color: palette.muted, marginTop: 16, maxWidth: 760 }}>{text}</div> : null}
        </div>
      );
    }

    if (layout === 'comparison_bars' || layout === 'chart_column' || layout === 'chart_compare') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, height: '100%' }}>
          {bars.map((bar, i) => {
            const pct = Math.max(4, Math.min(100, (bar.value / (bar.max || 100)) * 100));
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 220, fontSize: 20, fontWeight: 700 }}>{bar.label}</div>
                <div style={{ flex: 1, height: 16, borderRadius: 999, background: '#EEF2FF', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: palette.accent }} />
                </div>
                <div style={{ width: 64, textAlign: 'center', fontSize: 20, fontWeight: 800 }}>{bar.value}</div>
              </div>
            );
          })}
        </div>
      );
    }

    if (layout === 'split_image_left' || layout === 'split_image_right') {
      const visual = (
        <div style={{ flex: 1, borderRadius: 28, background: `linear-gradient(160deg, ${palette.accent} 0%, #0F172A 78%)`, color: '#fff', padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, opacity: 0.8 }}>VISUAL</div>
          <div style={{ fontSize: 26, fontWeight: 750, lineHeight: 1.35, marginTop: 10 }}>{prompt || subtitle || title}</div>
        </div>
      );
      const copy = (
        <div style={{ flex: 1.15, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          {text ? <div style={{ fontSize: 24, lineHeight: 1.45, color: palette.muted, marginBottom: 18 }}>{text}</div> : null}
          {bullets.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 12, fontSize: 22, lineHeight: 1.35 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: palette.accent, marginTop: 10, flexShrink: 0 }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      );
      const flip = layout === 'split_image_left';
      return (
        <div style={{ display: 'flex', gap: 28, height: '100%', flexDirection: flip ? 'row-reverse' : 'row' }}>
          {copy}
          {visual}
        </div>
      );
    }

    if ((layout === 'three_cards' || layout === 'two_columns' || layout === 'icon_list') && cards.length >= 2) {
      const flow = cards.length >= 3 && layout !== 'two_columns';
      if (layout === 'two_columns') {
        return (
          <div style={{ display: 'flex', gap: 22, height: '100%', alignItems: 'stretch' }}>
            {cards.slice(0, 2).map((card, i) => {
              const tint = i === 1;
              return (
                <div key={i} style={{ flex: 1, borderRadius: 24, border: `1px solid ${tint ? palette.goodLine : palette.line}`, background: tint ? palette.goodSoft : palette.card, padding: '32px 28px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, color: tint ? palette.good : palette.faint }}>{card.iconKeyword || (i === 0 ? 'BEFORE' : 'NAJE')}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, marginTop: 12, lineHeight: 1.2 }}>{card.title}</div>
                  <div style={{ fontSize: 20, lineHeight: 1.45, color: palette.muted, marginTop: 14 }}>{card.text}</div>
                </div>
              );
            })}
          </div>
        );
      }
      return (
        <div style={{ display: 'flex', gap: flow ? 10 : 18, height: '100%', alignItems: 'stretch' }}>
          {cards.map((card, i) => (
            <React.Fragment key={i}>
              <div style={{ flex: 1, borderRadius: 22, border: `1px solid ${palette.line}`, background: '#fff', padding: '22px 18px', display: 'flex', flexDirection: 'column', minWidth: 0, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
                <Mark label={card.iconKeyword || card.title || String(i + 1)} color={palette.accent} />
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.6, color: palette.accent, marginTop: 16 }}>{card.iconKeyword || `0${i + 1}`}</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, lineHeight: 1.25 }}>{card.title}</div>
                <div style={{ fontSize: 16, lineHeight: 1.4, color: palette.muted, marginTop: 8 }}>{card.text}</div>
              </div>
              {flow && i < cards.length - 1 ? (
                <div style={{ display: 'flex', alignItems: 'center', color: palette.accent, fontSize: 28, fontWeight: 700, flexShrink: 0 }}>{rtl ? '‹' : '›'}</div>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      );
    }

    const lines = bullets.length ? bullets : (text ? [text] : (prompt ? [prompt] : []));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 16 }}>
        {lines.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', fontSize: 28, lineHeight: 1.35 }}>
            <span style={{ width: 12, height: 12, borderRadius: 99, background: palette.accent, marginTop: 12, flexShrink: 0 }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    );
  })();

  return (
    <div style={shell}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: palette.accent }} />
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '48px 64px 72px', display: 'flex', flexDirection: 'column' }}>
        {eyebrow ? <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: rtl ? 0 : 2.2, color: palette.accent, marginBottom: 8 }}>{eyebrow}</div> : null}
        <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, maxHeight: 110, overflow: 'hidden' }}>{title}</div>
        {subtitle ? <div style={{ fontSize: 20, fontWeight: 650, color: palette.accent, marginTop: 8 }}>{subtitle}</div> : null}
        <div style={{ flex: 1, minHeight: 0, marginTop: 26 }}>{body}</div>
      </div>
      <Footer theme={palette} note={deckTitle} index={index} total={total} />
    </div>
  );
}
