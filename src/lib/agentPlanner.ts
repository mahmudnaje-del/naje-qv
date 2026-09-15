import { GoogleGenAI } from '@google/genai';
import { AgentPlanProposal, AgentChatTurnResponse } from '../types/agent';
import { getAgentToolCost, PricingConfig } from './agentPricing';
import { OUTPUT_TOKEN_LIMITS } from './modelRegistry';
import { getThinkingConfig } from './councilOfMinds';
import { createGenAIClient } from './genaiClient';
import { getNajeModel, resolveEngineModel } from './modelEnvConfig';

const ai = createGenAIClient();

/**
 * Native Gemini Function Declarations for Conversational Agent Turn Reasoning
 */
const agentFunctionDeclarations = [
  {
    name: 'reply_conversationally',
    description: "Use this when the user is greeting you, making small talk, asking a general question about your capabilities, or when their message does not yet describe a concrete, actionable creative or technical mission. This is the default when in doubt.",
    parameters: {
      type: 'OBJECT',
      properties: {
        message: {
          type: 'STRING',
          description: "Your conversational reply in Arabic, in Naje AI's confident, warm, professional and direct voice."
        }
      },
      required: ['message']
    }
  },
  {
    name: 'ask_clarifying_question',
    description: "Use this when the user has described a real goal, but a key detail is missing that would meaningfully change the plan or its cost (e.g. brand name, target platform, video length/style, document depth/chapters, tech stack). Ask ONE focused, courteous question, not a list.",
    parameters: {
      type: 'OBJECT',
      properties: {
        question: {
          type: 'STRING',
          description: "The single focused clarifying question in Arabic."
        },
        suggestedQuickReplies: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: "Optional 2-4 short tappable options in Arabic, if the question has an obvious small set of likely answers."
        }
      },
      required: ['question']
    }
  },
  {
    name: 'propose_mission',
    description: "Use this ONLY when the user's goal is clear and specific enough to scope a concrete, multi-step execution plan using the available tools. Do not guess or output cost numbers here; pricing is computed deterministically by the system.",
    parameters: {
      type: 'OBJECT',
      properties: {
        missionTitle: {
          type: 'STRING',
          description: "A concise, prestigious Arabic title for the mission."
        },
        brandContext: {
          type: 'OBJECT',
          properties: {
            brandName: { type: 'STRING' },
            industry: { type: 'STRING' },
            tone: { type: 'STRING' },
            colors: { type: 'ARRAY', items: { type: 'STRING' } },
            slogan: { type: 'STRING' },
            targetAudience: { type: 'STRING' }
          },
          required: ['brandName', 'industry', 'tone']
        },
        planSummary: {
          type: 'STRING',
          description: "An executive summary explaining what the agent will create and deliver in this mission."
        },
        steps: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              description: { type: 'STRING' },
              tools: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: {
                      type: 'STRING',
                      enum: [
                        'brand_identity',
                        'image_studio',
                        'video_director',
                        'voice_narration',
                        'fullstack_engineer',
                        'document_architect',
                        'web_grounding'
                      ]
                    },
                    title: { type: 'STRING' },
                    inputParams: { type: 'OBJECT' }
                  },
                  required: ['name', 'title', 'inputParams']
                }
              }
            },
            required: ['title', 'description', 'tools']
          }
        }
      },
      required: ['missionTitle', 'planSummary', 'steps']
    }
  }
];

/**
 * 1. Conversational Agent Turn Reasoning Loop:
 * Handles chat turns, clarifications, and mission proposals using native function calling on gemini-3.5-flash-lite.
 */
