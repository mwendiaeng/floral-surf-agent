/**
 * fetch.ts
 *
 * High-level fetch client.
 *
 * Coordinates:
 *
 *  • Security
 *  • Retry
 *  • Cache
 *  • Robots
 *  • Streaming
 *  • Parsing
 *  • Middleware
 *  • Plugins
 */

import {

    CacheManager,
    cacheManager,

} from "./cache";

import {

    RetryExecutor,

} from "./retry";

import {

    SecurityValidator,

} from "./security";

import {

    RobotsManager,

} from "./robots";

import {

    FetchStreamReader,

} from "./stream";

import {

    parseResponse,

} from "./parser";

import type {

    FetchClient,
    FetchConfiguration,
    FetchHooks,
    FetchMiddleware,
    FetchMetrics,
    FetchOptions,
    FetchPlugin,
    FetchRequest,
    FetchResult,

} from "./types";

import {

    DEFAULT_FETCH_CONFIGURATION,

} from "./types";

/* -------------------------------------------------------------------------- */
/* Client                                                                     */
/* -------------------------------------------------------------------------- */

export class HttpFetchClient

    implements FetchClient {

    readonly configuration: FetchConfiguration;

    readonly metrics: FetchMetrics = {

        requests: 0,

        successfulRequests: 0,

        failedRequests: 0,

        cacheHits: 0,

        cacheMisses: 0,

        retries: 0,

        redirects: 0,

        bytesDownloaded: 0,

        bytesUploaded: 0,

        averageResponseTime: 0,

        minResponseTime: 0,

        maxResponseTime: 0,

        totalResponseTime: 0,

    };

    protected readonly middleware: FetchMiddleware[] = [];

    protected readonly plugins =

        new Map<string, FetchPlugin>();

    protected readonly hooks: FetchHooks = {};

    readonly cache: CacheManager;

    readonly retry: RetryExecutor;

    readonly security: SecurityValidator;

    readonly robots: RobotsManager;

    readonly stream: FetchStreamReader;

    constructor(

        configuration: Partial<FetchConfiguration> = {}

    ) {

        this.configuration = {

            ...DEFAULT_FETCH_CONFIGURATION,

            ...configuration,

        };

        this.cache =

            cacheManager;

        this.retry =

            new RetryExecutor({

                ...this.configuration.retry,

                strategy: "exponential",

                retries:

                    this.configuration.retry.retries ?? 3,

                initialDelay:

                    this.configuration.retry.initialDelay ?? 500,

                maxDelay:

                    this.configuration.retry.maxDelay ?? 30_000,

                factor:

                    this.configuration.retry.factor ?? 2,

                jitter:

                    this.configuration.retry.jitter ?? true,

            });

        this.security =

            new SecurityValidator(

                this.configuration.security

            );

        this.robots =

            new RobotsManager(

                this.configuration.robots

            );

        this.stream =

            new FetchStreamReader(

                this.configuration.stream

            );

    }

    /* -------------------------------------------------------------------------- */
    /* Middleware                                                                 */
    /* -------------------------------------------------------------------------- */

    registerMiddleware(

        middleware: FetchMiddleware

    ): void {

        this.middleware.push(

            middleware

        );

        this.middleware.sort(

            (

                a,

                b

            ) =>

                (a.priority ?? 0) -

                (b.priority ?? 0)

        );

    }

    unregisterMiddleware(

        name: string

    ): void {

        const index =

            this.middleware.findIndex(

                middleware =>

                    middleware.name === name

            );

        if (

            index >= 0

        ) {

            this.middleware.splice(

                index,

                1

            );

        }

    }

    clearMiddleware(): void {

        this.middleware.length = 0;

    }

    /* -------------------------------------------------------------------------- */
    /* Plugins                                                                    */
    /* -------------------------------------------------------------------------- */

    registerPlugin(

        plugin: FetchPlugin

    ): void {

        this.plugins.set(

            plugin.name,

            plugin

        );

        plugin.initialize?.();

        const middleware =

            plugin.middleware?.();

        if (

            middleware

        ) {

            this.registerMiddleware(

                middleware

            );

        }

    }

    unregisterPlugin(

        name: string

    ): void {

        const plugin =

            this.plugins.get(

                name

            );

        if (

            !plugin

        ) {

            return;

        }

        plugin.destroy?.();

        this.unregisterMiddleware(

            name

        );

        this.plugins.delete(

            name

        );

    }

    clearPlugins(): void {

        for (

            const plugin of this.plugins.values()

        ) {

            plugin.destroy?.();

        }

        this.plugins.clear();

        this.clearMiddleware();

    }

    /* -------------------------------------------------------------------------- */
    /* Hooks                                                                      */
    /* -------------------------------------------------------------------------- */

    setHooks(

        hooks: Partial<FetchHooks>

    ): void {

        Object.assign(

            this.hooks,

            hooks

        );

    }

    /* -------------------------------------------------------------------------- */
    /* Middleware Execution                                                       */
    /* -------------------------------------------------------------------------- */

    protected async executeMiddleware(

        request: FetchRequest,

        executor: () => Promise<FetchResult>

    ): Promise<FetchResult> {

        let index = -1;

        const dispatch = async (

            current: number

        ): Promise<FetchResult> => {

            if (

                current <= index

            ) {

                throw new Error(

                    "next() called multiple times."

                );

            }

            index = current;

            const middleware =

                this.middleware[current];

            if (

                !middleware

            ) {

                return executor();

            }

            return middleware.execute(

                request,

                () =>

                    dispatch(

                        current + 1

                    )

            );

        };

        return dispatch(

            0

        );

    }

    /* -------------------------------------------------------------------------- */
    /* Lifecycle                                                                  */
    /* -------------------------------------------------------------------------- */

    protected async beforeRequest(

        request: FetchRequest

    ): Promise<void> {

        await this.hooks.beforeRequest?.(

            request

        );

    }

    protected async afterResponse(

        response: Response

    ): Promise<void> {

        await this.hooks.afterResponse?.(

            response

        );

    }

    protected async beforeParse(

        response: Response

    ): Promise<void> {

        await this.hooks.beforeParse?.(

            response

        );

    }

    protected async afterParse(

        result: FetchResult

    ): Promise<void> {

        if (

            result.parsed

        ) {

            await this.hooks.afterParse?.(

                result.parsed

            );

        }

    }

    protected async onError(

        error: Error

    ): Promise<void> {

        await this.hooks.onError?.({

            code:

                error.name,

            message:

                error.message,

            cause:

                error,

        });

    }

    /* -------------------------------------------------------------------------- */
    /* Security                                                                   */
    /* -------------------------------------------------------------------------- */

    protected async validateRequest(

        request: FetchRequest

    ): Promise<void> {

        const result =

            this.security.validate(

                request.url

            );

        if (

            !result.allowed

        ) {

            throw new Error(

                result.violations.join(

                    "\n"

                )

            );

        }

    }

    /* -------------------------------------------------------------------------- */
    /* Robots                                                                     */
    /* -------------------------------------------------------------------------- */

    protected async validateRobots(

        request: FetchRequest

    ): Promise<void> {

        if (

            this.configuration.robots

                .respectRobotsTxt === false

        ) {

            return;

        }

        const allowed =

            await this.robots.canFetch(

                request.url,

                (url: string) =>

                    fetch(url),

                this.configuration.robots

                    .userAgent

            );

        if (

            !allowed.allowed

        ) {

            throw new Error(

                `Blocked by robots.txt (${allowed.matchedRule ?? "unknown rule"})`

            );

        }

    }

    /* -------------------------------------------------------------------------- */
    /* Cache Lookup                                                               */
    /* -------------------------------------------------------------------------- */

    protected async lookupCache(

        request: FetchRequest

    ) {

        if (

            request.options.cache === false ||

            this.configuration.fetch.cache === false

        ) {

            return;

        }

        const cached =

            await this.cache.get<Response>(

                request.url

            );

        if (

            cached

        ) {

            this.metrics.cacheHits++;

        }

        else {

            this.metrics.cacheMisses++;

        }

        return cached;

    }

    /* -------------------------------------------------------------------------- */
    /* Conditional Request                                                        */
    /* -------------------------------------------------------------------------- */

    protected async prepareRequest(

        request: FetchRequest

    ): Promise<RequestInit> {

        const init: RequestInit = {

            method:

                request.options.method ??

                this.configuration.fetch.method,

            body:

                request.options.body,

            signal:

                request.options.signal,

            headers:

                new Headers(

                    request.options.headers

                ),

        };

        /*
         * User-Agent
         */

        if (

            request.options.userAgent

        ) {

            (

                init.headers as Headers

            ).set(

                "User-Agent",

                request.options.userAgent

            );

        }

        /*
         * Referrer
         */

        if (

            request.options.referrer

        ) {

            (

                init.headers as Headers

            ).set(

                "Referer",

                request.options.referrer

            );

        }

        /*
         * Conditional cache validators.
         */

        const cached =

            await this.lookupCache(

                request

            );

        if (

            cached

        ) {

            const metadata =

                cached.metadata;

            if (

                metadata?.etag

            ) {

                (

                    init.headers as Headers

                ).set(

                    "If-None-Match",

                    String(

                        metadata.etag

                    )

                );

            }

            if (

                metadata?.lastModified

            ) {

                (

                    init.headers as Headers

                ).set(

                    "If-Modified-Since",

                    String(

                        metadata.lastModified

                    )

                );

            }

        }

        return init;

    }

    /* -------------------------------------------------------------------------- */
    /* Pre-flight                                                                 */
    /* -------------------------------------------------------------------------- */

    protected async prepare(

        request: FetchRequest

    ): Promise<RequestInit> {

        await this.beforeRequest(

            request

        );

        await this.validateRequest(

            request

        );

        await this.validateRobots(

            request

        );

        return this.prepareRequest(

            request

        );

    }

    /* -------------------------------------------------------------------------- */
    /* Core Request                                                               */
    /* -------------------------------------------------------------------------- */

    protected async executeRequest(

        request: FetchRequest,

        init: RequestInit

    ): Promise<Response> {

        const timeout =

            request.options.timeout ??

            this.configuration.fetch.timeout;

        const controller =

            new AbortController();

        const timeoutId =

            timeout

                ? setTimeout(

                    () =>

                        controller.abort(

                            new Error(

                                "Request timeout."

                            )

                        ),

                    timeout

                )

                : undefined;

        const signal =

            request.options.signal

                ? AbortSignal.any([

                    request.options.signal,

                    controller.signal,

                ])

                : controller.signal;

        try {

            return await this.retry.execute(

                async context => {

                    if (

                        context.attempt > 1

                    ) {

                        this.metrics.retries++;

                        await this.hooks.onRetry?.(

                            context

                        );

                    }

                    return fetch(

                        request.url,

                        {

                            ...init,

                            signal,

                            redirect:

                                this.configuration.fetch

                                    .followRedirects

                                    ? "follow"

                                    : "manual",

                        }

                    );

                }

            );

        }

        finally {

            if (

                timeoutId

            ) {

                clearTimeout(

                    timeoutId

                );

            }

        }

    }

    /* -------------------------------------------------------------------------- */
    /* Redirect Validation                                                        */
    /* -------------------------------------------------------------------------- */

    protected async validateResponse(

        request: FetchRequest,

        response: Response

    ): Promise<void> {

        await this.afterResponse(

            response

        );

        /*
         * Manual redirect handling.
         */

        if (

            response.status >= 300 &&

            response.status < 400 &&

            response.headers.has(

                "location"

            )

        ) {

            this.metrics.redirects++;

        }

        /*
         * Security validation.
         */

        const result =

            this.security.validate(

                response.url

            );

        if (

            !result.allowed

        ) {

            throw new Error(

                result.violations.join(

                    "\n"

                )

            );

        }

    }

    /* -------------------------------------------------------------------------- */
    /* Streaming                                                                  */
    /* -------------------------------------------------------------------------- */

    protected async consumeStream(

        response: Response,

        request: FetchRequest

    ): Promise<void> {

        if (

            request.options.responseType !==

            "stream"

        ) {

            return;

        }

        await this.stream.readStream(

            response,

            {

                onProgress:

                    progress =>

                        this.hooks.onProgress?.(

                            progress

                        ),

            }

        );

    }

    /* -------------------------------------------------------------------------- */
    /* Execute                                                                    */
    /* -------------------------------------------------------------------------- */

    protected async perform(

        request: FetchRequest

    ): Promise<Response> {

        const init =

            await this.prepare(

                request

            );

        const response =

            await this.executeRequest(

                request,

                init

            );

        await this.validateResponse(

            request,

            response

        );

        await this.consumeStream(

            response,

            request

        );

        return response;

    }

    /* -------------------------------------------------------------------------- */
    /* Parsing                                                                    */
    /* -------------------------------------------------------------------------- */

    protected async parse(

        request: FetchRequest,

        response: Response

    ) {

        await this.beforeParse(

            response

        );

        const parsed =

            await parseResponse(

                response.clone(),

                {

                    url:

                        response.url,

                    request,

                }

            );

        return parsed;

    }

    /* -------------------------------------------------------------------------- */
    /* Cache                                                                      */
    /* -------------------------------------------------------------------------- */

    protected async updateCache(

        request: FetchRequest,

        response: Response

    ): Promise<void> {

        if (

            request.options.cache === false ||

            this.configuration.fetch.cache === false

        ) {

            return;

        }

        if (

            !response.ok

        ) {

            return;

        }

        const cloned =

            response.clone();

        const body =

            await cloned.arrayBuffer();

        const metadata = {

            etag:

                response.headers.get(

                    "etag"

                ) ?? undefined,

            lastModified:

                response.headers.get(

                    "last-modified"

                ) ?? undefined,

            contentType:

                response.headers.get(

                    "content-type"

                ) ?? undefined,

            contentLength:

                response.headers.get(

                    "content-length"

                ) ?? undefined,

            cacheControl:

                response.headers.get(

                    "cache-control"

                ) ?? undefined,

            status:

                response.status,

        };

        await this.cache.set(

            request.url,

            body,

            undefined,

            metadata

        );

    }

    /* -------------------------------------------------------------------------- */
    /* Metrics                                                                    */
    /* -------------------------------------------------------------------------- */

    protected updateMetrics(

        response: Response,

        startedAt: number

    ): void {

        const duration =

            performance.now() -

            startedAt;

        this.metrics.requests++;

        if (

            response.ok

        ) {

            this.metrics.successfulRequests++;

        }

        else {

            this.metrics.failedRequests++;

        }

        this.metrics.totalResponseTime +=

            duration;

        this.metrics.averageResponseTime =

            this.metrics.totalResponseTime /

            this.metrics.requests;

        if (

            this.metrics.minResponseTime === 0 ||

            duration <

            this.metrics.minResponseTime

        ) {

            this.metrics.minResponseTime =

                duration;

        }

        if (

            duration >

            this.metrics.maxResponseTime

        ) {

            this.metrics.maxResponseTime =

                duration;

        }

        const length =

            Number(

                response.headers.get(

                    "content-length"

                ) ?? 0

            );

        if (

            Number.isFinite(

                length

            )

        ) {

            this.metrics.bytesDownloaded +=

                length;

        }

    }

    /* -------------------------------------------------------------------------- */
    /* Public Fetch                                                               */
    /* -------------------------------------------------------------------------- */

    async fetch(

        url: string,

        options: FetchOptions = {}

    ): Promise<FetchResult> {

        const startedAt =

            performance.now();

        const request: FetchRequest = {

            url,

            options,

        };

        try {

            const result =

                await this.executeMiddleware(

                    request,

                    async () => {

                        const response =

                            await this.perform(

                                request

                            );

                        const parsed =

                            await this.parse(

                                request,

                                response

                            );

                        await this.updateCache(

                            request,

                            response

                        );

                        this.updateMetrics(

                            response,

                            startedAt

                        );

                        const result: FetchResult = {
                            request,

                            response,

                            parsed,

                            metrics: {
                                ...this.metrics,
                            },
                            duration: 0,
                            fromCache: false
                        };

                        await this.afterParse(

                            result

                        );

                        return result;

                    }

                );

            return result;

        }

        catch (

        error

        ) {

            this.metrics.requests++;

            this.metrics.failedRequests++;

            await this.onError(

                error as Error

            );

            throw error;

        }

    }

    /* -------------------------------------------------------------------------- */
    /* GET                                                                        */
    /* -------------------------------------------------------------------------- */

    async get(

        url: string,

        options: Omit<FetchOptions, "method"> = {}

    ): Promise<FetchResult> {

        return this.fetch(

            url,

            {

                ...options,

                method: "GET",

            }

        );

    }

    /* -------------------------------------------------------------------------- */
    /* POST                                                                       */
    /* -------------------------------------------------------------------------- */

    async post(

        url: string,

        body?: BodyInit | null,

        options: Omit<FetchOptions, "method" | "body"> = {}

    ): Promise<FetchResult> {

        return this.fetch(

            url,

            {

                ...options,

                method: "POST",

                body,

            }

        );

    }

    /* -------------------------------------------------------------------------- */
    /* PUT                                                                        */
    /* -------------------------------------------------------------------------- */

    async put(

        url: string,

        body?: BodyInit | null,

        options: Omit<FetchOptions, "method" | "body"> = {}

    ): Promise<FetchResult> {

        return this.fetch(

            url,

            {

                ...options,

                method: "PUT",

                body,

            }

        );

    }

    /* -------------------------------------------------------------------------- */
    /* PATCH                                                                      */
    /* -------------------------------------------------------------------------- */

    async patch(

        url: string,

        body?: BodyInit | null,

        options: Omit<FetchOptions, "method" | "body"> = {}

    ): Promise<FetchResult> {

        return this.fetch(

            url,

            {

                ...options,

                method: "PATCH",

                body,

            }

        );

    }

    /* -------------------------------------------------------------------------- */
    /* DELETE                                                                     */
    /* -------------------------------------------------------------------------- */

    async delete(

        url: string,

        options: Omit<FetchOptions, "method"> = {}

    ): Promise<FetchResult> {

        return this.fetch(

            url,

            {

                ...options,

                method: "DELETE",

            }

        );

    }

    /* -------------------------------------------------------------------------- */
    /* HEAD                                                                       */
    /* -------------------------------------------------------------------------- */

    async head(

        url: string,

        options: Omit<FetchOptions, "method"> = {}

    ): Promise<FetchResult> {

        return this.fetch(

            url,

            {

                ...options,

                method: "HEAD",

            }

        );

    }

    /* -------------------------------------------------------------------------- */
    /* OPTIONS                                                                    */
    /* -------------------------------------------------------------------------- */

    async options(

        url: string,

        options: Omit<FetchOptions, "method"> = {}

    ): Promise<FetchResult> {

        return this.fetch(

            url,

            {

                ...options,

                method: "OPTIONS",

            }

        );

    }

    /* -------------------------------------------------------------------------- */
    /* JSON                                                                       */
    /* -------------------------------------------------------------------------- */

    async getJson<T = unknown>(

        url: string,

        options: Omit<FetchOptions, "responseType"> = {}

    ): Promise<T> {

        const result =

            await this.fetch(

                url,

                {

                    ...options,

                    responseType: "json",

                }

            );

        return result.parsed as T;

    }

    async postJson<T = unknown>(

        url: string,

        body: unknown,

        options: Omit<FetchOptions, "method" | "body"> = {}

    ): Promise<T> {

        const headers =

            new Headers(

                options.headers

            );

        headers.set(

            "Content-Type",

            "application/json"

        );

        const result =

            await this.fetch(

                url,

                {

                    ...options,

                    method: "POST",

                    headers,

                    body: JSON.stringify(

                        body

                    ),

                    responseType: "json",

                }

            );

        return result.parsed as T;

    }

    /* -------------------------------------------------------------------------- */
    /* Text                                                                       */
    /* -------------------------------------------------------------------------- */

    async getText(

        url: string,

        options: Omit<FetchOptions, "responseType"> = {}

    ): Promise<string> {

        const result =

            await this.fetch(

                url,

                {

                    ...options,

                    responseType: "text",

                }

            );

        return result.parsed as unknown as string;

    }

    /* -------------------------------------------------------------------------- */
    /* Binary                                                                     */
    /* -------------------------------------------------------------------------- */

    async download(

        url: string,

        options: Omit<FetchOptions, "responseType"> = {}

    ): Promise<ArrayBuffer> {

        const result =

            await this.fetch(

                url,

                {

                    ...options,

                    responseType: "arrayBuffer",

                }

            );

        return result.parsed as unknown as ArrayBuffer;

    }

    /* -------------------------------------------------------------------------- */
    /* Blob                                                                       */
    /* -------------------------------------------------------------------------- */

    async getBlob(

        url: string,

        options: Omit<FetchOptions, "responseType"> = {}

    ): Promise<Blob> {

        const result =

            await this.fetch(

                url,

                {

                    ...options,

                    responseType: "blob",

                }

            );

        return result.parsed as unknown as Blob;

    }

    /* -------------------------------------------------------------------------- */
    /* Stream                                                                     */
    /* -------------------------------------------------------------------------- */

    async streamResponse(

        url: string,

        options: Omit<FetchOptions, "responseType"> = {}

    ): Promise<Response> {

        const result =

            await this.fetch(

                url,

                {

                    ...options,

                    responseType: "stream",

                }

            );

        return result.response;


    }

    /* -------------------------------------------------------------------------- */
    /* Configuration                                                              */
    /* -------------------------------------------------------------------------- */

    configure(

        configuration: Partial<FetchConfiguration>

    ): this {

        Object.assign(

            this.configuration,

            configuration

        );

        return this;

    }

    /* -------------------------------------------------------------------------- */
    /* Metrics                                                                    */
    /* -------------------------------------------------------------------------- */

    getMetrics(): FetchMetrics {

        return {

            ...this.metrics,

        };

    }

    resetMetrics(): void {

        this.metrics.requests = 0;
        this.metrics.successfulRequests = 0;
        this.metrics.failedRequests = 0;
        this.metrics.cacheHits = 0;
        this.metrics.cacheMisses = 0;
        this.metrics.retries = 0;
        this.metrics.redirects = 0;
        this.metrics.bytesDownloaded = 0;
        this.metrics.bytesUploaded = 0;
        this.metrics.averageResponseTime = 0;
        this.metrics.totalResponseTime = 0;
        this.metrics.minResponseTime = 0;
        this.metrics.maxResponseTime = 0;

    }

    /* -------------------------------------------------------------------------- */
    /* Plugins                                                                    */
    /* -------------------------------------------------------------------------- */

    hasPlugin(

        name: string

    ): boolean {

        return this.plugins.has(

            name

        );

    }

    getPlugin<T extends FetchPlugin>(

        name: string

    ): T | undefined {

        return this.plugins.get(

            name

        ) as T | undefined;

    }

    listPlugins(): string[] {

        return [

            ...this.plugins.keys(),

        ];

    }

    /* -------------------------------------------------------------------------- */
    /* Middleware                                                                 */
    /* -------------------------------------------------------------------------- */

    listMiddleware(): string[] {

        return this.middleware.map(

            middleware =>

                middleware.name

        );

    }

    /* -------------------------------------------------------------------------- */
    /* Clone                                                                      */
    /* -------------------------------------------------------------------------- */

    clone(): HttpFetchClient {

        const client =

            new HttpFetchClient(

                structuredClone(

                    this.configuration

                )

            );

        for (

            const middleware of this.middleware

        ) {

            client.registerMiddleware(

                middleware

            );

        }

        for (

            const plugin of this.plugins.values()

        ) {

            client.registerPlugin(

                plugin

            );

        }

        client.setHooks(

            this.hooks

        );

        return client;

    }

    /* -------------------------------------------------------------------------- */
    /* Dispose                                                                    */
    /* -------------------------------------------------------------------------- */

    dispose(): void {

        this.clearPlugins();

        this.clearMiddleware();

    }
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

export function createFetchClient(

    configuration: Partial<FetchConfiguration> = {}

): HttpFetchClient {

    return new HttpFetchClient(

        configuration

    );

}

/* -------------------------------------------------------------------------- */
/* Singleton                                                                  */
/* -------------------------------------------------------------------------- */

export const fetchClient =

    createFetchClient();

/* -------------------------------------------------------------------------- */
/* Registration Helpers                                                       */
/* -------------------------------------------------------------------------- */

export function usePlugin(

    plugin: FetchPlugin

): HttpFetchClient {

    fetchClient.registerPlugin(

        plugin

    );

    return fetchClient;

}

export function useMiddleware(

    middleware: FetchMiddleware

): HttpFetchClient {

    fetchClient.registerMiddleware(

        middleware

    );

    return fetchClient;

}

/* -------------------------------------------------------------------------- */
/* Configuration Helpers                                                      */
/* -------------------------------------------------------------------------- */

export function configureFetch(

    configuration: Partial<FetchConfiguration>

): HttpFetchClient {

    fetchClient.configure(

        configuration

    );

    return fetchClient;

}

/* -------------------------------------------------------------------------- */
/* Singleton Convenience API                                                  */
/* -------------------------------------------------------------------------- */

export function fetchUrl(

    url: string,

    options?: FetchOptions

): Promise<FetchResult> {

    return fetchClient.fetch(

        url,

        options

    );

}

export function get(

    url: string,

    options?: Omit<FetchOptions, "method">

): Promise<FetchResult> {

    return fetchClient.get(

        url,

        options

    );

}

export function post(

    url: string,

    body?: BodyInit | null,

    options?: Omit<

        FetchOptions,

        "method" | "body"

    >

): Promise<FetchResult> {

    return fetchClient.post(

        url,

        body,

        options

    );

}

export function put(

    url: string,

    body?: BodyInit | null,

    options?: Omit<

        FetchOptions,

        "method" | "body"

    >

): Promise<FetchResult> {

    return fetchClient.put(

        url,

        body,

        options

    );

}

export function patch(

    url: string,

    body?: BodyInit | null,

    options?: Omit<

        FetchOptions,

        "method" | "body"

    >

): Promise<FetchResult> {

    return fetchClient.patch(

        url,

        body,

        options

    );

}

export function del(

    url: string,

    options?: Omit<FetchOptions, "method">

): Promise<FetchResult> {

    return fetchClient.delete(

        url,

        options

    );

}

export function head(

    url: string,

    options?: Omit<FetchOptions, "method">

): Promise<FetchResult> {

    return fetchClient.head(

        url,

        options

    );

}

export function options(

    url: string,

    opts?: Omit<FetchOptions, "method">

): Promise<FetchResult> {

    return fetchClient.options(

        url,

        opts

    );

}

/* -------------------------------------------------------------------------- */
/* JSON Helpers                                                               */
/* -------------------------------------------------------------------------- */

export function getJson<T = unknown>(

    url: string,

    options?: Omit<

        FetchOptions,

        "responseType"

    >

): Promise<T> {

    return fetchClient.getJson<T>(

        url,

        options

    );

}

export function postJson<T = unknown>(

    url: string,

    body: unknown,

    options?: Omit<

        FetchOptions,

        "method" | "body"

    >

): Promise<T> {

    return fetchClient.postJson<T>(

        url,

        body,

        options

    );

}

/* -------------------------------------------------------------------------- */
/* Binary Helpers                                                             */
/* -------------------------------------------------------------------------- */

export function download(

    url: string,

    options?: Omit<

        FetchOptions,

        "responseType"

    >

): Promise<ArrayBuffer> {

    return fetchClient.download(

        url,

        options

    );

}

export function stream(

    url: string,

    options?: Omit<

        FetchOptions,

        "responseType"

    >

): Promise<Response> {

    return fetchClient.streamResponse(

        url,

        options

    );

}

/* -------------------------------------------------------------------------- */
/* Metrics                                                                    */
/* -------------------------------------------------------------------------- */

export function metrics(): FetchMetrics {

    return fetchClient.getMetrics();

}

export function resetMetrics(): void {

    fetchClient.resetMetrics();

}

/* -------------------------------------------------------------------------- */
/* Shutdown                                                                   */
/* -------------------------------------------------------------------------- */

export function dispose(): void {

    fetchClient.dispose();

}

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {

    HttpFetchClient,

    createFetchClient,

    fetchClient,

    configureFetch,

    usePlugin,

    useMiddleware,

    fetchUrl,

    get,

    post,

    put,

    patch,

    delete: del,

    head,

    options,

    getJson,

    postJson,

    download,

    stream,

    metrics,

    resetMetrics,

    dispose,

};

