/**
 * agent/state/defaults.ts
 */

import {

    AgentStatus,
    ExecutionEventType,
    GoalStatus,
    MemoryKind,
    MessageRole,
    PlannerStatus,
    TaskStatus,
    WorkflowNodeStatus,

} from "./types";

import type {

    AgentMessage,
    AgentState,
    Checkpoint,
    ConversationState,
    ExecutionState,
    Goal,
    MemoryVectorReference,
    MemoryIndex,
    MemoryItem,
    MemoryRetrieval,
    MemoryState,
    PlannerGraph,
    PlannerState,
    RetrievedDocument,
    RuntimeContext,
    RuntimeState,
    RuntimeStatistics,
    TaskEdge,
    TaskNode,
    WorkflowDefinition,
    WorkflowEdge,
    WorkflowNode,

} from "./types";

import {

    EMPTY_EXECUTION_STATS,

} from "./constants";

import {

    createAgentId,
    createCheckpointId,
    createId,
    createMessageId,
    createSessionId,

} from "./utils/ids";

import {

    now,

} from "./utils/timestamps";
import type { ParsedDocument } from "../../tools/fetch/parser";

/* -------------------------------------------------------------------------- */
/* Conversation                                                               */
/* -------------------------------------------------------------------------- */

export function createMessage(

    content = "",

    role = MessageRole.System

): AgentMessage {

    return {

        id: createMessageId(),

        role,

        content,

        blocks: [],

        createdAt: now(),

        metadata: {},

    };

}

export function createConversationState(): ConversationState {

    return {

        messages: [],

        documents: [],

        variables: {},

    };

}

/* -------------------------------------------------------------------------- */
/* Documents                                                                  */
/* -------------------------------------------------------------------------- */

export function createRetrievedDocument(): RetrievedDocument {

    return {

        id: createId("doc"),

        url: "",

        document: {} as ParsedDocument,

        score: 0,

        metadata: {},

    };

}

/* -------------------------------------------------------------------------- */
/* Planner                                                                    */
/* -------------------------------------------------------------------------- */

export function createGoal(

    title = ""

): Goal {

    const timestamp = now();

    return {

        id: createId("goal"),

        title,

        priority: 100,

        status: GoalStatus.Pending,

        createdAt: timestamp,

        updatedAt: timestamp,

        metadata: {},

    };

}

export function createTaskNode(

    title = ""

): TaskNode {

    return {

        id: createId("task"),

        title,

        status: TaskStatus.Pending,

        retryCount: 0,

        maxRetries: 3,

        createdAt: now(),

        metadata: {},

    };

}

export function createTaskEdge(

    from = "",

    to = ""

): TaskEdge {

    return {

        from,

        to,

    };

}

export function createPlannerGraph(): PlannerGraph {

    return {

        nodes: [],

        edges: [],

    };

}

export function createPlannerState(): PlannerState {

    return {

        status: PlannerStatus.Idle,

        goals: [],

        completedGoals: [],

        tasks: [],

        dependencies: [],

        graph: createPlannerGraph(),

    };

}

/* -------------------------------------------------------------------------- */
/* Memory                                                                     */
/* -------------------------------------------------------------------------- */

export function createMemoryItem(): MemoryItem {

    const timestamp = now();

    return {

        id: createId("memory"),

        kind: MemoryKind.Working,

        key: "",

        value: undefined,

        createdAt: timestamp,

        updatedAt: timestamp,

        metadata: {},

    };

}

export function createMemoryRetrieval(): MemoryRetrieval {

    return {

        id: createId("retrieval"),

        query: "",

        results: [],

        duration: 0,

        createdAt: now(),

    };

}

export function createMemoryVectorReference(
    memoryId: string
): MemoryVectorReference {

    return {

        id: createId("embedding"),

        memoryId,

        createdAt: now(),

    };

}

