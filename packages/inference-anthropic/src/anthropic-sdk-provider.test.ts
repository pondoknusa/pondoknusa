import { describe, expect, it } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { AnthropicSdkProvider } from './anthropic-sdk-provider.js';

describe('AnthropicSdkProvider', () => {
  it('moves system messages to the system prompt and maps usage', async () => {
    let captured: Record<string, unknown> = {};
    const client = {
      messages: {
        create: async (params: Record<string, unknown>) => {
          captured = params;
          return {
            model: 'claude-opus-4-1',
            content: [
              { type: 'text', text: 'first ' },
              { type: 'tool_use', id: 't1', name: 'noop', input: {} },
              { type: 'text', text: 'last' },
            ],
            stop_reason: 'end_turn',
            usage: { input_tokens: 10, output_tokens: 5 },
          };
        },
      },
    } as unknown as Anthropic;

    const provider = new AnthropicSdkProvider({ client, model: 'claude-opus-4-1' });
    const result = await provider.chat(
      [
        { role: 'system', content: 'be terse' },
        { role: 'system', content: 'reply in English' },
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
        { role: 'user', content: 'again' },
      ],
      { temperature: 0.3 },
    );

    expect(result.content).toBe('first last');
    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 5, totalTokens: 15 });
    expect(result.finishReason).toBe('end_turn');
    expect(captured.system).toBe('be terse\n\nreply in English');
    expect(captured.max_tokens).toBe(1024);
    expect(captured.messages).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'again' },
    ]);
  });

  it('streams text deltas only, skipping non-text events', async () => {
    async function* events() {
      yield { type: 'message_start' };
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'ha' } };
      yield { type: 'content_block_delta', delta: { type: 'input_json_delta', partial_json: '{}' } };
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'i' } };
      yield { type: 'message_stop' };
    }
    const client = {
      messages: { create: async () => events() },
    } as unknown as Anthropic;

    const provider = new AnthropicSdkProvider({ client, model: 'claude-opus-4-1' });
    let text = '';
    for await (const token of provider.stream([{ role: 'user', content: 'hi' }])) {
      text += token;
    }
    expect(text).toBe('hai');
  });

  it('uses config.defaultMaxTokens when a call sets no maxTokens', async () => {
    let captured: Record<string, unknown> = {};
    const client = {
      messages: {
        create: async (params: Record<string, unknown>) => {
          captured = params;
          return {
            model: 'claude-haiku-4-5',
            content: [{ type: 'text', text: 'ok' }],
            stop_reason: 'end_turn',
            usage: { input_tokens: 1, output_tokens: 1 },
          };
        },
      },
    } as unknown as Anthropic;

    const provider = new AnthropicSdkProvider({
      client,
      model: 'claude-haiku-4-5',
      defaultMaxTokens: 4096,
    });
    await provider.chat([{ role: 'user', content: 'hi' }]);
    expect(captured.max_tokens).toBe(4096);
  });

  it('declines embeddings because Anthropic has no embeddings endpoint', () => {
    const provider = new AnthropicSdkProvider({
      client: { messages: { create: async () => ({}) } } as unknown as Anthropic,
      model: 'claude-haiku-4-5',
    });
    expect(provider.embed).toBeUndefined();
  });
});
