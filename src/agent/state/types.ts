/**
 * state/types.ts
 *
 * Core state contracts.
 *
 * Every component in the framework depends
 * on these types.
 */

import type {

    ParsedDocument,

} from "../../tools/fetch/parser";

/* -------------------------------------------------------------------------- */
/* Branded IDs                                                                */
/* -------------------------------------------------------------------------- */

export type AgentId =
    string & { readonly __brand: "AgentId" };

export type SessionId =
    string & { readonly __brand: "SessionId" };

export type MessageId =
    string & { readonly __brand: "MessageId" };

export type ToolCallId =
    string & { readonly __brand: "ToolCallId" };

export type ActionId =
    string & { readonly __brand: "ActionId" };

export type CheckpointId =
    string & { readonly __brand: "CheckpointId" };

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

export enum MessageRole {

    System = "system",

    User = "user",

    Assistant = "assistant",

    Tool = "tool",

    Developer = "developer",

}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

export enum AgentStatus {

    Idle = "idle",

    Planning = "planning",

    Thinking = "thinking",

    ExecutingTools = "executing_tools",

    Waiting = "waiting",

    Streaming = "streaming",

    Completed = "completed",

    Cancelled = "cancelled",

    Error = "error",

}

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

export type ContentType =

    | "text"

    | "image"

    | "audio"

    | "video"

    | "file"

    | "json"

    | "markdown";

/* -------------------------------------------------------------------------- */
/* Content Block                                                              */
/* -------------------------------------------------------------------------- */

export interface ContentBlock {

    type: ContentType;

    value: unknown;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Message                                                                    */
/* -------------------------------------------------------------------------- */

export interface AgentMessage {

    id: MessageId;

    role: MessageRole;

    content: string;

    blocks?: ContentBlock[];

    createdAt: number;

    updatedAt?: number;

    name?: string;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Conversation                                                               */
/* -------------------------------------------------------------------------- */

export interface ConversationState {

    messages: AgentMessage[];

    documents: RetrievedDocument[];

    variables: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Retrieved Document                                                         */
/* -------------------------------------------------------------------------- */

export interface RetrievedDocument {

    id: string;

    url: string;

    document: ParsedDocument;

    score?: number;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Reasoning                                                                  */
/* -------------------------------------------------------------------------- */

export type ReasoningType =

    | "thought"

    | "observation"

    | "reflection"

    | "planning"

    | "decision"

    | "critique"

    | "summary";

/* -------------------------------------------------------------------------- */
/* Reasoning Step                                                             */
/* -------------------------------------------------------------------------- */

export interface ReasoningStep {

    id: ActionId;

    type: ReasoningType;

    title: string;

    input?: unknown;

    output?: unknown;

    startedAt: number;

    completedAt?: number;

    duration?: number;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Tool Execution                                                             */
/* -------------------------------------------------------------------------- */

export type ToolStatus =

    | "pending"

    | "running"

    | "completed"

    | "failed"

    | "cancelled";

export interface ToolExecution {

    id: ToolCallId;

    tool: string;

    status: ToolStatus;

    input: unknown;

    output?: unknown;

    error?: string;

    retries: number;

    startedAt: number;

    completedAt?: number;

    duration?: number;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Model Invocation                                                           */
/* -------------------------------------------------------------------------- */

export interface TokenUsage {

    prompt: number;

    completion: number;

    total: number;

}

export interface ModelInvocation {

    id: ActionId;

    provider: string;

    model: string;

    status: ToolStatus;

    input?: unknown;

    output?: unknown;

    tokenUsage?: TokenUsage;

    estimatedCost?: number;

    temperature?: number;

    maxTokens?: number;

    finishReason?: string;

    latency?: number;

    startedAt: number;

    completedAt?: number;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Agent Action                                                               */
/* -------------------------------------------------------------------------- */

export type ActionType =

    | "message"

    | "reason"

    | "tool"

    | "llm"

    | "memory"

    | "retrieve"

    | "plan"

    | "workflow"

    | "system";

/* -------------------------------------------------------------------------- */
/* Agent Action                                                               */
/* -------------------------------------------------------------------------- */

export interface AgentAction {

    id: ActionId;

    type: ActionType;

    name: string;

    status: ToolStatus;

    input?: unknown;

    output?: unknown;

    error?: string;

