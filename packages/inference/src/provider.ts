import type {
  InferenceChatOptions,
  InferenceChatResult,
  InferenceEmbedOptions,
  InferenceMessage,
} from './types.js';

/**
 * Contract every inference provider implements. Chat and streaming are
 * required; embeddings are optional because not every vendor offers them
 * (Anthropic does not).
 */
export interface InferenceProvider {
  readonly name: string;

  chat(messages: InferenceMessage[], options?: InferenceChatOptions): Promise<InferenceChatResult>;

  stream(messages: InferenceMessage[], options?: InferenceChatOptions): AsyncIterable<string>;

  embed?(
    input: string | string[],
    options?: InferenceEmbedOptions,
  ): Promise<number[][]>;
}

export interface InferenceProviderConfig {
  model?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}
