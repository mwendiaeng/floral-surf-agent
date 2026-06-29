/**
 * agent/state/observers/emitter.ts
 */

import type {

    AgentState,
    StateObserver,
    StoredEvent,
    Subscription,

} from "../types";

import {

    ObserverManager,

} from "../manager/ObserverManager";

import type {

    ObserverEvent,

} from "./events";

import {

    createEventDispatchedEvent,
    createObserverErrorEvent,
    createStateChangedEvent,

} from "./events";

/* -------------------------------------------------------------------------- */
/* Listener                                                                   */
/* -------------------------------------------------------------------------- */

export type ObserverEventListener = (

    event: ObserverEvent

) => Promise<void> | void;

/* -------------------------------------------------------------------------- */
/* Emitter                                                                    */
/* -------------------------------------------------------------------------- */

export class StateEmitter {

    private readonly manager =

        new ObserverManager();

    private readonly listeners =

        new Set<ObserverEventListener>();

    subscribe(

        observer: StateObserver

    ): Subscription {

        return this.manager.subscribe(

            observer

        );

    }

    on(

        listener: ObserverEventListener

    ): Subscription {

        this.listeners.add(

            listener

        );

        return {

            unsubscribe: () => {

                this.listeners.delete(

                    listener

                );

            },

        };

    }

    async emitState(

        state: AgentState

    ): Promise<void> {

        const event =

            createStateChangedEvent(

                state

            );

        await this.dispatch(

            event

        );

        await this.manager.notifyState(

            state

        );

    }

    async emitStoredEvent(

        stored: StoredEvent

    ): Promise<void> {

        const event =

            createEventDispatchedEvent(

                stored

            );

        await this.dispatch(

            event

        );

        await this.manager.notifyEvent(

            stored

        );

    }

    private async dispatch(

        event: ObserverEvent

    ): Promise<void> {

        const errors: unknown[] = [];

        for (

            const listener of this.listeners

        ) {

            try {

                await listener(

                    event

                );

            }

            catch (

                error

            ) {

                errors.push(

                    error

                );

            }

        }

        if (

            errors.length > 0

        ) {

            for (

                const error of errors

            ) {

                await this.dispatch(

                    createObserverErrorEvent(

                        error

                    )

                );

            }

        }

    }

    clear(): void {

        this.manager.clear();

        this.listeners.clear();

    }

    get observerCount(): number {

        return this.manager.size;

    }

    get listenerCount(): number {

        return this.listeners.size;

    }

}

export function createStateEmitter(): StateEmitter {

    return new StateEmitter();

}

export {

    SubscriptionGroup,

    composeSubscriptions,

} from "./subscriptions";