    startedAt: number;

    completedAt?: number;

    duration?: number;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Timeline                                                                   */
/* -------------------------------------------------------------------------- */

export type TimelineCategory =

    | "conversation"

    | "planner"

    | "reasoning"

    | "tool"

    | "llm"

    | "memory"

    | "workflow"

    | "system";

export interface TimelineEvent {

    id: ActionId;

    category: TimelineCategory;

    title: string;

    timestamp: number;

    payload?: unknown;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Execution Statistics                                                       */
/* -------------------------------------------------------------------------- */

export interface ExecutionStatistics {

    iterations: number;

    toolCalls: number;

    successfulToolCalls: number;

    failedToolCalls: number;

    modelCalls: number;

    reasoningSteps: number;

    workflowSteps: number;

    totalLatency: number;

    totalCost: number;

    tokenUsage: TokenUsage;

}

/* -------------------------------------------------------------------------- */
/* Execution State                                                            */
/* -------------------------------------------------------------------------- */

export interface ExecutionState {

    status: AgentStatus;

    iteration: number;

    reasoning: ReasoningStep[];

    actions: AgentAction[];

    toolExecutions: ToolExecution[];

    modelInvocations: ModelInvocation[];

    timeline: TimelineEvent[];

    statistics: ExecutionStatistics;

}

/* -------------------------------------------------------------------------- */
/* Event Types                                                                */
/* -------------------------------------------------------------------------- */

export enum ExecutionEventType {

    Message = "message",

    Planning = "planning",

    Reasoning = "reasoning",

    Tool = "tool",

    Model = "model",

    Memory = "memory",

    Retrieval = "retrieval",

    Workflow = "workflow",

    System = "system",

}

/* -------------------------------------------------------------------------- */
/* Base Event                                                                 */
/* -------------------------------------------------------------------------- */

export interface BaseExecutionEvent {

    id: ActionId;

    type: ExecutionEventType;

    timestamp: number;

    startedAt: number;

    completedAt?: number;

    duration?: number;

    success: boolean;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Planning                                                                   */
/* -------------------------------------------------------------------------- */

export interface PlanningEvent

    extends BaseExecutionEvent {

    type:

    ExecutionEventType.Planning;

    goal: string;

    plan?: string;

}

/* -------------------------------------------------------------------------- */
/* Reasoning                                                                  */
/* -------------------------------------------------------------------------- */

export interface ReasoningEvent

    extends BaseExecutionEvent {

    type:

    ExecutionEventType.Reasoning;

    reasoningType:

    ReasoningType;

    input?: unknown;

    output?: unknown;

}

/* -------------------------------------------------------------------------- */
/* Tool                                                                        */
/* -------------------------------------------------------------------------- */

export interface ToolExecutionEvent

    extends BaseExecutionEvent {

    type:

    ExecutionEventType.Tool;

    tool: string;

    input: unknown;

    output?: unknown;

    retries: number;

    error?: string;

}

/* -------------------------------------------------------------------------- */
/* Model                                                                       */
/* -------------------------------------------------------------------------- */

export interface ModelInvocationEvent

    extends BaseExecutionEvent {

    type:

    ExecutionEventType.Model;

    provider: string;

    model: string;

    prompt?: unknown;

    response?: unknown;

    tokenUsage?: TokenUsage;

    estimatedCost?: number;

    finishReason?: string;

}

/* -------------------------------------------------------------------------- */
/* Retrieval                                                                  */
/* -------------------------------------------------------------------------- */

export interface RetrievalEvent

    extends BaseExecutionEvent {

    type:

    ExecutionEventType.Retrieval;

    query: string;

    retrieved:

    RetrievedDocument[];

}

/* -------------------------------------------------------------------------- */
/* Memory                                                                     */
/* -------------------------------------------------------------------------- */

export interface MemoryEvent

    extends BaseExecutionEvent {

    type:

    ExecutionEventType.Memory;

    operation:

    "store"

    | "retrieve"

    | "update"

    | "delete";

    layer?: MemoryKind;

    key: string;

    value?: unknown;

    query?: string;

    duration?: number;

}

/* -------------------------------------------------------------------------- */
/* Workflow                                                                   */
/* -------------------------------------------------------------------------- */

export interface WorkflowEvent

