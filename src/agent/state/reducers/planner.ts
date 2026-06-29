/**
 * agent/state/reducers/planner.ts
 */

import type {
    PlannerState,
    Goal,
    PlanningEvent,
    StoredEvent,
    TaskNode,

} from "../types";

import {

    ExecutionEventType,
    GoalStatus,
    PlannerStatus,
    TaskStatus,

} from "../types";

import {

    now,

} from "../utils/timestamps";

import {

    createPlannerGraph,

} from "../defaults";

/* -------------------------------------------------------------------------- */
/* Clone                                                                      */
/* -------------------------------------------------------------------------- */

function clonePlanner(

    planner: PlannerState

): PlannerState {

    return {

        ...planner,

        goals: [

            ...planner.goals,

        ],

        completedGoals: [

            ...planner.completedGoals,

        ],

        tasks: [

            ...planner.tasks,

        ],

        dependencies: [

            ...planner.dependencies,

        ],

        graph: {

            nodes: [

                ...planner.graph.nodes,

            ],

            edges: [

                ...planner.graph.edges,

            ],

        },

    };

}

/* -------------------------------------------------------------------------- */
/* Planner Status                                                             */
/* -------------------------------------------------------------------------- */

export function setPlannerStatus(

    planner: PlannerState,

    status: PlannerStatus

): PlannerState {

    if (

        planner.status === status

    ) {

        return planner;

    }

    return {

        ...planner,

        status,

    };

}

/* -------------------------------------------------------------------------- */
/* Goals                                                                      */
/* -------------------------------------------------------------------------- */

export function addGoal(

    planner: PlannerState,

    goal: Goal

): PlannerState {

    const next =

        clonePlanner(planner);

    next.goals.push(goal);

    return next;

}

export function updateGoal(

    planner: PlannerState,

    goal: Goal

): PlannerState {

    const next =

        clonePlanner(planner);

    const index =

        next.goals.findIndex(

            g => g.id === goal.id

        );

    if (

        index >= 0

    ) {

        next.goals[index] = goal;

    }

    return next;

}

export function completeGoal(

    planner: PlannerState,

    goalId: string

): PlannerState {

    const next =

        clonePlanner(planner);

    const index =

        next.goals.findIndex(

            g => g.id === goalId

        );

    if (

        index === -1

    ) {

        return next;

    }

    const goal = {

        ...next.goals[index],

        status: GoalStatus.Completed,

        updatedAt: now(),

    };

    next.goals.splice(

        index,

        1

    );

    next.completedGoals.push(

        goal

    );

    return next;

}

/* -------------------------------------------------------------------------- */
/* DAG Operations                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Add a task node to the planner graph.
 * The node starts in `Pending` status and is also
 * added to the flat `tasks` list for quick iteration.
 */
export function addTask(

    planner: PlannerState,

    task: TaskNode

): PlannerState {

    const next =

        clonePlanner(planner);

    next.tasks.push(task);

    next.graph.nodes.push(task);

    // If the task has no inbound dependencies it's ready to run
    const hasDependencies =

        next.dependencies.some(

            d => d.to === task.id

        );

    if (

        !hasDependencies

    ) {

        const idx =

            next.graph.nodes.findIndex(

                n => n.id === task.id

            );

        if (

            idx >= 0

        ) {

            next.graph.nodes[idx] = {

                ...next.graph.nodes[idx],

                status: TaskStatus.Ready,

            };

        }

        const taskIdx =

            next.tasks.findIndex(

                t => t.id === task.id

            );

        if (

            taskIdx >= 0

        ) {

            next.tasks[taskIdx] =

                next.graph.nodes[idx];

        }

    }

    return next;

}

/**
 * Add a dependency edge between two tasks.
 * `from` must complete before `to` can run.
 *
 * After adding the edge, re-evaluates the `to` task:
 * if all its ancestors are complete, it transitions
 * to `Ready`.
 */
