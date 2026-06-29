/**
 * Load typed application configuration from Worker env bindings.
 */

import type { AppConfig, LlmConfig, LlmConfigSet } from "./types";

import {
  assertLlmConfig,
  defaultBaseUrlForProvider,
  defaultModelForProvider,
  parseAppEnvironment,
  parseLlmProvider,
  parseOptionalNumber,
  resolveApiKey,
  parseMcpServers,
} from "./schema";

import { toProviderConfiguration } from "./types";

import type { LLMClientOptions } from "../agent/llm/types";

/* -------------------------------------------------------------------------- */
/* LLM                                                                        */
/* -------------------------------------------------------------------------- */

function loadLlmConfig(
  env: Env,
  overrides?: Partial<Pick<LlmConfig, "provider" | "model">>
): LlmConfig {
  const provider = parseLlmProvider(
    overrides?.provider ?? env.LLM_PROVIDER
  );

  const model =
    overrides?.model ??
    env.LLM_MODEL?.trim() ??
    defaultModelForProvider(provider);

  const config: LlmConfig = {
    provider,
    model,
    apiKey: resolveApiKey(provider, env),
    baseUrl: defaultBaseUrlForProvider(provider, env),
    temperature: parseOptionalNumber(env.LLM_TEMPERATURE),
    maxTokens: parseOptionalNumber(env.LLM_MAX_TOKENS),
    topP: parseOptionalNumber(env.LLM_TOP_P),
  };

  assertLlmConfig(config);

  return config;
}

function loadLlmConfigSet(env: Env): LlmConfigSet {
  const primary = loadLlmConfig(env);

  const fallbackProvider = env.LLM_FALLBACK_PROVIDER?.trim();
  if (!fallbackProvider) {
    return { primary };
  }

  const fallback = loadLlmConfig(env, {
    provider: parseLlmProvider(fallbackProvider),
    model: env.LLM_FALLBACK_MODEL,
  });

  return { primary, fallback };
}

/* -------------------------------------------------------------------------- */
/* App config                                                                 */
/* -------------------------------------------------------------------------- */

export function loadAppConfig(env: Env): AppConfig {
  const config: AppConfig = {
    env: parseAppEnvironment(env.APP_ENV),
    llm: loadLlmConfigSet(env),
  };

  if (env.DATABASE_URL?.trim()) {
    config.database = {
      url: env.DATABASE_URL.trim(),
    };
  }

  if (env.REDIS_URL?.trim()) {
    config.redis = {
      url: env.REDIS_URL.trim(),
    };
  }

  const mcpServers = parseMcpServers(env.MCP_SERVERS);
  if (mcpServers.length > 0) {
    config.mcp = { servers: mcpServers };
  }

  return config;
}

export function createLlmClientOptions(
  env: Env,
  options?: {
    sessionAffinity?: string;
    useFallback?: boolean;
  }
): LLMClientOptions {
  const appConfig = loadAppConfig(env);
  const llm =
    options?.useFallback && appConfig.llm.fallback
      ? appConfig.llm.fallback
      : appConfig.llm.primary;

  return {
    binding: env.AI,
    config: toProviderConfiguration(llm),
    secrets: {
      apiKey: llm.apiKey,
      baseUrl: llm.baseUrl,
    },
    sessionAffinity: options?.sessionAffinity,
  };
}

export function getActiveLlmConfig(env: Env): LlmConfig {
  return loadAppConfig(env).llm.primary;
}
