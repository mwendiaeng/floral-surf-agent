/**
 * Programming and code manipulation tools.
 */

import { parse as parseYamlDocument } from "yaml";

import type { ToolHandler } from "./types";

const MAX_CODE_LENGTH = 16_384;
const MAX_TEXT_LENGTH = 64_000;
const RUN_TIMEOUT_MS = 5_000;

const BLOCKED_PATTERNS = [
  /\bimport\s+/,
  /\brequire\s*\(/,
  /\bfetch\s*\(/,
  /\beval\s*\(/,
  /\bFunction\s*\(/,
  /\bWebAssembly\b/,
  /\bDurableObject\b/,
  /\bprocess\b/,
  /\bglobalThis\b/,
];

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  cs: "csharp",
  cpp: "cpp",
  c: "c",
  html: "html",
  css: "css",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  md: "markdown",
  sql: "sql",
  sh: "shell",
  bash: "shell",
};

function assertSafeCode(code: string): void {
  if (code.length > MAX_CODE_LENGTH) {
    throw new Error(`Code exceeds maximum length of ${MAX_CODE_LENGTH} characters.`);
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      throw new Error(
        `Code contains a blocked pattern (${pattern.source}). Sandboxed execution only supports pure computation.`
      );
    }
  }
}

async function runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Execution timed out after ${timeoutMs}ms.`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function detectLanguageFromContent(content: string, filename?: string): string {
  if (filename) {
    const extension = filename.split(".").pop()?.toLowerCase();
    if (extension && LANGUAGE_EXTENSIONS[extension]) {
      return LANGUAGE_EXTENSIONS[extension];
    }
  }

  const trimmed = content.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "json";
  }

  if (/^---\s*\n/.test(trimmed) || /^[\w-]+:\s/m.test(trimmed)) {
    return "yaml";
  }

  if (/^#!\/usr\/bin\/env (node|python|bash|sh)/.test(trimmed)) {
    if (trimmed.includes("python")) return "python";
    if (trimmed.includes("bash") || trimmed.includes("sh")) return "shell";
    return "javascript";
  }

  if (/\b(function|const|let|=>|console\.log)\b/.test(trimmed)) {
    return "javascript";
  }

  if (/\b(def |import |print\()/.test(trimmed)) {
    return "python";
  }

  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b/i.test(trimmed)) {
    return "sql";
  }

  return "plaintext";
}

function formatJson(value: unknown, indent = 2): string {
  return JSON.stringify(value, null, indent);
}

function diffLines(left: string, right: string): string[] {
  const leftLines = left.split("\n");
  const rightLines = right.split("\n");
  const max = Math.max(leftLines.length, rightLines.length);
  const changes: string[] = [];

  for (let index = 0; index < max; index += 1) {
    const a = leftLines[index];
    const b = rightLines[index];

    if (a === b) {
      changes.push(`  ${a ?? ""}`);
      continue;
    }

    if (a !== undefined) {
      changes.push(`- ${a}`);
    }

    if (b !== undefined) {
      changes.push(`+ ${b}`);
    }
  }

  return changes;
}

/* -------------------------------------------------------------------------- */
/* Tool handlers                                                              */
/* -------------------------------------------------------------------------- */

export function runJavaScriptTool(): ToolHandler<
  { code: string },
  { result: unknown; type: string }
> {
  return {
    definition: {
      name: "runJavaScript",
      description:
        "Execute a short JavaScript snippet in a sandbox and return the result. Use for calculations, data transforms, and algorithm checks.",
      schema: {
        name: "runJavaScript",
        description: "Run JavaScript code in a sandbox.",
        parameters: [
          {
            name: "code",
            type: "string",
            description:
              "JavaScript expression or statements. The last expression value is returned when using return.",
            required: true,
          },
        ],
      },
    },
    async execute(input) {
      assertSafeCode(input.code);

      const wrapped = input.code.includes("return")
        ? input.code
        : `return (${input.code});`;

      const AsyncFunctionConstructor = Object.getPrototypeOf(
        async function () {}
      ).constructor as new (
        ...args: string[]
      ) => (...args: unknown[]) => Promise<unknown>;

      const runner = new AsyncFunctionConstructor(
        `"use strict"; return (async () => { ${wrapped} })();`
      );

      const result = await runWithTimeout(runner(), RUN_TIMEOUT_MS);
      const type = result === null ? "null" : typeof result;

      return {
        success: true,
        output: { result, type },
      };
    },
  };
}

export function parseJsonTool(): ToolHandler<
  { text: string; pretty?: boolean },
  { value: unknown; formatted?: string }
> {
  return {
    definition: {
      name: "parseJson",
      description: "Parse JSON text and optionally pretty-print it.",
      schema: {
        name: "parseJson",
        description: "Parse JSON.",
        parameters: [
          {
            name: "text",
            type: "string",
            description: "JSON string to parse.",
            required: true,
          },
          {
            name: "pretty",
            type: "boolean",
            description: "Return a formatted JSON string.",
            required: false,
          },
        ],
      },
    },
    async execute(input) {
      if (input.text.length > MAX_TEXT_LENGTH) {
        throw new Error("Input text is too large.");
      }

      const value = JSON.parse(input.text);

      return {
        success: true,
        output: {
          value,
          formatted: input.pretty ? formatJson(value) : undefined,
        },
      };
    },
  };
}

export function parseYamlTool(): ToolHandler<
  { text: string },
  { value: unknown }
> {
  return {
    definition: {
      name: "parseYaml",
      description: "Parse YAML text into JSON-compatible data.",
      schema: {
        name: "parseYaml",
        description: "Parse YAML.",
        parameters: [
          {
            name: "text",
            type: "string",
            description: "YAML string to parse.",
            required: true,
          },
        ],
      },
    },
    async execute(input) {
      if (input.text.length > MAX_TEXT_LENGTH) {
        throw new Error("Input text is too large.");
      }

      const value = parseYamlDocument(input.text);

      return {
        success: true,
        output: { value },
      };
    },
  };
}

export function testRegexTool(): ToolHandler<
  { pattern: string; flags?: string; text: string },
  { matches: string[]; matchCount: number; matched: boolean }
> {
  return {
    definition: {
      name: "testRegex",
      description:
        "Test a regular expression against text and return all matches.",
      schema: {
        name: "testRegex",
        description: "Test regex pattern.",
        parameters: [
          {
            name: "pattern",
            type: "string",
            description: "Regular expression pattern.",
            required: true,
          },
          {
            name: "flags",
            type: "string",
            description: "Optional regex flags, e.g. gi.",
            required: false,
          },
          {
            name: "text",
            type: "string",
            description: "Text to test against.",
            required: true,
          },
        ],
      },
    },
    async execute(input) {
      if (input.text.length > MAX_TEXT_LENGTH) {
        throw new Error("Input text is too large.");
      }

      const regex = new RegExp(input.pattern, input.flags);
      const matches = [...input.text.matchAll(regex)].map((match) => match[0]);

      return {
        success: true,
        output: {
          matches,
          matchCount: matches.length,
          matched: matches.length > 0,
        },
      };
    },
  };
}

export function encodeBase64Tool(): ToolHandler<
  { text: string },
  { encoded: string }
> {
  return {
    definition: {
      name: "encodeBase64",
      description: "Encode UTF-8 text to Base64.",
      schema: {
        name: "encodeBase64",
        description: "Base64 encode.",
        parameters: [
          {
            name: "text",
            type: "string",
            description: "Text to encode.",
            required: true,
          },
        ],
      },
    },
    async execute(input) {
      const bytes = new TextEncoder().encode(input.text);
      let binary = "";
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      const encoded = btoa(binary);

      return {
        success: true,
        output: { encoded },
      };
    },
  };
}

export function decodeBase64Tool(): ToolHandler<
  { encoded: string },
  { text: string }
> {
  return {
    definition: {
      name: "decodeBase64",
      description: "Decode Base64 text to UTF-8.",
      schema: {
        name: "decodeBase64",
        description: "Base64 decode.",
        parameters: [
          {
            name: "encoded",
            type: "string",
            description: "Base64 string to decode.",
            required: true,
          },
        ],
      },
    },
    async execute(input) {
      const binary = atob(input.encoded.trim());
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const text = new TextDecoder().decode(bytes);

      return {
        success: true,
        output: { text },
      };
    },
  };
}

export function detectLanguageTool(): ToolHandler<
  { content: string; filename?: string },
  { language: string }
> {
  return {
    definition: {
      name: "detectLanguage",
      description:
        "Detect the programming or markup language of a code snippet or filename.",
      schema: {
        name: "detectLanguage",
        description: "Detect language.",
        parameters: [
          {
            name: "content",
            type: "string",
            description: "Code or text content.",
            required: true,
          },
          {
            name: "filename",
            type: "string",
            description: "Optional filename hint, e.g. app.tsx.",
            required: false,
          },
        ],
      },
    },
    async execute(input) {
      return {
        success: true,
        output: {
          language: detectLanguageFromContent(input.content, input.filename),
        },
      };
    },
  };
}

export function diffTextTool(): ToolHandler<
  { before: string; after: string },
  { diff: string; changedLines: number }
> {
  return {
    definition: {
      name: "diffText",
      description:
        "Produce a unified line diff between two text or code strings.",
      schema: {
        name: "diffText",
        description: "Diff two strings.",
        parameters: [
          {
            name: "before",
            type: "string",
            description: "Original text.",
            required: true,
          },
          {
            name: "after",
            type: "string",
            description: "Updated text.",
            required: true,
          },
        ],
      },
    },
    async execute(input) {
      const lines = diffLines(input.before, input.after);
      const changedLines = lines.filter(
        (line) => line.startsWith("+") || line.startsWith("-")
      ).length;

      return {
        success: true,
        output: {
          diff: lines.join("\n"),
          changedLines,
        },
      };
    },
  };
}

export function formatJsonTool(): ToolHandler<
  { text: string; indent?: number },
  { formatted: string }
> {
  return {
    definition: {
      name: "formatJson",
      description: "Pretty-print JSON text with consistent indentation.",
      schema: {
        name: "formatJson",
        description: "Format JSON.",
        parameters: [
          {
            name: "text",
            type: "string",
            description: "JSON string to format.",
            required: true,
          },
          {
            name: "indent",
            type: "number",
            description: "Indent spaces (default 2).",
            required: false,
          },
        ],
      },
    },
    async execute(input) {
      const parsed = JSON.parse(input.text);
      const formatted = formatJson(parsed, input.indent ?? 2);

      return {
        success: true,
        output: { formatted },
      };
    },
  };
}

export const codingTools = [
  runJavaScriptTool(),
  parseJsonTool(),
  formatJsonTool(),
  parseYamlTool(),
  testRegexTool(),
  encodeBase64Tool(),
  decodeBase64Tool(),
  detectLanguageTool(),
  diffTextTool(),
] as const;

export function registerCodingTools(
  register: (handler: ToolHandler) => void
): void {
  for (const handler of codingTools) {
    register(handler);
  }
}
