/**
 * fetch/robots.ts
 *
 * robots.txt support for the Fetch subsystem.
 *
 * Features:
 * - Download robots.txt
 * - Parse User-agent sections
 * - Allow / Disallow matching
 * - Crawl-delay
 * - Sitemap discovery
 * - Caching
 * - Wildcard support
 */

import { FetchError, FetchErrorCode, RobotsRule } from "./types";

export interface RobotsOptions {
  userAgent?: string;
  timeoutMs?: number;
  cacheTtlMs?: number;
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

interface CacheEntry {

  expires: number;

  robots: RobotsFile;
}

const cache = new Map<string, CacheEntry>();

const DEFAULT_AGENT = "Cloudflare-Agent";

const DEFAULT_TTL = 1000 * 60 * 10;

/**
 * Download and parse robots.txt.
 */
export async function loadRobots(
  target: URL,
  options: RobotsOptions = {}
): Promise<RobotsFile> {

  const origin = target.origin;

  const cached = cache.get(origin);

  if (
    cached &&
    cached.expires > Date.now()
  ) {
    return cached.robots;
  }

  const robotsUrl =
    `${origin}/robots.txt`;

  let response: Response;

  try {

    response = await fetch(
      robotsUrl,
      {
        signal: AbortSignal.timeout(
          options.timeoutMs ?? 5000
        ),
      }
    );

  } catch (error) {

    throw new FetchError(
      FetchErrorCode.NETWORK_ERROR,
      "Unable to fetch robots.txt",
      error
    );

  }

  if (
    response.status === 404
  ) {

    const empty: RobotsFile = {
      url: robotsUrl,
      fetchedAt: new Date(),
      groups: [],
      sitemaps: [],
    };

    cache.set(origin, {
      expires:
        Date.now() +
        (options.cacheTtlMs ??
          DEFAULT_TTL),
      robots: empty,
    });

    return empty;
  }

  const text =
    await response.text();

  const robots =
    parseRobots(
      robotsUrl,
      text
    );

  cache.set(origin, {

    expires:
      Date.now() +
      (options.cacheTtlMs ??
        DEFAULT_TTL),

    robots,

  });

  return robots;
}

/**
 * Parse robots.txt.
 */
export function parseRobots(
  url: string,
  text: string
): RobotsFile {

  const groups: RobotsGroup[] = [];

  const sitemaps: string[] = [];

  let current: RobotsGroup = {

    userAgents: [],

    allow: [],

    disallow: [],

  };

  for (
    const rawLine of
      text.split("\n")
  ) {

    const line =
      rawLine
        .split("#")[0]
        .trim();

    if (!line) {
      continue;
    }

    const idx =
      line.indexOf(":");

    if (idx < 0) {
      continue;
    }

    const key =
      line
        .slice(0, idx)
        .trim()
        .toLowerCase();

    const value =
      line
        .slice(idx + 1)
        .trim();

    switch (key) {

      case "user-agent":

        if (
          current.userAgents
            .length > 0
        ) {

          groups.push(
            current
          );

          current = {

            userAgents: [],

            allow: [],

            disallow: [],

          };

        }

        current.userAgents.push(
          value.toLowerCase()
        );

        break;

      case "allow":

        current.allow.push(
          value
        );

        break;

      case "disallow":

        current.disallow.push(
          value
        );

        break;

      case "crawl-delay":

        current.crawlDelay =
          Number(value);

        break;

      case "sitemap":

        sitemaps.push(
          value
        );

        break;

    }

  }

  if (
    current.userAgents.length
  ) {

    groups.push(
      current
    );

  }

  return {

    url,

    fetchedAt:
      new Date(),

    groups,

    sitemaps,

  };

}

/**
 * Check whether a URL is crawlable.
 */
export function isAllowed(
  robots: RobotsFile,
  url: URL,
  userAgent = DEFAULT_AGENT
): RobotsRule {

  const path =
    url.pathname;

  const group =
    findGroup(
      robots,
      userAgent
    );

  if (!group) {

    return {

      allowed: true,

    };

  }

  let matchedAllow:
    string | undefined;

  let matchedDisallow:
    string | undefined;

  for (
    const rule of
      group.allow
  ) {

    if (
      matchRule(
        path,
        rule
      )
    ) {

      if (
        !matchedAllow ||
        rule.length >
          matchedAllow.length
      ) {

        matchedAllow =
          rule;

      }

    }

  }

  for (
    const rule of
      group.disallow
  ) {

    if (
      matchRule(
        path,
        rule
      )
    ) {

      if (
        !matchedDisallow ||
        rule.length >
          matchedDisallow.length
      ) {

        matchedDisallow =
          rule;

      }

    }

  }

  if (
    matchedAllow &&
    (!matchedDisallow ||
      matchedAllow.length >=
        matchedDisallow.length)
  ) {

    return {

      allowed: true,

      crawlDelay:
        group.crawlDelay,

      matchedRule:
        matchedAllow,

    };

  }

  if (
    matchedDisallow
  ) {

    return {

      allowed: false,

      crawlDelay:
        group.crawlDelay,

      matchedRule:
        matchedDisallow,

    };

  }

  return {

    allowed: true,

    crawlDelay:
      group.crawlDelay,

  };

}

/**
 * Find the best User-agent group.
 */
export function findGroup(
  robots: RobotsFile,
  userAgent: string
): RobotsGroup | undefined {

  const ua =
    userAgent.toLowerCase();

  return (
    robots.groups.find(
      g =>
        g.userAgents.includes(
          ua
        )
    ) ??

    robots.groups.find(
      g =>
        g.userAgents.includes(
          "*"
        )
    )

  );

}

/**
 * Basic wildcard matcher.
 */
export function matchRule(
  path: string,
  rule: string
): boolean {

  if (!rule) {
    return false;
  }

  const regex =
    new RegExp(
      "^" +
        rule
          .replace(
            /\*/g,
            ".*"
          )
          .replace(
            /\$/g,
            "$"
          )
    );

  return regex.test(
    path
  );

}