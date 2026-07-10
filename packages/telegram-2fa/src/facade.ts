/**
 * @pondoknusa/telegram-2fa — Facade.
 */

import type { Application } from '@pondoknusa/core';
import type { TwoFactorManager } from './two-factor-manager.js';
import { TWO_FACTOR_MANAGER } from './telegram-2fa-service-provider.js';

export class TwoFactor {
  private static app: Application | null = null;

  static setApplication(app: Application): void {
    TwoFactor.app = app;
  }

  static manager(): TwoFactorManager {
    if (!TwoFactor.app) {
      throw new Error('TwoFactor facade not initialized. Call TwoFactor.setApplication(app) first.');
    }
    return TwoFactor.app.make<TwoFactorManager>(TWO_FACTOR_MANAGER);
  }

  /**
   * Mark the current session as 2FA-verified.
   * Call this after a successful code verification.
   */
  static markVerified(request: { session?: { put(key: string, value: unknown): void } }, sessionKey?: string): void {
    const key = sessionKey ?? 'telegram_2fa_verified';
    request.session?.put(key, Date.now());
  }

  /**
   * Check whether the current request's session is 2FA-verified.
   */
  static isVerified(request: { session?: { get<T>(key: string): T | undefined } }, sessionKey?: string): boolean {
    const key = sessionKey ?? 'telegram_2fa_verified';
    const verified = request.session?.get<number>(key);
    return verified !== undefined && verified !== null;
  }
}