export function createMemoryIndex(
    name: string,
    layer: MemoryIndex["layer"] = "all"
): MemoryIndex {

    const timestamp = now();

    return {

        id: createId("index"),

        name,

        layer,

        entryIds: [],

        createdAt: timestamp,

        updatedAt: timestamp,

    };

}

export function createMemoryState(): MemoryState {

    return {

        working: {},

        episodic: [],

        semantic: [],

        procedural: [],

        retrieval: [],

        embeddings: [],

        indexes: [],

    };

}

/* -------------------------------------------------------------------------- */
/* Runtime                                                                    */
/* -------------------------------------------------------------------------- */

export function createRuntimeContext(): RuntimeContext {

    return {

        metadata: {},

    };

}

export function createRuntimeStatistics(): RuntimeStatistics {

    return {

        startedAt: now(),

        updatedAt: now(),

        totalDuration: 0,

        totalTokens: 0,

        promptTokens: 0,

        completionTokens: 0,

        estimatedCost: 0,

    };

}

export function createRuntimeState(): RuntimeState {

    const timestamp = now();

    return {

        id: createAgentId(),

        sessionId: createSessionId(),

        status: AgentStatus.Idle,

        createdAt: timestamp,

        updatedAt: timestamp,

        context: createRuntimeContext(),

        statistics: createRuntimeStatistics(),

    };

}

/* -------------------------------------------------------------------------- */
/* Execution                                                                  */
/* -------------------------------------------------------------------------- */

export function createExecutionState(): ExecutionState {

    return {

        status: AgentStatus.Idle,

        iteration: 0,

        currentEvent: undefined,

        events: [],

        reasoning: [],

        actions: [],

        toolExecutions: [],

        modelInvocations: [],

        timeline: [],

        statistics: {

            ...EMPTY_EXECUTION_STATS,

            tokenUsage: {

                ...EMPTY_EXECUTION_STATS.tokenUsage,

            },

        },

    };

}

/* -------------------------------------------------------------------------- */
/* Workflow                                                                   */
/* -------------------------------------------------------------------------- */

export function createWorkflowNode(

    name = ""

): WorkflowNode {

    return {

        id: createId("node"),

        name,

        status: WorkflowNodeStatus.Pending,

        metadata: {},

    };

}

export function createWorkflowEdge(): WorkflowEdge {

    return {

        from: "",

        to: "",

    };

}

export function createWorkflowDefinition(): WorkflowDefinition {

    return {

        id: createId("workflow"),

        name: "",

        nodes: [],

        edges: [],

    };

}

/* -------------------------------------------------------------------------- */
/* Checkpoints                                                                */
/* -------------------------------------------------------------------------- */

export function createCheckpoint(): Checkpoint {

    return {

        id: createCheckpointId(),

        sequence: 0,

        createdAt: now(),

        eventCount: 0,

        stateHash: "",

    };

}

/* -------------------------------------------------------------------------- */
/* Agent State                                                                */
/* -------------------------------------------------------------------------- */

export function createAgentState(): AgentState {

    return {

        conversation:

            createConversationState(),

        execution:

            createExecutionState(),

        planner:

            createPlannerState(),

        memory:

            createMemoryState(),

        runtime:

            createRuntimeState(),

        checkpoints: [],

    };

}

/* -------------------------------------------------------------------------- */
/* Initial State                                                              */
/* -------------------------------------------------------------------------- */

export const DEFAULT_AGENT_STATE =

    createAgentState();

/* -------------------------------------------------------------------------- */
/* Default                                                                    */
/* -------------------------------------------------------------------------- */

export default {

    createAgentState,

    createConversationState,

    createExecutionState,

    createPlannerState,

    createMemoryState,

    createRuntimeState,

    createCheckpoint,

    createMessage,

    createGoal,

    createTaskNode,

    createTaskEdge,

    createPlannerGraph,

    createMemoryItem,

    createWorkflowDefinition,

    DEFAULT_AGENT_STATE,

};