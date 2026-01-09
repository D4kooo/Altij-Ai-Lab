import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, schema } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import type { Env } from '../types';

const veilleRoutes = new Hono<Env>();

// All routes require authentication
veilleRoutes.use('*', authMiddleware);

// ============================================
// FEEDSEARCH API - Découverte automatique de flux RSS
// ============================================

interface FeedsearchResult {
  url: string;
  title: string;
  description?: string;
  site_url?: string;
  site_name?: string;
  favicon?: string;
  content_type?: string;
  bozo?: number;
  score?: number;
}

async function discoverRssFeeds(url: string): Promise<FeedsearchResult[]> {
  try {
    const searchUrl = `https://feedsearch.dev/api/v1/search?url=${encodeURIComponent(url)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Feedsearch API error:', response.status);
      return [];
    }

    const feeds = await response.json() as FeedsearchResult[];
    return feeds || [];
  } catch (error) {
    console.error('Error discovering RSS feeds:', error);
    return [];
  }
}

// Schemas
const addFeedSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
  type: z.enum(['auto', 'rss', 'web']).optional().default('auto'),
});

const createNewsletterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  feedIds: z.array(z.string().uuid()),
});

const updateNewsletterSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  feedIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// FEEDS
// ============================================

// GET /api/veille/feeds - List user's feeds
veilleRoutes.get('/feeds', async (c) => {
  const user = c.get('user');

  const feeds = await db
    .select()
    .from(schema.feeds)
    .where(eq(schema.feeds.userId, user.id))
    .orderBy(desc(schema.feeds.createdAt));

  return c.json({ success: true, data: feeds });
});

// POST /api/veille/feeds - Add a new feed
veilleRoutes.post('/feeds', zValidator('json', addFeedSchema), async (c) => {
  const user = c.get('user');
  const { url, name, type } = c.req.valid('json');

  // Try to fetch feed info
  let feedUrl = url;
  let feedName = name || url;
  let favicon: string | undefined;
  let detectedType: 'rss' | 'web' = 'web';

  try {
    // Extract domain for favicon
    const urlObj = new URL(url);
    favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;

    // D'abord, vérifier si l'URL est directement un flux RSS
    const response = await fetch(url, {
      // @ts-ignore - Bun supports this option
      tls: { rejectUnauthorized: false },
    });
    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';

    const isDirectRss = contentType.includes('xml') ||
                        contentType.includes('rss') ||
                        text.includes('<rss') ||
                        text.includes('<feed') ||
                        text.includes('<channel');

    if (isDirectRss) {
      // L'URL est directement un flux RSS
      detectedType = 'rss';
      if (!name) {
        const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          feedName = stripHtml(titleMatch[1].trim());
        }
      }
    } else if (type === 'auto' || type === 'rss') {
      // Ce n'est pas un RSS direct, utiliser Feedsearch pour découvrir les flux
      console.log(`Searching for RSS feeds on ${url}...`);
      const discoveredFeeds = await discoverRssFeeds(url);

      if (discoveredFeeds.length > 0) {
        // Prendre le flux avec le meilleur score ou le premier
        const bestFeed = discoveredFeeds.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
        feedUrl = bestFeed.url;
        detectedType = 'rss';

        if (!name) {
          feedName = bestFeed.title || bestFeed.site_name || feedName;
        }
        if (bestFeed.favicon) {
          favicon = bestFeed.favicon;
        }

        console.log(`Found RSS feed: ${feedUrl} (${feedName})`);
      } else {
        // Aucun flux trouvé, fallback sur le scraping web
        console.log(`No RSS feed found for ${url}, falling back to web scraping`);
        detectedType = type === 'rss' ? 'web' : 'web'; // Force web si aucun RSS trouvé

        // Essayer d'extraire le titre de la page
        if (!name) {
          const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) {
            feedName = stripHtml(titleMatch[1].trim());
          }
        }
      }
    } else {
      // Type explicitement défini comme 'web'
      detectedType = 'web';
      if (!name) {
        const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          feedName = stripHtml(titleMatch[1].trim());
        }
      }
    }
  } catch (e) {
    // Ignore errors, use defaults
    console.error('Error fetching feed info:', e);
  }

  const [feed] = await db
    .insert(schema.feeds)
    .values({
      userId: user.id,
      url: feedUrl, // Utiliser l'URL du flux découvert
      name: feedName,
      type: detectedType,
      favicon,
    })
    .returning();

  // Fetch articles for this feed immediately
  if (detectedType === 'rss') {
    await fetchFeedArticles(feed.id, feedUrl);
  } else {
    await scrapeWebPage(feed.id, url); // Utiliser l'URL originale pour le scraping
  }

  return c.json({ success: true, data: feed });
});

// DELETE /api/veille/feeds/:id - Delete a feed
veilleRoutes.delete('/feeds/:id', async (c) => {
  const user = c.get('user');
  const feedId = c.req.param('id');

  await db
    .delete(schema.feeds)
    .where(and(eq(schema.feeds.id, feedId), eq(schema.feeds.userId, user.id)));

  return c.json({ success: true });
});

// POST /api/veille/feeds/refresh - Refresh all feeds for current user
veilleRoutes.post('/feeds/refresh', async (c) => {
  const user = c.get('user');

  const feeds = await db
    .select()
    .from(schema.feeds)
    .where(eq(schema.feeds.userId, user.id));

  for (const feed of feeds) {
    if (feed.type === 'rss') {
      await fetchFeedArticles(feed.id, feed.url);
    } else {
      await scrapeWebPage(feed.id, feed.url);
    }

    // Update last fetched
    await db
      .update(schema.feeds)
      .set({ lastFetchedAt: new Date() })
      .where(eq(schema.feeds.id, feed.id));
  }

  return c.json({ success: true });
});

// POST /api/veille/feeds/refresh-all - Refresh all feeds for all users (admin only)
veilleRoutes.post('/feeds/refresh-all', async (c) => {
  const user = c.get('user');

  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  const feeds = await db
    .select()
    .from(schema.feeds);

  console.log(`[Admin] Refreshing ${feeds.length} feeds...`);

  let successCount = 0;
  let errorCount = 0;

  for (const feed of feeds) {
    try {
      if (feed.type === 'rss') {
        await fetchFeedArticles(feed.id, feed.url);
      } else {
        await scrapeWebPage(feed.id, feed.url);
      }

      await db
        .update(schema.feeds)
        .set({ lastFetchedAt: new Date() })
        .where(eq(schema.feeds.id, feed.id));

      successCount++;
    } catch (error) {
      console.error(`[Admin] Error refreshing feed ${feed.id}:`, error);
      errorCount++;
    }
  }

  return c.json({
    success: true,
    data: {
      total: feeds.length,
      success: successCount,
      errors: errorCount,
    },
  });
});

// ============================================
// ARTICLES
// ============================================

// GET /api/veille/articles - List articles
veilleRoutes.get('/articles', async (c) => {
  const user = c.get('user');
  const feedId = c.req.query('feedId');

  // Get user's feeds
  const userFeeds = await db
    .select({ id: schema.feeds.id, name: schema.feeds.name })
    .from(schema.feeds)
    .where(eq(schema.feeds.userId, user.id));

  const feedIds = userFeeds.map((f) => f.id);
  const feedMap = new Map(userFeeds.map((f) => [f.id, f.name]));

  if (feedIds.length === 0) {
    return c.json({ success: true, data: [] });
  }

  // Build query
  let query = db
    .select()
    .from(schema.articles)
    .orderBy(desc(schema.articles.publishedAt));

  const articles = await query;

  // Filter by user's feeds and optionally by specific feed
  const filteredArticles = articles
    .filter((a) => feedIds.includes(a.feedId))
    .filter((a) => !feedId || a.feedId === feedId)
    .map((a) => ({
      ...a,
      feedName: feedMap.get(a.feedId) || 'Unknown',
    }));

  return c.json({ success: true, data: filteredArticles });
});

// POST /api/veille/articles/:id/read - Mark article as read
veilleRoutes.post('/articles/:id/read', async (c) => {
  const articleId = c.req.param('id');

  await db
    .update(schema.articles)
    .set({ isRead: true })
    .where(eq(schema.articles.id, articleId));

  return c.json({ success: true });
});

// POST /api/veille/articles/:id/favorite - Toggle favorite
veilleRoutes.post('/articles/:id/favorite', async (c) => {
  const articleId = c.req.param('id');

  const [article] = await db
    .select()
    .from(schema.articles)
    .where(eq(schema.articles.id, articleId))
    .limit(1);

  if (!article) {
    return c.json({ success: false, error: 'Article not found' }, 404);
  }

  await db
    .update(schema.articles)
    .set({ isFavorite: !article.isFavorite })
    .where(eq(schema.articles.id, articleId));

  return c.json({ success: true });
});

// ============================================
// NEWSLETTERS
// ============================================

// GET /api/veille/newsletters - List user's newsletters
veilleRoutes.get('/newsletters', async (c) => {
  const user = c.get('user');

  const newsletters = await db
    .select()
    .from(schema.newsletters)
    .where(eq(schema.newsletters.userId, user.id))
    .orderBy(desc(schema.newsletters.createdAt));

  return c.json({ success: true, data: newsletters });
});

// POST /api/veille/newsletters - Create a newsletter
veilleRoutes.post('/newsletters', zValidator('json', createNewsletterSchema), async (c) => {
  const user = c.get('user');
  const { name, email, frequency, feedIds } = c.req.valid('json');

  const [newsletter] = await db
    .insert(schema.newsletters)
    .values({
      userId: user.id,
      name,
      email,
      frequency,
      feedIds,
    })
    .returning();

  return c.json({ success: true, data: newsletter });
});

// PUT /api/veille/newsletters/:id - Update a newsletter
veilleRoutes.put('/newsletters/:id', zValidator('json', updateNewsletterSchema), async (c) => {
  const user = c.get('user');
  const newsletterId = c.req.param('id');
  const updates = c.req.valid('json');

  const [newsletter] = await db
    .update(schema.newsletters)
    .set(updates)
    .where(and(eq(schema.newsletters.id, newsletterId), eq(schema.newsletters.userId, user.id)))
    .returning();

  if (!newsletter) {
    return c.json({ success: false, error: 'Newsletter not found' }, 404);
  }

  return c.json({ success: true, data: newsletter });
});

// DELETE /api/veille/newsletters/:id - Delete a newsletter
veilleRoutes.delete('/newsletters/:id', async (c) => {
  const user = c.get('user');
  const newsletterId = c.req.param('id');

  await db
    .delete(schema.newsletters)
    .where(and(eq(schema.newsletters.id, newsletterId), eq(schema.newsletters.userId, user.id)));

  return c.json({ success: true });
});

// POST /api/veille/newsletters/:id/send - Send newsletter now (manual trigger)
veilleRoutes.post('/newsletters/:id/send', async (c) => {
  const user = c.get('user');
  const newsletterId = c.req.param('id');

  const [newsletter] = await db
    .select()
    .from(schema.newsletters)
    .where(and(eq(schema.newsletters.id, newsletterId), eq(schema.newsletters.userId, user.id)))
    .limit(1);

  if (!newsletter) {
    return c.json({ success: false, error: 'Newsletter not found' }, 404);
  }

  // Get feeds and articles
  const feedIds = newsletter.feedIds as string[];
  if (feedIds.length === 0) {
    return c.json({ success: false, error: 'No feeds selected' }, 400);
  }

  // For now, just mark as sent - actual email sending would require an email service
  await db
    .update(schema.newsletters)
    .set({ lastSentAt: new Date() })
    .where(eq(schema.newsletters.id, newsletterId));

  // TODO: Integrate with email service (Resend, SendGrid, etc.)
  console.log(`Newsletter "${newsletter.name}" would be sent to ${newsletter.email}`);

  return c.json({
    success: true,
    message: 'Newsletter scheduled for sending',
    note: 'Email service integration required for actual delivery'
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Scrape a web page for articles/links
async function scrapeWebPage(feedId: string, pageUrl: string) {
  try {
    const response = await fetch(pageUrl, {
      // @ts-ignore - Bun supports this option
      tls: { rejectUnauthorized: false },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    const html = await response.text();

    console.log(`Scraping web page: ${pageUrl}`);

    const baseUrl = new URL(pageUrl);
    const articles = extractArticlesFromHtml(html, baseUrl);

    console.log(`Found ${articles.length} articles from web page`);

    for (const article of articles.slice(0, 30)) {
      try {
        await db
          .insert(schema.articles)
          .values({
            feedId,
            title: article.title,
            description: article.description,
            url: article.url,
            image: article.image,
            publishedAt: article.publishedAt || new Date(),
          })
          .onConflictDoNothing();
      } catch (e: any) {
        console.error(`Error inserting article: ${e.message}`);
      }
    }
  } catch (e) {
    console.error(`Error scraping page ${pageUrl}:`, e);
  }
}

function extractArticlesFromHtml(html: string, baseUrl: URL): FeedItem[] {
  const articles: FeedItem[] = [];
  const seen = new Set<string>();

  // Look for article-like elements: <article>, <div class="post">, etc.
  // Extract links with meaningful text

  // Pattern 1: <article> tags
  const articleTags = html.match(/<article[^>]*>[\s\S]*?<\/article>/gi) || [];
  for (const articleHtml of articleTags) {
    const item = extractArticleInfo(articleHtml, baseUrl);
    if (item && !seen.has(item.url)) {
      seen.add(item.url);
      articles.push(item);
    }
  }

  // Pattern 2: Links within headings (h1, h2, h3)
  const headingLinks = html.match(/<h[1-3][^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>[\s\S]*?<\/h[1-3]>/gi) || [];
  for (const match of headingLinks) {
    const hrefMatch = match.match(/href=["']([^"']+)["']/i);
    const textMatch = match.match(/<a[^>]*>([^<]+)<\/a>/i);
    if (hrefMatch && textMatch) {
      const url = resolveUrl(hrefMatch[1], baseUrl);
      const title = stripHtml(textMatch[1]).trim();
      if (title.length > 10 && !seen.has(url) && isValidArticleUrl(url, baseUrl)) {
        seen.add(url);
        articles.push({ title, url });
      }
    }
  }

  // Pattern 3: Links with class containing "title", "headline", "post"
  const titleLinks = html.match(/<a[^>]*class=["'][^"']*(?:title|headline|post|article|entry)[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi) || [];
  for (const match of titleLinks) {
    const hrefMatch = match.match(/href=["']([^"']+)["']/i);
    const textMatch = match.match(/>([^<]+)</);
    if (hrefMatch && textMatch) {
      const url = resolveUrl(hrefMatch[1], baseUrl);
      const title = stripHtml(textMatch[1]).trim();
      if (title.length > 10 && !seen.has(url) && isValidArticleUrl(url, baseUrl)) {
        seen.add(url);
        articles.push({ title, url });
      }
    }
  }

  // Pattern 4: General links that look like articles (longer text, no common non-article patterns)
  const allLinks = html.match(/<a[^>]*href=["']([^"'#]+)["'][^>]*>([^<]{15,})<\/a>/gi) || [];
  for (const match of allLinks) {
    const hrefMatch = match.match(/href=["']([^"']+)["']/i);
    const textMatch = match.match(/>([^<]+)</);
    if (hrefMatch && textMatch && articles.length < 30) {
      const url = resolveUrl(hrefMatch[1], baseUrl);
      const title = stripHtml(textMatch[1]).trim();

      // Filter out navigation, footer links, etc.
      const isNavigation = /menu|nav|footer|header|login|signup|contact|about|privacy|terms/i.test(title);
      const isFile = /\.(pdf|doc|zip|exe|dmg)$/i.test(url);

      if (title.length > 20 && !seen.has(url) && !isNavigation && !isFile && isValidArticleUrl(url, baseUrl)) {
        seen.add(url);
        articles.push({ title, url });
      }
    }
  }

  return articles;
}

function extractArticleInfo(articleHtml: string, baseUrl: URL): FeedItem | null {
  // Find the main link
  const linkMatch = articleHtml.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/i);
  if (!linkMatch) return null;

  const url = resolveUrl(linkMatch[1], baseUrl);
  if (!isValidArticleUrl(url, baseUrl)) return null;

  // Find title (h1, h2, h3, or link text)
  let title = '';
  const headingMatch = articleHtml.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i);
  if (headingMatch) {
    title = stripHtml(headingMatch[1]).trim();
  } else {
    const linkTextMatch = articleHtml.match(/<a[^>]*>([^<]+)<\/a>/i);
    if (linkTextMatch) {
      title = stripHtml(linkTextMatch[1]).trim();
    }
  }

  if (!title || title.length < 10) return null;

  // Find description
  let description: string | undefined;
  const pMatch = articleHtml.match(/<p[^>]*>([^<]+)<\/p>/i);
  if (pMatch) {
    description = stripHtml(pMatch[1]).trim().substring(0, 300);
  }

  // Find image
  let image: string | undefined;
  const imgMatch = articleHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch) {
    image = resolveUrl(imgMatch[1], baseUrl);
  }

  // Find date
  let publishedAt: Date | undefined;
  const timeMatch = articleHtml.match(/<time[^>]*datetime=["']([^"']+)["'][^>]*>/i);
  if (timeMatch) {
    publishedAt = new Date(timeMatch[1]);
  }

  return { title, url, description, image, publishedAt };
}

function resolveUrl(url: string, baseUrl: URL): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('//')) {
    return `${baseUrl.protocol}${url}`;
  }
  if (url.startsWith('/')) {
    return `${baseUrl.origin}${url}`;
  }
  return `${baseUrl.origin}/${url}`;
}

function isValidArticleUrl(url: string, baseUrl: URL): boolean {
  try {
    const urlObj = new URL(url);
    // Must be same domain or subdomain
    const isSameDomain = urlObj.hostname === baseUrl.hostname ||
                         urlObj.hostname.endsWith('.' + baseUrl.hostname);
    // Must not be just the homepage
    const hasPath = urlObj.pathname.length > 1;
    return isSameDomain && hasPath;
  } catch {
    return false;
  }
}

async function fetchFeedArticles(feedId: string, feedUrl: string) {
  try {
    // Fetch with SSL verification disabled for problematic certificates
    const response = await fetch(feedUrl, {
      // @ts-ignore - Bun supports this option
      tls: {
        rejectUnauthorized: false,
      },
    });
    const text = await response.text();

    console.log(`Fetching feed: ${feedUrl}`);

    // Parse RSS/Atom feed
    const items = parseRssFeed(text);
    console.log(`Found ${items.length} articles`);

    for (const item of items.slice(0, 50)) { // Limit to 50 articles
      try {
        await db
          .insert(schema.articles)
          .values({
            feedId,
            title: item.title,
            description: item.description,
            url: item.url,
            image: item.image,
            publishedAt: item.publishedAt,
          })
          .onConflictDoNothing(); // Skip if already exists
      } catch (e: any) {
        console.error(`Error inserting article: ${e.message}`);
      }
    }
  } catch (e) {
    console.error(`Error fetching feed ${feedUrl}:`, e);
  }
}

interface FeedItem {
  title: string;
  description?: string;
  url: string;
  image?: string;
  publishedAt?: Date;
}

function parseRssFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];

  // Try RSS 2.0 format
  const rssItems = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];

  for (const itemXml of rssItems) {
    const title = extractTag(itemXml, 'title');
    const link = extractLink(itemXml) || extractTag(itemXml, 'guid');
    const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'content:encoded');
    const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date');
    const image = extractMediaImage(itemXml) || extractEnclosure(itemXml);

    if (title && link) {
      items.push({
        title: stripHtml(title),
        description: description ? stripHtml(description).substring(0, 500) : undefined,
        url: link,
        image,
        publishedAt: pubDate ? new Date(pubDate) : undefined,
      });
    }
  }

  // Try Atom format if no RSS items found
  if (items.length === 0) {
    const atomEntries = xml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) || [];

    for (const entryXml of atomEntries) {
      const title = extractTag(entryXml, 'title');
      const link = extractAtomLink(entryXml);
      const summary = extractTag(entryXml, 'summary') || extractTag(entryXml, 'content');
      const published = extractTag(entryXml, 'published') || extractTag(entryXml, 'updated');

      if (title && link) {
        items.push({
          title: stripHtml(title),
          description: summary ? stripHtml(summary).substring(0, 500) : undefined,
          url: link,
          publishedAt: published ? new Date(published) : undefined,
        });
      }
    }
  }

  return items;
}

function extractTag(xml: string, tagName: string): string | undefined {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular content
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  if (match) return match[1].trim();

  // Handle self-closing tag followed by content (some feeds use <link/>http://...)
  // This is non-standard but some feeds do this
  return undefined;
}

// Special handling for link tag which can be tricky
function extractLink(xml: string): string | undefined {
  // Standard: <link>http://...</link>
  const standardMatch = xml.match(/<link[^>]*>([^<]+)<\/link>/i);
  if (standardMatch) return standardMatch[1].trim();

  // Self-closing with href: <link href="http://..."/>
  const hrefMatch = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (hrefMatch) return hrefMatch[1].trim();

  // Newline after tag: <link>\nhttp://...\n</link>
  const newlineMatch = xml.match(/<link[^>]*>\s*\n?\s*([^\s<]+)\s*\n?\s*<\/link>/i);
  if (newlineMatch) return newlineMatch[1].trim();

  return undefined;
}

function extractAtomLink(xml: string): string | undefined {
  const linkMatch = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
  return linkMatch ? linkMatch[1] : undefined;
}

function extractMediaImage(xml: string): string | undefined {
  // media:content
  const mediaMatch = xml.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (mediaMatch) return mediaMatch[1];

  // media:thumbnail
  const thumbMatch = xml.match(/<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (thumbMatch) return thumbMatch[1];

  // img in description
  const imgMatch = xml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch) return imgMatch[1];

  return undefined;
}

function extractEnclosure(xml: string): string | undefined {
  const match = xml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image[^"']*["'][^>]*>/i);
  return match ? match[1] : undefined;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Export helper functions for scheduler
export { fetchFeedArticles, scrapeWebPage };
export { veilleRoutes };
