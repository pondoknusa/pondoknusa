import type { PayloadCipher } from '@pondoknusa/crypto';
import type { DatabaseConnection } from '@pondoknusa/database';
import { QueryBuilder } from '@pondoknusa/database';
import type { SessionStore } from './session.js';
import type { SessionIntegrity } from './session-integrity.js';

interface SessionsTableRow {
  id: string;
  payload: string;
  last_activity: number;
  [key: string]: unknown;
}

/** Retries when a freshly written session row is not yet visible (e.g. D1 read-after-write lag). */
const READ_ATTEMPTS = 3;
const READ_RETRY_DELAYS_MS = [5, 15] as const;

export class DatabaseSessionStore implements SessionStore {
  constructor(
    private readonly connection: DatabaseConnection,
    private readonly table = 'sessions',
    private readonly cipher?: PayloadCipher,
    private readonly integrity?: SessionIntegrity,
    private readonly lifetimeMinutes = 120,
  ) {}

  async read(id: string): Promise<Record<string, unknown>> {
    for (let attempt = 0; attempt < READ_ATTEMPTS; attempt += 1) {
      const row = await new QueryBuilder<SessionsTableRow>(this.connection, this.table)
        .where('id', id)
        .first();

      if (row) {
        return this.decodeRow(id, row);
      }

      if (attempt < READ_ATTEMPTS - 1) {
        await sleep(READ_RETRY_DELAYS_MS[attempt] ?? 15);
      }
    }

    return {};
  }

  async write(
    id: string,
    data: Record<string, unknown>,
    _lifetimeMinutes: number,
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    let serialized = JSON.stringify(data);
    if (this.integrity) {
      serialized = this.integrity.seal(data);
    }
    const payload = this.cipher ? this.cipher.encrypt(serialized) : serialized;
    const attributes = {
      payload,
      last_activity: now,
    };

    const updated = await new QueryBuilder(this.connection, this.table)
      .where('id', id)
      .update(attributes);

    if (updated > 0) {
      return;
    }

    try {
      await new QueryBuilder(this.connection, this.table).insert({
        id,
        ...attributes,
        user_id: data['auth.user_id'] ?? null,
        ip_address: null,
        user_agent: null,
      });
    } catch (error) {
      if (!isUniqueOrPrimaryKeyConflict(error)) {
        throw error;
      }

      const retried = await new QueryBuilder(this.connection, this.table)
        .where('id', id)
        .update(attributes);

      if (retried === 0) {
        throw error;
      }
    }
  }

  async destroy(id: string): Promise<void> {
    await new QueryBuilder(this.connection, this.table).where('id', id).delete();
  }

  async pruneExpired(lifetimeMinutes: number): Promise<void> {
    const cutoff = Math.floor(Date.now() / 1000) - lifetimeMinutes * 60;
    await new QueryBuilder(this.connection, this.table)
      .where('last_activity', '<', cutoff)
      .delete();
  }

  private async decodeRow(
    id: string,
    row: SessionsTableRow,
  ): Promise<Record<string, unknown>> {
    const cutoff = Math.floor(Date.now() / 1000) - this.lifetimeMinutes * 60;
    if (row.last_activity < cutoff) {
      await this.destroy(id);
      return {};
    }

    try {
      const decoded = this.cipher ? this.cipher.decrypt(row.payload) : row.payload;
      if (this.integrity) {
        return this.integrity.open(decoded) ?? {};
      }
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}

export class MemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, { data: Record<string, unknown>; expiresAt: number }>();

  constructor(
    private readonly integrity?: SessionIntegrity,
    private readonly lifetimeMinutes = 120,
  ) {}

  async read(id: string): Promise<Record<string, unknown>> {
    const entry = this.sessions.get(id);
    if (!entry) {
      return {};
    }

    if (entry.expiresAt <= Math.floor(Date.now() / 1000)) {
      this.sessions.delete(id);
      return {};
    }

    return { ...entry.data };
  }

  async write(
    id: string,
    data: Record<string, unknown>,
    lifetimeMinutes: number,
  ): Promise<void> {
    this.sessions.set(id, {
      data: { ...data },
      expiresAt: Math.floor(Date.now() / 1000) + lifetimeMinutes * 60,
    });
  }

  async destroy(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUniqueOrPrimaryKeyConflict(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toUpperCase();
  const code = String((error as { code?: string }).code ?? '').toUpperCase();

  return (
    message.includes('UNIQUE') ||
    message.includes('PRIMARY KEY') ||
    code.includes('UNIQUE') ||
    code === 'SQLITE_CONSTRAINT' ||
    code === 'SQLITE_CONSTRAINT_PRIMARYKEY'
  );
}
