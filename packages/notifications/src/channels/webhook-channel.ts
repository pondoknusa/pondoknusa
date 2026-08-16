import type { Notification } from '../notification.js';
import type { Notifiable } from '../types.js';
import { assertPublicHttpUrl } from '@pondoknusa/support';

export interface WebhookMessage {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  /**
   * Allow private/loopback destinations (default false). Only enable for
   * trusted, app-controlled URLs — never for user-supplied destinations.
   */
  allowPrivateNetwork?: boolean;
}

export class WebhookChannel {
  async send(notifiable: Notifiable, notification: Notification): Promise<void> {
    if (!notification.toWebhook) {
      throw new Error(`Notification ${notification.id()} does not implement toWebhook().`);
    }

    const message = await notification.toWebhook(notifiable);
    if (!message.allowPrivateNetwork) {
      await assertPublicHttpUrl(message.url);
    }

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
