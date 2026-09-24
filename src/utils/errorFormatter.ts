/**
 * Smart Error Formatter for Naje AI
 * Analyzes technical, API, and network errors in the background and converts them
 * into polished, formal, and authoritative Arabic responses.
 * Implements a collapsable technical detail log for developers/support.
 */

import { GoogleGenAI } from '@google/genai';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createGenAIClient } from '../lib/genaiClient';
import { t } from '../i18n';
import { useAppStore } from '../store';
import type { SupportedLocale } from '../i18n';

export interface FormattedError {
  title: string;
  emoji: string;
  icon?: string;
  intro: string;
  explanation: string;
  solutions: string[];
  kind?: string;
}

function ui(key: string, params?: Record<string, string | number>): string {
  const locale = (useAppStore.getState().language || 'ar') as SupportedLocale;
  return t(key, params, locale);
}

function errPack(kind: string, emoji: string, icon = emoji): FormattedError {
  return {
    kind,
    title: ui(`chatui.err.${kind}.title`),
    emoji,
    icon,
    intro: ui(`chatui.err.${kind}.intro`),
    explanation: ui(`chatui.err.${kind}.explanation`),
    solutions: [ui(`chatui.err.${kind}.s1`), ui(`chatui.err.${kind}.s2`), ui(`chatui.err.${kind}.s3`)],
  };
}

export function parseAndCategorizeErrorSync(errorStr: string): FormattedError {
  console.error('[Naje Error - Raw]', errorStr);

  const normalized = errorStr.toLowerCase();

  // 1. Quota Exceeded / Rate Limit
  if (
    normalized.includes("quota") ||
    normalized.includes("rate limit") ||
    normalized.includes("resource_exhausted") ||
    normalized.includes("429") ||
    normalized.includes("exceeded your current quota") ||
    normalized.includes("limit exceeded")
  ) {
    console.error('[Naje Error - Classified as: quota]', errorStr);
    return errPack('quota', 'quota');
  }

  // 2. Safety block / Flagged Content
  if (
    normalized.includes("safety") ||
    normalized.includes("block") ||
    normalized.includes("harmful") ||
    normalized.includes("flagged") ||
    normalized.includes("unacceptable") ||
    normalized.includes("حظر") ||
    normalized.includes("مخالفته") ||
    normalized.includes("فحص أمني") ||
    normalized.includes("الفحص الأمني")
  ) {
    console.error('[Naje Error - Classified as: safety]', errorStr);
    return errPack('safety', 'shield');
  }

  // 2.5 Security / Permission Denied / Firestore Rules / Billing
  if (
    normalized.includes("permission_denied") ||
    normalized.includes("permission") ||
    normalized.includes("unauthorized") ||
    normalized.includes("403") ||
    normalized.includes("denied access") ||
    normalized.includes("billing") ||
    normalized.includes("requires billing") ||
    normalized.includes("صلاحيات") ||
    normalized.includes("غير مصرح")
  ) {
    console.error('[Naje Error - Classified as: permission]', errorStr);
    return errPack('permission', 'warning');
  }

  // 3. Balance Insufficient / Points
  if (
    (normalized.includes("balance") ||
     normalized.includes("insufficient") ||
     normalized.includes("غير كاف") ||
     normalized.includes("لا يغطي") ||
     normalized.includes("402")) && 
    !normalized.includes("permission") && 
    !normalized.includes("403") &&
    !normalized.includes("فشل خصم") &&
    !normalized.includes("خصم الرصيد") &&
    !normalized.includes("تحديث الرصيد")
  ) {
    console.error('[Naje Error - Classified as: balance]', errorStr);
    return errPack('balance', 'wallet');
  }

  // 4. File error / bad attached files (must specifically refer to uploaded/attached files, not output files)
  if (
    normalized.includes("unsupported file format") ||
    normalized.includes("corrupt file") ||
    normalized.includes("invalid uploaded file") ||
    normalized.includes("file size exceeds") ||
    normalized.includes("ملف مرفق") ||
    normalized.includes("الملفات المرفقة") ||
    normalized.includes("تنسيق الملف المرفوع") ||
    normalized.includes("حجم الملف المرفوع") ||
    (normalized.includes("uploaded file") && (normalized.includes("corrupt") || normalized.includes("invalid") || normalized.includes("unsupported")))
  ) {
    console.error('[Naje Error - Classified as: file]', errorStr);
    return errPack('file', 'folder');
  }

  // 4.5 Document Generation Error / Output generation failure
  if (
    normalized.includes("تعذر إنشاء الملف") ||
    normalized.includes("تعذّر إنشاء الملف") ||
    normalized.includes("توليد المستند") ||
    normalized.includes("إنشاء المستند") ||
    normalized.includes("docx_corrupt") ||
    normalized.includes("pptx_corrupt") ||
    normalized.includes("pdf_corrupt") ||
    normalized.includes("empty pdf")
  ) {
    console.error('[Naje Error - Classified as: doc_generation]', errorStr);
    return errPack('doc', 'document');
  }

  // 5. Network Timeout / Server Outage / API Connection failure
  if (
    normalized.includes("timeout") ||
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("connect") ||
    normalized.includes("502") ||
    normalized.includes("503") ||
    normalized.includes("504") ||
    normalized.includes("529") ||
    normalized.includes("cloud") ||
    normalized.includes("overloaded") ||
    normalized.includes("retryable") ||
    normalized.includes("unavailable")
  ) {
    console.error('[Naje Error - Classified as: network]', errorStr);
    return errPack('network', 'globe');
  }

  // 5.5 Model Stream Interruption / Read Failure / High Demand
  if (
    normalized.includes("تعذّر قراءة رد النموذج") ||
    normalized.includes("قراءة رد النموذج") ||
    normalized.includes("تعذّر إنشاء الملف") ||
    normalized.includes("تعذّر إكمال استجابة النموذج") ||
    normalized.includes("high demand") ||
    normalized.includes("spikes in demand") ||
    normalized.includes("stream ended") ||
    normalized.includes("empty response")
  ) {
    console.error('[Naje Error - Classified as: model_stream_interrupted]', errorStr);
    return errPack('stream', 'cpu');
  }

  // 6. General / Unknown Technical Error
  console.error('[Naje Error - Classified as: unclassified]', errorStr);
  return errPack('unknown', 'gear');
}

