/**
 * html/metadata.ts
 *
 * Metadata extraction pipeline.
 *
 * Responsibilities:
 *  - Standard metadata
 *  - OpenGraph
 *  - Twitter Cards
 *  - Canonical URL
 *  - Favicon
 *  - JSON-LD
 *  - Schema.org
 *  - Metadata normalization
 */

import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";

import type {
  HtmlDocument,
  HtmlMetadata,
  OpenGraphMetadata,
  TwitterCardMetadata,
  SchemaOrgData
} from "./types";

import { resolveUrl } from "./utils/urls";

export interface MetadataExtractionOptions {
  url?: string;

  includeJsonLd?: boolean;

  includeSchema?: boolean;
}

function getMeta(
  $: cheerio.CheerioAPI,

  name: string
): string | undefined {
  return (
    $(`meta[name="${name}"]`).attr("content") ??
    $(`meta[property="${name}"]`).attr("content") ??
    $(`meta[http-equiv="${name}"]`).attr("content")
  )

    ?.trim();
}

function getLink(
  $: cheerio.CheerioAPI,

  rel: string
): string | undefined {
  return $(`link[rel="${rel}"]`)
    .attr("href")

    ?.trim();
}

function normalizeKeywords(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value

    .split(",")

    .map((keyword) => keyword.trim())

    .filter(Boolean);
}

function normalizeLanguage(
  $: cheerio.CheerioAPI,

  dom: JSDOM
): string {
  return (
    $("html").attr("lang") ??
    dom.window.document.documentElement.lang ??
    ""
  )

    .trim();
}

