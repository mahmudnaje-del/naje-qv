/**
 * Offline checklist for the 10-locale NAJE surface.
 * Run after `npm run lint` in the app repo:
 *   npx tsx scripts/validate-i18n.ts
 */
import { SUPPORTED_LOCALES, DICTIONARIES, LOCALES_META } from '../src/i18n';
import { OVERLAY_PACKS, overlayParityGaps } from '../src/i18n/overlays';
import { ALL_OVERLAY_LOCALES } from '../src/i18n/overlays/types';

const SCHEMA_SECTIONS = [
  'common', 'nav', 'auth', 'chat', 'projects', 'favorites', 'settings',
  'store', 'onboarding', 'termsModal', 'najeModules', 'studio',
] as const;

function main() {
  const lines: string[] = [];
  lines.push(`locales: ${SUPPORTED_LOCALES.join(', ')}`);
  lines.push(`overlay locales: ${ALL_OVERLAY_LOCALES.join(', ')}`);
  lines.push(`overlay packs: ${OVERLAY_PACKS.length}`);

  for (const loc of SUPPORTED_LOCALES) {
    const dict = DICTIONARIES[loc];
    const meta = LOCALES_META[loc];
    if (!dict) throw new Error(`missing dictionary ${loc}`);
    if (!meta) throw new Error(`missing meta ${loc}`);
    const missingSections = SCHEMA_SECTIONS.filter((s) => !dict[s] || typeof dict[s] !== 'object');
    if (missingSections.length) {
      throw new Error(`${loc} missing schema sections: ${missingSections.join(', ')}`);
    }
    lines.push(`ok dict ${loc} (${meta.nativeName})`);
  }

  const gaps = overlayParityGaps();
  lines.push(`overlayParityGaps after completePack: ${gaps.length}`);
  if (gaps.length) {
    lines.push(gaps.slice(0, 40).join('\n'));
  }

  console.log(lines.join('\n'));
}

main();
