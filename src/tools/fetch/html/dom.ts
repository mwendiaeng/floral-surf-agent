/**
 * html/dom.ts
 *
 * DOM utilities and re-exports for HTML parsing.
 */

export type {

    HtmlDomNode,
    HtmlElement,
    HtmlNode,
    HtmlParent,

} from "./dom/types";

export {

    selectAll,
    selectAttr,
    selectByRole,
    selectMainContent,
    selectOne,
    selectText,

} from "./dom/query/selectors";

import type {

    CheerioAPI,

} from "cheerio";

import {

    selectMainContent,

} from "./dom/query/selectors";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function getDocumentTitle(

    $: CheerioAPI

): string {

    return (

        $("title").first().text().trim()

        || $('meta[property="og:title"]').attr("content")

        || ""

    );

}

export function getMetaDescription(

    $: CheerioAPI

): string {

    return (

        $('meta[name="description"]').attr("content")

        || $('meta[property="og:description"]').attr("content")

        || ""

    );

}

export function getVisibleText(

    $: CheerioAPI,

    selector?: string

): string {

    const root =

        selector

            ? $(selector)

            : selectMainContent(

                $

            );

    return root

        .text()

        .replace(/\s+/g, " ")

        .trim();

}

export function getHeadings(

    $: CheerioAPI

): Array<{ level: number; text: string }> {

    const headings:

        Array<{ level: number; text: string }> = [];

    $("h1, h2, h3, h4, h5, h6").each(

        (_, element) => {

            const tag =

                element.tagName?.toLowerCase() ?? "h1";

            const level =

                Number(tag.replace("h", "")) || 1;

            const text =

                $(element)

                    .text()

                    .replace(/\s+/g, " ")

                    .trim();

            if (

                text

            ) {

                headings.push({

                    level,

                    text,

                });

            }

        }

    );

    return headings;

}
