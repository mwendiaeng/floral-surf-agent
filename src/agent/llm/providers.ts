/**
 * Multi-provider language model resolution.
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { createWorkersAI } from "workers-ai-provider";

import type { ResolveModelOptions } from "./types";

/* -------------------------------------------------------------------------- */
/* Provider resolution                                                        */
/* -------------------------------------------------------------------------- */

function normalizeProvider(
  provider: string
): string {
  return provider.trim().toLowerCase();
}

function resolveWorkersAiModel(
  options: ResolveModelOptions
): LanguageModel {
  if (!options.binding) {
    throw new Error(
      "Workers AI provider requires the AI binding (env.AI)."
    );
  }

  const workersai = createWorkersAI({
    binding: options.binding,
  });

  return workersai(
    options.config.model as `@cf/${string}`,
    {
      sessionAffinity: options.sessionAffinity,
    }
  );
}

function resolveOpenAiModel(
  options: ResolveModelOptions,
  compatible = false
): LanguageModel {
  const apiKey = options.secrets?.apiKey?.trim();
  if (!apiKey) {
    throw new Error(
      compatible
        ? "OpenAI-compatible provider requires OPENAI_API_KEY."
        : "OpenAI provider requires OPENAI_API_KEY."
    );
  }

  const baseURL =
    options.secrets?.baseUrl ??
    options.config.endpoint ??
    "https://api.openai.com/v1";

  const openai = createOpenAI({
    apiKey,
    baseURL,
  });

  return openai(options.config.model);
}

function resolveAnthropicModel(
  options: ResolveModelOptions
): LanguageModel {
  const apiKey = options.secrets?.apiKey?.trim();
  if (!apiKey) {
    throw new Error("Anthropic provider requires ANTHROPIC_API_KEY.");
  }

  const baseURL =
    options.secrets?.baseUrl ??
    options.config.endpoint ??
    "https://api.anthropic.com/v1";

  const anthropic = createAnthropic({
    apiKey,
    baseURL,
  });

  return anthropic(options.config.model);
}

export function resolveLanguageModel(
  options: ResolveModelOptions
): LanguageModel {
  const provider = normalizeProvider(options.config.provider);

  switch (provider) {
    case "workers-ai":
      return resolveWorkersAiModel(options);
    case "openai":
      return resolveOpenAiModel(options);
    case "openai-compatible":
      return resolveOpenAiModel(options, true);
    case "anthropic":
      return resolveAnthropicModel(options);
    default:
      throw new Error(
        `Unsupported LLM provider "${options.config.provider}". ` +
          `Expected workers-ai, openai, anthropic, or openai-compatible.`
      );
  }
}

export function resolveLanguageModelWithFallback(
  options: ResolveModelOptions,
  fallback?: ResolveModelOptions
): LanguageModel {
  try {
    return resolveLanguageModel(options);
  } catch (primaryError) {
    if (!fallback) {
      throw primaryError;
    }

    return resolveLanguageModel(fallback);
  }
}