function normalizeCharset($: cheerio.CheerioAPI): string {
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
/*                               Public API                                   */
/* -------------------------------------------------------------------------- */

export function extractMetadata(
  $: cheerio.CheerioAPI,

  dom: JSDOM,

  options: MetadataExtractionOptions = {}
): HtmlMetadata {
  const metadata: HtmlMetadata = {
    custom: {}
  };

  /* -------------------------------------------------------------- */
  /* Basic Metadata                                                 */
  /* -------------------------------------------------------------- */

  metadata.title = $("title")
    .first()

    .text()

    .trim();

  metadata.description = getMeta(
    $,

    "description"
  );

  metadata.author = getMeta(
    $,

    "author"
  );

  metadata.publisher = getMeta(
    $,

    "publisher"
  );

  metadata.generator = getMeta(
    $,

    "generator"
  );

  metadata.robots = getMeta(
    $,

    "robots"
  );

  metadata.viewport = getMeta(
    $,

    "viewport"
  );

  metadata.themeColor = getMeta(
    $,

    "theme-color"
  );

  metadata.keywords = normalizeKeywords(
    getMeta(
      $,

      "keywords"
    )
  );

  metadata.language = normalizeLanguage(
    $,

    dom
  );

  metadata.charset = normalizeCharset($);

  /* -------------------------------------------------------------------------- */
  /* Canonical URL / Favicon                                                    */
  /* -------------------------------------------------------------------------- */

  const canonical = getLink(
    $,

    "canonical"
  );

  metadata.canonical = canonical
    ? resolveUrl(
        canonical,

        options.url
      )
    : options.url;

  const favicon =
    getLink($, "icon") ??
    getLink($, "shortcut icon") ??
    getLink($, "apple-touch-icon") ??
    getLink($, "mask-icon");

  metadata.favicon = favicon
    ? resolveUrl(
        favicon,

        options.url
      )
    : undefined;

  /* -------------------------------------------------------------------------- */
  /* Custom Metadata                                                            */
  /* -------------------------------------------------------------------------- */

  $("meta").each((_, element) => {
    const node = $(element);

    const key =
      node.attr("name") ?? node.attr("property") ?? node.attr("http-equiv");

    const value = node.attr("content");

    if (!key || !value) {
      return;
    }

    if (metadata.custom[key] === undefined) {
      metadata.custom[key] = value.trim();
    }
  });

  /* -------------------------------------------------------------------------- */
  /* OpenGraph                                                                  */
  /* -------------------------------------------------------------------------- */

  const openGraph: OpenGraphMetadata = {
    title: getMeta(
      $,

      "og:title"
    ),

    description: getMeta(
      $,

      "og:description"
    ),

    image: getMeta(
      $,

      "og:image"
    ),

    url: getMeta(
      $,

      "og:url"
    ),

    type: getMeta(
      $,

      "og:type"
    ),

    siteName: getMeta(
      $,

      "og:site_name"
    ),

    locale: getMeta(
      $,

      "og:locale"
    )
  };

  if (openGraph.image) {
    openGraph.image = resolveUrl(
      openGraph.image,

      options.url
    );
  }

  if (openGraph.url) {
    openGraph.url = resolveUrl(
      openGraph.url,

      options.url
    );
  }

  metadata.openGraph = openGraph;

  /* -------------------------------------------------------------------------- */
  /* Twitter Cards                                                              */
  /* -------------------------------------------------------------------------- */

  const twitter: TwitterCardMetadata = {
    card: getMeta(
      $,

      "twitter:card"
    ),

    title: getMeta(
      $,

      "twitter:title"
    ),

    description: getMeta(
      $,

      "twitter:description"
    ),

    image: getMeta(
      $,

      "twitter:image"
    ),

    site: getMeta(
      $,

      "twitter:site"
    ),

    creator: getMeta(
      $,

      "twitter:creator"
    )
  };

  if (twitter.image) {
    twitter.image = resolveUrl(
      twitter.image,

      options.url
    );
  }

  metadata.twitter = twitter;

  /* -------------------------------------------------------------------------- */
  /* JSON-LD Extraction                                                         */
  /* -------------------------------------------------------------------------- */

  const discoveredSchema = new Map<string, SchemaOrgData>();

  $("script[type='application/ld+json']").each((_, element) => {
    if (options.includeJsonLd === false) {
      return;
    }

    const raw = $(element)
      .html()

      ?.trim();

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      collectSchema(
        parsed,

        discoveredSchema
      );
    } catch {
      // Ignore malformed JSON-LD
    }
  });

  if (options.includeSchema !== false) {
    metadata.schema = Array.from(discoveredSchema.values());
  }

  /* -------------------------------------------------------------------------- */
  /* Metadata Fallbacks                                                         */
  /* -------------------------------------------------------------------------- */

  metadata.title ??= metadata.openGraph?.title ?? metadata.twitter?.title;

  metadata.description ??=
    metadata.openGraph?.description ?? metadata.twitter?.description;

  metadata.author ??= metadata.custom.author;

  metadata.publisher ??= metadata.custom.publisher;

  metadata.language ??= metadata.custom.language;

  metadata.canonical ??= options.url;

  /* -------------------------------------------------------------------------- */
  /* Final Cleanup                                                              */
  /* -------------------------------------------------------------------------- */

  metadata.title = metadata.title?.trim();

  metadata.description = metadata.description?.trim();

  metadata.author = metadata.author?.trim();

  metadata.publisher = metadata.publisher?.trim();

  metadata.language = metadata.language?.trim();

  metadata.charset = metadata.charset?.trim();

  metadata.canonical = metadata.canonical?.trim();

  metadata.favicon = metadata.favicon?.trim();

  return metadata;
}

/* -------------------------------------------------------------------------- */
/* Schema Helpers                                                             */
/* -------------------------------------------------------------------------- */

function collectSchema(
  value: unknown,

  schema: Map<string, SchemaOrgData>
): void {
  if (value == null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectSchema(
        item,

        schema
      );
    }

    return;
  }

  if (typeof value !== "object") {
    return;
  }

  const object = value as Record<string, unknown>;

  /*
   * Support @graph
   */

  const graph = object["@graph"];

  if (Array.isArray(graph)) {
    for (const node of graph) {
      collectSchema(
        node,

        schema
      );
    }
  }

  const type = object["@type"] ?? object.type;

  if (typeof type !== "string") {
    return;
  }

  const id =
    typeof object["@id"] === "string"
      ? object["@id"]
      : `${type}:${JSON.stringify(object)}`;

  if (schema.has(id)) {
    return;
  }

  schema.set(id, {
    type,

    properties: object
  });
}
