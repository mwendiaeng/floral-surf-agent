/**
 * agent/llm/types.ts
 */

import type { ProviderConfiguration } from "../state/types";

/* -------------------------------------------------------------------------- */
/* LLM                                                                        */
/* -------------------------------------------------------------------------- */

export interface LlmSecrets {
  apiKey?: string;
  baseUrl?: string;
}

export interface LLMRequest {
  system?: string;
  messages: unknown[];
  tools?: Record<string, unknown>;
  maxSteps?: number;
  abortSignal?: AbortSignal;
}

export interface LLMResponse {
  text: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMClientOptions {
  /** Required for workers-ai; optional for external providers */
  binding?: Ai;
  config: ProviderConfiguration;
  secrets?: LlmSecrets;
  sessionAffinity?: string;
}

export interface ResolveModelOptions {
  binding?: Ai;
  config: ProviderConfiguration;
  secrets?: LlmSecrets;
  sessionAffinity?: string;
}
