/**
 * agent/state/manager/ConversationManager.ts
 */

import type {

    AgentMessage,
    ConversationState,
    RetrievedDocument,
    StateManager,
    StoredEvent,

} from "../types";

import {

    createMessageEvent,

} from "../events";

import {

    appendMessage,
    addDocument,
    clearDocuments,
    clearMessages,
    removeMessage,
    replaceMessage,
    setVariable,
    removeVariable,

} from "../reducers/conversation";

/* -------------------------------------------------------------------------- */
/* Conversation Manager                                                       */
/* -------------------------------------------------------------------------- */

export class ConversationManager {

    constructor(

        private readonly manager: {

            getState(): Readonly<{ conversation: ConversationState }>;

            dispatch(event: StoredEvent): Promise<void>;

        }

    ) { }

    get state(): ConversationState {

        return this.manager.getState().conversation;

    }

    get messages(): readonly AgentMessage[] {

        return this.state.messages;

    }

    get documents(): readonly RetrievedDocument[] {

        return this.state.documents;

    }

    get variables(): Readonly<Record<string, unknown>> {

        return this.state.variables;

    }

    async append(

        message: AgentMessage

    ): Promise<void> {

        await this.manager.dispatch(

            createMessageEvent(

                message

            )

        );

    }

    previewAppend(

        message: AgentMessage

    ): ConversationState {

        return appendMessage(

            this.state,

            message

        );

    }

    previewReplace(

        message: AgentMessage

    ): ConversationState {

        return replaceMessage(

            this.state,

            message

        );

    }

    previewRemove(

        id: string

    ): ConversationState {

        return removeMessage(

            this.state,

            id

        );

    }

    previewClear(): ConversationState {

        return clearMessages(

            this.state

        );

    }

    previewAddDocument(

        document: RetrievedDocument

    ): ConversationState {

        return addDocument(

            this.state,

            document

        );

    }

    previewClearDocuments(): ConversationState {

        return clearDocuments(

            this.state

        );

    }

    previewSetVariable(

        key: string,

        value: unknown

    ): ConversationState {

        return setVariable(

            this.state,

            key,

            value

        );

    }

    previewRemoveVariable(

        key: string

    ): ConversationState {

        return removeVariable(

            this.state,

            key

        );

    }

}
