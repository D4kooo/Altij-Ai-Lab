import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { extractTextFromPDF, isPopplerAvailable } from '../services/pdf-ocr';
import {
  detectSensitiveData,
  detectByTypes,
  anonymizeWithPatterns,
  resetCounters,
  getEntityTypeLabel,
  getAvailableEntityTypes,
  type DetectedEntity,
  type EntityType,
} from '../services/anonymization-patterns';
import {
  verifyAnonymization,
  applyAISuggestions,
  convertToDetectedEntity,
  type MissedEntity,
} from '../services/anonymization-ai';
import { redactPdf } from '../services/pdf-redaction';

const app = new Hono();

// Middleware d'authentification
app.use('*', authMiddleware);

interface RedactionTerm {
  id: string;
  original: string;
  replacement: string;
  type: 'person' | 'company' | 'address' | 'other';
}

// Fonction pour extraire le texte d'un PDF (utilise le nouveau service OCR)
async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  try {
    const result = await extractTextFromPDF(Buffer.from(buffer));
    return result.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Fonction pour créer un PDF anonymisé avec le texte remplacé
async function createRedactedPdf(
  originalPdfBytes: ArrayBuffer,
  terms: RedactionTerm[]
): Promise<Uint8Array> {
  // Charger le PDF original
  const pdfDoc = await PDFDocument.load(originalPdfBytes, {
    ignoreEncryption: true,
    updateMetadata: false
  });

  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Pour chaque terme, on va essayer de le trouver et le caviarder
  // Comme pdf-lib ne permet pas de chercher du texte directement,
  // on va ajouter une couche de caviardage sur l'ensemble du document

  // Créer un mapping des termes triés par longueur (plus long d'abord)
  const sortedTerms = [...terms].sort((a, b) => b.original.length - a.original.length);

  // Extraire le texte pour analyse
  const text = await extractTextFromPdf(originalPdfBytes);

  // Trouver toutes les occurrences
  const occurrences: { term: RedactionTerm; count: number }[] = [];

  for (const term of sortedTerms) {
    const regex = new RegExp(escapeRegex(term.original), 'gi');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      occurrences.push({ term, count: matches.length });
    }
  }

  // Ajouter une page de garde avec le résumé des caviardages
  const coverPage = pdfDoc.insertPage(0, [595.28, 841.89]); // A4
  const { width, height } = coverPage.getSize();

  // Titre
  coverPage.drawText('DOCUMENT ANONYMISÉ', {
    x: 50,
    y: height - 80,
    size: 24,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Date
  coverPage.drawText(`Date d'anonymisation: ${new Date().toLocaleDateString('fr-FR')}`, {
    x: 50,
    y: height - 120,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Tableau des correspondances
  coverPage.drawText('Tableau de correspondance:', {
    x: 50,
    y: height - 160,
    size: 14,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  let yPosition = height - 190;
  const lineHeight = 20;

  // En-têtes
  coverPage.drawText('Original', { x: 50, y: yPosition, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
  coverPage.drawText('Remplacé par', { x: 250, y: yPosition, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
  coverPage.drawText('Occurrences', { x: 450, y: yPosition, size: 10, font, color: rgb(0.3, 0.3, 0.3) });

  yPosition -= lineHeight;

  // Ligne de séparation
  coverPage.drawLine({
    start: { x: 50, y: yPosition + 5 },
    end: { x: 545, y: yPosition + 5 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPosition -= 5;

  for (const { term, count } of occurrences) {
    if (yPosition < 50) break; // Éviter de dépasser la page

    const originalText = term.original.length > 25
      ? term.original.substring(0, 22) + '...'
      : term.original;

    coverPage.drawText(originalText, {
      x: 50, y: yPosition, size: 9, font, color: rgb(0.2, 0.2, 0.2)
    });
    coverPage.drawText(term.replacement, {
      x: 250, y: yPosition, size: 9, font, color: rgb(0, 0.4, 0)
    });
    coverPage.drawText(count.toString(), {
      x: 480, y: yPosition, size: 9, font, color: rgb(0.2, 0.2, 0.2)
    });

    yPosition -= lineHeight;
  }

  // Note de confidentialité
  coverPage.drawText(
    'Ce document contient des informations anonymisées. La correspondance ci-dessus est confidentielle.',
    { x: 50, y: 50, size: 8, font, color: rgb(0.5, 0.5, 0.5) }
  );

  // Pour les pages suivantes, on ne peut pas modifier le texte existant directement
  // avec pdf-lib car c'est une limitation de la bibliothèque.
  // On va donc ajouter une note et retourner également le texte anonymisé séparément

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Fonction pour anonymiser le texte
function anonymizeText(text: string, terms: RedactionTerm[]): string {
  let result = text;

  // Trier par longueur décroissante pour éviter les remplacements partiels
  const sortedTerms = [...terms].sort((a, b) => b.original.length - a.original.length);

  for (const term of sortedTerms) {
    const regex = new RegExp(escapeRegex(term.original), 'gi');
    result = result.replace(regex, term.replacement);
  }

  return result;
}

// Échapper les caractères spéciaux regex
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Route pour analyser un PDF et trouver les occurrences des termes
app.post('/analyze', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const termsRaw = formData.get('terms') as string | null;

    if (!file) {
      return c.json({ success: false, error: 'File is required' }, 400);
    }

    const terms: RedactionTerm[] = termsRaw ? JSON.parse(termsRaw) : [];
    const arrayBuffer = await file.arrayBuffer();

    // Extraire le texte
    const text = await extractTextFromPdf(arrayBuffer);

    // Trouver les occurrences de chaque terme
    const analysis: { term: RedactionTerm; count: number; previews: string[] }[] = [];

    for (const term of terms) {
      const regex = new RegExp(escapeRegex(term.original), 'gi');
      const matches = text.match(regex);
      const count = matches ? matches.length : 0;

      // Extraire des aperçus de contexte (50 caractères autour)
      const previews: string[] = [];
      let match;
      const searchRegex = new RegExp(`.{0,30}${escapeRegex(term.original)}.{0,30}`, 'gi');
      while ((match = searchRegex.exec(text)) !== null && previews.length < 3) {
        previews.push(match[0].trim());
      }

      analysis.push({ term, count, previews });
    }

    return c.json({
      success: true,
      data: {
        fileName: file.name,
        textLength: text.length,
        analysis,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return c.json({ success: false, error: 'Failed to analyze document' }, 500);
  }
});

// Route principale d'anonymisation - retourne un PDF avec page de correspondance + texte anonymisé
app.post('/anonymize', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const termsRaw = formData.get('terms') as string | null;

    if (!file || !termsRaw) {
      return c.json({ success: false, error: 'File and terms are required' }, 400);
    }

    const terms: RedactionTerm[] = JSON.parse(termsRaw);
    const fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();

    // Extraire le texte original
    const originalText = await extractTextFromPdf(arrayBuffer);

    // Anonymiser le texte
    const anonymizedText = anonymizeText(originalText, terms);

    // Créer un nouveau PDF avec le texte anonymisé
    const newPdfDoc = await PDFDocument.create();
    const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page de correspondance
    const coverPage = newPdfDoc.addPage([595.28, 841.89]); // A4
    let { width, height } = coverPage.getSize();

    // Titre
    coverPage.drawText('DOCUMENT ANONYMISÉ', {
      x: 50,
      y: height - 60,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Fichier original
    coverPage.drawText(`Document source: ${fileName}`, {
      x: 50,
      y: height - 90,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Date
    coverPage.drawText(`Date d'anonymisation: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, {
      x: 50,
      y: height - 105,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Tableau des correspondances
    coverPage.drawText('TABLEAU DE CORRESPONDANCE', {
      x: 50,
      y: height - 145,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Rectangle pour le tableau
    coverPage.drawRectangle({
      x: 45,
      y: height - 155 - (terms.length * 25 + 30),
      width: 505,
      height: terms.length * 25 + 30,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });

    let yPos = height - 170;

    // En-têtes du tableau
    coverPage.drawText('Type', { x: 55, y: yPos, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
    coverPage.drawText('Texte original', { x: 120, y: yPos, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
    coverPage.drawText('Remplacé par', { x: 350, y: yPos, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });

    yPos -= 15;

    // Ligne de séparation
    coverPage.drawLine({
      start: { x: 50, y: yPos + 3 },
      end: { x: 545, y: yPos + 3 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Données du tableau
    const typeLabels: Record<string, string> = {
      person: 'Personne',
      company: 'Société',
      address: 'Adresse',
      other: 'Autre',
    };

    for (const term of terms) {
      yPos -= 20;
      if (yPos < 100) break;

      const typeLabel = typeLabels[term.type] || 'Autre';
      const originalDisplay = term.original.length > 30
        ? term.original.substring(0, 27) + '...'
        : term.original;

      coverPage.drawText(typeLabel, { x: 55, y: yPos, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
      coverPage.drawText(originalDisplay, { x: 120, y: yPos, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      coverPage.drawText(term.replacement, { x: 350, y: yPos, size: 9, font: boldFont, color: rgb(0, 0.5, 0) });
    }

    // Note de confidentialité
    coverPage.drawRectangle({
      x: 45,
      y: 40,
      width: 505,
      height: 35,
      color: rgb(1, 0.95, 0.9),
      borderColor: rgb(0.9, 0.6, 0.4),
      borderWidth: 1,
    });

    coverPage.drawText('CONFIDENTIEL - Ce tableau de correspondance doit être conservé séparément', {
      x: 55,
      y: 55,
      size: 9,
      font: boldFont,
      color: rgb(0.7, 0.3, 0.1),
    });

    // Ajouter les pages avec le texte anonymisé
    const lines = anonymizedText.split('\n');
    const fontSize = 10;
    const lineHeight = 14;
    const margin = 50;
    const maxWidth = 595.28 - 2 * margin;
    const linesPerPage = Math.floor((841.89 - 2 * margin) / lineHeight);

    let currentPage = newPdfDoc.addPage([595.28, 841.89]);
    let currentY = 841.89 - margin;
    let lineCount = 0;

    // En-tête de la première page de contenu
    currentPage.drawText('CONTENU ANONYMISÉ', {
      x: margin,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    currentY -= 25;

    for (const line of lines) {
      // Découper les lignes trop longues
      const words = line.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (textWidth > maxWidth && currentLine) {
          // Écrire la ligne actuelle
          currentPage.drawText(currentLine, {
            x: margin,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
          currentY -= lineHeight;
          lineCount++;
          currentLine = word;

          // Nouvelle page si nécessaire
          if (lineCount >= linesPerPage - 5) {
            currentPage = newPdfDoc.addPage([595.28, 841.89]);
            currentY = 841.89 - margin;
            lineCount = 0;
          }
        } else {
          currentLine = testLine;
        }
      }

      // Écrire le reste de la ligne
      if (currentLine) {
        currentPage.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= lineHeight;
        lineCount++;
      } else {
        // Ligne vide
        currentY -= lineHeight / 2;
      }

      // Nouvelle page si nécessaire
      if (lineCount >= linesPerPage - 3) {
        currentPage = newPdfDoc.addPage([595.28, 841.89]);
        currentY = 841.89 - margin;
        lineCount = 0;
      }
    }

    // Générer le PDF
    const pdfBytes = await newPdfDoc.save();

    // Retourner le PDF comme fichier binaire
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="anonymise_${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Anonymization error:', error);
    return c.json({ success: false, error: 'Failed to anonymize document' }, 500);
  }
});

// Route pour télécharger uniquement le texte anonymisé (format TXT)
app.post('/anonymize-text', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const termsRaw = formData.get('terms') as string | null;

    if (!file || !termsRaw) {
      return c.json({ success: false, error: 'File and terms are required' }, 400);
    }

    const terms: RedactionTerm[] = JSON.parse(termsRaw);
    const fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();

    // Extraire et anonymiser le texte
    const originalText = await extractTextFromPdf(arrayBuffer);
    const anonymizedText = anonymizeText(originalText, terms);

    // Créer un rapport
    const report = terms.map(t => {
      const regex = new RegExp(escapeRegex(t.original), 'gi');
      const count = (originalText.match(regex) || []).length;
      return { ...t, count };
    });

    return c.json({
      success: true,
      data: {
        originalName: fileName,
        anonymizedText,
        report,
        stats: {
          originalLength: originalText.length,
          anonymizedLength: anonymizedText.length,
          totalReplacements: report.reduce((sum, r) => sum + r.count, 0),
        },
      },
    });
  } catch (error) {
    console.error('Anonymization error:', error);
    return c.json({ success: false, error: 'Failed to anonymize document' }, 500);
  }
});

// Route pour vérifier le statut de Poppler
app.get('/status', async (c) => {
  const popplerAvailable = await isPopplerAvailable();
  return c.json({
    success: true,
    data: {
      popplerAvailable,
      ocrMethod: popplerAvailable ? 'poppler' : 'pdf-parse',
    },
  });
});

// Route pour extraire le texte d'un PDF avec OCR
app.post('/extract', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return c.json({ success: false, error: 'File is required' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await extractTextFromPDF(Buffer.from(arrayBuffer));

    return c.json({
      success: true,
      data: {
        text: result.text,
        method: result.method,
        pageCount: result.pageCount,
        fileName: file.name,
        textLength: result.text.length,
      },
    });
  } catch (error) {
    console.error('Extraction error:', error);
    return c.json({ success: false, error: 'Failed to extract text from PDF' }, 500);
  }
});

// Route pour auto-détecter les données sensibles
app.post('/auto-detect', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return c.json({ success: false, error: 'File is required' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();

    // Extraire le texte
    const ocrResult = await extractTextFromPDF(Buffer.from(arrayBuffer));

    // Détecter les données sensibles
    const detectedEntities = detectSensitiveData(ocrResult.text);

    // Grouper par type
    const groupedByType = detectedEntities.reduce((acc, entity) => {
      if (!acc[entity.type]) {
        acc[entity.type] = [];
      }
      acc[entity.type].push(entity);
      return acc;
    }, {} as Record<EntityType, DetectedEntity[]>);

    return c.json({
      success: true,
      data: {
        fileName: file.name,
        textLength: ocrResult.text.length,
        extractionMethod: ocrResult.method,
        entities: detectedEntities,
        groupedByType,
        summary: Object.entries(groupedByType).map(([type, entities]) => ({
          type,
          label: getEntityTypeLabel(type as EntityType),
          count: entities.length,
        })),
      },
    });
  } catch (error) {
    console.error('Auto-detect error:', error);
    return c.json({ success: false, error: 'Failed to detect sensitive data' }, 500);
  }
});

// Route pour vérifier l'anonymisation avec l'IA
app.post('/verify', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const termsRaw = formData.get('terms') as string | null;
    const autoDetectedRaw = formData.get('autoDetected') as string | null;

    if (!file) {
      return c.json({ success: false, error: 'File is required' }, 400);
    }

    const terms: RedactionTerm[] = termsRaw ? JSON.parse(termsRaw) : [];
    const autoDetected: DetectedEntity[] = autoDetectedRaw ? JSON.parse(autoDetectedRaw) : [];
    const arrayBuffer = await file.arrayBuffer();

    // Extraire le texte
    const originalText = await extractTextFromPdf(arrayBuffer);

    // Appliquer l'anonymisation avec les termes utilisateur
    let anonymizedText = anonymizeText(originalText, terms);

    // Appliquer l'anonymisation avec les entités auto-détectées
    if (autoDetected.length > 0) {
      anonymizedText = anonymizeWithPatterns(anonymizedText, autoDetected);
    }

    // Créer la table de correspondance pour le contexte IA
    const correspondenceTable = new Map<string, string>();
    for (const term of terms) {
      correspondenceTable.set(term.original, term.replacement);
    }
    for (const entity of autoDetected) {
      correspondenceTable.set(entity.value, entity.replacement);
    }

    // Vérifier avec l'IA
    const verificationResult = await verifyAnonymization(anonymizedText, correspondenceTable);

    return c.json({
      success: true,
      data: {
        verification: verificationResult,
        anonymizedPreview: anonymizedText.substring(0, 2000),
        stats: {
          termsApplied: terms.length,
          autoDetectedApplied: autoDetected.length,
          missedByAI: verificationResult.missedEntities.length,
          aiConfidence: verificationResult.confidence,
        },
      },
    });
  } catch (error) {
    console.error('Verification error:', error);
    return c.json({ success: false, error: 'Failed to verify anonymization' }, 500);
  }
});

// Route complète d'anonymisation avec pipeline OCR + Regex + IA
// Préserve le PDF original et redact les textes sensibles
app.post('/full-pipeline', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const termsRaw = formData.get('terms') as string | null;
    const autoDetectedRaw = formData.get('autoDetected') as string | null;
    const aiSuggestionsRaw = formData.get('aiSuggestions') as string | null;

    if (!file) {
      return c.json({ success: false, error: 'File is required' }, 400);
    }

    const terms: RedactionTerm[] = termsRaw ? JSON.parse(termsRaw) : [];
    const autoDetected: DetectedEntity[] = autoDetectedRaw ? JSON.parse(autoDetectedRaw) : [];
    const aiSuggestions: MissedEntity[] = aiSuggestionsRaw ? JSON.parse(aiSuggestionsRaw) : [];
    const fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();

    // Collecter tous les termes à redacter
    const redactionTargets: Array<{ original: string; replacement: string }> = [];

    // Ajouter les termes manuels
    for (const term of terms) {
      redactionTargets.push({
        original: term.original,
        replacement: term.replacement,
      });
    }

    // Ajouter les entités auto-détectées
    for (const entity of autoDetected) {
      redactionTargets.push({
        original: entity.value,
        replacement: entity.replacement,
      });
    }

    // Ajouter les suggestions IA acceptées
    for (const suggestion of aiSuggestions) {
      redactionTargets.push({
        original: suggestion.value,
        replacement: suggestion.suggestion,
      });
    }

    // Appliquer les redactions sur le PDF original
    // Cela trouve les positions exactes du texte et dessine des rectangles blancs + texte de remplacement
    const redactedPdfBytes = await redactPdf(arrayBuffer, redactionTargets);

    // Charger le PDF redacté
    const redactedPdf = await PDFDocument.load(redactedPdfBytes, {
      ignoreEncryption: true,
    });

    // Créer le PDF final avec la page de correspondance + les pages redactées
    const finalPdf = await PDFDocument.create();
    const font = await finalPdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await finalPdf.embedFont(StandardFonts.HelveticaBold);

    // Page de correspondance
    const coverPage = finalPdf.addPage([595.28, 841.89]); // A4
    const { height } = coverPage.getSize();

    // Titre
    coverPage.drawText('TABLEAU DE CORRESPONDANCE', {
      x: 50,
      y: height - 60,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    coverPage.drawText(`Document source: ${fileName}`, {
      x: 50,
      y: height - 90,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    coverPage.drawText(`Date d'anonymisation: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, {
      x: 50,
      y: height - 105,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Statistiques
    coverPage.drawText('STATISTIQUES', {
      x: 50,
      y: height - 140,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    coverPage.drawText(`Termes manuels: ${terms.length} | Auto-détectés: ${autoDetected.length} | Corrections IA: ${aiSuggestions.length}`, {
      x: 55,
      y: height - 160,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Tableau des correspondances
    coverPage.drawText('CORRESPONDANCES', {
      x: 50,
      y: height - 195,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    let yPos = height - 220;

    coverPage.drawText('Texte original', { x: 55, y: yPos, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
    coverPage.drawText('Remplacé par', { x: 300, y: yPos, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });

    yPos -= 5;
    coverPage.drawLine({
      start: { x: 50, y: yPos },
      end: { x: 545, y: yPos },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    yPos -= 15;

    for (const target of redactionTargets) {
      if (yPos < 80) break;

      const originalDisplay = target.original.length > 35
        ? target.original.substring(0, 32) + '...'
        : target.original;

      coverPage.drawText(originalDisplay, { x: 55, y: yPos, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      coverPage.drawText(target.replacement, { x: 300, y: yPos, size: 9, font: boldFont, color: rgb(0, 0.5, 0) });

      yPos -= 18;
    }

    // Note de confidentialité
    coverPage.drawRectangle({
      x: 45,
      y: 25,
      width: 505,
      height: 35,
      color: rgb(1, 0.95, 0.9),
      borderColor: rgb(0.9, 0.6, 0.4),
      borderWidth: 1,
    });

    coverPage.drawText('CONFIDENTIEL - Ce tableau doit être conservé séparément du document anonymisé', {
      x: 55,
      y: 40,
      size: 9,
      font: boldFont,
      color: rgb(0.7, 0.3, 0.1),
    });

    // Copier toutes les pages du PDF redacté
    const pageIndices = redactedPdf.getPageIndices();
    const copiedPages = await finalPdf.copyPages(redactedPdf, pageIndices);

    for (const page of copiedPages) {
      finalPdf.addPage(page);
    }

    // Générer le PDF
    const pdfBytes = await finalPdf.save();

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="anonymise_${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Full pipeline error:', error);
    return c.json({ success: false, error: 'Failed to process document' }, 500);
  }
});

// Normalise le texte pour améliorer la détection
// Gère les espaces insécables, retours à la ligne, etc.
function normalizeText(text: string): string {
  return text
    // Remplacer les espaces insécables et autres espaces spéciaux par des espaces normaux
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    // Remplacer les tirets spéciaux par des tirets normaux
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    // Remplacer les apostrophes spéciales par des apostrophes normales
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    // Normaliser les retours à la ligne
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

// Crée un pattern regex qui tolère les variations d'espaces et de retours à la ligne
function createFlexiblePattern(term: string): string {
  // Échapper les caractères spéciaux regex
  const escaped = escapeRegex(term);
  // Remplacer les espaces par un pattern qui accepte plusieurs types d'espaces ou retours à la ligne
  return escaped.replace(/\s+/g, '[\\s\\n\\r\\u00A0]+');
}

// Route simplifiée: upload PDF + liste de termes à censurer
// Chaque terme est découpé en mots pour censurer aussi les parties
app.post('/censor', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const termsRaw = formData.get('terms') as string | null;

    if (!file) {
      return c.json({ success: false, error: 'File is required' }, 400);
    }

    if (!termsRaw) {
      return c.json({ success: false, error: 'At least one term is required' }, 400);
    }

    const inputTerms: string[] = JSON.parse(termsRaw);
    const fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();

    // Extraire le texte du PDF pour compter les occurrences
    const ocrResult = await extractTextFromPDF(Buffer.from(arrayBuffer));
    const text = ocrResult.text;
    const normalizedText = normalizeText(text);

    // Générer toutes les variantes à censurer
    // Ex: "Jean Dupont" -> ["Jean Dupont", "Jean", "Dupont"]
    const allTerms: Array<{ original: string; replacement: string; fromTerm: string }> = [];
    let counter = 1;

    for (const term of inputTerms) {
      const trimmed = term.trim();
      if (!trimmed) continue;

      // Ajouter le terme complet
      allTerms.push({
        original: trimmed,
        replacement: `[ELEMENT_${counter}]`,
        fromTerm: trimmed,
      });
      counter++;

      // Découper en mots et ajouter chaque mot (si plus d'un mot)
      const words = trimmed.split(/\s+/).filter(w => w.length >= 2);
      if (words.length > 1) {
        for (const word of words) {
          // Vérifier si ce mot n'est pas déjà ajouté
          const alreadyExists = allTerms.some(t =>
            t.original.toLowerCase() === word.toLowerCase()
          );
          if (!alreadyExists) {
            allTerms.push({
              original: word,
              replacement: `[ELEMENT_${counter}]`,
              fromTerm: trimmed,
            });
            counter++;
          }
        }
      }
    }

    // Trier par longueur décroissante pour éviter les remplacements partiels
    allTerms.sort((a, b) => b.original.length - a.original.length);

    // Compter les occurrences de chaque terme avec pattern flexible
    const termsWithCounts = allTerms.map(term => {
      // Utiliser un pattern flexible qui tolère les variations d'espaces
      const flexiblePattern = createFlexiblePattern(term.original);
      const regex = new RegExp(flexiblePattern, 'gi');
      const matches = normalizedText.match(regex);
      return {
        ...term,
        count: matches ? matches.length : 0,
      };
    }).filter(t => t.count > 0); // Ne garder que les termes trouvés

    // Créer les cibles de redaction
    const redactionTargets = termsWithCounts.map(term => ({
      original: term.original,
      replacement: term.replacement,
    }));

    // Appliquer les redactions sur le PDF
    const redactedPdfBytes = await redactPdf(arrayBuffer, redactionTargets);

    // Charger le PDF redacté
    const redactedPdf = await PDFDocument.load(redactedPdfBytes, {
      ignoreEncryption: true,
    });

    // Créer le PDF final avec la page de correspondance
    const finalPdf = await PDFDocument.create();
    const font = await finalPdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await finalPdf.embedFont(StandardFonts.HelveticaBold);

    // Page de correspondance
    const coverPage = finalPdf.addPage([595.28, 841.89]);
    const { height } = coverPage.getSize();

    coverPage.drawText('TABLEAU DE CORRESPONDANCE', {
      x: 50,
      y: height - 60,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    coverPage.drawText(`Document source: ${fileName}`, {
      x: 50,
      y: height - 90,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    coverPage.drawText(`Date d'anonymisation: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, {
      x: 50,
      y: height - 105,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    coverPage.drawText(`Termes saisis: ${inputTerms.length} | Éléments censurés: ${termsWithCounts.reduce((sum, t) => sum + t.count, 0)}`, {
      x: 50,
      y: height - 125,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Tableau des correspondances
    coverPage.drawText('CORRESPONDANCES', {
      x: 50,
      y: height - 160,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    let yPos = height - 185;

    coverPage.drawText('Texte censuré', { x: 55, y: yPos, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
    coverPage.drawText('Occurrences', { x: 280, y: yPos, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
    coverPage.drawText('Remplacé par', { x: 380, y: yPos, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });

    yPos -= 5;
    coverPage.drawLine({
      start: { x: 50, y: yPos },
      end: { x: 545, y: yPos },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    yPos -= 15;

    for (const term of termsWithCounts) {
      if (yPos < 80) break;

      const originalDisplay = term.original.length > 30
        ? term.original.substring(0, 27) + '...'
        : term.original;

      coverPage.drawText(originalDisplay, { x: 55, y: yPos, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      coverPage.drawText(term.count.toString(), { x: 300, y: yPos, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
      coverPage.drawText(term.replacement, { x: 380, y: yPos, size: 9, font: boldFont, color: rgb(0, 0.5, 0) });

      yPos -= 16;
    }

    // Note de confidentialité
    coverPage.drawRectangle({
      x: 45,
      y: 25,
      width: 505,
      height: 35,
      color: rgb(1, 0.95, 0.9),
      borderColor: rgb(0.9, 0.6, 0.4),
      borderWidth: 1,
    });

    coverPage.drawText('CONFIDENTIEL - Ce tableau doit être conservé séparément du document anonymisé', {
      x: 55,
      y: 40,
      size: 9,
      font: boldFont,
      color: rgb(0.7, 0.3, 0.1),
    });

    // Copier les pages du PDF redacté
    const pageIndices = redactedPdf.getPageIndices();
    const copiedPages = await finalPdf.copyPages(redactedPdf, pageIndices);

    for (const page of copiedPages) {
      finalPdf.addPage(page);
    }

    const pdfBytes = await finalPdf.save();

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="anonymise_${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Censor error:', error);
    return c.json({ success: false, error: 'Failed to censor document' }, 500);
  }
});

// Route pour prévisualiser les termes qui seront censurés
app.post('/censor-preview', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const termsRaw = formData.get('terms') as string | null;

    if (!file) {
      return c.json({ success: false, error: 'File is required' }, 400);
    }

    const inputTerms: string[] = termsRaw ? JSON.parse(termsRaw) : [];
    const arrayBuffer = await file.arrayBuffer();

    // Extraire le texte
    const ocrResult = await extractTextFromPDF(Buffer.from(arrayBuffer));
    const text = ocrResult.text;
    // Normaliser le texte pour améliorer la détection
    const normalizedText = normalizeText(text);

    // Générer toutes les variantes
    const allTerms: Array<{ original: string; replacement: string; fromTerm: string }> = [];
    let counter = 1;

    for (const term of inputTerms) {
      const trimmed = term.trim();
      if (!trimmed) continue;

      allTerms.push({
        original: trimmed,
        replacement: `[ELEMENT_${counter}]`,
        fromTerm: trimmed,
      });
      counter++;

      const words = trimmed.split(/\s+/).filter(w => w.length >= 2);
      if (words.length > 1) {
        for (const word of words) {
          const alreadyExists = allTerms.some(t =>
            t.original.toLowerCase() === word.toLowerCase()
          );
          if (!alreadyExists) {
            allTerms.push({
              original: word,
              replacement: `[ELEMENT_${counter}]`,
              fromTerm: trimmed,
            });
            counter++;
          }
        }
      }
    }

    // Trier par longueur décroissante
    allTerms.sort((a, b) => b.original.length - a.original.length);

    // Compter les occurrences avec pattern flexible
    const termsWithCounts = allTerms.map(term => {
      // Utiliser un pattern flexible qui tolère les variations d'espaces
      const flexiblePattern = createFlexiblePattern(term.original);
      const regex = new RegExp(flexiblePattern, 'gi');
      const matches = normalizedText.match(regex);
      return {
        original: term.original,
        replacement: term.replacement,
        fromTerm: term.fromTerm,
        count: matches ? matches.length : 0,
      };
    });

    return c.json({
      success: true,
      data: {
        fileName: file.name,
        textLength: ocrResult.text.length,
        extractionMethod: ocrResult.method,
        terms: termsWithCounts,
        totalOccurrences: termsWithCounts.reduce((sum, t) => sum + t.count, 0),
        termsFound: termsWithCounts.filter(t => t.count > 0).length,
      },
    });
  } catch (error) {
    console.error('Preview error:', error);
    return c.json({ success: false, error: 'Failed to preview' }, 500);
  }
});

export const anonymiseurRoutes = app;