export function addDependency(

    planner: PlannerState,

    fromId: string,

    toId: string,

    condition?: string

): PlannerState {

    const next =

        clonePlanner(planner);

    next.dependencies.push({

        from: fromId,

        to: toId,

        condition,

    });

    next.graph.edges.push({

        from: fromId,

        to: toId,

        condition,

    });

    // Re-evaluate the downstream task readiness
    const ancestors =

        next.dependencies.filter(

            d => d.to === toId

        );

    const allComplete =

        ancestors.every(a => {

            const node =

                next.graph.nodes.find(

                    n => n.id === a.from

                );

            return node?.status ===

                TaskStatus.Completed;

        });

    if (

        allComplete

    ) {

        const idx =

            next.graph.nodes.findIndex(

                n => n.id === toId

            );

        if (

            idx >= 0 &&

            next.graph.nodes[idx].status ===

                TaskStatus.Pending

        ) {

            next.graph.nodes[idx] = {

                ...next.graph.nodes[idx],

                status: TaskStatus.Ready,

            };

            const taskIdx =

                next.tasks.findIndex(

                    t => t.id === toId

                );

            if (

                taskIdx >= 0

            ) {

                next.tasks[taskIdx] =

                    next.graph.nodes[idx];

            }

        }

    }

    return next;

}

/**
 * Get all tasks whose dependencies are satisfied and
 * can be executed right now (topological frontier).
 */
export function getReadyTasks(

    planner: PlannerState

): TaskNode[] {

    return planner.graph.nodes.filter(

        n => n.status === TaskStatus.Ready

    );

}

/**
 * Check whether all tasks in the graph have
 * reached a terminal status.
 */
export function isGraphComplete(

    planner: PlannerState

): boolean {

    if (

        planner.graph.nodes.length === 0

    ) {

        return false;

    }

    return planner.graph.nodes.every(

        n =>

            n.status === TaskStatus.Completed ||

            n.status === TaskStatus.Failed ||

            n.status === TaskStatus.Skipped ||

            n.status === TaskStatus.Cancelled

    );

}

/**
 * Update the status of a single task node.
 * When a task is marked `Completed` it cascades:
 * downstream tasks re-check their ancestors.
 */
