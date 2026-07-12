import type { MiddlewareInput } from './middleware-registry.js';
import { getMiddlewareMeta, type MiddlewareTag } from './middleware-meta.js';
import type { HttpMethod, Middleware } from './types.js';

const SAFE_METHODS = new Set<HttpMethod>(['GET', 'HEAD', 'OPTIONS', 'DELETE']);
const SKIP_TAGS = new Set<MiddlewareTag>(['session', 'csrf', 'locale', 'view']);
const DISQUALIFYING_TAGS = new Set<MiddlewareTag>(['session', 'csrf', 'locale', 'view']);

export function collectMiddlewareLabels(middlewareInputs: MiddlewareInput[]): string[] {
  const labels: string[] = [];

  for (const input of middlewareInputs) {
    if (Array.isArray(input)) {
      for (const nested of input) {
        if (typeof nested === 'string') {
          labels.push(nested);
        }
      }
      continue;
    }

    if (typeof input === 'string') {
      labels.push(input);
    }
  }

  return labels;
}

export function qualifiesForJsonFastPath(
  method: HttpMethod,
  middlewareInputs: MiddlewareInput[],
): boolean {
  return qualifiesForJsonFastPathLabels(method, collectMiddlewareLabels(middlewareInputs));
}

export function qualifiesForJsonFastPathLabels(
  method: HttpMethod,
  labels: string[],
): boolean {
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

export function qualifiesForJsonFastPathResolved(
  method: HttpMethod,
  labels: string[],
  middleware: Middleware[],
): boolean {
  if (!qualifiesForJsonFastPathLabels(method, labels)) {
    return false;
  }

  if (SAFE_METHODS.has(method)) {
    return true;
  }

  return !middleware.some((entry) => {
    const tag = getMiddlewareMeta(entry)?.tag;
    return tag !== undefined && DISQUALIFYING_TAGS.has(tag);
  });
}

export function filterFastPathMiddleware(middleware: Middleware[]): Middleware[] {
  return middleware.filter((entry) => {
    const tag = getMiddlewareMeta(entry)?.tag;
    return !tag || !SKIP_TAGS.has(tag);
  });
}