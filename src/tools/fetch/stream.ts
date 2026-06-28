/**
 * fetch/stream.ts
 *
 * Utilities for working with streamed HTTP responses.
 */

import {
  FetchError,
  FetchErrorCode,
  StreamOptions,
} from "./types";

export interface StreamProgress {
  bytesRead: number;
  totalBytes?: number;
}

export interface StreamResult {
  body: Uint8Array;
  bytesRead: number;
}

export interface ReadStreamOptions extends StreamOptions {
  maxBytes?: number;
  signal?: AbortSignal;

  onProgress?(
    progress: StreamProgress
  ): void | Promise<void>;
}

/**
 * Read an entire ReadableStream into memory while
 * enforcing a maximum response size.
 */
export async function readStream(
  stream: ReadableStream<Uint8Array>,
  options: ReadStreamOptions = {}
): Promise<StreamResult> {
  const reader = stream.getReader();

  const chunks: Uint8Array[] = [];

  let total = 0;

  while (true) {
    if (options.signal?.aborted) {
      throw new DOMException(
        "Operation aborted",
        "AbortError"
      );
    }

    const { done, value } =
      await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    total += value.byteLength;

    if (
      options.maxBytes &&
      total > options.maxBytes
    ) {
      reader.cancel();

      throw new FetchError(
        FetchErrorCode.RESPONSE_TOO_LARGE,
        `Response exceeded ${options.maxBytes} bytes`
      );
    }

    chunks.push(value);

    await options.onProgress?.({
      bytesRead: total,
    });

    await options.onChunk?.(value);
  }

  const merged = new Uint8Array(total);

  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return {
    body: merged,
    bytesRead: total,
  };
}

/**
 * Decode a byte array into UTF-8 text.
 */
export function decodeText(
  bytes: Uint8Array,
  encoding = "utf-8"
): string {
  return new TextDecoder(
    encoding
  ).decode(bytes);
}

/**
 * Stream text line-by-line.
 */
export async function* iterateLines(
  stream: ReadableStream<Uint8Array>,
  encoding = "utf-8"
): AsyncGenerator<string> {
  const decoder = new TextDecoder(
    encoding
  );

  const reader = stream.getReader();

  let buffer = "";

  while (true) {
    const { done, value } =
      await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, {
      stream: true,
    });

    const lines =
      buffer.split("\n");

    buffer =
      lines.pop() ?? "";

    for (const line of lines) {
      yield line;
    }
  }

  if (buffer.length) {
    yield buffer;
  }
}

/**
 * Stream fixed-size chunks.
 */
export async function* iterateChunks(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<Uint8Array> {
  const reader = stream.getReader();

  while (true) {
    const { done, value } =
      await reader.read();

    if (done) {
      break;
    }

    if (value) {
      yield value;
    }
  }
}

/**
 * Duplicate a stream into two independent streams.
 */
export function tee(
  stream: ReadableStream<Uint8Array>
): [
  ReadableStream<Uint8Array>,
  ReadableStream<Uint8Array>
] {
  return stream.tee();
}

/**
 * Convert a stream directly into text.
 */
export async function streamToText(
  stream: ReadableStream<Uint8Array>,
  options?: ReadStreamOptions
): Promise<string> {
  const result =
    await readStream(
      stream,
      options
    );

  return decodeText(
    result.body
  );
}

/**
 * Convert a Response into text while respecting limits.
 */
export async function responseToText(
  response: Response,
  options?: ReadStreamOptions
): Promise<string> {
  if (!response.body) {
    return "";
  }

  return streamToText(
    response.body,
    options
  );
}