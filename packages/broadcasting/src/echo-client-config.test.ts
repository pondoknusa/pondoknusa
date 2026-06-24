import { describe, expect, it } from 'vitest';
import { resolveEchoClientConfig } from './echo-client-config.js';

describe('resolveEchoClientConfig', () => {
  it('returns null for log and null drivers', () => {
    expect(
      resolveEchoClientConfig(
        { default: 'log', connections: { log: { driver: 'log' } } },
        'http://127.0.0.1:3000',
      ),
    ).toBeNull();

    expect(
      resolveEchoClientConfig(
        { default: 'null', connections: { null: { driver: 'null' } } },
        'http://127.0.0.1:3000',
      ),
    ).toBeNull();
  });

  it('exposes socketio host without secrets', () => {
    expect(
      resolveEchoClientConfig(
        {
          default: 'socketio',
          connections: {
            socketio: {
              driver: 'socketio',
              redisConnection: 'default',
              channel: 'socket.io#/#',
            },
          },
        },
        'http://127.0.0.1:3000/',
      ),
    ).toEqual({
      broadcaster: 'socketio',
      host: 'http://127.0.0.1:3000',
      authEndpoint: '/broadcasting/auth',
    });
  });

  it('exposes pusher key and cluster when configured', () => {
    expect(
      resolveEchoClientConfig(
        {
          default: 'pusher',
          connections: {
            pusher: {
              driver: 'pusher',
              key: 'app-key',
              secret: 'secret',
              appId: '1',
              cluster: 'eu',
            },
          },
        },
        'https://app.example.com',
      ),
    ).toEqual({
      broadcaster: 'pusher',
      key: 'app-key',
      cluster: 'eu',
      host: 'https://app.example.com',
      authEndpoint: '/broadcasting/auth',
    });
  });

  it('returns null when pusher key is missing', () => {
    expect(
      resolveEchoClientConfig(
        {
          default: 'pusher',
          connections: {
            pusher: {
              driver: 'pusher',
              key: '',
              secret: 'secret',
              appId: '1',
            },
          },
        },
        'http://127.0.0.1:3000',
      ),
    ).toBeNull();
  });
});