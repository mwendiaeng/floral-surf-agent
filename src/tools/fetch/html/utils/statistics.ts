/**
 * utils/statistics.ts
 *
 * Text statistics utilities.
 */

import { normalizeWhitespace } from "./strings";

/* -------------------------------------------------------------------------- */
/* Words                                                                      */
/* -------------------------------------------------------------------------- */

export function countWords(text: string): number {
  if (!text) {
    return 0;
  }

  return normalizeWhitespace(text)
    .split(" ")

    .filter(Boolean).length;
}

/* -------------------------------------------------------------------------- */
/* Sentences                                                                  */
/* -------------------------------------------------------------------------- */

export function countSentences(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  return text

    .split(/(?<=[.!?])\s+/)

    .filter(Boolean).length;
}

/* -------------------------------------------------------------------------- */
/* Paragraphs                                                                 */
/* -------------------------------------------------------------------------- */

export function countParagraphs(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  return text

    .split(/\n\s*\n/)

    .filter(Boolean).length;
}

/* -------------------------------------------------------------------------- */
/* Reading Time                                                               */
/* -------------------------------------------------------------------------- */

export function estimateReadingTime(
  text: string,

  wordsPerMinute = 225
): number {
  const words = countWords(text);

  return Math.max(
    1,

    Math.ceil(words / wordsPerMinute)
  );
}

/* -------------------------------------------------------------------------- */
/* Character Count                                                            */
/* -------------------------------------------------------------------------- */

export function countCharacters(text: string): number {
  return text.length;
}

/* -------------------------------------------------------------------------- */
/* Average Word Length                                                        */
/* -------------------------------------------------------------------------- */

export function averageWordLength(text: string): number {
  const words = normalizeWhitespace(text)
    .split(" ")

    .filter(Boolean);

  if (words.length === 0) {
    return 0;
  }

  return (
    words.reduce(
      (sum, word) => sum + word.length,

      0
    ) / words.length
  );
}

/* -------------------------------------------------------------------------- */
/* Longest Word                                                               */
/* -------------------------------------------------------------------------- */

export function longestWord(text: string): string {
  return normalizeWhitespace(text)
    .split(" ")

    .reduce(
      (longest, current) =>
        current.length > longest.length ? current : longest,

      ""
    );
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export default {
  countWords,

  countSentences,

  countParagraphs,

  countCharacters,

  averageWordLength,

  longestWord,

  estimateReadingTime
};