    extends BaseExecutionEvent {

    type:

    ExecutionEventType.Workflow;

    workflow: string;

    node?: string;

    state?: string;

}

/* -------------------------------------------------------------------------- */
/* Message                                                                    */
/* -------------------------------------------------------------------------- */

export interface MessageEvent

    extends BaseExecutionEvent {

    type:

    ExecutionEventType.Message;

    message:

    AgentMessage;

}

/* -------------------------------------------------------------------------- */
/* System                                                                     */
/* -------------------------------------------------------------------------- */

export interface SystemEvent

    extends BaseExecutionEvent {

    type:

    ExecutionEventType.System;

    level:

    "debug"

    | "info"

    | "warning"

    | "error";

    message: string;

}

/* -------------------------------------------------------------------------- */
/* Execution Event                                                            */
/* -------------------------------------------------------------------------- */

export type ExecutionEvent =

    | MessageEvent

    | PlanningEvent

    | ReasoningEvent

    | ToolExecutionEvent

    | ModelInvocationEvent

    | RetrievalEvent

    | MemoryEvent

    | WorkflowEvent

    | SystemEvent;

/* -------------------------------------------------------------------------- */
/* Execution State                                                            */
/* -------------------------------------------------------------------------- */

export interface ExecutionState {

    status: AgentStatus;

    iteration: number;

    currentEvent?: ExecutionEvent;

    events: ExecutionEvent[];

    statistics: ExecutionStatistics;

}

/* -------------------------------------------------------------------------- */
/* Event Metadata                                                             */
/* -------------------------------------------------------------------------- */

export interface EventMetadata {

    sequence: number;

    correlationId?: string;

    causationId?: string;

    parentId?: ActionId;

    source?: string;

    version: number;

    tags?: string[];

}

/* -------------------------------------------------------------------------- */
/* Stored Event                                                               */
/* -------------------------------------------------------------------------- */

export interface StoredEvent<T = ExecutionEvent> {

    metadata: EventMetadata;

    event: T;

}

/* -------------------------------------------------------------------------- */
/* Event Stream                                                               */
/* -------------------------------------------------------------------------- */

export interface EventStream {

    id: SessionId;

    version: number;

    createdAt: number;

    updatedAt: number;

    events: StoredEvent[];

}

/* -------------------------------------------------------------------------- */
/* Reducer                                                                    */
/* -------------------------------------------------------------------------- */

export interface StateReducer {

    reduce(

        state: AgentState,

        event: StoredEvent

    ): AgentState;

}

/* -------------------------------------------------------------------------- */
/* Planner                                                                    */
/* -------------------------------------------------------------------------- */

export enum PlannerStatus {

    Idle = "idle",

    Planning = "planning",

    Executing = "executing",

    Waiting = "waiting",

    Completed = "completed",

    Failed = "failed",

}

export enum GoalStatus {

    Pending = "pending",

    Active = "active",

    Completed = "completed",

    Failed = "failed",

    Cancelled = "cancelled",

}

export enum TaskStatus {

    Pending = "pending",

    Ready = "ready",

    Running = "running",

    Completed = "completed",

    Failed = "failed",

    Skipped = "skipped",

    Cancelled = "cancelled",

}

export interface Goal {

    id: string;

    title: string;

    description?: string;

    priority: number;

    status: GoalStatus;

    createdAt: number;

    updatedAt: number;

    metadata?: Record<string, unknown>;

}

export interface TaskNode {

    id: string;

    goalId?: string;

    title: string;

    description?: string;

    status: TaskStatus;

    retryCount: number;

    maxRetries: number;

    createdAt: number;

    startedAt?: number;

    completedAt?: number;

    duration?: number;

    error?: string;

    metadata?: Record<string, unknown>;

}

export interface TaskEdge {

    from: string;

    to: string;

    condition?: string;

}

export interface PlannerGraph {

    nodes: TaskNode[];

    edges: TaskEdge[];

}

export interface PlannerState {

    status: PlannerStatus;

    goals: Goal[];

    completedGoals: Goal[];

    tasks: TaskNode[];

    dependencies: TaskEdge[];

    graph: PlannerGraph;

}

/* -------------------------------------------------------------------------- */
/* Memory                                                                     */
/* -------------------------------------------------------------------------- */

export enum MemoryKind {

    Working = "working",

    Episodic = "episodic",

    Semantic = "semantic",

