/**
 * agent/state/manager/PlannerManager.ts
 */

import type {

    Goal,
    PlannerState,
    StoredEvent,
    TaskNode,
    TaskStatus,

} from "../types";

import {

    createPlanningEvent,

} from "../events";

import {

    addDependency,
    addGoal,
    addTask,
    completeGoal,
    getReadyTasks,
    isGraphComplete,
    setPlannerStatus,
    updateGoal,
    updateTaskStatus,

} from "../reducers/planner";

import {

    PlannerStatus,

} from "../types";

/* -------------------------------------------------------------------------- */
/* Planner Manager                                                            */
/* -------------------------------------------------------------------------- */

export class PlannerManager {

    constructor(

        private readonly manager: {

            getState(): Readonly<{ planner: PlannerState }>;

            dispatch(event: StoredEvent): Promise<void>;

        }

    ) { }

    get state(): PlannerState {

        return this.manager.getState().planner;

    }

    get goals(): readonly Goal[] {

        return this.state.goals;

    }

    get tasks(): readonly TaskNode[] {

        return this.state.tasks;

    }

    get readyTasks(): TaskNode[] {

        return getReadyTasks(

            this.state

        );

    }

    get isComplete(): boolean {

        return isGraphComplete(

            this.state

        );

    }

    async plan(

        goal: string,

        plan?: string

    ): Promise<void> {

        await this.manager.dispatch(

            createPlanningEvent(

                goal,

                plan

            )

        );

    }

    previewAddGoal(

        goal: Goal

    ): PlannerState {

        return addGoal(

            this.state,

            goal

        );

    }

    previewUpdateGoal(

        goal: Goal

    ): PlannerState {

        return updateGoal(

            this.state,

            goal

        );

    }

    previewCompleteGoal(

        goalId: string

    ): PlannerState {

        return completeGoal(

            this.state,

            goalId

        );

    }

    previewAddTask(

        task: TaskNode

    ): PlannerState {

        return addTask(

            this.state,

            task

        );

    }

    previewAddDependency(

        fromId: string,

        toId: string,

        condition?: string

    ): PlannerState {

        return addDependency(

            this.state,

            fromId,

            toId,

            condition

        );

    }

    previewUpdateTaskStatus(

        taskId: string,

        status: TaskStatus,

        error?: string

    ): PlannerState {

        return updateTaskStatus(

            this.state,

            taskId,

            status,

            error

        );

    }

    previewSetStatus(

        status: PlannerStatus

    ): PlannerState {

        return setPlannerStatus(

            this.state,

            status

        );

    }

}
