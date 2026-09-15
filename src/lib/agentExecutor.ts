import { GoogleGenAI } from '@google/genai';
import { AgentToolCall, AgentArtifact, AgentCodeFile, AgentAuditEntry } from '../types/agent';
import { pcmToWav, parseSampleRateFromMimeType } from './audioContainer';
import { getAgentToolCost } from './agentPricing';
import { executeFullstackEngineerMission } from './fullstackBuilder';
import { 
  buildPersonaInstruction, 
  criticReviewRequest, 
  extractVoiceFingerprint, 
  reasonBestVoice, 
  detectAndParseDialogue,
  buildDesignerInstruction
} from './councilOfMinds';
import { generateInfographicSpec, renderInfographic } from './infographicEngine';
import { OUTPUT_TOKEN_LIMITS } from './modelRegistry';
import { createGenAIClient } from './genaiClient';
import { getNajeModel, resolveEngineModel } from './modelEnvConfig';

const ai = createGenAIClient();

const LITE_MODEL = () => resolveEngineModel(getNajeModel('lite'));
const PERSONAS_MODEL = () => resolveEngineModel(getNajeModel('personas'));
const IMAGE_MODEL = () => resolveEngineModel(getNajeModel('image_core'));
const VOICE_MODEL = () => resolveEngineModel(getNajeModel('voice_core'));

/**
 * Executes a single tool in the Naje Agent Tool-Belt, powered by the Council of Minds.
 * Generates Real Images, Video Scripts, Structured PDF Documents, Multi-Speaker Voice Narrations, and Complete Full-Stack Code Projects.
 */
