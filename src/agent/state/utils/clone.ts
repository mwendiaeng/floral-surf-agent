/**
 * agent/state/utils/clone.ts
 *
 * Deep clone utilities.
 */

const structuredCloneImpl: typeof structuredClone | undefined =

    typeof globalThis !== "undefined" &&
        "structuredClone" in globalThis
        ? globalThis.structuredClone
        : undefined;

/* -------------------------------------------------------------------------- */
/* Primitive                                                                  */
/* -------------------------------------------------------------------------- */

function isPrimitive(

    value: unknown

): boolean {

    return (

        value === null ||

        typeof value !== "object"

    );

}

/* -------------------------------------------------------------------------- */
/* Date                                                                       */
/* -------------------------------------------------------------------------- */

function cloneDate(

    value: Date

): Date {

    return new Date(

        value.getTime()

    );

}

/* -------------------------------------------------------------------------- */
/* RegExp                                                                     */
/* -------------------------------------------------------------------------- */

function cloneRegExp(

    value: RegExp

): RegExp {

    return new RegExp(

        value.source,

        value.flags

    );

}

/* -------------------------------------------------------------------------- */
/* ArrayBuffer                                                                */
/* -------------------------------------------------------------------------- */

function cloneArrayBuffer(

    buffer: ArrayBuffer

): ArrayBuffer {

    return buffer.slice(

        0

    );

}

/* -------------------------------------------------------------------------- */
/* Typed Arrays                                                               */
/* -------------------------------------------------------------------------- */

function cloneTypedArray<T extends ArrayBufferView>(

    value: T

): T {

    return new (

        value.constructor as any

    )(

        value.buffer.slice(0)

    );

}

/* -------------------------------------------------------------------------- */
/* Deep Clone                                                                 */
/* -------------------------------------------------------------------------- */

export function deepClone<T>(

    value: T,

    seen = new WeakMap()

): T {

    if (

        isPrimitive(

            value

        )

    ) {

        return value;

    }

    if (

        structuredCloneImpl

    ) {

        return structuredCloneImpl(

            value

        );

    }

    if (

        value instanceof Date

    ) {

        return cloneDate(

            value

        ) as T;

    }

    if (

        value instanceof RegExp

    ) {

        return cloneRegExp(

            value

        ) as T;

    }

    if (

        value instanceof ArrayBuffer

    ) {

        return cloneArrayBuffer(

            value

        ) as T;

    }

    if (

        ArrayBuffer.isView(

            value

        )

    ) {

        return cloneTypedArray(

            value as ArrayBufferView

        ) as T;

    }

    if (

        seen.has(

            value as object

        )

    ) {

        return seen.get(

            value as object

        );

    }

    if (

        Array.isArray(

            value

        )

    ) {

        const output: unknown[] = [];

        seen.set(

            value,

            output

        );

        for (

            const item of value

        ) {

            output.push(

                deepClone(

                    item,

                    seen

                )

            );

        }

        return output as T;

    }

    if (

        value instanceof Map

    ) {

        const output =

            new Map();

        seen.set(

            value,

            output

        );

        for (

            const [

                key,

                item,

            ] of value

        ) {

            output.set(

                deepClone(

                    key,

                    seen

                ),

                deepClone(

                    item,

                    seen

                )

            );

        }

        return output as T;

    }

    if (

        value instanceof Set

    ) {

        const output =

            new Set();

        seen.set(

            value,

            output

        );

        for (

            const item of value

        ) {

            output.add(

                deepClone(

                    item,

                    seen

                )

            );

        }

        return output as T;

    }

    const output: Record<

        string,

        unknown

    > = {};

    seen.set(

        value as object,

        output

    );

    for (

        const [

            key,

            item,

        ] of Object.entries(

            value as Record<string, unknown>

        )

    ) {

        output[key] =

            deepClone(

                item,

                seen

            );

    }

    return output as T;

}

/* -------------------------------------------------------------------------- */
/* Shallow Clone                                                              */
/* -------------------------------------------------------------------------- */

export function shallowClone<T>(

    value: T

): T {

    if (

        Array.isArray(

            value

        )

    ) {

        return [

            ...value,

        ] as T;

    }

    if (

        value &&

        typeof value === "object"

    ) {

        return {

            ...(value as object),

        } as T;

    }

    return value;

}

/* -------------------------------------------------------------------------- */
/* Freeze                                                                     */
/* -------------------------------------------------------------------------- */

export function deepFreeze<T>(

    object: T

): Readonly<T> {

    if (

        object === null ||

        typeof object !== "object"

    ) {

        return object;

    }

    Object.freeze(

        object

    );

    for (

        const key of Object.getOwnPropertyNames(

            object

        )

    ) {

        const value =

            (object as any)[key];

        if (

            value &&

            typeof value === "object" &&

            !Object.isFrozen(

                value

            )

        ) {

            deepFreeze(

                value

            );

        }

    }

    return object;

}

/* -------------------------------------------------------------------------- */
/* Immutable                                                                  */
/* -------------------------------------------------------------------------- */

export function immutableCopy<T>(

    value: T

): Readonly<T> {

    return deepFreeze(

        deepClone(

            value

        )

    );

}

/* -------------------------------------------------------------------------- */
/* Equality                                                                   */
/* -------------------------------------------------------------------------- */

export function cloneEquals(

    a: unknown,

    b: unknown

): boolean {

    return JSON.stringify(

        a

    ) ===

        JSON.stringify(

            b

        );

}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {

    deepClone,

    shallowClone,

    deepFreeze,

    immutableCopy,

    cloneEquals,

};