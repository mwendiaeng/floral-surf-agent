/**
 * agent/state/utils/hashing.ts
 */

import { createHash } from "crypto";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type HashAlgorithm =

    | "sha1"

    | "sha256"

    | "sha512"

    | "md5";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const DEFAULT_HASH_ALGORITHM: HashAlgorithm =

    "sha256";

/* -------------------------------------------------------------------------- */
/* Stable Stringify                                                           */
/* -------------------------------------------------------------------------- */

export function stableStringify(

    value: unknown

): string {

    return JSON.stringify(

        sortValue(value)

    );

}

function sortValue(

    value: unknown

): unknown {

    if (

        Array.isArray(value)

    ) {

        return value.map(

            sortValue

        );

    }

    if (

        value instanceof Date

    ) {

        return value.toISOString();

    }

    if (

        value instanceof Set

    ) {

        return [

            ...value,

        ]

            .map(sortValue)

            .sort();

    }

    if (

        value instanceof Map

    ) {

        return Object.fromEntries(

            [...value.entries()]

                .sort(([a], [b]) =>

                    String(a).localeCompare(

                        String(b)

                    )

                )

                .map(([k, v]) => [

                    k,

                    sortValue(v),

                ])

        );

    }

    if (

        value &&

        typeof value === "object"

    ) {

        return Object.keys(value)

            .sort()

            .reduce(

                (

                    output,

                    key

                ) => {

                    output[key] =

                        sortValue(

                            (

                                value as Record<

                                    string,

                                    unknown

                                >

                            )[key]

                        );

                    return output;

                },

                {} as Record<

                    string,

                    unknown

                >

            );

    }

    return value;

}

/* -------------------------------------------------------------------------- */
/* Hash                                                                       */
/* -------------------------------------------------------------------------- */

export function hash(

    value: unknown,

    algorithm: HashAlgorithm =

        DEFAULT_HASH_ALGORITHM

): string {

    return createHash(

        algorithm

    )

        .update(

            stableStringify(

                value

            )

        )

        .digest(

            "hex"

        );

}

/* -------------------------------------------------------------------------- */
/* Buffer                                                                     */
/* -------------------------------------------------------------------------- */

export function hashBuffer(

    buffer: ArrayBuffer,

    algorithm: HashAlgorithm =

        DEFAULT_HASH_ALGORITHM

): string {

    return createHash(

        algorithm

    )

        .update(

            Buffer.from(

                buffer

            )

        )

        .digest(

            "hex"

        );

}

/* -------------------------------------------------------------------------- */
/* String                                                                     */
/* -------------------------------------------------------------------------- */

export function hashString(

    value: string,

    algorithm: HashAlgorithm =

        DEFAULT_HASH_ALGORITHM

): string {

    return createHash(

        algorithm

    )

        .update(

            value

        )

        .digest(

            "hex"

        );

}

/* -------------------------------------------------------------------------- */
/* Object                                                                     */
/* -------------------------------------------------------------------------- */

export function objectHash(

    object: object

): string {

    return hash(

        object

    );

}

/* -------------------------------------------------------------------------- */
/* State Fingerprint                                                          */
/* -------------------------------------------------------------------------- */

export function fingerprint(

    state: unknown

): string {

    return hash(

        state

    );

}

/* -------------------------------------------------------------------------- */
/* Event Fingerprint                                                          */
/* -------------------------------------------------------------------------- */

export function eventFingerprint(

    event: unknown

): string {

    return hash(

        event

    );

}

/* -------------------------------------------------------------------------- */
/* Equality                                                                   */
/* -------------------------------------------------------------------------- */

export function hashEquals(

    left: unknown,

    right: unknown

): boolean {

    return (

        fingerprint(

            left

        ) ===

        fingerprint(

            right

        )

    );

}

/* -------------------------------------------------------------------------- */
/* Incremental Hash                                                           */
/* -------------------------------------------------------------------------- */

export class HashBuilder {

    private readonly hash =

        createHash(

            DEFAULT_HASH_ALGORITHM

        );

    update(

        value: unknown

    ): this {

        this.hash.update(

            stableStringify(

                value

            )

        );

        return this;

    }

    digest(): string {

        return this.hash.digest(

            "hex"

        );

    }

}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {

    hash,

    hashString,

    hashBuffer,

    objectHash,

    fingerprint,

    eventFingerprint,

    hashEquals,

    stableStringify,

    HashBuilder,

};