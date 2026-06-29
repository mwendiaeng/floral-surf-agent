/**
 * MCP integration types.
 */

import type { Tool } from "ai";

export interface McpServerConfig {
  name: string;
  url: string;
}

export interface McpToolDescriptor {
  name: string;
  description?: string;
  serverName?: string;
  serverId?: string;
}

export interface McpToolBundle {
  /** Namespaced tools ready for streamText */
  tools: Record<string, Tool>;
  descriptors: McpToolDescriptor[];
  toolCount: number;
}

export interface MergeToolsOptions {
  /** Prefix MCP tool names to avoid collisions (default: mcp) */
  namespace?: string;
  /** When true, agent tools override MCP tools on name collision */
  agentToolsWin?: boolean;
}
