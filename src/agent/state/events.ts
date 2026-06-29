/**
 * agent/state/events.ts
 *
 * Factory helpers for building StoredEvents.
 */

import type {

    AgentMessage,
    ExecutionEvent,
    MemoryEvent,
    MemoryKind,
    MessageEvent,
    ModelInvocationEvent,
    PlanningEvent,
    ReasoningEvent,
    ReasoningType,
    StoredEvent,
    SystemEvent,
    ToolExecutionEvent,
    WorkflowEvent,

} from "./types";

import {

    ExecutionEventType,

} from "./types";

import {

    createActionId,

} from "./utils/ids";

import {

    now,

} from "./utils/timestamps";

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

let sequence = 0;

export function resetEventSequence(): void {

    sequence = 0;

}

function nextSequence(): number {

    return ++sequence;

}

function baseEvent(

    type: ExecutionEventType

): Pick<

    ExecutionEvent,

    | "id"
    | "type"
    | "timestamp"
    | "startedAt"
    | "success"

> {

    const timestamp = now();

    return {

        id: createActionId(),

        type,

        timestamp,

        startedAt: timestamp,

        success: true,

    };

}

export function wrapEvent<T extends ExecutionEvent>(

    event: T,

    options?: {

        correlationId?: string;

        causationId?: string;

        source?: string;

    }

): StoredEvent<T> {

    return {

        metadata: {

            sequence: nextSequence(),

            version: 1,

            correlationId: options?.correlationId,

            causationId: options?.causationId,

            source: options?.source,

        },

        event,

    };

}

/* -------------------------------------------------------------------------- */
/* Message                                                                    */
/* -------------------------------------------------------------------------- */

export function createMessageEvent(

    message: AgentMessage

): StoredEvent<MessageEvent> {

    return wrapEvent({

        ...baseEvent(

            ExecutionEventType.Message

        ),

        type: ExecutionEventType.Message,

        message,

    });

}

/* -------------------------------------------------------------------------- */
/* Planning                                                                   */
/* -------------------------------------------------------------------------- */

export function createPlanningEvent(

    goal: string,

    plan?: string

): StoredEvent<PlanningEvent> {

    return wrapEvent({

        ...baseEvent(

            ExecutionEventType.Planning

        ),

        type: ExecutionEventType.Planning,

        goal,

        plan,

    });

}

/* -------------------------------------------------------------------------- */
/* Reasoning                                                                  */
/* -------------------------------------------------------------------------- */

export function createReasoningEvent(

    reasoningType: ReasoningType,

    input?: unknown,

    output?: unknown

): StoredEvent<ReasoningEvent> {

    return wrapEvent({

        ...baseEvent(

            ExecutionEventType.Reasoning

        ),

        type: ExecutionEventType.Reasoning,

        reasoningType,

        input,

        output,

    });

}

/* -------------------------------------------------------------------------- */
/* Tool                                                                       */
/* -------------------------------------------------------------------------- */

export function createToolEvent(

    tool: string,

    input: unknown,

    output?: unknown,

    error?: string

): StoredEvent<ToolExecutionEvent> {

    return wrapEvent({

        ...baseEvent(

            ExecutionEventType.Tool

        ),

        type: ExecutionEventType.Tool,

        tool,

        input,

        output,

        retries: 0,

        error,

        success: !error,

    });

}

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

export function createModelEvent(

    provider: string,

    model: string,

    options?: {

        input?: unknown;

        output?: unknown;

        success?: boolean;

    }

): StoredEvent<ModelInvocationEvent> {

    return wrapEvent({

        ...baseEvent(

            ExecutionEventType.Model

        ),

        type: ExecutionEventType.Model,

        provider,

        model,

        prompt: options?.input,

        response: options?.output,

        success: options?.success ?? true,

    });

}

/* -------------------------------------------------------------------------- */
/* Memory                                                                     */
/* -------------------------------------------------------------------------- */

export function createMemoryEvent(

    operation: MemoryEvent["operation"],

    key: string,

    options?: {

        layer?: MemoryKind;

        value?: unknown;

        query?: string;

    }

): StoredEvent<MemoryEvent> {

    return wrapEvent({

        ...baseEvent(

            ExecutionEventType.Memory

        ),

        type: ExecutionEventType.Memory,

        operation,

        key,

        layer: options?.layer,

        value: options?.value,

        query: options?.query,

    });

}

/* -------------------------------------------------------------------------- */
/* Workflow                                                                   */
/* -------------------------------------------------------------------------- */

export function createWorkflowEvent(

    workflow: string,

    options?: {

        node?: string;

        state?: string;

    }

): StoredEvent<WorkflowEvent> {

    return wrapEvent({

        ...baseEvent(

            ExecutionEventType.Workflow

        ),

        type: ExecutionEventType.Workflow,

        workflow,

        node: options?.node,

        state: options?.state,

    });

}

/* -------------------------------------------------------------------------- */
/* System                                                                     */
/* -------------------------------------------------------------------------- */

export function createSystemEvent(

    level: SystemEvent["level"],

    message: string

): StoredEvent<SystemEvent> {

    return wrapEvent({

        ...baseEvent(

            ExecutionEventType.System

        ),

        type: ExecutionEventType.System,

        level,

        message,

        success: level !== "error",

    });

}
