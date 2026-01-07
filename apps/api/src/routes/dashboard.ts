import { Hono } from 'hono';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware } from '../middleware/auth';

const dashboardRoutes = new Hono<Env>();

// Apply auth middleware to all routes
dashboardRoutes.use('*', authMiddleware);

// GET /api/dashboard/stats - Get user's dashboard statistics
dashboardRoutes.get('/stats', async (c) => {
  const user = c.get('user');

  // Get first day of current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Count conversations this month
  const conversationsThisMonth = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.conversations)
    .where(
      and(
        eq(schema.conversations.userId, user.id),
        gte(schema.conversations.createdAt, firstDayOfMonth)
      )
    );

  // Count automation runs this month
  const automationsThisMonth = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.automationRuns)
    .where(
      and(
        eq(schema.automationRuns.userId, user.id),
        gte(schema.automationRuns.startedAt, firstDayOfMonth)
      )
    );

  // Calculate estimated time saved (based on automation durations)
  const completedRuns = await db
    .select({
      estimatedDuration: schema.automations.estimatedDuration,
    })
    .from(schema.automationRuns)
    .leftJoin(schema.automations, eq(schema.automationRuns.automationId, schema.automations.id))
    .where(
      and(
        eq(schema.automationRuns.userId, user.id),
        eq(schema.automationRuns.status, 'completed'),
        gte(schema.automationRuns.startedAt, firstDayOfMonth)
      )
    );

  const estimatedTimeSaved = completedRuns.reduce((total, run) => {
    return total + (run.estimatedDuration || 5) * 60; // default 5 minutes if not specified
  }, 0);

  return c.json({
    success: true,
    data: {
      conversationsThisMonth: conversationsThisMonth[0]?.count || 0,
      automationsThisMonth: automationsThisMonth[0]?.count || 0,
      estimatedTimeSaved, // in seconds
    },
  });
});

// GET /api/dashboard/recent - Get recent activity
dashboardRoutes.get('/recent', async (c) => {
  const user = c.get('user');

  // Get recent conversations
  const recentConversations = await db
    .select({
      id: schema.conversations.id,
      title: schema.conversations.title,
      updatedAt: schema.conversations.updatedAt,
      assistantName: schema.assistants.name,
      assistantIcon: schema.assistants.icon,
      assistantColor: schema.assistants.color,
    })
    .from(schema.conversations)
    .leftJoin(schema.assistants, eq(schema.conversations.assistantId, schema.assistants.id))
    .where(eq(schema.conversations.userId, user.id))
    .orderBy(desc(schema.conversations.updatedAt))
    .limit(5);

  // Get recent automation runs
  const recentRuns = await db
    .select({
      id: schema.automationRuns.id,
      status: schema.automationRuns.status,
      startedAt: schema.automationRuns.startedAt,
      completedAt: schema.automationRuns.completedAt,
      automationName: schema.automations.name,
      automationIcon: schema.automations.icon,
      automationColor: schema.automations.color,
    })
    .from(schema.automationRuns)
    .leftJoin(schema.automations, eq(schema.automationRuns.automationId, schema.automations.id))
    .where(eq(schema.automationRuns.userId, user.id))
    .orderBy(desc(schema.automationRuns.startedAt))
    .limit(5);

  // Combine and sort by timestamp
  const activity = [
    ...recentConversations.map((conv) => ({
      type: 'conversation' as const,
      id: conv.id,
      title: conv.title || 'Nouvelle conversation',
      name: conv.assistantName,
      icon: conv.assistantIcon,
      color: conv.assistantColor,
      timestamp: conv.updatedAt,
      status: null,
    })),
    ...recentRuns.map((run) => ({
      type: 'automation' as const,
      id: run.id,
      title: run.automationName || 'Automatisation',
      name: run.automationName,
      icon: run.automationIcon,
      color: run.automationColor,
      timestamp: run.completedAt || run.startedAt,
      status: run.status,
    })),
  ]
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 10);

  return c.json({
    success: true,
    data: activity,
  });
});

export { dashboardRoutes };
