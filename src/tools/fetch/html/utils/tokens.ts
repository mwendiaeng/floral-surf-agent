/**
 * utils/tokens.ts
 *
 * Token estimation utilities.
 *
 * These are lightweight estimators intended for
 * chunk sizing and context window planning.
 */

const AVG_CHARS_PER_TOKEN = 4;

/**
 * Rough GPT token estimate.
 */
export function estimateTokens(text: string): number {
  if (!text) {
    return 0;
  }

  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN);
}

/**
 * Estimate token count from words.
 *
 * ~0.75 words/token
 */
export function estimateTokensFromWords(words: number): number {
  return Math.ceil(words / 0.75);
}

/**
 * Estimate remaining context.
 */
export function remainingTokens(current: number, limit: number): number {
  return Math.max(
    0,

    limit - current
  );
}

/**
 * Whether text exceeds a token budget.
 */
export function exceedsTokenLimit(text: string, limit: number): boolean {
  return estimateTokens(text) > limit;
}

/**
 * Clamp token estimate.
 */
export function clampTokens(estimate: number, max: number): number {
  return Math.min(
    estimate,

    max
  );
}

export default {
  estimateTokens,

  estimateTokensFromWords,

  remainingTokens,

  exceedsTokenLimit,

  clampTokens
};
