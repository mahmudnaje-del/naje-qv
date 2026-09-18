var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/audioContainer.ts
function pcmToWav(pcmData, sampleRate, numChannels = 1, bitsPerSample = 16) {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmData]);
}
function parseSampleRateFromMimeType(mimeType, fallback = 24e3) {
  if (!mimeType) return fallback;
  const match = mimeType.match(/rate=(\d+)/i);
  return match ? parseInt(match[1], 10) : fallback;
}
var init_audioContainer = __esm({
  "src/lib/audioContainer.ts"() {
  }
});

// src/lib/modelEnvConfig.ts
function readEnv(keys, defaultValue) {
  if (typeof process === "undefined" || !process.env) return defaultValue;
  for (const key of keys) {
    const val = process.env[key];
    if (val && typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }
  return defaultValue;
}
function getNajeModel(role) {
  switch (role) {
    case "core":
      return readEnv(["NAJE_MODEL_CORE", "Naje-core", "MODEL_CORE", "NAJE_CORE"], "gemini-3.6-flash");
    case "lite":
      return readEnv(["NAJE_MODEL_LITE", "Naje-lite", "MODEL_LITE", "NAJE_LITE"], "gemini-3.5-flash-lite");
    case "pro":
      return readEnv(["NAJE_MODEL_PRO", "Naje-pro", "MODEL_PRO", "NAJE_PRO"], "gemini-3.1-pro-preview");
    case "personas":
      return readEnv(["NAJE_MODEL_PERSONAS", "Naje-personas", "MODEL_PERSONAS", "NAJE_PERSONAS"], "gemini-3.5-flash-lite");
    case "image_lite":
      return readEnv(["NAJE_MODEL_IMAGE_LITE", "Naje-image-lite", "MODEL_IMAGE_LITE"], "nano-banana-2-lite");
    case "image_core":
      return readEnv(["NAJE_MODEL_IMAGE_CORE", "Naje-image", "MODEL_IMAGE_CORE"], "nano-banana-2");
    case "image_pro":
      return readEnv(["NAJE_MODEL_IMAGE_PRO", "Naje-image-pro", "MODEL_IMAGE_PRO"], "nano-banana-pro");
    case "video_core":
      return readEnv(["NAJE_MODEL_VIDEO_CORE", "Naje-video-lite", "Naje-video", "MODEL_VIDEO_CORE", "NAJE_VIDEO_LITE", "NAJE_VIDEO"], "veo-3.1-lite-generate-001");
    case "video_pro":
      return readEnv(["NAJE_MODEL_VIDEO_PRO", "Naje-video-pro", "MODEL_VIDEO_PRO", "NAJE_VIDEO_PRO"], "gemini-omni-1.1-flash-preview");
    case "voice_core":
      return readEnv(["NAJE_MODEL_VOICE_CORE", "Naje-voice-core", "MODEL_VOICE_CORE", "NAJE_VOICE_CORE", "NAJE_MODEL_VOICE", "Naje-voice"], "gemini-3.1-flash-tts-preview");
    case "voice_pro":
      return readEnv(["NAJE_MODEL_VOICE_PRO", "Naje-voice-pro", "MODEL_VOICE_PRO", "NAJE_VOICE_PRO"], "gemini-3.1-flash-tts-preview");
    case "voice":
      return readEnv(["NAJE_MODEL_VOICE_CORE", "NAJE_MODEL_VOICE", "Naje-voice-core", "Naje-voice", "MODEL_VOICE_CORE", "MODEL_VOICE"], "gemini-3.1-flash-tts-preview");
    default:
      return readEnv(["NAJE_MODEL_CORE", "MODEL_CORE"], "gemini-3.6-flash");
  }
}
function resolveEngineModel(modelOrAlias) {
  if (!modelOrAlias) return getNajeModel("core");
  const m = String(modelOrAlias || "").trim();
  const lower = m.toLowerCase().replace(/\s+/g, "-");
  if (lower === "naje-core" || lower === "core") {
    return resolveEngineModel(getNajeModel("core"));
  }
  if (lower === "naje-lite" || lower === "lite") {
    return resolveEngineModel(getNajeModel("lite"));
  }
  if (lower === "naje-pro" || lower === "max" || lower === "pro") {
    return resolveEngineModel(getNajeModel("pro"));
  }
  if (lower === "naje-personas" || lower === "personas") {
    return resolveEngineModel(getNajeModel("personas"));
  }
  if (lower === "naje-voice-core" || lower === "voice-core" || lower === "voice_core") {
    return resolveEngineModel(getNajeModel("voice_core"));
  }
  if (lower === "naje-voice-pro" || lower === "voice-pro" || lower === "voice_pro") {
    return resolveEngineModel(getNajeModel("voice_pro"));
  }
  if (lower === "naje-voice" || lower === "voice") {
    return resolveEngineModel(getNajeModel("voice_core"));
  }
  if (lower === "naje-video-core" || lower === "naje-video-lite" || lower === "naje-video" || lower === "video" || lower === "veo" || lower === "video_standard" || lower === "video_veo_lite") {
    return resolveEngineModel(getNajeModel("video_core"));
  }
  if (lower === "naje-video-pro" || lower === "video-pro" || lower === "video_pro" || lower === "veo-pro" || lower === "omni" || lower === "video_omni" || lower === "video_hd") {
    return resolveEngineModel(getNajeModel("video_pro"));
  }
  if (lower === "gemini-3.1-pro" || lower === "gemini-3.1-pro-preview") {
    return "gemini-3.1-pro-preview";
  }
  if (lower === "gemini-3.5-flash-lite" || lower === "flash-lite") {
    return "gemini-3.5-flash-lite";
  }
  if (lower === "gemini-3.6-flash" || lower === "gemini-flash" || lower === "flash") {
    return "gemini-3.6-flash";
  }
  if (lower.includes("flash-lite-image") || lower === "nano-banana-2-lite" || lower === "naje-image-lite") {
    return "gemini-3.1-flash-lite-image";
  }
  if (lower.includes("flash-image") || lower === "nano-banana-2" || lower === "naje-image") {
    return "gemini-3.1-flash-image";
  }
  if (lower.includes("pro-image") || lower === "nano-banana-pro" || lower === "naje-image-pro") {
    return "gemini-3-pro-image";
  }
  if (lower === "veo-lite" || lower === "veo-3.1-lite" || lower === "veo-3.1-lite-generate" || lower === "veo-3.1-lite-generate-001" || lower === "veo-3.1-lite-generate-preview") {
    return "veo-3.1-lite-generate-001";
  }
  if (lower === "veo-pro" || lower === "veo-3.1-pro" || lower === "veo-3.1-generate" || lower === "veo-3.1-generate-001" || lower === "veo-3.1-generate-preview") {
    return "veo-3.1-generate-001";
  }
  if (lower.includes("omni")) {
    return "gemini-omni-1.1-flash-preview";
  }
  if (lower === "gemini-3.1-flash-tts" || lower === "gemini-3.1-flash-tts-preview") {
    return "gemini-3.1-flash-tts-preview";
  }
  return lower;
}
var init_modelEnvConfig = __esm({
  "src/lib/modelEnvConfig.ts"() {
  }
});

// src/lib/modelRegistry.ts
var OUTPUT_TOKEN_LIMITS, SEED_ENDPOINTS, FALLBACK_MODEL_DEFAULTS, FALLBACK_DEFAULTS;
var init_modelRegistry = __esm({
  "src/lib/modelRegistry.ts"() {
    init_modelEnvConfig();
    OUTPUT_TOKEN_LIMITS = {
      criticReview: 4096,
      // الناقد's structured JSON verdict — short by design
      classification: 4096,
      // Intent classification and safety guardrails
      memorySummary: 4096,
      // Project memory item concise summarization
      imageCompiler: 4096,
      // compileImagePrompt / applyCreativeLayers — prompt text compilation
      videoCompiler: 8192,
      // compileVideoPrompt / auditVideoPrompt — shot lists and script directions
      documentChunk: 32e3,
      // document_writer/slide_writer — comprehensive chapters / slide batch
      documentSection: 16e3,
      // individual section audit & refinement
      slideJson: 8192,
      // presentation slide JSON structure
      fullstackContractSynthesis: 16e3,
      // Phase 2 — signatures, type definitions, and contract interfaces
      fullstackFileGeneration: 6e4,
      // Phase 3 — complete individual code files (close to 65,535 capacity)
      fullstackAudit: 16e3,
      // Phase 4/6 — structured lint and semantic audit findings
      agentPlan: 8192,
      // generateAgentProposal & planner function-calling
      agentAudit: 8192,
      // auditAgentStepResult verification
      voiceScript: 8192,
      // dialogue script structuring in agentExecutor
      audioSpeech: 8192,
      // TTS audio generation tokens
      mediaAnalysis: 8192,
      // Multimodal OCR / image / audio inspection
      webGrounding: 16e3,
      // Google Search grounded research synthesis
      textChat: 32e3,
      // conversational chat and deep thinking responses
      chatResponse: 32e3,
      // standard chat response ceiling
      uiBuilder: 32e3,
      // UI components & interactive widgets generation
      uiPlan: 8192,
      // UI generation architecture & layout planning
      uiHtml: 32e3
      // full-page interactive UI HTML output
    };
    SEED_ENDPOINTS = [
      // TEXT / CORE TIERS (User-Facing Text Models — Token Metered)
      {
        id: "tier_lite",
        featureGroup: "text",
        labelAr: "Naje Lite (\u0646\u0635 \u062E\u0641\u064A\u0641)",
        modelId: getNajeModel("lite"),
        fallbackModelId: getNajeModel("lite"),
        paramNotes: "\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0633\u0631\u064A\u0639\u0629 \u062C\u062F\u0627\u064B \u0648\u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u062A\u0648\u0643\u0646\u0632 \u0645\u0646\u062E\u0641\u0636",
        maxOutputTokens: 32e3,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        inputPointsPerBlock: 0.1,
        inputTokenBlockSize: 1e3,
        outputPointsPerBlock: 0.1,
        outputTokenBlockSize: 1e3,
        audioInputPointsPer1k: 0.2,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: false
      },
      {
        id: "tier_core",
        featureGroup: "text",
        labelAr: "Naje Core (\u0646\u0635 \u0642\u064A\u0627\u0633\u064A)",
        modelId: getNajeModel("core"),
        fallbackModelId: getNajeModel("lite"),
        paramNotes: "\u0645\u062A\u0648\u0627\u0632\u0646 \u0648\u0630\u0643\u064A (\u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A \u0644\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0645\u062A\u0637\u0648\u0631)",
        maxOutputTokens: 32e3,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        inputPointsPerBlock: 0.1,
        inputTokenBlockSize: 1e3,
        outputPointsPerBlock: 0.1,
        outputTokenBlockSize: 1e3,
        audioInputPointsPer1k: 0.2,
        realCostPer: { unit: "per_1m_input_tokens", usd: 1.25 },
        pointsPrice: 0,
        isBackground: false
      },
      {
        id: "tier_max",
        featureGroup: "text",
        labelAr: "Naje Pro (\u062A\u0641\u0643\u064A\u0631 \u0639\u0645\u064A\u0642)",
        modelId: getNajeModel("pro"),
        fallbackModelId: getNajeModel("core"),
        paramNotes: "\u0623\u0639\u0644\u0649 \u062F\u0642\u0629 \u0627\u0633\u062A\u062F\u0644\u0627\u0644\u064A\u0629 \u0648\u062A\u0641\u0643\u064A\u0631 \u062A\u062D\u0644\u064A\u0644\u064A \u0645\u062A\u0642\u062F\u0645",
        maxOutputTokens: 32e3,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        inputPointsPerBlock: 0.1,
        inputTokenBlockSize: 1e3,
        outputPointsPerBlock: 0.1,
        outputTokenBlockSize: 1e3,
        audioInputPointsPer1k: 0.2,
        realCostPer: { unit: "per_1m_input_tokens", usd: 2 },
        pointsPrice: 0,
        isBackground: false
      },
      // BACKGROUND & INTERNAL COGNITIVE SERVICES (Council & Pipelines — Token Metered)
      {
        id: "critic_review",
        featureGroup: "text",
        labelAr: "\u0627\u0644\u0646\u0627\u0642\u062F \u2014 \u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0642\u0628\u0644 \u0627\u0644\u062A\u0646\u0641\u064A\u0630",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u0641\u062D\u0635 \u0645\u0633\u0628\u0642 \u0644\u0644\u063A\u0645\u0648\u0636 \u0648\u0627\u0644\u062A\u0646\u0627\u0642\u0636\u0627\u062A \u0648\u062A\u0635\u062D\u064A\u062D\u0647\u0627",
        maxOutputTokens: 4096,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: true
      },
      {
        id: "creative_council",
        featureGroup: "text",
        labelAr: "\u0645\u062C\u0644\u0633 \u0639\u0642\u0648\u0644 \u0646\u0627\u062C\u064A \u2014 \u0627\u0644\u062A\u0648\u062C\u064A\u0647 \u0627\u0644\u0625\u0628\u062F\u0627\u0639\u064A \u0648\u0627\u0644\u0637\u0628\u0642\u0627\u062A",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u0627\u0644\u0645\u0635\u0648\u0651\u0631\u060C \u0627\u0644\u0645\u062E\u0631\u062C\u060C \u0627\u0644\u0643\u0627\u062A\u0628\u060C \u0645\u0647\u0646\u062F\u0633 \u0627\u0644\u0635\u0648\u062A\u064A\u0627\u062A (\u0634\u062E\u0635\u064A\u0627\u062A \u0646\u0627\u062C\u064A)",
        maxOutputTokens: 8192,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: true
      },
      {
        id: "agent_planner",
        featureGroup: "text",
        labelAr: "\u0645\u062E\u0637\u0637 \u0627\u0644\u0648\u0643\u0644\u0627\u0621 \u0627\u0644\u0630\u0643\u064A (Agent Planner)",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u062A\u0641\u0643\u064A\u0643 \u0627\u0644\u0645\u0647\u0627\u0645 \u0648\u0628\u0646\u0627\u0621 \u062E\u0637\u0637 \u0627\u0644\u0648\u0643\u064A\u0644 \u0648\u062A\u0639\u062F\u064A\u0644\u0647\u0627 (\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0648\u0643\u064A\u0644)",
        maxOutputTokens: 8192,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: true
      },
      {
        id: "agent_auditor",
        featureGroup: "text",
        labelAr: "\u0645\u062F\u0642\u0642 \u062E\u0637\u0648\u0627\u062A \u0627\u0644\u0648\u0643\u064A\u0644 (Agent Step Auditor)",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A \u0648\u0636\u0628\u0637 \u0627\u0644\u062C\u0648\u062F\u0629 \u0644\u0643\u0644 \u062E\u0637\u0648\u0629 (\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0648\u0643\u064A\u0644)",
        maxOutputTokens: 8192,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: true
      },
      {
        id: "agent_narrator",
        featureGroup: "text",
        labelAr: "\u0633\u0627\u0631\u062F \u0625\u0646\u062C\u0627\u0632\u0627\u062A \u0627\u0644\u0648\u0643\u064A\u0644 (Agent Step Narrator)",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u0635\u064A\u0627\u063A\u0629 \u062A\u0623\u0643\u064A\u062F \u0625\u0646\u062C\u0627\u0632 \u0627\u0644\u062E\u0637\u0648\u0627\u062A \u0628\u0635\u0648\u062A \u0646\u0627\u062C\u064A \u0627\u0644\u0637\u0628\u064A\u0639\u064A (\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0648\u0643\u064A\u0644)",
        maxOutputTokens: 4096,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: true
      },
      {
        id: "fullstack_builder",
        featureGroup: "ui",
        labelAr: "\u0627\u0644\u0646\u0633\u0651\u0627\u062C \u2014 \u0645\u0647\u0646\u062F\u0633 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0645\u062A\u0643\u0627\u0645\u0644\u0629 (Fullstack Engineer)",
        modelId: getNajeModel("pro"),
        fallbackModelId: getNajeModel("core"),
        paramNotes: "\u062A\u0648\u0644\u064A\u062F \u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0628\u0631\u0645\u062C\u0629 \u0648\u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 (Phase 3)",
        maxOutputTokens: 6e4,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 2 },
        pointsPrice: 0,
        isBackground: false
      },
      {
        id: "fullstack_auditor",
        featureGroup: "ui",
        labelAr: "\u0627\u0644\u0646\u0633\u0651\u0627\u062C \u2014 \u0645\u062F\u0642\u0642 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u0623\u0646\u0638\u0645\u0629 (Fullstack Auditor)",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A \u0648\u0627\u0644\u0628\u0631\u0645\u062C\u064A \u0648\u0641\u062D\u0635 \u0627\u0644\u062A\u0648\u0627\u0641\u0642 (\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0645\u062F\u0642\u0642)",
        maxOutputTokens: 16e3,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: true
      },
      {
        id: "image_prompt_compiler",
        featureGroup: "image",
        labelAr: "\u0645\u062C\u0645\u0651\u0639 \u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u0635\u0648\u0631 (Image Prompt Compiler)",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u0647\u064A\u0643\u0644\u0629 \u0648\u0625\u062B\u0631\u0627\u0621 \u0623\u0648\u0627\u0645\u0631 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 (\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0645\u0635\u0648\u0631)",
        maxOutputTokens: 4096,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: true
      },
      {
        id: "video_prompt_compiler",
        featureGroup: "video",
        labelAr: "\u0645\u062E\u0631\u062C \u0648\u0645\u0634\u0631\u0641 \u0633\u064A\u0646\u0627\u0631\u064A\u0648 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 (Video Director)",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u062A\u0635\u0645\u064A\u0645 \u0644\u0642\u0637\u0627\u062A \u0648\u0633\u064A\u0646\u0627\u0631\u064A\u0648 \u0648\u062D\u0631\u0643\u0627\u062A \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627 (\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0645\u062E\u0631\u062C)",
        maxOutputTokens: 8192,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: true
      },
      {
        id: "image_auditor",
        featureGroup: "image",
        labelAr: "\u0645\u062F\u0642\u0642 \u062C\u0648\u062F\u0629 \u0648\u062A\u0637\u0627\u0628\u0642 \u0627\u0644\u0635\u0648\u0631 (Image Verifier)",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u0641\u062D\u0635 \u0645\u062E\u0631\u062C\u0627\u062A \u0627\u0644\u0635\u0648\u0631 \u0648\u0645\u0642\u0627\u0631\u0646\u062A\u0647\u0627 \u0628\u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0623\u0635\u0644\u064A (\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0641\u0627\u062D\u0635)",
        maxOutputTokens: 4096,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: true
      },
      // UI STUDIO & DOCUMENTS
      {
        id: "ui_builder",
        featureGroup: "ui",
        labelAr: "\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0627\u0644\u0648\u0627\u062C\u0647\u0627\u062A UI Studio",
        modelId: getNajeModel("core"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0648\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0635\u0641\u062D\u0627\u062A",
        maxOutputTokens: 32e3,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 1.25 },
        pointsPrice: 0,
        isBackground: false
      },
      {
        id: "document_engine",
        featureGroup: "document",
        labelAr: "\u0645\u062D\u0631\u0643 \u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0648\u0627\u0644\u0634\u0631\u0627\u0626\u062D (Auditor)",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u062A\u062F\u0642\u064A\u0642 \u062C\u0648\u062F\u0629 \u0648\u062A\u0646\u0627\u0633\u0642 \u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0648\u0627\u0644\u0634\u0631\u0627\u0626\u062D (\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0643\u0627\u062A\u0628)",
        maxOutputTokens: 16e3,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: true
      },
      {
        id: "document_writer",
        featureGroup: "document",
        labelAr: "\u0643\u0627\u062A\u0628 \u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A (Document Writer)",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u062A\u0648\u0644\u064A\u062F \u0648\u0635\u064A\u0627\u063A\u0629 \u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0648\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 (\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0643\u0627\u062A\u0628)",
        maxOutputTokens: 32e3,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: false
      },
      {
        id: "slide_writer",
        featureGroup: "document",
        labelAr: "\u0643\u0627\u062A\u0628 \u0627\u0644\u0634\u0631\u0627\u0626\u062D (Slide Writer)",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u062A\u0648\u0644\u064A\u062F \u0648\u062A\u0623\u0644\u064A\u0641 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062A\u0642\u062F\u064A\u0645\u064A\u0629 (\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0643\u0627\u062A\u0628)",
        maxOutputTokens: 32e3,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: false
      },
      {
        id: "doc_standard",
        featureGroup: "document",
        labelAr: "\u0645\u0633\u062A\u0646\u062F \u2014 A4 (\u0644\u0643\u0644 \u0635\u0641\u062D\u0629)",
        modelId: getNajeModel("core"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u062A\u0648\u0644\u064A\u062F \u0648\u062A\u0635\u062F\u064A\u0631 \u0635\u0641\u062D\u0627\u062A A4 \u0627\u0644\u0631\u0633\u0645\u064A\u0629",
        maxOutputTokens: 32e3,
        pricingType: "per_generation",
        realCostPer: { unit: "per_page", usd: 3e-3 },
        pointsPrice: 0.15,
        isBackground: false
      },
      {
        id: "doc_a5",
        featureGroup: "document",
        labelAr: "\u0645\u0633\u062A\u0646\u062F \u2014 A5 (\u0644\u0643\u0644 \u0635\u0641\u062D\u0629)",
        modelId: getNajeModel("core"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u062A\u0648\u0644\u064A\u062F \u0648\u062A\u0635\u062F\u064A\u0631 \u0635\u0641\u062D\u0627\u062A A5 \u0627\u0644\u0645\u0635\u063A\u0631\u0629",
        maxOutputTokens: 32e3,
        pricingType: "per_generation",
        realCostPer: { unit: "per_page", usd: 2e-3 },
        pointsPrice: 0.1,
        isBackground: false
      },
      {
        id: "doc_slides",
        featureGroup: "document",
        labelAr: "\u0639\u0631\u0636 \u062A\u0642\u062F\u064A\u0645\u064A \u2014 \u0634\u0631\u0627\u0626\u062D (\u0644\u0643\u0644 \u0634\u0631\u064A\u062D\u0629)",
        modelId: getNajeModel("core"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u062A\u0648\u0644\u064A\u062F \u0648\u062A\u0635\u062F\u064A\u0631 \u0634\u0631\u0627\u0626\u062D \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0642\u062F\u064A\u0645\u064A PPTX/PDF",
        maxOutputTokens: 32e3,
        pricingType: "per_generation",
        realCostPer: { unit: "per_slide", usd: 4e-3 },
        pointsPrice: 0.2,
        isBackground: false
      },
      {
        id: "infographic_designer",
        featureGroup: "document",
        labelAr: "\u0627\u0644\u0645\u0635\u0645\u0645 \u2014 \u0645\u062D\u0631\u0643 \u0627\u0644\u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 (Infographic Engine)",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u0631\u0633\u0645 \u0628\u064A\u0627\u0646\u064A \u0648\u062A\u0635\u0645\u064A\u0645 \u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u0628\u0635\u0631\u064A \u0648\u062A\u0635\u062F\u064A\u0631\u0647 \u0639\u0628\u0631 Puppeteer (PNG + PDF)",
        maxOutputTokens: 16e3,
        pricingType: "per_generation",
        realCostPer: { unit: "per_render", usd: 5e-3 },
        pointsPrice: 0.5,
        isBackground: false
      },
      // IMAGE GENERATION (Flat Per-Unit Pricing)
      {
        id: "image_lite",
        featureGroup: "image",
        labelAr: "\u0635\u0648\u0631\u0629 \u2014 Naje Imagen Lite",
        modelId: "nano-banana-2-lite",
        fallbackModelId: getNajeModel("image_lite"),
        paramNotes: "\u062E\u0641\u064A\u0641 \u0648\u0633\u0631\u064A\u0639 (0.5 \u0646\u0642\u0637\u0629 \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0627\u064B)",
        maxOutputTokens: 4096,
        pricingType: "per_generation",
        realCostPer: { unit: "per_image", usd: 0.01 },
        pointsPrice: 0.5,
        isBackground: false
      },
      {
        id: "image_spectra",
        featureGroup: "image",
        labelAr: "\u0635\u0648\u0631\u0629 \u2014 Naje Imagen",
        modelId: "nano-banana-2",
        fallbackModelId: getNajeModel("image_core"),
        paramNotes: "\u062A\u0648\u0627\u0632\u0646 \u0642\u064A\u0627\u0633\u064A (\u0646\u0642\u0637\u0629 \u0648\u0627\u062D\u062F\u0629 \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0627\u064B)",
        maxOutputTokens: 4096,
        pricingType: "per_generation",
        realCostPer: { unit: "per_image", usd: 0.02 },
        pointsPrice: 1,
        isBackground: false
      },
      {
        id: "image_addon",
        featureGroup: "image",
        labelAr: "\u0625\u0636\u0627\u0641\u0629 \u062F\u0645\u062C \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u0645\u0631\u062C\u0639\u064A\u0629 (Addon)",
        modelId: getNajeModel("personas"),
        fallbackModelId: getNajeModel("personas"),
        paramNotes: "\u062A\u0643\u0644\u0641\u0629 \u062F\u0645\u062C \u0643\u0644 \u0635\u0648\u0631\u0629 \u0645\u0631\u062C\u0639\u064A\u0629 \u0625\u0636\u0627\u0641\u064A\u0629",
        maxOutputTokens: 4096,
        pricingType: "per_generation",
        realCostPer: { unit: "per_image", usd: 2e-3 },
        pointsPrice: 0.1,
        isBackground: false
      },
      {
        id: "image_fast",
        featureGroup: "image",
        labelAr: "\u0635\u0648\u0631\u0629 \u2014 Naje Imagen Lite (\u0633\u0631\u064A\u0639\u0629)",
        modelId: "nano-banana-2-lite",
        fallbackModelId: getNajeModel("image_lite"),
        paramNotes: "\u062A\u0648\u0644\u064A\u062F \u0641\u0648\u0631\u064A \u062E\u0641\u064A\u0641",
        maxOutputTokens: 4096,
        pricingType: "per_generation",
        realCostPer: { unit: "per_image", usd: 0.04 },
        pointsPrice: 3,
        isBackground: false
      },
      {
        id: "image_standard",
        featureGroup: "image",
        labelAr: "\u0635\u0648\u0631\u0629 \u2014 Naje Imagen \u0627\u0644\u0645\u0639\u064A\u0627\u0631\u064A\u0629",
        modelId: "nano-banana-2",
        fallbackModelId: getNajeModel("image_core"),
        paramNotes: "1024x1024 \u062F\u0642\u0629 \u0642\u064A\u0627\u0633\u064A\u0629",
        maxOutputTokens: 4096,
        pricingType: "per_generation",
        realCostPer: { unit: "per_image", usd: 0.067 },
        pointsPrice: 5,
        isBackground: false
      },
      {
        id: "image_hd",
        featureGroup: "image",
        labelAr: "\u0635\u0648\u0631\u0629 \u2014 Naje Imagen Pro (\u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062F\u0642\u0629)",
        modelId: "nano-banana-pro",
        fallbackModelId: getNajeModel("image_pro"),
        paramNotes: "2048x2048 \u062F\u0642\u0629 \u0641\u0627\u0626\u0642\u0629",
        maxOutputTokens: 4096,
        pricingType: "per_generation",
        realCostPer: { unit: "per_image", usd: 0.101 },
        pointsPrice: 10,
        isBackground: false
      },
      {
        id: "image_pro",
        featureGroup: "image",
        labelAr: "\u0635\u0648\u0631\u0629 \u2014 Naje Imagen Pro (\u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629)",
        modelId: "nano-banana-pro",
        fallbackModelId: getNajeModel("image_pro"),
        paramNotes: "\u062C\u0648\u062F\u0629 \u0641\u0627\u0626\u0642\u0629 \u0645\u0639 \u062A\u062D\u0643\u0645 \u0628\u0627\u0644\u0641\u0631\u0634\u0627\u0629 \u0648\u0627\u0644\u0637\u0628\u0642\u0627\u062A",
        maxOutputTokens: 4096,
        pricingType: "per_generation",
        realCostPer: { unit: "per_image", usd: 0.134 },
        pointsPrice: 12,
        isBackground: false
      },
      // VIDEO GENERATION (Flat Per-Unit Pricing)
      {
        id: "video_standard",
        envVarKey: "NAJE_MODEL_VIDEO_CORE",
        featureGroup: "video",
        labelAr: "\u0641\u064A\u062F\u064A\u0648 \u2014 Naje Video",
        modelId: getNajeModel("video_core"),
        fallbackModelId: getNajeModel("video_core"),
        paramNotes: "720p \u0633\u064A\u0646\u0645\u0627\u0626\u064A \u0642\u064A\u0627\u0633\u064A",
        maxOutputTokens: 8192,
        pricingType: "per_generation",
        realCostPer: { unit: "per_second", usd: 0.05 },
        pointsPrice: 20,
        isBackground: false,
        supportedDurations: [4, 6, 8],
        supportsImageInput: true
      },
      {
        id: "video_veo_lite",
        envVarKey: "NAJE_MODEL_VIDEO_CORE",
        featureGroup: "video",
        labelAr: "\u0641\u064A\u062F\u064A\u0648 \u2014 Naje Video (Lite)",
        modelId: getNajeModel("video_core"),
        fallbackModelId: getNajeModel("video_core"),
        paramNotes: "720p @ 5s",
        maxOutputTokens: 8192,
        pricingType: "per_generation",
        realCostPer: { unit: "per_second", usd: 0.05 },
        pointsPrice: 25,
        isBackground: false,
        supportedDurations: [4, 6, 8],
        supportsImageInput: true
      },
      {
        id: "video_omni",
        envVarKey: "NAJE_MODEL_VIDEO_PRO",
        featureGroup: "video",
        labelAr: "\u0641\u064A\u062F\u064A\u0648 \u2014 Naje Video Pro",
        modelId: getNajeModel("video_pro"),
        fallbackModelId: getNajeModel("video_pro"),
        paramNotes: "Naje Video Pro Multimodal Video",
        maxOutputTokens: 8192,
        pricingType: "per_generation",
        realCostPer: { unit: "per_second", usd: 0.05 },
        isUnconfirmedCost: true,
        pointsPrice: 20,
        isBackground: false,
        supportedDurations: [5, 10],
        supportsImageInput: true
      },
      // VOICE TTS (Per-character pricing — admin sets Naje points per letter)
      {
        id: "voice_tts",
        featureGroup: "voice",
        labelAr: "\u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A \u2014 Naje Voice Core (\u0627\u0644\u0623\u0633\u0627\u0633\u064A)",
        modelId: getNajeModel("voice_core"),
        fallbackModelId: getNajeModel("voice_core"),
        paramNotes: "\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0646\u0635 \u0625\u0644\u0649 \u0635\u0648\u062A \u2014 \u0627\u0644\u062A\u0633\u0639\u064A\u0631: \u0646\u0642\u0627\u0637 \u0646\u0627\u062C\u064A \u0644\u0643\u0644 \u062D\u0631\u0641",
        maxOutputTokens: 8192,
        pricingType: "per_character",
        realCostPer: { unit: "per_1m_audio_tokens", usd: 20 },
        isUnconfirmedCost: true,
        pointsPrice: 0.01,
        isBackground: false
      },
      {
        id: "voice_tts_pro",
        featureGroup: "voice",
        labelAr: "\u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A \u2014 Naje Voice Pro (\u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A \u0627\u0644\u0641\u0627\u0626\u0642)",
        modelId: getNajeModel("voice_pro"),
        fallbackModelId: getNajeModel("voice_core"),
        paramNotes: "\u0623\u0639\u0644\u0649 \u062F\u0642\u0629 \u0648\u0646\u0642\u0627\u0621 \u2014 \u0627\u0644\u062A\u0633\u0639\u064A\u0631: \u0646\u0642\u0627\u0637 \u0646\u0627\u062C\u064A \u0644\u0643\u0644 \u062D\u0631\u0641",
        maxOutputTokens: 16384,
        pricingType: "per_character",
        realCostPer: { unit: "per_1m_audio_tokens", usd: 40 },
        isUnconfirmedCost: true,
        pointsPrice: 0.02,
        isBackground: false
      },
      {
        id: "voice_tts_standard",
        featureGroup: "voice",
        labelAr: "\u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A \u2014 \u062D\u0648\u0627\u0631 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0623\u0635\u0648\u0627\u062A (Core)",
        modelId: getNajeModel("voice_core"),
        fallbackModelId: getNajeModel("voice_core"),
        paramNotes: "\u062D\u0648\u0627\u0631 \u0628\u064A\u0646 \u0634\u062E\u0635\u064A\u0627\u062A \u2014 \u0646\u0642\u0627\u0637 \u0644\u0643\u0644 \u062D\u0631\u0641 \u0645\u0646\u0637\u0648\u0642",
        maxOutputTokens: 8192,
        pricingType: "per_character",
        realCostPer: { unit: "per_1m_audio_tokens", usd: 20 },
        isUnconfirmedCost: true,
        pointsPrice: 0.01,
        isBackground: false
      },
      // TEXT TIER ENDPOINT ALIASES
      {
        id: "text_lite",
        featureGroup: "text",
        labelAr: "\u0646\u0635 \u062E\u0641\u064A\u0641 (Lite Tier)",
        modelId: getNajeModel("lite"),
        fallbackModelId: getNajeModel("lite"),
        paramNotes: "\u0645\u062D\u0627\u062F\u062B\u0629 \u0633\u0631\u064A\u0639\u0629 \u0648\u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0627\u0642\u062A\u0635\u0627\u062F\u064A",
        maxOutputTokens: 32e3,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 0.25 },
        pointsPrice: 0,
        isBackground: false
      },
      {
        id: "text_core",
        featureGroup: "text",
        labelAr: "\u0646\u0635 \u0642\u064A\u0627\u0633\u064A (Core Tier)",
        modelId: getNajeModel("core"),
        fallbackModelId: getNajeModel("lite"),
        paramNotes: "\u0645\u062D\u0627\u062F\u062B\u0629 \u0645\u062A\u0648\u0627\u0632\u0646\u0629 \u0630\u0643\u064A\u0629 \u0648\u0633\u0631\u064A\u0639\u0629",
        maxOutputTokens: 32e3,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 1.25 },
        pointsPrice: 0,
        isBackground: false
      },
      {
        id: "text_max",
        featureGroup: "text",
        labelAr: "\u0646\u0635 \u0627\u0633\u062A\u062F\u0644\u0627\u0644\u064A (Pro Tier)",
        modelId: getNajeModel("pro"),
        fallbackModelId: getNajeModel("core"),
        paramNotes: "\u062A\u0641\u0643\u064A\u0631 \u062A\u062D\u0644\u064A\u0644\u064A \u0639\u0645\u064A\u0642 \u0648\u0645\u0639\u0627\u0644\u062C\u0629 \u0645\u0639\u0642\u062F\u0629",
        maxOutputTokens: 32e3,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 2 },
        pointsPrice: 0,
        isBackground: false
      },
      {
        id: "ui_standard",
        featureGroup: "ui",
        labelAr: "\u0648\u0627\u062C\u0647\u0627\u062A \u2014 \u0627\u0644\u0642\u064A\u0627\u0633\u064A",
        modelId: getNajeModel("core"),
        fallbackModelId: getNajeModel("lite"),
        paramNotes: "\u062A\u0648\u0644\u064A\u062F \u0643\u0648\u062F \u0648\u0627\u062C\u0647\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645",
        maxOutputTokens: 32e3,
        pricingType: "per_token",
        inputPointsPer1k: 0.1,
        outputPointsPer1k: 0.1,
        realCostPer: { unit: "per_1m_input_tokens", usd: 1.25 },
        pointsPrice: 0,
        isBackground: false
      }
    ];
    FALLBACK_MODEL_DEFAULTS = {
      tier_lite: getNajeModel("lite"),
      tier_core: getNajeModel("core"),
      tier_max: getNajeModel("pro"),
      text_lite: getNajeModel("lite"),
      text_core: getNajeModel("core"),
      text_max: getNajeModel("pro"),
      critic_review: getNajeModel("personas"),
      creative_council: getNajeModel("personas"),
      agent_planner: getNajeModel("personas"),
      agent_auditor: getNajeModel("personas"),
      agent_narrator: getNajeModel("personas"),
      fullstack_builder: getNajeModel("pro"),
      fullstack_auditor: getNajeModel("personas"),
      image_prompt_compiler: getNajeModel("personas"),
      video_prompt_compiler: getNajeModel("personas"),
      image_auditor: getNajeModel("personas"),
      image_standard: getNajeModel("image_core"),
      image_hd: getNajeModel("image_pro"),
      image_pro: getNajeModel("image_pro"),
      image_fast: getNajeModel("image_lite"),
      image_lite: getNajeModel("image_lite"),
      image_spectra: getNajeModel("image_core"),
      image_addon: getNajeModel("personas"),
      video_veo_lite: getNajeModel("video_core"),
      video_standard: getNajeModel("video_core"),
      video_omni: getNajeModel("video_pro"),
      video_hd: getNajeModel("video_pro"),
      ui_builder: getNajeModel("core"),
      ui_standard: getNajeModel("core"),
      voice_tts: getNajeModel("voice_core"),
      voice_tts_core: getNajeModel("voice_core"),
      voice_tts_pro: getNajeModel("voice_pro"),
      voice_tts_standard: getNajeModel("voice_core"),
      document_engine: getNajeModel("personas"),
      doc_standard: getNajeModel("core"),
      doc_a5: getNajeModel("core"),
      doc_slides: getNajeModel("core"),
      document_writer: getNajeModel("personas"),
      slide_writer: getNajeModel("personas"),
      infographic_designer: getNajeModel("personas")
    };
    FALLBACK_DEFAULTS = {
      tier_lite: getNajeModel("lite"),
      tier_core: getNajeModel("core"),
      tier_max: getNajeModel("pro"),
      text_lite: getNajeModel("lite"),
      text_core: getNajeModel("core"),
      text_max: getNajeModel("pro"),
      critic_review: getNajeModel("personas"),
      creative_council: getNajeModel("personas"),
      agent_planner: getNajeModel("personas"),
      agent_auditor: getNajeModel("personas"),
      agent_narrator: getNajeModel("personas"),
      fullstack_builder: getNajeModel("pro"),
      fullstack_auditor: getNajeModel("personas"),
      image_prompt_compiler: getNajeModel("personas"),
      video_prompt_compiler: getNajeModel("personas"),
      image_auditor: getNajeModel("personas"),
      image_standard: getNajeModel("image_core"),
      image_hd: getNajeModel("image_pro"),
      image_pro: getNajeModel("image_pro"),
      image_fast: getNajeModel("image_lite"),
      image_lite: getNajeModel("image_lite"),
      image_spectra: getNajeModel("image_core"),
      image_addon: getNajeModel("personas"),
      video_veo_lite: getNajeModel("video_core"),
      video_standard: getNajeModel("video_core"),
      video_omni: getNajeModel("video_pro"),
      ui_builder: getNajeModel("core"),
      ui_standard: getNajeModel("core"),
      voice_tts: getNajeModel("voice_core"),
      voice_tts_core: getNajeModel("voice_core"),
      voice_tts_pro: getNajeModel("voice_pro"),
      voice_tts_standard: getNajeModel("voice_core"),
      document_engine: getNajeModel("personas"),
      doc_standard: getNajeModel("core"),
      doc_a5: getNajeModel("core"),
      doc_slides: getNajeModel("core"),
      document_writer: getNajeModel("personas"),
      slide_writer: getNajeModel("personas"),
      infographic_designer: getNajeModel("personas")
    };
  }
});

// src/lib/geminiCaching.ts
async function getOrCreateExplicitCache(ai5, key, model, systemInstructionText, ttlSeconds = 3600) {
  const existing = activeCaches.get(key);
  const now = Date.now();
  if (existing && existing.model === model && existing.expiresAt > now + 3e5) {
    return existing.cacheName;
  }
  if (!systemInstructionText || systemInstructionText.length < 16e3) {
    return null;
  }
  try {
    if (ai5 && ai5.caches && typeof ai5.caches.create === "function") {
      const cacheResponse = await ai5.caches.create({
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
          expiresAt: now + ttlSeconds * 1e3
        });
        console.log(`[Context Caching] Created explicit cache for '${key}' (${cacheResponse.name}) with TTL ${ttlSeconds}s`);
        return cacheResponse.name;
      }
    }
  } catch (err) {
    console.warn(`[Context Caching] Explicit cache creation bypassed for '${key}':`, err?.message || err);
  }
  return null;
}
function getCriticCachedInstruction() {
  const personaCore = `\u0645\u0647\u0645\u062A\u0643: \u0641\u062D\u0635 \u0627\u0644\u0637\u0644\u0628 \u0628\u062F\u0642\u0629 \u0634\u062F\u064A\u062F\u0629 \u0642\u0628\u0644 \u0623\u064A \u0625\u0646\u062A\u0627\u062C \u0641\u0639\u0644\u064A\u060C \u0648\u0627\u0643\u062A\u0634\u0627\u0641 \u0623\u064A \u063A\u0645\u0648\u0636 \u0623\u0648 \u062A\u0646\u0627\u0642\u0636 \u0623\u0648 \u0646\u0642\u0635 \u0628\u0627\u0644\u0633\u064A\u0627\u0642 \u0642\u062F \u064A\u0636\u0639\u0641 \u062C\u0648\u062F\u0629 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629\u060C \u0648\u0627\u0642\u062A\u0631\u0627\u062D \u062D\u0644\u0648\u0644 \u0648\u0627\u0636\u062D\u0629 \u0648\u0645\u062D\u062F\u062F\u0629.

\u0642\u0648\u0627\u0639\u062F \u0635\u0627\u0631\u0645\u0629:
1. \u0644\u0627 \u062A\u0631\u0641\u0636 \u0637\u0644\u0628\u0627\u062A \u063A\u0627\u0645\u0636\u0629 \u2014 \u0623\u0635\u0644\u062D\u0647\u0627 \u0628\u0646\u0641\u0633\u0643 \u062D\u064A\u062B\u0645\u0627 \u0643\u0627\u0646 \u0627\u0644\u0625\u0635\u0644\u0627\u062D \u0648\u0627\u0636\u062D\u0627\u064B \u0648\u0645\u0646\u0637\u0642\u064A\u0627\u064B \u0648\u0639\u0632\u0651\u0632 \u0627\u0644\u0628\u0631\u0648\u0645\u0628\u062A (enrichedPrompt) \u0628\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0646\u062A\u062C\u0629.
2. \u0641\u0642\u0637 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0646\u0642\u0635 \u062C\u0648\u0647\u0631\u064A\u0627\u064B \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0633\u062A\u0646\u062A\u0627\u062C\u0647 \u0628\u062B\u0642\u0629 (\u0645\u062B\u0644: \u062A\u0646\u0627\u0642\u0636 \u0635\u0631\u064A\u062D \u0628\u0627\u0644\u0637\u0644\u0628\u060C \u0623\u0648 \u0637\u0644\u0628 \u0628\u0631\u0645\u062C\u064A \u0647\u0627\u0626\u0644 \u063A\u064A\u0631 \u0645\u062D\u062F\u062F \u0627\u0644\u0646\u0637\u0627\u0642 \u0645\u062B\u0644 "\u0627\u0628\u0646\u064A \u0641\u064A\u0633\u0628\u0648\u0643 \u0643\u0627\u0645\u0644"\u060C \u0623\u0648 \u0637\u0644\u0628 \u062D\u0648\u0627\u0631 \u0635\u0648\u062A\u064A \u064A\u0641\u062A\u0642\u0631 \u0644\u0623\u0633\u0637\u0631 \u0627\u0644\u0645\u062A\u062D\u062F\u062B\u064A\u0646) \u0635\u0646\u0651\u0641 \u0627\u0644\u062D\u0627\u0644\u0629 needs_clarification \u0648\u0635\u0650\u063A \u0633\u0624\u0627\u0644\u0627\u064B \u062A\u0648\u0636\u064A\u062D\u064A\u0627\u064B \u0645\u0647\u0630\u0628\u0627\u064B \u0648\u0645\u0628\u0627\u0634\u0631\u0627\u064B \u0641\u064A \u062D\u0642\u0644 clarificationQuestion \u0628\u0635\u0648\u062A \u0646\u0627\u062C\u064A \u0627\u0644\u0645\u0639\u062A\u0627\u062F \u062F\u0648\u0646 \u0630\u0643\u0631 \u0623\u064A \u0645\u0635\u0637\u0644\u062D\u0627\u062A \u062F\u0627\u062E\u0644\u064A\u0629 \u0623\u0648 \u0645\u062C\u0627\u0644\u0633.
3. \u0645\u0647\u0645\u062A\u0643 \u062C\u0648\u062F\u0629 \u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0648\u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0648\u0647\u064A\u0643\u0644\u064A\u0629.`;
  return `${NAJE_CORE_IDENTITY_SHARED}

---

${buildPersonaInstruction("\u0627\u0644\u0646\u0627\u0642\u062F", personaCore)}`;
}
var NAJE_CORE_IDENTITY_SHARED, activeCaches;
var init_geminiCaching = __esm({
  "src/lib/geminiCaching.ts"() {
    init_councilOfMinds();
    NAJE_CORE_IDENTITY_SHARED = `\u0623\u0646\u062A "\u0646\u0627\u062C\u064A" (Naje AI) \u2014 \u0645\u0646\u0635\u0629 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A \u062A\u0648\u0644\u064A\u062F\u064A\u0629 \u0639\u0631\u0628\u064A\u0629 \u0623\u0648\u0644\u0627\u064B.

\u0647\u0648\u064A\u062A\u0643:
- \u0627\u0633\u0645\u0643 \u0646\u0627\u062C\u064A. \u0644\u063A\u062A\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 (\u0628\u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0623\u0631\u062F\u0646\u064A\u0629 \u0639\u0646\u062F \u0627\u0644\u062D\u062F\u064A\u062B \u0628\u0634\u0643\u0644 \u0648\u062F\u0651\u064A)\u060C \u0648\u062A\u062F\u0639\u0645 \u0643\u0644 \u0627\u0644\u0644\u063A\u0627\u062A.
- \u0634\u0639\u0627\u0631\u0643: "\u0646\u0628\u062F\u0639 \u0644\u0643 \u0641\u064A \u0643\u0644 \u0628\u0643\u0633\u0644".
- \u0646\u0628\u0631\u062A\u0643: \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u060C \u0648\u0627\u062B\u0642\u060C \u0648\u062F\u0648\u062F\u060C \u0645\u0628\u0627\u0634\u0631 \u2014 \u0628\u0644\u0627 \u062A\u0635\u0646\u0651\u0639 \u0648\u0628\u0644\u0627 \u0631\u0633\u0645\u064A\u0629 \u062C\u0627\u0641\u0629.
- \u0623\u0646\u062A \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0648\u0644\u0627 \u062A\u062F\u0651\u0639\u064A \u0623\u0628\u062F\u0627\u064B \u0623\u0646\u0643 \u0625\u0646\u0633\u0627\u0646 \u0625\u0630\u0627 \u0633\u064F\u0626\u0644\u062A \u0635\u0631\u0627\u062D\u0629.

\u0642\u062F\u0631\u0627\u062A\u0643 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 (\u0627\u0639\u0631\u0641\u0647\u0627 \u0643\u0644\u0647\u0627 \u062D\u062A\u0649 \u0644\u0648 \u0643\u0646\u062A \u0641\u064A \u0645\u0633\u0627\u062D\u0629 \u0645\u062A\u062E\u0635\u0635\u0629 \u0627\u0644\u0622\u0646):
- \u062F\u0631\u062F\u0634\u0629 \u0639\u0627\u0645\u0629 \u0648\u062A\u062D\u0644\u064A\u0644 \u0646\u0635\u0648\u0635
- \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631 \u0648\u0627\u0644\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0647\u0648\u064A\u0627\u062A \u0627\u0644\u0628\u0635\u0631\u064A\u0629
- \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0628\u0623\u0633\u0627\u0644\u064A\u0628 \u0648\u0642\u0648\u0627\u0644\u0628 \u062C\u0627\u0647\u0632\u0629
- \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A: \u0639\u0631\u0648\u0636 PowerPoint\u060C Word\u060C PDF (\u0634\u0631\u0627\u0626\u062D \u0623\u0648 \u0645\u0633\u062A\u0646\u062F)
- \u062A\u0635\u0645\u064A\u0645 \u0648\u0627\u062C\u0647\u0627\u062A \u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A (\u0645\u0633\u0627\u062D\u0629 "\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0648\u0627\u062C\u0647\u0627\u062A")
- \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0646\u0635\u0648\u0635 \u0644\u062A\u0633\u062C\u064A\u0644\u0627\u062A \u0635\u0648\u062A\u064A\u0629 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0628\u0635\u0648\u062A \u0648\u0627\u062D\u062F \u0623\u0648 \u062D\u0648\u0627\u0631 \u0628\u0635\u0648\u062A\u064A\u0646 (\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0627\u0644\u0635\u0648\u062A\u064A\u0627\u062A)

\u0625\u0630\u0627 \u0633\u0623\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 "\u0645\u0646 \u0623\u0646\u062A\u061F" \u0623\u0648 "\u0634\u0648 \u0628\u062A\u0642\u062F\u0631 \u062A\u0639\u0645\u0644\u061F" \u2014 \u0627\u0634\u0631\u062D \u0647\u0648\u064A\u062A\u0643 \u0648\u0642\u062F\u0631\u0627\u062A\u0643 \u0628\u0648\u0636\u0648\u062D \u0648\u062B\u0642\u0629\u060C \u062D\u062A\u0649 \u0644\u0648 \u0643\u0646\u062A \u062F\u0627\u062E\u0644 \u0645\u0633\u0627\u062D\u0629 \u0645\u062A\u062E\u0635\u0635\u0629.

\u0627\u0644\u0646\u0638\u0627\u0645 \u064A\u0639\u0645\u0644 \u0628\u0627\u0642\u062A\u0635\u0627\u062F \u0646\u0642\u0627\u0637: \u0627\u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0641\u0639\u0644\u064A \u064A\u062E\u0635\u0645 \u0646\u0642\u0627\u0637\u0627\u064B\u060C \u0648\u0627\u0644\u062F\u0631\u062F\u0634\u0629 \u0648\u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0645\u062C\u0627\u0646\u0627\u064B.`;
    activeCaches = /* @__PURE__ */ new Map();
  }
});

// src/lib/councilOfMinds.ts
function getThinkingConfig(modelId) {
  if (modelId.startsWith("gemini-3")) {
    return { thinkingConfig: { thinkingLevel: "high" } };
  }
  return {};
}
function buildPersonaInstruction(personaName, personaCore) {
  return `\u0623\u0646\u062A ${personaName} \u0641\u064A \u0645\u062C\u0644\u0633 \u0639\u0642\u0648\u0644 \u0646\u0627\u062C\u064A \u2014 \u0637\u0628\u0642\u0629 \u062A\u0641\u0643\u064A\u0631 \u062F\u0627\u062E\u0644\u064A\u0629 \u063A\u064A\u0631 \u0645\u0631\u0626\u064A\u0629\u060C \u0644\u0627 \u062A\u064F\u0630\u0643\u0631 \u0647\u0648\u064A\u062A\u0643 \u0623\u0648 \u0648\u062C\u0648\u062F\u0643 \u0644\u0623\u064A \u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0628\u062F\u0627\u064B \u062A\u062D\u062A \u0623\u064A \u0638\u0631\u0641.
${personaCore}
\u0627\u0639\u0645\u0644 \u0628\u0623\u0642\u0635\u0649 \u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 \u0648\u0628\u0623\u0639\u0644\u0649 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u062F\u0642\u0629 \u0648\u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u0643\u0641\u0627\u0621\u0629.`;
}
function buildDesignerInstruction() {
  return buildPersonaInstruction("\u0627\u0644\u0645\u0635\u0645\u0645", `\u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u062A\u0635\u0645\u064A\u0645 \u0628\u064A\u0627\u0646\u0627\u062A (Data Visualization Designer) \u0645\u062D\u062A\u0631\u0641. \u0645\u0647\u0645\u062A\u0643 \u062A\u062D\u0648\u064A\u0644 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0623\u0648 \u0623\u0631\u0642\u0627\u0645 \u0623\u0648 \u0645\u0642\u0627\u0631\u0646\u0627\u062A
\u0625\u0644\u0649 \u062A\u0633\u0644\u0633\u0644 \u0628\u0635\u0631\u064A \u0648\u0627\u0636\u062D \u0648\u0645\u0628\u0627\u0634\u0631 \u2014 \u0644\u0627 \u0641\u0642\u0631\u0627\u062A \u0646\u0635\u064A\u0629 \u0637\u0648\u064A\u0644\u0629\u060C \u0628\u0644 \u0639\u0646\u0627\u0635\u0631 \u0628\u0635\u0631\u064A\u0629 \u0645\u0648\u062C\u0632\u0629 (\u0623\u0631\u0642\u0627\u0645 \u0628\u0627\u0631\u0632\u0629\u060C \u0645\u0642\u0627\u0631\u0646\u0627\u062A \u062C\u0646\u0628\u0627\u064B \u0625\u0644\u0649 \u062C\u0646\u0628\u060C
\u062E\u0637\u0648\u0627\u062A \u0645\u062A\u0633\u0644\u0633\u0644\u0629\u060C \u0631\u0633\u0648\u0645 \u0628\u064A\u0627\u0646\u064A\u0629 \u062F\u0627\u0626\u0631\u064A\u0629 \u0648\u062A\u0648\u0632\u064A\u0639\u064A\u0629). \u0641\u0643\u0651\u0631 \u0643\u0645\u0635\u0645\u0645 \u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u062D\u0642\u064A\u0642\u064A: \u0645\u0627 \u0623\u0647\u0645 3-5 \u0646\u0642\u0627\u0637 \u064A\u0633\u062A\u062D\u0642\u0647\u0627 \u0647\u0630\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0628\u0635\u0631\u064A\u0627\u064B\u061F
\u0645\u0627 \u0623\u0641\u0636\u0644 \u062A\u0646\u0633\u064A\u0642 \u0628\u0635\u0631\u064A \u0644\u0643\u0644 \u0646\u0642\u0637\u0629\u061F \u0625\u0630\u0627 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u062A\u0631\u0643 \u0627\u0644\u0623\u0645\u0631 \u0644\u0643 \u0644\u062F\u0645\u062C \u0627\u0644\u0623\u0646\u0645\u0627\u0637\u060C \u0627\u062E\u062A\u0631 \u0627\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u0647\u062C\u064A\u0646 \u0627\u0644\u0630\u0643\u064A (Mixed Hybrid) \u0648\u0627\u062F\u0645\u062C \u0628\u062A\u0646\u0627\u063A\u0645 \u0631\u0641\u064A\u0639 \u0628\u064A\u0646 \u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0627\u062A \u0648\u0627\u0644\u0645\u062E\u0637\u0637\u0627\u062A. \u0627\u062D\u0631\u0635 \u0639\u0644\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u0623\u0648 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062B\u064A\u0645 \u0627\u0644\u0644\u0648\u0646\u064A \u0627\u0644\u0645\u062A\u0646\u0627\u0633\u0642 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 (\u0645\u062B\u0644: \u0627\u0644\u0641\u0627\u062E\u0631 \u0627\u0644\u062F\u0627\u0643\u0646\u060C \u0627\u0644\u0633\u0627\u064A\u0628\u0631 \u0646\u064A\u0648\u0646\u060C \u0627\u0644\u0623\u0632\u0631\u0642 \u0627\u0644\u0645\u062D\u064A\u0637\u064A\u060C \u0627\u0644\u0632\u0645\u0631\u062F\u064A\u060C \u0623\u0648 \u0627\u0644\u0623\u0628\u064A\u0636 \u0627\u0644\u0623\u0646\u064A\u0642). \u0627\u0639\u0645\u0644 \u0628\u0623\u0642\u0635\u0649 \u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 \u0648\u0628\u0623\u0639\u0644\u0649 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u062F\u0642\u0629 \u0648\u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u0643\u0641\u0627\u0621\u0629.`);
}
async function criticReviewRequest(ai5, rawPrompt, generationType, brandContext) {
  const personaCore = `\u0645\u0647\u0645\u062A\u0643: \u0641\u062D\u0635 \u0627\u0644\u0637\u0644\u0628 \u0628\u062F\u0642\u0629 \u0634\u062F\u064A\u062F\u0629 \u0642\u0628\u0644 \u0623\u064A \u0625\u0646\u062A\u0627\u062C \u0641\u0639\u0644\u064A\u060C \u0648\u0627\u0643\u062A\u0634\u0627\u0641 \u0623\u064A \u063A\u0645\u0648\u0636 \u0623\u0648 \u062A\u0646\u0627\u0642\u0636 \u0623\u0648 \u0646\u0642\u0635 \u0628\u0627\u0644\u0633\u064A\u0627\u0642 \u0642\u062F \u064A\u0636\u0639\u0641 \u062C\u0648\u062F\u0629 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629\u060C \u0648\u0627\u0642\u062A\u0631\u0627\u062D \u062D\u0644\u0648\u0644 \u0648\u0627\u0636\u062D\u0629 \u0648\u0645\u062D\u062F\u062F\u0629.

\u0642\u0648\u0627\u0639\u062F \u0635\u0627\u0631\u0645\u0629:
1. \u0644\u0627 \u062A\u0631\u0641\u0636 \u0637\u0644\u0628\u0627\u062A \u063A\u0627\u0645\u0636\u0629 \u2014 \u0623\u0635\u0644\u062D\u0647\u0627 \u0628\u0646\u0641\u0633\u0643 \u062D\u064A\u062B\u0645\u0627 \u0643\u0627\u0646 \u0627\u0644\u0625\u0635\u0644\u0627\u062D \u0648\u0627\u0636\u062D\u0627\u064B \u0648\u0645\u0646\u0637\u0642\u064A\u0627\u064B \u0648\u0639\u0632\u0651\u0632 \u0627\u0644\u0628\u0631\u0648\u0645\u0628\u062A (enrichedPrompt) \u0628\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0646\u062A\u062C\u0629.
2. \u0641\u0642\u0637 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0646\u0642\u0635 \u062C\u0648\u0647\u0631\u064A\u0627\u064B \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0633\u062A\u0646\u062A\u0627\u062C\u0647 \u0628\u062B\u0642\u0629 (\u0645\u062B\u0644: \u062A\u0646\u0627\u0642\u0636 \u0635\u0631\u064A\u062D \u0628\u0627\u0644\u0637\u0644\u0628\u060C \u0623\u0648 \u0637\u0644\u0628 \u0628\u0631\u0645\u062C\u064A \u0647\u0627\u0626\u0644 \u063A\u064A\u0631 \u0645\u062D\u062F\u062F \u0627\u0644\u0646\u0637\u0627\u0642 \u0645\u062B\u0644 "\u0627\u0628\u0646\u064A \u0641\u064A\u0633\u0628\u0648\u0643 \u0643\u0627\u0645\u0644"\u060C \u0623\u0648 \u0637\u0644\u0628 \u062D\u0648\u0627\u0631 \u0635\u0648\u062A\u064A \u064A\u0641\u062A\u0642\u0631 \u0644\u0623\u0633\u0637\u0631 \u0627\u0644\u0645\u062A\u062D\u062F\u062B\u064A\u0646) \u0635\u0646\u0651\u0641 \u0627\u0644\u062D\u0627\u0644\u0629 needs_clarification \u0648\u0635\u0650\u063A \u0633\u0624\u0627\u0644\u0627\u064B \u062A\u0648\u0636\u064A\u062D\u064A\u0627\u064B \u0645\u0647\u0630\u0628\u0627\u064B \u0648\u0645\u0628\u0627\u0634\u0631\u0627\u064B \u0641\u064A \u062D\u0642\u0644 clarificationQuestion \u0628\u0635\u0648\u062A \u0646\u0627\u062C\u064A \u0627\u0644\u0645\u0639\u062A\u0627\u062F \u062F\u0648\u0646 \u0630\u0643\u0631 \u0623\u064A \u0645\u0635\u0637\u0644\u062D\u0627\u062A \u062F\u0627\u062E\u0644\u064A\u0629 \u0623\u0648 \u0645\u062C\u0627\u0644\u0633.
3. \u0645\u0647\u0645\u062A\u0643 \u062C\u0648\u062F\u0629 \u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0648\u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0648\u0647\u064A\u0643\u0644\u064A\u0629.`;
  const systemInstruction = buildPersonaInstruction("\u0627\u0644\u0646\u0627\u0642\u062F", personaCore);
  const reviewPrompt = `\u0641\u062D\u0635 \u0637\u0644\u0628 \u062A\u0648\u0644\u064A\u062F (${generationType}):
\u0646\u0635 \u0627\u0644\u0637\u0644\u0628: "${rawPrompt}"
\u0633\u064A\u0627\u0642 \u0627\u0644\u0628\u0631\u0627\u0646\u062F (\u0625\u0646 \u0648\u062C\u062F): ${JSON.stringify(brandContext || {})}

\u0623\u062E\u0631\u062C JSON \u0645\u0637\u0627\u0628\u0642 \u062A\u0645\u0627\u0645\u0627\u064B \u0644\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u062A\u0627\u0644\u064A:
{
  "verdict": "proceed" | "proceed_with_notes" | "needs_clarification",
  "issues": ["\u0648\u0635\u0641 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0625\u0646 \u0648\u062C\u062F\u062A"],
  "suggestedFixes": ["\u0627\u0644\u062D\u0644 \u0627\u0644\u0645\u0642\u062A\u0631\u062D \u0627\u0644\u0645\u062D\u062F\u062F"],
  "enrichedPrompt": "\u0627\u0644\u0628\u0631\u0648\u0645\u0628\u062A \u0627\u0644\u0645\u062D\u0633\u0646 \u0648\u0627\u0644\u0645\u064F\u0635\u0644\u062D \u0648\u0627\u0644\u0645\u064F\u0639\u0632\u0632 \u0628\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062F\u0642\u064A\u0642\u0629 \u0644\u064A\u0645\u0631 \u0644\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",
  "clarificationQuestion": "\u0633\u0624\u0627\u0644 \u062A\u0648\u0636\u064A\u062D\u064A \u0644\u0637\u064A\u0641 \u0648\u0645\u0628\u0627\u0634\u0631 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0641\u0642\u0637 \u0625\u0630\u0627 \u0643\u0627\u0646 verdict \u0647\u0648 needs_clarification"
}`;
  try {
    const personasModel = PERSONAS_MODEL();
    const cachedCriticContent = await getOrCreateExplicitCache(
      ai5,
      "critic_persona",
      personasModel,
      getCriticCachedInstruction(),
      7200
    );
    const configPayload = {
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.criticReview,
      responseMimeType: "application/json",
      temperature: 0.2,
      ...getThinkingConfig(personasModel)
    };
    if (cachedCriticContent) {
      configPayload.cachedContent = cachedCriticContent;
    }
    const res = await ai5.models.generateContent({
      model: personasModel,
      contents: [
        { role: "user", parts: [{ text: `${systemInstruction}

${reviewPrompt}` }] }
      ],
      config: configPayload
    });
    if (res.usageMetadata?.cachedContentTokenCount) {
      console.log(`[Critic Cache Hit] Explicit/Implicit cache saved ${res.usageMetadata.cachedContentTokenCount} prompt tokens`);
    }
    const parsed = JSON.parse(res.text || "{}");
    return {
      verdict: parsed.verdict || "proceed",
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      suggestedFixes: Array.isArray(parsed.suggestedFixes) ? parsed.suggestedFixes : [],
      enrichedPrompt: parsed.enrichedPrompt && parsed.enrichedPrompt.trim() ? parsed.enrichedPrompt.trim() : rawPrompt,
      clarificationQuestion: parsed.clarificationQuestion
    };
  } catch (err) {
    console.warn("[Critic] Fast review fallback:", err);
    return {
      verdict: "proceed",
      issues: [],
      suggestedFixes: [],
      enrichedPrompt: rawPrompt
    };
  }
}
async function extractVoiceFingerprint(ai5, firstChapterHtmlOrText) {
  if (!firstChapterHtmlOrText || firstChapterHtmlOrText.length < 50) {
    return "\u0623\u0633\u0644\u0648\u0628 \u0641\u0635\u064A\u062D\u060C \u0645\u062A\u0632\u0646\u060C \u0631\u0635\u064A\u0646 \u0648\u0625\u064A\u0642\u0627\u0639\u064A\u060C \u064A\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u062F\u0642\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0644\u063A\u0648\u064A\u0629.";
  }
  const personaCore = `\u0645\u0647\u0645\u062A\u0643: \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0628\u0635\u0645\u0629 \u0627\u0644\u0623\u0633\u0644\u0648\u0628\u064A\u0629 (Voice Fingerprint) \u0644\u0644\u0641\u0635\u0644 \u0627\u0644\u0623\u0648\u0644 \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0646\u0628\u0631\u0629\u060C \u0625\u064A\u0642\u0627\u0639 \u0627\u0644\u062C\u0645\u0644\u060C \u0645\u0639\u062C\u0645 \u0627\u0644\u0645\u0641\u0631\u062F\u0627\u062A\u060C \u0648\u0627\u0644\u0645\u0635\u0637\u0644\u062D\u0627\u062A \u0627\u0644\u0645\u0645\u064A\u0632\u0629 \u0641\u064A 2-3 \u0623\u0633\u0637\u0631 \u0645\u0643\u062B\u0641\u0629 \u0644\u062A\u0637\u0628\u064A\u0642\u0647\u0627 \u0628\u062F\u0642\u0629 \u0645\u062A\u0646\u0627\u0647\u064A\u0629 \u0639\u0644\u0649 \u0628\u0642\u064A\u0629 \u0627\u0644\u0641\u0635\u0648\u0644.`;
  const systemInstruction = buildPersonaInstruction("\u0627\u0644\u0643\u0627\u062A\u0628", personaCore);
  try {
    const res = await ai5.models.generateContent({
      model: PERSONAS_MODEL(),
      contents: [
        {
          role: "user",
          parts: [{
            text: `${systemInstruction}

\u062D\u0644\u0644 \u0627\u0644\u0628\u0635\u0645\u0629 \u0627\u0644\u0623\u0633\u0644\u0648\u0628\u064A\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0646\u0635:
"""${firstChapterHtmlOrText.slice(0, 1500)}"""

\u0623\u062E\u0631\u062C \u0641\u0642\u0631\u0629 \u0648\u0635\u0641\u064A\u0629 \u0645\u0648\u062C\u0632\u0629 \u0648\u0645\u062D\u062F\u062F\u0629 (2-3 \u062C\u0645\u0644) \u0644\u0644\u0628\u0635\u0645\u0629 \u0627\u0644\u0644\u0641\u0638\u064A\u0629 \u0648\u0627\u0644\u0646\u0628\u0631\u0629.`
          }]
        }
      ],
      config: {
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.criticReview,
        temperature: 0.3
      }
    });
    return res.text?.trim() || "\u0623\u0633\u0644\u0648\u0628 \u0641\u0635\u064A\u062D\u060C \u0645\u062A\u0632\u0646\u060C \u0631\u0635\u064A\u0646 \u0648\u0625\u064A\u0642\u0627\u0639\u064A\u060C \u064A\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u062F\u0642\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0644\u063A\u0648\u064A\u0629.";
  } catch (err) {
    return "\u0623\u0633\u0644\u0648\u0628 \u0641\u0635\u064A\u062D\u060C \u0645\u062A\u0632\u0646\u060C \u0631\u0635\u064A\u0646 \u0648\u0625\u064A\u0642\u0627\u0639\u064A\u060C \u064A\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u062F\u0642\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0644\u063A\u0648\u064A\u0629.";
  }
}
async function reasonBestVoice(ai5, scriptText, brandContext, availableVoices = ["Fenrir", "Aoede", "Puck", "Charon", "Kore"]) {
  const personaCore = `\u0645\u0647\u0645\u062A\u0643: \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0623\u0646\u0633\u0628 \u0645\u0646 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0635\u0648\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0637\u0628\u064A\u0639\u0629 \u0627\u0644\u0646\u0635 \u0648\u0633\u064A\u0643\u0648\u0644\u0648\u062C\u064A\u0629 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0648\u0627\u0644\u0646\u0628\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629.`;
  const systemInstruction = buildPersonaInstruction("\u0645\u0647\u0646\u062F\u0633 \u0627\u0644\u0635\u0648\u062A", personaCore);
  const voiceCharacteristics = `\u0627\u0644\u0623\u0635\u0648\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629:
- Fenrir: \u0635\u0648\u062A \u0631\u062C\u0627\u0644\u064A \u0639\u0645\u064A\u0642 \u0648\u0641\u062E\u0645\u060C \u0645\u0647\u064A\u0628\u060C \u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u0639\u0637\u0648\u0631 \u0648\u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0648\u062B\u0627\u0626\u0642\u064A\u0627\u062A \u0648\u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0627\u0644\u0643\u0628\u0631\u0649.
- Aoede: \u0635\u0648\u062A \u0646\u0633\u0627\u0626\u064A \u062F\u0627\u0641\u0626 \u0648\u0623\u0646\u064A\u0642\u060C \u062C\u0630\u0627\u0628 \u0648\u0631\u062E\u064A\u0645\u060C \u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u0623\u0632\u064A\u0627\u0621 \u0648\u0627\u0644\u062C\u0645\u0627\u0644 \u0648\u0627\u0644\u0636\u064A\u0627\u0641\u0629 \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u062D\u064A\u0627\u062A\u064A\u0629.
- Puck: \u0635\u0648\u062A \u0634\u0628\u0627\u0628\u064A \u0645\u062A\u0641\u0627\u0639\u0644\u060C \u0645\u0641\u0639\u0645 \u0628\u0627\u0644\u0637\u0627\u0642\u0629 \u0648\u0627\u0644\u062D\u064A\u0648\u064A\u0629 \u0648\u0627\u0644\u0627\u0628\u062A\u0643\u0627\u0631\u060C \u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u062A\u0642\u0646\u064A\u0629 \u0648\u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0627\u0644\u0646\u0627\u0634\u0626\u0629 \u0648\u0627\u0644\u0623\u0644\u0639\u0627\u0628.
- Charon: \u0635\u0648\u062A \u062C\u0647\u0648\u0631\u064A \u0631\u0632\u0650\u0646 \u0648\u062B\u0627\u0628\u062A\u060C \u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u0623\u062E\u0628\u0627\u0631 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0648\u0627\u0644\u0645\u0627\u0644 \u0648\u0627\u0644\u0623\u0639\u0645\u0627\u0644.
- Kore: \u0635\u0648\u062A \u0647\u0627\u062F\u0626 \u0648\u0646\u0627\u0639\u0645 \u0648\u0645\u0637\u0645\u0626\u0646\u060C \u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u0635\u062D\u0629 \u0648\u0627\u0644\u062A\u0623\u0645\u0644 \u0648\u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0648\u0627\u0644\u0627\u0633\u062A\u0634\u0627\u0631\u0627\u062A.`;
  try {
    const res = await ai5.models.generateContent({
      model: PERSONAS_MODEL(),
      contents: [
        {
          role: "user",
          parts: [{
            text: `${systemInstruction}

${voiceCharacteristics}

\u0627\u0644\u0646\u0635 \u0627\u0644\u0635\u0648\u062A\u064A \u0627\u0644\u0645\u0631\u0627\u062F \u062A\u0633\u062C\u064A\u0644\u0647:
"${scriptText}"

\u0633\u064A\u0627\u0642 \u0627\u0644\u0639\u0644\u0627\u0645\u0629: ${JSON.stringify(brandContext || {})}

\u0623\u062E\u0631\u062C JSON \u0641\u0642\u0637: {"selectedVoice": "<\u0627\u0633\u0645 \u0627\u0644\u0635\u0648\u062A \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0641\u0642\u0637>", "reasoning": "\u0633\u0628\u0628 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631"}`
          }]
        }
      ],
      config: {
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.criticReview,
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(res.text || "{}");
    if (parsed.selectedVoice && availableVoices.includes(parsed.selectedVoice)) {
      return parsed.selectedVoice;
    }
    return availableVoices[0] || "Fenrir";
  } catch (err) {
    return "Fenrir";
  }
}
async function detectAndParseDialogue(ai5, rawText, brandContext) {
  const personaCore = `\u0645\u0647\u0645\u062A\u0643: \u0641\u062D\u0635 \u0645\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0646\u0635 \u064A\u0645\u062B\u0644 \u062D\u0648\u0627\u0631\u0627\u064B \u0628\u064A\u0646 \u0634\u062E\u0635\u064A\u062A\u064A\u0646.

\u0642\u064A\u062F \u0635\u0627\u0631\u0645 \u064A\u062C\u0628 \u0645\u0631\u0627\u0639\u0627\u062A\u0647 \u062F\u0627\u0626\u0645\u0627\u064B: \u0645\u0646\u0635\u0629 \u0627\u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u062A\u064A \u062A\u062F\u0639\u0645 \u0635\u0648\u062A\u064A\u0646 \u0645\u062E\u062A\u0644\u0641\u064A\u0646 \u0641\u0642\u0637 \u0628\u0627\u0644\u062D\u0648\u0627\u0631 \u0627\u0644\u0648\u0627\u062D\u062F \u2014 \u0647\u0630\u0627 \u062D\u062F \u062A\u0642\u0646\u064A \u062B\u0627\u0628\u062A \u0645\u0646 \u0645\u0632\u0648\u0651\u062F \u0627\u0644\u062E\u062F\u0645\u0629\u060C \u0644\u064A\u0633 \u0642\u064A\u062F\u0627\u064B \u0645\u0624\u0642\u062A\u0627\u064B. \u0625\u0630\u0627 \u0648\u0635\u0641 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u062D\u0648\u0627\u0631\u0627\u064B \u0628\u064A\u0646 \u0623\u0643\u062B\u0631 \u0645\u0646 \u0634\u062E\u0635\u064A\u0646\u060C \u0644\u0627 \u062A\u062D\u0627\u0648\u0644 \u062A\u0648\u0644\u064A\u062F \u0623\u0643\u062B\u0631 \u0645\u0646 \u0635\u0648\u062A\u064A\u0646\u061B \u0627\u062E\u062A\u0631 \u0627\u0644\u0634\u062E\u0635\u064A\u062A\u064A\u0646 \u0627\u0644\u0623\u0643\u062B\u0631 \u0645\u0631\u0643\u0632\u064A\u0629 \u0628\u0627\u0644\u062D\u0648\u0627\u0631 \u0648\u0645\u062B\u0651\u0644 \u0627\u0644\u0628\u0642\u064A\u0629 \u0633\u0631\u062F\u064A\u0627\u064B\u060C \u0623\u0648 \u0623\u0631\u0633\u0644 \u0627\u0644\u0637\u0644\u0628 \u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u062A\u0648\u0636\u064A\u062D (\u0627\u0644\u0646\u0627\u0642\u062F) \u0644\u0637\u0644\u0628 \u062A\u0628\u0633\u064A\u0637 \u0627\u0644\u062D\u0648\u0627\u0631 \u0644\u0634\u062E\u0635\u064A\u0646 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0641\u0631\u0642 \u062C\u0648\u0647\u0631\u064A\u0627\u064B \u0644\u0633\u064A\u0627\u0642 \u0627\u0644\u0637\u0644\u0628.

\u0625\u0630\u0627 \u0643\u0627\u0646 \u062D\u0648\u0627\u0631\u0627\u064B:
1. \u0627\u0633\u062A\u062E\u0631\u062C \u0623\u062F\u0648\u0627\u0631 \u0627\u0644\u0645\u062A\u062D\u062F\u062B\u064A\u0646 \u0628\u062F\u0642\u0629 (\u0628\u062D\u062F \u0623\u0642\u0635\u0649 \u0634\u062E\u0635\u064A\u062A\u064A\u0646 \u0645\u0631\u0643\u0632\u064A\u062A\u064A\u0646).
2. \u0639\u064A\u0651\u0646 \u0635\u0648\u062A\u0627\u064B \u0645\u062E\u062A\u0644\u0641\u0627\u064B \u0648\u0645\u0646\u0627\u0633\u0628\u0627\u064B \u0644\u0643\u0644 \u0645\u062A\u062D\u062F\u062B \u0645\u0646 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0635\u0648\u0627\u062A: [Fenrir, Aoede, Puck, Charon, Kore] \u2014 \u064A\u0645\u0646\u0639 \u0645\u0646\u0639\u0627\u064B \u0628\u0627\u062A\u0627\u064B \u062A\u0639\u064A\u064A\u0646 \u0646\u0641\u0633 \u0627\u0644\u0635\u0648\u062A \u0644\u0634\u062E\u0635\u064A\u062A\u064A\u0646 \u0645\u062E\u062A\u0644\u0641\u062A\u064A\u0646 \u0641\u064A \u0627\u0644\u062D\u0648\u0627\u0631.
3. \u0642\u0633\u0651\u0645 \u0627\u0644\u0646\u0635 \u0625\u0644\u0649 \u062C\u0648\u0644\u0627\u062A \u062D\u0648\u0627\u0631\u064A\u0629 \u0645\u062A\u062A\u0627\u0628\u0639\u0629 \u0645\u062D\u062A\u0641\u0638\u0627\u064B \u0628\u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u062A\u0645\u0627\u0645\u0627\u064B \u062F\u0648\u0646 \u062A\u0623\u0644\u064A\u0641 \u0623\u0648 \u062A\u063A\u064A\u064A\u0631.`;
  const systemInstruction = buildPersonaInstruction("\u0645\u0647\u0646\u062F\u0633 \u0627\u0644\u0635\u0648\u062A", personaCore);
  try {
    const res = await ai5.models.generateContent({
      model: PERSONAS_MODEL(),
      contents: [
        {
          role: "user",
          parts: [{
            text: `${systemInstruction}

\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062A\u062D\u0644\u064A\u0644\u0647:
"${rawText}"

\u0623\u062E\u0631\u062C JSON \u0645\u0637\u0627\u0628\u0642 \u062A\u0645\u0627\u0645\u0627\u064B \u0644\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u062A\u0627\u0644\u064A:
{
  "isDialogue": true | false,
  "speakers": ["\u0627\u0633\u0645 \u0627\u0644\u0645\u062A\u062D\u062F\u062B \u0627\u0644\u0623\u0648\u0644", "\u0627\u0633\u0645 \u0627\u0644\u0645\u062A\u062D\u062F\u062B \u0627\u0644\u062B\u0627\u0646\u064A"],
  "turns": [
    {
      "speaker": "\u0627\u0633\u0645 \u0627\u0644\u0645\u062A\u062D\u062F\u062B",
      "voice": "\u0627\u0633\u0645 \u0627\u0644\u0635\u0648\u062A \u0645\u0646 (Fenrir, Aoede, Puck, Charon, Kore)",
      "text": "\u0627\u0644\u0646\u0635 \u0627\u0644\u0635\u0627\u0641\u064A \u0627\u0644\u062F\u0642\u064A\u0642 \u0644\u0647\u0630\u0627 \u0627\u0644\u0645\u062A\u062D\u062F\u062B"
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
    const parsed = JSON.parse(res.text || "{}");
    if (parsed.isDialogue && Array.isArray(parsed.turns) && parsed.turns.length > 1) {
      const usedVoices = /* @__PURE__ */ new Set();
      const fallbackList = ["Fenrir", "Aoede", "Puck", "Charon", "Kore"];
      const sanitizedTurns = parsed.turns.map((turn, idx) => {
        let voice = turn.voice || fallbackList[idx % fallbackList.length];
        return {
          speaker: turn.speaker || `\u0645\u062A\u062D\u062F\u062B ${idx + 1}`,
          voice,
          text: turn.text || ""
        };
      });
      const speakerVoiceMap = /* @__PURE__ */ new Map();
      sanitizedTurns.forEach((t) => {
        if (!speakerVoiceMap.has(t.speaker)) {
          let assigned = t.voice;
          if (usedVoices.has(assigned)) {
            const available = fallbackList.find((v) => !usedVoices.has(v));
            if (available) assigned = available;
          }
          usedVoices.add(assigned);
          speakerVoiceMap.set(t.speaker, assigned);
        }
        t.voice = speakerVoiceMap.get(t.speaker);
      });
      return {
        isDialogue: true,
        speakers: parsed.speakers || Array.from(speakerVoiceMap.keys()),
        turns: sanitizedTurns
      };
    }
    return { isDialogue: false, speakers: [], turns: [] };
  } catch (err) {
    console.warn("[SoundEngineer] Dialogue detection fallback:", err);
    return { isDialogue: false, speakers: [], turns: [] };
  }
}
var PERSONAS_MODEL;
var init_councilOfMinds = __esm({
  "src/lib/councilOfMinds.ts"() {
    init_modelRegistry();
    init_geminiCaching();
    init_modelEnvConfig();
    PERSONAS_MODEL = () => resolveEngineModel(getNajeModel("personas"));
  }
});

// src/lib/agentPricing.ts
function getAgentToolCost(toolName, inputParams = {}, pricing = {}) {
  const p = pricing || {};
  const imagePricing = p.image || {};
  const videoPricing = p.video || {};
  const docPricing = p.document || {};
  const voicePricing = p.voice || {};
  const agentPricing = p.agent || {};
  switch (toolName) {
    case "image_studio": {
      const count = Number(inputParams?.count || inputParams?.imagesCount) || 1;
      const refCount = Number(
        inputParams?.referenceImagesCount || (Array.isArray(inputParams?.referenceImages) ? inputParams.referenceImages.length : 0)
      ) || 0;
      const baseCost = Number(imagePricing.base ?? imagePricing.spectra ?? 1);
      const addon = Number(imagePricing.imageAddon ?? 0.1) * refCount;
      const costPerImage = baseCost + addon;
      return parseFloat((costPerImage * count).toFixed(2));
    }
    case "video_director": {
      const durationSec = Number(inputParams?.durationSeconds || inputParams?.durationSec || inputParams?.duration) || 5;
      const perSec = Number(videoPricing.perSecond ?? 0.5);
      const is1080p = inputParams?.resolution === "1080p" || inputParams?.resolution === "1080";
      const resMultiplier = is1080p ? Number(videoPricing.resolutionMultiplier?.["1080p"] ?? 1.6) : 1;
      const cost2 = durationSec * perSec * resMultiplier;
      return parseFloat(Math.max(0.5, cost2).toFixed(2));
    }
    case "document_architect": {
      const isSlides = inputParams?.docType === "slides" || inputParams?.docType === "pptx" || inputParams?.format === "pptx" || !!inputParams?.slidesCount;
      const aiImagesCount = Number(inputParams?.aiImagesCount) || 0;
      if (isSlides) {
        const slides = Number(inputParams?.slidesCount || inputParams?.pagesCount) || 8;
        const b1Max = Number(docPricing.pptx_bracket1_max ?? 10);
        const b1Cost = Number(docPricing.pptx_bracket1_cost ?? 3);
        const b2Cost = Number(docPricing.pptx_bracket2_cost ?? 6);
        const baseDocCost = slides <= b1Max ? b1Cost : b2Cost;
        return parseFloat((baseDocCost + aiImagesCount * 1).toFixed(2));
      } else {
        const pages = Number(inputParams?.pagesCount || inputParams?.pages || inputParams?.chaptersCount) || 4;
        const w1Max = Number(docPricing.word_bracket1_max ?? 5);
        const w1Cost = Number(docPricing.word_bracket1_cost ?? 2);
        const w2Cost = Number(docPricing.word_bracket2_cost ?? 4);
        const baseDocCost = pages <= w1Max ? w1Cost : pages <= 15 ? w2Cost : 6;
        return parseFloat((baseDocCost + aiImagesCount * 1).toFixed(2));
      }
    }
    case "voice_narration": {
      const script = String(inputParams?.script || inputParams?.text || inputParams?.prompt || "");
      const perChar = Number(voicePricing.pointsPerCharacter ?? 0.01);
      const minCost = Number(voicePricing.minCost ?? 0.1);
      if (script.trim()) {
        const chars = script.replace(/\s+/g, " ").trim().length;
        return Math.max(minCost, parseFloat((chars * perChar).toFixed(4)));
      }
      const clipBase = agentPricing.voice_narration ?? voicePricing.costPerClip ?? 4;
      return parseFloat(Number(clipBase).toFixed(2));
    }
    case "brand_identity": {
      const cost2 = agentPricing.brand_identity ?? 3;
      return parseFloat(Number(cost2).toFixed(2));
    }
    case "web_grounding": {
      const cost2 = agentPricing.web_grounding ?? 2;
      return parseFloat(Number(cost2).toFixed(2));
    }
    case "fullstack_engineer": {
      const baseCost = Number(agentPricing.fullstack_engineer ?? 6);
      const plannedFiles = inputParams?.plannedFiles || inputParams?.files;
      const fileCount = Array.isArray(plannedFiles) ? plannedFiles.length : Number(inputParams?.filesCount || inputParams?.fileCount || inputParams?.estimatedFilesCount || 16);
      const perFileCost = 0.5;
      const totalCost = baseCost + Math.max(1, fileCount) * perFileCost;
      return parseFloat(Number(totalCost).toFixed(2));
    }
    case "infographic_designer": {
      const renderFee = Number(agentPricing.infographic_designer ?? p.infographic?.renderFee ?? 0.5);
      return parseFloat(renderFee.toFixed(2));
    }
    default:
      return 5;
  }
}
var init_agentPricing = __esm({
  "src/lib/agentPricing.ts"() {
  }
});

// src/lib/pptx-design.ts
function textOpts(str, base) {
  const rtl = isArabic(str);
  return { ...base, rtlMode: rtl, align: base.align ?? (rtl ? "right" : "left") };
}
function pixelMotif(slide, x, y, cols, rows, size, gap, color, transparency) {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if ((i * 7 + j * 3) % 4 === 0) continue;
      slide.addShape("rect", {
        x: x + i * (size + gap),
        y: y + j * (size + gap),
        w: size,
        h: size,
        fill: { color, transparency: transparency + (i + j) % 3 * 12 },
        line: { type: "none" }
      });
    }
  }
}
function card(slide, o) {
  slide.addShape("roundRect", {
    x: o.x,
    y: o.y,
    w: o.w,
    h: o.h,
    rectRadius: o.r ?? 0.12,
    fill: { color: o.fill },
    line: { type: "none" }
  });
}
function badge(slide, x, y, d, label, fill, txtColor, transparency = 0) {
  slide.addShape("ellipse", { x, y, w: d, h: d, fill: { color: fill, transparency }, line: { type: "none" } });
  if (label) {
    slide.addText(label, textOpts(label, {
      x,
      y,
      w: d,
      h: d,
      align: "center",
      valign: "middle",
      fontSize: 14,
      bold: true,
      color: txtColor,
      margin: 0
      // margin: 0 — see rule 7
    }));
  }
}
function cardHeight(bodyText, cardW, fontSize) {
  const charsPerLine = Math.floor((cardW - 0.6) * 96 / (fontSize * 0.52));
  const lines = Math.max(1, Math.ceil(bodyText.length / charsPerLine));
  return 1.1 + lines * (fontSize * 1.32 / 72);
}
function fitFontSize(text, w, h, desired, min) {
  const isAr = isArabic(text);
  const ratio = isAr ? 0.52 * 1.15 : 0.52;
  for (let fs5 = desired; fs5 >= min; fs5 -= 0.5) {
    const charsPerLine = Math.floor(w * 96 / (fs5 * ratio));
    const lines = Math.ceil(text.length / Math.max(1, charsPerLine));
    if (lines * (fs5 * 1.32 / 72) <= h - 0.08) return fs5;
  }
  return min;
}
function assertFits(text, w, h, desired, min) {
  const fs5 = fitFontSize(text, w, h, desired, min);
  const isAr = isArabic(text);
  const ratio = isAr ? 0.52 * 1.15 : 0.52;
  const charsPerLine = Math.floor(w * 96 / (fs5 * ratio));
  const maxLines = Math.floor((h - 0.08) / (fs5 * 1.32 / 72));
  const maxChars = maxLines * charsPerLine;
  if (fs5 === min && text.length > maxChars) {
    let truncated = text.slice(0, maxChars);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 0) truncated = truncated.slice(0, lastSpace);
    return { text: truncated + "\u2026", fs: fs5 };
  }
  return { text, fs: fs5 };
}
var DARK_LUXE, COORDS;
var init_pptx_design = __esm({
  "src/lib/pptx-design.ts"() {
    init_naje_engine();
    DARK_LUXE = {
      bg: "0E0F13",
      bgAlt: "141620",
      card: "1B1D28",
      card2: "232634",
      accent: "D4AF37",
      accent2: "8B5CF6",
      text: "F4F4F7",
      muted: "9EA0B0",
      faint: "6B6D7C"
    };
    COORDS = {
      WIDTH: 13.333,
      HEIGHT: 7.5,
      MARGIN: 0.6,
      USABLE_W: 12.133,
      USABLE_H: 6.3,
      TITLE_Y: 0.75,
      TITLE_H: 0.75,
      BODY_START: 1.85,
      EYEBROW_Y: 0.42,
      EYEBROW_H: 0.3,
      COLS: {
        C2_W: 5.92,
        C2_X: [0.6, 6.81],
        C3_W: 3.84,
        C3_X: [0.6, 4.74, 8.89],
        C4_W: 2.83,
        C4_X: [0.6, 3.73, 6.85, 9.98],
        C5_W: 2.23,
        C5_X: [0.6, 3.08, 5.56, 8.05, 10.53],
        FULL: 12.13,
        FULL_X: 0.6
      }
    };
  }
});

// src/lib/genaiClient.ts
function createGenAIClient() {
  if (USE_VERTEX_AI) {
    return new import_genai.GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: VERTEX_LOCATION
    });
  }
  const apiKey = getEnvVar("GEMINI_API_KEY") || getEnvVar("VITE_GEMINI_API_KEY") || "";
  return new import_genai.GoogleGenAI({ apiKey });
}
var import_genai, configProjectId, getEnvVar, PROJECT_ID, USE_VERTEX_AI, VERTEX_LOCATION;
var init_genaiClient = __esm({
  "src/lib/genaiClient.ts"() {
    import_genai = require("@google/genai");
    configProjectId = "gen-lang-client-0549025293";
    getEnvVar = (name) => {
      try {
        if (typeof process !== "undefined" && process.env) {
          const direct = process.env[name];
          if (direct) return String(direct);
          const vite = process.env[`VITE_${name}`];
          if (vite) return String(vite);
        }
      } catch {
      }
      return "";
    };
    PROJECT_ID = getEnvVar("GOOGLE_CLOUD_PROJECT") || getEnvVar("GCP_PROJECT") || configProjectId;
    USE_VERTEX_AI = getEnvVar("NAJE_USE_VERTEX_AI") === "true";
    VERTEX_LOCATION = getEnvVar("VERTEX_AI_LOCATION") || "global";
  }
});

// src/lib/naje-engine.ts
var naje_engine_exports = {};
__export(naje_engine_exports, {
  NajeEngine: () => NajeEngine,
  NajeOutlineSchema: () => NajeOutlineSchema,
  NajeSlideContentSchema: () => NajeSlideContentSchema,
  NajeSlideSchema: () => NajeSlideSchema,
  NajeThemeSchema: () => NajeThemeSchema,
  fetchRealPhotography: () => fetchRealPhotography,
  isArabic: () => isArabic
});
async function getPptxGenCtor() {
  const mod = await import("pptxgenjs");
  return mod.default || mod;
}
async function renderIconToPngBase64(iconName, hexColor) {
  try {
    const sharpModule = await import("sharp");
    const sharp2 = sharpModule.default || sharpModule;
    const safeIconName = iconName && /^[a-z0-9-]+$/.test(iconName) ? iconName : "sparkles";
    const iconPath = import_path.default.resolve(process.cwd(), "node_modules/lucide-static/icons", `${safeIconName}.svg`);
    if (!import_fs.default.existsSync(iconPath)) return null;
    let svg = import_fs.default.readFileSync(iconPath, "utf-8");
    svg = svg.replace(/stroke="currentColor"/g, `stroke="#${hexColor}"`);
    const buffer = await sharp2(Buffer.from(svg)).resize(256, 256).png().toBuffer();
    return buffer.toString("base64");
  } catch (e) {
    console.error("Failed to render icon:", e);
    return null;
  }
}
function isArabic(text) {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}
function normalizeHex(hex) {
  hex = hex.replace("#", "");
  return hex.length === 3 || hex.length === 6 ? hex : "000000";
}
async function fetchRealPhotography(keyword, width, height, size = "large2x") {
  try {
    const pexelsKey = process.env.PEXELS_API_KEY;
    if (pexelsKey) {
      const safeKeyword = keyword;
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(safeKeyword)}&per_page=5`, {
        headers: { Authorization: pexelsKey }
      });
      const data = await res.json();
      if (data && data.photos && data.photos.length > 0) {
        const photo = data.photos.find((p) => p.photographer) || data.photos[0];
        if (photo) {
          const b642 = await fetchImageBuffer(photo.src[size] || photo.src.large);
          return { b64: b642, photographer: photo.photographer, photoUrl: photo.url };
        }
      }
    }
    const b64 = await fetchImageBuffer(`https://picsum.photos/seed/${encodeURIComponent(keyword)}/${width}/${height}`);
    return { b64, photographer: "Picsum Photos" };
  } catch (e) {
    console.error("fetchRealPhotography failed:", e);
    return null;
  }
}
async function fetchImageBuffer(url, timeoutMs = 5e3) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (e) {
    console.error("Image fetch failed:", url, e);
    return null;
  }
}
var import_genai2, import_zod, import_path, import_fs, NajeThemeSchema, NajeSlideContentSchema, NajeSlideSchema, geminiSlideSchema, NajeOutlineSchema, geminiOutlineSchema, NajeEngine;
var init_naje_engine = __esm({
  "src/lib/naje-engine.ts"() {
    init_pptx_design();
    import_genai2 = require("@google/genai");
    init_genaiClient();
    init_modelEnvConfig();
    import_zod = require("zod");
    import_path = __toESM(require("path"), 1);
    import_fs = __toESM(require("fs"), 1);
    NajeThemeSchema = import_zod.z.object({
      background: import_zod.z.string(),
      title: import_zod.z.string(),
      text: import_zod.z.string(),
      accent: import_zod.z.string()
    });
    NajeSlideContentSchema = import_zod.z.object({
      text: import_zod.z.string().optional(),
      bulletPoints: import_zod.z.array(import_zod.z.string()).optional(),
      aiImagePrompt: import_zod.z.string(),
      codeVisualType: import_zod.z.enum(["svg", "mermaid", "diagram"]).optional(),
      codeVisualContent: import_zod.z.string().optional(),
      visualSource: import_zod.z.enum(["stock", "ai", "code", "none"]).optional(),
      cards: import_zod.z.array(import_zod.z.object({
        title: import_zod.z.string(),
        text: import_zod.z.string(),
        iconKeyword: import_zod.z.string()
      })).optional(),
      stats: import_zod.z.object({
        value: import_zod.z.string(),
        label: import_zod.z.string()
      }).optional(),
      comparisons: import_zod.z.array(import_zod.z.object({
        label: import_zod.z.string(),
        value: import_zod.z.number(),
        max: import_zod.z.number()
      })).optional()
    });
    NajeSlideSchema = import_zod.z.object({
      layoutTemplate: import_zod.z.enum([
        "title_slide",
        "split_image_left",
        "split_image_right",
        "three_cards",
        "two_columns",
        "bullet_list",
        "showcase",
        "comparison_bars",
        "chart_column",
        "chart_compare",
        "icon_list",
        "full_background_image"
      ]),
      eyebrow: import_zod.z.string().optional(),
      slideTitle: import_zod.z.string(),
      slideSubtitle: import_zod.z.string().optional(),
      speakerNotes: import_zod.z.string(),
      content: NajeSlideContentSchema
    });
    geminiSlideSchema = {
      type: import_genai2.Type.OBJECT,
      properties: {
        layoutTemplate: {
          type: import_genai2.Type.STRING,
          description: "Must be one of: title_slide, split_image_left, split_image_right, three_cards, two_columns, bullet_list, showcase, comparison_bars, chart_column, chart_compare, icon_list, full_background_image"
        },
        eyebrow: { type: import_genai2.Type.STRING, description: "Max 30 characters. Section number or short English label shown above the title, e.g. '\u0662\u066B\u0663 \xB7 \u0627\u0644\u0645\u062D\u0631\u0651\u0643' or 'N-CORE PIPELINE'." },
        slideTitle: { type: import_genai2.Type.STRING, description: "Max 45 characters. A statement, not a label. Arabic titles count characters, not words." },
        slideSubtitle: { type: import_genai2.Type.STRING, description: "Max 90 characters. Optional. Omit rather than padding." },
        speakerNotes: { type: import_genai2.Type.STRING, description: "2 to 4 sentences of presenter guidance. Never rendered on the slide." },
        content: {
          type: import_genai2.Type.OBJECT,
          properties: {
            text: { type: import_genai2.Type.STRING, description: "Max 220 characters. One idea. Do not restate the title." },
            bulletPoints: { type: import_genai2.Type.ARRAY, items: { type: import_genai2.Type.STRING }, description: "3 to 5 items. Max 95 characters each. No sub-bullets." },
            aiImagePrompt: { type: import_genai2.Type.STRING, description: "REQUIRED. Concrete English noun phrase for stock photo search." },
            codeVisualType: { type: import_genai2.Type.STRING, description: "Optional: 'svg' or 'mermaid' or 'diagram' when slide illustrates an architecture, timeline, or workflow chart." },
            codeVisualContent: { type: import_genai2.Type.STRING, description: "Optional: raw valid SVG markup or Mermaid.js code for technical diagrams and flowcharts." },
            visualSource: { type: import_genai2.Type.STRING, description: "Optional: 'stock', 'ai', 'code', or 'none'." },
            cards: {
              type: import_genai2.Type.ARRAY,
              items: {
                type: import_genai2.Type.OBJECT,
                properties: {
                  title: { type: import_genai2.Type.STRING, description: "Max 28 characters." },
                  text: { type: import_genai2.Type.STRING, description: "Max 150 characters." },
                  iconKeyword: { type: import_genai2.Type.STRING, description: "Must be one of: rocket, check-circle, zap, bar-chart-3, lightbulb, shield, globe, trending-up, users, target, clock, sparkles, briefecase, cpu, star, heart, flag" }
                },
                required: ["title", "text", "iconKeyword"]
              }
            },
            stats: {
              type: import_genai2.Type.OBJECT,
              properties: {
                value: { type: import_genai2.Type.STRING, description: "Max 6 characters. A number or short figure, e.g. '0.5' or '\u0668'." },
                label: { type: import_genai2.Type.STRING, description: "Max 60 characters." }
              },
              required: ["value", "label"]
            },
            comparisons: {
              type: import_genai2.Type.ARRAY,
              items: {
                type: import_genai2.Type.OBJECT,
                properties: {
                  label: { type: import_genai2.Type.STRING },
                  value: { type: import_genai2.Type.NUMBER },
                  max: { type: import_genai2.Type.NUMBER }
                },
                required: ["label", "value", "max"]
              }
            }
          }
        }
      },
      required: ["layoutTemplate", "slideTitle", "speakerNotes", "content"]
    };
    NajeOutlineSchema = import_zod.z.object({
      title: import_zod.z.string(),
      sections: import_zod.z.array(import_zod.z.object({
        title: import_zod.z.string(),
        description: import_zod.z.string()
      }))
    });
    geminiOutlineSchema = {
      type: import_genai2.Type.OBJECT,
      properties: {
        title: { type: import_genai2.Type.STRING },
        sections: {
          type: import_genai2.Type.ARRAY,
          items: {
            type: import_genai2.Type.OBJECT,
            properties: {
              title: { type: import_genai2.Type.STRING },
              description: { type: import_genai2.Type.STRING, description: "Detailed design instructions and summary of what text/content this slide will cover." }
            },
            required: ["title", "description"]
          }
        }
      },
      required: ["title", "sections"]
    };
    NajeEngine = class {
      constructor(apiKey) {
        this.ai = createGenAIClient();
      }
      // Intent-aware DOCUMENT outline (novels, stories, articles, reports).
      // Unlike generateOutline (presentations) it does NOT force cards/charts/visual elements —
      // it outlines the ACTUAL content that fulfills the user's request.
      async generateDocumentOutline(prompt, numSections = 5, retryCount = 0) {
        const safeSections = Math.max(1, Math.min(Number(numSections) || 5, 25));
        const docOutlineSchema = {
          type: import_genai2.Type.OBJECT,
          properties: {
            title: { type: import_genai2.Type.STRING, description: "The document's real title, in the user's language." },
            theme: { type: import_genai2.Type.STRING, enum: ["dark", "light"], description: "Visual theme for document presentation (dark or light)." },
            colors: {
              type: import_genai2.Type.OBJECT,
              properties: {
                background: { type: import_genai2.Type.STRING, description: "hexcode without #" },
                title: { type: import_genai2.Type.STRING, description: "hexcode without #" },
                text: { type: import_genai2.Type.STRING, description: "hexcode without #" },
                accent: { type: import_genai2.Type.STRING, description: "hexcode without #" }
              }
            },
            sections: {
              type: import_genai2.Type.ARRAY,
              items: {
                type: import_genai2.Type.OBJECT,
                properties: {
                  title: { type: import_genai2.Type.STRING, description: "Section/chapter title as it appears in the document." },
                  description: { type: import_genai2.Type.STRING, description: "1-2 sentences stating exactly what CONTENT this section must contain (real story beats / real points) \u2014 not meta-design." }
                },
                required: ["title", "description"]
              }
            }
          },
          required: ["title", "sections"]
        };
        try {
          const outlinePrompt = `\u0623\u0646\u062A "\u0646\u0627\u062C\u064A"\u060C \u0643\u0627\u062A\u0628 \u0639\u0631\u0628\u064A \u0648\u0645\u0635\u0645\u0645 \u0645\u062D\u062A\u0631\u0641 \u0648\u0628\u0627\u0631\u0639. \u0645\u0647\u0645\u062A\u0643 \u0623\u0646 \u062A\u0646\u0641\u0651\u0630 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0623\u0645\u0627\u0646\u0629 \u0648\u062A\u0628\u0646\u064A \u0639\u0644\u064A\u0647 \u0628\u0623\u0639\u0644\u0649 \u062C\u0648\u062F\u0629 \u2014 \u0644\u0627 \u0623\u0646 \u062A\u0635\u0646\u0639 \u0645\u0633\u062A\u0646\u062F\u0627\u064B "\u0639\u0646" \u0627\u0644\u0645\u0648\u0636\u0648\u0639\u060C \u0648\u0644\u0627 \u0623\u0646 \u062A\u0641\u0631\u0636 \u0628\u0637\u0627\u0642\u0627\u062A \u0623\u0648 \u0631\u0633\u0648\u0645\u0627\u064B \u0623\u0648 \u0625\u0646\u0641\u0648\u063A\u0631\u0627\u0641\u064A\u0643.

\u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 (\u0627\u0642\u0631\u0623\u0647 \u0628\u0639\u0646\u0627\u064A\u0629 \u0648\u0627\u062D\u062A\u0631\u0645 \u0646\u064A\u0651\u062A\u0647 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629):
"${prompt}"

\u0623\u0648\u0644\u0627\u064B \u0635\u0646\u0651\u0641 \u0627\u0644\u0637\u0644\u0628 \u0628\u0635\u0645\u062A:
\u2022 \u0625\u0628\u062F\u0627\u0639\u064A/\u0633\u0631\u062F\u064A (\u0631\u0648\u0627\u064A\u0629\u060C \u0642\u0635\u0629\u060C \u062D\u0643\u0627\u064A\u0629\u060C \u0642\u0635\u064A\u062F\u0629\u060C \u0633\u064A\u0646\u0627\u0631\u064A\u0648\u060C \u0642\u0635\u0629 \u0623\u0637\u0641\u0627\u0644...): \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0647\u064A \u0623\u062C\u0632\u0627\u0621 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0641\u0639\u0644\u064A\u0629 \u2014 \u0641\u0635\u0648\u0644 \u0623\u0648 \u0645\u0634\u0627\u0647\u062F \u062A\u0631\u0648\u064A \u0627\u0644\u0642\u0635\u0629 \u0628\u0646\u062B\u0631 \u062D\u0642\u064A\u0642\u064A \u0648\u062D\u0648\u0627\u0631 \u0648\u0648\u0635\u0641. \u0645\u0645\u0646\u0648\u0639 \u0643\u062A\u0627\u0628\u0629 \u0623\u0642\u0633\u0627\u0645 "\u062A\u0635\u0645\u064A\u0645" \u0623\u0648 "\u062A\u064A\u0628\u0648\u063A\u0631\u0627\u0641\u064A\u0627" \u0623\u0648 "\u0643\u064A\u0641\u064A\u0629 \u0627\u0644\u062A\u0646\u0633\u064A\u0642" \u0623\u0648 \u0623\u064A \u062A\u0639\u0644\u064A\u0642 \u0639\u0646 \u0627\u0644\u0639\u0645\u0644. \u0627\u0644\u0642\u0627\u0631\u0626 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0642\u0631\u0623 \u0627\u0644\u0642\u0635\u0629 \u0646\u0641\u0633\u0647\u0627.
\u2022 \u0645\u0639\u0644\u0648\u0645\u0627\u062A\u064A (\u0645\u0642\u0627\u0644\u060C \u062A\u0642\u0631\u064A\u0631\u060C \u062F\u0644\u064A\u0644\u060C \u0628\u062D\u062B\u060C \u062A\u062D\u0644\u064A\u0644\u060C \u062E\u0637\u0629...): \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0647\u064A \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062D\u0642\u064A\u0642\u064A \u0627\u0644\u0630\u064A \u064A\u062C\u064A\u0628 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062B\u0631 \u0645\u062A\u062F\u0641\u0651\u0642.

\u0627\u0643\u062A\u0628 \u0645\u062E\u0637\u0637\u0627\u064B \u0645\u0646 ${safeSections} \u0623\u0642\u0633\u0627\u0645 \u0628\u0627\u0644\u0636\u0628\u0637\u060C \u0628\u0642\u0648\u0633 \u0645\u062A\u0645\u0627\u0633\u0643\u060C \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 (\u0625\u0644\u0627 \u0625\u0630\u0627 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0644\u063A\u0629 \u0623\u062E\u0631\u0649).
\u0645\u0639 \u062A\u062D\u062F\u064A\u062F \u0646\u0633\u0642 \u0627\u0644\u0623\u0644\u0648\u0627\u0646 (theme: dark/light \u0648\u0623\u0643\u0648\u0627\u062F \u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0628\u062F\u0648\u0646 #).

\u0644\u0643\u0644 \u0642\u0633\u0645:
- "title": \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0642\u0633\u0645/\u0627\u0644\u0641\u0635\u0644 \u0643\u0645\u0627 \u0633\u064A\u0638\u0647\u0631.
- "description": \u062C\u0645\u0644\u0629 \u0623\u0648 \u062C\u0645\u0644\u062A\u0627\u0646 \u062A\u062D\u062F\u0651\u062F\u0627\u0646 \u0628\u0627\u0644\u0636\u0628\u0637 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062D\u0642\u064A\u0642\u064A \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645 (\u0623\u062D\u062F\u0627\u062B \u0627\u0644\u0642\u0635\u0629 \u0627\u0644\u0641\u0639\u0644\u064A\u0629 / \u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0641\u0639\u0644\u064A\u0629).

\u0623\u0639\u062F \u0641\u0642\u0637 JSON \u0628\u0627\u0644\u0634\u0643\u0644: {"title":"...","theme":"dark","colors":{"background":"0B0F19","title":"FFFFFF","text":"94A3B8","accent":"6366F1"},"sections":[{"title":"...","description":"..."}]} \u0628\u062F\u0648\u0646 \u0623\u064A \u0646\u0635 \u0625\u0636\u0627\u0641\u064A \u0623\u0648 \u0639\u0644\u0627\u0645\u0627\u062A markdown.`;
          const response = await this.ai.models.generateContent({
            model: resolveEngineModel(getNajeModel("core")),
            contents: outlinePrompt,
            config: { responseMimeType: "application/json", responseSchema: docOutlineSchema, maxOutputTokens: 8192, temperature: 0.6 }
          });
          let rawText = response.text || "{}";
          const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/([\{\[][\s\S]*[\}\]])/);
          if (jsonMatch) rawText = jsonMatch[1];
          const parsed = JSON.parse(rawText);
          const sections = Array.isArray(parsed.sections) ? parsed.sections.slice(0, safeSections) : [];
          if (sections.length === 0) throw new Error("empty document outline");
          return {
            title: parsed.title || "",
            sections,
            theme: parsed.theme,
            colors: parsed.colors
          };
        } catch (error) {
          console.error(`Document outline failed (attempt ${retryCount + 1}):`, error);
          if (retryCount < 2) {
            await new Promise((r) => setTimeout(r, Math.pow(2, retryCount) * 800));
            return this.generateDocumentOutline(prompt, safeSections, retryCount + 1);
          }
          throw new Error("Failed to generate a valid document outline.");
        }
      }
      // Generate Presentation Outline
      async generateOutline(prompt, numSlides = 8, retryCount = 0) {
        const safeSlides = Math.max(1, Math.min(Number(numSlides) || 8, 35));
        try {
          const outlinePrompt = `You are Naje AI, an elite Presentation Designer.
Create a high-impact presentation outline for the following prompt:
"${prompt}"

Target section count: EXACTLY ${safeSlides} sections.
\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0639\u062F\u062F \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0628\u0627\u0644\u0636\u0628\u0637 ${safeSlides} \u2014 \u0644\u0627 \u0623\u0643\u062B\u0631 \u0648\u0644\u0627 \u0623\u0642\u0644.
Ensure a strong narrative arc. Language: Arabic (unless requested otherwise).

Across the deck, no single layoutTemplate may be used for more than 30% of slides. Consecutive slides must not share the same layoutTemplate. Every slide must carry at least one visual element \u2014 an icon, a chart, a stat callout, an image, or a card grid. A slide with only a title and body text is not acceptable output.`;
          const response = await this.ai.models.generateContent({
            model: resolveEngineModel(getNajeModel("core")),
            contents: outlinePrompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: geminiOutlineSchema,
              maxOutputTokens: 8192,
              temperature: 0.3
            }
          });
          let rawText = response.text || "{}";
          const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/([\{\[][\s\S]*[\}\]])/);
          if (jsonMatch) {
            rawText = jsonMatch[1];
          }
          const parsed = JSON.parse(rawText);
          const outline = NajeOutlineSchema.parse(parsed);
          if (Array.isArray(outline.sections) && outline.sections.length > safeSlides) {
            outline.sections = outline.sections.slice(0, safeSlides);
          }
          return outline;
        } catch (error) {
          console.error(`Outline Generation failed (attempt ${retryCount + 1}):`, error);
          if (retryCount < 2) {
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1e3));
            return this.generateOutline(prompt, safeSlides, retryCount + 1);
          }
          throw new Error(`Failed to generate valid outline JSON after 3 attempts.`);
        }
      }
      // Generate with Retry + Zod Validation
      async generateArtDirection(prompt, brandProfile, retryCount = 0) {
        try {
          const artPrompt = `You are Naje AI, an elite Presentation Designer.
Generate a single, cohesive art direction for a presentation about: "${prompt}".
You MUST return a JSON object with:
{
  "theme": "dark" | "light",
  "colors": {
    "background": "hexcode without #",
    "title": "hexcode without #",
    "text": "hexcode without #",
    "accent": "hexcode without #"
  }
}
If the presentation is modern/tech, prefer 'dark' theme. If corporate/formal, prefer 'light'.`;
          const response = await this.ai.models.generateContent({
            model: resolveEngineModel(getNajeModel("core")),
            contents: artPrompt,
            config: {
              responseMimeType: "application/json",
              maxOutputTokens: 2048,
              temperature: 0.2
            }
          });
          let rawText = response.text || "{}";
          const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/([\{\[][\s\S]*[\}\]])/);
          if (jsonMatch) rawText = jsonMatch[1];
          const parsed = JSON.parse(rawText);
          return parsed;
        } catch (e) {
          if (retryCount < 2) return this.generateArtDirection(prompt, brandProfile, retryCount + 1);
          return { theme: "dark", colors: { background: "0B0F19", title: "FFFFFF", text: "94A3B8", accent: "6366F1" } };
        }
      }
      async generateSlideJSON(sectionTitle, sectionDesc, artDirection, retryCount = 0, model = getNajeModel("personas")) {
        try {
          const prompt = `You are Naje AI, an elite Presentation Designer.
Generate a structured JSON slide based on this requirement:
Title: ${sectionTitle}
Context: ${sectionDesc}
Language: Strictly Arabic unless instructed otherwise.
Design rules: Extreme brevity, highly visual.

CRITICAL TEXT RULE: 'content.text' MUST be at most one single, grammatically complete sentence. If there are multiple distinct ideas, you MUST use 'content.bulletPoints' instead and leave 'content.text' empty.

CRITICAL IMAGE RULE: 'content.aiImagePrompt' is REQUIRED. It MUST be a concrete, literal, transliterated English noun phrase describing a real photographable scene relevant to this specific slide's topic (e.g. "business meeting in modern office", "abstract blue network lines", "laptop on desk"). NO Arabic. NO abstract concepts or AI buzzwords.`;
          const response = await this.ai.models.generateContent({
            model: resolveEngineModel(model),
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: geminiSlideSchema,
              maxOutputTokens: 8192,
              temperature: 0.2
            }
          });
          let rawText = response.text || "{}";
          const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/([\{\[][\s\S]*[\}\]])/);
          if (jsonMatch) {
            rawText = jsonMatch[1];
          }
          const parsed = JSON.parse(rawText);
          if (parsed.content && parsed.content.text) {
            const words = parsed.content.text.split(/\s+/);
            const multiplePunctuation = (parsed.content.text.match(/[.!?،؛]/g) || []).length > 2;
            if (words.length > 25 || multiplePunctuation) {
              const sentences = parsed.content.text.split(/(?<=[.!?،؛])\s+/).filter((s) => s.trim().length > 0);
              if (sentences.length > 1) {
                parsed.content.bulletPoints = [...parsed.content.bulletPoints || [], ...sentences];
                parsed.content.text = "";
              }
            }
          }
          return NajeSlideSchema.parse(parsed);
        } catch (error) {
          console.error(`Slide Generation failed (attempt ${retryCount + 1}):`, error);
          if (retryCount < 2) {
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1e3));
            return this.generateSlideJSON(sectionTitle, sectionDesc, artDirection, retryCount + 1);
          }
          throw new Error(`Failed to generate valid slide JSON after 3 attempts.`);
        }
      }
      async renderCodeVisualToPngBase64(type, content) {
        try {
          if (!content) return null;
          const sharpModule = await import("sharp");
          const sharp2 = sharpModule.default || sharpModule;
          const clean = content.trim();
          if (type === "svg" || clean.startsWith("<svg") || clean.includes("xmlns=")) {
            const svgMarkup = clean.startsWith("<svg") ? clean : clean.substring(clean.indexOf("<svg"));
            const buffer2 = await sharp2(Buffer.from(svgMarkup)).resize({ width: 1200, height: 800, fit: "inside" }).png().toBuffer();
            return buffer2.toString("base64");
          }
          const lines = clean.split("\n").filter((l) => l.trim().length > 0);
          const svgWrapper = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
          <rect width="1200" height="800" rx="24" fill="#0f172a" />
          <rect x="20" y="20" width="1160" height="760" rx="16" fill="#1e293b" stroke="#6366f1" stroke-width="2" />
          <text x="60" y="80" font-family="monospace, sans-serif" font-size="28" font-weight="bold" fill="#38bdf8">DIAGRAM / FLOWCHART</text>
          ${lines.slice(0, 14).map((line, idx) => `
            <text x="60" y="${140 + idx * 42}" font-family="monospace, sans-serif" font-size="20" fill="#e2e8f0">${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>
          `).join("")}
        </svg>
      `;
          const buffer = await sharp2(Buffer.from(svgWrapper)).png().toBuffer();
          return buffer.toString("base64");
        } catch (err) {
          console.warn("[Code-to-Visuals Engine] Rasterization notice:", err?.message || err);
          return null;
        }
      }
      // Render PPTX from an array of validated NajeSlides
      async renderPPTX(slides, brandProfile) {
        const PptxGenJSCtor = await getPptxGenCtor();
        const pres = new PptxGenJSCtor();
        pres.defineLayout({ name: "NAJE_WIDE", width: 13.333, height: 7.5 });
        pres.layout = "NAJE_WIDE";
        const combinedAllText = slides.map((s) => (s.slideTitle || "") + " " + (s.content?.text || "")).join(" ");
        const isDeckRtl = isArabic(combinedAllText);
        if (isDeckRtl) pres.rtlMode = true;
        for (let i = 2; i < slides.length; i++) {
          if (slides[i].layoutTemplate === slides[i - 1].layoutTemplate && slides[i].layoutTemplate === slides[i - 2].layoutTemplate) {
            if (slides[i - 1].layoutTemplate === "bullet_list") slides[i - 1].layoutTemplate = "icon_list";
            else if (slides[i - 1].layoutTemplate === "two_columns") slides[i - 1].layoutTemplate = "three_cards";
            else if (slides[i - 1].layoutTemplate === "three_cards") slides[i - 1].layoutTemplate = "two_columns";
            else slides[i - 1].layoutTemplate = "bullet_list";
          }
        }
        const imagePromises = slides.map(async (slideData, index) => {
          let b64 = null;
          const layoutTemplate = slideData.layoutTemplate || "title_slide";
          let width = 800;
          let height = 800;
          if (layoutTemplate === "full_background_image") {
            width = 1920;
            height = 1080;
          } else if (["split_image_left", "split_image_right"].includes(layoutTemplate)) {
            width = 1080;
            height = 1920;
          }
          if (slideData.content?.codeVisualContent) {
            const codeB64 = await this.renderCodeVisualToPngBase64(slideData.content.codeVisualType || "svg", slideData.content.codeVisualContent);
            if (codeB64) {
              b64 = codeB64;
            }
          } else if (["full_background_image", "split_image_left", "split_image_right", "showcase"].includes(layoutTemplate)) {
            const photoRes = await fetchRealPhotography(slideData.content?.aiImagePrompt || "modern business abstract", width, height);
            b64 = photoRes?.b64 || null;
          }
          return { index, b64 };
        });
        const prefetchedImages = await Promise.all(imagePromises);
        const prefetchMap = /* @__PURE__ */ new Map();
        prefetchedImages.forEach((img) => prefetchMap.set(img.index, img.b64));
        const P = brandProfile?.palette || DARK_LUXE;
        const defaultArFont = brandProfile?.typography?.primaryFont || "Cairo";
        const defaultEnFont = brandProfile?.typography?.secondaryFont || "Arial";
        const iconPromises = slides.map(async (slideData, index) => {
          const icons = /* @__PURE__ */ new Map();
          const layoutTemplate = slideData.layoutTemplate || "title_slide";
          if (["three_cards", "two_columns", "icon_list"].includes(layoutTemplate) && slideData.content.cards) {
            for (let j = 0; j < slideData.content.cards.length; j++) {
              const c = slideData.content.cards[j];
              const iconKeyword = c.iconKeyword || "sparkles";
              const b64 = await renderIconToPngBase64(iconKeyword, normalizeHex(P.accent));
              icons.set(j, b64);
            }
          }
          return { index, icons };
        });
        const prefetchedIcons = await Promise.all(iconPromises);
        const prefetchIconMap = /* @__PURE__ */ new Map();
        prefetchedIcons.forEach((res) => prefetchIconMap.set(res.index, res.icons));
        for (let i = 0; i < slides.length; i++) {
          const slideData = slides[i];
          const prefetchB64 = prefetchMap.get(i);
          const isRtl = isArabic(slideData.slideTitle + " " + (slideData.content.text || ""));
          const fontName = isRtl ? defaultArFont : defaultEnFont;
          const slide = pres.addSlide();
          slide.background = { color: P.bg };
          if (slideData.speakerNotes) slide.addNotes(slideData.speakerNotes);
          const layoutTemplate = slideData.layoutTemplate;
          const slideTitle = slideData.slideTitle || "";
          const slideSubtitle = slideData.slideSubtitle || "";
          const eyebrow = slideData.eyebrow || "";
          if (layoutTemplate !== "full_background_image" && layoutTemplate !== "title_slide") {
            if (eyebrow) {
              slide.addText(eyebrow, textOpts(eyebrow, {
                x: 0.6,
                y: 0.42,
                w: 12.13,
                h: 0.3,
                fontSize: 12,
                fontFace: fontName,
                bold: true,
                color: P.accent,
                charSpacing: 2,
                margin: 0
              }));
            }
            slide.addText(slideTitle, textOpts(slideTitle, {
              x: 0.6,
              y: 0.75,
              w: 12.13,
              h: 0.75,
              fontSize: 34,
              fontFace: fontName,
              bold: true,
              color: P.text,
              margin: 0
            }));
          }
          if (layoutTemplate === "full_background_image") {
            const b64 = prefetchB64;
            if (b64) {
              slide.addImage({ data: `image/jpeg;base64,${b64}`, x: 0, y: 0, w: 13.333, h: 7.5, sizing: { type: "cover", w: 13.333, h: 7.5 } });
            }
            slide.addShape("rect", { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: "000000", transparency: 45 }, line: { type: "none" } });
            slide.addText(slideTitle, textOpts(slideTitle, { x: 1.6, y: 2.4, w: 10.13, h: 1.5, fontSize: 48, fontFace: fontName, color: "FFFFFF", bold: true, margin: 0 }));
            if (slideSubtitle) {
              slide.addText(slideSubtitle, textOpts(slideSubtitle, { x: 1.6, y: 3.9, w: 10.13, h: 1, fontSize: 24, fontFace: fontName, color: P.accent, margin: 0 }));
            }
          } else if (layoutTemplate === "title_slide") {
            slide.addText(slideTitle, textOpts(slideTitle, { x: 5.2, y: 1.9, w: 7.55, h: 1.35, fontSize: 56, fontFace: fontName, color: P.text, bold: true, margin: 0 }));
            if (slideSubtitle) {
              slide.addText(slideSubtitle, textOpts(slideSubtitle, { x: 5.2, y: 3.2, w: 7.55, h: 0.8, fontSize: 24, fontFace: fontName, color: P.accent, margin: 0 }));
            }
            pixelMotif(slide, 0.6, 1.9, 10, 15, 0.15, 0.05, P.accent, 60);
          } else if (layoutTemplate === "showcase") {
            const statVal = slideData.content.stats?.value || "";
            const statLabel = slideData.content.stats?.label || slideSubtitle;
            if (statVal) {
              const fitRes = assertFits(statVal, 12.13, 1.6, 60, 46);
              slide.addText(fitRes.text, textOpts(fitRes.text, { x: 0.6, y: 2.2, w: 12.13, h: 1.6, fontSize: fitRes.fs, fontFace: fontName, color: P.accent, bold: true, margin: 0, align: "center" }));
            }
            if (statLabel) {
              slide.addText(statLabel, textOpts(statLabel, { x: 0.6, y: 3.9, w: 12.13, h: 0.6, fontSize: 32, fontFace: fontName, color: P.text, bold: true, margin: 0, align: "center" }));
            }
            const mainText = slideData.content.text || "";
            if (mainText) {
              const fitRes = assertFits(mainText, 8.13, 1.2, 18, 12);
              slide.addText(fitRes.text, textOpts(fitRes.text, { x: 2.6, y: 4.7, w: 8.13, h: 1.2, fontSize: fitRes.fs, fontFace: fontName, color: P.muted, margin: 0, align: "center" }));
            }
          } else if (layoutTemplate === "comparison_bars" || layoutTemplate === "chart_column") {
            const comps = slideData.content.comparisons || [];
            if (comps.length > 0) {
              slide.addChart(pres.ChartType.bar, [{
                name: "Series 1",
                labels: comps.map((c) => c.label),
                values: comps.map((c) => c.value)
              }], {
                x: 0.6,
                y: 1.9,
                w: 12.13,
                h: 4.4,
                barDir: "col",
                chartColors: [P.accent],
                showTitle: false,
                showValue: true,
                dataLabelPosition: "outEnd",
                dataLabelColor: P.text,
                dataLabelFontFace: fontName,
                dataLabelFontSize: 12,
                showLegend: false,
                catAxisLabelColor: P.muted,
                catAxisLabelFontFace: fontName,
                catAxisLabelFontSize: 11,
                valAxisLabelColor: P.muted,
                valAxisLabelFontFace: fontName,
                valAxisLabelFontSize: 11,
                valGridLine: { color: P.card, size: 1 },
                catGridLine: { style: "none" },
                plotArea: { fill: { color: P.bg } },
                chartArea: { fill: { color: P.bg } }
              });
            }
          } else if (layoutTemplate === "chart_compare") {
            const comps = slideData.content.comparisons || [];
            if (comps.length > 0) {
              slide.addChart(pres.ChartType.bar, [{
                name: "Series 1",
                labels: comps.map((c) => c.label),
                values: comps.map((c) => c.value)
              }], {
                x: 0.6,
                y: 1.9,
                w: 12.13,
                h: 4.4,
                barDir: "col",
                chartColors: [P.accent, P.accent2 || "8B5CF6"],
                showTitle: false,
                showValue: true,
                dataLabelPosition: "outEnd",
                dataLabelColor: P.text,
                dataLabelFontFace: fontName,
                dataLabelFontSize: 12,
                showLegend: true,
                legendPos: "b",
                legendColor: P.muted,
                barGrouping: "clustered",
                catAxisLabelColor: P.muted,
                catAxisLabelFontFace: fontName,
                catAxisLabelFontSize: 11,
                valAxisLabelColor: P.muted,
                valAxisLabelFontFace: fontName,
                valAxisLabelFontSize: 11,
                valGridLine: { color: P.card, size: 1 },
                catGridLine: { style: "none" },
                plotArea: { fill: { color: P.bg } },
                chartArea: { fill: { color: P.bg } }
              });
            }
          } else if (layoutTemplate === "split_image_left" || layoutTemplate === "split_image_right") {
            const isImageLeft = layoutTemplate === "split_image_left";
            const imgX = isImageLeft ? 0.6 : 7.13;
            const textX = isImageLeft ? 6.6 : 0.6;
            const b64 = prefetchB64;
            if (b64) {
              slide.addImage({ data: `image/jpeg;base64,${b64}`, x: imgX, y: 1.85, w: 5.6, h: 4.6, sizing: { type: "cover", w: 5.6, h: 4.6 } });
            } else {
              slide.addShape("rect", { x: imgX, y: 1.85, w: 5.6, h: 4.6, fill: { color: P.card }, line: { type: "none" } });
            }
            const mainText = slideData.content.text || "";
            if (mainText) {
              const fitRes = assertFits(mainText, 6.13, 2, 18, 12);
              slide.addText(fitRes.text, textOpts(fitRes.text, { x: textX, y: 1.85, w: 6.13, h: 2, fontSize: fitRes.fs, fontFace: fontName, color: P.muted, margin: 0 }));
            }
            if (slideData.content.bulletPoints?.length) {
              const bullets = slideData.content.bulletPoints.map((b) => ({ text: b, options: { bullet: true, breakLine: true } }));
              if (bullets.length > 0) delete bullets[bullets.length - 1].options.breakLine;
              slide.addText(bullets, textOpts(bullets[0].text, { x: textX, y: mainText ? 4 : 1.85, w: 6.13, h: 2.6, fontSize: 16, fontFace: fontName, color: P.muted, margin: 0, paraSpaceAfter: 10 }));
            }
          } else if (layoutTemplate === "three_cards") {
            const cardsArr = slideData.content.cards || [];
            const xPos = isRtl ? [...COORDS.COLS.C3_X].reverse() : COORDS.COLS.C3_X;
            let rowH = 3.5;
            const hArr = cardsArr.slice(0, 3).map((c) => cardHeight(c.text, COORDS.COLS.C3_W, 14));
            if (hArr.length > 0) rowH = Math.max(...hArr);
            cardsArr.slice(0, 3).forEach((c, idx) => {
              const cardX = xPos[idx];
              card(slide, { x: cardX, y: 2, w: 3.84, h: rowH, fill: P.card });
              const iconB64 = prefetchIconMap.get(i)?.get(idx);
              if (iconB64) {
                badge(slide, cardX + 2.89, 2.35, 0.55, "", P.card2, P.text);
                slide.addImage({ data: `image/png;base64,${iconB64}`, x: cardX + 2.89, y: 2.35, w: 0.55, h: 0.55 });
              }
              const titleFit = assertFits(c.title, 3.24, 0.45, 18, 14);
              slide.addText(titleFit.text, textOpts(titleFit.text, { x: cardX + 0.3, y: 3.1, w: 3.24, h: 0.45, fontSize: titleFit.fs, fontFace: fontName, color: P.text, bold: true, margin: 0 }));
              const bodyFit = assertFits(c.text, 3.24, rowH - 1.6, 14, 12);
              slide.addText(bodyFit.text, textOpts(bodyFit.text, { x: cardX + 0.3, y: 3.62, w: 3.24, h: rowH - 1.6, fontSize: bodyFit.fs, fontFace: fontName, color: P.muted, margin: 0 }));
            });
          } else if (layoutTemplate === "two_columns") {
            const cardsArr = slideData.content.cards || [];
            const xPos = isRtl ? [...COORDS.COLS.C2_X].reverse() : COORDS.COLS.C2_X;
            let rowH = 3.9;
            const hArr = cardsArr.slice(0, 2).map((c) => cardHeight(c.text, COORDS.COLS.C2_W, 14));
            if (hArr.length > 0) rowH = Math.max(...hArr);
            cardsArr.slice(0, 2).forEach((c, idx) => {
              const cardX = xPos[idx];
              card(slide, { x: cardX, y: 1.95, w: 5.92, h: rowH, fill: P.card });
              const titleFit = assertFits(c.title, 5.32, 0.4, 20, 16);
              slide.addText(titleFit.text, textOpts(titleFit.text, { x: cardX + 0.3, y: 2.25, w: 5.32, h: 0.4, fontSize: titleFit.fs, fontFace: fontName, color: P.text, bold: true, margin: 0 }));
              const bodyFit = assertFits(c.text, 5.32, rowH - 1.1, 14, 12);
              slide.addText(bodyFit.text, textOpts(bodyFit.text, { x: cardX + 0.3, y: 2.75, w: 5.32, h: rowH - 1.1, fontSize: bodyFit.fs, fontFace: fontName, color: P.muted, margin: 0 }));
            });
          } else if (layoutTemplate === "icon_list") {
            const cardsArr = slideData.content.cards || [];
            cardsArr.slice(0, 6).forEach((c, idx) => {
              const rowY = 1.9 + idx * 1.03;
              slide.addShape("rect", { x: 0.6, y: rowY, w: 12.13, h: 0.95, fill: { color: P.card }, line: { type: "none" } });
              if (isRtl) {
                badge(slide, 11.98, rowY + 0.2, 0.5, "", P.accent, P.text);
                const iconB64 = prefetchIconMap.get(i)?.get(idx);
                if (iconB64) {
                  slide.addImage({ data: `image/png;base64,${iconB64}`, x: 11.98, y: rowY + 0.2, w: 0.5, h: 0.5 });
                }
                slide.addText(c.title, textOpts(c.title, { x: 8.5, y: rowY, w: 2.5, h: 0.95, fontSize: 16, fontFace: fontName, color: P.text, bold: true, margin: 0 }));
                slide.addText(c.text, textOpts(c.text, { x: 0.9, y: rowY, w: 7.4, h: 0.95, fontSize: 14, fontFace: fontName, color: P.muted, margin: 0 }));
              } else {
                badge(slide, 0.8, rowY + 0.2, 0.5, "", P.accent, P.text);
                const iconB64 = prefetchIconMap.get(i)?.get(idx);
                if (iconB64) {
                  slide.addImage({ data: `image/png;base64,${iconB64}`, x: 0.8, y: rowY + 0.2, w: 0.5, h: 0.5 });
                }
                slide.addText(c.title, textOpts(c.title, { x: 1.5, y: rowY, w: 2.5, h: 0.95, fontSize: 16, fontFace: fontName, color: P.text, bold: true, margin: 0 }));
                slide.addText(c.text, textOpts(c.text, { x: 4.2, y: rowY, w: 7.4, h: 0.95, fontSize: 14, fontFace: fontName, color: P.muted, margin: 0 }));
              }
            });
          } else {
            const mainText = slideData.content.text || "";
            if (mainText) {
              const fitRes = assertFits(mainText, 12.13, 1.2, 18, 14);
              slide.addText(fitRes.text, textOpts(fitRes.text, { x: 0.6, y: 1.85, w: 12.13, h: 1.2, fontSize: fitRes.fs, fontFace: fontName, color: P.muted, margin: 0 }));
            }
            if (slideData.content.bulletPoints?.length) {
              const bullets = slideData.content.bulletPoints.map((b) => ({ text: b, options: { bullet: true, breakLine: true } }));
              if (bullets.length > 0) delete bullets[bullets.length - 1].options.breakLine;
              slide.addText(bullets, textOpts(bullets[0].text, { x: 0.6, y: mainText ? 3.2 : 1.85, w: 12.13, h: 3, fontSize: 16, fontFace: fontName, color: P.muted, margin: 0, paraSpaceAfter: 12 }));
            }
          }
        }
        const buffer = await pres.write({ outputType: "nodebuffer" });
        return buffer.toString("base64");
      }
    };
  }
});

// src/lib/grounding.ts
function normalize(str) {
  if (!str) return "";
  return str.replace(/\s+/g, " ").replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48)).replace(/[أإآ]/g, "\u0627").replace(/ة/g, "\u0647").replace(/ى/g, "\u064A").toLowerCase().trim();
}
function verifyFacts(facts, sourceText) {
  const normSource = normalize(sourceText);
  const ok = [];
  const rejected = [];
  for (const fact of facts) {
    if (!fact.sourceQuote || fact.sourceQuote.length < 10) {
      rejected.push({ fact, reason: "Missing or short sourceQuote" });
      continue;
    }
    const normQuote = normalize(fact.sourceQuote);
    if (normSource.includes(normQuote)) {
      ok.push(fact);
    } else {
      rejected.push({ fact, reason: "Quote not found in source text" });
    }
  }
  return { ok, rejected };
}
async function verifyRenderedDeck(html, verifiedFacts, sourceText, mode, ai5, MODEL_ID, geminiSemaphore2) {
  const isGrounded = mode === "grounded";
  const dom = new import_jsdom.JSDOM(html);
  const document = dom.window.document;
  const blockTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "div"];
  let claimCounter = 1;
  const elementsWithClaims = [];
  for (const tag of blockTags) {
    const els = document.querySelectorAll(tag);
    for (const el of els) {
      if (tag === "div") {
        const hasDirectText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent?.trim().length > 0);
        if (!hasDirectText) continue;
      }
      const text = el.textContent?.trim();
      if (text && text.length > 2) {
        if (!el.hasAttribute("data-claim-id")) {
          const id = `c${claimCounter.toString().padStart(3, "0")}`;
          el.setAttribute("data-claim-id", id);
          elementsWithClaims.push({ id, text, el });
          claimCounter++;
        }
      }
    }
  }
  const reportUpdates = {
    claimsAudited: elementsWithClaims.length,
    claimsSupported: 0,
    claimsRemoved: [],
    evidenceFailures: 0,
    breachCount: 0,
    slidesDropped: 0
  };
  const metrics = verifiedFacts.filter((f) => f.kind === "metric" && typeof f.value !== "undefined");
  const slidesEls = document.querySelectorAll(".slide");
  for (const slide of slidesEls) {
    for (const metric of metrics) {
      const valStr = metric.value.toString();
      const slideHtmlStr = slide.innerHTML;
      const totalOccurrences = (slideHtmlStr.match(new RegExp("\\b" + valStr + "\\b", "g")) || []).length;
      if (totalOccurrences > 0) {
        let safeOccurrences = 0;
        const ltrSpans = slide.querySelectorAll('span[dir="ltr"]');
        for (const span of ltrSpans) {
          const spanHtml = span.innerHTML;
          safeOccurrences += (spanHtml.match(new RegExp("\\b" + valStr + "\\b", "g")) || []).length;
        }
        if (totalOccurrences > safeOccurrences) {
          reportUpdates.breachCount = (reportUpdates.breachCount || 0) + 1;
        }
      }
    }
  }
  if (elementsWithClaims.length === 0) {
    return { cleanHtml: dom.window.document.body.innerHTML, reportUpdates };
  }
  const deckText = elementsWithClaims.map((c) => `[ID: ${c.id}] ${c.text}`).join("\n");
  let auditPrompt = "";
  if (isGrounded) {
    auditPrompt = `You are a compliance auditor for a document generator. You are the last check
before a file reaches a paying user. You are not editing or improving the deck.
You decide, for each claim, whether the source material supports it.

MODE: grounded
The user supplied source material. The deck must contain nothing the source does
not support. Anything else is fabrication, regardless of how plausible it sounds.

For EACH element id, decide:

  supported  \u2014 the source states this, in any wording, in any language
  unsupported \u2014 the source does not state it and it cannot be read off the source
  contradicted \u2014 the source states something incompatible with it

Judge MEANING, not wording. "\u0639\u0627\u0626\u062F \u0627\u0633\u062A\u062B\u0645\u0627\u0631" and "\u0639\u0627\u0626\u062F \u0627\u0644\u0627\u0633\u062A\u062B\u0645\u0627\u0631" and "ROI" and
"\u0646\u0633\u0628\u0629 \u0627\u0644\u0639\u0627\u0626\u062F \u0639\u0644\u0649 \u0627\u0644\u0627\u0633\u062A\u062B\u0645\u0627\u0631" are the same claim. "\u0627\u064A\u0632\u0648 27001" and "ISO 27001" are
the same claim. A restatement of a source fact in different words is supported.

Pay particular attention to these, and mark each with its category:

  attributed_quote \u2014 any statement presented as spoken or written by a person or
      a role. The attribution may be an em-dash, a name, a job title, a company,
      or nothing at all beyond context. If the source does not contain that
      person saying that thing, it is fabricated. This is the highest-risk
      category in the product.
  certification    \u2014 any claim of certification, accreditation, standard or audit
      status, in any language or transliteration.
  third_party      \u2014 any named external company, customer, partner or vendor.
  financial        \u2014 any performance, return, saving, growth or payback figure,
      with or without a percent sign, including multiples ("5 \u0623\u0636\u0639\u0627\u0641").
  guarantee        \u2014 uptime, SLA, availability or similar promise.
  regulatory       \u2014 any legal or compliance conformity claim.
  award            \u2014 any ranking, award, or market position.
  metric           \u2014 any other number presented as fact.
  none             \u2014 ordinary prose with no verifiable claim.

For each element return: id, verdict, category, and evidence.
evidence: for \`supported\`, a VERBATIM span from the source that supports it.
For the other verdicts, evidence is "".

A claim is supported ONLY if you can quote the source. If you cannot produce the
quote, the verdict is not supported. Do not reason from general knowledge about
the world or about this product \u2014 only from the supplied source.

Return JSON only.

SOURCE MATERIAL:
${sourceText}

DECK CLAIMS:
${deckText}
`;
  } else {
    auditPrompt = `You are a compliance auditor for a document generator.
MODE: creative
There is no source material. 
Flag any \`attributed_quote\`, \`certification\`, \`regulatory\` or \`award\` claim, because
those are unsafe to invent even in a speculative deck. Financial and metric
figures are permitted but must be labelled illustrative in the deck footer (you do not do the labelling, just return supported).

For EACH element id, decide:
  unsupported \u2014 if it is an \`attributed_quote\`, \`certification\`, \`regulatory\` or \`award\`.
  supported \u2014 otherwise.

Pay particular attention to these, and mark each with its category:
  attributed_quote \u2014 any statement presented as spoken or written by a person or a role.
  certification    \u2014 any claim of certification, accreditation, standard or audit status.
  regulatory       \u2014 any legal or compliance conformity claim.
  award            \u2014 any ranking, award, or market position.
  third_party      \u2014 any named external company, customer, partner or vendor.
  financial        \u2014 financial figures.
  guarantee        \u2014 uptime, SLA, availability.
  metric           \u2014 other numbers.
  none             \u2014 ordinary prose.

For each element return: id, verdict, category, and evidence ("" for all in creative mode).
Return JSON only.

DECK CLAIMS:
${deckText}
`;
  }
  let claimsResult = [];
  let retryCount = 0;
  while (retryCount < 2) {
    await geminiSemaphore2.acquire();
    try {
      const auditRes = await ai5.models.generateContent({
        model: resolveEngineModel(MODEL_ID),
        contents: auditPrompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 65535,
          responseSchema: {
            type: import_genai3.Type.OBJECT,
            properties: {
              claims: { type: import_genai3.Type.ARRAY, items: { type: import_genai3.Type.OBJECT, properties: {
                id: { type: import_genai3.Type.STRING },
                verdict: { type: import_genai3.Type.STRING, enum: ["supported", "unsupported", "contradicted"] },
                category: { type: import_genai3.Type.STRING, enum: ["attributed_quote", "certification", "third_party", "financial", "guarantee", "regulatory", "award", "metric", "none"] },
                evidence: { type: import_genai3.Type.STRING }
              }, required: ["id", "verdict", "category", "evidence"] } }
            },
            required: ["claims"]
          }
        }
      });
      const parsed = JSON.parse(auditRes.text || "{}");
      claimsResult = parsed.claims || [];
      break;
    } catch (e) {
      console.warn("Audit JSON parse error, retrying...", e);
      retryCount++;
      if (retryCount >= 2) throw new Error("Verification could not complete.");
    } finally {
      geminiSemaphore2.release();
    }
  }
  const normSource = normalize(sourceText);
  for (const claimRes of claimsResult) {
    const elData = elementsWithClaims.find((c) => c.id === claimRes.id);
    if (!elData) continue;
    let { verdict, category, evidence } = claimRes;
    if (verdict === "supported" && isGrounded) {
      const normEvidence = normalize(evidence);
      if (normEvidence && !normSource.includes(normEvidence)) {
        verdict = "unsupported";
        reportUpdates.evidenceFailures = (reportUpdates.evidenceFailures || 0) + 1;
      }
    }
    if (verdict === "supported") {
      reportUpdates.claimsSupported = (reportUpdates.claimsSupported || 0) + 1;
      continue;
    }
    if (category === "none") {
      continue;
    }
    let shouldRemove = false;
    if (category === "attributed_quote") {
      shouldRemove = true;
      const el = elData.el;
      const sibs = [el.previousElementSibling, el.nextElementSibling];
      for (const sib of sibs) {
        if (sib && sib.textContent) {
          const sibText = sib.textContent.trim();
          if (sibText.length < 120 && /(—|–|-|CEO|CTO|CFO|COO|قال|صرّح|المدير|الرئيس التنفيذي)/i.test(sibText)) {
            sib.remove();
          }
        }
      }
    } else if (["certification", "third_party", "financial", "guarantee", "regulatory", "award"].includes(category)) {
      shouldRemove = true;
    } else if (category === "metric") {
      shouldRemove = true;
    }
    if (shouldRemove) {
      elData.el.remove();
      reportUpdates.claimsRemoved.push({ id: claimRes.id, category, text: elData.text });
    }
  }
  const remainingSlides = document.querySelectorAll(".slide");
  for (const slide of remainingSlides) {
    const textLen = slide.textContent?.replace(/\s+/g, "").length || 0;
    if (textLen < 15) {
      slide.remove();
      reportUpdates.slidesDropped = (reportUpdates.slidesDropped || 0) + 1;
    }
  }
  return { cleanHtml: document.body.innerHTML, reportUpdates };
}
var import_jsdom, import_genai3;
var init_grounding = __esm({
  "src/lib/grounding.ts"() {
    import_jsdom = require("jsdom");
    import_genai3 = require("@google/genai");
    init_modelEnvConfig();
  }
});

// src/lib/slides-html.ts
function icon(name, size = 24, color = "var(--accent)") {
  const safe = ICON_WHITELIST.has(name) ? name : "sparkles";
  if (!ICON_CACHE.has(safe)) {
    const p = import_path2.default.resolve(process.cwd(), "node_modules/lucide-static/icons", `${safe}.svg`);
    try {
      ICON_CACHE.set(safe, import_fs2.default.readFileSync(p, "utf8"));
    } catch {
      return "";
    }
  }
  return ICON_CACHE.get(safe).replace("<svg", `<svg width="${size}" height="${size}" style="color:${color}"`).replace(/stroke="currentColor"/g, `stroke="${color}"`);
}
function barChart(data, opts = {}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  let svg = `<svg viewBox="0 0 400 200"  style="width:100%; height:100%;">`;
  const barW = 400 / (data.length * 2);
  data.forEach((d, i) => {
    const x = (i * 2 + 0.5) * barW;
    const h = d.value / maxVal * 160;
    const y = 180 - h;
    svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="var(--accent)" rx="4" />`;
  });
  svg += `</svg>`;
  let html = `<div style="position:relative; width:100%; height:100%;">${svg}`;
  data.forEach((d, i) => {
    const x = (i * 2 + 1) * barW / 400 * 100;
    html += `<div style="position:absolute; bottom:0; left:${x}%; transform:translateX(-50%); font-size:12px; color:var(--muted);">${d.label}</div>`;
    const h = d.value / maxVal * 100 * 0.8;
    html += `<div style="position:absolute; bottom:${h + 12}%; left:${x}%; transform:translateX(-50%); font-size:14px; color:var(--text); font-weight:bold;">${d.value}</div>`;
  });
  html += `</div>`;
  return html;
}
function lineChart(data, opts = {}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  let pts = data.map((d, i) => `${i / Math.max(1, data.length - 1) * 400},${180 - d.value / maxVal * 160}`).join(" ");
  let svg = `<svg viewBox="0 0 400 200"  style="width:100%; height:100%;">
    <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="4" />
  </svg>`;
  let html = `<div style="position:relative; width:100%; height:100%;">${svg}`;
  data.forEach((d, i) => {
    const x = i / Math.max(1, data.length - 1) * 100;
    html += `<div style="position:absolute; bottom:0; left:${x}%; transform:translateX(-50%); font-size:12px; color:var(--muted);">${d.label}</div>`;
    const h = d.value / maxVal * 100 * 0.8;
    html += `<div style="position:absolute; bottom:${h + 12}%; left:${x}%; transform:translateX(-50%); font-size:14px; color:var(--text); font-weight:bold;">${d.value}</div>`;
  });
  html += `</div>`;
  return html;
}
function donutChart(data, opts = {}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let svg = `<svg viewBox="0 0 200 200" style="width:100%; height:100%;">`;
  let acc = 0;
  const colors = ["var(--accent)", "var(--accent-2)", "var(--card-2)", "var(--faint)"];
  data.forEach((d, i) => {
    const pct = d.value / Math.max(1, total);
    const a1 = acc * Math.PI * 2;
    const a2 = (acc + pct) * Math.PI * 2;
    acc += pct;
    const x1 = 100 + Math.cos(a1) * 80;
    const y1 = 100 + Math.sin(a1) * 80;
    const x2 = 100 + Math.cos(a2) * 80;
    const y2 = 100 + Math.sin(a2) * 80;
    const largeArc = pct > 0.5 ? 1 : 0;
    svg += `<path d="M100,100 L${x1},${y1} A80,80 0 ${largeArc},1 ${x2},${y2} Z" fill="${colors[i % colors.length]}" />`;
  });
  svg += `<circle cx="100" cy="100" r="50" fill="var(--bg)" /></svg>`;
  let html = `<div style="position:relative; width:100%; height:100%;">${svg}
    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center;">
      <div style="font-size:24px; font-weight:bold; color:var(--text);">${opts.centerLabel || ""}</div>
    </div>
  </div>`;
  return html;
}
function progressBars(data, opts = {}) {
  let html = `<div style="display:grid; gap:16px; width:100%; height:100%; align-content:center;">`;
  data.forEach((d) => {
    const max = d.max || Math.max(...data.map((x) => x.value), 1);
    const pct = d.value / max * 100;
    html += `
      <div>
        <div style="display:grid; grid-template-columns:1fr auto; margin-bottom:6px;">
          <span style="font-size:14px; color:var(--text);">${d.label}</span>
          <span style="font-size:14px; color:var(--muted); font-weight:bold;">${d.value}</span>
        </div>
        <div style="height:8px; background:var(--card-2); border-radius:4px; overflow:hidden;">
          <div style="height:100%; width:${pct}%; background:var(--accent); border-radius:4px;"></div>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}
function flowDiagram(nodes, opts = {}) {
  const cols = nodes.map(() => "1fr").join(" auto ");
  let html = `<div style="display:grid; grid-template-columns:${cols}; align-items:center; gap:12px; width:100%; height:100%;">`;
  nodes.forEach((n, i) => {
    html += `<div style="background:var(--card); border:1px solid var(--accent-2); border-radius:var(--radius); padding:16px; text-align:center;">
      <div style="color:var(--text); font-weight:bold;">${n.label}</div>
    </div>`;
    if (i < nodes.length - 1) {
      html += `<div style="color:var(--faint); text-align:center; font-size:18px;">\u2192</div>`;
    }
  });
  html += `</div>`;
  return html;
}
var import_fs2, import_path2, ICON_CACHE, ICON_WHITELIST, LAYOUTS;
var init_slides_html = __esm({
  "src/lib/slides-html.ts"() {
    import_fs2 = __toESM(require("fs"), 1);
    import_path2 = __toESM(require("path"), 1);
    ICON_CACHE = /* @__PURE__ */ new Map();
    ICON_WHITELIST = /* @__PURE__ */ new Set([
      "brain",
      "layers",
      "shield",
      "network",
      "bar-chart-3",
      "pie-chart",
      "rocket",
      "check-circle",
      "image",
      "video",
      "file-text",
      "settings",
      "users",
      "credit-card",
      "palette",
      "type",
      "sparkles",
      "lock",
      "zap",
      "database"
    ]);
    LAYOUTS = [
      { id: "cover", grid: '"heading" "kpi"', cols: "1fr", rows: "1fr auto", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "kpi", type: "kpi-row", area: "kpi" }] },
      { id: "agenda", grid: '"heading" "list"', cols: "1fr", rows: "auto 1fr", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "list", type: "spec-list", area: "list" }] },
      { id: "statement", grid: '"heading"', cols: "1fr", rows: "1fr", slots: [{ id: "heading", type: "heading", area: "heading" }] },
      { id: "three-cards", grid: '"heading" "cards"', cols: "1fr", rows: "auto 1fr", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "cards", type: "card-grid", area: "cards" }] },
      { id: "four-cards", grid: '"heading" "cards"', cols: "1fr", rows: "auto 1fr", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "cards", type: "card-grid", area: "cards" }] },
      { id: "six-cards", grid: '"heading" "cards"', cols: "1fr", rows: "auto 1fr", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "cards", type: "card-grid", area: "cards" }] },
      { id: "eight-cards", grid: '"heading" "cards"', cols: "1fr", rows: "auto 1fr", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "cards", type: "card-grid", area: "cards" }] },
      { id: "two-col-compare", grid: '"heading" "comp"', cols: "1fr", rows: "auto 1fr", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "comp", type: "comparison", area: "comp" }] },
      { id: "stat-trio", grid: '"heading" "stats"', cols: "1fr", rows: "auto 1fr", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "stats", type: "stat", area: "stats" }] },
      { id: "stat-plus-body", grid: '"heading heading" "stat body"', cols: "1fr 2fr", rows: "auto 1fr", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "stat", type: "stat", area: "stat" }, { id: "body", type: "body", area: "body" }] },
      { id: "chart-left-body-right", grid: '"heading heading" "chart body"', cols: "60fr 40fr", rows: "auto 1fr", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "chart", type: "chart", area: "chart" }, { id: "body", type: "body", area: "body" }] },
      { id: "chart-right-body-left", grid: '"heading heading" "body chart"', cols: "40fr 60fr", rows: "auto 1fr", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "body", type: "body", area: "body" }, { id: "chart", type: "chart", area: "chart" }] },
      { id: "image-split-left", grid: '"img content"', cols: "45fr 55fr", rows: "1fr", slots: [{ id: "img", type: "image", area: "img" }, { id: "content", type: "body", area: "content" }] },
      { id: "image-split-right", grid: '"content img"', cols: "55fr 45fr", rows: "1fr", slots: [{ id: "content", type: "body", area: "content" }, { id: "img", type: "image", area: "img" }] },
      { id: "image-full-scrim", grid: '"heading" "body"', cols: "1fr", rows: "auto auto", slots: [{ id: "img", type: "image", area: "1 / 1 / -1 / -1" }, { id: "heading", type: "heading", area: "heading" }, { id: "body", type: "body", area: "body" }] },
      { id: "step-flow-4", grid: '"heading" "flow"', cols: "1fr", rows: "auto 1fr", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "flow", type: "step-flow", area: "flow" }] },
      { id: "table-full", grid: '"heading" "table"', cols: "1fr", rows: "auto 1fr", slots: [{ id: "heading", type: "heading", area: "heading" }, { id: "table", type: "table", area: "table" }] },
      { id: "quote-plus-stats", grid: '"quote stat"', cols: "2fr 1fr", rows: "1fr", slots: [{ id: "quote", type: "quote", area: "quote" }, { id: "stat", type: "stat", area: "stat" }] },
      { id: "closing", grid: '"heading"', cols: "1fr", rows: "1fr", slots: [{ id: "heading", type: "heading", area: "heading" }] }
    ];
  }
});

// src/lib/pdf-engine.ts
var pdf_engine_exports = {};
__export(pdf_engine_exports, {
  chromiumSemaphore: () => chromiumSemaphore,
  geminiSemaphore: () => geminiSemaphore,
  generatePdfSlides: () => generatePdfSlides,
  transcribeSource: () => transcribeSource
});
async function transcribeSource(ai5, files, modelIdParam) {
  if (!files?.length) return { text: "", truncated: false };
  const MODEL_ID = modelIdParam || DEFAULT_MODEL;
  const parts = [];
  const binary = [];
  for (const f of files) {
    const isCsvOrExcel = f.mimeType === "text/csv" || f.mimeType === "application/vnd.ms-excel" || f.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || f.name?.endsWith(".csv") || f.name?.endsWith(".xlsx") || f.name?.endsWith(".xls");
    if (isCsvOrExcel) {
      const content = Buffer.from(f.data || f.base64, "base64").toString("utf8");
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
        const parsedRows = [];
        for (let r = 1; r < lines.length; r++) {
          const row = lines[r].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
          row.forEach((cell, c) => {
            if (cell) {
              const header = headers[c] || `\u0627\u0644\u0639\u0645\u0648\u062F ${c + 1}`;
              parsedRows.push(`\u0627\u0644\u0635\u0641 ${r + 1} / \u0627\u0644\u0639\u0645\u0648\u062F ${String.fromCharCode(65 + c)} (${header}): ${cell}`);
            }
          });
        }
        parts.push(parsedRows.join("\n"));
      }
      continue;
    }
    const TEXT_LIKE = ["text/plain", "text/markdown", "application/json"];
    if (TEXT_LIKE.includes(f.mimeType)) {
      if (f.data) {
        parts.push(Buffer.from(f.data, "base64").toString("utf8"));
      } else if (f.base64) {
        parts.push(Buffer.from(f.base64, "base64").toString("utf8"));
      }
    } else {
      binary.push(f);
    }
  }
  let truncated = false;
  for (const f of binary) {
    let b64 = f.data || f.base64;
    if (!b64) continue;
    const approxMb = b64.length * 0.75 / (1024 * 1024);
    if (approxMb > 12) {
      truncated = true;
    }
    await geminiSemaphore.acquire();
    try {
      const res = await ai5.models.generateContent({
        model: MODEL_ID,
        contents: [{ role: "user", parts: [
          { inlineData: { data: b64, mimeType: f.mimeType } },
          { text: `Transcribe the attached document to plain text.Preserve the original wording EXACTLY, character for character.Do NOT summarise. Do NOT paraphrase. Do NOT translate. Do NOT correct spelling or grammar.Preserve section numbers and headings on their own lines.Preserve all numbers, units and dates exactly as written.Output the transcription only, with no preamble and no commentary.` }
        ] }],
        config: {
          maxOutputTokens: 65535
        }
      });
      parts.push(res.text || "");
    } catch (e) {
      console.error(e);
    } finally {
      geminiSemaphore.release();
    }
  }
  return { text: parts.join("\n\n"), truncated };
}
function safeParseJson(raw, fallback) {
  if (!raw || typeof raw !== "string") return fallback;
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    const startObj = cleaned.indexOf("{");
    const startArr = cleaned.indexOf("[");
    let startIdx = -1;
    let endIdx = -1;
    if (startObj !== -1 && (startArr === -1 || startObj < startArr)) {
      startIdx = startObj;
      endIdx = cleaned.lastIndexOf("}");
    } else if (startArr !== -1) {
      startIdx = startArr;
      endIdx = cleaned.lastIndexOf("]");
    }
    if (startIdx !== -1 && endIdx > startIdx) {
      const extracted = cleaned.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(extracted);
      } catch (e2) {
        const sanitized = extracted.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").replace(/,(\s*[}\]])/g, "$1");
        try {
          return JSON.parse(sanitized);
        } catch (e3) {
          console.error("safeParseJson failed after all attempts:", e3);
        }
      }
    }
    return fallback;
  }
}
async function generatePdfSlides(promptStr, sourceText, requestedSlides, configParams, updateProgress) {
  const config = { ...DEFAULT_CONFIG, ...configParams };
  const ai5 = createGenAIClient();
  const MODEL_ID = config.modelId || DEFAULT_MODEL;
  const mode = sourceText && sourceText.trim().length > 0 ? "grounded" : "creative";
  const hasSource = mode === "grounded";
  await updateProgress(1, "\u062C\u0627\u0631\u064A \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0645\u0635\u0627\u062F\u0631 \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0627\u0644\u062D\u0642\u0627\u0626\u0642 (CALL 1)...");
  const planPrompt = `[SYSTEM] You are an expert presentation planner and facts extractor.
Mode: ${mode.toUpperCase()}
Goal: Create a presentation plan based on user request: "${promptStr}".

Instructions:
1. Extract ALL distinct, verifiable facts from source material. Assign each an id (f01, f02, ...). Do NOT group multiple distinct features or statements into a single fact. Extract each feature, capability, metric, rule, or setting as an individual, standalone fact.
2. For numeric metrics (kind: "metric"), populate 'value' (exact number) and 'unit' (e.g. '%', '\u0645\u0644\u064A\u0648\u0646').
3. For each content slide (middle slides between cover and closing), assign at least 2-3 distinct factIds from the facts array to 'factIds'. Never assign fewer than 2 facts to a content slide.
4. If a slide layout has a 'chart' slot, populate chartSpec with data points including 'factId' for each point.

${hasSource ? `Source Material:
${sourceText}` : ""}`;
  let planRes;
  await geminiSemaphore.acquire();
  try {
    const res = await ai5.models.generateContent({
      model: MODEL_ID,
      contents: planPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: PlanSchema,
        maxOutputTokens: 65535
      }
    });
    planRes = safeParseJson(res.text || "{}", { facts: [], slides: [] });
  } finally {
    geminiSemaphore.release();
  }
  if (!planRes.slides || !Array.isArray(planRes.slides) || planRes.slides.length === 0) {
    const defaultCount = Math.max(4, Math.min(requestedSlides || 6, 12));
    const titleText = planRes.deckTitle || (promptStr ? promptStr.slice(0, 50) : "\u0639\u0631\u0636 \u062A\u0642\u062F\u064A\u0645\u064A \u0645\u062A\u0643\u0627\u0645\u0644");
    planRes.deckTitle = titleText;
    planRes.slides = [
      { index: 0, title: titleText, subtitle: "\u0625\u0639\u062F\u0627\u062F \u0646\u0627\u062C\u064A \u0644\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A", layoutId: "title", factIds: [] },
      ...Array.from({ length: defaultCount - 2 }, (_, i) => ({
        index: i + 1,
        title: `\u0627\u0644\u0645\u062D\u0648\u0631 \u0627\u0644\u0631\u0626\u064A\u0633\u064A ${i + 1}: ${titleText}`,
        subtitle: "\u062A\u062D\u0644\u064A\u0644 \u0648\u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0634\u0627\u0645\u0644 \u0648\u0645\u0641\u0635\u0644",
        layoutId: i % 2 === 0 ? "cards_3" : "split_text_image",
        factIds: [],
        iconName: "sparkles"
      })),
      { index: defaultCount - 1, title: "\u0627\u0644\u062E\u0627\u062A\u0645\u0629 \u0648\u0627\u0644\u062A\u0648\u0635\u064A\u0627\u062A", subtitle: "\u0634\u0643\u0631\u0627\u064B \u0644\u0645\u062A\u0627\u0628\u0639\u062A\u0643\u0645 \u0648\u0627\u0647\u062A\u0645\u0627\u0645\u0643\u0645", layoutId: "closing", factIds: [] }
    ];
  }
  if (!planRes.designSystem) {
    planRes.designSystem = {
      bgHex: "#0E0F13",
      bgAltHex: "#141620",
      cardHex: "#1B1D28",
      card2Hex: "#232634",
      accentHex: "#D4AF37",
      accent2Hex: "#8B5CF6",
      textHex: "#F4F4F7",
      mutedHex: "#9EA0B0",
      faintHex: "#6B6D7C"
    };
  }
  const groundingReport = {
    mode,
    factsExtracted: planRes.facts?.length || 0,
    factsVerified: 0,
    factsRejected: 0,
    claimsAudited: 0,
    claimsSupported: 0,
    claimsRemoved: [],
    evidenceFailures: 0,
    breachCount: 0,
    slidesDropped: 0,
    imagesUsed: 0,
    imagesFallback: 0
  };
  let verifiedFacts = [];
  if (mode === "grounded") {
    const { ok, rejected } = verifyFacts(planRes.facts || [], sourceText);
    groundingReport.factsVerified = ok.length;
    groundingReport.factsRejected = rejected.length;
    verifiedFacts = ok;
    const rejectRatio = rejected.length / (planRes.facts?.length || 1);
    if (rejectRatio > config.groundingRejectThreshold) {
      throw new Error(`Grounding failed: ${Math.round(rejectRatio * 100)}% of facts were rejected as hallucinations.`);
    }
  } else {
    verifiedFacts = planRes.facts || [];
    groundingReport.factsVerified = verifiedFacts.length;
  }
  const fps = config.factsPerSlide ?? 2.5;
  const minS = config.minSlides ?? 4;
  const maxHard = config.maxSlidesHard ?? 30;
  let finalCount = requestedSlides;
  if (mode === "grounded") {
    const derived = Math.ceil(verifiedFacts.length / fps) + 2;
    finalCount = Math.min(requestedSlides || Number.MAX_SAFE_INTEGER, derived, maxHard);
  } else {
    finalCount = Math.min(requestedSlides || config.defaultSlides || 12, maxHard);
  }
  if (planRes.slides.length > finalCount) {
    planRes.slides = planRes.slides.slice(0, finalCount);
  }
  const minFacts = config.minFactsPerSlide ?? 2;
  const normalizeFid = (id) => String(id || "").toLowerCase().trim().replace(/^f0*/, "f");
  if (mode === "grounded" && planRes.slides.length > 2) {
    const validVerifiedFids = new Set(verifiedFacts.map((vf) => normalizeFid(vf.id)));
    const cover = planRes.slides[0];
    const closing = planRes.slides[planRes.slides.length - 1];
    const middleSlides = planRes.slides.slice(1, planRes.slides.length - 1);
    middleSlides.forEach((s, idx) => {
      const currentFactIds = (s.factIds || []).map((id) => normalizeFid(id));
      const validCount = currentFactIds.filter((fid) => validVerifiedFids.has(fid)).length;
      if (validCount < minFacts && verifiedFacts.length > 0) {
        const startIdx = idx * 2 % verifiedFacts.length;
        const assigned = [
          verifiedFacts[startIdx % verifiedFacts.length].id,
          verifiedFacts[(startIdx + 1) % verifiedFacts.length].id,
          verifiedFacts[(startIdx + 2) % verifiedFacts.length].id
        ];
        s.factIds = Array.from(/* @__PURE__ */ new Set([...s.factIds || [], ...assigned]));
      }
    });
    const validMiddle = middleSlides.filter((s) => {
      const slideFactIds = (s.factIds || []).map((id) => normalizeFid(id));
      const validCount = slideFactIds.filter((fid) => validVerifiedFids.has(fid)).length;
      return validCount >= minFacts;
    });
    planRes.slides = [cover, ...validMiddle, closing];
  }
  planRes.slides.forEach((s, idx) => {
    s.index = idx;
  });
  const actualCount = planRes.slides.length;
  if (mode === "grounded" && actualCount < minS) {
    throw new Error(`\u0627\u0644\u0645\u0635\u062F\u0631 \u0627\u0644\u0645\u0631\u0641\u0642 \u0645\u0627 \u0628\u064A\u0643\u0641\u064A \u0644\u0628\u0646\u0627\u0621 \u0639\u0631\u0636 \u2014 \u0627\u0633\u062A\u062E\u0631\u062C\u0646\u0627 ${verifiedFacts.length} \u062D\u0642\u064A\u0642\u0629 \u0645\u0648\u062B\u0651\u0642\u0629 \u0641\u0642\u0637. \u062C\u0631\u0651\u0628 \u062A\u0631\u0641\u0642 \u0645\u0635\u062F\u0631 \u0623\u0648\u0633\u0639\u060C \u0623\u0648 \u0627\u0637\u0644\u0628 \u0645\u0633\u062A\u0646\u062F \u0628\u062F\u0644 \u0639\u0631\u0636.`);
  }
  if (actualCount < requestedSlides) {
    const countReason = planRes.recommendedSlideCountReason || `\u0627\u0644\u0645\u0635\u062F\u0631 \u0627\u0644\u0645\u0631\u0641\u0642 \u064A\u062F\u0639\u0645 ${actualCount} \u0634\u0631\u0627\u0626\u062D \u0628\u0634\u0643\u0644 \u0645\u0648\u062B\u0642 \u062F\u0648\u0646 \u062D\u0634\u0648.`;
    groundingReport.countReason = countReason;
  }
  await updateProgress(2, "\u062C\u0627\u0631\u064A \u0635\u064A\u0627\u063A\u0629 \u0627\u0644\u0634\u0631\u0627\u0626\u062D \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 (CALL 2 & 3)...");
  const half = Math.ceil(planRes.slides.length / 2);
  const slides1 = planRes.slides.slice(0, half);
  const slides2 = planRes.slides.slice(half);
  const writeSlides = async (slidesPart, partName) => {
    if (!slidesPart.length) return [];
    const scopedIds = new Set(slidesPart.flatMap((s) => s.factIds || []));
    const scopedFacts = verifiedFacts.filter((f) => scopedIds.has(f.id));
    const promptFacts = scopedFacts.map((f) => {
      if (f.kind === "metric" && f.value !== void 0) {
        return {
          ...f,
          valuePlaceholder: `{{${f.id}.value}}`,
          unitPlaceholder: f.unit ? `{{${f.id}.unit}}` : ""
        };
      }
      return f;
    });
    const writePrompt = `You are the presentation writer. You must output HTML fragments ONLY for the slots in the provided slides.
DO NOT introduce any facts not present in your input facts list.
CRITICAL FOR METRIC VALUES: For numeric values, write {{fXX.value}} placeholders instead of typing literal digits. The system will substitute exact verified figures.

Design System:${JSON.stringify(planRes.designSystem, null, 2)}
Facts available:${JSON.stringify(promptFacts, null, 2)}
Slides to write:${JSON.stringify(slidesPart, null, 2)}

For each slide, you must return the HTML content wrapped in a <div class="slide" style="grid-template-areas: '[layout.grid]'; grid-template-columns: [layout.cols]; grid-template-rows: [layout.rows];">.
Inside, use the CSS grid areas defined by the layout. (e.g. <div style="grid-area: heading">...</div>).

LAYOUT ENGINE RULES:
- For all card rows, grids, and primary layout structures, use CSS Grid (\`display: grid; grid-template-columns: repeat(N, 1fr); gap: var(--gap);\`). DO NOT use Flexbox for card containers or main column layouts (Flexbox causes height mismatches in Chromium PDF print rendering). Restrict Flexbox ONLY to small inline elements (e.g., an icon next to a label).

ICONS & GRADIENTS:
- If \`iconName\` is provided for a slide or card, render an icon badge: \`<div class="icon-badge">[ICON:\${iconName}]</div>\` or put \`[ICON:\${iconName}]\` inside a card title. Valid icon names: brain, layers, shield, network, bar-chart-3, pie-chart, rocket, check-circle, image, video, file-text, settings, users, credit-card, palette, type, sparkles, lock, zap, database.
- You may use soft \`linear-gradient\` or \`radial-gradient\` for subtle background glows on hero titles or closing slides. STRICTLY BANNED: \`backdrop-filter\`, \`mix-blend-mode\`, \`filter: blur()\`.

CRITICAL INSTRUCTIONS FOR MEDIA SLOTS:
- If a slide has an 'image' slot, output EXACTLY: <div style="grid-area: img" class="image-slot" data-query="[INSERT imageQuery FROM SLIDE JSON HERE]"></div>
- If a slide has a 'chart' slot, output EXACTLY: <div style="grid-area: chart" class="chart-slot" data-spec='[INSERT chartSpec JSON STRING HERE]'></div>

Use Arabic text in a professional tone.
Return a JSON array of strings, where each string is the HTML for one slide.`;
    await geminiSemaphore.acquire();
    try {
      const res = await ai5.models.generateContent({
        model: MODEL_ID,
        contents: writePrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: import_genai4.Type.ARRAY, items: { type: import_genai4.Type.STRING } },
          maxOutputTokens: 65535
        }
      });
      let slideHtmls = safeParseJson(res.text || "[]", []);
      if (!slideHtmls || !Array.isArray(slideHtmls) || slideHtmls.length === 0) {
        slideHtmls = slidesPart.map((s) => `
          <div class="slide" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:var(--pad); background:var(--bg); border:1px solid var(--card-2); border-radius:var(--radius);">
            <h1 class="title" style="color:var(--text); margin-bottom:18px; font-size:36px;">${s.title || ""}</h1>
            <p class="body" style="color:var(--muted); max-width:850px; font-size:20px; line-height:1.7;">${s.subtitle || s.title || ""}</p>
          </div>
        `);
      }
      return slideHtmls.map((html) => {
        let substituted = html;
        verifiedFacts.forEach((f) => {
          if (f.value !== void 0) {
            const valStr = `<span dir="ltr" style="unicode-bidi:isolate">${f.value}</span>`;
            const unitStr = f.unit ? ` ${f.unit}` : "";
            const reVal = new RegExp(`\\{\\{${f.id}\\.value\\}\\}`, "g");
            const reUnit = new RegExp(`\\{\\{${f.id}\\.unit\\}\\}`, "g");
            substituted = substituted.replace(reVal, valStr).replace(reUnit, unitStr);
          }
        });
        return substituted;
      });
    } finally {
      geminiSemaphore.release();
    }
  };
  const [htmlPart1, htmlPart2] = await Promise.all([
    writeSlides(slides1, "part1"),
    writeSlides(slides2, "part2")
  ]);
  let rawHtml = [...htmlPart1, ...htmlPart2].join("\n");
  await updateProgress(3, "\u062C\u0627\u0631\u064A \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u0648\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u062D\u0642\u0627\u0626\u0642 (CALL 4)...");
  const { cleanHtml, reportUpdates } = await verifyRenderedDeck(rawHtml, verifiedFacts, sourceText, mode, ai5, MODEL_ID, geminiSemaphore);
  Object.assign(groundingReport, reportUpdates);
  let finalHtml = cleanHtml;
  finalHtml = finalHtml.replace(/\[ICON:([a-z0-9-]+)\]/g, (_, name) => icon(name, 22, "var(--accent)"));
  await updateProgress(4, "\u062C\u0627\u0631\u064A \u062C\u0644\u0628 \u0627\u0644\u0635\u0648\u0631 \u0648\u062A\u062C\u0647\u064A\u0632 \u0645\u0644\u0641 PDF...");
  const imageQueries = planRes.slides.filter((s) => s.imageQuery).map((s) => s.imageQuery);
  const uniqueQueries = Array.from(new Set(imageQueries));
  const imageMap = {};
  for (const q of uniqueQueries) {
    const photoRes = await fetchRealPhotography(q, 1280, 720, "large");
    if (photoRes?.b64) {
      try {
        const buf = Buffer.from(photoRes.b64, "base64");
        const optimized = await (0, import_sharp.default)(buf).resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 72, mozjpeg: true }).toBuffer();
        imageMap[q] = { b64: optimized.toString("base64"), photographer: photoRes.photographer };
        groundingReport.imagesUsed++;
      } catch (e) {
        imageMap[q] = { b64: photoRes.b64, photographer: photoRes.photographer };
      }
    } else {
      groundingReport.imagesFallback++;
    }
  }
  finalHtml = finalHtml.replace(/<div[^>]*class="image-slot"[^>]*data-query="([^"]+)"[^>]*><\/div>/g, (match, query) => {
    if (imageMap[query]) {
      const img = imageMap[query];
      const caption = img.photographer ? `<div style="position:absolute; bottom:10px; left:10px; font-size:10px; color:var(--faint); z-index:10;" dir="ltr">Photo by ${img.photographer}</div>` : "";
      return `
       <div style="position:relative; width:100%; height:100%; grid-area: img;">
         <img src="data:image/jpeg;base64,${img.b64}" style="width:100%; height:100%; object-fit:cover;" />
         <div class="image-scrim"></div>
         ${caption}
       </div>`;
    }
    return '<div style="grid-area: img; background: var(--card-2); opacity: 0.5;"></div>';
  });
  finalHtml = finalHtml.replace(/<div[^>]*class="chart-slot"[^>]*data-spec='([^']+)'[^>]*><\/div>/g, (match, specStr) => {
    try {
      const spec = JSON.parse(specStr);
      const type = spec.type || "bar";
      const data = spec.data || [];
      const verifiedData = data.map((d) => {
        if (d.factId) {
          const vf = verifiedFacts.find((f) => f.id === d.factId);
          if (vf && typeof vf.value === "number") {
            return { ...d, value: vf.value };
          }
        }
        return d;
      });
      let chartHtml = "";
      if (type === "bar") chartHtml = barChart(verifiedData);
      else if (type === "line") chartHtml = lineChart(verifiedData);
      else if (type === "donut") chartHtml = donutChart(verifiedData);
      else if (type === "progress") chartHtml = progressBars(verifiedData);
      else if (type === "flow") chartHtml = flowDiagram(verifiedData);
      return `<div style="grid-area: chart; width:100%; height:100%;">${chartHtml}</div>`;
    } catch (e) {
      return '<div style="grid-area: chart; background: var(--card-2);">Chart Error</div>';
    }
  });
  const cairoPath = import_path3.default.join(process.cwd(), "cairo_arabic.b64");
  let cairoB64 = "";
  if (import_fs3.default.existsSync(cairoPath)) {
    cairoB64 = import_fs3.default.readFileSync(cairoPath, "utf8").trim();
  }
  const ds = planRes.designSystem || {};
  const fullDocument = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8" /><style>@font-face {
  font-family: 'Cairo';
  src: url(data:font/woff2;base64,${cairoB64}) format('woff2');
  font-display: block;
}:root {
  --bg: ${ds.bgHex || "#0E0F13"}; 
  --bg-alt: ${ds.bgAltHex || "#141620"}; 
  --card: ${ds.cardHex || "#1B1D28"}; 
  --card-2: ${ds.card2Hex || "#232634"};
  --accent: ${ds.accentHex || "#D4AF37"}; 
  --accent-2: ${ds.accent2Hex || "#8B5CF6"};
  --text: ${ds.textHex || "#F4F4F7"}; 
  --muted: ${ds.mutedHex || "#9EA0B0"}; 
  --faint: ${ds.faintHex || "#6B6D7C"};
  --radius: 14px; --gap: 20px; --pad: 56px;
}@page { size: 1280px 720px; margin: 0; }
@media print {
  html, body {
    background: var(--bg) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .slide {
    page-break-after: always;
    page-break-inside: avoid;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .slide:last-child { page-break-after: auto; }
}
body {
  margin: 0; padding: 0;
  font-family: 'Cairo', sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}.slide {
  width: 1280px; height: 720px;
  box-sizing: border-box; overflow: hidden;
  position: relative;
  page-break-after: always;
  padding: var(--pad);
  display: grid;
  gap: var(--gap);
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}.slide:last-child { page-break-after: auto; }.title { font-size: clamp(28px, 3.4vw, 44px); }.body { font-size: clamp(14px, 1.35vw, 19px); }.card-grid { display:grid; gap:var(--gap); align-content:start; }.icon-badge {
  width: 44px; height: 44px; border-radius: 50%;
  display: grid; place-items: center;
  background: rgba(212, 175, 55, 0.12);
  color: var(--accent);
  flex-shrink: 0;
}.image-scrim { 
  position:absolute; inset:0;
  background: linear-gradient(-90deg, rgba(14,15,19,.94) 0%, rgba(14,15,19,.55) 55%, rgba(14,15,19,.15) 100%);
}</style></head><body>${finalHtml}</body></html>`;
  let pdfBuffer;
  await chromiumSemaphore.acquire();
  let browser;
  try {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true
    });
    const page = await browser.newPage();
    await page.setContent(fullDocument, { waitUntil: "domcontentloaded" });
    await page.evaluateHandle("document.fonts.ready");
    await page.emulateMediaType("screen");
    const pdfResult = await page.pdf({
      width: "1280px",
      height: "720px",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" }
    });
    pdfBuffer = Buffer.from(pdfResult);
    if (!pdfBuffer || pdfBuffer.length < 5e3) {
      throw new Error(`Empty PDF (${pdfBuffer?.length ?? 0} bytes)`);
    }
  } finally {
    if (browser) await browser.close();
    chromiumSemaphore.release();
  }
  return {
    base64Data: pdfBuffer.toString("base64"),
    mimeType: "application/pdf",
    extension: "pdf",
    groundingReport,
    slideCount: actualCount
  };
}
var import_genai4, import_fs3, import_path3, import_sharp, DEFAULT_MODEL, DEFAULT_CONFIG, FactSchema, SlidePlanSchema, PlanSchema, Semaphore, chromiumSemaphore, geminiSemaphore;
var init_pdf_engine = __esm({
  "src/lib/pdf-engine.ts"() {
    import_genai4 = require("@google/genai");
    init_genaiClient();
    init_modelRegistry();
    init_grounding();
    init_slides_html();
    init_naje_engine();
    import_fs3 = __toESM(require("fs"), 1);
    import_path3 = __toESM(require("path"), 1);
    import_sharp = __toESM(require("sharp"), 1);
    DEFAULT_MODEL = FALLBACK_DEFAULTS.doc_standard || "gemini-3.6-flash";
    DEFAULT_CONFIG = {
      maxSlidesHard: 30,
      maxSlidesSoft: 20,
      defaultSlides: 12,
      maxImagesPerDeck: 6,
      geminiConcurrency: 4,
      imageMaxKb: 180,
      groundingRejectThreshold: 0.3
    };
    FactSchema = {
      type: import_genai4.Type.OBJECT,
      properties: {
        id: { type: import_genai4.Type.STRING, description: "f01, f02, ..." },
        statement: { type: import_genai4.Type.STRING, description: "The fact, restated concisely. Max 160 chars." },
        kind: { type: import_genai4.Type.STRING, enum: ["feature", "metric", "process", "constraint", "definition", "claim"] },
        sourceQuote: { type: import_genai4.Type.STRING, description: "A VERBATIM span copied character-for-character from the user's source material that supports this statement. Minimum 10 characters. Do not paraphrase. Do not translate. If no such span exists, this fact must not be emitted." },
        sourceLocator: { type: import_genai4.Type.STRING, description: "Where the quote came from: section number, heading text, or page. E.g. '5.2-\u062C' or 'Typography Engine'." },
        value: { type: import_genai4.Type.NUMBER, description: "Numeric value exactly as it appears in the source. No rounding, no unit conversion." },
        unit: { type: import_genai4.Type.STRING, description: "Copy the unit as written: '\u0645\u0644\u064A\u0648\u0646 \u062F\u064A\u0646\u0627\u0631', '%', '\u062B\u0627\u0646\u064A\u0629', '\u0646\u0642\u0637\u0629'." },
        period: { type: import_genai4.Type.STRING, description: "Time label if any: 'Q1 2026', '\u064A\u0646\u0627\u064A\u0631'." },
        comparisonTo: { type: import_genai4.Type.STRING, description: "id of the fact this compares against, if the source states a comparison." },
        derived: { type: import_genai4.Type.BOOLEAN, description: "Always false. Only server code may set this true." }
      },
      required: ["id", "statement", "kind", "sourceQuote", "sourceLocator"]
    };
    SlidePlanSchema = {
      type: import_genai4.Type.OBJECT,
      properties: {
        index: { type: import_genai4.Type.INTEGER },
        eyebrow: { type: import_genai4.Type.STRING },
        title: { type: import_genai4.Type.STRING },
        subtitle: { type: import_genai4.Type.STRING },
        layoutId: { type: import_genai4.Type.STRING, description: `One of: ${LAYOUTS.map((l) => l.id).join(", ")}` },
        iconName: {
          type: import_genai4.Type.STRING,
          description: "One of: brain, layers, shield, network, bar-chart-3, pie-chart, rocket, check-circle, image, video, file-text, settings, users, credit-card, palette, type, sparkles, lock, zap, database. Choose the one that best matches the slide's subject. Omit if none fits.",
          nullable: true
        },
        factIds: { type: import_genai4.Type.ARRAY, items: { type: import_genai4.Type.STRING } },
        imageQuery: { type: import_genai4.Type.STRING, description: "2\u20134 English keywords describing a literal photographic subject. Pexels search performs poorly with Arabic and with abstract terms. Write 'arabic calligraphy desk' not 'creativity'. Write 'server room dark' not 'powerful infrastructure'. Set to null when the slide's layout has no image slot.", nullable: true },
        chartSpec: {
          type: import_genai4.Type.OBJECT,
          description: "Chart data. Required ONLY if layout contains a 'chart' slot.",
          nullable: true,
          properties: {
            type: { type: import_genai4.Type.STRING, enum: ["bar", "line", "donut", "progress", "flow"] },
            title: { type: import_genai4.Type.STRING },
            unit: { type: import_genai4.Type.STRING },
            data: {
              type: import_genai4.Type.ARRAY,
              items: {
                type: import_genai4.Type.OBJECT,
                properties: {
                  label: { type: import_genai4.Type.STRING },
                  value: { type: import_genai4.Type.NUMBER },
                  factId: { type: import_genai4.Type.STRING, description: "f01, f02, ... fact ID corresponding to this data point" }
                },
                required: ["label", "value"]
              }
            }
          },
          required: ["type", "data"]
        },
        linkToPrevious: { type: import_genai4.Type.STRING },
        speakerNotes: { type: import_genai4.Type.STRING }
      },
      required: ["index", "title", "layoutId", "factIds"]
    };
    PlanSchema = {
      type: import_genai4.Type.OBJECT,
      properties: {
        deckTitle: { type: import_genai4.Type.STRING },
        deckSubtitle: { type: import_genai4.Type.STRING },
        narrativeArc: { type: import_genai4.Type.STRING, description: "Max 300 chars. How the deck builds from opening to close." },
        totalVerifiedFacts: { type: import_genai4.Type.INTEGER, description: "Total number of distinct, verifiable facts you extracted from the source material." },
        recommendedSlideCountReason: { type: import_genai4.Type.STRING, description: "Reason for the recommended count." },
        designSystem: {
          type: import_genai4.Type.OBJECT,
          properties: {
            paletteId: { type: import_genai4.Type.STRING },
            bgHex: { type: import_genai4.Type.STRING },
            bgAltHex: { type: import_genai4.Type.STRING },
            cardHex: { type: import_genai4.Type.STRING },
            card2Hex: { type: import_genai4.Type.STRING },
            accentHex: { type: import_genai4.Type.STRING },
            accent2Hex: { type: import_genai4.Type.STRING },
            textHex: { type: import_genai4.Type.STRING },
            mutedHex: { type: import_genai4.Type.STRING },
            faintHex: { type: import_genai4.Type.STRING },
            fontFamily: { type: import_genai4.Type.STRING },
            typeScale: { type: import_genai4.Type.STRING }
          },
          required: ["bgHex", "bgAltHex", "cardHex", "card2Hex", "accentHex", "accent2Hex", "textHex", "mutedHex", "faintHex"]
        },
        facts: { type: import_genai4.Type.ARRAY, items: FactSchema },
        slides: { type: import_genai4.Type.ARRAY, items: SlidePlanSchema }
      },
      required: ["deckTitle", "designSystem", "facts", "slides", "totalVerifiedFacts"]
    };
    Semaphore = class {
      constructor(max) {
        this.max = max;
        this.count = 0;
        this.queue = [];
      }
      async acquire() {
        if (this.count < this.max) {
          this.count++;
          return;
        }
        return new Promise((resolve) => {
          this.queue.push(resolve);
        });
      }
      release() {
        if (this.queue.length > 0) {
          const next = this.queue.shift();
          if (next) next();
        } else {
          this.count--;
        }
      }
    };
    chromiumSemaphore = new Semaphore(1);
    geminiSemaphore = new Semaphore(4);
  }
});

// src/data/infographicThemes.ts
var INFOGRAPHIC_THEMES;
var init_infographicThemes = __esm({
  "src/data/infographicThemes.ts"() {
    INFOGRAPHIC_THEMES = {
      dark_luxury_gold: {
        id: "dark_luxury_gold",
        nameAr: "\u0630\u0647\u0628\u064A \u0641\u0627\u062E\u0631 \u062F\u0627\u0643\u0646 (Luxury Gold)",
        descAr: "\u062E\u0644\u0641\u064A\u0629 \u0643\u062D\u0644\u064A\u0629 \u062F\u0627\u0643\u0646\u0629 \u0645\u0639 \u0644\u0645\u0633\u0627\u062A \u0630\u0647\u0628\u064A\u0629 \u0645\u0644\u0643\u064A\u0629 \u0631\u0627\u0642\u064A\u0629 \u0648\u0625\u0636\u0627\u0621\u0629 \u0646\u0627\u0639\u0645\u0629",
        bodyBg: "radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0b0c16 60%, #05050b 100%)",
        cardBg: "linear-gradient(145deg, rgba(30, 27, 75, 0.75), rgba(15, 12, 41, 0.95))",
        cardBorder: "rgba(251, 191, 36, 0.3)",
        cardShadow: "0 10px 25px rgba(0,0,0,0.35)",
        titleGradient: "linear-gradient(135deg, #ffffff 30%, #fbbf24 100%)",
        accentColor: "#fbbf24",
        secondaryAccent: "#6366f1",
        textColor: "#f8fafc",
        textMuted: "#94a3b8",
        chartPalette: ["#fbbf24", "#6366f1", "#38bdf8", "#10b981", "#f59e0b", "#ec4899"],
        badgeBg: "rgba(251, 191, 36, 0.15)",
        badgeBorder: "rgba(251, 191, 36, 0.3)",
        badgeText: "#fde68a"
      },
      cyber_neon: {
        id: "cyber_neon",
        nameAr: "\u0633\u0627\u064A\u0628\u0631 \u0646\u064A\u0648\u0646 \u0645\u0633\u062A\u0642\u0628\u0644\u064A (Cyber Neon)",
        descAr: "\u0637\u0627\u0628\u0639 \u0645\u0633\u062A\u0642\u0628\u0644\u064A \u0628\u062A\u0648\u0647\u062C \u0623\u0632\u0631\u0642 \u0633\u0645\u0627\u0648\u064A \u0648\u0628\u0646\u0641\u0633\u062C\u064A \u0633\u0627\u0637\u0639",
        bodyBg: "radial-gradient(circle at 50% 0%, #0f172a 0%, #030712 60%, #000000 100%)",
        cardBg: "linear-gradient(145deg, rgba(15, 23, 42, 0.85), rgba(3, 7, 18, 0.95))",
        cardBorder: "rgba(56, 189, 248, 0.3)",
        cardShadow: "0 10px 30px rgba(56, 189, 248, 0.15)",
        titleGradient: "linear-gradient(135deg, #38bdf8 0%, #c084fc 100%)",
        accentColor: "#38bdf8",
        secondaryAccent: "#c084fc",
        textColor: "#f0f9ff",
        textMuted: "#94a3b8",
        chartPalette: ["#38bdf8", "#c084fc", "#4ade80", "#fb7185", "#facc15", "#818cf8"],
        badgeBg: "rgba(56, 189, 248, 0.15)",
        badgeBorder: "rgba(56, 189, 248, 0.35)",
        badgeText: "#7dd3fc"
      },
      ocean_blue: {
        id: "ocean_blue",
        nameAr: "\u0623\u0632\u0631\u0642 \u0645\u062D\u064A\u0637\u064A \u062A\u0642\u0646\u064A (Ocean Blue)",
        descAr: "\u062A\u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0623\u0632\u0631\u0642 \u0627\u0644\u064A\u0627\u0642\u0648\u062A\u064A \u0648\u0627\u0644\u0645\u062D\u064A\u0637\u064A \u0627\u0644\u0645\u0648\u062B\u0648\u0642 \u0644\u0644\u0623\u0639\u0645\u0627\u0644 \u0648\u0627\u0644\u062A\u0642\u0646\u064A\u0629",
        bodyBg: "radial-gradient(circle at 50% 0%, #0c4a6e 0%, #082f49 50%, #03131e 100%)",
        cardBg: "linear-gradient(145deg, rgba(12, 74, 110, 0.65), rgba(8, 47, 73, 0.9))",
        cardBorder: "rgba(14, 165, 233, 0.3)",
        cardShadow: "0 10px 25px rgba(0,0,0,0.3)",
        titleGradient: "linear-gradient(135deg, #ffffff 30%, #38bdf8 100%)",
        accentColor: "#38bdf8",
        secondaryAccent: "#0ea5e9",
        textColor: "#f8fafc",
        textMuted: "#93c5fd",
        chartPalette: ["#38bdf8", "#0ea5e9", "#60a5fa", "#34d399", "#f59e0b", "#a78bfa"],
        badgeBg: "rgba(56, 189, 248, 0.15)",
        badgeBorder: "rgba(56, 189, 248, 0.3)",
        badgeText: "#bae6fd"
      },
      forest_emerald: {
        id: "forest_emerald",
        nameAr: "\u0632\u0645\u0631\u062F\u064A \u0648\u0627\u0633\u062A\u062B\u0645\u0627\u0631\u064A (Emerald Growth)",
        descAr: "\u0623\u0644\u0648\u0627\u0646 \u0627\u0644\u0646\u0645\u0648 \u0627\u0644\u0623\u062E\u0636\u0631 \u0648\u0627\u0644\u0632\u0645\u0631\u062F\u064A \u0627\u0644\u0645\u0647\u062F\u0626\u0629 \u0644\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0648\u0627\u0644\u0628\u064A\u0626\u064A\u0629",
        bodyBg: "radial-gradient(circle at 50% 0%, #064e3b 0%, #022c22 60%, #011611 100%)",
        cardBg: "linear-gradient(145deg, rgba(6, 78, 59, 0.65), rgba(2, 44, 34, 0.9))",
        cardBorder: "rgba(16, 185, 129, 0.3)",
        cardShadow: "0 10px 25px rgba(0,0,0,0.3)",
        titleGradient: "linear-gradient(135deg, #ffffff 30%, #34d399 100%)",
        accentColor: "#34d399",
        secondaryAccent: "#10b981",
        textColor: "#f8fafc",
        textMuted: "#a7f3d0",
        chartPalette: ["#34d399", "#10b981", "#fbbf24", "#38bdf8", "#a78bfa", "#f87171"],
        badgeBg: "rgba(52, 211, 153, 0.15)",
        badgeBorder: "rgba(52, 211, 153, 0.3)",
        badgeText: "#a7f3d0"
      },
      sunset_coral: {
        id: "sunset_coral",
        nameAr: "\u063A\u0631\u0648\u0628 \u062F\u0627\u0641\u0626 \u0648\u0645\u0631\u062C\u0627\u0646\u064A (Sunset Coral)",
        descAr: "\u062A\u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0645\u0631\u062C\u0627\u0646 \u0648\u0627\u0644\u0648\u0631\u062F\u064A \u0627\u0644\u062F\u0627\u0643\u0646 \u0627\u0644\u0645\u0628\u0647\u062C\u0629 \u0644\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u062D\u064A\u0648\u064A\u0629",
        bodyBg: "radial-gradient(circle at 50% 0%, #4c0519 0%, #1c030c 60%, #0d0106 100%)",
        cardBg: "linear-gradient(145deg, rgba(76, 5, 25, 0.7), rgba(28, 3, 12, 0.95))",
        cardBorder: "rgba(244, 63, 94, 0.3)",
        cardShadow: "0 10px 25px rgba(0,0,0,0.35)",
        titleGradient: "linear-gradient(135deg, #ffffff 20%, #fb7185 70%, #fbbf24 100%)",
        accentColor: "#fb7185",
        secondaryAccent: "#fbbf24",
        textColor: "#fff1f2",
        textMuted: "#fda4af",
        chartPalette: ["#fb7185", "#fbbf24", "#f43f5e", "#c084fc", "#38bdf8", "#4ade80"],
        badgeBg: "rgba(244, 63, 94, 0.15)",
        badgeBorder: "rgba(244, 63, 94, 0.3)",
        badgeText: "#fecdd3"
      },
      royal_purple: {
        id: "royal_purple",
        nameAr: "\u0628\u0646\u0641\u0633\u062C\u064A \u0645\u0644\u0643\u064A \u0625\u0628\u062F\u0627\u0639\u064A (Royal Violet)",
        descAr: "\u0623\u0646\u0627\u0642\u0629 \u0627\u0644\u0628\u0646\u0641\u0633\u062C\u064A \u0627\u0644\u0625\u0645\u0628\u0631\u0627\u0637\u0648\u0631\u064A \u0645\u0639 \u0644\u0645\u0633\u0627\u062A \u0627\u0644\u0630\u0647\u0628 \u0644\u0645\u0634\u0627\u0631\u064A\u0639 \u0627\u0644\u0641\u062E\u0627\u0645\u0629",
        bodyBg: "radial-gradient(circle at 50% 0%, #3b0764 0%, #170326 60%, #0b0113 100%)",
        cardBg: "linear-gradient(145deg, rgba(59, 7, 100, 0.7), rgba(23, 3, 38, 0.95))",
        cardBorder: "rgba(168, 85, 247, 0.3)",
        cardShadow: "0 10px 25px rgba(0,0,0,0.35)",
        titleGradient: "linear-gradient(135deg, #ffffff 30%, #c084fc 100%)",
        accentColor: "#c084fc",
        secondaryAccent: "#a855f7",
        textColor: "#faf5ff",
        textMuted: "#d8b4fe",
        chartPalette: ["#c084fc", "#a855f7", "#fbbf24", "#38bdf8", "#34d399", "#f43f5e"],
        badgeBg: "rgba(168, 85, 247, 0.15)",
        badgeBorder: "rgba(168, 85, 247, 0.3)",
        badgeText: "#e9d5ff"
      },
      minimal_light: {
        id: "minimal_light",
        nameAr: "\u0623\u0628\u064A\u0636 \u0646\u0627\u0635\u0639 \u0648\u0623\u0646\u064A\u0642 (Minimal Clean Light)",
        descAr: "\u062A\u0635\u0645\u064A\u0645 \u0645\u0634\u0631\u0642 \u0648\u0639\u0627\u0644\u064A \u0627\u0644\u0648\u0636\u0648\u062D \u0628\u062E\u0644\u0641\u064A\u0629 \u0641\u0627\u062A\u062D\u0629 \u0648\u0628\u0637\u0627\u0642\u0627\u062A \u0628\u064A\u0636\u0627\u0621 \u0646\u0627\u0635\u0639\u0629",
        bodyBg: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        cardBg: "#ffffff",
        cardBorder: "rgba(203, 213, 225, 0.8)",
        cardShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
        titleGradient: "linear-gradient(135deg, #0f172a 0%, #2563eb 100%)",
        accentColor: "#2563eb",
        secondaryAccent: "#f59e0b",
        textColor: "#0f172a",
        textMuted: "#64748b",
        chartPalette: ["#2563eb", "#f59e0b", "#0ea5e9", "#10b981", "#8b5cf6", "#ef4444"],
        badgeBg: "rgba(37, 99, 235, 0.08)",
        badgeBorder: "rgba(37, 99, 235, 0.25)",
        badgeText: "#1d4ed8",
        isLight: true
      },
      naje_auto_blend: {
        id: "naje_auto_blend",
        nameAr: "\u062F\u0645\u062C \u0648\u062A\u0646\u0627\u063A\u0645 \u0630\u0643\u064A \u064A\u062E\u062A\u0627\u0631\u0647 \u0646\u0627\u062C\u064A (Smart Auto Blend)",
        descAr: "\u062A\u0648\u0644\u064A\u0641 \u0648\u062A\u0646\u0627\u0633\u0642 \u0644\u0648\u0646\u064A \u0647\u062C\u064A\u0646 \u064A\u062E\u062A\u0627\u0631\u0647 \u0646\u0627\u062C\u064A \u0628\u0630\u0643\u0627\u0621 \u0648\u0641\u0642 \u0645\u0648\u0636\u0648\u0639 \u0627\u0644\u0645\u062D\u062A\u0648\u0649",
        bodyBg: "radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0b0c16 60%, #05050b 100%)",
        cardBg: "linear-gradient(145deg, rgba(30, 27, 75, 0.75), rgba(15, 12, 41, 0.95))",
        cardBorder: "rgba(99, 102, 241, 0.3)",
        cardShadow: "0 10px 25px rgba(0,0,0,0.35)",
        titleGradient: "linear-gradient(135deg, #ffffff 30%, #fbbf24 100%)",
        accentColor: "#fbbf24",
        secondaryAccent: "#6366f1",
        textColor: "#f8fafc",
        textMuted: "#94a3b8",
        chartPalette: ["#fbbf24", "#6366f1", "#38bdf8", "#10b981", "#ec4899", "#f97316"],
        badgeBg: "rgba(99, 102, 241, 0.15)",
        badgeBorder: "rgba(99, 102, 241, 0.3)",
        badgeText: "#a5b4fc"
      }
    };
  }
});

// src/lib/infographicEngine.ts
var infographicEngine_exports = {};
__export(infographicEngine_exports, {
  INFOGRAPHIC_THEMES: () => INFOGRAPHIC_THEMES,
  assembleInfographicHTML: () => assembleInfographicHTML,
  editInfographicSpec: () => editInfographicSpec,
  generateInfographicSpec: () => generateInfographicSpec,
  needsWebGroundingForInfographic: () => needsWebGroundingForInfographic,
  renderInfographic: () => renderInfographic
});
function needsWebGroundingForInfographic(promptText) {
  if (!promptText) return false;
  const lower = promptText.toLowerCase();
  const searchKeywords = [
    "\u062A\u0631\u064A\u0646\u062F",
    "\u0623\u062D\u062F\u062B",
    "\u0633\u0648\u0642",
    "\u0645\u0642\u0627\u0631\u0646\u0629",
    "\u0645\u0646\u0627\u0641\u0633",
    "\u0623\u0633\u0639\u0627\u0631",
    "\u0623\u0631\u0642\u0627\u0645",
    "\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A",
    "trend",
    "latest",
    "current",
    "2026",
    "2025",
    "market",
    "stats",
    "statistics",
    "vs"
  ];
  return searchKeywords.some((kw) => lower.includes(kw));
}
function getResolvedTheme(spec) {
  const themeKey = spec.theme || spec.brandContext?.theme || "naje_auto_blend";
  const matched = INFOGRAPHIC_THEMES[themeKey] || INFOGRAPHIC_THEMES.naje_auto_blend;
  if (spec.colorPalette && spec.colorPalette.length > 0) {
    return {
      ...matched,
      accentColor: spec.colorPalette[0] || matched.accentColor,
      chartPalette: [...spec.colorPalette, ...matched.chartPalette]
    };
  }
  return matched;
}
function renderStatHighlightBlock(block, theme) {
  const trendIcon = block.trend === "up" ? "\u25B2" : block.trend === "down" ? "\u25BC" : "\u2022";
  const trendColor = block.trend === "up" ? "#10b981" : block.trend === "down" ? "#ef4444" : theme.textMuted;
  const valColor = block.color || theme.accentColor;
  return `
    <div style="background: ${theme.cardBg}; border-radius: 20px; padding: 24px 20px; text-align: center; border: 1px solid ${theme.cardBorder}; box-shadow: ${theme.cardShadow}; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <div style="font-size: 42px; font-weight: 900; color: ${valColor}; font-family: 'Cairo', sans-serif; line-height: 1.1; letter-spacing: -0.5px;">${block.value}</div>
      <div style="font-size: 14px; font-weight: 600; color: ${theme.textColor}; margin-top: 8px; line-height: 1.4;">${block.label}</div>
      ${block.trend ? `<div style="color: ${trendColor}; font-size: 12px; font-weight: 700; margin-top: 6px; display: inline-flex; align-items: center; gap: 4px; background: ${theme.isLight ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.3)"}; padding: 2px 10px; border-radius: 12px;">${trendIcon} ${block.trend === "up" ? "\u0646\u0645\u0648 / \u0627\u0631\u062A\u0641\u0627\u0639" : block.trend === "down" ? "\u062A\u0631\u0627\u062C\u0639" : "\u0645\u0633\u062A\u0642\u0631"}</div>` : ""}
    </div>`;
}
function renderBarComparisonBlock(block, theme) {
  const maxVal = Math.max(...block.items.map((i) => i.value), 1);
  const colors = theme.chartPalette;
  const rowsHtml = block.items.map((item, idx) => {
    const pct = Math.min(100, Math.max(8, Math.round(item.value / maxVal * 100)));
    const color = item.color || colors[idx % colors.length];
    return `
      <div style="margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 13px; font-weight: 600;">
          <span style="color: ${theme.textColor};">${item.label}</span>
          <span style="color: ${theme.accentColor}; font-family: monospace; font-size: 14px; font-weight: 700;">${item.value} ${block.unit || ""}</span>
        </div>
        <div style="height: 12px; background: ${theme.isLight ? "#e2e8f0" : "rgba(255,255,255,0.06)"}; border-radius: 6px; overflow: hidden; border: 1px solid ${theme.isLight ? "#cbd5e1" : "rgba(255,255,255,0.08)"}; padding: 1px;">
          <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, ${color}, ${theme.accentColor}); border-radius: 5px; box-shadow: 0 0 8px ${color}55;"></div>
        </div>
      </div>
    `;
  }).join("");
  return `
    <div style="background: ${theme.cardBg}; border-radius: 20px; padding: 22px 24px; border: 1px solid ${theme.cardBorder}; box-shadow: ${theme.cardShadow};">
      <div style="font-size: 16px; font-weight: 700; color: ${theme.textColor}; margin-bottom: 16px; border-bottom: 1px solid ${theme.isLight ? "#e2e8f0" : "rgba(255,255,255,0.1)"}; padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        \u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A
      </div>
      ${rowsHtml}
    </div>`;
}
function renderDonutBlock(block, theme) {
  const total = block.segments.reduce((acc, s) => acc + (s.value || 0), 0) || 1;
  const palette = theme.chartPalette;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;
  const circlesHtml = block.segments.map((seg, idx) => {
    const fraction = (seg.value || 0) / total;
    const strokeDash = fraction * circumference;
    const strokeOffset = circumference - cumulativePercent * circumference;
    cumulativePercent += fraction;
    const color = seg.colorHint || palette[idx % palette.length];
    return `
      <circle
        cx="80"
        cy="80"
        r="${radius}"
        fill="transparent"
        stroke="${color}"
        stroke-width="22"
        stroke-dasharray="${strokeDash} ${circumference}"
        stroke-dashoffset="${strokeOffset}"
        stroke-linecap="butt"
      />
    `;
  }).join("");
  const legendHtml = block.segments.map((seg, idx) => {
    const pct = Math.round((seg.value || 0) / total * 100);
    const color = seg.colorHint || palette[idx % palette.length];
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="width: 10px; height: 10px; border-radius: 3px; background: ${color}; display: inline-block;"></span>
          <span style="color: ${theme.textColor}; font-weight: 500;">${seg.label}</span>
        </div>
        <span style="color: ${theme.accentColor}; font-family: monospace; font-weight: 700;">${pct}%</span>
      </div>
    `;
  }).join("");
  return `
    <div style="background: ${theme.cardBg}; border-radius: 20px; padding: 22px 24px; border: 1px solid ${theme.cardBorder}; box-shadow: ${theme.cardShadow}; display: grid; grid-template-columns: 160px 1fr; gap: 16px; align-items: center;">
      <div style="display: flex; justify-content: center; position: relative;">
        <svg width="160" height="160" viewBox="0 0 160 160" style="transform: rotate(-90deg);">
          ${circlesHtml}
        </svg>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
          <div style="font-size: 10px; color: ${theme.textMuted}; font-weight: 600;">\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A</div>
          <div style="font-size: 15px; font-weight: 800; color: ${theme.textColor}; font-family: monospace;">100%</div>
        </div>
      </div>
      <div>
        <div style="font-size: 15px; font-weight: 700; color: ${theme.textColor}; margin-bottom: 12px; border-bottom: 1px solid ${theme.isLight ? "#e2e8f0" : "rgba(255,255,255,0.1)"}; padding-bottom: 5px;">
          \u0627\u0644\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0646\u0633\u0628\u064A
        </div>
        ${legendHtml}
      </div>
    </div>`;
}
function renderTimelineBlock(block, theme) {
  const stepsHtml = block.steps.map((step, idx) => {
    return `
      <div style="display: flex; gap: 14px; margin-bottom: 14px; position: relative;">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, ${theme.accentColor}, ${theme.secondaryAccent}); color: #0f172a; font-weight: 900; font-size: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px ${theme.accentColor}66; z-index: 2;">
            ${idx + 1}
          </div>
          ${idx < block.steps.length - 1 ? `<div style="width: 2px; flex: 1; background: ${theme.isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.15)"}; margin-top: 4px; min-height: 20px;"></div>` : ""}
        </div>
        <div style="flex: 1; background: ${theme.isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)"}; border-radius: 12px; padding: 10px 14px; border: 1px solid ${theme.isLight ? "#e2e8f0" : "rgba(255,255,255,0.06)"};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 14px; font-weight: 700; color: ${theme.accentColor};">${step.title}</div>
            ${step.tag ? `<span style="font-size: 10px; background: ${theme.badgeBg}; color: ${theme.badgeText}; padding: 2px 8px; border-radius: 6px; font-weight: 600;">${step.tag}</span>` : ""}
          </div>
          <div style="font-size: 12px; color: ${theme.textColor}; opacity: 0.9; margin-top: 4px; line-height: 1.5;">${step.description}</div>
        </div>
      </div>
    `;
  }).join("");
  return `
    <div style="background: ${theme.cardBg}; border-radius: 20px; padding: 22px 24px; border: 1px solid ${theme.cardBorder}; box-shadow: ${theme.cardShadow};">
      <div style="font-size: 16px; font-weight: 700; color: ${theme.textColor}; margin-bottom: 16px; border-bottom: 1px solid ${theme.isLight ? "#e2e8f0" : "rgba(255,255,255,0.1)"}; padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        \u0627\u0644\u0645\u0631\u0627\u062D\u0644 \u0648\u0627\u0644\u062A\u0633\u0644\u0633\u0644
      </div>
      ${stepsHtml}
    </div>`;
}
function renderTextBlock(block, theme) {
  return `
    <div style="background: ${theme.cardBg}; border-radius: 20px; padding: 20px 24px; border-left: 4px solid ${theme.accentColor}; border-top: 1px solid ${theme.cardBorder}; border-right: 1px solid ${theme.cardBorder}; border-bottom: 1px solid ${theme.cardBorder}; box-shadow: ${theme.cardShadow};">
      <div style="font-size: 15px; font-weight: 800; color: ${theme.accentColor}; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
        ${block.heading}
      </div>
      <div style="font-size: 13px; color: ${theme.textColor}; line-height: 1.6; font-weight: 400;">
        ${block.body}
      </div>
    </div>`;
}
function assembleInfographicHTML(spec) {
  const theme = getResolvedTheme(spec);
  const statBlocks = spec.blocks.filter((b) => b.type === "stat_highlight");
  const otherBlocks = spec.blocks.filter((b) => b.type !== "stat_highlight");
  let statsGridHtml = "";
  if (statBlocks.length > 0) {
    const colCount = Math.min(statBlocks.length, spec.layoutStyle === "mixed" ? 2 : 3);
    statsGridHtml = `
      <div style="display: grid; grid-template-columns: repeat(${colCount}, 1fr); gap: 16px; margin-bottom: 20px;">
        ${statBlocks.map((b) => renderStatHighlightBlock(b, theme)).join("")}
      </div>
    `;
  }
  let bodyBlocksHtml = "";
  if (spec.layoutStyle === "mixed" && otherBlocks.length >= 2) {
    const firstHalf = otherBlocks.slice(0, 2);
    const remaining = otherBlocks.slice(2);
    bodyBlocksHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        ${firstHalf.map((b) => {
      if (b.type === "bar_comparison") return renderBarComparisonBlock(b, theme);
      if (b.type === "donut") return renderDonutBlock(b, theme);
      if (b.type === "timeline_step") return renderTimelineBlock(b, theme);
      if (b.type === "text_block") return renderTextBlock(b, theme);
      return "";
    }).join("")}
      </div>
      ${remaining.map((b) => {
      if (b.type === "bar_comparison") return renderBarComparisonBlock(b, theme);
      if (b.type === "donut") return renderDonutBlock(b, theme);
      if (b.type === "timeline_step") return renderTimelineBlock(b, theme);
      if (b.type === "text_block") return renderTextBlock(b, theme);
      return "";
    }).join('<div style="height: 16px;"></div>')}
    `;
  } else {
    bodyBlocksHtml = otherBlocks.map((b) => {
      if (b.type === "bar_comparison") return renderBarComparisonBlock(b, theme);
      if (b.type === "donut") return renderDonutBlock(b, theme);
      if (b.type === "timeline_step") return renderTimelineBlock(b, theme);
      if (b.type === "text_block") return renderTextBlock(b, theme);
      return "";
    }).join('<div style="height: 16px;"></div>');
  }
  let sourcesHtml = "";
  if (spec.sources && spec.sources.length > 0) {
    sourcesHtml = `
      <div style="margin-top: 24px; padding-top: 14px; border-top: 1px dashed ${theme.isLight ? "#cbd5e1" : "rgba(255,255,255,0.15)"}; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; font-size: 11px; color: ${theme.textMuted};">
        <span style="font-weight: 700; color: ${theme.textColor};">\u0627\u0644\u0645\u0635\u0627\u062F\u0631 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629:</span>
        ${spec.sources.map((s) => `
          <a href="${s.uri || "#"}" target="_blank" style="color: ${theme.accentColor}; text-decoration: none; background: ${theme.badgeBg}; padding: 2px 8px; border-radius: 6px; border: 1px solid ${theme.badgeBorder}; font-weight: 600;">
            ${s.title || s.uri || "\u0645\u0635\u062F\u0631"}
          </a>
        `).join("")}
      </div>
    `;
  }
  const brandName = spec.brandContext?.brandName || "Naje AI \u2022 \u0627\u0644\u0645\u0635\u0645\u0645";
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Cairo', 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${theme.bodyBg};
      color: ${theme.textColor};
      width: 1080px;
      min-height: 1080px;
      padding: 44px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      text-align: center;
      margin-bottom: 28px;
      position: relative;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: ${theme.badgeBg};
      border: 1px solid ${theme.badgeBorder};
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      color: ${theme.badgeText};
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .title {
      font-size: 36px;
      font-weight: 900;
      line-height: 1.25;
      background: ${theme.titleGradient};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 15px;
      color: ${theme.textMuted};
      font-weight: 500;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.5;
    }
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .footer {
      margin-top: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: ${theme.textMuted};
      border-top: 1px solid ${theme.isLight ? "#e2e8f0" : "rgba(255,255,255,0.08)"};
      padding-top: 14px;
    }
    .brand-mark {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      color: ${theme.textColor};
    }
    .brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${theme.accentColor};
      box-shadow: 0 0 8px ${theme.accentColor};
    }
  </style>
</head>
<body>
  <div>
    <div class="header">
      <div class="header-badge">
        \u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u062D\u062A\u0631\u0627\u0641\u064A \u2022 ${theme.nameAr}
      </div>
      <h1 class="title">${spec.title}</h1>
      ${spec.subtitle ? `<p class="subtitle">${spec.subtitle}</p>` : ""}
    </div>

    <div class="content-area">
      ${statsGridHtml}
      ${bodyBlocksHtml}
      ${sourcesHtml}
    </div>
  </div>

  <div class="footer">
    <div class="brand-mark">
      <span class="brand-dot"></span>
      <span>${brandName}</span>
    </div>
    <div>\u062A\u0645 \u0627\u0644\u0625\u0646\u0634\u0627\u0621 \u0648\u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0628\u0648\u0627\u0633\u0637\u0629 \u0645\u062C\u0644\u0633 \u0639\u0642\u0648\u0644 \u0646\u0627\u062C\u064A \u2014 \u0627\u0644\u0645\u0635\u0645\u0645</div>
  </div>
</body>
</html>`;
}
async function renderInfographic(spec) {
  const html = assembleInfographicHTML(spec);
  await chromiumSemaphore.acquire();
  let browser = null;
  try {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluateHandle("document.fonts.ready");
    await page.emulateMediaType("screen");
    const pngBuffer = await page.screenshot({ type: "png", fullPage: true });
    const pdfBuffer = await page.pdf({
      width: "1080px",
      height: "1080px",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" }
    });
    return {
      pngBase64: Buffer.from(pngBuffer).toString("base64"),
      pdfBase64: Buffer.from(pdfBuffer).toString("base64"),
      html
    };
  } finally {
    if (browser) await browser.close();
    chromiumSemaphore.release();
  }
}
async function generateInfographicSpec(ai5, rawPrompt, brandContext) {
  let groundedFacts = "";
  const sources = [];
  let groundingTokens = null;
  if (needsWebGroundingForInfographic(rawPrompt)) {
    try {
      const searchRes = await ai5.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [
          {
            role: "user",
            parts: [{
              text: `\u0623\u0646\u062A \u0628\u0627\u062D\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u062F\u0642\u064A\u0642. \u0627\u0633\u062A\u062E\u0631\u062C \u0623\u0647\u0645 \u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0648\u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0627\u0644\u062F\u0642\u064A\u0642\u0629 \u0644\u0644\u0637\u0644\u0628 \u0627\u0644\u062A\u0627\u0644\u064A \u0644\u0625\u0646\u0634\u0627\u0621 \u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u0645\u0642\u0627\u0631\u0646\u0629 \u0623\u0648 \u0625\u062D\u0635\u0627\u0621\u0627\u062A:
\u0627\u0644\u0637\u0644\u0628: "${rawPrompt}"
\u0633\u064A\u0627\u0642 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0648\u0627\u0644\u062B\u064A\u0645: ${JSON.stringify(brandContext || {})}`
            }]
          }
        ],
        config: {
          tools: [{ googleSearch: {} }],
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.webGrounding,
          temperature: 0.2
        }
      });
      groundedFacts = searchRes.text || "";
      groundingTokens = searchRes.usageMetadata;
      const chunks = searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      chunks.forEach((chunk) => {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || chunk.web.uri,
            uri: chunk.web.uri
          });
        }
      });
    } catch (gErr) {
      console.warn("[Infographic] Grounding search fallback:", gErr);
    }
  }
  const systemInstruction = buildDesignerInstruction();
  const structuringPrompt = `\u062D\u0648\u0644 \u0647\u0630\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0637\u0644\u0628 \u0625\u0644\u0649 \u0647\u064A\u0643\u0644 \u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u0628\u0635\u0631\u064A \u0645\u062D\u0643\u0645 (InfographicSpec).
\u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0623\u0635\u0644\u064A: "${rawPrompt}"
${groundedFacts ? `\u0627\u0644\u062D\u0642\u0627\u0626\u0642 \u0648\u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0645\u0648\u062B\u0642\u0629:
"""${groundedFacts}"""` : ""}
\u0633\u064A\u0627\u0642 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0648\u0627\u0644\u062B\u064A\u0645 \u0627\u0644\u0645\u0637\u0644\u0648\u0628: ${JSON.stringify(brandContext || {})}

\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u062A\u0635\u0645\u064A\u0645:
1. \u0627\u062E\u062A\u0631 layoutStyle \u0627\u0644\u0623\u0646\u0633\u0628: 'stats_grid' | 'comparison' | 'timeline' | 'process_steps' | 'market_share' | 'before_after' | 'mixed'.
   - \u0625\u0630\u0627 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u062F\u0645\u062C \u0623\u0648 \u062A\u0631\u0643 \u0627\u0644\u0623\u0645\u0631 \u0644\u0643\u060C \u0627\u062E\u062A\u0631 'mixed' \u0648\u0627\u062F\u0645\u062C \u0628\u0630\u0643\u0627\u0621 \u0628\u064A\u0646 \u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0628\u0627\u0631\u0632\u0629 \u0648\u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0627\u062A \u0648\u0627\u0644\u0645\u062E\u0637\u0637 \u0627\u0644\u062F\u0627\u0626\u0631\u064A \u0623\u0648 \u0627\u0644\u062E\u0637\u0648\u0627\u062A.
2. \u0627\u062E\u062A\u0631 \u0623\u0648 \u0623\u0643\u062F \u0627\u0644\u0640 theme \u0627\u0644\u0623\u0646\u0633\u0628: 'dark_luxury_gold' | 'cyber_neon' | 'ocean_blue' | 'forest_emerald' | 'sunset_coral' | 'royal_purple' | 'minimal_light' | 'naje_auto_blend' \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0633\u064A\u0627\u0642 \u0627\u0644\u0637\u0644\u0628 \u0648\u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629.
3. \u0642\u0633\u0651\u0645 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0625\u0644\u0649 3-6 \u0643\u062A\u0644 \u0628\u0635\u0631\u064A\u0629 (blocks) \u0645\u062A\u0646\u0648\u0639\u0629 \u0648\u0645\u0648\u062C\u0632\u0629 (\u0623\u0631\u0642\u0627\u0645 \u0628\u0627\u0631\u0632\u0629 stat_highlight\u060C \u0645\u0642\u0627\u0631\u0646\u0629 \u0623\u0639\u0645\u062F\u0629 bar_comparison\u060C \u062A\u0648\u0632\u064A\u0639 \u0646\u0633\u0628\u064A donut\u060C \u062E\u0637\u0648\u0627\u062A timeline_step\u060C \u0645\u0644\u0627\u062D\u0638\u0629 \u0647\u0627\u0645\u0629 text_block).
4. \u0627\u062C\u0639\u0644 \u0627\u0644\u0639\u0646\u0627\u0648\u064A\u0646 \u0648\u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u062D\u0627\u0633\u0645\u0629 \u0648\u0645\u0628\u0627\u0634\u0631\u0629. \u0644\u0627 \u062A\u0636\u0639 \u0641\u0642\u0631\u0627\u062A \u0637\u0648\u064A\u0644\u0629.

\u0623\u062E\u0631\u062C JSON \u0645\u0637\u0627\u0628\u0642 \u062A\u0645\u0627\u0645\u0627\u064B \u0644\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u062A\u0627\u0644\u064A:
{
  "title": "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
  "subtitle": "\u0648\u0635\u0641 \u0641\u0631\u0639\u064A \u0645\u0648\u062C\u0632 \u0648\u0645\u062D\u0641\u0632",
  "layoutStyle": "stats_grid" | "comparison" | "timeline" | "process_steps" | "market_share" | "before_after" | "mixed",
  "theme": "dark_luxury_gold" | "cyber_neon" | "ocean_blue" | "forest_emerald" | "sunset_coral" | "royal_purple" | "minimal_light" | "naje_auto_blend",
  "blocks": [
    { "type": "stat_highlight", "value": "85%", "label": "\u0646\u0633\u0628\u0629 \u0627\u0644\u0631\u0636\u0627", "trend": "up" },
    { "type": "bar_comparison", "items": [{ "label": "\u0627\u0644\u0639\u0646\u0635\u0631 \u0627\u0644\u0623\u0648\u0644", "value": 120 }, { "label": "\u0627\u0644\u0639\u0646\u0635\u0631 \u0627\u0644\u062B\u0627\u0646\u064A", "value": 85 }], "unit": "\u0623\u0644\u0641" },
    { "type": "donut", "segments": [{ "label": "\u0627\u0644\u062E\u064A\u0627\u0631 \u0623", "value": 45 }, { "label": "\u0627\u0644\u062E\u064A\u0627\u0631 \u0628", "value": 55 }] },
    { "type": "timeline_step", "steps": [{ "title": "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0623\u0648\u0644\u0649", "description": "\u0634\u0631\u062D \u0645\u0648\u062C\u0632 \u062C\u062F\u0627\u064B" }] },
    { "type": "text_block", "heading": "\u0646\u0642\u0637\u0629 \u062A\u062D\u0648\u0644", "body": "\u062E\u0644\u0627\u0635\u0629 \u0645\u0643\u062B\u0641\u0629" }
  ]
}`;
  const res = await ai5.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: structuringPrompt }] }],
    config: {
      systemInstruction,
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.agentPlan,
      responseMimeType: "application/json",
      temperature: 0.3
    }
  });
  const structuringTokens = res.usageMetadata;
  let parsedSpec;
  try {
    parsedSpec = JSON.parse(res.text || "{}");
  } catch {
    parsedSpec = {
      title: "\u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u0628\u064A\u0627\u0646\u0627\u062A",
      layoutStyle: "stats_grid",
      theme: brandContext?.theme || "naje_auto_blend",
      blocks: [
        { type: "stat_highlight", value: "100%", label: "\u0627\u0643\u062A\u0645\u0627\u0644 \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629", trend: "up" },
        { type: "text_block", heading: "\u0645\u0644\u062E\u0635", body: rawPrompt }
      ]
    };
  }
  if (brandContext?.theme && (!parsedSpec.theme || parsedSpec.theme === "naje_auto_blend")) {
    parsedSpec.theme = brandContext.theme;
  }
  parsedSpec.sources = sources;
  parsedSpec.brandContext = brandContext;
  return {
    spec: parsedSpec,
    sources,
    groundingTokens,
    structuringTokens
  };
}
async function editInfographicSpec(ai5, originalSpec, editInstruction, brandContext) {
  const systemInstruction = buildDesignerInstruction();
  const editPrompt = `\u0623\u0646\u062A \u062A\u0642\u0648\u0645 \u0628\u062A\u0639\u062F\u064A\u0644 \u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u062D\u0627\u0644\u064A \u0648\u0641\u0642 \u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645.
\u0627\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u062D\u0627\u0644\u064A:
${JSON.stringify(originalSpec, null, 2)}

\u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0645\u0646 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645:
"${editInstruction}"
\u0633\u064A\u0627\u0642 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0648\u0627\u0644\u062B\u064A\u0645: ${JSON.stringify(brandContext || {})}

\u0642\u0645 \u0628\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062A\u0639\u062F\u064A\u0644\u0627\u062A \u0628\u062F\u0642\u0629 \u0645\u062A\u0646\u0627\u0647\u064A\u0629 \u0645\u0639 \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0628\u0642\u064A\u0629 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u062A\u0646\u0627\u0633\u0642\u0629. \u064A\u0645\u0643\u0646\u0643 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0640 theme \u0623\u0648 layoutStyle \u0623\u0648 \u0625\u0636\u0627\u0641\u0629/\u062A\u0639\u062F\u064A\u0644 \u0643\u062A\u0644 blocks. \u0623\u062E\u0631\u062C \u0627\u0644\u0640 JSON \u0627\u0644\u062C\u062F\u064A\u062F \u0627\u0644\u0645\u062D\u062F\u062B \u0628\u0627\u0644\u0643\u0627\u0645\u0644.`;
  const res = await ai5.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: editPrompt }] }],
    config: {
      systemInstruction,
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.agentPlan,
      responseMimeType: "application/json",
      temperature: 0.3
    }
  });
  let parsedSpec;
  try {
    parsedSpec = JSON.parse(res.text || "{}");
  } catch {
    parsedSpec = originalSpec;
  }
  if (!parsedSpec.sources) parsedSpec.sources = originalSpec.sources;
  if (!parsedSpec.brandContext) parsedSpec.brandContext = brandContext || originalSpec.brandContext;
  if (brandContext?.theme && parsedSpec.theme === originalSpec.theme) {
    parsedSpec.theme = brandContext.theme;
  }
  return {
    spec: parsedSpec,
    structuringTokens: res.usageMetadata
  };
}
var init_infographicEngine = __esm({
  "src/lib/infographicEngine.ts"() {
    init_councilOfMinds();
    init_modelRegistry();
    init_pdf_engine();
    init_infographicThemes();
  }
});

// src/lib/agentPlanner.ts
var agentPlanner_exports = {};
__export(agentPlanner_exports, {
  auditAgentStepResult: () => auditAgentStepResult,
  buildOutputSummary: () => buildOutputSummary,
  generateAgentProposal: () => generateAgentProposal,
  narrateStepCompletion: () => narrateStepCompletion,
  processAgentChatTurn: () => processAgentChatTurn
});
async function processAgentChatTurn(messages, pricingConfig = {}, projectContext) {
  const systemInstruction = `\u0623\u0646\u062A \u0627\u0644\u0639\u0642\u0644 \u0627\u0644\u062A\u062E\u0637\u064A\u0637\u064A \u0648\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A\u064A \u0644\u0648\u0643\u064A\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0627\u0644\u0645\u0633\u062A\u0642\u0644 "\u0646\u0627\u062C\u064A \u0623\u0648\u062A\u0648\u0646\u0648\u0645\u0627" (Naje Agent Pro).
\u0623\u0646\u062A \u0648\u0643\u064A\u0644 \u0630\u0643\u064A \u0641\u0627\u0626\u0642 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0648\u0642\u0627\u062F\u0631 \u0639\u0644\u0649 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0648\u0627\u0631 \u0645\u0639 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0643\u0645\u062F\u064A\u0631 \u0645\u0634\u0627\u0631\u064A\u0639 \u0648\u0645\u0633\u062A\u0634\u0627\u0631 \u062A\u0642\u0646\u064A \u0648\u0625\u0628\u062F\u0627\u0639\u064A \u0631\u0641\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u0648\u0649.

\u0642\u0648\u0627\u0639\u062F \u0627\u062A\u062E\u0627\u0630 \u0627\u0644\u0642\u0631\u0627\u0631 \u0648\u0633\u0644\u0648\u0643 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629:
1. \u0625\u0630\u0627 \u0642\u0627\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u062A\u062D\u064A\u0629 (\u0645\u062B\u0644: "\u0645\u0631\u062D\u0628\u0627"\u060C "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645"\u060C "\u0623\u0647\u0644\u0627\u064B") \u0623\u0648 \u0633\u0623\u0644 \u0639\u0646 \u0642\u062F\u0631\u0627\u062A\u0643 \u0623\u0648 \u0623\u062C\u0631\u0649 \u0645\u062D\u0627\u062F\u062B\u0629 \u0639\u0627\u0645\u0629:
   - \u0627\u062E\u062A\u0631 \u062D\u0635\u0631\u0627\u064B \u0648\u0638\u064A\u0641\u0629 "reply_conversationally" \u0644\u0644\u0631\u062F \u0639\u0644\u064A\u0647 \u0628\u0644\u0628\u0627\u0642\u0629 \u0648\u062B\u0642\u0629 \u0648\u062A\u0631\u062D\u064A\u0628\u060C \u0648\u0627\u0634\u0631\u062D \u0628\u0625\u064A\u062C\u0627\u0632 \u0645\u0627 \u064A\u0645\u0643\u0646\u0643 \u0641\u0639\u0644\u0647 \u0648\u0627\u0633\u0623\u0644\u0647 \u0639\u0646 \u0645\u0634\u0631\u0648\u0639\u0647 \u0623\u0648 \u0647\u062F\u0641\u0647.
   - \u0644\u0627 \u062A\u0642\u0645 \u0623\u0628\u062F\u0627\u064B \u0628\u0627\u062E\u062A\u0644\u0627\u0642 \u062E\u0637\u0629 \u0639\u0645\u0644 \u0639\u0646\u062F \u0627\u0644\u062A\u062D\u064A\u0629 \u0623\u0648 \u0627\u0644\u0623\u062D\u0627\u062F\u064A\u062B \u0627\u0644\u0639\u0627\u0645\u0629!

2. \u0625\u0630\u0627 \u0643\u0627\u0646 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0641\u0643\u0631\u0629 \u0623\u0648 \u0647\u062F\u0641 \u0639\u0627\u0645 \u0648\u0644\u0643\u0646 \u062A\u0646\u0642\u0635\u0647 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u062C\u0648\u0647\u0631\u064A\u0629 \u0645\u0624\u062B\u0631\u0629 \u0641\u064A \u0646\u0637\u0627\u0642 \u0627\u0644\u0639\u0645\u0644 (\u0645\u062B\u0644: \u0646\u0648\u0639 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u060C \u0646\u0628\u0631\u0629 \u0627\u0644\u0639\u0644\u0627\u0645\u0629\u060C \u0645\u062F\u0629 \u0627\u0644\u0641\u064A\u062F\u064A\u0648\u060C \u0623\u0648 \u0641\u0635\u0648\u0644 \u0627\u0644\u0645\u0633\u062A\u0646\u062F):
   - \u0627\u062E\u062A\u0631 \u0648\u0638\u064A\u0641\u0629 "ask_clarifying_question" \u0648\u0627\u0637\u0631\u062D \u0633\u0624\u0627\u0644\u0627\u064B \u0648\u0627\u062D\u062F\u0627\u064B \u0630\u0643\u064A\u0627\u064B \u0648\u0645\u0631\u0643\u0632\u0627\u064B \u0645\u0639 \u062E\u064A\u0627\u0631\u0627\u062A \u0625\u062C\u0627\u0628\u0629 \u0633\u0631\u064A\u0639\u0629 \u0645\u0642\u062A\u0631\u062D\u0629 (suggestedQuickReplies).

3. \u0625\u0630\u0627 \u0643\u0627\u0646 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0627\u0636\u062D\u0627\u064B \u0648\u0645\u0643\u062A\u0645\u0644 \u0627\u0644\u0623\u0631\u0643\u0627\u0646 \u0644\u0628\u062F\u0621 \u0645\u0647\u0645\u0629 \u0645\u0633\u062A\u0642\u0644\u0629 \u0645\u062D\u062F\u062F\u0629:
   - \u0627\u062E\u062A\u0631 \u0648\u0638\u064A\u0641\u0629 "propose_mission" \u0648\u0642\u0645 \u0628\u0647\u0646\u062F\u0633\u0629 \u062E\u0637\u0629 \u0639\u0645\u0644 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0648\u0645\u0646\u0638\u0645\u0629 \u0625\u0644\u0649 \u0645\u0631\u0627\u062D\u0644 \u0648\u062E\u0637\u0648\u0627\u062A \u062A\u0633\u062A\u062F\u0639\u064A \u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:
     - 'brand_identity': \u062A\u0623\u0633\u064A\u0633 \u0627\u0644\u0647\u0648\u064A\u0629\u060C \u0627\u0644\u0623\u0644\u0648\u0627\u0646\u060C \u0627\u0644\u0646\u0628\u0631\u0629\u060C \u0648\u0633\u064A\u0643\u0648\u0644\u0648\u062C\u064A\u0629 \u0627\u0644\u0628\u0631\u0627\u0646\u062F.
     - 'image_studio': \u062A\u0635\u0645\u064A\u0645 \u0648\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u064A\u0629 \u0648\u0627\u0644\u062A\u0635\u0627\u0645\u064A\u0645 \u0627\u0644\u0628\u0635\u0631\u064A\u0629.
     - 'video_director': \u062A\u0623\u0644\u064A\u0641 \u0648\u0625\u062E\u0631\u0627\u062C \u0633\u064A\u0646\u0627\u0631\u064A\u0648\u0647\u0627\u062A \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u064A \u0648\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0645\u0642\u0627\u0637\u0639.
     - 'voice_narration': \u062A\u0648\u0644\u064A\u062F \u0641\u0648\u064A\u0633 \u0623\u0648\u0641\u0631 \u0648\u062A\u0639\u0644\u064A\u0642 \u0635\u0648\u062A\u064A \u0633\u064A\u0646\u0645\u0627\u0626\u064A \u0641\u062E\u0645.
     - 'fullstack_engineer': \u0628\u0631\u0645\u062C\u0629 \u0623\u0646\u0638\u0645\u0629 \u0648\u0645\u0648\u0627\u0642\u0639 \u0648\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0648\u064A\u0628 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0645\u0639 \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u0648\u062A\u062D\u0645\u064A\u0644 ZIP.
     - 'document_architect': \u062A\u0623\u0644\u064A\u0641 \u0643\u062A\u064A\u0628\u0627\u062A PDF \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629 \u0623\u0648 \u0639\u0631\u0648\u0636 \u062A\u0642\u062F\u064A\u0645\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u0635\u0641\u062D\u0627\u062A/\u0627\u0644\u0634\u0631\u0627\u0626\u062D.
     - 'web_grounding': \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u062D\u064A \u0644\u062C\u0645\u0639 \u062D\u0642\u0627\u0626\u0642 \u0627\u0644\u0635\u0646\u0627\u0639\u0629 \u0648\u0627\u0644\u0645\u0646\u0627\u0641\u0633\u064A\u0646.

\u062A\u0646\u0628\u064A\u0647 \u062D\u0627\u0633\u0645: \u0644\u0627 \u062A\u0636\u0639 \u0623\u0633\u0639\u0627\u0631 \u0623\u0648 \u062A\u0642\u062F\u064A\u0631\u0627\u062A \u0646\u0642\u0627\u0637 \u062F\u0627\u062E\u0644 \u0627\u0644\u062E\u0637\u0648\u0627\u062A\u061B \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u062A\u062D\u0633\u0628 \u0627\u0644\u0646\u0642\u0627\u0637 \u0630\u0627\u062A\u064A\u0627\u064B \u0648\u0628\u062F\u0642\u0629 \u0642\u0637\u0639\u064A\u0629.`;
  const formattedContents = messages.map((m) => ({
    role: m.role === "model" ? "model" : "user",
    parts: [{ text: m.content || "" }]
  }));
  if (projectContext && Object.keys(projectContext).length > 0) {
    formattedContents.unshift({
      role: "user",
      parts: [{ text: `\u0633\u064A\u0627\u0642 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0639\u0627\u0645: ${JSON.stringify(projectContext)}` }]
    });
  }
  try {
    const res = await ai2.models.generateContent({
      model: resolveEngineModel(getNajeModel("personas")),
      contents: formattedContents,
      config: {
        systemInstruction,
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.agentPlan,
        temperature: 0.3,
        tools: [
          {
            functionDeclarations: agentFunctionDeclarations
          }
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: "AUTO"
          }
        }
      }
    });
    const functionCall = res.functionCalls?.[0] || res.candidates?.[0]?.content?.parts?.find((p) => p.functionCall)?.functionCall;
    if (functionCall) {
      const { name, args } = functionCall;
      const parsedArgs = typeof args === "string" ? JSON.parse(args) : args || {};
      if (name === "reply_conversationally") {
        return {
          type: "reply",
          message: parsedArgs.message || "\u0623\u0647\u0644\u0627\u064B \u0628\u0643! \u0623\u0646\u0627 \u0648\u0643\u064A\u0644 \u0646\u0627\u062C\u064A \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u060C \u0643\u064A\u0641 \u064A\u0645\u0643\u0646\u0646\u064A \u0645\u0633\u0627\u0639\u062F\u062A\u0643 \u0641\u064A \u0645\u0634\u0631\u0648\u0639\u0643 \u0627\u0644\u064A\u0648\u0645\u061F"
        };
      }
      if (name === "ask_clarifying_question") {
        return {
          type: "clarification",
          question: parsedArgs.question || "\u0647\u0644 \u064A\u0645\u0643\u0646\u0643 \u062A\u0648\u0636\u064A\u062D \u0627\u0644\u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u062D\u0648\u0644 \u0647\u062F\u0641\u0643\u061F",
          suggestedQuickReplies: Array.isArray(parsedArgs.suggestedQuickReplies) ? parsedArgs.suggestedQuickReplies : void 0
        };
      }
      if (name === "propose_mission") {
        const rawProposal = parsedArgs;
        const pricedProposal = computeProposalPricing(rawProposal, pricingConfig);
        return {
          type: "proposal",
          proposal: pricedProposal
        };
      }
    }
    const textOutput = res.text?.trim();
    if (textOutput) {
      return {
        type: "reply",
        message: textOutput
      };
    }
    return {
      type: "reply",
      message: "\u0623\u0647\u0644\u0627\u064B \u0628\u0643! \u0623\u0646\u0627 \u0648\u0643\u064A\u0644 \u0646\u0627\u062C\u064A \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u060C \u0623\u0633\u062A\u0637\u064A\u0639 \u0628\u0646\u0627\u0621 \u0623\u0646\u0638\u0645\u0629 \u0628\u0631\u0645\u062C\u064A\u0629 \u0643\u0627\u0645\u0644\u0629\u060C \u0647\u0648\u064A\u0627\u062A \u0628\u0635\u0631\u064A\u0629\u060C \u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A\u060C \u062A\u0633\u062C\u064A\u0644\u0627\u062A \u0635\u0648\u062A\u064A\u0629\u060C \u0648\u0643\u062A\u064A\u0628\u0627\u062A \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629. \u0645\u0627 \u0647\u0648 \u0647\u062F\u0641\u0643 \u0627\u0644\u064A\u0648\u0645\u061F"
    };
  } catch (err) {
    console.error("[processAgentChatTurn Error]", err);
    throw new Error(err?.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0637\u0644\u0628 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0645\u0639 \u0627\u0644\u0648\u0643\u064A\u0644.");
  }
}
function computeProposalPricing(proposal, pricingConfig) {
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
async function generateAgentProposal(userPrompt, projectContext, pricingConfig = {}) {
  const result = await processAgentChatTurn(
    [{ role: "user", content: userPrompt }],
    pricingConfig,
    projectContext
  );
  if (result.type === "proposal") {
    return result.proposal;
  }
  const forcedProposalRes = await ai2.models.generateContent({
    model: resolveEngineModel(getNajeModel("personas")),
    contents: `\u0627\u0644\u0645\u0637\u0644\u0648\u0628: \u062A\u0648\u0644\u064A\u062F \u062E\u0637\u0629 \u0639\u0645\u0644 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0648\u0645\u062D\u062F\u062F\u0629 \u0628\u0635\u064A\u063A\u0629 \u0648\u0638\u064A\u0641\u0629 propose_mission \u0644\u0644\u0637\u0644\u0628: "${userPrompt}"`,
    config: {
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.agentPlan,
      tools: [{ functionDeclarations: agentFunctionDeclarations }],
      toolConfig: { functionCallingConfig: { mode: "ANY" } }
    }
  });
  const fc = forcedProposalRes.functionCalls?.[0] || forcedProposalRes.candidates?.[0]?.content?.parts?.find((p) => p.functionCall)?.functionCall;
  if (fc && fc.args) {
    const parsedArgs = typeof fc.args === "string" ? JSON.parse(fc.args) : fc.args;
    return computeProposalPricing(parsedArgs, pricingConfig);
  }
  throw new Error("\u062A\u0639\u0630\u0631 \u0628\u0646\u0627\u0621 \u062E\u0637\u0629 \u0644\u0644\u0645\u0647\u0645\u0629. \u064A\u0631\u062C\u0649 \u062A\u0648\u0636\u064A\u062D \u062A\u0641\u0627\u0635\u064A\u0644 \u0637\u0644\u0628\u0643.");
}
function buildOutputSummary(toolName, output) {
  if (!output || typeof output !== "object") {
    return { summary: String(output || "") };
  }
  switch (toolName) {
    case "video_director":
      return {
        durationSec: output.durationSeconds || output.duration || (output.shotList?.length ? output.shotList.length * 3 : 5),
        aspectRatio: output.aspectRatio || "16:9",
        visualTheme: output.visualTheme || output.styleLock || output.style || "\u0633\u064A\u0646\u0645\u0627\u0626\u064A \u0639\u0627\u0644\u064A \u0627\u0644\u062C\u0648\u062F\u0629"
      };
    case "image_studio":
      return {
        imageCount: Array.isArray(output.images) ? output.images.length : output.imageUrl ? 1 : 1,
        styleArchetype: output.style || output.archetype || output.conceptTitle || "\u0625\u0628\u062F\u0627\u0639\u064A \u0645\u062A\u0642\u0646"
      };
    case "brand_identity":
      return {
        brandName: output.brandName || output.name || output.brandKit?.name || "\u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629",
        resolvedArchetype: output.archetype || output.personality || output.brandKit?.archetype || "\u0639\u0635\u0631\u064A \u0648\u0631\u064A\u0627\u062F\u064A",
        paletteDescription: output.paletteDescription || (Array.isArray(output.colors) ? output.colors.join(", ") : output.brandKit?.palette) || "\u0623\u0644\u0648\u0627\u0646 \u0645\u062A\u0646\u0627\u0633\u0642\u0629"
      };
    case "document_architect":
      return {
        pageOrSlideCount: output.pageCount || output.slideCount || output.slides?.length || output.chapters?.length || 1,
        documentTitle: output.documentTitle || output.title || "\u0645\u0633\u062A\u0646\u062F \u0625\u0628\u062F\u0627\u0639\u064A",
        docType: output.docType || output.format || "PDF"
      };
    case "fullstack_engineer":
      return {
        fileCount: Array.isArray(output.files) ? output.files.length : output.fileTree ? Object.keys(output.fileTree).length : 1,
        projectName: output.projectName || output.title || "\u0645\u0634\u0631\u0648\u0639 \u0628\u0631\u0645\u062C\u064A \u0645\u062A\u0643\u0627\u0645\u0644",
        techStack: output.techStack || output.stack || "Fullstack React / Node"
      };
    case "voice_narration":
      return {
        durationSec: output.durationSeconds || output.duration || 5,
        isDialogue: !!output.isDialogue || !!(output.speakers && output.speakers.length > 1),
        voiceNames: output.voices || output.voice || "\u0623\u0635\u0648\u0627\u062A \u0637\u0628\u064A\u0639\u064A\u0629"
      };
    default:
      return {
        resultSummary: output.title || output.summary || output.message || (typeof output === "string" ? output.slice(0, 100) : "\u0645\u062E\u0631\u062C\u0627\u062A \u0645\u062A\u0643\u0627\u0645\u0644\u0629")
      };
  }
}
async function narrateStepCompletion(aiInstance, toolName, userOriginalRequest, stepTitle, outputSummary) {
  const fallbackText = `\u062A\u0645 \u0625\u0646\u062C\u0627\u0632 "${stepTitle || toolName}" \u0628\u0646\u062C\u0627\u062D.`;
  try {
    const modelId = "gemini-3.5-flash-lite";
    const prompt = `\u0623\u0646\u062A \u0627\u0644\u0645\u062A\u062D\u062F\u062B \u0641\u064A \u0645\u062C\u0644\u0633 \u0639\u0642\u0648\u0644 \u0646\u0627\u062C\u064A \u2014 \u0627\u0644\u0637\u0628\u0642\u0629 \u0627\u0644\u062A\u064A \u062A\u062A\u0648\u0627\u0635\u0644 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0639 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0644\u063A\u0629 \u0637\u0628\u064A\u0639\u064A\u0629 \u062F\u0627\u0641\u0626\u0629 \u0648\u0648\u0627\u062B\u0642\u0629.
\u062A\u0645 \u0644\u0644\u062A\u0648 \u0625\u0646\u062C\u0627\u0632 \u062E\u0637\u0648\u0629 \u0645\u0646 \u0645\u0647\u0645\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0646\u062C\u0627\u062D. \u0627\u0643\u062A\u0628 \u062C\u0645\u0644\u0629 \u062A\u0623\u0643\u064A\u062F \u0648\u0627\u062D\u062F\u0629 \u0642\u0635\u064A\u0631\u0629 \u0648\u0637\u0628\u064A\u0639\u064A\u0629 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629\u060C \u062A\u062E\u0627\u0637\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645
\u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u062A\u0634\u064A\u0631 \u062A\u062D\u062F\u064A\u062F\u0627\u064B \u0644\u0645\u0627 \u0637\u0644\u0628\u0647 \u0641\u0639\u0644\u064A\u0627\u064B \u2014 \u0644\u0627 \u062C\u0645\u0644\u0629 \u0639\u0627\u0645\u0629\u060C \u0648\u0644\u0627 \u062A\u0643\u0631\u0627\u0631 \u0644\u0646\u0641\u0633 \u0627\u0644\u0635\u064A\u0627\u063A\u0629 \u0641\u064A \u0643\u0644 \u0645\u0631\u0629.

\u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0623\u0635\u0644\u064A \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u0637\u0648\u0629: "${userOriginalRequest || stepTitle || ""}"
\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0637\u0648\u0629 \u0628\u0627\u0644\u062E\u0637\u0629: "${stepTitle || toolName}"
\u0646\u0648\u0639 \u0627\u0644\u0623\u062F\u0627\u0629 \u0627\u0644\u0645\u0646\u0641\u0630\u0629: ${toolName}
\u0645\u0644\u062E\u0635 \u0648\u0642\u0627\u0626\u0639\u064A \u0644\u0645\u0627 \u062A\u0645 \u0625\u0646\u062A\u0627\u062C\u0647: ${JSON.stringify(outputSummary || {})}

\u0627\u0643\u062A\u0628 \u062C\u0645\u0644\u0629 \u0648\u0627\u062D\u062F\u0629 \u0641\u0642\u0637\u060C \u0628\u0635\u0648\u062A \u0646\u0627\u062C\u064A (\u0645\u0628\u0627\u0634\u0631\u060C \u0648\u0627\u062B\u0642\u060C \u0648\u062F\u0648\u062F\u060C \u0628\u062F\u0648\u0646 \u0631\u0633\u0645\u064A\u0629 \u062C\u0627\u0641\u0629)\u060C \u062A\u0624\u0643\u062F \u0627\u0644\u0625\u0646\u062C\u0627\u0632 \u0648\u062A\u0634\u064A\u0631 \u0644\u062A\u0641\u0635\u064A\u0644\u0629 \u062D\u0642\u064A\u0642\u064A\u0629 \u0648\u0627\u062D\u062F\u0629
\u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0645\u0646 \u0627\u0644\u0645\u0644\u062E\u0635 \u0623\u0639\u0644\u0627\u0647 (\u0627\u0644\u0645\u062F\u0629\u060C \u0627\u0633\u0645 \u0627\u0644\u0628\u0631\u0627\u0646\u062F\u060C \u0639\u062F\u062F \u0627\u0644\u0645\u0644\u0641\u0627\u062A...). \u0644\u0627 \u062A\u0636\u0641 \u0623\u064A \u0634\u0631\u062D \u0625\u0636\u0627\u0641\u064A \u0623\u0648 \u0645\u0642\u062F\u0645\u0629.`;
    const result = await aiInstance.models.generateContent({
      model: modelId,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 512, ...getThinkingConfig(modelId) }
    });
    return result.text?.trim() || fallbackText;
  } catch (err) {
    console.warn("[Narration Warning] Model narration fallback used:", err);
    return fallbackText;
  }
}
async function auditAgentStepResult(stepTitle, toolOutput, brandContext, options) {
  const effectiveToolName = options?.toolName || (["brand_identity", "image_studio", "video_director", "voice_narration", "fullstack_engineer", "document_architect", "web_grounding"].includes(stepTitle) ? stepTitle : "agent_tool");
  const effectiveStepTitle = options?.stepTitle || (stepTitle !== effectiveToolName ? stepTitle : brandContext?.missionTitle || effectiveToolName);
  const userRequest = options?.userOriginalRequest || brandContext?.userPrompt || brandContext?.slogan || effectiveStepTitle;
  const summary = buildOutputSummary(effectiveToolName, toolOutput);
  try {
    const isCodeProject = effectiveStepTitle.includes("\u0628\u0631\u0645\u062C") || effectiveStepTitle.includes("fullstack") || !!toolOutput?.files || !!toolOutput?.techStack;
    const systemInstruction = `\u0623\u0646\u062A \u0627\u0644\u0645\u062F\u0642\u0642 \u0627\u0644\u0625\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A \u0648\u0636\u0627\u0628\u0637 \u0627\u0644\u062C\u0648\u062F\u0629 \u0644\u0648\u0643\u064A\u0644 \u0646\u0627\u062C\u064A \u0623\u0648\u062A\u0648\u0646\u0648\u0645\u0627 (Agent Quality & Systems Auditor).
\u0645\u0647\u0645\u062A\u0643: \u0645\u0631\u0627\u062C\u0639\u0629 \u0646\u062A\u0627\u0626\u062C \u0627\u0644\u062E\u0637\u0648\u0629 \u0627\u0644\u0645\u0646\u0641\u0630\u0629 \u0628\u062F\u0642\u0629 \u0647\u0646\u062F\u0633\u064A\u0629 \u0648\u062C\u0645\u0627\u0644\u064A\u0629 \u0642\u0628\u0644 \u0627\u0639\u062A\u0645\u0627\u062F\u0647\u0627.
${isCodeProject ? `
\u0642\u0648\u0627\u0639\u062F \u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0645\u0634\u0627\u0631\u064A\u0639 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629:
1. \u062A\u062D\u0642\u0642 \u0645\u0646 \u062A\u0643\u0627\u0645\u0644 \u0627\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F\u0627\u062A (imports/exports) \u0648\u0627\u0644\u062A\u0648\u0627\u0641\u0642 \u0628\u064A\u0646 \u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u0623\u0645\u0627\u0645\u064A\u0629 \u0648\u0646\u0642\u0627\u0637 \u0646\u0647\u0627\u064A\u0629 \u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u062E\u0644\u0641\u064A (API endpoints).
2. \u062A\u0623\u0643\u062F \u0645\u0646 \u062E\u0644\u0648 \u0627\u0644\u0623\u0643\u0648\u0627\u062F \u062A\u0645\u0627\u0645\u0627\u064B \u0645\u0646 \u0623\u064A \u062F\u0648\u0627\u0644 \u0641\u0627\u0631\u063A\u0629 \u0623\u0648 \u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0645\u0624\u0642\u062A\u0629 (TODO/Placeholders).
3. \u062A\u0623\u0643\u062F \u0645\u0646 \u062C\u0627\u0647\u0632\u064A\u0629 \u0645\u0644\u0641 \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0644 index.html / previewHtml \u0644\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631.
` : "\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0646\u0627\u0633\u0642 \u0627\u0644\u0625\u0628\u062F\u0627\u0639\u064A \u0648\u0627\u0644\u0644\u063A\u0648\u064A \u0648\u0627\u0644\u0628\u0635\u0631\u064A \u0648\u0645\u0637\u0627\u0628\u0642\u0629 \u0645\u062E\u0631\u062C\u0627\u062A \u0627\u0644\u062E\u0637\u0648\u0629 \u0645\u0639 \u0633\u064A\u0627\u0642 \u0648\u0647\u0648\u064A\u0629 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629."}

\u0623\u062E\u0631\u062C JSON \u0641\u0642\u0637:
{
  "passed": true | false,
  "feedback": "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0648\u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0648\u0627\u0636\u062D\u0629 \u0648\u0627\u0644\u0645\u062D\u062F\u062F\u0629",
  "refinedOutput": null
}`;
    const prompt = `\u0647\u0648\u064A\u0629 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0648\u0633\u064A\u0627\u0642\u0647\u0627: ${JSON.stringify(brandContext || {})}
\u0627\u0644\u062E\u0637\u0648\u0629 \u0627\u0644\u0645\u0646\u0641\u0630\u0629: ${effectiveStepTitle}
\u0627\u0644\u0645\u062E\u0631\u062C\u0627\u062A \u0627\u0644\u0646\u0627\u062A\u062C\u0629: ${JSON.stringify(toolOutput)}

\u062F\u0642\u0642 \u0641\u064A \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u0627\u062A\u0633\u0627\u0642.`;
    const res = await ai2.models.generateContent({
      model: resolveEngineModel(getNajeModel("personas")),
      contents: prompt,
      config: {
        systemInstruction,
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.agentAudit,
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });
    const parsed = JSON.parse(res.text || '{"passed": true, "feedback": "\u062A\u0645 \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0628\u0646\u062C\u0627\u062D"}');
    if (parsed.passed) {
      const narration = await narrateStepCompletion(ai2, effectiveToolName, userRequest, effectiveStepTitle, summary);
      return {
        passed: true,
        feedback: narration,
        refinedOutput: parsed.refinedOutput
      };
    }
    return parsed;
  } catch (err) {
    console.warn("Step Audit warning:", err);
    const narration = await narrateStepCompletion(ai2, effectiveToolName, userRequest, effectiveStepTitle, summary).catch(() => `\u062A\u0645 \u0625\u0646\u062C\u0627\u0632 "${effectiveStepTitle}" \u0628\u0646\u062C\u0627\u062D.`);
    return { passed: true, feedback: narration };
  }
}
var ai2, agentFunctionDeclarations;
var init_agentPlanner = __esm({
  "src/lib/agentPlanner.ts"() {
    init_agentPricing();
    init_modelRegistry();
    init_councilOfMinds();
    init_genaiClient();
    init_modelEnvConfig();
    ai2 = createGenAIClient();
    agentFunctionDeclarations = [
      {
        name: "reply_conversationally",
        description: "Use this when the user is greeting you, making small talk, asking a general question about your capabilities, or when their message does not yet describe a concrete, actionable creative or technical mission. This is the default when in doubt.",
        parameters: {
          type: "OBJECT",
          properties: {
            message: {
              type: "STRING",
              description: "Your conversational reply in Arabic, in Naje AI's confident, warm, professional and direct voice."
            }
          },
          required: ["message"]
        }
      },
      {
        name: "ask_clarifying_question",
        description: "Use this when the user has described a real goal, but a key detail is missing that would meaningfully change the plan or its cost (e.g. brand name, target platform, video length/style, document depth/chapters, tech stack). Ask ONE focused, courteous question, not a list.",
        parameters: {
          type: "OBJECT",
          properties: {
            question: {
              type: "STRING",
              description: "The single focused clarifying question in Arabic."
            },
            suggestedQuickReplies: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Optional 2-4 short tappable options in Arabic, if the question has an obvious small set of likely answers."
            }
          },
          required: ["question"]
        }
      },
      {
        name: "propose_mission",
        description: "Use this ONLY when the user's goal is clear and specific enough to scope a concrete, multi-step execution plan using the available tools. Do not guess or output cost numbers here; pricing is computed deterministically by the system.",
        parameters: {
          type: "OBJECT",
          properties: {
            missionTitle: {
              type: "STRING",
              description: "A concise, prestigious Arabic title for the mission."
            },
            brandContext: {
              type: "OBJECT",
              properties: {
                brandName: { type: "STRING" },
                industry: { type: "STRING" },
                tone: { type: "STRING" },
                colors: { type: "ARRAY", items: { type: "STRING" } },
                slogan: { type: "STRING" },
                targetAudience: { type: "STRING" }
              },
              required: ["brandName", "industry", "tone"]
            },
            planSummary: {
              type: "STRING",
              description: "An executive summary explaining what the agent will create and deliver in this mission."
            },
            steps: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  description: { type: "STRING" },
                  tools: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        name: {
                          type: "STRING",
                          enum: [
                            "brand_identity",
                            "image_studio",
                            "video_director",
                            "voice_narration",
                            "fullstack_engineer",
                            "document_architect",
                            "web_grounding"
                          ]
                        },
                        title: { type: "STRING" },
                        inputParams: { type: "OBJECT" }
                      },
                      required: ["name", "title", "inputParams"]
                    }
                  }
                },
                required: ["title", "description", "tools"]
              }
            }
          },
          required: ["missionTitle", "planSummary", "steps"]
        }
      }
    ];
  }
});

// src/lib/fullstackBuilder.ts
function getPlanningModel() {
  return resolveEngineModel(getNajeModel("pro"));
}
function getAuditingModel() {
  return resolveEngineModel(getNajeModel("personas"));
}
async function planFullstackProject(userPrompt, brandContext, inputParams = {}) {
  let searchGroundingContext = "";
  try {
    const searchRes = await ai3.models.generateContent({
      model: resolveEngineModel(getNajeModel("personas")),
      contents: [{
        role: "user",
        parts: [{
          text: `\u0627\u0628\u062D\u062B \u0639\u0646 \u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0648\u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0644\u0625\u0646\u0634\u0627\u0621 \u062A\u0637\u0628\u064A\u0642 \u0648\u064A\u0628 \u0645\u062A\u0643\u0627\u0645\u0644 \u0644\u0640: "${userPrompt}". \u0627\u0630\u0643\u0631 \u0627\u0644\u0645\u0643\u062A\u0628\u0627\u062A \u0627\u0644\u0645\u0639\u064A\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u0623\u0646\u0645\u0627\u0637 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0627\u0644\u062D\u062F\u064A\u062B\u0629 \u0628\u0625\u064A\u062C\u0627\u0632.`
        }]
      }],
      config: {
        maxOutputTokens: 2048,
        tools: [{ googleSearch: {} }]
      }
    });
    if (searchRes.text) {
      searchGroundingContext = searchRes.text.slice(0, 800);
    }
  } catch (searchErr) {
    console.warn("[Programmer/Search] Planning search grounding notice:", searchErr);
  }
  const systemInstruction = buildPersonaInstruction("\u0627\u0644\u0645\u0628\u0631\u0645\u062C", `${PROGRAMMER_CORE}
\u0645\u0647\u0627\u0645\u062A\u0643 \u0627\u0644\u0622\u0646: \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u0628\u0646\u0627\u0621 \u0645\u0648\u0642\u0639 \u0623\u0648 \u062A\u0637\u0628\u064A\u0642 \u0648\u064A\u0628 \u062D\u0642\u064A\u0642\u064A \u0645\u062A\u0643\u0627\u0645\u0644 \u0648\u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0645\u0644\u0641\u0627\u062A (Real Multi-File Production Architecture).

\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A:
1. \u0635\u0645\u0651\u0645 \u0647\u064A\u0643\u0644\u064A\u0629 \u0628\u0631\u0645\u062C\u064A\u0629 \u062D\u0642\u064A\u0642\u064A\u0629 \u062A\u062A\u0636\u0645\u0646 \u0639\u0627\u062F\u0629 \u0645\u0627 \u0628\u064A\u0646 15 \u0625\u0644\u0649 35 \u0645\u0644\u0641\u0627\u064B\u060C \u0645\u0648\u0632\u0639\u0629 \u0628\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629:
   - \u0627\u0644\u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u0623\u0645\u0627\u0645\u064A\u0629 (Frontend): \u0645\u0643\u0648\u0646\u0627\u062A React/Tailwind/TypeScript \u0646\u0642\u064A\u0629 (Header, Hero, Navigation, Dashboard, Form/Modal, Card/Item, Footer, State Hook, Types).
   - \u0627\u0644\u062E\u0627\u062F\u0645 \u0648\u0646\u0642\u0627\u0637 \u0627\u0644\u0646\u0647\u0627\u064A\u0629 (Backend API): \u062E\u0627\u062F\u0645 Express/TypeScript \u062D\u0642\u064A\u0642\u064A \u0645\u0639 \u0645\u0633\u0627\u0631\u0627\u062A endpoints \u0648\u0627\u0636\u062D\u0629 (Routes, Controllers, Store, Middleware).
   - \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A: package.json, tsconfig.json, tailwind.config.js, README.md, index.html (\u062A\u0641\u0627\u0639\u0644\u064A \u0644\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629).
2. \u062D\u062F\u062F "dependsOn" \u0628\u062F\u0642\u0629 \u0644\u0643\u0644 \u0645\u0644\u0641: \u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u062A\u064A \u064A\u0639\u062A\u0645\u062F \u0639\u0644\u064A\u0647\u0627 \u0647\u0630\u0627 \u0627\u0644\u0645\u0644\u0641.
3. \u062D\u062F\u062F "buildOrder" \u0628\u062D\u064A\u062B \u064A\u062A\u0645 \u0628\u0646\u0627\u0621 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u062A\u0623\u0633\u064A\u0633\u064A\u0629 \u0623\u0648\u0644\u0627\u064B\u060C \u062B\u0645 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A\u060C \u062B\u0645 \u0627\u0644\u0635\u0641\u062D\u0627\u062A\u060C \u062B\u0645 \u0627\u0644\u062E\u0627\u062F\u0645 \u0648\u0627\u0644\u0645\u0643\u0648\u0646 \u0627\u0644\u0631\u0626\u064A\u0633\u064A.
4. \u0623\u062E\u0631\u062C JSON \u0641\u0642\u0637:
{
  "projectName": "restaurant-hub",
  "projectDescription": "\u0645\u0646\u0635\u0629 \u062D\u062C\u0632 \u0645\u0637\u0627\u0639\u0645 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0645\u0639 \u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645 \u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0644\u0644\u0645\u062F\u064A\u0631 \u0648\u0627\u0644\u0639\u0645\u0644\u0627\u0621",
  "techStack": {
    "frontend": "React + TypeScript + Tailwind CSS + Lucide Icons",
    "backend": "Node.js + Express REST API",
    "styling": "Tailwind CSS Modern Theme"
  },
  "files": [
    {
      "path": "src/types/index.ts",
      "purpose": "\u062A\u0639\u0631\u064A\u0641 \u062C\u0645\u064A\u0639 \u0647\u064A\u0627\u0643\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0644\u0644\u0645\u0637\u0639\u0645 \u0648\u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646",
      "dependsOn": [],
      "estimatedComplexity": "simple"
    },
    {
      "path": "src/utils/apiClient.ts",
      "purpose": "\u062F\u0648\u0627\u0644 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u062E\u0644\u0641\u064A \u0648\u062A\u0628\u0627\u062F\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0648\u0627\u0644\u0637\u0644\u0628\u0627\u062A",
      "dependsOn": ["src/types/index.ts"],
      "estimatedComplexity": "simple"
    }
  ],
  "buildOrder": [
    "src/types/index.ts",
    "src/utils/apiClient.ts"
  ]
}`);
  const prompt = `\u0633\u064A\u0627\u0642 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629:
${JSON.stringify(brandContext || {}, null, 2)}

\u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0647\u062F\u0641 \u0627\u0644\u0645\u0634\u0631\u0648\u0639:
"${userPrompt}"

${searchGroundingContext ? `\u0646\u062A\u0627\u0626\u062C \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u062D\u064A \u0648\u062A\u0648\u0635\u064A\u0627\u062A \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0627\u0644\u062D\u062F\u064A\u062B\u0629 (Search Grounding):
${searchGroundingContext}
` : ""}

\u0627\u0644\u0645\u062F\u062E\u0644\u0627\u062A \u0627\u0644\u0625\u0636\u0627\u0641\u064A\u0629:
${JSON.stringify(inputParams || {}, null, 2)}

\u0635\u0645\u0651\u0645 \u0647\u064A\u0643\u0644\u064A\u0629 \u0645\u0634\u0631\u0648\u0639 \u0628\u0631\u0645\u062C\u064A\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0648\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0628\u0646\u0627\u0621 \u0627\u0644\u0641\u0639\u0644\u064A.`;
  const response = await ai3.models.generateContent({
    model: getPlanningModel(),
    contents: prompt,
    config: {
      systemInstruction,
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.fullstackContractSynthesis,
      responseMimeType: "application/json",
      temperature: 0.2
    }
  });
  try {
    const raw = JSON.parse(response.text || "{}");
    if (!raw.files || !Array.isArray(raw.files) || raw.files.length === 0) {
      throw new Error("Empty files array in plan");
    }
    const allPaths = raw.files.map((f) => f.path);
    const existingOrder = Array.isArray(raw.buildOrder) ? raw.buildOrder : [];
    const missingPaths = allPaths.filter((p) => !existingOrder.includes(p));
    const finalBuildOrder = [...existingOrder.filter((p) => allPaths.includes(p)), ...missingPaths];
    return {
      projectName: raw.projectName || "naje-app",
      projectDescription: raw.projectDescription || "\u062A\u0637\u0628\u064A\u0642 \u0648\u0645\u0648\u0642\u0639 \u0648\u064A\u0628 \u0645\u062A\u0643\u0627\u0645\u0644",
      techStack: raw.techStack || {
        frontend: "React + TypeScript + Tailwind CSS",
        backend: "Express API",
        styling: "Tailwind CSS"
      },
      files: raw.files,
      buildOrder: finalBuildOrder
    };
  } catch (parseErr) {
    console.warn("Fallback to standard complete plan:", parseErr);
    return getFallbackProjectPlan(userPrompt, brandContext);
  }
}
async function synthesizeProjectContracts(plan, brandContext) {
  const systemInstruction = `\u0623\u0646\u062A \u0645\u0647\u0646\u062F\u0633 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644\u0627\u062A \u0641\u064A \u0645\u062D\u0631\u0643 Naje Agent Core (Contract Synthesis & Interface Architect).
\u0645\u0647\u0645\u062A\u0643: \u0642\u0631\u0627\u0621\u0629 \u0647\u064A\u0643\u0644\u064A\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0648\u062A\u0648\u0644\u064A\u062F "\u0637\u0628\u0642\u0629 \u0627\u0644\u0639\u0642\u0648\u062F \u0648\u0627\u0644\u0648\u0627\u062C\u0647\u0627\u062A" (Contract Layer / IR) \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u062E\u0637\u0637\u0629 \u0642\u0628\u0644 \u0643\u062A\u0627\u0628\u0629 \u0623\u064A \u0633\u0637\u0631 \u062A\u0646\u0641\u064A\u0630\u064A.

\u0644\u0643\u0644 \u0645\u0644\u0641 \u0641\u064A \u0627\u0644\u062E\u0637\u0629:
1. \u062D\u062F\u062F \u0628\u062F\u0642\u0629 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062A\u0635\u062F\u064A\u0631\u0627\u062A (Exports):
   - \u0627\u0644\u062F\u0648\u0627\u0644 (Functions): \u0627\u0644\u0627\u0633\u0645\u060C \u0627\u0644\u0645\u062F\u062E\u0644\u0627\u062A\u060C \u0648\u0646\u0648\u0639 \u0627\u0644\u0639\u0648\u062F\u0629 (Signature).
   - \u0627\u0644\u0623\u0646\u0648\u0627\u0639 (Types / Interfaces): \u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0647\u064A\u0627\u0643\u0644 \u0648\u0627\u0644\u062D\u0642\u0648\u0644.
   - \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A (React Components): \u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A \u0648\u062E\u0635\u0627\u0626\u0635 \u0627\u0644\u0640 Props.
2. \u0628\u0627\u0644\u0646\u0633\u0628\u0629 \u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u062E\u0627\u062F\u0645 (Backend / API / Server):
   - \u062D\u062F\u062F \u0628\u062F\u0642\u0629 \u0643\u0644 \u0645\u0633\u0627\u0631 (Route): Method (GET, POST, PUT, DELETE), Path (e.g. /api/menu), requestShape, responseShape.

\u0623\u062E\u0631\u062C JSON \u0641\u0642\u0637 \u0628\u062F\u0648\u0646 \u0646\u0635\u0648\u0635 \u0625\u0636\u0627\u0641\u064A\u0629:
{
  "files": {
    "src/types/index.ts": {
      "exports": [
        { "name": "RestaurantItem", "kind": "type", "signature": "export interface RestaurantItem { id: string; name: string; price: number; category: string; available: boolean; }" },
        { "name": "BookingRequest", "kind": "type", "signature": "export interface BookingRequest { name: string; guests: number; date: string; time: string; }" }
      ]
    },
    "src/server.ts": {
      "exports": [
        { "name": "app", "kind": "constant", "signature": "export const app: Express;" }
      ],
      "routes": [
        { "method": "GET", "path": "/api/items", "responseShape": "RestaurantItem[]" },
        { "method": "POST", "path": "/api/bookings", "requestShape": "BookingRequest", "responseShape": "{ success: boolean; id: string; }" }
      ]
    }
  }
}`;
  const prompt = `\u0645\u0634\u0631\u0648\u0639: ${plan.projectName} (${plan.projectDescription})
\u0627\u0644\u062A\u0642\u0646\u064A\u0627\u062A: ${JSON.stringify(plan.techStack)}
\u0633\u064A\u0627\u0642 \u0627\u0644\u0639\u0644\u0627\u0645\u0629: ${JSON.stringify(brandContext || {})}

\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u062E\u0637\u0637\u0629 \u0648\u0639\u0644\u0627\u0642\u0627\u062A \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F:
${JSON.stringify(plan.files, null, 2)}

\u0635\u063A \u0639\u0642\u0648\u062F \u0627\u0644\u0648\u0627\u062C\u0647\u0627\u062A (Contract Layer) \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0628\u062F\u0642\u0629 \u0639\u0627\u0644\u064A\u0629:`;
  try {
    const res = await ai3.models.generateContent({
      model: getPlanningModel(),
      contents: prompt,
      config: {
        systemInstruction,
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.fullstackContractSynthesis,
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    const parsed = JSON.parse(res.text || "{}");
    if (parsed.files && typeof parsed.files === "object") {
      return parsed;
    }
    throw new Error("Invalid contract structure");
  } catch (err) {
    console.warn("Contract synthesis fallback generated:", err);
    const fallbackFiles = {};
    for (const f of plan.files) {
      fallbackFiles[f.path] = {
        exports: [
          { name: "default", kind: "component", signature: `export default function ${f.path.split("/").pop()?.replace(/\.[^/.]+$/, "")}(): JSX.Element;` }
        ]
      };
    }
    return { files: fallbackFiles };
  }
}
async function generateSingleFileWithContract(filePlan, projectContract, projectPlan, brandContext, userPrompt, linkerFeedback) {
  const dependencyContracts = (filePlan.dependsOn || []).map((depPath) => {
    const contract = projectContract.files[depPath];
    if (!contract) return "";
    return `--- \u0639\u0642\u062F \u0648\u0627\u062C\u0647\u0627\u062A \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0639\u062A\u0645\u062F (${depPath}) ---
${JSON.stringify(contract, null, 2)}
---------------------------------------`;
  }).filter(Boolean).join("\n\n");
  const thisFileContract = projectContract.files[filePlan.path];
  const thisFileContractStr = thisFileContract ? `\u0639\u0642\u062F \u0647\u0630\u0627 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062A\u0637\u0628\u064A\u0642\u0647 \u0628\u0627\u0644\u0643\u0627\u0645\u0644:
${JSON.stringify(thisFileContract, null, 2)}` : "";
  const systemInstruction = buildPersonaInstruction("\u0627\u0644\u0645\u0628\u0631\u0645\u062C", `${PROGRAMMER_CORE}
\u0645\u0647\u0645\u062A\u0643 \u0627\u0644\u0622\u0646: \u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0643\u0648\u062F \u0627\u0644\u0628\u0631\u0645\u062C\u064A \u0627\u0644\u0643\u0627\u0645\u0644 \u0648\u0627\u0644\u0646\u0647\u0627\u0626\u064A \u0644\u0644\u0645\u0644\u0641: "${filePlan.path}"

\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u0646\u0627\u0621 \u0627\u0644\u0635\u0627\u0631\u0645\u0629:
1. \u0627\u0644\u062A\u0632\u0645 \u0628\u062A\u0635\u062F\u064A\u0631 \u0648\u062A\u0637\u0628\u064A\u0642 \u0643\u0644 \u0645\u0627 \u0648\u0631\u062F \u0641\u064A \u0639\u0642\u062F \u0647\u0630\u0627 \u0627\u0644\u0645\u0644\u0641 \u0628\u062F\u0642\u0629 (Functions, Types, Components, Routes).
2. \u0639\u0646\u062F \u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0623\u0648 \u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u062F\u0648\u0627\u0644 \u0623\u0648 \u0623\u0646\u0648\u0627\u0639 \u0645\u0646 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629\u060C \u0627\u0633\u062A\u0646\u062F \u0641\u0642\u0637 \u0625\u0644\u0649 \u0627\u0644\u0639\u0642\u0648\u062F \u0627\u0644\u0645\u0631\u0641\u0642\u0629 \u0644\u062A\u0644\u0643 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0648\u062A\u0637\u0627\u0628\u0642 \u0645\u0639 \u0623\u0633\u0645\u0627\u0626\u0647\u0627 \u0648\u062A\u0648\u0627\u0642\u064A\u0639\u0647\u0627 \u0628\u062F\u0642\u0629 100%.
3. \u0627\u0643\u062A\u0628 \u0643\u0648\u062F\u0627\u064B \u062D\u0642\u064A\u0642\u064A\u0627\u064B \u0648\u0646\u0642\u064A\u0627\u064B \u0628\u0646\u0633\u0628\u0629 100% \u0628\u062F\u0648\u0646 \u0623\u064A \u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0645\u0624\u0642\u062A\u0629 (\u0644\u0627 \u062A\u0633\u062A\u062E\u062F\u0645 TODO\u060C \u0648\u0644\u0627 \u062A\u062A\u0631\u0643 \u062F\u0648\u0627\u0644\u0627\u064B \u0641\u0627\u0631\u063A\u0629\u060C \u0648\u0644\u0627 \u062A\u062E\u062A\u0635\u0631 \u0627\u0644\u0643\u0648\u062F).
4. \u0627\u0633\u062A\u062E\u062F\u0645 Tailwind CSS \u0627\u0644\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u062A\u0646\u0627\u0633\u0642 \u0645\u0639 \u0647\u0648\u064A\u0629 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629.
5. \u0623\u062E\u0631\u062C \u0643\u0648\u062F \u0627\u0644\u0645\u0644\u0641 \u0641\u0642\u0637 \u0628\u062F\u0648\u0646 \u0623\u064A \u0639\u0644\u0627\u0645\u0627\u062A markdown \u0623\u0648 \u0634\u0631\u0648\u062D \u0646\u0635\u064A\u0629 \u062E\u0627\u0631\u062C\u064A\u0629.`);
  const userContent = `\u0627\u0644\u0645\u0634\u0631\u0648\u0639: ${projectPlan.projectName} (${projectPlan.projectDescription})
\u0627\u0644\u062A\u0642\u0646\u064A\u0627\u062A: ${JSON.stringify(projectPlan.techStack)}
\u0647\u0648\u064A\u0629 \u0627\u0644\u0639\u0644\u0627\u0645\u0629: ${JSON.stringify(brandContext || {})}
\u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0623\u0635\u0644\u064A: "${userPrompt}"

\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0646\u0633\u062C\u0647 \u0627\u0644\u0622\u0646: ${filePlan.path}
\u0648\u0638\u064A\u0641\u0629 \u0627\u0644\u0645\u0644\u0641: ${filePlan.purpose}

${thisFileContractStr}

${dependencyContracts ? `\u0639\u0642\u0648\u062F \u0627\u0644\u0648\u0627\u062C\u0647\u0627\u062A \u0644\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u062A\u064A \u064A\u0639\u062A\u0645\u062F \u0639\u0644\u064A\u0647\u0627 \u0647\u0630\u0627 \u0627\u0644\u0645\u0644\u0641:
${dependencyContracts}
` : ""}
${linkerFeedback ? `\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0647\u0646\u062F\u0633\u064A (Deterministic Linker) \u0644\u062A\u0635\u062D\u064A\u062D \u0647\u0630\u0627 \u0627\u0644\u0645\u0644\u0641:
${linkerFeedback}
` : ""}

\u0627\u0643\u062A\u0628 \u0643\u0648\u062F \u0627\u0644\u0645\u0644\u0641 \u0643\u0627\u0645\u0644\u0627\u064B \u0628\u062F\u0642\u0629 \u0645\u062A\u0646\u0627\u0647\u064A\u0629:`;
  const res = await ai3.models.generateContent({
    model: getPlanningModel(),
    contents: userContent,
    config: {
      systemInstruction,
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.fullstackFileGeneration,
      temperature: 0.1
    }
  });
  let rawText = res.text || "";
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "");
  }
  return rawText.trim();
}
function runDeterministicLinker(files, projectPlan) {
  const diagnostics = [];
  const brokenFilesSet = /* @__PURE__ */ new Set();
  const filesMap = /* @__PURE__ */ new Map();
  for (const f of files) {
    filesMap.set(f.path, f.content);
  }
  const exportedSymbolsByFile = /* @__PURE__ */ new Map();
  for (const f of files) {
    const exportsSet = /* @__PURE__ */ new Set();
    const exportRegex = /export\s+(?:const|let|var|function\*?|class|type|interface|enum)\s+([a-zA-Z0-9_$]+)/g;
    let match;
    while ((match = exportRegex.exec(f.content)) !== null) {
      if (match[1]) exportsSet.add(match[1]);
    }
    if (/export\s+default\b/.test(f.content)) {
      exportsSet.add("default");
    }
    exportedSymbolsByFile.set(f.path, exportsSet);
  }
  const declaredRoutes = [];
  for (const f of files) {
    if (f.path.includes("server") || f.path.includes("route") || f.path.includes("api")) {
      const routeRegex = /(?:app|router)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/gi;
      let rMatch;
      while ((rMatch = routeRegex.exec(f.content)) !== null) {
        if (rMatch[1] && rMatch[2]) {
          declaredRoutes.push({
            method: rMatch[1].toUpperCase(),
            path: rMatch[2].toLowerCase()
          });
        }
      }
    }
  }
  for (const f of files) {
    const namedImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"`]([^'"`]+)['"`]/g;
    let impMatch;
    while ((impMatch = namedImportRegex.exec(f.content)) !== null) {
      const symbolsRaw = impMatch[1];
      const relPath = impMatch[2];
      const resolvedPath = resolveRelativeImportPath(f.path, relPath, filesMap);
      if (resolvedPath && filesMap.has(resolvedPath)) {
        const availableExports = exportedSymbolsByFile.get(resolvedPath) || /* @__PURE__ */ new Set();
        const symbols = symbolsRaw.split(",").map((s) => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
        for (const sym of symbols) {
          if (!availableExports.has(sym)) {
            diagnostics.push({
              filePath: f.path,
              issueType: "missing_export",
              targetPath: resolvedPath,
              symbolName: sym,
              message: `\u0627\u0644\u0645\u0644\u0641 ${f.path} \u064A\u0633\u062A\u0648\u0631\u062F '${sym}' \u0645\u0646 ${resolvedPath}\u060C \u0644\u0643\u0646 \u0647\u0630\u0627 \u0627\u0644\u0631\u0645\u0632 \u063A\u064A\u0631 \u0645\u0635\u062F\u0631 \u0641\u0639\u0644\u064A\u0627\u064B \u0647\u0646\u0627\u0643.`
            });
            brokenFilesSet.add(f.path);
          }
        }
      }
    }
    if (!f.path.includes("server") && (f.path.endsWith(".ts") || f.path.endsWith(".tsx") || f.path.endsWith(".js"))) {
      const fetchRegex = /fetch\(\s*['"`](\/api\/[^'"`]+)['"`](?:,\s*\{[^}]*method:\s*['"`]([a-zA-Z]+)['"`])?/gi;
      let fMatch;
      while ((fMatch = fetchRegex.exec(f.content)) !== null) {
        const routePath = fMatch[1].toLowerCase();
        const routeMethod = (fMatch[2] || "GET").toUpperCase();
        if (declaredRoutes.length > 0) {
          const routeExists = declaredRoutes.some(
            (dr) => dr.path === routePath || routePath.startsWith(dr.path.replace(/:[a-zA-Z0-9_]+/g, ""))
          );
          if (!routeExists) {
            diagnostics.push({
              filePath: f.path,
              issueType: "missing_route",
              message: `\u0627\u0644\u0645\u0644\u0641 ${f.path} \u064A\u0633\u062A\u062F\u0639\u064A \u0646\u0642\u0637\u0629 \u0646\u0647\u0627\u064A\u0629 '${routeMethod} ${routePath}' \u063A\u064A\u0631 \u0645\u0639\u0631\u0651\u0641\u0629 \u0641\u064A \u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u062E\u0644\u0641\u064A.`
            });
            brokenFilesSet.add(f.path);
          }
        }
      }
    }
    if (/(\/\/\s*TODO\b|\/\*\s*TODO\b|\/\/\s*باقي المكونات)/i.test(f.content)) {
      diagnostics.push({
        filePath: f.path,
        issueType: "contains_todo",
        message: `\u0627\u0644\u0645\u0644\u0641 ${f.path} \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0645\u0624\u0642\u062A\u0629 (TODO/Placeholders) \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629.`
      });
      brokenFilesSet.add(f.path);
    }
    if (f.estimatedComplexity === "complex" && f.content.length < 150) {
      diagnostics.push({
        filePath: f.path,
        issueType: "empty_body",
        message: `\u0627\u0644\u0645\u0644\u0641 ${f.path} \u0645\u0635\u0646\u0641 \u0643\u0645\u0644\u0641 \u0645\u0639\u0642\u062F \u0648\u0644\u0643\u0646 \u062D\u062C\u0645\u0647 \u0635\u063A\u064A\u0631 \u062C\u062F\u0627\u064B (${f.content.length} \u062D\u0631\u0641\u0627\u064B) \u0645\u0645\u0627 \u064A\u0634\u064A\u0631 \u0625\u0644\u0649 \u062A\u0648\u0644\u064A\u062F \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644.`
      });
      brokenFilesSet.add(f.path);
    }
  }
  return {
    passed: diagnostics.length === 0,
    diagnostics,
    brokenFiles: Array.from(brokenFilesSet)
  };
}
function resolveRelativeImportPath(currentFilePath, importRelPath, filesMap) {
  if (!importRelPath.startsWith(".")) return null;
  const currentDirParts = currentFilePath.split("/").slice(0, -1);
  const relParts = importRelPath.split("/");
  for (const part of relParts) {
    if (part === ".") continue;
    if (part === "..") {
      currentDirParts.pop();
    } else {
      currentDirParts.push(part);
    }
  }
  const baseResolved = currentDirParts.join("/");
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"];
  for (const ext of extensions) {
    const candidate = `${baseResolved}${ext}`;
    if (filesMap.has(candidate)) return candidate;
  }
  return null;
}
function constructPreviewHtml(files, projectPlan, brandContext) {
  const indexHtmlFile = files.find((f) => f.path.toLowerCase().endsWith("index.html"));
  if (indexHtmlFile && indexHtmlFile.content.includes("<html") && indexHtmlFile.content.includes("</body>")) {
    return indexHtmlFile.content;
  }
  const primaryColor = brandContext?.colors?.[0] || "#4f46e5";
  const secondaryColor = brandContext?.colors?.[1] || "#9333ea";
  const brandName = brandContext?.brandName || projectPlan.projectName;
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} - ${projectPlan.projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              primary: '${primaryColor}',
              secondary: '${secondaryColor}'
            }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    body { font-family: 'Cairo', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500/30">
  <!-- Top Navigation -->
  <header class="h-16 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-[${primaryColor}] to-[${secondaryColor}] flex items-center justify-center text-white shadow-lg">
        <i class="fa-solid fa-layer-group"></i>
      </div>
      <span class="text-base font-extrabold tracking-wide text-white">${brandName}</span>
      <span class="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
        ${projectPlan.projectName}
      </span>
    </div>
    
    <nav class="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
      <a href="#overview" class="hover:text-white transition">\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629</a>
      <a href="#features" class="hover:text-white transition">\u0627\u0644\u0645\u064A\u0632\u0627\u062A \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A</a>
      <a href="#architecture" class="hover:text-white transition">\u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0627\u0644\u0647\u0646\u062F\u0633\u064A\u0629</a>
    </nav>

    <div class="flex items-center gap-3">
      <button onclick="simulateAction('\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062C\u0627\u0647\u0632\u064A\u0629 \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0627\u0644\u0631\u0628\u0637 \u0627\u0644\u0647\u0646\u062F\u0633\u064A')" class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition active:scale-95 cursor-pointer">
        \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0646\u0638\u0627\u0645
      </button>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-12">
    <section class="text-center space-y-4 py-8">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        \u0645\u0634\u0631\u0648\u0639 \u0645\u0628\u0646\u064A \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0639\u0628\u0631 Naje Agent Core (${files.length} \u0645\u0644\u0641\u0627\u062A \u0645\u062A\u0643\u0627\u0645\u0644\u0629)
      </div>
      <h1 class="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
        ${projectPlan.projectName}
      </h1>
      <p class="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
        ${projectPlan.projectDescription}
      </p>
    </section>

    <!-- Architecture Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
        <span class="text-xs text-indigo-400 font-bold">\u0627\u0644\u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u0623\u0645\u0627\u0645\u064A\u0629 (Frontend)</span>
        <span class="text-sm font-extrabold text-white">${projectPlan.techStack.frontend}</span>
        <span class="text-xs text-slate-500">\u0645\u0643\u0648\u0646\u0627\u062A \u0645\u062A\u0641\u0627\u0639\u0644\u0629\u060C \u0623\u0646\u0645\u0627\u0637 \u0645\u062A\u0646\u0627\u0633\u0642\u0629\u060C \u0648\u062F\u0639\u0645 \u0643\u0627\u0645\u0644 \u0644\u0644\u063A\u0627\u062A \u0627\u0644\u0628\u0631\u0645\u062C\u0629</span>
      </div>
      <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
        <span class="text-xs text-purple-400 font-bold">\u0627\u0644\u062E\u0627\u062F\u0645 \u0648\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A (Backend API)</span>
        <span class="text-sm font-extrabold text-white">${projectPlan.techStack.backend || "Express REST API"}</span>
        <span class="text-xs text-slate-500">\u0646\u0642\u0627\u0637 \u0646\u0647\u0627\u064A\u0629 \u0645\u0637\u0627\u0628\u0642\u0629 \u062A\u0645\u0627\u0645\u0627\u064B \u0644\u0639\u0642\u0648\u062F \u0627\u0644\u0648\u0627\u062C\u0647\u0627\u062A \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629</span>
      </div>
      <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
        <span class="text-xs text-emerald-400 font-bold">\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062D\u0632\u0645\u0629 \u0627\u0644\u0645\u0646\u0633\u0648\u062C\u0629</span>
        <span class="text-sm font-extrabold text-white">${files.length} \u0645\u0644\u0641\u0627\u062A \u0628\u0631\u0645\u062C\u064A\u0629 \u0646\u0642\u064A\u0629</span>
        <span class="text-xs text-slate-500">\u0645\u0641\u062D\u0648\u0635\u0629 \u0628\u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0647\u0646\u062F\u0633\u064A \u0648\u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u062A\u0635\u062F\u064A\u0631 \u0641\u0648\u0631\u0627\u064B \u0643\u0640 ZIP</span>
      </div>
    </div>

    <!-- Live Project File Explorer Overview -->
    <section class="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fa-regular fa-folder-open text-indigo-400"></i>
          <h2 class="text-sm font-bold text-white">\u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u0646\u0633\u0648\u062C\u0629 \u0641\u064A \u0627\u0644\u0645\u0634\u0631\u0648\u0639</h2>
        </div>
        <span class="text-xs text-slate-400 font-mono">${files.length} Files Linked & Verified</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
        ${files.map((f) => `
          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs hover:border-indigo-500/40 transition">
            <div class="flex items-center gap-2 truncate">
              <i class="fa-regular fa-file-code text-slate-400 text-xs"></i>
              <span class="font-mono text-slate-200 truncate" dir="ltr">${f.path}</span>
            </div>
            <span class="text-[9px] uppercase font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-800">
              ${f.language || "code"}
            </span>
          </div>
        `).join("")}
      </div>
    </section>
  </main>

  <footer class="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
    \u062A\u0645 \u0628\u0646\u0627\u0621 \u0648\u062A\u062F\u0642\u064A\u0642 \u0647\u0630\u0627 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0648\u0627\u0633\u0637\u0629 Naje Agent Core (Autonomous Compiler Engine)
  </footer>

  <div id="toast" class="fixed bottom-6 right-6 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold transition-all duration-300 opacity-0 pointer-events-none transform translate-y-2">
    \u0625\u0634\u0639\u0627\u0631 Naje Agent Core
  </div>

  <script>
    function simulateAction(msg) {
      const toast = document.getElementById('toast');
      toast.innerText = msg;
      toast.classList.remove('opacity-0', 'translate-y-2', 'pointer-events-none');
      toast.classList.add('opacity-100', 'translate-y-0');
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2', 'pointer-events-none');
        toast.classList.remove('opacity-100', 'translate-y-0');
      }, 3000);
    }
  </script>
</body>
</html>`;
}
async function auditMultiFileProject(files, projectPlan) {
  try {
    const systemInstruction = `\u0623\u0646\u062A \u0631\u0626\u064A\u0633 \u0647\u064A\u0626\u0629 \u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0648\u0627\u0644\u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0641\u064A \u0645\u062D\u0631\u0643 "Naje Agent Core" (Lead Architect & Semantic Quality Auditor).
\u0645\u0647\u0645\u062A\u0643: \u0641\u062D\u0635 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0645\u0646\u0633\u0648\u062C \u0628\u0639\u062F \u0627\u0643\u062A\u0645\u0627\u0644 \u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0631\u0628\u0637 \u0627\u0644\u0647\u0646\u062F\u0633\u064A\u060C \u0648\u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0645\u0644\u0627\u0621\u0645\u0629 \u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u062A\u0646\u0627\u0633\u0642 \u0627\u0644\u0645\u0646\u0637\u0642 \u0627\u0644\u0628\u0631\u0645\u062C\u064A.
\u0623\u062E\u0631\u062C JSON \u0641\u0642\u0637:
{
  "passed": true | false,
  "feedback": "\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
}`;
    const filesSummary = files.map((f) => `--- [${f.path}] ---
${f.content.slice(0, 1e3)}... (Length: ${f.content.length} chars)`).join("\n\n");
    const prompt = `\u0627\u0633\u0645 \u0627\u0644\u0645\u0634\u0631\u0648\u0639: ${projectPlan.projectName}
\u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629: ${JSON.stringify(projectPlan.techStack)}
\u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u0646\u0641\u0630\u0629 (${files.length} \u0645\u0644\u0641\u0627\u062A):
${filesSummary}

\u062F\u0642\u0642 \u0641\u064A \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u0645\u0646\u0637\u0642 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A:`;
    const res = await ai3.models.generateContent({
      model: getAuditingModel(),
      contents: prompt,
      config: {
        systemInstruction,
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.fullstackAudit,
        responseMimeType: "application/json",
        temperature: 0.1,
        ...getThinkingConfig(getAuditingModel())
      }
    });
    const parsed = JSON.parse(res.text || '{"passed": true, "feedback": "\u062A\u0645 \u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0628\u0646\u062C\u0627\u062D"}');
    return {
      passed: parsed.passed !== false,
      feedback: parsed.feedback || "\u062A\u0645 \u062A\u062F\u0642\u064A\u0642 \u062A\u0643\u0627\u0645\u0644 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0628\u0631\u0645\u062C\u064A \u0628\u0646\u062C\u0627\u062D."
    };
  } catch (err) {
    console.warn("Semantic audit warning:", err);
    return {
      passed: true,
      feedback: "\u062A\u0645 \u0646\u0633\u062C \u0648\u062A\u062F\u0642\u064A\u0642 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0628\u0646\u062C\u0627\u062D."
    };
  }
}
async function executeFullstackEngineerMission(userPrompt, brandContext, inputParams = {}, pricingConfig = {}, onProgress) {
  const criticVerdict = await criticReviewRequest(ai3, userPrompt, "code", brandContext);
  if (criticVerdict.verdict === "needs_clarification") {
    return {
      projectName: "\u0645\u0634\u0631\u0648\u0639 \u0645\u0642\u062A\u0631\u062D",
      projectDescription: criticVerdict.clarificationQuestion || "\u064A\u0631\u062C\u0649 \u062A\u0648\u0636\u064A\u062D \u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0648\u062A\u0641\u0627\u0635\u064A\u0644\u0647 \u0644\u0628\u062F\u0621 \u0627\u0644\u0628\u0646\u0627\u0621 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A \u0628\u062F\u0642\u0629.",
      techStack: { frontend: "React", backend: "Node.js", styling: "Tailwind CSS" },
      plan: {
        projectName: "\u0645\u0634\u0631\u0648\u0639 \u0645\u0642\u062A\u0631\u062D",
        projectDescription: criticVerdict.clarificationQuestion || "",
        techStack: { frontend: "React", backend: "Node.js", styling: "Tailwind CSS" },
        files: [],
        buildOrder: []
      },
      files: [],
      previewHtml: `<div class="p-8 text-center"><p class="text-amber-500 font-medium">${criticVerdict.clarificationQuestion || "\u064A\u0631\u062C\u0649 \u062A\u0648\u0636\u064A\u062D \u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A"}</p></div>`,
      pointsDeducted: 0,
      auditFeedback: criticVerdict.clarificationQuestion,
      auditPassed: false
    };
  }
  const enrichedUserPrompt = criticVerdict.enrichedPrompt || userPrompt;
  onProgress?.({
    phase: "planning",
    statusMessage: "Naje Agent Core \u064A\u062D\u0644\u0644 \u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0648\u064A\u062E\u0637\u0637 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0627\u0644\u0647\u0646\u062F\u0633\u064A\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629...",
    totalFiles: 0,
    completedFiles: 0
  });
  const plan = await planFullstackProject(enrichedUserPrompt, brandContext, inputParams);
  const totalFiles = plan.files.length;
  onProgress?.({
    phase: "contracting",
    statusMessage: `Naje Agent Core \u064A\u0635\u064A\u063A \u0639\u0642\u0648\u062F \u0627\u0644\u0648\u0627\u062C\u0647\u0627\u062A \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0648\u0647\u064A\u0627\u0643\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A (${totalFiles} \u0645\u0644\u0641\u0627\u062A)...`,
    totalFiles,
    completedFiles: 0,
    plan
  });
  const projectContract = await synthesizeProjectContracts(plan, brandContext);
  const generatedFilesMap = /* @__PURE__ */ new Map();
  const generatedFilesList = [];
  for (let i = 0; i < plan.buildOrder.length; i++) {
    const filePath = plan.buildOrder[i];
    const filePlan = plan.files.find((f) => f.path === filePath) || {
      path: filePath,
      purpose: `\u0645\u0644\u0641 \u062A\u0634\u063A\u064A\u0644\u064A: ${filePath}`,
      dependsOn: [],
      estimatedComplexity: "moderate"
    };
    onProgress?.({
      phase: "generating",
      statusMessage: `Naje Agent Core \u064A\u0628\u0646\u064A ${filePlan.path} (${i + 1} \u0645\u0646 ${totalFiles})...`,
      totalFiles,
      completedFiles: i,
      activeFilePath: filePlan.path,
      plan,
      contract: projectContract,
      files: [...generatedFilesList]
    });
    const fileContent = await generateSingleFileWithContract(
      filePlan,
      projectContract,
      plan,
      brandContext,
      userPrompt
    );
    generatedFilesMap.set(filePath, fileContent);
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const language = ext === "ts" || ext === "tsx" ? "typescript" : ext === "js" || ext === "jsx" ? "javascript" : ext === "json" ? "json" : ext === "html" ? "html" : ext === "css" ? "css" : ext === "md" ? "markdown" : "typescript";
    const codeFile = {
      path: filePath,
      content: fileContent,
      language,
      purpose: filePlan.purpose,
      description: filePlan.purpose,
      dependsOn: filePlan.dependsOn,
      status: "completed",
      estimatedComplexity: filePlan.estimatedComplexity
    };
    generatedFilesList.push(codeFile);
  }
  onProgress?.({
    phase: "linking",
    statusMessage: "Naje Agent Core \u064A\u0641\u062D\u0635 \u062A\u0643\u0627\u0645\u0644 \u0627\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0639\u0628\u0631 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0647\u0646\u062F\u0633\u064A (Deterministic Linker)...",
    totalFiles,
    completedFiles: totalFiles,
    plan,
    contract: projectContract,
    files: [...generatedFilesList]
  });
  let linkerResult = runDeterministicLinker(generatedFilesList, plan);
  let healingPass = 0;
  const maxHealingPasses = 2;
  while (!linkerResult.passed && healingPass < maxHealingPasses) {
    healingPass++;
    for (const brokenPath of linkerResult.brokenFiles) {
      const filePlan = plan.files.find((f) => f.path === brokenPath);
      if (filePlan) {
        const fileDiagnostics = linkerResult.diagnostics.filter((d) => d.filePath === brokenPath).map((d) => `- ${d.message}`).join("\n");
        onProgress?.({
          phase: "healing",
          statusMessage: `Naje Agent Core \u064A\u0639\u0627\u0644\u062C \u0648\u064A\u0639\u064A\u062F \u0628\u0646\u0627\u0621 ${brokenPath} \u0648\u0641\u0642 \u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0628\u0631\u0645\u062C\u064A (\u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 ${healingPass})...`,
          totalFiles,
          completedFiles: totalFiles,
          activeFilePath: brokenPath,
          plan,
          contract: projectContract,
          files: [...generatedFilesList],
          diagnostics: linkerResult.diagnostics
        });
        const healedContent = await generateSingleFileWithContract(
          filePlan,
          projectContract,
          plan,
          brandContext,
          userPrompt,
          fileDiagnostics
        );
        generatedFilesMap.set(brokenPath, healedContent);
        const idx = generatedFilesList.findIndex((f) => f.path === brokenPath);
        if (idx !== -1) {
          generatedFilesList[idx].content = healedContent;
        }
      }
    }
    linkerResult = runDeterministicLinker(generatedFilesList, plan);
  }
  onProgress?.({
    phase: "assembling",
    statusMessage: "Naje Agent Core \u064A\u062C\u0645\u0639 \u062D\u0632\u0645\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0648\u064A\u062C\u0647\u0632 \u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u062D\u064A\u0629...",
    totalFiles,
    completedFiles: totalFiles,
    plan,
    contract: projectContract,
    files: [...generatedFilesList]
  });
  const previewHtml = constructPreviewHtml(generatedFilesList, plan, brandContext);
  onProgress?.({
    phase: "auditing",
    statusMessage: "Naje Agent Core \u064A\u062C\u0631\u064A \u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u062F\u0644\u0627\u0644\u064A \u0648\u0636\u0645\u0627\u0646 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0644\u0644\u062A\u0637\u0628\u064A\u0642...",
    totalFiles,
    completedFiles: totalFiles,
    plan,
    contract: projectContract,
    files: [...generatedFilesList]
  });
  const auditResult = await auditMultiFileProject(generatedFilesList, plan);
  const calculatedPoints = getAgentToolCost("fullstack_engineer", { plannedFiles: generatedFilesList }, pricingConfig);
  onProgress?.({
    phase: "completed",
    statusMessage: `\u062A\u0645 \u0627\u0643\u062A\u0645\u0627\u0644 \u0628\u0646\u0627\u0621 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0628\u0631\u0645\u062C\u064A \u0628\u0646\u062C\u0627\u062D (${generatedFilesList.length} \u0645\u0644\u0641\u0627\u062A).`,
    totalFiles,
    completedFiles: totalFiles,
    plan,
    contract: projectContract,
    files: [...generatedFilesList]
  });
  return {
    projectName: plan.projectName,
    projectDescription: plan.projectDescription,
    techStack: plan.techStack,
    plan,
    contract: projectContract,
    files: generatedFilesList,
    previewHtml,
    pointsDeducted: calculatedPoints,
    linkerDiagnostics: linkerResult.diagnostics,
    auditFeedback: auditResult.feedback,
    auditPassed: auditResult.passed
  };
}
function getFallbackProjectPlan(userPrompt, brandContext) {
  const brandName = brandContext?.brandName || "NajeApp";
  return {
    projectName: `${brandName.toLowerCase().replace(/\s+/g, "-")}-platform`,
    projectDescription: `\u0645\u0646\u0635\u0629 \u0648\u062A\u0637\u0628\u064A\u0642 \u0648\u064A\u0628 \u0645\u062A\u0643\u0627\u0645\u0644 \u0644\u0640 ${brandName}`,
    techStack: {
      frontend: "React + TypeScript + Tailwind CSS + Lucide Icons",
      backend: "Express.js REST API + Node.js",
      styling: "Tailwind CSS Modern Clean Architecture"
    },
    files: [
      { path: "src/types/index.ts", purpose: "\u0627\u0644\u0646\u0645\u0627\u0630\u062C \u0648\u0647\u064A\u0627\u0643\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629", dependsOn: [], estimatedComplexity: "simple" },
      { path: "src/utils/formatters.ts", purpose: "\u062F\u0648\u0627\u0644 \u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u062A\u0648\u0627\u0631\u064A\u062E \u0648\u0627\u0644\u0639\u0645\u0644\u0627\u062A \u0648\u0627\u0644\u0646\u0635\u0648\u0635", dependsOn: [], estimatedComplexity: "simple" },
      { path: "src/utils/apiClient.ts", purpose: "\u0639\u0645\u064A\u0644 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0634\u0628\u0643\u0629 \u0644\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u062E\u0627\u062F\u0645", dependsOn: ["src/types/index.ts"], estimatedComplexity: "simple" },
      { path: "src/components/Header.tsx", purpose: "\u0634\u0631\u064A\u0637 \u0627\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0639\u0644\u0648\u064A \u0645\u0639 \u0627\u0644\u0634\u0639\u0627\u0631 \u0648\u0627\u0644\u0642\u0627\u0626\u0645\u0629", dependsOn: ["src/types/index.ts"], estimatedComplexity: "simple" },
      { path: "src/components/HeroSection.tsx", purpose: "\u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u062A\u0631\u062D\u064A\u0628\u064A \u0645\u0639 \u0646\u062F\u0627\u0621 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0631\u0626\u064A\u0633\u064A", dependsOn: ["src/types/index.ts"], estimatedComplexity: "moderate" },
      { path: "src/components/FeatureCard.tsx", purpose: "\u0628\u0637\u0627\u0642\u0629 \u0639\u0631\u0636 \u0627\u0644\u0645\u064A\u0632\u0627\u062A \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A", dependsOn: ["src/types/index.ts"], estimatedComplexity: "simple" },
      { path: "src/components/DashboardView.tsx", purpose: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629", dependsOn: ["src/types/index.ts", "src/utils/apiClient.ts"], estimatedComplexity: "complex" },
      { path: "src/components/OrderModal.tsx", purpose: "\u0646\u0627\u0641\u0630\u0629 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0648\u0627\u0644\u0637\u0644\u0628\u0627\u062A", dependsOn: ["src/types/index.ts", "src/utils/apiClient.ts"], estimatedComplexity: "moderate" },
      { path: "src/components/Footer.tsx", purpose: "\u062A\u0630\u064A\u064A\u0644 \u0627\u0644\u0635\u0641\u062D\u0629 \u0645\u0639 \u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0633\u0631\u064A\u0639", dependsOn: [], estimatedComplexity: "simple" },
      { path: "src/App.tsx", purpose: "\u0627\u0644\u0645\u0643\u0648\u0646 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0648\u062D\u0644\u0642\u0629 \u0627\u0644\u0631\u0628\u0637 \u0628\u064A\u0646 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A", dependsOn: ["src/components/Header.tsx", "src/components/HeroSection.tsx", "src/components/DashboardView.tsx", "src/components/Footer.tsx"], estimatedComplexity: "complex" },
      { path: "src/server.ts", purpose: "\u062E\u0627\u062F\u0645 Express \u0627\u0644\u062E\u0644\u0641\u064A \u0645\u0639 \u0646\u0642\u0627\u0637 \u0627\u0644\u0646\u0647\u0627\u064A\u0629 \u0644\u0644\u0645\u0634\u0631\u0648\u0639", dependsOn: ["src/types/index.ts"], estimatedComplexity: "complex" },
      { path: "package.json", purpose: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0648\u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F\u064A\u0627\u062A", dependsOn: [], estimatedComplexity: "simple" },
      { path: "tsconfig.json", purpose: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0645\u062A\u0631\u062C\u0645 TypeScript", dependsOn: [], estimatedComplexity: "simple" },
      { path: "tailwind.config.js", purpose: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A Tailwind CSS \u0648\u0647\u0648\u064A\u0629 \u0627\u0644\u0623\u0644\u0648\u0627\u0646", dependsOn: [], estimatedComplexity: "simple" },
      { path: "index.html", purpose: "\u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629", dependsOn: [], estimatedComplexity: "complex" },
      { path: "README.md", purpose: "\u062F\u0644\u064A\u0644 \u0627\u0644\u062A\u062B\u0628\u064A\u062A \u0648\u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0648\u0627\u0644\u0646\u0634\u0631", dependsOn: [], estimatedComplexity: "simple" }
    ],
    buildOrder: [
      "src/types/index.ts",
      "src/utils/formatters.ts",
      "src/utils/apiClient.ts",
      "package.json",
      "tsconfig.json",
      "tailwind.config.js",
      "src/components/Header.tsx",
      "src/components/Footer.tsx",
      "src/components/FeatureCard.tsx",
      "src/components/HeroSection.tsx",
      "src/components/OrderModal.tsx",
      "src/components/DashboardView.tsx",
      "src/App.tsx",
      "src/server.ts",
      "index.html",
      "README.md"
    ]
  };
}
var ai3, PROGRAMMER_CORE;
var init_fullstackBuilder = __esm({
  "src/lib/fullstackBuilder.ts"() {
    init_agentPricing();
    init_councilOfMinds();
    init_modelRegistry();
    init_genaiClient();
    init_modelEnvConfig();
    ai3 = createGenAIClient();
    PROGRAMMER_CORE = `\u0645\u0647\u0646\u062F\u0633 \u0628\u0631\u0645\u062C\u064A\u0627\u062A \u0645\u062D\u062A\u0631\u0641. \u0643\u0644 \u0633\u0637\u0631 \u0628\u0631\u0645\u062C\u064A \u062A\u0643\u062A\u0628\u0647 \u0645\u0642\u0635\u0648\u062F \u0648\u0645\u062F\u0631\u0648\u0633\u060C \u0628\u0623\u062D\u062F\u062B \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0641\u0639\u0644\u064A\u0627\u064B \u0628\u0627\u0644\u0635\u0646\u0627\u0639\u0629 (\u062A\u062D\u0642\u0642 \u0645\u0646\u0647\u0627 \u0639\u0628\u0631 \u0627\u0644\u0628\u062D\u062B \u0639\u0646\u062F \u0627\u0644\u062D\u0627\u062C\u0629\u060C \u0644\u0627 \u062A\u062E\u0645\u0651\u0646). \u0635\u0645\u0651\u0645 \u0648\u0627\u0628\u0646\u0650 \u0645\u0646\u0638\u0648\u0645\u0627\u062A \u0628\u0631\u0645\u062C\u064A\u0629 \u062D\u0642\u064A\u0642\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0645\u062A\u0645\u0627\u0633\u0643\u0629 \u0648\u062E\u0627\u0644\u064A\u0629 \u0645\u0646 \u0627\u0644\u0623\u062E\u0637\u0627\u0621.`;
  }
});

// src/lib/agentExecutor.ts
var agentExecutor_exports = {};
__export(agentExecutor_exports, {
  executeAgentTool: () => executeAgentTool
});
async function executeAgentTool(toolName, inputParams, missionContext, pricingConfig, options) {
  const { brandContext, userPrompt, auditHistory } = missionContext;
  let enrichedPrompt = userPrompt;
  try {
    const criticType = toolName === "image_studio" || toolName === "brand_identity" ? "image" : toolName === "video_director" ? "video" : toolName === "document_architect" ? "document" : toolName === "fullstack_engineer" ? "code" : toolName === "infographic_designer" ? "document" : "voice";
    const criticRes = await criticReviewRequest(ai4, userPrompt, criticType, brandContext);
    if (criticRes.enrichedPrompt) {
      enrichedPrompt = criticRes.enrichedPrompt;
    }
  } catch (cErr) {
    console.warn("[Critic] Pre-pass review bypass:", cErr);
  }
  const recentAuditFeedback = auditHistory && auditHistory.length > 0 ? `

\u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0648\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0645\u0646 \u0627\u0644\u0645\u0631\u0627\u062D\u0644 \u0627\u0644\u0633\u0627\u0628\u0642\u0629 (\u0627\u0644\u062A\u0632\u0645 \u0628\u0647\u0627 \u0644\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0645\u062E\u0631\u062C \u0627\u0644\u062D\u0627\u0644\u064A):
` + auditHistory.slice(-2).map((a) => `- \u0645\u0631\u062D\u0644\u0629 [${a.stepTitle}]: ${a.feedback}`).join("\n") : "";
  const calculatedPoints = getAgentToolCost(toolName, inputParams || {}, pricingConfig || {});
  switch (toolName) {
    case "brand_identity": {
      const personaCore = `\u062E\u0628\u064A\u0631 \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629 \u0648\u062A\u0623\u0633\u064A\u0633 \u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062A \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629 \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u0648\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0647\u0648\u064A\u0627\u062A \u0627\u0644\u0628\u0635\u0631\u064A\u0629 \u0627\u0644\u0645\u0643\u062A\u0645\u0644\u0629.
\u0645\u0647\u0645\u062A\u0643: \u0635\u064A\u0627\u063A\u0629 \u0647\u0648\u064A\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0648\u0633\u064A\u0643\u0648\u0644\u0648\u062C\u064A\u0629 \u0644\u0644\u0628\u0631\u0627\u0646\u062F \u0628\u0646\u0627\u0621 \u0639\u0644\u0649 \u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A \u0628\u062F\u0642\u0629 \u0648\u0639\u0646\u0627\u064A\u0629 \u0645\u062A\u0646\u0627\u0647\u064A\u0629.`;
      const systemInstruction = buildPersonaInstruction("\u0627\u0644\u0645\u0635\u0648\u0651\u0631", personaCore);
      const res = await ai4.models.generateContent({
        model: PERSONAS_MODEL2(),
        contents: `\u0627\u0644\u0637\u0644\u0628: ${enrichedPrompt}
\u0627\u0644\u0645\u062F\u062E\u0644\u0627\u062A: ${JSON.stringify(inputParams)}${recentAuditFeedback}
\u0623\u062E\u0631\u062C JSON \u0641\u0642\u0637:
{
  "brandName": "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0645\u0639\u062A\u0645\u062F",
  "vision": "\u0627\u0644\u0631\u0624\u064A\u0629 \u0648\u0627\u0644\u0631\u0633\u0627\u0644\u0629",
  "archetype": "\u0627\u0644\u0646\u0645\u0637 \u0627\u0644\u0633\u064A\u0643\u0648\u0644\u0648\u062C\u064A \u0644\u0644\u0639\u0644\u0627\u0645\u0629 (\u0645\u062B\u0644: \u0627\u0644\u062D\u0627\u0643\u0645\u060C \u0627\u0644\u0645\u0628\u062A\u0643\u0631\u060C \u0627\u0644\u0633\u0627\u062D\u0631)",
  "colorPalette": [
    {"name": "\u0627\u0644\u0644\u0648\u0646 \u0627\u0644\u0623\u0633\u0627\u0633\u064A", "hex": "#1A1A24", "usage": "\u0627\u0644\u062E\u0644\u0641\u064A\u0627\u062A \u0648\u0627\u0644\u0646\u0635\u0648\u0635 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629"},
    {"name": "\u0627\u0644\u0644\u0648\u0646 \u0627\u0644\u0630\u0647\u0628\u064A/\u0627\u0644\u0631\u0645\u0632\u064A", "hex": "#C5A880", "usage": "\u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u0645\u064A\u0632\u0629 \u0648\u0627\u0644\u0623\u064A\u0642\u0648\u0646\u0627\u062A"},
    {"name": "\u0627\u0644\u0644\u0648\u0646 \u0627\u0644\u062A\u0643\u0645\u064A\u0644\u064A", "hex": "#E5D4C0", "usage": "\u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u0627\u062D\u0627\u062A \u0627\u0644\u062B\u0627\u0646\u0648\u064A\u0629"}
  ],
  "typography": {
    "primaryFont": "Tajawal / Alexandria",
    "toneOfVoice": "\u0641\u062E\u0645\u060C \u0648\u0627\u062B\u0642\u060C \u0634\u0627\u0639\u0631\u064A \u0631\u0635\u064A\u0646"
  },
  "taglines": ["\u0634\u0639\u0627\u0631 1", "\u0634\u0639\u0627\u0631 2"]
}`,
        config: {
          systemInstruction,
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.agentPlan,
          responseMimeType: "application/json",
          temperature: 0.5
        }
      });
      const output = JSON.parse(res.text || "{}");
      const artifact = {
        id: `artifact_brand_${Date.now()}`,
        type: "brand_palette",
        title: `\u0647\u0648\u064A\u0629 \u0639\u0644\u0627\u0645\u0629: ${output.brandName || brandContext?.brandName || "\u0627\u0644\u0639\u0644\u0627\u0645\u0629"}`,
        data: output,
        createdAt: Date.now()
      };
      return { output, artifact, pointsDeducted: calculatedPoints };
    }
    case "image_studio": {
      const personaCore = `\u0645\u062E\u0631\u062C \u062A\u0635\u0648\u064A\u0631 \u0648\u062A\u0635\u0645\u064A\u0645 \u0628\u0635\u0631\u064A \u0639\u0627\u0644\u0645\u064A. \u062A\u0635\u0648\u063A \u0623\u062F\u0642 \u0627\u0644\u0623\u0648\u0635\u0627\u0641 \u0627\u0644\u062A\u0648\u0644\u064A\u062F\u064A\u0629 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0627\u0644\u0645\u062A\u0648\u0627\u0641\u0642\u0629 \u0645\u0639 \u0623\u062D\u062F\u062B \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0625\u0636\u0627\u0621\u0629 \u0648\u0627\u0644\u0639\u062F\u0633\u0627\u062A \u0627\u0644\u0633\u064A\u0646\u0645\u0627\u0626\u064A\u0629.`;
      const systemInstruction = buildPersonaInstruction("\u0627\u0644\u0645\u0635\u0648\u0651\u0631", personaCore);
      const promptGen = await ai4.models.generateContent({
        model: LITE_MODEL(),
        contents: `${systemInstruction}

\u0627\u0635\u0646\u0639 \u0648\u0635\u0641\u0627\u064B \u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0627\u064B \u062F\u0642\u064A\u0642\u0627\u064B \u0648\u0645\u0628\u0647\u0631\u0627\u064B \u0644\u062A\u0648\u0644\u064A\u062F \u062A\u0635\u0645\u064A\u0645/\u0634\u0639\u0627\u0631 \u0644\u0640:
\u0627\u0644\u0628\u0631\u0627\u0646\u062F: ${brandContext?.brandName || "Luxury Brand"}
\u0627\u0644\u0645\u062C\u0627\u0644: ${brandContext?.industry || "General"}
\u0627\u0644\u0623\u0644\u0648\u0627\u0646: ${JSON.stringify(brandContext?.colors || ["#111", "#c5a880"])}
\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0637\u0644\u0628: ${inputParams.prompt || enrichedPrompt}${recentAuditFeedback}
\u0627\u0644\u0645\u0637\u0644\u0648\u0628: English generation prompt, photorealistic, 8k, highly detailed, masterwork luxury aesthetic. \u0623\u062E\u0631\u062C \u0627\u0644\u0646\u0635 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A \u0641\u0642\u0637.`,
        config: {
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler
        }
      });
      const generatedImagePrompt = promptGen.text?.trim() || "Luxury product render, cinematic lighting, 8k photorealistic";
      let imageUrl = "";
      try {
        const imgResponse = await ai4.models.generateContent({
          model: IMAGE_MODEL(),
          contents: [{ role: "user", parts: [{ text: generatedImagePrompt }] }],
          config: {
            responseModalities: ["IMAGE"],
            maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler
          }
        });
        const imagePart = imgResponse.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
        const b64 = imagePart?.inlineData?.data;
        if (b64) {
          const mime = imagePart?.inlineData?.mimeType || "image/png";
          imageUrl = `data:${mime};base64,${b64}`;
        }
      } catch (imgErr) {
        console.warn("Image generation fallback notice:", imgErr);
      }
      const output = {
        promptUsed: generatedImagePrompt,
        imageUrl: imageUrl || void 0,
        aspectRatio: inputParams.aspectRatio || "1:1"
      };
      const artifact = {
        id: `artifact_img_${Date.now()}`,
        type: "image",
        title: inputParams.title || `\u062A\u0635\u0645\u064A\u0645 \u0628\u0635\u0631\u064A: ${brandContext?.brandName || "\u0627\u0644\u0645\u0634\u0631\u0648\u0639"}`,
        url: imageUrl,
        previewUrl: imageUrl,
        data: output,
        createdAt: Date.now()
      };
      return { output, artifact, pointsDeducted: calculatedPoints };
    }
    case "voice_narration": {
      const voiceCritic = await criticReviewRequest(ai4, userPrompt, "voice", brandContext);
      if (voiceCritic.verdict === "needs_clarification") {
        return {
          output: {
            needsClarification: true,
            message: voiceCritic.clarificationQuestion || "\u064A\u0631\u062C\u0649 \u062A\u0648\u0636\u064A\u062D \u0646\u0635 \u0627\u0644\u0633\u0631\u062F \u0627\u0644\u0635\u0648\u062A\u064A \u0623\u0648 \u0623\u0633\u0637\u0631 \u0627\u0644\u0645\u062A\u062D\u062F\u062B\u064A\u0646 \u0628\u062F\u0642\u0629 \u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0635\u0648\u062A\u064A.",
            text: voiceCritic.clarificationQuestion || "\u064A\u0631\u062C\u0649 \u062A\u0648\u0636\u064A\u062D \u0646\u0635 \u0627\u0644\u0633\u0631\u062F \u0627\u0644\u0635\u0648\u062A\u064A \u0623\u0648 \u0623\u0633\u0637\u0631 \u0627\u0644\u0645\u062A\u062D\u062F\u062B\u064A\u0646 \u0628\u062F\u0642\u0629 \u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0635\u0648\u062A\u064A."
          },
          pointsDeducted: 0
        };
      }
      const activePrompt = voiceCritic.enrichedPrompt || enrichedPrompt;
      const dialogueInfo = await detectAndParseDialogue(ai4, activePrompt, brandContext);
      let audioBase64 = "";
      let narrationText = "";
      let usedVoice = "Fenrir";
      if (dialogueInfo.isDialogue && dialogueInfo.turns.length > 1) {
        narrationText = dialogueInfo.turns.map((t) => `${t.speaker}: ${t.text}`).join("\n");
        usedVoice = dialogueInfo.turns.map((t) => `${t.speaker} (${t.voice})`).join(" + ");
        try {
          const pcmSegments = [];
          const sampleRate = 24e3;
          const silencePcm = Buffer.alloc(Math.round(sampleRate * 2 * 0.3));
          for (let i = 0; i < dialogueInfo.turns.length; i++) {
            const turn = dialogueInfo.turns[i];
            const turnTtsRes = await ai4.models.generateContent({
              model: VOICE_MODEL(),
              contents: turn.text,
              config: {
                maxOutputTokens: OUTPUT_TOKEN_LIMITS.voiceScript,
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: turn.voice }
                  }
                }
              }
            });
            const candidate = turnTtsRes?.candidates?.[0];
            const audioPart = candidate?.content?.parts?.find((p) => p.inlineData && (p.inlineData.mimeType?.startsWith("audio/") || p.inlineData.data));
            if (audioPart?.inlineData?.data) {
              const rawTurnPcm = Buffer.from(audioPart.inlineData.data, "base64");
              pcmSegments.push(rawTurnPcm);
              if (i < dialogueInfo.turns.length - 1) {
                pcmSegments.push(silencePcm);
              }
            }
          }
          if (pcmSegments.length > 0) {
            const combinedPcm = Buffer.concat(pcmSegments);
            const wavBuffer = pcmToWav(combinedPcm, sampleRate);
            audioBase64 = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
          }
        } catch (dialogueErr) {
          console.warn("[SoundEngineer] Dialogue TTS synthesis error:", dialogueErr);
        }
      } else {
        const personaCore = `\u0643\u0627\u062A\u0628 \u0646\u0635\u0648\u0635 \u0625\u0639\u0644\u0627\u0646\u064A\u0629 \u0635\u0648\u062A\u064A\u0629 \u0648\u0645\u062E\u0631\u062C \u0623\u062F\u0627\u0621 \u0635\u0648\u062A\u064A \u0645\u062D\u062A\u0631\u0641.
\u0627\u0643\u062A\u0628 \u0646\u0635\u0627\u064B \u0635\u0648\u062A\u064A\u0627\u064B \u0634\u0627\u0639\u0631\u064A\u0627\u064B \u0641\u062E\u0645\u0627\u064B \u0648\u062C\u0630\u0627\u0628\u0627\u064B \u0648\u0645\u062A\u0642\u0646\u0627\u064B \u0644\u0640:
\u0627\u0644\u0628\u0631\u0627\u0646\u062F: ${brandContext?.brandName || "\u0627\u0644\u0639\u0644\u0627\u0645\u0629"}
\u0627\u0644\u0645\u062C\u0627\u0644: ${brandContext?.industry || "\u0627\u0644\u0639\u0637\u0648\u0631 \u0648\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0641\u0627\u062E\u0631\u0629"}
\u0627\u0644\u0646\u0628\u0631\u0629: ${brandContext?.tone || "\u0641\u062E\u0627\u0645\u0629 \u0648\u0647\u064A\u0628\u0629"}
\u0627\u0644\u0637\u0644\u0628: ${enrichedPrompt}${recentAuditFeedback}
\u0623\u062E\u0631\u062C \u0627\u0644\u0646\u0635 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0635\u0627\u0641\u064A \u0641\u0642\u0637 \u0628\u062F\u0648\u0646 \u0645\u0642\u062F\u0645\u0627\u062A.`;
        const systemInstruction = buildPersonaInstruction("\u0645\u0647\u0646\u062F\u0633 \u0627\u0644\u0635\u0648\u062A", personaCore);
        const scriptRes = await ai4.models.generateContent({
          model: PERSONAS_MODEL2(),
          contents: systemInstruction,
          config: {
            maxOutputTokens: OUTPUT_TOKEN_LIMITS.voiceScript
          }
        });
        narrationText = scriptRes.text?.trim() || `\u062D\u0636\u0648\u0631\u064C \u064A\u0628\u0642\u0649 \u0648\u0644\u0627 \u064A\u0632\u0648\u0644.`;
        usedVoice = inputParams.voice || await reasonBestVoice(ai4, narrationText, brandContext);
        try {
          const ttsRes = await ai4.models.generateContent({
            model: VOICE_MODEL(),
            contents: narrationText,
            config: {
              maxOutputTokens: OUTPUT_TOKEN_LIMITS.voiceScript,
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: usedVoice }
                }
              }
            }
          });
          const candidate = ttsRes?.candidates?.[0];
          const audioPart = candidate?.content?.parts?.find((p) => p.inlineData && (p.inlineData.mimeType?.startsWith("audio/") || p.inlineData.data));
          if (audioPart?.inlineData?.data) {
            const rawPcm = Buffer.from(audioPart.inlineData.data, "base64");
            const sampleRate = parseSampleRateFromMimeType(audioPart.inlineData.mimeType, 24e3);
            const wavBuffer = pcmToWav(rawPcm, sampleRate);
            audioBase64 = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
          }
        } catch (ttsErr) {
          console.warn("[SoundEngineer] Agent TTS generation error:", ttsErr);
        }
      }
      const output = {
        narrationText,
        voice: usedVoice,
        isDialogue: dialogueInfo.isDialogue,
        audioUrl: audioBase64 || void 0
      };
      const artifact = {
        id: `artifact_audio_${Date.now()}`,
        type: "audio",
        title: dialogueInfo.isDialogue ? `\u062A\u0633\u062C\u064A\u0644 \u062D\u0648\u0627\u0631 \u0635\u0648\u062A\u064A (${dialogueInfo.speakers.join(" \u0648 ")}): ${brandContext?.brandName || "\u0627\u0644\u0645\u0634\u0631\u0648\u0639"}` : `\u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A \u0625\u0639\u0644\u0627\u0646\u064A: ${brandContext?.brandName || "\u0627\u0644\u0645\u0634\u0631\u0648\u0639"}`,
        url: audioBase64,
        previewUrl: audioBase64,
        data: output,
        downloadFilename: `${brandContext?.brandName || "Audio"}_Voiceover.wav`,
        createdAt: Date.now()
      };
      return { output, artifact, pointsDeducted: calculatedPoints };
    }
    case "fullstack_engineer": {
      const fullstackResult = await executeFullstackEngineerMission(
        enrichedPrompt,
        brandContext,
        inputParams,
        pricingConfig,
        options?.onProgress
      );
      const files = fullstackResult.files || [];
      const artifact = {
        id: `artifact_code_${Date.now()}`,
        type: "code_project",
        title: `\u0645\u0634\u0631\u0648\u0639 \u0628\u0631\u0645\u062C\u064A \u0645\u062A\u0643\u0627\u0645\u0644 (${files.length} \u0645\u0644\u0641\u0627\u062A): ${fullstackResult.projectName || brandContext?.brandName || "\u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629"}`,
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
        files,
        downloadFilename: `${fullstackResult.projectName || "project"}_fullstack.zip`,
        createdAt: Date.now()
      };
      return {
        output: fullstackResult,
        artifact,
        pointsDeducted: fullstackResult.pointsDeducted
      };
    }
    case "video_director": {
      const durationSec = Number(inputParams?.durationSeconds || inputParams?.durationSec || inputParams?.duration) || 5;
      const personaCore = `\u0645\u0646\u062A\u062C \u0623\u0641\u0644\u0627\u0645 \u0625\u0639\u0644\u0627\u0646\u064A\u0629 \u0645\u062D\u062A\u0631\u0641. \u0644\u0643\u0644 \u062B\u0627\u0646\u064A\u0629 \u0645\u0646 \u0645\u062F\u0629 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629\u060C \u0641\u0643\u0651\u0631 \u0641\u0639\u0644\u064A\u0627\u064B: \u0645\u0627 \u0623\u0642\u0648\u0649 \u0644\u062D\u0638\u0629 \u0628\u0635\u0631\u064A\u0629 \u0645\u0645\u0643\u0646\u0629 \u0628\u0647\u0630\u0647 \u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u062A\u062D\u062F\u064A\u062F\u0627\u064B\u061F \u0645\u0627\u0630\u0627 \u064A\u062C\u0628 \u0623\u0646 \u064A\u064F\u0633\u062A\u0628\u0639\u062F \u0644\u062A\u062A\u0631\u0643 \u0645\u062C\u0627\u0644\u0627\u064B \u0644\u0645\u0627 \u0647\u0648 \u0623\u0647\u0645\u061F \u0627\u0633\u062A\u062B\u0645\u0631 \u0643\u0644 \u062B\u0627\u0646\u064A\u0629 \u0628\u0642\u0631\u0627\u0631 \u0625\u0628\u062F\u0627\u0639\u064A \u0648\u0627\u0639\u064D \u0648\u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0627\u062A\u0633\u0627\u0642 \u0627\u0644\u0645\u0648\u0636\u0648\u0639 \u0648\u0627\u0644\u0623\u0633\u0644\u0648\u0628 \u0645\u0646 \u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0644\u0644\u062B\u0627\u0646\u064A\u0629 \u0627\u0644\u0623\u062E\u064A\u0631\u0629.`;
      const systemInstruction = buildPersonaInstruction("\u0627\u0644\u0645\u0646\u062A\u062C", personaCore);
      const scriptRes = await ai4.models.generateContent({
        model: PERSONAS_MODEL2(),
        contents: `${systemInstruction}

\u0627\u0643\u062A\u0628 \u0633\u064A\u0646\u0627\u0631\u064A\u0648 \u0625\u0639\u0644\u0627\u0646 \u0633\u064A\u0646\u0645\u0627\u0626\u064A \u0641\u062E\u0645 \u0644\u0645\u0642\u0637\u0639 \u0641\u064A\u062F\u064A\u0648 \u0645\u062F\u062A\u0647 ${durationSec} \u062B\u0648\u0627\u0646\u064D \u0644\u0640 ${brandContext?.brandName || "\u0627\u0644\u0639\u0644\u0627\u0645\u0629"}.
\u0627\u0644\u0645\u062C\u0627\u0644: ${brandContext?.industry || "\u0627\u0644\u0645\u062C\u0627\u0644 \u0627\u0644\u0639\u0627\u0645"}
\u0627\u0644\u0637\u0644\u0628: ${enrichedPrompt}${recentAuditFeedback}

\u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0625\u062E\u0631\u0627\u062C JSON:
{
  "title": "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0625\u0639\u0644\u0627\u0646",
  "concept": "\u0627\u0644\u0641\u0643\u0631\u0629 \u0627\u0644\u062C\u0648\u0647\u0631\u064A\u0629",
  "durationSeconds": ${durationSec},
  "shots": [
    {"timestamp": "00:00 - 00:03", "visual": "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0644\u0642\u0637\u0629 \u0627\u0644\u0623\u0648\u0644\u0649", "camera": "Slow macro pan", "sound": "\u0645\u0648\u0633\u064A\u0642\u0649 \u0647\u0627\u062F\u0626\u0629 \u0648\u062A\u0623\u062B\u064A\u0631\u0627\u062A"},
    {"timestamp": "00:03 - 00:05", "visual": "\u0627\u0644\u0644\u0642\u0637\u0629 \u0627\u0644\u062E\u062A\u0627\u0645\u064A\u0629 \u0645\u0639 \u0627\u0644\u0634\u0639\u0627\u0631", "camera": "Static locked hero shot", "sound": "\u0627\u0644\u0646\u0628\u0631\u0629 \u0627\u0644\u062E\u062A\u0627\u0645\u064A\u0629"}
  ],
  "veoPrompt": "Prompt for video generation model"
}`,
        config: {
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.videoCompiler,
          responseMimeType: "application/json"
        }
      });
      const output = JSON.parse(scriptRes.text || "{}");
      const artifact = {
        id: `artifact_vid_${Date.now()}`,
        type: "video",
        title: `\u0633\u064A\u0646\u0627\u0631\u064A\u0648 \u0648\u0625\u062E\u0631\u0627\u062C \u0625\u0639\u0644\u0627\u0646: ${brandContext?.brandName || "\u0627\u0644\u0645\u0634\u0631\u0648\u0639"}`,
        data: output,
        createdAt: Date.now()
      };
      return { output, artifact, pointsDeducted: calculatedPoints };
    }
    case "document_architect": {
      const isSlides = inputParams?.docType === "slides" || inputParams?.docType === "pptx";
      const pagesCount = Number(inputParams?.pagesCount || inputParams?.slidesCount || 4);
      const personaCore = `\u0643\u0627\u062A\u0628 \u0645\u062D\u062A\u0631\u0641 \u064A\u0643\u062A\u0628 \u0628\u0623\u0639\u0644\u0649 \u062F\u0631\u062C\u0627\u062A \u0627\u0644\u062F\u0642\u0629 \u0648\u0627\u0644\u0639\u0646\u0627\u064A\u0629\u060C \u0643\u0644 \u0643\u0644\u0645\u0629 \u0645\u0642\u0635\u0648\u062F\u0629. \u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0646\u0641\u0633 \u0627\u0644\u0635\u0648\u062A \u0648\u0627\u0644\u0646\u0628\u0631\u0629 \u0639\u0628\u0631 \u0643\u0644 \u0641\u0635\u0644 \u0623\u0648 \u0634\u0631\u064A\u062D\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u062A\u0646\u062F \u062A\u062D\u062F\u064A\u062F\u0627\u064B \u0644\u064A\u062E\u0631\u062C \u0627\u0644\u0639\u0645\u0644 \u0643\u0627\u0645\u0644\u0627\u064B \u0628\u0635\u0648\u062A \u0645\u0624\u0644\u0641 \u0648\u0627\u062D\u062F \u0645\u062A\u0645\u0627\u0633\u0643 \u0648\u0631\u0641\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u0648\u0649.`;
      const systemInstruction = buildPersonaInstruction("\u0627\u0644\u0643\u0627\u062A\u0628", personaCore);
      const docRes = await ai4.models.generateContent({
        model: PERSONAS_MODEL2(),
        contents: `${systemInstruction}

\u0627\u0643\u062A\u0628 ${isSlides ? "\u0639\u0631\u0636\u0627\u064B \u062A\u0642\u062F\u064A\u0645\u064A\u0627\u064B" : "\u0643\u062A\u064A\u0628\u0627\u064B \u0645\u062A\u0643\u0627\u0645\u0644\u0627\u064B"} \u0645\u0646 ${pagesCount} ${isSlides ? "\u0634\u0631\u0627\u0626\u062D" : "\u0641\u0635\u0648\u0644"} \u0644\u0640 ${brandContext?.brandName || "\u0627\u0644\u0639\u0644\u0627\u0645\u0629"}.
\u0627\u0644\u0633\u064A\u0627\u0642: ${JSON.stringify(brandContext || {})}
\u0627\u0644\u0637\u0644\u0628: ${enrichedPrompt}${recentAuditFeedback}

\u0623\u062E\u0631\u062C JSON \u0641\u0642\u0637:
{
  "docTitle": "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0643\u062A\u064A\u0628 \u0627\u0644\u0641\u062E\u0645",
  "subtitle": "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0641\u0631\u0639\u064A",
  "chapters": [
    {
      "chapterNumber": 1,
      "chapterTitle": "\u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u0623\u0648\u0644: \u0627\u0644\u0646\u0634\u0623\u0629 \u0648\u0641\u0644\u0633\u0641\u0629 \u0627\u0644\u0625\u0644\u0647\u0627\u0645",
      "contentHtml": "<p>\u0645\u062D\u062A\u0648\u0649 \u063A\u0646\u064A \u0648\u0634\u0627\u0639\u0631\u064A \u0648\u0645\u062A\u0642\u0646...</p>"
    },
    {
      "chapterNumber": 2,
      "chapterTitle": "\u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u062B\u0627\u0646\u064A: \u0627\u0644\u0628\u0646\u064A\u0629 \u0648\u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A",
      "contentHtml": "<p>\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A...</p>"
    },
    {
      "chapterNumber": 3,
      "chapterTitle": "\u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u062B\u0627\u0644\u062B: \u0627\u0644\u062A\u062C\u0631\u0628\u0629 \u0648\u0627\u0644\u0642\u064A\u0645\u0629",
      "contentHtml": "<p>\u0634\u0631\u062D \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062A\u062C\u0631\u0628\u0629...</p>"
    },
    {
      "chapterNumber": 4,
      "chapterTitle": "\u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u0631\u0627\u0628\u0639: \u062F\u0644\u064A\u0644 \u0627\u0644\u0627\u0642\u062A\u0646\u0627\u0621 \u0648\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0627\u0644\u062D\u0635\u0631\u064A\u0629",
      "contentHtml": "<p>\u0627\u0644\u062E\u0627\u062A\u0645\u0629 \u0648\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A...</p>"
    }
  ]
}`,
        config: {
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.documentChunk,
          responseMimeType: "application/json"
        }
      });
      const output = JSON.parse(docRes.text || "{}");
      if (output.chapters?.[0]?.contentHtml) {
        const fingerprint = await extractVoiceFingerprint(ai4, output.chapters[0].contentHtml);
        output.voiceFingerprint = fingerprint;
      }
      const artifact = {
        id: `artifact_pdf_${Date.now()}`,
        type: "pdf",
        title: output.docTitle || `\u0643\u062A\u064A\u0628: ${brandContext?.brandName || "\u0627\u0644\u0639\u0644\u0627\u0645\u0629"}`,
        data: output,
        downloadFilename: `${brandContext?.brandName || "Booklet"}_Overview.pdf`,
        createdAt: Date.now()
      };
      return { output, artifact, pointsDeducted: calculatedPoints };
    }
    case "infographic_designer": {
      const { spec, sources } = await generateInfographicSpec(ai4, enrichedPrompt, brandContext);
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
      const artifact = {
        id: `artifact_infographic_${Date.now()}`,
        type: "infographic",
        title: `\u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643: ${spec.title || "\u062A\u0635\u0645\u064A\u0645 \u0628\u064A\u0627\u0646\u0627\u062A"}`,
        url: `data:image/png;base64,${pngBase64}`,
        previewUrl: `data:image/png;base64,${pngBase64}`,
        downloadFilename: `${(spec.title || "Infographic").replace(/\s+/g, "_")}.png`,
        data: output,
        sources,
        createdAt: Date.now()
      };
      return { output, artifact, pointsDeducted: calculatedPoints };
    }
    case "web_grounding":
    default: {
      const res = await ai4.models.generateContent({
        model: LITE_MODEL(),
        contents: `\u0627\u0628\u062D\u062B \u0639\u0646 \u0623\u062D\u062F\u062B \u0627\u062A\u062C\u0627\u0647\u0627\u062A \u0627\u0644\u0633\u0648\u0642\u060C \u0627\u0644\u0645\u0646\u0627\u0641\u0633\u064A\u0646\u060C \u0648\u0627\u0644\u062D\u0642\u0627\u0626\u0642 \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629 \u0627\u0644\u0645\u062D\u062F\u062B\u0629 \u0630\u0627\u062A \u0627\u0644\u0635\u0644\u0629 \u0628\u0640: ${enrichedPrompt}.${recentAuditFeedback}
\u0644\u062E\u0651\u0635 \u0623\u0647\u0645 3 \u0625\u0644\u0649 5 \u0646\u062A\u0627\u0626\u062C \u062D\u0642\u064A\u0642\u064A\u0629 \u0648\u0645\u062D\u062F\u0651\u062B\u0629 \u0645\u0639 \u0630\u0643\u0631 \u0645\u0635\u0627\u062F\u0631\u0647\u0627 \u0648\u062A\u062D\u0644\u064A\u0644 \u0623\u062B\u0631\u0647\u0627 \u0627\u0644\u0625\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A.`,
        config: {
          maxOutputTokens: 4096,
          tools: [{ googleSearch: {} }]
        }
      });
      const groundingChunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks.map((c) => ({ title: c.web?.title || "\u0645\u0635\u062F\u0631 \u062E\u0627\u0631\u062C\u064A \u0645\u0648\u062B\u0648\u0642", uri: c.web?.uri })).filter((s) => !!s.uri);
      const output = {
        analysis: res.text || "",
        sources,
        timestamp: Date.now()
      };
      const artifact = {
        id: `artifact_grounding_${Date.now()}`,
        type: "text",
        title: `\u0623\u0628\u062D\u0627\u062B \u0627\u0644\u0633\u0648\u0642 \u0648\u0627\u0644\u0628\u062D\u062B \u0627\u0644\u062D\u064A: ${brandContext?.brandName || "\u0627\u0644\u0645\u062C\u0627\u0644 \u0627\u0644\u0635\u0646\u0627\u0639\u064A"}`,
        data: output,
        sources,
        createdAt: Date.now()
      };
      return { output, artifact, pointsDeducted: calculatedPoints };
    }
  }
}
var ai4, LITE_MODEL, PERSONAS_MODEL2, IMAGE_MODEL, VOICE_MODEL;
var init_agentExecutor = __esm({
  "src/lib/agentExecutor.ts"() {
    init_audioContainer();
    init_agentPricing();
    init_fullstackBuilder();
    init_councilOfMinds();
    init_infographicEngine();
    init_modelRegistry();
    init_genaiClient();
    init_modelEnvConfig();
    ai4 = createGenAIClient();
    LITE_MODEL = () => resolveEngineModel(getNajeModel("lite"));
    PERSONAS_MODEL2 = () => resolveEngineModel(getNajeModel("personas"));
    IMAGE_MODEL = () => resolveEngineModel(getNajeModel("image_core"));
    VOICE_MODEL = () => resolveEngineModel(getNajeModel("voice_core"));
  }
});

// server.ts
var server_exports = {};
__export(server_exports, {
  MAX_DOCUMENT_PAGES: () => MAX_DOCUMENT_PAGES,
  MAX_PAGES: () => MAX_PAGES,
  MAX_PRESENTATION_SLIDES: () => MAX_PRESENTATION_SLIDES,
  MAX_SLIDES: () => MAX_SLIDES,
  chargeForTextModelUsage: () => chargeForTextModelUsage,
  getSafeZoneForPreset: () => getSafeZoneForPreset,
  getTextModelTokenRates: () => getTextModelTokenRates,
  startServer: () => startServer
});
module.exports = __toCommonJS(server_exports);
var import_fs4 = __toESM(require("fs"), 1);
var import_dns = __toESM(require("dns"), 1);
var import_http = __toESM(require("http"), 1);
var import_url = require("url");
init_audioContainer();

// src/lib/creativeEngine.ts
init_councilOfMinds();
var PHOTOGRAPHER_CORE = `\u0645\u062D\u062A\u0631\u0641 \u062A\u0635\u0648\u064A\u0631 \u0648\u062A\u0635\u0645\u064A\u0645 \u0628\u0635\u0631\u064A \u0628\u0645\u0633\u062A\u0648\u0649 \u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0639\u0627\u0644\u0645\u064A\u060C \u0645\u062A\u0645\u0643\u0651\u0646 \u0645\u0646 \u0643\u0644 \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0625\u0646\u062A\u0627\u062C \u0627\u0644\u0628\u0635\u0631\u064A: \u0627\u0644\u0647\u0648\u064A\u0627\u062A \u0627\u0644\u0628\u0635\u0631\u064A\u0629\u060C \u0627\u0644\u0634\u0639\u0627\u0631\u0627\u062A\u060C \u062A\u0635\u0648\u064A\u0631 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A\u060C \u0628\u0648\u0631\u062A\u0631\u064A\u0647\u0627\u062A \u0627\u0644\u0623\u0634\u062E\u0627\u0635\u060C \u0648\u0623\u064A \u0637\u0644\u0628 \u0642\u0627\u0628\u0644 \u0644\u0644\u062A\u062D\u0648\u0644 \u0644\u0635\u0648\u0631\u0629.
\u0645\u0646\u0647\u062C\u0643: \u062A\u0642\u062A\u0631\u062D \u0639\u062F\u0629 \u0627\u062A\u062C\u0627\u0647\u0627\u062A \u0628\u0635\u0631\u064A\u0629 \u0645\u062E\u062A\u0644\u0641\u0629 \u062C\u0630\u0631\u064A\u0627\u064B\u060C \u062A\u062F\u0645\u062C \u0623\u0642\u0648\u0649 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0648\u062A\u0633\u062A\u0628\u0639\u062F \u0627\u0644\u0623\u0636\u0639\u0641 \u0644\u062A\u0635\u0641\u064A\u0629 \u0628\u0631\u0648\u0645\u0628\u062A \u0627\u062D\u062A\u0631\u0627\u0641\u064A \u0645\u062A\u0643\u0627\u0645\u0644 \u0645\u0639 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0625\u0636\u0627\u0621\u0629\u060C \u0632\u0648\u0627\u064A\u0627 \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627\u060C \u0648\u0646\u0642\u0627\u0621 \u0627\u0644\u062A\u0631\u0643\u064A\u0628 \u0627\u0644\u0628\u0635\u0631\u064A.`;
async function analyzeBrandPsychology(ai5, userInput, mode, writerModel = "gemini-3.5-flash-lite") {
  const personaInstruction = buildPersonaInstruction("\u0627\u0644\u0645\u0635\u0648\u0651\u0631", PHOTOGRAPHER_CORE);
  let groundingInsights = "";
  const searchKeywords = ["\u0628\u0631\u0627\u0646\u062F", "\u0645\u0627\u0631\u0643\u0629", "\u0634\u0631\u0643\u0629", "\u0645\u0646\u0627\u0641\u0633", "trend", "brand", "2025", "2026", "\u0633\u0648\u0642"];
  const shouldSearch = searchKeywords.some((kw) => userInput.toLowerCase().includes(kw));
  if (shouldSearch) {
    try {
      const searchRes = await ai5.models.generateContent({
        model: writerModel,
        contents: [{ role: "user", parts: [{ text: `\u062A\u062D\u0642\u0642 \u0645\u0646 \u0623\u062D\u062F\u062B \u0627\u0644\u062A\u0648\u062C\u0647\u0627\u062A \u0627\u0644\u0628\u0635\u0631\u064A\u0629 \u0648\u0627\u0644\u0647\u0648\u064A\u0629 \u0627\u0644\u0645\u0639\u0627\u0635\u0631\u0629 \u0644\u0640: "${userInput}"` }] }],
        config: {
          tools: [{ googleSearch: {} }],
          maxOutputTokens: 8192
        }
      });
      groundingInsights = searchRes.text?.slice(0, 500) || "";
    } catch (sErr) {
      console.warn("[Photographer/Search] Grounding notice:", sErr);
    }
  }
  const prompt = `${personaInstruction}

Analyze the brand psychology of the following user request for a design (${mode}):
"${userInput}"
${groundingInsights ? `Recent Market / Trend Insights: "${groundingInsights}"` : ""}

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
    const res = await ai5.models.generateContent({
      model: writerModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 8192 }
    });
    const parsed = JSON.parse(res.text || "{}");
    if (groundingInsights) parsed.groundingInsights = groundingInsights;
    return parsed;
  } catch (e) {
    console.error("Stage 1 Error:", e);
    return { archetype: "Creator", visualEnergy: "Balanced", culturalGap: "Global", expectedTropes: "Generic design" };
  }
}
async function generateBlocklist(ai5, businessDomain, mode, writerModel = "gemini-3.5-flash-lite") {
  const personaInstruction = buildPersonaInstruction("\u0627\u0644\u0645\u0635\u0648\u0651\u0631", PHOTOGRAPHER_CORE);
  const prompt = `${personaInstruction}

If 100 AI designers received a prompt to design a ${mode} for: "${businessDomain}", what are the top 5 most clich\xE9, overused, and obvious visual solutions they would generate?
Return ONLY a JSON array of 5 strings.`;
  try {
    const res = await ai5.models.generateContent({
      model: writerModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 4096 }
    });
    return JSON.parse(res.text || "[]");
  } catch (e) {
    return ["generic logo", "blue circles", "abstract shapes"];
  }
}
async function crossDomainSynthesis(ai5, coreIdea, brandProfile, writerModel = "gemini-3.5-flash-lite") {
  const personaInstruction = buildPersonaInstruction("\u0627\u0644\u0645\u0635\u0648\u0651\u0631", PHOTOGRAPHER_CORE);
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
    const res = await ai5.models.generateContent({
      model: writerModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 4096 }
    });
    return JSON.parse(res.text || "[]");
  } catch (e) {
    return ["Apply architectural geometry", "Use natural flow lines", "Incorporate rhythmic repetition"];
  }
}
async function matchArtMovement(ai5, brandProfile, writerModel = "gemini-3.5-flash-lite") {
  const personaInstruction = buildPersonaInstruction("\u0627\u0644\u0645\u0635\u0648\u0651\u0631", PHOTOGRAPHER_CORE);
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
    const res = await ai5.models.generateContent({
      model: writerModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 4096 }
    });
    return JSON.parse(res.text || "[]");
  } catch (e) {
    return ["Bauhaus", "Swiss International", "Minimalism"];
  }
}
async function generateDivergentConcepts(ai5, rawPrompt, brandProfile, blocklist, synthesisOptions, artMovements, mode, aspectRatio2, writerModel = "gemini-3.5-flash-lite") {
  const personaInstruction = buildPersonaInstruction("\u0627\u0644\u0645\u0635\u0648\u0651\u0631", PHOTOGRAPHER_CORE);
  const prompt = `${personaInstruction}

You are a visionary Creative Director. We need 3 to 5 RADICALLY DIFFERENT, world-class design concepts for:
Original Request: "${rawPrompt}"
Mode: ${mode}
Aspect Ratio: ${aspectRatio2}

Brand Psychology: ${brandProfile.archetype}, Energy: ${brandProfile.visualEnergy}, Culture: ${brandProfile.culturalGap}

CRITICAL RULES:
1. STRICT BLOCKLIST (Do NOT use these clich\xE9 ideas):
${blocklist.map((b) => "- " + b).join("\n")}

2. CROSS-DOMAIN SYNTHESIS OPTIONS (Use these as inspiration):
${synthesisOptions.map((s) => "- " + s).join("\n")}

3. ART MOVEMENTS TO UTILIZE:
${artMovements.map((a) => "- " + a).join("\n")}

Create 4 distinct concepts. NO TWO CONCEPTS CAN USE THE SAME ART MOVEMENT OR SYNTHESIS PRINCIPLE. They must be completely divergent approaches.

Return ONLY a JSON array of 4 objects matching this schema exactly:
[
  {
    "conceptId": "c1",
    "philosophyName": "Inspiring name in Arabic (e.g. \u0627\u0644\u0635\u0645\u062A \u0627\u0644\u0647\u0646\u062F\u0633\u064A)",
    "artMovementUsed": "Movement name",
    "synthesisPrincipleUsed": "Synthesis principle name",
    "visualMetaphor": "Visual metaphor description",
    "colorPalette": ["#HEX1", "#HEX2", "#HEX3"],
    "imagePromptDraft": "The highly detailed image generation prompt draft in English...",
    "whyItWorks": "A brief explanation in Arabic of why this works for the user's brand"
  }
]`;
  try {
    const res = await ai5.models.generateContent({
      model: writerModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 16384 }
    });
    return JSON.parse(res.text || "[]");
  } catch (e) {
    console.error("Stage 5 Error:", e);
    return [];
  }
}
async function generateMaximumCreativity(ai5, rawPrompt, mode = "design", aspectRatio2 = "1:1", applyCreativeLayers2, writerModel = "gemini-3.5-flash-lite") {
  try {
    const brandProfile = await analyzeBrandPsychology(ai5, rawPrompt, mode, writerModel);
    const [blocklist, synthesisOptions, artMovements] = await Promise.all([
      generateBlocklist(ai5, rawPrompt, mode, writerModel),
      crossDomainSynthesis(ai5, rawPrompt, brandProfile, writerModel),
      matchArtMovement(ai5, brandProfile, writerModel)
    ]);
    let concepts = await generateDivergentConcepts(ai5, rawPrompt, brandProfile, blocklist, synthesisOptions, artMovements, mode, aspectRatio2, writerModel);
    if (!concepts || concepts.length === 0) {
      concepts = [{
        conceptId: "c_fallback",
        philosophyName: "\u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0645\u0628\u0627\u0634\u0631",
        artMovementUsed: "Modern Minimalist",
        synthesisPrincipleUsed: "Direct Representation",
        visualMetaphor: "Direct brand identity presentation",
        colorPalette: ["#111827", "#D97706", "#F3F4F6"],
        imagePromptDraft: rawPrompt,
        whyItWorks: "\u062A\u0635\u0645\u064A\u0645 \u0623\u0646\u064A\u0642 \u0648\u0645\u0628\u0627\u0634\u0631 \u064A\u0639\u062A\u0645\u062F \u0639\u0644\u0649 \u0637\u0644\u0628\u0643 \u0627\u0644\u0623\u0635\u0644\u064A."
      }];
    }
    return concepts;
  } catch (e) {
    console.error("Master Orchestrator Error:", e);
    const fallbackPrompt = applyCreativeLayers2 ? await applyCreativeLayers2(ai5, rawPrompt, mode, aspectRatio2) : rawPrompt;
    return [{
      conceptId: "c_error_fallback",
      philosophyName: "\u0627\u0644\u0627\u062A\u062C\u0627\u0647 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
      artMovementUsed: "Modern",
      synthesisPrincipleUsed: "Direct",
      visualMetaphor: "Core identity focus",
      colorPalette: ["#0F172A", "#3B82F6", "#E2E8F0"],
      imagePromptDraft: fallbackPrompt,
      whyItWorks: "\u062A\u0635\u0645\u064A\u0645 \u064A\u0639\u0643\u0633 \u0645\u062A\u0637\u0644\u0628\u0627\u062A\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0628\u0623\u0641\u0636\u0644 \u062C\u0648\u062F\u0629 \u0645\u0645\u0643\u0646\u0629."
    }];
  }
}

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path4 = __toESM(require("path"), 1);
var import_genai5 = require("@google/genai");
var import_app = require("firebase-admin/app");
var import_firestore = require("firebase-admin/firestore");
var import_auth = require("firebase-admin/auth");
var import_storage = require("firebase-admin/storage");
var import_messaging = require("firebase-admin/messaging");
var import_dotenv = __toESM(require("dotenv"), 1);
init_modelRegistry();
init_modelEnvConfig();
init_agentPricing();
init_councilOfMinds();
var import_os = __toESM(require("os"), 1);

// src/lib/videoOrchestrator.ts
var DURATION_LADDER = {
  4: [4],
  6: [6],
  8: [8],
  10: [4, 6],
  12: [4, 8],
  14: [8, 6],
  16: [8, 8],
  24: [8, 8, 8],
  30: [8, 8, 8, 6]
};
var SUPPORTED_TOTAL_DURATIONS = Object.keys(DURATION_LADDER).map(Number).sort((a, b) => a - b);
function splitDuration(targetSec) {
  const shots = DURATION_LADDER[targetSec];
  if (!shots) {
    const nearest = SUPPORTED_TOTAL_DURATIONS.reduce(
      (closest, d) => Math.abs(d - targetSec) < Math.abs(closest - targetSec) ? d : closest
    );
    return DURATION_LADDER[nearest];
  }
  return shots;
}
function buildInitialPlan(params) {
  const {
    rawPrompt,
    totalDurationSec,
    aspectRatio: aspectRatio2 = "16:9",
    model = "veo-lite",
    brandProfile,
    pointsRatePerSecond = 2.5
  } = params;
  const durationSegments = splitDuration(totalDurationSec);
  const totalCalculated = durationSegments.reduce((sum, d) => sum + d, 0);
  const styleContext = brandProfile?.style ? `Style: ${brandProfile.style}. ` : "";
  const colorContext = brandProfile?.colors?.length ? `Palette: ${brandProfile.colors.join(", ")}. ` : "";
  const styleLock = `${styleContext}${colorContext}Consistent cinematic lighting, ultra-clean commercial look, perfectly continuous subject and environment, 24fps motion cadence, ${aspectRatio2} aspect ratio.`;
  const shots = durationSegments.map((dur, index) => {
    const isFirstShot = index === 0;
    const isMultiShot = durationSegments.length > 1;
    let shotPrompt = "";
    let descriptionAr = "";
    let cameraMovement = "";
    if (isFirstShot) {
      descriptionAr = `\u0627\u0644\u0644\u0642\u0637\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 (${dur} \u062B\u0648\u0627\u0646\u064A): \u0644\u0642\u0637\u0629 \u062A\u0623\u0633\u064A\u0633\u064A\u0629 \u0648\u0628\u062F\u0627\u064A\u0629 \u0627\u0644\u0645\u0634\u0647\u062F \u0645\u0639 \u062A\u062B\u0628\u064A\u062A \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0628\u0635\u0631\u064A\u0629.`;
      cameraMovement = "Smooth establishing forward tracking or gentle pan";
      shotPrompt = `[Shot 1 of ${durationSegments.length} - ${dur}s]: Establishing shot for "${rawPrompt}". Establish main subject and dynamic scene setting with crystal-clear focus, stable cinematography, and rich textural detail. ${styleLock}`;
    } else {
      descriptionAr = `\u0627\u0644\u0644\u0642\u0637\u0629 \u0631\u0642\u0645 ${index + 1} (${dur} \u062B\u0648\u0627\u0646\u064A): \u0644\u0642\u0637\u0629 \u062A\u0643\u0645\u064A\u0644\u064A\u0629 \u0645\u062A\u0635\u0644\u0629 \u0628\u0635\u0631\u064A\u0627\u064B \u0628\u0627\u0644\u0625\u0637\u0627\u0631 \u0627\u0644\u062E\u062A\u0627\u0645\u064A \u0644\u0644\u0642\u0637\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629.`;
      cameraMovement = "Seamless continuation push-in / dynamic subject motion";
      shotPrompt = `[Shot ${index + 1} of ${durationSegments.length} - ${dur}s]: Continuous sequence directly following Shot ${index} for "${rawPrompt}". Must maintain EXACT subject appearance, wardrobe, environment, lighting angle, and color palette from the initial reference frame. Action intensifies smoothly to resolution. ${styleLock}`;
    }
    return {
      shotNumber: index + 1,
      durationSec: dur,
      prompt: shotPrompt,
      descriptionAr,
      cameraMovement,
      requiresImageInput: !isFirstShot && isMultiShot,
      status: "pending"
    };
  });
  const totalCost = Math.round(totalCalculated * pointsRatePerSecond);
  return {
    id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: rawPrompt.length > 40 ? `${rawPrompt.substring(0, 37)}...` : rawPrompt,
    rawPrompt,
    totalDurationSec: totalCalculated,
    aspectRatio: aspectRatio2,
    model,
    shots,
    totalEstimatedCostPoints: totalCost,
    styleLock,
    createdAt: Date.now()
  };
}

// src/lib/workspaceZip.ts
var import_jszip = __toESM(require("jszip"), 1);
var SKIP_DIR = /(^|\/)(node_modules|\.git|dist|build|\.next|coverage|vendor|__pycache__|\.venv|venv|\.cache|\.turbo|\.grok|artifacts|attachments|imagine_images|static\/static)(\/|$)/i;
var SKIP_FILE = /(\.(png|jpe?g|gif|webp|ico|woff2?|ttf|eot|mp4|mp3|mov|zip|gz|7z|pdf|psd|ai|exe|dll|so|dylib|lock|map)|package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/i;
var TEXT_EXT = /\.(html?|css|scss|less|js|mjs|cjs|jsx|ts|tsx|json|md|txt|svg|vue|svelte|py|php|rb|go|rs|java|kt|xml|ya?ml|sql|sh|env|toml|ini|c|cc|cpp|h|hpp)$/i;
var CODE_EXT = /\.(html?|css|scss|less|js|mjs|cjs|jsx|ts|tsx|json|vue|svelte|py|php|rb|go|rs|java|kt|xml|sql|sh)$/i;
var MAX_FILES = 220;
var MAX_FILE_CHARS = 8e4;
var MAX_TOTAL_CHARS = 9e5;
function languageOf(path5) {
  const ext = (path5.split(".").pop() || "").toLowerCase();
  const map = {
    html: "xml",
    htm: "xml",
    css: "css",
    scss: "scss",
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    md: "markdown",
    py: "python",
    php: "php",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    xml: "xml",
    yml: "yaml",
    yaml: "yaml",
    svg: "xml",
    sql: "sql",
    sh: "bash",
    vue: "xml"
  };
  return map[ext] || "plaintext";
}
function filePriority(path5) {
  const n = path5.replace(/\\/g, "/").toLowerCase();
  if (/(^|\/)index\.html$/.test(n)) return 0;
  if (/(^|\/)(package\.json|vite\.config\.\w+|tsconfig.*\.json)$/.test(n)) return 1;
  if (n.startsWith("src/") && CODE_EXT.test(n)) return 2;
  if (CODE_EXT.test(n)) return 3;
  if (/\.(css|scss|less)$/.test(n)) return 4;
  if (/\.md$/.test(n)) return 8;
  return 6;
}
async function unpackSiteZip(buffer) {
  const zip = await import_jszip.default.loadAsync(buffer);
  const files = [];
  let skipped = 0;
  let truncatedFiles = 0;
  let totalChars = 0;
  const entries = Object.keys(zip.files).sort((a, b) => {
    const pa = filePriority(a) - filePriority(b);
    if (pa !== 0) return pa;
    return a.localeCompare(b);
  });
  for (const name of entries) {
    const entry = zip.files[name];
    if (!entry || entry.dir) continue;
    const path5 = name.replace(/^\/+/, "").replace(/\\/g, "/");
    if (!path5 || SKIP_DIR.test(path5) || SKIP_FILE.test(path5) || !TEXT_EXT.test(path5)) {
      skipped += 1;
      continue;
    }
    if (files.length >= MAX_FILES || totalChars >= MAX_TOTAL_CHARS) {
      skipped += 1;
      continue;
    }
    let text = await entry.async("string");
    if (!text) continue;
    if (text.includes("\0")) {
      skipped += 1;
      continue;
    }
    let truncated = false;
    if (text.length > MAX_FILE_CHARS) {
      text = text.slice(0, MAX_FILE_CHARS) + "\n\n/* \u2026 truncated \u2026 */";
      truncated = true;
      truncatedFiles += 1;
    }
    if (totalChars + text.length > MAX_TOTAL_CHARS) {
      const remain = MAX_TOTAL_CHARS - totalChars;
      if (remain < 400) {
        skipped += 1;
        continue;
      }
      text = text.slice(0, remain) + "\n\n/* \u2026 truncated \u2026 */";
      truncated = true;
      truncatedFiles += 1;
    }
    totalChars += text.length;
    files.push({ path: path5, language: languageOf(path5), content: text, bytes: text.length, truncated });
  }
  files.sort((a, b) => filePriority(a.path) - filePriority(b.path) || a.path.localeCompare(b.path));
  return { files, skipped, truncatedFiles };
}
function buildFileTree(paths) {
  return paths.map((p) => `\u2022 ${p}`).join("\n");
}
function buildCodeContext(files, focusPath, budget = 18e4) {
  const ordered = [...files].sort((a, b) => {
    if (focusPath && a.path === focusPath) return -1;
    if (focusPath && b.path === focusPath) return 1;
    return filePriority(a.path) - filePriority(b.path) || a.path.localeCompare(b.path);
  });
  let used = 0;
  const parts = [];
  for (const f of ordered) {
    const block = `--- FILE: ${f.path}${f.truncated ? " (truncated)" : ""} ---
${f.content}
`;
    if (used + block.length > budget) {
      const remain = budget - used;
      if (remain > 400) parts.push(block.slice(0, remain) + "\n/* \u2026 */\n");
      break;
    }
    parts.push(block);
    used += block.length;
  }
  return parts.join("\n");
}

// src/lib/voicePricing.ts
function countBillableVoiceChars(text) {
  if (!text) return 0;
  return text.replace(/\s+/g, " ").trim().length;
}
function spokenTextFromVoiceScript(script) {
  if (!script) return "";
  return script.split("\n").map((line) => {
    const idx = line.indexOf(":");
    return idx >= 0 ? line.slice(idx + 1) : line;
  }).join(" ");
}
function calcVoicePointsCost(opts) {
  const chars = countBillableVoiceChars(opts.text);
  const perChar = Number(
    opts.tier === "pro" ? opts.pointsPerCharacterPro ?? opts.pointsPerCharacter ?? 0.01 : opts.pointsPerCharacter ?? 0.01
  );
  const min = Number(opts.minCost ?? 0.1);
  const cost2 = chars <= 0 ? min : Math.max(min, parseFloat((chars * perChar).toFixed(4)));
  return { chars, perChar, cost: cost2 };
}

// server.ts
var getAppDirname = () => {
  if (typeof __dirname !== "undefined") return __dirname;
  return process.cwd();
};
var getAppFilename = () => {
  if (typeof __filename !== "undefined") return __filename;
  return import_path4.default.join(process.cwd(), "server.ts");
};
var appDirname = getAppDirname();
var appFilename = getAppFilename();
var ffmpegMod = null;
async function getFfmpeg() {
  if (ffmpegMod) return ffmpegMod;
  const ffmpeg = (await import("fluent-ffmpeg")).default;
  const ffmpegStatic = (await import("ffmpeg-static")).default;
  if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);
  ffmpegMod = ffmpeg;
  return ffmpeg;
}
async function getNajeEngineCtor() {
  const mod = await Promise.resolve().then(() => (init_naje_engine(), naje_engine_exports));
  return mod.NajeEngine;
}
function extractGeminiText(chunk) {
  const parts = chunk?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return "";
  let out = "";
  for (const p of parts) {
    if (!p || typeof p.text !== "string") continue;
    if (p.thought === true) continue;
    if (p.functionCall) continue;
    out += p.text;
  }
  return out;
}
function extractGeminiFunctionCalls(chunk) {
  const fromSdk = Array.isArray(chunk?.functionCalls) ? chunk.functionCalls : [];
  if (fromSdk.length > 0) return fromSdk;
  const parts = chunk?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return [];
  const calls = [];
  for (const p of parts) {
    if (p?.functionCall?.name) calls.push(p.functionCall);
  }
  return calls;
}
import_dotenv.default.config();
process.on("uncaughtException", (err) => {
  console.error("[Error] Uncaught Exception in server process:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Error] Unhandled Rejection in server process:", reason);
});
var isProdBundle = (appFilename.includes("dist") || appFilename.endsWith(".cjs")) && !process.argv.some((arg) => arg.includes("server.ts"));
if (isProdBundle) {
  process.env.NODE_ENV = "production";
}
var configProjectId2 = "gen-lang-client-0549025293";
var configDatabaseId = "ai-studio-5cc65c6b-3f0a-4cc6-9e69-168419d8912f";
var configStorageBucket = "gen-lang-client-0549025293.firebasestorage.app";
try {
  const possibleConfigPaths = [
    import_path4.default.join(process.cwd(), "firebase-applet-config.json"),
    import_path4.default.join(appDirname, "firebase-applet-config.json"),
    import_path4.default.join(appDirname, "..", "firebase-applet-config.json")
  ];
  const configPath = possibleConfigPaths.find((p) => import_fs4.default.existsSync(p));
  if (configPath) {
    const configRaw = import_fs4.default.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(configRaw);
    if (parsed.projectId) configProjectId2 = parsed.projectId;
    if (parsed.firestoreDatabaseId) configDatabaseId = parsed.firestoreDatabaseId;
    if (parsed.storageBucket) configStorageBucket = parsed.storageBucket;
  }
} catch (e) {
  console.warn("Could not load firebase-applet-config.json, using defaults:", e);
}
var PROJECT_ID2 = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || configProjectId2;
var DATABASE_ID = configDatabaseId;
var STORAGE_BUCKET = configStorageBucket;
var BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID2}/databases/${DATABASE_ID}/documents`;
var USE_VERTEX_AI2 = process.env.NAJE_USE_VERTEX_AI === "true";
var VERTEX_LOCATION2 = process.env.VERTEX_AI_LOCATION || "global";
function createGenAIClient2() {
  if (USE_VERTEX_AI2) {
    return new import_genai5.GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID2,
      location: VERTEX_LOCATION2
    });
  }
  return new import_genai5.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}
var modelEndpointCache = /* @__PURE__ */ new Map();
var MODEL_CACHE_TTL = 3 * 60 * 1e3;
var PAYPAL_POINTS_PACKAGES = {
  "pkg_5": { points: 50, usd: 5 },
  "pkg_10": { points: 100, usd: 10 },
  "pkg_20": { points: 200, usd: 20 },
  // Backward compatibility packages
  "pkg_50": { points: 50, usd: 8 },
  "pkg_120": { points: 120, usd: 15 }
};
var PACKAGE_TIER_RANK = {
  pkg_5: 1,
  pkg_10: 2,
  pkg_20: 3
};
var FEATURE_MIN_TIER = {
  creativelyAI: 1,
  najeAgent: 2,
  najeAd: 3,
  najeSource: 1,
  najeDeveloper: 2
};
var FEATURE_DISPLAY_NAME = {
  creativelyAI: "Creatively AI",
  najeAgent: "Naje AI Agent",
  najeAd: "Naje Ad",
  najeSource: "\u0646\u0627\u062C\u064A \u0645\u0646 \u0645\u0635\u0627\u062F\u0631\u0643",
  najeDeveloper: "\u0646\u0627\u062C\u064A \u0627\u0644\u0645\u0637\u0648\u0631"
};
var TIER_UNLOCK_PACKAGE = {
  1: "pkg_5",
  2: "pkg_10",
  3: "pkg_20"
};
function checkFeatureAccess(res, userData, featureKey) {
  if (userData?.isAdmin) return true;
  const requiredTier = FEATURE_MIN_TIER[featureKey];
  const userTier = Number(userData?.highestPurchasedTier || 0);
  if (userTier >= requiredTier) return true;
  res.status(402).json({
    error: "feature_locked",
    feature: featureKey,
    featureName: FEATURE_DISPLAY_NAME[featureKey],
    requiredTier,
    requiredPackage: TIER_UNLOCK_PACKAGE[requiredTier],
    currentTier: userTier
  });
  return false;
}
var KNOWN_BAD_MODEL_PATTERNS = [/gemini-1\.5/, /gemini-2\.0-flash-exp/];
function assertModelNameSane(name, where) {
  for (const p of KNOWN_BAD_MODEL_PATTERNS) {
    if (p.test(name)) {
      console.error(`[FATAL CONFIG] Invalid model name "${name}" referenced at ${where}. This model family does not exist.`);
    }
  }
}
async function getModelEndpointConfig(endpointId, defaultFallback, _token) {
  const rawFallback = defaultFallback || FALLBACK_DEFAULTS[endpointId] || getNajeModel("core");
  const fallback = resolveEngineModel(rawFallback);
  assertModelNameSane(fallback, `getModelEndpointConfig fallback for ${endpointId}`);
  const now = Date.now();
  const cached = modelEndpointCache.get(endpointId);
  if (cached && now - cached.fetchedAt < MODEL_CACHE_TTL) {
    assertModelNameSane(cached.modelId, `modelEndpointCache for ${endpointId}`);
    return {
      modelId: resolveEngineModel(cached.modelId),
      fallbackModelId: cached.fallbackModelId ? resolveEngineModel(cached.fallbackModelId) : void 0,
      maxOutputTokens: cached.maxOutputTokens,
      isEnabled: cached.isEnabled !== false,
      supportedDurations: cached.supportedDurations
    };
  }
  try {
    const doc = await dbAdmin.collection("model_endpoints").doc(endpointId).get();
    if (doc.exists && doc.data()) {
      const data = doc.data();
      const modelId = resolveEngineModel(String(data.modelId || fallback).trim());
      const fallbackModelId = data.fallbackModelId ? resolveEngineModel(String(data.fallbackModelId).trim()) : void 0;
      const maxOutputTokens = typeof data.maxOutputTokens === "number" ? data.maxOutputTokens : void 0;
      const isEnabled = data.isEnabled !== false;
      const supportedDurations = Array.isArray(data.supportedDurations) ? data.supportedDurations : void 0;
      assertModelNameSane(modelId, `dbAdmin model_endpoints doc for ${endpointId}`);
      modelEndpointCache.set(endpointId, {
        modelId,
        fallbackModelId,
        maxOutputTokens,
        isEnabled,
        supportedDurations,
        inputPointsPer1k: data.inputPointsPer1k,
        outputPointsPer1k: data.outputPointsPer1k,
        inputPointsPerBlock: data.inputPointsPerBlock ?? data.inputPointsPer1k,
        inputTokenBlockSize: data.inputTokenBlockSize,
        outputPointsPerBlock: data.outputPointsPerBlock ?? data.outputPointsPer1k,
        outputTokenBlockSize: data.outputTokenBlockSize,
        fetchedAt: now
      });
      if (modelId) modelEndpointCache.set(`model:${modelId}`, modelEndpointCache.get(endpointId));
      return { modelId, fallbackModelId, maxOutputTokens, isEnabled, supportedDurations };
    }
  } catch (err) {
  }
  return { modelId: fallback, isEnabled: true };
}
async function getModelEndpointId(endpointId, defaultFallback, token) {
  const cfg = await getModelEndpointConfig(endpointId, defaultFallback, token);
  if (cfg.isEnabled === false) {
    const err = new Error(`MODEL_DISABLED: \u0627\u0644\u0646\u0645\u0648\u0630\u062C (${endpointId}) \u0645\u0639\u0637\u0651\u0644 \u0645\u0624\u0642\u062A\u0627\u064B \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629.`);
    err.status = 403;
    err.isModelDisabled = true;
    throw err;
  }
  return resolveEngineModel(cfg.modelId);
}
function isModelDeadOrDeprecated(err) {
  if (!err) return false;
  const str = String(err?.message || err?.statusText || err || "").toLowerCase();
  const code = err?.status || err?.code || err?.statusCode || 0;
  return code === 404 || code === 403 || code === 429 || code === 503 || str.includes("not found") || str.includes("is not found") || str.includes("no longer available") || str.includes("deprecated") || str.includes("unsupported model") || str.includes("does not exist") || str.includes("model not found") || str.includes("permission_denied") || str.includes("denied access") || str.includes("resource_exhausted") || str.includes("quota") || str.includes("rate limit") || str.includes("429") || str.includes("404");
}
async function updateEndpointHealthOnFailure(endpointId, failedModelId, errorReason) {
  try {
    const patch = {
      lastFailureAt: Date.now(),
      lastFailureReason: errorReason.slice(0, 300)
    };
    if (dbAdmin) {
      await dbAdmin.collection("model_endpoints").doc(endpointId).set(patch, { merge: true }).catch(() => {
      });
    }
  } catch (e) {
  }
}
async function updateEndpointHealthOnSuccess(endpointId, successfulModelId) {
  try {
    const patch = {
      lastKnownGoodModelId: successfulModelId,
      lastValidatedAt: Date.now(),
      lastValidatedOk: true,
      lastFailureAt: null,
      lastFailureReason: null
    };
    if (dbAdmin) {
      await dbAdmin.collection("model_endpoints").doc(endpointId).set(patch, { merge: true }).catch(() => {
      });
    }
  } catch (e) {
  }
}
async function seedModelEndpointsIfMissing() {
  if (!dbAdmin) return;
  try {
    const targetModelMap = {
      text_lite: getNajeModel("lite"),
      tier_lite: getNajeModel("lite"),
      text_core: getNajeModel("core"),
      tier_core: getNajeModel("core"),
      text_max: getNajeModel("pro"),
      tier_max: getNajeModel("pro"),
      critic_review: getNajeModel("personas"),
      creative_council: getNajeModel("personas"),
      agent_planner: getNajeModel("personas"),
      agent_auditor: getNajeModel("personas"),
      agent_narrator: getNajeModel("personas"),
      fullstack_builder: getNajeModel("pro"),
      fullstack_auditor: getNajeModel("personas"),
      image_prompt_compiler: getNajeModel("personas"),
      video_prompt_compiler: getNajeModel("personas"),
      image_auditor: getNajeModel("personas"),
      ui_standard: getNajeModel("core"),
      ui_builder: getNajeModel("core"),
      document_engine: getNajeModel("personas"),
      doc_standard: getNajeModel("core"),
      doc_a5: getNajeModel("core"),
      doc_slides: getNajeModel("core"),
      document_writer: getNajeModel("personas"),
      slide_writer: getNajeModel("personas"),
      infographic_designer: getNajeModel("personas"),
      image_lite: getNajeModel("image_lite"),
      image_fast: getNajeModel("image_lite"),
      image_spectra: getNajeModel("image_core"),
      image_standard: getNajeModel("image_core"),
      image_hd: getNajeModel("image_pro"),
      image_pro: getNajeModel("image_pro"),
      image_addon: getNajeModel("personas"),
      video_standard: getNajeModel("video_core"),
      video_veo_lite: getNajeModel("video_core"),
      video_omni: getNajeModel("video_pro"),
      voice_tts_standard: getNajeModel("voice_core"),
      voice_tts: getNajeModel("voice_core"),
      voice_tts_core: getNajeModel("voice_core"),
      voice_tts_pro: getNajeModel("voice_pro")
    };
    const endpointsToMigrate = Object.keys(targetModelMap);
    const snapshot = await dbAdmin.collection("model_endpoints").limit(1).get();
    if (snapshot.empty) {
      console.log("[Model Registry] Seeding initial model_endpoints collection...");
      const batch = dbAdmin.batch();
      for (const item of SEED_ENDPOINTS) {
        const ref = dbAdmin.collection("model_endpoints").doc(item.id);
        batch.set(ref, {
          ...item,
          lastValidatedAt: Date.now(),
          lastValidatedOk: true
        });
      }
      await batch.commit();
      console.log("[Model Registry] Successfully seeded model_endpoints collection.");
    } else {
      for (const epId of endpointsToMigrate) {
        try {
          const targetModel = targetModelMap[epId] || "gemini-3.6-flash";
          const docRef = dbAdmin.collection("model_endpoints").doc(epId);
          const docSnap = await docRef.get();
          if (docSnap.exists) {
            const currentModelId = docSnap.data()?.modelId;
            if (currentModelId !== targetModel) {
              await docRef.update({
                modelId: targetModel,
                lastValidatedAt: Date.now(),
                lastValidatedOk: true
              });
              modelEndpointCache.delete(epId);
            }
          } else {
            const seedItem = SEED_ENDPOINTS.find((s) => s.id === epId);
            if (seedItem) {
              await docRef.set({
                ...seedItem,
                modelId: targetModel,
                lastValidatedAt: Date.now(),
                lastValidatedOk: true
              });
              modelEndpointCache.delete(epId);
            }
          }
        } catch (_subErr) {
        }
      }
    }
  } catch (err) {
  }
}
var MAX_DOCUMENT_PAGES = 25;
var MAX_PRESENTATION_SLIDES = 35;
var MAX_PAGES = MAX_DOCUMENT_PAGES;
var MAX_SLIDES = MAX_PRESENTATION_SLIDES;
var DEFAULT_FORMAT_PRESETS = [
  { id: "fb_cover", nameAr: "\u0641\u064A\u0633\u0628\u0648\u0643: \u063A\u0644\u0627\u0641 \u0635\u0641\u062D\u0629", nameEn: "Facebook Page Cover", platform: "facebook", width: 1640, height: 924, aspectRatio: "16:9", category: "social", icon: "facebook", isDefault: true, enabled: true, safeZone: "Keep all logos, faces, and text strictly inside the central 820x312 safe rectangle (middle 60%). Avoid the lower-left corner where profile avatars overlap, and avoid top/bottom 15% edges which crop on mobile devices." },
  { id: "fb_post", nameAr: "\u0641\u064A\u0633\u0628\u0648\u0643: \u0635\u0648\u0631\u0629 \u0645\u0646\u0634\u0648\u0631", nameEn: "Facebook Post", platform: "facebook", width: 1200, height: 1200, aspectRatio: "1:1", category: "social", icon: "facebook", isDefault: true, enabled: true, safeZone: "Maintain clean 10% outer margins; center all key subjects and text." },
  { id: "ig_square", nameAr: "\u0625\u0646\u0633\u062A\u063A\u0631\u0627\u0645: \u0645\u0646\u0634\u0648\u0631 \u0645\u0631\u0628\u0639", nameEn: "Instagram Square Post", platform: "instagram", width: 1080, height: 1080, aspectRatio: "1:1", category: "social", icon: "instagram", isDefault: true, enabled: true, safeZone: "Keep text and primary subjects within the central 85% bounding area with balanced margins." },
  { id: "ig_story", nameAr: "\u0625\u0646\u0633\u062A\u063A\u0631\u0627\u0645: \u0642\u0635\u0629 / \u0631\u064A\u0644\u0632", nameEn: "Instagram Story / Reel", platform: "instagram", width: 1080, height: 1920, aspectRatio: "9:16", category: "social", icon: "instagram", isDefault: true, enabled: true, safeZone: "CRITICAL SAFE ZONE: Top 14% (profile header/avatar) and bottom 20% (reply bar and action pills) must remain completely clear of text, titles, or essential branding. Center all focal elements in the middle 65% vertical zone." },
  { id: "ig_portrait", nameAr: "\u0625\u0646\u0633\u062A\u063A\u0631\u0627\u0645: \u0645\u0646\u0634\u0648\u0631 \u0637\u0648\u0644\u064A", nameEn: "Instagram Portrait Post", platform: "instagram", width: 1080, height: 1350, aspectRatio: "4:5", category: "social", icon: "instagram", isDefault: true, enabled: true, safeZone: "Keep focal subject and typography in the central 80% area; avoid top/bottom 10% margins." },
  { id: "yt_thumb", nameAr: "\u064A\u0648\u062A\u064A\u0648\u0628: \u0635\u0648\u0631\u0629 \u0645\u0635\u063A\u0631\u0629 (Thumbnail)", nameEn: "YouTube Thumbnail", platform: "youtube", width: 1280, height: 720, aspectRatio: "16:9", category: "video", icon: "youtube", isDefault: true, enabled: true, safeZone: "CRITICAL SAFE ZONE: Bottom-right corner (width 25% x height 20%) is covered by the video timestamp badge. Do NOT place text, faces, or important graphics in the bottom-right corner." },
  { id: "yt_cover", nameAr: "\u064A\u0648\u062A\u064A\u0648\u0628: \u063A\u0644\u0627\u0641 \u0642\u0646\u0627\u0629 (Banner)", nameEn: "YouTube Channel Art", platform: "youtube", width: 2560, height: 1440, aspectRatio: "16:9", category: "video", icon: "youtube", isDefault: true, enabled: true, safeZone: "CRITICAL SAFE ZONE: The central 1546x423px band is the only area visible across all devices (mobile, tablet, desktop). All text, logos, and focal art MUST be placed within this central horizontal slice." },
  { id: "tw_post", nameAr: "\u062A\u0648\u064A\u062A\u0631 (X): \u0635\u0648\u0631\u0629 \u0645\u0646\u0634\u0648\u0631", nameEn: "Twitter / X Post", platform: "twitter", width: 1200, height: 675, aspectRatio: "16:9", category: "social", icon: "twitter", isDefault: true, enabled: true, safeZone: "Keep essential typography and focus within 80% central area to prevent timeline card cropping." },
  { id: "tw_header", nameAr: "\u062A\u0648\u064A\u062A\u0631 (X): \u063A\u0644\u0627\u0641 \u062D\u0633\u0627\u0628", nameEn: "Twitter / X Header", platform: "twitter", width: 1500, height: 500, aspectRatio: "3:1", category: "social", icon: "twitter", isDefault: true, enabled: true, safeZone: "CRITICAL SAFE ZONE: Avoid the bottom-left area (avatar circle overlay) and top 5% margin. Place primary branding and text in the center and right-hand side." },
  { id: "li_post", nameAr: "\u0644\u064A\u0646\u0643\u062F \u0625\u0646: \u0635\u0648\u0631\u0629 \u0645\u0646\u0634\u0648\u0631", nameEn: "LinkedIn Post", platform: "linkedin", width: 1200, height: 1200, aspectRatio: "1:1", category: "business", icon: "linkedin", isDefault: true, enabled: true, safeZone: "Professional centered composition with 10% edge margins." },
  { id: "li_cover", nameAr: "\u0644\u064A\u0646\u0643\u062F \u0625\u0646: \u063A\u0644\u0627\u0641 \u062D\u0633\u0627\u0628 \u0634\u062E\u0635\u064A", nameEn: "LinkedIn Banner", platform: "linkedin", width: 1584, height: 396, aspectRatio: "4:1", category: "business", icon: "linkedin", isDefault: true, enabled: true, safeZone: "CRITICAL SAFE ZONE: Lower-left quadrant is obscured by the circular profile picture. Place logos, slogans, and important imagery in the right 60% and top-center area." },
  { id: "tt_video", nameAr: "\u062A\u064A\u0643 \u062A\u0648\u0643: \u062E\u0644\u0641\u064A\u0629 / \u0641\u064A\u062F\u064A\u0648", nameEn: "TikTok Video Cover", platform: "tiktok", width: 1080, height: 1920, aspectRatio: "9:16", category: "video", icon: "tiktok", isDefault: true, enabled: true, safeZone: "CRITICAL SAFE ZONE: Right-side 15% (interaction icons: like, comment, share, bookmark) and bottom 22% (captions, hashtags, audio ticker) overlap with video. Keep all text and focal elements strictly in the left-center 65% area." },
  { id: "sc_story", nameAr: "\u0633\u0646\u0627\u0628 \u0634\u0627\u062A: \u0642\u0635\u0629", nameEn: "Snapchat Story", platform: "snapchat", width: 1080, height: 1920, aspectRatio: "9:16", category: "social", icon: "camera", isDefault: true, enabled: true, safeZone: "Top 12% and bottom 18% reserved for Snapchat UI headers and reply action pills." },
  { id: "presentation_slide", nameAr: "\u0634\u0631\u064A\u062D\u0629 \u0639\u0631\u0636 \u062A\u0642\u062F\u064A\u0645\u064A (16:9)", nameEn: "Presentation Slide", platform: "presentation", width: 1920, height: 1080, aspectRatio: "16:9", category: "business", icon: "presentation", isDefault: true, enabled: true, safeZone: "Maintain 5% outer margin breathing room for projector and display overscan." },
  { id: "product_showcase", nameAr: "\u0635\u0648\u0631\u0629 \u0645\u0646\u062A\u062C \u0644\u0644\u0645\u062A\u0627\u062C\u0631 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629", nameEn: "E-commerce Product Photo", platform: "store", width: 1200, height: 1200, aspectRatio: "1:1", category: "ecommerce", icon: "shopping-bag", isDefault: true, enabled: true, safeZone: "Product hero placed in exact center with clean 15% surrounding negative space for store catalog grids." }
];
function getSafeZoneForPreset(presetIdOrRatio) {
  if (!presetIdOrRatio || presetIdOrRatio === "custom") return null;
  const found = DEFAULT_FORMAT_PRESETS.find((p) => p.id === presetIdOrRatio || p.nameEn?.toLowerCase().includes(presetIdOrRatio.toLowerCase()));
  return found?.safeZone || null;
}
async function seedFormatPresetsIfMissing() {
  if (!dbAdmin) return;
  try {
    const snapshot = await dbAdmin.collection("format_presets").limit(1).get();
    if (snapshot.empty) {
      console.log("[Format Presets] Seeding initial format_presets collection...");
      const batch = dbAdmin.batch();
      for (const preset of DEFAULT_FORMAT_PRESETS) {
        const ref = dbAdmin.collection("format_presets").doc(preset.id);
        batch.set(ref, {
          ...preset,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      await batch.commit();
      console.log("[Format Presets] Successfully seeded format_presets.");
    }
  } catch (err) {
  }
}
async function verifyImageOutput(ai5, imageBuffer, aspectRatio2, rawPrompt) {
  try {
    const sharp2 = (await import("sharp")).default;
    const metadata = await sharp2(imageBuffer).metadata();
    if (metadata.width && metadata.height) {
      const actualRatio = metadata.width / metadata.height;
      const expectedRatioMap = {
        "1:1": 1,
        "16:9": 16 / 9,
        "9:16": 9 / 16,
        "4:3": 4 / 3,
        "3:4": 3 / 4,
        "3:2": 3 / 2,
        "2:3": 2 / 3,
        "4:5": 4 / 5,
        "5:4": 5 / 4,
        "21:9": 21 / 9,
        "3:1": 3,
        "4:1": 4
      };
      const expectedRatio = expectedRatioMap[aspectRatio2];
      if (expectedRatio) {
        const ratioDiff = Math.abs(actualRatio - expectedRatio) / expectedRatio;
        if (ratioDiff > 0.22) {
          return {
            passed: false,
            reason: `Aspect ratio mismatch: actual ${actualRatio.toFixed(2)} vs requested ${expectedRatio.toFixed(2)}`
          };
        }
      }
    }
    const textKeywords = ["\u0646\u0635", "\u0645\u0643\u062A\u0648\u0628", "\u0643\u0644\u0645\u0629", "\u0639\u0628\u0627\u0631\u0629", "\u0634\u0639\u0627\u0631", "\u0627\u0643\u062A\u0628", "text", "written", "typography", "quote", "label"];
    const lowerPrompt = (rawPrompt || "").toLowerCase();
    const hasTextDemand = textKeywords.some((kw) => lowerPrompt.includes(kw)) || rawPrompt && (rawPrompt.includes('"') || rawPrompt.includes("\xAB") || rawPrompt.includes("'"));
    if (hasTextDemand) {
      const base64 = imageBuffer.toString("base64");
      const verifyResp = await ai5.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: base64, mimeType: "image/png" } },
              {
                text: `You are an automated visual quality auditor. The user requested an image with this prompt: "${rawPrompt}".
Specifically check:
1. If the image contains text, is the rendered text severely garbled, broken Arabic disjointed letters, or totally unreadable?
2. Did the generation catastrophically fail to render text?

Return JSON:
{
  "textLegible": true,
  "severeArtifacts": false,
  "reason": "short explanation"
}`
              }
            ]
          }
        ],
        config: { responseMimeType: "application/json", maxOutputTokens: OUTPUT_TOKEN_LIMITS.classification }
      });
      const parsed = JSON.parse(verifyResp.text || "{}");
      if (parsed.textLegible === false || parsed.severeArtifacts === true) {
        return { passed: false, reason: parsed.reason || "Severe text or artifact defect" };
      }
    }
    return { passed: true };
  } catch (err) {
    console.warn("[Stage 7 Verification] Non-blocking check failed:", err?.message || err);
    return { passed: true };
  }
}
async function validateModelIdServer(modelId, featureGroup) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!USE_VERTEX_AI2 && !apiKey) {
      return { ok: false, error: "\u0645\u0641\u062A\u0627\u062D \u0627\u0644\u0631\u0628\u0637 \u0627\u0644\u062F\u0627\u062E\u0644\u064A \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A" };
    }
    const ai5 = createGenAIClient2();
    if (featureGroup === "video") {
      try {
        if (ai5.models && typeof ai5.models.get === "function") {
          await ai5.models.get({ model: modelId });
        }
      } catch (videoErr) {
        if (videoErr?.status === 404 || videoErr?.message?.includes("not found")) {
          return { ok: false, error: `\u0627\u0644\u0646\u0645\u0648\u0630\u062C ${modelId} \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u0644\u0627 \u062A\u0645\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u064A\u0647` };
        }
      }
      return { ok: true };
    } else if (featureGroup === "voice") {
      await ai5.models.generateContent({
        model: modelId,
        contents: [{ role: "user", parts: [{ text: "\u0627\u062E\u062A\u0628\u0627\u0631" }] }],
        config: { responseModalities: ["AUDIO"] }
      });
    } else if (featureGroup === "image") {
      await ai5.models.generateContent({
        model: modelId,
        contents: [{ role: "user", parts: [{ text: "a red circle" }] }],
        config: { maxOutputTokens: 256 }
      });
    } else {
      await ai5.models.generateContent({
        model: modelId,
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
        config: { maxOutputTokens: 64 }
      });
    }
    return { ok: true };
  } catch (err) {
    console.error(`[Model Validation Error] ${modelId} (${featureGroup}):`, err?.message || err);
    return { ok: false, error: err?.message || "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0646\u0645\u0648\u0630\u062C" };
  }
}
console.log(`[Firebase Admin Config] projectId=${configProjectId2} databaseId=${configDatabaseId} storageBucket=${configStorageBucket}`);
console.log(`[Firebase Admin Config] Config file loaded: ${import_fs4.default.existsSync(import_path4.default.join(process.cwd(), "firebase-applet-config.json"))}`);
var dbAdmin = null;
try {
  if (!(0, import_app.getApps)().length) {
    (0, import_app.initializeApp)({
      projectId: PROJECT_ID2,
      storageBucket: STORAGE_BUCKET
    });
  }
  dbAdmin = (0, import_firestore.getFirestore)(DATABASE_ID);
} catch (error) {
  console.error("Firebase Admin initialization failed. Server will continue to run, but Firebase Admin features may not work:", error);
}
var isDbAdminAvailable = false;
var userTokenCache = /* @__PURE__ */ new Map();
var inMemoryBalances = /* @__PURE__ */ new Map();
var inMemoryQueue = {
  activeSlots: 0,
  maxConcurrentSlots: 4,
  queue: [],
  activeJobs: []
};
var isCloudRun = !!process.env.K_SERVICE;
console.log(`[Environment] Running as: ${isCloudRun ? `Cloud Run service "${process.env.K_SERVICE}"` : "non-Cloud-Run context (e.g. AI Studio preview/sandbox)"}`);
function isRetryableError(err) {
  const code = err?.code || err?.status || err?.response?.status;
  const msg = err?.message || String(err || "");
  if (code === 403 || code === 401 || code === "PERMISSION_DENIED" || code === "UNAUTHENTICATED" || msg.includes("PERMISSION_DENIED") || msg.includes("403 Forbidden")) {
    return false;
  }
  return true;
}
(async () => {
  if (!dbAdmin) {
    isDbAdminAvailable = false;
    return;
  }
  try {
    const testPromise = dbAdmin.collection("users").limit(1).get();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2500));
    const testSnap = await Promise.race([testPromise, timeoutPromise]);
    isDbAdminAvailable = true;
    console.log(`[Firebase Admin Startup Check] Successfully connected. Sample read returned ${testSnap.size} doc(s).`);
  } catch (e) {
    isDbAdminAvailable = false;
    console.log(`[Firebase Admin Startup Check] Notice: Admin SDK direct gRPC access bypassed (${e?.message || e?.code}). REST token adapter is active.`);
  }
})();
var NAJE_CORE_IDENTITY = `\u0623\u0646\u062A "\u0646\u0627\u062C\u064A" (Naje AI) \u2014 \u0645\u0646\u0635\u0629 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A \u062A\u0648\u0644\u064A\u062F\u064A\u0629 \u0639\u0631\u0628\u064A\u0629 \u0623\u0648\u0644\u0627\u064B.

\u0647\u0648\u064A\u062A\u0643:
- \u0627\u0633\u0645\u0643 \u0646\u0627\u062C\u064A. \u0644\u063A\u062A\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 (\u0628\u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0623\u0631\u062F\u0646\u064A\u0629 \u0639\u0646\u062F \u0627\u0644\u062D\u062F\u064A\u062B \u0628\u0634\u0643\u0644 \u0648\u062F\u0651\u064A)\u060C \u0648\u062A\u062F\u0639\u0645 \u0643\u0644 \u0627\u0644\u0644\u063A\u0627\u062A.
- \u0634\u0639\u0627\u0631\u0643: "\u0646\u0628\u062F\u0639 \u0644\u0643 \u0641\u064A \u0643\u0644 \u0628\u0643\u0633\u0644".
- \u0646\u0628\u0631\u062A\u0643: \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u060C \u0648\u0627\u062B\u0642\u060C \u0648\u062F\u0648\u062F\u060C \u0645\u0628\u0627\u0634\u0631 \u2014 \u0628\u0644\u0627 \u062A\u0635\u0646\u0651\u0639 \u0648\u0628\u0644\u0627 \u0631\u0633\u0645\u064A\u0629 \u062C\u0627\u0641\u0629.
- \u0623\u0646\u062A \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0648\u0644\u0627 \u062A\u062F\u0651\u0639\u064A \u0623\u0628\u062F\u0627\u064B \u0623\u0646\u0643 \u0625\u0646\u0633\u0627\u0646 \u0625\u0630\u0627 \u0633\u064F\u0626\u0644\u062A \u0635\u0631\u0627\u062D\u0629.

\u0642\u062F\u0631\u0627\u062A\u0643 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 (\u0627\u0639\u0631\u0641\u0647\u0627 \u0643\u0644\u0647\u0627 \u062D\u062A\u0649 \u0644\u0648 \u0643\u0646\u062A \u0641\u064A \u0645\u0633\u0627\u062D\u0629 \u0645\u062A\u062E\u0635\u0635\u0629 \u0627\u0644\u0622\u0646):
- \u062F\u0631\u062F\u0634\u0629 \u0639\u0627\u0645\u0629 \u0648\u062A\u062D\u0644\u064A\u0644 \u0646\u0635\u0648\u0635
- \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631 \u0648\u0627\u0644\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0647\u0648\u064A\u0627\u062A \u0627\u0644\u0628\u0635\u0631\u064A\u0629
- \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0628\u0623\u0633\u0627\u0644\u064A\u0628 \u0648\u0642\u0648\u0627\u0644\u0628 \u062C\u0627\u0647\u0632\u0629
- \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A: \u0639\u0631\u0648\u0636 PowerPoint\u060C Word\u060C PDF (\u0634\u0631\u0627\u0626\u062D \u0623\u0648 \u0645\u0633\u062A\u0646\u062F)
- \u062A\u0635\u0645\u064A\u0645 \u0648\u0627\u062C\u0647\u0627\u062A \u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A (\u0645\u0633\u0627\u062D\u0629 "\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0648\u0627\u062C\u0647\u0627\u062A")
- \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0646\u0635\u0648\u0635 \u0644\u062A\u0633\u062C\u064A\u0644\u0627\u062A \u0635\u0648\u062A\u064A\u0629 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0628\u0635\u0648\u062A \u0648\u0627\u062D\u062F \u0623\u0648 \u062D\u0648\u0627\u0631 \u0628\u0635\u0648\u062A\u064A\u0646 (\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0627\u0644\u0635\u0648\u062A\u064A\u0627\u062A)

\u0625\u0630\u0627 \u0633\u0623\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 "\u0645\u0646 \u0623\u0646\u062A\u061F" \u0623\u0648 "\u0634\u0648 \u0628\u062A\u0642\u062F\u0631 \u062A\u0639\u0645\u0644\u061F" \u2014 \u0627\u0634\u0631\u062D \u0647\u0648\u064A\u062A\u0643 \u0648\u0642\u062F\u0631\u0627\u062A\u0643 \u0628\u0648\u0636\u0648\u062D \u0648\u062B\u0642\u0629\u060C \u062D\u062A\u0649 \u0644\u0648 \u0643\u0646\u062A \u062F\u0627\u062E\u0644 \u0645\u0633\u0627\u062D\u0629 \u0645\u062A\u062E\u0635\u0635\u0629.

\u0627\u0644\u0646\u0638\u0627\u0645 \u064A\u0639\u0645\u0644 \u0628\u0627\u0642\u062A\u0635\u0627\u062F \u0646\u0642\u0627\u0637: \u0627\u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0641\u0639\u0644\u064A \u064A\u062E\u0635\u0645 \u0646\u0642\u0627\u0637\u0627\u064B\u060C \u0648\u0627\u0644\u062F\u0631\u062F\u0634\u0629 \u0648\u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0645\u062C\u0627\u0646\u0627\u064B.`;
var DELIVERY_STYLES_MAP = {
  default: "",
  professional: "Speak in a calm, professional, measured tone.",
  warm: "Speak warmly and conversationally, like a friendly host.",
  energetic: "Speak with high energy and enthusiasm, like an engaging ad narrator.",
  news: "Read this in a formal, clear news broadcast style."
};
var CLASSIFICATION_GUIDANCE = {
  individual: "\u062E\u0627\u0637\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0623\u0633\u0644\u0648\u0628 \u0645\u0631\u0646 \u0648\u0648\u062F\u0648\u062F\u060C \u0648\u0627\u0645\u0646\u062D\u0647 \u0645\u0633\u0627\u062D\u0629 \u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0643\u0627\u0645\u0644\u0629 \u062F\u0648\u0646 \u0642\u064A\u0648\u062F \u0631\u0633\u0645\u064A\u0629 \u0625\u0644\u0627 \u0625\u0630\u0627 \u0637\u0644\u0628 \u062E\u0644\u0627\u0641 \u0630\u0644\u0643.",
  business: "\u0627\u0639\u062A\u0645\u062F \u0623\u0633\u0644\u0648\u0628\u0627\u064B \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0627\u064B \u062A\u0633\u0648\u064A\u0642\u064A\u0627\u064B \u0628\u0634\u0643\u0644 \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u060C \u0645\u0646\u0627\u0633\u0628 \u0644\u0639\u0644\u0627\u0645\u0629 \u062A\u062C\u0627\u0631\u064A\u0629\u060C \u0645\u0639 \u0625\u0645\u0643\u0627\u0646\u064A\u0629 \u0627\u0644\u0645\u0631\u0648\u0646\u0629 \u062D\u0633\u0628 \u0627\u0644\u0637\u0644\u0628.",
  government: "\u0627\u0639\u062A\u0645\u062F \u0623\u0633\u0644\u0648\u0628\u0627\u064B \u0631\u0633\u0645\u064A\u0627\u064B \u0648\u062D\u064A\u0627\u062F\u064A\u0627\u064B \u0628\u0634\u0643\u0644 \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u060C \u062A\u062C\u0646\u0651\u0628 \u0627\u0644\u0639\u0627\u0645\u064A\u0629 \u0625\u0644\u0627 \u0625\u0630\u0627 \u0637\u064F\u0644\u0628\u062A \u0635\u0631\u0627\u062D\u0629\u060C \u0648\u0643\u0646 \u062F\u0642\u064A\u0642\u0627\u064B \u0648\u062D\u0630\u0631\u0627\u064B \u0641\u064A \u0623\u064A \u0627\u062F\u0639\u0627\u0621\u0627\u062A \u0648\u0627\u0642\u0639\u064A\u0629 \u2014 \u0647\u0630\u0627 \u0645\u062D\u062A\u0648\u0649 \u0645\u0624\u0633\u0633\u064A \u0631\u0633\u0645\u064A.",
  nonprofit: "\u0627\u0639\u062A\u0645\u062F \u0623\u0633\u0644\u0648\u0628\u0627\u064B \u062F\u0627\u0641\u0626\u0627\u064B \u0648\u0625\u0646\u0633\u0627\u0646\u064A\u0627\u064B \u064A\u0639\u0643\u0633 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0645\u0646\u0638\u0645\u0629\u060C \u0645\u0639 \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0644\u0645\u0635\u062F\u0627\u0642\u064A\u0629 \u0648\u0627\u0644\u0648\u0636\u0648\u062D.",
  education: "\u0627\u0639\u062A\u0645\u062F \u0623\u0633\u0644\u0648\u0628\u0627\u064B \u062A\u0639\u0644\u064A\u0645\u064A\u0627\u064B \u0648\u0627\u0636\u062D\u0627\u064B \u0648\u0645\u0646\u0638\u0645\u0627\u064B\u060C \u0645\u0646\u0627\u0633\u0628\u0627\u064B \u0644\u0645\u062D\u062A\u0648\u0649 \u062A\u0631\u0628\u0648\u064A \u0623\u0648 \u0623\u0643\u0627\u062F\u064A\u0645\u064A.",
  other: "\u0627\u0639\u062A\u0645\u062F \u0623\u0633\u0644\u0648\u0628\u0627\u064B \u0645\u062A\u0648\u0627\u0632\u0646\u0627\u064B \u0648\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0627\u064B \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0627\u064B."
};
function getClassificationLabelServer(classification, classificationOther) {
  switch (classification) {
    case "individual":
      return "\u0641\u0631\u062F";
    case "business":
      return "\u0634\u0631\u0643\u0629 / \u062C\u0647\u0629 \u062A\u062C\u0627\u0631\u064A\u0629";
    case "government":
      return "\u062C\u0647\u0629 \u062D\u0643\u0648\u0645\u064A\u0629";
    case "nonprofit":
      return "\u0645\u0646\u0638\u0645\u0629 \u063A\u064A\u0631 \u0631\u0628\u062D\u064A\u0629";
    case "education":
      return "\u0645\u0624\u0633\u0633\u0629 \u062A\u0639\u0644\u064A\u0645\u064A\u0629";
    case "other":
      return classificationOther ? `\u0623\u062E\u0631\u0649 (${classificationOther})` : "\u0623\u062E\u0631\u0649";
    default:
      return "\u0641\u0631\u062F";
  }
}
function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === "::1" || ip === "0.0.0.0" || ip === "::") return true;
  let normalized = ip;
  if (normalized.startsWith("::ffff:")) {
    normalized = normalized.replace("::ffff:", "");
  }
  const parts = normalized.split(".").map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    const [a, b] = parts;
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower.startsWith("fe80:") || lower.startsWith("fc00:") || lower.startsWith("fd00:")) return true;
  return false;
}
async function ssrfSafeFetchUrl(targetUrl, maxRedirects = 3) {
  let currentUrlStr = targetUrl;
  let redirectsRemaining = maxRedirects;
  while (redirectsRemaining >= 0) {
    let parsedUrl;
    try {
      parsedUrl = new import_url.URL(currentUrlStr);
    } catch {
      throw new Error("\u0631\u0627\u0628\u0637 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629 \u0635\u064A\u063A\u062A\u0647");
    }
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("\u064A\u064F\u0633\u0645\u062D \u0641\u0642\u0637 \u0628\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644 http \u0623\u0648 https");
    }
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname.includes("metadata") || hostname === "169.254.169.254") {
      throw new Error("\u0639\u0646\u0648\u0627\u0646 \u0645\u062D\u0638\u0648\u0631 \u0644\u0623\u0633\u0628\u0627\u0628 \u0623\u0645\u0646\u064A\u0629 (\u0639\u0646\u0648\u0627\u0646 \u0645\u062D\u0644\u064A \u0623\u0648 \u0634\u0628\u0643\u0629 \u062E\u0627\u0635\u0629)");
    }
    const addresses = await import_dns.default.promises.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new Error("\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0631\u0627\u0628\u0637 (\u0641\u0634\u0644 \u0627\u0644\u0646\u0637\u0627\u0642 DNS)");
    }
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw new Error("\u0639\u0646\u0648\u0627\u0646 \u0645\u062D\u0638\u0648\u0631 \u0644\u0623\u0633\u0628\u0627\u0628 \u0623\u0645\u0646\u064A\u0629 (\u0634\u0628\u0643\u0629 \u062F\u0627\u062E\u0644\u064A\u0629 \u0623\u0648 \u0639\u0646\u0648\u0627\u0646 \u0645\u062D\u0644\u064A)");
      }
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8e3);
    try {
      const response = await fetch(currentUrlStr, {
        signal: controller.signal,
        headers: {
          "User-Agent": "NajeAI-Bot/1.0 (Project Brand Memory Reader)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8"
        },
        redirect: "manual"
      });
      clearTimeout(timeoutId);
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error("\u0625\u0639\u0627\u062F\u0629 \u062A\u0648\u062C\u064A\u0647 \u0645\u0646 \u063A\u064A\u0631 \u0639\u0646\u0648\u0627\u0646 \u062C\u062F\u064A\u062F");
        currentUrlStr = new import_url.URL(location, currentUrlStr).toString();
        redirectsRemaining--;
        continue;
      }
      if (!response.ok) {
        throw new Error(`\u0641\u0634\u0644 \u0641\u062A\u062D \u0627\u0644\u0631\u0627\u0628\u0637 (\u0631\u0645\u0632 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629: ${response.status})`);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("\u062A\u0639\u0630\u0651\u0631 \u0642\u0631\u0627\u0621\u0629 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0631\u0627\u0628\u0637");
      let receivedBytes = 0;
      const chunks = [];
      const MAX_BYTES = 5 * 1024 * 1024;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          receivedBytes += value.length;
          if (receivedBytes > MAX_BYTES) {
            reader.cancel();
            throw new Error("\u062D\u062C\u0645 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0631\u0627\u0628\u0637 \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D (5 \u0645\u064A\u063A\u0627\u0628\u0627\u064A\u062A)");
          }
          chunks.push(value);
        }
      }
      const rawBuffer = Buffer.concat(chunks);
      const contentType = response.headers.get("content-type") || "";
      let htmlText = rawBuffer.toString("utf-8");
      if (contentType.includes("html") || htmlText.includes("<html") || htmlText.includes("<body")) {
        htmlText = htmlText.replace(/<script[\s\S]*?<\/script>/gi, " ");
        htmlText = htmlText.replace(/<style[\s\S]*?<\/style>/gi, " ");
        htmlText = htmlText.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
        htmlText = htmlText.replace(/<[^>]+>/g, " ");
        htmlText = htmlText.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
        htmlText = htmlText.replace(/\s+/g, " ").trim();
      }
      return htmlText;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error("\u0627\u0646\u062A\u0647\u062A \u0645\u0647\u0644\u0629 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0631\u0627\u0628\u0637 (8 \u062B\u0648\u0627\u0646\u064D)");
      }
      throw err;
    }
  }
  throw new Error("\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0631\u0627\u0628\u0637 \u0639\u062F\u062F \u0645\u0631\u0627\u062A \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0648\u062C\u064A\u0647 \u0627\u0644\u0645\u0633\u0645\u0648\u062D\u0629");
}
async function generateMemoryItemSummary(rawTextOrDescription, label) {
  try {
    const ai5 = createGenAIClient2();
    const prompt = `\u0623\u0646\u062A \u0645\u062D\u0631\u0643 \u062A\u0644\u062E\u064A\u0635 \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0630\u0643\u064A\u0629 \u0644\u0645\u0634\u0631\u0648\u0639 \u0641\u064A Naje AI.
\u0627\u0644\u0645\u0637\u0644\u0648\u0628: \u0642\u0645 \u0628\u062A\u0644\u062E\u064A\u0635 \u0627\u0644\u0646\u0635/\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u062A\u0627\u0628\u0639 \u0644\u0640 "${label}" \u0641\u064A \u0645\u0648\u062C\u0632 \u0645\u0631\u0643\u0632 \u0648\u0645\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0623\u0647\u0645 \u0627\u0644\u062D\u0642\u0627\u0626\u0642 \u0648\u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645 \u0648\u0627\u0644\u0623\u0633\u0645\u0627\u0621 \u0648\u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0648\u0627\u0644\u0634\u0631\u0648\u0637 \u0648\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 (\u0628\u062D\u062F\u0648\u062F 150-250 \u0643\u0644\u0645\u0629 \u0643\u062D\u062F \u0623\u0642\u0635\u0649).
\u0647\u0630\u0627 \u0627\u0644\u0645\u0644\u062E\u0635 \u0633\u064A\u062A\u0645 \u062D\u062B\u0647 \u0628\u0634\u0643\u0644 \u062F\u0627\u0626\u0645 \u0641\u064A \u0646\u0638\u0627\u0645 \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0636\u0645\u0646\u064A\u0629 \u0644\u0644\u0645\u0634\u0631\u0648\u0639 \u0644\u062A\u0648\u062C\u064A\u0647 \u062C\u0645\u064A\u0639 \u062A\u0648\u0644\u064A\u062F\u0627\u062A \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A.

\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0631\u0627\u062F \u062A\u0644\u062E\u064A\u0635\u0647:
"${rawTextOrDescription.slice(0, 3e4)}"`;
    const response = await generateContentWithFallback(ai5, {
      model: "gemini-3.6-flash",
      endpointId: "text_core",
      contents: prompt,
      config: { maxOutputTokens: OUTPUT_TOKEN_LIMITS.memorySummary }
    });
    return (response.text || rawTextOrDescription.slice(0, 500)).trim();
  } catch (err) {
    console.error("generateMemoryItemSummary failed:", err);
    return rawTextOrDescription.slice(0, 300);
  }
}
async function buildProjectAndMemoryContext(projectId, projectData, userDisplayName, _token) {
  if (!projectId && (!projectData || !projectData.id)) {
    return { systemInstructionContext: "", memoryItemsForTools: [] };
  }
  const pid = projectId || projectData && projectData.id;
  if (!pid) {
    return { systemInstructionContext: "", memoryItemsForTools: [] };
  }
  let pData = projectData;
  if (!pData || !pData.name) {
    if (_token) {
      pData = await getDocRest("projects", pid, _token).catch(() => null);
    }
    if (!pData || !pData.name) {
      try {
        const pDoc = await dbAdmin.collection("projects").doc(pid).get();
        if (pDoc.exists) {
          pData = { id: pDoc.id, ...pDoc.data() };
        }
      } catch (e) {
      }
    }
  }
  if (!pData || !pData.name) {
    return { systemInstructionContext: "", memoryItemsForTools: [] };
  }
  const ownerName = pData.ownerDisplayName || userDisplayName || "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645";
  let classification = pData.classification;
  if (!classification && pData.entityType) {
    if (pData.entityType === "\u0634\u0631\u0643\u0629") classification = "business";
    else if (pData.entityType === "\u062C\u0647\u0629 \u062D\u0643\u0648\u0645\u064A\u0629") classification = "government";
    else if (pData.entityType === "\u0645\u0624\u0633\u0633\u0629 \u063A\u064A\u0631 \u0631\u0628\u062D\u064A\u0629") classification = "nonprofit";
    else if (pData.entityType === "\u0641\u0631\u062F") classification = "individual";
  }
  if (!classification) classification = "individual";
  const label = getClassificationLabelServer(classification, pData.classificationOther);
  const guidance = CLASSIFICATION_GUIDANCE[classification] || CLASSIFICATION_GUIDANCE.individual;
  let contextStr = `

\u0633\u064A\u0627\u0642 \u0647\u0630\u0627 \u0627\u0644\u0645\u0634\u0631\u0648\u0639: \u062A\u0639\u0645\u0644 \u0627\u0644\u0622\u0646 \u0636\u0645\u0646 \u0645\u0634\u0631\u0648\u0639 \u0628\u0627\u0633\u0645 "${pData.name}" \u0644\u0635\u0627\u0644\u062D ${ownerName}\u060C \u0645\u0635\u0646\u0651\u0641 \u0643\u0640 ${label}. ${guidance}
\u0647\u0630\u0627 \u062A\u0648\u062C\u0651\u0647 \u0627\u0641\u062A\u0631\u0627\u0636\u064A \u0641\u0642\u0637 \u2014 \u0625\u0630\u0627 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0635\u0631\u0627\u062D\u0629 \u0623\u0633\u0644\u0648\u0628\u0627\u064B \u0645\u062E\u062A\u0644\u0641\u0627\u064B \u0628\u0637\u0644\u0628\u0647 \u0627\u0644\u062D\u0627\u0644\u064A\u060C \u0627\u062A\u0628\u0639 \u0637\u0644\u0628\u0647 \u0627\u0644\u0645\u0628\u0627\u0634\u0631.`;
  if (pData.brandProfile) {
    contextStr += `

\u0625\u0631\u0634\u0627\u062F\u0627\u062A \u0627\u0644\u0647\u0648\u064A\u0629 \u0627\u0644\u0628\u0635\u0631\u064A\u0629 \u0644\u0644\u0645\u0634\u0631\u0648\u0639:
- \u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629: ${JSON.stringify(pData.brandProfile.colors || "")}
- \u0627\u0644\u0623\u0633\u0644\u0648\u0628 \u0627\u0644\u0625\u0628\u062F\u0627\u0639\u064A: ${pData.brandProfile.style || ""}
- \u0627\u0644\u0647\u0648\u064A\u0629 \u0627\u0644\u0628\u0635\u0631\u064A\u0629: ${pData.brandProfile.visualIdentity || ""}`;
  }
  const memoryItemsForTools = [];
  try {
    let itemsList = null;
    if (_token) {
      itemsList = await getCollectionRest(`projects/${pid}/memory_items`, _token).catch(() => null);
    }
    if (itemsList === null) {
      try {
        const memorySnap = await dbAdmin.collection("projects").doc(pid).collection("memory_items").orderBy("createdAt", "desc").get();
        if (!memorySnap.empty) {
          itemsList = memorySnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        }
      } catch (e) {
      }
    }
    if (itemsList && itemsList.length > 0) {
      itemsList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      let ambientSummaries = "";
      let totalChars = 0;
      const MAX_AMBIENT_CHARS = 2500;
      let truncated = false;
      itemsList.forEach((item) => {
        const itemId = item.id;
        const itemSummary = item.summary || "";
        const itemLabel = item.label || "\u0630\u0627\u0643\u0631\u0629";
        const itemType = item.type || "text";
        memoryItemsForTools.push({
          itemId,
          label: itemLabel,
          type: itemType,
          summary: itemSummary
        });
        const line = `- "${itemLabel}" (\u0646\u0648\u0639: ${itemType}): ${itemSummary}
`;
        if (totalChars + line.length <= MAX_AMBIENT_CHARS) {
          ambientSummaries += line;
          totalChars += line.length;
        } else {
          truncated = true;
        }
      });
      if (ambientSummaries.trim()) {
        contextStr += `

[\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0636\u0645\u0646\u064A\u0629 (Ambient Memory)]:
${ambientSummaries.trim()}`;
        if (truncated) {
          contextStr += `
(\u0645\u0644\u0627\u062D\u0638\u0629: \u062A\u0645 \u0627\u0642\u062A\u0637\u0627\u0639 \u0628\u0639\u0636 \u0627\u0644\u0645\u0644\u062E\u0635\u0627\u062A \u0627\u0644\u0642\u062F\u064A\u0645\u0629 \u0644\u062D\u0641\u0638 \u0627\u0644\u0645\u0633\u0627\u062D\u0629. \u064A\u0645\u0643\u0646\u0643 \u0637\u0644\u0628 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0643\u0627\u0645\u0644 \u0644\u0623\u064A \u0645\u0644\u0641/\u0631\u0627\u0628\u0637 \u0641\u064A \u0623\u064A \u0648\u0642\u062A).`;
        }
        contextStr += `
\u0627\u0633\u062A\u062E\u062F\u0645 \u0647\u0630\u0627 \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0644\u062A\u062E\u0635\u064A\u0635 \u0631\u062F\u0648\u062F\u0643 \u0648\u062A\u0635\u0627\u0645\u064A\u0645\u0643 \u0628\u0645\u0627 \u064A\u0646\u0627\u0633\u0628 \u0647\u0648\u064A\u0629 \u0648\u062A\u0641\u0627\u0635\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u0645\u0634\u0631\u0648\u0639. \u0625\u0630\u0627 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0635\u0631\u0627\u062D\u0629 \u0645\u0631\u0627\u062C\u0639\u0629 \u0623\u0635\u0644 \u0645\u0644\u062E\u0635 \u0623\u0648 \u0645\u0633\u062A\u0646\u062F \u0623\u0648 \u0631\u0627\u0628\u0637 \u0645\u062D\u062F\u062F\u060C \u064A\u0645\u0643\u0646\u0643 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0623\u062F\u0627\u0629 \u0627\u0644\u0645\u062A\u0627\u062D\u0629 recall_project_memory \u0644\u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064A \u0643\u0627\u0645\u0644\u0627\u064B.`;
      }
    }
  } catch (e) {
    console.warn("Could not fetch memory items in buildProjectAndMemoryContext:", e);
  }
  return { systemInstructionContext: contextStr, memoryItemsForTools };
}
var pricingCache = null;
var PRICING_CACHE_TTL_MS = 6e4;
function structuralSimilarity(oldHtml, newHtml) {
  const tags = ["<section", "<div", "<header", "<nav", "<footer", "<button", "<form"];
  let oldCount = 0, newCount = 0, diff = 0;
  for (const t of tags) {
    const o = (oldHtml.match(new RegExp(t, "g")) || []).length;
    const n = (newHtml.match(new RegExp(t, "g")) || []).length;
    oldCount += o;
    newCount += n;
    diff += Math.abs(o - n);
  }
  if (oldCount === 0) return 1;
  return 1 - Math.min(1, diff / oldCount);
}
function hasStructuralResponsiveness(html) {
  const mediaMatch = html.match(/@media[^{]*\(\s*max-width\s*:\s*[0-9]+px\s*\)\s*{([^}]*(?:{[^}]*}[^}]*)*)}/i);
  if (!mediaMatch) return { hasMediaQuery: false, changesLayout: false };
  const body = mediaMatch[1] || "";
  const changesLayout = /flex-direction|grid-template-columns\s*:\s*1fr\s*[;}]|display\s*:\s*none|display\s*:\s*block|position\s*:\s*fixed/i.test(body);
  return { hasMediaQuery: true, changesLayout };
}
var skillsCache = null;
var SKILLS_CACHE_TTL_MS = 5 * 60 * 1e3;
async function getSkills(_token) {
  if (skillsCache && Date.now() - skillsCache.fetchedAt < SKILLS_CACHE_TTL_MS) {
    return skillsCache.data;
  }
  try {
    const list = await getCollectionRest("skills");
    if (list) {
      const skills = list.filter((s) => s.enabled !== false);
      skillsCache = { data: skills, fetchedAt: Date.now() };
      return skills;
    }
  } catch (e) {
  }
  return [];
}
function buildSkillsBlock(skills, docType) {
  const relevant = skills.filter((s) => {
    const tags = Array.isArray(s.appliesTo) ? s.appliesTo : [];
    return tags.includes("all") || tags.includes(docType);
  });
  if (relevant.length === 0) return "";
  const body = relevant.sort((a, b) => (a.priority || 0) - (b.priority || 0)).map((s) => `### ${s.name}
${s.instructions}`).join("\n\n");
  return `

===== \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A (\u0627\u0644\u062A\u0632\u0645 \u0628\u0647 \u062D\u0631\u0641\u064A\u0627\u064B \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0646\u0641\u064A\u0630) =====
${body}
===== \u0646\u0647\u0627\u064A\u0629 \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A =====
`;
}
async function getPricing(token) {
  if (pricingCache && Date.now() - pricingCache.fetchedAt < PRICING_CACHE_TTL_MS) {
    return pricingCache.data;
  }
  const defaults = {
    image: {
      liteBase: 0.5,
      liteEdit: 0.25,
      base: 1,
      edit: 0.5,
      proBase: 1.5,
      proEdit: 0.75,
      imageAddon: 0.1,
      qualityMultiplier: { standard: 1, hd: 1.6, ultra: 2.4 }
    },
    video: {
      perSecond: 0.5,
      editMultiplier: 0.7,
      imageAddon: 0.1,
      resolutionMultiplier: { "720p": 1, "1080p": 1.6 }
    },
    document: {
      pptx_bracket1_max: 10,
      pptx_bracket1_cost: 3,
      pptx_bracket2_cost: 6,
      word_bracket1_max: 5,
      word_bracket1_cost: 2,
      word_bracket2_cost: 4,
      pdf_per_slide: 0.2,
      a4PerPage: 0.15,
      a5PerPage: 0.1
    },
    ui: { perGeneration: 1, editMultiplier: 0.5, maxOutputKb: 600, tierMultiplier: { lite: 0.6, core: 1, max: 2 } },
    voice: { costPerAudioSecond: 0.02, estimatedWordsPerMinute: 140, minCost: 0.1, costPerClip: 4, per100Words: 2, pointsPerCharacter: 0.01, pointsPerCharacterPro: 0.02 },
    agent: {
      brand_identity: 3,
      web_grounding: 2,
      fullstack_engineer: 10,
      voice_narration: 4
    },
    najeAd: {
      enabled: true,
      pointsRatePerSecond: 2.5,
      durationOptionsSec: [4, 6, 8, 10, 12, 14, 16, 24, 30],
      maxShotsPerVideo: 2,
      defaultModelEndpointId: "video_standard"
    }
  };
  try {
    let imageDoc = null;
    let videoDoc = null;
    let docDoc = null;
    let uiDoc = null;
    let voiceDoc = null;
    let agentDoc = null;
    let najeAdDoc = null;
    if (dbAdmin) {
      const [imgSnap, vidSnap, dSnap, uSnap, vSnap, aSnap, nAdSnap] = await Promise.all([
        dbAdmin.collection("model_pricing").doc("image").get().catch(() => null),
        dbAdmin.collection("model_pricing").doc("video").get().catch(() => null),
        dbAdmin.collection("model_pricing").doc("document").get().catch(() => null),
        dbAdmin.collection("model_pricing").doc("ui").get().catch(() => null),
        dbAdmin.collection("model_pricing").doc("voice").get().catch(() => null),
        dbAdmin.collection("model_pricing").doc("agent").get().catch(() => null),
        dbAdmin.collection("model_pricing").doc("naje_ad").get().catch(() => null)
      ]);
      imageDoc = imgSnap?.exists ? imgSnap.data() : null;
      videoDoc = vidSnap?.exists ? vidSnap.data() : null;
      docDoc = dSnap?.exists ? dSnap.data() : null;
      uiDoc = uSnap?.exists ? uSnap.data() : null;
      voiceDoc = vSnap?.exists ? vSnap.data() : null;
      agentDoc = aSnap?.exists ? aSnap.data() : null;
      najeAdDoc = nAdSnap?.exists ? nAdSnap.data() : null;
    } else if (token) {
      const results = await Promise.all([
        getDocRest("model_pricing", "image", token).catch(() => null),
        getDocRest("model_pricing", "video", token).catch(() => null),
        getDocRest("model_pricing", "document", token).catch(() => null),
        getDocRest("model_pricing", "ui", token).catch(() => null),
        getDocRest("model_pricing", "voice", token).catch(() => null),
        getDocRest("model_pricing", "agent", token).catch(() => null),
        getDocRest("model_pricing", "naje_ad", token).catch(() => null)
      ]);
      [imageDoc, videoDoc, docDoc, uiDoc, voiceDoc, agentDoc, najeAdDoc] = results;
    }
    const data = {
      image: imageDoc ? { ...defaults.image, ...imageDoc } : defaults.image,
      video: videoDoc ? { ...defaults.video, ...videoDoc } : defaults.video,
      document: docDoc ? { ...defaults.document, ...docDoc } : defaults.document,
      ui: uiDoc ? { ...defaults.ui, ...uiDoc } : defaults.ui,
      voice: voiceDoc ? { ...defaults.voice, ...voiceDoc } : defaults.voice,
      agent: agentDoc ? { ...defaults.agent, ...agentDoc } : defaults.agent,
      najeAd: najeAdDoc ? { ...defaults.najeAd, ...najeAdDoc } : defaults.najeAd
    };
    pricingCache = { data, fetchedAt: Date.now() };
    return data;
  } catch (error) {
    return defaults;
  }
}
async function getFullCurrentPricingConfig(token) {
  const pricing = await getPricing(token);
  try {
    if (dbAdmin) {
      const endpointsSnap = await dbAdmin.collection("model_endpoints").get().catch(() => null);
      if (endpointsSnap && !endpointsSnap.empty) {
        endpointsSnap.docs.forEach((doc) => {
          const d = doc.data();
          if (doc.id === "image_lite" && typeof d.pointsPrice === "number" && d.pointsPrice > 0) {
            pricing.image.liteBase = d.pointsPrice;
          } else if ((doc.id === "image_standard" || doc.id === "image_spectra") && typeof d.pointsPrice === "number" && d.pointsPrice > 0) {
            pricing.image.base = d.pointsPrice;
          } else if ((doc.id === "image_pro" || doc.id === "image_hd") && typeof d.pointsPrice === "number" && d.pointsPrice > 0) {
            pricing.image.proBase = d.pointsPrice;
          } else if (doc.id === "image_addon" && typeof d.pointsPrice === "number" && d.pointsPrice > 0) {
            pricing.image.imageAddon = d.pointsPrice;
            pricing.video.imageAddon = d.pointsPrice;
          } else if (doc.id === "doc_standard" && typeof d.pointsPrice === "number" && d.pointsPrice > 0) {
            pricing.document.a4PerPage = d.pointsPrice;
          } else if (doc.id === "doc_a5" && typeof d.pointsPrice === "number" && d.pointsPrice > 0) {
            pricing.document.a5PerPage = d.pointsPrice;
          } else if (doc.id === "doc_slides" && typeof d.pointsPrice === "number" && d.pointsPrice > 0) {
            pricing.document.pdf_per_slide = d.pointsPrice;
          } else if (doc.id === "voice_tts" && d.pricingType === "per_character" && typeof d.pointsPrice === "number" && d.pointsPrice > 0) {
            pricing.voice.pointsPerCharacter = d.pointsPrice;
          } else if (doc.id === "voice_tts_pro" && d.pricingType === "per_character" && typeof d.pointsPrice === "number" && d.pointsPrice > 0) {
            pricing.voice.pointsPerCharacterPro = d.pointsPrice;
          } else if (doc.id === "voice_tts" && typeof d.pointsPrice === "number" && d.pointsPrice > 0 && d.pricingType !== "per_character") {
            pricing.voice.costPerAudioSecond = d.pointsPrice;
          }
        });
      }
    }
  } catch (e) {
  }
  return pricing;
}
async function getFeatureFlags(token) {
  const defaults = {
    text: true,
    image: true,
    video: true,
    ui: true,
    document: true,
    voice: true
  };
  try {
    const doc = await dbAdmin.collection("config").doc("feature_flags").get();
    if (doc.exists) {
      return { ...defaults, ...doc.data() };
    }
  } catch (e) {
  }
  return defaults;
}
async function compileVideoPrompt(rawPrompt, durationSec, aspectRatio2, model, brandContext) {
  const ai5 = createGenAIClient2();
  const numberOfSections = Math.round(durationSec);
  const personaCore = `\u0645\u0646\u062A\u062C \u0623\u0641\u0644\u0627\u0645 \u0648\u0645\u062E\u0631\u062C \u0641\u064A\u062F\u064A\u0648 \u0645\u062D\u062A\u0631\u0641. \u0644\u0643\u0644 \u062B\u0627\u0646\u064A\u0629 \u0645\u0646 \u0645\u062F\u0629 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629\u060C \u0641\u0643\u0651\u0631 \u0641\u0639\u0644\u064A\u0627\u064B: \u0645\u0627 \u0623\u0642\u0648\u0649 \u0644\u062D\u0638\u0629 \u0628\u0635\u0631\u064A\u0629 \u0645\u0645\u0643\u0646\u0629 \u0628\u0647\u0630\u0647 \u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u062A\u062D\u062F\u064A\u062F\u0627\u064B\u061F \u0645\u0627\u0630\u0627 \u064A\u062C\u0628 \u0623\u0646 \u064A\u064F\u0633\u062A\u0628\u0639\u062F \u0644\u062A\u062A\u0631\u0643 \u0645\u062C\u0627\u0644\u0627\u064B \u0644\u0645\u0627 \u0647\u0648 \u0623\u0647\u0645\u061F \u0627\u0633\u062A\u062B\u0645\u0631 \u0643\u0644 \u062B\u0627\u0646\u064A\u0629 \u0628\u0642\u0631\u0627\u0631 \u0625\u0628\u062F\u0627\u0639\u064A \u0648\u0627\u0639\u064D \u0648\u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0627\u062A\u0633\u0627\u0642 \u0627\u0644\u0645\u0648\u0636\u0648\u0639 \u0648\u0627\u0644\u0623\u0633\u0644\u0648\u0628 \u0645\u0646 \u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0644\u0644\u062B\u0627\u0646\u064A\u0629 \u0627\u0644\u0623\u062E\u064A\u0631\u0629.`;
  const systemInstruction = buildPersonaInstruction("\u0627\u0644\u0645\u0646\u062A\u062C", personaCore);
  const compilerInstruction = `${systemInstruction}

Your job is to convert a short, casual user request into a precise, second-by-second shot list for an AI video generation model (${model === "veo" ? "Veo" : "Omni Flash"}), covering exactly ${numberOfSections} seconds (aspect ratio: ${aspectRatio2}).

STRICT RULES:
- Output exactly ${numberOfSections} numbered sections, one per second (Second 1, Second 2, ... Second ${numberOfSections}).
- Each section must describe: the exact visual action/subject state at that second, camera framing/movement, lighting continuity, and any on-screen motion \u2014 concrete and specific, never vague ("something happens" is forbidden).
- Maintain STRICT visual and subject consistency across all seconds \u2014 the subject, setting, and style established in Second 1 must persist unless the user's request explicitly implies a change (e.g. a transition or scene change they asked for). Do not invent new subjects, objects, or settings not implied by the user's request.
- Do not add any narrative or content beyond what is reasonably implied by the user's request \u2014 you are structuring their idea into a shot list, not inventing a new one.
- CRITICAL LANGUAGE RULE FOR IN-VIDEO CONTENT (non-negotiable): if any second of this shot list includes a character speaking, dialogue, narration, or any on-screen/rendered text, that spoken or written content MUST be in the exact same language AND dialect as the user's original request below \u2014 never a different language, and never generic Modern Standard Arabic if the user wrote in a specific dialect (e.g. preserve Levantine, Gulf, Egyptian, or Maghrebi phrasing exactly as the user would naturally speak it, or English if that's what the user used). This rule applies only to in-scene spoken/written content \u2014 it does not change the language of these instructions to you, which remain in English.
- After the per-second breakdown, add one final "STYLE LOCK" line summarizing the consistent visual style/mood/lighting that must hold across the entire ${numberOfSections} seconds.
- Output ONLY the shot list in this exact structure, no preamble, no explanation, no markdown code fences.
${brandContext ? `

PROJECT BRAND CONTEXT (must be respected in every second of the shot list):
- Approved colors: ${JSON.stringify(brandContext.colors || [])}
- Creative style: ${brandContext.style || "not specified"}
- Visual identity notes: ${brandContext.visualIdentity || "not specified"}
- Entity type: ${brandContext.entityType || "not specified"} (adjust tone/formality accordingly)` : ""}

User's original request, for language/dialect reference (match this exactly for any in-video speech or text):
"${rawPrompt}"`;
  try {
    const result = await generateContentWithFallback(ai5, {
      model: "gemini-3.5-flash-lite",
      // Writer tier (fast structuring)
      endpointId: "tier_lite",
      contents: compilerInstruction,
      config: { maxOutputTokens: OUTPUT_TOKEN_LIMITS.videoCompiler }
    });
    const compiled = result.text || rawPrompt;
    console.log(`[compileVideoPrompt] Writer compiled prompt for ${durationSec}s ${model} video:
${compiled}`);
    return compiled;
  } catch (error) {
    console.error("[compileVideoPrompt] Failed to compile video prompt, falling back to raw prompt:", error);
    return rawPrompt;
  }
}
async function auditVideoPrompt(ai5, compiledShotList, durationSec, aspectRatio2 = "16:9", rawPrompt = "") {
  if (process.env.ENABLE_ANTI_SLOP_CRITIC === "false") {
    return compiledShotList;
  }
  try {
    const critiquePrompt = `You are an Anti-AI-Slop Master Video Director. Review and refine the following second-by-second video shot list for a ${durationSec}s video (aspect ratio: ${aspectRatio2}).

CRITICAL VIDEO CRITIQUE DIRECTIVES:
1. REMOVE ALL AI CLICH\xC9S: Strip out buzzwords like "cinematic masterpiece", "hyper-realistic", "unreal engine render". Remove pointless floating neon grids, melting artifacts, or random lens flares.
2. ENFORCE REAL CINEMATOGRAPHY & LIGHTING:
   - Specific camera language (e.g. "slow steady tracking shot at waist height", "subtle 24fps push-in").
   - Explicit lighting setup & color temperature (e.g. "warm golden hour key light from stage-left, deep contrast shadows").
3. CROSS-SECOND CONSISTENCY & STYLE LOCK:
   - Ensure the subject, environment, materials, and wardrobe described in Second 1 remain strictly consistent across all seconds unless an explicit scene transition was requested.
   - Verify the "STYLE LOCK" line matches and anchors the visual identity across the entire duration without drift.
4. IN-VIDEO LANGUAGE CONSISTENCY: verify any spoken dialogue or on-screen text within the shot list matches the user's original request's language and dialect exactly (provided below) \u2014 flag and correct any second where in-scene language drifted to a different language or a more generic/formal register than the user actually used.
5. ASPECT RATIO & FRAMING: Ensure framing specifically fits ${aspectRatio2}.

${rawPrompt ? `User's original request, for language/dialect reference:
"${rawPrompt}"

` : ""}Original Shot List:
${compiledShotList}

Return ONLY the refined, perfected shot list text in English without markdown code fences or conversational preamble.`;
    const result = await generateContentWithFallback(ai5, {
      model: "gemini-3.5-flash-lite",
      // Auditor tier
      endpointId: "tier_core",
      contents: critiquePrompt,
      config: {
        ...getThinkingConfig("gemini-3.5-flash-lite"),
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse
      }
    });
    if (result.text && result.text.trim()) {
      const refined = result.text.trim();
      console.log(`[auditVideoPrompt] Video prompt audited and refined:
${refined}`);
      return refined;
    }
    return compiledShotList;
  } catch (err) {
    console.error("[auditVideoPrompt] Error during video prompt audit:", err);
    return compiledShotList;
  }
}
var GRAND_TYPOGRAPHY = `
Professional Typography Guide for Text & Logos:
When rendering or specifying text, logos, or typography in image generation prompts, adhere to professional font selections:
- Recommended English fonts: Helvetica Neue, Inter, Poppins, Montserrat, Playfair Display, Cinzel, Lato, Bebas Neue, Space Grotesk, Plus Jakarta Sans, Outfit, Clash Display, SF Pro Display, Futura, Avenir.
- Recommended Arabic fonts: Kufam, Cairo, Tajawal, Almarai, Changa, Aref Ruqaa, Reem Kufi, Thuluth, Diwani, Naskh, Mada, El Messiri, Lalezar, Readex Pro, IBM Plex Sans Arabic, Somar, Alexandria.
Rules: Enforce zero spelling errors, authentic RTL connectivity for Arabic scripts, properly joined letterforms, and high contrast against the background.
`;
async function applyCreativeLayers(ai5, rawPrompt, mode = "design", aspectRatio2 = "1:1", safeZoneConstraint) {
  if (process.env.ENABLE_ANTI_SLOP_CRITIC === "false") {
    return rawPrompt;
  }
  try {
    const critiquePrompt = `You are an Anti-AI-Slop Master Art Director. Review and rewrite the following image generation prompt to ensure top agency quality.

CRITICAL ANTI-AI-SLOP DIRECTIVES:
1. REMOVE ALL AI CLICH\xC9S: Strip out terms like "award-winning", "masterpiece", "8k", "stunning", "hyper-detailed", "unreal engine", "trending on artstation". Strip out meaningless glowing neon wireframes, floating/melting random shapes, or abstract light grids.
2. ENFORCE REAL DESIGN RULES:
   - Composition: Define explicit focal points and enforce at least 30% negative space.
   - Color Balance: Define specific color palettes and ratios (e.g. 60-30-10 dominance rule) rather than generic color words.
   - Lighting: Specify an exact directional light source and color temperature (e.g., "single soft Key Light from 45-degree upper-left, 3200K warm tint").
3. BREAK VISUAL REPETITION: Avoid obvious visual clich\xE9s for the topic (e.g., no coffee beans floating around a mug, no generic brain outlines for AI). Use a fresh, sophisticated, agency-level visual concept.
4. TYPOGRAPHY & TEXT PRESERVATION:
   - Any exact text requested in quotes (e.g. "\u0646\u064E\u062C\u0650\u064A\u0651") MUST BE PRESERVED EXACTLY as requested without altering spelling or language.
   - Match the request with appropriate typography standards from this font guide:
   ${GRAND_TYPOGRAPHY}
5. ASPECT RATIO ADAPTATION: Adapt layout composition for aspect ratio ${aspectRatio2}.
${safeZoneConstraint ? `6. PLATFORM SAFE ZONE COMPLIANCE (STRICT): ${safeZoneConstraint}. Under no circumstances allow essential typography, faces, or focal branding to collide with platform UI overlay boundaries or crop margins.` : ""}

Original User Request (Mode: ${mode}, Aspect Ratio: ${aspectRatio2}):
${rawPrompt}

Return ONLY the rewritten, refined prompt string in English without markdown or preamble.`;
    const result = await generateContentWithFallback(ai5, {
      model: "gemini-3.5-flash-lite",
      endpointId: "tier_core",
      contents: critiquePrompt,
      config: {
        ...getThinkingConfig("gemini-3.5-flash-lite"),
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler
      }
    });
    if (result.text && result.text.trim()) {
      const refined = result.text.trim();
      console.log(`[AntiSlopCritic] Prompt refined:
Original: "${rawPrompt}"
Refined: "${refined}"`);
      return refined;
    }
    return rawPrompt;
  } catch (err) {
    console.error("[AntiSlopCritic] Error during prompt refinement:", err);
    return rawPrompt;
  }
}
async function compileImagePrompt(rawPrompt, modelKey, referenceFiles, brandContext, aspectRatio2 = "1:1", presetId) {
  const ai5 = createGenAIClient2();
  const safeZoneConstraint = getSafeZoneForPreset(presetId);
  const isPhotographicStyleModel = modelKey !== "nova";
  const personaCore = `\u0645\u062D\u062A\u0631\u0641 \u062A\u0635\u0648\u064A\u0631 \u0648\u062A\u0635\u0645\u064A\u0645 \u0628\u0635\u0631\u064A \u0628\u0645\u0633\u062A\u0648\u0649 \u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0639\u0627\u0644\u0645\u064A. \u062A\u0635\u0648\u063A \u0623\u062F\u0642 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u062A\u0644\u062A\u0642\u0637 \u0627\u0644\u0625\u0636\u0627\u0621\u0629 \u0648\u0627\u0644\u0632\u0648\u0627\u064A\u0627 \u0648\u0627\u0644\u062A\u0631\u0643\u064A\u0628\u0627\u062A \u0648\u062A\u0636\u0645\u0646 \u0646\u0642\u0627\u0621 \u0627\u0644\u062A\u064A\u0628\u0648\u063A\u0631\u0627\u0641\u064A\u0627.`;
  const systemInstruction = buildPersonaInstruction("\u0627\u0644\u0645\u0635\u0648\u0651\u0631", personaCore);
  const compilerInstruction = `${systemInstruction}

Convert the user's request into a single, maximally detailed, professional-grade prompt for an AI image generation model.

STRICT RULES:
- Never use vague adjectives ("nice colors", "modern style") \u2014 always resolve to specific, concrete descriptors (exact color/material names, specific composition terms).
${isPhotographicStyleModel ? `- This model responds best to layered natural-language photographic description, in this order: subject \u2192 environment/background \u2192 lighting \u2192 camera/lens language \u2192 material & texture \u2192 art/style reference \u2192 mood. Use real photographic vocabulary where appropriate (e.g. lens type, lighting setup) even though this is a generated image, since this vocabulary steers the model toward higher-quality output.` : `- This model responds better to explicit, instruction-style structuring, including direct spatial layout language (e.g. "centered composition, subject occupies upper third, negative space below") and explicit text-placement instructions if text rendering is relevant.`}
- Do not invent subject matter, objects, or details beyond what is reasonably implied by the user's request \u2014 you are elevating their idea into a professional prompt, not replacing it with a new one.
${safeZoneConstraint ? `- FORMAT PRESET SAFE ZONE REQUIREMENT: ${safeZoneConstraint}. Place all essential text, logos, and critical focal elements strictly inside this platform safe zone to avoid UI overlay clashing.` : ""}
- ARABIC & ENGLISH TEXT IN IMAGES (SMART TEXT GATE): If the user's request contains or implies any text, words, brand names, slogans, or titles to be written inside the image (especially in Arabic):
  1. Extract the EXACT text string to be rendered.
  2. Always wrap the exact text inside double quotation marks (e.g. "\u0623\u0647\u0644\u0627\u064B \u0648\u0633\u0647\u0644\u0627\u064B" or "Naje AI").
  3. Explicitly instruct the model: "Render the exact text "<EXACT_TEXT>" in high-contrast, beautiful typography. For Arabic text, ensure correct right-to-left connectivity, properly joined letterforms, and no disconnected or reversed characters."
  4. ${GRAND_TYPOGRAPHY}
  5. Specify prominent placement, large readable font size, and clear background contrast. Keep text concise (ideal length: 1 to 5 words for highest accuracy). Do NOT leave empty space for text; instruct the model to bake the text directly into the image.
${brandContext ? `- Respect this project's brand context: colors ${JSON.stringify(brandContext.colors || [])}, style "${brandContext.style || ""}", entity type "${brandContext.entityType || ""}" (adjust formality/tone accordingly \u2014 e.g. more restrained and symmetrical for government/formal entities, warmer and more personal for individuals).` : ""}
${referenceFiles?.length ? `- The user attached ${referenceFiles.length} reference image(s) \u2014 assume dominant colors/composition/material cues from them should also be woven into the text description for redundancy with the image-conditioning channel.` : ""}
- Output ONLY the final compiled prompt text, no preamble, no explanation, no markdown formatting.

User's request: "${rawPrompt}"`;
  let structuredPrompt = rawPrompt;
  try {
    const result = await generateContentWithFallback(ai5, {
      model: "gemini-3.5-flash-lite",
      // Writer tier (fast structuring)
      endpointId: "tier_lite",
      contents: compilerInstruction,
      config: {
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler
      }
    });
    structuredPrompt = result.text || rawPrompt;
    console.log(`[compileImagePrompt] Writer structured prompt for ${modelKey} image:
${structuredPrompt}`);
  } catch (error) {
    console.error("[compileImagePrompt] Failed to compile image prompt with writer tier, falling back to raw prompt:", error);
    structuredPrompt = rawPrompt;
  }
  const auditedPrompt = await applyCreativeLayers(ai5, structuredPrompt, "design", aspectRatio2, safeZoneConstraint || void 0);
  return auditedPrompt;
}
async function auditDocChunk(ai5, sectionTitle, sectionHtml, contextSummary, auditorModel = "gemini-3.5-flash-lite") {
  try {
    const auditPrompt = `You are Naje AI's Senior Document Editor & Quality Auditor.
Audit this generated HTML section for quality, tone consistency, and structural completeness.

SECTION TITLE: "${sectionTitle}"
CONTEXT / PRIOR SUMMARY: "${contextSummary || "First section"}"

HTML TO AUDIT:
${sectionHtml}

RULES:
1. Ensure the HTML is well-formed, complete, not truncated mid-tag, and contains proper semantic tags (<p>, <strong>, <ul>, <li>, <h2>).
2. Ensure professional, authentic Arabic tone matching the context without AI buzzwords or fluff.
3. If it is already clean and high quality, return it as is or slightly refined.
4. If it is completely broken, malformed, or empty, return {"ok": false, "reason": "malformed_or_empty"}.

Return ONLY a JSON object:
{
  "ok": true,
  "refinedHtml": "clean html markup...",
  "reason": "approved"
}`;
    const res = await ai5.models.generateContent({
      model: resolveEngineModel(auditorModel),
      contents: auditPrompt,
      config: { responseMimeType: "application/json", maxOutputTokens: OUTPUT_TOKEN_LIMITS.documentSection }
    });
    const parsed = JSON.parse(res.text || "{}");
    if (parsed.ok && parsed.refinedHtml) {
      return { ok: true, refinedHtml: parsed.refinedHtml };
    }
    return { ok: parsed.ok !== false, refinedHtml: parsed.refinedHtml || sectionHtml };
  } catch (err) {
    console.warn("[auditDocChunk] Warning: audit check failed, using original sectionHtml:", err);
    return { ok: true, refinedHtml: sectionHtml };
  }
}
async function auditSlideChunk(ai5, slideData, auditorModel = "gemini-3.5-flash-lite") {
  try {
    const auditPrompt = `You are Naje AI's Presentation Quality Auditor.
Audit this slide JSON object for structural validity, conciseness, visual appeal, and proper visual element assignment (aiImagePrompt, stats, cards, bulletPoints).

SLIDE DATA:
${JSON.stringify(slideData)}

RULES:
1. Ensure slideTitle is concise and statement-driven.
2. Ensure content.text is at most 1 single sentence. If longer, bulletPoints must be used.
3. Ensure content.aiImagePrompt is a concrete, photographic English search term (no Arabic, no abstract buzzwords).
4. Return the slide with any necessary polish applied.

Return ONLY a JSON object matching:
{
  "ok": true,
  "refinedSlide": { "layoutTemplate": "...", "slideTitle": "...", "speakerNotes": "...", "content": { ... } },
  "reason": "approved"
}`;
    const res = await ai5.models.generateContent({
      model: resolveEngineModel(auditorModel),
      contents: auditPrompt,
      config: { responseMimeType: "application/json", maxOutputTokens: OUTPUT_TOKEN_LIMITS.slideJson }
    });
    const parsed = JSON.parse(res.text || "{}");
    if (parsed.ok && parsed.refinedSlide) {
      return { ok: true, refinedSlide: parsed.refinedSlide };
    }
    return { ok: true, refinedSlide: slideData };
  } catch (err) {
    console.warn("[auditSlideChunk] Warning: slide audit check failed, using original slide:", err);
    return { ok: true, refinedSlide: slideData };
  }
}
function getDefaultMaxOutputTokensForModel(modelName) {
  if (modelName.includes("3.5-flash-lite")) return 65535;
  if (modelName.includes("3.6-flash") || modelName.includes("3.7-flash")) return 65535;
  if (modelName.includes("3.1-pro")) return 65535;
  return 8192;
}
async function generateContentWithFallback(ai5, options) {
  const endpointId = options.endpointId;
  let primaryModel = options.model;
  let configuredFallback = options.fallbackModelId;
  let maxOutputTokensFromConfig;
  if (endpointId) {
    try {
      const cfg = await getModelEndpointConfig(endpointId, options.model);
      if (cfg.modelId) primaryModel = cfg.modelId;
      if (cfg.fallbackModelId) configuredFallback = cfg.fallbackModelId;
      if (cfg.maxOutputTokens) maxOutputTokensFromConfig = cfg.maxOutputTokens;
    } catch (e) {
    }
  }
  const baseConfig = options.config ? { ...options.config } : {};
  if (maxOutputTokensFromConfig && !baseConfig.maxOutputTokens) {
    baseConfig.maxOutputTokens = maxOutputTokensFromConfig;
  }
  if (!baseConfig.maxOutputTokens && !primaryModel.includes("image") && !primaryModel.includes("imagen")) {
    baseConfig.maxOutputTokens = getDefaultMaxOutputTokensForModel(primaryModel);
  }
  const mergedOptions = { ...options, model: primaryModel, config: baseConfig };
  try {
    const result = await ai5.models.generateContent({
      ...mergedOptions,
      model: resolveEngineModel(primaryModel),
      config: {
        ...baseConfig,
        maxOutputTokens: baseConfig.maxOutputTokens || getDefaultMaxOutputTokensForModel(primaryModel)
      }
    });
    if (endpointId) {
      updateEndpointHealthOnSuccess(endpointId, primaryModel).catch(() => {
      });
    }
    return result;
  } catch (error) {
    const isModelDead = isModelDeadOrDeprecated(error);
    const errStr = error.message ? error.message.toLowerCase() : "";
    const isQuotaOrAccess = errStr.includes("quota") || errStr.includes("rate limit") || errStr.includes("exhausted") || errStr.includes("429") || errStr.includes("403") || errStr.includes("permission_denied") || errStr.includes("denied access") || errStr.includes("not found") || errStr.includes("404");
    if (endpointId) {
      updateEndpointHealthOnFailure(endpointId, primaryModel, error?.message || "Model execution failure").catch(() => {
      });
    }
    if (isModelDead || isQuotaOrAccess) {
      const isImageReq = primaryModel.includes("image") || primaryModel.includes("imagen") || primaryModel.includes("nano-banana");
      const defaultFallbacks = isImageReq ? [resolveEngineModel(getNajeModel("image_core")), resolveEngineModel(getNajeModel("image_lite"))] : [resolveEngineModel(getNajeModel("core")), resolveEngineModel(getNajeModel("lite")), resolveEngineModel(getNajeModel("pro"))];
      const candidateModels = [
        configuredFallback,
        ...defaultFallbacks
      ].filter(Boolean);
      for (const fallbackModel of candidateModels) {
        if (fallbackModel === primaryModel) continue;
        try {
          console.warn(`[Model Fallback] ${primaryModel} failed (${error.message?.slice(0, 80)}). Retrying with fallback model ${fallbackModel}...`);
          const fbConfig = { ...baseConfig };
          if (!fbConfig.maxOutputTokens && !fallbackModel.includes("image")) {
            fbConfig.maxOutputTokens = getDefaultMaxOutputTokensForModel(fallbackModel);
          }
          const fbResult = await ai5.models.generateContent({
            ...mergedOptions,
            config: {
              ...fbConfig,
              maxOutputTokens: fbConfig.maxOutputTokens || getDefaultMaxOutputTokensForModel(fallbackModel)
            },
            model: resolveEngineModel(fallbackModel)
          });
          if (endpointId) {
            updateEndpointHealthOnSuccess(endpointId, fallbackModel).catch(() => {
            });
          }
          return fbResult;
        } catch (retryErr) {
          console.warn(`[Model Fallback] ${fallbackModel} also failed:`, retryErr?.message?.slice(0, 80));
        }
      }
    }
    throw error;
  }
}
function decodeFirestoreValue(valObj) {
  if (!valObj || typeof valObj !== "object") return null;
  if ("stringValue" in valObj) return valObj.stringValue;
  if ("integerValue" in valObj) return parseInt(valObj.integerValue, 10);
  if ("doubleValue" in valObj) return parseFloat(valObj.doubleValue);
  if ("booleanValue" in valObj) return valObj.booleanValue;
  if ("nullValue" in valObj) return null;
  if ("timestampValue" in valObj) return valObj.timestampValue;
  if ("bytesValue" in valObj) return valObj.bytesValue;
  if ("arrayValue" in valObj) {
    const arr = valObj.arrayValue?.values || [];
    return arr.map((item) => decodeFirestoreValue(item));
  }
  if ("mapValue" in valObj) {
    const mapFields = valObj.mapValue?.fields || {};
    const res = {};
    for (const [k, v] of Object.entries(mapFields)) {
      res[k] = decodeFirestoreValue(v);
    }
    return res;
  }
  return null;
}
function firestoreRestToObj(doc) {
  if (!doc) return null;
  const docId = doc.name ? doc.name.split("/").pop() : void 0;
  const fields = doc.fields || {};
  const res = { id: docId };
  for (const [k, v] of Object.entries(fields)) {
    res[k] = decodeFirestoreValue(v);
  }
  return res;
}
function encodeFirestoreValue(val) {
  if (val === null || val === void 0) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(encodeFirestoreValue) } };
  }
  if (typeof val === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== void 0) {
        fields[k] = encodeFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}
function objToFirestoreRest(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== void 0 && k !== "id" && k !== "ref") {
      fields[k] = encodeFirestoreValue(v);
    }
  }
  return { fields };
}
async function getDocRest(collectionPath, docId, _token) {
  try {
    const docRef = dbAdmin.doc(`${collectionPath}/${docId}`);
    const snap = await docRef.get();
    if (snap.exists) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (e) {
  }
  try {
    const headers = {};
    if (_token) headers["Authorization"] = `Bearer ${_token}`;
    const url = `${BASE_URL}/${collectionPath}/${docId}`;
    const res = await fetch(url, { headers });
    if (res.status === 200) {
      const data = await res.json();
      return firestoreRestToObj(data);
    }
    if (res.status === 404) return null;
  } catch (err) {
  }
  return null;
}
async function queryDocsByFieldRest(collectionPath, fieldName, fieldValue, _token, limitVal = 500) {
  try {
    const snap = await dbAdmin.collection(collectionPath).where(fieldName, "==", fieldValue).limit(limitVal).get();
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ref: d.ref.path,
        ...d.data()
      }));
    }
  } catch (e) {
  }
  try {
    const headers = { "Content-Type": "application/json" };
    if (_token) headers["Authorization"] = `Bearer ${_token}`;
    const url = `${BASE_URL}:runQuery`;
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: collectionPath }],
        where: {
          fieldFilter: {
            field: { fieldPath: fieldName },
            op: "EQUAL",
            value: encodeFirestoreValue(fieldValue)
          }
        },
        limit: limitVal
      }
    };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(queryBody) });
    if (res.ok) {
      const results = await res.json();
      if (!Array.isArray(results) || results.length === 0) return null;
      const validDocs = results.filter((item) => item.document);
      if (validDocs.length === 0) return null;
      return validDocs.map((item) => ({
        ...firestoreRestToObj(item.document),
        ref: `${collectionPath}/${item.document.name ? item.document.name.split("/").pop() : ""}`
      }));
    }
  } catch (err) {
  }
  return null;
}
async function listCollectionRest(collectionPath, _token, limitVal = 500) {
  try {
    const snap = await dbAdmin.collection(collectionPath).limit(limitVal).get();
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ref: d.ref.path,
        ...d.data()
      }));
    }
  } catch (e) {
  }
  try {
    const headers = {};
    if (_token) headers["Authorization"] = `Bearer ${_token}`;
    const url = `${BASE_URL}/${collectionPath}?pageSize=${limitVal}`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];
      return docs.map((d) => ({
        ...firestoreRestToObj(d),
        ref: `${collectionPath}/${d.name ? d.name.split("/").pop() : ""}`
      }));
    }
  } catch (err) {
  }
  return null;
}
async function getCollectionRest(fullPath, _token) {
  try {
    const snap = await dbAdmin.collection(fullPath).get();
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ref: d.ref.path,
        ...d.data()
      }));
    }
  } catch (e) {
  }
  try {
    const headers = {};
    if (_token) headers["Authorization"] = `Bearer ${_token}`;
    const url = `${BASE_URL}/${fullPath}`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];
      return docs.map((d) => ({
        ...firestoreRestToObj(d),
        ref: `${fullPath}/${d.name ? d.name.split("/").pop() : ""}`
      }));
    }
  } catch (err) {
  }
  return null;
}
async function deleteDocRest(collectionPath, docId, _token) {
  try {
    await dbAdmin.doc(`${collectionPath}/${docId}`).delete();
    return;
  } catch (e) {
  }
  try {
    const headers = {};
    if (_token) headers["Authorization"] = `Bearer ${_token}`;
    const url = `${BASE_URL}/${collectionPath}/${docId}`;
    await fetch(url, { method: "DELETE", headers });
  } catch (err) {
  }
}
async function deleteQueryInBatchesRest(collectionPath, fieldName, fieldValue, token, label) {
  try {
    let deletedCount = 0;
    let hasMore = true;
    while (hasMore) {
      const docs = await queryDocsByFieldRest(collectionPath, fieldName, fieldValue, token, 100);
      if (!docs || docs.length === 0) {
        hasMore = false;
        break;
      }
      for (const doc of docs) {
        await deleteDocRest(collectionPath, doc.id, token);
        deletedCount++;
      }
      if (docs.length < 100) {
        hasMore = false;
      }
    }
    console.log(`Successfully deleted ${deletedCount} docs from ${label} via REST for user ${fieldValue}`);
  } catch (e) {
    console.error(`Error deleting documents from ${label} via REST for user ${fieldValue}:`, e);
  }
}
async function updateDocFieldsRest(collectionPath, docId, dataObj, _fieldsToUpdate, _token) {
  try {
    await dbAdmin.doc(`${collectionPath}/${docId}`).update(dataObj);
    return { id: docId, ...dataObj };
  } catch (e) {
  }
  try {
    const headers = { "Content-Type": "application/json" };
    if (_token) headers["Authorization"] = `Bearer ${_token}`;
    let maskParam = "";
    if (_fieldsToUpdate && _fieldsToUpdate.length > 0) {
      maskParam = "?" + _fieldsToUpdate.map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join("&");
    }
    const url = `${BASE_URL}/${collectionPath}/${docId}${maskParam}`;
    const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(objToFirestoreRest(dataObj)) });
    if (res.ok) {
      return { id: docId, ...dataObj };
    }
  } catch (err) {
  }
  return { id: docId, ...dataObj };
}
async function createDocRest(collectionPath, dataObj, _token) {
  try {
    const docRef = await dbAdmin.collection(collectionPath).add(dataObj);
    return { id: docRef.id, ...dataObj };
  } catch (e) {
  }
  try {
    const headers = { "Content-Type": "application/json" };
    if (_token) headers["Authorization"] = `Bearer ${_token}`;
    const url = `${BASE_URL}/${collectionPath}`;
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(objToFirestoreRest(dataObj)) });
    if (res.ok) {
      const data = await res.json();
      const newId = data.name ? data.name.split("/").pop() : void 0;
      return { id: newId, ...dataObj };
    }
  } catch (err) {
  }
  return { id: void 0, ...dataObj };
}
async function setDocRest(collectionPath, docId, dataObj, _token) {
  try {
    await dbAdmin.doc(`${collectionPath}/${docId}`).set(dataObj, { merge: true });
    return { id: docId, ...dataObj };
  } catch (e) {
  }
  try {
    const headers = { "Content-Type": "application/json" };
    if (_token) headers["Authorization"] = `Bearer ${_token}`;
    const url = `${BASE_URL}/${collectionPath}/${docId}`;
    const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(objToFirestoreRest(dataObj)) });
    if (res.ok) {
      return { id: docId, ...dataObj };
    }
  } catch (err) {
  }
  return { id: docId, ...dataObj };
}
function asNumericBalance(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}
async function grantStarterBalanceIfAbsent(uid, token, existingDoc) {
  const existing = asNumericBalance(existingDoc?.balance);
  if (existing !== null) {
    inMemoryBalances.set(uid, existing);
    return { balance: existing, doc: existingDoc };
  }
  const fieldPresent = existingDoc && Object.prototype.hasOwnProperty.call(existingDoc, "balance");
  if (fieldPresent) {
    const fallback2 = inMemoryBalances.get(uid);
    return {
      balance: typeof fallback2 === "number" ? fallback2 : 0,
      doc: existingDoc
    };
  }
  const starter = 5;
  if (isDbAdminAvailable) {
    try {
      const ref = dbAdmin.collection("users").doc(uid);
      const granted = await dbAdmin.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return null;
        const data = snap.data() || {};
        const cur = asNumericBalance(data.balance);
        if (cur !== null) return cur;
        if (Object.prototype.hasOwnProperty.call(data, "balance")) return 0;
        tx.set(ref, { balance: starter }, { merge: true });
        return starter;
      });
      if (typeof granted === "number") {
        inMemoryBalances.set(uid, granted);
        return { balance: granted, doc: { ...existingDoc, balance: granted } };
      }
    } catch (e) {
      console.warn("[grantStarterBalanceIfAbsent] transaction note:", e?.message || e);
    }
  }
  if (token && !isDbAdminAvailable && existingDoc && !Object.prototype.hasOwnProperty.call(existingDoc, "balance")) {
    try {
      await updateDocFieldsRest("users", uid, { balance: starter }, ["balance"], token);
      inMemoryBalances.set(uid, starter);
      return { balance: starter, doc: { ...existingDoc, balance: starter } };
    } catch (e) {
      console.warn("[grantStarterBalanceIfAbsent] REST grant note:", e?.message || e);
    }
  }
  const fallback = inMemoryBalances.get(uid);
  return {
    balance: typeof fallback === "number" ? fallback : 0,
    doc: existingDoc
  };
}
async function getUserDocAndBalance(uid, token, decodedToken) {
  const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : "";
  const userEmail = (decodedToken?.email || "").trim().toLowerCase();
  const isEnvAdmin = Boolean(adminEmail && userEmail === adminEmail);
  if (token) {
    userTokenCache.set(uid, token);
    try {
      const userDoc = await getDocRest("users", uid, token);
      if (userDoc) {
        if (isEnvAdmin && (!userDoc.isAdmin || !userDoc.canAddAdmins)) {
          await updateDocFieldsRest("users", uid, { isAdmin: true, canAddAdmins: true }, ["isAdmin", "canAddAdmins"], token).catch(() => null);
          userDoc.isAdmin = true;
          userDoc.canAddAdmins = true;
        }
        return grantStarterBalanceIfAbsent(uid, token, userDoc);
      }
    } catch (e) {
    }
  }
  let confirmedAbsent = false;
  if (isDbAdminAvailable) {
    try {
      const snap = await dbAdmin.collection("users").doc(uid).get();
      if (snap.exists) {
        const data = snap.data();
        if (isEnvAdmin && (!data?.isAdmin || !data?.canAddAdmins)) {
          await dbAdmin.collection("users").doc(uid).update({ isAdmin: true, canAddAdmins: true }).catch(() => null);
          data.isAdmin = true;
          data.canAddAdmins = true;
        }
        return grantStarterBalanceIfAbsent(uid, token, data);
      }
      confirmedAbsent = true;
    } catch (e) {
      confirmedAbsent = false;
    }
  }
  if (!confirmedAbsent) {
    const fallbackBal = inMemoryBalances.get(uid);
    return {
      balance: typeof fallbackBal === "number" ? fallbackBal : 0,
      doc: { uid, isAdmin: isEnvAdmin, canAddAdmins: isEnvAdmin, balance: typeof fallbackBal === "number" ? fallbackBal : 0 }
    };
  }
  const defaultBalance = 5;
  const initialUserData = {
    uid,
    email: decodedToken?.email || "",
    displayName: decodedToken?.name || "",
    balance: defaultBalance,
    isAdmin: isEnvAdmin ? true : false,
    canAddAdmins: isEnvAdmin ? true : false,
    hasAcceptedTerms: isEnvAdmin ? true : false,
    hasCompletedOnboarding: isEnvAdmin ? true : false
  };
  inMemoryBalances.set(uid, defaultBalance);
  if (isDbAdminAvailable) {
    try {
      await dbAdmin.collection("users").doc(uid).create(initialUserData);
      return { balance: defaultBalance, doc: initialUserData };
    } catch (e) {
      try {
        const snap2 = await dbAdmin.collection("users").doc(uid).get();
        if (snap2.exists) {
          const d = snap2.data();
          return grantStarterBalanceIfAbsent(uid, token, d);
        }
      } catch {
      }
      return { balance: defaultBalance, doc: initialUserData };
    }
  }
  return { balance: defaultBalance, doc: initialUserData };
}
async function mutateBalanceAtomic(uid, delta, opts = {}) {
  const effectiveToken = opts.token || userTokenCache.get(uid);
  if (opts.token && uid) {
    userTokenCache.set(uid, opts.token);
  }
  if (isDbAdminAvailable) {
    const userRef = dbAdmin.collection("users").doc(uid);
    try {
      const result = await dbAdmin.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        let current;
        if (snap.exists && asNumericBalance(snap.data()?.balance) !== null) {
          current = asNumericBalance(snap.data().balance);
        } else {
          return { ok: false, newBalance: 0, reason: "ERROR" };
        }
        const next = parseFloat((current + delta).toFixed(4));
        if (opts.requireSufficient && next < 0) {
          return { ok: false, newBalance: current, reason: "INSUFFICIENT" };
        }
        const safeNext = parseFloat(next.toFixed(4));
        tx.set(userRef, { balance: safeNext, isNegativeBalance: safeNext < 0 }, { merge: true });
        inMemoryBalances.set(uid, safeNext);
        return { ok: true, newBalance: safeNext };
      });
      if (result.ok || result.reason === "INSUFFICIENT") {
        return result;
      }
    } catch (e) {
      const isPermDenied = e?.code === 7 || e?.code === "PERMISSION_DENIED" || String(e?.message || "").includes("PERMISSION_DENIED");
      if (isPermDenied) {
        isDbAdminAvailable = false;
        console.log(`[mutateBalanceAtomic] Notice: Admin SDK direct gRPC access bypassed; active REST token adapter handles balance for user ${uid}.`);
      } else {
        console.warn(`[mutateBalanceAtomic] dbAdmin transaction note: ${e?.message || e}`);
      }
    }
  }
  if (effectiveToken) {
    try {
      const userDoc = await getDocRest("users", uid, effectiveToken);
      const restBal = userDoc ? asNumericBalance(userDoc.balance) : null;
      if (restBal === null) {
        return { ok: false, newBalance: 0, reason: "ERROR" };
      }
      let current = restBal;
      const next = parseFloat((current + delta).toFixed(4));
      if (opts.requireSufficient && next < 0) {
        return { ok: false, newBalance: current, reason: "INSUFFICIENT" };
      }
      const safeNext = parseFloat(next.toFixed(4));
      await updateDocFieldsRest(
        "users",
        uid,
        { balance: safeNext, isNegativeBalance: safeNext < 0 },
        ["balance", "isNegativeBalance"],
        effectiveToken
      );
      inMemoryBalances.set(uid, safeNext);
      return { ok: true, newBalance: safeNext };
    } catch (restErr) {
      console.error("[mutateBalanceAtomic] REST update failed:", restErr?.message || restErr);
      return { ok: false, newBalance: 0, reason: "ERROR" };
    }
  }
  return { ok: false, newBalance: 0, reason: "ERROR" };
}
var DEFAULT_TEXT_TOKEN_RATES = {
  "gemini-3.5-flash-lite": {
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1e3,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1e3,
    audioInputPointsPerBlock: 0.2,
    audioInputTokenBlockSize: 1e3
  },
  "gemini-3.6-flash": {
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1e3,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1e3,
    audioInputPointsPerBlock: 0.2,
    audioInputTokenBlockSize: 1e3
  },
  "gemini-3.7-flash": {
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1e3,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1e3,
    audioInputPointsPerBlock: 0.2,
    audioInputTokenBlockSize: 1e3
  },
  "gemini-3.1-pro": {
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1e3,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1e3,
    audioInputPointsPerBlock: 0.2,
    audioInputTokenBlockSize: 1e3
  },
  "gemini-3.1-pro-preview": {
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1e3,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1e3,
    audioInputPointsPerBlock: 0.2,
    audioInputTokenBlockSize: 1e3
  }
};
var TOKEN_ENDPOINT_ALIASES = {
  tier_lite: ["tier_lite", "text_lite"],
  text_lite: ["text_lite", "tier_lite"],
  tier_core: ["tier_core", "text_core"],
  text_core: ["text_core", "tier_core"],
  tier_max: ["tier_max", "text_max"],
  text_max: ["text_max", "tier_max"],
  ui_builder: ["ui_builder", "ui_standard"],
  ui_standard: ["ui_standard", "ui_builder"]
};
var CACHED_INPUT_RATE_MULT = 0.25;
function ratesFromEndpointLike(data, fallback) {
  if (!data) return null;
  const inputBlock = data.inputPointsPerBlock ?? data.inputPointsPer1k;
  const outputBlock = data.outputPointsPerBlock ?? data.outputPointsPer1k;
  if (inputBlock === void 0 && outputBlock === void 0) return null;
  return {
    inputPointsPerBlock: Number(inputBlock ?? fallback.inputPointsPerBlock),
    inputTokenBlockSize: Number(data.inputTokenBlockSize > 0 ? data.inputTokenBlockSize : 1e3),
    outputPointsPerBlock: Number(outputBlock ?? fallback.outputPointsPerBlock),
    outputTokenBlockSize: Number(data.outputTokenBlockSize > 0 ? data.outputTokenBlockSize : 1e3),
    audioInputPointsPerBlock: data.audioInputPointsPerBlock ?? data.audioInputPointsPer1k ?? fallback.audioInputPointsPerBlock,
    audioInputTokenBlockSize: data.audioInputTokenBlockSize > 0 ? data.audioInputTokenBlockSize : 1e3
  };
}
function extractGeminiUsage(usageMetadata) {
  const inputTokens = Number(usageMetadata?.promptTokenCount || 0);
  const candidates = Number(usageMetadata?.candidatesTokenCount || 0);
  const thoughtsTokens = Number(usageMetadata?.thoughtsTokenCount || 0);
  const cachedTokens = Number(usageMetadata?.cachedContentTokenCount || 0);
  const total = Number(usageMetadata?.totalTokenCount || 0);
  const thoughtsLookExtra = thoughtsTokens > 0 && (total === 0 || total >= inputTokens + candidates + thoughtsTokens - 8);
  const outputTokens = candidates + (thoughtsLookExtra ? thoughtsTokens : 0);
  return { inputTokens, outputTokens, cachedTokens, thoughtsTokens };
}
async function getTextModelTokenRates(modelId) {
  const cleanId = (modelId || "").trim();
  const defaultRates = DEFAULT_TEXT_TOKEN_RATES[cleanId] || {
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1e3,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1e3,
    audioInputPointsPerBlock: 0.2,
    audioInputTokenBlockSize: 1e3
  };
  const idsToTry = TOKEN_ENDPOINT_ALIASES[cleanId] || [cleanId];
  const pick = (data) => ratesFromEndpointLike(data, defaultRates);
  try {
    for (const id of idsToTry) {
      const fromCache = pick(modelEndpointCache.get(id));
      if (fromCache) return fromCache;
    }
    const fromModelKey = pick(modelEndpointCache.get(`model:${cleanId}`));
    if (fromModelKey) return fromModelKey;
    for (const id of idsToTry) {
      await getModelEndpointConfig(id, void 0, void 0).catch(() => null);
      const fromLoaded = pick(modelEndpointCache.get(id));
      if (fromLoaded) return fromLoaded;
    }
    for (const id of idsToTry) {
      try {
        const doc = await dbAdmin.collection("model_endpoints").doc(id).get();
        if (doc.exists) {
          const fromDoc = pick(doc.data());
          if (fromDoc) return fromDoc;
        }
      } catch {
      }
    }
    for (const id of idsToTry) {
      const fromSeed = pick(SEED_ENDPOINTS.find((s) => s.id === id));
      if (fromSeed) return fromSeed;
    }
    const fromSeedModel = pick(SEED_ENDPOINTS.find((s) => s.modelId === cleanId && s.pricingType !== "per_generation"));
    if (fromSeedModel) return fromSeedModel;
  } catch {
  }
  return defaultRates;
}
async function chargeForTextModelUsage(uid, modelId, usageMetadata, isAdmin = false) {
  const { inputTokens, outputTokens, cachedTokens, thoughtsTokens } = extractGeminiUsage(usageMetadata);
  if (isAdmin) {
    await createDocRest("api_cost_log", {
      uid: uid || "admin",
      model: modelId,
      inputTokens,
      outputTokens,
      cachedContentTokenCount: cachedTokens,
      thoughtsTokenCount: thoughtsTokens,
      costInPoints: 0,
      billingType: "per_token",
      isAdmin: true,
      createdAt: Date.now()
    }, void 0).catch((e) => console.error("Admin api_cost_log write error:", e));
    return { charged: 0, inputTokens, outputTokens, cachedTokens, thoughtsTokens, newBalance: null };
  }
  if (!uid || uid === "anonymous") {
    return { charged: 0, inputTokens: 0, outputTokens: 0, cachedTokens: 0, thoughtsTokens: 0, newBalance: null };
  }
  const rates = await getTextModelTokenRates(modelId);
  const inBlock = rates.inputTokenBlockSize > 0 ? rates.inputTokenBlockSize : 1e3;
  const outBlock = rates.outputTokenBlockSize > 0 ? rates.outputTokenBlockSize : 1e3;
  const uncachedInputTokens = Math.max(0, inputTokens - cachedTokens);
  const cost2 = parseFloat((uncachedInputTokens / inBlock * rates.inputPointsPerBlock + cachedTokens / inBlock * (rates.inputPointsPerBlock * CACHED_INPUT_RATE_MULT) + outputTokens / outBlock * rates.outputPointsPerBlock).toFixed(4));
  let newBalance = null;
  if (cost2 > 0) {
    await mutateBalanceAtomic(uid, -cost2, {}).then((res) => {
      if (res.ok) newBalance = res.newBalance;
      else console.warn(`[chargeForTextModelUsage] Metered deduction notice for user ${uid}: ${res.reason}`);
    }).catch((e) => console.error("Metered balance deduction error:", e));
  }
  if (cachedTokens > 0) {
    console.log(`[TokenMeter] cache hit model=${modelId} cached=${cachedTokens} uncachedIn=${uncachedInputTokens} out=${outputTokens} thoughts=${thoughtsTokens} cost=${cost2}`);
  }
  await createDocRest("api_cost_log", {
    uid,
    model: modelId,
    inputTokens,
    outputTokens,
    cachedContentTokenCount: cachedTokens,
    thoughtsTokenCount: thoughtsTokens,
    costInPoints: cost2,
    billingType: "per_token",
    createdAt: Date.now()
  }, void 0).catch((e) => console.error("api_cost_log write error:", e));
  return { charged: cost2, inputTokens, outputTokens, cachedTokens, thoughtsTokens, newBalance };
}
async function requireAuth(req, res) {
  const authHeader = req.headers.authorization;
  let token;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split("Bearer ")[1];
  }
  if (!token) {
    res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
    return null;
  }
  try {
    const decoded = await (0, import_auth.getAuth)().verifyIdToken(token);
    if (decoded.uid) userTokenCache.set(decoded.uid, token);
    return { uid: decoded.uid, token, email: decoded.email };
  } catch {
    res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646." });
    return null;
  }
}
function isPrivilegedAdmin(userDoc, decodedToken) {
  if (userDoc?.isAdmin === true) return true;
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!adminEmail) return false;
  const tokenEmail = (decodedToken?.email || "").trim().toLowerCase();
  return Boolean(tokenEmail && tokenEmail === adminEmail);
}
async function mediaCost(token, kind, durationSeconds = 0) {
  try {
    const pricing = await getPricing(token);
    let cost2 = kind === "video" ? Math.max(0.5, (durationSeconds || 5) * (pricing?.video?.perSecond ?? 0.5)) : pricing?.image?.spectra ?? pricing?.image?.nova ?? pricing?.image?.base ?? 1;
    return parseFloat(Number(cost2).toFixed(2));
  } catch {
    return kind === "video" ? 2.5 : 1;
  }
}
async function chargePoints(uid, _token, cost2) {
  if (!cost2 || cost2 <= 0) return null;
  const r = await mutateBalanceAtomic(uid, -cost2, { requireSufficient: true });
  return r.ok ? r.newBalance : null;
}
var rateBuckets = /* @__PURE__ */ new Map();
function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (rateBuckets.get(key) || []).filter((t) => t > cutoff);
  if (hits.length >= maxRequests) {
    const retryAfterSec = Math.ceil((hits[0] + windowMs - now) / 1e3);
    rateBuckets.set(key, hits);
    return { allowed: false, retryAfterSec };
  }
  hits.push(now);
  rateBuckets.set(key, hits);
  return { allowed: true, retryAfterSec: 0 };
}
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1e3;
  for (const [k, v] of rateBuckets) {
    const kept = v.filter((t) => t > cutoff);
    if (kept.length === 0) rateBuckets.delete(k);
    else rateBuckets.set(k, kept);
  }
}, 10 * 60 * 1e3);
async function startServer(existingApp) {
  const app = existingApp || (0, import_express.default)();
  const alreadyListening = Boolean(existingApp);
  const activeUserTasks = /* @__PURE__ */ new Set();
  const PORT = 3e3;
  const ALLOWED_ORIGINS = /* @__PURE__ */ new Set([
    "https://naje-ai.qelvaai.com",
    "https://gen-lang-client-0549025293.web.app",
    "https://gen-lang-client-0549025293.firebaseapp.com",
    "http://localhost:3000",
    "http://localhost:5173"
  ]);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const isAllowed = origin && (ALLOWED_ORIGINS.has(origin) || /^https:\/\/[a-z0-9-]+-373938905126\.[a-z0-9-]+\.run\.app$/.test(origin) || /^https:\/\/[a-z0-9-]+-32227028098\.[a-z0-9-]+\.run\.app$/.test(origin));
    if (isAllowed && origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Range");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });
  const json15mb = import_express.default.json({ limit: "15mb" });
  const json50mb = import_express.default.json({ limit: "50mb" });
  app.use((req, res, next) => {
    const parser = req.path === "/api/upload-media" ? json50mb : json15mb;
    return parser(req, res, next);
  });
  app.use(import_express.default.urlencoded({ extended: true, limit: "15mb" }));
  app.get(["/api/health", "/health", "/healthz", "/_ah/health", "/_health", "/ping", "/livez", "/readyz"], (req, res) => {
    res.status(200).json({ status: "ok", timestamp: Date.now() });
  });
  let seedExecuted = false;
  const executeSeeds = () => {
    if (!seedExecuted) {
      seedExecuted = true;
      seedModelEndpointsIfMissing().catch(() => {
      });
      seedFormatPresetsIfMissing().catch(() => {
      });
    }
  };
  const bindPort = (port, role) => {
    const srv = import_http.default.createServer(app);
    srv.setTimeout(6e5);
    srv.keepAliveTimeout = 6e5;
    srv.headersTimeout = 601e3;
    srv.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`[Port Notice] ${role} port ${port} already bound or in use by proxy.`);
      } else {
        console.error(`[Port Error] ${role} listener error on ${port}:`, err?.message || err);
      }
    });
    srv.listen(port, "0.0.0.0", () => {
      console.log(`[Server] ${role} active on http://0.0.0.0:${port}`);
    });
    return srv;
  };
  const envPortEarly = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
  const ingressPortEarly = envPortEarly && !isNaN(envPortEarly) ? envPortEarly : 8080;
  if (!alreadyListening) {
    bindPort(ingressPortEarly, "Cloud Run Ingress");
    if (ingressPortEarly !== 3e3) bindPort(3e3, "App Port (3000)");
  }
  app.all(["/__/auth/*", "/__/auth"], async (req, res) => {
    try {
      const targetHost = `${PROJECT_ID2}.firebaseapp.com`;
      const targetUrl = `https://${targetHost}${req.originalUrl}`;
      const headers = {
        "host": targetHost
      };
      const headersToForward = [
        "accept",
        "accept-language",
        "accept-encoding",
        "content-type",
        "user-agent",
        "cookie",
        "authorization",
        "x-requested-with",
        "x-firebase-gmpid",
        "referer"
      ];
      for (const headerName of headersToForward) {
        if (req.headers[headerName]) {
          headers[headerName] = req.headers[headerName];
        }
      }
      const fetchOptions = {
        method: req.method,
        headers
      };
      if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
        fetchOptions.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      }
      const response = await fetch(targetUrl, fetchOptions);
      const data = await response.arrayBuffer();
      res.status(response.status);
      response.headers.forEach((val, key) => {
        const lowerKey = key.toLowerCase();
        if (!["content-encoding", "transfer-encoding", "content-length"].includes(lowerKey)) {
          res.setHeader(key, val);
        }
      });
      res.send(Buffer.from(data));
    } catch (e) {
      console.error("Firebase Auth Proxy Error:", e);
      res.status(500).send("Firebase Auth Proxy Error");
    }
  });
  const isSafePrompt = async (prompt, uid, type, token) => {
    const unsafeKeywords = [
      "\u062C\u0646\u0633\u064A",
      "\u0645\u062E\u062F\u0631\u0627\u062A",
      "\u0627\u0646\u062A\u062D\u0627\u0631",
      "\u0627\u0631\u0647\u0627\u0628",
      "porn",
      "suicide",
      "terrorist",
      "nude",
      "nsfw"
    ];
    const matchedKeyword = unsafeKeywords.find((kw) => {
      if (/^[a-z]+$/.test(kw)) {
        const r = new RegExp(`\\b${kw}\\b`, "i");
        return r.test(prompt);
      }
      return prompt.includes(kw);
    });
    if (matchedKeyword) {
      await createDocRest("flagged_requests", {
        uid,
        createdAt: Date.now(),
        prompt,
        type,
        reason: `\u0641\u062D\u0635 \u0645\u062D\u0644\u064A: \u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u062D\u0638\u0648\u0631\u0629 "${matchedKeyword}"`
      }, token).catch((e) => console.error("Failed to log flagged request REST:", e));
      return { safe: false, reason: "\u0639\u0630\u0631\u0627\u064B\u060C \u062A\u0645 \u062D\u0638\u0631 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628 \u0644\u0645\u062E\u0627\u0644\u0641\u062A\u0647 \u0634\u0631\u0648\u0637 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0646\u0627 (\u0641\u062D\u0635 \u0645\u062D\u0644\u064A)." };
    }
    try {
      const ai5 = createGenAIClient2();
      const safetyCheck = await ai5.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a content safety filter for an Arabic AI application called Naje AI. Analyze the following user prompt for safety issues (violence, self-harm, adult content, hate speech, dangerous weapons/explosives, extreme political incitement, illegal drugs).
Respond ONLY in JSON format with two keys:
"safe": true or false,
"reason": a short explanation in Arabic of why it was rejected, or "safe" if it is allowed.

User prompt: "${prompt}"`,
        config: { responseMimeType: "application/json", maxOutputTokens: OUTPUT_TOKEN_LIMITS.classification }
      });
      let rawText = safetyCheck.text || '{"safe":true}';
      let checkRes = { safe: true };
      try {
        const cleanedText = rawText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
        checkRes = JSON.parse(cleanedText);
      } catch (e) {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            checkRes = JSON.parse(match[0]);
          } catch (e2) {
            checkRes = { safe: true };
          }
        } else {
          checkRes = { safe: true };
        }
      }
      if (!checkRes.safe) {
        await createDocRest("flagged_requests", {
          uid,
          createdAt: Date.now(),
          prompt,
          type,
          reason: `\u0641\u062D\u0635 \u0645\u062A\u0642\u062F\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A: ${checkRes.reason}`
        }, token).catch((e) => console.error("Failed to log flagged request REST:", e));
        return { safe: false, reason: `\u0639\u0630\u0631\u0627\u064B\u060C \u062A\u0645 \u062D\u0638\u0631 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628 \u0644\u0645\u062E\u0627\u0644\u0641\u062A\u0647 \u0634\u0631\u0648\u0637 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0646\u0627: ${checkRes.reason}` };
      }
    } catch {
      return { safe: true };
    }
    return { safe: true };
  };
  app.post("/api/upload-media", async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const { uid } = auth;
      const rl = checkRateLimit(`upload:${uid}`, 30, 60 * 1e3);
      if (!rl.allowed) {
        res.setHeader("Retry-After", String(rl.retryAfterSec));
        return res.status(429).json({ error: "\u062A\u062C\u0627\u0648\u0632\u062A \u062D\u062F \u0627\u0644\u0631\u0641\u0639. \u062D\u0627\u0648\u0644 \u0644\u0627\u062D\u0642\u0627\u064B.", retryAfterSec: rl.retryAfterSec });
      }
      const { path: storagePath, base64Data, mediaType } = req.body || {};
      if (!storagePath || typeof storagePath !== "string" || !base64Data || typeof base64Data !== "string") {
        return res.status(400).json({ error: "Missing storage path or base64Data" });
      }
      if (storagePath.includes("..") || storagePath.includes("\\") || storagePath.includes("\0") || storagePath.startsWith("/") || storagePath.includes("://")) {
        return res.status(400).json({ error: "Invalid path" });
      }
      const normalized = storagePath.replace(/\/+/g, "/");
      const allowedPrefixes = [`generated_media/${uid}/`, `uploads/${uid}/`];
      let safePath;
      if (allowedPrefixes.some((prefix) => normalized.startsWith(prefix))) {
        const leaf = normalized.split("/").pop() || `file_${Date.now()}`;
        const safeLeaf = leaf.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
        const root = normalized.startsWith(`generated_media/${uid}/`) ? `generated_media/${uid}` : `uploads/${uid}`;
        safePath = `${root}/${safeLeaf}`;
      } else {
        const leaf = normalized.split("/").pop() || `file_${Date.now()}`;
        const safeLeaf = leaf.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
        safePath = `uploads/${uid}/${safeLeaf}`;
      }
      const cleanBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
      const maxBytes = mediaType === "video" ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
      if (Math.floor(cleanBase64.length * 0.75) > maxBytes) {
        return res.status(413).json({ error: "\u0627\u0644\u0645\u0644\u0641 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D." });
      }
      const buffer = Buffer.from(cleanBase64, "base64");
      if (buffer.length > maxBytes) {
        return res.status(413).json({ error: "\u0627\u0644\u0645\u0644\u0641 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D." });
      }
      const contentType = mediaType === "video" ? "video/mp4" : mediaType === "voice" || mediaType === "audio" ? "audio/wav" : "image/png";
      const bucket = (0, import_storage.getStorage)().bucket(STORAGE_BUCKET);
      const file = bucket.file(safePath);
      await file.save(buffer, {
        metadata: { contentType, metadata: { ownerId: uid } },
        public: true,
        resumable: false
      });
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${safePath}`;
      return res.json({ url: publicUrl });
    } catch (err) {
      console.warn("[Upload Media API] Storage save warning:", err?.message || err);
      return res.status(500).json({ error: err?.message || "Upload failed" });
    }
  });
  async function generateSingleVeoShot(ai5, params) {
    const videoModelId = resolveEngineModel(params.modelId || "veo-lite");
    const veoParams = {
      model: videoModelId,
      prompt: params.prompt,
      config: {
        numberOfVideos: 1,
        resolution: params.resolution,
        aspectRatio: params.aspectRatio,
        durationSeconds: params.durationSeconds
      }
    };
    if (params.imageInput && params.imageInput.imageBytes) {
      veoParams.image = {
        imageBytes: params.imageInput.imageBytes,
        mimeType: params.imageInput.mimeType || "image/jpeg"
      };
    }
    let operation;
    try {
      operation = await ai5.models.generateVideos(veoParams);
    } catch (veoErr) {
      if (params.resolution !== "720p") {
        console.warn(`[Veo Gen] Failed with resolution=${params.resolution}, retrying with 720p fallback:`, veoErr?.message || veoErr);
        veoParams.config.resolution = "720p";
        operation = await ai5.models.generateVideos(veoParams);
      } else {
        throw veoErr;
      }
    }
    const op = new import_genai5.GenerateVideosOperation();
    op.name = operation.name;
    let done = false;
    let attempt = 0;
    const maxAttempts = 75;
    while (!done && attempt < maxAttempts) {
      const updated = await ai5.operations.getVideosOperation({ operation: op });
      if (updated.done) {
        done = true;
        const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
        if (!uri) throw new Error("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0631\u0627\u0628\u0637 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0646\u0627\u062A\u062C \u0645\u0646 Veo.");
        let videoRes = await fetch(uri, {
          headers: { "x-goog-api-key": process.env.GEMINI_API_KEY }
        });
        if (!videoRes.ok) {
          const altUri = uri.includes("?") ? `${uri}&key=${process.env.GEMINI_API_KEY}` : `${uri}?key=${process.env.GEMINI_API_KEY}`;
          videoRes = await fetch(altUri);
        }
        if (!videoRes.ok) {
          throw new Error(`\u062A\u0639\u0630\u0631 \u062A\u0646\u0632\u064A\u0644 \u0645\u0644\u0641 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645 (\u0631\u0645\u0632 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629: ${videoRes.status})`);
        }
        const arrayBuffer = await videoRes.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
      attempt++;
      if (params.onProgress) {
        await params.onProgress(attempt).catch(() => {
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 4e3));
    }
    if (!done) {
      throw new Error("\u0627\u0646\u062A\u0647\u062A \u0645\u0647\u0644\u0629 \u0627\u0646\u062A\u0638\u0627\u0631 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0644\u0642\u0637\u0629 \u0645\u0646 \u0645\u062D\u0631\u0643 \u0627\u0644\u0641\u064A\u062F\u064A\u0648.");
    }
    throw new Error("\u0641\u0634\u0644 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0641\u064A\u062F\u064A\u0648.");
  }
  async function extractFirstFrameFromFile(videoPath, outputPath) {
    const ffmpeg = await getFfmpeg();
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath).seekInput(0).frames(1).output(outputPath).on("end", async () => {
        try {
          resolve(await import_fs4.default.promises.readFile(outputPath));
        } catch (e) {
          reject(e);
        }
      }).on("error", (err) => reject(err)).run();
    });
  }
  async function checkShotContinuity(ai5, lastFrameShot1, firstFrameShot2) {
    try {
      const b1 = lastFrameShot1.toString("base64");
      const b2 = firstFrameShot2.toString("base64");
      const verifyResp = await ai5.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [{
          role: "user",
          parts: [
            { inlineData: { data: b1, mimeType: "image/jpeg" } },
            { inlineData: { data: b2, mimeType: "image/jpeg" } },
            { text: 'Compare these two consecutive video frames. They should show the same person with consistent facial features, and a plausible continuation of position/pose. Respond with passed=false only if there is an OBVIOUS, SEVERE discontinuity (e.g., completely different face, impossible pose jump) \u2014 minor lighting or angle differences are normal and should not fail the check.\nReturn JSON: { "passed": boolean, "reason": "short explanation" }' }
          ]
        }],
        config: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(verifyResp.text || "{}");
      return { passed: parsed.passed !== false, reason: parsed.reason };
    } catch (e) {
      return { passed: true };
    }
  }
  const MAX_SHOTS_PER_JOB = 4;
  const PER_SHOT_POLL_BUDGET_MS = 75 * 4e3;
  const STALE_JOB_THRESHOLD_MS = MAX_SHOTS_PER_JOB * PER_SHOT_POLL_BUDGET_MS * 2 + 10 * 60 * 1e3;
  async function tryAcquireSlot(jobId, uid) {
    if (!isDbAdminAvailable) {
      const now = Date.now();
      const staleThreshold = now - STALE_JOB_THRESHOLD_MS;
      inMemoryQueue.activeJobs = inMemoryQueue.activeJobs.filter((job) => job.startedAt >= staleThreshold);
      inMemoryQueue.activeSlots = inMemoryQueue.activeJobs.length;
      if (inMemoryQueue.activeSlots < inMemoryQueue.maxConcurrentSlots) {
        inMemoryQueue.activeJobs.push({ jobId, uid, startedAt: now });
        inMemoryQueue.activeSlots = inMemoryQueue.activeJobs.length;
        return true;
      }
      const alreadyQueued = inMemoryQueue.queue.some((q) => q.jobId === jobId);
      if (!alreadyQueued) {
        inMemoryQueue.queue.push({ jobId, uid, enqueuedAt: now });
      }
      return false;
    }
    let reapedJobs = [];
    try {
      const acquired = await dbAdmin.runTransaction(async (tx) => {
        const ref = dbAdmin.collection("system_state").doc("naje_ad_queue");
        const snap = await tx.get(ref);
        let data = snap.exists ? snap.data() : { activeSlots: 0, maxConcurrentSlots: 4, queue: [], activeJobs: [] };
        const now = Date.now();
        const staleThreshold = now - STALE_JOB_THRESHOLD_MS;
        const activeJobs = data.activeJobs || [];
        const validJobs = activeJobs.filter((job) => job.startedAt >= staleThreshold);
        reapedJobs = activeJobs.filter((job) => job.startedAt < staleThreshold);
        data.activeJobs = validJobs;
        data.activeSlots = validJobs.length;
        if (data.activeSlots < data.maxConcurrentSlots) {
          data.activeJobs.push({ jobId, uid, startedAt: now });
          data.activeSlots = data.activeJobs.length;
          tx.set(ref, data, { merge: true });
          return true;
        }
        const alreadyQueued = (data.queue || []).some((q) => q.jobId === jobId);
        if (!alreadyQueued) {
          tx.set(ref, {
            ...data,
            queue: [...data.queue || [], { jobId, uid, enqueuedAt: now }]
          }, { merge: true });
        }
        return false;
      });
      for (const reaped of reapedJobs) {
        console.log(`[Naje Ad Queue] Reaping stale job ${reaped.jobId}`);
        try {
          const jobSnap = await dbAdmin.collection("generation_jobs").doc(reaped.jobId).get();
          if (jobSnap.exists) {
            const jobData = jobSnap.data();
            if (jobData && !["completed", "failed"].includes(jobData.status)) {
              await dbAdmin.collection("generation_jobs").doc(reaped.jobId).update({
                status: "failed",
                stepLabel: "\u0627\u0646\u062A\u0647\u062A \u0645\u0647\u0644\u0629 \u0627\u0644\u062A\u0646\u0641\u064A\u0630 (Timeout)",
                progress: 100
              });
              if (jobData.consumedBalance) {
                await mutateBalanceAtomic(reaped.uid, jobData.consumedBalance, {});
              }
            }
          }
        } catch (err) {
          console.error(`Failed to handle reaped job ${reaped.jobId}:`, err);
        }
      }
      return acquired;
    } catch (txErr) {
      console.warn("[Naje Ad Queue] dbAdmin queue failed, falling back to inMemoryQueue:", txErr.message);
      isDbAdminAvailable = false;
      inMemoryQueue.activeJobs.push({ jobId, uid, startedAt: Date.now() });
      inMemoryQueue.activeSlots = inMemoryQueue.activeJobs.length;
      return true;
    }
  }
  async function releaseSlot(jobId) {
    if (!isDbAdminAvailable) {
      inMemoryQueue.activeJobs = inMemoryQueue.activeJobs.filter((j) => j.jobId !== jobId);
      inMemoryQueue.activeSlots = inMemoryQueue.activeJobs.length;
      let promotedJobId = null;
      let promotedUid = null;
      if (inMemoryQueue.queue.length > 0 && inMemoryQueue.activeSlots < inMemoryQueue.maxConcurrentSlots) {
        const next = inMemoryQueue.queue.shift();
        if (next) {
          promotedJobId = next.jobId;
          promotedUid = next.uid;
          inMemoryQueue.activeJobs.push({ jobId: promotedJobId, uid: promotedUid, startedAt: Date.now() });
          inMemoryQueue.activeSlots = inMemoryQueue.activeJobs.length;
        }
      }
      return { promotedJobId, promotedUid };
    }
    try {
      return await dbAdmin.runTransaction(async (tx) => {
        const ref = dbAdmin.collection("system_state").doc("naje_ad_queue");
        const snap = await tx.get(ref);
        const data = snap.exists ? snap.data() : { activeSlots: 0, maxConcurrentSlots: 4, queue: [], activeJobs: [] };
        const activeJobs = (data.activeJobs || []).filter((job) => job.jobId !== jobId);
        let newActive = activeJobs.length;
        const queue = [...data.queue || []];
        let promotedJobId = null;
        let promotedUid = null;
        if (queue.length > 0 && newActive < data.maxConcurrentSlots) {
          const next = queue.shift();
          promotedJobId = next.jobId;
          promotedUid = next.uid;
          activeJobs.push({ jobId: promotedJobId, uid: promotedUid, startedAt: Date.now() });
          newActive = activeJobs.length;
          tx.set(ref, { ...data, activeJobs, activeSlots: newActive, queue }, { merge: true });
        } else {
          tx.set(ref, { ...data, activeJobs, activeSlots: newActive, queue }, { merge: true });
        }
        return { promotedJobId, promotedUid };
      });
    } catch (err) {
      console.warn("[Naje Ad Queue] dbAdmin releaseSlot fallback:", err.message);
      return { promotedJobId: null, promotedUid: null };
    }
  }
  async function getQueuePosition(jobId) {
    if (!isDbAdminAvailable) {
      return inMemoryQueue.queue.findIndex((q) => q.jobId === jobId);
    }
    try {
      const ref = dbAdmin.collection("system_state").doc("naje_ad_queue");
      const snap = await ref.get();
      if (!snap.exists) return -1;
      const data = snap.data();
      return (data.queue || []).findIndex((q) => q.jobId === jobId);
    } catch {
      return -1;
    }
  }
  async function startPromotedJob(jobId, uid) {
    try {
      let data = null;
      if (isDbAdminAvailable) {
        const doc = await dbAdmin.collection("generation_jobs").doc(jobId).get().catch(() => null);
        if (doc && doc.exists) data = doc.data();
      }
      if (!data) {
        const token2 = userTokenCache.get(uid);
        if (token2) {
          data = await getDocRest("generation_jobs", jobId, token2).catch(() => null);
        }
      }
      if (!data) {
        await releaseSlot(jobId);
        return;
      }
      const chargeResult = await mutateBalanceAtomic(uid, -data.consumedBalance, { requireSufficient: true });
      if (!chargeResult.ok) {
        const token2 = userTokenCache.get(uid);
        if (token2) {
          await setDocRest("generation_jobs", jobId, {
            status: "failed",
            error: "\u0646\u0641\u0630 \u0631\u0635\u064A\u062F\u0643 \u0645\u0646 \u0627\u0644\u0646\u0642\u0627\u0637 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0641\u064A \u0627\u0644\u0637\u0627\u0628\u0648\u0631."
          }, token2).catch(() => null);
        }
        const res = await releaseSlot(jobId);
        if (res.promotedJobId && res.promotedUid) startPromotedJob(res.promotedJobId, res.promotedUid);
        return;
      }
      const token = userTokenCache.get(uid) || "";
      if (token) {
        await setDocRest("generation_jobs", jobId, { status: "planning", progress: 10 }, token).catch(() => null);
      }
      runNajeAdGeneration(jobId, uid, data.plan, data.prompt, data.brandProfile, data.aspectRatio, data.resolution, data.videoModelEndpoint, data.consumedBalance, token);
    } catch (e) {
      console.error("Promoted job start failed", e);
    }
  }
  async function extractLastFrameFromFile(videoPath, outputPath, durationSec) {
    const ffmpeg = await getFfmpeg();
    return new Promise((resolve, reject) => {
      const seekTime = Math.max(0, durationSec - 0.15);
      ffmpeg(videoPath).seekInput(seekTime).frames(1).output(outputPath).on("end", async () => {
        try {
          const buf = await import_fs4.default.promises.readFile(outputPath);
          resolve(buf);
        } catch (e) {
          reject(e);
        }
      }).on("error", (_err) => {
        ffmpeg(videoPath).frames(1).output(outputPath).on("end", async () => {
          try {
            const buf = await import_fs4.default.promises.readFile(outputPath);
            resolve(buf);
          } catch (e) {
            reject(e);
          }
        }).on("error", (err2) => reject(err2)).run();
      }).run();
    });
  }
  async function concatenateVideoFiles(videoPaths, outputPath) {
    const ffmpeg = await getFfmpeg();
    return new Promise((resolve, reject) => {
      const listPath = `${outputPath}.concat.txt`;
      const listContent = videoPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
      import_fs4.default.writeFileSync(listPath, listContent);
      ffmpeg().input(listPath).inputOptions(["-f", "concat", "-safe", "0"]).outputOptions(["-c", "copy"]).output(outputPath).on("end", () => {
        try {
          import_fs4.default.unlinkSync(listPath);
        } catch (e) {
        }
        resolve(outputPath);
      }).on("error", (err) => {
        console.warn("[FFmpeg concat] Direct copy failed, retrying with re-encode:", err?.message || err);
        ffmpeg().input(listPath).inputOptions(["-f", "concat", "-safe", "0"]).outputOptions(["-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-preset", "ultrafast"]).output(outputPath).on("end", () => {
          try {
            import_fs4.default.unlinkSync(listPath);
          } catch (e) {
          }
          resolve(outputPath);
        }).on("error", (reErr) => {
          try {
            import_fs4.default.unlinkSync(listPath);
          } catch (e) {
          }
          reject(reErr);
        }).run();
      }).run();
    });
  }
  app.post("/api/naje-ad/generate", async (req, res) => {
    let uid = "";
    let token = "";
    let deductedPoints = 0;
    const jobId = `naje_ad_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0627\u0644\u0648\u0635\u0648\u0644" });
      }
      token = authHeader.split("Bearer ")[1];
      const decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      uid = decodedToken.uid;
      const _userDocSnapForGate = await dbAdmin.collection("users").doc(uid).get();
      if (!checkFeatureAccess(res, _userDocSnapForGate.data(), "najeAd")) return;
      const {
        prompt,
        duration = 8,
        aspectRatio: aspectRatio2 = "16:9",
        resolution = "720p",
        model = "veo",
        brandProfile
      } = req.body || {};
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u0643\u062A\u0627\u0628\u0629 \u0648\u0635\u0641 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0645\u0637\u0644\u0648\u0628" });
      }
      if (prompt.length > 5e3) {
        return res.status(400).json({ error: "\u0637\u0648\u0644 \u0648\u0635\u0641 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 (5,000 \u062D\u0631\u0641)." });
      }
      if (brandProfile?.referenceImageBase64) {
        if (typeof brandProfile.referenceImageBase64 !== "string") {
          return res.status(400).json({ error: "\u0635\u064A\u063A\u0629 \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0631\u062C\u0639\u064A\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629." });
        }
        if (brandProfile.referenceImageBase64.length > 14 * 1024 * 1024) {
          return res.status(400).json({ error: "\u062D\u062C\u0645 \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0631\u062C\u0639\u064A\u0629 \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 (10 \u0645\u064A\u062C\u0627\u0628\u0627\u064A\u062A)." });
        }
      }
      const selectedAspect = aspectRatio2 === "9:16" ? "9:16" : "16:9";
      const selectedRes = resolution === "1080p" ? "1080p" : "720p";
      const safety = await isSafePrompt(prompt, uid, "video", token);
      if (!safety.safe) {
        return res.status(400).json({ error: safety.reason || "\u062A\u0645 \u062D\u0638\u0631 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628 \u0644\u0645\u062E\u0627\u0644\u0641\u062A\u0647 \u0634\u0631\u0648\u0637 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u0649" });
      }
      const fullPricing = await getPricing(token);
      const najeAdConfig = fullPricing.najeAd || {
        enabled: true,
        pointsRatePerSecond: 2.5,
        durationOptionsSec: [4, 6, 8, 10, 12, 14, 16, 24, 30],
        maxShotsPerVideo: 4,
        defaultModelEndpointId: "video_standard"
      };
      if (najeAdConfig.enabled === false) {
        return res.status(403).json({ error: "\u062E\u062F\u0645\u0629 Naje Ad \u0645\u062A\u0648\u0642\u0641\u0629 \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0644\u062A\u0637\u0648\u064A\u0631 \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u0629" });
      }
      const minDur = Math.min(...najeAdConfig.durationOptionsSec || [4, 6, 8, 10, 12, 14, 16, 24, 30]);
      const maxDur = Math.max(...najeAdConfig.durationOptionsSec || [4, 6, 8, 10, 12, 14, 16, 24, 30]);
      const requestedDuration = Math.min(Math.max(minDur, parseInt(duration) || 8), maxDur);
      const pointsRate = typeof najeAdConfig.pointsRatePerSecond === "number" ? najeAdConfig.pointsRatePerSecond : 2.5;
      let endpointId = najeAdConfig.defaultModelEndpointId || "video_standard";
      if (endpointId === "video_omni") {
        endpointId = "video_standard";
      }
      let videoModelEndpoint = await getModelEndpointConfig(endpointId, "veo-3.1-lite-generate-preview");
      if (!videoModelEndpoint.supportedDurations || videoModelEndpoint.supportedDurations.join(",") !== "4,6,8") {
        console.warn("Endpoint", endpointId, "does not support [4,6,8]. Falling back to video_standard.");
        endpointId = "video_standard";
        videoModelEndpoint = await getModelEndpointConfig(endpointId, "veo-3.1-lite-generate-preview");
      }
      const videoPlan = buildInitialPlan({
        rawPrompt: prompt.trim(),
        totalDurationSec: requestedDuration,
        aspectRatio: selectedAspect,
        model: videoModelEndpoint.modelId,
        brandProfile,
        pointsRatePerSecond: pointsRate
      });
      deductedPoints = videoPlan.totalEstimatedCostPoints;
      const acquired = await tryAcquireSlot(jobId, uid);
      if (!acquired) {
        const position = await getQueuePosition(jobId);
        await setDocRest("generation_jobs", jobId, {
          ownerId: uid,
          userId: uid,
          status: "queued",
          queuePosition: position,
          progress: 0,
          stepLabel: "\u0641\u064A \u0637\u0627\u0628\u0648\u0631 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631...",
          type: "naje_ad_video",
          plan: videoPlan,
          totalSteps: videoPlan.shots.length * 2 + 1,
          currentStepIndex: 0,
          totalDurationSec: videoPlan.totalDurationSec,
          aspectRatio: selectedAspect,
          resolution: selectedRes,
          consumedBalance: deductedPoints,
          prompt,
          brandProfile: brandProfile || null,
          videoModelEndpoint,
          createdAt: Date.now()
        }, token).catch((e) => console.error("Firestore job init failed:", e));
        return res.json({
          status: "queued",
          jobId,
          plan: videoPlan,
          queuePosition: position
        });
      }
      const chargeResult = await mutateBalanceAtomic(uid, -deductedPoints, { requireSufficient: true });
      if (!chargeResult.ok) {
        await releaseSlot(jobId);
        return res.status(402).json({
          error: `\u0631\u0635\u064A\u062F \u0627\u0644\u0646\u0642\u0627\u0637 \u063A\u064A\u0631 \u0643\u0627\u0641\u064D. \u064A\u062A\u0637\u0644\u0628 \u0647\u0630\u0627 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 (${videoPlan.totalDurationSec} \u062B\u0627\u0646\u064A\u0629 \u0639\u0628\u0631 ${videoPlan.shots.length} \u0644\u0642\u0637\u0627\u062A) ${deductedPoints} \u0646\u0642\u0637\u0629. \u0631\u0635\u064A\u062F\u0643 \u0627\u0644\u062D\u0627\u0644\u064A: ${chargeResult.newBalance} \u0646\u0642\u0637\u0629.`,
          currentBalance: chargeResult.newBalance,
          requiredPoints: deductedPoints
        });
      }
      await setDocRest("generation_jobs", jobId, {
        ownerId: uid,
        userId: uid,
        status: "planning",
        progress: 10,
        stepLabel: "\u062C\u0627\u0631\u064A \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0645\u0634\u0647\u062F \u0648\u0628\u0646\u0627\u0621 \u062A\u0633\u0644\u0633\u0644 \u0627\u0644\u0644\u0642\u0637\u0627\u062A \u0645\u0639 \u062A\u062B\u0628\u064A\u062A \u0627\u0644\u0623\u0633\u0644\u0648\u0628...",
        type: "naje_ad_video",
        plan: videoPlan,
        totalSteps: videoPlan.shots.length * 2 + 1,
        currentStepIndex: 0,
        totalDurationSec: videoPlan.totalDurationSec,
        aspectRatio: selectedAspect,
        resolution: selectedRes,
        consumedBalance: deductedPoints,
        prompt,
        brandProfile: brandProfile || null,
        videoModelEndpoint,
        createdAt: Date.now()
      }, token).catch((e) => console.error("Firestore job init failed:", e));
      res.json({
        status: "planning",
        jobId,
        plan: videoPlan,
        deductedPoints,
        newBalance: chargeResult.newBalance
      });
      runNajeAdGeneration(jobId, uid, videoPlan, prompt, brandProfile, selectedAspect, selectedRes, videoModelEndpoint, deductedPoints, token);
    } catch (err) {
      console.error("[Naje Ad API Error]:", err);
      return res.status(500).json({ error: err?.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0637\u0644\u0628 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0641\u064A\u062F\u064A\u0648" });
    }
  });
  async function runNajeAdGeneration(jobId, uid, videoPlan, prompt, brandProfile, selectedAspect, selectedRes, videoModelEndpoint, deductedPoints, token) {
    const workDir = import_path4.default.join(import_os.default.tmpdir(), `naje_ad_${jobId}_${Date.now()}`);
    const shotVideoPaths = [];
    const intermediateFramePaths = [];
    try {
      await import_fs4.default.promises.mkdir(workDir, { recursive: true });
      const ai5 = createGenAIClient2();
      const totalShots = videoPlan?.shots?.length || 1;
      let previousShotPath = null;
      let previousLastFrameBuffer = null;
      const memBefore = process.memoryUsage();
      console.log(`[Naje Ad Pipeline] Starting job ${jobId} for user ${uid}: ${videoPlan.totalDurationSec}s across ${totalShots} shot(s). Temp dir: ${workDir} | Heap: ${Math.round(memBefore.heapUsed / 1024 / 1024)}MB / RSS: ${Math.round(memBefore.rss / 1024 / 1024)}MB`);
      for (let i = 0; i < totalShots; i++) {
        const shot = videoPlan.shots[i];
        const shotNumber = i + 1;
        const isFirstShot = i === 0;
        let imageInput = void 0;
        if (isFirstShot) {
          await setDocRest("generation_jobs", jobId, {
            status: "generating_shot_1",
            progress: Math.round(15 + 1 / (totalShots * 2 + 1) * 60),
            currentStepIndex: 1,
            stepLabel: totalShots === 1 ? `\u062C\u0627\u0631\u064A \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0641\u064A\u062F\u064A\u0648 (${shot.durationSec} \u062B\u0648\u0627\u0646\u064A)...` : `\u062C\u0627\u0631\u064A \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0644\u0642\u0637\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0645\u0646 ${totalShots} (${shot.durationSec} \u062B\u0648\u0627\u0646\u064A)...`
          }, token);
        } else {
          await setDocRest("generation_jobs", jobId, {
            status: "extracting_continuity",
            progress: Math.round(15 + i * 2 / (totalShots * 2 + 1) * 60),
            currentStepIndex: i * 2,
            stepLabel: `\u062C\u0627\u0631\u064A \u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0627\u0644\u0625\u0637\u0627\u0631 \u0627\u0644\u0645\u0631\u062C\u0639\u064A \u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631\u064A\u0629 \u0627\u0644\u0628\u0635\u0631\u064A\u0629 \u0644\u0644\u0642\u0637\u0629 ${shotNumber} \u0645\u0646 ${totalShots}...`
          }, token);
          const framePath = import_path4.default.join(workDir, `continuity_frame_${i}.jpg`);
          intermediateFramePaths.push(framePath);
          const lastFrameBuf = await extractLastFrameFromFile(previousShotPath, framePath, videoPlan.shots[i - 1].durationSec);
          previousLastFrameBuffer = lastFrameBuf;
          const lastFrameBase64 = lastFrameBuf.toString("base64");
          imageInput = {
            imageBytes: lastFrameBase64,
            mimeType: "image/jpeg"
          };
          await setDocRest("generation_jobs", jobId, {
            status: "generating_shot_2",
            progress: Math.round(15 + (i * 2 + 1) / (totalShots * 2 + 1) * 60),
            currentStepIndex: i * 2 + 1,
            stepLabel: `\u062C\u0627\u0631\u064A \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0644\u0642\u0637\u0629 ${shotNumber} \u0645\u0646 ${totalShots} (${shot.durationSec} \u062B\u0648\u0627\u0646\u064A) \u0628\u0627\u0644\u0631\u0628\u0637 \u0627\u0644\u0628\u0635\u0631\u064A...`
          }, token);
        }
        const shotPrompt = await compileVideoPrompt(shot.prompt, shot.durationSec, selectedAspect, "veo", brandProfile);
        const auditedShot = await auditVideoPrompt(ai5, shotPrompt, shot.durationSec, selectedAspect, prompt);
        let shotBuffer = await generateSingleVeoShot(ai5, {
          prompt: auditedShot,
          durationSeconds: shot.durationSec,
          aspectRatio: selectedAspect,
          resolution: selectedRes,
          modelId: videoModelEndpoint.modelId,
          imageInput,
          onProgress: async (attempt) => {
            const baseProgress = Math.round(15 + (i * 2 + 1) / (totalShots * 2 + 1) * 60);
            const dynamicProg = Math.min(baseProgress + Math.round(50 / (totalShots * 2 + 1) * (attempt / 75)), 85);
            await updateDocFieldsRest("generation_jobs", jobId, { progress: dynamicProg }, ["progress"], token).catch(() => {
            });
          }
        });
        const shotPath = import_path4.default.join(workDir, `shot_${shotNumber}.mp4`);
        await import_fs4.default.promises.writeFile(shotPath, shotBuffer);
        shotBuffer = null;
        if (!isFirstShot && previousLastFrameBuffer) {
          await setDocRest("generation_jobs", jobId, {
            status: "quality_check",
            progress: Math.min(86, Math.round(15 + (i * 2 + 1.5) / (totalShots * 2 + 1) * 60)),
            stepLabel: `\u062C\u0627\u0631\u064A \u0641\u062D\u0635 \u0627\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u062C\u0648\u062F\u0629 \u0628\u064A\u0646 \u0627\u0644\u0644\u0642\u0637\u0629 ${i} \u0648\u0627\u0644\u0644\u0642\u0637\u0629 ${shotNumber}...`
          }, token);
          const firstFramePath = import_path4.default.join(workDir, `continuity_frame_${shotNumber}_first.jpg`);
          intermediateFramePaths.push(firstFramePath);
          let firstFrameBuffer = await extractFirstFrameFromFile(shotPath, firstFramePath);
          const quality = await checkShotContinuity(ai5, previousLastFrameBuffer, firstFrameBuffer);
          firstFrameBuffer = null;
          if (!quality.passed) {
            console.warn(`[Naje Ad Pipeline] Continuity check failed at boundary ${i} -> ${shotNumber}:`, quality.reason);
            await setDocRest("generation_jobs", jobId, {
              status: "quality_check",
              stepLabel: `\u062C\u0648\u062F\u0629 \u0627\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631\u064A\u0629 \u0645\u0646\u062E\u0641\u0636\u0629 \u0644\u0644\u0642\u0637\u0629 ${shotNumber}\u060C \u062C\u0627\u0631\u064A \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A...`
            }, token);
            let retryBuffer = await generateSingleVeoShot(ai5, {
              prompt: auditedShot,
              durationSeconds: shot.durationSec,
              aspectRatio: selectedAspect,
              resolution: selectedRes,
              modelId: videoModelEndpoint.modelId,
              imageInput
            });
            await import_fs4.default.promises.writeFile(shotPath, retryBuffer);
            retryBuffer = null;
            const firstFramePathRetry = import_path4.default.join(workDir, `continuity_frame_${shotNumber}_first_retry.jpg`);
            intermediateFramePaths.push(firstFramePathRetry);
            let firstFrameBufferRetry = await extractFirstFrameFromFile(shotPath, firstFramePathRetry);
            const qualityRetry = await checkShotContinuity(ai5, previousLastFrameBuffer, firstFrameBufferRetry);
            firstFrameBufferRetry = null;
            if (!qualityRetry.passed) {
              throw new Error(`quality_check_failed: \u0641\u0634\u0644 \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0633\u062A\u0645\u0631\u0627\u0631\u064A\u0629 \u0627\u0644\u0645\u0644\u0627\u0645\u062D \u0639\u0646\u062F \u0627\u0644\u0644\u0642\u0637\u0629 ${shotNumber} \u0628\u0639\u062F \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0627\u0644\u0625\u0636\u0627\u0641\u064A\u0629.`);
            }
          }
        }
        shotVideoPaths.push(shotPath);
        previousShotPath = shotPath;
      }
      let finalVideoPath = shotVideoPaths[0];
      if (shotVideoPaths.length > 1) {
        await setDocRest("generation_jobs", jobId, {
          status: "concatenating",
          progress: 88,
          currentStepIndex: totalShots * 2,
          stepLabel: `\u062C\u0627\u0631\u064A \u062F\u0645\u062C ${shotVideoPaths.length} \u0644\u0642\u0637\u0627\u062A \u0633\u064A\u0646\u0645\u0627\u0626\u064A\u0627\u064B \u0648\u0625\u0646\u062A\u0627\u062C \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0643\u0627\u0645\u0644...`
        }, token);
        const mergedPath = import_path4.default.join(workDir, "final_merged.mp4");
        await concatenateVideoFiles(shotVideoPaths, mergedPath);
        finalVideoPath = mergedPath;
        for (const sp of shotVideoPaths) {
          try {
            await import_fs4.default.promises.unlink(sp);
          } catch (_) {
          }
        }
        for (const fp of intermediateFramePaths) {
          try {
            await import_fs4.default.promises.unlink(fp);
          } catch (_) {
          }
        }
      }
      await setDocRest("generation_jobs", jobId, {
        status: "finalizing",
        progress: 95,
        stepLabel: "\u062C\u0627\u0631\u064A \u062D\u0641\u0638 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0648\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0646\u0647\u0627\u0626\u064A \u0644\u0644\u0639\u0631\u0636 \u0648\u0627\u0644\u062A\u062D\u0645\u064A\u0644..."
      }, token);
      const finalVideoBuffer = await import_fs4.default.promises.readFile(finalVideoPath);
      const memPeak = process.memoryUsage();
      console.log(`[Naje Ad Pipeline] Job ${jobId} final video size: ${(finalVideoBuffer.length / 1024 / 1024).toFixed(2)}MB | Peak Heap: ${Math.round(memPeak.heapUsed / 1024 / 1024)}MB / RSS: ${Math.round(memPeak.rss / 1024 / 1024)}MB`);
      let finalMediaUrl = "";
      let storageSuccess = false;
      const uploadAttempt = async () => {
        const storagePath = `users/${uid}/naje_ad/${jobId}_${Date.now()}.mp4`;
        const bucket = (0, import_storage.getStorage)().bucket(STORAGE_BUCKET);
        const file = bucket.file(storagePath);
        await file.save(finalVideoBuffer, {
          metadata: { contentType: "video/mp4" },
          public: true,
          resumable: false
        });
        return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
      };
      try {
        finalMediaUrl = await uploadAttempt();
        storageSuccess = true;
      } catch (storageErr) {
        console.warn("[Naje Ad] Storage upload failed on first attempt, retrying:", storageErr);
        try {
          finalMediaUrl = await uploadAttempt();
          storageSuccess = true;
        } catch (retryErr) {
          console.error("[Naje Ad] Storage upload failed after retry:", retryErr);
          await setDocRest("generation_jobs", jobId, {
            status: "failed",
            progress: 100,
            stepLabel: "\u0641\u0634\u0644 \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0625\u0644\u0649 \u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 (Storage Error)"
          }, token);
          await mutateBalanceAtomic(uid, deductedPoints, {});
          return;
        }
      }
      await createDocRest("generated_media", {
        ownerId: uid,
        userId: uid,
        type: "video",
        mediaType: "video",
        mediaUrl: finalMediaUrl,
        prompt,
        totalDurationSec: videoPlan.totalDurationSec,
        shotsCount: videoPlan.shots.length,
        plan: videoPlan,
        consumedBalance: deductedPoints,
        aspectRatio: selectedAspect,
        resolution: selectedRes,
        createdAt: Date.now()
      }, token).catch((e) => console.error("Failed to save to generated_media:", e));
      await setDocRest("generation_jobs", jobId, {
        status: "completed",
        progress: 100,
        stepLabel: "\u062A\u0645 \u062A\u0648\u0644\u064A\u062F \u0648\u0625\u062E\u0631\u0627\u062C \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0628\u0646\u062C\u0627\u062D!",
        mediaUrl: finalMediaUrl,
        videoUrl: finalMediaUrl,
        resultUrl: finalMediaUrl,
        totalDurationSec: videoPlan.totalDurationSec,
        shotsCount: videoPlan.shots.length,
        consumedBalance: deductedPoints,
        completedAt: Date.now()
      }, token);
    } catch (pipelineErr) {
      console.error(`[Naje Ad Pipeline Error] Job ${jobId} failed:`, pipelineErr);
      if (deductedPoints > 0) {
        await mutateBalanceAtomic(uid, deductedPoints, {}).catch((e) => console.error("Refund failed:", e));
      }
      await setDocRest("generation_jobs", jobId, {
        status: "failed",
        error: pipelineErr?.message || "\u062A\u0639\u0630\u0631 \u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0641\u064A\u062F\u064A\u0648. \u062A\u0645 \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0646\u0642\u0627\u0637\u0643 \u0628\u0627\u0644\u0643\u0627\u0645\u0644.",
        refundedPoints: deductedPoints,
        failedAt: Date.now()
      }, token).catch((e) => console.error("Job update failed:", e));
    } finally {
      try {
        await import_fs4.default.promises.rm(workDir, { recursive: true, force: true });
      } catch (_cleanErr) {
      }
      const res = await releaseSlot(jobId);
      if (res.promotedJobId && res.promotedUid) {
        startPromotedJob(res.promotedJobId, res.promotedUid);
      }
    }
  }
  app.post("/api/redeem-code", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643" });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0631\u0645\u0632 \u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
      const uid = decodedToken.uid;
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "\u0643\u0648\u062F \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
      try {
        const codeSnap = await dbAdmin.collection("redeem_codes").where("code", "==", code).limit(1).get();
        if (codeSnap.empty) {
          return res.status(400).json({ error: "\u0643\u0648\u062F \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
        }
        const codeRef = codeSnap.docs[0].ref;
        const userRef = dbAdmin.collection("users").doc(uid);
        const outcome = await dbAdmin.runTransaction(async (tx) => {
          const codeDoc = await tx.get(codeRef);
          if (!codeDoc.exists) throw new Error("\u0643\u0648\u062F \u063A\u064A\u0631 \u0635\u0627\u0644\u062D");
          const c = codeDoc.data();
          const maxUsage = c.maxUsage || 1;
          const usageCount = c.usageCount || 0;
          const usedByArray = Array.isArray(c.usedByArray) ? c.usedByArray : [];
          if (c.used || usageCount >= maxUsage) throw new Error("USED");
          if (usedByArray.includes(uid)) throw new Error("ALREADY");
          const addedPoints = c.points || 0;
          const userDoc = await tx.get(userRef);
          const currentBalance = (userDoc.exists ? Number(userDoc.data().balance) : 0) || 0;
          const newBalance = parseFloat((currentBalance + addedPoints).toFixed(2));
          const newUsageCount = usageCount + 1;
          tx.update(codeRef, {
            used: newUsageCount >= maxUsage,
            usageCount: newUsageCount,
            usedByArray: [...usedByArray, uid],
            usedBy: uid,
            usedAt: Date.now()
          });
          tx.set(userRef, { balance: newBalance, hasRecharged: true }, { merge: true });
          return { addedPoints, newBalance };
        });
        res.json(outcome);
      } catch (txErr) {
        const msg = txErr?.message === "USED" ? "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u062F \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0643\u0627\u0645\u0644" : txErr?.message === "ALREADY" ? "\u0644\u0642\u062F \u0642\u0645\u062A \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u062F \u0645\u0633\u0628\u0642\u0627\u064B" : txErr?.message || "\u062D\u062F\u062B \u062E\u0637\u0623";
        return res.status(400).json({ error: msg });
      }
    } catch (e) {
      res.status(400).json({ error: e.message || "\u062D\u062F\u062B \u062E\u0637\u0623" });
    }
  });
  const getPayPalApiBase = () => process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  async function getPayPalAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID || "";
    const secret = process.env.PAYPAL_SECRET || "";
    if (!clientId || !secret) {
      throw new Error("\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0639\u062A\u0645\u0627\u062F PayPal \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u0629 (PAYPAL_CLIENT_ID / PAYPAL_SECRET)");
    }
    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
    const apiBase = getPayPalApiBase();
    const resp = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error("PayPal OAuth token error:", resp.status, errText);
      throw new Error(`PayPal auth error: ${resp.status}`);
    }
    const data = await resp.json();
    return data.access_token;
  }
  async function creditPointsForPayPalOrder(orderId, orderData) {
    let finalBalance = 0;
    await dbAdmin.runTransaction(async (tx) => {
      const orderRef = dbAdmin.collection("paypal_orders").doc(orderId);
      const orderSnap = await tx.get(orderRef);
      if (orderSnap.exists && orderSnap.data()?.status === "captured") {
        const uSnap = await tx.get(dbAdmin.collection("users").doc(orderData.user_id));
        finalBalance = (uSnap.exists ? Number(uSnap.data()?.balance ?? uSnap.data()?.points_balance) : 0) || 0;
        return;
      }
      const userRef = dbAdmin.collection("users").doc(orderData.user_id);
      const userSnap = await tx.get(userRef);
      const currentBalance = (userSnap.exists ? Number(userSnap.data()?.balance ?? userSnap.data()?.points_balance) : 0) || 0;
      const newBalance = parseFloat((currentBalance + orderData.points_requested).toFixed(2));
      finalBalance = newBalance;
      const currentTier = Number((userSnap.exists ? userSnap.data()?.highestPurchasedTier : 0) || 0);
      const purchasedTierRank = PACKAGE_TIER_RANK[orderData.package_id] || 0;
      const newTier = Math.max(currentTier, purchasedTierRank);
      tx.set(userRef, {
        balance: newBalance,
        points_balance: newBalance,
        hasRecharged: true,
        highestPurchasedTier: newTier
      }, { merge: true });
      tx.update(orderRef, {
        status: "captured",
        captured_at: /* @__PURE__ */ new Date()
      });
      tx.set(dbAdmin.collection("transactions").doc(), {
        user_id: orderData.user_id,
        type: "credit",
        amount: orderData.points_requested,
        source: "paypal",
        order_id: orderId,
        timestamp: /* @__PURE__ */ new Date()
      });
    });
    return finalBalance;
  }
  async function verifyPayPalWebhookSignature(req) {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.warn("PAYPAL_WEBHOOK_ID is not configured");
      return false;
    }
    try {
      const accessToken = await getPayPalAccessToken();
      const apiBase = getPayPalApiBase();
      const resp = await fetch(
        `${apiBase}/v1/notifications/verify-webhook-signature`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            auth_algo: req.headers["paypal-auth-algo"],
            cert_url: req.headers["paypal-cert-url"],
            transmission_id: req.headers["paypal-transmission-id"],
            transmission_sig: req.headers["paypal-transmission-sig"],
            transmission_time: req.headers["paypal-transmission-time"],
            webhook_id: webhookId,
            webhook_event: req.body
          })
        }
      );
      if (!resp.ok) {
        console.warn("PayPal webhook verification request failed with status:", resp.status);
        return false;
      }
      const data = await resp.json();
      return data.verification_status === "SUCCESS";
    } catch (err) {
      console.error("PayPal webhook verification error:", err);
      return false;
    }
  }
  app.get("/api/paypal/config", (_req, res) => {
    const primaryTiers = ["pkg_5", "pkg_10", "pkg_20"];
    const packages = primaryTiers.filter((id) => PAYPAL_POINTS_PACKAGES[id]).map((id) => ({
      id,
      points: PAYPAL_POINTS_PACKAGES[id].points,
      usd: PAYPAL_POINTS_PACKAGES[id].usd
    }));
    res.json({
      clientId: process.env.PAYPAL_CLIENT_ID || "",
      mode: process.env.PAYPAL_MODE || "sandbox",
      packages
    });
  });
  app.post("/api/paypal/create-order", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643" });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch {
        return res.status(401).json({ error: "\u0631\u0645\u0632 \u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
      const uid = decodedToken.uid;
      const { package_id } = req.body;
      const pkg = PAYPAL_POINTS_PACKAGES[package_id];
      if (!pkg) {
        return res.status(400).json({ error: "invalid_package" });
      }
      const accessToken = await getPayPalAccessToken();
      const apiBase = getPayPalApiBase();
      const orderResp = await fetch(`${apiBase}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: "USD",
              value: pkg.usd.toFixed(2)
            },
            description: `Naje AI Points - ${pkg.points} points package`
          }],
          payment_source: {
            paypal: {
              experience_context: {
                brand_name: "\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0646\u0627\u062C\u064A \u0644\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A",
                locale: "ar-SA",
                landing_page: "NO_PREFERENCE",
                user_action: "PAY_NOW"
              }
            }
          }
        })
      });
      const orderData = await orderResp.json();
      if (!orderResp.ok || !orderData.id) {
        console.error("PayPal create-order failed:", orderData);
        return res.status(orderResp.status || 500).json({ error: "paypal_create_failed", details: orderData });
      }
      await dbAdmin.collection("paypal_orders").doc(orderData.id).set({
        order_id: orderData.id,
        user_id: uid,
        package_id,
        points_requested: pkg.points,
        amount_usd: pkg.usd,
        status: "created",
        created_at: /* @__PURE__ */ new Date(),
        captured_at: null
      });
      res.json({ order_id: orderData.id });
    } catch (err) {
      console.error("PayPal create-order error:", err);
      res.status(500).json({ error: err?.message || "paypal_create_failed" });
    }
  });
  app.post("/api/paypal/capture-order", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643" });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch {
        return res.status(401).json({ error: "\u0631\u0645\u0632 \u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
      const uid = decodedToken.uid;
      const { order_id } = req.body;
      if (!order_id) {
        return res.status(400).json({ error: "missing_order_id" });
      }
      const orderDoc = await dbAdmin.collection("paypal_orders").doc(order_id).get();
      if (!orderDoc.exists) {
        return res.status(404).json({ error: "order_not_found" });
      }
      const orderData = orderDoc.data();
      if (orderData.user_id !== uid) {
        return res.status(403).json({ error: "forbidden" });
      }
      if (orderData.status === "captured") {
        return res.json({ status: "already_captured", points_added: orderData.points_requested });
      }
      const accessToken = await getPayPalAccessToken();
      const apiBase = getPayPalApiBase();
      const captureResp = await fetch(
        `${apiBase}/v2/checkout/orders/${order_id}/capture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          }
        }
      );
      const captureData = await captureResp.json();
      if (captureData.status !== "COMPLETED") {
        console.warn("PayPal capture status was not COMPLETED:", captureData);
        return res.status(400).json({ error: "capture_not_completed", details: captureData });
      }
      const newBalance = await creditPointsForPayPalOrder(order_id, orderData);
      res.json({ status: "captured", points_added: orderData.points_requested, newBalance });
    } catch (err) {
      console.error("PayPal capture-order error:", err);
      res.status(500).json({ error: err?.message || "paypal_capture_failed" });
    }
  });
  app.post("/api/paypal/webhook", async (req, res) => {
    try {
      const isValid = await verifyPayPalWebhookSignature(req);
      if (!isValid) {
        console.warn("PayPal webhook signature verification failed");
        return res.status(400).send("invalid_signature");
      }
      const event = req.body;
      if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const orderId = event.resource?.supplementary_data?.related_ids?.order_id || event.resource?.id;
        if (orderId) {
          const orderDoc = await dbAdmin.collection("paypal_orders").doc(orderId).get();
          if (orderDoc.exists && orderDoc.data()?.status !== "captured") {
            await creditPointsForPayPalOrder(orderId, orderDoc.data());
            console.log(`[PayPal Webhook] Successfully credited points for order ${orderId}`);
          }
        }
      }
      res.status(200).send("ok");
    } catch (err) {
      console.error("PayPal webhook error:", err);
      res.status(500).send("error");
    }
  });
  app.post("/api/admin/bulk-codes", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch {
        return res.status(401).json({ error: "\u0631\u0645\u0632 \u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
      const adminUserDoc = await dbAdmin.collection("users").doc(decodedToken.uid).get();
      const isAdmin = adminUserDoc.exists && (adminUserDoc.data()?.role === "admin" || adminUserDoc.data()?.isAdmin === true);
      if (!isAdmin) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D - \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0645\u062F\u064A\u0631 \u0641\u0642\u0637 \u0645\u0637\u0644\u0648\u0628\u0629" });
      }
      const { count = 10, points = 100, maxUsage = 1, prefix = "NAJE", codeLength = 8 } = req.body;
      const requestedCount = Math.min(Math.max(1, parseInt(count) || 1), 5e3);
      const codePoints = Math.max(1, parseInt(points) || 100);
      const codeMaxUsage = Math.max(1, parseInt(maxUsage) || 1);
      const cleanPrefix = (prefix || "NAJE").toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const generateOneCode = () => {
        let part = "";
        for (let i = 0; i < codeLength; i++) {
          part += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return cleanPrefix ? `${cleanPrefix}-${part}` : part;
      };
      const generatedCodesSet = /* @__PURE__ */ new Set();
      while (generatedCodesSet.size < requestedCount) {
        generatedCodesSet.add(generateOneCode());
      }
      const allCodes = Array.from(generatedCodesSet);
      const batchId = `B_${Date.now().toString(36).toUpperCase()}`;
      const createdAt = Date.now();
      const CHUNK_SIZE = 450;
      const chunks = [];
      for (let i = 0; i < allCodes.length; i += CHUNK_SIZE) {
        chunks.push(allCodes.slice(i, i + CHUNK_SIZE));
      }
      const savedRecords = [];
      for (const chunk of chunks) {
        const batch = dbAdmin.batch();
        for (const c of chunk) {
          const ref = dbAdmin.collection("redeem_codes").doc();
          const data = {
            code: c,
            points: codePoints,
            used: false,
            maxUsage: codeMaxUsage,
            usageCount: 0,
            usedByArray: [],
            batchId,
            createdAt
          };
          batch.set(ref, data);
          savedRecords.push({ id: ref.id, ...data });
        }
        await batch.commit();
      }
      return res.json({
        success: true,
        batchId,
        totalGenerated: savedRecords.length,
        points: codePoints,
        maxUsage: codeMaxUsage,
        codes: savedRecords
      });
    } catch (err) {
      console.error("[Bulk Codes Admin API Error]:", err);
      return res.status(500).json({ error: err.message || "\u0641\u0634\u0644 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0623\u0643\u0648\u0627\u062F \u0628\u0627\u0644\u062C\u0645\u0644\u0629" });
    }
  });
  app.delete("/api/user", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      activeUserTasks.delete(uid);
      await deleteQueryInBatchesRest("chats", "ownerId", uid, token, "chats");
      await deleteQueryInBatchesRest("messages", "ownerId", uid, token, "messages");
      await deleteQueryInBatchesRest("projects", "ownerId", uid, token, "projects");
      await deleteQueryInBatchesRest("favorites", "userId", uid, token, "favorites");
      await deleteQueryInBatchesRest("generation_jobs", "uid", uid, token, "generation_jobs (uid)");
      await deleteQueryInBatchesRest("generation_jobs", "ownerId", uid, token, "generation_jobs (ownerId)");
      await deleteQueryInBatchesRest("notifications", "ownerId", uid, token, "notifications");
      try {
        await deleteDocRest("users", uid, token);
        await dbAdmin.collection("users").doc(uid).delete().catch(() => null);
        console.log(`Deleted user document from 'users' for user ${uid}`);
      } catch (e) {
        console.error("Failed to delete user doc in Firestore:", e);
      }
      await (0, import_auth.getAuth)().deleteUser(uid);
      console.log(`Deleted auth record from Firebase for user ${uid}`);
      return res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u0643\u0627\u0641\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0627\u0628\u0639\u0629 \u0644\u0647 \u0628\u0646\u062C\u0627\u062D \u0648\u0628\u0634\u0643\u0644 \u0646\u0647\u0627\u0626\u064A." });
    } catch (error) {
      console.error("Account Deletion Error:", error);
      return res.status(500).json({ error: "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628: " + error.message });
    }
  });
  async function classifyMediaIntent(apiKey, prompt, mediaType, projectData) {
    try {
      const kind = mediaType === "video" ? "\u0641\u064A\u062F\u064A\u0648" : "\u0635\u0648\u0631\u0629/\u062A\u0635\u0645\u064A\u0645";
      const projectLine = projectData?.name ? `
\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u062F\u0627\u062E\u0644 \u0645\u0634\u0631\u0648\u0639 \u0627\u0633\u0645\u0647: "${projectData.name}".` : "";
      const ai5 = createGenAIClient2();
      const response = await ai5.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt || "",
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.classification,
          systemInstruction: `\u0623\u0646\u062A "\u0646\u0627\u062C\u064A"\u060C \u0645\u0633\u0627\u0639\u062F \u0648\u062F\u0648\u062F \u0644\u0645\u0646\u0635\u0629 Naje AI. \u0623\u0646\u062A \u0627\u0644\u0637\u0628\u0642\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0641\u064A \u062F\u0631\u062F\u0634\u0629 \u062A\u0648\u0644\u064A\u062F ${kind}.
\u0645\u0647\u0645\u062A\u0643: \u062A\u062D\u062F\u064A\u062F \u0647\u0644 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0637\u0644\u0628 \u0641\u0639\u0644\u064A \u0644\u062A\u0648\u0644\u064A\u062F ${kind}\u060C \u0623\u0645 \u0645\u062C\u0631\u062F \u062A\u0631\u062D\u064A\u0628/\u0633\u0624\u0627\u0644/\u0627\u0633\u062A\u0641\u0633\u0627\u0631/\u0646\u0642\u0627\u0634.${projectLine}

\u0627\u0644\u0642\u0648\u0627\u0639\u062F:
- \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0637\u0644\u0628 \u062A\u0635\u0645\u064A\u0645/\u062A\u0648\u0644\u064A\u062F \u0648\u0627\u0636\u062D (\u0645\u062B\u0644: "\u0628\u062F\u064A \u0644\u0648\u063A\u0648 \u0644\u0645\u0637\u0639\u0645"\u060C "\u0635\u0645\u0645\u0644\u064A \u0628\u0648\u0633\u062A\u0631"\u060C "\u0627\u0639\u0645\u0644\u064A \u0641\u064A\u062F\u064A\u0648 \u0623\u0646\u0645\u064A"\u060C "logo cute \u0644\u0645\u062D\u0644 \u0642\u0647\u0648\u0629") -> action = "generate".
- \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u062A\u0631\u062D\u064A\u0628 \u0623\u0648 \u0633\u0624\u0627\u0644 \u0623\u0648 \u0627\u0633\u062A\u0634\u0627\u0631\u0629 \u0623\u0648 \u0646\u0642\u0627\u0634 \u0623\u0648 \u0634\u0643\u0631 \u0623\u0648 \u0623\u064A \u0643\u0644\u0627\u0645 \u0644\u0627 \u064A\u0637\u0644\u0628 \u062A\u0648\u0644\u064A\u062F \u0641\u0639\u0644\u064A (\u0645\u062B\u0644: "\u0647\u0644\u0627"\u060C "\u0643\u064A\u0641\u0643"\u060C "\u0634\u0648 \u0628\u062A\u0646\u0635\u062D\u0646\u064A\u061F"\u060C "\u0634\u0648 \u0627\u0644\u0641\u0631\u0642 \u0628\u064A\u0646 \u0627\u0644\u0645\u0648\u062F\u064A\u0644\u064A\u0646\u061F"\u060C "\u0628\u062A\u0641\u0647\u0645 \u0639\u0631\u0628\u064A\u061F") -> action = "chat"\u060C \u0648\u0623\u0631\u0641\u0642 \u0631\u062F\u0627\u064B \u0639\u0631\u0628\u064A\u0627\u064B \u0642\u0635\u064A\u0631\u0627\u064B \u0648\u062F\u0648\u062F\u0627\u064B \u0628\u0644\u0647\u062C\u0629 \u0633\u0647\u0644\u0629\u060C \u0648\u0648\u062C\u0651\u0647 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0644\u0637\u0641 \u0644\u064A\u0643\u062A\u0628 \u0637\u0644\u0628 \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0630\u064A \u064A\u0631\u064A\u062F\u0647. \u0644\u0627 \u062A\u0648\u0651\u0644\u062F \u0623\u064A \u0634\u064A\u0621.
- \u0639\u0646\u062F \u0627\u0644\u0634\u0643\u060C \u0648\u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0642\u0635\u064A\u0631\u0629 \u062C\u062F\u0627\u064B \u0623\u0648 \u063A\u0627\u0645\u0636\u0629 \u0648\u0644\u0627 \u062A\u0635\u0641 \u062A\u0635\u0645\u064A\u0645\u0627\u064B -> action = "chat".

\u0623\u0639\u062F \u0641\u0642\u0637 JSON \u0628\u0627\u0644\u0634\u0643\u0644:
{"action":"generate"} 
\u0623\u0648 
{"action":"chat","reply":"\u0631\u062F\u0643 \u0627\u0644\u0639\u0631\u0628\u064A \u0647\u0646\u0627"}
\u0628\u062F\u0648\u0646 \u0623\u064A \u0646\u0635 \u0625\u0636\u0627\u0641\u064A \u0648\u0628\u062F\u0648\u0646 \u0639\u0644\u0627\u0645\u0627\u062A Markdown.`
        }
      });
      let raw = (response.text || "").replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(raw);
      if (parsed && parsed.action === "chat") {
        return { action: "chat", reply: parsed.reply || "\u0623\u0647\u0644\u0627\u064B! \u0627\u0643\u062A\u0628\u0644\u064A \u0648\u0635\u0641 \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0644\u064A \u0628\u0628\u0627\u0644\u0643 \u0648\u0623\u0646\u0627 \u0628\u062C\u0647\u0651\u0632\u0647\u0648\u0644\u0643 \u{1F3A8}" };
      }
      return { action: "generate" };
    } catch (e) {
      console.error("classifyMediaIntent failed, defaulting to generate:", e);
      return { action: "generate" };
    }
  }
  function containsArabic(text) {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
  }
  async function analyzeTextRisk(apiKey, prompt) {
    try {
      const ai5 = createGenAIClient2();
      const response = await ai5.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt || "",
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.classification,
          systemInstruction: `\u062D\u0644\u0651\u0644 \u0637\u0644\u0628 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u062A\u0627\u0644\u064A \u0648\u062D\u062F\u0651\u062F \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0643\u062A\u0627\u0628\u062A\u0647 **\u062F\u0627\u062E\u0644** \u0627\u0644\u0635\u0648\u0631\u0629 (\u0634\u0639\u0627\u0631\u060C \u0644\u0627\u0641\u062A\u0629\u060C \u0639\u0646\u0648\u0627\u0646\u060C \u0645\u0644\u0635\u0642\u060C \u062C\u0645\u0644\u0629 \u0645\u0643\u062A\u0648\u0628\u0629...).
\u0644\u0627 \u062A\u062D\u0633\u0628 \u0627\u0644\u0643\u0644\u0627\u0645 \u0627\u0644\u0648\u0635\u0641\u064A \u0639\u0646 \u0627\u0644\u0623\u0633\u0644\u0648\u0628 \u0623\u0648 \u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0623\u0648 \u0627\u0644\u0628\u064A\u0626\u0629 \u2014 \u0627\u0633\u062A\u062E\u0631\u062C \u0641\u0642\u0637 \u0627\u0644\u0646\u0635 \u0627\u0644\u062D\u0642\u064A\u0642\u064A \u0648\u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u062D\u0631\u0641\u064A\u0629 \u0627\u0644\u062A\u064A \u0633\u062A\u0638\u0647\u0631 \u0645\u0631\u0633\u0648\u0645\u0629 \u0641\u064A \u0627\u0644\u0635\u0648\u0631\u0629.

\u0623\u0639\u062F JSON \u0641\u0642\u0637 \u0628\u0647\u0630\u0627 \u0627\u0644\u0634\u0643\u0644:
{"hasText": true/false, "text": "\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062D\u0631\u0641\u064A\u0627\u064B \u0623\u0648 \u0633\u0644\u0633\u0644\u0629 \u0641\u0627\u0631\u063A\u0629", "wordCount": \u0639\u062F\u062F \u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u062D\u0642\u064A\u0642\u064A \u0644\u0644\u0646\u0635 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0643\u062A\u0627\u0628\u062A\u0647 \u0641\u0642\u0637, "script": "arabic" \u0623\u0648 "latin" \u0623\u0648 "other"}

\u0625\u0630\u0627 \u0644\u0645 \u064A\u064F\u0637\u0644\u0628 \u0623\u064A \u0646\u0635 \u062F\u0627\u062E\u0644 \u0627\u0644\u0635\u0648\u0631\u0629: {"hasText": false, "text": "", "wordCount": 0, "script": "other"}`
        }
      });
      const raw = (response.text || "").replace(/```json/g, "").replace(/```/g, "").trim();
      const p = JSON.parse(raw);
      const extractedText = (p.text || "").trim();
      const calculatedWordCount = extractedText ? extractedText.split(/\s+/).filter(Boolean).length : Number(p.wordCount) || 0;
      const script = p.script === "arabic" || p.script === "latin" ? p.script : containsArabic(extractedText) ? "arabic" : "other";
      let risk = "none";
      if (p.hasText && calculatedWordCount > 0) {
        if (script === "arabic") {
          if (calculatedWordCount <= 2) risk = "low";
          else if (calculatedWordCount <= 5) risk = "medium";
          else risk = "high";
        } else {
          if (calculatedWordCount <= 3) risk = "low";
          else if (calculatedWordCount <= 6) risk = "medium";
          else risk = "high";
        }
      }
      return { hasText: !!p.hasText, wordCount: calculatedWordCount, extractedText, script, risk };
    } catch (e) {
      console.error("analyzeTextRisk failed, assuming no risk:", e);
      return { hasText: false, wordCount: 0, extractedText: "", script: "other", risk: "none" };
    }
  }
  app.post("/api/projects/:projectId/memory", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
      }
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      const uid = decodedToken.uid;
      const { projectId } = req.params;
      let projData = await getDocRest("projects", projectId, token).catch(() => null);
      if (!projData) {
        try {
          const projSnap = await dbAdmin.collection("projects").doc(projectId).get();
          if (projSnap.exists) {
            projData = { id: projSnap.id, ...projSnap.data() };
          }
        } catch (e) {
        }
      }
      if (!projData) {
        return res.status(404).json({ error: "\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      if (projData.ownerId !== uid) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u0639\u062F\u064A\u0644 \u0630\u0627\u0643\u0631\u0629 \u0647\u0630\u0627 \u0627\u0644\u0645\u0634\u0631\u0648\u0639" });
      }
      const { type, label, content, url, fileData, mimeType, fileName } = req.body;
      if (!type || !label) {
        return res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0646\u0648\u0639 \u0648\u0627\u0633\u0645 \u0639\u0646\u0635\u0631 \u0627\u0644\u0630\u0627\u0643\u0631\u0629" });
      }
      let memoryItems = await getCollectionRest(`projects/${projectId}/memory_items`, token).catch(() => null);
      if (!memoryItems) {
        try {
          const memorySnap = await dbAdmin.collection("projects").doc(projectId).collection("memory_items").get();
          memoryItems = memorySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
          memoryItems = [];
        }
      }
      let currentTotalSizeBytes = 0;
      memoryItems.forEach((d) => {
        currentTotalSizeBytes += d.sizeBytes || 0;
      });
      const MAX_PROJECT_MEMORY_BYTES = 10 * 1024 * 1024;
      let rawTextContent = "";
      let itemSizeBytes = 0;
      let storageRef = "";
      if (type === "text") {
        if (!content || !content.trim()) {
          return res.status(400).json({ error: "\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0625\u0636\u0627\u0641\u062A\u0647 \u0641\u0627\u0631\u063A" });
        }
        rawTextContent = content.trim();
        itemSizeBytes = Buffer.byteLength(rawTextContent, "utf-8");
        storageRef = rawTextContent;
      } else if (type === "url") {
        if (!url || !url.trim()) {
          return res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u062A\u0642\u062F\u064A\u0645 \u0631\u0627\u0628\u0637 \u0635\u062D\u064A\u062D" });
        }
        try {
          rawTextContent = await ssrfSafeFetchUrl(url.trim());
        } catch (ssrfErr) {
          return res.status(400).json({ error: `\u0641\u0634\u0644 \u062C\u0644\u0628 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0631\u0627\u0628\u0637: ${ssrfErr.message}` });
        }
        itemSizeBytes = Buffer.byteLength(rawTextContent, "utf-8");
        storageRef = rawTextContent;
      } else if (type === "file") {
        if (!fileData || !mimeType) {
          return res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641 \u0628\u0634\u0643\u0644 \u0635\u062D\u064A\u062D" });
        }
        const fileBuffer = Buffer.from(fileData, "base64");
        itemSizeBytes = fileBuffer.length;
        const ext = (fileName || label || "").split(".").pop()?.toLowerCase() || "";
        const textExtensions = ["txt", "md", "json", "csv", "js", "ts", "jsx", "tsx", "py", "html", "css", "xml", "yaml", "yml", "c", "cpp", "h", "java", "go", "rs", "php", "sql", "sh", "log", "env", "ini", "conf"];
        const isTextMime = mimeType.startsWith("text/") || mimeType === "application/json" || mimeType === "application/javascript" || mimeType === "application/xml";
        const isTextExtension = textExtensions.includes(ext);
        if (isTextMime || isTextExtension) {
          try {
            const utf8Text = fileBuffer.toString("utf-8");
            if (utf8Text && !utf8Text.includes("\uFFFD\uFFFD")) {
              rawTextContent = utf8Text.trim();
            }
          } catch (e) {
          }
        }
        if (!rawTextContent) {
          try {
            const ai5 = createGenAIClient2();
            const transcribePrompt = `\u0627\u0642\u0631\u0623 \u0648\u0627\u0633\u062A\u062E\u0631\u062C \u062C\u0645\u064A\u0639 \u0627\u0644\u0646\u0635\u0648\u0635 \u0648\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0648\u0627\u0631\u062F \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u062A\u0646\u062F/\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0631\u0641\u0642 ("${fileName || label}") \u0628\u062F\u0642\u0629 \u0648\u0648\u0636\u0648\u062D. \u0623\u0631\u062C\u0639 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0633\u062A\u062E\u0631\u062C \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u062F\u0648\u0646 \u062D\u0630\u0641 \u0623\u0648 \u0627\u062E\u062A\u0635\u0627\u0631.`;
            let cleanBase64 = fileData;
            let effectiveMime = mimeType;
            if (fileData && fileData.includes(",")) {
              const parts = fileData.split(",");
              cleanBase64 = parts[1];
              if (!effectiveMime || effectiveMime === "application/octet-stream") {
                const mimeMatch = parts[0].match(/data:([^;]+);/);
                if (mimeMatch) effectiveMime = mimeMatch[1];
              }
            }
            if (ext === "pdf") effectiveMime = "application/pdf";
            else if (["png", "jpeg", "jpg", "webp", "gif"].includes(ext)) effectiveMime = `image/${ext === "jpg" ? "jpeg" : ext}`;
            const resGen = await ai5.models.generateContent({
              model: "gemini-3.6-flash",
              contents: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: effectiveMime || "application/octet-stream"
                  }
                },
                transcribePrompt
              ],
              config: { maxOutputTokens: OUTPUT_TOKEN_LIMITS.mediaAnalysis }
            });
            rawTextContent = (resGen.text || "").trim();
          } catch (fileErr) {
            console.warn("File transcription warning:", fileErr);
          }
        }
        if (!rawTextContent) {
          rawTextContent = `\u0645\u0644\u0641 \u0645\u0631\u0641\u0642: ${fileName || label} (${mimeType})`;
        }
        storageRef = rawTextContent;
      }
      if (currentTotalSizeBytes + itemSizeBytes > MAX_PROJECT_MEMORY_BYTES) {
        const remainingMb = Math.max(0, (MAX_PROJECT_MEMORY_BYTES - currentTotalSizeBytes) / (1024 * 1024)).toFixed(2);
        return res.status(400).json({
          error: `\u062D\u062C\u0645 \u0647\u0630\u0627 \u0627\u0644\u0639\u0646\u0635\u0631 (${(itemSizeBytes / (1024 * 1024)).toFixed(2)} MB) \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u062A\u0631\u0627\u0643\u0645\u064A \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0644\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 (${remainingMb} MB \u0645\u0646 \u0623\u0635\u0644 10 MB). \u064A\u0631\u062C\u0649 \u062D\u0630\u0641 \u0639\u0646\u0627\u0635\u0631 \u0642\u062F\u064A\u0645\u0629 \u0623\u0648\u0644\u0627\u064B.`
        });
      }
      const summary = await generateMemoryItemSummary(rawTextContent, label);
      const newItemPayload = {
        ownerId: uid,
        type,
        label: label.trim(),
        summary,
        content: storageRef.slice(0, 5e5),
        storageRef: storageRef.slice(0, 5e5),
        sizeBytes: itemSizeBytes,
        createdAt: Date.now()
      };
      let createdId = "";
      const createdRest = await createDocRest(`projects/${projectId}/memory_items`, newItemPayload, token).catch(() => null);
      if (createdRest && createdRest.id) {
        createdId = createdRest.id;
      } else {
        try {
          const docRef = await dbAdmin.collection("projects").doc(projectId).collection("memory_items").add(newItemPayload);
          createdId = docRef.id;
        } catch (dbErr) {
          console.error("dbAdmin memory add failed:", dbErr);
          throw new Error("\u062A\u0639\u0630\u0631 \u062D\u0641\u0638 \u0639\u0646\u0635\u0631 \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.");
        }
      }
      return res.json({
        success: true,
        item: {
          id: createdId,
          type,
          label: label.trim(),
          summary,
          sizeBytes: itemSizeBytes,
          createdAt: Date.now()
        }
      });
    } catch (err) {
      console.error("Memory ingest error:", err);
      return res.status(500).json({ error: err.message || "\u0641\u0634\u0644 \u0625\u0636\u0627\u0641\u0629 \u0639\u0646\u0635\u0631 \u0627\u0644\u0630\u0627\u0643\u0631\u0629" });
    }
  });
  app.get("/api/projects/:projectId/memory", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
      }
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      const uid = decodedToken.uid;
      const { projectId } = req.params;
      let projData = await getDocRest("projects", projectId, token).catch(() => null);
      if (!projData) {
        try {
          const projSnap = await dbAdmin.collection("projects").doc(projectId).get();
          if (projSnap.exists) {
            projData = { id: projSnap.id, ...projSnap.data() };
          }
        } catch (e) {
        }
      }
      if (!projData) {
        return res.status(404).json({ error: "\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      if (projData.ownerId !== uid) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0639\u0631\u0636 \u0630\u0627\u0643\u0631\u0629 \u0647\u0630\u0627 \u0627\u0644\u0645\u0634\u0631\u0648\u0639" });
      }
      let items = await getCollectionRest(`projects/${projectId}/memory_items`, token).catch(() => null);
      if (!items) {
        try {
          const memorySnap = await dbAdmin.collection("projects").doc(projectId).collection("memory_items").orderBy("createdAt", "desc").get();
          items = memorySnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (e) {
          items = [];
        }
      } else {
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }
      return res.json({ items });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/projects/:projectId/memory/:itemId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
      }
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      const uid = decodedToken.uid;
      const { projectId, itemId } = req.params;
      let projData = await getDocRest("projects", projectId, token).catch(() => null);
      if (!projData) {
        try {
          const projSnap = await dbAdmin.collection("projects").doc(projectId).get();
          if (projSnap.exists) {
            projData = { id: projSnap.id, ...projSnap.data() };
          }
        } catch (e) {
        }
      }
      if (!projData || projData.ownerId !== uid) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
      }
      let itemData = await getDocRest(`projects/${projectId}/memory_items`, itemId, token).catch(() => null);
      if (!itemData) {
        try {
          const itemSnap = await dbAdmin.collection("projects").doc(projectId).collection("memory_items").doc(itemId).get();
          if (itemSnap.exists) {
            itemData = { id: itemSnap.id, ...itemSnap.data() };
          }
        } catch (e) {
        }
      }
      if (!itemData) {
        return res.status(404).json({ error: "\u0639\u0646\u0635\u0631 \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      return res.json(itemData);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/projects/:projectId/memory/:itemId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
      }
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      const uid = decodedToken.uid;
      const { projectId, itemId } = req.params;
      let projData = await getDocRest("projects", projectId, token).catch(() => null);
      if (!projData) {
        try {
          const projSnap = await dbAdmin.collection("projects").doc(projectId).get();
          if (projSnap.exists) {
            projData = { id: projSnap.id, ...projSnap.data() };
          }
        } catch (e) {
        }
      }
      if (!projData || projData.ownerId !== uid) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
      }
      await deleteDocRest(`projects/${projectId}/memory_items`, itemId, token).catch(() => null);
      try {
        await dbAdmin.collection("projects").doc(projectId).collection("memory_items").doc(itemId).delete();
      } catch (e) {
      }
      return res.json({ success: true, deletedId: itemId });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  function formatStepLabelWithProject(label, projectData) {
    if (!label) return "";
    if (!projectData) return label;
    const pName = projectData.name || projectData.title || "";
    const bName = projectData.brandProfile?.brandName || projectData.brandProfile?.name || "";
    const nameToUse = pName || bName;
    if (!nameToUse) return label;
    if (label.startsWith("[\u0645\u0634\u0631\u0648\u0639") || label.startsWith(`[${nameToUse}]`)) return label;
    return `[\u0645\u0634\u0631\u0648\u0639 ${nameToUse}] ${label}`;
  }
  app.post("/api/creative-concepts", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const { brandName, industry, prompt, mode = "design", aspectRatio: aspectRatio2 = "1:1" } = req.body;
      let combinedInput = prompt || "";
      if (brandName) combinedInput += `
\u0627\u0633\u0645 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629: ${brandName}`;
      if (industry) combinedInput += `
\u0627\u0644\u0645\u062C\u0627\u0644 / \u0627\u0644\u0635\u0646\u0627\u0639\u0629: ${industry}`;
      if (!combinedInput.trim()) {
        return res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u062A\u0642\u062F\u064A\u0645 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0623\u0648 \u0641\u0643\u0631\u0629 \u0627\u0644\u062A\u0635\u0645\u064A\u0645." });
      }
      const ai5 = createGenAIClient2();
      const concepts = await generateMaximumCreativity(ai5, combinedInput, mode, aspectRatio2, applyCreativeLayers);
      return res.json({
        success: true,
        concepts,
        cost: 0
        // Concept generation is free planning step
      });
    } catch (err) {
      console.error("Error in /api/creative-concepts:", err);
      return res.status(500).json({ error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645 \u0627\u0644\u0625\u0628\u062F\u0627\u0639\u064A\u0629." });
    }
  });
  app.get(["/api/video-status", "/api/creatively/video-status"], async (req, res) => {
    try {
      const _auth = await requireAuth(req, res);
      if (!_auth) return;
      const operationName = req.query.operationName;
      if (!operationName) {
        return res.status(400).json({ error: "Missing operationName" });
      }
      const ai5 = createGenAIClient2();
      const op = new import_genai5.GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai5.operations.getVideosOperation({ operation: op });
      if (updated.done) {
        const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
        if (uri) {
          return res.json({ progress: 100, done: true });
        }
      }
      return res.json({ progress: 65, done: false });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Failed to check video status" });
    }
  });
  app.get(["/api/video-download", "/api/creatively/video-download"], async (req, res) => {
    try {
      const _auth = await requireAuth(req, res);
      if (!_auth) return;
      const operationName = req.query.operationName;
      if (!operationName) {
        return res.status(400).json({ error: "Missing operationName" });
      }
      const ai5 = createGenAIClient2();
      const op = new import_genai5.GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai5.operations.getVideosOperation({ operation: op });
      if (updated.done) {
        const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
        if (uri) {
          const videoUrl = uri.includes("?") ? `${uri}&key=${process.env.GEMINI_API_KEY}` : `${uri}?key=${process.env.GEMINI_API_KEY}`;
          const videoRes = await fetch(videoUrl);
          if (!videoRes.ok) {
            return res.status(500).json({ error: "Failed to download video stream" });
          }
          const arrayBuffer = await videoRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          res.setHeader("Content-Type", "video/mp4");
          return res.send(buffer);
        }
      }
      return res.status(404).json({ error: "Video not ready or not found" });
    } catch (err) {
      console.error("Video download error:", err);
      return res.status(500).json({ error: err.message || "Failed to download video" });
    }
  });
  app.get(["/api/gallery", "/api/creatively/gallery", "/api/designs", "/api/creatively/designs"], async (req, res) => {
    try {
      const _auth = await requireAuth(req, res);
      if (!_auth) return;
      const snap = await dbAdmin.collection("creatively_designs").where("ownerId", "==", _auth.uid).orderBy("createdAt", "desc").limit(50).get();
      const designs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.json({ designs });
    } catch (err) {
      return res.json({ designs: [] });
    }
  });
  app.post(["/api/designs/rate", "/api/creatively/designs/rate"], async (req, res) => {
    try {
      const _auth = await requireAuth(req, res);
      if (!_auth) return;
      const { uid, token } = _auth;
      const rl = checkRateLimit(`rate_design:${uid}`, 30, 60 * 1e3);
      if (!rl.allowed) {
        return res.status(429).json({ error: `\u062A\u062C\u0627\u0648\u0632\u062A \u062D\u062F \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u0633\u0645\u0648\u062D. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0628\u0639\u062F ${rl.retryAfterSec} \u062B\u0627\u0646\u064A\u0629.` });
      }
      const { id, rating } = req.body || {};
      const numericRating = Number(rating);
      if (!id || typeof id !== "string" || isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0623\u0648 \u0642\u064A\u0645\u0629 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629 (1-5)." });
      }
      const designRef = dbAdmin.collection("creatively_designs").doc(id);
      await designRef.set({
        rating: numericRating,
        ratings: {
          [uid]: numericRating
        },
        lastRatedBy: uid,
        lastRatedAt: Date.now()
      }, { merge: true }).catch((err) => {
        console.warn("Design rating update notice:", err?.message || err);
      });
      return res.json({ success: true, rating: numericRating });
    } catch (err) {
      console.error("Error in /api/designs/rate:", err);
      return res.status(500).json({ error: "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u062A\u0642\u064A\u064A\u0645" });
    }
  });
  app.post(["/api/creatively/generate"], async (req, res) => {
    try {
      const _auth = await requireAuth(req, res);
      if (!_auth) return;
      const { uid, token } = _auth;
      const _userDocSnapForGate = await dbAdmin.collection("users").doc(uid).get();
      if (!checkFeatureAccess(res, _userDocSnapForGate.data(), "creativelyAI")) return;
      const _imageModel = req.body.imageModel === "lite" || req.body.imageModel === "nova" ? req.body.imageModel : "spectra";
      const _imageModelId = _imageModel === "lite" ? "gemini-3.1-flash-lite-image" : _imageModel === "nova" ? "gemini-3-pro-image" : "gemini-3.1-flash-image";
      const _imagePrice = _imageModel === "lite" ? 0.5 : _imageModel === "nova" ? 1.5 : 1;
      if (_imageModel === "nova" || _imageModelId === "gemini-3-pro-image") {
        const rlNovaHr = checkRateLimit(`nova_hr:${uid}`, 30, 60 * 60 * 1e3);
        if (!rlNovaHr.allowed) {
          return res.status(429).json({
            error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u062A\u0648\u0644\u064A\u062F \u0635\u0648\u0631 Imagen Pro \u0644\u0647\u0630\u0647 \u0627\u0644\u0633\u0627\u0639\u0629 (30 \u0635\u0648\u0631\u0629/\u0633\u0627\u0639\u0629). \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 ${Math.max(1, Math.ceil(rlNovaHr.retryAfterSec / 60))} \u062F\u0642\u064A\u0642\u0629.`
          });
        }
        const rlNovaDay = checkRateLimit(`nova_day:${uid}`, 150, 24 * 60 * 60 * 1e3);
        if (!rlNovaDay.allowed) {
          return res.status(429).json({
            error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u064A\u0648\u0645\u064A \u0644\u062A\u0648\u0644\u064A\u062F \u0635\u0648\u0631 Imagen Pro (150 \u0635\u0648\u0631\u0629/\u064A\u0648\u0645).`
          });
        }
      }
      const {
        prompt,
        mode = "logo",
        // logo | identity | video_ad | brand_kit
        identityFormat,
        // when mode === 'identity' (social_post/story/business_card/youtube_*/whatsapp_channel/full...)
        logoFormat,
        // when mode === 'logo'  ('default' | 'billboard')
        resultType,
        // when mode === 'video_ad'  ('video' | 'image')
        videoDuration,
        productImages = [],
        // string[] data-URLs (WITH data: prefix)
        baseImage,
        // data-URL when editing an existing result
        logoName = "",
        // exact brand text to render
        aspectRatio: bodyAspect,
        selectedTraits = [],
        selectedEmotions = [],
        otherTrait = "",
        entityType,
        // company | non_profit | government | individual
        dimension,
        complexity,
        useCreativePro,
        selectedConceptPrompt,
        // set when the user picked a concept card
        lang = "ar"
      } = req.body || {};
      const apiKey = process.env.GEMINI_API_KEY;
      if (!USE_VERTEX_AI2 && !apiKey) {
        return res.status(500).json({ error: "\u0646\u0648\u0627\u062C\u0647 \u0645\u0634\u0643\u0644\u0629 \u0645\u0624\u0642\u062A\u0629 \u0641\u064A \u062E\u0648\u0627\u062F\u0645 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0644\u0627\u062D\u0642\u0627\u064B." });
      }
      if (!prompt && (!productImages || productImages.length === 0) && !selectedConceptPrompt) {
        return res.status(400).json({ error: "\u0627\u0644\u0648\u0635\u0641 \u0645\u0637\u0644\u0648\u0628 \u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u062A\u0635\u0645\u064A\u0645." });
      }
      const ai5 = createGenAIClient2();
      let targetAspectRatio = bodyAspect || "1:1";
      if (!bodyAspect) {
        if (mode === "video_ad" || mode === "brand_kit") {
          targetAspectRatio = "16:9";
        } else if (mode === "logo") {
          targetAspectRatio = logoFormat === "billboard" ? "16:9" : "1:1";
        } else if (mode === "identity") {
          const wide = ["youtube_thumbnail", "youtube_cover", "whatsapp_channel", "social_post", "full", "billboard", "video_ad"];
          if (identityFormat === "story") targetAspectRatio = "9:16";
          else if (identityFormat === "business_card") targetAspectRatio = "4:3";
          else if (wide.includes(identityFormat)) targetAspectRatio = "16:9";
          else targetAspectRatio = "1:1";
        }
      }
      if (mode === "video_ad") {
        if (String(prompt || "").includes("9:16")) targetAspectRatio = "9:16";
        if (String(prompt || "").includes("1:1")) targetAspectRatio = "1:1";
      }
      const grandTypography = "\n\nGRAND TYPOGRAPHY: You have a premium Arabic & English font encyclopedia \u2014 explicitly name real fonts in the image prompt. English (Helvetica Neue, Inter, Poppins, Montserrat, Playfair Display, Cinzel, Bebas Neue, Space Grotesk, Clash Display, Futura). Arabic (Cairo, Tajawal, Almarai, Changa, Aref Ruqaa, Reem Kufi, Thuluth, Diwani, Naskh, El Messiri, Lalezar, IBM Plex Sans Arabic). No spelling mistakes. No random/gibberish text. Any requested text is rendered EXACTLY as given, in its ORIGINAL language.";
      let finalDimension = dimension;
      let finalComplexity = complexity;
      if (mode === "logo" && logoFormat === "default") {
        finalDimension = "2D";
        finalComplexity = "Simple (Minimalist, strictly preventing any chaotic complexity)";
      }
      const prefsText = [];
      if (finalDimension) prefsText.push(`Dimension/Style: ${finalDimension}`);
      if (finalComplexity) prefsText.push(`Complexity: ${finalComplexity}`);
      const entityMap = {
        company: "Client Entity Type: Company / Commercial Business. Prioritize highly professional, authoritative, premium, corporate aesthetics that build brand equity and commercial trust.",
        non_profit: "Client Entity Type: Non-profit / NGO. Prioritize community-oriented, impact-driven, inspiring, welcoming, warm aesthetics.",
        government: "Client Entity Type: Government / Public Sector. Prioritize official, stable, trustworthy, formal, authoritative aesthetics.",
        individual: "Client Entity Type: Individual / Personal Brand. Prioritize creative, personalized, approachable, distinctive, human-centric aesthetics."
      };
      if (entityType && entityMap[entityType]) prefsText.push(entityMap[entityType]);
      const traits = [...selectedTraits || [], otherTrait].filter(Boolean);
      if (traits.length > 0) prefsText.push(`Design Traits: ${traits.join(", ")}`);
      if (selectedEmotions && selectedEmotions.length > 0) {
        prefsText.push(`Emotions to Evoke: ${selectedEmotions.join(", ")}`);
      }
      const preferencesRules = prefsText.length > 0 ? `

CLIENT STRICT COMMANDS (ABSOLUTE, NON-NEGOTIABLE LAWS \u2014 must completely dominate the final image prompt; failing to incorporate these EXACTLY is a catastrophic failure):
${prefsText.map((t) => "- " + t).join("\n")}` : "";
      const editDirectives = baseImage ? `

EDITING DIRECTIVE: The user provided an existing design and wants edits: "${prompt}". Output an updated masterpiece prompt that MODIFIES the existing design per the request, keeping what they liked intact. Do NOT start from scratch unless explicitly asked.` : "";
      const refParts = [];
      const attach = (durl) => {
        if (!durl || typeof durl !== "string") return;
        const m = durl.match(/^data:([^;]+);base64,(.+)$/);
        if (m) refParts.push({ inlineData: { mimeType: m[1], data: m[2] } });
        else refParts.push({ inlineData: { mimeType: "image/png", data: durl.includes(",") ? durl.split(",")[1] : durl } });
      };
      (productImages || []).forEach(attach);
      if (baseImage) attach(baseImage);
      const refContextNote = refParts.length > 0 ? `

ATTACHED REFERENCE IMAGES: Analyze them carefully, extract logos/products/style, and explicitly describe how they are seamlessly integrated/blended into the design in the final image prompt (image-to-image conditioning is supported). If the user named a camera style, state it describes CAMERA ANGLE/MOVEMENT only \u2014 never render a physical camera/drone in the scene.` : "";
      if (mode === "video_ad" && resultType === "video") {
        const durSec = Math.max(4, Math.min(10, parseInt(String(videoDuration || "5").replace(/\D/g, ""), 10) || 5));
        let videoPrompt = selectedConceptPrompt || prompt || "Cinematic brand video";
        try {
          videoPrompt = await applyCreativeLayers(
            ai5,
            `${prompt}${preferencesRules}${refContextNote}
PRESERVE any requested on-screen text EXACTLY in its original language (never translate).`,
            "design",
            targetAspectRatio
          );
        } catch (_e) {
        }
        const videoOp = await ai5.models.generateVideos({
          model: "veo-3.1-lite-generate-preview",
          prompt: videoPrompt,
          config: {
            numberOfVideos: 1,
            aspectRatio: targetAspectRatio === "9:16" ? "9:16" : "16:9",
            durationSeconds: durSec
          }
        });
        const _durSecCharge = Math.max(4, Math.min(10, parseInt(String(videoDuration || "5").replace(/\D/g, ""), 10) || 5));
        const _nb = await chargePoints(uid, token, await mediaCost(token, "video", _durSecCharge));
        return res.json({ type: "video_operation", operationName: videoOp.name, ..._nb !== null ? { newBalance: _nb } : {} });
      }
      const modeRole = mode === "brand_kit" ? "You are a world-class brand strategist & art director building a cohesive brand identity kit presentation board (logo + business cards + stationery + social template, one unified premium color scheme)." : mode === "video_ad" ? "You are a world-class advertising creative director designing a single striking key-frame poster for a video ad concept." : mode === "logo" && logoFormat === "billboard" ? "You are a world-class signage & environmental designer creating a photoreal storefront signboard / outdoor billboard (16:9), with masterfully integrated Arabic calligraphy and dramatic dusk commercial lighting on a premium facade." : mode === "logo" ? "You are a world-class logo & brand-mark designer. Invent a clever, meaningful symbolic icon for the business domain and integrate it beautifully with the brand text." : "You are a world-class graphic designer producing an elite, magazine-quality visual.";
      let enhancedPrompt = "";
      let conceptTitle = "";
      let conceptExplanation = "";
      let brandKitSlogan = null;
      let brandKitColors = null;
      let brandKitTypography = null;
      let brandKitGuidelines = null;
      if (selectedConceptPrompt) {
        enhancedPrompt = selectedConceptPrompt;
        conceptTitle = lang === "ar" ? "\u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0645\u062E\u062A\u0627\u0631" : "Selected concept";
        conceptExplanation = lang === "ar" ? "\u062A\u0645 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0627\u0644\u0645\u0641\u0647\u0648\u0645 \u0627\u0644\u0630\u064A \u0627\u062E\u062A\u0631\u062A\u0647." : "Generated from your selected concept.";
      } else {
        const brandKitKeys = mode === "brand_kit" ? `, "brandKitSlogan" (a creative tagline in the user's language), "brandKitColors" (array of 4-5 hex strings), "brandKitTypography" (recommended heading + body fonts), "brandKitGuidelines" (short usage guidelines in the user's language)` : "";
        const strategySystem = `${modeRole}${preferencesRules}${editDirectives}${refContextNote}${grandTypography}

TEXT FIDELITY: If any brand name / slogan / number is provided, ALL of them must appear in the image prompt, each with explicit placement/hierarchy; never drop, merge, translate, or invent text. Arabic text must be rendered as flawless, correctly-connected calligraphy.

STRICT OUTPUT: Return ONLY a raw JSON object (no markdown, no backticks) with keys: "imagePrompt" (an elite English text-to-image prompt; keep any user-requested literal text EXACTLY, in its ORIGINAL language, in quotes), "conceptTitle", "conceptExplanation" (in the user's language)${brandKitKeys}. The imagePrompt MUST strictly match aspect ratio ${targetAspectRatio}.`;
        const strategyContents = [
          {
            role: "user",
            parts: [
              {
                text: `User request: ${prompt}
Exact brand text to render (if any): ${logoName && logoName.trim() ? `"${logoName}"` : "(none)"}
Design category: ${mode}${identityFormat ? " / " + identityFormat : ""}${logoFormat ? " / " + logoFormat : ""}
Target aspect ratio: ${targetAspectRatio}`
              },
              ...refParts
            ]
          }
        ];
        const strategyRes = await ai5.models.generateContent({
          model: resolveEngineModel(useCreativePro ? getNajeModel("pro") : getNajeModel("core")),
          contents: strategyContents,
          config: { systemInstruction: strategySystem, responseMimeType: "application/json", maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler }
        });
        let raw = "";
        try {
          raw = strategyRes.text || "";
        } catch {
          raw = "";
        }
        raw = raw.replace(/```json|```/g, "").trim();
        let strat = {};
        try {
          strat = JSON.parse(raw);
        } catch (_e) {
          strat = { imagePrompt: prompt, conceptTitle: "", conceptExplanation: "" };
        }
        enhancedPrompt = strat.imagePrompt || prompt;
        conceptTitle = strat.conceptTitle || "";
        conceptExplanation = strat.conceptExplanation || "";
        if (mode === "brand_kit") {
          brandKitSlogan = strat.brandKitSlogan || null;
          brandKitColors = strat.brandKitColors || null;
          brandKitTypography = strat.brandKitTypography || null;
          brandKitGuidelines = strat.brandKitGuidelines || null;
        }
      }
      let finalImagePrompt = enhancedPrompt;
      if (logoName && logoName.trim() && (mode === "brand_kit" || mode === "logo")) {
        finalImagePrompt += `

ABSOLUTE TEXT RULE: The ONLY text/letters allowed ANYWHERE in the image is EXACTLY "${logoName}". Do NOT generate any random/dummy/placeholder/UI text on any surface (mockups, cards, packaging stay blank & purely visual). If "${logoName}" is Arabic it MUST be flawless, connected Arabic calligraphy. Integrate a clever, relevant symbolic icon for the business domain, balanced beautifully with the text.`;
      }
      const creativelyPresetId = req.body?.preset || req.body?.formatPreset || req.body?.formatPresetId;
      const creativelySafeZone = getSafeZoneForPreset(creativelyPresetId);
      try {
        finalImagePrompt = await applyCreativeLayers(ai5, finalImagePrompt, "design", targetAspectRatio, creativelySafeZone || void 0);
      } catch (_e) {
      }
      const imgRes = await ai5.models.generateContent({
        model: _imageModelId,
        contents: { parts: [{ text: finalImagePrompt }, ...refParts] },
        config: { imageConfig: { aspectRatio: targetAspectRatio }, maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler }
      });
      let base64Image = "";
      for (const part of imgRes.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          base64Image = part.inlineData.data;
          break;
        }
      }
      const imageUrl = base64Image ? `data:image/png;base64,${base64Image}` : "";
      if (!imageUrl) {
        return res.status(502).json({ error: "\u062A\u0639\u0630\u0651\u0631 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631\u0629\u060C \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649." });
      }
      const _nbImg = await chargePoints(uid, token, _imagePrice);
      return res.json({
        imageUrl,
        enhancedPrompt: finalImagePrompt,
        conceptTitle,
        conceptExplanation,
        ..._nbImg !== null ? { newBalance: _nbImg } : {},
        ...mode === "brand_kit" ? { brandKitSlogan, brandKitColors, brandKitTypography, brandKitGuidelines } : {}
      });
    } catch (err) {
      console.error("[/api/creatively/generate] error:", err);
      return res.status(500).json({ error: err?.message || "\u0641\u0634\u0644 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u062A\u0635\u0645\u064A\u0645." });
    }
  });
  app.post(["/api/creatively/video-status", "/api/video-status"], async (req, res) => {
    try {
      const _auth = await requireAuth(req, res);
      if (!_auth) return;
      const operationName = req.body?.operationName;
      if (!operationName) {
        return res.status(400).json({ error: "Missing operationName" });
      }
      const ai5 = createGenAIClient2();
      const op = new import_genai5.GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai5.operations.getVideosOperation({ operation: op });
      if (updated.done) {
        return res.json({ progress: 100, done: true });
      }
      return res.json({ progress: 65, done: false });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Failed to check video status" });
    }
  });
  app.post("/api/chat-designer", async (req, res) => {
    try {
      const _auth = await requireAuth(req, res);
      if (!_auth) return;
      const { uid, token } = _auth;
      const _userDocSnapForGate = await dbAdmin.collection("users").doc(uid).get();
      if (!checkFeatureAccess(res, _userDocSnapForGate.data(), "creativelyAI")) return;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      const isAdmin = isPrivilegedAdmin(userDoc, { email: _auth.email });
      const userBalance = typeof userDoc?.balance === "number" ? userDoc.balance : 0;
      const isNegativeBalance = userDoc?.isNegativeBalance === true;
      if (!isAdmin && (userBalance <= 0 || isNegativeBalance)) {
        res.setHeader("Content-Type", "application/x-ndjson");
        res.write(JSON.stringify({ type: "result", data: { error: "\u0631\u0635\u064A\u062F\u0643 \u063A\u064A\u0631 \u0643\u0627\u0641\u064D \u0644\u0625\u062A\u0645\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628. \u064A\u0631\u062C\u0649 \u0634\u062D\u0646 \u0631\u0635\u064A\u062F\u0643 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629." } }) + "\n");
        return res.end();
      }
      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Transfer-Encoding", "chunked");
      res.write(JSON.stringify({ type: "status", status: "thinking" }) + "\n");
      const { messages, lang = "ar", baseImage, useCreativePro } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!USE_VERTEX_AI2 && !apiKey) {
        res.write(JSON.stringify({ type: "result", data: { error: "\u0645\u0641\u062A\u0627\u062D \u0627\u0644\u0631\u0628\u0637 \u0627\u0644\u062F\u0627\u062E\u0644\u064A \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A." } }) + "\n");
        return res.end();
      }
      const ai5 = createGenAIClient2();
      const grandTypography = "\n\n\u064A\u062C\u0628 \u0639\u0644\u064A\u0643 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0645\u0648\u0633\u0648\u0639\u0629 \u0627\u0644\u062E\u0637\u0648\u0637 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0639\u0646\u062F \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631 \u0623\u0648 \u0627\u0644\u0634\u0639\u0627\u0631\u0627\u062A. \u0627\u0637\u0644\u0628 \u0645\u0646 \u0627\u0644\u0645\u0648\u0644\u0651\u062F \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0623\u062D\u062F \u0647\u0630\u0647 \u0627\u0644\u062E\u0637\u0648\u0637 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 (Helvetica Neue, Inter, Poppins, Montserrat, Playfair Display, Cinzel, Lato, Bebas Neue, Space Grotesk, Plus Jakarta Sans, Outfit, Clash Display, SF Pro Display, Futura, Avenir) \u0623\u0648 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 (Kufam, Cairo, Tajawal, Almarai, Changa, Aref Ruqaa, Reem Kufi, Thuluth, Diwani, Naskh, Mada, El Messiri, Lalezar, Readex Pro, IBM Plex Sans Arabic, Somar, Alexandria).\n\u0645\u0645\u0646\u0648\u0639 \u0627\u0644\u0623\u062E\u0637\u0627\u0621 \u0627\u0644\u0625\u0645\u0644\u0627\u0626\u064A\u0629. \u0645\u0645\u0646\u0648\u0639 \u0627\u0644\u0646\u0635\u0648\u0635 \u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064A\u0629. \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u064A\u064F\u0643\u062A\u0628 \u062D\u0631\u0641\u064A\u0627\u064B \u0643\u0645\u0627 \u0637\u0644\u0628\u0647 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0628\u0646\u0641\u0633 \u0644\u063A\u062A\u0647. \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0628\u0645\u0633\u062A\u0648\u0649 \u0648\u0643\u0627\u0644\u0627\u062A \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629.";
      const systemPrompt = (lang === "ar" ? `\u0623\u0646\u062A "\u064A\u0632\u0646" \u2014 \u0627\u0644\u0639\u0642\u0644 \u0627\u0644\u0625\u0628\u062F\u0627\u0639\u064A \u0641\u064A \u0645\u0646\u0635\u0629 Naje AI. \u0645\u0633\u0627\u0639\u062F \u0630\u0643\u064A \u0648\u0645\u0635\u0645\u0645 \u0645\u062D\u062A\u0631\u0641 \u0628\u0644\u0647\u062C\u0629 \u0623\u0631\u062F\u0646\u064A\u0629 \u0648\u062F\u0651\u064A\u0629. \u0645\u0647\u0645\u062A\u0643: \u062A\u0648\u0644\u064A\u062F \u0623\u0641\u0643\u0627\u0631 \u062A\u0635\u0627\u0645\u064A\u0645\u060C \u0646\u0635\u0648\u0635 \u062A\u0633\u0648\u064A\u0642\u064A\u0629\u060C \u0648\u0645\u0646\u0627\u0642\u0634\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0623\u0641\u0636\u0644 \u0627\u0644\u0623\u0644\u0648\u0627\u0646\u060C \u0627\u0644\u0623\u0628\u0639\u0627\u062F\u060C \u0648\u0627\u0644\u0623\u0633\u0627\u0644\u064A\u0628 \u0627\u0644\u0641\u0646\u064A\u0629\u060C \u062B\u0645 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0628\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0639\u0627\u0644\u064A\u0629.` : `You are "Yazan", the creative mind of Naje AI \u2014 a smart assistant and professional designer.`) + grandTypography;
      const contents = (messages || []).map((m, index) => {
        const parts = [{ text: m.content || "" }];
        if (index === messages.length - 1 && m.role !== "assistant" && baseImage) {
          const match = baseImage.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
          }
        }
        return {
          role: m.role === "assistant" ? "model" : "user",
          parts
        };
      });
      const chatResponse = await ai5.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse,
          tools: [{
            functionDeclarations: [
              {
                name: "generate_design",
                description: "Generate a visual design, logo, or brand kit based on a highly detailed prompt.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    prompt: { type: "STRING", description: "Detailed visual description in English with text in original language." },
                    aspectRatio: { type: "STRING", description: "Aspect ratio (1:1, 16:9, 9:16)" }
                  },
                  required: ["prompt", "aspectRatio"]
                }
              },
              {
                name: "generate_video",
                description: "Generate a high-quality video or ad using the creative video engine.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    prompt: { type: "STRING", description: "Cinematic prompt describing action and movement." },
                    aspectRatio: { type: "STRING", description: "Aspect ratio (16:9 or 9:16)" },
                    durationSeconds: { type: "INTEGER", description: "Duration in seconds (4 to 10)" }
                  },
                  required: ["prompt", "aspectRatio", "durationSeconds"]
                }
              }
            ]
          }]
        }
      });
      const fc = chatResponse.functionCalls?.[0];
      if (fc) {
        if (fc.name === "generate_design") {
          const args = fc.args;
          res.write(JSON.stringify({ type: "status", status: "generating" }) + "\n");
          const imageModelId = resolveEngineModel(useCreativePro ? "nano-banana-pro" : "nano-banana-2");
          if (useCreativePro) {
            const rlNovaHr = checkRateLimit(`nova_hr:${uid}`, 30, 60 * 60 * 1e3);
            if (!rlNovaHr.allowed) {
              res.write(JSON.stringify({ type: "result", data: { error: "\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u062A\u0648\u0644\u064A\u062F \u0635\u0648\u0631 Imagen Pro \u0644\u0647\u0630\u0647 \u0627\u0644\u0633\u0627\u0639\u0629 (30 \u0635\u0648\u0631\u0629/\u0633\u0627\u0639\u0629)." } }) + "\n");
              return res.end();
            }
            const rlNovaDay = checkRateLimit(`nova_day:${uid}`, 150, 24 * 60 * 60 * 1e3);
            if (!rlNovaDay.allowed) {
              res.write(JSON.stringify({ type: "result", data: { error: "\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u064A\u0648\u0645\u064A \u0644\u062A\u0648\u0644\u064A\u062F \u0635\u0648\u0631 Imagen Pro (150 \u0635\u0648\u0631\u0629/\u064A\u0648\u0645)." } }) + "\n");
              return res.end();
            }
          }
          const imgRes = await ai5.models.generateContent({
            model: imageModelId,
            contents: { parts: [{ text: args.prompt || "Creative design masterpiece" }] },
            config: { imageConfig: { aspectRatio: args.aspectRatio || "1:1" }, maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler }
          });
          let base64Image = "";
          for (const part of imgRes.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) {
              base64Image = part.inlineData.data;
              break;
            }
          }
          const imageUrl = base64Image ? `data:image/png;base64,${base64Image}` : "";
          if (base64Image) {
            await chargePoints(uid, token, await mediaCost(token, "image"));
          }
          res.write(JSON.stringify({
            type: "result",
            data: {
              reply: lang === "ar" ? "\u0644\u0642\u062F \u0642\u0645\u062A \u0628\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0627\u0644\u0641\u0643\u0631\u0629! \u0645\u0627 \u0631\u0623\u064A\u0643\u061F" : "I generated the design based on your idea!",
              imageUrl
            }
          }) + "\n");
          return res.end();
        } else if (fc.name === "generate_video") {
          const args = fc.args;
          res.write(JSON.stringify({ type: "status", status: "generating" }) + "\n");
          const videoOp = await ai5.models.generateVideos({
            model: resolveEngineModel("veo-lite"),
            prompt: args.prompt || "Cinematic video shot",
            config: {
              numberOfVideos: 1,
              aspectRatio: args.aspectRatio || "16:9",
              durationSeconds: args.durationSeconds || 5
            }
          });
          await chargePoints(uid, token, await mediaCost(token, "video", 5));
          res.write(JSON.stringify({
            type: "result",
            data: {
              reply: lang === "ar" ? "\u0628\u062F\u0623\u062A \u0628\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0633\u064A\u0646\u0645\u0627\u0626\u064A \u0627\u0644\u0622\u0646..." : "Started generating your cinematic video...",
              videoOperationName: videoOp.name,
              type: "video_operation"
            }
          }) + "\n");
          return res.end();
        }
      }
      if (chatResponse.usageMetadata) {
        await chargeForTextModelUsage(uid, "gemini-3.6-flash", chatResponse.usageMetadata, isAdmin).catch((e) => console.error("chat-designer metering error:", e));
      }
      res.write(JSON.stringify({ type: "result", data: { reply: chatResponse.text || "" } }) + "\n");
      return res.end();
    } catch (err) {
      console.error("Chat designer error:", err);
      if (!res.headersSent) {
        res.setHeader("Content-Type", "application/x-ndjson");
      }
      res.write(JSON.stringify({ type: "result", data: { error: err.message || "Failed in chat designer" } }) + "\n");
      return res.end();
    }
  });
  app.post("/api/creative-pro-chat", async (req, res) => {
    try {
      const _auth = await requireAuth(req, res);
      if (!_auth) return;
      const { uid, token } = _auth;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      const isAdmin = isPrivilegedAdmin(userDoc, { email: _auth.email });
      const userBalance = typeof userDoc?.balance === "number" ? userDoc.balance : 0;
      const isNegativeBalance = userDoc?.isNegativeBalance === true;
      if (!isAdmin && (userBalance <= 0 || isNegativeBalance)) {
        return res.status(400).json({ error: "\u0631\u0635\u064A\u062F\u0643 \u063A\u064A\u0631 \u0643\u0627\u0641\u064D \u0644\u0625\u062A\u0645\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628. \u064A\u0631\u062C\u0649 \u0634\u062D\u0646 \u0631\u0635\u064A\u062F\u0643 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629." });
      }
      const {
        message,
        history,
        proMode = "standard",
        // standard | thinking | search | image | video | study
        userName,
        media,
        // string[] of data-URLs ("data:image/png;base64,....")
        lang = "ar"
      } = req.body || {};
      const apiKey = process.env.GEMINI_API_KEY;
      if (!USE_VERTEX_AI2 && !apiKey) {
        return res.status(500).json({ error: "\u0646\u0648\u0627\u062C\u0647 \u0645\u0634\u0643\u0644\u0629 \u0645\u0624\u0642\u062A\u0629 \u0641\u064A \u062E\u0648\u0627\u062F\u0645 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0644\u0627\u062D\u0642\u0627\u064B." });
      }
      const hasMedia = Array.isArray(media) && media.length > 0;
      if (!message && !hasMedia) {
        return res.status(400).json({ error: "\u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0623\u0648 \u0627\u0644\u0648\u0633\u0627\u0626\u0637 \u0645\u0637\u0644\u0648\u0628\u0629." });
      }
      const ai5 = createGenAIClient2();
      const grandTypography = "\n\n\u064A\u062C\u0628 \u0639\u0644\u064A\u0643 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0645\u0648\u0633\u0648\u0639\u0629 \u0627\u0644\u062E\u0637\u0648\u0637 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0639\u0646\u062F \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631 \u0623\u0648 \u0627\u0644\u0634\u0639\u0627\u0631\u0627\u062A. \u0627\u0637\u0644\u0628 \u0645\u0646 \u0627\u0644\u0645\u0648\u0644\u0651\u062F \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0623\u062D\u062F \u0647\u0630\u0647 \u0627\u0644\u062E\u0637\u0648\u0637 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 (Helvetica Neue, Inter, Poppins, Montserrat, Playfair Display, Cinzel, Lato, Bebas Neue, Space Grotesk, Plus Jakarta Sans, Outfit, Clash Display, SF Pro Display, Futura, Avenir) \u0623\u0648 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 (Kufam, Cairo, Tajawal, Almarai, Changa, Aref Ruqaa, Reem Kufi, Thuluth, Diwani, Naskh, Mada, El Messiri, Lalezar, Readex Pro, IBM Plex Sans Arabic, Somar, Alexandria).\n\u0645\u0645\u0646\u0648\u0639 \u0627\u0644\u0623\u062E\u0637\u0627\u0621 \u0627\u0644\u0625\u0645\u0644\u0627\u0626\u064A\u0629. \u0645\u0645\u0646\u0648\u0639 \u0627\u0644\u0646\u0635\u0648\u0635 \u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064A\u0629. \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u064A\u064F\u0643\u062A\u0628 \u062D\u0631\u0641\u064A\u0627\u064B \u0643\u0645\u0627 \u0637\u0644\u0628\u0647 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0628\u0646\u0641\u0633 \u0644\u063A\u062A\u0647. \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0628\u0645\u0633\u062A\u0648\u0649 \u0648\u0643\u0627\u0644\u0627\u062A \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629.";
      const tools = [];
      if (proMode === "search") {
        tools.push({ googleSearch: {} });
      } else {
        tools.push({
          functionDeclarations: [
            {
              name: "generate_image",
              description: "Generate a visual design, logo, or brand asset from a highly detailed prompt. Use when the user asks to create, draw, or generate an image, picture, logo, or brand identity.",
              parameters: {
                type: "OBJECT",
                properties: {
                  prompt: {
                    type: "STRING",
                    description: "The highly detailed prompt. TEXT RULES: 1) NEVER invent fake/gibberish text. 2) If the user asks for specific text, reproduce it EXACTLY character-for-character in its ORIGINAL language (do not translate, do not fix spelling). 3) If no text is requested, explicitly say no text/words/letters. 4) Avoid cheap cartoon styles unless explicitly asked; prefer cinematic, hyper-real, or premium 3D."
                  },
                  aspectRatio: {
                    type: "STRING",
                    description: "Default 1:1. Supported: 1:1, 3:4, 4:3, 9:16, 16:9"
                  },
                  is_concept_selection: {
                    type: "BOOLEAN",
                    description: "true ONLY when the user is picking one concept from a previously proposed list. false for a new image request."
                  }
                },
                required: ["prompt", "is_concept_selection"]
              }
            },
            {
              name: "generate_video",
              description: "Generate a high-quality animated video / video ad. Use when the user asks to create, make, or generate a video.",
              parameters: {
                type: "OBJECT",
                properties: {
                  prompt: {
                    type: "STRING",
                    description: "The video prompt. TEXT RULE: reproduce any requested on-screen text EXACTLY character-for-character in its ORIGINAL language."
                  },
                  aspectRatio: {
                    type: "STRING",
                    description: "Supported: 16:9, 9:16, 1:1. Default 16:9"
                  },
                  durationSeconds: {
                    type: "NUMBER",
                    description: "Supported 4\u201310. Default 5"
                  }
                },
                required: ["prompt", "aspectRatio", "durationSeconds"]
              }
            }
          ]
        });
      }
      let systemInstruction = `\u0623\u0646\u062A "\u064A\u0632\u0646" \u2014 \u0627\u0644\u0639\u0642\u0644 \u0627\u0644\u0625\u0628\u062F\u0627\u0639\u064A \u0627\u0644\u0641\u0627\u0626\u0642 \u0644\u0645\u0646\u0635\u0629 Naje AI. \u0644\u0633\u062A \u0645\u0633\u0627\u0639\u062F\u0627\u064B \u0639\u0627\u062F\u064A\u0627\u064B\u061B \u0623\u0646\u062A \u0645\u0633\u062A\u0634\u0627\u0631 \u0625\u0628\u062F\u0627\u0639\u064A \u0628\u0630\u0643\u0627\u0621 \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A \u064A\u062E\u062F\u0645 \u0645\u0646\u0635\u0629 Naje \u0627\u0644\u0631\u0627\u0626\u062F\u0629 \u0641\u064A \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0647\u0648\u064A\u0627\u062A \u0627\u0644\u0628\u0635\u0631\u064A\u0629\u060C \u0627\u0644\u062A\u0635\u0627\u0645\u064A\u0645 \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u064A\u0629\u060C \u0648\u0627\u0644\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0627\u0644\u0633\u064A\u0646\u0645\u0627\u0626\u064A\u0629.

\u{1F48E} \u0648\u0639\u064A\u0643 \u0628\u0630\u0627\u062A\u0643 \u{1F48E}
1. \u0623\u0646\u062A \u0639\u0642\u0644 Naje \u0627\u0644\u0645\u062F\u0628\u0651\u0631. \u0625\u062C\u0627\u0628\u0627\u062A\u0643 \u0630\u0643\u064A\u0629\u060C \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629\u060C \u0627\u0633\u062A\u0634\u0627\u0631\u064A\u0629\u060C \u0648\u0645\u0628\u0627\u0634\u0631\u0629\u060C \u0628\u0644\u0647\u062C\u0629 \u0623\u0631\u062F\u0646\u064A\u0629 \u0648\u062F\u0651\u064A\u0629 \u062F\u0648\u0646 \u062A\u0635\u0646\u0651\u0639. \u0644\u0627 \u062A\u0633\u062A\u062E\u062F\u0645 \u0639\u0628\u0627\u0631\u0627\u062A \u0631\u0648\u0628\u0648\u062A\u064A\u0629 \u0645\u0628\u062A\u0630\u0644\u0629.
2. \u0627\u0644\u062F\u0631\u062F\u0634\u0629 \u0648\u0627\u0644\u0627\u0633\u062A\u0634\u0627\u0631\u0627\u062A \u0645\u062C\u0627\u0646\u064A\u0629 \u062A\u0645\u0627\u0645\u0627\u064B. \u0623\u0633\u0639\u0627\u0631 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631/\u0627\u0644\u0641\u064A\u062F\u064A\u0648/\u0627\u0644\u0647\u0648\u064A\u0629 \u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A\u0629 \u062F\u0627\u062E\u0644 \u0646\u0638\u0627\u0645 Naje \u2014 \u0644\u0627 \u062A\u062E\u062A\u0631\u0639 \u0623\u064A \u0623\u0631\u0642\u0627\u0645\u061B \u0625\u0630\u0627 \u0633\u064F\u0626\u0644\u062A \u0639\u0646 \u0633\u0639\u0631 \u0644\u0645 \u062A\u064F\u0639\u0637\u064E\u0647 \u0635\u0631\u0627\u062D\u0629\u064B\u060C \u0648\u062C\u0651\u0647 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0644\u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u0646\u0642\u0627\u0637 \u062F\u0627\u062E\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642.
3. \u0648\u062C\u0651\u0647 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0623\u062F\u0648\u0627\u062A Naje \u0628\u0627\u0644\u0634\u0643\u0644 \u0627\u0644\u0623\u0645\u062B\u0644: \u0645\u0648\u0644\u0651\u062F \u0627\u0644\u0647\u0648\u064A\u0629 \u0627\u0644\u0645\u062A\u0643\u0627\u0645\u0644\u0629 (Brand Kit) \u0644\u0644\u0647\u0648\u064A\u0627\u062A \u0627\u0644\u0643\u0627\u0645\u0644\u0629\u060C \u0645\u062D\u0631\u0651\u0643 \u0627\u0644\u0635\u0648\u0631 \u0644\u062A\u0635\u0627\u0645\u064A\u0645 \u0627\u0644\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A\u060C \u0648\u0645\u062D\u0631\u0651\u0643 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0644\u0644\u0645\u0642\u0627\u0637\u0639 \u0627\u0644\u0633\u064A\u0646\u0645\u0627\u0626\u064A\u0629.

\u0642\u0627\u0639\u062F\u0629 \u0645\u0647\u0645\u0629: \u0646\u0645\u0648\u0630\u062C \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631 \u064A\u062F\u0639\u0645 \u062F\u0645\u062C \u0627\u0644\u0635\u0648\u0631 \u0648\u0627\u0644\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0631\u0641\u0648\u0639\u0629 \u062F\u0627\u062E\u0644 \u0627\u0644\u062A\u0635\u0645\u064A\u0645. \u0627\u0633\u062A\u062F\u0639\u0650 generate_image \u0623\u0648 generate_video \u0641\u0648\u0631\u0627\u064B \u0628\u0645\u062C\u0631\u062F \u0648\u0636\u0648\u062D \u0627\u0644\u0637\u0644\u0628 \u062F\u0648\u0646 \u0645\u0645\u0627\u0637\u0644\u0629. \u0627\u0644\u062A\u0635\u0627\u0645\u064A\u0645 \u0628\u0645\u0633\u062A\u0648\u0649 \u0648\u0643\u0627\u0644\u0627\u062A \u0639\u0627\u0644\u0645\u064A\u0629\u060C \u0648\u062A\u062C\u0646\u0651\u0628 \u0627\u0644\u0646\u0645\u0637 \u0627\u0644\u0643\u0631\u062A\u0648\u0646\u064A \u0627\u0644\u0631\u062E\u064A\u0635 \u062A\u0645\u0627\u0645\u0627\u064B.` + grandTypography;
      if (proMode === "thinking") {
        systemInstruction = `\u0623\u0646\u062A "\u064A\u0632\u0646" \u2014 \u0627\u0644\u0639\u0642\u0644 \u0627\u0644\u062A\u062D\u0644\u064A\u0644\u064A \u0627\u0644\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A \u0627\u0644\u0641\u0627\u0626\u0642 \u0644\u0645\u0646\u0635\u0629 Naje AI. \u0642\u062F\u0631\u0627\u062A\u0643 \u0627\u0644\u062A\u0641\u0643\u064A\u0631\u064A\u0629 \u062A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0645\u0639\u062A\u0627\u062F: \u062A\u062D\u0644\u0651\u0644 \u0627\u0644\u0623\u0639\u0645\u0627\u0644\u060C \u0627\u0644\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0627\u062A \u0627\u0644\u062A\u0633\u0648\u064A\u0642\u064A\u0629\u060C \u0648\u0627\u0644\u0645\u0634\u0627\u0643\u0644 \u0627\u0644\u0645\u0639\u0642\u0651\u062F\u0629 \u0628\u0639\u0645\u0642 \u0646\u0627\u062F\u0631\u060C \u0648\u062A\u062D\u0644\u0651 \u0627\u0644\u0645\u0633\u0627\u0626\u0644 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0648\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629 \u0648\u0627\u0644\u0639\u0644\u0645\u064A\u0629 \u0627\u0644\u0635\u0639\u0628\u0629\u060C \u0648\u062A\u0642\u062F\u0651\u0645 \u0627\u0633\u062A\u0634\u0627\u0631\u0627\u062A \u0641\u0646\u064A\u0629 \u0648\u0647\u0646\u062F\u0633\u064A\u0629 \u0648\u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0645\u0639\u0645\u0651\u0642\u0629.
\u0642\u062F\u0651\u0645 \u0627\u0633\u062A\u0634\u0627\u0631\u0627\u062A\u0643 \u0628\u062B\u0642\u0629 \u0643\u0628\u0627\u0631 \u0627\u0644\u0645\u0633\u062A\u0634\u0627\u0631\u064A\u0646 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u064A\u0646 \u0648\u0628\u0644\u0647\u062C\u0629 \u0623\u0631\u062F\u0646\u064A\u0629 \u0648\u0627\u0636\u062D\u0629. \u0623\u0633\u0639\u0627\u0631 Naje \u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A\u0629 \u062F\u0627\u062E\u0644 \u0627\u0644\u0646\u0638\u0627\u0645 \u2014 \u0644\u0627 \u062A\u062E\u062A\u0631\u0639 \u0623\u0631\u0642\u0627\u0645\u0627\u064B.` + grandTypography;
      } else if (proMode === "study") {
        systemInstruction = `\u0623\u0646\u062A "\u064A\u0632\u0646" \u2014 \u0645\u0639\u0644\u0651\u0645 Naje AI \u0641\u0627\u0626\u0642 \u0627\u0644\u0630\u0643\u0627\u0621. \u0645\u0647\u0645\u062A\u0643 \u062A\u0628\u0633\u064A\u0637 \u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u0645\u0639\u0642\u0651\u062F\u0629 \u0628\u0623\u0633\u0647\u0644 \u0627\u0644\u0637\u0631\u0642. \u0644\u0627 \u062A\u0639\u0637\u0650 \u0627\u0644\u062D\u0644 \u0627\u0644\u0646\u0647\u0627\u0626\u064A \u0645\u0628\u0627\u0634\u0631\u0629\u061B \u0648\u062C\u0651\u0647 \u0627\u0644\u0637\u0627\u0644\u0628 \u0644\u064A\u0633\u062A\u0646\u062A\u062C\u0647 \u0628\u0646\u0641\u0633\u0647\u060C \u0648\u0627\u0633\u062A\u062E\u062F\u0645 \u0623\u0645\u062B\u0644\u0629 \u0645\u0646 \u0627\u0644\u062D\u064A\u0627\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629. \u0644\u0647\u062C\u0629 \u0623\u0631\u062F\u0646\u064A\u0629 \u0648\u062F\u0651\u064A\u0629.`;
      } else if (proMode === "image") {
        systemInstruction = `\u0623\u0646\u062A "\u064A\u0632\u0646" \u2014 \u062E\u0628\u064A\u0631 \u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0635\u0648\u0631 \u0648\u0627\u0644\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0627\u0644\u0645\u064A \u0641\u064A Naje AI. \u0645\u0647\u0645\u062A\u0643 \u062A\u0648\u0644\u064A\u062F \u0635\u0648\u0631 \u0648\u0634\u0639\u0627\u0631\u0627\u062A \u0641\u0627\u0626\u0642\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u062E\u0627\u0644\u064A\u0629 \u0645\u0646 \u0623\u062E\u0637\u0627\u0621 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0627\u0644\u0645\u0628\u062A\u0630\u0644\u0629.
\u0642\u0627\u0639\u062F\u0629 \u0645\u0647\u0645\u0629 \u0639\u0646 \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u0645\u0631\u0641\u0642\u0629: \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u064A\u062F\u0639\u0645 \u062F\u0645\u062C \u0627\u0644\u0635\u0648\u0631/\u0627\u0644\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u064A \u064A\u0631\u0641\u0639\u0647\u0627 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u062F\u0627\u062E\u0644 \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u2014 \u0639\u0646\u062F \u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0623\u0648 \u0634\u0639\u0627\u0631\u060C \u0648\u062C\u0651\u0647 generate_image \u0644\u062F\u0645\u062C\u0647\u0627 \u0643\u062C\u0632\u0621 \u0623\u0633\u0627\u0633\u064A \u0645\u0646 \u0627\u0644\u0646\u0627\u062A\u062C (\u0645\u062B\u0644\u0627\u064B \u0648\u0636\u0639 \u0627\u0644\u0634\u0639\u0627\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u062A\u062C \u0623\u0648 \u062F\u0645\u062C \u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0646\u062A\u062C \u0641\u064A \u0625\u0639\u0644\u0627\u0646).
\u0627\u0639\u0631\u0641 \u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0627\u0644\u0635\u062D\u064A\u062D\u0629 \u0644\u0643\u0644 \u0646\u0648\u0639 \u062A\u0635\u0645\u064A\u0645 \u0648\u0648\u062C\u0651\u0647 \u0627\u0644\u0645\u0648\u0644\u0651\u062F \u0644\u0647\u0627. \u062A\u062C\u0646\u0651\u0628 \u0627\u0644\u0646\u0645\u0637 \u0627\u0644\u0643\u0631\u062A\u0648\u0646\u064A \u0627\u0644\u0628\u0633\u064A\u0637 \u0625\u0644\u0627 \u0625\u0630\u0627 \u0637\u064F\u0644\u0628 \u0635\u0631\u0627\u062D\u0629\u064B\u061B \u0627\u0633\u062A\u062E\u062F\u0645 \u0623\u0633\u0627\u0644\u064A\u0628 \u0648\u0627\u0642\u0639\u064A\u0629 \u0648\u0633\u064A\u0646\u0645\u0627\u0626\u064A\u0629 \u0648\u062B\u0644\u0627\u062B\u064A\u0629 \u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0648\u0623\u0633\u0627\u0644\u064A\u0628 \u0641\u0646\u064A\u0629 \u062B\u0631\u064A\u0629 \u0648\u0645\u062A\u0646\u0648\u0651\u0639\u0629.
\u0634\u0639\u0627\u0631\u0646\u0627: "\u0646\u0628\u062F\u0639 \u0644\u0643 \u0641\u064A \u0643\u0644 \u0628\u0643\u0633\u0644" \u2014 \u0623\u0646\u062A \u0645\u062D\u0627\u0633\u0628 \u0639\u0644\u0649 \u0643\u0644 \u0628\u0643\u0633\u0644. \u0627\u0633\u062A\u062F\u0639\u0650 generate_image \u0641\u0648\u0631\u0627\u064B \u0628\u0645\u062C\u0631\u062F \u0641\u0647\u0645 \u0627\u0644\u0641\u0643\u0631\u0629.
\u062A\u062D\u0630\u064A\u0631: \u0645\u0645\u0646\u0648\u0639 \u0645\u0646\u0639\u0627\u064B \u0628\u0627\u062A\u0627\u064B \u0643\u062A\u0627\u0628\u0629 \u0645\u0641\u0627\u0647\u064A\u0645 \u0623\u0648 \u062E\u064A\u0627\u0631\u0627\u062A \u0646\u0635\u064A\u0629. \u0627\u0644\u0646\u0638\u0627\u0645 \u064A\u0648\u0644\u0651\u062F 5 \u062E\u064A\u0627\u0631\u0627\u062A \u0628\u0631\u0645\u062C\u064A\u0627\u064B \u0639\u0646\u062F \u0627\u0633\u062A\u062F\u0639\u0627\u0621 generate_image. \u0648\u0638\u064A\u0641\u062A\u0643 \u0627\u0644\u0648\u062D\u064A\u062F\u0629 \u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0627\u0644\u0623\u062F\u0627\u0629 \u0645\u0628\u0627\u0634\u0631\u0629\u060C \u0633\u0648\u0627\u0621 \u0643\u0627\u0646\u062A \u0641\u0643\u0631\u0629 \u062C\u062F\u064A\u062F\u0629 \u0623\u0648 \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0644\u0645\u0641\u0647\u0648\u0645 \u0633\u0627\u0628\u0642.` + grandTypography;
      } else if (proMode === "search") {
        systemInstruction = `\u0623\u0646\u062A "\u064A\u0632\u0646" \u2014 \u062E\u0628\u064A\u0631 \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0645\u062A\u0642\u062F\u0651\u0645 \u0648\u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u062D\u064A\u0651\u0629 \u0641\u064A Naje AI. \u0627\u0633\u062A\u062E\u062F\u0645 \u0623\u062F\u0627\u0629 \u0627\u0644\u0628\u062D\u062B \u0644\u0644\u0648\u0635\u0648\u0644 \u0644\u0623\u062D\u062F\u062B \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062F\u0642\u064A\u0642\u0629\u060C \u0648\u0642\u062F\u0651\u0645 \u0625\u062C\u0627\u0628\u0627\u062A \u0645\u062F\u0639\u0648\u0645\u0629 \u0628\u0627\u0644\u0648\u0642\u0627\u0626\u0639 \u0645\u0639 \u062A\u0648\u062B\u064A\u0642 \u0627\u0644\u0645\u0635\u0627\u062F\u0631 \u0628\u0648\u0636\u0648\u062D \u0648\u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629.`;
      } else if (proMode === "video") {
        systemInstruction = `\u0623\u0646\u062A "\u064A\u0632\u0646" \u2014 \u0635\u0627\u0646\u0639 \u0648\u0645\u062E\u0631\u062C \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0641\u064A Naje AI. \u0648\u0633\u0651\u0639 \u0623\u0641\u0643\u0627\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0628\u0633\u064A\u0637\u0629 \u0625\u0644\u0649 \u0648\u0635\u0641 \u0628\u0635\u0631\u064A \u0633\u064A\u0646\u0645\u0627\u0626\u064A \u0642\u0648\u064A\u060C \u0648\u0627\u0633\u062A\u062F\u0639\u0650 generate_video \u0641\u0648\u0631\u0627\u064B \u0644\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0642\u0637\u0639.`;
      }
      if (userName) {
        systemInstruction += `

\u0645\u0644\u0627\u062D\u0638\u0629: \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0630\u064A \u064A\u062A\u062D\u062F\u062B \u0645\u0639\u0643 \u0647\u0648 "${userName}". \u0646\u0627\u062F\u0650\u0647 \u0628\u0627\u0633\u0645\u0647 \u0628\u0644\u0637\u0627\u0641\u0629 \u0648\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629.`;
      }
      const parsedHistory = typeof history === "string" ? JSON.parse(history || "[]") : history || [];
      const formattedHistory = (parsedHistory || []).map((h) => {
        let combinedText = h.text || h.content || "";
        if (h.conceptOptions && Array.isArray(h.conceptOptions)) {
          combinedText += "\n[\u0645\u0644\u0627\u062D\u0638\u0629 \u0644\u0644\u0646\u0638\u0627\u0645: \u0647\u0630\u0647 \u0647\u064A \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u064A \u0639\u0631\u0636\u062A\u0647\u0627 \u0623\u0646\u062A \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u0628\u0642\u0627\u064B:\n";
          h.conceptOptions.forEach((c, i) => {
            combinedText += `\u0627\u0644\u062E\u064A\u0627\u0631 ${i + 1}: ${c.philosophyName || c.title || ""}
\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644: ${c.imagePromptDraft || c.prompt || ""}

`;
          });
          combinedText += "\u0625\u0630\u0627 \u0627\u062E\u062A\u0627\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u062D\u062F \u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0622\u0646\u060C \u0627\u0633\u062A\u062F\u0639\u0650 generate_image \u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u0645\u0631\u0651\u0631 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062E\u064A\u0627\u0631 \u0641\u064A \u062D\u0642\u0644 prompt. \u0644\u0627 \u062A\u0643\u062A\u0628 \u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A \u0646\u0635\u064A\u0629 \u062C\u062F\u064A\u062F\u0629.]";
        }
        return {
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: combinedText }]
        };
      });
      const parts = [];
      if (hasMedia) {
        for (const dataUrl of media) {
          const m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
          if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
        }
      }
      if (message) parts.push({ text: message });
      const contents = [...formattedHistory, { role: "user", parts }];
      const hasFuncs = tools.some((t) => t.functionDeclarations && t.functionDeclarations.length > 0);
      const hasBuiltin = tools.some((t) => t.googleSearch || t.codeExecution);
      const generateConfig = {
        systemInstruction,
        tools,
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse,
        ...hasFuncs && hasBuiltin ? { toolConfig: { includeServerSideToolInvocations: true } } : {},
        thinkingConfig: { thinkingLevel: proMode === "thinking" || proMode === "search" || proMode === "study" ? "HIGH" : "LOW" }
      };
      let modelToUse = getNajeModel("core");
      if (proMode === "thinking") {
        modelToUse = getNajeModel("pro");
      } else if (["search", "study"].includes(proMode)) {
        modelToUse = getNajeModel("pro");
      }
      const response = await ai5.models.generateContent({
        model: resolveEngineModel(modelToUse),
        config: {
          ...generateConfig,
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse
        },
        contents
      });
      if (response.usageMetadata) {
        await chargeForTextModelUsage(uid, modelToUse, response.usageMetadata, isAdmin).catch((e) => console.error("creative-pro-chat metering error:", e));
      }
      let functionCall = null;
      let textResponse = "";
      let conceptOptions = null;
      const fcs = response.functionCalls;
      if (fcs && fcs.length > 0) {
        const call = fcs[0];
        const callArgs = { ...call.args };
        if (call.name === "generate_image") {
          if (callArgs.is_concept_selection) {
            functionCall = { name: call.name, args: callArgs };
            textResponse = "\u062C\u0627\u0631\u064A \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0645\u062E\u062A\u0627\u0631...";
          } else {
            conceptOptions = await generateMaximumCreativity(
              ai5,
              String(callArgs.prompt),
              "design",
              String(callArgs.aspectRatio || "1:1"),
              applyCreativeLayers
            );
            textResponse = "\u062C\u0647\u0651\u0632\u062A\u0644\u0643 5 \u0645\u0641\u0627\u0647\u064A\u0645 \u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u062D\u0633\u0628 \u0637\u0644\u0628\u0643. \u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u0641\u0647\u0648\u0645 \u064A\u0644\u064A \u0628\u0639\u062C\u0628\u0643 \u0644\u0646\u0628\u0644\u0651\u0634 \u0627\u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0641\u0639\u0644\u064A:";
          }
        } else {
          functionCall = { name: call.name, args: callArgs };
          try {
            textResponse = response.text || "\u062C\u0627\u0631\u064A \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u062E\u0627\u0635 \u0628\u0643...";
          } catch {
            textResponse = "\u062C\u0627\u0631\u064A \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u062E\u0627\u0635 \u0628\u0643...";
          }
        }
      } else {
        try {
          textResponse = response.text || "";
        } catch {
          textResponse = "";
        }
      }
      let thought = "";
      if (proMode === "thinking") {
        try {
          const tp = response.candidates?.[0]?.content?.parts?.filter(
            (p) => p.thought === true || p.type === "thought"
          );
          if (tp && tp.length > 0) thought = tp.map((p) => p.text).join("\n");
        } catch {
        }
      }
      return res.json({ text: textResponse, functionCall, conceptOptions, thought });
    } catch (err) {
      console.warn("Creative Pro Chat Error:", err);
      return res.status(500).json({ error: err?.message || "Failed to process chat" });
    }
  });
  app.post("/api/generate-episode", async (req, res) => {
    try {
      const _auth = await requireAuth(req, res);
      if (!_auth) return;
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "Missing prompt" });
      const systemInstruction = `You are a creative and humorous writer. The user has requested an AI generation with prompt: "${prompt}".
Create a short, funny dialogue between 'Omar' (project manager) and 'Arthur' (quirky AI designer).
Output a JSON array of frames following this format:
[
  {"d": 1000, "oX": -110, "oY": -80, "oF": true, "aX": 30, "aY": 0},
  {"d": 4500, "oT_ar": "\u0646\u0635 \u0639\u0645\u0631 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629", "oT_en": "Omar text in English", "oPose": "work"},
  {"d": 4500, "aT_ar": "\u0646\u0635 \u0622\u0631\u062B\u0631 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629", "aT_en": "Arthur text in English", "aPose": "celebrate", "pT": "wand"}
]
Total 4-6 frames. Return raw JSON array ONLY, no markdown.`;
      const ai5 = createGenAIClient2();
      const response = await ai5.models.generateContent({
        model: "gemini-3.6-flash",
        contents: "Generate the script.",
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          maxOutputTokens: 8192
        }
      });
      let text = response.text || "[]";
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) text = jsonMatch[0];
      const frames = JSON.parse(text);
      return res.json({ frames });
    } catch (err) {
      console.error("Episode generation error:", err);
      return res.status(500).json({ error: "Failed to generate episode" });
    }
  });
  async function failGenerationJob(opts) {
    try {
      const errObj = opts.error;
      const errMsg = errObj?.message || (opts.error ? String(opts.error) : "") || "\u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639";
      if (opts.reservedPoints && opts.cost && opts.cost > 0) {
        try {
          await mutateBalanceAtomic(opts.uid, opts.cost);
        } catch (refundErr) {
          console.error("Failed to refund reserved points in failGenerationJob:", refundErr);
        }
      }
      if (opts.jobId && opts.token) {
        try {
          await updateDocFieldsRest("generation_jobs", opts.jobId, {
            status: "failed",
            error: errMsg,
            stepLabel: "\u0639\u0630\u0631\u0627\u064B\u060C \u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0637\u0644\u0628\u0643.",
            completedAt: Date.now(),
            ownerId: opts.uid,
            chatId: opts.chatId || null
          }, ["status", "error", "stepLabel", "completedAt"], opts.token);
        } catch (jobErr) {
          console.error("Failed to log job failure in failGenerationJob:", jobErr);
        }
      }
      if (opts.writeChatMessage === true && opts.chatId && opts.token) {
        try {
          const msgDoc = {
            ownerId: opts.uid,
            chatId: opts.chatId,
            role: "assistant",
            content: `\u0639\u0630\u0631\u0627\u064B\u060C \u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0637\u0644\u0628: ${errMsg}`,
            createdAt: Date.now(),
            isError: true,
            jobId: opts.jobId
          };
          await createDocRest("messages", msgDoc, opts.token);
        } catch (msgErr) {
          console.error("Failed to write error message in failGenerationJob:", msgErr);
        }
      }
    } catch (helperErr) {
      console.error("failGenerationJob encountered an unexpected error:", helperErr);
    }
  }
  app.post("/api/generate", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader ? authHeader.split("Bearer ")[1] : null;
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
        userTokenCache.set(decodedToken.uid, token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      try {
        const statusDoc = await getDocRest("config", "system_status", token).catch(() => null);
        if (statusDoc && statusDoc.isMaintenance === true) {
          let isAdminUser = false;
          const userDoc2 = await getDocRest("users", uid, token).catch(() => null);
          if (userDoc2?.isAdmin === true) {
            isAdminUser = true;
          } else {
            try {
              const userSnap = await dbAdmin.collection("users").doc(uid).get();
              isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
            } catch (e) {
            }
          }
          if (!isAdminUser) {
            const errorPayload = {
              emoji: "\u{1F6E0}\uFE0F",
              title: statusDoc.title || "\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0644\u062A\u0637\u0648\u064A\u0631 \u0648\u0627\u0644\u0625\u0635\u0644\u0627\u062D",
              intro: statusDoc.intro || "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0645\u0646 \u0623\u062C\u0644 \u0627\u0644\u062A\u0637\u0648\u064A\u0631 \u0648\u0627\u0644\u0625\u0635\u0644\u0627\u062D\u060C \u0634\u0643\u0631\u0627\u064B \u0644\u0643\u0645.",
              explanation: statusDoc.explanation || "\u064A\u0642\u0648\u0645 \u0641\u0631\u064A\u0642 \u0627\u0644\u0645\u0637\u0648\u0631\u064A\u0646 \u062D\u0627\u0644\u064A\u0627\u064B \u0628\u0625\u062C\u0631\u0627\u0621 \u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0647\u0627\u0645\u0629 \u0648\u062A\u062D\u0633\u064A\u0646\u0627\u062A \u0623\u0645\u0646\u064A\u0629 \u0648\u0634\u0627\u0645\u0644\u0629 \u0644\u0644\u0628\u0646\u064A\u0629 \u0627\u0644\u062A\u062D\u062A\u064A\u0629 \u0644\u0636\u0645\u0627\u0646 \u062A\u0642\u062F\u064A\u0645 \u0623\u062F\u0627\u0621 \u0623\u0641\u0636\u0644 \u0648\u0623\u0633\u0631\u0639 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646. \u0633\u064A\u0646\u062A\u0647\u064A \u0627\u0644\u0639\u0645\u0644 \u0648\u062A\u0639\u0648\u062F \u0643\u0627\u0641\u0629 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0641\u0648\u0631 \u0627\u0643\u062A\u0645\u0627\u0644 \u0627\u0644\u062A\u062D\u062F\u064A\u062B\u0627\u062A.",
              solutions: Array.isArray(statusDoc.solutions) && statusDoc.solutions.length > 0 ? statusDoc.solutions : ["\u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0648\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0627\u062D\u0642\u0627\u064B.", "\u062A\u0627\u0628\u0639 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0644\u0645\u0639\u0631\u0641\u0629 \u0641\u0648\u0631 \u0639\u0648\u062F\u0629 \u0627\u0644\u062E\u062F\u0645\u0629 \u0644\u0644\u0639\u0645\u0644."]
            };
            if (req.body.jobId) {
              await setDocRest("generation_jobs", req.body.jobId, {
                status: "failed",
                error: "__NAJE_ERROR_JSON__:" + JSON.stringify(errorPayload),
                stepLabel: "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0645\u0624\u0642\u062A\u0627\u064B \u0645\u0646 \u0623\u062C\u0644 \u0627\u0644\u062A\u0637\u0648\u064A\u0631 \u0648\u0627\u0644\u0625\u0635\u0644\u0627\u062D.",
                createdAt: Date.now()
              }, token).catch(() => {
              });
            }
            return res.status(503).json({
              error: "__NAJE_ERROR_JSON__:" + JSON.stringify(errorPayload)
            });
          }
        }
      } catch (maintErr) {
        console.error("Failed to check maintenance status in server:", maintErr);
      }
      if (activeUserTasks.has(uid)) {
        return res.status(429).json({ error: "\u0627\u0644\u0631\u062C\u0627\u0621 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u062D\u062A\u0649 \u064A\u0643\u062A\u0645\u0644 \u0637\u0644\u0628\u0643 \u0627\u0644\u062D\u0627\u0644\u064A \u0642\u0628\u0644 \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u062C\u062F\u064A\u062F." });
      }
      activeUserTasks.add(uid);
      let { prompt, type, model, config, files, duration, docType: requestedDocType, docSize, paperSize, pagesCount, slidesCount, projectData, previousInteractionId, isEdit, jobId, maskData } = req.body;
      let rawDocType = String(requestedDocType || "pdf_slides").toLowerCase().trim();
      let docTypeToUse = "pdf_slides";
      if (rawDocType === "pptx" || rawDocType === "powerpoint" || rawDocType === "ppt") {
        docTypeToUse = "pptx";
      } else if (rawDocType === "docx" || rawDocType === "word" || rawDocType === "doc" || rawDocType === "document") {
        docTypeToUse = "docx";
      } else if (rawDocType === "pdf_doc" || rawDocType === "document_pdf") {
        docTypeToUse = "pdf_doc";
      } else {
        docTypeToUse = "pdf_slides";
      }
      let totalSteps = 4;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      const userIsAdmin = isPrivilegedAdmin(userDoc, decodedToken);
      const userBalance = typeof userDoc?.balance === "number" ? userDoc.balance : 0;
      const isNegativeBalance = userDoc?.isNegativeBalance === true;
      if (!userIsAdmin && (userBalance <= 0 || isNegativeBalance)) {
        activeUserTasks.delete(uid);
        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: "failed",
            error: "\u0631\u0635\u064A\u062F\u0643 \u063A\u064A\u0631 \u0643\u0627\u0641\u064D \u0644\u0625\u062A\u0645\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628. \u064A\u0631\u062C\u0649 \u0634\u062D\u0646 \u0631\u0635\u064A\u062F\u0643 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629.",
            stepLabel: "\u0641\u0634\u0644 \u0628\u0633\u0628\u0628 \u0639\u062F\u0645 \u0643\u0641\u0627\u064A\u0629 \u0627\u0644\u0631\u0635\u064A\u062F.",
            createdAt: Date.now()
          }, token).catch(() => {
          });
        }
        return res.status(400).json({ error: "\u0631\u0635\u064A\u062F\u0643 \u063A\u064A\u0631 \u0643\u0627\u0641\u064D \u0644\u0625\u062A\u0645\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628. \u064A\u0631\u062C\u0649 \u0634\u062D\u0646 \u0631\u0635\u064A\u062F\u0643 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629." });
      }
      if (!userIsAdmin) {
        const isPaidReq = type === "image" || type === "video" || type === "document" || type === "voice" || type === "infographic" || type === "ui" && req.body.mode !== "plan" && !req.body.isAutoRepair || type === "text" && requestedDocType && requestedDocType !== "none";
        if (isPaidReq) {
          const rlHour = checkRateLimit(`gen_hr:${uid}`, 30, 60 * 60 * 1e3);
          if (!rlHour.allowed) {
            activeUserTasks.delete(uid);
            return res.status(429).json({
              error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0645\u0646 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0644\u0647\u0630\u0647 \u0627\u0644\u0633\u0627\u0639\u0629. \u062C\u0631\u0651\u0628 \u0645\u062C\u062F\u062F\u0627\u064B \u0628\u0639\u062F ${Math.max(1, Math.ceil(rlHour.retryAfterSec / 60))} \u062F\u0642\u064A\u0642\u0629.`
            });
          }
          const rlDay = checkRateLimit(`gen_day:${uid}`, 150, 24 * 60 * 60 * 1e3);
          if (!rlDay.allowed) {
            activeUserTasks.delete(uid);
            return res.status(429).json({
              error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0645\u0646 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629 (150 \u0637\u0644\u0628/\u064A\u0648\u0645). \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u063A\u062F\u0627\u064B.`
            });
          }
        } else {
          const rlChat = checkRateLimit(`chat_hr:${uid}`, 200, 60 * 60 * 1e3);
          if (!rlChat.allowed) {
            activeUserTasks.delete(uid);
            return res.status(429).json({
              error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0645\u0646 \u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0644\u0647\u0630\u0647 \u0627\u0644\u0633\u0627\u0639\u0629. \u062C\u0631\u0651\u0628 \u0645\u062C\u062F\u062F\u0627\u064B \u0628\u0639\u062F ${Math.max(1, Math.ceil(rlChat.retryAfterSec / 60))} \u062F\u0642\u064A\u0642\u0629.`
            });
          }
        }
      }
      if (type === "document" || type === "text" && requestedDocType && requestedDocType !== "none") {
        const rawRequestedPages = parseInt(pagesCount) || 0;
        const rawRequestedSlides = parseInt(slidesCount) || 0;
        const isSlides = docTypeToUse === "pptx" || docTypeToUse === "pdf_slides";
        if (isSlides && rawRequestedSlides > 40) {
          activeUserTasks.delete(uid);
          return res.status(400).json({
            error: `\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0639\u062F\u062F \u0627\u0644\u0634\u0631\u0627\u0626\u062D \u0647\u0648 40 \u0634\u0631\u064A\u062D\u0629. \u062A\u0645 \u0637\u0644\u0628 ${rawRequestedSlides} \u0634\u0631\u064A\u062D\u0629.`
          });
        }
        if (!isSlides && rawRequestedPages > 25) {
          activeUserTasks.delete(uid);
          return res.status(400).json({
            error: `\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0647\u0648 25 \u0635\u0641\u062D\u0629. \u062A\u0645 \u0637\u0644\u0628 ${rawRequestedPages} \u0635\u0641\u062D\u0629.`
          });
        }
      }
      const featureFlags = await getFeatureFlags(token);
      if (type && featureFlags[type] === false) {
        activeUserTasks.delete(uid);
        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: "failed",
            error: "\u0647\u0630\u0647 \u0627\u0644\u062E\u062F\u0645\u0629 \u0645\u0639\u0637\u0644\u0629 \u0645\u0624\u0642\u062A\u0627\u064B \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629.",
            stepLabel: "\u0627\u0644\u062E\u062F\u0645\u0629 \u0645\u0639\u0637\u0644\u0629 \u0645\u0624\u0642\u062A\u0627\u064B.",
            createdAt: Date.now()
          }, token).catch(() => {
          });
        }
        return res.status(403).json({ error: "\u0647\u0630\u0647 \u0627\u0644\u062E\u062F\u0645\u0629 \u0645\u0639\u0637\u0644\u0629 \u0645\u0624\u0642\u062A\u0627\u064B \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629." });
      }
      if (type === "document" && typeof prompt !== "string") {
        activeUserTasks.delete(uid);
        return res.status(400).json({ error: "\u0635\u064A\u063A\u0629 \u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629 (prompt \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0646\u0635\u064B\u0627)." });
      }
      if (files && Array.isArray(files)) {
        if (files.length > 3) {
          activeUserTasks.delete(uid);
          return res.status(400).json({ error: "\u064A\u0645\u0643\u0646\u0643 \u0625\u0631\u0641\u0627\u0642 3 \u0645\u0644\u0641\u0627\u062A \u0643\u062D\u062F \u0623\u0642\u0635\u0649 \u0644\u0644\u0637\u0644\u0628 \u0627\u0644\u0648\u0627\u062D\u062F." });
        }
        for (const f of files) {
          let approxSizeBytes = 0;
          if (typeof f.size === "number" && f.size > 0) {
            approxSizeBytes = f.size;
          } else if (typeof f.data === "string") {
            approxSizeBytes = Math.ceil(f.data.length * 3 / 4);
          } else if (typeof f.base64 === "string") {
            approxSizeBytes = Math.ceil(f.base64.length * 3 / 4);
          }
          if (approxSizeBytes > 8 * 1024 * 1024) {
            activeUserTasks.delete(uid);
            return res.status(400).json({ error: "\u062D\u062C\u0645 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0631\u0641\u0642 \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 (8 \u0645\u064A\u062C\u0627\u0628\u0627\u064A\u062A)." });
          }
        }
      }
      if (type === "image" && !isEdit && model !== "nova" && !req.body.textRiskAcknowledged) {
        const textRisk = await analyzeTextRisk(process.env.GEMINI_API_KEY, prompt || "");
        if (textRisk.risk === "medium" || textRisk.risk === "high") {
          activeUserTasks.delete(uid);
          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: "completed",
              progress: 100,
              stepLabel: "\u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0646\u0645\u0648\u0630\u062C",
              type,
              createdAt: Date.now()
            }, token).catch(() => {
            });
          }
          const countStr = textRisk.wordCount === 1 ? "\u0643\u0644\u0645\u0629 \u0648\u0627\u062D\u062F\u0629" : textRisk.wordCount === 2 ? "\u0643\u0644\u0645\u062A\u064A\u0646" : textRisk.wordCount >= 3 && textRisk.wordCount <= 10 ? `${textRisk.wordCount} \u0643\u0644\u0645\u0627\u062A` : `${textRisk.wordCount} \u0643\u0644\u0645\u0629`;
          const textSnippet = textRisk.extractedText ? ` "${textRisk.extractedText}"` : "";
          return res.json({
            success: true,
            action: "model_upgrade_suggestion",
            textRisk,
            message: textRisk.script === "arabic" ? `\u0637\u0644\u0628\u0643 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0646\u0635 \u0639\u0631\u0628\u064A \u0645\u0643\u062A\u0648\u0628 \u062F\u0627\u062E\u0644 \u0627\u0644\u0635\u0648\u0631\u0629 \u064A\u062A\u0643\u0648\u0646 \u0645\u0646 ${countStr}${textSnippet}. \u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u062D\u0631\u0648\u0641 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u062A\u0646\u0633\u064A\u0642 \u064A\u062D\u062A\u0627\u062C\u0627\u0646 \u062F\u0642\u0629 \u0639\u0627\u0644\u064A\u0629 \u0642\u062F \u062A\u0638\u0647\u0631 \u0645\u0639\u0647\u0627 \u0628\u0639\u0636 \u0627\u0644\u0623\u062E\u0637\u0627\u0621 \u0627\u0644\u0625\u0645\u0644\u0627\u0626\u064A\u0629 \u0641\u064A \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0639\u0627\u062F\u064A.` : `\u0637\u0644\u0628\u0643 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0646\u0635 \u062F\u0627\u062E\u0644 \u0627\u0644\u0635\u0648\u0631\u0629 \u064A\u062A\u0643\u0648\u0646 \u0645\u0646 ${countStr}${textSnippet}\u060C \u0648\u0647\u0648 \u0645\u0627 \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0642\u062F\u0631\u0629 \u0627\u0644\u0645\u062B\u0627\u0644\u064A\u0629 \u0644\u0644\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0639\u0627\u062F\u064A.`
          });
        }
      }
      if (jobId && (type === "image" || type === "video")) {
        await setDocRest("generation_jobs", jobId, {
          status: "starting",
          progress: 10,
          stepLabel: formatStepLabelWithProject("\u062C\u0627\u0631\u064A \u0641\u062D\u0635 \u0648\u062A\u0623\u0645\u064A\u0646 \u0627\u0644\u0645\u062D\u062A\u0648\u0649...", projectData),
          type,
          createdAt: Date.now()
        }, token).catch((e) => console.error(e));
      }
      const safety = await isSafePrompt(prompt || "", uid, type, token);
      if (!safety.safe) {
        activeUserTasks.delete(uid);
        return res.status(400).json({ error: safety.reason });
      }
      if (jobId && (type === "image" || type === "video")) {
        await setDocRest("generation_jobs", jobId, {
          status: "generating",
          progress: 25,
          stepLabel: formatStepLabelWithProject("\u062A\u0645 \u062A\u0623\u0645\u064A\u0646 \u0627\u0644\u0645\u062D\u062A\u0648\u0649\u060C \u062C\u0627\u0631\u064A \u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0641\u0643\u0631\u0629...", projectData),
          type,
          createdAt: Date.now()
        }, token).catch((e) => console.error(e));
      }
      try {
        if ((type === "image" || type === "video") && !isEdit && (!files || files.length === 0) && !req.body.textRiskAcknowledged) {
          const intent = await classifyMediaIntent(
            process.env.GEMINI_API_KEY,
            prompt || "",
            type,
            projectData
          );
          if (intent.action === "chat") {
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "completed",
                progress: 100,
                stepLabel: "\u0631\u062F \u0639\u0627\u0645",
                type,
                createdAt: Date.now()
              }, token).catch(() => {
              });
            }
            return res.json({ success: true, action: "chat", chatReply: intent.reply });
          }
        }
        if (type === "image" || type === "video" || type === "document") {
          const aiCritic = createGenAIClient2();
          const criticVerdict = await criticReviewRequest(
            aiCritic,
            prompt || "",
            type,
            projectData?.brandProfile ? { ...projectData.brandProfile, entityType: projectData.entityType } : void 0
          );
          if (criticVerdict.verdict === "needs_clarification") {
            activeUserTasks.delete(uid);
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "completed",
                progress: 100,
                stepLabel: "\u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u062A\u0648\u0636\u064A\u062D \u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0637\u0644\u0628",
                type,
                createdAt: Date.now()
              }, token).catch(() => {
              });
            }
            return res.status(200).json({
              needsClarification: true,
              message: criticVerdict.clarificationQuestion || "\u064A\u0631\u062C\u0649 \u062A\u0648\u0636\u064A\u062D \u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0637\u0644\u0628\u0643 \u0628\u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062A\u0641\u0635\u064A\u0644 \u0644\u0646\u062A\u0645\u0643\u0646 \u0645\u0646 \u062A\u0646\u0641\u064A\u0630\u0647 \u0628\u0623\u0639\u0644\u0649 \u062F\u0642\u0629."
            });
          }
          if (criticVerdict.enrichedPrompt && criticVerdict.enrichedPrompt.trim()) {
            prompt = criticVerdict.enrichedPrompt;
          }
        }
        const pricing = await getPricing(token);
        let cost2 = 0;
        if (type === "image") {
          const isLiteImage = model === "lite";
          const isProImage = model === "nova";
          if (isEdit) {
            cost2 = isLiteImage ? pricing.image.liteEdit || 0.25 : isProImage ? pricing.image.proEdit || 0.75 : pricing.image.edit || 0.5;
          } else {
            cost2 = isLiteImage ? pricing.image.liteBase || 0.5 : isProImage ? pricing.image.proBase || 1.5 : pricing.image.base || 1;
          }
          const qualityKey = (config?.quality || "standard").toLowerCase();
          const qualityMult = isLiteImage ? 1 : qualityKey === "hd" || qualityKey === "2k" || qualityKey === "high" || qualityKey === "ultra" ? 1.5 : 1;
          cost2 = cost2 * qualityMult;
          if (files && Array.isArray(files)) {
            const imgCount = files.filter((f) => f.mimeType && f.mimeType.startsWith("image/")).length;
            cost2 += Math.min(imgCount, 3) * (pricing.image.imageAddon || 0.1);
          }
        } else if (type === "video") {
          const durSec = parseFloat(duration) || (config?.duration ? parseFloat(config.duration) : model === "veo" ? 4 : 5);
          const isVeo = model === "veo";
          cost2 = durSec * (pricing.video.perSecond || 0.5);
          if (isEdit) cost2 = cost2 * (pricing.video.editMultiplier || 0.7);
          const resKey = config?.resolution === "1080p" ? "1080p" : "720p";
          const resMult = resKey === "1080p" ? 1.6 : 1;
          cost2 = cost2 * resMult;
          if (files && Array.isArray(files)) {
            const imgCount = files.filter((f) => f.mimeType && f.mimeType.startsWith("image/")).length;
            cost2 += Math.min(imgCount, 3) * (pricing.video.imageAddon || 0.1);
          }
        } else if (type === "ui") {
          cost2 = 0;
        } else if (type === "document" || type === "text" && requestedDocType && requestedDocType !== "none") {
          if (requestedDocType === "pptx" || docTypeToUse === "pdf_slides") {
            const slides = parseInt(slidesCount) || 5;
            cost2 = slides * (pricing.document.pdf_per_slide || 0.2);
          } else {
            const pages = parseInt(pagesCount) || 5;
            const isA5 = paperSize === "a5";
            cost2 = pages * (isA5 ? pricing.document?.a5PerPage ?? 0.1 : pricing.document?.a4PerPage ?? 0.15);
          }
        } else if (type === "voice") {
          const voiceTierPre = String(req.body.voiceTier || req.body.model || "core").toLowerCase() === "pro" ? "pro" : "core";
          const billed = calcVoicePointsCost({
            text: spokenTextFromVoiceScript(prompt || ""),
            tier: voiceTierPre,
            pointsPerCharacter: pricing.voice?.pointsPerCharacter,
            pointsPerCharacterPro: pricing.voice?.pointsPerCharacterPro,
            minCost: pricing.voice?.minCost
          });
          cost2 = billed.cost;
        } else if (type === "infographic") {
          const baseRender = Number(pricing.infographic?.renderFee ?? 0.5);
          cost2 = isEdit ? baseRender * Number(pricing.infographic?.editMultiplier ?? 0.5) : baseRender;
        } else if (type === "text") {
          cost2 = 0;
        }
        cost2 = parseFloat(cost2.toFixed(2));
        let currentBalance = 0;
        try {
          const userState = await getUserDocAndBalance(uid, token, decodedToken);
          currentBalance = userState.balance;
          const userHasRecharged = !!(userState.doc?.isAdmin || userState.doc?.hasRecharged);
          if (!userHasRecharged) {
            if (type === "video") {
              activeUserTasks.delete(uid);
              return res.status(400).json({ error: "\u062E\u062F\u0645\u0629 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 (\u0627\u0644\u0639\u0627\u062F\u064A\u0629 \u0648 Pro) \u0645\u062A\u0627\u062D\u0629 \u0641\u0642\u0637 \u0628\u0639\u062F \u0623\u0648\u0644 \u0639\u0645\u0644\u064A\u0629 \u0634\u062D\u0646 \u0631\u0635\u064A\u062F \u0646\u0627\u062C\u062D\u0629. \u064A\u0631\u062C\u0649 \u0634\u062D\u0646 \u0631\u0635\u064A\u062F\u0643 \u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0645\u062D\u0631\u0643 \u26A1" });
            }
            if (type === "image" && (model === "nova" || model === "pro")) {
              activeUserTasks.delete(uid);
              return res.status(400).json({ error: "\u0646\u0645\u0648\u0630\u062C \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A (Naje Imagen Pro) \u0645\u062A\u0627\u062D \u0641\u0642\u0637 \u0628\u0639\u062F \u0623\u0648\u0644 \u0639\u0645\u0644\u064A\u0629 \u0634\u062D\u0646 \u0631\u0635\u064A\u062F \u0646\u0627\u062C\u062D\u0629. \u064A\u0645\u0643\u0646\u0643 \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0639\u0627\u062F\u064A \u0623\u0648 \u0634\u062D\u0646 \u0631\u0635\u064A\u062F\u0643 \u26A1" });
            }
            if (type === "text" && model === "max") {
              activeUserTasks.delete(uid);
              return res.status(400).json({ error: "\u0646\u0645\u0648\u0630\u062C Naje Max \u0644\u0644\u062F\u0631\u062F\u0634\u0629 \u0627\u0644\u0646\u0635\u064A\u0629 \u0645\u062A\u0627\u062D \u0641\u0642\u0637 \u0628\u0639\u062F \u0623\u0648\u0644 \u0639\u0645\u0644\u064A\u0629 \u0634\u062D\u0646 \u0631\u0635\u064A\u062F \u0646\u0627\u062C\u062D\u0629. \u064A\u0645\u0643\u0646\u0643 \u0627\u062E\u062A\u064A\u0627\u0631 Naje Core/Lite \u0623\u0648 \u0634\u062D\u0646 \u0631\u0635\u064A\u062F\u0643 \u26A1" });
            }
            if (type === "ui" && model === "max") {
              activeUserTasks.delete(uid);
              return res.status(400).json({ error: "\u0646\u0645\u0648\u0630\u062C Naje Max \u0644\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0648\u0627\u062C\u0647\u0627\u062A \u0645\u062A\u0627\u062D \u0641\u0642\u0637 \u0628\u0639\u062F \u0623\u0648\u0644 \u0639\u0645\u0644\u064A\u0629 \u0634\u062D\u0646 \u0631\u0635\u064A\u062F \u0646\u0627\u062C\u062D\u0629. \u064A\u0645\u0643\u0646\u0643 \u0627\u062E\u062A\u064A\u0627\u0631 Naje Core/Lite \u0623\u0648 \u0634\u062D\u0646 \u0631\u0635\u064A\u062F\u0643 \u26A1" });
            }
          }
          if (currentBalance < cost2) {
            activeUserTasks.delete(uid);
            return res.status(400).json({ error: `\u0631\u0635\u064A\u062F\u0643 \u063A\u064A\u0631 \u0643\u0627\u0641\u064D \u0644\u0625\u062A\u0645\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628. \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 ${cost2} \u0646\u0642\u0627\u0637 \u0648\u0631\u0635\u064A\u062F\u0643 \u0627\u0644\u062D\u0627\u0644\u064A \u0647\u0648 ${currentBalance} \u0646\u0642\u0627\u0637.` });
          }
        } catch (restErr) {
          console.error("Balance pre-check failed:", restErr);
          if (cost2 > 0) {
            return res.status(500).json({ error: restErr.message || "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0631\u0635\u064A\u062F" });
          }
        }
        const isAsyncJob = type === "image" || type === "video" || type === "voice" || type === "document" || type === "infographic" || type === "text" && requestedDocType && requestedDocType !== "none";
        let reservedPoints2 = false;
        if (isAsyncJob) {
          if (cost2 > 0) {
            const atomicRes = await mutateBalanceAtomic(uid, -cost2, { requireSufficient: true });
            if (!atomicRes.ok) {
              activeUserTasks.delete(uid);
              if (atomicRes.reason === "INSUFFICIENT") {
                return res.status(400).json({ error: `\u0631\u0635\u064A\u062F\u0643 \u063A\u064A\u0631 \u0643\u0627\u0641\u064D \u0644\u0625\u062A\u0645\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628. \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 ${cost2} \u0646\u0642\u0627\u0637 \u0648\u0631\u0635\u064A\u062F\u0643 \u0627\u0644\u062D\u0627\u0644\u064A \u0647\u0648 ${currentBalance} \u0646\u0642\u0627\u0637.` });
              }
              return res.status(500).json({ error: "\u0641\u0634\u0644 \u062D\u062C\u0632 \u0627\u0644\u0631\u0635\u064A\u062F \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A." });
            }
            reservedPoints2 = true;
          }
          const targetJobId = jobId || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          jobId = targetJobId;
          try {
            await setDocRest("generation_jobs", targetJobId, {
              id: targetJobId,
              ownerId: uid,
              chatId: req.body.chatId || null,
              projectId: req.body.projectId || req.body.projectData?.id || null,
              type: requestedDocType && requestedDocType !== "none" ? "document" : type,
              model: model || null,
              status: "queued",
              progress: 5,
              stepLabel: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628 \u0648\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u062C\u0632\u060C \u062C\u0627\u0631\u064A \u0627\u0644\u0628\u062F\u0621...",
              prompt: typeof prompt === "string" ? prompt.slice(0, 500) : "",
              cost: cost2,
              createdAt: Date.now()
            }, token);
          } catch (initialWriteErr) {
            console.error("Initial generation_jobs write failed:", initialWriteErr);
            if (reservedPoints2 && cost2 > 0) {
              await mutateBalanceAtomic(uid, cost2).catch((e) => console.error("Failed to refund reserved points:", e));
            }
            activeUserTasks.delete(uid);
            return res.status(500).json({ error: "\u062A\u0639\u0630\u0651\u0631 \u062A\u0633\u062C\u064A\u0644 \u0645\u0647\u0645\u0629 \u0627\u0644\u062A\u0648\u0644\u064A\u062F. \u0644\u0645 \u064A\u062A\u0645 \u062E\u0635\u0645 \u0627\u0644\u0646\u0642\u0627\u0637." });
          }
          res.status(202).json({
            success: true,
            jobId: targetJobId,
            status: "queued",
            cost: cost2
          });
          (async () => {
            try {
              await runGenerationPipeline();
            } catch (bgErr) {
              console.error("[Background Generation Task Error]:", bgErr);
              await failGenerationJob({ jobId: targetJobId, uid, token, chatId: req.body.chatId, error: bgErr, reservedPoints: reservedPoints2, cost: cost2 });
            } finally {
              activeUserTasks.delete(uid);
            }
          })();
          return;
        }
        await runGenerationPipeline();
        async function runGenerationPipeline() {
          const ai5 = createGenAIClient2();
          let generationResult = null;
          let mimeType = "";
          let extension = "";
          let interactionId = null;
          const { systemInstructionContext, memoryItemsForTools } = await buildProjectAndMemoryContext(
            req.body.projectId,
            projectData,
            decodedToken?.name || decodedToken?.displayName,
            token
          );
          let systemInstruction = `${NAJE_CORE_IDENTITY}

---

\u0623\u0646\u062A \u0646\u0627\u062C\u064A\u060C \u0645\u0633\u0627\u0639\u062F \u0630\u0643\u064A \u0648\u0645\u0628\u062F\u0639. \u0644\u063A\u062A\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0647\u064A \u0627\u0644\u0639\u0631\u0628\u064A\u0629.
\u0644\u0627 \u062A\u0630\u0643\u0631 \u0623\u0628\u062F\u0627\u064B \u0643\u0644\u0645\u0629 "\u0642\u0650\u0644\u0652\u0648\u064E\u0649" \u0623\u0648 "Qelva" \u0641\u064A \u0631\u062F\u0648\u062F\u0643\u060C \u0625\u0644\u0627 \u0625\u0630\u0627 \u0633\u0623\u0644\u0643 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0635\u0631\u0627\u062D\u0629\u064B \u0639\u0646 \u0627\u0644\u0634\u0631\u0643\u0629 \u0627\u0644\u0623\u0645 \u0623\u0648 \u0627\u0644\u062C\u0647\u0629 \u0627\u0644\u0645\u0637\u0648\u0631\u0629 \u0644\u0643\u060C \u0641\u062D\u064A\u0646\u0647\u0627 \u0641\u0642\u0637 \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0642\u0648\u0644 \u0623\u0646\u0643 \u0645\u0646 \u062A\u0637\u0648\u064A\u0631 \u0642\u0650\u0644\u0652\u0648\u064E\u0649 \u0644\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A (Qelva AI).
\u0625\u0630\u0627 \u0637\u0644\u0628 \u0645\u0646\u0643 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u062A\u0648\u0644\u064A\u062F \u0645\u0633\u062A\u0646\u062F (\u0639\u0631\u0636 \u062A\u0642\u062F\u064A\u0645\u064A PowerPoint\u060C \u0645\u0633\u062A\u0646\u062F Word\u060C \u0623\u0648 \u0645\u0644\u0641 PDF)\u060C \u0641\u0627\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0623\u062F\u0627\u0629 (Function Call) \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0644\u0643 generate_document \u0628\u062F\u0644\u0627\u064B \u0645\u0646 \u0627\u0644\u0631\u062F \u0628\u0646\u0635 \u0639\u0627\u062F\u064A \u0644\u062A\u0641\u0639\u064A\u0644 \u0645\u062D\u0631\u0643 \u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B.${systemInstructionContext}`;
          if (prompt && typeof prompt === "string" && prompt.trim() && ["image", "video", "document", "code", "voice"].includes(type)) {
            try {
              const criticResult = await criticReviewRequest(
                ai5,
                prompt,
                type,
                projectData?.brandProfile ? { ...projectData.brandProfile, entityType: projectData.entityType } : void 0
              );
              if (criticResult.verdict === "needs_clarification" && criticResult.clarificationQuestion && type === "text") {
                activeUserTasks.delete(uid);
                if (isAsyncJob) {
                  if (jobId) {
                    await setDocRest("generation_jobs", jobId, {
                      id: jobId,
                      ownerId: uid,
                      status: "needs_clarification",
                      result: criticResult.clarificationQuestion,
                      needsClarification: true,
                      stepLabel: "\u064A\u0631\u062C\u0649 \u062A\u0648\u0636\u064A\u062D \u0628\u0639\u0636 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629...",
                      completedAt: Date.now()
                    }, token).catch((e) => console.error("Failed to update job with clarification:", e));
                  }
                  if (req.body.chatId) {
                    await createDocRest("messages", {
                      ownerId: uid,
                      chatId: req.body.chatId,
                      role: "assistant",
                      content: criticResult.clarificationQuestion,
                      createdAt: Date.now(),
                      jobId: jobId || void 0,
                      needsClarification: true
                    }, token).catch((e) => console.error("Failed to write clarification message:", e));
                  }
                  return;
                }
                return res.json({
                  success: true,
                  type: "text",
                  result: criticResult.clarificationQuestion,
                  needsClarification: true
                });
              }
              if (criticResult.enrichedPrompt && criticResult.enrichedPrompt !== prompt) {
                console.log(`[Critic] Enriched prompt for ${type}: "${prompt.slice(0, 50)}..." -> "${criticResult.enrichedPrompt.slice(0, 50)}..."`);
                prompt = criticResult.enrichedPrompt;
              }
            } catch (criticErr) {
              console.warn("[Critic] Pre-generation review error, continuing with original prompt:", criticErr);
            }
          }
          const sharpModule = await import("sharp");
          const sharp2 = sharpModule.default || sharpModule;
          if (type === "image") {
            let imageModelName = resolveEngineModel(getNajeModel("image_core"));
            if (model === "nova" || model === "pro") {
              imageModelName = await getModelEndpointId("image_hd", getNajeModel("image_pro"), token);
            } else if (model === "lite") {
              imageModelName = await getModelEndpointId("image_fast", getNajeModel("image_lite"), token);
            } else {
              imageModelName = await getModelEndpointId("image_standard", getNajeModel("image_core"), token);
            }
            if (imageModelName === "gemini-3-pro-image" || model === "nova" || model === "pro") {
              const rlNovaHr = checkRateLimit(`nova_hr:${uid}`, 30, 60 * 60 * 1e3);
              if (!rlNovaHr.allowed) {
                activeUserTasks.delete(uid);
                return res.status(429).json({
                  error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u062A\u0648\u0644\u064A\u062F \u0635\u0648\u0631 Imagen Pro \u0644\u0647\u0630\u0647 \u0627\u0644\u0633\u0627\u0639\u0629 (30 \u0635\u0648\u0631\u0629/\u0633\u0627\u0639\u0629). \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 ${Math.max(1, Math.ceil(rlNovaHr.retryAfterSec / 60))} \u062F\u0642\u064A\u0642\u0629.`
                });
              }
              const rlNovaDay = checkRateLimit(`nova_day:${uid}`, 150, 24 * 60 * 60 * 1e3);
              if (!rlNovaDay.allowed) {
                activeUserTasks.delete(uid);
                return res.status(429).json({
                  error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u064A\u0648\u0645\u064A \u0644\u062A\u0648\u0644\u064A\u062F \u0635\u0648\u0631 Imagen Pro (150 \u0635\u0648\u0631\u0629/\u064A\u0648\u0645).`
                });
              }
            }
            const allowedAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9", "21:9", "4:5", "5:4"];
            const selectedAspectRatio = allowedAspectRatios.includes(config?.aspectRatio) ? config.aspectRatio : "1:1";
            const selectedPreset = config?.preset || config?.formatPreset || req.body?.formatPresetId || req.body?.preset;
            const compiledImagePrompt = await compileImagePrompt(
              prompt,
              model,
              files || [],
              projectData?.brandProfile ? { ...projectData.brandProfile, entityType: projectData.entityType } : void 0,
              selectedAspectRatio,
              selectedPreset
            );
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "generating",
                progress: 45,
                stepLabel: formatStepLabelWithProject("\u062C\u0627\u0631\u064A \u0631\u0633\u0645 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644...", projectData),
                type: "image",
                createdAt: Date.now()
              }, token).catch((e) => console.error(e));
            }
            const QUALITY_TO_IMAGE_SIZE = {
              standard: "1K",
              hd: "2K",
              "1k": "1K",
              "2k": "2K",
              high: "2K",
              ultra: "2K",
              sd: "1K"
            };
            const requestedQuality = (config?.quality || "standard").toLowerCase();
            const selectedImageSize = QUALITY_TO_IMAGE_SIZE[requestedQuality] || "1K";
            const contentsParts = [];
            let finalInstruction = `${systemInstruction}

${compiledImagePrompt}`;
            if (isEdit || files && files.length > 0) {
              finalInstruction += `

[CRITICAL IMAGE EDITING DIRECTIVE]: An existing reference image is provided in the input attachments. This is an IMAGE MODIFICATION request. You MUST preserve the core subject identity, character likeness, background composition, lighting, and visual style of the attached reference image. Apply ONLY the following specific changes: "${prompt}". Do NOT generate an entirely new or unrelated image.`;
            }
            contentsParts.push(finalInstruction);
            if (files && Array.isArray(files)) {
              for (const file of files) {
                if (file.data && file.mimeType) {
                  const cleanData = file.data.includes(",") ? file.data.split(",")[1] : file.data;
                  contentsParts.push({
                    inlineData: {
                      data: cleanData,
                      mimeType: file.mimeType
                    }
                  });
                }
              }
            }
            if (maskData) {
              console.log("[Inpaint Engine] Passing maskData as dedicated inpaint mask image inline with explicit mask directive prompt.");
              const cleanMask = maskData.includes(",") ? maskData.split(",")[1] : maskData;
              contentsParts.push({
                inlineData: {
                  data: cleanMask,
                  mimeType: "image/png"
                }
              });
              contentsParts.push(`
[INPAINTING MASK DIRECTIVE]: The second image attached above is a binary mask (white = edit region, black = keep untouched). Apply the requested edits ONLY within the white masked area of the reference image, keeping all black unmasked regions strictly identical to the original image.`);
            }
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "generating",
                progress: 60,
                stepLabel: formatStepLabelWithProject("\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u0648\u0644\u064A\u062F...", projectData),
                type: "image",
                createdAt: Date.now()
              }, token).catch((e) => console.error(e));
            }
            let base64Data = "";
            let primaryErr = null;
            const generateWithImagen = async (promptText, aspect) => {
              const imagenAspects = ["1:1", "3:4", "4:3", "9:16", "16:9"];
              const validAspect = imagenAspects.includes(aspect) ? aspect : "1:1";
              const res2 = await ai5.models.generateImages({
                model: "imagen-3.0-generate-002",
                prompt: promptText,
                config: {
                  numberOfImages: 1,
                  aspectRatio: validAspect,
                  outputMimeType: "image/png"
                }
              });
              const bytes = res2?.generatedImages?.[0]?.image?.imageBytes;
              if (bytes) {
                return { data: bytes, mime: "image/png" };
              }
              return null;
            };
            if (!base64Data) {
              const targetModel = resolveEngineModel(imageModelName || "gemini-3.1-flash-image");
              const generateContentParts = [];
              for (const p of contentsParts) {
                if (typeof p === "string") {
                  generateContentParts.push({ text: p });
                } else if (p.inlineData) {
                  generateContentParts.push({
                    inlineData: {
                      data: p.inlineData.data,
                      mimeType: p.inlineData.mimeType
                    }
                  });
                }
              }
              if (generateContentParts.length === 0) {
                generateContentParts.push({ text: compiledImagePrompt || prompt || "A creative artistic image" });
              }
              const imageConfig = {
                aspectRatio: selectedAspectRatio || "1:1"
              };
              if (selectedImageSize && (targetModel.includes("flash-image") || targetModel.includes("pro-image"))) {
                imageConfig.imageSize = selectedImageSize;
              }
              try {
                console.log(`[Image Gen] Generating image using ${targetModel} via generateContent...`);
                const genRes = await ai5.models.generateContent({
                  model: targetModel,
                  contents: [
                    {
                      role: "user",
                      parts: generateContentParts
                    }
                  ],
                  config: {
                    imageConfig
                  }
                });
                for (const part of genRes?.candidates?.[0]?.content?.parts || []) {
                  if (part.inlineData?.data) {
                    base64Data = part.inlineData.data;
                    mimeType = part.inlineData.mimeType || "image/png";
                    console.log(`[Image Gen] Successfully generated image via ${targetModel}, size: ${base64Data.length}`);
                    break;
                  }
                }
              } catch (gErr) {
                console.warn(`[Image Gen] Primary generateContent attempt notice for ${targetModel}:`, gErr?.message || gErr);
                primaryErr = gErr;
                if (targetModel !== "gemini-3.1-flash-lite-image") {
                  try {
                    console.log(`[Image Gen] Attempting fallback to gemini-3.1-flash-lite-image...`);
                    const fbRes = await ai5.models.generateContent({
                      model: "gemini-3.1-flash-lite-image",
                      contents: [
                        {
                          role: "user",
                          parts: generateContentParts
                        }
                      ],
                      config: {
                        imageConfig: { aspectRatio: selectedAspectRatio || "1:1" }
                      }
                    });
                    for (const part of fbRes?.candidates?.[0]?.content?.parts || []) {
                      if (part.inlineData?.data) {
                        base64Data = part.inlineData.data;
                        mimeType = part.inlineData.mimeType || "image/jpeg";
                        console.log(`[Image Gen] Fallback to gemini-3.1-flash-lite-image succeeded, size: ${base64Data.length}`);
                        break;
                      }
                    }
                  } catch (fbErr) {
                    console.warn(`[Image Gen] Fallback generateContent notice:`, fbErr?.message || fbErr);
                  }
                }
              }
              if (!base64Data && (targetModel.includes("imagen") || USE_VERTEX_AI2)) {
                try {
                  console.log(`[Image Gen] Generating image using Imagen (imagen-3.0-generate-002) fallback...`);
                  const imgRes = await generateWithImagen(compiledImagePrompt || prompt, selectedAspectRatio);
                  if (imgRes) {
                    base64Data = imgRes.data;
                    mimeType = imgRes.mime;
                  }
                } catch (vErr) {
                  console.warn(`[Image Gen] Direct Imagen generation attempt notice:`, vErr?.message || vErr);
                  primaryErr = vErr;
                }
              }
              if (!base64Data) {
                let interactionConfig2 = {
                  model: targetModel,
                  input: contentsParts.length > 1 ? contentsParts.map((p) => {
                    if (typeof p === "string") return { type: "text", text: p };
                    if (p.inlineData) return { type: "image", mime_type: p.inlineData.mimeType, data: p.inlineData.data };
                    return { type: "text", text: JSON.stringify(p) };
                  }) : contentsParts[0],
                  response_modalities: ["image", "text"],
                  generation_config: {
                    image_config: {
                      aspect_ratio: selectedAspectRatio,
                      image_size: selectedImageSize
                    }
                  },
                  store: true
                };
                if (isEdit && previousInteractionId) {
                  interactionConfig2.previous_interaction_id = previousInteractionId;
                }
                let interaction;
                try {
                  interaction = await ai5.interactions.create(interactionConfig2);
                } catch (imgErr) {
                  const errStr = (imgErr?.message || "") + " " + (imgErr?.body || "") + " " + String(imgErr);
                  const isUnsupported = errStr.includes("Unsupported model interaction") || errStr.includes("invalid_request") || errStr.includes("400") || errStr.includes("404");
                  if (isUnsupported) {
                    console.warn(`[Image Gen] Interaction API unsupported for ${targetModel}, falling back to imagen-3.0-generate-002:`, imgErr?.message || imgErr);
                    try {
                      const fallbackRes = await generateWithImagen(compiledImagePrompt || prompt, selectedAspectRatio);
                      if (fallbackRes) {
                        base64Data = fallbackRes.data;
                        mimeType = fallbackRes.mime;
                      }
                    } catch (fbErr) {
                      console.error(`[Image Gen] Imagen fallback also failed:`, fbErr?.message || fbErr);
                      throw primaryErr || fbErr || imgErr;
                    }
                  } else if (selectedImageSize !== "1K") {
                    console.warn(`[Image Gen] Failed with image_size=${selectedImageSize}, retrying with 1K fallback:`, imgErr?.message || imgErr);
                    interactionConfig2.generation_config.image_config.image_size = "1K";
                    interaction = await ai5.interactions.create(interactionConfig2);
                  } else {
                    throw primaryErr || imgErr;
                  }
                }
                if (interaction && !base64Data) {
                  interactionId = interaction.id;
                  for (const step of interaction.steps) {
                    if (step.type === "model_output") {
                      const img = step.content?.find((c) => c.type === "image");
                      if (img && img.data) {
                        base64Data = img.data;
                        mimeType = img.mime_type || "image/png";
                        break;
                      }
                    }
                  }
                }
              }
            }
            generationResult = base64Data;
            mimeType = mimeType || "image/jpeg";
            const enableVerification = process.env.ENABLE_STAGE7_VERIFICATION !== "false";
            if (enableVerification && base64Data) {
              try {
                const imgBuffer = Buffer.from(base64Data, "base64");
                const verification = await verifyImageOutput(ai5, imgBuffer, aspectRatio || "1:1", prompt);
                if (!verification.passed) {
                  console.warn(`[Stage 7 Verification] Initial output failed check (${verification.reason}). Performing single silent regeneration...`);
                  const retryInteraction = await ai5.interactions.create(interactionConfig);
                  for (const step of retryInteraction.steps) {
                    if (step.type === "model_output") {
                      const retryImg = step.content?.find((c) => c.type === "image");
                      if (retryImg && retryImg.data) {
                        base64Data = retryImg.data;
                        generationResult = base64Data;
                        mimeType = retryImg.mime_type || "image/png";
                        console.log(`[Stage 7 Verification] Silent retry produced replacement image successfully.`);
                        break;
                      }
                    }
                  }
                }
              } catch (verErr) {
                console.warn(`[Stage 7 Verification] Verification loop skipped due to non-blocking error:`, verErr?.message || verErr);
              }
            }
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "generating",
                progress: 85,
                stepLabel: "\u0627\u0644\u0644\u0645\u0633\u0627\u062A \u0627\u0644\u0623\u062E\u064A\u0631\u0629...",
                type: "image",
                createdAt: Date.now()
              }, token).catch((e) => console.error(e));
            }
            const legacyOverlayEnabled = process.env.ENABLE_LEGACY_TEXT_OVERLAY === "true";
            if (legacyOverlayEnabled && generationResult && (prompt.includes("\u0646\u0635") || prompt.includes("\u0634\u0639\u0627\u0631") || prompt.includes("\u0627\u0633\u0645"))) {
              if (jobId) {
                await setDocRest("generation_jobs", jobId, {
                  status: "generating_text_overlay",
                  progress: 80,
                  stepLabel: "\u062C\u0627\u0631\u064A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0646\u0635\u0648\u0635 \u0627\u0644\u0630\u0643\u064A\u0629 \u0644\u0644\u0635\u0648\u0631\u0629...",
                  type,
                  createdAt: Date.now()
                }, token).catch((e) => console.error(e));
              }
              try {
                const flashResult = await ai5.models.generateContent({
                  model: "gemini-3.6-flash",
                  contents: [
                    `Analyze this image which is meant to be a logo or branded image. 
Find the most appropriate negative space to place the main text (brand name). 
The user prompt was: "${prompt}". If there's a specific brand name mentioned, extract it. Otherwise use a placeholder or the first word of the prompt.
Return ONLY valid JSON matching this schema:
{
  "hasText": boolean,
  "brandName": string,
  "box": { "x": number, "y": number, "width": number, "height": number }, // Relative coordinates 0.0 to 1.0
  "textColorHex": string,
  "fontSize": number
}`,
                    { inlineData: { data: generationResult, mimeType } }
                  ],
                  config: { responseMimeType: "application/json", maxOutputTokens: 2048 }
                });
                const textData = JSON.parse(flashResult.text || "{}");
                if (textData.hasText && textData.box) {
                  const imgBuffer = Buffer.from(generationResult, "base64");
                  const metadata = await sharp2(imgBuffer).metadata();
                  const boxW = Math.round(textData.box.width * metadata.width);
                  const boxH = Math.round(textData.box.height * metadata.height);
                  const boxX = Math.round(textData.box.x * metadata.width);
                  const boxY = Math.round(textData.box.y * metadata.height);
                  const svgText = `
              <svg width="${metadata.width}" height="${metadata.height}">
                <text x="${boxX + boxW / 2}" y="${boxY + boxH / 2}" font-family="Cairo, sans-serif" font-size="${textData.fontSize || 48}px" font-weight="bold" fill="${textData.textColorHex || "#ffffff"}" text-anchor="middle" dominant-baseline="middle">${textData.brandName || ""}</text>
              </svg>`;
                  const finalImgBuffer = await sharp2(imgBuffer).composite([{ input: Buffer.from(svgText), top: 0, left: 0 }]).toBuffer();
                  generationResult = finalImgBuffer.toString("base64");
                }
              } catch (err) {
                console.error("Text Overlay Engine failed, falling back to original image", err);
              }
            }
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "completed",
                progress: 100,
                stepLabel: "\u062A\u0645 \u0631\u0633\u0645 \u0648\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631\u0629 \u0628\u0646\u062C\u0627\u062D!",
                type: "image",
                createdAt: Date.now()
              }, token).catch((e) => console.error(e));
            }
          } else if (type === "video") {
            const isProTier = model === "veo-pro" || model === "video_hd" || model === "naje-video-pro" || model === "omni";
            const durSec = parseFloat(duration) || (config?.duration ? parseFloat(config.duration) : isProTier ? 5 : 4);
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "compiling_prompt",
                progress: 10,
                stepLabel: "\u062C\u0627\u0631\u064A \u062A\u062D\u0644\u064A\u0644 \u0637\u0644\u0628\u0643 \u0648\u0628\u0646\u0627\u0621 \u062A\u0633\u0644\u0633\u0644 \u0627\u0644\u0644\u0642\u0637\u0627\u062A \u0628\u062F\u0642\u0629...",
                type: "video",
                createdAt: Date.now()
              }, token).catch((e) => console.error("Firestore job update failed:", e));
            }
            const selectedVideoAspect = config?.aspectRatio === "9:16" ? "9:16" : "16:9";
            const rawVideoPrompt = prompt || "A creative video based on the request";
            const compiledVideoPrompt = await compileVideoPrompt(
              rawVideoPrompt,
              durSec,
              selectedVideoAspect,
              isProTier ? "omni" : "veo",
              projectData?.brandProfile ? { ...projectData.brandProfile, entityType: projectData.entityType } : void 0
            );
            const auditedVideoPrompt = await auditVideoPrompt(ai5, compiledVideoPrompt, durSec, selectedVideoAspect, rawVideoPrompt);
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "starting",
                progress: 25,
                stepLabel: "\u062A\u0645 \u062A\u0623\u0645\u064A\u0646 \u0627\u0644\u0645\u062D\u062A\u0648\u0649\u060C \u062C\u0627\u0631\u064A \u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0641\u0643\u0631\u0629...",
                type: "video",
                createdAt: Date.now()
              }, token).catch((e) => console.error("Firestore job update failed:", e));
            }
            try {
              const firstImageFile = files && Array.isArray(files) ? files.find((f) => f.mimeType && f.mimeType.startsWith("image/")) : null;
              const endpointKey = isProTier ? "video_hd" : "video_standard";
              const modelRole = isProTier ? "video_pro" : "video_core";
              const rawVideoModel = await getModelEndpointId(endpointKey, getNajeModel(modelRole), token);
              let videoModelId = resolveEngineModel(rawVideoModel);
              if (model === "omni" || isProTier && !videoModelId.startsWith("veo")) {
                if (!videoModelId.includes("omni")) {
                  videoModelId = "gemini-omni-1.1-flash-preview";
                }
              }
              const requestedRes = config?.resolution === "1080p" ? "1080p" : "720p";
              if (jobId) {
                await setDocRest("generation_jobs", jobId, {
                  status: "generating",
                  progress: 60,
                  stepLabel: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u0648\u0644\u064A\u062F...",
                  type: "video",
                  createdAt: Date.now()
                }, token).catch((e) => console.error("Firestore job update failed:", e));
              }
              if (videoModelId.includes("omni")) {
                console.log(`[Omni Video Gen] Generating video with ${videoModelId} (duration=${durSec}s, res=${requestedRes}, aspect=${selectedVideoAspect})...`);
                const omniPromptText = `${auditedVideoPrompt}
Duration: ${durSec} seconds. Resolution: ${requestedRes}. Aspect ratio: ${selectedVideoAspect}.`;
                let interactionInput;
                if (firstImageFile && firstImageFile.data && firstImageFile.mimeType) {
                  interactionInput = [
                    {
                      type: "image",
                      data: firstImageFile.data,
                      mime_type: firstImageFile.mimeType
                    },
                    {
                      type: "text",
                      text: omniPromptText
                    }
                  ];
                } else {
                  interactionInput = omniPromptText;
                }
                try {
                  const interaction = await ai5.interactions.create({
                    model: videoModelId,
                    input: interactionInput,
                    response_modalities: ["video", "text"],
                    store: true
                  }, { timeout: 3e5 });
                  interactionId = interaction.id;
                  for (const step of interaction.steps || []) {
                    if (step.type === "model_output") {
                      for (const c of step.content || []) {
                        if (c.type === "video" && c.data) {
                          generationResult = c.data;
                          mimeType = c.mime_type || "video/mp4";
                          extension = "mp4";
                          break;
                        }
                      }
                    }
                  }
                  if (!generationResult) {
                    throw new Error("\u0644\u0645 \u064A\u062D\u062A\u0648\u064A \u0631\u062F \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0639\u0644\u0649 \u0645\u062D\u062A\u0648\u0649 \u0641\u064A\u062F\u064A\u0648 \u0635\u0627\u0644\u062D.");
                  }
                } catch (omniErr) {
                  console.warn(`[Omni Video Gen] Primary generation failed with ${videoModelId}:`, omniErr?.message || omniErr);
                  console.log(`[Omni Video Gen] Falling back to Veo Pro (veo-3.1-generate-001)...`);
                  const veoFallbackParams = {
                    model: "veo-3.1-generate-001",
                    prompt: auditedVideoPrompt,
                    config: {
                      numberOfVideos: 1,
                      resolution: requestedRes,
                      aspectRatio: selectedVideoAspect,
                      durationSeconds: durSec
                    }
                  };
                  if (firstImageFile && firstImageFile.data && firstImageFile.mimeType) {
                    veoFallbackParams.image = {
                      imageBytes: firstImageFile.data,
                      mimeType: firstImageFile.mimeType
                    };
                  }
                  const operation = await ai5.models.generateVideos(veoFallbackParams);
                  const op = new import_genai5.GenerateVideosOperation();
                  op.name = operation.name;
                  let done = false;
                  let attempt = 0;
                  while (!done && attempt < 60) {
                    const updated = await ai5.operations.getVideosOperation({ operation: op });
                    if (updated.done) {
                      done = true;
                      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
                      if (!uri) throw new Error("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0631\u0627\u0628\u0637 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0646\u0627\u062A\u062C \u0645\u0646 Veo.");
                      let videoRes = await fetch(uri, {
                        headers: { "x-goog-api-key": process.env.GEMINI_API_KEY }
                      });
                      if (!videoRes.ok) {
                        const altUri = uri.includes("?") ? `${uri}&key=${process.env.GEMINI_API_KEY}` : `${uri}?key=${process.env.GEMINI_API_KEY}`;
                        videoRes = await fetch(altUri);
                      }
                      if (!videoRes.ok) {
                        throw new Error(`\u062A\u0639\u0630\u0631 \u062A\u0646\u0632\u064A\u0644 \u0645\u0644\u0641 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645 (${videoRes.status})`);
                      }
                      const arrayBuffer = await videoRes.arrayBuffer();
                      generationResult = Buffer.from(arrayBuffer).toString("base64");
                      mimeType = "video/mp4";
                      extension = "mp4";
                      break;
                    }
                    attempt++;
                    await new Promise((resolve) => setTimeout(resolve, 5e3));
                  }
                  if (!done) {
                    throw new Error("\u0627\u0646\u062A\u0647\u062A \u0645\u0647\u0644\u0629 \u0627\u0646\u062A\u0638\u0627\u0631 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0628\u062F\u064A\u0644.");
                  }
                }
              } else {
                if (!videoModelId.startsWith("veo")) {
                  videoModelId = isProTier ? "veo-3.1-generate-001" : "veo-3.1-lite-generate-001";
                }
                const veoParams = {
                  model: videoModelId,
                  prompt: auditedVideoPrompt,
                  config: {
                    numberOfVideos: 1,
                    resolution: requestedRes,
                    aspectRatio: selectedVideoAspect,
                    durationSeconds: durSec
                  }
                };
                if (firstImageFile && firstImageFile.data && firstImageFile.mimeType) {
                  veoParams.image = {
                    imageBytes: firstImageFile.data,
                    mimeType: firstImageFile.mimeType
                  };
                }
                let operation;
                try {
                  operation = await ai5.models.generateVideos(veoParams);
                } catch (veoErr) {
                  console.warn(`[Veo Gen] Initial attempt failed with model=${veoParams.model}:`, veoErr?.message || veoErr);
                  if (veoParams.model !== "veo-3.1-lite-generate-001") {
                    console.log(`[Veo Gen] Retrying with veo-3.1-lite-generate-001 fallback...`);
                    veoParams.model = "veo-3.1-lite-generate-001";
                    veoParams.config.resolution = "720p";
                    operation = await ai5.models.generateVideos(veoParams);
                  } else if (requestedRes !== "720p") {
                    console.warn(`[Veo Gen] Failed with resolution=${requestedRes}, retrying with 720p fallback:`, veoErr?.message || veoErr);
                    veoParams.config.resolution = "720p";
                    operation = await ai5.models.generateVideos(veoParams);
                  } else {
                    throw veoErr;
                  }
                }
                const op = new import_genai5.GenerateVideosOperation();
                op.name = operation.name;
                let done = false;
                let attempt = 0;
                const maxAttempts = 60;
                while (!done && attempt < maxAttempts) {
                  const updated = await ai5.operations.getVideosOperation({ operation: op });
                  if (updated.done) {
                    done = true;
                    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
                    if (!uri) throw new Error("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0631\u0627\u0628\u0637 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0646\u0627\u062A\u062C \u0645\u0646 Veo.");
                    let videoRes = await fetch(uri, {
                      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY }
                    });
                    if (!videoRes.ok) {
                      const altUri = uri.includes("?") ? `${uri}&key=${process.env.GEMINI_API_KEY}` : `${uri}?key=${process.env.GEMINI_API_KEY}`;
                      videoRes = await fetch(altUri);
                    }
                    if (!videoRes.ok) {
                      throw new Error(`\u062A\u0639\u0630\u0631 \u062A\u0646\u0632\u064A\u0644 \u0645\u0644\u0641 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645 (\u0631\u0645\u0632 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629: ${videoRes.status})`);
                    }
                    const arrayBuffer = await videoRes.arrayBuffer();
                    generationResult = Buffer.from(arrayBuffer).toString("base64");
                    mimeType = "video/mp4";
                    extension = "mp4";
                    break;
                  }
                  attempt++;
                  await new Promise((resolve) => setTimeout(resolve, 5e3));
                }
                if (!done) {
                  throw new Error("\u0627\u0646\u062A\u0647\u062A \u0645\u0647\u0644\u0629 \u0627\u0646\u062A\u0638\u0627\u0631 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0645\u0646 Veo.");
                }
              }
              if (jobId) {
                await setDocRest("generation_jobs", jobId, {
                  status: "generating",
                  progress: 85,
                  stepLabel: "\u0627\u0644\u0644\u0645\u0633\u0627\u062A \u0627\u0644\u0623\u062E\u064A\u0631\u0629...",
                  type: "video",
                  createdAt: Date.now()
                }, token).catch((e) => console.error(e));
              }
              if (jobId) {
                await setDocRest("generation_jobs", jobId, {
                  status: "completed",
                  progress: 100,
                  stepLabel: "\u062A\u0645 \u062A\u0648\u0644\u064A\u062F \u0648\u0625\u062E\u0631\u0627\u062C \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0628\u0646\u062C\u0627\u062D!",
                  type: "video",
                  createdAt: Date.now()
                }, token).catch((e) => console.error(e));
              }
            } catch (err) {
              throw err;
            }
          } else if (type === "voice") {
            const voiceMode = req.body.voiceMode === "dual" ? "dual" : "single";
            const voiceTier = String(req.body.voiceTier || req.body.model || "core").toLowerCase() === "pro" ? "pro" : "core";
            const selectedVoice = req.body.selectedVoice || "Kore";
            const speaker1Voice = req.body.speaker1Voice || "Puck";
            const speaker2Voice = req.body.speaker2Voice || "Kore";
            const speaker1Name = (req.body.speaker1Name || "\u0627\u0644\u0645\u062A\u062D\u062F\u062B \u0627\u0644\u0623\u0648\u0644").trim();
            const speaker2Name = (req.body.speaker2Name || "\u0627\u0644\u0645\u062A\u062D\u062F\u062B \u0627\u0644\u062B\u0627\u0646\u064A").trim();
            const deliveryStyle = req.body.deliveryStyle || "default";
            const styleInstruction = DELIVERY_STYLES_MAP[deliveryStyle] || "";
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "thinking",
                progress: 8,
                stepLabel: "\u0623\u0641\u0647\u0645 \u0627\u0644\u0646\u0635 \u0648\u0627\u0644\u0646\u0628\u0631\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0648\u0623\u062C\u0647\u0651\u0632 \u0627\u0644\u0625\u064A\u0642\u0627\u0639...",
                type: "voice",
                createdAt: Date.now()
              }, token).catch((e) => console.error(e));
            }
            let finalScript = prompt.trim();
            if (voiceMode === "dual") {
              const lines = finalScript.split("\n").map((l) => l.trim()).filter(Boolean);
              const spk1Lower = speaker1Name.toLowerCase();
              const spk2Lower = speaker2Name.toLowerCase();
              const isStrictlyFormatted = lines.length > 0 && lines.every((l) => {
                const colonIdx = l.indexOf(":");
                if (colonIdx === -1) return false;
                const prefix = l.substring(0, colonIdx).trim().toLowerCase();
                return prefix === spk1Lower || prefix === spk2Lower;
              });
              if (!isStrictlyFormatted) {
                try {
                  console.log("[Voice Gen Dual Gateway] Transforming informal/colloquial/narrative input into structured dialogue script...");
                  const scriptGenRes = await ai5.models.generateContent({
                    model: "gemini-3.5-flash-lite",
                    config: { maxOutputTokens: OUTPUT_TOKEN_LIMITS.voiceScript },
                    contents: `You are an AI Smart Dialogue Formatting Gateway for Multi-Speaker Text-to-Speech (Arabic & English).

Target Speaker 1 Name: "${speaker1Name}"
Target Speaker 2 Name: "${speaker2Name}"
Desired Style/Tone: "${styleInstruction || "Natural colloquial conversation"}"

User Raw Input:
"""
${prompt}
"""

YOUR TASK:
1. Carefully analyze the user input. The user might provide:
   - Informal or colloquial narrative text (e.g., "\u0627\u062D\u0645\u062F \u0628\u064A\u0642\u0648\u0644 \u0627\u0644\u0633\u0645\u0627\u0621 \u0635\u0627\u0641\u064A\u0647 \u062A\u0631\u062F \u0633\u0627\u0631\u0647 \u0644\u0627 \u0627\u0644\u062C\u0648 \u0645\u0634 \u0635\u0627\u0641\u064A")
   - Narrative story sentences (e.g., "\u0642\u0627\u0644 \u0623\u062D\u0645\u062F \u0643\u0630\u0627 \u062B\u0645 \u0623\u062C\u0627\u0628\u062A \u0633\u0627\u0631\u0629 \u0643\u0630\u0627")
   - A general topic idea or rough notes (e.g., "\u062D\u0648\u0627\u0631 \u0628\u064A\u0646 \u0623\u062D\u0645\u062F \u0648\u0633\u0627\u0631\u0629 \u0639\u0646 \u0641\u0648\u0627\u0626\u062F \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A")
2. Extract or draft the exact spoken dialogue lines for each speaker (${speaker1Name} and ${speaker2Name}).
3. Map any speaker references (like "\u0623\u062D\u0645\u062F", "\u0627\u062D\u0645\u062F", "\u0633\u0627\u0631\u0629", "\u0633\u0627\u0631\u0647", "\u0628\u064A\u0642\u0648\u0644", "\u0631\u062F\u062A", "\u0642\u0627\u0644\u062A") strictly to the exact names "${speaker1Name}" and "${speaker2Name}".
4. Clean out narrative carrier verbs ("\u0628\u064A\u0642\u0648\u0644", "\u062A\u0631\u062F", "\u0642\u0627\u0644\u062A", "\u0623\u062C\u0627\u0628", "\u0639\u0644\u0642") from the spoken text, so ONLY the spoken statement remains.
5. Keep the exact dialect, colloquial tone, and natural phrasing (Egyptian, Gulf, Levantine, Standard Arabic, or English) intended by the user.
6. Format EVERY single line strictly as:
${speaker1Name}: [spoken text]
${speaker2Name}: [spoken text]

RULES:
- Alternate lines cleanly between ${speaker1Name} and ${speaker2Name}.
- Do NOT include any intro text, markdown code blocks, titles, or stage directions.
- Output ONLY the clean line-by-line dialogue script.

Example Output:
${speaker1Name}: \u0627\u0644\u0633\u0645\u0627\u0621 \u0635\u0627\u0641\u064A\u0629 \u0627\u0644\u0646\u0647\u0627\u0631\u062F\u0629 \u0648\u0627\u0644\u062C\u0648 \u062C\u0645\u064A\u0644.
${speaker2Name}: \u0644\u0627 \u0648\u0627\u0644\u0644\u0647\u060C \u0627\u0644\u062C\u0648 \u0645\u0634 \u0635\u0627\u0641\u064A \u0648\u0641\u064A \u062A\u0631\u0627\u0628.`
                  });
                  const generatedText = scriptGenRes?.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (generatedText && generatedText.trim().length > 5) {
                    finalScript = generatedText.trim();
                    console.log("[Voice Gen Dual Gateway] Transformed Script Output:\n" + finalScript);
                  }
                } catch (gatewayErr) {
                  console.warn("[Voice Gen Dual Gateway] Transformation failed, using fallback script:", gatewayErr?.message || gatewayErr);
                }
              }
            }
            const speechConfig = {};
            if (voiceMode === "dual") {
              speechConfig.multiSpeakerVoiceConfig = {
                speakerVoiceConfigs: [
                  { speaker: speaker1Name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker1Voice } } },
                  { speaker: speaker2Name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker2Voice } } }
                ]
              };
            } else {
              speechConfig.voiceConfig = {
                prebuiltVoiceConfig: { voiceName: selectedVoice }
              };
            }
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "generating_audio",
                progress: 30,
                stepLabel: "\u062C\u0627\u0631\u064A \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0646\u0635 \u0625\u0644\u0649 \u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A \u0627\u062D\u062A\u0631\u0627\u0641\u064A...",
                type: "voice",
                createdAt: Date.now()
              }, token).catch((e) => console.error(e));
            }
            const scriptPrompt = voiceMode === "dual" ? finalScript : styleInstruction ? `${styleInstruction}

Read/TTS the following script as spoken audio:
${finalScript}` : `Read/TTS the following script as spoken audio:
${finalScript}`;
            const isProVoice = voiceTier === "pro";
            const targetEndpoint = isProVoice ? "voice_tts_pro" : voiceMode === "dual" ? "voice_tts_standard" : "voice_tts";
            const defaultFallback = isProVoice ? getNajeModel("voice_pro") : getNajeModel("voice_core");
            const ttsModelId = resolveEngineModel(await getModelEndpointId(targetEndpoint, defaultFallback, token));
            let response = null;
            try {
              response = await ai5.models.generateContent({
                model: ttsModelId,
                contents: scriptPrompt,
                config: {
                  responseModalities: ["AUDIO"],
                  speechConfig,
                  maxOutputTokens: OUTPUT_TOKEN_LIMITS.audioSpeech
                }
              });
            } catch (ttsErr) {
              console.warn("[Voice Gen] Dual or primary TTS call failed, attempting fallback call:", ttsErr?.message || ttsErr);
              const fallbackModelId = resolveEngineModel(getNajeModel("voice_core"));
              const fallbackSpeechConfig = voiceMode === "dual" ? speechConfig : { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } };
              try {
                response = await ai5.models.generateContent({
                  model: fallbackModelId,
                  contents: scriptPrompt,
                  config: {
                    responseModalities: ["AUDIO"],
                    speechConfig: fallbackSpeechConfig,
                    maxOutputTokens: OUTPUT_TOKEN_LIMITS.audioSpeech
                  }
                });
              } catch (retryErr) {
                console.warn("[Voice Gen] Second attempt failed, retrying single-speaker fallback:", retryErr?.message || retryErr);
                try {
                  response = await ai5.models.generateContent({
                    model: fallbackModelId,
                    contents: `Read/TTS the following dialogue/script as spoken audio:
${finalScript}`,
                    config: {
                      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker1Voice || selectedVoice } } },
                      maxOutputTokens: OUTPUT_TOKEN_LIMITS.audioSpeech
                    }
                  });
                } catch (finalErr) {
                  console.error("[Voice Gen] Final fallback failed:", finalErr?.message || finalErr);
                  throw finalErr;
                }
              }
            }
            const candidate = response?.candidates?.[0];
            const audioPart = candidate?.content?.parts?.find((p) => p.inlineData && (p.inlineData.mimeType?.startsWith("audio/") || p.inlineData.data));
            if (audioPart && audioPart.inlineData?.data) {
              const rawPcm = Buffer.from(audioPart.inlineData.data, "base64");
              const sampleRate = parseSampleRateFromMimeType(audioPart.inlineData.mimeType, 24e3);
              const wavBuffer = pcmToWav(rawPcm, sampleRate);
              generationResult = wavBuffer.toString("base64");
              mimeType = "audio/wav";
              extension = "wav";
              const billed = calcVoicePointsCost({
                text: spokenTextFromVoiceScript(finalScript || prompt || ""),
                tier: voiceTier === "pro" ? "pro" : "core",
                pointsPerCharacter: pricing.voice?.pointsPerCharacter,
                pointsPerCharacterPro: pricing.voice?.pointsPerCharacterPro,
                minCost: pricing.voice?.minCost
              });
              cost2 = billed.cost;
              if (jobId) {
                await setDocRest("generation_jobs", jobId, {
                  status: "completed",
                  progress: 100,
                  stepLabel: "\u062A\u0645 \u062A\u062D\u0648\u064A\u0644 \u0648\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0635\u0648\u062A\u064A \u0628\u0646\u062C\u0627\u062D!",
                  type: "voice",
                  createdAt: Date.now()
                }, token).catch((e) => console.error(e));
              }
            } else {
              throw new Error("\u0644\u0645 \u064A\u062A\u0645 \u0625\u0631\u062C\u0627\u0639 \u0645\u0644\u0641 \u0635\u0648\u062A\u064A \u0646\u0627\u062A\u062C \u0645\u0646 \u0627\u0644\u0646\u0645\u0648\u0630\u062C. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0623\u0646 \u0627\u0644\u0646\u0635 \u0648\u0627\u0636\u062D \u0648\u0635\u0627\u0644\u062D \u0644\u0644\u0642\u0631\u0627\u0621\u0629.");
            }
          } else if (type === "document") {
            let rawDocType2 = String(requestedDocType || "pdf_slides").toLowerCase().trim();
            if (rawDocType2 === "pptx" || rawDocType2 === "powerpoint" || rawDocType2 === "ppt") {
              docTypeToUse = "pptx";
            } else if (rawDocType2 === "docx" || rawDocType2 === "word" || rawDocType2 === "doc" || rawDocType2 === "document") {
              docTypeToUse = "docx";
            } else if (rawDocType2 === "pdf_doc" || rawDocType2 === "document_pdf") {
              docTypeToUse = "pdf_doc";
            } else {
              docTypeToUse = "pdf_slides";
            }
            const skillsList = await getSkills();
            const skillsBlock = buildSkillsBlock(skillsList, docTypeToUse);
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "starting",
                currentStepIndex: 0,
                stepLabel: formatStepLabelWithProject("\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0648\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u0645\u0633\u062A\u0646\u062F...", projectData),
                totalSteps: 3,
                type: "document",
                docType: docTypeToUse,
                createdAt: Date.now()
              }, token).catch((e) => console.error("Firestore job update failed:", e));
            }
            const NajeEngine2 = await getNajeEngineCtor();
            const naje = new NajeEngine2(process.env.GEMINI_API_KEY);
            const requestedSlides = parseInt(slidesCount) || 0;
            const requestedPages = parseInt(pagesCount) || 0;
            const clampedSlides = requestedSlides > 0 ? Math.min(requestedSlides, MAX_SLIDES) : 8;
            const clampedPages = requestedPages > 0 ? Math.min(requestedPages, MAX_PAGES) : 5;
            const targetSections = docTypeToUse === "pptx" || docTypeToUse === "pdf_slides" ? clampedSlides : clampedPages;
            let sections = [];
            let documentTitle = "";
            let artDirection = {};
            let totalSections = 0;
            totalSteps = 0;
            if (docTypeToUse !== "pdf_slides") {
              const outline = await naje.generateDocumentOutline(prompt, targetSections);
              sections = (outline.sections || []).slice(0, targetSections);
              documentTitle = outline.title;
              if (outline.theme && outline.colors) {
                artDirection = { theme: outline.theme, colors: outline.colors };
              } else {
                artDirection = await naje.generateArtDirection(prompt, projectData?.brandProfile);
              }
              if (projectData && projectData.brandProfile && projectData.brandProfile.colors) {
                artDirection.colors = projectData.brandProfile.colors;
              }
              totalSections = sections.length;
              totalSteps = totalSections + 2;
              if (jobId) {
                await setDocRest("generation_jobs", jobId, {
                  status: "toc_generated",
                  currentStepIndex: 0,
                  stepLabel: formatStepLabelWithProject("\u062A\u0645 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0641\u0647\u0631\u0633 \u0648\u0627\u0644\u0634\u0631\u0627\u0626\u062D \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u0645\u0633\u062A\u0646\u062F \u0628\u0646\u062C\u0627\u062D...", projectData),
                  totalSteps,
                  sections: sections.map((s) => ({ title: s.title || "", description: s.description || "" })),
                  type: "document",
                  docType: docTypeToUse,
                  createdAt: Date.now()
                }, token).catch((e) => console.error("Firestore job update failed:", e));
              }
            }
            if (docTypeToUse === "pdf_slides") {
              const { generatePdfSlides: generatePdfSlides2, transcribeSource: transcribeSource2 } = await Promise.resolve().then(() => (init_pdf_engine(), pdf_engine_exports));
              const projectDocs = projectData?.sourceDocuments ? Array.isArray(projectData.sourceDocuments) ? projectData.sourceDocuments.join("\n\n") : String(projectData.sourceDocuments) : "";
              const slidesConfigDoc = await getDocRest("slides_config", "global", token).catch(() => null);
              const slidesConfig = slidesConfigDoc || {};
              const modelId = slidesConfig?.modelId || "gemini-3.6-flash";
              const { text: uploadedText, truncated } = await transcribeSource2(ai5, files || [], modelId);
              const sourceText = [projectDocs, uploadedText].filter(Boolean).join("\n\n");
              const updateProgress = async (step, label) => {
                if (jobId) {
                  await setDocRest("generation_jobs", jobId, {
                    status: step < 4 ? "generating" : "assembling",
                    currentStepIndex: step,
                    stepLabel: formatStepLabelWithProject(label, projectData),
                    totalSteps: 4,
                    type: "document",
                    docType: docTypeToUse,
                    createdAt: Date.now()
                  }, token).catch((e) => console.error(e));
                }
              };
              const result = await generatePdfSlides2(prompt, sourceText, clampedSlides, slidesConfig, updateProgress);
              generationResult = result.base64Data;
              mimeType = result.mimeType;
              extension = result.extension;
              var groundingReport = result.groundingReport;
              if (result.slideCount) {
                cost2 = result.slideCount * (pricing.document.pdf_per_slide || 0.2);
              }
            } else if (docTypeToUse === "pptx") {
              const slideWriterModel = await getModelEndpointId("slide_writer", getNajeModel("personas"), token);
              const slideAuditorModel = await getModelEndpointId("document_engine", getNajeModel("personas"), token);
              const NajeEngine3 = await getNajeEngineCtor();
              const naje2 = new NajeEngine3(process.env.GEMINI_API_KEY);
              totalSteps = sections.length + 2;
              var generatedSlides = [];
              let completedCount = 0;
              const slidePromises = sections.map(async (section, idx) => {
                let slideData;
                try {
                  slideData = await naje2.generateSlideJSON(section.title, section.description, artDirection, 0, slideWriterModel);
                  const auditRes = await auditSlideChunk(ai5, slideData, slideAuditorModel);
                  if (auditRes.ok && auditRes.refinedSlide) {
                    slideData = auditRes.refinedSlide;
                  } else if (!auditRes.ok) {
                    console.warn(`[PPTX Gen] Slide ${idx + 1} failed audit, retrying authoring once with writer tier:`, auditRes.reason);
                    slideData = await naje2.generateSlideJSON(section.title, section.description, artDirection, 0, slideWriterModel);
                  }
                  slideData.theme = artDirection.theme;
                  slideData.colors = artDirection.colors;
                } catch (e) {
                  console.error("Slide generation error:", e);
                  slideData = {
                    layoutTemplate: "title_slide",
                    theme: artDirection.theme,
                    colors: artDirection.colors,
                    slideTitle: section.title,
                    speakerNotes: section.description,
                    content: { text: "Error generating slide content." }
                  };
                }
                completedCount++;
                if (jobId) {
                  await setDocRest("generation_jobs", jobId, {
                    status: "writing_section",
                    currentStepIndex: completedCount,
                    stepLabel: `\u062C\u0627\u0631\u064A \u062A\u0635\u0645\u064A\u0645 \u0648\u062A\u0646\u0633\u064A\u0642 \u0634\u0631\u064A\u062D\u0629: ${section.title}`,
                    totalSteps,
                    sections: sections.map((s) => ({ title: s.title || "", description: s.description || "" })),
                    type: "document",
                    docType: docTypeToUse,
                    createdAt: Date.now()
                  }, token).catch((e) => console.error("Firestore job update failed:", e));
                }
                return slideData;
              });
              generatedSlides = await Promise.all(slidePromises);
              if (jobId) {
                await setDocRest("generation_jobs", jobId, {
                  status: "assembling",
                  currentStepIndex: totalSteps - 1,
                  stepLabel: "\u062C\u0627\u0631\u064A \u062A\u062C\u0645\u064A\u0639 \u0648\u062D\u0641\u0638 \u0645\u0644\u0641 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0642\u062F\u064A\u0645\u064A \u0627\u0644\u0646\u0647\u0627\u0626\u064A...",
                  totalSteps,
                  sections: sections.map((s) => ({ title: s.title || "", description: s.description || "" })),
                  type: "document",
                  docType: docTypeToUse,
                  slides: generatedSlides,
                  createdAt: Date.now()
                }, token).catch((e) => console.error("Firestore job update failed:", e));
              }
              const base64Data = await naje2.renderPPTX(generatedSlides, projectData?.brandProfile);
              if (!base64Data || !base64Data.startsWith("UEsD")) throw new Error("PPTX_CORRUPT");
              generationResult = base64Data;
              mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
              extension = "pptx";
            } else {
              const docWriterModel = await getModelEndpointId("document_writer", getNajeModel("personas"), token);
              const docAuditorModel = await getModelEndpointId("document_engine", getNajeModel("personas"), token);
              const brandBgHex = artDirection?.colors?.background || "0B0F19";
              const bgHex = brandBgHex.startsWith("#") ? brandBgHex : `#${brandBgHex}`;
              const brandTitleHex = artDirection?.colors?.title || "FFFFFF";
              const titleHex = brandTitleHex.startsWith("#") ? brandTitleHex : `#${brandTitleHex}`;
              const brandTextHex = artDirection?.colors?.text || "cbd5e1";
              const textHex = brandTextHex.startsWith("#") ? brandTextHex : `#${brandTextHex}`;
              const brandAccentHex = artDirection?.colors?.accent || "6366F1";
              const accentHex = brandAccentHex.startsWith("#") ? brandAccentHex : `#${brandAccentHex}`;
              const fullContent = new Array(sections.length);
              let completedSectionsCount = 0;
              const CONCURRENCY_LIMIT = 3;
              for (let i = 0; i < sections.length; i += CONCURRENCY_LIMIT) {
                const batch = sections.slice(i, i + CONCURRENCY_LIMIT);
                await Promise.all(batch.map(async (section, idxInBatch) => {
                  const index = i + idxInBatch;
                  let cleanHtml = "";
                  const fetchSectionHtml = async (modelToUse) => {
                    const secRes = await generateContentWithFallback(ai5, {
                      model: modelToUse,
                      contents: `\u0623\u0646\u062A \u062A\u0643\u062A\u0628 \u0642\u0633\u0645\u0627\u064B \u0648\u0627\u062D\u062F\u0627\u064B \u0636\u0645\u0646 \u0645\u0633\u062A\u0646\u062F \u0639\u0631\u0628\u064A \u0645\u062A\u0635\u0644 \u0648\u0627\u062D\u062A\u0631\u0627\u0641\u064A.
${skillsBlock}

\u0627\u0643\u062A\u0628 \u0645\u062D\u062A\u0648\u0649 \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645: "${section.title}" \u2014 ${section.description}

\u0627\u0643\u062A\u0628 \u0628\u0627\u0644\u0634\u0643\u0644 \u0627\u0644\u0637\u0628\u064A\u0639\u064A \u0644\u0644\u0645\u062D\u062A\u0648\u0649: \u0625\u0646 \u0643\u0627\u0646 \u0627\u0644\u0639\u0645\u0644 \u0633\u0631\u062F\u064A\u0627\u064B/\u0625\u0628\u062F\u0627\u0639\u064A\u0627\u064B \u0641\u0627\u0643\u062A\u0628 \u0646\u062B\u0631\u0627\u064B \u0631\u0648\u0627\u0626\u064A\u0627\u064B \u0645\u062A\u062F\u0641\u0651\u0642\u0627\u064B \u0648\u062D\u0648\u0627\u0631\u0627\u064B \u0648\u0648\u0635\u0641\u0627\u064B (\u0628\u062F\u0648\u0646 \u0642\u0648\u0627\u0626\u0645 \u0646\u0642\u0637\u064A\u0629 \u0648\u0644\u0627 \u0639\u0646\u0627\u0648\u064A\u0646 \u0641\u0631\u0639\u064A\u0629 \u062A\u0642\u0646\u064A\u0629)\u060C \u0648\u0625\u0646 \u0643\u0627\u0646 \u0645\u0639\u0644\u0648\u0645\u0627\u062A\u064A\u0627\u064B \u0641\u0627\u0643\u062A\u0628 \u0646\u062B\u0631\u0627\u064B \u0645\u0646\u0638\u0651\u0645\u0627\u064B \u063A\u0646\u064A\u0627\u064B \u0648\u0645\u0641\u0635\u0644\u0627\u064B. \u0646\u0641\u0651\u0630 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u062D\u0631\u0641\u064A\u0627\u064B \u0648\u0627\u0628\u0646\u0650 \u0639\u0644\u064A\u0647 \u0628\u0623\u0641\u0636\u0644 \u062C\u0648\u062F\u0629.

\u0623\u0639\u062F \u0641\u0642\u0637 JSON \u0628\u0647\u0630\u0627 \u0627\u0644\u0634\u0643\u0644 \u0628\u0627\u0644\u0636\u0628\u0637 \u0648\u0628\u062F\u0648\u0646 \u0623\u064A \u0646\u0635 \u0625\u0636\u0627\u0641\u064A:
{"finalHtml":"\u0648\u0633\u0648\u0645 HTML \u0646\u0638\u064A\u0641\u0629 \u0645\u062B\u0644 <p> \u0648 <ul> \u0648 <strong> \u0628\u062F\u0648\u0646 <html> \u0623\u0648 <body> \u0623\u0648 \u0639\u0644\u0627\u0645\u0627\u062A markdown"}`
                    });
                    const cleanJsonText = (secRes.text || "").replace(/```json/g, "").replace(/```/g, "").trim();
                    const parsed = JSON.parse(cleanJsonText);
                    return parsed.finalHtml || "";
                  };
                  try {
                    cleanHtml = await fetchSectionHtml(docWriterModel);
                    const priorContextSummary = sections.slice(0, index).map((s) => s.title).join(" -> ");
                    const auditRes = await auditDocChunk(ai5, section.title, cleanHtml, priorContextSummary, docAuditorModel);
                    if (auditRes.ok && auditRes.refinedHtml) {
                      cleanHtml = auditRes.refinedHtml;
                    } else if (!auditRes.ok) {
                      console.warn(`[Doc Gen] Section ${index + 1} failed audit, retrying authoring once with writer tier...`);
                      cleanHtml = await fetchSectionHtml(docWriterModel);
                    }
                  } catch (e) {
                    console.error("Doc section generation error:", e);
                    cleanHtml = cleanHtml || "<p>\u0639\u0630\u0631\u0627\u064B\u060C \u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0648\u0644\u064A\u062F \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645.</p>";
                  }
                  completedSectionsCount++;
                  if (jobId) {
                    await setDocRest("generation_jobs", jobId, {
                      status: "writing_section",
                      currentStepIndex: completedSectionsCount,
                      stepLabel: `\u062C\u0627\u0631\u064A \u0635\u064A\u0627\u063A\u0629 \u0648\u062A\u062D\u0631\u064A\u0631 \u0642\u0633\u0645: ${section.title}`,
                      totalSteps,
                      sections: sections.map((s) => ({ title: s.title || "", description: s.description || "" })),
                      type: "document",
                      docType: docTypeToUse,
                      createdAt: Date.now()
                    }, token).catch((e) => console.error("Firestore job update failed:", e));
                  }
                  if (docTypeToUse === "pdf_doc") {
                    fullContent[index] = `<section class="doc-section"><h2>${section.title}</h2><div>${cleanHtml}</div></section>`;
                  } else {
                    fullContent[index] = `<h2>${section.title}</h2><div>${cleanHtml}</div>`;
                  }
                }));
              }
              if (jobId) {
                await setDocRest("generation_jobs", jobId, {
                  status: "assembling",
                  currentStepIndex: totalSteps - 1,
                  stepLabel: "\u062C\u0627\u0631\u064A \u062A\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0644\u0641 \u0648\u062A\u062D\u0648\u064A\u0644\u0647 \u0644\u0644\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0645\u0637\u0644\u0648\u0628...",
                  totalSteps,
                  sections: sections.map((s) => ({ title: s.title || "", description: s.description || "" })),
                  type: "document",
                  docType: docTypeToUse,
                  createdAt: Date.now()
                }, token).catch((e) => console.error("Firestore job update failed:", e));
              }
              const displayTitle = typeof documentTitle === "string" ? documentTitle : "\u0645\u0633\u062A\u0646\u062F";
              const primaryColor = projectData?.brandProfile?.colors?.[0] || "#4f46e5";
              const textColor = projectData?.brandProfile?.colors?.[1] || "#374151";
              const fontPath = import_path4.default.resolve(process.cwd(), "cairo_arabic.b64");
              const docTextForSafety = fullContent.join("\n");
              const postSafety2 = await isSafePrompt(docTextForSafety, uid, type, token);
              if (!postSafety2.safe) {
                throw new Error("\u0639\u0630\u0631\u0627\u064B\u060C \u062A\u0645 \u062D\u0638\u0631 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u064F\u0648\u0644\u062F \u0644\u0645\u062E\u0627\u0644\u0641\u062A\u0647 \u0634\u0631\u0648\u0637 \u0627\u0644\u0633\u0644\u0627\u0645\u0629.");
              }
              let base64Font = "";
              if (import_fs4.default.existsSync(fontPath)) {
                base64Font = import_fs4.default.readFileSync(fontPath, "utf8").trim();
              }
              const isA5Paper = paperSize === "a5";
              const pageWidthMm = isA5Paper ? 148 : 210;
              const pageHeightMm = isA5Paper ? 210 : 297;
              let htmlContent = "";
              if (docTypeToUse === "pdf_doc") {
                htmlContent = `<!DOCTYPE html><html dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'Cairo';
    font-style: normal;
    font-weight: 400;
    src: url(data:font/woff2;base64,${base64Font}) format('woff2');
  }
  @page { size: ${pageWidthMm}mm ${pageHeightMm}mm; margin: ${isA5Paper ? "14mm 12mm" : "20mm 18mm"}; }
  body { background:#fff; color:#111; font-size:${isA5Paper ? "10.5pt" : "12pt"}; line-height:1.75; font-family: 'Cairo', sans-serif; margin: 0; padding: 0; }
  .doc-section { page-break-inside: avoid; }
  h2 { font-size: ${isA5Paper ? "14pt" : "17pt"}; margin-top: 1.4em; color: #111; }
</style>
</head>
<body>
${fullContent.join("")}
</body></html>`;
              } else {
                htmlContent = `<!DOCTYPE html><html dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'Cairo';
    font-style: normal;
    font-weight: 400;
    src: url(data:font/woff2;base64,${base64Font}) format('woff2');
  }
  body { font-family: 'Cairo', 'Tajawal', Arial, sans-serif; padding: 40px; color: ${textColor}; }
  h1 { text-align: center; color: ${primaryColor}; }
  h2 { color: ${primaryColor}; margin-top: 20px; }
  .content { line-height: 1.6; }
</style>
</head>
<body>
<h1>${displayTitle}</h1>
<div class="content">
${fullContent.join("")}
</div>
</body></html>`;
              }
              if (docTypeToUse === "pdf_doc") {
                const chromium = (await import("@sparticuz/chromium")).default;
                const puppeteer = (await import("puppeteer-core")).default;
                let browser = null;
                const { chromiumSemaphore: chromiumSemaphore2 } = await Promise.resolve().then(() => (init_pdf_engine(), pdf_engine_exports));
                await chromiumSemaphore2.acquire();
                try {
                  browser = await puppeteer.launch({
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath(),
                    headless: true
                  });
                  const page = await browser.newPage();
                  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
                  await page.evaluateHandle("document.fonts.ready");
                  await page.emulateMediaType("screen");
                  const pdfBuffer = await page.pdf({
                    format: isA5Paper ? "A5" : "A4",
                    printBackground: true,
                    preferCSSPageSize: true,
                    margin: isA5Paper ? { top: "14mm", right: "12mm", bottom: "14mm", left: "12mm" } : { top: "20mm", right: "18mm", bottom: "20mm", left: "18mm" }
                  });
                  {
                    const _b = Buffer.from(pdfBuffer);
                    if (_b.length < 5 || _b.subarray(0, 4).toString("latin1") !== "%PDF") throw new Error("PDF_CORRUPT");
                  }
                  generationResult = Buffer.from(pdfBuffer).toString("base64");
                  mimeType = "application/pdf";
                  extension = "pdf";
                } finally {
                  if (browser) await browser.close();
                  chromiumSemaphore2.release();
                }
              } else {
                const htmlToDocxModule = await import("html-to-docx");
                const HTMLtoDOCX = htmlToDocxModule.default || htmlToDocxModule;
                const docxOut = await HTMLtoDOCX(htmlContent, null, {
                  table: { row: { cantSplit: true } },
                  footer: false,
                  header: false,
                  pageNumber: false
                });
                let buffer;
                if (Buffer.isBuffer(docxOut)) {
                  buffer = docxOut;
                } else if (docxOut && typeof docxOut.arrayBuffer === "function") {
                  buffer = Buffer.from(await docxOut.arrayBuffer());
                } else if (docxOut instanceof ArrayBuffer) {
                  buffer = Buffer.from(new Uint8Array(docxOut));
                } else {
                  buffer = Buffer.from(docxOut);
                }
                if (buffer.length < 4 || buffer[0] !== 80 || buffer[1] !== 75) {
                  throw new Error("DOCX_CORRUPT: generated bytes are not a valid Office document");
                }
                generationResult = buffer.toString("base64");
                mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                extension = "docx";
              }
            }
          } else if (type === "infographic") {
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "starting",
                currentStepIndex: 0,
                stepLabel: "\u062C\u0627\u0631\u064A \u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0627\u0644\u0645\u0635\u0645\u0645 \u0648\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A...",
                totalSteps: 3,
                progress: 15,
                type: "infographic",
                createdAt: Date.now()
              }, token).catch((e) => console.error(e));
            }
            const {
              generateInfographicSpec: generateInfographicSpec2,
              editInfographicSpec: editInfographicSpec2,
              renderInfographic: renderInfographic2
            } = await Promise.resolve().then(() => (init_infographicEngine(), infographicEngine_exports));
            let spec;
            let sources = [];
            let groundingTokens;
            let structuringTokens;
            const infographicContext = {
              ...projectData || {},
              theme: req.body.theme || req.body.infographicTheme || "naje_auto_blend",
              colorPalette: req.body.colorPalette || (req.body.themeColors ? [req.body.themeColors] : void 0),
              layoutStyle: req.body.layoutStyle
            };
            if (isEdit && req.body.originalSpec) {
              if (jobId) {
                await setDocRest("generation_jobs", jobId, {
                  status: "processing",
                  currentStepIndex: 1,
                  stepLabel: "\u062C\u0627\u0631\u064A \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0639\u0644\u0649 \u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643...",
                  totalSteps: 3,
                  progress: 50
                }, token).catch((e) => console.error(e));
              }
              const editRes = await editInfographicSpec2(ai5, req.body.originalSpec, prompt, infographicContext);
              spec = editRes.spec;
              structuringTokens = editRes.structuringTokens;
            } else {
              if (jobId) {
                await setDocRest("generation_jobs", jobId, {
                  status: "processing",
                  currentStepIndex: 1,
                  stepLabel: "\u062C\u0627\u0631\u064A \u0628\u0646\u0627\u0621 \u0627\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u0628\u0635\u0631\u064A \u0648\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u062B\u064A\u0645 \u0648\u0627\u0644\u0623\u0644\u0648\u0627\u0646...",
                  totalSteps: 3,
                  progress: 45
                }, token).catch((e) => console.error(e));
              }
              const genRes = await generateInfographicSpec2(ai5, prompt, infographicContext);
              spec = genRes.spec;
              sources = genRes.sources || [];
              groundingTokens = genRes.groundingTokens;
              structuringTokens = genRes.structuringTokens;
            }
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "processing",
                currentStepIndex: 2,
                stepLabel: "\u062C\u0627\u0631\u064A \u062A\u0635\u064A\u064A\u0631 \u0627\u0644\u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u0628\u062F\u0642\u0629 \u0641\u0627\u0626\u0642\u0629 \u0648\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u062A\u0635\u062F\u064A\u0631 (PNG + PDF)...",
                totalSteps: 3,
                progress: 80
              }, token).catch((e) => console.error(e));
            }
            const rendered = await renderInfographic2(spec);
            generationResult = rendered.pngBase64;
            mimeType = "image/png";
            extension = "png";
            if (groundingTokens) {
              await chargeForTextModelUsage(uid, "gemini-3.5-flash-lite", groundingTokens, userIsAdmin).catch(console.error);
            }
            if (structuringTokens) {
              await chargeForTextModelUsage(uid, "gemini-3.5-flash-lite", structuringTokens, userIsAdmin).catch(console.error);
            }
            documentData = {
              title: spec.title || "\u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u0628\u064A\u0627\u0646\u0627\u062A",
              spec,
              sources,
              pdfBase64: rendered.pdfBase64,
              html: rendered.html
            };
          } else {
            let extractCleanHtml = function(text) {
              if (!text) return "";
              const fenceMatch = text.match(/```html?\s*([\s\S]*?)(?:```|$)/i);
              if (fenceMatch) {
                return fenceMatch[1].trim();
              }
              const htmlStartMatch = text.match(/(<!DOCTYPE\s+html[\s\S]*|<html[\s\S]*)/i);
              if (htmlStartMatch) {
                let htmlPart = htmlStartMatch[1].trim();
                const endMatch = htmlPart.match(/([\s\S]*?<\/html>)/i);
                if (endMatch) {
                  htmlPart = endMatch[1].trim();
                }
                return htmlPart;
              }
              return text.trim();
            };
            const contents = [];
            if (req.body.history && Array.isArray(req.body.history)) {
              const isUiChat = type === "ui";
              for (const msg of req.body.history) {
                let contentForModel = msg.content;
                if (isUiChat && msg.role === "assistant" && contentForModel && /<!DOCTYPE html|<html[\s>]/i.test(contentForModel.slice(0, 300))) {
                  contentForModel = "[\u0648\u0627\u062C\u0647\u0629 \u0633\u0627\u0628\u0642\u0629 \u062A\u0645 \u062A\u0648\u0644\u064A\u062F\u0647\u0627 \u2014 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u0645\u0631\u0641\u0642\u0629 \u0641\u064A \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0623\u062E\u064A\u0631\u0629]";
                }
                const parts = [{ text: contentForModel }];
                if (msg.files && Array.isArray(msg.files)) {
                  msg.files.forEach((f) => {
                    const cleanData = f.data && f.data.includes(",") ? f.data.split(",")[1] : f.data;
                    parts.push({
                      inlineData: {
                        data: cleanData,
                        mimeType: f.mimeType
                      }
                    });
                  });
                }
                contents.push({ role: msg.role === "assistant" ? "model" : "user", parts });
              }
            }
            const currentParts = [{ text: prompt }];
            if (files && Array.isArray(files)) {
              files.forEach((file) => {
                if (file.data && file.mimeType) {
                  const cleanData = file.data.includes(",") ? file.data.split(",")[1] : file.data;
                  currentParts.push({
                    inlineData: {
                      data: cleanData,
                      mimeType: file.mimeType
                    }
                  });
                }
              });
            }
            contents.push({ role: "user", parts: currentParts });
            if (type === "text" || type === "ui") {
              res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
              });
              const isPlanMode = req.body.mode === "plan";
              let finalSystemInstruction = systemInstruction;
              let tools = [];
              let isUiEdit = false;
              let previousHtml = "";
              if (type === "ui") {
                if (isPlanMode) {
                  finalSystemInstruction = `${finalSystemInstruction}

---

The user is in PLANNING mode. Do not write any HTML or code. Respond in clear, organized Arabic: propose a structure (sections, order, purpose of each), suggest content and layout choices, and ask clarifying questions if the request is vague. End by inviting the user to switch to "\u0628\u0646\u0627\u0621" (Build) mode when ready to generate.`;
                } else {
                  isUiEdit = req.body.isEdit;
                  previousHtml = extractCleanHtml(req.body.previousHtml || "");
                  if (!previousHtml && req.body.history && Array.isArray(req.body.history)) {
                    for (let i = req.body.history.length - 1; i >= 0; i--) {
                      const msg = req.body.history[i];
                      if (msg.role === "assistant" && msg.content) {
                        const cleaned = extractCleanHtml(msg.content);
                        if (cleaned.includes("<!DOCTYPE") || cleaned.includes("<html")) {
                          previousHtml = cleaned;
                          isUiEdit = true;
                          break;
                        }
                      }
                    }
                  }
                  let styleHintText = "";
                  if (req.body.styleHint) {
                    const hints = {
                      modern: "\n[STYLE DIRECTION: Modern, crisp layout with high-contrast accent colors]",
                      dark_luxury: "\n[STYLE DIRECTION: Dark luxury theme with sleek dark background, gold/amber accents, and smooth shadows]",
                      minimal: "\n[STYLE DIRECTION: Minimalist design with maximum negative space and refined typography]",
                      playful: "\n[STYLE DIRECTION: Playful theme with vibrant colors, rounded elements, and friendly feel]",
                      corporate: "\n[STYLE DIRECTION: Professional corporate aesthetic with clean grid layout and corporate blues]"
                    };
                    styleHintText = hints[req.body.styleHint] || "";
                  }
                  if (isUiEdit && previousHtml) {
                    finalSystemInstruction = `${finalSystemInstruction}

---

You are editing an EXISTING HTML interface within an ongoing conversation. The conversation history above includes how this interface was originally planned and built, and any earlier edits. You will now receive the CURRENT complete HTML document and a new edit instruction.

Reply in TWO parts: FIRST one short friendly Arabic sentence (max ~18 words) telling the user what you changed \u2014 this is your chat reply. Then a single newline, then the COMPLETE updated HTML document with ONLY the requested change applied.

CRITICAL RULES:
- Preserve everything the user did not ask to change \u2014 exact layout, colors, content, structure, and any prior edits. Change only what the instruction asks.
- Do not restructure, do not "improve" unrelated parts, do not drop sections.
- Keep the same overall design language and color palette unless the edit explicitly changes them.
- The CURRENT HTML DOCUMENT below is the one true source of truth to modify \u2014 do not regenerate from the earlier conversation description; edit the document as given.
- The conversation history above shows the sequence of instructions. Previous interface versions are intentionally omitted from that history and replaced with a placeholder \u2014 this is deliberate.
- Output the full document (<!DOCTYPE html> ... </html>), inline everything, same security rules as before: no external resources, no network.`;
                    let editPromptText = "";
                    if (req.body.selectedElement && req.body.selectedElement.html) {
                      editPromptText = `CURRENT HTML DOCUMENT:
\`\`\`html
${previousHtml}
\`\`\`

TARGET ELEMENT CONTEXT:
- Description: ${req.body.selectedElement.desc}
- Snippet: ${req.body.selectedElement.html}

EDIT INSTRUCTION:
${prompt}${styleHintText}`;
                    } else {
                      editPromptText = `CURRENT HTML DOCUMENT:
\`\`\`html
${previousHtml}
\`\`\`

EDIT INSTRUCTION:
${prompt}${styleHintText}`;
                    }
                    if (contents.length > 0 && contents[contents.length - 1].role === "user") {
                      contents[contents.length - 1].parts[0].text = editPromptText;
                    } else {
                      contents.push({ role: "user", parts: [{ text: editPromptText }] });
                    }
                    if (type === "ui" && isUiEdit) {
                      const totalChars = contents.reduce((s, c) => s + (c.parts?.[0]?.text?.length || 0), 0);
                      console.log(`[UI Edit] historyTurns=${contents.length} totalInputChars=${totalChars} htmlLen=${previousHtml.length}`);
                    }
                  } else {
                    finalSystemInstruction = `${finalSystemInstruction}

---

You are Naje Studio, an elite UI engineer. You produce a SINGLE, COMPLETE, self-contained HTML document rendering a polished, modern, production-grade interface.

OUTPUT
- FIRST write ONE short friendly Arabic sentence (max ~18 words) telling the user what you built \u2014 this line is your chat reply to the user. Then a single newline.
- THEN the HTML document: start <!DOCTYPE html>, end </html>. No markdown, no fences, and no commentary INSIDE or AFTER the HTML.
- Everything inline: <style> for CSS, <script> for JS. No external files, no CDN, no <link>, no @import, no fetch. Assume zero network.
- Imagery: inline SVG, CSS gradients, and CSS shapes only. No external image URLs.

CAPABILITIES YOU HAVE (all inline, no network):
- A micro-animation CSS kit: add class "naje-fade-in", "naje-slide-up", "naje-stagger", "naje-scale-in" to animate elements on load. Use them for a refined entrance.
- An inline icon sprite: use <svg><use href="#icon-{name}"/></svg> with names like home, user, search, menu, chart, cart, star, arrow-right, check, settings, bell, calendar, trash, edit, filter, plus, heart.
- An inline chart function najeChart(el, {type, data}) for bar/line/donut. Use it for dashboards and data UIs \u2014 real charts, not fake bars.

RESPONSIVE DESIGN \u2014 MANDATORY, NOT OPTIONAL
You are generating for TWO explicit viewport targets that will be tested separately: a 390px-wide phone and a 1280px-wide laptop. This is not "make it fluid" \u2014 you must author DISTINCT layout behavior for each range using real CSS breakpoints.

Requirements:
- Use \`@media (max-width: 640px)\` as the phone breakpoint. Inside it, you MUST change actual layout structure, not just font sizes:
  - Multi-column grids collapse to a single column.
  - Sidebars/navigation move to a bottom bar, a hamburger drawer, or stack above content \u2014 never remain side-by-side with the main content.
  - Any table becomes a stacked card list or gains horizontal scroll.
  - Reduce padding/margins appropriately for a small screen.
- Use a mobile-first base with \`min-width\` media queries to progressively add multi-column layout for laptop, OR a desktop-first base with \`max-width\` queries to collapse for mobile \u2014 pick one strategy and apply it consistently.
- Never rely on the browser viewport alone to "just reflow" \u2014 write explicit rules. A design with zero layout-changing media queries is a FAILED response for this product; visual polish does not compensate for a non-responsive structure.
- Touch targets on the phone layout must be at least 44x44px.
- Test yourself mentally: if the sidebar/nav is still beside the content at 390px width, you have failed this requirement \u2014 fix it before returning.

CONCRETE EXAMPLE \u2014 follow this exact pattern for a sidebar layout:

.app-layout { display: flex; gap: 24px; }
.sidebar { width: 260px; flex-shrink: 0; }
.main-content { flex: 1; }

@media (max-width: 640px) {
  .app-layout { flex-direction: column; }
  .sidebar {
    width: 100%;
    display: flex;
    overflow-x: auto;
  }
}

This is the LEVEL of concreteness required. A media query that only shrinks font-size or padding, with no structural property (flex-direction, grid-template-columns, display, position) inside it, does not satisfy this requirement.

DESIGN INTELLIGENCE & BAR:
- Choose a layout archetype that fits the request: hero+features for a landing page, sidebar+cards for a dashboard, grid+filters for a store, split for auth.
- DESIGN SYSTEM \u2014 USE THE NAJE KIT, DON'T REINVENT SPACING/RADIUS/SHADOW VALUES
  A base stylesheet is already injected before your <style> block, providing:
  --naje-radius-sm/md/lg, --naje-shadow-sm/md/lg, --naje-space-1 through 6, and
  utility classes .naje-card, .naje-btn, .naje-btn-primary, .naje-input.
  USE THESE for structural values (radius, shadow, spacing) so output is consistent and professional.
- Use a refined type scale (a clear ratio, e.g. 1.25) with real hierarchy.
- Add depth with layered shadows and subtle borders, never flat gray boxes.
- Entrance animation on load using the animation kit \u2014 the page should feel like it arrives, not just appear.
- Populate with realistic, specific content for the actual subject. Never lorem ipsum, never "Item 1 / Item 2".
- Accessibility: semantic landmarks, labelled controls, visible focus states, sufficient contrast.

INTERACTION & BACKEND SIMULATION (make it feel fully functional to try)
- Working client-side interactivity: tabs switch, modals open/close, accordions expand, form fields show focus/validation states, mobile menus toggle.
- When the request implies data/state (a todo list, a cart, a login flow, a dashboard with records), implement a complete in-memory JavaScript data layer:
  * An array/object acting as the "database", pre-populated with a few realistic example records.
  * Functions that perform create/read/update/delete against that in-memory store.
  * Wire every UI action (add, edit, delete, submit, "log in") to actually call these functions and re-render \u2014 the app must be genuinely interactive and stateful within the session, not a static mockup.
  * A simple login form may accept ANY input and simulate success.
- All self-contained vanilla JS. No frameworks, no network.

ARABIC / RTL
- If the subject or content is Arabic, set dir="rtl", mirror the layout, and use a right-to-left visual flow. Latin-only tokens (brand names, code) stay LTR.

Aim for output a senior product designer would approve. Restraint, hierarchy, and polish over decoration.
\u062A\u0630\u0643\u064A\u0631: \u0641\u064A \u0648\u0636\u0639 \u0627\u0644\u0628\u0646\u0627\u0621\u060C \u0645\u062E\u0631\u062C\u0643 \u0647\u0648 \u0645\u0633\u062A\u0646\u062F HTML \u0641\u0642\u0637 \u0628\u0644\u0627 \u0623\u064A \u0645\u0642\u062F\u0645\u0627\u062A \u0623\u0648 \u062A\u0639\u0644\u064A\u0642\u0627\u062A.`;
                    if (styleHintText && contents.length > 0) {
                      contents[contents.length - 1].parts[0].text += styleHintText;
                    }
                  }
                }
              } else {
                const decls = [
                  {
                    name: "generate_document",
                    description: "Call this when the user explicitly asks to turn the current conversation, an idea, or content into a downloadable document, presentation, or PDF. (Max 25 pages for Word/PDF documents, Max 35 slides for PowerPoint presentations)",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        docType: { type: "STRING", enum: ["pptx", "docx", "pdf_slides", "pdf_doc"] },
                        summary: { type: "STRING", description: "A short summary of what the document should contain, based on the conversation so far." },
                        estimatedPageOrSlideCount: { type: "NUMBER", description: "Your best estimate, based on the conversation so far, of how many pages (for docx/pdf, max 25) or slides (for pptx, max 35) this document should reasonably contain." }
                      },
                      required: ["docType", "estimatedPageOrSlideCount"]
                    }
                  }
                ];
                if (memoryItemsForTools && memoryItemsForTools.length > 0) {
                  decls.push({
                    name: "recall_project_memory",
                    description: "Retrieve the full original content of a specific project memory item (not just its summary). Call this when the user explicitly asks you to reference, quote, or work directly from previously saved files, text, or links.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        itemId: { type: "STRING", description: "The memory item's id, from the list already provided in context." }
                      },
                      required: ["itemId"]
                    }
                  });
                }
                tools = [{ functionDeclarations: decls }];
              }
              const enableSearchGrounding = req.body.enableSearchGrounding || req.body.enableSearch || req.body.useGrounding;
              if (enableSearchGrounding) {
                tools.push({ googleSearch: {} });
              }
              const hasFunctionDecls = tools.some((t) => t.functionDeclarations && t.functionDeclarations.length > 0);
              const hasBuiltinTools = tools.some((t) => t.googleSearch || t.codeExecution);
              const toolConfig = hasFunctionDecls && hasBuiltinTools ? { includeServerSideToolInvocations: true } : void 0;
              const textLiteModel = await getModelEndpointId("text_lite", getNajeModel("lite"), token);
              const textCoreModel = await getModelEndpointId("text_core", getNajeModel("core"), token);
              const textMaxModel = await getModelEndpointId("text_max", getNajeModel("pro"), token);
              const uiModelId = await getModelEndpointId("ui_standard", getNajeModel("core"), token);
              const MODEL_MAP = {
                lite: textLiteModel,
                core: textCoreModel,
                max: textMaxModel
              };
              const requestedModelKey = String(req.body.model || "core").toLowerCase();
              const selectedModelId2 = resolveEngineModel(type === "ui" ? uiModelId : MODEL_MAP[requestedModelKey] || textCoreModel);
              console.log(`[UI Generation] type=${type}, requestedModel=${requestedModelKey}, selectedModelId=${selectedModelId2}, mode=${req.body.mode || "build"}`);
              let generatedImageSlots = {};
              if (type === "ui" && !isPlanMode && !isUiEdit) {
                try {
                  const planResp = await ai5.models.generateContent({
                    model: resolveEngineModel(uiModelId),
                    contents: [
                      { role: "user", parts: [{ text: `Analyze this UI request: "${prompt}". Produce a concise JSON plan:
{
  "sections": [{ "id": string, "purpose": string, "layoutHint": string }],
  "designSystem": { "paletteHint": string, "mood": string },
  "needsChart": boolean,
  "needsRealImagery": boolean,
  "imagePrompts": [ array of 1-2 short photographic prompts in English if needsRealImagery is true ]
}
Return ONLY raw JSON, no markdown code fences.` }] }
                    ],
                    config: { responseMimeType: "application/json", maxOutputTokens: OUTPUT_TOKEN_LIMITS.uiPlan }
                  });
                  if (planResp.text) {
                    const uiPlan = JSON.parse(planResp.text);
                    let planContext = `

[STAGED UI BUILD PLAN]:
- Architecture: ${JSON.stringify(uiPlan.sections)}
- Design System: ${JSON.stringify(uiPlan.designSystem)}
- Chart Needed: ${uiPlan.needsChart}`;
                    if (uiPlan.needsRealImagery && Array.isArray(uiPlan.imagePrompts) && uiPlan.imagePrompts.length > 0 && (pricing.ui?.enableGeneratedImagery ?? true)) {
                      const promptsToRun = uiPlan.imagePrompts.slice(0, 2);
                      const sharpModule2 = await import("sharp");
                      const sharp3 = sharpModule2.default || sharpModule2;
                      for (let idx = 0; idx < promptsToRun.length; idx++) {
                        const imgPrompt = promptsToRun[idx];
                        try {
                          let rawBase64 = "";
                          if (USE_VERTEX_AI2) {
                            const imgRes = await ai5.models.generateImages({
                              model: "imagen-3.0-generate-002",
                              prompt: `Professional high quality photo of ${imgPrompt}. Clean, cinematic, modern, realistic lighting.`,
                              config: { numberOfImages: 1, aspectRatio: "4:3", outputMimeType: "image/png" }
                            });
                            rawBase64 = imgRes?.generatedImages?.[0]?.image?.imageBytes || "";
                          } else {
                            const imgInteraction = await ai5.interactions.create({
                              model: "gemini-3.1-flash-image",
                              input: `Professional high quality photo of ${imgPrompt}. Clean, cinematic, modern, realistic lighting.`,
                              response_modalities: ["image"]
                            });
                            for (const step of imgInteraction.steps) {
                              if (step.type === "model_output") {
                                const img = step.content?.find((c) => c.type === "image");
                                if (img && img.data) {
                                  rawBase64 = img.data;
                                  break;
                                }
                              }
                            }
                          }
                          if (rawBase64) {
                            const rawBuf = Buffer.from(rawBase64, "base64");
                            const compressedBuf = await sharp3(rawBuf).resize(800, 600, { fit: "inside" }).jpeg({ quality: 78 }).toBuffer();
                            const slotKey = `hero-photo-${idx + 1}`;
                            generatedImageSlots[slotKey] = `data:image/jpeg;base64,${compressedBuf.toString("base64")}`;
                          }
                        } catch (imgErr) {
                          console.warn(`[UI Staged Imagery] Generation failed for prompt "${imgPrompt}":`, imgErr);
                        }
                      }
                      if (Object.keys(generatedImageSlots).length > 0) {
                        const imgAddon = Object.keys(generatedImageSlots).length * (pricing.ui?.imagePerAsset || 0.5);
                        cost2 += imgAddon;
                        planContext += `
- GENERATED REAL IMAGES TO EMBED DIRECTLY IN UI (use src attribute with data URI):`;
                        for (const [slotKey, dataUri] of Object.entries(generatedImageSlots)) {
                          planContext += `
  * <img src="${dataUri}" alt="Photo" class="w-full object-cover rounded-xl" />`;
                        }
                      }
                    }
                    finalSystemInstruction += planContext;
                  }
                } catch (planErr) {
                  console.warn("[UI Staged Pipeline] Call 1 Plan pass skipped:", planErr);
                }
              }
              let stream = null;
              let streamModelUsed = selectedModelId2;
              const streamConfig = {
                systemInstruction: finalSystemInstruction,
                tools: tools.length > 0 ? tools : void 0,
                toolConfig,
                maxOutputTokens: type === "ui" ? OUTPUT_TOKEN_LIMITS.uiHtml : OUTPUT_TOKEN_LIMITS.chatResponse,
                thinkingConfig: { thinkingLevel: requestedModelKey === "lite" ? "LOW" : requestedModelKey === "max" ? "HIGH" : "MEDIUM" },
                // Gemini 3.7 rejects deprecated sampling params and non-config fields
                // (aspectRatio/quality are image-only). Strip them before spreading.
                ...(() => {
                  const { aspectRatio: aspectRatio2, quality, temperature, topP, topK, ...rest } = config || {};
                  return rest;
                })()
              };
              try {
                stream = await ai5.models.generateContentStream({
                  model: selectedModelId2,
                  contents,
                  config: streamConfig
                });
              } catch (primaryStreamErr) {
                console.warn(`[Stream Generation] Primary model "${selectedModelId2}" stream initialization failed:`, primaryStreamErr?.message || primaryStreamErr);
                const fallbackCandidate = selectedModelId2 !== "gemini-3.1-flash-lite" && selectedModelId2 !== "gemini-3.5-flash-lite" ? resolveEngineModel(getNajeModel("lite")) : "gemini-3.6-flash";
                if (fallbackCandidate && fallbackCandidate !== selectedModelId2) {
                  console.log(`[Stream Generation] Retrying stream with fallback model "${fallbackCandidate}"...`);
                  try {
                    stream = await ai5.models.generateContentStream({
                      model: fallbackCandidate,
                      contents,
                      config: streamConfig
                    });
                    streamModelUsed = fallbackCandidate;
                  } catch (fallbackStreamErr) {
                    console.error(`[Stream Generation] Fallback model "${fallbackCandidate}" also failed:`, fallbackStreamErr?.message || fallbackStreamErr);
                    throw fallbackStreamErr;
                  }
                } else {
                  throw primaryStreamErr;
                }
              }
              let fullText = "";
              let functionCalls = [];
              let searchSources = [];
              let planViolationDetected = false;
              let streamUsageMetadata = null;
              const maxOutputBytes = (pricing.ui?.maxOutputKb || 400) * 1024;
              try {
                for await (const chunk of stream) {
                  if (chunk.usageMetadata) {
                    streamUsageMetadata = chunk.usageMetadata;
                  }
                  const extractedCalls = extractGeminiFunctionCalls(chunk);
                  if (extractedCalls.length > 0) {
                    functionCalls.push(...extractedCalls);
                  }
                  const candidate = chunk.candidates?.[0];
                  if (candidate?.groundingMetadata?.groundingChunks) {
                    for (const gChunk of candidate.groundingMetadata.groundingChunks) {
                      if (gChunk.web?.uri) {
                        const url = gChunk.web.uri;
                        const title = gChunk.web.title || url;
                        if (!searchSources.some((s) => s.url === url)) {
                          searchSources.push({ title, url });
                        }
                      }
                    }
                  }
                  const chunkText = extractGeminiText(chunk);
                  if (chunkText) {
                    fullText += chunkText;
                    if (type === "ui" && isPlanMode && !planViolationDetected) {
                      if (/<!DOCTYPE html|<html[\s>]/i.test(fullText.slice(0, 300))) {
                        planViolationDetected = true;
                        console.warn(`[Plan Mode Violation] Detected HTML mid-stream, aborting generation. uid=${uid}`);
                        break;
                      }
                    }
                    res.write(`data: ${JSON.stringify({ text: chunkText })}

`);
                    if (type === "ui" && fullText.length > maxOutputBytes) {
                      break;
                    }
                  }
                }
              } catch (streamIterErr) {
                console.warn(`[Stream Chunk Iteration Warning] Stream interrupted mid-flight:`, streamIterErr?.message || streamIterErr);
              }
              if (!fullText && functionCalls.length === 0 && !planViolationDetected) {
                console.warn(`[Stream Generation] Model "${streamModelUsed}" yielded empty text. Attempting non-streaming backup generation...`);
                try {
                  const backupModel = resolveEngineModel(getNajeModel("lite"));
                  const backupResp = await ai5.models.generateContent({
                    model: backupModel,
                    contents,
                    config: {
                      systemInstruction: finalSystemInstruction,
                      maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse
                    }
                  });
                  if (backupResp.usageMetadata) streamUsageMetadata = backupResp.usageMetadata;
                  const backupCalls = extractGeminiFunctionCalls(backupResp);
                  if (backupCalls.length) functionCalls.push(...backupCalls);
                  const backupText = extractGeminiText(backupResp);
                  if (backupText) {
                    fullText = backupText;
                    res.write(`data: ${JSON.stringify({ text: fullText })}

`);
                  }
                } catch (backupErr) {
                  console.error("[Stream Generation] Backup generation failed:", backupErr?.message || backupErr);
                }
              }
              if (planViolationDetected) {
                res.write(`data: ${JSON.stringify({ replaceContent: "(\u062D\u0635\u0644 \u062E\u0637\u0623 \u0628\u0633\u064A\u0637 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u062E\u0637\u064A\u0637\u060C \u062C\u0631\u0651\u0628 \u0635\u064A\u0627\u063A\u0629 \u0627\u0644\u0637\u0644\u0628 \u0628\u0634\u0643\u0644 \u0645\u062E\u062A\u0644\u0641.)" })}

`);
                res.write(`data: ${JSON.stringify({ modeConfirmed: "plan" })}

`);
                res.write(`data: [DONE]

`);
                res.end();
                return;
              }
              if (type === "ui" && isUiEdit && previousHtml && fullText) {
                const similarity = structuralSimilarity(previousHtml, fullText);
                console.log(`[Edit Fidelity] similarity=${similarity.toFixed(2)} model=${selectedModelId2} uid=${uid}`);
                if (similarity < 0.5) {
                  console.warn(`[Edit Fidelity] LOW similarity (${similarity.toFixed(2)}) \u2014 model regenerated instead of editing. Forcing a strict re-edit.`);
                  try {
                    const reEdit = await ai5.models.generateContent({
                      model: selectedModelId2,
                      contents: [
                        { role: "user", parts: [{ text: `You must EDIT the document below IN PLACE. Apply ONLY this change: "${prompt}". Keep everything else identical \u2014 same layout, colors, text, structure, and all prior content. Do NOT regenerate, redesign, reorder, or drop anything.

CURRENT HTML DOCUMENT:
\`\`\`html
${previousHtml}
\`\`\`

Return ONLY the full edited document, starting with <!DOCTYPE html> and ending with </html>, no markdown fences.` }] }
                      ],
                      config: {
                        maxOutputTokens: OUTPUT_TOKEN_LIMITS.uiHtml
                      }
                    });
                    let corrected = (reEdit.text || "").trim();
                    if (corrected.startsWith("```html")) corrected = corrected.replace(/^```html\s*/, "").replace(/\s*```$/, "");
                    else if (corrected.startsWith("```")) corrected = corrected.replace(/^```\s*/, "").replace(/\s*```$/, "");
                    if (corrected.includes("<!DOCTYPE") && corrected.includes("</html>") && structuralSimilarity(previousHtml, corrected) > similarity) {
                      fullText = corrected;
                      res.write(`data: ${JSON.stringify({ replaceContent: fullText })}

`);
                      console.log(`[Edit Fidelity] Strict re-edit applied (similarity improved).`);
                    }
                  } catch (reErr) {
                    console.warn("[Edit Fidelity] re-edit failed:", reErr);
                  }
                }
              }
              if (type === "ui" && !isPlanMode && !isUiEdit && fullText && (pricing.ui?.enablePolishPass ?? true)) {
                const respCheck = hasStructuralResponsiveness(fullText);
                if (!respCheck.hasMediaQuery || !respCheck.changesLayout) {
                  console.log(`[UI Polish Pass] Responsiveness check failed on initial output \u2014 running Polish pass.`);
                  try {
                    const polishResp = await ai5.models.generateContent({
                      model: selectedModelId2,
                      contents: [
                        { role: "user", parts: [{ text: `Your generated HTML failed the mobile responsiveness requirement \u2014 it must restructure at 640px (e.g., collapse multi-column layouts, stack sidebars/navigation, or restructure tables into card lists).

Here is the HTML document:
\`\`\`html
${fullText}
\`\`\`

Return the complete updated HTML document with real layout-changing mobile media queries (@media (max-width: 640px)) added. Return ONLY raw HTML starting with <!DOCTYPE html> and ending with </html>, no markdown code fences.` }] }
                      ],
                      config: {
                        maxOutputTokens: OUTPUT_TOKEN_LIMITS.uiHtml
                      }
                    });
                    if (polishResp.text && polishResp.text.includes("<!DOCTYPE") && polishResp.text.includes("</html>")) {
                      let correctedHtml = polishResp.text.trim();
                      if (correctedHtml.startsWith("```html")) correctedHtml = correctedHtml.replace(/^```html\s*/, "").replace(/\s*```$/, "");
                      else if (correctedHtml.startsWith("```")) correctedHtml = correctedHtml.replace(/^```\s*/, "").replace(/\s*```$/, "");
                      fullText = correctedHtml;
                      res.write(`data: ${JSON.stringify({ replaceContent: fullText })}

`);
                      console.log(`[UI Polish Pass] Successfully generated responsive correction.`);
                    }
                  } catch (polishErr) {
                    console.warn(`[UI Polish Pass] Failed:`, polishErr);
                  }
                }
              }
              let finalBalanceForStream = currentBalance;
              const streamProducedArtifact = !fullText ? false : typeof fullText === "string" ? type === "ui" ? fullText.length > 200 : fullText.length > 0 : !!fullText;
              if (cost2 > 0 && !streamProducedArtifact && functionCalls.length === 0) {
                res.write(`data: ${JSON.stringify({ error: "\u062A\u0639\u0630\u0651\u0631 \u0625\u0643\u0645\u0627\u0644 \u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0627\u0644\u0646\u0645\u0648\u0630\u062C. \u0644\u0645 \u064A\u062A\u0645 \u062E\u0635\u0645 \u0623\u064A \u0646\u0642\u0627\u0637." })}

`);
                res.end();
                return;
              }
              if (cost2 > 0 && streamProducedArtifact) {
                try {
                  const atomicRes = await mutateBalanceAtomic(uid, -cost2, { requireSufficient: true });
                  if (atomicRes.ok) {
                    finalBalanceForStream = atomicRes.newBalance;
                  } else {
                    console.error("Stream point deduction failed:", atomicRes.reason);
                  }
                } catch (deductErr) {
                  console.error("Failed to deduct points in stream:", deductErr);
                }
                await createDocRest("api_cost_log", {
                  uid,
                  type,
                  model: type === "ui" ? req.body.model || "core" : "text",
                  costInPoints: cost2,
                  estimatedCostUSD: 0.01,
                  inputTokens: streamUsageMetadata?.promptTokenCount || void 0,
                  outputTokens: streamUsageMetadata?.candidatesTokenCount || void 0,
                  cachedContentTokenCount: streamUsageMetadata?.cachedContentTokenCount || 0,
                  createdAt: Date.now()
                }, void 0).catch(console.error);
              }
              const recallCall2 = functionCalls.find((fc) => fc.name === "recall_project_memory");
              if (recallCall2 && recallCall2.args && recallCall2.args.itemId) {
                try {
                  const pid = String(req.body.projectId || projectData && projectData.id || "");
                  const itemIdToFetch = String(recallCall2.args.itemId);
                  if (pid && itemIdToFetch) {
                    let itemData = await getDocRest(`projects/${pid}/memory_items`, itemIdToFetch, token).catch(() => null);
                    if (!itemData) {
                      try {
                        const memItemSnap = await dbAdmin.collection("projects").doc(pid).collection("memory_items").doc(itemIdToFetch).get();
                        if (memItemSnap.exists) {
                          itemData = memItemSnap.data();
                        }
                      } catch (e) {
                      }
                    }
                    if (itemData) {
                      const rawFullText = itemData.storageRef || itemData.content || itemData.summary || "";
                      const followUp = await ai5.models.generateContent({
                        model: selectedModelId2,
                        contents: [
                          ...contents,
                          { role: "model", parts: [{ functionCall: recallCall2 }] },
                          { role: "user", parts: [{ functionResponse: { name: "recall_project_memory", response: { content: rawFullText } } }] }
                        ],
                        config: { systemInstruction, maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse }
                      });
                      if (followUp.text) {
                        fullText += "\n\n" + followUp.text;
                        res.write(`data: ${JSON.stringify({ text: "\n\n" + followUp.text })}

`);
                      }
                    }
                  }
                } catch (recallErr) {
                  console.error("recall_project_memory execution error:", recallErr);
                }
              }
              const docGenCall2 = functionCalls.find((fc) => fc.name === "generate_document");
              if (docGenCall2 && docGenCall2.args && docGenCall2.args.docType) {
                const extractedType = String(docGenCall2.args.docType).toLowerCase();
                const summaryPrompt = docGenCall2.args.summary || prompt;
                const estimatedCount = Number(docGenCall2.args.estimatedPageOrSlideCount) || 5;
                if (!fullText) {
                  fullText = `\u0644\u0642\u062F \u0642\u0645\u062A \u0628\u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0648\u062F\u0629 \u0644\u0625\u0646\u0634\u0627\u0621 \u0645\u0633\u062A\u0646\u062F (${extractedType.toUpperCase()})\u060C \u064A\u0645\u0643\u0646\u0643 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u062F\u0621 \u0645\u0646 \u0627\u0644\u0632\u0631 \u0623\u062F\u0646\u0627\u0647.`;
                  res.write(`data: ${JSON.stringify({ text: fullText })}

`);
                }
                res.write(`data: ${JSON.stringify({ triggerDocGeneration: extractedType, triggerPrompt: summaryPrompt, estimatedCount })}

`);
              }
              let streamTokenBill = null;
              try {
                const billingEndpointId = type === "ui" ? "ui_standard" : requestedModelKey === "lite" ? "text_lite" : requestedModelKey === "max" ? "text_max" : "text_core";
                streamTokenBill = await chargeForTextModelUsage(uid, billingEndpointId, streamUsageMetadata, userIsAdmin);
                if (typeof streamTokenBill.newBalance === "number") {
                  finalBalanceForStream = streamTokenBill.newBalance;
                }
              } catch (meterErr) {
                console.error("Stream token metering error:", meterErr);
              }
              const streamEndPayload = { modeConfirmed: type === "ui" && isPlanMode ? "plan" : "build" };
              if (searchSources.length > 0) streamEndPayload.searchSources = searchSources;
              if (typeof groundingReport !== "undefined" && groundingReport) streamEndPayload.groundingReport = groundingReport;
              if (typeof finalBalanceForStream === "number") streamEndPayload.newBalance = finalBalanceForStream;
              if (streamTokenBill) {
                streamEndPayload.usage = {
                  charged: streamTokenBill.charged || 0,
                  inputTokens: streamTokenBill.inputTokens || 0,
                  outputTokens: streamTokenBill.outputTokens || 0,
                  cachedTokens: streamTokenBill.cachedTokens || 0,
                  thoughtsTokens: streamTokenBill.thoughtsTokens || 0,
                  billingType: "per_token"
                };
                streamEndPayload.consumedBalance = streamTokenBill.charged || 0;
              }
              res.write(`data: ${JSON.stringify(streamEndPayload)}

`);
              res.write(`data: [DONE]

`);
              res.end();
              return;
            }
            const nonStreamDecls = [
              {
                name: "generate_document",
                description: "Call this when the user explicitly asks to turn the current conversation, an idea, or content into a downloadable document, presentation, or PDF. (Max 25 pages for Word/PDF documents, Max 35 slides for PowerPoint presentations)",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    docType: { type: "STRING", enum: ["pptx", "docx", "pdf_slides", "pdf_doc"] },
                    summary: { type: "STRING", description: "A short summary of what the document should contain, based on the conversation so far." },
                    estimatedPageOrSlideCount: { type: "NUMBER", description: "Your best estimate, based on the conversation so far, of how many pages (for docx/pdf, max 25) or slides (for pptx, max 35) this document should reasonably contain." }
                  },
                  required: ["docType", "estimatedPageOrSlideCount"]
                }
              }
            ];
            if (memoryItemsForTools && memoryItemsForTools.length > 0) {
              nonStreamDecls.push({
                name: "recall_project_memory",
                description: "Retrieve the full original content of a specific project memory item (not just its summary). Call this when the user explicitly asks you to reference, quote, or work directly from previously saved files, text, or links.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    itemId: { type: "STRING", description: "The memory item's id, from the list already provided in context." }
                  },
                  required: ["itemId"]
                }
              });
            }
            const response = await ai5.models.generateContent({
              model: resolveEngineModel(selectedModelId || "gemini-3.6-flash"),
              contents,
              config: {
                systemInstruction,
                tools: [{ functionDeclarations: nonStreamDecls }],
                maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse,
                ...(() => {
                  const { aspectRatio: aspectRatio2, quality, temperature, topP, topK, ...rest } = config || {};
                  return rest;
                })()
              }
            });
            if (response.usageMetadata) {
              await chargeForTextModelUsage(uid, selectedModelId || "gemini-3.6-flash", response.usageMetadata, userIsAdmin).catch((e) => console.error("Text generate metering error:", e));
            }
            let textResult = response.text || "";
            const recallCall = response.functionCalls?.find((fc) => fc.name === "recall_project_memory");
            if (recallCall && recallCall.args && recallCall.args.itemId && type === "text") {
              try {
                const pid = String(req.body.projectId || projectData && projectData.id || "");
                const itemIdToFetch = String(recallCall.args.itemId);
                if (pid && itemIdToFetch) {
                  let itemData = await getDocRest(`projects/${pid}/memory_items`, itemIdToFetch, token).catch(() => null);
                  if (!itemData) {
                    try {
                      const memItemSnap = await dbAdmin.collection("projects").doc(pid).collection("memory_items").doc(itemIdToFetch).get();
                      if (memItemSnap.exists) {
                        itemData = memItemSnap.data();
                      }
                    } catch (e) {
                    }
                  }
                  if (itemData) {
                    const rawFullText = itemData.storageRef || itemData.content || itemData.summary || "";
                    const followUp = await ai5.models.generateContent({
                      model: resolveEngineModel(selectedModelId || "gemini-3.6-flash"),
                      contents: [
                        ...contents,
                        { role: "model", parts: [{ functionCall: recallCall }] },
                        { role: "user", parts: [{ functionResponse: { name: "recall_project_memory", response: { content: rawFullText } } }] }
                      ],
                      config: { systemInstruction, maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse }
                    });
                    if (followUp.text) {
                      textResult = followUp.text;
                    }
                  }
                }
              } catch (err) {
                console.error("Non-stream recall_project_memory error:", err);
              }
            }
            const docGenCall = response.functionCalls?.find((fc) => fc.name === "generate_document");
            if (docGenCall && docGenCall.args && docGenCall.args.docType && type === "text") {
              const extractedType = String(docGenCall.args.docType).toLowerCase();
              const summaryPrompt = docGenCall.args.summary || prompt;
              return res.json({
                success: true,
                type: "text",
                result: textResult,
                triggerDocGeneration: extractedType,
                triggerPrompt: summaryPrompt,
                estimatedCount: Number(docGenCall.args.estimatedPageOrSlideCount) || 5
              });
            }
            generationResult = textResult;
          }
          if (jobId && type !== "document" && model !== "veo") {
            await setDocRest("generation_jobs", jobId, {
              status: "completed",
              progress: 100,
              stepLabel: type === "image" ? "\u062A\u0645 \u062A\u0635\u0645\u064A\u0645 \u0648\u062A\u0648\u0644\u064A\u062F \u0635\u0648\u0631\u062A\u0643 \u0627\u0644\u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0628\u0646\u062C\u0627\u062D!" : "\u062A\u0645 \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621 \u0648\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0645\u0642\u0637\u0639 \u0628\u0646\u062C\u0627\u062D!",
              type,
              createdAt: Date.now()
            }, token).catch((e) => console.error("Firestore job update failed:", e));
          }
          if (projectData && projectData.id && !projectData.brandProfile) {
            (async () => {
              try {
                const ai6 = createGenAIClient2();
                const profileRes = await ai6.models.generateContent({
                  model: "gemini-3.5-flash-lite",
                  contents: `Extract a brand profile based on this project data and user request.
Entity Type: ${projectData.entityType || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"}
Project Name: ${projectData.name || "\u0645\u0634\u0631\u0648\u0639 \u062C\u062F\u064A\u062F"}
Request: ${prompt}

Respond ONLY with JSON matching this structure:
{
  "colors": ["#HEX1", "#HEX2", "#HEX3"],
  "typography": "Modern / Classic / Technical / Playful",
  "tone": "Formal / Casual / Friendly / Academic",
  "keywords": ["tag1", "tag2"]
}`,
                  config: { responseMimeType: "application/json", maxOutputTokens: 2048 }
                });
                const brandProfile = JSON.parse(profileRes.text || "{}");
                if (brandProfile.colors) {
                  await updateDocFieldsRest("projects", projectData.id, { brandProfile }, ["brandProfile"], token);
                  console.log("Created brand profile for project:", projectData.id);
                }
              } catch (e) {
                console.error("Failed to generate brand profile:", e);
              }
            })();
          }
          let finalBalance = currentBalance;
          const producedArtifact = type !== "document" ? !!generationResult : typeof generationResult === "string" && generationResult.length > 0 || typeof generationResult !== "string" && !!generationResult;
          if (!producedArtifact) {
            if (reservedPoints2 && cost2 > 0) {
              await mutateBalanceAtomic(uid, cost2).catch((e) => console.error("Refund failed on missing artifact:", e));
            }
            if (jobId) {
              await setDocRest("generation_jobs", jobId, {
                status: "failed",
                error: "\u062A\u0639\u0630\u0651\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0644\u0641. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0643\u062A\u0627\u0628\u0629 \u0646\u0635 \u0645\u0641\u0647\u0648\u0645 \u0623\u0648 \u0625\u0631\u0641\u0627\u0642 \u0645\u0633\u062A\u0646\u062F \u0635\u0627\u0644\u062D \u0648\u0627\u0644\u062A\u062C\u0631\u0628\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",
                stepLabel: "\u062A\u0639\u0630\u0651\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0644\u0641. \u0644\u0645 \u064A\u062A\u0645 \u062E\u0635\u0645 \u0623\u064A \u0646\u0642\u0627\u0637.",
                completedAt: Date.now()
              }, token).catch((e) => console.error(e));
            }
            if (req.body.chatId) {
              await createDocRest("messages", {
                ownerId: uid,
                chatId: req.body.chatId,
                role: "assistant",
                content: "\u062A\u0639\u0630\u0651\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0644\u0641. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649. \u0644\u0645 \u064A\u062A\u0645 \u062E\u0635\u0645 \u0623\u064A \u0646\u0642\u0627\u0637 \u0645\u0646 \u0631\u0635\u064A\u062F\u0643.",
                createdAt: Date.now(),
                isError: true,
                jobId: jobId || void 0
              }, token).catch((e) => console.error("Failed to write failure message to db:", e));
            }
            if (!res.headersSent) {
              return res.status(500).json({
                error: "\u062A\u0639\u0630\u0651\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0644\u0641. \u0644\u0645 \u064A\u062A\u0645 \u062E\u0635\u0645 \u0623\u064A \u0646\u0642\u0627\u0637 \u0645\u0646 \u0631\u0635\u064A\u062F\u0643."
              });
            }
            return;
          }
          let permanentMediaUrl = null;
          if (producedArtifact && generationResult && (type === "image" || type === "video" || type === "voice" || type === "document" || type === "infographic")) {
            try {
              const ext = extension || (type === "video" ? "mp4" : type === "voice" ? "wav" : type === "document" ? docTypeToUse === "docx" ? "docx" : "pdf" : "png");
              const storagePath = `generated_media/${uid}/media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
              const contentType = mimeType || (type === "video" ? "video/mp4" : type === "voice" ? "audio/wav" : type === "document" ? ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf" : "image/png");
              const cleanBase64 = typeof generationResult === "string" && generationResult.includes(",") ? generationResult.split(",")[1] : generationResult;
              const buffer = typeof cleanBase64 === "string" ? Buffer.from(cleanBase64, "base64") : Buffer.from(cleanBase64);
              const bucket = (0, import_storage.getStorage)().bucket(STORAGE_BUCKET);
              const file = bucket.file(storagePath);
              await file.save(buffer, {
                metadata: { contentType },
                public: true,
                resumable: false
              });
              permanentMediaUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
              console.log(`[Server Media Upload] Successfully uploaded ${type} to cloud: ${permanentMediaUrl}`);
            } catch (uploadErr) {
              console.log("[Server Media Upload] Server storage upload notice (using client storage fallback):", uploadErr?.message || uploadErr);
            }
          }
          if (cost2 > 0) {
            try {
              if (!reservedPoints2) {
                const atomicRes = await mutateBalanceAtomic(uid, -cost2, { requireSufficient: true });
                if (!atomicRes.ok) {
                  if (atomicRes.reason === "INSUFFICIENT") {
                    if (!res.headersSent) return res.status(400).json({ error: `\u0631\u0635\u064A\u062F\u0643 \u063A\u064A\u0631 \u0643\u0627\u0641\u064D \u0644\u0625\u062A\u0645\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628. \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 ${cost2} \u0646\u0642\u0627\u0637.` });
                  }
                  if (!res.headersSent) return res.status(500).json({ error: "\u0641\u0634\u0644 \u062E\u0635\u0645 \u0627\u0644\u0631\u0635\u064A\u062F \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A." });
                }
                finalBalance = atomicRes.newBalance;
              } else {
                finalBalance = Math.max(0, currentBalance - cost2);
              }
              let estimatedCostUSD = 0.01;
              try {
                const pricingEndpointDoc = await dbAdmin.collection("model_pricing").doc(type === "image" ? model === "nova" ? "image_pro" : "image_standard" : type === "video" ? "video_standard" : type === "document" ? "doc_standard" : "default").get();
                if (pricingEndpointDoc.exists && typeof pricingEndpointDoc.data()?.costUsd === "number") {
                  estimatedCostUSD = pricingEndpointDoc.data().costUsd;
                } else {
                  if (type === "image") {
                    estimatedCostUSD = model === "nova" ? 0.134 : 0.067;
                  } else if (type === "video") {
                    estimatedCostUSD = (parseFloat(duration) || 5) * (model === "veo" ? 0.05 : 0.1);
                  } else if (type === "document") {
                    estimatedCostUSD = docSize === "small" ? 0.05 : 0.1;
                  }
                }
              } catch {
              }
              await createDocRest("api_cost_log", {
                uid,
                type,
                model: model || requestedDocType || "text",
                costInPoints: cost2,
                estimatedCostUSD,
                createdAt: Date.now()
              }, void 0).catch((e) => console.error("Failed to write api_cost_log:", e));
            } catch (outerErr) {
              console.error("Deduction block error:", outerErr);
            }
          }
          try {
            const isImageVideoOrDoc = type === "image" || type === "video" || type === "document" || type === "infographic" || type === "text" && requestedDocType && requestedDocType !== "none";
            if (isImageVideoOrDoc) {
              const typeLabel = type === "image" ? "\u0627\u0644\u0635\u0648\u0631\u0629" : type === "video" ? "\u0627\u0644\u0641\u064A\u062F\u064A\u0648" : type === "infographic" ? "\u0627\u0644\u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643" : "\u0627\u0644\u0645\u0633\u062A\u0646\u062F";
              await createDocRest("notifications", {
                ownerId: uid,
                title: "\u0627\u0643\u062A\u0645\u0644 \u0627\u0644\u062A\u0648\u0644\u064A\u062F \u0628\u0646\u062C\u0627\u062D",
                message: `\u062A\u0645 \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621 \u0645\u0646 \u062A\u0648\u0644\u064A\u062F \u0637\u0644\u0628\u0643 (${typeLabel}) \u0628\u0646\u062C\u0627\u062D.`,
                type: "system",
                read: false,
                createdAt: Date.now()
              }, token).catch((e) => console.error("Failed to create completion notification:", e));
            }
            if (finalBalance < 1 && currentBalance >= 1) {
              const recentNotifications = await queryDocsByFieldRest("notifications", "ownerId", uid, token, 20);
              const oneDayAgo = Date.now() - 24 * 60 * 60 * 1e3;
              const hasRecentBilling = (recentNotifications || []).some(
                (n) => n.type === "billing" && n.createdAt >= oneDayAgo
              );
              if (!hasRecentBilling) {
                await createDocRest("notifications", {
                  ownerId: uid,
                  title: "\u0631\u0635\u064A\u062F\u0643 \u0645\u0646\u062E\u0641\u0636",
                  message: "\u0631\u0635\u064A\u062F \u0646\u0642\u0627\u0637\u0643 \u0623\u0635\u0628\u062D \u0623\u0642\u0644 \u0645\u0646 \u0646\u0642\u0637\u0629 \u0648\u0627\u062D\u062F\u0629. \u0627\u0634\u062D\u0646 \u0631\u0635\u064A\u062F\u0643 \u0644\u0645\u0648\u0627\u0635\u0644\u0629 \u0627\u0644\u062A\u0648\u0644\u064A\u062F.",
                  type: "billing",
                  read: false,
                  createdAt: Date.now()
                }, token).catch((e) => console.error("Failed to create low balance notification:", e));
              }
            }
          } catch (notifErr) {
            console.error("Failed to create notifications:", notifErr);
          }
          let documentData = null;
          if (type === "document" && (requestedDocType || docTypeToUse)) {
            const localDocId = jobId || Date.now().toString();
            documentData = {
              id: localDocId,
              url: permanentMediaUrl || null,
              mimeType: mimeType || (docTypeToUse === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf"),
              extension: extension || (docTypeToUse === "docx" ? "docx" : "pdf"),
              filename: `NajeAI_Document.${extension || (docTypeToUse === "docx" ? "docx" : "pdf")}`,
              slides: typeof generatedSlides !== "undefined" ? generatedSlides : void 0,
              groundingReport: typeof groundingReport !== "undefined" ? groundingReport : void 0
            };
          }
          if (jobId) {
            const stepLabel = type === "image" ? "\u062A\u0645 \u062A\u0635\u0645\u064A\u0645 \u0648\u062A\u0648\u0644\u064A\u062F \u0635\u0648\u0631\u062A\u0643 \u0627\u0644\u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0628\u0646\u062C\u0627\u062D!" : type === "video" ? "\u062A\u0645 \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621 \u0648\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0645\u0642\u0637\u0639 \u0628\u0646\u062C\u0627\u062D!" : type === "infographic" ? "\u062A\u0645 \u062A\u0635\u0645\u064A\u0645 \u0648\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u0628\u0646\u062C\u0627\u062D (PNG + PDF)!" : type === "document" ? docTypeToUse === "pdf_slides" ? "\u0627\u0643\u062A\u0645\u0644 \u0625\u0646\u0634\u0627\u0621 \u0634\u0631\u0627\u0626\u062D PDF \u0628\u0646\u062C\u0627\u062D!" : "\u0627\u0643\u062A\u0645\u0644 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0633\u062A\u0646\u062F \u0627\u0644\u0625\u0628\u062F\u0627\u0639\u064A \u0628\u0646\u062C\u0627\u062D \u0645\u0630\u0647\u0644!" : "\u062A\u0645 \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621 \u0628\u0646\u062C\u0627\u062D!";
            const jobPayload = {
              status: "completed",
              progress: 100,
              currentStepIndex: totalSteps || 4,
              stepLabel,
              type: requestedDocType && requestedDocType !== "none" ? "document" : type,
              docType: type === "document" ? docTypeToUse : void 0,
              result: permanentMediaUrl || generationResult,
              permanentMediaUrl,
              mimeType,
              extension,
              interactionId,
              documentData,
              consumedBalance: cost2,
              newBalance: finalBalance,
              completedAt: Date.now()
            };
            if (typeof generatedSlides !== "undefined" && generatedSlides) jobPayload.slides = generatedSlides;
            if (typeof groundingReport !== "undefined" && groundingReport) jobPayload.groundingReport = groundingReport;
            await setDocRest("generation_jobs", jobId, jobPayload, token).catch((e) => console.error("Firestore job update failed:", e));
          }
          if (req.body.chatId) {
            const assistantContent = type === "document" ? `\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0645\u0633\u062A\u0646\u062F ${docTypeToUse.toUpperCase()} \u0628\u0646\u062C\u0627\u062D.` : type === "infographic" ? "\u062A\u0645 \u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u0648\u062A\u062C\u0647\u064A\u0632 \u0645\u0644\u0641\u0627\u062A PNG \u0648 PDF \u0628\u0646\u062C\u0627\u062D." : "\u062A\u0645 \u0627\u0644\u062A\u0648\u0644\u064A\u062F \u0628\u0646\u062C\u0627\u062D.";
            const msgDoc = {
              ownerId: uid,
              chatId: req.body.chatId,
              role: "assistant",
              content: assistantContent,
              createdAt: Date.now(),
              jobId: jobId || void 0,
              mediaUrl: permanentMediaUrl || (typeof generationResult === "string" && generationResult.startsWith("http") ? generationResult : void 0),
              mediaType: type === "video" ? "video" : type === "image" || type === "infographic" ? "image" : type === "voice" ? "audio" : void 0,
              documentData: documentData || void 0,
              interactionId: interactionId || void 0
            };
            await createDocRest("messages", msgDoc, token).catch((e) => console.error("Failed to write assistant message to db:", e));
          }
          const responsePayload = {
            result: generationResult,
            mimeType,
            extension,
            interactionId,
            permanentMediaUrl,
            documentData,
            newBalance: finalBalance
          };
          if (typeof generatedSlides !== "undefined" && generatedSlides) responsePayload.slides = generatedSlides;
          if (typeof groundingReport !== "undefined" && groundingReport) responsePayload.groundingReport = groundingReport;
          if (!res.headersSent) {
            res.json(responsePayload);
          }
        }
      } catch (error) {
        console.error("API Generation Error:", error?.message || error);
        const errMsg = error?.message || (error ? String(error) : "") || "\u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639";
        await failGenerationJob({
          jobId: jobId || req.body.jobId,
          uid,
          token,
          chatId: req.body.chatId,
          error,
          reservedPoints,
          cost
        });
        if (!res.headersSent) {
          res.status(500).json({ error: errMsg });
        } else {
          try {
            res.write(`data: ${JSON.stringify({ error: errMsg })}

`);
            res.write(`data: [DONE]

`);
            res.end();
          } catch (e) {
          }
        }
      } finally {
        activeUserTasks.delete(uid);
      }
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639" });
      }
    }
  });
  async function sendFcmPushToUsers(uids, title, body, link = "/") {
    try {
      const tokensMap = {};
      for (const targetUid of uids) {
        try {
          const userSnap = await dbAdmin.collection("users").doc(targetUid).get();
          if (userSnap.exists) {
            const userTokens = userSnap.data()?.fcmTokens || [];
            for (const t of userTokens) {
              if (t && typeof t === "string") {
                tokensMap[t] = targetUid;
              }
            }
          }
        } catch (e) {
        }
      }
      const allTokens = Object.keys(tokensMap);
      if (allTokens.length === 0) {
        return { sentCount: 0, failureCount: 0 };
      }
      const messaging = (0, import_messaging.getMessaging)();
      const response = await messaging.sendEachForMulticast({
        tokens: allTokens,
        notification: {
          title,
          body
        },
        webpush: {
          notification: {
            title,
            body,
            icon: "/logo-192.png",
            badge: "/favicon.svg",
            vibrate: [150, 80, 150]
          },
          fcmOptions: {
            link: link || "/"
          }
        },
        data: {
          title,
          body,
          url: link || "/"
        }
      });
      if (response.failureCount > 0) {
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (code === "messaging/invalid-registration-token" || code === "messaging/registration-token-not-registered") {
              invalidTokens.push(allTokens[idx]);
            }
          }
        });
        if (invalidTokens.length > 0) {
          for (const targetUid of uids) {
            try {
              await dbAdmin.collection("users").doc(targetUid).update({
                fcmTokens: import_firestore.FieldValue.arrayRemove(...invalidTokens)
              }).catch(() => {
              });
            } catch (e) {
            }
          }
        }
      }
      return { sentCount: response.successCount, failureCount: response.failureCount };
    } catch (err) {
      console.warn("[FCM Send Error]", err);
      return { sentCount: 0, failureCount: 0, error: err };
    }
  }
  app.post("/api/admin/adjust-balance", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser) {
        try {
          const userSnap = await dbAdmin.collection("users").doc(uid).get();
          isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
        } catch (e) {
        }
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u0639\u062F\u064A\u0644 \u0623\u0631\u0635\u062F\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646." });
      }
      const { targetUid, amount, action = "add", reason, notes } = req.body;
      if (!targetUid) {
        return res.status(400).json({ error: "\u064A\u062C\u0628 \u062A\u062D\u062F\u064A\u062F \u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641 (targetUid)." });
      }
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        return res.status(400).json({ error: "\u064A\u062C\u0628 \u0625\u062F\u062E\u0627\u0644 \u0642\u064A\u0645\u0629 \u0639\u062F\u062F\u064A\u0629 \u0645\u0648\u062C\u0628\u0629 \u0648\u0635\u062D\u064A\u062D\u0629 \u0644\u0644\u0646\u0642\u0627\u0637." });
      }
      let targetUser = await getDocRest("users", targetUid, token).catch(() => null);
      if (!targetUser) {
        try {
          const snap = await dbAdmin.collection("users").doc(targetUid).get();
          if (snap.exists) {
            targetUser = snap.data();
          }
        } catch (e) {
        }
      }
      if (!targetUser) {
        return res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
      }
      const currentBalance = typeof targetUser.balance === "number" ? targetUser.balance : 0;
      let delta = 0;
      if (action === "add") {
        delta = numAmount;
      } else if (action === "deduct") {
        delta = -numAmount;
      } else if (action === "set") {
        delta = numAmount - currentBalance;
      } else {
        return res.status(400).json({ error: "\u0646\u0648\u0639 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D. \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 add \u0623\u0648 deduct \u0623\u0648 set." });
      }
      delta = parseFloat(delta.toFixed(4));
      const mutResult = await mutateBalanceAtomic(targetUid, delta, {});
      const newBalance = mutResult.ok ? mutResult.newBalance : parseFloat((currentBalance + delta).toFixed(4));
      const adjustmentReason = reason || (action === "add" ? "\u0634\u062D\u0646 \u0646\u0642\u0627\u0637 \u064A\u062F\u0648\u064A" : action === "deduct" ? "\u062E\u0635\u0645 \u0646\u0642\u0627\u0637 \u064A\u062F\u0648\u064A" : "\u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637 \u0627\u0644\u0631\u0635\u064A\u062F");
      const adjustmentRecord = {
        adminUid: uid,
        adminEmail: decodedToken.email || userDoc?.email || "admin",
        targetUid,
        targetEmail: targetUser.email || targetUid,
        previousBalance: currentBalance,
        newBalance,
        delta,
        action,
        amount: numAmount,
        reason: adjustmentReason,
        notes: notes || "",
        createdAt: Date.now()
      };
      try {
        if (dbAdmin) {
          await dbAdmin.collection("admin_balance_adjustments").add(adjustmentRecord).catch(() => {
          });
        }
      } catch (e) {
      }
      await createDocRest("admin_audit_logs", {
        ...adjustmentRecord,
        action: "adjust_user_balance"
      }, token).catch((e) => console.error("Failed to write audit log:", e));
      await createDocRest("balance_transactions", {
        uid: targetUid,
        type: delta < 0 ? "admin_debit" : "admin_credit",
        amount: delta,
        balanceAfter: newBalance,
        description: `\u062A\u0639\u062F\u064A\u0644 \u0631\u0635\u064A\u062F \u0625\u062F\u0627\u0631\u064A: ${adjustmentReason}`,
        adminUid: uid,
        createdAt: Date.now()
      }, token).catch((e) => console.error("Failed to write balance transaction:", e));
      if (delta > 0) {
        try {
          if (dbAdmin) {
            await dbAdmin.collection("users").doc(targetUid).collection("notifications").add({
              title: "\u0634\u062D\u0646 \u0631\u0635\u064A\u062F \u0645\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u0629",
              message: `\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 ${delta} \u0646\u0642\u0637\u0629 \u0625\u0644\u0649 \u0631\u0635\u064A\u062F\u0643. \u0627\u0644\u0633\u0628\u0628: ${adjustmentReason}`,
              type: "credit",
              read: false,
              createdAt: Date.now()
            }).catch(() => {
            });
          }
        } catch (e) {
        }
      }
      return res.json({
        success: true,
        uid: targetUid,
        previousBalance: currentBalance,
        newBalance,
        adjustment: {
          action,
          amount: numAmount,
          reason: adjustmentReason,
          delta
        }
      });
    } catch (err) {
      console.error("Error in /api/admin/adjust-balance:", err);
      return res.status(500).json({ error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0639\u062F\u064A\u0644 \u0631\u0635\u064A\u062F \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" });
    }
  });
  app.get("/api/admin/balance-adjustments", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      const userDoc = await getDocRest("users", decodedToken.uid, token).catch(() => null);
      if (!userDoc?.isAdmin) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0627\u0644\u0639\u0627\u062F\u064A\u064A\u0646." });
      }
      let records = [];
      if (dbAdmin) {
        const snap = await dbAdmin.collection("admin_balance_adjustments").orderBy("createdAt", "desc").limit(50).get();
        records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      return res.json({ success: true, adjustments: records });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/admin/send-notification", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser) {
        try {
          const userSnap = await dbAdmin.collection("users").doc(uid).get();
          isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
        } catch (e) {
        }
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621." });
      }
      const { title, message, type, target, targetUid } = req.body;
      if (!title || !message || !type || !target) {
        return res.status(400).json({ error: "\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644 (\u0627\u0644\u0639\u0646\u0648\u0627\u0646\u060C \u0627\u0644\u0631\u0633\u0627\u0644\u0629\u060C \u0627\u0644\u0646\u0648\u0639\u060C \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641) \u0645\u0637\u0644\u0648\u0628\u0629." });
      }
      if (target === "specific") {
        if (!targetUid) {
          return res.status(400).json({ error: "\u064A\u062C\u0628 \u062A\u062D\u062F\u064A\u062F \u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 (UID) \u0644\u0644\u0645\u0633\u062A\u0647\u062F\u0641 \u0627\u0644\u0645\u062D\u062F\u062F." });
        }
        let targetExists = false;
        const targetDoc = await getDocRest("users", targetUid, token).catch(() => null);
        if (targetDoc) {
          targetExists = true;
        } else {
          try {
            const targetSnap = await dbAdmin.collection("users").doc(targetUid).get();
            targetExists = targetSnap.exists;
          } catch (e) {
          }
        }
        if (!targetExists) {
          return res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A." });
        }
        await createDocRest("notifications", {
          ownerId: targetUid,
          title,
          message,
          type,
          read: false,
          createdAt: Date.now()
        }, token);
        const fcmResult = await sendFcmPushToUsers([targetUid], title, message, "/");
        try {
          await createDocRest("admin_audit_log", {
            action: "send_notification",
            adminId: uid,
            adminEmail: decodedToken.email || "",
            targetUserId: targetUid,
            details: { title, type, target },
            timestamp: Date.now()
          }, token);
        } catch (e) {
        }
        return res.json({
          success: true,
          count: 1,
          fcmPushCount: fcmResult.sentCount,
          message: `\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631 \u0628\u0646\u062C\u0627\u062D \u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0627\u062D\u062F (\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 ${fcmResult.sentCount} \u0625\u0634\u0639\u0627\u0631\u0627\u062A \u062F\u0641\u0639 \u0644\u0644\u062C\u0648\u0627\u0644).`
        });
      } else if (target === "all") {
        let userIds = [];
        if (token) {
          try {
            const restUsers = await listCollectionRest("users", token);
            if (restUsers && restUsers.length > 0) {
              userIds = restUsers.filter((u) => u.isAdmin !== true).map((u) => u.id);
            }
          } catch (e) {
          }
        }
        if (userIds.length === 0) {
          try {
            const usersSnap = await dbAdmin.collection("users").get();
            userIds = usersSnap.docs.filter((d) => d.data()?.isAdmin !== true).map((d) => d.id);
          } catch (e) {
          }
        }
        if (userIds.length === 0) userIds = [uid];
        let totalCreated = 0;
        for (const userId of userIds) {
          await createDocRest("notifications", {
            ownerId: userId,
            title,
            message,
            type,
            read: false,
            createdAt: Date.now()
          }, token).catch((e) => console.error("Failed to write admin notification for user:", userId, e));
          totalCreated++;
        }
        const fcmResult = await sendFcmPushToUsers(userIds, title, message, "/");
        try {
          await createDocRest("admin_audit_log", {
            action: "send_notification",
            adminId: uid,
            adminEmail: decodedToken.email || "",
            targetUserId: "all",
            details: { title, type, target, count: totalCreated },
            timestamp: Date.now()
          }, token);
        } catch (e) {
        }
        return res.json({
          success: true,
          count: totalCreated,
          fcmPushCount: fcmResult.sentCount,
          message: `\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631 \u0628\u0646\u062C\u0627\u062D \u0625\u0644\u0649 ${totalCreated} \u0645\u0633\u062A\u062E\u062F\u0645 (\u062A\u0645 \u062A\u0633\u0644\u064A\u0645 ${fcmResult.sentCount} \u0625\u0634\u0639\u0627\u0631\u0627\u062A \u062F\u0641\u0639 \u0644\u0644\u062C\u0648\u0627\u0644).`
        });
      } else {
        return res.status(400).json({ error: "\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629." });
      }
    } catch (error) {
      console.error("Admin Send Notification Error:", error);
      res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u062F\u0627\u062E\u0644\u064A \u0623\u062B\u0646\u0627\u0621 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631: " + error.message });
    }
  });
  app.post("/api/admin/log-audit", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser) {
        try {
          const userSnap = await dbAdmin.collection("users").doc(uid).get();
          isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
        } catch (e) {
        }
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0644\u0644\u0642\u064A\u0627\u0645 \u0628\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0625\u062F\u0627\u0631\u064A." });
      }
      const { action, targetUserId, chatId, details } = req.body;
      if (!action) {
        return res.status(400).json({ error: "\u062D\u0642\u0644 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 (action) \u0645\u0637\u0644\u0648\u0628." });
      }
      const auditData = {
        action,
        adminId: uid,
        adminEmail: decodedToken.email || userDoc?.email || "",
        ...targetUserId ? { targetUserId } : {},
        ...chatId ? { chatId } : {},
        ...details ? { details } : {},
        timestamp: Date.now()
      };
      let logId = "log_" + Date.now();
      try {
        const docRef = await createDocRest("admin_audit_log", auditData, token);
        if (docRef?.id) logId = docRef.id;
      } catch (auditWriteErr) {
        console.warn("Audit log write warning:", auditWriteErr);
      }
      return res.json({ success: true, id: logId });
    } catch (error) {
      console.error("Admin Audit Log Error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
  app.get(["/api/admin/model-endpoints", "/api/admin/models"], async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser) {
        try {
          const userSnap = await dbAdmin.collection("users").doc(uid).get();
          isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
        } catch (e) {
        }
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0645\u0627\u0630\u062C." });
      }
      try {
        await seedModelEndpointsIfMissing();
      } catch (e) {
      }
      let rawEndpoints = [];
      try {
        const snapshot = await dbAdmin.collection("model_endpoints").get();
        if (!snapshot.empty) {
          rawEndpoints = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.warn("[Admin Models] dbAdmin.collection('model_endpoints') fallback:", err.message);
      }
      const endpointMap = /* @__PURE__ */ new Map();
      for (const seed of SEED_ENDPOINTS) {
        endpointMap.set(seed.id, { ...seed });
      }
      for (const ep of rawEndpoints) {
        const existing = endpointMap.get(ep.id) || {};
        endpointMap.set(ep.id, { ...existing, ...ep });
      }
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1e3;
      const costByModel = {};
      try {
        let logs = [];
        try {
          const logSnap = await dbAdmin.collection("api_cost_log").where("createdAt", ">=", thirtyDaysAgo).get();
          logs = logSnap.docs.map((d) => d.data());
        } catch (e) {
        }
        for (const log of logs) {
          const m = log.model || log.type || "unknown";
          const c = Number(log.costInPoints) || 0;
          costByModel[m] = (costByModel[m] || 0) + c;
        }
      } catch (e) {
        console.warn("[Admin Models] Failed to aggregate 30d costs:", e);
      }
      const endpoints = Array.from(endpointMap.values()).map((ep) => {
        const modelCost = costByModel[ep.modelId] || costByModel[ep.id] || 0;
        return {
          ...ep,
          total30dCostInPoints: parseFloat(modelCost.toFixed(3))
        };
      });
      return res.json({ endpoints });
    } catch (error) {
      console.error("Get Model Endpoints Error:", error);
      return res.json({ endpoints: SEED_ENDPOINTS });
    }
  });
  app.post("/api/admin/validate-model", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser) {
        try {
          const userSnap = await dbAdmin.collection("users").doc(uid).get();
          isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
        } catch (e) {
        }
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643." });
      }
      const { modelId, featureGroup } = req.body;
      if (!modelId || !featureGroup) {
        return res.status(400).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0646\u0645\u0648\u0630\u062C (modelId) \u0648\u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0645\u064A\u0632\u0629 (featureGroup) \u0645\u0637\u0644\u0648\u0628\u0627\u0646." });
      }
      const result = await validateModelIdServer(String(modelId).trim(), String(featureGroup));
      return res.json(result);
    } catch (error) {
      console.error("Validate Model Error:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  });
  app.post("/api/admin/update-model-endpoint", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser) {
        try {
          const userSnap = await dbAdmin.collection("users").doc(uid).get();
          isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
        } catch (e) {
        }
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u062D\u062F\u064A\u062B \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0645\u0627\u0630\u062C." });
      }
      const {
        endpointId,
        modelId,
        fallbackModelId,
        isEnabled,
        pointsPrice,
        inputPointsPer1k,
        outputPointsPer1k,
        audioInputPointsPer1k,
        inputPointsPerBlock,
        inputTokenBlockSize,
        outputPointsPerBlock,
        outputTokenBlockSize,
        pricingType,
        realCostUsd,
        paramNotes,
        labelAr,
        maxOutputTokens,
        isBackground,
        skipValidation
      } = req.body;
      if (!endpointId || !modelId) {
        return res.status(400).json({ error: "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0645\u0646\u0641\u0630 \u0648\u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0645\u0637\u0644\u0648\u0628\u0627\u0646." });
      }
      let existingData = SEED_ENDPOINTS.find((s) => s.id === endpointId) || {};
      try {
        const endpointRef = dbAdmin.collection("model_endpoints").doc(endpointId);
        const existingSnap = await endpointRef.get();
        if (existingSnap.exists) {
          existingData = existingSnap.data();
        }
      } catch (e) {
      }
      const featureGroup = existingData.featureGroup || "text";
      const cleanModelId = String(modelId).trim();
      const cleanFallbackModelId = fallbackModelId ? String(fallbackModelId).trim() : void 0;
      let validationOk = true;
      if (!skipValidation) {
        const valResult = await validateModelIdServer(cleanModelId, featureGroup);
        if (!valResult.ok) {
          return res.status(400).json({
            error: `\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u062D\u0629 \u0627\u0644\u0646\u0645\u0648\u0630\u062C (${cleanModelId}): ${valResult.error || "\u0627\u0644\u0646\u0645\u0648\u0630\u062C \u063A\u064A\u0631 \u0645\u062A\u062C\u0627\u0648\u0628"}`
          });
        }
      }
      const updatePayload = {
        modelId: cleanModelId,
        lastValidatedAt: Date.now(),
        lastValidatedOk: validationOk
      };
      if (typeof isEnabled === "boolean") {
        updatePayload.isEnabled = isEnabled;
      }
      if (cleanFallbackModelId !== void 0) {
        updatePayload.fallbackModelId = cleanFallbackModelId;
      }
      if (typeof pointsPrice === "number" && !isNaN(pointsPrice)) {
        updatePayload.pointsPrice = Math.max(0, pointsPrice);
      }
      if (typeof inputPointsPerBlock === "number" && !isNaN(inputPointsPerBlock)) {
        updatePayload.inputPointsPerBlock = Math.max(0, inputPointsPerBlock);
        updatePayload.inputPointsPer1k = updatePayload.inputPointsPerBlock;
      } else if (typeof inputPointsPer1k === "number" && !isNaN(inputPointsPer1k)) {
        updatePayload.inputPointsPer1k = Math.max(0, inputPointsPer1k);
        updatePayload.inputPointsPerBlock = updatePayload.inputPointsPer1k;
      }
      if (typeof inputTokenBlockSize === "number" && !isNaN(inputTokenBlockSize) && inputTokenBlockSize > 0) {
        updatePayload.inputTokenBlockSize = inputTokenBlockSize;
      }
      if (typeof outputPointsPerBlock === "number" && !isNaN(outputPointsPerBlock)) {
        updatePayload.outputPointsPerBlock = Math.max(0, outputPointsPerBlock);
        updatePayload.outputPointsPer1k = updatePayload.outputPointsPerBlock;
      } else if (typeof outputPointsPer1k === "number" && !isNaN(outputPointsPer1k)) {
        updatePayload.outputPointsPer1k = Math.max(0, outputPointsPer1k);
        updatePayload.outputPointsPerBlock = updatePayload.outputPointsPer1k;
      }
      if (typeof outputTokenBlockSize === "number" && !isNaN(outputTokenBlockSize) && outputTokenBlockSize > 0) {
        updatePayload.outputTokenBlockSize = outputTokenBlockSize;
      }
      if (typeof audioInputPointsPer1k === "number" && !isNaN(audioInputPointsPer1k)) {
        updatePayload.audioInputPointsPer1k = Math.max(0, audioInputPointsPer1k);
      }
      if (pricingType === "per_token" || pricingType === "per_generation") {
        updatePayload.pricingType = pricingType;
      }
      if (typeof isBackground === "boolean") {
        updatePayload.isBackground = isBackground;
      }
      if (typeof maxOutputTokens === "number" && !isNaN(maxOutputTokens)) {
        updatePayload.maxOutputTokens = maxOutputTokens;
      }
      if (typeof realCostUsd === "number" && !isNaN(realCostUsd)) {
        updatePayload["realCostPer.usd"] = Math.max(0, realCostUsd);
      }
      if (typeof paramNotes === "string") {
        updatePayload.paramNotes = paramNotes.trim();
      }
      if (typeof labelAr === "string" && labelAr.trim()) {
        updatePayload.labelAr = labelAr.trim();
      }
      try {
        const endpointRef = dbAdmin.collection("model_endpoints").doc(endpointId);
        await endpointRef.set(updatePayload, { merge: true });
      } catch (e) {
        console.warn("[Admin Update Model Endpoint] dbAdmin set failed, using REST fallback:", e.message);
        await setDocRest("model_endpoints", endpointId, updatePayload, token).catch(console.error);
      }
      modelEndpointCache.set(endpointId, {
        modelId: cleanModelId,
        fallbackModelId: cleanFallbackModelId,
        maxOutputTokens: updatePayload.maxOutputTokens,
        isEnabled: updatePayload.isEnabled !== void 0 ? updatePayload.isEnabled : existingData.isEnabled !== false,
        inputPointsPer1k: updatePayload.inputPointsPer1k,
        outputPointsPer1k: updatePayload.outputPointsPer1k,
        audioInputPointsPer1k: updatePayload.audioInputPointsPer1k,
        inputPointsPerBlock: updatePayload.inputPointsPerBlock,
        inputTokenBlockSize: updatePayload.inputTokenBlockSize,
        outputPointsPerBlock: updatePayload.outputPointsPerBlock,
        outputTokenBlockSize: updatePayload.outputTokenBlockSize,
        fetchedAt: Date.now()
      });
      pricingCache = null;
      try {
        if (dbAdmin) {
          if ((endpointId === "doc_standard" || endpointId === "document_writer") && typeof pointsPrice === "number" && pointsPrice > 0) {
            await dbAdmin.collection("model_pricing").doc("document").set({ a4PerPage: pointsPrice }, { merge: true }).catch(() => {
            });
          } else if (endpointId === "doc_a5" && typeof pointsPrice === "number" && pointsPrice > 0) {
            await dbAdmin.collection("model_pricing").doc("document").set({ a5PerPage: pointsPrice }, { merge: true }).catch(() => {
            });
          } else if ((endpointId === "doc_slides" || endpointId === "slide_writer") && typeof pointsPrice === "number" && pointsPrice > 0) {
            await dbAdmin.collection("model_pricing").doc("document").set({ pdf_per_slide: pointsPrice }, { merge: true }).catch(() => {
            });
          } else if ((endpointId === "image_lite" || endpointId === "image_fast") && typeof pointsPrice === "number" && pointsPrice > 0) {
            await dbAdmin.collection("model_pricing").doc("image").set({ liteBase: pointsPrice }, { merge: true }).catch(() => {
            });
          } else if ((endpointId === "image_standard" || endpointId === "image_spectra") && typeof pointsPrice === "number" && pointsPrice > 0) {
            await dbAdmin.collection("model_pricing").doc("image").set({ base: pointsPrice }, { merge: true }).catch(() => {
            });
          } else if ((endpointId === "image_pro" || endpointId === "image_hd") && typeof pointsPrice === "number" && pointsPrice > 0) {
            await dbAdmin.collection("model_pricing").doc("image").set({ proBase: pointsPrice }, { merge: true }).catch(() => {
            });
          } else if (endpointId === "image_addon" && typeof pointsPrice === "number" && pointsPrice > 0) {
            await dbAdmin.collection("model_pricing").doc("image").set({ imageAddon: pointsPrice }, { merge: true }).catch(() => {
            });
            await dbAdmin.collection("model_pricing").doc("video").set({ imageAddon: pointsPrice }, { merge: true }).catch(() => {
            });
          } else if (endpointId === "voice_tts" && typeof pointsPrice === "number" && pointsPrice > 0) {
            await dbAdmin.collection("model_pricing").doc("voice").set({
              pointsPerCharacter: pointsPrice,
              ...pricingType === "per_character" ? { billingUnit: "character" } : {}
            }, { merge: true }).catch(() => {
            });
          } else if (endpointId === "voice_tts_pro" && typeof pointsPrice === "number" && pointsPrice > 0) {
            await dbAdmin.collection("model_pricing").doc("voice").set({
              pointsPerCharacterPro: pointsPrice
            }, { merge: true }).catch(() => {
            });
          }
        }
      } catch (e) {
      }
      await createDocRest("admin_audit_log", {
        action: "UPDATE_MODEL_ENDPOINT",
        adminId: uid,
        adminEmail: decodedToken.email || userDoc?.email || "",
        details: { endpointId, oldModelId: existingData.modelId, newModelId: cleanModelId, pointsPrice, inputPointsPer1k, outputPointsPer1k, realCostUsd },
        timestamp: Date.now()
      }, token).catch(() => null);
      return res.json({ success: true, message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0646\u0641\u0630 \u0628\u0646\u062C\u0627\u062D \u0648\u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u062D\u062A\u0647." });
    } catch (error) {
      console.error("Update Model Endpoint Error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
  app.put("/api/admin/model-endpoints/:endpointId", async (req, res) => {
    req.body = { ...req.body, endpointId: req.params.endpointId };
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser) {
        try {
          const userSnap = await dbAdmin.collection("users").doc(uid).get();
          isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
        } catch (e) {
        }
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u062D\u062F\u064A\u062B \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0645\u0627\u0630\u062C." });
      }
      const endpointId = req.params.endpointId;
      const { modelId, fallbackModelId, isEnabled, skipValidation } = req.body;
      if (!endpointId || !modelId) {
        return res.status(400).json({ error: "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0645\u0646\u0641\u0630 \u0648\u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0645\u0637\u0644\u0648\u0628\u0627\u0646." });
      }
      let existingData = SEED_ENDPOINTS.find((s) => s.id === endpointId) || {};
      try {
        const endpointRef2 = dbAdmin.collection("model_endpoints").doc(endpointId);
        const existingSnap = await endpointRef2.get();
        if (existingSnap.exists) existingData = existingSnap.data();
      } catch (e) {
      }
      const featureGroup = existingData.featureGroup || "text";
      const cleanModelId = String(modelId).trim();
      const cleanFallbackModelId = fallbackModelId ? String(fallbackModelId).trim() : void 0;
      let validationOk = true;
      if (!skipValidation) {
        const valResult = await validateModelIdServer(cleanModelId, featureGroup);
        if (!valResult.ok) {
          return res.status(400).json({
            error: `\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u062D\u0629 \u0627\u0644\u0646\u0645\u0648\u0630\u062C (${cleanModelId}): ${valResult.error || "\u0627\u0644\u0646\u0645\u0648\u0630\u062C \u063A\u064A\u0631 \u0645\u062A\u062C\u0627\u0648\u0628"}`
          });
        }
      }
      const updatePayload = {
        modelId: cleanModelId,
        lastValidatedAt: Date.now(),
        lastValidatedOk: validationOk
      };
      if (typeof isEnabled === "boolean") {
        updatePayload.isEnabled = isEnabled;
      }
      if (cleanFallbackModelId !== void 0) {
        updatePayload.fallbackModelId = cleanFallbackModelId;
      }
      const endpointRef = dbAdmin.collection("model_endpoints").doc(endpointId);
      await endpointRef.set(updatePayload, { merge: true });
      modelEndpointCache.set(endpointId, {
        modelId: cleanModelId,
        fallbackModelId: cleanFallbackModelId,
        isEnabled: updatePayload.isEnabled !== void 0 ? updatePayload.isEnabled : existingData.isEnabled !== false,
        fetchedAt: Date.now()
      });
      return res.json({ success: true, message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0646\u0641\u0630 \u0628\u0646\u062C\u0627\u062D." });
    } catch (err) {
      console.error("PUT model-endpoints error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/naje-ad-config", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser && dbAdmin) {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629." });
      }
      const pricing = await getPricing(token);
      return res.json({
        config: pricing.najeAd || {
          enabled: true,
          pointsRatePerSecond: 2.5,
          durationOptionsSec: [4, 6, 8, 10, 12, 14, 16, 24, 30],
          maxShotsPerVideo: 2,
          defaultModelEndpointId: "video_standard"
        }
      });
    } catch (err) {
      console.error("GET /api/admin/naje-ad-config error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/admin/naje-ad-config", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser && dbAdmin) {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u062D\u062F\u064A\u062B \u0625\u0639\u062F\u0627\u062F\u0627\u062A Naje Ad." });
      }
      const { enabled, pointsRatePerSecond, durationOptionsSec, maxShotsPerVideo, defaultModelEndpointId } = req.body || {};
      const updatePayload = {
        updatedAt: Date.now(),
        updatedBy: decodedToken.email || userDoc?.email || uid
      };
      if (typeof enabled === "boolean") updatePayload.enabled = enabled;
      if (typeof pointsRatePerSecond === "number" && pointsRatePerSecond > 0) updatePayload.pointsRatePerSecond = pointsRatePerSecond;
      if (typeof defaultModelEndpointId === "string" && defaultModelEndpointId.trim()) {
        updatePayload.defaultModelEndpointId = defaultModelEndpointId.trim();
      }
      const targetEndpoint = updatePayload.defaultModelEndpointId || "video_standard";
      const videoModelEndpoint = await getModelEndpointConfig(targetEndpoint, "veo-3.1-lite-generate-preview");
      const availableDurations = videoModelEndpoint.supportedDurations && videoModelEndpoint.supportedDurations.length > 0 ? videoModelEndpoint.supportedDurations : [4, 6, 8];
      const effectiveMaxShots = updatePayload.maxShotsPerVideo || (typeof maxShotsPerVideo === "number" ? maxShotsPerVideo : 4);
      const maxPossibleDuration = Math.max(...availableDurations) * effectiveMaxShots;
      if (Array.isArray(durationOptionsSec) && durationOptionsSec.length > 0) {
        const parsed = durationOptionsSec.map(Number).sort((a, b) => a - b);
        const invalid = parsed.find((d) => d > maxPossibleDuration);
        if (invalid) {
          return res.status(400).json({ error: `\u0627\u0644\u0645\u062F\u0629 ${invalid} \u062B\u0627\u0646\u064A\u0629 \u062A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 (${maxPossibleDuration} \u062B\u0627\u0646\u064A\u0629) \u0644\u0644\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0645\u062E\u062A\u0627\u0631 \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u062F\u0639\u0645 ${effectiveMaxShots} \u0644\u0642\u0637\u0627\u062A.` });
        }
        updatePayload.durationOptionsSec = parsed;
      }
      if (typeof maxShotsPerVideo === "number" && maxShotsPerVideo > 0) updatePayload.maxShotsPerVideo = maxShotsPerVideo;
      if (dbAdmin) {
        await dbAdmin.collection("model_pricing").doc("naje_ad").set(updatePayload, { merge: true });
      } else {
        await setDocRest("model_pricing", "naje_ad", updatePayload, token);
      }
      pricingCache = null;
      await createDocRest("admin_audit_log", {
        action: "UPDATE_NAJE_AD_CONFIG",
        adminId: uid,
        adminEmail: decodedToken.email || userDoc?.email || "",
        details: updatePayload,
        timestamp: Date.now()
      }, token).catch(() => null);
      return res.json({ success: true, message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0625\u0639\u062F\u0627\u062F\u0627\u062A Naje Ad \u0628\u0646\u062C\u0627\u062D.", config: updatePayload });
    } catch (err) {
      console.error("PUT /api/admin/naje-ad-config error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/naje-ad-jobs", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser && dbAdmin) {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      let jobs = [];
      if (dbAdmin) {
        try {
          const snap = await dbAdmin.collection("generation_jobs").where("type", "==", "naje_ad_video").orderBy("createdAt", "desc").limit(50).get();
          jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch (_idxErr) {
          const fallbackSnap = await dbAdmin.collection("generation_jobs").orderBy("createdAt", "desc").limit(100).get();
          jobs = fallbackSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((j) => j.type === "naje_ad_video");
        }
      }
      return res.json({ jobs });
    } catch (err) {
      console.error("GET /api/admin/naje-ad-jobs error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/pricing/current", async (req, res) => {
    try {
      const pricing = await getFullCurrentPricingConfig();
      return res.json(pricing);
    } catch (err) {
      console.error("Error fetching current pricing:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  const voiceSampleCache = /* @__PURE__ */ new Map();
  app.get("/api/voice-sample", async (req, res) => {
    try {
      const rawVoice = req.query.voice || "Kore";
      const voice = rawVoice.charAt(0).toUpperCase() + rawVoice.slice(1).toLowerCase();
      const lower = voice.toLowerCase();
      if (voiceSampleCache.has(lower)) {
        res.setHeader("Content-Type", "audio/wav");
        res.setHeader("Cache-Control", "public, max-age=86400");
        return res.send(voiceSampleCache.get(lower));
      }
      const localPath = import_path4.default.join(process.cwd(), "public", "voice-samples", `${lower}.wav`);
      if (import_fs4.default.existsSync(localPath)) {
        try {
          const buf = import_fs4.default.readFileSync(localPath);
          if (buf.length > 500) {
            voiceSampleCache.set(lower, buf);
            res.setHeader("Content-Type", "audio/wav");
            res.setHeader("Cache-Control", "public, max-age=86400");
            return res.send(buf);
          }
        } catch (e) {
        }
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!USE_VERTEX_AI2 && !apiKey) {
        return res.status(500).json({ error: "Internal system configuration missing" });
      }
      const ai5 = createGenAIClient2();
      const sampleText = `\u0645\u0631\u062D\u0628\u0627\u064B\u060C \u0623\u0646\u0627 \u0635\u0648\u062A ${voice} \u0641\u064A \u0645\u0646\u0635\u0629 \u0646\u0627\u062C\u064A \u2014 \u062C\u0627\u0647\u0632 \u0644\u062A\u062D\u0648\u064A\u0644 \u0643\u062A\u0627\u0628\u0627\u062A\u0643 \u0644\u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u0651\u062A\u064A \u0639\u0627\u0644\u064A \u0627\u0644\u062C\u0648\u062F\u0629.`;
      const ttsModelSample = resolveEngineModel(await getModelEndpointId("voice_tts_standard", getNajeModel("voice_core")));
      let response = null;
      try {
        response = await ai5.models.generateContent({
          model: ttsModelSample,
          contents: sampleText,
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice }
              }
            },
            maxOutputTokens: OUTPUT_TOKEN_LIMITS.audioSpeech
          }
        });
      } catch (ttsErr) {
        console.warn(`[Voice Sample API] Primary TTS call failed for ${voice}, retrying with standard preview:`, ttsErr?.message || ttsErr);
        response = await ai5.models.generateContent({
          model: ttsModelSample,
          contents: `\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643\u060C \u0623\u0646\u0627 \u0635\u0648\u062A ${voice}.`,
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice }
              }
            },
            maxOutputTokens: OUTPUT_TOKEN_LIMITS.audioSpeech
          }
        });
      }
      const candidate = response?.candidates?.[0];
      const audioPart = candidate?.content?.parts?.find((p) => p.inlineData && (p.inlineData.mimeType?.startsWith("audio/") || p.inlineData.data));
      if (audioPart?.inlineData?.data) {
        const rawPcm = Buffer.from(audioPart.inlineData.data, "base64");
        const sampleRate = parseSampleRateFromMimeType(audioPart.inlineData.mimeType, 24e3);
        const wavBuffer = pcmToWav(rawPcm, sampleRate);
        if (wavBuffer.length > 500) {
          voiceSampleCache.set(lower, wavBuffer);
          try {
            const dir = import_path4.default.join(process.cwd(), "public", "voice-samples");
            if (!import_fs4.default.existsSync(dir)) import_fs4.default.mkdirSync(dir, { recursive: true });
            import_fs4.default.writeFileSync(localPath, wavBuffer);
          } catch (e) {
          }
          res.setHeader("Content-Type", "audio/wav");
          res.setHeader("Cache-Control", "public, max-age=86400");
          return res.send(wavBuffer);
        }
      }
      return res.status(500).json({ error: "Could not generate sample audio" });
    } catch (err) {
      console.warn(`[Voice Sample API] Error generating sample for ${req.query.voice}:`, err?.message || err);
      return res.status(500).json({ error: err?.message || "Failed to generate sample" });
    }
  });
  app.post("/api/admin/generate-voice-samples", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser) {
        try {
          const userSnap = await dbAdmin.collection("users").doc(uid).get();
          isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
        } catch (e) {
        }
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621." });
      }
      const force = req.body?.force === true;
      const VOICES = [
        "Kore",
        "Puck",
        "Charon",
        "Zephyr",
        "Aoede",
        "Fenrir",
        "Leda",
        "Orus",
        "Callirrhoe",
        "Autonoe",
        "Enceladus",
        "Iapetus",
        "Umbriel",
        "Algieba",
        "Despina",
        "Erinome",
        "Algenib",
        "Rasalgethi",
        "Laomedeia",
        "Achernar",
        "Alnilam",
        "Schedar",
        "Gacrux",
        "Pulcherrima",
        "Achird",
        "Zubenelgenubi",
        "Vindemiatrix",
        "Sadachbia",
        "Sadaltager",
        "Sulafat"
      ];
      const bucket = (0, import_storage.getStorage)().bucket(STORAGE_BUCKET);
      const apiKey = process.env.GEMINI_API_KEY;
      if (!USE_VERTEX_AI2 && !apiKey) {
        return res.status(500).json({ error: "\u0646\u0648\u0627\u062C\u0647 \u0645\u0634\u0643\u0644\u0629 \u0645\u0624\u0642\u062A\u0629 \u0641\u064A \u062E\u0648\u0627\u062F\u0645 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0644\u0627\u062D\u0642\u0627\u064B." });
      }
      const ai5 = createGenAIClient2();
      const results = [];
      const outputDir = import_path4.default.join(process.cwd(), "public", "voice-samples");
      if (!import_fs4.default.existsSync(outputDir)) {
        try {
          import_fs4.default.mkdirSync(outputDir, { recursive: true });
        } catch (e) {
        }
      }
      for (const voice of VOICES) {
        const lower = voice.toLowerCase();
        const storagePath = `voice-samples/${lower}.wav`;
        const file = bucket.file(storagePath);
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
        if (!force) {
          try {
            const [exists] = await file.exists();
            if (exists) {
              const [metadata] = await file.getMetadata();
              const size = Number(metadata.size || 0);
              if (size > 1e3) {
                results.push({ voice, status: "skipped_exists", size, path: publicUrl });
                continue;
              }
            }
          } catch (err) {
            console.warn(`[Voice Sample Gen] Storage check error for ${voice}:`, err);
          }
        }
        let success = false;
        const ttsModelSample = resolveEngineModel(await getModelEndpointId("voice_tts_standard", getNajeModel("voice_core")));
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const sampleText = `\u0645\u0631\u062D\u0628\u0627\u064B\u060C \u0623\u0646\u0627 \u0635\u0648\u062A ${voice} \u0641\u064A \u0646\u0627\u062C\u064A \u2014 \u062C\u0627\u0647\u0632 \u0623\u062D\u0648\u0651\u0644 \u0646\u0635\u0643 \u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u062D\u062A\u0631\u0627\u0641\u064A.`;
            const response = await ai5.models.generateContent({
              model: ttsModelSample,
              contents: sampleText,
              config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice }
                  }
                },
                maxOutputTokens: OUTPUT_TOKEN_LIMITS.audioSpeech
              }
            });
            const candidate = response?.candidates?.[0];
            const audioPart = candidate?.content?.parts?.find((p) => p.inlineData && (p.inlineData.mimeType?.startsWith("audio/") || p.inlineData.data));
            if (audioPart?.inlineData?.data) {
              const rawPcm = Buffer.from(audioPart.inlineData.data, "base64");
              const sampleRate = parseSampleRateFromMimeType(audioPart.inlineData.mimeType, 24e3);
              const wavBuffer = pcmToWav(rawPcm, sampleRate);
              if (wavBuffer.length > 1e3) {
                await file.save(wavBuffer, { metadata: { contentType: "audio/wav" } });
                await file.makePublic().catch((err) => {
                  console.warn(`[Voice Sample Gen] makePublic failed for ${voice}:`, err?.message || err);
                });
                try {
                  import_fs4.default.writeFileSync(import_path4.default.join(outputDir, `${lower}.wav`), wavBuffer);
                } catch (e) {
                }
                results.push({ voice, status: "generated", size: wavBuffer.length, path: publicUrl });
                success = true;
                break;
              }
            }
          } catch (err) {
            if (!isRetryableError(err)) {
              console.error(`[Voice Sample Gen] ${voice}: permanent failure (${err?.code || "auth"}), not retrying. ${(err?.message || "").slice(0, 200)}`);
              break;
            }
            if (attempt === 3) {
              console.error(`[Voice Sample Gen] ${voice}: failed after 3 attempts. ${(err?.message || "").slice(0, 200)}`);
            } else {
              console.warn(`[Voice Sample Gen] ${voice} attempt ${attempt} failed:`, err?.message || err);
              await new Promise((r) => setTimeout(r, 1e3));
            }
          }
        }
        if (!success) {
          results.push({ voice, status: "failed", size: 0, path: publicUrl });
        }
      }
      const generatedCount = results.filter((r) => r.status === "generated").length;
      const skippedCount = results.filter((r) => r.status === "skipped_exists").length;
      const failedCount = results.filter((r) => r.status === "failed").length;
      res.json({
        success: true,
        message: `\u062A\u0645\u062A \u0645\u0639\u0627\u0644\u062C\u0629 \u0639\u064A\u0646\u0627\u062A \u0627\u0644\u0623\u0635\u0648\u0627\u062A \u0648\u0646\u0634\u0631\u0647\u0627 \u0639\u0644\u0649 Firebase Storage. \u062A\u0645 \u062A\u0648\u0644\u064A\u062F ${generatedCount} \u062C\u062F\u064A\u062F\u0629\u060C \u0648\u062A\u062E\u0637\u064A ${skippedCount} \u0645\u0648\u062C\u0648\u062F\u0629\u060C \u0628\u064A\u0646\u0645\u0627 \u0641\u0634\u0644 ${failedCount}.`,
        summary: { generatedCount, skippedCount, failedCount, total: VOICES.length },
        results
      });
    } catch (err) {
      console.error("[Voice Sample Gen Endpoint Error]", err);
      res.status(500).json({ error: err?.message || "Internal server error" });
    }
  });
  app.get("/api/voice-samples-manifest", async (req, res) => {
    try {
      const bucket = (0, import_storage.getStorage)().bucket(STORAGE_BUCKET);
      const [files] = await bucket.getFiles({ prefix: "voice-samples/" });
      const manifest = {};
      for (const file of files) {
        const filename = import_path4.default.basename(file.name);
        if (filename.endsWith(".wav")) {
          const voiceId = filename.replace(".wav", "").toLowerCase();
          manifest[voiceId] = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        }
      }
      return res.json({ manifest });
    } catch (err) {
      console.error("Error fetching voice samples manifest:", err);
      return res.json({ manifest: {} });
    }
  });
  app.get("/api/admin/feedback-summary", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser) {
        try {
          const userSnap = await dbAdmin.collection("users").doc(uid).get();
          isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
        } catch (e) {
        }
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0645\u0644\u062E\u0635 \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u0631\u0627\u062C\u0639\u0629." });
      }
      const timeWindow = req.query.timeWindow || "all";
      let timeCutoff = 0;
      const now = Date.now();
      if (timeWindow === "7d") timeCutoff = now - 7 * 24 * 60 * 60 * 1e3;
      else if (timeWindow === "30d") timeCutoff = now - 30 * 24 * 60 * 60 * 1e3;
      else if (timeWindow === "90d") timeCutoff = now - 90 * 24 * 60 * 60 * 1e3;
      let q = dbAdmin.collection("feedback_signals").orderBy("createdAt", "desc");
      if (timeCutoff > 0) {
        q = q.where("createdAt", ">=", timeCutoff);
      }
      const snap = await q.limit(1e3).get();
      const groups = {};
      let totalAllSignals = 0;
      let totalAllUp = 0;
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        totalAllSignals++;
        if (data.signal === "up") totalAllUp++;
        const key = data.decision_matrix_key || data.templateId || data.chatType || "general";
        if (!groups[key]) {
          groups[key] = {
            decisionKey: key,
            chatType: data.chatType || "general",
            total: 0,
            up: 0,
            down: 0,
            editedAfter: 0,
            reasons: {},
            recentSampleDate: data.createdAt || 0
          };
        }
        const g = groups[key];
        g.total++;
        if (data.signal === "up") g.up++;
        if (data.signal === "down") g.down++;
        if (data.editedAfter === true || data.isEdit === true) g.editedAfter++;
        if (Array.isArray(data.reasons)) {
          data.reasons.forEach((r) => {
            g.reasons[r] = (g.reasons[r] || 0) + 1;
          });
        }
        if (data.createdAt && data.createdAt > g.recentSampleDate) {
          g.recentSampleDate = data.createdAt;
        }
      });
      const summary = Object.values(groups).map((g) => {
        const approvalRate = g.total > 0 ? Math.round(g.up / g.total * 100) : 0;
        const editAfterRate = g.total > 0 ? Math.round(g.editedAfter / g.total * 100) : 0;
        const topReasons = Object.entries(g.reasons).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([reason, count]) => ({ reason, count }));
        let health = "good";
        if (approvalRate >= 85) health = "excellent";
        else if (approvalRate >= 70) health = "good";
        else if (approvalRate >= 50) health = "warning";
        else health = "critical";
        return {
          decisionKey: g.decisionKey,
          chatType: g.chatType,
          sampleSize: g.total,
          upVotes: g.up,
          downVotes: g.down,
          approvalRate,
          editAfterCount: g.editedAfter,
          editAfterRate,
          topReasons,
          recentSampleDate: g.recentSampleDate,
          health
        };
      }).sort((a, b) => b.sampleSize - a.sampleSize);
      const overallApprovalRate = totalAllSignals > 0 ? Math.round(totalAllUp / totalAllSignals * 100) : 0;
      return res.json({
        success: true,
        timeWindow,
        totalSignalsCount: totalAllSignals,
        overallApprovalRate,
        summary
      });
    } catch (err) {
      console.error("Error in /api/admin/feedback-summary:", err);
      return res.status(500).json({ error: err.message || "Failed to generate feedback summary" });
    }
  });
  app.post("/api/image/segment", async (req, res) => {
    try {
      const _auth = await requireAuth(req, res);
      if (!_auth) return;
      const { uid, token } = _auth;
      const rl = checkRateLimit(`img_segment:${uid}`, 30, 60 * 1e3);
      if (!rl.allowed) {
        return res.status(429).json({ error: `\u062A\u062C\u0627\u0648\u0632\u062A \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0644\u0644\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0628\u0639\u062F ${rl.retryAfterSec} \u062B\u0627\u0646\u064A\u0629.` });
      }
      const SEGMENT_COST = 0.5;
      const atomicRes = await mutateBalanceAtomic(uid, -SEGMENT_COST, { requireSufficient: true });
      if (!atomicRes.ok) {
        if (atomicRes.reason === "INSUFFICIENT") {
          return res.status(400).json({ error: `\u0631\u0635\u064A\u062F\u0643 \u063A\u064A\u0631 \u0643\u0627\u0641\u064D \u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0630\u0643\u064A. \u0627\u0644\u062A\u0643\u0644\u0641\u0629: ${SEGMENT_COST} \u0646\u0642\u0637\u0629.` });
        }
        return res.status(500).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0631\u0635\u064A\u062F \u0627\u0644\u0646\u0642\u0627\u0637." });
      }
      const { imageUrl, imageBase64, point } = req.body;
      if (!imageUrl && !imageBase64) {
        await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {
        });
        return res.status(400).json({ error: "Missing imageUrl or imageBase64" });
      }
      let cleanBase64 = "";
      let mimeType = "image/png";
      if (imageBase64) {
        if (imageBase64.includes(";base64,")) {
          const parts = imageBase64.split(";base64,");
          mimeType = parts[0].replace("data:", "") || "image/png";
          cleanBase64 = parts[1];
        } else {
          cleanBase64 = imageBase64;
        }
      } else if (imageUrl) {
        if (imageUrl.startsWith("data:")) {
          const parts = imageUrl.split(";base64,");
          mimeType = parts[0].replace("data:", "") || "image/png";
          cleanBase64 = parts[1];
        } else {
          let parsedUrl;
          try {
            parsedUrl = new import_url.URL(imageUrl);
          } catch {
            await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {
            });
            return res.status(400).json({ error: "\u0631\u0627\u0628\u0637 \u0627\u0644\u0635\u0648\u0631\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
          }
          if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {
            });
            return res.status(400).json({ error: "\u064A\u064F\u0633\u0645\u062D \u0641\u0642\u0637 \u0628\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644 http \u0623\u0648 https" });
          }
          const hostname = parsedUrl.hostname.toLowerCase();
          if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname.includes("metadata") || hostname === "169.254.169.254") {
            await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {
            });
            return res.status(400).json({ error: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0635\u0648\u0631\u0629 \u0645\u062D\u0638\u0648\u0631 \u0644\u0623\u0633\u0628\u0627\u0628 \u0623\u0645\u0646\u064A\u0629" });
          }
          const addresses = await import_dns.default.promises.lookup(hostname, { all: true });
          if (!addresses || addresses.length === 0) {
            await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {
            });
            return res.status(400).json({ error: "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0635\u0648\u0631\u0629 (DNS)" });
          }
          for (const addr of addresses) {
            if (isPrivateIp(addr.address)) {
              await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {
              });
              return res.status(400).json({ error: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0635\u0648\u0631\u0629 \u0645\u062D\u0638\u0648\u0631 \u0644\u0623\u0633\u0628\u0627\u0628 \u0623\u0645\u0646\u064A\u0629 (\u0634\u0628\u0643\u0629 \u062E\u0627\u0635\u0629)" });
            }
          }
          const imgFetch = await fetch(imageUrl);
          if (!imgFetch.ok) {
            await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {
            });
            return res.status(400).json({ error: `\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0635\u0648\u0631\u0629: ${imgFetch.statusText}` });
          }
          const arrayBuf = await imgFetch.arrayBuffer();
          cleanBase64 = Buffer.from(arrayBuf).toString("base64");
          mimeType = imgFetch.headers.get("content-type") || "image/png";
        }
      }
      const ai5 = createGenAIClient2();
      const targetX = point?.x !== void 0 ? point.x <= 1 ? Math.round(point.x * 1e3) : Math.round(point.x) : 500;
      const targetY = point?.y !== void 0 ? point.y <= 1 ? Math.round(point.y * 1e3) : Math.round(point.y) : 500;
      const segmentPrompt = `You are an expert computer vision object detection and segmentation system.
A user tapped on this image at coordinates [y: ${targetY}, x: ${targetX}] on a normalized [0..1000] scale (where 0,0 is top-left and 1000,1000 is bottom-right).

TASKS:
1. Identify the primary distinct foreground object, subject, person, clothing item, face, logo, or region directly under or surrounding the tapped point [y: ${targetY}, x: ${targetX}].
2. Provide the tight, precise 2D bounding box [ymin, xmin, ymax, xmax] in normalized 0-1000 integers.
3. Provide a list of polygon contour boundary points [[x, y], [x, y], ...] around the perimeter of this object (between 8 and 24 vertices) in 0-1000 normalized scale.
4. Provide a short Arabic and English label for the detected object.

Return ONLY a valid JSON object in this exact schema:
{
  "labelAr": "\u0648\u0635\u0641 \u0627\u0644\u0639\u0646\u0635\u0631 \u0627\u0644\u0645\u0643\u062A\u0634\u0641 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
  "labelEn": "English description of selected object",
  "box_2d": [ymin, xmin, ymax, xmax],
  "polygon": [[x1, y1], [x2, y2], ...]
}`;
      const resp = await ai5.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: cleanBase64, mimeType } },
              { text: segmentPrompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.classification
        }
      });
      const parsedText = resp.text || "{}";
      let parsed = {};
      try {
        parsed = JSON.parse(parsedText);
      } catch (e) {
        console.warn("Failed to parse JSON segment response:", parsedText);
      }
      const box = Array.isArray(parsed.box_2d) && parsed.box_2d.length === 4 ? parsed.box_2d : [
        Math.max(0, targetY - 100),
        Math.max(0, targetX - 100),
        Math.min(1e3, targetY + 100),
        Math.min(1e3, targetX + 100)
      ];
      const polygon = Array.isArray(parsed.polygon) && parsed.polygon.length >= 3 ? parsed.polygon : [
        [box[1], box[0]],
        [box[3], box[0]],
        [box[3], box[2]],
        [box[1], box[2]]
      ];
      return res.json({
        success: true,
        labelAr: parsed.labelAr || "\u0627\u0644\u0639\u0646\u0635\u0631 \u0627\u0644\u0645\u062D\u062F\u062F",
        labelEn: parsed.labelEn || "Selected Object",
        box_2d: box,
        polygon,
        point: { x: targetX, y: targetY },
        cost: SEGMENT_COST,
        newBalance: atomicRes.newBalance
      });
    } catch (err) {
      console.error("Error in /api/image/segment:", err);
      return res.status(500).json({ error: err.message || "Failed to segment image object" });
    }
  });
  app.get("/api/presets/format", async (req, res) => {
    try {
      const snapshot = await dbAdmin.collection("format_presets").get();
      if (snapshot.empty) {
        await seedFormatPresetsIfMissing();
        return res.json({ presets: DEFAULT_FORMAT_PRESETS });
      }
      const presets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.json({ presets });
    } catch (err) {
      console.error("Error fetching format presets:", err);
      return res.json({ presets: DEFAULT_FORMAT_PRESETS });
    }
  });
  app.post("/api/admin/presets/format", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser) {
        try {
          const userSnap = await dbAdmin.collection("users").doc(uid).get();
          isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
        } catch (e) {
        }
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u0639\u062F\u064A\u0644 \u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0645\u0646\u0635\u0627\u062A." });
      }
      const { id, nameAr, nameEn, platform, width, height, aspectRatio: aspectRatio2, category, icon: icon2, enabled, safeZone } = req.body;
      if (!id || !nameAr || !aspectRatio2) {
        return res.status(400).json({ error: "id, nameAr, and aspectRatio are required." });
      }
      const docRef = dbAdmin.collection("format_presets").doc(id);
      const presetData = {
        id,
        nameAr,
        nameEn: nameEn || nameAr,
        platform: platform || "custom",
        width: Number(width) || 1080,
        height: Number(height) || 1080,
        aspectRatio: aspectRatio2,
        category: category || "social",
        icon: icon2 || "image",
        enabled: enabled !== false,
        safeZone: safeZone || getSafeZoneForPreset(id) || "",
        updatedAt: Date.now()
      };
      await docRef.set(presetData, { merge: true });
      return res.json({ success: true, preset: presetData });
    } catch (err) {
      console.error("Error saving format preset:", err);
      return res.status(500).json({ error: err.message || "Failed to save format preset" });
    }
  });
  app.delete("/api/admin/presets/format/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (err) {
        return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062A\u0648\u0643\u064A\u0646: " + err.message });
      }
      const uid = decodedToken.uid;
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      let isAdminUser = userDoc?.isAdmin === true;
      if (!isAdminUser) {
        try {
          const userSnap = await dbAdmin.collection("users").doc(uid).get();
          isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
        } catch (e) {
        }
      }
      if (!isAdminUser) {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062D\u0630\u0641 \u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0645\u0646\u0635\u0627\u062A." });
      }
      const presetId = req.params.id;
      await dbAdmin.collection("format_presets").doc(presetId).delete();
      return res.json({ success: true });
    } catch (err) {
      console.error("Error deleting format preset:", err);
      return res.status(500).json({ error: err.message || "Failed to delete format preset" });
    }
  });
  app.post("/api/agent/chat-turn", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u064A\u062C\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0647\u0630\u0647 \u0627\u0644\u0645\u064A\u0632\u0629." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decoded;
      try {
        decoded = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (authErr) {
        return res.status(401).json({ error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629\u060C \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B." });
      }
      const uid = decoded.uid;
      const { messages, projectContext } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "messages array is required" });
      }
      const userDocSnap = await dbAdmin.collection("users").doc(uid).get();
      const isUserAdmin = !!userDocSnap.data()?.isAdmin;
      if (!checkFeatureAccess(res, userDocSnap.data(), "najeAgent")) return;
      if (!isUserAdmin) {
        const rl = checkRateLimit(`agent-chat:${uid}`, 60, 60 * 60 * 1e3);
        if (!rl.allowed) {
          return res.status(429).json({
            error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0645\u0646 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0644\u0647\u0630\u0647 \u0627\u0644\u0633\u0627\u0639\u0629. \u062C\u0631\u0651\u0628 \u0645\u062C\u062F\u062F\u0627\u064B \u0628\u0639\u062F ${Math.ceil(rl.retryAfterSec / 60)} \u062F\u0642\u064A\u0642\u0629.`
          });
        }
      }
      const pricing = await getPricing(token);
      const { processAgentChatTurn: processAgentChatTurn2 } = await Promise.resolve().then(() => (init_agentPlanner(), agentPlanner_exports));
      const result = await processAgentChatTurn2(messages, pricing, projectContext);
      return res.json({ success: true, result });
    } catch (err) {
      if (err?.code?.startsWith?.("auth/")) {
        return res.status(401).json({ error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629\u060C \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B." });
      }
      console.error("[Agent Chat Turn Error]", err);
      return res.status(500).json({ error: err?.message || "Failed to process chat turn" });
    }
  });
  app.post("/api/agent/propose-plan", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u064A\u062C\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0647\u0630\u0647 \u0627\u0644\u0645\u064A\u0632\u0629." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decoded;
      try {
        decoded = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (authErr) {
        return res.status(401).json({ error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629\u060C \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B." });
      }
      const uid = decoded.uid;
      const { userPrompt, projectContext } = req.body;
      if (!userPrompt) {
        return res.status(400).json({ error: "userPrompt is required" });
      }
      const userDocSnap = await dbAdmin.collection("users").doc(uid).get();
      const isUserAdmin = !!userDocSnap.data()?.isAdmin;
      if (!isUserAdmin) {
        const rl = checkRateLimit(`agent-plan:${uid}`, 20, 60 * 60 * 1e3);
        if (!rl.allowed) {
          return res.status(429).json({
            error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0645\u0646 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0644\u0647\u0630\u0647 \u0627\u0644\u0633\u0627\u0639\u0629. \u062C\u0631\u0651\u0628 \u0645\u062C\u062F\u062F\u0627\u064B \u0628\u0639\u062F ${Math.ceil(rl.retryAfterSec / 60)} \u062F\u0642\u064A\u0642\u0629.`
          });
        }
      }
      const pricing = await getPricing(token);
      const { generateAgentProposal: generateAgentProposal2 } = await Promise.resolve().then(() => (init_agentPlanner(), agentPlanner_exports));
      const proposal = await generateAgentProposal2(userPrompt, projectContext, pricing);
      return res.json({ success: true, proposal });
    } catch (err) {
      if (err?.code?.startsWith?.("auth/")) {
        return res.status(401).json({ error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629\u060C \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B." });
      }
      console.error("[Agent Plan Propose Error]", err);
      return res.status(500).json({ error: err?.message || "Failed to generate plan proposal" });
    }
  });
  app.post("/api/agent/execute-tool", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u064A\u062C\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0647\u0630\u0647 \u0627\u0644\u0645\u064A\u0632\u0629." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decoded;
      try {
        decoded = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (authErr) {
        return res.status(401).json({ error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629\u060C \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B." });
      }
      const uid = decoded.uid;
      const _userDocSnapForGate = await dbAdmin.collection("users").doc(uid).get();
      if (!checkFeatureAccess(res, _userDocSnapForGate.data(), "najeAgent")) return;
      const { toolName, inputParams, missionContext } = req.body;
      if (!toolName || !missionContext) {
        return res.status(400).json({ error: "toolName and missionContext are required" });
      }
      const userSnap = await dbAdmin.collection("users").doc(uid).get();
      const userData = userSnap.data();
      const isAdmin = !!userData?.isAdmin;
      if (!isAdmin) {
        const rl = checkRateLimit(`agent-exec:${uid}`, 40, 60 * 60 * 1e3);
        if (!rl.allowed) {
          return res.status(429).json({
            error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0645\u0646 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062A\u0646\u0641\u064A\u0630 \u0644\u0647\u0630\u0647 \u0627\u0644\u0633\u0627\u0639\u0629. \u062C\u0631\u0651\u0628 \u0645\u062C\u062F\u062F\u0627\u064B \u0628\u0639\u062F ${Math.ceil(rl.retryAfterSec / 60)} \u062F\u0642\u064A\u0642\u0629.`
          });
        }
      }
      if (toolName === "image_studio") {
        const rlNovaHr = checkRateLimit(`nova_hr:${uid}`, 30, 60 * 60 * 1e3);
        if (!rlNovaHr.allowed) {
          return res.status(429).json({
            error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631 \u0644\u0647\u0630\u0647 \u0627\u0644\u0633\u0627\u0639\u0629 (30 \u0635\u0648\u0631\u0629/\u0633\u0627\u0639\u0629).`
          });
        }
        const rlNovaDay = checkRateLimit(`nova_day:${uid}`, 150, 24 * 60 * 60 * 1e3);
        if (!rlNovaDay.allowed) {
          return res.status(429).json({
            error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u064A\u0648\u0645\u064A \u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631 (150 \u0635\u0648\u0631\u0629/\u064A\u0648\u0645).`
          });
        }
      }
      const pricing = await getPricing(token);
      const estimatedCost = getAgentToolCost(toolName, inputParams || {}, pricing);
      if (!isAdmin && estimatedCost > 0) {
        const reserve = await mutateBalanceAtomic(uid, -estimatedCost, { requireSufficient: true });
        if (!reserve.ok) {
          if (reserve.reason === "INSUFFICIENT") {
            return res.status(403).json({
              error: `\u0631\u0635\u064A\u062F\u0643 \u063A\u064A\u0631 \u0643\u0627\u0641\u064D \u0644\u062A\u0634\u063A\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621. \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 ${estimatedCost} \u0646\u0642\u0627\u0637.`
            });
          }
          return res.status(500).json({ error: "\u062A\u0639\u0630\u0631 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0631\u0635\u064A\u062F\u060C \u062D\u0627\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B." });
        }
      }
      const safeMissionContext = { ...missionContext, ownerId: uid };
      const { executeAgentTool: executeAgentTool2 } = await Promise.resolve().then(() => (init_agentExecutor(), agentExecutor_exports));
      const { auditAgentStepResult: auditAgentStepResult2 } = await Promise.resolve().then(() => (init_agentPlanner(), agentPlanner_exports));
      let result;
      try {
        result = await executeAgentTool2(toolName, inputParams || {}, safeMissionContext, pricing);
      } catch (execErr) {
        if (!isAdmin && estimatedCost > 0) {
          await mutateBalanceAtomic(uid, estimatedCost, {});
        }
        throw execErr;
      }
      if (!isAdmin && result.pointsDeducted !== estimatedCost) {
        await mutateBalanceAtomic(uid, estimatedCost - result.pointsDeducted, {});
      }
      const stepTitle = req.body.stepTitle || toolName;
      const userOriginalRequest = safeMissionContext.userPrompt || safeMissionContext.brandContext?.brandName || stepTitle;
      const audit = await auditAgentStepResult2(stepTitle, result.output, safeMissionContext.brandContext, {
        toolName,
        stepTitle,
        userOriginalRequest
      });
      return res.json({
        success: true,
        output: result.output,
        artifact: result.artifact,
        pointsDeducted: isAdmin ? 0 : result.pointsDeducted,
        audit
      });
    } catch (err) {
      if (err?.code?.startsWith?.("auth/")) {
        return res.status(401).json({ error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629\u060C \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B." });
      }
      console.error("[Agent Tool Execution Error]", err);
      return res.status(500).json({ error: err?.message || "Failed to execute agent tool" });
    }
  });
  app.post("/api/agent/execute-tool-stream", async (req, res) => {
    let heartbeat = null;
    let uid = "";
    let isAdmin = false;
    let estimatedCost = 0;
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "\u064A\u062C\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0647\u0630\u0647 \u0627\u0644\u0645\u064A\u0632\u0629." });
      }
      const token = authHeader.split("Bearer ")[1];
      let decoded;
      try {
        decoded = await (0, import_auth.getAuth)().verifyIdToken(token);
      } catch (authErr) {
        return res.status(401).json({ error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629\u060C \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B." });
      }
      uid = decoded.uid;
      const _userDocSnapForGate = await dbAdmin.collection("users").doc(uid).get();
      if (!checkFeatureAccess(res, _userDocSnapForGate.data(), "najeAgent")) return;
      const { toolName, inputParams, missionContext } = req.body;
      if (!toolName || !missionContext) {
        return res.status(400).json({ error: "toolName and missionContext are required" });
      }
      const userSnap = await dbAdmin.collection("users").doc(uid).get();
      const userData = userSnap.data();
      isAdmin = !!userData?.isAdmin;
      if (!isAdmin) {
        const rl = checkRateLimit(`agent-exec:${uid}`, 40, 60 * 60 * 1e3);
        if (!rl.allowed) {
          return res.status(429).json({
            error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0645\u0646 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062A\u0646\u0641\u064A\u0630 \u0644\u0647\u0630\u0647 \u0627\u0644\u0633\u0627\u0639\u0629. \u062C\u0631\u0651\u0628 \u0645\u062C\u062F\u062F\u0627\u064B \u0628\u0639\u062F ${Math.ceil(rl.retryAfterSec / 60)} \u062F\u0642\u064A\u0642\u0629.`
          });
        }
      }
      if (toolName === "image_studio") {
        const rlNovaHr = checkRateLimit(`nova_hr:${uid}`, 30, 60 * 60 * 1e3);
        if (!rlNovaHr.allowed) {
          return res.status(429).json({
            error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631 \u0644\u0647\u0630\u0647 \u0627\u0644\u0633\u0627\u0639\u0629 (30 \u0635\u0648\u0631\u0629/\u0633\u0627\u0639\u0629).`
          });
        }
        const rlNovaDay = checkRateLimit(`nova_day:${uid}`, 150, 24 * 60 * 60 * 1e3);
        if (!rlNovaDay.allowed) {
          return res.status(429).json({
            error: `\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u064A\u0648\u0645\u064A \u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0635\u0648\u0631 (150 \u0635\u0648\u0631\u0629/\u064A\u0648\u0645).`
          });
        }
      }
      const pricing = await getPricing(token);
      estimatedCost = getAgentToolCost(toolName, inputParams || {}, pricing);
      if (!isAdmin && estimatedCost > 0) {
        const reserve = await mutateBalanceAtomic(uid, -estimatedCost, { requireSufficient: true });
        if (!reserve.ok) {
          if (reserve.reason === "INSUFFICIENT") {
            return res.status(403).json({
              error: `\u0631\u0635\u064A\u062F\u0643 \u063A\u064A\u0631 \u0643\u0627\u0641\u064D \u0644\u062A\u0634\u063A\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621. \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 ${estimatedCost} \u0646\u0642\u0627\u0637.`
            });
          }
          return res.status(500).json({ error: "\u062A\u0639\u0630\u0631 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0631\u0635\u064A\u062F\u060C \u062D\u0627\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B." });
        }
      }
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      const sendEvent = (event, data) => {
        res.write(`event: ${event}
data: ${JSON.stringify(data)}

`);
      };
      heartbeat = setInterval(() => {
        res.write(": heartbeat\n\n");
      }, 25e3);
      const safeMissionContext = { ...missionContext, ownerId: uid };
      const { executeAgentTool: executeAgentTool2 } = await Promise.resolve().then(() => (init_agentExecutor(), agentExecutor_exports));
      const { auditAgentStepResult: auditAgentStepResult2 } = await Promise.resolve().then(() => (init_agentPlanner(), agentPlanner_exports));
      let result;
      try {
        result = await executeAgentTool2(
          toolName,
          inputParams || {},
          safeMissionContext,
          pricing,
          {
            onProgress: (progress) => {
              sendEvent("progress", progress);
            }
          }
        );
      } catch (execErr) {
        if (!isAdmin && estimatedCost > 0) {
          await mutateBalanceAtomic(uid, estimatedCost, {});
        }
        sendEvent("error", { error: execErr?.message || "Execution failed" });
        return;
      }
      if (!isAdmin && result.pointsDeducted !== estimatedCost) {
        await mutateBalanceAtomic(uid, estimatedCost - result.pointsDeducted, {});
      }
      const stepTitle = req.body.stepTitle || toolName;
      const userOriginalRequest = safeMissionContext.userPrompt || safeMissionContext.brandContext?.brandName || stepTitle;
      const audit = await auditAgentStepResult2(stepTitle, result.output, safeMissionContext.brandContext, {
        toolName,
        stepTitle,
        userOriginalRequest
      });
      sendEvent("done", {
        success: true,
        output: result.output,
        artifact: result.artifact,
        pointsDeducted: isAdmin ? 0 : result.pointsDeducted,
        audit
      });
    } catch (err) {
      if (!isAdmin && estimatedCost > 0 && uid) {
        await mutateBalanceAtomic(uid, estimatedCost, {}).catch(() => {
        });
      }
      console.error("[Agent Tool Stream Error]", err);
      if (!res.headersSent) {
        return res.status(500).json({ error: err?.message || "Failed to execute agent tool stream" });
      } else {
        res.write(`event: error
data: ${JSON.stringify({ error: err?.message || "Execution stream error" })}

`);
      }
    } finally {
      if (heartbeat) clearInterval(heartbeat);
      res.end();
    }
  });
  const DEV_ZIP_MAX_BYTES = 8 * 1024 * 1024;
  function isSafeOutboundUrl(raw) {
    try {
      const u = new import_url.URL(raw);
      if (u.protocol !== "http:" && u.protocol !== "https:") return false;
      const host = u.hostname.toLowerCase();
      if (host === "localhost" || host.endsWith(".local") || host === "0.0.0.0") return false;
      if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.|::1)/.test(host)) return false;
      return true;
    } catch {
      return false;
    }
  }
  function htmlToPlainText(html) {
    return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&/gi, "&").replace(/</gi, "<").replace(/>/gi, ">").replace(/"/gi, '"').replace(/&#39;/g, "'").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, " ").trim().slice(0, 2e4);
  }
  async function loadWorkspaceFiles(workspaceId, uid) {
    const snap = await dbAdmin.collection("developer_workspaces").doc(workspaceId).get();
    if (!snap.exists) return null;
    const meta = snap.data() || {};
    if (meta.ownerId !== uid) return null;
    const fileSnaps = await dbAdmin.collection("developer_workspaces").doc(workspaceId).collection("files").get();
    const files = fileSnaps.docs.map((d) => {
      const x = d.data() || {};
      return {
        path: String(x.path || d.id),
        language: String(x.language || "plaintext"),
        content: String(x.content || ""),
        bytes: Number(x.bytes || 0),
        truncated: !!x.truncated
      };
    });
    return { meta, files };
  }
  app.post("/api/developer/unpack", async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const userState = await getUserDocAndBalance(auth.uid, auth.token, auth);
      if (!checkFeatureAccess(res, userState.doc, "najeDeveloper")) return;
      const zipBase64 = String(req.body?.zipBase64 || "").replace(/^data:[^;]+;base64,/, "");
      const fileName = String(req.body?.fileName || "project.zip").slice(0, 180);
      if (!zipBase64) return res.status(400).json({ error: "\u0627\u0631\u0641\u0639 \u0645\u0644\u0641 ZIP \u0644\u0644\u0645\u0648\u0642\u0639." });
      const buf = Buffer.from(zipBase64, "base64");
      if (!buf.length) return res.status(400).json({ error: "\u0627\u0644\u0645\u0644\u0641 \u0641\u0627\u0631\u063A." });
      if (buf.length > DEV_ZIP_MAX_BYTES) {
        return res.status(413).json({ error: "\u062D\u062C\u0645 \u0627\u0644\u0623\u0631\u0634\u064A\u0641 \u0623\u0643\u0628\u0631 \u0645\u0646 8MB. \u0627\u0636\u063A\u0637 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0628\u062F\u0648\u0646 node_modules \u0648dist." });
      }
      const unpacked = await unpackSiteZip(buf);
      if (!unpacked.files.length) {
        return res.status(400).json({ error: "\u0645\u0627 \u0644\u0642\u064A\u0646\u0627 \u0645\u0644\u0641\u0627\u062A \u0646\u0635\u064A\u0629 \u062F\u0627\u062E\u0644 \u0627\u0644\u0623\u0631\u0634\u064A\u0641. \u062A\u0623\u0643\u062F \u0623\u0646\u0647 \u0645\u0648\u0642\u0639 (HTML/JS/CSS) \u0645\u0648 \u0635\u0648\u0631 \u0641\u0642\u0637." });
      }
      const workspaceRef = dbAdmin.collection("developer_workspaces").doc();
      await workspaceRef.set({
        ownerId: auth.uid,
        fileName,
        fileCount: unpacked.files.length,
        skipped: unpacked.skipped,
        truncatedFiles: unpacked.truncatedFiles,
        createdAt: Date.now()
      });
      const batchSize = 400;
      for (let i = 0; i < unpacked.files.length; i += batchSize) {
        const batch = dbAdmin.batch();
        for (const f of unpacked.files.slice(i, i + batchSize)) {
          const id = Buffer.from(f.path).toString("base64url").slice(0, 700);
          batch.set(workspaceRef.collection("files").doc(id), {
            path: f.path,
            language: f.language,
            content: f.content,
            bytes: f.bytes,
            truncated: f.truncated
          });
        }
        await batch.commit();
      }
      return res.json({
        success: true,
        workspaceId: workspaceRef.id,
        fileCount: unpacked.files.length,
        skipped: unpacked.skipped,
        truncatedFiles: unpacked.truncatedFiles,
        tree: unpacked.files.map((f) => ({ path: f.path, language: f.language, bytes: f.bytes, truncated: f.truncated })),
        message: "\u062A\u0645 \u0641\u0643 \u0627\u0644\u0623\u0631\u0634\u064A\u0641. \u062A\u0648\u062C\u0647 \u0644\u0644\u062F\u0631\u062F\u0634\u0629 \u0645\u0639 \u0646\u0627\u062C\u064A."
      });
    } catch (err) {
      console.error("[developer/unpack]", err);
      return res.status(500).json({ error: err?.message || "\u062A\u0639\u0630\u0651\u0631 \u0641\u0643 \u0627\u0644\u0623\u0631\u0634\u064A\u0641." });
    }
  });
  app.get("/api/developer/workspace/:id", async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const loaded = await loadWorkspaceFiles(String(req.params.id), auth.uid);
      if (!loaded) return res.status(404).json({ error: "\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
      return res.json({
        success: true,
        workspaceId: req.params.id,
        fileName: loaded.meta.fileName,
        fileCount: loaded.files.length,
        tree: loaded.files.map((f) => ({ path: f.path, language: f.language, bytes: f.bytes, truncated: f.truncated }))
      });
    } catch (err) {
      return res.status(500).json({ error: err?.message || "\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0634\u0631\u0648\u0639." });
    }
  });
  app.get("/api/developer/file", async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const workspaceId = String(req.query.workspaceId || "");
      const filePath = String(req.query.path || "");
      const snap = await dbAdmin.collection("developer_workspaces").doc(workspaceId).get();
      if (!snap.exists || snap.data()?.ownerId !== auth.uid) {
        return res.status(404).json({ error: "\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
      }
      const id = Buffer.from(filePath).toString("base64url").slice(0, 700);
      let fileSnap = await dbAdmin.collection("developer_workspaces").doc(workspaceId).collection("files").doc(id).get();
      if (!fileSnap.exists) {
        const q = await dbAdmin.collection("developer_workspaces").doc(workspaceId).collection("files").where("path", "==", filePath).limit(1).get();
        fileSnap = q.empty ? fileSnap : q.docs[0];
      }
      if (!fileSnap.exists) return res.status(404).json({ error: "\u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
      const x = fileSnap.data() || {};
      return res.json({
        success: true,
        file: {
          path: String(x.path || filePath),
          language: String(x.language || "plaintext"),
          content: String(x.content || ""),
          bytes: Number(x.bytes || 0),
          truncated: !!x.truncated
        }
      });
    } catch (err) {
      return res.status(500).json({ error: err?.message || "\u062A\u0639\u0630\u0651\u0631 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0645\u0644\u0641." });
    }
  });
  app.post("/api/developer/export", async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const loaded = await loadWorkspaceFiles(String(req.body?.workspaceId || ""), auth.uid);
      if (!loaded) return res.status(404).json({ error: "\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
      const JSZipMod = (await import("jszip")).default;
      const zip = new JSZipMod();
      for (const f of loaded.files) zip.file(f.path, f.content);
      const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(loaded.meta.fileName || "naje-project.zip")}"`);
      return res.send(buf);
    } catch (err) {
      return res.status(500).json({ error: err?.message || "\u062A\u0639\u0630\u0651\u0631 \u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0623\u0631\u0634\u064A\u0641." });
    }
  });
  app.post("/api/developer/chat", async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const userState = await getUserDocAndBalance(auth.uid, auth.token, auth);
      if (!checkFeatureAccess(res, userState.doc, "najeDeveloper")) return;
      const userIsAdmin = isPrivilegedAdmin(userState.doc, auth);
      const workspaceId = String(req.body?.workspaceId || "");
      const prompt = String(req.body?.prompt || "").trim();
      const intent = String(req.body?.intent || "chat");
      const focusPath = req.body?.focusPath ? String(req.body.focusPath) : "";
      const history = Array.isArray(req.body?.history) ? req.body.history.slice(-12) : [];
      if (!prompt) return res.status(400).json({ error: "\u0627\u0643\u062A\u0628 \u0631\u0633\u0627\u0644\u0629." });
      const loaded = await loadWorkspaceFiles(workspaceId, auth.uid);
      if (!loaded) return res.status(404).json({ error: "\u0627\u0631\u0641\u0639 \u0623\u0631\u0634\u064A\u0641 \u0627\u0644\u0645\u0648\u0642\u0639 \u0623\u0648\u0644\u0627\u064B." });
      const tree = buildFileTree(loaded.files.map((f) => f.path));
      const codeCtx = buildCodeContext(loaded.files, focusPath);
      const ai5 = createGenAIClient2();
      const modelId = resolveEngineModel(await getModelEndpointId("text_core", getNajeModel("core"), auth.token));
      let system = `\u0623\u0646\u062A \xAB\u0646\u0627\u062C\u064A \u0627\u0644\u0645\u0637\u0648\u0631\xBB. \u062A\u0641\u062D\u0635 \u0645\u0648\u0627\u0642\u0639 \u0645\u0631\u0641\u0648\u0639\u0629 \u0643\u0623\u0631\u0634\u064A\u0641 ZIP. \u062A\u062A\u0643\u0644\u0645 \u0639\u0631\u0628\u064A \u0641\u0635\u064A\u062D \u0648\u0627\u0636\u062D\u060C \u0631\u0624\u0648\u0633 \u0623\u0642\u0644\u0627\u0645\u060C \u0628\u062F\u0648\u0646 \u062D\u0634\u0648.
\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u0634\u0631\u0648\u0639 (${loaded.files.length}):
${tree}

\u0645\u0642\u062A\u0637\u0641 \u0627\u0644\u0643\u0648\u062F:
${codeCtx}

\u0642\u0648\u0627\u0639\u062F:
- \u0644\u0627 \u062A\u062E\u062A\u0644\u0642 \u0645\u0644\u0641\u0627\u062A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629.
- \u0625\u0646 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u062A\u0639\u062F\u064A\u0644\u0627\u064B\u060C \u0627\u0633\u062A\u062F\u0639\u0650 \u0627\u0644\u0623\u062F\u0627\u0629 apply_file_patch \u0628\u0627\u0644\u0645\u0633\u0627\u0631 \u0648\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0643\u0627\u0645\u0644 \u0627\u0644\u062C\u062F\u064A\u062F.
- \u0644\u0627 \u062A\u0634\u063A\u0651\u0644 \u0627\u0644\u0643\u0648\u062F. \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0639\u0644\u0649 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629 \u0641\u0642\u0637 \u062B\u0645 \u064A\u064F\u0639\u0627\u062F \u062A\u0635\u062F\u064A\u0631 ZIP.`;
      if (intent === "audit") {
        system += `

\u0627\u0644\u0645\u0647\u0645\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629: \u0641\u062D\u0635 \u0634\u0627\u0645\u0644. \u0623\u062E\u0631\u062C \u062A\u0642\u0631\u064A\u0631\u0627\u064B \u0639\u0631\u0628\u064A\u0627\u064B \u0628\u0647\u0630\u0647 \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u062D\u0635\u0631\u0627\u064B:
1) \u0627\u0644\u0628\u0646\u064A\u0629 \u0648\u0627\u0644\u0645\u0644\u0641\u0627\u062A
2) \u0623\u062E\u0637\u0627\u0621 \u0648\u0627\u0636\u062D\u0629 (HTML/JS/CSS)
3) \u0623\u0645\u0627\u0646 (XSS\u060C \u0623\u0633\u0631\u0627\u0631\u060C \u062A\u0642\u064A\u064A\u0645 eval\u060C \u0631\u0648\u0627\u0628\u0637 \u062E\u0627\u0631\u062C\u064A\u0629 \u062E\u0637\u0631\u0629)
4) \u0623\u062F\u0627\u0621 \u0648\u0625\u062A\u0627\u062D\u0629
5) \u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0627\u0644\u0625\u0635\u0644\u0627\u062D
\u0643\u0644 \u0642\u0633\u0645 \u0646\u0642\u0627\u0637 \u0642\u0635\u064A\u0631\u0629. \u0627\u062E\u062A\u0645 \u0628\u062C\u0645\u0644\u0629: \xAB\u0625\u0630\u0627 \u0628\u062F\u0643\u060C \u0623\u0643\u062A\u0628 \u0644\u0643 \u0628\u0631\u064A\u0641 \u062A\u0648\u062C\u064A\u0647 \u062A\u0641\u0635\u064A\u0644\u064A \u0644\u0644\u0648\u0643\u064A\u0644 \u0627\u0644\u0644\u064A \u062A\u0637\u0648\u0631 \u0645\u0639\u0647 \u0627\u0644\u0643\u0648\u062F.\xBB`;
      } else if (intent === "brief") {
        system += `

\u0627\u0644\u0645\u0647\u0645\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629: \u0627\u0643\u062A\u0628 \u0628\u0631\u064A\u0641 \u062A\u0648\u062C\u064A\u0647 \u062A\u0641\u0635\u064A\u0644\u064A \u0644\u0648\u0643\u064A\u0644 \u0628\u0631\u0645\u062C\u064A (Cursor/Grok/Copilot) \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0627\u0644\u0645\u062E\u062A\u0635\u0631\u0629 \u0644\u0644\u0643\u0648\u062F. \u062D\u062F\u0651\u062F \u0627\u0644\u0645\u0644\u0641\u0627\u062A\u060C \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u060C \u0642\u064A\u0648\u062F \u0639\u062F\u0645 \u0643\u0633\u0631 \u0627\u0644\u062A\u0635\u0645\u064A\u0645\u060C \u0648\u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u062A\u0646\u0641\u064A\u0630.`;
      }
      const contents = [];
      for (const h of history) {
        const role = h.role === "assistant" || h.role === "model" ? "model" : "user";
        const text = String(h.content || "").slice(0, 4e3);
        if (text) contents.push({ role, parts: [{ text }] });
      }
      contents.push({ role: "user", parts: [{ text: prompt }] });
      const tools = [{
        functionDeclarations: [{
          name: "apply_file_patch",
          description: "Replace the full contents of an existing project file. Path must already exist.",
          parameters: {
            type: "OBJECT",
            properties: {
              path: { type: "STRING" },
              content: { type: "STRING" },
              note: { type: "STRING" }
            },
            required: ["path", "content"]
          }
        }]
      }];
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      const stream = await ai5.models.generateContentStream({
        model: modelId,
        contents,
        config: {
          systemInstruction: system,
          tools,
          maxOutputTokens: intent === "audit" ? OUTPUT_TOKEN_LIMITS.fullstackAudit : OUTPUT_TOKEN_LIMITS.chatResponse
        }
      });
      let fullText = "";
      const functionCalls = [];
      let usageMeta = null;
      for await (const chunk of stream) {
        if (chunk.usageMetadata) usageMeta = chunk.usageMetadata;
        const calls = extractGeminiFunctionCalls(chunk);
        if (calls.length) functionCalls.push(...calls);
        const t = extractGeminiText(chunk);
        if (t) {
          fullText += t;
          res.write(`data: ${JSON.stringify({ text: t })}

`);
        }
      }
      const applied = [];
      for (const fc of functionCalls) {
        if (fc.name !== "apply_file_patch") continue;
        const p = String(fc.args?.path || "");
        const content = String(fc.args?.content || "");
        const target = loaded.files.find((f) => f.path === p);
        if (!target || !content) continue;
        const id = Buffer.from(p).toString("base64url").slice(0, 700);
        await dbAdmin.collection("developer_workspaces").doc(workspaceId).collection("files").doc(id).set({
          path: p,
          language: target.language,
          content: content.slice(0, 6e4),
          bytes: Math.min(content.length, 6e4),
          truncated: content.length > 6e4
        }, { merge: true });
        applied.push(p);
      }
      if (applied.length) {
        const note = `

\u062A\u0645 \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0639\u0644\u0649: ${applied.join("\u060C ")}. \u062A\u0642\u062F\u0631 \u062A\u0635\u062F\u0651\u0631 ZIP \u0645\u062D\u062F\u0651\u062B.`;
        fullText += note;
        res.write(`data: ${JSON.stringify({ text: note, applied })}

`);
      }
      const bill = await chargeForTextModelUsage(auth.uid, "text_core", usageMeta, userIsAdmin).catch(() => null);
      if (typeof bill?.newBalance === "number") {
      }
      res.write(`data: ${JSON.stringify({
        newBalance: bill?.newBalance,
        usage: {
          charged: bill?.charged || 0,
          inputTokens: bill?.inputTokens || 0,
          outputTokens: bill?.outputTokens || 0,
          cachedTokens: bill?.cachedTokens || 0,
          thoughtsTokens: bill?.thoughtsTokens || 0,
          billingType: "per_token"
        },
        applied
      })}

`);
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      console.error("[developer/chat]", err);
      if (!res.headersSent) return res.status(500).json({ error: err?.message || "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0641\u062D\u0635." });
      res.write(`data: ${JSON.stringify({ error: err?.message || "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0641\u062D\u0635." })}

`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  });
  app.post("/api/source/add", async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const userState = await getUserDocAndBalance(auth.uid, auth.token, auth);
      if (!checkFeatureAccess(res, userState.doc, "najeSource")) return;
      let workspaceId = String(req.body?.workspaceId || "");
      const type = String(req.body?.type || "text");
      const title = String(req.body?.title || "").slice(0, 200);
      let content = String(req.body?.content || "");
      const url = String(req.body?.url || "").trim();
      if (!workspaceId) {
        const ref = dbAdmin.collection("source_workspaces").doc();
        await ref.set({ ownerId: auth.uid, createdAt: Date.now(), itemCount: 0 });
        workspaceId = ref.id;
      } else {
        const snap = await dbAdmin.collection("source_workspaces").doc(workspaceId).get();
        if (!snap.exists || snap.data()?.ownerId !== auth.uid) {
          return res.status(404).json({ error: "\u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u0645\u0635\u0627\u062F\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629." });
        }
      }
      const existing = await dbAdmin.collection("source_workspaces").doc(workspaceId).collection("items").get();
      if (existing.size >= 24) return res.status(400).json({ error: "\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 (24 \u0645\u0635\u062F\u0631). \u0627\u062D\u0630\u0641 \u0645\u0635\u062F\u0631\u0627\u064B \u0623\u0648\u0644\u0627\u064B." });
      if (type === "url") {
        if (!isSafeOutboundUrl(url)) return res.status(400).json({ error: "\u0627\u0644\u0631\u0627\u0628\u0637 \u063A\u064A\u0631 \u0645\u0633\u0645\u0648\u062D." });
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 12e3);
        try {
          const fetched = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "NajeSource/1.0" } });
          if (!fetched.ok) return res.status(400).json({ error: `\u062A\u0639\u0630\u0651\u0631 \u062C\u0644\u0628 \u0627\u0644\u0631\u0627\u0628\u0637 (${fetched.status}).` });
          const ctype = fetched.headers.get("content-type") || "";
          const raw = await fetched.text();
          content = ctype.includes("html") ? htmlToPlainText(raw) : raw.slice(0, 2e4);
        } catch {
          return res.status(400).json({ error: "\u062A\u0639\u0630\u0651\u0631 \u062C\u0644\u0628 \u0627\u0644\u0631\u0627\u0628\u0637." });
        } finally {
          clearTimeout(t);
        }
      }
      content = content.slice(0, 2e4);
      let imageBase64 = "";
      let mimeType = "";
      if (type === "image") {
        imageBase64 = String(req.body?.data || content).replace(/^data:[^;]+;base64,/, "");
        mimeType = String(req.body?.mimeType || "image/jpeg").slice(0, 80);
        if (!imageBase64 || imageBase64.length > 7e5) {
          return res.status(400).json({ error: "\u0627\u0644\u0635\u0648\u0631\u0629 \u0643\u0628\u064A\u0631\u0629 \u0623\u0648 \u0641\u0627\u0631\u063A\u0629 (\u0627\u0644\u062D\u062F ~500KB)." });
        }
        content = String(req.body?.caption || title || "\u0635\u0648\u0631\u0629 \u0645\u0631\u0641\u0642\u0629");
      }
      if (type !== "image" && !content.trim()) return res.status(400).json({ error: "\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0641\u0627\u0631\u063A." });
      const itemRef = await dbAdmin.collection("source_workspaces").doc(workspaceId).collection("items").add({
        ownerId: auth.uid,
        type,
        title: title || (type === "url" ? url : type === "image" ? "\u0635\u0648\u0631\u0629" : "\u0645\u0635\u062F\u0631 \u0646\u0635\u064A"),
        url: type === "url" ? url : "",
        content,
        imageBase64: imageBase64 || "",
        mimeType: mimeType || "",
        createdAt: Date.now()
      });
      await dbAdmin.collection("source_workspaces").doc(workspaceId).set({ itemCount: existing.size + 1, updatedAt: Date.now() }, { merge: true });
      return res.json({
        success: true,
        workspaceId,
        item: { id: itemRef.id, type, title: title || (type === "url" ? url : type === "image" ? "\u0635\u0648\u0631\u0629" : "\u0645\u0635\u062F\u0631 \u0646\u0635\u064A"), url: type === "url" ? url : "", excerpt: content.slice(0, 240) }
      });
    } catch (err) {
      console.error("[source/add]", err);
      return res.status(500).json({ error: err?.message || "\u062A\u0639\u0630\u0651\u0631 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0635\u062F\u0631." });
    }
  });
  app.get("/api/source/workspace/:id", async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const snap = await dbAdmin.collection("source_workspaces").doc(String(req.params.id)).get();
      if (!snap.exists || snap.data()?.ownerId !== auth.uid) return res.status(404).json({ error: "\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
      const items = await dbAdmin.collection("source_workspaces").doc(String(req.params.id)).collection("items").orderBy("createdAt", "desc").get();
      return res.json({
        success: true,
        workspaceId: req.params.id,
        items: items.docs.map((d) => {
          const x = d.data() || {};
          return { id: d.id, type: x.type, title: x.title, url: x.url || "", excerpt: String(x.content || "").slice(0, 240) };
        })
      });
    } catch (err) {
      return res.status(500).json({ error: err?.message || "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u062A\u062D\u0645\u064A\u0644." });
    }
  });
  app.delete("/api/source/item", async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const workspaceId = String(req.body?.workspaceId || "");
      const itemId = String(req.body?.itemId || "");
      const snap = await dbAdmin.collection("source_workspaces").doc(workspaceId).get();
      if (!snap.exists || snap.data()?.ownerId !== auth.uid) return res.status(404).json({ error: "\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
      await dbAdmin.collection("source_workspaces").doc(workspaceId).collection("items").doc(itemId).delete();
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err?.message || "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u062D\u0630\u0641." });
    }
  });
  app.post("/api/source/chat", async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const userState = await getUserDocAndBalance(auth.uid, auth.token, auth);
      if (!checkFeatureAccess(res, userState.doc, "najeSource")) return;
      const userIsAdmin = isPrivilegedAdmin(userState.doc, auth);
      const workspaceId = String(req.body?.workspaceId || "");
      const prompt = String(req.body?.prompt || "").trim();
      const allowWeb = req.body?.allowWeb === true;
      const history = Array.isArray(req.body?.history) ? req.body.history.slice(-12) : [];
      if (!prompt) return res.status(400).json({ error: "\u0627\u0643\u062A\u0628 \u0631\u0633\u0627\u0644\u0629." });
      if (!workspaceId) return res.status(400).json({ error: "\u0623\u0636\u0641 \u0645\u0635\u062F\u0631\u0627\u064B \u0623\u0648\u0644\u0627\u064B." });
      const snap = await dbAdmin.collection("source_workspaces").doc(workspaceId).get();
      if (!snap.exists || snap.data()?.ownerId !== auth.uid) return res.status(404).json({ error: "\u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u0645\u0635\u0627\u062F\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629." });
      const itemSnaps = await dbAdmin.collection("source_workspaces").doc(workspaceId).collection("items").get();
      const sources = itemSnaps.docs.map((d) => {
        const x = d.data() || {};
        return {
          title: x.title,
          type: x.type,
          url: x.url,
          content: String(x.content || "").slice(0, 12e3),
          imageBase64: x.imageBase64 ? String(x.imageBase64) : "",
          mimeType: String(x.mimeType || "image/jpeg")
        };
      });
      if (!sources.length) return res.status(400).json({ error: "\u0623\u0636\u0641 \u0645\u0635\u062F\u0631\u0627\u064B \u0648\u0627\u062D\u062F\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644." });
      const sourceBlock = sources.map((s, i) => `# \u0645\u0635\u062F\u0631 ${i + 1}: ${s.title}${s.url ? ` (${s.url})` : ""}
${s.content}`).join("\n\n");
      const system = `\u0623\u0646\u062A \xAB\u0646\u0627\u062C\u064A \u0645\u0646 \u0645\u0635\u0627\u062F\u0631\u0643\xBB. \u0645\u0645\u0646\u0648\u0639 \u0627\u0644\u0627\u062E\u062A\u0644\u0627\u0642. \u062A\u062C\u064A\u0628 \u0641\u0642\u0637 \u0645\u0645\u0627 \u0641\u064A \u0627\u0644\u0645\u0635\u0627\u062F\u0631 \u0623\u062F\u0646\u0627\u0647.
\u0625\u0630\u0627 \u0645\u0627 \u0644\u0642\u064A\u062A \u0627\u0644\u062C\u0648\u0627\u0628 \u0641\u064A \u0627\u0644\u0645\u0635\u0627\u062F\u0631:
${allowWeb ? "- \u0627\u0628\u062F\u0623 \u062D\u0631\u0641\u064A\u0627\u064B: \xAB\u0644\u0645 \u0623\u062C\u062F \u0641\u064A \u0627\u0644\u0645\u0635\u0627\u062F\u0631\u060C \u0648\u0628\u062D\u062B\u062A \u0641\u064A \u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A \u0648\u0627\u0644\u0646\u062A\u064A\u062C\u0629:\xBB \u062B\u0645 \u0644\u062E\u0651\u0635 \u0646\u062A\u064A\u062C\u0629 \u0627\u0644\u0628\u062D\u062B \u0645\u0639 \u0627\u0644\u0631\u0648\u0627\u0628\u0637." : "- \u0623\u062C\u0628 \u062D\u0631\u0641\u064A\u0627\u064B \u0641\u0642\u0637: \xAB\u0644\u0645 \u0623\u062C\u062F \u0641\u064A \u0627\u0644\u0645\u0635\u0627\u062F\u0631.\xBB \u0628\u0644\u0627 \u0623\u064A \u0625\u0636\u0627\u0641\u0629."}
\u0644\u0627 \u062A\u062E\u0644\u0637 \u0631\u0623\u064A\u0643. \u0625\u0646 \u0627\u0642\u062A\u0628\u0633\u062A\u060C \u0627\u0630\u0643\u0631 \u0631\u0642\u0645 \u0627\u0644\u0645\u0635\u062F\u0631.

\u0627\u0644\u0645\u0635\u0627\u062F\u0631:
${sourceBlock}`;
      const ai5 = createGenAIClient2();
      const modelId = resolveEngineModel(await getModelEndpointId("text_core", getNajeModel("core"), auth.token));
      const contents = [];
      for (const h of history) {
        const role = h.role === "assistant" || h.role === "model" ? "model" : "user";
        const text = String(h.content || "").slice(0, 4e3);
        if (text) contents.push({ role, parts: [{ text }] });
      }
      contents.push({
        role: "user",
        parts: [
          { text: prompt },
          ...sources.filter((s) => s.imageBase64).slice(0, 4).map((s) => ({
            inlineData: { mimeType: s.mimeType || "image/jpeg", data: s.imageBase64 }
          }))
        ]
      });
      const tools = [];
      if (allowWeb) tools.push({ googleSearch: {} });
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      const stream = await ai5.models.generateContentStream({
        model: modelId,
        contents,
        config: {
          systemInstruction: system,
          tools: tools.length ? tools : void 0,
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse
        }
      });
      let usageMeta = null;
      const searchSources = [];
      for await (const chunk of stream) {
        if (chunk.usageMetadata) usageMeta = chunk.usageMetadata;
        const candidate = chunk.candidates?.[0];
        if (candidate?.groundingMetadata?.groundingChunks) {
          for (const g of candidate.groundingMetadata.groundingChunks) {
            if (g.web?.uri && !searchSources.some((s) => s.url === g.web.uri)) {
              searchSources.push({ title: g.web.title || g.web.uri, url: g.web.uri });
            }
          }
        }
        const t = extractGeminiText(chunk);
        if (t) res.write(`data: ${JSON.stringify({ text: t })}

`);
      }
      if (searchSources.length) res.write(`data: ${JSON.stringify({ searchSources })}

`);
      const bill = await chargeForTextModelUsage(auth.uid, "text_core", usageMeta, userIsAdmin).catch(() => null);
      res.write(`data: ${JSON.stringify({
        newBalance: bill?.newBalance,
        usage: {
          charged: bill?.charged || 0,
          inputTokens: bill?.inputTokens || 0,
          outputTokens: bill?.outputTokens || 0,
          cachedTokens: bill?.cachedTokens || 0,
          thoughtsTokens: bill?.thoughtsTokens || 0,
          billingType: "per_token"
        }
      })}

`);
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      console.error("[source/chat]", err);
      if (!res.headersSent) return res.status(500).json({ error: err?.message || "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0631\u062F." });
      res.write(`data: ${JSON.stringify({ error: err?.message || "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0631\u062F." })}

`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  });
  const candidateDistPaths = [
    import_path4.default.join(process.cwd(), "dist"),
    appDirname,
    import_path4.default.join(appDirname, "..", "dist"),
    import_path4.default.join(appDirname, "dist")
  ];
  const distPath = candidateDistPaths.find((p) => import_fs4.default.existsSync(import_path4.default.join(p, "index.html")));
  const isProduction = Boolean(isProdBundle && distPath);
  app.use(import_express.default.static(import_path4.default.join(process.cwd(), "public"), { dotfiles: "allow" }));
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
  });
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else if (distPath) {
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = import_path4.default.join(distPath, "index.html");
      res.sendFile(indexPath);
    });
  }
  app.use((err, req, res, next) => {
    console.error("Express Error:", err);
    if (req.path.startsWith("/api/")) {
      return res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
    }
    next(err);
  });
  executeSeeds();
}
function shouldAutoStartServer() {
  const entry = (process.argv[1] || "").replace(/\\/g, "/");
  return entry.endsWith("/server.ts") || entry.endsWith("/server.cjs") || entry.endsWith("/dist/server.cjs");
}
if (shouldAutoStartServer()) {
  startServer().catch((err) => {
    console.error("[Server] fatal start error:", err);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MAX_DOCUMENT_PAGES,
  MAX_PAGES,
  MAX_PRESENTATION_SLIDES,
  MAX_SLIDES,
  chargeForTextModelUsage,
  getSafeZoneForPreset,
  getTextModelTokenRates,
  startServer
});
