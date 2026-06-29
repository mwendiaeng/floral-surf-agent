/**
 * agent/state/manager/StateManager.ts
 */

import type {

    AgentState,
    Checkpoint,
    CheckpointId,
    CheckpointStore,
    EventStore,
    SnapshotStore,
    StateObserver,
    StoredEvent,
    Subscription,

} from "../types";

import {

    createAgentState,

} from "../defaults";

import {

    reduceEvents,

} from "../reducers/root";

import {

    createCheckpointId,

} from "../utils/ids";

import {

    deepClone,

} from "../utils/clone";

import {

    fingerprint,

} from "../utils/hashing";

import {

    now,

} from "../utils/timestamps";

import {

    DEFAULT_MAX_CHECKPOINTS,

} from "../constants";

import {

    createDefaultPipeline,

} from "../middleware";

import type {

    MiddlewarePipeline,

} from "../middleware";

import {

    MemoryCheckpointStore,

} from "../store/CheckpointStore";

import {

    MemoryEventStore,

} from "../store/MemoryStore";

import {

    MemorySnapshotStore,

} from "../store/SnapshotStore";

import {

    CheckpointMiddleware,

} from "../middleware/CheckpointMiddleware";

import {

    EventDispatcher,

} from "./EventDispatcher";

import {

    ObserverManager,

} from "./ObserverManager";

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

export interface StateManagerOptions {

    initialState?: AgentState;

    maxCheckpoints?: number;

    store?: EventStore;

    checkpointStore?: CheckpointStore;

    snapshotStore?: SnapshotStore;

    pipeline?: MiddlewarePipeline;

    observers?: ObserverManager;

    dispatcher?: EventDispatcher;

}

/* -------------------------------------------------------------------------- */
/* State Manager                                                              */
/* -------------------------------------------------------------------------- */

export class StateManager {

    private state: AgentState;

    private readonly initialState: AgentState;

    private readonly history: StoredEvent[] = [];

    private readonly maxCheckpoints: number;

    readonly observers: ObserverManager;

    readonly pipeline: MiddlewarePipeline;

    readonly dispatcher: EventDispatcher;

    readonly store: EventStore;

    readonly checkpointStore: CheckpointStore;

    readonly snapshotStore: SnapshotStore;

    constructor(

        options: StateManagerOptions = {}

    ) {

        this.initialState =

            deepClone(

                options.initialState ??

                createAgentState()

            );

        this.state =

            deepClone(

                this.initialState

            );

        this.maxCheckpoints =

            options.maxCheckpoints ??

            DEFAULT_MAX_CHECKPOINTS;

        this.store =

            options.store ??

            new MemoryEventStore();

        this.checkpointStore =

            options.checkpointStore ??

            new MemoryCheckpointStore();

        this.snapshotStore =

            options.snapshotStore ??

            new MemorySnapshotStore();

        this.observers =

            options.observers ??

            new ObserverManager();

        this.pipeline =

            options.pipeline ??

            createDefaultPipeline({

                store: this.store,

                checkpointStore:

                    this.checkpointStore,

                snapshotStore:

                    this.snapshotStore,

                maxCheckpoints:

                    this.maxCheckpoints,

                getEventCount: () =>

                    this.history.length,

            });

        this.dispatcher =

            options.dispatcher ??

            new EventDispatcher(

                this.pipeline,

                this.observers

            );

    }

    /* ---------------------------------------------------------------------- */
    /* State                                                                   */
    /* ---------------------------------------------------------------------- */

    getState(): Readonly<AgentState> {

        return this.state;

    }

    cloneState(): AgentState {

        return deepClone(

            this.state

        );

    }

    replace(

        state: AgentState

    ): void {

        this.state =

            deepClone(state);

    }

    reset(): void {

        this.state =

            deepClone(

                this.initialState

            );

        this.history.length = 0;

    }

    /* ---------------------------------------------------------------------- */
    /* Events                                                                  */
    /* ---------------------------------------------------------------------- */

    getHistory(): readonly StoredEvent[] {

        return this.history;

    }

    clearHistory(): void {

        this.history.length = 0;

    }

