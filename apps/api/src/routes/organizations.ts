import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Env } from '../types';
import { db } from '../db';
import { organizations, users, type OrganizationSettings } from '../db/schema';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const organizationsRouter = new Hono<Env>();

// Toutes les routes nécessitent une authentification
organizationsRouter.use('*', authMiddleware);

// GET /organizations/current - Récupérer l'organisation courante de l'utilisateur
organizationsRouter.get('/current', async (c) => {
  const user = c.get('user');

  if (!user.organizationId) {
    return c.json({
      success: false,
      error: 'No organization found',
      code: 'NO_ORGANIZATION'
    }, 404);
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  if (!org) {
    return c.json({
      success: false,
      error: 'Organization not found',
      code: 'ORGANIZATION_NOT_FOUND'
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      id: org.id,
      name: org.name,
      type: org.type,
      settings: org.settings,
      isOwner: org.ownerId === user.id,
      createdAt: org.createdAt
    }
  });
});

// POST /organizations - Créer une nouvelle organisation (onboarding)
organizationsRouter.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{
    name: string;
    type: 'work' | 'family';
    settings?: OrganizationSettings;
  }>();

  // Validation
  if (!body.name || !body.type) {
    return c.json({
      success: false,
      error: 'Name and type are required'
    }, 400);
  }

  if (!['work', 'family'].includes(body.type)) {
    return c.json({
      success: false,
      error: 'Type must be "work" or "family"'
    }, 400);
  }

  // Vérifier si l'utilisateur a déjà une organisation
  if (user.organizationId) {
    return c.json({
      success: false,
      error: 'User already has an organization',
      code: 'ALREADY_HAS_ORGANIZATION'
    }, 400);
  }

  // Créer l'organisation
  const [newOrg] = await db
    .insert(organizations)
    .values({
      name: body.name,
      type: body.type,
      ownerId: user.id,
      settings: body.settings || {},
    })
    .returning();

  // Associer l'utilisateur à l'organisation et marquer comme onboarded
  await db
    .update(users)
    .set({
      organizationId: newOrg.id,
      isOnboarded: true
    })
    .where(eq(users.id, user.id));

  return c.json({
    success: true,
    data: {
      id: newOrg.id,
      name: newOrg.name,
      type: newOrg.type,
      settings: newOrg.settings,
      isOwner: true,
      createdAt: newOrg.createdAt
    }
  }, 201);
});

// PATCH /organizations/current - Mettre à jour l'organisation courante
organizationsRouter.patch('/current', async (c) => {
  const user = c.get('user');
  const organization = c.get('organization');

  if (!organization) {
    return c.json({
      success: false,
      error: 'No organization found',
      code: 'NO_ORGANIZATION'
    }, 404);
  }

  // Seul le owner peut modifier l'organisation
  if (organization.ownerId !== user.id && user.role !== 'admin') {
    return c.json({
      success: false,
      error: 'Only organization owner can update settings'
    }, 403);
  }

  const body = await c.req.json<{
    name?: string;
    settings?: Partial<OrganizationSettings>;
  }>();

  const updateData: Partial<typeof organizations.$inferInsert> = {};

  if (body.name) {
    updateData.name = body.name;
  }

  if (body.settings) {
    // Merge les settings existants avec les nouveaux
    updateData.settings = {
      ...(organization.settings as OrganizationSettings || {}),
      ...body.settings
    };
  }

  if (Object.keys(updateData).length === 0) {
    return c.json({
      success: false,
      error: 'No fields to update'
    }, 400);
  }

  const [updated] = await db
    .update(organizations)
    .set(updateData)
    .where(eq(organizations.id, organization.id))
    .returning();

  return c.json({
    success: true,
    data: {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      settings: updated.settings,
      isOwner: updated.ownerId === user.id,
      createdAt: updated.createdAt
    }
  });
});

// GET /organizations/current/members - Lister les membres de l'organisation
organizationsRouter.get('/current/members', async (c) => {
  const organization = c.get('organization');

  if (!organization) {
    return c.json({
      success: false,
      error: 'No organization found',
      code: 'NO_ORGANIZATION'
    }, 404);
  }

  const members = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isOnboarded: users.isOnboarded,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt
    })
    .from(users)
    .where(eq(users.organizationId, organization.id));

  return c.json({
    success: true,
    data: members.map(member => ({
      ...member,
      isOwner: member.id === organization.ownerId
    }))
  });
});

// POST /organizations/current/invite - Inviter un membre (admin only)
organizationsRouter.post('/current/invite', adminMiddleware, async (c) => {
  const organization = c.get('organization');

  if (!organization) {
    return c.json({
      success: false,
      error: 'No organization found',
      code: 'NO_ORGANIZATION'
    }, 404);
  }

  const body = await c.req.json<{
    email: string;
    role?: 'admin' | 'user';
  }>();

  if (!body.email) {
    return c.json({
      success: false,
      error: 'Email is required'
    }, 400);
  }

  // Vérifier si l'utilisateur existe déjà
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1);

  if (existingUser) {
    // Si l'utilisateur existe mais n'a pas d'organisation, l'associer
    if (!existingUser.organizationId) {
      await db
        .update(users)
        .set({
          organizationId: organization.id,
          isOnboarded: true
        })
        .where(eq(users.id, existingUser.id));

      return c.json({
        success: true,
        message: 'User added to organization',
        data: { userId: existingUser.id }
      });
    }

    return c.json({
      success: false,
      error: 'User already belongs to an organization'
    }, 400);
  }

  // TODO: Implémenter l'envoi d'invitation par email
  return c.json({
    success: true,
    message: 'Invitation sent (email not implemented yet)',
    data: { email: body.email }
  });
});

export { organizationsRouter };
