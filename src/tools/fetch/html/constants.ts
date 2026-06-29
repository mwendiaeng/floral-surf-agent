/**
 * html/constants.ts
 *
 * Shared constants for the HTML parser subsystem.
 */

import type { HtmlParseOptions } from "./types";

/* -------------------------------------------------------------------------- */
/*                               HTML Elements                                */
/* -------------------------------------------------------------------------- */

export const HTML_TAGS = Object.freeze({
  HTML: "html",
  HEAD: "head",
  BODY: "body",

  TITLE: "title",

  META: "meta",

  LINK: "link",

  BASE: "base",

  SCRIPT: "script",

  STYLE: "style",

  NOSCRIPT: "noscript",

  TEMPLATE: "template",

  SLOT: "slot",

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

  PICTURE: "picture",

  SOURCE: "source",

  SVG: "svg",

  VIDEO: "video",

  AUDIO: "audio",

  TRACK: "track",

  IFRAME: "iframe",

  OBJECT: "object",

  EMBED: "embed",

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

  CANVAS: "canvas"
});

/* -------------------------------------------------------------------------- */
/*                              Tag Collections                               */
/* -------------------------------------------------------------------------- */

export const HEADING_TAGS = Object.freeze(["h1", "h2", "h3", "h4", "h5", "h6"]);

export const TEXT_BLOCK_TAGS = Object.freeze([
  "p",
  "blockquote",
  "pre",
  "li",
  "td",
  "th",
  "dd",
  "article",
  "section"
]);

export const SECTION_TAGS = Object.freeze([
  "article",
  "section",
  "main",
  "aside"
]);

export const TABLE_TAGS = Object.freeze([
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th"
]);

export const MEDIA_TAGS = Object.freeze([
  "img",
  "picture",
  "source",
  "video",
  "audio",
  "svg",
  "canvas"
]);

export const FORM_TAGS = Object.freeze([
  "form",
  "input",
  "textarea",
  "select",
  "button",
  "label"
]);

/* -------------------------------------------------------------------------- */
/*                          Cleanup Configuration                             */
/* -------------------------------------------------------------------------- */

export const REMOVE_TAGS = Object.freeze([
  "script",
  "style",
  "noscript",
  "template",
  "iframe",
  "canvas"
]);

export const BOILERPLATE_TAGS = Object.freeze([
  "header",
  "footer",
  "nav",
  "aside"
]);

export const PRESERVE_WHITESPACE_TAGS = Object.freeze([
  "pre",
  "code",
  "textarea"
]);

export const INLINE_ELEMENTS = Object.freeze([
  "a",
  "span",
  "strong",
  "em",
  "b",
  "i",
  "mark",
  "small",
  "sup",
  "sub"
]);

export const BLOCK_ELEMENTS = Object.freeze([
  "article",
  "section",
  "div",
  "p",
  "blockquote",
  "pre",
  "table",
  "figure",
  "header",
  "footer",
  "nav"
]);

/* -------------------------------------------------------------------------- */
/*                             HTML Specification                             */
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
  "wbr"
]);

/* -------------------------------------------------------------------------- */
/*                               Metadata                                     */
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

  APPLICATION_NAME: "application-name"
});

export const OG_PROPERTIES = Object.freeze({
  TITLE: "og:title",

  DESCRIPTION: "og:description",

  IMAGE: "og:image",

  URL: "og:url",

  TYPE: "og:type",

  SITE_NAME: "og:site_name",

  LOCALE: "og:locale",

  AUDIO: "og:audio",

  VIDEO: "og:video"
});

export const TWITTER_PROPERTIES = Object.freeze({
  CARD: "twitter:card",

  TITLE: "twitter:title",

  DESCRIPTION: "twitter:description",

  IMAGE: "twitter:image",

  SITE: "twitter:site",

  CREATOR: "twitter:creator"
});

/* -------------------------------------------------------------------------- */
/*                              Schema.org                                    */
/* -------------------------------------------------------------------------- */

export const SCHEMA_TYPES = Object.freeze([
  "Article",

  "NewsArticle",

  "BlogPosting",

  "TechArticle",

  "LiveBlogPosting",

  "FAQPage",

  "QAPage",

  "HowTo",

  "Recipe",

  "Course",

  "Organization",

  "Corporation",

  "LocalBusiness",

  "Person",

  "ProfilePage",

  "WebSite",

  "WebPage",

  "CollectionPage",

  "ItemList",

  "BreadcrumbList",

  "Dataset",

  "Product",

  "Review",

  "Event"
]);

/* -------------------------------------------------------------------------- */
/*                              Link Relations                                */
/* -------------------------------------------------------------------------- */

