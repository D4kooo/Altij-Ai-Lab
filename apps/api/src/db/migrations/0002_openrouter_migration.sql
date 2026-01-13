-- Migration: OpenAI to OpenRouter
-- This migration converts assistants from OpenAI Assistants API to OpenRouter

-- Step 1: Add new columns for OpenRouter configuration
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'anthropic/claude-sonnet-4';
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS temperature REAL DEFAULT 0.7;
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 4096;

-- Step 2: Rename the enum value FIRST (PostgreSQL 10+)
ALTER TYPE assistant_type RENAME VALUE 'openai' TO 'openrouter';

-- Step 3: Now update existing assistants with default system prompt
UPDATE assistants
SET
  system_prompt = CONCAT('Tu es ', name, ', un assistant juridique spécialisé en ', specialty, '. ', description)
WHERE system_prompt IS NULL;

-- Step 4: Drop the old OpenAI-specific columns
ALTER TABLE assistants DROP COLUMN IF EXISTS openai_assistant_id;
ALTER TABLE conversations DROP COLUMN IF EXISTS openai_thread_id;

-- Step 5: Clean up - Delete all existing conversations and messages (fresh start)
-- WARNING: This will delete ALL conversation data!
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversations CASCADE;
