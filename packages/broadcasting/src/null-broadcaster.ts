import type { Broadcaster, BroadcastPayload } from './types.js';

export class NullBroadcaster implements Broadcaster {
  async broadcast(_payload: BroadcastPayload): Promise<void> {}
}