import { redactSensitive } from '@pondoknusa/support';
import type { LogContext } from './types.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

export function formatLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
): string {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = redactSensitive(context) as LogContext;
  }

  return JSON.stringify(entry);
}