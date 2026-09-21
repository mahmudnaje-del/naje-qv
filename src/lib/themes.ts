export const THEME_UNLOCK_COST = 2;
export const DEFAULT_THEME_ID = 'violet' as const;

export const THEME_COLOR_IDS = [
  'azure',
  'emerald',
  'amber',
  'coral',
  'violet',
  'teal',
  'rose',
  'slate',
] as const;

export type ThemeColorId = (typeof THEME_COLOR_IDS)[number];

export type ThemeDef = {
  id: ThemeColorId;
  nameAr: string;
  nameEn: string;
  primary: string;
  secondary: string;
  free: boolean;
};

export const THEMES: ThemeDef[] = [
  { id: 'azure', nameAr: 'أزرق', nameEn: 'Azure', primary: '#3B8ED8', secondary: '#8EC9F2', free: false },
  { id: 'emerald', nameAr: 'أخضر', nameEn: 'Emerald', primary: '#2FA344', secondary: '#8FDC6A', free: false },
  { id: 'amber', nameAr: 'كهرماني', nameEn: 'Amber', primary: '#E07A22', secondary: '#F0B42A', free: false },
  { id: 'coral', nameAr: 'مرجاني', nameEn: 'Coral', primary: '#E85D56', secondary: '#F5A36A', free: false },
  { id: 'violet', nameAr: 'بنفسجي', nameEn: 'Violet', primary: '#7C5CFA', secondary: '#E394EA', free: true },
  { id: 'teal', nameAr: 'تيل', nameEn: 'Teal', primary: '#2BA4C6', secondary: '#7FE0D6', free: false },
  { id: 'rose', nameAr: 'وردي', nameEn: 'Rose', primary: '#C4456A', secondary: '#F4A78C', free: false },
  { id: 'slate', nameAr: 'رمادي', nameEn: 'Slate', primary: '#6B7280', secondary: '#B0B6BE', free: false },
];

export function isThemeColorId(value: unknown): value is ThemeColorId {
  return typeof value === 'string' && (THEME_COLOR_IDS as readonly string[]).includes(value);
}

export function getTheme(id: string | null | undefined): ThemeDef {
  return THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
}

export function isThemeUnlocked(
  user: { isAdmin?: boolean; unlockedThemes?: string[]; themeUnlocks?: string[] } | null | undefined,
  id: string | null | undefined,
): boolean {
  const theme = getTheme(id);
  if (theme.free) return true;
  if (!id || !isThemeColorId(id)) return false;
  if (user?.isAdmin) return true;
  const owned = [
    ...(Array.isArray(user?.unlockedThemes) ? user!.unlockedThemes! : []),
    ...(Array.isArray(user?.themeUnlocks) ? user!.themeUnlocks! : []),
  ];
  return owned.includes(id);
}

export function applyThemeToDocument(color: ThemeColorId, mode: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.najeColor = color;
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', mode === 'dark' ? '#0b0c10' : '#f6f3fb');
  }
}
