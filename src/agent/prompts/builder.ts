/**
 * Composable system prompt builder.
 */

import { getSchedulePrompt } from "agents/schedule";

import type { ToolRegistry } from "../tools/registry";

import {
  customSection,
  guidelinesSection,
  identitySection,
  objectiveSection,
  renderSections,
  toolsSection,
  type PromptSection,
  type ToolCapability,
} from "./sections";

import {
  AUTONOMOUS_AGENT_TEMPLATE,
  CHAT_ASSISTANT_TEMPLATE,
  PROMPT_TEMPLATES,
  type PromptTemplate,
  type PromptTemplateId,
} from "./templates";

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

export interface PromptBuilderOptions {
  date?: Date;
  role?: string;
  objective?: string;
  guidelines?: string[];
  constraints?: string[];
  tools?: readonly ToolCapability[];
  extra?: string;
  includeSchedule?: boolean;
  template?: PromptTemplate | PromptTemplateId;
}

export interface ChatPromptOptions extends PromptBuilderOptions {
  /** AI SDK tool map (name → tool with description) */
  aiTools?: Record<string, { description?: string }>;
  /** MCP or other external tools */
  externalTools?: Record<string, { description?: string }>;
  vision?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Builder                                                                    */
/* -------------------------------------------------------------------------- */

export class PromptBuilder {
  private sections: PromptSection[] = [];

  private includeSchedule = true;

  private scheduleDate = new Date();

  static fromTemplate(
    template: PromptTemplate | PromptTemplateId
  ): PromptBuilder {
    const resolved =
      typeof template === "string"
        ? PROMPT_TEMPLATES[template]
        : template;

    const builder = new PromptBuilder();
    builder.sections = [...resolved.sections];
    return builder;
  }

  static fromOptions(
    options: PromptBuilderOptions = {}
  ): PromptBuilder {
    const template =
      options.template ?? AUTONOMOUS_AGENT_TEMPLATE;

    const builder = PromptBuilder.fromTemplate(template);

    if (options.role) {
      builder.withIdentity(options.role);
    }

    if (options.objective) {
      builder.withObjective(options.objective);
    }

    if (options.guidelines) {
      builder.withGuidelines(options.guidelines);
    }

    if (options.constraints) {
      builder.withConstraints(options.constraints);
    }

    if (options.tools) {
      builder.withTools(options.tools);
    }

    if (options.extra) {
      builder.withExtra(options.extra);
    }

    if (options.date) {
      builder.scheduleDate = options.date;
    }

    if (options.includeSchedule === false) {
      builder.includeSchedule = false;
    }

    return builder;
  }

  withIdentity(role: string): this {
    this.upsertSection(identitySection(role));
    return this;
  }

  withObjective(objective: string): this {
    this.upsertSection(objectiveSection(objective));
    return this;
  }

  withGuidelines(guidelines: readonly string[]): this {
    this.upsertSection(guidelinesSection(guidelines));
    return this;
  }

  withConstraints(constraints: readonly string[]): this {
    this.upsertSection({
      id: "constraints",
      title: "Constraints",
      content: constraints.map((line) => `- ${line}`).join("\n"),
      priority: 40,
    });
    return this;
  }

  withTools(tools: readonly ToolCapability[]): this {
    const section = toolsSection(tools);
    if (section) {
      this.upsertSection(section);
    }
    return this;
  }

  withToolsFromRegistry(registry: ToolRegistry): this {
    const capabilities = registry.list().map((definition) => ({
      name: definition.name,
      description: definition.description,
    }));

    return this.withTools(capabilities);
  }

  withAiTools(
    tools: Record<string, { description?: string }>
  ): this {
    const capabilities = Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description ?? "No description provided.",
    }));

    return this.withTools(capabilities);
  }

  withSection(section: PromptSection): this {
    this.upsertSection(section);
    return this;
  }

  withExtra(text: string): this {
    this.upsertSection(customSection("extra", text));
    return this;
  }

  withSchedule(date?: Date): this {
    this.includeSchedule = true;
    if (date) {
      this.scheduleDate = date;
    }
    return this;
  }

  withoutSchedule(): this {
    this.includeSchedule = false;
    return this;
  }

  build(): string {
    const parts = [renderSections(this.sections)];

    if (this.includeSchedule) {
      parts.push(getSchedulePrompt({ date: this.scheduleDate }));
    }

    return parts.filter(Boolean).join("\n\n");
  }

  private upsertSection(section: PromptSection): void {
    const index = this.sections.findIndex(
      (existing) => existing.id === section.id
    );

    if (index >= 0) {
      this.sections[index] = section;
      return;
    }

    this.sections.push(section);
  }
}

/* -------------------------------------------------------------------------- */
/* Convenience                                                                */
/* -------------------------------------------------------------------------- */

export function buildSystemPrompt(
  options: PromptBuilderOptions = {}
): string {
  return PromptBuilder.fromOptions(options).build();
}

export function buildChatSystemPrompt(
  options: ChatPromptOptions = {}
): string {
  const builder = PromptBuilder.fromTemplate(
    options.template ?? CHAT_ASSISTANT_TEMPLATE
  );

  if (options.role) {
    builder.withIdentity(options.role);
  }

  if (options.objective) {
    builder.withObjective(options.objective);
  }

  if (options.guidelines) {
    builder.withGuidelines(options.guidelines);
  }

  if (options.constraints) {
    builder.withConstraints(options.constraints);
  }

  if (options.tools) {
    builder.withTools(options.tools);
  }

  if (options.aiTools) {
    builder.withAiTools(options.aiTools);
  }

  if (options.externalTools) {
    builder.withAiTools(options.externalTools);
  }

  if (options.vision) {
    builder.withExtra(
      "When users share images, describe what you see and answer questions about them."
    );
  }

  if (options.extra) {
    builder.withExtra(options.extra);
  }

  if (options.date) {
    builder.withSchedule(options.date);
  }

  if (options.includeSchedule === false) {
    builder.withoutSchedule();
  }

  return builder.build();
}
