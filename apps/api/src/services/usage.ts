import { eq, gte, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import type { TokenUsage } from './openrouter';

// Model pricing per 1M tokens (in dollars)
// Source: OpenRouter pricing page (common models)
const MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  'anthropic/claude-sonnet-4': { prompt: 3, completion: 15 },
  'anthropic/claude-3.5-sonnet': { prompt: 3, completion: 15 },
  'anthropic/claude-3-haiku': { prompt: 0.25, completion: 1.25 },
  'anthropic/claude-3-opus': { prompt: 15, completion: 75 },
  'openai/gpt-4o': { prompt: 2.5, completion: 10 },
  'openai/gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
  'openai/gpt-4-turbo': { prompt: 10, completion: 30 },
  'google/gemini-pro-1.5': { prompt: 1.25, completion: 5 },
  'google/gemini-flash-1.5': { prompt: 0.075, completion: 0.3 },
  'mistralai/mistral-large': { prompt: 2, completion: 6 },
  'meta-llama/llama-3.1-70b-instruct': { prompt: 0.52, completion: 0.75 },
  'meta-llama/llama-3.1-8b-instruct': { prompt: 0.055, completion: 0.055 },
};

// Default pricing for unknown models
const DEFAULT_PRICING = { prompt: 1, completion: 3 };

export function estimateCost(model: string, usage: TokenUsage): number {
  const pricing = MODEL_PRICING[model] || DEFAULT_PRICING;
  const promptCost = (usage.promptTokens / 1_000_000) * pricing.prompt;
  const completionCost = (usage.completionTokens / 1_000_000) * pricing.completion;
  return promptCost + completionCost;
}

export async function checkCreditLimit(userId: string): Promise<{ allowed: boolean; used: number; limit: number | null }> {
  // Get user's credit limit
  const [user] = await db
    .select({ creditLimit: schema.users.creditLimit })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user || user.creditLimit === null) {
    return { allowed: true, used: 0, limit: null };
  }

  // Sum cost for current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.apiUsage.costEstimate}), 0)` })
    .from(schema.apiUsage)
    .where(
      sql`${schema.apiUsage.userId} = ${userId} AND ${schema.apiUsage.createdAt} >= ${startOfMonth.toISOString()}`
    );

  const used = Number(result?.total ?? 0);
  return { allowed: used < user.creditLimit, used, limit: user.creditLimit };
}

export async function saveApiUsage(params: {
  userId: string;
  model: string;
  usage: TokenUsage;
  source: 'assistant' | 'sega';
  conversationId: string;
}) {
  const cost = estimateCost(params.model, params.usage);

  await db.insert(schema.apiUsage).values({
    userId: params.userId,
    model: params.model,
    promptTokens: params.usage.promptTokens,
    completionTokens: params.usage.completionTokens,
    totalTokens: params.usage.totalTokens,
    costEstimate: cost,
    source: params.source,
    conversationId: params.conversationId,
  });
}
