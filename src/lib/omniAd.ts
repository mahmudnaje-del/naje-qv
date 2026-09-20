import { AD_STYLES, getAdStyle } from '../data/adStyles';
import { AVATAR_REGISTRY } from '../data/avatars/avatarRegistry';
import { LOCATION_REGISTRY } from '../data/locations/locationRegistry';
import type { AdDnaState } from './adDnaEngine';

export const OMNI_11_ID = 'gemini-omni-1.1-flash';
export const OMNI_11_FALLBACK_ID = 'gemini-omni-1.1-flash-preview';
export const NAJE_VIDEO_PRO_LABEL = 'Naje Video Pro';

export type OmniAdModel = 'omni-1.1';
export type OmniResolution = '360p' | '720p' | '1080p' | '4k';
export type OmniDuration = 10 | 20 | 30 | 40;

export const OMNI_DURATIONS: OmniDuration[] = [10, 20, 30, 40];

export const OMNI_RESOLUTIONS: {
  id: OmniResolution;
  name: string;
  hint: string;
  multiplier: number;
}[] = [
  { id: '360p', name: '360p', hint: 'أسرع وأوفر — مناسب للتجربة والمعاينة', multiplier: 0.35 },
  { id: '720p', name: '720p', hint: 'الجودة القياسية الأصلية', multiplier: 1 },
  { id: '1080p', name: '1080p', hint: 'تسليم احترافي للمنصات', multiplier: 1.5 },
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
  { id: 'crane_rise', label: 'رافعة صاعدة', prompt: 'elegant crane rise revealing the scene' },
  { id: 'whip_pan', label: 'Whip pan سريع', prompt: 'energetic whip-pan into the hero' },
  { id: 'lockoff', label: 'كاميرا ثابتة', prompt: 'locked-off tripod, subject moves through frame' },
];

export const LIGHTING_LOOKS = [
  { id: 'studio', label: 'استوديو ناعم', prompt: 'soft professional studio lighting' },
  { id: 'cinematic', label: 'سينمائي درامي', prompt: 'cinematic contrast and shaped shadows' },
  { id: 'natural', label: 'ضوء نهار', prompt: 'bright natural sunlight' },
  { id: 'golden', label: 'ساعة ذهبية', prompt: 'golden hour warm backlight' },
  { id: 'neon', label: 'نيون ليلي', prompt: 'wet neon night reflections' },
  { id: 'beauty', label: 'جمال حريري', prompt: 'silk beauty dish glamour light' },
  { id: 'high_key', label: 'هاي كي مشرق', prompt: 'bright high-key commercial lighting' },
  { id: 'practicals', label: 'إضاءة عملية داخلية', prompt: 'warm practical lamps and interior bounce' },
];

export const MARKETING_GOALS = [
  { id: 'showcase', label: 'استعراض فخامة' },
  { id: 'lifestyle', label: 'أسلوب حياة' },
  { id: 'action', label: 'إثارة وحركة' },
  { id: 'storytelling', label: 'قصة قصيرة' },
  { id: 'ugc', label: 'توصية عفوية' },
  { id: 'launch', label: 'إطلاق منتج' },
  { id: 'conversion', label: 'تحويل مباشر' },
  { id: 'awareness', label: 'وعي بالعلامة' },
];

export const AUDIO_MODES = [
  { id: 'native', label: 'صوت أصلي (حوار + موسيقى)', prompt: 'Generate native audio: tasteful music bed, realistic foley, and any spoken lines in the requested language. Keep dialogue sparse and premium.' },
  { id: 'music', label: 'موسيقى ومؤثرات فقط', prompt: 'Music and foley only. No spoken dialogue.' },
  { id: 'vo', label: 'تعليق صوتي للمنتج', prompt: 'Confident product voice-over in the requested language plus a restrained music bed.' },
  { id: 'silent', label: 'بدون حوار', prompt: 'No dialogue. Subtle ambience only.' },
  { id: 'asrm', label: 'ASMR لمسي', prompt: 'Intimate ASMR foley of the product: texture, pour, unbox. No voice-over.' },
];

