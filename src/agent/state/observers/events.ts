/**
 * agent/state/observers/events.ts
 */

import type {

    AgentState,
    StoredEvent,

} from "../types";

/* -------------------------------------------------------------------------- */
/* Observer Events                                                            */
/* -------------------------------------------------------------------------- */

export type ObserverEventType =

    | "state.changed"

    | "event.dispatched"

    | "observer.error";

export interface StateChangedEvent {

    type: "state.changed";

    state: AgentState;

    timestamp: number;

}

export interface EventDispatchedEvent {

    type: "event.dispatched";

    stored: StoredEvent;

    timestamp: number;

}

export interface ObserverErrorEvent {

    type: "observer.error";

    error: unknown;

    timestamp: number;

}

export type ObserverEvent =

    | StateChangedEvent

    | EventDispatchedEvent

    | ObserverErrorEvent;

export function createStateChangedEvent(

    state: AgentState

): StateChangedEvent {

    return {

        type: "state.changed",

        state,

        timestamp: Date.now(),

    };

}

export function createEventDispatchedEvent(

    stored: StoredEvent

): EventDispatchedEvent {

    return {

        type: "event.dispatched",

        stored,

        timestamp: Date.now(),

    };

}

export function createObserverErrorEvent(

    error: unknown

): ObserverErrorEvent {

    return {

        type: "observer.error",

        error,

        timestamp: Date.now(),

    };

}
