/** True when a URL is an allowed public http(s) target (no loopback, private, link-local, or metadata hosts). */
export function isSafeOutboundUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    let host = u.hostname.toLowerCase();
    if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
    if (!host || host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0') return false;
    if (host === '::1' || host.includes('metadata')) return false;
    if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.|::1)/.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}
