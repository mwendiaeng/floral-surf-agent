/**
 * MCP integration for the agent.
 */

export {
  buildMcpToolBundle,
  integrateMcpTools,
  mcpToolsForPrompt,
} from "./integration";

export {
  describeMcpTools,
  mergeChatTools,
  namespaceMcpToolName,
  namespaceMcpTools,
} from "./merge";

export type {
  MergeToolsOptions,
  McpServerConfig,
  McpToolBundle,
  McpToolDescriptor,
} from "./types";
