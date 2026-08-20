import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GithubOAuthDriver } from './github.js';

function makeFetchStub(handlers: Record<string, unknown>) {
  return vi.fn(async (url: string | URL, init?: RequestInit) => {
    const target = String(url);
    const method = (init?.method ?? 'GET').toUpperCase();
    const key = `${method} ${target}`;
    if (handlers[key]) {
      return new Response(JSON.stringify(handlers[key]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('not found', { status: 404 });
  });
}

describe('GithubOAuthDriver email verification', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', makeFetchStub({}));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks the email verified when GitHub reports it verified', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchStub({
        'POST https://github.com/login/oauth/access_token': { access_token: 'tok' },
        'GET https://api.github.com/user': { id: 42, login: 'ada', email: 'ada@example.com', name: 'Ada' },
        'GET https://api.github.com/user/emails': [{ email: 'ada@example.com', verified: true }],
      }),
    );

    const driver = new GithubOAuthDriver({ clientId: 'x', clientSecret: 'y' } as never);
    const profile = await driver.exchangeCode('code');
    expect(profile.email).toBe('ada@example.com');
    expect(profile.emailVerified).toBe(true);
  });

  it('marks the email unverified when GitHub reports it unverified', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchStub({
        'POST https://github.com/login/oauth/access_token': { access_token: 'tok' },
        'GET https://api.github.com/user': { id: 42, login: 'ada', email: 'ada@example.com', name: 'Ada' },
        'GET https://api.github.com/user/emails': [{ email: 'ada@example.com', verified: false }],
      }),
    );

    const driver = new GithubOAuthDriver({ clientId: 'x', clientSecret: 'y' } as never);
    const profile = await driver.exchangeCode('code');
    expect(profile.emailVerified).toBe(false);
  });

  it('uses a verified primary email when /user email is null', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchStub({
        'POST https://github.com/login/oauth/access_token': { access_token: 'tok' },
        'GET https://api.github.com/user': { id: 42, login: 'ada', email: null, name: 'Ada' },
        'GET https://api.github.com/user/emails': [
          { email: 'noreply@github.com', verified: false, primary: false },
          { email: 'ada@example.com', verified: true, primary: true },
        ],
      }),
    );

    const driver = new GithubOAuthDriver({ clientId: 'x', clientSecret: 'y' } as never);
    const profile = await driver.exchangeCode('code');
    expect(profile.email).toBe('ada@example.com');
    expect(profile.emailVerified).toBe(true);
  });

  it('fails closed when GitHub /user is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchStub({
        'POST https://github.com/login/oauth/access_token': { access_token: 'tok' },
      }),
    );

    const driver = new GithubOAuthDriver({ clientId: 'x', clientSecret: 'y' } as never);
    await expect(driver.exchangeCode('code')).rejects.toThrow(/user profile/i);
  });
});
