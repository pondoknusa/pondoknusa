import type { Notification } from './notification.js';
import type { NotificationManager } from './notification-manager.js';
import type { Notifiable } from './types.js';

let notifier: NotificationManager | undefined;

export function setNotificationSender(manager: NotificationManager): void {
  notifier = manager;
}

export async function notify(
  notifiable: Notifiable,
  notification: Notification,
): Promise<void> {
  if (!notifier) {
    throw new Error('Notification manager is not configured.');
  }
  await notifier.send(notifiable, notification);
}