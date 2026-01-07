/**
 * Anonymization Patterns Service
 * Comprehensive regex patterns for detecting French and standard PII
 */

export type EntityType =
  | 'email'
  | 'phone'
  | 'siret'
  | 'siren'
  | 'nir'
  | 'iban'
  | 'bic'
  | 'rcs'
  | 'tva'
  | 'date'
  | 'address'
  | 'postal_code'
  | 'name'
  | 'custom';

export interface DetectedEntity {
  id: string;
  type: EntityType;
  value: string;
  replacement: string;
  position: {
    start: number;
    end: number;
  };
  confidence: number; // 0-1, how confident we are this is PII
}

export interface PatternConfig {
  pattern: RegExp;
  type: EntityType;
  label: string;
  replacementPrefix: string;
  confidence: number;
  validate?: (match: string) => boolean;
}

// Counter for generating unique replacements
const counters: Record<EntityType, number> = {
  email: 0,
  phone: 0,
  siret: 0,
  siren: 0,
  nir: 0,
  iban: 0,
  bic: 0,
  rcs: 0,
  tva: 0,
  date: 0,
  address: 0,
  postal_code: 0,
  name: 0,
  custom: 0,
};

/**
 * Reset all counters (call before processing a new document)
 */
export function resetCounters(): void {
  for (const key of Object.keys(counters) as EntityType[]) {
    counters[key] = 0;
  }
}

/**
 * Generate a replacement string for an entity
 */
function generateReplacement(type: EntityType): string {
  counters[type]++;
  const prefixes: Record<EntityType, string> = {
    email: 'EMAIL',
    phone: 'TEL',
    siret: 'SIRET',
    siren: 'SIREN',
    nir: 'NIR',
    iban: 'IBAN',
    bic: 'BIC',
    rcs: 'RCS',
    tva: 'TVA',
    date: 'DATE',
    address: 'ADRESSE',
    postal_code: 'CP',
    name: 'PERSONNE',
    custom: 'ELEMENT',
  };
  return `[${prefixes[type]}_${counters[type]}]`;
}

/**
 * Validate French NIR (Social Security Number)
 * Format: X XX XX XX XXX XXX CC
 */
function validateNIR(nir: string): boolean {
  const cleaned = nir.replace(/\s/g, '');
  if (cleaned.length !== 15) return false;

  // First digit must be 1 or 2
  if (!['1', '2'].includes(cleaned[0])) return false;

  // Basic structure check
  const baseNumber = cleaned.substring(0, 13);
  const key = parseInt(cleaned.substring(13, 15), 10);

  // Handle Corsica (2A, 2B)
  let numericBase = baseNumber;
  if (baseNumber.includes('A')) {
    numericBase = baseNumber.replace('A', '0');
  } else if (baseNumber.includes('B')) {
    numericBase = baseNumber.replace('B', '0');
  }

  const expectedKey = 97 - (parseInt(numericBase, 10) % 97);
  return key === expectedKey;
}

/**
 * Validate SIRET (14 digits with Luhn check)
 */
