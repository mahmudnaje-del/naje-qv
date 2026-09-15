import { GoogleGenAI } from '@google/genai';
import { buildPersonaInstruction } from './councilOfMinds';

export interface BrandProfile {
  archetype: string;
  visualEnergy: string;
  culturalGap: string;
  expectedTropes: string;
  groundingInsights?: string;
}

export interface ConceptOption {
  conceptId: string;
  philosophyName: string;
  artMovementUsed: string;
  synthesisPrincipleUsed: string;
  imagePromptDraft: string;
  whyItWorks: string;
  visualMetaphor?: string;
  colorPalette?: string[];
}

const PHOTOGRAPHER_CORE = `محترف تصوير وتصميم بصري بمستوى استوديو عالمي، متمكّن من كل أنواع الإنتاج البصري: الهويات البصرية، الشعارات، تصوير المنتجات، بورتريهات الأشخاص، وأي طلب قابل للتحول لصورة.
منهجك: تقترح عدة اتجاهات بصرية مختلفة جذرياً، تدمج أقوى العناصر وتستبعد الأضعف لتصفية برومبت احترافي متكامل مع تفاصيل الإضاءة، زوايا الكاميرا، ونقاء التركيب البصري.`;

// Stage 1: Brand Psychology Analysis (with Search Grounding when relevant)
export async function analyzeBrandPsychology(
  ai: any, 
  userInput: string, 
  mode: string, 
  writerModel: string = 'gemini-3.5-flash-lite'
): Promise<BrandProfile> {
  const personaInstruction = buildPersonaInstruction('المصوّر', PHOTOGRAPHER_CORE);
  
  // Check if search grounding is helpful (e.g. real brand names or recent trends)
  let groundingInsights = '';
  const searchKeywords = ['براند', 'ماركة', 'شركة', 'منافس', 'trend', 'brand', '2025', '2026', 'سوق'];
  const shouldSearch = searchKeywords.some(kw => userInput.toLowerCase().includes(kw));

  if (shouldSearch) {
    try {
      const searchRes = await ai.models.generateContent({
        model: writerModel,
        contents: [{ role: 'user', parts: [{ text: `تحقق من أحدث التوجهات البصرية والهوية المعاصرة لـ: "${userInput}"` }] }],
        config: {
          tools: [{ googleSearch: {} }],
          maxOutputTokens: 8192
        }
      });
      groundingInsights = searchRes.text?.slice(0, 500) || '';
    } catch (sErr) {
      console.warn('[Photographer/Search] Grounding notice:', sErr);
    }
  }

  const prompt = `${personaInstruction}

Analyze the brand psychology of the following user request for a design (${mode}):
"${userInput}"
${groundingInsights ? `Recent Market / Trend Insights: "${groundingInsights}"` : ''}

Extract and deduce:
1. archetype: Choose one of (Innocent, Explorer, Sage, Hero, Outlaw, Magician, Regular Guy, Lover, Jester, Caregiver, Creator, Ruler).
2. visualEnergy: Describe the energy on axes of (Calm/Loud, Warm/Cold, Modern/Classic) from 1-10.
3. culturalGap: Does it target local Arab/Khaleeji audiences with cultural symbols, or a global neutral audience?
4. expectedTropes: What is the most expected, stereotypical visual look for this specific domain?

Return ONLY a JSON object:
{
  "archetype": "...",
  "visualEnergy": "...",
  "culturalGap": "...",
  "expectedTropes": "..."
}`;

  try {
    const res = await ai.models.generateContent({
      model: writerModel,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 8192 }
    });
    const parsed = JSON.parse(res.text || "{}");
    if (groundingInsights) parsed.groundingInsights = groundingInsights;
    return parsed;
  } catch(e) {
    console.error("Stage 1 Error:", e);
    return { archetype: "Creator", visualEnergy: "Balanced", culturalGap: "Global", expectedTropes: "Generic design" };
  }
}

