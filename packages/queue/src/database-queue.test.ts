import { describe, expect, it } from 'vitest';
import { SchemaBuilder } from '@tyravel/database';
import { SqliteConnection } from '@tyravel/database';
import type { DatabaseManager } from '@tyravel/database';
import { Job } from './job.js';
import { JobRegistry } from './registry.js';
import { DatabaseQueue } from './database-queue.js';
import { QueueManager } from './queue-manager.js';
import { QueueProcessor } from './queue-processor.js';
import type { QueueConfig } from './types.js';
import { QueueWorker } from './worker.js';

class PersistedJob extends Job<{ value: string }> {
  static values: string[] = [];

  override async handle(): Promise<void> {
    PersistedJob.values.push(this.data.value);
  }
}

async function createJobsTable(connection: SqliteConnection): Promise<void> {
  const schema = new SchemaBuilder(connection);
  await schema.create('jobs', (table) => {
    table.id();
    table.string('queue');
    table.text('payload');
    table.integer('attempts');
    table.integer('reserved_at').nullable();
    table.integer('available_at');
    table.integer('created_at');
  });
}

function asDatabaseManager(connection: SqliteConnection): DatabaseManager {
  return {
    connection: () => connection,
    close: async () => {},
  } as unknown as DatabaseManager;
}

describe('DatabaseQueue', () => {
  it('stores and processes jobs through the worker', async () => {
    PersistedJob.values = [];
    const connection = new SqliteConnection(':memory:');
    await createJobsTable(connection);

    const registry = new JobRegistry().register(PersistedJob);
    const worker = new QueueWorker(registry);
    const databaseQueue = new DatabaseQueue(connection, { driver: 'database', table: 'jobs' });

    await databaseQueue.push(new PersistedJob({ value: 'first' }));

    const record = await databaseQueue.pop('default');
    expect(record).not.toBeNull();

    await worker.process(databaseQueue.decode(record!));
    await databaseQueue.deleteJob(record!.id);

    expect(PersistedJob.values).toEqual(['first']);
  });

  it('processes queued jobs via QueueProcessor', async () => {
    PersistedJob.values = [];
    const connection = new SqliteConnection(':memory:');
    await createJobsTable(connection);

    const registry = new JobRegistry().register(PersistedJob);
    const worker = new QueueWorker(registry);
    const config: QueueConfig = {
      default: 'database',
      connections: {
        database: { driver: 'database', table: 'jobs' },
      },
    };

    const manager = new QueueManager(config, worker, asDatabaseManager(connection));
    const queue = manager.connection('database') as DatabaseQueue;

    await queue.push(new PersistedJob({ value: 'queued' }));

    const processor = new QueueProcessor(manager, registry, worker);
    const processed = await processor.run({
      connection: 'database',
      maxJobs: 1,
      sleepSeconds: 0,
    });

    expect(processed).toBe(1);
    expect(PersistedJob.values).toEqual(['queued']);
  });
});