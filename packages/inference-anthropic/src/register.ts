import { registerInferenceProvider, type RegisterInferenceProviderOptions } from '@pondoknusa/inference';
import { AnthropicSdkProvider, type AnthropicSdkConfig } from './anthropic-sdk-provider.js';

export function registerAnthropicSdkProvider(
  config: AnthropicSdkConfig = {},
  options: RegisterInferenceProviderOptions = {},
): AnthropicSdkProvider {
  const provider = new AnthropicSdkProvider(config);
  registerInferenceProvider(provider, options);
  return provider;
}
