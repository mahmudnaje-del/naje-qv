import JSZip from 'jszip';
import { unpackSiteZip } from '../src/lib/workspaceZip.ts';

const zip = new JSZip();
zip.file('index.html', '<!doctype html><title>ok</title>');
zip.file('../evil.txt', 'pwned');
zip.file('/etc/passwd', 'root:x:0:0:root:/root:/bin/sh');

const buffer = await zip.generateAsync({ type: 'nodebuffer' });
const { files } = await unpackSiteZip(buffer);
const paths = files.map((file) => file.path);

if (!paths.includes('index.html')) {
  throw new Error(`index.html must be kept, got: ${paths.join(', ') || '(none)'}`);
}
if (paths.some((path) => path === '../evil.txt' || path === 'evil.txt' || path.split('/').includes('..') || path.toLowerCase().includes('evil'))) {
  throw new Error(`traversal entry must be skipped, got: ${paths.join(', ')}`);
}
if (paths.some((path) => path === '/etc/passwd' || path === 'etc/passwd' || path.startsWith('/') || path.toLowerCase().includes('passwd'))) {
  throw new Error(`absolute path entry must be skipped, got: ${paths.join(', ')}`);
}
if (paths.length !== 1) {
  throw new Error(`expected only index.html, got: ${paths.join(', ')}`);
}

console.log('zip paths ok');
