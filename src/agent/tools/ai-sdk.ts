/**
 * agent/tools/ai-sdk.ts
 */

import {

    tool,

} from "ai";

import type {

    Tool,

} from "ai";

import type {

    Agent,

} from "../Agent";

import {

    parametersToZod,

} from "./schema";

import type {

    ToolRegistry,

} from "./registry";

import type {

    ToolContext,

    ToolHandler,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

export interface AiSdkToolOptions {

    context: ToolContext;

    agent?: Agent;

    needsApproval?: (

        name: string,

        input: unknown

    ) => boolean | Promise<boolean>;

}

/* -------------------------------------------------------------------------- */
/* Bridge                                                                     */
/* -------------------------------------------------------------------------- */

async function recordToolExecution(

    agent: Agent | undefined,

    name: string,

    input: unknown,

    output: unknown,

    error?: string

): Promise<void> {

    if (

        !agent

    ) {

        return;

    }

    await agent.execution.recordTool(

        name,

        input,

        output,

        error

    );

}

export function handlerToAiTool(

    handler: ToolHandler,

    options: AiSdkToolOptions

): Tool {

    const inputSchema =

        parametersToZod(

            handler.definition.schema.parameters

        );

    const toolName =

        handler.definition.name;

    const approval =

        options.needsApproval;

    return tool({

        description:

            handler.definition.description,

        inputSchema,

        needsApproval: approval

            ? async (input) =>

                Boolean(

                    await approval(

                        toolName,

                        input

                    )

                )

            : undefined,

        execute: async (input) => {

            try {

                const result =

                    await handler.execute(

                        input,

                        options.context

                    );

                await recordToolExecution(

                    options.agent,

                    toolName,

                    input,

                    result.output,

                    result.error

                );

                if (

                    !result.success

                ) {

                    return {

                        error:

                            result.error

                            ?? "Tool execution failed.",

                    };

                }

                return result.output;

            }

            catch (

                error

            ) {

                const message =

                    error instanceof Error

                        ? error.message

                        : String(error);

                await recordToolExecution(

                    options.agent,

                    toolName,

                    input,

                    undefined,

                    message

                );

                return {

                    error: message,

                };

            }

        },

    });

}

export function registryToAiTools(

    registry: ToolRegistry,

    options: AiSdkToolOptions

): Record<string, Tool> {

    const tools: Record<string, Tool> = {};

    for (

        const definition of registry.list()

    ) {

        const handler =

            registry.get(

                definition.name

            );

        if (

            !handler

        ) {

            continue;

        }

        tools[definition.name] =

            handlerToAiTool(

                handler,

                options

            );

    }

    return tools;

}
