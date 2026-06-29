/**
 * agent/state/middleware/MiddlewarePipeline.ts
 */

import type {

    AgentState,
    StoredEvent,

} from "../types";

import type {

    DispatchContext,
    Middleware,
    ReduceFn,

} from "./types";

import {

    MiddlewareAbortError,

    createDispatchContext,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Pipeline                                                                   */
/* -------------------------------------------------------------------------- */

export class MiddlewarePipeline {

    private readonly middlewares: Middleware[] = [];

    use(

        middleware: Middleware

    ): this {

        this.middlewares.push(

            middleware

        );

        return this;

    }

    remove(

        name: string

    ): boolean {

        const index =

            this.middlewares.findIndex(

                middleware =>

                    middleware.name === name

            );

        if (

            index < 0

        ) {

            return false;

        }

        this.middlewares.splice(

            index,

            1

        );

        return true;

    }

    has(

        name: string

    ): boolean {

        return this.middlewares.some(

            middleware =>

                middleware.name === name

        );

    }

    list(): readonly Middleware[] {

        return this.middlewares;

    }

    clear(): void {

        this.middlewares.length = 0;

    }

    async run(

        state: AgentState,

        event: StoredEvent,

        reduce: ReduceFn

    ): Promise<AgentState> {

        const context =

            createDispatchContext(

                state,

                event

            );

        for (

            const middleware of this.middlewares

        ) {

            await middleware.before?.(

                context

            );

            if (

                context.aborted

            ) {

                throw new MiddlewareAbortError(

                    context.abortReason ??

                    "Dispatch aborted by middleware."

                );

            }

        }

        const nextState =

            reduce(

                state,

                event

            );

        context.nextState =

            nextState;

        context.duration =

            Date.now() -

            context.startedAt;

        for (

            let index =

                this.middlewares.length - 1;

            index >= 0;

            index--

        ) {

            await this.middlewares[index].after?.(

                context

            );

        }

        return nextState;

    }

}
