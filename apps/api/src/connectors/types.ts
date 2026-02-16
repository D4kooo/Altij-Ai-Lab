export interface SearchResult {
  title: string;
  content: string;
  url?: string;
  source: string;
  date?: string;
  reference?: string;
}

export interface DataSourceConnector {
  search(query: string, config?: Record<string, string>, limit?: number): Promise<SearchResult[]>;
  isConfigured(): boolean;
}
