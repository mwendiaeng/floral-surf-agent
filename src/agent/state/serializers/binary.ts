/**
 * agent/state/serializers/binary.ts
 */

import type {

    AgentState,
    StateSerializer,

} from "../types";

import {

    JsonStateSerializer,

} from "./json";

/* -------------------------------------------------------------------------- */
/* Binary Serializer                                                          */
/* -------------------------------------------------------------------------- */

export class BinaryStateSerializer implements StateSerializer {

    readonly name = "binary";

    private readonly json =

        new JsonStateSerializer();

    async serialize(

        state: AgentState

    ): Promise<Uint8Array> {

        const text =

            await this.json.serialize(

                state

            );

        return new TextEncoder().encode(

            text

        );

    }

    async deserialize(

        data: string | Uint8Array

    ): Promise<AgentState> {

        return this.json.deserialize(

            data

        );

    }

}

export const binarySerializer =

    new BinaryStateSerializer();