export async function executeAgentTool(
  toolName: AgentToolCall['name'],
  inputParams: Record<string, any>,
  missionContext: {
    missionId: string;
    ownerId: string;
    brandContext?: any;
    userPrompt: string;
    auditHistory?: AgentAuditEntry[];
  },
  pricingConfig?: any,
  options?: { onProgress?: (progress: any) => void }
): Promise<{ output: any; artifact?: AgentArtifact; pointsDeducted: number }> {
  const { brandContext, userPrompt, auditHistory } = missionContext;

  // 1. Silent Critic Pre-Review (الناقد)
  let enrichedPrompt = userPrompt;
  try {
    const criticType = toolName === 'image_studio' || toolName === 'brand_identity' ? 'image'
      : toolName === 'video_director' ? 'video'
      : toolName === 'document_architect' ? 'document'
      : toolName === 'fullstack_engineer' ? 'code'
      : toolName === 'infographic_designer' ? 'document'
      : 'voice';
    
    const criticRes = await criticReviewRequest(ai, userPrompt, criticType, brandContext);
    if (criticRes.enrichedPrompt) {
      enrichedPrompt = criticRes.enrichedPrompt;
    }
  } catch (cErr) {
    console.warn('[Critic] Pre-pass review bypass:', cErr);
  }

  // Build audit feedback context from previous steps if available
  const recentAuditFeedback = (auditHistory && auditHistory.length > 0)
    ? `\n\nتوجيهات وملاحظات الجودة والتدقيق من المراحل السابقة (التزم بها لتحسين المخرج الحالي):\n` +
      auditHistory.slice(-2).map(a => `- مرحلة [${a.stepTitle}]: ${a.feedback}`).join('\n')
    : '';

  // Determine points deducted using unified central pricing
  const calculatedPoints = getAgentToolCost(toolName, inputParams || {}, pricingConfig || {});

  switch (toolName) {
    case 'brand_identity': {
      const personaCore = `خبير استراتيجية وتأسيس العلامات التجارية الفاخرة وتصميم الهويات البصرية المكتملة.
مهمتك: صياغة هوية متكاملة وسيكولوجية للبراند بناء على المعطيات بدقة وعناية متناهية.`;
      const systemInstruction = buildPersonaInstruction('المصوّر', personaCore);

      const res = await ai.models.generateContent({
        model: PERSONAS_MODEL(),
        contents: `الطلب: ${enrichedPrompt}\nالمدخلات: ${JSON.stringify(inputParams)}${recentAuditFeedback}
أخرج JSON فقط:
{
  "brandName": "الاسم المعتمد",
  "vision": "الرؤية والرسالة",
  "archetype": "النمط السيكولوجي للعلامة (مثل: الحاكم، المبتكر، الساحر)",
  "colorPalette": [
    {"name": "اللون الأساسي", "hex": "#1A1A24", "usage": "الخلفيات والنصوص الرئيسية"},
    {"name": "اللون الذهبي/الرمزي", "hex": "#C5A880", "usage": "العناصر المميزة والأيقونات"},
    {"name": "اللون التكميلي", "hex": "#E5D4C0", "usage": "البطاقات والمساحات الثانوية"}
  ],
  "typography": {
    "primaryFont": "Tajawal / Alexandria",
    "toneOfVoice": "فخم، واثق، شاعري رصين"
  },
  "taglines": ["شعار 1", "شعار 2"]
}`,
        config: { 
          systemInstruction, 
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.agentPlan,
          responseMimeType: 'application/json', 
          temperature: 0.5 
        }
      });

      const output = JSON.parse(res.text || '{}');
      const artifact: AgentArtifact = {
        id: `artifact_brand_${Date.now()}`,
        type: 'brand_palette',
        title: `هوية علامة: ${output.brandName || brandContext?.brandName || 'العلامة'}`,
        data: output,
        createdAt: Date.now()
      };

      return { output, artifact, pointsDeducted: calculatedPoints };
    }

    case 'image_studio': {
      const personaCore = `مخرج تصوير وتصميم بصري عالمي. تصوغ أدق الأوصاف التوليدية الإنجليزية المتوافقة مع أحدث معايير الإضاءة والعدسات السينمائية.`;
      const systemInstruction = buildPersonaInstruction('المصوّر', personaCore);

      // 1. Synthesize elite prompt via Lite with brand and audit feedback
      const promptGen = await ai.models.generateContent({
        model: LITE_MODEL(),
        contents: `${systemInstruction}

اصنع وصفاً إنجليزياً دقيقاً ومبهراً لتوليد تصميم/شعار لـ:
البراند: ${brandContext?.brandName || 'Luxury Brand'}
المجال: ${brandContext?.industry || 'General'}
الألوان: ${JSON.stringify(brandContext?.colors || ['#111', '#c5a880'])}
تفاصيل الطلب: ${inputParams.prompt || enrichedPrompt}${recentAuditFeedback}
المطلوب: English generation prompt, photorealistic, 8k, highly detailed, masterwork luxury aesthetic. أخرج النص الإنجليزي فقط.`,
        config: {
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler
        }
      });
      const generatedImagePrompt = promptGen.text?.trim() || 'Luxury product render, cinematic lighting, 8k photorealistic';

      // 2. Generate Image via Native Image Generation
      let imageUrl = '';
      try {
        const imgResponse = await ai.models.generateContent({
          model: IMAGE_MODEL(),
          contents: [{ role: 'user', parts: [{ text: generatedImagePrompt }] }],
          config: {
            responseModalities: ['IMAGE'],
            maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler,
          }
        });
        const imagePart = imgResponse.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        const b64 = imagePart?.inlineData?.data;
        if (b64) {
          const mime = imagePart?.inlineData?.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${b64}`;
        }
      } catch (imgErr) {
        console.warn('Image generation fallback notice:', imgErr);
      }

      const output = {
        promptUsed: generatedImagePrompt,
        imageUrl: imageUrl || undefined,
        aspectRatio: inputParams.aspectRatio || '1:1'
      };

      const artifact: AgentArtifact = {
        id: `artifact_img_${Date.now()}`,
        type: 'image',
        title: inputParams.title || `تصميم بصري: ${brandContext?.brandName || 'المشروع'}`,
        url: imageUrl,
        previewUrl: imageUrl,
        data: output,
        createdAt: Date.now()
      };

      return { output, artifact, pointsDeducted: calculatedPoints };
    }

    case 'voice_narration': {
      // Pre-generation check for voice / dialogue clarity (الناقد)
      const voiceCritic = await criticReviewRequest(ai, userPrompt, 'voice', brandContext);
      if (voiceCritic.verdict === 'needs_clarification') {
        return {
          output: {
            needsClarification: true,
            message: voiceCritic.clarificationQuestion || 'يرجى توضيح نص السرد الصوتي أو أسطر المتحدثين بدقة لتوليد التسجيل الصوتي.',
            text: voiceCritic.clarificationQuestion || 'يرجى توضيح نص السرد الصوتي أو أسطر المتحدثين بدقة لتوليد التسجيل الصوتي.'
          },
          pointsDeducted: 0
        };
      }
      const activePrompt = voiceCritic.enrichedPrompt || enrichedPrompt;

      // 1. Detect if request is a multi-speaker dialogue or single voiceover
      const dialogueInfo = await detectAndParseDialogue(ai, activePrompt, brandContext);

      let audioBase64 = '';
      let narrationText = '';
      let usedVoice = 'Fenrir';

      if (dialogueInfo.isDialogue && dialogueInfo.turns.length > 1) {
        // Multi-Speaker Dialogue Generation
        narrationText = dialogueInfo.turns.map(t => `${t.speaker}: ${t.text}`).join('\n');
        usedVoice = dialogueInfo.turns.map(t => `${t.speaker} (${t.voice})`).join(' + ');

        try {
          const pcmSegments: Buffer[] = [];
          const sampleRate = 24000;
          // 300ms of silence between turns (24000 samples/sec * 2 bytes/sample * 0.3s = 14400 bytes)
          const silencePcm = Buffer.alloc(Math.round(sampleRate * 2 * 0.3));

          for (let i = 0; i < dialogueInfo.turns.length; i++) {
            const turn = dialogueInfo.turns[i];
            const turnTtsRes = await ai.models.generateContent({
              model: VOICE_MODEL(),
              contents: turn.text,
              config: {
                maxOutputTokens: OUTPUT_TOKEN_LIMITS.voiceScript,
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: turn.voice }
                  }
                }
              } as any
            });

            const candidate = turnTtsRes?.candidates?.[0];
            const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData && (p.inlineData.mimeType?.startsWith('audio/') || p.inlineData.data));

            if (audioPart?.inlineData?.data) {
              const rawTurnPcm = Buffer.from(audioPart.inlineData.data, 'base64');
              pcmSegments.push(rawTurnPcm);
              if (i < dialogueInfo.turns.length - 1) {
                pcmSegments.push(silencePcm);
              }
            }
          }

          if (pcmSegments.length > 0) {
            const combinedPcm = Buffer.concat(pcmSegments);
            const wavBuffer = pcmToWav(combinedPcm, sampleRate);
            audioBase64 = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
          }
        } catch (dialogueErr) {
          console.warn('[SoundEngineer] Dialogue TTS synthesis error:', dialogueErr);
        }

      } else {
        // Single Voiceover Narration
        const personaCore = `كاتب نصوص إعلانية صوتية ومخرج أداء صوتي محترف.
اكتب نصاً صوتياً شاعرياً فخماً وجذاباً ومتقناً لـ:
البراند: ${brandContext?.brandName || 'العلامة'}
المجال: ${brandContext?.industry || 'العطور والمنتجات الفاخرة'}
النبرة: ${brandContext?.tone || 'فخامة وهيبة'}
الطلب: ${enrichedPrompt}${recentAuditFeedback}
أخرج النص العربي الصافي فقط بدون مقدمات.`;
        const systemInstruction = buildPersonaInstruction('مهندس الصوت', personaCore);

        const scriptRes = await ai.models.generateContent({
          model: PERSONAS_MODEL(),
          contents: systemInstruction,
          config: {
            maxOutputTokens: OUTPUT_TOKEN_LIMITS.voiceScript
          }
        });

        narrationText = scriptRes.text?.trim() || `حضورٌ يبقى ولا يزول.`;

        // Select best voice matching the script & brand tone
        usedVoice = inputParams.voice || await reasonBestVoice(ai, narrationText, brandContext);

        try {
          const ttsRes = await ai.models.generateContent({
            model: VOICE_MODEL(),
            contents: narrationText,
            config: {
              maxOutputTokens: OUTPUT_TOKEN_LIMITS.voiceScript,
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: usedVoice }
                }
              }
            } as any
          });

          const candidate = ttsRes?.candidates?.[0];
          const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData && (p.inlineData.mimeType?.startsWith('audio/') || p.inlineData.data));

          if (audioPart?.inlineData?.data) {
            const rawPcm = Buffer.from(audioPart.inlineData.data, 'base64');
            const sampleRate = parseSampleRateFromMimeType(audioPart.inlineData.mimeType, 24000);
            const wavBuffer = pcmToWav(rawPcm, sampleRate);
            audioBase64 = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
          }
        } catch (ttsErr) {
          console.warn('[SoundEngineer] Agent TTS generation error:', ttsErr);
        }
      }

      const output = {
        narrationText,
        voice: usedVoice,
        isDialogue: dialogueInfo.isDialogue,
        audioUrl: audioBase64 || undefined
      };

      const artifact: AgentArtifact = {
        id: `artifact_audio_${Date.now()}`,
        type: 'audio',
        title: dialogueInfo.isDialogue 
          ? `تسجيل حوار صوتي (${dialogueInfo.speakers.join(' و ')}): ${brandContext?.brandName || 'المشروع'}`
          : `تسجيل صوتي إعلاني: ${brandContext?.brandName || 'المشروع'}`,
        url: audioBase64,
        previewUrl: audioBase64,
        data: output,
        downloadFilename: `${brandContext?.brandName || 'Audio'}_Voiceover.wav`,
        createdAt: Date.now()
      };

      return { output, artifact, pointsDeducted: calculatedPoints };
    }

    case 'fullstack_engineer': {
      // Execute 6-Phase Master Weaver Pipeline (المبرمج)
      const fullstackResult = await executeFullstackEngineerMission(
        enrichedPrompt,
        brandContext,
        inputParams,
        pricingConfig,
        options?.onProgress
      );

      const files: AgentCodeFile[] = fullstackResult.files || [];
      const artifact: AgentArtifact = {
        id: `artifact_code_${Date.now()}`,
        type: 'code_project',
        title: `مشروع برمجي متكامل (${files.length} ملفات): ${fullstackResult.projectName || brandContext?.brandName || 'المنظومة'}`,
        data: {
          projectName: fullstackResult.projectName,
          projectDescription: fullstackResult.projectDescription,
          techStack: fullstackResult.techStack,
          previewHtml: fullstackResult.previewHtml,
          plan: fullstackResult.plan,
          contract: fullstackResult.contract,
          linkerDiagnostics: fullstackResult.linkerDiagnostics,
          auditFeedback: fullstackResult.auditFeedback,
          auditPassed: fullstackResult.auditPassed
        },
        files: files,
        downloadFilename: `${fullstackResult.projectName || 'project'}_fullstack.zip`,
        createdAt: Date.now()
      };

      return { 
        output: fullstackResult, 
        artifact, 
        pointsDeducted: fullstackResult.pointsDeducted 
      };
    }

    case 'video_director': {
      const durationSec = Number(inputParams?.durationSeconds || inputParams?.durationSec || inputParams?.duration) || 5;
      const personaCore = `منتج أفلام إعلانية محترف. لكل ثانية من مدة الفيديو المطلوبة، فكّر فعلياً: ما أقوى لحظة بصرية ممكنة بهذه الثانية تحديداً؟ ماذا يجب أن يُستبعد لتترك مجالاً لما هو أهم؟ استثمر كل ثانية بقرار إبداعي واعٍ وحافظ على اتساق الموضوع والأسلوب من الثانية الأولى للثانية الأخيرة.`;
      const systemInstruction = buildPersonaInstruction('المنتج', personaCore);

      const scriptRes = await ai.models.generateContent({
        model: PERSONAS_MODEL(),
        contents: `${systemInstruction}

اكتب سيناريو إعلان سينمائي فخم لمقطع فيديو مدته ${durationSec} ثوانٍ لـ ${brandContext?.brandName || 'العلامة'}.
المجال: ${brandContext?.industry || 'المجال العام'}
الطلب: ${enrichedPrompt}${recentAuditFeedback}

المطلوب إخراج JSON:
{
  "title": "عنوان الإعلان",
  "concept": "الفكرة الجوهرية",
  "durationSeconds": ${durationSec},
  "shots": [
    {"timestamp": "00:00 - 00:03", "visual": "تفاصيل اللقطة الأولى", "camera": "Slow macro pan", "sound": "موسيقى هادئة وتأثيرات"},
    {"timestamp": "00:03 - 00:05", "visual": "اللقطة الختامية مع الشعار", "camera": "Static locked hero shot", "sound": "النبرة الختامية"}
  ],
  "veoPrompt": "Prompt for video generation model"
}`,
        config: { 
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.videoCompiler,
          responseMimeType: 'application/json' 
        }
      });

      const output = JSON.parse(scriptRes.text || '{}');
      const artifact: AgentArtifact = {
        id: `artifact_vid_${Date.now()}`,
        type: 'video',
        title: `سيناريو وإخراج إعلان: ${brandContext?.brandName || 'المشروع'}`,
        data: output,
        createdAt: Date.now()
      };

      return { output, artifact, pointsDeducted: calculatedPoints };
    }

    case 'document_architect': {
      const isSlides = inputParams?.docType === 'slides' || inputParams?.docType === 'pptx';
      const pagesCount = Number(inputParams?.pagesCount || inputParams?.slidesCount || 4);

      const personaCore = `كاتب محترف يكتب بأعلى درجات الدقة والعناية، كل كلمة مقصودة. حافظ على نفس الصوت والنبرة عبر كل فصل أو شريحة بهذا المستند تحديداً ليخرج العمل كاملاً بصوت مؤلف واحد متماسك ورفيع المستوى.`;
      const systemInstruction = buildPersonaInstruction('الكاتب', personaCore);

      // Chapter 1 initial generation
      const docRes = await ai.models.generateContent({
        model: PERSONAS_MODEL(),
        contents: `${systemInstruction}

اكتب ${isSlides ? 'عرضاً تقديمياً' : 'كتيباً متكاملاً'} من ${pagesCount} ${isSlides ? 'شرائح' : 'فصول'} لـ ${brandContext?.brandName || 'العلامة'}.
السياق: ${JSON.stringify(brandContext || {})}
الطلب: ${enrichedPrompt}${recentAuditFeedback}

أخرج JSON فقط:
{
  "docTitle": "عنوان الكتيب الفخم",
  "subtitle": "العنوان الفرعي",
  "chapters": [
    {
      "chapterNumber": 1,
      "chapterTitle": "الفصل الأول: النشأة وفلسفة الإلهام",
      "contentHtml": "<p>محتوى غني وشاعري ومتقن...</p>"
    },
    {
      "chapterNumber": 2,
      "chapterTitle": "الفصل الثاني: البنية والمكونات",
      "contentHtml": "<p>تفاصيل المكونات...</p>"
    },
    {
      "chapterNumber": 3,
      "chapterTitle": "الفصل الثالث: التجربة والقيمة",
      "contentHtml": "<p>شرح تفاصيل التجربة...</p>"
    },
    {
      "chapterNumber": 4,
      "chapterTitle": "الفصل الرابع: دليل الاقتناء والمجموعات الحصرية",
      "contentHtml": "<p>الخاتمة وقائمة المنتجات...</p>"
    }
  ]
}`,
        config: { 
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.documentChunk,
          responseMimeType: 'application/json' 
        }
      });

      const output = JSON.parse(docRes.text || '{}');

      // Extract Voice Fingerprint from Chapter 1 for persistent authorial memory
      if (output.chapters?.[0]?.contentHtml) {
        const fingerprint = await extractVoiceFingerprint(ai, output.chapters[0].contentHtml);
        output.voiceFingerprint = fingerprint;
      }

      const artifact: AgentArtifact = {
        id: `artifact_pdf_${Date.now()}`,
        type: 'pdf',
        title: output.docTitle || `كتيب: ${brandContext?.brandName || 'العلامة'}`,
        data: output,
        downloadFilename: `${brandContext?.brandName || 'Booklet'}_Overview.pdf`,
        createdAt: Date.now()
      };

      return { output, artifact, pointsDeducted: calculatedPoints };
    }

    case 'infographic_designer': {
      // Infographic Engine: Designer Persona + Grounding + Puppeteer HTML/CSS Rendering
      const { spec, sources } = await generateInfographicSpec(ai, enrichedPrompt, brandContext);
      const { pngBase64, pdfBase64, html } = await renderInfographic(spec);

      const output = {
        title: spec.title,
        subtitle: spec.subtitle,
        layoutStyle: spec.layoutStyle,
        spec,
        sources,
        pngBase64,
        pdfBase64,
        html,
        imageUrl: `data:image/png;base64,${pngBase64}`,
        pdfUrl: `data:application/pdf;base64,${pdfBase64}`
      };

      const artifact: AgentArtifact = {
        id: `artifact_infographic_${Date.now()}`,
        type: 'infographic',
        title: `إنفوجرافيك: ${spec.title || 'تصميم بيانات'}`,
        url: `data:image/png;base64,${pngBase64}`,
        previewUrl: `data:image/png;base64,${pngBase64}`,
        downloadFilename: `${(spec.title || 'Infographic').replace(/\s+/g, '_')}.png`,
        data: output,
        sources,
        createdAt: Date.now()
      };

      return { output, artifact, pointsDeducted: calculatedPoints };
    }

    case 'web_grounding':
    default: {
      // Real Google Search Grounding with sources extraction
      const res = await ai.models.generateContent({
        model: LITE_MODEL(),
        contents: `ابحث عن أحدث اتجاهات السوق، المنافسين، والحقائق الصناعية المحدثة ذات الصلة بـ: ${enrichedPrompt}.${recentAuditFeedback}\nلخّص أهم 3 إلى 5 نتائج حقيقية ومحدّثة مع ذكر مصادرها وتحليل أثرها الإستراتيجي.`,
        config: {
          maxOutputTokens: 4096,
          tools: [{ googleSearch: {} }]
        }
      });

      const groundingChunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((c: any) => ({ title: c.web?.title || 'مصدر خارجي موثوق', uri: c.web?.uri }))
        .filter((s: any) => !!s.uri);

      const output = {
        analysis: res.text || '',
        sources,
        timestamp: Date.now()
      };

      const artifact: AgentArtifact = {
        id: `artifact_grounding_${Date.now()}`,
        type: 'text',
        title: `أبحاث السوق والبحث الحي: ${brandContext?.brandName || 'المجال الصناعي'}`,
        data: output,
        sources,
        createdAt: Date.now()
      };

      return { output, artifact, pointsDeducted: calculatedPoints };
    }
  }
}
