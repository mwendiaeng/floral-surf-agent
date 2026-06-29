/**
 * Composable prompt sections.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface PromptSection {
  id: string;
  title?: string;
  content: string;
  priority?: number;
}

export interface ToolCapability {
  name: string;
  description: string;
}

/* -------------------------------------------------------------------------- */
/* Section builders                                                           */
/* -------------------------------------------------------------------------- */

export function identitySection(role: string): PromptSection {
  return {
    id: "identity",
    content: role.trim(),
    priority: 0,
  };
}

export function objectiveSection(objective: string): PromptSection {
  return {
    id: "objective",
    title: "Objective",
    content: objective.trim(),
    priority: 10,
  };
}

export function guidelinesSection(
  guidelines: readonly string[]
): PromptSection {
  const content = guidelines
    .map((line) => `- ${line.trim()}`)
    .join("\n");

  return {
    id: "guidelines",
    title: "Guidelines",
    content,
    priority: 20,
  };
}

export function toolsSection(
  tools: readonly ToolCapability[]
): PromptSection | null {
  if (tools.length === 0) {
    return null;
  }

  const content = tools
    .map((tool) => `- **${tool.name}**: ${tool.description.trim()}`)
    .join("\n");

  return {
    id: "tools",
    title: "Available tools",
    content,
    priority: 30,
  };
}

export function constraintsSection(
  constraints: readonly string[]
): PromptSection {
  const content = constraints
    .map((line) => `- ${line.trim()}`)
    .join("\n");

  return {
    id: "constraints",
    title: "Constraints",
    content,
    priority: 40,
  };
}

export function customSection(
  id: string,
  content: string,
  title?: string
): PromptSection {
  return {
    id,
    title,
    content: content.trim(),
    priority: 50,
  };
}

export function renderSection(section: PromptSection): string {
  if (section.title) {
    return `${section.title}:\n${section.content}`;
  }

  return section.content;
}

export function renderSections(
  sections: readonly PromptSection[]
): string {
  const sorted = [...sections].sort(
    (left, right) =>
      (left.priority ?? 0) - (right.priority ?? 0)
  );

  return sorted.map(renderSection).join("\n\n");
}
