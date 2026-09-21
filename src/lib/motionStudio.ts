export type MotionKind = 'intro' | 'outro' | 'both' | 'logo';
export type IdentSlot = 'intro' | 'outro' | 'logo';
export type MotionDuration = 5 | 10;
export type MotionAspect = '16:9' | '9:16' | '1:1';
export type MotionRes = '720p' | '1080p';
export type MotionIntensity = 'subtle' | 'balanced' | 'dynamic';
export type MotionLanguage = 'ar' | 'en' | 'bilingual';
export type MotionPlatform = 'youtube' | 'tiktok' | 'instagram' | 'podcast' | 'corporate' | '';
export type MotionSound = 'none' | 'cinematic' | 'corporate' | 'digital' | 'impact' | 'whoosh' | 'minimal';
export type HeroPresetId = 'podcast' | 'channel';
export type StyleCategory = 'luxe' | 'broadcast' | 'energy' | 'learn';

export interface MotionDraft {
  kind: MotionKind;
  activePiece: 'intro' | 'outro';
  duration: MotionDuration;
  aspect: MotionAspect;
  resolution: MotionRes;
  brandName: string;
  tagline: string;
  industry: string;
  audience: string;
  language: MotionLanguage;
  logo: string | null;
  primary: string;
  secondary: string;
  bgColor: string;
  styleId: string;
  motion: string;
  intensity: MotionIntensity;
  camera: string;
  lighting: string;
  bgStyle: string;
  logoBehavior: string;
  textAnim: string;
  outroCta: string;
  customCta: string;
  vision: string;
  website: string;
  accent: string;
  textColor: string;
  platform: MotionPlatform;
  projectType: string;
  brandRules: string;
  brandLock: boolean;
  sound: MotionSound;
}

export interface MotionBeat {
  from: number;
  to: number;
  title: string;
  body: string;
}

export interface StyleTemplate {
  id: string;
  name: string;
  nameEn: string;
  hint: string;
  motionLevel: MotionIntensity;
  motionLevelAr: string;
  gradient: [string, string];
  defaults: Pick<
    MotionDraft,
    'motion' | 'intensity' | 'camera' | 'lighting' | 'bgStyle' | 'logoBehavior' | 'textAnim'
  >;
  audioHint: string;
  category: StyleCategory;
  categoryAr: string;
}

export const MOTION_STORAGE_KEY = 'naje-motion-draft-v1';
export const PROMPT_HANDOFF_KEY = 'naje-prompt-handoff';

export const KIND_OPTIONS: { id: MotionKind; ar: string; hint: string }[] = [
  { id: 'intro', ar: 'انترو', hint: 'افتتاح الحلقة قبل أن يبدأ المحتوى' },
  { id: 'outro', ar: 'أوترو', hint: 'كرت النهاية ودعوة واضحة' },
  { id: 'both', ar: 'الاثنان', hint: 'انترو ثم أوترو كعمليتين متتابعتين' },
  { id: 'logo', ar: 'تحريك الشعار', hint: 'وخزة تُحيي العلامة وتثبتها' },
];

export const HERO_PRESETS: {
  id: HeroPresetId;
  ar: string;
  hint: string;
  kind: MotionKind;
  styleId: string;
  patch: Partial<MotionDraft>;
}[] = [
  {
    id: 'podcast',
    ar: 'بودكاست',
    hint: 'إعداد جاهز: انترو دافئ بأسلوب بودكاست — ليست نوعاً جديداً للمحرّك',
    kind: 'intro',
    styleId: 'podcast',
    patch: {
      kind: 'intro',
      industry: 'podcast',
      styleId: 'podcast',
      projectType: 'podcast',
      platform: 'podcast',
      audience: 'creator',
    },
  },
  {
    id: 'channel',
    ar: 'حزمة قناة',
    hint: 'إعداد جاهز: انترو وأوترو سينمائي — عمليتان متتابعتان لا ملف واحد',
    kind: 'both',
    styleId: 'cinematic',
    patch: {
      kind: 'both',
      industry: 'channel',
      styleId: 'cinematic',
      projectType: 'channel',
      platform: 'youtube',
      audience: 'channel',
    },
  },
];

export const PLATFORMS: { id: Exclude<MotionPlatform, ''>; ar: string }[] = [
  { id: 'youtube', ar: 'يوتيوب' },
  { id: 'tiktok', ar: 'تيك توك' },
  { id: 'instagram', ar: 'إنستغرام' },
  { id: 'podcast', ar: 'بودكاست' },
  { id: 'corporate', ar: 'شركات' },
];

export const PROJECT_TYPES: { id: string; ar: string }[] = [
  { id: 'youtube_intro', ar: 'انترو يوتيوب' },
  { id: 'youtube_outro', ar: 'أوترو يوتيوب' },
  { id: 'shorts', ar: 'شورتس' },
  { id: 'podcast', ar: 'بودكاست' },
  { id: 'corporate', ar: 'شركات' },
  { id: 'channel', ar: 'حزمة قناة' },
  { id: 'logo_sting', ar: 'وخزة شعار' },
];

export const SOUND_OPTIONS: { id: MotionSound; ar: string; en: string }[] = [
  { id: 'none', ar: 'صامت', en: 'silent ident — no designed sting, no music bed, no vocals' },
  { id: 'cinematic', ar: 'سينمائي', en: 'cinematic low swell and a tasteful impact, no melody that sings, no vocals' },
  { id: 'corporate', ar: 'شركات', en: 'polished corporate ident sting, no speech' },
  { id: 'digital', ar: 'رقمي', en: 'clean digital tick and a short precision hit, no speech' },
  { id: 'impact', ar: 'ضربة', en: 'short athletic ident hit, no crowd, no commentary' },
  { id: 'whoosh', ar: 'وش', en: 'brief tasteful whoosh into a clean lockup, no vocals' },
  { id: 'minimal', ar: 'خفيف', en: 'almost silent: a single soft tick, then stillness' },
];

