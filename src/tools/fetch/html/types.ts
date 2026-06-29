/**
 * html/types.ts
 *
 * Shared types for the HTML parsing subsystem.
 */

/* -------------------------------------------------------------------------- */
/*                               Shared Extracted Types                       */
/* -------------------------------------------------------------------------- */

export interface ExtractedLink {
  href: string;

  text: string;

  title?: string;

  rel?: string;

  target?: string;

  download?: boolean;

  noFollow?: boolean;

  external: boolean;

  internal: boolean;

  anchor: boolean;
}

export interface ExtractedImage {
  src: string;

  alt?: string;

  width?: number;

  height?: number;

  loading?: string;

  decoding?: string;
}

export interface Heading {
  id: string;

  level: number;

  text: string;
}

export interface CodeBlock {
  language?: string;

  code: string;
}

export interface ParsedTable {
  headers: string[];

  rows: string[][];

  caption?: string;
}

/* -------------------------------------------------------------------------- */
/*                               Parser Options                               */
/* -------------------------------------------------------------------------- */

export interface HtmlParseOptions {
  /**
   * Enable Mozilla Readability.
   */
  readability?: boolean;

  /**
   * Convert HTML → Markdown.
   */
  markdown?: boolean;

  /**
   * Clean DOM before extraction.
   */
  sanitize?: boolean;

  /**
   * Extract Schema.org.
   */
  schema?: boolean;

  /**
   * Extract OpenGraph metadata.
   */
  openGraph?: boolean;

  /**
   * Extract Twitter Cards.
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
   * Extract hyperlinks.
   */
  links?: boolean;

  /**
   * Extract HTML forms.
   */
  forms?: boolean;

  /**
   * Extract fenced code blocks.
   */
  codeBlocks?: boolean;

  /**
   * Build semantic sections.
   */
  sections?: boolean;

  /**
   * Build Table of Contents.
   */
  toc?: boolean;

  /**
   * Generate semantic chunks.
   */
  chunking?: boolean;

  /**
   * Preserve original HTML.
   */
  preserveHtml?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                             Fingerprinting                                 */
/* -------------------------------------------------------------------------- */

export interface HtmlFingerprint {
  /**
   * Stable document identifier.
   */
  document: string;

  /**
   * Plain text fingerprint.
   */
  content: string;

  /**
   * Markdown fingerprint.
   */
  markdown: string;

  /**
   * Clean HTML fingerprint.
   */
  html: string;

  /**
   * DOM structure fingerprint.
   */
  dom: string;

  /**
   * Metadata fingerprint.
   */
  metadata: string;
}

/* -------------------------------------------------------------------------- */
/*                               HTML Document                                */
/* -------------------------------------------------------------------------- */

export interface HtmlDocument {
  /* ---------------------------- Source Info ---------------------------- */

  url?: string;

  canonical?: string;

  language?: string;

  charset?: string;

  /* ----------------------------- Metadata ----------------------------- */

  title?: string;

  description?: string;

  author?: string;

  siteName?: string;

  favicon?: string;

  /* ------------------------------ Content ----------------------------- */

  html: string;

  cleanHtml?: string;

  markdown?: string;

  text: string;

  /* ----------------------------- Parsed ------------------------------- */

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

  jsonLd: JsonLdDocument[];

  /* -------------------------- Analytics ------------------------------- */

  statistics: HtmlStatistics;

  fingerprint: HtmlFingerprint;
}
/* -------------------------------------------------------------------------- */
/*                               Metadata                                     */
/* -------------------------------------------------------------------------- */

export interface HtmlMetadata {
  title?: string;

  description?: string;

  keywords?: string[];

  author?: string;

  publisher?: string;

  language?: string;

  charset?: string;

  canonical?: string;

  favicon?: string;

  robots?: string;

  generator?: string;

  viewport?: string;

  themeColor?: string;

  openGraph?: OpenGraphMetadata;

  twitter?: TwitterCardMetadata;

