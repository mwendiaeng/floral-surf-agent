/**
 * Chat export helpers.
 */

import type { UIMessage } from "ai";

function textFromMessage(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("\n\n")
    .trim();
}

export function messageToMarkdown(message: UIMessage): string {
  const role =
    message.role === "user"
      ? "You"
      : message.role === "assistant"
        ? "Assistant"
        : message.role;

  const body = textFromMessage(message);
  if (!body) {
    return "";
  }

  return `### ${role}\n\n${body}`;
}

export function conversationToMarkdown(messages: UIMessage[]): string {
  const sections = messages
    .map(messageToMarkdown)
    .filter((section) => section.length > 0);

  if (sections.length === 0) {
    return "# Chat export\n\n_No messages._\n";
  }

  return `# Chat export\n\n${sections.join("\n\n---\n\n")}\n`;
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = "text/markdown;charset=utf-8"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function exportConversation(messages: UIMessage[]): void {
  const markdown = conversationToMarkdown(messages);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadTextFile(`chat-${timestamp}.md`, markdown);
}

export function exportMessage(message: UIMessage, index: number): void {
  const markdown = messageToMarkdown(message);
  if (!markdown) {
    return;
  }

  downloadTextFile(`message-${index + 1}.md`, markdown);
}
