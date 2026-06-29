/**
 * Per-message action buttons (copy / download).
 */

import { Button, Text } from "@cloudflare/kumo";
import { CopyIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import type { UIMessage } from "ai";
import { useCallback, useState } from "react";

import {
  copyText,
  exportMessage,
  messageToMarkdown,
} from "../../lib/chat-export";

export interface MessageActionsProps {
  message: UIMessage;
  index: number;
}

export function MessageActions({ message, index }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const markdown = messageToMarkdown(message);

  const handleCopy = useCallback(async () => {
    if (!markdown) {
      return;
    }

    const success = await copyText(markdown);
    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }, [markdown]);

  const handleDownload = useCallback(() => {
    exportMessage(message, index);
  }, [message, index]);

  if (!markdown) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="sm"
        shape="square"
        aria-label="Copy message"
        icon={<CopyIcon size={14} />}
        onClick={handleCopy}
      />
      <Button
        variant="ghost"
        size="sm"
        shape="square"
        aria-label="Download message"
        icon={<DownloadSimpleIcon size={14} />}
        onClick={handleDownload}
      />
      {copied && (
        <Text size="xs" variant="secondary">
          Copied
        </Text>
      )}
    </div>
  );
}
