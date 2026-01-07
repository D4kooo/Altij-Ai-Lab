-- Migration: Add veille_ia_items table for deduplication
-- This table stores individual items extracted from each veille edition
-- to enable intelligent deduplication when generating new editions

CREATE TABLE IF NOT EXISTS veille_ia_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veille_ia_id UUID NOT NULL REFERENCES veilles_ia(id) ON DELETE CASCADE,
  edition_id UUID NOT NULL REFERENCES veille_ia_editions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  source_url TEXT,
  content_hash TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookup by veille_ia_id (most common query)
CREATE INDEX IF NOT EXISTS idx_veille_ia_items_veille_ia_id ON veille_ia_items(veille_ia_id);

-- Index for deduplication check by content_hash
CREATE INDEX IF NOT EXISTS idx_veille_ia_items_content_hash ON veille_ia_items(content_hash);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_veille_ia_items_category ON veille_ia_items(category);

-- RLS Policies (matching existing veilles_ia policies)
ALTER TABLE veille_ia_items ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY admin_all_veille_ia_items ON veille_ia_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.user_id', true)::uuid
      AND u.role = 'admin'
    )
  );

-- Users can read items from veilles they have access to
CREATE POLICY user_read_veille_ia_items ON veille_ia_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM veilles_ia v, users u
      WHERE v.id = veille_ia_items.veille_ia_id
      AND u.id = current_setting('app.user_id', true)::uuid
      AND v.is_active = true
      AND v.departments @> jsonb_build_array(u.department)
    )
  );
