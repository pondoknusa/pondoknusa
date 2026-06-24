import { describe, expect, it } from 'vitest';
import { Job } from './job.js';
import { JobRegistry } from './registry.js';
import { setQueueWorkerProcessHook, QueueWorker } from './worker.js';

class EchoJob extends Job<{ message: string }> {
  async handle(): Promise<void> {
    // no-op
  }
}

describe('QueueWorker process hook', () => {
  it('invokes the hook with duration and payload', async () => {
    const registry = new JobRegistry();
    registry.register(EchoJob);

    const calls: Array<{ job: string; durationMs: number; error?: unknown }> = [];
    setQueueWorkerProcessHook(async ({ payload, durationMs, error }) => {
      calls.push({ job: payload.job, durationMs, error });
    });

    const worker = new QueueWorker(registry);
    await worker.process({
      job: 'EchoJob',
      data: { message: 'hello' },
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.job).toBe('EchoJob');
    expect(calls[0]?.durationMs).toBeGreaterThanOrEqual(0);
    expect(calls[0]?.error).toBeUndefined();

    setQueueWorkerProcessHook(undefined);
  });

  it('reports failures to the hook', async () => {
    class FailingJob extends Job {
      async handle(): Promise<void> {
        throw new Error('boom');
      }
    }

    const registry = new JobRegistry();
    registry.register(FailingJob);

    const calls: Array<{ error?: unknown }> = [];
    setQueueWorkerProcessHook(async ({ error }) => {
      calls.push({ error });
    });

    const worker = new QueueWorker(registry);
    await expect(
      worker.process({
        job: 'FailingJob',
        data: {},
      }),
    ).rejects.toThrow('boom');

    expect(calls).toHaveLength(1);
    expect(calls[0]?.error).toBeInstanceOf(Error);

    setQueueWorkerProcessHook(undefined);
  });
});