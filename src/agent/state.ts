/**
 * agent/state.ts
 *
 * Agent execution state.
 *
 * Everything the agent knows
 * lives here.
 */

import type {

    ParsedDocument,

} from "../tools/fetch/parser";

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

export type MessageRole =

    | "system"

    | "user"

    | "assistant"

    | "tool";

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

export enum AgentStatus {

    Idle = "idle",

    Planning = "planning",

    Reasoning = "reasoning",

    ToolExecution = "tool_execution",

    Waiting = "waiting",

    Streaming = "streaming",

    Finished = "finished",

    Error = "error",

    Cancelled = "cancelled",

}

/* -------------------------------------------------------------------------- */
/* Messages                                                                   */
/* -------------------------------------------------------------------------- */

export interface AgentMessage {

    id: string;

    role: MessageRole;

    content: string;

    timestamp: number;

    name?: string;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Reasoning Step                                                             */
/* -------------------------------------------------------------------------- */

export interface ReasoningStep {

    id: string;

    name: string;

    input?: unknown;

    output?: unknown;

    startedAt: number;

    completedAt?: number;

}

/* -------------------------------------------------------------------------- */
/* Tool Execution                                                             */
/* -------------------------------------------------------------------------- */

export interface ToolExecution {

    id: string;

    tool: string;

    input: unknown;

    output?: unknown;

    success: boolean;

    duration?: number;

    error?: string;

}

/* -------------------------------------------------------------------------- */
/* Document                                                                    */
/* -------------------------------------------------------------------------- */

export interface RetrievedDocument {

    url: string;

    document: ParsedDocument;

}

/* -------------------------------------------------------------------------- */
/* Agent State                                                                */
/* -------------------------------------------------------------------------- */

export interface AgentState {

    id: string;

    sessionId: string;

    status: AgentStatus;

    createdAt: number;

    updatedAt: number;

    iteration: number;

    messages: AgentMessage[];

    reasoning: ReasoningStep[];

    toolExecutions: ToolExecution[];

    retrievedDocuments: RetrievedDocument[];

    variables: Record<string, unknown>;

    metadata: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Snapshot                                                                   */
/* -------------------------------------------------------------------------- */

export interface AgentSnapshot {

    timestamp: number;

    state: AgentState;

}

/* -------------------------------------------------------------------------- */
/* Model Invocation                                                           */
/* -------------------------------------------------------------------------- */

export interface ModelInvocation {

    id: string;

    provider: string;

    model: string;

    startedAt: number;

    completedAt?: number;

    duration?: number;

    promptTokens?: number;

    completionTokens?: number;

    totalTokens?: number;

    estimatedCost?: number;

    temperature?: number;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Agent Action                                                               */
/* -------------------------------------------------------------------------- */

export interface AgentAction {

    id: string;

    type:

    | "plan"

    | "reason"

    | "tool"

    | "llm"

    | "memory"

    | "retrieve"

    | "observe"

    | "respond";

    name: string;

    startedAt: number;

    completedAt?: number;

    success: boolean;

    input?: unknown;

    output?: unknown;

    error?: string;

}

/* -------------------------------------------------------------------------- */
/* Timeline                                                                   */
/* -------------------------------------------------------------------------- */

export interface TimelineEvent {

    id: string;

    timestamp: number;

    category:

    | "message"

    | "tool"

    | "reasoning"

    | "llm"

    | "memory"

    | "planner"

    | "system";

    title: string;

    payload?: unknown;

}

/* -------------------------------------------------------------------------- */
/* Execution Statistics                                                       */
/* -------------------------------------------------------------------------- */

export interface ExecutionStatistics {

    toolCalls: number;

    modelCalls: number;

    reasoningSteps: number;

    totalTokens: number;

    estimatedCost: number;

    totalDuration: number;

}

/* -------------------------------------------------------------------------- */
/* AgentState Extension                                                       */
/* -------------------------------------------------------------------------- */

declare module "./state" {

    interface AgentState {

        actions: AgentAction[];

        modelInvocations: ModelInvocation[];

        timeline: TimelineEvent[];

    }

}


/* -------------------------------------------------------------------------- */
/* Manager                                                                    */
/* -------------------------------------------------------------------------- */

export class StateManager {

    protected state: AgentState;

    protected snapshots: AgentSnapshot[] = [];

    constructor(

        initial: AgentState

    ) {

        this.state =

            structuredClone(

                initial

            );

    }

    /* ---------------------------------------------------------------------- */
    /* Access                                                                  */
    /* ---------------------------------------------------------------------- */

    get(): Readonly<AgentState> {

        return this.state;

    }

    clone(): AgentState {

        return structuredClone(

            this.state

        );

    }

    protected touch(): void {

        this.state.updatedAt =

            Date.now();

    }

    /* ---------------------------------------------------------------------- */
    /* Status                                                                  */
    /* ---------------------------------------------------------------------- */

