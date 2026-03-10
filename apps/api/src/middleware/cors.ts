import { cors } from 'hono/cors';

const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  // SECURITY: Only allow localhost origins in development
  ...(isProduction ? [] : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']),
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
