import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  hasAccess,
  getUserPermissions,
  getRolePermissions,
  updateRolePermissions,
  updateUserPermissions,
  assignRoleToUser,
  removeRoleFromUser,
} from '../services/permissions';

const permissionsRoutes = new Hono<Env>();

const permissionSchema = z.object({
  resourceType: z.enum(['assistant', 'automation']),
  resourceId: z.string().uuid(),
});

const updatePermissionsSchema = z.object({
  permissions: z.array(permissionSchema),
});

const updateUserRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()),
});

// Toutes les routes nécessitent auth
permissionsRoutes.use('*', authMiddleware);

// GET /api/permissions/check/:resourceType/:resourceId - Vérifier l'accès de l'utilisateur courant
permissionsRoutes.get('/check/:resourceType/:resourceId', async (c) => {
  const resourceType = c.req.param('resourceType') as 'assistant' | 'automation';
  const resourceId = c.req.param('resourceId');
  const user = c.get('user')!;

  const hasAccessResult = await hasAccess(user.id, user.role, resourceType, resourceId);

  return c.json({
    success: true,
    data: { hasAccess: hasAccessResult },
  });
});

// Les routes suivantes nécessitent admin
permissionsRoutes.use('/roles/*', adminMiddleware);
permissionsRoutes.use('/users/*', adminMiddleware);

// GET /api/permissions/roles/:roleId - Permissions d'un rôle
permissionsRoutes.get('/roles/:roleId', async (c) => {
  const roleId = c.req.param('roleId');

  // Vérifier que le rôle existe
  const [role] = await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.id, roleId))
    .limit(1);

  if (!role) {
    return c.json({ success: false, error: 'Role not found' }, 404);
  }

  const permissions = await getRolePermissions(roleId);

  return c.json({
    success: true,
    data: permissions,
  });
});

// PUT /api/permissions/roles/:roleId - Mettre à jour les permissions d'un rôle
permissionsRoutes.put(
  '/roles/:roleId',
  zValidator('json', updatePermissionsSchema),
  async (c) => {
    const roleId = c.req.param('roleId');
    const { permissions } = c.req.valid('json');

    // Vérifier que le rôle existe
    const [role] = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId))
      .limit(1);

    if (!role) {
      return c.json({ success: false, error: 'Role not found' }, 404);
    }

    await updateRolePermissions(roleId, permissions);

    return c.json({ success: true });
  }
);

// GET /api/permissions/users/:userId - Permissions complètes d'un utilisateur
permissionsRoutes.get('/users/:userId', async (c) => {
  const userId = c.req.param('userId');

  // Vérifier que l'utilisateur existe
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  const permissions = await getUserPermissions(userId);

  return c.json({
    success: true,
    data: permissions,
  });
});

// PUT /api/permissions/users/:userId - Mettre à jour les permissions individuelles d'un utilisateur
permissionsRoutes.put(
  '/users/:userId',
  zValidator('json', updatePermissionsSchema),
  async (c) => {
    const userId = c.req.param('userId');
    const { permissions } = c.req.valid('json');

    // Vérifier que l'utilisateur existe
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    await updateUserPermissions(userId, permissions);

    return c.json({ success: true });
  }
);

// PUT /api/permissions/users/:userId/roles - Mettre à jour les rôles d'un utilisateur
permissionsRoutes.put(
  '/users/:userId/roles',
  zValidator('json', updateUserRolesSchema),
  async (c) => {
    const userId = c.req.param('userId');
    const { roleIds } = c.req.valid('json');

    // Vérifier que l'utilisateur existe
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Supprimer tous les rôles actuels
    await db.delete(schema.userRoles).where(eq(schema.userRoles.userId, userId));

    // Ajouter les nouveaux rôles
    if (roleIds.length > 0) {
      await db.insert(schema.userRoles).values(
        roleIds.map((roleId) => ({
          userId,
          roleId,
        }))
      );
    }

    return c.json({ success: true });
  }
);

// POST /api/permissions/users/:userId/roles/:roleId - Ajouter un rôle à un utilisateur
permissionsRoutes.post('/users/:userId/roles/:roleId', async (c) => {
  const userId = c.req.param('userId');
  const roleId = c.req.param('roleId');

  // Vérifier que l'utilisateur existe
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  // Vérifier que le rôle existe
  const [role] = await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.id, roleId))
    .limit(1);

  if (!role) {
    return c.json({ success: false, error: 'Role not found' }, 404);
  }

  await assignRoleToUser(userId, roleId);

  return c.json({ success: true }, 201);
});

// DELETE /api/permissions/users/:userId/roles/:roleId - Retirer un rôle d'un utilisateur
permissionsRoutes.delete('/users/:userId/roles/:roleId', async (c) => {
  const userId = c.req.param('userId');
  const roleId = c.req.param('roleId');

  await removeRoleFromUser(userId, roleId);

  return c.json({ success: true });
});

export { permissionsRoutes };
