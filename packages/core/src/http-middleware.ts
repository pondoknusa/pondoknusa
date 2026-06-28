import {
  createCorsMiddleware,
  createThrottleMiddleware,
  createTrustedProxiesMiddleware,
  registerThrottlePresets,
  type CorsOptions,
  type ThrottlePresetMap,
} from '@tyravel/http';
import type { ConfigRepository } from '@tyravel/config';
import type { Application } from './application.js';

export interface CorsConfig extends CorsOptions {
  enabled?: boolean;
}

export interface HttpConfig {
  trustedProxies?: string[];
  /** Skip session/CSRF/view middleware on stateless JSON routes (default: true). */
  jsonFastPath?: boolean;
  throttle?: {
    enabled?: boolean;
    limit: number;
    windowMs: number;
    limits?: ThrottlePresetMap;
  };
}

export function registerHttpMiddleware(
  app: Application,
  config: ConfigRepository,
): void {
  const corsConfig = config.get<CorsConfig | undefined>('cors');
  if (corsConfig && corsConfig.enabled !== false) {
    app.use(createCorsMiddleware(corsConfig));
  }

  const httpConfig = config.get<HttpConfig | undefined>('http');
  if (httpConfig?.trustedProxies?.length) {
    app.use(createTrustedProxiesMiddleware({ proxies: httpConfig.trustedProxies }));
  }

  if (httpConfig?.jsonFastPath === false) {
    app.router().setJsonFastPath(false);
  }

  if (httpConfig?.throttle && httpConfig.throttle.enabled !== false) {
    app.use(
      createThrottleMiddleware({
        limit: httpConfig.throttle.limit,
        windowMs: httpConfig.throttle.windowMs,
      }),
    );

    if (httpConfig.throttle.limits) {
      registerThrottlePresets((name, middleware) => {
        app.middleware(name, middleware);
      }, httpConfig.throttle.limits);
    }
  }
}