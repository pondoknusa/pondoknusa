/**
 * @pondoknusa/telegram-2fa — Two-factor authentication manager.
 *
 * Orchestrates the 2FA lifecycle: send a code, verify, and invalidate.
 * Codes are hashed with SHA-256 before storage in the cache store.
 */

import type { ConfigRepository } from '@pondoknusa/config';
import type { CacheRepository } from '@pondoknusa/cache';
import type { TelegramBot } from '@pondoknusa/telegram';
import type { Authenticatable } from '@pondoknusa/auth';
import type { Model } from '@pondoknusa/database';

import { generateCode, hashCode, constantTimeEqual } from './code-generator.js';
import type {
  Telegram2FaConfig,
  TwoFactorCodePayload,
  TwoFactorVerifyResult,
  TelegramChatIdResolver,
  TwoFactorUser,
} from './types.js';

export class TwoFactorManager {
  constructor(
    private readonly config: Telegram2FaConfig,
    private readonly cache: CacheRepository,
    private readonly bot: TelegramBot,
    private readonly chatIdResolver?: TelegramChatIdResolver,
  ) {}

  // ── Configuration helpers ──────────────────────────────────

  get codeLength(): number {
    return this.config.code_length ?? 6;
  }

  get codeTtlSeconds(): number {
    return this.config.code_ttl_seconds ?? 300;
  }

  get maxAttempts(): number {
    return this.config.max_attempts ?? 3;
  }

  get cachePrefix(): string {
    return this.config.cache_prefix ?? 'telegram-2fa';
  }

  get sessionKey(): string {
    return this.config.session_key ?? 'telegram_2fa_verified';
  }

  get sessionTtlSeconds(): number {
    return this.config.session_ttl_seconds ?? 3600;
  }

  get messageTemplate(): string {
    return this.config.message_template ?? 'Your verification code: {{code}}';
  }

  private cacheKey(userId: string | number): string {
    return `${this.cachePrefix}:${userId}`;
  }

  // ── Send a code ────────────────────────────────────────────

  /**
   * Generate a new 2FA code and send it to the user's Telegram chat.
   * Returns the plaintext code on success (for logging/testing), or the
   * Telegram message result.
   */
  async send(user: TwoFactorUser): Promise<{ code: string; messageId?: number }> {
    // Invalidate any existing code first
    await this.invalidate(user);

    const { plaintext, hashed } = generateCode(this.codeLength);
    const chatId = await this.resolveChatId(user);

    if (!chatId) {
      throw new TwoFactorError(
        `Cannot send 2FA code: user ${user.getAuthIdentifier()} has no Telegram chat ID configured.`,
      );
    }

    // Store the hash in cache with TTL
    const payload: TwoFactorCodePayload = {
      hash: hashed,
      attempts_remaining: this.maxAttempts,
      issued_at: Date.now(),
    };

    await this.cache.put(
      this.cacheKey(user.getAuthIdentifier()),
      payload,
      this.codeTtlSeconds,
    );

    // Send via Telegram
    const message = this.messageTemplate.replace(/\{\{code\}\}/g, plaintext);
    const result = await this.bot.sendMessage({
      chat_id: chatId,
      text: message,
      parse_mode: this.config.parse_mode ?? 'Markdown',
    });

    return { code: plaintext, messageId: result.message_id };
  }

  // ── Verify a code ──────────────────────────────────────────

  /**
   * Verify a user-submitted code against the stored hash.
   * Returns a detailed result with the reason.
   */
  async verify(user: TwoFactorUser, code: string): Promise<TwoFactorVerifyResult> {
    const userId = user.getAuthIdentifier();
    const payload = await this.cache.get<TwoFactorCodePayload>(this.cacheKey(userId));

    if (!payload) {
      return { success: false, reason: 'expired' };
    }

    // Check expiry (belt-and-suspenders — cache TTL should handle it, but
    // verify in case the cache backend doesn't expire reliably)
    const elapsed = Date.now() - payload.issued_at;
    if (elapsed > this.codeTtlSeconds * 1000) {
      await this.cache.forget(this.cacheKey(userId));
      return { success: false, reason: 'expired' };
    }

    if (payload.attempts_remaining <= 0) {
      await this.cache.forget(this.cacheKey(userId));
      return { success: false, reason: 'max_attempts' };
    }

    // Decrement attempts
    payload.attempts_remaining -= 1;
    await this.cache.put(this.cacheKey(userId), payload, this.codeTtlSeconds);

    if (!constantTimeEqual(code, payload.hash)) {
      // Actually compare the hash of the submitted code against the stored hash
      const submittedHash = hashCode(code);
      if (!constantTimeEqual(submittedHash, payload.hash)) {
        return {
          success: false,
          reason: 'invalid',
          attempts_remaining: payload.attempts_remaining,
        };
      }
    }

    // Success — invalidate the code so it can't be reused
    await this.cache.forget(this.cacheKey(userId));

    // Mark the session as 2FA verified (if session is available)
    // This is done by the middleware or caller

    return { success: true, reason: 'ok' };
  }

  // ── Invalidate ─────────────────────────────────────────────

  /**
   * Invalidate any pending 2FA code for the user.
   */
  async invalidate(user: TwoFactorUser): Promise<void> {
    await this.cache.forget(this.cacheKey(user.getAuthIdentifier()));
  }

  // ── Chat ID resolution ─────────────────────────────────────

  private async resolveChatId(user: Model & Record<string, unknown>): Promise<number | string | null> {
    // Use the custom resolver if provided
    if (this.chatIdResolver) {
      return this.chatIdResolver(user);
    }

    // Try checking the user model for a telegram_chat_id attribute
    if (typeof user.getAttribute === 'function') {
      const chatId = user.getAttribute('telegram_chat_id');
      if (chatId !== undefined && chatId !== null) {
        return chatId as number | string;
      }
    }

    // Try routeNotificationForTelegram
    if (typeof (user as any).routeNotificationForTelegram === 'function') {
      return (user as any).routeNotificationForTelegram();
    }

    return null;
  }
}

// ── Error ────────────────────────────────────────────────────

export class TwoFactorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TwoFactorError';
  }
}