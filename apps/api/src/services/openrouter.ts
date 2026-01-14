import OpenAI from 'openai';

let openrouterClient: OpenAI | null = null;

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
        'X-Title': 'Altij Lab',
      },
    });
  }
  return openrouterClient;
}

// Interface pour les messages avec support multimodal
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
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

// Fonction principale de streaming
export async function* streamChatCompletion(
  model: string,
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): AsyncGenerator<string> {
  const client = getOpenRouter();

  const stream = await client.chat.completions.create({
    model,
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
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  newMessage: string,
  attachments?: Array<{ base64: string; mimeType: string; fileName: string }>,
  ragContext?: string
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // System prompt
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
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

export { getOpenRouter };
