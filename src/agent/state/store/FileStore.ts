/**
 * agent/state/store/FileStore.ts
 *
 * Serializable event store for local development and tests.
 * Persists streams as JSON blobs via an injectable adapter.
 */

import type {

    EventStore,
    EventStream,
    SessionId,
    StoredEvent,

} from "../types";

import {

    MemoryEventStore,

} from "./MemoryStore";

/* -------------------------------------------------------------------------- */
/* Adapter                                                                    */
/* -------------------------------------------------------------------------- */

export interface FileStoreAdapter {

    read(

        key: string

    ): Promise<string | null>;

    write(

        key: string,

        value: string

    ): Promise<void>;

    delete(

        key: string

    ): Promise<void>;

    list(): Promise<string[]>;

}

export class MapFileStoreAdapter implements FileStoreAdapter {

    private readonly files =

        new Map<string, string>();

    async read(

        key: string

    ): Promise<string | null> {

        return this.files.get(

            key

        ) ?? null;

    }

    async write(

        key: string,

        value: string

    ): Promise<void> {

        this.files.set(

            key,

            value

        );

    }

    async delete(

        key: string

    ): Promise<void> {

        this.files.delete(

            key

        );

    }

    async list(): Promise<string[]> {

        return [...this.files.keys()];

    }

}

/* -------------------------------------------------------------------------- */
/* File Event Store                                                           */
/* -------------------------------------------------------------------------- */

export class FileEventStore implements EventStore {

    private readonly memory =

        new MemoryEventStore();

    constructor(

        private readonly adapter: FileStoreAdapter,

        private readonly prefix = "events"

    ) { }

    private key(

        sessionId: SessionId

    ): string {

        return `${this.prefix}/${sessionId}.json`;

    }

    async create(

        sessionId: SessionId

    ): Promise<EventStream> {

        await this.hydrate(

            sessionId

        );

        return this.memory.create(

            sessionId

        );

    }

    async load(

        sessionId: SessionId

    ): Promise<EventStream | undefined> {

        await this.hydrate(

            sessionId

        );

        return this.memory.load(

            sessionId

        );

    }

    async append(

        sessionId: SessionId,

        event: StoredEvent

    ): Promise<void> {

        await this.memory.append(

            sessionId,

            event

        );

        await this.persist(

            sessionId

        );

    }

    async appendMany(

        sessionId: SessionId,

        events: StoredEvent[]

    ): Promise<void> {

        await this.memory.appendMany(

            sessionId,

            events

        );

        await this.persist(

            sessionId

        );

    }

    async delete(

        sessionId: SessionId

    ): Promise<void> {

        await this.memory.delete(

            sessionId

        );

        await this.adapter.delete(

            this.key(

                sessionId

            )

        );

    }

    private async hydrate(

        sessionId: SessionId

    ): Promise<void> {

        if (

            this.memory.has(

                sessionId

            )

        ) {

            return;

        }

        const raw =

            await this.adapter.read(

                this.key(

                    sessionId

                )

            );

        if (

            !raw

        ) {

            return;

        }

        const stream =

            JSON.parse(

                raw

            ) as EventStream;

        await this.memory.create(

            sessionId

        );

        if (

            stream.events.length > 0

        ) {

            await this.memory.appendMany(

                sessionId,

                stream.events

            );

        }

    }

    private async persist(

        sessionId: SessionId

    ): Promise<void> {

        const stream =

            await this.memory.load(

                sessionId

            );

        if (

            !stream

        ) {

            return;

        }

        await this.adapter.write(

            this.key(

                sessionId

            ),

            JSON.stringify(

                stream

            )

        );

    }

}