    Procedural = "procedural",

}

export interface MemoryItem {

    id: string;

    kind: MemoryKind;

    key: string;

    value: unknown;

    embeddingId?: string;

    createdAt: number;

    updatedAt: number;

    expiresAt?: number;

    metadata?: Record<string, unknown>;

}

export interface MemoryRetrieval {

    id: string;

    query: string;

    results: MemoryItem[];

    duration: number;

    createdAt: number;

    expiresAt?: number;

    metadata?: Record<string, unknown>;

}

export interface MemoryVectorReference {

    id: string;

    memoryId: string;

    provider?: string;

    model?: string;

    vectorStoreId?: string;

    vectorId?: string;

    dimensions?: number;

    createdAt: number;

    metadata?: Record<string, unknown>;

}

export interface MemoryIndex {

    id: string;

    name: string;

    layer: MemoryKind | "all";

    entryIds: string[];

    createdAt: number;

    updatedAt: number;

    metadata?: Record<string, unknown>;

}

export interface MemoryState {

    working: Record<string, MemoryItem>;

    episodic: MemoryItem[];

    semantic: MemoryItem[];

    procedural: MemoryItem[];

    retrieval: MemoryRetrieval[];

    embeddings: MemoryVectorReference[];

    indexes: MemoryIndex[];

}

/* -------------------------------------------------------------------------- */
/* Runtime                                                                    */
/* -------------------------------------------------------------------------- */

export interface RuntimeContext {

    currentModel?: string;

    currentProvider?: string;

    currentTool?: string;

    workflowId?: string;

    parentRunId?: string;

    traceId?: string;

    correlationId?: string;

    metadata: Record<string, unknown>;

}

export interface RuntimeStatistics {

    startedAt: number;

    updatedAt: number;

    completedAt?: number;

    totalDuration: number;

    totalTokens: number;

    promptTokens: number;

    completionTokens: number;

    estimatedCost: number;

}

export interface RuntimeState {

    id: AgentId;

    sessionId: SessionId;

    status: AgentStatus;

    createdAt: number;

    updatedAt: number;

    context: RuntimeContext;

    statistics: RuntimeStatistics;

}

/* -------------------------------------------------------------------------- */
/* Checkpoints                                                                */
/* -------------------------------------------------------------------------- */

export interface Checkpoint {

    id: CheckpointId;

    sequence: number;

    createdAt: number;

    label?: string;

    eventCount: number;

    stateHash: string;

}

export interface Snapshot<T = unknown> {

    checkpointId: CheckpointId;

    state: T;

    createdAt: number;

}

export interface RecoveryPoint {

    checkpoint: Checkpoint;

    snapshot?: Snapshot<AgentState>;

}

/* -------------------------------------------------------------------------- */
/* Event Store                                                                */
/* -------------------------------------------------------------------------- */

export interface EventMetadata {

    sequence: number;

    version: number;

    correlationId?: string;

    causationId?: string;

    parentEventId?: ActionId;

    source?: string;

    tags?: string[];

}

export interface StoredEvent<T = ExecutionEvent> {

    metadata: EventMetadata;

    event: T;

}

export interface EventStream {

    id: SessionId;

    version: number;

    createdAt: number;

    updatedAt: number;

    events: StoredEvent[];

}

/* -------------------------------------------------------------------------- */
/* Event Store Contract                                                       */
/* -------------------------------------------------------------------------- */

export interface EventStore {

    create(

        sessionId: SessionId

    ): Promise<EventStream>;

    load(

        sessionId: SessionId

    ): Promise<EventStream | undefined>;

    append(

        sessionId: SessionId,

        event: StoredEvent

    ): Promise<void>;

    appendMany(

        sessionId: SessionId,

        events: StoredEvent[]

    ): Promise<void>;

    delete(

        sessionId: SessionId

    ): Promise<void>;

}

/* -------------------------------------------------------------------------- */
/* Replay Engine                                                              */
/* -------------------------------------------------------------------------- */

export interface ReplayEngine {

    replay(

        sessionId: SessionId,

        initial: AgentState,

        reducer?: StateReducer

    ): Promise<AgentState>;

    replayEvents(

        events: readonly StoredEvent[],

        initial: AgentState,

        reducer?: StateReducer

    ): AgentState;

}

/* -------------------------------------------------------------------------- */
/* Snapshot Store                                                             */
/* -------------------------------------------------------------------------- */

export interface SnapshotStore {