export function updateTaskStatus(

    planner: PlannerState,

    taskId: string,

    status: TaskStatus,

    error?: string

): PlannerState {

    const next =

        clonePlanner(planner);

    const nodeIdx =

        next.graph.nodes.findIndex(

            n => n.id === taskId

        );

    if (

        nodeIdx === -1

    ) {

        return next;

    }

    const node =

        next.graph.nodes[nodeIdx];

    const completedAt =

        status === TaskStatus.Completed ||

        status === TaskStatus.Failed

            ? now()

            : node.completedAt;

    const startedAt =

        status === TaskStatus.Running &&

        !node.startedAt

            ? now()

            : node.startedAt;

    const duration =

        completedAt && startedAt

            ? completedAt - startedAt

            : node.duration;

    const retryCount =

        status === TaskStatus.Failed

            ? node.retryCount + 1

            : node.retryCount;

    const updated: TaskNode = {

        ...node,

        status,

        retryCount,

        startedAt,

        completedAt,

        duration,

        error: error ?? node.error,

    };

    next.graph.nodes[nodeIdx] =

        updated;

    const taskIdx =

        next.tasks.findIndex(

            t => t.id === taskId

        );

    if (

        taskIdx >= 0

    ) {

        next.tasks[taskIdx] = updated;

    }

    // Cascade: when a task completes, re-evaluate its downstream
    if (

        status === TaskStatus.Completed

    ) {

        const downstream =

            next.dependencies.filter(

                d => d.from === taskId

            );

        for (

            const dep of downstream

        ) {

            const ancestors =

                next.dependencies.filter(

                    d => d.to === dep.to

                );

            const allComplete =

                ancestors.every(a => {

                    const n =

                        next.graph.nodes.find(

                            n2 =>

                                n2.id ===

                                a.from

                        );

                    return n?.status ===

                        TaskStatus.Completed;

                });

            if (

                allComplete

            ) {

                const toIdx =

                    next.graph.nodes.findIndex(

                        n =>

                            n.id === dep.to

                    );

                if (

                    toIdx >= 0 &&

                    next.graph.nodes[toIdx]

                        .status ===

                        TaskStatus.Pending

                ) {

                    next.graph.nodes[

                        toIdx

                    ] = {

                        ...next

                            .graph.nodes[toIdx],

                        status:

                            TaskStatus.Ready,

                    };

                    const tIdx =

                        next.tasks.findIndex(

                            t =>

                                t.id ===

                                dep.to

                        );

                    if (

                        tIdx >= 0

                    ) {

                        next.tasks[

                            tIdx

                        ] =

                            next

                                .graph.nodes[

                                toIdx

                            ];

                    }

                }

            }

        }

    }

    // Cascade: when a task fails, skip all downstream
    if (

        status === TaskStatus.Failed

    ) {

        const visited =

            new Set<string>();

        const queue =

            [taskId];

        while (

            queue.length > 0

        ) {

            const current =

                queue.shift()!;

            if (

                visited.has(current)

            ) {

                continue;

            }

            visited.add(current);

            const downstream =

                next.dependencies.filter(

                    d =>

                        d.from === current

                );

            for (

                const dep of downstream

            ) {

                const skipIdx =

                    next.graph.nodes.findIndex(

                        n =>

                            n.id === dep.to

                    );

                if (

                    skipIdx >= 0 &&

                    next.graph.nodes[

                        skipIdx

                    ].status ===

                        TaskStatus.Pending

                ) {

                    next.graph.nodes[

                        skipIdx

                    ] = {

                        ...next

                            .graph.nodes[

                            skipIdx

                        ],

                        status:

                            TaskStatus.Skipped,

                    };

                    const stIdx =

                        next.tasks.findIndex(

                            t =>

                                t.id ===

                                dep.to

                        );

                    if (

                        stIdx >= 0

                    ) {

                        next.tasks[

                            stIdx

                        ] =

                            next

                                .graph.nodes[

                                skipIdx

                            ];

                    }

                }

                queue.push(

                    dep.to

                );

            }

        }

    }

    // Cascade: when all tasks are terminal, set planner status
    if (

        status === TaskStatus.Completed ||

        status === TaskStatus.Failed

    ) {

        const allTerminal =

            next.graph.nodes.length > 0 &&

            next.graph.nodes.every(

                n =>

                    n.status ===

                        TaskStatus.Completed ||

                    n.status ===

                        TaskStatus.Failed ||

                    n.status ===

                        TaskStatus.Skipped ||

                    n.status ===

                        TaskStatus.Cancelled

            );

        if (

            allTerminal

        ) {

            next.status =

                PlannerStatus.Completed;

        }

    }

    return next;

}

/* -------------------------------------------------------------------------- */
/* Reducer                                                                    */
/* -------------------------------------------------------------------------- */

export function plannerReducer(

    planner: PlannerState,

    stored: StoredEvent

): PlannerState {

    const event =

        stored.event;

    if (

        event.type !==

        ExecutionEventType.Planning

    ) {

        return planner;

    }

    const planning =

        event as PlanningEvent;

    let next =

        setPlannerStatus(

            planner,

            PlannerStatus.Planning

        );

    if (

        planning.plan

    ) {

        // Store the raw plan text in the metadata
        // of the goal for traceability
        const goalIndex =

            next.goals.findIndex(

                g => g.title === planning.goal

            );

        if (

            goalIndex >= 0

        ) {

            const goals =

                [...next.goals];

            goals[goalIndex] = {

                ...goals[goalIndex],

                status: GoalStatus.Active,

                updatedAt: now(),

            };

            next = {

                ...next,

                goals,

            };

        }

    }

    return next;

}

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

export default plannerReducer;