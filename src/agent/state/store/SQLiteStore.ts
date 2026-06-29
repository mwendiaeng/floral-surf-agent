/**
 * agent/state/store/SQLiteStore.ts
 *
 * Event store for Durable Object SQLite storage.
 */

import type {

    EventStore,
    EventStream,
    SessionId,
    StoredEvent,

} from "../types";

/* -------------------------------------------------------------------------- */
/* SQL Adapter                                                                */
/* -------------------------------------------------------------------------- */

export interface SqlExecutor {

    exec(

        query: string,

        ...bindings: unknown[]

    ): {

        toArray(): Record<string, unknown>[];

    };

}

const CREATE_TABLE = `

    CREATE TABLE IF NOT EXISTS event_streams (

        session_id TEXT PRIMARY KEY,

        version INTEGER NOT NULL,

        created_at INTEGER NOT NULL,

        updated_at INTEGER NOT NULL,

        events TEXT NOT NULL

    );

`;

/* -------------------------------------------------------------------------- */
/* SQLite Event Store                                                         */
/* -------------------------------------------------------------------------- */

export class SQLiteEventStore implements EventStore {

    private initialized = false;

    constructor(

        private readonly sql: SqlExecutor

    ) { }

    private async ensureSchema(): Promise<void> {

        if (

            this.initialized

        ) {

            return;

        }

        this.sql.exec(

            CREATE_TABLE

        );

        this.initialized = true;

    }

    async create(

        sessionId: SessionId

    ): Promise<EventStream> {

        await this.ensureSchema();

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

        await this.ensureSchema();

        const rows =

            this.sql.exec(

                `SELECT session_id, version, created_at, updated_at, events

                 FROM event_streams

                 WHERE session_id = ?`,

                sessionId

            ).toArray();

        if (

            rows.length === 0

        ) {

            return undefined;

        }

        const row = rows[0];

        return {

            id: row.session_id as SessionId,

            version: Number(row.version),

            createdAt: Number(row.created_at),

            updatedAt: Number(row.updated_at),

            events: JSON.parse(

                String(row.events)

            ) as StoredEvent[],

        };

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

        await this.ensureSchema();

        this.sql.exec(

            `DELETE FROM event_streams WHERE session_id = ?`,

            sessionId

        );

    }

    private async save(

        stream: EventStream

    ): Promise<void> {

        await this.ensureSchema();

        this.sql.exec(

            `INSERT INTO event_streams (

                session_id, version, created_at, updated_at, events

             ) VALUES (?, ?, ?, ?, ?)

             ON CONFLICT(session_id) DO UPDATE SET

                version = excluded.version,

                updated_at = excluded.updated_at,

                events = excluded.events`,

            stream.id,

            stream.version,

            stream.createdAt,

            stream.updatedAt,

            JSON.stringify(

                stream.events

            )

        );

    }

}
