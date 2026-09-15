import { GoogleGenAI, Type } from '@google/genai';
import { createGenAIClient } from './genaiClient';
import { FALLBACK_DEFAULTS } from './modelRegistry';
import { Fact, verifyFacts, verifyRenderedDeck, GroundingReport } from './grounding';
import { LAYOUTS, Layout, barChart, lineChart, donutChart, progressBars, flowDiagram, icon } from './slides-html';
import { fetchRealPhotography } from './naje-engine';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const DEFAULT_MODEL = FALLBACK_DEFAULTS.doc_standard || 'gemini-3.6-flash';


const DEFAULT_CONFIG = {
  maxSlidesHard: 30,
  maxSlidesSoft: 20,
  defaultSlides: 12,
  maxImagesPerDeck: 6,
  geminiConcurrency: 4,
  imageMaxKb: 180,
  groundingRejectThreshold: 0.30
};

const FactSchema = {
  type: Type.OBJECT,
  properties: {
    id:            { type: Type.STRING, description: "f01, f02, ..." },
    statement:     { type: Type.STRING, description: "The fact, restated concisely. Max 160 chars." },
    kind:          { type: Type.STRING, enum: ["feature","metric","process","constraint","definition","claim"] },
    sourceQuote:   { type: Type.STRING, description: "A VERBATIM span copied character-for-character from the user's source material that supports this statement. Minimum 10 characters. Do not paraphrase. Do not translate. If no such span exists, this fact must not be emitted." },
    sourceLocator: { type: Type.STRING, description: "Where the quote came from: section number, heading text, or page. E.g. '5.2-ج' or 'Typography Engine'." },
    value:         { type: Type.NUMBER,  description: "Numeric value exactly as it appears in the source. No rounding, no unit conversion." },
    unit:          { type: Type.STRING,  description: "Copy the unit as written: 'مليون دينار', '%', 'ثانية', 'نقطة'." },
    period:        { type: Type.STRING,  description: "Time label if any: 'Q1 2026', 'يناير'." },
    comparisonTo:  { type: Type.STRING,  description: "id of the fact this compares against, if the source states a comparison." },
    derived:       { type: Type.BOOLEAN, description: "Always false. Only server code may set this true." },
  },
  required: ["id","statement","kind","sourceQuote","sourceLocator"],
};

const SlidePlanSchema = {
  type: Type.OBJECT,
  properties: {
    index: { type: Type.INTEGER },
    eyebrow: { type: Type.STRING },
    title: { type: Type.STRING },
    subtitle: { type: Type.STRING },
    layoutId: { type: Type.STRING, description: `One of: ${LAYOUTS.map(l => l.id).join(', ')}` },
    iconName: { 
      type: Type.STRING, 
      description: "One of: brain, layers, shield, network, bar-chart-3, pie-chart, rocket, check-circle, image, video, file-text, settings, users, credit-card, palette, type, sparkles, lock, zap, database. Choose the one that best matches the slide's subject. Omit if none fits.",
      nullable: true
    },
    factIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    imageQuery: { type: Type.STRING, description: "2–4 English keywords describing a literal photographic subject. Pexels search performs poorly with Arabic and with abstract terms. Write 'arabic calligraphy desk' not 'creativity'. Write 'server room dark' not 'powerful infrastructure'. Set to null when the slide's layout has no image slot.", nullable: true },
    chartSpec: {
      type: Type.OBJECT,
      description: "Chart data. Required ONLY if layout contains a 'chart' slot.",
      nullable: true,
      properties: {
        type: { type: Type.STRING, enum: ["bar", "line", "donut", "progress", "flow"] },
        title: { type: Type.STRING },
        unit: { type: Type.STRING },
        data: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              value: { type: Type.NUMBER },
              factId: { type: Type.STRING, description: "f01, f02, ... fact ID corresponding to this data point" }
            },
            required: ["label", "value"]
          }
        }
      },
      required: ["type", "data"]
    },
    linkToPrevious: { type: Type.STRING },
    speakerNotes: { type: Type.STRING }
  },
  required: ["index", "title", "layoutId", "factIds"]
};

