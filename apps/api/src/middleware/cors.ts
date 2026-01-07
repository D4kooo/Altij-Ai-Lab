import { cors } from 'hono/cors';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.APP_URL,
].filter(Boolean) as string[];

export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin) return allowedOrigins[0];
    if (allowedOrigins.includes(origin)) return origin;
    return allowedOrigins[0];
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
});
