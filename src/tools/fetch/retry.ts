/**
 * fetch/retry.ts
 *
 * Retry policies and execution.
 */

import type { RetryContext, RetryOptions } from "./types";

/* -------------------------------------------------------------------------- */
/* Strategy                                                                   */
/* -------------------------------------------------------------------------- */

export type RetryStrategy = "fixed" | "linear" | "exponential" | "decorrelated";

/* -------------------------------------------------------------------------- */
/* Retry Decision                                                             */
/* -------------------------------------------------------------------------- */

export interface RetryDecision {
  retry: boolean;

  delay: number;

  reason?: string;
}

/* -------------------------------------------------------------------------- */
/* Retry Policy                                                               */
/* -------------------------------------------------------------------------- */

export interface RetryPolicy {
  strategy: RetryStrategy;

  retries: number;

  initialDelay: number;

  maxDelay: number;

  factor: number;

  jitter: boolean;
}

/* -------------------------------------------------------------------------- */
/* Defaults                                                                   */
/* -------------------------------------------------------------------------- */

const DEFAULT_POLICY: RetryPolicy = {
  strategy: "exponential",

  retries: 3,

  initialDelay: 500,

  maxDelay: 30_000,

  factor: 2,

  jitter: true
};

/* -------------------------------------------------------------------------- */
/* Executor                                                                   */
/* -------------------------------------------------------------------------- */

export class RetryExecutor {
  constructor(readonly policy: RetryPolicy = DEFAULT_POLICY) {}

  /* -------------------------------------------------------------------------- */
  /* Retry Execution                                                            */
  /* -------------------------------------------------------------------------- */

