import { isSafeOutboundUrl } from '../src/lib/outboundUrl.ts';

if (!isSafeOutboundUrl('https://example.com')) throw new Error('https://example.com should be allowed');
if (isSafeOutboundUrl('http://169.254.169.254/')) throw new Error('http://169.254.169.254/ should be rejected');
if (isSafeOutboundUrl('http://127.0.0.1/')) throw new Error('http://127.0.0.1/ should be rejected');
if (isSafeOutboundUrl('file:///etc/passwd')) throw new Error('file:///etc/passwd should be rejected');

console.log('outbound url ok');
