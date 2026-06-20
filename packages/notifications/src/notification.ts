import type { MailMessage } from '@tyravel/mail';
import type { NotificationChannel, Notifiable } from './types.js';

export abstract class Notification {
  abstract via(notifiable: Notifiable): NotificationChannel[];

  toMail?(notifiable: Notifiable): MailMessage | Promise<MailMessage>;

  toDatabase?(notifiable: Notifiable): Record<string, unknown> | Promise<Record<string, unknown>>;

  id(): string {
    return this.constructor.name;
  }
}