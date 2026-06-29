/**
 * html/extractors.ts
 *
 * Shared extraction helpers used by parser.ts.
 *
 * Every function in this file is PURE.
 * No mutations.
 */

import * as cheerio from "cheerio";

import { resolveUrl } from "./utils/urls";

import { normalizeWhitespace } from "./utils/strings";

import { type HtmlMetadata } from "./types";
import type { Heading } from "./types";
import { fingerprintDocument } from "./utils/fingerprint";

/* -------------------------------------------------------------------------- */
/* Title                                                                       */
/* -------------------------------------------------------------------------- */

export function extractTitle($: cheerio.CheerioAPI): string {
  return normalizeWhitespace(
    $("title")
      .first()

      .text()
  );
}

/* -------------------------------------------------------------------------- */
/* Description                                                                 */
/* -------------------------------------------------------------------------- */

export function extractDescription($: cheerio.CheerioAPI): string {
  return normalizeWhitespace(
    $("meta[name='description']").attr("content") ??
      $("meta[property='og:description']").attr("content") ??
      ""
  );
}

/* -------------------------------------------------------------------------- */
/* Language                                                                    */
/* -------------------------------------------------------------------------- */

export function extractLanguage($: cheerio.CheerioAPI): string {
  return ($("html").attr("lang") ?? "")

    .trim();
}

/* -------------------------------------------------------------------------- */
/* Charset                                                                     */
/* -------------------------------------------------------------------------- */

export function extractCharset($: cheerio.CheerioAPI): string {
  return (
    $("meta[charset]").attr("charset") ??
    $("meta[http-equiv='Content-Type']")
      .attr("content")

      ?.match(/charset=([^;]+)/i)?.[1] ??
    ""
  )

    .trim();
}

/* -------------------------------------------------------------------------- */
/* Canonical                                                                   */
/* -------------------------------------------------------------------------- */

export function extractCanonical(
  $: cheerio.CheerioAPI,

  base?: string
): string | undefined {
  const canonical = $("link[rel='canonical']").attr("href");

  if (!canonical) {
    return base;
  }

  return resolveUrl(
    canonical,

    base
  );
}

/* -------------------------------------------------------------------------- */
/* Metadata                                                                     */
/* -------------------------------------------------------------------------- */

export function extractBasicMetadata(
  $: cheerio.CheerioAPI,

  base?: string
): Partial<HtmlMetadata> {
  return {
    title: extractTitle($),

    description: extractDescription($),

    language: extractLanguage($),

    charset: extractCharset($),

    canonical: extractCanonical(
      $,

      base
    )
  };
}
/* -------------------------------------------------------------------------- */
/* Headings                                                                   */
/* -------------------------------------------------------------------------- */

export function extractHeadings($: cheerio.CheerioAPI): Heading[] {
  return $("h1,h2,h3,h4,h5,h6")
    .map((index, element) => ({
      id: $(element).attr("id") ?? `heading-${index}`,

      level: Number(element.name.substring(1)),

      text: normalizeWhitespace($(element).text())
    }))

    .get();
}

/* -------------------------------------------------------------------------- */
/* Text                                                                       */
/* -------------------------------------------------------------------------- */

export function extractText(
  $: cheerio.CheerioAPI,

  selector = "body"
): string {
  const clone = cheerio.load($.html());

  clone("script,style,noscript,template").remove();

  return normalizeWhitespace(clone(selector).text());
}

/* -------------------------------------------------------------------------- */
/* Paragraphs                                                                 */
/* -------------------------------------------------------------------------- */

