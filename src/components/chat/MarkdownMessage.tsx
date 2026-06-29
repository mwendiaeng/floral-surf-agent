/**
 * Markdown message rendering with Streamdown controls.
 */

import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";

const STREAMDOWN_CONTROLS = {
  code: {
    copy: true,
    download: true,
  },
  table: {
    copy: true,
    download: true,
    fullscreen: true,
  },
  mermaid: {
    copy: true,
    download: true,
    fullscreen: true,
    panZoom: true,
  },
} as const;

export interface MarkdownMessageProps {
  content: string;
  isAnimating?: boolean;
  variant?: "assistant" | "user";
  className?: string;
}

export function MarkdownMessage({
  content,
  isAnimating = false,
  variant = "assistant",
  className = "",
}: MarkdownMessageProps) {
  const variantClass =
    variant === "user"
      ? "rounded-2xl rounded-br-md bg-kumo-contrast text-kumo-inverse"
      : "rounded-2xl rounded-bl-md bg-kumo-base text-kumo-default";

  return (
    <div className={`max-w-[85%] leading-relaxed ${variantClass} ${className}`}>
      <Streamdown
        className={`sd-theme p-3 ${variant === "user" ? "sd-theme-inverse" : ""}`}
        plugins={{ code }}
        controls={STREAMDOWN_CONTROLS}
        isAnimating={isAnimating}
      >
        {content}
      </Streamdown>
    </div>
  );
}

export { STREAMDOWN_CONTROLS };
