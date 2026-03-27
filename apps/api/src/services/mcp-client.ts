import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { ToolDefinition } from './tools';

interface McpServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'sse';
  config: Record<string, unknown>;
  isActive: boolean;
}

// Connection pool
const clients = new Map<string, { client: Client; connectedAt: number }>();
const CONNECTION_TTL = 5 * 60 * 1000; // 5 minutes

async function getOrCreateClient(server: McpServerConfig): Promise<Client> {
  const existing = clients.get(server.id);
  if (existing && Date.now() - existing.connectedAt < CONNECTION_TTL) {
    return existing.client;
  }

  // Close existing if expired
  if (existing) {
    try { await existing.client.close(); } catch {}
    clients.delete(server.id);
  }

  const client = new Client({ name: 'altij-lab', version: '1.0.0' }, { capabilities: {} });

  if (server.transport === 'stdio') {
    const { command, args = [], env } = server.config as { command: string; args?: string[]; env?: Record<string, string> };
    const transport = new StdioClientTransport({
      command,
      args,
      env: { ...process.env, ...env } as Record<string, string>,
    });
    await client.connect(transport);
  } else {
    const { url, headers } = server.config as { url: string; headers?: Record<string, string> };
    const transport = new SSEClientTransport(new URL(url), {
      requestInit: headers ? { headers } : undefined,
    });
    await client.connect(transport);
  }

  clients.set(server.id, { client, connectedAt: Date.now() });
  return client;
}

/**
 * List tools from an MCP server, converted to OpenAI-compatible format
 */
export async function listMcpTools(server: McpServerConfig): Promise<ToolDefinition[]> {
  const client = await getOrCreateClient(server);
  const result = await client.listTools();

  return result.tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: `mcp_${server.id.slice(0, 8)}_${tool.name}`,
      description: tool.description || tool.name,
      parameters: (tool.inputSchema as ToolDefinition['function']['parameters']) || {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  }));
}

/**
 * Call a tool on an MCP server
 */
export async function callMcpTool(
  server: McpServerConfig,
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const client = await getOrCreateClient(server);

  // Strip the mcp_{serverId}_ prefix to get the original tool name
  const originalName = toolName.replace(/^mcp_[a-f0-9]+_/, '');

  const result = await client.callTool({ name: originalName, arguments: args });

  // Extract text content from the MCP response
  if (Array.isArray(result.content)) {
    return result.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('\n');
  }

  return String(result.content || 'No result');
}

/**
 * Close all MCP client connections
 */
export async function closeAllMcpClients(): Promise<void> {
  const entries = Array.from(clients.entries());
  for (const [id, { client }] of entries) {
    try { await client.close(); } catch {}
    clients.delete(id);
  }
}
