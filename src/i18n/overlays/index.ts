import type { SupportedLocale } from '../types';
import { appChatPack } from './appChat';
import { appCreativePack } from './appCreative';
import { appShellPack } from './appShell';
import { appToolsPack } from './appTools';
import { cvPack } from './cv';
import { motionPack } from './motion';
import { promptPack } from './prompt';
import { welcomePack } from './welcome';
import type { LocalePack } from './types';

export const OVERLAY_PACKS: LocalePack[] = [
  welcomePack,
  cvPack,
  motionPack,
  promptPack,
  appChatPack,
  appCreativePack,
  appShellPack,
  appToolsPack,
];

export function lookupOverlay(locale: SupportedLocale, key: string): string | undefined {
  const order: SupportedLocale[] = locale === 'ar' ? ['ar'] : [locale, 'en', 'ar'];
  for (const pack of OVERLAY_PACKS) {
    for (const loc of order) {
      const value = pack[loc]?.[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
  }
  return undefined;
}

/** Missing keys in core non-Arabic locales, compared with Arabic overlay strings. */
export function overlayParityGaps(): string[] {
  const gaps: string[] = [];
  const names = ['welcome', 'cv', 'motion', 'prompt', 'appChat', 'appCreative', 'appShell', 'appTools'] as const;
  OVERLAY_PACKS.forEach((pack, i) => {
    const arKeys = Object.keys(pack.ar || {});
    for (const locale of ['en', 'es', 'fr', 'de', 'pt'] as const) {
      for (const key of arKeys) {
        const value = pack[locale]?.[key];
        if (typeof value !== 'string' || !value.trim()) {
          gaps.push(`${names[i]}:${locale}:${key}`);
        }
      }
    }
  });
  return gaps;
}
