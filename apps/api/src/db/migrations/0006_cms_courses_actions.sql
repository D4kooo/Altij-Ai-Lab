-- Migration: CMS pour Cours et Actions Collectives
-- Description: Ajoute les tables pour la gestion des cours (School) et des actions collectives

-- =====================================================
-- SECTION 1: TABLES COURS (SCHOOL)
-- =====================================================

-- Cours (groupes de modules par audience)
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  audience VARCHAR(50) NOT NULL CHECK (audience IN ('juniors', 'adultes', 'seniors')),
  icon VARCHAR(50) DEFAULT 'BookOpen',
  color VARCHAR(20) DEFAULT '#57C5B6',

  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche par audience
CREATE INDEX IF NOT EXISTS idx_courses_audience ON courses(audience);
CREATE INDEX IF NOT EXISTS idx_courses_organization ON courses(organization_id);

-- Modules (sections d'un cours)
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'FileText',
  duration VARCHAR(20) DEFAULT '15 min',
  difficulty VARCHAR(20) DEFAULT 'facile' CHECK (difficulty IN ('facile', 'moyen', 'expert')),
  category VARCHAR(100),

  has_audio BOOLEAN DEFAULT false,
  audio_url TEXT,
  is_locked BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche par cours
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);

-- Leçons (contenu d'un module)
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  content TEXT,
  content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'video', 'image', 'audio')),
  media_url TEXT,
  duration VARCHAR(20),
  "order" INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche par module
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);

-- Quiz (optionnel, lié à un module)
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID UNIQUE NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions de quiz
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,

  question TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false')),
  options JSONB NOT NULL DEFAULT '[]',
  explanation TEXT,
  "order" INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche par quiz
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- Progression utilisateur
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  quiz_score INTEGER CHECK (quiz_score IS NULL OR (quiz_score >= 0 AND quiz_score <= 100)),
  quiz_attempts INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, module_id)
);

-- Index pour recherche par utilisateur
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module ON user_progress(module_id);

-- =====================================================
-- SECTION 2: TABLES ACTIONS COLLECTIVES
-- =====================================================

-- Campagnes
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  target VARCHAR(255),
  category VARCHAR(100),

  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'upcoming', 'completed')),
  participant_goal INTEGER DEFAULT 1000 CHECK (participant_goal > 0),
  start_date DATE,
  end_date DATE,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_organization ON campaigns(organization_id);

-- Participations aux campagnes
CREATE TABLE IF NOT EXISTS campaign_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, user_id)
);

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_campaign_participations_campaign ON campaign_participations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participations_user ON campaign_participations(user_id);

-- Templates de documents
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) CHECK (category IN ('RGPD', 'Publicité', 'Réclamation', 'Autre')),

  content TEXT,
  file_url TEXT,
  download_count INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_organization ON document_templates(organization_id);

-- =====================================================
-- SECTION 3: FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour compter les participants d'une campagne
CREATE OR REPLACE FUNCTION get_campaign_participant_count(campaign_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM campaign_participations WHERE campaign_id = campaign_uuid);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables avec updated_at
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN
    SELECT unnest(ARRAY['courses', 'modules', 'lessons', 'quizzes', 'user_progress', 'campaigns', 'document_templates'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', table_name, table_name, table_name, table_name);
  END LOOP;
END;
$$;
