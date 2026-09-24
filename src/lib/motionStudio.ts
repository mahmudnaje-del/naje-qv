export type MotionKind = 'intro' | 'outro' | 'both' | 'logo';
export type IdentSlot = 'intro' | 'outro' | 'logo';
export type MotionDuration = 5 | 10;
export type MotionAspect = '16:9' | '9:16' | '1:1' | '4:5';
export type MotionRes = '720p' | '1080p';
export type MotionIntensity = 'subtle' | 'balanced' | 'dynamic' | 'extreme';
export type MotionLanguage = 'ar' | 'en' | 'bilingual';
export type MotionPlatform = 'youtube' | 'tiktok' | 'instagram' | 'podcast' | 'corporate' | '';
export type MotionSound =
  | 'none'
  | 'cinematic'
  | 'corporate'
  | 'digital'
  | 'impact'
  | 'whoosh'
  | 'minimal'
  | 'epic'
  | 'luxury'
  | 'technology'
  | 'ambient';
export type HeroPresetId = 'podcast' | 'channel';
export type StyleCategory = 'luxe' | 'broadcast' | 'energy' | 'learn';
export type BrandVoice =
  | 'professional'
  | 'bold'
  | 'elegant'
  | 'friendly'
  | 'technical'
  | 'youthful'
  | 'corporate'
  | 'cinematic'
  | 'minimal';
export type LogoPosition = 'center' | 'left' | 'right' | 'top' | 'bottom';
export type LogoFinish = 'none' | 'glow' | 'shadow' | 'reflection';
export type OutroLayout =
  | 'center'
  | 'split'
  | 'logo_socials'
  | 'video_end'
  | 'product_end'
  | 'corporate_end'
  | 'minimal_end';
export type NameScript = 'as_typed' | 'ar' | 'en' | 'bilingual';