export const PACE_OPTIONS = [
  { id: 'slow', label: 'بطيء فاخر', prompt: 'slow luxurious pacing' },
  { id: 'medium', label: 'متوازن', prompt: 'confident medium commercial pacing' },
  { id: 'punchy', label: 'سريع وإيقاعي', prompt: 'punchy rhythmic social pacing' },
];

export const COLOR_GRADES = [
  { id: 'neutral', label: 'محايد طبيعي', prompt: 'natural neutral grade' },
  { id: 'warm', label: 'دافئ ذهبي', prompt: 'warm golden commercial grade' },
  { id: 'cool', label: 'بارد تقني', prompt: 'cool clean tech grade' },
  { id: 'film', label: 'فيلم سينمائي', prompt: 'cinematic filmic contrast grade' },
  { id: 'vivid', label: 'مشبع حي', prompt: 'vivid saturated commercial grade' },
];

export const PRODUCT_PLACEMENTS = [
  { id: 'hero', label: 'بطل الكادر', prompt: 'product as the hero of the frame' },
  { id: 'in_hand', label: 'في اليد', prompt: 'product held naturally in talent hands' },
  { id: 'table', label: 'على الطاولة', prompt: 'product living on a surface in the scene' },
  { id: 'worn', label: 'يُرتدى', prompt: 'product worn on the body' },
  { id: 'unbox', label: 'فتح العلبة', prompt: 'unboxing reveal of the product' },
];

export const CTA_MODES = [
  { id: 'none', label: 'بدون CTA', prompt: 'no call to action' },
  { id: 'spoken', label: 'دعوة منطوقة', prompt: 'a short spoken call to action at the end' },
  { id: 'end_card', label: 'كرت نهاية', prompt: 'clean end-card beat with logo-safe space, no garbled type' },
  { id: 'hold', label: 'إمساك المنتج', prompt: 'final decisive product hold to camera' },
];

export const VOICE_CASTS = [
  { id: 'none', label: 'بدون معلق' },
  { id: 'female', label: 'صوت أنثوي واثق' },
  { id: 'male', label: 'صوت ذكوري دافئ' },
  { id: 'talent', label: 'الشخصية تتحدث' },
];

export const MUSIC_ENERGY = [
  { id: 'none', label: 'صمت / أجواء', prompt: 'no music bed, ambience only' },
  { id: 'soft', label: 'هادئة', prompt: 'soft restrained music bed' },
  { id: 'pulse', label: 'نبض عصري', prompt: 'modern pulse music bed' },
  { id: 'epic', label: 'ملحمية', prompt: 'epic rising trailer-adjacent music, still premium' },
];

export const HOOK_STYLES = [
  { id: 'product_first', label: 'المنتج أولاً', prompt: 'open on the product in the first second' },
  { id: 'face_first', label: 'الوجه أولاً', prompt: 'open on the talent face then reveal product' },
  { id: 'motion_smash', label: 'صدمة حركة', prompt: 'open with an attention-smash of motion' },
  { id: 'whisper', label: 'همس حميم', prompt: 'open intimate and quiet then bloom' },
];

export type SceneCardKind =
  | 'product'
  | 'character'
  | 'location'
  | 'character_extra'
  | 'location_extra'
  | 'second_product'
  | 'logo'
  | 'first_frame'
  | 'last_frame'
  | 'prop'
  | 'packaging'
  | 'color_ref'
  | 'onscreen_text'
  | 'end_card'
  | 'before'
  | 'after'
  | 'vehicle'
  | 'pet'
  | 'crowd'
  | 'broll'
  | 'weather'
  | 'time_of_day'
  | 'handheld_device';

export const PRIMARY_SCENE_KINDS: SceneCardKind[] = ['product', 'character', 'location'];

export const TIMED_SCENE_KINDS: SceneCardKind[] = [
  'character_extra',
  'location_extra',
  'second_product',
  'before',
  'after',
  'crowd',
  'vehicle',
  'weather',
  'time_of_day',
];

