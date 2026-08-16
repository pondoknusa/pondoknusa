import type { CorsConfig } from '@pondoknusa/core';
import { env } from '@pondoknusa/config';

export default {
  enabled: true,
  origins: [env('APP_URL', 'http://localhost:3000')],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  headers: ['Content-Type', 'Authorization'],
  credentials: false,
} satisfies CorsConfig;
