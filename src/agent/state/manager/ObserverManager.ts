/**
 * ObserverManager.ts
 */

import type {

    AgentState,
    StateObserver,
    StoredEvent,
    Subscription,

} from "../types";

export class ObserverManager {

    private readonly observers =

        new Set<StateObserver>();

    /* ---------------------------------------------------------------------- */
    /* Subscription                                                            */
    /* ---------------------------------------------------------------------- */

    subscribe(

        observer: StateObserver

    ): Subscription {

        this.observers.add(

            observer

        );

        return {

            unsubscribe: () => {

                this.unsubscribe(

                    observer

                );

            },

        };

    }

    unsubscribe(

        observer: StateObserver

    ): void {

        this.observers.delete(

            observer

        );

    }

    clear(): void {

        this.observers.clear();

    }

    get size(): number {

        return this.observers.size;

    }

    has(

        observer: StateObserver

    ): boolean {

        return this.observers.has(

            observer

        );

    }

    /* ---------------------------------------------------------------------- */
    /* Notifications                                                           */
    /* ---------------------------------------------------------------------- */

    async notifyEvent(

        event: StoredEvent

    ): Promise<void> {

        await this.notify(

            observer =>

                observer.onEvent?.(

                    event

                )

        );

    }

    async notifyState(

        state: AgentState

    ): Promise<void> {

        await this.notify(

            observer =>

                observer.onStateChanged?.(

                    state

                )

        );

    }

    /* ---------------------------------------------------------------------- */
    /* Internal                                                                */
    /* ---------------------------------------------------------------------- */

    private async notify(

        callback: (

            observer: StateObserver

        ) => Promise<void> | void

    ): Promise<void> {

        const errors: unknown[] = [];

        for (

            const observer of this.observers

        ) {

            try {

                await callback(

                    observer

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

            console.error(

                "[ObserverManager]",

                errors

            );

        }

    }

}