/**
 * fetch/types.ts
 *
 * Shared types for the fetch subsystem.
 */

import type { ParsedDocument, ParseResult } from "./parser";

/* -------------------------------------------------------------------------- */
/* HTTP Methods                                                               */
/* -------------------------------------------------------------------------- */

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

/* -------------------------------------------------------------------------- */
/* Response Type                                                              */
/* -------------------------------------------------------------------------- */

export type ResponseType = "auto" | "text" | "json" | "arrayBuffer" | "blob" | "stream";


// interface FetchContext {
//     request: Request;
//     response?: Response;
//     cache?: CacheEntry;
//     parsed?: ParsedDocument;
//     metrics: RequestMetrics;
//     metadata: Map<string, unknown>;
// }

/* -------------------------------------------------------------------------- */
/* Fetch Options                                                              */
/* -------------------------------------------------------------------------- */

export interface FetchOptions {
  method?: HttpMethod;

  headers?: HeadersInit;

  body?: BodyInit | null;

  signal?: AbortSignal;

  timeout?: number;

  followRedirects?: boolean;

  maxRedirects?: number;

  responseType?: ResponseType;

  parse?: boolean;

  cache?: boolean;

  retry?: boolean;

  userAgent?: string;

  referrer?: string;
}

/* -------------------------------------------------------------------------- */
/* Fetch Request                                                              */
/* -------------------------------------------------------------------------- */

export interface FetchRequest {
  url: string;

  options: FetchOptions;
}

/* -------------------------------------------------------------------------- */
/* Fetch Response                                                             */
/* -------------------------------------------------------------------------- */

export interface FetchResult {

  request: FetchRequest;

  response: Response;

  parsed?: ParseResult;

  duration: number;

  fromCache: boolean;

  metrics: FetchMetrics;
}

/* -------------------------------------------------------------------------- */
/* Error                                                                      */
/* -------------------------------------------------------------------------- */

export interface FetchError {
  code: string;

  message: string;

  status?: number;

  cause?: unknown;
}

/* -------------------------------------------------------------------------- */
/* Progress                                                                   */
/* -------------------------------------------------------------------------- */

export interface FetchProgress {
  loaded: number;

  total?: number;

  percentage?: number;
}

/* -------------------------------------------------------------------------- */
/* Timing                                                                     */
/* -------------------------------------------------------------------------- */

export interface FetchTiming {
  startedAt: number;

  endedAt: number;

  duration: number;
}

/* -------------------------------------------------------------------------- */
/* Cache                                                                      */
/* -------------------------------------------------------------------------- */

export interface CacheEntry<T = unknown> {
  key: string;

  value: T;

  createdAt: number;

  expiresAt?: number;

  etag?: string;

  lastModified?: string;

  contentType?: string;

  size?: number;

  metadata?: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/* Cache Options                                                              */
/* -------------------------------------------------------------------------- */

export interface CacheOptions {
  enabled?: boolean;

  ttl?: number;

  maxEntries?: number;

  maxSizeBytes?: number;

  revalidate?: boolean;

  respectCacheControl?: boolean;

  respectETag?: boolean;

  respectLastModified?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Retry                                                                      */
/* -------------------------------------------------------------------------- */

export interface RetryOptions {
  enabled?: boolean;

  retries?: number;

  initialDelay?: number;

  maxDelay?: number;

  factor?: number;

  jitter?: boolean;

  retryOn?: number[];

  retryMethods?: HttpMethod[];
}

/* -------------------------------------------------------------------------- */
/* Retry Context                                                              */
/* -------------------------------------------------------------------------- */

export interface RetryContext {
  attempt: number;

  maxAttempts: number;

  delay: number;

  lastError?: unknown;

  lastStatus?: number;
}

/* -------------------------------------------------------------------------- */
/* Stream                                                                     */
/* -------------------------------------------------------------------------- */

export interface StreamOptions {
  enabled?: boolean;

  chunkSize?: number;

  highWaterMark?: number;

  maxBytes?: number;

