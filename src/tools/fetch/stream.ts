/**
 * fetch/stream.ts
 *
 * Streaming utilities for Fetch responses.
 *
 * Supports:
 *
 * • Progress reporting
 * • Async iteration
 * • Size limits
 * • Cancellation
 * • Streaming transforms
 */

import type { DownloadProgress, StreamOptions } from "./types";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface StreamResult {
  bytesRead: number;

  chunks: number;

  duration: number;
}

export interface StreamChunk {
  index: number;

  bytes: Uint8Array;

  received: number;

  total?: number;
}

export interface StreamCallbacks {
  onChunk?(chunk: StreamChunk): Promise<void> | void;

  onProgress?(progress: DownloadProgress): Promise<void> | void;

  onComplete?(result: StreamResult): Promise<void> | void;
}

/* -------------------------------------------------------------------------- */
/* Stream Reader                                                              */
/* -------------------------------------------------------------------------- */

export class FetchStreamReader {
  constructor(readonly options: StreamOptions = {}) {}

  /* -------------------------------------------------------------------------- */
  /* Stream Reading                                                             */
  /* -------------------------------------------------------------------------- */

  async readStream(
    response: Response,

    callbacks: StreamCallbacks = {}
  ): Promise<StreamResult> {
    if (!response.body) {
      throw new Error("Response has no readable body.");
    }

    const reader = response.body.getReader();

    const total =
      Number(response.headers.get("content-length") ?? 0) || undefined;

    const startedAt = performance.now();

    let bytesRead = 0;

    let chunks = 0;

    while (true) {
      const {
        done,

        value
      } = await reader.read();

      if (done) {
        break;
      }

      chunks++;

      bytesRead += value.byteLength;

      /*
       * Maximum download size.
       */

      if (
        this.options.maxBytes !== undefined &&
        bytesRead > this.options.maxBytes
      ) {
        await reader.cancel();

        throw new Error(
          `Maximum download size exceeded (${this.options.maxBytes} bytes).`
        );
      }

      /*
       * Chunk callback.
       */

      if (callbacks.onChunk) {
        await callbacks.onChunk({
          index: chunks - 1,

          bytes: value,

          received: bytesRead,

          total
        });
      }

      /*
       * Progress callback.
       */

      if (callbacks.onProgress) {
        const progress: DownloadProgress = {
          receivedBytes: bytesRead,

          totalBytes: total,

          percentage: total ? (bytesRead / total) * 100 : undefined,

          chunks,

          elapsed: performance.now() - startedAt,

          bytesPerSecond:
            bytesRead /
            Math.max(
              1,

              (performance.now() - startedAt) / 1000
            )
        };

        await callbacks.onProgress(progress);
      }
    }

    const result: StreamResult = {
      bytesRead,

      chunks,

      duration: performance.now() - startedAt
    };

    if (callbacks.onComplete) {
      await callbacks.onComplete(result);
    }

    return result;
  }
}
/* -------------------------------------------------------------------------- */
/* Read All Chunks                                                            */
/* -------------------------------------------------------------------------- */

export async function readAllChunks(
  response: Response,

  options: StreamOptions = {}
): Promise<Uint8Array[]> {
  const chunks: Uint8Array[] = [];

  const reader = new FetchStreamReader(options);

  await reader.readStream(
    response,

    {
      onChunk(chunk) {
        chunks.push(chunk.bytes);
      }
    }
  );

  return chunks;
}

/* -------------------------------------------------------------------------- */
/* Read As Uint8Array                                                         */
/* -------------------------------------------------------------------------- */

export async function readBytes(
  response: Response,

  options: StreamOptions = {}
): Promise<Uint8Array> {
  const chunks = await readAllChunks(
    response,

    options
  );

  const total = chunks.reduce(
    (
      sum,

      chunk
    ) => sum + chunk.length,

    0
  );

  const output = new Uint8Array(total);

  let offset = 0;

  for (const chunk of chunks) {
    output.set(
      chunk,

      offset
    );

    offset += chunk.length;
  }

  return output;

  // }
}

/* -------------------------------------------------------------------------- */
/* Default Instance                                                           */
/* -------------------------------------------------------------------------- */

