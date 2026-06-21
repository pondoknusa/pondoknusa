import { describe, expect, it } from 'vitest';
import { HealthChecker } from './health.js';

describe('HealthChecker', () => {
  it('aggregates registered checks', async () => {
    const checker = new HealthChecker();
    checker.register('app', () => true);
    checker.register('db', async () => false);

    const report = await checker.run();
    expect(report.status).toBe('fail');
    expect(report.checks.app?.ok).toBe(true);
    expect(report.checks.db?.ok).toBe(false);
  });

  it('captures thrown errors', async () => {
    const checker = new HealthChecker();
    checker.register('redis', () => {
      throw new Error('connection refused');
    });

    const report = await checker.run();
    expect(report.checks.redis).toEqual({
      ok: false,
      error: 'connection refused',
    });
  });
});