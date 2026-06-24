import { describe, expect, it } from 'vitest';
import { analyzeQueries } from './query-analysis.js';

describe('analyzeQueries', () => {
  it('flags slow queries and repeated query templates', () => {
    const warnings = analyzeQueries(
      [
        { sql: 'SELECT * FROM users WHERE id = 1', bindings: [1], durationMs: 150 },
        { sql: 'SELECT * FROM users WHERE id = 2', bindings: [2], durationMs: 2 },
        { sql: 'SELECT * FROM users WHERE id = 3', bindings: [3], durationMs: 2 },
        { sql: 'SELECT * FROM users WHERE id = 4', bindings: [4], durationMs: 2 },
      ],
      { slowQueryMs: 100, nPlusOneThreshold: 3 },
    );

    expect(warnings.some((warning) => warning.type === 'slow_query')).toBe(true);
    expect(warnings.some((warning) => warning.type === 'n_plus_one')).toBe(true);
  });
});