import { GoogleGenAI } from '@google/genai';
import { buildPersonaInstruction } from './councilOfMinds';

export const NAJE_CORE_IDENTITY_SHARED = `أنت "ناجي" (Naje AI) — منصة ذكاء اصطناعي توليدية عربية أولاً.

هويتك:
- اسمك ناجي. لغتك الأساسية العربية (باللهجة الأردنية عند الحديث بشكل ودّي)، وتدعم كل اللغات.
- شعارك: "نبدع لك في كل بكسل".
- نبرتك: احترافي، واثق، ودود، مباشر — بلا تصنّع وبلا رسمية جافة.
- أنت ذكاء اصطناعي ولا تدّعي أبداً أنك إنسان إذا سُئلت صراحة.

قدراتك الكاملة (اعرفها كلها حتى لو كنت في مساحة متخصصة الآن):
- دردشة عامة وتحليل نصوص
- توليد الصور والشعارات والهويات البصرية
- توليد الفيديو بأساليب وقوالب جاهزة
- توليد المستندات: عروض PowerPoint، Word، PDF (شرائح أو مستند)
- تصميم واجهات المواقع والتطبيقات (مساحة "تصميم الواجهات")
- تحويل النصوص لتسجيلات صوتية احترافية بصوت واحد أو حوار بصوتين (استوديو الصوتيات)

إذا سأل المستخدم "من أنت؟" أو "شو بتقدر تعمل؟" — اشرح هويتك وقدراتك بوضوح وثقة، حتى لو كنت داخل مساحة متخصصة.

النظام يعمل باقتصاد نقاط: التوليد الفعلي يخصم نقاطاً، والدردشة والتخطيط مجاناً.`;

interface CachedContentEntry {
  cacheName: string;
  model: string;
  expiresAt: number;
}

// In-memory cache map by key to reuse active explicit caches across requests
const activeCaches = new Map<string, CachedContentEntry>();

/**
 * Gets or creates an explicit Gemini Context Cache for stable system instructions.
 * TTL defaults to 3600 seconds (1 hour).
 */
export async function getOrCreateExplicitCache(
  ai: any,
  key: string,
  model: string,
  systemInstructionText: string,
  ttlSeconds: number = 3600
): Promise<string | null> {
  const existing = activeCaches.get(key);
  const now = Date.now();

  // If existing cache is still valid for at least another 5 minutes, reuse it
  if (existing && existing.model === model && existing.expiresAt > (now + 300_000)) {
    return existing.cacheName;
  }

  // Explicit context caching in Gemini/Vertex AI strictly requires at least 4,096 tokens (~16,000 characters).
  // Skip explicit cache creation for shorter instructions to avoid INVALID_ARGUMENT 400 errors.
  if (!systemInstructionText || systemInstructionText.length < 16000) {
    return null;
  }

  try {
    if (ai && ai.caches && typeof ai.caches.create === 'function') {
      const cacheResponse = await ai.caches.create({
        model,
        config: {
          displayName: `naje_${key}_cache`,
          systemInstruction: systemInstructionText,
          ttl: `${ttlSeconds}s`
        }
      });

      if (cacheResponse && cacheResponse.name) {
        activeCaches.set(key, {
          cacheName: cacheResponse.name,
          model,
          expiresAt: now + (ttlSeconds * 1000)
        });
        console.log(`[Context Caching] Created explicit cache for '${key}' (${cacheResponse.name}) with TTL ${ttlSeconds}s`);
        return cacheResponse.name;
      }
    }
  } catch (err: any) {
    // Non-fatal fallback: If explicit cache creation is unsupported or project quota exhausted,
    // generation continues seamlessly using normal prefix-matched implicit caching.
    console.warn(`[Context Caching] Explicit cache creation bypassed for '${key}':`, err?.message || err);
  }

  return null;
}

/**
 * Helper to build standard Critic cached system instruction prefix.
 */
export function getCriticCachedInstruction(): string {
  const personaCore = `مهمتك: فحص الطلب بدقة شديدة قبل أي إنتاج فعلي، واكتشاف أي غموض أو تناقض أو نقص بالسياق قد يضعف جودة النتيجة النهائية، واقتراح حلول واضحة ومحددة.

قواعد صارمة:
1. لا ترفض طلبات غامضة — أصلحها بنفسك حيثما كان الإصلاح واضحاً ومنطقياً وعزّز البرومبت (enrichedPrompt) بالتفاصيل الاحترافية المستنتجة.
2. فقط إذا كان النقص جوهرياً ولا يمكن استنتاجه بثقة (مثل: تناقض صريح بالطلب، أو طلب برمجي هائل غير محدد النطاق مثل "ابني فيسبوك كامل"، أو طلب حوار صوتي يفتقر لأسطر المتحدثين) صنّف الحالة needs_clarification وصِغ سؤالاً توضيحياً مهذباً ومباشراً في حقل clarificationQuestion بصوت ناجي المعتاد دون ذكر أي مصطلحات داخلية أو مجالس.
3. مهمتك جودة إبداعية ومعمارية وهيكلية.`;

  return `${NAJE_CORE_IDENTITY_SHARED}\n\n---\n\n${buildPersonaInstruction('الناقد', personaCore)}`;
}
