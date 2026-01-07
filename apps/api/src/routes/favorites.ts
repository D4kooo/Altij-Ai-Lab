import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware } from '../middleware/auth';

const favoritesRoutes = new Hono<Env>();

const createFavoriteSchema = z.object({
  itemType: z.enum(['assistant', 'automation']),
  itemId: z.string().min(1),
});

// Apply auth middleware to all routes
favoritesRoutes.use('*', authMiddleware);

// GET /api/favorites - List user's favorites
favoritesRoutes.get('/', async (c) => {
  const user = c.get('user');

  const favorites = await db
    .select()
    .from(schema.favorites)
    .where(eq(schema.favorites.userId, user.id))
    .orderBy(schema.favorites.createdAt);

  // Get assistant and automation details for each favorite
  const enrichedFavorites = await Promise.all(
    favorites.map(async (fav) => {
      let item = null;

      if (fav.itemType === 'assistant') {
        const [assistant] = await db
          .select()
          .from(schema.assistants)
          .where(eq(schema.assistants.id, fav.itemId))
          .limit(1);

        if (assistant) {
          item = {
            id: assistant.id,
            name: assistant.name,
            description: assistant.description,
            specialty: assistant.specialty,
            icon: assistant.icon,
            color: assistant.color,
          };
        }
      } else if (fav.itemType === 'automation') {
        const [automation] = await db
          .select()
          .from(schema.automations)
          .where(eq(schema.automations.id, fav.itemId))
          .limit(1);

        if (automation) {
          item = {
            id: automation.id,
            name: automation.name,
            description: automation.description,
            category: automation.category,
            icon: automation.icon,
            color: automation.color,
          };
        }
      }

      return {
        id: fav.id,
        itemType: fav.itemType,
        itemId: fav.itemId,
        createdAt: fav.createdAt,
        item,
      };
    })
  );

  // Filter out favorites where the item no longer exists
  const validFavorites = enrichedFavorites.filter((f) => f.item !== null);

  return c.json({
    success: true,
    data: validFavorites,
  });
});

// POST /api/favorites - Add a favorite
favoritesRoutes.post('/', zValidator('json', createFavoriteSchema), async (c) => {
  const user = c.get('user');
  const { itemType, itemId } = c.req.valid('json');

  // Check if item exists
  if (itemType === 'assistant') {
    const [assistant] = await db
      .select()
      .from(schema.assistants)
      .where(eq(schema.assistants.id, itemId))
      .limit(1);

    if (!assistant) {
      return c.json({ success: false, error: 'Assistant not found' }, 404);
    }
  } else {
    const [automation] = await db
      .select()
      .from(schema.automations)
      .where(eq(schema.automations.id, itemId))
      .limit(1);

    if (!automation) {
      return c.json({ success: false, error: 'Automation not found' }, 404);
    }
  }

  // Check if already favorited
  const [existing] = await db
    .select()
    .from(schema.favorites)
    .where(
      and(
        eq(schema.favorites.userId, user.id),
        eq(schema.favorites.itemType, itemType),
        eq(schema.favorites.itemId, itemId)
      )
    )
    .limit(1);

  if (existing) {
    return c.json({ success: false, error: 'Already favorited' }, 400);
  }

  const id = nanoid();
  const now = new Date();

  await db.insert(schema.favorites).values({
    id,
    userId: user.id,
    itemType,
    itemId,
    createdAt: now,
  });

  return c.json(
    {
      success: true,
      data: {
        id,
        itemType,
        itemId,
        createdAt: now,
      },
    },
    201
  );
});

// DELETE /api/favorites/:id - Remove a favorite
favoritesRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const favoriteId = c.req.param('id');

  const [favorite] = await db
    .select()
    .from(schema.favorites)
    .where(and(eq(schema.favorites.id, favoriteId), eq(schema.favorites.userId, user.id)))
    .limit(1);

  if (!favorite) {
    return c.json({ success: false, error: 'Favorite not found' }, 404);
  }

  await db.delete(schema.favorites).where(eq(schema.favorites.id, favoriteId));

  return c.json({ success: true });
});

// DELETE /api/favorites/item/:type/:itemId - Remove favorite by item
favoritesRoutes.delete('/item/:type/:itemId', async (c) => {
  const user = c.get('user');
  const itemType = c.req.param('type') as 'assistant' | 'automation';
  const itemId = c.req.param('itemId');

  if (itemType !== 'assistant' && itemType !== 'automation') {
    return c.json({ success: false, error: 'Invalid item type' }, 400);
  }

  const [favorite] = await db
    .select()
    .from(schema.favorites)
    .where(
      and(
        eq(schema.favorites.userId, user.id),
        eq(schema.favorites.itemType, itemType),
        eq(schema.favorites.itemId, itemId)
      )
    )
    .limit(1);

  if (!favorite) {
    return c.json({ success: false, error: 'Favorite not found' }, 404);
  }

  await db.delete(schema.favorites).where(eq(schema.favorites.id, favorite.id));

  return c.json({ success: true });
});

export { favoritesRoutes };
