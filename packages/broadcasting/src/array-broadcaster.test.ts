import { describe, expect, it } from 'vitest';
import { ArrayBroadcaster } from './array-broadcaster.js';

describe('ArrayBroadcaster', () => {
  it('records broadcast payloads', async () => {
    const broadcaster = new ArrayBroadcaster();
    await broadcaster.broadcast({
      event: 'MessageSent',
      channels: ['chat.1'],
      data: { text: 'hi' },
    });

    expect(broadcaster.payloads).toEqual([
      {
        event: 'MessageSent',
        channels: ['chat.1'],
        data: { text: 'hi' },
      },
    ]);
  });
});