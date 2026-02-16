import type { DataSourceConnector, SearchResult } from './types';

export const bodaccConnector: DataSourceConnector = {
  isConfigured() {
    // BODACC OpenDataSoft API works without key for basic access
    return true;
  },

  async search(query: string, _config?: Record<string, string>, limit = 3): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      rows: String(limit),
      sort: '-dateparution',
    });

    const apiKey = process.env.BODACC_API_KEY;
    if (apiKey) {
      params.set('apikey', apiKey);
    }

    const response = await fetch(
      `https://bodacc-datadila.opendatasoft.com/api/records/1.0/search/?dataset=annonces-commerciales&${params}`
    );

    if (!response.ok) {
      throw new Error(`BODACC search failed: ${response.status}`);
    }

    const data = await response.json() as {
      records?: Array<{
        fields?: {
          commercant?: string;
          ville?: string;
          typeavis?: string;
          dateparution?: string;
          numerodepartement?: string;
          registre?: string;
          tribunal?: string;
        };
        recordid?: string;
      }>;
    };

    return (data.records || []).slice(0, limit).map((r) => {
      const f = r.fields || {};
      return {
        title: f.commercant || 'Annonce BODACC',
        content: `Type: ${f.typeavis || 'N/A'} | Ville: ${f.ville || 'N/A'} | Tribunal: ${f.tribunal || 'N/A'} | Registre: ${f.registre || 'N/A'}`,
        url: r.recordid
          ? `https://bodacc-datadila.opendatasoft.com/explore/dataset/annonces-commerciales/table/?q=${encodeURIComponent(query)}`
          : undefined,
        source: 'BODACC',
        date: f.dateparution,
        reference: f.registre,
      };
    });
  },
};
