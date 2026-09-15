import { DARK_LUXE, LIGHT_EDITORIAL, textOpts, pixelMotif, card, badge, cardHeight, assertFits, COORDS, DeckPalette } from './pptx-design';
import { Type, Schema as GeminiSchema, GoogleGenAI } from "@google/genai";
import { createGenAIClient } from './genaiClient';
import { getNajeModel, resolveEngineModel } from './modelEnvConfig';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

async function getPptxGenCtor(): Promise<any> {
  const mod: any = await import("pptxgenjs");
  return mod.default || mod;
}



async function renderIconToPngBase64(iconName: string, hexColor: string): Promise<string | null> {
  try {
    const sharpModule = await import('sharp');
    const sharp: any = sharpModule.default || sharpModule;
    
    // safe fallback
    const safeIconName = iconName && /^[a-z0-9-]+$/.test(iconName) ? iconName : 'sparkles';
    const iconPath = path.resolve(process.cwd(), 'node_modules/lucide-static/icons', `${safeIconName}.svg`);
    
    if (!fs.existsSync(iconPath)) return null;
    
    let svg = fs.readFileSync(iconPath, 'utf-8');
    // Replace stroke="currentColor" with our hex color
    svg = svg.replace(/stroke="currentColor"/g, `stroke="#${hexColor}"`);
    
    const buffer = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
    return buffer.toString('base64');
  } catch(e) {
    console.error("Failed to render icon:", e);
    return null;
  }
}

import JSZip from "jszip";

// --- 1. ZOD SCHEMAS --- //
export const NajeThemeSchema = z.object({
  background: z.string(),
  title: z.string(),
  text: z.string(),
  accent: z.string(),
});

export const NajeSlideContentSchema = z.object({
  text: z.string().optional(),
  bulletPoints: z.array(z.string()).optional(),
  aiImagePrompt: z.string(),
  codeVisualType: z.enum(['svg', 'mermaid', 'diagram']).optional(),
  codeVisualContent: z.string().optional(),
  visualSource: z.enum(['stock', 'ai', 'code', 'none']).optional(),
  cards: z.array(z.object({
    title: z.string(),
    text: z.string(),
    iconKeyword: z.string()
  })).optional(),
  stats: z.object({
    value: z.string(),
    label: z.string()
  }).optional(),
  comparisons: z.array(z.object({
    label: z.string(),
    value: z.number(),
    max: z.number()
  })).optional(),
});

export const NajeSlideSchema = z.object({
  layoutTemplate: z.enum([
    "title_slide",
    "split_image_left",
    "split_image_right",
    "three_cards",
    "two_columns",
    "bullet_list",
    "showcase",
    "comparison_bars",
    "chart_column",
    "chart_compare",
    "icon_list",
    "full_background_image"
  ]),
  eyebrow: z.string().optional(),
  slideTitle: z.string(),
  slideSubtitle: z.string().optional(),
  speakerNotes: z.string(),
  content: NajeSlideContentSchema,
});

export type NajeSlide = z.infer<typeof NajeSlideSchema>;

// --- 2. GEMINI SCHEMAS --- //
const geminiSlideSchema: GeminiSchema = {
  type: Type.OBJECT,
  properties: {
    layoutTemplate: {
      type: Type.STRING,
      description: "Must be one of: title_slide, split_image_left, split_image_right, three_cards, two_columns, bullet_list, showcase, comparison_bars, chart_column, chart_compare, icon_list, full_background_image"
    },
    eyebrow: { type: Type.STRING, description: "Max 30 characters. Section number or short English label shown above the title, e.g. '٢٫٣ · المحرّك' or 'N-CORE PIPELINE'." },
    slideTitle: { type: Type.STRING, description: "Max 45 characters. A statement, not a label. Arabic titles count characters, not words." },
    slideSubtitle: { type: Type.STRING, description: "Max 90 characters. Optional. Omit rather than padding." },
    speakerNotes: { type: Type.STRING, description: "2 to 4 sentences of presenter guidance. Never rendered on the slide." },
    content: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "Max 220 characters. One idea. Do not restate the title." },
        bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 to 5 items. Max 95 characters each. No sub-bullets." },
        aiImagePrompt: { type: Type.STRING, description: "REQUIRED. Concrete English noun phrase for stock photo search." },
        codeVisualType: { type: Type.STRING, description: "Optional: 'svg' or 'mermaid' or 'diagram' when slide illustrates an architecture, timeline, or workflow chart." },
        codeVisualContent: { type: Type.STRING, description: "Optional: raw valid SVG markup or Mermaid.js code for technical diagrams and flowcharts." },
        visualSource: { type: Type.STRING, description: "Optional: 'stock', 'ai', 'code', or 'none'." },
        cards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Max 28 characters." },
              text: { type: Type.STRING, description: "Max 150 characters." },
              iconKeyword: { type: Type.STRING, description: "Must be one of: rocket, check-circle, zap, bar-chart-3, lightbulb, shield, globe, trending-up, users, target, clock, sparkles, briefecase, cpu, star, heart, flag" }
            },
            required: ["title", "text", "iconKeyword"]
          }
        },
        stats: {
          type: Type.OBJECT,
          properties: {
            value: { type: Type.STRING, description: "Max 6 characters. A number or short figure, e.g. '0.5' or '٨'." },
            label: { type: Type.STRING, description: "Max 60 characters." }
          },
          required: ["value", "label"]
        },
        comparisons: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              value: { type: Type.NUMBER },
              max: { type: Type.NUMBER }
            },
            required: ["label", "value", "max"]
          }
        }
      }
    }
  },
  required: ["layoutTemplate", "slideTitle", "speakerNotes", "content"]
};

