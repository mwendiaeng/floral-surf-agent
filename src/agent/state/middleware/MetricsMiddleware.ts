/**
 * agent/state/middleware/MetricsMiddleware.ts
 */

import type {

    DispatchContext,
    Middleware,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Metrics                                                                    */
/* -------------------------------------------------------------------------- */

export interface DispatchMetrics {

    totalDispatches: number;

    totalDuration: number;

    lastDuration?: number;

    aborted: number;

}

export class MetricsMiddleware implements Middleware {

    readonly name = "metrics";

    private readonly metrics: DispatchMetrics = {

        totalDispatches: 0,

        totalDuration: 0,

        aborted: 0,

    };

    getMetrics(): Readonly<DispatchMetrics> {

        return this.metrics;

    }

    reset(): void {

        this.metrics.totalDispatches = 0;

        this.metrics.totalDuration = 0;

        this.metrics.lastDuration = undefined;

        this.metrics.aborted = 0;

    }

    before(

        context: DispatchContext

    ): void {

        context.metadata.metricsStart =

            performance.now();

    }

    after(

        context: DispatchContext

    ): void {

        const start =

            context.metadata.metricsStart as

            number | undefined;

        const duration =

            start !== undefined

                ? performance.now() - start

                : (context.duration ?? 0);

        this.metrics.totalDispatches++;

        this.metrics.totalDuration +=

            duration;

        this.metrics.lastDuration =

            duration;

        context.metadata.metrics = {

            duration,

            totalDispatches:

                this.metrics.totalDispatches,

        };

    }

}
