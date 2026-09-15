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

export interface FormattedError {
  title: string;
  emoji: string;
  icon?: string;
  intro: string;
  explanation: string;
  solutions: string[];
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
    return {
      title: "تجاوز الحد الأقصى للمعدل الزمني للطلبات (حصص الاستخدام)",
      emoji: "quota",
      icon: "quota",
      intro: "نعتذر منك؛ لقد تم تجاوز الحد الأقصى المسموح به لمعدل تكرار الطلبات أو الحصة المخصصة حالياً لخدمة الذكاء الاصطناعي.",
      explanation: "تضع خوادم المعالجة السحابية حدوداً زمنية تلقائية لعدد الطلبات في الدقيقة الواحدة لضمان عدالة الاستخدام وثبات الأداء لجميع المستخدمين في نفس الوقت.",
      solutions: [
        "الانتظار لمدة دقيقة أو دقيقتين قبل محاولة إعادة إرسال طلبك.",
        "تبسيط صياغة طلبك الحالي أو تقليص حجم المرفقات إن وُجدت.",
        "ترقية الحساب أو الاشتراك للحصول على أولوية في سرعة الخوادم وحصص تشغيل أعلى."
      ]
    };
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
    return {
      title: "إرشادات حماية المحتوى والسياسات الآمنة",
      emoji: "shield",
      icon: "shield",
      intro: "عذراً؛ لم نتمكن من إتمام العملية نظراً لتعارض صياغة الطلب أو المحتوى المولد مع إرشادات الأمان الرقمي وسياسات الاستخدام لدينا.",
      explanation: "يعمل نظام فلترة المحتوى الآلي في الخلفية على حماية المستخدمين ومنع توليد محتوى قد يندرج تحت تصنيفات غير ملائمة، أو يتناول مواضيع حساسة للغاية، أو يخرق حقوق النشر والعلامات التجارية.",
      solutions: [
        "إعادة كتابة طلبك بأسلوب أكثر موضوعية واحترافية وبدون عبارات ملتبسة.",
        "تجنب الكلمات أو المواضيع التي قد تُفسر بشكل خاطئ من قِبل فلاتر الأمان التلقائية.",
        "التأكد من أن الصور أو النصوص المرفقة متوافقة مع شروط الخدمة العامة."
      ]
    };
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
    return {
      title: "توقف مؤقت في الخدمة",
      emoji: "warning",
      icon: "warning",
      intro: "يا هلا بك.. يبدو أن هناك تحديثات داخلية أو ضغط مؤقت منعنا من إتمام طلبك بنجاح.",
      explanation: "عادة ما يظهر هذا الإشعار بسبب وصولنا للحد الأقصى للاستخدام أو وجود الصيانة والتحديثات على سيرفرات الذكاء الاصطناعي.",
      solutions: [
        "جرب تحدث الصفحة وتطلب من جديد بعد شوي.",
        "تأكد من اتصالك بالإنترنت.",
        "إذا استمرت المشكلة، لا تتردد وتواصل مع دعم ناجي الفني عبر الواتس آب."
      ]
    };
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
    return {
      title: "رصيد النقاط المتاح غير كافٍ للعملية",
      emoji: "wallet",
      icon: "wallet",
      intro: "تنبيه: رصيد النقاط الحالي المتوفر في حسابكم لا يغطي تكلفة تنفيذ هذا الطلب الإبداعي.",
      explanation: "تتطلب عمليات المعالجة المتقدمة (مثل التصميم عالي الدقة، تحرير وتوليد مقاطع الفيديو، أو تجميع المستندات الاحترافية الشاملة) استهلاك نقاط محددة تغطي تكلفة الحوسبة السحابية الفائقة المستخدمة.",
      solutions: [
        "التحقق من التكلفة التقريبية للعملية الموضحة في لوحة الإعدادات وتكييف حجم العمل.",
        "شحن رصيد حسابك بمزيد من النقاط فوراً من خلال صفحة الدفع والاشتراكات.",
        "استخدام النماذج الأساسية أو تقليص عدد الصفحات والشرائح لتقليل التكلفة."
      ]
    };
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
    return {
      title: "صعوبة في معالجة الملفات المرفقة",
      emoji: "folder",
      icon: "folder",
      intro: "واجه النظام صعوبة تقنية أثناء محاولة فحص أو قراءة الملفات المرفقة بطلبك.",
      explanation: "قد يكون الملف المرفوع تالفاً، أو بتنسيق غير متوافق مع خوارزميات التحليل المعتمدة، أو يتجاوز الحجم الأقصى المسموح به للملف الواحد.",
      solutions: [
        "التأكد من رفع ملفات بتنسيقات قياسية مدعومة مثل (PDF, DOCX, PPTX للوثائق) أو (JPG, PNG للصور).",
        "التحقق من أن الملف ليس محمياً بكلمة مرور أو تالفاً على جهازك.",
        "تقليص حجم الملفات الكبيرة لتسهيل رفعها ومعالجتها سحابياً."
      ]
    };
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
    return {
      title: "تعذر إكمال معالجة المستند المطلوب",
      emoji: "document",
      icon: "document",
      intro: "لم نتمكن من تجميع ملف المستند النهائي، ولم يتم خصم أي نقاط من رصيدك إطلاقاً.",
      explanation: "قد يحدث هذا في حال كانت صياغة الطلب موجزة للغاية، أو عند حدوث انقطاع مؤقت أثناء تجميع صفحات أو شرائح الملف في الخادم.",
      solutions: [
        "إعادة إرسال الطلب مع توضيح موضوع وعناصر المستند بشكل أكثر تفصيلاً.",
        "تجربة اختيار صيغة أخرى (مثل شرائح PDF أو مستند Word) أو تقليل عدد الشرائح.",
        "التأكد من وضوح النصوص في حال إرفاق مستندات مرجعية."
      ]
    };
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
    return {
      title: "انقطاع مؤقت في الاتصال بالخوادم السحابية",
      emoji: "globe",
      icon: "globe",
      intro: "نواجه حالياً تأخيراً أو انقطاعاً مؤقتاً في قنوات الاتصال بالخوادم المركزية للذكاء الاصطناعي.",
      explanation: "قد يحدث هذا بشكل عارض نتيجة تذبذب اتصال الشبكة أو وجود صيانة وتحديثات على البنية التحتية السحابية لشركائنا من مزودي الخدمات الفائقة.",
      solutions: [
        "التحقق من جودة واستقرار اتصال الإنترنت الخاص بك حالياً.",
        "الانتظار لبضع ثوانٍ ثم الضغط على زر إعادة الإرسال.",
        "تحديث الصفحة لتجديد جلسة الاتصال الآمنة والمحاولة مرة أخرى."
      ]
    };
  }

  // 6. General / Unknown Technical Error
  console.error('[Naje Error - Classified as: unclassified]', errorStr);
  return {
    title: "عارض فني غير متوقع",
    emoji: "gear",
    icon: "gear",
    intro: "نأسف بشدة؛ واجه نظام المعالجة السحابي صعوبة فنية غير متوقعة أثناء معالجة طلبك.",
    explanation: "حدث هذا بسبب خطأ غير مبرمج في مصفوفة المعالجة. لقد تم تسجيل هذا العارض وإرساله تلقائياً إلى نظام تتبع الأخطاء البرمجية لمراجعته من قبل فريق التطوير والدعم الفني لدينا.",
    solutions: [
      "تحديث متصفحك وإعادة صياغة الطلب بشكل مبسط.",
      "تجنب إرسال طلبات متعددة بسرعة فائقة لمنع تجميد الجلسة.",
      "في حال استمرار المشكلة، يرجى إرسال لقطة شاشة وتفاصيل الخطأ إلى مركز الدعم الفني."
    ]
  };
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
  if (cat.title === "صعوبة في معالجة الملفات المرفقة" || cat.title === "عارض فني غير متوقع") {
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

