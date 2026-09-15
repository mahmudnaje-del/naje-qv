import { ModelEndpoint } from '../types';
import { getNajeModel, resolveEngineModel } from './modelEnvConfig';

export const POINT_USD_VALUE = 0.02; // 1 Naje Point = $0.02 USD revenue equivalent

/**
 * Standardized Output Token Ceiling Categories
 * Prevents default 8,192 token truncation across all Gemini generation calls.
 */
export const OUTPUT_TOKEN_LIMITS = {
  criticReview: 4096,                 // الناقد's structured JSON verdict — short by design
  classification: 4096,               // Intent classification and safety guardrails
  memorySummary: 4096,                // Project memory item concise summarization
  imageCompiler: 4096,                // compileImagePrompt / applyCreativeLayers — prompt text compilation
  videoCompiler: 8192,                // compileVideoPrompt / auditVideoPrompt — shot lists and script directions
  documentChunk: 32000,               // document_writer/slide_writer — comprehensive chapters / slide batch
  documentSection: 16000,             // individual section audit & refinement
  slideJson: 8192,                    // presentation slide JSON structure
  fullstackContractSynthesis: 16000,  // Phase 2 — signatures, type definitions, and contract interfaces
  fullstackFileGeneration: 60000,      // Phase 3 — complete individual code files (close to 65,535 capacity)
  fullstackAudit: 16000,              // Phase 4/6 — structured lint and semantic audit findings
  agentPlan: 8192,                    // generateAgentProposal & planner function-calling
  agentAudit: 8192,                   // auditAgentStepResult verification
  voiceScript: 8192,                  // dialogue script structuring in agentExecutor
  audioSpeech: 8192,                  // TTS audio generation tokens
  mediaAnalysis: 8192,                // Multimodal OCR / image / audio inspection
  webGrounding: 16000,                // Google Search grounded research synthesis
  textChat: 32000,                    // conversational chat and deep thinking responses
  chatResponse: 32000,                // standard chat response ceiling
  uiBuilder: 32000,                   // UI components & interactive widgets generation
  uiPlan: 8192,                       // UI generation architecture & layout planning
  uiHtml: 32000,                      // full-page interactive UI HTML output
} as const;

