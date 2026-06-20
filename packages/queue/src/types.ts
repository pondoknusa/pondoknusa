export type QueueDriver = 'sync' | 'database';

export interface SyncQueueConnectionConfig {
  driver: 'sync';
}

export interface DatabaseQueueConnectionConfig {
  driver: 'database';
  table?: string;
  connection?: string;
  retryAfter?: number;
}

export type QueueConnectionConfig =
  | SyncQueueConnectionConfig
  | DatabaseQueueConnectionConfig;

export interface QueueConfig {
  default: string;
  connections: Record<string, QueueConnectionConfig>;
}

export interface SerializedJobPayload {
  job: string;
  data: Record<string, unknown>;
  displayName?: string;
}

export interface QueueJobRecord {
  id: number;
  queue: string;
  payload: string;
  attempts: number;
  reservedAt: number | null;
  availableAt: number;
  createdAt: number;
}