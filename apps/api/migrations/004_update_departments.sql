-- Migration: Update departments enum with new values
-- Run this in Supabase SQL Editor

-- 1. Drop the old department type if it exists and recreate with new values
-- First, we need to handle the users table that references this type

-- Remove the column temporarily
ALTER TABLE users DROP COLUMN IF EXISTS department;

-- Drop old type
DROP TYPE IF EXISTS department;

-- Create new department type with updated values
CREATE TYPE department AS ENUM (
  'affaires',      -- was 'commercial'
  'family_office', -- was 'civil'
  'mna',           -- was 'corporate' (M&A)
  'it',            -- split from 'it_data_ip'
  'ip',            -- split from 'it_data_ip'
  'data',          -- split from 'it_data_ip'
  'social',        -- unchanged
  'rh'             -- new
);

-- Re-add the column to users table
ALTER TABLE users ADD COLUMN department department;

-- 2. Update veille_ia_frequency enum if not exists
DO $$ BEGIN
    CREATE TYPE veille_ia_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create veilles_ia table if not exists
CREATE TABLE IF NOT EXISTS veilles_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    prompt TEXT NOT NULL,
    frequency veille_ia_frequency DEFAULT 'weekly' NOT NULL,
    departments JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Create veille_ia_editions table if not exists
CREATE TABLE IF NOT EXISTS veille_ia_editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    veille_ia_id UUID NOT NULL REFERENCES veilles_ia(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_veilles_ia_created_by ON veilles_ia(created_by);
CREATE INDEX IF NOT EXISTS idx_veilles_ia_is_active ON veilles_ia(is_active);
CREATE INDEX IF NOT EXISTS idx_veilles_ia_departments ON veilles_ia USING GIN (departments);
CREATE INDEX IF NOT EXISTS idx_veille_ia_editions_veille_ia_id ON veille_ia_editions(veille_ia_id);
CREATE INDEX IF NOT EXISTS idx_veille_ia_editions_generated_at ON veille_ia_editions(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- Done!
SELECT 'Migration 004_update_departments completed successfully' as status;
