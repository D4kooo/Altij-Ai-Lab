import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware } from '../middleware/auth';
import { streamChatCompletion, buildMessagesWithHistory } from '../services/openrouter';

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

  const now = new Date();

  const [conversation] = await db.insert(schema.conversations).values({
    userId: user.id,
    assistantId,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return c.json(
    {
      success: true,
      data: {
        id: conversation.id,
        assistantId,
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

// Helper function to call webhook assistant
async function callWebhookAssistant(
  webhookUrl: string,
  message: string,
  conversationId: string,
  previousMessages: { role: string; content: string }[]
): Promise<string> {
  const payload = {
    message,
    conversationId,
    history: previousMessages,
  };

  console.log('[Webhook Assistant] Calling webhook:', webhookUrl);
  console.log('[Webhook Assistant] Payload:', JSON.stringify(payload, null, 2));

  // Create AbortController with 5 minute timeout for AI agents
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[Webhook Assistant] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Webhook Assistant] Error response:', errorText);
      throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('[Webhook Assistant] Raw response:', responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // If not JSON, return the text directly
      console.log('[Webhook Assistant] Response is not JSON, returning as text');
      return responseText;
    }

    console.log('[Webhook Assistant] Parsed response data:', JSON.stringify(data, null, 2).substring(0, 500));

    // Support both direct response and nested output format from n8n
    return data.output || data.response || data.message || data.text || JSON.stringify(data);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Webhook timeout: l\'agent IA prend trop de temps à répondre');
    }
    throw error;
  }
}

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

    // Update conversation title if this is the first message
    if (!conversation.title) {
      const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
      await db
        .update(schema.conversations)
        .set({ title, updatedAt: new Date() })
        .where(eq(schema.conversations.id, conversationId));
    }

    // Handle webhook assistants differently
    if (assistant.type === 'webhook' && assistant.webhookUrl) {
      // Get previous messages for context
      const previousMessages = await db
        .select({ role: schema.messages.role, content: schema.messages.content })
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, conversationId))
        .orderBy(schema.messages.createdAt);

      return streamSSE(c, async (stream) => {
        // Send heartbeat to keep connection alive while waiting for webhook
        const heartbeatInterval = setInterval(async () => {
          try {
            await stream.writeSSE({
              data: JSON.stringify({ heartbeat: true }),
            });
            console.log('[Webhook Assistant] Heartbeat sent');
          } catch {
            // Stream might be closed, ignore
          }
        }, 5000); // Every 5 seconds

        try {
          console.log('[Webhook Assistant] Starting webhook call...');
          const fullResponse = await callWebhookAssistant(
            assistant.webhookUrl!,
            content,
            conversationId,
            previousMessages
          );
          console.log('[Webhook Assistant] Webhook call completed');

          clearInterval(heartbeatInterval);

          // Send the full response as a single chunk (webhooks don't stream)
          await stream.writeSSE({
            data: JSON.stringify({ chunk: fullResponse }),
          });

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
          clearInterval(heartbeatInterval);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('[Webhook Assistant] Error:', errorMessage);
          await stream.writeSSE({
            data: JSON.stringify({ error: errorMessage }),
          });
        }
      });
    }

    // OpenRouter assistant flow
    if (assistant.type === 'openrouter') {
      if (!assistant.model) {
        return c.json({ success: false, error: 'Assistant model not configured' }, 400);
      }

      // Get previous messages for context (excluding the one we just added)
      const previousMessages = await db
        .select({ role: schema.messages.role, content: schema.messages.content })
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, conversationId))
        .orderBy(schema.messages.createdAt);

      // Build messages with system prompt and history
      const messages = buildMessagesWithHistory(
        assistant.systemPrompt,
        previousMessages.slice(0, -1), // Exclude the message we just added
        content
      );

      // Stream response
      return streamSSE(c, async (stream) => {
        let fullResponse = '';

        try {
          for await (const chunk of streamChatCompletion(
            assistant.model!,
            messages,
            {
              temperature: assistant.temperature ?? 0.7,
              maxTokens: assistant.maxTokens ?? 4096,
            }
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
          console.error('[OpenRouter] Error:', errorMessage);
          await stream.writeSSE({
            data: JSON.stringify({ error: errorMessage }),
          });
        }
      });
    }

    return c.json({ success: false, error: 'Invalid assistant configuration' }, 400);
  }
);

// POST /api/chat/conversations/:id/upload - Upload a file for the conversation
// Returns base64 encoded file for multimodal use with OpenRouter
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
    // Convert file to base64 for multimodal use
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Generate a unique ID for the file
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return c.json({
      success: true,
      data: {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        base64, // Return base64 for client-side storage/use
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

export { chatRoutes };