  async execute<T>(
    operation: (context: RetryContext) => Promise<T>
  ): Promise<T> {
    let lastError: unknown;

    let previousDelay = this.policy.initialDelay;

    for (let attempt = 1; attempt <= this.policy.retries + 1; attempt++) {
      const context: RetryContext = {
        attempt,

        maxAttempts: this.policy.retries + 1,

        delay: previousDelay,

        lastError
      };

      try {
        return await operation(context);
      } catch (error) {
        lastError = error;

        const decision = createRetryDecision(
          context,

          this.policy,

          error
        );

        if (!decision.retry) {
          throw error;
        }

        previousDelay = decision.delay;

        await sleep(decision.delay);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Retry operation failed.");
  }
}

/* -------------------------------------------------------------------------- */
/* Convenience                                                                */
/* -------------------------------------------------------------------------- */

export async function retry<T>(
  operation: (context: RetryContext) => Promise<T>,

  policy?: Partial<RetryPolicy>
): Promise<T> {
  const executor = new RetryExecutor({
    ...DEFAULT_POLICY,

    ...policy
  });

  return executor.execute(operation);
}

/* -------------------------------------------------------------------------- */
/* Retry Response                                                             */
/* -------------------------------------------------------------------------- */

export async function retryResponse(
  operation: (context: RetryContext) => Promise<Response>,

  options?: RetryOptions
): Promise<Response> {
  const executor = new RetryExecutor({
    strategy: "exponential",

    retries: options?.retries ?? DEFAULT_POLICY.retries,

    initialDelay: options?.initialDelay ?? DEFAULT_POLICY.initialDelay,

    maxDelay: options?.maxDelay ?? DEFAULT_POLICY.maxDelay,

    factor: options?.factor ?? DEFAULT_POLICY.factor,

    jitter: options?.jitter ?? DEFAULT_POLICY.jitter
  });

  return executor.execute(operation);
}

/* -------------------------------------------------------------------------- */
/* Async Predicate                                                            */
/* -------------------------------------------------------------------------- */

export async function retryUntil<T>(
  operation: (context: RetryContext) => Promise<T>,

  predicate: (value: T) => boolean,

  policy?: Partial<RetryPolicy>
): Promise<T> {
  return retry(
    async (context) => {
      const value = await operation(context);

      if (predicate(value)) {
        return value;
      }

      throw new Error("Retry predicate failed.");
    },

    policy
  );
}

/* -------------------------------------------------------------------------- */
/* Fixed                                                                      */
/* -------------------------------------------------------------------------- */

export function fixedDelay(
  policy: RetryPolicy,

  _attempt: number
): number {
  return policy.initialDelay;
}

/* -------------------------------------------------------------------------- */
/* Linear                                                                     */
/* -------------------------------------------------------------------------- */

export function linearDelay(
  policy: RetryPolicy,

  attempt: number
): number {
  return Math.min(
    policy.initialDelay * attempt,

    policy.maxDelay
  );
}

/* -------------------------------------------------------------------------- */
/* Exponential                                                                */
/* -------------------------------------------------------------------------- */

export function exponentialDelay(
  policy: RetryPolicy,

  attempt: number
): number {
  return Math.min(
    policy.initialDelay *
      Math.pow(
        policy.factor,

        Math.max(
          0,

          attempt - 1
        )
      ),

    policy.maxDelay
  );
}

/* -------------------------------------------------------------------------- */
/* Full Jitter                                                                */
/* -------------------------------------------------------------------------- */

export function fullJitter(delay: number): number {
  return Math.floor(Math.random() * delay);
}

/* -------------------------------------------------------------------------- */
/* Equal Jitter                                                               */
/* -------------------------------------------------------------------------- */

export function equalJitter(delay: number): number {
  const half = delay / 2;

  return Math.floor(half + Math.random() * half);
}

/* -------------------------------------------------------------------------- */
/* Decorrelated Jitter                                                        */
/* -------------------------------------------------------------------------- */

export function decorrelatedJitter(
  previousDelay: number,

  policy: RetryPolicy
): number {
  const minimum = policy.initialDelay;

  const maximum = Math.max(
    minimum,

    previousDelay * 3
  );

  return Math.min(
    policy.maxDelay,

    Math.floor(minimum + Math.random() * (maximum - minimum))
  );
}

/* -------------------------------------------------------------------------- */
/* Delay Dispatcher                                                           */
/* -------------------------------------------------------------------------- */

export function calculateRetryDelay(
  policy: RetryPolicy,

  attempt: number,

  previousDelay = policy.initialDelay
): number {
  let delay: number;

  switch (policy.strategy) {
    case "fixed":
      delay = fixedDelay(
        policy,

        attempt
      );

      break;

    case "linear":
      delay = linearDelay(
        policy,

        attempt
      );

      break;

    case "decorrelated":
      delay = decorrelatedJitter(
        previousDelay,

        policy
      );

      break;

    case "exponential":

    default:
      delay = exponentialDelay(
        policy,

        attempt
      );

      break;
  }

  if (policy.jitter && policy.strategy !== "decorrelated") {
    delay = equalJitter(delay);
  }

  return Math.min(
    delay,

    policy.maxDelay
  );
}

/* -------------------------------------------------------------------------- */
/* Sleep                                                                      */
/* -------------------------------------------------------------------------- */

export async function sleep(
  milliseconds: number,

  signal?: AbortSignal
): Promise<void> {
  if (milliseconds <= 0) {
    return;
  }

  return new Promise(
    (
      resolve,

      reject
    ) => {
      const timer = setTimeout(
        () => {
          cleanup();

          resolve();
        },

        milliseconds
      );

      const cleanup = () => {
        clearTimeout(timer);

        signal?.removeEventListener(
          "abort",

          abort
        );
      };

      const abort = () => {
        cleanup();

        reject(
          new DOMException(
            "Operation aborted",

            "AbortError"
          )
        );
      };

      if (signal) {
        if (signal.aborted) {
          abort();

          return;
        }

        signal.addEventListener(
          "abort",

          abort,

          {
            once: true
          }
        );
      }
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Retryable Status Codes                                                     */
/* -------------------------------------------------------------------------- */

const DEFAULT_RETRY_STATUS = new Set([
  408,

  409,

  425,

  429,

  500,

  502,

  503,

  504
]);

/* -------------------------------------------------------------------------- */
/* Network Errors                                                             */
/* -------------------------------------------------------------------------- */

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("socket") ||
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("ehostunreach") ||
    message.includes("etimedout")
  );
}

/* -------------------------------------------------------------------------- */
/* Retryable HTTP Status                                                      */
/* -------------------------------------------------------------------------- */

export function isRetryableStatus(
  status: number,

  options?: RetryOptions
): boolean {
  const allowed = new Set(options?.retryOn ?? DEFAULT_RETRY_STATUS);

  return allowed.has(status);
}

/* -------------------------------------------------------------------------- */
/* Retry-After                                                                */
/* -------------------------------------------------------------------------- */

export function parseRetryAfter(value?: string | null): number | undefined {
  if (!value) {
    return;
  }

  /*
   * Numeric seconds.
   */

  const seconds = Number(value);

  if (Number.isFinite(seconds)) {
    return seconds * 1000;
  }

  /*
   * HTTP date.
   */

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return;
  }

  return Math.max(
    0,

    timestamp - Date.now()
  );
}

/* -------------------------------------------------------------------------- */
/* Retry Decision                                                             */
/* -------------------------------------------------------------------------- */

export function shouldRetry(
  context: RetryContext,

  error?: unknown,

  response?: Response,

  options?: RetryOptions
): boolean {
  if (context.attempt >= context.maxAttempts) {
    return false;
  }

  if (error) {
    return isNetworkError(error);
  }

  if (response) {
    return isRetryableStatus(
      response.status,

      options
    );
  }

  return false;
}

/* -------------------------------------------------------------------------- */
/* Decision Builder                                                           */
/* -------------------------------------------------------------------------- */

export function createRetryDecision(
  context: RetryContext,

  policy: RetryPolicy,

  error?: unknown,

  response?: Response,

  options?: RetryOptions
): RetryDecision {
  const retry = shouldRetry(
    context,

    error,

    response,

    options
  );

  if (!retry) {
    return {
      retry: false,

      delay: 0,

      reason: "Retry conditions not met."
    };
  }

  /*
   * Honor Retry-After if present.
   */

  const retryAfter = parseRetryAfter(response?.headers.get("retry-after"));

  const delay =
    retryAfter ??
    calculateRetryDelay(
      policy,

      context.attempt,

      context.delay
    );

  return {
    retry: true,

    delay,

    reason: error ? "Network error" : `HTTP ${response?.status}`
  };
}

/* -------------------------------------------------------------------------- */
/* Circuit Breaker                                                            */
/* -------------------------------------------------------------------------- */

export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  failureThreshold?: number;

  successThreshold?: number;

  timeout?: number;
}

export class CircuitBreaker {
  private state: CircuitState = "closed";

