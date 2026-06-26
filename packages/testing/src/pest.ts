import type { TestCase } from './test-case.js';
import { withTyravelTest } from './vitest.js';

export {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
  vi,
} from 'vitest';

/**
 * Pest-style alias for binding a Tyravel TestCase to Vitest lifecycle hooks.
 *
 * ```ts
 * class FeatureTest extends TestCase { ... }
 * const t = uses(FeatureTest);
 *
 * test('lists posts', async () => {
 *   await t.http.get('/posts').assertOk();
 * });
 * ```
 */
export function uses<T extends TestCase>(CaseClass: new () => T): T {
  return withTyravelTest(CaseClass);
}

export type DatasetRow = Record<string, unknown>;

/**
 * Build labeled rows for `it.each` / `test.each` tables.
 */
export function dataset(rows: DatasetRow[]): Array<[string, DatasetRow]> {
  return rows.map((row) => {
    const label = Object.entries(row)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(', ');
    return [label, row];
  });
}