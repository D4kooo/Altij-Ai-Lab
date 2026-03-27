import { searchDataSources, formatDataSourceResults } from '../connectors';
import { retrieveContext } from './retrieval';
import { listMcpTools, callMcpTool } from './mcp-client';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';

// OpenAI-compatible tool definition
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  };
}

// Built-in tool registry
const BUILTIN_TOOLS: Record<string, {
  definition: ToolDefinition;
  execute: (args: Record<string, unknown>) => Promise<string>;
}> = {
  search_legifrance: {
    definition: {
      type: 'function',
      function: {
        name: 'search_legifrance',
        description: 'Rechercher dans la base Légifrance (codes, lois, décrets, textes juridiques français). Utiliser pour toute question sur le droit français.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'La requête de recherche juridique' },
          },
          required: ['query'],
        },
      },
    },
    execute: async (args) => {
      const results = await searchDataSources(['code-civil', 'code-penal', 'code-commerce', 'code-travail'], args.query as string, 3);
      return results.length > 0 ? formatDataSourceResults(results) : 'Aucun résultat trouvé dans Légifrance.';
    },
  },

  search_judilibre: {
    definition: {
      type: 'function',
      function: {
        name: 'search_judilibre',
        description: 'Rechercher dans la jurisprudence française (décisions de justice, arrêts). Utiliser pour trouver des précédents juridiques.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'La requête de recherche jurisprudentielle' },
          },
          required: ['query'],
        },
      },
    },
    execute: async (args) => {
      const results = await searchDataSources(['jurisprudence'], args.query as string, 5);
      return results.length > 0 ? formatDataSourceResults(results) : 'Aucune jurisprudence trouvée.';
    },
  },

  search_sirene: {
    definition: {
      type: 'function',
      function: {
        name: 'search_sirene',
        description: "Rechercher des informations sur une entreprise française (SIRET, SIREN, raison sociale, adresse). Utiliser l'API SIRENE de l'INSEE.",
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: "Nom de l'entreprise ou numéro SIRET/SIREN" },
          },
          required: ['query'],
        },
      },
    },
    execute: async (args) => {
      const results = await searchDataSources(['sirene'], args.query as string, 5);
      return results.length > 0 ? formatDataSourceResults(results) : 'Aucune entreprise trouvée dans SIRENE.';
    },
  },

  search_bodacc: {
    definition: {
      type: 'function',
      function: {
        name: 'search_bodacc',
        description: "Rechercher dans le BODACC (Bulletin Officiel des Annonces Civiles et Commerciales). Procédures collectives, créations, modifications d'entreprises.",
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Nom ou SIREN de l\'entreprise' },
          },
          required: ['query'],
        },
      },
    },
    execute: async (args) => {
      const results = await searchDataSources(['bodacc'], args.query as string, 5);
      return results.length > 0 ? formatDataSourceResults(results) : 'Aucune annonce BODACC trouvée.';
    },
  },

  search_eurlex: {
    definition: {
      type: 'function',
      function: {
        name: 'search_eurlex',
        description: 'Rechercher dans EUR-Lex (droit européen, directives, règlements UE). Utiliser pour le droit de l\'Union européenne.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'La requête de recherche en droit européen' },
          },
          required: ['query'],
        },
      },
    },
    execute: async (args) => {
      const results = await searchDataSources(['eurlex'], args.query as string, 5);
      return results.length > 0 ? formatDataSourceResults(results) : 'Aucun résultat EUR-Lex trouvé.';
    },
  },

  search_gleif: {
    definition: {
      type: 'function',
      function: {
        name: 'search_gleif',
        description: "Rechercher un LEI (Legal Entity Identifier) dans la base GLEIF. Identifier une entité juridique au niveau mondial.",
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: "Nom de l'entité juridique ou LEI" },
          },
          required: ['query'],
        },
      },
    },
    execute: async (args) => {
      const results = await searchDataSources(['gleif'], args.query as string, 5);
      return results.length > 0 ? formatDataSourceResults(results) : 'Aucune entité GLEIF trouvée.';
    },
  },

  search_rna: {
    definition: {
      type: 'function',
      function: {
        name: 'search_rna',
        description: "Rechercher une association dans le RNA (Répertoire National des Associations). Informations sur les associations françaises.",
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: "Nom de l'association ou numéro RNA" },
          },
          required: ['query'],
        },
      },
    },
    execute: async (args) => {
      const results = await searchDataSources(['rna'], args.query as string, 5);
      return results.length > 0 ? formatDataSourceResults(results) : 'Aucune association RNA trouvée.';
    },
  },

  retrieve_documents: {
    definition: {
      type: 'function',
      function: {
        name: 'retrieve_documents',
        description: "Rechercher dans les documents internes de l'assistant (base de connaissances, fichiers uploadés). Utiliser quand la question porte sur des documents spécifiques.",
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'La requête de recherche dans les documents' },
          },
          required: ['query'],
        },
      },
    },
    execute: async (args) => {
      // This needs assistantId context, handled specially in getToolsForAssistant
      return `Document search for: ${args.query}`;
    },
  },
};

