/**
 * agent/chat/bootstrap.ts
 *
 * Bootstrap Agent runtime for ChatAgent Durable Objects.
 */

import type {

    SessionId,

} from "../state/types";

import {

    createAgentState,

} from "../state/defaults";

import {

    createSessionId,

} from "../state/utils/ids";

import {

    Agent,

} from "../Agent";

import type {

    AgentOptions,

} from "../Agent";

import {

    createChatToolRegistry,

} from "../tools/chat";

import type {

    ChatScheduleApi,

} from "../tools/chat";

import {

    createModelEvent,

} from "../state/events";

/* -------------------------------------------------------------------------- */
/* Bootstrap                                                                  */
/* -------------------------------------------------------------------------- */

export interface ChatAgentBootstrapOptions {

    sessionId?: string;

    schedule: ChatScheduleApi;

    llm?: AgentOptions["llm"];

}

export function bootstrapChatAgent(

    options: ChatAgentBootstrapOptions

): Agent {

    const sessionId =

        (options.sessionId ?? createSessionId()) as SessionId;

    const initialState =

        createAgentState();

    initialState.runtime.sessionId =

        sessionId;

    const tools =

        createChatToolRegistry({

            schedule: options.schedule,

            sessionId,

        });

    return new Agent({

        state: {

            initialState,

        },

        llm: options.llm,

        tools,

    });

}

export async function recordModelInvocation(

    agent: Agent,

    provider: string,

    model: string,

    options?: {

        success?: boolean;

    }

): Promise<void> {

    await agent.dispatch(

        createModelEvent(

            provider,

            model,

            options

        )

    );

}
