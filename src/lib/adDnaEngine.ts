import { AVATAR_REGISTRY, NajiAvatar } from '../data/avatars/avatarRegistry';
import { LOCATION_REGISTRY, NajiLocation } from '../data/locations/locationRegistry';

import { VIDEO_STYLE_TEMPLATES } from '../data/videoStyleTemplates';
export interface AdDnaState {
  selectedStyleTemplateId: string | null;
  selectedAvatarId: string | null;
  selectedLocationId: string | null;
  language: string;
  dialect: string;
  platform: string;
  style: string;
  aspectRatio: '16:9' | '9:16';
  lighting: string;
  cameraAngle: string;
  tone: string;
}

export type FieldStatus = 'active' | 'locked' | 'hidden' | 'conditional' | 'overridable' | 'conflict';

export interface FieldInfo {
  status: FieldStatus;
  reason?: string;
  lockedValue?: any;
  derivedValue?: any;
}

export interface FieldStatusMap {
  [fieldKey: string]: FieldInfo;
}

export const INITIAL_AD_DNA_STATE: AdDnaState = {
  selectedStyleTemplateId: null,
  selectedAvatarId: 'NAJI-001',
  selectedLocationId: 'LOC-001',
  language: 'ar',
  dialect: 'standard_modern',
  platform: 'general',
  style: 'cinematic_commercial',
  aspectRatio: '16:9',
  lighting: 'soft_daylight',
  cameraAngle: 'eye_level_50mm',
  tone: 'professional_warm'
};

export const PLATFORM_OPTIONS = [
  { id: 'general', label: 'عام / متعدد المنصات', defaultRatio: '16:9' },
  { id: 'tiktok', label: 'TikTok (عمودي 9:16)', defaultRatio: '9:16' },
  { id: 'instagram_reels', label: 'Instagram Reels & Stories (عمودي 9:16)', defaultRatio: '9:16' },
  { id: 'youtube', label: 'YouTube Standard (أفقي 16:9)', defaultRatio: '16:9' },
  { id: 'youtube_shorts', label: 'YouTube Shorts (عمودي 9:16)', defaultRatio: '9:16' },
  { id: 'snapchat', label: 'Snapchat Ads (عمودي 9:16)', defaultRatio: '9:16' },
  { id: 'tv_commercial', label: 'إعلان تلفزيوني / شاشات رقمية (16:9)', defaultRatio: '16:9' }
];

export const LANGUAGE_OPTIONS = [
  { id: 'ar', label: 'العربية (Arabic)' },
  { id: 'en', label: 'الإنجليزية (English)' },
  { id: 'fr', label: 'الفرنسية (French)' },
  { id: 'es', label: 'الإسبانية (Spanish)' },
  { id: 'tr', label: 'التركية (Turkish)' },
  { id: 'de', label: 'الألمانية (German)' }
];

export const DIALECT_OPTIONS: Record<string, { id: string; label: string }[]> = {
  ar: [
    { id: 'standard_modern', label: 'فصحى معاصرة (MSA)' },
    { id: 'gulf_saudi', label: 'خليجية / سعودية' },
    { id: 'gulf_emirati', label: 'إماراتية' },
    { id: 'levantine_syrian_lebanese', label: 'شامية (سورية / لبنانية / أردنية)' },
    { id: 'egyptian', label: 'مصرية' },
    { id: 'maghrebi_moroccan', label: 'مغاربية' },
    { id: 'iraqi', label: 'عراقية' }
  ],
  en: [
    { id: 'us_standard', label: 'American Standard' },
    { id: 'uk_rp', label: 'British RP' },
    { id: 'global_neutral', label: 'Global International English' }
  ],
  fr: [
    { id: 'fr_standard', label: 'Français Standard' }
  ],
  es: [
    { id: 'es_castilian', label: 'Español' }
  ],
  tr: [
    { id: 'tr_istanbul', label: 'Türkçe' }
  ],
  de: [
    { id: 'de_standard', label: 'Deutsch' }
  ]
};

export const STYLE_OPTIONS = [
  { id: 'cinematic_commercial', label: 'إعلان سينمائي فاخر', promptEn: 'Cinematic High-End' },
  { id: 'lifestyle_organic', label: 'واقعي / لايف ستايل', promptEn: 'Authentic Lifestyle' },
  { id: 'tech_minimalist', label: 'تقني ومينيماليست', promptEn: 'Tech Minimalist' },
  { id: 'high_energy_hype', label: 'ديناميكي وحيوي عالي الطاقة', promptEn: 'High Energy' },
  { id: 'documentary_story', label: 'قصصي وثائقي مؤثر', promptEn: 'Emotional Storytelling' },
  { id: 'luxury_editorial', label: 'فاشن وأزياء فارهة', promptEn: 'Luxury Editorial' }
];

