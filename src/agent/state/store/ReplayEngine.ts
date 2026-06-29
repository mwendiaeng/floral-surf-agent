/**
 * ReplayEngine.ts
 */

import type {

    AgentState,
    EventStore,
    ReplayEngine,
    SessionId,
    StateReducer,
    StoredEvent,

} from "../types";

import {

    rootReducer,

} from "../reducers/root";

export class DefaultReplayEngine implements ReplayEngine {

    private readonly reducer: StateReducer;

    constructor(

        private readonly store: EventStore,

        reducer?: StateReducer

    ) {

        this.reducer =

            reducer ?? {

                reduce: rootReducer,

            };

    }

    async replay(

        sessionId: SessionId,

        initial: AgentState,

        reducer?: StateReducer

    ): Promise<AgentState> {

        const stream =

            await this.store.load(

                sessionId

            );

        if (

            !stream

        ) {

            return initial;

        }

        return this.replayEvents(

            stream.events,

            initial,

            reducer

        );

    }

    replayEvents(

        events: readonly StoredEvent[],

        initial: AgentState,

        reducer?: StateReducer

    ): AgentState {

        const reduce =

            reducer ?? this.reducer;

        let state = initial;

        for (

            const event of events

        ) {

            state =

                reduce.reduce(

                    state,

                    event

                );

        }

        return state;

    }

}
