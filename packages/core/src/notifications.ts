import type { Notification } from '@tyravel/notifications';
import { notify as sendNotification } from '@tyravel/notifications';
import type { Notifiable } from '@tyravel/notifications';
import type { Application } from './application.js';

let notificationApplication: Application | undefined;

export function setNotificationApplication(app: Application): void {
  notificationApplication = app;
}

export interface NotificationsFacade {
  send(notifiable: Notifiable, notification: Notification): Promise<void>;
}

export const Notifications: NotificationsFacade = {
  send: (notifiable, notification) => sendNotification(notifiable, notification),
};