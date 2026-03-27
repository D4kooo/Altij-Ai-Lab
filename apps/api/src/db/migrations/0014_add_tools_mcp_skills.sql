-- Migration: Add tool calling, MCP servers, and skills system

-- 1. Add tools column to assistants
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS tools jsonb DEFAULT '[]';

-- 2. Add tool_calls column to messages + expand role enum
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_calls jsonb;

-- Add 'tool' to message_role enum if not exists
DO $$ BEGIN
  ALTER TYPE message_role ADD VALUE IF NOT EXISTS 'tool';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create MCP transport enum
DO $$ BEGIN
  CREATE TYPE mcp_transport AS ENUM ('stdio', 'sse');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Create mcp_servers table
CREATE TABLE IF NOT EXISTS mcp_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  transport mcp_transport NOT NULL,
  config jsonb NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 5. Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'Zap',
  color text DEFAULT '#6366f1',
  system_prompt_override text,
  tools jsonb DEFAULT '[]',
  data_sources jsonb DEFAULT '[]',
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 6. Create assistant_skills junction table
CREATE TABLE IF NOT EXISTS assistant_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id uuid NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  is_default boolean DEFAULT false NOT NULL
);

-- 7. Add active_skills to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS active_skills jsonb DEFAULT '[]';
