/**
 * AI Verification Service for Anonymization
 * Uses ChatGPT to verify and complete anonymization
 */

import { getOpenAI } from './openai';
import type { DetectedEntity, EntityType } from './anonymization-patterns';

export interface MissedEntity {
  type: EntityType;
  value: string;
  suggestion: string;
  context: string;
  reason: string;
}

export interface AIVerificationResult {
  isComplete: boolean;
  missedEntities: MissedEntity[];
  confidence: number;
  suggestions: string[];
}

const VERIFICATION_SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'anonymisation de documents juridiques et commerciaux français. Ton rôle est de vérifier qu'un document a été correctement anonymisé et d'identifier toute donnée sensible qui aurait pu être oubliée.

Tu dois rechercher:
1. **Noms de personnes** - Prénoms et noms de famille, titres (M., Mme, Me, Dr)
2. **Noms d'entreprises** - Raisons sociales, noms commerciaux (SAS, SARL, SA, EURL, etc.)
3. **Adresses** - Rues, villes, codes postaux non encore anonymisés
4. **Numéros d'identification** - SIRET, SIREN, NIR, RCS, TVA non encore anonymisés
5. **Coordonnées** - Téléphones, emails non encore anonymisés
6. **Coordonnées bancaires** - IBAN, BIC non encore anonymisés
7. **Dates significatives** - Dates de naissance, dates spécifiques permettant l'identification

Les éléments déjà anonymisés sont entre crochets comme [PERSONNE_1], [SOCIETE_2], [ADRESSE_3], etc.
Tu dois ignorer ces éléments et te concentrer sur ce qui n'est PAS entre crochets.

IMPORTANT: Sois rigoureux mais évite les faux positifs. Ne signale pas:
- Les termes juridiques génériques (contrat, partie, société)
- Les dates génériques sans contexte personnel
- Les nombres qui ne sont clairement pas des identifiants
- Les noms communs ou génériques

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "isComplete": boolean,
  "confidence": number (0.0 à 1.0),
  "missedEntities": [
    {
      "type": "name|company|address|phone|email|siret|siren|nir|iban|date|other",
      "value": "texte trouvé",
      "suggestion": "[TYPE_X]",
      "context": "phrase ou contexte où le texte apparaît",
      "reason": "explication courte"
    }
  ],
  "suggestions": ["suggestions générales d'amélioration"]
}`;

/**
 * Verify anonymization using ChatGPT
 */
export async function verifyAnonymization(
  anonymizedText: string,
  correspondenceTable?: Map<string, string>
): Promise<AIVerificationResult> {
  const openai = getOpenAI();

  // Prepare context about what was already anonymized
  let context = '';
  if (correspondenceTable && correspondenceTable.size > 0) {
    context = '\n\nÉléments déjà anonymisés:\n';
    for (const [original, replacement] of correspondenceTable) {
      context += `- ${replacement} (remplace un élément de type ${getTypeFromReplacement(replacement)})\n`;
    }
  }

  // Truncate text if too long (keep first and last parts)
  const maxLength = 12000;
  let textToAnalyze = anonymizedText;
  if (anonymizedText.length > maxLength) {
    const halfLength = Math.floor(maxLength / 2);
    textToAnalyze =
      anonymizedText.substring(0, halfLength) +
      '\n\n[... texte tronqué ...]\n\n' +
      anonymizedText.substring(anonymizedText.length - halfLength);
  }

  const userMessage = `Analyse ce document anonymisé et identifie toute donnée sensible qui aurait pu être oubliée:

