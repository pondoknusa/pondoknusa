import {
  createCorsMiddleware,
  createThrottleMiddleware,
  createTrustedProxiesMiddleware,
  type CorsOptions,
} from '@tyravel/http';
import type { ConfigRepository } from '@tyravel/config';
import type { Application } from './application.js';

export interface CorsConfig extends CorsOptions {
  enabled?: boolean;
}

export interface HttpConfig {
  trustedProxies?: string[];
  throttle?: {
    enabled?: boolean;
    limit: number;
    windowMs: number;
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

  if (httpConfig?.throttle && httpConfig.throttle.enabled !== false) {
    app.use(
      createThrottleMiddleware({
        limit: httpConfig.throttle.limit,
        windowMs: httpConfig.throttle.windowMs,
      }),
    );
  }
}