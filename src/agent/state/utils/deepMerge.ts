/**
 * agent/state/utils/deepMerge.ts
 *
 * Immutable deep merge utilities.
 */

import { deepClone } from "./clone";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface MergeOptions {

    mergeArrays?: boolean;

    mergeSets?: boolean;

    mergeMaps?: boolean;

    overwriteUndefined?: boolean;

}

const DEFAULT_OPTIONS: Required<MergeOptions> = {

    mergeArrays: false,

    mergeSets: true,

    mergeMaps: true,

    overwriteUndefined: false,

};

/* -------------------------------------------------------------------------- */
/* Type Guards                                                                */
/* -------------------------------------------------------------------------- */

function isObject(

    value: unknown

): value is Record<string, unknown> {

    return (

        value !== null &&

        typeof value === "object" &&

        !Array.isArray(value) &&

        !(value instanceof Date) &&

        !(value instanceof RegExp) &&

        !(value instanceof Map) &&

        !(value instanceof Set)

    );

}

/* -------------------------------------------------------------------------- */
/* Arrays                                                                     */
/* -------------------------------------------------------------------------- */

function mergeArrays<T>(

    target: T[],

    source: T[],

    enabled: boolean

): T[] {

    if (

        !enabled

    ) {

        return deepClone(source);

    }

    return [

        ...deepClone(target),

        ...deepClone(source),

    ];

}

/* -------------------------------------------------------------------------- */
/* Maps                                                                       */
/* -------------------------------------------------------------------------- */

function mergeMaps<K, V>(

    target: Map<K, V>,

    source: Map<K, V>,

    enabled: boolean

): Map<K, V> {

    if (

        !enabled

    ) {

        return new Map(source);

    }

    const merged =

        new Map(target);

    for (

        const [

            key,

            value,

        ] of source

    ) {

        merged.set(

            key,

            deepClone(value)

        );

    }

    return merged;

}

/* -------------------------------------------------------------------------- */
/* Sets                                                                       */
/* -------------------------------------------------------------------------- */

function mergeSets<T>(

    target: Set<T>,

    source: Set<T>,

    enabled: boolean

): Set<T> {

    if (

        !enabled

    ) {

        return new Set(source);

    }

    return new Set([

        ...target,

        ...source,

    ]);

}

/* -------------------------------------------------------------------------- */
/* Internal Merge                                                             */
/* -------------------------------------------------------------------------- */

function mergeInternal(

    target: unknown,

    source: unknown,

    options: Required<MergeOptions>

): unknown {

    if (

        source === undefined &&

        !options.overwriteUndefined

    ) {

        return deepClone(target);

    }

    if (

        target === undefined ||

        target === null

    ) {

        return deepClone(source);

    }

    if (

        source === null

    ) {

        return null;

    }

    if (

        Array.isArray(target) &&

        Array.isArray(source)

    ) {

        return mergeArrays(

            target,

            source,

            options.mergeArrays

        );

    }

    if (

        target instanceof Map &&

        source instanceof Map

    ) {

        return mergeMaps(

            target,

            source,

            options.mergeMaps

        );

    }

    if (

        target instanceof Set &&

        source instanceof Set

    ) {

        return mergeSets(

            target,

            source,

            options.mergeSets

        );

    }

    if (

        !isObject(target) ||

        !isObject(source)

    ) {

        return deepClone(source);

    }

    const output: Record<

        string,

        unknown

    > = deepClone(target);

    for (

        const [

            key,

            value,

        ] of Object.entries(source)

    ) {

        output[key] =

            mergeInternal(

                output[key],

                value,

                options

            );

    }

    return output;

}

/* -------------------------------------------------------------------------- */
/* Deep Merge                                                                 */
/* -------------------------------------------------------------------------- */

export function deepMerge<T>(

    target: T,

    source: Partial<T>,

    options: MergeOptions = {}

): T {

    return mergeInternal(

        target,

        source,

        {

            ...DEFAULT_OPTIONS,

            ...options,

        }

    ) as T;

}

/* -------------------------------------------------------------------------- */
/* Multiple Merge                                                             */
/* -------------------------------------------------------------------------- */

export function mergeMany<T>(

    initial: T,

    ...sources: Partial<T>[]

): T {

    let result =

        deepClone(initial);

    for (

        const source of sources

    ) {

        result =

            deepMerge(

                result,

                source

            );

    }

    return result;

}

/* -------------------------------------------------------------------------- */
/* Replace                                                                     */
/* -------------------------------------------------------------------------- */

export function replace<T>(

    _: T,

    replacement: T

): T {

    return deepClone(

        replacement

    );

}

/* -------------------------------------------------------------------------- */
/* Defaults                                                                   */
/* -------------------------------------------------------------------------- */

export function mergeDefaults<T>(

    defaults: T,

    overrides?: Partial<T>

): T {

    if (

        !overrides

    ) {

        return deepClone(

            defaults

        );

    }

    return deepMerge(

        defaults,

        overrides

    );

}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {

    deepMerge,

    mergeMany,

    mergeDefaults,

    replace,

};