export const SOUND_HONESTY = 'الصوت يُخبز في توجيه المخرج — ليس مكتبة موسيقى منفصلة';

export const STYLE_CATEGORIES: { id: StyleCategory | 'all'; ar: string }[] = [
  { id: 'all', ar: 'الكل' },
  { id: 'luxe', ar: 'فاخر' },
  { id: 'broadcast', ar: 'بث' },
  { id: 'energy', ar: 'طاقة' },
  { id: 'learn', ar: 'تعليم' },
];

export const INDUSTRIES: { id: string; ar: string }[] = [
  { id: 'tech', ar: 'تقنية' },
  { id: 'media', ar: 'إعلام' },
  { id: 'education', ar: 'تعليم' },
  { id: 'podcast', ar: 'بودكاست' },
  { id: 'games', ar: 'ألعاب' },
  { id: 'fashion', ar: 'أزياء' },
  { id: 'food', ar: 'طعام' },
  { id: 'realestate', ar: 'عقارات' },
  { id: 'corporate', ar: 'شركات' },
  { id: 'personal', ar: 'شخصي' },
  { id: 'channel', ar: 'قناة' },
];

export const AUDIENCES: { id: string; ar: string }[] = [
  { id: 'creator', ar: 'صانع محتوى' },
  { id: 'company', ar: 'شركة' },
  { id: 'org', ar: 'جهة' },
  { id: 'channel', ar: 'قناة' },
];

export const LANGUAGES: { id: MotionLanguage; ar: string }[] = [
  { id: 'ar', ar: 'عربي' },
  { id: 'en', ar: 'English' },
  { id: 'bilingual', ar: 'ثنائي' },
];

export const MOTIONS: { id: string; ar: string; en: string }[] = [
  { id: 'reveal', ar: 'كشف', en: 'elegant progressive reveal of the mark from atmosphere' },
  { id: 'assemble', ar: 'تجميع', en: 'brand elements assemble into a precise lockup' },
  { id: 'light_sweep', ar: 'مسح ضوئي', en: 'a controlled light sweep across the logo surface' },
  { id: 'camera_push', ar: 'اقتراب كاميرا', en: 'motivated camera push into the brand lockup' },
  { id: 'minimal_fade', ar: 'ظهور بسيط', en: 'minimal fade-up, almost still, premium restraint' },
  { id: 'glitch', ar: 'غليتش', en: 'brief tasteful digital glitch that resolves instantly into a clean mark — never chaotic' },
  { id: 'particle', ar: 'جزيئات', en: 'fine particles coalesce into the undistorted logo' },
];

export const INTENSITIES: { id: MotionIntensity; ar: string; en: string }[] = [
  { id: 'subtle', ar: 'خفيف', en: 'subtle, restrained, luxury pacing' },
  { id: 'balanced', ar: 'متوازن', en: 'balanced broadcast pacing' },
  { id: 'dynamic', ar: 'ديناميكي', en: 'dynamic but still premium — no chaotic cuts' },
];

export const CAMERAS: { id: string; ar: string; en: string }[] = [
  { id: 'static', ar: 'ثابتة', en: 'locked-off static camera' },
  { id: 'slow_push', ar: 'اقتراب بطيء', en: 'slow cinematic push-in' },
  { id: 'zoom_in', ar: 'تكبير', en: 'controlled zoom-in onto the mark' },
  { id: 'orbit', ar: 'مدار', en: 'gentle orbital move around the lockup' },
];

export const LIGHTS: { id: string; ar: string; en: string }[] = [
  { id: 'soft', ar: 'ناعمة', en: 'soft even studio wrap' },
  { id: 'cinematic', ar: 'سينمائية', en: 'cinematic contrast, shaped shadows, volumetric haze' },
  { id: 'neon', ar: 'نيون', en: 'controlled neon accents, never nightclub chaos' },
  { id: 'golden', ar: 'ذهبية', en: 'golden warm key with tasteful speculars' },
  { id: 'dramatic', ar: 'درامية', en: 'dramatic chiaroscuro, single hero key' },
];

export const BACKDROPS: { id: string; ar: string; en: string }[] = [
  { id: 'solid', ar: 'لون مسطح', en: 'solid brand-color field' },
  { id: 'gradient', ar: 'تدرّج', en: 'subtle brand gradient' },
  { id: 'particles', ar: 'جزيئات', en: 'sparse atmospheric particles, never a screensaver' },
  { id: 'studio', ar: 'استوديو', en: 'dark professional studio cyclorama' },
  { id: 'dark', ar: 'داكن', en: 'deep dark void with a hint of brand light' },
];

export const LOGO_BEHAVIORS: { id: string; ar: string; en: string }[] = [
  { id: 'center_hold', ar: 'ثبات في الوسط', en: 'logo holds center frame, undistorted' },
  { id: 'scale_in', ar: 'تكبير دخول', en: 'logo scales in to a centered lockup, no squash or stretch' },
  { id: 'light_sweep', ar: 'مسح ضوئي', en: 'logo is already formed; a light sweep reveals material and finish' },
];

export const TEXT_ANIMS: { id: string; ar: string; en: string }[] = [
  { id: 'fade', ar: 'ظهور', en: 'clean fade-up of type' },
  { id: 'slide', ar: 'انزلاق', en: 'short elegant slide into place' },
  { id: 'tracking', ar: 'تتبّع الحروف', en: 'subtle tracking settle, letters never scramble' },
];

export const OUTRO_CTAS: { id: string; ar: string; en: string }[] = [
  { id: 'subscribe', ar: 'اشترك', en: 'Subscribe / اشترك end-card, spelled correctly, platform-safe' },
  { id: 'follow', ar: 'تابع', en: 'Follow / تابعنا, clean social end-card' },
  { id: 'website', ar: 'زر الموقع', en: 'Visit website lockup with room for a URL if provided in the tagline' },
  { id: 'logo_hold', ar: 'ثبات الشعار', en: 'no extra CTA copy — end on a clean logo hold only' },
  { id: 'custom', ar: 'مخصص', en: 'custom end line, spelled exactly as supplied' },
];

