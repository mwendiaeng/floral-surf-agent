/**
 * agent/state/utils/timestamps.ts
 */

export interface Stopwatch {

    readonly startedAt: number;

    elapsed(): number;

    restart(): void;

}

/* -------------------------------------------------------------------------- */
/* Current Time                                                               */
/* -------------------------------------------------------------------------- */

export function now(): number {

    return Date.now();

}

/* -------------------------------------------------------------------------- */
/* ISO                                                                        */
/* -------------------------------------------------------------------------- */

export function nowIso(): string {

    return new Date(

        now()

    ).toISOString();

}

/* -------------------------------------------------------------------------- */
/* Date                                                                       */
/* -------------------------------------------------------------------------- */

export function toDate(

    timestamp: number

): Date {

    return new Date(

        timestamp

    );

}

export function toIso(

    timestamp: number

): string {

    return new Date(

        timestamp

    ).toISOString();

}

/* -------------------------------------------------------------------------- */
/* Duration                                                                   */
/* -------------------------------------------------------------------------- */

export function duration(

    startedAt: number,

    completedAt = now()

): number {

    return Math.max(

        0,

        completedAt - startedAt

    );

}

/* -------------------------------------------------------------------------- */
/* Stopwatch                                                                  */
/* -------------------------------------------------------------------------- */

export function createStopwatch(): Stopwatch {

    let started = now();

    return {

        get startedAt() {

            return started;

        },

        elapsed() {

            return duration(

                started

            );

        },

        restart() {

            started = now();

        },

    };

}

/* -------------------------------------------------------------------------- */
/* Expiration                                                                 */
/* -------------------------------------------------------------------------- */

export function expiresIn(

    milliseconds: number

): number {

    return now() + milliseconds;

}

export function hasExpired(

    expiresAt?: number

): boolean {

    if (

        expiresAt === undefined

    ) {

        return false;

    }

    return now() >= expiresAt;

}

/* -------------------------------------------------------------------------- */
/* Age                                                                        */
/* -------------------------------------------------------------------------- */

export function age(

    createdAt: number

): number {

    return duration(

        createdAt

    );

}

/* -------------------------------------------------------------------------- */
/* Comparisons                                                                */
/* -------------------------------------------------------------------------- */

export function newest(

    ...timestamps: number[]

): number {

    return Math.max(

        ...timestamps

    );

}

export function oldest(

    ...timestamps: number[]

): number {

    return Math.min(

        ...timestamps

    );

}

/* -------------------------------------------------------------------------- */
/* Human Duration                                                             */
/* -------------------------------------------------------------------------- */

export function formatDuration(

    milliseconds: number

): string {

    if (

        milliseconds < 1000

    ) {

        return `${milliseconds} ms`;

    }

    const seconds =

        milliseconds / 1000;

    if (

        seconds < 60

    ) {

        return `${seconds.toFixed(2)} s`;

    }

    const minutes =

        Math.floor(

            seconds / 60

        );

    const remainingSeconds =

        Math.floor(

            seconds % 60

        );

    return `${minutes}m ${remainingSeconds}s`;

}

/* -------------------------------------------------------------------------- */
/* Sleep                                                                      */
/* -------------------------------------------------------------------------- */

export function sleep(

    milliseconds: number

): Promise<void> {

    return new Promise(

        resolve =>

            setTimeout(

                resolve,

                milliseconds

            )

    );

}

/* -------------------------------------------------------------------------- */
/* Clock                                                                      */
/* -------------------------------------------------------------------------- */

export interface Clock {

    now(): number;

}

export class SystemClock

    implements Clock {

    now(): number {

        return Date.now();

    }

}

export class FixedClock

    implements Clock {

    constructor(

        private readonly value: number

    ) { }

    now(): number {

        return this.value;

    }

}

export class MockClock

    implements Clock {

    constructor(

        private current = Date.now()

    ) { }

    now(): number {

        return this.current;

    }

    set(

        value: number

    ): void {

        this.current = value;

    }

    advance(

        milliseconds: number

    ): void {

        this.current += milliseconds;

    }

}

/* -------------------------------------------------------------------------- */
/* Default                                                                    */
/* -------------------------------------------------------------------------- */

export const systemClock =

    new SystemClock();

export default {

    now,

    nowIso,

    toDate,

    toIso,

    duration,

    age,

    newest,

    oldest,

    expiresIn,

    hasExpired,

    formatDuration,

    sleep,

    createStopwatch,

    systemClock,

    SystemClock,

    FixedClock,

    MockClock,

};