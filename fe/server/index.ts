import './loadEnv.js';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth.js';

const port = Number(process.env.AUTH_SERVER_PORT ?? 3001);
const frontendOrigin = process.env.FRONTEND_URL ?? 'http://localhost:3000';

const app = new Hono();

app.use(
  '/api/auth/*',
  cors({
    origin: [frontendOrigin, 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'set-auth-jwt'],
    maxAge: 600,
    credentials: true,
  }),
);

app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.get('/healthz', (c) => c.json({ ok: true, service: 'bea-guru-auth' }));

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`Better Auth server listening on http://localhost:${port}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${port} sudah dipakai. Auth/register tidak akan jalan.\n` +
        `Jalankan dari root project: make stop && make run\n`,
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