export function isTimedKind(kind: SceneCardKind) {
  return TIMED_SCENE_KINDS.includes(kind);
}

export interface SceneBoardCard {
  id: string;
  kind: SceneCardKind;
  name?: string;
  preview?: string | null;
  avatarId?: string | null;
  locationId?: string | null;
  appearAtSec?: number;
  transition?: string;
  note?: string;
}

export const SCENE_TRANSITIONS = [
  { id: 'seamless', label: 'انتقال سلس', prompt: 'seamless continuous transition' },
  { id: 'walk_in', label: 'يدخل إلى الكادر', prompt: 'talent walks into frame' },
  { id: 'walk_out', label: 'يخرج من الكادر', prompt: 'talent exits frame as the next beat begins' },
  { id: 'reveal', label: 'كشف درامي', prompt: 'dramatic reveal' },
  { id: 'match_cut', label: 'قص متطابق', prompt: 'match-cut on motion or shape' },
  { id: 'pan', label: 'بان إلى المشهد', prompt: 'camera pan into the new beat' },
  { id: 'morph', label: 'تحول المكان', prompt: 'environment morphs while talent continuity holds' },
  { id: 'focus_rack', label: 'سحب فوكاس', prompt: 'rack focus onto the new subject' },
  { id: 'orbit', label: 'دوران يكشف', prompt: 'orbital move that reveals the new element' },
];

export const SCENE_ADD_GROUPS: { title: string; ids: SceneCardKind[] }[] = [
  { title: 'الأساس', ids: ['product', 'character', 'location'] },
  { title: 'ظهور عند ثانية', ids: ['character_extra', 'location_extra', 'second_product'] },
  { title: 'هوية وتكوين', ids: ['logo', 'packaging', 'prop', 'color_ref', 'first_frame', 'last_frame'] },
  { title: 'قصة وإغلاق', ids: ['before', 'after', 'onscreen_text', 'end_card', 'broll'] },
  { title: 'عالم المشهد', ids: ['vehicle', 'pet', 'crowd', 'weather', 'time_of_day', 'handheld_device'] },
];

export const SCENE_ADD_OPTIONS: {
  id: SceneCardKind;
  label: string;
  desc: string;
  accent: string;
}[] = [
  { id: 'product', label: 'منتج', desc: 'البطل البصري للإعلان', accent: '#d4a574' },
  { id: 'character', label: 'شخصية', desc: 'الممثل على الكاميرا', accent: '#7dd3c7' },
  { id: 'location', label: 'مكان', desc: 'موقع التصوير الأساسي', accent: '#93c5fd' },
  { id: 'character_extra', label: 'شخصية إضافية', desc: 'تظهر عند الثانية التي تختارها', accent: '#6ee7b7' },
  { id: 'location_extra', label: 'مكان إضافي', desc: 'انتقال للموقع عند ثانية محددة', accent: '#818cf8' },
  { id: 'logo', label: 'شعار العلامة', desc: 'قفل هوية في الكرت أو المنتج', accent: '#e8b86d' },
  { id: 'first_frame', label: 'الإطار الأول', desc: 'قفل أول لقطة', accent: '#f9a8d4' },
  { id: 'last_frame', label: 'الإطار الأخير', desc: 'قفل نهاية المشهد', accent: '#c084fc' },
  { id: 'prop', label: 'إكسسوار', desc: 'عنصر يُمسك أو يُعرض', accent: '#fb923c' },
  { id: 'packaging', label: 'تغليف', desc: 'علبة أو زجاجة المنتج', accent: '#fbbf24' },
  { id: 'color_ref', label: 'مرجع لون', desc: 'لوحة ألوان العلامة', accent: '#67e8f9' },
  { id: 'onscreen_text', label: 'نص على الشاشة', desc: 'سطر واحد مقروء أو لا شيء', accent: '#fda4af' },
  { id: 'end_card', label: 'كرت النهاية', desc: 'شعار + دعوة في آخر ثانية', accent: '#a78bfa' },
  { id: 'before', label: 'قبل', desc: 'المشكلة قبل المنتج', accent: '#94a3b8' },
  { id: 'after', label: 'بعد', desc: 'النتيجة بعد الاستخدام', accent: '#86efac' },
  { id: 'second_product', label: 'منتج ثانٍ', desc: 'يظهر لاحقاً في المشهد', accent: '#f6d58a' },
  { id: 'vehicle', label: 'سيارة', desc: 'مركبة تدخل أو تُعرض', accent: '#cbd5e1' },
  { id: 'pet', label: 'حيوان أليف', desc: 'رفيق في المشهد', accent: '#fdba74' },
  { id: 'crowd', label: 'مجموعة', desc: 'حضور بشري حول البطل', accent: '#c4b5fd' },
  { id: 'broll', label: 'لقطة تفاصيل', desc: 'ماكرو أو قصة بصرية جانبية', accent: '#7dd3c7' },
  { id: 'weather', label: 'طقس', desc: 'مطر أو ضباب عند ثانية', accent: '#93c5fd' },
  { id: 'time_of_day', label: 'تحول الوقت', desc: 'من نهار إلى ليل داخل المشهد', accent: '#fcd34d' },
  { id: 'handheld_device', label: 'هاتف في اليد', desc: 'شاشة حقيقية مقروءة', accent: '#38bdf8' },
];

