import { useState, useEffect } from 'react';

export interface PricingConfig {
  image: {
    liteBase: number;
    liteEdit?: number;
    base: number;
    edit?: number;
    proBase: number;
    proEdit?: number;
    imageAddon: number;
    qualityMultiplier?: { standard: number; hd: number; ultra?: number };
  };
  video: {
    perSecond: number;
    editMultiplier?: number;
    imageAddon: number;
    resolutionMultiplier?: { '720p': number; '1080p': number };
  };
  document: {
    a4PerPage: number;
    a5PerPage: number;
    pdf_per_slide: number;
    pptx_bracket1_max?: number;
    pptx_bracket1_cost?: number;
    pptx_bracket2_cost?: number;
    word_bracket1_max?: number;
    word_bracket1_cost?: number;
    word_bracket2_cost?: number;
  };
  ui: {
    perGeneration: number;
    editMultiplier?: number;
    tierMultiplier?: Record<string, number>;
  };
  voice: {
    costPerAudioSecond: number;
    estimatedWordsPerMinute: number;
    minCost?: number;
  };
  agent?: Record<string, number>;
  najeAd?: {
    enabled: boolean;
    pointsRatePerSecond: number;
    durationOptionsSec: number[];
    maxShotsPerVideo: number;
    defaultModelEndpointId: string;
  };
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  image: {
    liteBase: 0.5,
    liteEdit: 0.25,
    base: 1.0,
    edit: 0.5,
    proBase: 1.5,
    proEdit: 0.75,
    imageAddon: 0.1,
    qualityMultiplier: { standard: 1.0, hd: 1.5, ultra: 2.4 }
  },
  video: {
    perSecond: 0.5,
    editMultiplier: 0.7,
    imageAddon: 0.1,
    resolutionMultiplier: { '720p': 1.0, '1080p': 1.6 }
  },
  document: {
    a4PerPage: 0.15,
    a5PerPage: 0.10,
    pdf_per_slide: 0.20,
    pptx_bracket1_max: 10,
    pptx_bracket1_cost: 3,
    pptx_bracket2_cost: 6,
    word_bracket1_max: 5,
    word_bracket1_cost: 2,
    word_bracket2_cost: 4
  },
  ui: {
    perGeneration: 1.0,
    editMultiplier: 0.5,
    tierMultiplier: { lite: 0.6, core: 1.0, max: 2.0 }
  },
  voice: {
    costPerAudioSecond: 0.02,
    estimatedWordsPerMinute: 140,
    minCost: 0.10
  },
  najeAd: {
    enabled: true,
    pointsRatePerSecond: 2.5,
    durationOptionsSec: [4, 6, 8, 10, 12, 14, 16, 24, 30],
    maxShotsPerVideo: 4,
    defaultModelEndpointId: 'video_standard'
  }
};

let cachedPricing: PricingConfig | null = null;
let fetchPromise: Promise<PricingConfig> | null = null;

export async function fetchCurrentPricing(): Promise<PricingConfig> {
  if (cachedPricing) return cachedPricing;
  if (!fetchPromise) {
    fetchPromise = fetch('/api/pricing/current')
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to fetch pricing config');
        const data = await r.json();
        if (data && typeof data === 'object') {
          // Merge defaults with returned payload to guarantee all fields exist
          const merged: PricingConfig = {
            image: { ...DEFAULT_PRICING_CONFIG.image, ...(data.image || {}) },
            video: { ...DEFAULT_PRICING_CONFIG.video, ...(data.video || {}) },
            document: { ...DEFAULT_PRICING_CONFIG.document, ...(data.document || {}) },
            ui: { ...DEFAULT_PRICING_CONFIG.ui, ...(data.ui || {}) },
            voice: { ...DEFAULT_PRICING_CONFIG.voice, ...(data.voice || {}) },
            agent: { ...(data.agent || {}) },
            najeAd: { ...DEFAULT_PRICING_CONFIG.najeAd, ...(data.najeAd || {}) }
          };
          cachedPricing = merged;
          return merged;
        }
        return DEFAULT_PRICING_CONFIG;
      })
      .catch((err) => {
        console.warn('[usePricingConfig] Failed to fetch live pricing, fallback to defaults:', err);
        return DEFAULT_PRICING_CONFIG;
      })
      .finally(() => {
        fetchPromise = null;
      });
  }
  return fetchPromise;
}

/**
 * Custom hook providing live system-wide pricing configuration.
 * Automatically fetches from `/api/pricing/current` and updates state.
 */
export function usePricingConfig(): PricingConfig {
  const [pricing, setPricing] = useState<PricingConfig>(cachedPricing || DEFAULT_PRICING_CONFIG);

  useEffect(() => {
    fetchCurrentPricing().then((data) => {
      setPricing(data);
    });
  }, []);

  return pricing;
}
