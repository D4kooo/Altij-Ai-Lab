-- Migration: RAG Knowledge Base for Assistants
-- Adds document storage and vector embeddings for semantic search

-- Step 1: Enable pgvector extension (requires superuser or Supabase dashboard)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create assistant_documents table
CREATE TABLE IF NOT EXISTS assistant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'ready', 'error'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 3: Create document_chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES assistant_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  tokens_count INTEGER,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assistant_documents_assistant_id
  ON assistant_documents(assistant_id);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
  ON document_chunks(document_id);

-- Step 5: Create vector index for similarity search
-- Using ivfflat for approximate nearest neighbor search
-- lists = 100 is good for up to ~100k vectors
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
  ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Step 6: Create function to search similar chunks by assistant
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_assistant_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  chunk_index INTEGER,
  document_name TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    ad.name as document_name,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM document_chunks dc
  JOIN assistant_documents ad ON dc.document_id = ad.id
  WHERE ad.assistant_id = match_assistant_id
    AND ad.status = 'ready'
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 7: Add comment for documentation
COMMENT ON TABLE assistant_documents IS 'Documents uploaded as knowledge base for assistants';
COMMENT ON TABLE document_chunks IS 'Text chunks with vector embeddings for RAG retrieval';
COMMENT ON FUNCTION match_document_chunks IS 'Semantic search function for RAG - returns most similar chunks for a given assistant';
