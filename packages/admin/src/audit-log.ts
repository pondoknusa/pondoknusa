import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export type AdminAuditAction = 'create' | 'update' | 'delete';

export interface AdminAuditEntry {
  id: string;
  timestamp: number;
  resourceKey: string;
  recordId: string | number;
  action: AdminAuditAction;
  actorId?: string | number;
  actorLabel?: string;
  changes: Record<string, { before?: unknown; after?: unknown }>;
}

export interface AdminAuditLoggerOptions {
  maxEntries?: number;
  persistPath?: string;
}

export class AdminAuditLogger {
  private entries: AdminAuditEntry[] = [];

  constructor(private readonly options: AdminAuditLoggerOptions = {}) {}

  async load(): Promise<void> {
    if (!this.options.persistPath) {
      return;
    }

    try {
      const raw = await readFile(this.options.persistPath, 'utf8');
      const parsed = JSON.parse(raw) as AdminAuditEntry[];
      if (Array.isArray(parsed)) {
        this.entries = parsed;
      }
    } catch {
      // No audit log yet.
    }
  }

  async record(entry: Omit<AdminAuditEntry, 'id' | 'timestamp'>): Promise<AdminAuditEntry> {
    const stored: AdminAuditEntry = {
      id: randomUUID(),
      timestamp: Date.now(),
      ...entry,
    };

    this.entries.unshift(stored);
    const maxEntries = this.options.maxEntries ?? 500;
    if (this.entries.length > maxEntries) {
      this.entries.length = maxEntries;
    }

    await this.persist();
    return stored;
  }

  forRecord(resourceKey: string, recordId: string | number, limit = 20): AdminAuditEntry[] {
    return this.entries
      .filter(
        (entry) =>
          entry.resourceKey === resourceKey && String(entry.recordId) === String(recordId),
      )
      .slice(0, limit);
  }

  all(limit = 50): AdminAuditEntry[] {
    return this.entries.slice(0, limit);
  }

  async clear(): Promise<void> {
    this.entries = [];
    await this.persist();
  }

  private async persist(): Promise<void> {
    if (!this.options.persistPath) {
      return;
    }

    await mkdir(dirname(this.options.persistPath), { recursive: true });
    await writeFile(this.options.persistPath, `${JSON.stringify(this.entries, null, 2)}\n`);
  }
}