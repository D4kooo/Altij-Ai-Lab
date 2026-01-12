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
import { authRateLimit, sensitiveRateLimit } from '../middleware/rateLimit';
import { logAuthEvent, logUserEvent } from '../services/audit';

const authRoutes = new Hono<Env>();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Password complexity requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
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

// POST /api/auth/register (rate limited, can be disabled via env)
authRoutes.post('/register', sensitiveRateLimit, zValidator('json', registerSchema), async (c) => {
  // SECURITY: Disable registration in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_REGISTRATION !== 'true') {
    return c.json({ success: false, error: 'Registration is disabled' }, 403);
  }

  const data = c.req.valid('json');

  const existingUser = await getUserByEmail(data.email);

  if (existingUser) {
    return c.json({ success: false, error: 'Email already registered' }, 400);
  }

  const user = await createUser(data);

  // Log user creation
  await logUserEvent(c, 'user_created', user.id, user.id, {
    email: user.email,
    selfRegistration: true,
  });

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
