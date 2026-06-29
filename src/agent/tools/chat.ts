/**
 * agent/tools/chat.ts
 */

import {

    scheduleSchema,

} from "agents/schedule";

import {

    tool,

} from "ai";

import type {

    Tool,

} from "ai";

import {

    z,

} from "zod";

import type {

    Agent,

} from "../Agent";

import type {

    SessionId,

} from "../state/types";

import {

    ToolRegistry,

} from "./registry";

import type {

    ToolHandler,

} from "./types";

import {

    fetchTool,

} from "./fetch";

import {

    codingTools,

} from "./coding";

import {

    registryToAiTools,

} from "./ai-sdk";

import type {

    AiSdkToolOptions,

} from "./ai-sdk";

/* -------------------------------------------------------------------------- */
/* Dependencies                                                               */
/* -------------------------------------------------------------------------- */

export interface ChatScheduleApi {

    schedule(

        input: string | number,

        description: string

    ): void;

    getSchedules(): unknown;

    cancelSchedule(

        taskId: string

    ): void;

}

export interface ChatToolDependencies {

    schedule: ChatScheduleApi;

    sessionId: SessionId;

    signal?: AbortSignal;

}

/* -------------------------------------------------------------------------- */
/* Handlers                                                                   */
/* -------------------------------------------------------------------------- */

export function weatherTool(): ToolHandler<

    { city: string },

    Record<string, unknown>

> {

    return {

        definition: {

            name: "getWeather",

            description:

                "Get the current weather for a city",

            schema: {

                name: "getWeather",

                description:

                    "Get the current weather for a city",

                parameters: [

                    {

                        name: "city",

                        type: "string",

                        description: "City name",

                        required: true,

                    },

                ],

            },

        },

        async execute({ city }) {

            const conditions =

                ["sunny", "cloudy", "rainy", "snowy"];

            const temp =

                Math.floor(

                    Math.random() * 30

                ) + 5;

            return {

                success: true,

                output: {

                    city,

                    temperature: temp,

                    condition:

                        conditions[

                            Math.floor(

                                Math.random()

                                    * conditions.length

                            )

                        ],

                    unit: "celsius",

                },

            };

        },

    };

}

export function calculateTool(): ToolHandler<

    {

        a: number;

        b: number;

        operator: "+" | "-" | "*" | "/" | "%";

    },

    Record<string, unknown>

> {

    return {

        definition: {

            name: "calculate",

            description:

                "Perform a math calculation with two numbers. Requires user approval for large numbers.",

            schema: {

                name: "calculate",

                description:

                    "Perform a math calculation with two numbers.",

                parameters: [

                    {

                        name: "a",

                        type: "number",

                        description: "First number",

                        required: true,

                    },

                    {

                        name: "b",

                        type: "number",

                        description: "Second number",

                        required: true,

                    },

                    {

                        name: "operator",

                        type: "string",

                        description: "Arithmetic operator",

                        required: true,

                    },

                ],

            },

        },

        async execute({ a, b, operator }) {

            const ops: Record<

                string,

                (x: number, y: number) => number

            > = {

                "+": (x, y) => x + y,

                "-": (x, y) => x - y,

                "*": (x, y) => x * y,

                "/": (x, y) => x / y,

                "%": (x, y) => x % y,

            };

            if (

                operator === "/"

                && b === 0

            ) {

                return {

                    success: false,

                    error: "Division by zero",

                };

            }

            return {

                success: true,

                output: {

                    expression: `${a} ${operator} ${b}`,

                    result: ops[operator](

                        a,

                        b

                    ),

                },

            };

        },

    };

}

export function createChatToolRegistry(

    deps: ChatToolDependencies

): ToolRegistry {

    const registry =

        new ToolRegistry();

    registry.registerMany([

        weatherTool(),

        calculateTool(),

        fetchTool,

        ...codingTools,

    ]);

    return registry;

}

