/**
 * Wire MCP tools into the agent runtime.
 */

import { tool } from "ai";
import type { Tool } from "ai";

import type { Agent } from "../Agent";

import {
  mergeChatTools,
  namespaceMcpToolName,
  namespaceMcpTools,
} from "./merge";

import type { McpToolBundle, MergeToolsOptions } from "./types";

/* -------------------------------------------------------------------------- */
/* Tool wrapping                                                              */
/* -------------------------------------------------------------------------- */

async function recordToolCall(
  agent: Agent | undefined,
  name: string,
  input: unknown,
  output: unknown,
  error?: string
): Promise<void> {
  if (!agent) {
    return;
  }

  await agent.execution.recordTool(name, input, output, error);
}

function wrapToolWithAgent(
  name: string,
  source: Tool,
  agent?: Agent
): Tool {
  if (!source.execute) {
    return source;
  }

  const originalExecute = source.execute.bind(source);

  return tool({
    description: source.description,
    inputSchema: source.inputSchema,
    outputSchema: source.outputSchema,
    needsApproval: source.needsApproval,
    execute: async (input, options) => {
      try {
        const output = await originalExecute(input, options);
        await recordToolCall(agent, name, input, output);
        return output;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        await recordToolCall(agent, name, input, undefined, message);
        throw error;
      }
    },
  });
}

function wrapToolsWithAgent(
  tools: Record<string, Tool>,
  agent?: Agent
): Record<string, Tool> {
  const wrapped: Record<string, Tool> = {};

  for (const [name, source] of Object.entries(tools)) {
    wrapped[name] = wrapToolWithAgent(name, source, agent);
  }

  return wrapped;
}

/* -------------------------------------------------------------------------- */
/* Integration                                                                */
/* -------------------------------------------------------------------------- */

export function buildMcpToolBundle(
  mcpTools: Record<string, Tool>,
  options?: {
    serverHint?: string;
    namespace?: string;
    agent?: Agent;
  }
): McpToolBundle {
  const namespaced = namespaceMcpTools(
    mcpTools,
    options?.serverHint,
    options?.namespace
  );

  const wrapped = wrapToolsWithAgent(namespaced, options?.agent);

  const descriptors = Object.entries(mcpTools).map(([originalName, tool]) => ({
    name: namespaceMcpToolName(
      originalName,
      options?.serverHint,
      options?.namespace
    ),
    description: tool.description,
    serverName: options?.serverHint,
  }));

  return {
    tools: wrapped,
    descriptors,
    toolCount: Object.keys(wrapped).length,
  };
}

export function integrateMcpTools(
  mcpTools: Record<string, Tool>,
  agentTools: Record<string, Tool>,
  options?: MergeToolsOptions & {
    agent?: Agent;
    serverHint?: string;
  }
): {
  tools: Record<string, Tool>;
  mcpDescriptors: McpToolBundle["descriptors"];
  mcpToolCount: number;
} {
  const mcpBundle = buildMcpToolBundle(mcpTools, {
    serverHint: options?.serverHint,
    namespace: options?.namespace,
    agent: options?.agent,
  });

  return {
    tools: mergeChatTools(mcpBundle.tools, agentTools, options),
    mcpDescriptors: mcpBundle.descriptors,
    mcpToolCount: mcpBundle.toolCount,
  };
}

export function mcpToolsForPrompt(
  mcpTools: Record<string, Tool>
): Record<string, { description?: string }> {
  const promptTools: Record<string, { description?: string }> = {};

  for (const [name, tool] of Object.entries(mcpTools)) {
    promptTools[name] = { description: tool.description };
  }

  return promptTools;
}
