export default {
  throttle: {
    enabled: true,
    limits: {
      api: { limit: 120, windowMs: 60_000 },
    },
  },
};
