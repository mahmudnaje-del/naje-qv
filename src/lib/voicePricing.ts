export function countBillableVoiceChars(text: string): number {
  if (!text) return 0;
  return text.replace(/\s+/g, ' ').trim().length;
}

export function spokenTextFromVoiceScript(script: string): string {
  if (!script) return '';
  return script
    .split('\n')
    .map((line) => {
      const idx = line.indexOf(':');
      return idx >= 0 ? line.slice(idx + 1) : line;
    })
    .join(' ');
}

export function calcVoicePointsCost(opts: {
  text: string;
  tier?: 'core' | 'pro';
  pointsPerCharacter?: number;
  pointsPerCharacterPro?: number;
  minCost?: number;
}): { chars: number; perChar: number; cost: number } {
  const chars = countBillableVoiceChars(opts.text);
  const perChar = Number(
    opts.tier === 'pro'
      ? (opts.pointsPerCharacterPro ?? opts.pointsPerCharacter ?? 0.01)
      : (opts.pointsPerCharacter ?? 0.01)
  );
  const min = Number(opts.minCost ?? 0.1);
  const cost = chars <= 0 ? min : Math.max(min, parseFloat((chars * perChar).toFixed(4)));
  return { chars, perChar, cost };
}
