/**
 * html/cleanup.ts
 *
 * HTML sanitization and cleanup pipeline.
 */

import * as cheerio from "cheerio";

import {
  BOILERPLATE_TAGS,
  INLINE_ELEMENTS,
  PRESERVE_WHITESPACE_TAGS,
  REGEX,
  REMOVE_TAGS
} from "./constants";

import type { HtmlParseOptions } from "./types";

/* -------------------------------------------------------------------------- */
/*                              Public API                                    */
/* -------------------------------------------------------------------------- */

export function cleanupHtml(
  html: string,
  options: Partial<HtmlParseOptions> = {}
): string {
  if (!html.trim()) {
    return "";
  }

  const $ = cheerio.load(html, {
    xmlMode: false
  });

  removeComments($.root());

  removeDangerousElements($);

  removeHiddenElements($);

  removeBoilerplate($);

  normalizeAttributes($);

  normalizeImages($);

  normalizeLinks($);

  normalizeWhitespace($);

  collapseWhitespace($);

  if (options.images === false) {
    $("img,picture,source").remove();
  }

  if (options.tables === false) {
    $("table").remove();
  }

  if (options.forms === false) {
    $("form").remove();
  }

  if (options.codeBlocks === false) {
    $("pre").remove();

    $("code").remove();
  }

  return $.html();
}

/* -------------------------------------------------------------------------- */
/*                          Dangerous Elements                                */
/* -------------------------------------------------------------------------- */

function removeDangerousElements($: cheerio.CheerioAPI): void {
  for (const tag of REMOVE_TAGS) {
    $(tag).remove();
  }

  $("meta[http-equiv='refresh']").remove();

  $("object").remove();

  $("embed").remove();
}

/* -------------------------------------------------------------------------- */
/*                             Hidden Content                                 */
/* -------------------------------------------------------------------------- */

function removeHiddenElements($: cheerio.CheerioAPI): void {
  $("[hidden]").remove();

  $('[aria-hidden="true"]').remove();

  $("*").each((_, element) => {
    const node = $(element);

    const style = (node.attr("style") ?? "").toLowerCase();

    if (
      style.includes("display:none") ||
      style.includes("display: none") ||
      style.includes("visibility:hidden") ||
      style.includes("visibility: hidden") ||
      style.includes("opacity:0") ||
      style.includes("opacity: 0")
    ) {
      node.remove();
    }
  });
}

/* -------------------------------------------------------------------------- */
/*                          Boilerplate Removal                               */
/* -------------------------------------------------------------------------- */

const BOILERPLATE_SELECTORS = [
  ".advertisement",
  ".advertisements",
  ".ads",
  ".ad",
  ".ad-container",
  ".ad-wrapper",
  ".banner-ad",

  ".cookie",
  ".cookies",
  ".cookie-banner",
  ".cookie-consent",
  ".consent-banner",

  ".newsletter",
  ".newsletter-signup",

  ".popup",
  ".modal",
  ".overlay",

  ".share",
  ".share-buttons",
  ".social-share",
  ".social",

  ".breadcrumbs",
  ".breadcrumb",

  ".pagination",

  ".comments",
  "#comments",
  ".comment-list",

  ".recommended",
  ".related",
  ".related-posts",

  ".sponsored",

  "[role='banner']",
  "[role='complementary']"
];

function removeBoilerplate($: cheerio.CheerioAPI): void {
  for (const tag of BOILERPLATE_TAGS) {
    $(tag).remove();
  }

  for (const selector of BOILERPLATE_SELECTORS) {
    $(selector).remove();
  }
}

/* -------------------------------------------------------------------------- */
/*                         Attribute Normalization                            */
/* -------------------------------------------------------------------------- */

const EVENT_ATTRIBUTES = new Set([
  "onclick",
  "ondblclick",

  "onmousedown",
  "onmouseup",
  "onmousemove",
  "onmouseover",
  "onmouseout",
  "onmouseenter",
  "onmouseleave",

  "onkeydown",
  "onkeyup",
  "onkeypress",

  "onfocus",
  "onblur",

  "onchange",
  "oninput",

  "onsubmit",
  "onreset",

  "ondrag",
  "ondrop",

  "onload",
  "onerror"
]);

