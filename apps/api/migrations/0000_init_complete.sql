-- =====================================================
-- DATA RING - Complete Database Schema
-- Migration for Supabase Local Setup
-- =====================================================
-- Run this in Supabase SQL Editor or via CLI
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid-ossp for UUID generation (Supabase usually has this)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. ENUMS
-- =====================================================

-- User roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Departments
DO $$ BEGIN
  CREATE TYPE department AS ENUM ('affaires', 'family_office', 'mna', 'it', 'ip', 'data', 'social', 'rh');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Message roles in conversations
DO $$ BEGIN
  CREATE TYPE message_role AS ENUM ('user', 'assistant');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Automation output types
DO $$ BEGIN
  CREATE TYPE automation_output_type AS ENUM ('file', 'text', 'json', 'redirect');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Automation run status
DO $$ BEGIN
  CREATE TYPE automation_run_status AS ENUM ('pending', 'running', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Favorite item types
DO $$ BEGIN
  CREATE TYPE favorite_item_type AS ENUM ('assistant', 'automation');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Assistant types
DO $$ BEGIN
  CREATE TYPE assistant_type AS ENUM ('openrouter', 'webhook');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Resource types for permissions
DO $$ BEGIN
  CREATE TYPE resource_type AS ENUM ('assistant', 'automation');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Organization types
DO $$ BEGIN
  CREATE TYPE organization_type AS ENUM ('work', 'family');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Feed types
DO $$ BEGIN
  CREATE TYPE feed_type AS ENUM ('rss', 'web');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Newsletter frequency
DO $$ BEGIN
  CREATE TYPE newsletter_frequency AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Veille IA frequency
DO $$ BEGIN
  CREATE TYPE veille_ia_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Audit action types
DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'login', 'logout', 'login_failed',
    'user_created', 'user_updated', 'user_deleted',
    'role_assigned', 'role_removed',
    'permission_granted', 'permission_revoked',
    'automation_run', 'settings_changed', 'security_alert'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CMS: Course audience
DO $$ BEGIN
  CREATE TYPE course_audience AS ENUM ('juniors', 'adultes', 'seniors');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CMS: Module difficulty
DO $$ BEGIN
  CREATE TYPE module_difficulty AS ENUM ('facile', 'moyen', 'expert');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CMS: Lesson content type
DO $$ BEGIN
  CREATE TYPE lesson_content_type AS ENUM ('text', 'video', 'image', 'audio');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CMS: Quiz question type
DO $$ BEGIN
  CREATE TYPE quiz_question_type AS ENUM ('multiple_choice', 'true_false');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CMS: Campaign status
DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'upcoming', 'completed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CMS: Template category
DO $$ BEGIN
  CREATE TYPE template_category AS ENUM ('RGPD', 'Publicité', 'Réclamation', 'Autre');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 3. TABLES
-- =====================================================

-- Organizations (Multi-tenant: Work & Family)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type organization_type NOT NULL,
  owner_id UUID,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role DEFAULT 'user' NOT NULL,
  is_staff BOOLEAN DEFAULT false NOT NULL,
  department department,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  is_onboarded BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ
);

-- Add foreign key for organization owner
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS fk_owner;
ALTER TABLE organizations ADD CONSTRAINT fk_owner
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- Assistants IA
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type assistant_type DEFAULT 'openrouter' NOT NULL,
  model TEXT DEFAULT 'anthropic/claude-sonnet-4',
  system_prompt TEXT,
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  webhook_url TEXT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  specialty TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  suggested_prompts JSONB DEFAULT '[]',
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  pin_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Assistant Documents (Knowledge Base for RAG)
CREATE TABLE IF NOT EXISTS assistant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT DEFAULT 'processing' NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Document Chunks with Vector Embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES assistant_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  tokens_count INTEGER,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Automations (n8n workflows)
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  n8n_workflow_id TEXT NOT NULL,
  n8n_webhook_url TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  input_schema JSONB DEFAULT '[]',
  output_type automation_output_type NOT NULL,
  estimated_duration INTEGER,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Automation Runs
CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status automation_run_status NOT NULL,
  input JSONB,
  output JSONB,
  output_file_url TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type favorite_item_type NOT NULL,
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User Roles (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  resource_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User Permissions (individual)
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  resource_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RSS Feeds
CREATE TABLE IF NOT EXISTS feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type feed_type DEFAULT 'rss' NOT NULL,
  favicon TEXT,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  image TEXT,
  published_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false NOT NULL,
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Newsletters
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  frequency newsletter_frequency DEFAULT 'weekly' NOT NULL,
  feed_ids JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Veilles IA
CREATE TABLE IF NOT EXISTS veilles_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt TEXT NOT NULL,
  frequency veille_ia_frequency DEFAULT 'weekly' NOT NULL,
  departments JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Veille IA Editions
CREATE TABLE IF NOT EXISTS veille_ia_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veille_ia_id UUID NOT NULL REFERENCES veilles_ia(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Veille IA Items
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

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- CMS TABLES: COURSES & COLLECTIVE ACTIONS
-- =====================================================

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  audience course_audience NOT NULL,
  icon TEXT DEFAULT 'BookOpen',
  color TEXT DEFAULT '#57C5B6',
  is_published BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Modules
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'FileText',
  duration TEXT DEFAULT '15 min',
  difficulty module_difficulty DEFAULT 'facile',
  category TEXT,
  has_audio BOOLEAN DEFAULT false,
  audio_url TEXT,
  is_locked BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  content_type lesson_content_type DEFAULT 'text',
  media_url TEXT,
  duration TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type quiz_question_type DEFAULT 'multiple_choice',
  options JSONB DEFAULT '[]',
  explanation TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User Progress
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  quiz_score INTEGER,
  quiz_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, module_id)
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  target TEXT,
  category TEXT,
  status campaign_status DEFAULT 'draft',
  participant_goal INTEGER DEFAULT 1000,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Campaign Participations
CREATE TABLE IF NOT EXISTS campaign_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(campaign_id, user_id)
);

-- Document Templates
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category template_category,
  content TEXT,
  file_url TEXT,
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 4. INDEXES
-- =====================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_is_staff ON users(is_staff);

-- Assistants
CREATE INDEX IF NOT EXISTS idx_assistants_organization_id ON assistants(organization_id);
CREATE INDEX IF NOT EXISTS idx_assistants_is_active ON assistants(is_active);
CREATE INDEX IF NOT EXISTS idx_assistants_pinned ON assistants(is_pinned DESC, pin_order ASC);

-- Assistant Documents
CREATE INDEX IF NOT EXISTS idx_assistant_documents_assistant_id ON assistant_documents(assistant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_documents_status ON assistant_documents(status);

-- Document Chunks - Vector similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assistant_id ON conversations(assistant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Automations
CREATE INDEX IF NOT EXISTS idx_automations_organization_id ON automations(organization_id);
CREATE INDEX IF NOT EXISTS idx_automations_is_active ON automations(is_active);

-- Automation Runs
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation_id ON automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_user_id ON automation_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status);

-- Favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Refresh Tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Feeds
CREATE INDEX IF NOT EXISTS idx_feeds_user_id ON feeds(user_id);
CREATE INDEX IF NOT EXISTS idx_feeds_organization_id ON feeds(organization_id);

-- Articles
CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id);
CREATE UNIQUE INDEX IF NOT EXISTS articles_feed_url_idx ON articles(feed_id, url);

-- Veilles IA
CREATE INDEX IF NOT EXISTS idx_veilles_ia_created_by ON veilles_ia(created_by);
CREATE INDEX IF NOT EXISTS idx_veilles_ia_is_active ON veilles_ia(is_active);
CREATE INDEX IF NOT EXISTS idx_veilles_ia_departments ON veilles_ia USING GIN (departments);
CREATE INDEX IF NOT EXISTS idx_veilles_ia_organization_id ON veilles_ia(organization_id);

-- Veille IA Editions
CREATE INDEX IF NOT EXISTS idx_veille_ia_editions_veille_ia_id ON veille_ia_editions(veille_ia_id);
CREATE INDEX IF NOT EXISTS idx_veille_ia_editions_generated_at ON veille_ia_editions(generated_at DESC);

-- Veille IA Items
CREATE INDEX IF NOT EXISTS idx_veille_ia_items_veille_ia_id ON veille_ia_items(veille_ia_id);
CREATE INDEX IF NOT EXISTS idx_veille_ia_items_edition_id ON veille_ia_items(edition_id);
CREATE INDEX IF NOT EXISTS idx_veille_ia_items_content_hash ON veille_ia_items(content_hash);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- CMS: Courses
CREATE INDEX IF NOT EXISTS idx_courses_organization_id ON courses(organization_id);
CREATE INDEX IF NOT EXISTS idx_courses_audience ON courses(audience);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);

-- CMS: Modules
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);

-- CMS: Lessons
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);

-- CMS: Quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_module_id ON quizzes(module_id);

-- CMS: Quiz Questions
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

-- CMS: User Progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id);

-- CMS: Campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_organization_id ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);

-- CMS: Campaign Participations
CREATE INDEX IF NOT EXISTS idx_campaign_participations_campaign_id ON campaign_participations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participations_user_id ON campaign_participations(user_id);

-- CMS: Document Templates
CREATE INDEX IF NOT EXISTS idx_document_templates_organization_id ON document_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category);

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'assistants', 'assistant_documents', 'conversations',
      'automations', 'roles', 'veilles_ia', 'courses',
      'modules', 'lessons', 'quizzes', 'user_progress',
      'campaigns', 'document_templates'
    ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END $$;

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_assistant_id uuid
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN assistant_documents ad ON dc.document_id = ad.id
  WHERE ad.assistant_id = filter_assistant_id
    AND ad.status = 'ready'
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

SELECT 'Migration 0000_init_complete executed successfully' AS status;
