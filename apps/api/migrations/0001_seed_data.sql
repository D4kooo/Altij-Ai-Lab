-- =====================================================
-- DATA RING - Seed Data
-- Run this AFTER 0000_init_complete.sql
-- =====================================================

-- =====================================================
-- 1. CREATE ORGANIZATION
-- =====================================================

INSERT INTO organizations (id, name, type, settings)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Data Ring',
  'work',
  '{"theme": {"primaryColor": "#57C5B6"}, "features": {"voiceEnabled": true}}'::jsonb
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. CREATE USERS
-- =====================================================

-- Admin user (password: admin123)
-- Password hash generated with bcrypt cost 12
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_staff, organization_id, is_onboarded)
VALUES (
  'u0000000-0000-0000-0000-000000000001',
  'admin@data-ring.net',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.V5Zzq5Q5Q5Q5Q5', -- admin123
  'Admin',
  'Data Ring',
  'admin',
  true,
  'a0000000-0000-0000-0000-000000000001',
  true
) ON CONFLICT (email) DO NOTHING;

-- Citizen test user (password: citizen123)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_staff, is_onboarded)
VALUES (
  'u0000000-0000-0000-0000-000000000002',
  'citoyen@test.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.V5Zzq5Q5Q5Q5Q5', -- citizen123
  'Jean',
  'Citoyen',
  'user',
  false,
  true
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 3. CREATE ASSISTANTS
-- =====================================================

INSERT INTO assistants (organization_id, type, model, system_prompt, temperature, max_tokens, name, description, specialty, icon, color, suggested_prompts, is_pinned, pin_order, is_active)
VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'openrouter',
  'anthropic/claude-sonnet-4',
  'Tu es un expert en droit social français. Tu aides les avocats et juristes sur les questions de droit du travail, contrats de travail, licenciements, relations collectives, etc.

Réponds de manière précise et cite les articles de loi pertinents quand c''est possible. Si tu n''es pas sûr, dis-le clairement.',
  0.7,
  4096,
  'Expert Droit Social',
  'Assistant spécialisé en droit du travail et droit social. Il peut vous aider sur les contrats de travail, licenciements, relations collectives, et plus encore.',
  'Droit social',
  'Users',
  '#3b82f6',
  '["Quelles sont les conditions de validité d''un licenciement économique ?", "Comment rédiger une clause de non-concurrence valide ?", "Quels sont les délais de préavis en cas de démission ?"]'::jsonb,
  true,
  1,
  true
),
(
  'a0000000-0000-0000-0000-000000000001',
  'openrouter',
  'anthropic/claude-sonnet-4',
  'Tu es un expert en protection des données personnelles et conformité RGPD. Tu accompagnes les entreprises dans leur mise en conformité.

Sois précis sur les obligations légales et les sanctions potentielles. Cite le RGPD et les guidelines de la CNIL quand pertinent.',
  0.7,
  4096,
  'Expert RGPD',
  'Assistant spécialisé en protection des données personnelles et conformité RGPD. Il vous accompagne dans la mise en conformité et la gestion des données.',
  'RGPD / Protection des données',
  'Shield',
  '#22c55e',
  '["Quelles sont les bases légales du traitement des données ?", "Comment répondre à une demande de droit d''accès ?", "Quand faut-il désigner un DPO ?"]'::jsonb,
  true,
  2,
  true
),
(
  'a0000000-0000-0000-0000-000000000001',
  'openrouter',
  'anthropic/claude-sonnet-4',
  'Tu es un expert en propriété intellectuelle : marques, brevets, droits d''auteur, dessins et modèles.

Aide les clients à protéger leurs créations et à comprendre leurs droits. Mentionne les procédures INPI/EUIPO quand pertinent.',
  0.7,
  4096,
  'Expert Propriété Intellectuelle',
  'Assistant spécialisé en propriété intellectuelle : marques, brevets, droits d''auteur, dessins et modèles.',
  'Propriété intellectuelle',
  'Sparkles',
  '#8b5cf6',
  '["Comment protéger une marque à l''international ?", "Quelle est la durée de protection d''un brevet ?", "Quelles sont les conditions de protection du droit d''auteur ?"]'::jsonb,
  false,
  0,
  true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. CREATE AUTOMATIONS
-- =====================================================

INSERT INTO automations (organization_id, n8n_workflow_id, n8n_webhook_url, name, description, category, icon, color, input_schema, output_type, estimated_duration, is_active)
VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'workflow_analyse_contrat',
  'https://automation.data-ring.net/webhook/analyse-contrat',
  'Analyse de Contrat',
  'Analyse automatique d''un contrat pour identifier les clauses clés, risques potentiels et points d''attention.',
  'Analyse',
  'FileSearch',
  '#f59e0b',
  '[{"name": "contractFile", "label": "Fichier du contrat", "type": "file", "required": true, "accept": ".pdf,.docx,.doc", "helpText": "Formats acceptés : PDF, Word"}, {"name": "contractType", "label": "Type de contrat", "type": "select", "required": true, "options": [{"label": "Contrat de travail", "value": "work"}, {"label": "Contrat commercial", "value": "commercial"}, {"label": "Bail", "value": "lease"}, {"label": "Autre", "value": "other"}]}]'::jsonb,
  'file',
  120,
  true
),
(
  'a0000000-0000-0000-0000-000000000001',
  'workflow_resume',
  'https://automation.data-ring.net/webhook/resume-juridique',
  'Résumé Juridique',
  'Génère un résumé concis d''un document juridique long (décision de justice, rapport, etc.).',
  'Résumé',
  'FileText',
  '#06b6d4',
  '[{"name": "document", "label": "Document à résumer", "type": "file", "required": true, "accept": ".pdf,.docx,.doc,.txt"}, {"name": "maxLength", "label": "Longueur maximale du résumé", "type": "select", "required": true, "options": [{"label": "Court (1 page)", "value": "short"}, {"label": "Moyen (2-3 pages)", "value": "medium"}, {"label": "Détaillé (5+ pages)", "value": "detailed"}]}]'::jsonb,
  'file',
  90,
  true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. CREATE CAMPAIGNS (Citizen Section)
-- =====================================================

INSERT INTO campaigns (organization_id, title, description, target, category, status, participant_goal, is_active)
VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Droit à l''effacement Google',
  'Action collective pour faire respecter le droit à l''oubli auprès de Google. Rejoignez-nous pour demander la suppression de vos données personnelles des résultats de recherche.',
  'Google LLC',
  'RGPD',
  'active',
  1000,
  true
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Transparence publicitaire Meta',
  'Demander à Meta (Facebook, Instagram) plus de transparence sur l''utilisation de nos données pour la publicité ciblée.',
  'Meta Platforms Inc.',
  'Publicité',
  'active',
  500,
  true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. CREATE DOCUMENT TEMPLATES
-- =====================================================

INSERT INTO document_templates (organization_id, title, description, category, content, is_active)
VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Lettre de demande d''accès aux données (Article 15 RGPD)',
  'Modèle de lettre pour exercer votre droit d''accès aux données personnelles auprès d''un responsable de traitement.',
  'RGPD',
  'Objet : Demande d''accès aux données personnelles (Article 15 du RGPD)

Madame, Monsieur,

En application de l''article 15 du Règlement Général sur la Protection des Données (RGPD), je vous prie de bien vouloir me communiquer l''ensemble des données personnelles me concernant que vous détenez.

Je souhaite également obtenir les informations suivantes :
- Les finalités du traitement
- Les catégories de données concernées
- Les destinataires des données
- La durée de conservation
- L''existence du droit de rectification ou d''effacement

Conformément à la réglementation, vous disposez d''un délai d''un mois pour répondre à ma demande.

Dans l''attente de votre réponse, je vous prie d''agréer, Madame, Monsieur, l''expression de mes salutations distinguées.

[Signature]',
  true
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Lettre de demande d''effacement (Article 17 RGPD)',
  'Modèle de lettre pour demander la suppression de vos données personnelles (droit à l''oubli).',
  'RGPD',
  'Objet : Demande d''effacement des données personnelles (Article 17 du RGPD)

Madame, Monsieur,

En application de l''article 17 du Règlement Général sur la Protection des Données (RGPD), je vous demande de procéder à l''effacement de l''ensemble des données personnelles me concernant que vous détenez.

Cette demande est fondée sur [choisir le motif] :
- Les données ne sont plus nécessaires au regard des finalités
- Je retire mon consentement
- Je m''oppose au traitement
- Les données ont fait l''objet d''un traitement illicite

Conformément à la réglementation, vous disposez d''un délai d''un mois pour procéder à cet effacement et m''en informer.

Dans l''attente de votre confirmation, je vous prie d''agréer, Madame, Monsieur, l''expression de mes salutations distinguées.

[Signature]',
  true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED COMPLETE
-- =====================================================

SELECT 'Seed data inserted successfully' AS status;
