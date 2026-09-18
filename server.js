// Fast boot: bind health ports in milliseconds, then load the real server.
// Studio's probe fails after 10s if ffmpeg/Vite/tsx compile block listen().
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import express from 'express';

const app = express();
app.get(['/api/health', '/health', '/healthz', '/_ah/health', '/_health', '/ping', '/livez', '/readyz'], (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

function bindPort(port, role) {
  const srv = http.createServer(app);
  srv.setTimeout(600000);
  srv.keepAliveTimeout = 600000;
  srv.headersTimeout = 601000;
  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Port Notice] ${role} port ${port} already bound or in use by proxy.`);
    } else {
      console.error(`[Port Error] ${role} listener error on ${port}:`, err?.message || err);
    }
  });
  srv.listen(port, '0.0.0.0', () => {
    console.log(`[Boot] ${role} active on http://0.0.0.0:${port}`);
  });
  return srv;
}

const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const ingressPort = (envPort && !isNaN(envPort)) ? envPort : 8080;
bindPort(ingressPort, 'Cloud Run Ingress');
if (ingressPort !== 3000) bindPort(3000, 'App Port (3000)');

async function loadAppModule() {
  const forceCjs = process.env.NAJE_USE_CJS === '1';
  const tsxAlreadyOn = process.execArgv.some((a) => String(a).includes('tsx'));
  if (!forceCjs && tsxAlreadyOn) {
    // Computed specifier so tsx cannot pre-bundle server.ts before we listen.
    const tsEntry = './server.' + 'ts';
    return await import(tsEntry);
  }
  if (fs.existsSync(path.join(process.cwd(), 'dist', 'server.cjs'))) {
    return await import('./dist/server.cjs');
  }
  if (fs.existsSync(path.join(process.cwd(), 'server.cjs'))) {
    return await import('./server.cjs');
  }
  const tsEntry = './server.' + 'ts';
  return await import(tsEntry);
}

let mod;
try {
  mod = await loadAppModule();
} catch (err) {
  console.error('[Boot] failed to load application module:', err);
  throw err;
}

const start = mod.startServer || mod.default?.startServer;
if (typeof start === 'function') {
  await start(app);
} else {
  console.error('[Boot] startServer export missing; health ports are up but API routes were not attached');
}