export function extractParagraphs($: cheerio.CheerioAPI): string[] {
  return $("p")
    .map((_, element) => normalizeWhitespace($(element).text()))

    .get()

    .filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/* Links                                                                      */
/* -------------------------------------------------------------------------- */

export function extractLinks(
  $: cheerio.CheerioAPI,

  base?: string
) {
  return $("a[href]")
    .map((_, element) => {
      const href = $(element).attr("href") ?? "";

      const absolute = resolveUrl(
        href,

        base
      );

      return {
        href: absolute,

        text: normalizeWhitespace($(element).text()),

        title: $(element).attr("title"),

        rel: $(element).attr("rel"),

        target: $(element).attr("target"),

        download: $(element).is("[download]"),

        internal: base
          ? absolute.startsWith(new URL(base).origin)
          : href.startsWith("/") || href.startsWith("#")
      };
    })

    .get()

    .filter((link) => link.href.length > 0);
}

/* -------------------------------------------------------------------------- */
/* Anchors                                                                    */
/* -------------------------------------------------------------------------- */

export function extractAnchors($: cheerio.CheerioAPI): string[] {
  return $("a[id]")
    .map((_, element) => $(element).attr("id"))

    .get()

    .filter((value): value is string => !!value);
}

/* -------------------------------------------------------------------------- */
/* Lists                                                                      */
/* -------------------------------------------------------------------------- */

export function extractLists($: cheerio.CheerioAPI) {
  return $("ul,ol")
    .map((_, list) => ({
      ordered: list.tagName === "ol",

      items: $(list)
        .find("> li")

        .map((_, item) => normalizeWhitespace($(item).text()))

        .get()
    }))

    .get();
}

/* -------------------------------------------------------------------------- */
/* Blockquotes                                                                */
/* -------------------------------------------------------------------------- */

export function extractBlockquotes($: cheerio.CheerioAPI): string[] {
  return $("blockquote")
    .map((_, element) => normalizeWhitespace($(element).text()))

    .get();
}
/* -------------------------------------------------------------------------- */
/* Images                                                                     */
/* -------------------------------------------------------------------------- */

export function extractImages(
  $: cheerio.CheerioAPI,

  base?: string
) {
  return $("img")
    .map((_, element) => {
      const figure = $(element).closest("figure");

      const src = resolveUrl(
        $(element).attr("src") ?? "",

        base
      );

      const srcset = $(element).attr("srcset");

      return {
        src,

        srcset,

        alt: normalizeWhitespace($(element).attr("alt") ?? ""),

        title: $(element).attr("title"),

        width: Number($(element).attr("width")) || undefined,

        height: Number($(element).attr("height")) || undefined,

        loading: $(element).attr("loading"),

        decoding: $(element).attr("decoding"),

        figure: figure.length > 0,

        caption:
          normalizeWhitespace(
            figure

              .find("figcaption")

              .text()
          ) || undefined
      };
    })

    .get()

    .filter((image) => image.src.length > 0);
}

/* -------------------------------------------------------------------------- */
/* Tables                                                                     */
/* -------------------------------------------------------------------------- */

export function extractTables($: cheerio.CheerioAPI) {
  return $("table")
    .map((_, table) => {
      const headers: string[] = [];

      const rows: string[][] = [];

      const caption = normalizeWhitespace(
        $(table)
          .find("caption")

          .text()
      );

      const headerCells = $(table).find("thead th");

      if (headerCells.length) {
        headerCells.each((_, cell) => {
          headers.push(normalizeWhitespace($(cell).text()));
        });
      } else {
        $(table)
          .find("tr")

          .first()

          .find("th")

          .each((_, cell) => {
            headers.push(normalizeWhitespace($(cell).text()));
          });
      }

      $(table)
        .find("tbody tr")

        .each((_, row) => {
          const values = $(row)
            .find("td")

            .map((_, cell) => normalizeWhitespace($(cell).text()))

            .get();

          if (values.length) {
            rows.push(values);
          }
        });

      if (rows.length === 0) {
        $(table)
          .find("tr")

          .slice(headers.length ? 1 : 0)

          .each((_, row) => {
            const values = $(row)
              .find("td")

              .map((_, cell) => normalizeWhitespace($(cell).text()))

              .get();

            if (values.length) {
              rows.push(values);
            }
          });
      }

      return {
        caption: caption || undefined,

        headers,

        rows
      };
    })

    .get()

    .filter((table) => table.rows.length || table.headers.length);
}

/* -------------------------------------------------------------------------- */
/* Code Blocks                                                                */
/* -------------------------------------------------------------------------- */

export function extractCodeBlocks($: cheerio.CheerioAPI) {
  const blocks: {
    language?: string;

    code: string;
  }[] = [];

  $("pre code").each((_, element) => {
    const className = $(element).attr("class") ?? "";

    const language = className

      .split(/\s+/)

      .find((cls) => cls.startsWith("language-"))

      ?.replace(
        "language-",

        ""
      );

    blocks.push({
      language,

      code: $(element).text()
    });
  });

  $("pre").each((_, element) => {
    if ($(element).find("code").length) {
      return;
    }

    blocks.push({
      language: undefined,

      code: $(element).text()
    });
  });

  return blocks.filter((block) => block.code.trim().length > 0);
}

/* -------------------------------------------------------------------------- */
/* Embedded Media                                                             */
/* -------------------------------------------------------------------------- */

export function extractMedia(
  $: cheerio.CheerioAPI,

  base?: string
) {
  return $("video,audio,iframe")
    .map((_, element) => ({
      type: element.name,

      src: resolveUrl(
        $(element).attr("src") ?? "",

        base
      ),

      title: $(element).attr("title")
    }))

    .get()

    .filter((media) => media.src.length > 0);
}
/* -------------------------------------------------------------------------- */
/* Forms                                                                      */
/* -------------------------------------------------------------------------- */

export function extractForms($: cheerio.CheerioAPI) {
  return $("form")
    .map((_, form) => {
      const inputs = $(form)
        .find("input,textarea,select")

        .map((_, input) => {
          const node = $(input);

          const id = node.attr("id");

          const label = id ? $(`label[for="${id}"]`).text() : undefined;

          return {
            id,

            name: node.attr("name"),

            type: node.attr("type") ?? input.tagName,

            value: node.val(),

            placeholder: node.attr("placeholder"),

            label: normalizeWhitespace(label ?? ""),

            required: node.is("[required]"),

            checked: node.is("[checked]"),

            disabled: node.is("[disabled]"),

            readonly: node.is("[readonly]"),

            autocomplete: node.attr("autocomplete")
          };
        })

        .get();

      return {
        id: $(form).attr("id"),

        name: $(form).attr("name"),

        action: $(form).attr("action"),

        method: ($(form).attr("method") ?? "GET")

          .toUpperCase(),

        enctype: $(form).attr("enctype"),

        autocomplete: $(form).attr("autocomplete"),

        inputs
      };
    })

    .get();
}

/* -------------------------------------------------------------------------- */
/* JSON-LD                                                                    */
/* -------------------------------------------------------------------------- */

export function extractJsonLd($: cheerio.CheerioAPI): unknown[] {
  const documents: unknown[] = [];

  $("script[type='application/ld+json']").each((_, element) => {
    const raw = $(element)
      .html()

      ?.trim();

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      documents.push(parsed);
    } catch {
      // Ignore malformed JSON-LD
    }
  });

  return documents;
}

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export function extractMetadata(
  $: cheerio.CheerioAPI,

  base?: string
): Partial<HtmlMetadata> {
  const metadata: Partial<HtmlMetadata> = {
    title: extractTitle($),

    description: extractDescription($),

    canonical: extractCanonical(
      $,

      base
    ),

    language: extractLanguage($),

    charset: extractCharset($),

    author: $("meta[name='author']")
      .attr("content")

      ?.trim(),

    publisher: $("meta[name='publisher']")
      .attr("content")

      ?.trim(),

    robots: $("meta[name='robots']")
      .attr("content")

      ?.trim(),

    generator: $("meta[name='generator']")
      .attr("content")

      ?.trim(),

    viewport: $("meta[name='viewport']")
      .attr("content")

      ?.trim(),

    themeColor: $("meta[name='theme-color']")
      .attr("content")

      ?.trim(),

    favicon: resolveUrl(
      $("link[rel='icon']").attr("href") ??
        $("link[rel='shortcut icon']").attr("href") ??
        "",

      base
    ),

    keywords:
      $("meta[name='keywords']")
        .attr("content")

        ?.split(",")

        .map((keyword) => keyword.trim())

        .filter(Boolean) ?? [],

    custom: {}
  };

  $("meta").each((_, element) => {
    const node = $(element);

    const key =
      node.attr("name") ?? node.attr("property") ?? node.attr("http-equiv");

    const value = node.attr("content");

    if (key && value) {
      metadata.custom![key] = value;
    }
  });

  return metadata;
}
/* -------------------------------------------------------------------------- */
/* Semantic Sections                                                          */
/* -------------------------------------------------------------------------- */

