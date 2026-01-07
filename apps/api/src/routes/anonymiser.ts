import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

const anonymiser = new Hono();

// Patterns regex pour détecter les PII
const patterns: Record<string, { regex: RegExp; replacement: string }> = {
  // Email
  email: {
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[EMAIL]',
  },
  // Téléphone français (formats variés)
  phone: {
    regex: /(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g,
    replacement: '[TÉLÉPHONE]',
  },
  // Numéro de sécurité sociale français
  nss: {
    regex: /[12]\s?\d{2}\s?(?:0[1-9]|1[0-2])\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}/g,
    replacement: '[NSS]',
  },
  // IBAN
  iban: {
    regex: /[A-Z]{2}\d{2}[\s]?(?:\d{4}[\s]?){4,7}\d{1,4}/g,
    replacement: '[IBAN]',
  },
  // Carte bancaire
  creditCard: {
    regex: /(?:\d{4}[\s-]?){3}\d{4}/g,
    replacement: '[CB]',
  },
  // SIRET/SIREN
  siret: {
    regex: /\b\d{3}\s?\d{3}\s?\d{3}(?:\s?\d{5})?\b/g,
    replacement: '[SIRET]',
  },
  // Adresse IP
  ip: {
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: '[IP]',
  },
  // Date de naissance (formats français)
  dateNaissance: {
    regex: /\b(?:0[1-9]|[12]\d|3[01])[\/\-](?:0[1-9]|1[0-2])[\/\-](?:19|20)\d{2}\b/g,
    replacement: '[DATE]',
  },
  // Code postal français
  codePostal: {
    regex: /\b(?:0[1-9]|[1-8]\d|9[0-8])\d{3}\b/g,
    replacement: '[CODE_POSTAL]',
  },
  // URL
  url: {
    regex: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g,
    replacement: '[URL]',
  },
};

// Patterns pour les noms (moins fiables, utilisés après les regex)
const namePatterns = {
  // Noms propres courants français (Monsieur/Madame suivi d'un nom)
  civilite: {
    regex: /(?:M\.|Mme|Mlle|Mr|Mrs|Ms|Dr|Pr)\.?\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ][a-zàâäéèêëïîôùûüç]+(?:\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ][a-zàâäéèêëïîôùûüç]+)*/g,
    replacement: '[PERSONNE]',
  },
  // Prénom Nom (deux mots avec majuscules consécutifs)
  prenomNom: {
    regex: /\b[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ][a-zàâäéèêëïîôùûüç]+\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ][A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ]+\b/g,
    replacement: '[PERSONNE]',
  },
};

interface DetectedEntity {
  type: string;
  count: number;
  examples: string[];
}

function anonymizeText(text: string): {
  anonymizedText: string;
  detectedEntities: DetectedEntity[];
  totalEntitiesFound: number;
} {
  let result = text;
  const detectedEntities: DetectedEntity[] = [];

  // Appliquer les patterns regex structurés
  for (const [type, config] of Object.entries(patterns)) {
    const matches = result.match(config.regex);
    if (matches) {
      detectedEntities.push({
        type,
        count: matches.length,
        examples: [...new Set(matches)].slice(0, 3),
      });
      result = result.replace(config.regex, config.replacement);
    }
  }

  // Appliquer les patterns de noms
  for (const [type, config] of Object.entries(namePatterns)) {
    const matches = result.match(config.regex);
    if (matches) {
      // Filtrer les faux positifs (mots trop courts, mots communs)
      const filteredMatches = matches.filter((m) => m.length > 5);
      if (filteredMatches.length > 0) {
        const existingPersonne = detectedEntities.find((e) => e.type === 'personne');
        if (existingPersonne) {
          existingPersonne.count += filteredMatches.length;
          existingPersonne.examples = [
            ...existingPersonne.examples,
            ...filteredMatches.slice(0, 3),
          ].slice(0, 3);
        } else {
          detectedEntities.push({
            type: 'personne',
            count: filteredMatches.length,
            examples: [...new Set(filteredMatches)].slice(0, 3),
          });
        }
        result = result.replace(config.regex, config.replacement);
      }
    }
  }

  const totalEntitiesFound = detectedEntities.reduce((sum, e) => sum + e.count, 0);

  return {
    anonymizedText: result,
    detectedEntities,
    totalEntitiesFound,
  };
}

