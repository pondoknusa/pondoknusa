export type DriverName = 'sqlite' | 'postgres' | 'mysql';

export interface SqlGrammar {
  readonly driver: DriverName;
  wrapIdentifier(identifier: string): string;
  parameter(index: number): string;
  readonly supportsReturning: boolean;
}

export class SqliteGrammar implements SqlGrammar {
  readonly driver = 'sqlite' as const;
  readonly supportsReturning = false;

  wrapIdentifier(identifier: string): string {
    return `"${identifier.replaceAll('"', '""')}"`;
  }

  parameter(): string {
    return '?';
  }
}

export class PostgresGrammar implements SqlGrammar {
  readonly driver = 'postgres' as const;
  readonly supportsReturning = true;

  wrapIdentifier(identifier: string): string {
    return `"${identifier.replaceAll('"', '""')}"`;
  }

  parameter(index: number): string {
    return `$${index}`;
  }
}

export class MysqlGrammar implements SqlGrammar {
  readonly driver = 'mysql' as const;
  readonly supportsReturning = false;

  wrapIdentifier(identifier: string): string {
    return `\`${identifier.replaceAll('`', '``')}\``;
  }

  parameter(): string {
    return '?';
  }
}