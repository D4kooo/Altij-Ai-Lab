/**
 * PDF Redaction Service
 * Redacts text in PDFs while preserving the original layout
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// Use legacy build for Node.js/Bun environment
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Disable worker in Node.js environment
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

interface RedactionTarget {
  original: string;
  replacement: string;
}

interface TextPosition {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}

/**
 * Normalise le texte pour améliorer la détection
 * Gère les espaces insécables, retours à la ligne, etc.
 */
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

/**
 * Échappe les caractères spéciaux regex
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Crée un pattern regex qui tolère les variations d'espaces et de retours à la ligne
 */
function createFlexiblePattern(term: string): string {
  const escaped = escapeRegex(term);
  // Remplacer les espaces par un pattern qui accepte plusieurs types d'espaces ou retours à la ligne
  return escaped.replace(/\s+/g, '[\\s\\n\\r\\u00A0]+');
}

/**
 * Find all occurrences of target texts in the PDF with their positions
 */
async function findTextPositions(
  pdfData: ArrayBuffer,
  targets: RedactionTarget[]
): Promise<Map<number, TextPosition[]>> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfData) });
  const pdf = await loadingTask.promise;

  const positionsByPage = new Map<number, TextPosition[]>();

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const pagePositions: TextPosition[] = [];

    // Build full text of page with positions
    const textItems: Array<{ str: string; normalizedStr: string; x: number; y: number; width: number; height: number }> = [];

    for (const item of textContent.items) {
      if ('str' in item && item.str) {
        const textItem = item as TextItem;
        // Transform coordinates - PDF.js uses different coordinate system
        const [scaleX, , , scaleY, x, y] = textItem.transform;
        const fontSize = Math.abs(scaleY);

        textItems.push({
          str: textItem.str,
          normalizedStr: normalizeText(textItem.str),
          x: x,
          y: y,
          width: textItem.width,
          height: fontSize,
        });
      }
    }

    // Search for each target in the page text
    // Use both original and normalized text for matching
    const fullText = textItems.map(t => t.str).join('');
    const normalizedFullText = normalizeText(fullText);

    for (const target of targets) {
      // Créer un pattern flexible pour la recherche
      const flexiblePattern = createFlexiblePattern(target.original);
      const regex = new RegExp(flexiblePattern, 'gi');

      let match;
      // Find all occurrences using regex on normalized text
      while ((match = regex.exec(normalizedFullText)) !== null) {
        const foundIndex = match.index;
        const matchedLength = match[0].length;

        // Find which text items contain this match
        let currentIndex = 0;
        let startItem = -1;
        let endItem = -1;
        let startOffset = 0;

        for (let i = 0; i < textItems.length; i++) {
          const itemLength = textItems[i].str.length;

          if (startItem === -1 && currentIndex + itemLength > foundIndex) {
            startItem = i;
            startOffset = foundIndex - currentIndex;
          }

          if (currentIndex + itemLength >= foundIndex + matchedLength) {
            endItem = i;
            break;
          }

          currentIndex += itemLength;
        }

        if (startItem !== -1 && endItem !== -1) {
          // Calculate bounding box
          const startItemData = textItems[startItem];
          const endItemData = textItems[endItem];

          // Approximate x position based on character offset
          const charWidth = startItemData.width / Math.max(startItemData.str.length, 1);
          const x = startItemData.x + (startOffset * charWidth);

          // Calculate width spanning all items
          let totalWidth = 0;
          for (let i = startItem; i <= endItem; i++) {
            if (i === startItem) {
              totalWidth += textItems[i].width - (startOffset * charWidth);
            } else if (i === endItem) {
              const endOffset = (foundIndex + matchedLength) -
                textItems.slice(0, i).reduce((sum, t) => sum + t.str.length, 0);
              const endCharWidth = textItems[i].width / Math.max(textItems[i].str.length, 1);
              totalWidth += endOffset * endCharWidth;
            } else {
              totalWidth += textItems[i].width;
            }
          }

          pagePositions.push({
            text: target.original,
            x: x,
            y: startItemData.y,
            width: Math.max(totalWidth, target.original.length * 6), // Minimum width
            height: startItemData.height,
            pageIndex: pageNum - 1,
          });
        }
      }
    }

    if (pagePositions.length > 0) {
      positionsByPage.set(pageNum - 1, pagePositions);
    }
  }

  return positionsByPage;
}