export const COLOR_PALETTES: {
  id: string;
  ar: string;
  primary: string;
  secondary: string;
  accent: string;
  bgColor: string;
  textColor: string;
}[] = [
  { id: 'copper', ar: 'نحاس الاستوديو', primary: '#d4a574', secondary: '#e8b86d', accent: '#c45c4a', bgColor: '#0b0c10', textColor: '#f4efe6' },
  { id: 'ink_gold', ar: 'ذهب ليلي', primary: '#c9a227', secondary: '#f4efe6', accent: '#d4a574', bgColor: '#08090c', textColor: '#f4efe6' },
  { id: 'teal', ar: 'تركواز', primary: '#7dd3c7', secondary: '#d4a574', accent: '#e8b86d', bgColor: '#071014', textColor: '#e8f6f4' },
  { id: 'broadcast', ar: 'بث', primary: '#c45c4a', secondary: '#f4efe6', accent: '#e8b86d', bgColor: '#0c0b0b', textColor: '#f4efe6' },
  { id: 'pitch', ar: 'ملعب', primary: '#b8e05a', secondary: '#f4efe6', accent: '#7dd3c7', bgColor: '#0a0c08', textColor: '#f4efe6' },
  { id: 'royal', ar: 'ملكي', primary: '#8b7cf6', secondary: '#e8b86d', accent: '#d4a574', bgColor: '#0c0b12', textColor: '#f0eefc' },
];