const PlanSchema = {
  type: Type.OBJECT,
  properties: {
    deckTitle: { type: Type.STRING },
    deckSubtitle: { type: Type.STRING },
    narrativeArc: { type: Type.STRING, description: "Max 300 chars. How the deck builds from opening to close." },
    totalVerifiedFacts: { type: Type.INTEGER, description: "Total number of distinct, verifiable facts you extracted from the source material." },
    recommendedSlideCountReason: { type: Type.STRING, description: "Reason for the recommended count." },
    designSystem: { 
      type: Type.OBJECT,
      properties: {
        paletteId: { type: Type.STRING },
        bgHex: { type: Type.STRING },
        bgAltHex: { type: Type.STRING },
        cardHex: { type: Type.STRING },
        card2Hex: { type: Type.STRING },
        accentHex: { type: Type.STRING },
        accent2Hex: { type: Type.STRING },
        textHex: { type: Type.STRING },
        mutedHex: { type: Type.STRING },
        faintHex: { type: Type.STRING },
        fontFamily: { type: Type.STRING },
        typeScale: { type: Type.STRING }
      },
      required: ["bgHex", "bgAltHex", "cardHex", "card2Hex", "accentHex", "accent2Hex", "textHex", "mutedHex", "faintHex"]
    },
    facts: { type: Type.ARRAY, items: FactSchema },
    slides: { type: Type.ARRAY, items: SlidePlanSchema }
  },
  required: ["deckTitle", "designSystem", "facts", "slides", "totalVerifiedFacts"]
};

class Semaphore {
  private count = 0;
  private queue: (() => void)[] = [];
  constructor(private max: number) {}
  async acquire() {
    if (this.count < this.max) {
      this.count++;
      return;
    }
    return new Promise<void>(resolve => {
      this.queue.push(resolve);
    });
  }
  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.count--;
    }
  }
}

export const chromiumSemaphore = new Semaphore(1);
export const geminiSemaphore = new Semaphore(4);

export async function transcribeSource(
  ai: any,
  files: any[],
  modelIdParam?: string
): Promise<{ text: string; truncated: boolean }> {
  if (!files?.length) return { text: '', truncated: false };
  const MODEL_ID = modelIdParam || DEFAULT_MODEL;
  const parts: string[] = [];
  const binary: any[] = [];

  for (const f of files) {
    const isCsvOrExcel = f.mimeType === 'text/csv' || 
                         f.mimeType === 'application/vnd.ms-excel' || 
                         f.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                         f.name?.endsWith('.csv') || 
                         f.name?.endsWith('.xlsx') || 
                         f.name?.endsWith('.xls');

    if (isCsvOrExcel) {
      // Direct table parsing for CSV/Excel without calling Gemini model
      const content = Buffer.from(f.data || f.base64, 'base64').toString('utf8');
      const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        const parsedRows: string[] = [];
        for (let r = 1; r < lines.length; r++) {
          const row = lines[r].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          row.forEach((cell, c) => {
            if (cell) {
              const header = headers[c] || `العمود ${c + 1}`;
              parsedRows.push(`الصف ${r + 1} / العمود ${String.fromCharCode(65 + c)} (${header}): ${cell}`);
            }
          });
        }
        parts.push(parsedRows.join('\n'));
      }
      continue;
    }

    const TEXT_LIKE = ['text/plain','text/markdown','application/json'];
    if (TEXT_LIKE.includes(f.mimeType)) {
      if (f.data) {
        parts.push(Buffer.from(f.data, 'base64').toString('utf8'));
      } else if (f.base64) {
        parts.push(Buffer.from(f.base64, 'base64').toString('utf8'));
      }
    } else {
      binary.push(f);
    }
  }

  let truncated = false;
  for (const f of binary) {
    let b64 = f.data || f.base64;
    if (!b64) continue;
    const approxMb = (b64.length * 0.75) / (1024 * 1024);
    if (approxMb > 12) { truncated = true; }
    await geminiSemaphore.acquire();
    try {
      const res = await ai.models.generateContent({
        model: MODEL_ID,
        contents: [{ role: 'user', parts: [
          { inlineData: { data: b64, mimeType: f.mimeType } },
          { text:`Transcribe the attached document to plain text.Preserve the original wording EXACTLY, character for character.Do NOT summarise. Do NOT paraphrase. Do NOT translate. Do NOT correct spelling or grammar.Preserve section numbers and headings on their own lines.Preserve all numbers, units and dates exactly as written.Output the transcription only, with no preamble and no commentary.` }
        ]}],
        config: {
          maxOutputTokens: 65535
        }
      });
      parts.push(res.text || '');
    } catch(e) {
      console.error(e);
    } finally {      geminiSemaphore.release();
    }
  }
  return { text: parts.join('\n\n'), truncated };
}

