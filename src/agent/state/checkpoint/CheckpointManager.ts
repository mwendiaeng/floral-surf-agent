/**
 * agent/state/checkpoint/CheckpointManager.ts
 */

import type {

    AgentState,
    Checkpoint,
    CheckpointId,
    CheckpointStore,
    SessionId,
    Snapshot,
    SnapshotStore,

} from "../types";

import {

    createCheckpointId,

} from "../utils/ids";

import {

    fingerprint,

} from "../utils/hashing";

import {

    now,

} from "../utils/timestamps";

import {

    DEFAULT_MAX_CHECKPOINTS,

} from "../constants";

/* -------------------------------------------------------------------------- */
/* Checkpoint Manager                                                         */
/* -------------------------------------------------------------------------- */

export class CheckpointManager {

    constructor(

        private readonly checkpointStore: CheckpointStore,

        private readonly snapshotStore: SnapshotStore,

        private readonly maxCheckpoints =

            DEFAULT_MAX_CHECKPOINTS

    ) { }

    async create(

        sessionId: SessionId,

        state: AgentState,

        options?: {

            label?: string;

            sequence?: number;

            eventCount?: number;

        }

    ): Promise<Checkpoint> {

        const checkpoint: Checkpoint = {

            id: createCheckpointId(),

            sequence:

                options?.sequence ?? 0,

            createdAt: now(),

            label: options?.label,

            eventCount:

                options?.eventCount ?? 0,

            stateHash: fingerprint(

                state

            ),

        };

        await this.checkpointStore.save(

            sessionId,

            checkpoint

        );

        await this.snapshotStore.save({

            checkpointId: checkpoint.id,

            state,

            createdAt: checkpoint.createdAt,

        });

        await this.trim(

            sessionId

        );

        return checkpoint;

    }

    async load(

        checkpointId: CheckpointId

    ): Promise<Checkpoint | undefined> {

        return this.checkpointStore.load(

            checkpointId

        );

    }

    async list(

        sessionId: SessionId

    ): Promise<Checkpoint[]> {

        return this.checkpointStore.list(

            sessionId

        );

    }

    async restore(

        checkpointId: CheckpointId

    ): Promise<AgentState | undefined> {

        const snapshot =

            await this.snapshotStore.load(

                checkpointId

            );

        return snapshot?.state;

    }

    async delete(

        checkpointId: CheckpointId

    ): Promise<void> {

        await this.snapshotStore.delete(

            checkpointId

        );

        await this.checkpointStore.delete(

            checkpointId

        );

    }

    async deleteAll(

        sessionId: SessionId

    ): Promise<void> {

        const checkpoints =

            await this.list(

                sessionId

            );

        for (

            const checkpoint of checkpoints

        ) {

            await this.delete(

                checkpoint.id

            );

        }

    }

    private async trim(

        sessionId: SessionId

    ): Promise<void> {

        const checkpoints =

            await this.list(

                sessionId

            );

        const excess =

            checkpoints.length -

            this.maxCheckpoints;

        if (

            excess <= 0

        ) {

            return;

        }

        for (

            let index = 0;

            index < excess;

            index++

        ) {

            await this.delete(

                checkpoints[index].id

            );

        }

    }

}