export const STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: 'luxury',
    name: 'فاخر',
    nameEn: 'Luxury',
    hint: 'كشف رزين، معدن وذهب، ضوء حجمي',
    motionLevel: 'subtle',
    motionLevelAr: 'هادئ',
    category: 'luxe',
    categoryAr: 'فاخر',
    gradient: ['#2a1c10', '#d4a574'],
    defaults: {
      motion: 'light_sweep',
      intensity: 'subtle',
      camera: 'slow_push',
      lighting: 'golden',
      bgStyle: 'dark',
      logoBehavior: 'light_sweep',
      textAnim: 'fade',
    },
    audioHint: 'restrained luxury whoosh and a soft golden impact, no melody that sings, no vocals',
  },
  {
    id: 'tech',
    name: 'تقني',
    nameEn: 'Tech',
    hint: 'تجميع هندسي، شبكة ضوء نظيفة',
    motionLevel: 'balanced',
    motionLevelAr: 'متوازن',
    category: 'energy',
    categoryAr: 'طاقة',
    gradient: ['#0b1c1c', '#7dd3c7'],
    defaults: {
      motion: 'assemble',
      intensity: 'balanced',
      camera: 'orbit',
      lighting: 'neon',
      bgStyle: 'particles',
      logoBehavior: 'scale_in',
      textAnim: 'tracking',
    },
    audioHint: 'clean digital tick and a short precision hit, no speech',
  },
  {
    id: 'news',
    name: 'إخباري',
    nameEn: 'News',
    hint: 'بث واثق، حواف حادة، ثبات سريع',
    motionLevel: 'balanced',
    motionLevelAr: 'متوازن',
    category: 'broadcast',
    categoryAr: 'بث',
    gradient: ['#1a1010', '#c45c4a'],
    defaults: {
      motion: 'camera_push',
      intensity: 'balanced',
      camera: 'static',
      lighting: 'dramatic',
      bgStyle: 'solid',
      logoBehavior: 'center_hold',
      textAnim: 'slide',
    },
    audioHint: 'broadcast stinger, short and authoritative, no dialogue',
  },
  {
    id: 'kids',
    name: 'أطفال',
    nameEn: 'Kids',
    hint: 'ألوان دافئة، حركة مرحة دون فوضى',
    motionLevel: 'dynamic',
    motionLevelAr: 'ديناميكي',
    category: 'energy',
    categoryAr: 'طاقة',
    gradient: ['#2a1a08', '#e8b86d'],
    defaults: {
      motion: 'particle',
      intensity: 'dynamic',
      camera: 'zoom_in',
      lighting: 'soft',
      bgStyle: 'gradient',
      logoBehavior: 'scale_in',
      textAnim: 'slide',
    },
    audioHint: 'bright playful chime and a soft bounce, no lyrics, no cartoon voices',
  },
  {
    id: 'cinematic',
    name: 'سينمائي',
    nameEn: 'Cinematic',
    hint: 'ضباب حجمي، كشف بطيء، فيلم',
    motionLevel: 'subtle',
    motionLevelAr: 'هادئ',
    category: 'luxe',
    categoryAr: 'فاخر',
    gradient: ['#121018', '#d4a574'],
    defaults: {
      motion: 'reveal',
      intensity: 'balanced',
      camera: 'slow_push',
      lighting: 'cinematic',
      bgStyle: 'dark',
      logoBehavior: 'scale_in',
      textAnim: 'fade',
    },
    audioHint: 'cinematic low swell and a tasteful impact, no trailer voice-over',
  },
  {
    id: 'minimal',
    name: 'بسيط',
    nameEn: 'Minimal',
    hint: 'حركة قليلة، فراغ فاخر، وضوح',
    motionLevel: 'subtle',
    motionLevelAr: 'هادئ',
    category: 'luxe',
    categoryAr: 'فاخر',
    gradient: ['#161616', '#f4efe6'],
    defaults: {
      motion: 'minimal_fade',
      intensity: 'subtle',
      camera: 'static',
      lighting: 'soft',
      bgStyle: 'solid',
      logoBehavior: 'center_hold',
      textAnim: 'fade',
    },
    audioHint: 'almost silent: a single soft tick, then stillness',
  },
  {
    id: 'sport',
    name: 'رياضي',
    nameEn: 'Sport',
    hint: 'طاقة واثقة، اقتراب حاسم',
    motionLevel: 'dynamic',
    motionLevelAr: 'ديناميكي',
    category: 'energy',
    categoryAr: 'طاقة',
    gradient: ['#10180c', '#b8e05a'],
    defaults: {
      motion: 'camera_push',
      intensity: 'dynamic',
      camera: 'zoom_in',
      lighting: 'dramatic',
      bgStyle: 'studio',
      logoBehavior: 'scale_in',
      textAnim: 'slide',
    },
    audioHint: 'athletic hit and a short whoosh, no crowd chant, no commentary',
  },
  {
    id: 'corporate',
    name: 'شركات',
    nameEn: 'Corporate',
    hint: 'هندسي، نظيف، ثقة مؤسسية',
    motionLevel: 'balanced',
    motionLevelAr: 'متوازن',
    category: 'broadcast',
    categoryAr: 'بث',
    gradient: ['#101218', '#d4a574'],
    defaults: {
      motion: 'assemble',
      intensity: 'balanced',
      camera: 'static',
      lighting: 'soft',
      bgStyle: 'gradient',
      logoBehavior: 'center_hold',
      textAnim: 'tracking',
    },
    audioHint: 'polished corporate ident sting, no speech',
  },
  {
    id: 'gaming',
    name: 'ألعاب',
    nameEn: 'Gaming',
    hint: 'طاقة، غليتش منضبط يُحل فوراً',
    motionLevel: 'dynamic',
    motionLevelAr: 'ديناميكي',
    category: 'energy',
    categoryAr: 'طاقة',
    gradient: ['#140c1c', '#8b7cf6'],
    defaults: {
      motion: 'glitch',
      intensity: 'dynamic',
      camera: 'orbit',
      lighting: 'neon',
      bgStyle: 'particles',
      logoBehavior: 'scale_in',
      textAnim: 'tracking',
    },
    audioHint: 'short digital glitch-resolve into a clean hit, no voice chat, no lyrics',
  },
  {
    id: 'podcast',
    name: 'بودكاست',
    nameEn: 'Podcast',
    hint: 'حميمي، ضوء دافئ، ثبات الاسم',
    motionLevel: 'balanced',
    motionLevelAr: 'متوازن',
    category: 'broadcast',
    categoryAr: 'بث',
    gradient: ['#1a140c', '#e8b86d'],
    defaults: {
      motion: 'reveal',
      intensity: 'balanced',
      camera: 'slow_push',
      lighting: 'golden',
      bgStyle: 'studio',
      logoBehavior: 'center_hold',
      textAnim: 'fade',
    },
    audioHint: 'warm analog whoosh and a soft ident hit, no spoken intro',
  },
  {
    id: 'elegant',
    name: 'أنيق',
    nameEn: 'Elegant',
    hint: 'خطوط رفيعة، كشف هادئ، تباين ناعم',
    motionLevel: 'subtle',
    motionLevelAr: 'هادئ',
    category: 'luxe',
    categoryAr: 'فاخر',
    gradient: ['#1a1612', '#e8d5b5'],
    defaults: {
      motion: 'minimal_fade',
      intensity: 'subtle',
      camera: 'static',
      lighting: 'soft',
      bgStyle: 'gradient',
      logoBehavior: 'center_hold',
      textAnim: 'tracking',
    },
    audioHint: 'a single crystalline tick, then silence — no melody, no vocals',
  },
  {
    id: 'documentary',
    name: 'وثائقي',
    nameEn: 'Documentary',
    hint: 'ضوء طبيعي، كشف بطيء، جدية هادئة',
    motionLevel: 'subtle',
    motionLevelAr: 'هادئ',
    category: 'broadcast',
    categoryAr: 'بث',
    gradient: ['#141210', '#c4a574'],
    defaults: {
      motion: 'reveal',
      intensity: 'subtle',
      camera: 'slow_push',
      lighting: 'cinematic',
      bgStyle: 'dark',
      logoBehavior: 'center_hold',
      textAnim: 'fade',
    },
    audioHint: 'low documentary swell, no narration, no score melody, no vocals',
  },
  {
    id: 'education',
    name: 'تعليمي',
    nameEn: 'Education',
    hint: 'وضوح، ثقة هادئة، قراءة فورية',
    motionLevel: 'balanced',
    motionLevelAr: 'متوازن',
    category: 'learn',
    categoryAr: 'تعليم',
    gradient: ['#101418', '#7dd3c7'],
    defaults: {
      motion: 'assemble',
      intensity: 'balanced',
      camera: 'static',
      lighting: 'soft',
      bgStyle: 'solid',
      logoBehavior: 'center_hold',
      textAnim: 'slide',
    },
    audioHint: 'clean educational sting, short and friendly, no lecture voice',
  },
];

export const VARIATIONS: { id: string; ar: string; patch: Partial<MotionDraft> }[] = [
  { id: 'calmer', ar: 'أهدأ', patch: { intensity: 'subtle', motion: 'minimal_fade', camera: 'static' } },
  { id: 'more_cinematic', ar: 'أكثر سينمائية', patch: { intensity: 'balanced', lighting: 'cinematic', camera: 'slow_push', motion: 'reveal' } },
  { id: 'luxe', ar: 'أفخم', patch: { intensity: 'subtle', lighting: 'golden', motion: 'light_sweep', logoBehavior: 'light_sweep' } },
  { id: 'faster', ar: 'أسرع', patch: { intensity: 'dynamic', camera: 'zoom_in', motion: 'assemble' } },
];

