import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  normalizeString,
  extractYears,
  filterAndSortBreaches,
  computeStats,
  type BreachEntry,
} from './FuitesInfos.utils';

function makeBreach(overrides: Partial<BreachEntry> = {}): BreachEntry {
  return {
    name: 'Acme',
    service_type: 'SaaS',
    date: '2024-05-10',
    records_count: 1000,
    records_count_raw: '1000',
    data_types: ['email'],
    site_url: null,
    logo_url: '',
    source_url: null,
    status: 'Confirmée',
    incident_label: null,
    ...overrides,
  };
}

describe('formatNumber', () => {
  it('formats billions with Mrd suffix', () => {
    expect(formatNumber(1_500_000_000)).toBe('1.5 Mrd');
    expect(formatNumber(2_000_000_000)).toBe('2 Mrd');
  });

  it('formats millions with M suffix', () => {
    expect(formatNumber(1_500_000)).toBe('1.5 M');
    expect(formatNumber(2_000_000)).toBe('2 M');
  });

  it('formats thousands with k suffix', () => {
    expect(formatNumber(1_500)).toBe('1.5 k');
    expect(formatNumber(2_000)).toBe('2 k');
  });

  it('formats small numbers via fr-FR locale', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(0)).toBe('0');
  });
});

describe('normalizeString', () => {
  it('strips diacritics and lowercases', () => {
    expect(normalizeString('Éducation')).toBe('education');
    expect(normalizeString('Confirmée')).toBe('confirmee');
    expect(normalizeString('HELLO')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(normalizeString('')).toBe('');
  });
});

describe('extractYears', () => {
  it('extracts unique years sorted desc', () => {
    const data = [
      makeBreach({ date: '2024-01-01' }),
      makeBreach({ date: '2023-05-10' }),
      makeBreach({ date: '2024-12-31' }),
      makeBreach({ date: '2022-07-15' }),
    ];
    expect(extractYears(data)).toEqual(['2024', '2023', '2022']);
  });

  it('filters out empty dates', () => {
    const data = [makeBreach({ date: '' }), makeBreach({ date: '2024-01-01' })];
    expect(extractYears(data)).toEqual(['2024']);
  });

  it('returns empty array for empty data', () => {
    expect(extractYears([])).toEqual([]);
  });
});

describe('filterAndSortBreaches', () => {
  const data = [
    makeBreach({ name: 'Alpha', date: '2024-01-01', records_count: 100, status: 'Confirmée' }),
    makeBreach({ name: 'Beta', date: '2023-06-15', records_count: 500, status: 'Revendiquée' }),
    makeBreach({ name: 'Gamma', date: '2024-11-20', records_count: 300, status: 'Confirmée' }),
  ];

  it('searches by normalized name', () => {
    const result = filterAndSortBreaches(data, { search: 'ALPHA' });
    expect(result.map((r) => r.name)).toEqual(['Alpha']);
  });

  it('filters by year', () => {
    const result = filterAndSortBreaches(data, { yearFilter: '2024' });
    expect(result.map((r) => r.name).sort()).toEqual(['Alpha', 'Gamma']);
  });

  it('filters by status (normalized)', () => {
    const result = filterAndSortBreaches(data, { statusFilter: 'confirmee' });
    expect(result).toHaveLength(2);
  });

  it('sorts by most recent first', () => {
    const result = filterAndSortBreaches(data, { sortBy: 'recent' });
    expect(result.map((r) => r.name)).toEqual(['Gamma', 'Alpha', 'Beta']);
  });

  it('sorts by oldest first', () => {
    const result = filterAndSortBreaches(data, { sortBy: 'oldest' });
    expect(result.map((r) => r.name)).toEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('sorts by records desc', () => {
    const result = filterAndSortBreaches(data, { sortBy: 'records_desc' });
    expect(result.map((r) => r.records_count)).toEqual([500, 300, 100]);
  });

  it('sorts by records asc', () => {
    const result = filterAndSortBreaches(data, { sortBy: 'records_asc' });
    expect(result.map((r) => r.records_count)).toEqual([100, 300, 500]);
  });

  it('does not mutate the original array', () => {
    const original = [...data];
    filterAndSortBreaches(data, { sortBy: 'records_desc' });
    expect(data).toEqual(original);
  });

  it('returns all items with default options', () => {
    expect(filterAndSortBreaches(data)).toHaveLength(3);
  });

  it('handles empty search string', () => {
    expect(filterAndSortBreaches(data, { search: '   ' })).toHaveLength(3);
  });
});

describe('computeStats', () => {
  it('sums records and counts current year', () => {
    const data = [
      makeBreach({ date: '2024-01-01', records_count: 100 }),
      makeBreach({ date: '2024-06-01', records_count: 200 }),
      makeBreach({ date: '2023-01-01', records_count: 50 }),
    ];
    expect(computeStats(data, '2024')).toEqual({
      totalRecords: 350,
      thisYear: 2,
      total: 3,
    });
  });

  it('handles null records_count', () => {
    const data = [makeBreach({ records_count: null })];
    expect(computeStats(data, '2024').totalRecords).toBe(0);
  });

  it('handles empty data', () => {
    expect(computeStats([], '2024')).toEqual({ totalRecords: 0, thisYear: 0, total: 0 });
  });
});
