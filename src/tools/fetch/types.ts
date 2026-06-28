/**
 * fetch/types.ts
 *
 * Shared types for the Fetch subsystem.
 *
 * All other fetch modules should import from here.
 */

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type ResponseKind =
  | "text"
  | "html"
  | "markdown"
  | "json"
  | "xml"
  | "rss"
  | "atom"
  | "csv"
  | "yaml"
  | "pdf"
  | "image"
  | "binary"
  | "unknown";

export interface FetchRequest {
  url: string;

  method?: HttpMethod;

  headers?: Record<string, string>;

  /**
   * Query parameters appended to URL.
   */
  query?: Record<string, string | number | boolean>;

  /**
   * JSON, text, FormData, Blob...
   */
  body?: BodyInit | object | null;

  timeoutMs?: number;

  maxRedirects?: number;

  maxRetries?: number;

  maxResponseBytes?: number;

  userAgent?: string;

  followRedirects?: boolean;

  allowPrivateNetwork?: boolean;

  cache?: CacheOptions;

  retry?: RetryOptions;

  security?: SecurityPolicy;

  stream?: StreamOptions;
}

export interface FetchResponse {

  ok: boolean;

  status: number;

  statusText: string;

  url: string;

  redirected: boolean;

  redirects: string[];

  durationMs: number;

  size: number;

  contentType: string;

  charset?: string;

  encoding?: string;

  headers: Record<string, string>;

  body: string;

  parsed?: ParsedContent;

  metadata?: ResponseMetadata;
}

export interface ResponseMetadata {

  fetchedAt: Date;

  etag?: string;

  lastModified?: string;

  cacheControl?: string;

  expires?: string;

  server?: string;

  via?: string;
}

interface ParsedContent {

    type: ResponseKind;

    title?: string;

    description?: string;

    language?: string;

    author?: string;

    published?: Date;

    summary?: string;

    text?: string;

    markdown?: string;

    html?: string;

    json?: unknown;

    links?: ExtractedLink[];

    images?: ExtractedImage[];

    tables?: ParsedTable[];

    headings?: Heading[];

    codeBlocks?: CodeBlock[];

    metadata?: Record<string, unknown>;

    chunks?: ParsedChunk[];

    keywords?: string[];

}

export interface ParsedChunk {

  type: "text" | "heading" | "link" | "image" | "code" | "table";

  content: string;

  metadata?: Record<string, unknown>;
}

export interface Heading {

  level: number;

  text: string;

  id?: string;
}

export interface CodeBlock {

  language?: string;

  code: string;
}

export interface ParsedTable {

  headers: string[];

  rows: string[][];
}

export interface ExtractedLink {

  href: string;

  text: string;

  rel?: string;

  title?: string;

  internal: boolean;
}

export interface ExtractedImage {

  src: string;

  alt?: string;

  width?: number;

  height?: number;
}

export interface RetryOptions {

  enabled?: boolean;

  maxAttempts?: number;

  initialDelayMs?: number;

  maxDelayMs?: number;

  multiplier?: number;

  retryOnStatus?: number[];

  retryOnNetworkError?: boolean;
}

export interface CacheOptions {

  enabled?: boolean;

  ttlSeconds?: number;

  namespace?: string;

  useETag?: boolean;

  useLastModified?: boolean;

  revalidate?: boolean;

  staleWhileRevalidate?: boolean;

  maxEntries?: number;

}

export interface StreamOptions {

  enabled?: boolean;

  chunkSize?: number;

  onChunk?: (chunk: Uint8Array) => Promise<void> | void;
}

export interface SecurityPolicy {
  allowedHosts?: string[];

  blockedHosts?: string[];

  allowedPorts?: number[];

  blockedPorts?: number[];

  allowedProtocols?: ("http" | "https")[];

  allowLocalhost?: boolean;

  allowPrivateIPs?: boolean;

  allowIPv6?: boolean;

  validateTLS?: boolean;

  maxRedirects?: number;

  maxHostnameLength?: number;

  maxUrlLength?: number;
}

export interface RobotsRule {
  allowed: boolean;
  crawlDelay?: number;
  matchedRule?: string;
}

export interface RobotsFile {
  url: string;
  fetchedAt: Date;
  sitemaps: string[];
  groups: RobotsGroup[];
}

export interface RobotsGroup {
  userAgents: string[];
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
}

export interface ReadabilityResult {

    title: string;

    byline: string;

    excerpt: string;

    language: string;

    content: string;

    markdown: string;

    textContent: string;

    length: number;

    wordCount: number;

    readingTimeMinutes: number;

}

export interface PdfExtractionResult {

  pages: number;

  title?: string;

  author?: string;

  subject?: string;

  creator?: string;

  producer?: string;

  createdAt?: Date;

  modifiedAt?: Date;

  text: string;
}

export interface FetchMetrics {

  dnsLookupMs?: number;

  tcpConnectMs?: number;

  tlsHandshakeMs?: number;

  requestMs?: number;

  firstByteMs?: number;

  downloadMs?: number;

  totalMs: number;
}

export interface CachedResponse {

  key: string;

  expiresAt: Date;

  response: FetchResponse;
}

export enum FetchErrorCode {

  INVALID_URL = "INVALID_URL",

  BLOCKED_HOST = "BLOCKED_HOST",

  PRIVATE_NETWORK = "PRIVATE_NETWORK",

  TIMEOUT = "TIMEOUT",

  NETWORK_ERROR = "NETWORK_ERROR",

  RESPONSE_TOO_LARGE = "RESPONSE_TOO_LARGE",

  INVALID_CONTENT = "INVALID_CONTENT",

  TOO_MANY_REDIRECTS = "TOO_MANY_REDIRECTS",

  ROBOTS_DISALLOWED = "ROBOTS_DISALLOWED",

  PARSER_ERROR = "PARSER_ERROR",

  PDF_ERROR = "PDF_ERROR",

  UNKNOWN = "UNKNOWN",
}

export class FetchError extends Error {

  constructor(
    public readonly code: FetchErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FetchError";
  }
}

export const DEFAULT_TIMEOUT_MS = 30_000;

export const DEFAULT_MAX_RESPONSE_BYTES = 25 * 1024 * 1024;

export const DEFAULT_MAX_REDIRECTS = 10;

export const DEFAULT_USER_AGENT =
  "Cloudflare-Agent/1.0";

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  enabled: true,
  maxAttempts: 3,
  initialDelayMs: 250,
  maxDelayMs: 5_000,
  multiplier: 2,
  retryOnNetworkError: true,
  retryOnStatus: [429, 500, 502, 503, 504],
};

