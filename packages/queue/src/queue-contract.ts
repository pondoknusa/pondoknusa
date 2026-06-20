import type { Job } from './job.js';
import type { SerializedJobPayload } from './types.js';

export interface QueueContract {
  push(job: Job, queue?: string): Promise<string>;
  pushRaw(payload: SerializedJobPayload, queue?: string): Promise<string>;
  later(delaySeconds: number, job: Job, queue?: string): Promise<string>;
}