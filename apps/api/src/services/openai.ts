import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'sk-your-openai-api-key-here') {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// For backwards compatibility
const openai = {
  get beta() {
    return getOpenAI().beta;
  },
  get files() {
    return getOpenAI().files;
  },
};

export async function createThread(): Promise<string> {
  const thread = await openai.beta.threads.create();
  return thread.id;
}

export async function addMessageToThread(
  threadId: string,
  content: string,
  fileIds?: string[]
): Promise<void> {
  const attachments = fileIds?.map((id) => ({
    file_id: id,
    tools: [{ type: 'file_search' as const }],
  }));

  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content,
    attachments,
  });
}

export async function* runAssistantStream(
  threadId: string,
  assistantId: string
): AsyncGenerator<string> {
  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  });

  for await (const event of stream) {
    if (event.event === 'thread.message.delta') {
      const delta = event.data.delta;
      if (delta.content?.[0]?.type === 'text') {
        const textDelta = delta.content[0] as { type: 'text'; text?: { value?: string } };
        yield textDelta.text?.value ?? '';
      }
    }
  }
}

export async function getThreadMessages(
  threadId: string,
  limit: number = 100
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const response = await openai.beta.threads.messages.list(threadId, {
    limit,
    order: 'asc',
  });

  return response.data.map((message) => ({
    role: message.role as 'user' | 'assistant',
    content: message.content
      .filter((c): c is OpenAI.Beta.Threads.Messages.TextContentBlock => c.type === 'text')
      .map((c) => c.text.value)
      .join('\n'),
  }));
}

export async function uploadFile(file: File): Promise<string> {
  const uploadedFile = await openai.files.create({
    file,
    purpose: 'assistants',
  });
  return uploadedFile.id;
}

export async function deleteFile(fileId: string): Promise<void> {
  await openai.files.del(fileId);
}

export async function createAssistant(params: {
  name: string;
  description: string;
  instructions: string;
  model?: string;
}): Promise<string> {
  const assistant = await openai.beta.assistants.create({
    name: params.name,
    description: params.description,
    instructions: params.instructions,
    model: params.model || 'gpt-4-turbo-preview',
    tools: [{ type: 'file_search' }],
  });
  return assistant.id;
}

export async function updateAssistant(
  assistantId: string,
  params: {
    name?: string;
    description?: string;
    instructions?: string;
  }
): Promise<void> {
  await openai.beta.assistants.update(assistantId, params);
}

export async function deleteAssistant(assistantId: string): Promise<void> {
  await openai.beta.assistants.del(assistantId);
}

export async function listOpenAIAssistants(): Promise<Array<{
  id: string;
  name: string | null;
  description: string | null;
  instructions: string | null;
  model: string;
  created_at: number;
}>> {
  const response = await openai.beta.assistants.list({
    limit: 100,
    order: 'desc',
  });

  return response.data.map((assistant) => ({
    id: assistant.id,
    name: assistant.name,
    description: assistant.description,
    instructions: assistant.instructions,
    model: assistant.model,
    created_at: assistant.created_at,
  }));
}

export async function getOpenAIAssistant(assistantId: string): Promise<{
  id: string;
  name: string | null;
  description: string | null;
  instructions: string | null;
  model: string;
  created_at: number;
}> {
  const assistant = await openai.beta.assistants.retrieve(assistantId);
  return {
    id: assistant.id,
    name: assistant.name,
    description: assistant.description,
    instructions: assistant.instructions,
    model: assistant.model,
    created_at: assistant.created_at,
  };
}

export { openai, getOpenAI };
