/**
 * html/constants.ts
 *
 * Shared constants for the HTML parser subsystem.
 *
 * Every parser module should import from here instead of hardcoding
 * strings throughout the codebase.
 */

import type { HtmlParseOptions } from "./types";

/* -------------------------------------------------------------------------- */
/*                                   Tags                                     */
/* -------------------------------------------------------------------------- */

export const HTML_TAGS = Object.freeze({
  HTML: "html",
  HEAD: "head",
  BODY: "body",

  TITLE: "title",

  META: "meta",

  LINK: "link",

  SCRIPT: "script",

  STYLE: "style",

  NOSCRIPT: "noscript",

  TEMPLATE: "template",

  HEADER: "header",

  FOOTER: "footer",

  NAV: "nav",

  MAIN: "main",

  ARTICLE: "article",

  ASIDE: "aside",

  SECTION: "section",

  DIV: "div",

  SPAN: "span",

  P: "p",

  H1: "h1",

  H2: "h2",

  H3: "h3",

  H4: "h4",

  H5: "h5",

  H6: "h6",

  UL: "ul",

  OL: "ol",

  LI: "li",

  DL: "dl",

  DT: "dt",

  DD: "dd",

  PRE: "pre",

  CODE: "code",

  BLOCKQUOTE: "blockquote",

  TABLE: "table",

  THEAD: "thead",

  TBODY: "tbody",

  TFOOT: "tfoot",

  TR: "tr",

  TD: "td",

  TH: "th",

  FIGURE: "figure",

  FIGCAPTION: "figcaption",

  IMG: "img",

  SVG: "svg",

  VIDEO: "video",

  AUDIO: "audio",

  IFRAME: "iframe",

  A: "a",

  FORM: "form",

  INPUT: "input",

  TEXTAREA: "textarea",

  SELECT: "select",

  OPTION: "option",

  BUTTON: "button",

  LABEL: "label",

  DETAILS: "details",

  SUMMARY: "summary",

  TIME: "time",

  ADDRESS: "address",

  CANVAS: "canvas",
});

/* -------------------------------------------------------------------------- */
/*                            Common Tag Collections                          */
/* -------------------------------------------------------------------------- */

export const HEADING_TAGS = Object.freeze([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
]);

export const TEXT_BLOCK_TAGS = Object.freeze([
  "p",
  "blockquote",
  "pre",
  "li",
  "td",
  "th",
  "dd",
]);

export const SECTION_TAGS = Object.freeze([
  "article",
  "section",
  "main",
  "aside",
]);

export const TABLE_TAGS = Object.freeze([
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
]);

export const MEDIA_TAGS = Object.freeze([
  "img",
  "video",
  "audio",
  "picture",
  "source",
  "svg",
]);

export const FORM_TAGS = Object.freeze([
  "form",
  "input",
  "textarea",
  "select",
  "button",
  "label",
]);

/* -------------------------------------------------------------------------- */
/*                           Elements Removed During Cleanup                  */
/* -------------------------------------------------------------------------- */

export const REMOVE_TAGS = Object.freeze([
  "script",
  "style",
  "noscript",
  "template",
  "iframe",
  "canvas",
  "svg",
]);

export const BOILERPLATE_TAGS = Object.freeze([
  "header",
  "footer",
  "nav",
  "aside",
]);

/* -------------------------------------------------------------------------- */
/*                            Void Elements                                   */
/* -------------------------------------------------------------------------- */

export const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/* -------------------------------------------------------------------------- */
/*                           Metadata Keys                                    */
/* -------------------------------------------------------------------------- */

export const META_NAMES = Object.freeze({

  DESCRIPTION: "description",

  KEYWORDS: "keywords",

  AUTHOR: "author",

  ROBOTS: "robots",

  VIEWPORT: "viewport",

  GENERATOR: "generator",

  REFERRER: "referrer",

  THEME_COLOR: "theme-color",

  APPLICATION_NAME: "application-name",

});

/* -------------------------------------------------------------------------- */
/*                             OpenGraph                                      */
/* -------------------------------------------------------------------------- */

export const OG_PROPERTIES = Object.freeze({

  TITLE: "og:title",

  DESCRIPTION: "og:description",

  IMAGE: "og:image",

  URL: "og:url",

  TYPE: "og:type",

  SITE_NAME: "og:site_name",

  LOCALE: "og:locale",

  VIDEO: "og:video",

});

/* -------------------------------------------------------------------------- */
/*                             Twitter Cards                                  */
/* -------------------------------------------------------------------------- */

