import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, schema } from '../db';
import { eq, and, desc, or, sql, inArray } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import type { Env } from '../types';
import { createHash } from 'crypto';

const veilleIaRoutes = new Hono<Env>();

// All routes require authentication
veilleIaRoutes.use('*', authMiddleware);

// Departments list
const DEPARTMENTS = ['affaires', 'family_office', 'mna', 'it', 'ip', 'data', 'social', 'rh'] as const;
type Department = typeof DEPARTMENTS[number];

const DEPARTMENT_LABELS: Record<Department, string> = {
  affaires: 'Affaires',
  family_office: 'Family Office',
  mna: 'M&A',
  it: 'IT',
  ip: 'IP',
  data: 'Data',
  social: 'Social',
  rh: 'RH',
};

// Schemas
const createVeilleIaSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  prompt: z.string().min(10),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  departments: z.array(z.enum(DEPARTMENTS)).min(1),
});

const updateVeilleIaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  prompt: z.string().min(10).optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  departments: z.array(z.enum(DEPARTMENTS)).min(1).optional(),
  isActive: z.boolean().optional(),
});

// Middleware pour vérifier si l'utilisateur est admin
function requireAdmin(c: any, next: any) {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }
  return next();
}

// ============================================
// VEILLES IA
// ============================================

// GET /api/veille-ia - List veilles IA (filtered by department for users)
veilleIaRoutes.get('/', async (c) => {
  const user = c.get('user');

  let veilles;

  if (user.role === 'admin') {
    // Admin voit tout
    veilles = await db
      .select()
      .from(schema.veillesIa)
      .orderBy(desc(schema.veillesIa.createdAt));
  } else {
    // User voit seulement les veilles de son pôle
    if (!user.department) {
      return c.json({ success: true, data: [] });
    }

    veilles = await db
      .select()
      .from(schema.veillesIa)
      .where(
        and(
          eq(schema.veillesIa.isActive, true),
          sql`${schema.veillesIa.departments} @> ${JSON.stringify([user.department])}::jsonb`
        )
      )
      .orderBy(desc(schema.veillesIa.createdAt));
  }

  return c.json({ success: true, data: veilles });
});

// GET /api/veille-ia/departments - Get departments list
veilleIaRoutes.get('/departments', async (c) => {
  const departments = DEPARTMENTS.map((dept) => ({
    id: dept,
    label: DEPARTMENT_LABELS[dept],
  }));

  return c.json({ success: true, data: departments });
});

// GET /api/veille-ia/:id - Get a veille IA with latest edition
veilleIaRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const veilleId = c.req.param('id');

  const [veille] = await db
    .select()
    .from(schema.veillesIa)
    .where(eq(schema.veillesIa.id, veilleId));

  if (!veille) {
    return c.json({ success: false, error: 'Veille not found' }, 404);
  }

  // Vérifier l'accès
  if (user.role !== 'admin') {
    const userDept = user.department;
    if (!userDept || !veille.departments.includes(userDept)) {
      return c.json({ success: false, error: 'Access denied' }, 403);
    }
  }

  // Récupérer la dernière édition
  const [latestEdition] = await db
    .select()
    .from(schema.veilleIaEditions)
    .where(eq(schema.veilleIaEditions.veilleIaId, veilleId))
    .orderBy(desc(schema.veilleIaEditions.generatedAt))
    .limit(1);

  return c.json({
    success: true,
    data: {
      ...veille,
      latestEdition: latestEdition || null,
    },
  });
});

// GET /api/veille-ia/:id/editions - Get all editions of a veille IA
veilleIaRoutes.get('/:id/editions', async (c) => {
  const user = c.get('user');
  const veilleId = c.req.param('id');

  // Vérifier l'accès
  const [veille] = await db
    .select()
    .from(schema.veillesIa)
    .where(eq(schema.veillesIa.id, veilleId));

  if (!veille) {
    return c.json({ success: false, error: 'Veille not found' }, 404);
  }

  if (user.role !== 'admin') {
    const userDept = user.department;
    if (!userDept || !veille.departments.includes(userDept)) {
      return c.json({ success: false, error: 'Access denied' }, 403);
    }
  }

  const editions = await db
    .select()
    .from(schema.veilleIaEditions)
    .where(eq(schema.veilleIaEditions.veilleIaId, veilleId))
    .orderBy(desc(schema.veilleIaEditions.generatedAt));

  return c.json({ success: true, data: editions });
});

