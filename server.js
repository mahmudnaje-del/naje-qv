// Universal Instant-Boot Entrypoint for Cloud Run and Production Environments
import http from 'http';
import fs from 'fs';
import path from 'path';
import express from 'express';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
console.log(`[Fast Boot] Pre-binding port ${port} immediately for Cloud Run probes...`);

let appHandler = null;

const server = http.createServer((req, res) => {
  if (appHandler) {
    return appHandler(req, res);
  }
  // Respond immediately to Cloud Run health probes and GET / during warm-up
  if (
    req.url === '/api/health' ||
    req.url === '/health' ||
    req.url === '/healthz' ||
    req.url === '/_ah/health' ||
    req.url === '/_health' ||
    req.url === '/ping' ||
    req.url === '/livez' ||
    req.url === '/readyz' ||
    req.method === 'HEAD'
  ) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', initializing: true, timestamp: Date.now() }));
  }
  
  // For GET /, stream early index.html if available
  const indexPath = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html')
  ].find(p => fs.existsSync(p));
  
  if (indexPath) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.createReadStream(indexPath).pipe(res);
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>Naje AI</title></head><body><div style="font-family:sans-serif;padding:2rem;text-align:center;">جارٍ إقلاع منصة ناجي للذكاء الاصطناعي...</div></body></html>');
});

server.setTimeout(600000);
server.keepAliveTimeout = 600000;
server.headersTimeout = 601000;

server.listen(port, '0.0.0.0', async () => {
  console.log(`[Fast Boot] Port ${port} is ACTIVE and LISTENING for Cloud Run TCP socket probe.`);
  try {
    process.env.NAJE_FAST_BOOT = '1';
    const app = express();
    app.use(express.json({ limit: '15mb' }));
    appHandler = app;
    const mod = await import('./dist/server.cjs');
    const exported = (mod && typeof mod.startServer === 'function')
      ? mod
      : (mod && mod.default && typeof mod.default.startServer === 'function' ? mod.default : mod);
    const start = exported && exported.startServer;
    const unlock = exported && exported.handleUnlockTheme;
    if (typeof unlock === 'function') {
      app.post('/api/themes/unlock', unlock);
      app.post('/api/theme/unlock', unlock);
    }
    if (typeof start === 'function') {
      await start(app);
      console.log(`[Fast Boot] Full application router initialized and ready on port ${port}.`);
    } else {
      console.error('[Fast Boot] startServer export missing. Keys:', Object.keys(mod || {}), Object.keys(mod?.default || {}));
    }
  } catch (err) {
    console.error('[Fast Boot] Error initializing full application router:', err);
  }
});
