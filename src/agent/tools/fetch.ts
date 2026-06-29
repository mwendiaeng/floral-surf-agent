/**
 * agent/tools/fetch.ts
 */

import {

    fetchUrl,

} from "../../tools/fetch/fetch";

import type {

    ToolHandler,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Fetch Tool                                                                 */
/* -------------------------------------------------------------------------- */

export const fetchTool: ToolHandler<

    { url: string },

    unknown

> = {

    definition: {

        name: "fetch",

        description:

            "Fetch and parse a URL. Returns extracted text and metadata.",

        schema: {

            name: "fetch",

            description:

                "Fetch and parse a URL.",

            parameters: [

                {

                    name: "url",

                    type: "string",

                    description:

                        "The URL to fetch.",

                    required: true,

                },

            ],

        },

    },

    async execute(

        input,

        context

    ) {

        const result =

            await fetchUrl(

                input.url,

                {

                    signal: context.signal,

                }

            );

        return {

            success: true,

            output: result,

        };

    },

};