// POST /api/veille-ia - Create a veille IA (admin only)
// Auto-generates first edition on creation
veilleIaRoutes.post('/', requireAdmin, zValidator('json', createVeilleIaSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');

  const [veille] = await db
    .insert(schema.veillesIa)
    .values({
      name: data.name,
      description: data.description,
      prompt: data.prompt,
      frequency: data.frequency,
      departments: data.departments,
      createdBy: user.id,
    })
    .returning();

  // Auto-generate first edition
  try {
    const result = await generateWithPerplexityDedup(data.prompt, []);

    const [edition] = await db
      .insert(schema.veilleIaEditions)
      .values({
        veilleIaId: veille.id,
        content: result.content,
        sources: result.sources,
      })
      .returning();

    // Extract and save items (non-blocking, ignore errors)
    try {
      const newItems = extractItemsFromContent(result.content, result.sources);
      if (newItems.length > 0) {
        await db.insert(schema.veilleIaItems).values(
          newItems.map(item => ({
            veilleIaId: veille.id,
            editionId: edition.id,
            title: item.title,
            summary: item.summary || null,
            sourceUrl: item.sourceUrl || null,
            contentHash: generateContentHash(item.title + (item.summary || '')),
            category: item.category || null,
          }))
        );
      }
    } catch (itemError) {
      console.error('Error saving items (non-critical):', itemError);
    }

    return c.json({
      success: true,
      data: {
        ...veille,
        latestEdition: edition,
      }
    });
  } catch (genError) {
    console.error('Error generating first edition:', genError);
    // Return veille without edition (generation failed but veille was created)
    return c.json({ success: true, data: veille });
  }
});

// PUT /api/veille-ia/:id - Update a veille IA (admin only)
veilleIaRoutes.put('/:id', requireAdmin, zValidator('json', updateVeilleIaSchema), async (c) => {
  const veilleId = c.req.param('id');
  const data = c.req.valid('json');

  const [veille] = await db
    .update(schema.veillesIa)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.veillesIa.id, veilleId))
    .returning();

  if (!veille) {
    return c.json({ success: false, error: 'Veille not found' }, 404);
  }

  return c.json({ success: true, data: veille });
});

// DELETE /api/veille-ia/:id - Delete a veille IA (admin only)
veilleIaRoutes.delete('/:id', requireAdmin, async (c) => {
  const veilleId = c.req.param('id');

  await db
    .delete(schema.veillesIa)
    .where(eq(schema.veillesIa.id, veilleId));

  return c.json({ success: true });
});

// POST /api/veille-ia/:id/generate - Generate a new edition using Perplexity (admin only)
veilleIaRoutes.post('/:id/generate', requireAdmin, async (c) => {
  const veilleId = c.req.param('id');

  const [veille] = await db
    .select()
    .from(schema.veillesIa)
    .where(eq(schema.veillesIa.id, veilleId));

  if (!veille) {
    return c.json({ success: false, error: 'Veille not found' }, 404);
  }

  try {
    // Récupérer les items précédents pour la déduplication
    let previousTopics: string[] = [];
    let previousHashes = new Set<string>();

    try {
      const previousItems = await db
        .select({
          title: schema.veilleIaItems.title,
          summary: schema.veilleIaItems.summary,
          contentHash: schema.veilleIaItems.contentHash,
        })
        .from(schema.veilleIaItems)
        .where(eq(schema.veilleIaItems.veilleIaId, veilleId))
        .orderBy(desc(schema.veilleIaItems.createdAt))
        .limit(100);

      previousTopics = previousItems.map(item => item.title).filter(Boolean);
      previousHashes = new Set(previousItems.map(item => item.contentHash));
    } catch (itemsError) {
      console.error('Error fetching previous items (continuing without dedup):', itemsError);
    }

    // Appeler Perplexity avec contexte de déduplication
    const result = await generateWithPerplexityDedup(veille.prompt, previousTopics);

    // Sauvegarder l'édition
    const [edition] = await db
      .insert(schema.veilleIaEditions)
      .values({
        veilleIaId: veilleId,
        content: result.content,
        sources: result.sources,
      })
      .returning();

    // Extraire et sauvegarder les items individuels (non-bloquant)
    let newItemsCount = 0;
    let totalItemsFound = 0;

    try {
      const newItems = extractItemsFromContent(result.content, result.sources);
      totalItemsFound = newItems.length;

      // Filtrer les items déjà existants (par hash)
      const uniqueItems = newItems.filter(item => {
        const hash = generateContentHash(item.title + (item.summary || ''));
        return !previousHashes.has(hash);
      });
      newItemsCount = uniqueItems.length;

      if (uniqueItems.length > 0) {
        await db.insert(schema.veilleIaItems).values(
          uniqueItems.map(item => ({
            veilleIaId: veilleId,
            editionId: edition.id,
            title: item.title,
            summary: item.summary || null,
            sourceUrl: item.sourceUrl || null,
            contentHash: generateContentHash(item.title + (item.summary || '')),
            category: item.category || null,
          }))
        );
      }
    } catch (itemError) {
      console.error('Error saving items (non-critical):', itemError);
    }

    return c.json({
      success: true,
      data: {
        ...edition,
        newItemsCount,
        totalItemsFound,
      }
    });
  } catch (error) {
    console.error('Error generating veille IA:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate veille',
    }, 500);
  }
});