function validateSIRET(siret: string): boolean {
  const cleaned = siret.replace(/\s/g, '');
  if (cleaned.length !== 14) return false;
  if (!/^\d{14}$/.test(cleaned)) return false;

  // Luhn algorithm for SIRET
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned[i], 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * Validate SIREN (9 digits with Luhn check)
 */
function validateSIREN(siren: string): boolean {
  const cleaned = siren.replace(/\s/g, '');
  if (cleaned.length !== 9) return false;
  if (!/^\d{9}$/.test(cleaned)) return false;

  // Luhn algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(cleaned[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * Validate French IBAN
 */
function validateFrenchIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  if (!cleaned.startsWith('FR')) return false;
  if (cleaned.length !== 27) return false;
  return true; // Basic validation, full IBAN checksum is complex
}

/**
 * Pattern configurations for all detectable entity types
 */
const PATTERNS: PatternConfig[] = [
  // Email addresses
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    type: 'email',
    label: 'Email',
    replacementPrefix: 'EMAIL',
    confidence: 0.95,
  },

  // French phone numbers (various formats)
  {
    pattern: /(?:\+33|0033|\(\+33\))\s*[1-9](?:[\s.-]*\d{2}){4}/g,
    type: 'phone',
    label: 'Téléphone (+33)',
    replacementPrefix: 'TEL',
    confidence: 0.95,
  },
  {
    pattern: /\b0[1-9](?:[\s.-]*\d{2}){4}\b/g,
    type: 'phone',
    label: 'Téléphone (0X)',
    replacementPrefix: 'TEL',
    confidence: 0.9,
  },

  // SIRET (14 digits)
  {
    pattern: /\b\d{3}[\s.]?\d{3}[\s.]?\d{3}[\s.]?\d{5}\b/g,
    type: 'siret',
    label: 'SIRET',
    replacementPrefix: 'SIRET',
    confidence: 0.85,
    validate: validateSIRET,
  },

  // SIREN (9 digits) - must not be followed by 5 more digits (SIRET)
  {
    pattern: /\b\d{3}[\s.]?\d{3}[\s.]?\d{3}\b(?![\s.]?\d{5})/g,
    type: 'siren',
    label: 'SIREN',
    replacementPrefix: 'SIREN',
    confidence: 0.8,
    validate: validateSIREN,
  },

  // NIR (French Social Security Number)
  {
    pattern: /\b[12][\s.]?\d{2}[\s.]?\d{2}[\s.]?(?:\d{2}|2[AB])[\s.]?\d{3}[\s.]?\d{3}[\s.]?\d{2}\b/gi,
    type: 'nir',
    label: 'NIR (Sécurité Sociale)',
    replacementPrefix: 'NIR',
    confidence: 0.95,
    validate: validateNIR,
  },

  // French IBAN
  {
    pattern: /\bFR\d{2}[\s]?(?:\d{4}[\s]?){5}\d{3}\b/gi,
    type: 'iban',
    label: 'IBAN',
    replacementPrefix: 'IBAN',
    confidence: 0.95,
    validate: validateFrenchIBAN,
  },

  // International IBAN (other countries)
  {
    pattern: /\b[A-Z]{2}\d{2}[\s]?(?:[A-Z0-9]{4}[\s]?){3,7}[A-Z0-9]{1,4}\b/g,
    type: 'iban',
    label: 'IBAN',
    replacementPrefix: 'IBAN',
    confidence: 0.85,
  },

  // BIC/SWIFT code
  {
    pattern: /\b[A-Z]{4}FR[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g,
    type: 'bic',
    label: 'BIC',
    replacementPrefix: 'BIC',
    confidence: 0.9,
  },

  // RCS number
  {
    pattern: /\b(?:RCS|R\.C\.S\.?)\s*[A-Z][A-Za-z\s-]+\s*(?:[A-Z]\s*)?\d{3}[\s.]?\d{3}[\s.]?\d{3}\b/gi,
    type: 'rcs',
    label: 'RCS',
    replacementPrefix: 'RCS',
    confidence: 0.9,
  },

  // TVA intracommunautaire
  {
    pattern: /\bFR[\s]?\d{2}[\s]?\d{3}[\s]?\d{3}[\s]?\d{3}\b/gi,
    type: 'tva',
    label: 'N° TVA',
    replacementPrefix: 'TVA',
    confidence: 0.9,
  },

  // French postal codes (standalone)
  {
    pattern: /\b(?:0[1-9]|[1-8]\d|9[0-5]|97[1-6])\d{3}\b/g,
    type: 'postal_code',
    label: 'Code Postal',
    replacementPrefix: 'CP',
    confidence: 0.6, // Lower confidence as numbers could be other things
  },

  // Dates (various French formats)
  {
    pattern: /\b(?:0?[1-9]|[12]\d|3[01])[\s/.-](?:0?[1-9]|1[0-2])[\s/.-](?:19|20)\d{2}\b/g,
    type: 'date',
    label: 'Date',
    replacementPrefix: 'DATE',
    confidence: 0.85,
  },
  {
    pattern: /\b(?:0?[1-9]|[12]\d|3[01])[\s]?(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)[\s]?(?:19|20)\d{2}\b/gi,
    type: 'date',
    label: 'Date',
    replacementPrefix: 'DATE',
    confidence: 0.9,
  },
];

/**
 * Detect all sensitive data in text using regex patterns
 */
export function detectSensitiveData(text: string): DetectedEntity[] {
  resetCounters();
  const entities: DetectedEntity[] = [];
  const usedRanges: Array<{ start: number; end: number }> = [];

  // Helper to check if a range overlaps with existing entities
  const isOverlapping = (start: number, end: number): boolean => {
    return usedRanges.some((range) =>
      (start >= range.start && start < range.end) ||
      (end > range.start && end <= range.end) ||
      (start <= range.start && end >= range.end)
    );
  };

  // Process each pattern
  for (const config of PATTERNS) {
    const regex = new RegExp(config.pattern.source, config.pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const value = match[0];
      const start = match.index;
      const end = start + value.length;

      // Skip if overlapping with existing entity
      if (isOverlapping(start, end)) {
        continue;
      }

      // Validate if validator exists
      if (config.validate && !config.validate(value)) {
        continue;
      }

      // Skip postal codes that are too short or likely false positives
      if (config.type === 'postal_code' && value.length < 5) {
        continue;
      }

      const entity: DetectedEntity = {
        id: `${config.type}-${start}-${end}`,
        type: config.type,
        value,
        replacement: generateReplacement(config.type),
        position: { start, end },
        confidence: config.confidence,
      };

      entities.push(entity);
      usedRanges.push({ start, end });
    }
  }

  // Sort entities by position
  entities.sort((a, b) => a.position.start - b.position.start);

  return entities;
}

/**
 * Apply anonymization to text using detected entities
 */
export function anonymizeWithPatterns(
  text: string,
  entities: DetectedEntity[]
): string {
  // Sort by position descending to replace from end to start
  const sortedEntities = [...entities].sort(
    (a, b) => b.position.start - a.position.start
  );

  let result = text;

  for (const entity of sortedEntities) {
    result =
      result.substring(0, entity.position.start) +
      entity.replacement +
      result.substring(entity.position.end);
  }

  return result;
}

/**
 * Get entity type label in French
 */
export function getEntityTypeLabel(type: EntityType): string {
  const labels: Record<EntityType, string> = {
    email: 'Email',
    phone: 'Téléphone',
    siret: 'SIRET',
    siren: 'SIREN',
    nir: 'N° Sécurité Sociale',
    iban: 'IBAN',
    bic: 'BIC',
    rcs: 'RCS',
    tva: 'N° TVA',
    date: 'Date',
    address: 'Adresse',
    postal_code: 'Code Postal',
    name: 'Nom',
    custom: 'Autre',
  };
  return labels[type] || type;
}

/**
 * Get entity type icon name (for frontend)
 */
export function getEntityTypeIcon(type: EntityType): string {
  const icons: Record<EntityType, string> = {
    email: 'Mail',
    phone: 'Phone',
    siret: 'Building2',
    siren: 'Building',
    nir: 'CreditCard',
    iban: 'Wallet',
    bic: 'Landmark',
    rcs: 'FileText',
    tva: 'Receipt',
    date: 'Calendar',
    address: 'MapPin',
    postal_code: 'MapPin',
    name: 'User',
    custom: 'Tag',
  };
  return icons[type] || 'Tag';
}

/**
 * Merge auto-detected entities with user-provided terms
 * User terms take priority
 */
export function mergeEntities(
  autoDetected: DetectedEntity[],
  userTerms: Array<{ original: string; replacement: string; type: string }>
): DetectedEntity[] {
  const merged = [...autoDetected];

  for (const term of userTerms) {
    // Remove any auto-detected entities that overlap with user terms
    const termLower = term.original.toLowerCase();
    const filtered = merged.filter(
      (e) => !e.value.toLowerCase().includes(termLower) &&
             !termLower.includes(e.value.toLowerCase())
    );
    merged.length = 0;
    merged.push(...filtered);
  }

  return merged;
}

/**
 * Get all available entity types with their labels
 */
export function getAvailableEntityTypes(): Array<{ type: EntityType; label: string; description: string }> {
  return [
    { type: 'name', label: 'Noms', description: 'Prénoms et noms de famille' },
    { type: 'email', label: 'Emails', description: 'Adresses email' },
    { type: 'phone', label: 'Téléphones', description: 'Numéros de téléphone français' },
    { type: 'siret', label: 'SIRET', description: 'Numéros SIRET (14 chiffres)' },
    { type: 'siren', label: 'SIREN', description: 'Numéros SIREN (9 chiffres)' },
    { type: 'nir', label: 'N° Sécu', description: 'Numéros de Sécurité Sociale' },
    { type: 'iban', label: 'IBAN', description: 'Numéros de compte bancaire' },
    { type: 'bic', label: 'BIC', description: 'Codes BIC/SWIFT' },
    { type: 'rcs', label: 'RCS', description: 'Numéros RCS' },
    { type: 'tva', label: 'N° TVA', description: 'Numéros TVA intracommunautaire' },
    { type: 'date', label: 'Dates', description: 'Dates (naissance, etc.)' },
    { type: 'postal_code', label: 'Codes Postaux', description: 'Codes postaux français' },
    { type: 'address', label: 'Adresses', description: 'Adresses postales' },
  ];
}

/**
 * Detect sensitive data in text based on selected entity types only
 */
export function detectByTypes(text: string, selectedTypes: EntityType[]): DetectedEntity[] {
  resetCounters();
  const entities: DetectedEntity[] = [];
  const usedRanges: Array<{ start: number; end: number }> = [];

  // Helper to check if a range overlaps with existing entities
  const isOverlapping = (start: number, end: number): boolean => {
    return usedRanges.some((range) =>
      (start >= range.start && start < range.end) ||
      (end > range.start && end <= range.end) ||
      (start <= range.start && end >= range.end)
    );
  };

  // Filter patterns to only selected types
  const selectedPatterns = PATTERNS.filter(p => selectedTypes.includes(p.type));

  // Process each pattern
  for (const config of selectedPatterns) {
    const regex = new RegExp(config.pattern.source, config.pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const value = match[0];
      const start = match.index;
      const end = start + value.length;

      // Skip if overlapping with existing entity
      if (isOverlapping(start, end)) {
        continue;
      }

      // Validate if validator exists
      if (config.validate && !config.validate(value)) {
        continue;
      }

      // Skip postal codes that are too short or likely false positives
      if (config.type === 'postal_code' && value.length < 5) {
        continue;
      }

      const entity: DetectedEntity = {
        id: `${config.type}-${start}-${end}`,
        type: config.type,
        value,
        replacement: generateReplacement(config.type),
        position: { start, end },
        confidence: config.confidence,
      };

      entities.push(entity);
      usedRanges.push({ start, end });
    }
  }

  // Sort entities by position
  entities.sort((a, b) => a.position.start - b.position.start);

  return entities;
}