  emitProgress?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Download Progress                                                          */
/* -------------------------------------------------------------------------- */

export interface DownloadProgress {
  receivedBytes: number;

  totalBytes?: number;

  percentage?: number;

  chunks: number;

  elapsed: number;

  bytesPerSecond?: number;
}

/* -------------------------------------------------------------------------- */
/* Upload Progress                                                            */
/* -------------------------------------------------------------------------- */

export interface UploadProgress {
  uploadedBytes: number;

  totalBytes?: number;

  percentage?: number;

  elapsed: number;
}

/* -------------------------------------------------------------------------- */
/* Transfer Statistics                                                        */
/* -------------------------------------------------------------------------- */

export interface TransferStatistics {
  requestBytes: number;

  responseBytes: number;

  compressionRatio?: number;

  duration: number;

  averageSpeed?: number;
}
/* -------------------------------------------------------------------------- */
/* Security                                                                   */
/* -------------------------------------------------------------------------- */

export interface SecurityOptions {
  enabled?: boolean;

  allowPrivateNetworks?: boolean;

  allowLocalhost?: boolean;

  allowFileUrls?: boolean;

  allowDataUrls?: boolean;

  allowInsecureTls?: boolean;

  maxContentLength?: number;

  maxRedirects?: number;

  allowedProtocols?: string[];

  blockedHosts?: string[];

  allowedHosts?: string[];

  validateCertificates?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Security Result                                                            */
/* -------------------------------------------------------------------------- */

export interface SecurityResult {
  allowed: boolean;

  reason?: string;

  warnings: string[];

  violations: string[];
}

/* -------------------------------------------------------------------------- */
/* Robots                                                                     */
/* -------------------------------------------------------------------------- */

export interface RobotsOptions {
  enabled?: boolean;

  respectRobotsTxt?: boolean;

  userAgent?: string;

  discoverSitemaps?: boolean;

  crawlDelay?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Robots Rule                                                                */
/* -------------------------------------------------------------------------- */

export interface RobotsRule {
  userAgent: string;

  allow: string[];

  disallow: string[];

  crawlDelay?: number;

  sitemaps: string[];
}

/* -------------------------------------------------------------------------- */
/* Parser                                                                     */
/* -------------------------------------------------------------------------- */

export interface ParserOptions {
  enabled?: boolean;

  readableOnly?: boolean;

  markdown?: boolean;

  preserveHtml?: boolean;

  chunk?: boolean;

  extractMetadata?: boolean;

  extractSchema?: boolean;

  extractLinks?: boolean;

  extractImages?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export type FetchEventType =
  | "request"
  | "response"
  | "retry"
  | "redirect"
  | "cache-hit"
  | "cache-miss"
  | "stream"
  | "progress"
  | "parse"
  | "complete"
  | "error";

/* -------------------------------------------------------------------------- */
/* Fetch Event                                                                */
/* -------------------------------------------------------------------------- */

export interface FetchEvent {
  type: FetchEventType;

  timestamp: number;

  url?: string;

  message?: string;

  data?: unknown;
}

/* -------------------------------------------------------------------------- */
/* Event Hooks                                                                */
/* -------------------------------------------------------------------------- */

export interface FetchHooks {
  beforeRequest?(request: FetchRequest): Promise<void> | void;

  afterResponse?(response: Response): Promise<void> | void;

  beforeParse?(response: Response): Promise<void> | void;

  afterParse?(result: ParseResult): Promise<void> | void;

  onRetry?(context: RetryContext): Promise<void> | void;

  onProgress?(progress: DownloadProgress): Promise<void> | void;

  onError?(error: FetchError): Promise<void> | void;
}

/* -------------------------------------------------------------------------- */
/* Middleware                                                                 */
/* -------------------------------------------------------------------------- */

export interface FetchMiddleware {
  name: string;

  priority?: number;

  execute(
    request: FetchRequest,

    next: () => Promise<FetchResult>
  ): Promise<FetchResult>;
}

/* -------------------------------------------------------------------------- */
/* Metrics                                                                    */
/* -------------------------------------------------------------------------- */

export interface FetchMetrics {
  requests: number;

