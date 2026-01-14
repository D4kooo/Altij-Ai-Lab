import { sql } from 'drizzle-orm';
import { db } from '../db';
import { generateEmbedding } from './embeddings';

export interface RetrievedChunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  chunkIndex: number;
  similarity: number;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  query: string;
  totalTokens: number;
}

/**
 * Retrieve relevant document chunks for a query using semantic search
 */
export async function retrieveContext(
  query: string,
  assistantId: string,
  topK: number = 5,
  threshold: number = 0.7
): Promise<RetrievalResult> {
  // Generate embedding for the query
  const queryResult = await generateEmbedding(query);
  const queryEmbedding = queryResult.embedding;

  // Format embedding as PostgreSQL vector
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // Use the stored function for similarity search
  const results = await db.execute<{
    id: string;
    document_id: string;
    content: string;
    chunk_index: number;
    document_name: string;
    similarity: number;
  }>(sql`
    SELECT * FROM match_document_chunks(
      ${embeddingStr}::vector,
      ${assistantId}::uuid,
      ${threshold},
      ${topK}
    )
  `);

  const chunks: RetrievedChunk[] = results.rows.map(row => ({
    id: row.id,
    documentId: row.document_id,
    documentName: row.document_name,
    content: row.content,
    chunkIndex: row.chunk_index,
    similarity: row.similarity,
  }));

  // Calculate total tokens used
  const totalTokens = queryResult.tokensUsed;

  return {
    chunks,
    query,
    totalTokens,
  };
}

/**
 * Check if an assistant has any documents
 */
export async function hasDocuments(assistantId: string): Promise<boolean> {
  const result = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*)::int as count
    FROM assistant_documents
    WHERE assistant_id = ${assistantId}
    AND status = 'ready'
  `);

  return result.rows[0]?.count > 0;
}

/**
 * Format retrieved chunks into a context string for the LLM
 */
export function formatContextForPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return '';
  }

  const contextParts = chunks.map((chunk, index) => {
    const header = `[Source ${index + 1}: ${chunk.documentName}]`;
    return `${header}\n${chunk.content}`;
  });

  return `## Contexte documentaire

Les informations suivantes proviennent de la base de connaissances de l'assistant. Utilise-les pour répondre à la question de l'utilisateur si pertinent.

${contextParts.join('\n\n---\n\n')}

---
Fin du contexte documentaire. Réponds maintenant à la question de l'utilisateur en te basant sur ces informations si elles sont pertinentes.`;
}

/**
 * Get a summary of what was retrieved for logging/debugging
 */
export function getRetrievalSummary(result: RetrievalResult): string {
  if (result.chunks.length === 0) {
    return 'Aucun document pertinent trouvé';
  }

  const sources = [...new Set(result.chunks.map(c => c.documentName))];
  const avgSimilarity = result.chunks.reduce((sum, c) => sum + c.similarity, 0) / result.chunks.length;

  return `${result.chunks.length} chunks de ${sources.length} document(s) | Similarité moyenne: ${(avgSimilarity * 100).toFixed(1)}%`;
}
