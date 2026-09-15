import { GoogleGenAI } from '@google/genai';
import { OUTPUT_TOKEN_LIMITS } from './modelRegistry';
import { getOrCreateExplicitCache, getCriticCachedInstruction } from './geminiCaching';
import { getNajeModel, resolveEngineModel } from './modelEnvConfig';

const PERSONAS_MODEL = () => resolveEngineModel(getNajeModel('personas'));

/**
 * Dynamic Hybrid Thinking Configuration Helper
 * Branches on model family:
 * - Gemini 3.0+ uses `thinkingLevel: 'high'` (Gemini 3 uses thinkingLevel, raising ceiling for audit-depth tasks).
 */
export function getThinkingConfig(modelId: string): Record<string, any> {
  if (modelId.startsWith('gemini-3')) {
    return { thinkingConfig: { thinkingLevel: 'high' } };
  }
  return {};
}

/**
 * Shared Persona System Instruction Builder
 * Enforces the strict confidentiality directive and the non-negotiable closing line across all personas.
 */
export function buildPersonaInstruction(personaName: string, personaCore: string): string {
  return `أنت ${personaName} في مجلس عقول ناجي — طبقة تفكير داخلية غير مرئية، لا تُذكر هويتك أو وجودك لأي مستخدم أبداً تحت أي ظرف.
${personaCore}
اعمل بأقصى درجات العناية المركزة وبأعلى معايير الدقة والجودة والكفاءة.`;
}

/**
 * المصمم (The Designer)
 * Council of Minds' seventh member — Data Visualization & Infographic Designer.
 */
export function buildDesignerInstruction(): string {
  return buildPersonaInstruction('المصمم', `أنت خبير تصميم بيانات (Data Visualization Designer) محترف. مهمتك تحويل معلومات أو أرقام أو مقارنات
إلى تسلسل بصري واضح ومباشر — لا فقرات نصية طويلة، بل عناصر بصرية موجزة (أرقام بارزة، مقارنات جنباً إلى جنب،
خطوات متسلسلة، رسوم بيانية دائرية وتوزيعية). فكّر كمصمم إنفوجرافيك حقيقي: ما أهم 3-5 نقاط يستحقها هذا المحتوى بصرياً؟
ما أفضل تنسيق بصري لكل نقطة؟ إذا طلب المستخدم أو ترك الأمر لك لدمج الأنماط، اختر الهيكل الهجين الذكي (Mixed Hybrid) وادمج بتناغم رفيع بين الإحصائيات والمقارنات والمخططات. احرص على اختيار أو تفعيل الثيم اللوني المتناسق المطلوب (مثل: الفاخر الداكن، السايبر نيون، الأزرق المحيطي، الزمردي، أو الأبيض الأنيق). اعمل بأقصى درجات العناية المركزة وبأعلى معايير الدقة والجودة والكفاءة.`);
}

export interface CriticReviewResult {
  verdict: 'proceed' | 'proceed_with_notes' | 'needs_clarification';
  issues: string[];
  suggestedFixes: string[];
  enrichedPrompt: string;
  clarificationQuestion?: string;
}

/**
 * الناقد (The Critic)
 * Fast pre-generation review layer before any generation begins.
 * Catches ambiguities, contradictions, and missing context, repairing them where obvious.
 */
