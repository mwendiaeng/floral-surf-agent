/**
 * agent/state/utils/validation.ts
 */

import type {

    AgentMessage,
    AgentState,
    ExecutionEvent,
    Goal,
    MemoryItem,
    TaskNode,

} from "../types";

/* -------------------------------------------------------------------------- */
/* Validation Result                                                          */
/* -------------------------------------------------------------------------- */

export interface ValidationResult {

    valid: boolean;

    errors: string[];

}

function success(): ValidationResult {

    return {

        valid: true,

        errors: [],

    };

}

function failure(

    error: string

): ValidationResult {

    return {

        valid: false,

        errors: [error],

    };

}

function merge(

    ...results: ValidationResult[]

): ValidationResult {

    const errors =

        results.flatMap(

            r => r.errors

        );

    return {

        valid:

            errors.length === 0,

        errors,

    };

}

/* -------------------------------------------------------------------------- */
/* Primitive                                                                  */
/* -------------------------------------------------------------------------- */

export function isObject(

    value: unknown

): value is Record<string, unknown> {

    return (

        value !== null &&

        typeof value === "object"

    );

}

export function isString(

    value: unknown

): value is string {

    return typeof value === "string";

}

export function isNumber(

    value: unknown

): value is number {

    return (

        typeof value === "number" &&

        Number.isFinite(value)

    );

}

/* -------------------------------------------------------------------------- */
/* ID                                                                         */
/* -------------------------------------------------------------------------- */

export function validateId(

    id: unknown,

    name = "id"

): ValidationResult {

    if (

        !isString(id)

    ) {

        return failure(

            `${name} must be a string.`

        );

    }

    if (

        id.trim().length === 0

    ) {

        return failure(

            `${name} cannot be empty.`

        );

    }

    return success();

}

/* -------------------------------------------------------------------------- */
/* Message                                                                    */
/* -------------------------------------------------------------------------- */

export function validateMessage(

    message: AgentMessage

): ValidationResult {

    return merge(

        validateId(

            message.id,

            "message.id"

        ),

        isString(

            message.content

        )

            ? success()

            : failure(

                "message.content must be a string."

            )

    );

}

/* -------------------------------------------------------------------------- */
/* Event                                                                      */
/* -------------------------------------------------------------------------- */

export function validateEvent(

    event: ExecutionEvent

): ValidationResult {

    return merge(

        validateId(

            event.id,

            "event.id"

        ),

        isNumber(

            event.timestamp

        )

            ? success()

            : failure(

                "event.timestamp must be numeric."

            ),

        isNumber(

            event.startedAt

        )

            ? success()

            : failure(

                "event.startedAt missing."

            )

    );

}

/* -------------------------------------------------------------------------- */
/* Planner                                                                    */
/* -------------------------------------------------------------------------- */

export function validateGoal(

    goal: Goal

): ValidationResult {

    return merge(

        validateId(

            goal.id,

            "goal.id"

        ),

        goal.title.length > 0

            ? success()

            : failure(

                "Goal title required."

            )

    );

}

export function validateTask(

    task: TaskNode

): ValidationResult {

    return merge(

        validateId(

            task.id,

            "task.id"

        ),

        task.title.length > 0

            ? success()

            : failure(

                "Task title required."

            )

    );

}

/* -------------------------------------------------------------------------- */
/* Memory                                                                     */
/* -------------------------------------------------------------------------- */

export function validateMemory(

    item: MemoryItem

): ValidationResult {

    return merge(

        validateId(

            item.id,

            "memory.id"

        ),

        item.key.length > 0

            ? success()

            : failure(

                "Memory key required."

            )

    );

}

/* -------------------------------------------------------------------------- */
/* State                                                                      */
/* -------------------------------------------------------------------------- */

export function validateState(

    state: AgentState

): ValidationResult {

    const results: ValidationResult[] = [];

    for (

        const message of state.conversation.messages

    ) {

        results.push(

            validateMessage(

                message

            )

        );

    }

    for (

        const event of state.execution.events

    ) {

        results.push(

            validateEvent(

                event

            )

        );

    }

    for (

        const goal of state.planner.goals

    ) {

        results.push(

            validateGoal(

                goal

            )

        );

    }

    for (

        const task of state.planner.tasks

    ) {

        results.push(

            validateTask(

                task

            )

        );

    }

    for (

        const memory of Object.values(

            state.memory.working

        )

    ) {

        results.push(

            validateMemory(

                memory

            )

        );

    }

    for (

        const memory of [

            ...state.memory.episodic,

            ...state.memory.semantic,

            ...state.memory.procedural,

        ]

    ) {

        results.push(

            validateMemory(

                memory

            )

        );

    }

    return merge(

        ...results

    );

}

/* -------------------------------------------------------------------------- */
/* Assertion                                                                  */
/* -------------------------------------------------------------------------- */

export function assertValidState(

    state: AgentState

): void {

    const result =

        validateState(

            state

        );

    if (

        !result.valid

    ) {

        throw new Error(

            result.errors.join("\n")

        );

    }

}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {

    validateId,

    validateMessage,

    validateEvent,

    validateGoal,

    validateTask,

    validateMemory,

    validateState,

    assertValidState,

};