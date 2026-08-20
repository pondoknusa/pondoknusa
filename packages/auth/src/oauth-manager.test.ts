import { afterEach, describe, expect, it } from 'vitest';
import {
  clearOAuthDriversForTesting,
  OAuthManager,
  OAuthStateError,
  registerOAuthDriver,
  type OAuthDriver,
  type OAuthUserProfile,
} from './oauth.js';
import { Session } from './session.js';
import type { OAuthProviderConfig } from './types.js';

const config: OAuthProviderConfig = {
  clientId: 'cid',
  clientSecret: 'secret',
  redirectUri: 'http://localhost/callback',
};

class CustomOAuthDriver implements OAuthDriver {
  readonly name = 'custom';

  authorizationUrl(state: string): string {
    return `https://custom.test/authorize?state=${state}`;
  }

  async exchangeCode(_code: string): Promise<OAuthUserProfile> {
    return {
      id: '1',
      email: 'user@custom.test',
      name: 'Custom User',
      avatar: null,
    };
  }
}

describe('OAuthManager driver registry', () => {
  afterEach(() => {
    clearOAuthDriversForTesting();
  });

  it('uses registered custom drivers', () => {
    registerOAuthDriver('custom', CustomOAuthDriver);
    const manager = new OAuthManager(
      { custom: config },
      {} as never,
      'oauth_accounts',
      class {} as never,
    );

    expect(manager.redirectUrl('custom', 'state-abc')).toBe(
      'https://custom.test/authorize?state=state-abc',
    );
  });

  it('binds and consumes OAuth state via the manager', async () => {
    registerOAuthDriver('custom', CustomOAuthDriver);
    const manager = new OAuthManager(
      { custom: config },
      {} as never,
      'oauth_accounts',
      class {} as never,
    );
    const session = new Session('test', {});

    manager.bindOAuthState(session, 'custom', 'state-abc');
    expect(session.get('_oauth_state')).toEqual({ custom: 'state-abc' });

    const profile = await manager.handleCallback('custom', 'code', {}, {
      state: 'state-abc',
      session,
    });
    expect(profile.id).toBe('1');
    expect(session.get('_oauth_state')).toBeUndefined();
  });

  it('rejects callbacks with a mismatched state', async () => {
    registerOAuthDriver('custom', CustomOAuthDriver);
    const manager = new OAuthManager(
      { custom: config },
      {} as never,
      'oauth_accounts',
      class {} as never,
    );
    const session = new Session('test', {});
    manager.bindOAuthState(session, 'custom', 'state-abc');

    await expect(
      manager.handleCallback('custom', 'code', {}, {
        state: 'wrong',
        session,
      }),
    ).rejects.toBeInstanceOf(OAuthStateError);
  });
});