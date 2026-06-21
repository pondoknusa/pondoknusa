export type LogContext = Record<string, unknown>;

export interface LogChannel {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

export interface StdoutChannelConfig {
  channel: 'stdout';
}

export interface FileChannelConfig {
  channel: 'file';
  path: string;
}

export interface StackChannelConfig {
  channel: 'stack';
  channels: string[];
}

export type LogChannelConfig =
  | StdoutChannelConfig
  | FileChannelConfig
  | StackChannelConfig;

export interface LogConfig {
  default: string;
  channels: Record<string, LogChannelConfig>;
}