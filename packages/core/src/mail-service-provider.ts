import { ConfigRepository } from '@tyravel/config';
import { MailManager, type MailConfig } from '@tyravel/mail';
import { ServiceProvider } from './service-provider.js';

export class MailServiceProvider extends ServiceProvider {
  override register() {
    const config = this.app.make<ConfigRepository>('config');
    const mailConfig = config.get<MailConfig>('mail');
    const manager = new MailManager(mailConfig);

    this.app.instance('mail', manager);
    this.app.singleton(MailManager, () => manager);
  }
}