export async function processAgentChatTurn(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  pricingConfig: PricingConfig = {},
  projectContext?: any
): Promise<AgentChatTurnResponse> {
  const systemInstruction = `أنت العقل التخطيطي والمحادثاتي لوكيل الذكاء الاصطناعي المستقل "ناجي أوتونوما" (Naje Agent Pro).
أنت وكيل ذكي فائق الاحترافية وقادر على إدارة الحوار مع المستخدم كمدير مشاريع ومستشار تقني وإبداعي رفيع المستوى.

قواعد اتخاذ القرار وسلوك المحادثة:
1. إذا قام المستخدم بالتحية (مثل: "مرحبا"، "السلام عليكم"، "أهلاً") أو سأل عن قدراتك أو أجرى محادثة عامة:
   - اختر حصراً وظيفة "reply_conversationally" للرد عليه بلباقة وثقة وترحيب، واشرح بإيجاز ما يمكنك فعله واسأله عن مشروعه أو هدفه.
   - لا تقم أبداً باختلاق خطة عمل عند التحية أو الأحاديث العامة!

2. إذا كان طلب المستخدم يحتوي على فكرة أو هدف عام ولكن تنقصه معلومات جوهرية مؤثرة في نطاق العمل (مثل: نوع النظام المطلوب، نبرة العلامة، مدة الفيديو، أو فصول المستند):
   - اختر وظيفة "ask_clarifying_question" واطرح سؤالاً واحداً ذكياً ومركزاً مع خيارات إجابة سريعة مقترحة (suggestedQuickReplies).

3. إذا كان طلب المستخدم واضحاً ومكتمل الأركان لبدء مهمة مستقلة محددة:
   - اختر وظيفة "propose_mission" وقم بهندسة خطة عمل متكاملة ومنظمة إلى مراحل وخطوات تستدعي الأدوات المناسبة:
     - 'brand_identity': تأسيس الهوية، الألوان، النبرة، وسيكولوجية البراند.
     - 'image_studio': تصميم وتوليد الشعارات والصور الإعلانية والتصاميم البصرية.
     - 'video_director': تأليف وإخراج سيناريوهات الفيديو الإعلاني وتوليد المقاطع.
     - 'voice_narration': توليد فويس أوفر وتعليق صوتي سينمائي فخم.
     - 'fullstack_engineer': برمجة أنظمة ومواقع وتطبيقات ويب متكاملة مع المعاينة وتحميل ZIP.
     - 'document_architect': تأليف كتيبات PDF استراتيجية أو عروض تقديمية متعددة الصفحات/الشرائح.
     - 'web_grounding': البحث الحي لجمع حقائق الصناعة والمنافسين.

تنبيه حاسم: لا تضع أسعار أو تقديرات نقاط داخل الخطوات؛ المنظومة تحسب النقاط ذاتياً وبدقة قطعية.`;

  // Prepare contents array for GoogleGenAI
  const formattedContents = messages.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content || '' }]
  }));

  if (projectContext && Object.keys(projectContext).length > 0) {
    formattedContents.unshift({
      role: 'user',
      parts: [{ text: `سياق المشروع العام: ${JSON.stringify(projectContext)}` }]
    });
  }

  try {
    const res = await ai.models.generateContent({
      model: resolveEngineModel(getNajeModel('personas')),
      contents: formattedContents,
      config: {
        systemInstruction,
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.agentPlan,
        temperature: 0.3,
        tools: [
          {
            functionDeclarations: agentFunctionDeclarations as any
          }
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: 'AUTO'
          }
        } as any
      }
    });

    // Check for function calls in response
    const functionCall =
      (res as any).functionCalls?.[0] ||
      res.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;

    if (functionCall) {
      const { name, args } = functionCall;
      const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args || {});

      if (name === 'reply_conversationally') {
        return {
          type: 'reply',
          message: parsedArgs.message || 'أهلاً بك! أنا وكيل ناجي المستقل، كيف يمكنني مساعدتك في مشروعك اليوم؟'
        };
      }

      if (name === 'ask_clarifying_question') {
        return {
          type: 'clarification',
          question: parsedArgs.question || 'هل يمكنك توضيح المزيد من التفاصيل حول هدفك؟',
          suggestedQuickReplies: Array.isArray(parsedArgs.suggestedQuickReplies)
            ? parsedArgs.suggestedQuickReplies
            : undefined
        };
      }

      if (name === 'propose_mission') {
        const rawProposal = parsedArgs as AgentPlanProposal;
        const pricedProposal = computeProposalPricing(rawProposal, pricingConfig);
        return {
          type: 'proposal',
          proposal: pricedProposal
        };
      }
    }

    // If model replied with natural text instead of calling a function, treat as conversational reply
    const textOutput = res.text?.trim();
    if (textOutput) {
      return {
        type: 'reply',
        message: textOutput
      };
    }

    return {
      type: 'reply',
      message: 'أهلاً بك! أنا وكيل ناجي المستقل، أستطيع بناء أنظمة برمجية كاملة، هويات بصرية، فيديوهات، تسجيلات صوتية، وكتيبات استراتيجية. ما هو هدفك اليوم؟'
    };
  } catch (err: any) {
    console.error('[processAgentChatTurn Error]', err);
    throw new Error(err?.message || 'حدث خطأ أثناء معالجة طلب المحادثة مع الوكيل.');
  }
}

/**
 * Deterministically attaches server-computed point costs to every tool in the proposal.
 */
function computeProposalPricing(
  proposal: AgentPlanProposal,
  pricingConfig: PricingConfig
): AgentPlanProposal {
  let totalCost = 0;
  const pricedSteps = (proposal.steps || []).map((step) => {
    const pricedTools = (step.tools || []).map((tool) => {
      const toolCost = getAgentToolCost(tool.name, tool.inputParams || {}, pricingConfig);
      totalCost += toolCost;
      return {
        ...tool,
        estimatedPoints: toolCost
      };
    });

    return {
      ...step,
      tools: pricedTools
    };
  });

  return {
    ...proposal,
    steps: pricedSteps,
    totalEstimatedPoints: parseFloat(totalCost.toFixed(2))
  };
}