// Stage 2: Obvious Solution Blocklist
export async function generateBlocklist(ai: any, businessDomain: string, mode: string, writerModel: string = 'gemini-3.5-flash-lite'): Promise<string[]> {
  const personaInstruction = buildPersonaInstruction('المصوّر', PHOTOGRAPHER_CORE);
  const prompt = `${personaInstruction}

If 100 AI designers received a prompt to design a ${mode} for: "${businessDomain}", what are the top 5 most cliché, overused, and obvious visual solutions they would generate?
Return ONLY a JSON array of 5 strings.`;
  try {
     const res = await ai.models.generateContent({
      model: writerModel,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 4096 }
    });
    return JSON.parse(res.text || "[]");
  } catch(e) {
    return ["generic logo", "blue circles", "abstract shapes"];
  }
}

// Stage 3: Cross-Domain Synthesis
export async function crossDomainSynthesis(ai: any, coreIdea: string, brandProfile: BrandProfile, writerModel: string = 'gemini-3.5-flash-lite'): Promise<string[]> {
  const personaInstruction = buildPersonaInstruction('المصوّر', PHOTOGRAPHER_CORE);
  const prompt = `${personaInstruction}

Based on the brand profile:
Archetype: ${brandProfile.archetype}
Energy: ${brandProfile.visualEnergy}

We need to borrow visual/structural principles from UNRELATED domains for the idea: "${coreIdea}".
Choose 3 distinct principles from these banks:
- Micro-nature (veins of leaves, rock cracks, waves, honeycomb)
- Physical motion (bouncing ball, visible sound waves, wind flow)
- Ancient crafts (embroidery, pottery, weaving, classic structural calligraphy)
- Architecture (arches, columns, skylines, geometric shadows)
- Astronomy/Space (orbits, constellations, twilight gradients)
- Music/Rhythm (sound waves, rhythmic repetition)

Return ONLY a JSON array of 3 strings, where each string explains the chosen principle and how to creatively apply it to the idea.`;
  try {
     const res = await ai.models.generateContent({
      model: writerModel,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 4096 }
    });
    return JSON.parse(res.text || "[]");
  } catch(e) {
    return ["Apply architectural geometry", "Use natural flow lines", "Incorporate rhythmic repetition"];
  }
}

// Stage 4: Match Art Movement
export async function matchArtMovement(ai: any, brandProfile: BrandProfile, writerModel: string = 'gemini-3.5-flash-lite'): Promise<string[]> {
  const personaInstruction = buildPersonaInstruction('المصوّر', PHOTOGRAPHER_CORE);
  const prompt = `${personaInstruction}

Based on the brand profile:
Archetype: ${brandProfile.archetype}
Energy: ${brandProfile.visualEnergy}

Select the 3 most fitting art movements/design languages from this list:
- Bauhaus
- Swiss International Typographic Style
- Japanese Ma / Wabi-Sabi
- Art Deco
- Memphis Group
- Scandinavian Minimalism
- Islamic Geometric Patterns (as modern structure)
- Digital Brutalism
- Art Nouveau
- Russian Constructivism

Return ONLY a JSON array of 3 strings, each stating the movement and a brief reason.`;
  try {
     const res = await ai.models.generateContent({
      model: writerModel,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 4096 }
    });
    return JSON.parse(res.text || "[]");
  } catch(e) {
    return ["Bauhaus", "Swiss International", "Minimalism"];
  }
}

