// import { chunk } from 'lodash';
/**
 * html/chunker.ts
 *
 * Production document chunking.
 *
 * Supports:
 *
 *  - Fixed chunks
 *  - Paragraph chunks
 *  - Sentence chunks
 *  - Heading chunks
 *  - Semantic chunks
 *  - Token chunks
 *  - Recursive chunks
 *  - Sliding windows
 */

import { estimateTokens } from "./utils/tokens.ts";

import { normalizeWhitespace } from "./utils/strings";
import { sha256 } from "./utils.ts";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ChunkStrategy =
  | "fixed"
  | "paragraph"
  | "sentence"
  | "heading"
  | "semantic"
  | "token"
  | "recursive"
  | "sliding"
  | "hybrid";

export interface ChunkOptions {
  strategy?: ChunkStrategy;

  chunkSize?: number;

  overlap?: number;

  maxTokens?: number;

  preserveParagraphs?: boolean;

  preserveHeadings?: boolean;
}

export interface DocumentChunk {
  id: string;

  index: number;

  text: string;

  heading?: string;

  level?: number;

  tokens: number;

  characters: number;

  startOffset: number;

  endOffset: number;

  metadata: Record<string, unknown>;

  fingerprint?: string;
}

/* -------------------------------------------------------------------------- */
/* Base Chunker                                                               */
/* -------------------------------------------------------------------------- */

abstract class BaseChunker {
  constructor(protected readonly options: Required<ChunkOptions>) {}

  abstract chunk(document: string): DocumentChunk[];

