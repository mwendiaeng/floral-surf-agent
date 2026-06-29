/**
 * fetch/security.ts
 *
 * Fetch security validation.
 *
 * Prevents:
 *
 *  • SSRF
 *  • Localhost access
 *  • Private IP access
 *  • Protocol abuse
 *  • Oversized responses
 *  • Unsafe redirects
 */

import type { SecurityOptions, SecurityResult } from "./types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_OPTIONS: Required<SecurityOptions> = {
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
};

/* -------------------------------------------------------------------------- */
/* Validator                                                                  */
/* -------------------------------------------------------------------------- */

export class SecurityValidator {
  constructor(readonly options: SecurityOptions = {}) {}

  /* -------------------------------------------------------------------------- */
  /* Validator                                                                  */
  /* -------------------------------------------------------------------------- */

  validate(url: string): SecurityResult {
    const parsed = validateUrl(url);

    return mergeResults(
      validateProtocol(
        parsed,

        this.options
      ),

      validateHostname(
        parsed,

        this.options
      ),

      validateLocalhost(
        parsed,

        this.options
      ),

      validatePrivateNetwork(
        parsed,

        this.options
      ),

      validateTls(
        parsed,

        this.options
      )
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export const securityValidator = new SecurityValidator();

/* -------------------------------------------------------------------------- */
/* URL Validation                                                             */
/* -------------------------------------------------------------------------- */

export function validateUrl(url: string): URL {
  try {
    return new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Protocol Validation                                                        */
/* -------------------------------------------------------------------------- */

export function isAllowedProtocol(
  protocol: string,

  options: SecurityOptions = {}
): boolean {
  const config = {
    ...DEFAULT_OPTIONS,

    ...options
  };

  const normalized = protocol

    .replace(/:$/, "")

    .toLowerCase();

  if (normalized === "file") {
    return config.allowFileUrls;
  }

  if (normalized === "data") {
    return config.allowDataUrls;
  }

  return config.allowedProtocols.includes(normalized);
}

export function validateProtocol(
  url: URL,

  options: SecurityOptions = {}
): SecurityResult {
  const protocol = url.protocol

    .replace(/:$/, "")

    .toLowerCase();

  if (
    isAllowedProtocol(
      protocol,

      options
    )
  ) {
    return {
      allowed: true,

      warnings: [],

      violations: []
    };
  }

  return {
    allowed: false,

    warnings: [],

    violations: [`Protocol '${protocol}' is not allowed.`]
  };
}

/* -------------------------------------------------------------------------- */
/* Hostname Validation                                                        */
/* -------------------------------------------------------------------------- */

export function validateHostname(
  url: URL,

  options: SecurityOptions = {}
): SecurityResult {
  const config = {
    ...DEFAULT_OPTIONS,

    ...options
  };

  const host = url.hostname.toLowerCase();

  if (config.blockedHosts.some((blocked) => blocked.toLowerCase() === host)) {
    return {
      allowed: false,

      warnings: [],

      violations: [`Host '${host}' is blocked.`]
    };
  }

  if (
    config.allowedHosts.length > 0 &&
    !config.allowedHosts.some((allowed) => allowed.toLowerCase() === host)
  ) {
    return {
      allowed: false,

      warnings: [],

      violations: [`Host '${host}' is not in the allow-list.`]
    };
  }

  return {
    allowed: true,

    warnings: [],

    violations: []
  };
}

/* -------------------------------------------------------------------------- */
/* Localhost                                                                  */
/* -------------------------------------------------------------------------- */

const LOCALHOST_NAMES = new Set([
  "localhost",

  "localhost.localdomain",

  "127.0.0.1",

  "::1"
]);

export function isLocalhost(hostname: string): boolean {
  return LOCALHOST_NAMES.has(hostname.toLowerCase());
}

/* -------------------------------------------------------------------------- */
/* Loopback                                                                   */
/* -------------------------------------------------------------------------- */

export function isLoopback(hostname: string): boolean {
  if (hostname === "::1") {
    return true;
  }

  return /^127\./.test(hostname);
}

/* -------------------------------------------------------------------------- */
/* Local Validation                                                           */
/* -------------------------------------------------------------------------- */

export function validateLocalhost(
  url: URL,

  options: SecurityOptions = {}
): SecurityResult {
  const config = {
    ...DEFAULT_OPTIONS,

    ...options
  };

  if (config.allowLocalhost) {
    return {
      allowed: true,

      warnings: [],

      violations: []
    };
  }

  if (isLocalhost(url.hostname) || isLoopback(url.hostname)) {
    return {
      allowed: false,

      warnings: [],

      violations: ["Localhost access is prohibited."]
    };
  }

  return {
    allowed: true,

    warnings: [],

    violations: []
  };
}

/* -------------------------------------------------------------------------- */
/* IPv4 Private Networks                                                      */
/* -------------------------------------------------------------------------- */

const PRIVATE_IPV4 = [
  /^10\./,

  /^127\./,

  /^169\.254\./,

  /^172\.(1[6-9]|2\d|3[0-1])\./,

  /^192\.168\./,

  /^0\./
];

/* -------------------------------------------------------------------------- */
/* IPv6 Private Networks                                                      */
/* -------------------------------------------------------------------------- */

const PRIVATE_IPV6 = [
  /^::1$/i,

  /^fc/i,

  /^fd/i,

  /^fe80:/i
];

/* -------------------------------------------------------------------------- */
/* IP Detection                                                               */
/* -------------------------------------------------------------------------- */

export function isIpv4(value: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(value);
}

export function isIpv6(value: string): boolean {
  return value.includes(":");
}

/* -------------------------------------------------------------------------- */
/* Private Address Detection                                                  */
/* -------------------------------------------------------------------------- */

export function isPrivateAddress(host: string): boolean {
  if (isIpv4(host)) {
    return PRIVATE_IPV4.some((regex) => regex.test(host));
  }

  if (isIpv6(host)) {
    return PRIVATE_IPV6.some((regex) => regex.test(host));
  }

  return false;
}

/* -------------------------------------------------------------------------- */
/* Private Network Validation                                                 */
/* -------------------------------------------------------------------------- */

export function validatePrivateNetwork(
  url: URL,

  options: SecurityOptions = {}
): SecurityResult {
  const config = {
    ...DEFAULT_OPTIONS,

    ...options
  };

  if (config.allowPrivateNetworks) {
    return {
      allowed: true,

      warnings: [],

      violations: []
    };
  }

  if (isPrivateAddress(url.hostname)) {
    return {
      allowed: false,

      warnings: [],

      violations: ["Private network access is prohibited."]
    };
  }

  return {
    allowed: true,

    warnings: [],

    violations: []
  };
}

/* -------------------------------------------------------------------------- */
/* DNS Resolution Hook                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Optional DNS resolution callback.
 *
 * fetch.ts can provide a resolver that resolves
 * hostnames before making the request.
 */

export type DnsResolver = (hostname: string) => Promise<string[]>;

/* -------------------------------------------------------------------------- */
/* DNS Validation                                                             */
/* -------------------------------------------------------------------------- */

export async function validateResolvedAddresses(
  hostname: string,

  resolver: DnsResolver,

  options: SecurityOptions = {}
): Promise<SecurityResult> {
  const config = {
    ...DEFAULT_OPTIONS,

    ...options
  };

  if (config.allowPrivateNetworks) {
    return {
      allowed: true,

      warnings: [],

      violations: []
    };
  }

  const addresses = await resolver(hostname);

  const violations: string[] = [];

  for (const address of addresses) {
    if (isPrivateAddress(address)) {
      violations.push(`Resolved private address: ${address}`);
    }
  }

  return {
    allowed: violations.length === 0,

    warnings: [],

    violations
  };
}

/* -------------------------------------------------------------------------- */
/* Redirect Validation                                                        */
/* -------------------------------------------------------------------------- */

export function validateRedirect(
  from: URL,

  to: URL,

  options: SecurityOptions = {}
): SecurityResult {
  const protocol = validateProtocol(
    to,

    options
  );

  if (!protocol.allowed) {
    return protocol;
  }

  const localhost = validateLocalhost(
    to,

    options
  );

  if (!localhost.allowed) {
    return localhost;
  }

  const privateNetwork = validatePrivateNetwork(
    to,

    options
  );

  if (!privateNetwork.allowed) {
    return privateNetwork;
  }

  return {
    allowed: true,

    warnings:
      from.hostname !== to.hostname
        ? [`Redirected from ${from.hostname} to ${to.hostname}`]
        : [],

    violations: []
  };
}

/* -------------------------------------------------------------------------- */
/* Content Length                                                             */
/* -------------------------------------------------------------------------- */

export function validateContentLength(
  contentLength: number | undefined,

  options: SecurityOptions = {}
): SecurityResult {
  const config = {
    ...DEFAULT_OPTIONS,

    ...options
  };

  if (contentLength === undefined || contentLength === null) {
    return {
      allowed: true,

      warnings: ["Content-Length header missing."],

      violations: []
    };
  }

  if (contentLength > config.maxContentLength) {
    return {
      allowed: false,

      warnings: [],

      violations: [
        `Content exceeds maximum allowed size (${config.maxContentLength} bytes).`
      ]
    };
  }

  return {
    allowed: true,

    warnings: [],

    violations: []
  };
}

/* -------------------------------------------------------------------------- */
/* MIME Validation                                                            */
/* -------------------------------------------------------------------------- */

export function validateContentType(
  contentType: string | undefined,

  allowedTypes?: string[]
): SecurityResult {
  if (!contentType || !allowedTypes || allowedTypes.length === 0) {
    return {
      allowed: true,

      warnings: [],

      violations: []
    };
  }

  const mime = contentType

    .split(";")[0]

    .trim()

    .toLowerCase();

  const allowed = allowedTypes.some(
    (type) => mime === type || mime.startsWith(`${type}/`)
  );

  return {
    allowed,

    warnings: [],

    violations: allowed ? [] : [`Content-Type '${mime}' is not permitted.`]
  };
}

/* -------------------------------------------------------------------------- */
/* HTTPS Enforcement                                                          */
/* -------------------------------------------------------------------------- */

export function validateTls(
  url: URL,

  options: SecurityOptions = {}
): SecurityResult {
  const config = {
    ...DEFAULT_OPTIONS,

    ...options
  };

  if (url.protocol === "https:") {
    return {
      allowed: true,

      warnings: [],

      violations: []
    };
  }

  if (config.allowInsecureTls) {
    return {
      allowed: true,

      warnings: ["Using insecure HTTP connection."],

      violations: []
    };
  }

  return {
    allowed: false,

    warnings: [],

    violations: ["HTTPS is required."]
  };
}

/* -------------------------------------------------------------------------- */
/* Aggregate                                                                  */
/* -------------------------------------------------------------------------- */

function mergeResults(...results: SecurityResult[]): SecurityResult {
  return {
    allowed: results.every((result) => result.allowed),

    warnings: results.flatMap((result) => result.warnings),

    violations: results.flatMap((result) => result.violations)
  };
}

/* -------------------------------------------------------------------------- */
/* Response Validation                                                        */
/* -------------------------------------------------------------------------- */

export function validateResponse(
  response: Response,

  options: SecurityOptions = {}
): SecurityResult {
  const contentLength = response.headers.get("content-length");

  const contentType = response.headers.get("content-type") ?? undefined;

  return mergeResults(
    validateContentLength(
      contentLength ? Number(contentLength) : undefined,

      options
    ),

    validateContentType(contentType)
  );
}

/* -------------------------------------------------------------------------- */
/* Wildcard Matching                                                          */
/* -------------------------------------------------------------------------- */

export function matchesHost(
  hostname: string,

  pattern: string
): boolean {
  hostname = hostname.toLowerCase();

  pattern = pattern.toLowerCase();

  if (pattern === "*") {
    return true;
  }

  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1);

    return hostname.endsWith(suffix);
  }

  return hostname === pattern;
}

/* -------------------------------------------------------------------------- */
/* Security Policy                                                            */
/* -------------------------------------------------------------------------- */

export class SecurityPolicy {
  constructor(readonly options: SecurityOptions = {}) {}

  isAllowed(url: string): boolean {
    return securityValidator

      .validate(url).allowed;
  }

  assert(url: string): void {
    const result = securityValidator.validate(url);

    if (result.allowed) {
      return;
    }

    throw new Error(result.violations.join("\n"));
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function createSecurityValidator(
  options?: SecurityOptions
): SecurityValidator {
  return new SecurityValidator(options);
}

export function createSecurityPolicy(
  options?: SecurityOptions
): SecurityPolicy {
  return new SecurityPolicy(options);
}

/* -------------------------------------------------------------------------- */
/* Convenience                                                                */
/* -------------------------------------------------------------------------- */

export function validateRequest(
  url: string,

  options?: SecurityOptions
): SecurityResult {
  return createSecurityValidator(options).validate(url);
}

export function assertSafeUrl(
  url: string,

  options?: SecurityOptions
): void {
  createSecurityPolicy(options).assert(url);
}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {
  SecurityValidator,

  SecurityPolicy,

  createSecurityValidator,

  createSecurityPolicy,

  validateRequest,

  validateResponse,

  validateUrl,

  validateProtocol,

  validateHostname,

  validateLocalhost,

  validatePrivateNetwork,

  validateRedirect,

  validateContentLength,

  validateContentType,

  validateTls,

  isAllowedProtocol,

  isLocalhost,

  isLoopback,

  isIpv4,

  isIpv6,

  isPrivateAddress,

  matchesHost,

  assertSafeUrl
};
