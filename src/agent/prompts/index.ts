/**
 * agent/prompts/index.ts
 */

export {
  PromptBuilder,
  buildSystemPrompt,
  buildChatSystemPrompt,
} from "./builder";

export type {
  PromptBuilderOptions,
  ChatPromptOptions,
} from "./builder";

export {
  identitySection,
  objectiveSection,
  guidelinesSection,
  toolsSection,
  constraintsSection,
  customSection,
  renderSection,
  renderSections,
} from "./sections";

export type {
  PromptSection,
  ToolCapability,
} from "./sections";

export {
  AGENT_GUIDELINES,
  CHAT_GUIDELINES,
  RESEARCH_GUIDELINES,
  AUTONOMOUS_AGENT_TEMPLATE,
  CHAT_ASSISTANT_TEMPLATE,
  RESEARCH_AGENT_TEMPLATE,
  PROMPT_TEMPLATES,
} from "./templates";

export type {
  PromptTemplate,
  PromptTemplateId,
} from "./templates";
