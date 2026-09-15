/**
 * Smart Naming Engine Gateway (بوابة التسمية الذكية للملفات)
 * Automatically inspects content (HTML, Markdown, Prompts, Documents)
 * and generates clean, context-aware filenames in Arabic or English.
 */

import { toast } from '../toastStore';
import { getDoc } from '../lib/idb';

export interface SmartNamingOptions {
  content?: string;
  prompt?: string;
  title?: string;
  fallbackName?: string;
  ext?: string;
  mimeType?: string;
}

export interface DownloadRequest extends SmartNamingOptions {
  data: string | Blob; // base64 string, http url, or Blob
  suggestedName?: string;
  skipModal?: boolean;
}

/**
 * Sanitizes string for filesystem safe filenames
 */
export function sanitizeFilename(raw: string, maxLen = 60): string {
  if (!raw) return 'ملف_ناجي_الذكي';

  let clean = raw
    // Strip HTML tags if present
    .replace(/<[^>]*>/g, ' ')
    // Replace illegal filename characters
    .replace(/[\\/:\*\?"<>\|#%&\{\}\$\!'`=]/g, ' ')
    // Normalize spaces and underscores
    .replace(/[\s\t\n\r_]+/g, '_')
    .trim();

  // Remove leading/trailing underscores or dots
  clean = clean.replace(/^[_\.]+|[_\.]+$/g, '');

  if (!clean) return 'ملف_ناجي_الذكي';

  if (clean.length > maxLen) {
    clean = clean.substring(0, maxLen).replace(/_[^_]*$/, '');
  }

  return clean;
}

/**
 * Parses HTML content to find title, main header, or hero text
 */
export function extractTitleFromHtml(html: string): string | null {
  if (!html) return null;

  // 1. Check <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1].trim()) {
    const titleText = titleMatch[1].trim();
    if (!titleText.toLowerCase().includes('document') && titleText.length > 2) {
      return titleText;
    }
  }

  // 2. Check <h1>
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match && h1Match[1].trim()) {
    const h1Text = h1Match[1].replace(/<[^>]*>/g, '').trim();
    if (h1Text && h1Text.length > 2) {
      return h1Text;
    }
  }

  // 3. Check <h2> or hero heading
  const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2Match && h2Match[1].trim()) {
    const h2Text = h2Match[1].replace(/<[^>]*>/g, '').trim();
    if (h2Text && h2Text.length > 2) {
      return h2Text;
    }
  }

  // 4. Check for meta og:title or app name class
  const metaMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (metaMatch && metaMatch[1].trim()) {
    return metaMatch[1].trim();
  }

  return null;
}

/**
 * Extracts title from markdown text
 */
export function extractTitleFromMarkdown(text: string): string | null {
  if (!text) return null;
  const lines = text.split('\n');

  for (const line of lines) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('# ')) {
      return cleanLine.replace(/^#\s+/, '').trim();
    }
    if (cleanLine.startsWith('## ')) {
      return cleanLine.replace(/^##\s+/, '').trim();
    }
  }

  // Fallback to first non-empty line
  const firstLine = lines.find(l => l.trim().length > 3);
  if (firstLine) {
    return firstLine.trim();
  }

  return null;
}

/**
 * Main Smart Filename Generator
 */
export function generateSmartFilename(options: SmartNamingOptions): string {
  const ext = (options.ext || 'html').replace(/^\./, '');
  let baseName = '';

  // 1. If explicit title passed
  if (options.title && options.title.trim() && !options.title.toLowerCase().startsWith('naje_ui')) {
    baseName = options.title;
  }

  // 2. If content is HTML
  if (!baseName && options.content && (options.content.includes('<html') || options.content.includes('<!DOCTYPE') || ext === 'html')) {
    const extracted = extractTitleFromHtml(options.content);
    if (extracted) {
      baseName = extracted;
    }
  }

  // 3. If content is Markdown or Text
  if (!baseName && options.content && (ext === 'txt' || ext === 'pdf' || ext === 'md' || options.content.length > 10)) {
    const extracted = extractTitleFromMarkdown(options.content);
    if (extracted) {
      baseName = extracted;
    }
  }

  // 4. If prompt is provided (e.g. for generated images / documents)
  if (!baseName && options.prompt && options.prompt.trim()) {
    baseName = options.prompt;
  }

  // 5. Fallback name
  if (!baseName && options.fallbackName) {
    baseName = options.fallbackName;
  }

  if (!baseName) {
    baseName = `تطبيق_ناجي_الذكي_${new Date().toISOString().slice(0, 10)}`;
  }

  const cleanBase = sanitizeFilename(baseName);
  return `${cleanBase}.${ext}`;
}

/**
 * Converts a base64 or data-URL string into a binary Blob
 */
