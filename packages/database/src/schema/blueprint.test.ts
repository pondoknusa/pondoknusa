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

  it('compiles default values for postgres', () => {
    const blueprint = new Blueprint('users', new PostgresGrammar());
    blueprint.id();
    blueprint.string('role').default('user');
    blueprint.boolean('active').default(true);
    blueprint.integer('attempts').default(3);
    blueprint.string('note').nullable().default('none');

    const sql = blueprint.toCreateSql();
    expect(sql).toContain('"role" VARCHAR(255) DEFAULT \'user\' NOT NULL');
    expect(sql).toContain('"active" BOOLEAN DEFAULT TRUE NOT NULL');
    expect(sql).toContain('"attempts" INTEGER DEFAULT 3 NOT NULL');
    expect(sql).toContain('"note" VARCHAR(255) DEFAULT \'none\'');
  });

  it('compiles default values for mysql', () => {
    const blueprint = new Blueprint('users', new MysqlGrammar());
    blueprint.id();
    blueprint.string('role').default('user');
    blueprint.boolean('active').default(false);
    blueprint.integer('attempts').default(3);

    const sql = blueprint.toCreateSql();
    expect(sql).toContain('`role` VARCHAR(255) DEFAULT \'user\' NOT NULL');
    expect(sql).toContain('`active` TINYINT(1) DEFAULT 0 NOT NULL');
    expect(sql).toContain('`attempts` INT DEFAULT 3 NOT NULL');
  });

  it('compiles default values for sqlite', () => {
    const blueprint = new Blueprint('users', new SqliteGrammar());
    blueprint.id();
    blueprint.string('role').default('user');
    blueprint.boolean('active').default(true);

    const sql = blueprint.toCreateSql();
    expect(sql).toContain('"role" TEXT DEFAULT \'user\' NOT NULL');
    expect(sql).toContain('"active" INTEGER DEFAULT 1 NOT NULL');
  });

  it('escapes single quotes in string defaults', () => {
    const blueprint = new Blueprint('users', new PostgresGrammar());
    blueprint.string('name').default("O'Brien");

    expect(blueprint.toCreateSql()).toContain("DEFAULT 'O''Brien'");
  });

  it('throws when default() is called without a column', () => {
    const blueprint = new Blueprint('users', new PostgresGrammar());
    expect(() => blueprint.default('x')).toThrow(/column definition/);
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