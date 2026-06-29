/**
 * agent/state/constants.ts
 *
 * Shared constants for the state subsystem.
 */

/* -------------------------------------------------------------------------- */
/* Versions                                                                   */
/* -------------------------------------------------------------------------- */

export const STATE_SCHEMA_VERSION = 1;

export const STATE_FORMAT_VERSION = 1;

/* -------------------------------------------------------------------------- */
/* Limits                                                                     */
/* -------------------------------------------------------------------------- */

export const DEFAULT_MAX_MESSAGES = 500;

export const DEFAULT_MAX_EVENTS = 10_000;

export const DEFAULT_MAX_REASONING_STEPS = 1_000;

export const DEFAULT_MAX_TOOL_HISTORY = 1_000;

export const DEFAULT_MAX_MEMORY_ITEMS = 10_000;

export const DEFAULT_MAX_CHECKPOINTS = 100;

export const DEFAULT_MAX_PLANNER_TASKS = 1_000;

/* -------------------------------------------------------------------------- */
/* Timing                                                                     */
/* -------------------------------------------------------------------------- */

export const DEFAULT_CHECKPOINT_INTERVAL = 100;

export const DEFAULT_AUTOSAVE_INTERVAL = 30_000;

export const DEFAULT_HEARTBEAT_INTERVAL = 5_000;

export const DEFAULT_STATE_TTL = 24 * 60 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/* Planner                                                                    */
/* -------------------------------------------------------------------------- */

export const DEFAULT_GOAL_PRIORITY = 100;

export const DEFAULT_MAX_PLANNER_DEPTH = 20;

export const DEFAULT_MAX_REPLAN_ATTEMPTS = 5;

/* -------------------------------------------------------------------------- */
/* Memory                                                                     */
/* -------------------------------------------------------------------------- */

export const DEFAULT_WORKING_MEMORY_SIZE = 50;

export const DEFAULT_SHORT_TERM_MEMORY_SIZE = 500;

export const DEFAULT_LONG_TERM_BATCH = 25;

/* -------------------------------------------------------------------------- */
/* Runtime                                                                    */
/* -------------------------------------------------------------------------- */

export const DEFAULT_AGENT_NAME =

    "Agent";

export const DEFAULT_SESSION_PREFIX =

    "session";

export const DEFAULT_AGENT_PREFIX =

    "agent";

/* -------------------------------------------------------------------------- */
/* Serialization                                                              */
/* -------------------------------------------------------------------------- */

export const DEFAULT_SERIALIZER =

    "json";

export const DEFAULT_COMPRESSION =

    "gzip";

/* -------------------------------------------------------------------------- */
/* Event Store                                                                */
/* -------------------------------------------------------------------------- */

export const EVENT_STREAM_VERSION = 1;

export const INITIAL_EVENT_SEQUENCE = 0;

/* -------------------------------------------------------------------------- */
/* Metadata Keys                                                              */
/* -------------------------------------------------------------------------- */

export const META_PROVIDER =

    "provider";

export const META_MODEL =

    "model";

export const META_WORKFLOW =

    "workflow";

export const META_TRACE_ID =

    "traceId";

export const META_PARENT_ID =

    "parentId";

export const META_CORRELATION_ID =

    "correlationId";

/* -------------------------------------------------------------------------- */
/* Statistics                                                                 */
/* -------------------------------------------------------------------------- */

export const EMPTY_TOKEN_USAGE = {

    prompt: 0,

    completion: 0,

    total: 0,

};

export const EMPTY_EXECUTION_STATS = {

    iterations: 0,

    toolCalls: 0,

    successfulToolCalls: 0,

    failedToolCalls: 0,

    modelCalls: 0,

    reasoningSteps: 0,

    workflowSteps: 0,

    totalLatency: 0,

    totalCost: 0,

    tokenUsage: EMPTY_TOKEN_USAGE,

};

/* -------------------------------------------------------------------------- */
/* State Defaults                                                             */
/* -------------------------------------------------------------------------- */

export const EMPTY_METADATA =

    Object.freeze({});

export const EMPTY_VARIABLES =

    Object.freeze({});

export const EMPTY_CONTEXT =

    Object.freeze({});