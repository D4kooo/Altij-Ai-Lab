import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { eq, and, desc, inArray } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { triggerWorkflow, buildCallbackUrl, validateCallbackPayload } from '../services/n8n';
import { getAccessibleResourceIds } from '../services/permissions';
import type { InputField } from '@altij/shared';

const automationsRoutes = new Hono<Env>();

const inputFieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'textarea', 'number', 'select', 'file', 'multifile', 'date', 'checkbox']),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  accept: z.string().optional(),
  maxFiles: z.number().optional(),
  helpText: z.string().optional(),
});

const createAutomationSchema = z.object({
  n8nWorkflowId: z.string().min(1),
  n8nWebhookUrl: z.string().url(),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
  inputSchema: z.array(inputFieldSchema),
  outputType: z.enum(['file', 'text', 'json', 'redirect']),
  estimatedDuration: z.number().optional(),
});

const updateAutomationSchema = createAutomationSchema.partial();

const runAutomationSchema = z.object({
  inputs: z.record(z.unknown()),
  files: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        mimeType: z.string(),
      })
    )
    .optional(),
});

// Public callback endpoint (no auth required - called by n8n)
automationsRoutes.post('/callback', async (c) => {
  const body = await c.req.json();
  const payload = validateCallbackPayload(body);

  if (!payload) {
    return c.json({ success: false, error: 'Invalid callback payload' }, 400);
  }

  const { runId, status, result } = payload;

  // Get the run
  const [run] = await db
    .select()
    .from(schema.automationRuns)
    .where(eq(schema.automationRuns.id, runId))
    .limit(1);

  if (!run) {
    return c.json({ success: false, error: 'Run not found' }, 404);
  }

  // Update the run
  await db
    .update(schema.automationRuns)
    .set({
      status,
      output: result?.output || null,
      outputFileUrl: result?.fileUrl || null,
      errorMessage: result?.error || null,
      completedAt: new Date(),
    })
    .where(eq(schema.automationRuns.id, runId));

  return c.json({ success: true });
});

// Apply auth middleware to all other routes
automationsRoutes.use('*', authMiddleware);

// GET /api/automations - List all active automations
// Filters by user permissions (admins see all)
automationsRoutes.get('/', async (c) => {
  const user = c.get('user')!;

  // Récupérer les IDs accessibles (null = admin, tout accessible)
  const accessibleIds = await getAccessibleResourceIds(user.id, user.role, 'automation');

  // Si aucune permission et pas admin, retourner liste vide
  if (accessibleIds !== null && accessibleIds.length === 0) {
    return c.json({ success: true, data: [] });
  }

  const automations = await db
    .select()
    .from(schema.automations)
    .where(eq(schema.automations.isActive, true))
    .orderBy(schema.automations.name);

  // Filtrer par permissions si pas admin
  const filteredAutomations = accessibleIds === null
    ? automations
    : automations.filter((a) => accessibleIds.includes(a.id));

  return c.json({
    success: true,
    data: filteredAutomations.map((a) => ({
      id: a.id,
      n8nWorkflowId: a.n8nWorkflowId,
      name: a.name,
      description: a.description,
      category: a.category,
      icon: a.icon,
      color: a.color,
      inputSchema: a.inputSchema || [],
      outputType: a.outputType,
      estimatedDuration: a.estimatedDuration,
      isActive: a.isActive,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })),
  });
});

// GET /api/automations/runs - List user's automation runs
automationsRoutes.get('/runs', async (c) => {
  const user = c.get('user');

  const runs = await db
    .select({
      id: schema.automationRuns.id,
      automationId: schema.automationRuns.automationId,
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
    .limit(50);

  return c.json({
    success: true,
    data: runs.map((run) => ({
      id: run.id,
      automationId: run.automationId,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      automation: {
        name: run.automationName,
        icon: run.automationIcon,
        color: run.automationColor,
      },
    })),
  });
});

// GET /api/automations/runs/:id - Get run details
automationsRoutes.get('/runs/:id', async (c) => {
  const user = c.get('user');
  const runId = c.req.param('id');

  const [run] = await db
    .select()
    .from(schema.automationRuns)
    .where(and(eq(schema.automationRuns.id, runId), eq(schema.automationRuns.userId, user.id)))
    .limit(1);

  if (!run) {
    return c.json({ success: false, error: 'Run not found' }, 404);
  }

  const [automation] = await db
    .select()
    .from(schema.automations)
    .where(eq(schema.automations.id, run.automationId))
    .limit(1);

  return c.json({
    success: true,
    data: {
      id: run.id,
      automationId: run.automationId,
      status: run.status,
      input: run.input,
      output: run.output,
      outputFileUrl: run.outputFileUrl,
      errorMessage: run.errorMessage,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      automation: automation
        ? {
            id: automation.id,
            name: automation.name,
            icon: automation.icon,
            color: automation.color,
            outputType: automation.outputType,
          }
        : null,
    },
  });
});

// GET /api/automations/runs/:id/download - Download run output file
automationsRoutes.get('/runs/:id/download', async (c) => {
  const user = c.get('user');
  const runId = c.req.param('id');

  const [run] = await db
    .select()
    .from(schema.automationRuns)
    .where(and(eq(schema.automationRuns.id, runId), eq(schema.automationRuns.userId, user.id)))
    .limit(1);

  if (!run) {
    return c.json({ success: false, error: 'Run not found' }, 404);
  }

  if (!run.outputFileUrl) {
    return c.json({ success: false, error: 'No output file available' }, 404);
  }

  // Redirect to the file URL or proxy it
  return c.redirect(run.outputFileUrl);
});

// GET /api/automations/:id - Get automation details
automationsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [automation] = await db
    .select()
    .from(schema.automations)
    .where(eq(schema.automations.id, id))
    .limit(1);

  if (!automation) {
    return c.json({ success: false, error: 'Automation not found' }, 404);
  }

  return c.json({
    success: true,
    data: {
      id: automation.id,
      n8nWorkflowId: automation.n8nWorkflowId,
      n8nWebhookUrl: automation.n8nWebhookUrl,
      name: automation.name,
      description: automation.description,
      category: automation.category,
      icon: automation.icon,
      color: automation.color,
      inputSchema: automation.inputSchema || [],
      outputType: automation.outputType,
      estimatedDuration: automation.estimatedDuration,
      isActive: automation.isActive,
      createdAt: automation.createdAt,
      updatedAt: automation.updatedAt,
    },
  });
});