  /**
   * Any additional meta tags that don't have
   * first-class properties.
   */
  custom: Record<string, string>;

  /**
   * JSON-LD object or raw string for schema markup
   */
  schema?: SchemaOrgData[];

  siteName?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Open Graph                                    */
/* -------------------------------------------------------------------------- */

export interface OpenGraphMetadata {
  title?: string;

  description?: string;

  image?: string;

  url?: string;

  type?: string;

  siteName?: string;

  locale?: string;

  audio?: string;

  video?: string;
}

/* -------------------------------------------------------------------------- */
/*                             Twitter Cards                                  */
/* -------------------------------------------------------------------------- */

export interface TwitterCardMetadata {
  card?: string;

  title?: string;

  description?: string;

  image?: string;

  site?: string;

  creator?: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Images                                    */
/* -------------------------------------------------------------------------- */

export interface HtmlImage extends ExtractedImage {
  width?: number;

  height?: number;

  loading?: string;

  decoding?: string;

  title?: string;

  caption?: string;

  figure?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                   Forms                                    */
/* -------------------------------------------------------------------------- */

export interface HtmlForm {
  action?: string;

  method?: string;

  enctype?: string;

  id?: string;

  name?: string;

  autocomplete?: string;

  inputs: HtmlInput[];
}

export interface HtmlInput {
  name?: string;

  type?: string;

  value?: string;

  label?: string;

  placeholder?: string;

  required?: boolean;

  disabled?: boolean;

  readonly?: boolean;

  checked?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                Sections                                    */
/* -------------------------------------------------------------------------- */

export interface HtmlSection {
  id: string;

  heading?: string;

  level: number;

  html: string;

  markdown?: string;

  text: string;

  startOffset: number;

  endOffset: number;

  tokenEstimate?: number;

  fingerprint?: string;
}

/* -------------------------------------------------------------------------- */
/*                            Table Of Contents                               */
/* -------------------------------------------------------------------------- */

export interface TableOfContents {
  items: TocItem[];

  maxDepth: number;

  totalItems: number;
}

export interface TocItem {
  id?: string;

  level: number;

  title: string;

  anchor?: string;

  index: number;

  children: TocItem[];
}

/* -------------------------------------------------------------------------- */
/*                              Statistics                                    */
/* -------------------------------------------------------------------------- */

export interface HtmlStatistics {
  /* ---------- Text ---------- */

  words: number;

  uniqueWords: number;

  sentences: number;

  paragraphs: number;

  characters: number;

  averageWordLength: number;

  averageSentenceLength: number;

  averageParagraphLength: number;

  longestWord: string;

  estimatedReadingTimeMinutes: number;

  lexicalDensity: number;

  /* ---------- Structure ---------- */

  headings: number;

  images: number;

  links: number;

  tables: number;

  forms: number;

  codeBlocks: number;

  sectionCount: number;

  tocDepth: number;

  /* ---------- Density ---------- */

  imageDensity: number;

  linkDensity: number;

  tableDensity: number;

  /* ---------- Presence ---------- */

  hasImages: boolean;

  hasTables: boolean;

  hasForms: boolean;

  hasCodeBlocks: boolean;

  hasJsonLd: boolean;

  empty: boolean;

  /* ---------- Fingerprints ---------- */

  contentHash?: string;

  markdownHash?: string;

  htmlHash?: string;

  metadataHash?: string;

  domHash?: string;
}

/* -------------------------------------------------------------------------- */
/*                          Semantic Chunk                                    */
/* -------------------------------------------------------------------------- */

export interface SemanticChunk {
  id: string;

  heading?: string;

  level: number;

  markdown: string;

  html?: string;

  text: string;

  startOffset: number;

  endOffset: number;

  tokenEstimate: number;

  fingerprint?: string;

  metadata?: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/*                           Extraction Result                                */
/* -------------------------------------------------------------------------- */

export interface ExtractionResult<T> {
  success: boolean;

  data: T;

