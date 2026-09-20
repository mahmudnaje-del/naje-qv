import { AD_STYLES, getAdStyle } from '../data/adStyles';
import { AVATAR_REGISTRY } from '../data/avatars/avatarRegistry';
import { LOCATION_REGISTRY } from '../data/locations/locationRegistry';
import type { AdDnaState } from './adDnaEngine';

export const OMNI_FLASH_ID = 'gemini-omni-flash-preview';
export const OMNI_11_ID = 'gemini-omni-1.1-flash';
export const OMNI_11_FALLBACK_ID = 'gemini-omni-1.1-flash-preview';

export type OmniAdModel = 'omni-flash' | 'omni-1.1';
export type OmniResolution = '360p' | '720p' | '1080p' | '4k';
export type OmniDuration = 10 | 20 | 30 | 40;

export const OMNI_MODELS: {
  id: OmniAdModel;
  modelId: string;
  name: string;
  tag: string;
  desc: string;
  maxDuration: OmniDuration;
  resolutions: OmniResolution[];
}[] = [
  {
    id: 'omni-flash',
    modelId: OMNI_FLASH_ID,
    name: 'Gemini Omni Flash',
    tag: 'الإصدار الأول',
    desc: 'توليد سريع حتى 10 ثوانٍ — مثالي للمسودات والإطلاق الأول.',
    maxDuration: 10,
    resolutions: ['360p', '720p'],
  },
  {
    id: 'omni-1.1',
    modelId: OMNI_11_ID,
    name: 'Gemini Omni 1.1 Flash',
    tag: 'ترقية',
    desc: 'تمديد مشهد حتى 40 ثانية، تحرير باللغة الطبيعية، إطار أول/أخير، و4K.',
    maxDuration: 40,
    resolutions: ['360p', '720p', '1080p', '4k'],
  },
];

export const OMNI_DURATIONS: OmniDuration[] = [10, 20, 30, 40];

export const OMNI_RESOLUTIONS: {
  id: OmniResolution;
  name: string;
  hint: string;
  multiplier: number;
}[] = [
  { id: '360p', name: 'مسودة 360p', hint: 'أسرع وأرخص بثلث تكلفة 720p', multiplier: 0.35 },
  { id: '720p', name: '720p', hint: 'الجودة القياسية الأصلية', multiplier: 1 },
  { id: '1080p', name: '1080p', hint: 'ترقية احترافية للتسليم', multiplier: 1.5 },
  { id: '4k', name: '4K', hint: 'إنهاء سينمائي عبر Upscale', multiplier: 3 },
];

export const CAMERA_MOTIONS = [
  { id: 'cinematic_pan', label: 'حركة سينمائية بطيئة', prompt: 'slow cinematic pan' },
  { id: 'dynamic_tracking', label: 'تتبع ديناميكي', prompt: 'dynamic subject tracking' },
  { id: 'macro_zoom', label: 'ماكرو تقريبي', prompt: 'ultra-detail macro zoom' },
  { id: 'fpv_drone', label: 'درون FPV', prompt: 'aggressive FPV drone move' },
  { id: 'handheld', label: 'كاميرا يد واقعية', prompt: 'realistic handheld camera' },
  { id: 'orbital', label: 'دوران حول المنتج', prompt: 'smooth orbital product turn' },
  { id: 'push_in', label: 'اقتراب درامي', prompt: 'slow dramatic push-in' },
];

export const LIGHTING_LOOKS = [
  { id: 'studio', label: 'استوديو ناعم', prompt: 'soft professional studio lighting' },
  { id: 'cinematic', label: 'سينمائي درامي', prompt: 'cinematic contrast and shaped shadows' },
  { id: 'natural', label: 'ضوء نهار', prompt: 'bright natural sunlight' },
  { id: 'golden', label: 'ساعة ذهبية', prompt: 'golden hour warm backlight' },
  { id: 'neon', label: 'نيون ليلي', prompt: 'wet neon night reflections' },
  { id: 'beauty', label: 'جمال حريري', prompt: 'silk beauty dish glamour light' },
];

export const MARKETING_GOALS = [
  { id: 'showcase', label: 'استعراض فخامة' },
  { id: 'lifestyle', label: 'أسلوب حياة' },
  { id: 'action', label: 'إثارة وحركة' },
  { id: 'storytelling', label: 'قصة قصيرة' },
  { id: 'ugc', label: 'توصية عفوية' },
  { id: 'launch', label: 'إطلاق منتج' },
];

export const AUDIO_MODES = [
  { id: 'native', label: 'صوت أصلي (حوار + موسيقى)', prompt: 'Generate native audio: tasteful music bed, realistic foley, and any spoken lines in the requested language. Keep dialogue sparse and premium.' },
  { id: 'music', label: 'موسيقى ومؤثرات فقط', prompt: 'Music and foley only. No spoken dialogue.' },
  { id: 'vo', label: 'تعليق صوتي للمنتج', prompt: 'Confident product voice-over in the requested language plus a restrained music bed.' },
  { id: 'silent', label: 'بدون حوار', prompt: 'No dialogue. Subtle ambience only.' },
];

