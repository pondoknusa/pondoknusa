import { describe, expect, it } from 'vitest';
import { Echo } from './echo.js';
import { MockConnector } from './connectors/mock.js';

describe('Echo lifecycle', () => {
  it('queues listeners before connect and fires lifecycle callbacks', async () => {
    const connector = new MockConnector();
    const echo = new Echo({ broadcaster: 'null', connector });

    const states: string[] = [];
    echo
      .connected(() => states.push('connected'))
      .disconnected(() => states.push('disconnected'))
      .reconnecting(() => states.push('reconnecting'));

    await connector.connect();

    const payloads: unknown[] = [];
    const channel = echo.channel('orders.1');
    channel.listen('.OrderShipped', (payload) => payloads.push(payload));
    await channel.subscribe();
    connector.emit('orders.1', 'OrderShipped', { id: 42 });

    connector.emitLifecycle('disconnected');
    connector.emitLifecycle('reconnecting');
    await connector.connect();

    expect(states).toContain('connected');
    expect(states).toContain('disconnected');
    expect(states).toContain('reconnecting');
    expect(payloads).toEqual([{ id: 42 }]);
  });
});