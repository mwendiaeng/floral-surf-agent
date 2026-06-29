/**
 * fetch/pdf.ts
 *
 * PDF extraction.
 *
 * Built on pdfjs-dist.
 */

import * as pdfjs from "pdfjs-dist";

import type { ParsedDocument, ParseContext } from "./parser";

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

export interface PdfParserOptions {
  password?: string;

  maxPages?: number;

  extractText?: boolean;

  extractMetadata?: boolean;

  extractOutline?: boolean;

  extractAnnotations?: boolean;

  extractImages?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export interface PdfMetadata {
  title?: string;

  author?: string;

  subject?: string;

  keywords?: string[];

  creator?: string;

  producer?: string;

  creationDate?: Date;

  modificationDate?: Date;

  [key: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export interface PdfPage {
  number: number;

  width: number;

  height: number;

  rotation: number;

  text: string;

  words: number;
}

/* -------------------------------------------------------------------------- */
/* Document                                                                   */
/* -------------------------------------------------------------------------- */

export interface PdfDocument {
  pages: PdfPage[];

  metadata: PdfMetadata;

  pageCount: number;

  text: string;

  title?: string;

  markdown?: string;
}

/* -------------------------------------------------------------------------- */
/* Parser                                                                     */
/* -------------------------------------------------------------------------- */

export class PdfParser {
  constructor(readonly options: PdfParserOptions = {}) { }

  /* -------------------------------------------------------------------------- */
  /* Loading                                                                    */
  /* -------------------------------------------------------------------------- */

  async loadDocument(
    source: ArrayBuffer | Uint8Array
  ): Promise<pdfjs.PDFDocumentProxy> {
    const loadingTask = pdfjs.getDocument({
      data: source instanceof Uint8Array ? source : new Uint8Array(source),

      password: this.options.password
    });

    return loadingTask.promise;
  }

  /* -------------------------------------------------------------------------- */
  /* Metadata                                                                   */
  /* -------------------------------------------------------------------------- */

  async extractMetadata(
    document: pdfjs.PDFDocumentProxy
  ): Promise<PdfMetadata> {
    const metadata = await document.getMetadata();

    const info = metadata.info as Record<string, unknown>;

    return {
      title: typeof info.Title === "string" ? info.Title : undefined,

      author: typeof info.Author === "string" ? info.Author : undefined,

      subject: typeof info.Subject === "string" ? info.Subject : undefined,

      keywords:
        typeof info.Keywords === "string"
          ? info.Keywords.split(",")

            .map((value) => value.trim())

            .filter(Boolean)
          : undefined,

      creator: typeof info.Creator === "string" ? info.Creator : undefined,

      producer: typeof info.Producer === "string" ? info.Producer : undefined,

      creationDate:
        typeof info.CreationDate === "string"
          ? new Date(info.CreationDate)
          : undefined,

      modificationDate:
        typeof info.ModDate === "string" ? new Date(info.ModDate) : undefined
    };
  }

  /* -------------------------------------------------------------------------- */
  /* Document Info                                                              */
  /* -------------------------------------------------------------------------- */

  async getDocumentInfo(document: pdfjs.PDFDocumentProxy): Promise<{
    pageCount: number;

    metadata: PdfMetadata;
  }> {
    const metadata =
      this.options.extractMetadata === false
        ? {}
        : await this.extractMetadata(document);

    return {
      pageCount: document.numPages,

      metadata
    };
  }

  /* -------------------------------------------------------------------------- */
  /* Pages                                                                      */
  /* -------------------------------------------------------------------------- */

  async getPages(
    document: pdfjs.PDFDocumentProxy
  ): Promise<pdfjs.PDFPageProxy[]> {
    const pages: pdfjs.PDFPageProxy[] = [];

    const maxPages = this.options.maxPages ?? document.numPages;

    for (
      let pageNumber = 1;
      pageNumber <=
      Math.min(
        maxPages,

        document.numPages
      );
      pageNumber++
    ) {
      pages.push(await document.getPage(pageNumber));
    }

    return pages;
  }

  /* -------------------------------------------------------------------------- */
  /* Parse                                                                      */
  /* -------------------------------------------------------------------------- */

  async parse(
    source: ArrayBuffer | Uint8Array,

    context?: ParseContext
  ): Promise<PdfDocument> {
    const document = await this.loadDocument(source);

    const {
      pageCount,

      metadata
    } = await this.getDocumentInfo(document);

    const pages =
      this.options.extractText === false
        ? []
        : await this.extractPages(document);

    const text = buildDocumentText(pages);

    return {
      pageCount,

      metadata,

      pages,

      text
    };
  }

  /* -------------------------------------------------------------------------- */
  /* Page Extraction                                                            */
  /* -------------------------------------------------------------------------- */

  async extractPage(page: pdfjs.PDFPageProxy): Promise<PdfPage> {
    const viewport = page.getViewport({
      scale: 1
    });

    const content = await page.getTextContent();

    /*
     * PDF.js returns items roughly in rendering
     * order but not always reading order.
     * Sort by Y (descending) then X (ascending).
     */

    const items = (content.items as TextItem[])

      .slice()

      .sort(
        (
          a,

          b
        ) => {
          const ay = a.transform[5];

          const by = b.transform[5];

          if (Math.abs(ay - by) > 2) {
            return by - ay;
          }

          return a.transform[4] - b.transform[4];
        }
      );

    const lines: string[] = [];

    let currentY: number | undefined;

    let currentLine: string[] = [];

    for (const item of items) {
      const y = item.transform[5];

      if (currentY === undefined) {
        currentY = y;
      }

      /*
       * New line threshold.
       */

      if (Math.abs(currentY - y) > 2) {
        lines.push(currentLine.join(" "));

        currentLine = [];

        currentY = y;
      }

      const text = item.str.trim();

      if (text) {
        currentLine.push(text);
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine.join(" "));
    }

    const pageText = normalizePdfText(lines.join("\n"));

    return {
      number: page.pageNumber,

      width: viewport.width,

      height: viewport.height,

      rotation: viewport.rotation,

      text: pageText,

      words: pageText

        .split(/\s+/)

        .filter(Boolean).length
    };
  }

  /* -------------------------------------------------------------------------- */
  /* All Pages                                                                  */
  /* -------------------------------------------------------------------------- */

  async extractPages(document: pdfjs.PDFDocumentProxy): Promise<PdfPage[]> {
    const pageHandles = await this.getPages(document);

    const pages: PdfPage[] = [];

    for (const page of pageHandles) {
      pages.push(await this.extractPage(page));
    }

    return pages;
  }

  /* -------------------------------------------------------------------------- */
  /* Outline                                                                    */
  /* -------------------------------------------------------------------------- */

  async extractOutline(

    document: pdfjs.PDFDocumentProxy

  ): Promise<PdfOutlineItem[]> {

    const outline =

      await document.getOutline();

    if (

      !outline

    ) {

      return [];

    }

const convert = (

    items: readonly any[]

): PdfOutlineItem[] =>

    items.map(

        item => ({

          title:

            item.title,

          page:

            undefined,

          children:

            convert(

              item.items

            ),

        })

      );

    return convert(

      outline

    );

  }

  /* -------------------------------------------------------------------------- */
  /* Annotations                                                                */
  /* -------------------------------------------------------------------------- */

  async extractAnnotations(

    page: pdfjs.PDFPageProxy

  ): Promise<PdfAnnotation[]> {

    const annotations =

      await page.getAnnotations();

    return annotations.map(

      annotation => ({

        page:

          page.pageNumber,

        subtype:

          annotation.subtype,

        contents:

          annotation.contents,

        author:

          annotation.titleObj?.str,

        modified:

          annotation.modificationDate,

        rect:

          annotation.rect as [

            number,

            number,

            number,

            number

          ],

      })

    );

  }

  /* -------------------------------------------------------------------------- */
  /* Links                                                                      */
  /* -------------------------------------------------------------------------- */

  async extractLinks(

    page: pdfjs.PDFPageProxy

  ): Promise<PdfLink[]> {

    const annotations =

      await page.getAnnotations();

    return annotations

      .filter(

        annotation =>

          annotation.subtype ===

          "Link"

      )

      .map(

        annotation => ({

          page:

            page.pageNumber,

          url:

            (annotation as any).url,

          destination:

            (annotation as any).dest,

          text:

            undefined,

          rect:

            annotation.rect as [

              number,

              number,

              number,

              number

            ],

        })

      );

  }

  /* -------------------------------------------------------------------------- */
  /* Attachments                                                                */
  /* -------------------------------------------------------------------------- */

  async extractAttachments(

    document: pdfjs.PDFDocumentProxy

  ): Promise<PdfAttachment[]> {

    const attachments =

      await document.getAttachments();

    if (

      !attachments

    ) {

      return [];

    }

    return Object.entries(

      attachments

    ).map(

      ([

        filename,

        file,

      ]) => ({

        filename,

        contentType:

          file.contentType,

        size:

          file.content.length,

        data:

          file.content,

      })

    );

  }

  /* -------------------------------------------------------------------------- */
  /* Images                                                                     */
  /* -------------------------------------------------------------------------- */

  /**
   * Placeholder.
   *
   * pdf.js does not expose embedded images
   * through a stable public API.
   *
   * Future implementation can inspect the
   * operator list or integrate pdf-lib.
   */

  async extractImages(

    _page: pdfjs.PDFPageProxy

  ): Promise<unknown[]> {

    return [];

  }

  /* -------------------------------------------------------------------------- */
  /* Document Structure                                                         */
  /* -------------------------------------------------------------------------- */

  async extractStructure(

    document: pdfjs.PDFDocumentProxy

  ) {

    const pages =

      await this.getPages(

        document

      );

    const outline =

      this.options.extractOutline === false

        ? []

        : await this.extractOutline(

          document

        );

    const annotations: PdfAnnotation[] = [];

    const links: PdfLink[] = [];

    const images: unknown[] = [];

    for (

      const page of pages

    ) {

      if (

        this.options.extractAnnotations !== false

      ) {

        annotations.push(

          ...(await this.extractAnnotations(

            page

          ))

        );

      }

      links.push(

        ...(await this.extractLinks(

          page

        ))

      );

      if (

        this.options.extractImages

      ) {

        images.push(

          ...(await this.extractImages(

            page

          ))

        );

      }

    }

    const attachments =

      await this.extractAttachments(

        document

      );

    return {

      outline,

      links,

      annotations,

      images,

      attachments,

    };

  }

  /* -------------------------------------------------------------------------- */
  /* Rendering                                                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Rendering is runtime-dependent.
   *
   * Browsers can render into an OffscreenCanvas or HTMLCanvasElement.
   * Node.js typically requires node-canvas.
   *
   * This provides the abstraction point; platform-specific rendering
   * should be implemented by the consumer.
   */
  async renderPage(

    page: pdfjs.PDFPageProxy,

    _options: PdfRenderOptions = {}

  ): Promise<PdfThumbnail> {

    const viewport =

      page.getViewport({

        scale:

          _options.scale ?? 1,

        rotation:

          _options.rotation,

      });

    return {

      page:

        page.pageNumber,

      width:

        viewport.width,

      height:

        viewport.height,

      image:

        new Uint8Array(),

    };

  }

  /* -------------------------------------------------------------------------- */
  /* OCR                                                                        */
  /* -------------------------------------------------------------------------- */

  async runOcr(

    page: pdfjs.PDFPageProxy,

    provider: OcrProvider,

    options: PdfRenderOptions = {}

  ): Promise<string> {

    const rendered =

      await this.renderPage(

        page,

        options

      );

    return provider.recognize(

      rendered.image

    );

  }
}

/* -------------------------------------------------------------------------- */
/* Singleton                                                                  */
/* -------------------------------------------------------------------------- */

export const pdfParser = new PdfParser();

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

export async function loadPdf(
  source: ArrayBuffer | Uint8Array
): Promise<pdfjs.PDFDocumentProxy> {
  return pdfParser.loadDocument(source);
}

/* -------------------------------------------------------------------------- */
/* Text Normalization                                                         */
/* -------------------------------------------------------------------------- */

function normalizePdfText(text: string): string {
  return text

    .replace(/\u00A0/g, " ")

    .replace(/[ \t]+/g, " ")

    .replace(/\n{3,}/g, "\n\n")

    .trim();
}

/* -------------------------------------------------------------------------- */
/* Text Item                                                                  */
/* -------------------------------------------------------------------------- */

interface TextItem {
  str: string;

  transform: number[];

  width: number;

  height: number;
}

/* -------------------------------------------------------------------------- */
/* Full Document Text                                                         */
/* -------------------------------------------------------------------------- */

function buildDocumentText(pages: PdfPage[]): string {
  return normalizePdfText(
    pages

      .map((page) => page.text)

      .join("\n\n")
  );
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface PdfOutlineItem {

  title: string;

  page?: number;

  children: PdfOutlineItem[];

}

export interface PdfLink {

  page: number;

  text?: string;

  url?: string;

  destination?: unknown;

  rect: [number, number, number, number];

}

export interface PdfAnnotation {

  page: number;

  subtype: string;

  contents?: string;

  author?: string;

  modified?: string;

  rect: [number, number, number, number];

}

export interface PdfAttachment {

  filename: string;

  contentType?: string;

  size?: number;

  data?: Uint8Array;

}

/* -------------------------------------------------------------------------- */
/* OCR Provider                                                               */
/* -------------------------------------------------------------------------- */

export interface OcrProvider {

  recognize(

    image: ImageData | ImageBitmap | Uint8Array

  ): Promise<string>;

}

/* -------------------------------------------------------------------------- */
/* Render Options                                                             */
/* -------------------------------------------------------------------------- */

export interface PdfRenderOptions {

  scale?: number;

  rotation?: number;

  background?: string;

}

/* -------------------------------------------------------------------------- */
/* Thumbnail                                                                  */
/* -------------------------------------------------------------------------- */

export interface PdfThumbnail {

  page: number;

  width: number;

  height: number;

  image: ImageData | ImageBitmap | Uint8Array;

}



/* -------------------------------------------------------------------------- */
/* Streaming                                                                  */
/* -------------------------------------------------------------------------- */

export async function parsePdfStream(

  stream: ReadableStream<Uint8Array>

): Promise<PdfDocument> {

  const reader =

    stream.getReader();

  const chunks: Uint8Array[] = [];

  let total = 0;

  while (

    true

  ) {

    const {

      done,

      value,

    } = await reader.read();

    if (

      done

    ) {

      break;

    }

    chunks.push(

      value

    );

    total +=

      value.byteLength;

  }

  const merged =

    new Uint8Array(

      total

    );

  let offset = 0;

  for (

    const chunk of chunks

  ) {

    merged.set(

      chunk,

      offset

    );

    offset +=

      chunk.byteLength;

  }

  return pdfParser.parse(

    merged

  );

}

/* -------------------------------------------------------------------------- */
/* ParsedDocument Integration                                                 */
/* -------------------------------------------------------------------------- */

export async function parsePdf(

  source: ArrayBuffer | Uint8Array,

  context: ParseContext = {}

): Promise<ParsedDocument> {

  const document =

    await pdfParser.parse(

      source,

      context

    );

return {

    type: "pdf",

    url: context.url,

    contentType: "application/pdf",

    encoding: "binary",

    title: document.title,

    text: document.text,

    markdown: document.markdown,

    metadata: {

    ...document.metadata,

    pageCount: document.pageCount,

    },

    data: document,

  };

}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export async function extractPdfText(

  source: ArrayBuffer | Uint8Array

): Promise<string> {

  return (

    await pdfParser.parse(

      source

    )

  ).text;

}

export async function extractPdfMetadata(

  source: ArrayBuffer | Uint8Array

): Promise<PdfMetadata> {

  return (

    await pdfParser.parse(

      source

    )

  ).metadata;

}

export async function extractPdfPages(

  source: ArrayBuffer | Uint8Array

): Promise<PdfPage[]> {

  return (

    await pdfParser.parse(

      source

    )

  ).pages;

}
/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

export function createPdfParser(

  options?: PdfParserOptions

): PdfParser {

  return new PdfParser(

    options

  );

}

/* -------------------------------------------------------------------------- */
/* Singleton Helpers                                                          */
/* -------------------------------------------------------------------------- */

export async function parsePdfDocument(

  source: ArrayBuffer | Uint8Array,

  context?: ParseContext

): Promise<PdfDocument> {

  return pdfParser.parse(

    source,

    context

  );

}

export async function loadPdfDocument(

  source: ArrayBuffer | Uint8Array

): Promise<pdfjs.PDFDocumentProxy> {

  return pdfParser.loadDocument(

    source

  );

}

export async function renderPdfPage(

  source: ArrayBuffer | Uint8Array,

  pageNumber: number,

  options: PdfRenderOptions = {}

): Promise<PdfThumbnail> {

  const document =

    await pdfParser.loadDocument(

      source

    );

  const page =

    await document.getPage(

      pageNumber

    );

  return pdfParser.renderPage(

    page,

    options

  );

}

export async function ocrPdfPage(

  source: ArrayBuffer | Uint8Array,

  pageNumber: number,

  provider: OcrProvider,

  options: PdfRenderOptions = {}

): Promise<string> {

  const document =

    await pdfParser.loadDocument(

      source

    );

  const page =

    await document.getPage(

      pageNumber

    );

  return pdfParser.runOcr(

    page,

    provider,

    options

  );

}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {

  PdfParser,

  pdfParser,

  createPdfParser,

  loadPdf,

  loadPdfDocument,

  parsePdf,

  parsePdfDocument,

  parsePdfStream,

  extractPdfText,

  extractPdfMetadata,

  extractPdfPages,

  renderPdfPage,

  ocrPdfPage,

};