// /**
//  * fetch/readability.ts
//  *
//  * Clean article extraction using Mozilla Readability.
//  *
//  * Features:
//  *  - Removes navigation
//  *  - Removes ads
//  *  - Removes sidebars
//  *  - Removes scripts
//  *  - Extracts article body
//  *  - HTML → Markdown
//  *  - Metadata extraction
//  *  - Reading time
//  *  - Word count
//  */

// import { JSDOM } from "jsdom";
// import { Readability } from "@mozilla/readability";
// import TurndownService from "turndown";

// import type { ReadabilityResult } from "./types";

// const turndown = new TurndownService({
//   headingStyle: "atx",

//   codeBlockStyle: "fenced",

//   bulletListMarker: "-"
// });

// export interface ReadabilityOptions {
//   preserveLinks?: boolean;

//   preserveImages?: boolean;

//   preserveTables?: boolean;
// }

// export function extractReadableArticle(
//   html: string,

//   options: ReadabilityOptions = {}
// ): ReadabilityResult {
//   const dom = new JSDOM(html);

//   const reader = new Readability(dom.window.document);

//   const article = reader.parse();

//   if (!article) {
//     return {
//       title: "",

//       content: "",

//       textContent: "",

//       markdown: "",

//       excerpt: "",

//       byline: "",

//       language: detectLanguage(dom.window.document.documentElement.lang),

//       length: 0,

//       wordCount: 0,

//       readingTimeMinutes: 0
//     };
//   }

//   let cleanedHtml = article.content;

//   if (!options.preserveImages) {
//     cleanedHtml = cleanedHtml.replace(/<img[\s\S]*?>/gi, "");
//   }

//   if (!options.preserveTables) {
//     cleanedHtml = cleanedHtml.replace(/<table[\s\S]*?<\/table>/gi, "");
//   }

//   if (!options.preserveLinks) {
//     cleanedHtml = cleanedHtml
//       .replace(/<a\b[^>]*>/gi, "")
//       .replace(/<\/a>/gi, "");
//   }

//   const markdown = turndown.turndown(cleanedHtml);

//   const wordCount = countWords(article.textContent);

//   return {
//     title: article.title,

//     byline: article.byline,

//     excerpt: article.excerpt,

//     content: cleanedHtml,

//     markdown,

//     textContent: article.textContent,

//     language: detectLanguage(dom.window.document.documentElement.lang),

//     length: article.length,

//     wordCount,

//     readingTimeMinutes: estimateReadingTime(wordCount)
//   };
// }

// /**
//  * Estimate reading time.
//  */
// export function estimateReadingTime(
//   words: number,

//   wpm = 225
// ): number {
//   return Math.max(
//     1,

//     Math.ceil(words / wpm)
//   );
// }

// /**
//  * Count words.
//  */
// export function countWords(text: string): number {
//   return text.trim().split(/\s+/).filter(Boolean).length;
// }

// /**
//  * Detect language.
//  */
// export function detectLanguage(lang?: string): string {
//   if (!lang) {
//     return "unknown";
//   }

//   return lang.split("-")[0].toLowerCase();
// }

// /**
//  * Strip HTML.
//  */
// export function stripHtml(html: string): string {
//   return html

//     .replace(/<script[\s\S]*?<\/script>/gi, "")

//     .replace(/<style[\s\S]*?<\/style>/gi, "")

//     .replace(/<[^>]+>/g, " ")

//     .replace(/\s+/g, " ")

//     .trim();
// }