    save(

        snapshot: Snapshot<AgentState>

    ): Promise<void>;

    load(

        checkpointId: CheckpointId

    ): Promise<Snapshot<AgentState> | undefined>;

    delete(

        checkpointId: CheckpointId

    ): Promise<void>;

}

/* -------------------------------------------------------------------------- */
/* Checkpoint Store                                                           */
/* -------------------------------------------------------------------------- */

export interface CheckpointStore {

    save(

        sessionId: SessionId,

        checkpoint: Checkpoint

    ): Promise<void>;

    load(

        checkpointId: CheckpointId

    ): Promise<Checkpoint | undefined>;

    list(

        sessionId: SessionId

    ): Promise<Checkpoint[]>;

    delete(

        checkpointId: CheckpointId

    ): Promise<void>;

    deleteAll(

        sessionId: SessionId

    ): Promise<void>;

}

/* -------------------------------------------------------------------------- */
/* Reducers                                                                   */
/* -------------------------------------------------------------------------- */

export interface StateReducer {

    reduce(

        state: AgentState,

        event: StoredEvent

    ): AgentState;

}

export interface ReducerRegistry {

    register(

        reducer: StateReducer

    ): void;

    unregister(

        reducer: StateReducer

    ): void;

    reduce(

        state: AgentState,

        event: StoredEvent

    ): AgentState;

}

/* -------------------------------------------------------------------------- */
/* Serialization                                                              */
/* -------------------------------------------------------------------------- */

export interface StateSerializer {

    readonly name: string;

    serialize(

        state: AgentState

    ): Promise<string | Uint8Array>;

    deserialize(

        data: string | Uint8Array

    ): Promise<AgentState>;

}

export interface StateCompression {

    compress(

        data: Uint8Array

    ): Promise<Uint8Array>;

    decompress(

        data: Uint8Array

    ): Promise<Uint8Array>;

}

/* -------------------------------------------------------------------------- */
/* Observer                                                                   */
/* -------------------------------------------------------------------------- */

export interface StateObserver {

    onStateChanged?(

        state: AgentState

    ): Promise<void> | void;

    onEvent?(

        event: StoredEvent

    ): Promise<void> | void;

}

export interface Subscription {

    unsubscribe(): void;

}

/* -------------------------------------------------------------------------- */
/* Dispatcher                                                                 */
/* -------------------------------------------------------------------------- */

export interface EventDispatcher {

    dispatch(

        event: StoredEvent

    ): Promise<void>;

    subscribe(

        observer: StateObserver

    ): Subscription;

}

/* -------------------------------------------------------------------------- */
/* Persistence                                                                */
/* -------------------------------------------------------------------------- */

export interface StatePersistence {

    save(

        state: AgentState

    ): Promise<void>;

    load(

        sessionId: SessionId

    ): Promise<AgentState | undefined>;

    delete(

        sessionId: SessionId

    ): Promise<void>;

}

/* -------------------------------------------------------------------------- */
/* Plugins                                                                    */
/* -------------------------------------------------------------------------- */

export interface StatePlugin {

    readonly name: string;

    initialize?(): Promise<void> | void;

    destroy?(): Promise<void> | void;

    reducer?(): StateReducer;

    observer?(): StateObserver;

}

/* -------------------------------------------------------------------------- */
/* Root Agent State                                                           */
/* -------------------------------------------------------------------------- */

export interface AgentState {

    conversation: ConversationState;

    execution: ExecutionState;

    planner: PlannerState;

    memory: MemoryState;

    runtime: RuntimeState;

    checkpoints: Checkpoint[];

}

/* -------------------------------------------------------------------------- */
/* Manager                                                                    */
/* -------------------------------------------------------------------------- */

export interface StateManager {

    getState(): Readonly<AgentState>;

    replace(

        state: AgentState

    ): void;

    dispatch(

        event: StoredEvent

    ): Promise<void>;

    checkpoint(

        label?: string

    ): Promise<Checkpoint>;

    restore(

        checkpointId: CheckpointId

    ): Promise<void>;

}

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

export interface StateFactory {

