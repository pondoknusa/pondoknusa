import type { RedisConfig } from '@tyravel/redis';
import { env, envInt } from '@tyravel/config';

export default {
  default: env('REDIS_CONNECTION', 'default'),
  prefix: 'tyravel',
  connections: {
    default: {
      url: env('REDIS_URL', ''),
      host: env('REDIS_HOST', '127.0.0.1'),
      port: envInt('REDIS_PORT', 6379),
      password: env('REDIS_PASSWORD', ''),
      database: envInt('REDIS_DB', 0),
    },
  },
} satisfies RedisConfig;