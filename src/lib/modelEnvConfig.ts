/**
 * Central Dynamic Model Configuration for Naje AI.
 * 
 * Maps environment variables (e.g. NAJE_MODEL_CORE, NAJE_MODEL_PRO)
 * to model identifiers, allowing complete control from the environment
 * without hardcoding model names across the codebase.
 */

export type NajeModelRole =
  | 'core'
  | 'lite'
  | 'pro'
  | 'personas'
  | 'image_lite'
  | 'image_core'
  | 'image_pro'
  | 'video_core'
  | 'video_pro'
  | 'voice'
  | 'voice_core'
  | 'voice_pro';

function readEnv(keys: string[], defaultValue: string): string {
  if (typeof process === 'undefined' || !process.env) return defaultValue;
  for (const key of keys) {
    const val = process.env[key];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  }
  return defaultValue;
}

/**
 * Returns the configured model for a given functional role from environment variables,
 * with safe, production-tested fallback defaults.
 */
export function getNajeModel(role: NajeModelRole): string {
  switch (role) {
    case 'core':
      return readEnv(['NAJE_MODEL_CORE', 'Naje-core', 'MODEL_CORE', 'NAJE_CORE'], 'gemini-3.6-flash');
    case 'lite':
      return readEnv(['NAJE_MODEL_LITE', 'Naje-lite', 'MODEL_LITE', 'NAJE_LITE'], 'gemini-3.5-flash-lite');
    case 'pro':
      return readEnv(['NAJE_MODEL_PRO', 'Naje-pro', 'MODEL_PRO', 'NAJE_PRO'], 'gemini-3.1-pro-preview');
    case 'personas':
      return readEnv(['NAJE_MODEL_PERSONAS', 'Naje-personas', 'MODEL_PERSONAS', 'NAJE_PERSONAS'], 'gemini-3.5-flash-lite');
    case 'image_lite':
      return readEnv(['NAJE_MODEL_IMAGE_LITE', 'Naje-image-lite', 'MODEL_IMAGE_LITE'], 'nano-banana-2-lite');
    case 'image_core':
      return readEnv(['NAJE_MODEL_IMAGE_CORE', 'Naje-image', 'MODEL_IMAGE_CORE'], 'nano-banana-2');
    case 'image_pro':
      return readEnv(['NAJE_MODEL_IMAGE_PRO', 'Naje-image-pro', 'MODEL_IMAGE_PRO'], 'nano-banana-pro');
    case 'video_core':
      return readEnv(['NAJE_MODEL_VIDEO_CORE', 'Naje-video-lite', 'Naje-video', 'MODEL_VIDEO_CORE', 'NAJE_VIDEO_LITE', 'NAJE_VIDEO'], 'veo-3.1-lite-generate-001');
    case 'video_pro':
      return readEnv(['NAJE_MODEL_VIDEO_PRO', 'Naje-video-pro', 'MODEL_VIDEO_PRO', 'NAJE_VIDEO_PRO'], 'gemini-omni-1.1-flash-preview');
    case 'voice_core':
      return readEnv(['NAJE_MODEL_VOICE_CORE', 'Naje-voice-core', 'MODEL_VOICE_CORE', 'NAJE_VOICE_CORE', 'NAJE_MODEL_VOICE', 'Naje-voice'], 'gemini-3.1-flash-tts-preview');
    case 'voice_pro':
      return readEnv(['NAJE_MODEL_VOICE_PRO', 'Naje-voice-pro', 'MODEL_VOICE_PRO', 'NAJE_VOICE_PRO'], 'gemini-3.1-flash-tts-preview');
    case 'voice':
      return readEnv(['NAJE_MODEL_VOICE_CORE', 'NAJE_MODEL_VOICE', 'Naje-voice-core', 'Naje-voice', 'MODEL_VOICE_CORE', 'MODEL_VOICE'], 'gemini-3.1-flash-tts-preview');
    default:
      return readEnv(['NAJE_MODEL_CORE', 'MODEL_CORE'], 'gemini-3.6-flash');
  }
}

