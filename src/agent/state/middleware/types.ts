/**
 * agent/state/middleware/types.ts
 */

import type {

    AgentState,
    SessionId,
    StoredEvent,

} from "../types";

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

export interface DispatchContext {

    previousState: AgentState;

    event: StoredEvent;

    sessionId: SessionId;

    nextState?: AgentState;

    startedAt: number;

    duration?: number;

    metadata: Record<string, unknown>;

    aborted: boolean;

    abortReason?: string;

}

export function createDispatchContext(

    state: AgentState,

    event: StoredEvent

): DispatchContext {

    return {

        previousState: state,

        event,

        sessionId: state.runtime.sessionId,

        startedAt: Date.now(),

        metadata: {},

        aborted: false,

    };

}

/* -------------------------------------------------------------------------- */
/* Middleware                                                                 */
/* -------------------------------------------------------------------------- */

export interface Middleware {

    readonly name: string;

    before?(

        context: DispatchContext

    ): Promise<void> | void;

    after?(

        context: DispatchContext

    ): Promise<void> | void;

}

export type ReduceFn = (

    state: AgentState,

    event: StoredEvent

) => AgentState;

/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

export class MiddlewareAbortError extends Error {

    constructor(

        message: string

    ) {

        super(message);

        this.name = "MiddlewareAbortError";

    }

}

export class RetryableError extends Error {

    constructor(

        message: string,

        readonly cause?: unknown

    ) {

        super(message);

        this.name = "RetryableError";

    }

}

/* -------------------------------------------------------------------------- */
/* Retry                                                                      */
/* -------------------------------------------------------------------------- */

export interface RetryPolicy {

    maxAttempts: number;

    delayMs?: number;

    shouldRetry?(

        error: unknown,

        attempt: number

    ): boolean;

}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {

    maxAttempts: 3,

    delayMs: 50,

    shouldRetry: () => true,

};

/* -------------------------------------------------------------------------- */
/* Telemetry                                                                  */
/* -------------------------------------------------------------------------- */

export interface TelemetrySink {

    record(

        name: string,

        value: number,

        tags?: Record<string, string>

    ): void;

    event(

        name: string,

        properties?: Record<string, unknown>

    ): void;

}

/* -------------------------------------------------------------------------- */
/* Logging                                                                    */
/* -------------------------------------------------------------------------- */

export interface Logger {

    debug(

        message: string,

        data?: Record<string, unknown>

    ): void;

    info(

        message: string,

        data?: Record<string, unknown>

    ): void;

    warn(

        message: string,

        data?: Record<string, unknown>

    ): void;

    error(

        message: string,

        data?: Record<string, unknown>

    ): void;

}

export const consoleLogger: Logger = {

    debug: (message, data) => {

        console.debug(message, data);

    },

    info: (message, data) => {

        console.info(message, data);

    },

    warn: (message, data) => {

        console.warn(message, data);

    },

    error: (message, data) => {

        console.error(message, data);

    },

};