---
${textToAnalyze}
---
${context}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective for this task
      messages: [
        { role: 'system', content: VERIFICATION_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    const result = JSON.parse(content);

    // Validate and normalize the response
    return {
      isComplete: result.isComplete ?? true,
      confidence: Math.max(0, Math.min(1, result.confidence ?? 0.5)),
      missedEntities: (result.missedEntities || []).map(normalizeEntity),
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error('AI verification error:', error);

    // Return a safe default if AI fails
    return {
      isComplete: true,
      confidence: 0,
      missedEntities: [],
      suggestions: ['La vérification IA a échoué. Veuillez vérifier manuellement le document.'],
    };
  }
}

/**
 * Extract entity type from replacement string
 */
function getTypeFromReplacement(replacement: string): string {
  const match = replacement.match(/\[([A-Z_]+)_\d+\]/);
  if (match) {
    const typeMap: Record<string, string> = {
      'PERSONNE': 'nom',
      'SOCIETE': 'entreprise',
      'ADRESSE': 'adresse',
      'TEL': 'téléphone',
      'EMAIL': 'email',
      'SIRET': 'SIRET',
      'SIREN': 'SIREN',
      'NIR': 'numéro SS',
      'IBAN': 'IBAN',
      'DATE': 'date',
      'CP': 'code postal',
      'ELEMENT': 'autre',
    };
    return typeMap[match[1]] || 'inconnu';
  }
  return 'inconnu';
}

/**
 * Normalize entity from AI response
 */
function normalizeEntity(entity: Record<string, unknown>): MissedEntity {
  const typeMap: Record<string, EntityType> = {
    'name': 'name',
    'nom': 'name',
    'personne': 'name',
    'company': 'siren', // Use siren as placeholder for company
    'entreprise': 'siren',
    'societe': 'siren',
    'address': 'address',
    'adresse': 'address',
    'phone': 'phone',
    'telephone': 'phone',
    'email': 'email',
    'siret': 'siret',
    'siren': 'siren',
    'nir': 'nir',
    'iban': 'iban',
    'date': 'date',
    'other': 'custom',
    'autre': 'custom',
  };

  const rawType = String(entity.type || 'custom').toLowerCase();
  const type = typeMap[rawType] || 'custom';

  return {
    type,
    value: String(entity.value || ''),
    suggestion: String(entity.suggestion || generateSuggestion(type)),
    context: String(entity.context || ''),
    reason: String(entity.reason || ''),
  };
}

/**
 * Generate a replacement suggestion based on type
 */
function generateSuggestion(type: EntityType): string {
  const prefixes: Record<EntityType, string> = {
    email: '[EMAIL_X]',
    phone: '[TEL_X]',
    siret: '[SIRET_X]',
    siren: '[SOCIETE_X]',
    nir: '[NIR_X]',
    iban: '[IBAN_X]',
    bic: '[BIC_X]',
    rcs: '[RCS_X]',
    tva: '[TVA_X]',
    date: '[DATE_X]',
    address: '[ADRESSE_X]',
    postal_code: '[CP_X]',
    name: '[PERSONNE_X]',
    custom: '[ELEMENT_X]',
  };
  return prefixes[type] || '[ELEMENT_X]';
}

/**
 * Apply AI suggestions to text
 */
export function applyAISuggestions(
  text: string,
  missedEntities: MissedEntity[]
): { text: string; applied: number } {
  let result = text;
  let applied = 0;

  // Sort by length descending to avoid partial replacements
  const sorted = [...missedEntities].sort((a, b) => b.value.length - a.value.length);

  for (const entity of sorted) {
    if (!entity.value || entity.value.length < 2) continue;

    // Create a regex that matches the exact value (case insensitive)
    const escapedValue = entity.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedValue, 'gi');

    const before = result;
    result = result.replace(regex, entity.suggestion);

    if (result !== before) {
      applied++;
    }
  }

  return { text: result, applied };
}

/**
 * Convert MissedEntity to DetectedEntity format
 */
export function convertToDetectedEntity(
  entity: MissedEntity,
  text: string,
  existingCount: number
): DetectedEntity | null {
  const index = text.indexOf(entity.value);
  if (index === -1) return null;

  return {
    id: `ai-${entity.type}-${index}`,
    type: entity.type,
    value: entity.value,
    replacement: entity.suggestion.replace('_X]', `_${existingCount + 1}]`),
    position: {
      start: index,
      end: index + entity.value.length,
    },
    confidence: 0.7, // AI-detected entities have lower confidence
  };
}