export function extractSections($: cheerio.CheerioAPI) {
  const sections: {
    id: string;

    heading?: string;

    level: number;

    html: string;

    text: string;
  }[] = [];

  const headings = $("h1,h2,h3,h4,h5,h6").toArray();

  /*
   * No headings.
   */

  if (headings.length === 0) {
    const body = $("body");

    sections.push({
      id: "document",

      heading: undefined,

      level: 0,

      html: body.html() ?? "",

      text: normalizeWhitespace(body.text())
    });

    return sections;
  }

  /*
   * Build sections from heading hierarchy.
   */

  headings.forEach((heading, index) => {
    const node = $(heading);

    const level = Number(heading.tagName.substring(1));

    const id = node.attr("id") ?? `heading-${index}`;

    const html: string[] = [];

    const text: string[] = [];

    html.push($.html(heading));

    text.push(normalizeWhitespace(node.text()));

    let cursor = node.next();

    while (cursor.length) {
      if (/^h[1-6]$/i.test(cursor[0].tagName)) {
        const nextLevel = Number(
          cursor[0].tagName

            .substring(1)
        );

        if (nextLevel <= level) {
          break;
        }
      }

      html.push($.html(cursor));

      text.push(normalizeWhitespace(cursor.text()));

      cursor = cursor.next();
    }

    sections.push({
      id,

      heading: normalizeWhitespace(node.text()),

      level,

      html: html.join("\n"),

      text: normalizeWhitespace(text.join("\n"))
    });
  });

  return sections;
}

