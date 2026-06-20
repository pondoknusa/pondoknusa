import type { MailManager } from '@tyravel/mail';
import type { Notification } from './notification.js';
import type { Notifiable } from './types.js';
import { MailChannel } from './channels/mail-channel.js';
import { DatabaseChannel } from './channels/database-channel.js';
import type { DatabaseChannelOptions } from './channels/database-channel.js';

export class NotificationManager {
  private readonly mailChannel: MailChannel;
  private readonly databaseChannel?: DatabaseChannel;

  constructor(
    mail: MailManager,
    database?: DatabaseChannelOptions,
  ) {
    this.mailChannel = new MailChannel(mail);
    this.databaseChannel = database ? new DatabaseChannel(database) : undefined;
  }

  async send(notifiable: Notifiable, notification: Notification): Promise<void> {
    const channels = notification.via(notifiable);
    await Promise.all(
      channels.map((channel) => this.sendOnChannel(notifiable, notification, channel)),
    );
  }

  private async sendOnChannel(
    notifiable: Notifiable,
    notification: Notification,
    channel: string,
  ): Promise<void> {
    switch (channel) {
      case 'mail':
        await this.mailChannel.send(notifiable, notification);
        return;
      case 'database':
        if (!this.databaseChannel) {
          throw new Error('Database notification channel is not configured.');
        }
        await this.databaseChannel.send(notifiable, notification);
        return;
      default:
        throw new Error(`Unknown notification channel [${channel}].`);
    }
  }
}