async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = file.name.toLowerCase();

  // Texte brut
  if (fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
    return buffer.toString('utf-8');
  }

  // PDF - extraction basique du texte
  if (fileName.endsWith('.pdf')) {
    // Extraction simplifiée - cherche les chaînes de texte dans le PDF
    const pdfContent = buffer.toString('latin1');
    const textMatches: string[] = [];

    // Pattern pour extraire le texte entre parenthèses (format PDF basique)
    const textRegex = /\(([^)]+)\)/g;
    let match;
    while ((match = textRegex.exec(pdfContent)) !== null) {
      const text = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')');
      if (text.trim() && !/^[\x00-\x1F]+$/.test(text)) {
        textMatches.push(text);
      }
    }

    // Pattern alternatif pour les streams de texte
    const streamRegex = /BT\s*(.*?)\s*ET/gs;
    while ((match = streamRegex.exec(pdfContent)) !== null) {
      const streamContent = match[1];
      const tjRegex = /\[([^\]]+)\]\s*TJ|\(([^)]+)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
        const text = (tjMatch[1] || tjMatch[2] || '').replace(/\(|\)/g, '');
        if (text.trim()) {
          textMatches.push(text);
        }
      }
    }

    if (textMatches.length > 0) {
      return textMatches.join(' ').replace(/\s+/g, ' ').trim();
    }

    // Fallback: retourne le contenu brut filtré
    return pdfContent.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Word (.docx) - extraction basique
  if (fileName.endsWith('.docx')) {
    const content = buffer.toString('utf-8');
    // Cherche le contenu XML du document
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    const matches: string[] = [];
    let match;
    while ((match = textRegex.exec(content)) !== null) {
      if (match[1].trim()) {
        matches.push(match[1]);
      }
    }
    if (matches.length > 0) {
      return matches.join(' ');
    }
    // Fallback
    return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Word (.doc) - très basique
  if (fileName.endsWith('.doc')) {
    return buffer
      .toString('latin1')
      .replace(/[\x00-\x1F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  throw new Error('Format de fichier non supporté');
}

// Route principale d'anonymisation
anonymiser.post('/process', authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ success: false, error: 'Aucun fichier fourni' }, 400);
    }

    // Vérifier le type de fichier
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.csv'];
    const fileName = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => fileName.endsWith(ext));

    if (!isAllowed) {
      return c.json(
        {
          success: false,
          error: 'Format de fichier non supporté. Formats acceptés: PDF, DOC, DOCX, TXT, CSV',
        },
        400
      );
    }

    // Extraire le texte du fichier
    const originalText = await extractTextFromFile(file);

    if (!originalText || originalText.trim().length === 0) {
      return c.json(
        {
          success: false,
          error: "Impossible d'extraire le texte du fichier",
        },
        400
      );
    }

    // Anonymiser le texte
    const { anonymizedText, detectedEntities, totalEntitiesFound } = anonymizeText(originalText);

    return c.json({
      success: true,
      data: {
        anonymizedText,
        originalText,
        detectedEntities,
        totalEntitiesFound,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Erreur anonymisation:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors de l'anonymisation",
      },
      500
    );
  }
});

// Route pour anonymiser du texte brut (sans fichier)
anonymiser.post('/text', authMiddleware, async (c) => {
  try {
    const { text } = await c.req.json<{ text: string }>();

    if (!text || text.trim().length === 0) {
      return c.json({ success: false, error: 'Aucun texte fourni' }, 400);
    }

    const { anonymizedText, detectedEntities, totalEntitiesFound } = anonymizeText(text);

    return c.json({
      success: true,
      data: {
        anonymizedText,
        originalText: text,
        detectedEntities,
        totalEntitiesFound,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Erreur anonymisation texte:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors de l'anonymisation",
      },
      500
    );
  }
});

export { anonymiser as anonymiserRoutes };
