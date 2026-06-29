/**
 * agent/state/reducers/memory.ts
 *
 * Layered memory architecture:
 *
 *   working     — keyed scratchpad (Map semantics via Record)
 *   episodic    — event / session memories
 *   semantic    — knowledge / facts
 *   procedural  — skills / procedures
 *   retrieval   — query cache & history
 *   embeddings  — vector-store references
 *   indexes     — layer indexes for fast lookup
 */

import type {

    MemoryVectorReference,
    MemoryEvent,
    MemoryIndex,
    MemoryItem,
    MemoryRetrieval,
    MemoryState,
    StoredEvent,

} from "../types";

import {

    ExecutionEventType,
    MemoryKind,

} from "../types";

import {

    createId,

} from "../utils/ids";

import {

    now,

} from "../utils/timestamps";

/* -------------------------------------------------------------------------- */
/* Clone                                                                      */
/* -------------------------------------------------------------------------- */

function cloneMemory(

    state: MemoryState

): MemoryState {

    return {

        working: {

            ...state.working,

        },

        episodic: [

            ...state.episodic,

        ],

        semantic: [

            ...state.semantic,

        ],

        procedural: [

            ...state.procedural,

        ],

        retrieval: [

            ...state.retrieval,

        ],

        embeddings: [

            ...state.embeddings,

        ],

        indexes: state.indexes.map(

            index => ({

                ...index,

                entryIds: [

                    ...index.entryIds,

                ],

            })

        ),

    };

}

/* -------------------------------------------------------------------------- */
/* Layer helpers                                                              */
/* -------------------------------------------------------------------------- */

function getLayerItems(

    state: MemoryState,

    layer: MemoryKind

): MemoryItem[] {

    switch (

        layer

    ) {

        case MemoryKind.Working:

            return Object.values(

                state.working

            );

        case MemoryKind.Episodic:

            return state.episodic;

        case MemoryKind.Semantic:

            return state.semantic;

        case MemoryKind.Procedural:

            return state.procedural;

        default:

            return [];

    }

}

function createMemoryItem(

    event: MemoryEvent,

    kind: MemoryKind

): MemoryItem {

    const timestamp =

        event.startedAt ?? now();

    return {

        id: event.id,

        kind,

        key: event.key,

        value: event.value,

        createdAt: timestamp,

        updatedAt: timestamp,

        metadata: event.metadata ?? {},

    };

}

/* -------------------------------------------------------------------------- */
/* Working memory                                                             */
/* -------------------------------------------------------------------------- */

export function setWorkingMemory(

    state: MemoryState,

    item: MemoryItem

): MemoryState {

    const next =

        cloneMemory(state);

    next.working[item.key] =

        item;

    return next;

}

export function removeWorkingMemory(

    state: MemoryState,

    key: string

): MemoryState {

    if (

        !(key in state.working)

    ) {

        return state;

    }

    const next =

        cloneMemory(state);

    delete next.working[key];

    return next;

}

export function clearWorkingMemory(

    state: MemoryState

): MemoryState {

    const next =

        cloneMemory(state);

    next.working = {};

    return next;

}

/* -------------------------------------------------------------------------- */
/* Episodic memory                                                            */
/* -------------------------------------------------------------------------- */

export function addEpisodicMemory(

    state: MemoryState,

    item: MemoryItem

): MemoryState {

    const next =

        cloneMemory(state);

    next.episodic.push(

        {

            ...item,

            kind: MemoryKind.Episodic,

        }

    );

    return next;

}

export function clearEpisodicMemory(

    state: MemoryState

): MemoryState {

    const next =

        cloneMemory(state);

    next.episodic = [];

    return next;

}

/* -------------------------------------------------------------------------- */
/* Semantic memory                                                            */
/* -------------------------------------------------------------------------- */

export function addSemanticMemory(

    state: MemoryState,

    item: MemoryItem

): MemoryState {

    const next =

        cloneMemory(state);

    next.semantic.push(

        {

            ...item,

            kind: MemoryKind.Semantic,

        }

    );

    return next;

}

export function clearSemanticMemory(

    state: MemoryState

): MemoryState {

    const next =

        cloneMemory(state);

    next.semantic = [];

    return next;

}