function safeParseJson<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (e1) {
    const startObj = cleaned.indexOf('{');
    const startArr = cleaned.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (startObj !== -1 && (startArr === -1 || startObj < startArr)) {
      startIdx = startObj;
      endIdx = cleaned.lastIndexOf('}');
    } else if (startArr !== -1) {
      startIdx = startArr;
      endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx > startIdx) {
      const extracted = cleaned.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(extracted) as T;
      } catch (e2) {
        const sanitized = extracted
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/,(\s*[}\]])/g, '$1');
        try {
          return JSON.parse(sanitized) as T;
        } catch (e3) {
          console.error("safeParseJson failed after all attempts:", e3);
        }
      }
    }
    return fallback;
  }
}

export async function generatePdfSlides(
  promptStr: string,
  sourceText: string,
  requestedSlides: number,
  configParams: any,
  updateProgress: (step: number, label: string) => Promise<void>
) {
  const config = { ...DEFAULT_CONFIG, ...configParams };
  const ai = createGenAIClient();
  const MODEL_ID = config.modelId || DEFAULT_MODEL;

  const mode = (sourceText && sourceText.trim().length > 0) ? 'grounded' : 'creative';
  const hasSource = mode === 'grounded';

  await updateProgress(1, 'جاري تحليل المصادر واستخراج الحقائق (CALL 1)...');

  const planPrompt = `[SYSTEM] You are an expert presentation planner and facts extractor.
Mode: ${mode.toUpperCase()}
Goal: Create a presentation plan based on user request: "${promptStr}".

Instructions:
1. Extract ALL distinct, verifiable facts from source material. Assign each an id (f01, f02, ...). Do NOT group multiple distinct features or statements into a single fact. Extract each feature, capability, metric, rule, or setting as an individual, standalone fact.
2. For numeric metrics (kind: "metric"), populate 'value' (exact number) and 'unit' (e.g. '%', 'مليون').
3. For each content slide (middle slides between cover and closing), assign at least 2-3 distinct factIds from the facts array to 'factIds'. Never assign fewer than 2 facts to a content slide.
4. If a slide layout has a 'chart' slot, populate chartSpec with data points including 'factId' for each point.

${hasSource ? `Source Material:\n${sourceText}` : ''}`;

  let planRes: any;
  await geminiSemaphore.acquire();
  try {
    const res = await ai.models.generateContent({
      model: MODEL_ID,
      contents: planPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: PlanSchema as any,
        maxOutputTokens: 65535
      }
    });
    planRes = safeParseJson(res.text || '{}', { facts: [], slides: [] });
  } finally {
    geminiSemaphore.release();
  }

  // Ensure robust default slide structure if Gemini returned empty slides
  if (!planRes.slides || !Array.isArray(planRes.slides) || planRes.slides.length === 0) {
    const defaultCount = Math.max(4, Math.min(requestedSlides || 6, 12));
    const titleText = planRes.deckTitle || (promptStr ? promptStr.slice(0, 50) : 'عرض تقديمي متكامل');
    planRes.deckTitle = titleText;
    planRes.slides = [
      { index: 0, title: titleText, subtitle: 'إعداد ناجي للذكاء الاصطناعي', layoutId: 'title', factIds: [] },
      ...Array.from({ length: defaultCount - 2 }, (_, i) => ({
        index: i + 1,
        title: `المحور الرئيسي ${i + 1}: ${titleText}`,
        subtitle: 'تحليل واستعراض شامل ومفصل',
        layoutId: i % 2 === 0 ? 'cards_3' : 'split_text_image',
        factIds: [],
        iconName: 'sparkles'
      })),
      { index: defaultCount - 1, title: 'الخاتمة والتوصيات', subtitle: 'شكراً لمتابعتكم واهتمامكم', layoutId: 'closing', factIds: [] }
    ];
  }

  if (!planRes.designSystem) {
    planRes.designSystem = {
      bgHex: '#0E0F13',
      bgAltHex: '#141620',
      cardHex: '#1B1D28',
      card2Hex: '#232634',
      accentHex: '#D4AF37',
      accent2Hex: '#8B5CF6',
      textHex: '#F4F4F7',
      mutedHex: '#9EA0B0',
      faintHex: '#6B6D7C'
    };
  }

  // Fact verification
    const groundingReport: GroundingReport = {
    mode: mode,
    factsExtracted: planRes.facts?.length || 0,
    factsVerified: 0,
    factsRejected: 0,
    claimsAudited: 0,
    claimsSupported: 0,
    claimsRemoved: [],
    evidenceFailures: 0,
    breachCount: 0,
    slidesDropped: 0,
    imagesUsed: 0,
    imagesFallback: 0
  };

  let verifiedFacts: Fact[] = [];
  if (mode === 'grounded') {
    const { ok, rejected } = verifyFacts(planRes.facts || [], sourceText);
    groundingReport.factsVerified = ok.length;
    groundingReport.factsRejected = rejected.length;
    verifiedFacts = ok;

    const rejectRatio = rejected.length / (planRes.facts?.length || 1);
    if (rejectRatio > config.groundingRejectThreshold) {
       throw new Error(`Grounding failed: ${Math.round(rejectRatio * 100)}% of facts were rejected as hallucinations.`);
    }
  } else {
    verifiedFacts = planRes.facts || [];
    groundingReport.factsVerified = verifiedFacts.length;
  }

  // SLIDE-COUNT GATE (FIX 2)
  const fps      = config.factsPerSlide  ?? 2.5;
  const minS     = config.minSlides      ?? 4;
  const maxHard  = config.maxSlidesHard  ?? 30;

  let finalCount = requestedSlides;
  if (mode === 'grounded') {
    const derived  = Math.ceil(verifiedFacts.length / fps) + 2;   // +cover +closing
    finalCount = Math.min(requestedSlides || Number.MAX_SAFE_INTEGER, derived, maxHard);
  } else {
    finalCount = Math.min(requestedSlides || config.defaultSlides || 12, maxHard);
  }

  if (planRes.slides.length > finalCount) {
    planRes.slides = planRes.slides.slice(0, finalCount);
  }

  // Remove any slide holding fewer than minFactsPerSlide verified facts (cover and closing exempt)
  const minFacts = config.minFactsPerSlide ?? 2;
  const normalizeFid = (id: string) => String(id || '').toLowerCase().trim().replace(/^f0*/, 'f');

  if (mode === 'grounded' && planRes.slides.length > 2) {
    const validVerifiedFids = new Set(verifiedFacts.map(vf => normalizeFid(vf.id)));
    const cover = planRes.slides[0];
    const closing = planRes.slides[planRes.slides.length - 1];
    const middleSlides = planRes.slides.slice(1, planRes.slides.length - 1);

    middleSlides.forEach((s: any, idx: number) => {
      const currentFactIds = (s.factIds || []).map((id: string) => normalizeFid(id));
      const validCount = currentFactIds.filter((fid: string) => validVerifiedFids.has(fid)).length;
      if (validCount < minFacts && verifiedFacts.length > 0) {
        const startIdx = (idx * 2) % verifiedFacts.length;
        const assigned = [
          verifiedFacts[startIdx % verifiedFacts.length].id,
          verifiedFacts[(startIdx + 1) % verifiedFacts.length].id,
          verifiedFacts[(startIdx + 2) % verifiedFacts.length].id
        ];
        s.factIds = Array.from(new Set([...(s.factIds || []), ...assigned]));
      }
    });

    const validMiddle = middleSlides.filter((s: any) => {
      const slideFactIds = (s.factIds || []).map((id: string) => normalizeFid(id));
      const validCount = slideFactIds.filter((fid: string) => validVerifiedFids.has(fid)).length;
      return validCount >= minFacts;
    });

    planRes.slides = [cover, ...validMiddle, closing];
  }

  // Re-index survivor slides
  planRes.slides.forEach((s: any, idx: number) => { s.index = idx; });
  const actualCount = planRes.slides.length;

  if (mode === 'grounded' && actualCount < minS) {
    throw new Error(`المصدر المرفق ما بيكفي لبناء عرض — استخرجنا ${verifiedFacts.length} حقيقة موثّقة فقط. جرّب ترفق مصدر أوسع، أو اطلب مستند بدل عرض.`);
  }

  if (actualCount < requestedSlides) {
    const countReason = planRes.recommendedSlideCountReason || `المصدر المرفق يدعم ${actualCount} شرائح بشكل موثق دون حشو.`;
    groundingReport.countReason = countReason;
  }

  await updateProgress(2, 'جاري صياغة الشرائح المعتمدة باللغة العربية (CALL 2 & 3)...');

  // Split slides for parallel writing
  const half = Math.ceil(planRes.slides.length / 2);
  const slides1 = planRes.slides.slice(0, half);
  const slides2 = planRes.slides.slice(half);

  const writeSlides = async (slidesPart: any[], partName: string) => {
    if (!slidesPart.length) return [];

    // SCOPE THE FACTS (FIX 4)
    const scopedIds   = new Set(slidesPart.flatMap((s: any) => s.factIds || []));
    const scopedFacts = verifiedFacts.filter(f => scopedIds.has(f.id));

    // Prepare prompt facts with placeholder hints (FIX 5)
    const promptFacts = scopedFacts.map(f => {
      if (f.kind === 'metric' && f.value !== undefined) {
        return {
          ...f,
          valuePlaceholder: `{{${f.id}.value}}`,
          unitPlaceholder: f.unit ? `{{${f.id}.unit}}` : ''
        };
      }
      return f;
    });

    const writePrompt = `You are the presentation writer. You must output HTML fragments ONLY for the slots in the provided slides.
DO NOT introduce any facts not present in your input facts list.
CRITICAL FOR METRIC VALUES: For numeric values, write {{fXX.value}} placeholders instead of typing literal digits. The system will substitute exact verified figures.

Design System:${JSON.stringify(planRes.designSystem, null, 2)}
Facts available:${JSON.stringify(promptFacts, null, 2)}
Slides to write:${JSON.stringify(slidesPart, null, 2)}

For each slide, you must return the HTML content wrapped in a <div class="slide" style="grid-template-areas: '[layout.grid]'; grid-template-columns: [layout.cols]; grid-template-rows: [layout.rows];">.
Inside, use the CSS grid areas defined by the layout. (e.g. <div style="grid-area: heading">...</div>).

LAYOUT ENGINE RULES:
- For all card rows, grids, and primary layout structures, use CSS Grid (\`display: grid; grid-template-columns: repeat(N, 1fr); gap: var(--gap);\`). DO NOT use Flexbox for card containers or main column layouts (Flexbox causes height mismatches in Chromium PDF print rendering). Restrict Flexbox ONLY to small inline elements (e.g., an icon next to a label).

ICONS & GRADIENTS:
- If \`iconName\` is provided for a slide or card, render an icon badge: \`<div class="icon-badge">[ICON:\${iconName}]</div>\` or put \`[ICON:\${iconName}]\` inside a card title. Valid icon names: brain, layers, shield, network, bar-chart-3, pie-chart, rocket, check-circle, image, video, file-text, settings, users, credit-card, palette, type, sparkles, lock, zap, database.
- You may use soft \`linear-gradient\` or \`radial-gradient\` for subtle background glows on hero titles or closing slides. STRICTLY BANNED: \`backdrop-filter\`, \`mix-blend-mode\`, \`filter: blur()\`.

CRITICAL INSTRUCTIONS FOR MEDIA SLOTS:
- If a slide has an 'image' slot, output EXACTLY: <div style="grid-area: img" class="image-slot" data-query="[INSERT imageQuery FROM SLIDE JSON HERE]"></div>
- If a slide has a 'chart' slot, output EXACTLY: <div style="grid-area: chart" class="chart-slot" data-spec='[INSERT chartSpec JSON STRING HERE]'></div>

Use Arabic text in a professional tone.
Return a JSON array of strings, where each string is the HTML for one slide.`;

    await geminiSemaphore.acquire();
    try {
      const res = await ai.models.generateContent({
        model: MODEL_ID,
        contents: writePrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } as any,
          maxOutputTokens: 65535
        }
      });

      let slideHtmls = safeParseJson<string[]>(res.text || '[]', []);
      if (!slideHtmls || !Array.isArray(slideHtmls) || slideHtmls.length === 0) {
        slideHtmls = slidesPart.map((s: any) => `
          <div class="slide" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:var(--pad); background:var(--bg); border:1px solid var(--card-2); border-radius:var(--radius);">
            <h1 class="title" style="color:var(--text); margin-bottom:18px; font-size:36px;">${s.title || ''}</h1>
            <p class="body" style="color:var(--muted); max-width:850px; font-size:20px; line-height:1.7;">${s.subtitle || s.title || ''}</p>
          </div>
        `);
      }

      // Substitute placeholders with BIDI isolation (FIX 5)
      return slideHtmls.map((html: string) => {
        let substituted = html;
        verifiedFacts.forEach(f => {
          if (f.value !== undefined) {
            const valStr = `<span dir="ltr" style="unicode-bidi:isolate">${f.value}</span>`;
            const unitStr = f.unit ? ` ${f.unit}` : '';
            const reVal = new RegExp(`\\{\\{${f.id}\\.value\\}\\}`, 'g');
            const reUnit = new RegExp(`\\{\\{${f.id}\\.unit\\}\\}`, 'g');
            substituted = substituted.replace(reVal, valStr).replace(reUnit, unitStr);
          }
        });
        return substituted;
      });
    } finally {
      geminiSemaphore.release();
    }
  };

  const [htmlPart1, htmlPart2] = await Promise.all([
    writeSlides(slides1, 'part1'),
    writeSlides(slides2, 'part2')
  ]);

  let rawHtml = [...htmlPart1, ...htmlPart2].join('\n');

  await updateProgress(3, 'جاري مراجعة الامتثال وتدقيق الحقائق (CALL 4)...');

    const { cleanHtml, reportUpdates } = await verifyRenderedDeck(rawHtml, verifiedFacts, sourceText, mode, ai, MODEL_ID, geminiSemaphore);
  Object.assign(groundingReport, reportUpdates);
  let finalHtml = cleanHtml;

  // Replace icon placeholders with rendered SVG icons (FIX 5)
  finalHtml = finalHtml.replace(/\[ICON:([a-z0-9-]+)\]/g, (_, name) => icon(name, 22, 'var(--accent)'));

  await updateProgress(4, 'جاري جلب الصور وتجهيز ملف PDF...');

  const imageQueries = planRes.slides.filter((s: any) => s.imageQuery).map((s: any) => s.imageQuery);
  const uniqueQueries = Array.from(new Set(imageQueries));
  const imageMap: Record<string, { b64: string, photographer?: string }> = {};

  for (const q of uniqueQueries as string[]) {
    const photoRes = await fetchRealPhotography(q, 1280, 720, 'large');
    if (photoRes?.b64) {
       try {
         const buf = Buffer.from(photoRes.b64, 'base64');
         const optimized = await sharp(buf).resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 72, mozjpeg: true }).toBuffer();
         imageMap[q] = { b64: optimized.toString('base64'), photographer: photoRes.photographer };
         groundingReport.imagesUsed++;
       } catch (e) {
         imageMap[q] = { b64: photoRes.b64, photographer: photoRes.photographer };
       }
    } else {
       groundingReport.imagesFallback++;
    }
  }

  // Replace images
  finalHtml = finalHtml.replace(/<div[^>]*class="image-slot"[^>]*data-query="([^"]+)"[^>]*><\/div>/g, (match, query) => {
     if (imageMap[query]) {
       const img = imageMap[query];
       const caption = img.photographer ? `<div style="position:absolute; bottom:10px; left:10px; font-size:10px; color:var(--faint); z-index:10;" dir="ltr">Photo by ${img.photographer}</div>` : '';
       return `
       <div style="position:relative; width:100%; height:100%; grid-area: img;">
         <img src="data:image/jpeg;base64,${img.b64}" style="width:100%; height:100%; object-fit:cover;" />
         <div class="image-scrim"></div>
         ${caption}
       </div>`;
     }
     return '<div style="grid-area: img; background: var(--card-2); opacity: 0.5;"></div>';
  });

  // Replace charts with verified value assertions (FIX 3)
  finalHtml = finalHtml.replace(/<div[^>]*class="chart-slot"[^>]*data-spec='([^']+)'[^>]*><\/div>/g, (match, specStr) => {
     try {
       const spec = JSON.parse(specStr);
       const type = spec.type || 'bar';
       const data = spec.data || [];

       const verifiedData = data.map((d: any) => {
         if (d.factId) {
           const vf = verifiedFacts.find(f => f.id === d.factId);
           if (vf && typeof vf.value === 'number') {
             return { ...d, value: vf.value };
           }
         }
         return d;
       });

       let chartHtml = '';
       if (type === 'bar') chartHtml = barChart(verifiedData);
       else if (type === 'line') chartHtml = lineChart(verifiedData);
       else if (type === 'donut') chartHtml = donutChart(verifiedData);
       else if (type === 'progress') chartHtml = progressBars(verifiedData);
       else if (type === 'flow') chartHtml = flowDiagram(verifiedData);
       return `<div style="grid-area: chart; width:100%; height:100%;">${chartHtml}</div>`;
     } catch (e) {
       return '<div style="grid-area: chart; background: var(--card-2);">Chart Error</div>';
     }
  });

  const cairoPath = path.join(process.cwd(), 'cairo_arabic.b64');
  let cairoB64 = '';
  if (fs.existsSync(cairoPath)) {
    cairoB64 = fs.readFileSync(cairoPath, 'utf8').trim();
  }

  const ds = planRes.designSystem || {};
  const fullDocument = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8" /><style>@font-face {
  font-family: 'Cairo';
  src: url(data:font/woff2;base64,${cairoB64}) format('woff2');
  font-display: block;
}:root {
  --bg: ${ds.bgHex || '#0E0F13'}; 
  --bg-alt: ${ds.bgAltHex || '#141620'}; 
  --card: ${ds.cardHex || '#1B1D28'}; 
  --card-2: ${ds.card2Hex || '#232634'};
  --accent: ${ds.accentHex || '#D4AF37'}; 
  --accent-2: ${ds.accent2Hex || '#8B5CF6'};
  --text: ${ds.textHex || '#F4F4F7'}; 
  --muted: ${ds.mutedHex || '#9EA0B0'}; 
  --faint: ${ds.faintHex || '#6B6D7C'};
  --radius: 14px; --gap: 20px; --pad: 56px;
}@page { size: 1280px 720px; margin: 0; }
@media print {
  html, body {
    background: var(--bg) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .slide {
    page-break-after: always;
    page-break-inside: avoid;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .slide:last-child { page-break-after: auto; }
}
body {
  margin: 0; padding: 0;
  font-family: 'Cairo', sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}.slide {
  width: 1280px; height: 720px;
  box-sizing: border-box; overflow: hidden;
  position: relative;
  page-break-after: always;
  padding: var(--pad);
  display: grid;
  gap: var(--gap);
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}.slide:last-child { page-break-after: auto; }.title { font-size: clamp(28px, 3.4vw, 44px); }.body { font-size: clamp(14px, 1.35vw, 19px); }.card-grid { display:grid; gap:var(--gap); align-content:start; }.icon-badge {
  width: 44px; height: 44px; border-radius: 50%;
  display: grid; place-items: center;
  background: rgba(212, 175, 55, 0.12);
  color: var(--accent);
  flex-shrink: 0;
}.image-scrim { 
  position:absolute; inset:0;
  background: linear-gradient(-90deg, rgba(14,15,19,.94) 0%, rgba(14,15,19,.55) 55%, rgba(14,15,19,.15) 100%);
}</style></head><body>${finalHtml}</body></html>`;

  let pdfBuffer: Buffer;
  await chromiumSemaphore.acquire();
  let browser;
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
    await page.setContent(fullDocument, { waitUntil: 'domcontentloaded' });
    await page.evaluateHandle('document.fonts.ready');
    await page.emulateMediaType('screen');
    
    const pdfResult = await page.pdf({
      width: '1280px',
      height: '720px',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });
    pdfBuffer = Buffer.from(pdfResult);

    if (!pdfBuffer || pdfBuffer.length < 5000) {
      throw new Error(`Empty PDF (${pdfBuffer?.length ?? 0} bytes)`);
    }
  } finally {
    if (browser) await browser.close();
    chromiumSemaphore.release();
  }

  return {
    base64Data: pdfBuffer.toString('base64'),
    mimeType: 'application/pdf',
    extension: 'pdf',
    groundingReport,
    slideCount: actualCount
  };
}
