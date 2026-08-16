export interface InferenceProviderPreset {
  /** Registry name and lookup key, e.g. `deepseek`. */
  name: string;
  /**
   * OpenAI-compatible base URL, without trailing slash. May contain
   * `{ENV_VAR}` placeholders resolved from the environment at registration
   * time (e.g. Cloudflare's account-scoped URL).
   */
  baseUrl: string;
  /** Environment variable holding the API key. Omit for keyless local servers. */
  apiKeyEnv?: string;
  /** Placeholder key for local servers that ignore auth. */
  defaultApiKey?: string;
  /** Environment variable that overrides `baseUrl` (custom hosts, tunnels). */
  baseUrlEnv?: string;
  /** Vendor env var consulted for a default chat model, when one exists. */
  modelEnv?: string;
  /** Default chat model baked into the preset, when the vendor pins one. */
  defaultModel?: string;
  /** Default embedding model, when the vendor's endpoint offers /embeddings. */
  embeddingModel?: string;
  /**
   * Keyless local server. Skipped by `registerInferenceProvidersFromEnv`
   * unless `includeLocal: true` or its `baseUrlEnv` is set.
   */
  local?: boolean;
}

/**
 * Vendors that expose an OpenAI-compatible chat-completions endpoint. These
 * presets need no SDK: the fetch-based `OpenAICompatibleProvider` handles
 * them all. Vendor-native SDKs (OpenAI, Anthropic) get their own packages —
 * `@pondoknusa/inference-openai`, `@pondoknusa/inference-anthropic` — that
 * translate the first-party client onto the same `InferenceProvider` surface.
 */
export const INFERENCE_PRESETS: Record<string, InferenceProviderPreset> = {
  openai: {
    name: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    modelEnv: 'OPENAI_MODEL',
    defaultModel: 'gpt-5',
    embeddingModel: 'text-embedding-3-small',
  },
  anthropic: {
    name: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    modelEnv: 'ANTHROPIC_MODEL',
  },
  google: {
    name: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKeyEnv: 'GEMINI_API_KEY',
    modelEnv: 'GEMINI_MODEL',
    defaultModel: 'gemini-2.5-pro',
    embeddingModel: 'gemini-embedding-001',
  },
  xai: {
    name: 'xai',
    baseUrl: 'https://api.x.ai/v1',
    apiKeyEnv: 'XAI_API_KEY',
    modelEnv: 'XAI_MODEL',
  },
  mistral: {
    name: 'mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKeyEnv: 'MISTRAL_API_KEY',
    modelEnv: 'MISTRAL_MODEL',
  },
  deepseek: {
    name: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    modelEnv: 'DEEPSEEK_MODEL',
    defaultModel: 'deepseek-chat',
  },
  moonshot: {
    name: 'moonshot',
    baseUrl: 'https://api.moonshot.ai/v1',
    apiKeyEnv: 'MOONSHOT_API_KEY',
    modelEnv: 'MOONSHOT_MODEL',
    defaultModel: 'kimi-k2',
  },
  qwen: {
    name: 'qwen',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    apiKeyEnv: 'DASHSCOPE_API_KEY',
    modelEnv: 'QWEN_MODEL',
    defaultModel: 'qwen-max',
    embeddingModel: 'text-embedding-v4',
  },
  zai: {
    name: 'zai',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    apiKeyEnv: 'ZAI_API_KEY',
    modelEnv: 'ZAI_MODEL',
    defaultModel: 'glm-4.6',
  },
  minimax: {
    name: 'minimax',
    baseUrl: 'https://api.minimax.io/v1',
    apiKeyEnv: 'MINIMAX_API_KEY',
    modelEnv: 'MINIMAX_MODEL',
    defaultModel: 'MiniMax-M3',
  },
  perplexity: {
    name: 'perplexity',
    baseUrl: 'https://api.perplexity.ai',
    apiKeyEnv: 'PERPLEXITY_API_KEY',
    modelEnv: 'PERPLEXITY_MODEL',
    defaultModel: 'sonar',
  },
  nous: {
    name: 'nous',
    baseUrl: 'https://inference-api.nousresearch.com/v1',
    apiKeyEnv: 'NOUS_API_KEY',
    baseUrlEnv: 'NOUS_BASE_URL',
    modelEnv: 'NOUS_MODEL',
  },
  groq: {
    name: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'GROQ_API_KEY',
    modelEnv: 'GROQ_MODEL',
  },
  together: {
    name: 'together',
    baseUrl: 'https://api.together.xyz/v1',
    apiKeyEnv: 'TOGETHER_API_KEY',
    modelEnv: 'TOGETHER_MODEL',
  },
  fireworks: {
    name: 'fireworks',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    apiKeyEnv: 'FIREWORKS_API_KEY',
    modelEnv: 'FIREWORKS_MODEL',
  },
  cerebras: {
    name: 'cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    apiKeyEnv: 'CEREBRAS_API_KEY',
    modelEnv: 'CEREBRAS_MODEL',
  },
  sambanova: {
    name: 'sambanova',
    baseUrl: 'https://api.sambanova.ai/v1',
    apiKeyEnv: 'SAMBANOVA_API_KEY',
    modelEnv: 'SAMBANOVA_MODEL',
  },
  deepinfra: {
    name: 'deepinfra',
    baseUrl: 'https://api.deepinfra.com/v1/openai',
    apiKeyEnv: 'DEEPINFRA_API_KEY',
    modelEnv: 'DEEPINFRA_MODEL',
  },
  openrouter: {
    name: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    modelEnv: 'OPENROUTER_MODEL',
  },
  copilot: {
    name: 'copilot',
    baseUrl: 'https://api.githubcopilot.com',
    apiKeyEnv: 'COPILOT_API_KEY',
    modelEnv: 'COPILOT_MODEL',
  },
  huggingface: {
    name: 'huggingface',
    baseUrl: 'https://router.huggingface.co/v1',
    apiKeyEnv: 'HF_TOKEN',
    modelEnv: 'HF_MODEL',
  },
  nvidia: {
    name: 'nvidia',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    apiKeyEnv: 'NVIDIA_API_KEY',
    modelEnv: 'NVIDIA_MODEL',
  },
  cloudflare: {
    name: 'cloudflare',
    baseUrl: 'https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1',
    apiKeyEnv: 'CLOUDFLARE_API_TOKEN',
    modelEnv: 'CLOUDFLARE_MODEL',
  },
  lmstudio: {
    name: 'lmstudio',
    baseUrl: 'http://localhost:1234/v1',
    baseUrlEnv: 'LMSTUDIO_BASE_URL',
    defaultApiKey: 'lm-studio',
    modelEnv: 'LMSTUDIO_MODEL',
    local: true,
  },
  ollama: {
    name: 'ollama',
    baseUrl: 'http://localhost:11434/v1',
    baseUrlEnv: 'OLLAMA_BASE_URL',
    defaultApiKey: 'ollama',
    modelEnv: 'OLLAMA_MODEL',
    local: true,
  },
  llamacpp: {
    name: 'llamacpp',
    baseUrl: 'http://localhost:8080/v1',
    baseUrlEnv: 'LLAMACPP_BASE_URL',
    defaultApiKey: 'llama.cpp',
    modelEnv: 'LLAMACPP_MODEL',
    local: true,
  },
};
