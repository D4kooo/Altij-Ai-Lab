import type { DataSourceConnector, SearchResult } from './types';

export const rnaConnector: DataSourceConnector = {
  isConfigured() {
    return true; // No auth required
  },

  async search(query: string, _config?: Record<string, string>, limit = 3): Promise<SearchResult[]> {
    const response = await fetch(
      `https://entreprise.data.gouv.fr/api/rna/v1/full_text/${encodeURIComponent(query)}?per_page=${limit}`
    );

    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`RNA search failed: ${response.status}`);
    }

    const data = await response.json() as {
      association?: Array<{
        id_association?: string;
        titre?: string;
        objet?: string;
        adresse_siege?: string;
        date_creation?: string;
        date_dissolution?: string;
      }>;
    };

    return (data.association || []).slice(0, limit).map((a) => {
      const status = a.date_dissolution ? 'Dissoute' : 'Active';
      return {
        title: a.titre || 'Association sans nom',
        content: `${(a.objet || '').substring(0, 300)} | Adresse: ${a.adresse_siege || 'N/A'} | Statut: ${status}`,
        url: a.id_association
          ? `https://www.journal-officiel.gouv.fr/pages/associations-detail-annonce/?q.id=${a.id_association}`
          : undefined,
        source: 'RNA',
        date: a.date_creation,
        reference: a.id_association,
      };
    });
  },
};
