/**
 * @pondoknusa/telegram-2fa — Service provider.
 */

import { ServiceProvider } from '@pondoknusa/core';
import type { ConfigRepository } from '@pondoknusa/config';
import type { CacheRepository } from '@pondoknusa/cache';
import type { TelegramBot } from '@pondoknusa/telegram';
import { TELEGRAM_BOT } from '@pondoknusa/telegram';
import { TwoFactorManager } from './two-factor-manager.js';
import type { Telegram2FaConfig, TelegramChatIdResolver } from './types.js';

export const TWO_FACTOR_MANAGER = 'telegram-2fa.manager';
export const TWO_FACTOR_CONFIG = 'telegram-2fa.config';

export class Telegram2FaServiceProvider extends ServiceProvider {
  override register(): void {
    this.app.bind(TWO_FACTOR_CONFIG, () => {
      return this.app.make<ConfigRepository>('config').get<Telegram2FaConfig>('telegram-2fa') ?? {};
    });

    this.app.bind(TWO_FACTOR_MANAGER, () => {
      const config = this.app.make<Telegram2FaConfig>(TWO_FACTOR_CONFIG);
      const cache = this.app.make<CacheRepository>('cache');
      const bot = this.app.make<TelegramBot>(TELEGRAM_BOT);
      const resolver = this.resolveChatIdResolver();

      return new TwoFactorManager(config, cache, bot, resolver);
    });
  }

  /**
   * Override to provide a custom Telegram chat ID resolver.
   * By default, reads `telegram_chat_id` from the user model attribute
   * or calls `routeNotificationForTelegram()`.
   */
  protected resolveChatIdResolver(): TelegramChatIdResolver | undefined {
    return undefined;
  }
}