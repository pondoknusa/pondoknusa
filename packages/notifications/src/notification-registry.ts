import type { Notification } from './notification.js';

export type NotificationConstructor = new () => Notification;

export class NotificationRegistry {
  private readonly notifications = new Map<string, NotificationConstructor>();

  register(constructor: NotificationConstructor): this {
    this.notifications.set(constructor.name, constructor);
    return this;
  }

  registerInstance(notification: Notification): this {
    return this.register(notification.constructor as NotificationConstructor);
  }

  create(name: string): Notification {
    const constructor = this.notifications.get(name);
    if (!constructor) {
      throw new Error(`Notification class not registered: ${name}`);
    }
    return new constructor();
  }
}