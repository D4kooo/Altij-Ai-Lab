import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import pdf from 'pdf-parse';

/**
 * PDF OCR Service using Poppler's pdftotext
 * Falls back to pdf-parse if Poppler is not available
 */

interface OCRResult {
  text: string;
  method: 'poppler' | 'pdf-parse';
  pageCount?: number;
}

/**
 * Check if Poppler's pdftotext is available on the system
 */
async function isPopplerAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn('pdftotext', ['-v']);
    process.on('error', () => resolve(false));
    process.on('close', (code) => resolve(code === 0 || code === 99)); // pdftotext -v returns 99
  });
}

/**
 * Extract text from PDF using Poppler's pdftotext
 * Provides better OCR support for scanned documents
 */
async function extractWithPoppler(pdfBuffer: Buffer): Promise<string> {
  const tempDir = join(tmpdir(), 'anonymiseur');
  const tempId = randomUUID();
  const inputPath = join(tempDir, `${tempId}.pdf`);
  const outputPath = join(tempDir, `${tempId}.txt`);

  try {
    // Ensure temp directory exists
    await mkdir(tempDir, { recursive: true });

    // Write PDF to temp file
    await writeFile(inputPath, pdfBuffer);

    // Run pdftotext
    return new Promise((resolve, reject) => {
      const process = spawn('pdftotext', [
        '-layout',      // Maintain original layout
        '-enc', 'UTF-8', // Use UTF-8 encoding
        inputPath,
        outputPath,
      ]);

      let stderr = '';
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('error', (err) => {
        reject(new Error(`Poppler error: ${err.message}`));
      });

      process.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`pdftotext exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const { readFile } = await import('fs/promises');
          const text = await readFile(outputPath, 'utf-8');
          resolve(text);
        } catch (err) {
          reject(new Error(`Failed to read output file: ${err}`));
        }
      });
    });
  } finally {
    // Cleanup temp files
    try {
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Extract text from PDF using pdf-parse (fallback method)
 */
async function extractWithPdfParse(pdfBuffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const data = await pdf(pdfBuffer);
  return {
    text: data.text,
    pageCount: data.numpages,
  };
}

/**
 * Main function to extract text from PDF
 * Uses Poppler if available, falls back to pdf-parse
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<OCRResult> {
  // Check if Poppler is available
  const popplerAvailable = await isPopplerAvailable();

  if (popplerAvailable) {
    try {
      const text = await extractWithPoppler(pdfBuffer);
      return {
        text,
        method: 'poppler',
      };
    } catch (error) {
      console.warn('Poppler extraction failed, falling back to pdf-parse:', error);
      // Fall through to pdf-parse
    }
  }

  // Fallback to pdf-parse
  try {
    const result = await extractWithPdfParse(pdfBuffer);
    return {
      text: result.text,
      method: 'pdf-parse',
      pageCount: result.pageCount,
    };
  } catch (error) {
    console.error('PDF extraction failed:', error);
    throw new Error('Failed to extract text from PDF. The file may be corrupted or password-protected.');
  }
}

/**
 * Extract text with additional OCR options
 */
export async function extractTextWithOptions(
  pdfBuffer: Buffer,
  options: {
    preferPoppler?: boolean;
    layout?: boolean;
  } = {}
): Promise<OCRResult> {
  const { preferPoppler = true, layout = true } = options;

  if (!preferPoppler) {
    const result = await extractWithPdfParse(pdfBuffer);
    return {
      text: result.text,
      method: 'pdf-parse',
      pageCount: result.pageCount,
    };
  }

  return extractTextFromPDF(pdfBuffer);
}

export { isPopplerAvailable };