  successfulRequests: number;

  failedRequests: number;

  cacheHits: number;

  cacheMisses: number;

  retries: number;

  redirects: number;

  bytesDownloaded: number;

  bytesUploaded: number;

  averageResponseTime: number;

  minResponseTime: number;

  maxResponseTime: number;

  totalResponseTime: number;
}

/* -------------------------------------------------------------------------- */
/* Plugins                                                                    */
/* -------------------------------------------------------------------------- */

export interface FetchPlugin {
  readonly name: string;

  readonly version?: string;

  initialize?(): Promise<void> | void;

  destroy?(): Promise<void> | void;

  middleware?(): FetchMiddleware;
}

/* -------------------------------------------------------------------------- */
/* Pipeline                                                                    */
/* -------------------------------------------------------------------------- */

export interface FetchPipeline {
  execute(request: FetchRequest): Promise<FetchResult>;
}

/* -------------------------------------------------------------------------- */
/* Client                                                                      */
/* -------------------------------------------------------------------------- */

export interface FetchClient {
  fetch(
    url: string,

    options?: FetchOptions
  ): Promise<FetchResult>;

  registerPlugin(plugin: FetchPlugin): void;

  unregisterPlugin(name: string): void;

  clearPlugins(): void;
}

/* -------------------------------------------------------------------------- */
/* Configuration                                                               */
/* -------------------------------------------------------------------------- */

export interface FetchConfiguration {
  fetch: FetchOptions;

  retry: RetryOptions;

  cache: CacheOptions;

  parser: ParserOptions;

  security: SecurityOptions;

  robots: RobotsOptions;

  stream: StreamOptions;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

export const DEFAULT_FETCH_CONFIGURATION: FetchConfiguration = {
  fetch: {
    method: "GET",

    timeout: 30000,

    followRedirects: true,

    maxRedirects: 10,

    responseType: "auto",

    parse: true,

    cache: true,

    retry: true
  },

  retry: {
    enabled: true,

    retries: 3,

    initialDelay: 500,

    maxDelay: 5000,

    factor: 2,

    jitter: true,

    retryOn: [
      408,

      425,

      429,

      500,

      502,

      503,

      504
    ],

    retryMethods: [
      "GET",

      "HEAD",

      "OPTIONS"
    ]
  },

  cache: {
    enabled: true,

    ttl: 300000,

    maxEntries: 1000,

    maxSizeBytes: 100 * 1024 * 1024,

    revalidate: true,

    respectCacheControl: true,

    respectETag: true,

    respectLastModified: true
  },

  parser: {
    enabled: true,

    readableOnly: false,

    markdown: true,

    preserveHtml: false,

    chunk: true,

    extractMetadata: true,

    extractSchema: true,

    extractLinks: true,

    extractImages: true
  },

  security: {
    enabled: true,

    allowPrivateNetworks: false,

    allowLocalhost: false,

    allowFileUrls: false,

    allowDataUrls: false,

    allowInsecureTls: false,

    validateCertificates: true,

    maxContentLength: 50 * 1024 * 1024,

    maxRedirects: 10,

    allowedProtocols: [
      "http",

      "https"
    ],

    blockedHosts: [],

    allowedHosts: []
  },

  robots: {
    enabled: true,

    respectRobotsTxt: true,

    discoverSitemaps: true,

    crawlDelay: true,

    userAgent: "FloralSurfBot/1.0"
  },

  stream: {
    enabled: true,

    chunkSize: 64 * 1024,

    highWaterMark: 16,

    emitProgress: true
  }
};

/* -------------------------------------------------------------------------- */
/* Service                                                                     */
/* -------------------------------------------------------------------------- */

export interface FetchService extends FetchClient {
  readonly configuration: FetchConfiguration;

  readonly metrics: FetchMetrics;

  resetMetrics(): void;
}

/* -------------------------------------------------------------------------- */
/* Export Bundle                                                               */
/* -------------------------------------------------------------------------- */

export default {
  DEFAULT_FETCH_CONFIGURATION
};
