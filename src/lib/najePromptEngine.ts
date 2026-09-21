import type { NajeTextModel } from './askNaje';
import { parseModelJson } from './askNaje';

export type PromptMode = 'fast' | 'smart' | 'deep';
export type ModelChoice = 'auto' | 'lite' | 'core';
export type BestFor = 'image' | 'video' | 'ad' | 'intro' | 'outro' | 'text' | 'ui' | 'code' | 'cv';

export interface Understanding {
  goal: string;
  audience: string;
  format: string;
  constraints: string[];
}

export interface PromptFields {
  duration: string;
  ratio: string;
  mood: string;
  platform: string;
}

export interface AskQuestion {
  id: string;
  q: string;
  options: string[];
}

export interface ReadyResult {
  mode: 'ready';
  title: string;
  prompt: string;
  bestFor: BestFor;
  understanding: Understanding;
  fields: PromptFields;
}

export interface AskResult {
  mode: 'ask';
  question: AskQuestion;
  why: string;
}

export type EngineResponse = ReadyResult | AskResult;

export interface HistoryItem {
  id: string;
  title: string;
  prompt: string;
  bestFor: string;
  at: number;
}

export interface HandoffPayload {
  prompt: string;
  bestFor: string;
  title: string;
}

export interface QaTurn {
  q: string;
  a: string;
}

export const HISTORY_KEY = 'naje-prompt-history-v1';
export const HANDOFF_KEY = 'naje-prompt-handoff';
export const HISTORY_CAP = 12;

export const IDEA_CHIPS = [
  'صمم لي إعلان',
  'عندي فكرة تطبيق',
  'بدي أعمل CV',
  'حلل هذا الكود',
  'اكتب لي',
  'Intro لقناتي',
] as const;

export const MODE_OPTIONS: Array<{ id: PromptMode; label: string; hint: string }> = [
  { id: 'fast', label: 'سريع', hint: 'ينفّذ مباشرة' },
  { id: 'smart', label: 'ذكي', hint: 'يسأل فقط إذا نقص شيء جوهري' },
  { id: 'deep', label: 'عميق', hint: 'يعمّق المهمة برفق' },
];

export const MODEL_OPTIONS: Array<{ id: ModelChoice; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'lite', label: 'Naje Lite' },
  { id: 'core', label: 'Naje Core' },
];

export const REFINE_CHIPS = [
  { label: 'اجعله أفخم', text: 'اجعله أفخم وأرقى مع الحفاظ على نفس النية والقيود' },
  { label: 'أقصر', text: 'اجعله أقصر وأحدّ بدون ما تضيّع الجوهر أو القيود' },
  { label: 'أكثر تقنية', text: 'اجعله أكثر تقنية ودقة في المواصفات التنفيذية' },
  { label: 'أضف قيود', text: 'أضف قيود إنتاج واضحة (ما يجب تجنبه، حدود الأسلوب، ومتطلبات الجودة) مع الحفاظ على النية' },
] as const;

export const MODE_ASK_LIMIT: Record<PromptMode, number> = {
  fast: 1,
  smart: 2,
  deep: 3,
};

export const BEST_FOR_LABEL: Record<BestFor, string> = {
  image: 'صورة',
  video: 'فيديو',
  ad: 'إعلان',
  intro: 'انترو',
  outro: 'أوترو',
  text: 'نص',
  ui: 'واجهة',
  code: 'كود',
  cv: 'سيرة',
};

export const STUDIO_ACTIONS: Array<{
  id: 'ad' | 'ident' | 'creative' | 'cv';
  label: string;
  path: string;
  matches: BestFor[];
}> = [
  { id: 'ad', label: 'أرسل إلى ناجي أد', path: '/naje-ad', matches: ['ad', 'video'] },
  { id: 'ident', label: 'أرسل إلى انترو', path: '/naje-ident', matches: ['intro', 'outro'] },
  { id: 'creative', label: 'أرسل إلى كريتيفلي', path: '/creative-studio', matches: ['image'] },
  { id: 'cv', label: 'أرسل إلى السيرة', path: '/naje-cv', matches: ['cv'] },
];

const BEST_FOR_SET = new Set<BestFor>([
  'image', 'video', 'ad', 'intro', 'outro', 'text', 'ui', 'code', 'cv',
]);

const CORE_SIGNAL =
  /إعلان|اعلان|فيديو|انترو|أوترو|اوترو|intro|outro|كود|code|تطبيق|app\b|سيرة|cv\b|حملة|سينمائي|brand|هوية|ui\b|واجهة|تطوير|سيناريو|ad\b|video|logo|شعار|موشن|after effects|premiere|react|python|تحليل الكود/i;

