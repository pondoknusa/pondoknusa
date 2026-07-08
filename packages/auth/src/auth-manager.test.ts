import { describe, expect, it, vi } from 'vitest';
import { PondoknusaRequest } from '@pondoknusa/http';
import { AuthManager, createGuestMiddleware } from './auth-manager.js';
import type { Authenticatable, Guard } from './types.js';
import type { PondoknusaRequest as PondoknusaRequestType } from '@pondoknusa/http';

class FakeUser implements Authenticatable {
  getAuthIdentifier(): number {
    return 1;
  }

  getAuthPassword(): string {
    return 'secret';
  }
}

class FakeGuard implements Guard {
  name = 'web';
  private authenticated = false;

  setRequest(_request: PondoknusaRequestType): void {
    // no-op
  }

  setAuthenticated(value: boolean): void {
    this.authenticated = value;
  }

  user(): Authenticatable | null {
    return this.authenticated ? new FakeUser() : null;
  }

  id(): string | number | null {
    return this.authenticated ? 1 : null;
  }

  check(): boolean {
    return this.authenticated;
  }
}

function createAuthManager(authenticated = false): AuthManager {
  const guard = new FakeGuard();
  guard.setAuthenticated(authenticated);
  return new AuthManager(
    { defaults: { guard: 'web' } } as never,
    { web: () => guard },
    'web',
  );
}

describe('createGuestMiddleware', () => {
  it('allows guests through', async () => {
    const auth = createAuthManager(false);
    const middleware = createGuestMiddleware(auth);
    const request = new PondoknusaRequest(
      new Request('http://localhost/login'),
    );

    const next = vi.fn().mockResolvedValue(new Response('ok'));
    const response = await middleware(request, next);

    expect(next).toHaveBeenCalled();
    expect(await response.text()).toBe('ok');
  });

  it('redirects authenticated browsers to dashboard', async () => {
    const auth = createAuthManager(true);
    const middleware = createGuestMiddleware(auth);
    const request = new PondoknusaRequest(
      new Request('http://localhost/login', {
        headers: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      }),
    );

    const response = await middleware(request, vi.fn());

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('http://localhost/dashboard');
  });

  it('returns a JSON conflict for authenticated API requests', async () => {
    const auth = createAuthManager(true);
    const middleware = createGuestMiddleware(auth);
    const request = new PondoknusaRequest(
      new Request('http://localhost/login', {
        headers: { accept: 'application/json' },
      }),
    );

    const response = await middleware(request, vi.fn());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: 'Already authenticated.' });
  });

  it('returns a JSON conflict when accept header is missing', async () => {
    const auth = createAuthManager(true);
    const middleware = createGuestMiddleware(auth);
    const request = new PondoknusaRequest(
      new Request('http://localhost/login'),
    );

    const response = await middleware(request, vi.fn());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: 'Already authenticated.' });
  });

  it('returns a JSON conflict for wildcard accept headers', async () => {
    const auth = createAuthManager(true);
    const middleware = createGuestMiddleware(auth);
    const request = new PondoknusaRequest(
      new Request('http://localhost/login', {
        headers: { accept: '*/*' },
      }),
    );

    const response = await middleware(request, vi.fn());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: 'Already authenticated.' });
  });
});
