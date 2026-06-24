import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DebugRequestEntry } from './types.js';

export class DebugStore {
  private entries: DebugRequestEntry[] = [];

  constructor(
    private readonly maxEntries: number,
    private readonly persistPath?: string,
  ) {}

  async load(): Promise<void> {
    if (!this.persistPath) {
      return;
    }

    try {
      const raw = await readFile(this.persistPath, 'utf8');
      const parsed = JSON.parse(raw) as DebugRequestEntry[];
      if (Array.isArray(parsed)) {
        this.entries = parsed.slice(-this.maxEntries);
      }
    } catch {
      // No persisted entries yet.
    }
  }

  push(entry: DebugRequestEntry): void {
    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.length = this.maxEntries;
    }
    void this.persist();
  }

  all(): DebugRequestEntry[] {
    return [...this.entries];
  }

  get(id: string): DebugRequestEntry | undefined {
    return this.entries.find((entry) => entry.id === id);
  }

  async clear(): Promise<void> {
    this.entries = [];
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
    await writeFile(this.persistPath, `${JSON.stringify(this.entries, null, 2)}\n`);
  }
}