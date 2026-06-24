import type { BroadcastingConfig } from './types.js';

export interface EchoClientConfig {
  broadcaster: 'websocket';
  host?: string;
  path?: string;
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

  if (connection.driver === 'websocket') {
    return {
      broadcaster: 'websocket',
      host,
      path: connection.path,
      authEndpoint,
    };
  }

  return null;
}