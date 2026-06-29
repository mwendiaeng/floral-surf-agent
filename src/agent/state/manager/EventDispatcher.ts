/**
 * EventDispatcher.ts
 */

import type {
    AgentState,
    StoredEvent,
} from "../types";

import { rootReducer } from "../reducers/root";

import { ObserverManager } from "./ObserverManager";

import { MiddlewarePipeline } from "../middleware/MiddlewarePipeline";

export class EventDispatcher {

    constructor(
        private readonly pipeline: MiddlewarePipeline,
        private readonly observers: ObserverManager,
    ) { }

    async dispatch(
        state: AgentState,
        event: StoredEvent
    ): Promise<AgentState> {

        const nextState = await this.pipeline.run(
            state,
            event,
            rootReducer
        );

        await this.observers.notifyEvent(event);

        await this.observers.notifyState(nextState);

        return nextState;

    }

    async dispatchMany(
        state: AgentState,
        events: readonly StoredEvent[]
    ): Promise<AgentState> {

        let current = state;

        for (const event of events) {

            current = await this.dispatch(
                current,
                event
            );

        }

        return current;

    }

}
