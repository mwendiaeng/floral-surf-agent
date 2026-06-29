import { callable, routeAgentRequest, type Schedule } from "agents";
import { AIChatAgent, type OnChatMessageOptions } from "@cloudflare/ai-chat";
import {
  convertToModelMessages,
  pruneMessages,
  stepCountIs,
  streamText
} from "ai";
import {
  Agent,
  bootstrapChatAgent,
  buildChatAiTools,
  buildChatSystemPrompt,
  integrateMcpTools,
  recordModelInvocation,
  resolveLanguageModelWithFallback
} from "./agent";
import type { SessionId } from "./agent/state/types";
import { AgentStatus } from "./agent/state/types";
import {
  createLlmClientOptions,
  getActiveLlmConfig,
  loadAppConfig,
  toProviderConfiguration
} from "./config";

export class ChatAgent extends AIChatAgent<Env> {
  maxPersistedMessages = 100;
  chatRecovery = true;

  private runtime?: Agent;
  private mcpBootstrapped = false;

  private getRuntime(): Agent {
    if (!this.runtime) {
      this.runtime = bootstrapChatAgent({
        sessionId: this.name,
        schedule: {
          schedule: (input, description) => {
            this.schedule(input, "executeTask", description, {
              idempotent: true
            });
          },
          getSchedules: () => this.getSchedules(),
          cancelSchedule: (taskId) => {
            this.cancelSchedule(taskId);
          }
        },
        llm: createLlmClientOptions(this.env, {
          sessionAffinity: this.sessionAffinity
        })
      });
    }

    return this.runtime;
  }

  private async bootstrapDefaultMcpServers(): Promise<void> {
    if (this.mcpBootstrapped) {
      return;
    }

    this.mcpBootstrapped = true;

    const config = loadAppConfig(this.env);
    for (const server of config.mcp?.servers ?? []) {
      try {
        await this.addMcpServer(server.name, server.url);
      } catch (error) {
        console.error(
          `Failed to connect MCP server "${server.name}":`,
          error
        );
      }
    }
  }

  async onStart() {
    this.mcp.configureOAuthCallback({
      customHandler: (result) => {
        if (result.authSuccess) {
          return new Response("<script>window.close();</script>", {
            headers: { "content-type": "text/html" },
            status: 200
          });
        }
        return new Response(
          `Authentication Failed: ${result.authError || "Unknown error"}`,
          { headers: { "content-type": "text/plain" }, status: 400 }
        );
      }
    });

    await this.bootstrapDefaultMcpServers();
  }

  @callable()
  async addServer(name: string, url: string) {
    return await this.addMcpServer(name, url);
  }

  @callable()
  async removeServer(serverId: string) {
    await this.removeMcpServer(serverId);
  }

  async onChatMessage(_onFinish: unknown, options?: OnChatMessageOptions) {
    await this.bootstrapDefaultMcpServers();

    const agent = this.getRuntime();
    const appConfig = loadAppConfig(this.env);
    const llm = appConfig.llm.primary;
    const sessionId = agent.getState().runtime.sessionId as SessionId;
    const mcpTools = this.mcp.getAITools();

    await agent.transitionStatus(AgentStatus.Streaming);

    const chatTools = buildChatAiTools(agent, {
      sessionId,
      signal: options?.abortSignal,
      schedule: {
        schedule: (input, description) => {
          this.schedule(input, "executeTask", description, {
            idempotent: true
          });
        },
        getSchedules: () => this.getSchedules(),
        cancelSchedule: (taskId) => {
          this.cancelSchedule(taskId);
        }
      }
    });

    const integrated = integrateMcpTools(mcpTools, chatTools, { agent });

    const externalTools = Object.fromEntries(
      integrated.mcpDescriptors.map((descriptor) => [
        descriptor.name,
        { description: descriptor.description }
      ])
    );

    const llmOptions = createLlmClientOptions(this.env, {
      sessionAffinity: this.sessionAffinity
    });

    const fallback = appConfig.llm.fallback;
    const model = resolveLanguageModelWithFallback(
      {
        binding: llmOptions.binding,
        config: llmOptions.config,
        secrets: llmOptions.secrets,
        sessionAffinity: llmOptions.sessionAffinity
      },
      fallback
        ? {
            binding: llmOptions.binding,
            config: toProviderConfiguration(fallback),
            secrets: {
              apiKey: fallback.apiKey,
              baseUrl: fallback.baseUrl
            },
            sessionAffinity: llmOptions.sessionAffinity
          }
        : undefined
    );

    const systemPrompt = buildChatSystemPrompt({
      date: new Date(),
      aiTools: chatTools,
      externalTools,
      vision: true,
      extra:
        "You have coding tools for JavaScript execution, JSON/YAML parsing, regex testing, Base64 transforms, language detection, and text diffs. Prefer these for programming tasks."
    });

    const result = streamText({
      model,
      system: systemPrompt,
      messages: pruneMessages({
        messages: await convertToModelMessages(this.messages),
        toolCalls: "before-last-2-messages"
      }),
      tools: integrated.tools,
      temperature: llm.temperature,
      maxOutputTokens: llm.maxTokens,
      topP: llm.topP,
      stopWhen: stepCountIs(5),
      abortSignal: options?.abortSignal,
      onFinish: async () => {
        const active = getActiveLlmConfig(this.env);
        await recordModelInvocation(agent, active.provider, active.model);
        agent.transitionStatus(AgentStatus.Completed);
      }
    });

    return result.toUIMessageStreamResponse();
  }

  async executeTask(description: string, _task: Schedule<string>) {
    console.log(`Executing scheduled task: ${description}`);

    this.broadcast(
      JSON.stringify({
        type: "scheduled-task",
        description,
        timestamp: new Date().toISOString()
      })
    );
  }
}

export default {
  async fetch(request: Request, env: Env) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