export const streamReader = new FetchStreamReader();

/* -------------------------------------------------------------------------- */
/* Async Chunk Iterator                                                       */
/* -------------------------------------------------------------------------- */

export async function* streamChunks(
  response: Response,

  options: StreamOptions = {}
): AsyncGenerator<StreamChunk, void, void> {
  if (!response.body) {
    throw new Error("Response has no readable body.");
  }

  const reader = response.body.getReader();

  const total =
    Number(response.headers.get("content-length") ?? 0) || undefined;

  let received = 0;

  let index = 0;

  while (true) {
    const {
      done,

      value
    } = await reader.read();

    if (done) {
      break;
    }

    received += value.byteLength;

    if (options.maxBytes !== undefined && received > options.maxBytes) {
      await reader.cancel();

      throw new Error(
        `Maximum download size exceeded (${options.maxBytes} bytes).`
      );
    }

    yield {
      index,

      bytes: value,

      received,

      total
    };

    index++;
  }
}

/* -------------------------------------------------------------------------- */
/* Stream Text                                                                */
/* -------------------------------------------------------------------------- */

export async function* streamText(
  response: Response,

  options: StreamOptions = {},

  encoding = "utf-8"
): AsyncGenerator<string, void, void> {
  const decoder = new TextDecoder(encoding);

  for await (const chunk of streamChunks(
    response,

    options
  )) {
    yield decoder.decode(
      chunk.bytes,

      {
        stream: true
      }
    );
  }

  const remainder = decoder.decode();

  if (remainder) {
    yield remainder;
  }
}

/* -------------------------------------------------------------------------- */
/* Stream Lines                                                               */
/* -------------------------------------------------------------------------- */

export async function* streamLines(
  response: Response,

  options: StreamOptions = {},

  encoding = "utf-8"
): AsyncGenerator<string, void, void> {
  let buffer = "";

  for await (const text of streamText(
    response,

    options,

    encoding
  )) {
    buffer += text;

    const lines = buffer.split(/\r?\n/);

    buffer = lines.pop() ?? "";

    for (const line of lines) {
      yield line;
    }
  }

  if (buffer.length > 0) {
    yield buffer;
  }
}

/* -------------------------------------------------------------------------- */
/* Stream ArrayBuffer                                                         */
/* -------------------------------------------------------------------------- */

