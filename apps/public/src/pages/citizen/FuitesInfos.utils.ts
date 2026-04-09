export interface BreachEntry {
  name: string;
  service_type: string;
  date: string;
  records_count: number | null;
  records_count_raw: string;
  data_types: string[];
  site_url: string | null;
  logo_url: string;
  source_url: string | null;
  status: string;
  incident_label: string | null;
}

export type SortKey = 'recent' | 'oldest' | 'records_desc' | 'records_asc';

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.0', '')} Mrd`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')} k`;
  return n.toLocaleString('fr-FR');
}

export function normalizeString(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function extractYears(data: BreachEntry[]): string[] {
  const set = new Set(data.map((d) => d.date?.slice(0, 4)).filter(Boolean));
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

export interface FilterOptions {
  search?: string;
  yearFilter?: string;
  statusFilter?: string;
  sortBy?: SortKey;
}

export function filterAndSortBreaches(
  data: BreachEntry[],
  opts: FilterOptions = {}
): BreachEntry[] {
  const { search = '', yearFilter = 'all', statusFilter = 'all', sortBy = 'recent' } = opts;
  let items = [...data];

  if (search.trim()) {
    const q = normalizeString(search.trim());
    items = items.filter(
      (d) =>
        normalizeString(d.name).includes(q) ||
        normalizeString(d.service_type || '').includes(q)
    );
  }

  if (yearFilter !== 'all') {
    items = items.filter((d) => d.date?.startsWith(yearFilter));
  }

  if (statusFilter !== 'all') {
    items = items.filter((d) => normalizeString(d.status) === normalizeString(statusFilter));
  }

  items.sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return (b.date || '').localeCompare(a.date || '');
      case 'oldest':
        return (a.date || '').localeCompare(b.date || '');
      case 'records_desc':
        return (b.records_count || 0) - (a.records_count || 0);
      case 'records_asc':
        return (a.records_count || 0) - (b.records_count || 0);
      default:
        return 0;
    }
  });

  return items;
}

export interface BreachStats {
  totalRecords: number;
  thisYear: number;
  total: number;
}

export function computeStats(data: BreachEntry[], currentYear: string): BreachStats {
  const totalRecords = data.reduce((sum, d) => sum + (d.records_count || 0), 0);
  const thisYear = data.filter((d) => d.date?.startsWith(currentYear)).length;
  return { totalRecords, thisYear, total: data.length };
}
