/**
 * agent/tools/schema.ts
 */

import {

    z,

} from "zod";

import type {

    ToolParameter,
    ToolParameterType,

} from "../state/types";

/* -------------------------------------------------------------------------- */
/* Zod                                                                        */
/* -------------------------------------------------------------------------- */

function parameterTypeToZod(

    type: ToolParameterType,

    description?: string

): z.ZodTypeAny {

    let schema: z.ZodTypeAny;

    switch (

        type

    ) {

        case "string":

            schema = z.string();

            break;

        case "number":

            schema = z.number();

            break;

        case "boolean":

            schema = z.boolean();

            break;

        case "array":

            schema = z.array(

                z.unknown()

            );

            break;

        case "object":

            schema = z.record(

                z.string(),

                z.unknown()

            );

            break;

        case "null":

            schema = z.null();

            break;

        default:

            schema = z.unknown();

    }

    if (

        description

    ) {

        schema = schema.describe(

            description

        );

    }

    return schema;

}

export function parametersToZod(

    parameters: readonly ToolParameter[]

): z.ZodObject<Record<string, z.ZodTypeAny>> {

    const shape: Record<string, z.ZodTypeAny> =

        {};

    for (

        const parameter of parameters

    ) {

        let schema =

            parameterTypeToZod(

                parameter.type,

                parameter.description

            );

        if (

            parameter.default !== undefined

        ) {

            schema = schema.default(

                parameter.default as never

            );

        }

        if (

            !parameter.required

        ) {

            schema = schema.optional();

        }

        shape[parameter.name] = schema;

    }

    return z.object(

        shape

    );

}
