import fs from "fs";
import dns from "dns";
import http from "http";
import { URL } from "url";
import { pcmToWav, parseSampleRateFromMimeType } from "./src/lib/audioContainer";
import { generateMaximumCreativity } from "./src/lib/creativeEngine";
import express from "express";
import path from "path";

// Cross-runtime helpers for ESM and CJS bundle execution
const getAppDirname = () => {
  if (typeof __dirname !== "undefined") return __dirname;
  return process.cwd();
};
const getAppFilename = () => {
  if (typeof __filename !== "undefined") return __filename;
  return path.join(process.cwd(), "server.ts");
};
const appDirname = getAppDirname();
const appFilename = getAppFilename();

import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { getMessaging as getMessagingAdmin } from "firebase-admin/messaging";
import dotenv from "dotenv";
import { FALLBACK_DEFAULTS, SEED_ENDPOINTS, OUTPUT_TOKEN_LIMITS } from './src/lib/modelRegistry';
import { getNajeModel, resolveEngineModel } from './src/lib/modelEnvConfig';
import { getAgentToolCost } from './src/lib/agentPricing';
import { buildPersonaInstruction, criticReviewRequest, getThinkingConfig } from './src/lib/councilOfMinds';
import os from 'os';
import { buildInitialPlan, splitDuration, VideoPlan, ShotPlan } from './src/lib/videoOrchestrator';
import { unpackSiteZip, buildFileTree, buildCodeContext, WorkspaceFile } from './src/lib/workspaceZip';
import { calcVoicePointsCost, spokenTextFromVoiceScript } from './src/lib/voicePricing';

let ffmpegMod: any = null;
async function getFfmpeg() {
  if (ffmpegMod) return ffmpegMod;
  const ffmpeg = (await import('fluent-ffmpeg')).default;
  const ffmpegStatic = (await import('ffmpeg-static')).default;
  if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic as string);
  ffmpegMod = ffmpeg;
  return ffmpeg;
}

async function getNajeEngineCtor() {
  const mod = await import('./src/lib/naje-engine');
  return mod.NajeEngine;
}

/** Visible model text only — never use response.text when functionCall parts exist
 *  (the SDK warns and concatenates, which is how empty chat replies leak through). */
function extractGeminiText(chunk: any): string {
  const parts = chunk?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return '';
  let out = '';
  for (const p of parts) {
    if (!p || typeof p.text !== 'string') continue;
    if (p.thought === true) continue;
    if (p.functionCall) continue;
    out += p.text;
  }
  return out;
}

function extractGeminiFunctionCalls(chunk: any): any[] {
  const fromSdk = Array.isArray(chunk?.functionCalls) ? chunk.functionCalls : [];
  if (fromSdk.length > 0) return fromSdk;
  const parts = chunk?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return [];
  const calls: any[] = [];
  for (const p of parts) {
    if (p?.functionCall?.name) calls.push(p.functionCall);
  }
  return calls;
}


// Load environment variables
dotenv.config();

// Prevent unhandled errors from silently crashing the process
process.on('uncaughtException', (err) => {
  console.error('[Error] Uncaught Exception in server process:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Error] Unhandled Rejection in server process:', reason);
});

// Detect production environment robustly and set NODE_ENV
const isProdBundle = (appFilename.includes("dist") || appFilename.endsWith(".cjs")) && !process.argv.some(arg => arg.includes("server.ts"));
if (isProdBundle) {
  process.env.NODE_ENV = "production";
}

// Project and Firebase configuration
let configProjectId = "gen-lang-client-0549025293";
let configDatabaseId = "ai-studio-5cc65c6b-3f0a-4cc6-9e69-168419d8912f";
let configStorageBucket = "gen-lang-client-0549025293.firebasestorage.app";

try {
  const possibleConfigPaths = [
    path.join(process.cwd(), "firebase-applet-config.json"),
    path.join(appDirname, "firebase-applet-config.json"),
    path.join(appDirname, "..", "firebase-applet-config.json")
  ];
  const configPath = possibleConfigPaths.find(p => fs.existsSync(p));
  if (configPath) {
    const configRaw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(configRaw);
    if (parsed.projectId) configProjectId = parsed.projectId;
    if (parsed.firestoreDatabaseId) configDatabaseId = parsed.firestoreDatabaseId;
    if (parsed.storageBucket) configStorageBucket = parsed.storageBucket;
  }
} catch (e) {
  console.warn("Could not load firebase-applet-config.json, using defaults:", e);
}

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || configProjectId;
const DATABASE_ID = configDatabaseId;
const STORAGE_BUCKET = configStorageBucket;
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

// Vertex AI / Gemini API Central Client Creation
const USE_VERTEX_AI = process.env.NAJE_USE_VERTEX_AI === 'true';
const VERTEX_LOCATION = process.env.VERTEX_AI_LOCATION || 'global';

function createGenAIClient(): GoogleGenAI {
  if (USE_VERTEX_AI) {
    return new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: VERTEX_LOCATION,
    });
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// ===== NAJE AI Model Registry & Caching Layer =====
interface CachedEndpointConfig {
  modelId: string;
  fallbackModelId?: string;
  maxOutputTokens?: number;
  inputPointsPer1k?: number;
  outputPointsPer1k?: number;
  audioInputPointsPer1k?: number;
  inputPointsPerBlock?: number;
  inputTokenBlockSize?: number;
  outputPointsPerBlock?: number;
  outputTokenBlockSize?: number;
  isEnabled?: boolean;
  fetchedAt: number;
}
const modelEndpointCache = new Map<string, CachedEndpointConfig>();
const MODEL_CACHE_TTL = 3 * 60 * 1000; // 3 minutes TTL cache

// PayPal points packages — server-side source of truth
const PAYPAL_POINTS_PACKAGES: Record<string, { points: number; usd: number }> = {
  "pkg_5":   { points: 50,  usd: 5.00 },
  "pkg_10":  { points: 100, usd: 10.00 },
  "pkg_20":  { points: 200, usd: 20.00 },
  // Backward compatibility packages
  "pkg_50":  { points: 50,  usd: 8.00 },
  "pkg_120": { points: 120, usd: 15.00 },
};

// Tier rank unlocked by each purchasable package. Higher tier includes
// everything unlocked by lower tiers (cumulative, not exclusive).
const PACKAGE_TIER_RANK: Record<string, number> = {
  pkg_5: 1,
  pkg_10: 2,
  pkg_20: 3,
};

// Minimum tier rank required to use each gated feature.
const FEATURE_MIN_TIER: Record<string, number> = {
  creativelyAI: 1,
  najeAgent: 2,
  najeAd: 3,
  najeSource: 1,
  najeDeveloper: 2,
};

const FEATURE_DISPLAY_NAME: Record<string, string> = {
  creativelyAI: 'Creatively AI',
  najeAgent: 'Naje AI Agent',
  najeAd: 'Naje Ad',
  najeSource: 'ناجي من مصادرك',
  najeDeveloper: 'ناجي المطور',
};

const TIER_UNLOCK_PACKAGE: Record<number, string> = {
  1: 'pkg_5',
  2: 'pkg_10',
  3: 'pkg_20',
};

// Returns true and does nothing if the user's purchased tier covers this
// feature. Returns false and writes a 402 response describing exactly what
// package unlocks it if not — callers must `return` immediately when this
// returns false, without sending any other response.
function checkFeatureAccess(res: any, userData: any, featureKey: keyof typeof FEATURE_MIN_TIER): boolean {
  if (userData?.isAdmin) return true;
  const requiredTier = FEATURE_MIN_TIER[featureKey];
  const userTier = Number(userData?.highestPurchasedTier || 0);
  if (userTier >= requiredTier) return true;
  res.status(402).json({
    error: 'feature_locked',
    feature: featureKey,
    featureName: FEATURE_DISPLAY_NAME[featureKey],
    requiredTier,
    requiredPackage: TIER_UNLOCK_PACKAGE[requiredTier],
    currentTier: userTier,
  });
  return false;
}

// Fail loudly on model identifiers from families that do not exist, rather than
// failing silently at request time with a generic downstream error.
const KNOWN_BAD_MODEL_PATTERNS = [/gemini-1\.5/, /gemini-2\.0-flash-exp/];
function assertModelNameSane(name: string, where: string) {
  for (const p of KNOWN_BAD_MODEL_PATTERNS) {
    if (p.test(name)) {
      console.error(`[FATAL CONFIG] Invalid model name "${name}" referenced at ${where}. This model family does not exist.`);
    }
  }
}

async function getModelEndpointConfig(endpointId: string, defaultFallback?: string, _token?: string): Promise<{ modelId: string; fallbackModelId?: string; maxOutputTokens?: number; isEnabled?: boolean; supportedDurations?: number[] }> {
  const rawFallback = defaultFallback || FALLBACK_DEFAULTS[endpointId] || getNajeModel('core');
  const fallback = resolveEngineModel(rawFallback);
  assertModelNameSane(fallback, `getModelEndpointConfig fallback for ${endpointId}`);
  const now = Date.now();
  const cached = modelEndpointCache.get(endpointId);
  if (cached && (now - cached.fetchedAt < MODEL_CACHE_TTL)) {
    assertModelNameSane(cached.modelId, `modelEndpointCache for ${endpointId}`);
    return {
      modelId: resolveEngineModel(cached.modelId),
      fallbackModelId: cached.fallbackModelId ? resolveEngineModel(cached.fallbackModelId) : undefined,
      maxOutputTokens: cached.maxOutputTokens,
      isEnabled: cached.isEnabled !== false,
      supportedDurations: cached.supportedDurations
    };
  }
  try {
    const doc = await dbAdmin.collection('model_endpoints').doc(endpointId).get();
    if (doc.exists && doc.data()) {
      const data = doc.data()!;
      const modelId = resolveEngineModel(String(data.modelId || fallback).trim());
      const fallbackModelId = data.fallbackModelId ? resolveEngineModel(String(data.fallbackModelId).trim()) : undefined;
      const maxOutputTokens = typeof data.maxOutputTokens === 'number' ? data.maxOutputTokens : undefined;
      const isEnabled = data.isEnabled !== false;
      const supportedDurations = Array.isArray(data.supportedDurations) ? data.supportedDurations : undefined;
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
    // Quietly catch gRPC permissions errors
  }
  return { modelId: fallback, isEnabled: true };
}

async function getModelEndpointId(endpointId: string, defaultFallback?: string, token?: string): Promise<string> {
  const cfg = await getModelEndpointConfig(endpointId, defaultFallback, token);
  if (cfg.isEnabled === false) {
    const err: any = new Error(`MODEL_DISABLED: النموذج (${endpointId}) معطّل مؤقتاً من قبل الإدارة.`);
    err.status = 403;
    err.isModelDisabled = true;
    throw err;
  }
  return resolveEngineModel(cfg.modelId);
}

function isModelDeadOrDeprecated(err: any): boolean {
  if (!err) return false;
  const str = String(err?.message || err?.statusText || err || '').toLowerCase();
  const code = err?.status || err?.code || err?.statusCode || 0;
  
  return (
    code === 404 ||
    code === 403 ||
    code === 429 ||
    code === 503 ||
    str.includes('not found') ||
    str.includes('is not found') ||
    str.includes('no longer available') ||
    str.includes('deprecated') ||
    str.includes('unsupported model') ||
    str.includes('does not exist') ||
    str.includes('model not found') ||
    str.includes('permission_denied') ||
    str.includes('denied access') ||
    str.includes('resource_exhausted') ||
    str.includes('quota') ||
    str.includes('rate limit') ||
    str.includes('429') ||
    str.includes('404')
  );
}

async function updateEndpointHealthOnFailure(endpointId: string, failedModelId: string, errorReason: string) {
  try {
    const patch: any = {
      lastFailureAt: Date.now(),
      lastFailureReason: errorReason.slice(0, 300)
    };
    if (dbAdmin) {
      await dbAdmin.collection('model_endpoints').doc(endpointId).set(patch, { merge: true }).catch(() => {});
    }
  } catch (e) {}
}

async function updateEndpointHealthOnSuccess(endpointId: string, successfulModelId: string) {
  try {
    const patch: any = {
      lastKnownGoodModelId: successfulModelId,
      lastValidatedAt: Date.now(),
      lastValidatedOk: true,
      lastFailureAt: null,
      lastFailureReason: null
    };
    if (dbAdmin) {
      await dbAdmin.collection('model_endpoints').doc(endpointId).set(patch, { merge: true }).catch(() => {});
    }
  } catch (e) {}
}

/**
 * Universal Gemini generation wrapper with Automatic Fallback & Server-Side Disable Check
 */
async function generateWithFallback(opts: {
  endpointId?: string;
  defaultModelId?: string;
  fallbackModelId?: string;
  params: any;
  aiInstance?: any;
}): Promise<{ response: any; modelUsed: string; usedFallback: boolean }> {
  let primaryModel = opts.defaultModelId || 'gemini-3.6-flash';
  let fallbackModel = opts.fallbackModelId;
  let maxOutputTokens: number | undefined;

  if (opts.endpointId) {
    const config = await getModelEndpointConfig(opts.endpointId, opts.defaultModelId);
    if (config.isEnabled === false) {
      const err: any = new Error(`MODEL_DISABLED: النموذج (${opts.endpointId}) معطّل مؤقتاً من قبل الإدارة للإصلاح أو التطوير.`);
      err.status = 403;
      err.isModelDisabled = true;
      throw err;
    }
    primaryModel = config.modelId || primaryModel;
    fallbackModel = config.fallbackModelId || fallbackModel;
    maxOutputTokens = config.maxOutputTokens;
  }

  if (!fallbackModel && opts.endpointId) {
    fallbackModel = FALLBACK_DEFAULTS[opts.endpointId] || (primaryModel.includes('pro') ? 'gemini-3.6-flash' : 'gemini-3.5-flash-lite');
  }

  const aiClient = opts.aiInstance || ai;
  const callParams = { ...opts.params };
  if (maxOutputTokens && callParams.config) {
    callParams.config.maxOutputTokens = Math.min(callParams.config.maxOutputTokens || maxOutputTokens, maxOutputTokens);
  }

  try {
    const response = await aiClient.models.generateContent({
      ...callParams,
      model: resolveEngineModel(primaryModel)
    });
    if (opts.endpointId) {
      updateEndpointHealthOnSuccess(opts.endpointId, primaryModel).catch(() => {});
    }
    return { response, modelUsed: primaryModel, usedFallback: false };
  } catch (err: any) {
    const isDead = isModelDeadOrDeprecated(err);
    console.warn(`[generateWithFallback] Primary model "${primaryModel}" error (dead/unreachable: ${isDead}):`, err.message || err);
    if (opts.endpointId) {
      updateEndpointHealthOnFailure(opts.endpointId, primaryModel, err.message || String(err)).catch(() => {});
    }

    if (fallbackModel && fallbackModel !== primaryModel) {
      console.log(`[generateWithFallback] Triggering automatic fallback from "${primaryModel}" to "${fallbackModel}"...`);
      try {
        const response = await aiClient.models.generateContent({
          ...callParams,
          model: resolveEngineModel(fallbackModel)
        });
        if (opts.endpointId) {
          updateEndpointHealthOnSuccess(opts.endpointId, fallbackModel).catch(() => {});
        }
        return { response, modelUsed: fallbackModel, usedFallback: true };
      } catch (fallbackErr: any) {
        console.error(`[generateWithFallback] Fallback model "${fallbackModel}" also failed:`, fallbackErr.message || fallbackErr);
        throw fallbackErr;
      }
    }
    throw err;
  }
}

async function seedModelEndpointsIfMissing() {
  if (!dbAdmin) return;
  try {
    const targetModelMap: Record<string, string> = {
      text_lite: getNajeModel('lite'),
      tier_lite: getNajeModel('lite'),
      text_core: getNajeModel('core'),
      tier_core: getNajeModel('core'),
      text_max: getNajeModel('pro'),
      tier_max: getNajeModel('pro'),
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
      ui_standard: getNajeModel('core'),
      ui_builder: getNajeModel('core'),
      document_engine: getNajeModel('personas'),
      doc_standard: getNajeModel('core'),
      doc_a5: getNajeModel('core'),
      doc_slides: getNajeModel('core'),
      document_writer: getNajeModel('personas'),
      slide_writer: getNajeModel('personas'),
      infographic_designer: getNajeModel('personas'),
      image_lite: getNajeModel('image_lite'),
      image_fast: getNajeModel('image_lite'),
      image_spectra: getNajeModel('image_core'),
      image_standard: getNajeModel('image_core'),
      image_hd: getNajeModel('image_pro'),
      image_pro: getNajeModel('image_pro'),
      image_addon: getNajeModel('personas'),
      video_standard: getNajeModel('video_core'),
      video_veo_lite: getNajeModel('video_core'),
      video_omni: getNajeModel('video_pro'),
      voice_tts_standard: getNajeModel('voice_core'),
      voice_tts: getNajeModel('voice_core'),
      voice_tts_core: getNajeModel('voice_core'),
      voice_tts_pro: getNajeModel('voice_pro')
    };
    const endpointsToMigrate = Object.keys(targetModelMap);

    const snapshot = await dbAdmin.collection('model_endpoints').limit(1).get();
    if (snapshot.empty) {
      console.log("[Model Registry] Seeding initial model_endpoints collection...");
      const batch = dbAdmin.batch();
      for (const item of SEED_ENDPOINTS) {
        const ref = dbAdmin.collection('model_endpoints').doc(item.id);
        batch.set(ref, {
          ...item,
          lastValidatedAt: Date.now(),
          lastValidatedOk: true
        });
      }
      await batch.commit();
      console.log("[Model Registry] Successfully seeded model_endpoints collection.");
    } else {
      // Migrate registered endpoints to their target models
      for (const epId of endpointsToMigrate) {
        try {
          const targetModel = targetModelMap[epId] || 'gemini-3.6-flash';
          const docRef = dbAdmin.collection('model_endpoints').doc(epId);
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
            const seedItem = SEED_ENDPOINTS.find(s => s.id === epId);
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
        } catch (_subErr) {}
      }
    }
  } catch (err: any) {
    // In preview/dev mode without admin credentials, quietly fallback to SEED_ENDPOINTS
  }
}

// System-wide page & slide generation caps
export const MAX_DOCUMENT_PAGES = 25;
export const MAX_PRESENTATION_SLIDES = 35;
export const MAX_PAGES = MAX_DOCUMENT_PAGES;
export const MAX_SLIDES = MAX_PRESENTATION_SLIDES;

const DEFAULT_FORMAT_PRESETS = [
  { id: 'fb_cover', nameAr: 'فيسبوك: غلاف صفحة', nameEn: 'Facebook Page Cover', platform: 'facebook', width: 1640, height: 924, aspectRatio: '16:9', category: 'social', icon: 'facebook', isDefault: true, enabled: true, safeZone: 'Keep all logos, faces, and text strictly inside the central 820x312 safe rectangle (middle 60%). Avoid the lower-left corner where profile avatars overlap, and avoid top/bottom 15% edges which crop on mobile devices.' },
  { id: 'fb_post', nameAr: 'فيسبوك: صورة منشور', nameEn: 'Facebook Post', platform: 'facebook', width: 1200, height: 1200, aspectRatio: '1:1', category: 'social', icon: 'facebook', isDefault: true, enabled: true, safeZone: 'Maintain clean 10% outer margins; center all key subjects and text.' },
  { id: 'ig_square', nameAr: 'إنستغرام: منشور مربع', nameEn: 'Instagram Square Post', platform: 'instagram', width: 1080, height: 1080, aspectRatio: '1:1', category: 'social', icon: 'instagram', isDefault: true, enabled: true, safeZone: 'Keep text and primary subjects within the central 85% bounding area with balanced margins.' },
  { id: 'ig_story', nameAr: 'إنستغرام: قصة / ريلز', nameEn: 'Instagram Story / Reel', platform: 'instagram', width: 1080, height: 1920, aspectRatio: '9:16', category: 'social', icon: 'instagram', isDefault: true, enabled: true, safeZone: 'CRITICAL SAFE ZONE: Top 14% (profile header/avatar) and bottom 20% (reply bar and action pills) must remain completely clear of text, titles, or essential branding. Center all focal elements in the middle 65% vertical zone.' },
  { id: 'ig_portrait', nameAr: 'إنستغرام: منشور طولي', nameEn: 'Instagram Portrait Post', platform: 'instagram', width: 1080, height: 1350, aspectRatio: '4:5', category: 'social', icon: 'instagram', isDefault: true, enabled: true, safeZone: 'Keep focal subject and typography in the central 80% area; avoid top/bottom 10% margins.' },
  { id: 'yt_thumb', nameAr: 'يوتيوب: صورة مصغرة (Thumbnail)', nameEn: 'YouTube Thumbnail', platform: 'youtube', width: 1280, height: 720, aspectRatio: '16:9', category: 'video', icon: 'youtube', isDefault: true, enabled: true, safeZone: 'CRITICAL SAFE ZONE: Bottom-right corner (width 25% x height 20%) is covered by the video timestamp badge. Do NOT place text, faces, or important graphics in the bottom-right corner.' },
  { id: 'yt_cover', nameAr: 'يوتيوب: غلاف قناة (Banner)', nameEn: 'YouTube Channel Art', platform: 'youtube', width: 2560, height: 1440, aspectRatio: '16:9', category: 'video', icon: 'youtube', isDefault: true, enabled: true, safeZone: 'CRITICAL SAFE ZONE: The central 1546x423px band is the only area visible across all devices (mobile, tablet, desktop). All text, logos, and focal art MUST be placed within this central horizontal slice.' },
  { id: 'tw_post', nameAr: 'تويتر (X): صورة منشور', nameEn: 'Twitter / X Post', platform: 'twitter', width: 1200, height: 675, aspectRatio: '16:9', category: 'social', icon: 'twitter', isDefault: true, enabled: true, safeZone: 'Keep essential typography and focus within 80% central area to prevent timeline card cropping.' },
  { id: 'tw_header', nameAr: 'تويتر (X): غلاف حساب', nameEn: 'Twitter / X Header', platform: 'twitter', width: 1500, height: 500, aspectRatio: '3:1', category: 'social', icon: 'twitter', isDefault: true, enabled: true, safeZone: 'CRITICAL SAFE ZONE: Avoid the bottom-left area (avatar circle overlay) and top 5% margin. Place primary branding and text in the center and right-hand side.' },
  { id: 'li_post', nameAr: 'لينكد إن: صورة منشور', nameEn: 'LinkedIn Post', platform: 'linkedin', width: 1200, height: 1200, aspectRatio: '1:1', category: 'business', icon: 'linkedin', isDefault: true, enabled: true, safeZone: 'Professional centered composition with 10% edge margins.' },
  { id: 'li_cover', nameAr: 'لينكد إن: غلاف حساب شخصي', nameEn: 'LinkedIn Banner', platform: 'linkedin', width: 1584, height: 396, aspectRatio: '4:1', category: 'business', icon: 'linkedin', isDefault: true, enabled: true, safeZone: 'CRITICAL SAFE ZONE: Lower-left quadrant is obscured by the circular profile picture. Place logos, slogans, and important imagery in the right 60% and top-center area.' },
  { id: 'tt_video', nameAr: 'تيك توك: خلفية / فيديو', nameEn: 'TikTok Video Cover', platform: 'tiktok', width: 1080, height: 1920, aspectRatio: '9:16', category: 'video', icon: 'tiktok', isDefault: true, enabled: true, safeZone: 'CRITICAL SAFE ZONE: Right-side 15% (interaction icons: like, comment, share, bookmark) and bottom 22% (captions, hashtags, audio ticker) overlap with video. Keep all text and focal elements strictly in the left-center 65% area.' },
  { id: 'sc_story', nameAr: 'سناب شات: قصة', nameEn: 'Snapchat Story', platform: 'snapchat', width: 1080, height: 1920, aspectRatio: '9:16', category: 'social', icon: 'camera', isDefault: true, enabled: true, safeZone: 'Top 12% and bottom 18% reserved for Snapchat UI headers and reply action pills.' },
  { id: 'presentation_slide', nameAr: 'شريحة عرض تقديمي (16:9)', nameEn: 'Presentation Slide', platform: 'presentation', width: 1920, height: 1080, aspectRatio: '16:9', category: 'business', icon: 'presentation', isDefault: true, enabled: true, safeZone: 'Maintain 5% outer margin breathing room for projector and display overscan.' },
  { id: 'product_showcase', nameAr: 'صورة منتج للمتاجر الإلكترونية', nameEn: 'E-commerce Product Photo', platform: 'store', width: 1200, height: 1200, aspectRatio: '1:1', category: 'ecommerce', icon: 'shopping-bag', isDefault: true, enabled: true, safeZone: 'Product hero placed in exact center with clean 15% surrounding negative space for store catalog grids.' }
];

export function getSafeZoneForPreset(presetIdOrRatio?: string): string | null {
  if (!presetIdOrRatio || presetIdOrRatio === 'custom') return null;
  const found = DEFAULT_FORMAT_PRESETS.find(p => p.id === presetIdOrRatio || p.nameEn?.toLowerCase().includes(presetIdOrRatio.toLowerCase()));
  return found?.safeZone || null;
}

async function seedFormatPresetsIfMissing() {
  if (!dbAdmin) return;
  try {
    const snapshot = await dbAdmin.collection('format_presets').limit(1).get();
    if (snapshot.empty) {
      console.log("[Format Presets] Seeding initial format_presets collection...");
      const batch = dbAdmin.batch();
      for (const preset of DEFAULT_FORMAT_PRESETS) {
        const ref = dbAdmin.collection('format_presets').doc(preset.id);
        batch.set(ref, {
          ...preset,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      await batch.commit();
      console.log("[Format Presets] Successfully seeded format_presets.");
    }
  } catch (err: any) {
    // In preview/dev environments without ambient GCP credentials, default presets are served in-memory safely.
  }
}

async function verifyImageOutput(
  ai: any,
  imageBuffer: Buffer,
  aspectRatio: string,
  rawPrompt: string
): Promise<{ passed: boolean; reason?: string }> {
  try {
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(imageBuffer).metadata();
    if (metadata.width && metadata.height) {
      const actualRatio = metadata.width / metadata.height;
      const expectedRatioMap: Record<string, number> = {
        '1:1': 1.0,
        '16:9': 16 / 9,
        '9:16': 9 / 16,
        '4:3': 4 / 3,
        '3:4': 3 / 4,
        '3:2': 3 / 2,
        '2:3': 2 / 3,
        '4:5': 4 / 5,
        '5:4': 5 / 4,
        '21:9': 21 / 9,
        '3:1': 3.0,
        '4:1': 4.0
      };
      const expectedRatio = expectedRatioMap[aspectRatio];
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

    const textKeywords = ['نص', 'مكتوب', 'كلمة', 'عبارة', 'شعار', 'اكتب', 'text', 'written', 'typography', 'quote', 'label'];
    const lowerPrompt = (rawPrompt || '').toLowerCase();
    const hasTextDemand = textKeywords.some(kw => lowerPrompt.includes(kw)) || (rawPrompt && (rawPrompt.includes('"') || rawPrompt.includes('«') || rawPrompt.includes('\'')));

    if (hasTextDemand) {
      const base64 = imageBuffer.toString('base64');
      const verifyResp = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: base64, mimeType: 'image/png' } },
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
  } catch (err: any) {
    console.warn("[Stage 7 Verification] Non-blocking check failed:", err?.message || err);
    return { passed: true };
  }
}

async function validateModelIdServer(modelId: string, featureGroup: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!USE_VERTEX_AI && !apiKey) {
      return { ok: false, error: 'مفتاح الربط الداخلي غير متوفر، يرجى التواصل مع الدعم الفني' };
    }
    const ai = createGenAIClient();

    if (featureGroup === 'video') {
      try {
        if ((ai as any).models && typeof (ai as any).models.get === 'function') {
          await (ai as any).models.get({ model: modelId });
        }
      } catch (videoErr: any) {
        if (videoErr?.status === 404 || videoErr?.message?.includes('not found')) {
          return { ok: false, error: `النموذج ${modelId} غير موجود أو لا تملك صلاحية الوصول إليه` };
        }
      }
      return { ok: true };
    } else if (featureGroup === 'voice') {
      await ai.models.generateContent({
        model: modelId,
        contents: [{ role: 'user', parts: [{ text: 'اختبار' }] }],
        config: { responseModalities: ['AUDIO'] }
      });
    } else if (featureGroup === 'image') {
      await ai.models.generateContent({
        model: modelId,
        contents: [{ role: 'user', parts: [{ text: 'a red circle' }] }],
        config: { maxOutputTokens: 256 }
      });
    } else {
      await ai.models.generateContent({
        model: modelId,
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        config: { maxOutputTokens: 64 }
      });
    }
    return { ok: true };
  } catch (err: any) {
    console.error(`[Model Validation Error] ${modelId} (${featureGroup}):`, err?.message || err);
    return { ok: false, error: err?.message || 'فشل التحقق من الاتصال بالنموذج' };
  }
}


// Initialize Firebase Admin SDK securely using sub-modules
console.log(`[Firebase Admin Config] projectId=${configProjectId} databaseId=${configDatabaseId} storageBucket=${configStorageBucket}`);
console.log(`[Firebase Admin Config] Config file loaded: ${fs.existsSync(path.join(process.cwd(), "firebase-applet-config.json"))}`);

let dbAdmin: any = null;
try {
  if (!getApps().length) {
    initializeApp({
      projectId: PROJECT_ID,
      storageBucket: STORAGE_BUCKET,
    });
  }
  dbAdmin = getFirestore(DATABASE_ID);
} catch (error) {
  console.error("Firebase Admin initialization failed. Server will continue to run, but Firebase Admin features may not work:", error);
}

let isDbAdminAvailable = false;
const userTokenCache = new Map<string, string>();
const inMemoryBalances = new Map<string, number>();
const inMemoryQueue = {
  activeSlots: 0,
  maxConcurrentSlots: 4,
  queue: [] as Array<{ jobId: string; uid: string; enqueuedAt: number }>,
  activeJobs: [] as Array<{ jobId: string; uid: string; startedAt: number }>
};

const isCloudRun = !!process.env.K_SERVICE;
console.log(`[Environment] Running as: ${isCloudRun ? `Cloud Run service "${process.env.K_SERVICE}"` : 'non-Cloud-Run context (e.g. AI Studio preview/sandbox)'}`);

function isRetryableError(err: any): boolean {
  const code = err?.code || err?.status || err?.response?.status;
  const msg = err?.message || String(err || '');
  if (code === 403 || code === 401 || code === 'PERMISSION_DENIED' || code === 'UNAUTHENTICATED' || msg.includes('PERMISSION_DENIED') || msg.includes('403 Forbidden')) {
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
    const testPromise = dbAdmin.collection('users').limit(1).get();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
    const testSnap: any = await Promise.race([testPromise, timeoutPromise]);
    isDbAdminAvailable = true;
    console.log(`[Firebase Admin Startup Check] Successfully connected. Sample read returned ${testSnap.size} doc(s).`);
  } catch (e: any) {
    isDbAdminAvailable = false;
    console.log(`[Firebase Admin Startup Check] Notice: Admin SDK direct gRPC access bypassed (${e?.message || e?.code}). REST token adapter is active.`);
  }
})();

const NAJE_CORE_IDENTITY = `أنت "ناجي" (Naje AI) — منصة ذكاء اصطناعي توليدية عربية أولاً.

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

const DELIVERY_STYLES_MAP: Record<string, string> = {
  default: '',
  professional: 'Speak in a calm, professional, measured tone.',
  warm: 'Speak warmly and conversationally, like a friendly host.',
  energetic: 'Speak with high energy and enthusiasm, like an engaging ad narrator.',
  news: 'Read this in a formal, clear news broadcast style.'
};

// ===== Project Identity & Living Memory System Helpers =====

const CLASSIFICATION_GUIDANCE: Record<string, string> = {
  individual:  "خاطب المستخدم بأسلوب مرن وودود، وامنحه مساحة إبداعية كاملة دون قيود رسمية إلا إذا طلب خلاف ذلك.",
  business:    "اعتمد أسلوباً احترافياً تسويقياً بشكل افتراضي، مناسب لعلامة تجارية، مع إمكانية المرونة حسب الطلب.",
  government:  "اعتمد أسلوباً رسمياً وحيادياً بشكل افتراضي، تجنّب العامية إلا إذا طُلبت صراحة، وكن دقيقاً وحذراً في أي ادعاءات واقعية — هذا محتوى مؤسسي رسمي.",
  nonprofit:   "اعتمد أسلوباً دافئاً وإنسانياً يعكس رسالة المنظمة، مع الحفاظ على المصداقية والوضوح.",
  education:   "اعتمد أسلوباً تعليمياً واضحاً ومنظماً، مناسباً لمحتوى تربوي أو أكاديمي.",
  other:       "اعتمد أسلوباً متوازناً واحترافياً افتراضياً.",
};

function getClassificationLabelServer(classification?: string, classificationOther?: string): string {
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

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === '::1' || ip === '0.0.0.0' || ip === '::') return true;

  let normalized = ip;
  if (normalized.startsWith('::ffff:')) {
    normalized = normalized.replace('::ffff:', '');
  }

  const parts = normalized.split('.').map(Number);
  if (parts.length === 4 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
    const [a, b] = parts;
    if (a === 127) return true; // 127.0.0.0/8
    if (a === 10) return true;  // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 (metadata)
    if (a === 0) return true; // 0.0.0.0/8
    return false;
  }

  const lower = ip.toLowerCase();
  if (lower.startsWith('fe80:') || lower.startsWith('fc00:') || lower.startsWith('fd00:')) return true;

  return false;
}

async function ssrfSafeFetchUrl(targetUrl: string, maxRedirects = 3): Promise<string> {
  let currentUrlStr = targetUrl;
  let redirectsRemaining = maxRedirects;

  while (redirectsRemaining >= 0) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(currentUrlStr);
    } catch {
      throw new Error("رابط غير صالحة صيغته");
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error("يُسمح فقط ببروتوكول http أو https");
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' || 
      hostname.endsWith('.local') || 
      hostname.endsWith('.internal') || 
      hostname.includes('metadata') ||
      hostname === '169.254.169.254'
    ) {
      throw new Error("عنوان محظور لأسباب أمنية (عنوان محلي أو شبكة خاصة)");
    }

    const addresses = await dns.promises.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new Error("تعذّر الوصول إلى عنوان الرابط (فشل النطاق DNS)");
    }

    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw new Error("عنوان محظور لأسباب أمنية (شبكة داخلية أو عنوان محلي)");
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(currentUrlStr, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'NajeAI-Bot/1.0 (Project Brand Memory Reader)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8'
        },
        redirect: 'manual'
      });

      clearTimeout(timeoutId);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) throw new Error("إعادة توجيه من غير عنوان جديد");
        currentUrlStr = new URL(location, currentUrlStr).toString();
        redirectsRemaining--;
        continue;
      }

      if (!response.ok) {
        throw new Error(`فشل فتح الرابط (رمز الاستجابة: ${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("تعذّر قراءة محتوى الرابط");

      let receivedBytes = 0;
      const chunks: Uint8Array[] = [];
      const MAX_BYTES = 5 * 1024 * 1024; // 5MB

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          receivedBytes += value.length;
          if (receivedBytes > MAX_BYTES) {
            reader.cancel();
            throw new Error("حجم محتوى الرابط يتجاوز الحد المسموح (5 ميغابايت)");
          }
          chunks.push(value);
        }
      }

      const rawBuffer = Buffer.concat(chunks);
      const contentType = response.headers.get('content-type') || '';
      
      let htmlText = rawBuffer.toString('utf-8');
      
      if (contentType.includes('html') || htmlText.includes('<html') || htmlText.includes('<body')) {
        htmlText = htmlText.replace(/<script[\s\S]*?<\/script>/gi, ' ');
        htmlText = htmlText.replace(/<style[\s\S]*?<\/style>/gi, ' ');
        htmlText = htmlText.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
        htmlText = htmlText.replace(/<[^>]+>/g, ' ');
        htmlText = htmlText
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&quot;/gi, '"')
          .replace(/&#39;/gi, "'");
        htmlText = htmlText.replace(/\s+/g, ' ').trim();
      }

      return htmlText;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error("انتهت مهلة قراءة الرابط (8 ثوانٍ)");
      }
      throw err;
    }
  }

  throw new Error("تجاوز الرابط عدد مرات إعادة التوجيه المسموحة");
}

async function generateMemoryItemSummary(rawTextOrDescription: string, label: string): Promise<string> {
  try {
    const ai = createGenAIClient();
    const prompt = `أنت محرك تلخيص الذاكرة الذكية لمشروع في Naje AI.
المطلوب: قم بتلخيص النص/الملف التابع لـ "${label}" في موجز مركز ومحتوي على أهم الحقائق والمفاهيم والأسماء والأرقام والشروط والملاحظات الأساسية (بحدود 150-250 كلمة كحد أقصى).
هذا الملخص سيتم حثه بشكل دائم في نظام الذاكرة الضمنية للمشروع لتوجيه جميع توليدات الذكاء الاصطناعي.

النص المراد تلخيصه:
"${rawTextOrDescription.slice(0, 30000)}"`;

    const response = await generateContentWithFallback(ai, {
      model: 'gemini-3.6-flash',
      endpointId: 'text_core',
      contents: prompt,
      config: { maxOutputTokens: OUTPUT_TOKEN_LIMITS.memorySummary }
    });

    return (response.text || rawTextOrDescription.slice(0, 500)).trim();
  } catch (err) {
    console.error("generateMemoryItemSummary failed:", err);
    return rawTextOrDescription.slice(0, 300);
  }
}

async function buildProjectAndMemoryContext(projectId?: string, projectData?: any, userDisplayName?: string, _token?: string): Promise<{
  systemInstructionContext: string;
  memoryItemsForTools: Array<{ itemId: string; label: string; type: string; summary: string }>;
}> {
  if (!projectId && (!projectData || !projectData.id)) {
    return { systemInstructionContext: '', memoryItemsForTools: [] };
  }

  const pid = projectId || (projectData && projectData.id);
  if (!pid) {
    return { systemInstructionContext: '', memoryItemsForTools: [] };
  }
  let pData = projectData;

  if (!pData || !pData.name) {
    if (_token) {
      pData = await getDocRest('projects', pid, _token).catch(() => null);
    }
    if (!pData || !pData.name) {
      try {
        const pDoc = await dbAdmin.collection('projects').doc(pid).get();
        if (pDoc.exists) {
          pData = { id: pDoc.id, ...pDoc.data() };
        }
      } catch (e) {
        // quiet fallback
      }
    }
  }

  if (!pData || !pData.name) {
    return { systemInstructionContext: '', memoryItemsForTools: [] };
  }

  const ownerName = pData.ownerDisplayName || userDisplayName || 'المستخدم';
  let classification = pData.classification;
  if (!classification && pData.entityType) {
    if (pData.entityType === 'شركة') classification = 'business';
    else if (pData.entityType === 'جهة حكومية') classification = 'government';
    else if (pData.entityType === 'مؤسسة غير ربحية') classification = 'nonprofit';
    else if (pData.entityType === 'فرد') classification = 'individual';
  }
  if (!classification) classification = 'individual';

  const label = getClassificationLabelServer(classification, pData.classificationOther);
  const guidance = CLASSIFICATION_GUIDANCE[classification] || CLASSIFICATION_GUIDANCE.individual;

  let contextStr = `\n\nسياق هذا المشروع: تعمل الآن ضمن مشروع باسم "${pData.name}" لصالح ${ownerName}، مصنّف كـ ${label}. ${guidance}\nهذا توجّه افتراضي فقط — إذا طلب المستخدم صراحة أسلوباً مختلفاً بطلبه الحالي، اتبع طلبه المباشر.`;

  if (pData.brandProfile) {
    contextStr += `\n\nإرشادات الهوية البصرية للمشروع:
- الألوان المعتمدة: ${JSON.stringify(pData.brandProfile.colors || '')}
- الأسلوب الإبداعي: ${pData.brandProfile.style || ''}
- الهوية البصرية: ${pData.brandProfile.visualIdentity || ''}`;
  }

  const memoryItemsForTools: Array<{ itemId: string; label: string; type: string; summary: string }> = [];
  try {
    let itemsList: any[] | null = null;
    if (_token) {
      itemsList = await getCollectionRest(`projects/${pid}/memory_items`, _token).catch(() => null);
    }
    if (itemsList === null) {
      try {
        const memorySnap = await dbAdmin
          .collection('projects')
          .doc(pid)
          .collection('memory_items')
          .orderBy('createdAt', 'desc')
          .get();

        if (!memorySnap.empty) {
          itemsList = memorySnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        }
      } catch (e: any) {
        // quiet fallback
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
        const itemSummary = item.summary || '';
        const itemLabel = item.label || 'ذاكرة';
        const itemType = item.type || 'text';

        memoryItemsForTools.push({
          itemId,
          label: itemLabel,
          type: itemType,
          summary: itemSummary,
        });

        const line = `- "${itemLabel}" (نوع: ${itemType}): ${itemSummary}\n`;
        if (totalChars + line.length <= MAX_AMBIENT_CHARS) {
          ambientSummaries += line;
          totalChars += line.length;
        } else {
          truncated = true;
        }
      });

      if (ambientSummaries.trim()) {
        contextStr += `\n\n[ذاكرة المشروع الضمنية (Ambient Memory)]:\n${ambientSummaries.trim()}`;
        if (truncated) {
          contextStr += `\n(ملاحظة: تم اقتطاع بعض الملخصات القديمة لحفظ المساحة. يمكنك طلب المحتوى الكامل لأي ملف/رابط في أي وقت).`;
        }
        contextStr += `\nاستخدم هذا السياق والذاكرة لتخصيص ردودك وتصاميمك بما يناسب هوية وتفاصيل هذا المشروع. إذا طلب المستخدم صراحة مراجعة أصل ملخص أو مستند أو رابط محدد، يمكنك استخدام الأداة المتاحة recall_project_memory لاستدعاء النص الأصلي كاملاً.`;
      }
    }
  } catch (e) {
    console.warn("Could not fetch memory items in buildProjectAndMemoryContext:", e);
  }

  return { systemInstructionContext: contextStr, memoryItemsForTools };
}

let pricingCache: { data: any; fetchedAt: number } | null = null;
const PRICING_CACHE_TTL_MS = 60_000; // 1 minute

function structuralSimilarity(oldHtml: string, newHtml: string): number {
  const tags = ['<section', '<div', '<header', '<nav', '<footer', '<button', '<form'];
  let oldCount = 0, newCount = 0, diff = 0;
  for (const t of tags) {
    const o = (oldHtml.match(new RegExp(t, 'g')) || []).length;
    const n = (newHtml.match(new RegExp(t, 'g')) || []).length;
    oldCount += o; newCount += n; diff += Math.abs(o - n);
  }
  if (oldCount === 0) return 1;
  return 1 - Math.min(1, diff / oldCount);
}

function hasStructuralResponsiveness(html: string): { hasMediaQuery: boolean; changesLayout: boolean } {
  const mediaMatch = html.match(/@media[^{]*\(\s*max-width\s*:\s*[0-9]+px\s*\)\s*{([^}]*(?:{[^}]*}[^}]*)*)}/i);
  if (!mediaMatch) return { hasMediaQuery: false, changesLayout: false };
  const body = mediaMatch[1] || '';
  const changesLayout = /flex-direction|grid-template-columns\s*:\s*1fr\s*[;}]|display\s*:\s*none|display\s*:\s*block|position\s*:\s*fixed/i.test(body);
  return { hasMediaQuery: true, changesLayout };
}

// ===== Skills Library =====
// Reusable instruction sheets ("skills") that teach the model HOW to produce a
// given artifact well (Arabic RTL typography, slide density, report structure...).
// Stored in Firestore so they can be edited from the Admin panel without a deploy.
let skillsCache: { data: any[]; fetchedAt: number } | null = null;
const SKILLS_CACHE_TTL_MS = 5 * 60 * 1000;

async function getSkills(_token?: string): Promise<any[]> {
  if (skillsCache && (Date.now() - skillsCache.fetchedAt) < SKILLS_CACHE_TTL_MS) {
    return skillsCache.data;
  }
  try {
    const list = await getCollectionRest("skills");
    if (list) {
      const skills = list.filter((s: any) => s.enabled !== false);
      skillsCache = { data: skills, fetchedAt: Date.now() };
      return skills;
    }
  } catch (e) {
    // Graceful fallback
  }
  return [];
}

// Select the skills that apply to this request and merge them into one block.
// appliesTo is an array of tags, e.g. ['pptx'], ['docx','pdf'], or ['all'].
function buildSkillsBlock(skills: any[], docType: string): string {
  const relevant = skills.filter((s: any) => {
    const tags: string[] = Array.isArray(s.appliesTo) ? s.appliesTo : [];
    return tags.includes('all') || tags.includes(docType);
  });
  if (relevant.length === 0) return '';
  const body = relevant
    .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0))
    .map((s: any) => `### ${s.name}\n${s.instructions}`)
    .join('\n\n');
  return `\n\n===== دليل المهارات (التزم به حرفياً أثناء التنفيذ) =====\n${body}\n===== نهاية دليل المهارات =====\n`;
}

async function getPricing(token?: string) {
  if (pricingCache && (Date.now() - pricingCache.fetchedAt) < PRICING_CACHE_TTL_MS) {
    return pricingCache.data;
  }
  const defaults = {
    image: {
      liteBase: 0.5, liteEdit: 0.25, base: 1, edit: 0.5, proBase: 1.5, proEdit: 0.75, imageAddon: 0.1,
      qualityMultiplier: { standard: 1.0, hd: 1.6, ultra: 2.4 }
    },
    video: {
      perSecond: 0.5, editMultiplier: 0.7, imageAddon: 0.1,
      resolutionMultiplier: { "720p": 1.0, "1080p": 1.6 }
    },
    document: {
      pptx_bracket1_max: 10, pptx_bracket1_cost: 3, pptx_bracket2_cost: 6,
      word_bracket1_max: 5, word_bracket1_cost: 2, word_bracket2_cost: 4,
      pdf_per_slide: 0.20,
      a4PerPage: 0.15,
      a5PerPage: 0.10
    },
    ui: { perGeneration: 1.0, editMultiplier: 0.5, maxOutputKb: 600, tierMultiplier: { lite: 0.6, core: 1.0, max: 2.0 } },
    voice: { costPerAudioSecond: 0.02, estimatedWordsPerMinute: 140, minCost: 0.10, costPerClip: 4, per100Words: 2, pointsPerCharacter: 0.01, pointsPerCharacterPro: 0.02 },
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
      defaultModelEndpointId: 'video_standard'
    }
  };
  try {
    let imageDoc: any = null;
    let videoDoc: any = null;
    let docDoc: any = null;
    let uiDoc: any = null;
    let voiceDoc: any = null;
    let agentDoc: any = null;
    let najeAdDoc: any = null;

    if (dbAdmin) {
      const [imgSnap, vidSnap, dSnap, uSnap, vSnap, aSnap, nAdSnap] = await Promise.all([
        dbAdmin.collection('model_pricing').doc('image').get().catch(() => null),
        dbAdmin.collection('model_pricing').doc('video').get().catch(() => null),
        dbAdmin.collection('model_pricing').doc('document').get().catch(() => null),
        dbAdmin.collection('model_pricing').doc('ui').get().catch(() => null),
        dbAdmin.collection('model_pricing').doc('voice').get().catch(() => null),
        dbAdmin.collection('model_pricing').doc('agent').get().catch(() => null),
        dbAdmin.collection('model_pricing').doc('naje_ad').get().catch(() => null),
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
        getDocRest('model_pricing', 'image', token).catch(() => null),
        getDocRest('model_pricing', 'video', token).catch(() => null),
        getDocRest('model_pricing', 'document', token).catch(() => null),
        getDocRest('model_pricing', 'ui', token).catch(() => null),
        getDocRest('model_pricing', 'voice', token).catch(() => null),
        getDocRest('model_pricing', 'agent', token).catch(() => null),
        getDocRest('model_pricing', 'naje_ad', token).catch(() => null),
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
      najeAd: najeAdDoc ? { ...defaults.najeAd, ...najeAdDoc } : defaults.najeAd,
    };
    pricingCache = { data, fetchedAt: Date.now() };
    return data;
  } catch (error) {
    return defaults;
  }
}

async function getFullCurrentPricingConfig(token?: string) {
  const pricing = await getPricing(token);
  try {
    if (dbAdmin) {
      const endpointsSnap = await dbAdmin.collection('model_endpoints').get().catch(() => null);
      if (endpointsSnap && !endpointsSnap.empty) {
        endpointsSnap.docs.forEach((doc: any) => {
          const d = doc.data();
          if (doc.id === 'image_lite' && typeof d.pointsPrice === 'number' && d.pointsPrice > 0) {
            pricing.image.liteBase = d.pointsPrice;
          } else if ((doc.id === 'image_standard' || doc.id === 'image_spectra') && typeof d.pointsPrice === 'number' && d.pointsPrice > 0) {
            pricing.image.base = d.pointsPrice;
          } else if ((doc.id === 'image_pro' || doc.id === 'image_hd') && typeof d.pointsPrice === 'number' && d.pointsPrice > 0) {
            pricing.image.proBase = d.pointsPrice;
          } else if (doc.id === 'image_addon' && typeof d.pointsPrice === 'number' && d.pointsPrice > 0) {
            pricing.image.imageAddon = d.pointsPrice;
            pricing.video.imageAddon = d.pointsPrice;
          } else if (doc.id === 'doc_standard' && typeof d.pointsPrice === 'number' && d.pointsPrice > 0) {
            pricing.document.a4PerPage = d.pointsPrice;
          } else if (doc.id === 'doc_a5' && typeof d.pointsPrice === 'number' && d.pointsPrice > 0) {
            pricing.document.a5PerPage = d.pointsPrice;
          } else if (doc.id === 'doc_slides' && typeof d.pointsPrice === 'number' && d.pointsPrice > 0) {
            pricing.document.pdf_per_slide = d.pointsPrice;
          } else if (doc.id === 'voice_tts' && d.pricingType === 'per_character' && typeof d.pointsPrice === 'number' && d.pointsPrice > 0) {
            pricing.voice.pointsPerCharacter = d.pointsPrice;
          } else if (doc.id === 'voice_tts_pro' && d.pricingType === 'per_character' && typeof d.pointsPrice === 'number' && d.pointsPrice > 0) {
            pricing.voice.pointsPerCharacterPro = d.pointsPrice;
          } else if (doc.id === 'voice_tts' && typeof d.pointsPrice === 'number' && d.pointsPrice > 0 && d.pricingType !== 'per_character') {
            pricing.voice.costPerAudioSecond = d.pointsPrice;
          }
        });
      }
    }
  } catch (e) {
    // quiet fallback
  }
  return pricing;
}

async function getFeatureFlags(token?: string): Promise<Record<string, boolean>> {
  const defaults: Record<string, boolean> = {
    text: true,
    image: true,
    video: true,
    ui: true,
    document: true,
    voice: true,
  };
  try {
    const doc = await dbAdmin.collection('config').doc('feature_flags').get();
    if (doc.exists) {
      return { ...defaults, ...doc.data() };
    }
  } catch (e) {
    // quiet fallback
  }
  return defaults;
}

async function compileVideoPrompt(rawPrompt: string, durationSec: number, aspectRatio: string, model: string, brandContext?: { colors?: any; style?: string; visualIdentity?: string; entityType?: string }): Promise<string> {
  const ai = createGenAIClient();
  const numberOfSections = Math.round(durationSec); // one section per second

  const personaCore = `منتج أفلام ومخرج فيديو محترف. لكل ثانية من مدة الفيديو المطلوبة، فكّر فعلياً: ما أقوى لحظة بصرية ممكنة بهذه الثانية تحديداً؟ ماذا يجب أن يُستبعد لتترك مجالاً لما هو أهم؟ استثمر كل ثانية بقرار إبداعي واعٍ وحافظ على اتساق الموضوع والأسلوب من الثانية الأولى للثانية الأخيرة.`;
  const systemInstruction = buildPersonaInstruction('المنتج', personaCore);

  const compilerInstruction = `${systemInstruction}

Your job is to convert a short, casual user request into a precise, second-by-second shot list for an AI video generation model (${model === 'veo' ? 'Veo' : 'Omni Flash'}), covering exactly ${numberOfSections} seconds (aspect ratio: ${aspectRatio}).

STRICT RULES:
- Output exactly ${numberOfSections} numbered sections, one per second (Second 1, Second 2, ... Second ${numberOfSections}).
- Each section must describe: the exact visual action/subject state at that second, camera framing/movement, lighting continuity, and any on-screen motion — concrete and specific, never vague ("something happens" is forbidden).
- Maintain STRICT visual and subject consistency across all seconds — the subject, setting, and style established in Second 1 must persist unless the user's request explicitly implies a change (e.g. a transition or scene change they asked for). Do not invent new subjects, objects, or settings not implied by the user's request.
- Do not add any narrative or content beyond what is reasonably implied by the user's request — you are structuring their idea into a shot list, not inventing a new one.
- CRITICAL LANGUAGE RULE FOR IN-VIDEO CONTENT (non-negotiable): if any second of this shot list includes a character speaking, dialogue, narration, or any on-screen/rendered text, that spoken or written content MUST be in the exact same language AND dialect as the user's original request below — never a different language, and never generic Modern Standard Arabic if the user wrote in a specific dialect (e.g. preserve Levantine, Gulf, Egyptian, or Maghrebi phrasing exactly as the user would naturally speak it, or English if that's what the user used). This rule applies only to in-scene spoken/written content — it does not change the language of these instructions to you, which remain in English.
- After the per-second breakdown, add one final "STYLE LOCK" line summarizing the consistent visual style/mood/lighting that must hold across the entire ${numberOfSections} seconds.
- Output ONLY the shot list in this exact structure, no preamble, no explanation, no markdown code fences.
${brandContext ? `\n\nPROJECT BRAND CONTEXT (must be respected in every second of the shot list):\n- Approved colors: ${JSON.stringify(brandContext.colors || [])}\n- Creative style: ${brandContext.style || 'not specified'}\n- Visual identity notes: ${brandContext.visualIdentity || 'not specified'}\n- Entity type: ${brandContext.entityType || 'not specified'} (adjust tone/formality accordingly)` : ''}

User's original request, for language/dialect reference (match this exactly for any in-video speech or text):
"${rawPrompt}"`;

  try {
    const result = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash-lite', // Writer tier (fast structuring)
      endpointId: 'tier_lite',
      contents: compilerInstruction,
      config: { maxOutputTokens: OUTPUT_TOKEN_LIMITS.videoCompiler }
    });
    const compiled = result.text || rawPrompt;
    console.log(`[compileVideoPrompt] Writer compiled prompt for ${durationSec}s ${model} video:\n${compiled}`);
    return compiled;
  } catch (error) {
    console.error("[compileVideoPrompt] Failed to compile video prompt, falling back to raw prompt:", error);
    return rawPrompt;
  }
}

async function auditVideoPrompt(ai: any, compiledShotList: string, durationSec: number, aspectRatio: string = "16:9", rawPrompt: string = ""): Promise<string> {
  if (process.env.ENABLE_ANTI_SLOP_CRITIC === 'false') {
    return compiledShotList;
  }
  try {
    const critiquePrompt = `You are an Anti-AI-Slop Master Video Director. Review and refine the following second-by-second video shot list for a ${durationSec}s video (aspect ratio: ${aspectRatio}).

CRITICAL VIDEO CRITIQUE DIRECTIVES:
1. REMOVE ALL AI CLICHÉS: Strip out buzzwords like "cinematic masterpiece", "hyper-realistic", "unreal engine render". Remove pointless floating neon grids, melting artifacts, or random lens flares.
2. ENFORCE REAL CINEMATOGRAPHY & LIGHTING:
   - Specific camera language (e.g. "slow steady tracking shot at waist height", "subtle 24fps push-in").
   - Explicit lighting setup & color temperature (e.g. "warm golden hour key light from stage-left, deep contrast shadows").
3. CROSS-SECOND CONSISTENCY & STYLE LOCK:
   - Ensure the subject, environment, materials, and wardrobe described in Second 1 remain strictly consistent across all seconds unless an explicit scene transition was requested.
   - Verify the "STYLE LOCK" line matches and anchors the visual identity across the entire duration without drift.
4. IN-VIDEO LANGUAGE CONSISTENCY: verify any spoken dialogue or on-screen text within the shot list matches the user's original request's language and dialect exactly (provided below) — flag and correct any second where in-scene language drifted to a different language or a more generic/formal register than the user actually used.
5. ASPECT RATIO & FRAMING: Ensure framing specifically fits ${aspectRatio}.

${rawPrompt ? `User's original request, for language/dialect reference:\n"${rawPrompt}"\n\n` : ''}Original Shot List:
${compiledShotList}

Return ONLY the refined, perfected shot list text in English without markdown code fences or conversational preamble.`;

    const result = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash-lite', // Auditor tier
      endpointId: 'tier_core',
      contents: critiquePrompt,
      config: {
        ...getThinkingConfig('gemini-3.5-flash-lite'),
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse
      }
    });

    if (result.text && result.text.trim()) {
      const refined = result.text.trim();
      console.log(`[auditVideoPrompt] Video prompt audited and refined:\n${refined}`);
      return refined;
    }
    return compiledShotList;
  } catch (err) {
    console.error("[auditVideoPrompt] Error during video prompt audit:", err);
    return compiledShotList;
  }
}

const GRAND_TYPOGRAPHY = `
Professional Typography Guide for Text & Logos:
When rendering or specifying text, logos, or typography in image generation prompts, adhere to professional font selections:
- Recommended English fonts: Helvetica Neue, Inter, Poppins, Montserrat, Playfair Display, Cinzel, Lato, Bebas Neue, Space Grotesk, Plus Jakarta Sans, Outfit, Clash Display, SF Pro Display, Futura, Avenir.
- Recommended Arabic fonts: Kufam, Cairo, Tajawal, Almarai, Changa, Aref Ruqaa, Reem Kufi, Thuluth, Diwani, Naskh, Mada, El Messiri, Lalezar, Readex Pro, IBM Plex Sans Arabic, Somar, Alexandria.
Rules: Enforce zero spelling errors, authentic RTL connectivity for Arabic scripts, properly joined letterforms, and high contrast against the background.
`;

async function applyCreativeLayers(ai: any, rawPrompt: string, mode: string = "design", aspectRatio: string = "1:1", safeZoneConstraint?: string): Promise<string> {
  if (process.env.ENABLE_ANTI_SLOP_CRITIC === 'false') {
    return rawPrompt;
  }
  try {
    const critiquePrompt = `You are an Anti-AI-Slop Master Art Director. Review and rewrite the following image generation prompt to ensure top agency quality.

CRITICAL ANTI-AI-SLOP DIRECTIVES:
1. REMOVE ALL AI CLICHÉS: Strip out terms like "award-winning", "masterpiece", "8k", "stunning", "hyper-detailed", "unreal engine", "trending on artstation". Strip out meaningless glowing neon wireframes, floating/melting random shapes, or abstract light grids.
2. ENFORCE REAL DESIGN RULES:
   - Composition: Define explicit focal points and enforce at least 30% negative space.
   - Color Balance: Define specific color palettes and ratios (e.g. 60-30-10 dominance rule) rather than generic color words.
   - Lighting: Specify an exact directional light source and color temperature (e.g., "single soft Key Light from 45-degree upper-left, 3200K warm tint").
3. BREAK VISUAL REPETITION: Avoid obvious visual clichés for the topic (e.g., no coffee beans floating around a mug, no generic brain outlines for AI). Use a fresh, sophisticated, agency-level visual concept.
4. TYPOGRAPHY & TEXT PRESERVATION:
   - Any exact text requested in quotes (e.g. "نَجِيّ") MUST BE PRESERVED EXACTLY as requested without altering spelling or language.
   - Match the request with appropriate typography standards from this font guide:
   ${GRAND_TYPOGRAPHY}
5. ASPECT RATIO ADAPTATION: Adapt layout composition for aspect ratio ${aspectRatio}.
${safeZoneConstraint ? `6. PLATFORM SAFE ZONE COMPLIANCE (STRICT): ${safeZoneConstraint}. Under no circumstances allow essential typography, faces, or focal branding to collide with platform UI overlay boundaries or crop margins.` : ''}

Original User Request (Mode: ${mode}, Aspect Ratio: ${aspectRatio}):
${rawPrompt}

Return ONLY the rewritten, refined prompt string in English without markdown or preamble.`;

    const result = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash-lite',
      endpointId: 'tier_core',
      contents: critiquePrompt,
      config: {
        ...getThinkingConfig('gemini-3.5-flash-lite'),
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler
      }
    });

    if (result.text && result.text.trim()) {
      const refined = result.text.trim();
      console.log(`[AntiSlopCritic] Prompt refined:\nOriginal: "${rawPrompt}"\nRefined: "${refined}"`);
      return refined;
    }
    return rawPrompt;
  } catch (err) {
    console.error("[AntiSlopCritic] Error during prompt refinement:", err);
    return rawPrompt;
  }
}

async function compileImagePrompt(
  rawPrompt: string, 
  modelKey: string, 
  referenceFiles: any[], 
  brandContext?: any, 
  aspectRatio: string = "1:1",
  presetId?: string
): Promise<string> {
  const ai = createGenAIClient();
  const safeZoneConstraint = getSafeZoneForPreset(presetId);

  const isPhotographicStyleModel = modelKey !== 'nova'; // 'nova' (Naje Imagen Pro) uses instruction-style prompting; all other tiers use photographic-style prompting per N-CORE's Stage 3 compiler split.

  const personaCore = `محترف تصوير وتصميم بصري بمستوى استوديو عالمي. تصوغ أدق التفاصيل وتلتقط الإضاءة والزوايا والتركيبات وتضمن نقاء التيبوغرافيا.`;
  const systemInstruction = buildPersonaInstruction('المصوّر', personaCore);

  const compilerInstruction = `${systemInstruction}

Convert the user's request into a single, maximally detailed, professional-grade prompt for an AI image generation model.

STRICT RULES:
- Never use vague adjectives ("nice colors", "modern style") — always resolve to specific, concrete descriptors (exact color/material names, specific composition terms).
${isPhotographicStyleModel
  ? `- This model responds best to layered natural-language photographic description, in this order: subject → environment/background → lighting → camera/lens language → material & texture → art/style reference → mood. Use real photographic vocabulary where appropriate (e.g. lens type, lighting setup) even though this is a generated image, since this vocabulary steers the model toward higher-quality output.`
  : `- This model responds better to explicit, instruction-style structuring, including direct spatial layout language (e.g. "centered composition, subject occupies upper third, negative space below") and explicit text-placement instructions if text rendering is relevant.`}
- Do not invent subject matter, objects, or details beyond what is reasonably implied by the user's request — you are elevating their idea into a professional prompt, not replacing it with a new one.
${safeZoneConstraint ? `- FORMAT PRESET SAFE ZONE REQUIREMENT: ${safeZoneConstraint}. Place all essential text, logos, and critical focal elements strictly inside this platform safe zone to avoid UI overlay clashing.` : ''}
- ARABIC & ENGLISH TEXT IN IMAGES (SMART TEXT GATE): If the user's request contains or implies any text, words, brand names, slogans, or titles to be written inside the image (especially in Arabic):
  1. Extract the EXACT text string to be rendered.
  2. Always wrap the exact text inside double quotation marks (e.g. "أهلاً وسهلاً" or "Naje AI").
  3. Explicitly instruct the model: "Render the exact text \"<EXACT_TEXT>\" in high-contrast, beautiful typography. For Arabic text, ensure correct right-to-left connectivity, properly joined letterforms, and no disconnected or reversed characters."
  4. ${GRAND_TYPOGRAPHY}
  5. Specify prominent placement, large readable font size, and clear background contrast. Keep text concise (ideal length: 1 to 5 words for highest accuracy). Do NOT leave empty space for text; instruct the model to bake the text directly into the image.
${brandContext ? `- Respect this project's brand context: colors ${JSON.stringify(brandContext.colors || [])}, style "${brandContext.style || ''}", entity type "${brandContext.entityType || ''}" (adjust formality/tone accordingly — e.g. more restrained and symmetrical for government/formal entities, warmer and more personal for individuals).` : ''}
${referenceFiles?.length ? `- The user attached ${referenceFiles.length} reference image(s) — assume dominant colors/composition/material cues from them should also be woven into the text description for redundancy with the image-conditioning channel.` : ''}
- Output ONLY the final compiled prompt text, no preamble, no explanation, no markdown formatting.

User's request: "${rawPrompt}"`;

  let structuredPrompt = rawPrompt;
  try {
    const result = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash-lite', // Writer tier (fast structuring)
      endpointId: 'tier_lite',
      contents: compilerInstruction,
      config: {
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler
      }
    });
    structuredPrompt = result.text || rawPrompt;
    console.log(`[compileImagePrompt] Writer structured prompt for ${modelKey} image:\n${structuredPrompt}`);
  } catch (error) {
    console.error("[compileImagePrompt] Failed to compile image prompt with writer tier, falling back to raw prompt:", error);
    structuredPrompt = rawPrompt;
  }

  // Phase 2: Final Stage-5 Self-Critique / Anti-AI-Slop Audit (Auditor tier: gemini-3.5-flash-lite)
  const auditedPrompt = await applyCreativeLayers(ai, structuredPrompt, "design", aspectRatio, safeZoneConstraint || undefined);
  return auditedPrompt;
}

// Document & Slide Quality Auditor functions
async function auditDocChunk(ai: any, sectionTitle: string, sectionHtml: string, contextSummary: string, auditorModel: string = 'gemini-3.5-flash-lite'): Promise<{ ok: boolean; refinedHtml?: string; reason?: string }> {
  try {
    const auditPrompt = `You are Naje AI's Senior Document Editor & Quality Auditor.
Audit this generated HTML section for quality, tone consistency, and structural completeness.

SECTION TITLE: "${sectionTitle}"
CONTEXT / PRIOR SUMMARY: "${contextSummary || 'First section'}"

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

    const res = await ai.models.generateContent({
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

async function auditSlideChunk(ai: any, slideData: any, auditorModel: string = 'gemini-3.5-flash-lite'): Promise<{ ok: boolean; refinedSlide?: any; reason?: string }> {
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

    const res = await ai.models.generateContent({
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

function parseFirestoreFields(fields: any): any {
  const result: any = {};
  if (!fields) return result;
  for (const [key, valueObj] of Object.entries(fields)) {
    const val: any = valueObj;
    if ('stringValue' in val) {
      result[key] = val.stringValue;
    } else if ('integerValue' in val) {
      result[key] = parseInt(val.integerValue, 10);
    } else if ('doubleValue' in val) {
      result[key] = parseFloat(val.doubleValue);
    } else if ('booleanValue' in val) {
      result[key] = val.booleanValue;
    } else if ('mapValue' in val) {
      result[key] = parseFirestoreFields(val.mapValue.fields);
    } else if ('arrayValue' in val) {
      result[key] = (val.arrayValue.values || []).map((v: any) => {
        const temp = parseFirestoreFields({ temp: v });
        return temp.temp;
      });
    } else if ('nullValue' in val) {
      result[key] = null;
    }
  }
  return result;
}

function toFirestoreFields(obj: any): any {
  const fields: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: val.toString() };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(v => {
            const temp = toFirestoreFields({ temp: v });
            return temp.temp;
          })
        }
      };
    } else if (typeof val === 'object') {
      fields[key] = {
        mapValue: {
          fields: toFirestoreFields(val)
        }
      };
    }
  }
  return fields;
}

function getDefaultMaxOutputTokensForModel(modelName: string): number {
  if (modelName.includes('3.5-flash-lite')) return 65535;
  if (modelName.includes('3.6-flash') || modelName.includes('3.7-flash')) return 65535;
  if (modelName.includes('3.1-pro')) return 65535;
  return 8192;
}

async function generateContentWithFallback(
  ai: any, 
  options: { model: string; contents: any; config?: any; endpointId?: string; fallbackModelId?: string }
) {
  const endpointId = options.endpointId;
  let primaryModel = options.model;
  let configuredFallback = options.fallbackModelId;
  let maxOutputTokensFromConfig: number | undefined;

  if (endpointId) {
    try {
      const cfg = await getModelEndpointConfig(endpointId, options.model);
      if (cfg.modelId) primaryModel = cfg.modelId;
      if (cfg.fallbackModelId) configuredFallback = cfg.fallbackModelId;
      if (cfg.maxOutputTokens) maxOutputTokensFromConfig = cfg.maxOutputTokens;
    } catch (e) {}
  }

  const baseConfig = options.config ? { ...options.config } : {};
  if (maxOutputTokensFromConfig && !baseConfig.maxOutputTokens) {
    baseConfig.maxOutputTokens = maxOutputTokensFromConfig;
  }
  if (!baseConfig.maxOutputTokens && !primaryModel.includes('image') && !primaryModel.includes('imagen')) {
    baseConfig.maxOutputTokens = getDefaultMaxOutputTokensForModel(primaryModel);
  }

  const mergedOptions = { ...options, model: primaryModel, config: baseConfig };

  try {
    const result = await ai.models.generateContent({
      ...mergedOptions,
      model: resolveEngineModel(primaryModel),
      config: {
        ...baseConfig,
        maxOutputTokens: baseConfig.maxOutputTokens || getDefaultMaxOutputTokensForModel(primaryModel)
      }
    });

    if (endpointId) {
      updateEndpointHealthOnSuccess(endpointId, primaryModel).catch(() => {});
    }
    return result;
  } catch (error: any) {
    const isModelDead = isModelDeadOrDeprecated(error);
    const errStr = error.message ? error.message.toLowerCase() : "";
    const isQuotaOrAccess =
      errStr.includes("quota") ||
      errStr.includes("rate limit") ||
      errStr.includes("exhausted") ||
      errStr.includes("429") ||
      errStr.includes("403") ||
      errStr.includes("permission_denied") ||
      errStr.includes("denied access") ||
      errStr.includes("not found") ||
      errStr.includes("404");

    if (endpointId) {
      updateEndpointHealthOnFailure(endpointId, primaryModel, error?.message || 'Model execution failure').catch(() => {});
    }

    if (isModelDead || isQuotaOrAccess) {
      const isImageReq = primaryModel.includes("image") || primaryModel.includes("imagen") || primaryModel.includes("nano-banana");
      const defaultFallbacks = isImageReq
        ? [resolveEngineModel(getNajeModel('image_core')), resolveEngineModel(getNajeModel('image_lite'))]
        : [resolveEngineModel(getNajeModel('core')), resolveEngineModel(getNajeModel('lite')), resolveEngineModel(getNajeModel('pro'))];

      const candidateModels = [
        configuredFallback,
        ...defaultFallbacks
      ].filter(Boolean) as string[];

      for (const fallbackModel of candidateModels) {
        if (fallbackModel === primaryModel) continue;
        try {
          console.warn(`[Model Fallback] ${primaryModel} failed (${error.message?.slice(0, 80)}). Retrying with fallback model ${fallbackModel}...`);
          const fbConfig = { ...baseConfig };
          if (!fbConfig.maxOutputTokens && !fallbackModel.includes('image')) {
            fbConfig.maxOutputTokens = getDefaultMaxOutputTokensForModel(fallbackModel);
          }
          const fbResult = await ai.models.generateContent({
            ...mergedOptions,
            config: {
              ...fbConfig,
              maxOutputTokens: fbConfig.maxOutputTokens || getDefaultMaxOutputTokensForModel(fallbackModel)
            },
            model: resolveEngineModel(fallbackModel)
          });

          if (endpointId) {
            updateEndpointHealthOnSuccess(endpointId, fallbackModel).catch(() => {});
          }
          return fbResult;
        } catch (retryErr: any) {
          console.warn(`[Model Fallback] ${fallbackModel} also failed:`, retryErr?.message?.slice(0, 80));
          // try next model
        }
      }
    }
    throw error;
  }
}

async function queryDocByFieldRest(collectionPath: string, fieldName: string, fieldValue: string, _token?: string): Promise<any[] | null> {
  try {
    const snap = await dbAdmin.collection(collectionPath).where(fieldName, '==', fieldValue).limit(1).get();
    if (!snap.empty) {
      return snap.docs.map(d => ({
        id: d.id,
        ref: d.ref.path,
        ...d.data()
      }));
    }
  } catch (e) {
    // dbAdmin failed, try REST fallback below
  }

  try {
    const docs = await queryDocsByFieldRest(collectionPath, fieldName, fieldValue, _token, 1);
    return docs;
  } catch (e) {
    return null;
  }
}

function decodeFirestoreValue(valObj: any): any {
  if (!valObj || typeof valObj !== 'object') return null;
  if ('stringValue' in valObj) return valObj.stringValue;
  if ('integerValue' in valObj) return parseInt(valObj.integerValue, 10);
  if ('doubleValue' in valObj) return parseFloat(valObj.doubleValue);
  if ('booleanValue' in valObj) return valObj.booleanValue;
  if ('nullValue' in valObj) return null;
  if ('timestampValue' in valObj) return valObj.timestampValue;
  if ('bytesValue' in valObj) return valObj.bytesValue;
  if ('arrayValue' in valObj) {
    const arr = valObj.arrayValue?.values || [];
    return arr.map((item: any) => decodeFirestoreValue(item));
  }
  if ('mapValue' in valObj) {
    const mapFields = valObj.mapValue?.fields || {};
    const res: any = {};
    for (const [k, v] of Object.entries<any>(mapFields)) {
      res[k] = decodeFirestoreValue(v);
    }
    return res;
  }
  return null;
}

function firestoreRestToObj(doc: any): any {
  if (!doc) return null;
  const docId = doc.name ? doc.name.split('/').pop() : undefined;
  const fields = doc.fields || {};
  const res: any = { id: docId };
  for (const [k, v] of Object.entries<any>(fields)) {
    res[k] = decodeFirestoreValue(v);
  }
  return res;
}

function encodeFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(encodeFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: any = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = encodeFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function objToFirestoreRest(obj: any): any {
  const fields: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && k !== 'id' && k !== 'ref') {
      fields[k] = encodeFirestoreValue(v);
    }
  }
  return { fields };
}

async function getDocRest(collectionPath: string, docId: string, _token?: string): Promise<any | null> {
  try {
    const docRef = dbAdmin.doc(`${collectionPath}/${docId}`);
    const snap = await docRef.get();
    if (snap.exists) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (e) {
    // dbAdmin failed, fallback to REST API
  }

  try {
    const headers: Record<string, string> = {};
    if (_token) headers['Authorization'] = `Bearer ${_token}`;
    const url = `${BASE_URL}/${collectionPath}/${docId}`;
    const res = await fetch(url, { headers });
    if (res.status === 200) {
      const data = await res.json();
      return firestoreRestToObj(data);
    }
    if (res.status === 404) return null;
  } catch (err) {
    // quiet
  }
  return null;
}

async function queryDocsByFieldRest(collectionPath: string, fieldName: string, fieldValue: string, _token?: string, limitVal: number = 500): Promise<any[] | null> {
  try {
    const snap = await dbAdmin.collection(collectionPath).where(fieldName, '==', fieldValue).limit(limitVal).get();
    if (!snap.empty) {
      return snap.docs.map(d => ({
        id: d.id,
        ref: d.ref.path,
        ...d.data()
      }));
    }
  } catch (e) {
    // fallback
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (_token) headers['Authorization'] = `Bearer ${_token}`;
    const url = `${BASE_URL}:runQuery`;
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: collectionPath }],
        where: {
          fieldFilter: {
            field: { fieldPath: fieldName },
            op: 'EQUAL',
            value: encodeFirestoreValue(fieldValue)
          }
        },
        limit: limitVal
      }
    };
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(queryBody) });
    if (res.ok) {
      const results = await res.json();
      if (!Array.isArray(results) || results.length === 0) return null;
      const validDocs = results.filter((item: any) => item.document);
      if (validDocs.length === 0) return null;
      return validDocs.map((item: any) => ({
        ...firestoreRestToObj(item.document),
        ref: `${collectionPath}/${item.document.name ? item.document.name.split('/').pop() : ''}`
      }));
    }
  } catch (err) {
    // quiet
  }
  return null;
}

async function listCollectionRest(collectionPath: string, _token?: string, limitVal: number = 500): Promise<any[] | null> {
  try {
    const snap = await dbAdmin.collection(collectionPath).limit(limitVal).get();
    if (!snap.empty) {
      return snap.docs.map(d => ({
        id: d.id,
        ref: d.ref.path,
        ...d.data()
      }));
    }
  } catch (e) {
    // fallback
  }

  try {
    const headers: Record<string, string> = {};
    if (_token) headers['Authorization'] = `Bearer ${_token}`;
    const url = `${BASE_URL}/${collectionPath}?pageSize=${limitVal}`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];
      return docs.map((d: any) => ({
        ...firestoreRestToObj(d),
        ref: `${collectionPath}/${d.name ? d.name.split('/').pop() : ''}`
      }));
    }
  } catch (err) {
    // quiet
  }
  return null;
}

async function getCollectionRest(fullPath: string, _token?: string): Promise<any[] | null> {
  try {
    const snap = await dbAdmin.collection(fullPath).get();
    if (!snap.empty) {
      return snap.docs.map(d => ({
        id: d.id,
        ref: d.ref.path,
        ...d.data()
      }));
    }
  } catch (e) {
    // fallback
  }

  try {
    const headers: Record<string, string> = {};
    if (_token) headers['Authorization'] = `Bearer ${_token}`;
    const url = `${BASE_URL}/${fullPath}`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];
      return docs.map((d: any) => ({
        ...firestoreRestToObj(d),
        ref: `${fullPath}/${d.name ? d.name.split('/').pop() : ''}`
      }));
    }
  } catch (err) {
    // quiet
  }
  return null;
}

async function deleteDocRest(collectionPath: string, docId: string, _token?: string): Promise<void> {
  try {
    await dbAdmin.doc(`${collectionPath}/${docId}`).delete();
    return;
  } catch (e) {
    // fallback
  }

  try {
    const headers: Record<string, string> = {};
    if (_token) headers['Authorization'] = `Bearer ${_token}`;
    const url = `${BASE_URL}/${collectionPath}/${docId}`;
    await fetch(url, { method: 'DELETE', headers });
  } catch (err) {
    // quiet
  }
}

async function deleteQueryInBatchesRest(collectionPath: string, fieldName: string, fieldValue: string, token: string, label: string) {
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
  } catch (e: any) {
    console.error(`Error deleting documents from ${label} via REST for user ${fieldValue}:`, e);
  }
}

async function updateDocFieldsRest(collectionPath: string, docId: string, dataObj: any, _fieldsToUpdate?: string[], _token?: string): Promise<any> {
  try {
    await dbAdmin.doc(`${collectionPath}/${docId}`).update(dataObj);
    return { id: docId, ...dataObj };
  } catch (e) {
    // fallback
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (_token) headers['Authorization'] = `Bearer ${_token}`;
    let maskParam = '';
    if (_fieldsToUpdate && _fieldsToUpdate.length > 0) {
      maskParam = '?' + _fieldsToUpdate.map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
    }
    const url = `${BASE_URL}/${collectionPath}/${docId}${maskParam}`;
    const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(objToFirestoreRest(dataObj)) });
    if (res.ok) {
      return { id: docId, ...dataObj };
    }
  } catch (err) {
    // quiet
  }
  return { id: docId, ...dataObj };
}

async function createDocRest(collectionPath: string, dataObj: any, _token?: string): Promise<any> {
  try {
    const docRef = await dbAdmin.collection(collectionPath).add(dataObj);
    return { id: docRef.id, ...dataObj };
  } catch (e) {
    // fallback
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (_token) headers['Authorization'] = `Bearer ${_token}`;
    const url = `${BASE_URL}/${collectionPath}`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(objToFirestoreRest(dataObj)) });
    if (res.ok) {
      const data = await res.json();
      const newId = data.name ? data.name.split('/').pop() : undefined;
      return { id: newId, ...dataObj };
    }
  } catch (err) {
    // quiet
  }
  return { id: undefined, ...dataObj };
}

async function setDocRest(collectionPath: string, docId: string, dataObj: any, _token?: string): Promise<any> {
  try {
    await dbAdmin.doc(`${collectionPath}/${docId}`).set(dataObj, { merge: true });
    return { id: docId, ...dataObj };
  } catch (e) {
    // fallback
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (_token) headers['Authorization'] = `Bearer ${_token}`;
    const url = `${BASE_URL}/${collectionPath}/${docId}`;
    const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(objToFirestoreRest(dataObj)) });
    if (res.ok) {
      return { id: docId, ...dataObj };
    }
  } catch (err) {
    // quiet
  }
  return { id: docId, ...dataObj };
}

function asNumericBalance(value: any): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

async function grantStarterBalanceIfAbsent(
  uid: string,
  token: string,
  existingDoc: any
): Promise<{ balance: number; doc: any }> {
  const existing = asNumericBalance(existingDoc?.balance);
  if (existing !== null) {
    inMemoryBalances.set(uid, existing);
    return { balance: existing, doc: existingDoc };
  }

  const fieldPresent = existingDoc && Object.prototype.hasOwnProperty.call(existingDoc, 'balance');
  if (fieldPresent) {
    const fallback = inMemoryBalances.get(uid);
    return {
      balance: typeof fallback === 'number' ? fallback : 0,
      doc: existingDoc
    };
  }

  const starter = 5;
  if (isDbAdminAvailable) {
    try {
      const ref = dbAdmin.collection('users').doc(uid);
      const granted = await dbAdmin.runTransaction(async (tx: any) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return null;
        const data = snap.data() || {};
        const cur = asNumericBalance(data.balance);
        if (cur !== null) return cur;
        if (Object.prototype.hasOwnProperty.call(data, 'balance')) return 0;
        tx.set(ref, { balance: starter }, { merge: true });
        return starter;
      });
      if (typeof granted === 'number') {
        inMemoryBalances.set(uid, granted);
        return { balance: granted, doc: { ...existingDoc, balance: granted } };
      }
    } catch (e: any) {
      console.warn('[grantStarterBalanceIfAbsent] transaction note:', e?.message || e);
    }
  }

  if (token && !isDbAdminAvailable && existingDoc && !Object.prototype.hasOwnProperty.call(existingDoc, 'balance')) {
    try {
      await updateDocFieldsRest('users', uid, { balance: starter }, ['balance'], token);
      inMemoryBalances.set(uid, starter);
      return { balance: starter, doc: { ...existingDoc, balance: starter } };
    } catch (e: any) {
      console.warn('[grantStarterBalanceIfAbsent] REST grant note:', e?.message || e);
    }
  }

  const fallback = inMemoryBalances.get(uid);
  return {
    balance: typeof fallback === 'number' ? fallback : 0,
    doc: existingDoc
  };
}

async function getUserDocAndBalance(uid: string, token: string, decodedToken?: any): Promise<{ balance: number; doc: any }> {
  const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : '';
  const userEmail = (decodedToken?.email || '').trim().toLowerCase();
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
      // ignore REST error
    }
  }

  // Authoritative read if Admin SDK is available. We MUST distinguish "confirmed absent" from "read failed":
  // writing defaults on a transient failure is what reset existing users' balance + admin.
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
      confirmedAbsent = true; // read succeeded AND the doc genuinely does not exist
    } catch (e) {
      confirmedAbsent = false; // read failed — existence UNKNOWN, never write defaults
    }
  }

  if (!confirmedAbsent) {
    // Could not confirm a new user. Return display fallback WITHOUT caching 5
    // into the ledger (that cache was later written back and wiped real balances).
    const fallbackBal = inMemoryBalances.get(uid);
    return {
      balance: typeof fallbackBal === 'number' ? fallbackBal : 0,
      doc: { uid, isAdmin: isEnvAdmin, canAddAdmins: isEnvAdmin, balance: typeof fallbackBal === 'number' ? fallbackBal : 0 }
    };
  }

  // Genuinely new user: use .create() so a race can never clobber an existing document.
  const defaultBalance = 5;
  const initialUserData = {
    uid,
    email: decodedToken?.email || '',
    displayName: decodedToken?.name || '',
    balance: defaultBalance,
    isAdmin: isEnvAdmin ? true : false,
    canAddAdmins: isEnvAdmin ? true : false,
    hasAcceptedTerms: isEnvAdmin ? true : false,
    hasCompletedOnboarding: isEnvAdmin ? true : false,
  };
  inMemoryBalances.set(uid, defaultBalance);
  if (isDbAdminAvailable) {
    try {
      await dbAdmin.collection("users").doc(uid).create(initialUserData);
      return { balance: defaultBalance, doc: initialUserData };
    } catch (e) {
      // Already existed (race) or write failed — re-read and return the REAL doc, never overwrite.
      try {
        const snap2 = await dbAdmin.collection("users").doc(uid).get();
        if (snap2.exists) {
          const d = snap2.data();
          return grantStarterBalanceIfAbsent(uid, token, d);
        }
      } catch {}
      return { balance: defaultBalance, doc: initialUserData };
    }
  }
  return { balance: defaultBalance, doc: initialUserData };
}


// Resilient atomic balance mutation.
// Handles Admin SDK, Firestore REST adapter, and cached in-memory ledger.
// If read/write fails and no valid balance exists, fails with reason: 'ERROR'. Never invents a 1000 balance.
async function mutateBalanceAtomic(
  uid: string,
  delta: number,
  opts: { requireSufficient?: boolean; token?: string } = {}
): Promise<{ ok: boolean; newBalance: number; reason?: 'INSUFFICIENT' | 'ERROR' }> {
  const effectiveToken = opts.token || userTokenCache.get(uid);
  if (opts.token && uid) {
    userTokenCache.set(uid, opts.token);
  }

  // 1. Try Admin SDK transaction ONLY if dbAdmin has direct access
  if (isDbAdminAvailable) {
    const userRef = dbAdmin.collection('users').doc(uid);
    try {
      const result = await dbAdmin.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        let current: number;
        if (snap.exists && asNumericBalance((snap.data() as any)?.balance) !== null) {
          current = asNumericBalance((snap.data() as any).balance)!;
        } else {
          // Existing doc with no numeric balance, or missing doc: never invent a starter balance and write it.
          return { ok: false, newBalance: 0, reason: 'ERROR' as const };
        }

        const next = parseFloat((current + delta).toFixed(4));

        if (opts.requireSufficient && next < 0) {
          return { ok: false, newBalance: current, reason: 'INSUFFICIENT' as const };
        }

        const safeNext = parseFloat(next.toFixed(4));
        tx.set(userRef, { balance: safeNext, isNegativeBalance: safeNext < 0 }, { merge: true });
        inMemoryBalances.set(uid, safeNext);
        return { ok: true, newBalance: safeNext };
      });
      if (result.ok || result.reason === 'INSUFFICIENT') {
        return result;
      }
      // If transaction returned reason: 'ERROR', attempt REST fallback
    } catch (e: any) {
      const isPermDenied = e?.code === 7 || e?.code === 'PERMISSION_DENIED' || String(e?.message || '').includes('PERMISSION_DENIED');
      if (isPermDenied) {
        isDbAdminAvailable = false;
        console.log(`[mutateBalanceAtomic] Notice: Admin SDK direct gRPC access bypassed; active REST token adapter handles balance for user ${uid}.`);
      } else {
        console.warn(`[mutateBalanceAtomic] dbAdmin transaction note: ${e?.message || e}`);
      }
    }
  }

  // 2. REST API fallback using user's token
  if (effectiveToken) {
    try {
      const userDoc = await getDocRest("users", uid, effectiveToken);
      const restBal = userDoc ? asNumericBalance(userDoc.balance) : null;
      if (restBal === null) {
        return { ok: false, newBalance: 0, reason: 'ERROR' };
      }
      let current: number = restBal;

      const next = parseFloat((current + delta).toFixed(4));

      if (opts.requireSufficient && next < 0) {
        return { ok: false, newBalance: current, reason: 'INSUFFICIENT' };
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
    } catch (restErr: any) {
      console.error("[mutateBalanceAtomic] REST update failed:", restErr?.message || restErr);
      return { ok: false, newBalance: 0, reason: 'ERROR' };
    }
  }

  // 3. Fallback when neither Admin SDK nor REST token is available
  return { ok: false, newBalance: 0, reason: 'ERROR' };
}

const DEFAULT_TEXT_TOKEN_RATES: Record<string, {
  inputPointsPerBlock: number;
  inputTokenBlockSize: number;
  outputPointsPerBlock: number;
  outputTokenBlockSize: number;
  audioInputPointsPerBlock?: number;
  audioInputTokenBlockSize?: number;
}> = {
  'gemini-3.5-flash-lite': {
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1000,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1000,
    audioInputPointsPerBlock: 0.2,
    audioInputTokenBlockSize: 1000
  },
  'gemini-3.6-flash': {
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1000,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1000,
    audioInputPointsPerBlock: 0.2,
    audioInputTokenBlockSize: 1000
  },
  'gemini-3.7-flash': {
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1000,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1000,
    audioInputPointsPerBlock: 0.2,
    audioInputTokenBlockSize: 1000
  },
  'gemini-3.1-pro': {
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1000,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1000,
    audioInputPointsPerBlock: 0.2,
    audioInputTokenBlockSize: 1000
  },
  'gemini-3.1-pro-preview': {
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1000,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1000,
    audioInputPointsPerBlock: 0.2,
    audioInputTokenBlockSize: 1000
  },
};

/** Admin panel uses tier_* / ui_builder; the generate path uses text_* / ui_standard. Same rates. */
const TOKEN_ENDPOINT_ALIASES: Record<string, string[]> = {
  tier_lite: ['tier_lite', 'text_lite'],
  text_lite: ['text_lite', 'tier_lite'],
  tier_core: ['tier_core', 'text_core'],
  text_core: ['text_core', 'tier_core'],
  tier_max: ['tier_max', 'text_max'],
  text_max: ['text_max', 'tier_max'],
  ui_builder: ['ui_builder', 'ui_standard'],
  ui_standard: ['ui_standard', 'ui_builder'],
};

const CACHED_INPUT_RATE_MULT = 0.25; // Gemini implicit cache ≈ 25% of input price

type TokenRates = {
  inputPointsPerBlock: number;
  inputTokenBlockSize: number;
  outputPointsPerBlock: number;
  outputTokenBlockSize: number;
  audioInputPointsPerBlock?: number;
  audioInputTokenBlockSize?: number;
};

function ratesFromEndpointLike(data: any, fallback: TokenRates): TokenRates | null {
  if (!data) return null;
  const inputBlock = data.inputPointsPerBlock ?? data.inputPointsPer1k;
  const outputBlock = data.outputPointsPerBlock ?? data.outputPointsPer1k;
  if (inputBlock === undefined && outputBlock === undefined) return null;
  return {
    inputPointsPerBlock: Number(inputBlock ?? fallback.inputPointsPerBlock),
    inputTokenBlockSize: Number(data.inputTokenBlockSize > 0 ? data.inputTokenBlockSize : 1000),
    outputPointsPerBlock: Number(outputBlock ?? fallback.outputPointsPerBlock),
    outputTokenBlockSize: Number(data.outputTokenBlockSize > 0 ? data.outputTokenBlockSize : 1000),
    audioInputPointsPerBlock: data.audioInputPointsPerBlock ?? data.audioInputPointsPer1k ?? fallback.audioInputPointsPerBlock,
    audioInputTokenBlockSize: data.audioInputTokenBlockSize > 0 ? data.audioInputTokenBlockSize : 1000
  };
}

function extractGeminiUsage(usageMetadata: any): {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  thoughtsTokens: number;
} {
  const inputTokens = Number(usageMetadata?.promptTokenCount || 0);
  const candidates = Number(usageMetadata?.candidatesTokenCount || 0);
  const thoughtsTokens = Number(usageMetadata?.thoughtsTokenCount || 0);
  const cachedTokens = Number(usageMetadata?.cachedContentTokenCount || 0);
  const total = Number(usageMetadata?.totalTokenCount || 0);
  const thoughtsLookExtra = thoughtsTokens > 0 && (total === 0 || total >= inputTokens + candidates + thoughtsTokens - 8);
  const outputTokens = candidates + (thoughtsLookExtra ? thoughtsTokens : 0);
  return { inputTokens, outputTokens, cachedTokens, thoughtsTokens };
}

function mergeGeminiUsage(into: any, add: any) {
  if (!add) return into;
  into.promptTokenCount = (into.promptTokenCount || 0) + (add.promptTokenCount || 0);
  into.candidatesTokenCount = (into.candidatesTokenCount || 0) + (add.candidatesTokenCount || 0);
  into.cachedContentTokenCount = (into.cachedContentTokenCount || 0) + (add.cachedContentTokenCount || 0);
  into.thoughtsTokenCount = (into.thoughtsTokenCount || 0) + (add.thoughtsTokenCount || 0);
  into.totalTokenCount = (into.totalTokenCount || 0) + (add.totalTokenCount || 0);
  return into;
}

export async function getTextModelTokenRates(modelId: string): Promise<TokenRates> {
  const cleanId = (modelId || '').trim();
  const defaultRates: TokenRates = DEFAULT_TEXT_TOKEN_RATES[cleanId] || {
    inputPointsPerBlock: 0.1,
    inputTokenBlockSize: 1000,
    outputPointsPerBlock: 0.1,
    outputTokenBlockSize: 1000,
    audioInputPointsPerBlock: 0.2,
    audioInputTokenBlockSize: 1000
  };

  const idsToTry = TOKEN_ENDPOINT_ALIASES[cleanId] || [cleanId];
  const pick = (data: any): TokenRates | null => ratesFromEndpointLike(data, defaultRates);

  try {
    for (const id of idsToTry) {
      const fromCache = pick(modelEndpointCache.get(id));
      if (fromCache) return fromCache;
    }

    const fromModelKey = pick(modelEndpointCache.get(`model:${cleanId}`));
    if (fromModelKey) return fromModelKey;

    for (const id of idsToTry) {
      await getModelEndpointConfig(id, undefined, undefined).catch(() => null);
      const fromLoaded = pick(modelEndpointCache.get(id));
      if (fromLoaded) return fromLoaded;
    }

    for (const id of idsToTry) {
      try {
        const doc = await dbAdmin.collection('model_endpoints').doc(id).get();
        if (doc.exists) {
          const fromDoc = pick(doc.data());
          if (fromDoc) return fromDoc;
        }
      } catch {}
    }

    for (const id of idsToTry) {
      const fromSeed = pick(SEED_ENDPOINTS.find(s => s.id === id));
      if (fromSeed) return fromSeed;
    }

    const fromSeedModel = pick(SEED_ENDPOINTS.find(s => s.modelId === cleanId && s.pricingType !== 'per_generation'));
    if (fromSeedModel) return fromSeedModel;
  } catch {}

  return defaultRates;
}

/**
 * Reads real Gemini usageMetadata and atomically charges using admin input/output
 * block rates. Cached prompt tokens are billed at 25% of the input rate.
 * Do NOT call this for image/video generation — those stay flat per-unit.
 */
export async function chargeForTextModelUsage(
  uid: string,
  modelId: string,
  usageMetadata: { promptTokenCount?: number; candidatesTokenCount?: number; cachedContentTokenCount?: number; thoughtsTokenCount?: number; totalTokenCount?: number } | undefined,
  isAdmin: boolean = false
): Promise<{ charged: number; inputTokens: number; outputTokens: number; cachedTokens: number; thoughtsTokens: number; newBalance: number | null }> {
  const { inputTokens, outputTokens, cachedTokens, thoughtsTokens } = extractGeminiUsage(usageMetadata);

  if (isAdmin) {
    await createDocRest("api_cost_log", {
      uid: uid || 'admin',
      model: modelId,
      inputTokens,
      outputTokens,
      cachedContentTokenCount: cachedTokens,
      thoughtsTokenCount: thoughtsTokens,
      costInPoints: 0,
      billingType: 'per_token',
      isAdmin: true,
      createdAt: Date.now()
    }, undefined).catch(e => console.error("Admin api_cost_log write error:", e));
    return { charged: 0, inputTokens, outputTokens, cachedTokens, thoughtsTokens, newBalance: null };
  }

  if (!uid || uid === 'anonymous') {
    return { charged: 0, inputTokens: 0, outputTokens: 0, cachedTokens: 0, thoughtsTokens: 0, newBalance: null };
  }

  const rates = await getTextModelTokenRates(modelId);
  const inBlock = rates.inputTokenBlockSize > 0 ? rates.inputTokenBlockSize : 1000;
  const outBlock = rates.outputTokenBlockSize > 0 ? rates.outputTokenBlockSize : 1000;

  const uncachedInputTokens = Math.max(0, inputTokens - cachedTokens);
  const cost = parseFloat((
    ((uncachedInputTokens / inBlock) * rates.inputPointsPerBlock) +
    ((cachedTokens / inBlock) * (rates.inputPointsPerBlock * CACHED_INPUT_RATE_MULT)) +
    ((outputTokens / outBlock) * rates.outputPointsPerBlock)
  ).toFixed(4));

  let newBalance: number | null = null;
  if (cost > 0) {
    await mutateBalanceAtomic(uid, -cost, {}).then(res => {
      if (res.ok) newBalance = res.newBalance;
      else console.warn(`[chargeForTextModelUsage] Metered deduction notice for user ${uid}: ${res.reason}`);
    }).catch(e => console.error("Metered balance deduction error:", e));
  }

  if (cachedTokens > 0) {
    console.log(`[TokenMeter] cache hit model=${modelId} cached=${cachedTokens} uncachedIn=${uncachedInputTokens} out=${outputTokens} thoughts=${thoughtsTokens} cost=${cost}`);
  }

  await createDocRest("api_cost_log", {
    uid,
    model: modelId,
    inputTokens,
    outputTokens,
    cachedContentTokenCount: cachedTokens,
    thoughtsTokenCount: thoughtsTokens,
    costInPoints: cost,
    billingType: 'per_token',
    createdAt: Date.now()
  }, undefined).catch(e => console.error("api_cost_log write error:", e));

  return { charged: cost, inputTokens, outputTokens, cachedTokens, thoughtsTokens, newBalance };
}

async function updateUserBalance(uid: string, newBalance: number, _token?: string): Promise<boolean> {
  const roundedBalance = parseFloat(Math.max(0, newBalance).toFixed(2));
  try {
    await dbAdmin.collection("users").doc(uid).set({ balance: roundedBalance }, { merge: true });
    return true;
  } catch (e) {
    console.warn("updateUserBalance dbAdmin failed:", e);
  }
  return false;
}

// --- Auth + billing helpers for the creative media endpoints ---
async function requireAuth(req: any, res: any): Promise<{ uid: string; token: string; email?: string } | null> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split("Bearer ")[1];
  }

  if (!token) {
    res.status(401).json({ error: "غير مصرح." });
    return null;
  }
  try {
    const decoded = await getAuth().verifyIdToken(token);
    if (decoded.uid) userTokenCache.set(decoded.uid, token);
    return { uid: decoded.uid, token, email: decoded.email };
  } catch {
    res.status(401).json({ error: "فشل التحقق من التوكين." });
    return null;
  }
}

function isPrivilegedAdmin(userDoc: any, decodedToken?: { email?: string } | null): boolean {
  if (userDoc?.isAdmin === true) return true;
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!adminEmail) return false;
  const tokenEmail = (decodedToken?.email || '').trim().toLowerCase();
  return Boolean(tokenEmail && tokenEmail === adminEmail);
}

// Compute the flat cost of one media generation from the live pricing config.
async function mediaCost(token: string, kind: 'image' | 'video', durationSeconds = 0): Promise<number> {
  try {
    const pricing: any = await getPricing(token);
    let cost = kind === 'video'
      ? Math.max(0.5, (durationSeconds || 5) * (pricing?.video?.perSecond ?? 0.5))
      : (pricing?.image?.spectra ?? pricing?.image?.nova ?? pricing?.image?.base ?? 1);
    return parseFloat(Number(cost).toFixed(2));
  } catch {
    return kind === 'video' ? 2.5 : 1;
  }
}

// Deduct AFTER success. Returns the new balance (or null on failure). Never throws.
async function chargePoints(uid: string, _token: string, cost: number): Promise<number | null> {
  if (!cost || cost <= 0) return null;
  const r = await mutateBalanceAtomic(uid, -cost, { requireSufficient: true });
  return r.ok ? r.newBalance : null;
}

// Sliding-window rate limiter. In-memory: resets on deploy and is per-instance,
// which is acceptable as a first line of defence.
const rateBuckets = new Map<string, number[]>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (rateBuckets.get(key) || []).filter(t => t > cutoff);
  if (hits.length >= maxRequests) {
    const retryAfterSec = Math.ceil((hits[0] + windowMs - now) / 1000);
    rateBuckets.set(key, hits);
    return { allowed: false, retryAfterSec };
  }
  hits.push(now);
  rateBuckets.set(key, hits);
  return { allowed: true, retryAfterSec: 0 };
}

// Prevent unbounded memory growth from one-off users.
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [k, v] of rateBuckets) {
    const kept = v.filter(t => t > cutoff);
    if (kept.length === 0) rateBuckets.delete(k); else rateBuckets.set(k, kept);
  }
}, 10 * 60 * 1000);

export async function startServer(existingApp?: express.Express) {
  const app = existingApp || express();
  const alreadyListening = Boolean(existingApp);
  const activeUserTasks = new Set<string>();
  // PORT MUST BE HARDCODED TO 3000 FOR CLOUD RUN & REVERSE PROXY
  const PORT = 3000;


  const ALLOWED_ORIGINS = new Set([
    'https://naje-ai.qelvaai.com',
    'https://gen-lang-client-0549025293.web.app',
    'https://gen-lang-client-0549025293.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
  ]);

  // CORS Middleware for secure local, staging, and custom domain access
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const isAllowed = origin && (
      ALLOWED_ORIGINS.has(origin) ||
      /^https:\/\/[a-z0-9-]+-373938905126\.[a-z0-9-]+\.run\.app$/.test(origin) ||
      /^https:\/\/[a-z0-9-]+-32227028098\.[a-z0-9-]+\.run\.app$/.test(origin)
    );
    if (isAllowed && origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Vary', 'Origin');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Range');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  const json15mb = express.json({ limit: '15mb' });
  const json50mb = express.json({ limit: '50mb' });
  app.use((req, res, next) => {
    const parser = req.path === '/api/upload-media' ? json50mb : json15mb;
    return parser(req, res, next);
  });
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Token cache is filled only after verifyIdToken (see requireAuth).

  // Health check endpoint for Cloud Run, container startup, and load balancer probes
  app.get(['/api/health', '/health', '/healthz', '/_ah/health', '/_health', '/ping', '/livez', '/readyz'], (req, res) => {
    res.status(200).json({ status: "ok", timestamp: Date.now() });
  });

  // Bind ports immediately so Studio's 10s health probe succeeds even while
  // remaining routes are still being registered.
  let seedExecuted = false;
  const executeSeeds = () => {
    if (!seedExecuted) {
      seedExecuted = true;
      seedModelEndpointsIfMissing().catch(() => {});
      seedFormatPresetsIfMissing().catch(() => {});
    }
  };
  const bindPort = (port: number, role: string) => {
    const srv = http.createServer(app);
    srv.setTimeout(600000);
    srv.keepAliveTimeout = 600000;
    srv.headersTimeout = 601000;
    srv.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
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
  const ingressPortEarly = (envPortEarly && !isNaN(envPortEarly)) ? envPortEarly : 8080;
  if (!alreadyListening) {
    bindPort(ingressPortEarly, "Cloud Run Ingress");
    if (ingressPortEarly !== 3000) bindPort(3000, "App Port (3000)");
  }


  // Proxy Firebase Auth Handler requests so custom domain (e.g. naje-ai.qelvaai.com) can serve /__/auth/handler and /__/auth/action natively
  app.all(['/__/auth/*', '/__/auth'], async (req, res) => {
    try {
      const targetHost = `${PROJECT_ID}.firebaseapp.com`;
      const targetUrl = `https://${targetHost}${req.originalUrl}`;
      const headers: Record<string, string> = {
        'host': targetHost,
      };

      const headersToForward = [
        'accept',
        'accept-language',
        'accept-encoding',
        'content-type',
        'user-agent',
        'cookie',
        'authorization',
        'x-requested-with',
        'x-firebase-gmpid',
        'referer',
      ];

      for (const headerName of headersToForward) {
        if (req.headers[headerName]) {
          headers[headerName] = req.headers[headerName] as string;
        }
      }

      const fetchOptions: any = {
        method: req.method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, fetchOptions);
      const data = await response.arrayBuffer();
      
      res.status(response.status);
      response.headers.forEach((val, key) => {
        const lowerKey = key.toLowerCase();
        if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(lowerKey)) {
          res.setHeader(key, val);
        }
      });
      res.send(Buffer.from(data));
    } catch (e: any) {
      console.error("Firebase Auth Proxy Error:", e);
      res.status(500).send("Firebase Auth Proxy Error");
    }
  });

  // Helper: Content Safety Filtering
  const isSafePrompt = async (prompt: string, uid: string, type: string, token: string) => {
    const unsafeKeywords = [
      "جنسي", "مخدرات", "انتحار", "ارهاب",
      "porn", "suicide", "terrorist", "nude", "nsfw"
    ];
    // Use word boundaries for English to avoid false positives (e.g. unisex)
    // For Arabic, just check the words since they are less likely to be substrings
    const matchedKeyword = unsafeKeywords.find(kw => {
       if (/^[a-z]+$/.test(kw)) {
         const r = new RegExp(`\\b${kw}\\b`, 'i');
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
        reason: `فحص محلي: الكلمة المحظورة "${matchedKeyword}"`
      }, token).catch(e => console.error("Failed to log flagged request REST:", e));
      return { safe: false, reason: "عذراً، تم حظر هذا الطلب لمخالفته شروط سلامة المحتوى الخاصة بنا (فحص محلي)." };
    }

    try {
      const ai = createGenAIClient();
      const safetyCheck = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a content safety filter for an Arabic AI application called Naje AI. Analyze the following user prompt for safety issues (violence, self-harm, adult content, hate speech, dangerous weapons/explosives, extreme political incitement, illegal drugs).
Respond ONLY in JSON format with two keys:
"safe": true or false,
"reason": a short explanation in Arabic of why it was rejected, or "safe" if it is allowed.

User prompt: "${prompt}"`,
        config: { responseMimeType: "application/json", maxOutputTokens: OUTPUT_TOKEN_LIMITS.classification }
      });
      let rawText = safetyCheck.text || '{"safe":true}';
      let checkRes: { safe: boolean; reason?: string } = { safe: true };
      try {
         const cleanedText = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
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
          reason: `فحص متقدم الذكاء الاصطناعي: ${checkRes.reason}`
        }, token).catch(e => console.error("Failed to log flagged request REST:", e));
        return { safe: false, reason: `عذراً، تم حظر هذا الطلب لمخالفته شروط سلامة المحتوى الخاصة بنا: ${checkRes.reason}` };
      }
    } catch {
      // Local keyword verification has already verified and passed above.
      // If the secondary AI filter is rate-limited (429) or unavailable, proceed safely with local validation.
      return { safe: true };
    }
    return { safe: true };
  };

app.post('/api/upload-media', async (req, res) => {
  try {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const { uid } = auth;

    const rl = checkRateLimit(`upload:${uid}`, 30, 60 * 1000);
    if (!rl.allowed) {
      res.setHeader('Retry-After', String(rl.retryAfterSec));
      return res.status(429).json({ error: "تجاوزت حد الرفع. حاول لاحقاً.", retryAfterSec: rl.retryAfterSec });
    }

    const { path: storagePath, base64Data, mediaType } = req.body || {};
    if (!storagePath || typeof storagePath !== 'string' || !base64Data || typeof base64Data !== 'string') {
      return res.status(400).json({ error: "Missing storage path or base64Data" });
    }
    if (
      storagePath.includes('..') ||
      storagePath.includes('\\') ||
      storagePath.includes('\0') ||
      storagePath.startsWith('/') ||
      storagePath.includes('://')
    ) {
      return res.status(400).json({ error: "Invalid path" });
    }

    const normalized = storagePath.replace(/\/+/g, '/');
    const allowedPrefixes = [`generated_media/${uid}/`, `uploads/${uid}/`];
    let safePath: string;
    if (allowedPrefixes.some((prefix) => normalized.startsWith(prefix))) {
      const leaf = normalized.split('/').pop() || `file_${Date.now()}`;
      const safeLeaf = leaf.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
      const root = normalized.startsWith(`generated_media/${uid}/`) ? `generated_media/${uid}` : `uploads/${uid}`;
      safePath = `${root}/${safeLeaf}`;
    } else {
      const leaf = normalized.split('/').pop() || `file_${Date.now()}`;
      const safeLeaf = leaf.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
      safePath = `uploads/${uid}/${safeLeaf}`;
    }

    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const maxBytes = mediaType === 'video' ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    if (Math.floor(cleanBase64.length * 0.75) > maxBytes) {
      return res.status(413).json({ error: "الملف أكبر من الحد المسموح." });
    }
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length > maxBytes) {
      return res.status(413).json({ error: "الملف أكبر من الحد المسموح." });
    }

    const contentType =
      mediaType === 'video' ? 'video/mp4'
      : (mediaType === 'voice' || mediaType === 'audio') ? 'audio/wav'
      : 'image/png';

    const bucket = getStorage().bucket(STORAGE_BUCKET);
    const file = bucket.file(safePath);
    await file.save(buffer, {
      metadata: { contentType, metadata: { ownerId: uid } },
      public: true,
      resumable: false,
    });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${safePath}`;
    return res.json({ url: publicUrl });
  } catch (err: any) {
    console.warn("[Upload Media API] Storage save warning:", err?.message || err);
    return res.status(500).json({ error: err?.message || "Upload failed" });
  }
});

// ==========================================
// NAJI AD — MULTI-SHOT VIDEO GENERATION ENGINE
// ==========================================

async function generateSingleVeoShot(ai: any, params: {
  prompt: string;
  durationSeconds: number;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  modelId?: string;
  imageInput?: { imageBytes: string; mimeType: string };
  onProgress?: (attempt: number) => Promise<void>;
}): Promise<Buffer> {
  const videoModelId = resolveEngineModel(params.modelId || 'veo-lite');
  const veoParams: any = {
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
      mimeType: params.imageInput.mimeType || 'image/jpeg'
    };
  }

  let operation;
  try {
    operation = await ai.models.generateVideos(veoParams);
  } catch (veoErr: any) {
    if (params.resolution !== '720p') {
      console.warn(`[Veo Gen] Failed with resolution=${params.resolution}, retrying with 720p fallback:`, veoErr?.message || veoErr);
      veoParams.config.resolution = '720p';
      operation = await ai.models.generateVideos(veoParams);
    } else {
      throw veoErr;
    }
  }

  const op = new GenerateVideosOperation();
  op.name = operation.name;

  let done = false;
  let attempt = 0;
  const maxAttempts = 75;
  while (!done && attempt < maxAttempts) {
    const updated = await ai.operations.getVideosOperation({ operation: op });
    if (updated.done) {
      done = true;
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) throw new Error("لم يتم العثور على رابط تحميل الفيديو الناتج من Veo.");

      let videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! }
      });
      if (!videoRes.ok) {
        const altUri = uri.includes('?') ? `${uri}&key=${process.env.GEMINI_API_KEY}` : `${uri}?key=${process.env.GEMINI_API_KEY}`;
        videoRes = await fetch(altUri);
      }
      if (!videoRes.ok) {
        throw new Error(`تعذر تنزيل ملف الفيديو من الخادم (رمز الاستجابة: ${videoRes.status})`);
      }
      const arrayBuffer = await videoRes.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    attempt++;
    if (params.onProgress) {
      await params.onProgress(attempt).catch(() => {});
    }
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  if (!done) {
    throw new Error("انتهت مهلة انتظار توليد اللقطة من محرك الفيديو.");
  }
  throw new Error("فشل توليد الفيديو.");
}


async function extractFirstFrameFromFile(videoPath: string, outputPath: string): Promise<Buffer> {
  const ffmpeg = await getFfmpeg();
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath).seekInput(0).frames(1).output(outputPath)
      .on('end', async () => { try { resolve(await fs.promises.readFile(outputPath)); } catch(e){ reject(e); } })
      .on('error', err => reject(err)).run();
  });
}
async function checkShotContinuity(ai: any, lastFrameShot1: Buffer, firstFrameShot2: Buffer): Promise<{ passed: boolean; reason?: string }> {
  try {
    const b1 = lastFrameShot1.toString('base64');
    const b2 = firstFrameShot2.toString('base64');
    const verifyResp = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { data: b1, mimeType: 'image/jpeg' } },
          { inlineData: { data: b2, mimeType: 'image/jpeg' } },
          { text: "Compare these two consecutive video frames. They should show the same person with consistent facial features, and a plausible continuation of position/pose. Respond with passed=false only if there is an OBVIOUS, SEVERE discontinuity (e.g., completely different face, impossible pose jump) — minor lighting or angle differences are normal and should not fail the check.\nReturn JSON: { \"passed\": boolean, \"reason\": \"short explanation\" }" }
        ]
      }],
      config: { responseMimeType: "application/json" }
    });
    const parsed = JSON.parse(verifyResp.text || "{}");
    return { passed: parsed.passed !== false, reason: parsed.reason };
  } catch (e) { return { passed: true }; }
}


const MAX_SHOTS_PER_JOB = 4;
const PER_SHOT_POLL_BUDGET_MS = 75 * 4000; // 300,000ms = 5 minutes per shot (matches generateSingleVeoShot: maxAttempts=75, interval=4000ms)
// Worst-case budget calculation:
// 4 shots * 5 min = 20 min normal generation
// + up to 3 continuity retry attempts (3 * 5 min = 15 min)
// + ffmpeg frame extraction, concatenation, quality audits & Google Cloud Storage upload (15 min)
// Total safe derived budget: ~50 minutes (3,000,000 ms)
const STALE_JOB_THRESHOLD_MS = (MAX_SHOTS_PER_JOB * PER_SHOT_POLL_BUDGET_MS * 2) + (10 * 60 * 1000);


async function tryAcquireSlot(jobId: string, uid: string): Promise<boolean> {
  if (!isDbAdminAvailable) {
    const now = Date.now();
    const staleThreshold = now - STALE_JOB_THRESHOLD_MS;
    inMemoryQueue.activeJobs = inMemoryQueue.activeJobs.filter((job: any) => job.startedAt >= staleThreshold);
    inMemoryQueue.activeSlots = inMemoryQueue.activeJobs.length;

    if (inMemoryQueue.activeSlots < inMemoryQueue.maxConcurrentSlots) {
      inMemoryQueue.activeJobs.push({ jobId, uid, startedAt: now });
      inMemoryQueue.activeSlots = inMemoryQueue.activeJobs.length;
      return true;
    }

    const alreadyQueued = inMemoryQueue.queue.some((q: any) => q.jobId === jobId);
    if (!alreadyQueued) {
      inMemoryQueue.queue.push({ jobId, uid, enqueuedAt: now });
    }
    return false;
  }

  let reapedJobs: Array<{ jobId: string, uid: string }> = [];

  try {
    const acquired = await dbAdmin.runTransaction(async (tx) => {
      const ref = dbAdmin.collection('system_state').doc('naje_ad_queue');
      const snap = await tx.get(ref);
      let data = snap.exists ? snap.data() : { activeSlots: 0, maxConcurrentSlots: 4, queue: [], activeJobs: [] };
      
      const now = Date.now();
      const staleThreshold = now - STALE_JOB_THRESHOLD_MS;

      const activeJobs = data.activeJobs || [];
      const validJobs = activeJobs.filter((job: any) => job.startedAt >= staleThreshold);
      reapedJobs = activeJobs.filter((job: any) => job.startedAt < staleThreshold);

      data.activeJobs = validJobs;
      data.activeSlots = validJobs.length;

      if (data.activeSlots < data.maxConcurrentSlots) {
        data.activeJobs.push({ jobId, uid, startedAt: now });
        data.activeSlots = data.activeJobs.length;
        tx.set(ref, data, { merge: true });
        return true;
      }
      
      const alreadyQueued = (data.queue || []).some((q: any) => q.jobId === jobId);
      if (!alreadyQueued) {
        tx.set(ref, { 
          ...data, 
          queue: [...(data.queue || []), { jobId, uid, enqueuedAt: now }] 
        }, { merge: true });
      }
      
      return false;
    });

    // Handle side-effects of reaped jobs outside transaction
    for (const reaped of reapedJobs) {
      console.log(`[Naje Ad Queue] Reaping stale job ${reaped.jobId}`);
      try {
        const jobSnap = await dbAdmin.collection('generation_jobs').doc(reaped.jobId).get();
        if (jobSnap.exists) {
          const jobData = jobSnap.data();
          if (jobData && !['completed', 'failed'].includes(jobData.status)) {
            await dbAdmin.collection('generation_jobs').doc(reaped.jobId).update({
              status: 'failed',
              stepLabel: 'انتهت مهلة التنفيذ (Timeout)',
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
  } catch (txErr: any) {
    console.warn("[Naje Ad Queue] dbAdmin queue failed, falling back to inMemoryQueue:", txErr.message);
    isDbAdminAvailable = false;
    inMemoryQueue.activeJobs.push({ jobId, uid, startedAt: Date.now() });
    inMemoryQueue.activeSlots = inMemoryQueue.activeJobs.length;
    return true;
  }
}

async function releaseSlot(jobId: string): Promise<{ promotedJobId: string | null; promotedUid: string | null }> {
  if (!isDbAdminAvailable) {
    inMemoryQueue.activeJobs = inMemoryQueue.activeJobs.filter((j: any) => j.jobId !== jobId);
    inMemoryQueue.activeSlots = inMemoryQueue.activeJobs.length;
    let promotedJobId: string | null = null;
    let promotedUid: string | null = null;
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
      const ref = dbAdmin.collection('system_state').doc('naje_ad_queue');
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : { activeSlots: 0, maxConcurrentSlots: 4, queue: [], activeJobs: [] };
      
      const activeJobs = (data.activeJobs || []).filter((job: any) => job.jobId !== jobId);
      let newActive = activeJobs.length;
      const queue = [...(data.queue || [])];
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
  } catch (err: any) {
    console.warn("[Naje Ad Queue] dbAdmin releaseSlot fallback:", err.message);
    return { promotedJobId: null, promotedUid: null };
  }
}

async function getQueuePosition(jobId: string): Promise<number> {
  if (!isDbAdminAvailable) {
    return inMemoryQueue.queue.findIndex((q: any) => q.jobId === jobId);
  }
  try {
    const ref = dbAdmin.collection('system_state').doc('naje_ad_queue');
    const snap = await ref.get();
    if (!snap.exists) return -1;
    const data = snap.data();
    return (data.queue || []).findIndex((q: any) => q.jobId === jobId);
  } catch {
    return -1;
  }
}

async function startPromotedJob(jobId: string, uid: string) {
  try {
     let data: any = null;
     if (isDbAdminAvailable) {
       const doc = await dbAdmin.collection('generation_jobs').doc(jobId).get().catch(() => null);
       if (doc && doc.exists) data = doc.data();
     }
     if (!data) {
       const token = userTokenCache.get(uid);
       if (token) {
         data = await getDocRest("generation_jobs", jobId, token).catch(() => null);
       }
     }
     if (!data) { await releaseSlot(jobId); return; }
     const chargeResult = await mutateBalanceAtomic(uid, -data.consumedBalance, { requireSufficient: true });
     if (!chargeResult.ok) {
        const token = userTokenCache.get(uid);
        if (token) {
          await setDocRest("generation_jobs", jobId, {
            status: 'failed',
            error: 'نفذ رصيدك من النقاط أثناء الانتظار في الطابور.'
          }, token).catch(() => null);
        }
        const res = await releaseSlot(jobId);
        if (res.promotedJobId && res.promotedUid) startPromotedJob(res.promotedJobId, res.promotedUid);
        return;
     }
     const token = userTokenCache.get(uid) || "";
     if (token) {
       await setDocRest("generation_jobs", jobId, { status: 'planning', progress: 10 }, token).catch(() => null);
     }
     runNajeAdGeneration(jobId, uid, data.plan, data.prompt, data.brandProfile, data.aspectRatio, data.resolution, data.videoModelEndpoint, data.consumedBalance, token);
  } catch (e) {
     console.error("Promoted job start failed", e);
  }
}

async function extractLastFrameFromFile(videoPath: string, outputPath: string, durationSec: number): Promise<Buffer> {
  const ffmpeg = await getFfmpeg();
  return new Promise((resolve, reject) => {
    const seekTime = Math.max(0, durationSec - 0.15);
    ffmpeg(videoPath)
      .seekInput(seekTime)
      .frames(1)
      .output(outputPath)
      .on('end', async () => {
        try {
          const buf = await fs.promises.readFile(outputPath);
          resolve(buf);
        } catch (e) {
          reject(e);
        }
      })
      .on('error', (_err) => {
        ffmpeg(videoPath)
          .frames(1)
          .output(outputPath)
          .on('end', async () => {
            try {
              const buf = await fs.promises.readFile(outputPath);
              resolve(buf);
            } catch (e) {
              reject(e);
            }
          })
          .on('error', (err2) => reject(err2))
          .run();
      })
      .run();
  });
}

async function concatenateVideoFiles(videoPaths: string[], outputPath: string): Promise<string> {
  const ffmpeg = await getFfmpeg();
  return new Promise((resolve, reject) => {
    const listPath = `${outputPath}.concat.txt`;
    const listContent = videoPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
    fs.writeFileSync(listPath, listContent);

    ffmpeg()
      .input(listPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions(['-c', 'copy'])
      .output(outputPath)
      .on('end', () => {
        try { fs.unlinkSync(listPath); } catch (e) {}
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.warn("[FFmpeg concat] Direct copy failed, retrying with re-encode:", err?.message || err);
        ffmpeg()
          .input(listPath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions(['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-preset', 'ultrafast'])
          .output(outputPath)
          .on('end', () => {
            try { fs.unlinkSync(listPath); } catch (e) {}
            resolve(outputPath);
          })
          .on('error', (reErr) => {
            try { fs.unlinkSync(listPath); } catch (e) {}
            reject(reErr);
          })
          .run();
      })
      .run();
  });
}

app.post('/api/naje-ad/generate', async (req, res) => {
  let uid = '';
  let token = '';
  let deductedPoints = 0;
  // Security fix (Master Brief #19 Part C): Server-generated unique jobId
  // Completely ignore or reject client-supplied path/unvalidated IDs
  const jobId = `naje_ad_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح لك بالوصول" });
    }
    token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    uid = decodedToken.uid;

    const _userDocSnapForGate = await dbAdmin.collection('users').doc(uid).get();
    if (!checkFeatureAccess(res, _userDocSnapForGate.data(), 'najeAd')) return;

    const {
      prompt,
      duration = 8,
      aspectRatio = '16:9',
      resolution = '720p',
      model = 'veo',
      brandProfile
    } = req.body || {};

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: "يرجى كتابة وصف الفيديو المطلوب" });
    }

    // Input bounds check (Master Brief #19 Part D.2)
    if (prompt.length > 5000) {
      return res.status(400).json({ error: "طول وصف الفيديو يتجاوز الحد الأقصى المسموح به (5,000 حرف)." });
    }

    if (brandProfile?.referenceImageBase64) {
      if (typeof brandProfile.referenceImageBase64 !== 'string') {
        return res.status(400).json({ error: "صيغة الصورة المرجعية غير صالحة." });
      }
      if (brandProfile.referenceImageBase64.length > 14 * 1024 * 1024) {
        return res.status(400).json({ error: "حجم الصورة المرجعية يتجاوز الحد الأقصى المسموح به (10 ميجابايت)." });
      }
    }

    const selectedAspect = aspectRatio === '9:16' ? '9:16' : '16:9';
    const selectedRes = resolution === '1080p' ? '1080p' : '720p';

    // 1. Content Safety Check
    const safety = await isSafePrompt(prompt, uid, 'video', token);
    if (!safety.safe) {
      return res.status(400).json({ error: safety.reason || "تم حظر هذا الطلب لمخالفته شروط سلامة المحتوى" });
    }

    // 2. Fetch live pricing and feature config for Naje Ad
    const fullPricing = await getPricing(token);
    const najeAdConfig = fullPricing.najeAd || {
      enabled: true,
      pointsRatePerSecond: 2.5,
      durationOptionsSec: [4, 6, 8, 10, 12, 14, 16, 24, 30],
      maxShotsPerVideo: 4,
      defaultModelEndpointId: 'video_standard'
    };

    if (najeAdConfig.enabled === false) {
      return res.status(403).json({ error: "خدمة Naje Ad متوقفة مؤقتاً للتطوير والإدارة" });
    }

    const minDur = Math.min(...(najeAdConfig.durationOptionsSec || [4, 6, 8, 10, 12, 14, 16, 24, 30]));
    const maxDur = Math.max(...(najeAdConfig.durationOptionsSec || [4, 6, 8, 10, 12, 14, 16, 24, 30]));
    const requestedDuration = Math.min(Math.max(minDur, parseInt(duration) || 8), maxDur);

    const pointsRate = typeof najeAdConfig.pointsRatePerSecond === 'number' ? najeAdConfig.pointsRatePerSecond : 2.5;
    let endpointId = najeAdConfig.defaultModelEndpointId || 'video_standard';
    if (endpointId === 'video_omni') {
      endpointId = 'video_standard';
    }
    let videoModelEndpoint = await getModelEndpointConfig(endpointId, 'veo-3.1-lite-generate-preview');
    if (!videoModelEndpoint.supportedDurations || videoModelEndpoint.supportedDurations.join(',') !== '4,6,8') {
      console.warn('Endpoint', endpointId, 'does not support [4,6,8]. Falling back to video_standard.');
      endpointId = 'video_standard';
      videoModelEndpoint = await getModelEndpointConfig(endpointId, 'veo-3.1-lite-generate-preview');
    }

    // Build Plan
    const videoPlan = buildInitialPlan({
      rawPrompt: prompt.trim(),
      totalDurationSec: requestedDuration,
      aspectRatio: selectedAspect,
      model: videoModelEndpoint.modelId,
      brandProfile,
      pointsRatePerSecond: pointsRate
    });

    deductedPoints = videoPlan.totalEstimatedCostPoints;

    // 3. Check queue slot BEFORE charging
    const acquired = await tryAcquireSlot(jobId, uid);
    if (!acquired) {
      const position = await getQueuePosition(jobId);
      await setDocRest("generation_jobs", jobId, {
        ownerId: uid,
        userId: uid,
        status: 'queued',
        queuePosition: position,
        progress: 0,
        stepLabel: 'في طابور الانتظار...',
        type: 'naje_ad_video',
        plan: videoPlan,
        totalSteps: videoPlan.shots.length * 2 + 1,
        currentStepIndex: 0,
        totalDurationSec: videoPlan.totalDurationSec,
        aspectRatio: selectedAspect,
        resolution: selectedRes,
        consumedBalance: deductedPoints,
        prompt: prompt,
        brandProfile: brandProfile || null,
        videoModelEndpoint: videoModelEndpoint,
        createdAt: Date.now()
      }, token).catch(e => console.error("Firestore job init failed:", e));
      
      return res.json({
        status: 'queued',
        jobId,
        plan: videoPlan,
        queuePosition: position
      });
    }

    // Acquired immediately - charge and start
    const chargeResult = await mutateBalanceAtomic(uid, -deductedPoints, { requireSufficient: true });
    if (!chargeResult.ok) {
      await releaseSlot(jobId);
      return res.status(402).json({
        error: `رصيد النقاط غير كافٍ. يتطلب هذا الفيديو (${videoPlan.totalDurationSec} ثانية عبر ${videoPlan.shots.length} لقطات) ${deductedPoints} نقطة. رصيدك الحالي: ${chargeResult.newBalance} نقطة.`,
        currentBalance: chargeResult.newBalance,
        requiredPoints: deductedPoints
      });
    }

    await setDocRest("generation_jobs", jobId, {
      ownerId: uid,
      userId: uid,
      status: 'planning',
      progress: 10,
      stepLabel: 'جاري تحليل المشهد وبناء تسلسل اللقطات مع تثبيت الأسلوب...',
      type: 'naje_ad_video',
      plan: videoPlan,
      totalSteps: videoPlan.shots.length * 2 + 1,
      currentStepIndex: 0,
      totalDurationSec: videoPlan.totalDurationSec,
      aspectRatio: selectedAspect,
      resolution: selectedRes,
      consumedBalance: deductedPoints,
      prompt: prompt,
      brandProfile: brandProfile || null,
      videoModelEndpoint: videoModelEndpoint,
      createdAt: Date.now()
    }, token).catch(e => console.error("Firestore job init failed:", e));

    res.json({
      status: 'planning',
      jobId,
      plan: videoPlan,
      deductedPoints,
      newBalance: chargeResult.newBalance
    });

    runNajeAdGeneration(jobId, uid, videoPlan, prompt, brandProfile, selectedAspect, selectedRes, videoModelEndpoint, deductedPoints, token);
  } catch (err: any) {
    console.error("[Naje Ad API Error]:", err);
    return res.status(500).json({ error: err?.message || "حدث خطأ أثناء معالجة طلب توليد الفيديو" });
  }
});

async function runNajeAdGeneration(
  jobId: string,
  uid: string,
  videoPlan: any,
  prompt: string,
  brandProfile: any,
  selectedAspect: '16:9' | '9:16',
  selectedRes: '720p' | '1080p',
  videoModelEndpoint: any,
  deductedPoints: number,
  token: string
) {
  const workDir = path.join(os.tmpdir(), `naje_ad_${jobId}_${Date.now()}`);
  const shotVideoPaths: string[] = [];
  const intermediateFramePaths: string[] = [];

  try {
    await fs.promises.mkdir(workDir, { recursive: true });
    const ai = createGenAIClient();
    const totalShots = videoPlan?.shots?.length || 1;
    let previousShotPath: string | null = null;
    let previousLastFrameBuffer: Buffer | null = null;

    const memBefore = process.memoryUsage();
    console.log(`[Naje Ad Pipeline] Starting job ${jobId} for user ${uid}: ${videoPlan.totalDurationSec}s across ${totalShots} shot(s). Temp dir: ${workDir} | Heap: ${Math.round(memBefore.heapUsed / 1024 / 1024)}MB / RSS: ${Math.round(memBefore.rss / 1024 / 1024)}MB`);

    for (let i = 0; i < totalShots; i++) {
      const shot = videoPlan.shots[i];
      const shotNumber = i + 1;
      const isFirstShot = i === 0;

      let imageInput: { imageBytes: string; mimeType: string } | undefined = undefined;

      if (isFirstShot) {
        await setDocRest("generation_jobs", jobId, {
          status: 'generating_shot_1',
          progress: Math.round(15 + (1 / (totalShots * 2 + 1)) * 60),
          currentStepIndex: 1,
          stepLabel: totalShots === 1
            ? `جاري توليد الفيديو (${shot.durationSec} ثواني)...`
            : `جاري توليد اللقطة الأولى من ${totalShots} (${shot.durationSec} ثواني)...`,
        }, token);
      } else {
        // Continuity frame extraction from previous shot
        await setDocRest("generation_jobs", jobId, {
          status: 'extracting_continuity',
          progress: Math.round(15 + ((i * 2) / (totalShots * 2 + 1)) * 60),
          currentStepIndex: i * 2,
          stepLabel: `جاري استخراج الإطار المرجعي لضمان الاستمرارية البصرية للقطة ${shotNumber} من ${totalShots}...`,
        }, token);

        const framePath = path.join(workDir, `continuity_frame_${i}.jpg`);
        intermediateFramePaths.push(framePath);
        const lastFrameBuf = await extractLastFrameFromFile(previousShotPath!, framePath, videoPlan.shots[i - 1].durationSec);
        previousLastFrameBuffer = lastFrameBuf;
        const lastFrameBase64 = lastFrameBuf.toString('base64');
        imageInput = {
          imageBytes: lastFrameBase64,
          mimeType: 'image/jpeg'
        };

        await setDocRest("generation_jobs", jobId, {
          status: 'generating_shot_2',
          progress: Math.round(15 + ((i * 2 + 1) / (totalShots * 2 + 1)) * 60),
          currentStepIndex: i * 2 + 1,
          stepLabel: `جاري توليد اللقطة ${shotNumber} من ${totalShots} (${shot.durationSec} ثواني) بالربط البصري...`,
        }, token);
      }

      // Compile & Audit prompt for this specific shot
      const shotPrompt = await compileVideoPrompt(shot.prompt, shot.durationSec, selectedAspect, 'veo', brandProfile);
      const auditedShot = await auditVideoPrompt(ai, shotPrompt, shot.durationSec, selectedAspect, prompt);

      // Generate single shot via Veo
      let shotBuffer: Buffer | null = await generateSingleVeoShot(ai, {
        prompt: auditedShot,
        durationSeconds: shot.durationSec,
        aspectRatio: selectedAspect,
        resolution: selectedRes,
        modelId: videoModelEndpoint.modelId,
        imageInput,
        onProgress: async (attempt) => {
          const baseProgress = Math.round(15 + ((i * 2 + 1) / (totalShots * 2 + 1)) * 60);
          const dynamicProg = Math.min(baseProgress + Math.round((50 / (totalShots * 2 + 1)) * (attempt / 75)), 85);
          await updateDocFieldsRest("generation_jobs", jobId, { progress: dynamicProg }, ["progress"], token).catch(() => {});
        }
      });

      const shotPath = path.join(workDir, `shot_${shotNumber}.mp4`);
      await fs.promises.writeFile(shotPath, shotBuffer);
      shotBuffer = null; // Free buffer immediately to avoid memory bloating

      // Continuity quality check at EVERY boundary (i > 0)
      if (!isFirstShot && previousLastFrameBuffer) {
        await setDocRest("generation_jobs", jobId, {
          status: 'quality_check',
          progress: Math.min(86, Math.round(15 + ((i * 2 + 1.5) / (totalShots * 2 + 1)) * 60)),
          stepLabel: `جاري فحص الاستمرارية والجودة بين اللقطة ${i} واللقطة ${shotNumber}...`
        }, token);

        const firstFramePath = path.join(workDir, `continuity_frame_${shotNumber}_first.jpg`);
        intermediateFramePaths.push(firstFramePath);
        let firstFrameBuffer: Buffer | null = await extractFirstFrameFromFile(shotPath, firstFramePath);
        const quality = await checkShotContinuity(ai, previousLastFrameBuffer, firstFrameBuffer);
        firstFrameBuffer = null; // Free memory

        if (!quality.passed) {
          console.warn(`[Naje Ad Pipeline] Continuity check failed at boundary ${i} -> ${shotNumber}:`, quality.reason);
          await setDocRest("generation_jobs", jobId, {
            status: 'quality_check',
            stepLabel: `جودة الاستمرارية منخفضة للقطة ${shotNumber}، جاري إعادة التوليد التلقائي...`
          }, token);

          let retryBuffer: Buffer | null = await generateSingleVeoShot(ai, {
            prompt: auditedShot,
            durationSeconds: shot.durationSec,
            aspectRatio: selectedAspect,
            resolution: selectedRes,
            modelId: videoModelEndpoint.modelId,
            imageInput
          });

          await fs.promises.writeFile(shotPath, retryBuffer);
          retryBuffer = null; // Free memory

          const firstFramePathRetry = path.join(workDir, `continuity_frame_${shotNumber}_first_retry.jpg`);
          intermediateFramePaths.push(firstFramePathRetry);
          let firstFrameBufferRetry: Buffer | null = await extractFirstFrameFromFile(shotPath, firstFramePathRetry);
          const qualityRetry = await checkShotContinuity(ai, previousLastFrameBuffer, firstFrameBufferRetry);
          firstFrameBufferRetry = null; // Free memory

          if (!qualityRetry.passed) {
            throw new Error(`quality_check_failed: فشل الحفاظ على استمرارية الملامح عند اللقطة ${shotNumber} بعد المحاولة الإضافية.`);
          }
        }
      }

      shotVideoPaths.push(shotPath);
      previousShotPath = shotPath;
    }

    let finalVideoPath = shotVideoPaths[0];

    // --- CONCATENATION (If Multi-Shot) ---
    if (shotVideoPaths.length > 1) {
      await setDocRest("generation_jobs", jobId, {
        status: 'concatenating',
        progress: 88,
        currentStepIndex: totalShots * 2,
        stepLabel: `جاري دمج ${shotVideoPaths.length} لقطات سينمائياً وإنتاج الفيديو الكامل...`,
      }, token);

      const mergedPath = path.join(workDir, 'final_merged.mp4');
      await concatenateVideoFiles(shotVideoPaths, mergedPath);
      finalVideoPath = mergedPath;

      // Free disk / tmpfs memory immediately by removing individual shots & frames
      for (const sp of shotVideoPaths) {
        try { await fs.promises.unlink(sp); } catch (_) {}
      }
      for (const fp of intermediateFramePaths) {
        try { await fs.promises.unlink(fp); } catch (_) {}
      }
    }

    // --- FINAL RENDER & UPLOAD ---
    await setDocRest("generation_jobs", jobId, {
      status: 'finalizing',
      progress: 95,
      stepLabel: 'جاري حفظ الفيديو وتجهيز الرابط النهائي للعرض والتحميل...',
    }, token);

    const finalVideoBuffer = await fs.promises.readFile(finalVideoPath);
    const memPeak = process.memoryUsage();
    console.log(`[Naje Ad Pipeline] Job ${jobId} final video size: ${(finalVideoBuffer.length / 1024 / 1024).toFixed(2)}MB | Peak Heap: ${Math.round(memPeak.heapUsed / 1024 / 1024)}MB / RSS: ${Math.round(memPeak.rss / 1024 / 1024)}MB`);
    let finalMediaUrl = '';
    let storageSuccess = false;

    const uploadAttempt = async () => {
      const storagePath = `users/${uid}/naje_ad/${jobId}_${Date.now()}.mp4`;
      const bucket = getStorage().bucket(STORAGE_BUCKET);
      const file = bucket.file(storagePath);
      await file.save(finalVideoBuffer, {
        metadata: { contentType: 'video/mp4' },
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
          status: 'failed',
          progress: 100,
          stepLabel: 'فشل رفع الفيديو إلى مساحة التخزين السحابية (Storage Error)'
        }, token);
        await mutateBalanceAtomic(uid, deductedPoints, {});
        return;
      }
    }

    // Save to generated_media collection
    await createDocRest('generated_media', {
      ownerId: uid,
      userId: uid,
      type: 'video',
      mediaType: 'video',
      mediaUrl: finalMediaUrl,
      prompt,
      totalDurationSec: videoPlan.totalDurationSec,
      shotsCount: videoPlan.shots.length,
      plan: videoPlan,
      consumedBalance: deductedPoints,
      aspectRatio: selectedAspect,
      resolution: selectedRes,
      createdAt: Date.now()
    }, token).catch(e => console.error("Failed to save to generated_media:", e));

    // Mark completed
    await setDocRest("generation_jobs", jobId, {
      status: 'completed',
      progress: 100,
      stepLabel: 'تم توليد وإخراج الفيديو بنجاح!',
      mediaUrl: finalMediaUrl,
      videoUrl: finalMediaUrl,
      resultUrl: finalMediaUrl,
      totalDurationSec: videoPlan.totalDurationSec,
      shotsCount: videoPlan.shots.length,
      consumedBalance: deductedPoints,
      completedAt: Date.now()
    }, token);

  } catch (pipelineErr: any) {
    console.error(`[Naje Ad Pipeline Error] Job ${jobId} failed:`, pipelineErr);
    
    // In case of error, refund points
    if (deductedPoints > 0) {
      await mutateBalanceAtomic(uid, deductedPoints, {}).catch(e => console.error("Refund failed:", e));
    }
    await setDocRest("generation_jobs", jobId, {
      status: 'failed',
      error: pipelineErr?.message || 'تعذر استكمال توليد الفيديو. تم استرجاع نقاطك بالكامل.',
      refundedPoints: deductedPoints,
      failedAt: Date.now()
    }, token).catch(e => console.error("Job update failed:", e));
  } finally {
    try {
      await fs.promises.rm(workDir, { recursive: true, force: true });
    } catch (_cleanErr) {}
    
    // Release Slot and promote next
    const res = await releaseSlot(jobId);
    if (res.promotedJobId && res.promotedUid) {
      startPromotedJob(res.promotedJobId, res.promotedUid);
    }
  }
}
  


app.post('/api/redeem-code', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح لك" });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err) {
      return res.status(401).json({ error: "رمز مرور غير صالح" });
    }
    const uid = decodedToken.uid;
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "كود غير صالح" });
    }
    
    try {
      // Resolve the code's document id first (transactions cannot run queries).
      const codeSnap = await dbAdmin.collection('redeem_codes').where('code', '==', code).limit(1).get();
      if (codeSnap.empty) {
        return res.status(400).json({ error: "كود غير صالح" });
      }
      const codeRef = codeSnap.docs[0].ref;
      const userRef = dbAdmin.collection('users').doc(uid);

      // Atomic check-and-write: prevents double redemption under concurrency.
      const outcome = await dbAdmin.runTransaction(async (tx) => {
        const codeDoc = await tx.get(codeRef);
        if (!codeDoc.exists) throw new Error("كود غير صالح");
        const c = codeDoc.data() as any;

        const maxUsage = c.maxUsage || 1;
        const usageCount = c.usageCount || 0;
        const usedByArray: string[] = Array.isArray(c.usedByArray) ? c.usedByArray : [];

        if (c.used || usageCount >= maxUsage) throw new Error("USED");
        if (usedByArray.includes(uid)) throw new Error("ALREADY");

        const addedPoints = c.points || 0;
        const userDoc = await tx.get(userRef);
        const currentBalance = (userDoc.exists ? Number((userDoc.data() as any).balance) : 0) || 0;
        const newBalance = parseFloat((currentBalance + addedPoints).toFixed(2));
        const newUsageCount = usageCount + 1;

        tx.update(codeRef, {
          used: newUsageCount >= maxUsage,
          usageCount: newUsageCount,
          usedByArray: [...usedByArray, uid],
          usedBy: uid,
          usedAt: Date.now(),
        });
        tx.set(userRef, { balance: newBalance, hasRecharged: true }, { merge: true });

        return { addedPoints, newBalance };
      });

      res.json(outcome);
    } catch (txErr: any) {
      const msg = txErr?.message === "USED" ? "هذا الكود مستخدم بالكامل"
        : txErr?.message === "ALREADY" ? "لقد قمت باستخدام هذا الكود مسبقاً"
        : (txErr?.message || "حدث خطأ");
      return res.status(400).json({ error: msg });
    }
  } catch(e) {
    res.status(400).json({ error: e.message || "حدث خطأ" });
  }
});

// ===== PayPal Payment & Points Integration =====

const getPayPalApiBase = () => (process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com');

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_SECRET || '';
  if (!clientId || !secret) {
    throw new Error('بيانات اعتماد PayPal غير متوفرة (PAYPAL_CLIENT_ID / PAYPAL_SECRET)');
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const apiBase = getPayPalApiBase();

  const resp = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!resp.ok) {
    const errText = await resp.text();
    console.error('PayPal OAuth token error:', resp.status, errText);
    throw new Error(`PayPal auth error: ${resp.status}`);
  }
  const data = await resp.json() as any;
  return data.access_token;
}

async function creditPointsForPayPalOrder(orderId: string, orderData: any): Promise<number> {
  let finalBalance = 0;
  await dbAdmin.runTransaction(async (tx) => {
    const orderRef = dbAdmin.collection('paypal_orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);

    if (orderSnap.exists && (orderSnap.data() as any)?.status === 'captured') {
      // idempotency: already credited, do nothing
      const uSnap = await tx.get(dbAdmin.collection('users').doc(orderData.user_id));
      finalBalance = (uSnap.exists ? Number((uSnap.data() as any)?.balance ?? (uSnap.data() as any)?.points_balance) : 0) || 0;
      return;
    }

    const userRef = dbAdmin.collection('users').doc(orderData.user_id);
    const userSnap = await tx.get(userRef);
    const currentBalance = (userSnap.exists ? Number((userSnap.data() as any)?.balance ?? (userSnap.data() as any)?.points_balance) : 0) || 0;
    const newBalance = parseFloat((currentBalance + orderData.points_requested).toFixed(2));
    finalBalance = newBalance;

    const currentTier = Number((userSnap.exists ? (userSnap.data() as any)?.highestPurchasedTier : 0) || 0);
    const purchasedTierRank = PACKAGE_TIER_RANK[orderData.package_id] || 0;
    const newTier = Math.max(currentTier, purchasedTierRank);

    tx.set(userRef, {
      balance: newBalance,
      points_balance: newBalance,
      hasRecharged: true,
      highestPurchasedTier: newTier,
    }, { merge: true });

    tx.update(orderRef, {
      status: 'captured',
      captured_at: new Date(),
    });

    tx.set(dbAdmin.collection('transactions').doc(), {
      user_id: orderData.user_id,
      type: 'credit',
      amount: orderData.points_requested,
      source: 'paypal',
      order_id: orderId,
      timestamp: new Date(),
    });
  });
  return finalBalance;
}

async function verifyPayPalWebhookSignature(req: any): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.warn('PAYPAL_WEBHOOK_ID is not configured');
    return false;
  }
  try {
    const accessToken = await getPayPalAccessToken();
    const apiBase = getPayPalApiBase();
    const resp = await fetch(
      `${apiBase}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          auth_algo: req.headers['paypal-auth-algo'],
          cert_url: req.headers['paypal-cert-url'],
          transmission_id: req.headers['paypal-transmission-id'],
          transmission_sig: req.headers['paypal-transmission-sig'],
          transmission_time: req.headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: req.body,
        }),
      }
    );
    if (!resp.ok) {
      console.warn('PayPal webhook verification request failed with status:', resp.status);
      return false;
    }
    const data = await resp.json() as any;
    return data.verification_status === 'SUCCESS';
  } catch (err) {
    console.error('PayPal webhook verification error:', err);
    return false;
  }
}

// PayPal Public Config Endpoint (Client ID, Mode, and Package tiers)
app.get('/api/paypal/config', (_req, res) => {
  const primaryTiers = ["pkg_5", "pkg_10", "pkg_20"];
  const packages = primaryTiers
    .filter(id => PAYPAL_POINTS_PACKAGES[id])
    .map(id => ({
      id,
      points: PAYPAL_POINTS_PACKAGES[id].points,
      usd: PAYPAL_POINTS_PACKAGES[id].usd,
    }));

  res.json({
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    mode: process.env.PAYPAL_MODE || 'sandbox',
    packages,
  });
});

// PayPal Create Order Endpoint
app.post('/api/paypal/create-order', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح لك" });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: "رمز مرور غير صالح" });
    }
    const uid = decodedToken.uid;

    const { package_id } = req.body;
    const pkg = PAYPAL_POINTS_PACKAGES[package_id];
    if (!pkg) {
      return res.status(400).json({ error: 'invalid_package' });
    }

    const accessToken = await getPayPalAccessToken();
    const apiBase = getPayPalApiBase();
    const orderResp = await fetch(`${apiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: pkg.usd.toFixed(2),
          },
          description: `Naje AI Points - ${pkg.points} points package`,
        }],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: 'استوديو ناجي للذكاء الاصطناعي',
              locale: 'ar-SA',
              landing_page: 'NO_PREFERENCE',
              user_action: 'PAY_NOW',
            },
          },
        },
      }),
    });
    const orderData = await orderResp.json() as any;

    if (!orderResp.ok || !orderData.id) {
      console.error('PayPal create-order failed:', orderData);
      return res.status(orderResp.status || 500).json({ error: 'paypal_create_failed', details: orderData });
    }

    await dbAdmin.collection('paypal_orders').doc(orderData.id).set({
      order_id: orderData.id,
      user_id: uid,
      package_id: package_id,
      points_requested: pkg.points,
      amount_usd: pkg.usd,
      status: 'created',
      created_at: new Date(),
      captured_at: null,
    });

    res.json({ order_id: orderData.id });
  } catch (err: any) {
    console.error('PayPal create-order error:', err);
    res.status(500).json({ error: err?.message || 'paypal_create_failed' });
  }
});

// PayPal Capture Order Endpoint (client fallback path)
app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح لك" });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: "رمز مرور غير صالح" });
    }
    const uid = decodedToken.uid;

    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ error: 'missing_order_id' });
    }

    const orderDoc = await dbAdmin.collection('paypal_orders').doc(order_id).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'order_not_found' });
    }
    const orderData = orderDoc.data() as any;

    if (orderData.user_id !== uid) {
      return res.status(403).json({ error: 'forbidden' });
    }
    if (orderData.status === 'captured') {
      // Already credited (idempotency guard) — don't double-credit
      return res.json({ status: 'already_captured', points_added: orderData.points_requested });
    }

    const accessToken = await getPayPalAccessToken();
    const apiBase = getPayPalApiBase();
    const captureResp = await fetch(
      `${apiBase}/v2/checkout/orders/${order_id}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    const captureData = await captureResp.json() as any;

    if (captureData.status !== 'COMPLETED') {
      console.warn('PayPal capture status was not COMPLETED:', captureData);
      return res.status(400).json({ error: 'capture_not_completed', details: captureData });
    }

    const newBalance = await creditPointsForPayPalOrder(order_id, orderData);

    res.json({ status: 'captured', points_added: orderData.points_requested, newBalance });
  } catch (err: any) {
    console.error('PayPal capture-order error:', err);
    res.status(500).json({ error: err?.message || 'paypal_capture_failed' });
  }
});

// PayPal Webhook Endpoint (source of truth)
app.post('/api/paypal/webhook', async (req, res) => {
  try {
    const isValid = await verifyPayPalWebhookSignature(req);
    if (!isValid) {
      console.warn('PayPal webhook signature verification failed');
      return res.status(400).send('invalid_signature');
    }

    const event = req.body;
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id || event.resource?.id;
      if (orderId) {
        const orderDoc = await dbAdmin.collection('paypal_orders').doc(orderId).get();
        if (orderDoc.exists && orderDoc.data()?.status !== 'captured') {
          await creditPointsForPayPalOrder(orderId, orderDoc.data());
          console.log(`[PayPal Webhook] Successfully credited points for order ${orderId}`);
        }
      }
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('PayPal webhook error:', err);
    res.status(500).send('error');
  }
});

// P3-8: Bulk Redeem-Code Generation (up to 5,000 codes with chunked batch writes)
app.post("/api/admin/bulk-codes", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken: any;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: "رمز مرور غير صالح" });
    }

    const adminUserDoc = await dbAdmin.collection('users').doc(decodedToken.uid).get();
    const isAdmin = adminUserDoc.exists && (adminUserDoc.data()?.role === 'admin' || adminUserDoc.data()?.isAdmin === true);
    if (!isAdmin) {
      return res.status(403).json({ error: "غير مصرح - صلاحيات المدير فقط مطلوبة" });
    }

    const { count = 10, points = 100, maxUsage = 1, prefix = "NAJE", codeLength = 8 } = req.body;
    const requestedCount = Math.min(Math.max(1, parseInt(count) || 1), 5000);
    const codePoints = Math.max(1, parseInt(points) || 100);
    const codeMaxUsage = Math.max(1, parseInt(maxUsage) || 1);
    const cleanPrefix = (prefix || "NAJE").toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const generateOneCode = () => {
      let part = '';
      for (let i = 0; i < codeLength; i++) {
        part += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return cleanPrefix ? `${cleanPrefix}-${part}` : part;
    };

    const generatedCodesSet = new Set<string>();
    while (generatedCodesSet.size < requestedCount) {
      generatedCodesSet.add(generateOneCode());
    }

    const allCodes = Array.from(generatedCodesSet);
    const batchId = `B_${Date.now().toString(36).toUpperCase()}`;
    const createdAt = Date.now();

    // Firestore batch limit is 500 ops per commit. We chunk by 450.
    const CHUNK_SIZE = 450;
    const chunks: string[][] = [];
    for (let i = 0; i < allCodes.length; i += CHUNK_SIZE) {
      chunks.push(allCodes.slice(i, i + CHUNK_SIZE));
    }

    const savedRecords: any[] = [];
    for (const chunk of chunks) {
      const batch = dbAdmin.batch();
      for (const c of chunk) {
        const ref = dbAdmin.collection('redeem_codes').doc();
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
  } catch (err: any) {
    console.error("[Bulk Codes Admin API Error]:", err);
    return res.status(500).json({ error: err.message || "فشل توليد الأكواد بالجملة" });
  }
});

app.delete("/api/user", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }
    const uid = decodedToken.uid;

    // 1. Clear active user tasks
    activeUserTasks.delete(uid);

    // 2. Cascade delete user data across collections before deleting auth & profile
    // 2.1. Chats (ownerId == uid)
    await deleteQueryInBatchesRest("chats", "ownerId", uid, token, "chats");

    // 2.2. Messages (ownerId == uid)
    await deleteQueryInBatchesRest("messages", "ownerId", uid, token, "messages");

    // 2.3. Projects (ownerId == uid)
    await deleteQueryInBatchesRest("projects", "ownerId", uid, token, "projects");

    // 2.4. Favorites (userId == uid)
    await deleteQueryInBatchesRest("favorites", "userId", uid, token, "favorites");

    // 2.5. Generation Jobs (uid == uid)
    await deleteQueryInBatchesRest("generation_jobs", "uid", uid, token, "generation_jobs (uid)");

    // 2.6. Generation Jobs (ownerId == uid)
    await deleteQueryInBatchesRest("generation_jobs", "ownerId", uid, token, "generation_jobs (ownerId)");

    // 3. Delete notifications (ownerId == uid)
    await deleteQueryInBatchesRest("notifications", "ownerId", uid, token, "notifications");

    // 4. Delete user document from 'users' collection
    try {
      await deleteDocRest("users", uid, token);
      await dbAdmin.collection("users").doc(uid).delete().catch(() => null);
      console.log(`Deleted user document from 'users' for user ${uid}`);
    } catch (e) {
      console.error("Failed to delete user doc in Firestore:", e);
    }

    // 5. Delete user's auth record from Firebase Auth
    await getAuth().deleteUser(uid);
    console.log(`Deleted auth record from Firebase for user ${uid}`);

    return res.json({ success: true, message: "تم حذف الحساب وكافة البيانات التابعة له بنجاح وبشكل نهائي." });
  } catch (error: any) {
    console.error("Account Deletion Error:", error);
    return res.status(500).json({ error: "فشل حذف الحساب: " + error.message });
  }
});

// Conversational gate for image/video chats.
// Uses Gemini 3.6 Flash to decide whether the message is a real generation
// request or just chat (greeting / question / advice). Returns:
//   { action: 'generate' }                      -> continue the normal pipeline
//   { action: 'chat', reply: 'نص الرد' }         -> reply only, no generation
async function classifyMediaIntent(
  apiKey: string,
  prompt: string,
  mediaType: 'image' | 'video',
  projectData?: any
): Promise<{ action: 'generate' | 'chat'; reply?: string }> {
  try {
    const kind = mediaType === 'video' ? 'فيديو' : 'صورة/تصميم';
    const projectLine = projectData?.name
      ? `\nالمستخدم داخل مشروع اسمه: "${projectData.name}".`
      : '';

    const ai = createGenAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt || '',
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.classification,
        systemInstruction:
`أنت "ناجي"، مساعد ودود لمنصة Naje AI. أنت الطبقة الأولى في دردشة توليد ${kind}.
مهمتك: تحديد هل رسالة المستخدم طلب فعلي لتوليد ${kind}، أم مجرد ترحيب/سؤال/استفسار/نقاش.${projectLine}

القواعد:
- إذا كانت الرسالة طلب تصميم/توليد واضح (مثل: "بدي لوغو لمطعم"، "صمملي بوستر"، "اعملي فيديو أنمي"، "logo cute لمحل قهوة") -> action = "generate".
- إذا كانت ترحيب أو سؤال أو استشارة أو نقاش أو شكر أو أي كلام لا يطلب توليد فعلي (مثل: "هلا"، "كيفك"، "شو بتنصحني؟"، "شو الفرق بين الموديلين؟"، "بتفهم عربي؟") -> action = "chat"، وأرفق رداً عربياً قصيراً ودوداً بلهجة سهلة، ووجّه المستخدم بلطف ليكتب طلب التصميم الذي يريده. لا توّلد أي شيء.
- عند الشك، وإذا كانت الرسالة قصيرة جداً أو غامضة ولا تصف تصميماً -> action = "chat".

أعد فقط JSON بالشكل:
{"action":"generate"} 
أو 
{"action":"chat","reply":"ردك العربي هنا"}
بدون أي نص إضافي وبدون علامات Markdown.`
      }
    });

    let raw = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.action === 'chat') {
      return { action: 'chat', reply: parsed.reply || 'أهلاً! اكتبلي وصف التصميم اللي ببالك وأنا بجهّزهولك 🎨' };
    }
    return { action: 'generate' };
  } catch (e) {
    // On any failure, fail OPEN to generation so we never block a real request.
    console.error('classifyMediaIntent failed, defaulting to generate:', e);
    return { action: 'generate' };
  }
}

// Analyzes how much text the user wants rendered INSIDE the image and how risky
// that is for the selected model. Arabic is stricter than Latin because RTL +
// connected letterforms degrade earlier.
function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

// TEXT-RISK ANALYSIS (Gemini 3.6 Flash)
// Determines if prompt contains text to be rendered INSIDE the generated image
// and calculates precise word statistics to warn user about potential spelling/rendering degradation
async function analyzeTextRisk(apiKey: string, prompt: string): Promise<{
  hasText: boolean; wordCount: number; extractedText: string; script: 'arabic' | 'latin' | 'other'; risk: 'none' | 'low' | 'medium' | 'high';
}> {
  try {
    const ai = createGenAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt || '',
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.classification,
        systemInstruction:
`حلّل طلب توليد الصورة التالي وحدّد النص المطلوب كتابته **داخل** الصورة (شعار، لافتة، عنوان، ملصق، جملة مكتوبة...).
لا تحسب الكلام الوصفي عن الأسلوب أو الألوان أو البيئة — استخرج فقط النص الحقيقي والكلمات الحرفية التي ستظهر مرسومة في الصورة.

أعد JSON فقط بهذا الشكل:
{"hasText": true/false, "text": "النص المطلوب حرفياً أو سلسلة فارغة", "wordCount": عدد الكلمات الحقيقي للنص المطلوب كتابته فقط, "script": "arabic" أو "latin" أو "other"}

إذا لم يُطلب أي نص داخل الصورة: {"hasText": false, "text": "", "wordCount": 0, "script": "other"}`
      }
    });
    const raw = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    const p = JSON.parse(raw);
    const extractedText = (p.text || '').trim();
    // Calculate precise word count directly from extracted text string if present
    const calculatedWordCount = extractedText 
      ? extractedText.split(/\s+/).filter(Boolean).length 
      : (Number(p.wordCount) || 0);

    const script = (p.script === 'arabic' || p.script === 'latin') 
      ? p.script 
      : (containsArabic(extractedText) ? 'arabic' : 'other');

    let risk: 'none' | 'low' | 'medium' | 'high' = 'none';
    if (p.hasText && calculatedWordCount > 0) {
      // Accurate thresholds for image model text rendering:
      // Arabic script degrades fast in standard image models due to RTL & character connectivity.
      // 1-2 words: Low risk (usually handled well)
      // 3-5 words: Medium risk (high probability of broken letters)
      // >5 words: High risk
      if (script === 'arabic') {
        if (calculatedWordCount <= 2) risk = 'low';
        else if (calculatedWordCount <= 5) risk = 'medium';
        else risk = 'high';
      } else {
        if (calculatedWordCount <= 3) risk = 'low';
        else if (calculatedWordCount <= 6) risk = 'medium';
        else risk = 'high';
      }
    }
    return { hasText: !!p.hasText, wordCount: calculatedWordCount, extractedText, script, risk };
  } catch (e) {
    console.error('analyzeTextRisk failed, assuming no risk:', e);
    return { hasText: false, wordCount: 0, extractedText: '', script: 'other', risk: 'none' };
  }
}

// ===== Project Memory REST Endpoints =====

app.post("/api/projects/:projectId/memory", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح" });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const { projectId } = req.params;

    let projData = await getDocRest("projects", projectId, token).catch(() => null);
    if (!projData) {
      try {
        const projSnap = await dbAdmin.collection("projects").doc(projectId).get();
        if (projSnap.exists) {
          projData = { id: projSnap.id, ...projSnap.data() };
        }
      } catch (e) {}
    }

    if (!projData) {
      return res.status(404).json({ error: "المشروع غير موجود" });
    }
    if (projData.ownerId !== uid) {
      return res.status(403).json({ error: "غير مصرح لك بتعديل ذاكرة هذا المشروع" });
    }

    const { type, label, content, url, fileData, mimeType, fileName } = req.body;
    if (!type || !label) {
      return res.status(400).json({ error: "يرجى تحديد نوع واسم عنصر الذاكرة" });
    }

    let memoryItems = await getCollectionRest(`projects/${projectId}/memory_items`, token).catch(() => null);
    if (!memoryItems) {
      try {
        const memorySnap = await dbAdmin
          .collection("projects")
          .doc(projectId)
          .collection("memory_items")
          .get();
        memoryItems = memorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        memoryItems = [];
      }
    }

    let currentTotalSizeBytes = 0;
    memoryItems.forEach((d) => {
      currentTotalSizeBytes += (d.sizeBytes || 0);
    });

    const MAX_PROJECT_MEMORY_BYTES = 10 * 1024 * 1024; // 10MB

    let rawTextContent = "";
    let itemSizeBytes = 0;
    let storageRef = "";

    if (type === 'text') {
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "النص المطلوب إضافته فارغ" });
      }
      rawTextContent = content.trim();
      itemSizeBytes = Buffer.byteLength(rawTextContent, 'utf-8');
      storageRef = rawTextContent;
    } else if (type === 'url') {
      if (!url || !url.trim()) {
        return res.status(400).json({ error: "يرجى تقديم رابط صحيح" });
      }
      try {
        rawTextContent = await ssrfSafeFetchUrl(url.trim());
      } catch (ssrfErr: any) {
        return res.status(400).json({ error: `فشل جلب محتوى الرابط: ${ssrfErr.message}` });
      }
      itemSizeBytes = Buffer.byteLength(rawTextContent, 'utf-8');
      storageRef = rawTextContent;
    } else if (type === 'file') {
      if (!fileData || !mimeType) {
        return res.status(400).json({ error: "يرجى رفع الملف بشكل صحيح" });
      }
      const fileBuffer = Buffer.from(fileData, 'base64');
      itemSizeBytes = fileBuffer.length;

      const ext = (fileName || label || '').split('.').pop()?.toLowerCase() || '';
      const textExtensions = ['txt', 'md', 'json', 'csv', 'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'xml', 'yaml', 'yml', 'c', 'cpp', 'h', 'java', 'go', 'rs', 'php', 'sql', 'sh', 'log', 'env', 'ini', 'conf'];

      const isTextMime = mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/javascript' || mimeType === 'application/xml';
      const isTextExtension = textExtensions.includes(ext);

      // 1. Direct UTF-8 decoding for known text/code files
      if (isTextMime || isTextExtension) {
        try {
          const utf8Text = fileBuffer.toString('utf-8');
          if (utf8Text && !utf8Text.includes('\uFFFD\uFFFD')) {
            rawTextContent = utf8Text.trim();
          }
        } catch (e) {
          // Fall back to Gemini transcription if UTF-8 fails
        }
      }

      // 2. Gemini model extraction for PDF, DOCX, Images, or binary documents
      if (!rawTextContent) {
        try {
          const ai = createGenAIClient();
          const transcribePrompt = `اقرأ واستخرج جميع النصوص والمحتوى الوارد في هذا المستند/الملف المرفق ("${fileName || label}") بدقة ووضوح. أرجع النص المستخرج بالكامل دون حذف أو اختصار.`;
          
          let cleanBase64 = fileData;
          let effectiveMime = mimeType;
          if (fileData && fileData.includes(',')) {
            const parts = fileData.split(',');
            cleanBase64 = parts[1];
            if (!effectiveMime || effectiveMime === 'application/octet-stream') {
              const mimeMatch = parts[0].match(/data:([^;]+);/);
              if (mimeMatch) effectiveMime = mimeMatch[1];
            }
          }
          if (ext === 'pdf') effectiveMime = 'application/pdf';
          else if (['png', 'jpeg', 'jpg', 'webp', 'gif'].includes(ext)) effectiveMime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

          const resGen = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: effectiveMime || 'application/octet-stream'
                }
              },
              transcribePrompt
            ],
            config: { maxOutputTokens: OUTPUT_TOKEN_LIMITS.mediaAnalysis }
          });
          rawTextContent = (resGen.text || '').trim();
        } catch (fileErr) {
          console.warn("File transcription warning:", fileErr);
        }
      }

      if (!rawTextContent) {
        rawTextContent = `ملف مرفق: ${fileName || label} (${mimeType})`;
      }
      storageRef = rawTextContent;
    }

    if (currentTotalSizeBytes + itemSizeBytes > MAX_PROJECT_MEMORY_BYTES) {
      const remainingMb = Math.max(0, (MAX_PROJECT_MEMORY_BYTES - currentTotalSizeBytes) / (1024 * 1024)).toFixed(2);
      return res.status(400).json({
        error: `حجم هذا العنصر (${(itemSizeBytes / (1024 * 1024)).toFixed(2)} MB) يتجاوز الحد الأقصى التراكمي المتبقي لذاكرة المشروع (${remainingMb} MB من أصل 10 MB). يرجى حذف عناصر قديمة أولاً.`
      });
    }

    const summary = await generateMemoryItemSummary(rawTextContent, label);

    const newItemPayload = {
      ownerId: uid,
      type,
      label: label.trim(),
      summary,
      content: storageRef.slice(0, 500000),
      storageRef: storageRef.slice(0, 500000),
      sizeBytes: itemSizeBytes,
      createdAt: Date.now()
    };

    let createdId = "";
    const createdRest = await createDocRest(`projects/${projectId}/memory_items`, newItemPayload, token).catch(() => null);
    if (createdRest && createdRest.id) {
      createdId = createdRest.id;
    } else {
      try {
        const docRef = await dbAdmin
          .collection("projects")
          .doc(projectId)
          .collection("memory_items")
          .add(newItemPayload);
        createdId = docRef.id;
      } catch (dbErr: any) {
        console.error("dbAdmin memory add failed:", dbErr);
        throw new Error("تعذر حفظ عنصر الذاكرة في قاعدة البيانات.");
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

  } catch (err: any) {
    console.error("Memory ingest error:", err);
    return res.status(500).json({ error: err.message || "فشل إضافة عنصر الذاكرة" });
  }
});

app.get("/api/projects/:projectId/memory", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح" });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const { projectId } = req.params;

    let projData = await getDocRest("projects", projectId, token).catch(() => null);
    if (!projData) {
      try {
        const projSnap = await dbAdmin.collection("projects").doc(projectId).get();
        if (projSnap.exists) {
          projData = { id: projSnap.id, ...projSnap.data() };
        }
      } catch (e) {}
    }

    if (!projData) {
      return res.status(404).json({ error: "المشروع غير موجود" });
    }
    if (projData.ownerId !== uid) {
      return res.status(403).json({ error: "غير مصرح لك بعرض ذاكرة هذا المشروع" });
    }

    let items = await getCollectionRest(`projects/${projectId}/memory_items`, token).catch(() => null);
    if (!items) {
      try {
        const memorySnap = await dbAdmin
          .collection("projects")
          .doc(projectId)
          .collection("memory_items")
          .orderBy("createdAt", "desc")
          .get();

        items = memorySnap.docs.map(doc => ({
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
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/projects/:projectId/memory/:itemId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح" });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const { projectId, itemId } = req.params;

    let projData = await getDocRest("projects", projectId, token).catch(() => null);
    if (!projData) {
      try {
        const projSnap = await dbAdmin.collection("projects").doc(projectId).get();
        if (projSnap.exists) {
          projData = { id: projSnap.id, ...projSnap.data() };
        }
      } catch (e) {}
    }

    if (!projData || projData.ownerId !== uid) {
      return res.status(403).json({ error: "غير مصرح" });
    }

    let itemData = await getDocRest(`projects/${projectId}/memory_items`, itemId, token).catch(() => null);
    if (!itemData) {
      try {
        const itemSnap = await dbAdmin
          .collection("projects")
          .doc(projectId)
          .collection("memory_items")
          .doc(itemId)
          .get();

        if (itemSnap.exists) {
          itemData = { id: itemSnap.id, ...itemSnap.data() };
        }
      } catch (e) {}
    }

    if (!itemData) {
      return res.status(404).json({ error: "عنصر الذاكرة غير موجود" });
    }

    return res.json(itemData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/projects/:projectId/memory/:itemId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح" });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const { projectId, itemId } = req.params;

    let projData = await getDocRest("projects", projectId, token).catch(() => null);
    if (!projData) {
      try {
        const projSnap = await dbAdmin.collection("projects").doc(projectId).get();
        if (projSnap.exists) {
          projData = { id: projSnap.id, ...projSnap.data() };
        }
      } catch (e) {}
    }

    if (!projData || projData.ownerId !== uid) {
      return res.status(403).json({ error: "غير مصرح" });
    }

    await deleteDocRest(`projects/${projectId}/memory_items`, itemId, token).catch(() => null);
    try {
      await dbAdmin
        .collection("projects")
        .doc(projectId)
        .collection("memory_items")
        .doc(itemId)
        .delete();
    } catch (e) {}

    return res.json({ success: true, deletedId: itemId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

function formatStepLabelWithProject(label: string, projectData: any): string {
  if (!label) return '';
  if (!projectData) return label;
  const pName = projectData.name || projectData.title || '';
  const bName = projectData.brandProfile?.brandName || projectData.brandProfile?.name || '';
  const nameToUse = pName || bName;
  if (!nameToUse) return label;
  
  if (label.startsWith('[مشروع') || label.startsWith(`[${nameToUse}]`)) return label;
  return `[مشروع ${nameToUse}] ${label}`;
}

app.post("/api/creative-concepts", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }

    const { brandName, industry, prompt, mode = "design", aspectRatio = "1:1" } = req.body;
    
    let combinedInput = prompt || "";
    if (brandName) combinedInput += `\nاسم العلامة التجارية: ${brandName}`;
    if (industry) combinedInput += `\nالمجال / الصناعة: ${industry}`;

    if (!combinedInput.trim()) {
      return res.status(400).json({ error: "يرجى تقديم تفاصيل المشروع أو فكرة التصميم." });
    }

    const ai = createGenAIClient();
    const concepts = await generateMaximumCreativity(ai, combinedInput, mode, aspectRatio, applyCreativeLayers);

    return res.json({
      success: true,
      concepts,
      cost: 0 // Concept generation is free planning step
    });
  } catch (err: any) {
    console.error("Error in /api/creative-concepts:", err);
    return res.status(500).json({ error: err.message || "حدث خطأ أثناء توليد المفاهيم الإبداعية." });
  }
});

// ===== CREATIVELY AI BACKEND ENDPOINTS =====

app.get(["/api/video-status", "/api/creatively/video-status"], async (req, res) => {
  try {
    const _auth = await requireAuth(req, res);
    if (!_auth) return;

    const operationName = req.query.operationName as string;
    if (!operationName) {
      return res.status(400).json({ error: "Missing operationName" });
    }
    const ai = createGenAIClient();
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    if (updated.done) {
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
        // Do NOT return the raw URI or any key-bearing URL to the client.
        // Clients must fetch via the server-side proxy: /api/video-download or /api/creatively/video-download
        return res.json({ progress: 100, done: true });
      }
    }
    return res.json({ progress: 65, done: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to check video status" });
  }
});

app.get(["/api/video-download", "/api/creatively/video-download"], async (req, res) => {
  try {
    const _auth = await requireAuth(req, res);
    if (!_auth) return;

    const operationName = req.query.operationName as string;
    if (!operationName) {
      return res.status(400).json({ error: "Missing operationName" });
    }
    const ai = createGenAIClient();
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    if (updated.done) {
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
        const videoUrl = uri.includes('?') ? `${uri}&key=${process.env.GEMINI_API_KEY}` : `${uri}?key=${process.env.GEMINI_API_KEY}`;
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
  } catch (err: any) {
    console.error("Video download error:", err);
    return res.status(500).json({ error: err.message || "Failed to download video" });
  }
});

app.get(["/api/gallery", "/api/creatively/gallery", "/api/designs", "/api/creatively/designs"], async (req, res) => {
  try {
    const _auth = await requireAuth(req, res); if (!_auth) return;
    const snap = await dbAdmin.collection("creatively_designs").where("ownerId", "==", _auth.uid).orderBy("createdAt", "desc").limit(50).get();
    const designs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ designs });
  } catch (err: any) {
    return res.json({ designs: [] });
  }
});

app.post(["/api/designs/rate", "/api/creatively/designs/rate"], async (req, res) => {
  try {
    const _auth = await requireAuth(req, res);
    if (!_auth) return;
    const { uid, token } = _auth;

    const rl = checkRateLimit(`rate_design:${uid}`, 30, 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({ error: `تجاوزت حد التقييم المسموح. يرجى المحاولة بعد ${rl.retryAfterSec} ثانية.` });
    }

    const { id, rating } = req.body || {};
    const numericRating = Number(rating);
    if (!id || typeof id !== 'string' || isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: "معرف التصميم أو قيمة التقييم غير صالحة (1-5)." });
    }

    // Record the user's specific rating and update design aggregated rating
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
  } catch (err: any) {
    console.error("Error in /api/designs/rate:", err);
    return res.status(500).json({ error: "فشل حفظ التقييم" });
  }
});

// =============================================================================
//  NAJE AI — Creative Studio backend  (MISSING ROUTES — ADD THESE)
//
//  The Studio page (src/pages/CreativelyAI.tsx, routed at /creative-studio &
//  /creative-ai) POSTs to  /api/creatively/generate  and polls
//  /api/creatively/video-status , but NEITHER route existed in server.ts, so
//  every Studio generation (logo / identity / video_ad / brand_kit) returned
//  404 and the whole Studio was dead.
//
//  This block ports the ORIGINAL creative-ai 2-stage "creative director"
//  pipeline (reference/_endpoint_generate.ts.txt) but adapted to Naje:
//    • activationCode-based (static "naje_authenticated") — NO Bearer gate,
//      matching the sibling /api/creatively/* routes.
//    • Naje models (Max = gemini-3.1-pro for strategy; gemini-3.1-flash-image +
//      imageConfig for image, exactly like /api/chat-designer in this build;
//      veo-3.1-lite-generate-preview for video, same as chat-designer).
//    • Reference images (productImages[] + baseImage) are attached as
//      inlineData with the data: prefix STRIPPED (Studio client sends them
//      WITH the prefix).
//    • Returns EXACTLY the shape the client reads:
//        image  -> { imageUrl, enhancedPrompt, conceptTitle, conceptExplanation,
//                    (+ brandKitSlogan/Colors/Typography/Guidelines for brand_kit) }
//        video  -> { type: 'video_operation', operationName }
//    • NO baked pricing in prompts (Naje pricing is dynamic in Firestore).
//
//  INSERT this whole block immediately BEFORE  app.post("/api/chat-designer", ...)
//  Depends only on names already in server.ts: GoogleGenAI,
//  GenerateVideosOperation, applyCreativeLayers.
// =============================================================================
app.post(["/api/creatively/generate"], async (req, res) => {
  try {
    const _auth = await requireAuth(req, res);
    if (!_auth) return;
    const { uid, token } = _auth;

    const _userDocSnapForGate = await dbAdmin.collection('users').doc(uid).get();
    if (!checkFeatureAccess(res, _userDocSnapForGate.data(), 'creativelyAI')) return;

    const _imageModel = (req.body.imageModel === 'lite' || req.body.imageModel === 'nova') ? req.body.imageModel : 'spectra';
    const _imageModelId = _imageModel === 'lite' ? 'gemini-3.1-flash-lite-image'
                        : _imageModel === 'nova' ? 'gemini-3-pro-image'
                        : 'gemini-3.1-flash-image';
    const _imagePrice = _imageModel === 'lite' ? 0.5 : _imageModel === 'nova' ? 1.5 : 1;

    // Dedicated safety rate limit specifically on the nova / image_pro tier (gemini-3-pro-image)
    if (_imageModel === 'nova' || _imageModelId === 'gemini-3-pro-image') {
      const rlNovaHr = checkRateLimit(`nova_hr:${uid}`, 30, 60 * 60 * 1000);
      if (!rlNovaHr.allowed) {
        return res.status(429).json({
          error: `وصلت للحد الأقصى لتوليد صور Imagen Pro لهذه الساعة (30 صورة/ساعة). يرجى الانتظار ${Math.max(1, Math.ceil(rlNovaHr.retryAfterSec / 60))} دقيقة.`
        });
      }
      const rlNovaDay = checkRateLimit(`nova_day:${uid}`, 150, 24 * 60 * 60 * 1000);
      if (!rlNovaDay.allowed) {
        return res.status(429).json({
          error: `وصلت للحد الأقصى اليومي لتوليد صور Imagen Pro (150 صورة/يوم).`
        });
      }
    }
    const {
      prompt,
      mode = "logo",                 // logo | identity | video_ad | brand_kit
      identityFormat,                // when mode === 'identity' (social_post/story/business_card/youtube_*/whatsapp_channel/full...)
      logoFormat,                    // when mode === 'logo'  ('default' | 'billboard')
      resultType,                    // when mode === 'video_ad'  ('video' | 'image')
      videoDuration,
      productImages = [],            // string[] data-URLs (WITH data: prefix)
      baseImage,                     // data-URL when editing an existing result
      logoName = "",                 // exact brand text to render
      aspectRatio: bodyAspect,
      selectedTraits = [],
      selectedEmotions = [],
      otherTrait = "",
      entityType,                    // company | non_profit | government | individual
      dimension,
      complexity,
      useCreativePro,
      selectedConceptPrompt,         // set when the user picked a concept card
      lang = "ar",
    } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!USE_VERTEX_AI && !apiKey) {
      return res.status(500).json({ error: "نواجه مشكلة مؤقتة في خوادم النظام الداخلي، يرجى المحاولة لاحقاً." });
    }
    if (!prompt && (!productImages || productImages.length === 0) && !selectedConceptPrompt) {
      return res.status(400).json({ error: "الوصف مطلوب لتوليد التصميم." });
    }

    const ai = createGenAIClient();

    // ---- Aspect ratio per mode (ported from the original) -------------------
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

    // ---- Font fidelity (solves garbled Arabic/logo text) --------------------
    const grandTypography =
      "\n\nGRAND TYPOGRAPHY: You have a premium Arabic & English font encyclopedia — explicitly name real fonts in the image prompt. English (Helvetica Neue, Inter, Poppins, Montserrat, Playfair Display, Cinzel, Bebas Neue, Space Grotesk, Clash Display, Futura). Arabic (Cairo, Tajawal, Almarai, Changa, Aref Ruqaa, Reem Kufi, Thuluth, Diwani, Naskh, El Messiri, Lalezar, IBM Plex Sans Arabic). No spelling mistakes. No random/gibberish text. Any requested text is rendered EXACTLY as given, in its ORIGINAL language.";

    // ---- CLIENT STRICT COMMANDS (traits / emotions / entity / style) --------
    let finalDimension = dimension;
    let finalComplexity = complexity;
    if (mode === "logo" && logoFormat === "default") {
      finalDimension = "2D";
      finalComplexity = "Simple (Minimalist, strictly preventing any chaotic complexity)";
    }
    const prefsText: string[] = [];
    if (finalDimension) prefsText.push(`Dimension/Style: ${finalDimension}`);
    if (finalComplexity) prefsText.push(`Complexity: ${finalComplexity}`);
    const entityMap: Record<string, string> = {
      company: "Client Entity Type: Company / Commercial Business. Prioritize highly professional, authoritative, premium, corporate aesthetics that build brand equity and commercial trust.",
      non_profit: "Client Entity Type: Non-profit / NGO. Prioritize community-oriented, impact-driven, inspiring, welcoming, warm aesthetics.",
      government: "Client Entity Type: Government / Public Sector. Prioritize official, stable, trustworthy, formal, authoritative aesthetics.",
      individual: "Client Entity Type: Individual / Personal Brand. Prioritize creative, personalized, approachable, distinctive, human-centric aesthetics.",
    };
    if (entityType && entityMap[entityType]) prefsText.push(entityMap[entityType]);
    const traits = [...(selectedTraits || []), otherTrait].filter(Boolean);
    if (traits.length > 0) prefsText.push(`Design Traits: ${traits.join(", ")}`);
    if (selectedEmotions && selectedEmotions.length > 0) {
      prefsText.push(`Emotions to Evoke: ${selectedEmotions.join(", ")}`);
    }
    const preferencesRules =
      prefsText.length > 0
        ? `\n\nCLIENT STRICT COMMANDS (ABSOLUTE, NON-NEGOTIABLE LAWS — must completely dominate the final image prompt; failing to incorporate these EXACTLY is a catastrophic failure):\n${prefsText.map((t) => "- " + t).join("\n")}`
        : "";
    const editDirectives = baseImage
      ? `\n\nEDITING DIRECTIVE: The user provided an existing design and wants edits: "${prompt}". Output an updated masterpiece prompt that MODIFIES the existing design per the request, keeping what they liked intact. Do NOT start from scratch unless explicitly asked.`
      : "";

    // ---- Reference images -> inlineData parts (STRIP data: prefix) ----------
    const refParts: any[] = [];
    const attach = (durl: any) => {
      if (!durl || typeof durl !== "string") return;
      const m = durl.match(/^data:([^;]+);base64,(.+)$/);
      if (m) refParts.push({ inlineData: { mimeType: m[1], data: m[2] } });
      else refParts.push({ inlineData: { mimeType: "image/png", data: durl.includes(",") ? durl.split(",")[1] : durl } });
    };
    (productImages || []).forEach(attach);
    if (baseImage) attach(baseImage);
    const refContextNote =
      refParts.length > 0
        ? `\n\nATTACHED REFERENCE IMAGES: Analyze them carefully, extract logos/products/style, and explicitly describe how they are seamlessly integrated/blended into the design in the final image prompt (image-to-image conditioning is supported). If the user named a camera style, state it describes CAMERA ANGLE/MOVEMENT only — never render a physical camera/drone in the scene.`
        : "";

    // =========================================================================
    //  VIDEO BRANCH  (mode video_ad + resultType 'video')  -> operation
    // =========================================================================
    if (mode === "video_ad" && resultType === "video") {
      const durSec = Math.max(4, Math.min(10, parseInt(String(videoDuration || "5").replace(/\D/g, ""), 10) || 5));
      let videoPrompt = selectedConceptPrompt || prompt || "Cinematic brand video";
      try {
        videoPrompt = await applyCreativeLayers(
          ai,
          `${prompt}${preferencesRules}${refContextNote}\nPRESERVE any requested on-screen text EXACTLY in its original language (never translate).`,
          "design",
          targetAspectRatio
        );
      } catch (_e) { /* fall back to raw prompt */ }

      const videoOp = await ai.models.generateVideos({
        model: "veo-3.1-lite-generate-preview",
        prompt: videoPrompt,
        config: {
          numberOfVideos: 1,
          aspectRatio: targetAspectRatio === "9:16" ? "9:16" : "16:9",
          durationSeconds: durSec,
        },
      });
      const _durSecCharge = Math.max(4, Math.min(10, parseInt(String(videoDuration || "5").replace(/\D/g, ""), 10) || 5));
      const _nb = await chargePoints(uid, token, await mediaCost(token, 'video', _durSecCharge));
      return res.json({ type: "video_operation", operationName: videoOp.name, ...(_nb !== null ? { newBalance: _nb } : {}) });
    }

    // =========================================================================
    //  STAGE A — creative-director strategy (JSON)
    // =========================================================================
    const modeRole =
      mode === "brand_kit"
        ? "You are a world-class brand strategist & art director building a cohesive brand identity kit presentation board (logo + business cards + stationery + social template, one unified premium color scheme)."
        : mode === "video_ad"
        ? "You are a world-class advertising creative director designing a single striking key-frame poster for a video ad concept."
        : mode === "logo" && logoFormat === "billboard"
        ? "You are a world-class signage & environmental designer creating a photoreal storefront signboard / outdoor billboard (16:9), with masterfully integrated Arabic calligraphy and dramatic dusk commercial lighting on a premium facade."
        : mode === "logo"
        ? "You are a world-class logo & brand-mark designer. Invent a clever, meaningful symbolic icon for the business domain and integrate it beautifully with the brand text."
        : "You are a world-class graphic designer producing an elite, magazine-quality visual.";

    let enhancedPrompt = "";
    let conceptTitle = "";
    let conceptExplanation = "";
    let brandKitSlogan: any = null;
    let brandKitColors: any = null;
    let brandKitTypography: any = null;
    let brandKitGuidelines: any = null;

    if (selectedConceptPrompt) {
      // The user already picked a concept: use it directly, skip re-expansion.
      enhancedPrompt = selectedConceptPrompt;
      conceptTitle = lang === "ar" ? "التصميم المختار" : "Selected concept";
      conceptExplanation = lang === "ar"
        ? "تم توليد التصميم بناءً على المفهوم الذي اخترته."
        : "Generated from your selected concept.";
    } else {
      const brandKitKeys = mode === "brand_kit"
        ? `, "brandKitSlogan" (a creative tagline in the user's language), "brandKitColors" (array of 4-5 hex strings), "brandKitTypography" (recommended heading + body fonts), "brandKitGuidelines" (short usage guidelines in the user's language)`
        : "";
      const strategySystem =
        `${modeRole}${preferencesRules}${editDirectives}${refContextNote}${grandTypography}\n\n` +
        `TEXT FIDELITY: If any brand name / slogan / number is provided, ALL of them must appear in the image prompt, each with explicit placement/hierarchy; never drop, merge, translate, or invent text. Arabic text must be rendered as flawless, correctly-connected calligraphy.\n\n` +
        `STRICT OUTPUT: Return ONLY a raw JSON object (no markdown, no backticks) with keys: "imagePrompt" (an elite English text-to-image prompt; keep any user-requested literal text EXACTLY, in its ORIGINAL language, in quotes), "conceptTitle", "conceptExplanation" (in the user's language)${brandKitKeys}. The imagePrompt MUST strictly match aspect ratio ${targetAspectRatio}.`;

      const strategyContents: any[] = [
        {
          role: "user",
          parts: [
            {
              text:
                `User request: ${prompt}\n` +
                `Exact brand text to render (if any): ${logoName && logoName.trim() ? `"${logoName}"` : "(none)"}\n` +
                `Design category: ${mode}${identityFormat ? " / " + identityFormat : ""}${logoFormat ? " / " + logoFormat : ""}\n` +
                `Target aspect ratio: ${targetAspectRatio}`,
            },
            ...refParts,
          ],
        },
      ];

      const strategyRes = await ai.models.generateContent({
        model: resolveEngineModel(useCreativePro ? getNajeModel('pro') : getNajeModel('core')),
        contents: strategyContents,
        config: { systemInstruction: strategySystem, responseMimeType: "application/json", maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler },
      });

      let raw = "";
      try { raw = strategyRes.text || ""; } catch { raw = ""; }
      raw = raw.replace(/```json|```/g, "").trim();
      let strat: any = {};
      try { strat = JSON.parse(raw); } catch (_e) {
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

    // ---- Logo/brand text lock (only allowed text) ---------------------------
    let finalImagePrompt = enhancedPrompt;
    if (logoName && logoName.trim() && (mode === "brand_kit" || mode === "logo")) {
      finalImagePrompt +=
        `\n\nABSOLUTE TEXT RULE: The ONLY text/letters allowed ANYWHERE in the image is EXACTLY "${logoName}". ` +
        `Do NOT generate any random/dummy/placeholder/UI text on any surface (mockups, cards, packaging stay blank & purely visual). ` +
        `If "${logoName}" is Arabic it MUST be flawless, connected Arabic calligraphy. Integrate a clever, relevant symbolic icon for the business domain, balanced beautifully with the text.`;
    }

    // =========================================================================
    //  STAGE B — image generation (same pattern as /api/chat-designer)
    // =========================================================================
    // One creative concept — run it through Naje's full creative layers (anti-slop + N-CORE) before generating.
    const creativelyPresetId = req.body?.preset || req.body?.formatPreset || req.body?.formatPresetId;
    const creativelySafeZone = getSafeZoneForPreset(creativelyPresetId);
    try { finalImagePrompt = await applyCreativeLayers(ai, finalImagePrompt, "design", targetAspectRatio, creativelySafeZone || undefined); } catch (_e) { /* keep the strategy prompt on failure */ }
    const imgRes = await ai.models.generateContent({
      model: _imageModelId,
      contents: { parts: [{ text: finalImagePrompt }, ...refParts] },
      config: { imageConfig: { aspectRatio: targetAspectRatio }, maxOutputTokens: OUTPUT_TOKEN_LIMITS.imageCompiler },
    });

    let base64Image = "";
    for (const part of imgRes.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) { base64Image = part.inlineData.data; break; }
    }
    const imageUrl = base64Image ? `data:image/png;base64,${base64Image}` : "";
    if (!imageUrl) {
      return res.status(502).json({ error: "تعذّر توليد الصورة، حاول مرة أخرى." });
    }

    const _nbImg = await chargePoints(uid, token, _imagePrice);
    return res.json({
      imageUrl,
      enhancedPrompt: finalImagePrompt,
      conceptTitle,
      conceptExplanation,
      ...(_nbImg !== null ? { newBalance: _nbImg } : {}),
      ...(mode === "brand_kit"
        ? { brandKitSlogan, brandKitColors, brandKitTypography, brandKitGuidelines }
        : {}),
    });
  } catch (err: any) {
    console.error("[/api/creatively/generate] error:", err);
    return res.status(500).json({ error: err?.message || "فشل توليد التصميم." });
  }
});

// -----------------------------------------------------------------------------
//  POST /api/creatively/video-status  — the Studio client polls this with a
//  JSON body { operationName } (the existing GET /api/video-status reads a query
//  param, so it does NOT match this call). Same polling logic, POST + body.
// -----------------------------------------------------------------------------
app.post(["/api/creatively/video-status", "/api/video-status"], async (req, res) => {
  try {
    const _auth = await requireAuth(req, res);
    if (!_auth) return;

    const operationName = req.body?.operationName;
    if (!operationName) {
      return res.status(400).json({ error: "Missing operationName" });
    }
    const ai = createGenAIClient();
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    if (updated.done) {
      // The client fetches the actual file via /api/creatively/video-download.
      return res.json({ progress: 100, done: true });
    }
    return res.json({ progress: 65, done: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to check video status" });
  }
});
app.post("/api/chat-designer", async (req, res) => {
  try {
    const _auth = await requireAuth(req, res);
    if (!_auth) return;
    const { uid, token } = _auth;

    const _userDocSnapForGate = await dbAdmin.collection('users').doc(uid).get();
    if (!checkFeatureAccess(res, _userDocSnapForGate.data(), 'creativelyAI')) return;

    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    const isAdmin = isPrivilegedAdmin(userDoc, { email: _auth.email });
    const userBalance = typeof userDoc?.balance === 'number' ? userDoc.balance : 0;
    const isNegativeBalance = userDoc?.isNegativeBalance === true;

    if (!isAdmin && (userBalance <= 0 || isNegativeBalance)) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.write(JSON.stringify({ type: 'result', data: { error: 'رصيدك غير كافٍ لإتمام هذا الطلب. يرجى شحن رصيدك للمتابعة.' } }) + '\n');
      return res.end();
    }

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.write(JSON.stringify({ type: 'status', status: 'thinking' }) + '\n');

    const { messages, lang = 'ar', baseImage, useCreativePro } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!USE_VERTEX_AI && !apiKey) {
      res.write(JSON.stringify({ type: 'result', data: { error: 'مفتاح الربط الداخلي غير متوفر، يرجى التواصل مع الدعم الفني.' } }) + '\n');
      return res.end();
    }

    const ai = createGenAIClient();
    const grandTypography =
      "\n\nيجب عليك استخدام موسوعة الخطوط الاحترافية عند توليد الصور أو الشعارات. اطلب من المولّد استخدام أحد هذه الخطوط الإنجليزية (Helvetica Neue, Inter, Poppins, Montserrat, Playfair Display, Cinzel, Lato, Bebas Neue, Space Grotesk, Plus Jakarta Sans, Outfit, Clash Display, SF Pro Display, Futura, Avenir) أو العربية (Kufam, Cairo, Tajawal, Almarai, Changa, Aref Ruqaa, Reem Kufi, Thuluth, Diwani, Naskh, Mada, El Messiri, Lalezar, Readex Pro, IBM Plex Sans Arabic, Somar, Alexandria).\nممنوع الأخطاء الإملائية. ممنوع النصوص العشوائية. النص المطلوب يُكتب حرفياً كما طلبه المستخدم وبنفس لغته. التصميم يجب أن يكون بمستوى وكالات التصميم العالمية.";
    const systemPrompt = (lang === 'ar'
      ? `أنت "يزن" — العقل الإبداعي في منصة Naje AI. مساعد ذكي ومصمم محترف بلهجة أردنية ودّية. مهمتك: توليد أفكار تصاميم، نصوص تسويقية، ومناقشة المستخدم لاختيار أفضل الألوان، الأبعاد، والأساليب الفنية، ثم توليد التصميم باحترافية عالية.`
      : `You are "Yazan", the creative mind of Naje AI — a smart assistant and professional designer.`) + grandTypography;

    const contents = (messages || []).map((m: any, index: number) => {
      const parts: any[] = [{ text: m.content || "" }];
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

    const chatResponse = await ai.models.generateContent({
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
      } as any
    });

    const fc = chatResponse.functionCalls?.[0];
    if (fc) {
      if (fc.name === 'generate_design') {
        const args = fc.args as any;
        res.write(JSON.stringify({ type: 'status', status: 'generating' }) + '\n');

        const imageModelId = resolveEngineModel(useCreativePro ? 'nano-banana-pro' : 'nano-banana-2');
        if (useCreativePro) {
          const rlNovaHr = checkRateLimit(`nova_hr:${uid}`, 30, 60 * 60 * 1000);
          if (!rlNovaHr.allowed) {
            res.write(JSON.stringify({ type: 'result', data: { error: 'وصلت للحد الأقصى لتوليد صور Imagen Pro لهذه الساعة (30 صورة/ساعة).' } }) + '\n');
            return res.end();
          }
          const rlNovaDay = checkRateLimit(`nova_day:${uid}`, 150, 24 * 60 * 60 * 1000);
          if (!rlNovaDay.allowed) {
            res.write(JSON.stringify({ type: 'result', data: { error: 'وصلت للحد الأقصى اليومي لتوليد صور Imagen Pro (150 صورة/يوم).' } }) + '\n');
            return res.end();
          }
        }
        const imgRes = await ai.models.generateContent({
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
        if (base64Image) { await chargePoints(uid, token, await mediaCost(token, 'image')); }
        res.write(JSON.stringify({
          type: 'result',
          data: {
            reply: lang === 'ar' ? 'لقد قمت بتوليد التصميم بناءً على الفكرة! ما رأيك؟' : 'I generated the design based on your idea!',
            imageUrl
          }
        }) + '\n');
        return res.end();
      } else if (fc.name === 'generate_video') {
        const args = fc.args as any;
        res.write(JSON.stringify({ type: 'status', status: 'generating' }) + '\n');

        const videoOp = await ai.models.generateVideos({
          model: resolveEngineModel('veo-lite'),
          prompt: args.prompt || 'Cinematic video shot',
          config: {
            numberOfVideos: 1,
            aspectRatio: args.aspectRatio || '16:9',
            durationSeconds: args.durationSeconds || 5
          }
        });

        await chargePoints(uid, token, await mediaCost(token, 'video', 5));
        res.write(JSON.stringify({
          type: 'result',
          data: {
            reply: lang === 'ar' ? 'بدأت بتوليد الفيديو السينمائي الآن...' : 'Started generating your cinematic video...',
            videoOperationName: videoOp.name,
            type: 'video_operation'
          }
        }) + '\n');
        return res.end();
      }
    }

    if (chatResponse.usageMetadata) {
      await chargeForTextModelUsage(uid, "gemini-3.6-flash", chatResponse.usageMetadata, isAdmin).catch(e => console.error("chat-designer metering error:", e));
    }

    res.write(JSON.stringify({ type: 'result', data: { reply: chatResponse.text || "" } }) + '\n');
    return res.end();
  } catch (err: any) {
    console.error("Chat designer error:", err);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/x-ndjson');
    }
    res.write(JSON.stringify({ type: 'result', data: { error: err.message || "Failed in chat designer" } }) + '\n');
    return res.end();
  }
});

// =============================================================================
//  NAJE AI — /api/creative-pro-chat  (FULL REWRITE)
//  Replaces the stubbed endpoint in server.ts.
//
//  WHY:  the client (src/components/creatively/CreativeAiProChat.tsx) already
//        ships 6 persona-mode cards (standard / thinking / search / image /
//        video / study), sends media, and expects functionCall + conceptOptions.
//        The old server threw ALL of that away (returned functionCall:null),
//        AND it read req.body as JSON while the client sent multipart FormData,
//        so `message` arrived undefined and the whole feature was dead.
//
//  THIS REWRITE:
//   - Reads JSON body (Naje convention: base64 data-URLs in JSON, no multer).
//   - Restores all 6 personas — REBRANDED to the Naje / "يزن" identity.
//   - Restores generate_image / generate_video tools + googleSearch (search mode).
//   - Restores the 5-concept flow via generateMaximumCreativity + applyCreativeLayers
//     (both ALREADY exist in server.ts — no new imports needed).
//   - Adds the grandTypography font-encyclopedia to image-oriented personas.
//   - NO hardcoded pricing in prompts (Naje pricing is dynamic in Firestore;
//     baking numbers in causes the exact "invented pricing" failure mode).
//   - Returns the exact contract the client was built for:
//        { text, functionCall, conceptOptions, thought }
//
//  DEPENDS ON (already present in server.ts — verify names before pasting):
//     GoogleGenAI, generateMaximumCreativity, applyCreativeLayers
//  MODELS (Naje tiers):  Core = "gemini-3.7-flash"   Max = "gemini-3.7-flash"
// =============================================================================

app.post("/api/creative-pro-chat", async (req, res) => {
  try {
    const _auth = await requireAuth(req, res);
    if (!_auth) return;
    const { uid, token } = _auth;

    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    const isAdmin = isPrivilegedAdmin(userDoc, { email: _auth.email });
    const userBalance = typeof userDoc?.balance === 'number' ? userDoc.balance : 0;
    const isNegativeBalance = userDoc?.isNegativeBalance === true;

    if (!isAdmin && (userBalance <= 0 || isNegativeBalance)) {
      return res.status(400).json({ error: "رصيدك غير كافٍ لإتمام هذا الطلب. يرجى شحن رصيدك للمتابعة." });
    }

    const {
      message,
      history,
      proMode = "standard",           // standard | thinking | search | image | video | study
      userName,
      media,                          // string[] of data-URLs ("data:image/png;base64,....")
      lang = "ar",
    } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!USE_VERTEX_AI && !apiKey) {
      return res.status(500).json({ error: "نواجه مشكلة مؤقتة في خوادم النظام الداخلي، يرجى المحاولة لاحقاً." });
    }
    const hasMedia = Array.isArray(media) && media.length > 0;
    if (!message && !hasMedia) {
      return res.status(400).json({ error: "الرسالة أو الوسائط مطلوبة." });
    }

    const ai = createGenAIClient();

    // ---- Font-fidelity anchor (solves garbled Arabic/logo text) -------------
    const grandTypography =
      "\n\nيجب عليك استخدام موسوعة الخطوط الاحترافية عند توليد الصور أو الشعارات. اطلب من المولّد استخدام أحد هذه الخطوط الإنجليزية (Helvetica Neue, Inter, Poppins, Montserrat, Playfair Display, Cinzel, Lato, Bebas Neue, Space Grotesk, Plus Jakarta Sans, Outfit, Clash Display, SF Pro Display, Futura, Avenir) أو العربية (Kufam, Cairo, Tajawal, Almarai, Changa, Aref Ruqaa, Reem Kufi, Thuluth, Diwani, Naskh, Mada, El Messiri, Lalezar, Readex Pro, IBM Plex Sans Arabic, Somar, Alexandria).\nممنوع الأخطاء الإملائية. ممنوع النصوص العشوائية. النص المطلوب يُكتب حرفياً كما طلبه المستخدم وبنفس لغته. التصميم يجب أن يكون بمستوى وكالات التصميم العالمية.";

    // ---- Tools --------------------------------------------------------------
    const tools: any[] = [];
    if (proMode === "search") {
      tools.push({ googleSearch: {} });
    } else {
      tools.push({
        functionDeclarations: [
          {
            name: "generate_image",
            description:
              "Generate a visual design, logo, or brand asset from a highly detailed prompt. Use when the user asks to create, draw, or generate an image, picture, logo, or brand identity.",
            parameters: {
              type: "OBJECT",
              properties: {
                prompt: {
                  type: "STRING",
                  description:
                    "The highly detailed prompt. TEXT RULES: 1) NEVER invent fake/gibberish text. 2) If the user asks for specific text, reproduce it EXACTLY character-for-character in its ORIGINAL language (do not translate, do not fix spelling). 3) If no text is requested, explicitly say no text/words/letters. 4) Avoid cheap cartoon styles unless explicitly asked; prefer cinematic, hyper-real, or premium 3D.",
                },
                aspectRatio: {
                  type: "STRING",
                  description: "Default 1:1. Supported: 1:1, 3:4, 4:3, 9:16, 16:9",
                },
                is_concept_selection: {
                  type: "BOOLEAN",
                  description:
                    "true ONLY when the user is picking one concept from a previously proposed list. false for a new image request.",
                },
              },
              required: ["prompt", "is_concept_selection"],
            },
          },
          {
            name: "generate_video",
            description:
              "Generate a high-quality animated video / video ad. Use when the user asks to create, make, or generate a video.",
            parameters: {
              type: "OBJECT",
              properties: {
                prompt: {
                  type: "STRING",
                  description:
                    "The video prompt. TEXT RULE: reproduce any requested on-screen text EXACTLY character-for-character in its ORIGINAL language.",
                },
                aspectRatio: {
                  type: "STRING",
                  description: "Supported: 16:9, 9:16, 1:1. Default 16:9",
                },
                durationSeconds: {
                  type: "NUMBER",
                  description: "Supported 4–10. Default 5",
                },
              },
              required: ["prompt", "aspectRatio", "durationSeconds"],
            },
          },
        ],
      });
    }

    // ---- Persona system instructions (REBRANDED to Naje / يزن) --------------
    // NOTE: identity is Naje's assistant "يزن". No legacy brand. No baked pricing.
    let systemInstruction =
      `أنت "يزن" — العقل الإبداعي الفائق لمنصة Naje AI. لست مساعداً عادياً؛ أنت مستشار إبداعي بذكاء استثنائي يخدم منصة Naje الرائدة في توليد الهويات البصرية، التصاميم الإعلانية، والفيديوهات السينمائية.\n\n💎 وعيك بذاتك 💎\n1. أنت عقل Naje المدبّر. إجاباتك ذكية، احترافية، استشارية، ومباشرة، بلهجة أردنية ودّية دون تصنّع. لا تستخدم عبارات روبوتية مبتذلة.\n2. الدردشة والاستشارات مجانية تماماً. أسعار توليد الصور/الفيديو/الهوية ديناميكية داخل نظام Naje — لا تخترع أي أرقام؛ إذا سُئلت عن سعر لم تُعطَه صراحةً، وجّه المستخدم لواجهة النقاط داخل التطبيق.\n3. وجّه المستخدمين لاستخدام أدوات Naje بالشكل الأمثل: مولّد الهوية المتكاملة (Brand Kit) للهويات الكاملة، محرّك الصور لتصاميم الشعارات والإعلانات، ومحرّك الفيديو للمقاطع السينمائية.\n\nقاعدة مهمة: نموذج توليد الصور يدعم دمج الصور والشعارات المرفوعة داخل التصميم. استدعِ generate_image أو generate_video فوراً بمجرد وضوح الطلب دون مماطلة. التصاميم بمستوى وكالات عالمية، وتجنّب النمط الكرتوني الرخيص تماماً.` +
      grandTypography;

    if (proMode === "thinking") {
      systemInstruction =
        `أنت "يزن" — العقل التحليلي الاستراتيجي الفائق لمنصة Naje AI. قدراتك التفكيرية تتجاوز المعتاد: تحلّل الأعمال، الاستراتيجيات التسويقية، والمشاكل المعقّدة بعمق نادر، وتحلّ المسائل البرمجية والرياضية والعلمية الصعبة، وتقدّم استشارات فنية وهندسية وإبداعية معمّقة.\nقدّم استشاراتك بثقة كبار المستشارين العالميين وبلهجة أردنية واضحة. أسعار Naje ديناميكية داخل النظام — لا تخترع أرقاماً.` +
        grandTypography;
    } else if (proMode === "study") {
      systemInstruction =
        `أنت "يزن" — معلّم Naje AI فائق الذكاء. مهمتك تبسيط المواد المعقّدة بأسهل الطرق. لا تعطِ الحل النهائي مباشرة؛ وجّه الطالب ليستنتجه بنفسه، واستخدم أمثلة من الحياة اليومية. لهجة أردنية ودّية.`;
    } else if (proMode === "image") {
      systemInstruction =
        `أنت "يزن" — خبير تصميم الصور والشعارات العالمي في Naje AI. مهمتك توليد صور وشعارات فائقة الجودة خالية من أخطاء الذكاء الاصطناعي المبتذلة.\nقاعدة مهمة عن الصور المرفقة: النموذج يدعم دمج الصور/الشعارات التي يرفعها المستخدم داخل التصميم — عند رفع صورة أو شعار، وجّه generate_image لدمجها كجزء أساسي من الناتج (مثلاً وضع الشعار على المنتج أو دمج صورة المنتج في إعلان).\nاعرف الأبعاد الصحيحة لكل نوع تصميم ووجّه المولّد لها. تجنّب النمط الكرتوني البسيط إلا إذا طُلب صراحةً؛ استخدم أساليب واقعية وسينمائية وثلاثية الأبعاد احترافية وأساليب فنية ثرية ومتنوّعة.\nشعارنا: "نبدع لك في كل بكسل" — أنت محاسب على كل بكسل. استدعِ generate_image فوراً بمجرد فهم الفكرة.\nتحذير: ممنوع منعاً باتاً كتابة مفاهيم أو خيارات نصية. النظام يولّد 5 خيارات برمجياً عند استدعاء generate_image. وظيفتك الوحيدة استدعاء الأداة مباشرة، سواء كانت فكرة جديدة أو اختيار المستخدم لمفهوم سابق.` +
        grandTypography;
    } else if (proMode === "search") {
      systemInstruction =
        `أنت "يزن" — خبير البحث المتقدّم والمعرفة الحيّة في Naje AI. استخدم أداة البحث للوصول لأحدث المعلومات الدقيقة، وقدّم إجابات مدعومة بالوقائع مع توثيق المصادر بوضوح وباللغة العربية.`;
    } else if (proMode === "video") {
      systemInstruction =
        `أنت "يزن" — صانع ومخرج الفيديو في Naje AI. وسّع أفكار المستخدم البسيطة إلى وصف بصري سينمائي قوي، واستدعِ generate_video فوراً لإنشاء المقطع.`;
    }

    if (userName) {
      systemInstruction += `\n\nملاحظة: اسم المستخدم الذي يتحدث معك هو "${userName}". نادِه باسمه بلطافة واحترافية.`;
    }

    // ---- History (re-inject any concept options you proposed before) --------
    const parsedHistory =
      typeof history === "string" ? JSON.parse(history || "[]") : history || [];
    const formattedHistory = (parsedHistory || []).map((h: any) => {
      let combinedText = h.text || h.content || "";
      if (h.conceptOptions && Array.isArray(h.conceptOptions)) {
        combinedText +=
          "\n[ملاحظة للنظام: هذه هي الخيارات التي عرضتها أنت للمستخدم مسبقاً:\n";
        h.conceptOptions.forEach((c: any, i: number) => {
          combinedText += `الخيار ${i + 1}: ${c.philosophyName || c.title || ""}\nالتفاصيل: ${c.imagePromptDraft || c.prompt || ""}\n\n`;
        });
        combinedText +=
          "إذا اختار المستخدم أحد هذه الخيارات الآن، استدعِ generate_image مباشرة ومرّر تفاصيل الخيار في حقل prompt. لا تكتب اقتراحات نصية جديدة.]";
      }
      return {
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: combinedText }],
      };
    });

    // ---- Current message parts (text + base64 media -> inlineData) ----------
    const parts: any[] = [];
    if (hasMedia) {
      for (const dataUrl of media) {
        const m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
        if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
      }
    }
    if (message) parts.push({ text: message });

    const contents = [...formattedHistory, { role: "user", parts }];

    // ---- Model tier (Naje) --------------------------------------------------
    const hasFuncs = tools.some((t: any) => t.functionDeclarations && t.functionDeclarations.length > 0);
    const hasBuiltin = tools.some((t: any) => t.googleSearch || t.codeExecution);
    const generateConfig: any = { 
      systemInstruction, 
      tools, 
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse,
      ...(hasFuncs && hasBuiltin ? { toolConfig: { includeServerSideToolInvocations: true } } : {}),
      thinkingConfig: { thinkingLevel: (proMode === "thinking" || proMode === "search" || proMode === "study") ? "HIGH" : "LOW" }
    };
    let modelToUse = getNajeModel('core'); // Naje Core (default)
    if (proMode === "thinking") {
      modelToUse = getNajeModel('pro'); // Naje Pro
    } else if (["search", "study"].includes(proMode)) {
      modelToUse = getNajeModel('pro'); // Naje Pro
    }

    const response = await ai.models.generateContent({
      model: resolveEngineModel(modelToUse),
      config: {
        ...generateConfig,
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse
      },
      contents,
    });

    if (response.usageMetadata) {
      await chargeForTextModelUsage(uid, modelToUse, response.usageMetadata, isAdmin).catch(e => console.error("creative-pro-chat metering error:", e));
    }

    // ---- Function-call routing + 5-concept generation -----------------------
    let functionCall: any = null;
    let textResponse = "";
    let conceptOptions: any = null;

    const fcs = (response as any).functionCalls;
    if (fcs && fcs.length > 0) {
      const call = fcs[0];
      const callArgs = { ...call.args };
      if (call.name === "generate_image") {
        if (callArgs.is_concept_selection) {
          functionCall = { name: call.name, args: callArgs };
          textResponse = "جاري توليد التصميم المختار...";
        } else {
          // 5 divergent concepts (Naje's creative engine), no two share an art movement
          conceptOptions = await generateMaximumCreativity(
            ai,
            String(callArgs.prompt),
            "design",
            String(callArgs.aspectRatio || "1:1"),
            applyCreativeLayers
          );
          textResponse =
            "جهّزتلك 5 مفاهيم إبداعية حسب طلبك. اختر المفهوم يلي بعجبك لنبلّش التوليد الفعلي:";
        }
      } else {
        functionCall = { name: call.name, args: callArgs };
        try {
          textResponse = response.text || "جاري إعداد التصميم الخاص بك...";
        } catch {
          textResponse = "جاري إعداد التصميم الخاص بك...";
        }
      }
    } else {
      try {
        textResponse = response.text || "";
      } catch {
        textResponse = "";
      }
    }

    // ---- Thought extraction (thinking mode only) ----------------------------
    let thought = "";
    if (proMode === "thinking") {
      try {
        const tp = response.candidates?.[0]?.content?.parts?.filter(
          (p: any) => p.thought === true || p.type === "thought"
        );
        if (tp && tp.length > 0) thought = tp.map((p: any) => p.text).join("\n");
      } catch {}
    }

    return res.json({ text: textResponse, functionCall, conceptOptions, thought });
  } catch (err: any) {
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
  {"d": 4500, "oT_ar": "نص عمر بالعربية", "oT_en": "Omar text in English", "oPose": "work"},
  {"d": 4500, "aT_ar": "نص آرثر بالعربية", "aT_en": "Arthur text in English", "aPose": "celebrate", "pT": "wand"}
]
Total 4-6 frames. Return raw JSON array ONLY, no markdown.`;

    const ai = createGenAIClient();
    const response = await ai.models.generateContent({
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

async function failGenerationJob(opts: {
  jobId?: string;
  uid: string;
  token?: string | null;
  chatId?: string;
  error: unknown;
  reservedPoints?: boolean;
  cost?: number;
  writeChatMessage?: boolean;
}): Promise<void> {
  try {
    const errObj = opts.error as any;
    const errMsg = errObj?.message || (opts.error ? String(opts.error) : '') || 'حدث خطأ غير متوقع';

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
          status: 'failed',
          error: errMsg,
          stepLabel: 'عذراً، حدث خطأ أثناء معالجة طلبك.',
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
        const msgDoc: Record<string, any> = {
          ownerId: opts.uid,
          chatId: opts.chatId,
          role: 'assistant',
          content: `عذراً، حدث خطأ أثناء معالجة الطلب: ${errMsg}`,
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
        return res.status(401).json({ error: "غير مصرح." });
      }
      const token = authHeader ? authHeader.split("Bearer ")[1] : null;
      let decodedToken;
      try {
        decodedToken = await getAuth().verifyIdToken(token);
        userTokenCache.set(decodedToken.uid, token);
      } catch (err: any) {
        return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
      }
      const uid = decodedToken.uid;
      
      // Emergency System Maintenance Check
      try {
        const statusDoc = await getDocRest("config", "system_status", token).catch(() => null);
        if (statusDoc && statusDoc.isMaintenance === true) {
          let isAdminUser = false;
          const userDoc = await getDocRest("users", uid, token).catch(() => null);
          if (userDoc?.isAdmin === true) {
            isAdminUser = true;
          } else {
            try {
              const userSnap = await dbAdmin.collection("users").doc(uid).get();
              isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
            } catch (e) {}
          }

          if (!isAdminUser) {
            const errorPayload = {
              emoji: "🛠️",
              title: statusDoc.title || "إيقاف الخدمات مؤقتاً للتطوير والإصلاح",
              intro: statusDoc.intro || "تم إيقاف الخدمات من أجل التطوير والإصلاح، شكراً لكم.",
              explanation: statusDoc.explanation || "يقوم فريق المطورين حالياً بإجراء تحديثات هامة وتحسينات أمنية وشاملة للبنية التحتية لضمان تقديم أداء أفضل وأسرع لكافة المستخدمين. سينتهي العمل وتعود كافة الخدمات فور اكتمال التحديثات.",
              solutions: Array.isArray(statusDoc.solutions) && statusDoc.solutions.length > 0 
                ? statusDoc.solutions 
                : ["يرجى الانتظار والعودة لاحقاً.", "تابع الإشعارات الرسمية لمعرفة فور عودة الخدمة للعمل."]
            };

            if (req.body.jobId) {
              await setDocRest("generation_jobs", req.body.jobId, {
                status: 'failed',
                error: "__NAJE_ERROR_JSON__:" + JSON.stringify(errorPayload),
                stepLabel: 'تم إيقاف الخدمات مؤقتاً من أجل التطوير والإصلاح.',
                createdAt: Date.now()
              }, token).catch(() => {});
            }

            return res.status(503).json({
              error: "__NAJE_ERROR_JSON__:" + JSON.stringify(errorPayload)
            });
          }
        }
      } catch (maintErr) {
        console.error("Failed to check maintenance status in server:", maintErr);
      }

      // P2-1: Concurrency Control
      if (activeUserTasks.has(uid)) {
        return res.status(429).json({ error: "الرجاء الانتظار حتى يكتمل طلبك الحالي قبل إرسال طلب جديد." });
      }
      activeUserTasks.add(uid);
      
      let { prompt, type, model, config, files, duration, docType: requestedDocType, docSize, paperSize, pagesCount, slidesCount, projectData, previousInteractionId, isEdit, jobId, maskData } = req.body;
      let rawDocType = String(requestedDocType || 'pdf_slides').toLowerCase().trim();
      let docTypeToUse = 'pdf_slides';
      if (rawDocType === 'pptx' || rawDocType === 'powerpoint' || rawDocType === 'ppt') {
        docTypeToUse = 'pptx';
      } else if (rawDocType === 'docx' || rawDocType === 'word' || rawDocType === 'doc' || rawDocType === 'document') {
        docTypeToUse = 'docx';
      } else if (rawDocType === 'pdf_doc' || rawDocType === 'document_pdf') {
        docTypeToUse = 'pdf_doc';
      } else {
        docTypeToUse = 'pdf_slides';
      }
      let totalSteps = 4;

      // Rate Limiting (P1-8) & User Pre-checks
      const userDoc = await getDocRest("users", uid, token).catch(() => null);
      const userIsAdmin = isPrivilegedAdmin(userDoc, decodedToken);
      const userBalance = typeof userDoc?.balance === 'number' ? userDoc.balance : 0;
      const isNegativeBalance = userDoc?.isNegativeBalance === true;

      // Minimum Balance Pre-Check: Block non-admins if balance is <= 0 or in negative state
      if (!userIsAdmin && (userBalance <= 0 || isNegativeBalance)) {
        activeUserTasks.delete(uid);
        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: 'failed',
            error: "رصيدك غير كافٍ لإتمام هذا الطلب. يرجى شحن رصيدك للمتابعة.",
            stepLabel: 'فشل بسبب عدم كفاية الرصيد.',
            createdAt: Date.now()
          }, token).catch(() => {});
        }
        return res.status(400).json({ error: "رصيدك غير كافٍ لإتمام هذا الطلب. يرجى شحن رصيدك للمتابعة." });
      }

      if (!userIsAdmin) {
        const isPaidReq = type === 'image' || type === 'video' || type === 'document' || type === 'voice' || type === 'infographic' || (type === 'ui' && req.body.mode !== 'plan' && !req.body.isAutoRepair) || (type === 'text' && requestedDocType && requestedDocType !== 'none');
        if (isPaidReq) {
          const rlHour = checkRateLimit(`gen_hr:${uid}`, 30, 60 * 60 * 1000);
          if (!rlHour.allowed) {
            activeUserTasks.delete(uid);
            return res.status(429).json({
              error: `وصلت للحد الأقصى من الطلبات لهذه الساعة. جرّب مجدداً بعد ${Math.max(1, Math.ceil(rlHour.retryAfterSec / 60))} دقيقة.`
            });
          }
          const rlDay = checkRateLimit(`gen_day:${uid}`, 150, 24 * 60 * 60 * 1000);
          if (!rlDay.allowed) {
            activeUserTasks.delete(uid);
            return res.status(429).json({
              error: `وصلت للحد الأقصى من الطلبات اليومية (150 طلب/يوم). يرجى المحاولة غداً.`
            });
          }
        } else {
          // Free text chat / planning: 200 per hour
          const rlChat = checkRateLimit(`chat_hr:${uid}`, 200, 60 * 60 * 1000);
          if (!rlChat.allowed) {
            activeUserTasks.delete(uid);
            return res.status(429).json({
              error: `وصلت للحد الأقصى من رسائل المحادثة لهذه الساعة. جرّب مجدداً بعد ${Math.max(1, Math.ceil(rlChat.retryAfterSec / 60))} دقيقة.`
            });
          }
        }
      }

      // Hard Caps Validation for Documents (P2-9)
      if (type === 'document' || (type === 'text' && requestedDocType && requestedDocType !== 'none')) {
        const rawRequestedPages = parseInt(pagesCount) || 0;
        const rawRequestedSlides = parseInt(slidesCount) || 0;
        const isSlides = (docTypeToUse === 'pptx' || docTypeToUse === 'pdf_slides');

        if (isSlides && rawRequestedSlides > 40) {
          activeUserTasks.delete(uid);
          return res.status(400).json({
            error: `الحد الأقصى لعدد الشرائح هو 40 شريحة. تم طلب ${rawRequestedSlides} شريحة.`
          });
        }
        if (!isSlides && rawRequestedPages > 25) {
          activeUserTasks.delete(uid);
          return res.status(400).json({
            error: `الحد الأقصى لتوليد المستندات هو 25 صفحة. تم طلب ${rawRequestedPages} صفحة.`
          });
        }
      }

      // Feature Flag Check
      const featureFlags = await getFeatureFlags(token);
      if (type && featureFlags[type] === false) {
        activeUserTasks.delete(uid);
        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: 'failed',
            error: 'هذه الخدمة معطلة مؤقتاً من قبل الإدارة.',
            stepLabel: 'الخدمة معطلة مؤقتاً.',
            createdAt: Date.now()
          }, token).catch(() => {});
        }
        return res.status(403).json({ error: "هذه الخدمة معطلة مؤقتاً من قبل الإدارة." });
      }
      

      if (type === 'document' && typeof prompt !== 'string') {
        activeUserTasks.delete(uid);
        return res.status(400).json({ error: "صيغة الطلب غير صحيحة (prompt يجب أن يكون نصًا)." });
      }

      // Request Size / Attachment Validation
      if (files && Array.isArray(files)) {
        if (files.length > 3) {
          activeUserTasks.delete(uid);
          return res.status(400).json({ error: "يمكنك إرفاق 3 ملفات كحد أقصى للطلب الواحد." });
        }
        for (const f of files) {
          let approxSizeBytes = 0;
          if (typeof f.size === 'number' && f.size > 0) {
            approxSizeBytes = f.size;
          } else if (typeof f.data === 'string') {
            approxSizeBytes = Math.ceil((f.data.length * 3) / 4);
          } else if (typeof f.base64 === 'string') {
            approxSizeBytes = Math.ceil((f.base64.length * 3) / 4);
          }
          if (approxSizeBytes > 8 * 1024 * 1024) {
            activeUserTasks.delete(uid);
            return res.status(400).json({ error: "حجم الملف المرفق يتجاوز الحد الأقصى المسموح به (8 ميجابايت)." });
          }
        }
      }

      // TEXT-RISK GATE (image generation only, cheap model only).
      // Returns a confirmation card instead of generating. No points are spent.
      if (type === 'image' && !isEdit && model !== 'nova' && !req.body.textRiskAcknowledged) {
        const textRisk = await analyzeTextRisk(process.env.GEMINI_API_KEY!, prompt || "");
        if (textRisk.risk === 'medium' || textRisk.risk === 'high') {
          activeUserTasks.delete(uid);
          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: 'completed', progress: 100, stepLabel: 'بانتظار اختيار النموذج', type, createdAt: Date.now()
            }, token).catch(() => {});
          }
          const countStr = textRisk.wordCount === 1 
            ? "كلمة واحدة" 
            : textRisk.wordCount === 2 
            ? "كلمتين" 
            : (textRisk.wordCount >= 3 && textRisk.wordCount <= 10) 
            ? `${textRisk.wordCount} كلمات` 
            : `${textRisk.wordCount} كلمة`;

          const textSnippet = textRisk.extractedText ? ` "${textRisk.extractedText}"` : '';

          return res.json({
            success: true,
            action: 'model_upgrade_suggestion',
            textRisk,
            message: textRisk.script === 'arabic'
              ? `طلبك يحتوي على نص عربي مكتوب داخل الصورة يتكون من ${countStr}${textSnippet}. اتصال الحروف العربية والتنسيق يحتاجان دقة عالية قد تظهر معها بعض الأخطاء الإملائية في النموذج العادي.`
              : `طلبك يحتوي على نص داخل الصورة يتكون من ${countStr}${textSnippet}، وهو ما يتجاوز القدرة المثالية للنموذج العادي.`
          });
        }
      }

            // 1. Content Safety Filter
      if (jobId && (type === 'image' || type === 'video')) {
         await setDocRest("generation_jobs", jobId, {
           status: 'starting',
           progress: 10,
           stepLabel: formatStepLabelWithProject('جاري فحص وتأمين المحتوى...', projectData),
           type,
           createdAt: Date.now()
         }, token).catch(e => console.error(e));
      }
      const safety = await isSafePrompt(prompt || "", uid, type, token);
      if (!safety.safe) {
        activeUserTasks.delete(uid);
        return res.status(400).json({ error: safety.reason });
      }

      if (jobId && (type === 'image' || type === 'video')) {
         await setDocRest("generation_jobs", jobId, {
           status: 'generating',
           progress: 25,
           stepLabel: formatStepLabelWithProject('تم تأمين المحتوى، جاري تجهيز الفكرة...', projectData),
           type,
           createdAt: Date.now()
         }, token).catch(e => console.error(e));
      }

      try {
      // 1.5 CONVERSATIONAL GATE (image/video only)
      // First-pass chat model decides: real request -> generate & charge,
      // otherwise -> reply for free with no points deducted.
      // Skipped for edits and for requests that include reference files
      // (those are always treated as real generation intent).
      if ((type === 'image' || type === 'video') && !isEdit && (!files || files.length === 0) && !req.body.textRiskAcknowledged) {
        const intent = await classifyMediaIntent(
          process.env.GEMINI_API_KEY!,
          prompt || "",
          type as 'image' | 'video',
          projectData
        );
        if (intent.action === 'chat') {
          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: 'completed',
              progress: 100,
              stepLabel: 'رد عام',
              type,
              createdAt: Date.now()
            }, token).catch(() => {});
          }
          // No points deducted, no media generated.
          return res.json({ success: true, action: 'chat', chatReply: intent.reply });
        }
        // action === 'generate' -> fall through to the normal pipeline below.
      }

      // 1.8 SILENT PRE-GENERATION CRITIC REVIEW (الناقد)
      if (type === 'image' || type === 'video' || type === 'document') {
        const aiCritic = createGenAIClient();
        const criticVerdict = await criticReviewRequest(
          aiCritic,
          prompt || '',
          type as 'image' | 'video' | 'document',
          projectData?.brandProfile ? { ...projectData.brandProfile, entityType: projectData.entityType } : undefined
        );

        if (criticVerdict.verdict === 'needs_clarification') {
          activeUserTasks.delete(uid);
          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: 'completed',
              progress: 100,
              stepLabel: 'بانتظار توضيح متطلبات الطلب',
              type,
              createdAt: Date.now()
            }, token).catch(() => {});
          }
          return res.status(200).json({
            needsClarification: true,
            message: criticVerdict.clarificationQuestion || 'يرجى توضيح متطلبات طلبك بمزيد من التفصيل لنتمكن من تنفيذه بأعلى دقة.',
          });
        }

        // verdict is 'proceed' or 'proceed_with_notes' — continue using the enriched prompt
        if (criticVerdict.enrichedPrompt && criticVerdict.enrichedPrompt.trim()) {
          prompt = criticVerdict.enrichedPrompt;
        }
      }

      // 2. Cost Calculation
      const pricing = await getPricing(token);

      let cost = 0;
      if (type === 'image') {
        // Models:
        // 'lite' = Naje Imagen Lite (gemini-3.1-flash-lite-image)
        // 'spectra' = Naje Imagen (gemini-3.1-flash-image)
        // 'nova' = Naje Imagen Pro (gemini-3-pro-image)
        const isLiteImage = model === 'lite';
        const isProImage = model === 'nova';
        if (isEdit) {
          cost = isLiteImage
            ? (pricing.image.liteEdit || 0.25)
            : isProImage
            ? (pricing.image.proEdit || 0.75)
            : (pricing.image.edit || 0.5);
        } else {
          cost = isLiteImage
            ? (pricing.image.liteBase || 0.5)
            : isProImage
            ? (pricing.image.proBase || 1.5)
            : (pricing.image.base || 1);
        }
        const qualityKey = (config?.quality || 'standard').toLowerCase();
        // Lite model is locked to standard 1K quality (1.0). HD 2K uses 1.5 multiplier.
        const qualityMult = isLiteImage ? 1.0 : ((qualityKey === 'hd' || qualityKey === '2k' || qualityKey === 'high' || qualityKey === 'ultra') ? 1.5 : 1.0);
        cost = cost * qualityMult;

        if (files && Array.isArray(files)) {
          const imgCount = files.filter((f: any) => f.mimeType && f.mimeType.startsWith('image/')).length;
          cost += Math.min(imgCount, 3) * (pricing.image.imageAddon || 0.1);
        }
      } else if (type === 'video') {
        const durSec = parseFloat(duration) || (config?.duration ? parseFloat(config.duration) : (model === 'veo' ? 4 : 5));
        const isVeo = model === 'veo';
        cost = durSec * (pricing.video.perSecond || 0.5);
        if (isEdit) cost = cost * (pricing.video.editMultiplier || 0.7);
        const resKey = config?.resolution === '1080p' ? '1080p' : '720p';
        const resMult = resKey === '1080p' ? 1.6 : 1.0;
        cost = cost * resMult;

        if (files && Array.isArray(files)) {
          const imgCount = files.filter((f: any) => f.mimeType && f.mimeType.startsWith('image/')).length;
          cost += Math.min(imgCount, 3) * (pricing.video.imageAddon || 0.1);
        }
      } else if (type === 'ui') {
        // Token-metered after the stream using admin input/output rates.
        cost = 0;
      } else if (type === 'document' || (type === 'text' && requestedDocType && requestedDocType !== 'none')) {
        if (requestedDocType === 'pptx' || docTypeToUse === 'pdf_slides') {
          const slides = parseInt(slidesCount) || 5;
          cost = slides * (pricing.document.pdf_per_slide || 0.20);
        } else {
          const pages = parseInt(pagesCount) || 5;
          const isA5 = paperSize === 'a5';
          cost = pages * (isA5 ? (pricing.document?.a5PerPage ?? 0.10) : (pricing.document?.a4PerPage ?? 0.15));
        }
      } else if (type === 'voice') {
        const voiceTierPre = (String(req.body.voiceTier || req.body.model || 'core')).toLowerCase() === 'pro' ? 'pro' : 'core';
        const billed = calcVoicePointsCost({
          text: spokenTextFromVoiceScript(prompt || ''),
          tier: voiceTierPre,
          pointsPerCharacter: pricing.voice?.pointsPerCharacter,
          pointsPerCharacterPro: pricing.voice?.pointsPerCharacterPro,
          minCost: pricing.voice?.minCost
        });
        cost = billed.cost;
      } else if (type === 'infographic') {
        const baseRender = Number(pricing.infographic?.renderFee ?? 0.5);
        cost = isEdit ? baseRender * Number(pricing.infographic?.editMultiplier ?? 0.5) : baseRender;
      } else if (type === 'text') {
        cost = 0; // token-metered from usageMetadata after the stream
      }
      
      cost = parseFloat(cost.toFixed(2));

      // 3. Balance verification (self-healing missing doc)
      let currentBalance = 0;
      try {
        const userState = await getUserDocAndBalance(uid, token, decodedToken);
        currentBalance = userState.balance;

        // Check first recharge requirement for restricted features
        const userHasRecharged = !!(userState.doc?.isAdmin || userState.doc?.hasRecharged);
        if (!userHasRecharged) {
          if (type === 'video') {
            activeUserTasks.delete(uid);
            return res.status(400).json({ error: "خدمة إنشاء الفيديو (العادية و Pro) متاحة فقط بعد أول عملية شحن رصيد ناجحة. يرجى شحن رصيدك لتفعيل المحرك ⚡" });
          }
          if (type === 'image' && (model === 'nova' || model === 'pro')) {
            activeUserTasks.delete(uid);
            return res.status(400).json({ error: "نموذج توليد الصور الاحترافي (Naje Imagen Pro) متاح فقط بعد أول عملية شحن رصيد ناجحة. يمكنك اختيار النموذج العادي أو شحن رصيدك ⚡" });
          }
          if (type === 'text' && model === 'max') {
            activeUserTasks.delete(uid);
            return res.status(400).json({ error: "نموذج Naje Max للدردشة النصية متاح فقط بعد أول عملية شحن رصيد ناجحة. يمكنك اختيار Naje Core/Lite أو شحن رصيدك ⚡" });
          }
          if (type === 'ui' && model === 'max') {
            activeUserTasks.delete(uid);
            return res.status(400).json({ error: "نموذج Naje Max لإنشاء الواجهات متاح فقط بعد أول عملية شحن رصيد ناجحة. يمكنك اختيار Naje Core/Lite أو شحن رصيدك ⚡" });
          }
        }

        if (currentBalance < cost) {
          activeUserTasks.delete(uid);
          return res.status(400).json({ error: `رصيدك غير كافٍ لإتمام هذا الطلب. تحتاج إلى ${cost} نقاط ورصيدك الحالي هو ${currentBalance} نقاط.` });
        }
      } catch (restErr: any) {
        console.error("Balance pre-check failed:", restErr);
        if (cost > 0) {
          return res.status(500).json({ error: restErr.message || "فشل التحقق من الرصيد" });
        }
      }

      const isAsyncJob = (type === 'image' || type === 'video' || type === 'voice' || type === 'document' || type === 'infographic' || (type === 'text' && requestedDocType && requestedDocType !== 'none'));
      let reservedPoints = false;

      if (isAsyncJob) {
        if (cost > 0) {
          const atomicRes = await mutateBalanceAtomic(uid, -cost, { requireSufficient: true });
          if (!atomicRes.ok) {
            activeUserTasks.delete(uid);
            if (atomicRes.reason === 'INSUFFICIENT') {
              return res.status(400).json({ error: `رصيدك غير كافٍ لإتمام هذا الطلب. تحتاج إلى ${cost} نقاط ورصيدك الحالي هو ${currentBalance} نقاط.` });
            }
            return res.status(500).json({ error: "فشل حجز الرصيد في قاعدة البيانات." });
          }
          reservedPoints = true;
        }

        const targetJobId = jobId || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        jobId = targetJobId;

        try {
          await setDocRest("generation_jobs", targetJobId, {
            id: targetJobId,
            ownerId: uid,
            chatId: req.body.chatId || null,
            projectId: req.body.projectId || req.body.projectData?.id || null,
            type: (requestedDocType && requestedDocType !== 'none') ? 'document' : type,
            model: model || null,
            status: 'queued',
            progress: 5,
            stepLabel: 'تم استلام الطلب وتأكيد الحجز، جاري البدء...',
            prompt: typeof prompt === 'string' ? prompt.slice(0, 500) : '',
            cost,
            createdAt: Date.now()
          }, token);
        } catch (initialWriteErr) {
          console.error("Initial generation_jobs write failed:", initialWriteErr);
          if (reservedPoints && cost > 0) {
            await mutateBalanceAtomic(uid, cost).catch(e => console.error("Failed to refund reserved points:", e));
          }
          activeUserTasks.delete(uid);
          return res.status(500).json({ error: "تعذّر تسجيل مهمة التوليد. لم يتم خصم النقاط." });
        }

        // Immediately respond to the client with the queued jobId using 202 Accepted
        res.status(202).json({
          success: true,
          jobId: targetJobId,
          status: 'queued',
          cost
        });
        
        // Return early from HTTP handler so request connection is closed and background generation continues
        // wrapped in detached async execution to prevent ERR_HTTP_HEADERS_ALREADY_SENT
        (async () => {
          try {
            await runGenerationPipeline();
          } catch (bgErr) {
            console.error("[Background Generation Task Error]:", bgErr);
            await failGenerationJob({ jobId: targetJobId, uid, token, chatId: req.body.chatId, error: bgErr, reservedPoints, cost });
          } finally {
            activeUserTasks.delete(uid);
          }
        })();
        return;
      }

      await runGenerationPipeline();

      async function runGenerationPipeline() {
      const ai = createGenAIClient();
      let generationResult: any = null;
      let mimeType = "";
      let extension = "";
      let interactionId = null;

      // Build Project Identity & Ambient Memory context
      const { systemInstructionContext, memoryItemsForTools } = await buildProjectAndMemoryContext(
        req.body.projectId,
        projectData,
        decodedToken?.name || decodedToken?.displayName,
        token
      );

      let systemInstruction = `${NAJE_CORE_IDENTITY}

---

أنت ناجي، مساعد ذكي ومبدع. لغتك الأساسية هي العربية.
لا تذكر أبداً كلمة "قِلْوَى" أو "Qelva" في ردودك، إلا إذا سألك المستخدم صراحةً عن الشركة الأم أو الجهة المطورة لك، فحينها فقط يمكنك القول أنك من تطوير قِلْوَى للذكاء الاصطناعي (Qelva AI).
إذا طلب منك المستخدم توليد مستند (عرض تقديمي PowerPoint، مستند Word، أو ملف PDF)، فاستخدم الأداة (Function Call) المتاحة لك generate_document بدلاً من الرد بنص عادي لتفعيل محرك المستندات تلقائياً.${systemInstructionContext}`;

      // (Old progress 50 removed, real milestones handled later)

      // Pre-generation Critic Review (مجلس عقول ناجي — الناقد)
      if (prompt && typeof prompt === 'string' && prompt.trim() && ['image', 'video', 'document', 'code', 'voice'].includes(type)) {
        try {
          const criticResult = await criticReviewRequest(
            ai,
            prompt,
            type as any,
            projectData?.brandProfile ? { ...projectData.brandProfile, entityType: projectData.entityType } : undefined
          );
          if (criticResult.verdict === 'needs_clarification' && criticResult.clarificationQuestion && type === 'text') {
            activeUserTasks.delete(uid);
            if (isAsyncJob) {
              if (jobId) {
                await setDocRest("generation_jobs", jobId, {
                  id: jobId,
                  ownerId: uid,
                  status: 'needs_clarification',
                  result: criticResult.clarificationQuestion,
                  needsClarification: true,
                  stepLabel: 'يرجى توضيح بعض التفاصيل للمتابعة...',
                  completedAt: Date.now()
                }, token).catch(e => console.error("Failed to update job with clarification:", e));
              }
              if (req.body.chatId) {
                await createDocRest("messages", {
                  ownerId: uid,
                  chatId: req.body.chatId,
                  role: 'assistant',
                  content: criticResult.clarificationQuestion,
                  createdAt: Date.now(),
                  jobId: jobId || undefined,
                  needsClarification: true
                }, token).catch(e => console.error("Failed to write clarification message:", e));
              }
              return;
            }
            return res.json({
              success: true,
              type: 'text',
              result: criticResult.clarificationQuestion,
              needsClarification: true
            });
          }
          if (criticResult.enrichedPrompt && criticResult.enrichedPrompt !== prompt) {
            console.log(`[Critic] Enriched prompt for ${type}: "${prompt.slice(0, 50)}..." -> "${criticResult.enrichedPrompt.slice(0, 50)}..."`);
            prompt = criticResult.enrichedPrompt;
          }
        } catch (criticErr) {
          console.warn('[Critic] Pre-generation review error, continuing with original prompt:', criticErr);
        }
      }

      // Add sharp for text overlay
      const sharpModule = await import('sharp');
      const sharp: any = sharpModule.default || sharpModule;
      
      if (type === 'image') {
        let imageModelName = resolveEngineModel(getNajeModel('image_core'));
        if (model === 'nova' || model === 'pro') {
          imageModelName = await getModelEndpointId('image_hd', getNajeModel('image_pro'), token);   // Naje Imagen Pro (nova)
        } else if (model === 'lite') {
          imageModelName = await getModelEndpointId('image_fast', getNajeModel('image_lite'), token);  // Naje Imagen Lite
        } else {
          imageModelName = await getModelEndpointId('image_standard', getNajeModel('image_core'), token);   // Naje Imagen
        }

        // Dedicated safety rate limit specifically on the nova / image_pro tier (gemini-3-pro-image)
        // Applies universally (including admin/internal paths) to safeguard against runaway script or loop costs.
        if (imageModelName === 'gemini-3-pro-image' || model === 'nova' || model === 'pro') {
          const rlNovaHr = checkRateLimit(`nova_hr:${uid}`, 30, 60 * 60 * 1000);
          if (!rlNovaHr.allowed) {
            activeUserTasks.delete(uid);
            return res.status(429).json({
              error: `وصلت للحد الأقصى لتوليد صور Imagen Pro لهذه الساعة (30 صورة/ساعة). يرجى الانتظار ${Math.max(1, Math.ceil(rlNovaHr.retryAfterSec / 60))} دقيقة.`
            });
          }
          const rlNovaDay = checkRateLimit(`nova_day:${uid}`, 150, 24 * 60 * 60 * 1000);
          if (!rlNovaDay.allowed) {
            activeUserTasks.delete(uid);
            return res.status(429).json({
              error: `وصلت للحد الأقصى اليومي لتوليد صور Imagen Pro (150 صورة/يوم).`
            });
          }
        }

        
        const allowedAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9", "21:9", "4:5", "5:4"];
        const selectedAspectRatio = allowedAspectRatios.includes(config?.aspectRatio) 
          ? config.aspectRatio 
          : "1:1";
        const selectedPreset = config?.preset || config?.formatPreset || req.body?.formatPresetId || req.body?.preset;

        const compiledImagePrompt = await compileImagePrompt(
          prompt,
          model,
          files || [],
          projectData?.brandProfile ? { ...projectData.brandProfile, entityType: projectData.entityType } : undefined,
          selectedAspectRatio,
          selectedPreset
        );

        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
             status: 'generating',
             progress: 45,
             stepLabel: formatStepLabelWithProject('جاري رسم التفاصيل...', projectData),
             type: 'image',
             createdAt: Date.now()
          }, token).catch(e => console.error(e));
        }

        const QUALITY_TO_IMAGE_SIZE: Record<string, string> = {
          standard: '1K',
          hd: '2K',
          '1k': '1K',
          '2k': '2K',
          high: '2K',
          ultra: '2K',
          sd: '1K'
        };
        const requestedQuality = (config?.quality || 'standard').toLowerCase();
        const selectedImageSize = QUALITY_TO_IMAGE_SIZE[requestedQuality] || '1K';

        const contentsParts: any[] = [];
        
        // Build image prompt with edit directives if editing or files exist
        let finalInstruction = `${systemInstruction}\n\n${compiledImagePrompt}`;
        if (isEdit || (files && files.length > 0)) {
          finalInstruction += `\n\n[CRITICAL IMAGE EDITING DIRECTIVE]: An existing reference image is provided in the input attachments. This is an IMAGE MODIFICATION request. You MUST preserve the core subject identity, character likeness, background composition, lighting, and visual style of the attached reference image. Apply ONLY the following specific changes: "${prompt}". Do NOT generate an entirely new or unrelated image.`;
        }

        contentsParts.push(finalInstruction);
        
        // Add uploaded/source files as inlineData
        if (files && Array.isArray(files)) {
          for (const file of files) {
            if (file.data && file.mimeType) {
              const cleanData = file.data.includes(',') ? file.data.split(',')[1] : file.data;
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
          console.log('[Inpaint Engine] Passing maskData as dedicated inpaint mask image inline with explicit mask directive prompt.');
          const cleanMask = maskData.includes(',') ? maskData.split(',')[1] : maskData;
          contentsParts.push({
            inlineData: {
              data: cleanMask,
              mimeType: 'image/png'
            }
          });
          contentsParts.push(`\n[INPAINTING MASK DIRECTIVE]: The second image attached above is a binary mask (white = edit region, black = keep untouched). Apply the requested edits ONLY within the white masked area of the reference image, keeping all black unmasked regions strictly identical to the original image.`);
        }

        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
             status: 'generating',
             progress: 60,
             stepLabel: formatStepLabelWithProject('جاري التوليد...', projectData),
             type: 'image',
             createdAt: Date.now()
          }, token).catch(e => console.error(e));
        }

        let base64Data = "";
        let primaryErr: any = null;

        const generateWithImagen = async (promptText: string, aspect: string) => {
          const imagenAspects = ["1:1", "3:4", "4:3", "9:16", "16:9"];
          const validAspect = imagenAspects.includes(aspect) ? aspect : "1:1";
          const res = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: promptText,
            config: {
              numberOfImages: 1,
              aspectRatio: validAspect,
              outputMimeType: 'image/png'
            }
          });
          const bytes = res?.generatedImages?.[0]?.image?.imageBytes;
          if (bytes) {
            return { data: bytes, mime: 'image/png' };
          }
          return null;
        };

        // Primary image generation using ai.models.generateContent (standard across Vertex AI & Gemini SDK)
        if (!base64Data) {
          const targetModel = resolveEngineModel(imageModelName || 'gemini-3.1-flash-image');

          const generateContentParts: any[] = [];
          for (const p of contentsParts) {
            if (typeof p === 'string') {
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
            generateContentParts.push({ text: compiledImagePrompt || prompt || 'A creative artistic image' });
          }

          const imageConfig: any = {
            aspectRatio: selectedAspectRatio || '1:1'
          };
          if (selectedImageSize && (targetModel.includes('flash-image') || targetModel.includes('pro-image'))) {
            imageConfig.imageSize = selectedImageSize;
          }

          try {
            console.log(`[Image Gen] Generating image using ${targetModel} via generateContent...`);
            const genRes = await ai.models.generateContent({
              model: targetModel,
              contents: [
                {
                  role: 'user',
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
                mimeType = part.inlineData.mimeType || 'image/png';
                console.log(`[Image Gen] Successfully generated image via ${targetModel}, size: ${base64Data.length}`);
                break;
              }
            }
          } catch (gErr: any) {
            console.warn(`[Image Gen] Primary generateContent attempt notice for ${targetModel}:`, gErr?.message || gErr);
            primaryErr = gErr;

            // If selected model failed, attempt resilient fallback with gemini-3.1-flash-lite-image
            if (targetModel !== 'gemini-3.1-flash-lite-image') {
              try {
                console.log(`[Image Gen] Attempting fallback to gemini-3.1-flash-lite-image...`);
                const fbRes = await ai.models.generateContent({
                  model: 'gemini-3.1-flash-lite-image',
                  contents: [
                    {
                      role: 'user',
                      parts: generateContentParts
                    }
                  ],
                  config: {
                    imageConfig: { aspectRatio: selectedAspectRatio || '1:1' }
                  }
                });
                for (const part of fbRes?.candidates?.[0]?.content?.parts || []) {
                  if (part.inlineData?.data) {
                    base64Data = part.inlineData.data;
                    mimeType = part.inlineData.mimeType || 'image/jpeg';
                    console.log(`[Image Gen] Fallback to gemini-3.1-flash-lite-image succeeded, size: ${base64Data.length}`);
                    break;
                  }
                }
              } catch (fbErr: any) {
                console.warn(`[Image Gen] Fallback generateContent notice:`, fbErr?.message || fbErr);
              }
            }
          }

          // Fallback to Imagen if still no image and requested
          if (!base64Data && (targetModel.includes('imagen') || USE_VERTEX_AI)) {
            try {
              console.log(`[Image Gen] Generating image using Imagen (imagen-3.0-generate-002) fallback...`);
              const imgRes = await generateWithImagen(compiledImagePrompt || prompt, selectedAspectRatio);
              if (imgRes) {
                base64Data = imgRes.data;
                mimeType = imgRes.mime;
              }
            } catch (vErr: any) {
              console.warn(`[Image Gen] Direct Imagen generation attempt notice:`, vErr?.message || vErr);
              primaryErr = vErr;
            }
          }

          // Fallback to Interactions API if still no image
          if (!base64Data) {
            let interactionConfig: any = {
              model: targetModel,
              input: contentsParts.length > 1 ? contentsParts.map(p => {
                 if(typeof p === 'string') return { type: 'text', text: p };
                 if(p.inlineData) return { type: 'image', mime_type: p.inlineData.mimeType, data: p.inlineData.data };
                 return { type: 'text', text: JSON.stringify(p) };
              }) : contentsParts[0],
              response_modalities: ['image', 'text'],
              generation_config: {
                image_config: {
                  aspect_ratio: selectedAspectRatio,
                  image_size: selectedImageSize
                }
              },
              store: true
            };

            if (isEdit && previousInteractionId) {
              interactionConfig.previous_interaction_id = previousInteractionId;
            }

            let interaction;
            try {
              interaction = await ai.interactions.create(interactionConfig);
            } catch (imgErr: any) {
              const errStr = (imgErr?.message || '') + ' ' + (imgErr?.body || '') + ' ' + String(imgErr);
              const isUnsupported = errStr.includes('Unsupported model interaction') ||
                                    errStr.includes('invalid_request') ||
                                    errStr.includes('400') ||
                                    errStr.includes('404');

              if (isUnsupported) {
                console.warn(`[Image Gen] Interaction API unsupported for ${targetModel}, falling back to imagen-3.0-generate-002:`, imgErr?.message || imgErr);
                try {
                  const fallbackRes = await generateWithImagen(compiledImagePrompt || prompt, selectedAspectRatio);
                  if (fallbackRes) {
                    base64Data = fallbackRes.data;
                    mimeType = fallbackRes.mime;
                  }
                } catch (fbErr: any) {
                  console.error(`[Image Gen] Imagen fallback also failed:`, fbErr?.message || fbErr);
                  throw (primaryErr || fbErr || imgErr);
                }
              } else if (selectedImageSize !== '1K') {
                console.warn(`[Image Gen] Failed with image_size=${selectedImageSize}, retrying with 1K fallback:`, imgErr?.message || imgErr);
                interactionConfig.generation_config.image_config.image_size = '1K';
                interaction = await ai.interactions.create(interactionConfig);
              } else {
                throw (primaryErr || imgErr);
              }
            }

            if (interaction && !base64Data) {
              interactionId = interaction.id;
              for (const step of interaction.steps) {
                if (step.type === 'model_output') {
                  const img = step.content?.find(c => c.type === 'image');
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

        // Stage 7: Output Verification Loop (Aspect ratio & text legibility check with single silent retry)
        const enableVerification = process.env.ENABLE_STAGE7_VERIFICATION !== 'false';
        if (enableVerification && base64Data) {
          try {
            const imgBuffer = Buffer.from(base64Data, 'base64');
            const verification = await verifyImageOutput(ai, imgBuffer, (aspectRatio || '1:1'), prompt);
            if (!verification.passed) {
              console.warn(`[Stage 7 Verification] Initial output failed check (${verification.reason}). Performing single silent regeneration...`);
              const retryInteraction = await ai.interactions.create(interactionConfig);
              for (const step of retryInteraction.steps) {
                if (step.type === 'model_output') {
                  const retryImg = step.content?.find((c: any) => c.type === 'image');
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
          } catch (verErr: any) {
            console.warn(`[Stage 7 Verification] Verification loop skipped due to non-blocking error:`, verErr?.message || verErr);
          }
        }
        
        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
             status: 'generating',
             progress: 85,
             stepLabel: 'اللمسات الأخيرة...',
             type: 'image',
             createdAt: Date.now()
          }, token).catch(e => console.error(e));
        }

        // P1-5: Legacy Text Overlay Engine — disabled by default.
        // Nano Banana renders text natively and far better than this sharp+SVG
        // path (which lacks an Arabic font). Set ENABLE_LEGACY_TEXT_OVERLAY=true
        // to re-enable for comparison.
        const legacyOverlayEnabled = process.env.ENABLE_LEGACY_TEXT_OVERLAY === 'true';
        if (legacyOverlayEnabled && generationResult && (prompt.includes('نص') || prompt.includes('شعار') || prompt.includes('اسم'))) {
          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: 'generating_text_overlay',
              progress: 80,
              stepLabel: 'جاري إضافة النصوص الذكية للصورة...',
              type,
              createdAt: Date.now()
            }, token).catch(e => console.error(e));
          }
          try {
            // 1. Vision model call for bounding box
            const flashResult = await ai.models.generateContent({
              model: 'gemini-3.6-flash',
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
                { inlineData: { data: generationResult, mimeType: mimeType } }
              ],
              config: { responseMimeType: "application/json", maxOutputTokens: 2048 }
            });
            const textData = JSON.parse(flashResult.text || '{}');
            
            if (textData.hasText && textData.box) {
              // 2. Server-side text-rendering with sharp
              const imgBuffer = Buffer.from(generationResult, 'base64');
              const metadata = await sharp(imgBuffer).metadata();
              
              const boxW = Math.round(textData.box.width * metadata.width);
              const boxH = Math.round(textData.box.height * metadata.height);
              const boxX = Math.round(textData.box.x * metadata.width);
              const boxY = Math.round(textData.box.y * metadata.height);
              
              // create an SVG text overlay
              const svgText = `
              <svg width="${metadata.width}" height="${metadata.height}">
                <text x="${boxX + boxW/2}" y="${boxY + boxH/2}" font-family="Cairo, sans-serif" font-size="${textData.fontSize || 48}px" font-weight="bold" fill="${textData.textColorHex || '#ffffff'}" text-anchor="middle" dominant-baseline="middle">${textData.brandName || ''}</text>
              </svg>`;
              
              const finalImgBuffer = await sharp(imgBuffer)
                .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
                .toBuffer();
                
              generationResult = finalImgBuffer.toString('base64');
            }
          } catch (err) {
            console.error("Text Overlay Engine failed, falling back to original image", err);
          }
        }

        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: 'completed',
            progress: 100,
            stepLabel: 'تم رسم وتوليد الصورة بنجاح!',
            type: 'image',
            createdAt: Date.now()
          }, token).catch(e => console.error(e));
        }

      } else if (type === 'video') {
        const isProTier = (model === 'veo-pro' || model === 'video_hd' || model === 'naje-video-pro' || model === 'omni');
        const durSec = parseFloat(duration) || (config?.duration ? parseFloat(config.duration) : (isProTier ? 5 : 4));
        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: 'compiling_prompt',
            progress: 10,
            stepLabel: 'جاري تحليل طلبك وبناء تسلسل اللقطات بدقة...',
            type: 'video',
            createdAt: Date.now()
          }, token).catch(e => console.error("Firestore job update failed:", e));
        }

        const selectedVideoAspect = config?.aspectRatio === '9:16' ? '9:16' : '16:9';
        const rawVideoPrompt = prompt || 'A creative video based on the request';
        const compiledVideoPrompt = await compileVideoPrompt(
          rawVideoPrompt,
          durSec,
          selectedVideoAspect,
          isProTier ? 'omni' : 'veo',
          projectData?.brandProfile ? { ...projectData.brandProfile, entityType: projectData.entityType } : undefined
        );
        const auditedVideoPrompt = await auditVideoPrompt(ai, compiledVideoPrompt, durSec, selectedVideoAspect, rawVideoPrompt);

        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: 'starting',
            progress: 25,
            stepLabel: 'تم تأمين المحتوى، جاري تجهيز الفكرة...',
            type: 'video',
            createdAt: Date.now()
          }, token).catch(e => console.error("Firestore job update failed:", e));
        }
        
        try {
          const firstImageFile = files && Array.isArray(files) ? files.find((f: any) => f.mimeType && f.mimeType.startsWith('image/')) : null;
          
          const endpointKey = isProTier ? 'video_hd' : 'video_standard';
          const modelRole = isProTier ? 'video_pro' : 'video_core';
          const rawVideoModel = await getModelEndpointId(endpointKey, getNajeModel(modelRole), token);
          let videoModelId = resolveEngineModel(rawVideoModel);

          // For Pro tier or explicit omni requests, prefer gemini-omni-1.1-flash-preview
          if (model === 'omni' || isProTier && !videoModelId.startsWith('veo')) {
            if (!videoModelId.includes('omni')) {
              videoModelId = 'gemini-omni-1.1-flash-preview';
            }
          }

          const requestedRes = config?.resolution === '1080p' ? '1080p' : '720p';

          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: 'generating',
              progress: 60,
              stepLabel: 'جاري التوليد...',
              type: 'video',
              createdAt: Date.now()
            }, token).catch(e => console.error("Firestore job update failed:", e));
          }

          if (videoModelId.includes('omni')) {
            console.log(`[Omni Video Gen] Generating video with ${videoModelId} (duration=${durSec}s, res=${requestedRes}, aspect=${selectedVideoAspect})...`);
            const omniPromptText = `${auditedVideoPrompt}\nDuration: ${durSec} seconds. Resolution: ${requestedRes}. Aspect ratio: ${selectedVideoAspect}.`;
            
            let interactionInput: any;
            if (firstImageFile && firstImageFile.data && firstImageFile.mimeType) {
              interactionInput = [
                {
                  type: 'image',
                  data: firstImageFile.data,
                  mime_type: firstImageFile.mimeType
                },
                {
                  type: 'text',
                  text: omniPromptText
                }
              ];
            } else {
              interactionInput = omniPromptText;
            }

            try {
              const interaction = await ai.interactions.create({
                model: videoModelId,
                input: interactionInput,
                response_modalities: ['video', 'text'],
                store: true
              }, { timeout: 300000 });

              interactionId = interaction.id;
              for (const step of interaction.steps || []) {
                if (step.type === 'model_output') {
                  for (const c of step.content || []) {
                    if ((c as any).type === 'video' && (c as any).data) {
                      generationResult = (c as any).data;
                      mimeType = (c as any).mime_type || 'video/mp4';
                      extension = 'mp4';
                      break;
                    }
                  }
                }
              }

              if (!generationResult) {
                throw new Error("لم يحتوي رد النموذج على محتوى فيديو صالح.");
              }
            } catch (omniErr: any) {
              console.warn(`[Omni Video Gen] Primary generation failed with ${videoModelId}:`, omniErr?.message || omniErr);
              console.log(`[Omni Video Gen] Falling back to Veo Pro (veo-3.1-generate-001)...`);
              const veoFallbackParams: any = {
                model: 'veo-3.1-generate-001',
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
              const operation = await ai.models.generateVideos(veoFallbackParams);
              const op = new GenerateVideosOperation();
              op.name = operation.name;
              let done = false;
              let attempt = 0;
              while (!done && attempt < 60) {
                const updated = await ai.operations.getVideosOperation({ operation: op });
                if (updated.done) {
                  done = true;
                  const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
                  if (!uri) throw new Error("لم يتم العثور على رابط تحميل الفيديو الناتج من Veo.");
                  let videoRes = await fetch(uri, {
                    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! }
                  });
                  if (!videoRes.ok) {
                    const altUri = uri.includes('?') ? `${uri}&key=${process.env.GEMINI_API_KEY}` : `${uri}?key=${process.env.GEMINI_API_KEY}`;
                    videoRes = await fetch(altUri);
                  }
                  if (!videoRes.ok) {
                    throw new Error(`تعذر تنزيل ملف الفيديو من الخادم (${videoRes.status})`);
                  }
                  const arrayBuffer = await videoRes.arrayBuffer();
                  generationResult = Buffer.from(arrayBuffer).toString('base64');
                  mimeType = "video/mp4";
                  extension = "mp4";
                  break;
                }
                attempt++;
                await new Promise(resolve => setTimeout(resolve, 5000));
              }
              if (!done) {
                throw new Error("انتهت مهلة انتظار توليد الفيديو البديل.");
              }
            }
          } else {
            if (!videoModelId.startsWith('veo')) {
              videoModelId = isProTier ? 'veo-3.1-generate-001' : 'veo-3.1-lite-generate-001';
            }
            const veoParams: any = {
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
              operation = await ai.models.generateVideos(veoParams);
            } catch (veoErr: any) {
              console.warn(`[Veo Gen] Initial attempt failed with model=${veoParams.model}:`, veoErr?.message || veoErr);
              if (veoParams.model !== 'veo-3.1-lite-generate-001') {
                console.log(`[Veo Gen] Retrying with veo-3.1-lite-generate-001 fallback...`);
                veoParams.model = 'veo-3.1-lite-generate-001';
                veoParams.config.resolution = '720p';
                operation = await ai.models.generateVideos(veoParams);
              } else if (requestedRes !== '720p') {
                console.warn(`[Veo Gen] Failed with resolution=${requestedRes}, retrying with 720p fallback:`, veoErr?.message || veoErr);
                veoParams.config.resolution = '720p';
                operation = await ai.models.generateVideos(veoParams);
              } else {
                throw veoErr;
              }
            }
            
            const op = new GenerateVideosOperation();
            op.name = operation.name;

            let done = false;
            let attempt = 0;
            const maxAttempts = 60;
            while (!done && attempt < maxAttempts) {
              const updated = await ai.operations.getVideosOperation({ operation: op });
              if (updated.done) {
                done = true;
                const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
                if (!uri) throw new Error("لم يتم العثور على رابط تحميل الفيديو الناتج من Veo.");
                
                let videoRes = await fetch(uri, {
                  headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! }
                });
                if (!videoRes.ok) {
                  const altUri = uri.includes('?') ? `${uri}&key=${process.env.GEMINI_API_KEY}` : `${uri}?key=${process.env.GEMINI_API_KEY}`;
                  videoRes = await fetch(altUri);
                }
                if (!videoRes.ok) {
                  throw new Error(`تعذر تنزيل ملف الفيديو من الخادم (رمز الاستجابة: ${videoRes.status})`);
                }
                const arrayBuffer = await videoRes.arrayBuffer();
                generationResult = Buffer.from(arrayBuffer).toString('base64');
                mimeType = "video/mp4";
                extension = "mp4";
                break;
              }
              attempt++;
              await new Promise(resolve => setTimeout(resolve, 5000));
            }

            if (!done) {
              throw new Error("انتهت مهلة انتظار توليد الفيديو من Veo.");
            }
          }

          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
               status: 'generating',
               progress: 85,
               stepLabel: 'اللمسات الأخيرة...',
               type: 'video',
               createdAt: Date.now()
            }, token).catch(e => console.error(e));
          }

          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: 'completed',
              progress: 100,
              stepLabel: 'تم توليد وإخراج الفيديو بنجاح!',
              type: 'video',
              createdAt: Date.now()
            }, token).catch(e => console.error(e));
          }

        } catch(err) {
          throw err;
        }
      } else if (type === 'voice') {
        const voiceMode = req.body.voiceMode === 'dual' ? 'dual' : 'single';
        const voiceTier = (String(req.body.voiceTier || req.body.model || 'core')).toLowerCase() === 'pro' ? 'pro' : 'core';
        const selectedVoice = req.body.selectedVoice || 'Kore';

        /**
         * HARD PLATFORM LIMIT — DO NOT ATTEMPT TO ADD A THIRD SPEAKER.
         * Gemini's multiSpeakerVoiceConfig supports EXACTLY TWO distinct speakers. This is not a current
         * quota or preview-tier restriction — it is a fixed API constraint (confirmed against Google's
         * official Gemini API speech-generation documentation). Requesting a third speakerVoiceConfig
         * entry returns a hard API error, not a graceful degradation. مهندس الصوت (the Sound Engineer
         * persona) must reflect this limit in how it reasons about dialogue requests: a request
         * describing three or more distinct people talking should be handled by مهندس الصوت either by
         * (a) selecting the two most central speakers and narrating the rest, or (b) asking the user to
         * simplify to two speakers via الناقد's clarification path (Part 1c above) — never by attempting
         * a third speakerVoiceConfig entry.
         */
        const speaker1Voice = req.body.speaker1Voice || 'Puck';
        const speaker2Voice = req.body.speaker2Voice || 'Kore';
        const speaker1Name = (req.body.speaker1Name || 'المتحدث الأول').trim();
        const speaker2Name = (req.body.speaker2Name || 'المتحدث الثاني').trim();
        const deliveryStyle = req.body.deliveryStyle || 'default';

        const styleInstruction = DELIVERY_STYLES_MAP[deliveryStyle] || '';

        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: 'thinking',
            progress: 8,
            stepLabel: 'أفهم النص والنبرة المطلوبة وأجهّز الإيقاع...',
            type: 'voice',
            createdAt: Date.now()
          }, token).catch(e => console.error(e));
        }

        let finalScript = prompt.trim();

        if (voiceMode === 'dual') {
          // Check if prompt is already strictly formatted line-by-line (e.g. "أحمد: ..." and "سارة: ...")
          const lines = finalScript.split('\n').map(l => l.trim()).filter(Boolean);
          const spk1Lower = speaker1Name.toLowerCase();
          const spk2Lower = speaker2Name.toLowerCase();

          const isStrictlyFormatted = lines.length > 0 && lines.every(l => {
            const colonIdx = l.indexOf(':');
            if (colonIdx === -1) return false;
            const prefix = l.substring(0, colonIdx).trim().toLowerCase();
            return prefix === spk1Lower || prefix === spk2Lower;
          });

          if (!isStrictlyFormatted) {
            // Use AI Gateway to parse and transform colloquial, informal, or narrative user inputs into clean speaker dialogue
            try {
              console.log("[Voice Gen Dual Gateway] Transforming informal/colloquial/narrative input into structured dialogue script...");
              const scriptGenRes = await ai.models.generateContent({
                model: 'gemini-3.5-flash-lite',
                config: { maxOutputTokens: OUTPUT_TOKEN_LIMITS.voiceScript },
                contents: `You are an AI Smart Dialogue Formatting Gateway for Multi-Speaker Text-to-Speech (Arabic & English).

Target Speaker 1 Name: "${speaker1Name}"
Target Speaker 2 Name: "${speaker2Name}"
Desired Style/Tone: "${styleInstruction || 'Natural colloquial conversation'}"

User Raw Input:
"""
${prompt}
"""

YOUR TASK:
1. Carefully analyze the user input. The user might provide:
   - Informal or colloquial narrative text (e.g., "احمد بيقول السماء صافيه ترد ساره لا الجو مش صافي")
   - Narrative story sentences (e.g., "قال أحمد كذا ثم أجابت سارة كذا")
   - A general topic idea or rough notes (e.g., "حوار بين أحمد وسارة عن فوائد الذكاء الاصطناعي")
2. Extract or draft the exact spoken dialogue lines for each speaker (${speaker1Name} and ${speaker2Name}).
3. Map any speaker references (like "أحمد", "احمد", "سارة", "ساره", "بيقول", "ردت", "قالت") strictly to the exact names "${speaker1Name}" and "${speaker2Name}".
4. Clean out narrative carrier verbs ("بيقول", "ترد", "قالت", "أجاب", "علق") from the spoken text, so ONLY the spoken statement remains.
5. Keep the exact dialect, colloquial tone, and natural phrasing (Egyptian, Gulf, Levantine, Standard Arabic, or English) intended by the user.
6. Format EVERY single line strictly as:
${speaker1Name}: [spoken text]
${speaker2Name}: [spoken text]

RULES:
- Alternate lines cleanly between ${speaker1Name} and ${speaker2Name}.
- Do NOT include any intro text, markdown code blocks, titles, or stage directions.
- Output ONLY the clean line-by-line dialogue script.

Example Output:
${speaker1Name}: السماء صافية النهاردة والجو جميل.
${speaker2Name}: لا والله، الجو مش صافي وفي تراب.`
              });

              const generatedText = scriptGenRes?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (generatedText && generatedText.trim().length > 5) {
                finalScript = generatedText.trim();
                console.log("[Voice Gen Dual Gateway] Transformed Script Output:\n" + finalScript);
              }
            } catch (gatewayErr: any) {
              console.warn("[Voice Gen Dual Gateway] Transformation failed, using fallback script:", gatewayErr?.message || gatewayErr);
            }
          }
        }

        /**
         * =========================================================================
         * ARCHITECTURAL DIRECTIVE & GEMINI API HARD LIMIT: 2-SPEAKER DIALOGUES ONLY
         * =========================================================================
         * The Google Gemini API TTS engine enforces a non-negotiable hard ceiling:
         * `multiSpeakerVoiceConfig.speakerVoiceConfigs` MUST contain EXACTLY 2 distinct
         * speaker configurations. The API does NOT support 3+ speakers in a single
         * generation pass and will reject the payload if more are provided.
         * 
         * To comply seamlessly without failing user prompts:
         * 1. Multi-character dialogues must be mapped down to 2 primary speakers
         *    (via `detectAndParseDialogue` in councilOfMinds.ts).
         * 2. Any additional dialogue roles should be narrated by speaker 1 or 2.
         * 3. Two distinct voice names must be assigned (e.g. Aoede + Fenrir).
         * =========================================================================
         */
        const speechConfig: any = {};
        if (voiceMode === 'dual') {
          speechConfig.multiSpeakerVoiceConfig = {
            speakerVoiceConfigs: [
              { speaker: speaker1Name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker1Voice } } },
              { speaker: speaker2Name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker2Voice } } },
            ]
          };
        } else {
          speechConfig.voiceConfig = {
            prebuiltVoiceConfig: { voiceName: selectedVoice }
          };
        }

        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: 'generating_audio',
            progress: 30,
            stepLabel: 'جاري تحويل النص إلى تسجيل صوتي احترافي...',
            type: 'voice',
            createdAt: Date.now()
          }, token).catch(e => console.error(e));
        }

        // For dual speaker TTS, Gemini API requires every turn to start with speaker name directly.
        const scriptPrompt = voiceMode === 'dual'
          ? finalScript
          : (styleInstruction 
              ? `${styleInstruction}\n\nRead/TTS the following script as spoken audio:\n${finalScript}`
              : `Read/TTS the following script as spoken audio:\n${finalScript}`);

        const isProVoice = voiceTier === 'pro';
        const targetEndpoint = isProVoice ? 'voice_tts_pro' : (voiceMode === 'dual' ? 'voice_tts_standard' : 'voice_tts');
        const defaultFallback = isProVoice ? getNajeModel('voice_pro') : getNajeModel('voice_core');
        const ttsModelId = resolveEngineModel(await getModelEndpointId(targetEndpoint, defaultFallback, token));

        let response: any = null;
        try {
          response = await ai.models.generateContent({
            model: ttsModelId,
            contents: scriptPrompt,
            config: {
              responseModalities: ['AUDIO'],
              speechConfig,
              maxOutputTokens: OUTPUT_TOKEN_LIMITS.audioSpeech
            } as any
          });
        } catch (ttsErr: any) {
          console.warn("[Voice Gen] Dual or primary TTS call failed, attempting fallback call:", ttsErr?.message || ttsErr);
          // Retry with standard fallback speech config or core fallback model
          const fallbackModelId = resolveEngineModel(getNajeModel('voice_core'));
          const fallbackSpeechConfig = voiceMode === 'dual' ? speechConfig : { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } };
          try {
            response = await ai.models.generateContent({
              model: fallbackModelId,
              contents: scriptPrompt,
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: fallbackSpeechConfig,
                maxOutputTokens: OUTPUT_TOKEN_LIMITS.audioSpeech
              } as any
            });
          } catch (retryErr: any) {
            console.warn("[Voice Gen] Second attempt failed, retrying single-speaker fallback:", retryErr?.message || retryErr);
            try {
              response = await ai.models.generateContent({
                model: fallbackModelId,
                contents: `Read/TTS the following dialogue/script as spoken audio:\n${finalScript}`,
                config: {
                  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker1Voice || selectedVoice } } },
                  maxOutputTokens: OUTPUT_TOKEN_LIMITS.audioSpeech
                } as any
              });
            } catch (finalErr: any) {
              console.error("[Voice Gen] Final fallback failed:", finalErr?.message || finalErr);
              throw finalErr;
            }
          }
        }

        const candidate = response?.candidates?.[0];
        const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData && (p.inlineData.mimeType?.startsWith('audio/') || p.inlineData.data));

        if (audioPart && audioPart.inlineData?.data) {
          const rawPcm = Buffer.from(audioPart.inlineData.data, 'base64');
          const sampleRate = parseSampleRateFromMimeType(audioPart.inlineData.mimeType, 24000);
          const wavBuffer = pcmToWav(rawPcm, sampleRate);
          generationResult = wavBuffer.toString('base64');
          mimeType = 'audio/wav';
          extension = 'wav';

          const billed = calcVoicePointsCost({
            text: spokenTextFromVoiceScript(finalScript || prompt || ''),
            tier: voiceTier === 'pro' ? 'pro' : 'core',
            pointsPerCharacter: pricing.voice?.pointsPerCharacter,
            pointsPerCharacterPro: pricing.voice?.pointsPerCharacterPro,
            minCost: pricing.voice?.minCost
          });
          cost = billed.cost;

          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: 'completed',
              progress: 100,
              stepLabel: 'تم تحويل وتوليد التسجيل الصوتي بنجاح!',
              type: 'voice',
              createdAt: Date.now()
            }, token).catch(e => console.error(e));
          }
        } else {
          throw new Error("لم يتم إرجاع ملف صوتي ناتج من النموذج. يرجى التأكد من أن النص واضح وصالح للقراءة.");
        }

      } else if (type === 'document') {
        let rawDocType = String(requestedDocType || 'pdf_slides').toLowerCase().trim();
        if (rawDocType === 'pptx' || rawDocType === 'powerpoint' || rawDocType === 'ppt') {
          docTypeToUse = 'pptx';
        } else if (rawDocType === 'docx' || rawDocType === 'word' || rawDocType === 'doc' || rawDocType === 'document') {
          docTypeToUse = 'docx';
        } else if (rawDocType === 'pdf_doc' || rawDocType === 'document_pdf') {
          docTypeToUse = 'pdf_doc';
        } else {
          docTypeToUse = 'pdf_slides';
        }
        // Load the Skills Library once for this whole document run.
        const skillsList = await getSkills();
        const skillsBlock = buildSkillsBlock(skillsList, docTypeToUse);
        
        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: 'starting',
            currentStepIndex: 0,
            stepLabel: formatStepLabelWithProject('جاري التخطيط وتحديد العناصر الأساسية للمستند...', projectData),
            totalSteps: 3,
            type: 'document',
            docType: docTypeToUse,
            createdAt: Date.now()
          }, token).catch(e => console.error("Firestore job update failed:", e));
        }

        const NajeEngine = await getNajeEngineCtor();
        const naje = new NajeEngine(process.env.GEMINI_API_KEY!);
        // Respect the user's requested size with hard ceilings: Presentation/slides max MAX_SLIDES, Word/PDF max MAX_PAGES.
        const requestedSlides = parseInt(slidesCount) || 0;
        const requestedPages = parseInt(pagesCount) || 0;
        const clampedSlides = requestedSlides > 0 ? Math.min(requestedSlides, MAX_SLIDES) : 8;
        const clampedPages = requestedPages > 0 ? Math.min(requestedPages, MAX_PAGES) : 5;

        const targetSections = (docTypeToUse === 'pptx' || docTypeToUse === 'pdf_slides')
          ? clampedSlides
          : clampedPages;
        
        let sections: any[] = [];
        let documentTitle = '';
        let artDirection: any = {};
        let totalSections = 0;
        totalSteps = 0;

        if (docTypeToUse !== 'pdf_slides') {
          const outline = await naje.generateDocumentOutline(prompt, targetSections);
          sections = (outline.sections || []).slice(0, targetSections);
          documentTitle = outline.title;
          
          if (outline.theme && outline.colors) {
            artDirection = { theme: outline.theme, colors: outline.colors };
          } else {
            artDirection = await (naje as any).generateArtDirection(prompt, projectData?.brandProfile);
          }
          if (projectData && projectData.brandProfile && projectData.brandProfile.colors) {
              artDirection.colors = projectData.brandProfile.colors;
          }
          
          totalSections = sections.length;
          totalSteps = totalSections + 2; 
          
          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: 'toc_generated',
              currentStepIndex: 0,
              stepLabel: formatStepLabelWithProject('تم تحديد الفهرس والشرائح الأساسية للمستند بنجاح...', projectData),
              totalSteps,
              sections: sections.map((s: any) => ({ title: s.title || '', description: s.description || '' })),
              type: 'document',
              docType: docTypeToUse,
              createdAt: Date.now()
            }, token).catch(e => console.error("Firestore job update failed:", e));
          }
        }

        if (docTypeToUse === 'pdf_slides') {
          const { generatePdfSlides, transcribeSource } = await import('./src/lib/pdf-engine.js');
          
          const projectDocs: string = projectData?.sourceDocuments
            ? (Array.isArray(projectData.sourceDocuments)
                ? projectData.sourceDocuments.join('\n\n')
                : String(projectData.sourceDocuments))
            : '';
          
          const slidesConfigDoc = await getDocRest('slides_config', 'global', token).catch(() => null);
          const slidesConfig = slidesConfigDoc || {};
          
          const modelId = slidesConfig?.modelId || 'gemini-3.6-flash';
          const { text: uploadedText, truncated } = await transcribeSource(ai, files || [], modelId);
          const sourceText = [projectDocs, uploadedText].filter(Boolean).join('\n\n');
          
          const updateProgress = async (step: number, label: string) => {
             if (jobId) {
               await setDocRest("generation_jobs", jobId, {
                  status: step < 4 ? 'generating' : 'assembling',
                  currentStepIndex: step,
                  stepLabel: formatStepLabelWithProject(label, projectData),
                  totalSteps: 4,
                  type: 'document',
                  docType: docTypeToUse,
                  createdAt: Date.now()
               }, token).catch(e => console.error(e));
             }
          };

          const result = await generatePdfSlides(prompt, sourceText, clampedSlides, slidesConfig, updateProgress);
          
          generationResult = result.base64Data;
          mimeType = result.mimeType;
          extension = result.extension;
          var groundingReport = result.groundingReport;
          if (result.slideCount) {
             cost = result.slideCount * (pricing.document.pdf_per_slide || 0.20);
          }
          
          // 'completed' status moved to after point deduction
        } else if (docTypeToUse === 'pptx') {
          const slideWriterModel = await getModelEndpointId('slide_writer', getNajeModel('personas'), token);
          const slideAuditorModel = await getModelEndpointId('document_engine', getNajeModel('personas'), token);

          const NajeEngine = await getNajeEngineCtor();
          const naje = new NajeEngine(process.env.GEMINI_API_KEY!);
          totalSteps = sections.length + 2;
          
          var generatedSlides: any[] = [];
          let completedCount = 0;
          const slidePromises = sections.map(async (section: any, idx: number) => {
            let slideData: any;
            try {
              // Writer tier: author slide JSON
              slideData = await naje.generateSlideJSON(section.title, section.description, artDirection, 0, slideWriterModel);
              
              // Auditor tier: review slide JSON for structure, brevity, and visual assignments
              const auditRes = await auditSlideChunk(ai, slideData, slideAuditorModel);
              if (auditRes.ok && auditRes.refinedSlide) {
                slideData = auditRes.refinedSlide;
              } else if (!auditRes.ok) {
                console.warn(`[PPTX Gen] Slide ${idx+1} failed audit, retrying authoring once with writer tier:`, auditRes.reason);
                slideData = await naje.generateSlideJSON(section.title, section.description, artDirection, 0, slideWriterModel);
              }

              // Hard-lock: never trust the model's own theme/colors, always use the deck-wide locked values
              slideData.theme = artDirection.theme;
              slideData.colors = artDirection.colors;
            } catch(e) {
              console.error("Slide generation error:", e);
              slideData = { 
                 layoutTemplate: 'title_slide', 
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
                status: 'writing_section',
                currentStepIndex: completedCount,
                stepLabel: `جاري تصميم وتنسيق شريحة: ${section.title}`,
                totalSteps,
                sections: sections.map((s: any) => ({ title: s.title || '', description: s.description || '' })),
                type: 'document',
                docType: docTypeToUse,
                createdAt: Date.now()
              }, token).catch(e => console.error("Firestore job update failed:", e));
            }
            
            return slideData;
          });
          
          generatedSlides = await Promise.all(slidePromises);

          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: 'assembling',
              currentStepIndex: totalSteps - 1,
              stepLabel: 'جاري تجميع وحفظ ملف العرض التقديمي النهائي...',
              totalSteps,
              sections: sections.map((s: any) => ({ title: s.title || '', description: s.description || '' })),
              type: 'document',
              docType: docTypeToUse,
              slides: generatedSlides,
              createdAt: Date.now()
            }, token).catch(e => console.error("Firestore job update failed:", e));
          }

          const base64Data = await naje.renderPPTX(generatedSlides, projectData?.brandProfile);
          if (!base64Data || !base64Data.startsWith('UEsD')) throw new Error("PPTX_CORRUPT");
          generationResult = base64Data;
          mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          extension = 'pptx';
        } else {
          const docWriterModel = await getModelEndpointId('document_writer', getNajeModel('personas'), token);
          const docAuditorModel = await getModelEndpointId('document_engine', getNajeModel('personas'), token);

          const brandBgHex = artDirection?.colors?.background || '0B0F19';
          const bgHex = brandBgHex.startsWith('#') ? brandBgHex : `#${brandBgHex}`;

          const brandTitleHex = artDirection?.colors?.title || 'FFFFFF';
          const titleHex = brandTitleHex.startsWith('#') ? brandTitleHex : `#${brandTitleHex}`;

          const brandTextHex = artDirection?.colors?.text || 'cbd5e1';
          const textHex = brandTextHex.startsWith('#') ? brandTextHex : `#${brandTextHex}`;

          const brandAccentHex = artDirection?.colors?.accent || '6366F1';
          const accentHex = brandAccentHex.startsWith('#') ? brandAccentHex : `#${brandAccentHex}`;

          const fullContent: string[] = new Array(sections.length);
          let completedSectionsCount = 0;
          const CONCURRENCY_LIMIT = 3;

          for (let i = 0; i < sections.length; i += CONCURRENCY_LIMIT) {
            const batch = sections.slice(i, i + CONCURRENCY_LIMIT);
            await Promise.all(batch.map(async (section: any, idxInBatch: number) => {
              const index = i + idxInBatch;
              let cleanHtml = '';

              const fetchSectionHtml = async (modelToUse: string) => {
                const secRes = await generateContentWithFallback(ai, {
                  model: modelToUse,
                  contents: `أنت تكتب قسماً واحداً ضمن مستند عربي متصل واحترافي.
${skillsBlock}

اكتب محتوى هذا القسم: "${section.title}" — ${section.description}

اكتب بالشكل الطبيعي للمحتوى: إن كان العمل سردياً/إبداعياً فاكتب نثراً روائياً متدفّقاً وحواراً ووصفاً (بدون قوائم نقطية ولا عناوين فرعية تقنية)، وإن كان معلوماتياً فاكتب نثراً منظّماً غنياً ومفصلاً. نفّذ طلب المستخدم حرفياً وابنِ عليه بأفضل جودة.

أعد فقط JSON بهذا الشكل بالضبط وبدون أي نص إضافي:
{"finalHtml":"وسوم HTML نظيفة مثل <p> و <ul> و <strong> بدون <html> أو <body> أو علامات markdown"}`
                });
                const cleanJsonText = (secRes.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJsonText);
                return parsed.finalHtml || '';
              };

              try {
                // Writer tier pass
                cleanHtml = await fetchSectionHtml(docWriterModel);

                // Chunk-level Audit pass (Auditor tier: gemini-3.5-flash-lite)
                const priorContextSummary = sections.slice(0, index).map((s: any) => s.title).join(' -> ');
                const auditRes = await auditDocChunk(ai, section.title, cleanHtml, priorContextSummary, docAuditorModel);
                if (auditRes.ok && auditRes.refinedHtml) {
                  cleanHtml = auditRes.refinedHtml;
                } else if (!auditRes.ok) {
                  console.warn(`[Doc Gen] Section ${index+1} failed audit, retrying authoring once with writer tier...`);
                  cleanHtml = await fetchSectionHtml(docWriterModel);
                }
              } catch (e) {
                console.error("Doc section generation error:", e);
                cleanHtml = cleanHtml || "<p>عذراً، حدث خطأ أثناء توليد هذا القسم.</p>";
              }

              completedSectionsCount++;
              if (jobId) {
                await setDocRest("generation_jobs", jobId, {
                  status: 'writing_section',
                  currentStepIndex: completedSectionsCount,
                  stepLabel: `جاري صياغة وتحرير قسم: ${section.title}`,
                  totalSteps,
                  sections: sections.map((s: any) => ({ title: s.title || '', description: s.description || '' })),
                  type: 'document',
                  docType: docTypeToUse,
                  createdAt: Date.now()
                }, token).catch(e => console.error("Firestore job update failed:", e));
              }

              if (docTypeToUse === 'pdf_doc') {
                fullContent[index] = `<section class="doc-section"><h2>${section.title}</h2><div>${cleanHtml}</div></section>`;
              } else {
                fullContent[index] = `<h2>${section.title}</h2><div>${cleanHtml}</div>`;
              }
            }));
          }

          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: 'assembling',
              currentStepIndex: totalSteps - 1,
              stepLabel: 'جاري تجميع الملف وتحويله للتنسيق المطلوب...',
              totalSteps,
              sections: sections.map((s: any) => ({ title: s.title || '', description: s.description || '' })),
              type: 'document',
              docType: docTypeToUse,
              createdAt: Date.now()
            }, token).catch(e => console.error("Firestore job update failed:", e));
          }

          const displayTitle = typeof documentTitle === 'string' ? documentTitle : 'مستند';
          const primaryColor = projectData?.brandProfile?.colors?.[0] || '#4f46e5';
          const textColor = projectData?.brandProfile?.colors?.[1] || '#374151';

          const fontPath = path.resolve(process.cwd(), 'cairo_arabic.b64');
          const docTextForSafety = fullContent.join('\n');
          // P2-2: Post-generation safety check
          const postSafety2 = await isSafePrompt(docTextForSafety, uid, type, token);
          if (!postSafety2.safe) {
             throw new Error("عذراً، تم حظر المحتوى المُولد لمخالفته شروط السلامة.");
          }
          
          let base64Font = '';
          if (fs.existsSync(fontPath)) {
            base64Font = fs.readFileSync(fontPath, 'utf8').trim();
          }

          const isA5Paper = paperSize === 'a5';
          const pageWidthMm = isA5Paper ? 148 : 210;
          const pageHeightMm = isA5Paper ? 210 : 297;

          let htmlContent = '';
          if (docTypeToUse === 'pdf_doc') {
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
  @page { size: ${pageWidthMm}mm ${pageHeightMm}mm; margin: ${isA5Paper ? '14mm 12mm' : '20mm 18mm'}; }
  body { background:#fff; color:#111; font-size:${isA5Paper ? '10.5pt' : '12pt'}; line-height:1.75; font-family: 'Cairo', sans-serif; margin: 0; padding: 0; }
  .doc-section { page-break-inside: avoid; }
  h2 { font-size: ${isA5Paper ? '14pt' : '17pt'}; margin-top: 1.4em; color: #111; }
</style>
</head>
<body>
${fullContent.join('')}
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
${fullContent.join('')}
</div>
</body></html>`;
          }

          if (docTypeToUse === 'pdf_doc') {
            const chromium = (await import('@sparticuz/chromium')).default;
            const puppeteer = (await import('puppeteer-core')).default;
            let browser: any = null;
            const { chromiumSemaphore } = await import('./src/lib/pdf-engine.js');
            await chromiumSemaphore.acquire();
            try {
              browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: true,
              });
              const page = await browser.newPage();
              await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
              await page.evaluateHandle('document.fonts.ready');
              await page.emulateMediaType('screen');
              const pdfBuffer = await page.pdf({
                format: isA5Paper ? 'A5' : 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margin: isA5Paper
                  ? { top: '14mm', right: '12mm', bottom: '14mm', left: '12mm' }
                  : { top: '20mm', right: '18mm', bottom: '20mm', left: '18mm' },
              });
              { const _b = Buffer.from(pdfBuffer); if (_b.length < 5 || _b.subarray(0,4).toString('latin1') !== '%PDF') throw new Error("PDF_CORRUPT"); }
              generationResult = Buffer.from(pdfBuffer).toString('base64');
              mimeType = 'application/pdf';
              extension = 'pdf';
            } finally {
              if (browser) await browser.close();
              chromiumSemaphore.release();
            }
          } else {
            // Build REAL OOXML paragraphs (portable to Google Docs/Drive, LibreOffice, mobile).
            // Default docx rendering for any word/docx/other document format
            const htmlToDocxModule = await import('html-to-docx');
            const HTMLtoDOCX = (htmlToDocxModule.default || htmlToDocxModule) as any;
            const docxOut: any = await HTMLtoDOCX(htmlContent, null, {
              table: { row: { cantSplit: true } },
              footer: false,
              header: false,
              pageNumber: false,
            });

            let buffer: Buffer;
            if (Buffer.isBuffer(docxOut)) {
              buffer = docxOut;
            } else if (docxOut && typeof docxOut.arrayBuffer === 'function') {
              buffer = Buffer.from(await docxOut.arrayBuffer());
            } else if (docxOut instanceof ArrayBuffer) {
              buffer = Buffer.from(new Uint8Array(docxOut));
            } else {
              buffer = Buffer.from(docxOut);
            }

            // A real .docx is a ZIP (starts with 0x50 0x4B = "PK"). Fail loudly, never ship garbage.
            if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
              throw new Error('DOCX_CORRUPT: generated bytes are not a valid Office document');
            }

            generationResult = buffer.toString('base64');
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            extension = 'docx';
          }
        }

        // 'completed' status moved to after point deduction

      } else if (type === 'infographic') {
        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: 'starting',
            currentStepIndex: 0,
            stepLabel: 'جاري استدعاء المصمم وتحليل البيانات والمؤشرات...',
            totalSteps: 3,
            progress: 15,
            type: 'infographic',
            createdAt: Date.now()
          }, token).catch(e => console.error(e));
        }

        const { 
          generateInfographicSpec, 
          editInfographicSpec, 
          renderInfographic 
        } = await import('./src/lib/infographicEngine.js');

        let spec: any;
        let sources: any[] = [];
        let groundingTokens: any;
        let structuringTokens: any;

        const infographicContext = {
          ...(projectData || {}),
          theme: req.body.theme || req.body.infographicTheme || 'naje_auto_blend',
          colorPalette: req.body.colorPalette || (req.body.themeColors ? [req.body.themeColors] : undefined),
          layoutStyle: req.body.layoutStyle,
        };

        if (isEdit && req.body.originalSpec) {
          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: 'processing',
              currentStepIndex: 1,
              stepLabel: 'جاري تطبيق التعديل على تصميم الإنفوجرافيك...',
              totalSteps: 3,
              progress: 50,
            }, token).catch(e => console.error(e));
          }
          const editRes = await editInfographicSpec(ai, req.body.originalSpec, prompt, infographicContext);
          spec = editRes.spec;
          structuringTokens = editRes.structuringTokens;
        } else {
          if (jobId) {
            await setDocRest("generation_jobs", jobId, {
              status: 'processing',
              currentStepIndex: 1,
              stepLabel: 'جاري بناء الهيكل البصري وتنسيق الثيم والألوان...',
              totalSteps: 3,
              progress: 45,
            }, token).catch(e => console.error(e));
          }
          const genRes = await generateInfographicSpec(ai, prompt, infographicContext);
          spec = genRes.spec;
          sources = genRes.sources || [];
          groundingTokens = genRes.groundingTokens;
          structuringTokens = genRes.structuringTokens;
        }

        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: 'processing',
            currentStepIndex: 2,
            stepLabel: 'جاري تصيير الإنفوجرافيك بدقة فائقة وتجهيز التصدير (PNG + PDF)...',
            totalSteps: 3,
            progress: 80,
          }, token).catch(e => console.error(e));
        }

        const rendered = await renderInfographic(spec);
        generationResult = rendered.pngBase64;
        mimeType = 'image/png';
        extension = 'png';

        if (groundingTokens) {
          await chargeForTextModelUsage(uid, 'gemini-3.5-flash-lite', groundingTokens, userIsAdmin).catch(console.error);
        }
        if (structuringTokens) {
          await chargeForTextModelUsage(uid, 'gemini-3.5-flash-lite', structuringTokens, userIsAdmin).catch(console.error);
        }

        documentData = {
          title: spec.title || 'إنفوجرافيك بيانات',
          spec,
          sources,
          pdfBase64: rendered.pdfBase64,
          html: rendered.html
        };

      } else {
        const contents: any[] = [];
        
        if (req.body.history && Array.isArray(req.body.history)) {
          const isUiChat = type === 'ui';
          for (const msg of req.body.history) {
            let contentForModel = msg.content;

            // For ui chats: never send a full HTML document inside history.
            // The ONLY authoritative copy is the one in editPromptText below.
            if (isUiChat && msg.role === 'assistant' && contentForModel &&
                /<!DOCTYPE html|<html[\s>]/i.test(contentForModel.slice(0, 300))) {
              contentForModel = '[واجهة سابقة تم توليدها — النسخة الحالية الكاملة مرفقة في الرسالة الأخيرة]';
            }

            const parts: any[] = [{ text: contentForModel }];
            if (msg.files && Array.isArray(msg.files)) {
              msg.files.forEach((f: any) => {
                const cleanData = f.data && f.data.includes(',') ? f.data.split(',')[1] : f.data;
                parts.push({
                  inlineData: {
                    data: cleanData,
                    mimeType: f.mimeType
                  }
                });
              });
            }
            contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts });
          }
        }

        const currentParts: any[] = [{ text: prompt }];
        if (files && Array.isArray(files)) {
          files.forEach((file: any) => {
            if (file.data && file.mimeType) {
              const cleanData = file.data.includes(',') ? file.data.split(',')[1] : file.data;
              currentParts.push({
                inlineData: {
                  data: cleanData,
                  mimeType: file.mimeType
                }
              });
            }
          });
        }
        contents.push({ role: 'user', parts: currentParts });

function extractCleanHtml(text: string): string {
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
}

        if (type === 'text' || type === 'ui') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          });

          const isPlanMode = req.body.mode === 'plan';
          let finalSystemInstruction = systemInstruction;
          let tools = [];
          let isUiEdit = false;
          let previousHtml = "";

          if (type === 'ui') {
            if (isPlanMode) {
              finalSystemInstruction = `${finalSystemInstruction}\n\n---\n\nThe user is in PLANNING mode. Do not write any HTML or code. Respond in clear, organized Arabic: propose a structure (sections, order, purpose of each), suggest content and layout choices, and ask clarifying questions if the request is vague. End by inviting the user to switch to "بناء" (Build) mode when ready to generate.`;
            } else {
              isUiEdit = req.body.isEdit;
              previousHtml = extractCleanHtml(req.body.previousHtml || "");

              if (!previousHtml && req.body.history && Array.isArray(req.body.history)) {
                for (let i = req.body.history.length - 1; i >= 0; i--) {
                  const msg = req.body.history[i];
                  if (msg.role === 'assistant' && msg.content) {
                    const cleaned = extractCleanHtml(msg.content);
                    if (cleaned.includes('<!DOCTYPE') || cleaned.includes('<html')) {
                      previousHtml = cleaned;
                      isUiEdit = true;
                      break;
                    }
                  }
                }
              }

              let styleHintText = "";
              if (req.body.styleHint) {
                const hints: Record<string, string> = {
                  modern: "\n[STYLE DIRECTION: Modern, crisp layout with high-contrast accent colors]",
                  dark_luxury: "\n[STYLE DIRECTION: Dark luxury theme with sleek dark background, gold/amber accents, and smooth shadows]",
                  minimal: "\n[STYLE DIRECTION: Minimalist design with maximum negative space and refined typography]",
                  playful: "\n[STYLE DIRECTION: Playful theme with vibrant colors, rounded elements, and friendly feel]",
                  corporate: "\n[STYLE DIRECTION: Professional corporate aesthetic with clean grid layout and corporate blues]"
                };
                styleHintText = hints[req.body.styleHint] || "";
              }

              if (isUiEdit && previousHtml) {
                finalSystemInstruction = `${finalSystemInstruction}\n\n---\n\nYou are editing an EXISTING HTML interface within an ongoing conversation. The conversation history above includes how this interface was originally planned and built, and any earlier edits. You will now receive the CURRENT complete HTML document and a new edit instruction.

Reply in TWO parts: FIRST one short friendly Arabic sentence (max ~18 words) telling the user what you changed — this is your chat reply. Then a single newline, then the COMPLETE updated HTML document with ONLY the requested change applied.

CRITICAL RULES:
- Preserve everything the user did not ask to change — exact layout, colors, content, structure, and any prior edits. Change only what the instruction asks.
- Do not restructure, do not "improve" unrelated parts, do not drop sections.
- Keep the same overall design language and color palette unless the edit explicitly changes them.
- The CURRENT HTML DOCUMENT below is the one true source of truth to modify — do not regenerate from the earlier conversation description; edit the document as given.
- The conversation history above shows the sequence of instructions. Previous interface versions are intentionally omitted from that history and replaced with a placeholder — this is deliberate.
- Output the full document (<!DOCTYPE html> ... </html>), inline everything, same security rules as before: no external resources, no network.`;

                let editPromptText = "";
                if (req.body.selectedElement && req.body.selectedElement.html) {
                  editPromptText = `CURRENT HTML DOCUMENT:\n\`\`\`html\n${previousHtml}\n\`\`\`\n\nTARGET ELEMENT CONTEXT:\n- Description: ${req.body.selectedElement.desc}\n- Snippet: ${req.body.selectedElement.html}\n\nEDIT INSTRUCTION:\n${prompt}${styleHintText}`;
                } else {
                  editPromptText = `CURRENT HTML DOCUMENT:\n\`\`\`html\n${previousHtml}\n\`\`\`\n\nEDIT INSTRUCTION:\n${prompt}${styleHintText}`;
                }

                // Append/Update user turn — do NOT erase contents array. History stays intact.
                if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
                  contents[contents.length - 1].parts[0].text = editPromptText;
                } else {
                  contents.push({ role: 'user', parts: [{ text: editPromptText }] });
                }

                if (type === 'ui' && isUiEdit) {
                  const totalChars = contents.reduce((s: number, c: any) =>
                    s + (c.parts?.[0]?.text?.length || 0), 0);
                  console.log(`[UI Edit] historyTurns=${contents.length} totalInputChars=${totalChars} htmlLen=${previousHtml.length}`);
                }
              } else {
                finalSystemInstruction = `${finalSystemInstruction}\n\n---\n\nYou are Naje Studio, an elite UI engineer. You produce a SINGLE, COMPLETE, self-contained HTML document rendering a polished, modern, production-grade interface.

OUTPUT
- FIRST write ONE short friendly Arabic sentence (max ~18 words) telling the user what you built — this line is your chat reply to the user. Then a single newline.
- THEN the HTML document: start <!DOCTYPE html>, end </html>. No markdown, no fences, and no commentary INSIDE or AFTER the HTML.
- Everything inline: <style> for CSS, <script> for JS. No external files, no CDN, no <link>, no @import, no fetch. Assume zero network.
- Imagery: inline SVG, CSS gradients, and CSS shapes only. No external image URLs.

CAPABILITIES YOU HAVE (all inline, no network):
- A micro-animation CSS kit: add class "naje-fade-in", "naje-slide-up", "naje-stagger", "naje-scale-in" to animate elements on load. Use them for a refined entrance.
- An inline icon sprite: use <svg><use href="#icon-{name}"/></svg> with names like home, user, search, menu, chart, cart, star, arrow-right, check, settings, bell, calendar, trash, edit, filter, plus, heart.
- An inline chart function najeChart(el, {type, data}) for bar/line/donut. Use it for dashboards and data UIs — real charts, not fake bars.

RESPONSIVE DESIGN — MANDATORY, NOT OPTIONAL
You are generating for TWO explicit viewport targets that will be tested separately: a 390px-wide phone and a 1280px-wide laptop. This is not "make it fluid" — you must author DISTINCT layout behavior for each range using real CSS breakpoints.

Requirements:
- Use \`@media (max-width: 640px)\` as the phone breakpoint. Inside it, you MUST change actual layout structure, not just font sizes:
  - Multi-column grids collapse to a single column.
  - Sidebars/navigation move to a bottom bar, a hamburger drawer, or stack above content — never remain side-by-side with the main content.
  - Any table becomes a stacked card list or gains horizontal scroll.
  - Reduce padding/margins appropriately for a small screen.
- Use a mobile-first base with \`min-width\` media queries to progressively add multi-column layout for laptop, OR a desktop-first base with \`max-width\` queries to collapse for mobile — pick one strategy and apply it consistently.
- Never rely on the browser viewport alone to "just reflow" — write explicit rules. A design with zero layout-changing media queries is a FAILED response for this product; visual polish does not compensate for a non-responsive structure.
- Touch targets on the phone layout must be at least 44x44px.
- Test yourself mentally: if the sidebar/nav is still beside the content at 390px width, you have failed this requirement — fix it before returning.

CONCRETE EXAMPLE — follow this exact pattern for a sidebar layout:

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
- DESIGN SYSTEM — USE THE NAJE KIT, DON'T REINVENT SPACING/RADIUS/SHADOW VALUES
  A base stylesheet is already injected before your <style> block, providing:
  --naje-radius-sm/md/lg, --naje-shadow-sm/md/lg, --naje-space-1 through 6, and
  utility classes .naje-card, .naje-btn, .naje-btn-primary, .naje-input.
  USE THESE for structural values (radius, shadow, spacing) so output is consistent and professional.
- Use a refined type scale (a clear ratio, e.g. 1.25) with real hierarchy.
- Add depth with layered shadows and subtle borders, never flat gray boxes.
- Entrance animation on load using the animation kit — the page should feel like it arrives, not just appear.
- Populate with realistic, specific content for the actual subject. Never lorem ipsum, never "Item 1 / Item 2".
- Accessibility: semantic landmarks, labelled controls, visible focus states, sufficient contrast.

INTERACTION & BACKEND SIMULATION (make it feel fully functional to try)
- Working client-side interactivity: tabs switch, modals open/close, accordions expand, form fields show focus/validation states, mobile menus toggle.
- When the request implies data/state (a todo list, a cart, a login flow, a dashboard with records), implement a complete in-memory JavaScript data layer:
  * An array/object acting as the "database", pre-populated with a few realistic example records.
  * Functions that perform create/read/update/delete against that in-memory store.
  * Wire every UI action (add, edit, delete, submit, "log in") to actually call these functions and re-render — the app must be genuinely interactive and stateful within the session, not a static mockup.
  * A simple login form may accept ANY input and simulate success.
- All self-contained vanilla JS. No frameworks, no network.

ARABIC / RTL
- If the subject or content is Arabic, set dir="rtl", mirror the layout, and use a right-to-left visual flow. Latin-only tokens (brand names, code) stay LTR.

Aim for output a senior product designer would approve. Restraint, hierarchy, and polish over decoration.
تذكير: في وضع البناء، مخرجك هو مستند HTML فقط بلا أي مقدمات أو تعليقات.`;

                if (styleHintText && contents.length > 0) {
                  contents[contents.length - 1].parts[0].text += styleHintText;
                }
              }
            }
          } else {
            const decls: any[] = [
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

          const hasFunctionDecls = tools.some((t: any) => t.functionDeclarations && t.functionDeclarations.length > 0);
          const hasBuiltinTools = tools.some((t: any) => t.googleSearch || t.codeExecution);
          const toolConfig = (hasFunctionDecls && hasBuiltinTools)
            ? { includeServerSideToolInvocations: true }
            : undefined;

          const textLiteModel = await getModelEndpointId('text_lite', getNajeModel('lite'), token);
          const textCoreModel = await getModelEndpointId('text_core', getNajeModel('core'), token);
          const textMaxModel = await getModelEndpointId('text_max', getNajeModel('pro'), token);
          const uiModelId = await getModelEndpointId('ui_standard', getNajeModel('core'), token);

          const MODEL_MAP: Record<string, string> = {
            lite: textLiteModel,
            core: textCoreModel,
            max: textMaxModel
          };
          const requestedModelKey = String(req.body.model || 'core').toLowerCase();
          const selectedModelId = resolveEngineModel(type === 'ui' ? uiModelId : (MODEL_MAP[requestedModelKey] || textCoreModel));
          console.log(`[UI Generation] type=${type}, requestedModel=${requestedModelKey}, selectedModelId=${selectedModelId}, mode=${req.body.mode || 'build'}`);

          // QUANTUM LEAP: CALL 1 (Plan Pass) & Real AI Imagery Generation for new UI builds
          let generatedImageSlots: Record<string, string> = {};
          if (type === 'ui' && !isPlanMode && !isUiEdit) {
            try {
              const planResp = await ai.models.generateContent({
                model: resolveEngineModel(uiModelId),
                contents: [
                  { role: 'user', parts: [{ text: `Analyze this UI request: "${prompt}". Produce a concise JSON plan:
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
                let planContext = `\n\n[STAGED UI BUILD PLAN]:\n- Architecture: ${JSON.stringify(uiPlan.sections)}\n- Design System: ${JSON.stringify(uiPlan.designSystem)}\n- Chart Needed: ${uiPlan.needsChart}`;
                
                // Real AI Imagery Generation
                if (uiPlan.needsRealImagery && Array.isArray(uiPlan.imagePrompts) && uiPlan.imagePrompts.length > 0 && (pricing.ui?.enableGeneratedImagery ?? true)) {
                  const promptsToRun = uiPlan.imagePrompts.slice(0, 2);
                  const sharpModule = await import('sharp');
                  const sharp: any = sharpModule.default || sharpModule;
                  for (let idx = 0; idx < promptsToRun.length; idx++) {
                    const imgPrompt = promptsToRun[idx];
                    try {
                      let rawBase64 = "";
                      if (USE_VERTEX_AI) {
                        const imgRes = await ai.models.generateImages({
                          model: 'imagen-3.0-generate-002',
                          prompt: `Professional high quality photo of ${imgPrompt}. Clean, cinematic, modern, realistic lighting.`,
                          config: { numberOfImages: 1, aspectRatio: '4:3', outputMimeType: 'image/png' }
                        });
                        rawBase64 = imgRes?.generatedImages?.[0]?.image?.imageBytes || "";
                      } else {
                        const imgInteraction = await ai.interactions.create({
                          model: 'gemini-3.1-flash-image',
                          input: `Professional high quality photo of ${imgPrompt}. Clean, cinematic, modern, realistic lighting.`,
                          response_modalities: ['image']
                        });
                        for (const step of imgInteraction.steps) {
                          if (step.type === 'model_output') {
                            const img = step.content?.find((c: any) => c.type === 'image');
                            if (img && img.data) {
                              rawBase64 = img.data;
                              break;
                            }
                          }
                        }
                      }
                      if (rawBase64) {
                        const rawBuf = Buffer.from(rawBase64, 'base64');
                        const compressedBuf = await sharp(rawBuf)
                          .resize(800, 600, { fit: 'inside' })
                          .jpeg({ quality: 78 })
                          .toBuffer();
                        const slotKey = `hero-photo-${idx + 1}`;
                        generatedImageSlots[slotKey] = `data:image/jpeg;base64,${compressedBuf.toString('base64')}`;
                      }
                    } catch (imgErr) {
                      console.warn(`[UI Staged Imagery] Generation failed for prompt "${imgPrompt}":`, imgErr);
                    }
                  }
                  if (Object.keys(generatedImageSlots).length > 0) {
                    const imgAddon = Object.keys(generatedImageSlots).length * (pricing.ui?.imagePerAsset || 0.5);
                    cost += imgAddon;
                    planContext += `\n- GENERATED REAL IMAGES TO EMBED DIRECTLY IN UI (use src attribute with data URI):`;
                    for (const [slotKey, dataUri] of Object.entries(generatedImageSlots)) {
                      planContext += `\n  * <img src="${dataUri}" alt="Photo" class="w-full object-cover rounded-xl" />`;
                    }
                  }
                }
                finalSystemInstruction += planContext;
              }
            } catch (planErr) {
              console.warn('[UI Staged Pipeline] Call 1 Plan pass skipped:', planErr);
            }
          }

          let stream: any = null;
          let streamModelUsed = selectedModelId;
          const streamConfig = {
            systemInstruction: finalSystemInstruction,
            tools: tools.length > 0 ? tools : undefined,
            toolConfig: toolConfig,
            maxOutputTokens: type === 'ui' ? OUTPUT_TOKEN_LIMITS.uiHtml : OUTPUT_TOKEN_LIMITS.chatResponse,
            thinkingConfig: { thinkingLevel: requestedModelKey === 'lite' ? 'LOW' : requestedModelKey === 'max' ? 'HIGH' : 'MEDIUM' },
            // Gemini 3.7 rejects deprecated sampling params and non-config fields
            // (aspectRatio/quality are image-only). Strip them before spreading.
            ...(() => { const { aspectRatio, quality, temperature, topP, topK, ...rest } = (config || {}); return rest; })()
          };

          try {
            stream = await ai.models.generateContentStream({
              model: selectedModelId,
              contents,
              config: streamConfig
            });
          } catch (primaryStreamErr: any) {
            console.warn(`[Stream Generation] Primary model "${selectedModelId}" stream initialization failed:`, primaryStreamErr?.message || primaryStreamErr);
            const fallbackCandidate = selectedModelId !== 'gemini-3.1-flash-lite' && selectedModelId !== 'gemini-3.5-flash-lite'
              ? resolveEngineModel(getNajeModel('lite'))
              : 'gemini-3.6-flash';
            if (fallbackCandidate && fallbackCandidate !== selectedModelId) {
              console.log(`[Stream Generation] Retrying stream with fallback model "${fallbackCandidate}"...`);
              try {
                stream = await ai.models.generateContentStream({
                  model: fallbackCandidate,
                  contents,
                  config: streamConfig
                });
                streamModelUsed = fallbackCandidate;
              } catch (fallbackStreamErr: any) {
                console.error(`[Stream Generation] Fallback model "${fallbackCandidate}" also failed:`, fallbackStreamErr?.message || fallbackStreamErr);
                throw fallbackStreamErr;
              }
            } else {
              throw primaryStreamErr;
            }
          }

          let fullText = "";
          let functionCalls: any[] = [];
          let searchSources: Array<{ title: string; url: string }> = [];
          let planViolationDetected = false;
          let streamUsageMetadata: any = null;
          const maxOutputBytes = ((pricing.ui?.maxOutputKb || 400) * 1024);

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
                    if (!searchSources.some(s => s.url === url)) {
                      searchSources.push({ title, url });
                    }
                  }
                }
              }
              const chunkText = extractGeminiText(chunk);
              if (chunkText) {
                fullText += chunkText;

                // PART 1.1: Per-chunk Plan Mode Violation Check (stop immediately if HTML emitted)
                if (type === 'ui' && isPlanMode && !planViolationDetected) {
                  if (/<!DOCTYPE html|<html[\s>]/i.test(fullText.slice(0, 300))) {
                    planViolationDetected = true;
                    console.warn(`[Plan Mode Violation] Detected HTML mid-stream, aborting generation. uid=${uid}`);
                    break;
                  }
                }

                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
                if (type === 'ui' && fullText.length > maxOutputBytes) {
                  break;
                }
              }
            }
          } catch (streamIterErr: any) {
            console.warn(`[Stream Chunk Iteration Warning] Stream interrupted mid-flight:`, streamIterErr?.message || streamIterErr);
          }

          // If stream yielded zero text and no function calls, attempt a non-streaming backup generation
          if (!fullText && functionCalls.length === 0 && !planViolationDetected) {
            console.warn(`[Stream Generation] Model "${streamModelUsed}" yielded empty text. Attempting non-streaming backup generation...`);
            try {
              const backupModel = resolveEngineModel(getNajeModel('lite'));
              const backupResp = await ai.models.generateContent({
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
                res.write(`data: ${JSON.stringify({ text: fullText })}\n\n`);
              }
            } catch (backupErr: any) {
              console.error("[Stream Generation] Backup generation failed:", backupErr?.message || backupErr);
            }
          }

          if (planViolationDetected) {
            res.write(`data: ${JSON.stringify({ replaceContent: "(حصل خطأ بسيط أثناء التخطيط، جرّب صياغة الطلب بشكل مختلف.)" })}\n\n`);
            res.write(`data: ${JSON.stringify({ modeConfirmed: 'plan' })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            res.end();
            return;
          }

          if (type === 'ui' && isUiEdit && previousHtml && fullText) {
            const similarity = structuralSimilarity(previousHtml, fullText);
            console.log(`[Edit Fidelity] similarity=${similarity.toFixed(2)} model=${selectedModelId} uid=${uid}`);
            if (similarity < 0.5) {
              console.warn(`[Edit Fidelity] LOW similarity (${similarity.toFixed(2)}) — model regenerated instead of editing. Forcing a strict re-edit.`);
              try {
                const reEdit = await ai.models.generateContent({
                  model: selectedModelId,
                  contents: [
                    { role: 'user', parts: [{ text: `You must EDIT the document below IN PLACE. Apply ONLY this change: "${prompt}". Keep everything else identical — same layout, colors, text, structure, and all prior content. Do NOT regenerate, redesign, reorder, or drop anything.\n\nCURRENT HTML DOCUMENT:\n\`\`\`html\n${previousHtml}\n\`\`\`\n\nReturn ONLY the full edited document, starting with <!DOCTYPE html> and ending with </html>, no markdown fences.` }] }
                  ],
                  config: {
                    maxOutputTokens: OUTPUT_TOKEN_LIMITS.uiHtml
                  }
                });
                let corrected = (reEdit.text || '').trim();
                if (corrected.startsWith('```html')) corrected = corrected.replace(/^```html\s*/, '').replace(/\s*```$/, '');
                else if (corrected.startsWith('```')) corrected = corrected.replace(/^```\s*/, '').replace(/\s*```$/, '');
                if (corrected.includes('<!DOCTYPE') && corrected.includes('</html>') && structuralSimilarity(previousHtml, corrected) > similarity) {
                  fullText = corrected;
                  res.write(`data: ${JSON.stringify({ replaceContent: fullText })}\n\n`);
                  console.log(`[Edit Fidelity] Strict re-edit applied (similarity improved).`);
                }
              } catch (reErr) { console.warn('[Edit Fidelity] re-edit failed:', reErr); }
            }
          }

          // PART 4.3: CALL 3 (Polish Pass) — Automatic Responsive Correction
          if (type === 'ui' && !isPlanMode && !isUiEdit && fullText && (pricing.ui?.enablePolishPass ?? true)) {
            const respCheck = hasStructuralResponsiveness(fullText);
            if (!respCheck.hasMediaQuery || !respCheck.changesLayout) {
              console.log(`[UI Polish Pass] Responsiveness check failed on initial output — running Polish pass.`);
              try {
                const polishResp = await ai.models.generateContent({
                  model: selectedModelId,
                  contents: [
                    { role: 'user', parts: [{ text: `Your generated HTML failed the mobile responsiveness requirement — it must restructure at 640px (e.g., collapse multi-column layouts, stack sidebars/navigation, or restructure tables into card lists).

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
                if (polishResp.text && polishResp.text.includes('<!DOCTYPE') && polishResp.text.includes('</html>')) {
                  let correctedHtml = polishResp.text.trim();
                  if (correctedHtml.startsWith('```html')) correctedHtml = correctedHtml.replace(/^```html\s*/, '').replace(/\s*```$/, '');
                  else if (correctedHtml.startsWith('```')) correctedHtml = correctedHtml.replace(/^```\s*/, '').replace(/\s*```$/, '');
                  
                  fullText = correctedHtml;
                  res.write(`data: ${JSON.stringify({ replaceContent: fullText })}\n\n`);
                  console.log(`[UI Polish Pass] Successfully generated responsive correction.`);
                }
              } catch (polishErr) {
                console.warn(`[UI Polish Pass] Failed:`, polishErr);
              }
            }
          }

          let finalBalanceForStream = currentBalance;
          const streamProducedArtifact =
            !fullText ? false
            : (typeof fullText === 'string' ? (type === 'ui' ? fullText.length > 200 : fullText.length > 0) : !!fullText);

          if (cost > 0 && !streamProducedArtifact && functionCalls.length === 0) {
            // generation was requested and priced, but nothing came out — do not charge
            res.write(`data: ${JSON.stringify({ error: 'تعذّر إكمال استجابة النموذج. لم يتم خصم أي نقاط.' })}\n\n`);
            res.end();
            return;
          }

          if (cost > 0 && streamProducedArtifact) {
            try {
              const atomicRes = await mutateBalanceAtomic(uid, -cost, { requireSufficient: true });
              if (atomicRes.ok) {
                finalBalanceForStream = atomicRes.newBalance;
              } else {
                console.error("Stream point deduction failed:", atomicRes.reason);
              }
            } catch (deductErr: any) {
              console.error("Failed to deduct points in stream:", deductErr);
            }
            await createDocRest("api_cost_log", { 
              uid, 
              type, 
              model: type === 'ui' ? (req.body.model || 'core') : 'text', 
              costInPoints: cost, 
              estimatedCostUSD: 0.01, 
              inputTokens: streamUsageMetadata?.promptTokenCount || undefined,
              outputTokens: streamUsageMetadata?.candidatesTokenCount || undefined,
              cachedContentTokenCount: streamUsageMetadata?.cachedContentTokenCount || 0,
              createdAt: Date.now() 
            }, undefined).catch(console.error);
          }

          const recallCall = functionCalls.find(fc => fc.name === "recall_project_memory");
          if (recallCall && recallCall.args && recallCall.args.itemId) {
            try {
              const pid = String(req.body.projectId || (projectData && projectData.id) || '');
              const itemIdToFetch = String(recallCall.args.itemId);
              if (pid && itemIdToFetch) {
                let itemData = await getDocRest(`projects/${pid}/memory_items`, itemIdToFetch, token).catch(() => null);
                if (!itemData) {
                  try {
                    const memItemSnap = await dbAdmin
                      .collection('projects')
                      .doc(pid)
                      .collection('memory_items')
                      .doc(itemIdToFetch)
                      .get();

                    if (memItemSnap.exists) {
                      itemData = memItemSnap.data();
                    }
                  } catch (e) {}
                }

                if (itemData) {
                  const rawFullText = itemData.storageRef || itemData.content || itemData.summary || '';
                  
                  const followUp = await ai.models.generateContent({
                    model: selectedModelId,
                    contents: [
                      ...contents,
                      { role: 'model', parts: [{ functionCall: recallCall }] },
                      { role: 'user', parts: [{ functionResponse: { name: "recall_project_memory", response: { content: rawFullText } } }] }
                    ],
                    config: { systemInstruction, maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse }
                  });

                  if (followUp.text) {
                    fullText += "\n\n" + followUp.text;
                    res.write(`data: ${JSON.stringify({ text: "\n\n" + followUp.text })}\n\n`);
                  }
                }
              }
            } catch (recallErr) {
              console.error("recall_project_memory execution error:", recallErr);
            }
          }

          const docGenCall = functionCalls.find(fc => fc.name === "generate_document");
          if (docGenCall && docGenCall.args && docGenCall.args.docType) {
            const extractedType = String(docGenCall.args.docType).toLowerCase();
            const summaryPrompt = docGenCall.args.summary || prompt;
            const estimatedCount = Number(docGenCall.args.estimatedPageOrSlideCount) || 5;
            if (!fullText) {
              fullText = `لقد قمت بإعداد مسودة لإنشاء مستند (${extractedType.toUpperCase()})، يمكنك تأكيد البدء من الزر أدناه.`;
              res.write(`data: ${JSON.stringify({ text: fullText })}\n\n`);
            }
            res.write(`data: ${JSON.stringify({ triggerDocGeneration: extractedType, triggerPrompt: summaryPrompt, estimatedCount })}\n\n`);
          }

          let streamTokenBill: Awaited<ReturnType<typeof chargeForTextModelUsage>> | null = null;
          try {
            const billingEndpointId = type === 'ui'
              ? 'ui_standard'
              : (requestedModelKey === 'lite' ? 'text_lite' : requestedModelKey === 'max' ? 'text_max' : 'text_core');
            streamTokenBill = await chargeForTextModelUsage(uid, billingEndpointId, streamUsageMetadata, userIsAdmin);
            if (typeof streamTokenBill.newBalance === 'number') {
              finalBalanceForStream = streamTokenBill.newBalance;
            }
          } catch (meterErr) {
            console.error('Stream token metering error:', meterErr);
          }

          const streamEndPayload: any = { modeConfirmed: (type === 'ui' && isPlanMode) ? 'plan' : 'build' };
          if (searchSources.length > 0) streamEndPayload.searchSources = searchSources;
          if (typeof groundingReport !== 'undefined' && groundingReport) streamEndPayload.groundingReport = groundingReport;
          if (typeof finalBalanceForStream === 'number') streamEndPayload.newBalance = finalBalanceForStream;
          if (streamTokenBill) {
            streamEndPayload.usage = {
              charged: streamTokenBill.charged || 0,
              inputTokens: streamTokenBill.inputTokens || 0,
              outputTokens: streamTokenBill.outputTokens || 0,
              cachedTokens: streamTokenBill.cachedTokens || 0,
              thoughtsTokens: streamTokenBill.thoughtsTokens || 0,
              billingType: 'per_token'
            };
            streamEndPayload.consumedBalance = streamTokenBill.charged || 0;
          }
          res.write(`data: ${JSON.stringify(streamEndPayload)}\n\n`);
          res.write(`data: [DONE]\n\n`);
          res.end();
          return;
        }

        const nonStreamDecls: any[] = [
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

        const response = await ai.models.generateContent({
          model: resolveEngineModel(selectedModelId || 'gemini-3.6-flash'),
          contents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: nonStreamDecls }],
            maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse,
            ...(() => { const { aspectRatio, quality, temperature, topP, topK, ...rest } = (config || {}); return rest; })()
          }
        });

        if (response.usageMetadata) {
          await chargeForTextModelUsage(uid, selectedModelId || 'gemini-3.6-flash', response.usageMetadata, userIsAdmin).catch(e => console.error("Text generate metering error:", e));
        }
        
        let textResult = response.text || "";
        const recallCall = response.functionCalls?.find(fc => fc.name === "recall_project_memory");
        if (recallCall && recallCall.args && recallCall.args.itemId && type === 'text') {
          try {
            const pid = String(req.body.projectId || (projectData && projectData.id) || '');
            const itemIdToFetch = String(recallCall.args.itemId);
            if (pid && itemIdToFetch) {
              let itemData = await getDocRest(`projects/${pid}/memory_items`, itemIdToFetch, token).catch(() => null);
              if (!itemData) {
                try {
                  const memItemSnap = await dbAdmin
                    .collection('projects')
                    .doc(pid)
                    .collection('memory_items')
                    .doc(itemIdToFetch)
                    .get();

                  if (memItemSnap.exists) {
                    itemData = memItemSnap.data();
                  }
                } catch (e) {}
              }

              if (itemData) {
                const rawFullText = itemData.storageRef || itemData.content || itemData.summary || '';

                const followUp = await ai.models.generateContent({
                  model: resolveEngineModel(selectedModelId || 'gemini-3.6-flash'),
                  contents: [
                    ...contents,
                    { role: 'model', parts: [{ functionCall: recallCall }] },
                    { role: 'user', parts: [{ functionResponse: { name: "recall_project_memory", response: { content: rawFullText } } }] }
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

        const docGenCall = response.functionCalls?.find(fc => fc.name === "generate_document");
        
        if (docGenCall && docGenCall.args && docGenCall.args.docType && type === 'text') {
           const extractedType = String(docGenCall.args.docType).toLowerCase();
           const summaryPrompt = docGenCall.args.summary || prompt;
           
           return res.json({ 
             success: true, 
             type: 'text', 
             result: textResult, 
             triggerDocGeneration: extractedType,
             triggerPrompt: summaryPrompt,
             estimatedCount: Number(docGenCall.args.estimatedPageOrSlideCount) || 5
           });
        }
        
        generationResult = textResult;
      }

      if (jobId && type !== 'document' && model !== 'veo') {
        await setDocRest("generation_jobs", jobId, {
          status: 'completed',
          progress: 100,
          stepLabel: type === 'image' ? 'تم تصميم وتوليد صورتك الإبداعية بنجاح!' : 'تم الانتهاء وتجهيز المقطع بنجاح!',
          type,
          createdAt: Date.now()
        }, token).catch(e => console.error("Firestore job update failed:", e));
      }

      // P1-3: Brand Memory / N-CORE Stage 2
      if (projectData && projectData.id && !projectData.brandProfile) {
        // Fire and forget brand profile generation
        (async () => {
           try {
              const ai = createGenAIClient();
              const profileRes = await ai.models.generateContent({
                 model: 'gemini-3.5-flash-lite',
                 contents: `Extract a brand profile based on this project data and user request.
Entity Type: ${projectData.entityType || 'غير محدد'}
Project Name: ${projectData.name || 'مشروع جديد'}
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
              const brandProfile = JSON.parse(profileRes.text || '{}');
              if (brandProfile.colors) {
                 await updateDocFieldsRest("projects", projectData.id, { brandProfile }, ["brandProfile"], token);
                 console.log("Created brand profile for project:", projectData.id);
              }
           } catch(e) {
              console.error("Failed to generate brand profile:", e);
           }
        })();
      }

      // 5. Deduct points and log cost via Firestore Transaction
      let finalBalance = currentBalance;
      const producedArtifact =
        type !== 'document'
          ? !!generationResult
          : (typeof generationResult === 'string' && generationResult.length > 0) || (typeof generationResult !== 'string' && !!generationResult);

      if (!producedArtifact) {
        if (reservedPoints && cost > 0) {
          await mutateBalanceAtomic(uid, cost).catch(e => console.error("Refund failed on missing artifact:", e));
        }
        if (jobId) {
          await setDocRest("generation_jobs", jobId, {
            status: 'failed',
            error: "تعذّر إنشاء الملف. يرجى التأكد من كتابة نص مفهوم أو إرفاق مستند صالح والتجربة مرة أخرى.",
            stepLabel: 'تعذّر إنشاء الملف. لم يتم خصم أي نقاط.',
            completedAt: Date.now()
          }, token).catch(e => console.error(e));
        }
        if (req.body.chatId) {
          await createDocRest("messages", {
            ownerId: uid,
            chatId: req.body.chatId,
            role: 'assistant',
            content: 'تعذّر إنشاء الملف. يرجى المحاولة مرة أخرى. لم يتم خصم أي نقاط من رصيدك.',
            createdAt: Date.now(),
            isError: true,
            jobId: jobId || undefined
          }, token).catch(e => console.error("Failed to write failure message to db:", e));
        }
        if (!res.headersSent) {
          return res.status(500).json({
            error: 'تعذّر إنشاء الملف. لم يتم خصم أي نقاط من رصيدك.'
          });
        }
        return;
      }

      // Server-side cloud upload for guaranteed persistence across all devices & admin panel
      let permanentMediaUrl: string | null = null;
      if (producedArtifact && generationResult && (type === 'image' || type === 'video' || type === 'voice' || type === 'document' || type === 'infographic')) {
        try {
          const ext = extension || (type === 'video' ? 'mp4' : type === 'voice' ? 'wav' : type === 'document' ? (docTypeToUse === 'docx' ? 'docx' : 'pdf') : 'png');
          const storagePath = `generated_media/${uid}/media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
          const contentType = mimeType || (type === 'video' ? 'video/mp4' : type === 'voice' ? 'audio/wav' : type === 'document' ? (ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf') : 'image/png');
          
          const cleanBase64 = typeof generationResult === 'string' && generationResult.includes(',') ? generationResult.split(',')[1] : generationResult;
          const buffer = typeof cleanBase64 === 'string' ? Buffer.from(cleanBase64, 'base64') : Buffer.from(cleanBase64);
          
          const bucket = getStorage().bucket(STORAGE_BUCKET);
          const file = bucket.file(storagePath);
          await file.save(buffer, {
            metadata: { contentType },
            public: true,
            resumable: false,
          });
          permanentMediaUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
          console.log(`[Server Media Upload] Successfully uploaded ${type} to cloud: ${permanentMediaUrl}`);
        } catch (uploadErr: any) {
          console.log("[Server Media Upload] Server storage upload notice (using client storage fallback):", uploadErr?.message || uploadErr);
        }
      }

      if (cost > 0) {
        try {
          if (!reservedPoints) {
            const atomicRes = await mutateBalanceAtomic(uid, -cost, { requireSufficient: true });
            if (!atomicRes.ok) {
              if (atomicRes.reason === 'INSUFFICIENT') {
                if (!res.headersSent) return res.status(400).json({ error: `رصيدك غير كافٍ لإتمام هذا الطلب. تحتاج إلى ${cost} نقاط.` });
              }
              if (!res.headersSent) return res.status(500).json({ error: "فشل خصم الرصيد في قاعدة البيانات." });
            }
            finalBalance = atomicRes.newBalance;
          } else {
            finalBalance = Math.max(0, currentBalance - cost);
          }

          // Profit Margin Logging (P2-10)
          let estimatedCostUSD = 0.01;
          try {
            const pricingEndpointDoc = await dbAdmin.collection('model_pricing').doc(type === 'image' ? (model === 'nova' ? 'image_pro' : 'image_standard') : type === 'video' ? 'video_standard' : type === 'document' ? 'doc_standard' : 'default').get();
            if (pricingEndpointDoc.exists && typeof pricingEndpointDoc.data()?.costUsd === 'number') {
              estimatedCostUSD = pricingEndpointDoc.data()!.costUsd;
            } else {
              if (type === 'image') {
                estimatedCostUSD = model === 'nova' ? 0.134 : 0.067;
              } else if (type === 'video') {
                estimatedCostUSD = (parseFloat(duration) || 5) * (model === 'veo' ? 0.05 : 0.10);
              } else if (type === 'document') {
                estimatedCostUSD = docSize === 'small' ? 0.05 : 0.10;
              }
            }
          } catch {}

          await createDocRest("api_cost_log", {
            uid,
            type,
            model: model || requestedDocType || 'text',
            costInPoints: cost,
            estimatedCostUSD,
            createdAt: Date.now()
          }, undefined).catch(e => console.error("Failed to write api_cost_log:", e));
        } catch (outerErr: any) {
          console.error("Deduction block error:", outerErr);
        }
      }

      // 6. Create notifications (Generation Complete & Low Balance)
      try {
        const isImageVideoOrDoc = (type === 'image' || type === 'video' || type === 'document' || type === 'infographic' || (type === 'text' && requestedDocType && requestedDocType !== 'none'));
        
        if (isImageVideoOrDoc) {
          const typeLabel = type === 'image' ? 'الصورة' : type === 'video' ? 'الفيديو' : type === 'infographic' ? 'الإنفوجرافيك' : 'المستند';
          await createDocRest("notifications", {
            ownerId: uid,
            title: 'اكتمل التوليد بنجاح',
            message: `تم الانتهاء من توليد طلبك (${typeLabel}) بنجاح.`,
            type: 'system',
            read: false,
            createdAt: Date.now()
          }, token).catch(e => console.error("Failed to create completion notification:", e));
        }

        if (finalBalance < 1 && currentBalance >= 1) {
          const recentNotifications = await queryDocsByFieldRest("notifications", "ownerId", uid, token, 20);
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          const hasRecentBilling = (recentNotifications || []).some(
            (n: any) => n.type === "billing" && n.createdAt >= oneDayAgo
          );

          if (!hasRecentBilling) {
            await createDocRest("notifications", {
              ownerId: uid,
              title: 'رصيدك منخفض',
              message: 'رصيد نقاطك أصبح أقل من نقطة واحدة. اشحن رصيدك لمواصلة التوليد.',
              type: 'billing',
              read: false,
              createdAt: Date.now()
            }, token).catch(e => console.error("Failed to create low balance notification:", e));
          }
        }
      } catch (notifErr) {
        console.error("Failed to create notifications:", notifErr);
      }

      let documentData: any = null;
      if (type === 'document' && (requestedDocType || docTypeToUse)) {
        const localDocId = jobId || Date.now().toString();
        documentData = {
          id: localDocId,
          url: permanentMediaUrl || null,
          mimeType: mimeType || (docTypeToUse === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf'),
          extension: extension || (docTypeToUse === 'docx' ? 'docx' : 'pdf'),
          filename: `NajeAI_Document.${extension || (docTypeToUse === 'docx' ? 'docx' : 'pdf')}`,
          slides: typeof generatedSlides !== 'undefined' ? generatedSlides : undefined,
          groundingReport: typeof groundingReport !== 'undefined' ? groundingReport : undefined
        };
      }

      // Write completed job state
      if (jobId) {
        const stepLabel = type === 'image' 
          ? 'تم تصميم وتوليد صورتك الإبداعية بنجاح!' 
          : type === 'video' 
          ? 'تم الانتهاء وتجهيز المقطع بنجاح!' 
          : type === 'infographic'
          ? 'تم تصميم وتصدير الإنفوجرافيك بنجاح (PNG + PDF)!'
          : type === 'document' 
          ? (docTypeToUse === 'pdf_slides' ? 'اكتمل إنشاء شرائح PDF بنجاح!' : 'اكتمل إنشاء المستند الإبداعي بنجاح مذهل!') 
          : 'تم الانتهاء بنجاح!';

        const jobPayload: any = {
          status: 'completed',
          progress: 100,
          currentStepIndex: totalSteps || 4,
          stepLabel,
          type: (requestedDocType && requestedDocType !== 'none') ? 'document' : type,
          docType: type === 'document' ? docTypeToUse : undefined,
          result: permanentMediaUrl || generationResult,
          permanentMediaUrl,
          mimeType,
          extension,
          interactionId,
          documentData,
          consumedBalance: cost,
          newBalance: finalBalance,
          completedAt: Date.now()
        };
        if (typeof generatedSlides !== 'undefined' && generatedSlides) jobPayload.slides = generatedSlides;
        if (typeof groundingReport !== 'undefined' && groundingReport) jobPayload.groundingReport = groundingReport;

        await setDocRest("generation_jobs", jobId, jobPayload, token).catch(e => console.error("Firestore job update failed:", e));
      }

      // Write assistant message directly to Firestore so it persists even if client disconnected
      if (req.body.chatId) {
        const assistantContent = type === 'document' ? `تم إنشاء مستند ${docTypeToUse.toUpperCase()} بنجاح.` 
          : type === 'infographic' ? 'تم تصميم الإنفوجرافيك وتجهيز ملفات PNG و PDF بنجاح.'
          : 'تم التوليد بنجاح.';
        const msgDoc: any = {
          ownerId: uid,
          chatId: req.body.chatId,
          role: 'assistant',
          content: assistantContent,
          createdAt: Date.now(),
          jobId: jobId || undefined,
          mediaUrl: permanentMediaUrl || (typeof generationResult === 'string' && generationResult.startsWith('http') ? generationResult : undefined),
          mediaType: type === 'video' ? 'video' : (type === 'image' || type === 'infographic') ? 'image' : type === 'voice' ? 'audio' : undefined,
          documentData: documentData || undefined,
          interactionId: interactionId || undefined
        };
        await createDocRest("messages", msgDoc, token).catch(e => console.error("Failed to write assistant message to db:", e));
      }

      const responsePayload: any = {
        result: generationResult,
        mimeType,
        extension,
        interactionId,
        permanentMediaUrl,
        documentData,
        newBalance: finalBalance
      };
      if (typeof generatedSlides !== 'undefined' && generatedSlides) responsePayload.slides = generatedSlides;
      if (typeof groundingReport !== 'undefined' && groundingReport) responsePayload.groundingReport = groundingReport;

      if (!res.headersSent) {
        res.json(responsePayload);
      }

      } // end runGenerationPipeline
    } catch (error: any) {
      console.error("API Generation Error:", error?.message || error);
      const errMsg = error?.message || (error ? String(error) : '') || 'حدث خطأ غير متوقع';
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
          res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
          res.write(`data: [DONE]\n\n`);
          res.end();
        } catch (e) {
          // ignore closed socket
        }
      }
    } finally {
      activeUserTasks.delete(uid);
    }
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع' });
    }
  }
});

async function sendFcmPushToUsers(uids: string[], title: string, body: string, link: string = '/') {
  try {
    const tokensMap: { [token: string]: string } = {};
    for (const targetUid of uids) {
      try {
        const userSnap = await dbAdmin.collection("users").doc(targetUid).get();
        if (userSnap.exists) {
          const userTokens: string[] = userSnap.data()?.fcmTokens || [];
          for (const t of userTokens) {
            if (t && typeof t === 'string') {
              tokensMap[t] = targetUid;
            }
          }
        }
      } catch (e) {
        // ignore individual user fetch error
      }
    }

    const allTokens = Object.keys(tokensMap);
    if (allTokens.length === 0) {
      return { sentCount: 0, failureCount: 0 };
    }

    const messaging = getMessagingAdmin();
    const response = await messaging.sendEachForMulticast({
      tokens: allTokens,
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/logo-192.png',
          badge: '/favicon.svg',
          vibrate: [150, 80, 150]
        },
        fcmOptions: {
          link: link || '/'
        }
      },
      data: {
        title,
        body,
        url: link || '/'
      }
    });

    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const code = resp.error.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(allTokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        for (const targetUid of uids) {
          try {
            await dbAdmin.collection("users").doc(targetUid).update({
              fcmTokens: FieldValue.arrayRemove(...invalidTokens)
            }).catch(() => {});
          } catch (e) {}
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
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }
    const uid = decodedToken.uid;

    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser) {
      try {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      } catch (e) {}
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك بتعديل أرصدة المستخدمين." });
    }

    const { targetUid, amount, action = 'add', reason, notes } = req.body;
    if (!targetUid) {
      return res.status(400).json({ error: "يجب تحديد معرف المستخدم المستهدف (targetUid)." });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ error: "يجب إدخال قيمة عددية موجبة وصحيحة للنقاط." });
    }

    // Fetch target user
    let targetUser: any = await getDocRest("users", targetUid, token).catch(() => null);
    if (!targetUser) {
      try {
        const snap = await dbAdmin.collection("users").doc(targetUid).get();
        if (snap.exists) {
          targetUser = snap.data();
        }
      } catch (e) {}
    }

    if (!targetUser) {
      return res.status(404).json({ error: "المستخدم المستهدف غير موجود." });
    }

    const currentBalance = typeof targetUser.balance === 'number' ? targetUser.balance : 0;
    let delta = 0;

    if (action === 'add') {
      delta = numAmount;
    } else if (action === 'deduct') {
      delta = -numAmount;
    } else if (action === 'set') {
      delta = numAmount - currentBalance;
    } else {
      return res.status(400).json({ error: "نوع العملية غير صالح. يجب أن يكون add أو deduct أو set." });
    }

    delta = parseFloat(delta.toFixed(4));

    // Execute atomic balance mutation
    const mutResult = await mutateBalanceAtomic(targetUid, delta, {});
    const newBalance = mutResult.ok ? mutResult.newBalance : parseFloat((currentBalance + delta).toFixed(4));

    const adjustmentReason = reason || (action === 'add' ? 'شحن نقاط يدوي' : action === 'deduct' ? 'خصم نقاط يدوي' : 'إعادة ضبط الرصيد');

    const adjustmentRecord = {
      adminUid: uid,
      adminEmail: decodedToken.email || userDoc?.email || 'admin',
      targetUid,
      targetEmail: targetUser.email || targetUid,
      previousBalance: currentBalance,
      newBalance,
      delta,
      action,
      amount: numAmount,
      reason: adjustmentReason,
      notes: notes || '',
      createdAt: Date.now()
    };

    // Audit logs in dedicated admin_balance_adjustments and general admin_audit_logs
    try {
      if (dbAdmin) {
        await dbAdmin.collection("admin_balance_adjustments").add(adjustmentRecord).catch(() => {});
      }
    } catch (e) {}

    await createDocRest("admin_audit_logs", {
      ...adjustmentRecord,
      action: 'adjust_user_balance',
    }, token).catch(e => console.error("Failed to write audit log:", e));

    // Balance transaction for user billing history
    await createDocRest("balance_transactions", {
      uid: targetUid,
      type: delta < 0 ? 'admin_debit' : 'admin_credit',
      amount: delta,
      balanceAfter: newBalance,
      description: `تعديل رصيد إداري: ${adjustmentReason}`,
      adminUid: uid,
      createdAt: Date.now()
    }, token).catch(e => console.error("Failed to write balance transaction:", e));

    // Send user notification on credit
    if (delta > 0) {
      try {
        if (dbAdmin) {
          await dbAdmin.collection("users").doc(targetUid).collection("notifications").add({
            title: 'شحن رصيد من الإدارة',
            message: `تم إضافة ${delta} نقطة إلى رصيدك. السبب: ${adjustmentReason}`,
            type: 'credit',
            read: false,
            createdAt: Date.now()
          }).catch(() => {});
        }
      } catch (e) {}
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
  } catch (err: any) {
    console.error("Error in /api/admin/adjust-balance:", err);
    return res.status(500).json({ error: err.message || "حدث خطأ أثناء تعديل رصيد المستخدم" });
  }
});

app.get("/api/admin/balance-adjustments", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userDoc = await getDocRest("users", decodedToken.uid, token).catch(() => null);
    if (!userDoc?.isAdmin) {
      return res.status(403).json({ error: "غير مصرح للمستخدمين العاديين." });
    }

    let records: any[] = [];
    if (dbAdmin) {
      const snap = await dbAdmin.collection("admin_balance_adjustments")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return res.json({ success: true, adjustments: records });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/send-notification", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }
    const uid = decodedToken.uid;

    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser) {
      try {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      } catch (e) {
        // ignore
      }
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك بالوصول لهذا الإجراء." });
    }

    const { title, message, type, target, targetUid } = req.body;
    if (!title || !message || !type || !target) {
      return res.status(400).json({ error: "جميع الحقول (العنوان، الرسالة، النوع، المستهدف) مطلوبة." });
    }

    if (target === 'specific') {
      if (!targetUid) {
        return res.status(400).json({ error: "يجب تحديد معرف المستخدم (UID) للمستهدف المحدد." });
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
          // ignore
        }
      }
      if (!targetExists) {
        return res.status(404).json({ error: "المستهدف المحدد غير موجود في قاعدة البيانات." });
      }

      await createDocRest("notifications", {
        ownerId: targetUid,
        title,
        message,
        type,
        read: false,
        createdAt: Date.now()
      }, token);

      const fcmResult = await sendFcmPushToUsers([targetUid], title, message, '/');

      try {
        await createDocRest("admin_audit_log", {
          action: 'send_notification',
          adminId: uid,
          adminEmail: decodedToken.email || '',
          targetUserId: targetUid,
          details: { title, type, target },
          timestamp: Date.now()
        }, token);
      } catch (e) {}

      return res.json({
        success: true,
        count: 1,
        fcmPushCount: fcmResult.sentCount,
        message: `تم إرسال الإشعار بنجاح لمستخدم واحد (تم إرسال ${fcmResult.sentCount} إشعارات دفع للجوال).`
      });
    } else if (target === 'all') {
      let userIds: string[] = [];
      if (token) {
        try {
          const restUsers = await listCollectionRest("users", token);
          if (restUsers && restUsers.length > 0) {
            userIds = restUsers
              .filter(u => u.isAdmin !== true)
              .map(u => u.id);
          }
        } catch (e) {
          // ignore
        }
      }
      if (userIds.length === 0) {
        try {
          const usersSnap = await dbAdmin.collection("users").get();
          userIds = usersSnap.docs
            .filter(d => d.data()?.isAdmin !== true)
            .map(d => d.id);
        } catch (e) {
          // ignore
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
        }, token).catch(e => console.error("Failed to write admin notification for user:", userId, e));
        totalCreated++;
      }

      const fcmResult = await sendFcmPushToUsers(userIds, title, message, '/');

      try {
        await createDocRest("admin_audit_log", {
          action: 'send_notification',
          adminId: uid,
          adminEmail: decodedToken.email || '',
          targetUserId: 'all',
          details: { title, type, target, count: totalCreated },
          timestamp: Date.now()
        }, token);
      } catch (e) {}

      return res.json({
        success: true,
        count: totalCreated,
        fcmPushCount: fcmResult.sentCount,
        message: `تم إرسال الإشعار بنجاح إلى ${totalCreated} مستخدم (تم تسليم ${fcmResult.sentCount} إشعارات دفع للجوال).`
      });
    } else {
      return res.status(400).json({ error: "قيمة المستهدف غير صالحة." });
    }
  } catch (error: any) {
    console.error("Admin Send Notification Error:", error);
    res.status(500).json({ error: "حدث خطأ داخلي أثناء إرسال الإشعار: " + error.message });
  }
});

app.post("/api/admin/log-audit", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }
    const uid = decodedToken.uid;

    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser) {
      try {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      } catch (e) {
        // ignore
      }
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك للقيام بذا الإجراء الإداري." });
    }

    const { action, targetUserId, chatId, details } = req.body;
    if (!action) {
      return res.status(400).json({ error: "حقل الإجراء (action) مطلوب." });
    }

    const auditData = {
      action,
      adminId: uid,
      adminEmail: decodedToken.email || userDoc?.email || '',
      ...(targetUserId ? { targetUserId } : {}),
      ...(chatId ? { chatId } : {}),
      ...(details ? { details } : {}),
      timestamp: Date.now()
    };

    let logId = 'log_' + Date.now();
    try {
      const docRef = await createDocRest("admin_audit_log", auditData, token);
      if (docRef?.id) logId = docRef.id;
    } catch (auditWriteErr) {
      console.warn("Audit log write warning:", auditWriteErr);
    }

    return res.json({ success: true, id: logId });
  } catch (error: any) {
    console.error("Admin Audit Log Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ===== UNIFIED MODEL & PRICING CONTROL CENTER ENDPOINTS =====

app.get(["/api/admin/model-endpoints", "/api/admin/models"], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }
    const uid = decodedToken.uid;
    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser) {
      try {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      } catch (e) {
        // ignore
      }
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك بالوصول لإعدادات النماذج." });
    }

    try {
      await seedModelEndpointsIfMissing();
    } catch (e) {
      // quiet
    }

    let rawEndpoints: any[] = [];
    try {
      const snapshot = await dbAdmin.collection('model_endpoints').get();
      if (!snapshot.empty) {
        rawEndpoints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (err: any) {
      console.warn("[Admin Models] dbAdmin.collection('model_endpoints') fallback:", err.message);
    }

    // Merge with SEED_ENDPOINTS so EVERY model endpoint (user-facing and background) is present
    const endpointMap = new Map<string, any>();
    for (const seed of SEED_ENDPOINTS) {
      endpointMap.set(seed.id, { ...seed });
    }
    for (const ep of rawEndpoints) {
      const existing = endpointMap.get(ep.id) || {};
      endpointMap.set(ep.id, { ...existing, ...ep });
    }

    // Aggregate 30-day token cost from api_cost_log grouped by model
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const costByModel: Record<string, number> = {};
    try {
      let logs: any[] = [];
      try {
        const logSnap = await dbAdmin.collection('api_cost_log').where('createdAt', '>=', thirtyDaysAgo).get();
        logs = logSnap.docs.map(d => d.data());
      } catch (e) {
        // fallback
      }
      for (const log of logs) {
        const m = log.model || log.type || 'unknown';
        const c = Number(log.costInPoints) || 0;
        costByModel[m] = (costByModel[m] || 0) + c;
      }
    } catch (e) {
      console.warn("[Admin Models] Failed to aggregate 30d costs:", e);
    }

    const endpoints = Array.from(endpointMap.values()).map(ep => {
      const modelCost = costByModel[ep.modelId] || costByModel[ep.id] || 0;
      return {
        ...ep,
        total30dCostInPoints: parseFloat(modelCost.toFixed(3))
      };
    });

    return res.json({ endpoints });
  } catch (error: any) {
    console.error("Get Model Endpoints Error:", error);
    return res.json({ endpoints: SEED_ENDPOINTS });
  }
});

app.post("/api/admin/validate-model", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }
    const uid = decodedToken.uid;
    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser) {
      try {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      } catch (e) {
        // ignore
      }
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك." });
    }

    const { modelId, featureGroup } = req.body;
    if (!modelId || !featureGroup) {
      return res.status(400).json({ error: "اسم النموذج (modelId) ومجموعة الميزة (featureGroup) مطلوبان." });
    }

    const result = await validateModelIdServer(String(modelId).trim(), String(featureGroup));
    return res.json(result);
  } catch (error: any) {
    console.error("Validate Model Error:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/admin/update-model-endpoint", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }
    const uid = decodedToken.uid;
    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser) {
      try {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      } catch (e) {
        // ignore
      }
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك بتحديث إعدادات النماذج." });
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
      return res.status(400).json({ error: "معرّف المنفذ والنموذج مطلوبان." });
    }

    let existingData: any = SEED_ENDPOINTS.find(s => s.id === endpointId) || {};
    try {
      const endpointRef = dbAdmin.collection('model_endpoints').doc(endpointId);
      const existingSnap = await endpointRef.get();
      if (existingSnap.exists) {
        existingData = existingSnap.data()!;
      }
    } catch (e) {
      // quiet fallback
    }

    const featureGroup = existingData.featureGroup || 'text';
    const cleanModelId = String(modelId).trim();
    const cleanFallbackModelId = fallbackModelId ? String(fallbackModelId).trim() : undefined;

    // PART 3: Validate BEFORE Save unless explicitly skipped
    let validationOk = true;
    if (!skipValidation) {
      const valResult = await validateModelIdServer(cleanModelId, featureGroup);
      if (!valResult.ok) {
        return res.status(400).json({ 
          error: `فشل التحقق من صحة النموذج (${cleanModelId}): ${valResult.error || 'النموذج غير متجاوب'}` 
        });
      }
    }

    const updatePayload: any = {
      modelId: cleanModelId,
      lastValidatedAt: Date.now(),
      lastValidatedOk: validationOk
    };

    if (typeof isEnabled === 'boolean') {
      updatePayload.isEnabled = isEnabled;
    }

    if (cleanFallbackModelId !== undefined) {
      updatePayload.fallbackModelId = cleanFallbackModelId;
    }

    if (typeof pointsPrice === 'number' && !isNaN(pointsPrice)) {
      updatePayload.pointsPrice = Math.max(0, pointsPrice);
    }
    if (typeof inputPointsPerBlock === 'number' && !isNaN(inputPointsPerBlock)) {
      updatePayload.inputPointsPerBlock = Math.max(0, inputPointsPerBlock);
      updatePayload.inputPointsPer1k = updatePayload.inputPointsPerBlock;
    } else if (typeof inputPointsPer1k === 'number' && !isNaN(inputPointsPer1k)) {
      updatePayload.inputPointsPer1k = Math.max(0, inputPointsPer1k);
      updatePayload.inputPointsPerBlock = updatePayload.inputPointsPer1k;
    }
    if (typeof inputTokenBlockSize === 'number' && !isNaN(inputTokenBlockSize) && inputTokenBlockSize > 0) {
      updatePayload.inputTokenBlockSize = inputTokenBlockSize;
    }
    if (typeof outputPointsPerBlock === 'number' && !isNaN(outputPointsPerBlock)) {
      updatePayload.outputPointsPerBlock = Math.max(0, outputPointsPerBlock);
      updatePayload.outputPointsPer1k = updatePayload.outputPointsPerBlock;
    } else if (typeof outputPointsPer1k === 'number' && !isNaN(outputPointsPer1k)) {
      updatePayload.outputPointsPer1k = Math.max(0, outputPointsPer1k);
      updatePayload.outputPointsPerBlock = updatePayload.outputPointsPer1k;
    }
    if (typeof outputTokenBlockSize === 'number' && !isNaN(outputTokenBlockSize) && outputTokenBlockSize > 0) {
      updatePayload.outputTokenBlockSize = outputTokenBlockSize;
    }
    if (typeof audioInputPointsPer1k === 'number' && !isNaN(audioInputPointsPer1k)) {
      updatePayload.audioInputPointsPer1k = Math.max(0, audioInputPointsPer1k);
    }
    if (pricingType === 'per_token' || pricingType === 'per_generation') {
      updatePayload.pricingType = pricingType;
    }
    if (typeof isBackground === 'boolean') {
      updatePayload.isBackground = isBackground;
    }
    if (typeof maxOutputTokens === 'number' && !isNaN(maxOutputTokens)) {
      updatePayload.maxOutputTokens = maxOutputTokens;
    }
    if (typeof realCostUsd === 'number' && !isNaN(realCostUsd)) {
      updatePayload['realCostPer.usd'] = Math.max(0, realCostUsd);
    }
    if (typeof paramNotes === 'string') {
      updatePayload.paramNotes = paramNotes.trim();
    }
    if (typeof labelAr === 'string' && labelAr.trim()) {
      updatePayload.labelAr = labelAr.trim();
    }

    try {
      const endpointRef = dbAdmin.collection('model_endpoints').doc(endpointId);
      await endpointRef.set(updatePayload, { merge: true });
    } catch (e: any) {
      console.warn("[Admin Update Model Endpoint] dbAdmin set failed, using REST fallback:", e.message);
      await setDocRest('model_endpoints', endpointId, updatePayload, token).catch(console.error);
    }

    // Update in-memory cache
    modelEndpointCache.set(endpointId, { 
      modelId: cleanModelId, 
      fallbackModelId: cleanFallbackModelId,
      maxOutputTokens: updatePayload.maxOutputTokens,
      isEnabled: updatePayload.isEnabled !== undefined ? updatePayload.isEnabled : (existingData.isEnabled !== false),
      inputPointsPer1k: updatePayload.inputPointsPer1k,
      outputPointsPer1k: updatePayload.outputPointsPer1k,
      audioInputPointsPer1k: updatePayload.audioInputPointsPer1k,
      inputPointsPerBlock: updatePayload.inputPointsPerBlock,
      inputTokenBlockSize: updatePayload.inputTokenBlockSize,
      outputPointsPerBlock: updatePayload.outputPointsPerBlock,
      outputTokenBlockSize: updatePayload.outputTokenBlockSize,
      fetchedAt: Date.now() 
    });

    // Invalidate global pricing cache so live changes take effect immediately everywhere
    pricingCache = null;

    // Sync corresponding model_pricing document if relevant
    try {
      if (dbAdmin) {
        if ((endpointId === 'doc_standard' || endpointId === 'document_writer') && typeof pointsPrice === 'number' && pointsPrice > 0) {
          await dbAdmin.collection('model_pricing').doc('document').set({ a4PerPage: pointsPrice }, { merge: true }).catch(() => {});
        } else if (endpointId === 'doc_a5' && typeof pointsPrice === 'number' && pointsPrice > 0) {
          await dbAdmin.collection('model_pricing').doc('document').set({ a5PerPage: pointsPrice }, { merge: true }).catch(() => {});
        } else if ((endpointId === 'doc_slides' || endpointId === 'slide_writer') && typeof pointsPrice === 'number' && pointsPrice > 0) {
          await dbAdmin.collection('model_pricing').doc('document').set({ pdf_per_slide: pointsPrice }, { merge: true }).catch(() => {});
        } else if ((endpointId === 'image_lite' || endpointId === 'image_fast') && typeof pointsPrice === 'number' && pointsPrice > 0) {
          await dbAdmin.collection('model_pricing').doc('image').set({ liteBase: pointsPrice }, { merge: true }).catch(() => {});
        } else if ((endpointId === 'image_standard' || endpointId === 'image_spectra') && typeof pointsPrice === 'number' && pointsPrice > 0) {
          await dbAdmin.collection('model_pricing').doc('image').set({ base: pointsPrice }, { merge: true }).catch(() => {});
        } else if ((endpointId === 'image_pro' || endpointId === 'image_hd') && typeof pointsPrice === 'number' && pointsPrice > 0) {
          await dbAdmin.collection('model_pricing').doc('image').set({ proBase: pointsPrice }, { merge: true }).catch(() => {});
        } else if (endpointId === 'image_addon' && typeof pointsPrice === 'number' && pointsPrice > 0) {
          await dbAdmin.collection('model_pricing').doc('image').set({ imageAddon: pointsPrice }, { merge: true }).catch(() => {});
          await dbAdmin.collection('model_pricing').doc('video').set({ imageAddon: pointsPrice }, { merge: true }).catch(() => {});
        } else if (endpointId === 'voice_tts' && typeof pointsPrice === 'number' && pointsPrice > 0) {
          await dbAdmin.collection('model_pricing').doc('voice').set({
            pointsPerCharacter: pointsPrice,
            ...(pricingType === 'per_character' ? { billingUnit: 'character' } : {})
          }, { merge: true }).catch(() => {});
        } else if (endpointId === 'voice_tts_pro' && typeof pointsPrice === 'number' && pointsPrice > 0) {
          await dbAdmin.collection('model_pricing').doc('voice').set({
            pointsPerCharacterPro: pointsPrice
          }, { merge: true }).catch(() => {});
        }
      }
    } catch (e) {
      // quiet fallback
    }

    // Write to audit log
    await createDocRest("admin_audit_log", {
      action: "UPDATE_MODEL_ENDPOINT",
      adminId: uid,
      adminEmail: decodedToken.email || userDoc?.email || '',
      details: { endpointId, oldModelId: existingData.modelId, newModelId: cleanModelId, pointsPrice, inputPointsPer1k, outputPointsPer1k, realCostUsd },
      timestamp: Date.now()
    }, token).catch(() => null);

    return res.json({ success: true, message: "تم تحديث المنفذ بنجاح والتحقق من صحته." });
  } catch (error: any) {
    console.error("Update Model Endpoint Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Alias PUT endpoint for model endpoint updates
app.put("/api/admin/model-endpoints/:endpointId", async (req, res) => {
  req.body = { ...req.body, endpointId: req.params.endpointId };
  // Forward to standard handler logic
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }
    const uid = decodedToken.uid;
    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser) {
      try {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      } catch (e) {}
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك بتحديث إعدادات النماذج." });
    }

    const endpointId = req.params.endpointId;
    const { modelId, fallbackModelId, isEnabled, skipValidation } = req.body;
    if (!endpointId || !modelId) {
      return res.status(400).json({ error: "معرّف المنفذ والنموذج مطلوبان." });
    }

    let existingData: any = SEED_ENDPOINTS.find(s => s.id === endpointId) || {};
    try {
      const endpointRef = dbAdmin.collection('model_endpoints').doc(endpointId);
      const existingSnap = await endpointRef.get();
      if (existingSnap.exists) existingData = existingSnap.data()!;
    } catch (e) {}

    const featureGroup = existingData.featureGroup || 'text';
    const cleanModelId = String(modelId).trim();
    const cleanFallbackModelId = fallbackModelId ? String(fallbackModelId).trim() : undefined;

    let validationOk = true;
    if (!skipValidation) {
      const valResult = await validateModelIdServer(cleanModelId, featureGroup);
      if (!valResult.ok) {
        return res.status(400).json({ 
          error: `فشل التحقق من صحة النموذج (${cleanModelId}): ${valResult.error || 'النموذج غير متجاوب'}` 
        });
      }
    }

    const updatePayload: any = {
      modelId: cleanModelId,
      lastValidatedAt: Date.now(),
      lastValidatedOk: validationOk
    };
    if (typeof isEnabled === 'boolean') {
      updatePayload.isEnabled = isEnabled;
    }
    if (cleanFallbackModelId !== undefined) {
      updatePayload.fallbackModelId = cleanFallbackModelId;
    }

    const endpointRef = dbAdmin.collection('model_endpoints').doc(endpointId);
    await endpointRef.set(updatePayload, { merge: true });

    modelEndpointCache.set(endpointId, { 
      modelId: cleanModelId, 
      fallbackModelId: cleanFallbackModelId,
      isEnabled: updatePayload.isEnabled !== undefined ? updatePayload.isEnabled : (existingData.isEnabled !== false),
      fetchedAt: Date.now() 
    });

    return res.json({ success: true, message: "تم تحديث المنفذ بنجاح." });
  } catch (err: any) {
    console.error("PUT model-endpoints error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Get Naje Ad Configuration
app.get("/api/admin/naje-ad-config", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser && dbAdmin) {
      const userSnap = await dbAdmin.collection("users").doc(uid).get();
      isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك بالوصول لإعدادات الإدارة." });
    }

    const pricing = await getPricing(token);
    return res.json({
      config: pricing.najeAd || {
        enabled: true,
        pointsRatePerSecond: 2.5,
        durationOptionsSec: [4, 6, 8, 10, 12, 14, 16, 24, 30],
        maxShotsPerVideo: 2,
        defaultModelEndpointId: 'video_standard'
      }
    });
  } catch (err: any) {
    console.error("GET /api/admin/naje-ad-config error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Update Naje Ad Configuration
app.put("/api/admin/naje-ad-config", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser && dbAdmin) {
      const userSnap = await dbAdmin.collection("users").doc(uid).get();
      isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك بتحديث إعدادات Naje Ad." });
    }

    const { enabled, pointsRatePerSecond, durationOptionsSec, maxShotsPerVideo, defaultModelEndpointId } = req.body || {};

    const updatePayload: any = {
      updatedAt: Date.now(),
      updatedBy: decodedToken.email || userDoc?.email || uid
    };

    if (typeof enabled === 'boolean') updatePayload.enabled = enabled;
    if (typeof pointsRatePerSecond === 'number' && pointsRatePerSecond > 0) updatePayload.pointsRatePerSecond = pointsRatePerSecond;
    
    if (typeof defaultModelEndpointId === 'string' && defaultModelEndpointId.trim()) {
      updatePayload.defaultModelEndpointId = defaultModelEndpointId.trim();
    }

    const targetEndpoint = updatePayload.defaultModelEndpointId || 'video_standard';
    const videoModelEndpoint = await getModelEndpointConfig(targetEndpoint, 'veo-3.1-lite-generate-preview');
    const availableDurations = videoModelEndpoint.supportedDurations && videoModelEndpoint.supportedDurations.length > 0 
      ? videoModelEndpoint.supportedDurations 
      : [4, 6, 8];
    const effectiveMaxShots = updatePayload.maxShotsPerVideo || (typeof maxShotsPerVideo === 'number' ? maxShotsPerVideo : 4);
    const maxPossibleDuration = Math.max(...availableDurations) * effectiveMaxShots;

    if (Array.isArray(durationOptionsSec) && durationOptionsSec.length > 0) {
      const parsed = durationOptionsSec.map(Number).sort((a: number, b: number) => a - b);
      const invalid = parsed.find(d => d > maxPossibleDuration);
      if (invalid) {
        return res.status(400).json({ error: `المدة ${invalid} ثانية تتجاوز الحد الأقصى المسموح به (${maxPossibleDuration} ثانية) للنموذج المختار بناءً على دعم ${effectiveMaxShots} لقطات.` });
      }
      updatePayload.durationOptionsSec = parsed;
    }

    if (typeof maxShotsPerVideo === 'number' && maxShotsPerVideo > 0) updatePayload.maxShotsPerVideo = maxShotsPerVideo;

    if (dbAdmin) {
      await dbAdmin.collection('model_pricing').doc('naje_ad').set(updatePayload, { merge: true });
    } else {
      await setDocRest('model_pricing', 'naje_ad', updatePayload, token);
    }

    // Invalidate pricing cache
    pricingCache = null;

    // Log admin audit action
    await createDocRest("admin_audit_log", {
      action: "UPDATE_NAJE_AD_CONFIG",
      adminId: uid,
      adminEmail: decodedToken.email || userDoc?.email || '',
      details: updatePayload,
      timestamp: Date.now()
    }, token).catch(() => null);

    return res.json({ success: true, message: "تم تحديث إعدادات Naje Ad بنجاح.", config: updatePayload });
  } catch (err: any) {
    console.error("PUT /api/admin/naje-ad-config error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Get recent Naje Ad jobs for admin monitoring
app.get("/api/admin/naje-ad-jobs", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser && dbAdmin) {
      const userSnap = await dbAdmin.collection("users").doc(uid).get();
      isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح." });
    }

    let jobs: any[] = [];
    if (dbAdmin) {
      try {
        const snap = await dbAdmin.collection("generation_jobs")
          .where("type", "==", "naje_ad_video")
          .orderBy("createdAt", "desc")
          .limit(50)
          .get();
        jobs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      } catch (_idxErr) {
        const fallbackSnap = await dbAdmin.collection("generation_jobs").orderBy("createdAt", "desc").limit(100).get();
        jobs = fallbackSnap.docs
          .map((d: any) => ({ id: d.id, ...d.data() }))
          .filter((j: any) => j.type === 'naje_ad_video');
      }
    }

    return res.json({ jobs });
  } catch (err: any) {
    console.error("GET /api/admin/naje-ad-jobs error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Public Live Pricing Endpoint (Single Source of Truth for frontend pricing calculations)
app.get("/api/pricing/current", async (req, res) => {
  try {
    const pricing = await getFullCurrentPricingConfig();
    return res.json(pricing);
  } catch (err: any) {
    console.error("Error fetching current pricing:", err);
    return res.status(500).json({ error: err.message });
  }
});

const voiceSampleCache = new Map<string, Buffer>();

app.get("/api/voice-sample", async (req, res) => {
  try {
    const rawVoice = (req.query.voice as string) || 'Kore';
    const voice = rawVoice.charAt(0).toUpperCase() + rawVoice.slice(1).toLowerCase();
    const lower = voice.toLowerCase();

    // 1. Check memory cache
    if (voiceSampleCache.has(lower)) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(voiceSampleCache.get(lower));
    }

    // 2. Check local disk cache
    const localPath = path.join(process.cwd(), 'public', 'voice-samples', `${lower}.wav`);
    if (fs.existsSync(localPath)) {
      try {
        const buf = fs.readFileSync(localPath);
        if (buf.length > 500) {
          voiceSampleCache.set(lower, buf);
          res.setHeader('Content-Type', 'audio/wav');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(buf);
        }
      } catch (e) {}
    }

    // 3. Generate voice sample on the fly via Gemini TTS
    const apiKey = process.env.GEMINI_API_KEY;
    if (!USE_VERTEX_AI && !apiKey) {
      return res.status(500).json({ error: "Internal system configuration missing" });
    }

    const ai = createGenAIClient();
    const sampleText = `مرحباً، أنا صوت ${voice} في منصة ناجي — جاهز لتحويل كتاباتك لتسجيل صوّتي عالي الجودة.`;

    const ttsModelSample = resolveEngineModel(await getModelEndpointId('voice_tts_standard', getNajeModel('voice_core')));
    let response: any = null;
    try {
      response = await ai.models.generateContent({
        model: ttsModelSample,
        contents: sampleText,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice }
            }
          },
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.audioSpeech
        } as any
      });
    } catch (ttsErr: any) {
      console.warn(`[Voice Sample API] Primary TTS call failed for ${voice}, retrying with standard preview:`, ttsErr?.message || ttsErr);
      response = await ai.models.generateContent({
        model: ttsModelSample,
        contents: `مرحباً بك، أنا صوت ${voice}.`,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice }
            }
          },
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.audioSpeech
        } as any
      });
    }

    const candidate = response?.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData && (p.inlineData.mimeType?.startsWith('audio/') || p.inlineData.data));

    if (audioPart?.inlineData?.data) {
      const rawPcm = Buffer.from(audioPart.inlineData.data, 'base64');
      const sampleRate = parseSampleRateFromMimeType(audioPart.inlineData.mimeType, 24000);
      const wavBuffer = pcmToWav(rawPcm, sampleRate);

      if (wavBuffer.length > 500) {
        voiceSampleCache.set(lower, wavBuffer);

        try {
          const dir = path.join(process.cwd(), 'public', 'voice-samples');
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(localPath, wavBuffer);
        } catch (e) {}

        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(wavBuffer);
      }
    }

    return res.status(500).json({ error: "Could not generate sample audio" });
  } catch (err: any) {
    console.warn(`[Voice Sample API] Error generating sample for ${req.query.voice}:`, err?.message || err);
    return res.status(500).json({ error: err?.message || "Failed to generate sample" });
  }
});


app.post("/api/admin/generate-voice-samples", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }
    const uid = decodedToken.uid;

    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser) {
      try {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      } catch (e) {
        // ignore
      }
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك بالوصول لهذا الإجراء." });
    }

    const force = req.body?.force === true;

    const VOICES = [
      'Kore', 'Puck', 'Charon', 'Zephyr', 'Aoede', 'Fenrir', 'Leda', 'Orus',
      'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba',
      'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar',
      'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi',
      'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat'
    ];

    const bucket = getStorage().bucket(STORAGE_BUCKET);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!USE_VERTEX_AI && !apiKey) {
      return res.status(500).json({ error: "نواجه مشكلة مؤقتة في خوادم النظام الداخلي، يرجى المحاولة لاحقاً." });
    }

    const ai = createGenAIClient();
    const results: Array<{ voice: string; status: string; size: number; path: string }> = [];

    const outputDir = path.join(process.cwd(), 'public', 'voice-samples');
    if (!fs.existsSync(outputDir)) {
      try { fs.mkdirSync(outputDir, { recursive: true }); } catch (e) {}
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
            if (size > 1000) {
              results.push({ voice, status: 'skipped_exists', size, path: publicUrl });
              continue;
            }
          }
        } catch (err) {
          console.warn(`[Voice Sample Gen] Storage check error for ${voice}:`, err);
        }
      }

      let success = false;
      const ttsModelSample = resolveEngineModel(await getModelEndpointId('voice_tts_standard', getNajeModel('voice_core')));
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const sampleText = `مرحباً، أنا صوت ${voice} في ناجي — جاهز أحوّل نصك لتسجيل احترافي.`;
          const response = await ai.models.generateContent({
            model: ttsModelSample,
            contents: sampleText,
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice }
                }
              },
              maxOutputTokens: OUTPUT_TOKEN_LIMITS.audioSpeech
            } as any
          });

          const candidate = response?.candidates?.[0];
          const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData && (p.inlineData.mimeType?.startsWith('audio/') || p.inlineData.data));

          if (audioPart?.inlineData?.data) {
            const rawPcm = Buffer.from(audioPart.inlineData.data, 'base64');
            const sampleRate = parseSampleRateFromMimeType(audioPart.inlineData.mimeType, 24000);
            const wavBuffer = pcmToWav(rawPcm, sampleRate);

            if (wavBuffer.length > 1000) {
              await file.save(wavBuffer, { metadata: { contentType: 'audio/wav' } });
              await file.makePublic().catch((err) => {
                console.warn(`[Voice Sample Gen] makePublic failed for ${voice}:`, err?.message || err);
              });

              try {
                fs.writeFileSync(path.join(outputDir, `${lower}.wav`), wavBuffer);
              } catch (e) {}

              results.push({ voice, status: 'generated', size: wavBuffer.length, path: publicUrl });
              success = true;
              break;
            }
          }
        } catch (err: any) {
          if (!isRetryableError(err)) {
            console.error(`[Voice Sample Gen] ${voice}: permanent failure (${err?.code || 'auth'}), not retrying. ${(err?.message || '').slice(0, 200)}`);
            break;
          }
          if (attempt === 3) {
            console.error(`[Voice Sample Gen] ${voice}: failed after 3 attempts. ${(err?.message || '').slice(0, 200)}`);
          } else {
            console.warn(`[Voice Sample Gen] ${voice} attempt ${attempt} failed:`, err?.message || err);
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

      if (!success) {
        results.push({ voice, status: 'failed', size: 0, path: publicUrl });
      }
    }

    const generatedCount = results.filter(r => r.status === 'generated').length;
    const skippedCount = results.filter(r => r.status === 'skipped_exists').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    res.json({
      success: true,
      message: `تمت معالجة عينات الأصوات ونشرها على Firebase Storage. تم توليد ${generatedCount} جديدة، وتخطي ${skippedCount} موجودة، بينما فشل ${failedCount}.`,
      summary: { generatedCount, skippedCount, failedCount, total: VOICES.length },
      results
    });
  } catch (err: any) {
    console.error("[Voice Sample Gen Endpoint Error]", err);
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

app.get("/api/voice-samples-manifest", async (req, res) => {
  try {
    const bucket = getStorage().bucket(STORAGE_BUCKET);
    const [files] = await bucket.getFiles({ prefix: "voice-samples/" });
    const manifest: Record<string, string> = {};
    for (const file of files) {
      const filename = path.basename(file.name);
      if (filename.endsWith('.wav')) {
        const voiceId = filename.replace('.wav', '').toLowerCase();
        manifest[voiceId] = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      }
    }
    return res.json({ manifest });
  } catch (err: any) {
    console.error("Error fetching voice samples manifest:", err);
    return res.json({ manifest: {} });
  }
});

// ==========================================
// STAGE 8: FEEDBACK SIGNALS AGGREGATION & SUMMARY
// ==========================================

app.get("/api/admin/feedback-summary", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }
    const uid = decodedToken.uid;
    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser) {
      try {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      } catch (e) {}
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك بالوصول لملخص التغذية الراجعة." });
    }

    const timeWindow = (req.query.timeWindow as string) || 'all';
    let timeCutoff = 0;
    const now = Date.now();
    if (timeWindow === '7d') timeCutoff = now - (7 * 24 * 60 * 60 * 1000);
    else if (timeWindow === '30d') timeCutoff = now - (30 * 24 * 60 * 60 * 1000);
    else if (timeWindow === '90d') timeCutoff = now - (90 * 24 * 60 * 60 * 1000);

    let q: any = dbAdmin.collection("feedback_signals").orderBy("createdAt", "desc");
    if (timeCutoff > 0) {
      q = q.where("createdAt", ">=", timeCutoff);
    }
    const snap = await q.limit(1000).get();
    
    // Group by decision_matrix_key
    const groups: Record<string, {
      decisionKey: string;
      chatType: string;
      total: number;
      up: number;
      down: number;
      editedAfter: number;
      reasons: Record<string, number>;
      recentSampleDate: number;
    }> = {};

    let totalAllSignals = 0;
    let totalAllUp = 0;

    snap.forEach((docSnap: any) => {
      const data = docSnap.data();
      totalAllSignals++;
      if (data.signal === 'up') totalAllUp++;

      const key = data.decision_matrix_key || data.templateId || data.chatType || 'general';
      if (!groups[key]) {
        groups[key] = {
          decisionKey: key,
          chatType: data.chatType || 'general',
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
      if (data.signal === 'up') g.up++;
      if (data.signal === 'down') g.down++;
      if (data.editedAfter === true || data.isEdit === true) g.editedAfter++;
      if (Array.isArray(data.reasons)) {
        data.reasons.forEach((r: string) => {
          g.reasons[r] = (g.reasons[r] || 0) + 1;
        });
      }
      if (data.createdAt && data.createdAt > g.recentSampleDate) {
        g.recentSampleDate = data.createdAt;
      }
    });

    const summary = Object.values(groups).map(g => {
      const approvalRate = g.total > 0 ? Math.round((g.up / g.total) * 100) : 0;
      const editAfterRate = g.total > 0 ? Math.round((g.editedAfter / g.total) * 100) : 0;
      const topReasons = Object.entries(g.reasons)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([reason, count]) => ({ reason, count }));

      let health: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
      if (approvalRate >= 85) health = 'excellent';
      else if (approvalRate >= 70) health = 'good';
      else if (approvalRate >= 50) health = 'warning';
      else health = 'critical';

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

    const overallApprovalRate = totalAllSignals > 0 ? Math.round((totalAllUp / totalAllSignals) * 100) : 0;

    return res.json({
      success: true,
      timeWindow,
      totalSignalsCount: totalAllSignals,
      overallApprovalRate,
      summary
    });
  } catch (err: any) {
    console.error("Error in /api/admin/feedback-summary:", err);
    return res.status(500).json({ error: err.message || "Failed to generate feedback summary" });
  }
});

// ==========================================
// SMART AUTO-SELECT (POINT-TO-SEGMENTATION)
// ==========================================

app.post("/api/image/segment", async (req, res) => {
  try {
    const _auth = await requireAuth(req, res);
    if (!_auth) return;
    const { uid, token } = _auth;

    // Rate limiting (30 segmentations/min)
    const rl = checkRateLimit(`img_segment:${uid}`, 30, 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({ error: `تجاوزت الحد المسموح للتحديد التلقائي. يرجى المحاولة بعد ${rl.retryAfterSec} ثانية.` });
    }

    // Atomic balance deduction (0.5 points for smart object segmentation)
    const SEGMENT_COST = 0.5;
    const atomicRes = await mutateBalanceAtomic(uid, -SEGMENT_COST, { requireSufficient: true });
    if (!atomicRes.ok) {
      if (atomicRes.reason === 'INSUFFICIENT') {
        return res.status(400).json({ error: `رصيدك غير كافٍ لاستخدام التحديد الذكي. التكلفة: ${SEGMENT_COST} نقطة.` });
      }
      return res.status(500).json({ error: "فشل التحقق من رصيد النقاط." });
    }

    const { imageUrl, imageBase64, point } = req.body;
    if (!imageUrl && !imageBase64) {
      await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {});
      return res.status(400).json({ error: "Missing imageUrl or imageBase64" });
    }

    let cleanBase64 = "";
    let mimeType = "image/png";

    if (imageBase64) {
      if (imageBase64.includes(';base64,')) {
        const parts = imageBase64.split(';base64,');
        mimeType = parts[0].replace('data:', '') || 'image/png';
        cleanBase64 = parts[1];
      } else {
        cleanBase64 = imageBase64;
      }
    } else if (imageUrl) {
      if (imageUrl.startsWith('data:')) {
        const parts = imageUrl.split(';base64,');
        mimeType = parts[0].replace('data:', '') || 'image/png';
        cleanBase64 = parts[1];
      } else {
        // SSRF guard on external imageUrl
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(imageUrl);
        } catch {
          await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {});
          return res.status(400).json({ error: "رابط الصورة غير صالح" });
        }

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {});
          return res.status(400).json({ error: "يُسمح فقط ببروتوكول http أو https" });
        }

        const hostname = parsedUrl.hostname.toLowerCase();
        if (
          hostname === 'localhost' ||
          hostname.endsWith('.local') ||
          hostname.endsWith('.internal') ||
          hostname.includes('metadata') ||
          hostname === '169.254.169.254'
        ) {
          await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {});
          return res.status(400).json({ error: "عنوان الصورة محظور لأسباب أمنية" });
        }

        const addresses = await dns.promises.lookup(hostname, { all: true });
        if (!addresses || addresses.length === 0) {
          await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {});
          return res.status(400).json({ error: "تعذّر الوصول إلى عنوان الصورة (DNS)" });
        }

        for (const addr of addresses) {
          if (isPrivateIp(addr.address)) {
            await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {});
            return res.status(400).json({ error: "عنوان الصورة محظور لأسباب أمنية (شبكة خاصة)" });
          }
        }

        const imgFetch = await fetch(imageUrl);
        if (!imgFetch.ok) {
          await mutateBalanceAtomic(uid, SEGMENT_COST).catch(() => {});
          return res.status(400).json({ error: `فشل جلب الصورة: ${imgFetch.statusText}` });
        }
        const arrayBuf = await imgFetch.arrayBuffer();
        cleanBase64 = Buffer.from(arrayBuf).toString('base64');
        mimeType = imgFetch.headers.get('content-type') || 'image/png';
      }
    }

    const ai = createGenAIClient();
    
    // Target normalized point coordinates in 0..1000 scale
    const targetX = point?.x !== undefined ? (point.x <= 1 ? Math.round(point.x * 1000) : Math.round(point.x)) : 500;
    const targetY = point?.y !== undefined ? (point.y <= 1 ? Math.round(point.y * 1000) : Math.round(point.y)) : 500;

    const segmentPrompt = `You are an expert computer vision object detection and segmentation system.
A user tapped on this image at coordinates [y: ${targetY}, x: ${targetX}] on a normalized [0..1000] scale (where 0,0 is top-left and 1000,1000 is bottom-right).

TASKS:
1. Identify the primary distinct foreground object, subject, person, clothing item, face, logo, or region directly under or surrounding the tapped point [y: ${targetY}, x: ${targetX}].
2. Provide the tight, precise 2D bounding box [ymin, xmin, ymax, xmax] in normalized 0-1000 integers.
3. Provide a list of polygon contour boundary points [[x, y], [x, y], ...] around the perimeter of this object (between 8 and 24 vertices) in 0-1000 normalized scale.
4. Provide a short Arabic and English label for the detected object.

Return ONLY a valid JSON object in this exact schema:
{
  "labelAr": "وصف العنصر المكتشف بالعربية",
  "labelEn": "English description of selected object",
  "box_2d": [ymin, xmin, ymax, xmax],
  "polygon": [[x1, y1], [x2, y2], ...]
}`;

    const resp = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        {
          role: 'user',
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
    let parsed: any = {};
    try {
      parsed = JSON.parse(parsedText);
    } catch (e) {
      console.warn("Failed to parse JSON segment response:", parsedText);
    }

    const box = Array.isArray(parsed.box_2d) && parsed.box_2d.length === 4 ? parsed.box_2d : [
      Math.max(0, targetY - 100),
      Math.max(0, targetX - 100),
      Math.min(1000, targetY + 100),
      Math.min(1000, targetX + 100)
    ];

    const polygon = Array.isArray(parsed.polygon) && parsed.polygon.length >= 3 ? parsed.polygon : [
      [box[1], box[0]],
      [box[3], box[0]],
      [box[3], box[2]],
      [box[1], box[2]]
    ];

    return res.json({
      success: true,
      labelAr: parsed.labelAr || "العنصر المحدد",
      labelEn: parsed.labelEn || "Selected Object",
      box_2d: box,
      polygon,
      point: { x: targetX, y: targetY },
      cost: SEGMENT_COST,
      newBalance: atomicRes.newBalance
    });
  } catch (err: any) {
    console.error("Error in /api/image/segment:", err);
    return res.status(500).json({ error: err.message || "Failed to segment image object" });
  }
});

// ==========================================
// FORMAT PRESETS (IMAGE & SOCIAL RATIOS)
// ==========================================

app.get("/api/presets/format", async (req, res) => {
  try {
    const snapshot = await dbAdmin.collection('format_presets').get();
    if (snapshot.empty) {
      await seedFormatPresetsIfMissing();
      return res.json({ presets: DEFAULT_FORMAT_PRESETS });
    }
    const presets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ presets });
  } catch (err: any) {
    console.error("Error fetching format presets:", err);
    return res.json({ presets: DEFAULT_FORMAT_PRESETS });
  }
});

app.post("/api/admin/presets/format", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }
    const uid = decodedToken.uid;
    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser) {
      try {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      } catch (e) {}
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك بتعديل قوالب المنصات." });
    }

    const { id, nameAr, nameEn, platform, width, height, aspectRatio, category, icon, enabled, safeZone } = req.body;
    if (!id || !nameAr || !aspectRatio) {
      return res.status(400).json({ error: "id, nameAr, and aspectRatio are required." });
    }

    const docRef = dbAdmin.collection('format_presets').doc(id);
    const presetData = {
      id,
      nameAr,
      nameEn: nameEn || nameAr,
      platform: platform || 'custom',
      width: Number(width) || 1080,
      height: Number(height) || 1080,
      aspectRatio,
      category: category || 'social',
      icon: icon || 'image',
      enabled: enabled !== false,
      safeZone: safeZone || getSafeZoneForPreset(id) || '',
      updatedAt: Date.now()
    };
    await docRef.set(presetData, { merge: true });
    return res.json({ success: true, preset: presetData });
  } catch (err: any) {
    console.error("Error saving format preset:", err);
    return res.status(500).json({ error: err.message || "Failed to save format preset" });
  }
});

app.delete("/api/admin/presets/format/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: "فشل التحقق من التوكين: " + err.message });
    }
    const uid = decodedToken.uid;
    const userDoc = await getDocRest("users", uid, token).catch(() => null);
    let isAdminUser = userDoc?.isAdmin === true;
    if (!isAdminUser) {
      try {
        const userSnap = await dbAdmin.collection("users").doc(uid).get();
        isAdminUser = userSnap.exists && userSnap.data()?.isAdmin === true;
      } catch (e) {}
    }
    if (!isAdminUser) {
      return res.status(403).json({ error: "غير مصرح لك بحذف قوالب المنصات." });
    }

    const presetId = req.params.id;
    await dbAdmin.collection('format_presets').doc(presetId).delete();
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting format preset:", err);
    return res.status(500).json({ error: err.message || "Failed to delete format preset" });
  }
});

// ==========================================
// NAJE AGENT (AUTONOMA) AUTONOMOUS ENDPOINTS
// ==========================================

// Chat Turn Handler (Conversational Judgment, Clarification, & Proposal Generation)
app.post("/api/agent/chat-turn", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "يجب تسجيل الدخول لاستخدام هذه الميزة." });
    }
    const token = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(token);
    } catch (authErr) {
      return res.status(401).json({ error: "جلسة الدخول غير صالحة، يرجى تسجيل الدخول مجدداً." });
    }
    const uid = decoded.uid;

    const { messages, projectContext } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Check if admin to bypass rate limiting
    const userDocSnap = await dbAdmin.collection('users').doc(uid).get();
    const isUserAdmin = !!userDocSnap.data()?.isAdmin;

    if (!checkFeatureAccess(res, userDocSnap.data(), 'najeAgent')) return;

    // Rate limit: 60 conversational turns per hour for non-admins
    if (!isUserAdmin) {
      const rl = checkRateLimit(`agent-chat:${uid}`, 60, 60 * 60 * 1000);
      if (!rl.allowed) {
        return res.status(429).json({
          error: `وصلت للحد الأقصى من الرسائل لهذه الساعة. جرّب مجدداً بعد ${Math.ceil(rl.retryAfterSec / 60)} دقيقة.`
        });
      }
    }

    const pricing = await getPricing(token);
    const { processAgentChatTurn } = await import("./src/lib/agentPlanner");
    const result = await processAgentChatTurn(messages, pricing, projectContext);
    return res.json({ success: true, result });
  } catch (err: any) {
    if (err?.code?.startsWith?.('auth/')) {
      return res.status(401).json({ error: "جلسة الدخول غير صالحة، يرجى تسجيل الدخول مجدداً." });
    }
    console.error("[Agent Chat Turn Error]", err);
    return res.status(500).json({ error: err?.message || "Failed to process chat turn" });
  }
});

app.post("/api/agent/propose-plan", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "يجب تسجيل الدخول لاستخدام هذه الميزة." });
    }
    const token = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(token);
    } catch (authErr) {
      return res.status(401).json({ error: "جلسة الدخول غير صالحة، يرجى تسجيل الدخول مجدداً." });
    }
    const uid = decoded.uid;

    const { userPrompt, projectContext } = req.body;
    if (!userPrompt) {
      return res.status(400).json({ error: "userPrompt is required" });
    }

    // Check if admin to bypass rate limiting
    const userDocSnap = await dbAdmin.collection('users').doc(uid).get();
    const isUserAdmin = !!userDocSnap.data()?.isAdmin;

    // Rate limit: 20 plans per hour for non-admins
    if (!isUserAdmin) {
      const rl = checkRateLimit(`agent-plan:${uid}`, 20, 60 * 60 * 1000);
      if (!rl.allowed) {
        return res.status(429).json({
          error: `وصلت للحد الأقصى من طلبات التخطيط لهذه الساعة. جرّب مجدداً بعد ${Math.ceil(rl.retryAfterSec / 60)} دقيقة.`
        });
      }
    }

    const pricing = await getPricing(token);
    const { generateAgentProposal } = await import("./src/lib/agentPlanner");
    const proposal = await generateAgentProposal(userPrompt, projectContext, pricing);
    return res.json({ success: true, proposal });
  } catch (err: any) {
    if (err?.code?.startsWith?.('auth/')) {
      return res.status(401).json({ error: "جلسة الدخول غير صالحة، يرجى تسجيل الدخول مجدداً." });
    }
    console.error("[Agent Plan Propose Error]", err);
    return res.status(500).json({ error: err?.message || "Failed to generate plan proposal" });
  }
});

app.post("/api/agent/execute-tool", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "يجب تسجيل الدخول لاستخدام هذه الميزة." });
    }
    const token = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(token);
    } catch (authErr) {
      return res.status(401).json({ error: "جلسة الدخول غير صالحة، يرجى تسجيل الدخول مجدداً." });
    }
    const uid = decoded.uid;

    const _userDocSnapForGate = await dbAdmin.collection('users').doc(uid).get();
    if (!checkFeatureAccess(res, _userDocSnapForGate.data(), 'najeAgent')) return;

    const { toolName, inputParams, missionContext } = req.body;
    if (!toolName || !missionContext) {
      return res.status(400).json({ error: "toolName and missionContext are required" });
    }

    const userSnap = await dbAdmin.collection('users').doc(uid).get();
    const userData = userSnap.data();
    const isAdmin = !!userData?.isAdmin;

    // Rate limit: 40 tool executions per hour for non-admins
    if (!isAdmin) {
      const rl = checkRateLimit(`agent-exec:${uid}`, 40, 60 * 60 * 1000);
      if (!rl.allowed) {
        return res.status(429).json({
          error: `وصلت للحد الأقصى من طلبات التنفيذ لهذه الساعة. جرّب مجدداً بعد ${Math.ceil(rl.retryAfterSec / 60)} دقيقة.`
        });
      }
    }

    if (toolName === 'image_studio') {
      const rlNovaHr = checkRateLimit(`nova_hr:${uid}`, 30, 60 * 60 * 1000);
      if (!rlNovaHr.allowed) {
        return res.status(429).json({
          error: `وصلت للحد الأقصى لتوليد الصور لهذه الساعة (30 صورة/ساعة).`
        });
      }
      const rlNovaDay = checkRateLimit(`nova_day:${uid}`, 150, 24 * 60 * 60 * 1000);
      if (!rlNovaDay.allowed) {
        return res.status(429).json({
          error: `وصلت للحد الأقصى اليومي لتوليد الصور (150 صورة/يوم).`
        });
      }
    }

    // Dynamic cost lookup matching Naje central pricing
    const pricing = await getPricing(token);
    const estimatedCost = getAgentToolCost(toolName, inputParams || {}, pricing);

    // Reserve points atomically BEFORE running tool (if not admin)
    if (!isAdmin && estimatedCost > 0) {
      const reserve = await mutateBalanceAtomic(uid, -estimatedCost, { requireSufficient: true });
      if (!reserve.ok) {
        if (reserve.reason === 'INSUFFICIENT') {
          return res.status(403).json({
            error: `رصيدك غير كافٍ لتشغيل هذا الإجراء. تحتاج إلى ${estimatedCost} نقاط.`
          });
        }
        return res.status(500).json({ error: "تعذر التحقق من الرصيد، حاول مجدداً." });
      }
    }

    // Force missionContext.ownerId to the verified uid
    const safeMissionContext = { ...missionContext, ownerId: uid };

    const { executeAgentTool } = await import("./src/lib/agentExecutor");
    const { auditAgentStepResult } = await import("./src/lib/agentPlanner");

    let result;
    try {
      result = await executeAgentTool(toolName, inputParams || {}, safeMissionContext, pricing);
    } catch (execErr) {
      // Tool failed — refund the reservation, points are only spent on success
      if (!isAdmin && estimatedCost > 0) {
        await mutateBalanceAtomic(uid, estimatedCost, {});
      }
      throw execErr;
    }

    // True up reservation if actual cost differed from estimate
    if (!isAdmin && result.pointsDeducted !== estimatedCost) {
      await mutateBalanceAtomic(uid, estimatedCost - result.pointsDeducted, {});
    }

    const stepTitle = req.body.stepTitle || toolName;
    const userOriginalRequest = safeMissionContext.userPrompt || safeMissionContext.brandContext?.brandName || stepTitle;
    const audit = await auditAgentStepResult(stepTitle, result.output, safeMissionContext.brandContext, {
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
  } catch (err: any) {
    if (err?.code?.startsWith?.('auth/')) {
      return res.status(401).json({ error: "جلسة الدخول غير صالحة، يرجى تسجيل الدخول مجدداً." });
    }
    console.error("[Agent Tool Execution Error]", err);
    return res.status(500).json({ error: err?.message || "Failed to execute agent tool" });
  }
});

// Real-Time Server-Sent Events (SSE) Streaming Tool Execution Endpoint (Naje Agent Core Master Pipeline)
app.post("/api/agent/execute-tool-stream", async (req, res) => {
  let heartbeat: any = null;
  let uid = '';
  let isAdmin = false;
  let estimatedCost = 0;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "يجب تسجيل الدخول لاستخدام هذه الميزة." });
    }
    const token = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(token);
    } catch (authErr) {
      return res.status(401).json({ error: "جلسة الدخول غير صالحة، يرجى تسجيل الدخول مجدداً." });
    }
    uid = decoded.uid;

    const _userDocSnapForGate = await dbAdmin.collection('users').doc(uid).get();
    if (!checkFeatureAccess(res, _userDocSnapForGate.data(), 'najeAgent')) return;

    const { toolName, inputParams, missionContext } = req.body;
    if (!toolName || !missionContext) {
      return res.status(400).json({ error: "toolName and missionContext are required" });
    }

    const userSnap = await dbAdmin.collection('users').doc(uid).get();
    const userData = userSnap.data();
    isAdmin = !!userData?.isAdmin;

    // Rate limit: 40 tool executions per hour for non-admins
    if (!isAdmin) {
      const rl = checkRateLimit(`agent-exec:${uid}`, 40, 60 * 60 * 1000);
      if (!rl.allowed) {
        return res.status(429).json({
          error: `وصلت للحد الأقصى من طلبات التنفيذ لهذه الساعة. جرّب مجدداً بعد ${Math.ceil(rl.retryAfterSec / 60)} دقيقة.`
        });
      }
    }

    if (toolName === 'image_studio') {
      const rlNovaHr = checkRateLimit(`nova_hr:${uid}`, 30, 60 * 60 * 1000);
      if (!rlNovaHr.allowed) {
        return res.status(429).json({
          error: `وصلت للحد الأقصى لتوليد الصور لهذه الساعة (30 صورة/ساعة).`
        });
      }
      const rlNovaDay = checkRateLimit(`nova_day:${uid}`, 150, 24 * 60 * 60 * 1000);
      if (!rlNovaDay.allowed) {
        return res.status(429).json({
          error: `وصلت للحد الأقصى اليومي لتوليد الصور (150 صورة/يوم).`
        });
      }
    }

    // Dynamic cost lookup matching Naje central pricing
    const pricing = await getPricing(token);
    estimatedCost = getAgentToolCost(toolName, inputParams || {}, pricing);

    // Reserve points atomically BEFORE starting SSE stream
    if (!isAdmin && estimatedCost > 0) {
      const reserve = await mutateBalanceAtomic(uid, -estimatedCost, { requireSufficient: true });
      if (!reserve.ok) {
        if (reserve.reason === 'INSUFFICIENT') {
          return res.status(403).json({
            error: `رصيدك غير كافٍ لتشغيل هذا الإجراء. تحتاج إلى ${estimatedCost} نقاط.`
          });
        }
        return res.status(500).json({ error: "تعذر التحقق من الرصيد، حاول مجدداً." });
      }
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    const safeMissionContext = { ...missionContext, ownerId: uid };
    const { executeAgentTool } = await import("./src/lib/agentExecutor");
    const { auditAgentStepResult } = await import("./src/lib/agentPlanner");

    let result;
    try {
      result = await executeAgentTool(
        toolName, 
        inputParams || {}, 
        safeMissionContext, 
        pricing,
        {
          onProgress: (progress) => {
            sendEvent('progress', progress);
          }
        }
      );
    } catch (execErr: any) {
      // Tool failed — refund atomic points reservation
      if (!isAdmin && estimatedCost > 0) {
        await mutateBalanceAtomic(uid, estimatedCost, {});
      }
      sendEvent('error', { error: execErr?.message || 'Execution failed' });
      return;
    }

    // True up reservation if actual cost differed from estimate
    if (!isAdmin && result.pointsDeducted !== estimatedCost) {
      await mutateBalanceAtomic(uid, estimatedCost - result.pointsDeducted, {});
    }

    const stepTitle = req.body.stepTitle || toolName;
    const userOriginalRequest = safeMissionContext.userPrompt || safeMissionContext.brandContext?.brandName || stepTitle;
    const audit = await auditAgentStepResult(stepTitle, result.output, safeMissionContext.brandContext, {
      toolName,
      stepTitle,
      userOriginalRequest
    });

    sendEvent('done', {
      success: true,
      output: result.output,
      artifact: result.artifact,
      pointsDeducted: isAdmin ? 0 : result.pointsDeducted,
      audit
    });
  } catch (err: any) {
    if (!isAdmin && estimatedCost > 0 && uid) {
      await mutateBalanceAtomic(uid, estimatedCost, {}).catch(() => {});
    }
    console.error("[Agent Tool Stream Error]", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err?.message || "Failed to execute agent tool stream" });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err?.message || "Execution stream error" })}\n\n`);
    }
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    res.end();
  }
});


  // ---------------------------------------------------------------------------
  // ناجي المطور + ناجي من مصادرك
  // ---------------------------------------------------------------------------
  const DEV_ZIP_MAX_BYTES = 8 * 1024 * 1024;

  function isSafeOutboundUrl(raw: string): boolean {
    try {
      const u = new URL(raw);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
      const host = u.hostname.toLowerCase();
      if (host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0') return false;
      if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.|::1)/.test(host)) return false;
      return true;
    } catch {
      return false;
    }
  }

  function htmlToPlainText(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&/gi, '&')
      .replace(/</gi, '<')
      .replace(/>/gi, '>')
      .replace(/"/gi, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 20_000);
  }

  async function loadWorkspaceFiles(workspaceId: string, uid: string): Promise<{ meta: any; files: WorkspaceFile[] } | null> {
    const snap = await dbAdmin.collection('developer_workspaces').doc(workspaceId).get();
    if (!snap.exists) return null;
    const meta = snap.data() || {};
    if (meta.ownerId !== uid) return null;
    const fileSnaps = await dbAdmin.collection('developer_workspaces').doc(workspaceId).collection('files').get();
    const files: WorkspaceFile[] = fileSnaps.docs.map(d => {
      const x = d.data() || {};
      return {
        path: String(x.path || d.id),
        language: String(x.language || 'plaintext'),
        content: String(x.content || ''),
        bytes: Number(x.bytes || 0),
        truncated: !!x.truncated
      };
    });
    return { meta, files };
  }

  app.post('/api/developer/unpack', async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const userState = await getUserDocAndBalance(auth.uid, auth.token, auth);
      if (!checkFeatureAccess(res, userState.doc, 'najeDeveloper')) return;

      const zipBase64 = String(req.body?.zipBase64 || '').replace(/^data:[^;]+;base64,/, '');
      const fileName = String(req.body?.fileName || 'project.zip').slice(0, 180);
      if (!zipBase64) return res.status(400).json({ error: 'ارفع ملف ZIP للموقع.' });
      const buf = Buffer.from(zipBase64, 'base64');
      if (!buf.length) return res.status(400).json({ error: 'الملف فارغ.' });
      if (buf.length > DEV_ZIP_MAX_BYTES) {
        return res.status(413).json({ error: 'حجم الأرشيف أكبر من 8MB. اضغط المشروع بدون node_modules وdist.' });
      }

      const unpacked = await unpackSiteZip(buf);
      if (!unpacked.files.length) {
        return res.status(400).json({ error: 'ما لقينا ملفات نصية داخل الأرشيف. تأكد أنه موقع (HTML/JS/CSS) مو صور فقط.' });
      }

      const workspaceRef = dbAdmin.collection('developer_workspaces').doc();
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
          const id = Buffer.from(f.path).toString('base64url').slice(0, 700);
          batch.set(workspaceRef.collection('files').doc(id), {
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
        tree: unpacked.files.map(f => ({ path: f.path, language: f.language, bytes: f.bytes, truncated: f.truncated })),
        message: 'تم فك الأرشيف. توجه للدردشة مع ناجي.'
      });
    } catch (err: any) {
      console.error('[developer/unpack]', err);
      return res.status(500).json({ error: err?.message || 'تعذّر فك الأرشيف.' });
    }
  });

  app.get('/api/developer/workspace/:id', async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const loaded = await loadWorkspaceFiles(String(req.params.id), auth.uid);
      if (!loaded) return res.status(404).json({ error: 'المشروع غير موجود.' });
      return res.json({
        success: true,
        workspaceId: req.params.id,
        fileName: loaded.meta.fileName,
        fileCount: loaded.files.length,
        tree: loaded.files.map(f => ({ path: f.path, language: f.language, bytes: f.bytes, truncated: f.truncated }))
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'تعذّر تحميل المشروع.' });
    }
  });

  app.get('/api/developer/file', async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const workspaceId = String(req.query.workspaceId || '');
      const filePath = String(req.query.path || '');
      const snap = await dbAdmin.collection('developer_workspaces').doc(workspaceId).get();
      if (!snap.exists || snap.data()?.ownerId !== auth.uid) {
        return res.status(404).json({ error: 'المشروع غير موجود.' });
      }
      const id = Buffer.from(filePath).toString('base64url').slice(0, 700);
      let fileSnap = await dbAdmin.collection('developer_workspaces').doc(workspaceId).collection('files').doc(id).get();
      if (!fileSnap.exists) {
        const q = await dbAdmin.collection('developer_workspaces').doc(workspaceId).collection('files').where('path', '==', filePath).limit(1).get();
        fileSnap = q.empty ? fileSnap : q.docs[0];
      }
      if (!fileSnap.exists) return res.status(404).json({ error: 'الملف غير موجود.' });
      const x = fileSnap.data() || {};
      return res.json({
        success: true,
        file: {
          path: String(x.path || filePath),
          language: String(x.language || 'plaintext'),
          content: String(x.content || ''),
          bytes: Number(x.bytes || 0),
          truncated: !!x.truncated
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'تعذّر قراءة الملف.' });
    }
  });

  app.post('/api/developer/export', async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const loaded = await loadWorkspaceFiles(String(req.body?.workspaceId || ''), auth.uid);
      if (!loaded) return res.status(404).json({ error: 'المشروع غير موجود.' });
      const JSZipMod = (await import('jszip')).default;
      const zip = new JSZipMod();
      for (const f of loaded.files) zip.file(f.path, f.content);
      const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(loaded.meta.fileName || 'naje-project.zip')}"`);
      return res.send(buf);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'تعذّر تصدير الأرشيف.' });
    }
  });

  app.post('/api/developer/chat', async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const userState = await getUserDocAndBalance(auth.uid, auth.token, auth);
      if (!checkFeatureAccess(res, userState.doc, 'najeDeveloper')) return;
      const userIsAdmin = isPrivilegedAdmin(userState.doc, auth);

      const workspaceId = String(req.body?.workspaceId || '');
      const prompt = String(req.body?.prompt || '').trim();
      const intent = String(req.body?.intent || 'chat');
      const focusPath = req.body?.focusPath ? String(req.body.focusPath) : '';
      const history = Array.isArray(req.body?.history) ? req.body.history.slice(-12) : [];
      if (!prompt) return res.status(400).json({ error: 'اكتب رسالة.' });

      const loaded = await loadWorkspaceFiles(workspaceId, auth.uid);
      if (!loaded) return res.status(404).json({ error: 'ارفع أرشيف الموقع أولاً.' });

      const tree = buildFileTree(loaded.files.map(f => f.path));
      const codeCtx = buildCodeContext(loaded.files, focusPath);
      const ai = createGenAIClient();
      const modelId = resolveEngineModel(await getModelEndpointId('text_core', getNajeModel('core'), auth.token));

      let system = `أنت «ناجي المطور». تفحص مواقع مرفوعة كأرشيف ZIP. تتكلم عربي فصيح واضح، رؤوس أقلام، بدون حشو.
ملفات المشروع (${loaded.files.length}):
${tree}

مقتطف الكود:
${codeCtx}

قواعد:
- لا تختلق ملفات غير موجودة.
- إن طلب المستخدم تعديلاً، استدعِ الأداة apply_file_patch بالمسار والمحتوى الكامل الجديد.
- لا تشغّل الكود. التعديل على الملفات المحفوظة فقط ثم يُعاد تصدير ZIP.`;

      if (intent === 'audit') {
        system += `\n\nالمهمة الحالية: فحص شامل. أخرج تقريراً عربياً بهذه الأقسام حصراً:
1) البنية والملفات
2) أخطاء واضحة (HTML/JS/CSS)
3) أمان (XSS، أسرار، تقييم eval، روابط خارجية خطرة)
4) أداء وإتاحة
5) أولويات الإصلاح
كل قسم نقاط قصيرة. اختم بجملة: «إذا بدك، أكتب لك بريف توجيه تفصيلي للوكيل اللي تطور معه الكود.»`;
      } else if (intent === 'brief') {
        system += `\n\nالمهمة الحالية: اكتب بريف توجيه تفصيلي لوكيل برمجي (Cursor/Grok/Copilot) بالعربية والإنجليزية المختصرة للكود. حدّد الملفات، المطلوب، قيود عدم كسر التصميم، وترتيب التنفيذ.`;
      }

      const contents: any[] = [];
      for (const h of history) {
        const role = h.role === 'assistant' || h.role === 'model' ? 'model' : 'user';
        const text = String(h.content || '').slice(0, 4000);
        if (text) contents.push({ role, parts: [{ text }] });
      }
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      const tools = [{
        functionDeclarations: [{
          name: 'apply_file_patch',
          description: 'Replace the full contents of an existing project file. Path must already exist.',
          parameters: {
            type: 'OBJECT',
            properties: {
              path: { type: 'STRING' },
              content: { type: 'STRING' },
              note: { type: 'STRING' }
            },
            required: ['path', 'content']
          }
        }]
      }];

      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });

      const stream = await ai.models.generateContentStream({
        model: modelId,
        contents,
        config: {
          systemInstruction: system,
          tools,
          maxOutputTokens: intent === 'audit' ? OUTPUT_TOKEN_LIMITS.fullstackAudit : OUTPUT_TOKEN_LIMITS.chatResponse
        }
      });

      let fullText = '';
      const functionCalls: any[] = [];
      let usageMeta: any = null;
      for await (const chunk of stream) {
        if (chunk.usageMetadata) usageMeta = chunk.usageMetadata;
        const calls = extractGeminiFunctionCalls(chunk);
        if (calls.length) functionCalls.push(...calls);
        const t = extractGeminiText(chunk);
        if (t) {
          fullText += t;
          res.write(`data: ${JSON.stringify({ text: t })}\n\n`);
        }
      }

      const applied: string[] = [];
      for (const fc of functionCalls) {
        if (fc.name !== 'apply_file_patch') continue;
        const p = String(fc.args?.path || '');
        const content = String(fc.args?.content || '');
        const target = loaded.files.find(f => f.path === p);
        if (!target || !content) continue;
        const id = Buffer.from(p).toString('base64url').slice(0, 700);
        await dbAdmin.collection('developer_workspaces').doc(workspaceId).collection('files').doc(id).set({
          path: p,
          language: target.language,
          content: content.slice(0, 60_000),
          bytes: Math.min(content.length, 60_000),
          truncated: content.length > 60_000
        }, { merge: true });
        applied.push(p);
      }
      if (applied.length) {
        const note = `\n\nتم تطبيق التعديل على: ${applied.join('، ')}. تقدر تصدّر ZIP محدّث.`;
        fullText += note;
        res.write(`data: ${JSON.stringify({ text: note, applied })}\n\n`);
      }

      const bill = await chargeForTextModelUsage(auth.uid, 'text_core', usageMeta, userIsAdmin).catch(() => null);
      if (typeof bill?.newBalance === 'number') {
        // live balance
      }
      res.write(`data: ${JSON.stringify({
        newBalance: bill?.newBalance,
        usage: {
          charged: bill?.charged || 0,
          inputTokens: bill?.inputTokens || 0,
          outputTokens: bill?.outputTokens || 0,
          cachedTokens: bill?.cachedTokens || 0,
          thoughtsTokens: bill?.thoughtsTokens || 0,
          billingType: 'per_token'
        },
        applied
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      console.error('[developer/chat]', err);
      if (!res.headersSent) return res.status(500).json({ error: err?.message || 'تعذّر الفحص.' });
      res.write(`data: ${JSON.stringify({ error: err?.message || 'تعذّر الفحص.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  });

  app.post('/api/source/add', async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const userState = await getUserDocAndBalance(auth.uid, auth.token, auth);
      if (!checkFeatureAccess(res, userState.doc, 'najeSource')) return;

      let workspaceId = String(req.body?.workspaceId || '');
      const type = String(req.body?.type || 'text');
      const title = String(req.body?.title || '').slice(0, 200);
      let content = String(req.body?.content || '');
      const url = String(req.body?.url || '').trim();

      if (!workspaceId) {
        const ref = dbAdmin.collection('source_workspaces').doc();
        await ref.set({ ownerId: auth.uid, createdAt: Date.now(), itemCount: 0 });
        workspaceId = ref.id;
      } else {
        const snap = await dbAdmin.collection('source_workspaces').doc(workspaceId).get();
        if (!snap.exists || snap.data()?.ownerId !== auth.uid) {
          return res.status(404).json({ error: 'مساحة المصادر غير موجودة.' });
        }
      }

      const existing = await dbAdmin.collection('source_workspaces').doc(workspaceId).collection('items').get();
      if (existing.size >= 24) return res.status(400).json({ error: 'وصلت للحد الأقصى (24 مصدر). احذف مصدراً أولاً.' });

      if (type === 'url') {
        if (!isSafeOutboundUrl(url)) return res.status(400).json({ error: 'الرابط غير مسموح.' });
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 12000);
        try {
          const fetched = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'NajeSource/1.0' } });
          if (!fetched.ok) return res.status(400).json({ error: `تعذّر جلب الرابط (${fetched.status}).` });
          const ctype = fetched.headers.get('content-type') || '';
          const raw = await fetched.text();
          content = ctype.includes('html') ? htmlToPlainText(raw) : raw.slice(0, 20_000);
        } catch {
          return res.status(400).json({ error: 'تعذّر جلب الرابط.' });
        } finally {
          clearTimeout(t);
        }
      }

      content = content.slice(0, 20_000);
      let imageBase64 = '';
      let mimeType = '';
      if (type === 'image') {
        imageBase64 = String(req.body?.data || content).replace(/^data:[^;]+;base64,/, '');
        mimeType = String(req.body?.mimeType || 'image/jpeg').slice(0, 80);
        if (!imageBase64 || imageBase64.length > 700_000) {
          return res.status(400).json({ error: 'الصورة كبيرة أو فارغة (الحد ~500KB).' });
        }
        content = String(req.body?.caption || title || 'صورة مرفقة');
      }
      if (type !== 'image' && !content.trim()) return res.status(400).json({ error: 'المحتوى فارغ.' });

      const itemRef = await dbAdmin.collection('source_workspaces').doc(workspaceId).collection('items').add({
        ownerId: auth.uid,
        type,
        title: title || (type === 'url' ? url : type === 'image' ? 'صورة' : 'مصدر نصي'),
        url: type === 'url' ? url : '',
        content,
        imageBase64: imageBase64 || '',
        mimeType: mimeType || '',
        createdAt: Date.now()
      });
      await dbAdmin.collection('source_workspaces').doc(workspaceId).set({ itemCount: existing.size + 1, updatedAt: Date.now() }, { merge: true });

      return res.json({
        success: true,
        workspaceId,
        item: { id: itemRef.id, type, title: title || (type === 'url' ? url : type === 'image' ? 'صورة' : 'مصدر نصي'), url: type === 'url' ? url : '', excerpt: content.slice(0, 240) }
      });
    } catch (err: any) {
      console.error('[source/add]', err);
      return res.status(500).json({ error: err?.message || 'تعذّر إضافة المصدر.' });
    }
  });

  app.get('/api/source/workspace/:id', async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const snap = await dbAdmin.collection('source_workspaces').doc(String(req.params.id)).get();
      if (!snap.exists || snap.data()?.ownerId !== auth.uid) return res.status(404).json({ error: 'غير موجود.' });
      const items = await dbAdmin.collection('source_workspaces').doc(String(req.params.id)).collection('items').orderBy('createdAt', 'desc').get();
      return res.json({
        success: true,
        workspaceId: req.params.id,
        items: items.docs.map(d => {
          const x = d.data() || {};
          return { id: d.id, type: x.type, title: x.title, url: x.url || '', excerpt: String(x.content || '').slice(0, 240) };
        })
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'تعذّر التحميل.' });
    }
  });

  app.delete('/api/source/item', async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const workspaceId = String(req.body?.workspaceId || '');
      const itemId = String(req.body?.itemId || '');
      const snap = await dbAdmin.collection('source_workspaces').doc(workspaceId).get();
      if (!snap.exists || snap.data()?.ownerId !== auth.uid) return res.status(404).json({ error: 'غير موجود.' });
      await dbAdmin.collection('source_workspaces').doc(workspaceId).collection('items').doc(itemId).delete();
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'تعذّر الحذف.' });
    }
  });

  app.post('/api/source/chat', async (req, res) => {
    try {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const userState = await getUserDocAndBalance(auth.uid, auth.token, auth);
      if (!checkFeatureAccess(res, userState.doc, 'najeSource')) return;
      const userIsAdmin = isPrivilegedAdmin(userState.doc, auth);

      const workspaceId = String(req.body?.workspaceId || '');
      const prompt = String(req.body?.prompt || '').trim();
      const allowWeb = req.body?.allowWeb === true;
      const history = Array.isArray(req.body?.history) ? req.body.history.slice(-12) : [];
      if (!prompt) return res.status(400).json({ error: 'اكتب رسالة.' });
      if (!workspaceId) return res.status(400).json({ error: 'أضف مصدراً أولاً.' });

      const snap = await dbAdmin.collection('source_workspaces').doc(workspaceId).get();
      if (!snap.exists || snap.data()?.ownerId !== auth.uid) return res.status(404).json({ error: 'مساحة المصادر غير موجودة.' });
      const itemSnaps = await dbAdmin.collection('source_workspaces').doc(workspaceId).collection('items').get();
      const sources = itemSnaps.docs.map(d => {
        const x = d.data() || {};
        return {
          title: x.title,
          type: x.type,
          url: x.url,
          content: String(x.content || '').slice(0, 12_000),
          imageBase64: x.imageBase64 ? String(x.imageBase64) : '',
          mimeType: String(x.mimeType || 'image/jpeg')
        };
      });
      if (!sources.length) return res.status(400).json({ error: 'أضف مصدراً واحداً على الأقل.' });

      const sourceBlock = sources.map((s, i) => `# مصدر ${i + 1}: ${s.title}${s.url ? ` (${s.url})` : ''}\n${s.content}`).join('\n\n');
      const system = `أنت «ناجي من مصادرك». ممنوع الاختلاق. تجيب فقط مما في المصادر أدناه.
إذا ما لقيت الجواب في المصادر:
${allowWeb ? '- ابدأ حرفياً: «لم أجد في المصادر، وبحثت في الإنترنت والنتيجة:» ثم لخّص نتيجة البحث مع الروابط.' : '- أجب حرفياً فقط: «لم أجد في المصادر.» بلا أي إضافة.'}
لا تخلط رأيك. إن اقتبست، اذكر رقم المصدر.

المصادر:
${sourceBlock}`;

      const ai = createGenAIClient();
      const modelId = resolveEngineModel(await getModelEndpointId('text_core', getNajeModel('core'), auth.token));
      const contents: any[] = [];
      for (const h of history) {
        const role = h.role === 'assistant' || h.role === 'model' ? 'model' : 'user';
        const text = String(h.content || '').slice(0, 4000);
        if (text) contents.push({ role, parts: [{ text }] });
      }
      contents.push({
        role: 'user',
        parts: [
          { text: prompt },
          ...sources.filter(s => s.imageBase64).slice(0, 4).map(s => ({
            inlineData: { mimeType: s.mimeType || 'image/jpeg', data: s.imageBase64 }
          }))
        ]
      });

      const tools: any[] = [];
      if (allowWeb) tools.push({ googleSearch: {} });

      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });

      const stream = await ai.models.generateContentStream({
        model: modelId,
        contents,
        config: {
          systemInstruction: system,
          tools: tools.length ? tools : undefined,
          maxOutputTokens: OUTPUT_TOKEN_LIMITS.chatResponse
        }
      });

      let usageMeta: any = null;
      const searchSources: Array<{ title: string; url: string }> = [];
      for await (const chunk of stream) {
        if (chunk.usageMetadata) usageMeta = chunk.usageMetadata;
        const candidate = chunk.candidates?.[0];
        if (candidate?.groundingMetadata?.groundingChunks) {
          for (const g of candidate.groundingMetadata.groundingChunks) {
            if (g.web?.uri && !searchSources.some(s => s.url === g.web.uri)) {
              searchSources.push({ title: g.web.title || g.web.uri, url: g.web.uri });
            }
          }
        }
        const t = extractGeminiText(chunk);
        if (t) res.write(`data: ${JSON.stringify({ text: t })}\n\n`);
      }
      if (searchSources.length) res.write(`data: ${JSON.stringify({ searchSources })}\n\n`);
      const bill = await chargeForTextModelUsage(auth.uid, 'text_core', usageMeta, userIsAdmin).catch(() => null);
      res.write(`data: ${JSON.stringify({
        newBalance: bill?.newBalance,
        usage: {
          charged: bill?.charged || 0,
          inputTokens: bill?.inputTokens || 0,
          outputTokens: bill?.outputTokens || 0,
          cachedTokens: bill?.cachedTokens || 0,
          thoughtsTokens: bill?.thoughtsTokens || 0,
          billingType: 'per_token'
        }
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      console.error('[source/chat]', err);
      if (!res.headersSent) return res.status(500).json({ error: err?.message || 'تعذّر الرد.' });
      res.write(`data: ${JSON.stringify({ error: err?.message || 'تعذّر الرد.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  });


  const candidateDistPaths = [
    path.join(process.cwd(), 'dist'),
    appDirname,
    path.join(appDirname, '..', 'dist'),
    path.join(appDirname, 'dist')
  ];
  const distPath = candidateDistPaths.find(p => fs.existsSync(path.join(p, 'index.html')));
  const isProduction = Boolean(isProdBundle && distPath);

  // Serve public directory as static assets (logos, manifest, etc.)
  app.use(express.static(path.join(process.cwd(), 'public'), { dotfiles: 'allow' }));
  
  // 404 handler for unmatched /api/* requests to avoid returning HTML fallback for API calls
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (distPath) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath);
    });
  }
  
  // Global Error Handler for API routes
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Express Error:", err);
    if (req.path.startsWith('/api/')) {
      return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    }
    next(err);
  });

  executeSeeds();
}

function shouldAutoStartServer(): boolean {
  const entry = (process.argv[1] || '').replace(/\\/g, '/');
  return (
    entry.endsWith('/server.ts') ||
    entry.endsWith('/server.cjs') ||
    entry.endsWith('/dist/server.cjs')
  );
}

if (shouldAutoStartServer()) {
  startServer().catch((err) => {
    console.error('[Server] fatal start error:', err);
  });
}

