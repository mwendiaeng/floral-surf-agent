/**
 * agent/state/manager/ExecutionManager.ts
 */

import type {

    AgentStatus,
    ExecutionEvent,
    ExecutionState,
    StoredEvent,

} from "../types";

import {

    createModelEvent,
    createReasoningEvent,
    createSystemEvent,
    createToolEvent,

} from "../events";

import type {

    ReasoningType,

} from "../types";

import {

    clearCurrentEvent,
    setExecutionStatus,

} from "../reducers/execution";

/* -------------------------------------------------------------------------- */
/* Execution Manager                                                          */
/* -------------------------------------------------------------------------- */

export class ExecutionManager {

    constructor(

        private readonly manager: {

            getState(): Readonly<{ execution: ExecutionState }>;

            dispatch(event: StoredEvent): Promise<void>;

        }

    ) { }

    get state(): ExecutionState {

        return this.manager.getState().execution;

    }

    get status(): AgentStatus {

        return this.state.status;

    }

    get iteration(): number {

        return this.state.iteration;

    }

    get events(): readonly ExecutionEvent[] {

        return this.state.events;

    }

    get statistics() {

        return this.state.statistics;

    }

    async recordTool(

        tool: string,

        input: unknown,

        output?: unknown,

        error?: string

    ): Promise<void> {

        await this.manager.dispatch(

            createToolEvent(

                tool,

                input,

                output,

                error

            )

        );

    }

    async recordModel(

        provider: string,

        model: string,

        options?: {

            input?: unknown;

            output?: unknown;

            success?: boolean;

        }

    ): Promise<void> {

        await this.manager.dispatch(

            createModelEvent(

                provider,

                model,

                options

            )

        );

    }

    async recordReasoning(

        reasoningType: ReasoningType,

        input?: unknown,

        output?: unknown

    ): Promise<void> {

        await this.manager.dispatch(

            createReasoningEvent(

                reasoningType,

                input,

                output

            )

        );

    }

    async recordSystem(

        level: "debug" | "info" | "warning" | "error",

        message: string

    ): Promise<void> {

        await this.manager.dispatch(

            createSystemEvent(

                level,

                message

            )

        );

    }

    previewSetStatus(

        status: AgentStatus

    ): ExecutionState {

        return setExecutionStatus(

            this.state,

            status

        );

    }

    previewClearCurrentEvent(): ExecutionState {

        return clearCurrentEvent(

            this.state

        );

    }

}