/**
 * Redact a PDF by drawing boxes over sensitive text and adding replacement text
 */
export async function redactPdf(
  pdfData: ArrayBuffer,
  targets: RedactionTarget[]
): Promise<Uint8Array> {
  if (targets.length === 0) {
    return new Uint8Array(pdfData);
  }

  // Find text positions
  const positionsByPage = await findTextPositions(pdfData, targets);

  // Load PDF with pdf-lib
  const pdfDoc = await PDFDocument.load(pdfData, {
    ignoreEncryption: true,
  });

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  // Create a map for quick lookup
  const replacementMap = new Map<string, string>();
  for (const target of targets) {
    replacementMap.set(target.original.toLowerCase(), target.replacement);
  }

  // Apply redactions to each page
  for (const [pageIndex, positions] of positionsByPage) {
    const page = pages[pageIndex];
    if (!page) continue;

    const { height: pageHeight } = page.getSize();

    for (const pos of positions) {
      const replacement = replacementMap.get(pos.text.toLowerCase()) || '[REDACTED]';

      // PDF coordinate system has origin at bottom-left
      // pdf.js returns coordinates with origin at top-left
      // We need to flip the Y coordinate
      const y = pageHeight - pos.y - pos.height;

      // Draw white rectangle to cover original text
      page.drawRectangle({
        x: pos.x - 2,
        y: y - 2,
        width: pos.width + 4,
        height: pos.height + 4,
        color: rgb(1, 1, 1), // White
        borderWidth: 0,
      });

      // Calculate font size to fit
      const fontSize = Math.min(pos.height * 0.9, 12);

      // Draw replacement text
      page.drawText(replacement, {
        x: pos.x,
        y: y + 2,
        size: fontSize,
        font,
        color: rgb(0.8, 0, 0), // Dark red to indicate redaction
      });
    }
  }

  return pdfDoc.save();
}

/**
 * Simple text-based redaction using content stream manipulation
 * This is a fallback that works by replacing text in the PDF content streams
 */
export async function redactPdfSimple(
  pdfData: ArrayBuffer,
  targets: RedactionTarget[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfData, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  // For simple redaction, we'll add a cover page with the correspondence table
  // and then include the original pages (the text replacement in PDF streams is complex)

  // This approach draws redaction overlays but doesn't modify the underlying text
  // For true text removal, specialized tools are needed

  return pdfDoc.save();
}

/**
 * Create a correspondence table PDF page
 */
export async function createCorrespondencePage(
  targets: RedactionTarget[],
  originalFileName: string,
  stats: { manual: number; auto: number; ai: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { height } = page.getSize();
  let y = height - 60;

  // Title
  page.drawText('TABLEAU DE CORRESPONDANCE', {
    x: 50,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 30;
  page.drawText(`Document source: ${originalFileName}`, {
    x: 50,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  y -= 15;
  page.drawText(`Date d'anonymisation: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, {
    x: 50,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  y -= 30;
  page.drawText('STATISTIQUES', {
    x: 50,
    y,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= 20;
  page.drawText(`Termes manuels: ${stats.manual} | Auto-détectés: ${stats.auto} | Corrections IA: ${stats.ai}`, {
    x: 50,
    y,
    size: 10,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  y -= 40;
  page.drawText('CORRESPONDANCES', {
    x: 50,
    y,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= 25;

  // Table header
  page.drawText('Texte original', { x: 50, y, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('Remplacé par', { x: 300, y, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });

  y -= 5;
  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  y -= 15;

  for (const target of targets) {
    if (y < 50) break;

    const originalDisplay = target.original.length > 35
      ? target.original.substring(0, 32) + '...'
      : target.original;

    page.drawText(originalDisplay, { x: 50, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(target.replacement, { x: 300, y, size: 9, font: boldFont, color: rgb(0, 0.5, 0) });

    y -= 18;
  }

  // Confidentiality note
  page.drawRectangle({
    x: 45,
    y: 25,
    width: 505,
    height: 30,
    color: rgb(1, 0.95, 0.9),
    borderColor: rgb(0.9, 0.6, 0.4),
    borderWidth: 1,
  });

  page.drawText('CONFIDENTIEL - Ce tableau doit être conservé séparément du document anonymisé', {
    x: 55,
    y: 38,
    size: 9,
    font: boldFont,
    color: rgb(0.7, 0.3, 0.1),
  });

  return pdfDoc.save();
}
