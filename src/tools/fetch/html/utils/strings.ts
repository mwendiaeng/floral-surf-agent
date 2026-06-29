/**
 * utils/strings.ts
 *
 * Shared string utilities.
 */

import * as cheerio from "cheerio";

/* -------------------------------------------------------------------------- */
/*                               Whitespace                                   */
/* -------------------------------------------------------------------------- */

export function normalizeWhitespace(value: string): string {
  return value

    .replace(/\u00A0/g, " ")

    .replace(/\s+/g, " ")

    .trim();
}

export function normalizeDocumentWhitespace(value: string): string {
  return value

    .replace(/\u00A0/g, " ")

    .replace(/\r/g, "")

    .replace(/[ \t]+/g, " ")

    .replace(/\n{3,}/g, "\n\n")

    .trim();
}

export function removeEmptyLines(value: string): string {
  return value

    .split("\n")

    .map((line) => line.trimEnd())

    .filter(Boolean)

    .join("\n");
}

/* -------------------------------------------------------------------------- */
/*                           HTML Entity Decode                               */
/* -------------------------------------------------------------------------- */

export function decodeHtmlEntities(value: string): string {
  return cheerio

    .load(`<body>${value}</body>`)

    .text();
}

/* -------------------------------------------------------------------------- */
/*                              Case Helpers                                  */
/* -------------------------------------------------------------------------- */

export function capitalize(value: string): string {
  if (!value.length) {
    return value;
  }

  return value[0].toUpperCase() + value.slice(1);
}

export function titleCase(value: string): string {
  return value

    .split(/\s+/)

    .map(capitalize)

    .join(" ");
}

/* -------------------------------------------------------------------------- */
/*                                Truncate                                    */
/* -------------------------------------------------------------------------- */

export function truncate(value: string, maxLength = 300): string {
  if (value.length <= maxLength) {
    return value;
  }

  return (
    value.slice(
      0,

      maxLength - 3
    ) + "..."
  );
}

/* -------------------------------------------------------------------------- */
/*                           String Comparison                                */
/* -------------------------------------------------------------------------- */

export function equalsIgnoreCase(a: string, b: string): boolean {
  return (
    a.localeCompare(
      b,

      undefined,

      {
        sensitivity: "accent"
      }
    ) === 0
  );
}

/* -------------------------------------------------------------------------- */
/*                              Empty Checks                                  */
/* -------------------------------------------------------------------------- */

export function isBlank(value?: string | null): boolean {
  return value == null || value.trim().length === 0;
}

export function isNonBlank(value?: string | null): value is string {
  return !isBlank(value);
}

/* -------------------------------------------------------------------------- */
/*                              Safe Split                                    */
/* -------------------------------------------------------------------------- */

export function splitLines(value: string): string[] {
  return value

    .split(/\r?\n/)

    .map((line) => line.trim())

    .filter(Boolean);
}

export function splitWords(value: string): string[] {
  return normalizeWhitespace(value)
    .split(" ")

    .filter(Boolean);
}
