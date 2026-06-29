/**
 * agent/state/serializers/compressed.ts
 */

import type {

    AgentState,
    StateCompression,
    StateSerializer,

} from "../types";

import {

    BinaryStateSerializer,

} from "./binary";

/* -------------------------------------------------------------------------- */
/* Compression                                                                */
/* -------------------------------------------------------------------------- */

export class GzipStateCompression implements StateCompression {

    async compress(

        data: Uint8Array

    ): Promise<Uint8Array> {

        if (

            typeof CompressionStream === "undefined"

        ) {

            return data;

        }

        const stream =

            new Blob([data as BlobPart])

                .stream()

                .pipeThrough(

                    new CompressionStream("gzip")

                );

        return new Uint8Array(

            await new Response(stream).arrayBuffer()

        );

    }

    async decompress(

        data: Uint8Array

    ): Promise<Uint8Array> {

        if (

            typeof DecompressionStream === "undefined"

        ) {

            return data;

        }

        const stream =

            new Blob([data as BlobPart])

                .stream()

                .pipeThrough(

                    new DecompressionStream("gzip")

                );

        return new Uint8Array(

            await new Response(stream).arrayBuffer()

        );

    }

}

/* -------------------------------------------------------------------------- */
/* Compressed Serializer                                                      */
/* -------------------------------------------------------------------------- */

export class CompressedStateSerializer implements StateSerializer {

    readonly name = "compressed";

    constructor(

        private readonly compression:

        StateCompression = new GzipStateCompression()

    ) { }

    private readonly binary =

        new BinaryStateSerializer();

    async serialize(

        state: AgentState

    ): Promise<Uint8Array> {

        const encoded =

            await this.binary.serialize(

                state

            );

        return this.compression.compress(

            encoded

        );

    }

    async deserialize(

        data: string | Uint8Array

    ): Promise<AgentState> {

        const bytes =

            typeof data === "string"

                ? new TextEncoder().encode(

                    data

                )

                : data;

        const decoded =

            await this.compression.decompress(

                bytes

            );

        return this.binary.deserialize(

            decoded

        );

    }

}

export const gzipCompression =

    new GzipStateCompression();

export const compressedSerializer =

    new CompressedStateSerializer();
