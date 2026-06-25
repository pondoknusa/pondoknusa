import type { Notification } from '../notification.js';
import type { Notifiable } from '../types.js';

export interface SlackMessage {
  webhookUrl: string;
  text: string;
  blocks?: unknown[];
}

export class SlackChannel {
  async send(notifiable: Notifiable, notification: Notification): Promise<void> {
    if (!notification.toSlack) {
      throw new Error(`Notification ${notification.id()} does not implement toSlack().`);
    }

    const message = await notification.toSlack(notifiable);
    const response = await fetch(message.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: message.text,
        blocks: message.blocks,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed with status ${response.status}.`);
    }
  }
}