/* -------------------------------------------------------------------------- */
/* Procedural memory                                                          */
/* -------------------------------------------------------------------------- */

export function addProceduralMemory(

    state: MemoryState,

    item: MemoryItem

): MemoryState {

    const next =

        cloneMemory(state);

    next.procedural.push(

        {

            ...item,

            kind: MemoryKind.Procedural,

        }

    );

    return next;

}

export function clearProceduralMemory(

    state: MemoryState

): MemoryState {

    const next =

        cloneMemory(state);

    next.procedural = [];

    return next;

}

/* -------------------------------------------------------------------------- */
/* Layered collection ops                                                     */
/* -------------------------------------------------------------------------- */

function addToLayer(

    state: MemoryState,

    layer: MemoryKind,

    item: MemoryItem

): MemoryState {

    switch (

        layer

    ) {

        case MemoryKind.Working:

            return setWorkingMemory(

                state,

                {

                    ...item,

                    kind: MemoryKind.Working,

                }

            );

        case MemoryKind.Episodic:

            return addEpisodicMemory(

                state,

                item

            );

        case MemoryKind.Semantic:

            return addSemanticMemory(

                state,

                item

            );

        case MemoryKind.Procedural:

            return addProceduralMemory(

                state,

                item

            );

        default:

            return state;

    }

}

function updateInLayer(

    state: MemoryState,

    layer: MemoryKind,

    event: MemoryEvent

): MemoryState {

    if (

        layer === MemoryKind.Working

    ) {

        const existing =

            state.working[event.key];

        if (

            !existing

        ) {

            return addToLayer(

                state,

                layer,

                createMemoryItem(

                    event,

                    layer

                )

            );

        }

        return setWorkingMemory(

            state,

            {

                ...existing,

                value: event.value,

                updatedAt: now(),

            }

        );

    }

    const items =

        getLayerItems(

            state,

            layer

        );

    const existing =

        items.find(

            item =>

                item.key === event.key

                || item.id === event.id

        );

    if (

        !existing

    ) {

        return addToLayer(

            state,

            layer,

            createMemoryItem(

                event,

                layer

            )

        );

    }

    const updated: MemoryItem = {

        ...existing,

        value: event.value,

        updatedAt: now(),

    };

    const next =

        cloneMemory(state);

    const replace = (

        collection: MemoryItem[]

    ): MemoryItem[] =>

        collection.map(

            item =>

                item.id === existing.id

                    ? updated

                    : item

        );

    switch (

        layer

    ) {

        case MemoryKind.Episodic:

            next.episodic =

                replace(

                    next.episodic

                );

            break;

        case MemoryKind.Semantic:

            next.semantic =

                replace(

                    next.semantic

                );

            break;

        case MemoryKind.Procedural:

            next.procedural =

                replace(

                    next.procedural

                );

            break;

    }

    return next;

}

function deleteFromLayer(

    state: MemoryState,

    layer: MemoryKind,

    event: MemoryEvent

): MemoryState {

    if (

        layer === MemoryKind.Working

    ) {

        return removeWorkingMemory(

            state,

            event.key

        );

    }

    const next =

        cloneMemory(state);

    const remove = (

        collection: MemoryItem[]

    ): MemoryItem[] =>

        collection.filter(

            item =>

                item.key !== event.key

                && item.id !== event.id

        );

    switch (

        layer

    ) {

        case MemoryKind.Episodic:

            next.episodic =

                remove(

                    next.episodic

                );

            break;

        case MemoryKind.Semantic:

            next.semantic =

                remove(

                    next.semantic

                );

            break;

        case MemoryKind.Procedural:

            next.procedural =

                remove(

                    next.procedural

                );

            break;

    }

    return next;

}

/* -------------------------------------------------------------------------- */
/* Retrieval cache                                                            */
/* -------------------------------------------------------------------------- */

export function addRetrieval(

    state: MemoryState,

    retrieval: MemoryRetrieval

): MemoryState {

    const next =

        cloneMemory(state);

    next.retrieval.push(

        retrieval

    );

    return next;

}

export function clearRetrievalCache(

    state: MemoryState

): MemoryState {

    const next =

        cloneMemory(state);

    next.retrieval = [];

    return next;

}

/* -------------------------------------------------------------------------- */
/* Embeddings                                                                 */
/* -------------------------------------------------------------------------- */

