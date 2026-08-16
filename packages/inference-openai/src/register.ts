import { registerInferenceProvider, type RegisterInferenceProviderOptions } from '@pondoknusa/inference';
import { OpenAISdkProvider, type OpenAISdkConfig } from './openai-sdk-provider.js';

export function registerOpenAISdkProvider(
  config: OpenAISdkConfig = {},
  options: RegisterInferenceProviderOptions = {},
): OpenAISdkProvider {
  const provider = new OpenAISdkProvider(config);
  registerInferenceProvider(provider, options);
  return provider;
}
