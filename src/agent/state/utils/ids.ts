/**
 * agent/state/utils/ids.ts
 *
 * ID generation utilities.
 */

import type {

    ActionId,
    AgentId,
    CheckpointId,
    MessageId,
    SessionId,
    ToolCallId,

} from "../types";

/* -------------------------------------------------------------------------- */
/* UUID                                                                       */
/* -------------------------------------------------------------------------- */

function uuid(): string {

    if (

        typeof crypto !== "undefined" &&

        "randomUUID" in crypto

    ) {

        return crypto.randomUUID();

    }

    return (

        Date.now().toString(36) +

        "-" +

        Math.random()

            .toString(36)

            .substring(2, 12)

    );

}

/* -------------------------------------------------------------------------- */
/* Prefix                                                                     */
/* -------------------------------------------------------------------------- */

function prefixed(

    prefix: string

): string {

    return `${prefix}_${uuid()}`;

}

/* -------------------------------------------------------------------------- */
/* Agent                                                                      */
/* -------------------------------------------------------------------------- */

export function createAgentId(): AgentId {

    return prefixed(

        "agent"

    ) as AgentId;

}

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

export function createSessionId(): SessionId {

    return prefixed(

        "session"

    ) as SessionId;

}

/* -------------------------------------------------------------------------- */
/* Message                                                                    */
/* -------------------------------------------------------------------------- */

export function createMessageId(): MessageId {

    return prefixed(

        "msg"

    ) as MessageId;

}

/* -------------------------------------------------------------------------- */
/* Action                                                                     */
/* -------------------------------------------------------------------------- */

export function createActionId(): ActionId {

    return prefixed(

        "action"

    ) as ActionId;

}

/* -------------------------------------------------------------------------- */
/* Tool                                                                       */
/* -------------------------------------------------------------------------- */

export function createToolCallId(): ToolCallId {

    return prefixed(

        "tool"

    ) as ToolCallId;

}

/* -------------------------------------------------------------------------- */
/* Checkpoint                                                                 */
/* -------------------------------------------------------------------------- */

export function createCheckpointId(): CheckpointId {

    return prefixed(

        "checkpoint"

    ) as CheckpointId;

}

/* -------------------------------------------------------------------------- */
/* Generic                                                                     */
/* -------------------------------------------------------------------------- */

export function createId(

    prefix = "id"

): string {

    return prefixed(

        prefix

    );

}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

export function isId(

    value: unknown

): value is string {

    return (

        typeof value === "string" &&

        value.length > 0

    );

}

/* -------------------------------------------------------------------------- */
/* Parsing                                                                    */
/* -------------------------------------------------------------------------- */

export function getPrefix(

    id: string

): string | undefined {

    const index =

        id.indexOf("_");

    if (

        index === -1

    ) {

        return;

    }

    return id.slice(

        0,

        index

    );

}

export function getRawId(

    id: string

): string {

    const index =

        id.indexOf("_");

    if (

        index === -1

    ) {

        return id;

    }

    return id.slice(

        index + 1

    );

}

/* -------------------------------------------------------------------------- */
/* Batch                                                                      */
/* -------------------------------------------------------------------------- */

export function createIds(

    count: number,

    prefix = "id"

): string[] {

    return Array.from(

        {

            length: count,

        },

        () =>

            createId(

                prefix

            )

    );

}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {

    createId,

    createIds,

    createAgentId,

    createSessionId,

    createMessageId,

    createActionId,

    createToolCallId,

    createCheckpointId,

    isId,

    getPrefix,

    getRawId,

};