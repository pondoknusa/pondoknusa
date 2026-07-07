import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

function runBench(name: string, options: Record<string, number> = {}): Record<string, unknown> {
  const output = execFileSync(
    'node',
    ['scripts/bench-runner.mjs', name, JSON.stringify(options)],
    { cwd: ROOT, encoding: 'utf8' },
  );
  return JSON.parse(output) as Record<string, unknown>;
}

describe('benchmarks', () => {
  it('measures HTTP throughput', () => {
    const result = runBench('measureHttp', { warmup: 5, requests: 20, concurrency: 5 });
    expect(result.name).toBe('http.json');
    expect(result.value).toBeGreaterThan(0);
  });

  it('measures ORM throughput', () => {
    const result = runBench('measureOrm', { warmup: 2, iterations: 10 });
    expect(result.name).toBe('orm.select');
    expect(result.value).toBeGreaterThan(0);
  });

  it('measures pruned ORM throughput on wide rows', () => {
    const result = runBench('measureOrmPruned', { warmup: 2, iterations: 10 });
    expect(result.name).toBe('orm.select.pruned');
    expect(result.value).toBeGreaterThan(0);
  });

  it('measures view compile throughput', () => {
    const result = runBench('measureViewCompile', { warmup: 2, iterations: 10 });
    expect(result.name).toBe('view.compile');
    expect(result.value).toBeGreaterThan(0);
  });

  it('measures cold boot latency', () => {
    const result = runBench('measureBootCold', { iterations: 2 });
    expect(result.name).toBe('boot.cold');
    expect(result.value).toBeGreaterThan(0);
  });

  it('measures JSON fast-path throughput', () => {
    const result = runBench('measureHttpJsonFast', { warmup: 5, requests: 10, concurrency: 5 });
    expect(result.name).toBe('http.json.fast');
    expect(result.value).toBeGreaterThan(0);
  });

  it('measures middleware stack throughput', () => {
    const result = runBench('measureMiddlewareStack', { warmup: 5, requests: 10, concurrency: 5 });
    expect(result.name).toBe('middleware.stack');
    expect(result.value).toBeGreaterThan(0);
  });

  it('measures session auth throughput', () => {
    const result = runBench('measureSessionAuth', { warmup: 3, requests: 10, concurrency: 5 });
    expect(result.name).toBe('session.auth');
    expect(result.value).toBeGreaterThan(0);
  });

  it('measures HTTP SSR throughput', () => {
    const result = runBench('measureHttpSsr', { warmup: 3, requests: 10, concurrency: 5 });
    expect(result.name).toBe('http.ssr');
    expect(result.value).toBeGreaterThan(0);
  });

  it('measures view render throughput', () => {
    const result = runBench('measureViewRender', { warmup: 2, iterations: 5 });
    expect(result.name).toBe('view.render');
    expect(result.value).toBeGreaterThan(0);
  });

  it('runs the full benchmark report', () => {
    const output = execFileSync(
      'node',
      ['scripts/benchmark.mjs', '--json'],
      { cwd: ROOT, encoding: 'utf8', env: { ...process.env, BENCHMARK_QUICK: '1' }, timeout: 30000 },
    );
    const report = JSON.parse(output) as { results: Array<{ name: string; value: number }>; competitive: Array<{ name: string; value: number }> };

    expect(report.results).toHaveLength(14);
    expect(report.competitive).toHaveLength(4);

    for (const result of report.results) {
      expect(result.value).toBeGreaterThan(0);
    }

    for (const result of report.competitive) {
      expect(result.name).toMatch(/^compare\./);
      expect(result.value).toBeGreaterThan(0);
    }
  }, 60000);
});
