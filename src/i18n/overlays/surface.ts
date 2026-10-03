import type { LocalePack } from './types';
import { ALL_OVERLAY_LOCALES } from './types';
import { surfaceChrome } from './surfaceChrome';
import { surfaceStudio } from './surfaceStudio';

function merge(parts: LocalePack[]): LocalePack {
  const out: LocalePack = { ar: {}, en: {} };
  for (const loc of ALL_OVERLAY_LOCALES) {
    const bag: Record<string, string> = {};
    for (const part of parts) Object.assign(bag, part[loc] || {});
    out[loc] = bag;
  }
  return out;
}

/** Studio empty states, live activity, and chrome that used to stay in one language. */
export const surfacePack: LocalePack = merge([surfaceStudio, surfaceChrome]);
