import { safeRelativePath } from '../src/lib/fullstackBuilder.ts';
import { inspectGeneratedUi } from '../src/lib/uiStudio.ts';
import { normalizeIdempotencyKey } from '../src/lib/agentIdempotency.ts';
import { getAgentToolCost } from '../src/lib/agentPricing.ts';
import { isSafeOutboundUrl } from '../src/lib/outboundUrl.ts';

if (safeRelativePath('../') !== null) throw new Error('../ must be null');
if (safeRelativePath('../../') !== null) throw new Error('../../ must be null');
if (safeRelativePath('../etc/passwd') !== null) throw new Error('../etc/passwd must be null');
if (safeRelativePath('foo/../../x') !== null) throw new Error('foo/../../x must be null');

const flagged = inspectGeneratedUi(
  '<a href="javascript:alert(1)">x</a><iframe src="data:text/html,<p>x</p>"></iframe><button onclick="alert(1)">go</button>'
);
if (!flagged.issues.includes('javascript-url')) throw new Error('javascript: not flagged');
if (!flagged.issues.includes('data-text-html')) throw new Error('data:text/html not flagged');
if (!flagged.issues.includes('inline-handler')) throw new Error('onclick not flagged');

if (normalizeIdempotencyKey('m1:s1:t1:3') !== '') throw new Error('key ending :3 must be empty');
if (normalizeIdempotencyKey('m1:s1:t1:1') !== 'm1:s1:t1:1') throw new Error('key ending :1 must be kept');

const imageCost = getAgentToolCost('image_studio', { count: -3 });
if (!(imageCost >= 0)) throw new Error(`image_studio count -3 cost must be >= 0, got ${imageCost}`);

if (isSafeOutboundUrl('http://169.254.169.254/') !== false) throw new Error('metadata host must be rejected');
if (isSafeOutboundUrl('https://example.com') !== true) throw new Error('https://example.com must be allowed');

console.log('security cases ok');
