import OpenAI from 'openai';

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
