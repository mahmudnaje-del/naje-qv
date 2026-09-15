import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { pcmToWav, parseSampleRateFromMimeType } from '../src/lib/audioContainer';

const VOICES = [
  'Kore', 'Puck', 'Charon', 'Zephyr', 'Aoede', 'Fenrir', 'Leda', 'Orus',
  'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba',
  'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar',
  'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi',
  'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat'
];

const SAMPLE_TEXT = 'مرحباً، أنا صوتك في ناجي — جاهز أحوّل نصك لتسجيل احترافي.';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateSamples() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[FATAL] GEMINI_API_KEY environment variable is required to generate voice samples.');
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), 'public', 'voice-samples');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`Generating real WAV voice samples for ${VOICES.length} voices in ${outDir}...`);

  const ai = new GoogleGenAI({ apiKey });

  for (let i = 0; i < VOICES.length; i++) {
    const voice = VOICES[i];
    const outFile = path.join(outDir, `${voice.toLowerCase()}.wav`);

    if (fs.existsSync(outFile) && fs.statSync(outFile).size > 1000) {
      console.log(`[SKIP] Sample already exists for ${voice} (${fs.statSync(outFile).size} bytes)`);
      continue;
    }

    console.log(`[${i + 1}/${VOICES.length}] Generating sample for voice: ${voice}...`);

    let attempts = 0;
    let success = false;

    while (attempts < 3 && !success) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: `Say in audio: ${SAMPLE_TEXT}`,
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice }
              }
            }
          } as any
        });

        const candidate = response.candidates?.[0];
        const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData && (p.inlineData.mimeType?.startsWith('audio/') || p.inlineData.data));

        if (audioPart && audioPart.inlineData?.data) {
          const rawPcm = Buffer.from(audioPart.inlineData.data, 'base64');
          const sampleRate = parseSampleRateFromMimeType(audioPart.inlineData.mimeType, 24000);
          const wavBuffer = pcmToWav(rawPcm, sampleRate);
          fs.writeFileSync(outFile, wavBuffer);
          console.log(`[SUCCESS] Generated real WAV sample for ${voice} (${wavBuffer.length} bytes, rate: ${sampleRate}Hz)`);
          success = true;
        } else {
          console.error(`[WARN] No audio returned for voice "${voice}" on attempt ${attempts}`);
        }
      } catch (err: any) {
        console.warn(`[WARN] Attempt ${attempts} failed for voice "${voice}": ${err.message || err}`);
        if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
          console.log(`Rate limit hit, waiting 10 seconds before retry...`);
          await sleep(10000);
        }
      }
    }

    if (!success) {
      console.error(`[FATAL] Failed to generate sample for voice "${voice}" after 3 attempts. Aborting.`);
      process.exit(1);
    }

    // Pause 6.5s between requests to stay safely under 10 RPM rate limit
    await sleep(6500);
  }

  console.log(`[COMPLETED] Successfully generated all ${VOICES.length} voice samples.`);
}

generateSamples().catch(err => {
  console.error('[FATAL] Script error:', err);
  process.exit(1);
});
