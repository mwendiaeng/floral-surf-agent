/**
 * agent/workflow/types.ts
 */

import type {

    WorkflowDefinition,
    WorkflowNode,

} from "../state/types";

/* -------------------------------------------------------------------------- */
/* Workflow                                                                   */
/* -------------------------------------------------------------------------- */

export interface WorkflowContext {

    sessionId: string;

    variables: Record<string, unknown>;

    signal?: AbortSignal;

}

export interface WorkflowNodeHandler {

    (

        node: WorkflowNode,

        context: WorkflowContext

    ): Promise<unknown>;

}

export interface WorkflowRunResult {

    workflow: WorkflowDefinition;

    outputs: Record<string, unknown>;

    completed: boolean;

    error?: string;

}
