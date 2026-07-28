import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Session, createVerifyCsrfTokenMiddleware } from '@pondoknusa/auth';
import { Application, HttpKernel, Route, setRouteApplication } from '@pondoknusa/core';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_CSRF_EXCEPT } from './csrf-except.js';
import { buildCsrfRuntimeProbes, runCsrfRuntimeProbes } from './runtime-csrf-probes.js';

describe('CSRF request probes against a live kernel', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { recursive: true, force: true });
      root = undefined;
    }
  });

  it('detects missing CSRF on the live stack and accepts matching tokens', async () => {
    root = await mkdtemp(join(tmpdir(), 'pondoknusa-lint-csrf-'));

    const app = new Application(root);
    setRouteApplication(app);

    let sessionData: Record<string, unknown> = {};
    app.use(async (request, next) => {
      request.session = new Session('lint', { ...sessionData });
      return next();
    });
    app.use(createVerifyCsrfTokenMiddleware({ except: [...DEFAULT_CSRF_EXCEPT] }));

    Route.post('/login', () => Response.json({ ok: true }));
    Route.post('/api/posts', () => Response.json({ ok: true }));
    Route.post('/api/v1/login', () => Response.json({ ok: true }));

    const kernel = new HttpKernel(app);
    const probes = buildCsrfRuntimeProbes(
      [
        { method: 'post', fullPath: '/login' },
        { method: 'post', fullPath: '/api/posts' },
        { method: 'post', fullPath: '/api/v1/login' },
      ],
      DEFAULT_CSRF_EXCEPT,
    );

    const issues = await runCsrfRuntimeProbes(
      async (method, path, options) => {
        sessionData = options?.csrfToken ? { _csrf_token: options.csrfToken } : {};
        const headers: Record<string, string> = {
          accept: 'application/json',
          'content-type': 'application/json',
        };
        if (options?.csrfToken) {
          headers['x-csrf-token'] = options.csrfToken;
        }
        const response = await kernel.handle(
          new Request(`http://localhost${path}`, {
            method,
            headers,
            body: '{}',
          }),
        );
        return { status: response.status };
      },
      probes,
      { strict: false },
    );

    expect(issues).toEqual([]);
  });

  it('flags when CSRF never landed on registered routes', async () => {
    root = await mkdtemp(join(tmpdir(), 'pondoknusa-lint-csrf-'));

    const app = new Application(root);
    setRouteApplication(app);

    // Register routes BEFORE CSRF middleware (classic boot-order bug).
    Route.post('/login', () => Response.json({ ok: true }));
    app.use(createVerifyCsrfTokenMiddleware({ except: [...DEFAULT_CSRF_EXCEPT] }));

    const kernel = new HttpKernel(app);
    const issues = await runCsrfRuntimeProbes(
      async (method, path) => {
        const response = await kernel.handle(
          new Request(`http://localhost${path}`, {
            method,
            headers: { accept: 'application/json', 'content-type': 'application/json' },
            body: '{}',
          }),
        );
        return { status: response.status };
      },
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

    expect(issues.some((issue) => issue.rule === 'csrf-runtime-missing')).toBe(true);
  });
});
