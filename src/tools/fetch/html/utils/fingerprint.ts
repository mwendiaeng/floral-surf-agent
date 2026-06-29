/**
 * utils/fingerprint.ts
 *
 * High-level fingerprint helpers used by the HTML parser,
 * crawler, cache and incremental indexing.
 */

import * as cheerio from "cheerio";

import { sha256, hashObject } from "./hash";

/* -------------------------------------------------------------------------- */
/*                               Types                                        */
/* -------------------------------------------------------------------------- */

export interface DocumentFingerprint {
  document: string;

  content: string;

  markdown: string;

  html: string;

  dom: string;

  metadata: string;
}

export interface FingerprintMetadata {
  title?: string;

  description?: string;

  canonical?: string;

  author?: string;

  siteName?: string;

  language?: string;

  charset?: string;
}

/* -------------------------------------------------------------------------- */
/*                           Structural Tags                                  */
/* -------------------------------------------------------------------------- */

const STRUCTURAL_TAGS = new Set([
  "html",
  "head",
  "body",

  "main",
  "article",
  "section",
  "header",
  "footer",
  "nav",
  "aside",

  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",

  "p",

  "ul",
  "ol",
  "li",

  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",

  "figure",
  "figcaption",
  "img",

  "blockquote",

  "pre",
  "code",

  "form",
  "input",
  "textarea",
  "select",
  "button"
]);

/* -------------------------------------------------------------------------- */
/*                              Text                                           */
/* -------------------------------------------------------------------------- */

export function fingerprintText(text: string): string {
  return sha256(
    text

      .replace(/\s+/g, " ")

      .trim()
  );
}

/* -------------------------------------------------------------------------- */
/*                              Markdown                                       */
/* -------------------------------------------------------------------------- */

export function fingerprintMarkdown(markdown: string): string {
  return sha256(
    markdown

      .replace(/\s+/g, " ")

      .trim()
  );
}

/* -------------------------------------------------------------------------- */
/*                                HTML                                         */
/* -------------------------------------------------------------------------- */

export function fingerprintHtml(html: string): string {
  return sha256(
    html

      .replace(/\s+/g, " ")

      .trim()
  );
}

/* -------------------------------------------------------------------------- */
/*                             DOM Structure                                   */
/* -------------------------------------------------------------------------- */

export function fingerprintDom(html: string): string {
  const $ = cheerio.load(html);

  const structure = $("*")
    .map((_, element) => {
      if (element.type !== "tag") {
        return null;
      }

      const tag = element.name.toLowerCase();

      if (!STRUCTURAL_TAGS.has(tag)) {
        return null;
      }

      const depth = $(element).parents().length;

      return `${depth}:${tag}`;
    })

    .get()

    .filter((value): value is string => value !== null);

  return sha256(structure.join("|"));
}

/* -------------------------------------------------------------------------- */
/*                              Metadata                                       */
/* -------------------------------------------------------------------------- */

export function fingerprintMetadata(metadata: FingerprintMetadata): string {
  return hashObject({
    title: metadata.title,

    description: metadata.description,

    canonical: metadata.canonical,

    author: metadata.author,

    siteName: metadata.siteName,

    language: metadata.language,

    charset: metadata.charset
  });
}

/* -------------------------------------------------------------------------- */
/*                             Sections                                        */
/* -------------------------------------------------------------------------- */

export function fingerprintSection(
  heading: string,

  text: string
): string {
  return sha256(
    [
      heading,

      text

        .replace(/\s+/g, " ")

        .trim()
    ]

      .join("\n")
  );
}

/* -------------------------------------------------------------------------- */
/*                              Chunks                                         */
/* -------------------------------------------------------------------------- */

export function fingerprintChunk(text: string): string {
  return fingerprintText(text);
}

/* -------------------------------------------------------------------------- */
/*                           Complete Document                                */
/* -------------------------------------------------------------------------- */

export function fingerprintDocument(input: {
  canonical?: string;

  title?: string;

  html?: string;

  markdown?: string;

  text?: string;

  metadata: FingerprintMetadata;
}): DocumentFingerprint {
  const html = input.html ?? "";

  const markdown = input.markdown ?? "";

  const text = input.text ?? "";

  const metadataHash = fingerprintMetadata(input.metadata);

  const domHash = fingerprintDom(html);

  const contentHash = fingerprintText(text);

  const markdownHash = fingerprintMarkdown(markdown);

  const htmlHash = fingerprintHtml(html);

  const documentHash = sha256(
    [
      input.canonical,

      input.title,

      contentHash,

      domHash,

      metadataHash
    ]

      .filter(Boolean)

      .join("\n")
  );

  return {
    document: documentHash,

    content: contentHash,

    markdown: markdownHash,

    html: htmlHash,

    dom: domHash,

    metadata: metadataHash
  };
}

/* -------------------------------------------------------------------------- */
/*                           Comparison                                        */
/* -------------------------------------------------------------------------- */

export function fingerprintsEqual(
  a: string,

  b: string
): boolean {
  return a === b;
}
