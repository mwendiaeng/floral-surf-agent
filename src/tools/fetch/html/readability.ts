/**
 * html/readability.ts
 *
 * Wrapper around Mozilla Readability.
 *
 * Exposes a stable API for extracting readable
 * article content from HTML documents.
 */

import { JSDOM } from "jsdom";
import { Readability, isProbablyReaderable } from "@mozilla/readability";
import { estimateReadingTime } from "./utils/statistics.ts";

import { normalizeWhitespace } from "./utils/strings";
import { htmlToMarkdown } from "./markdown";
import { nullToUndefined } from "./utils/types.ts";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ReadabilityOptions {
  charThreshold?: number;

  keepClasses?: boolean;

  disableJSONLD?: boolean;
}

export interface ReadableArticle {
  title?: string;

  byline?: string;

  excerpt?: string;

  siteName?: string;

  language?: string;

  publishedTime?: string;

  content: string;

  textContent: string;

  length: number;

  readingTimeMinutes: number;

  markdown?: string;
}

/* -------------------------------------------------------------------------- */
/* Default Options                                                            */
/* -------------------------------------------------------------------------- */

const DEFAULT_OPTIONS: Required<ReadabilityOptions> = {
  charThreshold: 500,

  keepClasses: false,

  disableJSONLD: false
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export function extractReadableArticle(
  html: string,

  options: ReadabilityOptions = {}
): ReadableArticle | undefined {
  const config = {
    ...DEFAULT_OPTIONS,

    ...options
  };

  const dom = new JSDOM(html);

  const reader = new Readability(
    dom.window.document,

    {
      charThreshold: config.charThreshold,

      keepClasses: config.keepClasses,

      disableJSONLD: config.disableJSONLD
    }
  );

  const article = reader.parse();

  if (!article) {
    return;
  }

  const text = normalizeWhitespace(article.textContent ?? "");

  return {
    title: nullToUndefined(article.title),

    byline: nullToUndefined(article.byline),

    excerpt: nullToUndefined(article.excerpt),

    siteName: nullToUndefined(article.siteName),

    language: nullToUndefined(article.lang),

    publishedTime: undefined,

    content: article.content ?? "",

    textContent: text,

    length: text.length,

    readingTimeMinutes: estimateReadingTime(text)
  };
}

/* -------------------------------------------------------------------------- */
/* Main Content                                                               */
/* -------------------------------------------------------------------------- */

export function extractMainContent(
  html: string,

  options: ReadabilityOptions = {}
): string {
  const article = extractReadableArticle(
    html,

    options
  );

  return article?.content ?? "";
}

/* -------------------------------------------------------------------------- */
/* Plain Text                                                                 */
/* -------------------------------------------------------------------------- */

export function extractPlainText(
  html: string,

  options: ReadabilityOptions = {}
): string {
  const article = extractReadableArticle(
    html,

    options
  );

  return article?.textContent ?? "";
}

/* -------------------------------------------------------------------------- */
/* Excerpt                                                                    */
/* -------------------------------------------------------------------------- */

export function extractExcerpt(
  html: string,

  options: ReadabilityOptions = {},

  maxLength = 240
): string {
  const article = extractReadableArticle(
    html,

    options
  );

  if (!article) {
    return "";
  }

  if (article.excerpt) {
    return article.excerpt;
  }

  if (article.textContent.length <= maxLength) {
    return article.textContent;
  }

  return (
    article.textContent

      .substring(
        0,

        maxLength
      )

      .trimEnd() + "…"
  );
}

/* -------------------------------------------------------------------------- */
/* Summary                                                                    */
/* -------------------------------------------------------------------------- */

export function extractSummary(
  html: string,

  options: ReadabilityOptions = {},

  sentenceLimit = 3
): string {
  const text = extractPlainText(
    html,

    options
  );

  if (!text) {
    return "";
  }

  const sentences = text

    .split(/(?<=[.!?])\s+/)

    .map((sentence) => sentence.trim())

    .filter(Boolean);

  return sentences

    .slice(
      0,

      sentenceLimit
    )

    .join(" ");
}

/* -------------------------------------------------------------------------- */
/* Byline                                                                     */
/* -------------------------------------------------------------------------- */

export function extractByline(
  html: string,

  options: ReadabilityOptions = {}
): string | undefined {
  return extractReadableArticle(
    html,

    options
  )?.byline;
}

/* -------------------------------------------------------------------------- */
/* Site Name                                                                  */
/* -------------------------------------------------------------------------- */

export function extractSiteName(
  html: string,

  options: ReadabilityOptions = {}
): string | undefined {
  return extractReadableArticle(
    html,

    options
  )?.siteName;
}

/* -------------------------------------------------------------------------- */
/* Article Title                                                              */
/* -------------------------------------------------------------------------- */

export function extractArticleTitle(
  html: string,

  options: ReadabilityOptions = {}
): string | undefined {
  return extractReadableArticle(
    html,

    options
  )?.title;
}
/* -------------------------------------------------------------------------- */
/* Metadata Helpers                                                           */
/* -------------------------------------------------------------------------- */

export function extractMetadata(
  html: string,

  options: ReadabilityOptions = {}
) {
  const article = extractReadableArticle(
    html,

    options
  );

  if (!article) {
    return undefined;
  }

  return {
    title: article.title,

    byline: article.byline,

    excerpt: article.excerpt,

    siteName: article.siteName,

    language: article.language,

    publishedTime: article.publishedTime,

    length: article.length
  };
}

/* -------------------------------------------------------------------------- */
/* Reading Time                                                               */
/* -------------------------------------------------------------------------- */

export function extractReadingTime(
  html: string,

  options: ReadabilityOptions = {}
): number {
  const article = extractReadableArticle(
    html,

    options
  );

  return article?.readingTimeMinutes ?? 0;
}

/* -------------------------------------------------------------------------- */
/* Markdown                                                                   */
/* -------------------------------------------------------------------------- */

export function extractMarkdown(
  html: string,

  options: ReadabilityOptions = {}
): string {
  const article = extractReadableArticle(
    html,

    options
  );

  if (!article) {
    return "";
  }

  /*
   * Delegates to the HTML→Markdown converter.
   */

  return htmlToMarkdown(article.content);
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

export function hasReadableContent(
  html: string,

  options: ReadabilityOptions = {}
): boolean {
  const article = extractReadableArticle(
    html,

    options
  );

  return !!(
    article && article.textContent.length >= DEFAULT_OPTIONS.charThreshold
  );
}

/* -------------------------------------------------------------------------- */
/* Readerability                                                              */
/* -------------------------------------------------------------------------- */

export function isProbablyReadable(html: string): boolean {
  try {
    const dom = new JSDOM(html);

    return isProbablyReaderable(dom.window.document);
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Convenience                                                                */
/* -------------------------------------------------------------------------- */

export function extractReadableText(
  html: string,

  options?: ReadabilityOptions
): string {
  return extractPlainText(
    html,

    options
  );
}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {
  extractReadableArticle,

  extractMainContent,

  extractPlainText,

  extractReadableText,

  extractExcerpt,

  extractSummary,

  extractMetadata,

  extractReadingTime,

  extractMarkdown,

  extractByline,

  extractSiteName,

  extractArticleTitle,

  hasReadableContent,

  isProbablyReadable
};
