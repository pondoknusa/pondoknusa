import { describe, expect, it } from 'vitest';
import { PondoknusaRequest } from '@pondoknusa/http';
import { Session } from './session.js';
import {
  compilePathPattern,
  createVerifyCsrfTokenMiddleware,
  VerifyCsrfTokenException,
} from './verify-csrf-token.js';

function requestWithSession(
  method: string,
  path: string,
  token?: string,
  body?: Record<string, string>,
): PondoknusaRequest {
  const request = new PondoknusaRequest(
    new Request(`http://localhost${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
  const session = new Session('sess-1', token ? { _csrf_token: token } : {});
  request.session = session;
  return request;
}

describe('compilePathPattern', () => {
  it('matches a single segment with *', () => {
    const pattern = compilePathPattern('/api/*');
    expect(pattern.test('/api/posts')).toBe(true);
    expect(pattern.test('/api/v1/login')).toBe(false);
  });

  it('matches nested paths with ** without the single-* rewrite bug', () => {
    const pattern = compilePathPattern('/api/**');
    expect(pattern.test('/api/posts')).toBe(true);
    expect(pattern.test('/api/v1/login')).toBe(true);
    expect(pattern.test('/api/v1/cli/browser-auth')).toBe(true);
    expect(pattern.test('/login')).toBe(false);
  });
});

describe('createVerifyCsrfTokenMiddleware', () => {
  it('skips safe methods', async () => {
    const middleware = createVerifyCsrfTokenMiddleware();
    const request = requestWithSession('GET', '/login', 'token-a');

    const response = await middleware(request, async () => new Response('ok'));
    expect(await response.text()).toBe('ok');
  });

  it('rejects POST without a matching token', async () => {
    const middleware = createVerifyCsrfTokenMiddleware();
    const request = requestWithSession('POST', '/login', 'token-a');

    await expect(middleware(request, async () => new Response('ok'))).rejects.toBeInstanceOf(
      VerifyCsrfTokenException,
    );
  });

  it('distinguishes missing session token from token mismatch', async () => {
    const middleware = createVerifyCsrfTokenMiddleware();

    const missing = requestWithSession('POST', '/login');
    await expect(middleware(missing, async () => new Response('ok'))).rejects.toMatchObject({
      status: 419,
      code: 'CSRF_SESSION_TOKEN_MISSING',
      message: 'CSRF session token missing.',
    });

    const mismatch = requestWithSession('POST', '/login', 'token-a', { _token: 'wrong' });
    await expect(middleware(mismatch, async () => new Response('ok'))).rejects.toMatchObject({
      status: 419,
      code: 'CSRF_TOKEN_MISMATCH',
      message: 'CSRF token mismatch.',
    });
  });

  it('accepts a matching body token', async () => {
    const middleware = createVerifyCsrfTokenMiddleware();
    const request = requestWithSession('POST', '/login', 'token-a', { _token: 'token-a' });

    const response = await middleware(request, async () => new Response('ok'));
    expect(await response.text()).toBe('ok');
  });

  it('accepts a matching X-CSRF-TOKEN header', async () => {
    const middleware = createVerifyCsrfTokenMiddleware();
    const request = new PondoknusaRequest(
      new Request('http://localhost/login', {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': 'token-a' },
      }),
    );
    request.session = new Session('sess-1', { _csrf_token: 'token-a' });

    const response = await middleware(request, async () => new Response('ok'));
    expect(await response.text()).toBe('ok');
  });

  it('respects except patterns including nested ** paths', async () => {
    const single = createVerifyCsrfTokenMiddleware({ except: ['/api/*'] });
    const nestedDenied = requestWithSession('POST', '/api/v1/login');
    await expect(single(nestedDenied, async () => new Response('ok'))).rejects.toBeInstanceOf(
      VerifyCsrfTokenException,
    );

    const globstar = createVerifyCsrfTokenMiddleware({ except: ['/api/**'] });
    const nestedOk = requestWithSession('POST', '/api/v1/login');
    const response = await globstar(nestedOk, async () => new Response('ok'));
    expect(await response.text()).toBe('ok');
  });
});
