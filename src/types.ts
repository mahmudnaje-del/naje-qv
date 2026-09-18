export type UserData = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: number;
  balance: number;
  isAdmin: boolean;  isBlocked?: boolean;
  canAddAdmins?: boolean;
  hasAcceptedTerms?: boolean;
  hasCompletedOnboarding?: boolean;
  hasRecharged?: boolean;
  emailVerified?: boolean;
  highestPurchasedTier?: number;
};

export type ProjectClassification =
  | 'individual'       // فرد
  | 'business'         // شركة / جهة تجارية
  | 'government'        // جهة حكومية
  | 'nonprofit'         // منظمة غير ربحية
  | 'education'         // مؤسسة تعليمية
  | 'other';            // أخرى

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  entityType?: 'شركة' | 'فرد' | 'مؤسسة غير ربحية' | 'جهة حكومية';
  ownerDisplayName?: string;
  classification?: ProjectClassification;
  classificationOther?: string;
  brandProfile?: any;
  createdAt: number;
}

export type MemoryItemType = 'text' | 'file' | 'url';

export interface MemoryItem {
  id: string;
  ownerId: string;
  projectId: string;
  type: MemoryItemType;
  label: string;
  rawSizeBytes: number;
  storageRef?: string;
  summary: string;
  sourceUrl?: string;
  mimeType?: string;
  createdAt: number;
}

export const CLASSIFICATION_GUIDANCE: Record<ProjectClassification, string> = {
  individual:  "خاطب المستخدم بأسلوب مرن وودود، وامنحه مساحة إبداعية كاملة دون قيود رسمية إلا إذا طلب خلاف ذلك.",
  business:    "اعتمد أسلوباً احترافياً تسويقياً بشكل افتراضي، مناسب لعلامة تجارية، مع إمكانية المرونة حسب الطلب.",
  government:  "اعتمد أسلوباً رسمياً وحيادياً بشكل افتراضي، تجنّب العامية إلا إذا طُلبت صراحة، وكن دقيقاً وحذراً في أي ادعاءات واقعية — هذا محتوى مؤسسي رسمي.",
  nonprofit:   "اعتمد أسلوباً دافئاً وإنسانياً يعكس رسالة المنظمة، مع الحفاظ على المصداقية والوضوح.",
  education:   "اعتمد أسلوباً تعليمياً واضحاً ومنظماً، مناسباً لمحتوى تربوي أو أكاديمي.",
  other:       "اعتمد أسلوباً متوازناً واحترافياً افتراضياً.",
};

export function getClassificationLabel(classification?: ProjectClassification, classificationOther?: string): string {
  switch (classification) {
    case 'individual': return 'فرد';
    case 'business': return 'شركة / جهة تجارية';
    case 'government': return 'جهة حكومية';
    case 'nonprofit': return 'منظمة غير ربحية';
    case 'education': return 'مؤسسة تعليمية';
    case 'other': return classificationOther ? `أخرى (${classificationOther})` : 'أخرى';
    default: return 'فرد';
  }
}

export type ChatType = 'text' | 'image' | 'video' | 'ui' | 'voice' | 'document' | 'design' | 'agent';

export type ChatSession = {
  ownerId?: string;
  id: string;
  projectId: string;
  type: ChatType;
  title: string;
  createdAt: number;
};

export type Chat = ChatSession;

export type ChatMessage = {
  ownerId?: string;
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  mediaUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  uiCode?: string;
  files?: any[]; // For images/videos generated or uploaded
  isEdit?: boolean;
  sourceMediaUrl?: string;
  searchSources?: Array<{ title: string; url: string }>;
  createdAt: number;
  interactionId?: string;
  mediaType?: 'video' | 'image' | 'audio';
  voiceConfig?: {
    mode: 'single' | 'dual';
    voice1?: string;
    voice2?: string;
    speaker1Name?: string;
    speaker2Name?: string;
    style?: string;
    durationSeconds?: number;
  };
  costInPoints?: number;
  usage?: {
    charged: number;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    thoughtsTokens?: number;
    billingType?: 'per_token' | 'per_generation' | 'per_character';
  };
};

export type Message = ChatMessage;

export type RedeemCode = {
  id: string;
  code: string;
  points: number;
  used: boolean;
  usedBy?: string;  usedByArray?: string[];  usageCount?: number;  maxUsage?: number;
  usedAt?: number;
  createdAt: number;
  batchId?: string;
};

export interface ModelEndpoint {
  id: string;                    // e.g. "tier_lite", "image_standard", "video_veo_lite", "critic_review"
  featureGroup: 'text' | 'image' | 'video' | 'ui' | 'document' | 'voice' | 'infographic';
  labelAr: string;               // e.g. "Naje Lite (نص خفيف)" or "الناقد — مراجعة الطلب قبل التنفيذ"
  modelId: string;                // exact API model string
  pricingType?: 'per_token' | 'per_generation' | 'per_character';
  inputPointsPer1k?: number;      // Points per 1,000 input tokens (legacy / convenience)
  outputPointsPer1k?: number;     // Points per 1,000 output tokens (legacy / convenience)
  audioInputPointsPer1k?: number; // Points per 1,000 audio tokens (legacy / convenience)
  inputPointsPerBlock?: number;   // Points charged per input block
  inputTokenBlockSize?: number;   // Block size for input tokens (e.g. 500, 1000)
  outputPointsPerBlock?: number;  // Points charged per output block
  outputTokenBlockSize?: number;  // Block size for output tokens (e.g. 500, 1000)
  audioInputPointsPerBlock?: number;
  audioInputTokenBlockSize?: number;
  isBackground?: boolean;         // true for internal/background services (الناقد, المدقق, etc.)
  total30dCostInPoints?: number;  // Aggregated points consumption over last 30 days
  paramNotes?: string;            // e.g. "دقة 1K", "720p"
  maxOutputTokens?: number;       // Admin-configurable maximum generation tokens ceiling
  realCostPer: { 
    unit: 'per_1m_input_tokens' | 'per_1m_output_tokens' | 'per_image' | 'per_second' | 'per_1m_audio_tokens' | 'per_page' | 'per_slide' | 'per_render'; 
    usd: number 
  };
  pointsPrice: number;            // what Naje charges in points (for flat/per_generation)
  isEnabled?: boolean;            // Admin enable/disable toggle
  isUnconfirmedCost?: boolean;    // غير مؤكد badge
  lastValidatedAt?: number;
  lastValidatedOk?: boolean;
  fallbackModelId?: string;        // NEW — the model to automatically switch to if `modelId` starts failing
  lastKnownGoodModelId?: string;   // NEW — auto-updated by the system, not manually edited; tracks the last model that successfully returned a result, for admin visibility
  lastFailureAt?: number | null;   // NEW — auto-updated timestamp of the most recent detected failure, for admin visibility
  lastFailureReason?: string | null; // NEW — auto-updated, the actual error message/code from the most recent failure
  envVarKey?: string;             // Associated environment variable key (e.g. NAJE_MODEL_VIDEO_PRO)
  supportedDurations?: number[];   // e.g. [4, 5, 6, 8]
  supportsImageInput?: boolean;    // e.g. true for Veo lite / Omni
}

export interface PayPalPackage {
  id: string;
  points: number;
  usd: number;
}

export interface PayPalOrder {
  order_id: string;
  user_id: string;
  points_requested: number;
  amount_usd: number;
  status: 'created' | 'captured' | 'failed';
  created_at: any;
  captured_at: any | null;
}

export interface Transaction {
  id?: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  source: 'redeem_code' | 'paypal' | 'admin_adjustment';
  order_id?: string;
  timestamp: any;
}

