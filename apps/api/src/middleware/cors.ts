import { cors } from 'hono/cors';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  ...(process.env.ALLOWED_ORIGINS?.split(',').map(u => u.trim()) || []),
].filter(Boolean) as string[];

export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin) return allowedOrigins[0];
    if (allowedOrigins.includes(origin)) return origin;
    return null as unknown as string;
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
});