// POST /api/automations - Create new automation (admin only)
automationsRoutes.post('/', adminMiddleware, zValidator('json', createAutomationSchema), async (c) => {
  const data = c.req.valid('json');
  const id = nanoid();
  const now = new Date();

  await db.insert(schema.automations).values({
    id,
    n8nWorkflowId: data.n8nWorkflowId,
    n8nWebhookUrl: data.n8nWebhookUrl,
    name: data.name,
    description: data.description,
    category: data.category,
    icon: data.icon,
    color: data.color,
    inputSchema: data.inputSchema as InputField[],
    outputType: data.outputType,
    estimatedDuration: data.estimatedDuration || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const [automation] = await db
    .select()
    .from(schema.automations)
    .where(eq(schema.automations.id, id))
    .limit(1);

  return c.json(
    {
      success: true,
      data: {
        id: automation.id,
        n8nWorkflowId: automation.n8nWorkflowId,
        name: automation.name,
        description: automation.description,
        category: automation.category,
        icon: automation.icon,
        color: automation.color,
        inputSchema: automation.inputSchema || [],
        outputType: automation.outputType,
        estimatedDuration: automation.estimatedDuration,
        isActive: automation.isActive,
        createdAt: automation.createdAt,
        updatedAt: automation.updatedAt,
      },
    },
    201
  );
});

// PUT /api/automations/:id - Update automation (admin only)
automationsRoutes.put('/:id', adminMiddleware, zValidator('json', updateAutomationSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [existing] = await db
    .select()
    .from(schema.automations)
    .where(eq(schema.automations.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Automation not found' }, 404);
  }

  await db
    .update(schema.automations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.automations.id, id));

  const [automation] = await db
    .select()
    .from(schema.automations)
    .where(eq(schema.automations.id, id))
    .limit(1);

  return c.json({
    success: true,
    data: {
      id: automation.id,
      n8nWorkflowId: automation.n8nWorkflowId,
      name: automation.name,
      description: automation.description,
      category: automation.category,
      icon: automation.icon,
      color: automation.color,
      inputSchema: automation.inputSchema || [],
      outputType: automation.outputType,
      estimatedDuration: automation.estimatedDuration,
      isActive: automation.isActive,
      createdAt: automation.createdAt,
      updatedAt: automation.updatedAt,
    },
  });
});

// DELETE /api/automations/:id - Delete automation (admin only)
automationsRoutes.delete('/:id', adminMiddleware, async (c) => {
  const id = c.req.param('id');

  const [existing] = await db
    .select()
    .from(schema.automations)
    .where(eq(schema.automations.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Automation not found' }, 404);
  }

  // Soft delete
  await db
    .update(schema.automations)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(schema.automations.id, id));

  return c.json({ success: true });
});

// POST /api/automations/:id/run - Run an automation
automationsRoutes.post('/:id/run', zValidator('json', runAutomationSchema), async (c) => {
  const user = c.get('user');
  const automationId = c.req.param('id');
  const { inputs, files } = c.req.valid('json');

  // Get automation
  const [automation] = await db
    .select()
    .from(schema.automations)
    .where(and(eq(schema.automations.id, automationId), eq(schema.automations.isActive, true)))
    .limit(1);

  if (!automation) {
    return c.json({ success: false, error: 'Automation not found' }, 404);
  }

  // Create run record
  const runId = nanoid();
  const now = new Date();

  await db.insert(schema.automationRuns).values({
    id: runId,
    automationId,
    userId: user.id,
    status: 'pending',
    input: inputs,
    startedAt: now,
  });

  // Trigger n8n workflow
  try {
    await triggerWorkflow(automation.n8nWebhookUrl, {
      automationRunId: runId,
      userId: user.id,
      inputs,
      files,
      callbackUrl: buildCallbackUrl(runId),
    });

    // Update status to running
    await db
      .update(schema.automationRuns)
      .set({ status: 'running' })
      .where(eq(schema.automationRuns.id, runId));

    return c.json({
      success: true,
      data: {
        runId,
        status: 'running',
        automationId,
        startedAt: now,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to trigger workflow';

    // Update status to failed
    await db
      .update(schema.automationRuns)
      .set({
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
      })
      .where(eq(schema.automationRuns.id, runId));

    return c.json({ success: false, error: errorMessage }, 500);
  }
});

export { automationsRoutes };
