// Entrypoint fallback wrapper for Cloud Run and Node buildpack environments
import fs from 'node:fs';
import path from 'node:path';

if (fs.existsSync(path.join(process.cwd(), 'dist', 'server.cjs'))) {
  await import('./dist/server.cjs');
} else if (fs.existsSync(path.join(process.cwd(), 'server.cjs'))) {
  await import('./server.cjs');
} else {
  await import('./server.ts');
}
