/**
 * agent/state/middleware/PluginMiddleware.ts
 */

import type {

    StatePlugin,

} from "../types";

import type {

    DispatchContext,
    Middleware,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Plugin                                                                     */
/* -------------------------------------------------------------------------- */

export interface PluginDispatchHooks {

    onBeforeDispatch?(

        context: DispatchContext

    ): Promise<void> | void;

    onAfterDispatch?(

        context: DispatchContext

    ): Promise<void> | void;

}

export type ExtendedStatePlugin =

    StatePlugin & PluginDispatchHooks;

export class PluginMiddleware implements Middleware {

    readonly name = "plugin";

    private readonly plugins: ExtendedStatePlugin[] = [];

    constructor(

        plugins: readonly ExtendedStatePlugin[] = []

    ) {

        this.plugins.push(

            ...plugins

        );

    }

    register(

        plugin: ExtendedStatePlugin

    ): void {

        this.plugins.push(

            plugin

        );

    }

    unregister(

        name: string

    ): void {

        const index =

            this.plugins.findIndex(

                plugin =>

                    plugin.name === name

            );

        if (

            index >= 0

        ) {

            this.plugins.splice(

                index,

                1

            );

        }

    }

    list(): readonly ExtendedStatePlugin[] {

        return this.plugins;

    }

    async initializeAll(): Promise<void> {

        for (

            const plugin of this.plugins

        ) {

            await plugin.initialize?.();

        }

    }

    async destroyAll(): Promise<void> {

        for (

            const plugin of this.plugins

        ) {

            await plugin.destroy?.();

        }

    }

    async before(

        context: DispatchContext

    ): Promise<void> {

        for (

            const plugin of this.plugins

        ) {

            await plugin.onBeforeDispatch?.(

                context

            );

        }

    }

    async after(

        context: DispatchContext

    ): Promise<void> {

        for (

            const plugin of this.plugins

        ) {

            await plugin.onAfterDispatch?.(

                context

            );

        }

    }

}
