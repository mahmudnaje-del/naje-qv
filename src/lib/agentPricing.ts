/**
 * Shared Deterministic Pricing Engine for Naje Agent (Autonoma).
 * Unifies all tool cost calculations with Naje's central pricing configuration.
 *
 * Rules:
 * - image_studio: Base image rate (Spectra/Nova/Standard = 1.0) + 0.1 pt per reference image
 * - video_director: 0.5 points per second * resolution multiplier (720p=1.0, 1080p=1.6)
 * - document_architect:
 *     - PPTX/Slides: <=10 slides = 3 pts, >10 slides = 6 pts (+1 pt per exclusive AI image)
 *     - PDF/Booklet: <=5 pages = 2 pts, 6-15 pages = 4 pts, >15 pages = 6 pts (+1 pt per exclusive AI image)
 * - voice_narration: Admin-configurable (default 4 pts per clip)
 * - brand_identity: Admin-configurable (default 3 pts)
 * - web_grounding: Admin-configurable (default 2 pts)
 * - fullstack_engineer: Admin-configurable (default 10 pts)
 */

export interface PricingConfig {
  image?: {
    liteBase?: number;
    base?: number;
    spectra?: number;
    nova?: number;
    imageAddon?: number;
    qualityMultiplier?: Record<string, number>;
  };
  video?: {
    perSecond?: number;
    editMultiplier?: number;
    imageAddon?: number;
    resolutionMultiplier?: Record<string, number>;
  };
  document?: {
    pptx_bracket1_max?: number;
    pptx_bracket1_cost?: number;
    pptx_bracket2_cost?: number;
    word_bracket1_max?: number;
    word_bracket1_cost?: number;
    word_bracket2_cost?: number;
  };
  ui?: {
    perGeneration?: number;
    editMultiplier?: number;
    tierMultiplier?: Record<string, number>;
  };
  voice?: {
    costPerAudioSecond?: number;
    costPerClip?: number;
    per100Words?: number;
  };
  agent?: {
    brand_identity?: number;
    web_grounding?: number;
    fullstack_engineer?: number;
    voice_narration?: number;
    infographic_designer?: number;
  };
  infographic?: {
    renderFee?: number;
    editMultiplier?: number;
  };
}

