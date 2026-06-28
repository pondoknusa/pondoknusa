import { describe, expect, it } from 'vitest';
import { runPerfSmoke } from './perf-smoke.js';

describe('runPerfSmoke', () => {
  it('returns throughput for a minimal HTTP loop', async () => {
    const result = await runPerfSmoke();
    expect(result.message).toMatch(/req\/s/);
    expect(result.ok).toBe(true);
  });
});