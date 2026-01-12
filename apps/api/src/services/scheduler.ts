import cron from 'node-cron';
import { db, schema } from '../db';
import { eq, desc } from 'drizzle-orm';
import { fetchFeedArticles, scrapeWebPage } from '../routes/veille';
import { generateNewsletter } from '../routes/veille-ia';

// Note: Les tables veilleIaItems ne sont plus utilisées (plus de tracking de sujets)

// ============================================
// SCHEDULER SERVICE
// Gère les tâches automatiques de l'application
// ============================================

let isInitialized = false;

/**
 * Initialise tous les cron jobs
 */
export function initScheduler() {
  if (isInitialized) {
    console.log('[Scheduler] Already initialized, skipping...');
    return;
  }

  console.log('[Scheduler] Initializing scheduled tasks...');

  // ============================================
  // RSS FEEDS - Refresh quotidien à 6h00
  // ============================================
  cron.schedule('0 6 * * *', async () => {
    console.log('[Scheduler] Starting daily RSS feeds refresh...');
    await refreshAllRssFeeds();
  }, {
    timezone: 'Europe/Paris'
  });

  // ============================================
  // VEILLES IA - Vérification quotidienne à 7h00
  // Génère les éditions selon la fréquence configurée
  // ============================================
  cron.schedule('0 7 * * *', async () => {
    console.log('[Scheduler] Checking Veilles IA for scheduled generation...');
    await processVeillesIaSchedule();
  }, {
    timezone: 'Europe/Paris'
  });

  isInitialized = true;
  console.log('[Scheduler] Scheduled tasks initialized:');
  console.log('  - RSS Feeds refresh: Daily at 06:00 (Europe/Paris)');
  console.log('  - Veilles IA generation: Daily at 07:00 (Europe/Paris)');
}

/**
 * Rafraîchit tous les flux RSS de tous les utilisateurs
 */
async function refreshAllRssFeeds() {
  try {
    // Récupérer tous les feeds actifs
    const feeds = await db
      .select()
      .from(schema.feeds);

    console.log(`[Scheduler] Found ${feeds.length} feeds to refresh`);

    let successCount = 0;
    let errorCount = 0;

    for (const feed of feeds) {
      try {
        if (feed.type === 'rss') {
          await fetchFeedArticles(feed.id, feed.url);
        } else {
          await scrapeWebPage(feed.id, feed.url);
        }

        // Mettre à jour lastFetchedAt
        await db
          .update(schema.feeds)
          .set({ lastFetchedAt: new Date() })
          .where(eq(schema.feeds.id, feed.id));

        successCount++;
      } catch (error) {
        console.error(`[Scheduler] Error refreshing feed ${feed.id} (${feed.name}):`, error);
        errorCount++;
      }
    }

    console.log(`[Scheduler] RSS refresh completed: ${successCount} success, ${errorCount} errors`);
  } catch (error) {
    console.error('[Scheduler] Error in refreshAllRssFeeds:', error);
  }
}

/**
 * Vérifie et traite les veilles IA selon leur fréquence
 */
async function processVeillesIaSchedule() {
  try {
    // Récupérer toutes les veilles IA actives
    const veilles = await db
      .select()
      .from(schema.veillesIa)
      .where(eq(schema.veillesIa.isActive, true));

    console.log(`[Scheduler] Found ${veilles.length} active Veilles IA`);

    const now = new Date();
    let generatedCount = 0;
    let skippedCount = 0;

    for (const veille of veilles) {
      try {
        // Récupérer la dernière édition
        const [lastEdition] = await db
          .select()
          .from(schema.veilleIaEditions)
          .where(eq(schema.veilleIaEditions.veilleIaId, veille.id))
          .orderBy(desc(schema.veilleIaEditions.generatedAt))
          .limit(1);

        const lastGeneratedAt = lastEdition?.generatedAt || veille.createdAt;
        const shouldGenerate = shouldGenerateNewEdition(veille.frequency, lastGeneratedAt, now);

        if (shouldGenerate) {
          console.log(`[Scheduler] Generating new edition for veille: ${veille.name}`);
          await generateVeilleIaEdition(veille.id, veille.prompt);
          generatedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`[Scheduler] Error processing veille ${veille.id} (${veille.name}):`, error);
      }
    }

    console.log(`[Scheduler] Veilles IA processing completed: ${generatedCount} generated, ${skippedCount} skipped`);
  } catch (error) {
    console.error('[Scheduler] Error in processVeillesIaSchedule:', error);
  }
}

/**
 * Détermine si une nouvelle édition doit être générée
 */
function shouldGenerateNewEdition(
  frequency: string,
  lastGeneratedAt: Date,
  now: Date
): boolean {
  const daysSinceLastGeneration = Math.floor(
    (now.getTime() - lastGeneratedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  const dayOfWeek = now.getDay(); // 0 = Dimanche, 1 = Lundi
  const dayOfMonth = now.getDate();
  const weekNumber = Math.ceil(dayOfMonth / 7);

  switch (frequency) {
    case 'daily':
      // Générer si la dernière génération date de plus de 20h
      return daysSinceLastGeneration >= 1 ||
        (now.getTime() - lastGeneratedAt.getTime()) > (20 * 60 * 60 * 1000);

    case 'weekly':
      // Générer le lundi si la dernière génération date de plus de 6 jours
      return dayOfWeek === 1 && daysSinceLastGeneration >= 6;

    case 'biweekly':
      // Générer un lundi sur deux (semaines impaires)
      return dayOfWeek === 1 && weekNumber % 2 === 1 && daysSinceLastGeneration >= 13;

    case 'monthly':
      // Générer le 1er du mois
      return dayOfMonth === 1 && daysSinceLastGeneration >= 25;

    default:
      return false;
  }
}

/**
 * Génère une nouvelle édition pour une veille IA (newsletter quotidienne)
 */
async function generateVeilleIaEdition(veilleId: string, prompt: string) {
  try {
    // Générer la newsletter avec Perplexity
    const result = await generateNewsletter(prompt);

    // Sauvegarder l'édition
    await db
      .insert(schema.veilleIaEditions)
      .values({
        veilleIaId: veilleId,
        content: result.content,
        sources: result.sources,
      });

    console.log(`[Scheduler] Generated newsletter for veille ${veilleId}`);
  } catch (error) {
    console.error(`[Scheduler] Error generating veille IA edition for ${veilleId}:`, error);
    throw error;
  }
}

/**
 * Fonction utilitaire pour forcer un refresh immédiat (pour debug/admin)
 */
export async function forceRefreshAllFeeds() {
  console.log('[Scheduler] Force refresh all feeds triggered');
  await refreshAllRssFeeds();
}

/**
 * Fonction utilitaire pour forcer la génération de toutes les veilles (pour debug/admin)
 */
export async function forceGenerateAllVeilles() {
  console.log('[Scheduler] Force generate all veilles triggered');

  const veilles = await db
    .select()
    .from(schema.veillesIa)
    .where(eq(schema.veillesIa.isActive, true));

  for (const veille of veilles) {
    try {
      await generateVeilleIaEdition(veille.id, veille.prompt);
    } catch (error) {
      console.error(`[Scheduler] Error generating veille ${veille.id}:`, error);
    }
  }
}
