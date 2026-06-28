import { describe, expect, it } from 'vitest';
import { withMiddlewareMeta } from './middleware-meta.js';
import {
  filterFastPathMiddleware,
  qualifiesForJsonFastPath,
} from './json-fast-path.js';
import type { Middleware } from './types.js';

const sessionMw: Middleware = withMiddlewareMeta(
  async (_request, next) => next(),
  { tag: 'session' },
);

const throttleMw: Middleware = async (_request, next) => next();

describe('json fast path', () => {
  it('qualifies safe API routes without session auth', () => {
    expect(qualifiesForJsonFastPath('GET', ['throttle:api'])).toBe(true);
    expect(qualifiesForJsonFastPath('GET', ['auth:api'])).toBe(true);
    expect(qualifiesForJsonFastPath('POST', ['auth:api'])).toBe(true);
  });

  it('rejects routes that require session or csrf', () => {
    expect(qualifiesForJsonFastPath('GET', ['guest'])).toBe(false);
    expect(qualifiesForJsonFastPath('POST', ['csrf'])).toBe(false);
    expect(qualifiesForJsonFastPath('GET', ['auth'])).toBe(false);
    expect(qualifiesForJsonFastPath('GET', ['auth:web'])).toBe(false);
  });

  it('filters tagged session middleware from the pipeline', () => {
    const filtered = filterFastPathMiddleware([sessionMw, throttleMw]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toBe(throttleMw);
  });
});