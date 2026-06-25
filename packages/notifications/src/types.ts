export type NotificationChannel = 'mail' | 'database' | 'slack' | 'webhook';

export interface Notifiable {
  getKey(): string | number;
  routeNotificationForMail?(): string | { address: string; name?: string };
}

export interface NotificationsConfig {
  table?: string;
  connection?: string;
  queue?: string;
  queueConnection?: string;
}