export interface MotionDraft {
  kind: MotionKind;
  activePiece: 'intro' | 'outro';
  duration: MotionDuration;
  aspect: MotionAspect;
  resolution: MotionRes;
  brandName: string;
  tagline: string;
  description: string;
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
  socials: string;
  brandVoice: BrandVoice;
  logoPosition: LogoPosition;
  logoFinish: LogoFinish;
  outroLayout: OutroLayout;
  nameScript: NameScript;
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

export interface PracticeHint {
  id: string;
  ar: string;
  level: 'warn' | 'note';
}

export const MOTION_STORAGE_KEY = 'naje-motion-draft-v1';
export const PROMPT_HANDOFF_KEY = 'naje-prompt-handoff';

export const KIND_OPTIONS: { id: MotionKind; ar: string; en: string; hint: string }[] = [
  { id: 'intro', ar: 'انترو', en: 'Create Intro', hint: 'مقدمة قبل أن يبدأ المحتوى' },
  { id: 'outro', ar: 'أوترو', en: 'Create Outro', hint: 'خاتمة بعد المحتوى ودعوة واضحة' },
  { id: 'both', ar: 'الاثنان', en: 'Create Both', hint: 'انترو ثم أوترو كعمليتين متتابعتين' },
  { id: 'logo', ar: 'تحريك الشعار', en: 'Logo Animation', hint: 'وخزة تُحيي العلامة وتثبتها' },
];

export const HERO_PRESETS: {
  id: HeroPresetId;
  ar: string;
  en: string;
  hint: string;
  kind: MotionKind;
  styleId: string;
  patch: Partial<MotionDraft>;
}[] = [
  {
    id: 'podcast',
    ar: 'بودكاست',
    en: 'Podcast Opener',
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
      brandVoice: 'friendly',
    },
  },
  {
    id: 'channel',
    ar: 'حزمة قناة',
    en: 'Channel Package',
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
      brandVoice: 'cinematic',
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

export const PROJECT_TYPES: { id: string; ar: string; en: string }[] = [
  { id: 'youtube_intro', ar: 'انترو يوتيوب', en: 'YouTube intro bumper' },
  { id: 'youtube_outro', ar: 'أوترو يوتيوب', en: 'YouTube outro / end card' },
  { id: 'tiktok', ar: 'تيك توك', en: 'TikTok ident' },
  { id: 'instagram', ar: 'إنستغرام', en: 'Instagram ident' },
  { id: 'reels', ar: 'ريلز', en: 'Reels opener' },
  { id: 'shorts', ar: 'شورتس', en: 'Shorts ident' },
  { id: 'podcast', ar: 'بودكاست', en: 'podcast opener' },
  { id: 'corporate', ar: 'شركات', en: 'corporate ident' },
  { id: 'company_presentation', ar: 'عرض شركة', en: 'company presentation opener' },
  { id: 'advertisement', ar: 'إعلان', en: 'advertisement bumper — still an ident, not a product commercial' },
  { id: 'product_video', ar: 'فيديو منتج', en: 'product-video opener ident' },
  { id: 'educational', ar: 'تعليمي', en: 'educational opener' },
  { id: 'news', ar: 'أخبار', en: 'news bumper — original, never imitate a real network' },
  { id: 'gaming', ar: 'ألعاب', en: 'gaming ident' },
  { id: 'sports', ar: 'رياضة', en: 'sports ident' },
  { id: 'fashion', ar: 'أزياء', en: 'fashion ident' },
  { id: 'restaurant', ar: 'مطعم', en: 'restaurant / hospitality ident' },
  { id: 'realestate', ar: 'عقارات', en: 'real-estate ident' },
  { id: 'technology', ar: 'تقنية', en: 'technology ident' },
  { id: 'personal_brand', ar: 'علامة شخصية', en: 'personal-brand ident' },
  { id: 'event', ar: 'فعالية', en: 'event opener' },
  { id: 'wedding', ar: 'مناسبة / زفاف', en: 'wedding / ceremony ident — tasteful, not a template clone' },
  { id: 'documentary', ar: 'وثائقي', en: 'documentary opener' },
  { id: 'film', ar: 'فيلم', en: 'film-title ident' },
  { id: 'channel', ar: 'حزمة قناة', en: 'channel package ident' },
  { id: 'logo_sting', ar: 'وخزة شعار', en: 'logo sting only' },
  { id: 'other', ar: 'أخرى', en: 'custom ident' },
];

export const SOUND_OPTIONS: { id: MotionSound; ar: string; en: string }[] = [
  { id: 'none', ar: 'صامت', en: 'silent ident — no designed sting, no music bed, no vocals' },
  { id: 'cinematic', ar: 'سينمائي', en: 'cinematic low swell and a tasteful impact, no melody that sings, no vocals' },
  { id: 'corporate', ar: 'شركات', en: 'polished corporate ident sting, no speech' },
  { id: 'digital', ar: 'رقمي', en: 'clean digital tick and a short precision hit, no speech' },
  { id: 'impact', ar: 'ضربة', en: 'short athletic ident hit, no crowd, no commentary' },
  { id: 'whoosh', ar: 'وش', en: 'brief tasteful whoosh into a clean lockup, no vocals' },
  { id: 'minimal', ar: 'خفيف', en: 'almost silent: a single soft tick, then stillness' },
  { id: 'epic', ar: 'ملحمي', en: 'epic ident swell that resolves quickly, no choir lyrics, no vocals' },
  { id: 'luxury', ar: 'فاخر', en: 'restrained luxury whoosh and a soft golden impact, no melody that sings, no vocals' },
  { id: 'technology', ar: 'تقني', en: 'precise tech ident ticks resolving into a clean hit, no speech' },
  { id: 'ambient', ar: 'أجواء', en: 'quiet ambient air under the ident, no melody, no vocals' },
];

export const SOUND_HONESTY = 'الصوت يُخبز في توجيه المخرج — ليس مكتبة موسيقى منفصلة ولا ملف صوت مستقل';

export const ALPHA_HONESTY = 'المحرك يصدّر MP4 دون قناة ألفا. لا خلفية شفافة حقيقية.';

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
  { id: 'finance', ar: 'مالية' },
  { id: 'healthcare', ar: 'صحة' },
  { id: 'consulting', ar: 'استشارات' },
  { id: 'retail', ar: 'تجزئة' },
  { id: 'nonprofit', ar: 'غير ربحي' },
  { id: 'university', ar: 'جامعة' },
  { id: 'school', ar: 'مدرسة' },
  { id: 'government', ar: 'حكومي' },
  { id: 'sports', ar: 'رياضة' },
  { id: 'restaurant', ar: 'مطعم' },
  { id: 'event', ar: 'فعالية' },
  { id: 'wedding', ar: 'مناسبة' },
];

export const AUDIENCES: { id: string; ar: string }[] = [
  { id: 'personal', ar: 'علامة شخصية' },
  { id: 'creator', ar: 'صانع محتوى' },
  { id: 'company', ar: 'شركة' },
  { id: 'org', ar: 'جهة' },
  { id: 'channel', ar: 'قناة' },
  { id: 'product', ar: 'منتج' },
  { id: 'service', ar: 'خدمة' },
  { id: 'event', ar: 'فعالية' },
  { id: 'community', ar: 'مجتمع' },
  { id: 'other', ar: 'أخرى' },
];

export const LANGUAGES: { id: MotionLanguage; ar: string }[] = [
  { id: 'ar', ar: 'عربي' },
  { id: 'en', ar: 'English' },
  { id: 'bilingual', ar: 'ثنائي' },
];

export const NAME_SCRIPTS: { id: NameScript; ar: string; en: string }[] = [
  { id: 'as_typed', ar: 'كما كُتب', en: 'spell the brand name exactly as typed, in its original script' },
  { id: 'ar', ar: 'ناجي', en: 'render the brand name in Arabic script only if it can be spelled perfectly connected RTL; otherwise hold the logo only' },
  { id: 'en', ar: 'NAJE', en: 'render the brand name in Latin capitals / English letterforms, spelled exactly' },
  { id: 'bilingual', ar: 'ناجي | NAJE', en: 'bilingual lockup of the brand name (Arabic RTL + Latin), do not collide scripts; omit a line rather than misspell it' },
];

export const BRAND_VOICES: { id: BrandVoice; ar: string; en: string }[] = [
  { id: 'professional', ar: 'مهني', en: 'professional, composed, trustworthy' },
  { id: 'bold', ar: 'جريء', en: 'bold, confident, still premium' },
  { id: 'elegant', ar: 'أنيق', en: 'elegant, restrained, high-finish' },
  { id: 'friendly', ar: 'ودود', en: 'warm, approachable, never childish chaos' },
  { id: 'technical', ar: 'تقني', en: 'precise, engineered, cool' },
  { id: 'youthful', ar: 'شبابي', en: 'youthful energy with readable lockup' },
  { id: 'corporate', ar: 'شركات', en: 'corporate broadcast confidence' },
  { id: 'cinematic', ar: 'سينمائي', en: 'cinematic atmosphere, filmic pacing' },
  { id: 'minimal', ar: 'بسيط', en: 'minimal, quiet, generous negative space' },
];

export const MOTIONS: { id: string; ar: string; en: string }[] = [
  { id: 'reveal', ar: 'كشف', en: 'elegant progressive reveal of the mark from atmosphere' },
  { id: 'assemble', ar: 'تجميع', en: 'brand elements assemble into a precise lockup' },
  { id: 'morph', ar: 'تحوّل', en: 'abstract brand-colored forms resolve INTO the undistorted logo — never morph the logo itself into another mark' },
  { id: 'light_sweep', ar: 'مسح ضوئي', en: 'a controlled light sweep across the logo surface' },
  { id: 'particle', ar: 'جزيئات', en: 'fine particles coalesce into the undistorted logo' },
  { id: 'rotation_3d', ar: 'دوران ثلاثي', en: 'a brief 3D rotation that settles into a flat undistorted lockup — no extrusion that breaks letterforms' },
  { id: 'camera_push', ar: 'اقتراب كاميرا', en: 'motivated camera push into the brand lockup' },
  { id: 'cinematic_reveal', ar: 'كشف سينمائي', en: 'cinematic atmospheric reveal, haze then lockup' },
  { id: 'glitch', ar: 'غليتش', en: 'brief tasteful digital glitch that resolves instantly into a clean mark — never chaotic' },
  { id: 'liquid', ar: 'سائل', en: 'liquid metallic / ink motion that resolves into the undistorted logo' },
  { id: 'smoke', ar: 'دخان', en: 'cinematic smoke / atmosphere that parts to reveal the undistorted mark' },
  { id: 'energy', ar: 'طاقة', en: 'controlled energy ribbons of brand light that form the lockup, then go still' },
  { id: 'minimal_fade', ar: 'ظهور بسيط', en: 'minimal fade-up, almost still, premium restraint' },
];

export const INTENSITIES: { id: MotionIntensity; ar: string; en: string }[] = [
  { id: 'subtle', ar: 'خفيف', en: 'subtle, restrained, luxury pacing' },
  { id: 'balanced', ar: 'متوازن', en: 'balanced broadcast pacing' },
  { id: 'dynamic', ar: 'ديناميكي', en: 'dynamic but still premium — no chaotic cuts' },
  { id: 'extreme', ar: 'أقصى', en: 'high-energy extreme motion that MUST still resolve to a readable undistorted logo hold — never unreadable' },
];

export const CAMERAS: { id: string; ar: string; en: string }[] = [
  { id: 'static', ar: 'ثابتة', en: 'locked-off static camera' },
  { id: 'slow_push', ar: 'اقتراب بطيء', en: 'slow cinematic push-in' },
  { id: 'zoom_in', ar: 'تكبير', en: 'controlled zoom-in onto the mark' },
  { id: 'zoom_out', ar: 'تصغير', en: 'controlled zoom-out that reveals the full lockup' },
  { id: 'orbit', ar: 'مدار', en: 'gentle orbital move around the lockup' },
  { id: 'pan', ar: 'بان', en: 'slow motivated pan that settles on the centered mark' },
  { id: 'tracking', ar: 'تتبّع', en: 'gentle tracking move, lockup remains readable' },
  { id: 'dolly', ar: 'دوللي سينمائي', en: 'cinematic dolly in, no handheld shake' },
];

export const LIGHTS: { id: string; ar: string; en: string }[] = [
  { id: 'soft', ar: 'ناعمة', en: 'soft even studio wrap' },
  { id: 'studio', ar: 'استوديو', en: 'clean three-point studio lighting' },
  { id: 'cinematic', ar: 'سينمائية', en: 'cinematic contrast, shaped shadows, volumetric haze' },
  { id: 'high_contrast', ar: 'تباين عالٍ', en: 'high contrast, graphic, still readable' },
  { id: 'neon', ar: 'نيون', en: 'controlled neon accents, never nightclub chaos' },
  { id: 'volumetric', ar: 'حجمية', en: 'volumetric god-rays and haze, logo remains sharp' },
  { id: 'golden', ar: 'ذهبية', en: 'golden warm key with tasteful speculars' },
  { id: 'cold', ar: 'باردة', en: 'cold steel-blue key, premium not clinical' },
  { id: 'dramatic', ar: 'درامية', en: 'dramatic chiaroscuro, single hero key' },
  { id: 'minimal', ar: 'خفيفة', en: 'minimal lighting, almost flat, luxury restraint' },
];

export const BACKDROPS: { id: string; ar: string; en: string }[] = [
  { id: 'solid', ar: 'لون مسطح', en: 'solid brand-color field' },
  { id: 'gradient', ar: 'تدرّج', en: 'subtle brand gradient' },
  { id: 'abstract', ar: 'تجريدي', en: 'abstract brand-colored geometry, never a screensaver' },
  { id: 'particles', ar: 'جزيئات', en: 'sparse atmospheric particles, never a screensaver' },
  { id: 'studio', ar: 'استوديو', en: 'dark professional studio cyclorama' },
  { id: 'cinematic', ar: 'سينمائي', en: 'cinematic dark stage with tasteful atmosphere' },
  { id: 'dark', ar: 'داكن', en: 'deep dark void with a hint of brand light' },
  { id: 'space', ar: 'فضاء', en: 'deep space atmosphere with brand-colored nebula hints, logo sharp in foreground' },
  { id: 'tech', ar: 'تقني', en: 'subtle tech grid / data field, never a HUD overlay of fake UI' },
  { id: 'nature', ar: 'طبيعة', en: 'restrained natural atmosphere (mist, dusk) behind the lockup' },
];

export const LOGO_BEHAVIORS: { id: string; ar: string; en: string }[] = [
  { id: 'center_hold', ar: 'ثبات في الوسط', en: 'logo holds center frame, undistorted' },
  { id: 'scale_in', ar: 'تكبير دخول', en: 'logo scales in to a centered lockup, no squash or stretch' },
  { id: 'light_sweep', ar: 'مسح ضوئي', en: 'logo is already formed; a light sweep reveals material and finish' },
  { id: 'depth', ar: 'عمق خفيف', en: 'subtle depth / parallax around the mark, logo itself stays undistorted and flat-true' },
];

export const LOGO_POSITIONS: { id: LogoPosition; ar: string; en: string }[] = [
  { id: 'center', ar: 'وسط', en: 'logo locked to frame center' },
  { id: 'left', ar: 'يسار', en: 'logo locked left, still inside title-safe' },
  { id: 'right', ar: 'يمين', en: 'logo locked right, still inside title-safe' },
  { id: 'top', ar: 'أعلى', en: 'logo in the upper third, inside title-safe' },
  { id: 'bottom', ar: 'أسفل', en: 'logo in the lower third, inside title-safe, clear of platform UI' },
];

export const LOGO_FINISHES: { id: LogoFinish; ar: string; en: string }[] = [
  { id: 'none', ar: 'بدون', en: 'no extra material treatment on the mark' },
  { id: 'glow', ar: 'توهج', en: 'subtle brand-color glow around the mark, never blooming over letterforms' },
  { id: 'shadow', ar: 'ظل', en: 'soft contact shadow under the mark' },
  { id: 'reflection', ar: 'انعكاس', en: 'tasteful floor reflection that does not split or duplicate the mark' },
];

export const TEXT_ANIMS: { id: string; ar: string; en: string }[] = [
  { id: 'fade', ar: 'ظهور', en: 'clean fade-up of type' },
  { id: 'slide', ar: 'انزلاق', en: 'short elegant slide into place' },
  { id: 'type', ar: 'كتابة', en: 'brief type-on that finishes spelled correctly — never mid-glyph garbage' },
  { id: 'reveal', ar: 'كشف', en: 'mask reveal of the line, letters stay intact' },
  { id: 'tracking', ar: 'تتبّع الحروف', en: 'subtle tracking settle, letters never scramble' },
  { id: 'split', ar: 'انقسام', en: 'split-line settle into a single readable lockup' },
  { id: 'scale', ar: 'تكبير', en: 'gentle scale-in of type, no bounce cartoon' },
  { id: 'blur', ar: 'ضباب', en: 'short blur-to-sharp of type' },
  { id: 'mask', ar: 'قناع', en: 'geometric mask wipe revealing the line' },
  { id: 'kinetic', ar: 'حركي', en: 'restrained kinetic type that ends perfectly spelled and still' },
  { id: 'minimal', ar: 'بسيط', en: 'almost no type motion — it is simply there' },
];

export const OUTRO_CTAS: { id: string; ar: string; en: string }[] = [
  { id: 'subscribe', ar: 'اشترك', en: 'Subscribe / اشترك end-card, spelled correctly, platform-safe' },
  { id: 'follow', ar: 'تابع', en: 'Follow / تابعنا, clean social end-card' },
  { id: 'website', ar: 'زر الموقع', en: 'Visit website lockup with the supplied URL only' },
  { id: 'contact', ar: 'تواصل معنا', en: 'Contact us end-card, no invented phone number' },
  { id: 'shop', ar: 'تسوّق الآن', en: 'Shop now end-card, no fake catalogue' },
  { id: 'watch_next', ar: 'شاهد التالي', en: 'Watch next / end-card prompt, no fake recommended-video thumbnails' },
  { id: 'see_you', ar: 'إلى اللقاء', en: 'See you next time / إلى اللقاء, warm close' },
  { id: 'logo_hold', ar: 'ثبات الشعار', en: 'no extra CTA copy — end on a clean logo hold only' },
  { id: 'custom', ar: 'مخصص', en: 'custom end line, spelled exactly as supplied' },
];

export const OUTRO_LAYOUTS: { id: OutroLayout; ar: string; en: string }[] = [
  { id: 'center', ar: 'دعوة وسط', en: 'centered CTA under the logo' },
  { id: 'split', ar: 'شاشة منقسمة', en: 'split-screen end card: mark one side, CTA the other, both title-safe' },
  { id: 'logo_socials', ar: 'شعار + حسابات', en: 'logo plus only the social handles the user supplied — never invent platforms' },
  { id: 'video_end', ar: 'كرت نهاية فيديو', en: 'video end card grammar, platform-safe' },
  { id: 'product_end', ar: 'كرت منتج', en: 'product end-card with logo and CTA, still an ident not a commercial' },
  { id: 'corporate_end', ar: 'كرت شركات', en: 'corporate end card, generous title-safe, no subscribe sticker' },
  { id: 'minimal_end', ar: 'كرت بسيط', en: 'minimal end card: mark, one line, hold' },
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

function tmpl(
  id: string,
  name: string,
  nameEn: string,
  hint: string,
  motionLevel: MotionIntensity,
  motionLevelAr: string,
  category: StyleCategory,
  categoryAr: string,
  gradient: [string, string],
  defaults: StyleTemplate['defaults'],
  audioHint: string
): StyleTemplate {
  return { id, name, nameEn, hint, motionLevel, motionLevelAr, category, categoryAr, gradient, defaults, audioHint };
}

export const STYLE_TEMPLATES: StyleTemplate[] = [
  tmpl('luxury', 'فاخر', 'Luxury', 'كشف رزين، معدن وذهب، ضوء حجمي', 'subtle', 'هادئ', 'luxe', 'فاخر', ['#2a1c10', '#d4a574'], { motion: 'light_sweep', intensity: 'subtle', camera: 'slow_push', lighting: 'golden', bgStyle: 'dark', logoBehavior: 'light_sweep', textAnim: 'fade' }, 'restrained luxury whoosh and a soft golden impact, no melody that sings, no vocals'),
  tmpl('tech', 'تقني', 'Tech', 'تجميع هندسي، شبكة ضوء نظيفة', 'balanced', 'متوازن', 'energy', 'طاقة', ['#0b1c1c', '#7dd3c7'], { motion: 'assemble', intensity: 'balanced', camera: 'orbit', lighting: 'neon', bgStyle: 'particles', logoBehavior: 'scale_in', textAnim: 'tracking' }, 'clean digital tick and a short precision hit, no speech'),
  tmpl('news', 'إخباري', 'News', 'بث واثق، حواف حادة، ثبات سريع', 'balanced', 'متوازن', 'broadcast', 'بث', ['#1a1010', '#c45c4a'], { motion: 'camera_push', intensity: 'balanced', camera: 'static', lighting: 'dramatic', bgStyle: 'solid', logoBehavior: 'center_hold', textAnim: 'slide' }, 'broadcast stinger, short and authoritative, no dialogue'),
  tmpl('kids', 'أطفال', 'Kids', 'ألوان دافئة، حركة مرحة دون فوضى', 'dynamic', 'ديناميكي', 'energy', 'طاقة', ['#2a1a08', '#e8b86d'], { motion: 'particle', intensity: 'dynamic', camera: 'zoom_in', lighting: 'soft', bgStyle: 'gradient', logoBehavior: 'scale_in', textAnim: 'slide' }, 'bright playful chime and a soft bounce, no lyrics, no cartoon voices'),
  tmpl('cinematic', 'سينمائي', 'Cinematic', 'ضباب حجمي، كشف بطيء، فيلم', 'subtle', 'هادئ', 'luxe', 'فاخر', ['#121018', '#d4a574'], { motion: 'reveal', intensity: 'balanced', camera: 'slow_push', lighting: 'cinematic', bgStyle: 'dark', logoBehavior: 'scale_in', textAnim: 'fade' }, 'cinematic low swell and a tasteful impact, no trailer voice-over'),
  tmpl('minimal', 'بسيط', 'Minimal', 'حركة قليلة، فراغ فاخر، وضوح', 'subtle', 'هادئ', 'luxe', 'فاخر', ['#161616', '#f4efe6'], { motion: 'minimal_fade', intensity: 'subtle', camera: 'static', lighting: 'soft', bgStyle: 'solid', logoBehavior: 'center_hold', textAnim: 'fade' }, 'almost silent: a single soft tick, then stillness'),
  tmpl('sport', 'رياضي', 'Sport', 'طاقة واثقة، اقتراب حاسم', 'dynamic', 'ديناميكي', 'energy', 'طاقة', ['#10180c', '#b8e05a'], { motion: 'camera_push', intensity: 'dynamic', camera: 'zoom_in', lighting: 'dramatic', bgStyle: 'studio', logoBehavior: 'scale_in', textAnim: 'slide' }, 'athletic hit and a short whoosh, no crowd chant, no commentary'),
  tmpl('corporate', 'شركات', 'Corporate', 'هندسي، نظيف، ثقة مؤسسية', 'balanced', 'متوازن', 'broadcast', 'بث', ['#101218', '#d4a574'], { motion: 'assemble', intensity: 'balanced', camera: 'static', lighting: 'soft', bgStyle: 'gradient', logoBehavior: 'center_hold', textAnim: 'tracking' }, 'polished corporate ident sting, no speech'),
  tmpl('gaming', 'ألعاب', 'Gaming', 'طاقة، غليتش منضبط يُحل فوراً', 'dynamic', 'ديناميكي', 'energy', 'طاقة', ['#140c1c', '#8b7cf6'], { motion: 'glitch', intensity: 'dynamic', camera: 'orbit', lighting: 'neon', bgStyle: 'particles', logoBehavior: 'scale_in', textAnim: 'tracking' }, 'short digital glitch-resolve into a clean hit, no voice chat, no lyrics'),
  tmpl('podcast', 'بودكاست', 'Podcast', 'حميمي، ضوء دافئ، ثبات الاسم', 'balanced', 'متوازن', 'broadcast', 'بث', ['#1a140c', '#e8b86d'], { motion: 'reveal', intensity: 'balanced', camera: 'slow_push', lighting: 'golden', bgStyle: 'studio', logoBehavior: 'center_hold', textAnim: 'fade' }, 'warm analog whoosh and a soft ident hit, no spoken intro'),
  tmpl('elegant', 'أنيق', 'Elegant', 'خطوط رفيعة، كشف هادئ، تباين ناعم', 'subtle', 'هادئ', 'luxe', 'فاخر', ['#1a1612', '#e8d5b5'], { motion: 'minimal_fade', intensity: 'subtle', camera: 'static', lighting: 'soft', bgStyle: 'gradient', logoBehavior: 'center_hold', textAnim: 'tracking' }, 'a single crystalline tick, then silence — no melody, no vocals'),
  tmpl('documentary', 'وثائقي', 'Documentary', 'ضوء طبيعي، كشف بطيء، جدية هادئة', 'subtle', 'هادئ', 'broadcast', 'بث', ['#141210', '#c4a574'], { motion: 'reveal', intensity: 'subtle', camera: 'slow_push', lighting: 'cinematic', bgStyle: 'dark', logoBehavior: 'center_hold', textAnim: 'fade' }, 'low documentary swell, no narration, no score melody, no vocals'),
  tmpl('education', 'تعليمي', 'Education', 'وضوح، ثقة هادئة، قراءة فورية', 'balanced', 'متوازن', 'learn', 'تعليم', ['#101418', '#7dd3c7'], { motion: 'assemble', intensity: 'balanced', camera: 'static', lighting: 'soft', bgStyle: 'solid', logoBehavior: 'center_hold', textAnim: 'slide' }, 'clean educational sting, short and friendly, no lecture voice'),
  tmpl('futuristic', 'مستقبلي', 'Futuristic', 'خطوط ضوء، عمق، قفل هندسي', 'balanced', 'متوازن', 'energy', 'طاقة', ['#0a121c', '#7dd3c7'], { motion: 'energy', intensity: 'balanced', camera: 'orbit', lighting: 'volumetric', bgStyle: 'tech', logoBehavior: 'scale_in', textAnim: 'tracking' }, 'precise tech ident ticks resolving into a clean hit, no speech'),
  tmpl('neon', 'نيون', 'Neon', 'نيون منضبط، ليس ديسكو', 'dynamic', 'ديناميكي', 'energy', 'طاقة', ['#12081a', '#c45cff'], { motion: 'glitch', intensity: 'dynamic', camera: 'zoom_in', lighting: 'neon', bgStyle: 'dark', logoBehavior: 'light_sweep', textAnim: 'tracking' }, 'short neon hit, no club music, no vocals'),
  tmpl('metallic', 'معدني', 'Metallic', 'معدن مصقول، مسح ضوء', 'subtle', 'هادئ', 'luxe', 'فاخر', ['#161414', '#c9b8a0'], { motion: 'light_sweep', intensity: 'subtle', camera: 'slow_push', lighting: 'studio', bgStyle: 'studio', logoBehavior: 'light_sweep', textAnim: 'fade' }, 'metallic whoosh, no vocals' ),
  tmpl('editorial', 'تحريري', 'Editorial', 'طباعة واثقة، كشف هادئ', 'subtle', 'هادئ', 'broadcast', 'بث', ['#141210', '#f4efe6'], { motion: 'minimal_fade', intensity: 'subtle', camera: 'static', lighting: 'high_contrast', bgStyle: 'solid', logoBehavior: 'center_hold', textAnim: 'tracking' }, 'a single editorial tick, then silence'),
  tmpl('fashion', 'أزياء', 'Fashion', 'أناقة بطيئة، تباين ناعم', 'subtle', 'هادئ', 'luxe', 'فاخر', ['#1a1014', '#e8d5b5'], { motion: 'cinematic_reveal', intensity: 'subtle', camera: 'slow_push', lighting: 'soft', bgStyle: 'gradient', logoBehavior: 'center_hold', textAnim: 'fade' }, 'soft luxury whoosh, no vocals'),
  tmpl('food', 'طعام', 'Food', 'دفء، ضوء شهّي، ثبات الاسم', 'balanced', 'متوازن', 'learn', 'تعليم', ['#1c140c', '#e8b86d'], { motion: 'reveal', intensity: 'balanced', camera: 'slow_push', lighting: 'golden', bgStyle: 'studio', logoBehavior: 'scale_in', textAnim: 'fade' }, 'warm hospitality sting, no voice-over of a menu'),
  tmpl('organic', 'عضوي', 'Organic', 'حركة سائلة هادئة، طبيعة', 'subtle', 'هادئ', 'luxe', 'فاخر', ['#10180c', '#b8e05a'], { motion: 'liquid', intensity: 'subtle', camera: 'static', lighting: 'soft', bgStyle: 'nature', logoBehavior: 'center_hold', textAnim: 'fade' }, 'soft natural air, no folk song, no vocals'),
  tmpl('glass', 'زجاجي', 'Glass', 'زجاج وضوء، انعكاس خفيف', 'subtle', 'هادئ', 'luxe', 'فاخر', ['#101418', '#cde8f4'], { motion: 'reveal', intensity: 'subtle', camera: 'slow_push', lighting: 'soft', bgStyle: 'gradient', logoBehavior: 'light_sweep', textAnim: 'fade' }, 'crystalline tick, then silence'),
  tmpl('premium', 'بريميوم', 'Premium', 'فراغ، معدن، ثقة', 'subtle', 'هادئ', 'luxe', 'فاخر', ['#12100c', '#d4a574'], { motion: 'light_sweep', intensity: 'subtle', camera: 'dolly', lighting: 'golden', bgStyle: 'dark', logoBehavior: 'center_hold', textAnim: 'minimal' }, 'restrained luxury whoosh, no vocals'),
  tmpl('clean', 'نظيف', 'Clean', 'أبيض/داكن نظيف، حركة قليلة', 'subtle', 'هادئ', 'learn', 'تعليم', ['#0e1014', '#f4efe6'], { motion: 'minimal_fade', intensity: 'subtle', camera: 'static', lighting: 'minimal', bgStyle: 'solid', logoBehavior: 'center_hold', textAnim: 'fade' }, 'almost silent: a single soft tick, then stillness'),
  tmpl('dark', 'داكن', 'Dark', 'فراغ أسود، ضوء علامة واحد', 'subtle', 'هادئ', 'luxe', 'فاخر', ['#08080a', '#d4a574'], { motion: 'cinematic_reveal', intensity: 'subtle', camera: 'slow_push', lighting: 'dramatic', bgStyle: 'dark', logoBehavior: 'scale_in', textAnim: 'fade' }, 'low cinematic swell, no vocals'),
  tmpl('energetic', 'حيوي', 'Energetic', 'طاقة واثقة دون فوضى', 'dynamic', 'ديناميكي', 'energy', 'طاقة', ['#1a0c0c', '#e8b86d'], { motion: 'energy', intensity: 'dynamic', camera: 'zoom_in', lighting: 'high_contrast', bgStyle: 'particles', logoBehavior: 'scale_in', textAnim: 'slide' }, 'short energy hit and whoosh, no lyrics'),
  tmpl('realestate', 'عقارات', 'Real Estate', 'ثقة، ضوء دافئ، ثبات الاسم', 'balanced', 'متوازن', 'broadcast', 'بث', ['#14120c', '#d4a574'], { motion: 'assemble', intensity: 'balanced', camera: 'slow_push', lighting: 'golden', bgStyle: 'gradient', logoBehavior: 'center_hold', textAnim: 'slide' }, 'polished hospitality sting, no speech'),
  tmpl('startup', 'ناشئة', 'Startup', 'وضوح، طاقة محسوبة', 'balanced', 'متوازن', 'energy', 'طاقة', ['#0c1018', '#7dd3c7'], { motion: 'assemble', intensity: 'balanced', camera: 'zoom_in', lighting: 'studio', bgStyle: 'tech', logoBehavior: 'scale_in', textAnim: 'tracking' }, 'clean digital tick, no speech'),
];

export const VARIATIONS: { id: string; ar: string; en: string; patch: Partial<MotionDraft> }[] = [
  { id: 'minimal', ar: 'بسيط', en: 'A — Minimal', patch: { intensity: 'subtle', motion: 'minimal_fade', camera: 'static', lighting: 'minimal', bgStyle: 'solid' } },
  { id: 'cinematic', ar: 'سينمائي', en: 'B — Cinematic', patch: { intensity: 'balanced', lighting: 'cinematic', camera: 'slow_push', motion: 'cinematic_reveal' } },
  { id: 'dynamic', ar: 'ديناميكي', en: 'C — Dynamic', patch: { intensity: 'dynamic', camera: 'zoom_in', motion: 'energy' } },
  { id: 'premium', ar: 'بريميوم', en: 'D — Premium', patch: { intensity: 'subtle', lighting: 'golden', motion: 'light_sweep', logoBehavior: 'light_sweep' } },
];

export const INDUSTRY_STYLE: Record<string, string> = {
  tech: 'tech',
  media: 'cinematic',
  education: 'education',
  podcast: 'podcast',
  games: 'gaming',
  fashion: 'fashion',
  food: 'food',
  realestate: 'realestate',
  corporate: 'corporate',
  personal: 'minimal',
  channel: 'cinematic',
  finance: 'corporate',
  healthcare: 'clean',
  consulting: 'corporate',
  retail: 'energetic',
  nonprofit: 'elegant',
  university: 'education',
  school: 'education',
  government: 'corporate',
  sports: 'sport',
  restaurant: 'food',
  event: 'cinematic',
  wedding: 'elegant',
};

export function emptyDraft(): MotionDraft {
  return {
    kind: 'intro',
    activePiece: 'intro',
    duration: 5,
    aspect: '16:9',
    resolution: '720p',
    brandName: '',
    tagline: '',
    description: '',
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
    socials: '',
    brandVoice: 'cinematic',
    logoPosition: 'center',
    logoFinish: 'none',
    outroLayout: 'center',
    nameScript: 'as_typed',
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
  'tagline',
  'socials',
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

const SOUND_IDS: MotionSound[] = [
  'none',
  'cinematic',
  'corporate',
  'digital',
  'impact',
  'whoosh',
  'minimal',
  'epic',
  'luxury',
  'technology',
  'ambient',
];
const PLATFORM_IDS: MotionPlatform[] = ['youtube', 'tiktok', 'instagram', 'podcast', 'corporate', ''];
const INTENSITY_IDS: MotionIntensity[] = ['subtle', 'balanced', 'dynamic', 'extreme'];
const VOICE_IDS: BrandVoice[] = [
  'professional',
  'bold',
  'elegant',
  'friendly',
  'technical',
  'youthful',
  'corporate',
  'cinematic',
  'minimal',
];
const POS_IDS: LogoPosition[] = ['center', 'left', 'right', 'top', 'bottom'];
const FINISH_IDS: LogoFinish[] = ['none', 'glow', 'shadow', 'reflection'];
const LAYOUT_IDS: OutroLayout[] = [
  'center',
  'split',
  'logo_socials',
  'video_end',
  'product_end',
  'corporate_end',
  'minimal_end',
];
const SCRIPT_IDS: NameScript[] = ['as_typed', 'ar', 'en', 'bilingual'];
const ASPECT_IDS: MotionAspect[] = ['16:9', '9:16', '1:1', '4:5'];

export function loadDraft(): MotionDraft {
  try {
    const raw = localStorage.getItem(MOTION_STORAGE_KEY);
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as Partial<MotionDraft>;
    const base = emptyDraft();
    const intensity = INTENSITY_IDS.includes(parsed.intensity as MotionIntensity)
      ? (parsed.intensity as MotionIntensity)
      : base.intensity;
    return {
      ...base,
      ...parsed,
      logo: typeof parsed.logo === 'string' ? parsed.logo : null,
      brandLock: parsed.brandLock !== false,
      sound: SOUND_IDS.includes(parsed.sound as MotionSound) ? (parsed.sound as MotionSound) : base.sound,
      platform: PLATFORM_IDS.includes(parsed.platform as MotionPlatform)
        ? (parsed.platform as MotionPlatform)
        : base.platform,
      intensity,
      aspect: ASPECT_IDS.includes(parsed.aspect as MotionAspect) ? (parsed.aspect as MotionAspect) : base.aspect,
      accent: isHex(String(parsed.accent || '')) ? String(parsed.accent) : base.accent,
      textColor: isHex(String(parsed.textColor || '')) ? String(parsed.textColor) : base.textColor,
      website: typeof parsed.website === 'string' ? parsed.website : '',
      brandRules: typeof parsed.brandRules === 'string' ? parsed.brandRules : '',
      projectType: typeof parsed.projectType === 'string' ? parsed.projectType : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
      socials: typeof parsed.socials === 'string' ? parsed.socials : '',
      brandVoice: VOICE_IDS.includes(parsed.brandVoice as BrandVoice)
        ? (parsed.brandVoice as BrandVoice)
        : base.brandVoice,
      logoPosition: POS_IDS.includes(parsed.logoPosition as LogoPosition)
        ? (parsed.logoPosition as LogoPosition)
        : base.logoPosition,
      logoFinish: FINISH_IDS.includes(parsed.logoFinish as LogoFinish)
        ? (parsed.logoFinish as LogoFinish)
        : base.logoFinish,
      outroLayout: LAYOUT_IDS.includes(parsed.outroLayout as OutroLayout)
        ? (parsed.outroLayout as OutroLayout)
        : base.outroLayout,
      nameScript: SCRIPT_IDS.includes(parsed.nameScript as NameScript)
        ? (parsed.nameScript as NameScript)
        : base.nameScript,
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
  const ptype = PROJECT_TYPES.find((p) => p.id === draft.projectType);
  const brand = draft.brandName.trim() || 'بدون اسم بعد';
  const parts = [
    brand,
    slotLabelAr(slot),
    `${draft.duration}ث`,
    style?.name || draft.styleId,
    motion?.ar || draft.motion,
    draft.aspect,
  ];
  if (ptype) parts.push(ptype.ar);
  if (sound && draft.sound !== 'none') parts.push(sound.ar);
  if (draft.brandLock) parts.push('هوية مقفولة');
  return parts.join(' · ');
}

export function motionFilename(
  brandName: string,
  slot: IdentSlot,
  duration: MotionDuration,
  aspect?: MotionAspect
): string {
  const raw = (brandName || 'Naje').trim() || 'Naje';
  const brand = raw.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '').replace(/\s+/g, '_').slice(0, 48) || 'Naje';
  const piece = slot === 'outro' ? 'Outro' : slot === 'logo' ? 'Logo' : 'Intro';
  const ar = aspect ? `_${aspect.replace(':', 'x')}` : '';
  return `${brand}_${piece}_${duration}s${ar}.mp4`;
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
  if (aspect === '4:5') {
    return 'Delivered frame is 9:16 vertical. Compose a 4:5 Instagram-safe lockup inside that 9:16 frame (centered 4:5 window). Nothing essential in the leftover top/bottom strips. This is not native 4:5 output.';
  }
  return 'Aspect 9:16 vertical (Shorts / TikTok). Keep logo and type in the central safe area, away from UI chrome at top and bottom.';
}

function inferredPlatform(draft: MotionDraft): MotionPlatform {
  if (draft.platform) return draft.platform;
  const pt = draft.projectType;
  if (pt === 'youtube_intro' || pt === 'youtube_outro' || pt === 'channel') return 'youtube';
  if (pt === 'tiktok' || pt === 'shorts') return 'tiktok';
  if (pt === 'instagram' || pt === 'reels') return 'instagram';
  if (pt === 'podcast') return 'podcast';
  if (pt === 'corporate' || pt === 'company_presentation') return 'corporate';
  return '';
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
  const voice = pick(BRAND_VOICES, draft.brandVoice);
  const pos = pick(LOGO_POSITIONS, draft.logoPosition);
  const finish = pick(LOGO_FINISHES, draft.logoFinish);
  const layout = pick(OUTRO_LAYOUTS, draft.outroLayout);
  const ptype = pick(PROJECT_TYPES, draft.projectType);
  const script = pick(NAME_SCRIPTS, draft.nameScript);
  const plan = computeMotionPlan(draft, slot);

  const lines: string[] = [];
  lines.push(
    `Create a premium broadcast-quality ${slotNoun(slot)} for "${brand}". ` +
      `This is a channel/company ident, not a live-action product commercial, not UGC, not a talking-head.`
  );
  lines.push(durationBlock(draft.duration, plan));
  lines.push(aspectBlock(draft.aspect));
  const plat = platformBlock(inferredPlatform(draft));
  if (plat) lines.push(plat);
  if (ptype) lines.push(`Project type: ${ptype.en}. Shape pacing and end-card grammar for this use.`);
  lines.push(
    `Brand colors locked: primary ${draft.primary}, secondary ${draft.secondary}, accent ${draft.accent}, background ${draft.bgColor}, text ${draft.textColor}. ` +
      `Grade every frame to this palette. On-screen type uses ${draft.textColor}. Accent ${draft.accent} only as a controlled highlight. No random neon unless lighting is neon.`
  );

  if (script) lines.push(`Brand-name lettering: ${script.en}.`);

  if (draft.tagline.trim()) {
    lines.push(
      `On-screen tagline, spelled exactly: "${draft.tagline.trim()}". ` +
        `If it cannot be spelled perfectly, omit the tagline rather than misspell it.`
    );
  } else {
    lines.push('No tagline unless the brand name itself needs a short hold caption.');
  }

  if (draft.description.trim()) {
    lines.push(`Brand description (tone only, do not typeset this paragraph): ${draft.description.trim().slice(0, 400)}`);
  }

  if (draft.website.trim()) {
    lines.push(
      `On-screen website only if it fits the lockup, spelled exactly: "${draft.website.trim()}". ` +
        `Do not invent a different URL. If it cannot be spelled perfectly, omit it rather than misspell it.`
    );
  }

  if (draft.socials.trim()) {
    lines.push(
      `Social handles, ONLY these, spelled exactly, no extra platforms, no invented icons: "${draft.socials.trim().slice(0, 240)}". ` +
        `If a handle cannot be spelled perfectly, omit it.`
    );
  } else {
    lines.push('No social icons. Do not invent YouTube / Instagram / TikTok / X marks the user did not supply.');
  }

  lines.push(languageBlock(draft));
  lines.push(
    `Tone: ${style?.nameEn || 'cinematic'} ident (${style?.hint || ''}). ` +
      `Industry: ${industry?.ar || 'unspecified'}. Audience: ${audience?.ar || 'creator'}. ` +
      `Brand voice: ${voice?.en || draft.brandVoice}.`
  );
  lines.push(
    `Motion vocabulary: ${motion?.en || draft.motion}. Intensity: ${intensity?.en || draft.intensity}. ` +
      `Camera: ${camera?.en || draft.camera}. Lighting: ${light?.en || draft.lighting}. ` +
      `Background: ${backdrop?.en || draft.bgStyle}. Logo behavior: ${logoMove?.en || draft.logoBehavior}. ` +
      `Logo position: ${pos?.en || draft.logoPosition}. Logo finish: ${finish?.en || draft.logoFinish}. ` +
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
      `OUTRO close: ${cta?.en || 'clean end-card'}. Layout: ${layout?.en || 'centered CTA'}.` +
        (custom ? ` Custom line, spelled exactly: "${custom}".` : '') +
        site +
        ' Platform-safe margins. End on a clean logo hold. No QR code unless the user supplied a URL AND it can be drawn as a tasteful unreadable graphic — never claim a scannable QR; prefer the spelled URL instead of a fake QR.'
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
      'Finish on a still, undistorted logo hold. Opaque MP4 — never a transparent background.'
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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isHex(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const ss = Math.max(0, Math.min(100, s)) / 100;
  const ll = Math.max(0, Math.min(100, l)) / 100;
  const hh = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ll - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 60) { r = c; g = x; }
  else if (hh < 120) { r = x; g = c; }
  else if (hh < 180) { g = c; b = x; }
  else if (hh < 240) { g = x; b = c; }
  else if (hh < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/** Honest HSL companions from the current primary — not an AI model. */
export function generatePaletteFromPrimary(primary: string): {
  primary: string;
  secondary: string;
  accent: string;
  bgColor: string;
  textColor: string;
} {
  const hsl = hexToHsl(primary) || { h: 32, s: 55, l: 64 };
  return {
    primary: isHex(primary) ? primary : '#d4a574',
    secondary: hslToHex((hsl.h + 28) % 360, Math.min(78, hsl.s + 6), Math.min(78, hsl.l + 14)),
    accent: hslToHex((hsl.h + 168) % 360, Math.min(70, hsl.s + 4), Math.max(38, hsl.l - 10)),
    bgColor: hslToHex(hsl.h, Math.min(28, hsl.s * 0.45), 5),
    textColor: '#f4efe6',
  };
}

export function contrastWarn(a: string, b: string): boolean {
  const aa = hexToRgb(a);
  const bb = hexToRgb(b);
  if (!aa || !bb) return false;
  return Math.abs(luma(aa.r, aa.g, aa.b) - luma(bb.r, bb.g, bb.b)) < 48;
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

/** Rasterize SVG (or any image) to PNG data-URL so Omni receives a bitmap. */
export function rasterizeLogo(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const iw = img.naturalWidth || img.width || 512;
        const ih = img.naturalHeight || img.height || 512;
        const maxSide = 1024;
        const scale = Math.min(1, maxSide / Math.max(iw, ih));
        canvas.width = Math.max(32, Math.round(iw * scale));
        canvas.height = Math.max(32, Math.round(ih * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
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

export function autoBrandPatch(draft: MotionDraft): Partial<MotionDraft> {
  const styleId = (draft.industry && INDUSTRY_STYLE[draft.industry]) || draft.styleId || 'cinematic';
  const t = STYLE_TEMPLATES.find((s) => s.id === styleId);
  const voice: BrandVoice =
    draft.industry === 'games' || draft.industry === 'sports'
      ? 'bold'
      : draft.industry === 'corporate' || draft.industry === 'finance' || draft.industry === 'government'
        ? 'corporate'
        : draft.industry === 'podcast'
          ? 'friendly'
          : draft.industry === 'fashion' || draft.industry === 'wedding'
            ? 'elegant'
            : draft.industry === 'tech'
              ? 'technical'
              : 'cinematic';
  const sound: MotionSound =
    t?.id === 'minimal' || t?.id === 'clean'
      ? 'minimal'
      : t?.id === 'gaming' || t?.id === 'sport' || t?.id === 'energetic'
        ? 'impact'
        : t?.id === 'tech' || t?.id === 'futuristic' || t?.id === 'startup'
          ? 'technology'
          : t?.id === 'luxury' || t?.id === 'premium' || t?.id === 'fashion'
            ? 'luxury'
            : t?.id === 'corporate' || t?.id === 'news'
              ? 'corporate'
              : 'cinematic';
  return {
    styleId,
    ...(t?.defaults || {}),
    brandVoice: voice,
    sound,
  };
}

export function surpriseDirection(draft: MotionDraft): MotionDraft {
  const pool = STYLE_TEMPLATES;
  const t = pool[Math.floor(Math.random() * pool.length)];
  let next = applyTemplate(draft, t.id);
  const motions = MOTIONS.map((m) => m.id);
  const cameras = CAMERAS.map((c) => c.id);
  next = {
    ...next,
    motion: motions[Math.floor(Math.random() * motions.length)],
    camera: cameras[Math.floor(Math.random() * cameras.length)],
    intensity: t.motionLevel === 'subtle' ? 'subtle' : t.motionLevel === 'dynamic' ? 'dynamic' : 'balanced',
  };
  if (draft.brandLock) {
    const locked: Partial<MotionDraft> = {};
    for (const key of IDENTITY_LOCK_KEYS) {
      (locked as any)[key] = draft[key];
    }
    next = { ...next, ...locked };
  }
  return next;
}

export function draftPracticeHints(draft: MotionDraft, slot: IdentSlot): PracticeHint[] {
  const hints: PracticeHint[] = [];
  const lines = [draft.brandName, draft.tagline, draft.website, draft.customCta, draft.socials]
    .map((s) => s.trim())
    .filter(Boolean);
  if (draft.duration === 5 && (draft.tagline.trim().length > 36 || lines.length >= 4)) {
    hints.push({
      id: 'too_much_text',
      ar: 'نص كثير لمدة 5 ثوانٍ — قد لا يُقرأ. اختصر الشعار النصي أو أخفِ الموقع من الشاشة.',
      level: 'warn',
    });
  }
  if (draft.tagline.trim().length > 64) {
    hints.push({
      id: 'long_tagline',
      ar: 'الشعار النصي طويل وقد يصعب قراءته على الشاشة.',
      level: 'warn',
    });
  }
  if (
    draft.duration === 5 &&
    draft.intensity === 'subtle' &&
    (draft.motion === 'reveal' || draft.motion === 'cinematic_reveal' || draft.motion === 'minimal_fade')
  ) {
    hints.push({
      id: 'slow_5s',
      ar: 'خمس ثوانٍ مع كشف بطيء قد تُشعر بالبطء. زد الشدة أو اختصر الحركة.',
      level: 'note',
    });
  }
  if (draft.intensity === 'extreme' && draft.logoBehavior !== 'center_hold') {
    hints.push({
      id: 'logo_small',
      ar: 'حركة عنيفة قد تُصغّر الشعار. ثبات في الوسط أوضح للهوية.',
      level: 'warn',
    });
  }
  if (draft.intensity === 'extreme' && (draft.motion === 'glitch' || draft.bgStyle === 'particles')) {
    hints.push({
      id: 'fx_heavy',
      ar: 'مؤثرات كثيفة مع شدة قصوى قد تُضعف وضوح العلامة.',
      level: 'warn',
    });
  }
  if (contrastWarn(draft.primary, draft.bgColor) || contrastWarn(draft.textColor, draft.bgColor)) {
    hints.push({
      id: 'contrast',
      ar: 'تباين الألوان ضعيف بين النص/الأساسي والخلفية — قد يصعب القراءة.',
      level: 'warn',
    });
  }
  if (slot === 'outro' && draft.outroCta === 'website' && !draft.website.trim()) {
    hints.push({
      id: 'cta_url',
      ar: 'دعوة الموقع بلا رابط — أضف الموقع أو غيّر الدعوة.',
      level: 'warn',
    });
  }
  if (slot === 'outro' && draft.outroCta === 'custom' && !draft.customCta.trim()) {
    hints.push({
      id: 'custom_empty',
      ar: 'دعوة مخصصة فارغة.',
      level: 'warn',
    });
  }
  if (slot === 'outro' && draft.outroLayout === 'logo_socials' && !draft.socials.trim()) {
    hints.push({
      id: 'no_socials',
      ar: 'تخطيط شعار + حسابات دون حسابات مكتوبة — لن نختلق أيقونات.',
      level: 'note',
    });
  }
  if (!draft.logo && !draft.brandName.trim()) {
    hints.push({
      id: 'no_mark',
      ar: 'لا شعار ولا اسم بعد — اكتب الاسم على الأقل.',
      level: 'warn',
    });
  }
  return hints;
}

export function designExplanation(draft: MotionDraft, slot: IdentSlot): string {
  const motion = pick(MOTIONS, draft.motion);
  const intensity = pick(INTENSITIES, draft.intensity);
  const light = pick(LIGHTS, draft.lighting);
  const hold = draft.duration === 5 ? 'ثبات الشعار في الثواني 5–10 داخل نافذة المحرك' : 'ثبات أخير لنحو ثانيتين';
  return (
    `اخترت «${motion?.ar || draft.motion}» لأنها تناسب ${slotLabelAr(slot)} لمدة ${draft.duration} ثوانٍ وتحافظ على وضوح الشعار. ` +
    `الشدة «${intensity?.ar || draft.intensity}» — ليست القصوى افتراضياً. ` +
    `الإضاءة «${light?.ar || draft.lighting}». ${hold}.`
  );
}

export const DIRECTOR_STEPS: { at: number; ar: string }[] = [
  { at: 0, ar: 'قراءة الهوية' },
  { at: 20, ar: 'بناء مفهوم الحركة' },
  { at: 40, ar: 'تصميم الكشف' },
  { at: 60, ar: 'توقيت الضربات' },
  { at: 80, ar: 'تجهيز الإخراج' },
];

export function directorStepForProgress(progress: number): string {
  let label = DIRECTOR_STEPS[0].ar;
  for (const s of DIRECTOR_STEPS) {
    if (progress >= s.at) label = s.ar;
  }
  return label;
}
