/**
 * Augment generated Wrangler Env with optional vars and secrets.
 * Non-sensitive defaults live in wrangler.jsonc `vars`.
 * Secrets are set via `wrangler secret put` or `.dev.vars` locally.
 */
declare global {
  interface Env {
    /** workers-ai | openai | anthropic | openai-compatible */
    LLM_PROVIDER?: string;
    /** Model id (Workers AI @cf/... or provider-native id) */
    LLM_MODEL?: string;
    /** openai | anthropic | openai-compatible */
    LLM_FALLBACK_PROVIDER?: string;
    LLM_FALLBACK_MODEL?: string;
    /** Deployment environment label */
    APP_ENV?: string;
    /** OpenAI-compatible API base URL */
    OPENAI_BASE_URL?: string;
    /** Anthropic API base URL */
    ANTHROPIC_BASE_URL?: string;
    /** Default sampling temperature (0–2) */
    LLM_TEMPERATURE?: string;
    /** Max output tokens */
    LLM_MAX_TOKENS?: string;
    /** Top-p nucleus sampling */
    LLM_TOP_P?: string;
    /** JSON array of default MCP servers: [{"name":"...","url":"..."}] */
    MCP_SERVERS?: string;

  // Secrets (never commit real values)
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    DATABASE_URL?: string;
    REDIS_URL?: string;
  }
}

export {};
