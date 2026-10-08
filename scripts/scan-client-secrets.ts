/**
 * Fail if client source embeds a real-looking Google API key or an OpenAI
 * sk- key assigned as a string literal. Placeholders, env reads, and this
 * file are ignored. Findings are file:line only — never the key text.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(root, 'src');
const selfPath = fileURLToPath(import.meta.url);

const ENV_READ = /\b(?:process\.env|import\.meta\.env|Deno\.env(?:\.get)?|getEnvVar\s*\(|getenv\s*\(|os\.environ)\b/;
const GOOGLE_KEY = /AIza[0-9A-Za-z_-]{30,}/g;
const OPENAI_ASSIGNED = /(?:=|:|,|\[|\()\s*(?:Bearer\s+)?(['"`])(sk-[A-Za-z0-9_-]{20,})\1/g;

function isPlaceholder(secret: string): boolean {
  if (/placeholder|example|dummy|fake|sample|changeme|redacted|your[_-]?key|your[_-]?api|insert|xxxx+|\.{3,}/i.test(secret)) {
    return true;
  }
  const body = secret.replace(/^AIza/, '').replace(/^sk-(?:proj-|live-|admin-|svcacct-)?/, '');
  if (body.length >= 8 && new Set(body).size <= 3) return true;
  if (/^(?:1234567890)+$/i.test(body)) return true;
  return false;
}

function lineMarksPlaceholder(line: string): boolean {
  return /\b(?:placeholder|dummy key|fake key|example key|changeme|not a real|your api key|your-api-key|insert key)\b/i.test(line);
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function isBinary(buf: Buffer): boolean {
  const n = Math.min(buf.length, 8000);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

function findingsInLine(line: string): boolean {
  if (lineMarksPlaceholder(line)) return false;

  const google = [...line.matchAll(GOOGLE_KEY)].map((match) => match[0]).filter((key) => !isPlaceholder(key));
  const openai = [...line.matchAll(OPENAI_ASSIGNED)].map((match) => match[2]).filter((key) => !isPlaceholder(key));
  if (google.length === 0 && openai.length === 0) return false;

  if (ENV_READ.test(line)) {
    const withoutEnv = line
      .replace(/\bprocess\.env(?:\.[A-Za-z_][A-Za-z0-9_]*)?/g, '')
      .replace(/\bimport\.meta\.env(?:\.[A-Za-z_][A-Za-z0-9_]*)?/g, '')
      .replace(/\bDeno\.env(?:\.get)?\s*\([^)]*\)/g, '')
      .replace(/\bgetEnvVar\s*\([^)]*\)/g, '')
      .replace(/\bgetenv\s*\([^)]*\)/g, '')
      .replace(/\bos\.environ(?:\.[A-Za-z_][A-Za-z0-9_]*)?/g, '');
    const googleLeft = [...withoutEnv.matchAll(GOOGLE_KEY)].some((match) => !isPlaceholder(match[0]));
    const openaiLeft = [...withoutEnv.matchAll(OPENAI_ASSIGNED)].some((match) => !isPlaceholder(match[2]));
    return googleLeft || openaiLeft;
  }

  return true;
}

const hits: string[] = [];
for (const file of walk(srcDir)) {
  if (resolve(file) === resolve(selfPath) || file.endsWith(`${join('scripts', 'scan-client-secrets.ts')}`)) continue;
  const buf = readFileSync(file);
  if (isBinary(buf)) continue;
  const lines = buf.toString('utf8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!findingsInLine(lines[i])) continue;
    hits.push(`${relative(root, file)}:${i + 1}`);
  }
}

if (hits.length) {
  console.error(hits.join('\n'));
  process.exit(1);
}

console.log('client secrets ok');
