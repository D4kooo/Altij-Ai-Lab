import { fetchApi } from './client';

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface BuiltinTool {
  id: string;
  name: string;
  description: string;
}

export const skillsApi = {
  list: async (): Promise<Skill[]> => {
    return fetchApi<Skill[]>('/skills');
  },

  getForAssistant: async (assistantId: string): Promise<Skill[]> => {
    return fetchApi<Skill[]>(`/skills/assistant/${assistantId}`);
  },
};

export const toolsApi = {
  listBuiltin: async (): Promise<BuiltinTool[]> => {
    return [
      { id: 'search_legifrance', name: 'Légifrance', description: 'Codes et lois françaises' },
      { id: 'search_judilibre', name: 'Judilibre', description: 'Jurisprudence française' },
      { id: 'search_sirene', name: 'SIRENE', description: 'Registre des entreprises' },
      { id: 'search_bodacc', name: 'BODACC', description: 'Annonces commerciales' },
      { id: 'search_eurlex', name: 'EUR-Lex', description: 'Droit européen' },
      { id: 'search_gleif', name: 'GLEIF', description: 'Identifiants juridiques mondiaux' },
      { id: 'search_rna', name: 'RNA', description: 'Associations françaises' },
      { id: 'retrieve_documents', name: 'Documents', description: 'Base de connaissances' },
    ];
  },
};
