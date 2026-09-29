export type SupportedLocale =
  | 'ar'
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'pt'
  | 'tr'
  | 'id'
  | 'ja'
  | 'ru';
export type Direction = 'rtl' | 'ltr';

export interface LocaleMeta {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  dir: Direction;
  flag: string;
}

/** Nested dictionary used by locale files. Structural match with the existing packs. */
export type TranslationSchema = {
  common: Record<string, string>;
  nav: Record<string, string>;
  auth: Record<string, string>;
  chat: Record<string, string>;
  projects: Record<string, string>;
  favorites: Record<string, string>;
  settings: Record<string, string>;
  store: Record<string, string>;
  onboarding: Record<string, string>;
  termsModal: Record<string, string>;
  najeModules: Record<string, string>;
  studio: Record<string, string>;
  notFound: Record<string, string>;
  smartGateway: Record<string, string>;
  recharge: Record<string, string>;
  themeStudio: Record<string, string>;
  notifications: Record<string, string>;
  najeIdent: Record<string, string>;
  paywall: Record<string, string>;
  legal: Record<string, string>;
};
