/**
 * Retry Engine
 *
 * Production-grade retry utility supporting:
 *
 * ✔ Exponential Backoff
 * ✔ Optional Jitter
 * ✔ Retry-After header
 * ✔ Retry predicates
 * ✔ AbortSignal
 * ✔ Maximum elapsed time
 * ✔ Hooks
 */

import {
  RetryOptions,
} from "./types";

export interface RetryContext {

  attempt: number;

  maxAttempts: number;

  error?: unknown;

  response?: Response;

  delayMs: number;

}

export interface RetryHooks {

  beforeAttempt?(
    ctx: RetryContext
  ): Promise<void> | void;

  afterAttempt?(
    ctx: RetryContext
  ): Promise<void> | void;

  beforeRetry?(
    ctx: RetryContext
  ): Promise<void> | void;

  exhausted?(
    ctx: RetryContext
  ): Promise<void> | void;

}

export interface RetryExecutorOptions<T>
  extends RetryOptions {

  operation: () => Promise<T>;

  shouldRetry?: (
    error: unknown,
    attempt: number
  ) => boolean;

  shouldRetryResponse?: (
    response: Response,
    attempt: number
  ) => boolean;

  hooks?: RetryHooks;

  abortSignal?: AbortSignal;

  maxElapsedTimeMs?: number;

  jitter?: boolean;

}

const DEFAULT_OPTIONS: Required<
  Omit<
    RetryExecutorOptions<unknown>,
    | "operation"
    | "shouldRetry"
    | "shouldRetryResponse"
    | "hooks"
    | "abortSignal"
  >
> = {

  enabled: true,

  maxAttempts: 3,

  initialDelayMs: 250,

  maxDelayMs: 5000,

  multiplier: 2,

  retryOnNetworkError: true,

  retryOnStatus: [
    429,
    500,
    502,
    503,
    504,
  ],

  maxElapsedTimeMs: 30000,

  jitter: true,

};

export async function retry<T>(
  options: RetryExecutorOptions<T>
): Promise<T> {

  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const started = Date.now();

  let delay =
    config.initialDelayMs;

  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= config.maxAttempts;
    attempt++
  ) {

    if (
      config.abortSignal?.aborted
    ) {
      throw new DOMException(
        "Operation aborted",
        "AbortError"
      );
    }

    const ctx: RetryContext = {

      attempt,

      maxAttempts:
        config.maxAttempts,

      delayMs: delay,

      error: lastError,

    };

    await config.hooks?.beforeAttempt?.(
      ctx
    );

    try {

      const result =
        await config.operation();

      if (
        result instanceof Response &&
        config.shouldRetryResponse
      ) {

        if (
          config.shouldRetryResponse(
            result,
            attempt
          )
        ) {

          if (
            attempt >=
            config.maxAttempts
          ) {

            await config.hooks?.exhausted?.(
              ctx
            );

            return result as T;

          }

          delay =
            calculateDelay(
              delay,
              config
            );

          await config.hooks?.beforeRetry?.({
            ...ctx,
            response: result,
            delayMs: delay,
          });

          await sleep(
            delay,
            config.abortSignal
          );

          continue;

        }

      }

      await config.hooks?.afterAttempt?.(
        ctx
      );

      return result;

    } catch (error) {

      lastError = error;

      if (
        !config.enabled
      ) {
        throw error;
      }

      if (
        Date.now() -
          started >
        config.maxElapsedTimeMs
      ) {

        throw error;

      }

      const shouldRetry =

        config.shouldRetry
          ? config.shouldRetry(
              error,
              attempt
            )
          : defaultRetryPredicate(
              error
            );

      if (
        !shouldRetry ||
        attempt >=
          config.maxAttempts
      ) {

        await config.hooks?.exhausted?.(
          {
            ...ctx,
            error,
          }
        );

        throw error;

      }

      delay =
        calculateDelay(
          delay,
          config
        );

      await config.hooks?.beforeRetry?.({
        ...ctx,
        error,
        delayMs: delay,
      });

      await sleep(
        delay,
        config.abortSignal
      );

    }

  }

  throw lastError;

}

function calculateDelay(

  current: number,

  options: {

    multiplier: number;

    maxDelayMs: number;

    jitter: boolean;

  }

): number {

  let next = Math.min(

    current *
      options.multiplier,

    options.maxDelayMs

  );

  if (
    options.jitter
  ) {

    next =
      Math.random() *
      next;

  }

  return Math.round(next);

}

function defaultRetryPredicate(

  error: unknown

): boolean {

  if (
    error instanceof TypeError
  ) {

    return true;

  }

  if (
    error instanceof DOMException &&
    error.name !==
      "AbortError"
  ) {

    return true;

  }

  return false;

}

export async function sleep(

  ms: number,

  signal?: AbortSignal

): Promise<void> {

  if (
    ms <= 0
  ) {

    return;

  }

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const id =
        setTimeout(
          resolve,
          ms
        );

      signal?.addEventListener(
        "abort",
        () => {

          clearTimeout(
            id
          );

          reject(
            new DOMException(
              "Aborted",
              "AbortError"
            )
          );

        },
        {
          once: true,
        }
      );

    }
  );

}

/**
 * Parses Retry-After header.
 */
export function parseRetryAfter(
  value: string | null
): number | null {

  if (!value) {

    return null;

  }

  const seconds =
    Number(value);

  if (
    !Number.isNaN(seconds)
  ) {

    return (
      seconds * 1000
    );

  }

  const date =
    Date.parse(value);

  if (
    Number.isNaN(date)
  ) {

    return null;

  }

  return Math.max(
    date -
      Date.now(),
    0
  );

}

/**
 * Standard HTTP retry predicate.
 */
export function shouldRetryHttp(
  response: Response,
  options: RetryOptions
): boolean {

  return (
    options.retryOnStatus?.includes(
      response.status
    ) ?? false
  );

}