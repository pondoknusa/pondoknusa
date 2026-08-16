import { describe, expect, it, vi } from 'vitest';
import { TelegramWebhook, TelegramWebhookError } from './webhook.js';
import { PondoknusaRequest } from '@pondoknusa/http';

function requestWithSecret(secret?: string): PondoknusaRequest {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (secret) {
    headers.set('X-Telegram-Bot-Api-Secret-Token', secret);
  }
  return new PondoknusaRequest(
    new Request('http://localhost/webhooks/telegram', {
      method: 'POST',
      headers,
      body: JSON.stringify({ update_id: 1 }),
    }),
  );
}

describe('TelegramWebhook', () => {
  it('accepts matching secrets', async () => {
    const update = await TelegramWebhook.parse(requestWithSecret('s3cret'), 's3cret');
    expect(update.update_id).toBe(1);
  });

  it('rejects mismatched secrets', async () => {
    await expect(
      TelegramWebhook.parse(requestWithSecret('wrong'), 's3cret'),
    ).rejects.toBeInstanceOf(TelegramWebhookError);
  });

  it('requires a secret in production', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await expect(
        TelegramWebhook.parse(requestWithSecret()),
      ).rejects.toThrow(/secret_token is required/);
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
