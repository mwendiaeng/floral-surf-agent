/**
 * agent/memory/MemoryService.ts
 */

import type {

    MemoryItem,
    MemoryKind,
    MemoryRetrieval,

} from "../state/types";

import type {

    MemoryManager,

} from "../state/manager/MemoryManager";

/* -------------------------------------------------------------------------- */
/* Memory Service                                                             */
/* -------------------------------------------------------------------------- */

export class MemoryService {

    constructor(

        private readonly manager: MemoryManager

    ) { }

    get state() {

        return this.manager.state;

    }

    get working(): Readonly<Record<string, MemoryItem>> {

        return this.manager.working;

    }

    get semantic(): readonly MemoryItem[] {

        return this.state.semantic;

    }

    get episodic(): readonly MemoryItem[] {

        return this.state.episodic;

    }

    get procedural(): readonly MemoryItem[] {

        return this.state.procedural;

    }

    get retrievals(): readonly MemoryRetrieval[] {

        return this.state.retrieval;

    }

    async remember(

        key: string,

        value: unknown,

        layer?: MemoryKind

    ): Promise<void> {

        await this.manager.store(

            key,

            value,

            layer

        );

    }

    async recall(

        query: string,

        layer?: MemoryKind

    ): Promise<void> {

        await this.manager.retrieve(

            query,

            layer

        );

    }

    async forget(

        key: string,

        layer?: MemoryKind

    ): Promise<void> {

        await this.manager.remove(

            key,

            layer

        );

    }

    get(

        key: string

    ): MemoryItem | undefined {

        return this.manager.get(

            key

        );

    }

}
