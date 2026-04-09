import type { Campaign } from '@/lib/api';

export const ALL_CATEGORIES_LABEL = 'Toutes les campagnes';

export function filterCampaignsByCategory(
  campaigns: Campaign[],
  category: string
): Campaign[] {
  if (category === ALL_CATEGORIES_LABEL) return campaigns;
  return campaigns.filter((c) => c.category === category);
}

export function getActiveCampaigns(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter((c) => c.status === 'active');
}

export function computeProgressPct(participants: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min((participants / goal) * 100, 100);
}

export function computeTotalParticipants(campaigns: Campaign[]): number {
  return getActiveCampaigns(campaigns).reduce((sum, c) => sum + c.participants, 0);
}
