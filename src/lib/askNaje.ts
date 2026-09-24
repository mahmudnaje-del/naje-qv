import { auth } from '../firebase';
import { readNajeSse } from './sseRead';

export type NajeTextModel = 'lite' | 'core' | 'max';

export type AskNajeFile = {
  data: string;
  mimeType: string;
  name?: string;
};

export function parseModelJson(raw: string): any | null {
  const t = String(raw || '').trim();
  if (!t) return null;
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1] : t;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function accumulateSse(raw: string): string {
  let acc = '';
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.replace(/^data:\s?/, '').trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const j = JSON.parse(payload);
      if (j?.error) throw new Error(String(j.error));
      if (typeof j.replaceContent === 'string') acc = j.replaceContent;
      else if (typeof j.text === 'string') acc += j.text;
      else if (typeof j.content === 'string') acc += j.content;
    } catch (e: any) {
      if (e instanceof SyntaxError) {
        acc += payload;
        continue;
      }
      throw e;
    }
  }
  return acc.trim();
}

function isAbortError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === 'object' && (err as { name?: string }).name === 'AbortError') return true;
  return /aborted|AbortError|The user aborted/i.test(err instanceof Error ? err.message : String(err));
}

function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  return /failed to fetch|network|offline|timeout|Load failed|NetworkError/i.test(msg);
}

function applyChunk(
  acc: string,
  j: { replaceContent?: string; text?: string; content?: string },
): string {
  if (typeof j.replaceContent === 'string') return j.replaceContent;
  if (typeof j.text === 'string') return acc + j.text;
  if (typeof j.content === 'string') return acc + j.content;
  return acc;
}

async function parseGenerateResponse(
  res: Response,
  rawFallback: string | null,
  onChunk?: (text: string) => void,
): Promise<string> {
  const ctype = res.headers.get('content-type') || '';
  if (res.body && (ctype.includes('event-stream') || ctype.includes('text/event-stream'))) {
    let acc = '';
    await readNajeSse(res, (j) => {
      acc = applyChunk(acc, j || {});
      if (acc) onChunk?.(acc);
    });
    return acc.trim();
  }
  const raw = rawFallback != null ? rawFallback : await res.text();
  if (ctype.includes('event-stream') || raw.includes('data:')) {
    const acc = accumulateSse(raw);
    if (acc) {
      onChunk?.(acc);
      return acc;
    }
  }
  try {
    const j = JSON.parse(raw);
    const text = String(j.text || j.content || j.reply || j.output || raw);
    onChunk?.(text);
    return text;
  } catch {
    onChunk?.(raw);
    return raw;
  }
}

export async function askNaje(
  prompt: string,
  opts?: {
    model?: NajeTextModel;
    history?: Array<{ role: string; content: string }>;
    files?: AskNajeFile[];
    signal?: AbortSignal;
    onChunk?: (text: string) => void;
  },
): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('يلزم تسجيل الدخول');
  if (opts?.signal?.aborted) throw new Error('تم الإيقاف');

  const files = (opts?.files || [])
    .filter((f) => f && f.data && f.mimeType)
    .map((f) => ({
      data: f.data,
      mimeType: f.mimeType,
    }));

  let accepted = false;
  const invoke = async (): Promise<string> => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type: 'text',
        prompt,
        history: opts?.history || [],
        model: opts?.model || 'core',
        ...(files.length ? { files } : {}),
      }),
      signal: opts?.signal,
    });
    accepted = true;

    if (!res.ok) {
      const raw = await res.text();
      try {
        const j = JSON.parse(raw);
        throw new Error(j.error || 'تعذر التواصل مع ناجي');
      } catch (e: any) {
        if (e?.message && !String(e.message).includes('JSON')) throw e;
        throw new Error(raw.slice(0, 180) || 'تعذر التواصل مع ناجي');
      }
    }

    const ctype = res.headers.get('content-type') || '';
    const canStream = Boolean(res.body) && (ctype.includes('event-stream') || ctype.includes('text/event-stream'));
    return parseGenerateResponse(res, canStream ? null : await res.text(), opts?.onChunk);
  };

  try {
    return await invoke();
  } catch (err) {
    if (isAbortError(err) || opts?.signal?.aborted) throw new Error('تم الإيقاف');
    if (!accepted && isNetworkError(err)) {
      try {
        return await invoke();
      } catch (retryErr) {
        if (isAbortError(retryErr) || opts?.signal?.aborted) throw new Error('تم الإيقاف');
        throw retryErr;
      }
    }
    throw err;
  }
}
