-- Add data_sources column to assistants table
-- Stores an array of legal data source IDs (e.g. ['code-civil', 'judilibre'])
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS data_sources jsonb DEFAULT '[]'::jsonb;