/* -------------------------------------------------------------------------- */
/* AI SDK                                                                     */
/* -------------------------------------------------------------------------- */

export function clientChatTools(): Record<string, Tool> {

    return {

        getUserTimezone: tool({

            description:

                "Get the user's timezone from their browser. Use this when you need to know the user's local time.",

            inputSchema: z.object({}),

        }),

    };

}

function scheduleAiTools(

    api: ChatScheduleApi,

    agent?: Agent

): Record<string, Tool> {

    const record = async (

        name: string,

        input: unknown,

        output: unknown,

        error?: string

    ) => {

        if (

            agent

        ) {

            await agent.execution.recordTool(

                name,

                input,

                output,

                error

            );

        }

    };

    return {

        scheduleTask: tool({

            description:

                "Schedule a task to be executed at a later time. Use this when the user asks to be reminded or wants something done later.",

            inputSchema: scheduleSchema,

            execute: async ({ when, description }) => {

                if (

                    when.type === "no-schedule"

                ) {

                    await record(

                        "scheduleTask",

                        { when, description },

                        undefined,

                        "Not a valid schedule input"

                    );

                    return "Not a valid schedule input";

                }

                const input =

                    when.type === "scheduled"

                        ? when.date

                        : when.type === "delayed"

                            ? when.delayInSeconds

                            : when.type === "cron"

                                ? when.cron

                                : null;

                if (

                    !input

                ) {

                    await record(

                        "scheduleTask",

                        { when, description },

                        undefined,

                        "Invalid schedule type"

                    );

                    return "Invalid schedule type";

                }

                try {

                    api.schedule(

                        input,

                        description

                    );

                    const message = `Task scheduled: "${description}" (${when.type}: ${input})`;

                    await record(

                        "scheduleTask",

                        { when, description },

                        message

                    );

                    return message;

                }

                catch (

                    error

                ) {

                    const message = `Error scheduling task: ${error}`;

                    await record(

                        "scheduleTask",

                        { when, description },

                        undefined,

                        message

                    );

                    return message;

                }

            },

        }),

        getScheduledTasks: tool({

            description: "List all tasks that have been scheduled",

            inputSchema: z.object({}),

            execute: async () => {

                const tasks =

                    api.getSchedules();

                const output =

                    Array.isArray(tasks)

                        && tasks.length > 0

                        ? tasks

                        : "No scheduled tasks found.";

                await record(

                    "getScheduledTasks",

                    {},

                    output

                );

                return output;

            },

        }),

        cancelScheduledTask: tool({

            description: "Cancel a scheduled task by its ID",

            inputSchema: z.object({

                taskId: z.string().describe(

                    "The ID of the task to cancel"

                ),

            }),

            execute: async ({ taskId }) => {

                try {

                    api.cancelSchedule(

                        taskId

                    );

                    const message = `Task ${taskId} cancelled.`;

                    await record(

                        "cancelScheduledTask",

                        { taskId },

                        message

                    );

                    return message;

                }

                catch (

                    error

                ) {

                    const message = `Error cancelling task: ${error}`;

                    await record(

                        "cancelScheduledTask",

                        { taskId },

                        undefined,

                        message

                    );

                    return message;

                }

            },

        }),

    };

}

export function buildChatAiTools(

    agent: Agent,

    deps: ChatToolDependencies

): Record<string, Tool> {

    const options: AiSdkToolOptions = {

        context: {

            sessionId: deps.sessionId,

            signal: deps.signal,

        },

        agent,

        needsApproval: (

            name,

            input

        ) => {

            if (

                name !== "calculate"

            ) {

                return false;

            }

            const { a, b } =

                input as { a?: number; b?: number };

            return (

                Math.abs(a ?? 0) > 1000

                || Math.abs(b ?? 0) > 1000

            );

        },

    };

    return {

        ...registryToAiTools(

            agent.tools,

            options

        ),

        ...scheduleAiTools(

            deps.schedule,

            agent

        ),

        ...clientChatTools(),

    };

}
