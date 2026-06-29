/**
 * html/parser.ts
 *
 * Main HTML parser.
 *
 * Responsibilities
 * ----------------
 * • Cleanup & sanitization
 * • DOM construction
 * • Readability extraction
 * • Metadata extraction
 * • DOM extraction
 * • Semantic sections
 * • TOC generation
 * • Statistics
 * • Fingerprinting
 * • Plugin execution
 */

import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";

import { cleanupHtml } from "./cleanup";
import { extractReadableArticle } from "./readability";

import { DEFAULT_PARSE_OPTIONS } from "./constants";

import type {
  ExtractedImage,
  HtmlDocument,
  HtmlImage,
  HtmlInput,
  HtmlParseOptions,
  HtmlParserPlugin,
  HtmlParserPluginContext,
  ParserMetrics,
  SchemaOrgData,
  TocItem
} from "./types";

import { sha256 } from "./utils";

/* -------------------------------------------------------------------------- */
/*                               Parser Context                               */
/* -------------------------------------------------------------------------- */

export interface HtmlParserContext {
  url?: string;

  contentType?: string;

  fetchedAt?: Date;
}

/* -------------------------------------------------------------------------- */
/*                               Parser API                                   */
/* -------------------------------------------------------------------------- */

export interface HtmlParser {
  parse(
    html: string,

    context?: HtmlParserContext,

    options?: Partial<HtmlParseOptions>
  ): Promise<HtmlDocument>;
}

/* -------------------------------------------------------------------------- */
/*                            Default Parser                                  */
/* -------------------------------------------------------------------------- */

export class DefaultHtmlParser implements HtmlParser {
  /**
   * Registered parser plugins.
   */
  private readonly plugins: HtmlParserPlugin[] = [];

