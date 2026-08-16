import Anthropic, { type ClientOptions } from '@anthropic-ai/sdk';
import type {
  InferenceChatOptions,
  InferenceChatResult,
  InferenceMessage,
  InferenceProvider,
  InferenceUsage,
} from '@pondoknusa/inference';

export interface AnthropicSdkConfig {
  /** Registry name; defaults to `anthropic`. */
  name?: string;
  apiKey?: string;
  baseUrl?: string;
  /** Default chat model. */
  model?: string;
  /** Anthropic requires max_tokens; used when a call does not set maxTokens. */
  defaultMaxTokens?: number;
  /** Reuse a pre-configured client (custom transports, Bedrock, etc.). */
  client?: Anthropic;
  /** Extra options forwarded to the `Anthropic` constructor. */
  clientOptions?: ClientOptions;
}

interface TranslatedMessages {
  system?: string;
  messages: Anthropic.MessageParam[];
}

/**
 * Translation layer from Pondoknusa's InferenceProvider contract onto the
 * first-party `@anthropic-ai/sdk` client. The Anthropic wire format moves
 * system prompts out of the message list and requires `max_tokens`, both of
 * which are handled here so callers keep one portable API.
 *
 * Anthropic offers no embeddings endpoint, so this provider intentionally
 * does not implement `embed`.
 */
export class AnthropicSdkProvider implements InferenceProvider {
  readonly name: string;
  private readonly client: Anthropic;
  private readonly model: string | undefined;
  private readonly defaultMaxTokens: number;

  constructor(config: AnthropicSdkConfig = {}) {
    this.name = config.name ?? 'anthropic';
    this.client = config.client ?? new Anthropic({ apiKey: config.apiKey, baseURL: config.baseUrl, ...config.clientOptions });
    this.model = config.model;
    this.defaultMaxTokens = config.defaultMaxTokens ?? 1024;
  }

  async chat(
    messages: InferenceMessage[],
    options: InferenceChatOptions = {},
  ): Promise<InferenceChatResult> {
    const translated = translateMessages(messages);
    const response = await this.client.messages.create({
      model: this.resolveModel(options.model),
      messages: translated.messages,
      system: translated.system,
      max_tokens: options.maxTokens ?? this.defaultMaxTokens,
      temperature: options.temperature,
      top_p: options.topP,
      stop_sequences: normalizeStop(options.stop),
      stream: false,
      ...options.extra,
    } as Anthropic.MessageCreateParamsNonStreaming);

    return {
      content: response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join(''),
      model: response.model,
      finishReason: response.stop_reason ?? undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      } satisfies InferenceUsage,
      raw: response,
    };
  }

  async *stream(
    messages: InferenceMessage[],
    options: InferenceChatOptions = {},
  ): AsyncIterable<string> {
    const translated = translateMessages(messages);
    const stream = await this.client.messages.create({
      model: this.resolveModel(options.model),
      messages: translated.messages,
      system: translated.system,
      max_tokens: options.maxTokens ?? this.defaultMaxTokens,
      temperature: options.temperature,
      top_p: options.topP,
      stop_sequences: normalizeStop(options.stop),
      stream: true,
      ...options.extra,
    } as Anthropic.MessageCreateParamsStreaming);

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }

  private resolveModel(override?: string): string {
    const model = override ?? this.model;
    if (!model) {
      throw new Error('No model configured; pass options.model or config.model');
    }
    return model;
  }
}

/** System messages become the top-level `system` prompt on the Anthropic API. */
function translateMessages(messages: InferenceMessage[]): TranslatedMessages {
  const system = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n');

  const chatMessages: Anthropic.MessageParam[] = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }));

  return system.length > 0 ? { system, messages: chatMessages } : { messages: chatMessages };
}

function normalizeStop(stop: string | string[] | undefined): string[] | undefined {
  if (stop === undefined) {
    return undefined;
  }
  return Array.isArray(stop) ? stop : [stop];
}
