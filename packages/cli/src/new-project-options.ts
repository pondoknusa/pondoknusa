import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { optionString } from './utils.js';

export type DatabaseDriver = 'sqlite' | 'mysql' | 'postgres';
export type QueueDriver = 'database' | 'redis';
export type MailDriver = 'log' | 'smtp' | 'array';

export interface NewProjectOptions {
  database: DatabaseDriver;
  redis: boolean;
  auth: boolean;
  queue: QueueDriver;
  mail: MailDriver;
}

const DATABASE_CHOICES: { value: DatabaseDriver; label: string }[] = [
  { value: 'sqlite', label: 'SQLite (no extra dependencies)' },
  { value: 'mysql', label: 'MySQL (+ @tyravel/database-mysql)' },
  { value: 'postgres', label: 'PostgreSQL (+ @tyravel/database-pg)' },
];

const QUEUE_CHOICES: { value: QueueDriver; label: string }[] = [
  { value: 'database', label: 'Database (uses jobs table, durable)' },
  { value: 'redis', label: 'Redis (requires redis driver)' },
];

const MAIL_CHOICES: { value: MailDriver; label: string }[] = [
  { value: 'log', label: 'Log (writes to log file, no SMTP)' },
  { value: 'smtp', label: 'SMTP (send real emails)' },
  { value: 'array', label: 'Array (in-memory, for testing)' },
];

export async function resolveNewProjectOptions(
  options: Record<string, string | boolean>,
): Promise<NewProjectOptions> {
  const dbFlag = optionString(options, 'db');
  const hasDbFlag = dbFlag !== undefined;
  const hasRedisFlag = options.redis !== undefined || options['no-redis'] === true;
  const hasAuthFlag = options.auth !== undefined || options['no-auth'] === true;
  const hasQueueFlag = optionString(options, 'queue') !== undefined;
  const hasMailFlag = optionString(options, 'mail') !== undefined;

  let database: DatabaseDriver = 'sqlite';
  let redis = false;
  let auth = true;
  let queue: QueueDriver = 'database';
  let mail: MailDriver = 'log';

  if (hasDbFlag) {
    database = parseDatabaseDriver(dbFlag);
  }

  if (options.redis === true) {
    redis = true;
  } else if (options['no-redis'] === true) {
    redis = false;
  }

  if (options['no-auth'] === true) {
    auth = false;
  }

  if (optionString(options, 'queue')) {
    queue = parseQueueDriver(optionString(options, 'queue')!);
  }

  if (optionString(options, 'mail')) {
    mail = parseMailDriver(optionString(options, 'mail')!);
  }

  const interactive = process.stdin.isTTY && process.stdout.isTTY;

  if (interactive && (!hasDbFlag || !hasRedisFlag || !hasAuthFlag || !hasQueueFlag || !hasMailFlag)) {
    const rl = createInterface({ input, output });
    try {
      if (!hasDbFlag) {
        console.log('');
        console.log('Select a database driver:');
        for (const choice of DATABASE_CHOICES) {
          const marker = choice.value === 'sqlite' ? ' (default)' : '';
          console.log(`  ${choice.value}${marker} - ${choice.label}`);
        }
        const answer = (await rl.question('Database [sqlite]: ')).trim();
        database = answer ? parseDatabaseDriver(answer) : 'sqlite';
      }

      if (!hasRedisFlag) {
        const answer = (await rl.question('Use Redis for cache/queue? [y/N]: ')).trim().toLowerCase();
        redis = answer === 'y' || answer === 'yes';
      }

      if (!hasAuthFlag) {
        const answer = (await rl.question('Include authentication scaffold? [Y/n]: ')).trim().toLowerCase();
        auth = answer !== 'n' && answer !== 'no';
      }

      if (!hasQueueFlag) {
        console.log('');
        console.log('Select a queue driver:');
        for (const choice of QUEUE_CHOICES) {
          const marker = choice.value === 'database' ? ' (default)' : '';
          console.log(`  ${choice.value}${marker} - ${choice.label}`);
        }
        const answer = (await rl.question('Queue driver [database]: ')).trim();
        queue = answer ? parseQueueDriver(answer) : 'database';
      }

      if (!hasMailFlag) {
        console.log('');
        console.log('Select a mail driver:');
        for (const choice of MAIL_CHOICES) {
          const marker = choice.value === 'log' ? ' (default)' : '';
          console.log(`  ${choice.value}${marker} - ${choice.label}`);
        }
        const answer = (await rl.question('Mail driver [log]: ')).trim();
        mail = answer ? parseMailDriver(answer) : 'log';
      }
    } finally {
      rl.close();
    }
  }

  return { database, redis, auth, queue, mail };
}

function parseDatabaseDriver(value: string): DatabaseDriver {
  if (value === 'sqlite' || value === 'mysql' || value === 'postgres') {
    return value;
  }
  throw new Error(`Unsupported database driver "${value}". Use sqlite, mysql, or postgres.`);
}

function parseQueueDriver(value: string): QueueDriver {
  if (value === 'database' || value === 'redis') {
    return value;
  }
  throw new Error(`Unsupported queue driver "${value}". Use database or redis.`);
}

function parseMailDriver(value: string): MailDriver {
  if (value === 'log' || value === 'smtp' || value === 'array') {
    return value;
  }
  throw new Error(`Unsupported mail driver "${value}". Use log, smtp, or array.`);
}