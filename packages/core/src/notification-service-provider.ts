import { ConfigRepository } from '@tyravel/config';
import { DatabaseManager } from '@tyravel/database';
import { MailManager } from '@tyravel/mail';
import {
  NotificationManager,
  setNotificationSender,
  type NotificationsConfig,
} from '@tyravel/notifications';
import { ServiceProvider } from './service-provider.js';

export class NotificationServiceProvider extends ServiceProvider {
  override register() {
    const config = this.app.make<ConfigRepository>('config');
    const notificationsConfig = config.get<NotificationsConfig>('notifications', {});
    const mail = this.app.make<MailManager>('mail');

    const database = this.resolveDatabase();
    const manager = new NotificationManager(
      mail,
      database
        ? {
            connection: database.connection(notificationsConfig.connection),
            table: notificationsConfig.table,
          }
        : undefined,
    );

    this.app.instance('notifications', manager);
    this.app.singleton(NotificationManager, () => manager);
    setNotificationSender(manager);
  }

  private resolveDatabase(): DatabaseManager | undefined {
    try {
      return this.app.make<DatabaseManager>('db');
    } catch {
      return undefined;
    }
  }
}