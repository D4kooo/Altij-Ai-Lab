import OpenAI from 'openai';

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// Chunk configuration
const MAX_CHUNK_SIZE = 4000; // ~1000 tokens
const CHUNK_OVERLAP = 200; // Characters overlap between chunks

export interface EmbeddingResult {
  embedding: number[];
  tokensUsed: number;
}

export interface ChunkResult {
  content: string;
  index: number;
  tokensEstimate: number;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return {
    embedding: response.data[0].embedding,
    tokensUsed: response.usage.total_tokens,
  };
}

/**
 * Generate embeddings for multiple texts in batch
 * OpenAI supports batching up to 2048 inputs
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  if (texts.length === 0) {
    return [];
  }

  // OpenAI has a limit of 2048 inputs per request
  const batchSize = 100;
  const results: EmbeddingResult[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const tokensPerItem = Math.ceil(response.usage.total_tokens / batch.length);

    for (const data of response.data) {
      results.push({
        embedding: data.embedding,
        tokensUsed: tokensPerItem,
      });
    }
  }

  return results;
}

/**
 * Estimate token count for a text (rough approximation)
 * ~4 characters per token for English, ~3 for French
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

/**
 * Split text into chunks with overlap for better context preservation
 */
export function chunkText(text: string, maxChunkSize = MAX_CHUNK_SIZE, overlap = CHUNK_OVERLAP): ChunkResult[] {
  const chunks: ChunkResult[] = [];

  // Clean and normalize text
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleanText.length === 0) {
    return [];
  }

  // If text is small enough, return as single chunk
  if (cleanText.length <= maxChunkSize) {
    return [{
      content: cleanText,
      index: 0,
      tokensEstimate: estimateTokens(cleanText),
    }];
  }

  // Split by paragraphs first
  const paragraphs = cleanText.split(/\n\n+/);
  let currentChunk = '';
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max size
    if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
      // Save current chunk if not empty
      if (currentChunk.trim().length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          tokensEstimate: estimateTokens(currentChunk),
        });

        // Start new chunk with overlap from previous
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + '\n\n' + paragraph;
      } else {
        // Paragraph itself is too long, need to split it
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 > maxChunkSize) {
            if (currentChunk.trim().length > 0) {
              chunks.push({
                content: currentChunk.trim(),
                index: chunkIndex++,
                tokensEstimate: estimateTokens(currentChunk),
              });
              const overlapText = currentChunk.slice(-overlap);
              currentChunk = overlapText + ' ' + sentence;
            } else {
              // Single sentence too long, split by words
              const words = sentence.split(/\s+/);
              for (const word of words) {
                if (currentChunk.length + word.length + 1 > maxChunkSize) {
                  chunks.push({
                    content: currentChunk.trim(),
                    index: chunkIndex++,
                    tokensEstimate: estimateTokens(currentChunk),
                  });
                  currentChunk = word;
                } else {
                  currentChunk += ' ' + word;
                }
              }
            }
          } else {
            currentChunk += ' ' + sentence;
          }
        }
      }
    } else {
      // Add paragraph to current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n' + paragraph;
      } else {
        currentChunk = paragraph;
      }
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
      tokensEstimate: estimateTokens(currentChunk),
    });
  }

  return chunks;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL };
