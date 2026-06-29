/**
 * agent/state/checkpoint/SnapshotManager.ts
 */

import type {

    AgentState,
    CheckpointId,
    Snapshot,
    SnapshotStore,

} from "../types";

import {

    deepClone,

} from "../utils/clone";

/* -------------------------------------------------------------------------- */
/* Snapshot Manager                                                           */
/* -------------------------------------------------------------------------- */

export class SnapshotManager {

    constructor(

        private readonly store: SnapshotStore

    ) { }

    async save(

        checkpointId: CheckpointId,

        state: AgentState

    ): Promise<Snapshot<AgentState>> {

        const snapshot: Snapshot<AgentState> = {

            checkpointId,

            state: deepClone(

                state

            ),

            createdAt: Date.now(),

        };

        await this.store.save(

            snapshot

        );

        return snapshot;

    }

    async load(

        checkpointId: CheckpointId

    ): Promise<Snapshot<AgentState> | undefined> {

        return this.store.load(

            checkpointId

        );

    }

    async delete(

        checkpointId: CheckpointId

    ): Promise<void> {

        await this.store.delete(

            checkpointId

        );

    }

}
