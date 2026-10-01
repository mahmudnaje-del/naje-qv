import { getNajeModel, type NajeModelRole } from './modelEnvConfig';

/** Specialist the dispatcher can call. Mirrors how a lead agent pulls a helper. */
export type SpecialistId =
  | 'planner'
  | 'critic'
  | 'image'
  | 'video'
  | 'stitch'
  | 'ui'
  | 'source'
  | 'voice'
  | 'document'
  | 'fullstack';

export type ModelTier = 'lite' | 'core' | 'pro';

export interface SpecialistSpec {
  id: SpecialistId;
  titleAr: string;
  tool: string;
  role: NajeModelRole;
  tier: ModelTier;
  when: string;
}

export const AGENT_FLEET: SpecialistSpec[] = [
  { id: 'planner', titleAr: 'مخطط المهمة', tool: 'propose_mission', role: 'personas', tier: 'lite', when: 'يفهم الطلب ويوزع الوكلاء' },
  { id: 'critic', titleAr: 'الناقد', tool: 'critic_review', role: 'personas', tier: 'lite', when: 'يفحص الطلب قبل التنفيذ' },
  { id: 'image', titleAr: 'وكيل الصور', tool: 'image_studio', role: 'image_core', tier: 'core', when: 'شعار، صورة واجهة، أصل بصري' },
  { id: 'video', titleAr: 'وكيل الفيديو', tool: 'video_director', role: 'video_core', tier: 'core', when: 'لقطة إعلان ضمن حد النموذج' },
  { id: 'stitch', titleAr: 'دمج المقاطع', tool: 'video_stitch', role: 'lite', tier: 'lite', when: 'مدة أطول من لقطة واحدة' },
  { id: 'ui', titleAr: 'وكيل الواجهات', tool: 'ui_director', role: 'core', tier: 'core', when: 'صفحة أو واجهة فيها صور وخطوط' },
  { id: 'source', titleAr: 'وكيل المصادر', tool: 'web_grounding', role: 'lite', tier: 'lite', when: 'حقائق من مصادر المستخدم أو البحث' },
  { id: 'voice', titleAr: 'وكيل الصوت', tool: 'voice_narration', role: 'voice', tier: 'core', when: 'تعليق صوتي' },
  { id: 'document', titleAr: 'وكيل المستندات', tool: 'document_architect', role: 'core', tier: 'core', when: 'كتيب أو عرض' },
  { id: 'fullstack', titleAr: 'وكيل التطوير', tool: 'fullstack_engineer', role: 'pro', tier: 'pro', when: 'موقع أو تطبيق متعدد الملفات' },
];

/**
 * Veo 3.1 on the Gemini API does not return a 20s file if you ask for 10+10.
 * One generate call is 4, 6, or 8 seconds. Extension is a new continuation clip
 * (about +7s after a 1s overlap), not a single 20s response.
 * Omni Flash extends in 10s steps up to 40s and returns the continued scene.
 */
export const VIDEO_CLIP_POLICY = {
  veoNativeSeconds: [4, 6, 8] as const,
  veoExtendAddsSeconds: 7,
  omniChunkSeconds: 10,
  omniMaxSeconds: 40,
  stitchRequiredAboveSeconds: 8,
} as const;

export function pickTier(text: string): ModelTier {
  const t = text.toLowerCase();
  if (/عمق|تحليل|معمار|audit|pro|معقد|fullstack|نظام كامل/.test(t)) return 'pro';
  if (/سريع|خفيف|lite|مسودة|اختصر/.test(t)) return 'lite';
  return 'core';
}

export function modelForTier(tier: ModelTier): string {
  if (tier === 'lite') return getNajeModel('lite');
  if (tier === 'pro') return getNajeModel('pro');
  return getNajeModel('core');
}

export interface DispatchDecision {
  specialists: SpecialistSpec[];
  tier: ModelTier;
  modelId: string;
  video: {
    requestedSec: number | null;
    strategy: 'single_clip' | 'omni_extend' | 'veo_stitch';
    noteAr: string;
  };
}

export function dispatchSpecialists(userText: string): DispatchDecision {
  const text = userText || '';
  const tier = pickTier(text);
  const ids = new Set<SpecialistId>(['planner']);
  if (/صور|شعار|هوية|تصميم|واجهة|موقع|landing/.test(text)) ids.add('image');
  if (/واجهة|موقع|landing|صفحة/.test(text)) ids.add('ui');
  if (/فيديو|إعلان|اعلان|مقطع|ريل/.test(text)) ids.add('video');
  if (/بحث|مصدر|منافس|source/.test(text)) ids.add('source');
  if (/صوت|تعليق|فويس/.test(text)) ids.add('voice');
  if (/pdf|عرض|كتيب|شرائح/.test(text)) ids.add('document');
  if (/كود|موقع كامل|تطبيق|برمجة/.test(text)) ids.add('fullstack');

  const secMatch = text.match(/(\d{1,2})\s*(ثانية|ثوان|ثواني|s\b)/);
  const requestedSec = secMatch ? Number(secMatch[1]) : null;
  let strategy: DispatchDecision['video']['strategy'] = 'single_clip';
  let noteAr = 'لقطة واحدة ضمن 4 أو 6 أو 8 ثوانٍ.';
  if (requestedSec && requestedSec > VIDEO_CLIP_POLICY.stitchRequiredAboveSeconds) {
    const adOmni = /إعلان|اعلان|ناجي أد|naje ad|أومني|omni|تمديد/.test(text);
    if (adOmni || requestedSec <= VIDEO_CLIP_POLICY.omniMaxSeconds) {
      strategy = 'omni_extend';
      noteAr = `ناجي أد على أومني 1.1: لقطة حوالي 10 ثوانٍ، ثم تمديد نفس المشهد +10 حتى ${VIDEO_CLIP_POLICY.omniMaxSeconds}. ليس ردًا واحدًا بـ ${requestedSec} ثانية، وليس دمج فيو.`;
    } else {
      strategy = 'veo_stitch';
      noteAr = `خارج ناجي أد: فيو لقطة 4/6/8 ثم دمج. ناجي أد نفسه أومني فقط.`;
    }
  }

  const specialists = AGENT_FLEET.filter((s) => ids.has(s.id));
  return {
    specialists,
    tier,
    modelId: modelForTier(tier),
    video: { requestedSec, strategy, noteAr },
  };
}

export function dispatchBrief(userText: string): string {
  const d = dispatchSpecialists(userText);
  const names = d.specialists.map((s) => s.titleAr).join('، ');
  return `قرار الموزّع: الطبقة ${d.tier} / ${d.modelId}. الوكلاء: ${names}. ${d.video.noteAr}`;
}
