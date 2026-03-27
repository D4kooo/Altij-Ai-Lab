import { db, schema } from '../db';
import { eq, and, inArray } from 'drizzle-orm';

interface ResolvedContext {
  systemPromptAdditions: string[];
  additionalTools: { id: string; type: string; enabled: boolean }[];
  additionalDataSources: string[];
}

/**
 * Get available skills for an assistant
 */
export async function getAvailableSkills(assistantId: string) {
  const links = await db
    .select({
      skill: schema.skills,
      isDefault: schema.assistantSkills.isDefault,
    })
    .from(schema.assistantSkills)
    .innerJoin(schema.skills, eq(schema.assistantSkills.skillId, schema.skills.id))
    .where(
      and(
        eq(schema.assistantSkills.assistantId, assistantId),
        eq(schema.skills.isActive, true)
      )
    );

  return links.map((l) => ({
    ...l.skill,
    isDefault: l.isDefault,
  }));
}

/**
 * Resolve conversation context by merging active skills with assistant base config.
 * Returns additional prompts, tools, and data sources to add.
 */
export async function resolveSkillsContext(activeSkillIds: string[]): Promise<ResolvedContext> {
  if (!activeSkillIds.length) {
    return { systemPromptAdditions: [], additionalTools: [], additionalDataSources: [] };
  }

  const activeSkills = await db
    .select()
    .from(schema.skills)
    .where(
      and(
        inArray(schema.skills.id, activeSkillIds),
        eq(schema.skills.isActive, true)
      )
    );

  const systemPromptAdditions: string[] = [];
  const additionalTools: { id: string; type: string; enabled: boolean }[] = [];
  const additionalDataSources: string[] = [];

  for (const skill of activeSkills) {
    if (skill.systemPromptOverride) {
      systemPromptAdditions.push(`\n--- Skill: ${skill.name} ---\n${skill.systemPromptOverride}`);
    }
    if (skill.tools) {
      additionalTools.push(...(skill.tools as { id: string; type: string; enabled: boolean }[]));
    }
    if (skill.dataSources) {
      additionalDataSources.push(...(skill.dataSources as string[]));
    }
  }

  return { systemPromptAdditions, additionalTools, additionalDataSources };
}
