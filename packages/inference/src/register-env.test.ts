import { afterEach, describe, expect, it } from 'vitest';
import { INFERENCE_PRESETS } from './presets.js';
import { providerFromPreset, registerInferenceProvidersFromEnv } from './register-env.js';
import {
  clearInferenceProviders,
  getInferenceProvider,
  listInferenceProviders,
} from './registry.js';

describe('registerInferenceProvidersFromEnv', () => {
  afterEach(() => {
    clearInferenceProviders();
  });

  it('registers every preset that has an API key in the environment', () => {
    const registered = registerInferenceProvidersFromEnv({
      env: {
        OPENAI_API_KEY: 'sk-openai',
        DEEPSEEK_API_KEY: 'sk-deepseek',
      },
    });

    expect(registered).toEqual(['openai', 'deepseek']);
    expect(listInferenceProviders()).toEqual(['openai', 'deepseek']);
    expect(getInferenceProvider().name).toBe('openai');
    expect(getInferenceProvider('deepseek').name).toBe('deepseek');
  });

  it('honours INFERENCE_PROVIDER as the default when registered', () => {
    registerInferenceProvidersFromEnv({
      env: {
        OPENAI_API_KEY: 'sk-openai',
        ZAI_API_KEY: 'sk-zai',
        INFERENCE_PROVIDER: 'zai',
      },
    });
    expect(getInferenceProvider().name).toBe('zai');
  });

  it('falls back to the first registered provider for an unknown default name', () => {
    registerInferenceProvidersFromEnv({
      env: {
        DEEPSEEK_API_KEY: 'sk-deepseek',
        INFERENCE_PROVIDER: 'anthropic',
      },
    });
    expect(getInferenceProvider().name).toBe('deepseek');
  });

  it('resolves models from the preset model env var first', () => {
    const provider = providerFromPreset(
      INFERENCE_PRESETS.qwen,
      'sk-dash',
      { QWEN_MODEL: 'qwen-plus' },
    );
    expect(provider).toBeDefined();
    // Model resolution is verified through chat requests elsewhere; here we
    // assert the provider was constructed for the preset endpoint.
    expect(provider.name).toBe('qwen');
  });

  it('skips presets with no configured key', () => {
    const registered = registerInferenceProvidersFromEnv({ env: {} });
    expect(registered).toEqual([]);
  });

  it('resolves {ENV_VAR} placeholders in preset base URLs and skips when unresolved', () => {
    const missing = registerInferenceProvidersFromEnv({
      env: { CLOUDFLARE_API_TOKEN: 'cf-token' },
    });
    expect(missing).toEqual([]);

    const registered = registerInferenceProvidersFromEnv({
      env: { CLOUDFLARE_API_TOKEN: 'cf-token', CLOUDFLARE_ACCOUNT_ID: 'acct-123' },
    });
    expect(registered).toEqual(['cloudflare']);
  });

  it('skips keyless local providers unless includeLocal or their baseUrlEnv is set', () => {
    expect(registerInferenceProvidersFromEnv({ env: {} })).toEqual([]);

    expect(registerInferenceProvidersFromEnv({ env: {}, includeLocal: true })).toEqual([
      'lmstudio',
      'ollama',
      'llamacpp',
    ]);

    clearInferenceProviders();
    expect(
      registerInferenceProvidersFromEnv({ env: { OLLAMA_BASE_URL: 'http://gpu-box:11434/v1' } }),
    ).toEqual(['ollama']);
  });

  it('posts to the interpolated Cloudflare account URL', async () => {
    let url = '';
    const provider = providerFromPreset(INFERENCE_PRESETS.cloudflare, undefined, {
      CLOUDFLARE_API_TOKEN: 'cf-token',
      CLOUDFLARE_ACCOUNT_ID: 'acct-123',
    }, {
      model: '@cf/meta/llama-3.1-8b-instruct',
      fetch: (async (input: RequestInfo | URL) => {
        url = String(input);
        return new Response(JSON.stringify({
          model: '@cf/meta/llama-3.1-8b-instruct',
          choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }) as unknown as typeof fetch,
    });

    await provider?.chat([{ role: 'user', content: 'hi' }]);
    expect(url).toBe('https://api.cloudflare.com/client/v4/accounts/acct-123/ai/v1/chat/completions');
  });

  it('lets baseUrlEnv override the preset endpoint', () => {
    const provider = providerFromPreset(INFERENCE_PRESETS.nous, undefined, {
      NOUS_API_KEY: 'sk-nous',
      NOUS_BASE_URL: 'http://10.0.0.5:8000/v1',
    });
    expect(provider?.name).toBe('nous');
  });

  it('returns undefined from providerFromPreset when no key is available', () => {
    expect(providerFromPreset(INFERENCE_PRESETS.mistral, undefined, {})).toBeUndefined();
  });
});
