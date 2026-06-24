import type { BroadcastingConfig } from './types.js';

export interface EchoClientConfig {
  broadcaster: 'socketio' | 'pusher';
  key?: string;
  cluster?: string;
  host?: string;
  authEndpoint: string;
}

export function resolveEchoClientConfig(
  config: BroadcastingConfig,
  appUrl: string,
): EchoClientConfig | null {
  const connection = config.connections[config.default];
  if (!connection) {
    return null;
  }

  const authEndpoint = '/broadcasting/auth';
  const host = appUrl.replace(/\/$/, '');

  if (connection.driver === 'pusher' && connection.key) {
    return {
      broadcaster: 'pusher',
      key: connection.key,
      cluster: connection.cluster ?? 'mt1',
      host,
      authEndpoint,
    };
  }

  if (connection.driver === 'socketio') {
    return {
      broadcaster: 'socketio',
      host,
      authEndpoint,
    };
  }

  return null;
}