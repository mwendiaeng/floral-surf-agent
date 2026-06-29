/**
 * agent/state/serializers/versioning.ts
 */

import type {

    AgentState,

} from "../types";

import {

    STATE_FORMAT_VERSION,
    STATE_SCHEMA_VERSION,

} from "../constants";

/* -------------------------------------------------------------------------- */
/* Versioned Envelope                                                         */
/* -------------------------------------------------------------------------- */

export interface VersionedState {

    schemaVersion: number;

    formatVersion: number;

    state: AgentState;

}

export function wrapVersionedState(

    state: AgentState

): VersionedState {

    return {

        schemaVersion: STATE_SCHEMA_VERSION,

        formatVersion: STATE_FORMAT_VERSION,

        state,

    };

}

export function unwrapVersionedState(

    payload: VersionedState | AgentState

): AgentState {

    if (

        "state" in payload

        && "schemaVersion" in payload

    ) {

        return payload.state;

    }

    return payload as AgentState;

}

export function migrateState(

    payload: VersionedState

): AgentState {

    if (

        payload.schemaVersion ===

        STATE_SCHEMA_VERSION

    ) {

        return payload.state;

    }

    return payload.state;

}