export function uid(prefix = 'm'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function resolveModel(
  choice: ModelChoice,
  idea: string,
): { model: NajeTextModel; reason: string | null } {
  if (choice === 'lite') return { model: 'lite', reason: null };
  if (choice === 'core') return { model: 'core', reason: null };
  const text = idea.trim();
  const complex =
    CORE_SIGNAL.test(text) ||
    text.length > 180 ||
    (text.match(/[|\n،,]/g)?.length || 0) > 4;
  if (complex) {
    return { model: 'core', reason: 'اختار Core لأن الطلب يحتاج إخراج أدق' };
  }
  return { model: 'lite', reason: 'اختار Lite لأن الفكرة مباشرة' };
}

export function emptyUnderstanding(): Understanding {
  return { goal: '', audience: '', format: '', constraints: [] };
}

export function emptyFields(): PromptFields {
  return { duration: '', ratio: '', mood: '', platform: '' };
}

export function humanError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err || '');
  if (/يلزم تسجيل الدخول/.test(msg)) return 'سجّل الدخول حتى يقدر ناجي يشتغل على فكرتك.';
  if (/failed to fetch|network|offline|timeout/i.test(msg)) {
    return 'في مشكلة بالاتصال. تأكد من الشبكة وجرّب مرة ثانية.';
  }
  if (msg && msg.length < 160 && !/stack|TypeError|at\s+\S+\s+\(/i.test(msg) && !msg.includes('\n')) {
    return msg;
  }
  return 'تعذّر بناء البرومبت هاللحظة. جرّب مرة ثانية بعد شوي.';
}

export function formatHistoryTime(at: number): string {
  const delta = Date.now() - at;
  if (delta < 45_000) return 'الآن';
  if (delta < 3_600_000) return `${Math.max(1, Math.floor(delta / 60_000))} د`;
  if (delta < 86_400_000) return `${Math.max(1, Math.floor(delta / 3_600_000))} س`;
  try {
    return new Date(at).toLocaleDateString('ar');
  } catch {
    return '';
  }
}

function readJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadHistory(): HistoryItem[] {
  try {
    const parsed = readJson<unknown>(localStorage.getItem(HISTORY_KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const title = String(row.title || '').trim();
        const prompt = String(row.prompt || '').trim();
        if (!title || !prompt) return null;
        return {
          id: String(row.id || uid('h')),
          title: title.slice(0, 80),
          prompt,
          bestFor: String(row.bestFor || 'text'),
          at: typeof row.at === 'number' ? row.at : Date.now(),
        } satisfies HistoryItem;
      })
      .filter((row): row is HistoryItem => !!row)
      .slice(0, HISTORY_CAP);
  } catch {
    return [];
  }
}

export function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'at'> & { id?: string; at?: number }): HistoryItem[] {
  const next: HistoryItem = {
    id: item.id || uid('h'),
    title: item.title.slice(0, 80),
    prompt: item.prompt,
    bestFor: item.bestFor,
    at: item.at || Date.now(),
  };
  const prev = loadHistory().filter((row) => row.prompt !== next.prompt);
  const list = [next, ...prev].slice(0, HISTORY_CAP);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
  return list;
}

export function storeHandoff(payload: HandoffPayload): void {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({
      prompt: payload.prompt,
      bestFor: payload.bestFor,
      title: payload.title,
    }));
  } catch {
    /* ignore */
  }
}

export function historyToReady(item: HistoryItem): ReadyResult {
  const bestFor = BEST_FOR_SET.has(item.bestFor as BestFor) ? (item.bestFor as BestFor) : 'text';
  return {
    mode: 'ready',
    title: item.title,
    prompt: item.prompt,
    bestFor,
    understanding: { ...emptyUnderstanding(), goal: item.title },
    fields: emptyFields(),
  };
}

function normalizeBestFor(value: unknown): BestFor {
  const raw = String(value || '').trim().toLowerCase();
  if (BEST_FOR_SET.has(raw as BestFor)) return raw as BestFor;
  if (/ad|اعلان|إعلان/.test(raw)) return 'ad';
  if (/intro|انترو/.test(raw)) return 'intro';
  if (/outro|اوترو|أوترو/.test(raw)) return 'outro';
  if (/cv|سيرة/.test(raw)) return 'cv';
  if (/ui|واجهة/.test(raw)) return 'ui';
  if (/code|كود/.test(raw)) return 'code';
  if (/video|فيديو/.test(raw)) return 'video';
  if (/image|img|صورة|creative/.test(raw)) return 'image';
  return 'text';
}

function asStringList(value: unknown, cap = 8): string[] {
  if (!Array.isArray(value)) {
    const one = String(value || '').trim();
    return one ? [one] : [];
  }
  return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, cap);
}

