import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, asc, and, sql, ne } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware, staffMiddleware } from '../middleware/auth';

const campaignsRoutes = new Hono<Env>();

// =====================================================
// SCHEMAS DE VALIDATION
// =====================================================

const campaignSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  target: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'active', 'upcoming', 'completed']).optional().default('draft'),
  participantGoal: z.number().positive().optional().default(1000),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(),
});

// Apply auth middleware to all routes
campaignsRoutes.use('*', authMiddleware);

// =====================================================
// ROUTES CAMPAGNES
// =====================================================

// GET /api/campaigns - Liste des campagnes
campaignsRoutes.get('/', async (c) => {
  const user = c.get('user')!;
  const status = c.req.query('status');

  // Staff voit toutes les campagnes, citoyens seulement actives/upcoming/completed
  let baseCondition;
  if (user.isStaff) {
    baseCondition = eq(schema.campaigns.isActive, true);
  } else {
    baseCondition = and(
      eq(schema.campaigns.isActive, true),
      ne(schema.campaigns.status, 'draft')
    );
  }

  let campaigns;
  if (status && ['draft', 'active', 'upcoming', 'completed'].includes(status)) {
    campaigns = await db
      .select()
      .from(schema.campaigns)
      .where(and(baseCondition, eq(schema.campaigns.status, status as 'draft' | 'active' | 'upcoming' | 'completed')))
      .orderBy(desc(schema.campaigns.createdAt));
  } else {
    campaigns = await db
      .select()
      .from(schema.campaigns)
      .where(baseCondition)
      .orderBy(desc(schema.campaigns.createdAt));
  }

  // Pour chaque campagne, récupérer le nombre de participants
  const campaignsWithParticipants = await Promise.all(
    campaigns.map(async (campaign) => {
      const participantCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.campaignParticipations)
        .where(eq(schema.campaignParticipations.campaignId, campaign.id));

      // Vérifier si l'utilisateur participe déjà
      const [userParticipation] = await db
        .select()
        .from(schema.campaignParticipations)
        .where(and(
          eq(schema.campaignParticipations.campaignId, campaign.id),
          eq(schema.campaignParticipations.userId, user.id)
        ))
        .limit(1);

      return {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        target: campaign.target,
        category: campaign.category,
        status: campaign.status,
        participantGoal: campaign.participantGoal,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        participants: Number(participantCount[0]?.count || 0),
        isParticipating: !!userParticipation,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      };
    })
  );

  return c.json({ success: true, data: campaignsWithParticipants });
});

// GET /api/campaigns/:id - Détail d'une campagne
campaignsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user')!;

  const [campaign] = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, id))
    .limit(1);

  if (!campaign || !campaign.isActive) {
    return c.json({ success: false, error: 'Campaign not found' }, 404);
  }

  // Vérifier que les citoyens ne voient pas les brouillons
  if (!user.isStaff && campaign.status === 'draft') {
    return c.json({ success: false, error: 'Campaign not found' }, 404);
  }

  // Nombre de participants
  const participantCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.campaignParticipations)
    .where(eq(schema.campaignParticipations.campaignId, id));

  // Vérifier si l'utilisateur participe
  const [userParticipation] = await db
    .select()
    .from(schema.campaignParticipations)
    .where(and(
      eq(schema.campaignParticipations.campaignId, id),
      eq(schema.campaignParticipations.userId, user.id)
    ))
    .limit(1);

  return c.json({
    success: true,
    data: {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      target: campaign.target,
      category: campaign.category,
      status: campaign.status,
      participantGoal: campaign.participantGoal,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      participants: Number(participantCount[0]?.count || 0),
      isParticipating: !!userParticipation,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    }
  });
});

// POST /api/campaigns - Créer une campagne (staff only)
campaignsRoutes.post('/', staffMiddleware, zValidator('json', campaignSchema), async (c) => {
  const data = c.req.valid('json');
  const user = c.get('user')!;
  const now = new Date();

  const [campaign] = await db.insert(schema.campaigns).values({
    organizationId: user.organizationId || null,
    createdBy: user.id,
    title: data.title,
    description: data.description || null,
    target: data.target || null,
    category: data.category || null,
    status: data.status || 'draft',
    participantGoal: data.participantGoal || 1000,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return c.json({ success: true, data: campaign }, 201);
});

// PUT /api/campaigns/:id - Modifier une campagne (staff only)
campaignsRoutes.put('/:id', staffMiddleware, zValidator('json', campaignSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [existing] = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Campaign not found' }, 404);
  }

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };

  // Convertir les dates si présentes
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  const [campaign] = await db
    .update(schema.campaigns)
    .set(updateData)
    .where(eq(schema.campaigns.id, id))
    .returning();

  return c.json({ success: true, data: campaign });
});

