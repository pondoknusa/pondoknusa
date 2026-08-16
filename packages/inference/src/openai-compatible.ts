import { InferenceError } from './errors.js';
import type { InferenceProvider, InferenceProviderConfig } from './provider.js';
import type {
  InferenceChatOptions,
  InferenceChatResult,
  InferenceEmbedOptions,
  InferenceMessage,
  InferenceRole,
  InferenceUsage,
} from './types.js';

export interface OpenAICompatibleConfig extends InferenceProviderConfig {
  /** Registry name for this provider, e.g. `deepseek`. */
  name: string;
  baseUrl: string;
  apiKey: string;
  /** Auth header name; defaults to `Authorization` with a `Bearer` scheme. */
  authHeader?: string;
  /** Model used for embeddings when the call does not pass one. */
  embeddingModel?: string;
}

interface OpenAIChatResponse {
  model?: string;
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface OpenAIEmbeddingResponse {
  data?: Array<{ embedding?: number[]; index?: number }>;
}

/**
 * Speaks the OpenAI chat-completions wire format over `fetch`. Covers every
 * vendor that exposes an OpenAI-compatible endpoint (see `INFERENCE_PRESETS`)
 * without pulling an SDK into the core package.
 */
export class OpenAICompatibleProvider implements InferenceProvider {
  readonly name: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly authHeader: string | undefined;
  private readonly model: string | undefined;
  private readonly embeddingModel: string | undefined;
  private readonly headers: Record<string, string> | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(config: OpenAICompatibleConfig) {
    this.name = config.name;
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.authHeader = config.authHeader;
    this.model = config.model;
    this.embeddingModel = config.embeddingModel;
    this.headers = config.headers;
    this.fetchImpl = config.fetch ?? fetch;
  }

  async chat(
    messages: InferenceMessage[],
    options: InferenceChatOptions = {},
  ): Promise<InferenceChatResult> {
    const payload = await this.postJson<OpenAIChatResponse>('/chat/completions', {
      model: this.resolveModel(options.model),
      messages: messages.map(serializeMessage),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stop,
      stream: false,
      ...options.extra,
    });

    const choice = payload.choices?.[0];
    if (!choice) {
      throw new InferenceError('Chat completion returned no choices', this.name, undefined, JSON.stringify(payload));
    }

    return {
      content: choice.message?.content ?? '',
      model: payload.model ?? this.resolveModel(options.model),
      finishReason: choice.finish_reason ?? undefined,
      usage: mapUsage(payload.usage),
      raw: payload,
    };
  }

  async *stream(
    messages: InferenceMessage[],
    options: InferenceChatOptions = {},
  ): AsyncIterable<string> {
    const response = await this.request('/chat/completions', {
      model: this.resolveModel(options.model),
      messages: messages.map(serializeMessage),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stop,
      stream: true,
      ...options.extra,
    });

    if (!response.body) {
      throw new InferenceError('Streaming response has no body', this.name, response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);
        newlineIndex = buffer.indexOf('\n');
        yield* parseSseLine(line, this.name);
      }
    }
    yield* parseSseLine(buffer.replace(/\r$/, ''), this.name);
  }

  async embed(
    input: string | string[],
    options: InferenceEmbedOptions = {},
  ): Promise<number[][]> {
    const model = options.model ?? this.embeddingModel;
    if (!model) {
      throw new InferenceError(
        'No embedding model configured; pass options.model or config.embeddingModel',
        this.name,
      );
    }

    const payload = await this.postJson<OpenAIEmbeddingResponse>('/embeddings', {
      model,
      input: Array.isArray(input) ? input : [input],
      dimensions: options.dimensions,
      ...options.extra,
    });

    const rows = [...(payload.data ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    if (rows.length === 0) {
      throw new InferenceError('Embedding response contained no vectors', this.name, undefined, JSON.stringify(payload));
    }
    return rows.map((row) => row.embedding ?? []);
  }

  private resolveModel(override?: string): string {
    const model = override ?? this.model;
    if (!model) {
      throw new InferenceError('No model configured; pass options.model or config.model', this.name);
    }
    return model;
  }

  private async postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await this.request(path, body);
    return (await response.json()) as T;
  }

  private async request(path: string, body: Record<string, unknown>): Promise<Response> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.authHeader
          ? { [this.authHeader]: this.apiKey }
          : { authorization: `Bearer ${this.apiKey}` }),
        ...this.headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InferenceError(
        `${this.name} request failed (${response.status})`,
        this.name,
        response.status,
        text,
      );
    }
    return response;
  }
}

function* parseSseLine(line: string, providerName: string): Generator<string> {
  if (!line.startsWith('data:')) {
    return;
  }
  const data = line.slice('data:'.length).trim();
  if (data === '[DONE]') {
    return;
  }
  let payload: { choices?: Array<{ delta?: { content?: string } }> };
  try {
    payload = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
  } catch (error) {
    throw new InferenceError(`Malformed SSE frame from ${providerName}: ${data}`, providerName, undefined, data);
  }
  const delta = payload.choices?.[0]?.delta?.content;
  if (delta) {
    yield delta;
  }
}

function serializeMessage(message: InferenceMessage): { role: InferenceRole; content: string; name?: string } {
  const serialized: { role: InferenceRole; content: string; name?: string } = {
    role: message.role,
    content: message.content,
  };
  if (message.name !== undefined) {
    serialized.name = message.name;
  }
  return serialized;
}

function mapUsage(usage: OpenAIChatResponse['usage']): InferenceUsage | undefined {
  if (!usage) {
    return undefined;
  }
  return {
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}