/**
 * Resolves high-level tier aliases, user-configured names, and corrects preview suffixes
 * into executable publisher model identifiers compatible with Google GenAI / Vertex AI SDK.
 */
export function resolveEngineModel(modelOrAlias: string): string {
  if (!modelOrAlias) return getNajeModel('core');
  const m = String(modelOrAlias || '').trim();
  const lower = m.toLowerCase().replace(/\s+/g, '-');

  // Dynamic environment aliases
  if (lower === 'naje-core' || lower === 'core') {
    return resolveEngineModel(getNajeModel('core'));
  }
  if (lower === 'naje-lite' || lower === 'lite') {
    return resolveEngineModel(getNajeModel('lite'));
  }
  if (lower === 'naje-pro' || lower === 'max' || lower === 'pro') {
    return resolveEngineModel(getNajeModel('pro'));
  }
  if (lower === 'naje-personas' || lower === 'personas') {
    return resolveEngineModel(getNajeModel('personas'));
  }
  if (lower === 'naje-voice-core' || lower === 'voice-core' || lower === 'voice_core') {
    return resolveEngineModel(getNajeModel('voice_core'));
  }
  if (lower === 'naje-voice-pro' || lower === 'voice-pro' || lower === 'voice_pro') {
    return resolveEngineModel(getNajeModel('voice_pro'));
  }
  if (lower === 'naje-voice' || lower === 'voice') {
    return resolveEngineModel(getNajeModel('voice_core'));
  }
  if (lower === 'naje-video-core' || lower === 'naje-video-lite' || lower === 'naje-video' || lower === 'video' || lower === 'veo' || lower === 'video_standard' || lower === 'video_veo_lite') {
    return resolveEngineModel(getNajeModel('video_core'));
  }
  if (lower === 'naje-video-pro' || lower === 'video-pro' || lower === 'video_pro' || lower === 'veo-pro' || lower === 'omni' || lower === 'video_omni' || lower === 'video_hd') {
    return resolveEngineModel(getNajeModel('video_pro'));
  }

  // Robust pattern and casing normalizations for Google Cloud / Vertex AI compatibility
  // 1. Text models
  if (lower === 'gemini-3.1-pro' || lower === 'gemini-3.1-pro-preview') {
    return 'gemini-3.1-pro-preview';
  }
  if (lower === 'gemini-3.5-flash-lite' || lower === 'flash-lite') {
    return 'gemini-3.5-flash-lite';
  }
  if (lower === 'gemini-3.6-flash' || lower === 'gemini-flash' || lower === 'flash') {
    return 'gemini-3.6-flash';
  }

  // 2. Image models (Always enforce strict lowercase and valid Vertex / GenAI IDs)
  if (lower.includes('flash-lite-image') || lower === 'nano-banana-2-lite' || lower === 'naje-image-lite') {
    return 'gemini-3.1-flash-lite-image';
  }
  if (lower.includes('flash-image') || lower === 'nano-banana-2' || lower === 'naje-image') {
    return 'gemini-3.1-flash-image';
  }
  if (lower.includes('pro-image') || lower === 'nano-banana-pro' || lower === 'naje-image-pro') {
    return 'gemini-3-pro-image';
  }

  // 3. Video models
  if (lower === 'veo-lite' || lower === 'veo-3.1-lite' || lower === 'veo-3.1-lite-generate' || lower === 'veo-3.1-lite-generate-001' || lower === 'veo-3.1-lite-generate-preview') {
    return 'veo-3.1-lite-generate-001';
  }
  if (lower === 'veo-pro' || lower === 'veo-3.1-pro' || lower === 'veo-3.1-generate' || lower === 'veo-3.1-generate-001' || lower === 'veo-3.1-generate-preview') {
    return 'veo-3.1-generate-001';
  }
  if (lower.includes('omni')) {
    return 'gemini-omni-1.1-flash-preview';
  }

  // 4. Voice TTS models
  if (lower === 'gemini-3.1-flash-tts' || lower === 'gemini-3.1-flash-tts-preview') {
    return 'gemini-3.1-flash-tts-preview';
  }

  // Fallback: return trimmed lowercase string
  return lower;
}