export const SEED_ENDPOINTS: ModelEndpoint[] = [
  // TEXT / CORE TIERS (User-Facing Text Models — Token Metered)
  { 
    id: 'tier_lite', 
    featureGroup: 'text', 
    labelAr: 'Naje Lite (نص خفيف)', 
    modelId: getNajeModel('lite'), 
    fallbackModelId: getNajeModel('lite'),
    paramNotes: 'استجابة سريعة جداً واستهلاك توكنز منخفض',
    maxOutputTokens: 32000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1000,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1000,
    audioInputPointsPer1k: 0.2,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 }, 
    pointsPrice: 0,
    isBackground: false
  },
  { 
    id: 'tier_core', 
    featureGroup: 'text', 
    labelAr: 'Naje Core (نص قياسي)', 
    modelId: getNajeModel('core'), 
    fallbackModelId: getNajeModel('lite'),
    paramNotes: 'متوازن وذكي (النموذج الافتراضي للذكاء المتطور)',
    maxOutputTokens: 32000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1000,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1000,
    audioInputPointsPer1k: 0.2,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 1.25 }, 
    pointsPrice: 0,
    isBackground: false
  },
  { 
    id: 'tier_max', 
    featureGroup: 'text', 
    labelAr: 'Naje Pro (تفكير عميق)', 
    modelId: getNajeModel('pro'), 
    fallbackModelId: getNajeModel('core'),
    paramNotes: 'أعلى دقة استدلالية وتفكير تحليلي متقدم', 
    maxOutputTokens: 32000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1000,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1000,
    audioInputPointsPer1k: 0.2,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 2.00 }, 
    pointsPrice: 0,
    isBackground: false
  },

  // BACKGROUND & INTERNAL COGNITIVE SERVICES (Council & Pipelines — Token Metered)
  {
    id: 'critic_review',
    featureGroup: 'text',
    labelAr: 'الناقد — مراجعة وتدقيق الطلبات قبل التنفيذ',
    modelId: getNajeModel('personas'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'فحص مسبق للغموض والتناقضات وتصحيحها',
    maxOutputTokens: 4096,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 },
    pointsPrice: 0,
    isBackground: true
  },
  {
    id: 'creative_council',
    featureGroup: 'text',
    labelAr: 'مجلس عقول ناجي — التوجيه الإبداعي والطبقات',
    modelId: getNajeModel('personas'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'المصوّر، المخرج، الكاتب، مهندس الصوتيات (شخصيات ناجي)',
    maxOutputTokens: 8192,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 },
    pointsPrice: 0,
    isBackground: true
  },
  {
    id: 'agent_planner',
    featureGroup: 'text',
    labelAr: 'مخطط الوكلاء الذكي (Agent Planner)',
    modelId: getNajeModel('personas'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'تفكيك المهام وبناء خطط الوكيل وتعديلها (شخصية الوكيل)',
    maxOutputTokens: 8192,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 },
    pointsPrice: 0,
    isBackground: true
  },
  {
    id: 'agent_auditor',
    featureGroup: 'text',
    labelAr: 'مدقق خطوات الوكيل (Agent Step Auditor)',
    modelId: getNajeModel('personas'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'التحقق الاستراتيجي وضبط الجودة لكل خطوة (شخصية الوكيل)',
    maxOutputTokens: 8192,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 },
    pointsPrice: 0,
    isBackground: true
  },
  {
    id: 'agent_narrator',
    featureGroup: 'text',
    labelAr: 'سارد إنجازات الوكيل (Agent Step Narrator)',
    modelId: getNajeModel('personas'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'صياغة تأكيد إنجاز الخطوات بصوت ناجي الطبيعي (شخصية الوكيل)',
    maxOutputTokens: 4096,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 },
    pointsPrice: 0,
    isBackground: true
  },
  {
    id: 'fullstack_builder',
    featureGroup: 'ui',
    labelAr: 'النسّاج — مهندس الأنظمة المتكاملة (Fullstack Engineer)',
    modelId: getNajeModel('pro'),
    fallbackModelId: getNajeModel('core'),
    paramNotes: 'توليد ملفات البرمجة والأنظمة الكاملة (Phase 3)',
    maxOutputTokens: 60000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 2.00 },
    pointsPrice: 0,
    isBackground: false
  },
  {
    id: 'fullstack_auditor',
    featureGroup: 'ui',
    labelAr: 'النسّاج — مدقق الجودة والأنظمة (Fullstack Auditor)',
    modelId: getNajeModel('personas'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'التدقيق المعماري والبرمجي وفحص التوافق (شخصية المدقق)',
    maxOutputTokens: 16000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 },
    pointsPrice: 0,
    isBackground: true
  },
  {
    id: 'image_prompt_compiler',
    featureGroup: 'image',
    labelAr: 'مجمّع أوامر الصور (Image Prompt Compiler)',
    modelId: getNajeModel('personas'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'هيكلة وإثراء أوامر توليد الصور الاحترافية (شخصية المصور)',
    maxOutputTokens: 4096,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 },
    pointsPrice: 0,
    isBackground: true
  },
  {
    id: 'video_prompt_compiler',
    featureGroup: 'video',
    labelAr: 'مخرج ومشرف سيناريو الفيديو (Video Director)',
    modelId: getNajeModel('personas'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'تصميم لقطات وسيناريو وحركات الكاميرا (شخصية المخرج)',
    maxOutputTokens: 8192,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 },
    pointsPrice: 0,
    isBackground: true
  },
  {
    id: 'image_auditor',
    featureGroup: 'image',
    labelAr: 'مدقق جودة وتطابق الصور (Image Verifier)',
    modelId: getNajeModel('personas'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'فحص مخرجات الصور ومقارنتها بالطلب الأصلي (شخصية الفاحص)',
    maxOutputTokens: 4096,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 },
    pointsPrice: 0,
    isBackground: true
  },

  // UI STUDIO & DOCUMENTS
  { 
    id: 'ui_builder', 
    featureGroup: 'ui', 
    labelAr: 'استوديو الواجهات UI Studio', 
    modelId: getNajeModel('core'), 
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'توليد المكونات التفاعلية وتصميم الصفحات',
    maxOutputTokens: 32000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 1.25 }, 
    pointsPrice: 0,
    isBackground: false
  },
  { 
    id: 'document_engine', 
    featureGroup: 'document', 
    labelAr: 'محرك تدقيق المستندات والشرائح (Auditor)', 
    modelId: getNajeModel('personas'), 
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'مراجعة وتدقيق جودة وتناسق المستندات والشرائح (شخصية الكاتب)',
    maxOutputTokens: 16000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 }, 
    pointsPrice: 0,
    isBackground: true
  },
  { 
    id: 'document_writer', 
    featureGroup: 'document', 
    labelAr: 'كاتب المستندات (Document Writer)', 
    modelId: getNajeModel('personas'), 
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'توليد وصياغة أقسام المستندات والتقارير (شخصية الكاتب)',
    maxOutputTokens: 32000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 }, 
    pointsPrice: 0,
    isBackground: false
  },
  { 
    id: 'slide_writer', 
    featureGroup: 'document', 
    labelAr: 'كاتب الشرائح (Slide Writer)', 
    modelId: getNajeModel('personas'), 
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'توليد وتأليف محتوى العروض التقديمية (شخصية الكاتب)',
    maxOutputTokens: 32000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 }, 
    pointsPrice: 0,
    isBackground: false
  },
  {
    id: 'doc_standard',
    featureGroup: 'document',
    labelAr: 'مستند — A4 (لكل صفحة)',
    modelId: getNajeModel('core'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'توليد وتصدير صفحات A4 الرسمية',
    maxOutputTokens: 32000,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_page', usd: 0.003 },
    pointsPrice: 0.15,
    isBackground: false
  },
  {
    id: 'doc_a5',
    featureGroup: 'document',
    labelAr: 'مستند — A5 (لكل صفحة)',
    modelId: getNajeModel('core'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'توليد وتصدير صفحات A5 المصغرة',
    maxOutputTokens: 32000,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_page', usd: 0.002 },
    pointsPrice: 0.10,
    isBackground: false
  },
  {
    id: 'doc_slides',
    featureGroup: 'document',
    labelAr: 'عرض تقديمي — شرائح (لكل شريحة)',
    modelId: getNajeModel('core'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'توليد وتصدير شرائح العرض التقديمي PPTX/PDF',
    maxOutputTokens: 32000,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_slide', usd: 0.004 },
    pointsPrice: 0.20,
    isBackground: false
  },
  {
    id: 'infographic_designer',
    featureGroup: 'document',
    labelAr: 'المصمم — محرك الإنفوجرافيك (Infographic Engine)',
    modelId: getNajeModel('personas'),
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'رسم بياني وتصميم إنفوجرافيك بصري وتصديره عبر Puppeteer (PNG + PDF)',
    maxOutputTokens: 16000,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_render', usd: 0.005 },
    pointsPrice: 0.50,
    isBackground: false
  },

  // IMAGE GENERATION (Flat Per-Unit Pricing)
  { 
    id: 'image_lite', 
    featureGroup: 'image', 
    labelAr: 'صورة — Naje Imagen Lite', 
    modelId: 'nano-banana-2-lite', 
    fallbackModelId: getNajeModel('image_lite'),
    paramNotes: 'خفيف وسريع (0.5 نقطة افتراضياً)', 
    maxOutputTokens: 4096,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_image', usd: 0.01 }, 
    pointsPrice: 0.5,
    isBackground: false
  },
  { 
    id: 'image_spectra', 
    featureGroup: 'image', 
    labelAr: 'صورة — Naje Imagen', 
    modelId: 'nano-banana-2', 
    fallbackModelId: getNajeModel('image_core'),
    paramNotes: 'توازن قياسي (نقطة واحدة افتراضياً)', 
    maxOutputTokens: 4096,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_image', usd: 0.02 }, 
    pointsPrice: 1.0,
    isBackground: false
  },
  { 
    id: 'image_addon', 
    featureGroup: 'image', 
    labelAr: 'إضافة دمج الصور المرجعية (Addon)', 
    modelId: getNajeModel('personas'), 
    fallbackModelId: getNajeModel('personas'),
    paramNotes: 'تكلفة دمج كل صورة مرجعية إضافية', 
    maxOutputTokens: 4096,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_image', usd: 0.002 }, 
    pointsPrice: 0.1,
    isBackground: false
  },
  { 
    id: 'image_fast', 
    featureGroup: 'image', 
    labelAr: 'صورة — Naje Imagen Lite (سريعة)', 
    modelId: 'nano-banana-2-lite', 
    fallbackModelId: getNajeModel('image_lite'),
    paramNotes: 'توليد فوري خفيف', 
    maxOutputTokens: 4096,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_image', usd: 0.04 }, 
    pointsPrice: 3,
    isBackground: false
  },
  { 
    id: 'image_standard', 
    featureGroup: 'image', 
    labelAr: 'صورة — Naje Imagen المعيارية', 
    modelId: 'nano-banana-2', 
    fallbackModelId: getNajeModel('image_core'),
    paramNotes: '1024x1024 دقة قياسية', 
    maxOutputTokens: 4096,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_image', usd: 0.067 }, 
    pointsPrice: 5,
    isBackground: false
  },
  { 
    id: 'image_hd', 
    featureGroup: 'image', 
    labelAr: 'صورة — Naje Imagen Pro (عالية الدقة)', 
    modelId: 'nano-banana-pro', 
    fallbackModelId: getNajeModel('image_pro'),
    paramNotes: '2048x2048 دقة فائقة', 
    maxOutputTokens: 4096,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_image', usd: 0.101 }, 
    pointsPrice: 10,
    isBackground: false
  },
  { 
    id: 'image_pro', 
    featureGroup: 'image', 
    labelAr: 'صورة — Naje Imagen Pro (الاحترافية)', 
    modelId: 'nano-banana-pro', 
    fallbackModelId: getNajeModel('image_pro'),
    paramNotes: 'جودة فائقة مع تحكم بالفرشاة والطبقات',
    maxOutputTokens: 4096,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_image', usd: 0.134 }, 
    pointsPrice: 12,
    isBackground: false
  },

  // VIDEO GENERATION (Flat Per-Unit Pricing)
  { 
    id: 'video_standard', 
    envVarKey: 'NAJE_MODEL_VIDEO_CORE',
    featureGroup: 'video', 
    labelAr: 'فيديو — Naje Video', 
    modelId: getNajeModel('video_core'), 
    fallbackModelId: getNajeModel('video_core'),
    paramNotes: '720p سينمائي قياسي', 
    maxOutputTokens: 8192,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_second', usd: 0.05 }, 
    pointsPrice: 20,
    isBackground: false,
    supportedDurations: [4, 6, 8],
    supportsImageInput: true
  },
  { 
    id: 'video_veo_lite', 
    envVarKey: 'NAJE_MODEL_VIDEO_CORE',
    featureGroup: 'video', 
    labelAr: 'فيديو — Naje Video (Lite)', 
    modelId: getNajeModel('video_core'), 
    fallbackModelId: getNajeModel('video_core'),
    paramNotes: '720p @ 5s', 
    maxOutputTokens: 8192,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_second', usd: 0.05 }, 
    pointsPrice: 25,
    isBackground: false,
    supportedDurations: [4, 6, 8],
    supportsImageInput: true
  },
  { 
    id: 'video_omni', 
    envVarKey: 'NAJE_MODEL_VIDEO_PRO',
    featureGroup: 'video', 
    labelAr: 'فيديو — Naje Video Pro', 
    modelId: getNajeModel('video_pro'), 
    fallbackModelId: getNajeModel('video_pro'),
    paramNotes: 'Naje Video Pro Multimodal Video', 
    maxOutputTokens: 8192,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_second', usd: 0.05 }, 
    isUnconfirmedCost: true, 
    pointsPrice: 20,
    isBackground: false,
    supportedDurations: [5, 10],
    supportsImageInput: true
  },

  // VOICE TTS (Flat Per-Unit Pricing)
  { 
    id: 'voice_tts', 
    featureGroup: 'voice', 
    labelAr: 'تسجيل صوتي — Naje Voice Core (الأساسي)', 
    modelId: getNajeModel('voice_core'), 
    fallbackModelId: getNajeModel('voice_core'),
    paramNotes: 'تحويل النص إلى صوت بشري متناسق وسريع (Core)',
    maxOutputTokens: 8192,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_1m_audio_tokens', usd: 20.00 }, 
    isUnconfirmedCost: true, 
    pointsPrice: 2,
    isBackground: false
  },
  { 
    id: 'voice_tts_pro', 
    featureGroup: 'voice', 
    labelAr: 'تسجيل صوتي — Naje Voice Pro (الاحترافي الفائق)', 
    modelId: getNajeModel('voice_pro'), 
    fallbackModelId: getNajeModel('voice_core'),
    paramNotes: 'أعلى دقة ونقاء صوتي ومعالجة نبرات متقدمة (Pro)',
    maxOutputTokens: 16384,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_1m_audio_tokens', usd: 40.00 }, 
    isUnconfirmedCost: true, 
    pointsPrice: 4,
    isBackground: false
  },
  { 
    id: 'voice_tts_standard', 
    featureGroup: 'voice', 
    labelAr: 'تسجيل صوتي — حوار متعدد الأصوات (Core)', 
    modelId: getNajeModel('voice_core'), 
    fallbackModelId: getNajeModel('voice_core'),
    paramNotes: 'حوار بين شخصيات متعددة',
    maxOutputTokens: 8192,
    pricingType: 'per_generation',
    realCostPer: { unit: 'per_1m_audio_tokens', usd: 20.00 }, 
    isUnconfirmedCost: true, 
    pointsPrice: 2,
    isBackground: false
  },

  // TEXT TIER ENDPOINT ALIASES
  {
    id: 'text_lite',
    featureGroup: 'text',
    labelAr: 'نص خفيف (Lite Tier)',
    modelId: getNajeModel('lite'),
    fallbackModelId: getNajeModel('lite'),
    paramNotes: 'محادثة سريعة واستهلاك اقتصادي',
    maxOutputTokens: 32000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 0.25 },
    pointsPrice: 0,
    isBackground: false
  },
  {
    id: 'text_core',
    featureGroup: 'text',
    labelAr: 'نص قياسي (Core Tier)',
    modelId: getNajeModel('core'),
    fallbackModelId: getNajeModel('lite'),
    paramNotes: 'محادثة متوازنة ذكية وسريعة',
    maxOutputTokens: 32000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 1.25 },
    pointsPrice: 0,
    isBackground: false
  },
  {
    id: 'text_max',
    featureGroup: 'text',
    labelAr: 'نص استدلالي (Pro Tier)',
    modelId: getNajeModel('pro'),
    fallbackModelId: getNajeModel('core'),
    paramNotes: 'تفكير تحليلي عميق ومعالجة معقدة',
    maxOutputTokens: 32000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 2.00 },
    pointsPrice: 0,
    isBackground: false
  },
  {
    id: 'ui_standard',
    featureGroup: 'ui',
    labelAr: 'واجهات — القياسي',
    modelId: getNajeModel('core'),
    fallbackModelId: getNajeModel('lite'),
    paramNotes: 'توليد كود واجهات المستخدم',
    maxOutputTokens: 32000,
    pricingType: 'per_token',
    inputPointsPer1k: 0.1,
    outputPointsPer1k: 0.1,
    realCostPer: { unit: 'per_1m_input_tokens', usd: 1.25 },
    pointsPrice: 0,
    isBackground: false
  }
];

