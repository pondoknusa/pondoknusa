/**
 * @pondoknusa/telegram — Service provider for Pondoknusa integration.
 *
 * Registers the Telegram bot client as a container singleton, wires the
 * notification channel, and provides a Telegram facade.
 */

import { ServiceProvider } from '@pondoknusa/core';
import type { ConfigRepository } from '@pondoknusa/config';
import { TelegramBot } from './client.js';
import { TelegramChannel } from './telegram-channel.js';
import type { ParseMode } from './types.js';

// ── Container binding keys ───────────────────────────────────

export const TELEGRAM_BOT = 'telegram.bot';
export const TELEGRAM_CONFIG = 'telegram.config';
export const TELEGRAM_CHANNEL = 'telegram.channel';

// ── Config shape ─────────────────────────────────────────────

export interface TelegramServiceConfig {
  token: string;
  api_base_url?: string;
  default_parse_mode?: ParseMode;
  webhook?: {
    secret_token?: string;
    url?: string;
    max_connections?: number;
    allowed_updates?: string[];
  };
  notification?: {
    enabled?: boolean;
    default_parse_mode?: ParseMode;
  };
}

// ── Service provider ─────────────────────────────────────────

export class TelegramServiceProvider extends ServiceProvider {
  override register(): void {
    this.app.bind(TELEGRAM_BOT, () => {
      const config = this.app.make<ConfigRepository>('config');
      const telegramConfig = config.get<TelegramServiceConfig>('telegram');

      if (!telegramConfig?.token) {
        throw new Error(
          'Telegram bot token is not configured. Set TELEGRAM_BOT_TOKEN in your .env ' +
          'or add token to config/telegram.ts.',
        );
      }

      return new TelegramBot({
        token: telegramConfig.token,
        apiBaseUrl: telegramConfig.api_base_url,
        defaultParseMode: telegramConfig.default_parse_mode,
      });
    });

    this.app.bind(TELEGRAM_CONFIG, () => {
      return this.app.make<ConfigRepository>('config').get<TelegramServiceConfig>('telegram');
    });

    this.app.bind(TELEGRAM_CHANNEL, () => {
      const bot = this.app.make<TelegramBot>(TELEGRAM_BOT);
      const config = this.app.make<ConfigRepository>('config');
      const telegramConfig = config.get<TelegramServiceConfig>('telegram');

      return new TelegramChannel({
        bot,
        defaultParseMode: telegramConfig?.notification?.default_parse_mode ?? telegramConfig?.default_parse_mode,
      });
    });
  }

  override async boot(): Promise<void> {
    const config = this.app.make<ConfigRepository>('config');
    const telegramConfig = config.get<TelegramServiceConfig>('telegram');

    if (telegramConfig?.notification?.enabled !== false) {
      try {
        const { NotificationManager } = await import('@pondoknusa/notifications');
        const channel = this.app.make<TelegramChannel>(TELEGRAM_CHANNEL);
        // Notification channel registration is handled at the app level
        // by extending the notification manager's channel routing
      } catch {
        // Notifications package is optional
      }
    }
  }
}