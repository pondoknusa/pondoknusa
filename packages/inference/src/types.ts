export type InferenceRole = 'system' | 'user' | 'assistant';

export interface InferenceMessage {
  role: InferenceRole;
  content: string;
  name?: string;
}

export interface InferenceChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string | string[];
  /** Provider-specific passthrough for options the core types do not model. */
  extra?: Record<string, unknown>;
}

export interface InferenceUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface InferenceChatResult {
  content: string;
  model: string;
  finishReason?: string;
  usage?: InferenceUsage;
  /** Raw provider response for callers that need provider-specific fields. */
  raw?: unknown;
}

export interface InferenceEmbedOptions {
  model?: string;
  dimensions?: number;
  /** Provider-specific passthrough for options the core types do not model. */
  extra?: Record<string, unknown>;
}
