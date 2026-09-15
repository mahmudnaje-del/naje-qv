export type InfographicThemeKey =
  | 'dark_luxury_gold'
  | 'cyber_neon'
  | 'ocean_blue'
  | 'forest_emerald'
  | 'sunset_coral'
  | 'royal_purple'
  | 'minimal_light'
  | 'naje_auto_blend';

export interface InfographicThemeConfig {
  id: string;
  nameAr: string;
  descAr: string;
  bodyBg: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  titleGradient: string;
  accentColor: string;
  secondaryAccent: string;
  textColor: string;
  textMuted: string;
  chartPalette: string[];
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  isLight?: boolean;
}

export const INFOGRAPHIC_THEMES: Record<string, InfographicThemeConfig> = {
  dark_luxury_gold: {
    id: 'dark_luxury_gold',
    nameAr: 'ذهبي فاخر داكن (Luxury Gold)',
    descAr: 'خلفية كحلية داكنة مع لمسات ذهبية ملكية راقية وإضاءة ناعمة',
    bodyBg: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0b0c16 60%, #05050b 100%)',
    cardBg: 'linear-gradient(145deg, rgba(30, 27, 75, 0.75), rgba(15, 12, 41, 0.95))',
    cardBorder: 'rgba(251, 191, 36, 0.3)',
    cardShadow: '0 10px 25px rgba(0,0,0,0.35)',
    titleGradient: 'linear-gradient(135deg, #ffffff 30%, #fbbf24 100%)',
    accentColor: '#fbbf24',
    secondaryAccent: '#6366f1',
    textColor: '#f8fafc',
    textMuted: '#94a3b8',
    chartPalette: ['#fbbf24', '#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899'],
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    badgeBorder: 'rgba(251, 191, 36, 0.3)',
    badgeText: '#fde68a',
  },
  cyber_neon: {
    id: 'cyber_neon',
    nameAr: 'سايبر نيون مستقبلي (Cyber Neon)',
    descAr: 'طابع مستقبلي بتوهج أزرق سماوي وبنفسجي ساطع',
    bodyBg: 'radial-gradient(circle at 50% 0%, #0f172a 0%, #030712 60%, #000000 100%)',
    cardBg: 'linear-gradient(145deg, rgba(15, 23, 42, 0.85), rgba(3, 7, 18, 0.95))',
    cardBorder: 'rgba(56, 189, 248, 0.3)',
    cardShadow: '0 10px 30px rgba(56, 189, 248, 0.15)',
    titleGradient: 'linear-gradient(135deg, #38bdf8 0%, #c084fc 100%)',
    accentColor: '#38bdf8',
    secondaryAccent: '#c084fc',
    textColor: '#f0f9ff',
    textMuted: '#94a3b8',
    chartPalette: ['#38bdf8', '#c084fc', '#4ade80', '#fb7185', '#facc15', '#818cf8'],
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    badgeText: '#7dd3fc',
  },
  ocean_blue: {
    id: 'ocean_blue',
    nameAr: 'أزرق محيطي تقني (Ocean Blue)',
    descAr: 'تدرجات الأزرق الياقوتي والمحيطي الموثوق للأعمال والتقنية',
    bodyBg: 'radial-gradient(circle at 50% 0%, #0c4a6e 0%, #082f49 50%, #03131e 100%)',
    cardBg: 'linear-gradient(145deg, rgba(12, 74, 110, 0.65), rgba(8, 47, 73, 0.9))',
    cardBorder: 'rgba(14, 165, 233, 0.3)',
    cardShadow: '0 10px 25px rgba(0,0,0,0.3)',
    titleGradient: 'linear-gradient(135deg, #ffffff 30%, #38bdf8 100%)',
    accentColor: '#38bdf8',
    secondaryAccent: '#0ea5e9',
    textColor: '#f8fafc',
    textMuted: '#93c5fd',
    chartPalette: ['#38bdf8', '#0ea5e9', '#60a5fa', '#34d399', '#f59e0b', '#a78bfa'],
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.3)',
    badgeText: '#bae6fd',
  },
  forest_emerald: {
    id: 'forest_emerald',
    nameAr: 'زمردي واستثماري (Emerald Growth)',
    descAr: 'ألوان النمو الأخضر والزمردي المهدئة للتقارير المالية والبيئية',
    bodyBg: 'radial-gradient(circle at 50% 0%, #064e3b 0%, #022c22 60%, #011611 100%)',
    cardBg: 'linear-gradient(145deg, rgba(6, 78, 59, 0.65), rgba(2, 44, 34, 0.9))',
    cardBorder: 'rgba(16, 185, 129, 0.3)',
    cardShadow: '0 10px 25px rgba(0,0,0,0.3)',
    titleGradient: 'linear-gradient(135deg, #ffffff 30%, #34d399 100%)',
    accentColor: '#34d399',
    secondaryAccent: '#10b981',
    textColor: '#f8fafc',
    textMuted: '#a7f3d0',
    chartPalette: ['#34d399', '#10b981', '#fbbf24', '#38bdf8', '#a78bfa', '#f87171'],
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    badgeBorder: 'rgba(52, 211, 153, 0.3)',
    badgeText: '#a7f3d0',
  },
  sunset_coral: {
    id: 'sunset_coral',
    nameAr: 'غروب دافئ ومرجاني (Sunset Coral)',
    descAr: 'تدرجات المرجان والوردي الداكن المبهجة للإحصائيات الحيوية',
    bodyBg: 'radial-gradient(circle at 50% 0%, #4c0519 0%, #1c030c 60%, #0d0106 100%)',
    cardBg: 'linear-gradient(145deg, rgba(76, 5, 25, 0.7), rgba(28, 3, 12, 0.95))',
    cardBorder: 'rgba(244, 63, 94, 0.3)',
    cardShadow: '0 10px 25px rgba(0,0,0,0.35)',
    titleGradient: 'linear-gradient(135deg, #ffffff 20%, #fb7185 70%, #fbbf24 100%)',
    accentColor: '#fb7185',
    secondaryAccent: '#fbbf24',
    textColor: '#fff1f2',
    textMuted: '#fda4af',
    chartPalette: ['#fb7185', '#fbbf24', '#f43f5e', '#c084fc', '#38bdf8', '#4ade80'],
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeBorder: 'rgba(244, 63, 94, 0.3)',
    badgeText: '#fecdd3',
  },
  royal_purple: {
    id: 'royal_purple',
    nameAr: 'بنفسجي ملكي إبداعي (Royal Violet)',
    descAr: 'أناقة البنفسجي الإمبراطوري مع لمسات الذهب لمشاريع الفخامة',
    bodyBg: 'radial-gradient(circle at 50% 0%, #3b0764 0%, #170326 60%, #0b0113 100%)',
    cardBg: 'linear-gradient(145deg, rgba(59, 7, 100, 0.7), rgba(23, 3, 38, 0.95))',
    cardBorder: 'rgba(168, 85, 247, 0.3)',
    cardShadow: '0 10px 25px rgba(0,0,0,0.35)',
    titleGradient: 'linear-gradient(135deg, #ffffff 30%, #c084fc 100%)',
    accentColor: '#c084fc',
    secondaryAccent: '#a855f7',
    textColor: '#faf5ff',
    textMuted: '#d8b4fe',
    chartPalette: ['#c084fc', '#a855f7', '#fbbf24', '#38bdf8', '#34d399', '#f43f5e'],
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.3)',
    badgeText: '#e9d5ff',
  },
  minimal_light: {
    id: 'minimal_light',
    nameAr: 'أبيض ناصع وأنيق (Minimal Clean Light)',
    descAr: 'تصميم مشرق وعالي الوضوح بخلفية فاتحة وبطاقات بيضاء ناصعة',
    bodyBg: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
    cardBg: '#ffffff',
    cardBorder: 'rgba(203, 213, 225, 0.8)',
    cardShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
    titleGradient: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)',
    accentColor: '#2563eb',
    secondaryAccent: '#f59e0b',
    textColor: '#0f172a',
    textMuted: '#64748b',
    chartPalette: ['#2563eb', '#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#ef4444'],
    badgeBg: 'rgba(37, 99, 235, 0.08)',
    badgeBorder: 'rgba(37, 99, 235, 0.25)',
    badgeText: '#1d4ed8',
    isLight: true,
  },
  naje_auto_blend: {
    id: 'naje_auto_blend',
    nameAr: 'دمج وتناغم ذكي يختاره ناجي (Smart Auto Blend)',
    descAr: 'توليف وتناسق لوني هجين يختاره ناجي بذكاء وفق موضوع المحتوى',
    bodyBg: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0b0c16 60%, #05050b 100%)',
    cardBg: 'linear-gradient(145deg, rgba(30, 27, 75, 0.75), rgba(15, 12, 41, 0.95))',
    cardBorder: 'rgba(99, 102, 241, 0.3)',
    cardShadow: '0 10px 25px rgba(0,0,0,0.35)',
    titleGradient: 'linear-gradient(135deg, #ffffff 30%, #fbbf24 100%)',
    accentColor: '#fbbf24',
    secondaryAccent: '#6366f1',
    textColor: '#f8fafc',
    textMuted: '#94a3b8',
    chartPalette: ['#fbbf24', '#6366f1', '#38bdf8', '#10b981', '#ec4899', '#f97316'],
    badgeBg: 'rgba(99, 102, 241, 0.15)',
    badgeBorder: 'rgba(99, 102, 241, 0.3)',
    badgeText: '#a5b4fc',
  }
};
