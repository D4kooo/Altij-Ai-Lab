import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, schema } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import type { Env } from '../types';

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
  departments: z.array(z.enum(DEPARTMENTS)).optional().default([]),
  userIds: z.array(z.string().uuid()).optional().default([]),
}).refine(
  (data) => data.departments.length > 0 || data.userIds.length > 0,
  { message: 'At least one department or one user must be selected' }
);

const updateVeilleIaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  prompt: z.string().min(10).optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  departments: z.array(z.enum(DEPARTMENTS)).optional(),
  userIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
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

// GET /api/veille-ia - List veilles IA (filtered by organization and department)
veilleIaRoutes.get('/', async (c) => {
  const user = c.get('user');

  // Si pas d'organisation, retourner liste vide
  if (!user.organizationId) {
    return c.json({ success: true, data: [] });
  }

  let veilles;

  if (user.role === 'admin') {
    // Admin voit tout de son organisation
    veilles = await db
      .select()
      .from(schema.veillesIa)
      .where(eq(schema.veillesIa.organizationId, user.organizationId))
      .orderBy(desc(schema.veillesIa.createdAt));
  } else {
    // User voit les veilles de son pôle OU assignées à lui individuellement
    const accessConditions = [];
    if (user.department) {
      accessConditions.push(sql`${schema.veillesIa.departments} @> ${JSON.stringify([user.department])}::jsonb`);
    }
    accessConditions.push(sql`${schema.veillesIa.userIds} @> ${JSON.stringify([user.id])}::jsonb`);

    veilles = await db
      .select()
      .from(schema.veillesIa)
      .where(
        and(
          eq(schema.veillesIa.organizationId, user.organizationId),
          eq(schema.veillesIa.isActive, true),
          sql`(${sql.join(accessConditions, sql` OR `)})`
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

// GET /api/veille-ia/favorites/list - Get favorite veilles with latest edition summary
// MUST be before /:id route to avoid being caught by it
veilleIaRoutes.get('/favorites/list', async (c) => {
  const user = c.get('user');

  if (!user.organizationId) {
    return c.json({ success: true, data: [] });
  }

  let veilles;

  if (user.role === 'admin') {
    veilles = await db
      .select()
      .from(schema.veillesIa)
      .where(
        and(
          eq(schema.veillesIa.isFavorite, true),
          eq(schema.veillesIa.organizationId, user.organizationId)
        )
      )
      .orderBy(desc(schema.veillesIa.updatedAt));
  } else {
    const accessConditions = [];
    if (user.department) {
      accessConditions.push(sql`${schema.veillesIa.departments} @> ${JSON.stringify([user.department])}::jsonb`);
    }
    accessConditions.push(sql`${schema.veillesIa.userIds} @> ${JSON.stringify([user.id])}::jsonb`);

    veilles = await db
      .select()
      .from(schema.veillesIa)
      .where(
        and(
          eq(schema.veillesIa.isFavorite, true),
          eq(schema.veillesIa.organizationId, user.organizationId),
          eq(schema.veillesIa.isActive, true),
          sql`(${sql.join(accessConditions, sql` OR `)})`
        )
      )
      .orderBy(desc(schema.veillesIa.updatedAt));
  }

  // Get latest edition for each veille with summary
  const result = await Promise.all(
    veilles.map(async (veille) => {
      const [latestEdition] = await db
        .select()
        .from(schema.veilleIaEditions)
        .where(eq(schema.veilleIaEditions.veilleIaId, veille.id))
        .orderBy(desc(schema.veilleIaEditions.generatedAt))
        .limit(1);

      // Extract first meaningful paragraph (skip headers)
      let summary = '';
      if (latestEdition?.content) {
        const lines = latestEdition.content.split('\n').filter((l: string) => l.trim() && !l.startsWith('#') && !l.startsWith('---'));
        summary = lines.slice(0, 2).join(' ').substring(0, 200);
        if (summary.length === 200) summary += '...';
      }

      return {
        id: veille.id,
        name: veille.name,
        description: veille.description,
        isFavorite: veille.isFavorite,
        latestEdition: latestEdition ? {
          id: latestEdition.id,
          generatedAt: latestEdition.generatedAt,
          newItemsCount: (latestEdition as any).newItemsCount,
        } : null,
        summary,
      };
    })
  );

  return c.json({ success: true, data: result });
});

// GET /api/veille-ia/:id - Get a veille IA with latest edition
veilleIaRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const veilleId = c.req.param('id');

  if (!user.organizationId) {
    return c.json({ success: false, error: 'Organization required' }, 403);
  }

  const [veille] = await db
    .select()
    .from(schema.veillesIa)
    .where(
      and(
        eq(schema.veillesIa.id, veilleId),
        eq(schema.veillesIa.organizationId, user.organizationId)
      )
    );

  if (!veille) {
    return c.json({ success: false, error: 'Veille not found' }, 404);
  }

  // Vérifier l'accès par département ou userId pour les non-admins
  if (user.role !== 'admin') {
    const hasDeptAccess = user.department && veille.departments.includes(user.department);
    const hasUserAccess = (veille.userIds ?? []).includes(user.id);
    if (!hasDeptAccess && !hasUserAccess) {
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

  if (!user.organizationId) {
    return c.json({ success: false, error: 'Organization required' }, 403);
  }

  // Vérifier l'accès (scoped by org)
  const [veille] = await db
    .select()
    .from(schema.veillesIa)
    .where(
      and(
        eq(schema.veillesIa.id, veilleId),
        eq(schema.veillesIa.organizationId, user.organizationId)
      )
    );

  if (!veille) {
    return c.json({ success: false, error: 'Veille not found' }, 404);
  }

  if (user.role !== 'admin') {
    const hasDeptAccess = user.department && veille.departments.includes(user.department);
    const hasUserAccess = (veille.userIds ?? []).includes(user.id);
    if (!hasDeptAccess && !hasUserAccess) {
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

  if (!user.organizationId) {
    return c.json({ success: false, error: 'Organization required' }, 403);
  }

  const [veille] = await db
    .insert(schema.veillesIa)
    .values({
      name: data.name,
      description: data.description,
      prompt: data.prompt,
      frequency: data.frequency,
      departments: data.departments,
      userIds: data.userIds || [],
      organizationId: user.organizationId,
      createdBy: user.id,
    })
    .returning();

  // Auto-generate first edition
  try {
    const result = await generateNewsletter(data.prompt);

    const [edition] = await db
      .insert(schema.veilleIaEditions)
      .values({
        veilleIaId: veille.id,
        content: result.content,
        sources: result.sources,
      })
      .returning();

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
  const user = c.get('user');
  const veilleId = c.req.param('id');
  const data = c.req.valid('json');

  if (!user.organizationId) {
    return c.json({ success: false, error: 'Organization required' }, 403);
  }

  const [veille] = await db
    .update(schema.veillesIa)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.veillesIa.id, veilleId),
        eq(schema.veillesIa.organizationId, user.organizationId)
      )
    )
    .returning();

  if (!veille) {
    return c.json({ success: false, error: 'Veille not found' }, 404);
  }

  return c.json({ success: true, data: veille });
});

// DELETE /api/veille-ia/:id - Delete a veille IA (admin only)
veilleIaRoutes.delete('/:id', requireAdmin, async (c) => {
  const user = c.get('user');
  const veilleId = c.req.param('id');

  if (!user.organizationId) {
    return c.json({ success: false, error: 'Organization required' }, 403);
  }

  await db
    .delete(schema.veillesIa)
    .where(
      and(
        eq(schema.veillesIa.id, veilleId),
        eq(schema.veillesIa.organizationId, user.organizationId)
      )
    );

  return c.json({ success: true });
});

// POST /api/veille-ia/:id/favorite - Toggle favorite status (admin only)
veilleIaRoutes.post('/:id/favorite', requireAdmin, async (c) => {
  const user = c.get('user');
  const veilleId = c.req.param('id');

  if (!user.organizationId) {
    return c.json({ success: false, error: 'Organization required' }, 403);
  }

  // Get current state (scoped by org)
  const [veille] = await db
    .select()
    .from(schema.veillesIa)
    .where(
      and(
        eq(schema.veillesIa.id, veilleId),
        eq(schema.veillesIa.organizationId, user.organizationId)
      )
    );

  if (!veille) {
    return c.json({ success: false, error: 'Veille not found' }, 404);
  }

  // Toggle favorite
  const [updated] = await db
    .update(schema.veillesIa)
    .set({ isFavorite: !veille.isFavorite, updatedAt: new Date() })
    .where(
      and(
        eq(schema.veillesIa.id, veilleId),
        eq(schema.veillesIa.organizationId, user.organizationId)
      )
    )
    .returning();

  return c.json({ success: true, data: updated });
});

// POST /api/veille-ia/:id/generate - Generate a new edition using Perplexity (admin only)
veilleIaRoutes.post('/:id/generate', requireAdmin, async (c) => {
  const user = c.get('user');
  const veilleId = c.req.param('id');

  if (!user.organizationId) {
    return c.json({ success: false, error: 'Organization required' }, 403);
  }

  const [veille] = await db
    .select()
    .from(schema.veillesIa)
    .where(
      and(
        eq(schema.veillesIa.id, veilleId),
        eq(schema.veillesIa.organizationId, user.organizationId)
      )
    );

  if (!veille) {
    return c.json({ success: false, error: 'Veille not found' }, 404);
  }

  try {
    // Générer la newsletter (actualités fraîches du jour)
    const result = await generateNewsletter(veille.prompt);

    // Sauvegarder l'édition
    const [edition] = await db
      .insert(schema.veilleIaEditions)
      .values({
        veilleIaId: veilleId,
        content: result.content,
        sources: result.sources,
      })
      .returning();

    return c.json({
      success: true,
      data: edition
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

interface NewsletterResult {
  content: string;
  sources: { title: string; url: string }[];
}

// Générer une newsletter avec Perplexity (style Perplexity Tasks)
async function generateNewsletter(prompt: string): Promise<NewsletterResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const systemPrompt = `Tu es un expert en veille juridique qui rédige une NEWSLETTER QUOTIDIENNE pour un cabinet d'avocats français.

📅 Date du jour : ${today}

FORMAT NEWSLETTER OBLIGATOIRE :

## 📰 Les actualités du jour

Pour chaque actualité (5-10 max), utilise ce format EXACT :

### 1. [Titre court et accrocheur]
**📅 Date** : [date de publication si connue]
**🏷️ Catégorie** : [Jurisprudence | Législation | Régulation | Cybersécurité | Data/RGPD | Actualité]

[Description en 2-3 phrases maximum. Va droit au but, explique l'essentiel et l'impact pratique pour un avocat.]

**🔗 Source** : [Nom de la source](URL)

---

## 📋 En bref

[Liste à puces de 3-5 actualités secondaires moins importantes, une ligne chacune avec source]

## 🔗 Sources utilisées

[Liste numérotée de toutes les sources consultées avec leurs URLs]

RÈGLES CRITIQUES :
- Sois CONCIS et FACTUEL - pas de blabla, que de l'info utile
- Chaque news DOIT avoir une source avec URL
- Priorise les actualités des dernières 24-48h
- Format digest facile à lire en 5 minutes
- Réponds UNIQUEMENT en français`;

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

// POST /api/veille-ia/generate-all - Generate all active veilles IA in org (admin only)
veilleIaRoutes.post('/generate-all', requireAdmin, async (c) => {
  const user = c.get('user');

  if (!user.organizationId) {
    return c.json({ success: false, error: 'Organization required' }, 403);
  }

  const veilles = await db
    .select()
    .from(schema.veillesIa)
    .where(
      and(
        eq(schema.veillesIa.isActive, true),
        eq(schema.veillesIa.organizationId, user.organizationId)
      )
    );

  console.log(`[Admin] Generating ${veilles.length} veilles IA...`);

  let successCount = 0;
  let errorCount = 0;
  const results: { id: string; name: string; success: boolean; error?: string }[] = [];

  for (const veille of veilles) {
    try {
      const result = await generateNewsletter(veille.prompt);

      await db
        .insert(schema.veilleIaEditions)
        .values({
          veilleIaId: veille.id,
          content: result.content,
          sources: result.sources,
        });

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

// Export pour scheduler
export { generateNewsletter };
export { veilleIaRoutes };