// DELETE /api/campaigns/:id - Supprimer une campagne (staff only, soft delete)
campaignsRoutes.delete('/:id', staffMiddleware, async (c) => {
  const id = c.req.param('id');

  const [existing] = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Campaign not found' }, 404);
  }

  await db
    .update(schema.campaigns)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(schema.campaigns.id, id));

  return c.json({ success: true });
});

// =====================================================
// ROUTES PARTICIPATION
// =====================================================

// POST /api/campaigns/:id/join - Rejoindre une campagne
campaignsRoutes.post('/:id/join', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user')!;

  const [campaign] = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, id))
    .limit(1);

  if (!campaign || !campaign.isActive) {
    return c.json({ success: false, error: 'Campaign not found' }, 404);
  }

  if (campaign.status !== 'active') {
    return c.json({ success: false, error: 'Campaign is not active' }, 400);
  }

  // Vérifier si l'utilisateur participe déjà
  const [existingParticipation] = await db
    .select()
    .from(schema.campaignParticipations)
    .where(and(
      eq(schema.campaignParticipations.campaignId, id),
      eq(schema.campaignParticipations.userId, user.id)
    ))
    .limit(1);

  if (existingParticipation) {
    return c.json({ success: false, error: 'Already participating in this campaign' }, 400);
  }

  const [participation] = await db.insert(schema.campaignParticipations).values({
    campaignId: id,
    userId: user.id,
    joinedAt: new Date(),
  }).returning();

  // Retourner le nouveau nombre de participants
  const participantCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.campaignParticipations)
    .where(eq(schema.campaignParticipations.campaignId, id));

  return c.json({
    success: true,
    data: {
      participationId: participation.id,
      participants: Number(participantCount[0]?.count || 0),
    }
  }, 201);
});

// DELETE /api/campaigns/:id/leave - Quitter une campagne
campaignsRoutes.delete('/:id/leave', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user')!;

  const [campaign] = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, id))
    .limit(1);

  if (!campaign || !campaign.isActive) {
    return c.json({ success: false, error: 'Campaign not found' }, 404);
  }

  // Vérifier que l'utilisateur participe
  const [existingParticipation] = await db
    .select()
    .from(schema.campaignParticipations)
    .where(and(
      eq(schema.campaignParticipations.campaignId, id),
      eq(schema.campaignParticipations.userId, user.id)
    ))
    .limit(1);

  if (!existingParticipation) {
    return c.json({ success: false, error: 'Not participating in this campaign' }, 400);
  }

  await db
    .delete(schema.campaignParticipations)
    .where(eq(schema.campaignParticipations.id, existingParticipation.id));

  // Retourner le nouveau nombre de participants
  const participantCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.campaignParticipations)
    .where(eq(schema.campaignParticipations.campaignId, id));

  return c.json({
    success: true,
    data: {
      participants: Number(participantCount[0]?.count || 0),
    }
  });
});

// GET /api/campaigns/my-participations - Mes participations
campaignsRoutes.get('/my/participations', async (c) => {
  const user = c.get('user')!;

  const participations = await db
    .select({
      participation: schema.campaignParticipations,
      campaign: schema.campaigns,
    })
    .from(schema.campaignParticipations)
    .innerJoin(schema.campaigns, eq(schema.campaignParticipations.campaignId, schema.campaigns.id))
    .where(eq(schema.campaignParticipations.userId, user.id));

  return c.json({
    success: true,
    data: participations.map(p => ({
      participationId: p.participation.id,
      joinedAt: p.participation.joinedAt,
      campaign: {
        id: p.campaign.id,
        title: p.campaign.title,
        description: p.campaign.description,
        status: p.campaign.status,
        target: p.campaign.target,
        category: p.campaign.category,
      },
    })),
  });
});

// GET /api/campaigns/stats - Statistiques globales (public)
campaignsRoutes.get('/stats/global', async (c) => {
  // Total de participants uniques
  const totalParticipants = await db
    .select({ count: sql<number>`count(DISTINCT user_id)` })
    .from(schema.campaignParticipations);

  // Nombre de campagnes actives
  const activeCampaigns = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.campaigns)
    .where(and(
      eq(schema.campaigns.isActive, true),
      eq(schema.campaigns.status, 'active')
    ));

  // Nombre de campagnes complétées
  const completedCampaigns = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.campaigns)
    .where(and(
      eq(schema.campaigns.isActive, true),
      eq(schema.campaigns.status, 'completed')
    ));

  return c.json({
    success: true,
    data: {
      totalParticipants: Number(totalParticipants[0]?.count || 0),
      activeCampaigns: Number(activeCampaigns[0]?.count || 0),
      completedCampaigns: Number(completedCampaigns[0]?.count || 0),
    }
  });
});

export { campaignsRoutes };