    create(

        sessionId?: SessionId

    ): AgentState;

}

/* -------------------------------------------------------------------------- */
/* Generic Helpers                                                            */
/* -------------------------------------------------------------------------- */

export type DeepReadonly<T> = {

    readonly [

    K in keyof T

    ]: DeepReadonly<T[K]>;

};

export type Mutable<T> = {

    -readonly [

    K in keyof T

    ]: T[K];

};

export type JsonValue =

    | string

    | number

    | boolean

    | null

    | JsonValue[]

    | {

        [key: string]: JsonValue;

    };

export type Dictionary<T = unknown> =

    Record<string, T>;


/* -------------------------------------------------------------------------- */
/* Attachments                                                                */
/* -------------------------------------------------------------------------- */

export type AttachmentType =

    | "image"

    | "audio"

    | "video"

    | "document"

    | "pdf"

    | "file"

    | "binary";

export interface Attachment {

    id: string;

    type: AttachmentType;

    name: string;

    mimeType: string;

    uri?: string;

    size?: number;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Tool Definitions                                                           */
/* -------------------------------------------------------------------------- */

export type ToolParameterType =

    | "string"

    | "number"

    | "integer"

    | "boolean"

    | "array"

    | "object"

    | "null";

export interface ToolParameter {

    name: string;

    description?: string;

    type: ToolParameterType;

    required?: boolean;

    default?: unknown;

}

export interface ToolSchema {

    name: string;

    description: string;

    parameters: ToolParameter[];

}

export interface ToolDefinition {

    name: string;

    description: string;

    version?: string;

    schema: ToolSchema;

    metadata?: Record<string, unknown>;

}

export interface ToolResult {

    success: boolean;

    output?: unknown;

    error?: string;

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* LLM Provider                                                               */
/* -------------------------------------------------------------------------- */

export interface ProviderConfiguration {

    provider: string;

    model: string;

    endpoint?: string;

    apiVersion?: string;

    temperature?: number;

    topP?: number;

    maxTokens?: number;

    stopSequences?: string[];

    metadata?: Record<string, unknown>;

}

/* -------------------------------------------------------------------------- */
/* Embeddings                                                                 */
/* -------------------------------------------------------------------------- */

export interface EmbeddingReference {

    id: string;

    provider: string;

    model: string;

    dimensions: number;

    vectorId?: string;

}

/* -------------------------------------------------------------------------- */
/* Workflow                                                                   */
/* -------------------------------------------------------------------------- */

export enum WorkflowNodeStatus {

    Pending = "pending",

    Running = "running",

    Completed = "completed",

    Failed = "failed",

    Skipped = "skipped",

}

export interface WorkflowNode {

    id: string;

    name: string;

    status: WorkflowNodeStatus;

    metadata?: Record<string, unknown>;

}

export interface WorkflowEdge {

    from: string;

    to: string;

    condition?: string;

}

export interface WorkflowDefinition {

    id: string;

    name: string;

    version?: string;

    nodes: WorkflowNode[];

    edges: WorkflowEdge[];

}

/* -------------------------------------------------------------------------- */
/* Multi-Agent                                                                */
/* -------------------------------------------------------------------------- */

export interface AgentReference {

    id: AgentId;

    name: string;

    role?: string;

    metadata?: Record<string, unknown>;

}

export interface AgentMessageEnvelope {

    from: AgentReference;

    to: AgentReference;

    message: AgentMessage;

    timestamp: number;

}

/* -------------------------------------------------------------------------- */
/* MCP                                                                        */
/* -------------------------------------------------------------------------- */

export interface McpResource {

    uri: string;

    mimeType?: string;

    name?: string;

}

export interface McpToolReference {

    server: string;

    tool: string;

}

/* -------------------------------------------------------------------------- */
/* Generic Utility Types                                                      */
/* -------------------------------------------------------------------------- */

export type Nullable<T> =

    T | null;

export type Optional<T> =

    T | undefined;

export type MaybePromise<T> =

    T | Promise<T>;

export type DeepPartial<T> = {

    [K in keyof T]?:

    T[K] extends object

    ? DeepPartial<T[K]>

    : T[K];

};

export type RecursiveReadonly<T> = {

    readonly [K in keyof T]:

    T[K] extends object

    ? RecursiveReadonly<T[K]>

    : T[K];

};

export type Primitive =

    | string

    | number

    | boolean

    | bigint

    | symbol

    | null

    | undefined;
