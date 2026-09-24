import { SupportedLocale, Direction, LocaleMeta, TranslationSchema } from './types';
import { ar } from './locales/ar';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { pt } from './locales/pt';
import { useAppStore } from '../store';
import { lookupOverlay } from './overlays';

export * from './types';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['ar', 'en', 'es', 'fr', 'de', 'pt'] as const;

export const LOCALES_META: Record<SupportedLocale, LocaleMeta> = {
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  en: { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr', flag: '🇵🇹' },
};

export const DICTIONARIES: Record<SupportedLocale, TranslationSchema> = {
  ar,
  en,
  es,
  fr,
  de,
  pt,
};

export function getDirection(locale: SupportedLocale): Direction {
  return LOCALES_META[locale]?.dir || (locale === 'ar' ? 'rtl' : 'ltr');
}

export function isRTL(locale: SupportedLocale): boolean {
  return getDirection(locale) === 'rtl';
}

export function detectInitialLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem('naje_language') || localStorage.getItem('naje_locale');
    if (saved && SUPPORTED_LOCALES.includes(saved as SupportedLocale)) {
      return saved as SupportedLocale;
    }

    if (typeof navigator !== 'undefined' && navigator.language) {
      const code = navigator.language.split('-')[0].toLowerCase();
      if (SUPPORTED_LOCALES.includes(code as SupportedLocale)) {
        return code as SupportedLocale;
      }
    }
  } catch {
    // Ignore storage errors in restrictive environments
  }
  return 'ar';
}

export function applyLocaleToDocument(locale: SupportedLocale): void {
  if (typeof document === 'undefined') return;
  const dir = getDirection(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
  document.body.dir = dir;
}

/**
 * Access nested dictionary value with dot notation and parameter interpolation.
 * Falls back to Arabic if the key is missing in the chosen locale.
 */
export function translate(
  keyPath: string,
  params?: Record<string, string | number>,
  locale: SupportedLocale = 'ar'
): string {
  const dict = DICTIONARIES[locale] || DICTIONARIES.ar;
  const parts = keyPath.split('.');
  
  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      current = undefined;
      break;
    }
  }

  if (typeof current !== 'string') {
    const over = lookupOverlay(locale, keyPath);
    if (over) current = over;
  }

  // Fallback to Arabic schema, then Arabic overlay, then the key path.
  if (typeof current !== 'string') {
    let fallback: any = DICTIONARIES.ar;
    for (const part of parts) {
      if (fallback && typeof fallback === 'object' && part in fallback) {
        fallback = fallback[part];
      } else {
        fallback = undefined;
        break;
      }
    }
    if (typeof fallback === 'string') current = fallback;
  }

  if (typeof current !== 'string') {
    const overAr = lookupOverlay('ar', keyPath);
    if (overAr) current = overAr;
  }

  if (typeof current !== 'string') current = keyPath;

  let text: string = current;
  if (params && typeof text === 'string') {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
    }
  }

  return text;
}

export const t = translate;

/**
 * Locale-aware date and time formatting via standard Intl API
 */
export function formatLocaleDate(
  date: Date | number | string,
  locale: SupportedLocale = 'ar',
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    const intlLocale = locale === 'ar' ? 'ar-SA' : locale;
    return new Intl.DateTimeFormat(intlLocale, options || { dateStyle: 'medium' }).format(d);
  } catch {
    return String(date);
  }
}

/**
 * Locale-aware number formatting via standard Intl API
 */
export function formatLocaleNumber(
  num: number,
  locale: SupportedLocale = 'ar',
  options?: Intl.NumberFormatOptions
): string {
  try {
    const intlLocale = locale === 'ar' ? 'ar-SA' : locale;
    return new Intl.NumberFormat(intlLocale, options).format(num);
  } catch {
    return String(num);
  }
}

/**
 * Convenient React hook to consume and control i18n
 */
export function useI18n() {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const activeLocale: SupportedLocale = language || 'ar';
  const dir = getDirection(activeLocale);
  const isRtl = dir === 'rtl';

  const translateBound = (keyPath: string, params?: Record<string, string | number>) =>
    translate(keyPath, params, activeLocale);

  const formatDateBound = (date: Date | number | string, options?: Intl.DateTimeFormatOptions) =>
    formatLocaleDate(date, activeLocale, options);

  const formatNumberBound = (num: number, options?: Intl.NumberFormatOptions) =>
    formatLocaleNumber(num, activeLocale, options);

  return {
    locale: activeLocale,
    setLocale: setLanguage,
    dir,
    isRtl,
    t: translateBound,
    formatDate: formatDateBound,
    formatNumber: formatNumberBound,
    locales: LOCALES_META,
    supportedLocales: SUPPORTED_LOCALES,
  };
}

/** Catalog labels that store ar/en (and optionally the other locales). Non-Arabic UI prefers English over leftover Arabic. */
export function pickLocaleLabel(
  locale: SupportedLocale,
  labels: Partial<Record<SupportedLocale, string>> & { ar: string }
): string {
  const direct = labels[locale];
  if (typeof direct === 'string' && direct.trim()) return direct;
  if (locale !== 'ar' && labels.en?.trim()) return labels.en;
  return labels.ar;
}
