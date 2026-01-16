import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import type { Env } from '../types';
import { verifyAccessToken, getUserById } from '../services/auth';
import { db } from '../db';
import { organizations } from '../db/schema';

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

  // Injecter l'organization_id dans le contexte pour le filtrage multi-tenant
  // Note: organizationId peut ne pas exister si la migration n'a pas été appliquée
  const organizationId = (user as Record<string, unknown>).organizationId as string | undefined;
  if (organizationId) {
    c.set('organizationId', organizationId);

    try {
      // Récupérer les infos de l'organisation pour connaître le type (work/family)
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

      if (org) {
        c.set('organization', org);
        c.set('organizationType', org.type);
      }
    } catch {
      // La table organizations peut ne pas exister si la migration n'est pas appliquée
      console.warn('Organizations table not available, skipping organization context');
    }
  }

  await next();
});

export const adminMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');

  if (!user || user.role !== 'admin') {
    return c.json({ success: false, error: 'Forbidden: Admin access required' }, 403);
  }

  await next();
});

// Middleware pour vérifier que l'utilisateur a une organisation
export const requireOrganizationMiddleware = createMiddleware<Env>(async (c, next) => {
  const organizationId = c.get('organizationId');

  if (!organizationId) {
    return c.json({
      success: false,
      error: 'Organization required. Please complete onboarding.',
      code: 'ORGANIZATION_REQUIRED'
    }, 403);
  }

  await next();
});

// Middleware pour vérifier que l'utilisateur a complété l'onboarding
export const requireOnboardedMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');

  if (!user.isOnboarded) {
    return c.json({
      success: false,
      error: 'Onboarding not completed',
      code: 'ONBOARDING_REQUIRED'
    }, 403);
  }

  await next();
});

// Middleware pour vérifier que l'utilisateur est staff Data Ring
export const staffMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');

  if (!user || !user.isStaff) {
    return c.json({
      success: false,
      error: 'Forbidden: Staff access required',
      code: 'STAFF_REQUIRED'
    }, 403);
  }

  await next();
});
