import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { DebugTimelineEvent } from './types.js';

export class DebugRequestContext {
  readonly id = randomUUID();
  readonly timeline: DebugTimelineEvent[] = [];
  readonly startedAt = performance.now();

  constructor(
    public readonly method: string,
    public readonly path: string,
  ) {}

  record(
    type: DebugTimelineEvent['type'],
    label: string,
    options: { durationMs?: number; metadata?: Record<string, unknown> } = {},
  ): void {
    this.timeline.push({
      type,
      label,
      durationMs: options.durationMs,
      metadata: options.metadata,
      timestamp: performance.now() - this.startedAt,
    });
  }
}

const storage = new AsyncLocalStorage<DebugRequestContext>();

export function getDebugContext(): DebugRequestContext | undefined {
  return storage.getStore();
}

export function runWithDebugContext<T>(
  context: DebugRequestContext,
  callback: () => Promise<T>,
): Promise<T> {
  return storage.run(context, callback);
}

export function recordDebugEvent(
  type: DebugTimelineEvent['type'],
  label: string,
  options: { durationMs?: number; metadata?: Record<string, unknown> } = {},
): void {
  getDebugContext()?.record(type, label, options);
}