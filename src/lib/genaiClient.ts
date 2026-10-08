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

export const PROJECT_ID = getEnvVar('GOOGLE_CLOUD_PROJECT') || getEnvVar('GCP_PROJECT') || configProjectId;
export const USE_VERTEX_AI = getEnvVar('NAJE_USE_VERTEX_AI') === 'true';
export const VERTEX_LOCATION = getEnvVar('VERTEX_AI_LOCATION') || 'global';

export function createGenAIClient(): GoogleGenAI {
  if (USE_VERTEX_AI) {
    return new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: VERTEX_LOCATION,
    });
  }
  const apiKey = getEnvVar('GEMINI_API_KEY') || getEnvVar('VITE_GEMINI_API_KEY') || '';
  return new GoogleGenAI({ apiKey });
}
