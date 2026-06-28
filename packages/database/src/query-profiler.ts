import type { DatabaseConnection } from './connection.js';
import type { RowValue } from './types.js';

export interface QueryProfileEntry {
  sql: string;
  bindings: RowValue[];
  durationMs: number;
  /** First application frame where the query was issued (when profiling is enabled). */
  source?: string;
}

export class QueryProfiler {
  private static enabled = false;
  private static entries: QueryProfileEntry[] = [];

  static enable(): void {
    this.enabled = true;
  }

  static disable(): void {
    this.enabled = false;
  }

  static isEnabled(): boolean {
    return this.enabled;
  }

  static reset(): void {
    this.entries = [];
  }

  static getQueries(): QueryProfileEntry[] {
    return [...this.entries];
  }

  static async profile<T>(
    sql: string,
    bindings: RowValue[],
    callback: () => Promise<T>,
  ): Promise<T> {
    if (!this.enabled) {
      return callback();
    }

    const start = performance.now();
    try {
      return await callback();
    } finally {
      this.entries.push({
        sql,
        bindings: [...bindings],
        durationMs: performance.now() - start,
        source: captureQuerySource(),
      });
    }
  }
}

function captureQuerySource(): string | undefined {
  const stack = new Error().stack;
  if (!stack) {
    return undefined;
  }

  const lines = stack.split('\n').slice(3);
  for (const line of lines) {
    if (line.includes('query-profiler') || line.includes('node_modules')) {
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return undefined;
}

export function wrapConnectionWithProfiler(
  connection: DatabaseConnection,
): DatabaseConnection {
  return {
    grammar: connection.grammar,
    query: (sql, bindings = []) =>
      QueryProfiler.profile(sql, bindings, () => connection.query(sql, bindings)),
    exec: (sql) => connection.exec(sql),
    transaction: (callback) => connection.transaction(callback),
    close: connection.close?.bind(connection),
  };
}