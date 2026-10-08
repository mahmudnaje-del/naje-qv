import { resolveEngineModel } from '../src/lib/modelEnvConfig.ts';
import {
  FALLBACK_DEFAULTS,
  FALLBACK_MODEL_DEFAULTS,
  SEED_ENDPOINTS,
} from '../src/lib/modelRegistry.ts';

function assertResolved(alias: string, modelId: unknown): string {
  if (typeof modelId !== 'string' || modelId.trim().length === 0) {
    throw new Error(`alias '${alias}' does not resolve to a non-empty model id`);
  }
  const resolved = resolveEngineModel(modelId);
  if (typeof resolved !== 'string' || resolved.trim().length === 0) {
    throw new Error(`alias '${alias}' (${modelId}) resolved to an empty model id`);
  }
  return resolved;
}

const seen = new Set<string>();

for (const [alias, modelId] of Object.entries(FALLBACK_DEFAULTS)) {
  assertResolved(`FALLBACK_DEFAULTS.${alias}`, modelId);
  seen.add(alias);
}

for (const [alias, modelId] of Object.entries(FALLBACK_MODEL_DEFAULTS)) {
  assertResolved(`FALLBACK_MODEL_DEFAULTS.${alias}`, modelId);
  seen.add(alias);
}

for (const endpoint of SEED_ENDPOINTS) {
  assertResolved(`SEED_ENDPOINTS.${endpoint.id}.modelId`, endpoint.modelId);
  if (endpoint.fallbackModelId != null) {
    assertResolved(`SEED_ENDPOINTS.${endpoint.id}.fallbackModelId`, endpoint.fallbackModelId);
  }
  seen.add(endpoint.id);
}

if (seen.size === 0) {
  throw new Error('no exported aliases found in the model registry');
}

console.log(`model registry ok (${seen.size} aliases)`);
