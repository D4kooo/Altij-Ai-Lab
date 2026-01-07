import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware } from '../middleware/auth';
import {
  createThread,
  addMessageToThread,
  runAssistantStream,
  uploadFile,
} from '../services/openai';

const chatRoutes = new Hono<Env>();

const createConversationSchema = z.object({
  assistantId: z.string().min(1),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  attachments: z.array(z.string()).optional(),
});

// Apply auth middleware to all routes
chatRoutes.use('*', authMiddleware);

// GET /api/chat/conversations - List user's conversations
chatRoutes.get('/conversations', async (c) => {
  const user = c.get('user');

  const conversations = await db
    .select({
      id: schema.conversations.id,
      assistantId: schema.conversations.assistantId,
      title: schema.conversations.title,
      createdAt: schema.conversations.createdAt,
      updatedAt: schema.conversations.updatedAt,
      assistantName: schema.assistants.name,
      assistantIcon: schema.assistants.icon,
      assistantColor: schema.assistants.color,
    })
    .from(schema.conversations)
    .leftJoin(schema.assistants, eq(schema.conversations.assistantId, schema.assistants.id))
    .where(eq(schema.conversations.userId, user.id))
    .orderBy(desc(schema.conversations.updatedAt));

  return c.json({
    success: true,
    data: conversations.map((conv) => ({
      id: conv.id,
      assistantId: conv.assistantId,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      assistant: {
        name: conv.assistantName,
        icon: conv.assistantIcon,
        color: conv.assistantColor,
      },
    })),
  });
});

// POST /api/chat/conversations - Create a new conversation
chatRoutes.post('/conversations', zValidator('json', createConversationSchema), async (c) => {
  const user = c.get('user');
  const { assistantId } = c.req.valid('json');

  // Verify assistant exists and is active
  const [assistant] = await db
    .select()
    .from(schema.assistants)
    .where(and(eq(schema.assistants.id, assistantId), eq(schema.assistants.isActive, true)))
    .limit(1);

  if (!assistant) {
    return c.json({ success: false, error: 'Assistant not found' }, 404);
  }

  // Create OpenAI thread
  const openaiThreadId = await createThread();

  const now = new Date();

  const [conversation] = await db.insert(schema.conversations).values({
    userId: user.id,
    assistantId,
    openaiThreadId,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return c.json(
    {
      success: true,
      data: {
        id: conversation.id,
        assistantId,
        openaiThreadId,
        title: null,
        createdAt: now,
        updatedAt: now,
        assistant: {
          id: assistant.id,
          name: assistant.name,
          icon: assistant.icon,
          color: assistant.color,
          suggestedPrompts: assistant.suggestedPrompts || [],
        },
      },
    },
    201
  );
});

// GET /api/chat/conversations/:id - Get conversation with messages
chatRoutes.get('/conversations/:id', async (c) => {
  const user = c.get('user');
  const conversationId = c.req.param('id');

  const [conversation] = await db
    .select()
    .from(schema.conversations)
    .where(and(eq(schema.conversations.id, conversationId), eq(schema.conversations.userId, user.id)))
    .limit(1);

  if (!conversation) {
    return c.json({ success: false, error: 'Conversation not found' }, 404);
  }

  const [assistant] = await db
    .select()
    .from(schema.assistants)
    .where(eq(schema.assistants.id, conversation.assistantId))
    .limit(1);

  const messages = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(schema.messages.createdAt);

  return c.json({
    success: true,
    data: {
      id: conversation.id,
      assistantId: conversation.assistantId,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      assistant: assistant
        ? {
            id: assistant.id,
            name: assistant.name,
            icon: assistant.icon,
            color: assistant.color,
            specialty: assistant.specialty,
            suggestedPrompts: assistant.suggestedPrompts || [],
          }
        : null,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
      })),
    },
  });
});

// DELETE /api/chat/conversations/:id - Delete a conversation
chatRoutes.delete('/conversations/:id', async (c) => {
  const user = c.get('user');
  const conversationId = c.req.param('id');

  const [conversation] = await db
    .select()
    .from(schema.conversations)
    .where(and(eq(schema.conversations.id, conversationId), eq(schema.conversations.userId, user.id)))
    .limit(1);

  if (!conversation) {
    return c.json({ success: false, error: 'Conversation not found' }, 404);
  }

  await db.delete(schema.conversations).where(eq(schema.conversations.id, conversationId));

  return c.json({ success: true });
});

// POST /api/chat/conversations/:id/messages - Send a message (with streaming response)
chatRoutes.post(
  '/conversations/:id/messages',
  zValidator('json', sendMessageSchema),
  async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('id');
    const { content, attachments } = c.req.valid('json');

    // Get conversation and verify ownership
    const [conversation] = await db
      .select()
      .from(schema.conversations)
      .where(and(eq(schema.conversations.id, conversationId), eq(schema.conversations.userId, user.id)))
      .limit(1);

    if (!conversation) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }

    // Get assistant
    const [assistant] = await db
      .select()
      .from(schema.assistants)
      .where(eq(schema.assistants.id, conversation.assistantId))
      .limit(1);

    if (!assistant) {
      return c.json({ success: false, error: 'Assistant not found' }, 404);
    }

    // Save user message to DB
    const userMessageTime = new Date();

    await db.insert(schema.messages).values({
      conversationId,
      role: 'user',
      content,
      attachments: attachments || null,
      createdAt: userMessageTime,
    });

    // Add message to OpenAI thread
    await addMessageToThread(conversation.openaiThreadId, content, attachments);

    // Update conversation title if this is the first message
    if (!conversation.title) {
      const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
      await db
        .update(schema.conversations)
        .set({ title, updatedAt: new Date() })
        .where(eq(schema.conversations.id, conversationId));
    }

    // Stream response
    return streamSSE(c, async (stream) => {
      let fullResponse = '';

      try {
        for await (const chunk of runAssistantStream(
          conversation.openaiThreadId,
          assistant.openaiAssistantId
        )) {
          fullResponse += chunk;
          await stream.writeSSE({
            data: JSON.stringify({ chunk }),
          });
        }

        // Save assistant message to DB
        const [assistantMessage] = await db.insert(schema.messages).values({
          conversationId,
          role: 'assistant',
          content: fullResponse,
          createdAt: new Date(),
        }).returning();

        // Update conversation timestamp
        await db
          .update(schema.conversations)
          .set({ updatedAt: new Date() })
          .where(eq(schema.conversations.id, conversationId));

        await stream.writeSSE({
          data: JSON.stringify({
            done: true,
            messageId: assistantMessage.id,
            content: fullResponse,
          }),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await stream.writeSSE({
          data: JSON.stringify({ error: errorMessage }),
        });
      }
    });
  }
);

// POST /api/chat/conversations/:id/upload - Upload a file for the conversation
chatRoutes.post('/conversations/:id/upload', async (c) => {
  const user = c.get('user');
  const conversationId = c.req.param('id');

  // Verify conversation ownership
  const [conversation] = await db
    .select()
    .from(schema.conversations)
    .where(and(eq(schema.conversations.id, conversationId), eq(schema.conversations.userId, user.id)))
    .limit(1);

  if (!conversation) {
    return c.json({ success: false, error: 'Conversation not found' }, 404);
  }

  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return c.json({ success: false, error: 'No file provided' }, 400);
  }

  try {
    const fileId = await uploadFile(file);
    return c.json({
      success: true,
      data: {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

export { chatRoutes };
