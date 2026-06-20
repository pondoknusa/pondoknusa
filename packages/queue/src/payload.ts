import type { Job } from './job.js';
import type { SerializedJobPayload } from './types.js';

export function serializeJob(job: Job): SerializedJobPayload {
  return {
    job: job.jobName(),
    data: job.data,
    displayName: job.displayName(),
  };
}

export function encodePayload(payload: SerializedJobPayload): string {
  return JSON.stringify(payload);
}

export function decodePayload(raw: string): SerializedJobPayload {
  const parsed = JSON.parse(raw) as SerializedJobPayload;
  if (!parsed || typeof parsed.job !== 'string' || typeof parsed.data !== 'object') {
    throw new Error('Invalid queue job payload');
  }
  return parsed;
}