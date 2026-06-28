import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function loadBenchmarkRunner(projectRoot: string): Promise<{
  runBenchmarks: (overrides?: Record<string, unknown>) => Promise<{
    results: Array<{ name: string; label: string; value: number; unit: string }>;
  }>;
}> {
  const cliDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(projectRoot, 'scripts', 'benchmark.mjs'),
    join(projectRoot, '..', 'scripts', 'benchmark.mjs'),
    join(projectRoot, '..', '..', 'scripts', 'benchmark.mjs'),
    join(cliDir, '..', '..', '..', 'scripts', 'benchmark.mjs'),
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return import(pathToFileURL(candidate).href) as Promise<{
        runBenchmarks: (overrides?: Record<string, unknown>) => Promise<{
          results: Array<{ name: string; label: string; value: number; unit: string }>;
        }>;
      }>;
    }
  }

  throw new Error(
    'Benchmark harness not found. Perf budgets require scripts/benchmark.mjs (monorepo or linked checkout).',
  );
}