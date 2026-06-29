/**
 * agent/state/manager/StatisticsManager.ts
 */

import type {

    ExecutionState,
    RuntimeState,

} from "../types";

/* -------------------------------------------------------------------------- */
/* Statistics Manager                                                         */
/* -------------------------------------------------------------------------- */

export class StatisticsManager {

    constructor(

        private readonly manager: {

            getState(): Readonly<{

                execution: ExecutionState;

                runtime: RuntimeState;

            }>;

        }

    ) { }

    get execution() {

        return this.manager.getState().execution.statistics;

    }

    get runtime() {

        return this.manager.getState().runtime.statistics;

    }

    get totalTokens(): number {

        return this.runtime.totalTokens;

    }

    get estimatedCost(): number {

        return this.runtime.estimatedCost;

    }

    get toolCalls(): number {

        return this.execution.toolCalls;

    }

    get modelCalls(): number {

        return this.execution.modelCalls;

    }

    get iterations(): number {

        return this.execution.iterations;

    }

    snapshot() {

        return {

            execution: {

                ...this.execution,

                tokenUsage: {

                    ...this.execution.tokenUsage,

                },

            },

            runtime: {

                ...this.runtime,

            },

        };

    }

}
