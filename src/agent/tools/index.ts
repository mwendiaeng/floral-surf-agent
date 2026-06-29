/**
 * agent/tools/index.ts
 */

export {

    ToolRegistry,
    toolRegistry,

} from "./registry";

export {

    fetchTool,

} from "./fetch";

export type {

    ToolContext,
    ToolHandler,
    ToolMap,

} from "./types";

export {

    registryToAiTools,
    handlerToAiTool,

} from "./ai-sdk";

export type {

    AiSdkToolOptions,

} from "./ai-sdk";

export {

    parametersToZod,

} from "./schema";

export {

    createChatToolRegistry,
    buildChatAiTools,
    clientChatTools,
    weatherTool,
    calculateTool,

} from "./chat";

export {

    codingTools,
    registerCodingTools,
    runJavaScriptTool,
    parseJsonTool,
    formatJsonTool,
    parseYamlTool,
    testRegexTool,
    encodeBase64Tool,
    decodeBase64Tool,
    detectLanguageTool,
    diffTextTool,

} from "./coding";

export type {

    ChatScheduleApi,
    ChatToolDependencies,

} from "./chat";

import {

    toolRegistry,

} from "./registry";

import {

    fetchTool,

} from "./fetch";

toolRegistry.register(

    fetchTool

);
