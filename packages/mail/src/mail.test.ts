import { describe, expect, it } from 'vitest';
import { ArrayMailTransport, MailManager, Mailable } from './index.js';
import type { MailMessage } from './types.js';

class WelcomeMail extends Mailable {
  build(): MailMessage {
    return {
      subject: 'Welcome',
      to: [],
      text: 'Hello',
    };
  }
}

describe('MailManager', () => {
  it('sends mailables through array transport', async () => {
    const manager = new MailManager({
      default: 'array',
      from: { address: 'app@example.com', name: 'App' },
      connections: { array: { driver: 'array' } },
    });
    await manager.mailer().to('user@example.com').send(new WelcomeMail());
    const transport = manager.transport('array') as ArrayMailTransport;
    expect(transport.messages).toHaveLength(1);
    expect(transport.messages[0]?.subject).toBe('Welcome');
    expect(transport.messages[0]?.to[0]?.address).toBe('user@example.com');
  });
});