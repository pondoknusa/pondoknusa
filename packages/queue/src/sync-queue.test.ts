import { describe, expect, it } from 'vitest';
import { Job } from './job.js';
import { JobRegistry } from './registry.js';
import { QueueManager } from './queue-manager.js';
import { SyncQueue } from './sync-queue.js';
import type { QueueConfig } from './types.js';
import { QueueWorker } from './worker.js';

class AddJob extends Job<{ total: number }> {
  static result = 0;

  override async handle(): Promise<void> {
    AddJob.result += this.data.total;
  }
}

const queueConfig: QueueConfig = {
  default: 'sync',
  connections: {
    sync: { driver: 'sync' },
  },
};

describe('SyncQueue', () => {
  it('runs jobs immediately when dispatched', async () => {
    AddJob.result = 0;
    const registry = new JobRegistry().register(AddJob);
    const worker = new QueueWorker(registry);
    const manager = new QueueManager(queueConfig, worker);
    const queue = manager.connection();

    expect(queue).toBeInstanceOf(SyncQueue);

    await queue.push(new AddJob({ total: 2 }));
    await queue.push(new AddJob({ total: 3 }));

    expect(AddJob.result).toBe(5);
  });
});