export default {
  throttle: {
    enabled: true,
    limit: 120,
    windowMs: 60_000,
    limits: {
      api: { limit: 120, windowMs: 60_000 },
    },
  },
};