export const FALLBACK_MODEL_DEFAULTS: Record<string, string> = {
  tier_lite: getNajeModel('lite'),
  tier_core: getNajeModel('core'),
  tier_max: getNajeModel('pro'),
  text_lite: getNajeModel('lite'),
  text_core: getNajeModel('core'),
  text_max: getNajeModel('pro'),
  critic_review: getNajeModel('personas'),
  creative_council: getNajeModel('personas'),
  agent_planner: getNajeModel('personas'),
  agent_auditor: getNajeModel('personas'),
  agent_narrator: getNajeModel('personas'),
  fullstack_builder: getNajeModel('pro'),
  fullstack_auditor: getNajeModel('personas'),
  image_prompt_compiler: getNajeModel('personas'),
  video_prompt_compiler: getNajeModel('personas'),
  image_auditor: getNajeModel('personas'),
  image_standard: getNajeModel('image_core'),
  image_hd: getNajeModel('image_pro'),
  image_pro: getNajeModel('image_pro'),
  image_fast: getNajeModel('image_lite'),
  image_lite: getNajeModel('image_lite'),
  image_spectra: getNajeModel('image_core'),
  image_addon: getNajeModel('personas'),
  video_veo_lite: getNajeModel('video_core'),
  video_standard: getNajeModel('video_core'),
  video_omni: getNajeModel('video_pro'),
  video_hd: getNajeModel('video_pro'),
  ui_builder: getNajeModel('core'),
  ui_standard: getNajeModel('core'),
  voice_tts: getNajeModel('voice_core'),
  voice_tts_core: getNajeModel('voice_core'),
  voice_tts_pro: getNajeModel('voice_pro'),
  voice_tts_standard: getNajeModel('voice_core'),
  document_engine: getNajeModel('personas'),
  doc_standard: getNajeModel('core'),
  doc_a5: getNajeModel('core'),
  doc_slides: getNajeModel('core'),
  document_writer: getNajeModel('personas'),
  slide_writer: getNajeModel('personas'),
  infographic_designer: getNajeModel('personas')
};

