-- Migration: Multi-tenant Organizations (Dataring Work & Family)
-- Cette migration ajoute le support multi-tenant avec isolation par organisation

-- Enum pour le type d'organisation
CREATE TYPE organization_type AS ENUM ('work', 'family');

-- Table des organisations (Entreprises ou Familles)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type organization_type NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index pour les recherches par owner
CREATE INDEX idx_organizations_owner ON organizations(owner_id);

-- Ajout des colonnes aux users
ALTER TABLE users
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN is_onboarded BOOLEAN DEFAULT false NOT NULL;

-- Index pour le filtrage par organisation
CREATE INDEX idx_users_organization ON users(organization_id);

-- Ajout de organization_id aux assistants (nullable pour templates globaux)
ALTER TABLE assistants
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_assistants_organization ON assistants(organization_id);

-- Ajout de organization_id aux automations
ALTER TABLE automations
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_automations_organization ON automations(organization_id);

-- Ajout de organization_id aux conversations
ALTER TABLE conversations
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_conversations_organization ON conversations(organization_id);

-- Ajout de organization_id aux feeds
ALTER TABLE feeds
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_feeds_organization ON feeds(organization_id);

-- Ajout de organization_id aux newsletters
ALTER TABLE newsletters
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_newsletters_organization ON newsletters(organization_id);

-- Ajout de organization_id aux veilles_ia
ALTER TABLE veilles_ia
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_veilles_ia_organization ON veilles_ia(organization_id);

-- Ajout de organization_id aux roles (pour rôles custom par org)
ALTER TABLE roles
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_roles_organization ON roles(organization_id);

-- Commentaires pour documentation
COMMENT ON TABLE organizations IS 'Entités multi-tenant: entreprises (work) ou familles (family)';
COMMENT ON COLUMN organizations.settings IS 'Configuration JSON: thème, restrictions de modèles, limites, etc.';
COMMENT ON COLUMN users.is_onboarded IS 'Indique si l utilisateur a complété le processus d onboarding';
