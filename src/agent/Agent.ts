/**
 * agent/Agent.ts
 *
 * Top-level agent facade wiring state, services, tools, LLM, and workflow.
 */

import type {

    AgentState,
    Checkpoint,
    CheckpointId,
    StateObserver,
    StoredEvent,
    Subscription,

} from "./state/types";

import {

    AgentStatus,

} from "./state/types";

import {

    StateManager,

} from "./state/manager/StateManager";

import type {

    StateManagerOptions,

} from "./state/manager/StateManager";

import {

    ConversationManager,

} from "./state/manager/ConversationManager";

import {

    ExecutionManager,

} from "./state/manager/ExecutionManager";

import {

    PlannerManager,

} from "./state/manager/PlannerManager";

import {

    MemoryManager,

} from "./state/manager/MemoryManager";

import {

    RuntimeManager,

} from "./state/manager/RuntimeManager";

import {

    StatisticsManager,

} from "./state/manager/StatisticsManager";

import {

    CheckpointManager,

} from "./state/checkpoint/CheckpointManager";

import {

    Recovery,

} from "./state/checkpoint/Recovery";

import {

    PlannerService,

} from "./planner";

import {

    RuntimeService,

} from "./runtime";

import {

    MemoryService,

} from "./memory";

import {

    ToolRegistry,
    toolRegistry,

} from "./tools";

import {

    buildSystemPrompt,

} from "./prompts";

import {

    LLMClient,

} from "./llm";

import type {

    LLMClientOptions,

} from "./llm";

import {

    WorkflowEngine,

} from "./workflow";

import {

    now,

} from "./state/utils/timestamps";

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

export interface AgentOptions {

    state?: StateManagerOptions;

    llm?: LLMClientOptions;

    tools?: ToolRegistry;

}

/* -------------------------------------------------------------------------- */
/* Agent                                                                      */
/* -------------------------------------------------------------------------- */

export class Agent {

    readonly state: StateManager;

    readonly conversation: ConversationManager;

    readonly execution: ExecutionManager;

    readonly planner: PlannerManager;

    readonly memory: MemoryManager;

    readonly runtime: RuntimeManager;

    readonly statistics: StatisticsManager;

    readonly checkpoints: CheckpointManager;

    readonly recovery: Recovery;

    readonly plannerService: PlannerService;

    readonly runtimeService: RuntimeService;

    readonly memoryService: MemoryService;

    readonly tools: ToolRegistry;

    readonly workflow: WorkflowEngine;

    readonly llm?: LLMClient;

    readonly buildSystemPrompt = buildSystemPrompt;

    constructor(

        options: AgentOptions = {}

    ) {

        this.state =

            new StateManager(

                options.state

            );

        this.conversation =

            new ConversationManager(

                this.state

            );

        this.execution =

            new ExecutionManager(

                this.state

            );

        this.planner =

            new PlannerManager(

                this.state

            );

        this.memory =

            new MemoryManager(

                this.state

            );

        this.runtime =

            new RuntimeManager(

                this.state

            );

        this.statistics =

            new StatisticsManager(

                this.state

            );

        this.checkpoints =

            new CheckpointManager(

                this.state.checkpointStore,

                this.state.snapshotStore

            );

        this.recovery =

            new Recovery({

                sessionId:

                    this.state.getState().runtime.sessionId,

                store: this.state.store,

                checkpoints: this.checkpoints,

                initialState:

                    this.state.cloneState(),

            });

        this.plannerService =

            new PlannerService(

                this.planner

            );

        this.runtimeService =

            new RuntimeService(

                this.runtime

            );

        this.memoryService =

            new MemoryService(

                this.memory

            );

        this.tools =

            options.tools ?? toolRegistry;

        this.workflow =

            new WorkflowEngine();

        if (

            options.llm

        ) {

            this.llm =

                new LLMClient(

                    options.llm

                );

        }

    }

    /* ---------------------------------------------------------------------- */
    /* State                                                                   */
    /* ---------------------------------------------------------------------- */

    getState(): Readonly<AgentState> {

        return this.state.getState();

    }

    async dispatch(

        event: StoredEvent

    ): Promise<void> {

        await this.state.dispatch(

            event

        );

    }

    subscribe(

        observer: StateObserver

    ): Subscription {

        return this.state.subscribe(

            observer

        );

    }

    async checkpoint(

        label?: string

    ): Promise<Checkpoint> {

        return this.state.createCheckpoint(

            label

        );

    }

    async restore(

        checkpointId: CheckpointId

    ): Promise<boolean> {

        return this.state.restore(

            checkpointId

        );

    }

    transitionStatus(

        status: AgentStatus

    ): void {

        const current =

            this.state.cloneState();

        const timestamp =

            now();

        this.state.replace({

            ...current,

            runtime: {

                ...current.runtime,

                status,

                updatedAt: timestamp,

            },

            execution: {

                ...current.execution,

                status,

            },

        });

    }

}
