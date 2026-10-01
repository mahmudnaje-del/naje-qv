import { STUDIO_CAPABILITIES, type StudioCapability } from './capabilities';

export type IntentConfidence = 'high' | 'medium' | 'low';

export interface IntentDecision {
  confidence: IntentConfidence;
  capability: StudioCapability | null;
  assumptionKey?: string;
  clarifyKey?: string;
}

export function routeIntent(text: string): IntentDecision {
  const raw = text.trim().toLowerCase();
  if (raw.length < 2) {
    return { confidence: 'low', capability: null, clarifyKey: 'omni.clarify' };
  }
  const hits = STUDIO_CAPABILITIES.filter((cap) => cap.keywords.some((word) => raw.includes(word.toLowerCase())));
  if (hits.length === 1) return { confidence: 'high', capability: hits[0] };
  if (hits.length > 1) {
    return { confidence: 'medium', capability: hits[0], assumptionKey: 'omni.assumption' };
  }
  if (/موقع|landing|كود|code/.test(raw)) {
    return { confidence: 'medium', capability: STUDIO_CAPABILITIES.find((cap) => cap.id === 'developer') || null, assumptionKey: 'omni.assumption' };
  }
  if (/بحث|لخّص|لخص|study|درس/.test(raw)) {
    return { confidence: 'medium', capability: STUDIO_CAPABILITIES.find((cap) => cap.id === 'source') || null, assumptionKey: 'omni.assumption' };
  }
  return { confidence: 'low', capability: null, clarifyKey: 'omni.clarify' };
}
