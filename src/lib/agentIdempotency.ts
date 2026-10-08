import { createHash } from 'crypto';

/** Stable Firestore id for one user + one execution key. */
export function agentExecutionDocId(uid: string, key: string): string {
  return createHash('sha256').update(`${uid}\n${key}`).digest('hex').slice(0, 48);
}

/** Accept only short keys the client builds from mission, step, and tool ids.
 *  A trailing numeric attempt may be :1 or :2. :3 and higher are rejected so a
 *  client cannot mint unlimited repair executions. */
export function normalizeIdempotencyKey(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s || s.length > 300) return '';
  if (!/^[\w:.-]+$/.test(s)) return '';
  const attempt = s.match(/:(\d+)$/);
  if (attempt && Number(attempt[1]) > 2) return '';
  return s;
}

export function compactExecutionResult(body: Record<string, unknown>): Record<string, unknown> {
  const raw = JSON.stringify(body);
  if (raw.length > 400_000) {
    const audit = body.audit as { passed?: boolean; feedback?: string } | undefined;
    return {
      overflow: true,
      duplicate: true,
      success: true,
      pointsDeducted: 0,
      audit: audit ? { passed: !!audit.passed, feedback: String(audit.feedback || '').slice(0, 500) } : null,
    };
  }
  return { ...body, duplicate: true, pointsDeducted: 0 };
}
