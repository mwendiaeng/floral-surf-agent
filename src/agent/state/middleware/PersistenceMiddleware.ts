/**
 * agent/state/middleware/PersistenceMiddleware.ts
 */

import type {

    EventStore,

} from "../types";

import {

    withRetry,

} from "./RetryMiddleware";

import {

    DEFAULT_RETRY_POLICY,
    RetryableError,

} from "./types";

import type {

    DispatchContext,
    Middleware,
    RetryPolicy,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Persistence                                                                */
/* -------------------------------------------------------------------------- */

export class PersistenceMiddleware implements Middleware {

    readonly name = "persistence";

    constructor(

        private readonly store: EventStore

    ) { }

    async before(

        context: DispatchContext

    ): Promise<void> {

        const policy =

            (context.metadata.retryPolicy as

            RetryPolicy | undefined) ??

            DEFAULT_RETRY_POLICY;

        await withRetry(

            async () => {

                try {

                    await this.store.append(

                        context.sessionId,

                        context.event

                    );

                }

                catch (

                    error

                ) {

                    throw new RetryableError(

                        "Failed to persist event.",

                        error

                    );

                }

            },

            policy

        );

        context.metadata.persisted = true;

    }

}
