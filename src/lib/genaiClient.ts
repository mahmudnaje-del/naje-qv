import { GoogleGenAI } from '@google/genai';

const configProjectId = 'gen-lang-client-0549025293';

const getEnvVar = (name: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      const direct = process.env[name];
      if (direct) return String(direct);
      const vite = process.env[`VITE_${name}`];
      if (vite) return String(vite);
    }
  } catch {
    /* ignore */
  }
  return '';
};

const KEY_NAMES = ['GEMINI_API_KEY', 'api_gimine', 'api_gimine', 'API_GIMINE', 'API_GEMINI', 'VITE_GEMINI_API_KEY'];

function isUsableGeminiKey(value: string): boolean {
  const v = value.trim();
  if (v.length < 20) return false;
  if (/^(MY_|YOUR_|changeme|todo|placeholder)/i.test(v)) return false;
  return true;
}

/** AI Studio secret is named api_gimine. A real key always beats Vertex. */
export function resolveGeminiApiKey(): string {
  for (const name of KEY_NAMES) {
    const value = getEnvVar(name).trim();
    if (isUsableGeminiKey(value)) return value;
  }
  return '';
}

export const PROJECT_ID = getEnvVar('GOOGLE_CLOUD_PROJECT') || getEnvVar('GCP_PROJECT') || configProjectId;
export const VERTEX_LOCATION = getEnvVar('VERTEX_AI_LOCATION') || 'global';

export function shouldUseVertex(): boolean {
  if (resolveGeminiApiKey()) return false;
  return getEnvVar('NAJE_USE_VERTEX_AI') === 'true';
}

export const USE_VERTEX_AI = shouldUseVertex();

export function createGenAIClient(): GoogleGenAI {
  const apiKey = resolveGeminiApiKey();
  if (apiKey) {
    process.env.GEMINI_API_KEY = apiKey;
    return new GoogleGenAI({ apiKey });
  }
  if (getEnvVar('NAJE_USE_VERTEX_AI') === 'true') {
    return new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: getEnvVar('VERTEX_AI_LOCATION') || 'global',
    });
  }
  return new GoogleGenAI({ apiKey: '' });
}