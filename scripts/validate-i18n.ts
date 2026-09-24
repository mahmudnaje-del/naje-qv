import { DICTIONARIES, SUPPORTED_LOCALES, SupportedLocale } from '../src/i18n';
import { overlayParityGaps } from '../src/i18n/overlays';

function collectKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      keys = keys.concat(collectKeys(val, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

function extractInterpolationVars(str: string): string[] {
  const matches = str.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
  return matches.map(m => m.replace(/[\{\}]/g, '')).sort();
}

console.log('=== NAJE i18n Parity Validation ===');
console.log(`Checking ${SUPPORTED_LOCALES.length} supported locales:`, SUPPORTED_LOCALES);

const referenceLocale: SupportedLocale = 'ar';
const referenceDict = DICTIONARIES[referenceLocale];
const referenceKeys = collectKeys(referenceDict).sort();

console.log(`Reference (${referenceLocale}) has ${referenceKeys.length} translation keys.`);

let hasErrors = false;

for (const loc of SUPPORTED_LOCALES) {
  if (loc === referenceLocale) continue;
  const targetDict = DICTIONARIES[loc];
  const targetKeys = collectKeys(targetDict).sort();

  const missing = referenceKeys.filter(k => !targetKeys.includes(k));
  const extra = targetKeys.filter(k => !referenceKeys.includes(k));

  if (missing.length > 0) {
    console.error(`❌ [${loc}] Missing ${missing.length} keys:`, missing);
    hasErrors = true;
  }

  if (extra.length > 0) {
    console.warn(`⚠️ [${loc}] Has ${extra.length} extra keys:`, extra);
  }

  // Check variable parity
  for (const k of referenceKeys) {
    const refVal = k.split('.').reduce((o, i) => o?.[i], referenceDict as any);
    const tarVal = k.split('.').reduce((o, i) => o?.[i], targetDict as any);
    if (typeof refVal === 'string' && typeof tarVal === 'string') {
      const refVars = extractInterpolationVars(refVal);
      const tarVars = extractInterpolationVars(tarVal);
      if (refVars.join(',') !== tarVars.join(',')) {
        console.error(`❌ [${loc}] Variable mismatch for key "${k}": expected [${refVars}] but got [${tarVars}]`);
        hasErrors = true;
      }
    }
  }

  if (missing.length === 0 && !hasErrors) {
    console.log(`✓ [${loc}] Parity verified: 100% match with ${referenceLocale} (${targetKeys.length} keys).`);
  }
}

if (hasErrors) {
  console.error('\n❌ i18n parity check FAILED.');
  process.exit(1);
}

const overlayGaps = overlayParityGaps();
if (overlayGaps.length) {
  console.error(`\n❌ Overlay packs missing ${overlayGaps.length} translations.`);
  console.error(overlayGaps.slice(0, 40).join('\n'));
  process.exit(1);
}

console.log('\n🎉 ALL LOCALES PASSED PARITY CHECK WITH ZERO MISSING KEYS!');
