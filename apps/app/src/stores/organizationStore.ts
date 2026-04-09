import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchApi } from '@/lib/api';

export interface Organization {
  id: string;
  name: string;
  type: 'work' | 'family';
  isOwner: boolean;
  settings?: {
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
    };
    modelRestrictions?: {
      allowedModels?: string[];
      maxTokensPerDay?: number;
    };
    features?: {
      voiceEnabled?: boolean;
      parentalControls?: boolean;
      maxUsersPerOrg?: number;
    };
  };
  createdAt: string;
}

interface OrganizationState {
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;

  fetchOrganization: () => Promise<void>;
  setOrganization: (org: Organization | null) => void;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
  clearOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      organization: null,
      isLoading: false,
      error: null,

      fetchOrganization: async () => {
        const token = localStorage.getItem('staff_token');
        if (!token) {
          set({ organization: null, isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const data = await fetchApi<Organization>('/organizations/current');
          set({ organization: data, isLoading: false });
        } catch {
          // En cas d'erreur, on continue sans organisation (mode legacy)
          set({
            organization: null,
            error: null,
            isLoading: false
          });
        }
      },

      setOrganization: (org) => {
        set({ organization: org });
      },

      updateOrganization: async (updates) => {
        set({ isLoading: true, error: null });

        try {
          const data = await fetchApi<Organization>('/organizations/current', {
            method: 'PATCH',
            body: JSON.stringify(updates),
          });
          set({ organization: data, isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Erreur inconnue',
            isLoading: false
          });
          throw err;
        }
      },

      clearOrganization: () => {
        set({ organization: null, error: null });
      }
    }),
    {
      name: 'organization-storage',
      partialize: (state) => ({
        organization: state.organization
      })
    }
  )
);

