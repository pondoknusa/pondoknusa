import type { QueryProfileEntry } from '@tyravel/database';
import type { DebugWarning } from './types.js';

export function analyzeQueries(
  queries: QueryProfileEntry[],
  options: { slowQueryMs?: number; nPlusOneThreshold?: number } = {},
): DebugWarning[] {
  const warnings: DebugWarning[] = [];
  const slowQueryMs = options.slowQueryMs ?? 100;
  const nPlusOneThreshold = options.nPlusOneThreshold ?? 3;

  for (const query of queries) {
    if (query.durationMs >= slowQueryMs) {
      warnings.push({
        type: 'slow_query',
        message: `Slow query (${query.durationMs.toFixed(1)}ms): ${truncate(query.sql, 120)}`,
        metadata: {
          durationMs: query.durationMs,
          sql: query.sql,
        },
      });
    }
  }

  const templates = new Map<string, number>();
  for (const query of queries) {
    const template = normalizeSql(query.sql);
    templates.set(template, (templates.get(template) ?? 0) + 1);
  }

  for (const [template, count] of templates) {
    if (count >= nPlusOneThreshold) {
      warnings.push({
        type: 'n_plus_one',
        message: `Possible N+1 (${count}×): ${truncate(template, 120)}`,
        metadata: {
          count,
          template,
        },
      });
    }
  }

  return warnings;
}

function normalizeSql(sql: string): string {
  return sql
    .replace(/\b\d+\b/g, '?')
    .replace(/'(?:''|[^'])*'/g, '?')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}