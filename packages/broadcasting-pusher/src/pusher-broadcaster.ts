import { createHash, createHmac } from 'node:crypto';
import type { Broadcaster, BroadcastPayload, PusherBroadcastConnectionConfig } from '@tyravel/broadcasting';

export class PusherBroadcaster implements Broadcaster {
  private readonly config: PusherBroadcastConnectionConfig;

  constructor(config: PusherBroadcastConnectionConfig) {
    this.config = config;
  }

  async broadcast(payload: BroadcastPayload): Promise<void> {
    const body = JSON.stringify({
      name: payload.event,
      channels: payload.channels,
      data: JSON.stringify(payload.data),
      socket_id: payload.socket ?? undefined,
    });

    const path = `/apps/${this.config.appId}/events`;
    const url = `${this.baseUrl()}${path}`;
    const query = this.authQuery('POST', path, body);
    const response = await fetch(`${url}?${query}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Pusher broadcast failed (${response.status}): ${text}`);
    }
  }

  signChannel(socketId: string, channelName: string, channelData?: string): string {
    const stringToSign = channelData
      ? `${socketId}:${channelName}:${channelData}`
      : `${socketId}:${channelName}`;
    return `${this.config.key}:${this.hmac(stringToSign)}`;
  }

  private baseUrl(): string {
    const scheme = this.config.useTLS === false ? 'http' : this.config.scheme ?? 'https';
    const host = this.config.host ?? `api-${this.config.cluster ?? 'mt1'}.pusher.com`;
    const port = this.config.port ? `:${this.config.port}` : '';
    return `${scheme}://${host}${port}`;
  }

  private authQuery(method: string, path: string, body: string): string {
    const authTimestamp = Math.floor(Date.now() / 1000).toString();
    const bodyMd5 = createHash('md5').update(body).digest('hex');
    const params = new URLSearchParams({
      auth_key: this.config.key,
      auth_timestamp: authTimestamp,
      auth_version: '1.0',
      body_md5: bodyMd5,
    });
    const stringToSign = `${method}\n${path}\n${params.toString()}`;
    params.set('auth_signature', this.hmac(stringToSign));
    return params.toString();
  }

  private hmac(value: string): string {
    return createHmac('sha256', this.config.secret).update(value).digest('hex');
  }
}