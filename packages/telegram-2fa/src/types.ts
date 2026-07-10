/**
 * @pondoknusa/telegram-2fa — Type definitions.
 */

import type { Model } from '@pondoknusa/database';

// ── Config ─────────────────────────────────────────────────

export interface Telegram2FaConfig {
  /** Length of the generated code. Default: 6 */
  code_length?: number;
  /** Code expiration in seconds. Default: 300 (5 min) */
  code_ttl_seconds?: number;
  /** Max failed verification attempts before invalidation. Default: 3 */
  max_attempts?: number;
  /** Cache store connection name. Default: uses app default */
  cache_connection?: string;
  /** Cache key prefix. Default: 'telegram-2fa' */
  cache_prefix?: string;
  /** Telegram message template. Default: 'Your verification code: {{code}}' */
  message_template?: string;
  /** Parse mode for the Telegram message. Default: 'Markdown' */
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  /** Whether to require 2FA for all authenticated routes by default. Default: false */
  require_all?: boolean;
  /** Session key used to store 2FA verification state. Default: 'telegram_2fa_verified' */
  session_key?: string;
  /** How long a 2FA session verification lasts (seconds). Default: 3600 (1 hour) */
  session_ttl_seconds?: number;
}

// ── Code payload (stored in cache) ──────────────────────────

export interface TwoFactorCodePayload {
  /** SHA-256 hash of the code */
  hash: string;
  /** Remaining verification attempts */
  attempts_remaining: number;
  /** When the code was issued (Unix ms) */
  issued_at: number;
}

// ── Result of a verification attempt ────────────────────────

export interface TwoFactorVerifyResult {
  success: boolean;
  reason?: 'expired' | 'max_attempts' | 'invalid' | 'ok';
  attempts_remaining?: number;
}

// ── Resolver for the user's Telegram chat ID ────────────────

export interface TelegramChatIdResolver {
  (user: Model & Record<string, unknown>): number | string | Promise<number | string>;
}

/** A user that can authenticate and has model attributes */
export type TwoFactorUser = Model & { getAuthIdentifier(): string | number; } & Record<string, unknown>;