export const LINK_REL = Object.freeze({
  CANONICAL: "canonical",

  ICON: "icon",

  SHORTCUT_ICON: "shortcut icon",

  APPLE_TOUCH_ICON: "apple-touch-icon",

  MASK_ICON: "mask-icon",

  MANIFEST: "manifest",

  STYLESHEET: "stylesheet",

  PRELOAD: "preload",

  PREFETCH: "prefetch",

  PRECONNECT: "preconnect",

  DNS_PREFETCH: "dns-prefetch",

  MODULE_PRELOAD: "modulepreload",

  NEXT: "next",

  PREV: "prev",

  ALTERNATE: "alternate",

  AUTHOR: "author",

  LICENSE: "license"
});

/* -------------------------------------------------------------------------- */
/*                               Input Types                                  */
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

  "month",

  "week",

  "time",

  "tel",

  "color",

  "range",

  "submit",

  "reset",

  "button"
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

  preserveHtml: false
};

/* -------------------------------------------------------------------------- */
/*                             Parser Defaults                                */
/* -------------------------------------------------------------------------- */

export const DEFAULT_READING_SPEED_WPM = 225;

export const DEFAULT_CHUNK_SIZE = 1200;

export const DEFAULT_CHUNK_OVERLAP = 150;

export const MAX_HEADING_LEVEL = 6;

export const MAX_META_SIZE = 1024 * 1024;

export const MAX_TEXT_LENGTH = 20 * 1024 * 1024;

/* -------------------------------------------------------------------------- */
/*                             MIME Types                                     */
/* -------------------------------------------------------------------------- */

export const MIME_TYPES = Object.freeze({
  HTML: "text/html",

  XHTML: "application/xhtml+xml",

  XML: "application/xml",

  SVG: "image/svg+xml",

  JSON: "application/json",

  JSONLD: "application/ld+json",

  PDF: "application/pdf",

  TEXT: "text/plain",

  MARKDOWN: "text/markdown"
});

/* -------------------------------------------------------------------------- */
/*                           HTTP Header Names                                */
/* -------------------------------------------------------------------------- */

export const HEADERS = Object.freeze({
  CONTENT_TYPE: "content-type",

  CONTENT_LENGTH: "content-length",

  CONTENT_ENCODING: "content-encoding",

  CACHE_CONTROL: "cache-control",

  ETAG: "etag",

  LAST_MODIFIED: "last-modified",

  LOCATION: "location",

  SET_COOKIE: "set-cookie",

  SERVER: "server",

  USER_AGENT: "user-agent"
});

/* -------------------------------------------------------------------------- */
/*                             Regular Expressions                            */
/* -------------------------------------------------------------------------- */

export const REGEX = Object.freeze({
  MULTIPLE_WHITESPACE: /\s+/g,

  HTML_COMMENT: /<!--[\s\S]*?-->/g,

  SCRIPT_BLOCK: /<script[\s\S]*?<\/script>/gi,

  STYLE_BLOCK: /<style[\s\S]*?<\/style>/gi,

  JSON_LD:
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,

  ABSOLUTE_URL: /^(https?:)?\/\//i,

  RELATIVE_URL: /^(?!https?:\/\/)(?!\/\/)(?!mailto:)(?!tel:).+/i,

  DATA_URI: /^data:/i,

  MAILTO: /^mailto:/i,

  TEL: /^tel:/i,

  HASH: /^#/,

  WHITESPACE: /^\s*$/,

  MULTIPLE_NEWLINES: /\n{3,}/g,

  SENTENCE_SPLIT: /(?<=[.!?])\s+/,

  WORD_SPLIT: /\s+/
});

/* -------------------------------------------------------------------------- */
/*                             HTML Attributes                                */
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

  TARGET: "target",

  DOWNLOAD: "download",

  PLACEHOLDER: "placeholder",

  REQUIRED: "required",

  CHECKED: "checked",

  DISABLED: "disabled",

  READONLY: "readonly",

  ACTION: "action",

  METHOD: "method",

  ENCTYPE: "enctype",

  ARIA_LABEL: "aria-label",

  ARIA_HIDDEN: "aria-hidden"
});

/* -------------------------------------------------------------------------- */
/*                            Aggregate Export                                */
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

  PRESERVE_WHITESPACE_TAGS,

  INLINE_ELEMENTS,

  BLOCK_ELEMENTS,

  VOID_ELEMENTS,

  META_NAMES,

  OG_PROPERTIES,

  TWITTER_PROPERTIES,

  SCHEMA_TYPES,

  LINK_REL,

  INPUT_TYPES,

  MIME_TYPES,

  HEADERS,

  ATTRIBUTES,

  DEFAULT_PARSE_OPTIONS,

  DEFAULT_READING_SPEED_WPM,

  DEFAULT_CHUNK_SIZE,

  DEFAULT_CHUNK_OVERLAP,

  MAX_HEADING_LEVEL,

  MAX_META_SIZE,

  MAX_TEXT_LENGTH,

  REGEX
});