export function base64ToBlob(base64Data: string, defaultMime = 'application/octet-stream'): Blob {
  if (!base64Data) {
    return new Blob([], { type: defaultMime });
  }

  let clean = String(base64Data).trim();
  let mime = defaultMime;

  if (clean.startsWith('data:')) {
    const commaIndex = clean.indexOf(',');
    if (commaIndex !== -1) {
      const header = clean.slice(0, commaIndex);
      clean = clean.slice(commaIndex + 1);
      const mimeMatch = header.match(/^data:([^;]+);/);
      if (mimeMatch && mimeMatch[1]) {
        mime = mimeMatch[1];
      }
    }
  }

  // Handle URL encoding (%2B -> +, %2F -> /, %3D -> =)
  if (clean.includes('%')) {
    try {
      clean = decodeURIComponent(clean);
    } catch {
      // ignore
    }
  }

  // Remove whitespace, quotes, newlines
  clean = clean.replace(/[\s\r\n'"]/g, '');

  // Convert URL-safe base64 (- to +, _ to /)
  clean = clean.replace(/-/g, '+').replace(/_/g, '/');

  // Remove any non-base64 characters
  clean = clean.replace(/[^A-Za-z0-9+/=]/g, '');

  // Ensure length is multiple of 4
  const mod = clean.length % 4;
  if (mod > 0) {
    clean += '='.repeat(4 - mod);
  }

  try {
    const byteCharacters = atob(clean);
    const sliceSize = 1024 * 64;
    const byteArrays: Uint8Array[] = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays as BlobPart[], { type: mime });
  } catch (err) {
    console.error('base64ToBlob parsing error:', err, 'MIME:', mime);
    return new Blob([base64Data], { type: mime });
  }
}

/**
 * Triggers direct browser download with proper binary decoding
 */
export async function executeDirectDownload(data: string | Blob, filename: string, mimeType = 'text/html') {
  try {
    let url = '';
    let shouldRevoke = false;

    let payloadData = data;

    // 1. If payload is a local IDB reference string like "local:12345"
    if (typeof payloadData === 'string' && payloadData.startsWith('local:')) {
      const localId = payloadData.split('local:')[1];
      try {
        const idbData = await getDoc(localId);
        if (idbData) {
          payloadData = idbData;
        }
      } catch (e) {
        console.error('Failed to resolve local IDB doc in executeDirectDownload:', e);
      }
    }

    if (payloadData instanceof Blob) {
      url = URL.createObjectURL(payloadData);
      shouldRevoke = true;
    } else if (typeof payloadData === 'string') {
      const trimmed = payloadData.trim();

      // 2. HTTP/HTTPS URLs
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
          const res = await fetch(trimmed);
          const contentType = res.headers.get('content-type') || '';
          if (!res.ok || contentType.includes('xml') || contentType.includes('html')) {
            console.warn('URL fetch returned non-binary response, falling back to direct link:', res.status);
            const link = document.createElement('a');
            link.href = trimmed;
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
          }
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
          return;
        } catch {
          const link = document.createElement('a');
          link.href = trimmed;
          link.download = filename;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
      }

      // 3. Base64 or Data URLs
      const isDataUrl = trimmed.startsWith('data:');
      const isBinaryMime = /pdf|presentation|wordprocessing|officedocument|zip|octet-stream|image|audio|video/i.test(mimeType || '');
      const looksLikeBase64 = isDataUrl || isBinaryMime || (
        !trimmed.startsWith('<') &&
        !trimmed.startsWith('{') &&
        !trimmed.startsWith('[') &&
        !trimmed.startsWith('#') &&
        trimmed.length > 30 &&
        /^[A-Za-z0-9+/=\s\r\n\-_]+$/.test(trimmed)
      );

      if (looksLikeBase64) {
        const blob = base64ToBlob(trimmed, mimeType);
        
        // FIX 8c: Verify the downloaded blob isn't HTML/JSON error text
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const isOffice = ['docx', 'pptx', 'xlsx'].includes(ext);
        const isPdf = ext === 'pdf';
        const isWav = ext === 'wav';
        
        if (isOffice || isPdf || isWav) {
          try {
            const buf = await blob.arrayBuffer();
            const view = new Uint8Array(buf);
            let valid = true;
            if (view.length < 4) valid = false;
            else if (isOffice) {
              // PK
              if (view[0] !== 0x50 || view[1] !== 0x4B) valid = false;
            } else if (isPdf) {
              // %PDF
              if (view[0] !== 0x25 || view[1] !== 0x50 || view[2] !== 0x44 || view[3] !== 0x46) valid = false;
            } else if (isWav) {
              // RIFF
              if (view[0] !== 0x52 || view[1] !== 0x49 || view[2] !== 0x46 || view[3] !== 0x46) valid = false;
            }
            if (!valid) {
              toast.error('الملف الناتج تالف، حاول مرة أخرى');
              return;
            }
          } catch (e) {
            console.error('Blob verification failed', e);
          }
        }
        
        url = URL.createObjectURL(blob);
        shouldRevoke = true;
      } else {
        // Plain text content (e.g. raw HTML source, markdown, text, csv)
        const blob = new Blob([trimmed], { type: mimeType || 'text/plain;charset=utf-8' });
        url = URL.createObjectURL(blob);
        shouldRevoke = true;
      }
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (shouldRevoke) {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  } catch (err) {
    console.error('executeDirectDownload error:', err);
  }
}