export function modelFor(id: OmniAdModel) {
  return OMNI_MODELS.find((m) => m.id === id) || OMNI_MODELS[1];
}

export function resolutionMeta(id: OmniResolution) {
  return OMNI_RESOLUTIONS.find((r) => r.id === id) || OMNI_RESOLUTIONS[1];
}

export function extensionSteps(duration: number): number {
  if (duration <= 10) return 0;
  return Math.ceil((Math.min(40, duration) - 10) / 10);
}

export function estimateOmniPoints(opts: {
  durationSec: number;
  resolution: OmniResolution;
  model: OmniAdModel;
  pointsRatePerSecond: number;
  resolutionMultiplier?: Partial<Record<OmniResolution, number>>;
}): number {
  const resMul = opts.resolutionMultiplier?.[opts.resolution] ?? resolutionMeta(opts.resolution).multiplier;
  const modelMul = opts.model === 'omni-1.1' ? 1.1 : 1;
  const seconds = Math.min(40, Math.max(10, opts.durationSec));
  return Math.max(1, Math.ceil(seconds * opts.pointsRatePerSecond * resMul * modelMul));
}

export function composeOmniAdPrompt(input: {
  script: string;
  dna: AdDnaState;
  styleId: string | null;
  productName?: string;
  productNotes?: string;
  hasProductImage?: boolean;
  hasCharacterImage?: boolean;
  hasLocationImage?: boolean;
  cameraMotion?: string;
  lighting?: string;
  marketingGoal?: string;
  audioMode?: string;
  durationSec: number;
  aspectRatio: '16:9' | '9:16';
}): string {
  const style = getAdStyle(input.styleId);
  const avatar = input.dna.selectedAvatarId ? AVATAR_REGISTRY[input.dna.selectedAvatarId] : null;
  const location = input.dna.selectedLocationId ? LOCATION_REGISTRY[input.dna.selectedLocationId] : null;
  const cam = CAMERA_MOTIONS.find((c) => c.id === input.cameraMotion);
  const light = LIGHTING_LOOKS.find((l) => l.id === input.lighting);
  const audio = AUDIO_MODES.find((a) => a.id === input.audioMode);
  const goal = MARKETING_GOALS.find((g) => g.id === input.marketingGoal);

  const parts: string[] = [];
  parts.push('Create one continuous commercial shot. Do not cut. Maintain character, wardrobe, lighting and environment across the whole take.');
  if (input.script.trim()) parts.push(`Director brief: ${input.script.trim()}`);
  if (input.productName) parts.push(`Hero product: ${input.productName}.${input.productNotes ? ' ' + input.productNotes : ''}`);
  if (input.hasProductImage) parts.push('Match the attached product reference exactly (shape, logo, color, materials). Tag mentally as the hero product.');
  if (avatar) {
    parts.push(`Talent: ${avatar.name}, ${avatar.age}, ${avatar.genderPresentation}, ${avatar.visualRegion}. ${avatar.skin}. ${avatar.face}. ${avatar.hair}. Wearing ${avatar.clothing}. Expression: ${avatar.expression}.`);
    if (avatar.aiImagePrompt) parts.push(`Talent likeness lock: ${avatar.aiImagePrompt}`);
  } else if (input.hasCharacterImage) {
    parts.push('Use the attached character still as a hard likeness lock for the on-camera talent.');
  }
  if (location) {
    parts.push(`Location: ${location.name} (${location.category}). ${location.description}.`);
  } else if (input.hasLocationImage) {
    parts.push('Use the attached location still as the environment lock.');
  }
  if (style) parts.push(`Ad style: ${style.prompt}`);
  if (goal) parts.push(`Marketing goal: ${goal.label}.`);
  if (cam) parts.push(`Camera: ${cam.prompt}.`);
  if (light) parts.push(`Lighting: ${light.prompt}.`);
  if (audio) parts.push(audio.prompt);

  const lang = input.dna.language === 'en' ? 'English' : input.dna.language === 'ar' ? 'Arabic' : input.dna.language;
  parts.push(`Spoken language if any: ${lang}${input.dna.dialect ? ` (${input.dna.dialect})` : ''}.`);
  parts.push(`Aspect ${input.aspectRatio}, photoreal live-action commercial, anatomically correct hands and faces, no garbled on-screen text, no extra fingers, 24fps cinematic motion.`);
  parts.push(`Target length about ${Math.min(10, input.durationSec)} seconds for this generation (longer runtimes are produced by scene extension).`);
  return parts.join('\n');
}

export function composeExtensionPrompt(script: string, remainingSec: number, totalSec: number): string {
  const beat = script.trim()
    ? `Continue the same commercial without a cut. Advance the action: ${script.trim()}`
    : 'Continue the scene seamlessly. Keep the same talent, wardrobe, product, lighting and location. Intensify toward the product payoff.';
  return `${beat}\nExtend about ${Math.min(10, remainingSec)} more seconds. Total intended runtime ${totalSec}s. Analyze the last seconds for continuity of motion, identity and audio. One continuous shot, no jump cut.`;
}

export { AD_STYLES };
