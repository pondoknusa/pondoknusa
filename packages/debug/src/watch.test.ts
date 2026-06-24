import { describe, expect, it } from 'vitest';
import { formatDebugEntryLine, formatDebugExecutionLine } from './watch.js';

describe('debug watch formatting', () => {
  it('formats request entry lines', () => {
    const line = formatDebugEntryLine({
      id: 'entry-1',
      method: 'GET',
      path: '/users',
      status: 200,
      durationMs: 42.2,
      timestamp: Date.now(),
      timeline: [],
      queries: [{ sql: 'select 1', bindings: [], durationMs: 1 }],
      warnings: [],
      dispatched: [{ type: 'queue', label: 'SendEmail', timestamp: 10 }],
    });

    expect(line).toBe('GET /users → 200 (42.2ms, 1 queries, 0 warnings, 1 dispatched)');
  });

  it('formats correlated execution lines', () => {
    const line = formatDebugExecutionLine({
      id: 'exec-1',
      parentRequestId: 'req-1',
      job: 'SendEmail',
      queue: 'default',
      status: 'completed',
      durationMs: 8.4,
      timestamp: Date.now(),
    });

    expect(line).toBe('  ↳ SendEmail on default completed (8.4ms)');
  });
});