/**
 * agent/state/middleware/TelemetryMiddleware.ts
 */

import type {

    DispatchContext,
    Middleware,
    TelemetrySink,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Telemetry                                                                  */
/* -------------------------------------------------------------------------- */

export class TelemetryMiddleware implements Middleware {

    readonly name = "telemetry";

    constructor(

        private readonly sink?: TelemetrySink

    ) { }

    before(

        context: DispatchContext

    ): void {

        this.sink?.event(

            "dispatch.start",

            {

                sessionId: context.sessionId,

                eventType: context.event.event.type,

            }

        );

    }

    after(

        context: DispatchContext

    ): void {

        const duration =

            context.duration ?? 0;

        this.sink?.record(

            "dispatch.duration",

            duration,

            {

                eventType: context.event.event.type,

            }

        );

        this.sink?.event(

            "dispatch.complete",

            {

                sessionId: context.sessionId,

                eventType: context.event.event.type,

                duration,

            }

        );

    }

}
