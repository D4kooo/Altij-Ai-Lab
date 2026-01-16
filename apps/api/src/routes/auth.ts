import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { Env } from '../types';
import { db } from '../db';
import { users, organizations } from '../db/schema';
import {
  getUserByEmail,
  verifyPassword,
  hashPassword,
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

// Password complexity schema
const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe ne doit pas dépasser 128 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial');

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: passwordSchema,
  firstName: z.string().min(1, 'Prénom requis').max(100),
  lastName: z.string().min(1, 'Nom requis').max(100),
  organizationType: z.enum(['work', 'family']),
  organizationName: z.string().min(1, 'Nom d\'organisation requis').max(200),
});

// Citizen registration schema (simpler - no organization)
const registerCitizenSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(1, 'Prénom requis').max(100),
  lastName: z.string().min(1, 'Nom requis').max(100),
});

// POST /api/auth/register - Public registration with organization creation
authRoutes.post('/register', authRateLimit, zValidator('json', registerSchema, (result, c) => {
  if (!result.success) {
    // Extract first error message for user-friendly display
    const firstError = result.error.issues[0];
    return c.json({ success: false, error: firstError.message }, 400);
  }
}), async (c) => {
  const data = c.req.valid('json');

  // Check if email already exists
  const existingUser = await getUserByEmail(data.email);
  if (existingUser) {
    return c.json({ success: false, error: 'Cet email est déjà utilisé' }, 400);
  }

  try {
    // Hash password
    const passwordHash = await hashPassword(data.password);
    const now = new Date();

    // Create user first (without organization)
    const [newUser] = await db.insert(users).values({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'admin', // First user of org is admin
      isOnboarded: true,
      createdAt: now,
    }).returning();

    // Create organization with user as owner
    const [newOrg] = await db.insert(organizations).values({
      name: data.organizationName,
      type: data.organizationType,
      ownerId: newUser.id,
      settings: {},
    }).returning();

    // Link user to organization
    await db
      .update(users)
      .set({ organizationId: newOrg.id })
      .where(eq(users.id, newUser.id));

    // Log registration
    await logAuthEvent(c, 'user_created', newUser.id, {
      email: newUser.email,
      organizationType: data.organizationType,
      organizationName: data.organizationName,
      selfRegistered: true,
    });

    // Generate tokens for immediate login
    const userWithOrg = { ...newUser, organizationId: newOrg.id };
    const token = await generateAccessToken(userWithOrg);
    const refreshToken = await generateRefreshToken(newUser.id);

    return c.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
        organization: {
          id: newOrg.id,
          name: newOrg.name,
          type: newOrg.type,
          isOwner: true,
        },
        token,
        refreshToken,
      },
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ success: false, error: 'Erreur lors de l\'inscription' }, 500);
  }
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
        isStaff: user.isStaff ?? false,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      token,
      refreshToken,
    },
  });
});

// POST /api/auth/register-citizen - Public citizen registration (no organization)
authRoutes.post('/register-citizen', authRateLimit, zValidator('json', registerCitizenSchema, (result, c) => {
  if (!result.success) {
    const firstError = result.error.issues[0];
    return c.json({ success: false, error: firstError.message }, 400);
  }
}), async (c) => {
  const data = c.req.valid('json');

  // Check if email already exists
  const existingUser = await getUserByEmail(data.email);
  if (existingUser) {
    return c.json({ success: false, error: 'Cet email est déjà utilisé' }, 400);
  }

  try {
    // Hash password
    const passwordHash = await hashPassword(data.password);
    const now = new Date();

    // Create citizen user (without organization, isStaff = false)
    const [newUser] = await db.insert(users).values({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'user', // Citizens are regular users
      isStaff: false, // Not a staff member
      isOnboarded: true,
      createdAt: now,
    }).returning();

    // Log registration
    await logAuthEvent(c, 'user_created', newUser.id, {
      email: newUser.email,
      citizenRegistration: true,
    });

    // Generate tokens for immediate login
    const token = await generateAccessToken(newUser);
    const refreshToken = await generateRefreshToken(newUser.id);

    return c.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          isStaff: false,
          createdAt: newUser.createdAt,
        },
        token,
        refreshToken,
      },
    }, 201);
  } catch (error) {
    console.error('Citizen registration error:', error);
    return c.json({ success: false, error: 'Erreur lors de l\'inscription' }, 500);
  }
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
      isStaff: user.isStaff ?? false,
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
