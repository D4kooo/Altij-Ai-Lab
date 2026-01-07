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
  createUser,
} from '../services/auth';
import { authMiddleware } from '../middleware/auth';

const authRoutes = new Hono<Env>();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// POST /api/auth/login
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await getUserByEmail(email);

  if (!user) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401);
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401);
  }

  await updateLastLogin(user.id);

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

// POST /api/auth/register (for initial setup, can be disabled later)
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const data = c.req.valid('json');

  const existingUser = await getUserByEmail(data.email);

  if (existingUser) {
    return c.json({ success: false, error: 'Email already registered' }, 400);
  }

  const user = await createUser(data);

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

// POST /api/auth/refresh
authRoutes.post('/refresh', zValidator('json', refreshSchema), async (c) => {
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
