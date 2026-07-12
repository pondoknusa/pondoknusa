import type { PondoknusaRequest } from './request.js';
import type { Middleware } from './types.js';

const WebResponse = globalThis.Response;
type WebResponse = globalThis.Response;

export interface CorsOptions {
  origins: string[] | '*';
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
}

const DEFAULT_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
const DEFAULT_HEADERS = ['Content-Type', 'Authorization'];

export function createCorsMiddleware(options: CorsOptions): Middleware {
  if (options.origins === '*' && options.credentials === true) {
    throw new Error(
      'CORS misconfiguration: origins "*" cannot be combined with credentials: true.',
    );
  }

  const methods = (options.methods ?? DEFAULT_METHODS).join(', ');
  const headers = (options.headers ?? DEFAULT_HEADERS).join(', ');

  return async (request, next) => {
    const origin = request.header('origin');
    const allowOrigin = resolveAllowOrigin(options.origins, origin);

    if (request.method === 'OPTIONS') {
      return applyCorsHeaders(
        new WebResponse(null, { status: 204 }),
        allowOrigin,
        methods,
        headers,
        options.credentials ?? false,
      );
    }

    const response = await next();
    if (response.status < 200 || response.status >= 300) {
      return response;
    }

    return applyCorsHeaders(
      response,
      allowOrigin,
      methods,
      headers,
      options.credentials ?? false,
    );
  };
}

function resolveAllowOrigin(
  origins: string[] | '*',
  requestOrigin: string | undefined,
): string | null {
  if (origins === '*') {
    return '*';
  }

  if (!requestOrigin) {
    return null;
  }

  const normalizedRequest = normalizeOrigin(requestOrigin);
  if (!normalizedRequest) {
    return null;
  }

  for (const allowed of origins) {
    const normalizedAllowed = normalizeOrigin(allowed);
    if (normalizedAllowed && normalizedAllowed === normalizedRequest) {
      return requestOrigin;
    }
  }

  return null;
}

function normalizeOrigin(origin: string): string | null {
  try {
    const url = new URL(origin);
    const port = url.port || defaultPort(url.protocol);
    return `${url.protocol}//${url.hostname}:${port}`;
  } catch {
    return null;
  }
}

function defaultPort(protocol: string): string {
  return protocol === 'https:' ? '443' : '80';
}

function applyCorsHeaders(
  response: WebResponse,
  allowOrigin: string | null,
  methods: string,
  headers: string,
  credentials: boolean,
): WebResponse {
  if (!allowOrigin) {
    return response;
  }

  const next = new WebResponse(response.body, response);
  next.headers.set('Access-Control-Allow-Origin', allowOrigin);
  next.headers.set('Access-Control-Allow-Methods', methods);
  next.headers.set('Access-Control-Allow-Headers', headers);

  if (credentials) {
    next.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return next;
}
