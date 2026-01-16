import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, asc, and } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { listModels } from '../services/openrouter';
import { getAccessibleResourceIds } from '../services/permissions';

const assistantsRoutes = new Hono<Env>();

// Base schema without refinement (for partial updates)
const assistantBaseSchema = z.object({
  type: z.enum(['openrouter', 'webhook']).optional().default('openrouter'),
  // OpenRouter configuration
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().min(100).max(128000).optional().default(4096),
  // Webhook configuration
  webhookUrl: z.string().url().optional(),
  // Metadata
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
    if (data.type === 'openrouter') return !!data.model && !!data.systemPrompt;
    if (data.type === 'webhook') return !!data.webhookUrl;
    return true;
  },
  { message: 'model and systemPrompt required for openrouter type, webhookUrl required for webhook type' }
);

// Update schema - partial version of base schema
const updateAssistantSchema = assistantBaseSchema.partial();

// Apply auth middleware to all routes
assistantsRoutes.use('*', authMiddleware);

// GET /api/assistants/models - List all available OpenRouter models (admin only)
assistantsRoutes.get('/models', adminMiddleware, async (c) => {
  try {
    const models = await listModels();

    // Sort models: popular ones first, then alphabetically
    const popularModels = [
      'anthropic/claude-sonnet-4',
      'anthropic/claude-opus-4',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'openai/gpt-4-turbo',
      'openai/gpt-4o',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-70b-instruct',
    ];

    const sorted = models.sort((a, b) => {
      const aIndex = popularModels.indexOf(a.id);
      const bIndex = popularModels.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return c.json({
      success: true,
      data: sorted,
    });
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch OpenRouter models',
      },
      500
    );
  }
});

// GET /api/assistants - List all active assistants (pinned first, then by name)
// Filters by organization and user permissions
assistantsRoutes.get('/', async (c) => {
  const user = c.get('user')!;

  // Récupérer les IDs accessibles (null = admin, tout accessible)
  const accessibleIds = await getAccessibleResourceIds(user.id, user.role, 'assistant');

  // Si aucune permission et pas admin, retourner liste vide
  if (accessibleIds !== null && accessibleIds.length === 0) {
    return c.json({ success: true, data: [] });
  }

  // Construire la requête avec filtre par organisation
  const assistants = user.organizationId
    ? await db
        .select()
        .from(schema.assistants)
        .where(
          and(
            eq(schema.assistants.isActive, true),
            eq(schema.assistants.organizationId, user.organizationId)
          )
        )
        .orderBy(
          desc(schema.assistants.isPinned),
          asc(schema.assistants.pinOrder),
          asc(schema.assistants.name)
        )
    : await db
        .select()
        .from(schema.assistants)
        .where(eq(schema.assistants.isActive, true))
        .orderBy(
          desc(schema.assistants.isPinned),
          asc(schema.assistants.pinOrder),
          asc(schema.assistants.name)
        );

  // Filtrer par permissions si pas admin de l'org
  const filteredAssistants = accessibleIds === null
    ? assistants
    : assistants.filter((a) => accessibleIds.includes(a.id));

  return c.json({
    success: true,
    data: filteredAssistants.map((a) => ({
      id: a.id,
      type: a.type,
      model: a.model,
      systemPrompt: a.systemPrompt,
      temperature: a.temperature,
      maxTokens: a.maxTokens,
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
      model: assistant.model,
      systemPrompt: assistant.systemPrompt,
      temperature: assistant.temperature,
      maxTokens: assistant.maxTokens,
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
    type: data.type || 'openrouter',
    model: data.model || 'anthropic/claude-sonnet-4',
    systemPrompt: data.systemPrompt || null,
    temperature: data.temperature ?? 0.7,
    maxTokens: data.maxTokens ?? 4096,
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
        model: assistant.model,
        systemPrompt: assistant.systemPrompt,
        temperature: assistant.temperature,
        maxTokens: assistant.maxTokens,
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
      model: assistant.model,
      systemPrompt: assistant.systemPrompt,
      temperature: assistant.temperature,
      maxTokens: assistant.maxTokens,
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
