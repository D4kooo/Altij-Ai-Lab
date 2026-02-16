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

export const judilibreConnector: DataSourceConnector = {
  isConfigured() {
    return !!(process.env.PISTE_CLIENT_ID && process.env.PISTE_CLIENT_SECRET);
  },

  async search(query: string, _config?: Record<string, string>, limit = 3): Promise<SearchResult[]> {
    const token = await getOAuthToken();

    const params = new URLSearchParams({
      query,
      page_size: String(limit),
      order: 'relevance',
    });

    const response = await fetch(
      `https://api.piste.gouv.fr/cassation/judilibre/v1.0/search?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Judilibre search failed: ${response.status}`);
    }

    const data = await response.json() as {
      results?: Array<{
        id?: string;
        jurisdiction?: string;
        chamber?: string;
        decision_date?: string;
        number?: string;
        text?: string;
        highlights?: { text?: string[] };
      }>;
    };

    return (data.results || []).slice(0, limit).map((r) => {
      const highlight = r.highlights?.text?.[0] || r.text || '';
      return {
        title: `${r.jurisdiction || 'Cass.'} ${r.chamber || ''} ${r.decision_date || ''} n\u00b0${r.number || ''}`.trim(),
        content: highlight.substring(0, 500),
        url: r.id ? `https://www.courdecassation.fr/decision/${r.id}` : undefined,
        source: 'Judilibre',
        date: r.decision_date,
        reference: r.number ? `n\u00b0${r.number}` : undefined,
      };
    });
  },
};
