import type { Broadcaster, BroadcastPayload } from './types.js';

export class LogBroadcaster implements Broadcaster {
  async broadcast(payload: BroadcastPayload): Promise<void> {
    process.stdout.write(
      `[broadcast] ${payload.event} -> ${payload.channels.join(', ')} ${JSON.stringify(payload.data)}\n`,
    );
  }
}