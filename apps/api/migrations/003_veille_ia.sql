-- Migration: Add Veille IA feature with departments
-- Run this in Supabase SQL Editor

-- 1. Create department enum type (if not exists)
DO $$ BEGIN
    CREATE TYPE department AS ENUM ('commercial', 'civil', 'corporate', 'it_data_ip', 'social');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add department column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS department department;

-- 3. Create veille_ia_frequency enum type
DO $$ BEGIN
    CREATE TYPE veille_ia_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create veilles_ia table
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

-- 5. Create veille_ia_editions table
CREATE TABLE IF NOT EXISTS veille_ia_editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    veille_ia_id UUID NOT NULL REFERENCES veilles_ia(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_veilles_ia_created_by ON veilles_ia(created_by);
CREATE INDEX IF NOT EXISTS idx_veilles_ia_is_active ON veilles_ia(is_active);
CREATE INDEX IF NOT EXISTS idx_veilles_ia_departments ON veilles_ia USING GIN (departments);
CREATE INDEX IF NOT EXISTS idx_veille_ia_editions_veille_ia_id ON veille_ia_editions(veille_ia_id);
CREATE INDEX IF NOT EXISTS idx_veille_ia_editions_generated_at ON veille_ia_editions(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- 7. Enable RLS on new tables
ALTER TABLE veilles_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE veille_ia_editions ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for veilles_ia
DROP POLICY IF EXISTS "Users can view veilles_ia for their department" ON veilles_ia;
CREATE POLICY "Users can view veilles_ia for their department" ON veilles_ia
    FOR SELECT
    USING (
        is_active = true
        AND (
            -- Admin can see all
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
            OR
            -- User can see veilles for their department
            departments @> to_jsonb((SELECT department FROM users WHERE id = auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Admins can manage veilles_ia" ON veilles_ia;
CREATE POLICY "Admins can manage veilles_ia" ON veilles_ia
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 9. RLS Policies for veille_ia_editions
DROP POLICY IF EXISTS "Users can view editions of accessible veilles" ON veille_ia_editions;
CREATE POLICY "Users can view editions of accessible veilles" ON veille_ia_editions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM veilles_ia v
            WHERE v.id = veille_ia_editions.veille_ia_id
            AND v.is_active = true
            AND (
                EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
                OR
                v.departments @> to_jsonb((SELECT department FROM users WHERE id = auth.uid()))
            )
        )
    );

DROP POLICY IF EXISTS "Admins can manage editions" ON veille_ia_editions;
CREATE POLICY "Admins can manage editions" ON veille_ia_editions
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Done!
SELECT 'Migration 003_veille_ia completed successfully' as status;
