-- 1. feeds.user_id nullable pour les flux organisationnels (admin)
ALTER TABLE feeds ALTER COLUMN user_id DROP NOT NULL;

-- 2. Per-user read/favorite (nécessaire car les flux partagés = 1 article, N users)
CREATE TABLE article_user_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false NOT NULL,
  is_favorite boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX article_user_status_unique ON article_user_status(article_id, user_id);
CREATE INDEX idx_aus_user ON article_user_status(user_id);

-- 3. Attribution individuelle pour veille IA
ALTER TABLE veilles_ia ADD COLUMN user_ids jsonb DEFAULT '[]'::jsonb;

-- 4. Migrer le read/favorite existant vers article_user_status
INSERT INTO article_user_status (article_id, user_id, is_read, is_favorite)
SELECT a.id, f.user_id, a.is_read, a.is_favorite
FROM articles a JOIN feeds f ON a.feed_id = f.id
WHERE f.user_id IS NOT NULL AND (a.is_read = true OR a.is_favorite = true);