export function emptyDraft(): MotionDraft {
  return {
    kind: 'intro',
    activePiece: 'intro',
    duration: 5,
    aspect: '16:9',
    resolution: '720p',
    brandName: '',
    tagline: '',
    industry: '',
    audience: 'creator',
    language: 'ar',
    logo: null,
    primary: '#d4a574',
    secondary: '#e8b86d',
    bgColor: '#0b0c10',
    styleId: 'cinematic',
    motion: 'reveal',
    intensity: 'balanced',
    camera: 'slow_push',
    lighting: 'cinematic',
    bgStyle: 'dark',
    logoBehavior: 'scale_in',
    textAnim: 'fade',
    outroCta: 'subscribe',
    customCta: '',
    vision: '',
    website: '',
    accent: '#c45c4a',
    textColor: '#f4efe6',
    platform: '',
    projectType: '',
    brandRules: '',
    brandLock: true,
    sound: 'cinematic',
  };
}

export function resolveSlot(kind: MotionKind, activePiece: 'intro' | 'outro'): IdentSlot {
  if (kind === 'logo') return 'logo';
  if (kind === 'both') return activePiece;
  return kind;
}

export function apiAspect(aspect: MotionAspect): '16:9' | '9:16' {
  return aspect === '16:9' ? '16:9' : '9:16';
}

export function stripDataUrl(dataUrl: string | null | undefined): string | undefined {
  if (!dataUrl) return undefined;
  const i = dataUrl.indexOf(',');
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
}

export function applyTemplate(draft: MotionDraft, styleId: string): MotionDraft {
  const t = STYLE_TEMPLATES.find((s) => s.id === styleId);
  if (!t) return { ...draft, styleId };
  return { ...draft, styleId, ...t.defaults };
}

const IDENTITY_LOCK_KEYS: (keyof MotionDraft)[] = [
  'logo',
  'primary',
  'secondary',
  'accent',
  'bgColor',
  'textColor',
  'brandName',
  'duration',
  'aspect',
  'website',
];

export function applyVariation(draft: MotionDraft, variationId: string): MotionDraft {
  const v = VARIATIONS.find((x) => x.id === variationId);
  if (!v) return draft;
  const patch: Partial<MotionDraft> = { ...v.patch };
  if (draft.brandLock) {
    for (const key of IDENTITY_LOCK_KEYS) {
      delete patch[key];
    }
  }
  return { ...draft, ...patch };
}

const SOUND_IDS: MotionSound[] = ['none', 'cinematic', 'corporate', 'digital', 'impact', 'whoosh', 'minimal'];
const PLATFORM_IDS: MotionPlatform[] = ['youtube', 'tiktok', 'instagram', 'podcast', 'corporate', ''];

