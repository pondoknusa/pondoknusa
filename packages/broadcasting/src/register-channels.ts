import type { ChannelRegistry } from './channel-registry.js';
import type { ChannelAuthorizer } from './types.js';

export type ChannelCallback = (registry: ChannelRegistry) => void;

export function registerBroadcastChannels(
  registry: ChannelRegistry,
  callback: ChannelCallback,
): void {
  callback(registry);
}

export function channel(
  pattern: string,
  authorizer: ChannelAuthorizer,
): (registry: ChannelRegistry) => void {
  return (registry) => {
    registry.register(pattern, authorizer);
  };
}