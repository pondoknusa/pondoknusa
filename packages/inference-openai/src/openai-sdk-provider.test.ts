import { describe, expect, it } from 'vitest';
import type OpenAI from 'openai';
import { OpenAISdkProvider } from './openai-sdk-provider.js';

describe('OpenAISdkProvider', () => {
  it('translates InferenceChatOptions into SDK params and maps the response', async () => {
    let captured: Record<string, unknown> = {};
    const client = {
      chat: {
        completions: {
          create: async (params: Record<string, unknown>) => {
            captured = params;
            return {
              model: 'gpt-5',
              choices: [{ message: { content: 'sdk says hi' }, finish_reason: 'stop' }],
              usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 },
            };
          },
        },
      },
      embeddings: { create: async () => ({ data: [] }) },
    } as unknown as OpenAI;

    const provider = new OpenAISdkProvider({ client, model: 'gpt-5' });
    const result = await provider.chat(
      [
        { role: 'system', content: 'be terse' },
        { role: 'user', content: 'hi', name: 'simon' },
      ],
      { temperature: 0.5, maxTokens: 128 },
    );

    expect(result.content).toBe('sdk says hi');
    expect(result.usage).toEqual({ inputTokens: 3, outputTokens: 4, totalTokens: 7 });
    expect(captured.model).toBe('gpt-5');
    expect(captured.max_tokens).toBe(128);
    expect(captured.messages).toEqual([
      { role: 'system', content: 'be terse' },
      { role: 'user', content: 'hi', name: 'simon' },
    ]);
  });

  it('streams delta content from the SDK async iterator', async () => {
    async function* chunks() {
      yield { choices: [{ delta: { content: 'foo' } }] };
      yield { choices: [{ delta: {} }] };
      yield { choices: [{ delta: { content: 'bar' } }] };
    }
    const client = {
      chat: { completions: { create: async () => chunks() } },
      embeddings: { create: async () => ({ data: [] }) },
    } as unknown as OpenAI;

    const provider = new OpenAISdkProvider({ client, model: 'gpt-5' });
    let text = '';
    for await (const token of provider.stream([{ role: 'user', content: 'hi' }])) {
      text += token;
    }
    expect(text).toBe('foobar');
  });

  it('sorts embeddings by index and honours the configured embedding model', async () => {
    let captured: Record<string, unknown> = {};
    const client = {
      chat: { completions: { create: async () => ({}) } },
      embeddings: {
        create: async (params: Record<string, unknown>) => {
          captured = params;
          return {
            data: [
              { index: 1, embedding: [2] },
              { index: 0, embedding: [1] },
            ],
          };
        },
      },
    } as unknown as OpenAI;

    const provider = new OpenAISdkProvider({ client, embeddingModel: 'text-embedding-3-large' });
    const vectors = await provider.embed(['a', 'b']);
    expect(vectors).toEqual([[1], [2]]);
    expect(captured.model).toBe('text-embedding-3-large');
  });
});
