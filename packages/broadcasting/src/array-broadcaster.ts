import type { BroadcastPayload, Broadcaster } from './types.js';

export class ArrayBroadcaster implements Broadcaster {
  readonly payloads: BroadcastPayload[] = [];

  async broadcast(payload: BroadcastPayload): Promise<void> {
    this.payloads.push(structuredClone(payload));
  }

  clear(): void {
    this.payloads.length = 0;
  }
}