export function getAgentToolCost(
  toolName: string,
  inputParams: Record<string, any> = {},
  pricing: PricingConfig = {}
): number {
  const p = pricing || {};
  const imagePricing = p.image || {};
  const videoPricing = p.video || {};
  const docPricing = p.document || {};
  const voicePricing = p.voice || {};
  const agentPricing = p.agent || {};

  switch (toolName) {
    case 'image_studio': {
      const count = Number(inputParams?.count || inputParams?.imagesCount) || 1;
      const refCount = Number(
        inputParams?.referenceImagesCount ||
        (Array.isArray(inputParams?.referenceImages) ? inputParams.referenceImages.length : 0)
      ) || 0;
      const baseCost = Number(imagePricing.base ?? imagePricing.spectra ?? 1);
      const addon = Number(imagePricing.imageAddon ?? 0.1) * refCount;
      const costPerImage = baseCost + addon;
      return parseFloat((costPerImage * count).toFixed(2));
    }

    case 'video_director': {
      const durationSec = Number(inputParams?.durationSeconds || inputParams?.durationSec || inputParams?.duration) || 5;
      const perSec = Number(videoPricing.perSecond ?? 0.5);
      const is1080p = inputParams?.resolution === '1080p' || inputParams?.resolution === '1080';
      const resMultiplier = is1080p
        ? Number(videoPricing.resolutionMultiplier?.['1080p'] ?? 1.6)
        : 1.0;
      const cost = durationSec * perSec * resMultiplier;
      return parseFloat(Math.max(0.5, cost).toFixed(2));
    }

    case 'document_architect': {
      const isSlides =
        inputParams?.docType === 'slides' ||
        inputParams?.docType === 'pptx' ||
        inputParams?.format === 'pptx' ||
        !!inputParams?.slidesCount;
      const aiImagesCount = Number(inputParams?.aiImagesCount) || 0;

      if (isSlides) {
        const slides = Number(inputParams?.slidesCount || inputParams?.pagesCount) || 8;
        const b1Max = Number(docPricing.pptx_bracket1_max ?? 10);
        const b1Cost = Number(docPricing.pptx_bracket1_cost ?? 3);
        const b2Cost = Number(docPricing.pptx_bracket2_cost ?? 6);
        const baseDocCost = slides <= b1Max ? b1Cost : b2Cost;
        return parseFloat((baseDocCost + aiImagesCount * 1.0).toFixed(2));
      } else {
        const pages = Number(inputParams?.pagesCount || inputParams?.pages || inputParams?.chaptersCount) || 4;
        const w1Max = Number(docPricing.word_bracket1_max ?? 5);
        const w1Cost = Number(docPricing.word_bracket1_cost ?? 2);
        const w2Cost = Number(docPricing.word_bracket2_cost ?? 4);
        const baseDocCost = pages <= w1Max ? w1Cost : (pages <= 15 ? w2Cost : 6);
        return parseFloat((baseDocCost + aiImagesCount * 1.0).toFixed(2));
      }
    }

    case 'voice_narration': {
      const clipBase = agentPricing.voice_narration ?? voicePricing.costPerClip ?? 4;
      return parseFloat(Number(clipBase).toFixed(2));
    }

    case 'brand_identity': {
      const cost = agentPricing.brand_identity ?? 3;
      return parseFloat(Number(cost).toFixed(2));
    }

    case 'web_grounding': {
      const cost = agentPricing.web_grounding ?? 2;
      return parseFloat(Number(cost).toFixed(2));
    }

    case 'fullstack_engineer': {
      const baseCost = Number(agentPricing.fullstack_engineer ?? 6);
      const plannedFiles = inputParams?.plannedFiles || inputParams?.files;
      const fileCount = Array.isArray(plannedFiles)
        ? plannedFiles.length
        : Number(inputParams?.filesCount || inputParams?.fileCount || inputParams?.estimatedFilesCount || 16);
      const perFileCost = 0.5;
      const totalCost = baseCost + Math.max(1, fileCount) * perFileCost;
      return parseFloat(Number(totalCost).toFixed(2));
    }

    case 'infographic_designer': {
      const renderFee = Number(agentPricing.infographic_designer ?? p.infographic?.renderFee ?? 0.5);
      return parseFloat(renderFee.toFixed(2));
    }

    default:
      return 5;
  }
}

export interface TextTokenRates {
  inputPer1000: number;
  outputPer1000: number;
  audioInputPer1000?: number;
}

export const DEFAULT_TEXT_TOKEN_RATES: Record<string, TextTokenRates> = {
  'gemini-3.5-flash-lite': { inputPer1000: 0.1, outputPer1000: 0.1, audioInputPer1000: 0.2 },
  'gemini-3.6-flash': { inputPer1000: 0.1, outputPer1000: 0.1, audioInputPer1000: 0.2 },
  'gemini-3.1-pro': { inputPer1000: 0.1, outputPer1000: 0.1, audioInputPer1000: 0.2 },
  'gemini-3.1-pro-preview': { inputPer1000: 0.1, outputPer1000: 0.1, audioInputPer1000: 0.2 },
};

/**
 * Calculates point cost for a given text token usage.
 */
export function calculateTokenCost(
  inputTokens: number,
  outputTokens: number,
  rates: TextTokenRates = { inputPer1000: 0.1, outputPer1000: 0.1 }
): number {
  const inputCost = (Math.max(0, inputTokens) / 1000) * (rates.inputPer1000 ?? 0.1);
  const outputCost = (Math.max(0, outputTokens) / 1000) * (rates.outputPer1000 ?? 0.1);
  return parseFloat((inputCost + outputCost).toFixed(4));
}

