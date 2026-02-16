import type { Favorite } from '@altij/shared';
import { fetchApi } from './client';

// Favorites API
export const favoritesApi = {
  list: async (): Promise<Favorite[]> => {
    return fetchApi<Favorite[]>('/favorites');
  },

  add: async (itemType: 'assistant' | 'automation', itemId: string): Promise<Favorite> => {
    return fetchApi<Favorite>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ itemType, itemId }),
    });
  },

  remove: async (id: string): Promise<void> => {
    await fetchApi(`/favorites/${id}`, { method: 'DELETE' });
  },

  removeByItem: async (itemType: 'assistant' | 'automation', itemId: string): Promise<void> => {
    await fetchApi(`/favorites/item/${itemType}/${itemId}`, { method: 'DELETE' });
  },
};
