import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DebugJobExecution } from './types.js';

export class DebugCorrelationStore {
  private executions: DebugJobExecution[] = [];

  constructor(
    private readonly maxExecutions: number,
    private readonly persistPath?: string,
  ) {}

  async load(): Promise<void> {
    if (!this.persistPath) {
      return;
    }

    try {
      const raw = await readFile(this.persistPath, 'utf8');
      const parsed = JSON.parse(raw) as DebugJobExecution[];
      if (Array.isArray(parsed)) {
        this.executions = parsed.slice(-this.maxExecutions);
      }
    } catch {
      // No persisted correlations yet.
    }
  }

  record(input: {
    parentRequestId: string;
    job: string;
    queue: string;
    status: DebugJobExecution['status'];
    durationMs: number;
  }): DebugJobExecution {
    const execution: DebugJobExecution = {
      id: randomUUID(),
      parentRequestId: input.parentRequestId,
      job: input.job,
      queue: input.queue,
      status: input.status,
      durationMs: input.durationMs,
      timestamp: Date.now(),
    };

    this.executions.unshift(execution);
    if (this.executions.length > this.maxExecutions) {
      this.executions.length = this.maxExecutions;
    }

    void this.persist();
    return execution;
  }

  getForRequest(requestId: string): DebugJobExecution[] {
    return this.executions.filter((execution) => execution.parentRequestId === requestId);
  }

  all(): DebugJobExecution[] {
    return [...this.executions];
  }

  async clear(): Promise<void> {
    this.executions = [];
    if (!this.persistPath) {
      return;
    }

    await mkdir(dirname(this.persistPath), { recursive: true });
    await writeFile(this.persistPath, '[]\n');
  }

  private async persist(): Promise<void> {
    if (!this.persistPath) {
      return;
    }

    await mkdir(dirname(this.persistPath), { recursive: true });
    await writeFile(this.persistPath, `${JSON.stringify(this.executions, null, 2)}\n`);
  }
}