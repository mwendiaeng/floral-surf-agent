/**
 * agent/state/middleware/RetryMiddleware.ts
 */

import type {

    DispatchContext,
    Middleware,
    RetryPolicy,

} from "./types";

import {

    DEFAULT_RETRY_POLICY,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Retry                                                                      */
/* -------------------------------------------------------------------------- */

export class RetryMiddleware implements Middleware {

    readonly name = "retry";

    constructor(

        private readonly policy: RetryPolicy =

            DEFAULT_RETRY_POLICY

    ) { }

    before(

        context: DispatchContext

    ): void {

        context.metadata.retryPolicy =

            this.policy;

    }

}

export async function withRetry<T>(

    operation: () => Promise<T>,

    policy: RetryPolicy =

        DEFAULT_RETRY_POLICY

): Promise<T> {

    let lastError: unknown;

    for (

        let attempt = 1;

        attempt <= policy.maxAttempts;

        attempt++

    ) {

        try {

            return await operation();

        }

        catch (

            error

        ) {

            lastError = error;

            const shouldRetry =

                policy.shouldRetry?.(

                    error,

                    attempt

                ) ?? true;

            if (

                !shouldRetry

                || attempt >= policy.maxAttempts

            ) {

                break;

            }

            if (

                policy.delayMs

                && policy.delayMs > 0

            ) {

                await new Promise(

                    resolve =>

                        setTimeout(

                            resolve,

                            policy.delayMs

                        )

                );

            }

        }

    }

    throw lastError;

}
