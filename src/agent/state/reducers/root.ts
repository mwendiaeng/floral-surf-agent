/**
 * agent/state/reducers/root.ts
 */

import type {

    AgentState,
    ConversationState,
    ExecutionState,
    MemoryState,
    PlannerState,
    RuntimeState,
    StoredEvent,

} from "../types";

import {

    AgentStatus,

} from "../types";

import {

    conversationReducer,

} from "./conversation";

import {

    executionReducer,

} from "./execution";

import {

    plannerReducer,

} from "./planner";

import {

    memoryReducer,

} from "./memory";

import {

    runtimeReducer,
    syncStatistics,

} from "./runtime";

/* -------------------------------------------------------------------------- */
/* Slice Reducers                                                             */
/* -------------------------------------------------------------------------- */

export interface ConversationSliceReducer {

    (

        state: ConversationState,

        event: StoredEvent

    ): ConversationState;

}

export interface ExecutionSliceReducer {

    (

        state: ExecutionState,

        event: StoredEvent

    ): ExecutionState;

}

export interface PlannerSliceReducer {

    (

        state: PlannerState,

        event: StoredEvent

    ): PlannerState;

}

export interface MemorySliceReducer {

    (

        state: MemoryState,

        event: StoredEvent

    ): MemoryState;

}

export interface RuntimeSliceReducer {

    (

        state: RuntimeState,

        event: StoredEvent

    ): RuntimeState;

}

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

export function rootReducer(

    state: AgentState,

    event: StoredEvent

): AgentState {

    const conversation =

        conversationReducer(

            state.conversation,

            event

        );

    const execution =

        executionReducer(

            state.execution,

            event

        );

    const planner =

        plannerReducer(

            state.planner,

            event

        );

    const memory =

        memoryReducer(

            state.memory,

            event

        );

    let runtime =

        runtimeReducer(

            state.runtime,

            event

        );

    runtime =

        syncStatistics(

            runtime,

            {

                totalTokens:

                    execution.statistics.tokenUsage.total,

                promptTokens:

                    execution.statistics.tokenUsage.prompt,

                completionTokens:

                    execution.statistics.tokenUsage.completion,

                estimatedCost:

                    execution.statistics.totalCost,

            }

        );

    if (

        execution.status !== runtime.status

        && (
            execution.status === AgentStatus.Error
            || execution.status === AgentStatus.Completed
            || execution.status === AgentStatus.Cancelled
        )

    ) {

        runtime = {

            ...runtime,

            status: execution.status,

        };

    }

    return {

        ...state,

        conversation,

        execution,

        planner,

        memory,

        runtime,

    };

}

/* -------------------------------------------------------------------------- */
/* Batch                                                                      */
/* -------------------------------------------------------------------------- */

export function reduceEvents(

    state: AgentState,

    events: readonly StoredEvent[]

): AgentState {

    let current = state;

    for (

        const event of events

    ) {

        current =

            rootReducer(

                current,

                event

            );

    }

    return current;

}

/* -------------------------------------------------------------------------- */
/* Replay                                                                     */
/* -------------------------------------------------------------------------- */

export function replay(

    initial: AgentState,

    events: readonly StoredEvent[]

): AgentState {

    return reduceEvents(

        initial,

        events

    );

}

/* -------------------------------------------------------------------------- */
/* Default                                                                    */
/* -------------------------------------------------------------------------- */

export default rootReducer;
