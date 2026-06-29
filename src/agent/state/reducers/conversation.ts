/**
 * agent/state/reducers/conversation.ts
 */

import type {

    AgentMessage,
    ConversationState,
    MessageEvent,
    StoredEvent,
    RetrievedDocument,

} from "../types";

import {

    ExecutionEventType,

} from "../types";

/* -------------------------------------------------------------------------- */
/* Clone                                                                      */
/* -------------------------------------------------------------------------- */

function cloneConversation(

    conversation: ConversationState

): ConversationState {

    return {

        ...conversation,

        messages: [

            ...conversation.messages,

        ],

        documents: [

            ...conversation.documents,

        ],

        variables: {

            ...conversation.variables,

        },

    };

}

/* -------------------------------------------------------------------------- */
/* Message                                                                    */
/* -------------------------------------------------------------------------- */

export function appendMessage(

    conversation: ConversationState,

    message: AgentMessage

): ConversationState {

    const next =

        cloneConversation(

            conversation

        );

    next.messages.push(

        message

    );

    return next;

}

export function replaceMessage(

    conversation: ConversationState,

    message: AgentMessage

): ConversationState {

    const index =

        conversation.messages.findIndex(

            m => m.id === message.id

        );

    if (

        index < 0

    ) {

        return conversation;

    }

    const next =

        cloneConversation(

            conversation

        );

    next.messages[index] =

        message;

    return next;

}

export function removeMessage(

    conversation: ConversationState,

    id: string

): ConversationState {

    const next =

        cloneConversation(

            conversation

        );

    next.messages =

        next.messages.filter(

            m => m.id !== id

        );

    return next;

}

export function clearMessages(

    conversation: ConversationState

): ConversationState {

    const next =

        cloneConversation(

            conversation

        );

    next.messages = [];

    return next;

}

/* -------------------------------------------------------------------------- */
/* Documents                                                                  */
/* -------------------------------------------------------------------------- */

export function addDocument(

    conversation: ConversationState,

    document: RetrievedDocument

): ConversationState {

    const next =

        cloneConversation(

            conversation

        );

    next.documents.push(

        document

    );

    return next;

}

export function clearDocuments(

    conversation: ConversationState

): ConversationState {

    const next =

        cloneConversation(

            conversation

        );

    next.documents = [];

    return next;

}

/* -------------------------------------------------------------------------- */
/* Variables                                                                  */
/* -------------------------------------------------------------------------- */

export function setVariable(

    conversation: ConversationState,

    key: string,

    value: unknown

): ConversationState {

    const next =

        cloneConversation(

            conversation

        );

    next.variables[key] =

        value;

    return next;

}

export function removeVariable(

    conversation: ConversationState,

    key: string

): ConversationState {

    const next =

        cloneConversation(

            conversation

        );

    delete next.variables[key];

    return next;

}

/* -------------------------------------------------------------------------- */
/* Reducer                                                                    */
/* -------------------------------------------------------------------------- */

export function conversationReducer(

    conversation: ConversationState,

    stored: StoredEvent

): ConversationState {

    const event =

        stored.event;

    switch (

        event.type

    ) {

        case ExecutionEventType.Message:

            return appendMessage(

                conversation,

                (event as MessageEvent).message

            );

        default:

            return conversation;

    }

}

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

export default conversationReducer;