// ============================================
// OPENROUTER / PERPLEXITY INTEGRATION
// ============================================

interface PerplexityResult {
  content: string;
  sources: { title: string; url: string }[];
}

interface ExtractedItem {
  title: string;
  summary?: string;
  sourceUrl?: string;
  category?: string;
}

// Générer un hash pour détecter les doublons
function generateContentHash(content: string): string {
  return createHash('md5')
    .update(content.toLowerCase().trim())
    .digest('hex');
}

// Extraire les items individuels du contenu généré
function extractItemsFromContent(
  content: string,
  sources: { title: string; url: string }[]
): ExtractedItem[] {
  const items: ExtractedItem[] = [];

  // Pattern pour détecter les titres de sections (## ou ###)
  const sectionRegex = /^#{2,3}\s+(.+)$/gm;
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    const title = match[1].trim();

    // Trouver le contenu associé (jusqu'au prochain titre)
    const startIndex = match.index + match[0].length;
    const nextMatch = sectionRegex.exec(content);
    const endIndex = nextMatch ? nextMatch.index : content.length;
    sectionRegex.lastIndex = match.index + match[0].length; // Reset to continue from current position

    const sectionContent = content.slice(startIndex, endIndex).trim();

    // Extraire un résumé (premiers 200 caractères)
    const summary = sectionContent
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Enlever les liens markdown
      .replace(/[*_#]/g, '') // Enlever le formatage
      .slice(0, 200)
      .trim();

    // Trouver l'URL source associée
    const urlMatch = sectionContent.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
    const sourceUrl = urlMatch ? urlMatch[2] : undefined;

    // Détecter la catégorie basée sur des mots-clés
    let category: string | undefined;
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('jurisprudence') || lowerTitle.includes('arrêt') || lowerTitle.includes('décision')) {
      category = 'jurisprudence';
    } else if (lowerTitle.includes('loi') || lowerTitle.includes('décret') || lowerTitle.includes('législat')) {
      category = 'legislation';
    } else if (lowerTitle.includes('doctrine') || lowerTitle.includes('article') || lowerTitle.includes('analyse')) {
      category = 'doctrine';
    } else if (lowerTitle.includes('actualité') || lowerTitle.includes('news')) {
      category = 'actualite';
    }

    if (title.length > 3) { // Ignorer les titres trop courts
      items.push({
        title,
        summary: summary || undefined,
        sourceUrl,
        category,
      });
    }
  }

  // Si aucun item détecté par sections, essayer d'extraire depuis les listes à puces
  if (items.length === 0) {
    const bulletRegex = /^[-*]\s+\*\*([^*]+)\*\*[:\s]*(.+)?$/gm;
    while ((match = bulletRegex.exec(content)) !== null) {
      items.push({
        title: match[1].trim(),
        summary: match[2]?.trim().slice(0, 200),
      });
    }
  }

  return items;
}

