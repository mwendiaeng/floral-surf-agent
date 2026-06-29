/**
 * html/dom/query/selectors.ts
 */

import type {

    CheerioAPI,

} from "cheerio";

/* -------------------------------------------------------------------------- */
/* Selectors                                                                  */
/* -------------------------------------------------------------------------- */

export function selectAll(

    $: CheerioAPI,

    selector: string

) {

    return $(selector);

}

export function selectOne(

    $: CheerioAPI,

    selector: string

) {

    return $(selector).first();

}

export function selectText(

    $: CheerioAPI,

    selector: string

): string[] {

    return selectAll(

        $,

        selector

    )

        .map((_, element) =>

            $(element)

                .text()

                .replace(/\s+/g, " ")

                .trim()

        )

        .get()

        .filter(Boolean);

}

export function selectAttr(

    $: CheerioAPI,

    selector: string,

    attribute: string

): string[] {

    return selectAll(

        $,

        selector

    )

        .map((_, element) =>

            $(element).attr(attribute) ?? ""

        )

        .get()

        .filter(Boolean);

}

export function selectByRole(

    $: CheerioAPI,

    role: string

) {

    return $(`[role="${role}"]`);

}

export function selectMainContent(

    $: CheerioAPI

) {

    return (

        $("main").first().length

            ? $("main").first()

            : $("article").first().length

                ? $("article").first()

                : $("#content, .content, .main").first()

    );

}
