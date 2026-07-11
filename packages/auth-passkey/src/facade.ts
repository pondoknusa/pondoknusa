/**
 * @pondoknusa/auth-passkey — Facade.
 */

import type { Application } from '@pondoknusa/core';
import type { PasskeyManager } from './passkey-manager.js';
import { PASSKEY_MANAGER } from './passkey-service-provider.js';
import type {
  AuthenticationResponseJSON,
  AuthenticationVerified,
  PasskeyUser,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  RegistrationVerified,
} from './types.js';

export class Passkey {
  private static app: Application | null = null;

  static setApplication(app: Application): void {
    Passkey.app = app;
  }

  static manager(): PasskeyManager {
    if (!Passkey.app) {
      throw new Error('Passkey facade not initialized. Call Passkey.setApplication(app) first.');
    }
    return Passkey.app.make<PasskeyManager>(PASSKEY_MANAGER);
  }

  static generateRegistrationOptions(
    user: PasskeyUser,
    options?: Parameters<PasskeyManager['generateRegistrationOptions']>[1],
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    return Passkey.manager().generateRegistrationOptions(user, options);
  }

  static verifyRegistration(
    response: RegistrationResponseJSON,
    options?: Parameters<PasskeyManager['verifyRegistration']>[1],
  ): Promise<RegistrationVerified> {
    return Passkey.manager().verifyRegistration(response, options);
  }

  static generateAuthenticationOptions(
    options?: Parameters<PasskeyManager['generateAuthenticationOptions']>[0],
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return Passkey.manager().generateAuthenticationOptions(options);
  }

  static verifyAuthentication(
    response: AuthenticationResponseJSON,
    options?: Parameters<PasskeyManager['verifyAuthentication']>[1],
  ): Promise<AuthenticationVerified> {
    return Passkey.manager().verifyAuthentication(response, options);
  }
}
