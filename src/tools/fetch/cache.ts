/**
 * fetch/cache.ts
 *
 * HTTP cache implementation.
 *
 * Supports:
 *
 * • Memory cache
 * • LRU eviction
 * • TTL
 * • RFC9111 cache semantics
 * * ETag / Last-Modified
 * • Pluggable storage backends
 */

import type { CacheEntry, CacheOptions } from "./types";

/* -------------------------------------------------------------------------- */
/* Storage Interface                                                          */
/* -------------------------------------------------------------------------- */

export interface CacheStorage {
  get<T = unknown>(key: string): Promise<CacheEntry<T> | undefined>;

  set<T = unknown>(
    key: string,

    entry: CacheEntry<T>
  ): Promise<void>;

  delete(key: string): Promise<boolean>;

  clear(): Promise<void>;

  keys(): Promise<string[]>;

  size(): Promise<number>;
}

/* -------------------------------------------------------------------------- */
/* Memory Storage                                                             */
/* -------------------------------------------------------------------------- */

export class MemoryCacheStorage implements CacheStorage {
  protected readonly store = new Map<string, CacheEntry>();

  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    return this.store.get(key) as CacheEntry<T> | undefined;
  }

  async set<T>(
    key: string,

    entry: CacheEntry<T>
  ): Promise<void> {
    this.store.set(
      key,

      entry
    );
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async keys(): Promise<string[]> {
    return [...this.store.keys()];
  }

  async size(): Promise<number> {
    return this.store.size;
  }
}

/* -------------------------------------------------------------------------- */
/* Cache Metrics                                                              */
/* -------------------------------------------------------------------------- */

export interface CacheMetrics {
  hits: number;

  misses: number;

  writes: number;

  evictions: number;

  expirations: number;
}

/* -------------------------------------------------------------------------- */
/* Cache Manager                                                              */
/* -------------------------------------------------------------------------- */

export class CacheManager {
  readonly metrics: CacheMetrics = {
    hits: 0,

    misses: 0,

    writes: 0,

    evictions: 0,

    expirations: 0
  };

  constructor(
    readonly storage: CacheStorage = new MemoryCacheStorage(),

    readonly options: CacheOptions = {}
  ) {}

  /* ---------------------------------------------------------------------- */
  /* Lookup                                                                 */
  /* ---------------------------------------------------------------------- */

  async get<T = unknown>(key: string): Promise<CacheEntry<T> | undefined> {
    const entry = await this.storage.get<T>(key);

    if (!entry) {
      this.metrics.misses++;

      return;
    }

    if (isExpired(entry)) {
      this.metrics.expirations++;

      this.metrics.misses++;

      await this.storage.delete(key);

      return;
    }

    /*
     * LRU touch
     */

    await this.storage.delete(key);

    await this.storage.set(
      key,

      entry
    );

    this.metrics.hits++;

    return entry;
  }

  /* ---------------------------------------------------------------------- */
  /* Insert                                                                 */
  /* ---------------------------------------------------------------------- */

  async set<T>(
    key: string,

    value: T,

    ttl?: number,

    metadata?: Record<string, unknown>
  ): Promise<void> {
    const expiresAt = ttl !== undefined ? Date.now() + ttl : undefined;

    const entry: CacheEntry<T> = {
      key,

      value,

      createdAt: Date.now(),

      expiresAt,

      metadata
    };

    await this.storage.set(
      key,

      entry
    );

    this.metrics.writes++;

    await this.prune();
  }

  /* ---------------------------------------------------------------------- */
  /* Delete                                                                 */
  /* ---------------------------------------------------------------------- */

  async delete(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  /* ---------------------------------------------------------------------- */
  /* Clear                                                                  */
  /* ---------------------------------------------------------------------- */

  async clear(): Promise<void> {
    await this.storage.clear();
  }

  /* ---------------------------------------------------------------------- */
  /* Keys                                                                   */
  /* ---------------------------------------------------------------------- */

  async keys(): Promise<string[]> {
    return this.storage.keys();
  }

  /* ---------------------------------------------------------------------- */
  /* Size                                                                   */
  /* ---------------------------------------------------------------------- */

  async size(): Promise<number> {
    return this.storage.size();
  }

  /* ---------------------------------------------------------------------- */
  /* Exists                                                                 */
  /* ---------------------------------------------------------------------- */

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined;
  }

  /* ---------------------------------------------------------------------- */
  /* Prune                                                                  */
  /* ---------------------------------------------------------------------- */

