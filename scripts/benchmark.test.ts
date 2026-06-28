import { describe, expect, it } from 'vitest';
import { measureHttp, measureOrm, measureViewCompile, runBenchmarks } from './benchmark.mjs';

describe('benchmarks', () => {
  it('measures HTTP throughput', async () => {
    const result = await measureHttp({ warmup: 5, requests: 20, concurrency: 5 });
    expect(result.name).toBe('http.json');
    expect(result.value).toBeGreaterThan(0);
  });

  it('measures ORM throughput', async () => {
    const result = await measureOrm({ warmup: 2, iterations: 10 });
    expect(result.name).toBe('orm.select');
    expect(result.value).toBeGreaterThan(0);
  });

  it('measures view compile throughput', () => {
    const result = measureViewCompile({ warmup: 2, iterations: 10 });
    expect(result.name).toBe('view.compile');
    expect(result.value).toBeGreaterThan(0);
  });

  it('runs the full benchmark report', async () => {
    const report = await runBenchmarks({
      http: { warmup: 5, requests: 10, concurrency: 5 },
      orm: { warmup: 2, iterations: 5 },
      views: { warmup: 2, iterations: 5 },
    });

    expect(report.results).toHaveLength(3);
    for (const result of report.results) {
      expect(result.value).toBeGreaterThan(0);
    }
  });
});