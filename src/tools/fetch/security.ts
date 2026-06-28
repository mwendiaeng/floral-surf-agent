import * as ipaddr from "ipaddr.js";
import {
  FetchError,
  FetchErrorCode,
  SecurityPolicy,
} from "./types";

/**
 * Default ports allowed for outbound HTTP requests.
 */
export const DEFAULT_ALLOWED_PORTS = new Set([
  80,
  443,
]);

/**
 * Common ports that should never be reachable.
 */
export const DEFAULT_BLOCKED_PORTS = new Set([
  20,
  21,
  22,
  23,
  25,
  53,
  110,
  135,
  137,
  138,
  139,
  143,
  445,
  1433,
  1521,
  2375,
  2376,
  3306,
  3389,
  5432,
  6379,
  8080,
  9200,
  11211,
]);

export interface SecurityValidationResult {
  allowed: boolean;
  normalizedUrl: URL;
  reason?: string;
}

const DEFAULT_ALLOWED_PROTOCOLS = new Set([
  "http:",
  "https:",
]);

/**
 * Validate a URL before making any outbound request.
 */
export function validateUrl(
  rawUrl: string,
  policy: SecurityPolicy = {}
): SecurityValidationResult {

  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new FetchError(
      FetchErrorCode.INVALID_URL,
      "Invalid URL"
    );
  }

  validateProtocol(url);

  validateHost(url, policy);

  validatePort(url, policy);

  return {
    allowed: true,
    normalizedUrl: url,
  };
}

/**
 * Validate protocol.
 */
export function validateProtocol(url: URL) {

  if (!DEFAULT_ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new FetchError(
      FetchErrorCode.BLOCKED_HOST,
      `Protocol ${url.protocol} is not allowed`
    );
  }

}

/**
 * Validate hostname.
 */
export function validateHost(
  url: URL,
  policy: SecurityPolicy
) {

  const hostname = url.hostname.toLowerCase();

  if (
    policy.blockedHosts?.includes(hostname)
  ) {
    throw new FetchError(
      FetchErrorCode.BLOCKED_HOST,
      `Host ${hostname} is blocked`
    );
  }

  if (
    policy.allowedHosts &&
    policy.allowedHosts.length > 0 &&
    !policy.allowedHosts.includes(hostname)
  ) {
    throw new FetchError(
      FetchErrorCode.BLOCKED_HOST,
      `${hostname} not in allow list`
    );
  }

  if (!policy.allowLocalhost) {

    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost")
    ) {
      throw new FetchError(
        FetchErrorCode.PRIVATE_NETWORK,
        "Localhost access denied"
      );
    }

  }

  if (ipaddr.isValid(hostname)) {

    const ip = ipaddr.parse(hostname);

    validateIPAddress(ip, policy);

  }

}

/**
 * Validate numeric IP addresses.
 */
export function validateIPAddress(
  ip: ipaddr.IPv4 | ipaddr.IPv6,
  policy: SecurityPolicy
) {

  const range = ip.range();

  if (
    policy.allowPrivateIPs
  ) {
    return;
  }

  switch (range) {

    case "loopback":
    case "private":
    case "linkLocal":
    case "carrierGradeNat":
    case "uniqueLocal":
    case "unspecified":
    case "broadcast":
    case "reserved":
    case "multicast":

      throw new FetchError(
        FetchErrorCode.PRIVATE_NETWORK,
        `IP range '${range}' is blocked`
      );

  }

}

/**
 * Validate destination port.
 */
export function validatePort(
  url: URL,
  policy: SecurityPolicy
) {

  const port =
    url.port.length > 0
      ? Number(url.port)
      : url.protocol === "https:"
      ? 443
      : 80;

  if (
    DEFAULT_BLOCKED_PORTS.has(port)
  ) {
    throw new FetchError(
      FetchErrorCode.BLOCKED_HOST,
      `Port ${port} is blocked`
    );
  }

  if (
    !DEFAULT_ALLOWED_PORTS.has(port)
  ) {
    throw new FetchError(
      FetchErrorCode.BLOCKED_HOST,
      `Port ${port} is not permitted`
    );
  }

}

/**
 * Validate redirect chain.
 */
export function validateRedirectChain(
  redirects: string[],
  policy: SecurityPolicy
) {

  const max =
    policy.maxRedirects ?? 10;

  if (
    redirects.length > max
  ) {
    throw new FetchError(
      FetchErrorCode.TOO_MANY_REDIRECTS,
      `Exceeded ${max} redirects`
    );
  }

  for (const redirect of redirects) {

    validateUrl(redirect, policy);

  }

}

/**
 * Returns true if URL can be fetched.
 */
export function isAllowed(
  url: string,
  policy?: SecurityPolicy
): boolean {

  try {

    validateUrl(url, policy);

    return true;

  } catch {

    return false;

  }

}