import type { Job } from './job.js';
import type { QueueContract } from './queue-contract.js';

export class Dispatcher {
  constructor(private readonly queue: QueueContract) {}

  dispatch(job: Job, queue?: string): Promise<string> {
    return this.queue.push(job, queue);
  }

  dispatchLater(delaySeconds: number, job: Job, queue?: string): Promise<string> {
    return this.queue.later(delaySeconds, job, queue);
  }
}