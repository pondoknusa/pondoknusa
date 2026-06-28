import { describe, expect, it } from 'vitest';
import { evaluatePerfBudgets } from './perf-budget.js';

describe('evaluatePerfBudgets', () => {
  it('flags throughput below minimum', () => {
    const violations = evaluatePerfBudgets(
      {
        results: [
          { name: 'http.json', label: 'HTTP JSON', value: 100, unit: 'req/s' },
        ],
      },
      {
        name: 'app',
        entry: 'src/main.ts',
        serve: { port: 3000, hostname: '127.0.0.1' },
        perf: { budgets: { 'http.json': { min: 500, unit: 'req/s' } } },
      },
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.name).toBe('http.json');
  });

  it('flags boot latency above maximum', () => {
    const violations = evaluatePerfBudgets(
      {
        results: [
          { name: 'boot.cold', label: 'Boot', value: 900, unit: 'ms' },
        ],
      },
      {
        name: 'app',
        entry: 'src/main.ts',
        serve: { port: 3000, hostname: '127.0.0.1' },
        perf: { budgets: { 'boot.cold': { max: 500, unit: 'ms' } } },
      },
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.expected).toContain('≤ 500');
  });
});