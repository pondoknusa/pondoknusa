export interface UpstashClientOptions {
  url: string;
  token: string;
  fetch?: typeof fetch;
}

export class UpstashClient {
  constructor(private readonly options: UpstashClientOptions) {}

  async command<T = unknown>(args: string[]): Promise<T> {
    const fetchImpl = this.options.fetch ?? fetch;
    const response = await fetchImpl(this.options.url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.options.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upstash command failed (${response.status}): ${text}`);
    }

    const payload = await response.json() as { result?: T; error?: string };
    if (payload.error) {
      throw new Error(`Upstash error: ${payload.error}`);
    }
    return payload.result as T;
  }
}