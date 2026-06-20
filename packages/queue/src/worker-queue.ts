import type { QueueContract } from './queue-contract.js';
import type { QueueJobRecord, SerializedJobPayload } from './types.js';

export interface WorkerQueue extends QueueContract {
  pop(queue?: string): Promise<QueueJobRecord | null>;
  deleteJob(id: number): Promise<void>;
  release(id: number, delaySeconds?: number): Promise<void>;
  decode(record: QueueJobRecord): SerializedJobPayload;
  getRetryAfter(): number;
}

export function isWorkerQueue(connection: QueueContract): connection is WorkerQueue {
  return (
    'pop' in connection &&
    typeof (connection as WorkerQueue).pop === 'function' &&
    'deleteJob' in connection &&
    typeof (connection as WorkerQueue).deleteJob === 'function'
  );
}