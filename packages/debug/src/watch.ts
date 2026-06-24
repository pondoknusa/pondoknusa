import { watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { DebugJobExecution, DebugRequestEntry } from './types.js';

export function formatDebugEntryLine(entry: DebugRequestEntry): string {
  const dispatched = entry.dispatched?.length ?? 0;
  const extra =
    dispatched > 0 ? `, ${dispatched} dispatched` : '';
  return `${entry.method} ${entry.path} → ${entry.status} (${entry.durationMs.toFixed(1)}ms, ${entry.queries.length} queries, ${entry.warnings.length} warnings${extra})`;
}

export function formatDebugExecutionLine(execution: DebugJobExecution): string {
  return `  ↳ ${execution.job} on ${execution.queue} ${execution.status} (${execution.durationMs.toFixed(1)}ms)`;
}

export interface DebugWatchOptions {
  correlationsPath?: string;
  onExecution?: (execution: DebugJobExecution) => void;
}

export interface DebugWatcher {
  close(): void;
}

export function watchDebugEntries(
  persistPath: string,
  onEntry: (entry: DebugRequestEntry) => void,
  options: DebugWatchOptions = {},
): DebugWatcher {
  const seenEntryIds = new Set<string>();
  const seenExecutionIds = new Set<string>();
  let reading = false;
  let pending = false;

  const readEntries = async (): Promise<void> => {
    if (reading) {
      pending = true;
      return;
    }

    reading = true;
    try {
      const raw = await readFile(persistPath, 'utf8');
      const parsed = JSON.parse(raw) as DebugRequestEntry[];
      if (!Array.isArray(parsed)) {
        return;
      }

      for (const entry of [...parsed].reverse()) {
        if (seenEntryIds.has(entry.id)) {
          continue;
        }
        seenEntryIds.add(entry.id);
        onEntry(entry);
      }
    } catch {
      // File may not exist yet.
    } finally {
      reading = false;
      if (pending) {
        pending = false;
        void readEntries();
      }
    }
  };

  const readExecutions = async (): Promise<void> => {
    if (!options.correlationsPath || !options.onExecution) {
      return;
    }

    try {
      const raw = await readFile(options.correlationsPath, 'utf8');
      const parsed = JSON.parse(raw) as DebugJobExecution[];
      if (!Array.isArray(parsed)) {
        return;
      }

      for (const execution of [...parsed].reverse()) {
        if (seenExecutionIds.has(execution.id)) {
          continue;
        }
        seenExecutionIds.add(execution.id);
        options.onExecution(execution);
      }
    } catch {
      // File may not exist yet.
    }
  };

  const refresh = (): void => {
    void readEntries();
    void readExecutions();
  };

  void readEntries();
  void readExecutions();

  const entryWatcher = watch(persistPath, { persistent: true }, refresh);
  const executionWatcher = options.correlationsPath
    ? watch(options.correlationsPath, { persistent: true }, refresh)
    : undefined;

  return {
    close() {
      entryWatcher.close();
      executionWatcher?.close();
    },
  };
}