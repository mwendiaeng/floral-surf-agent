/**
 * agent/state/manager/RuntimeManager.ts
 */

import type {

    AgentStatus,
    RuntimeState,
    StoredEvent,

} from "../types";

import {

    createSystemEvent,

} from "../events";

import {

    cancel,
    complete,
    fail,
    removeContextValue,
    setContextValue,
    setStatus,
    touch,

} from "../reducers/runtime";

/* -------------------------------------------------------------------------- */
/* Runtime Manager                                                            */
/* -------------------------------------------------------------------------- */

export class RuntimeManager {

    constructor(

        private readonly manager: {

            getState(): Readonly<{ runtime: RuntimeState }>;

            dispatch(event: StoredEvent): Promise<void>;

        }

    ) { }

    get state(): RuntimeState {

        return this.manager.getState().runtime;

    }

    get status(): AgentStatus {

        return this.state.status;

    }

    get context() {

        return this.state.context;

    }

    get statistics() {

        return this.state.statistics;

    }

    async log(

        message: string,

        level: "debug" | "info" | "warning" | "error" = "info"

    ): Promise<void> {

        await this.manager.dispatch(

            createSystemEvent(

                level,

                message

            )

        );

    }

    previewSetStatus(

        status: AgentStatus

    ): RuntimeState {

        return setStatus(

            this.state,

            status

        );

    }

    previewSetContext(

        key: string,

        value: unknown

    ): RuntimeState {

        return setContextValue(

            this.state,

            key,

            value

        );

    }

    previewRemoveContext(

        key: string

    ): RuntimeState {

        return removeContextValue(

            this.state,

            key

        );

    }

    previewTouch(): RuntimeState {

        return touch(

            this.state

        );

    }

    previewComplete(): RuntimeState {

        return complete(

            this.state

        );

    }

    previewFail(

        error: Error

    ): RuntimeState {

        return fail(

            this.state,

            error

        );

    }

    previewCancel(): RuntimeState {

        return cancel(

            this.state

        );

    }

}
