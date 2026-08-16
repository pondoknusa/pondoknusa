import type { InferenceProvider } from './provider.js';
import type {
  InferenceChatOptions,
  InferenceChatResult,
  InferenceEmbedOptions,
  InferenceMessage,
} from './types.js';

const providers = new Map<string, InferenceProvider>();
let defaultProviderName: string | undefined;

export interface RegisterInferenceProviderOptions {
  /** Override the provider's own `name` as registry key. */
  name?: string;
  /** Make this the default provider. Defaults to true when it is the first one registered. */
  default?: boolean;
}

export function registerInferenceProvider(
  provider: InferenceProvider,
  options: RegisterInferenceProviderOptions = {},
): void {
  const name = options.name ?? provider.name;
  providers.set(name, provider);
  if (options.default === true || (defaultProviderName === undefined && options.default !== false)) {
    defaultProviderName = name;
  }
}

export function unregisterInferenceProvider(name: string): boolean {
  const removed = providers.delete(name);
  if (defaultProviderName === name) {
    defaultProviderName = providers.keys().next().value;
  }
  return removed;
}

export function setDefaultInferenceProvider(name: string): void {
  if (!providers.has(name)) {
    throw new Error(`Inference provider "${name}" is not registered`);
  }
  defaultProviderName = name;
}

export function getInferenceProvider(name?: string): InferenceProvider {
  const key = name ?? defaultProviderName;
  if (key === undefined) {
    throw new Error('No inference provider registered. Call registerInferenceProvider() first.');
  }
  const provider = providers.get(key);
  if (!provider) {
    throw new Error(`Inference provider "${key}" is not registered. Registered: ${[...providers.keys()].join(', ')}`);
  }
  return provider;
}


export function listInferenceProviders(): string[] {
  return [...providers.keys()];
}

/** Test helper: wipe the registry. */
export function clearInferenceProviders(): void {
  providers.clear();
  defaultProviderName = undefined;
}

export interface InferenceRequestOptions extends InferenceChatOptions {
  provider?: string;
}

export async function inferenceChat(
  messages: InferenceMessage[],
  options: InferenceRequestOptions = {},
): Promise<InferenceChatResult> {
  const { provider, ...chatOptions } = options;
  return getInferenceProvider(provider).chat(messages, chatOptions);
}

export function streamInferenceChat(
  messages: InferenceMessage[],
  options: InferenceRequestOptions = {},
): AsyncIterable<string> {
  const { provider, ...chatOptions } = options;
  return getInferenceProvider(provider).stream(messages, chatOptions);
}

export async function inferenceEmbed(
  input: string | string[],
  options: InferenceEmbedOptions & { provider?: string } = {},
): Promise<number[][]> {
  const { provider, ...embedOptions } = options;
  const resolved = getInferenceProvider(provider);
  if (!resolved.embed) {
    throw new Error(`Inference provider "${resolved.name}" does not support embeddings`);
  }
  return resolved.embed(input, embedOptions);
}
