import type { SupportedLocale } from '../types';
import { appChatPack } from './appChat';
import { appCreativePack } from './appCreative';
import { appShellPack } from './appShell';
import { appToolsPack } from './appTools';
import { cvPack } from './cv';
import { motionPack } from './motion';
import { promptPack } from './prompt';
import { welcomePack } from './welcome';
import { promptTenPack } from './promptTen';
import { studioTenPack } from './studioTen';
import { creativeTenPack } from './creativeTen';
import { toolsTenPack } from './toolsTen';
import { omniversePack } from './omniverse';
import type { LocalePack } from './types';
import { ALL_OVERLAY_LOCALES } from './types';
import { completePack } from './complete';

const RAW_PACKS: LocalePack[] = [
  welcomePack,
  promptTenPack,
  studioTenPack,
  creativeTenPack,
  toolsTenPack,
  omniversePack,
  cvPack,
  motionPack,
  promptPack,
  appChatPack,
  appCreativePack,
  appShellPack,
  appToolsPack,
];

export const OVERLAY_PACKS: LocalePack[] = RAW_PACKS.map(completePack);

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

/** Missing keys in every non-Arabic locale, compared with Arabic overlay strings. */
export function overlayParityGaps(): string[] {
  const gaps: string[] = [];
  const names = [
    'welcome',
    'promptTen',
    'studioTen',
    'creativeTen',
    'toolsTen',
    'omniverse',
    'cv',
    'motion',
    'prompt',
    'appChat',
    'appCreative',
    'appShell',
    'appTools',
  ] as const;
  OVERLAY_PACKS.forEach((pack, i) => {
    const arKeys = Object.keys(pack.ar || {});
    for (const locale of ALL_OVERLAY_LOCALES) {
      if (locale === 'ar') continue;
      for (const key of arKeys) {
        const value = pack[locale]?.[key];
        if (typeof value !== 'string' || !value.trim()) {
          gaps.push(`${names[i] || i}:${locale}:${key}`);
        }
      }
    }
  });
  return gaps;
}

/** Keys that exist in English but the given locale still equals English after completePack. */
export function englishFallbackKeys(locale: SupportedLocale, pack: LocalePack): string[] {
  if (locale === 'en') return [];
  const en = pack.en || {};
  const loc = pack[locale] || {};
  return Object.keys(en).filter((key) => loc[key] === en[key]);
}
