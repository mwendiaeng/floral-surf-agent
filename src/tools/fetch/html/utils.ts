/**
 * html/utils.ts
 *
 * Shared utilities for the HTML parser.
 */

import crypto from "node:crypto";

/* -------------------------------------------------------------------------- */
/*                                  Strings                                   */
/* -------------------------------------------------------------------------- */

export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function removeEmptyLines(text: string): string {
  return text
    .split("\n")
    .map(line => line.trimEnd())
    .filter(Boolean)
    .join("\n");
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function truncate(
  text: string,
  maxLength = 300
): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - 3) + "...";
}

/* -------------------------------------------------------------------------- */
/*                                   URLs                                     */
/* -------------------------------------------------------------------------- */

export function resolveUrl(
  href: string,
  base?: string
): string {

  if (!href) {
    return "";
  }

  try {

    if (!base) {
      return new URL(href).toString();
    }

    return new URL(href, base).toString();

  } catch {

    return href;

  }

}

export function isAbsoluteUrl(
  value: string
): boolean {

  try {

    new URL(value);

    return true;

  } catch {

    return false;

  }

}

export function isInternalLink(
  href: string,
  base?: string
): boolean {

  if (!base) {

    return href.startsWith("/") ||
      href.startsWith("#");

  }

  try {

    const a = new URL(href, base);

    const b = new URL(base);

    return a.hostname === b.hostname;

  } catch {

    return false;

  }

}

/* -------------------------------------------------------------------------- */
/*                                   Hashes                                   */
/* -------------------------------------------------------------------------- */

export function sha256(
  value: string
): string {

  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");

}

export function md5(
  value: string
): string {

  return crypto
    .createHash("md5")
    .update(value)
    .digest("hex");

}

/* -------------------------------------------------------------------------- */
/*                                 Statistics                                 */
/* -------------------------------------------------------------------------- */

export function countWords(
  text: string
): number {

  return normalizeWhitespace(text)
    .split(" ")
    .filter(Boolean)
    .length;

}

export function estimateReadingTime(
  text: string,
  wordsPerMinute = 225
): number {

  const words =
    countWords(text);

  return Math.max(
    1,
    Math.ceil(words / wordsPerMinute)
  );

}

export function countParagraphs(
  text: string
): number {

  return text
    .split(/\n\s*\n/)
    .filter(Boolean)
    .length;

}

/* -------------------------------------------------------------------------- */
/*                                   HTML                                     */
/* -------------------------------------------------------------------------- */

export function stripHtml(
  html: string
): string {

  return normalizeWhitespace(

    html

      .replace(
        /<script[\s\S]*?<\/script>/gi,
        ""
      )

      .replace(
        /<style[\s\S]*?<\/style>/gi,
        ""
      )

      .replace(
        /<!--[\s\S]*?-->/g,
        ""
      )

      .replace(
        /<[^>]+>/g,
        " "
      )

  );

}

export function stripMarkdown(
  markdown: string
): string {

  return normalizeWhitespace(

    markdown

      .replace(/```[\s\S]*?```/g, "")

      .replace(/`(.+?)`/g, "$1")

      .replace(/\[(.*?)\]\((.*?)\)/g, "$1")

      .replace(/[*_>#-]/g, "")

  );

}

/* -------------------------------------------------------------------------- */
/*                              Content Helpers                               */
/* -------------------------------------------------------------------------- */

export function unique<T>(
  values: T[]
): T[] {

  return [...new Set(values)];

}

export function compact<T>(
  values: Array<T | undefined | null>
): T[] {

  return values.filter(
    Boolean
  ) as T[];

}

export function groupBy<T>(
  items: T[],
  selector: (
    item: T
  ) => string
): Record<string, T[]> {

  const map:
    Record<string, T[]> = {};

  for (const item of items) {

    const key =
      selector(item);

    map[key] ??= [];

    map[key].push(item);

  }

  return map;

}

/* -------------------------------------------------------------------------- */
/*                                 Token Est                                  */
/* -------------------------------------------------------------------------- */

/**
 * Rough GPT token estimate.
 *
 * Good enough for chunking.
 */
export function estimateTokens(
  text: string
): number {

  return Math.ceil(
    text.length / 4
  );

}

/* -------------------------------------------------------------------------- */
/*                                 IDs                                        */
/* -------------------------------------------------------------------------- */

export function slugify(
  value: string
): string {

  return value

    .toLowerCase()

    .replace(/[^\w\s-]/g, "")

    .trim()

    .replace(/\s+/g, "-");

}

export function randomId(
  length = 12
): string {

  return crypto
    .randomBytes(length)
    .toString("hex");

}

/* -------------------------------------------------------------------------- */
/*                                  Arrays                                    */
/* -------------------------------------------------------------------------- */

export function chunk<T>(
  array: T[],
  size: number
): T[][] {

  const result: T[][] = [];

  for (
    let i = 0;
    i < array.length;
    i += size
  ) {

    result.push(
      array.slice(i, i + size)
    );

  }

  return result;

}

/* -------------------------------------------------------------------------- */
/*                                Type Guards                                 */
/* -------------------------------------------------------------------------- */

export function isDefined<T>(
  value: T | null | undefined
): value is T {

  return value !== null &&
         value !== undefined;

}

export function isNonEmptyString(
  value: unknown
): value is string {

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );

}