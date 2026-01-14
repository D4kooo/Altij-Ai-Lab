-- Add is_favorite column to veilles_ia table
ALTER TABLE veilles_ia ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE NOT NULL;