  private failures = 0;

  private successes = 0;

  private nextAttempt = 0;

  constructor(private readonly options: CircuitBreakerOptions = {}) {}

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = "closed";

    this.failures = 0;

    this.successes = 0;

    this.nextAttempt = 0;
  }

  private open(): void {
    this.state = "open";

    this.nextAttempt = Date.now() + (this.options.timeout ?? 30_000);
  }

  private halfOpen(): void {
    this.state = "half-open";

    this.successes = 0;
  }

  private close(): void {
    this.reset();
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit breaker is open.");
      }

      this.halfOpen();
    }

    try {
      const result = await operation();

      if (this.state === "half-open") {
        this.successes++;

        if (this.successes >= (this.options.successThreshold ?? 1)) {
          this.close();
        }
      } else {
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;

      if (this.failures >= (this.options.failureThreshold ?? 5)) {
        this.open();
      }

      throw error;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Metrics                                                                    */
/* -------------------------------------------------------------------------- */

export interface RetryMetrics {
  attempts: number;

  retries: number;

  successes: number;

  failures: number;

  totalDelay: number;
}

/* -------------------------------------------------------------------------- */
/* Retry Builder                                                              */
/* -------------------------------------------------------------------------- */

export function createRetryExecutor(
  policy?: Partial<RetryPolicy>
): RetryExecutor {
  return new RetryExecutor({
    ...DEFAULT_POLICY,

    ...policy
  });
}

export function createCircuitBreaker(
  options?: CircuitBreakerOptions
): CircuitBreaker {
  return new CircuitBreaker(options);
}

/* -------------------------------------------------------------------------- */
/* Predicates                                                                 */
/* -------------------------------------------------------------------------- */

export function isRetryableError(error: unknown): boolean {
  return isNetworkError(error);
}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {
  RetryExecutor,

  CircuitBreaker,

  retry,

  retryUntil,

  retryResponse,

  createRetryExecutor,

  createCircuitBreaker,

  calculateRetryDelay,

  createRetryDecision,

  shouldRetry,

  isRetryableStatus,

  isRetryableError,

  parseRetryAfter,

  sleep
};
