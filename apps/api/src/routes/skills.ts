import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, schema } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import type { Env } from '../types';

const skillsRoutes = new Hono<Env>();
skillsRoutes.use('*', authMiddleware);

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  systemPromptOverride: z.string().optional(),
  tools: z.array(z.object({ id: z.string(), type: z.string(), enabled: z.boolean() })).optional(),
  dataSources: z.array(z.string()).optional(),
});

const updateSchema = createSchema.partial();

// GET /api/skills - List all skills
skillsRoutes.get('/', async (c) => {
  const skills = await db
    .select()
    .from(schema.skills)
    .where(eq(schema.skills.isActive, true))
    .orderBy(desc(schema.skills.createdAt));

  return c.json({ success: true, data: skills });
});

// POST /api/skills - Create a skill (admin only)
skillsRoutes.post('/', adminMiddleware, zValidator('json', createSchema), async (c) => {
  const data = c.req.valid('json');

  const [skill] = await db
    .insert(schema.skills)
    .values({
      name: data.name,
      description: data.description || '',
      icon: data.icon || 'Zap',
      color: data.color || '#6366f1',
      systemPromptOverride: data.systemPromptOverride || null,
      tools: data.tools || [],
      dataSources: data.dataSources || [],
    })
    .returning();

  return c.json({ success: true, data: skill });
});

// PUT /api/skills/:id - Update a skill (admin only)
skillsRoutes.put('/:id', adminMiddleware, zValidator('json', updateSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [skill] = await db
    .update(schema.skills)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.skills.id, id))
    .returning();

  if (!skill) {
    return c.json({ success: false, error: 'Skill not found' }, 404);
  }

  return c.json({ success: true, data: skill });
});

// DELETE /api/skills/:id - Delete a skill (admin only)
skillsRoutes.delete('/:id', adminMiddleware, async (c) => {
  const id = c.req.param('id');
  await db.delete(schema.skills).where(eq(schema.skills.id, id));
  return c.json({ success: true });
});

// GET /api/skills/assistant/:assistantId - Get skills for an assistant
skillsRoutes.get('/assistant/:assistantId', async (c) => {
  const assistantId = c.req.param('assistantId');

  const links = await db
    .select({
      skill: schema.skills,
      isDefault: schema.assistantSkills.isDefault,
    })
    .from(schema.assistantSkills)
    .innerJoin(schema.skills, eq(schema.assistantSkills.skillId, schema.skills.id))
    .where(
      and(
        eq(schema.assistantSkills.assistantId, assistantId),
        eq(schema.skills.isActive, true)
      )
    );

  return c.json({ success: true, data: links.map((l) => ({ ...l.skill, isDefault: l.isDefault })) });
});

// POST /api/skills/assistant/:assistantId/link - Link a skill to an assistant (admin only)
skillsRoutes.post('/assistant/:assistantId/link', adminMiddleware, zValidator('json', z.object({
  skillId: z.string().uuid(),
  isDefault: z.boolean().optional(),
})), async (c) => {
  const assistantId = c.req.param('assistantId');
  const { skillId, isDefault } = c.req.valid('json');

  const [link] = await db
    .insert(schema.assistantSkills)
    .values({ assistantId, skillId, isDefault: isDefault ?? false })
    .returning();

  return c.json({ success: true, data: link });
});

// DELETE /api/skills/assistant/:assistantId/unlink/:skillId - Unlink a skill (admin only)
skillsRoutes.delete('/assistant/:assistantId/unlink/:skillId', adminMiddleware, async (c) => {
  const assistantId = c.req.param('assistantId');
  const skillId = c.req.param('skillId');

  await db
    .delete(schema.assistantSkills)
    .where(
      and(
        eq(schema.assistantSkills.assistantId, assistantId),
        eq(schema.assistantSkills.skillId, skillId)
      )
    );

  return c.json({ success: true });
});

export default skillsRoutes;
