import { triggerSmartDownload } from '../stores/smartDownloadStore';

export function downloadBase64File(b64: string, filename: string, mimeType: string, options?: { prompt?: string; content?: string }) {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop() : 'bin';
  const baseFallback = parts.join('.');

  triggerSmartDownload({
    data: b64,
    mimeType,
    ext,
    fallbackName: baseFallback || 'ملف_ناجي',
    prompt: options?.prompt,
    content: options?.content,
  });
}

