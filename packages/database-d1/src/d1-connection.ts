import type { DatabaseConnection, QueryResult } from '@pondoknusa/database';
import { SqliteGrammar, type SqlGrammar } from '@pondoknusa/database';
import {
  isD1BindingConfig,
  type D1ConnectionConfig,
  type D1Database,
  type D1HttpConnectionConfig,
  type D1Meta,
  type D1Result,
} from './types.js';

type RowValue = string | number | bigint | boolean | null | undefined;

const queryKinds = new Map<string, 'read' | 'write'>();

function classifyQuery(sql: string): 'read' | 'write' {
  const cached = queryKinds.get(sql);
  if (cached) {
    return cached;
  }

  const head = sql.trimStart().slice(0, 6).toLowerCase();
  const kind = head === 'select' || head === 'pragma' ? 'read' : 'write';
  queryKinds.set(sql, kind);
  return kind;
}

function normalizeBindings(bindings: RowValue[]): unknown[] {
  return bindings.map((binding) => {
    if (binding === undefined) {
      return null;
    }
    if (typeof binding === 'bigint') {
      return binding.toString();
    }
    return binding;
  });
}

function mapMeta(meta: D1Meta | undefined): Pick<QueryResult, 'changes' | 'lastInsertId'> {
  const changes = meta?.changes ?? meta?.rows_written ?? 0;
  const lastRowId = meta?.last_row_id;
  return {
    changes,
    lastInsertId:
      typeof lastRowId === 'number' && lastRowId > 0 ? lastRowId : undefined,
  };
}

function mapD1Result(result: D1Result): QueryResult {
  if (result.success === false) {
    throw new Error(result.error ?? 'D1 query failed.');
  }

  const { changes, lastInsertId } = mapMeta(result.meta);
  return {
    rows: (result.results ?? []) as Record<string, unknown>[],
    changes,
    lastInsertId,
  };
}

interface D1Backend {
  query(sql: string, bindings: RowValue[]): Promise<QueryResult>;
  exec(sql: string): Promise<void>;
}

class BindingBackend implements D1Backend {
  constructor(private readonly database: D1Database) {}

  async query(sql: string, bindings: RowValue[] = []): Promise<QueryResult> {
    const statement = this.database.prepare(sql).bind(...normalizeBindings(bindings));
    const result =
      classifyQuery(sql) === 'read' ? await statement.all() : await statement.run();
    return mapD1Result(result);
  }

  async exec(sql: string): Promise<void> {
    await this.database.exec(sql);
  }
}

class HttpBackend implements D1Backend {
  constructor(private readonly config: D1HttpConnectionConfig) {}

  async query(sql: string, bindings: RowValue[] = []): Promise<QueryResult> {
    const payload: { sql: string; params?: unknown[] } = { sql };
    const params = normalizeBindings(bindings);
    if (params.length > 0) {
      payload.params = params;
    }

    const results = await this.request(payload);
    const first = results[0];
    if (!first) {
      return { rows: [], changes: 0 };
    }
    return mapD1Result(first);
  }

  async exec(sql: string): Promise<void> {
    await this.request({ sql });
  }

  private async request(body: {
    sql: string;
    params?: unknown[];
  }): Promise<D1Result[]> {
    const { accountId, databaseId, apiToken } = this.config;
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as {
      success?: boolean;
      errors?: Array<{ message?: string }>;
      result?: D1Result[];
    };

    if (!response.ok || payload.success === false) {
      const message =
        payload.errors?.map((error) => error.message).filter(Boolean).join('; ') ||
        `D1 HTTP query failed with status ${response.status}.`;
      throw new Error(message);
    }

    return payload.result ?? [];
  }
}

function createBackend(config: D1ConnectionConfig): D1Backend {
  if (isD1BindingConfig(config)) {
    return new BindingBackend(config.binding);
  }

  if (
    typeof config.accountId === 'string' &&
    typeof config.databaseId === 'string' &&
    typeof config.apiToken === 'string'
  ) {
    return new HttpBackend(config);
  }

  throw new Error(
    'Invalid D1 connection config. Provide either `binding` (Workers) or `accountId`, `databaseId`, and `apiToken` (HTTP).',
  );
}

export class D1Connection implements DatabaseConnection {
  readonly grammar: SqlGrammar = new SqliteGrammar();
  private readonly backend: D1Backend;

  constructor(config: D1ConnectionConfig) {
    this.backend = createBackend(config);
  }

  async query(sql: string, bindings: RowValue[] = []): Promise<QueryResult> {
    return this.backend.query(sql, bindings);
  }

  async exec(sql: string): Promise<void> {
    return this.backend.exec(sql);
  }

  async transaction<T>(
    callback: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    try {
      await this.exec('BEGIN');
    } catch (error) {
      throw new Error(
        `D1 does not support interactive transactions on this backend: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error },
      );
    }

    const nested = new D1TransactionConnection(this.backend);
    try {
      const result = await callback(nested);
      await this.exec('COMMIT');
      return result;
    } catch (error) {
      try {
        await this.exec('ROLLBACK');
      } catch {
        // Preserve the original error; rollback may also fail on auto-commit backends.
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    // D1 bindings and HTTP clients have nothing to tear down.
  }
}

class D1TransactionConnection implements DatabaseConnection {
  readonly grammar: SqlGrammar = new SqliteGrammar();

  constructor(private readonly backend: D1Backend) {}

  async query(sql: string, bindings: RowValue[] = []): Promise<QueryResult> {
    return this.backend.query(sql, bindings);
  }

  async exec(sql: string): Promise<void> {
    return this.backend.exec(sql);
  }

  async transaction<T>(
    callback: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    return callback(this);
  }
}
