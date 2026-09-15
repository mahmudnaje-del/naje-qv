/**
 * Wraps raw PCM audio bytes in a valid WAV (RIFF) container.
 * Gemini TTS returns raw 16-bit signed PCM, mono, at the sample rate
 * indicated in inlineData.mimeType (e.g., "audio/l16; rate=24000; channels=1").
 */
export function pcmToWav(
  pcmData: Buffer,
  sampleRate: number,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);               // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20);                // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

export function parseSampleRateFromMimeType(
  mimeType: string | undefined,
  fallback = 24000
): number {
  if (!mimeType) return fallback;
  const match = mimeType.match(/rate=(\d+)/i);
  return match ? parseInt(match[1], 10) : fallback;
}
