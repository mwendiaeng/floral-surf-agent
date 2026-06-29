/**
 * fetch/parser.ts
 *
 * Central content parser.
 *
 * Responsible for routing fetched responses
 * to the appropriate parser implementation.
 */

import { parse as parseContentType } from "content-type";

import { htmlParser } from "./html/parser";

import { extractReadableArticle } from "./html/readability";
import type { FetchRequest } from "./types";
import { parsePdfDocument } from "./pdf";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ParsedContentType =
  | "html"
  | "json"
  | "xml"
  | "markdown"
  | "text"
  | "pdf"
  | "binary"
  | "unknown";

export interface ParseContext {
  url?: string;

  status?: number;

  headers?: Headers;

  contentType?: string;

  encoding?: string;
}

export interface ParsedDocument {
  type: ParsedContentType;

  url?: string;

  contentType?: string;

  encoding?: string;

  title?: string;

  text?: string;

  markdown?: string;

  html?: string;

  metadata: Record<string, unknown>;

  data?: unknown;

  pdf?: unknown;
}

export interface ParseResult {
  document: ParsedDocument;

  warnings: string[];

  errors: string[];
}

export interface ContentParser {
  readonly type: ParsedContentType;

  supports(contentType: string): boolean;

  parse(
    body: ArrayBuffer | string,

    context: ParseContext
  ): Promise<ParsedDocument>;
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                   */
/* -------------------------------------------------------------------------- */

const parsers: ContentParser[] = [];

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export class FetchParser {
  register(parser: ContentParser): void {
    parsers.push(parser);
  }

  unregister(type: ParsedContentType): void {
    const index = parsers.findIndex((parser) => parser.type === type);

    if (index >= 0) {
      parsers.splice(
        index,

        1
      );
    }
  }

  /* -------------------------------------------------------------------------- */
  /* FetchParser.parse()                                                        */
  /* -------------------------------------------------------------------------- */

  async parse(
    body: ArrayBuffer | string,

    context: ParseContext = {}
  ): Promise<ParseResult> {
    const warnings: string[] = [];

    const errors: string[] = [];

    try {
      const bodyString = typeof body === "string" ? body : undefined;

      const {
        type,

        parser
      } = resolveParser(
        context,

        bodyString
      );

      let document: ParsedDocument;

      /*
       * Custom parser has priority.
       */

      if (parser) {
        document = await parser.parse(
          body,

          context
        );
      } else {
        document = await parseBuiltin(
          type,

          body,

          context
        );
      }

      /*
       * Normalize common fields.
       */

      document.type = document.type ?? type;

      document.url ??= context.url;

      document.contentType ??=
        context.contentType ?? context.headers?.get("content-type") ?? "";

      document.encoding ??= detectEncoding(context);

      document.metadata ??= {};

      /*
       * Metadata enrichment.
       */

      document.metadata = {
        parsedAt: new Date()

          .toISOString(),

        parser: parser?.type ?? "builtin",

        ...document.metadata
      };

      /*
       * Basic validation.
       */

      if (!document.text && !document.html && !document.markdown) {
        warnings.push("Parser produced no textual content.");
      }

      if (document.type === "binary") {
        warnings.push("Binary document could not be parsed into text.");
      }

      return {
        document,

        warnings,

        errors
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));

      return {
        document: {
          type: "unknown",

          url: context.url,

          contentType: context.contentType,

          encoding: detectEncoding(context),

          metadata: {}
        },

        warnings,

        errors
      };
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Response Helper                                                            */
/* -------------------------------------------------------------------------- */

export async function parseResponse(response: Response, p0: { url: string; request: FetchRequest; }): Promise<ParseResult> {
  const contentType = response.headers.get("content-type") ?? "";

  const context: ParseContext = {
    url: response.url,

    status: response.status,

    headers: response.headers,

    contentType
  };

  const type = detectContentType(context);

  const body =
    type === "binary" || type === "pdf"
      ? await response.arrayBuffer()
      : await response.text();

  return fetchParser.parse(
    body,

    context
  );
}

export const fetchParser = new FetchParser();

/* -------------------------------------------------------------------------- */
/* MIME Detection                                                             */
/* -------------------------------------------------------------------------- */

export function detectContentType(
  context: ParseContext,

  body?: string
): ParsedContentType {
  const header =
    context.contentType ?? context.headers?.get("content-type") ?? "";

  let mime = header.toLowerCase();

  try {
    mime = parseContentType(header).type.toLowerCase();
  } catch {
    // Ignore malformed header
  }

  /* ---------------- HTML ---------------- */

  if (mime.includes("text/html") || mime.includes("application/xhtml")) {
    return "html";
  }

  /* ---------------- JSON ---------------- */

  if (mime.includes("application/json") || mime.endsWith("+json")) {
    return "json";
  }

  /* ---------------- XML ---------------- */

  if (
    mime.includes("application/xml") ||
    mime.includes("text/xml") ||
    mime.endsWith("+xml")
  ) {
    return "xml";
  }

  /* -------------- Markdown ------------- */

  if (mime.includes("text/markdown") || mime.includes("text/x-markdown")) {
    return "markdown";
  }

  /* ---------------- PDF ---------------- */

  if (mime.includes("application/pdf")) {
    return "pdf";
  }

  /* ---------------- Text --------------- */

  if (mime.startsWith("text/")) {
    return "text";
  }

  /*
   * Fallback detection using content.
   */

  if (body) {
    const sample = body

      .trimStart()

      .slice(0, 512);

    if (/^<!doctype html/i.test(sample) || /^<html/i.test(sample)) {
      return "html";
    }

    if (/^[\[{]/.test(sample)) {
      return "json";
    }

    if (/^<\?xml/i.test(sample)) {
      return "xml";
    }

    if (/^#\s+/.test(sample)) {
      return "markdown";
    }
  }

  return "binary";
}

/* -------------------------------------------------------------------------- */
/* Character Encoding                                                         */
/* -------------------------------------------------------------------------- */

export function detectEncoding(context: ParseContext): string {
  const header = context.contentType ?? context.headers?.get("content-type");

  if (header) {
    try {
      const parsed = parseContentType(header);

      if (parsed.parameters.charset) {
        return parsed.parameters.charset;
      }
    } catch {
      // Ignore malformed header
    }
  }

  return (context.encoding ?? "utf-8")

    .toLowerCase();
}

/* -------------------------------------------------------------------------- */
/* Parser Lookup                                                              */
/* -------------------------------------------------------------------------- */

function findParser(
  type: ParsedContentType,

  mime?: string
): ContentParser | undefined {
  if (mime) {
    const byMime = parsers.find((parser) => parser.supports(mime));

    if (byMime) {
      return byMime;
    }
  }

  return parsers.find((parser) => parser.type === type);
}

/* -------------------------------------------------------------------------- */
/* Parser Selection                                                           */
/* -------------------------------------------------------------------------- */

export function resolveParser(
  context: ParseContext,

  body?: string
): {
  type: ParsedContentType;

  parser?: ContentParser;
} {
  const type = detectContentType(
    context,

    body
  );

  const mime =
    context.contentType ?? context.headers?.get("content-type") ?? "";

  return {
    type,

    parser: findParser(
      type,

      mime
    )
  };
}

/* -------------------------------------------------------------------------- */
/* HTML                                                                       */
/* -------------------------------------------------------------------------- */

async function parseHtml(
  body: string,

  context: ParseContext
): Promise<ParsedDocument> {
  const document = await htmlParser.parse(
    body,

    {
      url: context.url,

      contentType: context.contentType
    }
  );

  return {
    type: "html",

    url: context.url,

    contentType: context.contentType,

    encoding: detectEncoding(context),

    title: document.title,

    html: document.cleanHtml ?? document.html,

    markdown: document.markdown,

    text: document.text,

    metadata: {
      ...document.metadata,

      statistics: document.statistics,

      fingerprint: document.fingerprint
    },

    data: document
  };
}

/* -------------------------------------------------------------------------- */
/* JSON                                                                       */
/* -------------------------------------------------------------------------- */

async function parseJson(
  body: string,

  context: ParseContext
): Promise<ParsedDocument> {
  const data = JSON.parse(body);

  const pretty = JSON.stringify(
    data,

    null,

    2
  );

  return {
    type: "json",

    url: context.url,

    contentType: context.contentType,

    encoding: detectEncoding(context),

    title: undefined,

    text: pretty,

    markdown: "```json\n" + pretty + "\n```",

    metadata: {
      keys: typeof data === "object" ? Object.keys(data as object) : [],

      rootType: Array.isArray(data) ? "array" : typeof data
    },

    data
  };
}

/* -------------------------------------------------------------------------- */
/* XML                                                                        */
/* -------------------------------------------------------------------------- */

async function parseXml(
  body: string,

  context: ParseContext
): Promise<ParsedDocument> {
  const title = body.match(/<title>(.*?)<\/title>/is)?.[1]?.trim();

  const text = body

    .replace(
      /<[^>]+>/g,

      " "
    )

    .replace(
      /\s+/g,

      " "
    )

    .trim();

  return {
    type: "xml",

    url: context.url,

    contentType: context.contentType,

    encoding: detectEncoding(context),

    title,

    text,

    metadata: {
      length: body.length,

      root: body.match(/<([a-zA-Z0-9:_-]+)/)?.[1]
    },

    data: body
  };
}

/* -------------------------------------------------------------------------- */
/* Markdown                                                                   */
/* -------------------------------------------------------------------------- */

async function parseMarkdown(
  body: string,

  context: ParseContext
): Promise<ParsedDocument> {
  const title = body.match(/^#\s+(.+)$/m)?.[1];

  return {
    type: "markdown",

    url: context.url,

    contentType: context.contentType,

    encoding: detectEncoding(context),

    title,

    markdown: body,

    text: body,

    metadata: {
      length: body.length,

      lines: body.split("\n").length
    },

    data: body
  };
}

/* -------------------------------------------------------------------------- */
/* Plain Text                                                                 */
/* -------------------------------------------------------------------------- */

async function parseText(
  body: string,

  context: ParseContext
): Promise<ParsedDocument> {
  return {
    type: "text",

    url: context.url,

    contentType: context.contentType,

    encoding: detectEncoding(context),

    text: body,

    metadata: {
      length: body.length,

      lines: body.split("\n").length,

      empty: body.trim().length === 0
    },

    data: body
  };
}

/* -------------------------------------------------------------------------- */
/* Binary                                                                      */
/* -------------------------------------------------------------------------- */

async function parseBinary(
  body: ArrayBuffer,

  context: ParseContext
): Promise<ParsedDocument> {
  return {
    type: "binary",

    url: context.url,

    contentType: context.contentType,

    encoding: context.encoding,

    metadata: {
      byteLength: body.byteLength
    },

    data: body
  };
}

/* -------------------------------------------------------------------------- */
/* PDF                                                                        */
/* -------------------------------------------------------------------------- */

async function parsePdf(
  body: ArrayBuffer,

  context: ParseContext
): Promise<ParsedDocument> {
  /*
   * Delegates to the PDF parser.
   * This will become tools/fetch/pdf.ts.
   */

  const document = await parsePdfDocument(
    body,

    {
      url: context.url,

      contentType: context.contentType
    }
  );

  return {
    type: "pdf",

    url: context.url,

    contentType: context.contentType,

    encoding: detectEncoding(context),

    title: document.title,

    text: document.text,

    markdown: document.markdown,

    metadata: document.metadata,

    data: document
  };
}

/* -------------------------------------------------------------------------- */
/* Built-in Dispatch                                                          */
/* -------------------------------------------------------------------------- */

async function parseBuiltin(
  type: ParsedContentType,

  body: ArrayBuffer | string,

  context: ParseContext
): Promise<ParsedDocument> {
  switch (type) {
    case "html":
      return parseHtml(
        body as string,

        context
      );

    case "json":
      return parseJson(
        body as string,

        context
      );

    case "xml":
      return parseXml(
        body as string,

        context
      );

    case "markdown":
      return parseMarkdown(
        body as string,

        context
      );

    case "text":
      return parseText(
        body as string,

        context
      );

    case "pdf":
      return parsePdf(
        body as ArrayBuffer,

        context
      );

    case "binary":

    default:
      return parseBinary(
        body as ArrayBuffer,

        context
      );
  }
}

/* -------------------------------------------------------------------------- */
/* Parser Registration                                                        */
/* -------------------------------------------------------------------------- */

export function registerParser(parser: ContentParser): void {
  fetchParser.register(parser);
}

export function unregisterParser(type: ParsedContentType): void {
  fetchParser.unregister(type);
}

export function clearParsers(): void {
  parsers.length = 0;
}

export function getRegisteredParsers(): readonly ContentParser[] {
  return [...parsers];
}

/* -------------------------------------------------------------------------- */
/* Built-in Parser Registration                                               */
/* -------------------------------------------------------------------------- */

class HtmlParserAdapter implements ContentParser {
  readonly type = "html" as const;

  supports(contentType: string): boolean {
    return contentType

      .toLowerCase()

      .includes("text/html");
  }

  async parse(
    body: ArrayBuffer | string,

    context: ParseContext
  ): Promise<ParsedDocument> {
    return parseHtml(
      String(body),

      context
    );
  }
}

class JsonParserAdapter implements ContentParser {
  readonly type = "json" as const;

  supports(contentType: string): boolean {
    return contentType

      .toLowerCase()

      .includes("json");
  }

  async parse(
    body: ArrayBuffer | string,

    context: ParseContext
  ): Promise<ParsedDocument> {
    return parseJson(
      String(body),

      context
    );
  }
}

class XmlParserAdapter implements ContentParser {
  readonly type = "xml" as const;

  supports(contentType: string): boolean {
    return contentType

      .toLowerCase()

      .includes("xml");
  }

  async parse(
    body: ArrayBuffer | string,

    context: ParseContext
  ): Promise<ParsedDocument> {
    return parseXml(
      String(body),

      context
    );
  }
}

class MarkdownParserAdapter implements ContentParser {
  readonly type = "markdown" as const;

  supports(contentType: string): boolean {
    const mime = contentType.toLowerCase();

    return mime.includes("markdown") || mime.includes("text/x-markdown");
  }

  async parse(
    body: ArrayBuffer | string,

    context: ParseContext
  ): Promise<ParsedDocument> {
    return parseMarkdown(
      String(body),

      context
    );
  }
}

class TextParserAdapter implements ContentParser {
  readonly type = "text" as const;

  supports(contentType: string): boolean {
    return contentType

      .toLowerCase()

      .startsWith("text/");
  }

  async parse(
    body: ArrayBuffer | string,

    context: ParseContext
  ): Promise<ParsedDocument> {
    return parseText(
      String(body),

      context
    );
  }
}

class PdfParserAdapter implements ContentParser {
  readonly type = "pdf" as const;

  supports(contentType: string): boolean {
    return contentType

      .toLowerCase()

      .includes("application/pdf");
  }

  async parse(
    body: ArrayBuffer | string,

    context: ParseContext
  ): Promise<ParsedDocument> {
    return parsePdf(
      body as ArrayBuffer,

      context
    );
  }
}

class BinaryParserAdapter implements ContentParser {
  readonly type = "binary" as const;

  supports(): boolean {
    return false;
  }

  async parse(
    body: ArrayBuffer | string,

    context: ParseContext
  ): Promise<ParsedDocument> {
    return parseBinary(
      body as ArrayBuffer,

      context
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Register Built-ins                                                         */
/* -------------------------------------------------------------------------- */

registerParser(new HtmlParserAdapter());

registerParser(new JsonParserAdapter());

registerParser(new XmlParserAdapter());

registerParser(new MarkdownParserAdapter());

registerParser(new TextParserAdapter());

registerParser(new PdfParserAdapter());

registerParser(new BinaryParserAdapter());

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {
  FetchParser,

  fetchParser,

  parseResponse,

  registerParser,

  unregisterParser,

  clearParsers,

  getRegisteredParsers,

  detectContentType,

  detectEncoding,

  resolveParser
};
