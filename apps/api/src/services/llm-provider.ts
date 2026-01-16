/**
 * LLM Provider Abstraction Layer
 *
 * Ce service abstrait les différents providers LLM pour permettre une migration
 * progressive vers des serveurs locaux (vLLM, Ollama) pour la souveraineté des données.
 *
 * Roadmap:
 * 1. OpenRouter (actuel) - API unifiée pour tous les modèles cloud
 * 2. LiteLLM Proxy - Centralisation des clés API
 * 3. vLLM/Ollama - Serveurs locaux pour l'auto-hébergement
 */

import OpenAI from 'openai';

export type LLMProviderType = 'openrouter' | 'litellm' | 'ollama' | 'vllm' | 'openai';

export interface LLMProviderConfig {
  type: LLMProviderType;
  baseURL: string;
  apiKey?: string;
  defaultModel?: string;
  headers?: Record<string, string>;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
}

export interface LLMCompletionOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Configuration par défaut des providers
const PROVIDER_CONFIGS: Record<LLMProviderType, Partial<LLMProviderConfig>> = {
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-sonnet-4',
    headers: {
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'Data Ring',
    },
  },
  litellm: {
    baseURL: process.env.LITELLM_URL || 'http://localhost:4000',
    defaultModel: 'gpt-4',
  },
  ollama: {
    baseURL: process.env.OLLAMA_URL || 'http://localhost:11434/v1',
    defaultModel: 'llama3',
  },
  vllm: {
    baseURL: process.env.VLLM_URL || 'http://localhost:8000/v1',
    defaultModel: 'mistral-7b-instruct',
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4-turbo-preview',
  },
};

// Cache des clients par provider
const clientCache = new Map<string, OpenAI>();

/**
 * Crée ou récupère un client LLM pour un provider donné
 */
export function getLLMClient(
  providerType: LLMProviderType,
  customConfig?: Partial<LLMProviderConfig>
): OpenAI {
  const cacheKey = `${providerType}-${JSON.stringify(customConfig || {})}`;

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  const defaultConfig = PROVIDER_CONFIGS[providerType];
  const config: LLMProviderConfig = {
    type: providerType,
    baseURL: customConfig?.baseURL || defaultConfig.baseURL!,
    apiKey: customConfig?.apiKey || getApiKeyForProvider(providerType),
    defaultModel: customConfig?.defaultModel || defaultConfig.defaultModel,
    headers: { ...defaultConfig.headers, ...customConfig?.headers },
  };

  const client = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey || 'not-needed', // Ollama/vLLM locaux n'ont pas besoin de clé
    defaultHeaders: config.headers,
  });

  clientCache.set(cacheKey, client);
  return client;
}

/**
 * Récupère la clé API pour un provider depuis les variables d'environnement
 */
function getApiKeyForProvider(providerType: LLMProviderType): string | undefined {
  switch (providerType) {
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY;
    case 'litellm':
      return process.env.LITELLM_API_KEY;
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'ollama':
    case 'vllm':
      return undefined; // Pas de clé nécessaire pour les serveurs locaux
  }
}

/**
 * Streaming chat completion abstrait
 */
export async function* streamCompletion(
  providerType: LLMProviderType,
  messages: LLMMessage[],
  options: LLMCompletionOptions
): AsyncGenerator<string> {
  const client = getLLMClient(providerType);
  const config = PROVIDER_CONFIGS[providerType];

  const stream = await client.chat.completions.create({
    model: options.model || config.defaultModel!,
    messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

/**
 * Chat completion non-streaming abstrait
 */
export async function completion(
  providerType: LLMProviderType,
  messages: LLMMessage[],
  options: LLMCompletionOptions
): Promise<string> {
  const client = getLLMClient(providerType);
  const config = PROVIDER_CONFIGS[providerType];

  const response = await client.chat.completions.create({
    model: options.model || config.defaultModel!,
    messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
    stream: false,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Vérifie si un provider est disponible (utile pour les serveurs locaux)
 */
export async function isProviderAvailable(providerType: LLMProviderType): Promise<boolean> {
  try {
    const client = getLLMClient(providerType);

    // Pour les serveurs locaux, on fait un health check
    if (providerType === 'ollama' || providerType === 'vllm') {
      const config = PROVIDER_CONFIGS[providerType];
      const response = await fetch(`${config.baseURL}/models`);
      return response.ok;
    }

    // Pour les providers cloud, on vérifie la présence de la clé API
    const apiKey = getApiKeyForProvider(providerType);
    return !!apiKey;
  } catch {
    return false;
  }
}

/**
 * Récupère le provider par défaut selon la configuration
 */
export function getDefaultProvider(): LLMProviderType {
  // Prioriser les serveurs locaux si configurés
  if (process.env.VLLM_URL) return 'vllm';
  if (process.env.OLLAMA_URL) return 'ollama';
  if (process.env.LITELLM_URL) return 'litellm';

  // Fallback sur OpenRouter
  return 'openrouter';
}

/**
 * Liste les modèles disponibles pour un provider
 */
export async function listProviderModels(providerType: LLMProviderType): Promise<string[]> {
  try {
    const client = getLLMClient(providerType);
    const config = PROVIDER_CONFIGS[providerType];

    // Ollama et vLLM ont un endpoint /models
    if (providerType === 'ollama' || providerType === 'vllm') {
      const response = await fetch(`${config.baseURL}/models`);
      if (response.ok) {
        const data = await response.json();
        return data.data?.map((m: { id: string }) => m.id) || [];
      }
    }

    // OpenRouter a son propre endpoint
    if (providerType === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data.data?.map((m: { id: string }) => m.id) || [];
      }
    }

    return [];
  } catch {
    return [];
  }
}
