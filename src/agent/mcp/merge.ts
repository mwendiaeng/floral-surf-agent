/**
 * Merge MCP tools with agent tools, applying namespacing.
 */

import type { Tool } from "ai";

import type { MergeToolsOptions, McpToolDescriptor } from "./types";

const DEFAULT_NAMESPACE = "mcp";

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export function namespaceMcpToolName(
  toolName: string,
  serverHint?: string,
  namespace = DEFAULT_NAMESPACE
): string {
  const server = serverHint ? sanitizeSegment(serverHint) : "";
  const tool = sanitizeSegment(toolName);
  return server ? `${namespace}_${server}_${tool}` : `${namespace}_${tool}`;
}

export function describeMcpTools(
  mcpTools: Record<string, Tool>,
  serverHint?: string
): McpToolDescriptor[] {
  return Object.entries(mcpTools).map(([name, tool]) => ({
    name: namespaceMcpToolName(name, serverHint),
    description: tool.description,
    serverName: serverHint,
  }));
}

export function namespaceMcpTools(
  mcpTools: Record<string, Tool>,
  serverHint?: string,
  namespace = DEFAULT_NAMESPACE
): Record<string, Tool> {
  const namespaced: Record<string, Tool> = {};

  for (const [name, tool] of Object.entries(mcpTools)) {
    namespaced[namespaceMcpToolName(name, serverHint, namespace)] = tool;
  }

  return namespaced;
}

export function mergeChatTools(
  mcpTools: Record<string, Tool>,
  agentTools: Record<string, Tool>,
  options: MergeToolsOptions = {}
): Record<string, Tool> {
  const agentToolsWin = options.agentToolsWin ?? true;

  if (agentToolsWin) {
    return {
      ...namespaceMcpTools(mcpTools, undefined, options.namespace),
      ...agentTools,
    };
  }

  return {
    ...agentTools,
    ...namespaceMcpTools(mcpTools, undefined, options.namespace),
  };
}
