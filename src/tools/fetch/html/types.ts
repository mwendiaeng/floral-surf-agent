/**
 * html/types.ts
 *
 * Types used by the HTML parser subsystem.
 */

import type {
  CodeBlock,
  ExtractedImage,
  ExtractedLink,
  Heading,
  ParsedTable,
} from "../types";

export interface HtmlParseOptions {
  /**
   * Enable Mozilla Readability extraction.
   * Default: true
   */
  readability?: boolean;

  /**
   * Convert cleaned HTML to Markdown.
   */
  markdown?: boolean;

  /**
   * Remove scripts/styles/comments.
   */
  sanitize?: boolean;

  /**
   * Extract Schema.org metadata.
   */
  schema?: boolean;

  /**
   * Extract OpenGraph metadata.
   */
  openGraph?: boolean;

  /**
   * Extract Twitter Card metadata.
   */
  twitterCards?: boolean;

  /**
   * Extract JSON-LD.
   */
  jsonLd?: boolean;

  /**
   * Extract tables.
   */
  tables?: boolean;

  /**
   * Extract images.
   */
  images?: boolean;

  /**
   * Extract links.
   */
  links?: boolean;

  /**
   * Extract forms.
   */
  forms?: boolean;

  /**
   * Extract code blocks.
   */
  codeBlocks?: boolean;

  /**
   * Generate semantic sections.
   */
  sections?: boolean;

  /**
   * Generate TOC.
   */
  toc?: boolean;

  /**
   * Chunk output.
   */
  chunking?: boolean;

  /**
   * Preserve original HTML.
   */
  preserveHtml?: boolean;
}

export interface HtmlDocument {

  url?: string;

  title?: string;

  description?: string;

  language?: string;

  charset?: string;

  canonical?: string;

  favicon?: string;

  author?: string;

  siteName?: string;

  html: string;

  cleanHtml?: string;

  markdown?: string;

  text: string;

  metadata: HtmlMetadata;

  headings: Heading[];

  links: ExtractedLink[];

  images: HtmlImage[];

  tables: ParsedTable[];

  codeBlocks: CodeBlock[];

  forms: HtmlForm[];

  sections: HtmlSection[];

  toc: TableOfContents;

  schema: SchemaOrgData[];

  jsonLd: unknown[];

  statistics: HtmlStatistics;

}

export interface HtmlMetadata {

  title?: string;

  description?: string;

  keywords?: string[];

  robots?: string;

  generator?: string;

  author?: string;

  publisher?: string;

  language?: string;

  charset?: string;

  viewport?: string;

  canonical?: string;

  favicon?: string;

  themeColor?: string;

  openGraph?: OpenGraphMetadata;

  twitter?: TwitterCardMetadata;

  custom: Record<string, string>;

}

export interface OpenGraphMetadata {

  title?: string;

  description?: string;

  image?: string;

  url?: string;

  type?: string;

  siteName?: string;

  locale?: string;

}

export interface TwitterCardMetadata {

  card?: string;

  title?: string;

  description?: string;

  image?: string;

  site?: string;

  creator?: string;

}

export interface HtmlImage extends ExtractedImage {

  loading?: string;

  decoding?: string;

  caption?: string;

  figure?: boolean;

}

export interface HtmlForm {

  action?: string;

  method?: string;

  enctype?: string;

  inputs: HtmlInput[];

}

export interface HtmlInput {

  name?: string;

  type?: string;

  value?: string;

  required?: boolean;

  placeholder?: string;

}

export interface HtmlSection {

  id: string;

  heading?: string;

  level: number;

  html: string;

  markdown?: string;

  text: string;

  startOffset: number;

  endOffset: number;

}

export interface TableOfContents {

  items: TocItem[];

}

export interface TocItem {

  id?: string;

  level: number;

  title: string;

  children: TocItem[];

}

export interface HtmlStatistics {

  words: number;

  characters: number;

  paragraphs: number;

  headings: number;

  images: number;

  links: number;

  tables: number;

  codeBlocks: number;

  forms: number;

  estimatedReadingTimeMinutes: number;

}

export interface SchemaOrgData {

  type: string;

  properties: Record<string, unknown>;

}

export interface JsonLdDocument {

  context?: string;

  type?: string;

  data: Record<string, unknown>;

}

export interface SemanticChunk {

  id: string;

  heading?: string;

  level: number;

  markdown: string;

  text: string;

  tokenEstimate: number;

}

export interface ExtractionResult<T> {

  success: boolean;

  data: T;

  warnings: string[];

  errors: string[];

}

export interface HtmlParserPlugin {

  name: string;

  priority?: number;

  supports(
    document: HtmlDocument
  ): boolean;

  transform(
    document: HtmlDocument
  ): Promise<void> | void;

}