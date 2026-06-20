import type { DatabaseConnection } from './connection.js';
import { SchemaBuilder } from './schema/schema-builder.js';

export abstract class Migration {
  abstract up(connection: DatabaseConnection, schema: SchemaBuilder): Promise<void>;
  abstract down(connection: DatabaseConnection, schema: SchemaBuilder): Promise<void>;
}

export interface MigrationRecord {
  id: number;
  migration: string;
  batch: number;
  executed_at: string;
}