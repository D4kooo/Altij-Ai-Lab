import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, asc } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { listOpenAIAssistants, getOpenAIAssistant } from '../services/openai';

const assistantsRoutes = new Hono<Env>();

// Base schema without refinement (for partial updates)
const assistantBaseSchema = z.object({
  type: z.enum(['openai', 'webhook']).optional().default('openai'),
  openaiAssistantId: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  specialty: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
  suggestedPrompts: z.array(z.string()).optional(),
  isPinned: z.boolean().optional().default(false),
  pinOrder: z.number().optional(),
});

// Create schema with validation refinement
const createAssistantSchema = assistantBaseSchema.refine(
  (data) => {
    if (data.type === 'openai') return !!data.openaiAssistantId;
    if (data.type === 'webhook') return !!data.webhookUrl;
    return true;
  },
  { message: 'openaiAssistantId required for openai type, webhookUrl required for webhook type' }
);

// Update schema - partial version of base schema
const updateAssistantSchema = assistantBaseSchema.partial();

// Apply auth middleware to all routes
assistantsRoutes.use('*', authMiddleware);

// GET /api/assistants/openai - List all OpenAI assistants (admin only)
assistantsRoutes.get('/openai', adminMiddleware, async (c) => {
  try {
    const openaiAssistants = await listOpenAIAssistants();
    return c.json({
      success: true,
      data: openaiAssistants,
    });
  } catch (error) {
    console.error('Error fetching OpenAI assistants:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch OpenAI assistants',
      },
      500
    );
  }
});

// GET /api/assistants/openai/:id - Get a specific OpenAI assistant details (admin only)
assistantsRoutes.get('/openai/:id', adminMiddleware, async (c) => {
  const id = c.req.param('id');
  try {
    const assistant = await getOpenAIAssistant(id);
    return c.json({
      success: true,
      data: assistant,
    });
  } catch (error) {
    console.error('Error fetching OpenAI assistant:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch OpenAI assistant',
      },
      500
    );
  }
});

// GET /api/assistants - List all active assistants (pinned first, then by name)
assistantsRoutes.get('/', async (c) => {
  const assistants = await db
    .select()
    .from(schema.assistants)
    .where(eq(schema.assistants.isActive, true))
    .orderBy(
      desc(schema.assistants.isPinned),
      asc(schema.assistants.pinOrder),
      asc(schema.assistants.name)
    );

  return c.json({
    success: true,
    data: assistants.map((a) => ({
      id: a.id,
      type: a.type,
      openaiAssistantId: a.openaiAssistantId,
      webhookUrl: a.webhookUrl,
      name: a.name,
      description: a.description,
      specialty: a.specialty,
      icon: a.icon,
      color: a.color,
      suggestedPrompts: a.suggestedPrompts || [],
      isPinned: a.isPinned,
      pinOrder: a.pinOrder,
      isActive: a.isActive,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })),
  });
});

// GET /api/assistants/:id - Get assistant details
assistantsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [assistant] = await db
    .select()
    .from(schema.assistants)
    .where(eq(schema.assistants.id, id))
    .limit(1);

  if (!assistant) {
    return c.json({ success: false, error: 'Assistant not found' }, 404);
  }

  return c.json({
    success: true,
    data: {
      id: assistant.id,
      type: assistant.type,
      openaiAssistantId: assistant.openaiAssistantId,
      webhookUrl: assistant.webhookUrl,
      name: assistant.name,
      description: assistant.description,
      specialty: assistant.specialty,
      icon: assistant.icon,
      color: assistant.color,
      suggestedPrompts: assistant.suggestedPrompts || [],
      isPinned: assistant.isPinned,
      pinOrder: assistant.pinOrder,
      isActive: assistant.isActive,
      createdAt: assistant.createdAt,
      updatedAt: assistant.updatedAt,
    },
  });
});

// POST /api/assistants - Create new assistant (admin only)
assistantsRoutes.post('/', adminMiddleware, zValidator('json', createAssistantSchema), async (c) => {
  const data = c.req.valid('json');
  const now = new Date();

  const [assistant] = await db.insert(schema.assistants).values({
    type: data.type || 'openai',
    openaiAssistantId: data.openaiAssistantId || null,
    webhookUrl: data.webhookUrl || null,
    name: data.name,
    description: data.description,
    specialty: data.specialty,
    icon: data.icon,
    color: data.color,
    suggestedPrompts: data.suggestedPrompts || [],
    isPinned: data.isPinned || false,
    pinOrder: data.pinOrder || 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return c.json(
    {
      success: true,
      data: {
        id: assistant.id,
        type: assistant.type,
        openaiAssistantId: assistant.openaiAssistantId,
        webhookUrl: assistant.webhookUrl,
        name: assistant.name,
        description: assistant.description,
        specialty: assistant.specialty,
        icon: assistant.icon,
        color: assistant.color,
        suggestedPrompts: assistant.suggestedPrompts || [],
        isPinned: assistant.isPinned,
        pinOrder: assistant.pinOrder,
        isActive: assistant.isActive,
        createdAt: assistant.createdAt,
        updatedAt: assistant.updatedAt,
      },
    },
    201
  );
});

// PUT /api/assistants/:id - Update assistant (admin only)
assistantsRoutes.put('/:id', adminMiddleware, zValidator('json', updateAssistantSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [existing] = await db
    .select()
    .from(schema.assistants)
    .where(eq(schema.assistants.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Assistant not found' }, 404);
  }

  await db
    .update(schema.assistants)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.assistants.id, id));

  const [assistant] = await db
    .select()
    .from(schema.assistants)
    .where(eq(schema.assistants.id, id))
    .limit(1);

  return c.json({
    success: true,
    data: {
      id: assistant.id,
      type: assistant.type,
      openaiAssistantId: assistant.openaiAssistantId,
      webhookUrl: assistant.webhookUrl,
      name: assistant.name,
      description: assistant.description,
      specialty: assistant.specialty,
      icon: assistant.icon,
      color: assistant.color,
      suggestedPrompts: assistant.suggestedPrompts || [],
      isPinned: assistant.isPinned,
      pinOrder: assistant.pinOrder,
      isActive: assistant.isActive,
      createdAt: assistant.createdAt,
      updatedAt: assistant.updatedAt,
    },
  });
});

// DELETE /api/assistants/:id - Delete assistant (admin only)
assistantsRoutes.delete('/:id', adminMiddleware, async (c) => {
  const id = c.req.param('id');

  const [existing] = await db
    .select()
    .from(schema.assistants)
    .where(eq(schema.assistants.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Assistant not found' }, 404);
  }

  // Soft delete by setting isActive to false
  await db
    .update(schema.assistants)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(schema.assistants.id, id));

  return c.json({ success: true });
});

export { assistantsRoutes };
