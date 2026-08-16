import type { HttpConfig } from '@pondoknusa/core';

export default {
  // Cloudflare Tunnel connects as loopback. Add Docker/private proxy CIDRs when needed.
  trustedProxies: ['127.0.0.1', '::1'],
  jsonFastPath: true,
  early404: true,
  requestPooling: true,
  throttle: {
    enabled: true,
    limit: 120,
    windowMs: 60_000,
    limits: {
      api: { limit: 120, windowMs: 60_000 },
    },
  },
} satisfies HttpConfig;
