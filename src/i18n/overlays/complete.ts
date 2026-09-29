import type { SupportedLocale } from '../types';
import type { LocalePack } from './types';
import { ALL_OVERLAY_LOCALES } from './types';

/**
 * Ensure every overlay pack exposes all 10 locales.
 * Missing locale maps (or missing keys inside a map) inherit English, then Arabic.
 */
export function completePack(pack: LocalePack): LocalePack {
  const ar = pack.ar || {};
  const en = pack.en || {};
  const refKeys = new Set([...Object.keys(ar), ...Object.keys(en)]);

  const out: LocalePack = { ar, en };

  for (const loc of ALL_OVERLAY_LOCALES) {
    const src = pack[loc] || {};
    const filled: Record<string, string> = { ...src };
    for (const key of refKeys) {
      const value = src[key] || en[key] || ar[key];
      if (typeof value === 'string' && value.length > 0) filled[key] = value;
    }
    out[loc] = filled;
  }

  return out;
}

export function packHasLocale(pack: LocalePack, locale: SupportedLocale, key: string): boolean {
  const value = pack[locale]?.[key];
  return typeof value === 'string' && value.trim().length > 0;
}
