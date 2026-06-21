import { FileChannel } from './file-channel.js';
import { StackChannel } from './stack-channel.js';
import { StdoutChannel } from './stdout-channel.js';
import type { LogChannel, LogChannelConfig, LogConfig } from './types.js';

export class LogManager {
  private readonly channels = new Map<string, LogChannel>();

  constructor(private readonly config: LogConfig) {}

  channel(name?: string): LogChannel {
    const channelName = name ?? this.config.default;
    const existing = this.channels.get(channelName);
    if (existing) {
      return existing;
    }

    const config = this.config.channels[channelName];
    if (!config) {
      throw new Error(`Log channel [${channelName}] is not configured.`);
    }

    const channel = this.buildChannel(config);
    this.channels.set(channelName, channel);
    return channel;
  }

  private buildChannel(config: LogChannelConfig): LogChannel {
    switch (config.channel) {
      case 'stdout':
        return new StdoutChannel();
      case 'file':
        return new FileChannel(config.path);
      case 'stack':
        return new StackChannel(config.channels, (name) => this.channel(name));
      default:
        throw new Error('Unsupported log channel.');
    }
  }
}