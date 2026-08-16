import { describe, expect, it } from 'vitest';
import { InferenceError } from './errors.js';
import { OpenAICompatibleProvider } from './openai-compatible.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('OpenAICompatibleProvider', () => {
  it('maps chat completion responses onto InferenceChatResult', async () => {
    let captured: { url: string; init?: RequestInit } | undefined;
    const fetchImpl = async (url: string, init?: RequestInit) => {
      captured = { url: String(url), init };
      return jsonResponse({
        model: 'deepseek-chat',
        choices: [{ message: { content: 'hello back' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
      });
    };

    const provider = new OpenAICompatibleProvider({
      name: 'deepseek',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: 'sk-test',
      model: 'deepseek-chat',
      fetch: fetchImpl as unknown as typeof fetch,
    });

    const result = await provider.chat(
      [{ role: 'user', content: 'hello' }],
      { temperature: 0.2, maxTokens: 64 },
    );

    expect(result.content).toBe('hello back');
    expect(result.finishReason).toBe('stop');
    expect(result.usage).toEqual({ inputTokens: 5, outputTokens: 2, totalTokens: 7 });
    expect(captured?.url).toBe('https://api.deepseek.com/v1/chat/completions');
    const body = JSON.parse(captured?.init?.body as string) as Record<string, unknown>;
    expect(body.model).toBe('deepseek-chat');
    expect(body.max_tokens).toBe(64);
    expect(body.messages).toEqual([{ role: 'user', content: 'hello' }]);
    const headers = captured?.init?.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer sk-test');
  });

  it('yields delta tokens from SSE frames split across chunk boundaries', async () => {
    const frames = [
      'data: {"choices":[{"delta":{"content":"hel',
      'lo"}}]}\ndata: {"choices":[{"delta":{"content":" world"}}]}\ndata: [DONE]\n',
    ];
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const frame of frames) {
          controller.enqueue(encoder.encode(frame));
        }
        controller.close();
      },
    });
    const fetchImpl = async () => new Response(stream, { status: 200 });

    const provider = new OpenAICompatibleProvider({
      name: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'sk-test',
      model: 'meta-llama/llama-4',
      fetch: fetchImpl as unknown as typeof fetch,
    });

    let text = '';
    for await (const token of provider.stream([{ role: 'user', content: 'hi' }])) {
      text += token;
    }
    expect(text).toBe('hello world');
  });

  it('throws InferenceError with status and body on non-2xx', async () => {
    const fetchImpl = async () => jsonResponse({ error: { message: 'quota exceeded' } }, 429);
    const provider = new OpenAICompatibleProvider({
      name: 'zai',
      baseUrl: 'https://api.z.ai/api/paas/v4',
      apiKey: 'sk-test',
      model: 'glm-4.6',
      fetch: fetchImpl as unknown as typeof fetch,
    });

    const failure = await provider.chat([{ role: 'user', content: 'hi' }]).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(InferenceError);
    expect((failure as InferenceError).status).toBe(429);
    expect((failure as InferenceError).provider).toBe('zai');
  });

  it('sorts embedding rows by index and uses the configured embedding model', async () => {
    let body: Record<string, unknown> = {};
    const fetchImpl = async (_url: string, init?: RequestInit) => {
      body = JSON.parse(init?.body as string) as Record<string, unknown>;
      return jsonResponse({
        data: [
          { index: 1, embedding: [0.2, 0.3] },
          { index: 0, embedding: [0.1, 0.4] },
        ],
      });
    };
    const provider = new OpenAICompatibleProvider({
      name: 'google',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: 'sk-test',
      embeddingModel: 'gemini-embedding-001',
      fetch: fetchImpl as unknown as typeof fetch,
    });

    const vectors = await provider.embed?.(['a', 'b']);
    expect(vectors).toEqual([[0.1, 0.4], [0.2, 0.3]]);
    expect(body.model).toBe('gemini-embedding-001');
    expect(body.input).toEqual(['a', 'b']);
  });

  it('requires a model from options or config', async () => {
    const provider = new OpenAICompatibleProvider({
      name: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: 'sk-test',
      fetch: (async () => jsonResponse({})) as typeof fetch,
    });
    await expect(provider.chat([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      'No model configured',
    );
  });
});