    async dispatch(

        event: StoredEvent

    ): Promise<void> {

        this.history.push(

            event

        );

        try {

            this.state =

                await this.dispatcher.dispatch(

                    this.state,

                    event

                );

        }

        catch (

            error

        ) {

            this.history.pop();

            throw error;

        }

    }

    async dispatchMany(

        events: readonly StoredEvent[]

    ): Promise<void> {

        for (

            const event of events

        ) {

            await this.dispatch(

                event

            );

        }

    }

    replay(): void {

        this.state =

            reduceEvents(

                this.initialState,

                this.history

            );

    }

    replaceHistory(

        events: readonly StoredEvent[]

    ): void {

        this.history.length = 0;

        this.history.push(

            ...events

        );

        this.replay();

    }

    clear(): void {

        this.reset();

    }

    /* ---------------------------------------------------------------------- */
    /* Observer                                                                 */
    /* ---------------------------------------------------------------------- */

    subscribe(

        observer: StateObserver

    ): Subscription {

        return this.observers.subscribe(

            observer

        );

    }

    unsubscribe(

        observer: StateObserver

    ): void {

        this.observers.unsubscribe(

            observer

        );

    }

    /* ---------------------------------------------------------------------- */
    /* Checkpoints                                                             */
    /* ---------------------------------------------------------------------- */

    async createCheckpoint(

        label?: string

    ): Promise<Checkpoint> {

        const middleware =

            this.pipeline.list().find(

                entry =>

                    entry.name === "checkpoint"

            ) as CheckpointMiddleware | undefined;

        if (

            middleware

        ) {

            return middleware.createCheckpoint(

                this.state,

                label

            );

        }

        const checkpoint: Checkpoint = {

            id: createCheckpointId(),

            sequence: this.history.length,

            createdAt: now(),

            label,

            eventCount: this.history.length,

            stateHash: fingerprint(

                this.state

            ),

        };

        await this.checkpointStore.save(

            this.state.runtime.sessionId,

            checkpoint

        );

        await this.snapshotStore.save({

            checkpointId: checkpoint.id,

            state: deepClone(

                this.state

            ),

            createdAt: checkpoint.createdAt,

        });

        return checkpoint;

    }

    async restoreCheckpoint(

        checkpoint: Checkpoint

    ): Promise<boolean> {

        const snapshot =

            await this.snapshotStore.load(

                checkpoint.id

            );

        if (

            !snapshot

        ) {

            return false;

        }

        this.state =

            deepClone(

                snapshot.state

            );

        return true;

    }

    async restore(

        checkpointId: CheckpointId

    ): Promise<boolean> {

        const checkpoint =

            await this.checkpointStore.load(

                checkpointId

            );

        if (

            !checkpoint

        ) {

            return false;

        }

        return this.restoreCheckpoint(

            checkpoint

        );

    }

    async clearCheckpoints(): Promise<void> {

        await this.checkpointStore.deleteAll(

            this.state.runtime.sessionId

        );

    }

    async hasCheckpoint(

        id: CheckpointId

    ): Promise<boolean> {

        const checkpoint =

            await this.checkpointStore.load(

                id

            );

        return checkpoint !== undefined;

    }

    /* ---------------------------------------------------------------------- */
    /* Serialization                                                           */
    /* ---------------------------------------------------------------------- */

    exportState(): AgentState {

        return deepClone(

            this.state

        );

    }

    importState(

        state: AgentState

    ): void {

        this.state =

            deepClone(

                state

            );

    }

    exportHistory(): StoredEvent[] {

        return deepClone(

            this.history

        );

    }

    importHistory(

        events: StoredEvent[]

    ): void {

        this.replaceHistory(

            events

        );

    }

    /* ---------------------------------------------------------------------- */
    /* Diagnostics                                                             */
    /* ---------------------------------------------------------------------- */

    fingerprint(): string {

        return fingerprint(

            this.state

        );

    }

    eventCount(): number {

        return this.history.length;

    }

    async checkpointCount(): Promise<number> {

        const checkpoints =

            await this.checkpointStore.list(

                this.state.runtime.sessionId

            );

        return checkpoints.length;

    }

    isDirty(): boolean {

        return this.history.length > 0;

    }

}
