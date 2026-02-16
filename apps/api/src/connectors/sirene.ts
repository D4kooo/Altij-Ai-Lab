import type { DataSourceConnector, SearchResult } from './types';

export const sireneConnector: DataSourceConnector = {
  isConfigured() {
    return !!process.env.INSEE_API_KEY;
  },

  async search(query: string, _config?: Record<string, string>, limit = 3): Promise<SearchResult[]> {
    const apiKey = process.env.INSEE_API_KEY;
    if (!apiKey) throw new Error('INSEE_API_KEY required');

    // Search by denomination (company name)
    const params = new URLSearchParams({
      q: `denominationUniteLegale:"${query}" OR sigleUniteLegale:"${query}"`,
      nombre: String(limit),
    });

    const response = await fetch(
      `https://api.insee.fr/entreprises/sirene/V3.11/siren?${params}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) return []; // No results
      throw new Error(`SIRENE search failed: ${response.status}`);
    }

    const data = await response.json() as {
      unitesLegales?: Array<{
        siren?: string;
        periodesUniteLegale?: Array<{
          denominationUniteLegale?: string;
          categorieJuridiqueUniteLegale?: string;
          activitePrincipaleUniteLegale?: string;
          etatAdministratifUniteLegale?: string;
        }>;
        dateCreationUniteLegale?: string;
      }>;
    };

    return (data.unitesLegales || []).slice(0, limit).map((u) => {
      const periode = u.periodesUniteLegale?.[0];
      const denomination = periode?.denominationUniteLegale || 'Inconnu';
      const etat = periode?.etatAdministratifUniteLegale === 'A' ? 'Active' : 'Cess\u00e9e';
      const naf = periode?.activitePrincipaleUniteLegale || '';

      return {
        title: denomination,
        content: `SIREN: ${u.siren || ''} | \u00c9tat: ${etat} | NAF: ${naf} | Cr\u00e9ation: ${u.dateCreationUniteLegale || 'N/A'}`,
        url: u.siren ? `https://annuaire-entreprises.data.gouv.fr/entreprise/${u.siren}` : undefined,
        source: 'SIRENE (INSEE)',
        date: u.dateCreationUniteLegale,
        reference: u.siren,
      };
    });
  },
};
