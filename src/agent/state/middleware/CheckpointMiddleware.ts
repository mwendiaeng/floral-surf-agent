/**
 * agent/state/middleware/CheckpointMiddleware.ts
 */

import type {

    AgentState,
    Checkpoint,
    CheckpointStore,
    SessionId,
    Snapshot,
    SnapshotStore,

} from "../types";

import {

    DEFAULT_CHECKPOINT_INTERVAL,

} from "../constants";

import {

    createCheckpointId,

} from "../utils/ids";

import {

    fingerprint,

} from "../utils/hashing";

import {

    now,

} from "../utils/timestamps";

import type {

    DispatchContext,
    Middleware,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Checkpoint                                                                 */
/* -------------------------------------------------------------------------- */

export interface CheckpointMiddlewareOptions {

    checkpointStore: CheckpointStore;

    snapshotStore: SnapshotStore;

    interval?: number;

    maxCheckpoints?: number;

    getEventCount?(): number;

    onCheckpoint?(

        checkpoint: Checkpoint

    ): void;

}

export class CheckpointMiddleware implements Middleware {

    readonly name = "checkpoint";

    private eventCount = 0;

    constructor(

        private readonly options:

        CheckpointMiddlewareOptions

    ) { }

    after(

        context: DispatchContext

    ): void {

        if (

            !context.nextState

        ) {

            return;

        }

        this.eventCount =

            this.options.getEventCount?.() ??

            ++this.eventCount;

        const interval =

            this.options.interval ??

            DEFAULT_CHECKPOINT_INTERVAL;

        if (

            this.eventCount % interval !== 0

        ) {

            return;

        }

        void this.createCheckpoint(

            context.nextState

        );

    }

    async createCheckpoint(

        state: AgentState,

        label?: string

    ): Promise<Checkpoint> {

        const checkpoint: Checkpoint = {

            id: createCheckpointId(),

            sequence: this.eventCount,

            createdAt: now(),

            label,

            eventCount: this.eventCount,

            stateHash: fingerprint(

                state

            ),

        };

        const snapshot: Snapshot<AgentState> = {

            checkpointId: checkpoint.id,

            state,

            createdAt: checkpoint.createdAt,

        };

        await this.options.checkpointStore.save(

            state.runtime.sessionId,

            checkpoint

        );

        await this.options.snapshotStore.save(

            snapshot

        );

        await this.trimCheckpoints(

            state.runtime.sessionId

        );

        this.options.onCheckpoint?.(

            checkpoint

        );

        return checkpoint;

    }

    private async trimCheckpoints(

        sessionId: SessionId

    ): Promise<void> {

        const max =

            this.options.maxCheckpoints;

        if (

            !max

            || max <= 0

        ) {

            return;

        }

        const checkpoints =

            await this.options.checkpointStore.list(

                sessionId

            );

        const excess =

            checkpoints.length - max;

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

            const checkpoint =

                checkpoints[index];

            await this.options.snapshotStore.delete(

                checkpoint.id

            );

            await this.options.checkpointStore.delete(

                checkpoint.id

            );

        }

    }

}
