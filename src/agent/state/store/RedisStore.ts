/**
 * agent/state/store/RedisStore.ts
 *
 * Event store backed by a Redis-compatible key-value adapter.
 */

import type {

    EventStore,
    EventStream,
    SessionId,
    StoredEvent,

} from "../types";

/* -------------------------------------------------------------------------- */
/* Adapter                                                                    */
/* -------------------------------------------------------------------------- */

export interface RedisLikeStore {

    get(

        key: string

    ): Promise<string | null>;

    set(

        key: string,

        value: string

    ): Promise<void>;

    del(

        key: string

    ): Promise<void>;

}

/* -------------------------------------------------------------------------- */
/* Redis Event Store                                                          */
/* -------------------------------------------------------------------------- */

export class RedisEventStore implements EventStore {

    constructor(

        private readonly redis: RedisLikeStore,

        private readonly prefix = "agent:events"

    ) { }

    private key(

        sessionId: SessionId

    ): string {

        return `${this.prefix}:${sessionId}`;

    }

    async create(

        sessionId: SessionId

    ): Promise<EventStream> {

        const existing =

            await this.load(

                sessionId

            );

        if (

            existing

        ) {

            return existing;

        }

        const stream: EventStream = {

            id: sessionId,

            version: 1,

            createdAt: Date.now(),

            updatedAt: Date.now(),

            events: [],

        };

        await this.save(

            stream

        );

        return stream;

    }

    async load(

        sessionId: SessionId

    ): Promise<EventStream | undefined> {

        const raw =

            await this.redis.get(

                this.key(

                    sessionId

                )

            );

        if (

            !raw

        ) {

            return undefined;

        }

        return JSON.parse(

            raw

        ) as EventStream;

    }

    async append(

        sessionId: SessionId,

        event: StoredEvent

    ): Promise<void> {

        const stream =

            await this.create(

                sessionId

            );

        stream.events.push(

            event

        );

        stream.updatedAt = Date.now();

        stream.version++;

        await this.save(

            stream

        );

    }

    async appendMany(

        sessionId: SessionId,

        events: StoredEvent[]

    ): Promise<void> {

        if (

            events.length === 0

        ) {

            return;

        }

        const stream =

            await this.create(

                sessionId

            );

        stream.events.push(

            ...events

        );

        stream.updatedAt = Date.now();

        stream.version++;

        await this.save(

            stream

        );

    }

    async delete(

        sessionId: SessionId

    ): Promise<void> {

        await this.redis.del(

            this.key(

                sessionId

            )

        );

    }

    private async save(

        stream: EventStream

    ): Promise<void> {

        await this.redis.set(

            this.key(

                stream.id

            ),

            JSON.stringify(

                stream

            )

        );

    }

}