/* -------------------------------------------------------------------------- */
/* Table Of Contents                                                          */
/* -------------------------------------------------------------------------- */

export function extractTOC(headings: Heading[]) {
  const toc = {
    items: [] as any[],

    totalItems: headings.length,

    maxDepth: 0
  };

  const stack: any[] = [];

  for (const heading of headings) {
    toc.maxDepth = Math.max(
      toc.maxDepth,

      heading.level
    );

    const node = {
      id: heading.id,

      title: heading.text,

      level: heading.level,

      anchor: heading.id,

      children: [] as any[]
    };

    while (stack.length && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      toc.items.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return toc;
}

/* -------------------------------------------------------------------------- */
/* Main Content                                                               */
/* -------------------------------------------------------------------------- */

export function extractMainContent($: cheerio.CheerioAPI) {
  const candidates = [
    "main",

    "article",

    "[role='main']",

    "#content",

    ".content",

    ".post",

    ".article"
  ];

  for (const selector of candidates) {
    const node = $(selector).first();

    if (node.length) {
      return {
        selector,

        html: node.html() ?? "",

        text: normalizeWhitespace(node.text())
      };
    }
  }

  return {
    selector: "body",

    html: $("body").html() ?? "",

    text: normalizeWhitespace($("body").text())
  };
} /* -------------------------------------------------------------------------- */
/* Statistics                                                                 */
/* -------------------------------------------------------------------------- */

export function extractStatistics(input: {
  text: string;

  headings: Heading[];

  links: unknown[];

  images: unknown[];

  tables: unknown[];

  forms: unknown[];

  codeBlocks: unknown[];

  sections: unknown[];

  toc: {
    maxDepth: number;
  };

  jsonLd?: unknown[];
}) {
  const words = normalizeWhitespace(input.text)
    .split(" ")

    .filter(Boolean);

  const sentences = input.text

    .split(/(?<=[.!?])\s+/)

    .filter(Boolean);

  const paragraphs = input.text

    .split(/\n\s*\n/)

    .filter(Boolean);

  const uniqueWords = new Set(words.map((word) => word.toLowerCase()));

  const longestWord = words.reduce(
    (
      longest,

      current
    ) => (current.length > longest.length ? current : longest),

    ""
  );

  return {
    words: words.length,

    uniqueWords: uniqueWords.size,

    characters: input.text.length,

    sentences: sentences.length,

    paragraphs: paragraphs.length,

    longestWord,

    averageWordLength: words.length
      ? words.reduce(
          (
            sum,

            word
          ) => sum + word.length,

          0
        ) / words.length
      : 0,

    averageSentenceLength: sentences.length
      ? words.length / sentences.length
      : 0,

    headings: input.headings.length,

    links: input.links.length,

    images: input.images.length,

    tables: input.tables.length,

    forms: input.forms.length,

    codeBlocks: input.codeBlocks.length,

    sectionCount: input.sections.length,

    tocDepth: input.toc.maxDepth,

    estimatedReadingTimeMinutes: Math.max(
      1,

      Math.ceil(words.length / 225)
    ),

    hasImages: input.images.length > 0,

    hasTables: input.tables.length > 0,

    hasForms: input.forms.length > 0,

    hasCodeBlocks: input.codeBlocks.length > 0,

    hasJsonLd: (input.jsonLd ?? []).length > 0,

    empty: words.length === 0
  };
}

/* -------------------------------------------------------------------------- */
/* Fingerprints                                                               */
/* -------------------------------------------------------------------------- */

export function extractFingerprints(document: {
  html: string;

  cleanHtml?: string;

  markdown?: string;

  text: string;

  metadata: HtmlMetadata;

  canonical?: string;

  title?: string;
}) {
  return fingerprintDocument({
    canonical: document.canonical,

    title: document.title,

    html: document.cleanHtml ?? document.html,

    markdown: document.markdown,

    text: document.text,

    metadata: {
      title: document.metadata.title,

      description: document.metadata.description,

      canonical: document.metadata.canonical,

      author: document.metadata.author,

      siteName: document.metadata.siteName,

      language: document.metadata.language,

      charset: document.metadata.charset
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Complete Extraction                                                        */
/* -------------------------------------------------------------------------- */

export function extractAll(
  $: cheerio.CheerioAPI,

  options: {
    url?: string;
  } = {}
) {
  const metadata = extractMetadata(
    $,

    options.url
  );

  const headings = extractHeadings($);

  const links = extractLinks(
    $,

    options.url
  );

  const images = extractImages(
    $,

    options.url
  );

  const tables = extractTables($);

  const codeBlocks = extractCodeBlocks($);

  const forms = extractForms($);

  const sections = extractSections($);

  const toc = extractTOC(headings);

  const text = extractText($);

  const jsonLd = extractJsonLd($);

  const statistics = extractStatistics({
    text,

    headings,

    links,

    images,

    tables,

    forms,

    codeBlocks,

    sections,

    toc,

    jsonLd
  });

  return {
    metadata,

    text,

    headings,

    links,

    images,

    tables,

    codeBlocks,

    forms,

    sections,

    toc,

    jsonLd,

    statistics
  };
}
