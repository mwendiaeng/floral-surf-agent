/**
 * agent/state/reducers/runtime.ts
 */

import type {

    ExecutionEvent,
    RuntimeState,
    StoredEvent,

} from "../types";

import {

    AgentStatus,

} from "../types";

import {

    now,

} from "../utils/timestamps";

/* -------------------------------------------------------------------------- */
/* Clone                                                                      */
/* -------------------------------------------------------------------------- */

function cloneRuntime(

    runtime: RuntimeState

): RuntimeState {

    return {

        ...runtime,

        context: {

            ...runtime.context,

            metadata: {

                ...runtime.context.metadata,

            },

        },

        statistics: {

            ...runtime.statistics,

        },

    };

}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

export function setStatus(

    runtime: RuntimeState,

    status: AgentStatus

): RuntimeState {

    if (

        runtime.status === status

    ) {

        return runtime;

    }

    const next =

        cloneRuntime(

            runtime

        );

    next.status =

        status;

    next.updatedAt =

        now();

    return next;

}

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

export function setContextValue(

    runtime: RuntimeState,

    key: string,

    value: unknown

): RuntimeState {

    const next =

        cloneRuntime(

            runtime

        );

    next.context.metadata[key] =

        value;

    next.updatedAt =

        now();

    return next;

}

export function removeContextValue(

    runtime: RuntimeState,

    key: string

): RuntimeState {

    const next =

        cloneRuntime(

            runtime

        );

    delete next.context.metadata[key];

    next.updatedAt =

        now();

    return next;

}

export function clearContext(

    runtime: RuntimeState

): RuntimeState {

    const next =

        cloneRuntime(

            runtime

        );

    next.context = {

        metadata: {},

    };

    next.updatedAt =

        now();

    return next;

}

/* -------------------------------------------------------------------------- */
/* Statistics                                                                 */
/* -------------------------------------------------------------------------- */

export function touch(

    runtime: RuntimeState

): RuntimeState {

    const next =

        cloneRuntime(

            runtime

        );

    next.updatedAt =

        now();

    next.statistics.updatedAt =

        next.updatedAt;

    return next;

}

export function syncStatistics(

    runtime: RuntimeState,

    values: {

        totalTokens: number;

        promptTokens: number;

        completionTokens: number;

        estimatedCost: number;

    }

): RuntimeState {

    const next =

        cloneRuntime(

            runtime

        );

    next.statistics.totalTokens =

        values.totalTokens;

    next.statistics.promptTokens =

        values.promptTokens;

    next.statistics.completionTokens =

        values.completionTokens;

    next.statistics.estimatedCost =

        values.estimatedCost;

    next.statistics.updatedAt =

        now();

    return next;

}

export function complete(

    runtime: RuntimeState

): RuntimeState {

    const next =

        cloneRuntime(

            runtime

        );

    const finished =

        now();

    next.status =

        AgentStatus.Completed;

    next.updatedAt =

        finished;

    next.statistics.updatedAt =

        finished;

    next.statistics.completedAt =

        finished;

    next.statistics.totalDuration =

        finished -

        next.statistics.startedAt;

    return next;

}

/* -------------------------------------------------------------------------- */
/* Error                                                                      */
/* -------------------------------------------------------------------------- */

export function fail(

    runtime: RuntimeState,

    error: Error

): RuntimeState {

    const next =

        cloneRuntime(

            runtime

        );

    next.status =

        AgentStatus.Error;

    next.context.metadata.lastError = {

        name:

            error.name,

        message:

            error.message,

        stack:

            error.stack,

        timestamp:

            now(),

    };

    next.updatedAt =

        now();

    return next;

}

/* -------------------------------------------------------------------------- */
/* Cancel                                                                     */
/* -------------------------------------------------------------------------- */

export function cancel(

    runtime: RuntimeState

): RuntimeState {

    return setStatus(

        runtime,

        AgentStatus.Cancelled

    );

}

/* -------------------------------------------------------------------------- */
/* Reducer                                                                    */
/* -------------------------------------------------------------------------- */

export function runtimeReducer(

    runtime: RuntimeState,

    stored: StoredEvent

): RuntimeState {

    const event: ExecutionEvent =

        stored.event;

    let next =

        touch(

            runtime

        );

    if (

        !event.success

    ) {

        next =

            setStatus(

                next,

                AgentStatus.Error

            );

    }

    return next;

}

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

export default runtimeReducer;
