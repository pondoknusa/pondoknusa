import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { formatLogEntry } from './log-entry.js';
import type { LogChannel, LogContext } from './types.js';

export class FileChannel implements LogChannel {
  constructor(private readonly path: string) {}

  debug(message: string, context?: LogContext): void {
    void this.write('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    void this.write('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    void this.write('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    void this.write('error', message, context);
  }

  private async write(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: LogContext,
  ): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const line = `${formatLogEntry(level, message, context)}\n`;
    await appendFile(this.path, line, 'utf8');
  }
}