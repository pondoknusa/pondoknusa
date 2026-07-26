export type DriverName = 'sqlite' | 'postgres' | 'mysql' | 'oracle' | 'mssql';

export interface SqlGrammar {
  readonly driver: DriverName;
  wrapIdentifier(identifier: string): string;
  parameter(index: number): string;
  readonly supportsReturning: boolean;
  compileLimitOffset(limitParam?: string, offsetParam?: string): string;
}

function compileStandardLimitOffset(
  limitParam?: string,
  offsetParam?: string,
): string {
  let sql = '';
  if (limitParam !== undefined) {
    sql += ` LIMIT ${limitParam}`;
  }
  if (offsetParam !== undefined) {
    sql += ` OFFSET ${offsetParam}`;
  }
  return sql;
}

function compileFetchLimitOffset(
  limitParam?: string,
  offsetParam?: string,
): string {
  if (limitParam === undefined && offsetParam === undefined) {
    return '';
  }

  const offset = offsetParam ?? '0';
  let sql = ` OFFSET ${offset} ROWS`;
  if (limitParam !== undefined) {
    sql += ` FETCH NEXT ${limitParam} ROWS ONLY`;
  }
  return sql;
}

export class SqliteGrammar implements SqlGrammar {
  readonly driver = 'sqlite' as const;
  readonly supportsReturning = false;
  private readonly identifierCache = new Map<string, string>();

  wrapIdentifier(identifier: string): string {
    const cached = this.identifierCache.get(identifier);
    if (cached) {
      return cached;
    }

    const wrapped = identifier
      .split('.')
      .map((segment) => `"${segment.replaceAll('"', '""')}"`)
      .join('.');
    this.identifierCache.set(identifier, wrapped);
    return wrapped;
  }

  parameter(): string {
    return '?';
  }

  compileLimitOffset(limitParam?: string, offsetParam?: string): string {
    return compileStandardLimitOffset(limitParam, offsetParam);
  }
}

export class PostgresGrammar implements SqlGrammar {
  readonly driver = 'postgres' as const;
  readonly supportsReturning = true;
  private readonly identifierCache = new Map<string, string>();

  wrapIdentifier(identifier: string): string {
    const cached = this.identifierCache.get(identifier);
    if (cached) {
      return cached;
    }

    const wrapped = identifier
      .split('.')
      .map((segment) => `"${segment.replaceAll('"', '""')}"`)
      .join('.');
    this.identifierCache.set(identifier, wrapped);
    return wrapped;
  }

  parameter(index: number): string {
    return `$${index}`;
  }

  compileLimitOffset(limitParam?: string, offsetParam?: string): string {
    return compileStandardLimitOffset(limitParam, offsetParam);
  }
}

export class MysqlGrammar implements SqlGrammar {
  readonly driver = 'mysql' as const;
  readonly supportsReturning = false;
  private readonly identifierCache = new Map<string, string>();

  wrapIdentifier(identifier: string): string {
    const cached = this.identifierCache.get(identifier);
    if (cached) {
      return cached;
    }

    const wrapped = identifier
      .split('.')
      .map((segment) => `\`${segment.replaceAll('`', '``')}\``)
      .join('.');
    this.identifierCache.set(identifier, wrapped);
    return wrapped;
  }

  parameter(): string {
    return '?';
  }

  compileLimitOffset(limitParam?: string, offsetParam?: string): string {
    return compileStandardLimitOffset(limitParam, offsetParam);
  }
}

export class OracleGrammar implements SqlGrammar {
  readonly driver = 'oracle' as const;
  readonly supportsReturning = false;
  private readonly identifierCache = new Map<string, string>();

  wrapIdentifier(identifier: string): string {
    const cached = this.identifierCache.get(identifier);
    if (cached) {
      return cached;
    }

    const wrapped = identifier
      .split('.')
      .map((segment) => `"${segment.replaceAll('"', '""')}"`)
      .join('.');
    this.identifierCache.set(identifier, wrapped);
    return wrapped;
  }

  parameter(index: number): string {
    return `:${index}`;
  }

  compileLimitOffset(limitParam?: string, offsetParam?: string): string {
    return compileFetchLimitOffset(limitParam, offsetParam);
  }
}

export class MssqlGrammar implements SqlGrammar {
  readonly driver = 'mssql' as const;
  readonly supportsReturning = false;
  private readonly identifierCache = new Map<string, string>();

  wrapIdentifier(identifier: string): string {
    const cached = this.identifierCache.get(identifier);
    if (cached) {
      return cached;
    }

    const wrapped = identifier
      .split('.')
      .map((segment) => `[${segment.replaceAll(']', ']]')}]`)
      .join('.');
    this.identifierCache.set(identifier, wrapped);
    return wrapped;
  }

  parameter(index: number): string {
    return `@p${index}`;
  }

  compileLimitOffset(limitParam?: string, offsetParam?: string): string {
    return compileFetchLimitOffset(limitParam, offsetParam);
  }
}
