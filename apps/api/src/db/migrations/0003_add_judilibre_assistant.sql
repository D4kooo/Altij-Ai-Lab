-- Migration: Add Judilibre webhook assistant
-- Similar to LegiFrance, this is a pinned webhook assistant for searching French case law

INSERT INTO assistants (
  id,
  type,
  name,
  description,
  specialty,
  icon,
  color,
  webhook_url,
  is_pinned,
  pin_order,
  suggested_prompts,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'webhook',
  'Judilibre',
  'Recherche dans la jurisprudence française (Cour de cassation, cours d''appel). Trouvez des décisions de justice pertinentes pour vos dossiers.',
  'Recherche',
  'Scale',
  '#6366f1',
  'https://automation.devtotem.com/webhook/judilibre-agent',
  true,
  2,
  '["Trouve des arrêts de la Cour de cassation sur la rupture conventionnelle", "Recherche la jurisprudence récente sur le licenciement pour faute grave", "Quelles sont les décisions sur la responsabilité du fait des produits défectueux ?"]'::jsonb,
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
