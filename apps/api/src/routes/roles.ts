import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { getRolePermissions, getRoleUsers } from '../services/permissions';

const rolesRoutes = new Hono<Env>();

const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const updateRoleSchema = createRoleSchema.partial();

// Toutes les routes nécessitent auth + admin
rolesRoutes.use('*', authMiddleware);
rolesRoutes.use('*', adminMiddleware);

// GET /api/roles - Liste tous les rôles
rolesRoutes.get('/', async (c) => {
  const roles = await db
    .select()
    .from(schema.roles)
    .orderBy(schema.roles.name);

  return c.json({
    success: true,
    data: roles,
  });
});

// GET /api/roles/:id - Détails d'un rôle avec permissions et membres
rolesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [role] = await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.id, id))
    .limit(1);

  if (!role) {
    return c.json({ success: false, error: 'Role not found' }, 404);
  }

  // Récupérer les permissions et les membres
  const permissions = await getRolePermissions(id);
  const members = await getRoleUsers(id);

  return c.json({
    success: true,
    data: {
      ...role,
      permissions,
      members,
    },
  });
});

// POST /api/roles - Créer un rôle
rolesRoutes.post('/', zValidator('json', createRoleSchema), async (c) => {
  const data = c.req.valid('json');
  const now = new Date();

  // Vérifier si le nom existe déjà
  const [existing] = await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.name, data.name))
    .limit(1);

  if (existing) {
    return c.json({ success: false, error: 'A role with this name already exists' }, 400);
  }

  const [role] = await db
    .insert(schema.roles)
    .values({
      name: data.name,
      description: data.description || null,
      color: data.color || '#6366f1',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return c.json(
    {
      success: true,
      data: role,
    },
    201
  );
});

// PUT /api/roles/:id - Modifier un rôle
rolesRoutes.put('/:id', zValidator('json', updateRoleSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [existing] = await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Role not found' }, 404);
  }

  // Si le nom change, vérifier qu'il n'existe pas déjà
  if (data.name && data.name !== existing.name) {
    const [nameExists] = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.name, data.name))
      .limit(1);

    if (nameExists) {
      return c.json({ success: false, error: 'A role with this name already exists' }, 400);
    }
  }

  const [role] = await db
    .update(schema.roles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.roles.id, id))
    .returning();

  return c.json({
    success: true,
    data: role,
  });
});

// DELETE /api/roles/:id - Supprimer un rôle
rolesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const [existing] = await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Role not found' }, 404);
  }

  // La suppression cascade aux userRoles et rolePermissions grâce aux FK
  await db.delete(schema.roles).where(eq(schema.roles.id, id));

  return c.json({ success: true });
});

// POST /api/roles/:id/members - Ajouter un membre au rôle
rolesRoutes.post(
  '/:id/members',
  zValidator('json', z.object({ userId: z.string().uuid() })),
  async (c) => {
    const roleId = c.req.param('id');
    const { userId } = c.req.valid('json');

    // Vérifier que le rôle existe
    const [role] = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId))
      .limit(1);

    if (!role) {
      return c.json({ success: false, error: 'Role not found' }, 404);
    }

    // Vérifier que l'utilisateur existe
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Vérifier si déjà membre
    const [existingMembership] = await db
      .select()
      .from(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.roleId, roleId),
          eq(schema.userRoles.userId, userId)
        )
      )
      .limit(1);

    if (existingMembership) {
      return c.json({ success: true, message: 'User already has this role' });
    }

    // Ajouter le membre
    await db.insert(schema.userRoles).values({
      userId,
      roleId,
    });

    return c.json({ success: true }, 201);
  }
);

// DELETE /api/roles/:id/members/:userId - Retirer un membre du rôle
rolesRoutes.delete('/:id/members/:userId', async (c) => {
  const roleId = c.req.param('id');
  const userId = c.req.param('userId');

  await db
    .delete(schema.userRoles)
    .where(
      and(
        eq(schema.userRoles.roleId, roleId),
        eq(schema.userRoles.userId, userId)
      )
    );

  return c.json({ success: true });
});

export { rolesRoutes };
