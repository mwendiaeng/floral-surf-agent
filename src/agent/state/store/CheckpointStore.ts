/**
 * CheckpointStore.ts
 */

import type {

    Checkpoint,
    CheckpointId,
    CheckpointStore,
    SessionId,

} from "../types";

export class MemoryCheckpointStore implements CheckpointStore {

    private readonly checkpoints =

        new Map<CheckpointId, Checkpoint>();

    private readonly bySession =

        new Map<SessionId, Set<CheckpointId>>();

    async save(

        sessionId: SessionId,

        checkpoint: Checkpoint

    ): Promise<void> {

        this.checkpoints.set(

            checkpoint.id,

            checkpoint

        );

        let ids =

            this.bySession.get(

                sessionId

            );

        if (

            !ids

        ) {

            ids = new Set();

            this.bySession.set(

                sessionId,

                ids

            );

        }

        ids.add(

            checkpoint.id

        );

    }

    async load(

        checkpointId: CheckpointId

    ): Promise<Checkpoint | undefined> {

        return this.checkpoints.get(

            checkpointId

        );

    }

    async list(

        sessionId: SessionId

    ): Promise<Checkpoint[]> {

        const ids =

            this.bySession.get(

                sessionId

            );

        if (

            !ids

        ) {

            return [];

        }

        return [...ids]

            .map(

                id => this.checkpoints.get(

                    id

                )

            )

            .filter(

                (

                    checkpoint

                ): checkpoint is Checkpoint =>

                    checkpoint !== undefined

            )

            .sort(

                (

                    a,

                    b

                ) =>

                    a.sequence - b.sequence

            );

    }

    async delete(

        checkpointId: CheckpointId

    ): Promise<void> {

        this.checkpoints.delete(

            checkpointId

        );

        for (

            const ids of this.bySession.values()

        ) {

            ids.delete(

                checkpointId

            );

        }

    }

    async deleteAll(

        sessionId: SessionId

    ): Promise<void> {

        const ids =

            this.bySession.get(

                sessionId

            );

        if (

            !ids

        ) {

            return;

        }

        for (

            const id of ids

        ) {

            this.checkpoints.delete(

                id

            );

        }

        this.bySession.delete(

            sessionId

        );

    }

    clear(): void {

        this.checkpoints.clear();

        this.bySession.clear();

    }

    size(): number {

        return this.checkpoints.size;

    }

}
