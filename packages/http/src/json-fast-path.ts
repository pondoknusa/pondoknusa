import type { MiddlewareInput } from './middleware-registry.js';
import { getMiddlewareMeta } from './middleware-meta.js';
import type { HttpMethod, Middleware } from './types.js';

const SAFE_METHODS = new Set<HttpMethod>(['GET', 'HEAD', 'OPTIONS', 'DELETE']);
const SKIP_TAGS = new Set(['session', 'csrf', 'locale', 'view']);

export function qualifiesForJsonFastPath(
  method: HttpMethod,
  middlewareInputs: MiddlewareInput[],
): boolean {
  const labels = middlewareInputs
    .flatMap((input) => (Array.isArray(input) ? input : [input]))
    .filter((input): input is string => typeof input === 'string');

  if (labels.includes('csrf') || labels.includes('guest') || labels.includes('auth')) {
    return false;
  }

  if (labels.some((label) => label.startsWith('auth:') && label !== 'auth:api')) {
    return false;
  }

  if (SAFE_METHODS.has(method)) {
    return true;
  }

  if (labels.includes('auth:api')) {
    return true;
  }

  return !labels.some((label) => label.startsWith('auth'));
}

export function filterFastPathMiddleware(middleware: Middleware[]): Middleware[] {
  return middleware.filter((entry) => {
    const tag = getMiddlewareMeta(entry)?.tag;
    return !tag || !SKIP_TAGS.has(tag);
  });
}