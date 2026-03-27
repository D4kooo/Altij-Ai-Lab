import OpenAI from 'openai';
import type { ToolDefinition } from './tools';
import { executeTool } from './tools';

let openrouterClient: OpenAI | null = null;

// Liste des modèles Open Source autorisés pour les organisations 'family'
// Ces modèles sont gratuits ou peu coûteux et adaptés à un usage familial
const FAMILY_ALLOWED_MODELS = [
  // Mistral Open Source
  'mistralai/mistral-7b-instruct',
  'mistralai/mistral-7b-instruct:free',
  'mistralai/mixtral-8x7b-instruct',
  // Google Open Models
  'google/gemma-7b-it',
  'google/gemma-7b-it:free',
  'google/gemma-2-9b-it',
  'google/gemma-2-9b-it:free',
  // Meta Llama
  'meta-llama/llama-3-8b-instruct',
  'meta-llama/llama-3-8b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct',
  'meta-llama/llama-3.1-8b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct',
  'meta-llama/llama-3.2-3b-instruct:free',
  // Qwen
  'qwen/qwen-2-7b-instruct',
  'qwen/qwen-2-7b-instruct:free',
  // Microsoft Phi
  'microsoft/phi-3-mini-128k-instruct',
  'microsoft/phi-3-mini-128k-instruct:free',
];

function getOpenRouter(): OpenAI {
  if (!openrouterClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured. Please set it in your .env file.');
    }

    openrouterClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
        'X-Title': 'Data Ring', // Updated from Altij Lab to Data Ring
      },
    });
  }
  return openrouterClient;
}

// Interface pour les messages avec support multimodal
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
}

// Interface pour un modèle OpenRouter
export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  contextLength: number | null;
  pricing: {
    prompt: string;
    completion: string;
  };
  supportedModalities: string[];
}

// Token usage data returned after streaming
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Wrapper that yields strings and exposes usage after iteration
export interface StreamResult {
  stream: AsyncGenerator<string>;
  getUsage: () => TokenUsage | null;
}

// Fonction principale de streaming avec capture d'usage
export function streamChatCompletion(
  model: string,
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): StreamResult {
  let usage: TokenUsage | null = null;

  async function* generate(): AsyncGenerator<string> {
    const client = getOpenRouter();

    const stream = await client.chat.completions.create({
      model,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
      stream_options: { include_usage: true },
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
      // Capture usage from the last chunk (OpenAI SDK standard)
      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.prompt_tokens ?? 0,
          completionTokens: chunk.usage.completion_tokens ?? 0,
          totalTokens: chunk.usage.total_tokens ?? 0,
        };
      }
    }
  }

  return {
    stream: generate(),
    getUsage: () => usage,
  };
}

/**
 * Stream chat completion with tool calling support.
 * Handles the tool-calling loop: model requests tool → execute → send result → resume.
 */
export function streamChatWithTools(
  model: string,
  messages: ChatMessage[],
  tools: ToolDefinition[],
  options: {
    temperature?: number;
    maxTokens?: number;
    onToolCall?: (name: string, args: Record<string, unknown>) => void;
    onToolResult?: (name: string, result: string) => void;
  } = {}
): StreamResult {
  let usage: { promptTokens: number; completionTokens: number; totalTokens: number } = {
    promptTokens: 0, completionTokens: 0, totalTokens: 0,
  };

  const client = getOpenRouter();
  const MAX_ROUNDS = 5;

  async function* generate(): AsyncGenerator<string> {
    let currentMessages = [...messages] as OpenAI.Chat.ChatCompletionMessageParam[];

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const stream = await client.chat.completions.create({
        model,
        messages: currentMessages,
        tools: tools as OpenAI.Chat.ChatCompletionTool[],
        tool_choice: 'auto',
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
        stream_options: { include_usage: true },
      });

      let assistantContent = '';
      const toolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();
      let hasToolCalls = false;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        // Accumulate text content and yield it
        if (delta?.content) {
          assistantContent += delta.content;
          yield delta.content;
        }

        // Accumulate tool calls
        if (delta?.tool_calls) {
          hasToolCalls = true;
          for (const tc of delta.tool_calls) {
            const existing = toolCalls.get(tc.index);
            if (!existing) {
              toolCalls.set(tc.index, {
                id: tc.id || `call_${round}_${tc.index}`,
                name: tc.function?.name || '',
                arguments: tc.function?.arguments || '',
              });
            } else {
              if (tc.function?.name) existing.name = tc.function.name;
              if (tc.function?.arguments) existing.arguments += tc.function.arguments;
            }
          }
        }

        // Capture usage
        if (chunk.usage) {
          usage.promptTokens += chunk.usage.prompt_tokens ?? 0;
          usage.completionTokens += chunk.usage.completion_tokens ?? 0;
          usage.totalTokens += chunk.usage.total_tokens ?? 0;
        }
      }

      // If no tool calls, we're done
      if (!hasToolCalls || toolCalls.size === 0) {
        break;
      }

      // Build assistant message with tool calls
      const toolCallsArray = Array.from(toolCalls.values());
      currentMessages.push({
        role: 'assistant',
        content: assistantContent || null,
        tool_calls: toolCallsArray.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.arguments },
        })),
      });

      // Execute each tool call and add results
      for (const tc of toolCallsArray) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.arguments);
        } catch {
          args = { query: tc.arguments };
        }

        options.onToolCall?.(tc.name, args);

        // Execute with timeout
        let result: string;
        try {
          const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('Tool timeout')), 10000)
          );
          result = await Promise.race([executeTool(tc.name, args), timeoutPromise]);
        } catch (error) {
          result = `Erreur lors de l'exécution de ${tc.name}: ${error instanceof Error ? error.message : 'timeout'}`;
        }

        options.onToolResult?.(tc.name, result);

        currentMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        } as OpenAI.Chat.ChatCompletionToolMessageParam);
      }
    }
  }

  return {
    stream: generate(),
    getUsage: () => usage,
  };
}

