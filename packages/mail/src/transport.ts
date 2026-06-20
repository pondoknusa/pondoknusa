import type { MailMessage } from './types.js';

export interface MailTransport {
  send(message: MailMessage): Promise<void>;
}

export class ArrayMailTransport implements MailTransport {
  readonly messages: MailMessage[] = [];

  async send(message: MailMessage): Promise<void> {
    this.messages.push(structuredClone(message));
  }
}

export class LogMailTransport implements MailTransport {
  constructor(private readonly channel: 'stdout' | 'stderr' = 'stdout') {}

  async send(message: MailMessage): Promise<void> {
    const line = `[mail] ${message.subject} → ${message.to.map((t) => t.address).join(', ')}`;
    if (this.channel === 'stderr') {
      console.error(line);
    } else {
      console.log(line);
    }
  }
}