export const FALLBACK_OUTPUT_LIMITS: Record<string, number> = {
  tier_lite: 32000,
  tier_core: 32000,
  tier_max: 32000,
  text_lite: 32000,
  text_core: 32000,
  text_max: 32000,
  critic_review: 4096,
  creative_council: 8192,
  agent_planner: 8192,
  agent_auditor: 8192,
  agent_narrator: 4096,
  fullstack_builder: 60000,
  fullstack_auditor: 16000,
  image_prompt_compiler: 4096,
  video_prompt_compiler: 8192,
  image_auditor: 4096,
  image_standard: 4096,
  image_hd: 4096,
  image_pro: 4096,
  image_fast: 4096,
  video_veo_lite: 8192,
  video_standard: 8192,
  video_omni: 8192,
  video_hd: 8192,
  ui_builder: 32000,
  ui_standard: 32000,
  voice_tts: 8192,
  voice_tts_core: 8192,
  voice_tts_pro: 16384,
  voice_tts_standard: 8192,
  document_engine: 16000,
  doc_standard: 16000,
  document_writer: 32000,
  slide_writer: 32000,
};

export const FALLBACK_DEFAULTS: Record<string, string> = {
  tier_lite: getNajeModel('lite'),
  tier_core: getNajeModel('core'),
  tier_max: getNajeModel('pro'),
  text_lite: getNajeModel('lite'),
  text_core: getNajeModel('core'),
  text_max: getNajeModel('pro'),
  critic_review: getNajeModel('personas'),
  creative_council: getNajeModel('personas'),
  agent_planner: getNajeModel('personas'),
  agent_auditor: getNajeModel('personas'),
  agent_narrator: getNajeModel('personas'),
  fullstack_builder: getNajeModel('pro'),
  fullstack_auditor: getNajeModel('personas'),
  image_prompt_compiler: getNajeModel('personas'),
  video_prompt_compiler: getNajeModel('personas'),
  image_auditor: getNajeModel('personas'),
  image_standard: getNajeModel('image_core'),
  image_hd: getNajeModel('image_pro'),
  image_pro: getNajeModel('image_pro'),
  image_fast: getNajeModel('image_lite'),
  image_lite: getNajeModel('image_lite'),
  image_spectra: getNajeModel('image_core'),
  image_addon: getNajeModel('personas'),
  video_veo_lite: getNajeModel('video_core'),
  video_standard: getNajeModel('video_core'),
  video_omni: getNajeModel('video_pro'),
  ui_builder: getNajeModel('core'),
  ui_standard: getNajeModel('core'),
  voice_tts: getNajeModel('voice_core'),
  voice_tts_core: getNajeModel('voice_core'),
  voice_tts_pro: getNajeModel('voice_pro'),
  voice_tts_standard: getNajeModel('voice_core'),
  document_engine: getNajeModel('personas'),
  doc_standard: getNajeModel('core'),
  doc_a5: getNajeModel('core'),
  doc_slides: getNajeModel('core'),
  document_writer: getNajeModel('personas'),
  slide_writer: getNajeModel('personas'),
  infographic_designer: getNajeModel('personas')
};

