import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  processDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  isSupportedMimeType,
  getSupportedExtensions,
} from '../services/documents';

const documentsRoutes = new Hono<Env>();

// Apply auth middleware to all routes
documentsRoutes.use('*', authMiddleware);

// All document management requires admin role
documentsRoutes.use('*', adminMiddleware);

// GET /api/assistants/:assistantId/documents - List documents for an assistant
documentsRoutes.get('/:assistantId/documents', async (c) => {
  const assistantId = c.req.param('assistantId');

  // Verify assistant exists
  const [assistant] = await db
    .select({ id: schema.assistants.id })
    .from(schema.assistants)
    .where(eq(schema.assistants.id, assistantId))
    .limit(1);

  if (!assistant) {
    return c.json({ success: false, error: 'Assistant not found' }, 404);
  }

  try {
    const documents = await listDocuments(assistantId);

    return c.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Documents] List error:', message);

    // Check if it's a missing table error
    if (message.includes('relation') && message.includes('does not exist')) {
      return c.json({
        success: false,
        error: 'La base de connaissances n\'est pas configurée. Veuillez exécuter la migration 0004_assistant_documents.sql dans Supabase.',
      }, 503);
    }

    return c.json({
      success: false,
      error: message,
    }, 500);
  }
});

// POST /api/assistants/:assistantId/documents - Upload a document
documentsRoutes.post('/:assistantId/documents', async (c) => {
  const assistantId = c.req.param('assistantId');

  // Verify assistant exists
  const [assistant] = await db
    .select({ id: schema.assistants.id, type: schema.assistants.type })
    .from(schema.assistants)
    .where(eq(schema.assistants.id, assistantId))
    .limit(1);

  if (!assistant) {
    return c.json({ success: false, error: 'Assistant not found' }, 404);
  }

  // Only openrouter assistants can have documents (webhooks handle their own context)
  if (assistant.type !== 'openrouter') {
    return c.json({
      success: false,
      error: 'Les documents ne sont supportés que pour les assistants OpenRouter',
    }, 400);
  }

  // Parse multipart form data
  const formData = await c.req.formData();
  const file = formData.get('file');
  const name = formData.get('name');

  if (!file || !(file instanceof File)) {
    return c.json({ success: false, error: 'Fichier requis' }, 400);
  }

  // Validate file type
  if (!isSupportedMimeType(file.type)) {
    return c.json({
      success: false,
      error: `Type de fichier non supporté. Extensions acceptées: ${getSupportedExtensions().join(', ')}`,
    }, 400);
  }

  // Validate file size (20MB max)
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return c.json({
      success: false,
      error: 'Le fichier dépasse la taille maximale de 20MB',
    }, 400);
  }

  try {
    const document = await processDocument(
      file,
      assistantId,
      typeof name === 'string' ? name : undefined
    );

    return c.json({
      success: true,
      data: document,
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du traitement du document';
    console.error('[Documents] Upload error:', message);
    return c.json({
      success: false,
      error: message,
    }, 500);
  }
});

// GET /api/assistants/:assistantId/documents/:documentId - Get a single document
documentsRoutes.get('/:assistantId/documents/:documentId', async (c) => {
  const assistantId = c.req.param('assistantId');
  const documentId = c.req.param('documentId');

  const document = await getDocument(documentId);

  if (!document) {
    return c.json({ success: false, error: 'Document not found' }, 404);
  }

  // Verify document belongs to the assistant
  const [dbDoc] = await db
    .select({ assistantId: schema.assistantDocuments.assistantId })
    .from(schema.assistantDocuments)
    .where(eq(schema.assistantDocuments.id, documentId))
    .limit(1);

  if (dbDoc?.assistantId !== assistantId) {
    return c.json({ success: false, error: 'Document not found' }, 404);
  }

  return c.json({
    success: true,
    data: document,
  });
});

// DELETE /api/assistants/:assistantId/documents/:documentId - Delete a document
documentsRoutes.delete('/:assistantId/documents/:documentId', async (c) => {
  const assistantId = c.req.param('assistantId');
  const documentId = c.req.param('documentId');

  // Verify document exists and belongs to the assistant
  const [document] = await db
    .select()
    .from(schema.assistantDocuments)
    .where(eq(schema.assistantDocuments.id, documentId))
    .limit(1);

  if (!document) {
    return c.json({ success: false, error: 'Document not found' }, 404);
  }

  if (document.assistantId !== assistantId) {
    return c.json({ success: false, error: 'Document not found' }, 404);
  }

  await deleteDocument(documentId);

  return c.json({ success: true });
});

// GET /api/assistants/documents/supported-types - Get supported file types
documentsRoutes.get('/supported-types', async (c) => {
  return c.json({
    success: true,
    data: {
      extensions: getSupportedExtensions(),
      mimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
      ],
      maxSize: 20 * 1024 * 1024, // 20MB
    },
  });
});

export { documentsRoutes };
