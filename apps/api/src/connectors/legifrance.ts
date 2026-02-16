import type { DataSourceConnector, SearchResult } from './types';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getOAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.PISTE_CLIENT_ID;
  const clientSecret = process.env.PISTE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PISTE_CLIENT_ID and PISTE_CLIENT_SECRET required');
  }

  const response = await fetch('https://oauth.piste.gouv.fr/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'openid',
    }),
  });

  if (!response.ok) {
    throw new Error(`PISTE OAuth failed: ${response.status}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export const legifranceConnector: DataSourceConnector = {
  isConfigured() {
    return !!(process.env.PISTE_CLIENT_ID && process.env.PISTE_CLIENT_SECRET);
  },

  async search(query: string, config?: Record<string, string>, limit = 3): Promise<SearchResult[]> {
    const token = await getOAuthToken();

    // Build search payload
    const payload: Record<string, unknown> = {
      recherche: {
        champs: [{ typeChamp: 'ALL', criteres: [{ typeRecherche: 'UN_DES_MOTS', valeur: query }] }],
        pageNumber: 1,
        pageSize: limit,
      },
    };

    // Filter by specific code if configured
    let fond = config?.fond || 'LEGI';
    if (config?.codeId) {
      payload.recherche = {
        ...payload.recherche as Record<string, unknown>,
        filtres: [{ facette: 'TEXT_ID', valeurs: [config.codeId] }],
      };
      fond = 'LEGI';
    }

    const url = `https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/search/${fond}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Legifrance search failed: ${response.status}`);
    }

    const data = await response.json() as {
      results?: Array<{
        titles?: { title?: string }[];
        extracts?: Array<{ extract?: string }>;
        id?: string;
        date?: string;
        ref?: string;
      }>;
    };

    return (data.results || []).slice(0, limit).map((r) => ({
      title: r.titles?.[0]?.title || 'Sans titre',
      content: (r.extracts?.[0]?.extract || '').substring(0, 500),
      url: r.id ? `https://www.legifrance.gouv.fr/loda/id/${r.id}` : undefined,
      source: 'L\u00e9gifrance',
      date: r.date,
      reference: r.ref,
    }));
  },
};
