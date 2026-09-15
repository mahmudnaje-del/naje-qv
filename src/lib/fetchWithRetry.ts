/**
 * Executes a fetch request with automatic retries for transient network disconnects
 * or server reboot events (e.g. TypeError: Failed to fetch, 502/503/504 Bad Gateway).
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  initialDelayMs: number = 600
): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, options);
      // If server is temporarily restarting or starting up behind proxy (502, 503, 504)
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxRetries) {
        attempt++;
        const delay = initialDelayMs * Math.pow(1.7, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError' || err?.message?.includes('aborted');
      if (isAbort) {
        throw err;
      }
      const isNetworkError =
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('network') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('Load failed');

      if (isNetworkError && attempt < maxRetries) {
        attempt++;
        const delay = initialDelayMs * Math.pow(1.7, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}
