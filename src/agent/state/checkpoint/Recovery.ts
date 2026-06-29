/**
 * agent/state/checkpoint/Recovery.ts
 */

import type {

    AgentState,
    CheckpointId,
    EventStore,
    RecoveryPoint,
    SessionId,

} from "../types";

import {

    createAgentState,

} from "../defaults";

import {

    DefaultReplayEngine,

} from "../store/ReplayEngine";

import {

    CheckpointManager,

} from "./CheckpointManager";

/* -------------------------------------------------------------------------- */
/* Recovery                                                                   */
/* -------------------------------------------------------------------------- */

export interface RecoveryOptions {

    sessionId: SessionId;

    store: EventStore;

    checkpoints: CheckpointManager;

    initialState?: AgentState;

}

export class Recovery {

    private readonly replay: DefaultReplayEngine;

    constructor(

        private readonly options: RecoveryOptions

    ) {

        this.replay =

            new DefaultReplayEngine(

                options.store

            );

    }

    async fromCheckpoint(

        checkpointId: CheckpointId

    ): Promise<RecoveryPoint | undefined> {

        const checkpoint =

            await this.options.checkpoints.load(

                checkpointId

            );

        if (

            !checkpoint

        ) {

            return undefined;

        }

        const snapshot =

            await this.options.checkpoints.restore(

                checkpointId

            );

        return {

            checkpoint,

            snapshot: snapshot

                ? {

                    checkpointId,

                    state: snapshot,

                    createdAt: checkpoint.createdAt,

                }

                : undefined,

        };

    }

    async fromEvents(

        afterSequence = 0

    ): Promise<AgentState> {

        const initial =

            this.options.initialState ??

            createAgentState();

        const stream =

            await this.options.store.load(

                this.options.sessionId

            );

        if (

            !stream

        ) {

            return initial;

        }

        const events =

            stream.events.filter(

                event =>

                    event.metadata.sequence >

                    afterSequence

            );

        return this.replay.replayEvents(

            events,

            initial

        );

    }

    async latestCheckpoint(

    ): Promise<RecoveryPoint | undefined> {

        const checkpoints =

            await this.options.checkpoints.list(

                this.options.sessionId

            );

        const latest =

            checkpoints.at(-1);

        if (

            !latest

        ) {

            return undefined;

        }

        return this.fromCheckpoint(

            latest.id

        );

    }

}
