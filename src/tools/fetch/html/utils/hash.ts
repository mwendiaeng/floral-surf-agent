/**
 * utils/hash.ts
 *
 * Generic hashing utilities.
 */

import * as crypto from "node:crypto";

/* -------------------------------------------------------------------------- */
/*                              Algorithms                                    */
/* -------------------------------------------------------------------------- */

export type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha384" | "sha512";

/* -------------------------------------------------------------------------- */
/*                                Core                                        */
/* -------------------------------------------------------------------------- */

export function hash(
  value: string | Buffer,

  algorithm: HashAlgorithm = "sha256"
): string {
  return crypto

    .createHash(algorithm)

    .update(value)

    .digest("hex");
}

export const md5 = (value: string | Buffer) => hash(value, "md5");

export const sha1 = (value: string | Buffer) => hash(value, "sha1");

export const sha256 = (value: string | Buffer) => hash(value, "sha256");

export const sha384 = (value: string | Buffer) => hash(value, "sha384");

export const sha512 = (value: string | Buffer) => hash(value, "sha512");

/* -------------------------------------------------------------------------- */
/*                           Stable JSON                                      */
/* -------------------------------------------------------------------------- */

export function stableStringify(value: unknown): string {
  return JSON.stringify(sort(value));
}

function sort(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sort);
  }

  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};

    for (const key of Object.keys(value as object).sort()) {
      out[key] = sort((value as Record<string, unknown>)[key]);
    }

    return out;
  }

  return value;
}

/* -------------------------------------------------------------------------- */
/*                             Object Hash                                    */
/* -------------------------------------------------------------------------- */

export function hashObject(
  value: unknown,

  algorithm: HashAlgorithm = "sha256"
): string {
  return hash(
    stableStringify(value),

    algorithm
  );
}

/* -------------------------------------------------------------------------- */
/*                             Streams                                        */
/* -------------------------------------------------------------------------- */

export async function hashStream(
  stream: NodeJS.ReadableStream,

  algorithm: HashAlgorithm = "sha256"
): Promise<string> {
  return new Promise(
    (
      resolve,

      reject
    ) => {
      const hasher = crypto.createHash(algorithm);

      stream.on(
        "data",

        (chunk) => hasher.update(chunk)
      );

      stream.on(
        "end",

        () => resolve(hasher.digest("hex"))
      );

      stream.on(
        "error",

        reject
      );
    }
  );
}

/* -------------------------------------------------------------------------- */
/*                           Compare                                           */
/* -------------------------------------------------------------------------- */

export function compareHashes(
  a: string,

  b: string
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(a),

    Buffer.from(b)
  );
}

/* -------------------------------------------------------------------------- */
/*                              Random                                        */
/* -------------------------------------------------------------------------- */

export function randomHash(bytes = 32): string {
  return crypto

    .randomBytes(bytes)

    .toString("hex");
}