function normalizeAttributes($: cheerio.CheerioAPI): void {
  $("*").each((_, element) => {
    const node = $(element);

    const attrs = (element as any).attribs ?? {};

    for (const name of Object.keys(attrs)) {
      if (EVENT_ATTRIBUTES.has(name.toLowerCase())) {
        node.removeAttr(name);

        continue;
      }

      if (attrs[name] === "" || attrs[name] == null) {
        node.removeAttr(name);
      }
    }
  });
}

/* -------------------------------------------------------------------------- */
/*                             Image Cleanup                                  */
/* -------------------------------------------------------------------------- */

function normalizeImages($: cheerio.CheerioAPI): void {
  $("img").each((_, element) => {
    const img = $(element);

    const src =
      img.attr("src") ??
      img.attr("data-src") ??
      img.attr("data-original") ??
      img.attr("data-lazy-src");

    if (src) {
      img.attr("src", src);
    }

    img.removeAttr("srcset");

    img.removeAttr("sizes");

    img.removeAttr("loading");

    img.removeAttr("decoding");

    img.removeAttr("fetchpriority");
  });
}

/* -------------------------------------------------------------------------- */
/*                              Link Cleanup                                  */
/* -------------------------------------------------------------------------- */

function normalizeLinks($: cheerio.CheerioAPI): void {
  $("a[href]").each((_, element) => {
    const link = $(element);

    const href = (link.attr("href") ?? "").trim();

    if (!href) {
      link.remove();

      return;
    }

    if (href.startsWith("javascript:") || href.startsWith("vbscript:")) {
      link.remove();

      return;
    }

    if (href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    link.attr("href", href.replace(/\s+/g, ""));
  });
}

/* -------------------------------------------------------------------------- */
/*                        Whitespace Normalization                             */
/* -------------------------------------------------------------------------- */

function normalizeWhitespace($: cheerio.CheerioAPI): void {
  $("*")
    .contents()
    .each((_, node) => {
      if (node.type !== "text") {
        return;
      }

      const parent = node.parent as any;

      if (!parent?.name) {
        return;
      }

      if (PRESERVE_WHITESPACE_TAGS.includes(parent.name)) {
        return;
      }

      node.data = (node.data ?? "")

        .replace(/\u00A0/g, " ")

        .replace(REGEX.MULTIPLE_WHITESPACE, " ")

        .replace(/\n+/g, " ")

        .trim();
    });
}

/* -------------------------------------------------------------------------- */
/*                         Whitespace Collapsing                              */
/* -------------------------------------------------------------------------- */

function collapseWhitespace($: cheerio.CheerioAPI): void {
  $("body")
    .find("*")
    .contents()
    .each((_, node) => {
      if (node.type !== "text") {
        return;
      }

      const parent = node.parent as any;

      if (parent && PRESERVE_WHITESPACE_TAGS.includes(parent.name)) {
        return;
      }

      node.data = (node.data ?? "")

        .replace(/\s+/g, " ")

        .trim();
    });
}

/* -------------------------------------------------------------------------- */
/*                           Comment Removal                                  */
/* -------------------------------------------------------------------------- */

function removeComments(root: cheerio.Cheerio<any>): void {
  root.contents().each((_, node) => {
    if (node.type === "comment") {
      node.parent?.children.splice(
        node.parent.children.indexOf(node),

        1
      );

      return;
    }

    if ("children" in node) {
      removeComments(cheerio.load("")(node));
    }
  });
}

/* -------------------------------------------------------------------------- */
/*                         Empty Node Removal                                 */
/* -------------------------------------------------------------------------- */

function removeEmptyNodes($: cheerio.CheerioAPI): void {
  $("*").each((_, element) => {
    const node = $(element);

    if (
      element.type === "tag" &&
      INLINE_ELEMENTS.includes((element as any).tagName)
    ) {
      return;
    }

    if (node.children().length === 0 && !node.text().trim()) {
      node.remove();
    }
  });
}

/* -------------------------------------------------------------------------- */
/*                       DOM Normalization                                    */
/* -------------------------------------------------------------------------- */

export function normalizeDom(html: string): string {
  const $ = cheerio.load(html);

  removeComments($.root());

  removeDangerousElements($);

  removeHiddenElements($);

  removeBoilerplate($);

  normalizeAttributes($);

  normalizeImages($);

  normalizeLinks($);

  normalizeWhitespace($);

  collapseWhitespace($);

  removeEmptyNodes($);

  return $.html();
}

/* -------------------------------------------------------------------------- */
/*                             HTML Escaping                                  */
/* -------------------------------------------------------------------------- */

const HTML_ESCAPE_MAP: Readonly<Record<string, string>> = Object.freeze({
  "&": "&amp;",

  "<": "&lt;",

  ">": "&gt;",

  '"': "&quot;",

  "'": "&#39;"
});

const HTML_UNESCAPE_MAP: Readonly<Record<string, string>> = Object.freeze({
  "&amp;": "&",

  "&lt;": "<",

  "&gt;": ">",

  "&quot;": '"',

  "&#39;": "'",

  "&nbsp;": " "
});

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,

    (character) => HTML_ESCAPE_MAP[character]
  );
}

