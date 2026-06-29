/**
 * fetch/robots.ts
 *
 * robots.txt implementation.
 *
 * RFC 9309 compliant parser with
 * caching and rule evaluation.
 */

import type { RobotsOptions, RobotsRule } from "./types";

import { cacheManager } from "./cache";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ParsedRobots {
  host: string;

  fetchedAt: number;

  rules: RobotsRule[];

  sitemaps: string[];
}

export interface RobotsMatch {
  allowed: boolean;

  matchedRule?: string;

  crawlDelay?: number;
}

export interface RobotsFetcher {
  (url: string): Promise<Response>;
}

/* -------------------------------------------------------------------------- */
/* Parser                                                                     */
/* -------------------------------------------------------------------------- */

export class RobotsParser {
  /* -------------------------------------------------------------------------- */
  /* Parsing                                                                    */
  /* -------------------------------------------------------------------------- */

  parse(
    text: string,

    host = ""
  ): ParsedRobots {
    const rules: RobotsRule[] = [];

    const sitemaps: string[] = [];

    let current: RobotsRule | undefined;

    const lines = text

      .replace(/\r\n/g, "\n")

      .split("\n");

    for (const rawLine of lines) {
      const line = rawLine

        .replace(/#.*$/, "")

        .trim();

      if (!line) {
        continue;
      }

      const separator = line.indexOf(":");

      if (separator < 0) {
        continue;
      }

      const key = line

        .substring(
          0,

          separator
        )

        .trim()

        .toLowerCase();

      const value = line

        .substring(separator + 1)

        .trim();

      switch (key) {
        case "user-agent": {
          current = {
            userAgent: value,

            allow: [],

            disallow: [],

            crawlDelay: undefined,

            sitemaps: []
          };

          rules.push(current);

          break;
        }

        case "allow": {
          current?.allow.push(value);

          break;
        }

        case "disallow": {
          current?.disallow.push(value);

          break;
        }

        case "crawl-delay": {
          if (current) {
            const delay = Number(value);

            if (Number.isFinite(delay)) {
              current.crawlDelay = delay;
            }
          }

          break;
        }

        case "request-rate": {
          /*
           * RFC extension.
           * Stored later if needed.
           */

          break;
        }

        case "sitemap": {
          sitemaps.push(value);

          current?.sitemaps.push(value);

          break;
        }

        default:
          break;
      }
    }

    return {
      host,

      fetchedAt: Date.now(),

      rules,

      sitemaps: [...new Set(sitemaps)]
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Manager                                                                    */
/* -------------------------------------------------------------------------- */

export class RobotsManager {
  constructor(readonly options: RobotsOptions = {}) {}

  async get(
    url: string,

    fetcher: RobotsFetcher
  ): Promise<ParsedRobots> {
    return fetchRobots(
      url,

      fetcher
    );
  }

  async refresh(
    url: string,

    fetcher: RobotsFetcher
  ): Promise<ParsedRobots> {
    return refreshRobots(
      url,

      fetcher
    );
  }

  async canFetch(
    url: string,

    fetcher: RobotsFetcher,

    userAgent = this.options.userAgent ?? "*"
  ): Promise<RobotsMatch> {
    if (this.options.respectRobotsTxt === false) {
      return {
        allowed: true
      };
    }

    const robots = await this.get(
      url,

      fetcher
    );

    return canFetch(
      robots,

      userAgent,

      url
    );
  }
}

export const robotsParser = new RobotsParser();

export const robotsManager = new RobotsManager();

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function parseRobots(
  text: string,

  host = ""
): ParsedRobots {
  return robotsParser.parse(
    text,

    host
  );
}

/* -------------------------------------------------------------------------- */
/* User-Agent Lookup                                                          */
/* -------------------------------------------------------------------------- */

export function findRules(
  robots: ParsedRobots,

  userAgent: string
): RobotsRule[] {
  const normalized = userAgent.toLowerCase();

  const exact = robots.rules.filter(
    (rule) => rule.userAgent.toLowerCase() === normalized
  );

  if (exact.length > 0) {
    return exact;
  }

  return robots.rules.filter((rule) => rule.userAgent === "*");
}

/* -------------------------------------------------------------------------- */
/* Sitemap Helpers                                                            */
/* -------------------------------------------------------------------------- */

export function extractSitemaps(robots: ParsedRobots): string[] {
  return [...new Set(robots.sitemaps)];
}

/* -------------------------------------------------------------------------- */
/* Pattern Compilation                                                        */
/* -------------------------------------------------------------------------- */

function escapeRegex(pattern: string): string {
  return pattern.replace(
    /[.+?^${}()|[\]\\]/g,

    "\\$&"
  );
}

export function compilePattern(pattern: string): RegExp {
  let regex = escapeRegex(pattern);

  /*
   * RFC 9309:
   *
   * *  -> wildcard
   * $  -> end of path
   */

  regex = regex

    .replace(/\\\*/g, ".*");

  if (regex.endsWith("\\$")) {
    regex =
      regex.slice(
        0,

        -2
      ) + "$";
  } else {
    regex += ".*";
  }

  return new RegExp(
    "^" + regex,

    "i"
  );
}

/* -------------------------------------------------------------------------- */
/* Rule Match                                                                 */
/* -------------------------------------------------------------------------- */

export interface RuleMatch {
  pattern: string;

  allow: boolean;

  length: number;
}

/* -------------------------------------------------------------------------- */
/* Matching                                                                   */
/* -------------------------------------------------------------------------- */

export function matchRules(
  path: string,

  rules: RobotsRule[]
): RuleMatch | undefined {
  let best: RuleMatch | undefined;

  const consider = (
    patterns: string[],

    allow: boolean
  ) => {
    for (const pattern of patterns) {
      if (!pattern) {
        continue;
      }

      const regex = compilePattern(pattern);

      if (!regex.test(path)) {
        continue;
      }

      const candidate: RuleMatch = {
        pattern,

        allow,

        length: pattern.length
      };

      if (
        !best ||
        candidate.length > best.length ||
        (candidate.length === best.length && candidate.allow)
      ) {
        best = candidate;
      }
    }
  };

  for (const rule of rules) {
    consider(
      rule.disallow,

      false
    );

    consider(
      rule.allow,

      true
    );
  }

  return best;
}

/* -------------------------------------------------------------------------- */
/* Authorization                                                              */
/* -------------------------------------------------------------------------- */

export function canFetch(
  robots: ParsedRobots,

  userAgent: string,

  url: string
): RobotsMatch {
  const parsed = new URL(url);

  const rules = findRules(
    robots,

    userAgent
  );

  if (rules.length === 0) {
    return {
      allowed: true
    };
  }

  const match = matchRules(
    parsed.pathname,

    rules
  );

  if (!match) {
    return {
      allowed: true,

      crawlDelay: rules.find((r) => r.crawlDelay !== undefined)?.crawlDelay
    };
  }

  return {
    allowed: match.allow,

    matchedRule: match.pattern,

    crawlDelay: rules.find((r) => r.crawlDelay !== undefined)?.crawlDelay
  };
}

/* -------------------------------------------------------------------------- */
/* Convenience                                                                */
/* -------------------------------------------------------------------------- */

export function isAllowed(
  robots: ParsedRobots,

  userAgent: string,

  url: string
): boolean {
  return canFetch(
    robots,

    userAgent,

    url
  ).allowed;
}

/* -------------------------------------------------------------------------- */
/* Cache Keys                                                                 */
/* -------------------------------------------------------------------------- */

function cacheKey(host: string): string {
  return `robots:${host.toLowerCase()}`;
}

/* -------------------------------------------------------------------------- */
/* robots.txt URL                                                             */
/* -------------------------------------------------------------------------- */

export function robotsUrl(url: string | URL): string {
  const parsed = typeof url === "string" ? new URL(url) : url;

  return new URL(
    "/robots.txt",

    parsed.origin
  ).toString();
}

/* -------------------------------------------------------------------------- */
/* Fetch                                                                      */
/* -------------------------------------------------------------------------- */

export async function fetchRobots(
  url: string,

  fetcher: RobotsFetcher,

  ttl = 60 * 60 * 1000
): Promise<ParsedRobots> {
  const parsed = new URL(url);

  const key = cacheKey(parsed.host);

  const cached = await cacheManager.get<ParsedRobots>(key);

  if (cached) {
    return cached.value;
  }

  const response = await fetcher(robotsUrl(parsed));

  if (!response.ok) {
    /*
     * RFC:
     *
     * Missing robots.txt
     * means allow all.
     */

    const empty: ParsedRobots = {
      host: parsed.host,

      fetchedAt: Date.now(),

      rules: [],

      sitemaps: []
    };

    await cacheManager.set(
      key,

      empty,

      ttl
    );

    return empty;
  }

  const text = await response.text();

  const robots = robotsParser.parse(
    text,

    parsed.host
  );

  await cacheManager.set(
    key,

    robots,

    ttl
  );

  return robots;
}

/* -------------------------------------------------------------------------- */
/* Refresh                                                                    */
/* -------------------------------------------------------------------------- */

export async function refreshRobots(
  url: string,

  fetcher: RobotsFetcher,

  ttl = 60 * 60 * 1000
): Promise<ParsedRobots> {
  const parsed = new URL(url);

  await cacheManager.delete(cacheKey(parsed.host));

  return fetchRobots(
    url,

    fetcher,

    ttl
  );
}

/* -------------------------------------------------------------------------- */
/* Sitemap Helpers                                                            */
/* -------------------------------------------------------------------------- */

export function getSitemaps(robots: ParsedRobots): string[] {
  return [...new Set(robots.sitemaps)];
}

export function hasSitemap(robots: ParsedRobots): boolean {
  return robots.sitemaps.length > 0;
}

/* -------------------------------------------------------------------------- */
/* Crawl Delay                                                                */
/* -------------------------------------------------------------------------- */

export function getCrawlDelay(
  robots: ParsedRobots,

  userAgent: string
): number | undefined {
  const rules = findRules(
    robots,

    userAgent
  );

  for (const rule of rules) {
    if (rule.crawlDelay !== undefined) {
      return rule.crawlDelay;
    }
  }

  return;
}

/* -------------------------------------------------------------------------- */
/* Request Rate (RFC Extension)                                               */
/* -------------------------------------------------------------------------- */

export interface RequestRate {
  requests: number;

  seconds: number;
}

export function parseRequestRate(value: string): RequestRate | undefined {
  const match = value.match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);

  if (!match) {
    return;
  }

  return {
    requests: Number(match[1]),

    seconds: Number(match[2])
  };
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                   */
/* -------------------------------------------------------------------------- */

const robotsRegistry = new Map<string, ParsedRobots>();

export function registerRobots(robots: ParsedRobots): void {
  robotsRegistry.set(
    robots.host,

    robots
  );
}

export function unregisterRobots(host: string): boolean {
  return robotsRegistry.delete(host);
}

export function getRegisteredRobots(host: string): ParsedRobots | undefined {
  return robotsRegistry.get(host);
}

export function clearRobotsRegistry(): void {
  robotsRegistry.clear();
}

/* -------------------------------------------------------------------------- */
/* Statistics                                                                 */
/* -------------------------------------------------------------------------- */

export interface RobotsStatistics {
  hosts: number;

  sitemaps: number;

  rules: number;
}

export function collectRobotsStatistics(): RobotsStatistics {
  let rules = 0;

  let sitemaps = 0;

  for (const robots of robotsRegistry.values()) {
    rules += robots.rules.length;

    sitemaps += robots.sitemaps.length;
  }

  return {
    hosts: robotsRegistry.size,

    rules,

    sitemaps
  };
}

/* -------------------------------------------------------------------------- */
/* Convenience                                                                */
/* -------------------------------------------------------------------------- */

export async function ensureRobots(
  url: string,

  fetcher: RobotsFetcher
): Promise<ParsedRobots> {
  const host = new URL(url).host;

  const existing = getRegisteredRobots(host);

  if (existing) {
    return existing;
  }

  const robots = await fetchRobots(
    url,

    fetcher
  );

  registerRobots(robots);

  return robots;
}

/* -------------------------------------------------------------------------- */
/* Convenience API                                                            */
/* -------------------------------------------------------------------------- */

export async function isUrlAllowed(
  url: string,

  fetcher: RobotsFetcher,

  userAgent = "*"
): Promise<boolean> {
  const robots = await ensureRobots(
    url,

    fetcher
  );

  return isAllowed(
    robots,

    userAgent,

    url
  );
}

export async function getRobotsForHost(
  url: string,

  fetcher: RobotsFetcher
): Promise<ParsedRobots> {
  return ensureRobots(
    url,

    fetcher
  );
}

export async function getHostSitemaps(
  url: string,

  fetcher: RobotsFetcher
): Promise<string[]> {
  const robots = await ensureRobots(
    url,

    fetcher
  );

  return getSitemaps(robots);
}

/* -------------------------------------------------------------------------- */
/* Manager Factory                                                            */
/* -------------------------------------------------------------------------- */

export function createRobotsManager(options?: RobotsOptions): RobotsManager {
  return new RobotsManager(options);
}

export function createRobotsParser(): RobotsParser {
  return new RobotsParser();
}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {
  RobotsParser,

  RobotsManager,

  robotsParser,

  robotsManager,

  parseRobots,

  fetchRobots,

  refreshRobots,

  ensureRobots,

  canFetch,

  isAllowed,

  isUrlAllowed,

  findRules,

  matchRules,

  compilePattern,

  extractSitemaps,

  getSitemaps,

  hasSitemap,

  getCrawlDelay,

  parseRequestRate,

  robotsUrl,

  registerRobots,

  unregisterRobots,

  getRegisteredRobots,

  clearRobotsRegistry,

  collectRobotsStatistics,

  getRobotsForHost,

  getHostSitemaps,

  createRobotsManager,

  createRobotsParser
};