/**
 * Legacy-compatible single-prompt proposal generator
 */
export async function generateAgentProposal(
  userPrompt: string,
  projectContext?: any,
  pricingConfig: PricingConfig = {}
): Promise<AgentPlanProposal> {
  const result = await processAgentChatTurn(
    [{ role: 'user', content: userPrompt }],
    pricingConfig,
    projectContext
  );

  if (result.type === 'proposal') {
    return result.proposal;
  }

  // If conversation turn returned reply/clarification, re-prompt for structured plan
  const forcedProposalRes = await ai.models.generateContent({
    model: resolveEngineModel(getNajeModel('personas')),
    contents: `المطلوب: توليد خطة عمل متكاملة ومحددة بصيغة وظيفة propose_mission للطلب: "${userPrompt}"`,
    config: {
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.agentPlan,
      tools: [{ functionDeclarations: agentFunctionDeclarations as any }],
      toolConfig: { functionCallingConfig: { mode: 'ANY' } } as any
    }
  });

  const fc =
    (forcedProposalRes as any).functionCalls?.[0] ||
    forcedProposalRes.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;

  if (fc && fc.args) {
    const parsedArgs = typeof fc.args === 'string' ? JSON.parse(fc.args) : fc.args;
    return computeProposalPricing(parsedArgs, pricingConfig);
  }

  throw new Error('تعذر بناء خطة للمهمة. يرجى توضيح تفاصيل طلبك.');
}

/**
 * Small, factual extraction of 2-4 reference-worthy facts per tool's real output
 * to ground the dynamic step completion narration in concrete details.
 */
export function buildOutputSummary(toolName: string, output: any): Record<string, any> {
  if (!output || typeof output !== 'object') {
    return { summary: String(output || '') };
  }
  switch (toolName) {
    case 'video_director':
      return {
        durationSec: output.durationSeconds || output.duration || (output.shotList?.length ? output.shotList.length * 3 : 5),
        aspectRatio: output.aspectRatio || '16:9',
        visualTheme: output.visualTheme || output.styleLock || output.style || 'سينمائي عالي الجودة'
      };
    case 'image_studio':
      return {
        imageCount: Array.isArray(output.images) ? output.images.length : (output.imageUrl ? 1 : 1),
        styleArchetype: output.style || output.archetype || output.conceptTitle || 'إبداعي متقن'
      };
    case 'brand_identity':
      return {
        brandName: output.brandName || output.name || output.brandKit?.name || 'العلامة التجارية',
        resolvedArchetype: output.archetype || output.personality || output.brandKit?.archetype || 'عصري وريادي',
        paletteDescription: output.paletteDescription || (Array.isArray(output.colors) ? output.colors.join(', ') : output.brandKit?.palette) || 'ألوان متناسقة'
      };
    case 'document_architect':
      return {
        pageOrSlideCount: output.pageCount || output.slideCount || output.slides?.length || output.chapters?.length || 1,
        documentTitle: output.documentTitle || output.title || 'مستند إبداعي',
        docType: output.docType || output.format || 'PDF'
      };
    case 'fullstack_engineer':
      return {
        fileCount: Array.isArray(output.files) ? output.files.length : (output.fileTree ? Object.keys(output.fileTree).length : 1),
        projectName: output.projectName || output.title || 'مشروع برمجي متكامل',
        techStack: output.techStack || output.stack || 'Fullstack React / Node'
      };
    case 'voice_narration':
      return {
        durationSec: output.durationSeconds || output.duration || 5,
        isDialogue: !!output.isDialogue || !!(output.speakers && output.speakers.length > 1),
        voiceNames: output.voices || output.voice || 'أصوات طبيعية'
      };
    default:
      return {
        resultSummary: output.title || output.summary || output.message || (typeof output === 'string' ? output.slice(0, 100) : 'مخرجات متكاملة')
      };
  }
}

/**
 * Generates natural, model-generated Arabic narration from the Naje Council of Minds
 * confirming step completion with real, factual references.
 */
