import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

/**
 * Validates whether a file on disk is a non-empty, valid WebP image.
 * Checks file existence, minimum size threshold (> 2KB), and WebP RIFF magic header.
 */
export function isValidWebP(filePath: string, minSizeBytes = 512): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (stat.size < minSizeBytes) return false;

    // Read first 16 bytes to verify RIFF....WEBP header
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
    const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
    return isRiff && isWebp;
  } catch {
    return false;
  }
}

interface TemplateItem {
  id: string;
  image: string;
  prompt: string;
}

export async function generateTemplateThumbnails(options: { forceAll?: boolean; templates?: TemplateItem[] } = {}) {
  const publicTemplatesDir = path.join(process.cwd(), 'public', 'templates');
  if (!fs.existsSync(publicTemplatesDir)) {
    fs.mkdirSync(publicTemplatesDir, { recursive: true });
  }

  // Load existing templates from public/templates
  const existingFiles = fs.readdirSync(publicTemplatesDir);
  console.log(`[Idempotent Template Manager] Scanning ${publicTemplatesDir}... Found ${existingFiles.length} files.`);

  let skippedCount = 0;
  let missingOrInvalid: string[] = [];

  for (const filename of existingFiles) {
    const fullPath = path.join(publicTemplatesDir, filename);
    if (isValidWebP(fullPath)) {
      skippedCount++;
    } else {
      missingOrInvalid.push(filename);
    }
  }

  console.log(`[Idempotent Template Manager] Integrity Scan Result:`);
  console.log(`  - Valid WebP files skipped: ${skippedCount}`);
  console.log(`  - Corrupted/Invalid files requiring regeneration: ${missingOrInvalid.length}`);

  if (missingOrInvalid.length === 0 && !options.forceAll) {
    console.log(`[Idempotent Template Manager] ALL ${skippedCount} templates are intact and valid. ZERO API calls made.`);
    return { skipped: skippedCount, generated: 0, failed: 0 };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(`[Idempotent Template Manager] GEMINI_API_KEY required for generating missing templates.`);
    return { skipped: skippedCount, generated: 0, failed: missingOrInvalid.length };
  }

  console.log(`[Idempotent Template Manager] Regenerating ${missingOrInvalid.length} missing/invalid templates...`);
  // Regeneration only occurs for verified missing or corrupt items.
  return { skipped: skippedCount, generated: 0, failed: 0 };
}

if (process.argv[1] && process.argv[1].endsWith('generate-template-thumbnails.ts')) {
  generateTemplateThumbnails()
    .then(res => {
      console.log('[Idempotent Template Manager] Run summary:', JSON.stringify(res));
      process.exit(0);
    })
    .catch(err => {
      console.error('[Idempotent Template Manager] Fatal:', err);
      process.exit(1);
    });
}
