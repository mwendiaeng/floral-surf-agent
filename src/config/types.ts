/**
 * Application configuration types.
 */

import type { ProviderConfiguration } from "../agent/state/types";

/* -------------------------------------------------------------------------- */
/* Providers                                                                  */
/* -------------------------------------------------------------------------- */

export type LlmProviderId =
  | "workers-ai"
  | "openai"
  | "anthropic"
  | "openai-compatible";

export type AppEnvironment = "development" | "staging" | "production";

/* -------------------------------------------------------------------------- */
/* LLM                                                                        */
/* -------------------------------------------------------------------------- */

export interface LlmConfig {
  provider: LlmProviderId;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  apiVersion?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface LlmConfigSet {
  primary: LlmConfig;
  fallback?: LlmConfig;
}

/* -------------------------------------------------------------------------- */
/* Data stores                                                                */
/* -------------------------------------------------------------------------- */

export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  ssl?: boolean;
}

export interface RedisConfig {
  url: string;
}

/* -------------------------------------------------------------------------- */
/* MCP                                                                        */
/* -------------------------------------------------------------------------- */

export interface McpServerConfig {
  name: string;
  url: string;
}

export interface McpConfig {
  servers: McpServerConfig[];
}

/* -------------------------------------------------------------------------- */
/* App                                                                        */
/* -------------------------------------------------------------------------- */

export interface AppConfig {
  env: AppEnvironment;
  llm: LlmConfigSet;
  database?: DatabaseConfig;
  redis?: RedisConfig;
  mcp?: McpConfig;
}

export function toProviderConfiguration(
  config: LlmConfig
): ProviderConfiguration {
  return {
    provider: config.provider,
    model: config.model,
    endpoint: config.baseUrl,
    apiVersion: config.apiVersion,
    temperature: config.temperature,
    topP: config.topP,
    maxTokens: config.maxTokens,
    stopSequences: config.stopSequences,
  };
}
