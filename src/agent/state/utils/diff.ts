/**
 * agent/state/utils/diff.ts
 */

import {

    deepEqual,

} from "./deepEqual";

/* -------------------------------------------------------------------------- */
/* Diff                                                                       */
/* -------------------------------------------------------------------------- */

export type DiffOperation =

    | "add"

    | "remove"

    | "change";

export interface DiffEntry {

    path: string;

    operation: DiffOperation;

    before?: unknown;

    after?: unknown;

}

function isObject(

    value: unknown

): value is Record<string, unknown> {

    return (

        typeof value === "object"

        && value !== null

        && !Array.isArray(value)

    );

}

function joinPath(

    parent: string,

    key: string | number

): string {

    if (

        parent === ""

    ) {

        return String(key);

    }

    return `${parent}.${String(key)}`;

}

function diffValues(

    before: unknown,

    after: unknown,

    path: string,

    entries: DiffEntry[]

): void {

    if (

        deepEqual(

            before,

            after

        )

    ) {

        return;

    }

    if (

        Array.isArray(before)

        && Array.isArray(after)

    ) {

        const max =

            Math.max(

                before.length,

                after.length

            );

        for (

            let index = 0;

            index < max;

            index++

        ) {

            if (

                index >= before.length

            ) {

                entries.push({

                    path: joinPath(

                        path,

                        index

                    ),

                    operation: "add",

                    after: after[index],

                });

                continue;

            }

            if (

                index >= after.length

            ) {

                entries.push({

                    path: joinPath(

                        path,

                        index

                    ),

                    operation: "remove",

                    before: before[index],

                });

                continue;

            }

            diffValues(

                before[index],

                after[index],

                joinPath(

                    path,

                    index

                ),

                entries

            );

        }

        return;

    }

    if (

        isObject(before)

        && isObject(after)

    ) {

        const keys =

            new Set([

                ...Object.keys(before),

                ...Object.keys(after),

            ]);

        for (

            const key of keys

        ) {

            const nextPath =

                joinPath(

                    path,

                    key

                );

            if (

                !(key in before)

            ) {

                entries.push({

                    path: nextPath,

                    operation: "add",

                    after: after[key],

                });

                continue;

            }

            if (

                !(key in after)

            ) {

                entries.push({

                    path: nextPath,

                    operation: "remove",

                    before: before[key],

                });

                continue;

            }

            diffValues(

                before[key],

                after[key],

                nextPath,

                entries

            );

        }

        return;

    }

    entries.push({

        path,

        operation: "change",

        before,

        after,

    });

}

export function diff(

    before: unknown,

    after: unknown

): DiffEntry[] {

    const entries: DiffEntry[] = [];

    diffValues(

        before,

        after,

        "",

        entries

    );

    return entries;

}

export function hasChanges(

    before: unknown,

    after: unknown

): boolean {

    return diff(

        before,

        after

    ).length > 0;

}
