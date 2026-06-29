/**
 * agent/state/utils/deepEqual.ts
 */

function isPrimitive(

    value: unknown

): boolean {

    return (

        value === null ||

        typeof value !== "object"

    );

}

/* -------------------------------------------------------------------------- */
/* Equality                                                                   */
/* -------------------------------------------------------------------------- */

export function deepEqual(

    left: unknown,

    right: unknown,

    visited = new WeakMap<object, object>()

): boolean {

    if (

        Object.is(

            left,

            right

        )

    ) {

        return true;

    }

    if (

        isPrimitive(left) ||

        isPrimitive(right)

    ) {

        return false;

    }

    if (

        left instanceof Date &&

        right instanceof Date

    ) {

        return (

            left.getTime() ===

            right.getTime()

        );

    }

    if (

        left instanceof RegExp &&

        right instanceof RegExp

    ) {

        return (

            left.source === right.source &&

            left.flags === right.flags

        );

    }

    if (

        left instanceof ArrayBuffer &&

        right instanceof ArrayBuffer

    ) {

        if (

            left.byteLength !==

            right.byteLength

        ) {

            return false;

        }

        const a = new Uint8Array(left);

        const b = new Uint8Array(right);

        for (

            let i = 0;

            i < a.length;

            i++

        ) {

            if (

                a[i] !== b[i]

            ) {

                return false;

            }

        }

        return true;

    }

    if (

        ArrayBuffer.isView(left) &&

        ArrayBuffer.isView(right)

    ) {

        return deepEqual(

            left.buffer,

            right.buffer,

            visited

        );

    }

    if (

        Array.isArray(left) &&

        Array.isArray(right)

    ) {

        if (

            left.length !==

            right.length

        ) {

            return false;

        }

        for (

            let i = 0;

            i < left.length;

            i++

        ) {

            if (

                !deepEqual(

                    left[i],

                    right[i],

                    visited

                )

            ) {

                return false;

            }

        }

        return true;

    }

    if (

        left instanceof Map &&

        right instanceof Map

    ) {

        if (

            left.size !==

            right.size

        ) {

            return false;

        }

        for (

            const [

                key,

                value,

            ] of left

        ) {

            if (

                !right.has(

                    key

                )

            ) {

                return false;

            }

            if (

                !deepEqual(

                    value,

                    right.get(key),

                    visited

                )

            ) {

                return false;

            }

        }

        return true;

    }

    if (

        left instanceof Set &&

        right instanceof Set

    ) {

        if (

            left.size !==

            right.size

        ) {

            return false;

        }

        for (

            const value of left

        ) {

            if (

                !right.has(

                    value

                )

            ) {

                return false;

            }

        }

        return true;

    }

    if (

        visited.get(

            left as object

        ) === right

    ) {

        return true;

    }

    visited.set(

        left as object,

        right as object

    );

    const leftKeys =

        Object.keys(

            left as object

        );

    const rightKeys =

        Object.keys(

            right as object

        );

    if (

        leftKeys.length !==

        rightKeys.length

    ) {

        return false;

    }

    for (

        const key of leftKeys

    ) {

        if (

            !(key in (right as object))

        ) {

            return false;

        }

        if (

            !deepEqual(

                (left as Record<string, unknown>)[key],

                (right as Record<string, unknown>)[key],

                visited

            )

        ) {

            return false;

        }

    }

    return true;

}

/* -------------------------------------------------------------------------- */
/* Collections                                                                */
/* -------------------------------------------------------------------------- */

export function arrayEqual<T>(

    left: readonly T[],

    right: readonly T[]

): boolean {

    if (

        left.length !==

        right.length

    ) {

        return false;

    }

    for (

        let i = 0;

        i < left.length;

        i++

    ) {

        if (

            !deepEqual(

                left[i],

                right[i]

            )

        ) {

            return false;

        }

    }

    return true;

}

export function objectEqual<T extends object>(

    left: T,

    right: T

): boolean {

    return deepEqual(

        left,

        right

    );

}

/* -------------------------------------------------------------------------- */
/* Changed Keys                                                               */
/* -------------------------------------------------------------------------- */

export function changedKeys<T extends object>(

    previous: T,

    next: T

): (keyof T)[] {

    const keys =

        new Set<keyof T>([

            ...Object.keys(previous),

            ...Object.keys(next),

        ] as (keyof T)[]);

    const changed: (keyof T)[] = [];

    for (

        const key of keys

    ) {

        if (

            !deepEqual(

                previous[key],

                next[key]

            )

        ) {

            changed.push(

                key

            );

        }

    }

    return changed;

}

/* -------------------------------------------------------------------------- */
/* Default                                                                    */
/* -------------------------------------------------------------------------- */

export default {

    deepEqual,

    arrayEqual,

    objectEqual,

    changedKeys,

};