# AI inference providers

`@pondoknusa/inference` gives you one provider-agnostic interface for chat
completions, streaming, and embeddings, plus a registry so several vendors
can be configured side by side and swapped with a name.

```typescript
import { inferenceChat } from '@pondoknusa/inference';

const result = await inferenceChat([
  { role: 'system', content: 'Be terse.' },
  { role: 'user', content: 'What is a rijsttafel?' },
]);

result.content; // "A Dutch-Indonesian rice table..."
result.usage;   // { inputTokens: 24, outputTokens: 31, totalTokens: 55 }
```

## Zero-config providers

Most vendors expose an OpenAI-compatible chat-completions endpoint, so the
core package talks to them directly over `fetch` — no SDK required. Register
every provider whose API key is present in `.env`:

```typescript
import { registerInferenceProvidersFromEnv } from '@pondoknusa/inference';

registerInferenceProvidersFromEnv();
```

```dotenv
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
INFERENCE_PROVIDER=deepseek   # optional default
```

Built-in presets: **OpenAI, Anthropic, Google Gemini, xAI (Grok), Mistral,
DeepSeek, Moonshot (Kimi), Alibaba Qwen (DashScope), Zhipu AI (z.AI), MiniMax,
Perplexity, Nous Portal, Groq, Together AI, Fireworks AI, Cerebras, SambaNova,
DeepInfra, OpenRouter, GitHub Copilot, Hugging Face, NVIDIA NIM, Cloudflare
Workers AI** — plus the local servers **LM Studio, Ollama, and llama.cpp**.
See `INFERENCE_PRESETS` for the full map of names to env vars.

A few presets need more than an API key:

```dotenv
# Cloudflare Workers AI — account-scoped URL
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...

# GitHub Copilot — a GitHub token with Copilot access
COPILOT_API_KEY=ghp_...

# Local servers (keyless) — opt in, or set their *_BASE_URL to opt in per-host
OLLAMA_BASE_URL=http://gpu-box:11434/v1
```

```typescript
registerInferenceProvidersFromEnv({ includeLocal: true }); // registers LM Studio, Ollama, llama.cpp
```

## Multiple providers

Every registered provider is addressable by name:

```typescript
// Default provider (first registered, or INFERENCE_PROVIDER)
await inferenceChat(messages);

// Named provider
await inferenceChat(messages, { provider: 'openrouter', model: 'meta-llama/llama-4' });

// Streaming — works as a drop-in RagTokenStream for @pondoknusa/rag
import { streamInferenceChat } from '@pondoknusa/inference';
for await (const token of streamInferenceChat(messages, { provider: 'qwen' })) {
  process.stdout.write(token);
}

// Embeddings (providers that offer /embeddings)
const vectors = await inferenceEmbed(['pondok', 'nusa'], { provider: 'openai' });
```

## Vendor SDK packages

When a vendor ships a first-party TypeScript SDK, that dependency lives in
its own adapter package — never in the core. The adapter is a translation
layer: it implements the same `InferenceProvider` contract on top of the
vendor client, so registry functions work unchanged.

```bash
npm install @pondoknusa/inference-openai        # official OpenAI SDK
npm install @pondoknusa/inference-anthropic     # official Anthropic SDK
```

```typescript
import { registerAnthropicSdkProvider } from '@pondoknusa/inference-anthropic';

registerAnthropicSdkProvider(
  { apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-opus-4-1' },
  { default: true },
);

await inferenceChat([{ role: 'user', content: 'Hello Claude' }]);
```

The Anthropic adapter moves `system` messages into the top-level `system`
prompt and fills Anthropic's required `max_tokens` (default `1024`, override
with `defaultMaxTokens`). Anthropic has no embeddings endpoint, so the
adapter does not implement `embed`.

Both adapters accept a pre-configured `client`, letting you bring custom
transports, Azure endpoints, or Bedrock clients while keeping the Pondoknusa
interface.

## Custom endpoints

Any OpenAI-compatible endpoint — a self-hosted vLLM, Ollama, or an
unlisted vendor — registers in two lines:

```typescript
import { OpenAICompatibleProvider, registerInferenceProvider } from '@pondoknusa/inference';

registerInferenceProvider(new OpenAICompatibleProvider({
  name: 'local',
  baseUrl: 'http://localhost:8000/v1',
  apiKey: 'not-needed',
  model: 'qwen3:32b',
}));
```

## Writing your own provider

Implement three methods and register the instance. Everything else —
env discovery, default selection, named routing — comes from the registry:

```typescript
import type {
  InferenceChatOptions,
  InferenceChatResult,
  InferenceMessage,
  InferenceProvider,
} from '@pondoknusa/inference';

class MyProvider implements InferenceProvider {
  readonly name = 'my-vendor';

  async chat(messages: InferenceMessage[], options: InferenceChatOptions = {}): Promise<InferenceChatResult> {
    // call your vendor, map the response
  }

  async *stream(messages: InferenceMessage[], options: InferenceChatOptions = {}): AsyncIterable<string> {
    // yield text deltas
  }

  async embed(input: string | string[]): Promise<number[][]> {
    // optional — omit if the vendor has no embeddings endpoint
  }
}
```

## Testing

Inject a fake `fetch` into `OpenAICompatibleProvider`, or a fake `client`
into the SDK adapters — no network and no credentials needed. See
`packages/inference/src/openai-compatible.test.ts` for the pattern.