export function loadDraft(): MotionDraft {
  try {
    const raw = localStorage.getItem(MOTION_STORAGE_KEY);
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as Partial<MotionDraft>;
    const base = emptyDraft();
    return {
      ...base,
      ...parsed,
      logo: typeof parsed.logo === 'string' ? parsed.logo : null,
      brandLock: parsed.brandLock !== false,
      sound: SOUND_IDS.includes(parsed.sound as MotionSound) ? (parsed.sound as MotionSound) : base.sound,
      platform: PLATFORM_IDS.includes(parsed.platform as MotionPlatform)
        ? (parsed.platform as MotionPlatform)
        : base.platform,
      accent: isHex(String(parsed.accent || '')) ? String(parsed.accent) : base.accent,
      textColor: isHex(String(parsed.textColor || '')) ? String(parsed.textColor) : base.textColor,
      website: typeof parsed.website === 'string' ? parsed.website : '',
      brandRules: typeof parsed.brandRules === 'string' ? parsed.brandRules : '',
      projectType: typeof parsed.projectType === 'string' ? parsed.projectType : '',
    };
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(draft: MotionDraft) {
  try {
    localStorage.setItem(MOTION_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    try {
      const { logo: _logo, ...rest } = draft;
      localStorage.setItem(MOTION_STORAGE_KEY, JSON.stringify({ ...rest, logo: null }));
    } catch {
      /* quota */
    }
  }
}

export interface PromptHandoff {
  title?: string;
  prompt?: string;
  bestFor?: string;
}

export function readPromptHandoff(): PromptHandoff | null {
  try {
    const raw = sessionStorage.getItem(PROMPT_HANDOFF_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PromptHandoff;
    const best = String(data?.bestFor || '').toLowerCase();
    if (!['intro', 'outro', 'video'].includes(best)) return null;
    sessionStorage.removeItem(PROMPT_HANDOFF_KEY);
    return data;
  } catch {
    return null;
  }
}

export function applyHandoff(draft: MotionDraft, handoff: PromptHandoff): MotionDraft {
  const best = String(handoff.bestFor || '').toLowerCase();
  const next: MotionDraft = { ...draft };
  const title = String(handoff.title || '').trim();
  const prompt = String(handoff.prompt || '').trim();
  if (title && !next.brandName.trim()) next.brandName = title.slice(0, 80);
  if (prompt) next.vision = prompt.slice(0, 1200);
  if (best === 'intro') {
    next.kind = 'intro';
    next.activePiece = 'intro';
  } else if (best === 'outro') {
    next.kind = 'outro';
    next.activePiece = 'outro';
  }
  return next;
}

export function applyHeroPreset(draft: MotionDraft, choice: MotionKind | HeroPresetId): MotionDraft {
  if (choice === 'podcast' || choice === 'channel') {
    const preset = HERO_PRESETS.find((p) => p.id === choice);
    if (!preset) return draft;
    const next: MotionDraft = {
      ...draft,
      ...preset.patch,
      kind: preset.kind,
      activePiece: preset.kind === 'outro' ? 'outro' : 'intro',
    };
    return applyTemplate(next, preset.styleId);
  }
  const projectType =
    choice === 'logo'
      ? 'logo_sting'
      : choice === 'outro'
        ? 'youtube_outro'
        : choice === 'both'
          ? ''
          : 'youtube_intro';
  return {
    ...draft,
    kind: choice,
    activePiece: choice === 'outro' ? 'outro' : 'intro',
    projectType,
  };
}

export function slotLabelAr(slot: IdentSlot): string {
  if (slot === 'outro') return 'أوترو';
  if (slot === 'logo') return 'تحريك الشعار';
  return 'انترو';
}

export function najeUnderstood(draft: MotionDraft, slot: IdentSlot): string {
  const style = STYLE_TEMPLATES.find((s) => s.id === draft.styleId);
  const motion = MOTIONS.find((m) => m.id === draft.motion);
  const sound = SOUND_OPTIONS.find((s) => s.id === draft.sound);
  const brand = draft.brandName.trim() || 'بدون اسم بعد';
  const parts = [
    brand,
    slotLabelAr(slot),
    `${draft.duration}ث`,
    style?.name || draft.styleId,
    motion?.ar || draft.motion,
    draft.aspect,
  ];
  if (sound && draft.sound !== 'none') parts.push(sound.ar);
  if (draft.brandLock) parts.push('هوية مقفولة');
  return parts.join(' · ');
}

export function motionFilename(brandName: string, slot: IdentSlot, duration: MotionDuration): string {
  const raw = (brandName || 'Naje').trim() || 'Naje';
  const brand = raw.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '').replace(/\s+/g, '_').slice(0, 48) || 'Naje';
  const piece = slot === 'outro' ? 'Outro' : slot === 'logo' ? 'Logo' : 'Intro';
  return `${brand}_${piece}_${duration}s.mp4`;
}

function pick<T extends { id: string }>(list: T[], id: string): T | undefined {
  return list.find((x) => x.id === id);
}

export function computeMotionPlan(draft: MotionDraft, slot: IdentSlot): MotionBeat[] {
  const d = draft.duration;
  const motionAr = pick(MOTIONS, draft.motion)?.ar || 'حركة';
  const logoAr = pick(LOGO_BEHAVIORS, draft.logoBehavior)?.ar || 'الشعار';
  const ctaAr =
    draft.outroCta === 'custom' && draft.customCta.trim()
      ? draft.customCta.trim()
      : pick(OUTRO_CTAS, draft.outroCta)?.ar || 'دعوة';

  if (slot === 'outro') {
    return d === 5
      ? [
          { from: 0, to: 1.2, title: 'تهدئة', body: 'الكادر يصفو من المحتوى نحو هوية العلامة.' },
          { from: 1.2, to: 3.5, title: 'القفل + الدعوة', body: `${logoAr}. اسم العلامة يظهر. ${ctaAr}.` },
          { from: 3.5, to: 5, title: 'ثبات', body: 'إمساك نظيف جاهز للمونتاج على المنصات.' },
        ]
      : [
          { from: 0, to: 2.2, title: 'إغلاق المشهد', body: 'تخفيف محسوب من عالم المحتوى إلى العلامة.' },
          { from: 2.2, to: 7.2, title: 'كرت النهاية', body: `${logoAr} ثم الاسم والدعوة: ${ctaAr}.` },
          { from: 7.2, to: 10, title: 'ثبات', body: 'هوامش آمنة. الشعار دون تشويه.' },
        ];
  }

  if (slot === 'logo') {
    return d === 5
      ? [
          { from: 0, to: 1.2, title: 'كشف الشعار', body: `${motionAr} يبدأ من الفراغ نحو العلامة.` },
          { from: 1.2, to: 3.5, title: 'تحريك العلامة', body: `${logoAr}. النسب ثابتة، بلا تمدد.` },
          { from: 3.5, to: 5, title: 'ثبات', body: 'قفل في الوسط. نهاية نظيفة.' },
        ]
      : [
          { from: 0, to: 2.2, title: 'نفس المادة', body: 'جو الهوية قبل أن يكتمل الشعار.' },
          { from: 2.2, to: 7.2, title: 'كوريغرافيا الشعار', body: `${motionAr} + ${logoAr}. الاسم إن لزم.` },
          { from: 7.2, to: 10, title: 'ثبات', body: 'العلامة تُمسَك دون تشويه حتى نهاية النافذة.' },
        ];
  }

  return d === 5
    ? [
        { from: 0, to: 1.2, title: 'كشف الشعار', body: `افتتاح المزاج ثم ${motionAr}.` },
        { from: 1.2, to: 3.5, title: 'اسم العلامة + حركة', body: `${logoAr}. الاسم يقرأ بوضوح.` },
        { from: 3.5, to: 5, title: 'ثبات', body: 'قفل جاهز للقطع على المحتوى.' },
      ]
    : [
        { from: 0, to: 2.2, title: 'افتتاح', body: 'عالم العلامة دون ازدحام كتابي.' },
        { from: 2.2, to: 7.2, title: 'اسم العلامة + حركة', body: `${motionAr} يجمع القفل. ${logoAr}.` },
        { from: 7.2, to: 10, title: 'ثبات', body: 'إمساك فاخر قبل أن يبدأ المحتوى.' },
      ];
}

function languageBlock(draft: MotionDraft): string {
  if (draft.language === 'en') {
    return 'On-screen type in English only. Spell the brand name and tagline exactly. No garbled letters.';
  }
  if (draft.language === 'bilingual') {
    return 'Bilingual lockup: Arabic connected RTL plus English tracking-tight. Do not collide the two scripts. If either line cannot be spelled perfectly, omit that line rather than misspell it.';
  }
  return 'On-screen type in Arabic, fully connected RTL, correct letterforms. If Arabic cannot be rendered perfectly connected, omit on-screen type and hold the logo only. Never output disconnected Arabic glyphs.';
}

function aspectBlock(aspect: MotionAspect): string {
  if (aspect === '16:9') {
    return 'Aspect 16:9 YouTube widescreen. Keep logo and type inside title-safe (inset ~8%).';
  }
  if (aspect === '1:1') {
    return 'Delivered frame is 9:16 vertical. Compose a SQUARE-SAFE centered 1:1 lockup inside that 9:16 frame: all logo and type live strictly in the center square. Dark or brand-color fields fill above and below. Nothing essential in the top or bottom 16% of the frame. This is not native 1:1 output.';
  }
  return 'Aspect 9:16 vertical (Shorts / TikTok). Keep logo and type in the central safe area, away from UI chrome at top and bottom.';
}

function platformBlock(platform: MotionPlatform): string {
  if (platform === 'youtube') {
    return 'Platform: YouTube. Keep logo and type inside 16:9 title-safe. Leave the lower-right and lower-third clear of essential marks so player UI does not cover the lockup.';
  }
  if (platform === 'tiktok') {
    return 'Platform: TikTok 9:16. Keep the mark in the central safe area. Nothing essential in the top 12% (username), bottom 18% (captions/buttons), or right 14% (engagement rail).';
  }
  if (platform === 'instagram') {
    return 'Platform: Instagram Reels. Central 9:16 safe area. Avoid top and bottom UI chrome.';
  }
  if (platform === 'podcast') {
    return 'Platform: podcast cover / video podcast. Prefer a centered lockup that still reads as a square-ish cover.';
  }
  if (platform === 'corporate') {
    return 'Platform: corporate / internal / broadcast. Generous title-safe, no social UI chrome, no subscribe sticker.';
  }
  return '';
}

function durationBlock(duration: MotionDuration, plan: MotionBeat[]): string {
  const beats = plan.map((b) => `${b.from.toFixed(1)}–${b.to.toFixed(1)}s: ${b.title} — ${b.body}`).join(' | ');
  if (duration === 5) {
    return (
      'DURATION: The engine generates a 10-second clip. This ident is a 5-SECOND STING. ' +
      'Complete all choreography in 0.0–5.0s, then HOLD a clean undistorted logo lockup frozen/still for 5.0–10.0s. ' +
      'No new scenes, no extra cuts, no second story after 5s. Do not claim or simulate a native 5-second Omni render. ' +
      `Director beats (sting clock): ${beats}.`
    );
  }
  return (
    'DURATION: Full 10-second ident. End on a clean logo hold for the last ~2 seconds. ' +
    `Director beats: ${beats}.`
  );
}

function slotNoun(slot: IdentSlot): string {
  if (slot === 'outro') return 'OUTRO / end-card broadcast ident';
  if (slot === 'logo') return 'LOGO STING / brand-mark choreography (not a product commercial)';
  return 'INTRO bumper / opening broadcast ident';
}

export function composeMotionPrompt(draft: MotionDraft, slot: IdentSlot): string {
  const brand = draft.brandName.trim() || 'the brand';
  const style = STYLE_TEMPLATES.find((s) => s.id === draft.styleId);
  const motion = pick(MOTIONS, draft.motion);
  const intensity = pick(INTENSITIES, draft.intensity);
  const camera = pick(CAMERAS, draft.camera);
  const light = pick(LIGHTS, draft.lighting);
  const backdrop = pick(BACKDROPS, draft.bgStyle);
  const logoMove = pick(LOGO_BEHAVIORS, draft.logoBehavior);
  const textAnim = pick(TEXT_ANIMS, draft.textAnim);
  const cta = pick(OUTRO_CTAS, draft.outroCta);
  const industry = pick(INDUSTRIES, draft.industry);
  const audience = pick(AUDIENCES, draft.audience);
  const plan = computeMotionPlan(draft, slot);

  const lines: string[] = [];
  lines.push(
    `Create a premium broadcast-quality ${slotNoun(slot)} for "${brand}". ` +
      `This is a channel/company ident, not a live-action product commercial, not UGC, not a talking-head.`
  );
  lines.push(durationBlock(draft.duration, plan));
  lines.push(aspectBlock(draft.aspect));
  const plat = platformBlock(draft.platform);
  if (plat) lines.push(plat);
  lines.push(
    `Brand colors locked: primary ${draft.primary}, secondary ${draft.secondary}, accent ${draft.accent}, background ${draft.bgColor}, text ${draft.textColor}. ` +
      `Grade every frame to this palette. On-screen type uses ${draft.textColor}. Accent ${draft.accent} only as a controlled highlight. No random neon unless lighting is neon.`
  );

  if (draft.tagline.trim()) {
    lines.push(
      `On-screen tagline, spelled exactly: "${draft.tagline.trim()}". ` +
        `If it cannot be spelled perfectly, omit the tagline rather than misspell it.`
    );
  } else {
    lines.push('No tagline unless the brand name itself needs a short hold caption.');
  }

  if (draft.website.trim()) {
    lines.push(
      `On-screen website only if it fits the lockup, spelled exactly: "${draft.website.trim()}". ` +
        `Do not invent a different URL. If it cannot be spelled perfectly, omit it rather than misspell it.`
    );
  }

  lines.push(languageBlock(draft));
  lines.push(
    `Tone: ${style?.nameEn || 'cinematic'} ident (${style?.hint || ''}). ` +
      `Industry: ${industry?.ar || 'unspecified'}. Audience: ${audience?.ar || 'creator'}.`
  );
  lines.push(
    `Motion vocabulary: ${motion?.en || draft.motion}. Intensity: ${intensity?.en || draft.intensity}. ` +
      `Camera: ${camera?.en || draft.camera}. Lighting: ${light?.en || draft.lighting}. ` +
      `Background: ${backdrop?.en || draft.bgStyle}. Logo behavior: ${logoMove?.en || draft.logoBehavior}. ` +
      `Type animation: ${textAnim?.en || draft.textAnim}.`
  );

  if (draft.logo) {
    lines.push(
      'A reference logo is attached as the product/logo plate. ' +
        'Preserve the logo identity, proportions, colors, and letterforms EXACTLY. ' +
        'The logo must remain undistorted: no warp, no morph, no redraw, no extra or missing letters, no 3D extrusion that breaks the mark, no reflection that splits the mark. ' +
        'If the engine cannot hold the mark cleanly, prefer a simpler centered hold of the attached logo over a decorative failure.'
    );
  } else {
    lines.push(
      `No logo file. Set the brand name "${brand}" in elegant, perfectly spelled typography as the mark. Never invent a fake pictogram.`
    );
  }

  if (slot === 'outro') {
    const custom = draft.outroCta === 'custom' ? draft.customCta.trim() : '';
    const site =
      draft.outroCta === 'website' && draft.website.trim()
        ? ` URL lockup spelled exactly: "${draft.website.trim()}".`
        : '';
    lines.push(
      `OUTRO close: ${cta?.en || 'clean end-card'}.` +
        (custom ? ` Custom line, spelled exactly: "${custom}".` : '') +
        site +
        ' Platform-safe margins. End on a clean logo hold.'
    );
  } else if (slot === 'logo') {
    lines.push('The entire piece is logo choreography. Brand name may appear under the mark. No subscribe UI chrome. End on a clean centered logo hold.');
  } else {
    lines.push('INTRO close: end on a clean logo hold with breathing room so an editor can cut to content. No dialogue. No subscribe end-card.');
  }

  const sound = pick(SOUND_OPTIONS, draft.sound);
  if (draft.sound === 'none') {
    lines.push(
      'Audio: silent ident. No music bed, no designed sting, no vocals, no dialogue. Do not invent a separate soundtrack file.'
    );
  } else if (sound) {
    lines.push(
      `Audio (baked into this direction — not a separate music library or soundtrack file): ${sound.en}. No dialogue, no lyrics, no presenter, no voice-over.`
    );
  } else if (style?.audioHint) {
    lines.push(`Audio (native, design only): ${style.audioHint}. No dialogue, no lyrics, no presenter, no voice-over.`);
  } else {
    lines.push('Audio: short ident whoosh/impact only. No dialogue, no lyrics, no voice-over.');
  }

  if (draft.brandRules.trim()) {
    lines.push(`Brand rules (obey; never violate for decoration): ${draft.brandRules.trim().slice(0, 800)}`);
  }

  if (draft.brandLock) {
    lines.push(
      'Brand lock ON: never invent a new logo, never change the supplied name, never drift the palette, never restyle duration or frame. Hold the given identity.'
    );
  }

  if (draft.vision.trim()) {
    lines.push(`Director note from the client (obey unless it contradicts logo integrity or duration): ${draft.vision.trim().slice(0, 1200)}`);
  }

  lines.push(
    'Hard rules: no dialogue, no garbled typography, no fake UI, no watermark, no extra brand marks, no timeline-editor chrome, no transparent/alpha claims. ' +
      'Broadcast ident. Photoreal lighting on graphic forms is fine; keep it premium and readable. ' +
      'Finish on a still, undistorted logo hold.'
  );

  return lines.filter(Boolean).join('\n');
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')}`;
}

function readPixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): { r: number; g: number; b: number; a: number } | null {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const px = Math.max(0, Math.min(w - 1, Math.floor(x)));
  const py = Math.max(0, Math.min(h - 1, Math.floor(y)));
  const d = ctx.getImageData(px, py, 1, 1).data;
  return { r: d[0], g: d[1], b: d[2], a: d[3] };
}

function sat(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function luma(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Real canvas sampling: 4 corners + center. Inset toward center if a corner is transparent. */
export function sampleLogoPalette(dataUrl: string): Promise<{
  primary: string;
  secondary: string;
  accent: string;
  bgColor: string;
  textColor: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxSide = 96;
        const iw = img.naturalWidth || img.width || 1;
        const ih = img.naturalHeight || img.height || 1;
        const scale = Math.min(1, maxSide / Math.max(iw, ih));
        canvas.width = Math.max(8, Math.round(iw * scale));
        canvas.height = Math.max(8, Math.round(ih * scale));
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const w = canvas.width;
        const h = canvas.height;
        const cx = (w - 1) / 2;
        const cy = (h - 1) / 2;
        const corners: [number, number][] = [
          [0, 0],
          [w - 1, 0],
          [0, h - 1],
          [w - 1, h - 1],
        ];
        const samples: { r: number; g: number; b: number }[] = [];
        for (const [x, y] of corners) {
          let p = readPixel(ctx, x, y);
          if (!p || p.a < 40) {
            p = readPixel(ctx, x + (cx - x) * 0.22, y + (cy - y) * 0.22);
          }
          if (p && p.a >= 40) samples.push({ r: p.r, g: p.g, b: p.b });
        }
        const center = readPixel(ctx, cx, cy);
        if (center && center.a >= 40) samples.push({ r: center.r, g: center.g, b: center.b });
        if (!samples.length) {
          reject(new Error('empty'));
          return;
        }
        const bySat = [...samples].sort((a, b) => sat(b.r, b.g, b.b) - sat(a.r, a.g, a.b));
        const byLuma = [...samples].sort((a, b) => luma(a.r, a.g, a.b) - luma(b.r, b.g, b.b));
        const primary = bySat[0];
        const secondary = bySat[1] || byLuma[byLuma.length - 1] || primary;
        const accent = bySat[2] || bySat[1] || primary;
        const bg = byLuma[0];
        const light = byLuma[byLuma.length - 1] || primary;
        const text =
          luma(light.r, light.g, light.b) < 140
            ? luma(bg.r, bg.g, bg.b) < 80
              ? { r: 244, g: 239, b: 230 }
              : { r: 11, g: 12, b: 16 }
            : light;
        resolve({
          primary: rgbToHex(primary.r, primary.g, primary.b),
          secondary: rgbToHex(secondary.r, secondary.g, secondary.b),
          accent: rgbToHex(accent.r, accent.g, accent.b),
          bgColor: rgbToHex(bg.r, bg.g, bg.b),
          textColor: rgbToHex(text.r, text.g, text.b),
        });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('image'));
    img.src = dataUrl;
  });
}

export function isHex(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}
