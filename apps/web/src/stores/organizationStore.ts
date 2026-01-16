import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
        const token = localStorage.getItem('token');
        if (!token) {
          set({ organization: null, isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/organizations/current', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (!response.ok) {
            if (response.status === 404 || response.status === 500) {
              // Pas d'organisation = nouvel utilisateur ou feature pas encore disponible
              // On continue sans organisation (mode legacy)
              set({ organization: null, isLoading: false, error: null });
              return;
            }
            throw new Error('Erreur lors du chargement de l\'organisation');
          }

          const data = await response.json();
          set({ organization: data.data, isLoading: false });
        } catch (err) {
          // En cas d'erreur, on continue sans organisation (mode legacy)
          console.warn('Organization fetch failed, continuing in legacy mode:', err);
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
        const token = localStorage.getItem('token');
        if (!token) return;

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/organizations/current', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(updates)
          });

          if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour');
          }

          const data = await response.json();
          set({ organization: data.data, isLoading: false });
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

// Hook helper pour vérifier si c'est un espace Work ou Family
export function useIsWorkspace() {
  const organization = useOrganizationStore((state) => state.organization);
  return organization?.type === 'work';
}

export function useIsFamilyspace() {
  const organization = useOrganizationStore((state) => state.organization);
  return organization?.type === 'family';
}

// Hook pour obtenir les fonctionnalités disponibles selon le type
export function useAvailableFeatures() {
  const organization = useOrganizationStore((state) => state.organization);

  if (!organization) {
    return {
      hasAutomations: false,
      hasVeille: false,
      hasAnonymizer: false,
      hasParentalControls: false,
      hasVoice: false,
      hasCustomAssistants: false
    };
  }

  const isWork = organization.type === 'work';
  const isFamily = organization.type === 'family';

  return {
    // Work-only features
    hasAutomations: isWork,
    hasVeille: isWork,
    hasAnonymizer: isWork,

    // Family-only features
    hasParentalControls: isFamily,
    hasVoice: isFamily || organization.settings?.features?.voiceEnabled,

    // Common features
    hasCustomAssistants: true
  };
}
