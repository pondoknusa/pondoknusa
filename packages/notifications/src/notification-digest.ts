import { DigestNotification, type DigestOptions } from './digest-notification.js';
import type { NotificationManager } from './notification-manager.js';
import type { Notification } from './notification.js';
import type { Notifiable } from './types.js';

export class NotificationDigest {
  private readonly groups = new Map<
    string,
    { notifiable: Notifiable; notifications: Notification[] }
  >();

  private groupKey(notifiable: Notifiable): string {
    return `${notifiable.constructor.name}:${String(notifiable.getKey())}`;
  }

  add(notifiable: Notifiable, notification: Notification): this {
    const key = this.groupKey(notifiable);
    const existing = this.groups.get(key);

    if (existing) {
      existing.notifications.push(notification);
      return this;
    }

    this.groups.set(key, { notifiable, notifications: [notification] });
    return this;
  }

  async send(manager: NotificationManager, options?: DigestOptions): Promise<void> {
    for (const { notifiable, notifications } of this.groups.values()) {
      if (notifications.length === 1) {
        await manager.send(notifiable, notifications[0]!);
        continue;
      }

      await manager.send(notifiable, new DigestNotification(notifications, options));
    }
  }

  async sendNow(manager: NotificationManager, options?: DigestOptions): Promise<void> {
    for (const { notifiable, notifications } of this.groups.values()) {
      if (notifications.length === 1) {
        await manager.sendNow(notifiable, notifications[0]!);
        continue;
      }

      await manager.sendNow(notifiable, new DigestNotification(notifications, options));
    }
  }
}