import type { LogChannel, LogContext } from './types.js';

export class StackChannel implements LogChannel {
  constructor(
    private readonly channelNames: string[],
    private readonly resolve: (name: string) => LogChannel,
  ) {}

  debug(message: string, context?: LogContext): void {
    for (const name of this.channelNames) {
      this.resolve(name).debug(message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    for (const name of this.channelNames) {
      this.resolve(name).info(message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    for (const name of this.channelNames) {
      this.resolve(name).warn(message, context);
    }
  }

  error(message: string, context?: LogContext): void {
    for (const name of this.channelNames) {
      this.resolve(name).error(message, context);
    }
  }
}