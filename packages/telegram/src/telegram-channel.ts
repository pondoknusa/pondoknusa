import type { Notification, Notifiable } from '@pondoknusa/notifications';
import type { ParseMode, MessageEntity, InlineKeyboardMarkup, LinkPreviewOptions } from './types.js';
import type { ReplyKeyboardMarkup, ReplyKeyboardRemove, ForceReply } from './types.js';
import type { TelegramBot, ReplyParameters } from './client.js';

// ── Augment @pondoknusa/notifications to declare toTelegram ──
interface TelegramChannelNotification {
  toTelegram?(notifiable: Notifiable): TelegramMessage | Promise<TelegramMessage>;
}

export interface TelegramMessage {
  chat_id?: number | string;
  text: string;
  message_thread_id?: number;
  parse_mode?: ParseMode;
  entities?: MessageEntity[];
  link_preview_options?: LinkPreviewOptions;
  disable_notification?: boolean;
  protect_content?: boolean;
  reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  reply_parameters?: ReplyParameters;
}

export interface TelegramNotificationConfig {
  bot: TelegramBot;
  defaultParseMode?: ParseMode;
}

export class TelegramChannel {
  private readonly config: TelegramNotificationConfig;

  constructor(config: TelegramNotificationConfig) {
    this.config = config;
  }

  async send(notifiable: Notifiable, notification: Notification): Promise<void> {
    const n = notification as Notification & TelegramChannelNotification;
    if (!n.toTelegram) {
      throw new Error(
        `Notification ${notification.id()} does not implement toTelegram().`,
      );
    }

    const message = await n.toTelegram(notifiable) as TelegramMessage;
    const chatId = message.chat_id ?? this.resolveChatId(notifiable);

    if (!chatId) {
      throw new Error(
        `Cannot send Telegram notification: notifiable ${notifiable.getKey()} ` +
        `does not implement routeNotificationForTelegram() and no chat_id was provided.`,
      );
    }

    await this.config.bot.sendMessage({
      chat_id: chatId,
      message_thread_id: message.message_thread_id,
      text: message.text,
      parse_mode: message.parse_mode ?? this.config.defaultParseMode,
      entities: message.entities,
      link_preview_options: message.link_preview_options,
      disable_notification: message.disable_notification,
      protect_content: message.protect_content,
      reply_markup: message.reply_markup,
      reply_parameters: message.reply_parameters,
    });
  }

  private resolveChatId(notifiable: Notifiable): number | string | undefined {
    if (typeof (notifiable as any).routeNotificationForTelegram === 'function') {
      return (notifiable as any).routeNotificationForTelegram();
    }
    return undefined;
  }
}