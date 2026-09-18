import JSZip from 'jszip';

export type WorkspaceFile = {
  path: string;
  language: string;
  content: string;
  bytes: number;
  truncated: boolean;
};

const SKIP_DIR = /(^|\/)(node_modules|\.git|dist|build|\.next|coverage|vendor|__pycache__|\.venv|venv|\.cache|\.turbo)(\/|$)/i;
const SKIP_FILE = /(\.(png|jpe?g|gif|webp|ico|woff2?|ttf|eot|mp4|mp3|mov|zip|gz|7z|pdf|psd|ai|exe|dll|so|dylib|lock)|package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/i;
const TEXT_EXT = /\.(html?|css|scss|less|js|mjs|cjs|jsx|ts|tsx|json|md|txt|svg|vue|svelte|py|php|rb|go|rs|java|kt|xml|ya?ml|sql|sh|env|toml|ini)$/i;

const MAX_FILES = 120;
const MAX_FILE_CHARS = 60_000;
const MAX_TOTAL_CHARS = 420_000;

export function languageOf(path: string): string {
  const ext = (path.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    html: 'xml', htm: 'xml', css: 'css', scss: 'scss', js: 'javascript', mjs: 'javascript',
    cjs: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', json: 'json',
    md: 'markdown', py: 'python', php: 'php', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
    xml: 'xml', yml: 'yaml', yaml: 'yaml', svg: 'xml', sql: 'sql', sh: 'bash', vue: 'xml'
  };
  return map[ext] || 'plaintext';
}

export async function unpackSiteZip(buffer: Buffer | ArrayBuffer | Uint8Array): Promise<{
  files: WorkspaceFile[];
  skipped: number;
  truncatedFiles: number;
}> {
  const zip = await JSZip.loadAsync(buffer);
  const files: WorkspaceFile[] = [];
  let skipped = 0;
  let truncatedFiles = 0;
  let totalChars = 0;

  const entries = Object.keys(zip.files).sort((a, b) => a.localeCompare(b));
  for (const name of entries) {
    const entry = zip.files[name];
    if (!entry || entry.dir) continue;
    const path = name.replace(/^\/+/, '').replace(/\\/g, '/');
    if (!path || SKIP_DIR.test(path) || SKIP_FILE.test(path) || !TEXT_EXT.test(path)) {
      skipped += 1;
      continue;
    }
    if (files.length >= MAX_FILES || totalChars >= MAX_TOTAL_CHARS) {
      skipped += 1;
      continue;
    }
    let text = await entry.async('string');
    if (!text) continue;
    // Drop obviously-binary payloads that slipped past the extension check
    if (text.includes('\u0000')) {
      skipped += 1;
      continue;
    }
    let truncated = false;
    if (text.length > MAX_FILE_CHARS) {
      text = text.slice(0, MAX_FILE_CHARS) + '\n\n/* … truncated … */';
      truncated = true;
      truncatedFiles += 1;
    }
    if (totalChars + text.length > MAX_TOTAL_CHARS) {
      const remain = MAX_TOTAL_CHARS - totalChars;
      if (remain < 200) {
        skipped += 1;
        continue;
      }
      text = text.slice(0, remain) + '\n\n/* … truncated … */';
      truncated = true;
      truncatedFiles += 1;
    }
    totalChars += text.length;
    files.push({ path, language: languageOf(path), content: text, bytes: text.length, truncated });
  }

  return { files, skipped, truncatedFiles };
}

export function buildFileTree(paths: string[]): string {
  return paths.map(p => `• ${p}`).join('\n');
}

export function buildCodeContext(files: WorkspaceFile[], focusPath?: string, budget = 90_000): string {
  const ordered = [...files].sort((a, b) => {
    if (focusPath && a.path === focusPath) return -1;
    if (focusPath && b.path === focusPath) return 1;
    const score = (p: string) => {
      const n = p.toLowerCase();
      if (/^index\.html$/.test(n) || n.endsWith('/index.html')) return 0;
      if (/package\.json$/.test(n)) return 1;
      if (/\.(tsx|jsx|ts|js)$/.test(n)) return 2;
      if (/\.(css|scss)$/.test(n)) return 3;
      return 4;
    };
    return score(a.path) - score(b.path);
  });
  let used = 0;
  const parts: string[] = [];
  for (const f of ordered) {
    const block = `--- FILE: ${f.path} ---\n${f.content}\n`;
    if (used + block.length > budget) {
      const remain = budget - used;
      if (remain > 400) parts.push(block.slice(0, remain) + '\n/* … */\n');
      break;
    }
    parts.push(block);
    used += block.length;
  }
  return parts.join('\n');
}