/* -------------------------------------------------------------------------- */
/*                           HTML Unescaping                                  */
/* -------------------------------------------------------------------------- */

export function decodeHtml(value: string): string {
  return value.replace(
    /&(amp|lt|gt|quot|#39|nbsp);/g,

    (entity) => HTML_UNESCAPE_MAP[entity] ?? entity
  );
}

/* -------------------------------------------------------------------------- */
/*                              Strip HTML                                    */
/* -------------------------------------------------------------------------- */

export function stripHtml(html: string): string {
  if (!html.trim()) {
    return "";
  }

  return cheerio

    .load(html)

    .text()

    .replace(REGEX.MULTIPLE_WHITESPACE, " ")

    .trim();
}

/* -------------------------------------------------------------------------- */
/*                           Text Normalization                               */
/* -------------------------------------------------------------------------- */

export function normalizeText(text: string): string {
  return decodeHtml(text)
    .replace(/\u00A0/g, " ")

    .replace(/\r/g, "")

    .replace(/\t/g, " ")

    .replace(/\s+/g, " ")

    .replace(/\n{3,}/g, "\n\n")

    .trim();
}

/* -------------------------------------------------------------------------- */
/*                           HTML → Text                                      */
/* -------------------------------------------------------------------------- */

export function extractText(html: string): string {
  return normalizeText(stripHtml(cleanupHtml(html)));
}

/* -------------------------------------------------------------------------- */
/*                              HTML Minifier                                */
/* -------------------------------------------------------------------------- */

export function minifyHtml(html: string): string {
  if (!html.trim()) {
    return "";
  }

  return html

    .replace(REGEX.HTML_COMMENT, "")

    .replace(/>\s+</g, "><")

    .replace(/\n/g, "")

    .replace(/\t/g, "")

    .replace(/\s{2,}/g, " ")

    .trim();
}

/* -------------------------------------------------------------------------- */
/*                         Pretty Printer                                     */
/* -------------------------------------------------------------------------- */

export function prettyHtml(html: string): string {
  const $ = cheerio.load(html);

  return $.html();
}

/* -------------------------------------------------------------------------- */
/*                           HTML Validation                                  */
/* -------------------------------------------------------------------------- */

export function isHtmlEmpty(html: string): boolean {
  return extractText(html).length === 0;
}

/* -------------------------------------------------------------------------- */
/*                            Cleanup Pipeline                                */
/* -------------------------------------------------------------------------- */

export default {
  cleanupHtml,

  normalizeDom,

  normalizeWhitespace,

  collapseWhitespace,

  normalizeAttributes,

  normalizeImages,

  normalizeLinks,

  removeBoilerplate,

  removeHiddenElements,

  removeDangerousElements,

  removeComments,

  removeEmptyNodes,

  escapeHtml,

  decodeHtml,

  stripHtml,

  normalizeText,

  extractText,

  minifyHtml,

  prettyHtml,

  isHtmlEmpty
};
