/**
 * agent/tools/registry.ts
 */

import type {

    ToolDefinition,
    ToolResult,

} from "../state/types";

import type {

    ToolContext,
    ToolHandler,
    ToolMap,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Tool Registry                                                              */
/* -------------------------------------------------------------------------- */

export class ToolRegistry {

    private readonly tools =

        new Map<string, ToolHandler>();

    register(

        handler: ToolHandler

    ): this {

        this.tools.set(

            handler.definition.name,

            handler

        );

        return this;

    }

    registerMany(

        handlers: readonly ToolHandler[]

    ): this {

        for (

            const handler of handlers

        ) {

            this.register(

                handler

            );

        }

        return this;

    }

    unregister(

        name: string

    ): boolean {

        return this.tools.delete(

            name

        );

    }

    get(

        name: string

    ): ToolHandler | undefined {

        return this.tools.get(

            name

        );

    }

    has(

        name: string

    ): boolean {

        return this.tools.has(

            name

        );

    }

    list(): ToolDefinition[] {

        return [...this.tools.values()].map(

            handler =>

                handler.definition

        );

    }

    async execute(

        name: string,

        input: unknown,

        context: ToolContext

    ): Promise<ToolResult> {

        const handler =

            this.get(

                name

            );

        if (

            !handler

        ) {

            return {

                success: false,

                error: `Unknown tool: ${name}`,

            };

        }

        try {

            return await handler.execute(

                input,

                context

            );

        }

        catch (

            error

        ) {

            return {

                success: false,

                error:

                    error instanceof Error

                        ? error.message

                        : String(error),

            };

        }

    }

    toMap(): ToolMap {

        return Object.fromEntries(

            this.tools.entries()

        );

    }

    clear(): void {

        this.tools.clear();

    }

    get size(): number {

        return this.tools.size;

    }

}

export const toolRegistry =

    new ToolRegistry();