// Générer du contenu avec Perplexity en incluant les sujets déjà traités pour déduplication
async function generateWithPerplexityDedup(
  prompt: string,
  previousTopics: string[]
): Promise<PerplexityResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  // Construire le contexte de déduplication
  let deduplicationContext = '';
  if (previousTopics.length > 0) {
    deduplicationContext = `

IMPORTANT - DÉDUPLICATION :
Les sujets suivants ont DÉJÀ été traités dans les éditions précédentes. NE PAS les répéter, sauf s'il y a des développements significatifs nouveaux :
${previousTopics.slice(0, 50).map(t => `- ${t}`).join('\n')}

Concentre-toi UNIQUEMENT sur les nouvelles actualités et développements qui n'ont PAS encore été couverts.
Si une actualité est une suite ou mise à jour d'un sujet précédent, mentionne explicitement "Mise à jour :" au début.`;
  }

  const systemPrompt = `Tu es un assistant spécialisé en veille juridique et réglementaire pour un cabinet d'avocats français.
Tu dois fournir une synthèse claire, structurée et professionnelle des DERNIÈRES actualités et évolutions dans le domaine demandé.

RÈGLES DE FORMAT :
- Utilise le format Markdown
- Structure avec des titres ## pour chaque actualité/sujet majeur
- Chaque section doit avoir un titre clair et descriptif
- Cite tes sources avec des liens [titre](url) quand possible
- Réponds en français

RÈGLES DE CONTENU :
- Ne rapporte que des informations RÉCENTES (dernières semaines/mois selon la fréquence)
- Chaque élément doit avoir un titre unique et descriptif
- Inclus la date de l'actualité quand disponible${deduplicationContext}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'AltiJ AI Lab - Veille IA',
    },
    body: JSON.stringify({
      model: 'perplexity/sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenRouter error:', error);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Extraire les sources du contenu
  const sources: { title: string; url: string }[] = [];
  const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    sources.push({ title: match[1], url: match[2] });
  }

  return { content, sources };
}

// POST /api/veille-ia/generate-all - Generate all active veilles IA (admin only)
veilleIaRoutes.post('/generate-all', requireAdmin, async (c) => {
  const veilles = await db
    .select()
    .from(schema.veillesIa)
    .where(eq(schema.veillesIa.isActive, true));

  console.log(`[Admin] Generating ${veilles.length} veilles IA...`);

  let successCount = 0;
  let errorCount = 0;
  const results: { id: string; name: string; success: boolean; error?: string }[] = [];

  for (const veille of veilles) {
    try {
      // Récupérer les items précédents pour la déduplication
      let previousTopics: string[] = [];
      let previousHashes = new Set<string>();

      try {
        const previousItems = await db
          .select({
            title: schema.veilleIaItems.title,
            contentHash: schema.veilleIaItems.contentHash,
          })
          .from(schema.veilleIaItems)
          .where(eq(schema.veilleIaItems.veilleIaId, veille.id))
          .orderBy(desc(schema.veilleIaItems.createdAt))
          .limit(100);

        previousTopics = previousItems.map(item => item.title).filter(Boolean);
        previousHashes = new Set(previousItems.map(item => item.contentHash));
      } catch (e) {
        console.error(`Error fetching previous items for ${veille.id}:`, e);
      }

      const result = await generateWithPerplexityDedup(veille.prompt, previousTopics);

      const [edition] = await db
        .insert(schema.veilleIaEditions)
        .values({
          veilleIaId: veille.id,
          content: result.content,
          sources: result.sources,
        })
        .returning();

      // Save items
      try {
        const newItems = extractItemsFromContent(result.content, result.sources);
        const uniqueItems = newItems.filter(item => {
          const hash = generateContentHash(item.title + (item.summary || ''));
          return !previousHashes.has(hash);
        });

        if (uniqueItems.length > 0) {
          await db.insert(schema.veilleIaItems).values(
            uniqueItems.map(item => ({
              veilleIaId: veille.id,
              editionId: edition.id,
              title: item.title,
              summary: item.summary || null,
              sourceUrl: item.sourceUrl || null,
              contentHash: generateContentHash(item.title + (item.summary || '')),
              category: item.category || null,
            }))
          );
        }
      } catch (e) {
        console.error(`Error saving items for ${veille.id}:`, e);
      }

      successCount++;
      results.push({ id: veille.id, name: veille.name, success: true });
    } catch (error) {
      console.error(`[Admin] Error generating veille ${veille.id}:`, error);
      errorCount++;
      results.push({
        id: veille.id,
        name: veille.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return c.json({
    success: true,
    data: {
      total: veilles.length,
      success: successCount,
      errors: errorCount,
      results,
    },
  });
});

// GET /api/veille-ia/:id/items - Get all items for a veille (for admin/debug)
veilleIaRoutes.get('/:id/items', async (c) => {
  const user = c.get('user');
  const veilleId = c.req.param('id');

  // Vérifier l'accès
  const [veille] = await db
    .select()
    .from(schema.veillesIa)
    .where(eq(schema.veillesIa.id, veilleId));

  if (!veille) {
    return c.json({ success: false, error: 'Veille not found' }, 404);
  }

  if (user.role !== 'admin') {
    const userDept = user.department;
    if (!userDept || !veille.departments.includes(userDept)) {
      return c.json({ success: false, error: 'Access denied' }, 403);
    }
  }

  const items = await db
    .select()
    .from(schema.veilleIaItems)
    .where(eq(schema.veilleIaItems.veilleIaId, veilleId))
    .orderBy(desc(schema.veilleIaItems.createdAt));

  return c.json({ success: true, data: items });
});

// Export helper functions for scheduler
export { generateWithPerplexityDedup, extractItemsFromContent, generateContentHash };
export { veilleIaRoutes };
