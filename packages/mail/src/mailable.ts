import type { MailMessage } from './types.js';

export abstract class Mailable {
  abstract build(): MailMessage | Promise<MailMessage>;

  async toMessage(): Promise<MailMessage> {
    return this.build();
  }
}