import { formatLogEntry } from './log-entry.js';
import type { LogChannel, LogContext } from './types.js';

export class StdoutChannel implements LogChannel {
  debug(message: string, context?: LogContext): void {
    console.debug(formatLogEntry('debug', message, context));
  }

  info(message: string, context?: LogContext): void {
    console.info(formatLogEntry('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(formatLogEntry('warn', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(formatLogEntry('error', message, context));
  }
}