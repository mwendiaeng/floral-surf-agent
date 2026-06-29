/**
 * agent/llm/client.ts
 */

import { stepCountIs, streamText } from "ai";

import { resolveLanguageModel } from "./providers";

import type { LLMClientOptions, LLMRequest } from "./types";

/* -------------------------------------------------------------------------- */
/* LLM Client                                                                 */
/* -------------------------------------------------------------------------- */

export class LLMClient {
  constructor(private readonly options: LLMClientOptions) {}

  get config() {
    return this.options.config;
  }

  getModel() {
    return resolveLanguageModel({
      binding: this.options.binding,
      config: this.options.config,
      secrets: this.options.secrets,
      sessionAffinity: this.options.sessionAffinity,
    });
  }

  stream(request: LLMRequest) {
    const model = this.getModel();
    const { config } = this.options;

    return streamText({
      model,
      system: request.system,
      messages: request.messages as never[],
      tools: request.tools as never,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      topP: config.topP,
      stopSequences: config.stopSequences,
      stopWhen: stepCountIs(request.maxSteps ?? 5) as never,
      abortSignal: request.abortSignal,
    });
  }
}