// Stage 5: Divergent Concept Generation
export async function generateDivergentConcepts(
  ai: any, 
  rawPrompt: string, 
  brandProfile: BrandProfile, 
  blocklist: string[], 
  synthesisOptions: string[], 
  artMovements: string[], 
  mode: string, 
  aspectRatio: string, 
  writerModel: string = 'gemini-3.5-flash-lite'
): Promise<ConceptOption[]> {
  const personaInstruction = buildPersonaInstruction('المصوّر', PHOTOGRAPHER_CORE);
  const prompt = `${personaInstruction}

You are a visionary Creative Director. We need 3 to 5 RADICALLY DIFFERENT, world-class design concepts for:
Original Request: "${rawPrompt}"
Mode: ${mode}
Aspect Ratio: ${aspectRatio}

Brand Psychology: ${brandProfile.archetype}, Energy: ${brandProfile.visualEnergy}, Culture: ${brandProfile.culturalGap}

CRITICAL RULES:
1. STRICT BLOCKLIST (Do NOT use these cliché ideas):
${blocklist.map(b => "- " + b).join("\n")}

2. CROSS-DOMAIN SYNTHESIS OPTIONS (Use these as inspiration):
${synthesisOptions.map(s => "- " + s).join("\n")}

3. ART MOVEMENTS TO UTILIZE:
${artMovements.map(a => "- " + a).join("\n")}

Create 4 distinct concepts. NO TWO CONCEPTS CAN USE THE SAME ART MOVEMENT OR SYNTHESIS PRINCIPLE. They must be completely divergent approaches.

Return ONLY a JSON array of 4 objects matching this schema exactly:
[
  {
    "conceptId": "c1",
    "philosophyName": "Inspiring name in Arabic (e.g. الصمت الهندسي)",
    "artMovementUsed": "Movement name",
    "synthesisPrincipleUsed": "Synthesis principle name",
    "visualMetaphor": "Visual metaphor description",
    "colorPalette": ["#HEX1", "#HEX2", "#HEX3"],
    "imagePromptDraft": "The highly detailed image generation prompt draft in English...",
    "whyItWorks": "A brief explanation in Arabic of why this works for the user's brand"
  }
]`;

  try {
     const res = await ai.models.generateContent({
      model: writerModel,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 16384 }
    });
    return JSON.parse(res.text || "[]");
  } catch(e) {
    console.error("Stage 5 Error:", e);
    return [];
  }
}

// Master Orchestrator
export async function generateMaximumCreativity(
  ai: any, 
  rawPrompt: string, 
  mode: string = "design", 
  aspectRatio: string = "1:1", 
  applyCreativeLayers?: any, 
  writerModel: string = 'gemini-3.5-flash-lite'
): Promise<ConceptOption[]> {
  try {
    // Stage 1
    const brandProfile = await analyzeBrandPsychology(ai, rawPrompt, mode, writerModel);
    
    // Stage 2, 3, 4 run in parallel
    const [blocklist, synthesisOptions, artMovements] = await Promise.all([
      generateBlocklist(ai, rawPrompt, mode, writerModel),
      crossDomainSynthesis(ai, rawPrompt, brandProfile, writerModel),
      matchArtMovement(ai, brandProfile, writerModel)
    ]);
    
    // Stage 5
    let concepts = await generateDivergentConcepts(ai, rawPrompt, brandProfile, blocklist, synthesisOptions, artMovements, mode, aspectRatio, writerModel);
    
    if (!concepts || concepts.length === 0) {
      concepts = [{
        conceptId: "c_fallback",
        philosophyName: "التصميم المباشر",
        artMovementUsed: "Modern Minimalist",
        synthesisPrincipleUsed: "Direct Representation",
        visualMetaphor: "Direct brand identity presentation",
        colorPalette: ["#111827", "#D97706", "#F3F4F6"],
        imagePromptDraft: rawPrompt,
        whyItWorks: "تصميم أنيق ومباشر يعتمد على طلبك الأصلي."
      }];
    }
    
    return concepts;
  } catch(e) {
    console.error("Master Orchestrator Error:", e);
    const fallbackPrompt = applyCreativeLayers ? await applyCreativeLayers(ai, rawPrompt, mode, aspectRatio) : rawPrompt;
    return [{
        conceptId: "c_error_fallback",
        philosophyName: "الاتجاه الرئيسي",
        artMovementUsed: "Modern",
        synthesisPrincipleUsed: "Direct",
        visualMetaphor: "Core identity focus",
        colorPalette: ["#0F172A", "#3B82F6", "#E2E8F0"],
        imagePromptDraft: fallbackPrompt,
        whyItWorks: "تصميم يعكس متطلباتك الأساسية بأفضل جودة ممكنة."
    }];
  }
}