  async prune(): Promise<void> {
    const maxEntries = this.options.maxEntries;

    if (!maxEntries) {
      return;
    }

    while ((await this.storage.size()) > maxEntries) {
      const keys = await this.storage.keys();

      const oldest = keys[0];

      if (!oldest) {
        break;
      }

      await this.storage.delete(oldest);

      this.metrics.evictions++;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Statistics                                                             */
  /* ---------------------------------------------------------------------- */

  getMetrics(): CacheMetrics {
    return {
      ...this.metrics
    };
  }

  resetMetrics(): void {
    this.metrics.hits = 0;

    this.metrics.misses = 0;

    this.metrics.writes = 0;
    this.metrics.evictions = 0;
    this.metrics.expirations = 0;
  }
}

/* -------------------------------------------------------------------------- */
/* Default Instance                                                           */
/* -------------------------------------------------------------------------- */

export const cacheManager = new CacheManager();

/* -------------------------------------------------------------------------- */
/* Expiration                                                                 */
/* -------------------------------------------------------------------------- */

function isExpired(entry: CacheEntry): boolean {
  return entry.expiresAt !== undefined && Date.now() >= entry.expiresAt;
}

/* -------------------------------------------------------------------------- */
/* Cache-Control                                                              */
/* -------------------------------------------------------------------------- */

export interface CacheControl {
  maxAge?: number;

  sMaxAge?: number;

  staleWhileRevalidate?: number;

  staleIfError?: number;

  immutable: boolean;

  noCache: boolean;

  noStore: boolean;

  private: boolean;

  public: boolean;

  mustRevalidate: boolean;
}

export function parseCacheControl(header?: string | null): CacheControl {
  const control: CacheControl = {
    immutable: false,

    noCache: false,

    noStore: false,

    private: false,

    public: false,

    mustRevalidate: false
  };

  if (!header) {
    return control;
  }

  for (const directive of header

    .split(",")

    .map((value) => value.trim())) {
    const [
      key,

      rawValue
    ] = directive.split("=");

    const value = rawValue?.trim();

    switch (key.toLowerCase()) {
      case "max-age":
        control.maxAge = Number(value);

        break;

      case "s-maxage":
        control.sMaxAge = Number(value);

        break;

      case "stale-while-revalidate":
        control.staleWhileRevalidate = Number(value);

        break;

      case "stale-if-error":
        control.staleIfError = Number(value);

        break;

      case "immutable":
        control.immutable = true;

        break;

      case "no-cache":
        control.noCache = true;

        break;

      case "no-store":
        control.noStore = true;

        break;

      case "private":
        control.private = true;

        break;

      case "public":
        control.public = true;

        break;

      case "must-revalidate":
        control.mustRevalidate = true;

        break;
    }
  }

  return control;
}

/* -------------------------------------------------------------------------- */
/* Cacheability                                                               */
/* -------------------------------------------------------------------------- */

export function isCacheable(response: Response): boolean {
  if (response.status !== 200) {
    return false;
  }

  const control = parseCacheControl(response.headers.get("cache-control"));

  if (control.noStore) {
    return false;
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/* Expiration                                                                 */
/* -------------------------------------------------------------------------- */

export function computeExpiration(response: Response): number | undefined {
  const control = parseCacheControl(response.headers.get("cache-control"));

  if (control.maxAge !== undefined) {
    return Date.now() + control.maxAge * 1000;
  }

  const expires = response.headers.get("expires");

  if (expires) {
    const value = Date.parse(expires);

    if (!Number.isNaN(value)) {
      return value;
    }
  }

  return;
}

/* -------------------------------------------------------------------------- */
/* Validators                                                                 */
/* -------------------------------------------------------------------------- */

export function extractValidators(
  response: Response
): Pick<CacheEntry, "etag" | "lastModified"> {
  return {
    etag: response.headers.get("etag") ?? undefined,

    lastModified: response.headers.get("last-modified") ?? undefined
  };
}

/* -------------------------------------------------------------------------- */
/* Conditional Headers                                                        */
/* -------------------------------------------------------------------------- */

export function createConditionalHeaders(entry: CacheEntry): Headers {
  const headers = new Headers();

  if (entry.etag) {
    headers.set(
      "If-None-Match",

      entry.etag
    );
  }

  if (entry.lastModified) {
    headers.set(
      "If-Modified-Since",

      entry.lastModified
    );
  }

  return headers;
}

/* -------------------------------------------------------------------------- */
/* 304 Handling                                                               */
/* -------------------------------------------------------------------------- */

export function refreshEntry(
  entry: CacheEntry,

  response: Response
): CacheEntry {
  return {
    ...entry,

    expiresAt: computeExpiration(response),

    etag: response.headers.get("etag") ?? entry.etag,

    lastModified: response.headers.get("last-modified") ?? entry.lastModified
  };
}

/* -------------------------------------------------------------------------- */
/* Stale Detection                                                            */
/* -------------------------------------------------------------------------- */

export function isStale(entry: CacheEntry): boolean {
  if (entry.expiresAt === undefined) {
    return false;
  }

  return Date.now() >= entry.expiresAt;
}

/* -------------------------------------------------------------------------- */
/* Stale-While-Revalidate                                                     */
/* -------------------------------------------------------------------------- */

export function canServeStale(
  entry: CacheEntry,

  response?: Response
): boolean {
  const control = parseCacheControl(
    response?.headers.get("cache-control") ?? ""
  );

  if (!isStale(entry)) {
    return true;
  }

  if (control.staleWhileRevalidate === undefined) {
    return false;
  }

  return (
    Date.now() <= (entry.expiresAt ?? 0) + control.staleWhileRevalidate * 1000
  );
}

/* -------------------------------------------------------------------------- */
/* Stale-If-Error                                                             */
/* -------------------------------------------------------------------------- */

export function canServeStaleOnError(
  entry: CacheEntry,

  response?: Response
): boolean {
  const control = parseCacheControl(
    response?.headers.get("cache-control") ?? ""
  );

  if (control.staleIfError === undefined) {
    return false;
  }

  return Date.now() <= (entry.expiresAt ?? 0) + control.staleIfError * 1000;
}

/* -------------------------------------------------------------------------- */
/* Revalidation Queue                                                         */
/* -------------------------------------------------------------------------- */

type RevalidationHandler = () => Promise<void>;

const revalidationQueue = new Map<string, Promise<void>>();

/* -------------------------------------------------------------------------- */
/* Background Revalidation                                                    */
/* -------------------------------------------------------------------------- */

export async function revalidateInBackground(
  key: string,

  handler: RevalidationHandler
): Promise<void> {
  if (revalidationQueue.has(key)) {
    return revalidationQueue.get(key)!;
  }

  const promise = (async () => {
    try {
      await handler();
    } finally {
      revalidationQueue.delete(key);
    }
  })();

  revalidationQueue.set(
    key,

    promise
  );

  return promise;
}

/* -------------------------------------------------------------------------- */
/* Conditional Fetch                                                          */
/* -------------------------------------------------------------------------- */

export async function revalidateEntry(
  entry: CacheEntry,

  request: (headers: Headers) => Promise<Response>
): Promise<{
  entry: CacheEntry;

  response?: Response;

  revalidated: boolean;
}> {
  const headers = createConditionalHeaders(entry);

  const response = await request(headers);

  /*
   * Resource not modified.
   */

  if (response.status === 304) {
    return {
      entry: refreshEntry(
        entry,

        response
      ),

      revalidated: true
    };
  }

  return {
    entry,

    response,

    revalidated: false
  };
}

/* -------------------------------------------------------------------------- */
/* Cache Refresh                                                              */
/* -------------------------------------------------------------------------- */

export async function refreshCacheEntry<T>(
  manager: CacheManager,

  key: string,

  value: T,

  response: Response
): Promise<void> {
  await manager.set(
    key,

    value,

    computeExpiration(response)
      ? computeExpiration(response)! - Date.now()
      : undefined,

    {
      etag: response.headers.get("etag") ?? undefined,

      lastModified: response.headers.get("last-modified") ?? undefined,

      cacheControl: parseCacheControl(response.headers.get("cache-control"))
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Cleanup                                                                    */
/* -------------------------------------------------------------------------- */

export function pendingRevalidations(): number {
  return revalidationQueue.size;
}

/* -------------------------------------------------------------------------- */
/* Memory Usage                                                               */
/* -------------------------------------------------------------------------- */

export async function estimateCacheSize(
  storage: CacheStorage
): Promise<number> {
  let total = 0;

  const keys = await storage.keys();

  for (const key of keys) {
    const entry = await storage.get(key);

    if (!entry) {
      continue;
    }

    total += JSON.stringify(entry).length;
  }

  return total;
}

/* -------------------------------------------------------------------------- */
/* Expired Entry Cleanup                                                      */
/* -------------------------------------------------------------------------- */

export async function removeExpiredEntries(
  storage: CacheStorage
): Promise<number> {
  let removed = 0;

  const keys = await storage.keys();

  for (const key of keys) {
    const entry = await storage.get(key);

    if (!entry) {
      continue;
    }

    if (isExpired(entry)) {
      await storage.delete(key);

      removed++;
    }
  }

  return removed;
}

/* -------------------------------------------------------------------------- */
/* Storage Adapter                                                            */
/* -------------------------------------------------------------------------- */

export abstract class PersistentCacheStorage implements CacheStorage {
  abstract get<T>(key: string): Promise<CacheEntry<T> | undefined>;

  abstract set<T>(
    key: string,

    entry: CacheEntry<T>
  ): Promise<void>;

  abstract delete(key: string): Promise<boolean>;

  abstract clear(): Promise<void>;

  abstract keys(): Promise<string[]>;

  abstract size(): Promise<number>;

  async compact(): Promise<void> {
    // optional
  }

  async flush(): Promise<void> {
    // optional
  }
}

/* -------------------------------------------------------------------------- */
/* Cache Statistics                                                           */
/* -------------------------------------------------------------------------- */

export interface CacheStatistics extends CacheMetrics {
  entries: number;

  estimatedSize: number;
}

/* -------------------------------------------------------------------------- */
/* Statistics                                                                 */
/* -------------------------------------------------------------------------- */

export async function collectCacheStatistics(
  manager: CacheManager
): Promise<CacheStatistics> {
  return {
    ...manager.getMetrics(),

    entries: await manager.size(),

    estimatedSize: await estimateCacheSize(manager.storage)
  };
}

/* -------------------------------------------------------------------------- */
/* Cache Maintenance                                                          */
/* -------------------------------------------------------------------------- */

export async function compactCache(manager: CacheManager): Promise<void> {
  await removeExpiredEntries(manager.storage);

  if (manager.storage instanceof PersistentCacheStorage) {
    await manager.storage.compact();
  }
}

/* -------------------------------------------------------------------------- */
/* Persistence                                                                */
/* -------------------------------------------------------------------------- */

export async function flushCache(manager: CacheManager): Promise<void> {
  if (manager.storage instanceof PersistentCacheStorage) {
    await manager.storage.flush();
  }
}

/* -------------------------------------------------------------------------- */
/* Cache Factory                                                              */
/* -------------------------------------------------------------------------- */

export function createCacheManager(
  storage?: CacheStorage,

  options?: CacheOptions
): CacheManager {
  return new CacheManager(
    storage ?? new MemoryCacheStorage(),

    options
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export async function remember<T>(
  manager: CacheManager,

  key: string,

  factory: () => Promise<T>,

  ttl?: number
): Promise<T> {
  const cached = await manager.get<T>(key);

  if (cached) {
    return cached.value;
  }

  const value = await factory();

  await manager.set(
    key,

    value,

    ttl
  );

  return value;
}

/* -------------------------------------------------------------------------- */
/* Singleton Helpers                                                          */
/* -------------------------------------------------------------------------- */

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  return (await cacheManager.get<T>(key))?.value;
}

export async function cacheSet<T>(
  key: string,

  value: T,

  ttl?: number,

  metadata?: Record<string, unknown>
): Promise<void> {
  await cacheManager.set(
    key,

    value,

    ttl,

    metadata
  );
}

export async function cacheDelete(key: string): Promise<boolean> {
  return cacheManager.delete(key);
}

export async function cacheClear(): Promise<void> {
  await cacheManager.clear();
}

export async function cacheHas(key: string): Promise<boolean> {
  return cacheManager.has(key);
}

/* -------------------------------------------------------------------------- */
/* HTTP Helpers                                                               */
/* -------------------------------------------------------------------------- */

export async function cacheResponse(
  key: string,

  response: Response,

  body: ArrayBuffer | string
): Promise<void> {
  if (!isCacheable(response)) {
    return;
  }

  const expiresAt = computeExpiration(response);

  await cacheManager.set(
    key,

    body,

    expiresAt ? expiresAt - Date.now() : undefined,

    {
      url: response.url,

      status: response.status,

      etag: response.headers.get("etag") ?? undefined,

      lastModified: response.headers.get("last-modified") ?? undefined,

      cacheControl: parseCacheControl(response.headers.get("cache-control")),

      contentType: response.headers.get("content-type") ?? undefined
    }
  );
}

export async function getCachedResponse<T>(
  key: string
): Promise<CacheEntry<T> | undefined> {
  return cacheManager.get<T>(key);
}

/* -------------------------------------------------------------------------- */
/* Maintenance                                                                */
/* -------------------------------------------------------------------------- */

export async function cleanupCache(): Promise<void> {
  await compactCache(cacheManager);
}

export async function cacheStatistics() {
  return collectCacheStatistics(cacheManager);
}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {
  CacheManager,

  MemoryCacheStorage,

  PersistentCacheStorage,

  cacheManager,

  createCacheManager,

  remember,

  cacheGet,

  cacheSet,

  cacheDelete,

  cacheHas,

  cacheClear,

  cacheResponse,

  getCachedResponse,

  cleanupCache,

  cacheStatistics,

  estimateCacheSize,

  removeExpiredEntries,

  compactCache,

  flushCache,

  parseCacheControl,

  computeExpiration,

  createConditionalHeaders,

  refreshEntry,

  refreshCacheEntry,

  revalidateEntry,

  revalidateInBackground,

  pendingRevalidations,

  isCacheable,

  isExpired,

  isStale,

  canServeStale,

  canServeStaleOnError
};
