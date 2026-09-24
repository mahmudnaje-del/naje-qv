import type { SupportedLocale } from '../types';

/** Flat UI packs. Keys are dotted strings such as `cv.hero.title`. */
export type LocalePack = Record<SupportedLocale, Record<string, string>>;

export const EMPTY_LOCALES: LocalePack = {
  ar: {},
  en: {},
  es: {},
  fr: {},
  de: {},
  pt: {},
};
