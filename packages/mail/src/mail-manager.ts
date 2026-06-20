import { ArrayMailTransport, LogMailTransport, type MailTransport } from './transport.js';
import type { MailAddress, MailConfig, MailConnectionConfig, MailMessage } from './types.js';
import { Mailable } from './mailable.js';

export class MailManager {
  private readonly transports = new Map<string, MailTransport>();

  constructor(private readonly config: MailConfig) {}

  mailer(name?: string): Mailer {
    const connection = name ?? this.config.default;
    return new Mailer(this.resolveTransport(connection), this.config.from);
  }

  transport(name?: string): MailTransport {
    return this.resolveTransport(name ?? this.config.default);
  }

  private resolveTransport(connection: string): MailTransport {
    const existing = this.transports.get(connection);
    if (existing) {
      return existing;
    }

    const config = this.config.connections[connection];
    if (!config) {
      throw new Error(`Mail connection [${connection}] is not configured.`);
    }

    const transport = this.buildTransport(config);
    this.transports.set(connection, transport);
    return transport;
  }

  private buildTransport(config: MailConnectionConfig): MailTransport {
    switch (config.driver) {
      case 'array':
        return new ArrayMailTransport();
      case 'log':
        return new LogMailTransport(config.channel ?? 'stdout');
      default:
        throw new Error('Unsupported mail driver.');
    }
  }
}

export class Mailer {
  private recipients: MailAddress[] = [];

  constructor(
    private readonly transport: MailTransport,
    private readonly defaultFrom: MailAddress,
  ) {}

  to(address: string | MailAddress | Array<string | MailAddress>): this {
    const list = Array.isArray(address) ? address : [address];
    for (const entry of list) {
      this.recipients.push(normalizeAddress(entry));
    }
    return this;
  }

  async send(mailable: Mailable | MailMessage): Promise<void> {
    const resolved: MailMessage =
      mailable instanceof Mailable ? await mailable.toMessage() : mailable;
    const merged: MailMessage = {
      subject: resolved.subject,
      from: resolved.from ?? this.defaultFrom,
      to: resolved.to.length > 0 ? resolved.to : this.recipients,
      cc: resolved.cc,
      bcc: resolved.bcc,
      replyTo: resolved.replyTo,
      text: resolved.text,
      html: resolved.html,
      tags: resolved.tags,
    };
    if (merged.to.length === 0) {
      throw new Error('Mail message requires at least one recipient.');
    }
    await this.transport.send(merged);
  }
}

function normalizeAddress(entry: string | MailAddress): MailAddress {
  if (typeof entry === 'string') {
    return { address: entry };
  }
  return entry;
}