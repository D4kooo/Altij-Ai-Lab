import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, schema } from '../db';
import { eq, desc } from 'drizzle-orm';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import type { Env } from '../types';

const mcpServersRoutes = new Hono<Env>();
mcpServersRoutes.use('*', authMiddleware);
mcpServersRoutes.use('*', adminMiddleware);

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  transport: z.enum(['stdio', 'sse']),
  config: z.record(z.unknown()),
});

const updateSchema = createSchema.partial();

// GET /api/mcp-servers - List all MCP servers
mcpServersRoutes.get('/', async (c) => {
  const servers = await db
    .select()
    .from(schema.mcpServers)
    .orderBy(desc(schema.mcpServers.createdAt));

  return c.json({ success: true, data: servers });
});

// POST /api/mcp-servers - Create a new MCP server
mcpServersRoutes.post('/', zValidator('json', createSchema), async (c) => {
  const data = c.req.valid('json');

  const [server] = await db
    .insert(schema.mcpServers)
    .values({
      name: data.name,
      description: data.description || '',
      transport: data.transport,
      config: data.config,
    })
    .returning();

  return c.json({ success: true, data: server });
});

// PUT /api/mcp-servers/:id - Update an MCP server
mcpServersRoutes.put('/:id', zValidator('json', updateSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [server] = await db
    .update(schema.mcpServers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.mcpServers.id, id))
    .returning();

  if (!server) {
    return c.json({ success: false, error: 'Server not found' }, 404);
  }

  return c.json({ success: true, data: server });
});

// DELETE /api/mcp-servers/:id - Delete an MCP server
mcpServersRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  await db.delete(schema.mcpServers).where(eq(schema.mcpServers.id, id));

  return c.json({ success: true });
});

// GET /api/mcp-servers/:id/tools - List tools from a server
mcpServersRoutes.get('/:id/tools', async (c) => {
  const id = c.req.param('id');

  const [server] = await db
    .select()
    .from(schema.mcpServers)
    .where(eq(schema.mcpServers.id, id));

  if (!server) {
    return c.json({ success: false, error: 'Server not found' }, 404);
  }

  try {
    const { listMcpTools } = await import('../services/mcp-client');
    const tools = await listMcpTools(server);
    return c.json({ success: true, data: tools });
  } catch (error) {
    return c.json({ success: false, error: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// POST /api/mcp-servers/:id/test - Test connection to a server
mcpServersRoutes.post('/:id/test', async (c) => {
  const id = c.req.param('id');

  const [server] = await db
    .select()
    .from(schema.mcpServers)
    .where(eq(schema.mcpServers.id, id));

  if (!server) {
    return c.json({ success: false, error: 'Server not found' }, 404);
  }

  try {
    const { listMcpTools } = await import('../services/mcp-client');
    const tools = await listMcpTools(server);
    return c.json({ success: true, data: { connected: true, toolCount: tools.length, tools } });
  } catch (error) {
    return c.json({ success: true, data: { connected: false, error: error instanceof Error ? error.message : 'Unknown error' } });
  }
});

export default mcpServersRoutes;