async function getModelEndpointIdClient(endpointId: string, defaultFallback: string): Promise<string> {
  try {
    const snap = await Promise.race([
      getDoc(doc(db, 'model_endpoints', endpointId)),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000))
    ]);
    if (snap && snap.exists() && snap.data()?.modelId) {
      return String(snap.data()!.modelId).trim();
    }
  } catch {
    // fallback
  }
  return defaultFallback;
}

async function generateSmartErrorExplanation(
  rawError: string,
  context?: { chatType?: string; actionAttempted?: string }
): Promise<{ title: string; explanation: string } | null> {
  try {
    const ai = createGenAIClient();
    const modelId = await getModelEndpointIdClient('text_lite', 'gemini-3.5-flash-lite');

    const prompt = `أنت مساعد داخلي في ناجي AI مهمتك كتابة شرح قصير وصادق وودود
باللهجة العربية الاحترافية (بدون رسمية جافة) لمستخدم واجه خطأ تقنياً، بناءً
على رسالة الخطأ التقنية الخام التالية. لا تخترع سبباً غير مذكور بالخطأ، ولا
تستخدم مصطلحات تقنية معقدة، ولا تُلقِ اللوم على المستخدم.

نوع الطلب: ${context?.chatType || 'غير محدد'}
ماذا كان يحاول المستخدم فعله: ${context?.actionAttempted || 'غير محدد'}
رسالة الخطأ التقنية الخام:
"""
${rawError.slice(0, 2000)}
"""

أجب بصيغة JSON فقط بلا أي نص إضافي، بالشكل التالي:
{"title": "عنوان قصير من 3-5 كلمات", "explanation": "شرح من جملتين إلى ثلاث جمل"}`;

    const response = await Promise.race([
      ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: { maxOutputTokens: 600, temperature: 0.3, responseMimeType: "application/json" },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);

    const text = response.text || '';
    const cleanedText = text.replace(/```json|```/g, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    const targetJson = jsonMatch ? jsonMatch[0] : cleanedText;
    const parsed = JSON.parse(targetJson);
    if (parsed && typeof parsed.title === 'string' && typeof parsed.explanation === 'string') {
      return {
        title: parsed.title,
        explanation: parsed.explanation,
      };
    }
    return null;
  } catch (e) {
    console.warn('[Smart Error Explanation] Failed, falling back to static template:', e);
    return null;
  }
}

export async function parseAndCategorizeError(
  errorStr: string,
  context?: { chatType?: string; actionAttempted?: string }
): Promise<FormattedError> {
  const cat = parseAndCategorizeErrorSync(errorStr);

  // Apply smart explanation for 'file' and 'unclassified' categories only
  if (cat.kind === 'file' || cat.kind === 'unknown') {
    const smart = await generateSmartErrorExplanation(errorStr, context);
    if (smart) {
      return {
        ...cat,
        title: smart.title,
        intro: smart.explanation,
        explanation: smart.explanation,
      };
    }
  }

  return cat;
}

export async function formatProfessionalError(
  errorInput: any,
  context?: { chatType?: string; actionAttempted?: string }
): Promise<string> {
  let errorStr = "";
  if (!errorInput) {
    errorStr = "Unknown error";
  } else if (typeof errorInput === "string") {
    errorStr = errorInput;
  } else if (errorInput instanceof Error) {
    errorStr = errorInput.message;
  } else {
    try {
      errorStr = JSON.stringify(errorInput);
    } catch {
      errorStr = String(errorInput);
    }
  }

  const cat = await parseAndCategorizeError(errorStr, context);

  return `__NAJE_ERROR_JSON__:${JSON.stringify({
    title: cat.title,
    emoji: cat.emoji,
    intro: cat.intro,
    explanation: cat.explanation,
    solutions: cat.solutions,
    errorStr: errorStr
  })}`;
}