export const LIGHTING_PRESETS = [
  { id: 'soft_daylight', label: 'ضوء نهار ناعم', promptEn: 'Soft Daylight' },
  { id: 'golden_hour', label: 'الساعة الذهبية', promptEn: 'Golden Hour Sunset' },
  { id: 'studio_softbox', label: 'إضاءة استوديو تجارية', promptEn: 'Commercial Studio' },
  { id: 'cinematic_moody', label: 'إضاءة سينمائية درامية', promptEn: 'Dramatic Cinematic' },
  { id: 'warm_cozy_indoor', label: 'إضاءة داخلية دافئة', promptEn: 'Warm Indoor' },
  { id: 'crisp_overcast', label: 'ضوء نهار غائم نقي', promptEn: 'Crisp Daylight' }
];

export const CAMERA_PRESETS = [
  { id: 'eye_level_50mm', label: 'لقطة مستوى العين 50mm', promptEn: 'Natural Eye-Level' },
  { id: 'portrait_85mm', label: 'بورتريه سينمائي 85mm', promptEn: 'Cinematic Depth Portrait' },
  { id: 'wide_dynamic_35mm', label: 'لقطة واسعة ديناميكية 35mm', promptEn: 'Dynamic Environmental' },
  { id: 'close_up_macro', label: 'لقطة مقربة تفصيلية', promptEn: 'Detailed Close-Up' },
  { id: 'low_angle_heroic', label: 'زاوية منخفضة ملحمية', promptEn: 'Heroic Low-Angle' }
];

/**
 * Computes status of all Ad DNA fields based on dependencies and locks.
 */
export function computeFieldStatuses(state: AdDnaState): FieldStatusMap {
  const map: FieldStatusMap = {};
  const avatar: NajiAvatar | undefined = state.selectedAvatarId ? AVATAR_REGISTRY[state.selectedAvatarId] : undefined;
  const location: NajiLocation | undefined = state.selectedLocationId ? LOCATION_REGISTRY[state.selectedLocationId] : undefined;

  // 1. Avatar Core Attributes (Locked when avatar selected)
  if (avatar) {
    map['avatar_identity'] = { status: 'locked', reason: `محدد عبر الأفاتار [${avatar.name} (${avatar.id})]`, lockedValue: avatar.name };
    map['avatar_age'] = { status: 'locked', reason: `عمر الشخصية محدد (${avatar.age} سنة)`, lockedValue: avatar.age };
    map['avatar_gender'] = { status: 'locked', reason: `العرض الجندري محدد (${avatar.genderPresentation})`, lockedValue: avatar.genderPresentation };
    map['avatar_features'] = { status: 'locked', reason: `الملامح والبشرة والشعر محددة بالكامل`, lockedValue: `${avatar.skin}, ${avatar.hair}` };
    map['avatar_profession'] = { status: 'locked', reason: `المهنة الافتراضية (${avatar.profession})`, lockedValue: avatar.profession };
  } else {
    map['avatar_identity'] = { status: 'active' };
    map['avatar_age'] = { status: 'active' };
    map['avatar_gender'] = { status: 'active' };
    map['avatar_features'] = { status: 'active' };
    map['avatar_profession'] = { status: 'active' };
  }

  // 2. Location Core Attributes (Locked when location selected)
  if (location) {
    map['location_identity'] = { status: 'locked', reason: `محدد عبر المكان [${location.name} (${location.id})]`, lockedValue: location.name };
    map['location_category'] = { status: 'locked', reason: `فئة المكان (${location.category})`, lockedValue: location.category };
    map['location_environment'] = { status: 'locked', reason: `طبيعة المكان والتفاصيل المعمارية محددة`, lockedValue: location.description };
  } else {
    map['location_identity'] = { status: 'active' };
    map['location_category'] = { status: 'active' };
    map['location_environment'] = { status: 'active' };
  }

  // 3. Platform & Aspect Ratio Dependencies
  const verticalPlatforms = ['tiktok', 'instagram_reels', 'youtube_shorts', 'snapchat'];
  const horizontalPlatforms = ['youtube', 'tv_commercial'];

  if (verticalPlatforms.includes(state.platform)) {
    map['aspectRatio'] = {
      status: 'conditional',
      reason: `مفروضة تلقائياً (9:16) لتناسب منصة [${PLATFORM_OPTIONS.find(p => p.id === state.platform)?.label || state.platform}]`,
      derivedValue: '9:16'
    };
  } else if (horizontalPlatforms.includes(state.platform)) {
    map['aspectRatio'] = {
      status: 'conditional',
      reason: `مفروضة تلقائياً (16:9) لتناسب منصة [${PLATFORM_OPTIONS.find(p => p.id === state.platform)?.label || state.platform}]`,
      derivedValue: '16:9'
    };
  } else {
    map['aspectRatio'] = { status: 'active' };
  }

  // 4. Always active creative controls
  map['language'] = { status: 'active' };
  map['dialect'] = { status: 'active' };
  map['platform'] = { status: 'active' };
  map['style'] = { status: 'active' };
  map['lighting'] = { status: 'active' };
  map['cameraAngle'] = { status: 'active' };
  map['tone'] = { status: 'active' };

  return map;
}

