import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware } from '../middleware/auth';
import { streamChatCompletion, listModels } from '../services/openrouter';
import { checkCreditLimit, saveApiUsage } from '../services/usage';

const segaRoutes = new Hono<Env>();

const createConversationSchema = z.object({
  model: z.string().min(1),
});

const updateConversationSchema = z.object({
  model: z.string().min(1),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
});

segaRoutes.use('*', authMiddleware);

// GET /models — List OpenRouter models
segaRoutes.get('/models', async (c) => {
  const user = c.get('user');
  if (!user.isStaff) {
    return c.json({ success: false, error: 'Staff only' }, 403);
  }

  try {
    const models = await listModels();
    return c.json({ success: true, data: models });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch models';
    return c.json({ success: false, error: msg }, 500);
  }
});

// GET /conversations — List user's sega conversations
segaRoutes.get('/conversations', async (c) => {
  const user = c.get('user');

  const conversations = await db
    .select()
    .from(schema.segaConversations)
    .where(eq(schema.segaConversations.userId, user.id))
    .orderBy(desc(schema.segaConversations.updatedAt));

  return c.json({ success: true, data: conversations });
});

// POST /conversations — Create a new sega conversation
segaRoutes.post('/conversations', zValidator('json', createConversationSchema), async (c) => {
  const user = c.get('user');
  const { model } = c.req.valid('json');

  const now = new Date();
  const [conversation] = await db.insert(schema.segaConversations).values({
    userId: user.id,
    model,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return c.json({ success: true, data: conversation }, 201);
});

// GET /conversations/:id — Get conversation with messages
segaRoutes.get('/conversations/:id', async (c) => {
  const user = c.get('user');
  const conversationId = c.req.param('id');

  const [conversation] = await db
    .select()
    .from(schema.segaConversations)
    .where(and(eq(schema.segaConversations.id, conversationId), eq(schema.segaConversations.userId, user.id)))
    .limit(1);

  if (!conversation) {
    return c.json({ success: false, error: 'Conversation not found' }, 404);
  }

  const messages = await db
    .select()
    .from(schema.segaMessages)
    .where(eq(schema.segaMessages.conversationId, conversationId))
    .orderBy(schema.segaMessages.createdAt);

  return c.json({
    success: true,
    data: {
      ...conversation,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    },
  });
});

// DELETE /conversations/:id
segaRoutes.delete('/conversations/:id', async (c) => {
  const user = c.get('user');
  const conversationId = c.req.param('id');

  const [conversation] = await db
    .select()
    .from(schema.segaConversations)
    .where(and(eq(schema.segaConversations.id, conversationId), eq(schema.segaConversations.userId, user.id)))
    .limit(1);

  if (!conversation) {
    return c.json({ success: false, error: 'Conversation not found' }, 404);
  }

  await db.delete(schema.segaConversations).where(eq(schema.segaConversations.id, conversationId));

  return c.json({ success: true });
});

// PUT /conversations/:id — Update model
segaRoutes.put('/conversations/:id', zValidator('json', updateConversationSchema), async (c) => {
  const user = c.get('user');
  const conversationId = c.req.param('id');
  const { model } = c.req.valid('json');

  const [conversation] = await db
    .select()
    .from(schema.segaConversations)
    .where(and(eq(schema.segaConversations.id, conversationId), eq(schema.segaConversations.userId, user.id)))
    .limit(1);

  if (!conversation) {
    return c.json({ success: false, error: 'Conversation not found' }, 404);
  }

  const [updated] = await db
    .update(schema.segaConversations)
    .set({ model, updatedAt: new Date() })
    .where(eq(schema.segaConversations.id, conversationId))
    .returning();

  return c.json({ success: true, data: updated });
});

// POST /conversations/:id/messages — Send message with streaming
segaRoutes.post(
  '/conversations/:id/messages',
  zValidator('json', sendMessageSchema),
  async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('id');
    const { content } = c.req.valid('json');

    const [conversation] = await db
      .select()
      .from(schema.segaConversations)
      .where(and(eq(schema.segaConversations.id, conversationId), eq(schema.segaConversations.userId, user.id)))
      .limit(1);

    if (!conversation) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }

    // Save user message
    await db.insert(schema.segaMessages).values({
      conversationId,
      role: 'user',
      content,
      createdAt: new Date(),
    });

    // Update title if first message
    if (!conversation.title) {
      const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
      await db
        .update(schema.segaConversations)
        .set({ title, updatedAt: new Date() })
        .where(eq(schema.segaConversations.id, conversationId));
    }

    // Get message history
    const previousMessages = await db
      .select({ role: schema.segaMessages.role, content: schema.segaMessages.content })
      .from(schema.segaMessages)
      .where(eq(schema.segaMessages.conversationId, conversationId))
      .orderBy(schema.segaMessages.createdAt);

    // Check credit limit before streaming
    const creditCheck = await checkCreditLimit(user.id);
    if (!creditCheck.allowed) {
      return c.json({ success: false, error: 'Limite de crédits atteinte' }, 429);
    }

    // Build messages array (no system prompt, no RAG)
    const messages = previousMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Stream response
    return streamSSE(c, async (stream) => {
      let fullResponse = '';

      try {
        const { stream: chatStream, getUsage } = streamChatCompletion(conversation.model, messages);

        for await (const chunk of chatStream) {
          fullResponse += chunk;
          await stream.writeSSE({
            data: JSON.stringify({ chunk }),
          });
        }

        // Save assistant message
        const [assistantMessage] = await db.insert(schema.segaMessages).values({
          conversationId,
          role: 'assistant',
          content: fullResponse,
          createdAt: new Date(),
        }).returning();

        // Track API usage
        const usage = getUsage();
        if (usage) {
          await saveApiUsage({
            userId: user.id,
            model: conversation.model,
            usage,
            source: 'sega',
            conversationId,
          });
        }

        // Update conversation timestamp
        await db
          .update(schema.segaConversations)
          .set({ updatedAt: new Date() })
          .where(eq(schema.segaConversations.id, conversationId));

        await stream.writeSSE({
          data: JSON.stringify({
            done: true,
            messageId: assistantMessage.id,
            content: fullResponse,
          }),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Sega] Error:', errorMessage);
        await stream.writeSSE({
          data: JSON.stringify({ error: errorMessage }),
        });
      }
    });
  }
);

export { segaRoutes };
