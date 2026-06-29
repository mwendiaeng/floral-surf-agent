/**
 * agent/state/store/PostgresStore.ts
 *
 * Event store for PostgreSQL (Supabase, Neon, Hyperdrive, etc.).
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

export interface PostgresQueryable {

    query<T = Record<string, unknown>>(

        sql: string,

        params?: unknown[]

    ): Promise<T[]>;

    execute(

        sql: string,

        params?: unknown[]

    ): Promise<void>;

}

const CREATE_TABLE = `

    CREATE TABLE IF NOT EXISTS agent_event_streams (

        session_id TEXT PRIMARY KEY,

        version INTEGER NOT NULL,

        created_at BIGINT NOT NULL,

        updated_at BIGINT NOT NULL,

        events JSONB NOT NULL DEFAULT '[]'::jsonb

    );

`;

/* -------------------------------------------------------------------------- */
/* Postgres Event Store                                                       */
/* -------------------------------------------------------------------------- */

export class PostgresEventStore implements EventStore {

    private initialized = false;

    constructor(

        private readonly db: PostgresQueryable,

        private readonly table = "agent_event_streams"

    ) { }

    private async ensureSchema(): Promise<void> {

        if (

            this.initialized

        ) {

            return;

        }

        await this.db.execute(

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

            await this.db.query<{

                session_id: string;

                version: number;

                created_at: string | number;

                updated_at: string | number;

                events: StoredEvent[] | string;

            }>(

                `SELECT session_id, version, created_at, updated_at, events

                 FROM ${this.table}

                 WHERE session_id = $1

                 LIMIT 1`,

                [sessionId]

            );

        if (

            rows.length === 0

        ) {

            return undefined;

        }

        const row = rows[0];

        const events =

            typeof row.events === "string"

                ? JSON.parse(

                    row.events

                ) as StoredEvent[]

                : row.events;

        return {

            id: row.session_id as SessionId,

            version: Number(row.version),

            createdAt: Number(row.created_at),

            updatedAt: Number(row.updated_at),

            events,

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

        await this.db.execute(

            `DELETE FROM ${this.table} WHERE session_id = $1`,

            [sessionId]

        );

    }

    private async save(

        stream: EventStream

    ): Promise<void> {

        await this.ensureSchema();

        await this.db.execute(

            `INSERT INTO ${this.table} (

                session_id, version, created_at, updated_at, events

             ) VALUES ($1, $2, $3, $4, $5::jsonb)

             ON CONFLICT (session_id) DO UPDATE SET

                version = EXCLUDED.version,

                updated_at = EXCLUDED.updated_at,

                events = EXCLUDED.events`,

            [

                stream.id,

                stream.version,

                stream.createdAt,

                stream.updatedAt,

                JSON.stringify(

                    stream.events

                ),

            ]

        );

    }

}
