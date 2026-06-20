import type { Container } from '@tyravel/container';
import type { JobRegistry } from './registry.js';
import type { SerializedJobPayload } from './types.js';

export interface QueueWorkerOptions {
  maxAttempts?: number;
}

export class QueueWorker {
  constructor(
    private readonly registry: JobRegistry,
    private readonly container?: Container,
    private readonly options: QueueWorkerOptions = {},
  ) {}

  async process(payload: SerializedJobPayload): Promise<void> {
    const job = this.registry.create(payload.job, payload.data);
    if (this.container) {
      await this.container.call(job.handle.bind(job));
      return;
    }
    await job.handle();
  }

  getMaxAttempts(): number {
    return this.options.maxAttempts ?? 3;
  }
}