export function estimatePerRequestUsdCost(endpoint: ModelEndpoint): number {
  const { unit, usd } = endpoint.realCostPer;
  switch (unit) {
    case 'per_image':
      return usd;
    case 'per_second':
      return usd * 5; // average 5 seconds video
    case 'per_1m_input_tokens':
    case 'per_1m_output_tokens':
      return (usd / 1000000) * 4000; // avg 4k tokens per text turn
    case 'per_1m_audio_tokens':
      return (usd / 1000000) * 2500; // avg 2.5k audio tokens
    default:
      return usd;
  }
}

export function calculateMarginPercentage(endpoint: ModelEndpoint): number {
  if (endpoint.pricingType === 'per_token') {
    // For per-token pricing: 1,000 tokens pricing vs 1,000 tokens cost
    const inRate = endpoint.inputPointsPer1k ?? 0.1;
    const outRate = endpoint.outputPointsPer1k ?? 0.1;
    const avgPointsPer1k = (inRate + outRate) / 2;
    const revenuePer1kUsd = avgPointsPer1k * POINT_USD_VALUE; // e.g. 0.1 * $0.02 = $0.002 per 1k tokens ($2.00 / 1M)
    const costPer1kUsd = (endpoint.realCostPer.usd / 1000);   // e.g. $0.25 / 1000 = $0.00025 per 1k tokens ($0.25 / 1M)
    if (revenuePer1kUsd <= 0) return 0;
    const margin = ((revenuePer1kUsd - costPer1kUsd) / revenuePer1kUsd) * 100;
    return Math.round(margin * 10) / 10;
  }

  const revenueUsd = (endpoint.pointsPrice || 0) * POINT_USD_VALUE;
  if (revenueUsd <= 0) return 0;
  const costUsd = estimatePerRequestUsdCost(endpoint);
  const margin = ((revenueUsd - costUsd) / revenueUsd) * 100;
  return Math.round(margin * 10) / 10;
}
