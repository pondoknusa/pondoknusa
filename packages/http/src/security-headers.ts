import type { PondoknusaRequest } from './request.js';
import type { Middleware } from './types.js';

const WebResponse = globalThis.Response;
type WebResponse = globalThis.Response;

export interface SecurityHeadersOptions {
  /** Set to false to disable a header. Defaults shown below. */
  contentTypeOptions?: string | false;
  frameOptions?: string | false;
  referrerPolicy?: string | false;
  /** Opt-in; no default CSP (apps vary widely). */
  contentSecurityPolicy?: string | false;
}

const DEFAULTS = {
  contentTypeOptions: 'nosniff',
  frameOptions: 'SAMEORIGIN',
  referrerPolicy: 'strict-origin-when-cross-origin',
} as const;

export function createSecurityHeadersMiddleware(
  options: SecurityHeadersOptions = {},
): Middleware {
  return async (_request: PondoknusaRequest, next) => {
    const response = await next();
    const headers = new Headers(response.headers);

    setHeader(headers, 'X-Content-Type-Options', options.contentTypeOptions, DEFAULTS.contentTypeOptions);
    setHeader(headers, 'X-Frame-Options', options.frameOptions, DEFAULTS.frameOptions);
    setHeader(headers, 'Referrer-Policy', options.referrerPolicy, DEFAULTS.referrerPolicy);

    if (typeof options.contentSecurityPolicy === 'string') {
      headers.set('Content-Security-Policy', options.contentSecurityPolicy);
    }

    return new WebResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

function setHeader(
  headers: Headers,
  name: string,
  value: string | false | undefined,
  fallback: string,
): void {
  if (value === false) {
    return;
  }
  headers.set(name, value ?? fallback);
}
