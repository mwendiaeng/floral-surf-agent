/**
 * agent/planner/PlannerService.ts
 */

import type {

    Goal,
    TaskNode,
    TaskStatus,

} from "../state/types";

import {

    PlannerStatus,

} from "../state/types";

import {

    createGoal,
    createTaskNode,

} from "../state/defaults";

import type {

    PlannerManager,

} from "../state/manager/PlannerManager";

/* -------------------------------------------------------------------------- */
/* Planner Service                                                            */
/* -------------------------------------------------------------------------- */

export class PlannerService {

    constructor(

        private readonly manager: PlannerManager

    ) { }

    get state() {

        return this.manager.state;

    }

    get readyTasks(): TaskNode[] {

        return this.manager.readyTasks;

    }

    get isComplete(): boolean {

        return this.manager.isComplete;

    }

    async createGoal(

        title: string,

        description?: string

    ): Promise<Goal> {

        const goal =

            createGoal(

                title

            );

        goal.description = description;

        await this.manager.plan(

            title,

            description

        );

        return goal;

    }

    async createTask(

        title: string

    ): Promise<TaskNode> {

        const task =

            createTaskNode(

                title

            );

        return task;

    }

    async start(): Promise<void> {

        this.manager.previewSetStatus(

            PlannerStatus.Executing

        );

    }

    async complete(): Promise<void> {

        this.manager.previewSetStatus(

            PlannerStatus.Completed

        );

    }

    markTaskRunning(

        taskId: string

    ): TaskStatus {

        return "running" as TaskStatus;

    }

}