// Map data source IDs to tool names
const DATA_SOURCE_TO_TOOL: Record<string, string> = {
  'code-civil': 'search_legifrance',
  'code-penal': 'search_legifrance',
  'code-commerce': 'search_legifrance',
  'code-travail': 'search_legifrance',
  'jurisprudence': 'search_judilibre',
  'sirene': 'search_sirene',
  'bodacc': 'search_bodacc',
  'eurlex': 'search_eurlex',
  'gleif': 'search_gleif',
  'rna': 'search_rna',
};

/**
 * Get tool definitions for an assistant based on its config
 */
export async function getToolsForAssistant(assistant: {
  tools?: { id: string; type: string; enabled: boolean }[] | null;
  dataSources?: string[] | null;
}): Promise<ToolDefinition[]> {
  const toolNames = new Set<string>();

  // Add tools from explicit config
  if (assistant.tools) {
    for (const tool of assistant.tools) {
      if (tool.enabled && tool.type === 'builtin' && BUILTIN_TOOLS[tool.id]) {
        toolNames.add(tool.id);
      }
    }
  }

  // Auto-add tools from dataSources
  if (assistant.dataSources) {
    for (const ds of assistant.dataSources) {
      const toolName = DATA_SOURCE_TO_TOOL[ds];
      if (toolName) {
        toolNames.add(toolName);
      }
    }
  }

  // Add tools from MCP servers
  const mcpDefinitions: ToolDefinition[] = [];
  if (assistant.tools) {
    const mcpTools = assistant.tools.filter((t) => t.enabled && t.type === 'mcp');
    for (const mcpTool of mcpTools) {
      try {
        const [server] = await db
          .select()
          .from(schema.mcpServers)
          .where(eq(schema.mcpServers.id, mcpTool.id));

        if (server && server.isActive) {
          const serverTools = await listMcpTools(server as any);
          mcpDefinitions.push(...serverTools);
        }
      } catch (error) {
        console.error(`Failed to load MCP tools from ${mcpTool.id}:`, error);
      }
    }
  }

  const builtinDefs = Array.from(toolNames)
    .filter((name) => BUILTIN_TOOLS[name])
    .map((name) => BUILTIN_TOOLS[name].definition);

  return [...builtinDefs, ...mcpDefinitions];
}

/**
 * Execute a tool by name with given arguments
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  // Check if it's an MCP tool
  if (name.startsWith('mcp_')) {
    const match = name.match(/^mcp_([a-f0-9]+)_/);
    if (match) {
      const serverIdPrefix = match[1];
      try {
        const servers = await db
          .select()
          .from(schema.mcpServers)
          .where(eq(schema.mcpServers.isActive, true));

        const server = servers.find((s) => s.id.startsWith(serverIdPrefix));
        if (server) {
          return await callMcpTool(server as any, name, args);
        }
      } catch (error) {
        console.error(`MCP tool execution error (${name}):`, error);
      }
      return `Error: MCP server not found for tool "${name}"`;
    }
  }

  // Built-in tool
  const tool = BUILTIN_TOOLS[name];
  if (!tool) {
    return `Error: Unknown tool "${name}"`;
  }

  try {
    return await tool.execute(args);
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error);
    return `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Get all available built-in tool names
 */
export function getAvailableBuiltinTools(): { id: string; name: string; description: string }[] {
  return Object.entries(BUILTIN_TOOLS).map(([id, tool]) => ({
    id,
    name: tool.definition.function.name,
    description: tool.definition.function.description,
  }));
}
