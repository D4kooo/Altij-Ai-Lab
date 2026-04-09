import { fetchApi } from './client';

// Organizations API
export const organizationsApi = {
  getCurrent: async () => {
    return fetchApi<{ id: string; name: string; type: string }>('/organizations/current');
  },
};