/**
 * Detects any potential logic conflicts in Ad DNA
 */
export function detectConflicts(state: AdDnaState): { field: string; reason: string }[] {
  const conflicts: { field: string; reason: string }[] = [];
  const verticalPlatforms = ['tiktok', 'instagram_reels', 'youtube_shorts', 'snapchat'];
  const horizontalPlatforms = ['youtube', 'tv_commercial'];

  if (verticalPlatforms.includes(state.platform) && state.aspectRatio === '16:9') {
    conflicts.push({
      field: 'aspectRatio',
      reason: 'المنصة المختارة عمودية ولكن تم تحديد نسبة العرض 16:9. يُنصح باستخدام 9:16 لضمان أفضل تجربة ملء شاشة.'
    });
  }

  if (horizontalPlatforms.includes(state.platform) && state.aspectRatio === '9:16') {
    conflicts.push({
      field: 'aspectRatio',
      reason: 'المنصة المختارة أفقية عريضة ولكن تم تحديد نسبة 9:16.'
    });
  }

  return conflicts;
}

/**
 * Builds a rich, cohesive master prompt incorporating chosen Ad DNA elements
 */
export function composeMasterAdPrompt(basePrompt: string, state: AdDnaState): string {
  const avatar = state.selectedAvatarId ? AVATAR_REGISTRY[state.selectedAvatarId] : null;
  const location = state.selectedLocationId ? LOCATION_REGISTRY[state.selectedLocationId] : null;
  const lightingObj = LIGHTING_PRESETS.find(l => l.id === state.lighting);
  const cameraObj = CAMERA_PRESETS.find(c => c.id === state.cameraAngle);

  const parts: string[] = [];

  // 1. User base prompt
  if (basePrompt && basePrompt.trim()) {
    parts.push(basePrompt.trim());
  }

  // 2. Character specifications
  if (avatar) {
    parts.push(`Featuring protagonist: ${avatar.name} (${avatar.age} years old, ${avatar.genderPresentation}, ${avatar.visualRegion}), ${avatar.skin}, ${avatar.face}, ${avatar.hair}, wearing ${avatar.clothing}, expressing ${avatar.expression}.`);
  }

  // 3. Location specifications
  if (location) {
    parts.push(`Setting/Environment: ${location.name} (${location.category}), ${location.description}.`);
  }

  // 4. Style & Technical visual specs
  const visualNotes: string[] = [];
  if (lightingObj) visualNotes.push(`Lighting: ${lightingObj.promptEn}`);
  if (cameraObj) visualNotes.push(`Cinematography: ${cameraObj.promptEn}`);
  visualNotes.push('Commercial high-end production, photorealistic, natural skin texture, smooth camera movement, color-graded advert.');

  parts.push(visualNotes.join(' | '));

  // 5. Strict Directives
  const strictDirectives: string[] = [];
  const selectedTemplate = state.selectedStyleTemplateId
    ? VIDEO_STYLE_TEMPLATES.find(t => t.id === state.selectedStyleTemplateId)
    : null;
    
  const REALISTIC_STYLE_DIRECTIVE = 'Photorealistic, natural, true-to-life cinematography — shot on a professional cinema camera with authentic film-like color grading and natural depth of field. Natural human skin texture with visible pores and subtle realistic imperfections, soft natural lighting, avoiding an overly smooth, waxy, or plastic AI-generated look. Anatomically correct hands, fingers, and facial features. Physically plausible, natural motion and blinking with no floaty, stiff, or morphing movement. The result should be indistinguishable from real, unedited camera footage — no synthetic sheen, no unnatural symmetry, no deformed hands or facial distortion.';

  strictDirectives.push(`Mandatory visual style: ${selectedTemplate ? selectedTemplate.prompt : REALISTIC_STYLE_DIRECTIVE}`);
  strictDirectives.push('Maintain anatomically correct hands, fingers, and facial proportions throughout — avoid extra or fused fingers, distorted faces, or asymmetrical eyes, regardless of the chosen visual style.');
  
  const languageObj = LANGUAGE_OPTIONS.find(l => l.id === state.language);
  const dialectList = DIALECT_OPTIONS[state.language] || [];
  const dialectObj = dialectList.find(d => d.id === state.dialect);
  
  if (languageObj) strictDirectives.push(`All spoken dialogue and any on-screen text must be in ${languageObj.label}.`);
  if (dialectObj) strictDirectives.push(`Use ${dialectObj.label} dialect/accent specifically.`);
  strictDirectives.push('CRITICAL: Do not render any garbled, misspelled, or nonsensical on-screen text. If displaying any text, signage, or writing within the scene, ensure it is either fully legible and correct, or avoid rendering readable text altogether — prefer no on-screen text over incorrect on-screen text.');

  parts.push('STRICT REQUIREMENTS:\n' + strictDirectives.map(d => `- ${d}`).join('\n'));

  return parts.join('\n\n');
}
