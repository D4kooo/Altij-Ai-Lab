import { describe, it, expect } from 'vitest';
import type { Campaign } from '@/lib/api';
import {
  filterCampaignsByCategory,
  getActiveCampaigns,
  computeProgressPct,
  computeTotalParticipants,
  ALL_CATEGORIES_LABEL,
} from './CollectiveActions.utils';

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: '1',
    title: 't',
    description: 'd',
    category: 'Numérique',
    status: 'active',
    participants: 10,
    participantGoal: 100,
    startDate: null,
    ...overrides,
  } as Campaign;
}

describe('filterCampaignsByCategory', () => {
  const data = [
    makeCampaign({ id: '1', category: 'Numérique' }),
    makeCampaign({ id: '2', category: 'Santé' }),
    makeCampaign({ id: '3', category: 'Numérique' }),
  ];

  it('returns all when ALL_CATEGORIES_LABEL', () => {
    expect(filterCampaignsByCategory(data, ALL_CATEGORIES_LABEL)).toHaveLength(3);
  });

  it('filters by exact category match', () => {
    expect(filterCampaignsByCategory(data, 'Numérique')).toHaveLength(2);
    expect(filterCampaignsByCategory(data, 'Santé')).toHaveLength(1);
  });

  it('returns empty when category has no matches', () => {
    expect(filterCampaignsByCategory(data, 'Environnement')).toHaveLength(0);
  });
});

describe('getActiveCampaigns', () => {
  it('returns only campaigns with status === active', () => {
    const data = [
      makeCampaign({ id: '1', status: 'active' }),
      makeCampaign({ id: '2', status: 'upcoming' }),
      makeCampaign({ id: '3', status: 'completed' }),
      makeCampaign({ id: '4', status: 'active' }),
    ];
    expect(getActiveCampaigns(data)).toHaveLength(2);
  });

  it('handles empty input', () => {
    expect(getActiveCampaigns([])).toEqual([]);
  });
});

describe('computeProgressPct', () => {
  it('returns correct percentage', () => {
    expect(computeProgressPct(50, 100)).toBe(50);
    expect(computeProgressPct(25, 100)).toBe(25);
  });

  it('caps at 100%', () => {
    expect(computeProgressPct(200, 100)).toBe(100);
  });

  it('returns 0 when goal is 0 or negative', () => {
    expect(computeProgressPct(10, 0)).toBe(0);
    expect(computeProgressPct(10, -5)).toBe(0);
  });
});

describe('computeTotalParticipants', () => {
  it('sums participants of active campaigns only', () => {
    const data = [
      makeCampaign({ id: '1', status: 'active', participants: 100 }),
      makeCampaign({ id: '2', status: 'completed', participants: 500 }),
      makeCampaign({ id: '3', status: 'active', participants: 250 }),
    ];
    expect(computeTotalParticipants(data)).toBe(350);
  });

  it('returns 0 for empty input', () => {
    expect(computeTotalParticipants([])).toBe(0);
  });
});
