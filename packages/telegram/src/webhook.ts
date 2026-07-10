/**
 * @pondoknusa/telegram — Webhook handler.
 *
 * Receives Telegram Update objects from an incoming webhook POST request.
 * Integrates with Pondoknusa routing via a controller-style handler.
 */

import type { PondoknusaRequest } from '@pondoknusa/http';
import { Response } from '@pondoknusa/http';
import type { Update } from './types.js';
import type { TelegramBot } from './client.js';

// ── Webhook parser ──────────────────────────────────────────

export class TelegramWebhook {
  /**
   * Parse an incoming Pondoknusa request as a Telegram Update.
   * Throws if the secret token doesn't match.
   */
  static async parse(
    request: PondoknusaRequest,
    expectedSecretToken?: string,
  ): Promise<Update> {
    if (expectedSecretToken) {
      const header = request.header('X-Telegram-Bot-Api-Secret-Token');
      if (header !== expectedSecretToken) {
        throw new TelegramWebhookError(
          'Invalid or missing X-Telegram-Bot-Api-Secret-Token header.',
          403,
        );
      }
    }

    return request.json<Update>();
  }
}

// ── Controller ──────────────────────────────────────────────

export interface TelegramWebhookHandler {
  (update: Update, bot?: TelegramBot): Promise<unknown> | unknown;
}

export abstract class TelegramWebhookController {
  abstract handleUpdate(update: Update, bot: TelegramBot): Promise<unknown> | unknown;

  async handle(request: PondoknusaRequest) {
    const bot = this.resolveBot();
    const update = await TelegramWebhook.parse(
      request,
      this.resolveSecretToken(),
    );

    const result = await this.handleUpdate(update, bot);

    if (result && typeof result === 'object' && 'method' in result) {
      return Response.json(result);
    }

    return Response.json({ ok: true });
  }

  protected resolveBot(): TelegramBot {
    throw new TelegramWebhookError(
      'TelegramWebhookController: no bot configured. ' +
      'Override resolveBot() or configure TelegramServiceProvider.',
      500,
    );
  }

  protected resolveSecretToken(): string | undefined {
    return undefined;
  }
}

// ── Webhook response helper (answer inline) ──────────────────

export class TelegramWebhookResponse {
  static answerCallback(text: string, showAlert?: boolean): { method: string; text: string; show_alert?: boolean } {
    return {
      method: 'answerCallbackQuery',
      text,
      show_alert: showAlert,
    };
  }

  static sendMessage(params: Record<string, unknown>): { method: string } & Record<string, unknown> {
    return { method: 'sendMessage', ...params };
  }

  static deleteMessage(chatId: number | string, messageId: number) {
    return { method: 'deleteMessage', chat_id: chatId, message_id: messageId };
  }
}

// ── Error ────────────────────────────────────────────────────

export class TelegramWebhookError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'TelegramWebhookError';
    this.statusCode = statusCode;
  }
}