/**
 * agent/state/middleware/index.ts
 */

export type {

    DispatchContext,
    Logger,
    Middleware,
    ReduceFn,
    RetryPolicy,
    TelemetrySink,

} from "./types";

export {

    MiddlewareAbortError,
    RetryableError,
    consoleLogger,
    createDispatchContext,
    DEFAULT_RETRY_POLICY,

} from "./types";

export {

    MiddlewarePipeline,

} from "./MiddlewarePipeline";

export {

    ValidationMiddleware,

} from "./ValidationMiddleware";

export {

    LoggingMiddleware,

} from "./LoggingMiddleware";

export {

    MetricsMiddleware,

} from "./MetricsMiddleware";

export type {

    DispatchMetrics,

} from "./MetricsMiddleware";

export {

    RetryMiddleware,
    withRetry,

} from "./RetryMiddleware";

export {

    PersistenceMiddleware,

} from "./PersistenceMiddleware";

export {

    CheckpointMiddleware,

} from "./CheckpointMiddleware";

export type {

    CheckpointMiddlewareOptions,

} from "./CheckpointMiddleware";

export {

    TelemetryMiddleware,

} from "./TelemetryMiddleware";

export {

    PluginMiddleware,

} from "./PluginMiddleware";

export type {

    ExtendedStatePlugin,
    PluginDispatchHooks,

} from "./PluginMiddleware";

import type {

    CheckpointStore,
    EventStore,
    SnapshotStore,

} from "../types";

import type {

    Logger,
    TelemetrySink,

} from "./types";

import type {

    ExtendedStatePlugin,

} from "./PluginMiddleware";

import {

    DEFAULT_MAX_CHECKPOINTS,

} from "../constants";

import {

    MemoryCheckpointStore,

} from "../store/CheckpointStore";

import {

    MemoryEventStore,

} from "../store/MemoryStore";

import {

    MemorySnapshotStore,

} from "../store/SnapshotStore";

import {

    MiddlewarePipeline,

} from "./MiddlewarePipeline";

import {

    ValidationMiddleware,

} from "./ValidationMiddleware";

import {

    LoggingMiddleware,

} from "./LoggingMiddleware";

import {

    MetricsMiddleware,

} from "./MetricsMiddleware";

import {

    RetryMiddleware,

} from "./RetryMiddleware";

import {

    PersistenceMiddleware,

} from "./PersistenceMiddleware";

import {

    CheckpointMiddleware,

} from "./CheckpointMiddleware";

import {

    TelemetryMiddleware,

} from "./TelemetryMiddleware";

import {

    PluginMiddleware,

} from "./PluginMiddleware";

/* -------------------------------------------------------------------------- */
/* Default Pipeline                                                           */
/* -------------------------------------------------------------------------- */

export interface DefaultPipelineOptions {

    store?: EventStore;

    checkpointStore?: CheckpointStore;

    snapshotStore?: SnapshotStore;

    logger?: Logger;

    telemetry?: TelemetrySink;

    plugins?: readonly ExtendedStatePlugin[];

    checkpointInterval?: number;

    maxCheckpoints?: number;

    getEventCount?(): number;

    enableValidation?: boolean;

    enableLogging?: boolean;

    enableMetrics?: boolean;

    enableRetry?: boolean;

    enablePersistence?: boolean;

    enableCheckpoints?: boolean;

    enableTelemetry?: boolean;

    enablePlugins?: boolean;

}

export function createDefaultPipeline(

    options: DefaultPipelineOptions = {}

): MiddlewarePipeline {

    const pipeline =

        new MiddlewarePipeline();

    if (

        options.enableValidation !== false

    ) {

        pipeline.use(

            new ValidationMiddleware()

        );

    }

    if (

        options.enableLogging !== false

    ) {

        pipeline.use(

            new LoggingMiddleware(

                options.logger

            )

        );

    }

    if (

        options.enableMetrics !== false

    ) {

        pipeline.use(

            new MetricsMiddleware()

        );

    }

    if (

        options.enableRetry !== false

    ) {

        pipeline.use(

            new RetryMiddleware()

        );

    }

    if (

        options.enablePersistence !== false

    ) {

        pipeline.use(

            new PersistenceMiddleware(

                options.store ??

                new MemoryEventStore()

            )

        );

    }

    if (

        options.enableCheckpoints !== false

    ) {

        pipeline.use(

            new CheckpointMiddleware({

                checkpointStore:

                    options.checkpointStore ??

                    new MemoryCheckpointStore(),

                snapshotStore:

                    options.snapshotStore ??

                    new MemorySnapshotStore(),

                interval:

                    options.checkpointInterval,

                maxCheckpoints:

                    options.maxCheckpoints ??

                    DEFAULT_MAX_CHECKPOINTS,

                getEventCount:

                    options.getEventCount,

            })

        );

    }

    if (

        options.enablePlugins !== false

    ) {

        pipeline.use(

            new PluginMiddleware(

                options.plugins

            )

        );

    }

    if (

        options.enableTelemetry !== false

        && options.telemetry

    ) {

        pipeline.use(

            new TelemetryMiddleware(

                options.telemetry

            )

        );

    }

    return pipeline;

}
