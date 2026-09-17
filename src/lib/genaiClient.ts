import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

let configProjectId = "gen-lang-client-0549025293";
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const configRaw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(configRaw);
    if (parsed.projectId) configProjectId = parsed.projectId;
  }
} catch (e) {
  // quiet fallback
}

export const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || configProjectId;
export const USE_VERTEX_AI = process.env.NAJE_USE_VERTEX_AI === 'true';
export const VERTEX_LOCATION = process.env.VERTEX_AI_LOCATION || 'global';

export function createGenAIClient(): GoogleGenAI {
  if (USE_VERTEX_AI) {
    return new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: VERTEX_LOCATION,
    });
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '' });
}
