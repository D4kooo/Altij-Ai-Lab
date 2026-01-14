import { eq, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import { extractTextFromPDF } from './pdf-ocr';
import { chunkText, generateEmbeddings, estimateTokens } from './embeddings';

// Supported MIME types
const SUPPORTED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'text/plain': 'txt',
  'text/markdown': 'md',
} as const;

export interface ProcessedDocument {
  id: string;
  name: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  status: 'processing' | 'ready' | 'error';
  chunksCount: number;
  createdAt: Date;
}

/**
 * Extract text from a document based on its MIME type
 */
export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  const type = SUPPORTED_MIME_TYPES[mimeType as keyof typeof SUPPORTED_MIME_TYPES];

  if (!type) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  switch (type) {
    case 'pdf': {
      const result = await extractTextFromPDF(buffer);
      return result.text;
    }

    case 'docx': {
      // Dynamic import for mammoth (optional dependency)
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    case 'doc': {
      // .doc files are harder to parse, try mammoth but it may fail
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } catch {
        throw new Error('Le format .doc ancien n\'est pas supporté. Veuillez convertir en .docx');
      }
    }

    case 'txt':
    case 'md': {
      return buffer.toString('utf-8');
    }

    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Process a document: extract text, chunk it, generate embeddings, and store in DB
 */
export async function processDocument(
  file: File,
  assistantId: string,
  name?: string
): Promise<ProcessedDocument> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const documentName = name || file.name.replace(/\.[^/.]+$/, ''); // Remove extension

  // Create document record first (in processing state)
  const [document] = await db.insert(schema.assistantDocuments).values({
    assistantId,
    name: documentName,
    originalFilename: file.name,
    mimeType: file.type,
    fileSize: file.size,
    status: 'processing',
  }).returning();

  try {
    // Extract text from document
    console.log(`[Documents] Extracting text from ${file.name}...`);
    const text = await extractText(buffer, file.type);

    if (!text || text.trim().length === 0) {
      throw new Error('Le document ne contient pas de texte extractible');
    }

    console.log(`[Documents] Extracted ${text.length} characters`);

    // Split into chunks
    const chunks = chunkText(text);
    console.log(`[Documents] Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      throw new Error('Impossible de découper le document en chunks');
    }

    // Generate embeddings for all chunks
    console.log(`[Documents] Generating embeddings...`);
    const embeddings = await generateEmbeddings(chunks.map(c => c.content));

    // Store chunks with embeddings
    console.log(`[Documents] Storing ${chunks.length} chunks in database...`);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      await db.insert(schema.documentChunks).values({
        documentId: document.id,
        content: chunk.content,
        chunkIndex: chunk.index,
        tokensCount: embedding.tokensUsed,
        embedding: embedding.embedding,
      });
    }

    // Update document status to ready
    await db.update(schema.assistantDocuments)
      .set({ status: 'ready', updatedAt: new Date() })
      .where(eq(schema.assistantDocuments.id, document.id));

    console.log(`[Documents] Document ${document.id} processed successfully`);

    return {
      id: document.id,
      name: documentName,
      originalFilename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      status: 'ready',
      chunksCount: chunks.length,
      createdAt: document.createdAt,
    };
  } catch (error) {
    // Update document status to error
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    await db.update(schema.assistantDocuments)
      .set({
        status: 'error',
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(schema.assistantDocuments.id, document.id));

    console.error(`[Documents] Error processing document ${document.id}:`, errorMessage);

    return {
      id: document.id,
      name: documentName,
      originalFilename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      status: 'error',
      chunksCount: 0,
      createdAt: document.createdAt,
    };
  }
}

/**
 * List all documents for an assistant
 */
export async function listDocuments(assistantId: string): Promise<ProcessedDocument[]> {
  const documents = await db
    .select({
      id: schema.assistantDocuments.id,
      name: schema.assistantDocuments.name,
      originalFilename: schema.assistantDocuments.originalFilename,
      mimeType: schema.assistantDocuments.mimeType,
      fileSize: schema.assistantDocuments.fileSize,
      status: schema.assistantDocuments.status,
      createdAt: schema.assistantDocuments.createdAt,
    })
    .from(schema.assistantDocuments)
    .where(eq(schema.assistantDocuments.assistantId, assistantId))
    .orderBy(schema.assistantDocuments.createdAt);

  // Get chunk counts for each document
  const documentIds = documents.map(d => d.id);

  if (documentIds.length === 0) {
    return [];
  }

  const chunkCounts = await db
    .select({
      documentId: schema.documentChunks.documentId,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.documentChunks)
    .where(sql`${schema.documentChunks.documentId} IN (${sql.join(documentIds.map(id => sql`${id}`), sql`, `)})`)
    .groupBy(schema.documentChunks.documentId);

  const countMap = new Map(chunkCounts.map(c => [c.documentId, c.count]));

  return documents.map(doc => ({
    ...doc,
    status: doc.status as 'processing' | 'ready' | 'error',
    chunksCount: countMap.get(doc.id) || 0,
  }));
}

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string): Promise<ProcessedDocument | null> {
  const [document] = await db
    .select()
    .from(schema.assistantDocuments)
    .where(eq(schema.assistantDocuments.id, documentId))
    .limit(1);

  if (!document) {
    return null;
  }

  // Get chunk count
  const [countResult] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(schema.documentChunks)
    .where(eq(schema.documentChunks.documentId, documentId));

  return {
    id: document.id,
    name: document.name,
    originalFilename: document.originalFilename,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    status: document.status as 'processing' | 'ready' | 'error',
    chunksCount: countResult?.count || 0,
    createdAt: document.createdAt,
  };
}

/**
 * Delete a document and all its chunks
 */
export async function deleteDocument(documentId: string): Promise<void> {
  // Chunks will be deleted automatically via CASCADE
  await db.delete(schema.assistantDocuments)
    .where(eq(schema.assistantDocuments.id, documentId));

  console.log(`[Documents] Document ${documentId} deleted`);
}

/**
 * Check if a MIME type is supported
 */
export function isSupportedMimeType(mimeType: string): boolean {
  return mimeType in SUPPORTED_MIME_TYPES;
}

/**
 * Get supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return ['.pdf', '.docx', '.doc', '.txt', '.md'];
}

export { SUPPORTED_MIME_TYPES };
