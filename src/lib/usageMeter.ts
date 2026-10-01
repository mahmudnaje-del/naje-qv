/**
 * Official list rates (USD per 1M tokens, paid tier, Oct 2026) used only as
 * the admin real-cost seed. Point charges still come from model_endpoints.
 * Output includes thinking tokens when the API reports them in usageMetadata.
 */
export const GEMINI_LIST_USD_PER_1M = {
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
  'gemini-3-flash-preview': { input: 0.5, output: 3 },
  'gemini-3.1-pro-preview': { input: 2, output: 12 },
  'gemini-3.5-flash-lite': { input: 0.3, output: 2.5 },
  'gemini-3.6-flash': { input: 0.75, output: 3.75 },
} as const;

export const VEO_LIST_USD_PER_SECOND = {
  'veo-3.1-lite': { p720: 0.05, p1080: 0.08 },
  'veo-3.1-fast': { p720: 0.1, p1080: 0.12, p4k: 0.3 },
  'veo-3.1': { p720: 0.4, p1080: 0.4, p4k: 0.6 },
} as const;

export interface UsageQuote {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  thoughtsTokens: number;
  usd: number;
  points: number;
}

export function quoteUsage(
  usageMetadata: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    cachedContentTokenCount?: number;
    thoughtsTokenCount?: number;
  } | undefined,
  rates: { inputUsdPer1M: number; outputUsdPer1M: number; pointUsd?: number }
): UsageQuote {
  const inputTokens = Number(usageMetadata?.promptTokenCount || 0);
  const candidates = Number(usageMetadata?.candidatesTokenCount || 0);
  const thoughtsTokens = Number(usageMetadata?.thoughtsTokenCount || 0);
  const cachedTokens = Number(usageMetadata?.cachedContentTokenCount || 0);
  const outputTokens = candidates + thoughtsTokens;
  const uncached = Math.max(0, inputTokens - cachedTokens);
  const usd =
    (uncached / 1_000_000) * rates.inputUsdPer1M +
    (cachedTokens / 1_000_000) * rates.inputUsdPer1M * 0.25 +
    (outputTokens / 1_000_000) * rates.outputUsdPer1M;
  const pointUsd = rates.pointUsd ?? 0.02;
  return {
    inputTokens,
    outputTokens,
    cachedTokens,
    thoughtsTokens,
    usd: Number(usd.toFixed(6)),
    points: Number((usd / pointUsd).toFixed(4)),
  };
}
