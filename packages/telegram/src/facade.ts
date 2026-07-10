/**
 * @pondoknusa/telegram — Telegram facade.
 *
 * Provides a convenient static interface to the Telegram bot client registered
 * in the service container.
 *
 * Usage:
 *
 *   import { Telegram } from '@pondoknusa/telegram';
 *
 *   // In a controller or service:
 *   await Telegram.bot().sendMessage({ chat_id: 123, text: 'Hello' });
 *
 *   // Notifications:
 *   await Telegram.channel().send(notifiable, notification);
 */

import type { Application } from '@pondoknusa/core';
import type { TelegramBot } from './client.js';
import type { TelegramChannel } from './telegram-channel.js';
import { TELEGRAM_BOT, TELEGRAM_CHANNEL } from './telegram-service-provider.js';

export class Telegram {
  private static app: Application | null = null;

  static setApplication(app: Application): void {
    Telegram.app = app;
  }

  static bot(): TelegramBot {
    if (!Telegram.app) {
      throw new Error('Telegram facade not initialized. Call Telegram.setApplication(app) first.');
    }
    return Telegram.app.make<TelegramBot>(TELEGRAM_BOT);
  }

  static channel(): TelegramChannel {
    if (!Telegram.app) {
      throw new Error('Telegram facade not initialized. Call Telegram.setApplication(app) first.');
    }
    return Telegram.app.make<TelegramChannel>(TELEGRAM_CHANNEL);
  }
}