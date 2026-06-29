/**
 * agent/tools/types.ts
 */

import type {

    ToolDefinition,
    ToolResult,

} from "../state/types";

/* -------------------------------------------------------------------------- */
/* Tool Handler                                                               */
/* -------------------------------------------------------------------------- */

export interface ToolContext {

    sessionId: string;

    signal?: AbortSignal;

    metadata?: Record<string, unknown>;

}

export interface ToolHandler<TInput = unknown, TOutput = unknown> {

    readonly definition: ToolDefinition;

    execute(

        input: TInput,

        context: ToolContext

    ): Promise<ToolResult & { output?: TOutput }>;

}

export type ToolMap = Record<string, ToolHandler>;