    setStatus(

        status: AgentStatus

    ): void {

        this.state.status =

            status;

        this.touch();

    }

    incrementIteration(): number {

        this.state.iteration++;

        this.touch();

        return this.state.iteration;

    }

    /* ---------------------------------------------------------------------- */
    /* Messages                                                                */
    /* ---------------------------------------------------------------------- */

    addMessage(

        message: AgentMessage

    ): void {

        this.state.messages.push(

            message

        );

        this.touch();

    }

    addMessages(

        messages: AgentMessage[]

    ): void {

        this.state.messages.push(

            ...messages

        );

        this.touch();

    }

    latestMessage():

        AgentMessage | undefined {

        return this.state.messages.at(

            -1

        );

    }

    clearMessages(): void {

        this.state.messages.length = 0;

        this.touch();

    }

    /* ---------------------------------------------------------------------- */
    /* Reasoning                                                               */
    /* ---------------------------------------------------------------------- */

    addReasoningStep(

        step: ReasoningStep

    ): void {

        this.state.reasoning.push(

            step

        );

        this.touch();

    }

    finishReasoningStep(

        id: string,

        output?: unknown

    ): void {

        const step =

            this.state.reasoning.find(

                item =>

                    item.id === id

            );

        if (

            !step

        ) {

            return;

        }

        step.output = output;

        step.completedAt =

            Date.now();

        this.touch();

    }

    /* ---------------------------------------------------------------------- */
    /* Tool Executions                                                         */
    /* ---------------------------------------------------------------------- */

    addToolExecution(

        execution: ToolExecution

    ): void {

        this.state.toolExecutions.push(

            execution

        );

        this.touch();

    }

    updateToolExecution(

        id: string,

        update: Partial<ToolExecution>

    ): void {

        const execution =

            this.state.toolExecutions.find(

                tool =>

                    tool.id === id

            );

        if (

            !execution

        ) {

            return;

        }

        Object.assign(

            execution,

            update

        );

        this.touch();

    }

    /* ---------------------------------------------------------------------- */
    /* Documents                                                               */
    /* ---------------------------------------------------------------------- */

    addDocument(

        document: RetrievedDocument

    ): void {

        this.state.retrievedDocuments.push(

            document

        );

        this.touch();

    }

    clearDocuments(): void {

        this.state.retrievedDocuments.length = 0;

        this.touch();

    }

    /* ---------------------------------------------------------------------- */
    /* Variables                                                               */
    /* ---------------------------------------------------------------------- */

    setVariable(

        key: string,

        value: unknown

    ): void {

        this.state.variables[key] =

            value;

        this.touch();

    }

    getVariable<T = unknown>(

        key: string

    ): T | undefined {

        return this.state.variables[

            key

        ] as T | undefined;

    }

    removeVariable(

        key: string

    ): void {

        delete this.state.variables[

            key

        ];

        this.touch();

    }

    /* ---------------------------------------------------------------------- */
    /* Metadata                                                                */
    /* ---------------------------------------------------------------------- */

    setMetadata(

        key: string,

        value: unknown

    ): void {

        this.state.metadata[key] =

            value;

        this.touch();

    }

    getMetadata<T = unknown>(

        key: string

    ): T | undefined {

        return this.state.metadata[

            key

        ] as T | undefined;

    }

    /* ---------------------------------------------------------------------- */
    /* Snapshots                                                               */
    /* ---------------------------------------------------------------------- */

    createSnapshot(): AgentSnapshot {

        const snapshot: AgentSnapshot = {

            timestamp:

                Date.now(),

            state:

                this.clone(),

        };

        this.snapshots.push(

            snapshot

        );

        return snapshot;

    }

    latestSnapshot():

        AgentSnapshot | undefined {

        return this.snapshots.at(

            -1

        );

    }

    restoreSnapshot(

        snapshot: AgentSnapshot

    ): void {

        this.state =

            structuredClone(

                snapshot.state

            );

    }

    clearSnapshots(): void {

        this.snapshots.length = 0;

    }


    /* -------------------------------------------------------------------------- */
    /* Actions                                                                    */
    /* -------------------------------------------------------------------------- */

    addAction(

        action: AgentAction

    ): void {

        this.state.actions.push(

            action

        );

        this.touch();

    }

    finishAction(

        id: string,

        output?: unknown,

        error?: Error

    ): void {

        const action =

            this.state.actions.find(

                item =>

                    item.id === id

            );

        if (

            !action

        ) {

            return;

        }

        action.completedAt =

            Date.now();

        action.output =

            output;

        action.success =

            !error;

        if (

            error

        ) {

            action.error =

                error.message;

        }

        this.touch();

    }

    /* -------------------------------------------------------------------------- */
    /* Model Invocations                                                          */
    /* -------------------------------------------------------------------------- */

