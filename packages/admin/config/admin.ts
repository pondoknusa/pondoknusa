export default {
  enabled: true,
  prefix: '/admin',
  middleware: ['admin'],
  accessAbility: 'accessAdmin',
  perPage: 15,
  auditLog: {
    enabled: true,
    persistPath: '.tyravel/admin-audit.json',
    maxEntries: 500,
  },
} as const;