/**
 * html/markdown.ts
 *
 * HTML → Markdown converter.
 *
 * Produces semantic Markdown suitable for:
 *
 *  - RAG ingestion
 *  - LLM context
 *  - Search indexing
 *  - Chunking
 */

import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { normalizeWhitespace } from "./utils/strings";

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

export interface MarkdownOptions {
  preserveTables?: boolean;

  preserveImages?: boolean;

  preserveLinks?: boolean;

  preserveHtml?: boolean;

  wrapCodeBlocks?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export function htmlToMarkdown(
  html: string,

  options: MarkdownOptions = {}
): string {
  const $ = cheerio.load(html);

  const builder = new MarkdownBuilder(options);

  const root = $("body").length ? $("body") : ($.root() as any);

  root.contents().each((_: any, node: any) => {
    builder.walk(
      $,

      node
    );
  });

  return builder.finish();
}

/* -------------------------------------------------------------------------- */
/* Builder                                                                    */
/* -------------------------------------------------------------------------- */

class MarkdownBuilder {
  private readonly output: string[] = [];

  constructor(private readonly options: MarkdownOptions) {}

  write(value: string): void {
    this.output.push(value);
  }

  newline(count = 1): void {
    this.output.push("\n".repeat(count));
  }

  text(value: string): void {
    const text = normalizeWhitespace(value);

    if (text) {
      this.write(text);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* DOM Walker                                                             */
  /* ---------------------------------------------------------------------- */

  walk(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    if (node.type === "text") {
      this.text(node.data);

      return;
    }

    if (node.type !== "tag") {
      return;
    }

    switch (node.tagName.toLowerCase()) {
      case "h1":

      case "h2":

      case "h3":

      case "h4":

      case "h5":

      case "h6":
        this.heading(
          $,

          node
        );

        return;

      case "p":
        this.paragraph(
          $,

          node
        );

        return;

      case "blockquote":
        this.blockquote(
          $,

          node
        );

        return;

      case "ul":

      case "ol":
        this.list(
          $,

          node
        );

        return;

      case "table":
        this.table(
          $,

          node
        );

        return;

      case "pre":
        this.codeBlock(
          $,

          node
        );

        return;

      case "img":
        this.image(
          $,

          node
        );

        return;

      case "a":
        this.link(
          $,

          node
        );

        return;

      case "hr":
        this.horizontalRule();

        return;

      default:
        $(node)
          .contents()

          .each((_, child) =>
            this.walk(
              $,

              child
            )
          );
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Headings                                                                   */
  /* -------------------------------------------------------------------------- */

  private heading(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    const level = Number((node as any).tagName.substring(1));

    this.newline(2);

    this.write("#".repeat(level));

    this.write(" ");

    $(node)
      .contents()

      .each((_, child) =>
        this.inline(
          $,

          child
        )
      );

    this.newline(2);
  }

  /* -------------------------------------------------------------------------- */
  /* Paragraphs                                                                 */
  /* -------------------------------------------------------------------------- */

  private paragraph(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    this.newline(2);

    $(node)
      .contents()

      .each((_, child) =>
        this.inline(
          $,

          child
        )
      );

    this.newline(2);
  }

  /* -------------------------------------------------------------------------- */
  /* Blockquotes                                                                */
  /* -------------------------------------------------------------------------- */

  private blockquote(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    const text = normalizeWhitespace($(node).text());

    if (!text) {
      return;
    }

    this.newline(2);

    for (const line of text.split("\n")) {
      this.write("> ");

      this.write(line.trim());

      this.newline();
    }

    this.newline();
  }

  /* -------------------------------------------------------------------------- */
  /* Lists                                                                      */
  /* -------------------------------------------------------------------------- */

  private list(
    $: cheerio.CheerioAPI,

    node: AnyNode,

    depth = 0
  ): void {
    const ordered = (node as any).tagName === "ol";

    let index = 1;

    this.newline();

    $(node)
      .children("li")

      .each((_, li) => {
        const prefix = ordered ? `${index++}. ` : "- ";

        this.write("  ".repeat(depth));

        this.write(prefix);

        $(li)
          .contents()

          .each((_, child) => {
            if (
              child.type === "tag" &&
              (child.tagName === "ul" || child.tagName === "ol")
            ) {
              this.newline();

              this.list(
                $,

                child,

                depth + 1
              );
            } else {
              this.inline(
                $,

                child
              );
            }
          });

        this.newline();
      });

    this.newline();
  }

  /* -------------------------------------------------------------------------- */
  /* Inline Rendering                                                           */
  /* -------------------------------------------------------------------------- */

  private inline(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    if (node.type === "text") {
      this.text(node.data);

      return;
    }

    if (node.type !== "tag") {
      return;
    }

    switch (node.tagName) {
      case "strong":

      case "b":
        this.write("**");

        $(node)
          .contents()

          .each((_, child) =>
            this.inline(
              $,

              child
            )
          );

        this.write("**");

        return;

      case "em":

      case "i":
        this.write("*");

        $(node)
          .contents()

          .each((_, child) =>
            this.inline(
              $,

              child
            )
          );

        this.write("*");

        return;

      case "del":

      case "s":
        this.write("~~");

        $(node)
          .contents()

          .each((_, child) =>
            this.inline(
              $,

              child
            )
          );

        this.write("~~");

        return;

      case "mark":
        this.write("==");

        $(node)
          .contents()

          .each((_, child) =>
            this.inline(
              $,

              child
            )
          );

        this.write("==");

        return;

      case "br":
        this.newline();

        return;

      case "code":
        if (node.parent?.type === "tag" && node.parent.tagName === "pre") {
          return;
        }

        this.write("`");

        this.write($(node).text());

        this.write("`");

        return;

      case "a":
        this.link(
          $,

          node
        );

        return;

      case "img":
        this.image(
          $,

          node
        );

        return;

      default:
        $(node)
          .contents()

          .each((_, child) =>
            this.inline(
              $,

              child
            )
          );
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Tables                                                                     */
  /* -------------------------------------------------------------------------- */

  private table(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    if (this.options.preserveTables === false) {
      return;
    }

    const rows: string[][] = [];

    $(node)
      .find("tr")

      .each((_, row) => {
        const values = $(row)
          .children("th,td")

          .map((_, cell) => normalizeWhitespace($(cell).text()))

          .get();

        if (values.length) {
          rows.push(values);
        }
      });

    if (rows.length === 0) {
      return;
    }

    this.newline(2);

    const header = rows[0];

    this.write(`| ${header.join(" | ")} |`);

    this.newline();

    this.write(`| ${header.map(() => "---").join(" | ")} |`);

    this.newline();

    for (const row of rows.slice(1)) {
      this.write(`| ${row.join(" | ")} |`);

      this.newline();
    }

    this.newline(2);
  }

  /* -------------------------------------------------------------------------- */
  /* Code Blocks                                                                */
  /* -------------------------------------------------------------------------- */

  private codeBlock(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    const code = $(node)
      .find("code")

      .first();

    const target = code.length ? code : $(node);

    const className = target.attr("class") ?? "";

    const language =
      className

        .split(/\s+/)

        .find((cls) => cls.startsWith("language-"))

        ?.replace(
          "language-",

          ""
        ) ??
      className

        .split(/\s+/)

        .find((cls) => cls.length > 0) ??
      "";

    this.newline(2);

    if (this.options.wrapCodeBlocks !== false) {
      this.write("```");

      this.write(language);

      this.newline();
    }

    this.write(target.text());

    this.newline();

    if (this.options.wrapCodeBlocks !== false) {
      this.write("```");

      this.newline();
    }

    this.newline();
  }

  /* -------------------------------------------------------------------------- */
  /* Horizontal Rules                                                           */
  /* -------------------------------------------------------------------------- */

  private horizontalRule(): void {
    this.newline(2);

    this.write("---");

    this.newline(2);
  }

  /* -------------------------------------------------------------------------- */
  /* Line Break                                                                 */
  /* -------------------------------------------------------------------------- */

  private lineBreak(): void {
    this.write("  ");

    this.newline();
  }

  /* -------------------------------------------------------------------------- */
  /* Escape Markdown                                                            */
  /* -------------------------------------------------------------------------- */

  private escapeMarkdown(value: string): string {
    return value.replace(
      /([\\`*_{}[\]()#+\-.!|>])/g,

      "\\$1"
    );
  }
  /* -------------------------------------------------------------------------- */
  /* Images                                                                     */
  /* -------------------------------------------------------------------------- */

  private image(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    if (this.options.preserveImages === false) {
      return;
    }

    const src = $(node).attr("src") ?? "";

    if (!src) {
      return;
    }

    const alt = this.escapeMarkdown(
      normalizeWhitespace($(node).attr("alt") ?? "")
    );

    const title = $(node).attr("title");

    this.write("!");

    this.write("[");

    this.write(alt);

    this.write("](");

    this.write(src);

    if (title) {
      this.write(` "${this.escapeMarkdown(title)}"`);
    }

    this.write(")");
  }

  /* -------------------------------------------------------------------------- */
  /* Links                                                                      */
  /* -------------------------------------------------------------------------- */

  private link(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    if (this.options.preserveLinks === false) {
      $(node)
        .contents()

        .each((_, child) => this.inline($, child));

      return;
    }

    const href = $(node).attr("href") ?? "";

    const label = normalizeWhitespace($(node).text()) || href;

    this.write("[");

    this.write(this.escapeMarkdown(label));

    this.write("](");

    this.write(href);

    this.write(")");
  }

  /* -------------------------------------------------------------------------- */
  /* Figures                                                                    */
  /* -------------------------------------------------------------------------- */

  private figure(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    this.newline(2);

    $(node)
      .children()

      .each((_, child) => {
        if (child.type !== "tag") {
          return;
        }

        if (child.tagName === "img") {
          this.image(
            $,

            child
          );

          this.newline();

          return;
        }

        if (child.tagName === "figcaption") {
          const caption = normalizeWhitespace($(child).text());

          if (caption) {
            this.write("*");

            this.write(this.escapeMarkdown(caption));

            this.write("*");

            this.newline();
          }

          return;
        }

        this.walk(
          $,

          child
        );
      });

    this.newline();
  }

  /* -------------------------------------------------------------------------- */
  /* Details / Summary                                                          */
  /* -------------------------------------------------------------------------- */

  private details(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    const summary = $(node)
      .children("summary")

      .first();

    if (summary.length) {
      this.newline(2);

      this.write("**");

      this.write(normalizeWhitespace(summary.text()));

      this.write("**");

      this.newline(2);
    }

    $(node)
      .contents()

      .each((_, child) => {
        if (child === summary.get(0)) {
          return;
        }

        this.walk(
          $,

          child
        );
      });
  }

  /* -------------------------------------------------------------------------- */
  /* Definition Lists                                                           */
  /* -------------------------------------------------------------------------- */

  private definitionList(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    this.newline();

    $(node)
      .children()

      .each((_, child) => {
        if (child.type !== "tag") {
          return;
        }

        switch (child.tagName) {
          case "dt":
            this.write("**");

            this.write(normalizeWhitespace($(child).text()));

            this.write("**");

            this.newline();

            break;

          case "dd":
            this.write(": ");

            this.write(normalizeWhitespace($(child).text()));

            this.newline();

            break;
        }
      });

    this.newline();
  }

  /* -------------------------------------------------------------------------- */
  /* Raw HTML                                                                   */
  /* -------------------------------------------------------------------------- */

  private rawHtml(
    $: cheerio.CheerioAPI,

    node: AnyNode
  ): void {
    if (!this.options.preserveHtml) {
      return;
    }

    this.newline();

    this.write($.html(node));

    this.newline();
  }
  /* -------------------------------------------------------------------------- */
  /* Cleanup                                                                    */
  /* -------------------------------------------------------------------------- */

  private cleanupMarkdown(markdown: string): string {
    return (
      markdown

        /*
         * Windows → Unix
         */
        .replace(/\r\n/g, "\n")

        /*
         * Trim trailing whitespace.
         */
        .replace(/[ \t]+$/gm, "")

        /*
         * Remove spaces before newline.
         */
        .replace(/[ \t]+\n/g, "\n")

        /*
         * Collapse excessive blank lines.
         */
        .replace(/\n{3,}/g, "\n\n")

        /*
         * Collapse repeated horizontal rules.
         */
        .replace(/(?:\n-{3,}\n){2,}/g, "\n---\n")

        /*
         * Trim document.
         */
        .trim()
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Markdown Normalization                                                     */
  /* -------------------------------------------------------------------------- */

  private normalizeMarkdown(markdown: string): string {
    return (
      markdown

        /*
         * Normalize list indentation.
         */
        .replace(/^[ ]{4,}([-*+]|\d+\.)/gm, "  $1")

        /*
         * Remove empty emphasis.
         */
        .replace(/\*\*\s*\*\*/g, "")

        .replace(/\*\s*\*/g, "")

        /*
         * Remove empty links.
         */
        .replace(/\[\]\(\)/g, "")

        /*
         * Remove empty images.
         */
        .replace(/!\[\]\(\)/g, "")

        /*
         * Normalize fenced blocks.
         */
        .replace(/```\n{2,}/g, "```\n")

        /*
         * Collapse duplicated blockquotes.
         */
        .replace(/(?:^>\s*$\n)+/gm, "")
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Post Processing                                                            */
  /* -------------------------------------------------------------------------- */

  private postProcess(markdown: string): string {
    markdown = this.cleanupMarkdown(markdown);

    markdown = this.normalizeMarkdown(markdown);

    return markdown;
  }

  /* -------------------------------------------------------------------------- */
  /* Finish                                                                     */
  /* -------------------------------------------------------------------------- */

  finish(): string {
    const markdown = this.output.join("");

    return this.postProcess(markdown);
  }
}

/* -------------------------------------------------------------------------- */
/* Convenience API                                                            */
/* -------------------------------------------------------------------------- */

export function convertHtmlToMarkdown(
  html: string,

  options?: MarkdownOptions
): string {
  return htmlToMarkdown(
    html,

    options
  );
}

export default htmlToMarkdown;
