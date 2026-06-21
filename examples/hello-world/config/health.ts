import type { HealthConfig } from '@tyravel/core';

export default {
  enabled: true,
  path: '/health',
  checks: {
    database: true,
    redis: true,
  },
} satisfies HealthConfig;