  protected createChunk(
    text: string,

    index: number,

    start: number,

    end: number,

    metadata: Partial<Record<string, unknown>> = {}
  ): DocumentChunk {
    return {
      id: createChunkId(index),

      index,

      text,

      heading:
        typeof metadata.heading === "string" ? metadata.heading : undefined,

      level: typeof metadata.level === "number" ? metadata.level : undefined,

      tokens: estimateTokens(text),

      characters: text.length,

      startOffset: start,

      endOffset: end,

      metadata,

      fingerprint: sha256(normalizeWhitespace(text))
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

export function chunkDocument(
  document: string,

  options: ChunkOptions = {}
): DocumentChunk[] {
  const config: Required<ChunkOptions> = {
    strategy: options.strategy ?? "recursive",

    chunkSize: options.chunkSize ?? 1200,

    overlap: options.overlap ?? 150,

    maxTokens: options.maxTokens ?? 350,

    preserveParagraphs: options.preserveParagraphs ?? true,

    preserveHeadings: options.preserveHeadings ?? true
  };

  const implementation = (() => {
    switch (config.strategy) {
      case "fixed":
        return new FixedChunker(config);

      case "paragraph":
        return new ParagraphChunker(config);

      case "sentence":
        return new SentenceChunker(config);

      case "heading":
        return new HeadingChunker(config);

      case "semantic":
        return new SemanticChunker(config);

      case "token":
        return new TokenChunker(config);

      case "sliding":
        return new SlidingWindowChunker(config);

      case "recursive":

      default:
        return new RecursiveChunker(config);
    }
  })();

  return implementation.chunk(normalizeWhitespace(document));
}

/* -------------------------------------------------------------------------- */
/* Fixed Chunker                                                              */
/* -------------------------------------------------------------------------- */

class FixedChunker extends BaseChunker {
  chunk(document: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    const size = this.options.chunkSize;

    const overlap = Math.max(
      0,

      this.options.overlap
    );

    let start = 0;

    let index = 0;

    while (start < document.length) {
      const end = Math.min(
        start + size,

        document.length
      );

      const text = document.slice(
        start,

        end
      );

      chunks.push(
        this.createChunk(
          text,

          index++,

          start,

          end,

          {
            strategy: "fixed"
          }
        )
      );

      if (end >= document.length) {
        break;
      }

      start = Math.max(
        start + size - overlap,

        start + 1
      );
    }

    return chunks;
  }
}

/* -------------------------------------------------------------------------- */
/* Paragraph Chunker                                                          */
/* -------------------------------------------------------------------------- */

class ParagraphChunker extends BaseChunker {
  chunk(document: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    const paragraphs = document

      .split(/\n\s*\n/)

      .map((p) => p.trim())

      .filter(Boolean);

    let index = 0;

    let offset = 0;

    let buffer = "";

    let bufferStart = 0;

    for (const paragraph of paragraphs) {
      const candidate = buffer ? buffer + "\n\n" + paragraph : paragraph;

      if (candidate.length > this.options.chunkSize && buffer.length > 0) {
        chunks.push(
          this.createChunk(
            buffer,

            index++,

            bufferStart,

            bufferStart + buffer.length,

            {
              strategy: this.options.strategy
            }
          )
        );

        buffer = paragraph;

        bufferStart = offset;
      } else {
        if (buffer.length === 0) {
          bufferStart = offset;
        }

        buffer = candidate;
      }

      offset += paragraph.length + 2;
    }

    if (buffer.length) {
      chunks.push(
        this.createChunk(
          buffer,

          index,

          bufferStart,

          bufferStart + buffer.length,

          {
            strategy: "paragraph"
          }
        )
      );
    }

    return chunks;
  }
}

/* -------------------------------------------------------------------------- */
/* Sentence Chunker                                                           */
/* -------------------------------------------------------------------------- */

class SentenceChunker extends BaseChunker {
  chunk(document: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    const sentences = document

      .split(/(?<=[.!?])\s+/)

      .map((s) => s.trim())

      .filter(Boolean);

    let index = 0;

    let offset = 0;

    let buffer = "";

    let bufferStart = 0;
    let searchStart = 0;

    for (const sentence of sentences) {
      const candidate = buffer ? buffer + " " + sentence : sentence;

      if (candidate.length > this.options.chunkSize && buffer.length > 0) {
        chunks.push(
          this.createChunk(
            buffer,

            index++,

            bufferStart,

            bufferStart + buffer.length,

            {
              strategy: "sentence"
            }
          )
        );

        buffer = sentence;

        bufferStart = offset;
      } else {
        if (buffer.length === 0) {
          bufferStart = offset;
        }

        buffer = candidate;
      }

      const sentenceOffset = document.indexOf(
        sentence,

        searchStart
      );

      searchStart = sentenceOffset + sentence.length;
    }

    if (buffer.length) {
      chunks.push(
        this.createChunk(
          buffer,

          index,

          bufferStart,

          bufferStart + buffer.length,

          {
            strategy: "sentence"
          }
        )
      );
    }

    return chunks;
  }
}
/* -------------------------------------------------------------------------- */
/* Heading Chunker                                                            */
/* -------------------------------------------------------------------------- */

class HeadingChunker extends BaseChunker {
  chunk(document: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    const lines = document.split("\n");

    let currentHeading: string | undefined;

    let currentLevel = 0;

    let buffer: string[] = [];

    let startOffset = 0;

    let currentOffset = 0;

    let index = 0;

    const flush = () => {
      if (buffer.length === 0) {
        return;
      }

      const text = buffer.join("\n").trim();

      if (!text) {
        buffer = [];

        return;
      }

      chunks.push(
        this.createChunk(
          text,

          index++,

          startOffset,

          startOffset + text.length,

          {
            strategy: "heading",

            heading: currentHeading,

            level: currentLevel
          }
        )
      );

      buffer = [];
    };

    for (const line of lines) {
      const match = /^#{1,6}\s+/.exec(line) || /^[=-]{3,}$/.exec(line);

      if (match) {
        flush();

        currentHeading = match[2].trim();

        currentLevel = match[1].length;

        startOffset = currentOffset;
      }

      buffer.push(line);

      currentOffset += line.length + 1;
    }

    flush();

    return chunks;
  }
}

/* -------------------------------------------------------------------------- */
/* Semantic Chunker                                                           */
/* -------------------------------------------------------------------------- */

class SemanticChunker extends BaseChunker {
  chunk(document: string): DocumentChunk[] {
    const headingChunks = new HeadingChunker(this.options).chunk(document);

    const chunks: DocumentChunk[] = [];

    let index = 0;

    for (const section of headingChunks) {
      if (section.characters <= this.options.chunkSize) {
        // section.index = index++;
        chunks.push({
          ...section,

          index: index++
        });

        chunks.push(section);

        continue;
      }

      const paragraphs = new ParagraphChunker(this.options).chunk(section.text);

      for (const paragraph of paragraphs) {
        paragraph.index = index++;

        paragraph.metadata = {
          ...paragraph.metadata,

          parentHeading: section.metadata.heading,

          headingLevel: section.metadata.level,

          strategy: "semantic"
        };

        chunks.push(paragraph);
      }
    }

    return chunks;
  }
}

/* -------------------------------------------------------------------------- */
/* Recursive Chunker                                                          */
/* -------------------------------------------------------------------------- */

class RecursiveChunker extends BaseChunker {
  chunk(document: string): DocumentChunk[] {
    /*
     * Stage 1:
     * Split by headings.
     */

    const headingChunks = new HeadingChunker(this.options).chunk(document);

    const output: DocumentChunk[] = [];

    let index = 0;

    for (const section of headingChunks) {
      /*
       * Small enough.
       */

      if (section.characters <= this.options.chunkSize) {
        section.index = index++;

        output.push(section);

        continue;
      }

      /*
       * Stage 2:
       * Split by paragraphs.
       */

      const paragraphs = new ParagraphChunker(this.options).chunk(section.text);

      for (const paragraph of paragraphs) {
        if (paragraph.characters <= this.options.chunkSize) {
          paragraph.index = index++;

          paragraph.metadata = {
            ...paragraph.metadata,

            parentHeading: section.metadata.heading
          };

          output.push(paragraph);

          continue;
        }

        /*
         * Stage 3:
         * Split by sentences.
         */

        const sentences = new SentenceChunker(this.options).chunk(
          paragraph.text
        );

        for (const sentence of sentences) {
          sentence.index = index++;

          sentence.metadata = {
            ...sentence.metadata,

            parentHeading: section.metadata.heading
          };

          output.push(sentence);
        }
      }
    }

    return output;
  }
}
/* -------------------------------------------------------------------------- */
/* Sliding Window Chunker                                                     */
/* -------------------------------------------------------------------------- */

class SlidingWindowChunker extends BaseChunker {
  chunk(document: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    const size = this.options.chunkSize;

    const overlap = Math.min(
      this.options.overlap,

      Math.floor(size / 2)
    );

    let index = 0;

    let start = 0;

    while (start < document.length) {
      const end = Math.min(
        start + size,

        document.length
      );

      chunks.push(
        this.createChunk(
          document.slice(
            start,

            end
          ),

          index++,

          start,

          end,

          {
            strategy: "sliding",

            overlap
          }
        )
      );

      if (end >= document.length) {
        break;
      }

      start += size - overlap;
    }

    return chunks;
  }
}

/* -------------------------------------------------------------------------- */
/* Token Chunker                                                              */
/* -------------------------------------------------------------------------- */

class TokenChunker extends BaseChunker {
  chunk(document: string): DocumentChunk[] {
    const words = document

      .split(/\s+/)

      .filter(Boolean);

    const chunks: DocumentChunk[] = [];

    const maxTokens = this.options.maxTokens;

    let buffer: string[] = [];

    let startOffset = 0;

    let offset = 0;

    let index = 0;

    for (const word of words) {
      const estimated = estimateTokens(
        [...buffer, word]

          .join(" ")
      );

      if (estimated > maxTokens && buffer.length) {
        const text = buffer.join(" ");

        chunks.push(
          this.createChunk(
            text,

            index++,

            startOffset,

            startOffset + text.length,

            {
              strategy: "token",

              estimatedTokens: estimateTokens(text)
            }
          )
        );

        buffer = [word];

        startOffset = offset;
      } else {
        if (buffer.length === 0) {
          startOffset = offset;
        }

        buffer.push(word);
      }

      offset += word.length + 1;
    }

    if (buffer.length) {
      const text = buffer.join(" ");

      chunks.push(
        this.createChunk(
          text,

          index,

          startOffset,

          startOffset + text.length,

          {
            strategy: "token",

            estimatedTokens: estimateTokens(text)
          }
        )
      );
    }

    return chunks;
  }
}

/* -------------------------------------------------------------------------- */
/* Hybrid Chunker                                                             */
/* -------------------------------------------------------------------------- */

class HybridChunker extends BaseChunker {
  chunk(document: string): DocumentChunk[] {
    /*
     * First preserve document semantics.
     */

    const semanticChunks = new SemanticChunker(this.options).chunk(document);

    const output: DocumentChunk[] = [];

    let index = 0;

    for (const chunk of semanticChunks) {
      /*
       * Already within limits.
       */

      if (chunk.tokens <= this.options.maxTokens) {
        chunk.index = index++;

        output.push(chunk);

        continue;
      }

      /*
       * Split oversized semantic chunks
       * using token-aware chunking.
       */

      const smaller = new TokenChunker(this.options).chunk(chunk.text);

      for (const child of smaller) {
        child.index = index++;

        child.metadata = {
          ...chunk.metadata,

          ...child.metadata,

          strategy: "hybrid",

          parentChunk: chunk.id
        };

        output.push(child);
      }
    }

    return output;
  }
}
/* -------------------------------------------------------------------------- */
/* Chunk Utilities                                                            */
/* -------------------------------------------------------------------------- */

export function mergeSmallChunks(
  chunks: DocumentChunk[],

  minimumSize = 200
): DocumentChunk[] {
  if (chunks.length <= 1) {
    return chunks;
  }

  const merged: DocumentChunk[] = [];

  let current = { ...chunks[0] };

  for (let i = 1; i < chunks.length; i++) {
    const next = chunks[i];

    if (current.characters < minimumSize) {
      // current.text += "\n\n" + next.text;

      // current.characters =

      //     current.text.length;

      // current.tokens =

      //     estimateTokens(

      //         current.text

      //     );

      // current.endOffset =

      //     next.endOffset;

      // current.metadata = {

      //     ...current.metadata,

      //     merged: true,

      //     mergedWith:

      //         next.id,

      // };
      current = {
        ...current,

        text: current.text + "\n\n" + next.text,

        endOffset: next.endOffset,

        characters: current.text.length + 2 + next.text.length,

        tokens: estimateTokens(current.text + "\n\n" + next.text),

        metadata: {
          ...current.metadata,

          merged: true
        }
      };

      continue;
    }

    merged.push(current);

    current = {
      ...next
    };
  }

  merged.push(current);

  return renumberChunks(merged);
}

/* -------------------------------------------------------------------------- */
/* Split Oversized Chunks                                                     */
/* -------------------------------------------------------------------------- */

export function splitOversizedChunks(
  chunks: DocumentChunk[],

  options: ChunkOptions
): DocumentChunk[] {
  const output: DocumentChunk[] = [];

  const splitter = new FixedChunker({
    strategy: "fixed",

    chunkSize: options.chunkSize ?? 1200,

    overlap: options.overlap ?? 150,

    maxTokens: options.maxTokens ?? 350,

    preserveParagraphs: true,

    preserveHeadings: true
  });

  for (const chunk of chunks) {
    if (chunk.characters <= (options.chunkSize ?? 1200)) {
      output.push(chunk);

      continue;
    }

    const pieces = splitter.chunk(chunk.text);

    for (const piece of pieces) {
      piece.metadata = {
        ...chunk.metadata,

        ...piece.metadata,

        parentChunk: chunk.id,

        split: true
      };

      output.push(piece);
    }
  }

  return renumberChunks(output);
}

/* -------------------------------------------------------------------------- */
/* Renumber                                                                   */
/* -------------------------------------------------------------------------- */

export function renumberChunks(chunks: DocumentChunk[]): DocumentChunk[] {
  return chunks.map(
    (
      chunk,

      index
    ) => ({
      ...chunk,

      id: createChunkId(index),

      index
    })
  );
}

/* -------------------------------------------------------------------------- */
/* Sorting                                                                    */
/* -------------------------------------------------------------------------- */

export function sortChunks(chunks: DocumentChunk[]): DocumentChunk[] {
  return [...chunks].sort(
    (
      a,

      b
    ) => a.startOffset - b.startOffset
  );
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

export function validateChunks(chunks: DocumentChunk[]): boolean {
  if (chunks.length === 0) {
    return false;
  }

  for (const chunk of chunks) {
    if (!chunk.text.trim()) {
      return false;
    }

    if (chunk.startOffset > chunk.endOffset) {
      return false;
    }

    if (chunk.tokens <= 0) {
      return false;
    }
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/* Chunk IDs                                                                  */
/* -------------------------------------------------------------------------- */

export function createChunkId(index: number): string {
  const chunk_id = `chunk-${sha256(index.toString()).substring(0, 16)}`;
  return chunk_id;
}

/* -------------------------------------------------------------------------- */
/* Public Factory                                                             */
/* -------------------------------------------------------------------------- */

export function createChunker(options: ChunkOptions = {}): {
  chunk(document: string): DocumentChunk[];
} {
  const config: Required<ChunkOptions> = {
    strategy: options.strategy ?? "recursive",

    chunkSize: options.chunkSize ?? 1200,

    overlap: options.overlap ?? 150,

    maxTokens: options.maxTokens ?? 350,

    preserveParagraphs: options.preserveParagraphs ?? true,

    preserveHeadings: options.preserveHeadings ?? true
  };

  const implementation = (() => {
    switch (config.strategy) {
      case "fixed":
        return new FixedChunker(config);

      case "paragraph":
        return new ParagraphChunker(config);

      case "sentence":
        return new SentenceChunker(config);

      case "heading":
        return new HeadingChunker(config);

      case "semantic":
        return new SemanticChunker(config);

      case "token":
        return new TokenChunker(config);

      case "sliding":
        return new SlidingWindowChunker(config);

      case "recursive":
        return new RecursiveChunker(config);

      case "hybrid":
        return new HybridChunker(config);

      default:
        return new RecursiveChunker(config);
    }
  })();

  return {
    chunk(document: string) {
      return implementation.chunk(document);
    }
  };
}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {
  chunkDocument,

  createChunker,

  mergeSmallChunks,

  splitOversizedChunks,

  validateChunks,

  renumberChunks,

  sortChunks
};
