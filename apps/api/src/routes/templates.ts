import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, asc, and, sql } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware, staffMiddleware } from '../middleware/auth';

const templatesRoutes = new Hono<Env>();

// =====================================================
// SCHEMAS DE VALIDATION
// =====================================================

const templateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['RGPD', 'Publicité', 'Réclamation', 'Autre']).optional(),
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
});

// Auth middleware pour toutes les routes (certaines sont publiques via optionalAuth)
templatesRoutes.use('*', authMiddleware);

// =====================================================
// ROUTES TEMPLATES
// =====================================================

// GET /api/templates - Liste des templates actifs
templatesRoutes.get('/', async (c) => {
  const category = c.req.query('category');

  let templates;
  if (category && ['RGPD', 'Publicité', 'Réclamation', 'Autre'].includes(category)) {
    templates = await db
      .select()
      .from(schema.documentTemplates)
      .where(and(
        eq(schema.documentTemplates.isActive, true),
        eq(schema.documentTemplates.category, category as 'RGPD' | 'Publicité' | 'Réclamation' | 'Autre')
      ))
      .orderBy(desc(schema.documentTemplates.downloadCount), asc(schema.documentTemplates.title));
  } else {
    templates = await db
      .select()
      .from(schema.documentTemplates)
      .where(eq(schema.documentTemplates.isActive, true))
      .orderBy(desc(schema.documentTemplates.downloadCount), asc(schema.documentTemplates.title));
  }

  return c.json({
    success: true,
    data: templates.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      downloadCount: t.downloadCount,
      hasFile: !!t.fileUrl,
      hasContent: !!t.content,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  });
});

// GET /api/templates/:id - Détail d'un template
templatesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user')!;

  const [template] = await db
    .select()
    .from(schema.documentTemplates)
    .where(eq(schema.documentTemplates.id, id))
    .limit(1);

  if (!template || !template.isActive) {
    return c.json({ success: false, error: 'Template not found' }, 404);
  }

  // Retourner le contenu complet pour staff, sinon juste les métadonnées
  return c.json({
    success: true,
    data: {
      id: template.id,
      title: template.title,
      description: template.description,
      category: template.category,
      content: user.isStaff ? template.content : null, // Staff voit le contenu brut
      fileUrl: template.fileUrl,
      downloadCount: template.downloadCount,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }
  });
});

// GET /api/templates/:id/download - Télécharger un template (incrémente le compteur)
templatesRoutes.get('/:id/download', async (c) => {
  const id = c.req.param('id');

  const [template] = await db
    .select()
    .from(schema.documentTemplates)
    .where(eq(schema.documentTemplates.id, id))
    .limit(1);

  if (!template || !template.isActive) {
    return c.json({ success: false, error: 'Template not found' }, 404);
  }

  // Incrémenter le compteur de téléchargements
  await db
    .update(schema.documentTemplates)
    .set({
      downloadCount: (template.downloadCount || 0) + 1,
      updatedAt: new Date(),
    })
    .where(eq(schema.documentTemplates.id, id));

  // Retourner le contenu ou l'URL du fichier
  return c.json({
    success: true,
    data: {
      id: template.id,
      title: template.title,
      content: template.content,
      fileUrl: template.fileUrl,
      downloadCount: (template.downloadCount || 0) + 1,
    }
  });
});

// POST /api/templates - Créer un template (staff only)
templatesRoutes.post('/', staffMiddleware, zValidator('json', templateSchema), async (c) => {
  const data = c.req.valid('json');
  const user = c.get('user')!;
  const now = new Date();

  const [template] = await db.insert(schema.documentTemplates).values({
    organizationId: user.organizationId || null,
    createdBy: user.id,
    title: data.title,
    description: data.description || null,
    category: data.category || null,
    content: data.content || null,
    fileUrl: data.fileUrl || null,
    downloadCount: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return c.json({ success: true, data: template }, 201);
});

// PUT /api/templates/:id - Modifier un template (staff only)
templatesRoutes.put('/:id', staffMiddleware, zValidator('json', templateSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [existing] = await db
    .select()
    .from(schema.documentTemplates)
    .where(eq(schema.documentTemplates.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Template not found' }, 404);
  }

  const [template] = await db
    .update(schema.documentTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.documentTemplates.id, id))
    .returning();

  return c.json({ success: true, data: template });
});

// DELETE /api/templates/:id - Supprimer un template (staff only, soft delete)
templatesRoutes.delete('/:id', staffMiddleware, async (c) => {
  const id = c.req.param('id');

  const [existing] = await db
    .select()
    .from(schema.documentTemplates)
    .where(eq(schema.documentTemplates.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Template not found' }, 404);
  }

  await db
    .update(schema.documentTemplates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(schema.documentTemplates.id, id));

  return c.json({ success: true });
});

// GET /api/templates/stats - Statistiques des templates
templatesRoutes.get('/stats/global', async (c) => {
  // Total de téléchargements
  const totalDownloads = await db
    .select({ sum: sql<number>`sum(download_count)` })
    .from(schema.documentTemplates)
    .where(eq(schema.documentTemplates.isActive, true));

  // Nombre de templates par catégorie
  const byCategory = await db
    .select({
      category: schema.documentTemplates.category,
      count: sql<number>`count(*)`,
      downloads: sql<number>`sum(download_count)`,
    })
    .from(schema.documentTemplates)
    .where(eq(schema.documentTemplates.isActive, true))
    .groupBy(schema.documentTemplates.category);

  return c.json({
    success: true,
    data: {
      totalDownloads: Number(totalDownloads[0]?.sum || 0),
      byCategory: byCategory.map(c => ({
        category: c.category || 'Non catégorisé',
        count: Number(c.count || 0),
        downloads: Number(c.downloads || 0),
      })),
    }
  });
});

// GET /api/templates/categories - Liste des catégories disponibles
templatesRoutes.get('/categories/list', async (c) => {
  return c.json({
    success: true,
    data: [
      { value: 'RGPD', label: 'RGPD', description: 'Demandes liées au RGPD' },
      { value: 'Publicité', label: 'Publicité', description: 'Opposition au profilage publicitaire' },
      { value: 'Réclamation', label: 'Réclamation', description: 'Plaintes et réclamations' },
      { value: 'Autre', label: 'Autre', description: 'Autres modèles' },
    ]
  });
});

export { templatesRoutes };
