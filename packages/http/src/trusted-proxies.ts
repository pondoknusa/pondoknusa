import type { TyravelRequest } from './request.js';
import type { Middleware } from './types.js';

export interface TrustedProxiesOptions {
  proxies: string[];
}

export function createTrustedProxiesMiddleware(
  options: TrustedProxiesOptions,
): Middleware {
  return async (request, next) => {
    request.setTrustedProxies(options.proxies);
    return next();
  };
}

export function resolveClientIp(
  request: TyravelRequest,
  remoteAddress?: string,
): string {
  const forwardedFor = request.header('x-forwarded-for');
  if (request.hasTrustedProxies() && forwardedFor) {
    const clientIp = forwardedFor.split(',')[0]?.trim();
    if (clientIp) {
      return clientIp;
    }
  }

  return remoteAddress ?? request.header('x-real-ip') ?? '127.0.0.1';
}

export function resolveSecure(request: TyravelRequest): boolean {
  const forwardedProto = request.header('x-forwarded-proto');
  if (request.hasTrustedProxies() && forwardedProto) {
    return forwardedProto.toLowerCase() === 'https';
  }

  return request.url.protocol === 'https:';
}