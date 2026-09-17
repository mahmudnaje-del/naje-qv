import { GoogleGenAI } from '@google/genai';

const configProjectId = 'gen-lang-client-0549025293';

const getEnvVar = (name: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name] as string;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[name] || (import.meta as any).env[`VITE_${name}`] || '';
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


