import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lintApplication, lintHasErrors } from './lint.js';
import { isNestedApiPath, pathMatchesCsrfExcept, DEFAULT_CSRF_EXCEPT } from './csrf-except.js';

const fixturesRoot = fileURLToPath(new URL('./__fixtures__', import.meta.url));

describe('csrf except matching', () => {
  it('matches AuthServiceProvider defaults the same way as verify-csrf-token', () => {
    expect(pathMatchesCsrfExcept('/api/posts', DEFAULT_CSRF_EXCEPT)).toBe(true);
    expect(pathMatchesCsrfExcept('/api/v1/login', DEFAULT_CSRF_EXCEPT)).toBe(false);
    expect(pathMatchesCsrfExcept('/broadcasting/auth', DEFAULT_CSRF_EXCEPT)).toBe(true);
    expect(pathMatchesCsrfExcept('/webhooks/stripe', DEFAULT_CSRF_EXCEPT)).toBe(true);
    expect(isNestedApiPath('/api/v1/login')).toBe(true);
    expect(isNestedApiPath('/api/posts')).toBe(false);
  });
});

describe('lintApplication', () => {
  it('passes a correctly bootstrapped app', async () => {
    const { issues } = await lintApplication(join(fixturesRoot, 'good-app'), {
      strict: false,
      runtime: false,
    });

    expect(issues.filter((issue) => issue.severity === 'error')).toEqual([]);
    expect(lintHasErrors(issues)).toBe(false);
  });

  it('flags static route imports before facade/boot/http middleware', async () => {
    const { issues } = await lintApplication(join(fixturesRoot, 'static-imports'), {
      strict: false,
      runtime: false,
    });

    const rules = new Set(issues.map((issue) => issue.rule));
    expect(rules.has('route-before-facade')).toBe(true);
    expect(rules.has('route-before-boot')).toBe(true);
    expect(rules.has('route-before-http-middleware')).toBe(true);
    expect(rules.has('missing-register-routes')).toBe(true);
    expect(rules.has('controller-action-missing')).toBe(true);
    expect(rules.has('oauth-redirect-mismatch')).toBe(true);
    expect(rules.has('csrf-except-gap')).toBe(true);
  });

  it('flags middleware, auth, csrf, duplicates, and missing controller actions', async () => {
    const { issues } = await lintApplication(join(fixturesRoot, 'problems'), {
      strict: false,
      runtime: false,
    });

    const rules = new Set(issues.map((issue) => issue.rule));
    expect(rules.has('unknown-middleware')).toBe(true);
    expect(rules.has('missing-throttle-preset')).toBe(true);
    expect(rules.has('auth-provider-missing')).toBe(true);
    expect(rules.has('auth-guard-mismatch')).toBe(true);
    expect(rules.has('csrf-on-web-mutation')).toBe(true);
    expect(rules.has('duplicate-route-name')).toBe(true);
    expect(rules.has('duplicate-route-method-path')).toBe(true);
    expect(rules.has('controller-action-missing')).toBe(true);
    expect(rules.has('unreachable-route-file')).toBe(true);
    expect(lintHasErrors(issues)).toBe(true);
  });

  it('fails hard on detectable CSRF 419 footguns', async () => {
    const { issues } = await lintApplication(join(fixturesRoot, 'csrf-gaps'), {
      strict: false,
      runtime: false,
    });

    const byRule = Object.groupBy(issues, (issue) => issue.rule);

    expect(byRule['csrf-except-gap']?.length).toBeGreaterThan(0);
    expect(byRule['csrf-on-web-mutation']?.length).toBeGreaterThan(0);
    expect(byRule['csrf-form-missing-token']?.length).toBeGreaterThan(0);

    for (const rule of ['csrf-except-gap', 'csrf-on-web-mutation', 'csrf-form-missing-token'] as const) {
      for (const issue of byRule[rule] ?? []) {
        expect(issue.severity).toBe('error');
      }
    }

    expect(lintHasErrors(issues)).toBe(true);
  });
});
