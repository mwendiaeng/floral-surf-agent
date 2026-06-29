/**
 * utils/urls.ts
 *
 * URL helpers used throughout the fetch/browser pipeline.
 */

/* -------------------------------------------------------------------------- */
/*                               Constants                                    */
/* -------------------------------------------------------------------------- */

const TRACKING_PARAMETERS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",

  "gclid",
  "fbclid",
  "mc_cid",
  "mc_eid",

  "_hsenc",
  "_hsmi",

  "ref",
  "ref_src"
]);

const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

const INVALID_PROTOCOLS = new Set(["javascript:", "vbscript:", "data:"]);

/* -------------------------------------------------------------------------- */
/*                               Resolution                                   */
/* -------------------------------------------------------------------------- */

export function resolveUrl(href: string, base?: string): string {
  if (!href.trim()) {
    return "";
  }

  try {
    if (!base) {
      return new URL(href).toString();
    }

    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

/* -------------------------------------------------------------------------- */
/*                           URL Normalization                                */
/* -------------------------------------------------------------------------- */

export function normalizeUrl(url: string, base?: string): string {
  try {
    const resolved = new URL(url, base);

    resolved.hash = "";

    return resolved.toString();
  } catch {
    return url;
  }
}

export function canonicalizeUrl(url: string, base?: string): string {
  try {
    const u = new URL(url, base);

    u.hash = "";

    u.hostname = u.hostname.toLowerCase();

    if (
      (u.protocol === "https:" && u.port === "443") ||
      (u.protocol === "http:" && u.port === "80")
    ) {
      u.port = "";
    }

    if (u.pathname.endsWith("/") && u.pathname !== "/") {
      u.pathname = u.pathname.slice(0, -1);
    }

    removeTrackingParams(u);

    return u.toString();
  } catch {
    return url;
  }
}

/* -------------------------------------------------------------------------- */
/*                             URL Inspection                                 */
/* -------------------------------------------------------------------------- */

export function isAbsoluteUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return SAFE_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export function isRelativeUrl(value: string): boolean {
  return !isAbsoluteUrl(value);
}

export function isInternalLink(href: string, base?: string): boolean {
  if (!base) {
    return href.startsWith("/") || href.startsWith("#");
  }

  try {
    const a = new URL(href, base);

    const b = new URL(base);

    return a.origin === b.origin;
  } catch {
    return false;
  }
}

export function isExternalLink(href: string, base?: string): boolean {
  return !isInternalLink(
    href,

    base
  );
}

/* -------------------------------------------------------------------------- */
/*                             Protocol Helpers                               */
/* -------------------------------------------------------------------------- */

export function isMailto(href: string): boolean {
  return href.startsWith("mailto:");
}

export function isTelephone(href: string): boolean {
  return href.startsWith("tel:");
}

export function isHashLink(href: string): boolean {
  return href.startsWith("#");
}

export function isSafeUrl(href: string): boolean {
  try {
    const protocol = new URL(href).protocol;

    return SAFE_PROTOCOLS.has(protocol);
  } catch {
    return !INVALID_PROTOCOLS.has(href.split(":")[0] + ":");
  }
}

/* -------------------------------------------------------------------------- */
/*                          URL Manipulation                                  */
/* -------------------------------------------------------------------------- */

export function removeFragment(url: string): string {
  try {
    const parsed = new URL(url);

    parsed.hash = "";

    return parsed.toString();
  } catch {
    return url;
  }
}

export function removeTrackingParams(url: URL): URL {
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMETERS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  return url;
}

/* -------------------------------------------------------------------------- */
/*                            Comparison                                      */
/* -------------------------------------------------------------------------- */

export function urlsEqual(a: string, b: string): boolean {
  return canonicalizeUrl(a) === canonicalizeUrl(b);
}
