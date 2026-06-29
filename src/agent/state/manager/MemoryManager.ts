/**
 * agent/state/manager/MemoryManager.ts
 */

import type {

    MemoryItem,
    MemoryState,
    StoredEvent,

} from "../types";

import {

    MemoryKind,

} from "../types";

import {

    createMemoryEvent,

} from "../events";

import {

    addEpisodicMemory,
    addProceduralMemory,
    addSemanticMemory,
    setWorkingMemory,

} from "../reducers/memory";

import {

    createMemoryItem,

} from "../defaults";

/* -------------------------------------------------------------------------- */
/* Memory Manager                                                             */
/* -------------------------------------------------------------------------- */

export class MemoryManager {

    constructor(

        private readonly manager: {

            getState(): Readonly<{ memory: MemoryState }>;

            dispatch(event: StoredEvent): Promise<void>;

        }

    ) { }

    get state(): MemoryState {

        return this.manager.getState().memory;

    }

    get working(): Readonly<Record<string, MemoryItem>> {

        return this.state.working;

    }

    async store(

        key: string,

        value: unknown,

        layer: MemoryKind = MemoryKind.Working

    ): Promise<void> {

        await this.manager.dispatch(

            createMemoryEvent(

                "store",

                key,

                {

                    layer,

                    value,

                }

            )

        );

    }

    async update(

        key: string,

        value: unknown,

        layer?: MemoryKind

    ): Promise<void> {

        await this.manager.dispatch(

            createMemoryEvent(

                "update",

                key,

                {

                    layer,

                    value,

                }

            )

        );

    }

    async remove(

        key: string,

        layer?: MemoryKind

    ): Promise<void> {

        await this.manager.dispatch(

            createMemoryEvent(

                "delete",

                key,

                {

                    layer,

                }

            )

        );

    }

    async retrieve(

        query: string,

        layer?: MemoryKind

    ): Promise<void> {

        await this.manager.dispatch(

            createMemoryEvent(

                "retrieve",

                query,

                {

                    layer,

                    query,

                }

            )

        );

    }

    get(

        key: string

    ): MemoryItem | undefined {

        return this.state.working[key];

    }

    previewSetWorking(

        key: string,

        value: unknown

    ): MemoryState {

        const item =

            createMemoryItem();

        item.key = key;

        item.value = value;

        return setWorkingMemory(

            this.state,

            item

        );

    }

    previewAddSemantic(

        item: MemoryItem

    ): MemoryState {

        return addSemanticMemory(

            this.state,

            item

        );

    }

    previewAddEpisodic(

        item: MemoryItem

    ): MemoryState {

        return addEpisodicMemory(

            this.state,

            item

        );

    }

    previewAddProcedural(

        item: MemoryItem

    ): MemoryState {

        return addProceduralMemory(

            this.state,

            item

        );

    }

}