    addModelInvocation(

        invocation: ModelInvocation

    ): void {

        this.state.modelInvocations.push(

            invocation

        );

        this.touch();

    }

    finishModelInvocation(

        id: string,

        update: Partial<ModelInvocation>

    ): void {

        const invocation =

            this.state.modelInvocations.find(

                model =>

                    model.id === id

            );

        if (

            !invocation

        ) {

            return;

        }

        Object.assign(

            invocation,

            update

        );

        invocation.completedAt ??=

            Date.now();

        invocation.duration ??=

            invocation.completedAt -

            invocation.startedAt;

        this.touch();

    }

    /* -------------------------------------------------------------------------- */
    /* Timeline                                                                   */
    /* -------------------------------------------------------------------------- */

    addTimelineEvent(

        event: TimelineEvent

    ): void {

        this.state.timeline.push(

            event

        );

        this.touch();

    }

    /* -------------------------------------------------------------------------- */
    /* Statistics                                                                 */
    /* -------------------------------------------------------------------------- */

    getExecutionStatistics(): ExecutionStatistics {

        const totalTokens =

            this.state.modelInvocations.reduce(

                (

                    total,

                    invocation

                ) =>

                    total +

                    (

                        invocation.totalTokens ??

                        0

                    ),

                0

            );

        const estimatedCost =

            this.state.modelInvocations.reduce(

                (

                    total,

                    invocation

                ) =>

                    total +

                    (

                        invocation.estimatedCost ??

                        0

                    ),

                0

            );

        const totalDuration =

            this.state.actions.reduce(

                (

                    total,

                    action

                ) =>

                    total +

                    (

                        action.completedAt

                            ? action.completedAt -

                            action.startedAt

                            : 0

                    ),

                0

            );

        return {

            toolCalls:

                this.state.toolExecutions.length,

            modelCalls:

                this.state.modelInvocations.length,

            reasoningSteps:

                this.state.reasoning.length,

            totalTokens,

            estimatedCost,

            totalDuration,

        };

    }

    /* -------------------------------------------------------------------------- */
    /* History                                                                    */
    /* -------------------------------------------------------------------------- */

    clearExecutionHistory(): void {

        this.state.actions.length = 0;

        this.state.modelInvocations.length = 0;

        this.state.timeline.length = 0;

        this.touch();

    }

}

/* -------------------------------------------------------------------------- */
/* Conversation                                                               */
/* -------------------------------------------------------------------------- */

export interface ConversationState {

    messages: AgentMessage[];

    retrievedDocuments: RetrievedDocument[];

    variables: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Execution                                                                  */
/* -------------------------------------------------------------------------- */

export interface ExecutionState {

    status: AgentStatus;

    iteration: number;

    reasoning: ReasoningStep[];

    actions: AgentAction[];

    toolExecutions: ToolExecution[];

    modelInvocations: ModelInvocation[];

    timeline: TimelineEvent[];

}

/* -------------------------------------------------------------------------- */
/* Planner                                                                    */
/* -------------------------------------------------------------------------- */

export interface PlannerGoal {

    id: string;

    description: string;

    completed: boolean;

}

export interface PlannerTask {

    id: string;

    name: string;

    input?: unknown;

    completed: boolean;

}

export interface PlannerState {

    status: string;

    goals: PlannerGoal[];

    completedGoals: PlannerGoal[];

    tasks: PlannerTask[];

}

/* -------------------------------------------------------------------------- */
/* Memory                                                                     */
/* -------------------------------------------------------------------------- */

export interface MemoryState {

    working: Record<string, unknown>;

    shortTerm: Record<string, unknown>;

    longTermReferences: string[];

    retrievals: string[];

}

/* -------------------------------------------------------------------------- */
/* Runtime                                                                    */
/* -------------------------------------------------------------------------- */

export interface RuntimeState {

    id: string;

    sessionId: string;

    createdAt: number;

    updatedAt: number;

    metadata: Record<string, unknown>;

    context: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Statistics                                                                 */
/* -------------------------------------------------------------------------- */

export interface AgentStatistics {

    promptTokens: number;

    completionTokens: number;

    totalTokens: number;

    estimatedCost: number;

    toolCalls: number;

    modelCalls: number;

    successfulTools: number;

    failedTools: number;

    latency: number;

}

/* -------------------------------------------------------------------------- */
/* Checkpoints                                                                */
/* -------------------------------------------------------------------------- */

export interface Checkpoint {

    id: string;

    timestamp: number;

    label?: string;

    state: AgentState;

}

/* -------------------------------------------------------------------------- */
/* Agent State                                                                */
/* -------------------------------------------------------------------------- */

export interface AgentState {

    conversation: ConversationState;

    execution: ExecutionState;

    planner: PlannerState;

    memory: MemoryState;

    runtime: RuntimeState;

    statistics: AgentStatistics;

    checkpoints: Checkpoint[];

}