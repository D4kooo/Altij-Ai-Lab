import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { chatCompletion } from '../services/openrouter';

const cguAnalyzerRoutes = new Hono<Env>();

const analyzeSchema = z.object({
  text: z.string().min(1).optional(),
  url: z.string().url().optional(),
}).refine((data) => data.text || data.url, {
  message: 'Either text or url must be provided',
});

cguAnalyzerRoutes.use('*', authMiddleware);

// POST / — Analyze CGU text or URL
cguAnalyzerRoutes.post('/', zValidator('json', analyzeSchema), async (c) => {
  const { text, url } = c.req.valid('json');

  let cguText = text || '';

  // If URL provided, fetch the page content
  if (url && !text) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DataRing-CGUAnalyzer/1.0)' },
      });
      if (!response.ok) {
        return c.json({ success: false, error: `Impossible de récupérer la page: ${response.status}` }, 400);
      }
      const html = await response.text();
      // Strip HTML tags, keep text content
      cguText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur réseau';
      return c.json({ success: false, error: `Impossible de récupérer l'URL: ${msg}` }, 400);
    }
  }

  if (!cguText || cguText.length < 50) {
    return c.json({ success: false, error: 'Le texte fourni est trop court pour être analysé.' }, 400);
  }

  // Truncate to avoid token limits (roughly 15k chars ~ 4k tokens)
  const truncated = cguText.length > 15000 ? cguText.substring(0, 15000) + '\n[... texte tronqué ...]' : cguText;

  const systemPrompt = `Tu es un expert juridique spécialisé en protection des données personnelles et en droit de la consommation (RGPD, loi Informatique et Libertés). Tu analyses les Conditions Générales d'Utilisation (CGU) et Conditions Générales de Vente (CGV) de services numériques.

Tu dois répondre UNIQUEMENT en JSON valide, sans aucun texte avant ou après. Le format attendu est :

{
  "serviceName": "Nom du service identifié (ou 'Service analysé' si non identifiable)",
  "score": <nombre entre 0 et 100, où 100 = excellent respect de la vie privée>,
  "summary": "Résumé global en 2-3 phrases de l'analyse",
  "points": [
    {
      "type": "danger|warning|good|info",
      "title": "Titre court du point",
      "description": "Explication détaillée en 1-2 phrases",
      "article": "Référence à la section/article concerné si applicable"
    }
  ]
}

Critères d'évaluation pour le score :
- Collecte de données : étendue et nécessité
- Partage avec des tiers : transparence et contrôle
- Conservation des données : durée et justification
- Droits de l'utilisateur : accès, rectification, suppression, portabilité
- Transparence : clarté et lisibilité des conditions
- Sécurité : mesures de protection mentionnées
- Juridiction et recours : droits applicables

Identifie entre 4 et 8 points d'attention. Utilise les types :
- "danger" pour les clauses très problématiques
- "warning" pour les clauses préoccupantes
- "good" pour les bonnes pratiques
- "info" pour les informations neutres importantes`;

  try {
    const response = await chatCompletion(
      'google/gemini-2.0-flash-001',
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyse les CGU/CGV suivantes :\n\n${truncated}` },
      ],
      { temperature: 0.3, maxTokens: 2048 }
    );

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const analysis = JSON.parse(jsonStr);

    return c.json({ success: true, data: analysis });
  } catch (error) {
    console.error('[CGU Analyzer] Error:', error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return c.json({ success: false, error: `Erreur lors de l'analyse: ${msg}` }, 500);
  }
});

export { cguAnalyzerRoutes };
