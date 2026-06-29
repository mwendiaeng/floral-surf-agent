/**
 * agent/runtime/RuntimeService.ts
 */

import type {

    AgentStatus,

} from "../state/types";

import {

    AgentStatus as Status,

} from "../state/types";

import type {

    RuntimeManager,

} from "../state/manager/RuntimeManager";

/* -------------------------------------------------------------------------- */
/* Runtime Service                                                            */
/* -------------------------------------------------------------------------- */

export class RuntimeService {

    constructor(

        private readonly manager: RuntimeManager

    ) { }

    get state() {

        return this.manager.state;

    }

    get status(): AgentStatus {

        return this.manager.status;

    }

    get sessionId(): string {

        return this.manager.state.sessionId;

    }

    async setModel(

        provider: string,

        model: string

    ): Promise<void> {

        this.manager.previewSetContext(

            "currentProvider",

            provider

        );

        this.manager.previewSetContext(

            "currentModel",

            model

        );

    }

    async setTool(

        tool: string

    ): Promise<void> {

        this.manager.previewSetContext(

            "currentTool",

            tool

        );

    }

    async markRunning(): Promise<void> {

        this.manager.previewSetStatus(

            Status.Streaming

        );

    }

    async markIdle(): Promise<void> {

        this.manager.previewSetStatus(

            Status.Idle

        );

    }

    async markFinished(): Promise<void> {

        this.manager.previewSetStatus(

            Status.Completed

        );

    }

    async markError(

        error: Error

    ): Promise<void> {

        this.manager.previewFail(

            error

        );

    }

    async touch(): Promise<void> {

        this.manager.previewTouch();

    }

}
