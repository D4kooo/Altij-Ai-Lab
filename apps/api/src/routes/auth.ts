import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../types';
import {
  getUserByEmail,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  updateLastLogin,
} from '../services/auth';
import { authMiddleware } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimit';
import { logAuthEvent } from '../services/audit';

const authRoutes = new Hono<Env>();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// POST /api/auth/login (rate limited: 5 attempts per 15 min)
authRoutes.post('/login', authRateLimit, zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await getUserByEmail(email);

  if (!user) {
    // Log failed login attempt (user not found)
    await logAuthEvent(c, 'login_failed', null, { email, reason: 'user_not_found' });
    return c.json({ success: false, error: 'Invalid email or password' }, 401);
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    // Log failed login attempt (wrong password)
    await logAuthEvent(c, 'login_failed', user.id, { email, reason: 'invalid_password' });
    return c.json({ success: false, error: 'Invalid email or password' }, 401);
  }

  await updateLastLogin(user.id);

  // Log successful login
  await logAuthEvent(c, 'login', user.id, { email });

  const token = await generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      token,
      refreshToken,
    },
  });
});

// Registration désactivée - les utilisateurs sont créés manuellement par un admin
// Via POST /api/users (admin only)

// POST /api/auth/logout
authRoutes.post('/logout', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const refreshToken = body.refreshToken;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  return c.json({ success: true });
});

// GET /api/auth/me
authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');

  return c.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
  });
});

// POST /api/auth/refresh (rate limited)
authRoutes.post('/refresh', authRateLimit, zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');

  const user = await verifyRefreshToken(refreshToken);

  if (!user) {
    return c.json({ success: false, error: 'Invalid or expired refresh token' }, 401);
  }

  // Revoke the old refresh token
  await revokeRefreshToken(refreshToken);

  // Generate new tokens
  const newToken = await generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user.id);

  return c.json({
    success: true,
    data: {
      token: newToken,
      refreshToken: newRefreshToken,
    },
  });
});

export { authRoutes };
