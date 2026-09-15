import { GoogleGenAI } from '@google/genai';
import { buildDesignerInstruction } from './councilOfMinds';
import { OUTPUT_TOKEN_LIMITS } from './modelRegistry';
import { chromiumSemaphore } from './pdf-engine';
import { INFOGRAPHIC_THEMES, InfographicThemeConfig, InfographicThemeKey } from '../data/infographicThemes';

export { INFOGRAPHIC_THEMES, type InfographicThemeConfig, type InfographicThemeKey };

export interface InfographicStatBlock {
  type: 'stat_highlight';
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export interface InfographicBarComparisonBlock {
  type: 'bar_comparison';
  items: Array<{ label: string; value: number; color?: string }>;
  unit?: string;
}

export interface InfographicDonutBlock {
  type: 'donut';
  segments: Array<{ label: string; value: number; colorHint?: string }>;
}

export interface InfographicTimelineBlock {
  type: 'timeline_step';
  steps: Array<{ title: string; description: string; tag?: string }>;
}

export interface InfographicTextBlock {
  type: 'text_block';
  heading: string;
  body: string;
}

export type InfographicBlock =
  | InfographicStatBlock
  | InfographicBarComparisonBlock
  | InfographicDonutBlock
  | InfographicTimelineBlock
  | InfographicTextBlock;

export interface InfographicSpec {
  title: string;
  subtitle?: string;
  layoutStyle: 'stats_grid' | 'comparison' | 'timeline' | 'process_steps' | 'market_share' | 'before_after' | 'mixed';
  theme?: string;
  colorPalette?: string[];
  brandContext?: { colors?: string[]; brandName?: string; entityType?: string; theme?: string };
  blocks: InfographicBlock[];
  sources?: Array<{ title?: string; uri?: string }>;
}

/**
 * Heuristic to detect if the prompt plausibly needs live/external web research facts.
 */
export function needsWebGroundingForInfographic(promptText: string): boolean {
  if (!promptText) return false;
  const lower = promptText.toLowerCase();
  const searchKeywords = [
    'تريند', 'أحدث', 'سوق', 'مقارنة', 'منافس', 'أسعار', 'أرقام', 'إحصائيات',
    'trend', 'latest', 'current', '2026', '2025', 'market', 'stats', 'statistics', 'vs'
  ];
  return searchKeywords.some(kw => lower.includes(kw));
}

/**
 * Resolves theme configuration for rendering.
 */
function getResolvedTheme(spec: InfographicSpec): InfographicThemeConfig {
  const themeKey = spec.theme || spec.brandContext?.theme || 'naje_auto_blend';
  const matched = INFOGRAPHIC_THEMES[themeKey] || INFOGRAPHIC_THEMES.naje_auto_blend;

  if (spec.colorPalette && spec.colorPalette.length > 0) {
    return {
      ...matched,
      accentColor: spec.colorPalette[0] || matched.accentColor,
      chartPalette: [...spec.colorPalette, ...matched.chartPalette],
    };
  }
  return matched;
}

/**
 * Renders a single stat highlight card.
 */
function renderStatHighlightBlock(block: InfographicStatBlock, theme: InfographicThemeConfig): string {
  const trendIcon = block.trend === 'up' ? '▲' : block.trend === 'down' ? '▼' : '•';
  const trendColor = block.trend === 'up' ? '#10b981' : block.trend === 'down' ? '#ef4444' : theme.textMuted;
  const valColor = block.color || theme.accentColor;

  return `
    <div style="background: ${theme.cardBg}; border-radius: 20px; padding: 24px 20px; text-align: center; border: 1px solid ${theme.cardBorder}; box-shadow: ${theme.cardShadow}; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <div style="font-size: 42px; font-weight: 900; color: ${valColor}; font-family: 'Cairo', sans-serif; line-height: 1.1; letter-spacing: -0.5px;">${block.value}</div>
      <div style="font-size: 14px; font-weight: 600; color: ${theme.textColor}; margin-top: 8px; line-height: 1.4;">${block.label}</div>
      ${block.trend ? `<div style="color: ${trendColor}; font-size: 12px; font-weight: 700; margin-top: 6px; display: inline-flex; align-items: center; gap: 4px; background: ${theme.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.3)'}; padding: 2px 10px; border-radius: 12px;">${trendIcon} ${block.trend === 'up' ? 'نمو / ارتفاع' : block.trend === 'down' ? 'تراجع' : 'مستقر'}</div>` : ''}
    </div>`;
}

/**
 * Renders a horizontal bar comparison block.
 */
function renderBarComparisonBlock(block: InfographicBarComparisonBlock, theme: InfographicThemeConfig): string {
  const maxVal = Math.max(...block.items.map(i => i.value), 1);
  const colors = theme.chartPalette;

  const rowsHtml = block.items.map((item, idx) => {
    const pct = Math.min(100, Math.max(8, Math.round((item.value / maxVal) * 100)));
    const color = item.color || colors[idx % colors.length];
    return `
      <div style="margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 13px; font-weight: 600;">
          <span style="color: ${theme.textColor};">${item.label}</span>
          <span style="color: ${theme.accentColor}; font-family: monospace; font-size: 14px; font-weight: 700;">${item.value} ${block.unit || ''}</span>
        </div>
        <div style="height: 12px; background: ${theme.isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}; border-radius: 6px; overflow: hidden; border: 1px solid ${theme.isLight ? '#cbd5e1' : 'rgba(255,255,255,0.08)'}; padding: 1px;">
          <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, ${color}, ${theme.accentColor}); border-radius: 5px; box-shadow: 0 0 8px ${color}55;"></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="background: ${theme.cardBg}; border-radius: 20px; padding: 22px 24px; border: 1px solid ${theme.cardBorder}; box-shadow: ${theme.cardShadow};">
      <div style="font-size: 16px; font-weight: 700; color: ${theme.textColor}; margin-bottom: 16px; border-bottom: 1px solid ${theme.isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}; padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        مقارنة المؤشرات
      </div>
      ${rowsHtml}
    </div>`;
}

/**
 * Renders an SVG Donut Chart block with circular breakdown and legend.
 */
function renderDonutBlock(block: InfographicDonutBlock, theme: InfographicThemeConfig): string {
  const total = block.segments.reduce((acc, s) => acc + (s.value || 0), 0) || 1;
  const palette = theme.chartPalette;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const circlesHtml = block.segments.map((seg, idx) => {
    const fraction = (seg.value || 0) / total;
    const strokeDash = fraction * circumference;
    const strokeOffset = circumference - (cumulativePercent * circumference);
    cumulativePercent += fraction;
    const color = seg.colorHint || palette[idx % palette.length];

    return `
      <circle
        cx="80"
        cy="80"
        r="${radius}"
        fill="transparent"
        stroke="${color}"
        stroke-width="22"
        stroke-dasharray="${strokeDash} ${circumference}"
        stroke-dashoffset="${strokeOffset}"
        stroke-linecap="butt"
      />
    `;
  }).join('');

  const legendHtml = block.segments.map((seg, idx) => {
    const pct = Math.round(((seg.value || 0) / total) * 100);
    const color = seg.colorHint || palette[idx % palette.length];
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="width: 10px; height: 10px; border-radius: 3px; background: ${color}; display: inline-block;"></span>
          <span style="color: ${theme.textColor}; font-weight: 500;">${seg.label}</span>
        </div>
        <span style="color: ${theme.accentColor}; font-family: monospace; font-weight: 700;">${pct}%</span>
      </div>
    `;
  }).join('');

  return `
    <div style="background: ${theme.cardBg}; border-radius: 20px; padding: 22px 24px; border: 1px solid ${theme.cardBorder}; box-shadow: ${theme.cardShadow}; display: grid; grid-template-columns: 160px 1fr; gap: 16px; align-items: center;">
      <div style="display: flex; justify-content: center; position: relative;">
        <svg width="160" height="160" viewBox="0 0 160 160" style="transform: rotate(-90deg);">
          ${circlesHtml}
        </svg>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
          <div style="font-size: 10px; color: ${theme.textMuted}; font-weight: 600;">الإجمالي</div>
          <div style="font-size: 15px; font-weight: 800; color: ${theme.textColor}; font-family: monospace;">100%</div>
        </div>
      </div>
      <div>
        <div style="font-size: 15px; font-weight: 700; color: ${theme.textColor}; margin-bottom: 12px; border-bottom: 1px solid ${theme.isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}; padding-bottom: 5px;">
          التوزيع النسبي
        </div>
        ${legendHtml}
      </div>
    </div>`;
}

/**
 * Renders a step / timeline block.
 */
function renderTimelineBlock(block: InfographicTimelineBlock, theme: InfographicThemeConfig): string {
  const stepsHtml = block.steps.map((step, idx) => {
    return `
      <div style="display: flex; gap: 14px; margin-bottom: 14px; position: relative;">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, ${theme.accentColor}, ${theme.secondaryAccent}); color: #0f172a; font-weight: 900; font-size: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px ${theme.accentColor}66; z-index: 2;">
            ${idx + 1}
          </div>
          ${idx < block.steps.length - 1 ? `<div style="width: 2px; flex: 1; background: ${theme.isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)'}; margin-top: 4px; min-height: 20px;"></div>` : ''}
        </div>
        <div style="flex: 1; background: ${theme.isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)'}; border-radius: 12px; padding: 10px 14px; border: 1px solid ${theme.isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 14px; font-weight: 700; color: ${theme.accentColor};">${step.title}</div>
            ${step.tag ? `<span style="font-size: 10px; background: ${theme.badgeBg}; color: ${theme.badgeText}; padding: 2px 8px; border-radius: 6px; font-weight: 600;">${step.tag}</span>` : ''}
          </div>
          <div style="font-size: 12px; color: ${theme.textColor}; opacity: 0.9; margin-top: 4px; line-height: 1.5;">${step.description}</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="background: ${theme.cardBg}; border-radius: 20px; padding: 22px 24px; border: 1px solid ${theme.cardBorder}; box-shadow: ${theme.cardShadow};">
      <div style="font-size: 16px; font-weight: 700; color: ${theme.textColor}; margin-bottom: 16px; border-bottom: 1px solid ${theme.isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}; padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        المراحل والتسلسل
      </div>
      ${stepsHtml}
    </div>`;
}

/**
 * Renders a stylized text block.
 */
function renderTextBlock(block: InfographicTextBlock, theme: InfographicThemeConfig): string {
  return `
    <div style="background: ${theme.cardBg}; border-radius: 20px; padding: 20px 24px; border-left: 4px solid ${theme.accentColor}; border-top: 1px solid ${theme.cardBorder}; border-right: 1px solid ${theme.cardBorder}; border-bottom: 1px solid ${theme.cardBorder}; box-shadow: ${theme.cardShadow};">
      <div style="font-size: 15px; font-weight: 800; color: ${theme.accentColor}; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
        ${block.heading}
      </div>
      <div style="font-size: 13px; color: ${theme.textColor}; line-height: 1.6; font-weight: 400;">
        ${block.body}
      </div>
    </div>`;
}

/**
 * Assembles the full self-contained HTML document for Puppeteer.
 */
export function assembleInfographicHTML(spec: InfographicSpec): string {
  const theme = getResolvedTheme(spec);
  const statBlocks = spec.blocks.filter(b => b.type === 'stat_highlight') as InfographicStatBlock[];
  const otherBlocks = spec.blocks.filter(b => b.type !== 'stat_highlight');

  let statsGridHtml = '';
  if (statBlocks.length > 0) {
    const colCount = Math.min(statBlocks.length, spec.layoutStyle === 'mixed' ? 2 : 3);
    statsGridHtml = `
      <div style="display: grid; grid-template-columns: repeat(${colCount}, 1fr); gap: 16px; margin-bottom: 20px;">
        ${statBlocks.map(b => renderStatHighlightBlock(b, theme)).join('')}
      </div>
    `;
  }

  let bodyBlocksHtml = '';

  if (spec.layoutStyle === 'mixed' && otherBlocks.length >= 2) {
    // Render mixed layout with smart 2-column or split arrangement
    const firstHalf = otherBlocks.slice(0, 2);
    const remaining = otherBlocks.slice(2);

    bodyBlocksHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        ${firstHalf.map(b => {
          if (b.type === 'bar_comparison') return renderBarComparisonBlock(b, theme);
          if (b.type === 'donut') return renderDonutBlock(b, theme);
          if (b.type === 'timeline_step') return renderTimelineBlock(b, theme);
          if (b.type === 'text_block') return renderTextBlock(b, theme);
          return '';
        }).join('')}
      </div>
      ${remaining.map(b => {
        if (b.type === 'bar_comparison') return renderBarComparisonBlock(b, theme);
        if (b.type === 'donut') return renderDonutBlock(b, theme);
        if (b.type === 'timeline_step') return renderTimelineBlock(b, theme);
        if (b.type === 'text_block') return renderTextBlock(b, theme);
        return '';
      }).join('<div style="height: 16px;"></div>')}
    `;
  } else {
    bodyBlocksHtml = otherBlocks.map(b => {
      if (b.type === 'bar_comparison') return renderBarComparisonBlock(b, theme);
      if (b.type === 'donut') return renderDonutBlock(b, theme);
      if (b.type === 'timeline_step') return renderTimelineBlock(b, theme);
      if (b.type === 'text_block') return renderTextBlock(b, theme);
      return '';
    }).join('<div style="height: 16px;"></div>');
  }

  let sourcesHtml = '';
  if (spec.sources && spec.sources.length > 0) {
    sourcesHtml = `
      <div style="margin-top: 24px; padding-top: 14px; border-top: 1px dashed ${theme.isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)'}; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; font-size: 11px; color: ${theme.textMuted};">
        <span style="font-weight: 700; color: ${theme.textColor};">المصادر المعتمدة:</span>
        ${spec.sources.map(s => `
          <a href="${s.uri || '#'}" target="_blank" style="color: ${theme.accentColor}; text-decoration: none; background: ${theme.badgeBg}; padding: 2px 8px; border-radius: 6px; border: 1px solid ${theme.badgeBorder}; font-weight: 600;">
            ${s.title || s.uri || 'مصدر'}
          </a>
        `).join('')}
      </div>
    `;
  }

  const brandName = spec.brandContext?.brandName || 'Naje AI • المصمم';

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Cairo', 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${theme.bodyBg};
      color: ${theme.textColor};
      width: 1080px;
      min-height: 1080px;
      padding: 44px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      text-align: center;
      margin-bottom: 28px;
      position: relative;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: ${theme.badgeBg};
      border: 1px solid ${theme.badgeBorder};
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      color: ${theme.badgeText};
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .title {
      font-size: 36px;
      font-weight: 900;
      line-height: 1.25;
      background: ${theme.titleGradient};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 15px;
      color: ${theme.textMuted};
      font-weight: 500;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.5;
    }
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .footer {
      margin-top: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: ${theme.textMuted};
      border-top: 1px solid ${theme.isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'};
      padding-top: 14px;
    }
    .brand-mark {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      color: ${theme.textColor};
    }
    .brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${theme.accentColor};
      box-shadow: 0 0 8px ${theme.accentColor};
    }
  </style>
</head>
<body>
  <div>
    <div class="header">
      <div class="header-badge">
        إنفوجرافيك بيانات احترافي • ${theme.nameAr}
      </div>
      <h1 class="title">${spec.title}</h1>
      ${spec.subtitle ? `<p class="subtitle">${spec.subtitle}</p>` : ''}
    </div>

    <div class="content-area">
      ${statsGridHtml}
      ${bodyBlocksHtml}
      ${sourcesHtml}
    </div>
  </div>

  <div class="footer">
    <div class="brand-mark">
      <span class="brand-dot"></span>
      <span>${brandName}</span>
    </div>
    <div>تم الإنشاء والتصميم بواسطة مجلس عقول ناجي — المصمم</div>
  </div>
</body>
</html>`;
}

/**
 * Puppeteer Headless Renderer for Infographics.
 * Emits both high-resolution PNG screenshot and vector PDF from the same rendered page.
 */
export async function renderInfographic(spec: InfographicSpec): Promise<{ pngBase64: string; pdfBase64: string; html: string }> {
  const html = assembleInfographicHTML(spec);
  
  await chromiumSemaphore.acquire();
  let browser: any = null;
  try {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = (await import('puppeteer-core')).default;

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    await page.emulateMediaType('screen');

    const pngBuffer = await page.screenshot({ type: 'png', fullPage: true });
    const pdfBuffer = await page.pdf({
      width: '1080px',
      height: '1080px',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    return {
      pngBase64: Buffer.from(pngBuffer).toString('base64'),
      pdfBase64: Buffer.from(pdfBuffer).toString('base64'),
      html
    };
  } finally {
    if (browser) await browser.close();
    chromiumSemaphore.release();
  }
}

/**
 * Two-stage Infographic Generation Pipeline:
 * 1. Optional Web Search Grounding (gemini-3.5-flash-lite + googleSearch)
 * 2. Structuring call (gemini-3.5-flash-lite + Designer system instruction)
 */
export async function generateInfographicSpec(
  ai: any,
  rawPrompt: string,
  brandContext?: any
): Promise<{ spec: InfographicSpec; sources: Array<{ title?: string; uri?: string }>; groundingTokens?: any; structuringTokens?: any }> {
  let groundedFacts = '';
  const sources: Array<{ title?: string; uri?: string }> = [];
  let groundingTokens: any = null;

  // 1. Grounding Call (if needed)
  if (needsWebGroundingForInfographic(rawPrompt)) {
    try {
      const searchRes = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [{
              text: `أنت باحث بيانات دقيق. استخرج أهم الأرقام والإحصائيات والمعلومات الحالية الدقيقة للطلب التالي لإنشاء إنفوجرافيك مقارنة أو إحصاءات:
الطلب: "${rawPrompt}"
سياق العلامة والثيم: ${JSON.stringify(brandContext || {})}`
            }]
          }
        ],
        config: {
          tools: [{ googleSearch: {} }],
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.webGrounding,
          temperature: 0.2
        }
      });

      groundedFacts = searchRes.text || '';
      groundingTokens = searchRes.usageMetadata;

      const chunks = searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || chunk.web.uri,
            uri: chunk.web.uri
          });
        }
      });
    } catch (gErr) {
      console.warn('[Infographic] Grounding search fallback:', gErr);
    }
  }

  // 2. Structuring Call
  const systemInstruction = buildDesignerInstruction();
  const structuringPrompt = `حول هذا المحتوى والطلب إلى هيكل إنفوجرافيك بصري محكم (InfographicSpec).
الطلب الأصلي: "${rawPrompt}"
${groundedFacts ? `الحقائق والإحصائيات الموثقة:\n"""${groundedFacts}"""` : ''}
سياق العلامة والثيم المطلوب: ${JSON.stringify(brandContext || {})}

قواعد التصميم:
1. اختر layoutStyle الأنسب: 'stats_grid' | 'comparison' | 'timeline' | 'process_steps' | 'market_share' | 'before_after' | 'mixed'.
   - إذا طلب المستخدم الدمج أو ترك الأمر لك، اختر 'mixed' وادمج بذكاء بين الأرقام البارزة والمقارنات والمخطط الدائري أو الخطوات.
2. اختر أو أكد الـ theme الأنسب: 'dark_luxury_gold' | 'cyber_neon' | 'ocean_blue' | 'forest_emerald' | 'sunset_coral' | 'royal_purple' | 'minimal_light' | 'naje_auto_blend' بناءً على سياق الطلب والألوان المطلوبة.
3. قسّم المحتوى إلى 3-6 كتل بصرية (blocks) متنوعة وموجزة (أرقام بارزة stat_highlight، مقارنة أعمدة bar_comparison، توزيع نسبي donut، خطوات timeline_step، ملاحظة هامة text_block).
4. اجعل العناوين والأرقام حاسمة ومباشرة. لا تضع فقرات طويلة.

أخرج JSON مطابق تماماً للهيكل التالي:
{
  "title": "عنوان الإنفوجرافيك الرئيسي",
  "subtitle": "وصف فرعي موجز ومحفز",
  "layoutStyle": "stats_grid" | "comparison" | "timeline" | "process_steps" | "market_share" | "before_after" | "mixed",
  "theme": "dark_luxury_gold" | "cyber_neon" | "ocean_blue" | "forest_emerald" | "sunset_coral" | "royal_purple" | "minimal_light" | "naje_auto_blend",
  "blocks": [
    { "type": "stat_highlight", "value": "85%", "label": "نسبة الرضا", "trend": "up" },
    { "type": "bar_comparison", "items": [{ "label": "العنصر الأول", "value": 120 }, { "label": "العنصر الثاني", "value": 85 }], "unit": "ألف" },
    { "type": "donut", "segments": [{ "label": "الخيار أ", "value": 45 }, { "label": "الخيار ب", "value": 55 }] },
    { "type": "timeline_step", "steps": [{ "title": "المرحلة الأولى", "description": "شرح موجز جداً" }] },
    { "type": "text_block", "heading": "نقطة تحول", "body": "خلاصة مكثفة" }
  ]
}`;

  const res = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [{ role: 'user', parts: [{ text: structuringPrompt }] }],
    config: {
      systemInstruction,
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.agentPlan,
      responseMimeType: 'application/json',
      temperature: 0.3
    }
  });

  const structuringTokens = res.usageMetadata;
  let parsedSpec: InfographicSpec;
  try {
    parsedSpec = JSON.parse(res.text || '{}');
  } catch {
    parsedSpec = {
      title: 'إنفوجرافيك بيانات',
      layoutStyle: 'stats_grid',
      theme: brandContext?.theme || 'naje_auto_blend',
      blocks: [
        { type: 'stat_highlight', value: '100%', label: 'اكتمال المعالجة', trend: 'up' },
        { type: 'text_block', heading: 'ملخص', body: rawPrompt }
      ]
    };
  }

  if (brandContext?.theme && (!parsedSpec.theme || parsedSpec.theme === 'naje_auto_blend')) {
    parsedSpec.theme = brandContext.theme;
  }

  parsedSpec.sources = sources;
  parsedSpec.brandContext = brandContext;

  return {
    spec: parsedSpec,
    sources,
    groundingTokens,
    structuringTokens
  };
}

/**
 * Edit / Iterate on an existing InfographicSpec.
 */
export async function editInfographicSpec(
  ai: any,
  originalSpec: InfographicSpec,
  editInstruction: string,
  brandContext?: any
): Promise<{ spec: InfographicSpec; structuringTokens?: any }> {
  const systemInstruction = buildDesignerInstruction();
  const editPrompt = `أنت تقوم بتعديل إنفوجرافيك حالي وفق تعليمات المستخدم.
الهيكل الحالي:
${JSON.stringify(originalSpec, null, 2)}

تعليمات التعديل المطلوبة من المستخدم:
"${editInstruction}"
سياق العلامة والثيم: ${JSON.stringify(brandContext || {})}

قم بتطبيق التعديلات بدقة متناهية مع الحفاظ على بقية العناصر المتناسقة. يمكنك تغيير الـ theme أو layoutStyle أو إضافة/تعديل كتل blocks. أخرج الـ JSON الجديد المحدث بالكامل.`;

  const res = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [{ role: 'user', parts: [{ text: editPrompt }] }],
    config: {
      systemInstruction,
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.agentPlan,
      responseMimeType: 'application/json',
      temperature: 0.3
    }
  });

  let parsedSpec: InfographicSpec;
  try {
    parsedSpec = JSON.parse(res.text || '{}');
  } catch {
    parsedSpec = originalSpec;
  }

  if (!parsedSpec.sources) parsedSpec.sources = originalSpec.sources;
  if (!parsedSpec.brandContext) parsedSpec.brandContext = brandContext || originalSpec.brandContext;
  if (brandContext?.theme && parsedSpec.theme === originalSpec.theme) {
    parsedSpec.theme = brandContext.theme;
  }

  return {
    spec: parsedSpec,
    structuringTokens: res.usageMetadata
  };
}