export function addMemoryVectorReference(

    state: MemoryState,

    reference: MemoryVectorReference

): MemoryState {

    if (

        state.embeddings.some(

            entry =>

                entry.id === reference.id

                || (
                    entry.memoryId === reference.memoryId
                    && entry.vectorStoreId === reference.vectorStoreId
                )

        )

    ) {

        return state;

    }

    const next =

        cloneMemory(state);

    next.embeddings.push(

        reference

    );

    return next;

}

export function removeMemoryVectorReference(

    state: MemoryState,

    id: string

): MemoryState {

    const next =

        cloneMemory(state);

    next.embeddings =

        next.embeddings.filter(

            entry =>

                entry.id !== id

        );

    return next;

}

/* -------------------------------------------------------------------------- */
/* Indexes                                                                    */
/* -------------------------------------------------------------------------- */

export function addIndex(

    state: MemoryState,

    index: MemoryIndex

): MemoryState {

    const next =

        cloneMemory(state);

    next.indexes.push(

        index

    );

    return next;

}

export function updateIndex(

    state: MemoryState,

    index: MemoryIndex

): MemoryState {

    const position =

        state.indexes.findIndex(

            entry =>

                entry.id === index.id

        );

    if (

        position < 0

    ) {

        return addIndex(

            state,

            index

        );

    }

    const next =

        cloneMemory(state);

    next.indexes[position] =

        {

            ...index,

            updatedAt: now(),

        };

    return next;

}

export function removeIndex(

    state: MemoryState,

    id: string

): MemoryState {

    const next =

        cloneMemory(state);

    next.indexes =

        next.indexes.filter(

            entry =>

                entry.id !== id

        );

    return next;

}

/* -------------------------------------------------------------------------- */
/* Event operations                                                           */
/* -------------------------------------------------------------------------- */

function resolveLayer(

    event: MemoryEvent

): MemoryKind {

    return event.layer ?? MemoryKind.Working;

}

function storeMemory(

    state: MemoryState,

    event: MemoryEvent

): MemoryState {

    const layer =

        resolveLayer(

            event

        );

    return addToLayer(

        state,

        layer,

        createMemoryItem(

            event,

            layer

        )

    );

}

function updateMemory(

    state: MemoryState,

    event: MemoryEvent

): MemoryState {

    return updateInLayer(

        state,

        resolveLayer(

            event

        ),

        event

    );

}

function deleteMemory(

    state: MemoryState,

    event: MemoryEvent

): MemoryState {

    return deleteFromLayer(

        state,

        resolveLayer(

            event

        ),

        event

    );

}

function retrieveMemory(

    state: MemoryState,

    event: MemoryEvent

): MemoryState {

    const layer =

        event.layer;

    const query =

        event.query ?? event.key;

    const candidates =

        layer

            ? getLayerItems(

                state,

                layer

            )

            : [

                ...Object.values(

                    state.working

                ),

                ...state.episodic,

                ...state.semantic,

                ...state.procedural,

            ];

    const normalized =

        query.toLowerCase();

    const results =

        candidates.filter(

            item =>

                item.key.toLowerCase().includes(

                    normalized

                )

                || String(

                    item.value ?? ""

                ).toLowerCase().includes(

                    normalized

                )

        );

    return addRetrieval(

        state,

        {

            id: createId(

                "retrieval"

            ),

            query,

            results,

            duration: event.duration ?? 0,

            createdAt: now(),

            metadata: event.metadata,

        }

    );

}

/* -------------------------------------------------------------------------- */
/* Reducer                                                                    */
/* -------------------------------------------------------------------------- */

export function memoryReducer(

    state: MemoryState,

    stored: StoredEvent

): MemoryState {

    const event =

        stored.event;

    if (

        event.type !==

        ExecutionEventType.Memory

    ) {

        return state;

    }

    const memory =

        event as MemoryEvent;

    switch (

        memory.operation

    ) {

        case "store":

            return storeMemory(

                state,

                memory

            );

        case "update":

            return updateMemory(

                state,

                memory

            );

        case "delete":

            return deleteMemory(

                state,

                memory

            );

        case "retrieve":

            return retrieveMemory(

                state,

                memory

            );

        default:

            return state;

    }

}

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

export default memoryReducer;
