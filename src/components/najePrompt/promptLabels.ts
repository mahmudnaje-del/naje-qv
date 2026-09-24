import type { BestFor, ModelChoice, PromptMode } from '../../lib/najePromptEngine';

/** Arabic strings returned by the engine and shown as chrome. Not model protocol. */
export const ENGINE_MESSAGE_KEYS: Record<string, string> = {
  'سجّل الدخول حتى يقدر ناجي يشتغل على فكرتك.': 'prompt.error.signIn',
  'تم الإيقاف': 'prompt.error.stopped',
  'في مشكلة بالاتصال. تأكد من الشبكة وجرّب مرة ثانية.': 'prompt.error.network',
  'تعذّر بناء البرومبت هاللحظة. جرّب مرة ثانية بعد شوي.': 'prompt.error.build',
  'تعذّر إغلاق البرومبت. جرّب تعيد صياغة الفكرة.': 'prompt.error.close',
  'تعذّر فهم الفكرة بهالشكل. جرّب تعيد صياغتها بجملة أو جملتين.': 'prompt.error.understand',
  'ما رجع ناتج. جرّب مرة ثانية.': 'prompt.error.empty',
  'هذا النوع غير مدعوم. ارفع صورة أو PDF أو TXT أو DOCX.': 'prompt.error.fileType',
  'الملف أكبر من 8MB.': 'prompt.error.fileSize',
};

export function engineMessageKey(message: string): string | undefined {
  return ENGINE_MESSAGE_KEYS[message];
}

export function modeLabelKey(id: PromptMode): string {
  return `prompt.mode.${id}`;
}

export function modeHintKey(id: PromptMode): string {
  return `prompt.mode.${id}Hint`;
}

export function modelLabelKey(id: ModelChoice): string {
  return `prompt.model.${id}`;
}

export function modelHintKey(id: ModelChoice): string {
  return `prompt.model.${id}Hint`;
}

export function bestForKey(id: string): string {
  return `prompt.best.${id}`;
}

export const ROUTE_REASON_KEYS: Record<string, string> = {
  'التوجيه التلقائي مقفل — Lite': 'prompt.route.autoOff',
  'اختار Core لأن الطلب يحتاج إخراج أدق': 'prompt.route.core',
  'اختار Lite لأن الفكرة مباشرة': 'prompt.route.lite',
};

/** Short labels from refineTrailLabel(), mapped for the trail UI. */
export const TRAIL_LABEL_KEYS: Record<string, string> = {
  'أفخم': 'prompt.trail.richer',
  'تقني': 'prompt.trail.technical',
  'اتجاه ثاني': 'prompt.trail.alt',
  'أقصر': 'prompt.trail.shorter',
  'أضف قيود': 'prompt.trail.constraints',
  'تحديث': 'prompt.trail.update',
  'تعديل': 'prompt.trail.edit',
};

export const REFINE_LABEL_KEYS = [
  'prompt.refine.richer',
  'prompt.refine.shorter',
  'prompt.refine.technical',
  'prompt.refine.constraints',
  'prompt.refine.alt',
] as const;

export const EXAMPLE_KEYS = [
  'prompt.example.ad',
  'prompt.example.app',
  'prompt.example.cv',
  'prompt.example.code',
  'prompt.example.write',
  'prompt.example.intro',
] as const;

export const STUDIO_LABEL_KEYS: Record<string, string> = {
  ad: 'prompt.studio.ad',
  ident: 'prompt.studio.ident',
  creative: 'prompt.studio.creative',
  cv: 'prompt.studio.cv',
};

export function followLabelKeys(bestFor: BestFor): string[] {
  if (bestFor === 'code' || bestFor === 'ui') {
    return ['prompt.follow.simplify', 'prompt.follow.comment', 'prompt.follow.again'];
  }
  if (bestFor === 'cv') {
    return ['prompt.follow.stronger', 'prompt.follow.shorter', 'prompt.follow.again'];
  }
  return [
    'prompt.follow.shorter',
    'prompt.follow.longer',
    'prompt.follow.tone',
    'prompt.follow.explain',
    'prompt.follow.again',
  ];
}
