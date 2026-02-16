import type { ConnectorType } from '@altij/shared';
import { getLegalSourcesByIds } from '@altij/shared';
import type { DataSourceConnector, SearchResult } from './types';
import { legifranceConnector } from './legifrance';
import { judilibreConnector } from './judilibre';
import { sireneConnector } from './sirene';
import { bodaccConnector } from './bodacc';
import { gleifConnector } from './gleif';
import { rnaConnector } from './rna';
import { eurlexConnector } from './eurlex';

export type { SearchResult } from './types';

const connectors: Record<string, DataSourceConnector> = {
  legifrance: legifranceConnector,
  judilibre: judilibreConnector,
  sirene: sireneConnector,
  bodacc: bodaccConnector,
  gleif: gleifConnector,
  rna: rnaConnector,
  eurlex: eurlexConnector,
};

export function getConnector(type: ConnectorType): DataSourceConnector | undefined {
  return connectors[type];
}

/**
 * Get configuration status for all connectors.
 * Returns a map of connector type -> whether it's configured (env vars present).
 */
export function getConnectorsStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {};
  for (const [type, connector] of Object.entries(connectors)) {
    status[type] = connector.isConfigured();
  }
  // 'external' connectors are never configured (no built-in integration)
  status['external'] = false;
  return status;
}

const SOURCE_TIMEOUT_MS = 5000;

/**
 * Search multiple data sources in parallel.
 * Each source gets a 5s timeout. Errors are logged but don't fail the request.
 */
export async function searchDataSources(
  sourceIds: string[],
  query: string,
  limitPerSource = 3
): Promise<SearchResult[]> {
  const sources = getLegalSourcesByIds(sourceIds);

  // Group sources by connector to avoid duplicate searches
  const byConnector = new Map<string, { config?: Record<string, string>; sourceNames: string[] }[]>();
  for (const source of sources) {
    if (source.connector === 'external') continue; // Skip external sources
    const connector = getConnector(source.connector);
    if (!connector || !connector.isConfigured()) continue;

    if (!byConnector.has(source.connector)) {
      byConnector.set(source.connector, []);
    }
    byConnector.get(source.connector)!.push({
      config: source.connectorConfig,
      sourceNames: [source.name],
    });
  }

  // Execute searches in parallel with timeout
  const promises: Promise<SearchResult[]>[] = [];

  for (const [connectorType, configs] of byConnector) {
    const connector = connectors[connectorType];
    if (!connector) continue;

    for (const { config } of configs) {
      const promise = Promise.race([
        connector.search(query, config, limitPerSource),
        new Promise<SearchResult[]>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${connectorType}`)), SOURCE_TIMEOUT_MS)
        ),
      ]).catch((err) => {
        console.error(`[DataSources] ${connectorType} error:`, err instanceof Error ? err.message : err);
        return [] as SearchResult[];
      });

      promises.push(promise);
    }
  }

  const results = await Promise.all(promises);
  return results.flat();
}

/**
 * Format search results as context string for LLM injection.
 */
export function formatDataSourceResults(results: SearchResult[]): string {
  if (results.length === 0) return '';

  const lines = results.map((r) => {
    let entry = `### ${r.title}`;
    if (r.reference) entry += ` (${r.reference})`;
    entry += `\n**Source:** ${r.source}`;
    if (r.date) entry += ` | **Date:** ${r.date}`;
    if (r.url) entry += `\n**Lien:** ${r.url}`;
    entry += `\n${r.content}`;
    return entry;
  });

  return [
    '---',
    '## Donn\u00e9es juridiques en temps r\u00e9el',
    'Les informations suivantes proviennent de sources juridiques officielles interrog\u00e9es en temps r\u00e9el. Utilise ces donn\u00e9es pour enrichir ta r\u00e9ponse et cite les r\u00e9f\u00e9rences quand c\'est pertinent.',
    '',
    ...lines,
    '---',
  ].join('\n');
}
