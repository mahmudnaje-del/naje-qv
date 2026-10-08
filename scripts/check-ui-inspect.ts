import { inspectGeneratedUi } from '../src/lib/uiStudio.ts';

const dirty = `<!DOCTYPE html><html><head></head><body><a href="javascript:alert(1)">x</a> AIzaSyA1234567890123456789012</body></html>`;
const result = inspectGeneratedUi(dirty);
if (!result.issues.includes('secret')) throw new Error('secret not flagged');
if (!result.issues.includes('javascript-url')) throw new Error('javascript url not flagged');
if (!result.issues.includes('viewport')) throw new Error('viewport not flagged');
if (result.html.includes('AIza')) throw new Error('secret not stripped');
const clean = inspectGeneratedUi('<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"></head></html>');
if (clean.issues.length) throw new Error('clean page flagged: ' + clean.issues.join(','));
const handlers = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"></head><body><iframe src="data:text/html,<p>x</p>"></iframe><button onclick="alert(1)">go</button><script>const n = 1;</script></body></html>`;
const flagged = inspectGeneratedUi(handlers);
if (!flagged.issues.includes('data-text-html')) throw new Error('data:text/html not flagged');
if (!flagged.issues.includes('inline-handler')) throw new Error('onclick not flagged');
if (!flagged.html.includes('<script>const n = 1;</script>')) throw new Error('script stripped');
const scripted = inspectGeneratedUi('<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"><script>document.documentElement.dataset.ok="1"</script></head></html>');
if (scripted.issues.length) throw new Error('script page flagged: ' + scripted.issues.join(','));
if (!scripted.html.includes('<script>document.documentElement.dataset.ok="1"</script>')) throw new Error('clean script stripped');
console.log('ui inspect ok');