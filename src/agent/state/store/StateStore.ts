/**
 * agent/state/store/StateStore.ts
 *
 * Combined persistence contract for agent state and event streams.
 */

import type {

    AgentState,
    EventStore,
    SessionId,

} from "../types";

/* -------------------------------------------------------------------------- */
/* State Store                                                                */
/* -------------------------------------------------------------------------- */

export interface StateStore extends EventStore {

    saveState(

        state: AgentState

    ): Promise<void>;

    loadState(

        sessionId: SessionId

    ): Promise<AgentState | undefined>;

    deleteState(

        sessionId: SessionId

    ): Promise<void>;

}

export type PartialStateStore =

    Partial<StateStore>

    & EventStore;
