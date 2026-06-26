import type { DigestOptions } from './digest-notification.js';
import { NotificationDigest } from './notification-digest.js';
import type { NotificationManager } from './notification-manager.js';
import type { Notification } from './notification.js';
import type { Notifiable } from './types.js';

export class NotificationBatch {
  private readonly items: Array<{ notifiable: Notifiable; notification: Notification }> = [];

  add(notifiable: Notifiable, notification: Notification): this {
    this.items.push({ notifiable, notification });
    return this;
  }

  async send(manager: NotificationManager): Promise<void> {
    for (const item of this.items) {
      await manager.send(item.notifiable, item.notification);
    }
  }

  async sendNow(manager: NotificationManager): Promise<void> {
    for (const item of this.items) {
      await manager.sendNow(item.notifiable, item.notification);
    }
  }

  async sendDigest(manager: NotificationManager, options?: DigestOptions): Promise<void> {
    const digest = new NotificationDigest();
    for (const item of this.items) {
      digest.add(item.notifiable, item.notification);
    }
    await digest.send(manager, options);
  }

  async sendDigestNow(manager: NotificationManager, options?: DigestOptions): Promise<void> {
    const digest = new NotificationDigest();
    for (const item of this.items) {
      digest.add(item.notifiable, item.notification);
    }
    await digest.sendNow(manager, options);
  }
}