/**
 * agent/state/serializers/json.ts
 */

import type {

    AgentState,
    StateSerializer,

} from "../types";

import {

    deepClone,

} from "../utils/clone";

/* -------------------------------------------------------------------------- */
/* JSON Serializer                                                            */
/* -------------------------------------------------------------------------- */

export class JsonStateSerializer implements StateSerializer {

    readonly name = "json";

    async serialize(

        state: AgentState

    ): Promise<string> {

        return JSON.stringify(

            deepClone(

                state

            )

        );

    }

    async deserialize(

        data: string | Uint8Array

    ): Promise<AgentState> {

        const text =

            typeof data === "string"

                ? data

                : new TextDecoder().decode(

                    data

                );

        return JSON.parse(

            text

        ) as AgentState;

    }

}

export const jsonSerializer =

    new JsonStateSerializer();
