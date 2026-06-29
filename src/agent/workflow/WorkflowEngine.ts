/**
 * agent/workflow/WorkflowEngine.ts
 */

import type {

    WorkflowDefinition,
    WorkflowNode,

} from "../state/types";

import {

    WorkflowNodeStatus,

} from "../state/types";

import type {

    WorkflowContext,
    WorkflowNodeHandler,
    WorkflowRunResult,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Workflow Engine                                                            */
/* -------------------------------------------------------------------------- */

export class WorkflowEngine {

    private readonly handlers =

        new Map<string, WorkflowNodeHandler>();

    register(

        name: string,

        handler: WorkflowNodeHandler

    ): this {

        this.handlers.set(

            name,

            handler

        );

        return this;

    }

    async run(

        workflow: WorkflowDefinition,

        context: WorkflowContext

    ): Promise<WorkflowRunResult> {

        const outputs: Record<string, unknown> =

            {};

        const order =

            this.topologicalSort(

                workflow

            );

        try {

            for (

                const node of order

            ) {

                const handler =

                    this.handlers.get(

                        node.name

                    );

                if (

                    !handler

                ) {

                    throw new Error(

                        `No handler for workflow node: ${node.name}`

                    );

                }

                node.status =

                    WorkflowNodeStatus.Running;

                outputs[node.id] =

                    await handler(

                        node,

                        context

                    );

                node.status =

                    WorkflowNodeStatus.Completed;

            }

            return {

                workflow,

                outputs,

                completed: true,

            };

        }

        catch (

            error

        ) {

            return {

                workflow,

                outputs,

                completed: false,

                error:

                    error instanceof Error

                        ? error.message

                        : String(error),

            };

        }

    }

    private topologicalSort(

        workflow: WorkflowDefinition

    ): WorkflowNode[] {

        const nodes =

            new Map(

                workflow.nodes.map(

                    node => [

                        node.id,

                        { ...node },

                    ]

                )

            );

        const incoming =

            new Map<string, number>();

        for (

            const node of nodes.values()

        ) {

            incoming.set(

                node.id,

                0

            );

        }

        for (

            const edge of workflow.edges

        ) {

            incoming.set(

                edge.to,

                (incoming.get(

                    edge.to

                ) ?? 0) + 1

            );

        }

        const queue =

            [...incoming.entries()]

                .filter(([, count]) =>

                    count === 0

                )

                .map(([id]) =>

                    nodes.get(id)!

                );

        const sorted: WorkflowNode[] = [];

        while (

            queue.length > 0

        ) {

            const node =

                queue.shift()!;

            sorted.push(

                node

            );

            for (

                const edge of workflow.edges

            ) {

                if (

                    edge.from !== node.id

                ) {

                    continue;

                }

                const count =

                    (incoming.get(

                        edge.to

                    ) ?? 1) - 1;

                incoming.set(

                    edge.to,

                    count

                );

                if (

                    count === 0

                ) {

                    const next =

                        nodes.get(

                            edge.to

                        );

                    if (

                        next

                    ) {

                        queue.push(

                            next

                        );

                    }

                }

            }

        }

        return sorted.length > 0

            ? sorted

            : [...nodes.values()];

    }

}
