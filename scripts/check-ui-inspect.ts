import { inspectGeneratedUi } from '../src/lib/uiStudio.ts';

const dirty = `<!DOCTYPE html><html><head></head><body><a href="javascript:alert(1)">x</a> AIzaSyA1234567890123456789012</body></html>`;
const result = inspectGeneratedUi(dirty);
if (!result.issues.includes('secret')) throw new Error('secret not flagged');
if (!result.issues.includes('javascript-url')) throw new Error('javascript url not flagged');
if (!result.issues.includes('viewport')) throw new Error('viewport not flagged');
if (result.html.includes('AIza')) throw new Error('secret not stripped');
const clean = inspectGeneratedUi('<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"></head></html>');
if (clean.issues.length) throw new Error('clean page flagged: ' + clean.issues.join(','));
console.log('ui inspect ok');
