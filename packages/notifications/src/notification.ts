import type { MailMessage } from '@tyravel/mail';
import type { NotificationChannel, Notifiable } from './types.js';

export abstract class Notification {
  abstract via(notifiable: Notifiable): NotificationChannel[];

  /** When true (via ShouldQueue + override), notification is pushed to the queue. */
  shouldQueue?(): boolean;

  /** Optional queue routing (Laravel-style). */
  connection?: string;
  queue?: string;
  delaySeconds?: number;

  toMail?(notifiable: Notifiable): MailMessage | Promise<MailMessage>;

  toDatabase?(notifiable: Notifiable): Record<string, unknown> | Promise<Record<string, unknown>>;

  id(): string {
    return this.constructor.name;
  }
}