export async function streamArrayBuffer(
  response: Response,

  options: StreamOptions = {}
): Promise<ArrayBuffer> {
  const bytes = await readBytes(
    response,

    options
  );

  return bytes.buffer.slice(
    bytes.byteOffset,

    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

/* -------------------------------------------------------------------------- */
/* Stream JSON                                                                */
/* -------------------------------------------------------------------------- */

export async function streamJson<T = unknown>(
  response: Response,

  options: StreamOptions = {}
): Promise<T> {
  let text = "";

  for await (const chunk of streamText(
    response,

    options
  )) {
    text += chunk;
  }

  return JSON.parse(text) as T;
}

/* -------------------------------------------------------------------------- */
/* Tee                                                                        */
/* -------------------------------------------------------------------------- */

export function tee(response: Response): [Response, Response] {
  if (!response.body) {
    throw new Error("Response has no readable body.");
  }

  const [
    left,

    right
  ] = response.body.tee();

  return [
    new Response(
      left,

      {
        headers: response.headers,

        status: response.status,

        statusText: response.statusText
      }
    ),

    new Response(
      right,

      {
        headers: response.headers,

        status: response.status,

        statusText: response.statusText
      }
    )
  ];
}

/* -------------------------------------------------------------------------- */
/* Clone                                                                      */
/* -------------------------------------------------------------------------- */

export function cloneResponse(response: Response): Response {
  return response.clone();
}

/* -------------------------------------------------------------------------- */
/* Pipe                                                                       */
/* -------------------------------------------------------------------------- */

export async function pipeStream(
  source: ReadableStream<Uint8Array>,

  destination: WritableStream<Uint8Array>
): Promise<void> {
  await source.pipeTo(destination);
}

/* -------------------------------------------------------------------------- */
/* Transform                                                                  */
/* -------------------------------------------------------------------------- */

export async function transformStream(
  response: Response,

  transformer: (chunk: Uint8Array) => Uint8Array | Promise<Uint8Array>
): Promise<Response> {
  if (!response.body) {
    throw new Error("Response has no body.");
  }

  const stream = new TransformStream<Uint8Array, Uint8Array>({
    async transform(
      chunk,

      controller
    ) {
      controller.enqueue(await transformer(chunk));
    }
  });

  response.body

    .pipeTo(stream.writable)

    .catch(() => {});

  return new Response(
    stream.readable,

    {
      headers: response.headers,

      status: response.status,

      statusText: response.statusText
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Cancellation                                                               */
/* -------------------------------------------------------------------------- */

export async function cancelStream(
  response: Response,

  reason?: string
): Promise<void> {
  if (!response.body) {
    return;
  }

  await response.body.cancel(reason);
}

/* -------------------------------------------------------------------------- */
/* Abort Controller                                                           */
/* -------------------------------------------------------------------------- */

export function createAbortController(timeout?: number): AbortController {
  const controller = new AbortController();

  if (timeout !== undefined) {
    setTimeout(
      () => controller.abort(new Error("Stream timeout.")),

      timeout
    );
  }

  return controller;
}

/* -------------------------------------------------------------------------- */
/* Writable Helper                                                            */
/* -------------------------------------------------------------------------- */

export async function writeChunks(
  writable: WritableStream<Uint8Array>,

  chunks: AsyncIterable<Uint8Array>
): Promise<void> {
  const writer = writable.getWriter();

  try {
    for await (const chunk of chunks) {
      await writer.write(chunk);
    }
  } finally {
    await writer.close();
  }
}

/* -------------------------------------------------------------------------- */
/* Readable Helper                                                            */
/* -------------------------------------------------------------------------- */

export function readableFromAsync(
  iterable: AsyncIterable<Uint8Array>
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of iterable) {
          controller.enqueue(chunk);
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Stream Metrics                                                             */
/* -------------------------------------------------------------------------- */

export interface StreamMetrics {
  streams: number;

  bytesRead: number;

  chunksRead: number;

  duration: number;

  averageBytesPerSecond: number;

  peakBytesPerSecond: number;
}

/* -------------------------------------------------------------------------- */
/* Metrics Collector                                                          */
/* -------------------------------------------------------------------------- */

export class StreamMetricsCollector {
  private readonly metrics: StreamMetrics = {
    streams: 0,

    bytesRead: 0,

    chunksRead: 0,

    duration: 0,

    averageBytesPerSecond: 0,

    peakBytesPerSecond: 0
  };

  begin(): number {
    this.metrics.streams++;

    return performance.now();
  }

  record(
    bytes: number,

    chunks: number,

    startedAt: number
  ): void {
    const duration = performance.now() - startedAt;

    const rate =
      bytes /
      Math.max(
        duration / 1000,

        0.001
      );

    this.metrics.bytesRead += bytes;

    this.metrics.chunksRead += chunks;

    this.metrics.duration += duration;

    this.metrics.averageBytesPerSecond =
      this.metrics.bytesRead /
      Math.max(
        this.metrics.duration / 1000,

        0.001
      );

    this.metrics.peakBytesPerSecond = Math.max(
      this.metrics.peakBytesPerSecond,

      rate
    );
  }

  snapshot(): StreamMetrics {
    return {
      ...this.metrics
    };
  }

  reset(): void {
    this.metrics.streams = 0;

    this.metrics.bytesRead = 0;

    this.metrics.chunksRead = 0;

    this.metrics.duration = 0;

    this.metrics.averageBytesPerSecond = 0;

    this.metrics.peakBytesPerSecond = 0;
  }
}

export const streamMetrics = new StreamMetricsCollector();

/* -------------------------------------------------------------------------- */
/* Throttling                                                                 */
/* -------------------------------------------------------------------------- */

export class BandwidthLimiter {
  constructor(readonly bytesPerSecond: number) {}

  async throttle(bytes: number): Promise<void> {
    if (this.bytesPerSecond <= 0) {
      return;
    }

    const delay = (bytes / this.bytesPerSecond) * 1000;

    if (delay > 0) {
      await new Promise((resolve) =>
        setTimeout(
          resolve,

          delay
        )
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Stream Throttling                                                          */
/* -------------------------------------------------------------------------- */

export async function* throttleStream(
  source: AsyncIterable<Uint8Array>,

  bytesPerSecond: number
): AsyncGenerator<Uint8Array, void, void> {
  const limiter = new BandwidthLimiter(bytesPerSecond);

  for await (const chunk of source) {
    await limiter.throttle(chunk.byteLength);

    yield chunk;
  }
}

/* -------------------------------------------------------------------------- */
/* Byte Limiter                                                               */
/* -------------------------------------------------------------------------- */

export async function* limitBytes(
  source: AsyncIterable<Uint8Array>,

  maxBytes: number
): AsyncGenerator<Uint8Array, void, void> {
  let total = 0;

  for await (const chunk of source) {
    total += chunk.byteLength;

    if (total > maxBytes) {
      throw new Error(`Maximum stream size exceeded (${maxBytes} bytes).`);
    }

    yield chunk;
  }
}

/* -------------------------------------------------------------------------- */
/* Transfer Statistics                                                        */
/* -------------------------------------------------------------------------- */

export async function collectTransferStatistics(
  response: Response,

  options: StreamOptions = {}
): Promise<StreamMetrics> {
  const started = streamMetrics.begin();

  let bytes = 0;

  let chunks = 0;

  for await (const chunk of streamChunks(
    response,

    options
  )) {
    bytes += chunk.bytes.byteLength;

    chunks++;
  }

  streamMetrics.record(
    bytes,

    chunks,

    started
  );

  return streamMetrics.snapshot();
}

/* -------------------------------------------------------------------------- */
/* Utility                                                                    */
/* -------------------------------------------------------------------------- */

export function bytesToHuman(bytes: number): string {
  const units = [
    "B",

    "KB",

    "MB",

    "GB",

    "TB"
  ];

  let value = bytes;

  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;

    unit++;
  }

  return `${value.toFixed(2)} ${units[unit]}`;
}

/* -------------------------------------------------------------------------- */
/* Convenience API                                                            */
/* -------------------------------------------------------------------------- */

export async function readText(
  response: Response,

  options: StreamOptions = {}
): Promise<string> {
  let output = "";

  for await (const chunk of streamText(
    response,

    options
  )) {
    output += chunk;
  }

  return output;
}

export async function readJson<T = unknown>(
  response: Response,

  options: StreamOptions = {}
): Promise<T> {
  return streamJson<T>(
    response,

    options
  );
}

export async function copyResponse(response: Response): Promise<Response> {
  const [
    copy,

    original
  ] = tee(response);

  /*
   * Consume the original if desired by caller;
   * returning the copy preserves stream semantics.
   */

  void original;

  return copy;
}

export function createStreamReader(options?: StreamOptions): FetchStreamReader {
  return new FetchStreamReader(options);
}

/* -------------------------------------------------------------------------- */
/* Response Helpers                                                           */
/* -------------------------------------------------------------------------- */

export async function consume(
  response: Response,

  options: StreamOptions = {}
): Promise<StreamResult> {
  const reader = new FetchStreamReader(options);

  return reader.readStream(response);
}

export async function measureStream(
  response: Response,

  options: StreamOptions = {}
): Promise<StreamMetrics> {
  return collectTransferStatistics(
    response,

    options
  );
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

export function createBandwidthLimiter(
  bytesPerSecond: number
): BandwidthLimiter {
  return new BandwidthLimiter(bytesPerSecond);
}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {
  FetchStreamReader,

  streamReader,

  streamChunks,

  streamText,

  streamLines,

  streamJson,

  streamArrayBuffer,

  readStream: FetchStreamReader.prototype.readStream,

  readAllChunks,

  readBytes,

  readText,

  readJson,

  consume,

  measureStream,

  tee,

  cloneResponse,

  pipeStream,

  transformStream,

  cancelStream,

  readableFromAsync,

  writeChunks,

  throttleStream,

  limitBytes,

  createAbortController,

  createBandwidthLimiter,

  createStreamReader,

  streamMetrics,

  bytesToHuman,

  collectTransferStatistics
};
