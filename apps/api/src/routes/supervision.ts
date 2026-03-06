import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/auth';

const supervisionRoutes = new Hono<Env>();

supervisionRoutes.use('*', authMiddleware);
supervisionRoutes.use('*', adminMiddleware);

// GET /stats — Global stats for current month
supervisionRoutes.get('/stats', async (c) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [stats] = await db
    .select({
      totalTokens: sql<number>`COALESCE(SUM(${schema.apiUsage.totalTokens}), 0)`,
      totalCost: sql<number>`COALESCE(SUM(${schema.apiUsage.costEstimate}), 0)`,
      activeUsers: sql<number>`COUNT(DISTINCT ${schema.apiUsage.userId})`,
      totalRequests: sql<number>`COUNT(*)`,
    })
    .from(schema.apiUsage)
    .where(sql`${schema.apiUsage.createdAt} >= ${startOfMonth.toISOString()}`);

  // Count active conversations this month (assistant + sega)
  const [assistantConvs] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${schema.conversations.id})` })
    .from(schema.conversations)
    .where(sql`${schema.conversations.updatedAt} >= ${startOfMonth.toISOString()}`);

  const [segaConvs] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${schema.segaConversations.id})` })
    .from(schema.segaConversations)
    .where(sql`${schema.segaConversations.updatedAt} >= ${startOfMonth.toISOString()}`);

  return c.json({
    success: true,
    data: {
      totalTokens: Number(stats.totalTokens),
      totalCost: Number(stats.totalCost),
      activeUsers: Number(stats.activeUsers),
      totalRequests: Number(stats.totalRequests),
      activeConversations: Number(assistantConvs.count) + Number(segaConvs.count),
    },
  });
});

// GET /users — Users with aggregated usage
supervisionRoutes.get('/users', async (c) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const users = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      role: schema.users.role,
      creditLimit: schema.users.creditLimit,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.isStaff, true))
    .orderBy(schema.users.firstName);

  // Get usage per user for current month
  const usageByUser = await db
    .select({
      userId: schema.apiUsage.userId,
      totalTokens: sql<number>`COALESCE(SUM(${schema.apiUsage.totalTokens}), 0)`,
      totalCost: sql<number>`COALESCE(SUM(${schema.apiUsage.costEstimate}), 0)`,
      requestCount: sql<number>`COUNT(*)`,
    })
    .from(schema.apiUsage)
    .where(sql`${schema.apiUsage.createdAt} >= ${startOfMonth.toISOString()}`)
    .groupBy(schema.apiUsage.userId);

  // Count conversations per user this month
  const assistantConvsByUser = await db
    .select({
      userId: schema.conversations.userId,
      count: sql<number>`COUNT(DISTINCT ${schema.conversations.id})`,
    })
    .from(schema.conversations)
    .where(sql`${schema.conversations.updatedAt} >= ${startOfMonth.toISOString()}`)
    .groupBy(schema.conversations.userId);

  const segaConvsByUser = await db
    .select({
      userId: schema.segaConversations.userId,
      count: sql<number>`COUNT(DISTINCT ${schema.segaConversations.id})`,
    })
    .from(schema.segaConversations)
    .where(sql`${schema.segaConversations.updatedAt} >= ${startOfMonth.toISOString()}`)
    .groupBy(schema.segaConversations.userId);

  const usageMap = new Map(usageByUser.map((u) => [u.userId, u]));
  const assistantConvsMap = new Map(assistantConvsByUser.map((c) => [c.userId, Number(c.count)]));
  const segaConvsMap = new Map(segaConvsByUser.map((c) => [c.userId, Number(c.count)]));

  return c.json({
    success: true,
    data: users.map((user) => {
      const usage = usageMap.get(user.id);
      return {
        ...user,
        totalTokens: Number(usage?.totalTokens ?? 0),
        totalCost: Number(usage?.totalCost ?? 0),
        requestCount: Number(usage?.requestCount ?? 0),
        conversationCount: (assistantConvsMap.get(user.id) ?? 0) + (segaConvsMap.get(user.id) ?? 0),
      };
    }),
  });
});

// GET /users/:id/conversations — All conversations for a user
supervisionRoutes.get('/users/:id/conversations', async (c) => {
  const userId = c.req.param('id');

  // Get assistant conversations
  const assistantConvs = await db
    .select({
      id: schema.conversations.id,
      title: schema.conversations.title,
      createdAt: schema.conversations.createdAt,
      updatedAt: schema.conversations.updatedAt,
      assistantName: schema.assistants.name,
    })
    .from(schema.conversations)
    .leftJoin(schema.assistants, eq(schema.conversations.assistantId, schema.assistants.id))
    .where(eq(schema.conversations.userId, userId))
    .orderBy(desc(schema.conversations.updatedAt));

  // Get sega conversations
  const segaConvs = await db
    .select({
      id: schema.segaConversations.id,
      title: schema.segaConversations.title,
      model: schema.segaConversations.model,
      createdAt: schema.segaConversations.createdAt,
      updatedAt: schema.segaConversations.updatedAt,
    })
    .from(schema.segaConversations)
    .where(eq(schema.segaConversations.userId, userId))
    .orderBy(desc(schema.segaConversations.updatedAt));

  return c.json({
    success: true,
    data: {
      assistant: assistantConvs.map((conv) => ({
        id: conv.id,
        type: 'assistant' as const,
        title: conv.title || conv.assistantName || 'Sans titre',
        assistantName: conv.assistantName,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
      sega: segaConvs.map((conv) => ({
        id: conv.id,
        type: 'sega' as const,
        title: conv.title || 'Sans titre',
        model: conv.model,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
    },
  });
});

// GET /conversations/:type/:id/messages — Messages of a conversation
supervisionRoutes.get('/conversations/:type/:id/messages', async (c) => {
  const type = c.req.param('type');
  const conversationId = c.req.param('id');

  if (type !== 'assistant' && type !== 'sega') {
    return c.json({ success: false, error: 'Invalid type' }, 400);
  }

  if (type === 'assistant') {
    const msgs = await db
      .select({
        id: schema.messages.id,
        role: schema.messages.role,
        content: schema.messages.content,
        createdAt: schema.messages.createdAt,
      })
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId))
      .orderBy(schema.messages.createdAt);

    return c.json({ success: true, data: msgs });
  }

  // sega
  const msgs = await db
    .select({
      id: schema.segaMessages.id,
      role: schema.segaMessages.role,
      content: schema.segaMessages.content,
      createdAt: schema.segaMessages.createdAt,
    })
    .from(schema.segaMessages)
    .where(eq(schema.segaMessages.conversationId, conversationId))
    .orderBy(schema.segaMessages.createdAt);

  return c.json({ success: true, data: msgs });
});

// PUT /users/:id/credit-limit — Set or remove credit limit
const creditLimitSchema = z.object({
  creditLimit: z.number().nullable(),
});

supervisionRoutes.put('/users/:id/credit-limit', zValidator('json', creditLimitSchema), async (c) => {
  const userId = c.req.param('id');
  const { creditLimit } = c.req.valid('json');

  const [updated] = await db
    .update(schema.users)
    .set({ creditLimit })
    .where(eq(schema.users.id, userId))
    .returning({ id: schema.users.id, creditLimit: schema.users.creditLimit });

  if (!updated) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  return c.json({ success: true, data: updated });
});

export { supervisionRoutes };
