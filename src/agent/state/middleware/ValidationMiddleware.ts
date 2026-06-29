/**
 * agent/state/middleware/ValidationMiddleware.ts
 */

import type {

    DispatchContext,
    Middleware,

} from "./types";

import {

    validateEvent,

} from "../utils/validation";

import {

    MiddlewareAbortError,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

export class ValidationMiddleware implements Middleware {

    readonly name = "validation";

    before(

        context: DispatchContext

    ): void {

        const result =

            validateEvent(

                context.event.event

            );

        if (

            !result.valid

        ) {

            throw new MiddlewareAbortError(

                result.errors.join("\n")

            );

        }

    }

}
