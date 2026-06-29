/**
 * agent/state/middleware/LoggingMiddleware.ts
 */

import type {

    DispatchContext,
    Logger,
    Middleware,

} from "./types";

import {

    consoleLogger,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Logging                                                                    */
/* -------------------------------------------------------------------------- */

export class LoggingMiddleware implements Middleware {

    readonly name = "logging";

    constructor(

        private readonly logger: Logger =

            consoleLogger

    ) { }

    before(

        context: DispatchContext

    ): void {

        this.logger.debug(

            "[dispatch] start",

            {

                sessionId: context.sessionId,

                eventType: context.event.event.type,

                eventId: context.event.event.id,

            }

        );

    }

    after(

        context: DispatchContext

    ): void {

        this.logger.debug(

            "[dispatch] complete",

            {

                sessionId: context.sessionId,

                eventType: context.event.event.type,

                duration: context.duration,

            }

        );

    }

}