export async function criticReviewRequest(
  ai: any,
  rawPrompt: string,
  generationType: 'image' | 'video' | 'document' | 'code' | 'voice',
  brandContext?: any
): Promise<CriticReviewResult> {
  const personaCore = `مهمتك: فحص الطلب بدقة شديدة قبل أي إنتاج فعلي، واكتشاف أي غموض أو تناقض أو نقص بالسياق قد يضعف جودة النتيجة النهائية، واقتراح حلول واضحة ومحددة.

قواعد صارمة:
1. لا ترفض طلبات غامضة — أصلحها بنفسك حيثما كان الإصلاح واضحاً ومنطقياً وعزّز البرومبت (enrichedPrompt) بالتفاصيل الاحترافية المستنتجة.
2. فقط إذا كان النقص جوهرياً ولا يمكن استنتاجه بثقة (مثل: تناقض صريح بالطلب، أو طلب برمجي هائل غير محدد النطاق مثل "ابني فيسبوك كامل"، أو طلب حوار صوتي يفتقر لأسطر المتحدثين) صنّف الحالة needs_clarification وصِغ سؤالاً توضيحياً مهذباً ومباشراً في حقل clarificationQuestion بصوت ناجي المعتاد دون ذكر أي مصطلحات داخلية أو مجالس.
3. مهمتك جودة إبداعية ومعمارية وهيكلية.`;

  const systemInstruction = buildPersonaInstruction('الناقد', personaCore);

  const reviewPrompt = `فحص طلب توليد (${generationType}):
نص الطلب: "${rawPrompt}"
سياق البراند (إن وجد): ${JSON.stringify(brandContext || {})}

أخرج JSON مطابق تماماً للهيكل التالي:
{
  "verdict": "proceed" | "proceed_with_notes" | "needs_clarification",
  "issues": ["وصف المشكلة الأولى إن وجدت"],
  "suggestedFixes": ["الحل المقترح المحدد"],
  "enrichedPrompt": "البرومبت المحسن والمُصلح والمُعزز بالتفاصيل الدقيقة ليمر للمرحلة التالية",
  "clarificationQuestion": "سؤال توضيحي لطيف ومباشر للمستخدم فقط إذا كان verdict هو needs_clarification"
}`;

  try {
    const personasModel = PERSONAS_MODEL();
    const cachedCriticContent = await getOrCreateExplicitCache(
      ai,
      'critic_persona',
      personasModel,
      getCriticCachedInstruction(),
      7200
    );

    const configPayload: any = { 
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.criticReview,
      responseMimeType: "application/json",
      temperature: 0.2,
      ...getThinkingConfig(personasModel)
    };

    if (cachedCriticContent) {
      configPayload.cachedContent = cachedCriticContent;
    }

    const res = await ai.models.generateContent({
      model: personasModel,
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\n${reviewPrompt}` }] }
      ],
      config: configPayload
    });

    if (res.usageMetadata?.cachedContentTokenCount) {
      console.log(`[Critic Cache Hit] Explicit/Implicit cache saved ${res.usageMetadata.cachedContentTokenCount} prompt tokens`);
    }

    const parsed = JSON.parse(res.text || '{}');
    return {
      verdict: parsed.verdict || 'proceed',
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      suggestedFixes: Array.isArray(parsed.suggestedFixes) ? parsed.suggestedFixes : [],
      enrichedPrompt: (parsed.enrichedPrompt && parsed.enrichedPrompt.trim()) ? parsed.enrichedPrompt.trim() : rawPrompt,
      clarificationQuestion: parsed.clarificationQuestion
    };
  } catch (err) {
    console.warn('[Critic] Fast review fallback:', err);
    return {
      verdict: 'proceed',
      issues: [],
      suggestedFixes: [],
      enrichedPrompt: rawPrompt
    };
  }
}

/**
 * القائد (The Commander)
 * Lightweight routing & context orchestrator.
 * Determines the primary persona, critic requirement, and web grounding heuristic.
 */
export async function commanderRoute(
  generationType: string,
  request: any
): Promise<{
  persona: 'photographer' | 'producer' | 'writer' | 'programmer' | 'soundEngineer' | 'designer';
  needsCritic: boolean;
  needsWebSearch: boolean;
}> {
  let persona: 'photographer' | 'producer' | 'writer' | 'programmer' | 'soundEngineer' | 'designer' = 'photographer';
  
  if (generationType === 'image' || generationType === 'logo' || generationType === 'brand_identity' || generationType === 'image_studio') {
    persona = 'photographer';
  } else if (generationType === 'video' || generationType === 'video_director') {
    persona = 'producer';
  } else if (generationType === 'document' || generationType === 'slides' || generationType === 'document_architect') {
    persona = 'writer';
  } else if (generationType === 'code' || generationType === 'fullstack_engineer' || generationType === 'naje-agent-core' || generationType === 'al-nassaj') {
    persona = 'programmer';
  } else if (generationType === 'voice' || generationType === 'voice_narration' || generationType === 'audio') {
    persona = 'soundEngineer';
  } else if (generationType === 'infographic' || generationType === 'infographic_designer' || generationType === 'designer') {
    persona = 'designer';
  }

  // Web search heuristic: brand names, recent trends, market benchmarks
  const promptText = typeof request === 'string' ? request : (request?.prompt || request?.userPrompt || '');
  const searchKeywords = ['تريند', 'أحدث', 'سوق', 'مقارنة', 'منافس', 'أسعار', 'مكتبة', 'framework', 'api', 'trend', 'latest', 'current', '2026', '2025'];
  const needsWebSearch = searchKeywords.some(kw => promptText.toLowerCase().includes(kw));

  return {
    persona,
    needsCritic: true,
    needsWebSearch
  };
}

/**
 * الكاتب (The Writer) — Voice Fingerprint Extractor
 * Extracts authorial style, sentence rhythm, and vocabulary register from Chapter 1
 * to enforce consistent prose style across all subsequent document chunks.
 */
export async function extractVoiceFingerprint(ai: any, firstChapterHtmlOrText: string): Promise<string> {
  if (!firstChapterHtmlOrText || firstChapterHtmlOrText.length < 50) {
    return 'أسلوب فصيح، متزن، رصين وإيقاعي، يجمع بين الدقة والجمالية اللغوية.';
  }

  const personaCore = `مهمتك: تحليل البصمة الأسلوبية (Voice Fingerprint) للفصل الأول واستخراج قواعد النبرة، إيقاع الجمل، معجم المفردات، والمصطلحات المميزة في 2-3 أسطر مكثفة لتطبيقها بدقة متناهية على بقية الفصول.`;
  const systemInstruction = buildPersonaInstruction('الكاتب', personaCore);

  try {
    const res = await ai.models.generateContent({
      model: PERSONAS_MODEL(),
      contents: [
        { 
          role: 'user', 
          parts: [{ 
            text: `${systemInstruction}\n\nحلل البصمة الأسلوبية لهذا النص:\n"""${firstChapterHtmlOrText.slice(0, 1500)}"""\n\nأخرج فقرة وصفية موجزة ومحددة (2-3 جمل) للبصمة اللفظية والنبرة.` 
          }] 
        }
      ],
      config: { 
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.criticReview,
        temperature: 0.3 
      }
    });

    return res.text?.trim() || 'أسلوب فصيح، متزن، رصين وإيقاعي، يجمع بين الدقة والجمالية اللغوية.';
  } catch (err) {
    return 'أسلوب فصيح، متزن، رصين وإيقاعي، يجمع بين الدقة والجمالية اللغوية.';
  }
}

/**
 * مهندس الصوت (The Sound Engineer) — Voice Matching Reasoner
 * Chooses the best matching voice from available voices based on script tone and brand identity.
 */
export async function reasonBestVoice(
  ai: any,
  scriptText: string,
  brandContext?: any,
  availableVoices: string[] = ['Fenrir', 'Aoede', 'Puck', 'Charon', 'Kore']
): Promise<string> {
  const personaCore = `مهمتك: اختيار الصوت الأنسب من قائمة الأصوات المتاحة بناءً على طبيعة النص وسيكولوجية العلامة والنبرة المستهدفة.`;
  const systemInstruction = buildPersonaInstruction('مهندس الصوت', personaCore);

  const voiceCharacteristics = `الأصوات المتاحة:
- Fenrir: صوت رجالي عميق وفخم، مهيب، مناسب للعطور والسيارات والوثائقيات والشركات الكبرى.
- Aoede: صوت نسائي دافئ وأنيق، جذاب ورخيم، مناسب للأزياء والجمال والضيافة والتطبيقات الحياتية.
- Puck: صوت شبابي متفاعل، مفعم بالطاقة والحيوية والابتكار، مناسب للتقنية والشركات الناشئة والألعاب.
- Charon: صوت جهوري رزِن وثابت، مناسب للأخبار والبيانات الرسمية والمال والأعمال.
- Kore: صوت هادئ وناعم ومطمئن، مناسب للصحة والتأمل والتعليم والاستشارات.`;

  try {
    const res = await ai.models.generateContent({
      model: PERSONAS_MODEL(),
      contents: [
        {
          role: 'user',
          parts: [{
            text: `${systemInstruction}\n\n${voiceCharacteristics}\n\nالنص الصوتي المراد تسجيله:\n"${scriptText}"\n\nسياق العلامة: ${JSON.stringify(brandContext || {})}\n\nأخرج JSON فقط: {"selectedVoice": "<اسم الصوت من القائمة المتاحة فقط>", "reasoning": "سبب الاختيار"}`
          }]
        }
      ],
      config: { 
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.criticReview,
        responseMimeType: "application/json" 
      }
    });

    const parsed = JSON.parse(res.text || '{}');
    if (parsed.selectedVoice && availableVoices.includes(parsed.selectedVoice)) {
      return parsed.selectedVoice;
    }
    return availableVoices[0] || 'Fenrir';
  } catch (err) {
    return 'Fenrir';
  }
}

export interface DialogueTurn {
  speaker: string;
  voice: string;
  text: string;
}

/**
 * مهندس الصوت (The Sound Engineer) — Multi-Speaker Dialogue Parser
 * Detects if the request contains a dialogue, assigns distinct voices, and parses exact speaker turns without altering words.
 */
export async function detectAndParseDialogue(
  ai: any,
  rawText: string,
  brandContext?: any
): Promise<{ isDialogue: boolean; speakers: string[]; turns: DialogueTurn[] }> {
  const personaCore = `مهمتك: فحص ما إذا كان النص يمثل حواراً بين شخصيتين.

قيد صارم يجب مراعاته دائماً: منصة التوليد الصوتي تدعم صوتين مختلفين فقط بالحوار الواحد — هذا حد تقني ثابت من مزوّد الخدمة، ليس قيداً مؤقتاً. إذا وصف طلب المستخدم حواراً بين أكثر من شخصين، لا تحاول توليد أكثر من صوتين؛ اختر الشخصيتين الأكثر مركزية بالحوار ومثّل البقية سردياً، أو أرسل الطلب لمسار التوضيح (الناقد) لطلب تبسيط الحوار لشخصين إذا كان الفرق جوهرياً لسياق الطلب.

إذا كان حواراً:
1. استخرج أدوار المتحدثين بدقة (بحد أقصى شخصيتين مركزيتين).
2. عيّن صوتاً مختلفاً ومناسباً لكل متحدث من قائمة الأصوات: [Fenrir, Aoede, Puck, Charon, Kore] — يمنع منعاً باتاً تعيين نفس الصوت لشخصيتين مختلفتين في الحوار.
3. قسّم النص إلى جولات حوارية متتابعة محتفظاً بالكلمات الأصلية تماماً دون تأليف أو تغيير.`;

  const systemInstruction = buildPersonaInstruction('مهندس الصوت', personaCore);

  try {
    const res = await ai.models.generateContent({
      model: PERSONAS_MODEL(),
      contents: [
        {
          role: 'user',
          parts: [{
            text: `${systemInstruction}\n\nالنص المطلوب تحليله:\n"${rawText}"\n\nأخرج JSON مطابق تماماً للهيكل التالي:
{
  "isDialogue": true | false,
  "speakers": ["اسم المتحدث الأول", "اسم المتحدث الثاني"],
  "turns": [
    {
      "speaker": "اسم المتحدث",
      "voice": "اسم الصوت من (Fenrir, Aoede, Puck, Charon, Kore)",
      "text": "النص الصافي الدقيق لهذا المتحدث"
    }
  ]
}`
          }]
        }
      ],
      config: { 
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.voiceScript,
        responseMimeType: "application/json" 
      }
    });

    const parsed = JSON.parse(res.text || '{}');
    if (parsed.isDialogue && Array.isArray(parsed.turns) && parsed.turns.length > 1) {
      // Ensure distinct voices if 2 speakers got assigned identical voice
      const usedVoices = new Set<string>();
      const fallbackList = ['Fenrir', 'Aoede', 'Puck', 'Charon', 'Kore'];
      
      const sanitizedTurns: DialogueTurn[] = parsed.turns.map((turn: any, idx: number) => {
        let voice = turn.voice || fallbackList[idx % fallbackList.length];
        return {
          speaker: turn.speaker || `متحدث ${idx + 1}`,
          voice,
          text: turn.text || ''
        };
      });

      // Fix any duplicates across distinct speakers
      const speakerVoiceMap = new Map<string, string>();
      sanitizedTurns.forEach(t => {
        if (!speakerVoiceMap.has(t.speaker)) {
          let assigned = t.voice;
          if (usedVoices.has(assigned)) {
            const available = fallbackList.find(v => !usedVoices.has(v));
            if (available) assigned = available;
          }
          usedVoices.add(assigned);
          speakerVoiceMap.set(t.speaker, assigned);
        }
        t.voice = speakerVoiceMap.get(t.speaker)!;
      });

      return {
        isDialogue: true,
        speakers: parsed.speakers || Array.from(speakerVoiceMap.keys()),
        turns: sanitizedTurns
      };
    }

    return { isDialogue: false, speakers: [], turns: [] };
  } catch (err) {
    console.warn('[SoundEngineer] Dialogue detection fallback:', err);
    return { isDialogue: false, speakers: [], turns: [] };
  }
}
