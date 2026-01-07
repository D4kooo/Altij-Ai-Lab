import { createMiddleware } from 'hono/factory';
import type { Env } from '../types';
import { verifyAccessToken, getUserById } from '../services/auth';

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyAccessToken(token);

  if (!payload) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  const user = await getUserById(payload.sub);

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 401);
  }

  c.set('user', user);
  await next();
});

export const adminMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');

  if (!user || user.role !== 'admin') {
    return c.json({ success: false, error: 'Forbidden: Admin access required' }, 403);
  }

  await next();
});