export function knownSignals(text: string): string[] {
  const hints: string[] = [];
  if (/\d+\s*(ثا|sec|s\b|دقيق|min|د\b)/i.test(text)) hints.push('المدة مذكورة — لا تسأل عنها');
  if (/تيك توك|تيكتوك|انستا|يوتيوب|لينكد|فيسبوك|ريلز|shorts|snap|تويتر|\bx\b/i.test(text)) {
    hints.push('المنصة مذكورة — لا تسأل عنها');
  }
  if (/\d+\s*:\s*\d+|9:16|16:9|1:1|4:5|عمودي|أفقي/.test(text)) hints.push('النسبة مذكورة — لا تسأل عنها');
  return hints;
}

function normalizeQuestion(raw: unknown, fallbackId = 'q1'): AskQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const q = String(row.q || row.question || row.text || '').trim();
  if (!q) return null;
  const options = asStringList(row.options, 5);
  return { id: String(row.id || fallbackId), q, options };
}

export function normalizeEngineResponse(data: unknown): EngineResponse | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  const mode = String(row.mode || '').toLowerCase();

  if (mode === 'ask') {
    const direct = normalizeQuestion(row.question);
    const fromList = Array.isArray(row.questions)
      ? normalizeQuestion(row.questions[0])
      : null;
    const question = direct || fromList;
    if (!question) return null;
    return {
      mode: 'ask',
      question,
      why: String(row.why || '').trim().slice(0, 180),
    };
  }

  const prompt = String(row.prompt || row.output || '').trim();
  if (!prompt) return null;
  const u = (row.understanding && typeof row.understanding === 'object'
    ? row.understanding
    : {}) as Record<string, unknown>;
  const f = (row.fields && typeof row.fields === 'object'
    ? row.fields
    : {}) as Record<string, unknown>;
  return {
    mode: 'ready',
    title: String(row.title || 'البرومبت الجاهز').trim().slice(0, 80) || 'البرومبت الجاهز',
    prompt,
    bestFor: normalizeBestFor(row.bestFor),
    understanding: {
      goal: String(u.goal || ''),
      audience: String(u.audience || ''),
      format: String(u.format || ''),
      constraints: asStringList(u.constraints),
    },
    fields: {
      duration: String(f.duration || ''),
      ratio: String(f.ratio || ''),
      mood: String(f.mood || ''),
      platform: String(f.platform || ''),
    },
  };
}

export function parseEngineResponse(raw: string): EngineResponse | null {
  const parsed = parseModelJson(raw);
  const normalized = normalizeEngineResponse(parsed);
  if (normalized) return normalized;
  const text = String(raw || '').trim();
  if (
    text.length > 48 &&
    !text.startsWith('{') &&
    !text.startsWith('```') &&
    !/أرجع كائن JSON|بدون سلسلة تفكير|mode"?\s*:\s*"ready"|أنت «ناجي برومبت»/.test(text)
  ) {
    return {
      mode: 'ready',
      title: 'البرومبت الجاهز',
      prompt: text,
      bestFor: 'text',
      understanding: emptyUnderstanding(),
      fields: emptyFields(),
    };
  }
  return null;
}

