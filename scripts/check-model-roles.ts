import { readFileSync } from 'node:fs';
import { getNajeModel, type NajeModelRole } from '../src/lib/modelEnvConfig.ts';

const source = readFileSync(new URL('../src/lib/modelEnvConfig.ts', import.meta.url), 'utf8');
const roleBlock = source.match(/export type NajeModelRole =\s*([\s\S]*?);/);
if (!roleBlock) throw new Error('NajeModelRole union not found in modelEnvConfig.ts');

const declared = [...roleBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
const required = ['core', 'lite', 'pro'] as const;
for (const role of required) {
  if (!declared.includes(role)) throw new Error(`NajeModelRole is missing '${role}'`);
  const model = getNajeModel(role);
  if (typeof model !== 'string' || model.trim().length === 0) {
    throw new Error(`getNajeModel('${role}') must return a non-empty string`);
  }
}

const invalid = 'not-a-role';
let invalidCastCalled = false;
if (declared.includes(invalid)) {
  invalidCastCalled = true;
  getNajeModel(invalid as NajeModelRole);
}
if (invalidCastCalled) throw new Error('invalid cast was called');

console.log(`model roles ok (${required.join(', ')})`);
