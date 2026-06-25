import type { Notification } from '../notification.js';
import type { Notifiable } from '../types.js';

export interface WebhookMessage {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
}

export class WebhookChannel {
  async send(notifiable: Notifiable, notification: Notification): Promise<void> {
    if (!notification.toWebhook) {
      throw new Error(`Notification ${notification.id()} does not implement toWebhook().`);
    }

    const message = await notification.toWebhook(notifiable);
    const response = await fetch(message.url, {
      method: message.method ?? 'POST',
      headers: {
        'content-type': 'application/json',
        ...message.headers,
      },
      body: JSON.stringify(message.body ?? {}),
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed with status ${response.status}.`);
    }
  }
}