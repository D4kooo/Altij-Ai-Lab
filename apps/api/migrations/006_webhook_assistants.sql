-- Migration: Add webhook assistant support and pinned assistants
-- This migration adds support for assistants that communicate via webhooks (like n8n)
-- instead of OpenAI, and adds pinning functionality

-- Create the assistant_type enum
DO $$ BEGIN
  CREATE TYPE assistant_type AS ENUM ('openai', 'webhook');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to assistants table
ALTER TABLE assistants
  ADD COLUMN IF NOT EXISTS type assistant_type DEFAULT 'openai' NOT NULL,
  ADD COLUMN IF NOT EXISTS webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS pin_order INTEGER DEFAULT 0;

-- Make openai_assistant_id nullable (not needed for webhook assistants)
ALTER TABLE assistants
  ALTER COLUMN openai_assistant_id DROP NOT NULL;

-- Make openai_thread_id nullable in conversations (not needed for webhook assistants)
ALTER TABLE conversations
  ALTER COLUMN openai_thread_id DROP NOT NULL;

-- Add index for pinned assistants (for faster sorting)
CREATE INDEX IF NOT EXISTS idx_assistants_pinned ON assistants(is_pinned DESC, pin_order ASC);

-- Add check constraint to ensure proper configuration based on type
-- openai type needs openai_assistant_id, webhook type needs webhook_url
ALTER TABLE assistants DROP CONSTRAINT IF EXISTS check_assistant_config;
ALTER TABLE assistants ADD CONSTRAINT check_assistant_config CHECK (
  (type = 'openai' AND openai_assistant_id IS NOT NULL) OR
  (type = 'webhook' AND webhook_url IS NOT NULL)
);

-- Insert the Legifrance Bot as a pinned webhook assistant
INSERT INTO assistants (
  type,
  webhook_url,
  name,
  description,
  specialty,
  icon,
  color,
  suggested_prompts,
  is_pinned,
  pin_order,
  is_active
) VALUES (
  'webhook',
  'https://automation.devtotem.com/webhook-test/b4ac2910-604c-4105-91c9-c78d6e87345b',
  'Legifrance Bot',
  'Agent IA connecte a l''API Legifrance. Posez vos questions sur la legislation, la jurisprudence et les textes officiels francais.',
  'Recherche juridique',
  'Scale',
  '#1e3a8a',
  '["Quels sont les derniers textes publies au Journal Officiel ?", "Rechercher la jurisprudence sur les licenciements economiques", "Quelles sont les obligations du RGPD pour les entreprises ?"]',
  true,
  1,
  true
) ON CONFLICT DO NOTHING;
