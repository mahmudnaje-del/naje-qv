import { safeRelativePath } from '../src/lib/fullstackBuilder.ts';

const kept = safeRelativePath('src/App.tsx');
if (kept !== 'src/App.tsx') throw new Error('src/App.tsx must be kept');
if (safeRelativePath('../etc/passwd') !== null) throw new Error('../etc/passwd must be null');
if (safeRelativePath('C:/Windows') !== null) throw new Error('C:/Windows must be null');
if (safeRelativePath('has\0nul') !== null) throw new Error('NUL path must be null');
if (safeRelativePath('foo/../../x') !== null) throw new Error('foo/../../x must be null');
console.log('safe paths ok');