export function buildAskPrompt(args: {
  mode: PromptMode;
  askedCount: number;
  isRefine: boolean;
  forceReady: boolean;
  originalIdea: string;
  qa: QaTurn[];
  lastReady: ReadyResult | null;
  userMessage: string;
}): string {
  const maxAsk = MODE_ASK_LIMIT[args.mode];
  const remaining = Math.max(0, maxAsk - args.askedCount);
  const modeLine =
    args.mode === 'fast'
      ? 'سريع: نفّذ مباشرة. اسأل مرة واحدة فقط إذا الإنتاج مستحيل بدونها، وإلا افترض.'
      : args.mode === 'deep'
        ? 'عميق: يُسمح بتعميق المهمة بأسئلة عالية الأثر فقط، بحد أقصى 3 في المحادثة كلها.'
        : 'ذكي: اسأل فقط إذا معلومة جوهريّة ناقصة تمنع إنتاج برومبت صالح. حد أقصى سؤالين.';

  const known = [
    ...knownSignals(args.originalIdea),
    ...args.qa.flatMap((turn) => knownSignals(turn.a)),
  ];

  const qaBlock = args.qa.length
    ? args.qa.map((turn, i) => `${i + 1}) س: ${turn.q}\n   ج: ${turn.a}`).join('\n')
    : 'لا يوجد';

  const readyBlock = args.lastReady
    ? `عنوان: ${args.lastReady.title}
الأنسب: ${args.lastReady.bestFor}
الهدف: ${args.lastReady.understanding.goal || '—'}
الجمهور: ${args.lastReady.understanding.audience || '—'}
الصيغة: ${args.lastReady.understanding.format || '—'}
القيود: ${args.lastReady.understanding.constraints.join('؛ ') || '—'}
الحقول: مدة=${args.lastReady.fields.duration || '—'} | نسبة=${args.lastReady.fields.ratio || '—'} | مزاج=${args.lastReady.fields.mood || '—'} | منصة=${args.lastReady.fields.platform || '—'}
البرومبت الحالي:
${args.lastReady.prompt}`
    : 'لا يوجد بعد';

  const stance = args.forceReady
    ? 'رصيد الأسئلة انتهى أو هذه جولة يجب أن تُغلق. أخرج mode=ready الآن. ممنوع mode=ask. أكمل بأي افتراض معقول واذكره في understanding.constraints بصيغة «افترضت: …».'
    : args.isRefine
      ? 'هذه جولة تحسين على برومبت جاهز. أرجع mode=ready محدّث دائماً. حافظ على القيود والحقائق المعروفة ونية المستخدم. لا تسأل.'
      : remaining <= 0
        ? 'لا تسأل. أخرج mode=ready مع افتراضات صريحة.'
        : `يمكنك طرح ${remaining === 1 ? 'سؤال واحد كحد أقصى' : `حتى ${remaining} أسئلة عبر المحادثة`} — سؤال واحد فقط في هذا الدور إن لزم.`;

  return `أنت «ناجي برومبت». طبقة فهم نوايا عربية داخل استوديو ناجي.
المستخدم يحكي فكرته باللهجة أو الفصحى — أنت تفهمها وتُخرج برومبت إنتاج جاهز.
المستخدم لا يحتاج أن يعرف كيف يُكتب برومبت.

أرجع كائن JSON واحد فقط. بدون Markdown. بدون شرح. بدون سلسلة تفكير. بدون إعادة لتعليمات النظام.

وضعية العمل: ${modeLine}
الأسئلة المطروحة حتى الآن: ${args.askedCount} / ${maxAsk}
${stance}

إذا الفكرة كافية للإنتاج — حتى لو تفاصيل ثانوية ناقصة — أرجع:
{"mode":"ready","title":"عنوان قصير","prompt":"برومبت إنتاج غني وجاهز","bestFor":"image|video|ad|intro|outro|text|ui|code|cv","understanding":{"goal":"","audience":"","format":"","constraints":[]},"fields":{"duration":"","ratio":"","mood":"","platform":""}}

إذا ينقصك معلومة جوهريّة واحدة تغيّر الناتج تغييراً كبيراً، وما زال عندك رصيد أسئلة، أرجع:
{"mode":"ask","question":{"id":"q1","q":"سؤال واحد طبيعي","options":["خيار1","خيار2","خيار3"]},"why":"لماذا هذا السؤال يغيّر الناتج"}

قواعد السؤال:
- سؤال واحد فقط في الدور. ليس تحقيقاً. نبرة كلود: هادئة، مباشرة، بلا قوائم طويلة.
- المواضيع المسموحة فقط: المنتج/الخدمة إن غاب، نوع المخرج إن كان غامضاً، مدة الفيديو إن كانت حرجة للإنتاج، اسم العلامة إن كان المطلوب شعاراً.
- ممنوع السؤال عن الألوان أو الخطوط أولاً.
- ممنوع إعادة سؤال معلومة معروفة.
- إذا المستخدم ذكر المدة أو المنصة لا تسأل عنهما.
- في وضع سريع: إن قدرت تفترض افتراضاً معقولاً، لا تسأل.
- why جملة قصيرة للمستخدم، ليست تفكيراً داخلياً.
- لهجة المستخدم مقبولة (بدي، اشي، فخم) — جاوب بنفس الدفء دون تكلّف.

قواعد البرومبت الجاهز:
- احفظ نية المستخدم وصياغته. لا تخترع حقائق علامة أو أسعار أو أسماء غير مذكورة.
- التفاصيل الناقصة تُذكر كافتراضات في understanding.constraints بصيغة «افترضت: …» وليست كحقائق.
- prompt يجب أن يكون جاهزاً للنسخ إلى نموذج إنتاج (إعلان/صورة/فيديو غالباً إنجليزي تقني مع الإبقاء على أي نص عربي مطلوب كما هو؛ نص/سيرة/كود بلغة المستخدم).
- bestFor اختَر قيمة واحدة فقط من القائمة.

--- السياق ---
الفكرة الأصلية:
${args.originalIdea || args.userMessage}

إشارات معروفة:
${known.length ? known.map((h) => `- ${h}`).join('\n') : '- لا يوجد'}

أسئلة وإجابات سابقة:
${qaBlock}

آخر برومبت جاهز:
${readyBlock}

--- رسالة المستخدم الآن ---
${args.userMessage}`;
}