export function newSceneCardId() {
  return `sc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultSceneBoard(): SceneBoardCard[] {
  return [
    { id: 'sc_product', kind: 'product' },
    { id: 'sc_character', kind: 'character' },
    { id: 'sc_location', kind: 'location' },
  ];
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
  pointsRatePerSecond: number;
  resolutionMultiplier?: Partial<Record<OmniResolution, number>>;
}): number {
  const resMul = opts.resolutionMultiplier?.[opts.resolution] ?? resolutionMeta(opts.resolution).multiplier;
  const seconds = Math.min(40, Math.max(10, opts.durationSec));
  return Math.max(1, Math.ceil(seconds * opts.pointsRatePerSecond * resMul * 1.1));
}

function kindRole(kind: SceneCardKind): string {
  switch (kind) {
    case 'product': return 'hero product';
    case 'character': return 'primary on-camera talent';
    case 'character_extra': return 'additional talent entering later';
    case 'location': return 'primary location';
    case 'location_extra': return 'secondary location for a timed transition';
    case 'logo': return 'brand logo lockup';
    case 'first_frame': return 'mandatory first frame';
    case 'last_frame': return 'mandatory last frame';
    case 'prop': return 'hero prop / accessory';
    case 'packaging': return 'product packaging';
    case 'color_ref': return 'brand color reference';
    case 'onscreen_text': return 'on-screen copy (must be spelled correctly or omitted)';
    case 'end_card': return 'end-card composition';
    case 'before': return 'before-state reference';
    case 'after': return 'after-state reference';
    case 'second_product': return 'second product that appears later';
    case 'vehicle': return 'vehicle in scene';
    case 'pet': return 'pet companion in scene';
    case 'crowd': return 'background crowd / group';
    case 'broll': return 'detail / B-roll insert';
    case 'weather': return 'weather event';
    case 'time_of_day': return 'time-of-day shift';
    case 'handheld_device': return 'smartphone held in hand with a readable screen';
    default: return kind;
  }
}

export function composeOmniAdPrompt(input: {
  script: string;
  dna: AdDnaState;
  styleId: string | null;
  sceneCards?: SceneBoardCard[];
  cameraMotion?: string;
  lighting?: string;
  marketingGoal?: string;
  audioMode?: string;
  pace?: string;
  colorGrade?: string;
  productPlacement?: string;
  cta?: string;
  voiceCast?: string;
  musicEnergy?: string;
  hookStyle?: string;
  durationSec: number;
  aspectRatio: '16:9' | '9:16';
}): string {
  const style = getAdStyle(input.styleId);
  const cam = CAMERA_MOTIONS.find((c) => c.id === input.cameraMotion);
  const light = LIGHTING_LOOKS.find((l) => l.id === input.lighting);
  const audio = AUDIO_MODES.find((a) => a.id === input.audioMode);
  const goal = MARKETING_GOALS.find((g) => g.id === input.marketingGoal);
  const pace = PACE_OPTIONS.find((p) => p.id === input.pace);
  const grade = COLOR_GRADES.find((g) => g.id === input.colorGrade);
  const place = PRODUCT_PLACEMENTS.find((p) => p.id === input.productPlacement);
  const cta = CTA_MODES.find((c) => c.id === input.cta);
  const music = MUSIC_ENERGY.find((m) => m.id === input.musicEnergy);
  const hook = HOOK_STYLES.find((h) => h.id === input.hookStyle);
  const cards = input.sceneCards || [];

  const parts: string[] = [];
  parts.push('Create a premium live-action commercial. Prefer one continuous take. If a timed location or talent change is specified, execute it as a motivated camera move or seamless morph — not a cheap jump cut.');
  if (input.script.trim()) parts.push(`Director brief: ${input.script.trim()}`);

  for (const card of cards) {
    const trans = SCENE_TRANSITIONS.find((t) => t.id === card.transition);
    const avatar = card.avatarId ? AVATAR_REGISTRY[card.avatarId] : null;
    const location = card.locationId ? LOCATION_REGISTRY[card.locationId] : null;
    const when = typeof card.appearAtSec === 'number' && card.appearAtSec > 0
      ? ` At second ${card.appearAtSec} of the ${input.durationSec}s runtime, ${trans?.prompt || 'transition in'}.`
      : '';
    if (avatar) {
      parts.push(`${kindRole(card.kind)}: ${avatar.name}, ${avatar.age}, ${avatar.genderPresentation}, ${avatar.visualRegion}. ${avatar.skin}. ${avatar.face}. ${avatar.hair}. Wearing ${avatar.clothing}. Expression: ${avatar.expression}.${when}`);
      if (avatar.aiImagePrompt) parts.push(`Likeness lock: ${avatar.aiImagePrompt}`);
    } else if (location) {
      parts.push(`${kindRole(card.kind)}: ${location.name} (${location.category}). ${location.description}.${when}`);
    } else if (card.kind === 'onscreen_text' && (card.name || card.note)) {
      parts.push(`On-screen copy if any must read exactly: "${(card.note || card.name || '').trim()}". If it cannot be spelled perfectly, omit on-screen text.`);
    } else if (card.name || card.preview) {
      parts.push(`${kindRole(card.kind)}: ${card.name || 'see attached still'}.${card.note ? ' ' + card.note : ''}${when}${card.preview ? ' Match the attached still exactly.' : ''}`);
    }
  }

  if (style) parts.push(`Ad style: ${style.prompt}`);
  if (goal) parts.push(`Marketing goal: ${goal.label}.`);
  if (hook) parts.push(`Hook: ${hook.prompt}.`);
  if (cam) parts.push(`Camera: ${cam.prompt}.`);
  if (light) parts.push(`Lighting: ${light.prompt}.`);
  if (pace) parts.push(`Pace: ${pace.prompt}.`);
  if (grade) parts.push(`Color: ${grade.prompt}.`);
  if (place) parts.push(`Product placement: ${place.prompt}.`);
  if (cta) parts.push(`Close: ${cta.prompt}.`);
  if (audio) parts.push(audio.prompt);
  if (music) parts.push(`Music: ${music.prompt}.`);
  if (input.voiceCast === 'female') parts.push('If voice-over: confident adult female.');
  if (input.voiceCast === 'male') parts.push('If voice-over: warm adult male.');
  if (input.voiceCast === 'talent') parts.push('Spoken lines come from the on-camera talent only.');
  if (input.voiceCast === 'none') parts.push('No voice-over narrator.');

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
