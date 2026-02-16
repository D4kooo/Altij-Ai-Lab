import type { DashboardStats, RecentActivity } from '@altij/shared';
import { fetchApi } from './client';

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    return fetchApi<DashboardStats>('/dashboard/stats');
  },

  getRecentActivity: async (): Promise<RecentActivity[]> => {
    return fetchApi<RecentActivity[]>('/dashboard/recent');
  },
};
