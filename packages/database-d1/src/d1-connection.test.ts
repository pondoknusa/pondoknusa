import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatabaseManager } from '@pondoknusa/database';
import { D1Connection } from './d1-connection.js';
import { registerD1DatabaseDriver } from './register.js';
import type { D1Database, D1PreparedStatement, D1Result } from './types.js';

function createMockBinding(options?: {
  execImpl?: (sql: string) => Promise<void>;
  queryResult?: D1Result;
}): D1Database {
  const result: D1Result = options?.queryResult ?? {
    success: true,
    results: [{ id: 1, name: 'ada' }],
    meta: { changes: 0, last_row_id: 0 },
  };

  const statement: D1PreparedStatement = {
    bind(..._values: unknown[]) {
      return statement;
    },
    async all() {
      return result as D1Result;
    },
    async run() {
      return {
        success: true,
        results: [],
        meta: { changes: 1, last_row_id: 42 },
      } as D1Result;
    },
  };

  return {
    prepare() {
      return statement;
    },
    async exec(sql: string) {
      if (options?.execImpl) {
        await options.execImpl(sql);
        return {};
      }
      return {};
    },
  };
}

describe('D1Connection binding backend', () => {
  it('runs reads via prepare().all() and maps rows', async () => {
    const connection = new D1Connection({
      driver: 'd1',
      binding: createMockBinding(),
    });

    const result = await connection.query('SELECT * FROM users WHERE id = ?', [1]);
    expect(result.rows).toEqual([{ id: 1, name: 'ada' }]);
    expect(result.changes).toBe(0);
  });

  it('runs writes via prepare().run() and maps lastInsertId', async () => {
    const connection = new D1Connection({
      driver: 'd1',
      binding: createMockBinding(),
    });

    const result = await connection.query('INSERT INTO users (name) VALUES (?)', [
      'ada',
    ]);
    expect(result.rows).toEqual([]);
    expect(result.changes).toBe(1);
    expect(result.lastInsertId).toBe(42);
  });

  it('normalizes undefined bindings to null', async () => {
    const binds: unknown[][] = [];
    const binding = createMockBinding();
    const originalPrepare = binding.prepare.bind(binding);
    binding.prepare = (sql: string) => {
      const statement = originalPrepare(sql);
      const originalBind = statement.bind.bind(statement);
      statement.bind = (...values: unknown[]) => {
        binds.push(values);
        return originalBind(...values);
      };
      return statement;
    };

    const connection = new D1Connection({ driver: 'd1', binding });
    await connection.query('INSERT INTO users (name) VALUES (?)', [undefined]);
    expect(binds[0]).toEqual([null]);
  });

  it('commits successful transactions when BEGIN is supported', async () => {
    const calls: string[] = [];
    const connection = new D1Connection({
      driver: 'd1',
      binding: createMockBinding({
        execImpl: async (sql) => {
          calls.push(sql);
        },
      }),
    });

    const value = await connection.transaction(async (tx) => {
      await tx.query('INSERT INTO users (name) VALUES (?)', ['ada']);
      return 'ok';
    });

    expect(value).toBe('ok');
    expect(calls).toEqual(['BEGIN', 'COMMIT']);
  });

  it('throws a clear error when BEGIN is unsupported', async () => {
    const connection = new D1Connection({
      driver: 'd1',
      binding: createMockBinding({
        execImpl: async () => {
          throw new Error('cannot start a transaction within a transaction');
        },
      }),
    });

    await expect(
      connection.transaction(async () => 'never'),
    ).rejects.toThrow(/does not support interactive transactions/i);
  });
});

describe('D1Connection HTTP backend', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('queries via the Cloudflare REST API', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        success: true,
        result: [
          {
            success: true,
            results: [{ id: 7 }],
            meta: { changes: 0, last_row_id: 0 },
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const connection = new D1Connection({
      driver: 'd1',
      accountId: 'acct',
      databaseId: 'db-id',
      apiToken: 'token',
    });

    const result = await connection.query('SELECT * FROM users WHERE id = ?', [7]);

    expect(result.rows).toEqual([{ id: 7 }]);
    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0] as unknown as [
      string,
      { method?: string; headers?: Record<string, string>; body?: string },
    ];
    const [url, init] = call;
    expect(url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acct/d1/database/db-id/query',
    );
    expect(init).toMatchObject({
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
    });
    expect(JSON.parse(String(init.body))).toEqual({
      sql: 'SELECT * FROM users WHERE id = ?',
      params: [7],
    });
  });

  it('surfaces Cloudflare API errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          {
            success: false,
            errors: [{ message: 'Authentication error' }],
          },
          { status: 401 },
        ),
      ),
    );

    const connection = new D1Connection({
      driver: 'd1',
      accountId: 'acct',
      databaseId: 'db-id',
      apiToken: 'bad',
    });

    await expect(connection.query('SELECT 1')).rejects.toThrow(
      'Authentication error',
    );
  });

  it('stringifies bigint bindings for JSON', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        success: true,
        result: [{ success: true, results: [], meta: { changes: 1, last_row_id: 1 } }],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const connection = new D1Connection({
      driver: 'd1',
      accountId: 'acct',
      databaseId: 'db-id',
      apiToken: 'token',
    });

    await connection.query('INSERT INTO users (id) VALUES (?)', [1n]);
    const call = fetchMock.mock.calls[0] as unknown as [
      string,
      { body?: string },
    ];
    expect(JSON.parse(String(call[1].body)).params).toEqual(['1']);
  });
});

describe('registerD1DatabaseDriver', () => {
  it('registers the d1 driver with DatabaseManager', () => {
    registerD1DatabaseDriver();

    const manager = new DatabaseManager(
      {
        default: 'd1',
        connections: {
          d1: {
            driver: 'd1',
            accountId: 'acct',
            databaseId: 'db-id',
            apiToken: 'token',
          },
        },
      },
      process.cwd(),
    );

    const connection = manager.connection();
    expect(connection.grammar.driver).toBe('sqlite');
    expect(connection.query).toBeTypeOf('function');
  });
});
