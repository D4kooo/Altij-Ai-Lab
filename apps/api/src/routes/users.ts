import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { hashPassword, revokeAllUserRefreshTokens } from '../services/auth';

const usersRoutes = new Hono<Env>();

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'user']).optional(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['admin', 'user']).optional(),
  password: z.string().min(8).optional(),
});

// Apply auth and admin middleware to all routes
usersRoutes.use('*', authMiddleware, adminMiddleware);

// GET /api/users - List all users
usersRoutes.get('/', async (c) => {
  const users = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
      lastLoginAt: schema.users.lastLoginAt,
    })
    .from(schema.users)
    .orderBy(schema.users.lastName, schema.users.firstName);

  return c.json({
    success: true,
    data: users,
  });
});

// GET /api/users/:id - Get user details
usersRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [user] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
      lastLoginAt: schema.users.lastLoginAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  return c.json({
    success: true,
    data: user,
  });
});

// POST /api/users - Create new user
usersRoutes.post('/', zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json');

  // Check if email already exists
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, data.email.toLowerCase()))
    .limit(1);

  if (existing) {
    return c.json({ success: false, error: 'Email already registered' }, 400);
  }

  const passwordHash = await hashPassword(data.password);
  const now = new Date();

  const [user] = await db.insert(schema.users).values({
    email: data.email.toLowerCase(),
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role || 'user',
    createdAt: now,
  }).returning({
    id: schema.users.id,
    email: schema.users.email,
    firstName: schema.users.firstName,
    lastName: schema.users.lastName,
    role: schema.users.role,
    createdAt: schema.users.createdAt,
    lastLoginAt: schema.users.lastLoginAt,
  });

  return c.json(
    {
      success: true,
      data: user,
    },
    201
  );
});

// PUT /api/users/:id - Update user
usersRoutes.put('/:id', zValidator('json', updateUserSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  // Check if new email already exists
  if (data.email && data.email.toLowerCase() !== existing.email) {
    const [emailExists] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, data.email.toLowerCase()))
      .limit(1);

    if (emailExists) {
      return c.json({ success: false, error: 'Email already registered' }, 400);
    }
  }

  const updateData: Record<string, unknown> = {};

  if (data.email) updateData.email = data.email.toLowerCase();
  if (data.firstName) updateData.firstName = data.firstName;
  if (data.lastName) updateData.lastName = data.lastName;
  if (data.role) updateData.role = data.role;
  if (data.password) updateData.passwordHash = await hashPassword(data.password);

  await db.update(schema.users).set(updateData).where(eq(schema.users.id, id));

  // If password changed, revoke all refresh tokens
  if (data.password) {
    await revokeAllUserRefreshTokens(id);
  }

  const [user] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
      lastLoginAt: schema.users.lastLoginAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);

  return c.json({
    success: true,
    data: user,
  });
});

// DELETE /api/users/:id - Delete user
usersRoutes.delete('/:id', async (c) => {
  const currentUser = c.get('user');
  const id = c.req.param('id');

  // Prevent self-deletion
  if (id === currentUser.id) {
    return c.json({ success: false, error: 'Cannot delete your own account' }, 400);
  }

  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  // Delete user (cascading will handle related records)
  await db.delete(schema.users).where(eq(schema.users.id, id));

  return c.json({ success: true });
});

export { usersRoutes };
