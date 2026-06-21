import { LogManager } from './log-manager.js';
import type { LogChannel, LogContext } from './types.js';

export class LogRepository implements LogChannel {
  constructor(
    private readonly manager: LogManager,
    private readonly channelName?: string,
  ) {}

  private channel(): LogChannel {
    return this.manager.channel(this.channelName);
  }

  debug(message: string, context?: LogContext): void {
    this.channel().debug(message, context);
  }

  info(message: string, context?: LogContext): void {
    this.channel().info(message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.channel().warn(message, context);
  }

  error(message: string, context?: LogContext): void {
    this.channel().error(message, context);
  }
}