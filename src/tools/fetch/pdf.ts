// fetch/pdf.ts

import { PdfExtractionResult, FetchError, FetchErrorCode } from "./types";

/**
 * Configuration for PDF extraction.
 */
export interface PdfExtractionOptions {
  /**
   * Maximum pages to process.
   */
  maxPages?: number;

  /**
   * Maximum extracted characters.
   */
  maxCharacters?: number;

  /**
   * Extract document metadata.
   */
  includeMetadata?: boolean;

  /**
   * Extract tables (future).
   */
  extractTables?: boolean;

  /**
   * Run OCR for scanned PDFs (future).
   */
  enableOCR?: boolean;
}

export interface PdfExtractor {
  extract(
    buffer: Uint8Array,
    options?: PdfExtractionOptions
  ): Promise<PdfExtractionResult>;
}

/**
 * Default implementation.
 *
 * Recommended libraries:
 *  - pdf-parse
 *  - pdfjs-dist
 */
export class DefaultPdfExtractor implements PdfExtractor {
  async extract(
    buffer: Uint8Array,
    options: PdfExtractionOptions = {}
  ): Promise<PdfExtractionResult> {
    try {
      // TODO:
      // Use pdf-parse or pdfjs-dist.
      //
      // Example (pseudo-code):
      //
      // const pdf = await pdf(buffer);
      //
      // return {
      //   pages: pdf.numpages,
      //   title: pdf.info?.Title,
      //   author: pdf.info?.Author,
      //   subject: pdf.info?.Subject,
      //   creator: pdf.info?.Creator,
      //   producer: pdf.info?.Producer,
      //   createdAt: parsePdfDate(pdf.info?.CreationDate),
      //   modifiedAt: parsePdfDate(pdf.info?.ModDate),
      //   text: truncate(pdf.text, options.maxCharacters),
      // };

      throw new Error("PDF parser not yet implemented.");
    } catch (error) {
      throw new FetchError(
        FetchErrorCode.PDF_ERROR,
        "Failed to extract PDF contents.",
        error
      );
    }
  }
}

/**
 * Convert PDF date strings into JavaScript Dates.
 *
 * Example:
 * D:20240208121030Z
 */
export function parsePdfDate(
  value?: string
): Date | undefined {
  if (!value) {
    return undefined;
  }

  // Basic implementation.
  const cleaned = value.replace(/^D:/, "");

  const year = cleaned.slice(0, 4);
  const month = cleaned.slice(4, 6);
  const day = cleaned.slice(6, 8);

  if (
    year.length !== 4 ||
    month.length !== 2 ||
    day.length !== 2
  ) {
    return undefined;
  }

  return new Date(
    `${year}-${month}-${day}`
  );
}

/**
 * Truncate extracted text.
 */
export function truncate(
  text: string,
  max?: number
): string {
  if (!max || text.length <= max) {
    return text;
  }

  return text.slice(0, max);
}