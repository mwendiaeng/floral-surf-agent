/**
 * fetch/parser.ts
 *
 * Universal document parser.
 *
 * Converts HTTP responses into structured content
 * usable by the AI agent.
 */

import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { parse as parseYaml } from "yaml";
import { parse as parseCSV } from "csv-parse/sync";
import { XMLParser } from "fast-xml-parser";

import {
    ParsedContent,
    ParsedTable,
    Heading,
    CodeBlock,
    ExtractedImage,
    ExtractedLink,
    ResponseKind,
} from "./types";

import { extractReadableArticle } from "./readability";

const xmlParser = new XMLParser({
    ignoreAttributes: false,
});

export async function parseContent(
    body: string,
    contentType: string
): Promise<ParsedContent> {

    const type = detectContentType(contentType);

    switch (type) {

        case "html":
            return parseHTML(body);

        case "markdown":
            return parseMarkdown(body);

        case "json":
            return parseJSON(body);

        case "xml":
        case "rss":
        case "atom":
            return parseXML(body);

        case "csv":
            return parseCsv(body);

        case "yaml":
            return parseYAML(body);

        case "text":
            return parseText(body);

        default:

            return {

                type: "unknown",

                text: body,

            };

    }

}