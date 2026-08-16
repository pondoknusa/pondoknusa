import { OpenAICompatibleProvider, type OpenAICompatibleConfig } from './openai-compatible.js';
import { INFERENCE_PRESETS, type InferenceProviderPreset } from './presets.js';
import { registerInferenceProvider, setDefaultInferenceProvider } from './registry.js';

export type InferenceEnv = Record<string, string | undefined>;

export interface RegisterProvidersFromEnvOptions {
  /** Environment source; defaults to `process.env`. */
  env?: InferenceEnv;
  /** Presets to consider; defaults to all of `INFERENCE_PRESETS`. */
  presets?: Record<string, InferenceProviderPreset>;
  /**
   * Register keyless local providers (LM Studio, Ollama, llama.cpp).
   * They also register individually when their `baseUrlEnv` is set.
   */
  includeLocal?: boolean;
  /**
   * Provider to mark default. Falls back to the `INFERENCE_PROVIDER` env
   * var, then to the first provider with a configured key.
   */
  defaultProvider?: string;
}

/**
 * Register every preset whose API key is present in the environment. Lets an
 * app fan out to several vendors (e.g. OpenAI + DeepSeek + OpenRouter) with
 * zero configuration code beyond setting keys in `.env`.
 */
export function registerInferenceProvidersFromEnv(
  options: RegisterProvidersFromEnvOptions = {},
): string[] {
  const env = options.env ?? (process.env as InferenceEnv);
  const presets = options.presets ?? INFERENCE_PRESETS;
  const registered: string[] = [];

  for (const preset of Object.values(presets)) {
    const provider = providerFromPreset(preset, undefined, env);
    if (!provider) {
      continue;
    }
    if (preset.local && !options.includeLocal && !(preset.baseUrlEnv && env[preset.baseUrlEnv])) {
      continue;
    }
    registerInferenceProvider(provider, { default: registered.length === 0 });
    registered.push(provider.name);
  }

  const preferred = options.defaultProvider ?? env.INFERENCE_PROVIDER;
  if (preferred && registered.includes(preferred)) {
    setDefaultInferenceProvider(preferred);
  }

  return registered;
}

/**
 * Build one provider from a preset without touching the registry. Resolves
 * the API key from the preset's `apiKeyEnv`, applies `baseUrlEnv` overrides
 * and `{ENV_VAR}` placeholders, and returns `undefined` when the preset is
 * not configured (missing key or placeholder). Throws only when the preset
 * is unresolvable by construction.
 */
export function providerFromPreset(
  preset: InferenceProviderPreset,
  apiKey?: string,
  env: InferenceEnv = process.env as InferenceEnv,
  overrides: Partial<Omit<OpenAICompatibleConfig, 'name' | 'apiKey'>> = {},
): OpenAICompatibleProvider | undefined {
  const key = apiKey
    ?? (preset.apiKeyEnv ? env[preset.apiKeyEnv] : undefined)
    ?? preset.defaultApiKey;
  if (!key) {
    return undefined;
  }

  const { baseUrl: overrideBaseUrl, ...rest } = overrides;
  const baseUrl = resolvePresetBaseUrl(preset, env) ?? overrideBaseUrl;
  if (!baseUrl) {
    return undefined;
  }

  return new OpenAICompatibleProvider({
    name: preset.name,
    apiKey: key,
    baseUrl,
    model: (preset.modelEnv ? env[preset.modelEnv] : undefined) ?? preset.defaultModel,
    embeddingModel: preset.embeddingModel,
    ...rest,
  });
}

/** Apply the baseUrlEnv override, then substitute `{ENV_VAR}` placeholders. */
function resolvePresetBaseUrl(preset: InferenceProviderPreset, env: InferenceEnv): string | undefined {
  if (preset.baseUrlEnv && env[preset.baseUrlEnv]) {
    return env[preset.baseUrlEnv];
  }

  let missing = false;
  const resolved = preset.baseUrl.replace(/\{([A-Z0-9_]+)\}/g, (_match, name: string) => {
    const value = env[name];
    if (!value) {
      missing = true;
    }
    return value ?? '';
  });
  return missing ? undefined : resolved;
}
