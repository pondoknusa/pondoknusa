import { describe, expect, it } from 'vitest';
import { DEFAULT_CSRF_EXCEPT } from './csrf-except.js';
import {
  buildCsrfRuntimeProbes,
  runCsrfRuntimeProbes,
  substitutePathParams,
} from './runtime-csrf-probes.js';

describe('substitutePathParams', () => {
  it('fills :id and other params', () => {
    expect(substitutePathParams('/users/:id')).toBe('/users/1');
    expect(substitutePathParams('/posts/:slug/edit')).toBe('/posts/test/edit');
  });
});

describe('buildCsrfRuntimeProbes', () => {
  it('requires 419 for protected routes and forbids 419 for excepted paths', () => {
    const probes = buildCsrfRuntimeProbes(
      [
        { method: 'post', fullPath: '/login' },
        { method: 'post', fullPath: '/api/posts' },
        { method: 'post', fullPath: '/api/v1/login' },
      ],
      DEFAULT_CSRF_EXCEPT,
    );

    const byPath = Object.fromEntries(
      probes.filter((probe) => !probe.withToken).map((probe) => [probe.path, probe.expectation]),
    );

    expect(byPath['/login']).toBe('require-419');
    expect(byPath['/api/posts']).toBe('forbid-419');
    expect(byPath['/api/v1/login']).toBe('require-419');
    expect(probes.some((probe) => probe.withToken)).toBe(true);
  });
});

describe('runCsrfRuntimeProbes', () => {
  it('flags protected routes that do not return 419 without a token', async () => {
    const issues = await runCsrfRuntimeProbes(
      async () => ({ status: 200 }),
      [
        {
          method: 'POST',
          path: '/login',
          expectation: 'require-419',
          reason: 'protected',
        },
      ],
      { strict: false },
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]?.rule).toBe('csrf-runtime-missing');
    expect(issues[0]?.severity).toBe('error');
  });

  it('flags excepted routes that incorrectly return 419', async () => {
    const issues = await runCsrfRuntimeProbes(
      async () => ({ status: 419 }),
      [
        {
          method: 'POST',
          path: '/api/posts',
          expectation: 'forbid-419',
          reason: 'excepted',
        },
      ],
      { strict: false },
    );

    expect(issues[0]?.rule).toBe('csrf-runtime-false-positive');
  });

  it('passes when live CSRF behavior matches expectations', async () => {
    const issues = await runCsrfRuntimeProbes(
      async (method, path, options) => {
        if (path === '/api/posts') {
          return { status: 200 };
        }
        if (options?.csrfToken) {
          return { status: 200 };
        }
        return { status: 419 };
      },
      buildCsrfRuntimeProbes(
        [
          { method: 'post', fullPath: '/login' },
          { method: 'post', fullPath: '/api/posts' },
        ],
        DEFAULT_CSRF_EXCEPT,
      ),
      { strict: false },
    );

    expect(issues).toEqual([]);
  });
});
