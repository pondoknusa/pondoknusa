import { afterEach, describe, expect, it } from 'vitest';
import {
  clearInferenceProviders,
  getInferenceProvider,
  inferenceChat,
  inferenceEmbed,
  listInferenceProviders,
  registerInferenceProvider,
  setDefaultInferenceProvider,
  unregisterInferenceProvider,
} from './registry.js';
import type { InferenceProvider } from './provider.js';

function stubProvider(name: string): InferenceProvider {
  return {
    name,
    chat: async () => ({ content: `from ${name}`, model: 'stub' }),
    stream: async function* () {
      yield 'tok';
    },
    ...(name === 'with-embed' ? { embed: async () => [[0.1]] } : {}),
  };
}

describe('inference registry', () => {
  afterEach(() => {
    clearInferenceProviders();
  });

  it('uses the first registered provider as default and resolves by name', async () => {
    registerInferenceProvider(stubProvider('alpha'));
    registerInferenceProvider(stubProvider('beta'));

    const result = await inferenceChat([{ role: 'user', content: 'hi' }]);
    expect(result.content).toBe('from alpha');
    expect((await getInferenceProvider('beta').chat([{ role: 'user', content: 'hi' }])).content)
      .toBe('from beta');
    expect(listInferenceProviders()).toEqual(['alpha', 'beta']);
  });

  it('switches the default and rejects unknown names with context', () => {
    registerInferenceProvider(stubProvider('alpha'));
    registerInferenceProvider(stubProvider('beta'));

    setDefaultInferenceProvider('beta');
    expect(getInferenceProvider().name).toBe('beta');
    expect(() => setDefaultInferenceProvider('gamma')).toThrow('not registered');
    expect(() => getInferenceProvider('gamma')).toThrow('Registered: alpha, beta');
  });

  it('clears and reseats the default when providers are removed', () => {
    registerInferenceProvider(stubProvider('alpha'));
    registerInferenceProvider(stubProvider('beta'));

    unregisterInferenceProvider('alpha');
    expect(getInferenceProvider().name).toBe('beta');

    clearInferenceProviders();
    expect(() => getInferenceProvider()).toThrow('No inference provider registered');
  });

  it('routes inferenceEmbed through the named provider and errors without support', async () => {
    registerInferenceProvider(stubProvider('alpha'));
    registerInferenceProvider(stubProvider('with-embed'));

    expect(await inferenceEmbed('text', { provider: 'with-embed' })).toEqual([[0.1]]);
    await expect(inferenceEmbed('text')).rejects.toThrow('does not support embeddings');
  });
});