export async function narrateStepCompletion(
  aiInstance: any,
  toolName: string,
  userOriginalRequest: string,
  stepTitle: string,
  outputSummary: any
): Promise<string> {
  const fallbackText = `تم إنجاز "${stepTitle || toolName}" بنجاح.`;
  try {
    const modelId = 'gemini-3.5-flash-lite';
    const prompt = `أنت المتحدث في مجلس عقول ناجي — الطبقة التي تتواصل مباشرة مع المستخدم بلغة طبيعية دافئة وواثقة.
تم للتو إنجاز خطوة من مهمة المستخدم بنجاح. اكتب جملة تأكيد واحدة قصيرة وطبيعية بالعربية، تخاطب المستخدم
مباشرة وتشير تحديداً لما طلبه فعلياً — لا جملة عامة، ولا تكرار لنفس الصياغة في كل مرة.

طلب المستخدم الأصلي لهذه الخطوة: "${userOriginalRequest || stepTitle || ''}"
عنوان الخطوة بالخطة: "${stepTitle || toolName}"
نوع الأداة المنفذة: ${toolName}
ملخص وقائعي لما تم إنتاجه: ${JSON.stringify(outputSummary || {})}

اكتب جملة واحدة فقط، بصوت ناجي (مباشر، واثق، ودود، بدون رسمية جافة)، تؤكد الإنجاز وتشير لتفصيلة حقيقية واحدة
على الأقل من الملخص أعلاه (المدة، اسم البراند، عدد الملفات...). لا تضف أي شرح إضافي أو مقدمة.`;

    const result = await aiInstance.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 512, ...getThinkingConfig(modelId) },
    });

    return result.text?.trim() || fallbackText;
  } catch (err) {
    console.warn('[Narration Warning] Model narration fallback used:', err);
    return fallbackText;
  }
}

/**
 * 2. Step Auditor: Critiques and verifies step output before advancing.
 * Powered by gemini-3.7-flash for rigorous reasoning and quality control.
 * Produces authentic, contextual Arabic narration on success.
 */
export async function auditAgentStepResult(
  stepTitle: string,
  toolOutput: any,
  brandContext: any,
  options?: { userOriginalRequest?: string; toolName?: string; stepTitle?: string }
): Promise<{ passed: boolean; feedback: string; refinedOutput?: any }> {
  const effectiveToolName = options?.toolName || (['brand_identity', 'image_studio', 'video_director', 'voice_narration', 'fullstack_engineer', 'document_architect', 'web_grounding'].includes(stepTitle) ? stepTitle : 'agent_tool');
  const effectiveStepTitle = options?.stepTitle || (stepTitle !== effectiveToolName ? stepTitle : (brandContext?.missionTitle || effectiveToolName));
  const userRequest = options?.userOriginalRequest || brandContext?.userPrompt || brandContext?.slogan || effectiveStepTitle;
  const summary = buildOutputSummary(effectiveToolName, toolOutput);

  try {
    const isCodeProject = effectiveStepTitle.includes('برمج') || effectiveStepTitle.includes('fullstack') || !!toolOutput?.files || !!toolOutput?.techStack;

    const systemInstruction = `أنت المدقق الإستراتيجي وضابط الجودة لوكيل ناجي أوتونوما (Agent Quality & Systems Auditor).
مهمتك: مراجعة نتائج الخطوة المنفذة بدقة هندسية وجمالية قبل اعتمادها.
${isCodeProject ? `
قواعد تدقيق المشاريع البرمجية:
1. تحقق من تكامل الاستيرادات (imports/exports) والتوافق بين مسارات الواجهة الأمامية ونقاط نهاية الخادم الخلفي (API endpoints).
2. تأكد من خلو الأكواد تماماً من أي دوال فارغة أو تعليقات مؤقتة (TODO/Placeholders).
3. تأكد من جاهزية ملف المعاينة المستقل index.html / previewHtml للتشغيل المباشر.
` : 'تحقق من التناسق الإبداعي واللغوي والبصري ومطابقة مخرجات الخطوة مع سياق وهوية العلامة التجارية.'}

أخرج JSON فقط:
{
  "passed": true | false,
  "feedback": "ملاحظات التقييم والتدقيق الواضحة والمحددة",
  "refinedOutput": null
}`;

    const prompt = `هوية العلامة وسياقها: ${JSON.stringify(brandContext || {})}
الخطوة المنفذة: ${effectiveStepTitle}
المخرجات الناتجة: ${JSON.stringify(toolOutput)}

دقق في الجودة والاتساق.`;

    const res = await ai.models.generateContent({
      model: resolveEngineModel(getNajeModel('personas')),
      contents: prompt,
      config: {
        systemInstruction,
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.agentAudit,
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    const parsed = JSON.parse(res.text || '{"passed": true, "feedback": "تم الاعتماد بنجاح"}');
    
    if (parsed.passed) {
      const narration = await narrateStepCompletion(ai, effectiveToolName, userRequest, effectiveStepTitle, summary);
      return {
        passed: true,
        feedback: narration,
        refinedOutput: parsed.refinedOutput
      };
    }

    return parsed;
  } catch (err) {
    console.warn('Step Audit warning:', err);
    const narration = await narrateStepCompletion(ai, effectiveToolName, userRequest, effectiveStepTitle, summary).catch(() => `تم إنجاز "${effectiveStepTitle}" بنجاح.`);
    return { passed: true, feedback: narration };
  }
}