// Récupérer la liste des modèles OpenRouter
export async function listModels(): Promise<OpenRouterModel[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch OpenRouter models: ${response.statusText}`);
  }

  const data = await response.json();

  return data.data.map((model: {
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    pricing?: { prompt?: string; completion?: string };
    architecture?: { modality?: string };
  }) => ({
    id: model.id,
    name: model.name,
    description: model.description || '',
    contextLength: model.context_length || null,
    pricing: {
      prompt: model.pricing?.prompt || '0',
      completion: model.pricing?.completion || '0',
    },
    supportedModalities: model.architecture?.modality ? [model.architecture.modality] : ['text'],
  }));
}

// Helper pour convertir un fichier en base64 data URL
export function fileToBase64DataUrl(
  base64Content: string,
  mimeType: string
): string {
  return `data:${mimeType};base64,${base64Content}`;
}

// Construire les messages avec historique
export function buildMessagesWithHistory(
  systemPrompt: string | null,
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'tool'; content: string }>,
  newMessage: string,
  attachments?: Array<{ base64: string; mimeType: string; fileName: string }>,
  ragContext?: string,
  dataSourcesContext?: string
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // System prompt
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  // Data sources context (injected between system prompt and RAG)
  if (dataSourcesContext && dataSourcesContext.trim().length > 0) {
    messages.push({ role: 'system', content: dataSourcesContext });
  }

  // RAG context (injected as a separate system message)
  if (ragContext && ragContext.trim().length > 0) {
    messages.push({ role: 'system', content: ragContext });
  }

  // Historique de conversation
  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Nouveau message (potentiellement multimodal)
  if (attachments && attachments.length > 0) {
    const content: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: newMessage },
    ];

    for (const attachment of attachments) {
      // Support images pour vision
      if (attachment.mimeType.startsWith('image/')) {
        content.push({
          type: 'image_url',
          image_url: {
            url: fileToBase64DataUrl(attachment.base64, attachment.mimeType),
          },
        });
      }
      // Pour les autres fichiers (PDF, etc.), on inclut le nom dans le texte
      // Le contenu doit être extrait côté serveur avant
    }

    messages.push({ role: 'user', content });
  } else {
    messages.push({ role: 'user', content: newMessage });
  }

  return messages;
}

// Chat completion non-streaming (pour des cas simples)
export async function chatCompletion(
  model: string,
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const client = getOpenRouter();

  const response = await client.chat.completions.create({
    model,
    messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
    stream: false,
  });

  return response.choices[0]?.message?.content || '';
}

// Récupérer les modèles autorisés selon le type d'organisation
export async function getAllowedModels(
  orgType: 'work' | 'family',
  customAllowedModels?: string[]
): Promise<OpenRouterModel[]> {
  const allModels = await listModels();

  // Si des modèles custom sont spécifiés (dans les settings de l'org), utiliser ceux-là
  if (customAllowedModels && customAllowedModels.length > 0) {
    return allModels.filter(model => customAllowedModels.includes(model.id));
  }

  // Pour les organisations 'work', tous les modèles sont autorisés
  if (orgType === 'work') {
    return allModels;
  }

  // Pour les organisations 'family', filtrer uniquement les modèles open source
  return allModels.filter(model =>
    FAMILY_ALLOWED_MODELS.some(allowedId =>
      model.id === allowedId || model.id.startsWith(allowedId.split(':')[0])
    )
  );
}

// Vérifier si un modèle est autorisé pour une organisation
export function isModelAllowed(
  modelId: string,
  orgType: 'work' | 'family',
  customAllowedModels?: string[]
): boolean {
  // Si des modèles custom sont spécifiés, vérifier dans cette liste
  if (customAllowedModels && customAllowedModels.length > 0) {
    return customAllowedModels.includes(modelId);
  }

  // Pour 'work', tout est autorisé
  if (orgType === 'work') {
    return true;
  }

  // Pour 'family', vérifier dans la liste des modèles open source
  return FAMILY_ALLOWED_MODELS.some(allowedId =>
    modelId === allowedId || modelId.startsWith(allowedId.split(':')[0])
  );
}

// Export de la liste des modèles family pour référence
export { FAMILY_ALLOWED_MODELS };

export { getOpenRouter };
