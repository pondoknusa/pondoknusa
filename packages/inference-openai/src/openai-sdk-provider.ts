import OpenAI, { type ClientOptions } from 'openai';
import type {
  InferenceChatOptions,
  InferenceChatResult,
  InferenceEmbedOptions,
  InferenceMessage,
  InferenceProvider,
  InferenceUsage,
} from '@pondoknusa/inference';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions/completions';

export interface OpenAISdkConfig {
  /** Registry name; defaults to `openai`. */
  name?: string;
  apiKey?: string;
  baseUrl?: string;
  /** Default chat model. */
  model?: string;
  /** Default embedding model; defaults to `text-embedding-3-small`. */
  embeddingModel?: string;
  /** Reuse a pre-configured client (custom transports, Azure, etc.). */
  client?: OpenAI;
  /** Extra options forwarded to the `OpenAI` constructor. */
  clientOptions?: ClientOptions;
}

/**
 * Translation layer from Pondoknusa's InferenceProvider contract onto the
 * first-party `openai` SDK. Everything in this package — and nothing in
 * `@pondoknusa/inference` — knows about the OpenAI client, so the dependency
 * stays contained here.
 */
export class OpenAISdkProvider implements InferenceProvider {
  readonly name: string;
  private readonly client: OpenAI;
  private readonly model: string | undefined;
  private readonly embeddingModel: string;

  constructor(config: OpenAISdkConfig = {}) {
    this.name = config.name ?? 'openai';
    this.client = config.client ?? new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl, ...config.clientOptions });
    this.model = config.model;
    this.embeddingModel = config.embeddingModel ?? 'text-embedding-3-small';
  }

  async chat(
    messages: InferenceMessage[],
    options: InferenceChatOptions = {},
  ): Promise<InferenceChatResult> {
    const response = await this.client.chat.completions.create({
      model: this.resolveModel(options.model),
      messages: messages.map(toSdkMessage),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stop,
      stream: false,
      ...options.extra,
    } as OpenAI.ChatCompletionCreateParamsNonStreaming);

    const choice = response.choices[0];
    return {
      content: choice?.message.content ?? '',
      model: response.model,
      finishReason: choice?.finish_reason,
      usage: mapUsage(response.usage),
      raw: response,
    };
  }

  async *stream(
    messages: InferenceMessage[],
    options: InferenceChatOptions = {},
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: this.resolveModel(options.model),
      messages: messages.map(toSdkMessage),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stop,
      stream: true,
      ...options.extra,
    } as OpenAI.ChatCompletionCreateParamsStreaming);

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }

  async embed(
    input: string | string[],
    options: InferenceEmbedOptions = {},
  ): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: options.model ?? this.embeddingModel,
      input: Array.isArray(input) ? input : [input],
      dimensions: options.dimensions,
      ...options.extra,
    });

    return [...response.data]
      .sort((a, b) => a.index - b.index)
      .map((row) => row.embedding);
  }

  private resolveModel(override?: string): string {
    const model = override ?? this.model;
    if (!model) {
      throw new Error('No model configured; pass options.model or config.model');
    }
    return model;
  }
}

function toSdkMessage(message: InferenceMessage): ChatCompletionMessageParam {
  const param = { role: message.role, content: message.content };
  return (message.name !== undefined ? { ...param, name: message.name } : param) as ChatCompletionMessageParam;
}

function mapUsage(usage: OpenAI.Completions.CompletionUsage | undefined): InferenceUsage | undefined {
  if (!usage) {
    return undefined;
  }
  return {
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}
