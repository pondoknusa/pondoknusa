/**
 * @pondoknusa/telegram — Long polling update consumer.
 *
 * Runs a polling loop that fetches updates via getUpdates and dispatches them
 * to a handler callback. Designed for development or environments where
 * webhooks aren't feasible.
 *
 * Usage:
 *
 *   const bot = new TelegramBot({ token: '...' });
 *   const poller = new TelegramPolling(bot, async (update) => {
 *     if (update.message?.text) {
 *       await bot.sendMessage({ chat_id: update.message.chat.id, text: 'Echo: ' + update.message.text });
 *     }
 *   });
 *   await poller.start();
 */

import type { TelegramBot } from './client.js';
import type { Update } from './types.js';
import { TelegramApiError } from './client.js';

export type UpdateHandler = (update: Update, bot: TelegramBot) => Promise<void> | void;

export interface TelegramPollingOptions {
  /** Polling timeout in seconds (passed to getUpdates). Default: 30 */
  timeout?: number;
  /** Max updates per poll. Default: 100 */
  limit?: number;
  /** Allowed update types filter. Default: all */
  allowedUpdates?: string[];
  /** Delay (ms) between polls when no updates. Default: 0 */
  pollInterval?: number;
  /** Called when an error occurs during polling */
  onError?: (error: Error) => void;
  /** Graceful shutdown signal */
  signal?: AbortSignal;
}

export class TelegramPolling {
  private offset = 0;
  private running = false;

  constructor(
    private readonly bot: TelegramBot,
    private readonly handler: UpdateHandler,
    private readonly options: TelegramPollingOptions = {},
  ) {}

  get isRunning(): boolean {
    return this.running;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    const {
      timeout = 30,
      limit = 100,
      allowedUpdates,
      pollInterval = 0,
      onError,
      signal,
    } = this.options;

    const poll = async (): Promise<void> => {
      if (!this.running) return;

      try {
        const updates = await this.bot.getUpdates({
          offset: this.offset,
          limit,
          timeout,
          allowed_updates: allowedUpdates,
        });

        for (const update of updates) {
          if (!this.running) return;
          try {
            await this.handler(update, this.bot);
          } catch (handlerError) {
            onError?.(handlerError as Error);
          }
          this.offset = update.update_id + 1;
        }
      } catch (err) {
        // Ignore timeout errors (they're normal for long polling)
        if (err instanceof TelegramApiError && err.errorCode === 409) {
          // Conflict — another poller is running
          onError?.(err);
          this.running = false;
          return;
        }
        onError?.(err as Error);
      }

      if (pollInterval > 0) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      // Schedule next poll
      if (this.running) {
        setTimeout(poll, 0);
      }
    };

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => this.stop());
    }

    poll();
  }

  stop(): void {
    this.running = false;
  }
}