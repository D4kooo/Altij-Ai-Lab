import type { DataSourceConnector, SearchResult } from './types';

export const eurlexConnector: DataSourceConnector = {
  isConfigured() {
    return true; // No auth required
  },

  async search(query: string, config?: Record<string, string>, limit = 3): Promise<SearchResult[]> {
    // EUR-Lex CELLAR SPARQL/REST endpoint
    // Use the search API with keywords
    const type = config?.type || 'legislation';

    // Map type to EUR-Lex resource type
    const typeFilter: Record<string, string> = {
      'legislation': 'reg,dir,dec',
      'case-law': 'judg',
      'treaty': 'treaty',
    };

    const params = new URLSearchParams({
      text: query,
      qid: Date.now().toString(),
      page: '1',
      type: typeFilter[type] || 'reg,dir,dec',
    });

    // Use the EUR-Lex search web API
    const response = await fetch(
      `https://eur-lex.europa.eu/search.html?${params}`,
      {
        headers: { Accept: 'application/json' },
      }
    );

    // EUR-Lex may not return JSON for all endpoints
    // Fallback: use CELLAR REST API for metadata
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
      // Fallback to CELLAR REST
      return searchCellar(query, type, limit);
    }

    try {
      const data = await response.json() as {
        results?: Array<{
          title?: string;
          cellarId?: string;
          date?: string;
          celex?: string;
          snippet?: string;
        }>;
      };

      return (data.results || []).slice(0, limit).map((r) => ({
        title: r.title || 'Document EUR-Lex',
        content: (r.snippet || '').substring(0, 500),
        url: r.celex ? `https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:${r.celex}` : undefined,
        source: 'EUR-Lex',
        date: r.date,
        reference: r.celex,
      }));
    } catch {
      return searchCellar(query, type, limit);
    }
  },
};

async function searchCellar(query: string, type: string, limit: number): Promise<SearchResult[]> {
  // CELLAR SPARQL endpoint for structured search
  const typeMapping: Record<string, string> = {
    'legislation': 'cdm:regulation',
    'case-law': 'cdm:case-law',
    'treaty': 'cdm:treaty',
  };
  const rdfType = typeMapping[type] || 'cdm:legislation';

  const sparql = `
    PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
    SELECT ?work ?title ?date WHERE {
      ?work a ${rdfType} .
      ?work cdm:work_has_expression ?expr .
      ?expr cdm:expression_title ?title .
      OPTIONAL { ?work cdm:work_date_document ?date . }
      FILTER(LANG(?title) = "fr" || LANG(?title) = "")
      FILTER(CONTAINS(LCASE(?title), LCASE("${query.replace(/"/g, '\\"')}")))
    }
    LIMIT ${limit}
  `;

  try {
    const response = await fetch('https://publications.europa.eu/webapi/rdf/sparql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/sparql-results+json',
      },
      body: new URLSearchParams({ query: sparql }),
    });

    if (!response.ok) return [];

    const data = await response.json() as {
      results?: {
        bindings?: Array<{
          work?: { value?: string };
          title?: { value?: string };
          date?: { value?: string };
        }>;
      };
    };

    return (data.results?.bindings || []).slice(0, limit).map((b) => ({
      title: b.title?.value || 'Document UE',
      content: b.title?.value || '',
      url: b.work?.value,
      source: 'EUR-Lex',
      date: b.date?.value,
    }));
  } catch {
    return [];
  }
}
