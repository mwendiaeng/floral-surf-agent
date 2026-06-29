/**
 * agent/state/observers/subscriptions.ts
 */

import type {

    Subscription,

} from "../types";

/* -------------------------------------------------------------------------- */
/* Subscription Group                                                         */
/* -------------------------------------------------------------------------- */

export class SubscriptionGroup implements Subscription {

    private readonly subscriptions: Subscription[] = [];

    add(

        subscription: Subscription

    ): this {

        this.subscriptions.push(

            subscription

        );

        return this;

    }

    unsubscribe(): void {

        for (

            const subscription of this.subscriptions

        ) {

            subscription.unsubscribe();

        }

        this.subscriptions.length = 0;

    }

    get size(): number {

        return this.subscriptions.length;

    }

}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function composeSubscriptions(

    ...subscriptions: Subscription[]

): Subscription {

    const group =

        new SubscriptionGroup();

    for (

        const subscription of subscriptions

    ) {

        group.add(

            subscription

        );

    }

    return group;

}

export function noopSubscription(): Subscription {

    return {

        unsubscribe() {},

    };

}
