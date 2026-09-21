import { auth } from '../firebase';

export type NajeTextModel = 'lite' | 'core' | 'max';

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

export async function askNaje(
  prompt: string,
  opts?: { model?: NajeTextModel; history?: Array<{ role: string; content: string }> }
): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('يلزم تسجيل الدخول');
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      type: 'text',
      prompt,
      history: opts?.history || [],
      model: opts?.model || 'core',
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    try {
      const j = JSON.parse(raw);
      throw new Error(j.error || 'تعذر التواصل مع ناجي');
    } catch (e: any) {
      if (e?.message && !String(e.message).includes('JSON')) throw e;
      throw new Error(raw.slice(0, 180) || 'تعذر التواصل مع ناجي');
    }
  }
  const ctype = res.headers.get('content-type') || '';
  if (ctype.includes('event-stream') || raw.includes('data:')) {
    const acc = accumulateSse(raw);
    if (acc) return acc;
  }
  try {
    const j = JSON.parse(raw);
    return String(j.text || j.content || j.reply || j.output || raw);
  } catch {
    return raw;
  }
}