export const NajeOutlineSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({
    title: z.string(),
    description: z.string()
  }))
});

export type NajeOutline = z.infer<typeof NajeOutlineSchema>;

const geminiOutlineSchema: GeminiSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING, description: "Detailed design instructions and summary of what text/content this slide will cover." }
        },
        required: ["title", "description"]
      }
    }
  },
  required: ["title", "sections"]
};

// --- 3. UTILS & LANGUAGE DETECTION --- //
export function isArabic(text: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

// Ensure Hex has #
function normalizeHex(hex: string) {
  hex = hex.replace('#', '');
  return hex.length === 3 || hex.length === 6 ? hex : '000000';
}

// Fetch image with timeout and fallback
// P1-1: Fetch real photography, bypassing AI abstract slop
export async function fetchRealPhotography(keyword: string, width: number, height: number, size: 'large' | 'large2x' = 'large2x'): Promise<{ b64: string | null, photographer?: string, photoUrl?: string } | null> {
  try {
    const pexelsKey = process.env.PEXELS_API_KEY;
    if (pexelsKey) {
      // Literal queries filter out most AI abstract slop
      const safeKeyword = keyword; // No hardcoded " office", no early truncation
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(safeKeyword)}&per_page=5`, {
        headers: { Authorization: pexelsKey }
      });
      const data = await res.json();
      if (data && data.photos && data.photos.length > 0) {
        // Find a photo that preferably has a known photographer
        const photo = data.photos.find((p: any) => p.photographer) || data.photos[0];
        if (photo) {
           const b64 = await fetchImageBuffer(photo.src[size] || photo.src.large); return { b64, photographer: photo.photographer, photoUrl: photo.url };
        }
      }
    }
    // Fallback to picsum if no Pexels
    const b64 = await fetchImageBuffer(`https://picsum.photos/seed/${encodeURIComponent(keyword)}/${width}/${height}`); return { b64, photographer: 'Picsum Photos' };
  } catch(e) {
    console.error("fetchRealPhotography failed:", e);
    return null;
  }
}

async function fetchImageBuffer(url: string, timeoutMs = 5000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (e) {
    console.error("Image fetch failed:", url, e);
    return null; // fallback
  }
}

// --- 4. ENGINE CORE --- //
export class NajeEngine {
  private ai: GoogleGenAI;
  
  constructor(apiKey?: string) {
    this.ai = createGenAIClient();
  }

  // Intent-aware DOCUMENT outline (novels, stories, articles, reports).
  // Unlike generateOutline (presentations) it does NOT force cards/charts/visual elements —
  // it outlines the ACTUAL content that fulfills the user's request.
  async generateDocumentOutline(prompt: string, numSections: number = 5, retryCount = 0): Promise<{ title: string; sections: any[]; theme?: 'dark' | 'light'; colors?: { background: string; title: string; text: string; accent: string } }> {
    const safeSections = Math.max(1, Math.min(Number(numSections) || 5, 25));
    const docOutlineSchema: any = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "The document's real title, in the user's language." },
        theme: { type: Type.STRING, enum: ["dark", "light"], description: "Visual theme for document presentation (dark or light)." },
        colors: {
          type: Type.OBJECT,
          properties: {
            background: { type: Type.STRING, description: "hexcode without #" },
            title: { type: Type.STRING, description: "hexcode without #" },
            text: { type: Type.STRING, description: "hexcode without #" },
            accent: { type: Type.STRING, description: "hexcode without #" }
          }
        },
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Section/chapter title as it appears in the document." },
              description: { type: Type.STRING, description: "1-2 sentences stating exactly what CONTENT this section must contain (real story beats / real points) — not meta-design." }
            },
            required: ["title", "description"]
          }
        }
      },
      required: ["title", "sections"]
    };

    try {
      const outlinePrompt = `أنت "ناجي"، كاتب عربي ومصمم محترف وبارع. مهمتك أن تنفّذ طلب المستخدم بأمانة وتبني عليه بأعلى جودة — لا أن تصنع مستنداً "عن" الموضوع، ولا أن تفرض بطاقات أو رسوماً أو إنفوغرافيك.

طلب المستخدم (اقرأه بعناية واحترم نيّته الحقيقية):
"${prompt}"

أولاً صنّف الطلب بصمت:
• إبداعي/سردي (رواية، قصة، حكاية، قصيدة، سيناريو، قصة أطفال...): الأقسام هي أجزاء العمل الفعلية — فصول أو مشاهد تروي القصة بنثر حقيقي وحوار ووصف. ممنوع كتابة أقسام "تصميم" أو "تيبوغرافيا" أو "كيفية التنسيق" أو أي تعليق عن العمل. القارئ يجب أن يقرأ القصة نفسها.
• معلوماتي (مقال، تقرير، دليل، بحث، تحليل، خطة...): الأقسام هي المحتوى الحقيقي الذي يجيب على الطلب بنثر متدفّق.

اكتب مخططاً من ${safeSections} أقسام بالضبط، بقوس متماسك، باللغة العربية (إلا إذا طلب المستخدم لغة أخرى).
مع تحديد نسق الألوان (theme: dark/light وأكواد الألوان بدون #).

لكل قسم:
- "title": عنوان القسم/الفصل كما سيظهر.
- "description": جملة أو جملتان تحدّدان بالضبط المحتوى الحقيقي المطلوب في هذا القسم (أحداث القصة الفعلية / النقاط الفعلية).

أعد فقط JSON بالشكل: {"title":"...","theme":"dark","colors":{"background":"0B0F19","title":"FFFFFF","text":"94A3B8","accent":"6366F1"},"sections":[{"title":"...","description":"..."}]} بدون أي نص إضافي أو علامات markdown.`;

      const response = await this.ai.models.generateContent({
        model: resolveEngineModel(getNajeModel('core')),
        contents: outlinePrompt,
        config: { responseMimeType: 'application/json', responseSchema: docOutlineSchema, maxOutputTokens: 8192, temperature: 0.6 }
      });

      let rawText = response.text || "{}";
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/([\{\[][\s\S]*[\}\]])/);
      if (jsonMatch) rawText = jsonMatch[1];
      const parsed = JSON.parse(rawText);
      const sections = Array.isArray(parsed.sections) ? parsed.sections.slice(0, safeSections) : [];
      if (sections.length === 0) throw new Error("empty document outline");
      return { 
        title: parsed.title || '', 
        sections,
        theme: parsed.theme,
        colors: parsed.colors
      };
    } catch (error) {
      console.error(`Document outline failed (attempt ${retryCount + 1}):`, error);
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, Math.pow(2, retryCount) * 800));
        return this.generateDocumentOutline(prompt, safeSections, retryCount + 1);
      }
      throw new Error("Failed to generate a valid document outline.");
    }
  }

  // Generate Presentation Outline
  async generateOutline(prompt: string, numSlides: number = 8, retryCount = 0): Promise<NajeOutline> {
    const safeSlides = Math.max(1, Math.min(Number(numSlides) || 8, 35));
    try {
      const outlinePrompt = `You are Naje AI, an elite Presentation Designer.
Create a high-impact presentation outline for the following prompt:
"${prompt}"

Target section count: EXACTLY ${safeSlides} sections.
يجب أن يكون عدد الأقسام بالضبط ${safeSlides} — لا أكثر ولا أقل.
Ensure a strong narrative arc. Language: Arabic (unless requested otherwise).

Across the deck, no single layoutTemplate may be used for more than 30% of slides. Consecutive slides must not share the same layoutTemplate. Every slide must carry at least one visual element — an icon, a chart, a stat callout, an image, or a card grid. A slide with only a title and body text is not acceptable output.`;

      const response = await this.ai.models.generateContent({
        model: resolveEngineModel(getNajeModel('core')),
        contents: outlinePrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: geminiOutlineSchema,
          maxOutputTokens: 8192,
          temperature: 0.3
        }
      });
      
            let rawText = response.text || "{}";
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/([\{\[][\s\S]*[\}\]])/);
      if (jsonMatch) {
        rawText = jsonMatch[1];
      }
      const parsed = JSON.parse(rawText);
      const outline = NajeOutlineSchema.parse(parsed);
      if (Array.isArray(outline.sections) && outline.sections.length > safeSlides) {
        outline.sections = outline.sections.slice(0, safeSlides);
      }
      return outline;
    } catch (error) {
      console.error(`Outline Generation failed (attempt ${retryCount + 1}):`, error);
      if (retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.generateOutline(prompt, safeSlides, retryCount + 1);
      }
      throw new Error(`Failed to generate valid outline JSON after 3 attempts.`);
    }
  }

  // Generate with Retry + Zod Validation
  
  async generateArtDirection(prompt: string, brandProfile?: any, retryCount = 0): Promise<{ theme: 'dark' | 'light'; colors: { background: string; title: string; text: string; accent: string } }> {
    try {
      const artPrompt = `You are Naje AI, an elite Presentation Designer.
Generate a single, cohesive art direction for a presentation about: "${prompt}".
You MUST return a JSON object with:
{
  "theme": "dark" | "light",
  "colors": {
    "background": "hexcode without #",
    "title": "hexcode without #",
    "text": "hexcode without #",
    "accent": "hexcode without #"
  }
}
If the presentation is modern/tech, prefer 'dark' theme. If corporate/formal, prefer 'light'.`
      
      const response = await this.ai.models.generateContent({
        model: resolveEngineModel(getNajeModel('core')),
        contents: artPrompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 2048,
          temperature: 0.2
        }
      });
      
      let rawText = response.text || "{}";
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/([\{\[][\s\S]*[\}\]])/);
      if (jsonMatch) rawText = jsonMatch[1];
      const parsed = JSON.parse(rawText);
      return parsed;
    } catch(e) {
      if (retryCount < 2) return this.generateArtDirection(prompt, brandProfile, retryCount + 1);
      return { theme: 'dark', colors: { background: '0B0F19', title: 'FFFFFF', text: '94A3B8', accent: '6366F1' } };
    }
  }

  async generateSlideJSON(sectionTitle: string, sectionDesc: string, artDirection: any, retryCount = 0, model: string = getNajeModel('personas')): Promise<NajeSlide> {
    try {
      const prompt = `You are Naje AI, an elite Presentation Designer.
Generate a structured JSON slide based on this requirement:
Title: ${sectionTitle}
Context: ${sectionDesc}
Language: Strictly Arabic unless instructed otherwise.
Design rules: Extreme brevity, highly visual.

CRITICAL TEXT RULE: 'content.text' MUST be at most one single, grammatically complete sentence. If there are multiple distinct ideas, you MUST use 'content.bulletPoints' instead and leave 'content.text' empty.

CRITICAL IMAGE RULE: 'content.aiImagePrompt' is REQUIRED. It MUST be a concrete, literal, transliterated English noun phrase describing a real photographable scene relevant to this specific slide's topic (e.g. "business meeting in modern office", "abstract blue network lines", "laptop on desk"). NO Arabic. NO abstract concepts or AI buzzwords.`;

      const response = await this.ai.models.generateContent({
        model: resolveEngineModel(model),
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: geminiSlideSchema,
          maxOutputTokens: 8192,
          temperature: 0.2
        }
      });
      
            let rawText = response.text || "{}";
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/([\{\[][\s\S]*[\}\]])/);
      if (jsonMatch) {
        rawText = jsonMatch[1];
      }
      const parsed = JSON.parse(rawText);
      
      // Bug E: Sanity check for long run-on text
      if (parsed.content && parsed.content.text) {
         const words = parsed.content.text.split(/\s+/);
         const multiplePunctuation = (parsed.content.text.match(/[.!?،؛]/g) || []).length > 2;
         if (words.length > 25 || multiplePunctuation) {
            // Auto-split into bullet points
            const sentences = parsed.content.text.split(/(?<=[.!?،؛])\s+/).filter((s: string) => s.trim().length > 0);
            if (sentences.length > 1) {
               parsed.content.bulletPoints = [...(parsed.content.bulletPoints || []), ...sentences];
               parsed.content.text = ""; // clear the run-on text
            }
         }
      }
      
      // Zod Validation (will throw if malformed)
      return NajeSlideSchema.parse(parsed);
    } catch (error) {
      console.error(`Slide Generation failed (attempt ${retryCount + 1}):`, error);
      if (retryCount < 2) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.generateSlideJSON(sectionTitle, sectionDesc, artDirection, retryCount + 1);
      }
      throw new Error(`Failed to generate valid slide JSON after 3 attempts.`);
    }
  }

  private async renderCodeVisualToPngBase64(type: 'svg' | 'mermaid' | 'diagram', content: string): Promise<string | null> {
    try {
      if (!content) return null;
      const sharpModule = await import('sharp');
      const sharp: any = sharpModule.default || sharpModule;
      const clean = content.trim();
      if (type === 'svg' || clean.startsWith('<svg') || clean.includes('xmlns=')) {
        const svgMarkup = clean.startsWith('<svg') ? clean : clean.substring(clean.indexOf('<svg'));
        const buffer = await sharp(Buffer.from(svgMarkup)).resize({ width: 1200, height: 800, fit: 'inside' }).png().toBuffer();
        return buffer.toString('base64');
      }
      const lines = clean.split('\n').filter(l => l.trim().length > 0);
      const svgWrapper = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
          <rect width="1200" height="800" rx="24" fill="#0f172a" />
          <rect x="20" y="20" width="1160" height="760" rx="16" fill="#1e293b" stroke="#6366f1" stroke-width="2" />
          <text x="60" y="80" font-family="monospace, sans-serif" font-size="28" font-weight="bold" fill="#38bdf8">DIAGRAM / FLOWCHART</text>
          ${lines.slice(0, 14).map((line, idx) => `
            <text x="60" y="${140 + idx * 42}" font-family="monospace, sans-serif" font-size="20" fill="#e2e8f0">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
          `).join('')}
        </svg>
      `;
      const buffer = await sharp(Buffer.from(svgWrapper)).png().toBuffer();
      return buffer.toString('base64');
    } catch (err: any) {
      console.warn("[Code-to-Visuals Engine] Rasterization notice:", err?.message || err);
      return null;
    }
  }

  // Render PPTX from an array of validated NajeSlides
  async renderPPTX(slides: NajeSlide[], brandProfile?: any): Promise<string> {
    const PptxGenJSCtor = await getPptxGenCtor();
    const pres = new PptxGenJSCtor();
    pres.defineLayout({ name: 'NAJE_WIDE', width: 13.333, height: 7.5 });
    pres.layout = 'NAJE_WIDE';
    
    const combinedAllText = slides.map(s => (s.slideTitle || '') + " " + (s.content?.text || '')).join(" ");
    const isDeckRtl = isArabic(combinedAllText);
    if (isDeckRtl) pres.rtlMode = true;

    // Layout Variety Enforcement
    for (let i = 2; i < slides.length; i++) {
      if (slides[i].layoutTemplate === slides[i-1].layoutTemplate && slides[i].layoutTemplate === slides[i-2].layoutTemplate) {
        if (slides[i-1].layoutTemplate === 'bullet_list') slides[i-1].layoutTemplate = 'icon_list';
        else if (slides[i-1].layoutTemplate === 'two_columns') slides[i-1].layoutTemplate = 'three_cards';
        else if (slides[i-1].layoutTemplate === 'three_cards') slides[i-1].layoutTemplate = 'two_columns';
        else slides[i-1].layoutTemplate = 'bullet_list';
      }
    }

    // Pre-fetch images
    const imagePromises = slides.map(async (slideData, index) => {
      let b64 = null;
      const layoutTemplate = slideData.layoutTemplate || 'title_slide';
       
      let width = 800; let height = 800;
      
      if (layoutTemplate === 'full_background_image') {
        width = 1920; height = 1080;
      } else if (['split_image_left', 'split_image_right'].includes(layoutTemplate)) {
        width = 1080; height = 1920;
      }
      
      if (slideData.content?.codeVisualContent) {
        const codeB64 = await this.renderCodeVisualToPngBase64(slideData.content.codeVisualType || 'svg', slideData.content.codeVisualContent);
        if (codeB64) {
          b64 = codeB64;
        }
      } else if (['full_background_image', 'split_image_left', 'split_image_right', 'showcase'].includes(layoutTemplate)) {
        const photoRes = await fetchRealPhotography((slideData.content?.aiImagePrompt || "modern business abstract"), width, height);
        b64 = photoRes?.b64 || null;
      }
      return { index, b64 };
    });
    
    const prefetchedImages = await Promise.all(imagePromises);
    const prefetchMap = new Map();
    prefetchedImages.forEach(img => prefetchMap.set(img.index, img.b64));

    // Determine palette
    // Default to DARK_LUXE if brandProfile is not provided
    const P: DeckPalette = brandProfile?.palette || DARK_LUXE;
    const defaultArFont = brandProfile?.typography?.primaryFont || 'Cairo';
    const defaultEnFont = brandProfile?.typography?.secondaryFont || 'Arial';

    // Pre-fetch icons
    const iconPromises = slides.map(async (slideData, index) => {
      const icons = new Map<number, string | null>(); 
      const layoutTemplate = slideData.layoutTemplate || 'title_slide';
      
      if (['three_cards', 'two_columns', 'icon_list'].includes(layoutTemplate) && slideData.content.cards) {
        for (let j = 0; j < slideData.content.cards.length; j++) {
           const c = slideData.content.cards[j];
           const iconKeyword = c.iconKeyword || 'sparkles';
           const b64 = await renderIconToPngBase64(iconKeyword, normalizeHex(P.accent));
           icons.set(j, b64);
        }
      }
      return { index, icons };
    });
    
    const prefetchedIcons = await Promise.all(iconPromises);
    const prefetchIconMap = new Map();
    prefetchedIcons.forEach(res => prefetchIconMap.set(res.index, res.icons));

    for (let i = 0; i < slides.length; i++) {
      const slideData = slides[i];
      const prefetchB64 = prefetchMap.get(i);
      const isRtl = isArabic(slideData.slideTitle + " " + (slideData.content.text || ""));
      const fontName = isRtl ? defaultArFont : defaultEnFont;
      
      const slide = pres.addSlide();
      slide.background = { color: P.bg };
      if (slideData.speakerNotes) slide.addNotes(slideData.speakerNotes);
      
      const layoutTemplate = slideData.layoutTemplate;
      const slideTitle = slideData.slideTitle || '';
      const slideSubtitle = slideData.slideSubtitle || '';
      const eyebrow = slideData.eyebrow || '';

      // Standard Title Band (not on full_background_image or title_slide)
      if (layoutTemplate !== 'full_background_image' && layoutTemplate !== 'title_slide') {
        if (eyebrow) {
          slide.addText(eyebrow, textOpts(eyebrow, {
            x: 0.6, y: 0.42, w: 12.13, h: 0.3, fontSize: 12, fontFace: fontName, bold: true,
            color: P.accent, charSpacing: 2, margin: 0,
          }));
        }
        slide.addText(slideTitle, textOpts(slideTitle, {
          x: 0.6, y: 0.75, w: 12.13, h: 0.75, fontSize: 34, fontFace: fontName, bold: true,
          color: P.text, margin: 0,
        }));
      }

      if (layoutTemplate === 'full_background_image') {
        const b64 = prefetchB64;
        if (b64) {
          slide.addImage({ data: `image/jpeg;base64,${b64}`, x: 0, y: 0, w: 13.333, h: 7.5, sizing: { type: 'cover', w: 13.333, h: 7.5 } });
        }
        slide.addShape("rect", { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: '000000', transparency: 45 }, line: { type: 'none' } });
        
        slide.addText(slideTitle, textOpts(slideTitle, { x: 1.60, y: 2.40, w: 10.13, h: 1.5, fontSize: 48, fontFace: fontName, color: 'FFFFFF', bold: true, margin: 0 }));
        if (slideSubtitle) {
           slide.addText(slideSubtitle, textOpts(slideSubtitle, { x: 1.60, y: 3.90, w: 10.13, h: 1, fontSize: 24, fontFace: fontName, color: P.accent, margin: 0 }));
        }
      } 
      else if (layoutTemplate === 'title_slide') {
        slide.addText(slideTitle, textOpts(slideTitle, { x: 5.20, y: 1.90, w: 7.55, h: 1.35, fontSize: 56, fontFace: fontName, color: P.text, bold: true, margin: 0 }));
        if (slideSubtitle) {
           slide.addText(slideSubtitle, textOpts(slideSubtitle, { x: 5.20, y: 3.20, w: 7.55, h: 0.80, fontSize: 24, fontFace: fontName, color: P.accent, margin: 0 }));
        }
        pixelMotif(slide, 0.6, 1.9, 10, 15, 0.15, 0.05, P.accent, 60);
      }
      else if (layoutTemplate === 'showcase') {
        const statVal = slideData.content.stats?.value || '';
        const statLabel = slideData.content.stats?.label || slideSubtitle;
        
        if (statVal) {
          const fitRes = assertFits(statVal, 12.13, 1.60, 60, 46);
          slide.addText(fitRes.text, textOpts(fitRes.text, { x: 0.60, y: 2.20, w: 12.13, h: 1.60, fontSize: fitRes.fs, fontFace: fontName, color: P.accent, bold: true, margin: 0, align: 'center' }));
        }
        if (statLabel) {
          slide.addText(statLabel, textOpts(statLabel, { x: 0.60, y: 3.90, w: 12.13, h: 0.60, fontSize: 32, fontFace: fontName, color: P.text, bold: true, margin: 0, align: 'center' }));
        }
        const mainText = slideData.content.text || '';
        if (mainText) {
           const fitRes = assertFits(mainText, 8.13, 1.20, 18, 12);
           slide.addText(fitRes.text, textOpts(fitRes.text, { x: 2.60, y: 4.70, w: 8.13, h: 1.20, fontSize: fitRes.fs, fontFace: fontName, color: P.muted, margin: 0, align: 'center' }));
        }
      }
      else if (layoutTemplate === 'comparison_bars' || layoutTemplate === 'chart_column') {
        const comps = slideData.content.comparisons || [];
        if (comps.length > 0) {
          slide.addChart(pres.ChartType.bar, [{
            name: "Series 1",
            labels: comps.map(c => c.label),
            values: comps.map(c => c.value),
          }], {
            x: 0.6, y: 1.90, w: 12.13, h: 4.40,
            barDir: "col",
            chartColors: [P.accent],
            showTitle: false,
            showValue: true, dataLabelPosition: "outEnd", dataLabelColor: P.text,
            dataLabelFontFace: fontName, dataLabelFontSize: 12,
            showLegend: false,
            catAxisLabelColor: P.muted, catAxisLabelFontFace: fontName, catAxisLabelFontSize: 11,
            valAxisLabelColor: P.muted, valAxisLabelFontFace: fontName, valAxisLabelFontSize: 11,
            valGridLine: { color: P.card, size: 1 },
            catGridLine: { style: "none" },
            plotArea: { fill: { color: P.bg } },
            chartArea: { fill: { color: P.bg } },
          });
        }
      }
      else if (layoutTemplate === 'chart_compare') {
        const comps = slideData.content.comparisons || [];
        if (comps.length > 0) {
          slide.addChart(pres.ChartType.bar, [{
            name: "Series 1",
            labels: comps.map(c => c.label),
            values: comps.map(c => c.value),
          }], {
            x: 0.6, y: 1.90, w: 12.13, h: 4.40,
            barDir: "col",
            chartColors: [P.accent, P.accent2 || '8B5CF6'],
            showTitle: false,
            showValue: true, dataLabelPosition: "outEnd", dataLabelColor: P.text,
            dataLabelFontFace: fontName, dataLabelFontSize: 12,
            showLegend: true, legendPos: "b", legendColor: P.muted,
            barGrouping: "clustered",
            catAxisLabelColor: P.muted, catAxisLabelFontFace: fontName, catAxisLabelFontSize: 11,
            valAxisLabelColor: P.muted, valAxisLabelFontFace: fontName, valAxisLabelFontSize: 11,
            valGridLine: { color: P.card, size: 1 },
            catGridLine: { style: "none" },
            plotArea: { fill: { color: P.bg } },
            chartArea: { fill: { color: P.bg } },
          });
        }
      }
      else if (layoutTemplate === 'split_image_left' || layoutTemplate === 'split_image_right') {
        const isImageLeft = layoutTemplate === 'split_image_left';
        // In RTL, we should physically reverse the layout coordinates for split image so it visually balances correctly, BUT instructions say to just use the specific coords and flip only the internal text direction. Wait, instructions say:
        // split_image_left: image x: 0.60, text x: 6.60
        // split_image_right: image x: 7.13, text x: 0.60
        // I will use these exact coordinates.
        const imgX = isImageLeft ? 0.60 : 7.13;
        const textX = isImageLeft ? 6.60 : 0.60;
        
        const b64 = prefetchB64;
        if (b64) {
           slide.addImage({ data: `image/jpeg;base64,${b64}`, x: imgX, y: 1.85, w: 5.60, h: 4.60, sizing: { type: 'cover', w: 5.60, h: 4.60 } });
        } else {
           slide.addShape("rect", { x: imgX, y: 1.85, w: 5.60, h: 4.60, fill: { color: P.card }, line: { type: 'none' } });
        }
        
        const mainText = slideData.content.text || '';
        if (mainText) {
           const fitRes = assertFits(mainText, 6.13, 2.0, 18, 12);
           slide.addText(fitRes.text, textOpts(fitRes.text, { x: textX, y: 1.85, w: 6.13, h: 2.0, fontSize: fitRes.fs, fontFace: fontName, color: P.muted, margin: 0 }));
        }
        
        if (slideData.content.bulletPoints?.length) {
           const bullets = slideData.content.bulletPoints.map(b => ({ text: b, options: { bullet: true, breakLine: true } }));
           if (bullets.length > 0) delete (bullets[bullets.length - 1].options as any).breakLine; // Rule 8
           slide.addText(bullets as any, textOpts(bullets[0].text, { x: textX, y: mainText ? 4.0 : 1.85, w: 6.13, h: 2.6, fontSize: 16, fontFace: fontName, color: P.muted, margin: 0, paraSpaceAfter: 10 }));
        }
      }
      else if (layoutTemplate === 'three_cards') {
        const cardsArr = slideData.content.cards || [];
        const xPos = isRtl ? [...COORDS.COLS.C3_X].reverse() : COORDS.COLS.C3_X;
        
        // Compute max height for the row
        let rowH = 3.5;
        const hArr = cardsArr.slice(0, 3).map(c => cardHeight(c.text, COORDS.COLS.C3_W, 14));
        if (hArr.length > 0) rowH = Math.max(...hArr);
        
        cardsArr.slice(0, 3).forEach((c, idx) => {
          const cardX = xPos[idx];
          card(slide, { x: cardX, y: 2.00, w: 3.84, h: rowH, fill: P.card });
          
          const iconB64 = prefetchIconMap.get(i)?.get(idx);
          if (iconB64) {
             badge(slide, cardX + 2.89, 2.35, 0.55, "", P.card2, P.text);
             slide.addImage({ data: `image/png;base64,${iconB64}`, x: cardX + 2.89, y: 2.35, w: 0.55, h: 0.55 });
          }
          
          const titleFit = assertFits(c.title, 3.24, 0.45, 18, 14);
          slide.addText(titleFit.text, textOpts(titleFit.text, { x: cardX + 0.30, y: 3.10, w: 3.24, h: 0.45, fontSize: titleFit.fs, fontFace: fontName, color: P.text, bold: true, margin: 0 }));
          
          const bodyFit = assertFits(c.text, 3.24, rowH - 1.6, 14, 12);
          slide.addText(bodyFit.text, textOpts(bodyFit.text, { x: cardX + 0.30, y: 3.62, w: 3.24, h: rowH - 1.6, fontSize: bodyFit.fs, fontFace: fontName, color: P.muted, margin: 0 }));
        });
      }
      else if (layoutTemplate === 'two_columns') {
        const cardsArr = slideData.content.cards || [];
        const xPos = isRtl ? [...COORDS.COLS.C2_X].reverse() : COORDS.COLS.C2_X;
        
        let rowH = 3.9;
        const hArr = cardsArr.slice(0, 2).map(c => cardHeight(c.text, COORDS.COLS.C2_W, 14));
        if (hArr.length > 0) rowH = Math.max(...hArr);
        
        cardsArr.slice(0, 2).forEach((c, idx) => {
          const cardX = xPos[idx];
          card(slide, { x: cardX, y: 1.95, w: 5.92, h: rowH, fill: P.card });
          
          const titleFit = assertFits(c.title, 5.32, 0.40, 20, 16);
          slide.addText(titleFit.text, textOpts(titleFit.text, { x: cardX + 0.30, y: 2.25, w: 5.32, h: 0.40, fontSize: titleFit.fs, fontFace: fontName, color: P.text, bold: true, margin: 0 }));
          
          const bodyFit = assertFits(c.text, 5.32, rowH - 1.1, 14, 12);
          slide.addText(bodyFit.text, textOpts(bodyFit.text, { x: cardX + 0.30, y: 2.75, w: 5.32, h: rowH - 1.1, fontSize: bodyFit.fs, fontFace: fontName, color: P.muted, margin: 0 }));
        });
      }
      else if (layoutTemplate === 'icon_list') {
        const cardsArr = slideData.content.cards || [];
        cardsArr.slice(0, 6).forEach((c, idx) => {
          const rowY = 1.90 + (idx * 1.03);
          slide.addShape("rect", { x: 0.60, y: rowY, w: 12.13, h: 0.95, fill: { color: P.card }, line: { type: "none" } });
          
          if (isRtl) {
            badge(slide, 11.98, rowY + 0.20, 0.50, "", P.accent, P.text);
            const iconB64 = prefetchIconMap.get(i)?.get(idx);
            if (iconB64) {
               slide.addImage({ data: `image/png;base64,${iconB64}`, x: 11.98, y: rowY + 0.20, w: 0.50, h: 0.50 });
            }
            slide.addText(c.title, textOpts(c.title, { x: 8.50, y: rowY, w: 2.50, h: 0.95, fontSize: 16, fontFace: fontName, color: P.text, bold: true, margin: 0 }));
            slide.addText(c.text, textOpts(c.text, { x: 0.90, y: rowY, w: 7.40, h: 0.95, fontSize: 14, fontFace: fontName, color: P.muted, margin: 0 }));
          } else {
            badge(slide, 0.80, rowY + 0.20, 0.50, "", P.accent, P.text);
            const iconB64 = prefetchIconMap.get(i)?.get(idx);
            if (iconB64) {
               slide.addImage({ data: `image/png;base64,${iconB64}`, x: 0.80, y: rowY + 0.20, w: 0.50, h: 0.50 });
            }
            slide.addText(c.title, textOpts(c.title, { x: 1.50, y: rowY, w: 2.50, h: 0.95, fontSize: 16, fontFace: fontName, color: P.text, bold: true, margin: 0 }));
            slide.addText(c.text, textOpts(c.text, { x: 4.20, y: rowY, w: 7.40, h: 0.95, fontSize: 14, fontFace: fontName, color: P.muted, margin: 0 }));
          }
        });
      }
      else {
        // default: bullet_list
        const mainText = slideData.content.text || '';
        if (mainText) {
           const fitRes = assertFits(mainText, 12.13, 1.2, 18, 14);
           slide.addText(fitRes.text, textOpts(fitRes.text, { x: 0.60, y: 1.85, w: 12.13, h: 1.2, fontSize: fitRes.fs, fontFace: fontName, color: P.muted, margin: 0 }));
        }
        
        if (slideData.content.bulletPoints?.length) {
           const bullets = slideData.content.bulletPoints.map(b => ({ text: b, options: { bullet: true, breakLine: true } }));
           if (bullets.length > 0) delete (bullets[bullets.length - 1].options as any).breakLine;
           slide.addText(bullets as any, textOpts(bullets[0].text, { x: 0.60, y: mainText ? 3.2 : 1.85, w: 12.13, h: 3.0, fontSize: 16, fontFace: fontName, color: P.muted, margin: 0, paraSpaceAfter: 12 }));
        }
      }
    }
    
    const buffer = await pres.write({ outputType: "nodebuffer" });
    return (buffer as Buffer).toString('base64');
  }
}
