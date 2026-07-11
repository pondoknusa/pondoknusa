/**
 * @pondoknusa/auth-passkey — Service provider.
 */

import { ServiceProvider } from '@pondoknusa/core';
import type { ConfigRepository } from '@pondoknusa/config';
import { PasskeyManager } from './passkey-manager.js';
import { MemoryChallengeStore, MemoryCredentialRepository } from './stores.js';
import type {
  PasskeyChallengeStore,
  PasskeyConfig,
  PasskeyCredentialRepository,
} from './types.js';

export const PASSKEY_MANAGER = 'auth-passkey.manager';
export const PASSKEY_CONFIG = 'auth-passkey.config';
export const PASSKEY_CREDENTIALS = 'auth-passkey.credentials';
export const PASSKEY_CHALLENGES = 'auth-passkey.challenges';

export class PasskeyServiceProvider extends ServiceProvider {
  override register(): void {
    this.app.bind(PASSKEY_CONFIG, () => {
      const config = this.app.make<ConfigRepository>('config');
      return (
        config.get<PasskeyConfig>('auth-passkey') ??
        config.get<PasskeyConfig>('passkey') ??
        config.get<PasskeyConfig>('auth.passkey')
      );
    });

    this.app.bind(PASSKEY_CREDENTIALS, () => {
      return this.resolveCredentialRepository();
    });

    this.app.bind(PASSKEY_CHALLENGES, () => {
      return this.resolveChallengeStore();
    });

    this.app.bind(PASSKEY_MANAGER, () => {
      const passkeyConfig = this.app.make<PasskeyConfig | undefined>(PASSKEY_CONFIG);
      if (!passkeyConfig?.rpId || !passkeyConfig.rpName || !passkeyConfig.origin) {
        throw new Error(
          'Passkey config missing. Set auth-passkey (rpName, rpId, origin) in your config.',
        );
      }
      const credentials = this.app.make<PasskeyCredentialRepository>(PASSKEY_CREDENTIALS);
      const challenges = this.app.make<PasskeyChallengeStore>(PASSKEY_CHALLENGES);
      return new PasskeyManager(passkeyConfig, credentials, challenges);
    });
  }

  /**
   * Override to wire a database-backed credential repository.
   * Default: in-memory (suitable for tests / single-process demos only).
   */
  protected resolveCredentialRepository(): PasskeyCredentialRepository {
    return new MemoryCredentialRepository();
  }

  /**
   * Override to wire a shared challenge store (e.g. cache/redis).
   * Default: in-memory.
   */
  protected resolveChallengeStore(): PasskeyChallengeStore {
    return new MemoryChallengeStore();
  }
}