  constructor(plugins: HtmlParserPlugin[] = []) {
    this.plugins.push(...plugins);

    this.plugins.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  /* ---------------------------------------------------------------------- */
  /* Plugin Management                                                      */
  /* ---------------------------------------------------------------------- */

  registerPlugin(plugin: HtmlParserPlugin): void {
    this.plugins.push(plugin);

    this.plugins.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  unregisterPlugin(name: string): boolean {
    const index = this.plugins.findIndex((plugin) => plugin.name === name);

    if (index < 0) {
      return false;
    }

    this.plugins.splice(index, 1);

    return true;
  }

  clearPlugins(): void {
    this.plugins.length = 0;
  }

  getPlugins(): readonly HtmlParserPlugin[] {
    return [...this.plugins];
  }

  async parse(
    html: string,

    context: HtmlParserContext = {},

    options: Partial<HtmlParseOptions> = {}
  ): Promise<HtmlDocument> {
    const started = performance.now();

    const config: Required<HtmlParseOptions> = {
      ...DEFAULT_PARSE_OPTIONS,

      ...options
    };

    /* ------------------------------------------------------------------ */
    /* Cleanup                                                            */
    /* ------------------------------------------------------------------ */

    const cleanupStarted = performance.now();

    const cleanHtml = config.sanitize ? cleanupHtml(html, config) : html;

    const cleanupFinished = performance.now();

    /* ------------------------------------------------------------------ */
    /* DOM Construction                                                   */
    /* ------------------------------------------------------------------ */

    const dom = new JSDOM(cleanHtml);

    const documentNode = dom.window.document;

    const $ = cheerio.load(cleanHtml);

    /* ------------------------------------------------------------------ */
    /* Readability                                                        */
    /* ------------------------------------------------------------------ */

    let readable:
      | Awaited<ReturnType<typeof extractReadableArticle>>
      | undefined;

    try {
      if (config.readability) {
        readable = await extractReadableArticle(cleanHtml);
      }
    } catch {
      readable = undefined;
    }

    /* ------------------------------------------------------------------ */
    /* Initial Document                                                   */
    /* ------------------------------------------------------------------ */

    const parsed: HtmlDocument = {
      url: context.url,

      canonical: "",

      language: "",

      charset: "",

      title: "",

      description: "",

      author: "",

      siteName: "",

      favicon: "",

      html,

      cleanHtml,

      markdown: readable?.markdown,

      text: readable?.textContent ?? "",

      metadata: {
        custom: {}
      },

      headings: [],

      links: [],

      images: [],

      tables: [],

      codeBlocks: [],

      forms: [],

      sections: [],

      toc: {
        items: [],

        maxDepth: 0,

        totalItems: 0
      },

      schema: [],

      jsonLd: [],

      statistics: {
        words: 0,

        uniqueWords: 0,

        sentences: 0,

        paragraphs: 0,

        characters: 0,

        averageWordLength: 0,

        averageSentenceLength: 0,

        averageParagraphLength: 0,

        longestWord: "",

        estimatedReadingTimeMinutes: 0,

        lexicalDensity: 0,

        headings: 0,

        images: 0,

        links: 0,

        tables: 0,

        forms: 0,

        codeBlocks: 0,

        sectionCount: 0,

        tocDepth: 0,

        imageDensity: 0,

        linkDensity: 0,

        tableDensity: 0,

        hasImages: false,

        hasTables: false,

        hasForms: false,

        hasCodeBlocks: false,

        hasJsonLd: false,

        empty: false
      },

      fingerprint: {
        document: "",

        content: "",

        markdown: "",

        html: "",

        metadata: "",

        dom: ""
      }
    };

    const metrics: ParserMetrics = {
      cleanupTimeMs: cleanupFinished - cleanupStarted,

      metadataTimeMs: 0,

      extractionTimeMs: 0,

      statisticsTimeMs: 0,

      fingerprintTimeMs: 0,

      parseTimeMs: 0,

      totalTimeMs: 0
    };

    /* ------------------------------------------------------------------ */
    /* Metadata Extraction                                                */
    /* ------------------------------------------------------------------ */

    const metadataStarted = performance.now();

    try {
      await this.populateMetadata(
        parsed,

        $,

        dom
      );
    } catch (error) {
      console.warn(
        "[HtmlParser] Metadata extraction failed",

        error
      );
    }

    metrics.metadataTimeMs = performance.now() - metadataStarted;

    /* ------------------------------------------------------------------ */
    /* DOM Extraction                                                     */
    /* ------------------------------------------------------------------ */

    const extractionStarted = performance.now();

    try {
      await this.populateStructure(
        parsed,

        $
      );
    } catch (error) {
      console.warn(
        "[HtmlParser] Structure extraction failed",

        error
      );
    }

    metrics.extractionTimeMs = performance.now() - extractionStarted;

    /* ------------------------------------------------------------------ */
    /* Readability Fallback                                               */
    /* ------------------------------------------------------------------ */

    if (!parsed.text && readable?.textContent) {
      parsed.text = readable.textContent;
    }

    if (!parsed.markdown && readable?.markdown) {
      parsed.markdown = readable.markdown;
    }

    if (!parsed.title && readable?.title) {
      parsed.title = readable.title;
    }

    if (!parsed.description && readable?.excerpt) {
      parsed.description = readable.excerpt;
    }

    /* ------------------------------------------------------------------ */
    /* JSON-LD Cleanup                                                    */
    /* ------------------------------------------------------------------ */

    parsed.jsonLd = parsed.jsonLd.filter((value) => value != null);

    /* ------------------------------------------------------------------ */
    /* Schema Cleanup                                                     */
    /* ------------------------------------------------------------------ */

    parsed.schema = parsed.schema.filter((schema) => !!schema.type);

    /* ------------------------------------------------------------------ */
    /* TOC Metadata                                                       */
    /* ------------------------------------------------------------------ */

    parsed.toc.totalItems = parsed.headings.length;

    parsed.toc.maxDepth = parsed.headings.reduce(
      (
        max,

        heading
      ) =>
        Math.max(
          max,

          heading.level
        ),

      0
    );

    /* ------------------------------------------------------------------ */
    /* Default Canonical                                                  */
    /* ------------------------------------------------------------------ */

    if (!parsed.canonical && context.url) {
      parsed.canonical = context.url;
    }

    /* ------------------------------------------------------------------ */
    /* Default Language                                                   */
    /* ------------------------------------------------------------------ */

    if (!parsed.language) {
      parsed.language = documentNode.documentElement.lang || "unknown";
    }

    /* ------------------------------------------------------------------ */
    /* Default Charset                                                    */
    /* ------------------------------------------------------------------ */

    if (!parsed.charset) {
      parsed.charset = "utf-8";
    }

    /* ------------------------------------------------------------------ */
    /* Statistics                                                         */
    /* ------------------------------------------------------------------ */

    const statisticsStarted = performance.now();

    try {
      await this.populateStatistics(parsed);
    } catch (error) {
      console.warn(
        "[HtmlParser] Statistics failed",

        error
      );
    }

    metrics.statisticsTimeMs = performance.now() - statisticsStarted;

    /* ------------------------------------------------------------------ */
    /* Fingerprint                                                        */
    /* ------------------------------------------------------------------ */

    const fingerprintStarted = performance.now();

    try {
      await this.populateFingerprint(parsed, $);
    } catch (error) {
      console.warn(
        "[HtmlParser] Fingerprint failed",

        error
      );
    }

    metrics.fingerprintTimeMs = performance.now() - fingerprintStarted;

    /* ------------------------------------------------------------------ */
    /* Plugin Pipeline                                                    */
    /* ------------------------------------------------------------------ */

    const pluginContext: HtmlParserPluginContext = {
      parserVersion: "1.0.0",

      options: config,

      metrics
    };

    for (const plugin of this.plugins) {
      try {
        if (plugin.supports(parsed)) {
          await plugin.transform(
            parsed,

            pluginContext
          );
        }
      } catch (error) {
        console.warn(
          `[HtmlParser] Plugin "${plugin.name}" failed`,

          error
        );
      }
    }

    /* ------------------------------------------------------------------ */
    /* Final Statistics                                                   */
    /* ------------------------------------------------------------------ */

    metrics.parseTimeMs = performance.now() - started;

    metrics.totalTimeMs = metrics.parseTimeMs;

    /* ------------------------------------------------------------------ */
    /* Final Cleanup                                                      */
    /* ------------------------------------------------------------------ */

    parsed.title = parsed.title?.trim() ?? "";

    parsed.description = parsed.description?.trim() ?? "";

    parsed.text = parsed.text.trim();

    parsed.markdown = parsed.markdown?.trim();

    parsed.statistics.empty = parsed.statistics.words === 0;

    parsed.statistics.hasImages = parsed.images.length > 0;

    parsed.statistics.hasTables = parsed.tables.length > 0;

    parsed.statistics.hasForms = parsed.forms.length > 0;

    parsed.statistics.hasCodeBlocks = parsed.codeBlocks.length > 0;

    parsed.statistics.hasJsonLd = parsed.jsonLd.length > 0;

    parsed.statistics.sectionCount = parsed.sections.length;

    parsed.statistics.tocDepth = parsed.toc.maxDepth;

    parsed.statistics.headings = parsed.headings.length;

    parsed.statistics.images = parsed.images.length;

    parsed.statistics.links = parsed.links.length;

    parsed.statistics.tables = parsed.tables.length;

    parsed.statistics.forms = parsed.forms.length;

    parsed.statistics.codeBlocks = parsed.codeBlocks.length;

    return parsed;
  }

  /**
   * Metadata extraction.
   */
  protected async populateMetadata(
    document: HtmlDocument,

    $: cheerio.CheerioAPI,

    dom: JSDOM
  ): Promise<void> {
    const head = $("head");

    const html = $("html");

    /* ------------------------------------------------------------------ */
    /* Basic document metadata                                            */
    /* ------------------------------------------------------------------ */

    document.title = head.find("title").first().text().trim();

    document.language =
      html.attr("lang") ?? dom.window.document.documentElement.lang ?? "";

    document.charset =
      head.find("meta[charset]").attr("charset") ??
      head
        .find("meta[http-equiv='Content-Type']")
        .attr("content")
        ?.match(/charset=([^;]+)/i)?.[1] ??
      "";

    /* ------------------------------------------------------------------ */
    /* Description                                                        */
    /* ------------------------------------------------------------------ */

    document.description =
      head

        .find("meta[name='description']")

        .attr("content")

        ?.trim() ?? "";

    /* ------------------------------------------------------------------ */
    /* Canonical                                                          */
    /* ------------------------------------------------------------------ */

    document.canonical =
      head

        .find("link[rel='canonical']")

        .attr("href")

        ?.trim() ?? "";

    /* ------------------------------------------------------------------ */
    /* Favicon                                                            */
    /* ------------------------------------------------------------------ */

    document.favicon =
      head

        .find("link[rel='icon']")

        .attr("href") ??
      head

        .find("link[rel='shortcut icon']")

        .attr("href") ??
      "";

    /* ------------------------------------------------------------------ */
    /* Author                                                             */
    /* ------------------------------------------------------------------ */

    document.author =
      head

        .find("meta[name='author']")

        .attr("content")

        ?.trim() ?? "";

    /* ------------------------------------------------------------------ */
    /* Site Name                                                          */
    /* ------------------------------------------------------------------ */

    document.siteName =
      head

        .find("meta[property='og:site_name']")

        .attr("content")

        ?.trim() ?? "";

    /* ------------------------------------------------------------------ */
    /* Metadata object                                                    */
    /* ------------------------------------------------------------------ */

    document.metadata.title = document.title;

    document.metadata.description = document.description;

    document.metadata.author = document.author;

    document.metadata.language = document.language;

    document.metadata.charset = document.charset;

    document.metadata.canonical = document.canonical;

    document.metadata.favicon = document.favicon;

    /* ------------------------------------------------------------------ */
    /* Standard Meta Tags                                                 */
    /* ------------------------------------------------------------------ */

    document.metadata.keywords =
      head

        .find("meta[name='keywords']")

        .attr("content")

        ?.split(",")

        .map((keyword) => keyword.trim())

        .filter(Boolean) ?? [];

    document.metadata.robots = head

      .find("meta[name='robots']")

      .attr("content")

      ?.trim();

    document.metadata.viewport = head

      .find("meta[name='viewport']")

      .attr("content")

      ?.trim();

    document.metadata.generator = head

      .find("meta[name='generator']")

      .attr("content")

      ?.trim();

    document.metadata.publisher = head

      .find("meta[name='publisher']")

      .attr("content")

      ?.trim();

    document.metadata.themeColor = head

      .find("meta[name='theme-color']")

      .attr("content")

      ?.trim();

    /* ------------------------------------------------------------------ */
    /* Custom Meta                                                        */
    /* ------------------------------------------------------------------ */

    head.find("meta").each((_, element) => {
      const meta = $(element);

      const key =
        meta.attr("name") ?? meta.attr("property") ?? meta.attr("http-equiv");

      const value = meta.attr("content");

      if (!key || !value) {
        return;
      }

      document.metadata.custom[key] = value;
    });

    /* ------------------------------------------------------------------ */
    /* OpenGraph                                                          */
    /* ------------------------------------------------------------------ */

    document.metadata.openGraph = {
      title: head

        .find("meta[property='og:title']")

        .attr("content")

        ?.trim(),

      description: head

        .find("meta[property='og:description']")

        .attr("content")

        ?.trim(),

      image: head

        .find("meta[property='og:image']")

        .attr("content")

        ?.trim(),

      url: head

        .find("meta[property='og:url']")

        .attr("content")

        ?.trim(),

      type: head

        .find("meta[property='og:type']")

        .attr("content")

        ?.trim(),

      siteName: head

        .find("meta[property='og:site_name']")

        .attr("content")

        ?.trim(),

      locale: head

        .find("meta[property='og:locale']")

        .attr("content")

        ?.trim(),

      audio: head

        .find("meta[property='og:audio']")

        .attr("content")

        ?.trim(),

      video: head

        .find("meta[property='og:video']")

        .attr("content")

        ?.trim()
    };

    /* ------------------------------------------------------------------ */
    /* Twitter Cards                                                      */
    /* ------------------------------------------------------------------ */

    document.metadata.twitter = {
      card: head

        .find("meta[name='twitter:card']")

        .attr("content")

        ?.trim(),

      title: head

        .find("meta[name='twitter:title']")

        .attr("content")

        ?.trim(),

      description: head

        .find("meta[name='twitter:description']")

        .attr("content")

        ?.trim(),

      image: head

        .find("meta[name='twitter:image']")

        .attr("content")

        ?.trim(),

      site: head

        .find("meta[name='twitter:site']")

        .attr("content")

        ?.trim(),

      creator: head

        .find("meta[name='twitter:creator']")

        .attr("content")

        ?.trim()
    };

    /* ------------------------------------------------------------------ */
    /* JSON-LD Extraction                                                 */
    /* ------------------------------------------------------------------ */

    const discoveredSchema = new Map<string, SchemaOrgData>();

    $("script[type='application/ld+json']").each((_, element) => {
      const raw = $(element)
        .html()

        ?.trim();

      if (!raw) {
        return;
      }

      try {
        const parsed = JSON.parse(raw);

        collectJsonLd(
          parsed,

          document,

          discoveredSchema
        );
      } catch {
        // Ignore malformed JSON-LD
      }
    });

    document.schema = Array.from(discoveredSchema.values());

    /* ------------------------------------------------------------------ */
    /* Metadata Fallbacks                                                 */
    /* ------------------------------------------------------------------ */

    if (!document.title) {
      document.title =
        document.metadata.openGraph?.title ??
        document.metadata.twitter?.title ??
        "";
    }

    if (!document.description) {
      document.description =
        document.metadata.openGraph?.description ??
        document.metadata.twitter?.description ??
        "";
    }

    if (!document.siteName) {
      document.siteName = document.metadata.openGraph?.siteName ?? "";
    }

    if (!document.author) {
      document.author = document.metadata.author ?? "";
    }

    /* ------------------------------------------------------------------ */
    /* Canonical URL                                                      */
    /* ------------------------------------------------------------------ */

    if (!document.canonical) {
      document.canonical = document.url ?? "";
    }

    if (document.canonical && document.url) {
      try {
        document.canonical = new URL(
          document.canonical,

          document.url
        ).toString();
      } catch {
        // Ignore invalid URL
      }
    }

    /* ------------------------------------------------------------------ */
    /* Normalize Metadata                                                 */
    /* ------------------------------------------------------------------ */

    document.metadata.title = document.title;

    document.metadata.description = document.description;

    document.metadata.author = document.author;

    document.metadata.language = document.language;

    document.metadata.charset = document.charset;

    document.metadata.canonical = document.canonical;

    document.metadata.favicon = document.favicon;

    /* ------------------------------------------------------------------ */
    /* Final Cleanup                                                      */
    /* ------------------------------------------------------------------ */

    document.title = document.title.trim();

    document.description = document.description.trim();

    document.author = document.author.trim();

    document.siteName = document.siteName.trim();

    document.language = document.language.trim();

    document.charset = document.charset.trim();

    document.canonical = document.canonical.trim();
  }

  /**
   * DOM extraction.
   */
  protected async populateStructure(
    document: HtmlDocument,

    $: cheerio.CheerioAPI
  ): Promise<void> {
    /* ------------------------------------------------------------------ */
    /* Headings                                                           */
    /* ------------------------------------------------------------------ */

    $("h1,h2,h3,h4,h5,h6").each((index, element) => {
      const heading = {
        id: $(element).attr("id") ?? `heading-${index}`,

        level: Number(element.name.substring(1)),

        text: $(element)
          .text()

          .replace(/\s+/g, " ")

          .trim()
      };

      document.headings.push(heading);
    });

    /* ------------------------------------------------------------------ */
    /* Links                                                              */
    /* ------------------------------------------------------------------ */

    $("a[href]").each((_, element) => {
      const href =
        $(element)
          .attr("href")

          ?.trim() ?? "";

      let absolute = href;

      if (document.url && href && !href.startsWith("#")) {
        try {
          absolute = new URL(
            href,

            document.url
          ).toString();
        } catch {
          absolute = href;
        }
      }

      document.links.push({
        href: absolute,

        text: $(element)
          .text()

          .replace(/\s+/g, " ")

          .trim(),

        title: $(element).attr("title"),

        rel: $(element).attr("rel"),

        internal: document.url
          ? absolute.startsWith(new URL(document.url).origin)
          : href.startsWith("/") || href.startsWith("#"),
        external: false,
        anchor: false
      });
    });

    /* ------------------------------------------------------------------ */
    /* Images                                                             */
    /* ------------------------------------------------------------------ */

    $("img").each((_, element) => {
      const figure = $(element).closest("figure");

      let src = $(element).attr("src") ?? "";

      if (document.url && src) {
        try {
          src = new URL(
            src,

            document.url
          ).toString();
        } catch {}
      }

      document.images.push({
        src,

        alt: $(element).attr("alt"),

        title: $(element).attr("title"),

        width: Number($(element).attr("width")) || undefined,

        height: Number($(element).attr("height")) || undefined,

        loading: $(element).attr("loading"),

        decoding: $(element).attr("decoding"),

        figure: figure.length > 0,

        caption:
          figure

            .find("figcaption")

            .text()

            .trim() || undefined
      });
    });

    /* ------------------------------------------------------------------ */
    /* Tables                                                             */
    /* ------------------------------------------------------------------ */

    $("table").each((_, table) => {
      const headers: string[] = [];

      const rows: string[][] = [];

      /*
       * Header detection
       */

      const headerCells = $(table).find("thead th");

      if (headerCells.length) {
        headerCells.each((_, cell) => {
          headers.push(
            $(cell)
              .text()

              .replace(/\s+/g, " ")

              .trim()
          );
        });
      } else {
        const firstRow = $(table)
          .find("tr")

          .first();

        firstRow

          .find("th")

          .each((_, cell) => {
            headers.push(
              $(cell)
                .text()

                .replace(/\s+/g, " ")

                .trim()
            );
          });
      }

      /*
       * Rows
       */

      $(table)
        .find("tr")

        .each((index, row) => {
          if (index === 0 && headers.length) {
            return;
          }

          const values = $(row)
            .find("td")

            .map((_, cell) =>
              $(cell)
                .text()

                .replace(/\s+/g, " ")

                .trim()
            )

            .get();

          if (values.length) {
            rows.push(values);
          }
        });

      document.tables.push({
        headers,

        rows
      });
    });

    /* ------------------------------------------------------------------ */
    /* Code Blocks                                                        */
    /* ------------------------------------------------------------------ */

    $("pre code").each((_, element) => {
      const classes = $(element).attr("class") ?? "";

      const language = classes

        .split(/\s+/)

        .find((cls) => cls.startsWith("language-"))

        ?.replace(
          "language-",

          ""
        );

      document.codeBlocks.push({
        language,

        code: $(element).text()
      });
    });

    /*
     * Standalone PRE blocks
     */

    $("pre").each((_, element) => {
      if ($(element).find("code").length) {
        return;
      }

      document.codeBlocks.push({
        language: undefined,

        code: $(element).text()
      });
    });

    /* ------------------------------------------------------------------ */
    /* Forms                                                              */
    /* ------------------------------------------------------------------ */

    $("form").each((_, form) => {
      const inputs: HtmlInput[] = [];

      $(form)
        .find("input,textarea,select")

        .each((_, input) => {
          const node = $(input);

          const id = node.attr("id");

          const label = id ? $(`label[for="${id}"]`).text().trim() : undefined;

          inputs.push({
            name: node.attr("name"),

            type: node.attr("type"),

            value: node.attr("value"),

            label,

            placeholder: node.attr("placeholder"),

            required: node.is("[required]"),

            disabled: node.is("[disabled]"),

            readonly: node.is("[readonly]"),

            checked: node.is("[checked]")
          });
        });

      document.forms.push({
        id: $(form).attr("id"),

        name: $(form).attr("name"),

        action: $(form).attr("action"),

        method: ($(form).attr("method") ?? "GET")

          .toUpperCase(),

        enctype: $(form).attr("enctype"),

        autocomplete: $(form).attr("autocomplete"),

        inputs
      });
    });

    /* ------------------------------------------------------------------ */
    /* Table Of Contents                                                  */
    /* ------------------------------------------------------------------ */

    const stack: TocItem[] = [];

    document.toc.items = [];

    for (const heading of document.headings) {
      const node: TocItem = {
        id: heading.id,

        title: heading.text,

        level: heading.level,

        anchor: heading.id,

        index: document.toc.totalItems++,

        children: []
      };

      while (stack.length && stack[stack.length - 1].level >= node.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        document.toc.items.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }

      stack.push(node);
    }

    document.toc.maxDepth = Math.max(
      0,

      ...document.headings.map((h) => h.level)
    );

    document.toc.totalItems = document.headings.length;

    /* ------------------------------------------------------------------ */
    /* Semantic Sections                                                  */
    /* ------------------------------------------------------------------ */

    interface SectionNode {
      heading: string;

      level: number;

      id: string;
    }

    const headingNodes: SectionNode[] = [];

    $("h1,h2,h3,h4,h5,h6").each((index, element) => {
      headingNodes.push({
        heading: $.html(element) ?? "",

        level: Number(element.name.substring(1)),

        id: $(element).attr("id") ?? `heading-${index}`
      });
    });

    /*
     * No headings.
     * Entire document becomes one section.
     */

    if (headingNodes.length === 0) {
      const body = $("body");

      document.sections.push({
        id: "document",

        level: 0,

        heading: document.title,

        html: body.html() ?? "",

        markdown: undefined,

        text: body

          .text()

          .replace(/\s+/g, " ")

          .trim(),

        startOffset: 0,

        endOffset: body.text().length,

        tokenEstimate: Math.ceil(body.text().length / 4)
      });

      return;
    }

    /*
     * Walk every heading.
     */

    for (let index = 0; index < headingNodes.length; index++) {
      const current = headingNodes[index];

      const next = headingNodes[index + 1];

      const htmlParts: string[] = [];

      const textParts: string[] = [];

      /*
       * Include heading.
       */

      htmlParts.push($.html(current.heading));

      textParts.push($(current.heading).text());

      /*
       * Collect siblings until the next heading
       * of same or higher level.
       */

      let cursor = $(current.heading).next();

      while (cursor.length) {
        if (/^h[1-6]$/i.test(cursor[0].tagName)) {
          const level = Number(
            cursor[0].tagName

              .substring(1)
          );

          if (level <= current.level) {
            break;
          }
        }

        htmlParts.push($.html(cursor));

        textParts.push(
          cursor

            .text()
        );

        cursor = cursor.next();
      }

      const html = htmlParts.join("\n");

      const text = textParts

        .join("\n")

        .replace(/\s+/g, " ")

        .trim();

      document.sections.push({
        id: current.id,

        heading: $(current.heading)
          .text()

          .trim(),

        level: current.level,

        html,

        markdown: undefined,

        text,

        startOffset: 0,

        endOffset: text.length,

        tokenEstimate: Math.ceil(text.length / 4),

        fingerprint: sha256(text)
      });
    }

    /* ------------------------------------------------------------------ */
    /* Final Structure Cleanup                                            */
    /* ------------------------------------------------------------------ */

    document.headings.sort((a, b) => a.level - b.level);

    document.links = document.links.filter((link) => link.href.length > 0);

    document.images = document.images.filter((image) => image.src.length > 0);

    document.tables = document.tables.filter(
      (table) => table.rows.length || table.headers.length
    );

    document.codeBlocks = document.codeBlocks.filter(
      (block) => block.code.trim().length
    );

    document.forms = document.forms.filter((form) => form.inputs.length);
  }
  /**
   * Reading statistics.
   */
  /**
   * Compute document statistics.
   */
  protected async populateStatistics(document: HtmlDocument): Promise<void> {
    const text = document.text

      .replace(/\r/g, "")

      .trim();

    /* ------------------------------------------------------------------ */
    /* Basic Text                                                         */
    /* ------------------------------------------------------------------ */

    const words = text.length ? text.split(/\s+/).filter(Boolean) : [];

    const sentences = text.length
      ? text.split(/(?<=[.!?])\s+/).filter(Boolean)
      : [];

    const paragraphs = text.length
      ? text
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

    const uniqueWords = new Set(words.map((word) => word.toLowerCase()));

    /* ------------------------------------------------------------------ */
    /* Reading Statistics                                                 */
    /* ------------------------------------------------------------------ */

    const averageWordLength = words.length
      ? words.reduce(
          (sum, word) => sum + word.length,

          0
        ) / words.length
      : 0;

    const averageSentenceLength = sentences.length
      ? words.length / sentences.length
      : 0;

    const averageParagraphLength = paragraphs.length
      ? words.length / paragraphs.length
      : 0;

    const longestWord = words.reduce(
      (
        longest,

        current
      ) => (current.length > longest.length ? current : longest),

      ""
    );

    const estimatedReadingTimeMinutes = Math.max(
      1,

      Math.ceil(words.length / 225)
    );

    /* ------------------------------------------------------------------ */
    /* Density                                                            */
    /* ------------------------------------------------------------------ */

    const imageDensity = words.length
      ? document.images.length / words.length
      : 0;

    const tableDensity = words.length
      ? document.tables.length / words.length
      : 0;

    const linkDensity = words.length ? document.links.length / words.length : 0;

    const lexicalDensity = words.length ? uniqueWords.size / words.length : 0;

    /* ------------------------------------------------------------------ */
    /* Populate                                                           */
    /* ------------------------------------------------------------------ */

    document.statistics.words = words.length;

    document.statistics.uniqueWords = uniqueWords.size;

    document.statistics.sentences = sentences.length;

    document.statistics.paragraphs = paragraphs.length;

    document.statistics.characters = text.length;

    document.statistics.averageWordLength = Number(
      averageWordLength.toFixed(2)
    );

    document.statistics.averageSentenceLength = Number(
      averageSentenceLength.toFixed(2)
    );

    document.statistics.averageParagraphLength = Number(
      averageParagraphLength.toFixed(2)
    );

    document.statistics.longestWord = longestWord;

    document.statistics.lexicalDensity = Number(lexicalDensity.toFixed(4));

    document.statistics.estimatedReadingTimeMinutes =
      estimatedReadingTimeMinutes;

    /* ------------------------------------------------------------------ */
    /* Structure                                                          */
    /* ------------------------------------------------------------------ */

    document.statistics.headings = document.headings.length;

    document.statistics.images = document.images.length;

    document.statistics.links = document.links.length;

    document.statistics.tables = document.tables.length;

    document.statistics.forms = document.forms.length;

    document.statistics.codeBlocks = document.codeBlocks.length;

    document.statistics.sectionCount = document.sections.length;

    document.statistics.tocDepth = document.toc.maxDepth;

    /* ------------------------------------------------------------------ */
    /* Density                                                            */
    /* ------------------------------------------------------------------ */

    document.statistics.imageDensity = Number(imageDensity.toFixed(6));

    document.statistics.tableDensity = Number(tableDensity.toFixed(6));

    document.statistics.linkDensity = Number(linkDensity.toFixed(6));

    /* ------------------------------------------------------------------ */
    /* Flags                                                              */
    /* ------------------------------------------------------------------ */

    document.statistics.hasImages = document.images.length > 0;

    document.statistics.hasTables = document.tables.length > 0;

    document.statistics.hasForms = document.forms.length > 0;

    document.statistics.hasCodeBlocks = document.codeBlocks.length > 0;

    document.statistics.hasJsonLd = document.jsonLd.length > 0;

    document.statistics.empty = words.length === 0;

    document.statistics.domHash = document.statistics?.domHash;
  }
  /**
   * Compute document fingerprints.
   *
   * Multiple hashes are generated so downstream systems
   * (cache, crawler, RAG, embeddings, change detection)
   * can compare different representations independently.
   */
  protected async populateFingerprint(
    document: HtmlDocument,
    $: cheerio.CheerioAPI
  ): Promise<void> {
    /* ------------------------------------------------------------------ */
    /* Normalize                                                          */
    /* ------------------------------------------------------------------ */

    const html = document.cleanHtml ?? document.html ?? "";

    const markdown = document.markdown ?? "";

    const text = document.text ?? "";

    const metadata = JSON.stringify({
      title: document.title,

      description: document.description,

      author: document.author,

      siteName: document.siteName,

      canonical: document.canonical,

      language: document.language,

      charset: document.charset
    });
    /* ------------------------------------------------------------------ */
    /* DOM Fingerprint                                                    */
    /* ------------------------------------------------------------------ */

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

      "pre",
      "code",

      "blockquote",

      "form",
      "input",
      "textarea",
      "select",
      "button"
    ]);

    const domStructure = $("*")
      .map((_, element) => {
        if (!("name" in element)) {
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

    const domHash = sha256(domStructure.join("|"));

    /* ------------------------------------------------------------------ */
    /* Individual hashes                                                  */
    /* ------------------------------------------------------------------ */

    const htmlHash = sha256(html);

    const markdownHash = sha256(markdown);

    const contentHash = sha256(text);

    const metadataHash = sha256(metadata);

    /* ------------------------------------------------------------------ */
    /* Final fingerprint                                                  */
    /* ------------------------------------------------------------------ */

    const documentFingerprint = sha256(
      [
        document.canonical,

        document.title,

        contentHash,

        domHash,

        metadataHash
      ]

        .filter(Boolean)

        .join("\n")
    );

    document.fingerprint = {
      document: documentFingerprint,

      content: contentHash,

      markdown: markdownHash,

      html: htmlHash,

      dom: domHash,

      metadata: metadataHash
    };

    /* ------------------------------------------------------------------ */
    /* Section fingerprints                                               */
    /* ------------------------------------------------------------------ */

    for (const section of document.sections) {
      section.fingerprint = sha256(
        [
          section.heading,

          section.text
        ]

          .filter(Boolean)

          .join("\n")
      );
    }

    /* ------------------------------------------------------------------ */
    /* Chunk fingerprints                                                 */
    /* ------------------------------------------------------------------ */

    if (document.sections.length) {
      let previous = "";

      for (const section of document.sections) {
        if (!section.fingerprint) {
          continue;
        }

        previous = sha256(previous + section.fingerprint);
      }
    }
  }

  /**
   * Execute parser plugins.
   */
  protected async runPlugins(document: HtmlDocument): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.supports(document)) {
        await plugin.transform(document);
      }
    }
  }
}
function collectJsonLd(
  value: unknown,

  document: HtmlDocument,

  schema: Map<string, SchemaOrgData>
): void {
  if (value == null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectJsonLd(
        item,

        document,

        schema
      );
    }

    return;
  }

  if (typeof value !== "object") {
    return;
  }

  const object = value as Record<string, unknown>;

  document.jsonLd.push({
    data: object
  });

  /*
   * Handle @graph
   */

  const graph = object["@graph"];

  if (Array.isArray(graph)) {
    for (const item of graph) {
      collectJsonLd(
        item,

        document,

        schema
      );
    }
  }

  /*
   * Normalize schema
   */

  const rawType = object["@type"] ?? object["type"];

  if (typeof rawType !== "string") {
    return;
  }

  const id =
    typeof object["@id"] === "string"
      ? object["@id"]
      : `${rawType}:${JSON.stringify(object)}`;

  if (schema.has(id)) {
    return;
  }

  schema.set(id, {
    type: rawType,

    properties: object
  });
}
export const htmlParser = new DefaultHtmlParser();

export default htmlParser;
