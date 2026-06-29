/**
 * Env parsing helpers for application configuration.
 */

import { z } from "zod";

import type { AppEnvironment, LlmProviderId } from "./types";

/* -------------------------------------------------------------------------- */
/* Schemas                                                                    */
/* -------------------------------------------------------------------------- */

export const LlmProviderSchema = z.enum([
  "workers-ai",
  "openai",
  "anthropic",
  "openai-compatible",
]);

export const AppEnvironmentSchema = z.enum([
  "development",
  "staging",
  "production",
]);

const DEFAULT_WORKERS_MODEL = "@cf/moonshotai/kimi-k2.6";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

/* -------------------------------------------------------------------------- */
/* Parsing                                                                    */
/* -------------------------------------------------------------------------- */

export function parseLlmProvider(
  value: string | undefined,
  fallback: LlmProviderId = "workers-ai"
): LlmProviderId {
  const result = LlmProviderSchema.safeParse(value?.trim().toLowerCase());
  return result.success ? result.data : fallback;
}

export function parseAppEnvironment(
  value: string | undefined
): AppEnvironment {
  const result = AppEnvironmentSchema.safeParse(value?.trim().toLowerCase());
  if (result.success) {
    return result.data;
  }

  return "development";
}

export function parseOptionalNumber(
  value: string | undefined
): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function defaultModelForProvider(
  provider: LlmProviderId
): string {
  switch (provider) {
    case "openai":
    case "openai-compatible":
      return DEFAULT_OPENAI_MODEL;
    case "anthropic":
      return DEFAULT_ANTHROPIC_MODEL;
    case "workers-ai":
    default:
      return DEFAULT_WORKERS_MODEL;
  }
}

export function defaultBaseUrlForProvider(
  provider: LlmProviderId,
  env: Env
): string | undefined {
  switch (provider) {
    case "openai":
    case "openai-compatible":
      return env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
    case "anthropic":
      return env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com/v1";
    case "workers-ai":
    default:
      return undefined;
  }
}

export function resolveApiKey(
  provider: LlmProviderId,
  env: Env
): string | undefined {
  switch (provider) {
    case "openai":
    case "openai-compatible":
      return env.OPENAI_API_KEY;
    case "anthropic":
      return env.ANTHROPIC_API_KEY;
    case "workers-ai":
    default:
      return undefined;
  }
}

export function assertLlmConfig(
  config: {
    provider: LlmProviderId;
    model: string;
    apiKey?: string;
    baseUrl?: string;
  }
): void {
  if (config.provider === "workers-ai") {
    return;
  }

  if (!config.apiKey?.trim()) {
    throw new Error(
      `LLM provider "${config.provider}" requires an API key secret ` +
        `(OPENAI_API_KEY or ANTHROPIC_API_KEY).`
    );
  }
}

export function parseMcpServers(
  value: string | undefined
): Array<{ name: string; url: string }> {
  if (!value?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => {
        if (
          typeof entry === "object" &&
          entry !== null &&
          "name" in entry &&
          "url" in entry &&
          typeof entry.name === "string" &&
          typeof entry.url === "string"
        ) {
          return {
            name: entry.name.trim(),
            url: entry.url.trim(),
          };
        }

        return null;
      })
      .filter(
        (entry): entry is { name: string; url: string } =>
          entry !== null && entry.name.length > 0 && entry.url.length > 0
      );
  } catch {
    return [];
  }
}
