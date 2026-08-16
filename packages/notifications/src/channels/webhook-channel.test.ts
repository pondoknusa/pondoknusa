import { describe, expect, it, vi } from 'vitest';
import { Notification } from '../notification.js';
import type { Notifiable } from '../types.js';
import { NotificationManager } from '../notification-manager.js';
import { MailManager } from '@pondoknusa/mail';

class TestNotifiable implements Notifiable {
  constructor(readonly key: string) {}
  getKey() {
    return this.key;
  }
}

class WebhookNotification extends Notification {
  override via(): Array<'webhook'> {
    return ['webhook'];
  }

  override async toWebhook() {
    return {
      url: 'https://example.com/hook',
      body: { ok: true },
    };
  }
}

class PrivateWebhookNotification extends Notification {
  override via(): Array<'webhook'> {
    return ['webhook'];
  }

  override async toWebhook() {
    return {
      url: 'http://127.0.0.1/hook',
      body: { ok: true },
    };
  }
}

describe('WebhookChannel', () => {
  it('posts webhook payloads', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const manager = new NotificationManager(new MailManager({
      default: 'array',
      from: { address: 'test@example.com' },
      connections: { array: { driver: 'array' } },
    }));

    await manager.sendNow(new TestNotifiable('1'), new WebhookNotification());

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/hook', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ ok: true }),
    }));
    fetchMock.mockRestore();
  });

  it('blocks private webhook destinations by default', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const manager = new NotificationManager(new MailManager({
      default: 'array',
      from: { address: 'test@example.com' },
      connections: { array: { driver: 'array' } },
    }));

    await expect(
      manager.sendNow(new TestNotifiable('1'), new PrivateWebhookNotification()),
    ).rejects.toThrow(/disallowed/);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });
});
