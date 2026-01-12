import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { hashPassword, revokeAllUserRefreshTokens } from '../services/auth';
import { paginationSchema, paginate, getOffset } from '../utils/pagination';
import { logUserEvent } from '../services/audit';

const usersRoutes = new Hono<Env>();

// Password complexity for admin-created users too
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const createUserSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['admin', 'user']).optional(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'user']).optional(),
  password: passwordSchema.optional(),
});

// Apply auth and admin middleware to all routes
usersRoutes.use('*', authMiddleware, adminMiddleware);

// GET /api/users - List all users (paginated)
usersRoutes.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit } = c.req.valid('query');
  const offset = getOffset(page, limit);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.users);

  // Get paginated users
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
    .orderBy(schema.users.lastName, schema.users.firstName)
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    ...paginate(users, count, page, limit),
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

  // Log user creation by admin
  const currentUser = c.get('user');
  await logUserEvent(c, 'user_created', currentUser.id, user.id, {
    email: user.email,
    role: user.role,
    createdByAdmin: true,
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

  // Log user update
  const currentUser = c.get('user');
  await logUserEvent(c, 'user_updated', currentUser.id, id, {
    changes: Object.keys(updateData),
    passwordChanged: !!data.password,
  });

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

  // Log deletion before actually deleting
  await logUserEvent(c, 'user_deleted', currentUser.id, id, {
    deletedEmail: existing.email,
  });

  // Delete user (cascading will handle related records)
  await db.delete(schema.users).where(eq(schema.users.id, id));

  return c.json({ success: true });
});

export { usersRoutes };
