import type { DataSourceConnector, SearchResult } from './types';

export const gleifConnector: DataSourceConnector = {
  isConfigured() {
    return true; // No auth required
  },

  async search(query: string, _config?: Record<string, string>, limit = 3): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      'filter[fulltext]': query,
      'page[size]': String(limit),
    });

    const response = await fetch(
      `https://api.gleif.org/api/v1/lei-records?${params}`,
      {
        headers: { Accept: 'application/vnd.api+json' },
      }
    );

    if (!response.ok) {
      throw new Error(`GLEIF search failed: ${response.status}`);
    }

    const data = await response.json() as {
      data?: Array<{
        attributes?: {
          lei?: string;
          entity?: {
            legalName?: { name?: string };
            legalAddress?: { country?: string; city?: string };
            status?: string;
            category?: string;
          };
          registration?: { initialRegistrationDate?: string };
        };
      }>;
    };

    return (data.data || []).slice(0, limit).map((r) => {
      const entity = r.attributes?.entity;
      const name = entity?.legalName?.name || 'Inconnu';
      const country = entity?.legalAddress?.country || '';
      const city = entity?.legalAddress?.city || '';
      const lei = r.attributes?.lei || '';
      const status = entity?.status || '';

      return {
        title: name,
        content: `LEI: ${lei} | Statut: ${status} | Localisation: ${city}, ${country}`,
        url: lei ? `https://search.gleif.org/#/record/${lei}` : undefined,
        source: 'GLEIF',
        date: r.attributes?.registration?.initialRegistrationDate,
        reference: lei,
      };
    });
  },
};