  warnings: string[];

  errors: string[];

  durationMs?: number;
}

/* -------------------------------------------------------------------------- */
/*                              Plugin API                                    */
/* -------------------------------------------------------------------------- */

export interface HtmlParserPlugin {
  /**
   * Unique plugin name.
   */
  name: string;

  /**
   * Execution priority.
   *
   * Lower runs first.
   */
  priority?: number;

  /**
   * Determine if the plugin should execute.
   */
  supports(document: HtmlDocument): boolean;

  /**
   * Transform parsed document.
   */
  transform(document: HtmlDocument): Promise<void> | void;
}

/* -------------------------------------------------------------------------- */
/*                              Schema.org                                    */
/* -------------------------------------------------------------------------- */

export interface SchemaOrgData {
  /**
   * Schema.org @type
   */
  type: string;

  /**
   * Raw Schema.org object.
   */
  properties: Record<string, unknown>;

  schema?: SchemaOrgData[];
}

/* -------------------------------------------------------------------------- */
/*                              JSON-LD                                       */
/* -------------------------------------------------------------------------- */

export interface JsonLdDocument {
  context?: string;

  type?: string;

  id?: string;

  graph?: Record<string, unknown>[];

  data: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/*                               Assets                                       */
/* -------------------------------------------------------------------------- */

export type HtmlAssetType =
  | "image"
  | "video"
  | "audio"
  | "stylesheet"
  | "script"
  | "font"
  | "document"
  | "other";

export interface HtmlAsset {
  type: HtmlAssetType;

  url: string;

  mimeType?: string;

  size?: number;

  integrity?: string;

  crossorigin?: string;

  referrerPolicy?: string;
}

/* -------------------------------------------------------------------------- */
/*                                Links                                       */
/* -------------------------------------------------------------------------- */

export interface HtmlLink {
  href: string;

  text: string;

  title?: string;

  rel?: string;

  target?: string;

  download?: boolean;

  noFollow?: boolean;

  external: boolean;

  internal: boolean;

  anchor: boolean;
}

/* -------------------------------------------------------------------------- */
/*                           Document Language                                */
/* -------------------------------------------------------------------------- */

export interface DocumentLanguage {
  code: string;

  confidence: number;

  detectedBy: "html" | "meta" | "content" | "unknown";
}

/* -------------------------------------------------------------------------- */
/*                           Parser Context                                   */
/* -------------------------------------------------------------------------- */

export interface ParserContext {
  url?: string;

  contentType?: string;

  fetchedAt?: Date;

  encoding?: string;

  source?: "fetch" | "browser" | "cache" | "memory";
}

/* -------------------------------------------------------------------------- */
/*                             Parser Metrics                                 */
/* -------------------------------------------------------------------------- */

export interface ParserMetrics {
  parseTimeMs: number;

  cleanupTimeMs: number;

  metadataTimeMs: number;

  extractionTimeMs: number;

  statisticsTimeMs: number;

  fingerprintTimeMs: number;

  totalTimeMs: number;
}

/* -------------------------------------------------------------------------- */
/*                             Parser Result                                  */
/* -------------------------------------------------------------------------- */

export interface HtmlParserResult {
  document: HtmlDocument;

  metrics: ParserMetrics;
}

/* -------------------------------------------------------------------------- */
/*                           Parser Plugin Context                            */
/* -------------------------------------------------------------------------- */

export interface HtmlParserPluginContext {
  parserVersion: string;

  options: HtmlParseOptions;

  metrics: ParserMetrics;
}

export interface HtmlParserPlugin {
  /**
   * Unique plugin identifier.
   */
  name: string;

  /**
   * Lower numbers execute first.
   */
  priority?: number;

  /**
   * Determine if this plugin should execute.
   */
  supports(document: HtmlDocument): boolean;

  /**
   * Modify the parsed document.
   */
  transform(
    document: HtmlDocument,
    context: HtmlParserPluginContext
  ): Promise<void> | void;
}
