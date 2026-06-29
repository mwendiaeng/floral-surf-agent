/**
 * agent/state/reducers/execution.ts
 */

import type {

    ExecutionEvent,
    ExecutionState,
    ExecutionStatistics,
    ModelInvocationEvent,
    StoredEvent,
    ToolExecutionEvent,

} from "../types";

import {

    AgentStatus,
    ExecutionEventType,

} from "../types";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function cloneExecution(

    execution: ExecutionState

): ExecutionState {

    return {

        ...execution,

        events: [

            ...execution.events,

        ],

        statistics: {

            ...execution.statistics,

            tokenUsage: {

                ...execution.statistics.tokenUsage,

            },

        },

    };

}

/* -------------------------------------------------------------------------- */
/* Event Log                                                                  */
/* -------------------------------------------------------------------------- */

export function appendEvent(

    execution: ExecutionState,

    event: ExecutionEvent

): ExecutionState {

    const next =

        cloneExecution(

            execution

        );

    next.events.push(

        event

    );

    next.currentEvent =

        event;

    return next;

}

/* -------------------------------------------------------------------------- */
/* Iteration                                                                  */
/* -------------------------------------------------------------------------- */

export function incrementIteration(

    execution: ExecutionState

): ExecutionState {

    const next =

        cloneExecution(

            execution

        );

    next.iteration++;

    next.statistics.iterations++;

    return next;

}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

export function setExecutionStatus(

    execution: ExecutionState,

    status: AgentStatus

): ExecutionState {

    if (

        execution.status === status

    ) {

        return execution;

    }

    return {

        ...execution,

        status,

    };

}

/* -------------------------------------------------------------------------- */
/* Event Handler Registry                                                     */
/* -------------------------------------------------------------------------- */

type StatisticsEventHandler<T extends ExecutionEvent = ExecutionEvent> =

    (stats: ExecutionStatistics, event: T) => void;

const statisticsHandlers =

    new Map<ExecutionEventType, StatisticsEventHandler>();

statisticsHandlers.set(

    ExecutionEventType.Tool,

    (stats, event) => {

        const e =

            event as ToolExecutionEvent;

        stats.toolCalls++;

        if (

            e.success

        ) {

            stats.successfulToolCalls++;

        }

        else {

            stats.failedToolCalls++;

        }

    }

);

statisticsHandlers.set(

    ExecutionEventType.Model,

    (stats, event) => {

        const e =

            event as ModelInvocationEvent;

        stats.modelCalls++;

        if (

            e.tokenUsage

        ) {

            stats.tokenUsage.prompt +=

                e.tokenUsage.prompt;

            stats.tokenUsage.completion +=

                e.tokenUsage.completion;

            stats.tokenUsage.total +=

                e.tokenUsage.total;

        }

        if (

            e.estimatedCost

        ) {

            stats.totalCost +=

                e.estimatedCost;

        }

        if (

            e.duration

        ) {

            stats.totalLatency +=

                e.duration;

        }

    }

);

statisticsHandlers.set(

    ExecutionEventType.Reasoning,

    (stats) => {

        stats.reasoningSteps++;

    }

);

statisticsHandlers.set(

    ExecutionEventType.Workflow,

    (stats) => {

        stats.workflowSteps++;

    }

);

statisticsHandlers.set(

    ExecutionEventType.Message,

    (_stats, _event) => {}

);

statisticsHandlers.set(

    ExecutionEventType.Planning,

    (_stats, _event) => {}

);

statisticsHandlers.set(

    ExecutionEventType.Memory,

    (_stats, _event) => {}

);

statisticsHandlers.set(

    ExecutionEventType.Retrieval,

    (_stats, _event) => {}

);

statisticsHandlers.set(

    ExecutionEventType.System,

    (_stats, _event) => {}

);

/* -------------------------------------------------------------------------- */
/* Statistics                                                                 */
/* -------------------------------------------------------------------------- */

export function updateStatistics(

    execution: ExecutionState,

    event: ExecutionEvent

): ExecutionState {

    const next =

        cloneExecution(

            execution

        );

    const handler =

        statisticsHandlers.get(event.type);

    if (

        handler

    ) {

        handler(

            next.statistics,

            event

        );

    }

    return next;

}

/* -------------------------------------------------------------------------- */
/* Current Event                                                              */
/* -------------------------------------------------------------------------- */

export function clearCurrentEvent(

    execution: ExecutionState

): ExecutionState {

    return {

        ...execution,

        currentEvent: undefined,

    };

}

/* -------------------------------------------------------------------------- */
/* Reducer                                                                    */
/* -------------------------------------------------------------------------- */

export function executionReducer(

    execution: ExecutionState,

    stored: StoredEvent

): ExecutionState {

    let next =

        appendEvent(

            execution,

            stored.event

        );

    next =

        incrementIteration(

            next

        );

    next =

        updateStatistics(

            next,

            stored.event

        );

    if (

        !stored.event.success

    ) {

        next =

            setExecutionStatus(

                next,

                AgentStatus.Error

            );

    }

    return next;

}

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

export default executionReducer;
