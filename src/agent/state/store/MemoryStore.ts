/**
 * MemoryEventStore.ts
 */

import type {
    EventStore,
    EventStream,
    SessionId,
    StoredEvent,
} from "../types";

export class MemoryEventStore implements EventStore {

    private readonly streams = new Map<
        SessionId,
        EventStream
    >();

    /* ---------------------------------------------------------------------- */
    /* Create                                                                  */
    /* ---------------------------------------------------------------------- */

    async create(
        sessionId: SessionId
    ): Promise<EventStream> {

        const existing = this.streams.get(sessionId);

        if (existing) {
            return existing;
        }

        const stream: EventStream = {
            id: sessionId,
            version: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            events: [],
        };

        this.streams.set(
            sessionId,
            stream
        );

        return stream;

    }

    /* ---------------------------------------------------------------------- */
    /* Load                                                                    */
    /* ---------------------------------------------------------------------- */

    async load(
        sessionId: SessionId
    ): Promise<EventStream | undefined> {

        return this.streams.get(
            sessionId
        );

    }

    /* ---------------------------------------------------------------------- */
    /* Append                                                                  */
    /* ---------------------------------------------------------------------- */

    async append(
        sessionId: SessionId,
        event: StoredEvent
    ): Promise<void> {

        const stream =
            await this.create(
                sessionId
            );

        stream.events.push(event);

        stream.updatedAt = Date.now();

        stream.version++;

    }

    /* ---------------------------------------------------------------------- */
    /* Append Many                                                             */
    /* ---------------------------------------------------------------------- */

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

        stream.updatedAt =
            Date.now();

        stream.version++;

    }

    /* ---------------------------------------------------------------------- */
    /* Delete                                                                  */
    /* ---------------------------------------------------------------------- */

    async delete(
        sessionId: SessionId
    ): Promise<void> {

        this.streams.delete(
            sessionId
        );

    }

    /* ---------------------------------------------------------------------- */
    /* Exists                                                                  */
    /* ---------------------------------------------------------------------- */

    has(
        sessionId: SessionId
    ): boolean {

        return this.streams.has(
            sessionId
        );

    }

    /* ---------------------------------------------------------------------- */
    /* Count                                                                   */
    /* ---------------------------------------------------------------------- */

    count(): number {

        return this.streams.size;

    }

    /* ---------------------------------------------------------------------- */
    /* Clear                                                                   */
    /* ---------------------------------------------------------------------- */

    clear(): void {

        this.streams.clear();

    }

    /* ---------------------------------------------------------------------- */
    /* Event Count                                                             */
    /* ---------------------------------------------------------------------- */

    eventCount(
        sessionId: SessionId
    ): number {

        return (
            this.streams.get(sessionId)
                ?.events.length ?? 0
        );

    }

    /* ---------------------------------------------------------------------- */
    /* Sessions                                                                */
    /* ---------------------------------------------------------------------- */

    sessions(): readonly SessionId[] {

        return [
            ...this.streams.keys(),
        ];

    }

}