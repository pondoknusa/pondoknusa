import { describe, expect, it } from 'vitest';
import { MysqlGrammar, PostgresGrammar, SqliteGrammar } from '../grammar.js';
import { Blueprint } from './blueprint.js';

describe('Blueprint', () => {
  it('compiles sqlite create table SQL', () => {
    const blueprint = new Blueprint('users', new SqliteGrammar());
    blueprint.id();
    blueprint.string('email');
    blueprint.timestamps();

    expect(blueprint.toCreateSql()).toBe(
      'CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "email" TEXT NOT NULL, "created_at" TEXT NOT NULL, "updated_at" TEXT NOT NULL)',
    );
  });

  it('compiles postgres create table SQL', () => {
    const blueprint = new Blueprint('users', new PostgresGrammar());
    blueprint.id();
    blueprint.string('email');
    blueprint.boolean('active');
    blueprint.timestamp('verified_at').nullable();
    blueprint.timestamps();

    expect(blueprint.toCreateSql()).toBe(
      'CREATE TABLE "users" ("id" BIGSERIAL PRIMARY KEY, "email" VARCHAR(255) NOT NULL, "active" BOOLEAN NOT NULL DEFAULT FALSE, "verified_at" TIMESTAMP(0) WITHOUT TIME ZONE, "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, "updated_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL)',
    );
  });

  it('compiles uuid and ulid primary key columns', () => {
    const sqliteUuid = new Blueprint('devices', new SqliteGrammar());
    sqliteUuid.uuid('id');
    expect(sqliteUuid.toCreateSql()).toContain('"id" TEXT NOT NULL PRIMARY KEY');

    const postgresUuid = new Blueprint('devices', new PostgresGrammar());
    postgresUuid.uuid('id');
    expect(postgresUuid.toCreateSql()).toContain('"id" UUID PRIMARY KEY');

    const mysqlUlid = new Blueprint('sessions', new MysqlGrammar());
    mysqlUlid.ulid('id');
    expect(mysqlUlid.toCreateSql()).toContain('`id` CHAR(26) NOT NULL PRIMARY KEY');
  });

  it('compiles mysql create table SQL', () => {
    const blueprint = new Blueprint('jobs', new MysqlGrammar());
    blueprint.id();
    blueprint.string('queue');
    blueprint.text('payload');
    blueprint.integer('attempts');
    blueprint.integer('reserved_at').nullable();
    blueprint.unique(['queue', 'payload']);

    expect(blueprint.toCreateSql()).toBe(
      'CREATE TABLE `jobs` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `queue` VARCHAR(255) NOT NULL, `payload` TEXT NOT NULL, `attempts` INT NOT NULL, `reserved_at` INT NULL, UNIQUE (`queue`, `payload`))',
    );
  });

  it('uses dialect-specific drop table SQL', () => {
    expect(new Blueprint('users', new PostgresGrammar()).toDropSql()).toBe(
      'DROP TABLE IF EXISTS "users"',
    );
    expect(new Blueprint('users', new MysqlGrammar()).toDropSql()).toBe(
      'DROP TABLE IF EXISTS `users`',
    );
  });
});