export const TWITTER_PROPERTIES = Object.freeze({

  CARD: "twitter:card",

  TITLE: "twitter:title",

  DESCRIPTION: "twitter:description",

  IMAGE: "twitter:image",

  SITE: "twitter:site",

  CREATOR: "twitter:creator",

});

/* -------------------------------------------------------------------------- */
/*                           Schema.org                                       */
/* -------------------------------------------------------------------------- */

export const SCHEMA_TYPES = Object.freeze([

  "Article",

  "NewsArticle",

  "BlogPosting",

  "FAQPage",

  "HowTo",

  "Recipe",

  "Organization",

  "Person",

  "WebSite",

  "BreadcrumbList",

]);

/* -------------------------------------------------------------------------- */
/*                             Link Rel Values                                */
/* -------------------------------------------------------------------------- */

export const LINK_REL = Object.freeze({

  CANONICAL: "canonical",

  ICON: "icon",

  SHORTCUT_ICON: "shortcut icon",

  STYLESHEET: "stylesheet",

  PRELOAD: "preload",

  PREFETCH: "prefetch",

  NEXT: "next",

  PREV: "prev",

});

/* -------------------------------------------------------------------------- */
/*                             Input Types                                    */
/* -------------------------------------------------------------------------- */

export const INPUT_TYPES = Object.freeze([

  "text",

  "email",

  "password",

  "search",

  "number",

  "checkbox",

  "radio",

  "hidden",

  "file",

  "url",

  "date",

  "datetime-local",

  "submit",

]);

/* -------------------------------------------------------------------------- */
/*                         Default Parser Options                             */
/* -------------------------------------------------------------------------- */

export const DEFAULT_PARSE_OPTIONS: Required<HtmlParseOptions> = {

  readability: true,

  markdown: true,

  sanitize: true,

  schema: true,

  openGraph: true,

  twitterCards: true,

  jsonLd: true,

  tables: true,

  images: true,

  links: true,

  forms: true,

  codeBlocks: true,

  sections: true,

  toc: true,

  chunking: true,

  preserveHtml: false,

};

/* -------------------------------------------------------------------------- */
/*                         Reading Statistics                                 */
/* -------------------------------------------------------------------------- */

export const DEFAULT_READING_SPEED_WPM = 225;

export const DEFAULT_CHUNK_SIZE = 1200;

export const DEFAULT_CHUNK_OVERLAP = 150;

/* -------------------------------------------------------------------------- */
/*                         Regular Expressions                                */
/* -------------------------------------------------------------------------- */

export const REGEX = Object.freeze({

  MULTIPLE_WHITESPACE: /\s+/g,

  HTML_COMMENT: /<!--[\s\S]*?-->/g,

  SCRIPT_BLOCK: /<script[\s\S]*?<\/script>/gi,

  STYLE_BLOCK: /<style[\s\S]*?<\/style>/gi,

  JSON_LD:
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,

  ABSOLUTE_URL:
    /^https?:\/\//i,

  DATA_URI:
    /^data:/i,

});

/* -------------------------------------------------------------------------- */
/*                      Attribute Names                                       */
/* -------------------------------------------------------------------------- */

export const ATTRIBUTES = Object.freeze({

  ID: "id",

  CLASS: "class",

  HREF: "href",

  SRC: "src",

  ALT: "alt",

  TITLE: "title",

  CONTENT: "content",

  NAME: "name",

  PROPERTY: "property",

  REL: "rel",

  TYPE: "type",

  VALUE: "value",

  WIDTH: "width",

  HEIGHT: "height",

  LANG: "lang",

  ROLE: "role",

  ARIA_LABEL: "aria-label",

});

/* -------------------------------------------------------------------------- */
/*                          Export Collections                                */
/* -------------------------------------------------------------------------- */

export const HTML_CONSTANTS = Object.freeze({

  HTML_TAGS,

  HEADING_TAGS,

  TEXT_BLOCK_TAGS,

  SECTION_TAGS,

  TABLE_TAGS,

  MEDIA_TAGS,

  FORM_TAGS,

  REMOVE_TAGS,

  BOILERPLATE_TAGS,

  VOID_ELEMENTS,

  META_NAMES,

  OG_PROPERTIES,

  TWITTER_PROPERTIES,

  SCHEMA_TYPES,

  LINK_REL,

  INPUT_TYPES,

  ATTRIBUTES,

  DEFAULT_PARSE_OPTIONS,

  DEFAULT_READING_SPEED_WPM,

  DEFAULT_CHUNK_SIZE,

  DEFAULT_CHUNK_OVERLAP,

  REGEX,

});