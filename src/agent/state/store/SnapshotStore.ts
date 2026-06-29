/**
 * SnapshotStore.ts
 */

import type {

    AgentState,
    CheckpointId,
    Snapshot,
    SnapshotStore,

} from "../types";

export class MemorySnapshotStore implements SnapshotStore {

    private readonly snapshots =

        new Map<CheckpointId, Snapshot<AgentState>>();

    async save(

        snapshot: Snapshot<AgentState>

    ): Promise<void> {

        this.snapshots.set(

            snapshot.checkpointId,

            snapshot

        );

    }

    async load(

        checkpointId: CheckpointId

    ): Promise<Snapshot<AgentState> | undefined> {

        return this.snapshots.get(

            checkpointId

        );

    }

    async delete(

        checkpointId: CheckpointId

    ): Promise<void> {

        this.snapshots.delete(

            checkpointId

        );

    }

    clear(): void {

        this.snapshots.clear();

    }

    size(): number {

        return this.snapshots.size;

    }

}
