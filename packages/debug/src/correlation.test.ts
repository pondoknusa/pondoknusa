import { describe, expect, it } from 'vitest';
import { DebugRequestContext, runWithDebugContext } from './context.js';
import {
  DEBUG_REQUEST_ID_KEY,
  extractDebugRequestId,
  stampJob,
  stampJobData,
} from './correlation.js';
import { DebugCorrelationStore } from './correlation-store.js';

describe('debug correlation', () => {
  it('stamps and extracts request ids from job data', async () => {
    const context = new DebugRequestContext('POST', '/orders');
    const data: Record<string, unknown> = { orderId: 1 };

    await runWithDebugContext(context, async () => {
      stampJobData(data);
    });

    expect(data[DEBUG_REQUEST_ID_KEY]).toBe(context.id);
    expect(extractDebugRequestId(data)).toBe(context.id);
  });

  it('stamps jobs without a debug context', () => {
    const job = { data: { foo: 'bar' } as Record<string, unknown> };
    stampJob(job);
    expect(job.data[DEBUG_REQUEST_ID_KEY]).toBeUndefined();
  });

  it('records correlated executions by parent request id', async () => {
    const store = new DebugCorrelationStore(10);
    const execution = store.record({
      parentRequestId: 'req-1',
      job: 'SendWelcomeEmail',
      queue: 'default',
      status: 'completed',
      durationMs: 12.5,
    });

    expect(execution.parentRequestId).toBe('req-1');
    expect(store.getForRequest('req-1')).toEqual([execution]);
    expect(store.getForRequest('missing')).toEqual([]);
  });
});